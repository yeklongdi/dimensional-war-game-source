import type { BattleMode, BattleState, Command, Point } from '../battle/types.js';
import { battleToken, currentUnit } from '../battle/state-helpers.js';
import { actionIcon } from './battle-action-icons.js';
import { abilityChoices, abilityEntries, actionCategories, actionPage, canUseActionBar, choiceAt, commonEntries } from './battle-action-model.js';
import type { AbilityChoice, ActionCategory, ActionEntry } from './battle-action-model.js';
import { renderAbilityPanel } from './battle-abilities.js';
import type { AbilitySelection } from './battle-abilities.js';
import { button, element } from './elements.js';
import '../../styles/battle-actions.css';

/** 分类、分页与未提交的目标只属于当前视图；每次战斗版本变化后清理。 */
export class BattleControls {
  readonly root = element('section', 'battle-actions');
  readonly details = element('section', 'battle-ability-panel');
  readonly tooltip = element('div', 'battle-action-tooltip');
  private state?: BattleState;
  private mode: BattleMode = 'idle';
  private token = '';
  private run = -1;
  private category: ActionCategory = 'all';
  private page = 0;
  private query = '';
  private selected?: ActionEntry;
  private choices: AbilityChoice[] = [];
  private selection: AbilitySelection = { damage: 'fire' };
  private entries: ActionEntry[] = [];
  private setMode: (mode: BattleMode) => void = () => {};
  private send: (command: Command) => void = () => {};
  private targets: (choices: readonly AbilityChoice[], selected?: AbilityChoice) => void;

  constructor(targets: (choices: readonly AbilityChoice[], selected?: AbilityChoice) => void) {
    this.targets = targets;
    this.root.dataset.testid = 'battle-actionbar'; this.root.setAttribute('aria-label', '战斗操作栏');
    this.details.dataset.testid = 'battle-ability-panel'; this.details.setAttribute('aria-label', '技能详情与目标');
    this.tooltip.id = 'battle-action-tooltip'; this.tooltip.setAttribute('role', 'tooltip');
    this.details.hidden = true; this.tooltip.hidden = true;
  }

  render(state: BattleState, mode: BattleMode, run: number, setMode: (mode: BattleMode) => void, send: (command: Command) => void) {
    const changed = this.token !== battleToken(state) || this.run !== run;
    const actorChanged = this.state && currentUnit(this.state).id !== currentUnit(state).id;
    if (changed || mode !== 'abilities') this.clearSelection();
    if (actorChanged || this.run !== run) { this.category = 'all'; this.page = 0; this.query = ''; }
    this.token = battleToken(state); this.run = run;
    this.state = state; this.mode = mode; this.setMode = setMode; this.send = send;
    this.entries = [...commonEntries(state).slice(2), ...abilityEntries(state)];
    this.root.hidden = !canUseActionBar(state) || mode === 'move';
    if (this.root.hidden) { this.clearSelection(); return; }
    this.draw();
  }

  choosePoint(point: Point) {
    if (!this.selected || this.mode !== 'abilities') return false;
    const choice = choiceAt(this.choices, point);
    if (choice) this.pick(choice);
    return Boolean(choice);
  }

  cancel() {
    this.clearSelection(); this.setMode('idle');
  }

  private clearSelection() {
    this.selected = undefined; this.choices = []; this.selection = { damage: 'fire' };
    this.details.hidden = true; this.tooltip.hidden = true; this.targets([]);
  }

  private activate(entry: ActionEntry) {
    this.tooltip.hidden = true;
    if (entry.ability) {
      this.selected = entry; this.choices = abilityChoices(this.state!, entry.ability);
      this.selection = { damage: 'fire', choice: this.choices.find(choice => !choice.command.target && !choice.command.point) };
      this.mode = 'abilities'; this.setMode('abilities'); this.draw();
    } else if (!entry.reason) {
      this.clearSelection();
      if (entry.mode) this.setMode(entry.mode === this.mode ? 'idle' : entry.mode);
      else if (entry.command) this.send(entry.command);
    }
  }

  private tile(entry: ActionEntry, large = false) {
    const id = entry.mode === 'attack' || entry.mode === 'move' ? 'mode-' + entry.mode : entry.ability ? 'ability-' + entry.id : 'skill-' + entry.id;
    const node = button('', id, () => this.activate(entry));
    node.className = 'battle-action-tile' + (large ? ' battle-action-primary' : '');
    node.dataset.tone = entry.tone; node.dataset.category = entry.category;
    node.setAttribute('aria-label', entry.name + '；' + entry.cost + (entry.reason ? '；不可用：' + entry.reason : ''));
    node.dataset.unavailable = String(Boolean(entry.reason));
    if (!entry.ability) node.setAttribute('aria-disabled', String(Boolean(entry.reason)));
    node.setAttribute('aria-pressed', String(this.selected?.id === entry.id || Boolean(entry.mode && entry.mode === this.mode)));
    if (entry.ability) node.setAttribute('aria-controls', 'battle-ability-details');
    node.append(actionIcon(entry.icon), element('span', 'battle-action-name', entry.shortName ?? entry.name));
    if (entry.badge) node.append(element('span', 'battle-action-badge', entry.badge));
    const show = () => {
      if (this.selected?.id === entry.id) return;
      const rect = node.getBoundingClientRect(), stage = this.root.parentElement!.getBoundingClientRect();
      const scale = stage.width / 1280;
      this.tooltip.style.left = `${Math.max(16, Math.min(650, (rect.left - stage.left) / scale))}px`;
      this.tooltip.replaceChildren(element('strong', '', entry.name), element('p', 'ability-detail-cost', entry.cost),
        element('p', '', entry.description));
      if (entry.budget) this.tooltip.append(element('p', '', '剩余：' + entry.budget));
      if (entry.reason) this.tooltip.append(element('p', 'ability-unavailable', entry.reason));
      this.tooltip.hidden = false; node.setAttribute('aria-describedby', this.tooltip.id);
    };
    const hide = () => { this.tooltip.hidden = true; node.removeAttribute('aria-describedby'); };
    node.onpointerenter = show; node.onpointerleave = hide; node.onfocus = show; node.onblur = hide;
    return node;
  }

  private draw() {
    const state = this.state!, actor = currentUnit(state);
    const focus = this.root.contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset.testid : undefined;
    this.tooltip.hidden = true;
    const identity = element('div', 'battle-action-actor');
    const hp = element('div', 'battle-action-hp'); hp.setAttribute('aria-label', `生命值 ${actor.hp}/${actor.maxHp}`);
    const fill = element('span'); fill.style.width = `${100 * actor.hp / actor.maxHp}%`; hp.append(fill);
    identity.append(element('strong', '', actor.name), element('span', 'battle-action-hp-text', `HP ${actor.hp}/${actor.maxHp}`), hp);
    const resources = element('div', 'battle-action-resources');
    for (const [key, label] of [['action', '动作'], ['bonus', '附赠'], ['reaction', '反应']] as const) {
      const resource = element('span', actor.resources[key] ? 'available' : '', label);
      resource.setAttribute('aria-label', label + (actor.resources[key] ? '可用' : '已用完')); resources.append(resource);
    }
    identity.append(resources, button('结束回合', 'skill-end', () => this.send({ kind: 'end', actor: actor.id })));
    const primary = element('div', 'battle-action-quick');
    primary.append(element('span', 'battle-action-group-label', '常用动作'));
    const quick = element('div', 'battle-action-quick-grid');
    for (const entry of commonEntries(state).slice(0, 2)) quick.append(this.tile(entry, true));
    primary.append(quick);
    const library = element('div', 'battle-action-library'), toolbar = element('div', 'battle-action-toolbar');
    const filters = element('div', 'battle-action-filters'); filters.setAttribute('role', 'group'); filters.setAttribute('aria-label', '技能分类');
    for (const category of actionCategories) {
      const count = this.entries.filter(entry => category.id === 'all' || entry.category === category.id).length;
      const tab = button(category.label, 'action-category-' + category.id, () => {
        this.category = category.id; this.page = 0; this.query = ''; this.clearSelection(); this.mode = 'idle'; this.setMode('idle'); this.draw();
        this.root.querySelector<HTMLButtonElement>(`[data-testid="action-category-${category.id}"]`)?.focus();
      });
      tab.setAttribute('aria-pressed', String(this.category === category.id)); tab.disabled = !count;
      tab.append(element('span', '', String(count))); filters.append(tab);
    }
    const search = element('input', 'battle-action-search'); search.type = 'search'; search.placeholder = '搜索名称';
    search.setAttribute('aria-label', '搜索技能与法术'); search.value = this.query;
    const updateSearch = () => {
      const start = search.selectionStart, end = search.selectionEnd;
      this.query = search.value; this.page = 0; this.clearSelection(); this.mode = 'idle'; this.setMode('idle'); this.draw();
      const replacement = this.root.querySelector<HTMLInputElement>('input'); replacement?.focus();
      if (start !== null && end !== null) replacement?.setSelectionRange(start, end);
    };
    search.addEventListener('input', event => {
      if (!(event instanceof InputEvent) || !event.isComposing) updateSearch();
    });
    search.addEventListener('compositionend', updateSearch);
    const page = actionPage(this.entries, this.category, this.page, this.query); this.page = page.page;
    const pager = element('div', 'battle-action-pager');
    const back = button('‹', 'action-page-previous', () => { this.page--; this.draw(); });
    const next = button('›', 'action-page-next', () => { this.page++; this.draw(); });
    back.setAttribute('aria-label', '上一页技能'); next.setAttribute('aria-label', '下一页技能');
    back.disabled = page.page === 0; next.disabled = page.page === page.pages - 1;
    pager.append(back, element('span', '', `${page.page + 1}/${page.pages}`), next);
    toolbar.append(filters, search, pager);
    const slots = element('div', 'battle-action-slots'); slots.dataset.testid = 'battle-action-slots';
    for (const entry of page.entries) slots.append(this.tile(entry));
    if (!page.total) slots.append(element('p', 'battle-action-empty', '没有匹配的技能或法术'));
    library.append(toolbar, slots); this.root.replaceChildren(identity, primary, library);
    this.drawDetails();
    if (focus) this.root.querySelector<HTMLButtonElement>(`[data-testid="${focus}"]`)?.focus({ preventScroll: true });
  }

  private pick(choice: AbilityChoice) {
    this.selection.choice = choice; this.drawDetails();
  }

  private drawDetails() {
    const focus = this.details.contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset.testid : undefined;
    this.details.id = 'battle-ability-details';
    renderAbilityPanel(this.details, this.selected, this.choices, this.selection, choice => this.pick(choice),
      type => { this.selection.damage = type; this.drawDetails(); }, () => {
        const command = this.selection.choice?.command;
        if (command && !this.selected?.reason) this.send(command.ability === 'sorcerous_burst' ? { ...command, burstDamage: this.selection.damage } : command);
      }, () => this.cancel());
    this.targets(this.choices, this.selection.choice);
    if (focus) this.details.querySelector<HTMLButtonElement>(`[data-testid="${focus}"]`)?.focus({ preventScroll: true });
  }
}
