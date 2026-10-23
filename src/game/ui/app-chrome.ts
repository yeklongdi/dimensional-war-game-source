import type { GameState } from '../state.js';
import type { SystemAction } from '../system-types.js';
import { paused, systemToken } from '../runtime.js';
import { snapshotLabel } from './system-view.js';
import { button, element } from './elements.js';

/** 保存反馈与系统入口；模态内容独立于逻辑画面，统一由SystemView负责。 */
export class AppChrome {
  private readonly root = element('aside', 'app-chrome');
  private key = '';
  private state?: GameState;
  private readonly dispatch: (action: SystemAction) => void;
  constructor(stage: HTMLElement, dispatch: (action: SystemAction) => void) {
    this.dispatch = dispatch;
    this.root.addEventListener('click', e => e.stopPropagation());
    this.root.addEventListener('keydown', e => e.stopPropagation());
    stage.append(this.root);
  }
  render(state: GameState) {
    this.state = state;
    const p = state.progress!, s = state.system!;
    Object.assign(this.root.parentElement!.dataset, { saveStatus: p.status, saveJson: p.checkpoint ? JSON.stringify(p.checkpoint) : '',
      saveRequest: String(p.request), session: String(state.run), bgmId: state.bgmId,
      activeRunId: s.activeRunId, paused: String(paused(state)), settingsJson: JSON.stringify(state.settings),
      vaultJson: s.read.kind === 'valid' ? JSON.stringify(s.read.data) : '', vaultStatus: s.read.kind });
    const key = JSON.stringify([state.screen, state.run, p.status, p.message, p.checkpoint, s.message]);
    if (key === this.key) return;
    this.key = key; this.root.replaceChildren();
    if (state.screen !== 'menu') this.root.append(button('系统菜单', 'open-system', () => this.dispatch({ type: 'system', intent: 'open', token: systemToken(this.state!) })));
    const feedback = element('div', `save-feedback${['story', 'battle'].includes(state.screen) ? ' in-game' : ''}`);
    feedback.dataset.testid = 'save-feedback';
    const message = s.message || p.message;
    if (message) feedback.append(element('p', 'save-warning', message));
    else if (p.status === 'saving') feedback.append(element('p', '', '正在保存…'));
    else if (p.checkpoint) {
      const summary = element('p', '', `自动档：${snapshotLabel(p.checkpoint)} · ${new Date(p.checkpoint.savedAt).toLocaleString('zh-CN')}`);
      summary.dataset.testid = 'save-summary'; feedback.append(summary);
    } else feedback.append(element('p', '', '尚无自动档 · 手动档与设置独立保留'));
    if (message && (s.read.kind === 'migration' || s.read.kind === 'unavailable')) feedback.append(button('重试读取／升级', 'retry-storage', () => this.dispatch({ type: 'system', intent: 'reload', token: systemToken(this.state!) })));
    this.root.append(feedback);
  }
}
