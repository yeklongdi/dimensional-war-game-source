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

export function drawChessPiece(ctx: CanvasRenderingContext2D, unit: Unit, assets: ChessAssets, selected: boolean, collapse = 1) {
  const x = unit.position.col * 96 + 48, y = unit.position.row * 96, subject = chessSubject(unit);
  const piece = subject && assets.image(subject, 'Piece'), down = unit.status !== 'active';
  ctx.save(); ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = '#0007'; ctx.beginPath(); ctx.ellipse(x, y + 76, 26, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = unit.team === 'player' ? '#244e69' : '#6e3038';
  ctx.strokeStyle = unit.team === 'player' ? '#72c9e6' : '#df8390'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y + 72, 24, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (selected) { ctx.strokeStyle = '#f2d68d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y + 74, 28, 9, 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.save(); ctx.translate(x, y + 70);
  if (down) { ctx.rotate(Math.PI / 2.8 * collapse); ctx.globalAlpha = 1 - .48 * collapse; ctx.filter = `saturate(${1 - .75 * collapse})`; }
  if (piece) ctx.drawImage(piece, -19, -44, 38, 46);
  else drawPlaceholderPiece(ctx, unit);
  ctx.restore();
  ctx.textAlign = 'center'; ctx.font = '11px "Microsoft YaHei", sans-serif';
  const name = unit.name + (down ? ' · ' + statusText[unit.status] : '');
  ctx.lineWidth = 3; ctx.strokeStyle = '#09101b'; ctx.strokeText(name, x, y + 85);
  ctx.fillStyle = down ? '#c1b3a4' : '#e8e6e3'; ctx.fillText(name, x, y + 85);
  ctx.fillStyle = '#09101b'; ctx.fillRect(x - 27, y + 90, 54, 4); ctx.fillStyle = '#7eb59b'; ctx.fillRect(x - 27, y + 90, 54 * unit.hp / unit.maxHp, 4);
  if (unit.tempHp) { ctx.fillStyle = '#78c9e6'; ctx.fillRect(x - 27, y + 95, Math.min(54, 54 * unit.tempHp / unit.maxHp), 2); }
  ctx.restore();
}

export function drawChessPerson(ctx: CanvasRenderingContext2D, unit: Unit, assets: ChessAssets, pose: ChessPose, frame: number,
  faceLeft: boolean, alpha: number, reaction?: UnitReaction) {
  const subject = chessSubject(unit), sheet = subject && assets.image(subject, 'Poses');
  const x = unit.position.col * 96 + 48, foot = unit.position.row * 96 + 30 + (pose === 'down' ? 34 * frame / 3 : 0);
  ctx.save(); ctx.translate(x + (reaction?.dx ?? 0), foot + (reaction?.dy ?? 0));
  ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = false;
  ctx.scale(sheet && faceLeft ? -1 : 1, reaction?.squash ?? 1);
  if (reaction?.flash) ctx.filter = `brightness(${1 + reaction.flash * 2})`;
  if (sheet) ctx.drawImage(sheet, frame * 64, poseRows[pose] * 64, 64, 64, -24, -45, 48, 48);
  else {
    ctx.beginPath(); ctx.roundRect(-16, -31, 32, 30, 4);
    ctx.fillStyle = '#162130'; ctx.fill(); ctx.strokeStyle = '#9fb1c5'; ctx.stroke();
    ctx.fillStyle = '#e7eaf0'; ctx.textAlign = 'center';
    ctx.font = 'bold 11px sans-serif'; ctx.fillText(unit.name.slice(0, 1), 0, -17);
    ctx.font = '9px sans-serif'; ctx.fillText('占位', 0, -5);
  }
  ctx.restore();
}
