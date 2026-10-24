import { emptyState } from '../game/state.js';
import type { GameState } from '../game/state.js';
import type { Point } from '../game/battle/types.js';
import { parseMap } from '../game/battle/grid.js';
import { reducePlanning, setBattleMode } from '../game/battle/planning.js';
import type { PlanningAction } from '../game/battle/planning.js';
import { battleFor } from './battle-helpers.js';

export function planningGame(): GameState {
  const battle = battleFor(Array<number>(12).fill(1), { hero: { col: 1, row: 2 }, black_a: { col: 5, row: 0 }, black_b: { col: 6, row: 4 } });
  return setBattleMode({ ...emptyState(7), screen: 'battle-debug', battle: { ...battle, grid: parseMap(Array<string>(5).fill('.......')).grid } }, 'move');
}
export function planAction(game: GameState, operation: PlanningAction['operation'], point?: Point): PlanningAction {
  const draft = game.movementDraft!;
  const base = { type: 'plan' as const, run: game.run, token: draft.token, actor: draft.actor };
  if (operation === 'add' || operation === 'hover') return { ...base, operation, point: point! };
  return { ...base, operation };
}
export function editPlan(game: GameState, operation: PlanningAction['operation'], point?: Point): GameState {
  const transition = reducePlanning(game, planAction(game, operation, point));
  if (transition.rejectedReason) throw new Error(transition.rejectedReason);
  return transition.state;
}
