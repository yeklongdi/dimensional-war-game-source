import type { ActorState, Waiting } from '../state.js';
import { placement, slotX } from '../story/config.js';

export type PortraitLayoutInput = {
  run: number; actId: string; sceneId: string; actors: readonly ActorState[];
  entries: readonly string[]; waiting: Waiting | null;
};
export type PortraitLayout = {
  scope: string; slots: readonly string[]; lastSpoken: Readonly<Record<string, number>>;
  speechToken: string; tick: number; revision: number;
};
const centers: readonly (readonly number[])[] = [[], [640], [384, 896], [256, 640, 1024]];
export const portraitCenters = (count: number): readonly number[] => centers[Math.min(3, Math.max(0, count))]!;
export const portraitPriority: Readonly<Record<string, readonly string[]>> = {
  'prologue_4/c009': ['男高', '女剑士', '蒙面人', '怪盗', '金发青年'],
  'prologue_4/c010': ['男高', '女剑士', '怪盗', '金发青年'],
  'prologue_4/c011': ['男高', '女剑士', 'Saber', '怪盗', '金发青年'],
  'prologue_4/c012': ['男高', '女剑士', '怪盗', '金发青年'],
};

/** 展示状态只由当前视图持有；任何输出都不写回ActorState或存档。 */
export function planPortraits(input: PortraitLayoutInput, previous?: PortraitLayout): PortraitLayout {
  const scope = `${input.run}/${input.actId}/${input.sceneId}`;
  const people = input.actors.filter(actor => actor.visible && !actor.asset?.startsWith('prop_'));
  const byName = new Map(people.map(actor => [actor.actor, actor]));
  const entries = (name: string) => { const i = input.entries.indexOf(name); return i < 0 ? Number.MAX_SAFE_INTEGER : i; };
  const priority = portraitPriority[`${input.actId}/${input.sceneId}`] ?? [];
  const rank = (name: string) => { const i = priority.indexOf(name); return i < 0 ? priority.length : i; };
  const tie = (a: string, b: string) => entries(a) - entries(b) || a.localeCompare(b, 'zh-CN');
  const candidates = people.map(actor => actor.actor).sort((a, b) => rank(a) - rank(b) || tie(a, b));
  const initial = !previous || previous.scope !== scope;
  let slots = initial ? candidates.slice(0, 3) : [...previous.slots];
  if (!initial) {
    const fill = candidates.filter(name => !slots.includes(name));
    slots = slots.map(name => byName.has(name) ? name : fill.shift() ?? '').filter(Boolean);
    for (const name of fill) if (slots.length < 3) slots.push(name);
  }
  if (initial || slots.length !== previous.slots.length) slots.sort((a, b) =>
    slotX[placement(byName.get(a)!.position).slot] - slotX[placement(byName.get(b)!.position).slot] || rank(a) - rank(b) || tie(a, b));
  const lastSpoken: Record<string, number> = initial ? {} : { ...previous.lastSpoken };
  const wait = input.waiting;
  const token = wait?.kind === 'text' && wait.textKind === 'dialogue' ? wait.token : '';
  const fresh = !!token && token !== (initial ? '' : previous.speechToken);
  let tick = initial ? 0 : previous.tick;
  if (fresh && wait?.kind === 'text' && wait.speaker && byName.has(wait.speaker)) {
    const speaker = wait.speaker;
    if (!slots.includes(speaker)) {
      const victim = [...slots].sort((a, b) => (lastSpoken[a] ?? -1) - (lastSpoken[b] ?? -1)
        || rank(b) - rank(a) || tie(a, b))[0];
      if (victim) slots[slots.indexOf(victim)] = speaker;
    }
    lastSpoken[speaker] = ++tick;
  }
  const changed = initial || slots.some((name, i) => name !== previous.slots[i]) || slots.length !== previous.slots.length;
  return { scope, slots, lastSpoken, tick, speechToken: token || (initial ? '' : previous.speechToken),
    revision: (previous?.revision ?? 0) + Number(changed) };
}
