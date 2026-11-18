import type { UnitReaction } from './render.js';
import type { ChessAssets, ChessSubject } from './chess-assets.js';
import type { ChessPose } from './chess-performance.js';
import type { Unit } from './types.js';

export const chessSubject = (unit: Unit): ChessSubject | undefined => unit.id === 'hero' ? 'hero'
  : unit.id === 'black_a' || unit.id === 'black_b' ? 'black' : undefined;
const poseRows: Record<ChessPose, number> = { appear: 0, idle: 1, attack: 2, cast: 3, hurt: 4, down: 5 };
const statusText = { active: '', unconscious: '昏迷', stable: '稳定', dead: '死亡', defeated: '击败' };

export function drawChessPiece(ctx: CanvasRenderingContext2D, unit: Unit, assets: ChessAssets, selected: boolean, collapse = 1) {
  const x = unit.position.col * 96 + 48, y = unit.position.row * 96, subject = chessSubject(unit);
  const piece = subject && assets.image(subject, 'Piece'), down = unit.status !== 'active';
  ctx.save(); ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = '#0007'; ctx.beginPath(); ctx.ellipse(x, y + 76, 26, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = unit.team === 'player' ? '#244e69' : '#6e3038';
  ctx.strokeStyle = unit.team === 'player' ? '#72c9e6' : '#df8390'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y + 72, 24, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (selected) { ctx.strokeStyle = '#f2d68d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y + 74, 28, 9, 0, 0, Math.PI * 2); ctx.stroke(); }
  if (piece) {
    ctx.save(); ctx.translate(x, y + 70);
    if (down) { ctx.rotate(Math.PI / 2.8 * collapse); ctx.globalAlpha = 1 - .48 * collapse; ctx.filter = `saturate(${1 - .75 * collapse})`; }
    ctx.drawImage(piece, -19, -44, 38, 46); ctx.restore();
  } else {
    ctx.fillStyle = '#8693a1'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('棋子占位', x, y + 48);
  }
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
  if (!sheet) return;
  const x = unit.position.col * 96 + 48, foot = unit.position.row * 96 + 30 + (pose === 'down' ? 34 * frame / 3 : 0);
  ctx.save(); ctx.translate(x + (reaction?.dx ?? 0), foot + (reaction?.dy ?? 0));
  ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = false;
  ctx.scale(faceLeft ? -1 : 1, reaction?.squash ?? 1);
  if (reaction?.flash) ctx.filter = `brightness(${1 + reaction.flash * 2})`;
  ctx.drawImage(sheet, frame * 64, poseRows[pose] * 64, 64, 64, -24, -45, 48, 48);
  ctx.restore();
}
