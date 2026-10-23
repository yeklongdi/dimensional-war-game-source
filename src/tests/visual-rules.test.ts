import { describe, expect, it } from 'vitest';
import { assetUrl } from '../game/asset-url.js';
import { heroRecipes } from '../game/visual/hero.js';
import { resolveVisual } from '../game/visual/resolve.js';
import { sampleAnimation } from '../game/visual/animation.js';
import { isTalking } from '../game/visual/types.js';
import type { ActorState, TextKind, TextWait } from '../game/state.js';
import { emptyState } from '../game/state.js';
import { scenePresentation } from '../game/story/restore.js';
import { storyLibrary } from '../game/story/library.js';
import inventory from '../../docs/verification/dialogue-presentation/hero-inventory.json';

const actor: ActorState = { actor: '男高', visible: true, position: 'right', asset: 'char_male_high_normal', pose: '普通站姿', expression: '默认平静' };
const wait = (kind: TextKind = 'dialogue', revealed = 2): TextWait => ({ kind: 'text', textKind: kind, speaker: '男高',
  text: '一二三四', revealed, token: 'fixture', origin: { nodeIndex: 0 } });
const speech = { ...actor, supported: true, mouthAllowed: true, prop: false };
const recipe = heroRecipes[0]!;
// 保留首轮“未批准／未齐备”目录的全部拒绝断言。正式v3批准状态另由hero-samples.test验收。
const unapprovedRecipes = heroRecipes.map((item, index) => ({ ...item, approved: false, candidateReady: index === 0 }));

describe('纯视觉映射，不改变剧情和继承', () => {
  it.each(unapprovedRecipes)('$id 显式登记，未通过美术验收时正式入口只静态回退', item => {
    const original = Object.freeze({ ...actor, pose: item.pose, expression: item.expression });
    const plan = resolveVisual(original, {}, false, unapprovedRecipes);
    expect(plan.kind).toBe('static');
    expect(plan.diagnostic).toContain('候选');
    expect(original.position).toBe('right');
    expect(plan).not.toHaveProperty('position');
  });
  it('开发页只能启用资源齐备的候选，不将待制作组合当已完成', () => {
    expect(resolveVisual(actor, {}, true, unapprovedRecipes).kind).toBe('layered');
    const luggage = heroRecipes[2]!;
    expect(resolveVisual({ ...actor, pose: luggage.pose, expression: luggage.expression }, {}, true, unapprovedRecipes).kind).toBe('static');
  });
  it.each(['坐在沙发上', '躺在床上、刚醒', '持剑、准备保护虚拟主播', '不存在姿态'])('%s 不被偷偷替换为普通站姿', pose => {
    const plan = resolveVisual({ ...actor, pose }, {}, true);
    expect(plan.kind).toBe('static'); expect(plan.diagnostic).toContain(pose);
  });
  it('不同asset不误用同名男高分层，原静态失败才占位', () => {
    expect(resolveVisual({ ...actor, asset: '蒙面占位' }, {}, true).kind).toBe('placeholder');
    expect(resolveVisual(actor, { char_male_high_normal: true }, false, unapprovedRecipes).kind).toBe('placeholder');
  });
  it('其他人物／道具保留既有映射', () => {
    expect(resolveVisual({ ...actor, actor: '奶奶', asset: 'char_grandmother_warm' }).kind).toBe('placeholder');
    expect(resolveVisual({ ...actor, actor: '大师之剑', asset: 'sword' }).kind).toBe('placeholder');
  });
  it('真实A007／A010重建继承姿态、表情及位置，不用当前说话者猜测', () => {
    const seven = scenePresentation(storyLibrary, 'act1', 'a007').actors['男高']!;
    expect(seven).toMatchObject({ pose: '准备伸懒腰', expression: '疑惑', position: 'center' });
    const ten = scenePresentation(storyLibrary, 'act1', 'a010').actors['男高']!;
    expect(ten).toMatchObject({ pose: '停步观察围栏', expression: '好奇' });
  });
  it('完整盘点仍为19姿态24表情，25次更新均有原文行号，不将通用回退标成完成', () => {
    expect(inventory.counts).toEqual({ poses: 19, expressions: 24, showUpdates: 25 });
    expect(inventory.updates.every(item => item.refs.length && item.refs.every(ref => ref.line > 0))).toBe(true);
    expect(inventory.updates.every(item => !item.visualApproved)).toBe(true);
    const sofa = inventory.updates.find(item => item.sceneId === 'p003' && item.nodeIndex === 2)!;
    expect(sofa.recipe).toBeNull();
    expect(inventory.updates.find(item => item.sceneId === 'p002')?.inheritedCombination.pose).toBe('携带行李、站立');
  });
  it.each(['/', '/dimensional-war-game-pages/', './'])('%s 下每个新图层都经过相同base适配', base => {
    for (const layer of recipe.layers) for (const url of layer.frames) {
      const path = '/assets/' + url.split('/assets/')[1]!;
      expect(assetUrl(path, base)).toBe(`${base}assets/${path.slice('/assets/'.length)}`);
    }
  });
});

describe('口型仅绑定可见人物台词逐字状态', () => {
  it('逐字时开合，补全或完毕时立即停止', () => {
    expect(isTalking(speech, wait())).toBe(true);
    for (const count of [0, 4, 999]) expect(isTalking(speech, wait('dialogue', count))).toBe(false);
  });
  it.each(['inner', 'narration', 'stage'] as const)('%s 没有口型', kind => {
    expect(isTalking(speech, wait(kind))).toBe(false);
  });
  it('隐藏、场外、道具、缺分层或嘴被占用均不套普通口型', () => {
    for (const changed of [{ visible: false }, { actor: '场外' }, { prop: true }, { supported: false }, { mouthAllowed: false }]) {
      expect(isTalking({ ...speech, ...changed }, wait())).toBe(false);
    }
    expect(isTalking(speech, null)).toBe(false);
  });
});

describe('独立视觉时间线', () => {
  const eyes = recipe.layers.find(layer => layer.channel === 'eyes')!;
  const mouth = recipe.layers.find(layer => layer.channel === 'mouth')!;
  it('按开眼、半闭、闭眼、半闭、开眼切换', () => {
    expect([0, 4050, 4130, 4210, 4290].map(time => sampleAnimation(recipe, eyes, time, false).frame)).toEqual([0, 1, 2, 1, 0]);
  });
  it('口型允许时开合，停止立即恢复配方静止嘴型', () => {
    expect(sampleAnimation(recipe, mouth, 125, true).frame).toBe(1);
    expect(sampleAnimation(recipe, mouth, 125, false).frame).toBe(0);
  });
  it('固定闭眼或占嘴通过配置禁止自动切换', () => {
    const limited = { ...recipe, limits: { ...recipe.limits, blink: false, mouth: false } };
    expect(sampleAnimation(limited, eyes, 4130, true).frame).toBe(0);
    expect(sampleAnimation(limited, mouth, 125, true).frame).toBe(0);
  });
  it('躯干与头发小幅分别变换，无整图缩放参数', () => {
    const body = recipe.layers.find(layer => layer.motion === 'body')!;
    const hair = recipe.layers.find(layer => layer.motion === 'hair')!;
    const frame = sampleAnimation(recipe, body, 1000, false);
    expect(Math.abs(frame.y)).toBeLessThanOrEqual(1.3); expect(frame).not.toHaveProperty('scale');
    expect(sampleAnimation(recipe, hair, 1000, false).rotate).not.toBe(0);
  });
  it('准备动作仅显式触发；恢复／挂载不补播', () => {
    const prepared = heroRecipes[4]!, arm = prepared.layers.find(layer => layer.motion === 'upper-left')!;
    expect(sampleAnimation(prepared, arm, 100, false).rotate).toBe(0);
    expect(sampleAnimation(prepared, arm, 100, false, 425).rotate).toBe(-7);
    expect(Math.abs(sampleAnimation(prepared, arm, 100, false, 1000).rotate)).toBeLessThan(.00001);
  });
  it('纯查询不修改配方、剧情、flag、日志、RNG或存档，不生成随机数', () => {
    const state = emptyState(); state.actors['男高'] = actor; state.waiting = wait();
    const before = JSON.stringify({ state, recipe });
    for (let time = 0; time < 10000; time += 30) for (const layer of recipe.layers) sampleAnimation(recipe, layer, time, true);
    resolveVisual(actor); isTalking(speech, wait());
    expect(JSON.stringify({ state, recipe })).toBe(before);
  });
});
