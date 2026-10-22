import type { Frame, Layer, LayerRecipe } from './types.js';

/** 只接收视觉经过时间；不读取战斗 RNG、剧情状态或存储。 */
export function sampleAnimation(recipe: LayerRecipe, layer: Layer, elapsed: number, talking: boolean, actionElapsed?: number): Frame {
  const time = Math.max(0, elapsed), wave = Math.sin(time / 4200 * Math.PI * 2);
  const breathe = recipe.limits.breathe ? wave : 0;
  const head = ['head', 'hair'].includes(layer.motion);
  const y = -breathe * (head ? 2.1 : 1.3);
  const sway = recipe.limits.sway && (layer.motion === 'hair' || layer.motion === 'hem')
    ? Math.sin(time / (layer.motion === 'hair' ? 5700 : 5100) * Math.PI * 2) * (layer.motion === 'hair' ? .32 : .18) : 0;
  const blinkTime = time % 4300;
  const blink = !recipe.limits.blink || blinkTime < 4020 ? 0 : blinkTime < 4080 ? 1 : blinkTime < 4180 ? 2 : blinkTime < 4240 ? 1 : 0;
  const mouth = talking && recipe.limits.mouth && Math.floor(time / 125) % 2 === 1 ? 1 : 0;
  const prepare = recipe.limits.prepare && actionElapsed !== undefined
    ? Math.sin(Math.min(Math.max(actionElapsed, 0) / 850, 1) * Math.PI) : 0;
  const arm = layer.motion.includes('left') ? -1 : 1;
  const rotate = sway + (layer.motion.startsWith('upper') ? prepare * arm * 7
    : layer.motion.startsWith('lower') ? prepare * arm * 11 : 0);
  return { x: 0, y: layer.motion === 'prop' ? 0 : y, rotate,
    frame: layer.channel === 'eyes' ? blink : layer.channel === 'mouth' ? mouth : 0 };
}
