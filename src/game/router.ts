import { connectCall, reduceCampaign } from './campaign.js';
import type { CampaignAction, CampaignTransition } from './campaign.js';
import { emptyState } from './state.js';
import type { GameState, StoryLibrary } from './state.js';
import { completionFlags, mergeFlags } from './save-format.js';
import type { ProgressState } from './save-format.js';
import type { SaveOutcome, SaveRequest } from './save-storage.js';
import { mergeV2, normalizedCheckpoint } from './save-v2.js';
import type { Checkpoint, SaveReadV2, SaveV2 } from './save-v2.js';
import { resumeScene } from './story/restore.js';
import { currentLevel, levelById, levelIds, levels } from '../content/levels.js';
import { locationById } from '../content/map-locations.js';
import { focusCamera, mapViewport } from './map-camera.js';
import { reduceMapNavigation } from './map-navigation.js';
import type { MapAction } from './map-navigation.js';
import { chapterEntryError, checkpointScene, sceneEntryError } from './story/chapter-policy.js';

type SimpleNavigation = 'open-map' | 'main-menu' | 'resume' | 'ask-replace' | 'cancel-replace' | 'confirm-replace';
export type NavigationAction = { [T in SimpleNavigation]: { type: T; token: string } }[SimpleNavigation]
  | { type: 'enter-level'; token: string; levelId: string }
  | MapAction;
export type AppAction = NavigationAction | { type: 'play'; run: number; action: CampaignAction }
  | { type: 'save-result'; run: number; revision: number; outcome: SaveOutcome }
  | { type: 'external-save'; read: SaveReadV2 };
export type AppTransition = CampaignTransition & { saves?: SaveRequest[] };
export function navigationToken(state: GameState) { return `${state.run}:${state.progress?.navigation ?? 0}:${state.screen}`; }

function absorb(state: GameState, read: SaveReadV2): GameState {
  const p = state.progress!;
  if (read.kind === 'migration') return { ...state, flags: mergeFlags(state.flags, read.data.flags), progress: { ...p,
    completedLevelIds: [...read.data.completedLevelIds], draft: read.data, status: 'migrating', confirming: false,
    message: '正在迁移旧进度，原 v1 存档将只读保留…' } };
  if (read.kind === 'valid') {
    const flags = mergeFlags(state.flags, read.data.flags);
    const completed = p.completedLevelIds.length > read.data.completedLevelIds.length ? p.completedLevelIds : read.data.completedLevelIds;
    return { ...state, flags, progress: { ...p, checkpoint: read.data, completedLevelIds: [...completed],
      status: 'ready', message: '', blockedRaw: undefined, blockedKey: undefined, confirming: false } };
  }
  return { ...state, progress: { ...p, checkpoint: read.kind === 'empty' ? undefined : p.checkpoint,
    status: read.kind === 'invalid' ? 'blocked' : read.kind === 'empty' ? 'empty' : 'error',
    message: 'message' in read ? read.message : '',
    blockedRaw: read.kind === 'invalid' ? read.raw : undefined, blockedKey: read.kind === 'invalid' ? read.key : undefined, confirming: false } };
}
function migration(state: GameState): AppTransition {
  const revision = state.progress!.request + 1;
  return { state: { ...state, progress: { ...state.progress!, request: revision } }, effects: [], saves: [{ kind: 'migrate', run: state.run, revision }] };
}
export function startApp(seed: number, read: SaveReadV2): AppTransition {
  const progress: ProgressState = { completedLevelIds: [], status: 'empty', message: '', confirming: false, request: 0, navigation: 0 };
  const state = absorb({ ...emptyState(), screen: 'menu', campaignSeed: seed >>> 0, battleSerial: 0, progress }, read);
  return read.kind === 'migration' ? migration(state) : { state, effects: [] };
}
function memoryPoint(state: GameState): Checkpoint {
  const p = state.progress!;
  const point = (p.status === 'blocked' || p.status === 'error' || p.status === 'saving' ? p.draft : undefined)?.checkpoint ?? p.checkpoint?.checkpoint ?? { kind: 'map' };
  return normalizedCheckpoint(point, p.completedLevelIds);
}
function save(state: GameState, now: number, point?: Checkpoint, replace?: { key: 'v1' | 'v2'; raw: string }): AppTransition {
  const p = state.progress!;
  const checkpoint = normalizedCheckpoint(point ?? (state.activeLevelId ? { kind: 'level', levelId: state.activeLevelId, sceneId: checkpointScene(state) } : memoryPoint(state)), p.completedLevelIds);
  const data: SaveV2 = { version: 2, flags: { ...state.flags }, completedLevelIds: [...p.completedLevelIds], checkpoint, savedAt: now };
  const revision = p.request + 1, blocked = p.status === 'blocked' && replace === undefined;
  return { effects: [], state: { ...state, progress: { ...p, draft: data, request: revision, confirming: false,
    status: blocked ? 'blocked' : 'saving', message: blocked ? p.message : '', replacement: replace } },
    saves: blocked ? [] : [{ kind: 'save', run: state.run, revision, data, replace }] };
}
function destination(previous: GameState, screen: 'menu' | 'map', unlock = false): GameState {
  const p = previous.progress!, target = currentLevel(p.completedLevelIds) ?? levels[levels.length - 1]!;
  return { ...previous, screen, run: previous.run + 1, activeLevelId: undefined, waiting: null, branch: undefined,
    battle: undefined, battleReturn: undefined, battleMode: undefined, movementDraft: undefined, actors: {}, backgroundId: '', bgmId: '',
    map: { selected: target.locationId, camera: focusCamera(locationById(target.locationId).position), viewport: { ...mapViewport }, popupOpen: false, unlock },
    progress: { ...p, navigation: p.navigation + 1 } };
}
function handoff(previous: GameState, next: GameState): AppTransition {
  const p = previous.progress!;
  if (p.status === 'saving' && p.draft) {
    const data = mergeV2({ ...p.draft, flags: next.flags, completedLevelIds: next.progress!.completedLevelIds }, p.draft);
    next.progress = { ...next.progress!, draft: data, request: p.request + 1 };
    return { state: next, effects: [{ kind: 'bgm', id: '' }], saves: [{ kind: 'save', run: next.run, revision: p.request + 1, data, replace: p.replacement }] };
  }
  return { state: next, effects: [{ kind: 'bgm', id: '' }] };
}
function begin(previous: GameState, library: StoryLibrary, levelId: string, sceneId: string, now: number): AppTransition {
  const level = levelById(levelId)!;
  const error = chapterEntryError(level.actId, previous.flags) ?? sceneEntryError(level.actId, sceneId);
  if (error) return { state: previous, effects: [], rejectedReason: error };
  const transition = connectCall(resumeScene(previous, library, level.actId, sceneId, previous.run + 1, level.id));
  transition.state.progress = { ...previous.progress!, navigation: previous.progress!.navigation + 1, confirming: false };
  const saved = save(transition.state, now);
  return { ...saved, effects: transition.effects };
}
function complete(transition: AppTransition, now: number): AppTransition {
  const state = transition.state, p = state.progress!, id = transition.completedLevelId!;
  const index = levelIds.indexOf(id), accepted = index === p.completedLevelIds.length;
  if (index > p.completedLevelIds.length) return { state, effects: transition.effects, rejectedReason: '不能越过当前关卡结算' };
  const completedLevelIds = accepted ? [...p.completedLevelIds, id] : p.completedLevelIds;
  const flags = { ...state.flags };
  if (id === 'prologue_03') flags[completionFlags.prologue] = true;
  if (id === 'act1_04') flags[completionFlags.act1] = true;
  const next = destination({ ...state, flags, progress: { ...p, completedLevelIds } }, 'map', accepted && completedLevelIds.length < levels.length);
  const saved = save(next, now, { kind: 'map' });
  return { ...saved, effects: [...transition.effects, { kind: 'bgm', id: '' }] };
}
export function reduceApp(previous: GameState, action: AppAction, library: StoryLibrary, now: number): AppTransition {
  const same = (): AppTransition => ({ state: previous, effects: [] });
  const p = previous.progress;
  if (!p || previous.screen === 'battle-debug') return same();
  if (action.type === 'save-result') {
    if (action.run !== previous.run || action.revision !== p.request || action.outcome.kind === 'stale') return same();
    if (action.outcome.kind === 'read') return { state: absorb(previous, action.outcome.read), effects: [] };
    const data = action.outcome.data, flags = mergeFlags(previous.flags, data.flags);
    const completed = p.completedLevelIds.length > data.completedLevelIds.length ? p.completedLevelIds : data.completedLevelIds;
    return { state: { ...previous, flags, progress: { ...p, checkpoint: data, draft: undefined, completedLevelIds: [...completed],
      status: 'saved', message: action.outcome.migrated ? '旧进度已迁移为 v2；v1 原件已保留。' : '', blockedRaw: undefined, blockedKey: undefined, replacement: undefined } }, effects: [] };
  }
  if (action.type === 'external-save') {
    if (action.read.kind === 'invalid' && p.status === 'saving' && p.replacement?.key === action.read.key && p.replacement.raw === action.read.raw) return same();
    if (action.read.kind === 'migration' && p.draft && (p.status === 'error' || p.status === 'saving')) {
      const draft = mergeV2(action.read.data, p.draft);
      return { state: { ...previous, flags: mergeFlags(previous.flags, draft.flags), progress: { ...p, draft,
        completedLevelIds: [...draft.completedLevelIds] } }, effects: [] };
    }
    const state = absorb(previous, action.read);
    if (action.read.kind === 'migration') return p.status === 'migrating' ? same() : migration(state);
    if (p.status === 'saving' && (action.read.kind === 'valid' || action.read.kind === 'empty')) state.progress = { ...state.progress!, status: 'saving' };
    if (p.status === 'error' && p.draft && (action.read.kind === 'valid' || action.read.kind === 'empty')) {
      state.progress = { ...state.progress!, status: 'error', message: p.message };
    }
    return { state, effects: [] };
  }
  if (action.type === 'play') {
    if (action.run !== previous.run || !previous.activeLevelId || (previous.screen !== 'story' && previous.screen !== 'battle') || p.confirming) return same();
    if (action.action.type === 'enter-act1' || (action.action.type === 'restart' && previous.screen === 'story')) return same();
    const transition = reduceCampaign(previous, action.action, library);
    if (transition.state === previous) return transition;
    const state = transition.state; state.progress = { ...p };
    if (transition.completedLevelId) return complete(transition, now);
    const moved = state.actId !== previous.actId || state.sceneId !== previous.sceneId;
    const resolved = state.screen === 'battle' && state.battle?.result && !previous.battle?.result;
    if (!(moved || resolved || action.action.type === 'choose' || action.action.type === 'continue-story')) return transition;
    const saved = save(state, now);
    return { ...saved, effects: transition.effects };
  }
  if (action.token !== navigationToken(previous) || p.status === 'migrating') return same();
  if (action.type === 'ask-replace') {
    if (p.status !== 'blocked') return same();
    return { state: { ...previous, progress: { ...p, confirming: true, navigation: p.navigation + 1 } }, effects: [] };
  }
  if (action.type === 'cancel-replace') return p.confirming ? { state: { ...previous, progress: { ...p, confirming: false, navigation: p.navigation + 1 } }, effects: [] } : same();
  if (action.type === 'confirm-replace') {
    if (!p.confirming || p.status !== 'blocked' || p.blockedRaw === undefined || !p.blockedKey) return same();
    return save({ ...previous, progress: { ...p, navigation: p.navigation + 1 } }, now, memoryPoint(previous), { key: p.blockedKey, raw: p.blockedRaw });
  }
  if (p.confirming) return same();
  if (action.type === 'enter-level') {
    const level = currentLevel(p.completedLevelIds);
    if (previous.screen !== 'map' || !level || action.levelId !== level.id) return same();
    const point = memoryPoint(previous);
    return begin(previous, library, level.id, point.kind === 'level' && point.levelId === level.id ? point.sceneId : level.sceneIds[0]!, now);
  }
  if (action.type === 'resume') {
    if (previous.screen !== 'menu' || !p.checkpoint || p.status === 'blocked' || p.status === 'saving') return same();
    const point = normalizedCheckpoint(p.checkpoint.checkpoint, p.completedLevelIds), level = currentLevel(p.completedLevelIds);
    return point.kind === 'level' && point.levelId === level?.id ? begin(previous, library, level.id, point.sceneId, now)
      : handoff(previous, destination(previous, 'map'));
  }
  if (action.type === 'open-map' || action.type === 'main-menu') {
    if ((action.type === 'main-menu' && previous.screen === 'menu') || (action.type === 'open-map' && previous.screen === 'map')) return same();
    const next = destination(previous, action.type === 'open-map' ? 'map' : 'menu');
    if (action.type === 'open-map' && !p.checkpoint && !p.draft) {
      const saved = save(next, now, { kind: 'map' }); return { ...saved, effects: [{ kind: 'bgm', id: '' }] };
    }
    return handoff(previous, next);
  }
  return { state: reduceMapNavigation(previous, action), effects: [] };
}
