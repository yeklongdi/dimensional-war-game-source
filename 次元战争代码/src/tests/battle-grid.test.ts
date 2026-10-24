import { describe, expect, it } from 'vitest';
import { canvasCell, coverBonus, distance, hasLineOfEffect, key, lineCells, neighbors, parseMap, pathsFrom } from '../game/battle/grid.js';
import { battleFor, patchUnit } from './battle-helpers.js';

describe('八方向网格与射线', () => {
  it('解析出生点与地形分离，拒绝不规则地图', () => {
    const map = parseMap(['HX.', '.E#']);
    expect(map.hero).toEqual([{ col: 0, row: 0 }]); expect(map.enemies).toEqual([{ col: 1, row: 1 }]);
    expect(map.grid.tiles).toEqual(['floor', 'crate', 'floor', 'floor', 'floor', 'wall']);
    expect(() => parseMap(['..', '...'])).toThrow(); expect(() => parseMap(['?'])).toThrow();
  });
  it('固定方向 BFS、八向距离；墙/箱子/占用阻挡，斜走不得穿角', () => {
    const grid = parseMap(['...', '.H.', '...']).grid;
    expect(neighbors(grid, { col: 1, row: 1 }, [], '').map(key)).toEqual(['1,0', '2,0', '2,1', '2,2', '1,2', '0,2', '0,1', '0,0']);
    expect(distance({ col: 0, row: 0 }, { col: 2, row: 2 })).toBe(2);
    const blocked = parseMap(['.#.', 'HX.', '...']).grid;
    expect(neighbors(blocked, { col: 0, row: 1 }, [], '')).toEqual([{ col: 0, row: 0 }, { col: 0, row: 2 }]);
    const paths = pathsFrom(grid, { col: 0, row: 0 }, [], '', 1);
    expect(paths.get('1,1')).toHaveLength(1); expect(paths.has('2,2')).toBe(false);
    expect(pathsFrom(grid, { col: 0, row: 0 }, [], '').get('2,2')).toEqual([{ col: 1, row: 1 }, { col: 2, row: 2 }]);
  });
  it('敌人占格，击败后仅标记不占格；占用同样禁止斜切', () => {
    let state = battleFor([], { hero: { col: 0, row: 2 }, black_a: { col: 1, row: 2 }, black_b: { col: 6, row: 4 } });
    const get = () => pathsFrom(state.grid, state.units[0]!.position, state.units, 'hero', 1);
    expect(get().has('1,2')).toBe(false); expect(get().has('1,3')).toBe(false);
    state = patchUnit(state, 'black_a', { hp: 0, status: 'defeated' });
    expect(get().has('1,2')).toBe(true); expect(get().has('1,3')).toBe(true);
  });
  it('supercover 擦角同时经过两侧格，墙阻挡且方向对称', () => {
    const a = { col: 0, row: 0 }, b = { col: 2, row: 2 };
    const grid = parseMap(['.#.', '...', '...']).grid;
    expect(lineCells(a, b)).toContainEqual({ col: 1, row: 0 });
    expect(lineCells(a, b).map(key).sort()).toEqual(lineCells(b, a).map(key).sort());
    expect(hasLineOfEffect(grid, a, b)).toBe(false);
    expect(lineCells(a, { col: 0, row: 2 })).toHaveLength(3);
    expect(lineCells(a, { col: 2, row: 0 })).toHaveLength(3);
  });
  it('掩护必须方向穿箱且邻接目标；箱子不阻挡、不叠加', () => {
    const grid = parseMap(['.XX..', '.....', '.....']).grid;
    const target = { col: 3, row: 0 };
    expect(hasLineOfEffect(grid, { col: 0, row: 0 }, target)).toBe(true);
    expect(coverBonus(grid, { col: 0, row: 0 }, target)).toBe(2);
    expect(coverBonus(grid, { col: 3, row: 2 }, target)).toBe(0);
    expect(coverBonus(grid, { col: 0, row: 0 }, { col: 4, row: 0 })).toBe(0);
    expect(coverBonus(parseMap(['.X.', 'X..', '...']).grid, { col: 0, row: 0 }, { col: 1, row: 1 })).toBe(2);
  });
  it('点击换算正确处理缩放与边界', () => {
    const grid = parseMap(['.......', '.......', '.......', '.......', '.......']).grid;
    const rect = { left: 100, top: 50, width: 336, height: 240 };
    expect(canvasCell(100 + 6.5 * 48, 50 + 4.5 * 48, rect, grid)).toEqual({ col: 6, row: 4 });
    expect(canvasCell(436, 290, rect, grid)).toBeUndefined(); expect(canvasCell(99, 50, rect, grid)).toBeUndefined();
  });
});
