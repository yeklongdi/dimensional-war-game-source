import { describe, expect, it } from 'vitest';
import { sequence } from '../game/battle/dice.js';
import { actionReason } from '../game/battle/battle.js';
import { currentUnit } from '../game/battle/state-helpers.js';
import { openEncounter } from '../game/loop/encounters.js';
import { startLoop } from '../game/loop/progress.js';
import type { ClassId } from '../game/loop/types.js';
import { abilityChoices, abilityEntries, actionPage, canUseActionBar, choiceAt, commonEntries } from '../game/ui/battle-action-model.js';
import { battleFor, patchUnit } from './battle-helpers.js';

function caster(classId: ClassId = 'wizard') {
  const loop = startLoop(0);
  return openEncounter({ ...loop, hero: { ...loop.hero, classId, hp: 3 },
    rng: sequence([20, 1]), items: { healing_potion: 1, missile_scroll: 1, acid: 0 } }, 'boss', false, 1);
}

describe('战斗操作栏分类与目标选择', () => {
  it('按角色实际拥有的能力分类，戏法、一环与卷轴各有明确消耗', () => {
    const entries = abilityEntries(caster());
    expect(actionPage(entries, 'cantrips', 0).entries.map(entry => entry.id)).toEqual(['fire_bolt', 'ray_of_frost', 'shocking_grasp']);
    expect(actionPage(entries, 'spells', 0).entries).toHaveLength(4);
    expect(entries.find(entry => entry.id === 'fire_bolt')?.cost).toContain('不消耗法术位');
    expect(entries.find(entry => entry.id === 'magic_missile')?.cost).toContain('一环法术位');
    expect(entries.find(entry => entry.id === 'missile_scroll')).toMatchObject({ category: 'items', badge: '1', reason: '' });
  });

  it('资源耗尽的能力保留原位置与原因，不会混淆法术位和卷轴', () => {
    const state = caster(); state.loop!.hero.wizardSlots = 0;
    const entries = abilityEntries(state);
    expect(entries.find(entry => entry.id === 'magic_missile')?.reason).toBe('一环法术位已用完');
    expect(entries.find(entry => entry.id === 'fire_bolt')?.reason).toBe('');
    expect(entries.find(entry => entry.id === 'missile_scroll')?.reason).toBe('');
    expect(entries.find(entry => entry.id === 'acid')).toMatchObject({ badge: '0', reason: '背包中没有此道具' });
    expect(abilityChoices(state, 'magic_missile')).toEqual([]);
  });

  it('目标只包含满足阵营、距离和状态条件的单位，选择不会推进战斗', () => {
    const state = caster(), original = structuredClone(state);
    const choices = abilityChoices(state, 'magic_missile');
    expect(choices.map(choice => choice.command.target)).toEqual(['demo_enemy']);
    expect(choiceAt(choices, { col: 9, row: 2 })?.command.target).toBe('demo_enemy');
    expect(choiceAt(choices, { col: 0, row: 2 })).toBeUndefined();
    expect(abilityChoices(state, 'shocking_grasp')).toEqual([]);
    expect(abilityChoices(state, 'healing_potion').map(choice => choice.command.target)).toEqual(['hero']);
    expect(state).toEqual(original);
  });

  it('范围法术提供合法格点，提交仍使用现有规则检查', () => {
    const state = caster('sorcerer'), choices = abilityChoices(state, 'acid_splash');
    expect(choices.length).toBeGreaterThan(0);
    expect(choices.every(choice => actionReason(state, choice.command, 'player') === '')).toBe(true);
    expect(choices.some(choice => choice.command.point?.col === 9 && choice.command.point.row === 2)).toBe(true);
    expect(abilityEntries(state).find(entry => entry.id === 'acid_splash')?.description).toContain('会波及友方');
  });

  it('满血时不给药水提供虚假的可选目标，消耗主动作后仍可选择附赠药水', () => {
    const state = caster(), actor = currentUnit(state);
    expect(abilityChoices(patchUnit(state, actor.id, { hp: actor.maxHp }), 'healing_potion')).toEqual([]);
    const spent = patchUnit(state, actor.id, { resources: { ...actor.resources, action: false } });
    expect(abilityChoices(spent, 'magic_missile')).toEqual([]);
    expect(abilityChoices(spent, 'healing_potion')).toHaveLength(1);
  });

  it('原序幕调试战斗也提供原有常用动作，未解锁的附赠攻击显示条件', () => {
    const entries = commonEntries(battleFor());
    expect(entries.map(entry => entry.id)).toEqual(['attack', 'move', 'dash', 'disengage', 'dodge', 'bonus']);
    expect(entries.find(entry => entry.id === 'bonus')?.reason).toContain('武艺条件');
    expect(entries.find(entry => entry.id === 'move')?.reason).toBe('');
  });

  it('大量技能可分页、按全名搜索，切换分类后页码不会越界', () => {
    const entries = [...commonEntries(caster()), ...abilityEntries(caster())];
    const first = actionPage(entries, 'all', 0), second = actionPage(entries, 'all', 1);
    expect(first.pages).toBe(2); expect(first.entries).toHaveLength(14);
    expect(new Set([...first.entries, ...second.entries].map(entry => entry.id)).size).toBe(entries.length);
    expect(actionPage(entries, 'spells', 9).page).toBe(0);
    expect(actionPage(entries, 'all', 0, '魔法飞弹').entries.map(entry => entry.id)).toEqual(['magic_missile', 'missile_scroll']);
    expect(actionPage(entries, 'all', 0, '不存在').entries).toEqual([]);
  });

  it('敌方回合、反应中和战斗结算后均不允许使用技能', () => {
    const state = caster();
    for (const blocked of [{ ...state, turnIndex: 1 }, { ...state, pendingReaction: { reactor: 'hero', moving: 'demo_enemy' } },
      { ...state, result: { outcome: 'win' as const, reason: 'eliminated' as const } }]) {
      expect(canUseActionBar(blocked)).toBe(false);
      expect(abilityChoices(blocked, 'magic_missile')).toEqual([]);
    }
  });
});
