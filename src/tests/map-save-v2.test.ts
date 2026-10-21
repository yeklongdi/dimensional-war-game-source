import { describe, expect, it } from 'vitest';
import { levels, levelIds } from '../content/levels.js';
import { completionFlags, encodeSave, saveKey } from '../game/save-format.js';
import { decodeV2, encodeV2, migrateV1, readSaves, saveKeyV2 } from '../game/save-v2.js';
import { createSaveStore } from '../game/save-storage.js';
import { startApp, reduceApp } from '../game/router.js';
import { storyLibrary } from '../game/story/library.js';
import { sampleSave, sampleV2, navigate } from './m4-helpers.js';
import { memory, serialLock } from './map-save-helpers.js';

describe('v2格式与检查点归一化', () => {
  it('仅五字段，无演出、RNG、游标或相机；布尔false保留', () => {
    const data = sampleV2('act1'); data.flags.flag_act1_a010_03 = false;
    expect(Object.keys(JSON.parse(encodeV2(data)))).toEqual(['version', 'flags', 'completedLevelIds', 'checkpoint', 'savedAt']);
    expect(decodeV2(encodeV2(data), storyLibrary)).toEqual({ kind: 'valid', data });
    expect(encodeV2(data)).not.toMatch(/unlockedActs|nodeIndex|camera|rng|token|actors|branch/);
  });
  it.each([
    { version: 1 }, { version: '2' }, { extra: true }, { completedLevelIds: ['prologue_02'] },
    { completedLevelIds: ['prologue_01', 'prologue_01'] }, { completedLevelIds: ['act2'] },
    { checkpoint: { kind: 'level', levelId: 'act1_01', sceneId: 'a001' } },
    { checkpoint: { kind: 'level', levelId: 'prologue_01', sceneId: 'p005' } },
    { checkpoint: { kind: 'level', levelId: 'act1_02', sceneId: 'a007_todo_thief' } },
    { checkpoint: { kind: 'map', camera: 1 } }, { flags: { flag_hacked: true } },
    { savedAt: -1 }, { savedAt: .5 }, { savedAt: '100' }, { savedAt: 8_640_000_000_000_001 },
    { flags: { flag_prologue_completed: true } },
  ])('拒绝非法v2 %j并保留原串', patch => {
    const raw = JSON.stringify({ ...sampleV2(), ...patch });
    expect(decodeV2(raw, storyLibrary)).toMatchObject({ kind: 'invalid', key: 'v2', raw });
  });
  it('已完成关的结构合法检查点归一化地图，未来关则拒绝', () => {
    const data = sampleV2('act1'); data.checkpoint = { kind: 'level', levelId: 'prologue_01', sceneId: 'p003' };
    expect(decodeV2(encodeV2(data), storyLibrary)).toMatchObject({ kind: 'valid', data: { checkpoint: { kind: 'map' } } });
    data.checkpoint = { kind: 'level', levelId: 'act1_04', sceneId: 'a016' };
    expect(decodeV2(encodeV2(data), storyLibrary).kind).toBe('invalid');
  });
  it('完成前三关/七关必须与两个幕flag一致', () => {
    const data = sampleV2('act1'); delete data.flags[completionFlags.prologue];
    expect(decodeV2(encodeV2(data), storyLibrary).kind).toBe('invalid');
    const all = sampleV2('act1'); all.completedLevelIds = [...levelIds]; all.checkpoint = { kind: 'map' };
    expect(decodeV2(encodeV2(all), storyLibrary).kind).toBe('invalid');
    all.flags[completionFlags.act1] = true;
    expect(decodeV2(encodeV2(all), storyLibrary).kind).toBe('valid');
  });
});
describe('v1只读迁移', () => {
  it.each(levels.flatMap((level, index) => level.sceneIds.map(sceneId => ({ level, index, sceneId }))))('$sceneId 按所在关迁移，当前关不视为完成', ({ level, index, sceneId }) => {
    const old = sampleSave(level.actId, sceneId); old.flags.flag_battle_black_humanoid_won = true;
    const original = structuredClone(old), data = migrateV1(old);
    expect(data.completedLevelIds).toEqual(levelIds.slice(0, index));
    expect(data.checkpoint).toEqual({ kind: 'level', levelId: level.id, sceneId });
    expect(data.savedAt).toBe(old.savedAt); expect(data.flags.flag_battle_black_humanoid_won).toBe(true);
    expect(decodeV2(encodeV2(data), storyLibrary).kind).toBe('valid'); expect(old).toEqual(original);
  });
  it.each(['p003', 'p009'])('序幕完成但旧档在%s，取消重玩，地图定位第四关', scene => {
    const old = sampleSave('prologue', scene); old.flags[completionFlags.prologue] = true; old.unlockedActs = ['prologue', 'act1'];
    expect(migrateV1(old)).toMatchObject({ completedLevelIds: levelIds.slice(0, 3), checkpoint: { kind: 'map' } });
  });
  it.each(['p001', 'a007', 'a016'])('全部完成的%s旧档仅展示完成地图', scene => {
    const old = sampleSave(scene.startsWith('p') ? 'prologue' : 'act1', scene);
    old.flags[completionFlags.prologue] = true; old.flags[completionFlags.act1] = true; old.unlockedActs = ['prologue', 'act1'];
    expect(migrateV1(old)).toMatchObject({ completedLevelIds: levelIds, checkpoint: { kind: 'map' } });
  });
  it('有效v2优先且不读取v1；损坏v2也不能回退导入', () => {
    const data = sampleV2(), legacy = () => { throw new Error('不应读v1'); };
    expect(readSaves(encodeV2(data), legacy, storyLibrary)).toEqual({ kind: 'valid', data });
    expect(readSaves('坏v2', legacy, storyLibrary)).toMatchObject({ kind: 'invalid', key: 'v2' });
  });
  it('非法v1不猜测迁移，并保留来源与完整原串', () => {
    expect(readSaves(null, () => ' 坏v1\n ', storyLibrary)).toMatchObject({ kind: 'invalid', key: 'v1', raw: ' 坏v1\n ' });
  });
  it('迁移只在锁内写v2成功后报告成功，v1原串逐字不变', async () => {
    const raw = ` \n${encodeSave(sampleSave('act1', 'a014'))}\n `, m = memory(null, raw), store = createSaveStore(m.storage, serialLock(), storyLibrary);
    const read = store.read(); expect(read.kind).toBe('migration'); expect(m.writes).toHaveLength(0);
    const outcome = await store.write({ kind: 'migrate', run: 1, revision: 1 }, () => true);
    expect(outcome).toMatchObject({ kind: 'saved', migrated: true, data: { checkpoint: { sceneId: 'a014' } } });
    expect(m.writes).toEqual([saveKeyV2]); expect(m.values.get(saveKey)).toBe(raw); expect(store.read().kind).toBe('valid');
  });
  it('迁移竞争时采用另一窗口已建v2，不写旧快照', async () => {
    const raw = encodeSave(sampleSave()), m = memory(null, raw), store = createSaveStore(m.storage, serialLock(), storyLibrary);
    expect(store.read().kind).toBe('migration');
    const pending = store.write({ kind: 'migrate', run: 1, revision: 1 }, () => true), advanced = sampleV2('act1', 'a016');
    m.values.set(saveKeyV2, encodeV2(advanced));
    expect(await pending).toMatchObject({ kind: 'saved', data: advanced }); expect(m.writes).toHaveLength(0); expect(m.values.get(saveKey)).toBe(raw);
  });
  it('等待锁期间v1变化则重新校验最新v1，不能导入旧场景', async () => {
    const m = memory(null, encodeSave(sampleSave())), store = createSaveStore(m.storage, serialLock(), storyLibrary);
    expect(store.read()).toMatchObject({ kind: 'migration', data: { checkpoint: { sceneId: 'p003' } } });
    const pending = store.write({ kind: 'migrate', run: 1, revision: 1 }, () => true);
    const latest = encodeSave(sampleSave('act1', 'a014')); m.values.set(saveKey, latest);
    expect(await pending).toMatchObject({ kind: 'saved', data: { checkpoint: { sceneId: 'a014' } } }); expect(m.values.get(saveKey)).toBe(latest);
  });
  it('竞争中新v2损坏则保护；迁移过期不写入', async () => {
    const m = memory(null, encodeSave(sampleSave())), store = createSaveStore(m.storage, serialLock(), storyLibrary);
    const pending = store.write({ kind: 'migrate', run: 1, revision: 1 }, () => true); m.values.set(saveKeyV2, '另一份坏档');
    expect(await pending).toMatchObject({ kind: 'read', read: { kind: 'invalid', key: 'v2' } });
    expect(await store.write({ kind: 'migrate', run: 1, revision: 1 }, () => false)).toEqual({ kind: 'stale' }); expect(m.writes).toHaveLength(0);
  });
  it('迁移写失败不宣告成功，保留会话候选但无有效继续档', async () => {
    const m = memory(null, encodeSave(sampleSave('act1'))), store = createSaveStore({ ...m.storage, setItem() { throw new Error('写失败'); } }, serialLock(), storyLibrary);
    const initial = startApp(0, store.read()), request = initial.saves![0]!;
    expect(initial.state.progress!.status).toBe('migrating'); expect(initial.state.progress!.checkpoint).toBeUndefined();
    const outcome = await store.write(request, () => true);
    const failed = reduceApp(initial.state, { type: 'save-result', run: request.run, revision: request.revision, outcome }, storyLibrary, 100).state;
    expect(failed.progress).toMatchObject({ status: 'error', completedLevelIds: levelIds.slice(0, 5) });
    expect(failed.progress!.checkpoint).toBeUndefined(); expect(navigate(failed, 'resume')).toBe(failed);
    const reread = reduceApp(failed, { type: 'external-save', read: store.read() }, storyLibrary, 101);
    expect(reread.saves).toBeUndefined(); expect(reread.state.progress!.status).toBe('error');
    expect(navigate(reread.state, 'open-map').screen).toBe('map');
    expect(navigate(failed, 'open-map').map!.selected).toBe('construction_site'); expect(m.writes).toHaveLength(0);
  });
});
