import { currentLevel, levelMapTitle, levels, progressEdges, visibleLevels } from '../../content/levels.js';
import { locationById, mapLocations } from '../../content/map-locations.js';
import { coverScale, mapSize, projectLocation } from '../map-camera.js';
import type { LocationId } from '../../content/map-locations.js';
import { placeMapPopup } from '../map-popup-layout.js';
import { assetUrl } from '../asset-url.js';
import { navigationToken } from '../router.js';
import type { NavigationAction } from '../router.js';
import type { GameState } from '../state.js';
import { button, element } from './elements.js';
import { MapPopup } from './map-popup.js';

export class MapView {
  readonly stage = element('main', 'stage map-stage');
  private readonly viewport = element('section', 'city-map-viewport');
  private readonly world = element('div', 'city-map-world');
  private readonly pins = element('div', 'city-map-pins');
  private readonly heading = element('header', 'map-heading');
  private readonly controls = element('nav', 'map-controls');
  private readonly popup: MapPopup;
  private readonly lines = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  private readonly subtitle = element('p', 'map-subtitle');
  private readonly resizeObserver: ResizeObserver;
  private readonly dispatch: (action: NavigationAction) => void;
  private token = ''; private nodesKey = ''; private selected: LocationId = 'grandma_home';
  private popupOpen = false; private focusPopup = false; private disposed = false;
  private measured?: { width: number; height: number };
  private drag?: { id: number; startX: number; startY: number; lastX: number; lastY: number; active: boolean };
  private suppressClick = false;
  constructor(root: HTMLElement, dispatch: (action: NavigationAction) => void) {
    this.dispatch = dispatch; this.stage.id = 'stage'; this.stage.dataset.testid = 'city-map';
    this.popup = new MapPopup(dispatch, () => this.closePopup(true));
    this.heading.append(element('p', 'eyebrow', '次元战争 · 主线地图'), element('h1', '', '太阳市'), this.subtitle);
    this.viewport.dataset.testid = 'map-viewport'; this.viewport.tabIndex = -1;
    this.viewport.setAttribute('aria-label', '太阳市地图，可拖动和缩放，点击地点查看关卡');
    const image = element('img', 'city-map-image'); image.src = assetUrl('/assets/maps/sun-city-painted-v1.png'); image.alt = '北朝上的太阳市彩绘俯视地图'; image.draggable = false;
    image.addEventListener('error', () => {
      if (this.disposed) return;
      this.viewport.append(element('p', 'map-image-error', '地图素材读取失败，请检查本地素材文件。'));
      console.warn('[次元战争:map-asset] 太阳市彩绘底图读取失败。');
    }, { once: true });
    this.lines.setAttribute('viewBox', `0 0 ${mapSize.width} ${mapSize.height}`); this.lines.classList.add('map-progress-lines');
    this.lines.setAttribute('aria-hidden', 'true');
    this.world.append(image, this.lines, this.pins); this.viewport.append(this.world);
    this.controls.setAttribute('aria-label', '地图控制');
    this.controls.append(button('＋', 'map-zoom-in', () => this.send({ type: 'zoom-map', token: this.token, factor: 1.25 })),
      button('−', 'map-zoom-out', () => this.send({ type: 'zoom-map', token: this.token, factor: .8 })),
      button('定位当前关卡', 'map-focus', () => this.send({ type: 'focus-map', token: this.token })),
      button('返回主菜单', 'map-menu', () => this.send({ type: 'main-menu', token: this.token })));
    this.stage.append(this.viewport, this.heading, this.controls, this.popup.root); root.append(this.stage);
    this.viewport.addEventListener('pointerdown', this.pointerDown);
    this.viewport.addEventListener('pointermove', this.pointerMove);
    this.viewport.addEventListener('pointercancel', this.pointerCancel);
    window.addEventListener('pointerup', this.pointerUp);
    this.viewport.addEventListener('wheel', this.wheel, { passive: false });
    this.stage.addEventListener('click', this.outsideClick);
    this.stage.addEventListener('keydown', this.keydown, true);
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.disposed && this.token && this.viewport.clientWidth > 0 && this.viewport.clientHeight > 0) {
        this.measured = { width: this.viewport.clientWidth, height: this.viewport.clientHeight };
        this.send({ type: 'resize-map', token: this.token, viewport: this.measured });
      }
    });
    this.resizeObserver.observe(this.viewport);
  }
  dispose() {
    this.disposed = true; this.pointerCancel(); window.removeEventListener('pointerup', this.pointerUp);
    this.resizeObserver.disconnect(); this.stage.remove();
  }
  private send(action: NavigationAction) { if (!this.disposed) this.dispatch(action); }
  private point(event: { clientX: number; clientY: number }) {
    const rect = this.viewport.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
  private pointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || !event.isPrimary) return;
    const point = this.point(event); this.suppressClick = false;
    this.drag = { id: event.pointerId, startX: point.x, startY: point.y, lastX: point.x, lastY: point.y, active: false };
  };
  private pointerMove = (event: PointerEvent) => {
    const drag = this.drag; if (!drag || drag.id !== event.pointerId) return;
    const point = this.point(event);
    if (!drag.active && Math.hypot(point.x - drag.startX, point.y - drag.startY) < 6) return;
    if (!drag.active) { drag.active = true; this.viewport.setPointerCapture(event.pointerId); this.viewport.classList.add('dragging'); }
    this.suppressClick = true;
    this.send({ type: 'pan-map', token: this.token, dx: point.x - drag.lastX, dy: point.y - drag.lastY });
    drag.lastX = point.x; drag.lastY = point.y; event.preventDefault();
  };
  private pointerUp = (event: PointerEvent) => {
    if (this.drag?.id !== event.pointerId) return;
    this.suppressClick = this.drag.active;
    if (this.viewport.hasPointerCapture(event.pointerId)) this.viewport.releasePointerCapture(event.pointerId);
    this.drag = undefined; this.viewport.classList.remove('dragging');
  };
  private pointerCancel = () => {
    if (this.drag && this.viewport.hasPointerCapture(this.drag.id)) this.viewport.releasePointerCapture(this.drag.id);
    this.drag = undefined; this.viewport.classList.remove('dragging');
  };
  private wheel = (event: WheelEvent) => {
    event.preventDefault();
    this.send({ type: 'zoom-map', token: this.token, factor: Math.exp(-Math.max(-200, Math.min(200, event.deltaY)) * .002), anchor: this.point(event) });
  };
  private outsideClick = (event: MouseEvent) => {
    if (this.popupOpen && !this.suppressClick && event.target instanceof Element && !event.target.closest('.map-location-popup, .map-pin, .map-controls, .app-chrome')) this.closePopup(false);
    this.suppressClick = false;
  };
  private keydown = (event: KeyboardEvent) => {
    if (event.target instanceof Element && event.target.closest('.app-chrome')) return;
    if ((event.key === 'Enter' || event.code === 'Space') && event.repeat) { event.preventDefault(); return; }
    if (event.key === 'Escape' && this.popupOpen) { event.preventDefault(); event.stopPropagation(); this.closePopup(true); }
  };
  private closePopup(restoreFocus: boolean) {
    if (!this.popupOpen) return;
    const returnFocus = restoreFocus || this.popup.root.contains(document.activeElement);
    this.send({ type: 'close-location', token: this.token });
    if (returnFocus) this.pins.querySelector<HTMLButtonElement>(`[data-location-id="${this.selected}"]`)?.focus({ preventScroll: true });
  }
  render(state: GameState) {
    const map = state.map!, p = state.progress!, current = currentLevel(p.completedLevelIds);
    const wasOpen = this.popupOpen; this.popupOpen = map.popupOpen; this.selected = map.selected; this.token = navigationToken(state);
    const visible = visibleLevels(p.completedLevelIds), locations = new Set(visible.map(level => level.locationId));
    const camera = map.camera, scale = coverScale(map.viewport) * camera.zoom;
    this.world.style.transform = `translate(${camera.x}px, ${camera.y}px) scale(${scale})`;
    this.world.style.setProperty('--pin-scale', String(1 / scale));
    Object.assign(this.stage.dataset, { screen: 'map', completedLevels: p.completedLevelIds.join(','), currentLevel: current?.id ?? '',
      selectedLocation: map.selected, popupOpen: String(map.popupOpen), camera: JSON.stringify(camera), viewport: JSON.stringify(map.viewport),
      visibleNodes: String(locations.size), sliceComplete: String(!current) });
    this.subtitle.textContent = current ? `主线进度 ${p.completedLevelIds.length} / ${levels.length} · ${levelMapTitle(current)}` : `垂直切片已完成 · ${levels.length} / ${levels.length}`;
    const nodesKey = `${p.completedLevelIds.join(',')}:${state.run}`;
    if (this.nodesKey !== nodesKey) {
      this.nodesKey = nodesKey; this.pins.replaceChildren(); this.drawLines(state);
      for (const location of mapLocations) if (locations.has(location.id)) {
        const pin = element('button', 'map-pin'); pin.type = 'button'; pin.dataset.testid = `location-${location.id}`; pin.dataset.locationId = location.id;
        pin.style.left = `${location.position.x * mapSize.width}px`; pin.style.top = `${location.position.y * mapSize.height}px`;
        const chapter = current?.locationId === location.id ? current.mapTitle : undefined;
        pin.setAttribute('aria-label', `查看${location.name}的关卡${chapter ? `，当前：${chapter}` : ''}`); pin.setAttribute('aria-controls', this.popup.root.id); pin.setAttribute('aria-haspopup', 'dialog');
        pin.append(element('span', 'pin-dot', location.name[0]), element('span', 'pin-label', location.name));
        if (chapter) pin.append(element('span', 'pin-chapter', chapter));
        pin.addEventListener('focus', () => {
          const rect = pin.getBoundingClientRect(), viewport = this.viewport.getBoundingClientRect();
          if (pin.matches(':focus-visible') && (rect.left < viewport.left || rect.right > viewport.right || rect.top < viewport.top || rect.bottom > viewport.bottom)) {
            this.send({ type: 'focus-location', token: this.token, locationId: location.id });
          }
        });
        pin.addEventListener('click', event => {
          event.stopPropagation(); if (event.detail > 1 || (event.detail > 0 && this.suppressClick)) return;
          this.focusPopup = event.detail === 0;
          this.send({ type: 'select-location', token: this.token, locationId: location.id });
          if (this.focusPopup && this.popupOpen) { this.popup.focusFirst(); this.focusPopup = false; }
        });
        if (map.unlock && current?.locationId === location.id) pin.classList.add('new-target');
        this.pins.append(pin);
      }
    }
    for (const pin of Array.from(this.pins.querySelectorAll<HTMLButtonElement>('.map-pin'))) {
      pin.classList.toggle('selected', pin.dataset.locationId === map.selected);
      pin.classList.toggle('current', pin.dataset.locationId === current?.locationId);
      pin.setAttribute('aria-expanded', String(map.popupOpen && pin.dataset.locationId === map.selected));
    }
    const containedFocus = this.popup.root.contains(document.activeElement);
    this.popup.render(state);
    if (map.popupOpen) {
      this.positionPopup(state);
      if (this.focusPopup) { this.popup.focusFirst(); this.focusPopup = false; }
    } else if (wasOpen && containedFocus) this.viewport.focus({ preventScroll: true });
    if (this.measured && !p.confirming && (map.viewport.width !== this.measured.width || map.viewport.height !== this.measured.height)) {
      this.send({ type: 'resize-map', token: this.token, viewport: this.measured });
    }
  }
  private positionPopup(state: GameState) {
    const map = state.map!, rect = this.viewport.getBoundingClientRect();
    const obstacles = [this.heading, this.controls, this.stage.querySelector<HTMLElement>('.save-feedback')].flatMap(node => {
      if (!node) return [];
      const box = node.getBoundingClientRect(); return [{ x: box.left - rect.left, y: box.top - rect.top, width: box.width, height: box.height }];
    });
    const anchor = projectLocation(map.camera, locationById(map.selected).position, map.viewport);
    const layout = placeMapPopup(anchor, { width: this.popup.root.offsetWidth, height: this.popup.root.offsetHeight }, map.viewport, obstacles);
    this.popup.root.style.left = `${layout.x}px`; this.popup.root.style.top = `${layout.y}px`;
    this.popup.root.dataset.side = layout.side; this.popup.root.style.setProperty('--popup-pointer', `${layout.pointer}px`);
  }
  private drawLines(state: GameState) {
    const ns = 'http://www.w3.org/2000/svg'; this.lines.replaceChildren();
    const defs = document.createElementNS(ns, 'defs'), marker = document.createElementNS(ns, 'marker');
    marker.id = 'map-arrow'; marker.setAttribute('viewBox', '0 0 10 10'); marker.setAttribute('refX', '9'); marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '6'); marker.setAttribute('markerHeight', '6'); marker.setAttribute('orient', 'auto-start-reverse');
    const arrow = document.createElementNS(ns, 'path'); arrow.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z'); arrow.setAttribute('fill', '#f2d28b'); marker.append(arrow); defs.append(marker); this.lines.append(defs);
    for (const edge of progressEdges(state.progress!.completedLevelIds)) {
      const from = locationById(edge.from).position, to = locationById(edge.to).position;
      const dx = (to.x - from.x) * mapSize.width, dy = (to.y - from.y) * mapSize.height, length = Math.hypot(dx, dy), trim = 30 / length;
      const line = document.createElementNS(ns, 'path');
      line.setAttribute('d', `M ${from.x * mapSize.width + dx * trim} ${from.y * mapSize.height + dy * trim} L ${to.x * mapSize.width - dx * trim} ${to.y * mapSize.height - dy * trim}`);
      line.setAttribute('marker-end', 'url(#map-arrow)'); line.classList.add('map-route');
      if (edge.latest) line.classList.add('latest'); if (edge.latest && state.map!.unlock) line.classList.add('unlock-line');
      line.dataset.from = edge.from; line.dataset.to = edge.to; this.lines.append(line);
    }
  }
}
