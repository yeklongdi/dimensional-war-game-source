import { currentLevel, levels, visibleLevels } from '../content/levels.js';
import { locationById } from '../content/map-locations.js';
import type { LocationId } from '../content/map-locations.js';
import { clampCamera, focusCamera, pointInViewport, projectLocation, resizeCamera, validViewport, zoomCamera } from './map-camera.js';
import type { MapViewport } from './map-camera.js';
import type { GameState } from './state.js';

export type MapAction =
  | { type: 'focus-map' | 'close-location'; token: string }
  | { type: 'select-location' | 'focus-location'; token: string; locationId: LocationId }
  | { type: 'pan-map'; token: string; dx: number; dy: number }
  | { type: 'zoom-map'; token: string; factor: number; anchor?: { x: number; y: number } }
  | { type: 'resize-map'; token: string; viewport: MapViewport };

/** 调用方先校验导航 token；这里仅转换内存中的相机／浮窗，不产生保存或剧情副作用。 */
export function reduceMapNavigation(previous: GameState, action: MapAction): GameState {
  if (previous.screen !== 'map' || !previous.map || !previous.progress) return previous;
  const map = { ...previous.map, unlock: false }, viewport = map.viewport;
  if (action.type === 'select-location' || action.type === 'focus-location') {
    if (!visibleLevels(previous.progress.completedLevelIds).some(level => level.locationId === action.locationId)) return previous;
    if (action.type === 'focus-location') map.camera = focusCamera(locationById(action.locationId).position, map.camera.zoom, viewport);
    else {
      if (map.selected === action.locationId && map.popupOpen) return previous;
      map.selected = action.locationId; map.popupOpen = true;
      const position = locationById(action.locationId).position;
      if (!pointInViewport(projectLocation(map.camera, position, viewport), viewport)) map.camera = focusCamera(position, map.camera.zoom, viewport);
    }
  } else if (action.type === 'close-location') {
    if (!map.popupOpen) return previous;
    map.popupOpen = false;
  } else if (action.type === 'pan-map') {
    if (!Number.isFinite(action.dx) || !Number.isFinite(action.dy)) return previous;
    map.camera = clampCamera({ ...map.camera, x: map.camera.x + action.dx, y: map.camera.y + action.dy }, viewport);
  } else if (action.type === 'zoom-map') {
    const anchor = action.anchor ?? { x: viewport.width / 2, y: viewport.height / 2 };
    if (!Number.isFinite(action.factor) || action.factor <= 0 || !Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)) return previous;
    map.camera = zoomCamera(map.camera, action.factor, anchor, viewport);
  } else if (action.type === 'resize-map') {
    if (!validViewport(action.viewport) || (viewport.width === action.viewport.width && viewport.height === action.viewport.height)) return previous;
    map.viewport = { ...action.viewport }; map.camera = resizeCamera(map.camera, viewport, map.viewport);
  } else {
    const target = currentLevel(previous.progress.completedLevelIds) ?? levels[levels.length - 1]!;
    map.selected = target.locationId; map.popupOpen = false;
    map.camera = focusCamera(locationById(target.locationId).position, map.camera.zoom, viewport);
  }
  if (map.popupOpen && !pointInViewport(projectLocation(map.camera, locationById(map.selected).position, map.viewport), map.viewport)) map.popupOpen = false;
  return { ...previous, map };
}
