import { describe, expect, it } from 'vitest';
import { createBattle, reduceBattle } from '../game/battle/battle.js';
import { assembleCombatants, getBattleDefinition } from '../game/battle/definitions.js';
import { sequence } from '../game/battle/dice.js';
import { battleToken, getUnit } from '../game/battle/state-helpers.js';
import { startTurn } from '../game/battle/turn.js';
import { command, finishMovement, patchUnit } from './battle-helpers.js';

function inspired(dice: number[] = [], enemyFirst = false) {
  const definition = getBattleDefinition('battle_prologue_tutorial');
  return createBattle(definition, assembleCombatants(definition), sequence([...(enemyFirst ? [1, 20, 1] : [20, 1, 1]), ...dice]), 1,
    { hero: { col: 1, row: 2 }, black_a: { col: 2, row: 2 }, black_b: { col: 6, row: 4 } });
}
describe('英雄激励按5eTools单颗重掷', () => {
  it('先攻原骰等待期间不开始回合；替换必须采用更差的新骰后重新排序', () => {
    const initial = inspired([1]);
    expect(initial.pendingRoll?.kind).toBe('initiative'); expect(initial.log.some(event => event.kind === 'turn')).toBe(false);
    const state = command(initial, { kind: 'inspire', dieIndex: 0 });
    expect(state.inspiration).toEqual({ hero: 0 });
    expect(state.order.find(entry => entry.actor === 'hero')).toMatchObject({ roll: { dice: [1], chosen: 1 }, total: 3 });
    expect(state.rng.draws).toBe(4);
    expect(state.log.find(event => event.kind === 'inspiration')).toMatchObject({ original: [20], replacement: 1, adopted: [1], remaining: 0 });
  });
  it('放弃不耗资源不掷骰，非法位置/越权与重复响应不耗RNG', () => {
    const initial = inspired([10]);
    for (const dieIndex of [-1, 1, NaN]) expect(reduceBattle(initial, { token: battleToken(initial), origin: 'player', command: { kind: 'inspire', dieIndex } }).state).toBe(initial);
    expect(reduceBattle(initial, { token: battleToken(initial), origin: 'ai', command: { kind: 'inspire', dieIndex: 0 } }).state).toBe(initial);
    const token = battleToken(initial), next = command(initial, { kind: 'inspire', dieIndex: null });
    expect(next.rng).toEqual(initial.rng); expect(next.inspiration!.hero).toBe(1);
    expect(reduceBattle(next, { token, origin: 'player', command: { kind: 'inspire', dieIndex: 0 } }).state).toBe(next);
    expect(reduceBattle(next, { token: battleToken(next), origin: 'player', command: { kind: 'inspire', dieIndex: 0 } }).state).toBe(next);
  });
  it('动作攻击先耗动作但不应用伤害；重掷命中后只结算一次', () => {
    let state = command(inspired([1, 15, 2]), { kind: 'inspire', dieIndex: null });
    state = command(state, { kind: 'attack', actor: 'hero', target: 'black_a', attackId: 'unarmed', resource: 'action' });
    expect(state.pendingRoll).toMatchObject({ kind: 'attack', roll: { dice: [1] } });
    expect(getUnit(state, 'black_a')!.hp).toBe(6);
    expect(getUnit(state, 'hero')!.resources).toMatchObject({ action: false, martialAttack: true });
    const before = state, token = battleToken(state);
    expect(reduceBattle(before, { token, origin: 'player', command: { kind: 'end', actor: 'hero' } }).state).toBe(before);
    state = command(state, { kind: 'inspire', dieIndex: 0 });
    expect(getUnit(state, 'black_a')!.hp).toBe(2); expect(state.rng.draws).toBe(6);
    expect(state.log.filter(event => event.kind === 'damage')).toHaveLength(1);
    expect(reduceBattle(state, { token, origin: 'player', command: { kind: 'inspire', dieIndex: 0 } }).state).toBe(state);
  });
  it('伤害骰也可重掷，原伤害未应用；重新求和而不是回滚已发生的伤害', () => {
    let state = command(inspired([15, 1, 4]), { kind: 'inspire', dieIndex: null });
    state = command(state, { kind: 'attack', actor: 'hero', target: 'black_a', attackId: 'unarmed', resource: 'action' });
    state = command(state, { kind: 'inspire', dieIndex: null });
    expect(state.pendingRoll).toMatchObject({ kind: 'damage', roll: { dice: [1], total: 3 } });
    expect(getUnit(state, 'black_a')!.hp).toBe(6);
    state = command(state, { kind: 'inspire', dieIndex: 0 });
    expect(getUnit(state, 'black_a')).toMatchObject({ hp: 0, status: 'defeated' });
    expect(state.log.find(event => event.kind === 'damage')).toMatchObject({ roll: { dice: [4], modifier: 2, total: 6 } });
  });
  it('重击的多个伤害骰也只替换指定一颗，加值不重掷', () => {
    let state = command(inspired([20, 1, 2, 4]), { kind: 'inspire', dieIndex: null });
    state = command(state, { kind: 'attack', actor: 'hero', target: 'black_a', attackId: 'unarmed', resource: 'action' });
    state = command(state, { kind: 'inspire', dieIndex: null });
    expect(state.pendingRoll).toMatchObject({ kind: 'damage', roll: { dice: [1, 2], critical: true } });
    state = command(state, { kind: 'inspire', dieIndex: 1 });
    expect(state.log.find(event => event.kind === 'damage')).toMatchObject({ roll: { dice: [1, 4], total: 7 } });
  });
  it.each(['advantage', 'disadvantage'] as const)('%s仅重掷选中的一颗，保留原取值规则', mode => {
    let state = command(inspired([18, 2, 1]), { kind: 'inspire', dieIndex: null });
    const target = getUnit(state, 'black_a')!;
    state = patchUnit(state, 'black_a', mode === 'advantage' ? { status: 'unconscious', hp: 0 } : { resources: { ...target.resources, dodging: true } });
    state = command(state, { kind: 'attack', actor: 'hero', target: 'black_a', attackId: 'unarmed', resource: 'action' });
    expect(state.pendingRoll).toMatchObject({ kind: 'attack', roll: { dice: [18, 2], mode } });
    state = command(state, { kind: 'inspire', dieIndex: 0 });
    expect(state.log.find(event => event.kind === 'attack')).toMatchObject({ roll: { dice: [1, 2], chosen: mode === 'advantage' ? 2 : 1, mode }, hit: false });
  });
  it('死亡豁免在决定前不计失败，重掷20苏醒，本回合正常操作', () => {
    let state = command(inspired([1, 20]), { kind: 'inspire', dieIndex: null });
    state = patchUnit(state, 'hero', { hp: 0, status: 'unconscious', prone: true });
    state = startTurn(state);
    expect(state.pendingRoll?.kind).toBe('death-save'); expect(getUnit(state, 'hero')!.saves.failures).toBe(0);
    state = command(state, { kind: 'inspire', dieIndex: 0 });
    expect(getUnit(state, 'hero')).toMatchObject({ hp: 1, status: 'active', prone: false, saves: { failures: 0, successes: 0 }, resources: { action: true } });
    expect(state.awaitingEnd).toBe(false);
  });
  it('借机攻击可使用激励，暂停路径；击败移动者后不继续路径或解锁附赠', () => {
    let state = command(inspired([13, 20, 2, 2], true), { kind: 'inspire', dieIndex: null });
    state = command(state, { kind: 'move', actor: 'black_a', to: { col: 4, row: 3 } }, 'ai');
    state = command(state, { kind: 'step' }, 'system');
    state = command(state, { kind: 'react', take: true });
    expect(state.pendingRoll).toMatchObject({ kind: 'attack', source: 'reaction' });
    expect(getUnit(state, 'black_a')!.position).toEqual({ col: 2, row: 2 });
    expect(reduceBattle(state, { token: battleToken(state), origin: 'system', command: { kind: 'step' } }).state).toBe(state);
    state = command(state, { kind: 'inspire', dieIndex: 0 });
    state = finishMovement(state);
    expect(getUnit(state, 'black_a')).toMatchObject({ hp: 0, status: 'defeated', position: { col: 2, row: 2 } });
    expect(state.pendingMove).toBeUndefined(); expect(getUnit(state, 'hero')!.resources.martialAttack).toBe(false);
  });
});
