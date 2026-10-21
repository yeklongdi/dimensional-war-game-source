import type { GameState } from '../state.js';
import type { BattleAction } from '../battle/actions.js';
import type { BattleState, Command } from '../battle/types.js';
import { actionReason } from '../battle/battle.js';
import { renderBoard } from '../battle/render.js';
import { battleToken, currentUnit } from '../battle/state-helpers.js';
import { canvasCell, occupies, same } from '../battle/grid.js';
import { formatEvent } from '../battle/format-log.js';
import { button, element } from './elements.js';
import { renderControls } from './battle-controls.js';
import { renderBattleDialog } from './battle-dialogs.js';
import { tutorialText } from '../battle/tutorial.js';
import { movementOverlay } from '../battle/movement-preview.js';
import { MovementControls, planningInput } from './movement-controls.js';

const statusLabels = { active: '可行动', unconscious: '昏迷·倒地·失能', stable: '稳定·失去战斗能力', dead: '死亡', defeated: '被击败' };
export class BattleView {
  readonly stage = element('main', 'stage battle-stage');
  private readonly heading = element('header', 'battle-header');
  private readonly roster = element('aside', 'battle-roster');
  private readonly board = element('div', 'battle-board');
  private readonly canvas = element('canvas');
  private readonly hitGrid = element('div', 'battle-hit-grid');
  private readonly controls = element('div', 'battle-actions');
  private readonly logPanel = element('aside', 'battle-log-panel');
  private readonly log = element('div', 'battle-log');
  private readonly footer = element('footer', 'battle-footer');
  private readonly modal = element('div', 'battle-modal');
  private readonly hint = element('p', 'battle-hint');
  private readonly tutorial = element('div', 'battle-tutorial');
  private readonly opening = element('div', 'battle-opening');
  private readonly resizeObserver: ResizeObserver;
  private readonly movement: MovementControls;
  private renderedBattle?: BattleState;
  private renderedMode = '';
  private renderedRun = -1;
  private focusIn?: (event: FocusEvent) => void;
  private focusOut?: (event: FocusEvent) => void;
  private tutorialKey = '';
  private openingKey = '';
  private logSession = -1;
  private logCount = 0;
  private readonly dispatch: (action: BattleAction) => void;

  constructor(root: HTMLElement, dispatch: (action: BattleAction) => void) {
    this.dispatch = dispatch;
    this.movement = new MovementControls(dispatch);
    this.stage.id = 'stage'; this.stage.dataset.testid = 'battle-stage'; this.stage.setAttribute('aria-label', '战棋调试场');
    this.canvas.setAttribute('aria-label', '7×5 战棋棋盘'); this.canvas.style.width = '672px'; this.canvas.style.height = '480px';
    this.board.dataset.testid = 'battle-board';
    this.tutorial.dataset.testid = 'battle-tutorial'; this.tutorial.hidden = true;
    this.opening.dataset.testid = 'sword-opening'; this.opening.hidden = true;
    for (let row = 0; row < 5; row++) for (let col = 0; col < 7; col++) {
      const hit = element('button', 'battle-cell'); hit.type = 'button'; hit.dataset.testid = `cell-${col}-${row}`;
      hit.dataset.col = String(col); hit.dataset.row = String(row); this.hitGrid.append(hit);
    }
    this.board.append(this.canvas, this.hitGrid, this.opening);
    this.board.addEventListener('focusin', event => this.focusIn?.(event));
    this.board.addEventListener('focusout', event => this.focusOut?.(event));
    this.log.tabIndex = 0; this.log.dataset.testid = 'battle-log';
    this.logPanel.append(element('h2', '', '战斗记录'), this.log);
    this.modal.dataset.testid = 'battle-modal'; this.modal.hidden = true;
    this.stage.append(this.heading, this.roster, this.board, this.controls, this.logPanel, this.footer, this.movement.root, this.tutorial, this.modal);
    root.append(this.stage);
    const resize = () => { this.stage.style.transform = `translate(-50%, -50%) scale(${Math.min(root.clientWidth / 1280, root.clientHeight / 720)})`; };
    this.resizeObserver = new ResizeObserver(resize); this.resizeObserver.observe(root); resize();
  }

  showHint(text: string) { if (!this.movement.root.hidden) this.movement.showHint(text); else this.hint.textContent = text; }
  dispose() { this.resizeObserver.disconnect(); this.stage.remove(); }

  render(game: GameState, fixture = false, fixtureDone = false) {
    const state = game.battle!; const actor = currentUnit(state), token = battleToken(state), mode = game.battleMode ?? 'idle';
    this.renderMovement(game);
    if (this.renderedBattle === state && this.renderedMode === mode && this.renderedRun === game.run) return;
    this.renderedBattle = state; this.renderedMode = mode; this.renderedRun = game.run;
    const formal = game.screen === 'battle';
    this.stage.setAttribute('aria-label', formal ? '战斗界面' : '战棋调试场');
    const send = (command: Command) => this.dispatch({ type: 'command', envelope: { token, origin: 'player', command } });
    const setMode = (next: typeof mode) => this.dispatch({ type: 'mode', token, mode: next });
    Object.assign(this.stage.dataset, { screen: game.screen, token, seed: String(state.seed), round: String(state.round), turnId: actor.id, turnTeam: actor.team,
      result: state.result?.reason ?? '', waiting: state.pendingRoll ? 'inspiration' : state.opening ? 'opening' : state.pendingReaction ? 'reaction' : state.pendingMove ? 'moving' : state.awaitingEnd ? 'incapacitated' : state.result ? 'result' : actor.team,
      mode, rngDraws: String(state.rng.draws), fixtureDone: String(fixtureDone) });
    this.stage.dataset.battleId = state.id;
    if (formal) Object.assign(this.stage.dataset, { actId: game.actId, sceneId: game.sceneId, returnNodeIndex: String(game.nodeIndex), storyWaitToken: game.waiting?.token ?? '' });
    const title = element('div', 'battle-title'); title.append(element('h1', '', formal ? state.title : fixture ? '内部测试 · 借机反应' : 'M2 · 战棋调试场'), element('p', '', formal ? `第 ${state.round} 轮${state.pendingRoll?.kind === 'initiative' ? ' · 先攻待确认' : ''}` : `${fixture ? '固定测试骰序' : `seed ${state.seed}`} · 骰子 ${state.rng.draws} 次 · 第 ${state.round} 轮`));
    const order = element('div', 'initiative-strip');
    for (const entry of state.order) {
      const unit = state.units.find(item => item.id === entry.actor)!;
      const card = element('div', `initiative-card${unit.id === actor.id ? ' current' : ''}`);
      card.dataset.testid = `initiative-${unit.id}`;
      card.append(element('strong', '', unit.name), element('span', '', `先攻 ${entry.total} · HP ${unit.hp}/${unit.maxHp}`)); order.append(card);
    }
    this.heading.replaceChildren(title, order);
    if (!formal) this.heading.append(button('重新开始', 'battle-restart', () => this.dispatch({ type: 'restart', token })));
    const resources = element('section', 'turn-resources');
    resources.append(element('h2', '', state.pendingRoll?.kind === 'initiative' ? '先攻等待确认' : `${actor.name}的回合`), element('p', '', `移动 ${actor.resources.movement}尺　动作 ${Number(actor.resources.action)}`),
      element('p', '', `附赠 ${Number(actor.resources.bonus)}　反应 ${Number(actor.resources.reaction)}`));
    if (state.inspiration) resources.append(element('p', '', `男高英雄激励 ${state.inspiration.hero ?? 0}点`));
    const cards = state.units.map(unit => {
      const card = element('div', 'unit-summary');
      Object.assign(card.dataset, { testid: `unit-${unit.id}`, hp: String(unit.hp), tempHp: String(unit.tempHp), status: unit.status, col: String(unit.position.col), row: String(unit.position.row), reaction: String(unit.resources.reaction), action: String(unit.resources.action), bonus: String(unit.resources.bonus), savesSuccess: String(unit.saves.successes), savesFailure: String(unit.saves.failures), primaryAttack: unit.attacks[0]!.id });
      card.append(element('strong', '', unit.name), element('p', '', `HP ${unit.hp}/${unit.maxHp} · 临时 ${unit.tempHp}`), element('p', '', `${statusLabels[unit.status]} · (${unit.position.col},${unit.position.row})`));
      if (unit.status === 'unconscious') card.append(element('p', '', `死亡豁免：成功 ${unit.saves.successes} / 失败 ${unit.saves.failures}`));
      if (formal && unit.team === 'player') card.append(element('p', '', `主手：${unit.attacks[0]!.name} ${unit.attacks[0]!.damage}`), element('p', '', '附赠：徒手 1d4+2'));
      return card;
    });
    this.roster.replaceChildren(resources, ...cards);
    for (const cell of Array.from(this.hitGrid.children)) {
      const col = Number((cell as HTMLElement).dataset.col), row = Number((cell as HTMLElement).dataset.row);
      const units = state.units.filter(unit => same(unit.position, { col, row }));
      cell.setAttribute('aria-label', `格 ${col},${row} ${state.grid.tiles[row * 7 + col]} ${units.map(unit => `${unit.name} HP${unit.hp} ${statusLabels[unit.status]}`).join(' ')}`);
    }
    this.board.onclick = event => {
      const rect = this.board.getBoundingClientRect();
      const targetRect = event.target instanceof HTMLElement ? event.target.getBoundingClientRect() : rect;
      const point = canvasCell(event.detail === 0 ? targetRect.left + targetRect.width / 2 : event.clientX, event.detail === 0 ? targetRect.top + targetRect.height / 2 : event.clientY, rect, state.grid);
      if (!point || event.detail > 1 || fixtureDone) return;
      if (mode === 'move') { const action = planningInput(game, 'add', point); if (action) this.dispatch(action); return; }
      if (mode === 'attack' || mode === 'bonus') {
        const target = state.units.find(unit => occupies(unit) && same(unit.position, point));
        if (!target) return this.showHint('此格没有可攻击目标');
        const attack = actor.attacks.find(item => mode === 'bonus' ? item.id === 'unarmed' : true)!;
        const command: Command = { kind: 'attack', actor: actor.id, target: target.id, attackId: attack.id, resource: mode === 'bonus' ? 'bonus' : 'action' };
        const reason = actionReason(state, command, 'player');
        if (reason) return this.showHint(reason);
        send(command);
      } else this.showHint('通过脚下的“移动／攻击／技能”选择操作');
    };
    this.board.onpointermove = event => {
      const point = canvasCell(event.clientX, event.clientY, this.board.getBoundingClientRect(), state.grid);
      const action = point && planningInput(game, 'hover', point); if (action) this.dispatch(action);
    };
    const leave = () => { const action = planningInput(game, 'leave'); if (action) this.dispatch(action); };
    this.board.onpointerleave = leave;
    this.focusIn = event => {
      if (!(event.target instanceof HTMLButtonElement)) return;
      const rect = event.target.getBoundingClientRect(), point = canvasCell(rect.left + rect.width / 2, rect.top + rect.height / 2, this.board.getBoundingClientRect(), state.grid);
      const action = point && planningInput(game, 'hover', point); if (action) this.dispatch(action);
    };
    this.focusOut = event => { if (!(event.relatedTarget instanceof Node) || !this.board.contains(event.relatedTarget)) leave(); };
    this.stage.onkeydown = event => {
      if (event.isComposing) return;
      if (event.repeat && ['Enter', ' '].includes(event.key)) { event.preventDefault(); return; }
      const operation = event.key === 'Backspace' ? 'undo' : event.key === 'Escape' ? 'cancel' : undefined;
      const action = operation && planningInput(game, operation);
      if (action) { event.preventDefault(); if (!event.repeat) this.dispatch(action); }
    };
    renderControls(this.controls, state, mode, setMode, send);
    if (fixtureDone) this.controls.hidden = true;
    this.renderLogs(game);
    this.renderPresentation(game);
    const label = state.pendingRoll ? '等待英雄激励决定，当前结果尚未生效' : state.opening ? '剑形灼痕共鸣' : state.pendingReaction ? '移动已暂停，等待你的借机选择' : state.pendingMove ? '正在逐格移动并检查借机攻击' : fixtureDone ? '测试完成：可检查移动终点、HP、反应与骰子明细；重新开始可测试另一选项。' : state.result ? formal ? '选择结算操作' : '本轮为独立调试场，结算不会进入剧情。' : actor.team === 'enemy' ? '敌人正在行动，普通玩家操作暂不可用' : mode === 'move' ? '点击蓝色格规划，再确认移动' : mode === 'attack' || mode === 'bonus' ? '点击红色提示的敌人' : '选择操作；技能中可结束回合';
    this.footer.replaceChildren(element('p', '', label), this.hint);
    this.hint.textContent = '';
    if (['attack', 'bonus'].includes(mode) && !state.pendingMove && !state.result) this.footer.append(button('取消选择', 'battle-cancel', () => setMode('idle')));
    renderBattleDialog(this.modal, game, send, this.dispatch);
  }

  private renderMovement(game: GameState) {
    const overlay = movementOverlay(game);
    renderBoard(this.canvas, game.battle!, game.battleMode ?? 'idle', overlay);
    this.movement.render(game, overlay); this.footer.hidden = !this.movement.root.hidden;
    Object.assign(this.stage.dataset, { routeKind: overlay?.kind ?? '', routePath: JSON.stringify(overlay?.path ?? []),
      routeWaypoints: JSON.stringify(overlay?.waypoints ?? []), routeRisks: JSON.stringify(overlay?.risks ?? []),
      selectedSteps: String(overlay?.selectedSteps ?? 0), remainingSteps: String(overlay?.remainingSteps ?? 0) });
    const reachable = new Set(overlay?.reachable.map(point => `${point.col},${point.row}`));
    for (const cell of Array.from(this.hitGrid.children)) {
      const node = cell as HTMLElement; node.dataset.reachable = String(reachable.has(`${node.dataset.col},${node.dataset.row}`));
    }
  }

  private renderPresentation(game: GameState) {
    const state = game.battle!, notice = state.tutorial?.notice;
    const hero = state.units.find(unit => unit.team === 'player')!;
    this.tutorial.style.left = `${Math.max(130, Math.min(900, 304 + hero.position.col * 96 + 48))}px`;
    this.tutorial.style.top = `${Math.max(100, 116 + hero.position.row * 96 - 46)}px`;
    const key = `${state.session}:${notice ?? ''}`;
    if (key !== this.tutorialKey) {
      this.tutorialKey = key; this.tutorial.replaceChildren(); this.tutorial.hidden = !notice;
      if (notice) this.tutorial.append(element('p', '', tutorialText[notice]));
    }
    this.opening.hidden = !state.opening;
    if (state.opening && this.openingKey !== String(state.session)) {
      this.openingKey = String(state.session);
      const canvas = element('canvas', 'sword-scar'); canvas.width = 672; canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.strokeStyle = '#f4d993'; ctx.lineWidth = 2; ctx.shadowBlur = 18; ctx.shadowColor = '#d8b45a'; ctx.beginPath(); ctx.moveTo(275, 340); ctx.lineTo(397, 140); ctx.stroke(); }
      this.opening.replaceChildren(canvas);
    }
  }

  private renderLogs(game: GameState) {
    const state = game.battle!;
    if (this.logSession !== state.session) { this.log.replaceChildren(); this.logSession = state.session; this.logCount = 0; }
    const follow = this.log.scrollHeight - this.log.scrollTop - this.log.clientHeight < 50;
    for (const event of state.log.slice(this.logCount)) {
      const line = element('p', `event-${event.kind}`, formatEvent(state, event));
      line.dataset.event = event.kind; line.dataset.seq = String(event.seq); this.log.append(line);
    }
    this.logCount = state.log.length;
    if (follow) this.log.scrollTop = this.log.scrollHeight;
  }
}
