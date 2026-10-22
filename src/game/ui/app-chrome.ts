import type { GameState } from '../state.js';
import { storyLibrary } from '../story/library.js';
import { navigationToken } from '../router.js';
import type { NavigationAction } from '../router.js';
import { button, element } from './elements.js';
import { currentLevel, levelById } from '../../content/levels.js';

/** 导航及保存反馈不会触发剧情点击；所有异步结果仍由统一 reducer 接收。 */
export class AppChrome {
  private readonly root = element('aside', 'app-chrome');
  private key = '';
  private readonly dispatch: (action: NavigationAction) => void;
  constructor(stage: HTMLElement, dispatch: (action: NavigationAction) => void) {
    this.dispatch = dispatch;
    this.root.addEventListener('click', event => event.stopPropagation());
    this.root.addEventListener('keydown', event => event.stopPropagation());
    stage.append(this.root);
  }
  render(state: GameState) {
    const p = state.progress!, token = navigationToken(state);
    const key = JSON.stringify([token, p.status, p.message, p.checkpoint, p.confirming]);
    Object.assign(this.root.parentElement!.dataset, { saveStatus: p.status, saveJson: p.checkpoint ? JSON.stringify(p.checkpoint) : '',
      saveRequest: String(p.request), session: String(state.run), navToken: token, bgmId: state.bgmId });
    if (key === this.key) return;
    this.key = key; this.root.replaceChildren();
    const playing = state.screen === 'story' || state.screen === 'battle';
    if (playing) this.root.append(button('返回地图', 'return-map', () => this.dispatch({ type: 'open-map', token })),
      button('返回主菜单', 'return-menu', () => this.dispatch({ type: 'main-menu', token })));
    const feedback = element('div', `save-feedback${playing ? ' in-game' : ''}`);
    feedback.dataset.testid = 'save-feedback';
    if (p.message) feedback.append(element('p', 'save-warning', p.message));
    else if (p.status === 'saving' || p.status === 'migrating') feedback.append(element('p', '', p.status === 'migrating' ? '正在迁移…' : '正在保存…'));
    else if (p.checkpoint) {
      const point = p.checkpoint.checkpoint, level = point.kind === 'level' ? levelById(point.levelId)! : undefined;
      const title = point.kind === 'level' && level ? `${level.name} · ${storyLibrary[level.actId]!.scenes.find(scene => scene.id === point.sceneId)!.title}`
        : `Sample map · ${currentLevel(p.completedLevelIds)?.name ?? 'Demo complete'}`;
      const summary = element('p', '', `最近存档：${title} · ${new Date(p.checkpoint.savedAt).toLocaleString('zh-CN')}`);
      summary.dataset.testid = 'save-summary'; feedback.append(summary);
    } else if (!playing) feedback.append(element('p', '', '尚无存档 · 开始游戏后自动保存'));
    if (p.status === 'blocked') feedback.append(button('放弃旧档，重新保存', 'replace-save', () => this.dispatch({ type: 'ask-replace', token })));
    this.root.append(feedback);
    if (p.confirming) {
      const mask = element('div', 'save-confirm-mask');
      const dialog = element('section', 'save-confirm'); dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true');
      dialog.append(element('h2', '', '放弃无法读取的进度并保存？'), element('p', '', '确认后将本次进度保存为 v2。损坏的 v2 会被替换；v1 原始字符串始终保留。尚未游玩时保存初始地图。'),
        button('确认放弃旧档并保存', 'confirm-replace-save', () => this.dispatch({ type: 'confirm-replace', token })),
        button('保留旧档', 'cancel-replace-save', () => this.dispatch({ type: 'cancel-replace', token })));
      mask.append(dialog); this.root.append(mask);
    }
  }
}
