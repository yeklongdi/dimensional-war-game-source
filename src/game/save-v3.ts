import type { StoryLibrary } from './state.js';
import { decodeV2, readSaves } from './save-v2.js';
import type { SaveV2 } from './save-v2.js';

export const saveKeyV3 = 'dw.save.v3';
/** 槽内复用已验证的地图／场景快照；容器版本、身份与修订独立。坏槽原值保留。 */
export type SaveV3 = { version: 3; activeRunId: string; revision: number; auto: unknown; manual: unknown[] };
export type SlotRecord = { revision: number; data: SaveV2 };
export type SlotRead = { kind: 'empty' } | { kind: 'valid'; record: SlotRecord } | { kind: 'invalid'; message: string };
export type VaultRead = { kind: 'empty' } | { kind: 'valid'; data: SaveV3 }
  | { kind: 'migration'; data: SaveV2 }
  | { kind: 'invalid'; raw: string; message: string } | { kind: 'unavailable'; message: string };
export const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const integer = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
export function decodeV3(raw: string | null): VaultRead {
  if (raw === null) return { kind: 'empty' };
  const bad = (): VaultRead => ({ kind: 'invalid', raw, message: '多档容器版本或结构无法读取，原记录已保留，未自动覆盖。' });
  let v: unknown; try { v = JSON.parse(raw); } catch { return bad(); }
  if (!record(v) || Object.keys(v).sort().join(',') !== 'activeRunId,auto,manual,revision,version' || v.version !== 3
    || typeof v.activeRunId !== 'string' || !/^[\w:-]{8,128}$/.test(v.activeRunId) || !integer(v.revision)
    || !Array.isArray(v.manual) || v.manual.length !== 6) return bad();
  return { kind: 'valid', data: { version: 3, activeRunId: v.activeRunId, revision: v.revision, auto: v.auto, manual: [...v.manual] } };
}
export function readSlot(value: unknown, library: StoryLibrary, revision = Number.MAX_SAFE_INTEGER): SlotRead {
  if (value === null) return { kind: 'empty' };
  if (!record(value) || Object.keys(value).sort().join(',') !== 'data,revision' || !integer(value.revision) || value.revision > revision) return { kind: 'invalid', message: '槽位结构或修订损坏' };
  const parsed = decodeV2(JSON.stringify(value.data), library);
  return parsed.kind === 'valid' ? { kind: 'valid', record: { revision: value.revision, data: parsed.data } }
    : { kind: 'invalid', message: '槽位进度未通过校验' };
}
export function slotValue(data: SaveV3, slot: number): unknown { return slot === 0 ? data.auto : data.manual[slot - 1]; }
export function fingerprint(value: unknown): string { return JSON.stringify(value ?? null); }
export function newVault(id: string, data: SaveV2): SaveV3 {
  return { version: 3, activeRunId: id, revision: 1, auto: { revision: 1, data: structuredClone(data) }, manual: Array.from({ length: 6 }, () => null) };
}
export function readVault(raw: string | null, v2: () => string | null, v1: () => string | null, library: StoryLibrary): VaultRead {
  const current = decodeV3(raw); if (current.kind !== 'empty') return current;
  const legacy = readSaves(v2(), v1, library);
  if (legacy.kind === 'valid' || legacy.kind === 'migration') return { kind: 'migration', data: legacy.data };
  if (legacy.kind === 'invalid') return { kind: 'invalid', raw: legacy.raw, message: '旧档无法升级；原v1／v2记录已保留，请明确确认后新建v3。' };
  return legacy;
}
