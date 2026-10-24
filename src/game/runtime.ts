import type { GameState, StoryLibrary } from './state.js';
import { navigationToken, reduceApp, startApp } from './router.js';
import type { AppAction, AppTransition } from './router.js';
import { normalizedCheckpoint } from './save-v2.js';
import type { SaveV2 } from './save-v2.js';
import { fingerprint, readSlot, slotValue } from './save-v3.js';
import type { VaultRead } from './save-v3.js';
import type { VaultRequest } from './vault-storage.js';
import { defaults, validSettings } from './settings.js';
import type { Settings, SettingsRead } from './settings.js';
import type { Confirmation, RuntimeAction, SystemAction, SystemState } from './system-types.js';
import { checkpointScene } from './story/chapter-policy.js';
import { forwardMatches, normalizeForward, skipReason, startForward, stopForward } from './fast-forward.js';
import { battleToken } from './battle/state-helpers.js';

export type RuntimeTransition = Omit<AppTransition, 'saves'> & { vaults?: VaultRequest[]; settingsWrite?: { revision: number; data: Settings } };
export type GameAction = AppAction | RuntimeAction;
export const systemToken = (s: GameState) => `${s.run}:system:${s.system?.uiRevision ?? 0}`;
export const paused = (s: GameState): boolean => !!s.system && (!!s.system.panel || s.system.stale || !!s.system.pending);
export function runtimeStart(seed: number, read: VaultRead, settings: SettingsRead, clientId: string): RuntimeTransition {
  const initial = startApp(seed, { kind: 'empty' });
  initial.state.settings = { ...settings.data };
  initial.state.system = { read, activeRunId: read.kind === 'valid' ? read.data.activeRunId : '', clientId,
    revision: 0, uiRevision: 0, stale: false, message: '', settingsMessage: settings.message, settingsRevision: 0 };
  return initial;
}
export function hydrateRuntime(seed: number, read: VaultRead, settings: SettingsRead, clientId: string, library: StoryLibrary): RuntimeTransition {
  const result = runtimeStart(seed, read, settings, clientId), s = result.state.system!;
  if (read.kind === 'valid') {
    const auto = readSlot(read.data.auto, library, read.data.revision);
    if (auto.kind === 'valid') result.state = { ...startApp(seed, { kind: 'valid', data: auto.record.data }).state, system: s, settings: settings.data };
    else { s.message = auto.kind === 'invalid' ? '自动档损坏；有效手动槽仍可读取，原槽未覆盖。' : ''; }
  } else if (read.kind === 'migration') {
    const request: VaultRequest = { kind: 'migrate', id: `${clientId}:init`, newId: `${clientId}:migration`, runId: '', session: result.state.run, revision: 1 };
    s.pending = request; s.revision = 1; s.message = '正在升级旧档为v3，v1／v2原件只读保留…'; result.vaults = [request];
  } else if ('message' in read) s.message = read.message;
  return result;
}
export function progressSnapshot(state: GameState, now: number): SaveV2 {
  const p = state.progress!;
  const checkpoint = state.activeLevelId ? { kind: 'level' as const, levelId: state.activeLevelId, sceneId: checkpointScene(state) }
    : (p.draft ?? p.checkpoint)?.checkpoint ?? { kind: 'map' as const };
  return { version: 2, flags: { ...state.flags }, completedLevelIds: [...p.completedLevelIds],
    checkpoint: normalizedCheckpoint(checkpoint, p.completedLevelIds), savedAt: now };
}
function wrap(t: AppTransition, system: SystemState, settings: Settings): RuntimeTransition {
  const { saves, ...rest } = t;
  return { ...rest, state: { ...t.state, system, settings }, vaults: saves?.map(r => ({ kind: 'auto', data: r.kind === 'save' ? r.data : t.state.progress!.draft!,
    id: `${system.clientId}:${system.activeRunId}:${r.run}:${r.revision}`, runId: system.activeRunId, session: r.run, revision: r.revision })) };
}
function request(state: GameState, confirmation: Confirmation, newId: string): RuntimeTransition {
  const s = state.system!, revision = s.revision + 1;
  const base = { id: `${s.clientId}:${s.activeRunId}:${state.run}:operation:${revision}`, runId: s.activeRunId, session: state.run, revision };
  const op: VaultRequest = confirmation.kind === 'manual' ? { ...base, kind: 'manual', slot: confirmation.slot,
    expected: confirmation.expected, data: confirmation.snapshot }
    : { ...base, kind: 'activate', slot: confirmation.slot, expected: confirmation.expected, data: confirmation.snapshot, newId, replaceRaw: confirmation.replaceRaw };
  return { state: { ...state, system: { ...s, confirmation, pending: op, revision, uiRevision: s.uiRevision + 1, message: '' } }, effects: [], vaults: [op] };
}
function result(state: GameState, action: Extract<RuntimeAction, { type: 'vault-result' }>, library: StoryLibrary, now: number): RuntimeTransition {
  const s = state.system!, p = state.progress!, op = action.request, outcome = action.outcome;
  const same = { state, effects: [] };
  if (outcome.kind === 'stale') return s.pending?.id === op.id
    ? { state: { ...state, system: { ...s, pending: undefined, uiRevision: s.uiRevision + 1, message: '该请求已过期，未改动存档；请重新操作。' } }, effects: [] } : same;
  const automatic = op.kind === 'auto';
  if (automatic ? op.runId !== s.activeRunId || op.session !== state.run || op.revision !== p.request : s.pending?.id !== op.id) return same;
  if (outcome.kind === 'error') return { state: { ...state,
    progress: automatic ? { ...p, status: 'error', message: outcome.message } : p,
    system: { ...s, pending: undefined, message: outcome.message, uiRevision: s.uiRevision + 1 } }, effects: [] };
  if (outcome.kind === 'conflict') {
    const foreign = outcome.read.kind === 'valid' && s.activeRunId !== outcome.read.data.activeRunId;
    const updated = { ...s, read: outcome.read, pending: undefined, message: outcome.message, stale: foreign, uiRevision: s.uiRevision + 1 };
    if (!foreign && s.confirmation && outcome.read.kind === 'valid') {
      updated.confirmation = { ...s.confirmation, expected: fingerprint(slotValue(outcome.read.data, s.confirmation.slot < 0 ? 0 : s.confirmation.slot)) };
    }
    return { state: { ...state, system: updated }, effects: [] };
  }
  const nextSystem: SystemState = { ...s, read: { kind: 'valid', data: outcome.data, legacy: s.read.legacy }, pending: undefined,
    message: '', uiRevision: s.uiRevision + Number(!automatic) };
  if (op.kind === 'activate' || op.kind === 'migrate') {
    const auto = readSlot(outcome.data.auto, library, outcome.data.revision);
    if (auto.kind !== 'valid') return { state: { ...state, system: { ...nextSystem, activeRunId: outcome.data.activeRunId, panel: undefined,
      message: '自动档损坏，请读取有效手动槽或确认新游戏。' } }, effects: [] };
    nextSystem.activeRunId = outcome.data.activeRunId; nextSystem.confirmation = undefined;
    nextSystem.panel = undefined; nextSystem.parent = undefined; nextSystem.stale = false;
    const base = startApp(state.campaignSeed!, { kind: 'valid', data: auto.record.data }).state;
    base.run = state.run + 1; base.system = nextSystem; base.settings = state.settings;
    if (op.kind === 'migrate') { nextSystem.message = '旧档已升级为v3；v1／v2原件均保留。'; return { state: base, effects: [{ kind: 'bgm', id: '' }] }; }
    return wrap(reduceApp(base, { type: 'resume', token: navigationToken(base) }, library, now), nextSystem, state.settings!);
  }
  if (op.kind === 'manual') return { state: { ...state, system: { ...nextSystem, panel: 'save', confirmation: undefined, message: `手动槽${op.slot}已保存。` } }, effects: [] };
  const auto = readSlot(outcome.data.auto, library, outcome.data.revision);
  if (auto.kind !== 'valid') return same;
  const t = reduceApp(state, { type: 'save-result', run: op.session, revision: op.revision, outcome: { kind: 'saved', data: auto.record.data } }, library, now);
  const read = s.read.kind === 'valid' && s.read.data.revision > outcome.data.revision ? s.read : nextSystem.read;
  return wrap(t, { ...nextSystem, read }, state.settings!);
}
function systemAction(state: GameState, a: SystemAction, library: StoryLibrary, now: number, newId: string): RuntimeTransition {
  const s = state.system!, same = { state, effects: [] };
  if (a.token !== systemToken(state)) return same;
  if (a.intent === 'reload') {
    const t = hydrateRuntime(state.campaignSeed!, s.read, { data: state.settings!, message: s.settingsMessage }, s.clientId, library);
    t.state.run = state.run + 1;
    t.state.system = { ...t.state.system!, revision: s.revision + 1, uiRevision: s.uiRevision + 1 };
    // 旧窗口明确接受最新活动运行，与显式选槽读档不同；不再次抢占新身份。
    if (s.stale && t.state.progress?.checkpoint && s.read.kind === 'valid')
      return wrap(reduceApp(t.state, { type: 'resume', token: navigationToken(t.state) }, library, now), t.state.system!, state.settings!);
    return t;
  }
  if (s.stale) return same;
  if (a.intent === 'cancel' || a.intent === 'back') {
    if (s.pending?.kind === 'migrate') return same;
    if (!s.panel && !s.pending) return same;
    const panel = s.confirmation ? s.confirmation.returnPanel ?? s.parent : s.panel === 'system' ? undefined : s.parent;
    return { state: { ...state, system: { ...s, panel, parent: panel ? s.parent : undefined,
      confirmation: undefined, pending: undefined, revision: s.revision + 1, uiRevision: s.uiRevision + 1, message: '' } }, effects: [] };
  }
  if (s.pending) return same;
  if (a.intent === 'skip') {
    if (s.panel !== 'system' || skipReason(state)) return same;
    const cleared = { ...state, system: { ...s, panel: undefined, parent: undefined, uiRevision: s.uiRevision + 1, message: '' } };
    if (state.screen === 'story' && state.waiting?.kind === 'text') return { state: startForward(cleared), effects: [] };
    const action = state.screen === 'battle' ? { type: 'skip-battle' as const, token: battleToken(state.battle!) }
      : { type: 'skip-call' as const, token: state.waiting!.token };
    return wrap(reduceApp(cleared, { type: 'play', run: state.run, action }, library, now), cleared.system, state.settings!);
  }
  if (a.intent === 'go-map' || a.intent === 'go-menu') {
    const cleared = { ...state, system: { ...s, panel: undefined, parent: undefined, uiRevision: s.uiRevision + 1 } };
    return wrap(reduceApp(cleared, { type: a.intent === 'go-map' ? 'open-map' : 'main-menu', token: navigationToken(cleared) }, library, now), cleared.system, state.settings!);
  }
  if (a.intent === 'open' || a.intent === 'load' || a.intent === 'save' || a.intent === 'settings') {
    if ((a.intent === 'open' || a.intent === 'save') && state.screen === 'menu') return same;
    return { state: { ...state, system: { ...s, panel: a.intent === 'open' ? 'system' : a.intent,
      parent: state.screen !== 'menu' ? 'system' : undefined, confirmation: undefined, uiRevision: s.uiRevision + 1, message: '' } }, effects: [] };
  }
  if (a.intent === 'confirm') return s.confirmation ? request(state, s.confirmation, newId) : same;
  if (a.intent === 'new') {
    if (state.screen !== 'menu') return same;
    const snapshot: SaveV2 = { version: 2, flags: {}, completedLevelIds: [], checkpoint: { kind: 'map' }, savedAt: now };
    const confirmation: Confirmation = { kind: 'new', slot: -1, expected: s.read.kind === 'valid' ? fingerprint(s.read.data.auto) : 'null', snapshot,
      replaceRaw: s.read.kind === 'invalid' ? s.read.raw : undefined };
    if (s.read.kind === 'empty' && !s.read.legacy?.length) return request(state, confirmation, newId);
    return { state: { ...state, system: { ...s, panel: 'confirm', confirmation, uiRevision: s.uiRevision + 1 } }, effects: [] };
  }
  if (a.intent === 'pick-load' || a.intent === 'pick-save') {
    const slot = a.slot;
    if (slot === undefined || !Number.isInteger(slot) || slot < 0 || slot > 6 || s.read.kind !== 'valid'
      || (a.intent === 'pick-save' && (slot === 0 || state.screen === 'menu')) || s.panel !== (a.intent === 'pick-save' ? 'save' : 'load')) return same;
    const raw = slotValue(s.read.data, slot), read = readSlot(raw, library, s.read.data.revision);
    if (a.intent === 'pick-load' && read.kind !== 'valid') return same;
    const confirmation: Confirmation = { kind: a.intent === 'pick-save' ? 'manual' : 'load', slot, expected: fingerprint(raw),
      snapshot: a.intent === 'pick-save' ? progressSnapshot(state, now) : read.kind === 'valid' ? read.record.data : progressSnapshot(state, now),
      returnPanel: a.intent === 'pick-save' ? 'save' : 'load' };
    if (a.intent === 'pick-save' && read.kind === 'empty') return request(state, confirmation, newId);
    return { state: { ...state, system: { ...s, panel: 'confirm', confirmation, uiRevision: s.uiRevision + 1 } }, effects: [] };
  }
  return same;
}
function runtimeCore(state: GameState, action: GameAction, library: StoryLibrary, now: number, newId: string): RuntimeTransition {
  const s = state.system; if (!s) return reduceApp(state, action as AppAction, library, now);
  if (action.type === 'fast-forward') {
    if (!forwardMatches(state, action)) return { state, effects: [] };
    if (action.intent === 'stop') return { state: stopForward(state), effects: [] };
    if (paused(state)) return { state, effects: [] };
    return wrap(reduceApp(state, { type: 'play', run: action.run, action: { type: 'advance', token: action.token } }, library, now), s, state.settings!);
  }
  if (state.fastForward && action.type === 'play' && action.action.type === 'advance') {
    return action.run === state.run && action.action.token === state.waiting?.token ? { state: stopForward(state), effects: [] } : { state, effects: [] };
  }
  if (action.type === 'system') return systemAction(state, action, library, now, newId);
  if (action.type === 'vault-result') return result(state, action, library, now);
  if (action.type === 'settings-change') {
    if (!validSettings(action.data) || s.panel !== 'settings') return { state, effects: [] };
    const revision = s.settingsRevision + 1;
    return { state: { ...state, settings: { ...action.data }, system: { ...s, settingsRevision: revision } }, effects: [], settingsWrite: { revision, data: action.data } };
  }
  if (action.type === 'settings-result') return action.revision === s.settingsRevision
    ? { state: { ...state, system: { ...s, settingsMessage: action.message } }, effects: [] } : { state, effects: [] };
  if (action.type === 'vault-external') {
    const foreign = action.read.kind === 'valid' && !!s.activeRunId && action.read.data.activeRunId !== s.activeRunId;
    const nextSystem = { ...s, read: action.read, stale: s.stale || foreign,
      message: foreign ? '其他窗口已切换活动进度。当前游玩已暂停，请重新载入。' : s.message };
    if (foreign || s.stale || action.read.kind !== 'valid') return { state: { ...state, system: nextSystem }, effects: [] };
    const auto = readSlot(action.read.data.auto, library, action.read.data.revision);
    return auto.kind === 'valid' ? wrap(reduceApp(state, { type: 'external-save', read: { kind: 'valid', data: auto.record.data } }, library, now), nextSystem, state.settings!)
      : { state: { ...state, system: nextSystem }, effects: [] };
  }
  const diagnostic = action.type === 'play' && ['warning', 'asset-failed'].includes(action.action.type);
  if ((paused(state) && !diagnostic && action.type !== 'resize-map') || (state.screen === 'menu' && (action.type === 'resume' || action.type === 'open-map'))) return { state, effects: [], rejectedReason: '系统菜单已暂停底层操作' };
  const t = reduceApp(state, action, library, now);
  return t.state === state ? t : wrap(t, s, state.settings ?? { ...defaults });
}

export function reduceRuntime(state: GameState, action: GameAction, library: StoryLibrary, now: number, newId = 'test-run-identity'): RuntimeTransition {
  const transition = runtimeCore(state, action, library, now, newId);
  return { ...transition, state: normalizeForward(transition.state) };
}
