import type { StoryLibrary } from './state.js';
import type { LockPort, StoragePort } from './save-storage.js';
import { decodeSave, saveKey } from './save-format.js';
import { decodeV2, saveKeyV2 } from './save-v2.js';
import { decodeV3, saveKeyV3, record } from './save-v3.js';
import type { LegacyArchive, SaveV3, VaultRead } from './save-v3.js';
import { createVaultStore } from './vault-storage.js';
import type { VaultStore } from './vault-storage.js';
import { legacyLibrary } from './story/legacy-library.js';

export const saveKeyV4 = 'dw.save.v4';
export const storyContentVersion = 'prologue_four_parts_v1';
export type SaveV4 = Omit<SaveV3, 'version'> & { version: 4; contentVersion: typeof storyContentVersion };

/** 磁盘格式v4；仅在复用的锁内槽协调器边界转换为经过验证的内部容器。 */
export function encodeV4(data: SaveV3): string {
  return JSON.stringify({ ...data, version: 4, contentVersion: storyContentVersion } satisfies SaveV4);
}
export function decodeV4(raw: string | null): VaultRead {
  if (raw === null) return { kind: 'empty' };
  const invalid = (): VaultRead => ({ kind: 'invalid', raw, message: '新版存档的内容版本或结构无法读取；原记录已保留。' });
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return invalid(); }
  if (!record(value) || value.version !== 4 || value.contentVersion !== storyContentVersion
    || Object.keys(value).sort().join(',') !== 'activeRunId,auto,contentVersion,manual,revision,version') return invalid();
  const { contentVersion: _contentVersion, ...container } = value;
  const parsed = decodeV3(JSON.stringify({ ...container, version: 3 }));
  return parsed.kind === 'valid' ? parsed : invalid();
}
function legacyArchives(storage: StoragePort): LegacyArchive[] {
  const items: LegacyArchive[] = [];
  for (const key of [saveKey, saveKeyV2, saveKeyV3]) {
    const raw = storage.getItem(key);
    if (raw === null) continue;
    let retained = false;
    try {
      const value: unknown = JSON.parse(raw);
      retained = record(value) && (key === saveKeyV3 ? decodeV3(raw).kind === 'valid'
        : key === saveKeyV2 ? decodeV2(raw, legacyLibrary).kind === 'valid'
          : decodeSave(raw, legacyLibrary).kind === 'valid');
    } catch { /* 保留损坏原串，不把它伪装为可读旧档。 */ }
    items.push({ key, status: retained ? 'retained' : 'invalid', message: retained
      ? '旧剧情版本，原档已保留；新版请开始新游戏。'
      : '旧记录格式损坏，原始字符串仍保留；未迁移、未清理。' });
  }
  return items;
}
export function createStoryVaultStore(storage: StoragePort, lock: LockPort, library: StoryLibrary): VaultStore {
  // v1/v2对协调器始终为空；v3仅为内部适配键，所有实际读写都落到v4。
  const adapter: StoragePort = {
    getItem(key) {
      if (key !== saveKeyV3) return null;
      const raw = storage.getItem(saveKeyV4), parsed = decodeV4(raw);
      if (parsed.kind === 'empty') return null;
      return parsed.kind === 'valid' ? JSON.stringify(parsed.data) : `invalid-v4:${raw}`;
    },
    setItem(key, value) {
      if (key !== saveKeyV3) throw new Error('拒绝写入旧版存档');
      const parsed = decodeV3(value);
      if (parsed.kind !== 'valid') throw new Error('内部容器校验失败');
      storage.setItem(saveKeyV4, encodeV4(parsed.data));
    },
  };
  const coordinator = createVaultStore(adapter, lock, library);
  const read = (): VaultRead => {
    try { return { ...decodeV4(storage.getItem(saveKeyV4)), legacy: legacyArchives(storage) }; }
    catch { return { kind: 'unavailable', message: '无法读取浏览器存储，未修改任何记录。' }; }
  };
  return { read, async write(request, current) {
    if (request.kind === 'migrate') return { kind: 'error', message: '新版剧情必须新开游戏；旧档不会自动迁移。' };
    const translated = request.kind === 'activate' && request.replaceRaw !== undefined
      ? { ...request, replaceRaw: `invalid-v4:${request.replaceRaw}` } : request;
    const outcome = await coordinator.write(translated, current);
    return outcome.kind === 'conflict' ? { ...outcome, read: read() } : outcome;
  } };
}
export function browserStoryVaultStore(library: StoryLibrary): VaultStore {
  return createStoryVaultStore({ getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) },
    { async run(work) {
      if (!navigator.locks) throw new Error('缺少安全存档锁');
      return navigator.locks.request(saveKeyV4, work);
    } }, library);
}
