import { describe, expect, it } from 'vitest';
import { chooseAi, preferredAttack } from '../game/battle/ai.js';
import { debugBattle, combatants } from '../game/battle/definitions.js';
import { createBattle, reduceBattle } from '../game/battle/battle.js';
import { seeded } from '../game/battle/dice.js';
import { battleToken, currentUnit, getUnit } from '../game/battle/state-helpers.js';
import { battleFor, patchUnit } from './battle-helpers.js';
import { apply, pump, simulate } from './battle-simulation.js';

describe('AI 与完整战斗', () => {
  it('乙能远程就攻击，贴身改近战；即使目标昏迷仍可攻击', () => {
    const state = createBattle(debugBattle, combatants, seeded(42));
    expect(chooseAi(state)).toMatchObject({ kind: 'attack', actor: 'black_b', target: 'hero', attackId: 'device' });
    const close = patchUnit(state, 'hero', { position: { col: 5, row: 4 }, hp: 0, status: 'unconscious' });
    expect(preferredAttack(close, getUnit(close, 'black_b')!, getUnit(close, 'hero')!)?.id).toBe('slash');
    expect(chooseAi(close)).toMatchObject({ attackId: 'slash' });
  });
  it('无路可走或没有合法敌人时结束，不消耗 RNG 查询', () => {
    let state = createBattle(debugBattle, combatants, seeded(42));
    const unchanged = JSON.stringify(state);
    chooseAi(state); chooseAi(state); expect(JSON.stringify(state)).toBe(unchanged);
    state = { ...state, grid: { ...state.grid, tiles: state.grid.tiles.map(() => 'wall' as const) } };
    expect(chooseAi(state)).toMatchObject({ kind: 'end' });
    state = patchUnit(state, 'hero', { status: 'dead', hp: 0 });
    expect(chooseAi(state)).toMatchObject({ kind: 'end' });
  });
  it('甲按合法 BFS 接近，移动后重新检查并攻击；每条命令由共同规则验证', () => {
    let state = battleFor([10, 2]);
    state = apply(state, { kind: 'end', actor: 'hero' }, 'player');
    expect(currentUnit(state).id).toBe('black_a'); expect(chooseAi(state)?.kind).toBe('move');
    for (let count = 0; count < 50 && currentUnit(state).id === 'black_a'; count++) {
      const action = state.pendingMove ? { kind: 'step' as const } : chooseAi(state)!;
      state = apply(state, action, state.pendingMove ? 'system' : 'ai');
    }
    expect(state.log.some(event => event.kind === 'attack' && event.actor === 'black_a')).toBe(true);
    expect(state.log.some(event => event.kind === 'move' && event.actor === 'black_a')).toBe(true);
  });
  it('固定seed与合法操作可复现，重开日志不带会话编号', () => {
    const one = simulate(42, 'attack', [], 1), two = simulate(42, 'attack', [], 99);
    expect(one.commands).toEqual(two.commands); expect(one.state.log).toEqual(two.state.log); expect(one.state.rng).toEqual(two.state.rng);
    expect(one.state.result).toBeDefined();
    expect(one.state.log.some(event => event.kind === 'attack' && event.source === 'bonus')).toBe(true);
  });
  it('正常合法操作可以实际走到昏迷、死亡豁免、补刀死亡', () => {
    const result = simulate(42, 'wait').state;
    expect(result.result?.outcome).toBe('lose');
    expect(result.log.some(event => event.kind === 'condition' && event.status === 'unconscious')).toBe(true);
    expect(result.log.some(event => event.kind === 'death-save')).toBe(true);
    expect(result.log.some(event => event.kind === 'damage' && event.report.failureAdded > 0)).toBe(true);
  });
  it('旧AI回调不改变玩家回合或新版本，正式数据和初始对象不变', () => {
    const definitions = JSON.stringify([debugBattle, combatants]);
    const state = createBattle(debugBattle, combatants, seeded(42)), token = battleToken(state);
    const next = pump(state);
    expect(currentUnit(next).team).toBe('player');
    expect(reduceBattle(next, { token, origin: 'ai', command: chooseAi(state)! }).state).toBe(next);
    expect(JSON.stringify([debugBattle, combatants])).toBe(definitions);
    expect(state.rng.draws).toBe(3);
  });
});
