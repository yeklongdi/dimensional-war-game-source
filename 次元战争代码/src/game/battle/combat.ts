import type { Attack, BattleState, D20Roll, DamageRoll } from './types.js';
import { rollDamage } from './dice.js';
import { applyDamage, attackContext, attackOutcome, attackRoll } from './rules.js';
import { emit, getUnit, replaceUnit, settle } from './state-helpers.js';
import { applyAttackEffects, consumeAttackEffects } from './timed.js';

/** 只由通过合法性检查的规则事务调用；所有输入对象保持不变。 */
export function strike(state: BattleState, actor: string, targetId: string, attack: Attack, source: 'action' | 'bonus' | 'reaction'): BattleState {
  const attacker = getUnit(state, actor)!, target = getUnit(state, targetId)!;
  const context = attackContext(state, attacker, target, attack);
  const result = attackRoll(state.rng, attack.bonus, context.ac, context.advantages, context.disadvantages, ['unconscious', 'stable'].includes(target.status) && context.range <= 1);
  const next = { ...state, rng: result.rng };
  if ((state.inspiration?.[actor] ?? 0) > 0) return { ...next, pendingRoll: { kind: 'attack', actor, target: targetId, attack, source, roll: result.roll } };
  return completeAttack(next, actor, targetId, attack, source, result.roll);
}
export function completeAttack(state: BattleState, actor: string, targetId: string, attack: Attack, source: 'action' | 'bonus' | 'reaction', roll: D20Roll): BattleState {
  const attacker = getUnit(state, actor)!, target = getUnit(state, targetId)!;
  const context = attackContext(state, attacker, target, attack);
  const result = attackOutcome(roll, attack.bonus, context.ac, ['unconscious', 'stable'].includes(target.status) && context.range <= 1);
  let next = emit(consumeAttackEffects(state, actor, targetId), { kind: 'attack', actor, target: targetId, attack: attack.name, attackId: attack.id, attackKind: attack.kind, damageType: attack.damageType, source, roll, bonus: attack.bonus, total: result.total,
    ac: context.ac, cover: context.cover, advantages: context.advantages, disadvantages: context.disadvantages, hit: result.hit, critical: result.critical });
  if (!result.hit) return next;
  const damage = rollDamage(attack.damage, next.rng, result.critical, attack.explode);
  next = { ...next, rng: damage.rng };
  if ((next.inspiration?.[actor] ?? 0) > 0) return { ...next, pendingRoll: { kind: 'damage', actor, target: targetId, attack, roll: damage.roll } };
  return completeDamage(next, actor, targetId, attack, damage.roll);
}
export function completeDamage(state: BattleState, actor: string, targetId: string, attack: Attack, roll: DamageRoll): BattleState {
  let next = applyCombatDamage(state, actor, targetId, attack.damageType, roll);
  if (attack.extraDamage) {
    const extra = rollDamage(attack.extraDamage.damage, next.rng, roll.critical);
    next = applyCombatDamage({ ...next, rng: extra.rng }, actor, targetId, attack.extraDamage.damageType, extra.roll);
  }
  const report = next.log.findLast(event => event.kind === 'damage');
  return settle(applyAttackEffects(next, actor, getUnit(next, targetId)!, attack, report?.kind === 'damage' ? report.report.adjusted : 0));
}

export function applyCombatDamage(state: BattleState, actor: string, targetId: string, damageType: Attack['damageType'], roll: DamageRoll): BattleState {
  const target = getUnit(state, targetId)!;
  const applied = applyDamage(target, roll.total, damageType, roll.critical);
  let next = emit(replaceUnit(state, applied.unit), { kind: 'damage', actor, target: targetId, roll, damageType, report: applied.report });
  if (target.status !== applied.unit.status) next = emit(next, { kind: 'condition', actor: targetId, status: applied.unit.status });
  return next;
}
