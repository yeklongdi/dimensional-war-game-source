import type { GameState } from '../state.js';
import { lateSceneError } from './skip-policy.js';

export const chapterTitles: Readonly<Record<string, string>> = {
  prologue: '序幕（一）', act1: '序幕（二）', prologue_3: '序幕（三）', prologue_4: '序幕（四）',
};
/** 场景原题保留在数据中；玩家界面的制作标题也遵守已确认的身份隐藏。 */
export const displaySceneTitle = (title: string): string => title.replaceAll('林克', '金发青年');
export function chapterEntryError(actId: string, flags: Readonly<Record<string, boolean>>): string | undefined {
  if (actId === 'prologue_3' && !flags.has_master_sword) return '尚未完成放学取剑，不能进入序幕（三）。';
  if (actId === 'prologue_4' && (!flags.prologue_3_complete || !flags.link_summoned)) return '尚未完成序幕（三）与召唤，不能进入序幕（四）。';
  return undefined;
}
/** 分支结束不锁死继续位置；玩家下一次从原选择场景重新选择。 */
export function checkpointScene(state: Pick<GameState, 'actId' | 'sceneId'>): string {
  return state.actId === 'act1' && state.sceneId === 'a010_return_class' ? 'a010' : state.sceneId;
}
export const unfinishedScene = (scene: string): boolean => scene === 'a010_return_class' || scene.startsWith('a007_');
export function sceneEntryError(actId: string, sceneId: string, flags: Readonly<Record<string, boolean>> = {}): string | undefined {
  return actId === 'prologue_4' ? lateSceneError(sceneId, flags) : undefined;
}
