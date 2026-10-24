import type { D20Roll, DamageRoll, RngState } from './types.js';

export function seeded(seed: number): RngState { return { kind: 'seeded', seed: seed >>> 0, value: seed >>> 0, draws: 0 }; }
export function sequence(values: readonly number[]): RngState { return { kind: 'sequence', values: [...values], index: 0, draws: 0 }; }
export function die(sides: number, rng: RngState): { value: number; rng: RngState } {
  if (!Number.isInteger(sides) || sides < 2) throw new Error('骰子面数必须是至少 2 的整数');
  if (rng.kind === 'sequence') {
    const value = rng.values[rng.index];
    if (!Number.isInteger(value) || value! < 1 || value! > sides) throw new Error(`固定骰序耗尽或超出 d${sides} 范围`);
    return { value: value!, rng: { ...rng, index: rng.index + 1, draws: rng.draws + 1 } };
  }
  const next = (rng.value + 0x6D2B79F5) >>> 0;
  let t = Math.imul(next ^ (next >>> 15), next | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = 1 + Math.floor(((t ^ (t >>> 14)) >>> 0) / 4294967296 * sides);
  return { value, rng: { ...rng, value: next, draws: rng.draws + 1 } };
}
export function rollD20(rng: RngState, advantage = false, disadvantage = false): { roll: D20Roll; rng: RngState } {
  const first = die(20, rng);
  if (advantage === disadvantage) return { roll: { dice: [first.value], chosen: first.value, mode: 'normal' }, rng: first.rng };
  const second = die(20, first.rng);
  return { roll: { dice: [first.value, second.value], chosen: advantage ? Math.max(first.value, second.value) : Math.min(first.value, second.value), mode: advantage ? 'advantage' : 'disadvantage' }, rng: second.rng };
}
export function rollDamage(expression: string, rng: RngState, critical = false): { roll: DamageRoll; rng: RngState } {
  const match = /^(\d+)d(\d+)([+-]\d+)?$/.exec(expression);
  if (!match || Number(match[1]) < 1) throw new Error(`无效伤害骰：${expression}`);
  const sides = Number(match[2]);
  const modifier = Number(match[3] ?? 0);
  const dice: number[] = [];
  let next = rng;
  for (let i = 0; i < Number(match[1]) * (critical ? 2 : 1); i++) {
    const result = die(sides, next);
    dice.push(result.value); next = result.rng;
  }
  return { roll: { expression, dice, sides, modifier, total: Math.max(0, dice.reduce((a, b) => a + b, 0) + modifier), critical }, rng: next };
}
