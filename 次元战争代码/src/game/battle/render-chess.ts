import type { UnitReaction } from './render.js';
import type { ChessAssets, ChessSubject } from './chess-assets.js';
import type { ChessPose } from './chess-performance.js';
import type { Unit } from './types.js';

export const chessSubject = (unit: Unit): ChessSubject | undefined => unit.id === 'hero' ? 'hero'
  : unit.id === 'black_a' || unit.id === 'black_b' ? 'black' : undefined;
const poseRows: Record<ChessPose, number> = { appear: 0, idle: 1, attack: 2, cast: 3, hurt: 4, down: 5 };
const statusText = { active: '', unconscious: '昏迷', stable: '稳定', dead: '死亡', defeated: '击败' };
const placeholders = {
  knight: { edge: '#b7d7ed', light: '#b5cbdd', mid: '#50708b', shade: '#26384c',
    shape: 'M3 45V40Q4 36 12 36L17 21L12 25L5 20L14 8L18 2L22 7Q33 11 33 25L28 36Q35 36 35 41V45Z',
    engraving: 'M16 16L20 12M22 29L29 21M24 34L29 29' },
  rook: { edge: '#beadd6', light: '#9382ac', mid: '#4b3b66', shade: '#262136',
    shape: 'M2 45V40Q4 35 10 35L13 19L7 13V5H12V10H16V3H22V10H26V5H31V13L25 19L28 35Q36 35 36 40V45Z',
    engraving: 'M10 14H28M15 23L19 30L23 23M14 34H24' },
  pawn: { edge: '#ccbea8', light: '#aaa5a0', mid: '#655c55', shade: '#302d2d',
    shape: 'M3 45V40Q5 35 12 35L16 20Q10 17 10 11A9 9 0 0 1 28 11Q28 17 22 20L26 35Q34 35 35 40V45Z',
    engraving: 'M13 21H25M16 24H22M12 37H26' },
};

function drawPlaceholderPiece(ctx: CanvasRenderingContext2D, unit: Unit) {
  const design = unit.team === 'player' ? placeholders.knight : unit.id === 'black_humanoid' ? placeholders.rook : placeholders.pawn;
  ctx.scale(56 / 38, 68 / 46);
  ctx.translate(-19, -44);
  const finish = ctx.createLinearGradient(2, 4, 35, 28);
  finish.addColorStop(0, design.mid);
  finish.addColorStop(.28, design.light);
  finish.addColorStop(.55, design.mid);
  finish.addColorStop(1, design.shade);
  const shape = new Path2D(design.shape);
  ctx.fillStyle = finish; ctx.fill(shape);
  ctx.lineWidth = .85; ctx.strokeStyle = design.edge; ctx.stroke(shape);
  ctx.stroke(new Path2D(design.engraving));
}

function unitSeed(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return (hash % 100) / 100 * Math.PI * 2;
}

export function drawChessPiece(ctx: CanvasRenderingContext2D, unit: Unit, assets: ChessAssets, selected: boolean, collapse = 1,
  revealAge = Infinity, clockNow = 0) {
  const x = unit.position.col * 96 + 48, y = unit.position.row * 96, subject = chessSubject(unit);
  const piece = subject && assets.image(subject, 'Piece'), down = unit.status !== 'active';
  const pulse = selected ? 0.8 + 0.2 * Math.sin(clockNow / 240) : 1;
  ctx.save(); ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = '#0007'; ctx.beginPath(); ctx.ellipse(x, y + 80, 32, 9, 0, 0, Math.PI * 2); ctx.fill();
  if (selected) {
    const beam = ctx.createLinearGradient(x, y + 76, x, y - 4);
    beam.addColorStop(0, unit.team === 'player' ? 'rgba(114, 201, 230, 0.28)' : 'rgba(223, 131, 144, 0.28)');
    beam.addColorStop(0.55, 'rgba(242, 214, 141, 0.14)');
    beam.addColorStop(1, 'rgba(242, 214, 141, 0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(x - 24, y + 74);
    ctx.lineTo(x - 18, y - 4);
    ctx.lineTo(x + 18, y - 4);
    ctx.lineTo(x + 24, y + 74);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = unit.team === 'player' ? '#244e69' : '#6e3038';
  ctx.strokeStyle = unit.team === 'player' ? '#72c9e6' : '#df8390'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y + 76, 30, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (selected) {
    ctx.save();
    ctx.globalAlpha = 0.45 * pulse;
    ctx.strokeStyle = unit.team === 'player' ? '#9be0f7' : '#f2a4ae';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(x, y + 78, 36, 12, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = '#f2d68d'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y + 78, 34, 11, 0, 0, Math.PI * 2); ctx.stroke();
  }
  if (revealAge >= 0 && revealAge < 360) {
    const t = revealAge / 360;
    ctx.save();
    ctx.globalAlpha = (1 - t) * 0.85;
    ctx.strokeStyle = unit.team === 'player' ? '#aef0ff' : '#ffb8c2';
    ctx.lineWidth = 2.4 - t * 1.4;
    ctx.beginPath(); ctx.ellipse(x, y + 77, 30 + t * 24, 9 + t * 8, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  ctx.save(); ctx.translate(x, y + 74);
  if (down) { ctx.rotate(Math.PI / 2.8 * collapse); ctx.globalAlpha = 1 - .48 * collapse; ctx.filter = `saturate(${1 - .75 * collapse})`; }
  if (piece) ctx.drawImage(piece, -28, -68, 56, 68);
  else drawPlaceholderPiece(ctx, unit);
  ctx.restore();
  ctx.textAlign = 'center'; ctx.font = '11px "Microsoft YaHei", sans-serif';
  const name = unit.name + (down ? ' · ' + statusText[unit.status] : '');
  ctx.lineWidth = 3; ctx.strokeStyle = '#09101b'; ctx.strokeText(name, x, y + 84);
  ctx.fillStyle = down ? '#c1b3a4' : '#e8e6e3'; ctx.fillText(name, x, y + 84);
  ctx.fillStyle = '#09101b'; ctx.fillRect(x - 28, y + 89, 56, 4); ctx.fillStyle = '#7eb59b'; ctx.fillRect(x - 28, y + 89, 56 * unit.hp / unit.maxHp, 4);
  if (unit.tempHp) { ctx.fillStyle = '#78c9e6'; ctx.fillRect(x - 28, y + 94, Math.min(56, 56 * unit.tempHp / unit.maxHp), 2); }
  ctx.restore();
}

export function drawChessPerson(ctx: CanvasRenderingContext2D, unit: Unit, assets: ChessAssets, pose: ChessPose, frame: number,
  faceLeft: boolean, alpha: number, reaction?: UnitReaction, revealAge = Infinity, clockNow = 0, reduced = false) {
  const subject = chessSubject(unit), sheet = subject && assets.image(subject, 'Poses');
  const seed = unitSeed(unit.id);
  const revealing = revealAge >= 0 && revealAge < 360 && !reduced && pose !== 'down';
  const r = revealing ? revealAge / 360 : 1;
  const pop = revealing ? 1 - Math.pow(1 - Math.min(1, r / 0.65), 3) : 1;
  const riseY = revealing ? (1 - pop) * 12 : 0;
  const bobY = !reduced && pose === 'idle' && alpha > 0.5 ? Math.sin(clockNow / 380 + seed) * 2.2 : 0;
  const popScaleY = revealing ? (r < 0.45 ? 0.8 + (r / 0.45) * 0.25 : 1.05 - ((r - 0.45) / 0.55) * 0.05) : 1;
  const popScaleX = revealing ? (r < 0.45 ? 1.12 - (r / 0.45) * 0.14 : 0.98 + ((r - 0.45) / 0.55) * 0.02) : 1;
  const x = unit.position.col * 96 + 48, foot = unit.position.row * 96 - 2 + (pose === 'down' ? 40 * frame / 3 : 0);

  ctx.save(); ctx.translate(x + (reaction?.dx ?? 0), foot + riseY + bobY + (reaction?.dy ?? 0));
  ctx.globalAlpha = alpha;
  if (alpha > 0.05 && pose !== 'down') {
    const isPlayer = unit.team === 'player';
    const glow = 0.82 + 0.18 * Math.sin(clockNow / 280 + seed);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    if (revealing) {
      const pillar = ctx.createLinearGradient(0, 2, 0, -82);
      pillar.addColorStop(0, isPlayer ? `rgba(114, 201, 230, ${(1 - r) * 0.45})` : `rgba(223, 131, 144, ${(1 - r) * 0.45})`);
      pillar.addColorStop(0.55, `rgba(242, 214, 141, ${(1 - r) * 0.25})`);
      pillar.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = pillar;
      ctx.fillRect(-22, -82, 44, 84);
      ctx.strokeStyle = isPlayer ? `rgba(174, 240, 255, ${(1 - r) * 0.85})` : `rgba(255, 184, 194, ${(1 - r) * 0.85})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 0, 24 + r * 24, 6 + r * 7, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = isPlayer ? `rgba(36, 78, 105, ${0.38 * glow})` : `rgba(110, 48, 56, ${0.38 * glow})`;
    ctx.strokeStyle = isPlayer ? `rgba(114, 201, 230, ${0.85 * glow})` : `rgba(223, 131, 144, ${0.85 * glow})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 25, 6.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = isPlayer ? `rgba(242, 214, 141, ${0.42 * glow})` : `rgba(242, 180, 141, ${0.42 * glow})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(0, 0, 29, 8.2, 0, 0, Math.PI * 2); ctx.stroke();
    if (!reduced) {
      for (let i = 0; i < 3; i++) {
        const phase = ((clockNow / 1100 + seed + i / 3) % 1 + 1) % 1;
        const mx = Math.sin(seed + i * 2.1 + phase * 4) * 19;
        const my = -4 - phase * 42;
        ctx.fillStyle = isPlayer ? `rgba(175, 235, 255, ${(1 - phase) * 0.75})` : `rgba(255, 190, 175, ${(1 - phase) * 0.75})`;
        ctx.beginPath(); ctx.arc(mx, my, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }
  ctx.imageSmoothingEnabled = false;
  ctx.scale((sheet && faceLeft ? -1 : 1) * popScaleX, (reaction?.squash ?? 1) * popScaleY);
  const flashBoost = reaction?.flash ? reaction.flash * 2 : revealing && r < 0.35 ? (1 - r / 0.35) * 0.45 : 0;
  if (flashBoost > 0) ctx.filter = `brightness(${1 + flashBoost})`;
  if (sheet) ctx.drawImage(sheet, frame * 64, poseRows[pose] * 64, 64, 64, -40, -75, 80, 80);
  else {
    ctx.beginPath(); ctx.roundRect(-24, -52, 48, 46, 6);
    ctx.fillStyle = '#162130'; ctx.fill(); ctx.strokeStyle = '#9fb1c5'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#e7eaf0'; ctx.textAlign = 'center';
    ctx.font = 'bold 15px sans-serif'; ctx.fillText(unit.name.slice(0, 1), 0, -29);
    ctx.font = '11px sans-serif'; ctx.fillText('占位', 0, -11);
  }
  ctx.restore();
}
