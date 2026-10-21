import type { BattleState, EventData, Unit } from './types.js';

export const currentUnit = (state: BattleState) => state.units.find(unit => unit.id === state.order[state.turnIndex]?.actor)!;
export const getUnit = (state: BattleState, id: string) => state.units.find(unit => unit.id === id);
export const active = (unit: Unit) => unit.status === 'active' && unit.hp > 0;
export const battleToken = (state: BattleState) => `${state.session}:${state.revision}`;
export function replaceUnit(state: BattleState, unit: Unit): BattleState {
  return { ...state, units: state.units.map(item => item.id === unit.id ? unit : item) };
}
export function emit(state: BattleState, event: EventData): BattleState {
  return { ...state, log: [...state.log, { ...event, seq: state.log.length, round: state.round }] };
}
export function settle(state: BattleState): BattleState {
  if (state.result) return state;
  const hero = state.units.find(unit => unit.team === 'player');
  const reason = hero?.status === 'dead' ? 'dead' : hero?.status === 'stable' ? 'stable'
    : state.units.filter(unit => unit.team === 'enemy').every(unit => unit.status === 'defeated' || unit.status === 'dead') ? 'eliminated' : undefined;
  if (!reason) return state;
  const outcome = reason === 'eliminated' ? 'win' : 'lose';
  return emit({ ...state, result: { outcome, reason }, pendingMove: undefined, pendingReaction: undefined, pendingRoll: undefined, opening: undefined, awaitingEnd: false }, { kind: 'result', outcome, reason });
}
