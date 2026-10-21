import { describe, expect, it } from 'vitest';
import { assembleCombatants, combatants, debugBattle, getBattleDefinition } from '../game/battle/definitions.js';
import { createBattle, reduceBattle } from '../game/battle/battle.js';
import { seeded, sequence } from '../game/battle/dice.js';
import { battleToken, currentUnit, getUnit } from '../game/battle/state-helpers.js';
import { applyDamage } from '../game/battle/rules.js';
import { updateTutorial } from '../game/battle/tutorial.js';
import { command, finishMovement, patchUnit } from './battle-helpers.js';
import { simulate } from './battle-simulation.js';
import m2Replay from '../../docs/verification/m2/rule-replays.json';
import { startTurn } from '../game/battle/turn.js';

describe('M3正式数据与装备隔离', () => {
  it('三个定义按id查找，调试场保持原图与原配置', () => {
    expect(debugBattle).toEqual({ id: 'battle_debug_core', title: 'M2 · 战棋核心调试场', map: ['.......', '..X....', 'H...X..', '.....E.', '......E'], spawnOrder: ['hero', 'black_a', 'black_b'] });
    expect(getBattleDefinition('battle_prologue_tutorial').id).toBe('battle_prologue_tutorial');
    expect(getBattleDefinition('battle_black_humanoid').map[3]).toBe('...B...');
    expect(() => getBattleDefinition('missing')).toThrow();
  });
  it('男高、甲乙的批准值不变，第一幕武器是独立装配副本', () => {
    const source = JSON.stringify(combatants);
    const definition = getBattleDefinition('battle_black_humanoid');
    const equipped = assembleCombatants(definition), hero = equipped[0]!;
    expect(hero).toMatchObject({ abilities: { int: null }, ac: 14, maxHp: 10, speed: 30 });
    expect(hero.attacks).toEqual([
      { id: 'master_sword', name: '大师之剑', kind: 'melee', bonus: 4, damage: '1d8+2', damageType: 'slashing', reach: 1, martial: true, finesse: true, magical: true },
      { id: 'unarmed', name: '徒手', kind: 'melee', bonus: 4, damage: '1d4+2', damageType: 'bludgeoning', reach: 1, martial: true },
    ]);
    hero.attacks[0]!.bonus = 99;
    expect(JSON.stringify(combatants)).toBe(source);
    for (const id of ['battle_prologue_tutorial', 'battle_debug_core']) expect(assembleCombatants(getBattleDefinition(id))[0]!.attacks.map(attack => attack.id)).toEqual(['unarmed']);
    expect(combatants.find(unit => unit.id === 'black_a')).toMatchObject({ ac: 12, maxHp: 6, speed: 30, attacks: [{ bonus: 2, damage: '1d6' }], features: [] });
  });
  it('黑色人形能力原值有来源，批准抗性无物理抗性、无额外幽影特性', () => {
    const shadow = combatants.find(unit => unit.id === 'black_humanoid')!;
    expect(shadow).toEqual({ id: 'black_humanoid', name: '黑色人形', team: 'enemy', abilities: { str: 6, dex: 14, con: 13, int: 6, wis: 10, cha: 8 }, ac: 12, maxHp: 16, speed: 40,
      attacks: [{ id: 'claw', name: '爪击', kind: 'melee', bonus: 4, damage: '2d6+2', damageType: 'necrotic', reach: 1 }], features: [], resistances: ['acid', 'cold', 'fire', 'lightning', 'thunder'], immunities: ['necrotic', 'poison'], vulnerabilities: ['radiant'] });
    const unit = createBattle(getBattleDefinition('battle_black_humanoid'), assembleCombatants(getBattleDefinition('battle_black_humanoid')), seeded(42)).units[1]!;
    expect(applyDamage(unit, 7, 'slashing').report.adjusted).toBe(7);
    expect(applyDamage(unit, 7, 'fire').report.adjusted).toBe(3);
    expect(applyDamage(unit, 7, 'necrotic').report.adjusted).toBe(0);
    expect(applyDamage(unit, 7, 'radiant').report.adjusted).toBe(14);
  });
  it('第一幕开场前临时HP=5、原最大HP10；首个行动前只授予一次', () => {
    const definition = getBattleDefinition('battle_black_humanoid');
    const initial = createBattle(definition, assembleCombatants(definition), seeded(42));
    expect(getUnit(initial, 'hero')).toMatchObject({ hp: 10, maxHp: 10, tempHp: 5, position: { col: 0, row: 2 } });
    expect(getUnit(initial, 'black_humanoid')!.position).toEqual({ col: 3, row: 3 });
    expect(initial.log[0]).toMatchObject({ kind: 'temp-hp', amount: 5 });
    expect(reduceBattle(initial, { token: battleToken(initial), origin: 'player', command: { kind: 'move', actor: 'hero', to: { col: 1, row: 2 } } }).state).toBe(initial);
    const ready = command(initial, { kind: 'finish-opening' }, 'system');
    expect(ready.log).toEqual(initial.log); expect(getUnit(ready, 'hero')!.tempHp).toBe(5);
    expect(reduceBattle(ready, { token: battleToken(ready), origin: 'system', command: { kind: 'finish-opening' } }).state).toBe(ready);
    expect(applyDamage(getUnit(ready, 'hero')!, 7, 'necrotic').unit).toMatchObject({ hp: 8, tempHp: 0, maxHp: 10 });
  });
  it('大师之剑动作和借机采用主手，附赠仍为独立徒手', () => {
    const definition = getBattleDefinition('battle_black_humanoid');
    let state = createBattle(definition, assembleCombatants(definition), sequence([20, 1, 12, 2, 12, 3]), 1,
      { hero: { col: 1, row: 2 }, black_humanoid: { col: 2, row: 2 } });
    state = command(state, { kind: 'finish-opening' }, 'system');
    expect(reduceBattle(state, { token: battleToken(state), origin: 'player', command: { kind: 'attack', actor: 'hero', target: 'black_humanoid', attackId: 'unarmed', resource: 'action' } }).state).toBe(state);
    state = command(state, { kind: 'attack', actor: 'hero', target: 'black_humanoid', attackId: 'master_sword', resource: 'action' });
    state = command(state, { kind: 'attack', actor: 'hero', target: 'black_humanoid', attackId: 'unarmed', resource: 'bonus' });
    expect(state.log.filter(event => event.kind === 'damage').map(event => event.kind === 'damage' ? event.roll.expression : '')).toEqual(['1d8+2', '1d4+2']);
    expect(state.log.filter(event => event.kind === 'attack').map(event => event.kind === 'attack' ? event.bonus : 0)).toEqual([4, 4]);
    state = patchUnit(state, 'hero', { resources: { ...getUnit(state, 'hero')!.resources, reaction: true, martialAttack: false } });
    state = startTurn({ ...state, turnIndex: state.order.findIndex(entry => entry.actor === 'black_humanoid'), rng: sequence([12, 2]) });
    state = command(state, { kind: 'move', actor: 'black_humanoid', to: { col: 4, row: 2 } }, 'ai');
    state = command(state, { kind: 'step' }, 'system');
    expect(state.pendingReaction).toBeDefined();
    state = command(state, { kind: 'react', take: true });
    expect(state.log.findLast(event => event.kind === 'attack')).toMatchObject({ attack: '大师之剑', source: 'reaction' });
    expect(getUnit(state, 'hero')!.resources.martialAttack).toBe(false);
  });
  it('M2 seed42原合法重放仍为第3轮10HP、17次骰子，日志与既有记录相同', () => {
    const result = simulate(42).state;
    expect(result.log).toEqual(m2Replay.attack42.log);
    expect(result).toMatchObject({ round: 3, rng: { draws: 17 }, result: { outcome: 'win' } });
    expect(getUnit(result, 'hero')!.hp).toBe(10);
  });
});

describe('序幕教学事件', () => {
  it('只在真实可移动/可攻击/完成攻击动作时各一次，查询不重复，调试场不开启', () => {
    const definition = getBattleDefinition('battle_prologue_tutorial');
    let state = createBattle(definition, assembleCombatants(definition), sequence([20, 1, 1, 1]));
    expect(state.tutorial!.seen).toEqual([]);
    state = command(state, { kind: 'inspire', dieIndex: null });
    expect(currentUnit(state).id).toBe('hero'); expect(state.tutorial!.seen).toEqual(['move']);
    expect(updateTutorial(state)).toBe(state);
    state = finishMovement(command(state, { kind: 'move', actor: 'hero', to: { col: 4, row: 3 } }));
    expect(state.tutorial!.seen).toEqual(['move', 'attack']);
    state = command(state, { kind: 'attack', actor: 'hero', target: 'black_a', attackId: 'unarmed', resource: 'action' });
    expect(state.pendingRoll?.kind).toBe('attack');
    expect(state.tutorial!.seen).toEqual(['move', 'attack']);
    state = command(state, { kind: 'inspire', dieIndex: null });
    expect(state.tutorial!.seen).toEqual(['move', 'attack', 'bonus']);
    expect(updateTutorial(state)).toBe(state);
    expect(state.log.filter(event => event.kind === 'tutorial')).toHaveLength(3);
    expect(createBattle(debugBattle, combatants, seeded(42)).tutorial).toBeUndefined();
  });
});
