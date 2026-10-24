import type { BattleState, Point } from './types.js';
import type { MovementOverlay } from './movement-preview.js';
import { getUnit } from './state-helpers.js';

const center = (point: Point) => ({ x: point.col * 96 + 48, y: point.row * 96 + 48 });

export function renderMovement(ctx: CanvasRenderingContext2D, state: BattleState, overlay?: MovementOverlay) {
  if (!overlay?.path.length) return;
  const points = [overlay.from, ...overlay.path].map(center), end = points[points.length - 1]!, before = points[points.length - 2]!;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(points[0]!.x, points[0]!.y);
  points.slice(1).forEach(point => ctx.lineTo(point.x, point.y));
  ctx.strokeStyle = '#e2ffff'; ctx.lineWidth = 7; ctx.stroke();
  ctx.strokeStyle = '#3cddf2'; ctx.lineWidth = 4; ctx.stroke();
  const angle = Math.atan2(end.y - before.y, end.x - before.x);
  ctx.beginPath(); ctx.moveTo(end.x - Math.cos(angle - .55) * 16, end.y - Math.sin(angle - .55) * 16);
  ctx.lineTo(end.x, end.y); ctx.lineTo(end.x - Math.cos(angle + .55) * 16, end.y - Math.sin(angle + .55) * 16);
  ctx.strokeStyle = '#e2ffff'; ctx.lineWidth = 7; ctx.stroke(); ctx.strokeStyle = '#3cddf2'; ctx.lineWidth = 4; ctx.stroke();
  for (const point of overlay.waypoints) {
    const p = center(point); ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#e2ffff'; ctx.fill(); ctx.strokeStyle = '#147c99'; ctx.lineWidth = 2; ctx.stroke();
  }
  const actor = getUnit(state, overlay.actor)!;
  ctx.globalAlpha = .35; ctx.fillStyle = '#385b85';
  ctx.beginPath(); ctx.arc(end.x, end.y - 11, 23, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8e6e3'; ctx.textAlign = 'center'; ctx.font = '23px "Microsoft YaHei", sans-serif';
  ctx.fillText(Array.from(actor.name)[0]!, end.x, end.y - 3);
  ctx.globalAlpha = 1;
  for (const risk of overlay.risks) {
    const from = center(risk.from), to = center(risk.to);
    const x = Math.max(14, Math.min(658, (from.x + to.x) / 2 + 13)), y = Math.max(16, Math.min(464, (from.y + to.y) / 2 - 12));
    ctx.font = 'bold 23px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4;
    ctx.strokeStyle = '#17202b'; ctx.strokeText('!', x, y); ctx.fillStyle = '#ff626f'; ctx.fillText('!', x, y);
  }
  ctx.restore();
}
