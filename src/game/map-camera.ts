export type MapCamera = { x: number; y: number; zoom: number };
export const mapSize = { width: 1200, height: 800 };
export const mapViewport = { width: 896, height: 552 };
export const fitScale = Math.min(mapViewport.width / mapSize.width, mapViewport.height / mapSize.height);
export function clampCamera(camera: MapCamera): MapCamera {
  const zoom = Math.max(1, Math.min(3, camera.zoom));
  const axis = (offset: number, image: number, viewport: number) => image <= viewport ? (viewport - image) / 2 : Math.max(viewport - image, Math.min(0, offset));
  return { zoom, x: axis(camera.x, mapSize.width * fitScale * zoom, mapViewport.width),
    y: axis(camera.y, mapSize.height * fitScale * zoom, mapViewport.height) };
}
export function focusCamera(point: { x: number; y: number }, zoom = 1.4): MapCamera {
  return clampCamera({ zoom, x: mapViewport.width / 2 - point.x * mapSize.width * fitScale * zoom,
    y: mapViewport.height / 2 - point.y * mapSize.height * fitScale * zoom });
}
export function zoomCamera(camera: MapCamera, factor: number, anchor: { x: number; y: number }): MapCamera {
  const zoom = Math.max(1, Math.min(3, camera.zoom * factor)), ratio = zoom / camera.zoom;
  return clampCamera({ zoom, x: anchor.x - (anchor.x - camera.x) * ratio, y: anchor.y - (anchor.y - camera.y) * ratio });
}
