import { describe, expect, it } from 'vitest';
import vtuberBond1Raw from '../../source/story/vtuber/vtuber_bond1.md?raw';
import { levelIds } from '../content/levels.js';
import { advanceLoop, startLoop, visibleEvents } from '../game/loop/progress.js';
import { loopToken } from '../game/loop/route.js';
import type { LoopCheckpoint, LoopIntent } from '../game/loop/types.js';
import { navigationToken } from '../game/router.js';
import { decodeSave } from '../game/save-format.js';
import { decodeRunSnapshot } from '../game/save-run.js';
import { decodeV2, encodeV2 } from '../game/save-v2.js';
import { storyLibrary } from '../game/story/library.js';
import { encounterSkipped, patrolSkipped } from '../game/story/skip-policy.js';
import { exportedTextBlocks, originalTextBlocks, sceneOf, sourceScene } from './export-helpers.js';
import { loadAuto, menuHarness } from './menu-helpers.js';
import { skipSave } from './skip-helpers.js';

const tail = () => skipSave('c013', { [patrolSkipped]: true, [encounterSkipped]: true });
const city = () => advanceLoop(startLoop(0), { kind: 'ack' })!;
/** 带序幕后循环检查点的 v5 存档；flags 只叠加本幕需要的事件开关。 */
const stored = (postPrologue: LoopCheckpoint, flags: Record<string, boolean> = {}) => ({
  ...tail(), flags: { ...tail().flags, prologue_4_complete: true, ...flags },
  completedLevelIds: levelIds, checkpoint: { kind: 'map' as const }, postPrologue,
});

/** 逐句推进到 END 面板；无选项幕只允许文本等待。 */
async function finish(h: ReturnType<typeof menuHarness>) {
  for (let i = 0; i < 800; i++) {
    const waiting = h.state.waiting;
    if (!waiting) throw new Error('剧情意外停止');
    if (waiting.kind === 'end') return;
    if (waiting.kind !== 'text') throw new Error('意外的等待类型：' + waiting.kind);
    await h.action({ type: 'play', run: h.state.run, action: { type: 'advance', token: waiting.token } });
  }
  throw new Error('未能推进到 END');
}
const event = (id: 'vtuber_bond1'): LoopIntent => ({ kind: 'event', id });
const send = (h: ReturnType<typeof menuHarness>, intent: LoopIntent) =>
  h.action({ type: 'loop', token: loopToken(h.state), intent });
const back = (h: ReturnType<typeof menuHarness>) => h.action({ type: 'return-loop', token: navigationToken(h.state) });
async function openSchool(h: ReturnType<typeof menuHarness>) {
  await h.action({ type: 'select-location', token: navigationToken(h.state), locationId: 'high_school' });
}
/** 过夜动作只在奶奶家浮窗打开时可用。 */
async function openGrandma(h: ReturnType<typeof menuHarness>) {
  await h.action({ type: 'select-location', token: navigationToken(h.state), locationId: 'grandma_home' });
}

describe('虚拟主播·羁绊一', () => {
  it('正式剧本只导出 V101 与 V102，SET 写入布尔与整数 flag', () => {
    const act = storyLibrary.vtuber_bond1!;
    expect(act.scenes.map(scene => scene.id)).toEqual(['v101', 'v102']);
    expect(act.scenes[0]).toMatchObject({ title: '图书馆角落的偶遇与旧书', background: 'bg_school_library_day' });
    expect(act.scenes[1]).toMatchObject({ title: '深夜的直播间与闪回契机', background: 'bg_grandmother_bedroom_night' });
    const sets = act.scenes.flatMap(scene => scene.nodes.flatMap(node => node.kind === 'set' ? [[node.flag, node.value]] : []));
    expect(sets).toEqual([
      ['vtuber_bond1_library_done', true], ['item_sun_city_ancient_legend_book', true],
      ['vtuber_bond_level', 1], ['vtuber_bond1_complete', true], ['vtuber_identity_connected_by_mc', true],
    ]);
    const speakers = (index: number) =>
      act.scenes[index]!.nodes.flatMap(node => node.kind === 'dialogue' && node.speaker ? [node.speaker] : []);
    expect(speakers(1)).toContain('直播间里的虚拟主播');
    expect(speakers(0)).not.toContain('直播间里的虚拟主播');
    expect(act.scenes[1]!.nodes.some(node => node.kind === 'show' && node.actor === '直播间里的虚拟主播')).toBe(false);
    expect(act.scenes.flatMap(scene => scene.nodes).some(node => node.kind === 'choice' || node.kind === 'call')).toBe(false);
    for (const id of ['v101', 'v102'] as const) {
      expect(exportedTextBlocks(sceneOf(act, id))).toEqual(originalTextBlocks(sourceScene(vtuberBond1Raw, id)));
    }
    const allTexts = act.scenes.flatMap(scene => exportedTextBlocks(scene).map(block => block.text)).join('\n');
    expect(allTexts).not.toContain('制作说明');
    expect(allTexts).not.toContain('第五部分');
  });

  it('V101 在放学后与傍晚可见，读完即隐藏，夜间不再出现', () => {
    const loop = city(), open = { prologue_4_complete: true };
    const visible = (slot: 'after_school' | 'evening' | 'night', flags: Record<string, boolean>) =>
      visibleEvents({ ...loop, slot }, 'high_school', flags).some(item => item.id === 'vtuber_bond1');
    expect(visible('after_school', open)).toBe(true);
    expect(visible('evening', open)).toBe(true);
    expect(visible('night', open)).toBe(false);
    expect(visible('after_school', {})).toBe(false);
    expect(visible('after_school', { ...open, vtuber_bond1_library_done: true })).toBe(false);
  });

  it('V101 消耗一个时段，结束后写入旧书与完成标记，返回日程不丢循环', async () => {
    const h = menuHarness(stored(city()), 'v5'); await loadAuto(h);
    expect(h.state.screen).toBe('map');
    await openSchool(h);
    await send(h, event('vtuber_bond1'));
    expect(h.state).toMatchObject({ screen: 'story', actId: 'vtuber_bond1', sceneId: 'v101' });
    expect(h.state.postPrologue).toMatchObject({ slot: 'evening', phase: { kind: 'city' } });
    await finish(h);
    await back(h);
    expect(h.state.screen).toBe('map');
    expect(h.state.flags).toMatchObject({ vtuber_bond1_library_done: true, item_sun_city_ancient_legend_book: true });
    expect(h.state.postPrologue).toMatchObject({ day: 1, slot: 'evening', phase: { kind: 'city' } });
    expect(decodeRunSnapshot(h.state.progress!.checkpoint!, storyLibrary)?.flags.vtuber_bond1_library_done).toBe(true);
  });

  it('傍晚触发的 V101 推进到夜间，V102 不在同一天提前出现', async () => {
    const h = menuHarness(stored({ ...city(), slot: 'evening' }), 'v5'); await loadAuto(h);
    await openSchool(h);
    await send(h, event('vtuber_bond1'));
    expect(h.state.postPrologue).toMatchObject({ slot: 'night' });
    await finish(h); await back(h);
    expect(h.state.screen).toBe('map');
    expect(h.state.postPrologue).toMatchObject({ slot: 'night', phase: { kind: 'city' } });
    expect(h.state.flags.vtuber_bond1_complete).toBeUndefined();
  });

  it('过夜休息自动进入 V102，返回后落在当晚幕间并保留整数羁绊等级', async () => {
    const h = menuHarness(stored({ ...city(), slot: 'night' }, { vtuber_bond1_library_done: true }), 'v5');
    await loadAuto(h); await openGrandma(h);
    await send(h, { kind: 'sleep' });
    expect(h.state).toMatchObject({ screen: 'story', actId: 'vtuber_bond1', sceneId: 'v102' });
    expect(h.state.postPrologue?.phase).toEqual({ kind: 'interlude', moment: 'night' });
    await finish(h);
    await back(h);
    expect(h.state.screen).toBe('loop');
    expect(h.state.flags).toMatchObject({ vtuber_bond_level: 1, vtuber_bond1_complete: true, vtuber_identity_connected_by_mc: true });
    expect(h.state.postPrologue?.phase).toEqual({ kind: 'interlude', moment: 'night' });
    expect(decodeRunSnapshot(h.state.progress!.checkpoint!, storyLibrary)?.flags.vtuber_bond_level).toBe(1);
    await send(h, { kind: 'ack' });
    expect(h.state.postPrologue).toMatchObject({ day: 2, interludes: ['cycle_1_night'], phase: { kind: 'city' } });
  });

  it('跳过今日同样触发 V102；未读完 V101 则不触发', async () => {
    const ready = menuHarness(stored({ ...city(), slot: 'evening' }, { vtuber_bond1_library_done: true }), 'v5');
    await loadAuto(ready);
    await send(ready, { kind: 'skip_day' });
    expect(ready.state).toMatchObject({ screen: 'story', sceneId: 'v102' });
    expect(ready.state.postPrologue?.phase).toEqual({ kind: 'interlude', moment: 'night' });

    const idle = menuHarness(stored({ ...city(), slot: 'night' }), 'v5');
    await loadAuto(idle); await openGrandma(idle);
    await send(idle, { kind: 'sleep' });
    expect(idle.state.screen).toBe('loop');
    expect(idle.state.actId).not.toBe('vtuber_bond1');
    expect(idle.state.postPrologue?.phase).toEqual({ kind: 'interlude', moment: 'night' });
  });

  it('第 10 天过夜仍先演 V102，再进入危机部署', async () => {
    const h = menuHarness(stored({ ...city(), day: 10, slot: 'night' }, { vtuber_bond1_library_done: true }), 'v5');
    await loadAuto(h); await openGrandma(h);
    await send(h, { kind: 'sleep' });
    expect(h.state).toMatchObject({ screen: 'story', sceneId: 'v102' });
    expect(h.state.postPrologue?.phase).toEqual({ kind: 'crisis' });
    await finish(h); await back(h);
    expect(h.state.screen).toBe('loop');
    expect(h.state.postPrologue?.phase).toEqual({ kind: 'crisis' });
    await send(h, { kind: 'ack' });
    expect(h.state.postPrologue?.phase).toEqual({ kind: 'deploy', encounter: 'first' });
  });

  it('整数 flag 通过 v2／v5 读写，v1 仍只接受布尔', () => {
    const data = { ...tail(), flags: { ...tail().flags, prologue_4_complete: true, vtuber_bond_level: 1 } };
    const read = decodeV2(encodeV2(data), storyLibrary);
    expect(read.kind === 'valid' && read.data.flags.vtuber_bond_level).toBe(1);
    expect(decodeV2(encodeV2({ ...data, flags: { ...data.flags, vtuber_bond_level: -1 } }), storyLibrary).kind).toBe('invalid');
    const old = { actId: 'prologue', sceneId: 'p001', flags: { vtuber_bond_level: 1 }, savedAt: 1, unlockedActs: ['prologue', 'act1'] };
    expect(decodeSave(JSON.stringify(old), storyLibrary).kind).toBe('invalid');
  });

  it('V101 中途通过系统菜单返回地图不丢循环；第 2 周期第 1 天过夜先演 V102 再进清晨幕间', async () => {
    const h = menuHarness(stored(city()), 'v5'); await loadAuto(h);
    await openSchool(h);
    await send(h, event('vtuber_bond1'));
    expect(h.state).toMatchObject({ screen: 'story', sceneId: 'v101' });
    await h.action({ type: 'open-map', token: navigationToken(h.state) });
    expect(h.state.screen).toBe('map');
    expect(h.state.postPrologue).toMatchObject({ day: 1, slot: 'evening', phase: { kind: 'city' } });
    expect(h.state.flags.vtuber_bond1_library_done).toBeUndefined();

    const dawn = menuHarness(stored({ ...city(), cycle: 1, day: 1, slot: 'night' }, { vtuber_bond1_library_done: true }), 'v5');
    await loadAuto(dawn); await openGrandma(dawn);
    await send(dawn, { kind: 'sync' });
    expect(dawn.state).toMatchObject({ screen: 'story', sceneId: 'v102' });
    expect(dawn.state.postPrologue).toMatchObject({ cycle: 1, day: 2, sync: 1, phase: { kind: 'interlude', moment: 'dawn' } });
    await finish(dawn); await back(dawn);
    expect(dawn.state.screen).toBe('loop');
    await send(dawn, { kind: 'ack' });
    expect(dawn.state.postPrologue).toMatchObject({ cycle: 1, day: 2, interludes: ['cycle_2_dawn'], phase: { kind: 'city' } });
  });
});
