import type { VisualPlan, Vec } from './types.js';

export type PortraitMetric = {
  group: string; canvas: Vec; head: readonly [number, number]; anchor: Vec;
  safety: readonly [number, number]; scale: number; headTop: number; note?: string;
};
const metric = (group: string, head: readonly [number, number], scale: number, safety: readonly [number, number], anchorX = 512, note?: string): PortraitMetric =>
  ({ group, canvas: [1024, 1536], head, anchor: [anchorX, head[0]], safety, scale, headTop: 210, note });
/** 原坐标度量，不裁图、不更改内部关节；safety为窗上轮廓（含动作余量）。 */
export const portraitMetricGroups = {
  layered: metric('hero-layered', [48, 339], .47, [150, 870]),
  half: metric('hero-half', [30, 535], .28, [0, 1024]),
  bed: metric('hero-bed', [30, 470], .30, [0, 1024], 512, '躺靠倾斜头部，保留专用姿态'),
  seated: metric('hero-seated', [50, 440], .34, [20, 1000], 512, '坐姿膝／手轮廓较宽，独立校准'),
  sword: metric('hero-sword', [30, 425], .33, [0, 1024], 512, '剑与手臂计入窗上安全范围'),
  link: metric('link', [18, 420], .33, [0, 1024]),
  saber: metric('saber', [8, 400], .33, [0, 1024], 512, '披风宽姿态，头高约129px，优先轮廓间隔'),
  daily: metric('thief-daily', [40, 455], .33, [0, 1024]),
  masked: metric('thief-masked', [40, 380], .39, [180, 1010], 545, '头部基准含礼帽，保持行动形态'),
  unmasked: metric('thief-unmasked', [110, 340], .57, [270, 860], 520, '全身行动服，按窗上肩／披风轮廓校准'),
  creature: metric('deoxys', [20, 470], .32, [0, 1024], 512, '非人形：主体基准，不当作人类头部'),
} satisfies Record<string, PortraitMetric>;
export const placeholderMetric: PortraitMetric = { group: 'placeholder', canvas: [180, 510], head: [0, 140],
  anchor: [90, 0], safety: [0, 180], scale: 1, headTop: 210 };

export function portraitMetric(plan: VisualPlan, actual: 'layered' | 'static' | 'placeholder', url = ''): PortraitMetric {
  if (actual === 'placeholder') return placeholderMetric;
  if (actual === 'layered') return portraitMetricGroups.layered;
  const file = (url || (plan.kind === 'static' ? plan.url : plan.kind === 'layered' ? plan.fallback ?? '' : '')).split('/').pop() ?? '';
  if (file.startsWith('hero-half-bed')) return portraitMetricGroups.bed;
  if (file.startsWith('hero-half')) return portraitMetricGroups.half;
  if (file.startsWith('hero-seated')) return portraitMetricGroups.seated;
  if (file.startsWith('hero-sword')) return portraitMetricGroups.sword;
  if (file.startsWith('thief-unmasked')) return portraitMetricGroups.unmasked;
  if (file.startsWith('thief-action')) return portraitMetricGroups.masked;
  if (file.startsWith('thief-daily')) return portraitMetricGroups.daily;
  if (file.startsWith('link-')) return portraitMetricGroups.link;
  if (file.startsWith('saber-')) return portraitMetricGroups.saber;
  if (file.startsWith('deoxys-')) return portraitMetricGroups.creature;
  return portraitMetricGroups.half;
}
export function portraitTransform(metric: PortraitMetric, center: number) {
  return { left: center - metric.anchor[0] * metric.scale, top: metric.headTop - metric.anchor[1] * metric.scale,
    width: metric.canvas[0] * metric.scale, height: metric.canvas[1] * metric.scale, scale: metric.scale };
}
