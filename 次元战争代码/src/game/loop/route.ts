import { locationById } from '../../content/map-locations.js';
import { focusCamera, mapViewport } from '../map-camera.js';
import { battleToken } from '../battle/state-helpers.js';
import { warning } from '../state.js';
import type { GameState, Transition } from '../state.js';
import { openEncounter, settleEncounter } from './encounters.js';
import { advanceLoop } from './progress.js';
import { events, items } from './config.js';
import type { LoopAction, LoopCheckpoint, LoopIntent } from './types.js';

export const loopToken = (state: GameState) => state.run + ':loop:' + state.sequence;
export type LoopTransition = Transition & { rejectedReason?: string };

export function showLoop(state: GameState, checkpoint: LoopCheckpoint, intent?: LoopIntent): LoopTransition {
  const phase = checkpoint.phase, screen = phase.kind === 'city' ? 'map' : 'loop';
  const switched = state.screen !== screen;
  const preference = 'high_school';
  const map = state.postPrologue && state.map ? { ...state.map, unlock: false } : {
    selected: preference, camera: focusCamera(locationById(preference).position), viewport: { ...mapViewport }, popupOpen: false, unlock: false,
  } as const;
  const next: GameState = {
    ...state, screen, map, run: state.run + Number(switched), sequence: state.sequence + 1, postPrologue: checkpoint, postBattle: undefined,
    battle: undefined, battleMode: undefined, battleReturn: undefined, movementDraft: undefined, activeLevelId: undefined,
    actors: {}, branch: undefined, waiting: null, backgroundId: '', bgmId: '', warnings: { ...state.warnings }, loopNotice: undefined,
  };
  const effects: Transition['effects'] = switched ? [{ kind: 'bgm', id: '' }] : [];
  if (phase.kind === 'intro' || phase.kind === 'interlude' || phase.kind === 'crisis' || phase.kind === 'settlement') {
    warning(next, effects, 'loop:' + checkpoint.cycle + ':' + phase.kind, '序幕后剧情尚未接入，显示流程占位。');
  }
  if (phase.kind === 'deploy') warning(next, effects, 'loop:encounter:' + phase.encounter, '棋盘与敌人为演示暂定配置。');
  if (intent?.kind === 'event' && phase.kind !== 'deploy') {
    const event = events.find(event => event.id === intent.id)!;
    next.loopNotice = event.label + '已完成' + (event.reward ? ' · +' + event.reward + ' 资金' : '');
    if (event.once && !event.reward) warning(next, effects, 'loop:event:' + event.id, event.label + '使用演示占位。');
  }
  if (intent?.kind === 'buy') next.loopNotice = '已购入 ' + items[intent.id].name;
  if (intent?.kind === 'respec') next.loopNotice = '构筑已应用，消耗一个时段';
  if (intent?.kind === 'rest') next.loopNotice = intent.rest === 'long' ? '已完成长休' : '已完成短休';
  return { state: next, effects };
}

export function reduceLoopRoute(state: GameState, action: LoopAction): LoopTransition {
  const reject = (rejectedReason: string) => ({ state, effects: [], rejectedReason });
  const loop = state.postPrologue;
  if (!loop || (state.screen !== 'map' && state.screen !== 'loop') || action.token !== loopToken(state)) return reject('行动已过期');
  if (state.system?.panel || state.system?.stale || state.system?.pending || state.progress?.status === 'saving')
    return reject('请等待当前存档或返回游戏');
  const { intent } = action;
  if (intent.kind === 'deploy') {
    if (loop.phase.kind !== 'deploy' || (intent.withLink && loop.linkUses < 1)) return reject('当前阵容不可出战');
    const session = (state.battleSerial ?? 0) + 1;
    return { state: { ...state, screen: 'battle', run: state.run + 1, battleSerial: session, battleMode: 'idle',
      postBattle: { session, withLink: intent.withLink }, battle: openEncounter(loop, loop.phase.encounter, intent.withLink, session) }, effects: [] };
  }
  const location = state.map?.popupOpen ? state.map.selected : undefined;
  const next = advanceLoop(loop, intent, location);
  return next ? showLoop(state, next, intent) : reject('当前无法执行该行动');
}

export function finishLoopBattle(state: GameState, token: string): LoopTransition {
  if (state.screen !== 'battle' || !state.battle || token !== battleToken(state.battle) || state.system?.panel
    || state.system?.stale || state.system?.pending) return { state, effects: [], rejectedReason: '战斗结算已过期' };
  const next = settleEncounter(state);
  return next ? showLoop(state, next) : { state, effects: [], rejectedReason: '请在战斗胜利后结算' };
}
