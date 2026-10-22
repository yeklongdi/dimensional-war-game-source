import { AudioController } from './audio.js';
import { textInterval } from './story/config.js';
import { storyLibrary } from './story/library.js';
import type { CampaignAction } from './campaign.js';
import { navigationToken, reduceApp, startApp } from './router.js';
import type { AppAction, AppTransition, NavigationAction } from './router.js';
import { browserSaveStore } from './save-storage.js';
import type { SaveStore } from './save-storage.js';
import { saveKey } from './save-format.js';
import { saveKeyV2 } from './save-v2.js';
import { currentLevel } from '../content/levels.js';
import { PlayerView } from './ui/player-view.js';
import { BattleView } from './ui/battle-view.js';
import { MenuView } from './ui/menu-view.js';
import { MapView } from './ui/map-view.js';
import { AppChrome } from './ui/app-chrome.js';
import { chooseAi } from './battle/ai.js';
import { battleToken } from './battle/state-helpers.js';
import type { Command, Envelope } from './battle/types.js';
import { readSeed } from './battle/controller.js';

export type PlayerPorts = { store?: SaveStore; now?: () => number; randomSeed?: () => number };
/** 单个状态、活动视图与音频实例；时钟、存储和随机源均是 IO 边界。 */
export function mountPlayer(root: HTMLElement, search = new URLSearchParams(location.search), ports: PlayerPorts = {}) {
  const store = ports.store ?? browserSaveStore(storyLibrary), now = ports.now ?? Date.now;
  const parsed = readSeed(search.get('seed'), ports.randomSeed ?? (() => crypto.getRandomValues(new Uint32Array(1))[0]!));
  if (parsed.warning) console.warn(`[次元战争:seed] ${parsed.warning}`);
  const initial = startApp(parsed.seed, store.read());
  let state = initial.state;
  let timer: number | undefined, battleTimer: number | undefined;
  let timerToken = '', dispatching = false, disposed = false, audioScope = state.run;
  let view: PlayerView | BattleView | MenuView | MapView | undefined, chrome: AppChrome | undefined;
  let viewKey = '';
  const queue: AppAction[] = [], printedWarnings = new Set<string>();
  const audio = new AudioController((id, message) => play({ type: 'asset-failed', id, message }, audioScope));
  root.append(audio.element);

  function syncClock() {
    const waiting = state.waiting;
    const typing = !state.progress?.confirming && state.screen === 'story' && waiting?.kind === 'text' && waiting.revealed < Array.from(waiting.text).length;
    const nextToken = typing ? waiting.token : '';
    if (timerToken === nextToken) return;
    if (timer !== undefined) window.clearInterval(timer);
    timerToken = nextToken; timer = undefined;
    if (!typing) return;
    const run = state.run;
    timer = window.setInterval(() => {
      if (disposed || state.run !== run || state.screen !== 'story' || state.waiting?.kind !== 'text' || state.waiting.token !== nextToken) return;
      play({ type: 'reveal', token: nextToken, count: state.waiting.revealed + 1 }, run);
    }, textInterval);
  }
  function syncBattleClock() {
    if (battleTimer !== undefined) window.clearTimeout(battleTimer);
    battleTimer = undefined;
    const battle = state.battle;
    if (state.progress?.confirming || state.screen !== 'battle' || !battle || battle.result || battle.pendingRoll || battle.pendingReaction) return;
    let command: Command | undefined, origin: Envelope['origin'] = 'system';
    if (battle.opening) command = { kind: 'finish-opening' };
    else if (battle.pendingMove) command = { kind: 'step' };
    else if (battle.awaitingEnd) command = { kind: 'advance-turn' };
    else { command = chooseAi(battle); origin = 'ai'; }
    if (!command) return;
    const token = battleToken(battle), planned = command, run = state.run;
    battleTimer = window.setTimeout(() => {
      if (disposed || state.run !== run || state.screen !== 'battle' || !state.battle || battleToken(state.battle) !== token) return;
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
    if (action.type === 'resume' || action.type === 'enter-level' || action.type === 'open-map') dispatch({ type: 'external-save', read: store.read() });
    dispatch(action);
  }
  function commit(transition: AppTransition, force = false) {
    if (!force && state === transition.state) return;
    const runChanged = force || state.run !== transition.state.run;
    state = transition.state;
    if (runChanged) { audio.resetSession(); audioScope = state.run; }
    const nextView = `${state.run}:${state.screen}`;
    if (viewKey !== nextView) {
      view?.dispose(); audio.stopSfx(); viewKey = nextView;
      const scope = state.run;
      if (state.screen === 'story') view = new PlayerView(root, action => play(action, scope), () => audio.unlock(), () => {
        if (state.run === scope) navigate({ type: 'open-map', token: navigationToken(state) });
      });
      else if (state.screen === 'battle') view = new BattleView(root, action => play(action, scope));
      else if (state.screen === 'map') view = new MapView(root, navigate);
      else view = new MenuView(root, navigate);
      chrome = new AppChrome(view.stage, navigate);
    }
    view!.render(state); chrome!.render(state); syncClock(); syncBattleClock();
    for (const effect of transition.effects) {
      if (effect.kind === 'bgm') audio.setBgm(effect.id);
      else if (effect.kind === 'sfx') audio.playSfx(effect.id);
      else if (effect.kind === 'warn' && !printedWarnings.has(effect.key)) {
        printedWarnings.add(effect.key); console.warn(`[次元战争:${effect.key}] ${effect.message}`);
      }
    }
    for (const request of transition.saves ?? []) {
      void store.write(request, () => !disposed && state.run === request.run && state.progress?.request === request.revision)
        .then(outcome => { if (!disposed) dispatch({ type: 'save-result', run: request.run, revision: request.revision, outcome }); });
    }
  }
  function dispatch(action: AppAction) {
    if (disposed) return;
    queue.push(action);
    if (dispatching) return;
    dispatching = true;
    try {
      while (queue.length) {
        const transition = reduceApp(state, queue.shift()!, storyLibrary, now());
        if (transition.rejectedReason && view instanceof BattleView) view.showHint(transition.rejectedReason);
        commit(transition);
      }
    } finally { dispatching = false; }
  }
  const keydown = (event: KeyboardEvent) => {
    if (disposed || state.progress?.confirming || state.screen !== 'story' || event.repeat || event.isComposing) return;
    if (event.target instanceof Element && event.target.closest('.app-chrome, .dev-overlay, button')) return;
    if (event.code === 'Backquote' || event.key === '~') { event.preventDefault(); play({ type: 'toggle-debug' }); return; }
    if (event.code !== 'Space' && event.key !== 'Enter') return;
    if (state.waiting?.kind === 'choice') { event.preventDefault(); return; }
    audio.unlock();
    if (state.waiting?.kind === 'text') { event.preventDefault(); play({ type: 'advance', token: state.waiting.token }); }
  };
  const storageChanged = (event: StorageEvent) => {
    if (event.key === saveKeyV2 || event.key === saveKey || event.key === null) dispatch({ type: 'external-save', read: store.read() });
  };
  document.addEventListener('keydown', keydown); window.addEventListener('storage', storageChanged);
  commit(initial, true);
  return () => {
    disposed = true; queue.length = 0;
    if (timer !== undefined) window.clearInterval(timer);
    if (battleTimer !== undefined) window.clearTimeout(battleTimer);
    document.removeEventListener('keydown', keydown); window.removeEventListener('storage', storageChanged);
    view?.dispose(); audio.dispose();
  };
}
