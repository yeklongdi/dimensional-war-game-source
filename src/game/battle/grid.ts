import type { Grid, Point, Unit } from './types.js';

export const key = (point: Point) => `${point.col},${point.row}`;
export const same = (a: Point, b: Point) => a.col === b.col && a.row === b.row;
export const distance = (a: Point, b: Point) => Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
export const occupies = (unit: Unit) => unit.status !== 'defeated' && unit.status !== 'dead';
export function parseMap(rows: readonly string[]): { grid: Grid; hero: Point[]; enemies: Point[] } {
  const width = rows[0]?.length ?? 0;
  if (!width || rows.some(row => row.length !== width || /[^.#XHEB]/.test(row))) throw new Error('地图必须为有效矩形');
  const hero: Point[] = [], enemies: Point[] = [];
  const tiles: Grid['tiles'] = [];
  rows.forEach((row, y) => Array.from(row).forEach((char, x) => {
    if (char === 'H') hero.push({ col: x, row: y });
    if (char === 'E' || char === 'B') enemies.push({ col: x, row: y });
    tiles.push(char === '#' ? 'wall' : char === 'X' ? 'crate' : 'floor');
  }));
  return { grid: { width, height: rows.length, tiles }, hero, enemies };
}
export function inside(grid: Grid, p: Point) { return Number.isInteger(p.col) && Number.isInteger(p.row) && p.col >= 0 && p.row >= 0 && p.col < grid.width && p.row < grid.height; }
export function tile(grid: Grid, p: Point) { return inside(grid, p) ? grid.tiles[p.row * grid.width + p.col] : undefined; }
export function walkable(grid: Grid, p: Point, units: readonly Unit[], mover: string) {
  return tile(grid, p) === 'floor' && !units.some(unit => unit.id !== mover && occupies(unit) && same(unit.position, p));
}
const directions = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]] as const;
export function neighbors(grid: Grid, p: Point, units: readonly Unit[], mover: string): Point[] {
  return directions.filter(([dx, dy]) => walkable(grid, { col: p.col + dx, row: p.row + dy }, units, mover)
    && (!dx || !dy || (walkable(grid, { col: p.col + dx, row: p.row }, units, mover) && walkable(grid, { col: p.col, row: p.row + dy }, units, mover))))
    .map(([dx, dy]) => ({ col: p.col + dx, row: p.row + dy }));
}
export function pathsFrom(grid: Grid, from: Point, units: readonly Unit[], mover: string, budget = Infinity): Map<string, Point[]> {
  const paths = new Map<string, Point[]>([[key(from), []]]);
  const queue = [from];
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index]!;
    const path = paths.get(key(current))!;
    if (path.length >= budget) continue;
    for (const next of neighbors(grid, current, units, mover)) {
      if (paths.has(key(next))) continue;
      paths.set(key(next), [...path, next]); queue.push(next);
    }
  }
  return paths;
}
/** 整数 supercover：角点同时加入两个正交接触格，避免浮点边界误差。 */
export function lineCells(from: Point, to: Point): Point[] {
  const dx = Math.abs(to.col - from.col), dy = Math.abs(to.row - from.row);
  const sx = Math.sign(to.col - from.col), sy = Math.sign(to.row - from.row);
  let x = from.col, y = from.row, ix = 0, iy = 0;
  const cells = [from];
  while (ix < dx || iy < dy) {
    const a = (1 + 2 * ix) * dy, b = (1 + 2 * iy) * dx;
    if (a === b) {
      cells.push({ col: x + sx, row: y }, { col: x, row: y + sy });
      x += sx; y += sy; ix++; iy++;
    } else if (a < b) { x += sx; ix++; }
    else { y += sy; iy++; }
    cells.push({ col: x, row: y });
  }
  return cells.filter((p, index) => cells.findIndex(q => same(p, q)) === index);
}
export function hasLineOfEffect(grid: Grid, from: Point, to: Point) {
  return inside(grid, from) && inside(grid, to) && !lineCells(from, to).some(p => tile(grid, p) === 'wall');
}
export function coverBonus(grid: Grid, from: Point, to: Point) {
  return lineCells(from, to).some(p => tile(grid, p) === 'crate' && distance(p, to) === 1) ? 2 : 0;
}
export function canvasCell(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }, grid: Grid): Point | undefined {
  if (rect.width <= 0 || rect.height <= 0) return undefined;
  const p = { col: Math.floor((clientX - rect.left) / rect.width * grid.width), row: Math.floor((clientY - rect.top) / rect.height * grid.height) };
  return inside(grid, p) ? p : undefined;
}
