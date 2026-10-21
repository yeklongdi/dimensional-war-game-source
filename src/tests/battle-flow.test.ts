import { describe, expect, it } from 'vitest';
import { createBattle, reduceBattle } from '../game/battle/battle.js';
import { combatants, debugBattle } from '../game/battle/definitions.js';
import { sequence } from '../game/battle/dice.js';
import { reduceDebugGame, startDebugGame } from '../game/battle/debug-state.js';
import { opportunityEligible } from '../game/battle/rules.js';
import { battleToken, currentUnit, getUnit } from '../game/battle/state-helpers.js';
import { battleFor, command, finishMovement, nextActor, patchUnit } from './battle-helpers.js';

const close = { hero: { col: 0, row: 2 }, black_a: { col: 1, row: 2 }, black_b: { col: 6, row: 4 } };

describe('回合资源和非法操作', () => {
  it('未命中也解锁附赠徒手，两个资源各一次；非法操作完全不变', () => {
    const initial = battleFor([1, 20, 1, 2], close);
    const old = JSON.stringify(initial);
    const missed = command(initial, { kind: 'attack', actor: 'hero', target: 'black_a', attackId: 'unarmed', resource: 'action' });
    expect(getUnit(missed, 'hero')!.resources).toMatchObject({ action: false, bonus: true, martialAttack: true });
    const bonus = command(missed, { kind: 'attack', actor: 'hero', target: 'black_a', attackId: 'unarmed', resource: 'bonus' });
    expect(getUnit(bonus, 'hero')!.resources.bonus).toBe(false);
    const denied = reduceBattle(bonus, { token: battleToken(bonus), origin: 'player', command: { kind: 'attack', actor: 'hero', target: 'black_a', attackId: 'unarmed', resource: 'bonus' } });
    expect(denied.state).toBe(bonus); expect(denied.events).toEqual([]); expect(JSON.stringify(initial)).toBe(old);
  });
  it('攻击前后均可移动，按每步扣5尺而非强制阶段', () => {
    let state = battleFor([12, 1], { ...close, black_a: { col: 2, row: 2 } });
    state = finishMovement(command(state, { kind: 'move', actor: 'hero', to: { col: 1, row: 2 } }));
    state = command(state, { kind: 'attack', actor: 'hero', target: 'black_a', attackId: 'unarmed', resource: 'action' });
    state = finishMovement(command(state, { kind: 'move', actor: 'hero', to: { col: 1, row: 3 } }));
    expect(getUnit(state, 'hero')!.resources).toMatchObject({ movement: 20, action: false, bonus: true });
    expect(getUnit(state, 'hero')!.position).toEqual({ col: 1, row: 3 });
  });
  it.each(['dash', 'disengage', 'dodge'] as const)('%s 消耗动作而不解锁附赠', kind => {
    const next = command(battleFor(), { kind, actor: 'hero' });
    expect(getUnit(next, 'hero')!.resources).toMatchObject({ action: false, martialAttack: false, movement: kind === 'dash' ? 60 : 30 });
    const denied = reduceBattle(next, { token: battleToken(next), origin: 'player', command: { kind: 'attack', actor: 'hero', target: 'black_a', attackId: 'unarmed', resource: 'bonus' } });
    expect(denied.state).toBe(next);
  });
  it('回避持续到下次自己回合开始，反应同时独立恢复', () => {
    let state = command(battleFor(), { kind: 'dodge', actor: 'hero' });
    state = command(state, { kind: 'end', actor: 'hero' });
    expect(getUnit(state, 'hero')!.resources.dodging).toBe(true);
    state = patchUnit(state, 'hero', { resources: { ...getUnit(state, 'hero')!.resources, reaction: false } });
    state = nextActor(state, 'hero');
    expect(getUnit(state, 'hero')!.resources).toMatchObject({ dodging: false, reaction: true, movement: 30, action: true });
    expect(state.round).toBe(2);
  });
  it('敌方回合、越权、超预算、过期操作均不改变状态或 RNG', () => {
    const state = battleFor();
    for (const request of [
      { token: battleToken(state), origin: 'player' as const, command: { kind: 'move' as const, actor: 'hero', to: { col: 99, row: 99 } } },
      { token: battleToken(state), origin: 'player' as const, command: { kind: 'end' as const, actor: 'black_a' } },
      { token: 'stale', origin: 'player' as const, command: { kind: 'end' as const, actor: 'hero' } },
    ]) expect(reduceBattle(state, request).state).toBe(state);
    const enemyTurn = command(state, { kind: 'end', actor: 'hero' });
    expect(reduceBattle(enemyTurn, { token: battleToken(enemyTurn), origin: 'player', command: { kind: 'end', actor: currentUnit(enemyTurn).id } }).state).toBe(enemyTurn);
  });
});

describe('逐步移动与借机攻击', () => {
  it('敌人自动借机只耗一次反应，自己的回合开始恢复；强制移动/传送不触发', () => {
    let state = battleFor([5], close);
    const a = getUnit(state, 'black_a')!, hero = getUnit(state, 'hero')!, to = { col: 0, row: 0 };
    expect(opportunityEligible(state, a, hero, to)).toBe(true);
    expect(opportunityEligible(state, a, hero, to, 'forced')).toBe(false);
    expect(opportunityEligible(state, a, hero, to, 'teleport')).toBe(false);
    state = finishMovement(command(state, { kind: 'move', actor: 'hero', to }));
    expect(state.log.filter(event => event.kind === 'attack' && event.source === 'reaction')).toHaveLength(1);
    expect(getUnit(state, 'black_a')!.resources.reaction).toBe(false);
    state = finishMovement(command(state, { kind: 'move', actor: 'hero', to: { col: 0, row: 2 } }));
    state = finishMovement(command(state, { kind: 'move', actor: 'hero', to }));
    expect(state.rng.draws).toBe(4);
    state = command(state, { kind: 'end', actor: 'hero' });
    expect(currentUnit(state).id).toBe('black_a'); expect(getUnit(state, 'black_a')!.resources.reaction).toBe(true);
  });
  it('撤离阻止借机，不消耗 RNG', () => {
    let state = command(battleFor([], close), { kind: 'disengage', actor: 'hero' });
    state = finishMovement(command(state, { kind: 'move', actor: 'hero', to: { col: 0, row: 0 } }));
    expect(state.rng.draws).toBe(3); expect(getUnit(state, 'black_a')!.resources.reaction).toBe(true);
  });
  it('借机使男高昏迷时停在原格，不扣未完成步的移动力，不立即判负', () => {
    let state = patchUnit(battleFor([20, 1, 1], close), 'hero', { hp: 1 });
    state = finishMovement(command(state, { kind: 'move', actor: 'hero', to: { col: 0, row: 0 } }));
    expect(getUnit(state, 'hero')).toMatchObject({ position: { col: 0, row: 1 }, hp: 0, status: 'unconscious', resources: { movement: 25 } });
    expect(state.pendingMove).toBeUndefined(); expect(state.awaitingEnd).toBe(true); expect(state.result).toBeUndefined();
  });
  it('同一步首个借机使移动者昏迷，取消后续反应而不消耗第二人的资源', () => {
    let state = patchUnit(battleFor([20, 1, 1], { hero: { col: 1, row: 2 }, black_a: { col: 0, row: 2 }, black_b: { col: 2, row: 2 } }), 'hero', { hp: 1 });
    state = finishMovement(command(state, { kind: 'move', actor: 'hero', to: { col: 1, row: 0 } }));
    expect(getUnit(state, 'hero')).toMatchObject({ hp: 0, position: { col: 1, row: 1 } });
    expect(state.log.filter(event => event.kind === 'attack' && event.source === 'reaction')).toHaveLength(1);
    expect(getUnit(state, 'black_b')!.resources.reaction).toBe(true);
    expect(state.rng.draws).toBe(6);
  });

  function reactionFixture(dice = [13, 2]) {
    const state = createBattle(debugBattle, combatants, sequence([1, 20, 1, ...dice]), 1, { hero: { col: 1, row: 2 }, black_a: { col: 2, row: 2 }, black_b: { col: 6, row: 4 } });
    return finishMovement(command(state, { kind: 'move', actor: 'black_a', to: { col: 4, row: 3 } }, 'ai'));
  }
  it.each([true, false])('男高手动反应 take=%s，暂停/恢复且仅响应一次', take => {
    const pending = reactionFixture(); const token = battleToken(pending);
    expect(pending.pendingReaction).toEqual({ reactor: 'hero', moving: 'black_a' });
    expect(getUnit(pending, 'black_a')!.position).toEqual({ col: 2, row: 2 }); expect(pending.rng.draws).toBe(3);
    const response = command(pending, { kind: 'react', take });
    expect(getUnit(response, 'hero')!.resources.reaction).toBe(!take); expect(response.rng.draws).toBe(take ? 5 : 3);
    expect(reduceBattle(response, { token, origin: 'player', command: { kind: 'react', take } }).state).toBe(response);
    const moved = finishMovement(response);
    expect(getUnit(moved, 'black_a')).toMatchObject({ position: { col: 4, row: 3 }, hp: take ? 2 : 6, resources: { movement: 20 } });
    expect(getUnit(moved, 'hero')!.resources.martialAttack).toBe(false);
  });
  it('反应击败移动者后取消整条剩余路径', () => {
    const response = command(reactionFixture([20, 4, 4]), { kind: 'react', take: true });
    const stopped = finishMovement(response);
    expect(getUnit(stopped, 'black_a')).toMatchObject({ status: 'defeated', position: { col: 2, row: 2 } });
    expect(stopped.log.filter(event => event.kind === 'move')).toHaveLength(0); expect(stopped.pendingMove).toBeUndefined();
  });
});

describe('死亡、稳定、胜负与重开', () => {
  it.each([[10, 'stable'], [2, 'dead'], [20, 'active']] as const)('回合开始处理死亡豁免 %s', (raw, status) => {
    let state = patchUnit(battleFor([raw]), 'hero', { hp: 0, status: 'unconscious', prone: true, saves: { successes: 2, failures: 2 } });
    state = { ...state, awaitingEnd: true };
    state = command(state, { kind: 'advance-turn' }, 'system');
    state = nextActor(state, 'hero');
    expect(getUnit(state, 'hero')!.status).toBe(status);
    expect(state.log.filter(event => event.kind === 'death-save')).toHaveLength(1);
    if (status === 'active') { expect(state.result).toBeUndefined(); expect(state.awaitingEnd).toBe(false); expect(getUnit(state, 'hero')!.resources.action).toBe(true); }
    else expect(state.result).toEqual({ outcome: 'lose', reason: status });
  });
  it('敌人全部击败即胜利，战斗结束拒绝行动', () => {
    let state = patchUnit(battleFor([12, 4], close), 'black_b', { hp: 0, status: 'defeated' });
    state = command(state, { kind: 'attack', actor: 'hero', target: 'black_a', attackId: 'unarmed', resource: 'action' });
    expect(state.result).toEqual({ outcome: 'win', reason: 'eliminated' });
    expect(reduceBattle(state, { token: battleToken(state), origin: 'player', command: { kind: 'end', actor: 'hero' } }).state).toBe(state);
  });
  it('调试重开恢复初始 RNG，旧命令和旧重开被拒绝，不写剧情flag', () => {
    const game = startDebugGame(42); const token = battleToken(game.battle!);
    const restarted = reduceDebugGame(game, { type: 'restart', token }).state;
    expect(restarted.battle!.rng).toEqual(game.battle!.rng); expect(restarted.battle!.log).toEqual(game.battle!.log);
    expect(restarted.run).toBe(2); expect(restarted.flags).toEqual({});
    expect(reduceDebugGame(restarted, { type: 'restart', token }).state).toBe(restarted);
    expect(reduceDebugGame(restarted, { type: 'command', envelope: { token, origin: 'ai', command: { kind: 'end', actor: currentUnit(game.battle!).id } } }).state).toBe(restarted);
    expect(reduceDebugGame(game, { type: 'mode', token, mode: 'move' }).state).toBe(game);
  });
});
