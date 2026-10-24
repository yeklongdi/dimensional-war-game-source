import type { GameState } from '../state.js';
import { systemToken } from '../runtime.js';
import type { SystemAction } from '../system-types.js';
import { button, element } from './elements.js';
import { version } from '../../../package.json';

export class MenuView {
  readonly stage = element('main', 'stage menu-stage');
  private readonly content = element('section', 'menu-content main-menu-content');
  private readonly resizeObserver: ResizeObserver;
  private readonly dispatch: (action: SystemAction) => void;
  private key = '';
  private state?: GameState;
  constructor(root: HTMLElement, dispatch: (action: SystemAction) => void) {
    this.dispatch = dispatch; this.stage.id = 'stage';
    this.stage.append(this.content, element('span', 'game-version', `v${version}`)); root.append(this.stage);
    const resize = () => { this.stage.style.transform = `translate(-50%, -50%) scale(${Math.min(root.clientWidth / 1280, root.clientHeight / 720)})`; };
    this.resizeObserver = new ResizeObserver(resize); this.resizeObserver.observe(root); resize();
  }
  dispose() { this.resizeObserver.disconnect(); this.stage.remove(); }
  render(state: GameState) {
    this.state = state;
    const p = state.progress!;
    this.stage.dataset.testid = 'main-menu'; this.stage.dataset.screen = 'menu';
    const key = JSON.stringify([state.run, p.checkpoint, p.status, !!state.system?.pending]);
    if (key === this.key) return;
    this.key = key; this.content.replaceChildren();
    const start = button('开始新游戏', 'start-game', () => this.dispatch({ type: 'system', intent: 'new', token: systemToken(this.state!) }));
    const load = button('读取', 'load-game', () => this.dispatch({ type: 'system', intent: 'load', token: systemToken(this.state!) }));
    const settings = button('设置', 'open-settings', () => this.dispatch({ type: 'system', intent: 'settings', token: systemToken(this.state!) }));
    start.disabled = !!state.system?.pending;
    this.content.append(element('p', 'eyebrow', '垂直切片'), element('h1', 'game-title', '次元战争'), start, load, settings);
  }
}
