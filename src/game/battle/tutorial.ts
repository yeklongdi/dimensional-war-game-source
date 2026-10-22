import type { BattleState, TutorialNotice } from './types.js';
import { active, currentUnit, emit } from './state-helpers.js';
import { pathsFrom } from './grid.js';
import { attackContext } from './rules.js';

export const tutorialText: Record<TutorialNotice, string> = {
  move: '点击蓝色格规划，再确认移动', attack: '点敌人攻击', bonus: '还能用附赠动作再打一拳',
};
export function updateTutorial(state: BattleState): BattleState {
  if (!state.tutorial || state.result || state.pendingMove || state.pendingRoll || state.pendingReaction || state.opening) return state;
  const hero = currentUnit(state);
  if (hero.team !== 'player' || !active(hero)) return state;
  const seen = state.tutorial.seen;
  let notice: TutorialNotice | undefined;
  if (!seen.includes('move') && state.round === 1 && hero.resources.movement >= 5 && pathsFrom(state.grid, hero.position, state.units, hero.id, 1).size > 1) notice = 'move';
  else if (!seen.includes('attack') && hero.resources.action && state.units.some(target => attackContext(state, hero, target, hero.attacks[0]!).legal)) notice = 'attack';
  else if (!seen.includes('bonus') && hero.resources.martialAttack && hero.resources.bonus) notice = 'bonus';
  if (!notice) return state;
  return emit({ ...state, tutorial: { seen: [...seen, notice], notice } }, { kind: 'tutorial', notice });
}
