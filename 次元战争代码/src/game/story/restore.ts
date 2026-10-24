import type { GameState, StoryLibrary, Transition } from '../state.js';
import { emptyState } from '../state.js';
import { levels } from '../../content/levels.js';
import { overrides } from './config.js';
import { applyPresentation, hideActors, showActor } from './presentation.js';
import { startScene } from './player.js';

/** 只扫描演出，不调用剧情驱动器。当前开放主线的两个选择分支仅用于查出演出节点。 */
export function scenePresentation(library: StoryLibrary, actId: string, target: string) {
  const scenes = levels.filter(level => level.actId === actId).flatMap(level => level.sceneIds)
    .filter(id => library[actId]?.scenes.some(scene => scene.id === id));
  const entry = target === 'a010_return_class' ? 'a010' : target;
  if (!scenes.includes(entry)) throw new Error('不能恢复未开放场景');
  const scratch = emptyState(); scratch.actId = actId;
  for (const id of scenes) {
    if (id === entry) break;
    const scene = library[actId]?.scenes.find(item => item.id === id);
    if (!scene) throw new Error(`缺少开放场景 ${id}`);
    scratch.sceneId = id;
    hideActors(scratch, overrides.sceneHides[actId]?.[id] ?? []);
    const nodes = scene.nodes.flatMap(node => node.kind === 'choice'
      ? node.options.find(option => option.enabled && option.index === (id === 'a007' ? 2 : 1))?.nodes ?? [] : [node]);
    for (const node of nodes) {
      applyPresentation(scratch, node, []);
      if (node.kind === 'call') hideActors(scratch, overrides.battleHides[node.name] ?? []);
    }
  }
  return { actors: structuredClone(scratch.actors), backgroundId: scratch.backgroundId, bgmId: scratch.bgmId };
}

export function resumeScene(previous: GameState, library: StoryLibrary, actId: string, sceneId: string, run: number, activeLevelId = previous.activeLevelId): Transition {
  const state: GameState = { ...emptyState(run), ...scenePresentation(library, actId, sceneId), actId, sceneId,
    flags: { ...previous.flags }, warnings: { ...previous.warnings }, failedAssets: { ...previous.failedAssets },
    campaignSeed: previous.campaignSeed, battleSerial: previous.battleSerial, activeLevelId };
  const transition = startScene(state, library);
  // 目标场景可能没有 SHOW；仍为实际恢复的可见占位角色产生一次诊断。
  for (const actor of Object.values(state.actors)) if (actor.visible) showActor(state, { kind: 'show', actor: actor.actor, update: true }, transition.effects);
  if (!transition.effects.some(effect => effect.kind === 'bgm')) transition.effects.push({ kind: 'bgm', id: state.bgmId });
  return transition;
}
