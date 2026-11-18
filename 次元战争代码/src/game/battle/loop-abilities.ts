import { modifier } from '../loop/characters.js';
import { cantripNames, items, linkAbilityMinSync, spellNames } from '../loop/config.js';
import type { ItemId } from '../loop/types.js';
import { applyCombatDamage, strike } from './combat.js';
import { rollD20, rollDamage } from './dice.js';
import { coverBonus, distance, hasLineOfEffect, inside } from './grid.js';
import { attackContext } from './rules.js';
import { emit, getUnit, replaceUnit, settle } from './state-helpers.js';
import { turnCount } from './timed.js';
import type { AbilityCommand, AbilityId, Attack, BattleState, BurstDamage, DamageType, Point, Unit } from './types.js';

type Spec = Readonly<{ name: string; resource: 'action' | 'bonus'; aim: 'self' | 'ally' | 'enemy' | 'area' | 'cone'; range?: number }>;
const specs: Record<AbilityId, Spec> = {
  fire_bolt: { name: cantripNames.fire_bolt, resource: 'action', aim: 'enemy', range: 24 },
  ray_of_frost: { name: cantripNames.ray_of_frost, resource: 'action', aim: 'enemy', range: 12 },
  shocking_grasp: { name: cantripNames.shocking_grasp, resource: 'action', aim: 'enemy', range: 1 },
  poison_spray: { name: cantripNames.poison_spray, resource: 'action', aim: 'enemy', range: 6 },
  acid_splash: { name: cantripNames.acid_splash, resource: 'action', aim: 'area', range: 12 },
  sorcerous_burst: { name: cantripNames.sorcerous_burst, resource: 'action', aim: 'enemy', range: 24 },
  magic_missile: { name: spellNames.magic_missile, resource: 'action', aim: 'enemy', range: 24 },
  burning_hands: { name: spellNames.burning_hands, resource: 'action', aim: 'cone', range: 1 },
  mage_armor: { name: spellNames.mage_armor, resource: 'action', aim: 'self' },
  false_life: { name: spellNames.false_life, resource: 'action', aim: 'self' },
  second_wind: { name: '回气', resource: 'bonus', aim: 'self' },
  innate_sorcery: { name: '先天术法', resource: 'bonus', aim: 'self' },
  healing_potion: { name: items.healing_potion.name, resource: 'bonus', aim: 'ally', range: 1 },
  missile_scroll: { name: items.missile_scroll.name, resource: 'action', aim: 'enemy', range: 24 },
  acid: { name: items.acid.name, resource: 'action', aim: 'enemy', range: 4 },
  divine_aid: { name: '至圣援护 · 疗伤术', resource: 'bonus', aim: 'ally', range: 1 },
  slaying_bow: { name: '杀戮神弓', resource: 'action', aim: 'enemy', range: 120 },
  multiattack: { name: '多重攻击 · 凌空剑两次', resource: 'action', aim: 'enemy', range: 24 },
  multiattack_bow: { name: '多重攻击 · 凌空剑与神弓', resource: 'action', aim: 'enemy', range: 24 },
};
const ranged = (range: number) => ({ normal: range, max: range });
const attackSpells: Partial<Record<AbilityId, Pick<Attack, 'kind' | 'damage' | 'damageType' | 'reach' | 'range' | 'onHit'>>> = {
  fire_bolt: { kind: 'ranged', range: ranged(24), damage: '1d10', damageType: 'fire' },
  ray_of_frost: { kind: 'ranged', range: ranged(12), damage: '1d8', damageType: 'cold', onHit: 'frost' },
  shocking_grasp: { kind: 'melee', reach: 1, damage: '1d8', damageType: 'lightning', onHit: 'no_opportunity' },
  poison_spray: { kind: 'ranged', range: ranged(6), damage: '1d12', damageType: 'poison' },
  sorcerous_burst: { kind: 'ranged', range: ranged(24), damage: '1d8', damageType: 'fire' },
};
export const burstNames: Record<BurstDamage, string> = {
  acid: '强酸', cold: '冷冻', fire: '火焰', lightning: '闪电', poison: '毒素', psychic: '心灵', thunder: '雷鸣',
};
const isItem = (id: AbilityId): id is ItemId => Object.hasOwn(items, id);
const isSlotSpell = (id: AbilityId) => Object.hasOwn(spellNames, id);
const caster = (actor: Unit, state: BattleState) => actor.id === 'hero' && (state.loop?.hero.classId === 'wizard' || state.loop?.hero.classId === 'sorcerer');
const castModifier = (actor: Unit, state: BattleState) => modifier(state.loop?.hero.classId === 'sorcerer' ? actor.abilities.cha : actor.abilities.int);
const innate = (state: BattleState) => (state.loop?.innateUntilTurn ?? 0) > turnCount(state, 'hero');

export function abilityOptions(state: BattleState, unit: Unit): { id: AbilityId; spec: Spec }[] {
  const loop = state.loop, ids: AbilityId[] = [];
  if (!loop || unit.team !== 'player') return [];
  if (unit.id === 'link') ids.push('multiattack', 'multiattack_bow', 'slaying_bow', 'divine_aid');
  if (unit.id === 'hero') {
    const classId = loop.hero.classId;
    ids.push('healing_potion', 'acid');
    if (classId === 'fighter') ids.unshift('second_wind');
    if (classId === 'wizard' || classId === 'sorcerer') {
      const build = loop.hero[classId];
      ids.unshift(...build.cantrips, ...build.prepared.filter(spell => spell !== 'detect_magic'));
      ids.push('missile_scroll');
    }
    if (classId === 'sorcerer') ids.unshift('innate_sorcery');
  }
  return ids.filter(id => unit.id !== 'link' || loop.sync >= (linkAbilityMinSync[id] ?? 0)).map(id => ({ id, spec: specs[id] }));
}

function directedCone(from: Point, aim: Point, target: Point) {
  const h = aim.col - from.col, v = aim.row - from.row;
  const x = target.col - from.col, y = target.row - from.row;
  const forward = h * x + v * y;
  return forward > 0 && distance(from, target) <= 3 && 2 * Math.abs(h * y - v * x) <= forward;
}
function areaTargets(state: BattleState, actor: Unit, ability: AbilityId, point: Point) {
  const cone = specs[ability].aim === 'cone';
  return state.units.filter(unit => unit.status !== 'dead' && unit.status !== 'defeated'
    && (cone ? directedCone(actor.position, point, unit.position) : distance(point, unit.position) <= 1)
    && hasLineOfEffect(state.grid, cone ? actor.position : point, unit.position));
}

function makeSpellAttack(state: BattleState, actor: Unit, command: AbilityCommand): Attack | undefined {
  const data = attackSpells[command.ability];
  if (!data) return undefined;
  const mod = castModifier(actor, state), burst = command.ability === 'sorcerous_burst';
  return { ...data, id: command.ability, name: specs[command.ability].name, bonus: mod + 2, magical: true, innateAdvantage: innate(state),
    damageType: burst ? command.burstDamage ?? 'fire' : data.damageType, explode: burst ? Math.max(0, mod) : undefined };
}

export function abilityReason(state: BattleState, actor: Unit, command: AbilityCommand): string {
  const id = command.ability, loop = state.loop;
  if (!loop || !abilityOptions(state, actor).some(option => option.id === id)) return '当前角色没有此能力';
  const spec = specs[id], hero = loop.hero;
  if (!actor.resources[spec.resource]) return spec.resource === 'bonus' ? '附赠动作已用完' : '主动作已用完';
  if (isItem(id) && loop.items[id] < 1) return '背包中没有此道具';
  if (isSlotSpell(id) && (hero.classId === 'wizard' ? hero.wizardSlots : hero.sorcererSlots) < 1) return '一环法术位已用完';
  if (id === 'second_wind' && (hero.wind < 1 || actor.hp === actor.maxHp)) return '回气需要可用次数及损失的生命值';
  if (id === 'innate_sorcery' && (hero.innate < 1 || innate(state))) return '先天术法已在生效或次数已用完';
  if (id === 'divine_aid' && loop.divineAid < 1) return '至圣援护已用完';
  if (id === 'mage_armor' && hero.mageArmor) return '法师护甲正在生效';
  if (id === 'false_life' && actor.tempHp >= 12) return '临时生命值已经达到此术可提供的上限';
  if (id === 'sorcerous_burst' && command.burstDamage && !Object.hasOwn(burstNames, command.burstDamage)) return '无效的术法伤害类型';
  if (spec.aim === 'self') return '';
  if (spec.aim === 'cone' || spec.aim === 'area') {
    const point = command.point;
    if (!point || !inside(state.grid, point) || !hasLineOfEffect(state.grid, actor.position, point)
      || distance(actor.position, point) > spec.range! || (spec.aim === 'cone' && distance(actor.position, point) !== 1)) return '选择有效的方向或范围中心';
    return areaTargets(state, actor, id, point).length ? '' : '此范围内没有单位';
  }
  const target = command.target && getUnit(state, command.target);
  if (!target || target.status === 'dead' || target.status === 'defeated') return '请选择仍在场的单位';
  const attack = makeSpellAttack(state, actor, command);
  if (attack) return attackContext(state, actor, target, attack).reason;
  if (spec.aim === 'enemy' ? target.team === actor.team : target.team !== actor.team) return '目标阵营不符';
  if (spec.aim === 'ally' && target.hp === target.maxHp) return '该单位的生命值已满';
  if (distance(actor.position, target.position) > spec.range!) return '目标超出射程';
  return hasLineOfEffect(state.grid, actor.position, target.position) ? '' : '墙体阻挡效果';
}

function savingThrow(state: BattleState, actor: Unit, target: Unit, ability: string, dc: number, magical: boolean) {
  const bonus = modifier(target.abilities.dex) + (target.saveProficiencies?.includes('dex') ? 2 : 0)
    + coverBonus(state.grid, actor.position, target.position);
  const adv = target.resources.dodging || (magical && target.features.includes('magic_resistance'));
  const rolled = rollD20(state.rng, adv);
  const success = rolled.roll.chosen + bonus >= dc;
  const next = emit({ ...state, rng: rolled.rng }, { kind: 'ability-save', actor: actor.id, target: target.id, ability, roll: rolled.roll, bonus, dc, success });
  return { state: next, success };
}

function heal(state: BattleState, actor: Unit, target: Unit, ability: AbilityId, expression: string): BattleState {
  const { roll, rng } = rollDamage(expression, state.rng);
  const hp = Math.min(target.maxHp, target.hp + roll.total);
  const next = replaceUnit({ ...state, rng }, { ...target, hp, status: 'active', prone: target.hp === 0 ? false : target.prone,
    saves: target.hp === 0 ? { successes: 0, failures: 0 } : target.saves });
  return emit(next, { kind: 'ability', actor: actor.id, target: target.id, name: specs[ability].name, abilityId: ability, amount: hp - target.hp,
    detail: target.name + ' HP ' + target.hp + ' → ' + hp + '（' + expression + '，掷出 ' + roll.dice.join('、') + '）' });
}

function damage(state: BattleState, actor: Unit, target: Unit, type: DamageType, expression: string) {
  const { roll, rng } = rollDamage(expression, state.rng);
  return applyCombatDamage({ ...state, rng }, actor.id, target.id, type, roll);
}
function savingDamage(state: BattleState, actor: Unit, origin: Unit, targets: readonly Unit[], ability: AbilityId,
  dc: number, type: DamageType, expression: string, half: boolean, magical: boolean) {
  const { roll, rng } = rollDamage(expression, state.rng);
  let next = { ...state, rng };
  for (const target of targets) {
    const checked = savingThrow(next, origin, target, specs[ability].name, dc, magical);
    next = checked.state;
    if (!checked.success || half) {
      next = applyCombatDamage(next, actor.id, target.id, type, checked.success ? { ...roll, total: Math.floor(roll.total / 2) } : roll);
    }
  }
  return settle(next);
}

function divineBow(state: BattleState, actor: Unit, target: Unit): BattleState {
  const checked = savingThrow(state, actor, target, specs.slaying_bow.name, 21, true);
  if (checked.success) return checked.state;
  if (target.hp <= 100) return settle(emit(replaceUnit(checked.state, { ...target, hp: 0, tempHp: 0, status: 'dead' }),
    { kind: 'condition', actor: target.id, status: 'dead' }));
  return settle(damage(damage(checked.state, actor, target, 'piercing', '4d8+6'), actor, target, 'radiant', '8d8'));
}

/** 新能力只在当回合一次提交。资源、骰子、效果和日志由同一纯结算生成。 */
export function resolveAbility(state: BattleState, actor: Unit, command: AbilityCommand): BattleState {
  const id = command.ability, spec = specs[id], loop = state.loop!;
  const hero = { ...loop.hero };
  const inventory = isItem(id) ? { ...loop.items, [id]: loop.items[id] - 1 } : loop.items;
  if (isSlotSpell(id)) {
    if (hero.classId === 'wizard') hero.wizardSlots--; else hero.sorcererSlots--;
  }
  if (id === 'second_wind') hero.wind--;
  if (id === 'innate_sorcery') hero.innate--;
  const data = { ...loop, hero, items: inventory, divineAid: loop.divineAid - Number(id === 'divine_aid') };
  if (id === 'innate_sorcery') data.innateUntilTurn = turnCount(state, actor.id) + 10;
  const used = { ...actor, resources: { ...actor.resources, [spec.resource]: false } };
  const next = emit(replaceUnit({ ...state, loop: data }, used), { kind: 'ability', actor: actor.id, name: spec.name, abilityId: id,
    detail: (spec.resource === 'action' ? '主动作' : '附赠动作') + (isItem(id) ? '，剩余 ' + inventory[id] + ' 件' : '') });
  const target = command.target ? getUnit(next, command.target)! : used;
  const spellAttack = makeSpellAttack(next, used, command);
  if (spellAttack) return strike(next, used.id, target.id, spellAttack, 'action');
  switch (id) {
    case 'healing_potion': return heal(next, used, target, id, '2d4+2');
    case 'divine_aid': return heal(next, used, target, id, '4d8+10');
    case 'second_wind': return heal(next, used, used, id, '1d10+1');
    case 'innate_sorcery': return next;
    case 'mage_armor':
      return emit(replaceUnit({ ...next, loop: { ...data, hero: { ...hero, mageArmor: true } } }, { ...used, ac: 13 + modifier(used.abilities.dex) }),
        { kind: 'ability', actor: used.id, target: used.id, name: spec.name, abilityId: id, detail: '防护生效，护甲等级提升' });
    case 'false_life': {
      const { roll, rng } = rollDamage('2d4+4', next.rng);
      const tempHp = Math.max(used.tempHp, roll.total);
      return emit(replaceUnit({ ...next, rng }, { ...used, tempHp }), { kind: 'ability', actor: used.id, target: used.id, name: spec.name, abilityId: id, amount: tempHp - used.tempHp,
        detail: '临时 HP ' + used.tempHp + ' → ' + tempHp });
    }
    case 'acid': return savingDamage(next, used, used, [target], id, 10 + modifier(used.abilities.dex), 'acid', '2d6', false, false);
    case 'acid_splash': case 'burning_hands': {
      const point = command.point!, splash = id === 'acid_splash';
      return savingDamage(next, used, splash ? { ...used, position: point } : used, areaTargets(next, used, id, point), id,
        10 + castModifier(used, next) + Number(innate(next)), splash ? 'acid' : 'fire', splash ? '1d6' : '3d6', !splash, true);
    }
    case 'magic_missile': case 'missile_scroll': {
      let hit = next;
      for (let dart = 0; dart < 3; dart++) hit = damage(hit, used, target, 'force', '1d4+1');
      return settle(hit);
    }
    case 'slaying_bow': return divineBow(next, used, target);
    case 'multiattack': case 'multiattack_bow': {
      const attack = used.attacks.find(candidate => attackContext(next, used, target, candidate).legal)!;
      const first = strike(next, used.id, target.id, attack, 'action');
      if (first.result || getUnit(first, target.id)?.hp === 0) return first;
      return id === 'multiattack_bow' ? divineBow(first, used, getUnit(first, target.id)!) : strike(first, used.id, target.id, attack, 'action');
    }
  }
  return next;
}

export function abilityBudget(state: BattleState, unit: Unit, id: AbilityId): string {
  const loop = state.loop!;
  if (isItem(id)) return ' · ' + loop.items[id] + ' 件';
  if (isSlotSpell(id) && caster(unit, state)) return ' · 一环位 ' + (loop.hero.classId === 'wizard' ? loop.hero.wizardSlots : loop.hero.sorcererSlots);
  if (id === 'second_wind') return ' · ' + loop.hero.wind + ' 次';
  if (id === 'innate_sorcery') return ' · ' + loop.hero.innate + ' 次' + (innate(state) ? '（生效中）' : '');
  if (id === 'divine_aid') return ' · ' + loop.divineAid + ' 次';
  return '';
}
