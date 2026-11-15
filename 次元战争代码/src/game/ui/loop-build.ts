import type { GameState } from '../state.js';
import { assembleHero, validBuild } from '../loop/characters.js';
import { cantripNames, casterOptions, classNames, spellNames, styles, weapons } from '../loop/config.js';
import type { BuildChoice, ClassId } from '../loop/types.js';
import { button, element } from './elements.js';

function select<T extends string>(label: string, options: Readonly<Record<T, string>>, selected: T, changed: (value: T) => void) {
  const row = element('label', 'loop-field', label), select = element('select');
  for (const id of Object.keys(options) as T[]) {
    const option = element('option', '', options[id]); option.value = id; select.append(option);
  }
  select.value = selected;
  select.addEventListener('change', () => changed(select.value as T));
  row.append(select); return row;
}

function checkboxes<T extends string>(title: string, ids: readonly T[], names: Readonly<Record<T, string>>, selected: readonly T[],
  changed: (id: T, checked: boolean) => void) {
  const field = element('fieldset', 'loop-checks');
  field.append(element('legend', '', title));
  for (const id of ids) {
    const label = element('label', 'loop-checkbox'), input = element('input');
    input.type = 'checkbox'; input.checked = selected.includes(id);
    input.addEventListener('change', () => changed(id, input.checked));
    label.append(input, document.createTextNode(names[id])); field.append(label);
  }
  return field;
}
function toggle<T>(values: T[], id: T, checked: boolean) {
  return checked ? [...values, id] : values.filter(value => value !== id);
}

export function buildPicker(state: GameState, apply: (choice: BuildChoice) => void): HTMLElement {
  const hero = state.postPrologue!.hero, drafts = structuredClone(hero);
  let choice = hero.classId;
  const section = element('section', 'loop-configure');
  const result = element('div', 'loop-configure-options');
  const summary = element('p', 'loop-build-stats');
  const selection = (): BuildChoice => {
    switch (choice) {
      case 'monk': return { classId: 'monk' };
      case 'fighter': return { classId: 'fighter', build: drafts.fighter };
      case 'wizard': return { classId: 'wizard', build: drafts.wizard };
      case 'sorcerer': return { classId: 'sorcerer', build: drafts.sorcerer };
    }
  };
  const confirm = button('确认洗点 · 1 时段', 'loop-respec-confirm', () => apply(selection()));
  function refresh() {
    const preview = assembleHero({ ...drafts, classId: choice });
    summary.textContent = '1 级 · 生命上限 ' + preview.maxHp + ' · AC ' + preview.ac + ' · 主要攻击 ' + preview.attacks[0]!.name;
    confirm.disabled = !validBuild(selection()) || state.progress?.status === 'saving';
  }
  function renderOptions() {
    result.replaceChildren();
    if (choice === 'monk') result.append(element('p', '', '无甲防御、敏捷徒手与附赠徒手伤害。'));
    if (choice === 'fighter') {
      const build = drafts.fighter;
      result.append(select('战斗风格', styles, build.style, value => { build.style = value; refresh(); }),
        select('武器', weapons, build.weapon, value => { build.weapon = value; refresh(); }),
        checkboxes('选择 3 项武器精通', Object.keys(weapons) as (keyof typeof weapons)[], weapons, build.mastery,
          (id, checked) => { build.mastery = toggle(build.mastery, id, checked); refresh(); }));
    }
    if (choice === 'wizard' || choice === 'sorcerer') {
      const build = drafts[choice], options = casterOptions[choice];
      result.append(checkboxes('选择 ' + options.cantripCount + ' 个戏法', options.cantrips, cantripNames, build.cantrips,
        (id, checked) => { build.cantrips = toggle(build.cantrips, id, checked); refresh(); }),
      checkboxes('准备 ' + options.spellCount + ' 道一环法术', options.prepared, spellNames, build.prepared,
        (id, checked) => { build.prepared = toggle(build.prepared, id, checked); refresh(); }));
      if (choice === 'wizard') result.append(element('p', '', '侦测魔法可在学校的演示调查中以仪式释放。'));
    }
    refresh();
  }
  section.append(select('选择职业', classNames, choice, (value: ClassId) => { choice = value; renderOptions(); }),
    result, summary, confirm);
  renderOptions(); return section;
}
