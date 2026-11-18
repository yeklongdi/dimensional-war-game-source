import type { BattleState } from '../battle/types.js';
import type { FeedbackCue, FxElement } from '../battle/feedback.js';
import { feedbackCues, unitAnchor } from '../battle/feedback.js';
import { FeedbackTimeline } from '../battle/feedback-timeline.js';
import { sfxFor } from '../battle/feedback-sfx.js';
import type { UnitReaction } from '../battle/render.js';

/** 表现层的 Canvas 覆盖层：读取规则事件，画受击闪白、粒子、伤害数字与克制震屏。 */
type Spark = { x: number; y: number; vx: number; vy: number; born: number; life: number; size: number; color: string };
type Float = { x: number; y: number; born: number; life: number; text: string; color: string; size: number };
type Ring = { x: number; y: number; born: number; life: number; radius: number; color: string; width: number };
type Sweep = { ax: number; ay: number; bx: number; by: number; born: number; life: number; color: string; width: number; dashed: boolean };
/** 受击棋子的位移/压扁/闪白，由棋盘渲染器消费。 */
type Recoil = { id: string; dirX: number; dirY: number; born: number; life: number };

const colors: Record<FxElement, string> = {
  physical: '#f0e6d2', fire: '#ff8a4c', cold: '#7fd6ff', lightning: '#ffe066', thunder: '#c9a7ff',
  acid: '#9fe04a', poison: '#8fd14f', force: '#9db7ff', necrotic: '#a06fbf', radiant: '#ffeeb0', psychic: '#ff9ecb',
};
const styleColors = { fist: '#f0d7ae', melee: '#e8e6e3', ranged: '#c9d6a0', spell: '#a9c8ff' };
const reductionMarks = { immune: '免疫', resisted: '抗性', vulnerable: '易伤', half_save: '减半', none: '' };

/** 系统偏好或运行时开关（html[data-reduce-motion]）任一开启即降级动画。 */
export function reducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  return window.document.documentElement.dataset.reduceMotion === 'true';
}
function damageText(cue: Extract<FeedbackCue, { kind: 'impact' }>) {
  if (cue.reduction === 'immune') return '免疫';
  const mark = reductionMarks[cue.reduction];
  return mark ? `${cue.amount} ${mark}` : String(cue.amount);
}

export class BattleFx {
  private readonly timeline = new FeedbackTimeline(reducedMotion);
  private readonly ctx: CanvasRenderingContext2D | null;
  private sparks: Spark[] = [];
  private floats: Float[] = [];
  private rings: Ring[] = [];
  private sweeps: Sweep[] = [];
  private recoils: Recoil[] = [];
  private readonly timers = new Set<number>();
  private frame: number | undefined;
  private shakeUntil = 0;
  private shakePower = 0;
  private holdStart = 0;
  private holdUntil = 0;
  private disposed = false;
  private session = Number.NaN;
  private readonly canvas: HTMLCanvasElement;
  private readonly base: HTMLCanvasElement;
  private readonly sfx: (id: string) => void;
  private readonly repaint: () => void;
  private readonly external?: { now: () => number; anchor: typeof unitAnchor };

  constructor(canvas: HTMLCanvasElement, base: HTMLCanvasElement, sfx: (id: string) => void, repaint: () => void = () => {},
    external?: { now: () => number; anchor: typeof unitAnchor }) {
    this.canvas = canvas; this.base = base; this.sfx = sfx; this.repaint = repaint;
    this.ctx = canvas.getContext('2d');
    this.external = external;
  }

  /** 每次渲染调用：新事件播放，旧事件因 seq 游标被忽略；首帧或换战斗只记录历史，不回放。 */
  sync(state: BattleState) {
    if (this.disposed) return;
    const cues = feedbackCues(state, state.log);
    if (state.session !== this.session) {
      this.session = state.session;
      this.clearTimers();
      this.clearVisuals();
      this.timeline.begin(state.session);
      this.timeline.skip(cues);
      return;
    }
    for (const { cue, delay } of this.timeline.take(cues)) {
      const id = sfxFor(cue);
      if (delay === 0) this.play(cue, state, id);
      else {
        const timer = window.setTimeout(() => { this.timers.delete(timer); this.play(cue, state, id); }, delay);
        this.timers.add(timer);
      }
    }
  }

  /** 离开战斗、重试或切场景时清空定时器与所有存活特效。 */
  clear() {
    this.clearTimers();
    this.timeline.reset();
    this.session = Number.NaN;
    this.clearVisuals();
  }

  private clearTimers() {
    for (const timer of this.timers) window.clearTimeout(timer);
    this.timers.clear();
  }

  private clearVisuals() {
    const moved = this.recoils.length > 0;
    this.sparks = []; this.floats = []; this.rings = []; this.sweeps = [];
    this.recoils = [];
    this.shakeUntil = 0; this.holdStart = 0; this.holdUntil = 0;
    if (this.frame !== undefined) { cancelAnimationFrame(this.frame); this.frame = undefined; }
    this.base.style.transform = '';
    if (this.ctx) this.ctx.clearRect(0, 0, 672, 480);
    if (moved) this.repaint();
  }

  /** 当前帧的受击形变；命中瞬间及其后的顿帧都保持同一姿态。 */
  reactions(now = this.external?.now() ?? performance.now()): Map<string, UnitReaction> | undefined {
    if (!this.recoils.length) return undefined;
    // 顿帧期间对外始终返回命中帧的姿态，棋盘不会提前回弹。
    const at = now < this.holdUntil ? this.holdStart : now;
    const map = new Map<string, UnitReaction>();
    for (const item of this.recoils) {
      const progress = (at - item.born) / item.life;
      if (progress >= 1) continue;
      const wave = Math.sin(Math.PI * Math.max(0, progress));
      map.set(item.id, { dx: item.dirX * 9 * wave, dy: item.dirY * 6 * wave, squash: 1 - 0.18 * wave, flash: Math.max(0, 1 - progress * 2.4) * 0.8 });
    }
    return map.size ? map : undefined;
  }

  dispose() { this.disposed = true; this.clear(); }

  /** 棋子样例由同一个虚拟时钟驱动人物、特效与音效；正常战斗仍走原 sync。 */
  playCue(cue: FeedbackCue, state: BattleState) { this.play(cue, state, sfxFor(cue)); }
  paintAt(now: number) { this.tick(now); }
  poseTime(now: number) { return now < this.holdUntil ? this.holdStart : now; }

  private play(cue: FeedbackCue, state: BattleState, id?: string) {
    if (this.disposed) return;
    if (id) this.sfx(id);
    this.ensureFrame();
    const now = this.external?.now() ?? performance.now(), reduced = reducedMotion();
    const anchor = this.external?.anchor ?? unitAnchor;
    const target = 'target' in cue ? anchor(state, cue.target) : undefined;
    if (cue.kind === 'swing') {
      const actor = anchor(state, cue.actor);
      if (!actor || !target) return;
      const miss = !cue.hit, spread = miss ? 26 : 8;
      const dx = target.x - actor.x, dy = target.y - actor.y, len = Math.hypot(dx, dy) || 1;
      this.sweeps.push({ ax: actor.x, ay: actor.y,
        bx: target.x + (miss ? (-dy / len) * spread : 0), by: target.y + (miss ? (dx / len) * spread : 0),
        born: now, life: reduced ? 90 : 170, color: styleColors[cue.style], width: cue.style === 'fist' ? 5 : 2.5, dashed: cue.style === 'ranged' });
      return;
    }
    if (!target) return;
    if (cue.kind === 'impact') {
      const color = colors[cue.element], big = cue.critical;
      const actor = anchor(state, cue.actor);
      if (!reduced && actor && cue.reduction !== 'immune') {
        const dx = target.x - actor.x, dy = target.y - actor.y, len = Math.hypot(dx, dy) || 1;
        this.recoils = this.recoils.filter(item => item.id !== cue.target);
        this.recoils.push({ id: cue.target, dirX: dx / len, dirY: dy / len, born: now, life: big ? 260 : 190 });
      }
      // 顿帧：命中瞬间冻结表现时间轴，闪白与后仰保持定格，不冻结点击与菜单。
      if (!reduced) { this.holdStart = now; this.holdUntil = now + (big ? 110 : 70); }
      this.rings.push({ x: target.x, y: target.y, born: now, life: reduced ? 140 : big ? 320 : 220, radius: big ? 34 : 24, color: big ? '#ffe9a8' : color, width: big ? 4 : 2 });
      const stack = this.floats.filter(item => item.x === target.x && now - item.born < 250).length;
      this.floats.push({ x: target.x, y: target.y - 18 - stack * 14, born: now, life: reduced ? 520 : 720,
        text: damageText(cue), color: cue.reduction === 'immune' ? '#cfd6df' : big ? '#ffe08a' : color, size: big ? 24 : 18 });
      if (!reduced) for (let i = 0; i < (big ? 14 : 8); i++) {
        const angle = Math.random() * Math.PI * 2, speed = 0.05 + Math.random() * 0.09;
        this.sparks.push({ x: target.x, y: target.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 0.02, born: now,
          life: 260 + Math.random() * 200, size: 1.6 + Math.random() * 2, color });
      }
      if (big) this.shake(now, 220, 6);
      return;
    }
    if (cue.kind === 'save') {
      this.rings.push({ x: target.x, y: target.y, born: now, life: reduced ? 160 : 300, radius: 30,
        color: cue.success ? '#8fe3ff' : '#9aa4b2', width: cue.success ? 3 : 1.5 });
      if (!cue.success) this.floats.push({ x: target.x, y: target.y - 16, born: now, life: 520, text: '豁免失败', color: '#c8ced8', size: 13 });
      return;
    }
    if (cue.kind === 'heal') {
      this.floats.push({ x: target.x, y: target.y - 16, born: now, life: reduced ? 560 : 820, text: `+${cue.amount}`, color: '#8ee6a8', size: 20 });
      this.rings.push({ x: target.x, y: target.y, born: now, life: reduced ? 180 : 420, radius: 26, color: '#8ee6a8', width: 2 });
      if (!reduced) for (let i = 0; i < 8; i++) {
        this.sparks.push({ x: target.x + (Math.random() - 0.5) * 26, y: target.y + 14, vx: (Math.random() - 0.5) * 0.03, vy: -0.05 - Math.random() * 0.05,
          born: now, life: 500 + Math.random() * 300, size: 1.8, color: '#b8f5c6' });
      }
      return;
    }
    if (cue.kind === 'ward') {
      this.rings.push({ x: target.x, y: target.y, born: now, life: reduced ? 220 : 520, radius: 30, color: '#8fb8ff', width: 2.5 });
      this.floats.push({ x: target.x, y: target.y - 16, born: now, life: reduced ? 520 : 760, text: cue.amount > 0 ? `护盾 +${cue.amount}` : '防护', color: '#a8c6ff', size: 14 });
      return;
    }
    this.rings.push({ x: target.x, y: target.y, born: now, life: reduced ? 200 : 420, radius: 28, color: '#7d8590', width: 2 });
    this.floats.push({ x: target.x, y: target.y - 16, born: now, life: reduced ? 560 : 800,
      text: cue.status === 'dead' ? '死亡' : cue.status === 'defeated' ? '击败' : '昏迷', color: '#c8ced8', size: 14 });
  }

  /** 震屏只作用在棋盘 canvas 上，点击网格与菜单不受影响。 */
  private shake(now: number, duration: number, power: number) {
    if (reducedMotion()) return;
    this.shakeUntil = now + duration;
    this.shakePower = power;
  }

  private tick = (now: number) => {
    this.frame = undefined;
    const ctx = this.ctx;
    if (!ctx || this.disposed) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const ratio = (this.canvas.width || 672) / 672;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    // 顿帧期间时间停在命中帧，所有特效与后仰姿态保持不动。
    const frameNow = now < this.holdUntil ? this.holdStart : now;
    this.sweeps = this.sweeps.filter(s => this.drawSweep(ctx, s, frameNow));
    this.rings = this.rings.filter(r => this.drawRing(ctx, r, frameNow));
    this.sparks = this.sparks.filter(s => this.drawSpark(ctx, s, frameNow));
    this.floats = this.floats.filter(f => this.drawFloat(ctx, f, frameNow));
    const recoiled = this.recoils.length > 0;
    this.recoils = this.recoils.filter(item => now - item.born < item.life);
    if (recoiled) this.repaint();
    if (now < this.shakeUntil) {
      const rest = (this.shakeUntil - now) / 220, power = this.shakePower * Math.min(1, rest);
      this.base.style.transform = `translate(${(Math.random() - 0.5) * power}px, ${(Math.random() - 0.5) * power}px)`;
    } else if (this.base.style.transform) this.base.style.transform = '';
    if (!this.external && (this.sweeps.length || this.rings.length || this.sparks.length || this.floats.length || this.recoils.length || now < this.holdUntil)) {
      this.frame = requestAnimationFrame(this.tick);
    }
  };

  private drawSweep(ctx: CanvasRenderingContext2D, sweep: Sweep, now: number) {
    const progress = (now - sweep.born) / sweep.life;
    if (progress >= 1) return false;
    ctx.save();
    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = sweep.color; ctx.lineWidth = sweep.width * (1 - progress * 0.5);
    if (sweep.dashed) ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(sweep.ax, sweep.ay);
    ctx.lineTo(sweep.ax + (sweep.bx - sweep.ax) * Math.min(1, progress * 1.6), sweep.ay + (sweep.by - sweep.ay) * Math.min(1, progress * 1.6));
    ctx.stroke(); ctx.restore();
    return true;
  }

  private drawRing(ctx: CanvasRenderingContext2D, ring: Ring, now: number) {
    const progress = (now - ring.born) / ring.life;
    if (progress >= 1) return false;
    ctx.save();
    ctx.globalAlpha = (1 - progress) * 0.9;
    ctx.strokeStyle = ring.color; ctx.lineWidth = ring.width;
    ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.radius * (0.5 + progress * 0.9), 0, Math.PI * 2); ctx.stroke();
    if (progress < 0.45) { ctx.globalAlpha = (0.45 - progress) * 1.4; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ring.x, ring.y, 22, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    return true;
  }

  private drawSpark(ctx: CanvasRenderingContext2D, spark: Spark, now: number) {
    const progress = (now - spark.born) / spark.life;
    if (progress >= 1) return false;
    ctx.save();
    ctx.globalAlpha = 1 - progress; ctx.fillStyle = spark.color;
    ctx.beginPath(); ctx.arc(spark.x + spark.vx * (now - spark.born), spark.y + spark.vy * (now - spark.born), spark.size, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return true;
  }

  private drawFloat(ctx: CanvasRenderingContext2D, item: Float, now: number) {
    const progress = (now - item.born) / item.life;
    if (progress >= 1) return false;
    ctx.save();
    ctx.globalAlpha = Math.min(1, (1 - progress) * 2);
    ctx.font = `bold ${item.size}px "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center'; ctx.fillStyle = '#0a111c';
    const y = item.y - progress * 26;
    ctx.fillText(item.text, item.x + 1, y + 1); ctx.fillStyle = item.color; ctx.fillText(item.text, item.x, y);
    ctx.restore();
    return true;
  }

  /** 供表现层排空动画队列（渲染循环由 BattleFx 自行驱动）。 */
  private ensureFrame() { if (!this.external && this.frame === undefined && !this.disposed) this.frame = requestAnimationFrame(this.tick); }
}
