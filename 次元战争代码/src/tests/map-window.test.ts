import { describe, expect, it } from 'vitest';
import { coverScale, focusCamera, mapSize, pointInViewport, projectLocation, resizeCamera, zoomCamera } from '../game/map-camera.js';
import { navigationToken, reduceApp, startApp } from '../game/router.js';
import type { NavigationAction } from '../game/router.js';
import { storyLibrary } from '../game/story/library.js';
import { locationById } from '../content/map-locations.js';
import { levelIds } from '../content/levels.js';
import { appAction, navigate, sampleV2 } from './m4-helpers.js';

const openMap = () => navigate(startApp(0, { kind: 'empty' }).state, 'open-map');
const select = (state: ReturnType<typeof openMap>, locationId = state.map!.selected) => appAction(state, { type: 'select-location', locationId, token: navigationToken(state) });

describe('全窗口地图与地点浮窗状态', () => {
  it('首次进入关闭浮窗，点击已选地点也能打开，关闭后可再次打开', () => {
    const map = openMap(); expect(map.map!.popupOpen).toBe(false);
    const opened = select(map); expect(opened.map!.popupOpen).toBe(true);
    expect(select(opened)).toBe(opened);
    const closed = navigate(opened, 'close-location'); expect(closed.map!.popupOpen).toBe(false);
    expect(select(closed).map!.popupOpen).toBe(true);
  });
  it('回地图和定位当前关都只定位高亮，不自动打开浮窗', () => {
    const map = select(openMap()); expect(navigate(map, 'focus-map').map!.popupOpen).toBe(false);
    const menu = navigate(map, 'main-menu'); expect(navigate(menu, 'open-map').map!.popupOpen).toBe(false);
  });
  it('键盘聚焦其他已显现地点只调相机，不切换选择或打开浮窗', () => {
    const map = navigate(startApp(0, { kind: 'valid', data: sampleV2('act1') }).state, 'open-map');
    const focused = appAction(map, { type: 'focus-location', token: navigationToken(map), locationId: 'grandma_home' });
    expect(focused.map!.selected).toBe(map.map!.selected); expect(focused.map!.popupOpen).toBe(false);
    expect(select(focused, 'grandma_home').map).toMatchObject({ selected: 'grandma_home', popupOpen: true });
  });
  it('可查看完成地点但不能重开完成关，未来地点仍拒绝', () => {
    const map = navigate(startApp(0, { kind: 'valid', data: sampleV2('act1') }).state, 'open-map');
    const focused = appAction(map, { type: 'focus-location', token: navigationToken(map), locationId: 'grandma_home' });
    const opened = select(focused, 'grandma_home');
    expect(appAction(opened, { type: 'enter-level', token: navigationToken(opened), levelId: 'prologue_01' })).toBe(opened);
    expect(select(openMap(), 'construction_site')).toEqual(openMap());
  });
  it('点击边缘只露出标签的历史地点时先带回视野，再打开浮窗', () => {
    const map = navigate(startApp(0, { kind: 'valid', data: sampleV2('act1') }).state, 'open-map');
    const opened = select(map, 'grandma_home');
    expect(opened.map!.popupOpen).toBe(true);
    expect(pointInViewport(projectLocation(opened.map!.camera, locationById('grandma_home').position, opened.map!.viewport), opened.map!.viewport)).toBe(true);
  });
  it('当前关直接进入；重复卡片输入和旧地图回调不会二次进入', () => {
    const map = select(openMap()), token = navigationToken(map);
    const begun = appAction(map, { type: 'enter-level', token, levelId: 'prologue_01' });
    expect(begun.screen).toBe('story'); expect(begun.sceneId).toBe('p001');
    expect(appAction(begun, { type: 'enter-level', token, levelId: 'prologue_01' })).toBe(begun);
    expect(appAction(begun, { type: 'resize-map', token, viewport: { width: 1920, height: 1080 } })).toBe(begun);
  });
  it('浮窗开闭、拖缩、聚焦和尺寸变化均不写盘，也不改检查点／flag／RNG', () => {
    const map = navigate(startApp(42, { kind: 'valid', data: sampleV2() }).state, 'open-map'), token = navigationToken(map);
    const actions: NavigationAction[] = [
      { type: 'select-location', token, locationId: 'grandma_home' }, { type: 'close-location', token },
      { type: 'pan-map', token, dx: -20, dy: 15 }, { type: 'zoom-map', token, factor: 1.2 },
      { type: 'focus-map', token }, { type: 'resize-map', token, viewport: { width: 1920, height: 900 } },
    ];
    for (const action of actions) {
      const result = reduceApp(map, action, storyLibrary, 1000);
      expect(result.saves).toBeUndefined(); expect(result.effects).toEqual([]);
      expect(result.state.progress).toBe(map.progress); expect(result.state.flags).toBe(map.flags);
      expect(result.state.campaignSeed).toBe(42); expect(result.state.sceneId).toBe(map.sceneId);
    }
  });
  it('浮窗跟随相机；地点锚点离开视野后关闭，不自动重新打开', () => {
    const map = select(openMap()), token = navigationToken(map), point = locationById('grandma_home').position;
    const before = projectLocation(map.map!.camera, point, map.map!.viewport);
    const moved = appAction(map, { type: 'pan-map', token, dx: -50, dy: 20 });
    const after = projectLocation(moved.map!.camera, point, moved.map!.viewport);
    expect(after.x).toBeCloseTo(before.x - 50); expect(after.y).toBeCloseTo(before.y + 20); expect(moved.map!.popupOpen).toBe(true);
    const outside = appAction(moved, { type: 'pan-map', token, dx: -99999, dy: 0 });
    expect(outside.map!.popupOpen).toBe(false);
    expect(appAction(outside, { type: 'pan-map', token, dx: 99999, dy: 0 }).map!.popupOpen).toBe(false);
  });
  it('尺寸输入会复制且拒绝无效值，导航后旧尺寸请求无效', () => {
    const map = openMap(), token = navigationToken(map), viewport = { width: 800, height: 600 };
    const resized = appAction(map, { type: 'resize-map', token, viewport }); viewport.width = 1;
    expect(resized.map!.viewport.width).toBe(800); expect(map.map!.viewport.width).toBe(1280);
    for (const width of [0, -1, NaN, Infinity]) expect(appAction(map, { type: 'resize-map', token, viewport: { width, height: 600 } })).toBe(map);
    expect(appAction(map, { type: 'resize-map', token, viewport: { ...map.map!.viewport } })).toBe(map);
    const menu = navigate(map, 'main-menu'); expect(appAction(menu, { type: 'close-location', token })).toBe(menu);
  });
  it('全通关地图仍可查看五地点，任何卡片都不能进入', () => {
    const data = { ...sampleV2('act1', 'a016'), completedLevelIds: [...levelIds],
      flags: { flag_prologue_completed: true, flag_act1_completed: true }, checkpoint: { kind: 'map' as const } };
    let map = navigate(startApp(0, { kind: 'valid', data }).state, 'open-map');
    expect(map.map!.popupOpen).toBe(false);
    map = select(map);
    expect(map.map!.popupOpen).toBe(true);
    for (const levelId of levelIds) expect(appAction(map, { type: 'enter-level', token: navigationToken(map), levelId })).toBe(map);
  });
});

describe('实际视口的等比铺满相机', () => {
  it.each([{ width: 1920, height: 900 }, { width: 1280, height: 720 }, { width: 800, height: 600 }, { width: 600, height: 900 }])('最小倍率铺满 $width × $height，边缘无空白', viewport => {
    const camera = focusCamera({ x: .5, y: .5 }, 1, viewport), scale = coverScale(viewport);
    expect(mapSize.width * scale).toBeGreaterThanOrEqual(viewport.width);
    expect(mapSize.height * scale).toBeGreaterThanOrEqual(viewport.height);
    expect(camera.x).toBeLessThanOrEqual(0); expect(camera.y).toBeLessThanOrEqual(0);
    expect(camera.x + mapSize.width * scale).toBeGreaterThanOrEqual(viewport.width);
    expect(camera.y + mapSize.height * scale).toBeGreaterThanOrEqual(viewport.height);
  });
  it('不同尺寸的指针缩放保留锚点下的世界坐标', () => {
    const viewport = { width: 1700, height: 850 }, camera = focusCamera({ x: .5, y: .5 }, 1.8, viewport), anchor = { x: 800, y: 360 };
    const zoomed = zoomCamera(camera, 1.15, anchor, viewport);
    expect((anchor.x - camera.x) / camera.zoom).toBeCloseTo((anchor.x - zoomed.x) / zoomed.zoom);
    expect((anchor.y - camera.y) / camera.zoom).toBeCloseTo((anchor.y - zoomed.y) / zoomed.zoom);
  });
  it('调整窗口保持视野中心世界点与相对倍率，而非重新跳到当前关', () => {
    const before = { width: 1280, height: 720 }, after = { width: 1800, height: 1000 };
    const camera = focusCamera({ x: .55, y: .6 }, 2, before), resized = resizeCamera(camera, before, after);
    const center = (offset: number, extent: number, scale: number) => (extent / 2 - offset) / scale;
    expect(center(camera.x, before.width, coverScale(before))).toBeCloseTo(center(resized.x, after.width, coverScale(after)));
    expect(center(camera.y, before.height, coverScale(before))).toBeCloseTo(center(resized.y, after.height, coverScale(after)));
    expect(resized.zoom).toBe(camera.zoom);
  });
  it('定位任何地点都能让锚点留在视野内，极端尺寸也不露底', () => {
    const viewport = { width: 700, height: 1000 };
    for (const id of ['grandma_home', 'construction_site', 'old_warehouse'] as const) {
      const point = locationById(id).position, camera = focusCamera(point, 1.4, viewport);
      expect(pointInViewport(projectLocation(camera, point, viewport), viewport)).toBe(true);
    }
  });
});
