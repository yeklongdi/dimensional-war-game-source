import type { Attack, BattleState, TimedEffect, Unit } from './types.js';
import { currentUnit, replaceUnit } from './state-helpers.js';

export const turnCount = (state: BattleState, id: string) => state.turns?.[id] ?? 0;
export function turnStart(state: BattleState, id: string): BattleState {
  if (!state.turns) return state;
  const turn = turnCount(state, id) + 1;
  return { ...state, turns: { ...state.turns, [id]: turn },
    timed: state.timed?.filter(effect => effect.kind === 'vex' || effect.source !== id || effect.expires > turn) };
}
export function turnEnd(state: BattleState): BattleState {
  if (!state.timed?.some(effect => effect.kind === 'vex')) return state;
  const id = currentUnit(state).id;
  return { ...state, timed: state.timed.filter(effect => effect.kind !== 'vex' || effect.actor !== id || effect.expires > turnCount(state, id)) };
}
export function movementSpeed(state: BattleState, unit: Unit) {
  const effects = state.timed?.filter(effect => effect.actor === unit.id);
  const penalty = 10 * new Set(effects?.filter(effect => effect.kind === 'slow' || effect.kind === 'frost').map(effect => effect.kind)).size;
  return Math.max(0, (unit.flightSpeed ?? unit.speed) - penalty);
}
export function consumeAttackEffects(state: BattleState, actor: string, target: string): BattleState {
  if (!state.timed?.length) return state;
  return { ...state, timed: state.timed.filter(effect => effect.actor !== actor || !(effect.kind === 'sap' || (effect.kind === 'vex' && effect.source === target))) };
}
export function applyAttackEffects(state: BattleState, actor: string, target: Unit, attack: Attack, damage: number): BattleState {
  if (!state.loop) return state;
  const kind = attack.mastery ?? attack.onHit;
  if (!kind || ((kind === 'vex' || kind === 'slow') && damage === 0)) return state;
  const source = kind === 'vex' || kind === 'no_opportunity' ? target.id : actor;
  const affected = kind === 'vex' ? actor : target.id;
  const expiryActor = kind === 'vex' ? actor : source;
  const effect: TimedEffect = { kind, source, actor: affected, expires: turnCount(state, expiryActor) + 1 };
  const old = state.timed ?? [];
  const next = { ...state, timed: [...old.filter(other => other.kind !== kind || other.actor !== affected
    || other.source !== source), effect] };
  const speedLoss = movementSpeed(state, target) - movementSpeed(next, target);
  return speedLoss > 0 && currentUnit(next).id === target.id
    ? replaceUnit(next, { ...target, resources: { ...target.resources, movement: Math.max(0, target.resources.movement - speedLoss) } })
    : next;
}
