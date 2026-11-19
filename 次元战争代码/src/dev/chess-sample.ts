import '../styles/player.css';
import '../styles/menu.css';
import '../styles/battle.css';
import { BattleView } from '../game/ui/battle-view.js';
import { button, element } from '../game/ui/elements.js';
import { reduceDebugGame } from '../game/battle/debug-state.js';
import { chooseAi } from '../game/battle/ai.js';
import { battleToken, currentUnit } from '../game/battle/state-helpers.js';
import type { BattleAction } from '../game/battle/actions.js';
import type { Command, Envelope } from '../game/battle/types.js';
import { AudioController } from '../game/audio.js';
import { defaults } from '../game/settings.js';
import { chessSampleGame, scenarioNames } from './chess-sample-state.js';
import type { ChessScenario } from './chess-sample-state.js';
import type { GameState } from '../game/state.js';
import type { ChessAssetKey, ChessAssetUrls } from '../game/battle/chess-assets.js';

const root = document.querySelector<HTMLElement>('#app')!;
const urls: ChessAssetUrls = {};
for (const image of Array.from(document.querySelectorAll<HTMLImageElement>('[data-chess-asset]'))) urls[image.dataset.chessAsset as ChessAssetKey] = image.src;
const audio = new AudioController((_id, message) => console.warn(message));
audio.setSettings({ ...defaults, bgm: 0, sfx: 65 }); root.append(audio.element);
let scenario: ChessScenario = 'melee', serial = 0, game: GameState, view: BattleView;
let timer: number | undefined, disposed = false;
let sounds: { id: string; speed: number }[] = [];

function schedule() {
  if (timer !== undefined) window.clearTimeout(timer);
  timer = undefined;
  if (view.isPerforming || document.hidden || disposed) return;
  const battle = game.battle!;
  if (battle.result || battle.pendingReaction || battle.pendingRoll) return;
  let command: Command | undefined, origin: Envelope['origin'] = 'system';
  if (battle.pendingMove) command = { kind: 'step' };
  else if (battle.awaitingEnd) command = { kind: 'advance-turn' };
  else { command = chooseAi(battle); origin = 'ai'; }
  if (!command) return;
  const token = battleToken(battle), action = command;
  timer = window.setTimeout(() => {
    if (!disposed && !view.isPerforming && token === battleToken(game.battle!)) dispatch({ type: 'command', envelope: { token, origin, command: action } });
  }, battle.pendingMove ? 180 : 350);
}

function playSample() {
  if (view.isPerforming || currentUnit(game.battle!).id !== 'hero') return;
  const command: Command = scenario === 'cast' ? { kind: 'ability', actor: 'hero', ability: 'magic_missile', target: 'black_a' }
    : scenario === 'area' ? { kind: 'ability', actor: 'hero', ability: 'acid_splash', point: { col: 3, row: 2 } }
      : { kind: 'attack', actor: 'hero', target: 'black_a', attackId: 'unarmed', resource: 'action' };
  dispatch({ type: 'command', envelope: { token: battleToken(game.battle!), origin: 'player', command } });
}

function draw() {
  view.render(game);
  Object.assign(view.stage.dataset, { sampleScenario: scenario, sampleSnapshot: JSON.stringify(game.battle), sampleSounds: JSON.stringify(sounds) });
  const controls = element('nav', 'chess-sample-scenarios'); controls.setAttribute('aria-label', '样例场景');
  for (const [id, name] of Object.entries(scenarioNames)) {
    const node = button(name, 'sample-' + id, () => reset(id as ChessScenario));
    node.setAttribute('aria-pressed', String(scenario === id)); controls.append(node);
  }
  const play = button('播放交战', 'sample-play', () => { audio.unlock(); playSample(); });
  play.disabled = view.isPerforming || currentUnit(game.battle!).id !== 'hero' || !currentUnit(game.battle!).resources.action || Boolean(game.battle!.result);
  controls.append(play);
  const end = button('下一回合', 'sample-end', () => dispatch({ type: 'command', envelope: {
    token: battleToken(game.battle!), origin: 'player', command: { kind: 'end', actor: currentUnit(game.battle!).id } } }));
  end.disabled = view.isPerforming || currentUnit(game.battle!).team !== 'player' || Boolean(game.battle!.result); controls.append(end);
  view.stage.querySelector('.chess-sample-scenarios')?.remove(); view.stage.append(controls);
}

function dispatch(action: BattleAction) {
  if (disposed) return;
  if (action.type === 'restart') { reset(scenario); return; }
  if (view.isPerforming) { view.showHint('演出结束后可继续操作，支持 1×／2×／4× 加速'); return; }
  audio.unlock();
  const transition = reduceDebugGame(game, action);
  if (transition.state === game) { if (transition.rejectedReason) view.showHint(transition.rejectedReason); return; }
  game = transition.state; draw(); schedule();
}

function reset(next: ChessScenario) {
  if (timer !== undefined) window.clearTimeout(timer);
  view?.dispose(); audio.stopSfx(); sounds = []; scenario = next; game = chessSampleGame(next, ++serial);
  view = new BattleView(root, dispatch, undefined, id => {
    audio.unlock();
    sounds.push({ id, speed: view.presentationSpeed });
    view.stage.dataset.sampleSounds = JSON.stringify(sounds); audio.playSfx(id, view.presentationSpeed);
  }, { chess: true, title: '棋子 · 交战样例', assets: urls, onPresentationIdle: () => { draw(); schedule(); } });
  draw(); schedule();
}

const visibility = () => { if (!document.hidden) schedule(); };
document.addEventListener('visibilitychange', visibility);
reset('melee');
import.meta.hot?.dispose(() => {
  disposed = true; if (timer !== undefined) window.clearTimeout(timer);
  document.removeEventListener('visibilitychange', visibility); view.dispose(); audio.dispose();
});
