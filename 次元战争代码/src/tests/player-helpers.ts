import type { Act, StoryNode } from '../content/types.js';
import type { GameState, StoryLibrary } from '../game/state.js';
import { storyLibrary } from '../game/story/library.js';
import { reduceGame, startGame } from '../game/story/player.js';

export function fixture(nodes: StoryNode[], extra: Act['scenes'] = []): StoryLibrary {
  return { prologue: { id: 'prologue', title: '序幕', scenes: [
    { id: 'p001', title: '测试', time: '白天', nodes, meta: { sourceFile: 'fixture', line: 1 } }, ...extra,
  ] } };
}

export function next(state: GameState, library: StoryLibrary = storyLibrary) {
  const wait = state.waiting;
  if (wait?.kind !== 'text') throw new Error(`当前不是文本：${wait?.kind}`);
  const revealed = reduceGame(state, { type: 'advance', token: wait.token }, library).state;
  return revealed.waiting?.token === wait.token
    ? reduceGame(revealed, { type: 'advance', token: wait.token }, library).state : revealed;
}

export function reach(sceneId: string, kind?: string): GameState {
  let state = startGame(storyLibrary).state;
  for (let steps = 0; steps < 600; steps++) {
    const wait = state.waiting;
    if (state.sceneId === sceneId && (!kind || wait?.kind === kind)) return state;
    if (!wait || wait.kind === 'error') throw new Error(`流程失败：${JSON.stringify(wait)}`);
    if (wait.kind === 'text') state = next(state);
    else if (wait.kind === 'battle') state = reduceGame(state, { type: 'complete-battle', token: wait.token }, storyLibrary).state;
    else if (wait.kind === 'choice') state = reduceGame(state, { type: 'choose', token: wait.token, index: state.sceneId === 'a007' ? 2 : 1 }, storyLibrary).state;
    else if (wait.kind === 'end' && state.actId === 'prologue') state = reduceGame(state, { type: 'enter-act1', token: wait.token }, storyLibrary).state;
    else break;
  }
  throw new Error(`未到达 ${sceneId}/${kind ?? '*'}`);
}
