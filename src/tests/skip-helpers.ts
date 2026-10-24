import { levels, levelIds } from '../content/levels.js';
import type { SaveV2 } from '../game/save-v2.js';
import type { GameState } from '../game/state.js';
import { systemToken } from '../game/runtime.js';
import { menuHarness, loadAuto } from './menu-helpers.js';
import { currentForwardAction } from '../game/fast-forward.js';

export function skipSave(scene: string, extraFlags: Record<string, boolean> = {}): SaveV2 {
  const index = levels.findIndex(level => level.sceneIds.includes(scene));
  if (index < 0) throw new Error('测试场景不存在');
  const flags: Record<string, boolean> = { ...extraFlags };
  if (index >= 3) flags.flag_prologue_completed = true;
  if (index >= 7) { flags.flag_act1_completed = true; flags.has_master_sword = true; }
  if (index >= 8) { flags.prologue_3_complete = true; flags.link_summoned = true; }
  return { version: 2, flags, completedLevelIds: levelIds.slice(0, index),
    checkpoint: { kind: 'level', levelId: levels[index]!.id, sceneId: scene }, savedAt: 1792800000000 };
}
export async function skipHarness(scene = 'p001', flags: Record<string, boolean> = {}) {
  const h = menuHarness(skipSave(scene, flags)); await loadAuto(h); return h;
}
export const intent = (state: GameState, value: 'open' | 'skip') => ({ type: 'system' as const, intent: value, token: systemToken(state) });
export async function forward(h: ReturnType<typeof menuHarness>) {
  await h.system('open'); await h.system('skip');
}
export async function ticks(h: ReturnType<typeof menuHarness>, until: (s: GameState) => boolean, max = 1500) {
  for (let i = 0; i < max; i++) {
    if (until(h.state)) return;
    const action = currentForwardAction(h.state, 'tick'); if (!action) throw new Error('快进意外停止');
    await h.action(action);
  }
  throw new Error('未到达快进目标');
}
