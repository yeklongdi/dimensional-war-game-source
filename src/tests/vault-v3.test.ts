import { describe, expect, it } from 'vitest';
import { decodeV3, readVault, readSlot, newVault, saveKeyV3, fingerprint } from '../game/save-v3.js';
import { createVaultStore } from '../game/vault-storage.js';
import type { VaultRequest } from '../game/vault-storage.js';
import { settingsKey } from '../game/settings.js';
import { saveKey, encodeSave } from '../game/save-format.js';
import { saveKeyV2, encodeV2 } from '../game/save-v2.js';
import { storyLibrary } from '../game/story/library.js';
import { sampleSave, sampleV2 } from './m4-helpers.js';
import { memory, serialLock } from './map-save-helpers.js';

const id = 'active-run-identity';
const base = () => ({ id: 'client:operation:1', runId: id, session: 2, revision: 1 });
const seeded = () => { const m = memory(); m.values.set(saveKeyV3, JSON.stringify(newVault(id, sampleV2()))); return m; };
const manual = (slot = 1): Extract<VaultRequest, { kind: 'manual' }> => ({ ...base(), kind: 'manual', slot, data: sampleV2(), expected: 'null' });
describe('v3格式与只读旧档', () => {
  it('固定六槽，未知版本或坏容器不被有效v2覆盖', () => {
    const v2 = encodeV2(sampleV2());
    for (const raw of ['坏档', JSON.stringify({ version: 4 }), JSON.stringify({ ...newVault(id, sampleV2()), manual: [] })])
      expect(readVault(raw, () => v2, () => null, storyLibrary).kind).toBe('invalid');
  });
  it('坏槽独立隔离，保留原值和其他有效槽', () => {
    const value = newVault(id, sampleV2()); value.manual[0] = { broken: '保留' }; value.manual[1] = value.auto;
    const parsed = decodeV3(JSON.stringify(value)); expect(parsed.kind).toBe('valid');
    expect(readSlot(value.manual[0], storyLibrary).kind).toBe('invalid'); expect(readSlot(value.manual[1], storyLibrary).kind).toBe('valid');
    expect(value.manual[0]).toEqual({ broken: '保留' });
  });
  it.each(['p001', 'p006', 'p009', 'a007', 'a010', 'a014', 'a016'])('%s的v2原串升级只写v3', async scene => {
    const data = sampleV2(scene.startsWith('p') ? 'prologue' : 'act1', scene), raw = ` \n${encodeV2(data)}\n `;
    const m = memory(raw, 'v1原件'), store = createVaultStore(m.storage, serialLock(), storyLibrary);
    expect(store.read().kind).toBe('migration');
    const result = await store.write({ ...base(), runId: '', kind: 'migrate', newId: id }, () => true);
    expect(result.kind).toBe('ok'); expect(m.values.get(saveKeyV2)).toBe(raw); expect(m.values.get(saveKey)).toBe('v1原件'); expect(m.writes).toEqual([saveKeyV3]);
  });
  it('无v2时沿用v1迁移，坏v2不降级读v1', async () => {
    const raw = `\n${encodeSave(sampleSave('act1', 'a007'))} `, m = memory(null, raw), store = createVaultStore(m.storage, serialLock(), storyLibrary);
    const result = await store.write({ ...base(), kind: 'migrate', newId: id }, () => true);
    expect(result.kind).toBe('ok'); expect(m.values.get(saveKey)).toBe(raw); expect(m.values.has(saveKeyV2)).toBe(false);
    m.values.delete(saveKeyV3); m.values.set(saveKeyV2, '坏v2'); expect(store.read().kind).toBe('invalid');
  });
  it('升级写入失败不宣布成功，v1／v2仍原样', async () => {
    const m = memory(encodeV2(sampleV2()));
    const store = createVaultStore({ ...m.storage, setItem() { throw new Error('满'); } }, serialLock(), storyLibrary);
    expect((await store.write({ ...base(), kind: 'migrate', newId: id }, () => true)).kind).toBe('error');
    expect(store.read().kind).toBe('migration'); expect(m.values.has(saveKeyV3)).toBe(false);
  });
  it('两个窗口同时迁移只采用锁内已有v3', async () => {
    const m = memory(encodeV2(sampleV2())), lock = serialLock(), a = createVaultStore(m.storage, lock, storyLibrary), b = createVaultStore(m.storage, lock, storyLibrary);
    const [x, y] = await Promise.all([a.write({ ...base(), kind: 'migrate', newId: id }, () => true), b.write({ ...base(), kind: 'migrate', newId: 'different-id' }, () => true)]);
    expect(x.kind).toBe('ok'); expect(y.kind).toBe('ok'); expect(m.writes).toHaveLength(1);
  });
});
describe('锁内身份、槽位竞争与失败保护', () => {
  it('不同槽并发写入各自保留，不覆盖自动档或其他槽', async () => {
    const m = seeded(), lock = serialLock(), a = createVaultStore(m.storage, lock, storyLibrary), b = createVaultStore(m.storage, lock, storyLibrary), before = JSON.parse(m.values.get(saveKeyV3)!).auto;
    await Promise.all([a.write(manual(1), () => true), b.write({ ...manual(2), id: 'other-operation' }, () => true)]);
    const read = a.read(); if (read.kind !== 'valid') throw new Error('无效');
    expect(read.data.auto).toEqual(before); expect(readSlot(read.data.manual[0], storyLibrary).kind).toBe('valid'); expect(readSlot(read.data.manual[1], storyLibrary).kind).toBe('valid');
  });
  it('同槽过期确认拒绝整次写入，重新确认后才允许覆盖', async () => {
    const m = seeded(), lock = serialLock(), a = createVaultStore(m.storage, lock, storyLibrary), b = createVaultStore(m.storage, lock, storyLibrary);
    await a.write(manual(), () => true); const before = m.values.get(saveKeyV3);
    expect((await b.write({ ...manual(), id: 'old-confirm' }, () => true)).kind).toBe('conflict'); expect(m.values.get(saveKeyV3)).toBe(before);
    const data = JSON.parse(before!); expect((await b.write({ ...manual(), id: 'new-confirm', expected: fingerprint(data.manual[0]) }, () => true)).kind).toBe('ok');
  });
  it('新游戏切换身份后，锁内拒绝旧窗口自动保存，即使current返回true', async () => {
    const m = seeded(), lock = serialLock(), a = createVaultStore(m.storage, lock, storyLibrary), b = createVaultStore(m.storage, lock, storyLibrary);
    const value = JSON.parse(m.values.get(saveKeyV3)!);
    const start: VaultRequest = { ...base(), kind: 'activate', slot: -1, expected: fingerprint(value.auto), newId: 'new-run-identity', data: { version: 2, flags: {}, completedLevelIds: [], checkpoint: { kind: 'map' }, savedAt: 5 } };
    expect((await a.write(start, () => true)).kind).toBe('ok'); const before = m.values.get(saveKeyV3);
    expect((await b.write({ ...base(), kind: 'auto', data: sampleV2('act1', 'a014') }, () => true)).kind).toBe('conflict'); expect(m.values.get(saveKeyV3)).toBe(before);
  });
  it('读取较早手动档只替换auto，绝不合并最远进度', async () => {
    const m = seeded(), value = newVault(id, sampleV2('act1', 'a014')); value.manual[0] = { revision: 1, data: sampleV2('prologue', 'p001') };
    m.values.set(saveKeyV3, JSON.stringify(value)); const store = createVaultStore(m.storage, serialLock(), storyLibrary);
    const result = await store.write({ ...base(), kind: 'activate', slot: 1, expected: fingerprint(value.manual[0]), newId: 'restored-run-id', data: sampleV2() }, () => true);
    if (result.kind !== 'ok') throw new Error('未读取');
    expect(result.data.manual).toEqual(value.manual); expect(readSlot(result.data.auto, storyLibrary)).toMatchObject({ record: { data: { flags: {}, completedLevelIds: [], checkpoint: { sceneId: 'p001' } } } });
  });
  it('一个坏自动槽不阻止保存其他手动槽，坏值原样保留', async () => {
    const m = seeded(), v = newVault(id, sampleV2()); v.auto = { bad: 'auto' }; m.values.set(saveKeyV3, JSON.stringify(v));
    const store = createVaultStore(m.storage, serialLock(), storyLibrary), result = await store.write(manual(), () => true);
    expect(result.kind).toBe('ok'); if (result.kind === 'ok') expect(result.data.auto).toEqual(v.auto);
  });
  it('写失败、过期回调、重复请求都不改原槽，设置键不涉及游戏容器', async () => {
    const m = seeded(), before = m.values.get(saveKeyV3), failing = createVaultStore({ ...m.storage, setItem() { throw new Error('拒绝'); } }, serialLock(), storyLibrary);
    expect((await failing.write(manual(), () => true)).kind).toBe('error'); expect(m.values.get(saveKeyV3)).toBe(before);
    const store = createVaultStore(m.storage, serialLock(), storyLibrary);
    expect((await store.write(manual(), () => false)).kind).toBe('stale'); expect(m.values.get(saveKeyV3)).toBe(before);
    await store.write(manual(), () => true); const saved = m.values.get(saveKeyV3);
    expect((await store.write(manual(), () => true)).kind).toBe('stale'); expect(m.values.get(saveKeyV3)).toBe(saved); expect(m.values.has(settingsKey)).toBe(false);
  });
  it('损坏容器需绑定原串确认，另一窗口建立有效档后不可覆盖', async () => {
    const m = seeded(); m.values.set(saveKeyV3, '坏容器'); const store = createVaultStore(m.storage, serialLock(), storyLibrary);
    const op: VaultRequest = { ...base(), runId: '', kind: 'activate', slot: -1, expected: 'null', newId: id, data: sampleV2(), replaceRaw: '坏容器' };
    m.values.set(saveKeyV3, JSON.stringify(newVault('other-run-identity', sampleV2()))); const before = m.values.get(saveKeyV3);
    expect((await store.write(op, () => true)).kind).toBe('conflict'); expect(m.values.get(saveKeyV3)).toBe(before);
  });
  it.each([0, 7, -1, 1.5])('非法手动槽%s不写入', async slot => {
    const m = seeded(), before = m.values.get(saveKeyV3), store = createVaultStore(m.storage, serialLock(), storyLibrary);
    expect((await store.write(manual(slot), () => true)).kind).toBe('error'); expect(m.values.get(saveKeyV3)).toBe(before);
  });
});
