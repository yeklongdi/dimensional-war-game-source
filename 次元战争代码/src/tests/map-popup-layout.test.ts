import { describe, expect, it } from 'vitest';
import { placeMapPopup } from '../game/map-popup-layout.js';

describe('地点旁浮窗定位', () => {
  const size = { width: 360, height: 310 }, viewport = { width: 1280, height: 720 };
  it('有空间时位于地点右边，跟随锚点移动', () => {
    const first = placeMapPopup({ x: 400, y: 350 }, size, viewport);
    const next = placeMapPopup({ x: 450, y: 370 }, size, viewport);
    expect(first.side).toBe('right'); expect(next.x - first.x).toBe(50); expect(next.y - first.y).toBe(20);
  });
  it('右边空间不足时切换到左边，不覆盖地点', () => {
    const result = placeMapPopup({ x: 1230, y: 350 }, size, viewport);
    expect(result.side).toBe('left'); expect(result.x + size.width).toBeLessThan(1230);
  });
  it.each([{ x: 5, y: 5 }, { x: 1278, y: 5 }, { x: 5, y: 718 }, { x: 1278, y: 718 }])('靠近边缘 $x,$y 仍限制在窗口内', anchor => {
    const result = placeMapPopup(anchor, size, viewport);
    expect(result.x).toBeGreaterThanOrEqual(12); expect(result.y).toBeGreaterThanOrEqual(12);
    expect(result.x + size.width).toBeLessThanOrEqual(viewport.width - 12);
    expect(result.y + size.height).toBeLessThanOrEqual(viewport.height - 12);
  });
  it('避让标题与控制区域，不为定位浮窗而移动地图', () => {
    const anchor = { x: 600, y: 300 }, obstacles = [{ x: 630, y: 200, width: 400, height: 360 }];
    const result = placeMapPopup(anchor, size, viewport, obstacles);
    expect(result.side).toBe('left'); expect(anchor).toEqual({ x: 600, y: 300 });
    expect(obstacles).toEqual([{ x: 630, y: 200, width: 400, height: 360 }]);
  });
  it('小窗口优先保留地点可见，不能为了躲存档提示盖住地点', () => {
    const result = placeMapPopup({ x: 357, y: 300 }, size, { width: 800, height: 600 }, [{ x: 430, y: 474, width: 350, height: 36 }]);
    const coversPin = result.x < 387 && result.x + size.width > 327 && result.y < 352 && result.y + size.height > 262;
    expect(coversPin).toBe(false);
  });
  it('小窗口双关列表上下避让标题和地图控制，不遮住底部按钮', () => {
    const result = placeMapPopup({ x: 415, y: 270 }, { width: 360, height: 400 }, { width: 800, height: 600 }, [
      { x: 20, y: 18, width: 410, height: 82 }, { x: 20, y: 522, width: 350, height: 58 },
    ]);
    expect(result.x + 360).toBeLessThan(385);
    expect(result.y).toBeGreaterThanOrEqual(100); expect(result.y + 400).toBeLessThanOrEqual(522);
  });
});
