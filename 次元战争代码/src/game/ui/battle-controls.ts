import type { BattleMode, BattleState, Command } from '../battle/types.js';
import { actionReason, playerAttack } from '../battle/battle.js';
import { active, currentUnit } from '../battle/state-helpers.js';
import { pathsFrom } from '../battle/grid.js';
import { button, element } from './elements.js';

export function renderControls(root: HTMLElement, state: BattleState, mode: BattleMode, setMode: (mode: BattleMode) => void, send: (command: Command) => void) {
  root.replaceChildren();
  const actor = currentUnit(state);
  root.hidden = actor.team !== 'player' || !active(actor) || Boolean(state.result || state.pendingMove || state.pendingReaction || state.pendingRoll || state.opening) || !['idle', 'skills'].includes(mode);
  if (root.hidden) return;
  const main = element('div', 'battle-main-buttons');
  function modeButton(label: string, kind: 'attack' | 'move' | 'skills') {
    const node = button(label, `mode-${kind}`, () => setMode(kind === 'skills' && mode === 'skills' ? 'idle' : kind));
    let reason = '';
    if (kind === 'attack') reason = !actor.resources.action ? '动作已用完' : !state.units.some(unit => playerAttack(state, actor, unit, 'action')) ? '当前没有合法攻击目标，先移动接近' : '';
    if (kind === 'move') reason = actor.resources.movement < 5 ? '移动力不足' : pathsFrom(state.grid, actor.position, state.units, actor.id, Math.floor(actor.resources.movement / 5)).size <= 1 ? '没有可到达的空格' : '';
    node.disabled = Boolean(reason); node.title = reason || label; main.append(node);
    if (reason) node.setAttribute('aria-label', `${label}：${reason}`);
  }
  modeButton('攻击', 'attack'); modeButton('移动', 'move'); modeButton('技能', 'skills'); root.append(main);
  if (mode === 'skills') {
    const skills = element('div', 'battle-skill-buttons');
    for (const [kind, label] of [['dash', '疾走'], ['disengage', '撤离'], ['dodge', '回避'], ['bonus', '附赠徒手'], ['end', '结束回合']] as const) {
      if (state.loop && kind === 'bonus' && !actor.features.includes('martial_arts')) continue;
      const earnedBonus = actor.resources.martialAttack || actor.features.includes('martial_arts_2024');
      const reason = kind === 'bonus' ? !actor.resources.bonus || !earnedBonus ? '未满足附赠徒手条件，或附赠动作已用完'
        : !state.units.some(unit => playerAttack(state, actor, unit, 'bonus')) ? '没有合法附赠攻击目标，先移动接近' : '' : actionReason(state, { kind, actor: actor.id }, 'player');
      const node = button(label, `skill-${kind}`, () => kind === 'bonus' ? setMode('bonus') : send({ kind, actor: actor.id }));
      node.disabled = Boolean(reason); node.title = reason || label;
      if (reason) node.setAttribute('aria-label', `${label}：${reason}`);
      skills.append(node);
    }
    if (state.loop) skills.append(button('能力与道具', 'battle-open-abilities', () => setMode('abilities')));
    root.append(skills);
  }
  const height = mode === 'skills' ? state.loop ? 260 : 210 : 58;
  root.style.left = `${Math.max(304, Math.min(696, 304 + actor.position.col * 96 + 48 - 140))}px`;
  root.style.top = `${Math.max(116, Math.min(720 - height - 10, 116 + actor.position.row * 96 + 94))}px`;
}
