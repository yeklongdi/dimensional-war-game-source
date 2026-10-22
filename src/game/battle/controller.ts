import '../../styles/battle.css';
import { chooseAi } from './ai.js';
import { reduceDebugGame, startDebugGame } from './debug-state.js';
import type { DebugAction } from './debug-state.js';
import type { Command, Envelope } from './types.js';
import { battleToken } from './state-helpers.js';
import { BattleView } from '../ui/battle-view.js';

export function readSeed(text: string | null, generate: () => number): { seed: number; warning?: string } {
  if (text !== null && /^\d+$/.test(text) && Number(text) <= 0xFFFFFFFF) return { seed: Number(text) >>> 0 };
  const seed = generate() >>> 0;
  return { seed, ...(text === null ? {} : { warning: `无效 seed ${text}；已生成可复现 seed=${seed}` }) };
}
export function mountBattleDebug(root: HTMLElement, search: URLSearchParams, fixture = false) {
  const parsed = readSeed(search.get('seed'), () => crypto.getRandomValues(new Uint32Array(1))[0]!);
  if (parsed.warning) console.warn(`[次元战争:seed] ${parsed.warning}`);
  let game = startDebugGame(parsed.seed, 1, fixture);
  let timer: number | undefined;
  let fixtureStarted = false;
  let dispatching = false;
  let disposed = false;
  const queue: DebugAction[] = [];
  const view = new BattleView(root, dispatch);

  function schedule() {
    if (timer !== undefined) window.clearTimeout(timer);
    timer = undefined;
    const battle = game.battle!;
    if (battle.result || battle.pendingReaction || battle.pendingRoll || battle.opening) return;
    let command: Command | undefined;
    let origin: Envelope['origin'] = 'system';
    let startsFixture = false;
    if (battle.pendingMove) command = { kind: 'step' };
    else if (battle.awaitingEnd) command = { kind: 'advance-turn' };
    else if (fixture) {
      if (!fixtureStarted) { command = { kind: 'move', actor: 'sample_target_a', to: { col: 4, row: 3 } }; origin = 'ai'; startsFixture = true; }
    } else { command = chooseAi(battle); origin = 'ai'; }
    if (!command) return;
    const token = battleToken(battle), planned = command;
    timer = window.setTimeout(() => {
      if (disposed || battleToken(game.battle!) !== token) return;
      if (startsFixture) fixtureStarted = true;
      dispatch({ type: 'command', envelope: { token, origin, command: planned } });
    }, battle.pendingMove ? 180 : 350);
  }
  function render() {
    const done = fixture && fixtureStarted && !game.battle!.pendingMove && !game.battle!.pendingReaction;
    view.render(game, fixture, done);
  }
  function dispatch(action: DebugAction) {
    if (disposed) return;
    queue.push(action);
    if (dispatching) return;
    dispatching = true;
    try {
      while (queue.length) {
        const item = queue.shift()!;
        const result = reduceDebugGame(game, item, fixture);
        if (result.state === game) { if (result.rejectedReason) view.showHint(result.rejectedReason); continue; }
        if (result.state.run !== game.run) fixtureStarted = false;
        game = result.state; render(); schedule();
      }
    } finally { dispatching = false; }
  }
  render(); schedule();
  return () => { disposed = true; if (timer !== undefined) window.clearTimeout(timer); view.dispose(); };
}
