import type { LocationId } from '../../content/map-locations.js';
import { die, seeded } from '../battle/dice.js';
import type { FlagValue } from '../state.js';
import { constitution, hitDie, initialHero, maxHp, respec, validBuild } from './characters.js';
import { demo, events, interludeId, items, slots } from './config.js';
import type { CityEvent } from './config.js';
import type { EncounterId, LoopCheckpoint, LoopIntent, Slot } from './types.js';

export function startLoop(seed: number): LoopCheckpoint {
  return {
    cycle: 0, day: 1, slot: 'after_school', phase: { kind: 'intro' }, rng: seeded(seed),
    gold: demo.gold, xp: 0, sync: 0, linkUses: demo.linkInitial, divineAid: demo.divineAid, hero: initialHero(),
    items: { healing_potion: 1, missile_scroll: 0, acid: 0 }, completed: [], clues: [], interludes: [],
  };
}

export function recover(loop: LoopCheckpoint, rest: 'short' | 'long'): LoopCheckpoint {
  const hero = { ...loop.hero }, id = hero.classId;
  if (rest === 'long') {
    return { ...loop, linkUses: demo.linkAfterLong, divineAid: demo.divineAid, hero: {
      ...hero, hp: maxHp(id), tempHp: 0, mageArmor: false, hitDie: 1,
      wind: 2, wizardSlots: 2, recovery: true, sorcererSlots: 2, innate: 2,
    } };
  }
  let rng = loop.rng;
  if (hero.hitDie && hero.hp < maxHp(id)) {
    const rolled = die(hitDie[id], rng);
    rng = rolled.rng;
    hero.hp = Math.min(maxHp(id), hero.hp + rolled.value + constitution(id));
    hero.hitDie--;
  }
  if (id === 'fighter') hero.wind = Math.min(2, hero.wind + 1);
  if (id === 'wizard' && hero.recovery && hero.wizardSlots < 2) {
    hero.wizardSlots++; hero.recovery = false;
  }
  return { ...loop, hero, rng, linkUses: Math.max(loop.linkUses, demo.linkAfterShort) };
}

function afterNight(loop: LoopCheckpoint): LoopCheckpoint {
  if (loop.day === demo.days[loop.cycle]) return { ...loop, phase: { kind: 'crisis' } };
  const day = loop.day + 1;
  const dawn = loop.cycle === 1 && day === 2 && !loop.interludes.includes(interludeId(loop.cycle, 'dawn'));
  return { ...loop, day, slot: 'after_school', phase: dawn ? { kind: 'interlude', moment: 'dawn' } : { kind: 'city' } };
}

function endDay(loop: LoopCheckpoint): LoopCheckpoint {
  const ended = recover({ ...loop, slot: 'night' }, 'long');
  if (ended.day === 1 && ended.cycle === 0 && !ended.interludes.includes(interludeId(ended.cycle, 'night')))
    return { ...ended, phase: { kind: 'interlude', moment: 'night' } };
  return afterNight(ended);
}

export function advanceSlot(loop: LoopCheckpoint): LoopCheckpoint {
  if (loop.slot === 'night') return endDay(loop);
  return { ...loop, slot: slots[slots.indexOf(loop.slot) + 1]!, phase: { kind: 'city' } };
}

/** 事件的可用时段：多数事件只有一段，剧情入口可覆盖两段。 */
export function eventSlots(event: CityEvent): readonly Slot[] {
  return event.slots ?? [event.slot];
}

export function visibleEvents(
  loop: LoopCheckpoint, location: LocationId, flags: Readonly<Record<string, FlagValue>> = {},
) {
  return events.filter(event => event.location === location && eventSlots(event).includes(loop.slot)
    && (!event.once || !loop.completed.includes(event.id))
    && (!event.requires || loop.completed.includes(event.requires))
    && (!event.story?.requires || event.story.requires.every(flag => flags[flag] === true))
    && (!event.story?.hiddenWhen || event.story.hiddenWhen.every(flag => flags[flag] !== true))
    && (event.id !== 'ritual' || loop.hero.classId === 'wizard'));
}

export function canOpenCity(loop: LoopCheckpoint | undefined): boolean { return !loop || loop.phase.kind === 'city'; }
export const canShop = (loop: LoopCheckpoint) => loop.phase.kind === 'city' || loop.phase.kind === 'safe';

export function advanceLoop(
  loop: LoopCheckpoint, intent: LoopIntent, location?: LocationId,
  flags: Readonly<Record<string, FlagValue>> = {},
): LoopCheckpoint | undefined {
  const phase = loop.phase;
  if (intent.kind === 'ack') {
    switch (phase.kind) {
      case 'intro': return { ...loop, phase: { kind: 'city' } };
      case 'interlude': {
        const read = { ...loop, interludes: [...loop.interludes, interludeId(loop.cycle, phase.moment)] };
        return phase.moment === 'night' ? afterNight(read) : { ...read, phase: { kind: 'city' } };
      }
      case 'crisis': return { ...loop, phase: { kind: 'deploy', encounter: 'first' } };
      case 'safe': return { ...loop, phase: { kind: 'deploy', encounter: 'second' } };
      case 'settlement': return loop.cycle + 1 < demo.days.length
        ? { ...loop, cycle: loop.cycle + 1, day: 1, slot: 'after_school', completed: [], phase: { kind: 'city' } }
        : { ...loop, phase: { kind: 'complete' } };
      default: return undefined;
    }
  }
  if (intent.kind === 'buy' && canShop(loop)) {
    const item = items[intent.id];
    if (item && loop.gold >= item.price) return { ...loop, gold: loop.gold - item.price, items: { ...loop.items, [intent.id]: loop.items[intent.id] + 1 } };
    return undefined;
  }
  if (phase.kind === 'deploy' && phase.encounter === 'patrol' && intent.kind === 'cancel_deploy') return { ...loop, phase: { kind: 'city' } };
  if (intent.kind === 'rest' && phase.kind === 'safe' && !phase.rested)
    return { ...recover(loop, intent.rest), phase: { kind: 'safe', rested: true } };
  if (phase.kind !== 'city') return undefined;
  if (intent.kind === 'skip_day') return endDay(loop);
  if (intent.kind === 'event' && location) {
    const event = visibleEvents(loop, location, flags).find(candidate => candidate.id === intent.id);
    if (!event || event.story) return undefined;
    if (event.battle) return { ...loop, phase: { kind: 'deploy', encounter: event.battle } };
    return advanceSlot({ ...loop, gold: loop.gold + (event.reward ?? 0), xp: loop.xp + 1,
      completed: event.once ? [...loop.completed, event.id] : loop.completed,
      clues: event.clue && !loop.clues.includes(event.id) ? [...loop.clues, event.id] : loop.clues });
  }
  if (location !== 'grandma_home') return undefined;
  if (intent.kind === 'respec' && validBuild(intent.choice)) return advanceSlot({ ...loop, hero: respec(loop.hero, intent.choice) });
  if (intent.kind === 'rest' && intent.rest === 'short' && loop.slot !== 'night') return advanceSlot(recover(loop, 'short'));
  if (loop.slot === 'night' && (intent.kind === 'sleep' || intent.kind === 'sync'))
    return endDay(intent.kind === 'sync' ? { ...loop, sync: loop.sync + 1 } : loop);
  return undefined;
}

export function winEncounter(loop: LoopCheckpoint, encounter: EncounterId): LoopCheckpoint {
  const rewarded = { ...loop, gold: loop.gold + (encounter === 'boss' ? demo.bossReward : demo.battleReward), xp: loop.xp + 2 };
  switch (encounter) {
    case 'patrol': return advanceSlot(rewarded);
    case 'first': return { ...rewarded, phase: { kind: 'safe', rested: false } };
    case 'second': return { ...rewarded, phase: { kind: 'deploy', encounter: 'boss' } };
    case 'boss': return { ...rewarded, phase: { kind: 'settlement' } };
  }
}
