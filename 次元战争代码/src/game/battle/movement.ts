import type { BattleState } from './types.js';
import { strike } from './combat.js';
import { opportunityEligible } from './rules.js';
import { active, emit, getUnit, replaceUnit } from './state-helpers.js';

export function movementStep(state: BattleState): BattleState {
  const move = state.pendingMove;
  if (!move || state.pendingReaction || state.result) return state;
  const mover = getUnit(state, move.actor)!;
  if (!active(mover) || move.index >= move.path.length) return { ...state, pendingMove: undefined, awaitingEnd: !active(mover) };
  const destination = move.path[move.index]!;
  const reactors = move.reactors ?? state.order.map(entry => entry.actor).filter(id => opportunityEligible(state, getUnit(state, id)!, mover, destination));
  if (reactors.length) {
    const reactor = getUnit(state, reactors[0]!)!;
    let next: BattleState = { ...state, pendingMove: { ...move, reactors: reactors.slice(1) } };
    if (reactor.team === 'player') return emit({ ...next, pendingReaction: { reactor: reactor.id, moving: mover.id } }, { kind: 'reaction', actor: reactor.id, target: mover.id, decision: 'pending' });
    next = emit(replaceUnit(next, { ...reactor, resources: { ...reactor.resources, reaction: false } }), { kind: 'reaction', actor: reactor.id, target: mover.id, decision: 'attack' });
    return strike(next, reactor.id, mover.id, reactor.attacks.find(attack => attack.kind === 'melee')!, 'reaction');
  }
  const remaining = mover.resources.movement - 5;
  const nextMove = move.index + 1 >= move.path.length ? undefined : { ...move, index: move.index + 1, reactors: null };
  return emit(replaceUnit({ ...state, pendingMove: nextMove }, { ...mover, position: { ...destination }, resources: { ...mover.resources, movement: remaining } }), { kind: 'move', actor: mover.id, from: mover.position, to: destination, remaining });
}
export function respondReaction(state: BattleState, take: boolean): BattleState {
  const pending = state.pendingReaction!;
  const reactor = getUnit(state, pending.reactor)!;
  let next = emit({ ...state, pendingReaction: undefined }, { kind: 'reaction', actor: reactor.id, target: pending.moving, decision: take ? 'attack' : 'decline' });
  if (!take) return next;
  next = replaceUnit(next, { ...reactor, resources: { ...reactor.resources, reaction: false } });
  return strike(next, reactor.id, pending.moving, reactor.attacks.find(attack => attack.kind === 'melee')!, 'reaction');
}
