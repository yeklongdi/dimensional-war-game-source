export type MapCamera = { x: number; y: number; zoom: number };
export type MapViewport = { width: number; height: number };
export type MapPoint = { x: number; y: number };
export const mapSize = { width: 1200, height: 800 };
export const mapViewport: MapViewport = { width: 1280, height: 720 };
/** 地图独立使用实际 CSS 视口，最小倍率也等比铺满，不改变剧情／战斗画布。 */
export function coverScale(viewport: MapViewport) {
  return Math.max(viewport.width / mapSize.width, viewport.height / mapSize.height);
}
export const fitScale = coverScale(mapViewport);
export function validViewport(viewport: MapViewport) {
  return Number.isFinite(viewport.width) && Number.isFinite(viewport.height) && viewport.width > 0 && viewport.height > 0;
}
export function clampCamera(camera: MapCamera, viewport = mapViewport): MapCamera {
  const zoom = Math.max(1, Math.min(3, camera.zoom));
  const scale = coverScale(viewport) * zoom;
  const axis = (offset: number, image: number, size: number) => Math.max(size - image, Math.min(0, offset));
  return { zoom, x: axis(camera.x, mapSize.width * scale, viewport.width),
    y: axis(camera.y, mapSize.height * scale, viewport.height) };
}
export function focusCamera(point: MapPoint, zoom = 1.4, viewport = mapViewport): MapCamera {
  const scale = coverScale(viewport) * zoom;
  return clampCamera({ zoom, x: viewport.width / 2 - point.x * mapSize.width * scale,
    y: viewport.height / 2 - point.y * mapSize.height * scale }, viewport);
}
export function zoomCamera(camera: MapCamera, factor: number, anchor: MapPoint, viewport = mapViewport): MapCamera {
  const zoom = Math.max(1, Math.min(3, camera.zoom * factor)), ratio = zoom / camera.zoom;
  return clampCamera({ zoom, x: anchor.x - (anchor.x - camera.x) * ratio, y: anchor.y - (anchor.y - camera.y) * ratio }, viewport);
}
export function resizeCamera(camera: MapCamera, before: MapViewport, after: MapViewport): MapCamera {
  const ratio = coverScale(after) / coverScale(before);
  return clampCamera({ zoom: camera.zoom, x: after.width / 2 - (before.width / 2 - camera.x) * ratio,
    y: after.height / 2 - (before.height / 2 - camera.y) * ratio }, after);
}
export function projectLocation(camera: MapCamera, point: MapPoint, viewport = mapViewport): MapPoint {
  const scale = coverScale(viewport) * camera.zoom;
  return { x: camera.x + point.x * mapSize.width * scale, y: camera.y + point.y * mapSize.height * scale };
}
export function pointInViewport(point: MapPoint, viewport: MapViewport) {
  return point.x >= 0 && point.y >= 0 && point.x <= viewport.width && point.y <= viewport.height;
}
