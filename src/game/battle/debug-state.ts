import type { GameState } from '../state.js';
import { emptyState } from '../state.js';
import { createBattle, reduceBattle } from './battle.js';
import { combatants, debugBattle } from './definitions.js';
import { seeded, sequence } from './dice.js';
import { active, battleToken, currentUnit } from './state-helpers.js';
import type { BattleAction } from './actions.js';
import { reducePlanning, setBattleMode } from './planning.js';

export function startDebugGame(seed: number, run = 1, fixture = false): GameState {
  const state = emptyState(run);
  return { ...state, screen: 'battle-debug', battleMode: 'idle', battle: createBattle(debugBattle, combatants,
    fixture ? sequence([1, 20, 1, 13, 2]) : seeded(seed), run,
    fixture ? { hero: { col: 1, row: 2 }, sample_target_a: { col: 2, row: 2 }, sample_target_b: { col: 6, row: 4 } } : undefined) };
}
export type DebugAction = BattleAction;
export function reduceDebugGame(state: GameState, action: DebugAction, fixture = false): { state: GameState; rejectedReason?: string } {
  const battle = state.battle;
  if (state.screen !== 'battle-debug' || !battle) return { state, rejectedReason: '当前不是战斗调试场' };
  if (action.type === 'plan') return reducePlanning(state, action);
  if (action.type === 'command') {
    const result = reduceBattle(battle, action.envelope);
    return result.state === battle ? { state, rejectedReason: result.rejectedReason } : { state: { ...state, battle: result.state, movementDraft: undefined,
      battleMode: ['step', 'react', 'advance-turn'].includes(action.envelope.command.kind) ? state.battleMode : 'idle' } };
  }
  if (action.token !== battleToken(battle)) return { state, rejectedReason: '操作已过期' };
  if (action.type === 'continue-story') return { state, rejectedReason: '独立调试场没有剧情返回点' };
  if (action.type === 'restart') return { state: startDebugGame(battle.seed, state.run + 1, fixture) };
  if (battle.result || battle.pendingMove || battle.pendingReaction || battle.pendingRoll || battle.opening || currentUnit(battle).team !== 'player' || !active(currentUnit(battle))) return { state, rejectedReason: '当前不能切换操作模式' };
  if (state.battleMode === action.mode) return { state };
  return { state: setBattleMode(state, action.mode) };
}
