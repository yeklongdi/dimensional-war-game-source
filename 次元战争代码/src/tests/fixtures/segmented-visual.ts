import { heroRecipes } from '../../game/visual/hero.js';
import type { LayerRecipe } from '../../game/visual/types.js';

// 保留旧分段关节数学回归。v3实际美术采用完整手臂，不假装仍在运行肘部拼接。
export const segmentedVisual: LayerRecipe = {
  ...heroRecipes[4]!,
  layers: (['left', 'right'] as const).flatMap(side => {
    const upper = heroRecipes[4]!.layers.find(layer => layer.motion === `upper-${side}`)!;
    return [upper, { ...upper, id: `fixture-lower-${side}`, motion: `lower-${side}` as const,
      pivot: side === 'left' ? [218, 477] as const : [754, 515] as const }];
  }),
};
