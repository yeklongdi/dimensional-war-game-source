import type { BattleState, Point, Unit } from './types.js';
import { inside, key, neighbors, pathsFrom, same, tile, walkable } from './grid.js';

export type PathResult = { path: Point[]; reason: string };

/** 预览和执行共用；显式路径只校验，不用另一条最短路替换。 */
export function resolveMovePath(state: BattleState, actor: Unit, to: Point, supplied?: readonly Point[]): PathResult {
  const fail = (reason: string): PathResult => ({ path: [], reason });
  if (!inside(state.grid, to)) return fail('目标格越界或坐标无效');
  if (supplied === undefined) {
    if (same(actor.position, to)) return fail('已经在目标格');
    const path = pathsFrom(state.grid, actor.position, state.units, actor.id, Math.floor(actor.resources.movement / 5)).get(key(to));
    return path?.length ? { path: path.map(point => ({ ...point })), reason: '' } : fail('目标不可达、被占用或移动力不足');
  }
  if (!supplied.length) return fail('路线至少需要一步');
  if (!same(supplied[supplied.length - 1]!, to)) return fail('路线末格与目标不一致');
  if (supplied.length * 5 > actor.resources.movement) return fail('整条路线超出剩余移动力');
  let previous = actor.position;
  for (const point of supplied) {
    if (!inside(state.grid, point)) return fail('路线包含越界或无效坐标');
    if (tile(state.grid, point) !== 'floor') return fail('墙或箱子不可进入');
    if (!walkable(state.grid, point, state.units, actor.id)) return fail('该格被在场单位占用');
    if (!neighbors(state.grid, previous, state.units, actor.id).some(next => same(next, point))) return fail('路线必须逐格相邻，且不能斜穿墙角或单位');
    previous = point;
  }
  return { path: supplied.map(point => ({ ...point })), reason: '' };
}

/** 每段沿用原 BFS 的固定展开顺序，重复经过的格子仍计入步数。 */
export function connectWaypoints(state: BattleState, actor: Unit, points: readonly Point[]): PathResult {
  const path: Point[] = [];
  let from = actor.position;
  for (const point of points) {
    if (!inside(state.grid, point)) return { path: [], reason: '目标格越界或坐标无效' };
    if (same(from, point)) continue;
    if (!walkable(state.grid, point, state.units, actor.id)) return { path: [], reason: '目标被占用或是不可进入的地形' };
    const segment = pathsFrom(state.grid, from, state.units, actor.id).get(key(point));
    if (!segment?.length) return { path: [], reason: '目标不可达或无法绕过阻挡' };
    path.push(...segment); from = point;
  }
  return path.length ? resolveMovePath(state, actor, from, path) : { path, reason: '' };
}
