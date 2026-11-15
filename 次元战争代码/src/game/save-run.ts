import { levels } from '../content/levels.js';
import { decodeLoop } from './loop/checkpoint.js';
import type { LoopCheckpoint } from './loop/types.js';
import { decodeV2 } from './save-v2.js';
import type { SaveV2 } from './save-v2.js';
import { readSlot, record, slotValue } from './save-v3.js';
import type { VaultRead } from './save-v3.js';
import type { StoryLibrary } from './state.js';

/** v5 的序幕槽可以继续使用原快照，续篇槽附带一个完整的流程检查点。 */
export type RunSnapshot = SaveV2 & { postPrologue?: LoopCheckpoint };

export function readRunSlot(read: Extract<VaultRead, { kind: 'valid' }>, slot: number, library: StoryLibrary) {
  return readSlot(slotValue(read.data, slot), library, read.data.revision, read.format === 5 ? decodeRunSnapshot : undefined);
}

export function autoSlotRevision(read: VaultRead): number | undefined {
  if (read.kind !== 'valid' || !record(read.data.auto)) return undefined;
  const revision = read.data.auto.revision;
  return typeof revision === 'number' && Number.isSafeInteger(revision) ? revision : undefined;
}

export function hasPostPrologueAuto(read: VaultRead): boolean {
  if (read.format !== 5 || read.kind !== 'valid') return false;
  const auto = read.data.auto;
  return record(auto) && record(auto.data) && Object.hasOwn(auto.data, 'postPrologue');
}

export function decodeRunSnapshot(value: unknown, library: StoryLibrary): RunSnapshot | undefined {
  if (!record(value)) return undefined;
  const { postPrologue, ...base } = value;
  const prologue = decodeV2(JSON.stringify(base), library);
  if (prologue.kind !== 'valid') return undefined;
  if (!Object.hasOwn(value, 'postPrologue')) return prologue.data;
  const loop = decodeLoop(postPrologue);
  if (!loop || prologue.data.completedLevelIds.length !== levels.length || !prologue.data.flags.prologue_4_complete
    || prologue.data.checkpoint.kind !== 'map') return undefined;
  return { ...prologue.data, postPrologue: loop };
}
