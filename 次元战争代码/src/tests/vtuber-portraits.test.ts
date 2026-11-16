import { describe, expect, it } from 'vitest';
import type { ActorState } from '../game/state.js';
import { emptyState } from '../game/state.js';
import { resolveVisual } from '../game/visual/resolve.js';
import { portraitMetric, portraitTransform } from '../game/visual/portrait-metrics.js';
import { sceneImageUrls } from '../game/visual/story-images.js';
import { storyLibrary } from '../game/story/library.js';
import { showActor } from '../game/story/presentation.js';
import { overrides } from '../game/story/config.js';
import { assetUrl } from '../game/asset-url.js';
import registration from '../../art/vtuber-v1/registration.json';

const actor = (pose = '', expression = ''): ActorState => ({ actor: '虚拟主播', visible: true, position: 'right',
  asset: 'char_virtual_streamer_shy', pose, expression });
const file = (state: ActorState) => {
  const plan = resolveVisual(state);
  expect(plan.kind).toBe('static');
  return plan.kind === 'static' ? plan.url.split('/').pop() : undefined;
};
describe('虚拟主播透明立绘接入', () => {
  it('原占位资源键绑定日常母版，缺图失败仍保留明确占位', () => {
    expect(file(actor())).toBe('vtuber-shy.png');
    expect(overrides.portraits.char_virtual_streamer_shy).toBe(assetUrl('/assets/portraits/vtuber-v1/vtuber-shy.png'));
    expect(resolveVisual(actor(), { char_virtual_streamer_shy: true }).kind).toBe('placeholder');
    expect(resolveVisual({ ...actor(), asset: 'char_unknown' }).kind).toBe('placeholder');
  });
  it.each([
    ['紧张、躲避视线', 'shy'], ['微笑', 'smile'], ['害羞、耳朵发红', 'embarrassed'],
    ['恐惧', 'startled'], ['不安', 'tense'],
  ])('显式表情 %s 调用 %s', (expression, expected) => {
    expect(file(actor('', expression))).toBe(`vtuber-${expected}.png`);
  });
  it('V101 原始 SHOW 与增量更新调用电脑、递书和提醒，原文与角色输入不被改写', () => {
    const scene = storyLibrary.vtuber_bond1!.scenes.find(scene => scene.id === 'v101')!;
    const original = JSON.stringify(scene);
    const state = emptyState(), actual: string[] = [];
    for (const node of scene.nodes) if (node.kind === 'show' && node.actor === '虚拟主播') {
      const effects: Parameters<typeof showActor>[2] = [];
      showActor(state, node, effects);
      expect(effects.filter(effect => effect.kind === 'warn')).toEqual([]);
      const value = Object.freeze({ ...state.actors['虚拟主播']! });
      actual.push(file(value)!);
      expect(value.position).toBe('right');
    }
    expect(actual).toEqual(['vtuber-laptop-focus.png', 'vtuber-laptop-guard.png', 'vtuber-laptop-guard.png',
      'vtuber-laptop-guard.png', 'vtuber-laptop-guard.png', 'vtuber-laptop-guard.png', 'vtuber-book-offer.png', 'vtuber-reminder.png']);
    expect(JSON.stringify(scene)).toBe(original);
  });
  it.each([
    ['a013', 'vtuber-pit-collapse.png'], ['a014', 'vtuber-unconscious.png'],
    ['a015', 'vtuber-unconscious.png'], ['a015_recovery', 'vtuber-bed-awake.png'],
  ])('%s 使用专用趴伏或躺姿，不被继承的恐惧表情覆盖', (id, expected) => {
    const scene = storyLibrary.act1!.scenes.find(scene => scene.id === id)!;
    const node = scene.nodes.find(node => node.kind === 'show' && node.actor === '虚拟主播');
    expect(node?.kind).toBe('show');
    if (node?.kind === 'show') expect(file(actor(node.pose, '恐惧'))).toBe(expected);
  });
  it('预热 V101 的专用动作资源，不再预取虚拟主播占位', () => {
    const urls = sceneImageUrls(emptyState(), storyLibrary, 'vtuber_bond1', 'v101');
    for (const name of ['laptop-focus', 'laptop-guard', 'book-offer', 'reminder']) {
      expect(urls).toContain(assetUrl(`/assets/portraits/vtuber-v1/vtuber-${name}.png`));
    }
  });
  it.each(registration.assets)('$id 图形度量保持头高与三人安全轮廓，同姿态不随人数缩放', entry => {
    const plan = { kind: 'static' as const, key: entry.id, url: assetUrl(entry.file.replace(/^public/, '')) };
    const metric = portraitMetric(plan, 'static');
    expect(metric.group).toMatch(/^vtuber-/);
    expect((metric.head[1] - metric.head[0]) * metric.scale).toBeGreaterThanOrEqual(130);
    expect((metric.head[1] - metric.head[0]) * metric.scale).toBeLessThanOrEqual(150);
    expect((metric.safety[1] - metric.safety[0]) * metric.scale).toBeLessThanOrEqual(340);
    const transforms = [256, 384, 640, 896, 1024].map(center => portraitTransform(metric, center));
    expect(new Set(transforms.map(t => t.scale)).size).toBe(1);
    expect(transforms.every(t => t.top + metric.head[0] * t.scale === metric.headTop)).toBe(true);
    const pages = assetUrl(entry.file.replace(/^public/, ''), '/dimensional-war-game-source/');
    expect(portraitMetric({ ...plan, url: pages }, 'static')).toEqual(metric);
  });
  it('尚未制作的完整行走动作保留诊断，解析不改写原演员状态', () => {
    const state = Object.freeze(actor('低头带路、与男高保持距离', '紧张'));
    expect(resolveVisual(state)).toMatchObject({ kind: 'static', diagnostic: expect.stringContaining('完整动作尚未制作') });
    expect(state).toMatchObject({ pose: '低头带路、与男高保持距离', expression: '紧张', position: 'right' });
  });
});
