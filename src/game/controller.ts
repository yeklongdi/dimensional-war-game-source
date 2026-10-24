import { AudioController } from './audio.js';
import '../styles/system.css';
import { storyLibrary } from './story/library.js';
import type { CampaignAction } from './campaign.js';
import { navigationToken } from './router.js';
import type { NavigationAction } from './router.js';
import { hydrateRuntime, paused, reduceRuntime, systemToken } from './runtime.js';
import { currentForwardAction, textClockPlan } from './fast-forward.js';
import type { GameAction, RuntimeTransition } from './runtime.js';
import { browserStorage } from './vault-storage.js';
import { browserStoryVaultStore, saveKeyV4 } from './save-v4.js';
import type { VaultStore } from './vault-storage.js';
import { saveKeyV3 } from './save-v3.js';
import { createSettingsStore, settingsKey } from './settings.js';
import type { SettingsStore } from './settings.js';
import { saveKey } from './save-format.js';
import { saveKeyV2 } from './save-v2.js';
import { currentLevel } from '../content/levels.js';
import { PlayerView } from './ui/player-view.js';
import { BattleView } from './ui/battle-view.js';
import { MenuView } from './ui/menu-view.js';
import { MapView } from './ui/map-view.js';
import { AppChrome } from './ui/app-chrome.js';
import { SystemView } from './ui/system-view.js';
import { chooseAi } from './battle/ai.js';
import { battleToken } from './battle/state-helpers.js';
import type { Command, Envelope } from './battle/types.js';
import { readSeed } from './battle/controller.js';

export type PlayerPorts = { vault?: VaultStore; settingsStore?: SettingsStore; now?: () => number; randomSeed?: () => number; randomId?: () => string };
/** 单个状态、活动视图与音频实例；时钟、存储和随机源均是 IO 边界。 */
export function mountPlayer(root: HTMLElement, search = new URLSearchParams(location.search), ports: PlayerPorts = {}) {
  const store = ports.vault ?? browserStoryVaultStore(storyLibrary), now = ports.now ?? Date.now;
  const settingsStore = ports.settingsStore ?? createSettingsStore(browserStorage), newId = ports.randomId ?? (() => crypto.randomUUID());
  const parsed = readSeed(search.get('seed'), ports.randomSeed ?? (() => crypto.getRandomValues(new Uint32Array(1))[0]!));
  if (parsed.warning) console.warn(`[次元战争:seed] ${parsed.warning}`);
  const initial = hydrateRuntime(parsed.seed, store.read(), settingsStore.read(), newId(), storyLibrary);
  let state = initial.state;
  let timer: number | undefined, battleTimer: number | undefined;
  let timerToken = '', dispatching = false, disposed = false, audioScope = state.run;
  let view: PlayerView | BattleView | MenuView | MapView | undefined, chrome: AppChrome | undefined;
  let viewKey = '';
  const queue: GameAction[] = [], printedWarnings = new Set<string>();
  const audio = new AudioController((id, message) => play({ type: 'asset-failed', id, message }, audioScope));
  root.append(audio.element);
  const systemView = new SystemView(root, dispatch);

  function syncClock() {
    const plan = textClockPlan(state), nextToken = plan?.key ?? '';
    if (timerToken === nextToken) return;
    if (timer !== undefined) window.clearInterval(timer);
    timerToken = nextToken; timer = undefined;
    if (!plan) return;
    timer = window.setInterval(() => {
      if (disposed || paused(state) || state.run !== plan.run || state.screen !== 'story' || state.waiting?.kind !== 'text' || state.waiting.token !== plan.token || timerToken !== nextToken) return;
      if (plan.revision !== undefined) dispatch({ type: 'fast-forward', intent: 'tick', run: plan.run, revision: plan.revision, token: plan.token });
      else play({ type: 'reveal', token: plan.token, count: state.waiting.revealed + 1 }, plan.run);
    }, plan.delay);
  }
  function syncBattleClock() {
    if (battleTimer !== undefined) window.clearTimeout(battleTimer);
    battleTimer = undefined;
    const battle = state.battle;
    if (paused(state) || state.progress?.confirming || state.screen !== 'battle' || !battle || battle.result || battle.pendingRoll || battle.pendingReaction) return;
    let command: Command | undefined, origin: Envelope['origin'] = 'system';
    if (battle.opening) command = { kind: 'finish-opening' };
    else if (battle.pendingMove) command = { kind: 'step' };
    else if (battle.awaitingEnd) command = { kind: 'advance-turn' };
    else { command = chooseAi(battle); origin = 'ai'; }
    if (!command) return;
    const token = battleToken(battle), planned = command, run = state.run, menuRevision = state.system!.uiRevision;
    battleTimer = window.setTimeout(() => {
      if (disposed || paused(state) || state.system!.uiRevision !== menuRevision || state.run !== run || state.screen !== 'battle' || !state.battle || battleToken(state.battle) !== token) return;
      play({ type: 'command', envelope: { token, origin, command: planned } }, run);
    }, battle.opening ? 200 : battle.pendingMove ? 180 : 350);
  }
  function play(action: CampaignAction, run = state.run) { dispatch({ type: 'play', run, action }); }
  function navigate(action: NavigationAction) {
    if (action.token !== navigationToken(state)) return;
    const progress = state.progress;
    if (progress?.status === 'migrating') return;
    if (action.type === 'resume' && (state.screen !== 'menu' || !progress?.checkpoint || progress.status === 'saving' || progress.status === 'blocked')) return;
    if (action.type === 'enter-level' && (state.screen !== 'map' || action.levelId !== currentLevel(progress?.completedLevelIds ?? [])?.id || progress?.status === 'saving')) return;
    audio.unlock();
    if (action.type === 'enter-level' || action.type === 'open-map') dispatch({ type: 'vault-external', read: store.read() });
    dispatch(action);
  }
  function commit(transition: RuntimeTransition, force = false) {
    if (!force && state === transition.state) return;
    const runChanged = force || state.run !== transition.state.run;
    state = transition.state;
    if (runChanged) { audio.resetSession(); audioScope = state.run; }
    audio.setSettings(state.settings!);
    const nextView = `${state.run}:${state.screen}`;
    if (viewKey !== nextView) {
      view?.dispose(); audio.stopSfx(); viewKey = nextView;
      const scope = state.run;
      if (state.screen === 'story') view = new PlayerView(root, action => play(action, scope), () => audio.unlock(), () => {
        if (state.run === scope) navigate({ type: 'open-map', token: navigationToken(state) });
      }, undefined, intent => {
        if (state.run === scope) dispatch({ type: 'system', intent, token: `${state.run}:system:${state.system!.uiRevision}` });
      });
      else if (state.screen === 'battle') view = new BattleView(root, action => play(action, scope));
      else if (state.screen === 'map') view = new MapView(root, navigate);
      else view = new MenuView(root, dispatch);
      chrome = new AppChrome(view.stage, dispatch);
    }
    view!.render(state); chrome!.render(state); systemView.render(state); syncClock(); syncBattleClock();
    for (const effect of transition.effects) {
      if (effect.kind === 'bgm') audio.setBgm(effect.id);
      else if (effect.kind === 'sfx') audio.playSfx(effect.id);
      else if (effect.kind === 'warn' && !printedWarnings.has(effect.key)) {
        printedWarnings.add(effect.key); console.warn(`[次元战争:${effect.key}] ${effect.message}`);
      }
    }
    for (const request of transition.vaults ?? []) {
      void store.write(request, () => !disposed && (request.kind === 'auto'
        ? !state.system?.stale && state.system?.activeRunId === request.runId && state.run === request.session && state.progress?.request === request.revision
        : state.system?.pending?.id === request.id))
        .then(outcome => { if (!disposed) dispatch({ type: 'vault-result', request, outcome }); });
    }
    if (transition.settingsWrite) dispatch({ type: 'settings-result', revision: transition.settingsWrite.revision, message: settingsStore.write(transition.settingsWrite.data) });
  }
  function dispatch(action: GameAction) {
    if (disposed) return;
    if (action.type === 'play' || action.type === 'fast-forward') {
      const latest = store.read();
      if (latest.kind === 'valid' && state.system!.activeRunId && latest.data.activeRunId !== state.system!.activeRunId) queue.push({ type: 'vault-external', read: latest });
    }
    if (action.type === 'system') {
      audio.unlock();
      if (action.intent === 'reload' || action.intent === 'skip') queue.push({ type: 'vault-external', read: store.read() });
    }
    queue.push(action);
    if (dispatching) return;
    dispatching = true;
    try {
      while (queue.length) {
        const item = queue.shift()!;
        const transition = reduceRuntime(state, item, storyLibrary, now(), item.type === 'system' ? newId() : 'unused-identity');
        if (transition.rejectedReason && view instanceof BattleView) view.showHint(transition.rejectedReason);
        commit(transition);
      }
    } finally { dispatching = false; }
  }
  const keydown = (event: KeyboardEvent) => {
    if (disposed || paused(state) || state.progress?.confirming || event.repeat || event.isComposing) return;
    if (event.key === 'Escape' && (state.screen === 'story' || state.screen === 'battle')) {
      event.preventDefault(); event.stopImmediatePropagation();
      dispatch({ type: 'system', intent: 'open', token: systemToken(state) }); return;
    }
    if (state.screen !== 'story') return;
    if (event.target instanceof Element && event.target.closest('.app-chrome, .dev-overlay, button')) return;
    if (event.code === 'Backquote' || event.key === '~') { event.preventDefault(); play({ type: 'toggle-debug' }); return; }
    if (event.code !== 'Space' && event.key !== 'Enter') return;
    if (state.waiting?.kind === 'choice') { event.preventDefault(); return; }
    audio.unlock();
    if (state.waiting?.kind === 'text') { event.preventDefault(); play({ type: 'advance', token: state.waiting.token }); }
  };
  const storageChanged = (event: StorageEvent) => {
    if (event.key === saveKeyV4 || event.key === saveKeyV3 || event.key === saveKeyV2 || event.key === saveKey || event.key === null) dispatch({ type: 'vault-external', read: store.read() });
    if (event.key === settingsKey) { /* 偏好不自动覆盖当前窗口正在调节的值，刷新时读取最新持久设置。 */ }
  };
  const stopFast = () => { const action = currentForwardAction(state, 'stop'); if (action) dispatch(action); };
  const visibilityChanged = () => { if (document.hidden) stopFast(); };
  document.addEventListener('keydown', keydown, true); window.addEventListener('storage', storageChanged);
  window.addEventListener('blur', stopFast); document.addEventListener('visibilitychange', visibilityChanged);
  commit(initial, true);
  return () => {
    disposed = true; queue.length = 0;
    if (timer !== undefined) window.clearInterval(timer);
    if (battleTimer !== undefined) window.clearTimeout(battleTimer);
    document.removeEventListener('keydown', keydown, true); window.removeEventListener('storage', storageChanged);
    window.removeEventListener('blur', stopFast); document.removeEventListener('visibilitychange', visibilityChanged);
    view?.dispose(); systemView.dispose(); audio.dispose();
  };
}
