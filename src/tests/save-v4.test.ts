import { describe, expect, it } from 'vitest';
import { createStoryVaultStore, decodeV4, encodeV4, saveKeyV4, storyContentVersion } from '../game/save-v4.js';
import { fingerprint, newVault, readSlot, saveKeyV3 } from '../game/save-v3.js';
import { saveKey, encodeSave } from '../game/save-format.js';
import { encodeV2, saveKeyV2 } from '../game/save-v2.js';
import { hydrateRuntime, reduceRuntime, systemToken } from '../game/runtime.js';
import { storyLibrary } from '../game/story/library.js';
import { defaults, settingsKey } from '../game/settings.js';
import { memory, serialLock } from './map-save-helpers.js';
import { sampleSave, sampleV2 } from './m4-helpers.js';
import type { VaultRequest } from '../game/vault-storage.js';

const activation = (id = 'new-version-four-run'): Extract<VaultRequest, { kind: 'activate' }> => ({
  kind: 'activate', id, runId: '', session: 1, revision: 1, slot: -1, expected: 'null', newId: id,
  data: { version: 2, flags: {}, completedLevelIds: [], checkpoint: { kind: 'map' }, savedAt: 100 },
});
const setup = () => { const m = memory(); return { ...m, store: createStoryVaultStore(m.storage, serialLock(), storyLibrary) }; };

describe('新版v4独立容器与只读旧档', () => {
  it('v1/v2/v3逐字保留，检查与hydrate不写入、不迁移，第一次新游戏要求确认', async () => {
    const m = setup();
    m.values.set(saveKey, ` \n${encodeSave(sampleSave())}\n`);
    m.values.set(saveKeyV2, `\n${encodeV2(sampleV2())} `);
    m.values.set(saveKeyV3, ` ${JSON.stringify(newVault('old-run-identity', sampleV2()))}\n`);
    m.values.set(settingsKey, JSON.stringify({ ...defaults, bgm: 19 }));
    const before = new Map(m.values), read = m.store.read();
    expect(read).toMatchObject({ kind: 'empty', legacy: [{ key: saveKey, status: 'retained' },
      { key: saveKeyV2, status: 'retained' }, { key: saveKeyV3, status: 'retained' }] });
    const t = hydrateRuntime(0, read, { data: { ...defaults }, message: '' }, 'v4-client-identity', storyLibrary);
    expect(t.vaults).toBeUndefined(); expect(t.state.progress!.checkpoint).toBeUndefined(); expect(m.writes).toHaveLength(0);
    const ask = reduceRuntime(t.state, { type: 'system', intent: 'new', token: systemToken(t.state) }, storyLibrary, 100, 'v4-first-new-run');
    expect(ask.state.system!.panel).toBe('confirm'); expect(ask.vaults).toBeUndefined();
    const confirmed = reduceRuntime(ask.state, { type: 'system', intent: 'confirm', token: systemToken(ask.state) }, storyLibrary, 100, 'v4-first-new-run');
    expect((await m.store.write(confirmed.vaults![0]!, () => true)).kind).toBe('ok');
    expect(m.writes).toEqual([saveKeyV4]);
    for (const [key, raw] of before) expect(m.values.get(key), key).toBe(raw);
    const disk = JSON.parse(m.values.get(saveKeyV4)!);
    expect(disk).toMatchObject({ version: 4, contentVersion: storyContentVersion, manual: Array(6).fill(null) });
    expect(decodeV4(m.values.get(saveKeyV4)!).kind).toBe('valid');
  });
  it('合法旧容器放到v4键也不能误读，内容版本缺失或错误明确拒绝', () => {
    const legacy = newVault('old-run-identity', sampleV2());
    for (const raw of [JSON.stringify(legacy), JSON.stringify({ ...legacy, version: 4 }),
      JSON.stringify({ ...legacy, version: 4, contentVersion: 'future-story' }), ' 坏v4\n']) {
      const m = setup(); m.values.set(saveKeyV4, raw);
      expect(m.store.read()).toMatchObject({ kind: 'invalid', raw }); expect(m.writes).toHaveLength(0);
    }
  });
  it('坏旧档与旧版本档分别展示，均不占用新版槽且不清理', () => {
    const m = setup(); m.values.set(saveKeyV3, ' 坏旧档\n');
    expect(m.store.read()).toMatchObject({ kind: 'empty', legacy: [{ status: 'invalid' }] });
    expect(m.values.get(saveKeyV3)).toBe(' 坏旧档\n');
  });
  it('可解析JSON也必须通过对应旧格式校验，不能把缺字段旧档标成有效旧版本', () => {
    const m = setup();
    m.values.set(saveKey, JSON.stringify({ actId: 'prologue', sceneId: 'p001', flags: {} }));
    m.values.set(saveKeyV2, JSON.stringify({ version: 2, flags: {}, completedLevelIds: [] }));
    expect(m.store.read().legacy?.map(item => item.status)).toEqual(['invalid', 'invalid']);
    expect(m.writes).toHaveLength(0);
  });
  it('旧七关完成档按旧剧情校验，不因缺少新版取剑flag而误标损坏', () => {
    const m = setup(), old = { ...sampleV2(), completedLevelIds: ['prologue_01', 'prologue_02', 'prologue_03', 'act1_01', 'act1_02', 'act1_03', 'act1_04'],
      flags: { flag_prologue_completed: true, flag_act1_completed: true }, checkpoint: { kind: 'map' } };
    m.values.set(saveKeyV2, JSON.stringify(old));
    expect(m.store.read()).toMatchObject({ kind: 'empty', legacy: [{ key: saveKeyV2, status: 'retained' }] });
    expect(m.writes).toHaveLength(0);
  });
  it('明确替换坏v4前再次核对原串；旧档始终不受影响', async () => {
    const m = setup(); m.values.set(saveKeyV4, '坏新版'); m.values.set(saveKeyV3, '旧原件');
    expect(await m.store.write({ ...activation(), replaceRaw: '另一份坏新版' }, () => true)).toMatchObject({ kind: 'conflict' });
    expect(m.values.get(saveKeyV4)).toBe('坏新版');
    expect(await m.store.write({ ...activation(), replaceRaw: '坏新版' }, () => true)).toMatchObject({ kind: 'ok' });
    expect(m.values.get(saveKeyV3)).toBe('旧原件');
  });
  it('旧迁移请求与过期请求均不创建v4', async () => {
    const m = setup();
    expect(await m.store.write({ kind: 'migrate', id: 'legacy-migration', runId: '', session: 1, revision: 1, newId: 'do-not-migrate' }, () => true)).toMatchObject({ kind: 'error' });
    expect(await m.store.write(activation(), () => false)).toMatchObject({ kind: 'stale' }); expect(m.writes).toHaveLength(0);
  });
});
describe('v4复用锁内协调的实际磁盘边界', () => {
  it('六槽分别保存，显式读取较早槽切换身份并真实回退，新游戏仍保留六槽', async () => {
    const m = setup(); await m.store.write(activation(), () => true);
    for (let slot = 1; slot <= 6; slot++) {
      expect(await m.store.write({ kind: 'manual', id: `manual-${slot}`, runId: 'new-version-four-run', session: 1, revision: slot + 1,
        slot, expected: 'null', data: sampleV2(slot % 2 ? 'prologue' : 'act1') }, () => true)).toMatchObject({ kind: 'ok' });
    }
    const before = m.store.read(); if (before.kind !== 'valid') throw new Error('应有容器');
    expect(before.data.manual.every(slot => readSlot(slot, storyLibrary).kind === 'valid')).toBe(true);
    const earlier = readSlot(before.data.manual[0], storyLibrary); if (earlier.kind !== 'valid') throw new Error('应有手动档');
    const loaded = await m.store.write({ ...activation('read-earlier-v4'), runId: before.data.activeRunId, slot: 1,
      expected: fingerprint(before.data.manual[0]), data: earlier.record.data }, () => true);
    expect(loaded).toMatchObject({ kind: 'ok', data: { auto: { data: earlier.record.data }, manual: before.data.manual } });
    if (loaded.kind !== 'ok') throw new Error('读取失败');
    const restarted = await m.store.write({ ...activation('restart-v4-identity'), runId: loaded.data.activeRunId,
      expected: fingerprint(loaded.data.auto) }, () => true);
    expect(restarted).toMatchObject({ kind: 'ok', data: { manual: before.data.manual, auto: { data: { flags: {}, completedLevelIds: [] } } } });
  });
  it('两窗口不同槽并发不互相覆盖，切换运行后旧请求拒绝', async () => {
    const m = memory(), lock = serialLock();
    const a = createStoryVaultStore(m.storage, lock, storyLibrary), b = createStoryVaultStore(m.storage, lock, storyLibrary);
    await a.write(activation(), () => true);
    const op = (slot: number): VaultRequest => ({ kind: 'manual', id: `window-${slot}`, runId: 'new-version-four-run', session: 1,
      revision: 2, slot, expected: 'null', data: sampleV2() });
    const results = await Promise.all([a.write(op(1), () => true), b.write(op(2), () => true)]);
    expect(results.map(item => item.kind)).toEqual(['ok', 'ok']);
    const latest = a.read(); if (latest.kind !== 'valid') throw new Error('应有容器');
    expect(latest.data.manual.slice(0, 2).every(item => readSlot(item, storyLibrary).kind === 'valid')).toBe(true);
    await b.write({ ...activation('foreign-v4-run'), runId: latest.data.activeRunId, expected: fingerprint(latest.data.auto) }, () => true);
    const raw = m.values.get(saveKeyV4);
    expect(await a.write({ kind: 'auto', id: 'late-auto', runId: latest.data.activeRunId, session: 1, revision: 99, data: sampleV2() }, () => true)).toMatchObject({ kind: 'conflict' });
    expect(m.values.get(saveKeyV4)).toBe(raw);
  });
  it('损坏一个手动槽不清除其他槽，写入失败保留原容器', async () => {
    const m = setup(), data = newVault('new-version-four-run', sampleV2());
    data.manual[0] = '坏槽'; data.manual[1] = { revision: 1, data: sampleV2() };
    m.values.set(saveKeyV4, encodeV4(data)); const raw = m.values.get(saveKeyV4);
    const failing = createStoryVaultStore({ ...m.storage, setItem() { throw new Error('配额故障'); } }, serialLock(), storyLibrary);
    expect(await failing.write({ kind: 'manual', id: 'fail-manual', runId: data.activeRunId, session: 1, revision: 2,
      slot: 3, expected: 'null', data: sampleV2() }, () => true)).toMatchObject({ kind: 'error' });
    expect(m.values.get(saveKeyV4)).toBe(raw);
    const result = await m.store.write({ kind: 'manual', id: 'good-manual', runId: data.activeRunId, session: 1, revision: 2,
      slot: 3, expected: 'null', data: sampleV2() }, () => true);
    expect(result).toMatchObject({ kind: 'ok', data: { manual: ['坏槽', data.manual[1], expect.anything(), null, null, null] } });
  });
});
