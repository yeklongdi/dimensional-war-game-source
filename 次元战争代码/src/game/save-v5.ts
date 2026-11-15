import { decodeRunSnapshot, readRunSlot } from './save-run.js';
import type { StoragePort, LockPort } from './save-storage.js';
import { decodeV3, record, saveKeyV3 } from './save-v3.js';
import type { SaveV3, VaultRead } from './save-v3.js';
import { legacyArchives, saveKeyV4 } from './save-v4.js';
import type { StoryLibrary } from './state.js';
import { browserStorage, createVaultStore } from './vault-storage.js';
import type { VaultOutcome, VaultStore } from './vault-storage.js';

export const saveKeyV5 = 'dw.save.v5';
export const postPrologueContentVersion = 'post_prologue_demo_v1';
const internalInvalid = 'invalid-v5:';
type CleanableStorage = StoragePort & { removeItem(key: string): void };

export function encodeV5(data: SaveV3): string {
  return JSON.stringify({ ...data, version: 5, contentVersion: postPrologueContentVersion });
}

export function decodeV5(raw: string | null): VaultRead {
  if (raw === null) return { kind: 'empty', format: 5 };
  const invalid: VaultRead = { kind: 'invalid', raw, format: 5, message: 'v5 容器或内容版本无法读取，原档已保留。' };
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return invalid; }
  if (!record(value) || value.version !== 5 || value.contentVersion !== postPrologueContentVersion) return invalid;
  const { contentVersion: _contentVersion, ...container } = value;
  const parsed = decodeV3(JSON.stringify({ ...container, version: 3 }));
  return parsed.kind === 'valid' ? { ...parsed, format: 5 } : invalid;
}

export function createGameVaultStore(storage: CleanableStorage, lock: LockPort, library: StoryLibrary): VaultStore {
  const read = (): VaultRead => {
    try {
      return { ...decodeV5(storage.getItem(saveKeyV5)), legacy: legacyArchives(storage), v4Raw: storage.getItem(saveKeyV4) ?? undefined };
    } catch { return { kind: 'unavailable', format: 5, message: '无法读取浏览器存储，原记录已保留。' }; }
  };
  const adapter: StoragePort = {
    getItem(key) {
      if (key !== saveKeyV3) return null;
      const parsed = decodeV5(storage.getItem(saveKeyV5));
      return parsed.kind === 'valid' ? JSON.stringify(parsed.data) : parsed.kind === 'invalid' ? internalInvalid + parsed.raw : null;
    },
    setItem(key, raw) {
      const parsed = decodeV3(raw);
      if (key !== saveKeyV3 || parsed.kind !== 'valid') throw new Error('v5 槽协调器输出无效');
      storage.setItem(saveKeyV5, encodeV5(parsed.data));
    },
  };
  const coordinator = createVaultStore(adapter, { async run(work) { return work(); } }, library, decodeRunSnapshot);

  function finishCleanup(current: Extract<VaultRead, { kind: 'valid' }>, raw: string): VaultOutcome {
    try {
      if (storage.getItem(saveKeyV4) === raw) storage.removeItem(saveKeyV4);
      if (storage.getItem(saveKeyV4) === null) return { kind: 'ok', data: current.data, read: { ...current, v4Raw: undefined } };
    } catch { /* 新档已经验证成功，旧档清理可单独重试。 */ }
    return { kind: 'ok', data: current.data, read: current, message: 'v5 已保存。旧 v4 尚未清理，可在读取界面重试。' };
  }

  return { read, async write(request, current) {
    try {
      return await lock.run(async (): Promise<VaultOutcome> => {
        if (!current()) return { kind: 'stale' };
        const before = read();
        if (before.kind === 'unavailable') return { kind: 'error', message: before.message };
        if (request.kind === 'migrate') return { kind: 'error', message: 'v5 首次游玩从 P001 新建进度。' };
        if (request.kind === 'cleanup-v4') {
          if (before.kind !== 'valid' || before.data.activeRunId !== request.runId
            || before.v4Raw !== request.expectedRaw || readRunSlot(before, 0, library).kind !== 'valid')
            return { kind: 'conflict', read: before, message: '存档已变化，请核对后重新确认清理。' };
          return finishCleanup(before, request.expectedRaw);
        }
        const firstNew = request.kind === 'activate' && request.slot === -1 && before.kind !== 'valid';
        if (firstNew && before.v4Raw !== request.removeV4)
          return { kind: 'conflict', read: before, message: '旧 v4 档已变化，请重新确认新建和清理。' };
        const translated = request.kind === 'activate' && request.replaceRaw !== undefined
          ? { ...request, replaceRaw: internalInvalid + request.replaceRaw } : request;
        const result = await coordinator.write(translated, current);
        if (result.kind === 'conflict') return { ...result, read: read() };
        if (result.kind !== 'ok') return result;
        const after = read();
        if (after.kind !== 'valid' || after.data.activeRunId !== result.data.activeRunId
          || after.data.revision !== result.data.revision)
          return { kind: 'error', message: '写入后的 v5 存档未通过读取校验，旧 v4 已保留。' };
        if (firstNew && request.removeV4 !== undefined) {
          const auto = readRunSlot(after, 0, library);
          if (auto.kind === 'valid' && auto.record.data.checkpoint.kind === 'level' && auto.record.data.checkpoint.sceneId === 'p001'
            && auto.record.data.completedLevelIds.length === 0) return finishCleanup(after, request.removeV4);
        }
        return { ...result, read: after };
      });
    } catch {
      return { kind: 'error', message: '存档操作失败，请检查浏览器储存权限和可用空间。' };
    }
  } };
}

export function browserGameVaultStore(library: StoryLibrary): VaultStore {
  return createGameVaultStore({ ...browserStorage, removeItem: key => localStorage.removeItem(key) }, {
    async run(work) {
      if (!navigator.locks) throw new Error('缺少安全存档锁');
      return await navigator.locks.request(saveKeyV4, () => navigator.locks.request(saveKeyV5, work));
    },
  }, library);
}
