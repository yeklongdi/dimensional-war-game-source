import { describe, expect, it } from 'vitest';
import { reduceBattle } from '../game/battle/battle.js';
import { sequence } from '../game/battle/dice.js';
import { resolveMovePath } from '../game/battle/move-path.js';
import { battleToken, getUnit } from '../game/battle/state-helpers.js';
import type { AbilityCommand } from '../game/battle/types.js';
import { openEncounter } from '../game/loop/encounters.js';
import { startLoop } from '../game/loop/progress.js';
import type { ClassId, FighterBuild } from '../game/loop/types.js';
import { command, nextActor, patchUnit } from './battle-helpers.js';

function duel(classId: ClassId, dice: number[], hp?: number, fighter?: FighterBuild) {
  const loop = startLoop(0);
  const hero = { ...loop.hero, classId, fighter: fighter ?? loop.hero.fighter,
    hp: hp ?? (classId === 'fighter' ? 11 : classId === 'monk' ? 10 : 7) };
  const battle = openEncounter({ ...loop, hero, rng: sequence([20, 1, ...dice]),
    items: { healing_potion: 1, missile_scroll: 1, acid: 1 } }, 'boss', false, 4);
  return patchUnit(battle, 'demo_enemy', { position: { col: 1, row: 2 } });
}
const ability = (id: AbilityCommand['ability'], target?: string): AbilityCommand =>
  ({ kind: 'ability', actor: 'hero', ability: id, target });

describe('回合内职业能力与消耗品', () => {
  it('武僧能在主动作前附赠徒手，采用序幕后武艺骰', () => {
    const before = duel('monk', [18, 6]);
    const next = command(before, { kind: 'attack', actor: 'hero', target: 'demo_enemy', attackId: 'unarmed', resource: 'bonus' });
    expect(getUnit(next, 'hero')?.resources).toMatchObject({ bonus: false, action: true });
    expect(getUnit(next, 'demo_enemy')?.hp).toBe(8);
    expect(getUnit(before, 'demo_enemy')?.hp).toBe(16);
  });

  it('战士回气为附赠动作，精通削弱只影响敌人的下一次攻击', () => {
    let battle = duel('fighter', [4, 17, 1, 19, 5, 19], 5);
    battle = command(battle, ability('second_wind'));
    expect(getUnit(battle, 'hero')).toMatchObject({ hp: 10, ac: 17, resources: { bonus: false, action: true } });
    expect(battle.loop?.hero.wind).toBe(1);
    battle = command(battle, { kind: 'attack', actor: 'hero', target: 'demo_enemy', attackId: 'longsword', resource: 'action' });
    battle = command(battle, { kind: 'end', actor: 'hero' });
    battle = command(battle, { kind: 'attack', actor: 'demo_enemy', target: 'hero', attackId: 'drill_strike', resource: 'action' }, 'ai');
    expect(battle.log.findLast(event => event.kind === 'attack')).toMatchObject({ disadvantages: ['削弱'], hit: false, roll: { dice: [19, 5] } });
    expect(battle.timed?.some(effect => effect.kind === 'sap')).toBe(false);
  });

  it('短剑侵扰使同一战士对原目标的下一击有优势', () => {
    let battle = duel('fighter', [18, 1, 2, 17, 2], undefined,
      { style: 'dueling', weapon: 'shortsword', mastery: ['shortsword', 'javelin', 'shortbow'] });
    const attack = { kind: 'attack', actor: 'hero', target: 'demo_enemy', attackId: 'shortsword', resource: 'action' } as const;
    battle = command(battle, attack);
    battle = nextActor(command(battle, { kind: 'end', actor: 'hero' }), 'hero');
    battle = command(battle, attack);
    expect(battle.log.findLast(event => event.kind === 'attack')).toMatchObject({ advantages: ['侵扰'], roll: { dice: [2, 17] } });
  });

  it('标枪缓速在施加者下回合开始时结束', () => {
    let battle = duel('fighter', [18, 1], undefined,
      { style: 'defense', weapon: 'javelin', mastery: ['longsword', 'javelin', 'shortbow'] });
    battle = command(battle, { kind: 'attack', actor: 'hero', target: 'demo_enemy', attackId: 'javelin', resource: 'action' });
    battle = command(battle, { kind: 'end', actor: 'hero' });
    expect(getUnit(battle, 'demo_enemy')?.resources.movement).toBe(15);
    battle = command(battle, { kind: 'end', actor: 'demo_enemy' }, 'ai');
    battle = command(battle, { kind: 'end', actor: 'hero' });
    expect(getUnit(battle, 'demo_enemy')?.resources.movement).toBe(25);
  });

  it('法师护甲与药水可用同一回合的不同动作并正确扣资源', () => {
    let battle = duel('wizard', [2, 3], 2);
    battle = command(battle, ability('mage_armor'));
    expect(getUnit(battle, 'hero')).toMatchObject({ ac: 15, resources: { action: false, bonus: true } });
    expect(battle.loop?.hero.wizardSlots).toBe(1);
    battle = command(battle, ability('healing_potion', 'hero'));
    expect(getUnit(battle, 'hero')).toMatchObject({ hp: 7, resources: { bonus: false } });
    expect(battle.loop?.items.healing_potion).toBe(0);
  });

  it('术士先天术法为附赠动作，按魅力计算优势和法术命中', () => {
    let battle = duel('sorcerer', [2, 16, 4]);
    battle = command(battle, ability('innate_sorcery'));
    battle = command(battle, ability('shocking_grasp', 'demo_enemy'));
    expect(battle.loop?.hero.innate).toBe(1);
    expect(battle.loop?.hero.sorcererSlots).toBe(2);
    expect(battle.log.findLast(event => event.kind === 'attack')).toMatchObject({ advantages: ['先天术法'], bonus: 4, hit: true });
  });

  it('卷轴消耗背包物品并保留法术位，普通法术使用法术位', () => {
    let battle = duel('wizard', [1, 2, 3, 1, 2, 3]);
    battle = command(battle, ability('missile_scroll', 'demo_enemy'));
    expect(battle.loop?.items.missile_scroll).toBe(0);
    expect(battle.loop?.hero.wizardSlots).toBe(2);
    battle = command(battle, { kind: 'end', actor: 'hero' });
    battle = nextActor(battle, 'hero');
    battle = command(battle, ability('magic_missile', 'demo_enemy'));
    expect(battle.loop?.hero.wizardSlots).toBe(1);
    expect(battle.result?.outcome).toBe('win');
  });

  it('投掷物先校验距离、动作和阵营，合法后掷豁免并扣件数', () => {
    const before = duel('monk', [4, 4, 1]);
    const invalid = reduceBattle(before, { token: battleToken(before), origin: 'player', command: ability('acid', 'hero') });
    expect(invalid.state).toBe(before);
    const next = command(before, ability('acid', 'demo_enemy'));
    expect(next.loop?.items.acid).toBe(0);
    expect(getUnit(next, 'demo_enemy')?.hp).toBe(8);
    expect(next.log.find(event => event.kind === 'ability-save')).toMatchObject({ dc: 12, success: false });
  });

  it('金发青年可飞越箱格并使用原卡治疗额度', () => {
    const loop = startLoop(0);
    const created = openEncounter({ ...loop, hero: { ...loop.hero, hp: 2 }, rng: sequence([1, 1, 20, 1, 1, 1, 1]) }, 'first', true, 7);
    const link = getUnit(created, 'link')!;
    const crate = { col: 3, row: 2 }, land = { col: 4, row: 2 };
    expect(resolveMovePath(created, link, land, [{ col: 2, row: 2 }, crate, land]).reason).toBe('');
    expect(resolveMovePath(created, link, crate, [{ col: 2, row: 2 }, crate]).reason).toContain('空地');
    const healed = command(created, { kind: 'ability', actor: 'link', ability: 'divine_aid', target: 'hero' });
    expect(healed.loop?.divineAid).toBe(2);
    expect(getUnit(healed, 'hero')?.hp).toBe(10);
  });
});
