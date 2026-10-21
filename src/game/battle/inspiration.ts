import type { BattleState, D20Roll, PendingRoll } from './types.js';
import { die } from './dice.js';
import { emit } from './state-helpers.js';
import { completeAttack, completeDamage } from './combat.js';
import { completeDeathSave } from './turn.js';
import { completeInitiative } from './initiative.js';

function replaceD20(roll: D20Roll, index: number, value: number): D20Roll {
  const dice = roll.dice.map((old, at) => at === index ? value : old);
  return { ...roll, dice, chosen: roll.mode === 'advantage' ? Math.max(...dice) : roll.mode === 'disadvantage' ? Math.min(...dice) : dice[0]! };
}
export function inspirationReason(state: BattleState, index: number | null): string {
  const pending = state.pendingRoll;
  if (!pending) return '当前没有待决定的骰子';
  if (index === null) return '';
  if ((state.inspiration?.[pending.actor] ?? 0) < 1) return '没有英雄激励';
  return Number.isInteger(index) && index >= 0 && index < pending.roll.dice.length ? '' : '重掷骰子位置无效';
}

/** 单颗替换且必须采用；任何结果、伤害或先攻依赖都在选择后才生效。 */
export function resolveInspiration(state: BattleState, index: number | null): BattleState {
  const original = state.pendingRoll!;
  let pending: PendingRoll = structuredClone(original);
  let next: BattleState = { ...state, pendingRoll: undefined };
  let replacement: number | undefined;
  if (index !== null) {
    const rolled = die(pending.kind === 'damage' ? pending.roll.sides : 20, state.rng);
    replacement = rolled.value;
    next = { ...next, rng: rolled.rng, inspiration: { ...state.inspiration, [pending.actor]: 0 } };
    if (pending.kind === 'damage') {
      const dice = pending.roll.dice.map((value, at) => at === index ? rolled.value : value);
      pending = { ...pending, roll: { ...pending.roll, dice, total: Math.max(0, dice.reduce((sum, value) => sum + value, 0) + pending.roll.modifier) } };
    } else pending = { ...pending, roll: replaceD20(pending.roll, index, rolled.value) };
  }
  next = emit(next, { kind: 'inspiration', actor: pending.actor, purpose: pending.kind, original: original.roll.dice,
    replacement, dieIndex: index ?? undefined, adopted: pending.roll.dice, chosen: pending.kind === 'damage' ? pending.roll.total : pending.roll.chosen, remaining: next.inspiration?.[pending.actor] ?? 0 });
  switch (pending.kind) {
    case 'initiative': return completeInitiative(next, pending.entries.map(entry => entry.actor === pending.actor ? { ...entry, roll: pending.roll, total: pending.roll.chosen + entry.bonus } : entry));
    case 'attack': return completeAttack(next, pending.actor, pending.target, pending.attack, pending.source, pending.roll);
    case 'damage': return completeDamage(next, pending.actor, pending.target, pending.attack, pending.roll);
    case 'death-save': return completeDeathSave(next, pending.actor, pending.roll);
  }
}
