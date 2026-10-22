import type { Attack, BattleState, Command, Unit } from './types.js';
import { distance, pathsFrom } from './grid.js';
import { attackContext } from './rules.js';
import { active, currentUnit } from './state-helpers.js';

export function preferredAttack(state: BattleState, actor: Unit, target: Unit): Attack | undefined {
  const preferRanged = actor.features.includes('prefer_ranged') && distance(actor.position, target.position) > 1;
  const attacks = [...actor.attacks].sort((a, b) => Number(b.kind === (preferRanged ? 'ranged' : 'melee')) - Number(a.kind === (preferRanged ? 'ranged' : 'melee')));
  return attacks.find(attack => attackContext(state, actor, target, attack).legal);
}
export function chooseAi(state: BattleState): Command | undefined {
  const actor = currentUnit(state);
  if (state.result || state.pendingMove || state.pendingReaction || state.pendingRoll || state.opening || actor.team !== 'enemy' || !active(actor)) return undefined;
  const targets = state.units.filter(unit => unit.team !== actor.team && !['dead', 'defeated'].includes(unit.status))
    .sort((a, b) => distance(actor.position, a.position) - distance(actor.position, b.position));
  if (actor.resources.action) {
    for (const target of targets) {
      const attack = preferredAttack(state, actor, target);
      if (attack) return { kind: 'attack', actor: actor.id, target: target.id, attackId: attack.id, resource: 'action' };
    }
  }
  if (!state.aiMoved && actor.resources.action && actor.resources.movement >= 5) {
    const paths = pathsFrom(state.grid, actor.position, state.units, actor.id);
    let best: { path: Unit['position'][]; target: string } | undefined;
    for (const path of paths.values()) {
      if (!path.length) continue;
      const moved = { ...actor, position: path[path.length - 1]! };
      for (const target of targets) {
        if (preferredAttack(state, moved, target) && (!best || path.length < best.path.length)) best = { path, target: target.id };
      }
    }
    if (best) {
      const usable = best.path.slice(0, Math.floor(actor.resources.movement / 5));
      if (usable.length) return { kind: 'move', actor: actor.id, to: usable[usable.length - 1]! };
    }
  }
  return { kind: 'end', actor: actor.id };
}
