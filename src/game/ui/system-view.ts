import type { GameState } from '../state.js';
import type { GameAction } from '../runtime.js';
import { paused, systemToken } from '../runtime.js';
import { defaults, textSpeeds } from '../settings.js';
import { readSlot, slotValue } from '../save-v3.js';
import { storyLibrary } from '../story/library.js';
import { displaySceneTitle } from '../story/chapter-policy.js';
import { currentLevel, levelById, levels } from '../../content/levels.js';
import type { SaveV2 } from '../save-v2.js';
import { button, element } from './elements.js';

export function snapshotLabel(data: SaveV2): string {
  const point = data.checkpoint;
  if (point.kind === 'map') return `太阳市地图 · ${currentLevel(data.completedLevelIds)?.name ?? '垂直切片已完成'}`;
  const level = levelById(point.levelId)!;
  return `${level.name} · ${displaySceneTitle(storyLibrary[level.actId]!.scenes.find(s => s.id === point.sceneId)!.title)}`;
}
export class SystemView {
  private readonly layer = element('div', 'system-layer');
  private readonly dialog = element('section', 'system-dialog');
  private readonly content = element('div', 'system-content');
  private readonly notice = element('p', 'system-notice');
  private readonly root: HTMLElement;
  private readonly dispatch: (action: GameAction) => void;
  private state?: GameState;
  private key = '';
  private showing = false;
  private priorFocus?: HTMLElement;
  private priorTestId?: string;
  constructor(root: HTMLElement, dispatch: (action: GameAction) => void) {
    this.root = root; this.dispatch = dispatch; this.layer.hidden = true;
    this.layer.dataset.testid = 'system-layer'; this.dialog.dataset.testid = 'system-dialog';
    this.dialog.setAttribute('role', 'dialog'); this.dialog.setAttribute('aria-modal', 'true'); this.dialog.tabIndex = -1;
    this.dialog.setAttribute('aria-labelledby', 'system-dialog-title');
    this.dialog.append(this.content, this.notice); this.layer.append(this.dialog); root.append(this.layer);
    this.layer.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('keydown', this.keydown, true);
  }
  private act(intent: Parameters<SystemView['dispatchIntent']>[0], slot?: number) { return () => this.dispatchIntent(intent, slot); }
  private dispatchIntent(intent: import('../system-types.js').SystemIntent, slot?: number) {
    if (this.state) this.dispatch({ type: 'system', intent, slot, token: systemToken(this.state) });
  }
  private keydown = (event: KeyboardEvent) => {
    if (!this.showing) return;
    if (event.repeat && ['Enter', ' ', 'Escape'].includes(event.key)) { event.preventDefault(); event.stopImmediatePropagation(); return; }
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); this.dispatchIntent('back'); return; }
    if (event.key === 'Tab') {
      const items = Array.from(this.dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled)')).filter(e => !e.hidden && e.getClientRects().length);
      const index = items.indexOf(document.activeElement as HTMLElement);
      if (!items.length) { event.preventDefault(); return; }
      if ((event.shiftKey && index <= 0) || (!event.shiftKey && (index === -1 || index === items.length - 1))) {
        event.preventDefault(); items[event.shiftKey ? items.length - 1 : 0]!.focus();
      }
    }
    // 不阻止面板控件自己的默认键盘行为；底层已inert，规则层另行拒绝。
  };
  render(state: GameState) {
    this.state = state;
    const s = state.system!, visible = paused(state);
    for (const child of Array.from(this.root.children)) if (child instanceof HTMLElement && child !== this.layer && child.tagName !== 'AUDIO') child.inert = visible;
    if (visible && !this.showing) {
      this.priorFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
      this.priorTestId = this.priorFocus?.dataset.testid;
    }
    this.layer.hidden = !visible;
    if (!visible) {
      if (this.showing) {
        if (this.priorFocus?.isConnected && !this.priorFocus.closest('[inert]')) this.priorFocus.focus();
        else ((this.priorTestId ? this.root.querySelector<HTMLElement>(`[data-testid="${CSS.escape(this.priorTestId)}"]`) : undefined)
          ?? this.root.querySelector<HTMLElement>('#stage button, #stage'))?.focus();
      }
      this.showing = false; this.key = ''; return;
    }
    this.showing = true;
    const key = `${s.stale}:${s.panel}:${s.uiRevision}:${s.panel === 'load' || s.panel === 'save' ? JSON.stringify(s.read) : ''}`;
    if (key !== this.key) {
      this.key = key; this.content.replaceChildren();
      if (s.stale) this.content.append(element('h1', '', '进度已在其他窗口切换'), element('p', '', '当前窗口已暂停推进与保存。重新载入当前活动检查点后继续。'),
        button('重新载入当前进度', 'system-reload', this.act('reload')));
      else if (!s.panel) this.content.append(element('h1', '', '正在升级旧档…'));
      else if (s.panel === 'system') {
        this.content.append(element('h1', '', '系统菜单'));
        for (const [title, intent] of [['存档', 'save'], ['读取', 'load'], ['设置', 'settings'], ['返回游戏', 'back'], ['返回地图', 'go-map'], ['返回主菜单', 'go-menu']] as const)
          this.content.append(button(title, `system-${intent}`, this.act(intent)));
      } else if (s.panel === 'settings') this.buildSettings();
      else if (s.panel === 'confirm') {
        const c = s.confirmation!;
        const title = c.kind === 'new' ? '开始新游戏？' : c.kind === 'load' ? `读取${c.slot === 0 ? '自动档' : `手动槽${c.slot}`}？` : `覆盖手动槽${c.slot}？`;
        const description = c.kind === 'new' ? c.replaceRaw !== undefined
          ? '新版记录无法完整读取。确认后建立新的v4活动进度；当前损坏的v4容器将被替换，旧版v1／v2／v3原件与设置保留。'
          : s.read.kind === 'empty' && s.read.legacy?.length ? '新版剧情需要重新开始。旧版存档原件与设置保留，不迁移或覆盖旧进度。'
            : '当前新版自动进度将被新游戏替换，新版手动存档、旧版原件和设置保留。'
          : c.kind === 'load' ? '将用该档替换当前自动进度，恢复该档自己的关卡与事件记录；原手动槽不会改动。'
            : '仅覆盖这个槽位。若其他窗口更新了目标，将要求重新确认。';
        this.content.append(element('h1', '', title), element('p', '', description), element('p', 'snapshot-preview', snapshotLabel(c.snapshot)),
          button(s.pending ? '正在写入…' : '确认', 'system-confirm', this.act('confirm')),
          button('取消', 'system-cancel', this.act('cancel')));
        this.content.querySelector<HTMLButtonElement>('[data-testid="system-confirm"]')!.disabled = !!s.pending;
      } else this.buildSlots(s.panel === 'save');
      if (s.panel && s.panel !== 'confirm' && s.panel !== 'system' && !s.stale) this.content.append(button('返回', 'system-back', this.act('back')));
      const title = this.content.querySelector('h1'); if (title) title.id = 'system-dialog-title';
      (this.content.querySelector<HTMLElement>('button:not(:disabled),input,select') ?? this.dialog).focus();
    }
    if (s.panel === 'settings') this.syncSettings();
    this.dialog.setAttribute('aria-busy', String(!!s.pending)); this.dialog.dataset.panel = s.stale ? 'stale' : s.panel ?? 'busy';
    this.notice.textContent = [s.message, s.panel === 'settings' ? s.settingsMessage : ''].filter(Boolean).join('\n');
  }
  private buildSlots(saving: boolean) {
    const s = this.state!.system!;
    this.content.append(element('h1', '', saving ? '手动存档' : '读取进度'),
      element('p', 'save-granularity', '读取后从当前场景开头继续；战斗会重新开始。'));
    const grid = element('div', 'save-slot-grid');
    for (let slot = saving ? 1 : 0; slot <= 6; slot++) {
      const item = s.read.kind === 'valid' ? readSlot(slotValue(s.read.data, slot), storyLibrary, s.read.data.revision) : { kind: 'empty' as const };
      const label = slot === 0 ? '自动档' : `手动槽${slot}`;
      const b = button('', `slot-${slot}`, this.act(saving ? 'pick-save' : 'pick-load', slot));
      b.classList.add('save-slot'); if (slot === 0) b.classList.add('auto-slot');
      b.append(element('strong', '', label));
      if (item.kind === 'valid') b.append(element('span', '', snapshotLabel(item.record.data)), element('small', '', `${item.record.data.completedLevelIds.length}/${levels.length} 已完成 · ${new Date(item.record.data.savedAt).toLocaleString('zh-CN')}`));
      else b.append(element('span', '', item.kind === 'empty' ? '空槽' : '损坏 · 不可读取'));
      b.disabled = !!s.pending || s.read.kind !== 'valid' || (!saving && item.kind !== 'valid');
      b.setAttribute('aria-label', `${label}，${item.kind === 'valid' ? snapshotLabel(item.record.data) : item.kind === 'empty' ? '空槽' : '损坏'}`);
      grid.append(b);
    }
    this.content.append(grid);
    if (!saving && s.read.legacy?.length) {
      const archive = element('section', 'legacy-archives'); archive.dataset.testid = 'legacy-archives';
      archive.append(element('h2', '', '旧版本存档 · 只读保留'));
      for (const item of s.read.legacy) archive.append(element('p', '', `${item.key}：${item.message}`));
      this.content.append(archive);
    }
    if (s.read.kind === 'invalid' || s.read.kind === 'unavailable') this.content.append(element('p', 'save-warning', s.read.message));
  }
  private buildSettings() {
    this.content.append(element('h1', '', '设置'));
    for (const [key, title] of [['bgm', 'BGM音量'], ['sfx', '音效音量']] as const) {
      const label = element('label', 'setting-row', title), input = element('input');
      input.type = 'range'; input.min = '0'; input.max = '100'; input.step = '1'; input.dataset.testid = `setting-${key}`; input.setAttribute('aria-label', title);
      const value = element('output'); value.dataset.settingValue = key;
      input.addEventListener('input', () => this.dispatch({ type: 'settings-change', data: { ...this.state!.settings!, [key]: Number(input.value) } }));
      label.append(input, value); this.content.append(label);
    }
    const label = element('label', 'setting-row', '文字速度'), select = element('select');
    select.dataset.testid = 'setting-text'; select.setAttribute('aria-label', '文字速度');
    for (const [index, ms] of textSpeeds.entries()) { const option = element('option', '', `${['很慢', '慢', '标准', '快', '很快'][index]} · ${ms}毫秒／字`); option.value = String(ms); select.append(option); }
    select.addEventListener('change', () => this.dispatch({ type: 'settings-change', data: { ...this.state!.settings!, textMs: Number(select.value) } }));
    label.append(select); this.content.append(label, button('恢复默认设置', 'settings-defaults', () => this.dispatch({ type: 'settings-change', data: { ...defaults } })));
  }
  private syncSettings() {
    for (const key of ['bgm', 'sfx'] as const) {
      this.content.querySelector<HTMLInputElement>(`[data-testid="setting-${key}"]`)!.value = String(this.state!.settings![key]);
      this.content.querySelector<HTMLOutputElement>(`[data-setting-value="${key}"]`)!.textContent = `${this.state!.settings![key]}%`;
    }
    this.content.querySelector<HTMLSelectElement>('[data-testid="setting-text"]')!.value = String(this.state!.settings!.textMs);
  }
  dispose() { document.removeEventListener('keydown', this.keydown, true); this.layer.remove(); for (const e of Array.from(this.root.children)) if (e instanceof HTMLElement) e.inert = false; }
}
