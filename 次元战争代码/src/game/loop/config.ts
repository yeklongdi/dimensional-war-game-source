import type { LocationId } from '../../content/map-locations.js';
import type { AbilityId } from '../battle/types.js';
import type { CantripId, ClassId, EventId, FighterStyle, ItemId, Slot, SpellId, WeaponId } from './types.js';

/** 演示暂定配置，供实测调参。正式周期、报酬和商店定价待确认。 */
export const demo = {
  days: [10, 10], gold: 20, linkInitial: 2, linkAfterShort: 1, linkAfterLong: 2,
  divineAid: 3, jobReward: 10, requestReward: 16, battleReward: 12, bossReward: 25,
} as const;
export const demoTitle = '序幕后玩法演示';
export const slots = ['after_school', 'evening', 'night'] as const;
export const slotNames: Record<Slot, string> = { after_school: '放学后', evening: '傍晚', night: '夜晚' };
export const classNames: Record<ClassId, string> = { monk: '武僧', fighter: '战士', wizard: '法师', sorcerer: '术士' };
export const items: Record<ItemId, { name: string; price: number; description: string }> = {
  healing_potion: { name: '治疗药水', price: 10, description: '附赠动作，恢复自己或邻近同伴 2d4+2 HP' },
  missile_scroll: { name: '魔法飞弹卷轴', price: 18, description: '法师、术士可用，主动作施放，无需法术位' },
  acid: { name: '强酸', price: 14, description: '主动作，4 格内一名敌人进行敏捷豁免' },
};
export const weapons: Record<WeaponId, string> = { longsword: '长剑', shortsword: '短剑', javelin: '标枪', shortbow: '短弓' };
export const styles: Record<FighterStyle, string> = { defense: '防御', archery: '箭术', dueling: '对决' };
export const cantripNames: Record<CantripId, string> = {
  fire_bolt: '火焰箭', ray_of_frost: '冷冻射线', shocking_grasp: '电爪',
  poison_spray: '毒气喷涌', acid_splash: '酸液飞溅', sorcerous_burst: '术法爆发',
};
export const spellNames: Record<SpellId, string> = {
  magic_missile: '魔法飞弹', burning_hands: '燃烧之手', mage_armor: '法师护甲',
  false_life: '虚假生命', detect_magic: '侦测魔法',
};
export const battleSpells = ['magic_missile', 'burning_hands', 'mage_armor', 'false_life'] as const;
export const wizardBook = [...battleSpells, 'detect_magic'] as const;
export const commonCantrips = ['fire_bolt', 'ray_of_frost', 'shocking_grasp', 'poison_spray', 'acid_splash'] as const;
export const casterOptions = {
  wizard: { cantrips: commonCantrips, prepared: wizardBook, cantripCount: 3, spellCount: 4 },
  sorcerer: { cantrips: [...commonCantrips, 'sorcerous_burst'], prepared: battleSpells, cantripCount: 4, spellCount: 2 },
} as const;

export type CityEvent = {
  id: EventId; label: string; location: LocationId; slot: Slot;
  once?: true; reward?: number; clue?: true; battle?: 'patrol'; requires?: EventId;
};
export const events: readonly CityEvent[] = [
  { id: 'social', label: '角色日常', location: 'high_school', slot: 'after_school', once: true },
  { id: 'intel', label: '收集情报', location: 'high_school', slot: 'after_school', once: true, clue: true },
  { id: 'joint', label: '特殊联动', location: 'high_school', slot: 'after_school', once: true, requires: 'social' },
  { id: 'school_request', label: '校内委托', location: 'high_school', slot: 'after_school', once: true, reward: demo.requestReward },
  { id: 'school_patrol', label: '校内清怪', location: 'high_school', slot: 'after_school', battle: 'patrol' },
  { id: 'ritual', label: '仪式调查 · 侦测魔法', location: 'high_school', slot: 'after_school', once: true, clue: true },
  { id: 'job', label: '傍晚打工', location: 'school_road', slot: 'evening', reward: demo.jobReward },
  { id: 'street_request', label: '街区委托', location: 'school_road', slot: 'evening', once: true, reward: demo.requestReward },
  { id: 'street_patrol', label: '旧街区巡逻', location: 'old_warehouse', slot: 'evening', battle: 'patrol' },
];
export const interludeId = (cycle: number, moment: 'night' | 'dawn') => 'cycle_' + (cycle + 1) + '_' + moment;
export const encounterNames = { patrol: '日常遭遇', first: '第一战 · 近战', second: '第二战 · 远程', boss: '关底战' } as const;
/** 正式同步率门槛确认后在此按能力登记。 */
export const linkAbilityMinSync: Readonly<Partial<Record<AbilityId, number>>> = {};
export const deferredAbilities = {
  shield: { timing: 'reaction', target: 'self' },
  legendary_resistance: { timing: 'failed_save', target: 'self' },
  blinding_gaze: { timing: 'after_turn', target: 'creature' },
  radiant_teleport: { timing: 'after_turn', target: 'cell' },
  grapple: { timing: 'unarmed_strike', target: 'creature' },
  shove: { timing: 'unarmed_strike', target: 'creature' },
  thunderwave: { timing: 'action', target: 'area', movesTargets: true },
} as const;
