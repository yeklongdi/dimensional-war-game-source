import { describe, expect, it } from 'vitest';
import { die, rollD20, rollDamage, seeded, sequence } from '../game/battle/dice.js';
import { applyDamage, attackContext, attackRoll, deathSave } from '../game/battle/rules.js';
import { initiative } from '../game/battle/initiative.js';
import { getUnit } from '../game/battle/state-helpers.js';
import { battleFor, patchUnit } from './battle-helpers.js';

describe('骰子与可复现随机数', () => {
  it('Mulberry32 seed=42 固定输出，输入 RNG 不变', () => {
    const initial = seeded(42); let rng = initial;
    const values = Array.from({ length: 8 }, () => { const result = die(20, rng); rng = result.rng; return result.value; });
    expect(values).toEqual([13, 9, 18, 14, 4, 11, 6, 13]);
    expect(initial).toEqual(seeded(42));
    expect(rng.draws).toBe(8);
    expect(die(20, seeded(0)).value).toBeGreaterThanOrEqual(1);
  });
  it('优势/劣势保留两骰及采用值，两者抵消只投一骰', () => {
    expect(rollD20(sequence([3, 18]), true).roll).toEqual({ dice: [3, 18], chosen: 18, mode: 'advantage' });
    expect(rollD20(sequence([3, 18]), false, true).roll.chosen).toBe(3);
    expect(rollD20(sequence([3]), true, true).rng.draws).toBe(1);
    const result = attackRoll(sequence([12]), 4, 16, ['甲', '乙'], ['丙']);
    expect(result).toMatchObject({ hit: true, total: 16, roll: { dice: [12], mode: 'normal' } });
  });
  it.each([[1, 99, 1, false, false], [20, -99, 99, true, true], [10, 4, 14, true, false]] as const)('天然值与加值 %s', (raw, bonus, ac, hit, critical) => {
    expect(attackRoll(sequence([raw]), bonus, ac)).toMatchObject({ hit, critical });
  });
  it('伤害表达式与重击仅翻倍骰子数量，固定加值一次', () => {
    expect(rollDamage('1d4+2', sequence([3])).roll.total).toBe(5);
    expect(rollDamage('2d6+2', sequence([1, 2, 3, 4]), true).roll).toMatchObject({ dice: [1, 2, 3, 4], modifier: 2, total: 12, critical: true });
    expect(rollDamage('1d6-2', sequence([1])).roll.total).toBe(0);
    expect(() => rollDamage('invalid', seeded(1))).toThrow();
    expect(() => die(4, sequence([20]))).toThrow();
  });
});

describe('攻击上下文与伤害', () => {
  it('4/12格射程在12格仍合法，13格拒绝；天然1不因昏迷近身变成命中', () => {
    const initial = battleFor();
    const grid = { width: 14, height: 1, tiles: Array.from({ length: 14 }, () => 'floor' as const) };
    const b = { ...getUnit(initial, 'black_b')!, position: { col: 0, row: 0 } };
    const hero = { ...getUnit(initial, 'hero')!, position: { col: 12, row: 0 } };
    const state = { ...initial, grid, units: [b, hero] };
    expect(attackContext(state, b, hero, b.attacks[1]!)).toMatchObject({ legal: true, disadvantages: ['超过常规射程'] });
    expect(attackContext(state, b, { ...hero, position: { col: 13, row: 0 } }, b.attacks[1]!).legal).toBe(false);
    expect(attackRoll(sequence([1]), 99, 1, [], [], true)).toMatchObject({ hit: false, critical: false });
  });
  it('射程常规/最大、近身劣势及墙体分别检查', () => {
    let state = battleFor(); const b = getUnit(state, 'black_b')!, hero = getUnit(state, 'hero')!, attack = b.attacks[1]!;
    expect(attackContext(state, b, hero, attack)).toMatchObject({ legal: true, disadvantages: ['超过常规射程'] });
    state = patchUnit(state, 'black_a', { position: { col: 5, row: 4 } });
    expect(attackContext(state, getUnit(state, 'hero')!, getUnit(state, 'black_a')!, { ...attack, range: { normal: 4, max: 4 } }).reason).toBe('目标超出射程');
    const closeHero = { ...hero, position: { col: 5, row: 4 } };
    const close = { ...state, units: state.units.map(unit => unit.id === 'hero' ? closeHero : unit) };
    expect(attackContext(close, b, closeHero, attack).disadvantages).toContain('近身敌人');
    const wall = { ...state, grid: { width: 3, height: 1, tiles: ['floor', 'wall', 'floor'] as const } };
    expect(attackContext({ ...wall, grid: { ...wall.grid, tiles: [...wall.grid.tiles] } }, { ...b, position: { col: 0, row: 0 } }, { ...hero, position: { col: 2, row: 0 } }, attack).reason).toBe('墙体阻挡攻击线');
  });
  it('回避与昏迷带来相反来源，5尺内昏迷命中按重击', () => {
    const state = battleFor(); const hero = getUnit(state, 'hero')!, a = getUnit(state, 'black_a')!;
    const target = { ...a, position: { col: 1, row: 2 }, status: 'unconscious' as const, resources: { ...a.resources, dodging: true } };
    const context = attackContext(state, hero, target, hero.attacks[0]!);
    expect(context.advantages).toEqual(['目标昏迷']); expect(context.disadvantages).toEqual(['目标回避']);
    expect(attackRoll(sequence([12]), 4, 12, context.advantages, context.disadvantages, true)).toMatchObject({ hit: true, critical: true });
  });
  it('免疫优先；抗性向下取整后易伤；临时HP优先且不改原单位', () => {
    const unit = { ...getUnit(battleFor(), 'hero')!, tempHp: 3, resistances: ['fire'] as const, vulnerabilities: ['fire'] as const };
    const mutable = { ...unit, resistances: [...unit.resistances], vulnerabilities: [...unit.vulnerabilities] };
    const result = applyDamage(mutable, 9, 'fire');
    expect(result.report).toMatchObject({ adjusted: 8, tempBefore: 3, tempAfter: 0, hpBefore: 10, hpAfter: 5 });
    expect(mutable.hp).toBe(10); expect(mutable.tempHp).toBe(3);
    expect(applyDamage({ ...mutable, immunities: ['fire'] }, 99, 'fire').unit.hp).toBe(10);
    expect(applyDamage(mutable, 100, 'slashing').unit).toMatchObject({ hp: 0, status: 'unconscious', prone: true, saves: { failures: 0 } });
    expect(applyDamage(getUnit(battleFor(), 'black_a')!, 100, 'slashing').unit.status).toBe('defeated');
  });
  it('零血正伤害累计失败，重击两次；免疫/零伤害不记，临时HP不免除失败', () => {
    const unit = { ...getUnit(battleFor(), 'hero')!, hp: 0, tempHp: 5, status: 'unconscious' as const };
    const once = applyDamage(unit, 1, 'slashing').unit;
    expect(once).toMatchObject({ hp: 0, tempHp: 4, saves: { failures: 1 } });
    expect(applyDamage(once, 1, 'slashing', true).unit.status).toBe('dead');
    expect(applyDamage(unit, 0, 'slashing', true).unit.saves.failures).toBe(0);
    expect(applyDamage({ ...unit, immunities: ['slashing'] }, 20, 'slashing', true).unit.saves.failures).toBe(0);
  });
});

describe('先攻与死亡豁免', () => {
  it('总值、敏捷原值、玩家、同阵营稳定次序依次比较', () => {
    const [hero, a, b] = battleFor().units;
    const result = initiative([a!, b!, { ...hero!, abilities: { ...hero!.abilities, dex: 12 } }], sequence([10, 10, 10]));
    expect(result.order.map(item => item.actor)).toEqual(['hero', 'black_a', 'black_b']);
    expect(initiative([a!, hero!], sequence([11, 10])).order[0]?.actor).toBe('hero');
    expect(initiative([a!, hero!], sequence([20, 1])).order[0]?.actor).toBe('black_a');
  });
  it.each([[1, 2, 0], [9, 1, 0], [10, 0, 1], [19, 0, 1]] as const)('死亡豁免 d20=%s', (raw, failures, successes) => {
    const unit = { ...getUnit(battleFor(), 'hero')!, hp: 0, status: 'unconscious' as const, prone: true };
    const result = deathSave(unit, sequence([raw]));
    expect(result.unit.saves).toEqual({ failures, successes }); expect(unit.saves).toEqual({ successes: 0, failures: 0 });
  });
  it('天然20恢复1HP并清状态、三成功稳定、三失败死亡', () => {
    const unit = { ...getUnit(battleFor(), 'hero')!, hp: 0, status: 'unconscious' as const, prone: true, saves: { successes: 2, failures: 2 } };
    expect(deathSave(unit, sequence([20])).unit).toMatchObject({ hp: 1, status: 'active', prone: false, saves: { successes: 0, failures: 0 } });
    expect(deathSave(unit, sequence([10])).unit.status).toBe('stable');
    expect(deathSave(unit, sequence([2])).unit.status).toBe('dead');
  });
});
