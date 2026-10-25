import { describe, expect, it } from 'vitest';
import { currentLevel, levelById, levelIds, levelMapTitle, levels, progressEdges, visibleLevels } from '../content/levels.js';
import type { LevelId } from '../content/levels.js';
import { locationById } from '../content/map-locations.js';
import { focusCamera } from '../game/map-camera.js';
import { navigationToken, reduceApp } from '../game/router.js';
import { completionFlags } from '../game/save-format.js';
import type { SaveV2 } from '../game/save-v2.js';
import { storyLibrary } from '../game/story/library.js';
import { atLastText, atScene, loadAuto, storyHarness, walk } from './new-game-prologue-helpers.js';

const prologuePrefix = ['prologue_01', 'prologue_02', 'prologue_03'] as const;
const completedPrologue = (): SaveV2 => ({
  version: 2, flags: { [completionFlags.prologue]: true }, completedLevelIds: [...prologuePrefix],
  checkpoint: { kind: 'map' }, savedAt: 1792800000000,
});
const controlled = (levelId: LevelId, sceneId: string, completed: number, flags: Record<string, boolean>): SaveV2 => ({
  version: 2, flags, completedLevelIds: levelIds.slice(0, completed),
  checkpoint: { kind: 'level', levelId, sceneId }, savedAt: 1792800000000,
});

// 专项范围：new-game-prologue-flow-spec.md §4–§6、T05–T09。A003以后只抽查到act1_02/A004。
describe('T05 P009结尾返回地图', () => {
  it('P009原结尾完成后才回地图，前三关完成、A001尚未执行，奶奶家为当前目标并展开浮窗', async () => {
    const h = storyHarness();
    await h.system('new');
    await walk(h, atLastText('p009', 12));
    expect(h.state.screen).toBe('story');
    expect(h.state.progress!.completedLevelIds).toEqual(['prologue_01', 'prologue_02']);
    expect(h.state.map).toBeUndefined();
    await h.play({ type: 'advance', token: h.state.waiting!.token });
    await h.play({ type: 'advance', token: h.state.waiting!.token });
    expect(h.state.screen).toBe('map');
    expect(h.state.activeLevelId).toBeUndefined();
    expect(h.state.progress!.completedLevelIds).toEqual([...prologuePrefix]);
    expect(h.state.flags[completionFlags.prologue]).toBe(true);
    expect(h.state.flags.flag_prologue_p009_01).toBe(true);
    expect(h.auto().checkpoint).toEqual({ kind: 'map' });
    expect(h.state.map).toMatchObject({ selected: 'grandma_home', popupOpen: true, unlock: true });
    expect(h.state.map!.camera).toEqual(focusCamera(locationById('grandma_home').position));
    expect(currentLevel(h.state.progress!.completedLevelIds)!.id).toBe('act1_01');
    expect(h.state.sceneId).toBe('p009');
    expect(Object.keys(h.state.flags).filter(key => key.startsWith('flag_act1'))).toEqual([]);
  });
});

describe('T06 奶奶家序幕（二）入口', () => {
  it('关标与卡片依据配置显示序幕（二），点击首次进入act1_01/a001，已完成入口与旧路口不重复开放', async () => {
    const level = levelById('act1_01')!;
    expect(level.locationId).toBe('grandma_home');
    expect(level.name).toBe('上学途中与校门');
    expect(levelMapTitle(level)).toBe('序幕（二）');
    expect(levels.filter(item => item.locationId === 'school_road').map(item => item.id)).toEqual(['prologue4_01']);
    expect(visibleLevels([...prologuePrefix]).map(item => item.locationId)).not.toContain('school_road');
    expect(progressEdges([...prologuePrefix]).filter(edge => edge.from === edge.to)).toEqual([]);
    const h = storyHarness();
    await h.system('new');
    await walk(h, state => state.screen === 'map');
    for (const id of prologuePrefix) {
      const before = h.state;
      await h.action({ type: 'enter-level', token: navigationToken(h.state), levelId: id });
      expect(h.state).toBe(before);
    }
    await h.action({ type: 'enter-level', token: navigationToken(h.state), levelId: 'act1_01' });
    expect(h.state.screen).toBe('story');
    expect(h.state.activeLevelId).toBe('act1_01');
    expect(h.state.sceneId).toBe('a001');
    expect(h.state.progress!.completedLevelIds).toEqual([...prologuePrefix]);
    expect(h.auto().checkpoint).toEqual({ kind: 'level', levelId: 'act1_01', sceneId: 'a001' });
    expect(h.state.waiting).toMatchObject({ kind: 'text' });
  });
});

describe('T07 A003后仍回地图到学校act1_02/A004', () => {
  it('受控act1_01/a001档完成A003后返回地图，下一关为学校act1_02并从A004开始', async () => {
    const data = controlled('act1_01', 'a001', 3, { [completionFlags.prologue]: true });
    const h = storyHarness(data);
    await loadAuto(h);
    expect(h.state.sceneId).toBe('a001');
    await walk(h, state => state.screen === 'map');
    expect(h.state.progress!.completedLevelIds).toEqual([...prologuePrefix, 'act1_01']);
    expect(h.state.map).toMatchObject({ selected: 'high_school', popupOpen: false });
    expect(currentLevel(h.state.progress!.completedLevelIds)!.id).toBe('act1_02');
    expect(h.state.sceneId).toBe('a003');
    await h.action({ type: 'enter-level', token: navigationToken(h.state), levelId: 'act1_02' });
    expect(h.state.screen).toBe('story');
    expect(h.state.sceneId).toBe('a004');
    expect(h.state.activeLevelId).toBe('act1_02');
  });
});

describe('T08 与本次流程直接有关的恢复', () => {
  it('第一关P004中途档从场景头继续并衔接P005，不回P001也不补完成', async () => {
    const h = storyHarness(controlled('prologue_01', 'p004', 0, {}));
    await loadAuto(h);
    expect(h.state.sceneId).toBe('p004');
    expect(h.state.progress!.completedLevelIds).toEqual([]);
    expect(h.state.waiting).toMatchObject({ kind: 'text', revealed: 0 });
    await walk(h, atLastText('p004', 13));
    await h.play({ type: 'advance', token: h.state.waiting!.token });
    await h.play({ type: 'advance', token: h.state.waiting!.token });
    expect(h.state.sceneId).toBe('p005');
    expect(h.state.progress!.completedLevelIds).toEqual(['prologue_01']);
  });
  it('第三关P008中途档继续到P009结尾后回图，完成前缀不被提前补齐', async () => {
    const h = storyHarness(controlled('prologue_03', 'p008', 2, {}));
    await loadAuto(h);
    expect(h.state.sceneId).toBe('p008');
    expect(h.state.progress!.completedLevelIds).toEqual(['prologue_01', 'prologue_02']);
    expect(h.state.flags[completionFlags.prologue]).toBeUndefined();
    await walk(h, state => state.screen === 'map');
    expect(h.state.progress!.completedLevelIds).toEqual([...prologuePrefix]);
    expect(h.state.flags[completionFlags.prologue]).toBe(true);
    expect(h.state.map!.selected).toBe('grandma_home');
  });
  it('主动返回地图后继续从当前内部关场景头进入，不强制回P001', async () => {
    const h = storyHarness(controlled('prologue_02', 'p005', 1, {}));
    await loadAuto(h);
    expect(h.state.sceneId).toBe('p005');
    await h.system('open'); await h.system('go-map');
    expect(h.state.screen).toBe('map');
    expect(h.state.map).toMatchObject({ selected: 'old_warehouse', popupOpen: false });
    expect(h.state.progress!.completedLevelIds).toEqual(['prologue_01']);
    await h.action({ type: 'enter-level', token: navigationToken(h.state), levelId: 'prologue_02' });
    expect(h.state.screen).toBe('story');
    expect(h.state.sceneId).toBe('p005');
    expect(h.state.waiting).toMatchObject({ kind: 'text', revealed: 0 });
    expect(h.state.progress!.completedLevelIds).toEqual(['prologue_01']);
  });
  it('旧v4地图档按原进度恢复，不补记序幕一，也不自动展开或进入A001', async () => {
    const h = storyHarness(completedPrologue());
    await loadAuto(h);
    expect(h.state.screen).toBe('map');
    expect(h.state.progress!.completedLevelIds).toEqual([...prologuePrefix]);
    expect(h.state.map).toMatchObject({ selected: 'grandma_home', popupOpen: false });
    await h.action({ type: 'enter-level', token: navigationToken(h.state), levelId: 'act1_01' });
    expect(h.state.sceneId).toBe('a001');
  });
  it('教学战前的存档不被自动跳过CALL，仍按规定进入战斗', async () => {
    const h = storyHarness(controlled('prologue_02', 'p006', 1, {}));
    await loadAuto(h);
    expect(h.state.sceneId).toBe('p006');
    await walk(h, state => state.screen === 'battle');
    expect(h.state.battle!.id).toBe('battle_prologue_tutorial');
    expect(h.state.battle!.result).toBeUndefined();
    expect(h.state.flags.flag_battle_prologue_tutorial_won).toBeUndefined();
    expect(h.state.flags.flag_battle_prologue_tutorial_skipped).toBeUndefined();
    expect(h.state.flags.flag_prologue_p006_01).toBeUndefined();
  });
});

describe('T09 定位、关标与旧结算', () => {
  it('同地点接续不生成自连线，历史线仍为历史且只有一条最新目标线', () => {
    const edges = progressEdges(levelIds);
    expect(edges).toHaveLength(4);
    expect(edges.every(edge => edge.from !== edge.to)).toBe(true);
    expect(progressEdges([...prologuePrefix])).toEqual([{ from: 'old_warehouse', to: 'grandma_home', latest: false }]);
    expect(progressEdges([...prologuePrefix]).find(edge => edge.latest)).toBeUndefined();
    expect(progressEdges(['prologue_01', 'prologue_02']).find(edge => edge.latest)).toMatchObject({ from: 'old_warehouse', to: 'grandma_home' });
    expect(edges.find(edge => edge.latest)).toMatchObject({ from: 'grandma_home', to: 'school_road' });
  });
  it('当前目标与关标来自关卡配置，过期活动上下文与旧输入不重复结算', async () => {
    const target = currentLevel([...prologuePrefix])!;
    expect(target.id).toBe('act1_01');
    expect(target.locationId).toBe('grandma_home');
    expect(levelMapTitle(target)).toBe('序幕（二）');
    const h = storyHarness();
    await h.system('new');
    await walk(h, atScene('p005'));
    const wait = h.state.waiting;
    if (wait?.kind !== 'text') throw new Error('应停在P005正文');
    const staleContext = { ...h.state, activeLevelId: 'prologue_01' as const };
    expect(reduceApp(staleContext, { type: 'play', run: staleContext.run, action: { type: 'advance', token: wait.token } }, storyLibrary, 1).state).toBe(staleContext);
    await h.play({ type: 'advance', token: wait.token });
    expect(h.state.progress!.completedLevelIds).toEqual(['prologue_01']);
    expect(h.state.sceneId).toBe('p005');
  });
});
