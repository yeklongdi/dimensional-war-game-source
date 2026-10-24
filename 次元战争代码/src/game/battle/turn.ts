import type { BattleState, D20Roll } from './types.js';
import { resolveDeathSave } from './rules.js';
import { rollD20 } from './dice.js';
import { active, currentUnit, emit, getUnit, replaceUnit, settle } from './state-helpers.js';

export function startTurn(state: BattleState): BattleState {
  let unit = currentUnit(state);
  unit = { ...unit, resources: { movement: unit.speed, action: true, bonus: unit.features.includes('martial_arts'), reaction: true, martialAttack: false, disengaged: false, dodging: false } };
  let next = emit(replaceUnit({ ...state, aiMoved: false, awaitingEnd: false }, unit), { kind: 'turn', actor: unit.id });
  if (unit.status === 'unconscious') {
    const rolled = rollD20(next.rng);
    next = { ...next, rng: rolled.rng };
    if ((next.inspiration?.[unit.id] ?? 0) > 0) return { ...next, pendingRoll: { kind: 'death-save', actor: unit.id, roll: rolled.roll } };
    next = completeDeathSave(next, unit.id, rolled.roll);
  }
  return next;
}
export function completeDeathSave(state: BattleState, actor: string, roll: D20Roll): BattleState {
  const saved = resolveDeathSave(getUnit(state, actor)!, roll);
  const next = emit(replaceUnit({ ...state, awaitingEnd: !active(saved.unit) }, saved.unit), { kind: 'death-save', actor, roll, successes: saved.unit.saves.successes, failures: saved.unit.saves.failures, outcome: saved.outcome });
  return settle(next);
}
export function endTurn(state: BattleState): BattleState {
  if (state.result) return state;
  let index = state.turnIndex, round = state.round;
  for (let count = 0; count < state.order.length; count++) {
    index = (index + 1) % state.order.length;
    if (index === 0) round++;
    const unit = state.units.find(item => item.id === state.order[index]!.actor)!;
    if (['dead', 'defeated', 'stable'].includes(unit.status)) continue;
    return startTurn({ ...state, turnIndex: index, round, pendingMove: undefined, pendingReaction: undefined });
  }
  return settle(state);
}
