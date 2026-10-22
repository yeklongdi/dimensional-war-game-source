import type { BattleDefinition, BattleState, BattleTransition, Combatant, Command, Envelope, Point, RngState, Unit } from './types.js';
import { parseMap, walkable } from './grid.js';
import { resolveMovePath } from './move-path.js';
import { completeInitiative, initiative } from './initiative.js';
import { attackContext } from './rules.js';
import { strike } from './combat.js';
import { movementStep, respondReaction } from './movement.js';
import { active, battleToken, currentUnit, emit, getUnit, replaceUnit } from './state-helpers.js';
import { endTurn } from './turn.js';
import { inspirationReason, resolveInspiration } from './inspiration.js';
import { updateTutorial } from './tutorial.js';

export function createBattle(definition: BattleDefinition, templates: readonly Combatant[], rng: RngState, session = 1, positions?: Readonly<Record<string, Point>>): BattleState {
  const { grid, hero, enemies } = parseMap(definition.map);
  const units: Unit[] = definition.spawnOrder.map((id, index) => {
    const template = templates.find(item => item.id === id);
    const position = positions?.[id] ?? (index === 0 ? hero[0] : enemies[index - 1]);
    if (!template || !position) throw new Error(`缺少单位或出生点 ${id}`);
    return { ...structuredClone(template), position: { ...position }, hp: template.maxHp, tempHp: template.team === 'player' ? definition.heroLoadout?.tempHp ?? 0 : 0, status: 'active', prone: false, saves: { successes: 0, failures: 0 },
      resources: { movement: 0, action: false, bonus: false, reaction: true, martialAttack: false, disengaged: false, dodging: false } };
  });
  if (units.some(unit => !walkable(grid, unit.position, units, unit.id))) throw new Error('出生点必须为空地且不能重叠');
  const rolled = initiative(units, rng);
  let state: BattleState = { id: definition.id, title: definition.title, session, revision: 0, seed: rng.kind === 'seeded' ? rng.seed : 0,
    grid, units, order: rolled.order, turnIndex: 0, round: 1, rng: rolled.rng, initialRng: structuredClone(rng), aiMoved: false, awaitingEnd: false, log: [] };
  const player = units.find(unit => unit.team === 'player')!;
  if (definition.opening) state.opening = definition.opening;
  if (definition.tutorial) state.tutorial = { seen: [] };
  if (player.tempHp > 0) state = emit(state, { kind: 'temp-hp', actor: player.id, amount: player.tempHp });
  if (definition.heroLoadout?.inspiration) {
    state.inspiration = { [player.id]: definition.heroLoadout.inspiration };
    const entry = rolled.entries.find(item => item.actor === player.id)!;
    return { ...state, pendingRoll: { kind: 'initiative', actor: player.id, roll: entry.roll, entries: rolled.entries } };
  }
  return updateTutorial(completeInitiative(state, rolled.entries));
}

export function actionReason(state: BattleState, command: Command, origin: Envelope['origin']): string {
  if (state.result) return '战斗已结束';
  if (command.kind === 'inspire') return origin === 'player' ? inspirationReason(state, command.dieIndex) : '只有玩家可以决定英雄激励';
  if (state.pendingRoll) return '等待英雄激励决定';
  if (command.kind === 'finish-opening') return origin === 'system' && state.opening ? '' : '当前没有开场表现';
  if (state.opening) return '等待开场表现结束';
  if (command.kind === 'react') return origin === 'player' && state.pendingReaction ? '' : '当前没有可响应的反应';
  if (command.kind === 'step') return origin === 'system' && state.pendingMove && !state.pendingReaction ? '' : '当前没有可继续的移动';
  if (command.kind === 'advance-turn') return origin === 'system' && state.awaitingEnd && !state.pendingMove ? '' : '当前不能自动结束回合';
  if (state.pendingReaction || state.pendingMove) return '正在处理移动或借机攻击';
  const unit = getUnit(state, command.actor);
  if (!unit || currentUnit(state).id !== unit.id) return '不是该单位的回合';
  if (origin !== (unit.team === 'player' ? 'player' : 'ai')) return '当前不能操作该阵营';
  if (!active(unit)) return '行动者已失去战斗能力';
  if (command.kind === 'end') return '';
  if (command.kind === 'move') {
    return resolveMovePath(state, unit, command.to, command.path).reason;
  }
  if (command.kind !== 'attack') return unit.resources.action ? '' : '动作已用完';
  const target = getUnit(state, command.target), attack = unit.attacks.find(item => item.id === command.attackId);
  if (!attack || !target) return '找不到攻击或目标';
  if (unit.team === 'player' && command.resource === 'action' && attack.id !== unit.attacks[0]?.id) return '动作攻击使用本场主手';
  if (command.resource === 'action' && !unit.resources.action) return '动作已用完';
  if (command.resource === 'bonus' && (!unit.resources.bonus || !unit.resources.martialAttack || !unit.features.includes('martial_arts') || attack.id !== 'unarmed')) return '附赠徒手需要先执行符合条件的攻击动作，且附赠动作尚未使用';
  return attackContext(state, unit, target, attack).reason;
}

export function reduceBattle(state: BattleState, envelope: Envelope): BattleTransition {
  const reject = (rejectedReason: string): BattleTransition => ({ state, events: [], rejectedReason });
  if (envelope.token !== battleToken(state)) return reject('操作已过期');
  const { command, origin } = envelope;
  const reason = actionReason(state, command, origin);
  if (reason) return reject(reason);
  let next = state;
  if (origin === 'ai' && 'actor' in command) next = emit(next, { kind: 'ai', actor: command.actor, decision: command.kind === 'attack' ? 'attack' : command.kind === 'move' ? 'move' : 'end',
    ...('target' in command ? { target: command.target } : {}), ...('to' in command ? { destination: command.to } : {}) });
  if (command.kind === 'inspire') next = resolveInspiration(next, command.dieIndex);
  else if (command.kind === 'finish-opening') next = { ...next, opening: undefined };
  else if (command.kind === 'step') next = movementStep(next);
  else if (command.kind === 'react') next = respondReaction(next, command.take);
  else if (command.kind === 'advance-turn' || command.kind === 'end') next = endTurn(next);
  else {
    const unit = getUnit(next, command.actor)!;
    if (command.kind === 'move') {
      const { path } = resolveMovePath(next, unit, command.to, command.path);
      next = { ...next, aiMoved: origin === 'ai' || next.aiMoved, pendingMove: { actor: unit.id, path, index: 0, reactors: null } };
    } else if (command.kind === 'attack') {
      const attack = unit.attacks.find(item => item.id === command.attackId)!;
      next = replaceUnit(next, { ...unit, resources: { ...unit.resources, [command.resource]: false,
        martialAttack: unit.resources.martialAttack || (command.resource === 'action' && Boolean(attack.martial) && unit.features.includes('martial_arts')) } });
      next = strike(next, unit.id, command.target, attack, command.resource);
    } else {
      next = replaceUnit(next, { ...unit, resources: { ...unit.resources, action: false,
        movement: unit.resources.movement + (command.kind === 'dash' ? unit.speed : 0),
        disengaged: unit.resources.disengaged || command.kind === 'disengage', dodging: unit.resources.dodging || command.kind === 'dodge' } });
      next = emit(next, { kind: 'resource', actor: unit.id, action: command.kind });
    }
  }
  next = { ...updateTutorial(next), revision: state.revision + 1 };
  return { state: next, events: next.log.slice(state.log.length) };
}
