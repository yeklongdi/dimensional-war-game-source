import { actionReason, playerAttack } from '../battle/battle.js';
import { abilityBudget, abilityOptions } from '../battle/loop-abilities.js';
import { pathsFrom, same } from '../battle/grid.js';
import { active, currentUnit } from '../battle/state-helpers.js';
import type { AbilityCommand, AbilityId, BattleMode, BattleState, Command, Point } from '../battle/types.js';
import { cantripNames, items, spellNames } from '../loop/config.js';
import type { ActionIcon } from './battle-action-icons.js';
import { abilityPresentation } from './battle-action-copy.js';

export type ActionCategory = 'all' | 'skills' | 'cantrips' | 'spells' | 'items';
export const actionCategories: readonly { id: ActionCategory; label: string }[] = [
  { id: 'all', label: '全部' }, { id: 'skills', label: '技能' }, { id: 'cantrips', label: '戏法' },
  { id: 'spells', label: '一环' }, { id: 'items', label: '道具' },
];
export type AbilityChoice = { label: string; command: AbilityCommand; point: Point };
export type ActionEntry = {
  id: string; name: string; shortName?: string; icon: ActionIcon; tone: string;
  cost: string; description: string; reason: string; category: Exclude<ActionCategory, 'all'>;
  badge?: string; budget?: string; ability?: AbilityId; mode?: BattleMode; command?: Command;
};

export function canUseActionBar(state: BattleState) {
  const actor = currentUnit(state);
  return actor.team === 'player' && active(actor)
    && !Boolean(state.result || state.pendingMove || state.pendingReaction || state.pendingRoll || state.opening || state.awaitingEnd);
}

export function abilityChoices(state: BattleState, id: AbilityId): AbilityChoice[] {
  const actor = currentUnit(state), spec = abilityOptions(state, actor).find(option => option.id === id)?.spec;
  if (!spec || !canUseActionBar(state)) return [];
  const base: AbilityCommand = { kind: 'ability', actor: actor.id, ability: id }, choices: AbilityChoice[] = [];
  const push = (label: string, command: AbilityCommand, point: Point) => {
    if (!actionReason(state, command, 'player')) choices.push({ label, command, point });
  };
  if (spec.aim === 'self') push(actor.name, base, actor.position);
  else if (spec.aim === 'area' || spec.aim === 'cone') {
    for (let row = 0; row < state.grid.height; row++) for (let col = 0; col < state.grid.width; col++) {
      const point = { col, row };
      push((spec.aim === 'cone' ? '方向' : '中心') + ` (${col},${row})`, { ...base, point }, point);
    }
  } else for (const unit of state.units) push(`${unit.name} · HP ${unit.hp}/${unit.maxHp}`, { ...base, target: unit.id }, unit.position);
  return choices;
}

export function abilityEntries(state: BattleState): ActionEntry[] {
  const actor = currentUnit(state);
  return abilityOptions(state, actor).map(({ id, spec }) => {
    const category = Object.hasOwn(items, id) ? 'items' : Object.hasOwn(cantripNames, id) ? 'cantrips'
      : Object.hasOwn(spellNames, id) ? 'spells' : 'skills';
    const budget = abilityBudget(state, actor, id).replace(/^ · /, '');
    const choices = abilityChoices(state, id);
    const base: AbilityCommand = { kind: 'ability', actor: actor.id, ability: id };
    const reason = choices.length ? '' : actionReason(state, base, 'player');
    const missingTarget = ['请选择仍在场的单位', '选择有效的方向或范围中心'].includes(reason);
    const badge = category === 'items' ? String(state.loop!.items[id as keyof typeof items])
      : category === 'spells' ? 'Ⅰ' : category === 'cantrips' ? '〇' : spec.resource === 'bonus' ? '附' : '动';
    return { id, name: spec.name, ...abilityPresentation[id], category, ability: id, badge, budget,
      cost: (spec.resource === 'bonus' ? '附赠动作' : '主动作')
        + (category === 'spells' ? ' · 一环法术位' : category === 'cantrips' ? ' · 不消耗法术位' : category === 'items' ? ' · 消耗 1 件' : '')
        + (spec.range ? ` · ${spec.range * 5} 尺` : ' · 自身'),
      reason: !choices.length && (missingTarget || !reason) ? '当前没有符合射程、视线或状态条件的目标' : reason };
  });
}

export function commonEntries(state: BattleState): ActionEntry[] {
  const actor = currentUnit(state), earnedBonus = actor.resources.martialAttack || actor.features.includes('martial_arts_2024');
  const attackReason = (resource: 'action' | 'bonus') => !canUseActionBar(state) ? '当前不能操作'
    : resource === 'action' && !actor.resources.action ? '主动作已用完'
    : resource === 'bonus' && (!actor.resources.bonus || !earnedBonus) ? '需要满足武艺条件，且附赠动作尚未使用'
    : state.units.some(unit => playerAttack(state, actor, unit, resource)) ? '' : '没有合法攻击目标，先移动接近';
  const moveReason = !canUseActionBar(state) ? '当前不能操作' : actor.resources.movement < 5 ? '移动力不足'
    : pathsFrom(state.grid, actor.position, state.units, actor.id, Math.floor(actor.resources.movement / 5)).size <= 1 ? '没有可到达的空格' : '';
  const entries: ActionEntry[] = [
    { id: 'attack', name: '攻击', icon: 'sword', tone: 'gold', cost: '主动作', mode: 'attack', reason: attackReason('action'), category: 'skills',
      description: `使用${actor.attacks[0]?.name ?? '武器'}攻击目标；点选后在棋盘上选择红框敌人。` },
    { id: 'move', name: '移动', icon: 'move', tone: 'cold', cost: `剩余 ${actor.resources.movement} 尺`, mode: 'move', reason: moveReason, category: 'skills',
      description: '在棋盘上规划路线，确认后执行移动。' },
  ];
  for (const [id, name, icon, description] of [
    ['dash', '疾走', 'dash', '消耗主动作，增加本回合的可用移动距离。'],
    ['disengage', '撤离', 'disengage', '消耗主动作，本回合移动不触发借机攻击。'],
    ['dodge', '回避', 'shield', '消耗主动作进入回避状态，使针对自己的攻击具有劣势，并使敏捷豁免具有优势。'],
  ] as const) entries.push({ id, name, icon, tone: 'gold', cost: '主动作', description, category: 'skills',
    reason: actionReason(state, { kind: id, actor: actor.id }, 'player'), command: { kind: id, actor: actor.id } });
  if (actor.features.includes('martial_arts')) entries.push({ id: 'bonus', name: '附赠徒手', icon: 'fist', tone: 'healing', cost: '附赠动作',
    description: '使用武艺的附赠徒手攻击；是否可用由当前职业与本回合行动决定。', category: 'skills', mode: 'bonus', reason: attackReason('bonus') });
  return entries;
}

export function choiceAt(choices: readonly AbilityChoice[], point: Point) { return choices.find(choice => same(choice.point, point)); }

export function actionPage(entries: readonly ActionEntry[], category: ActionCategory, page: number, query = '', size = 14) {
  const filtered = entries.filter(entry => (category === 'all' || entry.category === category) && entry.name.includes(query.trim()));
  const pages = Math.max(1, Math.ceil(filtered.length / size)), current = Math.max(0, Math.min(page, pages - 1));
  return { entries: filtered.slice(current * size, (current + 1) * size), total: filtered.length, page: current, pages };
}
