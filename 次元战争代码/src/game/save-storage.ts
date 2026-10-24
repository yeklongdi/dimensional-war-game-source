import type { StoryLibrary } from './state.js';
import { saveKey } from './save-format.js';
import { decodeV2, encodeV2, mergeV2, readSaves, saveKeyV2 } from './save-v2.js';
import type { SaveReadV2, SaveV2 } from './save-v2.js';

export type SaveRequest = { run: number; revision: number } & ({ kind: 'migrate' }
  | { kind: 'save'; data: SaveV2; replace?: { key: 'v1' | 'v2'; raw: string } });
export type SaveOutcome = { kind: 'saved'; data: SaveV2; migrated?: boolean } | { kind: 'stale' } | { kind: 'read'; read: SaveReadV2 };
export type StoragePort = { getItem(key: string): string | null; setItem(key: string, value: string): void };
export type LockPort = { run<T>(work: () => T | Promise<T>): Promise<T> };
export type SaveStore = {
  read(): SaveReadV2;
  write(request: SaveRequest, current: () => boolean): Promise<SaveOutcome>;
};

/** v1 永远只读。沿用同源协调锁，迁移与 v2 保存都在锁内重读、合并和校验。 */
export function createSaveStore(storage: StoragePort, lock: LockPort, library: StoryLibrary): SaveStore {
  const read = (): SaveReadV2 => {
    try { return readSaves(storage.getItem(saveKeyV2), () => storage.getItem(saveKey), library); }
    catch { return { kind: 'unavailable', message: '无法读取浏览器存档。本次仍可游玩，进度暂不保存。' }; }
  };
  return {
    read,
    async write(request, current) {
      try {
        return await lock.run((): SaveOutcome => {
          if (!current()) return { kind: 'stale' };
          const latest = read();
          if (latest.kind === 'unavailable') return { kind: 'read', read: latest };
          if (request.kind === 'migrate') {
            if (latest.kind === 'valid') return { kind: 'saved', data: latest.data };
            if (latest.kind !== 'migration') return { kind: 'read', read: latest };
            const checked = decodeV2(encodeV2(latest.data), library);
            if (checked.kind !== 'valid') return { kind: 'read', read: checked };
            if (!current()) return { kind: 'stale' };
            storage.setItem(saveKeyV2, encodeV2(checked.data));
            return { kind: 'saved', data: checked.data, migrated: true };
          }
          if (latest.kind === 'invalid' && (latest.raw !== request.replace?.raw || latest.key !== request.replace.key)) return { kind: 'read', read: latest };
          const candidate = decodeV2(encodeV2(request.data), library);
          if (candidate.kind !== 'valid') return { kind: 'read', read: { kind: 'unavailable', message: '本次进度未通过保存校验，原存档未改动。' } };
          const data = mergeV2(latest.kind === 'valid' || latest.kind === 'migration' ? latest.data : undefined, candidate.data);
          const checked = decodeV2(encodeV2(data), library);
          if (checked.kind !== 'valid') return { kind: 'read', read: { kind: 'unavailable', message: '本次进度未通过保存校验，原存档未改动。' } };
          if (!current()) return { kind: 'stale' };
          storage.setItem(saveKeyV2, encodeV2(checked.data));
          return { kind: 'saved', data: checked.data };
        });
      } catch {
        return { kind: 'read', read: { kind: 'unavailable', message: '保存失败，本次进度仍在当前页面；关闭或刷新可能丢失新进度。' } };
      }
    },
  };
}

export function browserSaveStore(library: StoryLibrary): SaveStore {
  return createSaveStore({
    getItem: key => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  }, {
    async run(work) {
      if (!navigator.locks) throw new Error('当前环境无法安全协调存档写入');
      return navigator.locks.request(saveKey, work);
    },
  }, library);
}
