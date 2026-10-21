import type { GameState } from '../state.js';
import type { BattleMode, Point } from './types.js';
import { reduceBattle } from './battle.js';
import { same } from './grid.js';
import { connectWaypoints } from './move-path.js';
import { canPlan, currentDraft } from './movement-preview.js';
import { battleToken, currentUnit } from './state-helpers.js';

type PlanningOperation = { operation: 'hover' | 'add'; point: Point }
  | { operation: 'leave' | 'undo' | 'clear' | 'cancel' | 'confirm' };
export type PlanningAction = { type: 'plan'; run: number; token: string; actor: string } & PlanningOperation;
export type PlanningResult = { state: GameState; rejectedReason?: string };

export function setBattleMode(game: GameState, mode: BattleMode): GameState {
  const actor = currentUnit(game.battle!);
  return { ...game, battleMode: mode, movementDraft: mode === 'move'
    ? { run: game.run, token: battleToken(game.battle!), actor: actor.id, waypoints: [] } : undefined };
}

export function reducePlanning(game: GameState, action: PlanningAction): PlanningResult {
  const draft = currentDraft(game), state = game.battle;
  const reject = (rejectedReason: string): PlanningResult => ({ state: game, rejectedReason });
  if (!state || !draft || action.run !== game.run || action.token !== draft.token || action.actor !== draft.actor || !canPlan(game)) return reject('移动规划已过期或当前不能规划');
  const actor = currentUnit(state);
  if (action.operation === 'cancel') return { state: setBattleMode(game, 'idle') };
  if (action.operation === 'confirm') {
    const route = connectWaypoints(state, actor, draft.waypoints);
    if (route.reason || !route.path.length) return reject(route.reason || '请先点击选择一条非空路线');
    const moved = reduceBattle(state, { token: action.token, origin: 'player', command: { kind: 'move', actor: actor.id, to: route.path[route.path.length - 1]!, path: route.path } });
    return moved.state === state ? reject(moved.rejectedReason ?? '路线未被接受') : { state: { ...game, battle: moved.state, battleMode: 'idle', movementDraft: undefined } };
  }
  let waypoints = draft.waypoints, hover = draft.hover;
  if (action.operation === 'hover') {
    if (hover && same(hover, action.point)) return { state: game };
    const preview = connectWaypoints(state, actor, [...waypoints, action.point]);
    hover = preview.reason ? undefined : { ...action.point };
    if (!hover && !draft.hover) return { state: game };
  } else if (action.operation === 'add') {
    if (same(waypoints[waypoints.length - 1] ?? actor.position, action.point)) return { state: game };
    const route = connectWaypoints(state, actor, [...waypoints, action.point]);
    if (route.reason) return reject(route.reason);
    waypoints = [...waypoints, { ...action.point }]; hover = undefined;
  } else if (action.operation === 'undo') { waypoints = waypoints.slice(0, -1); hover = undefined; }
  else if (action.operation === 'clear') { waypoints = []; hover = undefined; }
  else hover = undefined;
  if (waypoints.length === draft.waypoints.length && hover === draft.hover && waypoints.every((point, i) => same(point, draft.waypoints[i]!))) return { state: game };
  return { state: { ...game, movementDraft: { ...draft, waypoints, hover } } };
}
