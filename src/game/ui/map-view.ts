import { currentLevel, levels, progressEdges, visibleLevels } from '../../content/levels.js';
import { locationById, mapLocations } from '../../content/map-locations.js';
import { fitScale, mapSize, mapViewport } from '../map-camera.js';
import { assetUrl } from '../asset-url.js';
import { navigationToken } from '../router.js';
import type { NavigationAction } from '../router.js';
import type { GameState } from '../state.js';
import { button, element } from './elements.js';

export class MapView {
  readonly stage = element('main', 'stage map-stage');
  private readonly viewport = element('section', 'city-map-viewport');
  private readonly world = element('div', 'city-map-world');
  private readonly pins = element('div', 'city-map-pins');
  private readonly panel = element('section', 'map-panel');
  private readonly lines = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  private readonly subtitle = element('p', 'map-subtitle');
  private readonly resizeObserver: ResizeObserver;
  private readonly dispatch: (action: NavigationAction) => void;
  private token = ''; private nodesKey = ''; private panelKey = '';
  private drag?: { id: number; startX: number; startY: number; lastX: number; lastY: number; active: boolean };
  private suppressClick = false;
  constructor(root: HTMLElement, dispatch: (action: NavigationAction) => void) {
    this.dispatch = dispatch; this.stage.id = 'stage'; this.stage.dataset.testid = 'city-map';
    const header = element('header', 'map-heading');
    header.append(element('p', 'eyebrow', 'Technical demo map'), element('h1', '', 'Sample area'), this.subtitle);
    this.viewport.dataset.testid = 'map-viewport'; this.viewport.setAttribute('aria-label', 'Sample map; drag and zoom to explore');
    const image = element('img', 'city-map-image'); image.src = assetUrl('/assets/maps/demo-map.svg'); image.alt = 'Abstract map placeholder for technical demonstration'; image.draggable = false;
    image.addEventListener('error', () => {
      this.viewport.append(element('p', 'map-image-error', 'The demo map could not be loaded.'));
      console.warn('[demo:map-asset] Demo map image could not be loaded.');
    }, { once: true });
    this.lines.setAttribute('viewBox', `0 0 ${mapSize.width} ${mapSize.height}`); this.lines.classList.add('map-progress-lines');
    this.lines.setAttribute('aria-hidden', 'true');
    this.world.append(image, this.lines, this.pins); this.viewport.append(this.world);
    const controls = element('nav', 'map-controls'); controls.setAttribute('aria-label', '地图控制');
    controls.append(button('＋', 'map-zoom-in', () => this.send({ type: 'zoom-map', token: this.token, factor: 1.25 })),
      button('−', 'map-zoom-out', () => this.send({ type: 'zoom-map', token: this.token, factor: .8 })),
      button('定位当前关卡', 'map-focus', () => this.send({ type: 'focus-map', token: this.token })),
      button('返回主菜单', 'map-menu', () => this.send({ type: 'main-menu', token: this.token })));
    this.panel.dataset.testid = 'map-panel'; this.panel.setAttribute('aria-live', 'polite');
    this.stage.append(header, this.viewport, this.panel, controls); root.append(this.stage);
    this.viewport.addEventListener('pointerdown', this.pointerDown);
    this.viewport.addEventListener('pointermove', this.pointerMove);
    this.viewport.addEventListener('pointercancel', this.pointerCancel);
    window.addEventListener('pointerup', this.pointerUp);
    this.viewport.addEventListener('wheel', this.wheel, { passive: false });
    const resize = () => { this.stage.style.transform = `translate(-50%, -50%) scale(${Math.min(root.clientWidth / 1280, root.clientHeight / 720)})`; };
    this.resizeObserver = new ResizeObserver(resize); this.resizeObserver.observe(root); resize();
  }
  dispose() {
    this.pointerCancel(); window.removeEventListener('pointerup', this.pointerUp);
    this.resizeObserver.disconnect(); this.stage.remove();
  }
  private send(action: NavigationAction) { this.dispatch(action); }
  private point(event: { clientX: number; clientY: number }) {
    const rect = this.viewport.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width * mapViewport.width, y: (event.clientY - rect.top) / rect.height * mapViewport.height };
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
  render(state: GameState) {
    const map = state.map!, p = state.progress!, current = currentLevel(p.completedLevelIds);
    this.token = navigationToken(state);
    const visible = visibleLevels(p.completedLevelIds), locations = new Set(visible.map(level => level.locationId));
    const camera = map.camera, scale = fitScale * camera.zoom;
    this.world.style.transform = `translate(${camera.x}px, ${camera.y}px) scale(${scale})`;
    Object.assign(this.stage.dataset, { screen: 'map', completedLevels: p.completedLevelIds.join(','), currentLevel: current?.id ?? '',
      selectedLocation: map.selected, camera: JSON.stringify(camera), visibleNodes: String(locations.size), sliceComplete: String(!current) });
    this.subtitle.textContent = current
      ? `演示进度 ${p.completedLevelIds.length} / ${levels.length} · ${current.name}`
      : `演示完成 · ${levels.length} / ${levels.length}`;
    const nodesKey = `${p.completedLevelIds.join(',')}:${state.run}`;
    if (this.nodesKey !== nodesKey) {
      this.nodesKey = nodesKey; this.pins.replaceChildren(); this.drawLines(state);
      for (const location of mapLocations) if (locations.has(location.id)) {
        const pin = element('button', 'map-pin'); pin.type = 'button'; pin.dataset.testid = `location-${location.id}`; pin.dataset.locationId = location.id;
        pin.style.left = `${location.position.x * mapSize.width}px`; pin.style.top = `${location.position.y * mapSize.height}px`;
        pin.setAttribute('aria-label', `查看${location.name}`);
        pin.append(element('span', 'pin-dot', location.name[0]), element('span', 'pin-label', location.name));
        pin.addEventListener('focus', () => {
          const rect = pin.getBoundingClientRect(), viewport = this.viewport.getBoundingClientRect();
          if (pin.matches(':focus-visible') && (rect.left < viewport.left || rect.right > viewport.right || rect.top < viewport.top || rect.bottom > viewport.bottom)) {
            this.send({ type: 'focus-location', token: this.token, locationId: location.id });
          }
        });
        pin.addEventListener('click', event => {
          event.stopPropagation(); if (event.detail > 1 || (event.detail > 0 && this.suppressClick)) return;
          this.send({ type: 'select-location', token: this.token, locationId: location.id });
        });
        if (map.unlock && current?.locationId === location.id) pin.classList.add('new-target');
        this.pins.append(pin);
      }
    }
    for (const pin of Array.from(this.pins.querySelectorAll<HTMLButtonElement>('.map-pin'))) {
      pin.classList.toggle('selected', pin.dataset.locationId === map.selected);
      pin.classList.toggle('current', pin.dataset.locationId === current?.locationId);
      pin.setAttribute('aria-pressed', String(pin.dataset.locationId === map.selected));
    }
    const point = (p.status === 'blocked' || p.status === 'error' || p.status === 'saving' ? p.draft : undefined)?.checkpoint ?? p.checkpoint?.checkpoint;
    const panelKey = JSON.stringify([this.token, p.completedLevelIds, map.selected, point, p.status]);
    if (this.panelKey === panelKey) return;
    this.panelKey = panelKey; this.panel.replaceChildren(element('p', 'eyebrow', '地点 / 关卡'), element('h2', '', locationById(map.selected).name));
    if (!current) this.panel.append(element('p', 'map-complete', '垂直切片已完成'));
    for (const level of visible.filter(item => item.locationId === map.selected)) {
      const completed = p.completedLevelIds.includes(level.id), continuing = !completed && point?.kind === 'level' && point.levelId === level.id;
      const card = element('article', `map-level${completed ? ' completed' : ''}`); card.dataset.levelId = level.id;
      card.append(element('p', 'map-level-number', `第 ${levels.indexOf(level) + 1} 关 · ${level.actId === 'prologue' ? '序幕' : '第一幕'}`),
        element('h3', '', level.name), element('p', 'map-level-status', completed ? '已完成 · 不可重玩' : continuing ? '已保留最近场景检查点' : '当前可进入'));
      const enter = button(completed ? '已完成' : continuing ? '继续关卡' : '开始关卡', `enter-${level.id}`, () => this.send({ type: 'enter-level', token: this.token, levelId: level.id }));
      enter.disabled = completed || level.id !== current?.id || p.status === 'migrating' || p.status === 'saving';
      card.append(enter); this.panel.append(card);
    }
    this.panel.append(element('p', 'map-panel-note', '完成本关后自动返回地图。已完成关卡仅供查看。'));
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
