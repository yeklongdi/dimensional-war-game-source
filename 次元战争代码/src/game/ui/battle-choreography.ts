import { PresentationClock } from '../battle/presentation-clock.js';
import { displayedUnit, planChessPerformance, poseAt } from '../battle/chess-performance.js';
import type { ChessPerformance, ChessPose } from '../battle/chess-performance.js';
import { ChessAssets } from '../battle/chess-assets.js';
import type { ChessAssetUrls } from '../battle/chess-assets.js';
import { chessSubject, drawChessPerson, drawChessPiece } from '../battle/render-chess.js';
import type { UnitPainter } from '../battle/render.js';
import type { BattleState, Unit } from '../battle/types.js';
import { currentUnit } from '../battle/state-helpers.js';
import { BattleFx, reducedMotion } from './battle-fx.js';
import { button, element } from './elements.js';
import '../../styles/battle-chess.css';

const TOP_PAD = 84;

export class BattleChoreography {
  readonly toolbar = element('div', 'chess-playback-controls');
  readonly people = element('canvas', 'battle-chess-people');
  readonly fx: BattleFx;
  readonly clock = new PresentationClock();
  private readonly assets: ChessAssets;
  private readonly speed = button('演出 1×', 'chess-speed', () => this.changeSpeed());
  private readonly status = element('span', 'chess-playback-status', '素材准备中');
  private readonly stage: HTMLElement;
  private readonly fxLayer: HTMLCanvasElement;
  private readonly repaint: () => void;
  private readonly idle: () => void;
  private boardW = 672;
  private boardH = 480;
  private state?: BattleState;
  private before?: BattleState;
  private selected = '';
  private selectedAt = 0;
  private plan?: ChessPerformance;
  private started = 0;
  private cueIndex = 0;
  private frame?: number;
  private idleTimer?: number;
  private disposed = false;
  private paused = false;
  private lock = false;
  private played: number[] = [];
  private readonly warned = new Set<string>();

  constructor(stage: HTMLElement, overlayHost: HTMLElement, fxLayer: HTMLCanvasElement, base: HTMLCanvasElement,
    sfx: (id: string) => void, repaint: () => void, idle: () => void, urls?: ChessAssetUrls) {
    this.stage = stage; this.fxLayer = fxLayer; this.repaint = repaint; this.idle = idle;
    this.people.setAttribute('aria-hidden', 'true');
    this.resizeLayer(672, 480);
    this.fx = new BattleFx(fxLayer, base, sfx, () => {}, { now: () => this.clock.now(), anchor: (state, id) => {
      const unit = state.units.find(unit => unit.id === id);
      return unit ? { x: unit.position.col * 96 + 48, y: unit.position.row * 96 + TOP_PAD - 38, radius: 24, name: unit.name } : undefined;
    } });
    this.assets = new ChessAssets(() => {
      if (this.disposed) return;
      this.stage.dataset.chessAssets = this.assets.failed ? 'failed' : 'ready';
      this.setLocked(this.lock); this.idle(); this.requestFrame();
    }, urls);
    this.stage.dataset.chessAssets = 'loading';
    this.speed.setAttribute('aria-label', '切换战斗演出速度');
    this.status.setAttribute('role', 'status'); this.toolbar.append(this.speed, this.status);
    overlayHost.append(this.people);
    document.addEventListener('visibilitychange', this.visibility);
  }

  private resizeLayer(boardW: number, boardH: number) {
    this.boardW = boardW; this.boardH = boardH;
    const totalH = boardH + TOP_PAD;
    this.people.width = boardW; this.people.height = totalH;
    this.people.style.width = `${boardW}px`; this.people.style.height = `${totalH}px`;
    this.fxLayer.width = boardW; this.fxLayer.height = totalH;
    this.fxLayer.dataset.logicalWidth = String(boardW);
    this.fxLayer.style.top = '0px';
    this.fxLayer.style.width = `${boardW}px`; this.fxLayer.style.height = `${totalH}px`;
  }

  get busy() { return this.lock || this.stage.dataset.chessAssets === 'loading'; }
  get selectedId() { return this.selected; }
  material(unit: Unit) {
    if (this.stage.dataset.chessAssets === 'loading') return 'loading';
    const subject = chessSubject(unit);
    return subject && this.assets.image(subject, 'Piece') && this.assets.image(subject, 'Poses') ? 'sprite' : 'placeholder';
  }

  sync(state: BattleState) {
    if (state === this.state) return;
    const boardW = state.grid.width * 96, boardH = state.grid.height * 96;
    if (boardW !== this.boardW || boardH !== this.boardH) this.resizeLayer(boardW, boardH);
    const now = this.clock.now(), prior = this.state;
    if (!prior || prior.session !== state.session) {
      this.fx.clear(); this.plan = undefined; this.before = undefined; this.played = []; this.setLocked(false);
      this.selected = currentUnit(state).id; this.selectedAt = now;
    } else {
      if (currentUnit(prior).id !== currentUnit(state).id || prior.round !== state.round) {
        this.selected = currentUnit(state).id; this.selectedAt = now;
      }
      // 英雄激励可能把攻击和伤害分成两次提交，等伤害骰确认后把两段合成一次演出。
      if (state.pendingRoll?.kind !== 'damage') {
        const attack = prior.pendingRoll?.kind === 'damage' ? prior.log.findLastIndex(event => event.kind === 'attack') : -1;
        const plan = planChessPerformance(state, state.log.slice(attack < 0 ? prior.log.length : attack));
        if (plan) { this.before = prior; this.plan = plan; this.started = now; this.cueIndex = 0; this.setLocked(true); }
      }
    }
    this.state = state;
    for (const unit of state.units) if (!chessSubject(unit) && !this.warned.has(unit.id)) {
      this.warned.add(unit.id);
      console.warn(`[次元战争:战斗棋子] ${unit.name}尚无专属素材，显示占位。`);
    }
    this.requestFrame();
  }

  inspect(id: string) {
    if (!this.state?.units.some(unit => unit.id === id)) return;
    if (this.selected !== id) this.selectedAt = this.clock.now();
    this.selected = id; this.repaint(); this.paintPeople(); this.requestFrame();
  }

  clearInspection() {
    if (!this.selected && !this.state) return;
    this.selected = ''; this.repaint(); this.paintPeople(); this.requestFrame();
  }

  setPaused(paused: boolean) {
    if (this.paused === paused) return;
    this.paused = paused; this.visibility();
  }

  private visibility = () => {
    const paused = this.paused || document.hidden;
    this.clock.setPaused(paused); this.stage.dataset.chessPaused = String(paused);
    if (paused) this.stopFrames();
    else this.requestFrame();
  };

  private changeSpeed() {
    const next = this.clock.speed === 1 ? 2 : this.clock.speed === 2 ? 4 : 1;
    this.clock.setSpeed(next); this.speed.textContent = `演出 ${next}×`;
    this.stage.dataset.chessSpeed = String(next);
    this.requestFrame();
  }

  readonly painter: UnitPainter = (ctx, unit) => {
    const now = this.clock.now(), elapsed = now - this.started;
    const falling = this.plan?.poses.find(pose => pose.actor === unit.id && pose.pose === 'down');
    const collapse = falling ? Math.max(0, Math.min(1, (elapsed - falling.at) / falling.length)) : 1;
    const revealAge = unit.id === this.selected ? now - this.selectedAt : Infinity;
    drawChessPiece(ctx, displayedUnit(unit, this.before?.units.find(item => item.id === unit.id), this.plan, elapsed),
      this.assets, unit.id === this.selected, collapse, revealAge, now);
  };

  paintPeople() {
    const ctx = this.people.getContext('2d'), state = this.state;
    if (!ctx || !state || this.disposed) return;
    const clockNow = this.clock.now();
    const now = this.fx.poseTime(clockNow), elapsed = now - this.started;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, this.boardW, this.boardH + TOP_PAD); ctx.translate(0, TOP_PAD);
    const visible = state.units.filter(unit => unit.id === this.selected || Boolean(this.plan?.participants.includes(unit.id)));
    const poses: Record<string, { pose: ChessPose; frame: number }> = {};
    const reactions = this.fx.reactions(now);
    const reduced = reducedMotion();
    for (const unit of [...visible].sort((a, b) => a.position.row - b.position.row)) {
      const shown = displayedUnit(unit, this.before?.units.find(item => item.id === unit.id), this.plan, elapsed);
      const fallen = shown.status !== 'active';
      const fallback = fallen ? 'down' : 'idle';
      const inPlan = Boolean(this.plan?.participants.includes(unit.id));
      const selectAge = clockNow - this.selectedAt;
      const pose = inPlan ? poseAt(this.plan, unit.id, elapsed, fallback)
        : selectAge < 220 && !fallen ? { pose: 'appear' as const, frame: Math.max(0, Math.min(3, Math.floor(selectAge / 55))) }
          : poseAt(undefined, unit.id, selectAge, fallback);
      const toward = 'facing' in pose && pose.facing ? state.units.find(item => item.id === pose.facing) : undefined;
      const left = toward ? toward.position.col < unit.position.col : unit.team === 'enemy';
      const fading = unit.id !== this.selected && this.plan ? Math.min(1, Math.max(0, (this.plan.length - elapsed) / 180)) : 1;
      const alpha = (pose.pose === 'appear' ? Math.min(1, (inPlan ? elapsed : selectAge) / 110) : 1) * fading;
      const revealAge = inPlan ? elapsed : unit.id === this.selected ? selectAge : Infinity;
      drawChessPerson(ctx, unit, this.assets, pose.pose, reduced && pose.pose === 'idle' ? 0 : pose.frame,
        left, Math.max(0, alpha), reactions?.get(unit.id), revealAge, clockNow, reduced);
      poses[unit.id] = { pose: pose.pose, frame: pose.frame };
    }
    Object.assign(this.stage.dataset, { chessSelected: this.selected, chessVisible: visible.map(unit => unit.id).join(','),
      chessPoses: JSON.stringify(poses), chessSpeed: String(this.clock.speed), chessTime: String(Math.round(elapsed)),
      chessPlayed: this.played.join(','), chessAssetSubjects: visible.filter(unit => this.material(unit) === 'sprite').length.toString() });
  }

  private setLocked(locked: boolean) {
    this.lock = locked; this.stage.dataset.chessBusy = String(locked);
    this.status.textContent = this.stage.dataset.chessAssets === 'loading' ? '素材准备中' : locked ? '演出中 · 可加速' : '可操作';
  }

  private tick = () => {
    this.frame = undefined;
    if (this.disposed || this.paused || document.hidden) return;
    const now = this.clock.now();
    if (this.plan) {
      const elapsed = now - this.started;
      while (this.cueIndex < this.plan.cues.length && this.plan.cues[this.cueIndex]!.at <= elapsed) {
        const { cue } = this.plan.cues[this.cueIndex++]!;
        this.fx.playCue(cue, this.state!); this.played.push(cue.seq);
      }
      if (elapsed >= this.plan.length) {
        this.plan = undefined; this.before = undefined; this.fx.clear(); this.setLocked(false);
        queueMicrotask(() => { if (!this.disposed) this.idle(); });
      } else this.fx.paintAt(now);
      this.repaint();
    } else if (this.selected && now - this.selectedAt < 380) {
      this.repaint();
    }
    this.paintPeople();
    const selected = this.state?.units.find(unit => unit.id === this.selected);
    if (this.plan || (selected?.status === 'active' && now - this.selectedAt < 380)) this.requestFrame();
    else if (selected?.status === 'active' && !reducedMotion()) {
      this.idleTimer = window.setTimeout(() => { this.repaint(); this.requestFrame(); }, 100 / this.clock.speed);
    }
  };

  private requestFrame() {
    if (this.idleTimer !== undefined) window.clearTimeout(this.idleTimer);
    this.idleTimer = undefined;
    if (this.frame === undefined && !this.disposed && !this.paused && !document.hidden) this.frame = requestAnimationFrame(this.tick);
  }

  private stopFrames() {
    if (this.idleTimer !== undefined) window.clearTimeout(this.idleTimer);
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.idleTimer = undefined; this.frame = undefined;
  }

  dispose() {
    this.disposed = true; this.stopFrames();
    document.removeEventListener('visibilitychange', this.visibility);
    this.fx.dispose(); this.people.remove(); this.toolbar.remove();
  }
}
