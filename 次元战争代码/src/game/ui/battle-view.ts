import type { GameState } from '../state.js';
import type { BattleAction } from '../battle/actions.js';
import { battleMapMedia } from '../battle/map-assets.js';
import type { BattleMapId, BattleState, Command, Point } from '../battle/types.js';
import { actionReason, playerAttack } from '../battle/battle.js';
import { renderBoard } from '../battle/render.js';
import { battleToken, currentUnit } from '../battle/state-helpers.js';
import { canvasCell, occupies, same } from '../battle/grid.js';
import { formatEvent } from '../battle/format-log.js';
import { button, element } from './elements.js';
import { BattleControls } from './battle-controls.js';
import { canUseActionBar } from './battle-action-model.js';
import type { AbilityChoice } from './battle-action-model.js';
import { renderBattleDialog } from './battle-dialogs.js';
import { tutorialText } from '../battle/tutorial.js';
import { movementOverlay } from '../battle/movement-preview.js';
import type { MovementOverlay } from '../battle/movement-preview.js';
import { MovementControls, planningInput } from './movement-controls.js';
import { chapterTitles } from '../story/chapter-policy.js';
import { BattleFx } from './battle-fx.js';
import { BattleChoreography } from './battle-choreography.js';
import type { ChessAssetUrls } from '../battle/chess-assets.js';

export type BattleViewOptions = { chess?: boolean; title?: string; assets?: ChessAssetUrls; onPresentationIdle?: () => void };

const VIEW_W = 672;
const VIEW_H = 480;
const OVERLAY_TOP_PAD = 84;
const statusLabels = { active: '可行动', unconscious: '昏迷·倒地·失能', stable: '稳定·失去战斗能力', dead: '死亡', defeated: '被击败' };

export class BattleView {
  readonly stage = element('main', 'stage battle-stage');
  private readonly root: HTMLElement;
  private readonly heading = element('header', 'battle-header');
  private readonly roster = element('aside', 'battle-roster');
  private readonly board = element('div', 'battle-board');
  private readonly viewport = element('div', 'battle-viewport');
  private readonly world = element('div', 'battle-world');
  private readonly mapPoster = element('img', 'battle-map-poster');
  private readonly mapVideo = element('video', 'battle-map-video');
  private readonly overlayViewport = element('div', 'battle-overlay-viewport');
  private readonly overlayWorld = element('div', 'battle-overlay-world');
  private readonly cameraBar = element('div', 'battle-camera-bar');
  private readonly canvas = element('canvas');
  private readonly fxLayer = element('canvas', 'battle-fx');
  private readonly hitGrid = element('div', 'battle-hit-grid');
  private readonly controls: BattleControls;
  private readonly logPanel = element('aside', 'battle-log-panel');
  private readonly log = element('div', 'battle-log');
  private readonly footer = element('footer', 'battle-footer');
  private readonly modal = element('div', 'battle-modal');
  private readonly hint = element('p', 'battle-hint');
  private readonly tutorial = element('div', 'battle-tutorial');
  private readonly opening = element('div', 'battle-opening');
  private readonly resizeObserver: ResizeObserver;
  private readonly movement: MovementControls;
  private readonly fx: BattleFx;
  private readonly choreography?: BattleChoreography;
  private readonly options: BattleViewOptions;
  private renderedBattle?: BattleState;
  private renderedMode = '';
  private renderedRun = -1;
  private focusIn?: (event: FocusEvent) => void;
  private focusOut?: (event: FocusEvent) => void;
  private tutorialKey = '';
  private openingKey = '';
  private logSession = -1;
  private logCount = 0;
  private cameraSession = Number.NaN;
  private cameraTurnId = '';
  private activeMapAsset?: BattleMapId;
  private gridKey = '';
  private boardW = VIEW_W;
  private boardH = VIEW_H;
  private panX = 0;
  private panY = 0;
  private drag?: { id: number; startX: number; startY: number; startPanX: number; startPanY: number; moved: boolean };
  private suppressBoardClickUntil = 0;
  private paintGame?: GameState;
  private paintOverlay?: MovementOverlay;
  private lastFixture = false;
  private lastFixtureDone = false;
  private readonly dispatch: (action: BattleAction) => void;
  private readonly load?: () => void;

  constructor(root: HTMLElement, dispatch: (action: BattleAction) => void, load?: () => void, sfx?: (id: string) => void, options: BattleViewOptions = {}) {
    this.root = root;
    this.options = options;
    this.dispatch = action => {
      if (this.isPerforming && action.type !== 'restart') { this.showHint('请等当前演出结束，可使用右上方按钮加速'); return; }
      dispatch(action);
    };
    this.load = load;
    this.controls = new BattleControls((choices, selected) => this.renderAbilityTargets(choices, selected));
    this.movement = new MovementControls(this.dispatch);
    this.stage.id = 'stage'; this.stage.dataset.testid = 'battle-stage'; this.stage.setAttribute('aria-label', '战棋调试场');
    this.canvas.setAttribute('aria-label', '7×5 战棋棋盘'); this.canvas.style.width = `${VIEW_W}px`; this.canvas.style.height = `${VIEW_H}px`;
    this.board.dataset.testid = 'battle-board';
    this.tutorial.dataset.testid = 'battle-tutorial'; this.tutorial.hidden = true;
    this.opening.dataset.testid = 'sword-opening'; this.opening.hidden = true;

    this.mapPoster.hidden = true; this.mapPoster.alt = ''; this.mapPoster.decoding = 'async';
    this.mapVideo.hidden = true; this.mapVideo.muted = true; this.mapVideo.loop = true; this.mapVideo.autoplay = true; this.mapVideo.playsInline = true;
    this.world.append(this.mapPoster, this.mapVideo, this.canvas, this.hitGrid);
    this.viewport.append(this.world);
    this.overlayViewport.append(this.overlayWorld);

    const recenter = button('居中', 'camera-recenter', () => this.recenterCamera());
    recenter.setAttribute('aria-label', '将视角重新居中到当前行动单位');
    this.cameraBar.append(element('span', 'battle-camera-tip', '拖动地图查看四周'), recenter);
    this.cameraBar.hidden = true;

    this.fxLayer.width = VIEW_W; this.fxLayer.height = VIEW_H;
    this.fxLayer.dataset.logicalWidth = String(VIEW_W);
    this.fxLayer.setAttribute('aria-hidden', 'true');
    if (options.chess) {
      this.stage.dataset.chess = 'true';
      this.overlayWorld.append(this.fxLayer);
      this.choreography = new BattleChoreography(this.stage, this.overlayWorld, this.fxLayer, this.canvas, sfx ?? (() => {}), () => this.paintBoard(), () => {
        this.renderedBattle = undefined;
        if (this.paintGame) this.render(this.paintGame, this.lastFixture, this.lastFixtureDone);
        options.onPresentationIdle?.();
      }, options.assets);
      this.fx = this.choreography.fx;
    } else {
      this.world.append(this.fxLayer);
      this.fx = new BattleFx(this.fxLayer, this.canvas, sfx ?? (() => {}), () => this.paintBoard());
    }

    this.board.append(this.viewport, this.overlayViewport, this.cameraBar, this.opening);
    this.rebuildGrid(7, 5);
    this.bindCameraEvents();

    this.board.addEventListener('focusin', event => this.focusIn?.(event));
    this.board.addEventListener('focusout', event => this.focusOut?.(event));
    this.log.tabIndex = 0; this.log.dataset.testid = 'battle-log';
    this.logPanel.append(element('h2', '', '战斗记录'), this.log);
    this.modal.dataset.testid = 'battle-modal'; this.modal.hidden = true;
    this.stage.append(this.heading, this.roster, this.board, this.controls.root, this.logPanel, this.footer, this.movement.root, this.tutorial,
      this.controls.details, this.controls.tooltip, this.modal);
    root.append(this.stage);
    this.root.ownerDocument.addEventListener('click', this.handleBlankSpaceClick);
    const resize = () => { this.stage.style.transform = `translate(-50%, -50%) scale(${Math.min(root.clientWidth / 1280, root.clientHeight / 720)})`; };
    this.resizeObserver = new ResizeObserver(resize); this.resizeObserver.observe(root); resize();
  }

  private get maxPanX() { return Math.max(0, this.boardW - VIEW_W); }
  private get maxPanY() { return Math.max(0, this.boardH - VIEW_H); }

  private rebuildGrid(cols: number, rows: number) {
    const gridKey = `${cols}x${rows}`;
    if (this.gridKey === gridKey) return;
    this.gridKey = gridKey;
    this.boardW = cols * 96;
    this.boardH = rows * 96;
    this.world.style.width = `${this.boardW}px`;
    this.world.style.height = `${this.boardH}px`;
    this.canvas.style.width = `${this.boardW}px`;
    this.canvas.style.height = `${this.boardH}px`;
    this.canvas.setAttribute('aria-label', `${cols}×${rows} 战棋棋盘`);
    this.overlayWorld.style.width = `${this.boardW}px`;
    this.overlayWorld.style.height = `${this.boardH + OVERLAY_TOP_PAD}px`;
    if (!this.choreography) {
      this.fxLayer.width = this.boardW;
      this.fxLayer.height = this.boardH;
      this.fxLayer.dataset.logicalWidth = String(this.boardW);
      this.fxLayer.style.width = `${this.boardW}px`;
      this.fxLayer.style.height = `${this.boardH}px`;
    }
    this.hitGrid.style.gridTemplateColumns = `repeat(${cols}, 96px)`;
    this.hitGrid.style.gridTemplateRows = `repeat(${rows}, 96px)`;
    this.hitGrid.replaceChildren();
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
      const hit = element('button', 'battle-cell'); hit.type = 'button'; hit.dataset.testid = `cell-${col}-${row}`;
      hit.dataset.col = String(col); hit.dataset.row = String(row); this.hitGrid.append(hit);
    }
    this.board.dataset.maxPanX = String(this.maxPanX);
    this.board.dataset.maxPanY = String(this.maxPanY);
    this.cameraBar.hidden = this.maxPanX === 0 && this.maxPanY === 0;
    this.setPan(this.panX, this.panY);
  }

  private setPan(x: number, y: number) {
    this.panX = Math.max(0, Math.min(this.maxPanX, Math.round(x)));
    this.panY = Math.max(0, Math.min(this.maxPanY, Math.round(y)));
    const transform = `translate3d(${-this.panX}px, ${-this.panY}px, 0)`;
    this.world.style.transform = transform;
    this.overlayWorld.style.transform = transform;
    this.board.dataset.panX = String(this.panX);
    this.board.dataset.panY = String(this.panY);
    this.updateTutorialPosition();
  }

  private centerCameraOn(points: readonly Point[]) {
    if (!points.length || (this.maxPanX === 0 && this.maxPanY === 0)) { this.setPan(0, 0); return; }
    const cols = points.map(p => p.col), rows = points.map(p => p.row);
    const centerX = ((Math.min(...cols) + Math.max(...cols)) / 2) * 96 + 48;
    const centerY = ((Math.min(...rows) + Math.max(...rows)) / 2) * 96 + 48;
    this.setPan(centerX - VIEW_W / 2, centerY - VIEW_H / 2);
  }

  private ensureCellVisible(point: Point, margin = 96) {
    if (this.maxPanX === 0 && this.maxPanY === 0) return;
    const left = point.col * 96, right = left + 96;
    const top = point.row * 96, bottom = top + 96;
    let nextX = this.panX, nextY = this.panY;
    if (left - margin < nextX) nextX = left - margin;
    else if (right + margin > nextX + VIEW_W) nextX = right + margin - VIEW_W;
    if (top - margin < nextY) nextY = top - margin;
    else if (bottom + margin > nextY + VIEW_H) nextY = bottom + margin - VIEW_H;
    this.setPan(nextX, nextY);
  }

  private recenterCamera() {
    const state = this.paintGame?.battle;
    if (!state) return;
    const target = state.units.find(u => u.id === this.choreography?.selectedId) ?? currentUnit(state);
    this.centerCameraOn([target.position]);
  }

  private bindCameraEvents() {
    this.board.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      if (event.target instanceof Element && event.target.closest('.battle-camera-bar')) return;
      if (this.maxPanX === 0 && this.maxPanY === 0) return;
      this.drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, startPanX: this.panX, startPanY: this.panY, moved: false };
    });
    window.addEventListener('pointermove', this.handleWindowPointerMove);
    window.addEventListener('pointerup', this.handleWindowPointerUp);
    window.addEventListener('pointercancel', this.handleWindowPointerUp);
    this.board.addEventListener('wheel', event => {
      if (this.maxPanX === 0 && this.maxPanY === 0) return;
      event.preventDefault();
      const dx = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
      const dy = event.shiftKey && !event.deltaX ? 0 : event.deltaY;
      this.setPan(this.panX + dx, this.panY + dy);
    }, { passive: false });
  }

  private handleWindowPointerMove = (event: PointerEvent) => {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.id) return;
    const rect = this.board.getBoundingClientRect();
    const scale = rect.width > 0 ? rect.width / VIEW_W : 1;
    const dx = (event.clientX - drag.startX) / scale, dy = (event.clientY - drag.startY) / scale;
    if (!drag.moved && Math.hypot(dx, dy) >= 6) {
      drag.moved = true;
      this.board.dataset.dragging = 'true';
    }
    if (drag.moved) this.setPan(drag.startPanX - dx, drag.startPanY - dy);
  };

  private handleWindowPointerUp = (event: PointerEvent) => {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.id) return;
    if (drag.moved) {
      this.suppressBoardClickUntil = performance.now() + 120;
      delete this.board.dataset.dragging;
    }
    this.drag = undefined;
  };

  private handleBlankSpaceClick = (event: MouseEvent) => {
    if (event.defaultPrevented || !this.stage.isConnected || this.lastFixtureDone || this.isPerforming) return;
    if (this.paintGame?.system?.panel || this.paintGame?.system?.stale || this.paintGame?.system?.pending) return;
    if (performance.now() < this.suppressBoardClickUntil) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('.battle-board, .battle-roster, .battle-actions, .movement-planning-controls, .battle-ability-panel, .battle-log-panel, .battle-modal, .battle-title, .initiative-card, .chess-playback-controls, .battle-footer, .chess-sample-scenarios, .battle-camera-bar, .system-layer, .app-chrome, button, a, input, select')) {
      return;
    }
    this.clearInspection();
    const mode = this.paintGame?.battleMode ?? 'idle';
    const state = this.paintGame?.battle;
    if (state && ['attack', 'bonus', 'abilities'].includes(mode) && !state.pendingMove && !state.pendingReaction && !state.pendingRoll && !state.result) {
      this.controls.cancel();
    }
    if (this.choreography) this.showHint('已取消选中');
  };

  private syncMapMedia(state: BattleState) {
    const media = state.mapAsset ? battleMapMedia[state.mapAsset] : undefined;
    if (!media) {
      if (this.activeMapAsset) {
        this.activeMapAsset = undefined;
        delete this.board.dataset.mapAsset;
        this.mapPoster.hidden = true;
        this.mapVideo.hidden = true;
        this.mapVideo.pause();
        this.mapVideo.removeAttribute('src');
      }
      return;
    }
    this.board.dataset.mapAsset = media.id;
    this.mapPoster.hidden = false;
    this.mapVideo.hidden = false;
    if (this.activeMapAsset !== media.id) {
      this.activeMapAsset = media.id;
      this.mapPoster.src = media.poster;
      this.mapPoster.alt = media.title;
      this.mapVideo.poster = media.poster;
      this.mapVideo.src = media.video;
      this.mapVideo.play().catch(() => {});
    }
  }

  private clickCellPoint(event: MouseEvent, state: BattleState): Point | undefined {
    if (event.detail === 0 && event.target instanceof HTMLElement && event.target.dataset.col !== undefined) {
      return { col: Number(event.target.dataset.col), row: Number(event.target.dataset.row) };
    }
    const boardRect = this.board.getBoundingClientRect();
    if (event.clientX < boardRect.left || event.clientX > boardRect.right || event.clientY < boardRect.top || event.clientY > boardRect.bottom) {
      return undefined;
    }
    return canvasCell(event.clientX, event.clientY, this.canvas.getBoundingClientRect(), state.grid);
  }

  showHint(text: string) { if (!this.movement.root.hidden) this.movement.showHint(text); else this.hint.textContent = text; }
  get isPerforming() { return this.choreography?.busy ?? false; }
  get presentationSpeed() { return this.choreography?.clock.speed ?? 1; }

  dispose() {
    window.removeEventListener('pointermove', this.handleWindowPointerMove);
    window.removeEventListener('pointerup', this.handleWindowPointerUp);
    window.removeEventListener('pointercancel', this.handleWindowPointerUp);
    this.root.ownerDocument.removeEventListener('click', this.handleBlankSpaceClick);
    if (this.choreography) this.choreography.dispose(); else this.fx.dispose();
    this.resizeObserver.disconnect();
    this.stage.remove();
  }

  render(game: GameState, fixture = false, fixtureDone = false) {
    this.lastFixture = fixture; this.lastFixtureDone = fixtureDone;
    const state = game.battle!; const actor = currentUnit(state), token = battleToken(state), mode = game.battleMode ?? 'idle';
    this.rebuildGrid(state.grid.width, state.grid.height);
    this.syncMapMedia(state);
    const isNewSession = this.cameraSession !== state.session;
    const actorChanged = this.cameraTurnId !== actor.id;
    this.cameraSession = state.session;
    this.cameraTurnId = actor.id;
    if (isNewSession) {
      const activeUnits = state.units.filter(occupies);
      this.centerCameraOn((activeUnits.length ? activeUnits : state.units).map(u => u.position));
    } else if (actorChanged) {
      this.ensureCellVisible(actor.position);
    }

    this.choreography?.sync(state);
    this.choreography?.setPaused(Boolean(game.system?.panel || game.system?.stale || game.system?.pending));
    this.renderMovement(game);
    if (!this.choreography) this.fx.sync(state);
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
    const formalTitle = chapterTitles[game.actId] ? state.title.replace(/^(序幕|第一幕)/, chapterTitles[game.actId]) : state.title;
    const title = element('div', 'battle-title'); title.append(element('h1', '', formal ? formalTitle : fixture ? '内部测试 · 借机反应' : 'M2 · 战棋调试场'), element('p', '', formal ? `第 ${state.round} 轮${state.pendingRoll?.kind === 'initiative' ? ' · 先攻待确认' : ''}` : `${fixture ? '固定测试骰序' : `seed ${state.seed}`} · 骰子 ${state.rng.draws} 次 · 第 ${state.round} 轮`));
    const order = element('div', 'initiative-strip');
    for (const entry of state.order) {
      const unit = state.units.find(item => item.id === entry.actor)!;
      const card = element('div', `initiative-card${unit.id === actor.id ? ' current' : ''}`);
      card.dataset.testid = `initiative-${unit.id}`;
      card.append(element('strong', '', unit.name), element('span', '', `先攻 ${entry.total} · HP ${unit.hp}/${unit.maxHp}`)); order.append(card);
    }
    this.heading.replaceChildren(title, order);
    if (this.options.title) { title.querySelector('h1')!.textContent = this.options.title; title.querySelector('p')!.textContent = '角色与棋子交战样例 · 不写入存档'; }
    if (!formal) this.heading.append(button('重新开始', 'battle-restart', () => this.dispatch({ type: 'restart', token })));
    if (this.choreography) this.heading.append(this.choreography.toolbar);
    const resources = element('section', 'turn-resources');
    resources.append(element('h2', '', state.pendingRoll?.kind === 'initiative' ? '先攻等待确认' : `${actor.name}的回合`),
      element('p', '', `剩余移动 ${actor.resources.movement} 尺`));
    if (!canUseActionBar(state) || mode === 'move') {
      resources.append(element('p', '', `动作 ${Number(actor.resources.action)}　附赠 ${Number(actor.resources.bonus)}　反应 ${Number(actor.resources.reaction)}`));
    }
    if (state.inspiration) resources.append(element('p', '', `男高英雄激励 ${state.inspiration.hero ?? 0}点`));
    if (game.postBattle && game.postPrologue) resources.append(element('p', '', '金发青年剩余出战 ' + (game.postPrologue.linkUses - Number(game.postBattle.withLink))));
    const cards = state.units.map(unit => {
      const card = element('div', 'unit-summary');
      Object.assign(card.dataset, { testid: `unit-${unit.id}`, hp: String(unit.hp), tempHp: String(unit.tempHp), status: unit.status, col: String(unit.position.col), row: String(unit.position.row), reaction: String(unit.resources.reaction), action: String(unit.resources.action), bonus: String(unit.resources.bonus), savesSuccess: String(unit.saves.successes), savesFailure: String(unit.saves.failures), primaryAttack: unit.attacks[0]!.id });
      card.append(element('strong', '', unit.name), element('p', '', `HP ${unit.hp}/${unit.maxHp} · 临时 ${unit.tempHp}`), element('p', '', `${statusLabels[unit.status]} · (${unit.position.col},${unit.position.row})`));
      if (unit.status === 'unconscious') card.append(element('p', '', `死亡豁免：成功 ${unit.saves.successes} / 失败 ${unit.saves.failures}`));
      if (formal && unit.team === 'player') {
        card.append(element('p', '', `主手：${unit.attacks[0]!.name} ${unit.attacks[0]!.damage}`));
        if (unit.features.includes('martial_arts')) card.append(element('p', '', '附赠：徒手 ' + unit.attacks.find(attack => attack.id === 'unarmed')?.damage));
      }
      if (this.choreography) {
        card.dataset.chessMaterial = this.choreography.material(unit);
        card.tabIndex = 0; card.setAttribute('role', 'button'); card.setAttribute('aria-label', `查看${unit.name}`);
        card.onclick = () => { this.ensureCellVisible(unit.position); this.inspect(unit.id); };
        card.onkeydown = event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); if (!event.repeat) { this.ensureCellVisible(unit.position); this.inspect(unit.id); } } };
      }
      return card;
    });
    this.roster.replaceChildren(resources, ...cards);
    const cols = state.grid.width;
    for (const cell of Array.from(this.hitGrid.children)) {
      const col = Number((cell as HTMLElement).dataset.col), row = Number((cell as HTMLElement).dataset.row);
      const units = state.units.filter(unit => same(unit.position, { col, row }));
      cell.setAttribute('aria-label', `格 ${col},${row} ${state.grid.tiles[row * cols + col]} ${units.map(unit => `${unit.name} HP${unit.hp} ${statusLabels[unit.status]}`).join(' ')}`);
    }
    this.board.onclick = event => {
      if (performance.now() < this.suppressBoardClickUntil || fixtureDone) return;
      if (event.target instanceof Element && event.target.closest('.battle-camera-bar')) return;
      const point = this.clickCellPoint(event, state);
      if (!point || event.detail > 1) return;
      if (this.choreography && (mode === 'idle' || mode === 'skills' || this.isPerforming)) {
        const inspected = state.units.find(unit => occupies(unit) && same(unit.position, point)) ?? state.units.find(unit => same(unit.position, point));
        if (inspected) this.inspect(inspected.id);
        else if (!this.isPerforming) {
          this.clearInspection();
          this.showHint('已取消选中；点击棋子或左侧角色栏可重新查看');
        }
        return;
      }
      if (mode === 'move') { const action = planningInput(game, 'add', point); if (action) this.dispatch(action); return; }
      if (mode === 'abilities') {
        if (!this.controls.choosePoint(point)) this.showHint('此格不是当前技能的可选目标，请选择金色边框的格子');
        return;
      }
      if (mode === 'attack' || mode === 'bonus') {
        const target = state.units.find(unit => occupies(unit) && same(unit.position, point));
        if (!target) return this.showHint('此格没有可攻击目标');
        const resource = mode === 'bonus' ? 'bonus' : 'action';
        const available = playerAttack(state, actor, target, resource);
        if (available) { send(available); return; }
        const attack = actor.attacks.find(item => mode === 'bonus' ? item.id === 'unarmed' : true);
        if (!attack) return this.showHint('当前角色没有此攻击');
        const command: Command = { kind: 'attack', actor: actor.id, target: target.id, attackId: attack.id, resource };
        const reason = actionReason(state, command, 'player');
        if (reason) return this.showHint(reason);
        send(command);
      } else this.showHint('通过底部操作栏选择攻击、移动、技能或法术');
    };
    this.board.onpointermove = event => {
      if (this.drag?.moved) return;
      const point = canvasCell(event.clientX, event.clientY, this.canvas.getBoundingClientRect(), state.grid);
      const action = point && planningInput(game, 'hover', point); if (action) this.dispatch(action);
    };
    const leave = () => { const action = planningInput(game, 'leave'); if (action) this.dispatch(action); };
    this.board.onpointerleave = leave;
    this.focusIn = event => {
      if (!(event.target instanceof HTMLButtonElement)) return;
      if (event.target.dataset.col === undefined) return;
      const point = { col: Number(event.target.dataset.col), row: Number(event.target.dataset.row) };
      const action = planningInput(game, 'hover', point); if (action) this.dispatch(action);
    };
    this.focusOut = event => { if (!(event.relatedTarget instanceof Node) || !this.board.contains(event.relatedTarget)) leave(); };
    this.stage.onkeydown = event => {
      if (event.isComposing) return;
      if (this.isPerforming) return;
      if (event.target instanceof HTMLInputElement) {
        if (event.key === 'Escape') { event.preventDefault(); event.target.blur(); this.controls.cancel(); }
        return;
      }
      if (event.repeat && ['Enter', ' '].includes(event.key)) { event.preventDefault(); return; }
      if (event.key === 'Escape' && ['abilities', 'attack', 'bonus'].includes(mode)) {
        event.preventDefault(); this.controls.cancel(); return;
      }
      const operation = event.key === 'Backspace' ? 'undo' : event.key === 'Escape' ? 'cancel' : undefined;
      const action = operation && planningInput(game, operation);
      if (action) { event.preventDefault(); if (!event.repeat) this.dispatch(action); }
    };
    this.controls.render(state, mode, game.run, setMode, send);
    this.controls.root.inert = this.isPerforming; this.controls.details.inert = this.isPerforming; this.movement.root.inert = this.isPerforming;
    if (fixtureDone) this.controls.root.hidden = true;
    this.renderLogs(game);
    this.renderPresentation(game);
    const label = state.pendingRoll ? '等待英雄激励决定，当前结果尚未生效' : state.opening ? '剑形灼痕共鸣' : state.pendingReaction ? '移动已暂停，等待你的借机选择' : state.pendingMove ? '正在逐格移动并检查借机攻击' : fixtureDone ? '测试完成：可检查移动终点、HP、反应与骰子明细；重新开始可测试另一选项。' : state.result ? formal ? '选择结算操作' : '本轮为独立调试场，结算不会进入剧情。' : actor.team === 'enemy' ? '敌人正在行动，普通玩家操作暂不可用' : mode === 'move' ? '点击蓝色格规划，再确认移动' : mode === 'abilities' ? '在左侧查看技能，点选目标后确认使用' : mode === 'attack' || mode === 'bonus' ? '点击红色提示的敌人' : '从底部选择操作；悬停图标查看详情';
    this.footer.replaceChildren(element('p', '', label), this.hint);
    this.hint.textContent = '';
    if (['attack', 'bonus'].includes(mode) && !state.pendingMove && !state.result) this.footer.append(button('取消选择', 'battle-cancel', () => setMode('idle')));
    if (this.isPerforming) { this.modal.replaceChildren(); this.modal.hidden = true; }
    else if (!formal && this.choreography && state.result) {
      const panel = element('section', 'battle-dialog');
      panel.append(element('h2', '', '本轮样例结束'), element('p', '', state.result.outcome === 'win' ? '交战与倒地演出已完成，可以重新开始或切换上方的样例场景。' : '失能状态已结算，可以重新开始查看演出。'),
        button('重新开始样例', 'chess-sample-restart', () => this.dispatch({ type: 'restart', token })));
      this.modal.replaceChildren(panel); this.modal.hidden = false;
    } else renderBattleDialog(this.modal, game, send, this.dispatch, this.load);
    this.updateInspection();
  }

  private inspect(id: string) { this.choreography?.inspect(id); this.updateInspection(); }
  private clearInspection() { this.choreography?.clearInspection(); this.updateInspection(); }

  private updateInspection() {
    if (!this.choreography) return;
    const id = this.choreography.selectedId, unit = this.paintGame?.battle?.units.find(unit => unit.id === id);
    for (const card of Array.from(this.roster.querySelectorAll<HTMLElement>('.unit-summary'))) card.setAttribute('aria-pressed', String(Boolean(id) && card.dataset.testid === `unit-${id}`));
    this.footer.querySelector('.chess-inspection-label')?.remove();
    if (unit) {
      const placeholder = this.choreography.material(unit) === 'placeholder' ? ' · 像素素材待补' : '';
      this.footer.prepend(element('p', 'chess-inspection-label', `正在查看：${unit.name}${placeholder}`));
    }
  }

  private renderAbilityTargets(choices: readonly AbilityChoice[], selected?: AbilityChoice) {
    for (const cell of Array.from(this.hitGrid.children)) {
      const node = cell as HTMLElement, point = { col: Number(node.dataset.col), row: Number(node.dataset.row) };
      node.dataset.abilityTarget = String(choices.some(choice => same(choice.point, point)));
      node.dataset.abilitySelected = String(Boolean(selected && same(selected.point, point)));
    }
  }

  private renderMovement(game: GameState) {
    const overlay = movementOverlay(game);
    this.paintGame = game;
    this.paintOverlay = overlay;
    this.paintBoard(overlay);
    this.choreography?.paintPeople();
    this.movement.render(game, overlay); this.footer.hidden = !this.movement.root.hidden;
    Object.assign(this.stage.dataset, { routeKind: overlay?.kind ?? '', routePath: JSON.stringify(overlay?.path ?? []),
      routeWaypoints: JSON.stringify(overlay?.waypoints ?? []), routeRisks: JSON.stringify(overlay?.risks ?? []),
      selectedSteps: String(overlay?.selectedSteps ?? 0), remainingSteps: String(overlay?.remainingSteps ?? 0) });
    const reachable = new Set(overlay?.reachable.map(point => `${point.col},${point.row}`));
    for (const cell of Array.from(this.hitGrid.children)) {
      const node = cell as HTMLElement; node.dataset.reachable = String(reachable.has(`${node.dataset.col},${node.dataset.row}`));
    }
  }

  /** 受击后仰期间只重画棋盘，不触发 DOM 重建或规则副作用。 */
  private paintBoard(overlay?: MovementOverlay) {
    const game = this.paintGame;
    if (!game?.battle) return;
    renderBoard(this.canvas, game.battle, game.battleMode ?? 'idle', overlay ?? this.paintOverlay,
      this.choreography ? undefined : this.fx.reactions(), this.choreography?.painter,
      this.choreography ? this.choreography.selectedId : undefined);
  }

  private updateTutorialPosition() {
    const state = this.paintGame?.battle;
    if (!state) return;
    const hero = state.units.find(unit => unit.team === 'player')!;
    this.tutorial.style.left = `${Math.max(130, Math.min(900, 304 + hero.position.col * 96 + 48 - this.panX))}px`;
    this.tutorial.style.top = `${Math.max(100, 116 + hero.position.row * 96 - 46 - this.panY)}px`;
  }

  private renderPresentation(game: GameState) {
    const state = game.battle!, notice = state.tutorial?.notice;
    this.updateTutorialPosition();
    const key = `${state.session}:${notice ?? ''}`;
    if (key !== this.tutorialKey) {
      this.tutorialKey = key; this.tutorial.replaceChildren(); this.tutorial.hidden = !notice;
      if (notice) this.tutorial.append(element('p', '', tutorialText[notice]));
    }
    this.opening.hidden = !state.opening;
    if (state.opening && this.openingKey !== String(state.session)) {
      this.openingKey = String(state.session);
      const canvas = element('canvas', 'sword-scar'); canvas.width = VIEW_W; canvas.height = VIEW_H;
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
