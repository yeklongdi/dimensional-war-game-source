import type { Attack, BattleState, D20Roll, DamageReport, DamageType, RngState, Unit } from './types.js';
import { rollD20 } from './dice.js';
import { coverBonus, distance, hasLineOfEffect } from './grid.js';
import { active } from './state-helpers.js';

export function attackContext(state: BattleState, attacker: Unit, target: Unit, attack: Attack) {
  const advantages: string[] = [], disadvantages: string[] = [];
  const range = distance(attacker.position, target.position);
  let reason = '';
  if (!active(attacker)) reason = '行动者已失去战斗能力';
  else if (attacker.team === target.team || ['dead', 'defeated'].includes(target.status)) reason = '目标不是可攻击的敌人';
  else if (range > (attack.kind === 'melee' ? attack.reach ?? 1 : attack.range?.max ?? 0)) reason = '目标超出射程';
  else if (!hasLineOfEffect(state.grid, attacker.position, target.position)) reason = '墙体阻挡攻击线';
  if (target.status === 'unconscious' || target.status === 'stable') advantages.push('目标昏迷');
  if (target.resources.dodging) disadvantages.push('目标回避');
  if (attack.kind === 'ranged') {
    if (range > (attack.range?.normal ?? 0)) disadvantages.push('超过常规射程');
    if (state.units.some(unit => unit.team !== attacker.team && active(unit) && distance(unit.position, attacker.position) <= 1 && hasLineOfEffect(state.grid, unit.position, attacker.position))) disadvantages.push('近身敌人');
  }
  const cover = coverBonus(state.grid, attacker.position, target.position);
  return { legal: !reason, reason, range, advantages, disadvantages, cover, ac: target.ac + cover };
}
export function attackRoll(rng: RngState, bonus: number, ac: number, advantages: readonly string[] = [], disadvantages: readonly string[] = [], unconsciousClose = false) {
  const result = rollD20(rng, advantages.length > 0, disadvantages.length > 0);
  return { ...result, ...attackOutcome(result.roll, bonus, ac, unconsciousClose) };
}
export function attackOutcome(roll: D20Roll, bonus: number, ac: number, unconsciousClose = false) {
  const natural = roll.chosen;
  const total = natural + bonus;
  const hit = natural === 20 || (natural !== 1 && total >= ac);
  return { total, hit, critical: hit && (natural === 20 || unconsciousClose) };
}
export function applyDamage(unit: Unit, raw: number, damageType: DamageType, critical = false): { unit: Unit; report: DamageReport } {
  const modifiers: string[] = [];
  let adjusted = Math.max(0, raw);
  if (unit.immunities.includes(damageType)) { adjusted = 0; modifiers.push('免疫'); }
  else {
    if (unit.resistances.includes(damageType)) { adjusted = Math.floor(adjusted / 2); modifiers.push('抗性减半向下取整'); }
    if (unit.vulnerabilities.includes(damageType)) { adjusted *= 2; modifiers.push('易伤翻倍'); }
  }
  const tempAfter = Math.max(0, unit.tempHp - adjusted);
  const hpAfter = Math.max(0, unit.hp - Math.max(0, adjusted - unit.tempHp));
  let next: Unit = { ...unit, hp: hpAfter, tempHp: tempAfter, saves: { ...unit.saves } };
  const failureAdded = unit.hp === 0 && adjusted > 0 && unit.features.includes('death_saves') ? critical ? 2 : 1 : 0;
  if (failureAdded) {
    next.saves.failures = Math.min(3, next.saves.failures + failureAdded);
    next.status = next.saves.failures >= 3 ? 'dead' : 'unconscious';
    next.prone = true;
  } else if (hpAfter === 0 && unit.hp > 0) {
    next = { ...next, status: unit.features.includes('death_saves') ? 'unconscious' : 'defeated', prone: true, saves: { successes: 0, failures: 0 } };
  }
  return { unit: next, report: { raw, adjusted, modifiers, hpBefore: unit.hp, hpAfter, tempBefore: unit.tempHp, tempAfter, failureAdded } };
}
export function deathSave(unit: Unit, rng: RngState) {
  const result = rollD20(rng);
  return { ...resolveDeathSave(unit, result.roll), rng: result.rng, roll: result.roll };
}
export function resolveDeathSave(unit: Unit, roll: D20Roll) {
  let next: Unit = { ...unit, saves: { ...unit.saves } };
  let outcome: string;
  if (roll.chosen === 20) {
    next = { ...next, hp: 1, status: 'active', prone: false, saves: { successes: 0, failures: 0 } }; outcome = 'revived';
  } else if (roll.chosen >= 10) {
    next.saves.successes = Math.min(3, next.saves.successes + 1);
    if (next.saves.successes === 3) next.status = 'stable';
    outcome = next.status === 'stable' ? 'stable' : 'success';
  } else {
    next.saves.failures = Math.min(3, next.saves.failures + (roll.chosen === 1 ? 2 : 1));
    if (next.saves.failures === 3) next.status = 'dead';
    outcome = next.status === 'dead' ? 'dead' : 'failure';
  }
  return { unit: next, outcome };
}
export function opportunityEligible(state: BattleState, reactor: Unit, mover: Unit, to: Unit['position'], source: 'walk' | 'forced' | 'teleport' = 'walk') {
  const attack = reactor.attacks.find(item => item.kind === 'melee');
  return source === 'walk' && Boolean(attack) && active(reactor) && active(mover) && reactor.team !== mover.team && reactor.resources.reaction && !mover.resources.disengaged
    && distance(reactor.position, mover.position) <= (attack?.reach ?? 1) && distance(reactor.position, to) > (attack?.reach ?? 1)
    && hasLineOfEffect(state.grid, reactor.position, mover.position);
}
