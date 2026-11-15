import { combatants } from '../battle/definitions.js';
import type { Attack, Combatant } from '../battle/types.js';
import { casterOptions, weapons } from './config.js';
import type { BuildChoice, CasterBuild, ClassId, FighterBuild, HeroProgress, WeaponId } from './types.js';

/** 演示暂定属性表。序幕使用既有 combatants.json。 */
const abilityScores: Record<ClassId, Combatant['abilities']> = {
  monk: { str: 8, dex: 15, con: 14, int: 10, wis: 15, cha: 8 },
  fighter: { str: 15, dex: 14, con: 13, int: 10, wis: 12, cha: 8 },
  wizard: { str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10 },
  sorcerer: { str: 8, dex: 14, con: 13, int: 10, wis: 12, cha: 15 },
};
export const hitDie: Record<ClassId, number> = { monk: 8, fighter: 10, wizard: 6, sorcerer: 6 };
export const modifier = (score: number | null) => Math.floor(((score ?? 10) - 10) / 2);
export const constitution = (id: ClassId) => modifier(abilityScores[id].con);
export const maxHp = (id: ClassId) => hitDie[id] + constitution(id);
const heroTemplate = combatants.find(unit => unit.id === 'hero')!;
const weaponData: Record<WeaponId, Pick<Attack, 'kind' | 'damageType' | 'mastery' | 'reach' | 'range'>> = {
  longsword: { kind: 'melee', damageType: 'slashing', reach: 1, mastery: 'sap' },
  shortsword: { kind: 'melee', damageType: 'piercing', reach: 1, mastery: 'vex' },
  javelin: { kind: 'melee', damageType: 'piercing', reach: 1, mastery: 'slow' },
  shortbow: { kind: 'ranged', damageType: 'piercing', range: { normal: 16, max: 64 }, mastery: 'vex' },
};

function fighterWeapon(build: FighterBuild, abilities: Combatant['abilities']): Attack[] {
  const id = build.weapon, ranged = id === 'shortbow';
  const mod = modifier(ranged || id === 'shortsword' ? abilities.dex : abilities.str);
  const data = weaponData[id];
  const attack: Attack = {
    ...data, id, name: weapons[id], bonus: mod + 2 + (ranged && build.style === 'archery' ? 2 : 0),
    damage: (id === 'longsword' ? '1d8+' : '1d6+') + (mod + (!ranged && build.style === 'dueling' ? 2 : 0)),
    mastery: build.mastery.includes(id) ? data.mastery : undefined,
  };
  return id === 'javelin' ? [attack, { ...attack, id: 'throw_javelin', name: '投掷标枪', kind: 'ranged', reach: undefined, range: { normal: 6, max: 24 } }] : [attack];
}

export function assembleHero(progress: HeroProgress): Combatant {
  const id = progress.classId, abilities = abilityScores[id];
  const dex = modifier(abilities.dex);
  const punch: Attack = { ...heroTemplate.attacks[0]!, bonus: dex + 2, damage: '1d6+2' };
  const dagger: Attack = { id: 'dagger', name: '匕首', kind: 'melee', bonus: dex + 2, damage: '1d4+' + dex, damageType: 'piercing', reach: 1 };
  const attacks = id === 'fighter' ? fighterWeapon(progress.fighter, abilities) : id === 'monk' ? [punch] : [dagger];
  if (id === 'fighter' && attacks[0]?.kind === 'ranged') attacks.push(dagger);
  const ac = id === 'fighter' ? 16 + Number(progress.fighter.style === 'defense')
    : id === 'monk' ? Math.max(10 + dex + modifier(abilities.wis), progress.mageArmor ? 13 + dex : 0)
      : (progress.mageArmor ? 13 : 10) + dex;
  const features = id === 'monk' ? ['death_saves', 'martial_arts', 'martial_arts_2024'] : ['death_saves', 'loop_bonus'];
  return { ...heroTemplate, abilities: { ...abilities }, ac, maxHp: maxHp(id), attacks, features, saveProficiencies: saveProficiencies[id] };
}

const saveProficiencies: Record<ClassId, readonly ('str' | 'dex' | 'con' | 'int' | 'wis' | 'cha')[]> = {
  monk: ['str', 'dex'], fighter: ['str', 'con'], wizard: ['int', 'wis'], sorcerer: ['con', 'cha'],
};
export const defaultFighter: FighterBuild = { style: 'defense', weapon: 'longsword', mastery: ['longsword', 'javelin', 'shortbow'] };
export const defaultWizard: CasterBuild = {
  cantrips: ['fire_bolt', 'ray_of_frost', 'shocking_grasp'],
  prepared: ['magic_missile', 'burning_hands', 'mage_armor', 'false_life'],
};
export const defaultSorcerer: CasterBuild = {
  cantrips: ['sorcerous_burst', 'fire_bolt', 'shocking_grasp', 'acid_splash'], prepared: ['magic_missile', 'burning_hands'],
};
export function initialHero(): HeroProgress {
  return {
    classId: 'monk', hp: maxHp('monk'), tempHp: 0, mageArmor: false, hitDie: 1,
    fighter: structuredClone(defaultFighter), wizard: structuredClone(defaultWizard), sorcerer: structuredClone(defaultSorcerer),
    wind: 2, wizardSlots: 2, recovery: true, sorcererSlots: 2, innate: 2,
  };
}
const distinct = <T>(values: readonly T[], size: number, allowed: readonly T[]) =>
  values.length === size && new Set(values).size === size && values.every(value => allowed.includes(value));
export function validBuild(choice: BuildChoice): boolean {
  if (choice.classId === 'monk') return true;
  if (choice.classId === 'fighter') {
    const { mastery, style, weapon } = choice.build;
    const available = Object.keys(weapons);
    return ['defense', 'archery', 'dueling'].includes(style) && available.includes(weapon) && distinct(mastery, 3, available);
  }
  const specs = casterOptions[choice.classId];
  return distinct(choice.build.cantrips, specs.cantripCount, specs.cantrips)
    && distinct(choice.build.prepared, specs.spellCount, specs.prepared);
}
export function respec(hero: HeroProgress, choice: BuildChoice): HeroProgress {
  const next = { ...hero, classId: choice.classId, hp: Math.min(hero.hp, maxHp(choice.classId)), mageArmor: hero.mageArmor && choice.classId !== 'fighter' };
  return choice.classId === 'monk' ? next : { ...next, [choice.classId]: structuredClone(choice.build) };
}
