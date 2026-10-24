import { decodeImage, loadLayers } from '../../game/visual/loading.js';
import type { LayerRecipe } from '../../game/visual/types.js';
import { LayeredFigure } from '../../game/ui/layered-figure.js';
import { button, element } from '../../game/ui/elements.js';

/** 只在开发页使用真实LayeredFigure采样三个动作时刻，不访问游戏或存档。 */
export async function showKeyframes(recipe: LayerRecipe): Promise<() => void> {
  const images = await loadLayers(recipe, decodeImage);
  const overlay = element('section');
  overlay.dataset.testid = 'motion-keyframes';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:1000;background:#eae4da;color:#18202a;display:flex;align-items:center;justify-content:center;gap:8px';
  const figures: LayeredFigure[] = [];
  const dispose = () => { figures.forEach(figure => figure.dispose()); overlay.remove(); };
  for (const time of [0, 425, 850]) {
    const column = element('section');
    column.style.cssText = 'position:relative;width:31vw;height:85vh;overflow:hidden;border:1px solid #18202a33';
    column.dataset.actionTime = String(time);
    let now = 0;
    const figure = new LayeredFigure(recipe, images, { now: () => now, request: () => 0, cancel: () => {} }, 0);
    now = time; figure.sync(false, true, 1050);
    figure.root.style.transform = 'scale(.55)';
    figure.root.style.left = 'calc(50% - 281.6px)'; figures.push(figure);
    const label = element('p', '', `${recipe.expression} · 准备动作 ${time}ms`);
    label.style.cssText = 'position:absolute;bottom:4px;left:12px;margin:0;font-size:16px';
    column.append(figure.root, label); overlay.append(column);
  }
  const close = button('关闭关键帧', 'close-keyframes', dispose);
  close.style.cssText = 'position:absolute;top:8px;right:12px;width:auto;color:#18202a;background:#faf7ef';
  overlay.append(close); document.body.append(overlay);
  return dispose;
}
