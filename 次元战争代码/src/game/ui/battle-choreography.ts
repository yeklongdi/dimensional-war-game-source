import { PresentationClock } from '../battle/presentation-clock.js';
import { displayedUnit, planChessPerformance, poseAt } from '../battle/chess-performance.js';
import type { ChessPerformance, ChessPose } from '../battle/chess-performance.js';
import { ChessAssets } from '../battle/chess-assets.js';
import type { ChessAssetUrls } from '../battle/chess-assets.js';
import { chessSubject, drawChessPerson, drawChessPiece } from '../battle/render-chess.js';
import type { UnitPainter } from '../battle/render.js';
import type { BattleState } from '../battle/types.js';
import { currentUnit } from '../battle/state-helpers.js';
import { BattleFx, reducedMotion } from './battle-fx.js';
import { button, element } from './elements.js';
import '../../styles/battle-chess.css';

export class BattleChoreography {
  readonly toolbar = element('div', 'chess-playback-controls');
  readonly people = element('canvas', 'battle-chess-people');
  readonly fx: BattleFx;
  readonly clock = new PresentationClock();
  private readonly assets: ChessAssets;
  private readonly speed = button('演出 1×', 'chess-speed', () => this.changeSpeed());
  private readonly status = element('span', 'chess-playback-status', '素材准备中');
  private readonly stage: HTMLElement;
  private readonly repaint: () => void;
  private readonly idle: () => void;
  private state?: BattleState;
  private before?: BattleState;
  private selected = '';
  private selectedAt = 0;
  private plan?: ChessPerformance;
  private started = 0;
  private cueIndex = 0;
  private frame?: number;
  private disposed = false;
  private paused = false;
  private lock = false;
  private played: number[] = [];

  constructor(stage: HTMLElement, board: HTMLElement, fxLayer: HTMLCanvasElement, base: HTMLCanvasElement,
    sfx: (id: string) => void, repaint: () => void, idle: () => void, urls?: ChessAssetUrls) {
    this.stage = stage; this.repaint = repaint; this.idle = idle;
    this.people.width = 672; this.people.height = 512; this.people.setAttribute('aria-hidden', 'true');
    fxLayer.height = 512; fxLayer.style.top = '-32px'; fxLayer.style.height = '512px';
    this.fx = new BattleFx(fxLayer, base, sfx, () => {}, { now: () => this.clock.now(), anchor: (state, id) => {
      const unit = state.units.find(unit => unit.id === id);
      return unit ? { x: unit.position.col * 96 + 48, y: unit.position.row * 96 + 10 + 32, radius: 20, name: unit.name } : undefined;
    } });
    this.assets = new ChessAssets(() => {
      if (this.disposed) return;
      this.stage.dataset.chessAssets = this.assets.failed ? 'failed' : 'ready'; this.setLocked(this.lock); this.repaint(); this.idle();
    }, urls);
    this.stage.dataset.chessAssets = 'loading';
    this.speed.setAttribute('aria-label', '切换战斗演出速度');
    this.status.setAttribute('role', 'status'); this.toolbar.append(this.speed, this.status);
    board.append(this.people);
    document.addEventListener('visibilitychange', this.visibility);
    this.frame = requestAnimationFrame(this.tick);
  }

  get busy() { return this.lock || this.stage.dataset.chessAssets === 'loading'; }
  get selectedId() { return this.selected; }

  sync(state: BattleState) {
    if (state === this.state) return;
    const now = this.clock.now(), prior = this.state;
    if (!prior || prior.session !== state.session) {
      this.fx.clear(); this.plan = undefined; this.played = []; this.setLocked(false);
      this.selected = currentUnit(state).id; this.selectedAt = now;
    } else {
      if (currentUnit(prior).id !== currentUnit(state).id || prior.round !== state.round) {
        this.selected = currentUnit(state).id; this.selectedAt = now;
      }
      const plan = planChessPerformance(state, state.log.slice(prior.log.length));
      if (plan) { this.before = prior; this.plan = plan; this.started = now; this.cueIndex = 0; this.setLocked(true); }
    }
    this.state = state;
  }

  inspect(id: string) {
    if (!this.state?.units.some(unit => unit.id === id)) return;
    if (this.selected !== id) this.selectedAt = this.clock.now();
    this.selected = id; this.repaint();
  }

  setPaused(paused: boolean) {
    this.paused = paused; this.visibility();
  }

  private visibility = () => {
    const paused = this.paused || document.hidden;
    this.clock.setPaused(paused); this.stage.dataset.chessPaused = String(paused);
  };

  private changeSpeed() {
    const next = this.clock.speed === 1 ? 2 : this.clock.speed === 2 ? 4 : 1;
    this.clock.setSpeed(next); this.speed.textContent = `演出 ${next}×`;
    this.stage.dataset.chessSpeed = String(next);
  }

  readonly painter: UnitPainter = (ctx, unit) => {
    const elapsed = this.clock.now() - this.started;
    const falling = this.plan?.poses.find(pose => pose.actor === unit.id && pose.pose === 'down');
    const collapse = falling ? Math.max(0, Math.min(1, (elapsed - falling.at) / falling.length)) : 1;
    drawChessPiece(ctx, displayedUnit(unit, this.before?.units.find(item => item.id === unit.id), this.plan, elapsed), this.assets, unit.id === this.selected, collapse);
  };

  paintPeople() {
    const ctx = this.people.getContext('2d'), state = this.state;
    if (!ctx || !state || this.disposed) return;
    const now = this.fx.poseTime(this.clock.now()), elapsed = now - this.started;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, 672, 512); ctx.translate(0, 32);
    const visible = state.units.filter(unit => unit.id === this.selected || Boolean(this.plan?.participants.includes(unit.id)));
    const poses: Record<string, { pose: ChessPose; frame: number }> = {};
    for (const unit of [...visible].sort((a, b) => a.position.row - b.position.row)) {
      const shown = displayedUnit(unit, this.before?.units.find(item => item.id === unit.id), this.plan, elapsed);
      const fallen = shown.status !== 'active';
      const fallback = fallen ? 'down' : 'idle';
      const pose = this.plan?.participants.includes(unit.id) ? poseAt(this.plan, unit.id, elapsed, fallback)
        : now - this.selectedAt < 200 && !fallen ? { pose: 'appear' as const, frame: Math.max(0, Math.min(3, Math.floor((now - this.selectedAt) / 50))) }
          : poseAt(undefined, unit.id, now - this.selectedAt, fallback);
      const toward = 'facing' in pose && pose.facing ? state.units.find(item => item.id === pose.facing) : undefined;
      const left = toward ? toward.position.col < unit.position.col : unit.team === 'enemy';
      const fading = unit.id !== this.selected && this.plan ? Math.min(1, Math.max(0, (this.plan.length - elapsed) / 180)) : 1;
      const alpha = (pose.pose === 'appear' ? Math.min(1, (this.plan ? elapsed : now - this.selectedAt) / 100) : 1) * fading;
      drawChessPerson(ctx, unit, this.assets, pose.pose, reducedMotion() && pose.pose === 'idle' ? 0 : pose.frame,
        left, alpha, this.fx.reactions(now)?.get(unit.id));
      poses[unit.id] = { pose: pose.pose, frame: pose.frame };
    }
    Object.assign(this.stage.dataset, { chessSelected: this.selected, chessVisible: visible.map(unit => unit.id).join(','),
      chessPoses: JSON.stringify(poses), chessSpeed: String(this.clock.speed), chessTime: String(Math.round(elapsed)),
      chessPlayed: this.played.join(','), chessAssetSubjects: visible.filter(unit => chessSubject(unit)).length.toString() });
  }

  private setLocked(locked: boolean) {
    this.lock = locked; this.stage.dataset.chessBusy = String(locked);
    this.status.textContent = this.stage.dataset.chessAssets === 'loading' ? '素材准备中' : locked ? '演出中 · 可加速' : '可操作';
  }

  private tick = () => {
    if (this.disposed) return;
    const now = this.clock.now();
    if (this.plan && !this.paused) {
      const elapsed = now - this.started;
      while (this.cueIndex < this.plan.cues.length && this.plan.cues[this.cueIndex]!.at <= elapsed) {
        const { cue } = this.plan.cues[this.cueIndex++]!;
        this.fx.playCue(cue, this.state!); this.played.push(cue.seq);
      }
      if (elapsed >= this.plan.length) {
        this.plan = undefined; this.before = undefined; this.setLocked(false);
        queueMicrotask(() => { if (!this.disposed) this.idle(); });
      }
    }
    if (!this.paused) this.fx.paintAt(now);
    this.repaint(); this.paintPeople();
    this.frame = requestAnimationFrame(this.tick);
  };

  dispose() {
    this.disposed = true; if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    document.removeEventListener('visibilitychange', this.visibility);
    this.fx.dispose(); this.people.remove(); this.toolbar.remove();
  }
}
