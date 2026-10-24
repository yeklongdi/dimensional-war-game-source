import { describe, expect, it } from 'vitest';
import { reduceBattle } from '../game/battle/battle.js';
import { connectWaypoints, resolveMovePath } from '../game/battle/move-path.js';
import { key, parseMap, pathsFrom } from '../game/battle/grid.js';
import { battleToken, getUnit } from '../game/battle/state-helpers.js';
import { command, finishMovement, patchUnit } from './battle-helpers.js';
import { planningGame } from './movement-helpers.js';
import { movementRisks } from '../game/battle/movement-preview.js';
import type { Point } from '../game/battle/types.js';

describe('共享规划与显式路径', () => {
  it.each([
    ['直线', [{ col: 3, row: 2 }], 2],
    ['转弯', [{ col: 1, row: 1 }, { col: 3, row: 1 }, { col: 3, row: 3 }], 5],
    ['多点', [{ col: 3, row: 2 }, { col: 3, row: 3 }], 3],
    ['绕路', [{ col: 1, row: 0 }, { col: 3, row: 0 }, { col: 3, row: 2 }], 6],
    ['回头', [{ col: 2, row: 2 }, { col: 1, row: 2 }], 2],
    ['循环', [{ col: 2, row: 2 }, { col: 2, row: 3 }, { col: 1, row: 3 }, { col: 1, row: 2 }], 4],
  ] as const)('%s逐格执行原路线并按实际步数计费', (_, points, steps) => {
    const state = planningGame().battle!, hero = getUnit(state, 'hero')!;
    const route = connectWaypoints(state, hero, points);
    expect(route.reason).toBe(''); expect(route.path).toHaveLength(steps);
    const accepted = command(state, { kind: 'move', actor: hero.id, to: points.at(-1)!, path: route.path });
    expect(accepted.pendingMove!.path).toEqual(route.path); expect(getUnit(accepted, hero.id)!.resources.movement).toBe(30);
    const moved = finishMovement(accepted);
    expect(moved.log.filter(event => event.kind === 'move').map(event => event.to)).toEqual(route.path);
    expect(getUnit(moved, hero.id)!.resources.movement).toBe(30 - steps * 5);
    expect(getUnit(moved, hero.id)!.position).toEqual(points.at(-1));
  });

  it.each([
    ['空路线', [], { col: 2, row: 2 }],
    ['首步包含起点', [{ col: 1, row: 2 }, { col: 2, row: 2 }], { col: 2, row: 2 }],
    ['末格不匹配', [{ col: 2, row: 2 }], { col: 3, row: 2 }],
    ['跳步', [{ col: 3, row: 2 }], { col: 3, row: 2 }],
    ['重复原地步', [{ col: 2, row: 2 }, { col: 2, row: 2 }], { col: 2, row: 2 }],
    ['越界', [{ col: -1, row: 2 }], { col: -1, row: 2 }],
    ['非整数', [{ col: 1.5, row: 2 }], { col: 1.5, row: 2 }],
    ['非有限坐标', [{ col: Infinity, row: 2 }], { col: Infinity, row: 2 }],
    ['超过完整预算', Array.from({ length: 7 }, (_, i) => ({ col: i % 2 ? 1 : 2, row: 2 })), { col: 2, row: 2 }],
  ] as const)('%s整条拒绝且资源、日志、RNG与版本完全不变', (_, path, to) => {
    const state = planningGame().battle!, before = structuredClone(state);
    const denied = reduceBattle(state, { token: battleToken(state), origin: 'player', command: { kind: 'move', actor: 'hero', to, path } });
    expect(denied.rejectedReason).toBeTruthy(); expect(denied.state).toBe(state); expect(denied.events).toEqual([]); expect(state).toEqual(before);
  });

  it.each(['wall', 'crate', 'occupied', 'corner-terrain', 'corner-unit'] as const)('%s不能加入，不能悄悄改道', obstacle => {
    let state = planningGame().battle!;
    let path: Point[] = [{ col: 2, row: 2 }];
    if (obstacle === 'occupied') state = patchUnit(state, 'black_a', { position: path[0]! });
    else if (obstacle === 'corner-unit') {
      state = patchUnit(state, 'black_a', { position: { col: 2, row: 2 } }); path = [{ col: 2, row: 1 }];
    } else {
      const tiles = [...state.grid.tiles]; tiles[2 * 7 + 2] = obstacle === 'crate' ? 'crate' : 'wall'; state = { ...state, grid: { ...state.grid, tiles } };
      if (obstacle === 'corner-terrain') path = [{ col: 2, row: 1 }];
    }
    expect(resolveMovePath(state, getUnit(state, 'hero')!, path.at(-1)!, path).reason).toBeTruthy();
    expect(reduceBattle(state, { token: battleToken(state), origin: 'player', command: { kind: 'move', actor: 'hero', to: path.at(-1)!, path } }).state).toBe(state);
  });

  it('复制外部数组与坐标，接受后不能由调用方修改；查询也不修改只读输入', () => {
    const state = planningGame().battle!, path = [{ col: 2, row: 2 }, { col: 3, row: 2 }];
    const moved = command(state, { kind: 'move', actor: 'hero', to: path.at(-1)!, path });
    path[0]!.col = 99; path.push({ col: 99, row: 99 });
    expect(moved.pendingMove!.path).toEqual([{ col: 2, row: 2 }, { col: 3, row: 2 }]);
    const frozen = Object.freeze([Object.freeze({ col: 2, row: 2 })]);
    expect(resolveMovePath(state, getUnit(state, 'hero')!, frozen[0]!, frozen).reason).toBe(''); expect(frozen[0]!.col).toBe(2);
  });

  it('未提供path继续使用同一BFS；同路径显式命令的日志、骰序及版本相同', () => {
    const state = planningGame().battle!, hero = getUnit(state, 'hero')!, to = { col: 4, row: 3 };
    const path = pathsFrom(state.grid, hero.position, state.units, hero.id).get(key(to))!;
    expect(connectWaypoints(state, hero, [to]).path).toEqual(path);
    const legacy = finishMovement(command(state, { kind: 'move', actor: hero.id, to }));
    const explicit = finishMovement(command(state, { kind: 'move', actor: hero.id, to, path }));
    expect(explicit).toEqual(legacy);
    expect(resolveMovePath(state, hero, hero.position).reason).toBeTruthy();
  });
});

describe('借机风险是既有资格的纯查询', () => {
  const route = [{ col: 1, row: 1 }, { col: 1, row: 0 }, { col: 1, row: 1 }, { col: 1, row: 0 }];
  function close() {
    let state = planningGame().battle!;
    state = patchUnit(state, 'black_a', { position: { col: 0, row: 2 } });
    return patchUnit(state, 'black_b', { position: { col: 2, row: 2 } });
  }
  it('多敌共用首次触发路段，回头再离开不重复提示；不改变任何状态', () => {
    const state = close(), before = structuredClone(state);
    expect(movementRisks(state, getUnit(state, 'hero')!, route)).toEqual([{ from: route[0], to: route[1], enemies: ['black_a', 'black_b'] }]);
    expect(state).toEqual(before);
  });
  it.each(['reaction', 'incapacitated', 'disengaged'] as const)('%s使用既有规则移除风险', reason => {
    let state = close();
    if (reason === 'reaction') for (const id of ['black_a', 'black_b']) state = patchUnit(state, id, { resources: { ...getUnit(state, id)!.resources, reaction: false } });
    if (reason === 'incapacitated') for (const id of ['black_a', 'black_b']) state = patchUnit(state, id, { hp: 0, status: 'unconscious' });
    if (reason === 'disengaged') state = patchUnit(state, 'hero', { resources: { ...getUnit(state, 'hero')!.resources, disengaged: true } });
    expect(movementRisks(state, getUnit(state, 'hero')!, route)).toEqual([]);
  });
  it('墙阻断触及位置的视线时不提示，去墙后提示；不另写威胁半径', () => {
    let state = close();
    state = patchUnit(state, 'hero', { position: { col: 2, row: 2 } });
    state = patchUnit(state, 'black_a', { position: { col: 0, row: 0 }, attacks: getUnit(state, 'black_a')!.attacks.map(attack => ({ ...attack, reach: 3 })) });
    state = patchUnit(state, 'black_b', { status: 'defeated', hp: 0 });
    const path = [{ col: 3, row: 3 }, { col: 4, row: 4 }];
    expect(movementRisks(state, getUnit(state, 'hero')!, path)).toHaveLength(1);
    const grid = parseMap(['.......', '.#.....', '.......', '.......', '.......']).grid;
    expect(movementRisks({ ...state, grid }, getUnit(state, 'hero')!, path)).toEqual([]);
  });
});
