import type { MapPoint, MapViewport } from './map-camera.js';

export type MapRect = { x: number; y: number; width: number; height: number };
type PopupSide = 'right' | 'left' | 'below' | 'above';
export type PopupLayout = MapPoint & { side: PopupSide; pointer: number };
const overlap = (a: MapRect, b: MapRect) => Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
  * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));

/** 仅计算显示位置；不移动地图或地点，也不写入任何游戏／存档状态。 */
export function placeMapPopup(anchor: MapPoint, size: MapViewport, viewport: MapViewport, obstacles: readonly MapRect[] = []): PopupLayout {
  const gap = 38, margin = 12;
  const primary: (MapPoint & { side: PopupSide })[] = [
    { x: anchor.x + gap, y: anchor.y - 66, side: 'right' },
    { x: anchor.x - gap - size.width, y: anchor.y - 66, side: 'left' },
    { x: anchor.x - size.width / 2, y: anchor.y + 66, side: 'below' },
    { x: anchor.x - size.width / 2, y: anchor.y - gap - size.height, side: 'above' },
  ];
  const candidates = primary.flatMap(candidate => [candidate, ...obstacles.flatMap(obstacle => [
    { ...candidate, y: obstacle.y - size.height - margin },
    { ...candidate, y: obstacle.y + obstacle.height + margin },
  ])]);
  const keep = (value: number, limit: number, extent: number) => Math.max(margin, Math.min(Math.max(margin, limit - extent - margin), value));
  const pin = { x: anchor.x - 30, y: anchor.y - 38, width: 60, height: 90 };
  const placed = candidates.map(candidate => {
    const x = keep(candidate.x, viewport.width, size.width), y = keep(candidate.y, viewport.height, size.height);
    const rect = { x, y, ...size };
    const pinOverlap = overlap(rect, pin), score = obstacles.reduce((sum, obstacle) => sum + overlap(rect, obstacle), 0);
    return { x, y, side: candidate.side, pinOverlap, score };
  });
  const best = placed.reduce((a, b) => b.pinOverlap < a.pinOverlap || (b.pinOverlap === a.pinOverlap && b.score < a.score) ? b : a);
  const vertical = best.side === 'left' || best.side === 'right';
  const pointer = Math.max(20, Math.min((vertical ? size.height : size.width) - 20, vertical ? anchor.y - best.y : anchor.x - best.x));
  return { x: best.x, y: best.y, side: best.side, pointer };
}
