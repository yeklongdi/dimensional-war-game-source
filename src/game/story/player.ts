import type { Scene, StoryNode } from '../../content/types.js';
import type { Action, Effect, GameState, Origin, StoryLibrary, Transition } from '../state.js';
import { emptyState, warning } from '../state.js';
import { overrides, sfxBindings } from './config.js';
import { applyPresentation, hideActors, stageText } from './presentation.js';
import { levelById, levelExits } from '../../content/levels.js';

function getScene(state: GameState, library: StoryLibrary): Scene {
  const scene = library[state.actId]?.scenes.find(item => item.id === state.sceneId);
  if (!scene) throw new Error(`找不到场景 ${state.actId}/${state.sceneId}`);
  return scene;
}

function enterScene(state: GameState, id: string, library: StoryLibrary) {
  state.sceneId = id;
  state.nodeIndex = 0;
  state.branch = undefined;
  const scene = getScene(state, library);
  state.sceneTitle = scene.title;
  state.time = scene.time;
  hideActors(state, overrides.sceneHides[state.actId]?.[id] ?? []);
}

function note(state: GameState, node: StoryNode, origin: Origin) {
  const key = `${state.actId}:${state.sceneId}:${origin.nodeIndex}:${origin.optionIndex ?? ''}:${origin.optionNodeIndex ?? ''}`;
  const raw = 'raw' in node ? node.raw : 'note' in node ? node.note
    : 'text' in node ? node.text : JSON.stringify(node);
  state.hiddenNotes[key] = { actId: state.actId, sceneId: state.sceneId, origin, kind: node.kind, raw };
}

function token(state: GameState) { return `${state.run}:${++state.sequence}`; }

function drive(state: GameState, library: StoryLibrary, effects: Effect[]): Transition {
  state.waiting = null;
  try {
    for (let steps = 0; steps < 1000; steps++) {
      const scene = getScene(state, library);
      const branch = state.branch;
      const choice = branch ? scene.nodes[branch.choiceNodeIndex] : undefined;
      const option = branch && choice?.kind === 'choice'
        ? choice.options.find(item => item.index === branch.optionIndex) : undefined;
      if (branch && !option) throw new Error('找不到当前选项');
      if (branch && option && branch.index >= option.nodes.length) {
        if (branch.returnToChoice) state.nodeIndex = branch.choiceNodeIndex;
        state.branch = undefined;
        continue;
      }
      const origin: Origin = branch
        ? { nodeIndex: branch.choiceNodeIndex, optionIndex: branch.optionIndex, optionNodeIndex: branch.index }
        : { nodeIndex: state.nodeIndex };
      const node = branch && option ? option.nodes[branch.index] : scene.nodes[state.nodeIndex];
      if (!node) throw new Error('场景没有可继续的节点或 END');
      if (branch) branch.index++;
      else state.nodeIndex++;
      if (node.meta || ['check', 'meta', 'unknown'].includes(node.kind)) note(state, node, origin);
      if (applyPresentation(state, node, effects)) continue;
      switch (node.kind) {
        case 'set': state.flags[node.flag] = true; continue;
        case 'check': case 'meta': case 'unknown': continue;
        case 'stage': case 'dialogue': case 'inner': case 'narration': {
          const allowed = branch?.returnToChoice && branch.visibleMetaNodeIndex === origin.optionNodeIndex;
          if (node.meta && !allowed) continue;
          const text = node.kind === 'stage' ? stageText(state, node.text, origin) : node.text;
          if (!text) continue;
          state.waiting = {
            kind: 'text', token: token(state), origin, textKind: node.kind,
            text, speaker: 'speaker' in node ? node.speaker : undefined, revealed: 0,
          };
          return { state, effects };
        }
        case 'show': case 'hide': case 'background': case 'bgm': continue;
        case 'sfx': {
          if (!sfxBindings[node.name]) warning(state, effects, `asset:${node.name}`, `音频 ${node.name} 尚未绑定，静默处理。`);
          effects.push({ kind: 'sfx', id: node.name });
          continue;
        }
        case 'jump':
          if (branch?.returnToChoice) {
            state.nodeIndex = branch.choiceNodeIndex;
            state.branch = undefined;
          } else {
            if (state.activeLevelId) {
              const level = levelById(state.activeLevelId)!, exit = levelExits[level.id];
              if (state.sceneId === exit.sceneId && node.target === exit.target) return { state, effects, completedLevelId: level.id };
              if (!level.sceneIds.includes(node.target)) throw new Error(`拒绝未配置的跨关跳转 ${state.sceneId} → ${node.target}`);
            }
            enterScene(state, node.target, library);
          }
          continue;
        case 'choice':
          if (node.meta) continue;
          state.waiting = { kind: 'choice', token: token(state), origin, prompt: node.prompt, options: node.options, choiceNodeIndex: origin.nodeIndex };
          return { state, effects };
        case 'call':
          if (node.name === 'battle_prologue_tutorial' || node.name === 'battle_black_humanoid') {
            state.waiting = { kind: 'battle', token: token(state), origin, battleId: node.name };
            return { state, effects };
          }
          warning(state, effects, `call:${node.name}`, `调用 ${node.name} 暂用占位处理，继续原文已有内容。`);
          continue;
        case 'end':
          if (state.activeLevelId) {
            const exit = levelExits[state.activeLevelId];
            if (exit.sceneId !== state.sceneId || exit.target) throw new Error(`拒绝未配置的关卡 END ${state.sceneId}`);
            return { state, effects, completedLevelId: state.activeLevelId };
          }
          state.waiting = { kind: 'end', token: token(state), origin };
          return { state, effects };
      }
    }
    throw new Error('连续自动节点超过 1000，已停止以避免死循环');
  } catch (error) {
    state.waiting = { kind: 'error', token: token(state), origin: { nodeIndex: state.nodeIndex }, message: error instanceof Error ? error.message : '剧情执行异常' };
    return { state, effects };
  }
}

export function startGame(library: StoryLibrary, run = 1): Transition {
  const state = emptyState(run);
  enterScene(state, 'p001', library);
  return drive(state, library, []);
}

/** 输入必须是新建会话；先应用目标场景退场配置，再正常执行第一个节点。 */
export function startScene(state: GameState, library: StoryLibrary): Transition {
  if (state.activeLevelId && !levelById(state.activeLevelId)?.sceneIds.includes(state.sceneId)) throw new Error('关卡入口与场景不匹配');
  enterScene(state, state.sceneId, library);
  return drive(state, library, []);
}

export function reduceGame(previous: GameState, action: Action, library: StoryLibrary): Transition {
  const unchanged = () => ({ state: previous, effects: [] });
  if (previous.screen !== 'story') return unchanged();
  const waiting = previous.waiting;
  if ('token' in action && (!waiting || action.token !== waiting.token)) return unchanged();
  if (action.type === 'choose' && (waiting?.kind !== 'choice' || !waiting.options.some(item => item.index === action.index && item.enabled))) return unchanged();
  if (action.type === 'advance' && waiting?.kind !== 'text') return unchanged();
  if (action.type === 'complete-battle' && waiting?.kind !== 'battle') return unchanged();
  if (action.type === 'reveal' && waiting?.kind !== 'text') return unchanged();
  if (action.type === 'enter-act1' && (waiting?.kind !== 'end' || previous.actId !== 'prologue')) return unchanged();
  if (action.type === 'restart' && waiting?.kind !== 'end' && waiting?.kind !== 'error') return unchanged();
  if (action.type === 'restart') return startGame(library, previous.run + 1);
  if (action.type === 'warning' && previous.warnings[action.key]) return unchanged();
  const state = structuredClone(previous);
  const effects: Effect[] = [];
  switch (action.type) {
    case 'toggle-debug': state.debugOpen = !state.debugOpen; break;
    case 'warning': warning(state, effects, action.key, action.message); break;
    case 'asset-failed':
      state.failedAssets[action.id] = true;
      warning(state, effects, `asset:${action.id}`, action.message);
      break;
    case 'reveal':
      if (state.waiting?.kind === 'text') state.waiting.revealed = Math.min(Array.from(state.waiting.text).length, Math.max(state.waiting.revealed, action.count));
      break;
    case 'advance':
      if (state.waiting?.kind === 'text' && state.waiting.revealed < Array.from(state.waiting.text).length) {
        state.waiting.revealed = Array.from(state.waiting.text).length;
        break;
      }
      return drive(state, library, effects);
    case 'choose': {
      if (waiting?.kind !== 'choice') return unchanged();
      const override = overrides.choiceReturns.find(item => item.actId === state.actId && item.sceneId === state.sceneId && item.optionIndex === action.index);
      state.branch = { choiceNodeIndex: waiting.choiceNodeIndex, optionIndex: action.index, index: 0,
        returnToChoice: Boolean(override), visibleMetaNodeIndex: override?.metaNodeIndex };
      return drive(state, library, effects);
    }
    case 'complete-battle':
      if (waiting?.kind === 'battle') hideActors(state, overrides.battleHides[waiting.battleId] ?? []);
      return drive(state, library, effects);
    case 'enter-act1':
      state.actId = 'act1';
      state.actors = {};
      state.backgroundId = '';
      state.bgmId = '';
      effects.push({ kind: 'bgm', id: '' });
      enterScene(state, 'a001', library);
      return drive(state, library, effects);
  }
  return { state, effects };
}
