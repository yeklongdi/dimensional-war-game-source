import { describe, expect, it, vi } from 'vitest';
import { heroRecipes } from '../game/visual/hero.js';
import { resolveVisual } from '../game/visual/resolve.js';
import { sampleAnimation } from '../game/visual/animation.js';
import { loadLayers } from '../game/visual/loading.js';
import type { ActorState } from '../game/state.js';
import { segmentedVisual } from './fixtures/segmented-visual.js';

const actor: ActorState = { actor: '男高', visible: true, position: 'right', asset: 'char_male_high_normal', pose: '坐在沙发上', expression: '得意' };
describe('本轮分层接入复核', () => {
  it('不同缺口仍用同一张静态回退时只更新诊断，不因表情换了重复加载整张图', () => {
    const first = resolveVisual({ ...actor, pose: '抱着虚拟主播、疲惫' }), changed = resolveVisual({ ...actor, pose: '取剑，抖开旧布包裹', expression: '期待' });
    expect(first.kind).toBe('static'); expect(changed.kind).toBe('static');
    expect(first.key).toBe(changed.key); expect(first.diagnostic).not.toBe(changed.diagnostic);
    expect(actor).toMatchObject({ position: 'right', pose: '坐在沙发上', expression: '得意' });
  });
  it.each(['left', 'right'] as const)('%s 前臂关节跟随上臂旋转，不能各自原地旋转而脱节', side => {
    const recipe = { ...segmentedVisual, limits: { ...segmentedVisual.limits, breathe: false } };
    const upper = recipe.layers.find(layer => layer.motion === `upper-${side}`)!, lower = recipe.layers.find(layer => layer.motion === `lower-${side}`)!;
    const first = sampleAnimation(recipe, upper, 0, false, 425), next = sampleAnimation(recipe, lower, 0, false, 425);
    const dx = lower.pivot[0] - upper.pivot[0], dy = lower.pivot[1] - upper.pivot[1], angle = first.rotate * Math.PI / 180;
    expect(lower.pivot[0] + next.x).toBeCloseTo(upper.pivot[0] + dx * Math.cos(angle) - dy * Math.sin(angle));
    expect(lower.pivot[1] + next.y).toBeCloseTo(upper.pivot[1] + dx * Math.sin(angle) + dy * Math.cos(angle));
    expect(Math.abs(next.rotate)).toBeCloseTo(18); expect(Math.abs(first.rotate)).toBeCloseTo(7);
  });
  it('恢复时未提供动作起点直接定格，不补播手臂准备动作', () => {
    const recipe = { ...segmentedVisual, limits: { ...segmentedVisual.limits, breathe: false } };
    const arm = recipe.layers.find(layer => layer.motion === 'lower-left')!;
    expect(sampleAnimation(recipe, arm, 400, false)).toEqual({ x: 0, y: 0, rotate: 0, frame: 0 });
    expect(sampleAnimation(recipe, arm, 1000, false, 1000)).toMatchObject({ rotate: expect.closeTo(0, 8) });
  });
  it('空图层或空差分在任何图片IO前拒绝，交给已存在的静态回退', async () => {
    const recipe = heroRecipes[0]!, port = vi.fn(async (url: string) => url);
    await expect(loadLayers({ ...recipe, layers: [] }, port)).rejects.toThrow('缺少');
    await expect(loadLayers({ ...recipe, layers: [{ ...recipe.layers[0]!, frames: [] }] }, port)).rejects.toThrow('缺少');
    expect(port).not.toHaveBeenCalled();
  });
  it('重复图层id在加载前明确拒绝，避免覆盖已有身体实例', async () => {
    const recipe = heroRecipes[0]!, port = vi.fn(async (url: string) => url);
    await expect(loadLayers({ ...recipe, layers: [recipe.layers[0]!, recipe.layers[0]!] }, port)).rejects.toThrow('重复');
    expect(port).not.toHaveBeenCalled();
  });
});
