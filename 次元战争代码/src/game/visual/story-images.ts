import type { StoryNode } from '../../content/types.js';
import { levelById } from '../../content/levels.js';
import type { ActorState, GameState, StoryLibrary } from '../state.js';
import { backgroundBindings } from '../story/backgrounds.js';
import { resolveVisual } from './resolve.js';
import type { ImagePort } from './loading.js';

/** 只查看演出资源地址，不执行SET、CALL、选项、跳转或存档。 */
export function sceneImageUrls(state: GameState, library: StoryLibrary, actId = state.actId, sceneId = state.sceneId): string[] {
  const urls = new Set<string>();
  const actors: Record<string, ActorState> = { ...state.actors };
  const add = (url?: string) => { if (url) urls.add(url); };
  const portrait = (actor: ActorState) => {
    if (actor.asset?.startsWith('prop_')) return;
    const plan = resolveVisual(actor, state.failedAssets);
    if (plan.kind === 'layered') {
      for (const layer of plan.recipe.layers) for (const frame of layer.frames) add(frame);
    } else if (plan.kind === 'static') add(plan.url);
  };
  const scan = (nodes: readonly StoryNode[]) => {
    for (const node of nodes) {
      if (node.kind === 'background') add(backgroundBindings[node.name]);
      else if (node.kind === 'show') {
        const previous = actors[node.actor];
        const actor: ActorState = { actor: node.actor, visible: true, position: node.position ?? previous?.position ?? 'center',
          asset: node.asset ?? previous?.asset, pose: node.pose ?? previous?.pose, expression: node.expression ?? previous?.expression };
        actors[node.actor] = actor; portrait(actor);
      }
    }
  };
  const scene = library[actId]?.scenes.find(item => item.id === sceneId);
  if (!scene) return [];
  add(backgroundBindings[state.backgroundId]);
  for (const actor of Object.values(actors)) if (actor.visible) portrait(actor);
  scan(scene.nodes);
  // 仅预取明确的无条件下一场开头；不查看选项内部，不选择分支。
  const last = scene.nodes.at(-1);
  if (last?.kind === 'jump') {
    const next = library[actId]?.scenes.find(item => item.id === last.target);
    if (next) {
      const stop = next.nodes.findIndex(node => ['stage', 'dialogue', 'inner', 'narration', 'choice', 'call', 'end'].includes(node.kind));
      scan(stop < 0 ? next.nodes : next.nodes.slice(0, stop));
    }
  }
  return [...urls];
}

export class StoryImageWarmup<T> {
  private key = '';
  private readonly load: ImagePort<T>;
  constructor(load: ImagePort<T>) { this.load = load; }
  update(state: GameState, library: StoryLibrary): void {
    if (state.screen !== 'story' && state.screen !== 'menu') return;
    const checkpoint = state.progress?.checkpoint?.checkpoint;
    const level = checkpoint?.kind === 'level' ? checkpoint : undefined;
    const actId = state.screen === 'story' ? state.actId : (level && levelById(level.levelId)?.actId) || 'prologue';
    const sceneId = state.screen === 'story' ? state.sceneId : level?.sceneId ?? 'p001';
    const key = JSON.stringify([state.run, actId, sceneId]);
    if (this.key === key) return;
    this.key = key;
    for (const url of sceneImageUrls(state, library, actId, sceneId)) void this.load(url).catch(() => {});
  }
}
