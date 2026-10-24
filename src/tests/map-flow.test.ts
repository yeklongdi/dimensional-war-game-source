import { describe, expect, it } from 'vitest';
import baseline from '../../docs/verification/m4/full-route-browser.json';
import { currentLevel, levels, levelIds, progressEdges, visibleLevels } from '../content/levels.js';
import { mapLocations } from '../content/map-locations.js';
import { startApp, reduceApp, navigationToken } from '../game/router.js';
import { storyLibrary } from '../game/story/library.js';
import { clampCamera, fitScale, focusCamera, mapSize, mapViewport, zoomCamera } from '../game/map-camera.js';
import { appAction, appStep, freshApp, enterLevel, navigate, sampleV2 } from './m4-helpers.js';

describe('九关配置、显现与反向回访', () => {
  it('九关唯一覆盖48主场景，四条未完成分支不在主线场景配置', () => {
    expect(levels.map(level => level.sceneIds.length)).toEqual([4, 3, 2, 3, 5, 6, 4, 8, 13]);
    const scenes = levels.flatMap(level => level.sceneIds);
    expect(scenes.filter(id => baseline.scenes.includes(id))).toEqual(baseline.scenes);
    expect(new Set(scenes).size).toBe(48);
    expect(mapLocations).toHaveLength(5);
    for (const [index, level] of levels.entries()) expect(level.prerequisiteLevelId).toBe(index ? levels[index - 1]!.id : undefined);
  });
  it('新档仅奶奶家；按前缀显现，回访复用五节点及四条线', () => {
    expect(visibleLevels([]).map(level => level.id)).toEqual(['prologue_01']);
    const counts = levelIds.map((_, index) => new Set(visibleLevels(levelIds.slice(0, index)).map(level => level.locationId)).size);
    expect(counts).toEqual([1, 2, 2, 3, 4, 5, 5, 5, 5]);
    const edges = progressEdges(levelIds);
    expect(edges).toHaveLength(5);
    expect(edges.find(edge => [edge.from, edge.to].includes('old_warehouse'))).toMatchObject({ from: 'old_warehouse', to: 'grandma_home' });
    expect(edges.find(edge => [edge.from, edge.to].includes('construction_site'))).toMatchObject({ from: 'construction_site', to: 'high_school', latest: false });
    expect(edges.find(edge => edge.latest)).toMatchObject({ from: 'grandma_home', to: 'school_road' });
  });
  it('正式地理坐标保持西家东路口、学校东北、仓库南、施工在学校东北', () => {
    const [home, warehouse, road, school, construction] = mapLocations.map(location => location.position);
    expect(home!.x).toBeLessThan(road!.x); expect(warehouse!.y).toBeGreaterThan(road!.y);
    expect(school!.x).toBeGreaterThan(road!.x); expect(school!.y).toBeLessThan(road!.y);
    expect(construction!.x).toBeGreaterThan(school!.x); expect(construction!.y).toBeLessThan(school!.y);
    expect(mapLocations.every(location => Object.values(location.position).every(value => value >= 0 && value <= 1))).toBe(true);
  });
});
describe('真实规则整条主线与关卡边界', () => {
  it('八次返回地图后在C003真实阻断，新增正文与战后SET完整', () => {
    let state = freshApp(); const seen = new Set<string>(), scenes: string[] = [], texts: { scene: string; node: string; text: string }[] = [], completed: string[] = [];
    for (let step = 0; step < 2400; step++) {
      const wait = state.waiting;
      if (state.screen === 'story' && scenes[scenes.length - 1] !== state.sceneId) scenes.push(state.sceneId);
      if (state.screen === 'story' && wait?.kind === 'text' && !seen.has(wait.token)) {
        seen.add(wait.token);
        texts.push({ scene: state.sceneId, node: String(wait.origin.nodeIndex), text: wait.text });
      }
      if (wait?.kind === 'blocked-call') break;
      if (state.screen === 'map') {
        completed.push(state.progress!.completedLevelIds.at(-1)!);
        for (const id of state.progress!.completedLevelIds) expect(enterLevel(state, id)).toBe(state);
        if (!currentLevel(state.progress!.completedLevelIds)) break;
      }
      const next = appStep(state);
      if (wait?.kind === 'text' && wait.revealed < Array.from(wait.text).length) expect(next.progress!.completedLevelIds).toEqual(state.progress!.completedLevelIds);
      state = next;
    }
    expect(completed).toEqual(levelIds.slice(0, 8));
    const mainScenes = [...new Set(scenes)].filter(id => !id.includes('_return_'));
    expect(mainScenes).toEqual(levels.flatMap(level => level.sceneIds).slice(0, 38));
    expect(texts.some(text => text.scene === 'a015_retrieve')).toBe(true);
    expect(texts.some(text => text.scene === 'b008')).toBe(true);
    expect(texts.map(item => item.text).join('')).not.toMatch(/【待确认】|【不可执行】|【分支占位】|CHECK:/);
    for (const item of texts) {
      const node = Object.values(storyLibrary).flatMap(act => act.scenes).find(scene => scene.id === item.scene)!.nodes[Number(item.node)];
      expect(node && 'text' in node && node.text.includes(item.text), item.scene).toBe(true);
    }
    expect(state.waiting).toMatchObject({ kind: 'blocked-call', callId: 'battle_prologue4_patrol' });
    const a014 = storyLibrary.act1!.scenes.find(scene => scene.id === 'a014')!, call = a014.nodes.findIndex(node => node.kind === 'call');
    expect(texts.filter(text => text.scene === 'a014' && Number(text.node) > call)).toHaveLength(4);
    const sets = a014.nodes.filter(node => node.kind === 'set'); expect(sets).toHaveLength(2);
    for (const node of sets) if (node.kind === 'set') expect(state.flags[node.flag]).toBe(true);
    expect(state.flags.flag_battle_prologue_tutorial_won).toBe(true); expect(state.flags.flag_battle_black_humanoid_won).toBe(true);
  });
  it('最后一句先补全，再执行随后SET并停在下一关首节点之前', () => {
    const library = structuredClone(storyLibrary);
    library.prologue!.scenes.find(scene => scene.id === 'p004')!.nodes = [
      { kind: 'stage', text: '边界前正文' }, { kind: 'set', flag: 'flag_prologue_p005_01', note: '单测：边界前自动记录', meta: true }, { kind: 'jump', target: 'p005' },
    ];
    library.prologue!.scenes.find(scene => scene.id === 'p005')!.nodes = [
      { kind: 'set', flag: 'flag_prologue_p006_01', note: '不应提前执行' }, { kind: 'sfx', name: '不应播放' }, { kind: 'stage', text: '不应提前显示' },
    ];
    const menu = startApp(0, { kind: 'valid', data: sampleV2('prologue', 'p004') }).state;
    const begun = reduceApp(menu, { type: 'resume', token: navigationToken(menu) }, library, 100).state;
    const reveal = reduceApp(begun, { type: 'play', run: begun.run, action: { type: 'advance', token: begun.waiting!.token } }, library, 101);
    expect(reveal.state.screen).toBe('story'); expect(reveal.state.progress!.completedLevelIds).toHaveLength(0);
    const finish = reduceApp(reveal.state, { type: 'play', run: reveal.state.run, action: { type: 'advance', token: reveal.state.waiting!.token } }, library, 102);
    expect(finish.state).toMatchObject({ screen: 'map', sceneId: 'p004', flags: { flag_prologue_p005_01: true } });
    expect(finish.state.flags.flag_prologue_p006_01).toBeUndefined(); expect(finish.effects.some(effect => effect.kind === 'sfx')).toBe(false);
    expect(finish.state.progress!.completedLevelIds).toEqual(['prologue_01']);
    expect(appAction(finish.state, { type: 'play', run: begun.run, action: { type: 'advance', token: begun.waiting!.token } })).toBe(finish.state);
  });
  it('未配置跨关跳转拒绝并诊断，不能算通关', () => {
    const library = structuredClone(storyLibrary);
    library.prologue!.scenes.find(scene => scene.id === 'p004')!.nodes = [{ kind: 'jump', target: 'p008' }];
    const menu = startApp(0, { kind: 'valid', data: sampleV2('prologue', 'p004') }).state;
    const result = reduceApp(menu, { type: 'resume', token: navigationToken(menu) }, library, 100);
    expect(result.state.waiting).toMatchObject({ kind: 'error', message: expect.stringContaining('拒绝未配置') });
    expect(result.state.progress!.completedLevelIds).toEqual([]);
  });
  it('旧检查点归一化地图，刷新/重新打开地图不补播解锁动画', () => {
    const data = sampleV2('act1', 'a010'), menu = startApp(0, { kind: 'valid', data }).state;
    const map = navigate(menu, 'open-map'); expect(map.map!.unlock).toBe(false);
    expect(navigate(navigate(map, 'main-menu'), 'open-map').map!.unlock).toBe(false);
    const completeData = { ...data, completedLevelIds: [...levelIds], flags: { ...data.flags, flag_act1_completed: true }, checkpoint: { kind: 'map' as const } };
    const completed = navigate(startApp(0, { kind: 'valid', data: completeData }).state, 'resume');
    expect(completed.screen).toBe('map'); expect(completed.map!.unlock).toBe(false); expect(enterLevel(completed, 'act1_04')).toBe(completed);
  });
});
describe('相机纯函数与地图操作纪律', () => {
  it('指针中心缩放保持其下地图点，缩放和拖动遵守边界', () => {
    const camera = focusCamera({ x: .5, y: .5 }, 1.6), anchor = { x: 400, y: 250 }, zoomed = zoomCamera(camera, 1.2, anchor);
    expect((anchor.x - camera.x) / (fitScale * camera.zoom)).toBeCloseTo((anchor.x - zoomed.x) / (fitScale * zoomed.zoom));
    expect((anchor.y - camera.y) / (fitScale * camera.zoom)).toBeCloseTo((anchor.y - zoomed.y) / (fitScale * zoomed.zoom));
    expect(zoomCamera(camera, 100, anchor).zoom).toBe(3); expect(zoomCamera(camera, .001, anchor).zoom).toBe(1);
    const clamped = clampCamera({ x: -99999, y: 99999, zoom: 3 });
    expect(clamped.x).toBe(mapViewport.width - mapSize.width * fitScale * 3); expect(clamped.y).toBe(0);
  });
  it('拖缩、面板和定位不保存，未来节点拒绝，旧相机回调无效', () => {
    const map = navigate(startApp(0, { kind: 'empty' }).state, 'open-map'), token = navigationToken(map);
    for (const action of [{ type: 'zoom-map', token, factor: 1.2 }, { type: 'pan-map', token, dx: -30, dy: 5 }, { type: 'focus-map', token }] as const) {
      expect(reduceApp(map, action, storyLibrary, 123).saves).toBeUndefined();
    }
    expect(appAction(map, { type: 'select-location', token, locationId: 'construction_site' })).toBe(map);
    const menu = navigate(map, 'main-menu'); expect(appAction(menu, { type: 'pan-map', token, dx: 100, dy: 100 })).toBe(menu);
  });
  it('键盘聚焦可定位已显现节点但不激活面板，也不保存', () => {
    const map = navigate(startApp(0, { kind: 'valid', data: sampleV2('act1') }).state, 'open-map');
    const result = reduceApp(map, { type: 'focus-location', token: navigationToken(map), locationId: 'grandma_home' }, storyLibrary, 123);
    expect(result.state.map!.selected).toBe(map.map!.selected); expect(result.state.map!.camera).not.toEqual(map.map!.camera); expect(result.saves).toBeUndefined();
    expect(result.state.screen).toBe('map');
  });
});
