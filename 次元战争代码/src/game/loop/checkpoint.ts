import { record } from '../save-v3.js';
import { maxHp, validBuild } from './characters.js';
import { classNames, demo, events, firstCycle, interludeId, items, slots } from './config.js';
import { loopStoryScenes } from './types.js';
import type { CasterBuild, ClassId, FighterBuild, LoopCheckpoint, Phase } from './types.js';

function integer(value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;
}
function hasKeys(value: Record<string, unknown>, keys: readonly string[]) {
  return Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}
function knownList(value: unknown, allowed: readonly string[]): value is string[] {
  return Array.isArray(value) && new Set(value).size === value.length && value.every(item => typeof item === 'string' && allowed.includes(item));
}
function validPhase(value: unknown, cycle: number, day: number, slot: string): value is Phase {
  if (!record(value)) return false;
  const deadline = day === demo.days[cycle] && slot === 'night';
  switch (value.kind) {
    case 'intro': return cycle === 0 && day === 1 && slot === 'after_school' && hasKeys(value, ['kind']);
    case 'city': return hasKeys(value, ['kind']);
    case 'crisis': case 'settlement': return deadline && hasKeys(value, ['kind']);
    case 'complete': return deadline && cycle === demo.days.length - 1 && hasKeys(value, ['kind']);
    case 'interlude': return hasKeys(value, ['kind', 'moment']) && (value.moment === 'night'
      ? cycle === 0 && day === 1 && slot === 'night'
      : value.moment === 'dawn' && cycle === 1 && day === 2 && slot === 'after_school');
    case 'safe': return deadline && hasKeys(value, ['kind', 'rested']) && typeof value.rested === 'boolean';
    case 'deploy': return hasKeys(value, ['kind', 'encounter']) && (value.encounter === 'patrol'
      ? slot !== 'night' : deadline && ['first', 'second', 'boss'].some(id => id === value.encounter));
    default: return false;
  }
}
function validHero(value: unknown) {
  if (!record(value) || typeof value.classId !== 'string' || !Object.hasOwn(classNames, value.classId)
    || !hasKeys(value, ['classId', 'hp', 'tempHp', 'mageArmor', 'hitDie', 'fighter', 'wizard', 'sorcerer',
      'wind', 'wizardSlots', 'recovery', 'sorcererSlots', 'innate'])
    || !integer(value.hp, 1, maxHp(value.classId as ClassId)) || !integer(value.tempHp, 0, 12)
    || typeof value.mageArmor !== 'boolean' || (value.classId === 'fighter' && value.mageArmor) || !integer(value.hitDie, 0, 1)
    || !integer(value.wind, 0, 2) || !integer(value.wizardSlots, 0, 2) || typeof value.recovery !== 'boolean'
    || !integer(value.sorcererSlots, 0, 2) || !integer(value.innate, 0, 2)) return false;
  const fighter = value.fighter;
  if (!record(fighter) || !hasKeys(fighter, ['style', 'weapon', 'mastery']) || !Array.isArray(fighter.mastery)
    || !validBuild({ classId: 'fighter', build: fighter as FighterBuild })) return false;
  return (['wizard', 'sorcerer'] as const).every(classId => {
    const build = value[classId];
    return record(build) && hasKeys(build, ['cantrips', 'prepared']) && Array.isArray(build.cantrips)
      && Array.isArray(build.prepared) && validBuild({ classId, build: build as CasterBuild });
  });
}

export function decodeLoop(value: unknown): LoopCheckpoint | undefined {
  if (!record(value) || !hasKeys(value, ['cycle', 'day', 'slot', 'phase', 'rng', 'gold', 'xp', 'sync', 'linkUses', 'divineAid', 'hero',
    'items', 'completed', 'clues', 'interludes', ...(Object.hasOwn(value, 'storyScene') ? ['storyScene'] : [])])) return undefined;
  const { cycle, day, slot, phase, rng, interludes, completed, clues, storyScene } = value;
  if (!integer(cycle, 0, demo.days.length - 1) || !integer(day, 1, demo.days[cycle])
    || typeof slot !== 'string' || !slots.some(id => id === slot) || !validPhase(phase, cycle, day, slot)) return undefined;
  if (Object.hasOwn(value, 'storyScene')) {
    if (!loopStoryScenes.some(scene => scene === storyScene)) return undefined;
    const meeting = cycle === 0 && phase.kind === 'city' && slot === 'night';
    const validStory = storyScene === 'v102'
      ? (phase.kind === 'city' && slot === 'after_school' && day > 1) || phase.kind === 'interlude' || phase.kind === 'crisis'
      : storyScene === 'm101' || storyScene === 'm102' ? phase.kind === 'intro'
        : meeting && (storyScene === 'm103' ? day === firstCycle.meetingDay : day <= firstCycle.meetingDay);
    if (!validStory) return undefined;
  }
  if (!record(rng) || !hasKeys(rng, ['kind', 'seed', 'value', 'draws']) || rng.kind !== 'seeded'
    || !integer(rng.seed, 0, 0xffffffff) || !integer(rng.value, 0, 0xffffffff) || !integer(rng.draws)) return undefined;
  const bag = value.items;
  if (!integer(value.gold) || !integer(value.xp) || !integer(value.sync) || !integer(value.linkUses, 0, demo.linkAfterLong)
    || !integer(value.divineAid, 0, demo.divineAid) || !validHero(value.hero) || !record(bag)
    || !hasKeys(bag, Object.keys(items)) || !Object.values(bag).every(count => integer(count))
    || !knownList(completed, events.filter(event => event.once).map(event => event.id))
    || !knownList(clues, events.filter(event => event.clue).map(event => event.id))) return undefined;
  const available = cycle === 0 ? [interludeId(0, 'night')] : [interludeId(0, 'night'), interludeId(1, 'dawn')];
  if (!knownList(interludes, available) || (phase.kind === 'interlude' && interludes.includes(interludeId(cycle, phase.moment)))) return undefined;
  return structuredClone(value) as LoopCheckpoint;
}
