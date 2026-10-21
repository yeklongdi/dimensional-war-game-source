import { describe, expect, it } from 'vitest';
import { createSaveStore } from '../game/save-storage.js';
import { encodeV2, saveKeyV2 } from '../game/save-v2.js';
import { saveKey } from '../game/save-format.js';
import { storyLibrary } from '../game/story/library.js';
import { sampleV2 } from './m4-helpers.js';
import { memory, request, serialLock } from './map-save-helpers.js';

describe('v2存储IO与跨窗口协调（替代M4旧位置优先断言）', () => {
  it('读取空槽不写入；保存只写v2，不触碰v1或其他项目键', async () => {
    const m = memory(); m.values.set('other-app', '保留');
    const store = createSaveStore(m.storage, serialLock(), storyLibrary);
    expect(store.read()).toEqual({ kind: 'empty' }); expect(m.writes).toHaveLength(0);
    expect((await store.write(request(), () => true)).kind).toBe('saved');
    expect(m.values.get('other-app')).toBe('保留'); expect(m.writes).toEqual([saveKeyV2]); expect(m.values.has(saveKey)).toBe(false);
  });
  it.each(['v1', 'v2'] as const)('%s坏档不会自动覆盖，明确确认后只写v2，v1原件保留', async key => {
    const m = memory(key === 'v2' ? '坏档' : null, key === 'v1' ? '坏档' : null), store = createSaveStore(m.storage, serialLock(), storyLibrary);
    expect(await store.write(request(), () => true)).toMatchObject({ kind: 'read', read: { kind: 'invalid', raw: '坏档', key } });
    expect(m.writes).toHaveLength(0);
    expect((await store.write({ ...request(), replace: { key, raw: '坏档' } }, () => true)).kind).toBe('saved');
    expect(m.writes).toEqual([saveKeyV2]); expect(m.values.get(saveKey)).toBe(key === 'v1' ? '坏档' : undefined);
  });
  it('确认期间原始坏档变化或来源键不符则拒绝替换', async () => {
    const m = memory('第二份坏档'), store = createSaveStore(m.storage, serialLock(), storyLibrary);
    for (const replace of [{ key: 'v2' as const, raw: '第一份坏档' }, { key: 'v1' as const, raw: '第二份坏档' }]) {
      expect(await store.write({ ...request(), replace }, () => true)).toMatchObject({ kind: 'read', read: { raw: '第二份坏档' } });
    }
    expect(m.values.get(saveKeyV2)).toBe('第二份坏档'); expect(m.writes).toHaveLength(0);
  });
  it('另一窗口修复时累计保留其完成前缀，旧检查点改为地图', async () => {
    const other = sampleV2('act1', 'a016'), m = memory(encodeV2(other)), store = createSaveStore(m.storage, serialLock(), storyLibrary);
    const result = await store.write({ ...request(), replace: { key: 'v2', raw: '原坏档' } }, () => true);
    expect(result).toMatchObject({ kind: 'saved', data: { checkpoint: { kind: 'map' }, completedLevelIds: other.completedLevelIds } });
  });
  it('两个窗口并发合并更长前缀和true记录，不能把继续位置退回已完成关', async () => {
    const m = memory(), lock = serialLock(), a = createSaveStore(m.storage, lock, storyLibrary), b = createSaveStore(m.storage, lock, storyLibrary);
    const advanced = sampleV2('act1', 'a016'); advanced.flags.flag_act1_a010_03 = true;
    const older = request(); older.data.flags.flag_prologue_p005_01 = true;
    await Promise.all([a.write({ ...request(), data: advanced }, () => true), b.write(older, () => true)]);
    expect(a.read()).toMatchObject({ kind: 'valid', data: { checkpoint: { kind: 'map' }, completedLevelIds: advanced.completedLevelIds,
      flags: { flag_act1_a010_03: true, flag_prologue_p005_01: true } } });
  });
  it('同一当前关最后成功位置生效，不能用时间戳清累计记录', async () => {
    const first = sampleV2('act1', 'a012'), second = sampleV2('act1', 'a010'); first.savedAt = 300; second.savedAt = 100;
    first.flags.flag_act1_a010_03 = true;
    const m = memory(encodeV2(first)), store = createSaveStore(m.storage, serialLock(), storyLibrary);
    const result = await store.write({ ...request(), data: second }, () => true);
    expect(result).toMatchObject({ kind: 'saved', data: { savedAt: 100, checkpoint: { sceneId: 'a010' }, flags: { flag_act1_a010_03: true } } });
  });
  it('读取和写入异常均明确失败，不假装成功', async () => {
    const store = createSaveStore({ getItem() { throw new Error('拒绝'); }, setItem() { throw new Error('不应调用'); } }, serialLock(), storyLibrary);
    expect(store.read().kind).toBe('unavailable');
    expect(await store.write(request(), () => true)).toMatchObject({ kind: 'read', read: { kind: 'unavailable' } });
    const writeFail = createSaveStore({ getItem: () => null, setItem() { throw new Error('配额'); } }, serialLock(), storyLibrary);
    expect(await writeFail.write(request(), () => true)).toMatchObject({ kind: 'read', read: { message: expect.stringContaining('保存失败') } });
  });
  it('无锁时不进行无协调写入', async () => {
    const m = memory(), store = createSaveStore(m.storage, { async run() { throw new Error('无锁'); } }, storyLibrary);
    expect((await store.write(request(), () => true)).kind).toBe('read'); expect(m.writes).toHaveLength(0);
  });
  it('等待锁时旧会话/旧请求已过期，不写入', async () => {
    const m = memory(); let current = true;
    const store = createSaveStore(m.storage, serialLock(), storyLibrary), pending = store.write(request(), () => current); current = false;
    expect(await pending).toEqual({ kind: 'stale' }); expect(m.writes).toHaveLength(0);
  });
  it('拒绝非法候选前缀，不能用远端合法进度掩盖候选缺口', async () => {
    const m = memory(encodeV2(sampleV2('act1'))), store = createSaveStore(m.storage, serialLock(), storyLibrary), bad = request();
    bad.data.completedLevelIds = ['prologue_02'];
    expect(await store.write(bad, () => true)).toMatchObject({ kind: 'read', read: { kind: 'unavailable' } }); expect(m.writes).toHaveLength(0);
  });
});
