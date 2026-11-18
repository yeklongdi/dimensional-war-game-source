import type { AbilityId, BattleEvent, BattleState, DamageType, Unit } from './types.js';

/** 表现层只读规则结果：所有判断都来自结构化事件与单位数据，不解析中文日志。 */
export type HitStyle = 'fist' | 'melee' | 'ranged' | 'spell';
export type FxElement = 'physical' | 'fire' | 'cold' | 'lightning' | 'thunder' | 'acid' | 'poison' | 'force' | 'necrotic' | 'radiant' | 'psychic';
export type Reduction = 'none' | 'half_save' | 'resisted' | 'immune' | 'vulnerable';

export type FeedbackCue =
  | { kind: 'swing'; seq: number; actor: string; target: string; style: HitStyle; element: FxElement; hit: boolean; critical: boolean }
  | { kind: 'impact'; seq: number; actor: string; target: string; style: HitStyle; element: FxElement; amount: number; absorbed: number; critical: boolean; reduction: Reduction }
  | { kind: 'save'; seq: number; target: string; success: boolean }
  | { kind: 'heal'; seq: number; target: string; amount: number }
  | { kind: 'ward'; seq: number; target: string; amount: number }
  | { kind: 'down'; seq: number; target: string; status: Unit['status'] };

/** 法术类来源：攻击型法术与自动命中的飞弹；魔法武器（如凌空剑）不在其中。 */
const spellAttacks = new Set(['fire_bolt', 'ray_of_frost', 'shocking_grasp', 'poison_spray', 'sorcerous_burst', 'magic_missile', 'missile_scroll']);
const healingAbilities = new Set<AbilityId>(['healing_potion', 'divine_aid', 'second_wind']);
const wardAbilities = new Set<AbilityId>(['mage_armor', 'false_life']);

export const isSpellAttack = (id: string) => spellAttacks.has(id);
export const isHealingAbility = (id: AbilityId) => healingAbilities.has(id);
export const isWardAbility = (id: AbilityId) => wardAbilities.has(id);

export function elementOf(type: DamageType): FxElement {
  return type === 'bludgeoning' || type === 'slashing' || type === 'piercing' ? 'physical' : type;
}
export function styleOf(attackId: string, kind: 'melee' | 'ranged'): HitStyle {
  if (attackId === 'unarmed') return 'fist';
  if (isSpellAttack(attackId)) return 'spell';
  return kind === 'ranged' ? 'ranged' : 'melee';
}
function reductionOf(target: Unit | undefined, type: DamageType, saved: boolean): Reduction {
  if (!target) return saved ? 'half_save' : 'none';
  if (target.immunities.includes(type)) return 'immune';
  if (target.vulnerabilities.includes(type)) return 'vulnerable';
  if (target.resistances.includes(type)) return 'resisted';
  return saved ? 'half_save' : 'none';
}

/**
 * 把一段战斗事件流翻译成表现指令。同一事件只会生成一条指令；
 * 未命中不生成 impact，等激励决定期间不会出现任何伤害指令。
 */
export function feedbackCues(state: BattleState, events: readonly BattleEvent[]): FeedbackCue[] {
  const cues: FeedbackCue[] = [];
  const unit = (id: string) => state.units.find(item => item.id === id);
  const pendingSave = new Map<string, boolean>();
  let lastAttack: { actor: string; target: string; style: HitStyle } | undefined;
  let castStyle: HitStyle | undefined;
  for (const event of events) {
    // 新动作（回合、移动、结算结束）才是清空攻击关联的边界；同一次攻击的连续伤害不清空。
    if (event.kind === 'turn' || event.kind === 'move' || event.kind === 'result') { lastAttack = undefined; castStyle = undefined; }
    if (event.kind === 'ability') {
      const id = event.abilityId;
      // 施法起手事件不带 target；只有结算完成、带受术者的专用事件才生成治疗/防护指令。
      // 结算事件仍可能没有实际效果（满血自疗、临时 HP 未提升），此时不显示数字。
      if (id && (isHealingAbility(id) || isWardAbility(id))) {
        const effective = event.amount === undefined || event.amount > 0;
        if (event.target && effective) {
          cues.push({ kind: isHealingAbility(id) ? 'heal' : 'ward', seq: event.seq, target: event.target, amount: event.amount ?? 0 });
        }
        castStyle = undefined;
      } else if (id) castStyle = 'spell';
      lastAttack = undefined;
      continue;
    }
    if (event.kind === 'ability-save') {
      pendingSave.set(event.target, event.success);
      cues.push({ kind: 'save', seq: event.seq, target: event.target, success: event.success });
      continue;
    }
    if (event.kind === 'attack') {
      const style = styleOf(event.attackId, event.attackKind);
      lastAttack = { actor: event.actor, target: event.target, style };
      cues.push({ kind: 'swing', seq: event.seq, actor: event.actor, target: event.target, style, element: event.damageType ? elementOf(event.damageType) : 'physical', hit: event.hit, critical: event.critical });
      if (event.hit) castStyle = undefined;
      continue;
    }
    if (event.kind === 'damage') {
      const target = unit(event.target);
      const saved = pendingSave.get(event.target) ?? false;
      pendingSave.delete(event.target);
      // 攻击类型对本次攻击的每一条伤害都有效（含 extraDamage 附加伤害）；新动作开始才失效。
      const linked = lastAttack && lastAttack.actor === event.actor && lastAttack.target === event.target ? lastAttack.style : undefined;
      const style = linked ?? castStyle ?? 'melee';
      cues.push({
        kind: 'impact', seq: event.seq, actor: event.actor, target: event.target, style, element: elementOf(event.damageType),
        amount: event.report.adjusted, absorbed: Math.max(0, event.report.tempBefore - event.report.tempAfter),
        critical: event.roll.critical, reduction: reductionOf(target, event.damageType, saved),
      });
      continue;
    }
    if (event.kind === 'condition' && (event.status === 'unconscious' || event.status === 'dead' || event.status === 'defeated')) {
      cues.push({ kind: 'down', seq: event.seq, target: event.actor, status: event.status });
    }
  }
  return cues;
}

/** 每个单位的表现锚点，与 render.ts 的棋子几何保持一致。 */
export function unitAnchor(state: BattleState, id: string) {
  const unit = state.units.find(item => item.id === id);
  if (!unit) return undefined;
  return { x: unit.position.col * 96 + 48, y: unit.position.row * 96 + 37, radius: 23, name: unit.name };
}
