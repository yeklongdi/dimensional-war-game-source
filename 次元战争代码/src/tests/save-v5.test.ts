import { describe, expect, it } from 'vitest';
import { levelIds } from '../content/levels.js';
import { startLoop } from '../game/loop/progress.js';
import { fingerprint, newVault } from '../game/save-v3.js';
import { encodeV4, saveKeyV4 } from '../game/save-v4.js';
import { createGameVaultStore, decodeV5, encodeV5, saveKeyV5 } from '../game/save-v5.js';
import { settingsKey } from '../game/settings.js';
import { storyLibrary } from '../game/story/library.js';
import { encounterSkipped, patrolSkipped } from '../game/story/skip-policy.js';
import type { VaultRequest } from '../game/vault-storage.js';
import { memory, serialLock } from './map-save-helpers.js';

const initial: Extract<VaultRequest, { kind: 'activate' }> = {
  kind: 'activate', slot: -1, id: 'new-game', session: 1, revision: 1, runId: '', expected: 'null', newId: 'new-v5-identity',
  data: { version: 2, flags: {}, completedLevelIds: [], checkpoint: { kind: 'level', levelId: 'prologue_01', sceneId: 'p001' }, savedAt: 10 },
};
const raw = encodeV4(newVault('old-v4-identity', initial.data));
const yes = () => true;

function harness() {
  const m = memory();
  m.values.set(saveKeyV4, raw); m.values.set(settingsKey, '原设置');
  const removed: string[] = [];
  let failWrite = false, failRemove = false;
  const port = { ...m.storage,
    setItem(key: string, value: string) { if (failWrite) throw new Error('写入故障'); m.storage.setItem(key, value); },
    removeItem(key: string) {
      if (failRemove) throw new Error('清理故障');
      expect(decodeV5(m.values.get(saveKeyV5) ?? null).kind).toBe('valid');
      removed.push(key); m.values.delete(key);
    },
  };
  const lock = serialLock(), store = createGameVaultStore(port, lock, storyLibrary);
  return { ...m, store, removed, port, lock, faults(write: boolean, remove: boolean) { failWrite = write; failRemove = remove; } };
}
describe('v5 保存与受控清理', () => {
  it('首启、未确认与失败写入均保留 v4，成功后仅清理指定键', async () => {
    const h = harness();
    expect(h.store.read()).toMatchObject({ kind: 'empty', format: 5, v4Raw: raw });
    expect((await h.store.write(initial, yes)).kind).toBe('conflict');
    h.faults(true, false);
    expect((await h.store.write({ ...initial, removeV4: raw }, yes)).kind).toBe('error');
    expect(h.values.get(saveKeyV4)).toBe(raw);
    expect(h.values.has(saveKeyV5)).toBe(false);
    h.faults(false, false);
    expect((await h.store.write({ ...initial, removeV4: raw }, yes)).kind).toBe('ok');
    expect(h.removed).toEqual([saveKeyV4]);
    expect(h.values.get(settingsKey)).toBe('原设置');
  });

  it('清理失败仍可用 v5，旧档若变化需按现状再确认', async () => {
    const h = harness(); h.faults(false, true);
    expect(await h.store.write({ ...initial, removeV4: raw }, yes)).toMatchObject({ kind: 'ok', message: expect.stringContaining('尚未清理') });
    h.faults(false, false); h.values.set(saveKeyV4, raw + ' ');
    const cleanup = { kind: 'cleanup-v4', id: 'cleanup', session: 1, revision: 2, runId: initial.newId, expectedRaw: raw } as const;
    expect((await h.store.write(cleanup, yes)).kind).toBe('conflict');
    expect((await h.store.write({ ...cleanup, expectedRaw: raw + ' ' }, yes)).kind).toBe('ok');
    expect(h.removed).toEqual([saveKeyV4]);
  });

  it('续篇整份自动档与修订原子校验，显式读取仍可回退', async () => {
    const h = harness();
    const snapshot = { ...initial.data, checkpoint: { kind: 'map' as const }, completedLevelIds: levelIds, postPrologue: startLoop(0),
      flags: { flag_prologue_completed: true, flag_act1_completed: true, has_master_sword: true, prologue_3_complete: true,
        link_summoned: true, prologue_4_complete: true, [encounterSkipped]: true, [patrolSkipped]: true } };
    const active = newVault(initial.newId, snapshot); h.values.set(saveKeyV5, encodeV5(active));
    const manual = { kind: 'manual', id: 'manual', session: 1, revision: 1, slot: 1, runId: initial.newId, expected: 'null', data: snapshot } as const;
    expect((await h.store.write(manual, yes)).kind).toBe('ok');
    const auto = { kind: 'auto', id: 'auto-a', session: 1, revision: 2, runId: initial.newId, expectedAutoRevision: active.revision,
      data: { ...snapshot, postPrologue: { ...snapshot.postPrologue, gold: 10 } } } as const;
    const other = createGameVaultStore(h.port, h.lock, storyLibrary);
    const results = await Promise.all([h.store.write(auto, yes), other.write({ ...auto, id: 'auto-b', data: snapshot }, yes)]);
    expect(results.map(result => result.kind)).toEqual(['ok', 'conflict']);
    const current = h.store.read();
    if (current.kind !== 'valid') throw new Error('缺少 v5');
    expect(current.data.auto).toMatchObject({ data: { postPrologue: { gold: 10 } } });
    const loaded = await h.store.write({ ...initial, runId: initial.newId, newId: 'other-run-id', slot: 1,
      data: snapshot, expected: fingerprint(current.data.manual[0]) }, yes);
    expect(loaded).toMatchObject({ kind: 'ok', data: { auto: { data: { postPrologue: { gold: 20 } } } } });
  });
});
