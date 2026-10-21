/** 仅供规则测试和生成浏览器复现步骤；正式入口不导入此模块。 */
import { chooseAi } from '../game/battle/ai.js';
import { createBattle, reduceBattle } from '../game/battle/battle.js';
import { combatants, debugBattle } from '../game/battle/definitions.js';
import { seeded } from '../game/battle/dice.js';
import { distance, pathsFrom } from '../game/battle/grid.js';
import { attackContext } from '../game/battle/rules.js';
import { battleToken, currentUnit } from '../game/battle/state-helpers.js';
import type { BattleState, Command, Envelope, Point } from '../game/battle/types.js';

export function apply(state: BattleState, command: Command, origin: Envelope['origin']): BattleState {
  const result = reduceBattle(state, { token: battleToken(state), origin, command });
  if (result.rejectedReason) throw new Error(result.rejectedReason);
  return result.state;
}
export function pump(state: BattleState): BattleState {
  let next = state;
  for (let step = 0; step < 300 && !next.result; step++) {
    if (next.pendingReaction) next = apply(next, { kind: 'react', take: true }, 'player');
    else if (next.pendingMove) next = apply(next, { kind: 'step' }, 'system');
    else if (next.awaitingEnd) next = apply(next, { kind: 'advance-turn' }, 'system');
    else {
      if (currentUnit(next).team === 'player') return next;
      const command = chooseAi(next);
      if (!command) throw new Error('AI 未产生结束或行动');
      next = apply(next, command, 'ai');
    }
  }
  return next;
}
export function humanAttackPlan(state: BattleState): Command {
  const hero = currentUnit(state), attack = hero.attacks[0]!;
  const targets = state.units.filter(unit => unit.team !== hero.team && !['dead', 'defeated'].includes(unit.status)).sort((a, b) => a.hp - b.hp || distance(a.position, hero.position) - distance(b.position, hero.position));
  const resource = hero.resources.action ? 'action' : hero.resources.bonus && hero.resources.martialAttack ? 'bonus' : undefined;
  if (resource) {
    const target = targets.find(unit => attackContext(state, hero, unit, attack).legal);
    if (target) return { kind: 'attack', actor: hero.id, target: target.id, attackId: attack.id, resource };
    let best: Point[] | undefined;
    for (const path of pathsFrom(state.grid, hero.position, state.units, hero.id).values()) {
      if (!path.length) continue;
      const moved = { ...hero, position: path[path.length - 1]! };
      if (targets.some(unit => attackContext(state, moved, unit, attack).legal) && (!best || path.length < best.length)) best = path;
    }
    const path = best?.slice(0, Math.floor(hero.resources.movement / 5));
    if (path?.length) return { kind: 'move', actor: hero.id, to: path[path.length - 1]! };
  }
  return { kind: 'end', actor: hero.id };
}
export function simulate(seed: number, policy: 'attack' | 'wait' = 'attack', opening: readonly Command[] = [], session = 1) {
  let state = pump(createBattle(debugBattle, combatants, seeded(seed), session));
  const commands: Command[] = [];
  for (let step = 0; step < 200 && !state.result; step++) {
    const command = opening[step] ?? (policy === 'attack' ? humanAttackPlan(state) : { kind: 'end' as const, actor: 'hero' });
    commands.push(command); state = pump(apply(state, command, 'player'));
  }
  if (!state.result) throw new Error('复现脚本未在上限内结算');
  return { state, commands };
}
