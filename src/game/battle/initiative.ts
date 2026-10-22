import type { BattleState, InitiativeEntry, RngState, Unit } from './types.js';
import { rollD20 } from './dice.js';
import { emit } from './state-helpers.js';
import { startTurn } from './turn.js';

export function sortInitiative(entries: readonly InitiativeEntry[]) {
  return [...entries].sort((a, b) => b.total - a.total || b.dex - a.dex || Number(b.team === 'player') - Number(a.team === 'player') || a.stableIndex - b.stableIndex);
}

export function initiative(units: readonly Unit[], initial: RngState) {
  let rng = initial;
  const entries: InitiativeEntry[] = units.map((unit, stableIndex) => {
    const result = rollD20(rng); rng = result.rng;
    const bonus = Math.floor((unit.abilities.dex - 10) / 2);
    return { actor: unit.id, roll: result.roll, bonus, total: result.roll.chosen + bonus, dex: unit.abilities.dex, team: unit.team, stableIndex };
  });
  const order = sortInitiative(entries);
  return { entries, order, rng };
}

export function completeInitiative(state: BattleState, entries: readonly InitiativeEntry[]): BattleState {
  let next = { ...state, order: sortInitiative(entries) };
  for (const [index, entry] of next.order.entries()) next = emit(next, { kind: 'initiative', actor: entry.actor, roll: entry.roll, bonus: entry.bonus, total: entry.total, rank: index + 1 });
  return startTurn(next);
}
