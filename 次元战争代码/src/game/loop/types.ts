import type { RngState } from '../battle/types.js';

export type Slot = 'after_school' | 'evening' | 'night';
export type ClassId = 'monk' | 'fighter' | 'wizard' | 'sorcerer';
export type ItemId = 'healing_potion' | 'missile_scroll' | 'acid';
export type EncounterId = 'patrol' | 'first' | 'second' | 'boss';
export type EventId = 'social' | 'intel' | 'joint' | 'school_request' | 'street_request' | 'job' | 'school_patrol' | 'street_patrol' | 'ritual';
export type CantripId = 'fire_bolt' | 'ray_of_frost' | 'shocking_grasp' | 'poison_spray' | 'acid_splash' | 'sorcerous_burst';
export type SpellId = 'magic_missile' | 'burning_hands' | 'mage_armor' | 'false_life' | 'detect_magic';
export type FighterStyle = 'defense' | 'archery' | 'dueling';
export type WeaponId = 'longsword' | 'shortsword' | 'javelin' | 'shortbow';
export type FighterBuild = { style: FighterStyle; weapon: WeaponId; mastery: WeaponId[] };
export type CasterBuild = { cantrips: CantripId[]; prepared: SpellId[] };
export type BuildChoice = { classId: 'monk' }
  | { classId: 'fighter'; build: FighterBuild }
  | { classId: 'wizard' | 'sorcerer'; build: CasterBuild };

export type Phase = { kind: 'intro' | 'city' | 'crisis' | 'settlement' | 'complete' }
  | { kind: 'interlude'; moment: 'night' | 'dawn' }
  | { kind: 'safe'; rested: boolean }
  | { kind: 'deploy'; encounter: EncounterId };

export type HeroProgress = {
  classId: ClassId; hp: number; tempHp: number; mageArmor: boolean; hitDie: number;
  fighter: FighterBuild; wizard: CasterBuild; sorcerer: CasterBuild;
  wind: number; wizardSlots: number; recovery: boolean; sorcererSlots: number; innate: number;
};
export type LoopCheckpoint = {
  cycle: number; day: number; slot: Slot; phase: Phase; rng: RngState;
  gold: number; xp: number; sync: number; linkUses: number; divineAid: number;
  hero: HeroProgress; items: Record<ItemId, number>;
  completed: EventId[]; clues: EventId[]; interludes: string[];
};

export type LoopIntent = { kind: 'ack' | 'cancel_deploy' | 'sleep' | 'sync' | 'skip_day' }
  | { kind: 'event'; id: EventId }
  | { kind: 'buy'; id: ItemId }
  | { kind: 'respec'; choice: BuildChoice }
  | { kind: 'rest'; rest: 'short' | 'long' }
  | { kind: 'deploy'; withLink: boolean };
export type LoopAction = { type: 'loop'; token: string; intent: LoopIntent };
