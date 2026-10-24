import { createBattle, reduceBattle } from '../game/battle/battle.js';
import { combatants, debugBattle } from '../game/battle/definitions.js';
import { sequence } from '../game/battle/dice.js';
import { battleToken, currentUnit } from '../game/battle/state-helpers.js';
import type { BattleState, Command, Envelope, Point, Unit } from '../game/battle/types.js';

export function battleFor(dice: number[] = [], positions?: Record<string, Point>) {
  return createBattle(debugBattle, combatants, sequence([20, 1, 1, ...dice]), 1, positions);
}
export function patchUnit(state: BattleState, id: string, patch: Partial<Unit>): BattleState {
  return { ...state, units: state.units.map(unit => unit.id === id ? { ...unit, ...structuredClone(patch) } : unit) };
}
export function command(state: BattleState, action: Command, origin: Envelope['origin'] = 'player'): BattleState {
  const result = reduceBattle(state, { token: battleToken(state), origin, command: action });
  if (result.rejectedReason) throw new Error(result.rejectedReason);
  return result.state;
}
export function finishMovement(state: BattleState): BattleState {
  let next = state;
  for (let steps = 0; next.pendingMove && !next.pendingReaction && !next.result && steps < 100; steps++) next = command(next, { kind: 'step' }, 'system');
  return next;
}
export function nextActor(state: BattleState, actor: string): BattleState {
  let next = state;
  for (let steps = 0; currentUnit(next).id !== actor && !next.result && steps < 10; steps++) {
    const current = currentUnit(next);
    next = next.awaitingEnd ? command(next, { kind: 'advance-turn' }, 'system') : command(next, { kind: 'end', actor: current.id }, current.team === 'player' ? 'player' : 'ai');
  }
  return next;
}
