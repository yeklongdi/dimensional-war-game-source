import type { GameState } from '../state.js';
import type { BattleState, Point, Unit } from './types.js';
import { pathsFrom } from './grid.js';
import { connectWaypoints } from './move-path.js';
import { opportunityEligible } from './rules.js';
import { active, battleToken, currentUnit, getUnit } from './state-helpers.js';

export type MovementDraft = { run: number; token: string; actor: string; waypoints: readonly Point[]; hover?: Point };
export type MovementRisk = { from: Point; to: Point; enemies: string[] };
export type MovementOverlay = {
  kind: 'planning' | 'executing'; actor: string; from: Point; path: readonly Point[];
  waypoints: readonly Point[]; reachable: readonly Point[]; risks: readonly MovementRisk[];
  selectedSteps: number; remainingSteps: number;
};

export function canPlan(game: GameState): boolean {
  const state = game.battle;
  return Boolean(['battle', 'battle-debug'].includes(game.screen) && state && game.battleMode === 'move'
    && !state.result && !state.pendingMove && !state.pendingReaction && !state.pendingRoll && !state.opening && !state.awaitingEnd
    && currentUnit(state).team === 'player' && active(currentUnit(state)));
}
export function currentDraft(game: GameState): MovementDraft | undefined {
  const draft = game.movementDraft;
  return canPlan(game) && draft?.run === game.run && draft.token === battleToken(game.battle!) && draft.actor === currentUnit(game.battle!).id ? draft : undefined;
}

/** 虚拟位置只传给既有资格查询；不更改反应、不掷骰、不预测伤害。 */
export function movementRisks(state: BattleState, actor: Unit, path: readonly Point[]): MovementRisk[] {
  const seen = new Set<string>(), risks: MovementRisk[] = [];
  let mover = actor;
  for (const to of path) {
    const enemies = state.order.map(entry => getUnit(state, entry.actor)!).filter(reactor => !seen.has(reactor.id) && opportunityEligible(state, reactor, mover, to)).map(reactor => reactor.id);
    if (enemies.length) {
      enemies.forEach(id => seen.add(id)); risks.push({ from: { ...mover.position }, to: { ...to }, enemies });
    }
    mover = { ...mover, position: to };
  }
  return risks;
}

export function movementOverlay(game: GameState): MovementOverlay | undefined {
  const state = game.battle;
  if (!state || state.result || !['battle', 'battle-debug'].includes(game.screen)) return undefined;
  const move = state.pendingMove;
  if (move) {
    const actor = getUnit(state, move.actor)!;
    const path = move.path.slice(move.index);
    if (actor.team !== 'player' || !active(actor) || !path.length) return undefined;
    return { kind: 'executing', actor: actor.id, from: actor.position, path, waypoints: [], reachable: [],
      risks: movementRisks(state, actor, path), selectedSteps: path.length, remainingSteps: Math.floor(actor.resources.movement / 5) };
  }
  const draft = currentDraft(game);
  if (!draft) return undefined;
  const actor = currentUnit(state), selected = connectWaypoints(state, actor, draft.waypoints);
  if (selected.reason) return undefined;
  const remainingSteps = Math.floor(actor.resources.movement / 5) - selected.path.length;
  const from = selected.path[selected.path.length - 1] ?? actor.position;
  const reachable = [...pathsFrom(state.grid, from, state.units, actor.id, remainingSteps).values()].map(path => path[path.length - 1] ?? from);
  const preview = draft.hover ? connectWaypoints(state, actor, [...draft.waypoints, draft.hover]) : selected;
  const path = preview.reason ? selected.path : preview.path;
  return { kind: 'planning', actor: actor.id, from: actor.position, path, waypoints: draft.waypoints, reachable,
    risks: movementRisks(state, actor, path), selectedSteps: selected.path.length, remainingSteps };
}
