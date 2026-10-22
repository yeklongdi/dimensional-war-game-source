import type { ShowNode, StoryNode } from '../../content/types.js';
import type { Effect, GameState, Origin } from '../state.js';
import { warning } from '../state.js';
import { backgroundBindings, bgmBindings, overrides, placement } from './config.js';

/** 正常执行和场景恢复共用演出语义；调用者决定是否输出收集到的 IO 效果。 */
export function applyPresentation(state: GameState, node: StoryNode, effects: Effect[]): boolean {
  switch (node.kind) {
    case 'show': showActor(state, node, effects); return true;
    case 'hide': hideActors(state, [node.actor]); return true;
    case 'background':
      state.backgroundId = node.name;
      if (!backgroundBindings[node.name]) warning(state, effects, `asset:${node.name}`, `背景 ${node.name} 尚未绑定，使用场景渐变占位。`);
      return true;
    case 'bgm':
      state.bgmId = node.name;
      if (!bgmBindings[node.name]) warning(state, effects, `asset:${node.name}`, `音频 ${node.name} 尚未绑定，静默处理。`);
      effects.push({ kind: 'bgm', id: node.name });
      return true;
    default: return false;
  }
}

export function showActor(state: GameState, node: ShowNode, effects: Effect[]) {
  const previous = state.actors[node.actor];
  if (node.update && !previous) {
    warning(state, effects, `actor:${state.actId}:${node.actor}`, `角色“${node.actor}”更新时尚无显示状态，使用显式占位。`);
  }
  let position = node.position ?? previous?.position ?? 'center';
  if (!placement(position).known) {
    warning(state, effects, `position:${position}`, `未知立绘位置 ${position}，使用 center。`);
    position = 'center';
  }
  const actor = {
    actor: node.actor, visible: true, position,
    asset: node.asset ?? previous?.asset,
    pose: node.pose ?? previous?.pose,
    expression: node.expression ?? previous?.expression,
  };
  state.actors[node.actor] = actor;
  const id = actor.asset ?? `actor:${node.actor}`;
  if (!actor.asset || !overrides.portraits[actor.asset]) {
    warning(state, effects, `asset:${id}`, `立绘 ${id} 尚未绑定，使用色块占位。`);
  }
}

export function hideActors(state: GameState, actors: readonly string[]) {
  for (const actor of actors) {
    if (state.actors[actor]) state.actors[actor]!.visible = false;
  }
}

/** M0 的八句混合 STAGE 镜头说明只在此精确匹配，不推断其他正文。 */
export function stageText(state: GameState, text: string, origin: Origin): string {
  const notes = overrides.stageNotes[state.actId]?.[state.sceneId] ?? [];
  return text.split('\n').filter((line, index) => {
    if (!notes.includes(line)) return true;
    const key = `${state.actId}:${state.sceneId}:${origin.nodeIndex}:camera:${index}`;
    state.hiddenNotes[key] = { actId: state.actId, sceneId: state.sceneId, origin, kind: 'stage-camera', raw: line };
    return false;
  }).join('\n');
}
