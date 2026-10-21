import type { GameState } from '../state.js';
import { navigationToken } from '../router.js';
import type { NavigationAction } from '../router.js';
import { button, element } from './elements.js';
import { version } from '../../../package.json';

export class MenuView {
  readonly stage = element('main', 'stage menu-stage');
  private readonly content = element('section', 'menu-content main-menu-content');
  private readonly resizeObserver: ResizeObserver;
  private readonly dispatch: (action: NavigationAction) => void;
  private key = '';
  constructor(root: HTMLElement, dispatch: (action: NavigationAction) => void) {
    this.dispatch = dispatch; this.stage.id = 'stage';
    this.stage.append(this.content, element('span', 'game-version', `v${version}`)); root.append(this.stage);
    const resize = () => { this.stage.style.transform = `translate(-50%, -50%) scale(${Math.min(root.clientWidth / 1280, root.clientHeight / 720)})`; };
    this.resizeObserver = new ResizeObserver(resize); this.resizeObserver.observe(root); resize();
  }
  dispose() { this.resizeObserver.disconnect(); this.stage.remove(); }
  render(state: GameState) {
    const p = state.progress!, token = navigationToken(state);
    this.stage.dataset.testid = 'main-menu'; this.stage.dataset.screen = 'menu';
    const key = JSON.stringify([token, p.checkpoint, p.status]);
    if (key === this.key) return;
    this.key = key; this.content.replaceChildren();
    const start = button('开始游戏', 'start-game', () => this.dispatch({ type: 'open-map', token }));
    const resume = button('继续', 'continue-game', () => this.dispatch({ type: 'resume', token }));
    start.disabled = p.status === 'migrating';
    resume.disabled = !p.checkpoint || p.status === 'blocked' || p.status === 'saving' || p.status === 'migrating';
    this.content.append(element('p', 'eyebrow', '垂直切片'), element('h1', 'game-title', '次元战争'), start, resume);
  }
}
