import { locationById } from '../../content/map-locations.js';
import { focusCamera, mapViewport } from '../map-camera.js';
import { battleToken } from '../battle/state-helpers.js';
import { emptyState, warning } from '../state.js';
import type { FlagValue, GameState, StoryLibrary, Transition } from '../state.js';
import { openEncounter, settleEncounter } from './encounters.js';
import { advanceLoop, advanceSlot, visibleEvents } from './progress.js';
import { events, firstCycle, items, loopStoryActId } from './config.js';
import { loopStoryScenes } from './types.js';
import type { LoopAction, LoopCheckpoint, LoopIntent, LoopStoryScene } from './types.js';
import { startScene } from '../story/player.js';

export const loopToken = (state: GameState) => state.run + ':loop:' + state.sequence;
export type LoopTransition = Transition & { rejectedReason?: string };

/** V102 的过夜触发条件：读完羁绊一的图书馆场景，但还没有完成深夜直播幕。 */
export const vtuberNightPending = (flags: Readonly<Record<string, FlagValue>>) =>
  flags.vtuber_bond1_library_done === true && flags.vtuber_bond1_complete !== true;

const meetingDue = (loop: LoopCheckpoint, flags: Readonly<Record<string, FlagValue>>) =>
  loop.cycle === 0 && loop.phase.kind === 'city' && loop.day === firstCycle.meetingDay && loop.slot === 'night'
  && flags.thief_invitation_received === true && flags.thief_bond1_complete !== true;

export function enterLoopStory(
  state: GameState, checkpoint: LoopCheckpoint, actId: string, sceneId: string, library: StoryLibrary,
): LoopTransition {
  const next: GameState = { ...state, ...emptyState(state.run + 1), screen: 'story', actId, sceneId,
    flags: { ...state.flags }, warnings: { ...state.warnings }, failedAssets: { ...state.failedAssets },
    postPrologue: checkpoint, activeLevelId: undefined, waiting: null };
  const transition = startScene(next, library);
  return { ...transition, state: { ...transition.state, postPrologue: checkpoint } };
}

function enterSavedStory(state: GameState, loop: LoopCheckpoint, scene: LoopStoryScene, library: StoryLibrary) {
  return enterLoopStory(state, { ...loop, storyScene: scene }, loopStoryActId(scene), scene, library);
}

export function resumeLoop(state: GameState, loop: LoopCheckpoint, library: StoryLibrary, intent?: LoopIntent): LoopTransition {
  const scene = loop.storyScene ?? (library[firstCycle.actId] && state.flags.prologue_4_complete === true
    ? loop.phase.kind === 'intro' ? 'm101' : meetingDue(loop, state.flags) ? 'm103' : undefined
    : undefined);
  return scene ? enterSavedStory(state, loop, scene, library) : showLoop(state, loop, intent);
}

/** 同一场剧情跨场景时同步更新场景头，读档不重新消耗时段。 */
export function recordLoopStoryScene(state: GameState): void {
  const loop = state.postPrologue;
  const scene = loopStoryScenes.find(id => id === state.sceneId);
  if (loop?.storyScene && scene && loop.storyScene !== scene) state.postPrologue = { ...loop, storyScene: scene };
}

function afterLoopChange(state: GameState, before: LoopCheckpoint, after: LoopCheckpoint, library: StoryLibrary, intent?: LoopIntent) {
  const overnights = before.phase.kind === 'city' && (before.day !== after.day || after.phase.kind === 'crisis'
    || (after.phase.kind === 'interlude' && after.phase.moment === 'night'));
  return overnights && vtuberNightPending(state.flags)
    ? enterSavedStory(state, after, 'v102', library) : resumeLoop(state, after, library, intent);
}

export function finishLoopStory(state: GameState, library: StoryLibrary): LoopTransition {
  const { storyScene, ...loop } = state.postPrologue!;
  if (!storyScene) return resumeLoop(state, loop, library);
  if (state.waiting?.kind !== 'end' || state.sceneId !== storyScene) {
    return { state, effects: [], rejectedReason: '请先完成当前场景' };
  }
  if (storyScene === 'm102') return resumeLoop(state, advanceLoop(loop, { kind: 'ack' })!, library);
  if (storyScene === 't103') return afterLoopChange(state, loop, advanceSlot(loop), library);
  return resumeLoop(state, loop, library);
}

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
    const key = phase.kind === 'interlude' ? 'interlude:' + phase.moment : phase.kind;
    warning(next, effects, 'loop:' + checkpoint.cycle + ':' + key, '本段剧情待制作，显示流程占位。');
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

export function reduceLoopRoute(state: GameState, action: LoopAction, library: StoryLibrary): LoopTransition {
  const reject = (rejectedReason: string) => ({ state, effects: [], rejectedReason });
  const loop = state.postPrologue;
  if (!loop || (state.screen !== 'map' && state.screen !== 'loop') || action.token !== loopToken(state)) return reject('行动已过期');
  if (state.system?.panel || state.system?.stale || state.system?.pending || state.progress?.status === 'saving')
    return reject('请等待当前存档或返回游戏');
  const { intent } = action;
  if (loop.storyScene || meetingDue(loop, state.flags)) return resumeLoop(state, loop, library);
  if (intent.kind === 'skip_day' && meetingDue({ ...loop, slot: 'night' }, state.flags))
    return resumeLoop(state, { ...loop, slot: 'night' }, library);
  if (intent.kind === 'deploy') {
    if (loop.phase.kind !== 'deploy' || (intent.withLink && loop.linkUses < 1)) return reject('当前阵容不可出战');
    const session = (state.battleSerial ?? 0) + 1;
    return { state: { ...state, screen: 'battle', run: state.run + 1, battleSerial: session, battleMode: 'idle',
      postBattle: { session, withLink: intent.withLink }, battle: openEncounter(loop, loop.phase.encounter, intent.withLink, session) }, effects: [] };
  }
  const location = state.map?.popupOpen ? state.map.selected : undefined;
  if (intent.kind === 'event' && location) {
    const event = visibleEvents(loop, location, state.flags).find(candidate => candidate.id === intent.id);
    if (event?.id === 'thief_bond1') return enterSavedStory(state, loop, 't101', library);
    // 剧情入口按一次行动结算：先推进时段，结束后回到已经消耗过时段的循环节点。
    if (event?.story) return enterLoopStory(state, advanceSlot(loop), event.story.actId, event.story.sceneId, library);
  }
  const next = advanceLoop(loop, intent, location, state.flags);
  if (!next) return reject('当前无法执行该行动');
  return afterLoopChange(state, loop, next, library, intent);
}

export function finishLoopBattle(state: GameState, token: string, library: StoryLibrary): LoopTransition {
  if (state.screen !== 'battle' || !state.battle || token !== battleToken(state.battle) || state.system?.panel
    || state.system?.stale || state.system?.pending) return { state, effects: [], rejectedReason: '战斗结算已过期' };
  const next = settleEncounter(state);
  return next ? afterLoopChange(state, state.postPrologue!, next, library) : { state, effects: [], rejectedReason: '请在战斗胜利后结算' };
}
