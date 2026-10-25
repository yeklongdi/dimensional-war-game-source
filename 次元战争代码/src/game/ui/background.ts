import type { Action, GameState } from '../state.js';
import { backgroundBindings, timeGradient } from '../story/config.js';
import { displaySceneTitle } from '../story/chapter-policy.js';
import { decodeImage } from '../visual/loading.js';
import { BackgroundLoader } from '../visual/background-loading.js';
import type { BackgroundFrame } from '../visual/background-loading.js';

export type BackgroundPorts = { decode?: (url: string) => Promise<HTMLImageElement> };

/** 背景仅消费演出状态；加载、诊断不推进剧情、不保存。 */
export class BackgroundView {
  private readonly loader: BackgroundLoader<HTMLImageElement>;
  private readonly warned = new Set<string>();
  private state: GameState | undefined;
  private readonly root: HTMLElement;
  private readonly title: HTMLElement;
  private readonly dispatch: (action: Action) => void;

  constructor(root: HTMLElement, title: HTMLElement,
    dispatch: (action: Action) => void, ports: BackgroundPorts = {}) {
    this.root = root; this.title = title; this.dispatch = dispatch;
    this.root.setAttribute('aria-hidden', 'true');
    this.loader = new BackgroundLoader(ports.decode ?? decodeImage, frame => this.present(frame));
  }

  render(state: GameState): void {
    this.state = state;
    this.root.style.background = timeGradient(state.time);
    this.loader.update({ run: state.run, actId: state.actId, sceneId: state.sceneId,
      id: state.backgroundId, url: backgroundBindings[state.backgroundId] });
  }

  private present(frame: BackgroundFrame<HTMLImageElement>): void {
    Object.assign(this.root.dataset, { backgroundId: frame.id, backgroundStatus: frame.status });
    this.root.replaceChildren();
    if (frame.status === 'ready') {
      const image = frame.image;
      image.className = 'background-image'; image.alt = ''; image.draggable = false;
      this.root.append(image); this.title.textContent = '';
    } else {
      this.title.textContent = displaySceneTitle(this.state?.sceneTitle ?? '');
      if (frame.status === 'failed' && !this.warned.has(frame.id)) {
        this.warned.add(frame.id);
        this.dispatch({ type: 'warning', key: `background-load:${frame.id}`, message: frame.message });
      }
    }
  }

  dispose(): void { this.loader.dispose(); this.state = undefined; this.root.replaceChildren(); }
}
