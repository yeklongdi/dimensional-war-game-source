import { assetUrl } from '../asset-url.js';
import type { Layer, LayerRecipe, Motion, Vec } from './types.js';

const directory = '/assets/portraits/hero-layered-v1/';
// AI交付未精确注册，下面仅供候选检查；完整画布与原始PNG保持不动。
const registrations: Readonly<Record<string, NonNullable<Layer['registration']>>> = {
  'upper-left': [{ offset: [0, 27], scale: [.5, .5], pivot: [350, 420] }],
  'lower-left': [{ offset: [-15, -10], scale: [.62, .62], pivot: [300, 640] }],
  'upper-right': [{ offset: [13, -58], scale: [.55, .55], pivot: [630, 420] }],
  'lower-right': [{ offset: [0, 55], scale: [.5, .5], pivot: [700, 640] }],
  eyes: [0, 1, 2].map(() => ({ offset: [-2, -40], scale: [.6, .6], pivot: [500, 300] })),
  mouth: [{ offset: [-4, 0], scale: [.7, .7], pivot: [500, 320] }, { offset: [6, 2], scale: [.65, .65], pivot: [500, 320] }],
};
const layer = (id: string, z: number, pivot: Vec, motion: Motion, frames = [id], channel?: Layer['channel']): Layer => ({
  id, z, offset: [0, 0], pivot, motion, frames: frames.map(name => assetUrl(`${directory}${name}.png`)), channel,
  registration: registrations[id],
});
const common = [
  layer('hair-back', 0, [500, 355], 'hair'),
  layer('body', 1, [500, 850], 'body'),
  layer('upper-left', 2, [358, 430], 'upper-left'),
  layer('lower-left', 3, [300, 640], 'lower-left'),
  layer('upper-right', 4, [630, 430], 'upper-right'),
  layer('lower-right', 5, [700, 640], 'lower-right'),
  layer('head', 6, [500, 380], 'head'),
  layer('hair-front', 10, [500, 200], 'hair'),
];
const expressions = {
  calm: { raw: '默认平静', eyes: 'eyes-calm', mouth: 'mouth-calm' },
  proud: { raw: '得意', eyes: 'eyes-proud', mouth: 'mouth-proud' },
  nervous: { raw: '紧张、期待', eyes: 'eyes-nervous', mouth: 'mouth-calm' },
  relaxed: { raw: '放松、微笑', eyes: 'eyes-relaxed', mouth: 'mouth-smile' },
  puzzled: { raw: '疑惑', eyes: 'eyes-puzzled', mouth: 'mouth-calm' },
} as const;
function recipe(id: string, pose: string, expression: keyof typeof expressions, luggage = false): LayerRecipe {
  const face = expressions[expression];
  return {
    id, pose, expression: face.raw, canvas: [1024, 1536], anchor: [512, 1536],
    // 候选图逐组合视觉验收前不启用；开发样板页可显式查看候选。
    approved: false,
    candidateReady: id === 'hero_stand_calm',
    limits: { blink: true, mouth: true, breathe: true, sway: true, prepare: pose === '准备伸懒腰' },
    layers: [...common,
      layer('eyes', 7, [500, 275], 'head', [face.eyes, 'eyes-half-v2', 'eyes-closed-v2'], 'eyes'),
      layer('mouth', 8, [500, 320], 'head', [face.mouth, 'mouth-open'], 'mouth'),
      ...(luggage ? [layer('luggage', 9, [288, 830], 'prop')] : []),
    ].sort((a, b) => a.z - b.z),
  };
}
export const heroRecipes: readonly LayerRecipe[] = [
  recipe('hero_stand_calm', '普通站姿', 'calm'),
  recipe('hero_stand_proud', '普通站姿', 'proud'),
  recipe('hero_luggage_nervous', '携带行李、站立', 'nervous', true),
  recipe('hero_luggage_relaxed', '携带行李、站立', 'relaxed', true),
  recipe('hero_prepare_puzzled', '准备伸懒腰', 'puzzled'),
];
