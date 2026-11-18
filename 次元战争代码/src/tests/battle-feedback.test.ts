import { afterEach, describe, expect, it, vi } from 'vitest';
import { sequence } from '../game/battle/dice.js';
import { elementOf, feedbackCues, styleOf } from '../game/battle/feedback.js';
import { FeedbackTimeline } from '../game/battle/feedback-timeline.js';
import { sfxFor } from '../game/battle/feedback-sfx.js';
import type { AbilityCommand, BattleEvent, BattleState, DamageReport } from '../game/battle/types.js';
import { BattleFx } from '../game/ui/battle-fx.js';
import { openEncounter } from '../game/loop/encounters.js';
import { startLoop } from '../game/loop/progress.js';
import type { ClassId } from '../game/loop/types.js';
import { battleFor, command, nextActor, patchUnit } from './battle-helpers.js';

/** 序幕后的演示遭遇：英雄与一名近身敌人；可追加金发青年。 */
function encounter(classId: ClassId, dice: number[], withLink = false) {
  const loop = startLoop(0);
  const hero = { ...loop.hero, classId };
  const battle = openEncounter({ ...loop, hero, rng: sequence([20, 1, ...dice]), items: { healing_potion: 1, missile_scroll: 1, acid: 1 } }, 'first', withLink, 3);
  return patchUnit(battle, 'demo_enemy', { position: withLink ? { col: 2, row: 2 } : { col: 1, row: 2 } });
}
const attackCmd = { kind: 'attack', actor: 'hero', target: 'black_a', attackId: 'unarmed', resource: 'action' } as const;
const abilityCmd = (id: AbilityCommand['ability'], extra: Partial<AbilityCommand> = {}): AbilityCommand =>
  ({ kind: 'ability', actor: 'hero', ability: id, ...extra });
const cuesOf = (state: BattleState) => feedbackCues(state, state.log);
const strikes = (state: BattleState) => cuesOf(state).filter(cue => cue.kind === 'impact' || cue.kind === 'swing');

describe('打击类型来自结构化来源', () => {
  it('徒手、法术、远程武器与魔法近战武器各自归类', () => {
    expect(styleOf('unarmed', 'melee')).toBe('fist');
    expect(styleOf('fire_bolt', 'ranged')).toBe('spell');
    expect(styleOf('magic_missile', 'ranged')).toBe('spell');
    expect(styleOf('flying_sword', 'melee')).toBe('melee');
    expect(styleOf('flying_sword_ranged', 'ranged')).toBe('ranged');
    expect(styleOf('longsword', 'melee')).toBe('melee');
    expect(styleOf('shortbow', 'ranged')).toBe('ranged');
  });

  it('伤害类型映射到表现元素，物理三系合并', () => {
    expect(elementOf('slashing')).toBe('physical');
    expect(elementOf('force')).toBe('force');
    expect(elementOf('fire')).toBe('fire');
  });
});

describe('攻击命中与未命中', () => {
  it('徒手命中只产生一次挥击与一次冲击，数字等于结算后伤害', () => {
    const before = battleFor([18, 3]);
    const after = command(patchUnit(before, 'black_a', { position: { col: 1, row: 2 } }), attackCmd);
    const report = after.log.findLast(event => event.kind === 'damage');
    expect(report).toBeDefined();
    const cues = strikes(after);
    expect(cues.map(cue => cue.kind)).toEqual(['swing', 'impact']);
    expect(cues[0]).toMatchObject({ style: 'fist', hit: true });
    expect(cues[1]).toMatchObject({ style: 'fist', element: 'physical', amount: report?.kind === 'damage' ? report.report.adjusted : -1, critical: false });
  });

  it('未命中只有挥击，不生成冲击或伤害数字', () => {
    const after = command(patchUnit(battleFor([2, 1]), 'black_a', { position: { col: 1, row: 2 } }), attackCmd);
    expect(after.log.some(event => event.kind === 'damage')).toBe(false);
    expect(strikes(after)).toEqual([expect.objectContaining({ kind: 'swing', hit: false })]);
  });

  it('天然 20 的冲击带重击标记，并触发震屏音效', () => {
    const after = command(patchUnit(battleFor([20, 2, 2]), 'black_a', { position: { col: 1, row: 2 } }), attackCmd);
    const impact = cuesOf(after).find(cue => cue.kind === 'impact');
    expect(impact).toMatchObject({ kind: 'impact', critical: true });
    expect(impact && sfxFor(impact)).toBe('fx_crit');
  });
});

describe('法术豁免、减免与多段结算', () => {
  it('酸液飞溅豁免成功不产生任何冲击；豁免失败逐目标依次播放', () => {
    const safe = patchUnit(encounter('sorcerer', [1, 3, 20, 20, 20], true), 'demo_enemy', { abilities: { str: 10, dex: 30, con: 10, int: 10, wis: 10, cha: 10 } });
    const none = command(safe, abilityCmd('acid_splash', { point: { col: 2, row: 2 } }));
    expect(none.log.some(event => event.kind === 'damage')).toBe(false);
    expect(strikes(none).some(cue => cue.kind === 'impact')).toBe(false);

    const failed = command(encounter('sorcerer', [1, 1, 1, 1, 1], true), abilityCmd('acid_splash', { point: { col: 2, row: 2 } }));
    const impacts = cuesOf(failed).filter(cue => cue.kind === 'impact');
    expect(impacts).toHaveLength(2);
    expect(impacts.map(cue => cue.kind === 'impact' && cue.target)).toEqual(failed.log.filter(event => event.kind === 'damage').map(event => event.kind === 'damage' && event.target));
    expect(impacts.map(cue => cue.amount)).toEqual(failed.log.filter(event => event.kind === 'damage').map(event => event.kind === 'damage' && event.report.adjusted));
    expect([...impacts.map(cue => cue.seq)].sort((a, b) => a - b)).toEqual(impacts.map(cue => cue.seq));
  });

  it('燃烧之手豁免成功仍减半，数字随实际结算', () => {
    const after = patchUnit(encounter('wizard', [3, 1, 1, 15]), 'demo_enemy', { abilities: { str: 10, dex: 30, con: 10, int: 10, wis: 10, cha: 10 } });
    const cast = command(after, abilityCmd('burning_hands', { point: { col: 1, row: 2 } }));
    const impact = cuesOf(cast).find(cue => cue.kind === 'impact');
    const save = cast.log.find(event => event.kind === 'ability-save');
    const report = cast.log.findLast(event => event.kind === 'damage');
    expect(save).toMatchObject({ kind: 'ability-save', success: true });
    expect(report).toBeDefined();
    expect(report?.kind === 'damage' && report.report.adjusted).toBe(2);
    expect(impact).toMatchObject({ kind: 'impact', element: 'fire', reduction: 'half_save', amount: report?.kind === 'damage' ? report.report.adjusted : -1 });
  });

  it('魔法飞弹三发按事件顺序逐发播放', () => {
    const cast = command(encounter('wizard', [1, 1, 1]), abilityCmd('magic_missile', { target: 'demo_enemy' }));
    const impacts = cuesOf(cast).filter(cue => cue.kind === 'impact');
    expect(impacts).toHaveLength(3);
    expect(impacts.every(cue => cue.style === 'spell' && cue.element === 'force' && cue.amount >= 2 && cue.amount <= 5)).toBe(true);
    expect(impacts.map(cue => cue.seq)).toEqual([...impacts.map(cue => cue.seq)].sort((a, b) => a - b));
  });
});

describe('治疗与防护不使用受击表现', () => {
  it('治疗只产生治疗指令，目标为受疗者', () => {
    const hurt = patchUnit(encounter('wizard', [1, 1]), 'hero', { hp: 3 });
    const healed = command(hurt, abilityCmd('healing_potion', { target: 'hero' }));
    const cues = cuesOf(healed);
    expect(cues.filter(cue => cue.kind === 'impact' || cue.kind === 'swing')).toEqual([]);
    expect(cues.filter(cue => cue.kind === 'heal')).toHaveLength(1);
    expect(cues.find(cue => cue.kind === 'heal')).toMatchObject({ kind: 'heal', target: 'hero' });
  });

  it('金发青年治疗男高时表现落在受疗者身上', () => {
    const loop = startLoop(0);
    const created = openEncounter({ ...loop, hero: { ...loop.hero, hp: 2 }, rng: sequence([1, 1, 20, 1, 1, 1, 1]) }, 'first', true, 7);
    const healed = command(created, { kind: 'ability', actor: 'link', ability: 'divine_aid', target: 'hero' });
    // 施法起手事件没有 target，只有实际结算事件生成一条治疗指令，不出现 +0 重复。
    const heals = cuesOf(healed).filter(cue => cue.kind === 'heal');
    expect(heals).toHaveLength(1);
    expect(heals[0]).toMatchObject({ kind: 'heal', target: 'hero' });
    expect(heals[0] && heals[0].kind === 'heal' ? heals[0].amount : 0).toBeGreaterThan(0);
  });

  it('法师护甲与虚假生命走防护指令', () => {
    const warded = cuesOf(command(encounter('wizard', [3]), abilityCmd('mage_armor')));
    expect(warded.filter(cue => cue.kind === 'impact')).toEqual([]);
    expect(warded.some(cue => cue.kind === 'ward')).toBe(true);
    const life = cuesOf(command(encounter('wizard', [3, 3, 3]), abilityCmd('false_life')));
    expect(life.find(cue => cue.kind === 'ward')).toMatchObject({ kind: 'ward', target: 'hero' });
  });
});

describe('攻击类型只在当前动作内关联', () => {
  it('同一对单位先近战再施放魔法飞弹，飞弹仍按法术播放', () => {
    let state = encounter('wizard', [18, 3, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1]);
    state = patchUnit(state, 'demo_enemy', { maxHp: 60, hp: 60 });
    const struck = command(state, { kind: 'attack', actor: 'hero', target: 'demo_enemy', attackId: 'dagger', resource: 'action' });
    expect(strikes(struck)).toEqual([expect.objectContaining({ kind: 'swing', style: 'melee' }), expect.objectContaining({ kind: 'impact', style: 'melee', target: 'demo_enemy' })]);

    const cast = command(nextActor(command(struck, { kind: 'end', actor: 'hero' }), 'hero'), abilityCmd('magic_missile', { target: 'demo_enemy' }));
    const onEnemy = cuesOf(cast).filter(cue => cue.kind === 'impact' && cue.target === 'demo_enemy');
    // 第一条是上一动作的近战伤害，其余都是本次飞弹，必须重新归类为法术。
    expect(onEnemy[0]).toMatchObject({ style: 'melee' });
    const missiles = onEnemy.slice(1);
    expect(missiles.length).toBeGreaterThan(0);
    expect(missiles.every(cue => cue.kind === 'impact' && cue.style === 'spell' && cue.element === 'force')).toBe(true);
  });
});

describe('同一次攻击的附加伤害沿用攻击类型', () => {
  const withLink = (dice: number[], session: number) => {
    const loop = startLoop(0);
    const battle = openEncounter({ ...loop, rng: sequence([20, 1, ...dice]) }, 'first', true, session);
    return patchUnit(battle, 'demo_enemy', { maxHp: 200, hp: 200 });
  };

  it('远程凌空剑的两条伤害（武器与光耀附加）都按远程播放', () => {
    const battle = withLink([15, 15, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2], 9);
    const struck = command(nextActor(battle, 'link'), { kind: 'attack', actor: 'link', target: 'demo_enemy', attackId: 'flying_sword_ranged', resource: 'action' });
    const damage = struck.log.filter(event => event.kind === 'damage');
    expect(damage).toHaveLength(2);
    const impacts = cuesOf(struck).filter(cue => cue.kind === 'impact');
    expect(impacts).toHaveLength(2);
    expect(impacts.map(cue => cue.kind === 'impact' && cue.element)).toEqual(['physical', 'radiant']);
    expect(impacts.every(cue => cue.kind === 'impact' && cue.style === 'ranged')).toBe(true);
  });

  it('凌空剑未命中只有一次挥击，不产生任何冲击或附加伤害数字', () => {
    // 先攻序列 [20, 1] 之后还需金发青年的先攻骰与一次天然 1（必失手）的攻击骰。
    const battle = withLink([1, 1], 10);
    const struck = command(nextActor(battle, 'link'), { kind: 'attack', actor: 'link', target: 'demo_enemy', attackId: 'flying_sword_ranged', resource: 'action' });
    expect(struck.log.some(event => event.kind === 'damage')).toBe(false);
    const cues = cuesOf(struck);
    expect(cues).toEqual([expect.objectContaining({ kind: 'swing', style: 'ranged', hit: false })]);
    expect(cues.some(cue => cue.kind === 'impact')).toBe(false);
  });
});

describe('减免标记以结算报告为准', () => {
  const report: DamageReport = { raw: 8, adjusted: 4, modifiers: ['抗性'], hpBefore: 16, hpAfter: 12, tempBefore: 0, tempAfter: 0, failureAdded: 0 };
  const base: BattleEvent = { kind: 'attack', seq: 1, round: 1, actor: 'hero', target: 'black_a', attack: '徒手', attackId: 'unarmed', attackKind: 'melee',
    damageType: 'bludgeoning', source: 'action', roll: { dice: [18], chosen: 18, mode: 'normal' }, bonus: 4, total: 22, ac: 12, cover: 0,
    advantages: [], disadvantages: [], hit: true, critical: false };
  const damage = (patch: Partial<DamageReport>, seq = 2): BattleEvent =>
    ({ kind: 'damage', seq, round: 1, actor: 'hero', target: 'black_a', damageType: 'bludgeoning', report: { ...report, ...patch },
      roll: { expression: '1d4+2', dice: [3], sides: 4, modifier: 2, total: 5, critical: false } });
  const impactOf = (state: BattleState, events: BattleEvent[]) => feedbackCues(state, events).find(cue => cue.kind === 'impact');

  it('抗性、免疫、易伤与临时 HP 吸收分别标记', () => {
    const base0 = battleFor([]);
    expect(impactOf(base0, [base, damage({})])).toMatchObject({ reduction: 'none', absorbed: 0 });
    expect(impactOf(patchUnit(base0, 'black_a', { resistances: ['bludgeoning'] }), [base, damage({})])).toMatchObject({ reduction: 'resisted' });
    expect(impactOf(patchUnit(base0, 'black_a', { immunities: ['bludgeoning'] }), [base, damage({ adjusted: 0 })])).toMatchObject({ reduction: 'immune', amount: 0 });
    expect(impactOf(patchUnit(base0, 'black_a', { vulnerabilities: ['bludgeoning'] }), [base, damage({ adjusted: 12 })])).toMatchObject({ reduction: 'vulnerable' });
    expect(impactOf(base0, [base, damage({ tempBefore: 5, tempAfter: 0, adjusted: 0 })])).toMatchObject({ absorbed: 5 });
  });
});

describe('表现层不改变结算与随机数', () => {
  it('同一输入下反馈只读取事件，重复计算不触碰状态、骰子与位置', () => {
    const after = command(patchUnit(battleFor([18, 3]), 'black_a', { position: { col: 1, row: 2 } }), attackCmd);
    const snapshot = JSON.stringify(after);
    const first = cuesOf(after);
    const second = cuesOf(after);
    expect(first).toEqual(second);
    expect(JSON.stringify(after)).toBe(snapshot);
    expect(after.rng.draws).toBe(JSON.parse(snapshot).rng.draws);
  });
});

describe('表现时间轴', () => {
  const cue = (seq: number) => ({ kind: 'impact' as const, seq, actor: 'hero', target: 'black_a', style: 'fist' as const, element: 'physical' as const,
    amount: 3, absorbed: 0, critical: false, reduction: 'none' as const });

  it('按 seq 去重，重复提交与重渲染不重播', () => {
    const timeline = new FeedbackTimeline();
    timeline.begin(1);
    expect(timeline.take([cue(1), cue(2)])).toHaveLength(2);
    expect(timeline.take([cue(1), cue(2)])).toHaveLength(0);
    expect(timeline.take([cue(2), cue(3)])).toHaveLength(1);
  });

  it('新战斗与显式 reset 重新从头播放，延迟不跨批次累积', () => {
    const timeline = new FeedbackTimeline();
    timeline.begin(1);
    timeline.take([cue(1)]);
    const first = timeline.take([cue(2)]);
    const second = timeline.take([cue(3)]);
    expect(first.map(item => item.delay)).toEqual([34]);
    expect(second.map(item => item.delay)).toEqual([34]);
    timeline.begin(2);
    expect(timeline.take([cue(1)])).toHaveLength(1);
    timeline.reset();
    expect(timeline.take([cue(1)])).toHaveLength(1);
  });

  it('减少动态效果时压缩间隔', () => {
    const timeline = new FeedbackTimeline(() => true);
    timeline.begin(1);
    expect(timeline.take([cue(1)]).map(item => item.delay)).toEqual([20]);
  });
});

describe('音效映射与播放', () => {
  it('按指令选择本地音效 id', () => {
    expect(sfxFor({ kind: 'swing', seq: 1, actor: 'a', target: 'b', style: 'fist', element: 'physical', hit: true, critical: false })).toBe('fx_punch');
    expect(sfxFor({ kind: 'swing', seq: 1, actor: 'a', target: 'b', style: 'melee', element: 'physical', hit: false, critical: false })).toBe('fx_whiff');
    expect(sfxFor({ kind: 'swing', seq: 1, actor: 'a', target: 'b', style: 'ranged', element: 'physical', hit: true, critical: false })).toBe('fx_arrow');
    expect(sfxFor({ kind: 'swing', seq: 1, actor: 'a', target: 'b', style: 'spell', element: 'fire', hit: true, critical: false })).toBe('fx_cast');
    expect(sfxFor({ kind: 'impact', seq: 2, actor: 'a', target: 'b', style: 'spell', element: 'cold', amount: 4, absorbed: 0, critical: false, reduction: 'none' })).toBe('fx_frost');
    expect(sfxFor({ kind: 'save', seq: 3, target: 'b', success: true })).toBe('fx_save');
    expect(sfxFor({ kind: 'heal', seq: 4, target: 'b', amount: 3 })).toBe('fx_heal');
    expect(sfxFor({ kind: 'down', seq: 5, target: 'b', status: 'unconscious' })).toBe('fx_down');
  });

  afterEach(() => vi.unstubAllGlobals());
  it('挂载不回放历史，之后的新事件只播放一次且重渲染不重播', () => {
    const played: string[] = [];
    const timers: (() => void)[] = [];
    const flush = () => timers.splice(0).forEach(run => run());
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }),
      setTimeout: (run: () => void) => { timers.push(run); return timers.length; }, clearTimeout: () => { timers.length = 0; } });
    vi.stubGlobal('requestAnimationFrame', () => 1);
    vi.stubGlobal('cancelAnimationFrame', () => {});
    const layer = { width: 672, height: 480, getContext: () => null } as unknown as HTMLCanvasElement;
    const base = { style: { transform: '' } } as unknown as HTMLCanvasElement;
    const fx = new BattleFx(layer, base, id => played.push(id));
    const battle = command(patchUnit(battleFor([18, 3]), 'black_a', { position: { col: 1, row: 2 } }), attackCmd);
    fx.sync({ ...battle, log: [] });
    fx.sync(battle);
    flush();
    expect(played).toEqual(['fx_punch', 'fx_blade']);
    fx.sync(battle);
    flush();
    expect(played).toHaveLength(2);
    fx.dispose();
    fx.sync(battle);
    flush();
    expect(played).toHaveLength(2);
  });
});

describe('表现层生命周期', () => {
  afterEach(() => vi.unstubAllGlobals());
  const layer = () => ({ width: 672, height: 480, getContext: () => null }) as unknown as HTMLCanvasElement;
  const base = () => ({ style: { transform: '' } }) as unknown as HTMLCanvasElement;
  const stubWindow = (matches: boolean) => {
    const queue: { id: number; run: () => void; canceled: boolean }[] = [];
    let nextId = 1;
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches }),
      document: { documentElement: { dataset: {} as Record<string, string> } },
      setTimeout: (run: () => void) => { const id = nextId++; queue.push({ id, run, canceled: false }); return id; },
      clearTimeout: (id: number) => { const item = queue.find(entry => entry.id === id); if (item) item.canceled = true; },
    });
    vi.stubGlobal('requestAnimationFrame', () => 1);
    vi.stubGlobal('cancelAnimationFrame', () => {});
    return { queue, flush: () => { for (const item of queue.splice(0)) if (!item.canceled) item.run(); } };
  };
  const hit = () => command(patchUnit(battleFor([18, 3]), 'black_a', { position: { col: 1, row: 2 } }), attackCmd);

  it('初次挂载与换战斗都不回放既有事件', () => {
    const { flush } = stubWindow(true);
    const played: string[] = [];
    const fx = new BattleFx(layer(), base(), id => played.push(id));
    fx.sync(hit());
    flush();
    expect(played).toEqual([]);

    const resumed = { ...hit(), session: 42 };
    fx.sync(resumed);
    flush();
    expect(played).toEqual([]);
    fx.dispose();
  });

  it('换战斗时取消上一场排队中的特效与音效', () => {
    const timers = stubWindow(true);
    const played: string[] = [];
    const fx = new BattleFx(layer(), base(), id => played.push(id));
    const battle = hit();
    fx.sync({ ...battle, log: [] });
    fx.sync(battle);
    expect(played).toEqual(['fx_punch']);
    expect(timers.queue.length).toBeGreaterThan(0);

    fx.sync({ ...battle, session: battle.session + 1, log: [] });
    expect(timers.queue.every(item => item.canceled)).toBe(true);
    timers.flush();
    expect(played).toEqual(['fx_punch']);
    fx.dispose();
  });

  it('命中后顿帧与受击后仰真实作用在棋子上，且顿帧内姿态不变', () => {
    const timers = stubWindow(false);
    let clock = 1000;
    vi.stubGlobal('performance', { now: () => clock });
    const fx = new BattleFx(layer(), base(), () => {});
    const battle = hit();
    fx.sync({ ...battle, log: [] });
    fx.sync(battle);
    timers.flush();

    const frozen = fx.reactions(clock)?.get('black_a');
    expect(frozen).toBeDefined();
    expect(frozen).toMatchObject({ dx: 0, dy: 0, squash: 1 });
    expect(frozen?.flash).toBeGreaterThan(0.5);

    clock += 95;
    const recoiled = fx.reactions(clock)?.get('black_a');
    expect(recoiled).toBeDefined();
    expect(Math.hypot(recoiled!.dx, recoiled!.dy)).toBeGreaterThan(3);
    expect(recoiled!.squash).toBeLessThan(0.95);
    fx.dispose();
  });
});
