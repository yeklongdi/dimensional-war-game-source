import { burstNames } from '../battle/loop-abilities.js';
import type { BurstDamage } from '../battle/types.js';
import { actionIcon } from './battle-action-icons.js';
import type { AbilityChoice, ActionEntry } from './battle-action-model.js';
import { button, element } from './elements.js';

export type AbilitySelection = { choice?: AbilityChoice; damage: BurstDamage };

/** 目标与伤害类型都直接展开；选择只更新界面，确认时才提交命令。 */
export function renderAbilityPanel(root: HTMLElement, entry: ActionEntry | undefined, choices: readonly AbilityChoice[], selection: AbilitySelection,
  pick: (choice: AbilityChoice) => void, damage: (type: BurstDamage) => void, use: () => void, close: () => void) {
  root.hidden = !entry; root.replaceChildren();
  if (!entry) return;
  const heading = element('div', 'ability-detail-heading');
  const icon = element('span', 'ability-detail-icon'); icon.dataset.tone = entry.tone; icon.append(actionIcon(entry.icon));
  const cancel = button('关闭', 'battle-ability-close', close); cancel.setAttribute('aria-label', '关闭技能详情');
  heading.append(icon, element('h2', '', entry.name), cancel);
  root.append(heading, element('p', 'ability-detail-cost', entry.cost), element('p', 'ability-detail-description', entry.description));
  if (entry.budget) root.append(element('p', 'ability-detail-budget', '剩余：' + entry.budget));
  if (entry.ability === 'sorcerous_burst') {
    const group = element('div', 'ability-damage-options'); group.setAttribute('role', 'group'); group.setAttribute('aria-label', '术法爆发伤害类型');
    for (const [id, name] of Object.entries(burstNames)) {
      const option = button(name, 'burst-' + id, () => damage(id as BurstDamage));
      option.setAttribute('aria-pressed', String(selection.damage === id)); group.append(option);
    }
    root.append(element('h3', '', '伤害类型'), group);
  }
  const aimed = choices.some(choice => choice.command.point);
  root.append(element('h3', '', aimed ? '选择施放位置' : '选择目标'));
  const targets = element('div', 'ability-target-options'); targets.setAttribute('role', 'group'); targets.setAttribute('aria-label', '技能目标');
  if (!aimed) for (const choice of choices) {
    const target = button(choice.label, 'ability-target-' + (choice.command.target ?? 'self'), () => pick(choice));
    target.setAttribute('aria-pressed', String(selection.choice === choice)); targets.append(target);
  }
  root.append(targets);
  const note = element('p', 'battle-ability-note', entry.reason || (selection.choice ? '已选：' + selection.choice.label
    : aimed ? '点击棋盘上有金色边框的格子，选择方向或范围中心。' : '点击棋盘上的金色目标，或在上方选择目标。'));
  note.dataset.testid = 'battle-ability-feedback'; note.setAttribute('role', 'status'); root.append(note);
  const submit = button('确认使用', 'battle-ability-use', use);
  submit.disabled = Boolean(entry.reason || !selection.choice);
  root.append(submit);
}
