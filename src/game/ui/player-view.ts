import type { Action, GameState } from '../state.js';
import { backgroundBindings, displayName, timeGradient } from '../story/config.js';
import { button, element } from './elements.js';
import { renderDebug } from './dev-overlay.js';
import { renderPortraits } from './portraits.js';

export class PlayerView {
  readonly stage = element('main', 'stage');
  private readonly backdrop = element('div', 'backdrop');
  private readonly title = element('div', 'scene-title');
  private readonly actors = element('div', 'portraits');
  private readonly hud = element('div', 'hud');
  private readonly content = element('div', 'player-content');
  private readonly debug = element('aside', 'dev-overlay');
  private text: HTMLElement | undefined;
  private hint: HTMLElement | undefined;
  private waitToken = '';
  private portraitKey = '';
  private debugKey = '';
  private readonly dispatch: (action: Action) => void;
  private readonly gesture: () => void;
  private readonly resizeObserver: ResizeObserver;
  private readonly endNavigation?: () => void;

  constructor(root: HTMLElement, dispatch: (action: Action) => void, gesture: () => void, endNavigation?: () => void) {
    this.dispatch = dispatch;
    this.gesture = gesture;
    this.endNavigation = endNavigation;
    this.stage.id = 'stage';
    this.stage.tabIndex = 0;
    this.stage.setAttribute('aria-label', '剧情播放器');
    this.stage.dataset.testid = 'story-stage';
    this.content.dataset.testid = 'player-content';
    this.debug.dataset.testid = 'dev-overlay';
    this.debug.hidden = true;
    this.stage.append(this.backdrop, this.title, this.actors, this.hud, this.content, this.debug);
    root.append(this.stage);
    this.debug.addEventListener('click', event => event.stopPropagation());
    this.stage.addEventListener('click', event => {
      this.gesture();
      if (event.detail > 1 || this.stage.dataset.waitKind !== 'text') return;
      this.dispatch({ type: 'advance', token: this.stage.dataset.waitToken ?? '' });
    });
    const resize = () => {
      const scale = Math.min(root.clientWidth / 1280, root.clientHeight / 720);
      this.stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
    };
    this.resizeObserver = new ResizeObserver(resize);
    this.resizeObserver.observe(root);
    resize();
  }

  dispose() { this.resizeObserver.disconnect(); this.stage.remove(); }

  render(state: GameState) {
    const waiting = state.waiting;
    const origin = waiting?.origin;
    Object.assign(this.stage.dataset, {
      actId: state.actId, sceneId: state.sceneId, nodeIndex: String(origin?.nodeIndex ?? state.nodeIndex),
      optionIndex: String(origin?.optionIndex ?? ''), optionNodeIndex: String(origin?.optionNodeIndex ?? ''),
      waitKind: waiting?.kind ?? '', waitToken: waiting?.token ?? '',
      typingComplete: String(waiting?.kind !== 'text' || waiting.revealed >= Array.from(waiting.text).length),
    });
    const background = !state.failedAssets[state.backgroundId] && backgroundBindings[state.backgroundId];
    this.backdrop.style.background = background ? `url("${background}") center / cover` : timeGradient(state.time);
    this.title.textContent = background ? '' : state.sceneTitle;
    this.hud.textContent = `${state.actId === 'prologue' ? '序幕' : '第一幕'}　 /　 次元战争`;
    const speaker = waiting?.kind === 'text' ? waiting.speaker : '';
    const portraitKey = JSON.stringify([state.actId, state.actors, state.failedAssets, speaker]);
    if (this.portraitKey !== portraitKey) {
      renderPortraits(this.actors, state, this.dispatch);
      this.portraitKey = portraitKey;
    }
    if (this.waitToken !== waiting?.token) {
      this.waitToken = waiting?.token ?? '';
      this.content.replaceChildren();
      this.text = undefined;
      this.hint = undefined;
      this.createWait(state);
    }
    if (waiting?.kind === 'text' && this.text) {
      const partial = Array.from(waiting.text).slice(0, waiting.revealed).join('');
      this.text.textContent = waiting.textKind === 'inner' ? `（${partial}）` : partial;
      if (this.hint) this.hint.textContent = this.stage.dataset.typingComplete === 'true' ? '点击 / 空格 / 回车　继续 ▸' : '点击补全文字';
    }
    const debugKey = JSON.stringify([state.debugOpen, state.sceneId, origin, state.hiddenNotes, state.flags, state.actors, state.warnings, state.progress?.checkpoint]);
    if (this.debugKey !== debugKey) {
      renderDebug(this.debug, state);
      this.debugKey = debugKey;
    }
  }

  private createWait(state: GameState) {
    const waiting = state.waiting;
    if (!waiting) return;
    const token = waiting.token;
    const activate = (action: Action) => () => { this.gesture(); this.dispatch(action); };
    if (waiting.kind === 'text') {
      const box = element('section', `text-box text-${waiting.textKind}`);
      if (waiting.textKind === 'dialogue' || waiting.textKind === 'inner') {
        const name = element('div', 'nameplate', displayName(state.actId, waiting.speaker ?? ''));
        name.dataset.testid = 'speaker-name';
        box.append(name);
      }
      this.text = element('p', 'story-text');
      this.text.dataset.testid = 'story-text';
      this.hint = element('div', 'advance-hint');
      box.append(this.text, this.hint);
      this.content.append(box);
    } else if (waiting.kind === 'choice') {
      const panel = element('section', 'choice-panel');
      panel.append(element('h1', '', waiting.prompt));
      for (const option of waiting.options) {
        const optionButton = button('', `option-${option.index}`, activate({ type: 'choose', token, index: option.index }));
        optionButton.dataset.optionIndex = String(option.index);
        optionButton.disabled = !option.enabled;
        optionButton.append(element('span', '', option.text));
        if (!option.enabled) optionButton.append(element('span', 'unavailable', '暂未开放'));
        panel.append(optionButton);
      }
      this.content.append(panel);
    } else {
      const panel = element('section', 'interlude-panel');
      if (waiting.kind === 'battle') {
        panel.append(element('h1', '', '正在进入战斗'));
      } else if (waiting.kind === 'end') {
        const prologue = state.actId === 'prologue';
        panel.dataset.testid = 'act-end';
        panel.append(element('div', 'eyebrow', '次元战争'), element('h1', '', prologue ? '序幕结束' : '第一幕结束'),
          this.endNavigation ? button('返回地图', 'end-levels', this.endNavigation)
            : button(prologue ? '进入第一幕' : '重新开始', prologue ? 'enter-act1' : 'restart', activate({ type: prologue ? 'enter-act1' : 'restart', token })));
      } else {
        panel.append(element('h1', '', '剧情暂时无法继续'), element('p', '', waiting.message),
          this.endNavigation ? button('返回地图', 'error-levels', this.endNavigation)
            : button('重新开始', 'restart', activate({ type: 'restart', token })));
      }
      this.content.append(panel);
    }
  }
}
