import type { StoryNode } from '../../content/types.js';
import { levels } from '../../content/levels.js';
import type { GameState, StoryLibrary } from '../state.js';
import { storyLibrary } from '../story/library.js';

/** 只扫描已走过的SHOW；既不执行节点，也不依赖演员对象的旧枚举顺序。 */
export function portraitEntries(state: GameState, library: StoryLibrary = storyLibrary): readonly string[] {
  const order: string[] = [];
  const record = (node: StoryNode) => {
    if (node.kind !== 'show') return;
    const previous = order.indexOf(node.actor);
    if (node.update && previous >= 0) return;
    if (previous >= 0) order.splice(previous, 1);
    order.push(node.actor);
  };
  const path = levels.filter(level => level.actId === state.actId).flatMap(level => level.sceneIds);
  const target = state.sceneId === 'a010_return_class' ? 'a010' : state.sceneId;
  if (!path.includes(target)) return Object.keys(state.actors).sort(); // 独立开发素材页，无剧情SHOW历史。
  for (const id of path) {
    const scene = library[state.actId]?.scenes.find(item => item.id === id);
    if (!scene) continue;
    const current = id === state.sceneId;
    const limit = current ? state.nodeIndex : scene.nodes.length;
    for (let index = 0; index < limit; index++) {
      const node = scene.nodes[index];
      if (!node) break;
      if (node.kind !== 'choice') { record(node); continue; }
      const branch = current && state.branch?.choiceNodeIndex === index ? state.branch : undefined;
      // 当前停在选择处时尚未执行分支；已完成主线与既有恢复使用相同的显式选项。
      if (current && state.waiting?.kind === 'choice' && state.waiting.choiceNodeIndex === index) continue;
      const optionIndex = branch?.optionIndex ?? (id === 'a007' ? 2 : state.sceneId === 'a010_return_class' ? 2 : 1);
      const nodes = node.options.find(option => option.index === optionIndex && option.enabled)?.nodes ?? [];
      nodes.slice(0, branch?.index ?? nodes.length).forEach(record);
    }
    if (id === target) break;
  }
  if (state.sceneId === 'a010_return_class') library[state.actId]?.scenes.find(s => s.id === state.sceneId)?.nodes.slice(0, state.nodeIndex).forEach(record);
  return order;
}
