import type { GameState } from './state.js';
import { unbuiltBattles } from './story/skip-policy.js';

export const fastForwardDelay = 300;
export type ForwardAction = { type: 'fast-forward'; intent: 'tick' | 'stop'; run: number; revision: number; token: string };
export function stopForward(state: GameState): GameState {
  return state.fastForward ? { ...state, fastForward: undefined } : state;
}
export function startForward(state: GameState): GameState {
  if (state.screen !== 'story' || state.waiting?.kind !== 'text') return state;
  const revision = (state.fastForwardSerial ?? 0) + 1;
  return normalizeForward({ ...state, fastForwardSerial: revision, fastForward: { run: state.run, revision } });
}
export function normalizeForward(state: GameState): GameState {
  if (!state.fastForward) return state;
  if (state.screen !== 'story' || state.waiting?.kind !== 'text' || state.fastForward.run !== state.run
    || state.system?.panel || state.system?.pending || state.system?.stale) return stopForward(state);
  const revealed = Array.from(state.waiting.text).length;
  return state.waiting.revealed === revealed ? state : { ...state, waiting: { ...state.waiting, revealed } };
}
export function currentForwardAction(state: GameState, intent: ForwardAction['intent']): ForwardAction | undefined {
  const fast = state.fastForward;
  return fast && state.waiting ? { type: 'fast-forward', intent, run: state.run, revision: fast.revision, token: state.waiting.token } : undefined;
}
export function forwardMatches(state: GameState, action: ForwardAction): boolean {
  return state.run === action.run && state.fastForward?.run === action.run && state.fastForward.revision === action.revision
    && state.waiting?.kind === 'text' && state.waiting.token === action.token;
}
export function skipReason(state: GameState): string {
  if (state.screen === 'battle' && state.battleReturn && state.battle) return '';
  if (state.screen !== 'story') return '此页面没有可跳过的剧情或战斗。';
  if (state.waiting?.kind === 'text') return '';
  if (state.waiting?.kind === 'blocked-call' && unbuiltBattles.includes(state.waiting.callId)) return '';
  return state.waiting?.kind === 'choice' ? '请先选择分支。' : '当前没有可跳过的正文或已批准的战斗。';
}
/** 文字计时的IO计划；菜单暂停与快进不改写普通文字速度。 */
export function textClockPlan(state: GameState) {
  const wait = state.waiting, fast = state.fastForward;
  if (state.screen !== 'story' || wait?.kind !== 'text' || state.progress?.confirming
    || state.system?.panel || state.system?.pending || state.system?.stale) return undefined;
  if (!fast && wait.revealed >= Array.from(wait.text).length) return undefined;
  const delay = fast ? fastForwardDelay : state.settings?.textMs ?? 30;
  return { run: state.run, token: wait.token, delay, revision: fast?.revision,
    key: `${state.run}:${wait.token}:${fast ? `fast:${fast.revision}` : 'typing'}:${delay}` };
}
