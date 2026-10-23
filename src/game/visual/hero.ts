import { assetUrl } from '../asset-url.js';
import type { Layer, LayerRecipe, Motion, Vec } from './types.js';

const layer = (id: string, z: number, pivot: Vec, motion: Motion, frames: string[], channel?: Layer['channel']): Layer => ({
  id, z, pivot, motion, offset: [0, 0], channel,
  frames: frames.map(name => assetUrl(`/assets/portraits/hero-layered-v3/${name}.png`)),
});
const faceNames = { calm: '默认平静', proud: '得意', nervous: '紧张、期待', relaxed: '放松、微笑', puzzled: '疑惑' } as const;
type Expression = keyof typeof faceNames;
type Pose = 'stand' | 'luggage' | 'prepare';
const poseNames = { stand: '普通站姿', luggage: '携带行李、站立', prepare: '准备伸懒腰' } as const;

function recipe(id: string, pose: Pose, emotion: Expression, approved: boolean): LayerRecipe {
  const layers = [
    layer('body', 1, [500, 850], 'body', [`body-${pose}`]),
    layer('head', 6, [500, 330], 'head', ['head']),
    layer('eyes', 7, [500, 330], 'head', [`eyes-${emotion}`, `eyes-${emotion}-half`, `eyes-${emotion}-closed`], 'eyes'),
    layer('mouth', 8, [500, 330], 'head', [`mouth-${emotion}`, `mouth-${emotion}-speech`], 'mouth'),
    layer('hair-front', 9, [505, 180], 'hair', ['hair-front']),
  ];
  // 握持手、前臂与行李作为一个注册组，与躯干同步呼吸，不产生道具脱手。
  if (pose === 'luggage') layers.push(layer('luggage', 2, [320, 550], 'body', ['luggage-grip']));
  // 准备动作只需肩部转动，整臂裁出并保持原画肘／袖口连续，避免不必要的接缝。
  if (pose === 'prepare') layers.push(
    layer('arm-left', 2, [350, 405], 'upper-left', ['arm-left-prepare']),
    layer('arm-right', 2, [633, 410], 'upper-right', ['arm-right-prepare']),
  );
  return {
    id, pose: poseNames[pose], expression: faceNames[emotion], canvas: [1024, 1536], anchor: [512, 1536],
    approved, candidateReady: true, layers: layers.sort((a, b) => a.z - b.z),
    limits: { blink: true, mouth: true, breathe: true, sway: true, prepare: pose === 'prepare' },
  };
}

// 每个组合分别验收，不能因为图能解码而统一批准。证据位于hero-visual-samples。
export const heroRecipes: readonly LayerRecipe[] = [
  recipe('hero_stand_calm', 'stand', 'calm', true),
  recipe('hero_stand_proud', 'stand', 'proud', true),
  recipe('hero_luggage_nervous', 'luggage', 'nervous', true),
  recipe('hero_luggage_relaxed', 'luggage', 'relaxed', true),
  recipe('hero_prepare_puzzled', 'prepare', 'puzzled', true),
];
