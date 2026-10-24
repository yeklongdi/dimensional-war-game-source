import { describe, expect, it } from 'vitest';
import { resolveVisual } from '../game/visual/resolve.js';
import { heroRecipes } from '../game/visual/hero.js';
import { staticPortrait, staticPortraits } from '../game/visual/static-portraits.js';
import type { ActorState } from '../game/state.js';
import { isStoryProp } from '../game/ui/props.js';
import inventory from '../../docs/verification/prologue-v2/visual-inventory.json';
import registration from '../../art/prologue-v2/registration.json';
import halfRegistration from '../../art/hero-half-v1/registration.json';
import { heroExpressionPortraits } from '../game/visual/hero-half.js';
import { displaySceneTitle } from '../game/story/chapter-policy.js';
import { storyLibrary } from '../game/story/library.js';

const actor = (asset: string, pose = '', expression = ''): ActorState => ({ actor: asset === 'char_male_high_normal' ? '男高' : '测试人物',
  asset, pose, expression, position: 'right', visible: true });
describe('按已有图和官方参考制作的新版静态立绘', () => {
  it('制作场景标题也隐藏作者真名，原导出标题不改写', () => {
    const title = storyLibrary.prologue_4!.scenes.find(scene => scene.id === 'c005')!.title;
    expect(title).toBe('林克明显占优'); expect(displaySceneTitle(title)).toBe('金发青年明显占优');
  });
  it('所有新静态映射均指向登记素材；未知人物按用户最新决定保留占位', () => {
    const urls = new Set([...registration.assets, ...halfRegistration.assets].map(item => item.file.replace(/^public/, '')));
    for (const row of inventory) {
      const plan = staticPortrait(actor(row.asset, row.pose, row.expression));
      if (row.asset in staticPortraits) expect(plan, row.asset).toBeDefined();
      if (plan) expect(urls.has(plan.url), plan.url).toBe(true);
    }
    expect(resolveVisual(actor('char_grandmother_warm')).kind).toBe('placeholder');
    expect(resolveVisual(actor('char_virtual_streamer_shy')).kind).toBe('placeholder');
  });
  it('日常三表情不同素材，蒙面与夜间摘面罩有独立衣装，不在摘面罩时换日常服', () => {
    const states = [actor('char_thief_smile', '从路口拐出', '意外'), actor('char_thief_smile', '托腮看向男高', '有趣、微笑'),
      actor('char_thief_smile', '', '认真')].map(item => staticPortrait(item)!);
    expect(new Set(states.map(item => item.key)).size).toBe(3);
    expect(staticPortrait(actor('char_thief_masked_black_placeholder'))!.key).toBe('static-v2:thief-action');
    expect(staticPortrait(actor('char_thief_smile', '收起面罩', '带笑，观察男高'))!.key).toBe('static-v2:thief-unmasked-action-smile');
    expect(staticPortrait(actor('char_thief_smile', '靠墙简短解释', '认真'))!.key).toBe('static-v2:thief-unmasked-action-serious');
  });
  it('金发青年有警戒与包剑差分，女剑士别名共用素材，不明生物形态不同', () => {
    expect(staticPortrait(actor('char_link_silent_placeholder', '', '警戒'))!.key).toBe('static-v2:link-guard');
    expect(staticPortrait(actor('char_link_silent_placeholder', '将旧布裹住的剑垂在身侧', '安静'))!.key).toBe('static-v2:link-wrapped');
    expect(resolveVisual({ ...actor('char_saber_traveler_placeholder', '', '平静'), actor: 'Saber' })).toEqual(resolveVisual({ ...actor('char_saber_traveler_placeholder', '', '平静'), actor: '女剑士' }));
    expect(staticPortrait(actor('char_deoxys_normal_placeholder'))!.key).not.toBe(staticPortrait(actor('char_deoxys_defense_placeholder'))!.key);
  });
  it('坐姿与持剑有精确静态映射，仍未制作的复杂姿态继续明确回退', () => {
    expect(resolveVisual(actor('char_male_high_normal', '坐在沙发上', '得意'))).toMatchObject({ kind: 'static', key: 'static-v2:hero-seated-proud', frame: 'waist' });
    expect(resolveVisual(actor('char_male_high_normal', '持剑、准备保护虚拟主播', '震惊、警戒'))).toMatchObject({ kind: 'static', key: 'static-v2:hero-sword-guard' });
    expect(resolveVisual(actor('char_male_high_normal', '抱着虚拟主播、疲惫', '尴尬、担心'))).toMatchObject({ kind: 'static', diagnostic: expect.stringContaining('回退') });
    for (const recipe of heroRecipes) expect(resolveVisual(actor('char_male_high_normal', recipe.pose, recipe.expression))).toMatchObject({ kind: 'layered', key: recipe.id });
  });
  it('视觉解析不修改角色状态，缺图有明确占位；prop单独分类', () => {
    const state = Object.freeze(actor('char_thief_smile', '从路口拐出', '意外'));
    expect(resolveVisual(state)).not.toHaveProperty('position'); expect(state.position).toBe('right');
    expect(resolveVisual(state, { char_thief_smile: true }).kind).toBe('placeholder');
    expect(isStoryProp(actor('prop_master_sword_corrupted_placeholder'))).toBe(true);
    expect(isStoryProp(actor('char_deoxys_normal_placeholder'))).toBe(false);
  });
  it('四段所有已定形象的84个状态均有半身显示，男高50个状态不再使用带背景hero.png', () => {
    const known = inventory.filter(row => row.asset === 'char_male_high_normal' || row.asset in staticPortraits);
    expect(known).toHaveLength(84);
    for (const row of known) {
      const plan = resolveVisual(actor(row.asset, row.pose, row.expression));
      expect(plan.kind, `${row.asset}/${row.pose}/${row.expression}`).not.toBe('placeholder');
      if (plan.kind === 'static') {
        expect(['waist', 'bust']).toContain(plan.frame); expect(plan.url).not.toMatch(/\/hero\.png$/);
      } else if (plan.kind === 'layered') expect(plan.fallback).not.toMatch(/\/hero\.png$/);
      if (row.asset === 'char_male_high_normal') expect(heroExpressionPortraits[row.expression], row.expression).toBeDefined();
    }
  });
  it('A008好奇友善有透明半身；A001刚醒有躺靠差分；动态加载失败也不会回旧全身图', () => {
    expect(resolveVisual(actor('char_male_high_normal', '自然跟随', '好奇、友善'))).toMatchObject({
      kind: 'static', key: 'half-v1:hero-half-friendly', frame: 'bust', diagnostic: expect.stringContaining('完整动作尚未制作') });
    const sleepy = resolveVisual(actor('char_male_high_normal', '躺在床上、刚醒', '困倦、慌张'));
    const awake = resolveVisual(actor('char_male_high_normal', '躺在床上、刚醒', '自信、急着出门'));
    expect(sleepy.key).toBe('half-v1:hero-half-bed-sleepy'); expect(awake.key).toBe('half-v1:hero-half-bed-awake');
    const recipe = heroRecipes[0]!, plan = resolveVisual(actor('char_male_high_normal', recipe.pose, recipe.expression));
    expect(plan).toMatchObject({ kind: 'layered', fallback: expect.stringContaining('/hero-half-v1/'), fallbackFrame: 'bust' });
  });
});
