import type { GameState } from '../state.js';
import { element } from './elements.js';

export function renderDebug(root: HTMLElement, state: GameState) {
  root.hidden = !state.debugOpen;
  if (!state.debugOpen) {
    root.replaceChildren();
    return;
  }
  const origin = state.waiting?.origin;
  const position = `幕 ${state.actId} / 场景 ${state.sceneId} / 节点 ${origin?.nodeIndex ?? state.nodeIndex}`;
  const branch = origin?.optionIndex ? ` / 选项 ${origin.optionIndex} / 子节点 ${origin.optionNodeIndex}` : '';
  const actors = Object.values(state.actors).map(actor =>
    `${actor.actor} [${actor.visible ? '显示' : '隐藏'}] ${actor.position} | ${actor.asset ?? '占位'} | ${actor.pose ?? '—'} | ${actor.expression ?? '—'}`);
  const notes = Object.values(state.hiddenNotes).map(note =>
    `${note.actId}/${note.sceneId}:${note.origin.nodeIndex} ${note.kind}\n${note.raw}`);
  root.replaceChildren(
    element('h2', '', '开发记录 · ~ 关闭'),
    element('p', '', position + branch),
    element('p', '', `等待：${state.waiting?.kind ?? '执行中'} · 已记录 ${Object.keys(state.flags).length} 个 flag`),
    element('h3', '', '人物状态（姿态 / 表情）'), element('pre', '', actors.join('\n')),
    element('h3', '', '隐藏的制作备注'), element('pre', '', notes.join('\n\n') || '尚无'),
    element('h3', '', 'Flag'), element('pre', '', Object.keys(state.flags).join('\n') || '尚无'),
    element('h3', '', '场景存档'), element('pre', '', state.progress?.checkpoint ? JSON.stringify(state.progress.checkpoint, null, 2) : '尚无有效存档'),
    element('h3', '', '去重警告'), element('pre', '', Object.values(state.warnings).join('\n') || '尚无'),
  );
}
