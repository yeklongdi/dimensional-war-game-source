import type { BattleMode, BattleState } from './types.js';
import { key, occupies } from './grid.js';
import type { MovementOverlay } from './movement-preview.js';
import { renderMovement } from './render-movement.js';
import { actionReason } from './battle.js';
import { active, currentUnit } from './state-helpers.js';

export function renderBoard(canvas: HTMLCanvasElement, state: BattleState, mode: BattleMode, overlay?: MovementOverlay) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('当前浏览器无法创建 Canvas 2D');
  const ratio = window.devicePixelRatio || 1;
  if (canvas.width !== 672 * ratio || canvas.height !== 480 * ratio) { canvas.width = 672 * ratio; canvas.height = 480 * ratio; }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, 672, 480);
  const actor = currentUnit(state);
  const playerReady = actor.team === 'player' && active(actor) && !state.pendingMove && !state.pendingReaction && !state.result;
  const reachable = new Set(overlay?.reachable.map(key));
  for (let row = 0; row < 5; row++) for (let col = 0; col < 7; col++) {
    const x = col * 96, y = row * 96, terrain = state.grid.tiles[row * 7 + col];
    ctx.fillStyle = (row + col) % 2 ? '#182332' : '#141e2b'; ctx.fillRect(x, y, 96, 96);
    if (reachable.has(key({ col, row }))) { ctx.fillStyle = '#2b79c44d'; ctx.fillRect(x + 2, y + 2, 92, 92); }
    ctx.strokeStyle = '#405167'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, 95, 95);
    ctx.fillStyle = '#738297'; ctx.font = '11px Consolas, monospace'; ctx.textAlign = 'left'; ctx.fillText(`${col},${row}`, x + 6, y + 14);
    if (terrain === 'wall') {
      ctx.fillStyle = '#5d6574'; ctx.fillRect(x + 8, y + 8, 80, 80);
      ctx.strokeStyle = '#2b3341'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x + 8, y + 28 + i * 22); ctx.lineTo(x + 88, y + 28 + i * 22); ctx.stroke(); }
    } else if (terrain === 'crate') {
      ctx.fillStyle = '#695139'; ctx.fillRect(x + 16, y + 16, 64, 64); ctx.strokeStyle = '#b29766'; ctx.lineWidth = 2; ctx.strokeRect(x + 16, y + 16, 64, 64);
      ctx.beginPath(); ctx.moveTo(x + 17, y + 17); ctx.lineTo(x + 79, y + 79); ctx.moveTo(x + 79, y + 17); ctx.lineTo(x + 17, y + 79); ctx.stroke();
    }
  }
  renderMovement(ctx, state, overlay);
  for (const unit of [...state.units].sort((a, b) => Number(occupies(a)) - Number(occupies(b)))) {
    const x = unit.position.col * 96, y = unit.position.row * 96;
    ctx.globalAlpha = occupies(unit) ? 1 : .35;
    if (actor.id === unit.id) { ctx.strokeStyle = '#d8b45a'; ctx.lineWidth = 3; ctx.strokeRect(x + 4, y + 4, 88, 88); }
    const resource = mode === 'bonus' ? 'bonus' : 'action';
    const attack = actor.attacks.find(item => resource === 'bonus' ? item.id === 'unarmed' : true);
    if (playerReady && ['attack', 'bonus'].includes(mode) && attack && !actionReason(state, { kind: 'attack', actor: actor.id, target: unit.id, attackId: attack.id, resource }, 'player')) {
      ctx.strokeStyle = '#df6464'; ctx.lineWidth = 3; ctx.strokeRect(x + 7, y + 7, 82, 82);
    }
    ctx.fillStyle = unit.team === 'player' ? '#385b85' : '#773d46';
    ctx.beginPath(); ctx.arc(x + 48, y + 37, 23, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = 'center'; ctx.fillStyle = '#e8e6e3'; ctx.font = '23px "Microsoft YaHei", sans-serif'; ctx.fillText(Array.from(unit.name)[0]!, x + 48, y + 45);
    ctx.font = '12px "Microsoft YaHei", sans-serif'; ctx.fillText(unit.name, x + 48, y + 68);
    ctx.fillStyle = '#09101b'; ctx.fillRect(x + 14, y + 76, 68, 7); ctx.fillStyle = '#74a78a'; ctx.fillRect(x + 14, y + 76, 68 * unit.hp / unit.maxHp, 7);
    if (unit.tempHp) { ctx.fillStyle = '#6fbfdd'; ctx.fillRect(x + 14, y + 85, Math.min(68, unit.tempHp / unit.maxHp * 68), 3); }
    if (unit.status !== 'active') { ctx.fillStyle = '#f2c79a'; ctx.font = '11px "Microsoft YaHei", sans-serif'; ctx.fillText(unit.status === 'unconscious' ? '昏迷·倒地' : unit.status === 'dead' ? '死亡' : unit.status === 'stable' ? '稳定' : '击败', x + 48, y + 14); }
  }
  ctx.globalAlpha = 1;
}
