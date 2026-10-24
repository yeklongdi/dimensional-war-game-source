import type { LockPort, SaveRequest, StoragePort } from '../game/save-storage.js';
import { saveKey } from '../game/save-format.js';
import { saveKeyV2 } from '../game/save-v2.js';
import { sampleV2 } from './m4-helpers.js';

export function serialLock(): LockPort {
  let queue = Promise.resolve();
  return { run<T>(work: () => T | Promise<T>) {
    const task = queue.then(work); queue = task.then(() => undefined, () => undefined); return task;
  } };
}
export function memory(v2: string | null = null, v1: string | null = null) {
  const values = new Map<string, string>(); if (v2 !== null) values.set(saveKeyV2, v2); if (v1 !== null) values.set(saveKey, v1);
  const writes: string[] = [];
  const storage: StoragePort = { getItem: key => values.get(key) ?? null, setItem: (key, value) => { writes.push(key); values.set(key, value); } };
  return { values, storage, writes };
}
export const request = (): Extract<SaveRequest, { kind: 'save' }> => ({ kind: 'save', run: 2, revision: 1, data: sampleV2() });
