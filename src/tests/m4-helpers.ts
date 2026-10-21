import type { GameState } from '../game/state.js';
import type { CampaignAction } from '../game/campaign.js';
import type { Command, Envelope } from '../game/battle/types.js';
import { battleToken, currentUnit } from '../game/battle/state-helpers.js';
import { chooseAi } from '../game/battle/ai.js';
import { navigationToken, reduceApp, startApp } from '../game/router.js';
import type { AppAction, NavigationAction } from '../game/router.js';
import type { SaveData } from '../game/save-format.js';
import { completionFlags, unlockedFrom } from '../game/save-format.js';
import { migrateV1 } from '../game/save-v2.js';
import { currentLevel } from '../content/levels.js';
import { storyLibrary } from '../game/story/library.js';
import { playerAttackPlan } from './campaign-helpers.js';

export function sampleSave(actId: 'prologue' | 'act1' = 'prologue', sceneId = actId === 'prologue' ? 'p003' : 'a010'): SaveData {
  const flags: Record<string, boolean> = actId === 'act1' ? { [completionFlags.prologue]: true } : {};
  return { actId, sceneId, flags, savedAt: 1792540800000, unlockedActs: unlockedFrom(flags) };
}
export function sampleV2(actId: 'prologue' | 'act1' = 'prologue', sceneId = actId === 'prologue' ? 'p003' : 'a010') {
  return migrateV1(sampleSave(actId, sceneId));
}
export function appAction(state: GameState, action: AppAction): GameState {
  const transition = reduceApp(state, action, storyLibrary, 1792540800100 + state.sequence);
  const request = transition.saves?.[0];
  const data = request?.kind === 'save' ? request.data : transition.state.progress?.draft;
  return request && data ? reduceApp(transition.state, { type: 'save-result', run: request.run, revision: request.revision,
    outcome: { kind: 'saved', data } }, storyLibrary, data.savedAt).state : transition.state;
}
export function navigate(state: GameState, type: Exclude<NavigationAction['type'], 'enter-level' | 'select-location' | 'focus-location' | 'pan-map' | 'zoom-map'>): GameState {
  return appAction(state, { type, token: navigationToken(state) });
}
export function enterLevel(state: GameState, levelId: string): GameState {
  return appAction(state, { type: 'enter-level', token: navigationToken(state), levelId });
}
export function play(state: GameState, action: CampaignAction): GameState {
  return appAction(state, { type: 'play', run: state.run, action });
}
export function battleCommand(state: GameState, command: Command, origin: Envelope['origin'] = 'player'): GameState {
  return play(state, { type: 'command', envelope: { token: battleToken(state.battle!), origin, command } });
}
export function freshApp(): GameState { return enterLevel(navigate(startApp(0, { kind: 'empty' }).state, 'open-map'), 'prologue_01'); }
export function appStep(state: GameState): GameState {
  if (state.screen === 'map') {
    const level = currentLevel(state.progress!.completedLevelIds);
    if (!level) throw new Error('主线已经完成');
    return enterLevel(state, level.id);
  }
  const battle = state.battle;
  if (state.screen === 'battle' && battle) {
    if (battle.result) {
      if (battle.result.outcome === 'lose') throw new Error(`测试路径失败 ${battle.id}`);
      return play(state, { type: 'continue-story', token: battleToken(battle) });
    }
    if (battle.pendingRoll) return battleCommand(state, { kind: 'inspire', dieIndex: null });
    if (battle.opening) return battleCommand(state, { kind: 'finish-opening' }, 'system');
    if (battle.pendingReaction) return battleCommand(state, { kind: 'react', take: true });
    if (battle.pendingMove) return battleCommand(state, { kind: 'step' }, 'system');
    if (battle.awaitingEnd) return battleCommand(state, { kind: 'advance-turn' }, 'system');
    return currentUnit(battle).team === 'enemy' ? battleCommand(state, chooseAi(battle)!, 'ai') : battleCommand(state, playerAttackPlan(battle));
  }
  const waiting = state.waiting;
  if (waiting?.kind === 'text') return play(state, { type: 'advance', token: waiting.token });
  if (waiting?.kind === 'choice') return play(state, { type: 'choose', token: waiting.token,
    index: state.sceneId === 'a007' || (state.sceneId === 'a010' && !state.flags.flag_act1_a010_03) ? 2 : 1 });
  throw new Error('没有可执行的测试步骤');
}
export function reachApp(predicate: (state: GameState) => boolean, initial = freshApp()): GameState {
  let state = initial;
  for (let i = 0; i < 2400; i++) {
    if (predicate(state)) return state;
    state = appStep(state);
  }
  throw new Error('未到达目标');
}
