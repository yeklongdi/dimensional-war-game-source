import type { StoryLibrary } from './state.js';
import type { StoragePort, LockPort } from './save-storage.js';
import { saveKey } from './save-format.js';
import { decodeV2, mergeV2, saveKeyV2 } from './save-v2.js';
import type { SaveV2 } from './save-v2.js';
import { fingerprint, newVault, readSlot, readVault, saveKeyV3, slotValue } from './save-v3.js';
import type { SaveV3, VaultRead } from './save-v3.js';

type Base = { id: string; runId: string; session: number; revision: number };
export type VaultRequest = Base & ({ kind: 'migrate'; newId: string }
  | { kind: 'auto'; data: SaveV2 }
  | { kind: 'manual'; slot: number; data: SaveV2; expected: string }
  | { kind: 'activate'; slot: number; expected: string; newId: string; data: SaveV2; replaceRaw?: string });
export type VaultOutcome = { kind: 'ok'; data: SaveV3 } | { kind: 'stale' }
  | { kind: 'conflict'; read: VaultRead; message: string } | { kind: 'error'; message: string };
export type VaultStore = { read(): VaultRead; write(request: VaultRequest, current: () => boolean): Promise<VaultOutcome> };

export function createVaultStore(storage: StoragePort, lock: LockPort, library: StoryLibrary): VaultStore {
  const seen = new Set<string>();
  const read = (): VaultRead => {
    try { return readVault(storage.getItem(saveKeyV3), () => storage.getItem(saveKeyV2), () => storage.getItem(saveKey), library); }
    catch { return { kind: 'unavailable', message: '无法读取浏览器存储，未修改原存档。' }; }
  };
  return { read, async write(request, current) {
    try {
      return await lock.run((): VaultOutcome => {
        if (!current() || seen.has(request.id)) return { kind: 'stale' };
        const latest = read();
        const conflict = (message: string): VaultOutcome => ({ kind: 'conflict', read: latest, message });
        if (latest.kind === 'unavailable') return { kind: 'error', message: latest.message };
        if (request.kind !== 'migrate' && decodeV2(JSON.stringify(request.data), library).kind !== 'valid') return { kind: 'error', message: '进度未通过保存校验，原记录未修改。' };
        if (request.kind === 'activate' && (!Number.isInteger(request.slot) || request.slot < -1 || request.slot > 6)) return { kind: 'error', message: '无效读取槽位' };
        let data: SaveV3;
        if (request.kind === 'migrate') {
          if (latest.kind === 'valid') return { kind: 'ok', data: latest.data };
          if (latest.kind !== 'migration') return conflict('迁移来源已变化，请重新载入。');
          data = newVault(request.newId, latest.data);
        } else if (request.kind === 'activate') {
          if (latest.kind === 'invalid') {
            if (request.slot !== -1 || request.replaceRaw !== latest.raw) return conflict('损坏记录已变化，请重新确认。');
            data = newVault(request.newId, request.data);
          } else if (latest.kind === 'empty') {
            if (request.runId || request.slot !== -1) return conflict('目标进度已变化，请重新载入。');
            data = newVault(request.newId, request.data);
          } else if (latest.kind === 'valid') {
            if (latest.data.activeRunId !== request.runId) return conflict('其他窗口已切换活动进度，请重新载入。');
            const target = slotValue(latest.data, request.slot < 0 ? 0 : request.slot);
            if (fingerprint(target) !== request.expected) return conflict('目标槽位已被其他窗口更新，请重新确认。');
            const slot = readSlot(target, library, latest.data.revision);
            if (request.slot >= 0 && slot.kind !== 'valid') return conflict('该槽位不能读取。');
            const value = request.slot < 0 ? request.data : slot.kind === 'valid' ? slot.record.data : request.data;
            data = { ...latest.data, activeRunId: request.newId, revision: latest.data.revision + 1,
              auto: { revision: latest.data.revision + 1, data: structuredClone(value) } };
          } else return conflict('旧档升级尚未完成，请稍后重试。');
        } else {
          if (latest.kind !== 'valid' || latest.data.activeRunId !== request.runId) return conflict('其他窗口已切换活动进度，请重新载入。');
          data = { ...latest.data, revision: latest.data.revision + 1, manual: [...latest.data.manual] };
          if (request.kind === 'manual') {
            if (!Number.isInteger(request.slot) || request.slot < 1 || request.slot > 6) return { kind: 'error', message: '无效手动槽位' };
            if (fingerprint(slotValue(data, request.slot)) !== request.expected) return conflict('目标槽位已被其他窗口更新，请重新确认。');
            data.manual[request.slot - 1] = { revision: data.revision, data: structuredClone(request.data) };
          } else {
            const auto = readSlot(data.auto, library, latest.data.revision);
            if (auto.kind === 'invalid') return conflict('自动档损坏，已停止自动覆盖；可读取有效手动档或确认新游戏。');
            data.auto = { revision: data.revision, data: mergeV2(auto.kind === 'valid' ? auto.record.data : undefined, request.data) };
          }
        }
        const auto = readSlot(data.auto, library, data.revision);
        if (request.kind !== 'manual' && (auto.kind !== 'valid' || decodeV2(JSON.stringify(auto.record.data), library).kind !== 'valid')) return { kind: 'error', message: '进度未通过保存校验，原记录未修改。' };
        if (!current()) return { kind: 'stale' };
        storage.setItem(saveKeyV3, JSON.stringify(data)); seen.add(request.id);
        return { kind: 'ok', data };
      });
    } catch { return { kind: 'error', message: '保存失败，原存档未修改；本次页面内进度仍保留，请重试。' }; }
  } };
}
export const browserStorage: StoragePort = { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) };
export function browserVaultStore(library: StoryLibrary): VaultStore {
  return createVaultStore(browserStorage, { async run(work) {
    if (!navigator.locks) throw new Error('缺少安全存档锁');
    return navigator.locks.request(saveKeyV3, work);
  } }, library);
}
