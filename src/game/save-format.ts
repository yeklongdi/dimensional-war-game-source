import type { StoryLibrary } from './state.js';
import type { LevelId } from '../content/levels.js';
import type { SaveV2 } from './save-v2.js';
import { skippedFlag } from './story/skip-policy.js';

export const saveKey = 'dw.save.v1';
export type ActId = 'prologue' | 'act1';
export type SaveData = {
  actId: ActId; sceneId: string; flags: Record<string, boolean>; savedAt: number; unlockedActs: ActId[];
};
export type SaveRead =
  | { kind: 'empty' }
  | { kind: 'valid'; data: SaveData }
  | { kind: 'invalid'; raw: string; message: string }
  | { kind: 'unavailable'; message: string };
export type ProgressState = {
  completedLevelIds: LevelId[]; checkpoint?: SaveV2; draft?: SaveV2;
  status: 'empty' | 'ready' | 'migrating' | 'saving' | 'saved' | 'blocked' | 'error';
  message: string; blockedRaw?: string; blockedKey?: 'v1' | 'v2'; confirming: boolean; request: number; navigation: number;
  replacement?: { key: 'v1' | 'v2'; raw: string };
};
export const completionFlags = { prologue: 'flag_prologue_completed', act1: 'flag_act1_completed' } as const;
export const openScenes: Readonly<Record<ActId, readonly string[]>> = {
  prologue: Array.from({ length: 9 }, (_, i) => `p${String(i + 1).padStart(3, '0')}`),
  act1: Array.from({ length: 16 }, (_, i) => `a${String(i + 1).padStart(3, '0')}`),
};
export function unlockedFrom(flags: Readonly<Record<string, boolean>>): ActId[] {
  return flags[completionFlags.prologue] ? ['prologue', 'act1'] : ['prologue'];
}
export function mergeFlags(...records: Readonly<Record<string, boolean>>[]): Record<string, boolean> {
  const merged: Record<string, boolean> = {};
  for (const record of records) for (const [key, value] of Object.entries(record)) merged[key] = merged[key] === true || value;
  return merged;
}
export function allowedFlags(library: StoryLibrary): ReadonlySet<string> {
  const flags = new Set<string>([...Object.values(completionFlags), 'flag_battle_prologue_tutorial_won', 'flag_battle_black_humanoid_won']);
  for (const act of Object.values(library)) for (const scene of act.scenes) for (const node of scene.nodes) {
    if (library.prologue_4 && node.kind === 'call') { const flag = skippedFlag(node.name); if (flag) flags.add(flag); }
    if (node.kind === 'set') flags.add(node.flag);
    if (node.kind === 'choice') for (const option of node.options) for (const child of option.nodes) if (child.kind === 'set') flags.add(child.flag);
  }
  return flags;
}
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
export function decodeSave(raw: string | null, library: StoryLibrary): SaveRead {
  if (raw === null) return { kind: 'empty' };
  const invalid = (reason: string): SaveRead => ({ kind: 'invalid', raw, message: `旧存档无法读取：${reason}。原存档已保留，本次进度暂不保存。` });
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return invalid('格式损坏'); }
  if (!record(value) || Object.keys(value).sort().join(',') !== 'actId,flags,savedAt,sceneId,unlockedActs') return invalid('存档字段不符');
  if (value.actId !== 'prologue' && value.actId !== 'act1') return invalid('关卡不可用');
  if (typeof value.sceneId !== 'string' || !openScenes[value.actId].includes(value.sceneId)
    || !library[value.actId]?.scenes.some(scene => scene.id === value.sceneId)) return invalid('场景不可用');
  const known = allowedFlags(library);
  if (!record(value.flags) || Object.entries(value.flags).some(([key, flag]) => !known.has(key) || typeof flag !== 'boolean')) return invalid('进度记录不符');
  const flags = value.flags as Record<string, boolean>;
  if (flags[completionFlags.act1] && !flags[completionFlags.prologue]) return invalid('通关顺序不符');
  const unlocked = unlockedFrom(flags);
  if (!Array.isArray(value.unlockedActs) || JSON.stringify(value.unlockedActs) !== JSON.stringify(unlocked)
    || !unlocked.includes(value.actId)) return invalid('解锁记录不符');
  if (typeof value.savedAt !== 'number' || !Number.isSafeInteger(value.savedAt) || value.savedAt < 0 || value.savedAt > 8_640_000_000_000_000) return invalid('保存时间不符');
  return { kind: 'valid', data: { actId: value.actId, sceneId: value.sceneId, flags: { ...flags }, savedAt: value.savedAt, unlockedActs: unlocked } };
}
export function encodeSave(data: SaveData): string {
  return JSON.stringify({ actId: data.actId, sceneId: data.sceneId, flags: data.flags, savedAt: data.savedAt, unlockedActs: data.unlockedActs });
}
