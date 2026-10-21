import { levelById, levelForScene, levelIds, levels } from '../content/levels.js';
import type { LevelId } from '../content/levels.js';
import { allowedFlags, completionFlags, decodeSave, mergeFlags } from './save-format.js';
import type { SaveData } from './save-format.js';
import type { StoryLibrary } from './state.js';

export const saveKeyV2 = 'dw.save.v2';
export type Checkpoint = { kind: 'map' } | { kind: 'level'; levelId: LevelId; sceneId: string };
export type SaveV2 = { version: 2; flags: Record<string, boolean>; completedLevelIds: LevelId[]; checkpoint: Checkpoint; savedAt: number };
export type SaveReadV2 = { kind: 'empty' } | { kind: 'valid'; data: SaveV2 }
  | { kind: 'migration'; data: SaveV2; raw: string }
  | { kind: 'invalid'; raw: string; key: 'v1' | 'v2'; message: string }
  | { kind: 'unavailable'; message: string };
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
export function encodeV2(data: SaveV2): string {
  return JSON.stringify({ version: 2, flags: data.flags, completedLevelIds: data.completedLevelIds, checkpoint: data.checkpoint, savedAt: data.savedAt });
}
export function normalizedCheckpoint(checkpoint: Checkpoint, completed: readonly LevelId[]): Checkpoint {
  return checkpoint.kind === 'level' && completed.includes(checkpoint.levelId) ? { kind: 'map' } : { ...checkpoint };
}
export function decodeV2(raw: string | null, library: StoryLibrary): SaveReadV2 {
  if (raw === null) return { kind: 'empty' };
  const invalid = (reason: string): SaveReadV2 => ({ kind: 'invalid', raw, key: 'v2', message: `v2 存档无法读取：${reason}。原文已保留，本次进度暂不保存。` });
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return invalid('格式损坏'); }
  if (!isRecord(value) || Object.keys(value).sort().join(',') !== 'checkpoint,completedLevelIds,flags,savedAt,version' || value.version !== 2) return invalid('版本或字段不符');
  const known = allowedFlags(library);
  if (!isRecord(value.flags) || Object.entries(value.flags).some(([key, flag]) => !known.has(key) || typeof flag !== 'boolean')) return invalid('事件记录不符');
  if (!Array.isArray(value.completedLevelIds) || value.completedLevelIds.length > levels.length
    || value.completedLevelIds.some((id, index) => id !== levelIds[index])) return invalid('完成关卡不是连续前缀');
  const completed = value.completedLevelIds as LevelId[], flags = value.flags as Record<string, boolean>;
  if (Boolean(flags[completionFlags.prologue]) !== (completed.length >= 3) || Boolean(flags[completionFlags.act1]) !== (completed.length === 7)) return invalid('幕完成记录不符');
  const point = value.checkpoint;
  if (!isRecord(point)) return invalid('检查点不符');
  let checkpoint: Checkpoint;
  if (point.kind === 'map' && Object.keys(point).join(',') === 'kind') checkpoint = { kind: 'map' };
  else if (point.kind === 'level' && Object.keys(point).sort().join(',') === 'kind,levelId,sceneId') {
    const level = typeof point.levelId === 'string' ? levelById(point.levelId) : undefined;
    if (!level || typeof point.sceneId !== 'string' || !level.sceneIds.includes(point.sceneId)
      || !library[level.actId]?.scenes.some(scene => scene.id === point.sceneId) || levelIds.indexOf(level.id) > completed.length) return invalid('关卡场景不可进入');
    checkpoint = normalizedCheckpoint({ kind: 'level', levelId: level.id, sceneId: point.sceneId }, completed);
  } else return invalid('检查点结构不符');
  if (typeof value.savedAt !== 'number' || !Number.isSafeInteger(value.savedAt) || value.savedAt < 0 || value.savedAt > 8_640_000_000_000_000) return invalid('保存时间不符');
  return { kind: 'valid', data: { version: 2, flags: { ...flags }, completedLevelIds: [...completed], checkpoint, savedAt: value.savedAt } };
}
export function migrateV1(data: SaveData): SaveV2 {
  const level = levelForScene(data.actId, data.sceneId)!;
  const j = levelIds.indexOf(level.id), m = data.flags[completionFlags.act1] ? 7 : data.flags[completionFlags.prologue] ? 3 : 0;
  const count = Math.max(m, j), flags = { ...data.flags };
  if (count >= 3) flags[completionFlags.prologue] = true;
  if (count === 7) flags[completionFlags.act1] = true;
  return { version: 2, flags, completedLevelIds: levelIds.slice(0, count), savedAt: data.savedAt,
    checkpoint: j < count || count === 7 ? { kind: 'map' } : { kind: 'level', levelId: level.id, sceneId: data.sceneId } };
}
export function readSaves(v2: string | null, legacy: () => string | null, library: StoryLibrary): SaveReadV2 {
  const current = decodeV2(v2, library);
  if (current.kind !== 'empty') return current;
  const raw = legacy(), old = decodeSave(raw, library);
  if (old.kind === 'valid') return { kind: 'migration', data: migrateV1(old.data), raw: raw! };
  if (old.kind === 'invalid') return { ...old, key: 'v1' };
  return old;
}
export function mergeV2(latest: SaveV2 | undefined, candidate: SaveV2): SaveV2 {
  const completed = (latest && latest.completedLevelIds.length > candidate.completedLevelIds.length ? latest : candidate).completedLevelIds;
  return { ...candidate, flags: mergeFlags(latest?.flags ?? {}, candidate.flags), completedLevelIds: [...completed],
    checkpoint: normalizedCheckpoint(candidate.checkpoint, completed) };
}
