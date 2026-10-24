import { currentLevel, levels, visibleLevels } from '../../content/levels.js';
import { locationById } from '../../content/map-locations.js';
import { navigationToken } from '../router.js';
import type { NavigationAction } from '../router.js';
import type { GameState } from '../state.js';
import { button, element } from './elements.js';
import { chapterTitles } from '../story/chapter-policy.js';

/** 非模态地点浮窗；卡片本身即进入操作，地图始终可以拖缩。 */
export class MapPopup {
  readonly root = element('section', 'map-location-popup');
  private readonly title = element('h2');
  private readonly content = element('div', 'map-popup-levels');
  private readonly close: HTMLButtonElement;
  private readonly dispatch: (action: NavigationAction) => void;
  private readonly cards = new Map<string, HTMLButtonElement>();
  private token = ''; private key = '';
  constructor(dispatch: (action: NavigationAction) => void, close: () => void) {
    this.dispatch = dispatch;
    this.root.hidden = true; this.root.tabIndex = -1; this.root.id = 'map-location-popup';
    this.root.dataset.testid = 'map-panel'; this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'false'); this.root.setAttribute('aria-labelledby', 'map-popup-title');
    this.title.id = 'map-popup-title';
    this.close = button('×', 'map-popup-close', close); this.close.classList.add('map-popup-close'); this.close.setAttribute('aria-label', '关闭地点关卡');
    const heading = element('header', 'map-popup-heading');
    const labels = element('div'); labels.append(element('p', 'eyebrow', '地点 / 关卡'), this.title);
    heading.append(labels, this.close);
    this.root.append(heading, this.content, element('p', 'map-popup-note', '点击关卡开始或继续。已完成关卡仅供查看。'));
    this.root.addEventListener('click', event => event.stopPropagation());
  }
  render(state: GameState) {
    const map = state.map!, p = state.progress!, current = currentLevel(p.completedLevelIds);
    const opening = this.root.hidden && map.popupOpen;
    this.token = navigationToken(state); this.root.hidden = !map.popupOpen;
    if (!map.popupOpen) return;
    if (opening) this.root.scrollTop = 0;
    const point = (p.status === 'blocked' || p.status === 'error' || p.status === 'saving' ? p.draft : undefined)?.checkpoint ?? p.checkpoint?.checkpoint;
    const key = JSON.stringify([this.token, map.selected, p.completedLevelIds, point?.kind === 'level' ? point.levelId : 'map']);
    if (key !== this.key) {
      this.key = key; this.cards.clear(); this.content.replaceChildren(); this.root.scrollTop = 0;
      this.title.textContent = locationById(map.selected).name;
      if (!current) this.content.append(element('p', 'map-complete', '垂直切片已完成'));
      for (const level of visibleLevels(p.completedLevelIds).filter(item => item.locationId === map.selected)) {
        const completed = p.completedLevelIds.includes(level.id), continuing = !completed && point?.kind === 'level' && point.levelId === level.id;
        const label = completed ? '已完成 · 不可重玩' : continuing ? '继续关卡' : '开始关卡';
        const card = button('', `enter-${level.id}`, () => this.dispatch({ type: 'enter-level', token: this.token, levelId: level.id }));
        card.classList.add('map-level-card'); card.classList.toggle('completed', completed); card.dataset.levelId = level.id;
        card.setAttribute('aria-label', `${level.name}，${label}`);
        card.append(element('span', 'map-level-number', `第 ${levels.indexOf(level) + 1} 关 · ${chapterTitles[level.actId]}`),
          element('strong', 'map-level-title', level.name), element('span', 'map-level-status', label));
        this.cards.set(level.id, card); this.content.append(card);
      }
    }
    for (const [id, card] of this.cards) card.disabled = id !== current?.id || p.status === 'migrating' || p.status === 'saving';
    this.root.setAttribute('aria-busy', String(p.status === 'saving' || p.status === 'migrating'));
  }
  focusFirst() { (this.root.querySelector<HTMLButtonElement>('.map-level-card:not(:disabled)') ?? this.close).focus({ preventScroll: true }); }
}
