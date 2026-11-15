import { actionReason } from '../battle/battle.js';
import { abilityBudget, abilityOptions, burstNames } from '../battle/loop-abilities.js';
import { currentUnit } from '../battle/state-helpers.js';
import type { AbilityCommand, AbilityId, BattleState, BurstDamage, Command } from '../battle/types.js';
import { button, element } from './elements.js';

/** 回合内选定能力与目标，提交时沿用现有 battle token。 */
export function renderAbilityPanel(root: HTMLElement, state: BattleState, open: boolean, send: (command: Command) => void, close: () => void) {
  root.hidden = !open || !state.loop;
  root.replaceChildren();
  if (root.hidden) return;
  const actor = currentUnit(state), abilities = abilityOptions(state, actor);
  const picker = element('select'), target = element('select'), damage = element('select');
  picker.dataset.testid = 'battle-ability-select'; target.dataset.testid = 'battle-ability-target';
  damage.setAttribute('aria-label', '术法爆发伤害类型');
  for (const { id, spec } of abilities) {
    const label = spec.name + ' · ' + (spec.resource === 'action' ? '主动作' : '附赠动作') + abilityBudget(state, actor, id);
    const option = element('option', '', label); option.value = id; picker.append(option);
  }
  for (const [id, name] of Object.entries(burstNames)) {
    const option = element('option', '', name); option.value = id; damage.append(option);
  }
  damage.value = 'fire';
  let choices: { label: string; action: AbilityCommand }[] = [];
  const feedback = element('p', 'battle-ability-note');
  const submit = button('使用', 'battle-ability-use', () => {
    const selected = choices[Number(target.value)]?.action;
    if (selected) send(selected.ability === 'sorcerous_burst' ? { ...selected, burstDamage: damage.value as BurstDamage } : selected);
  });
  const targetLabel = element('label', 'loop-field', '目标'), damageLabel = element('label', 'loop-field', '伤害类型');
  const abilityLabel = element('label', 'loop-field', '能力或道具');
  abilityLabel.append(picker); targetLabel.append(target); damageLabel.append(damage);
  function update() {
    const id = picker.value as AbilityId, spec = abilities.find(item => item.id === id)?.spec;
    choices = [];
    const command: AbilityCommand = { kind: 'ability', actor: actor.id, ability: id };
    const push = (label: string, action: AbilityCommand) => {
      if (!actionReason(state, action, 'player')) choices.push({ label, action });
    };
    if (spec?.aim === 'self') push(actor.name, command);
    else if (spec?.aim === 'area' || spec?.aim === 'cone') {
      for (let row = 0; row < state.grid.height; row++) for (let col = 0; col < state.grid.width; col++)
        push('格 ' + col + ',' + row, { ...command, point: { col, row } });
    } else if (spec) for (const unit of state.units) push(unit.name + ' · HP ' + unit.hp + '/' + unit.maxHp,
      { ...command, target: unit.id });
    target.replaceChildren();
    for (const [index, candidate] of choices.entries()) {
      const option = element('option', '', candidate.label); option.value = String(index); target.append(option);
    }
    targetLabel.hidden = spec?.aim === 'self' || !choices.length; damageLabel.hidden = id !== 'sorcerous_burst';
    submit.disabled = !choices.length;
    feedback.textContent = !choices.length ? actionReason(state, command, 'player') || '当前没有符合条件的目标'
      : (spec?.aim === 'area' || spec?.aim === 'cone') ? '范围效果也会影响范围内的友方单位。' : '';
  }
  picker.addEventListener('change', update);
  root.append(element('h2', '', '能力与道具'), abilityLabel, targetLabel, damageLabel, feedback, submit,
    button('取消', 'battle-ability-close', close));
  update();
}
