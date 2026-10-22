import type { StoryLibrary } from './state.js';
import type { LevelId } from '../content/levels.js';
import type { SaveV2 } from './save-v2.js';

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
export const completionFlags = { prologue: 'flag_demo_act_one_complete', act1: 'flag_demo_act_two_complete' } as const;
export const openScenes: Readonly<Record<ActId, readonly string[]>> = {
  prologue: ['p001'],
  act1: ['a001'],
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
  const flags = new Set<string>([...Object.values(completionFlags), 'flag_demo_battle_one_won', 'flag_demo_battle_two_won']);
  for (const act of Object.values(library)) for (const scene of act.scenes) for (const node of scene.nodes) {
    if (node.kind === 'set') flags.add(node.flag);
    if (node.kind === 'choice') for (const option of node.options) for (const child of option.nodes) if (child.kind === 'set') flags.add(child.flag);
  }
  return flags;
}
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
export function decodeSave(raw: string | null, library: StoryLibrary): SaveRead {
  if (raw === null) return { kind: 'empty' };
  const invalid = (reason: string): SaveRead => ({ kind: 'invalid', raw, message: 'Sample save is invalid: ' + reason + '. The original value was preserved.' });
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return invalid('malformed JSON'); }
  if (!record(value) || Object.keys(value).sort().join(',') !== 'actId,flags,savedAt,sceneId,unlockedActs') return invalid('unexpected fields');
  if (value.actId !== 'prologue' && value.actId !== 'act1') return invalid('unknown act');
  if (typeof value.sceneId !== 'string' || !openScenes[value.actId].includes(value.sceneId)
    || !library[value.actId]?.scenes.some(scene => scene.id === value.sceneId)) return invalid('unknown sample scene');
  const known = allowedFlags(library);
  if (!record(value.flags) || Object.entries(value.flags).some(([key, flag]) => !known.has(key) || typeof flag !== 'boolean')) return invalid('unknown progress flag');
  const flags = value.flags as Record<string, boolean>;
  if (flags[completionFlags.act1] && !flags[completionFlags.prologue]) return invalid('completion order');
  const unlocked = unlockedFrom(flags);
  if (!Array.isArray(value.unlockedActs) || JSON.stringify(value.unlockedActs) !== JSON.stringify(unlocked)
    || !unlocked.includes(value.actId)) return invalid('unlock state');
  if (typeof value.savedAt !== 'number' || !Number.isSafeInteger(value.savedAt) || value.savedAt < 0 || value.savedAt > 8_640_000_000_000_000) return invalid('timestamp');
  return { kind: 'valid', data: { actId: value.actId, sceneId: value.sceneId, flags: { ...flags }, savedAt: value.savedAt, unlockedActs: unlocked } };
}
export function encodeSave(data: SaveData): string {
  return JSON.stringify({ actId: data.actId, sceneId: data.sceneId, flags: data.flags, savedAt: data.savedAt, unlockedActs: data.unlockedActs });
}