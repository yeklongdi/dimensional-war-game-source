import { describe, expect, it } from 'vitest';
import { portraitMetric, portraitMetricGroups, portraitTransform } from '../game/visual/portrait-metrics.js';
import { resolveVisual } from '../game/visual/resolve.js';
import { heroRecipes } from '../game/visual/hero.js';
import { assetUrl } from '../game/asset-url.js';

describe('原素材坐标的外层等比度量', () => {
  it.each(Object.values(portraitMetricGroups))('$group 安全轮廓≤340、三人间隙≥24；头顶固定210', metric => {
    const width = (metric.safety[1] - metric.safety[0]) * metric.scale;
    expect(width).toBeLessThanOrEqual(340); expect(384 - width).toBeGreaterThanOrEqual(24);
    const transform = portraitTransform(metric, 640);
    expect(transform.top + metric.head[0] * transform.scale).toBe(210);
    expect(transform.height).toBe(metric.canvas[1] * transform.scale);
  });
  it('一／二／三人尺度不变，中心／发言只改平移', () => {
    const metric = portraitMetricGroups.layered;
    const frames = [256, 384, 640, 896, 1024].map(center => portraitTransform(metric, center));
    expect(new Set(frames.map(f => f.scale)).size).toBe(1);
    expect(new Set(frames.map(f => f.height)).size).toBe(1);
  });
  it('五个动态组合共享度量和锚点，不改变层注册或动作参数', () => {
    const source = JSON.stringify(heroRecipes);
    for (const recipe of heroRecipes) {
      const plan = resolveVisual({ actor: '男高', visible: true, position: 'left', asset: 'char_male_high_normal', pose: recipe.pose, expression: recipe.expression });
      expect(portraitMetric(plan, 'layered')).toEqual(portraitMetricGroups.layered);
    }
    expect(JSON.stringify(heroRecipes)).toBe(source);
  });
  it('坐姿／持剑／躺靠使用专用度量，不改选站姿；同组表情共享基准', () => {
    for (const [file, group] of [['hero-seated-proud', 'seated'], ['hero-sword-guard', 'sword'], ['hero-half-bed-awake', 'bed']] as const) {
      const url = assetUrl(`/assets/portraits/prologue-v2/${file}.png`);
      expect(portraitMetric({ kind: 'static', key: file, url }, 'static')).toEqual(portraitMetricGroups[group]);
    }
    const file = (mood: string) => ({ kind: 'static' as const, key: mood, url: `/assets/portraits/hero-half-v1/hero-half-${mood}.png` });
    expect(portraitMetric(file('friendly'), 'static')).toEqual(portraitMetric(file('angry'), 'static'));
  });
  it('分层失败按实际静态回退度量，不将原分层尺度套到大头图', () => {
    const recipe = heroRecipes[0]!;
    const plan = { kind: 'layered' as const, key: recipe.id, recipe, fallback: '/assets/portraits/hero-half-v1/hero-half-friendly.png' };
    expect(portraitMetric(plan, 'static')).toEqual(portraitMetricGroups.half);
    expect(portraitMetric(plan, 'placeholder').group).toBe('placeholder');
  });
  it.each(['/', '/dimensional-war-game-source/'])('%s子路径只影响URL，不影响造型与排位度量', base => {
    const plan = { kind: 'static' as const, key: 'saber', url: assetUrl('/assets/portraits/prologue-v2/saber-calm.png', base) };
    expect(portraitMetric(plan, 'static')).toEqual(portraitMetricGroups.saber);
  });
});
