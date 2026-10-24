import { sampleAnimation } from '../visual/animation.js';
import type { Layer, LayerRecipe } from '../visual/types.js';
import { element } from './elements.js';

export type FigureClock = { now: () => number; request: (tick: () => void) => number; cancel: (id: number) => void };
export const visualClock: FigureClock = {
  now: () => performance.now(), request: tick => window.requestAnimationFrame(tick), cancel: id => window.cancelAnimationFrame(id),
};
type RenderLayer = { layer: Layer; root: HTMLElement; frames: HTMLImageElement[]; urls: readonly string[] };
function keepChildren(parent: HTMLElement, children: readonly HTMLElement[]): void {
  const wanted = new Set<HTMLElement>(children);
  for (const old of Array.from(parent.children)) if (!wanted.has(old as HTMLElement)) old.remove();
  children.forEach((child, index) => { if (parent.children[index] !== child) parent.insertBefore(child, parent.children[index] ?? null); });
}
export class LayeredFigure {
  readonly root = element('div', 'portrait-layered');
  private layers: RenderLayer[] = [];
  private readonly epoch: number;
  private frameId?: number;
  private talking = false;
  private active = true;
  private actionStart?: number;
  private fixedTime?: number;
  private disposed = false;
  private recipe: LayerRecipe;
  private readonly clock: FigureClock;
  constructor(recipe: LayerRecipe, decoded: ReadonlyMap<string, HTMLImageElement>, clock = visualClock, actionStart?: number) {
    this.recipe = recipe; this.clock = clock;
    this.epoch = clock.now(); this.actionStart = actionStart;
    this.updateRecipe(recipe, decoded, actionStart); this.schedule();
  }
  /** 整套图片已解码后才调用；同一演员的身体、头部和未变化差分保留原DOM。 */
  updateRecipe(recipe: LayerRecipe, decoded: ReadonlyMap<string, HTMLImageElement>, actionStart?: number): void {
    if (this.disposed) return;
    if (this.recipe.pose !== recipe.pose) this.actionStart = actionStart;
    this.recipe = recipe; this.root.dataset.recipe = recipe.id;
    this.root.style.width = `${recipe.canvas[0]}px`; this.root.style.height = `${recipe.canvas[1]}px`;
    const previous = new Map(this.layers.map(layer => [layer.layer.id, layer]));
    this.layers = recipe.layers.map(layer => {
      const old = previous.get(layer.id), root = old?.root ?? element('div', 'portrait-layer');
      root.dataset.layer = layer.id;
      root.style.zIndex = String(layer.z);
      root.style.transformOrigin = `${layer.pivot[0]}px ${layer.pivot[1]}px`;
      const frames = layer.frames.map((url, index) => {
        const image = old?.urls[index] === url ? old.frames[index]! : decoded.get(url)!.cloneNode() as HTMLImageElement;
        image.alt = ''; image.draggable = false;
        image.dataset.visualUrl = url;
        image.style.removeProperty('transform'); image.style.removeProperty('transform-origin');
        const registration = layer.registration?.[index] ?? layer.registration?.[0];
        if (registration) {
          image.style.transformOrigin = `${registration.pivot[0]}px ${registration.pivot[1]}px`;
          image.style.transform = `translate(${registration.offset[0]}px, ${registration.offset[1]}px) scale(${registration.scale[0]}, ${registration.scale[1]})`;
        }
        return image;
      });
      keepChildren(root, frames); return { layer, root, frames, urls: [...layer.frames] };
    });
    keepChildren(this.root, this.layers.map(layer => layer.root)); this.paint();
  }
  sync(talking: boolean, active: boolean, fixedTime?: number): void {
    if (this.disposed) return;
    this.talking = talking; this.active = active; this.fixedTime = fixedTime;
    this.root.dataset.talking = String(talking && active);
    this.paint();
    if (this.frameId !== undefined) this.clock.cancel(this.frameId);
    this.frameId = undefined; this.schedule();
  }
  private schedule(): void {
    if (this.disposed || !this.active || this.fixedTime !== undefined) return;
    this.frameId = this.clock.request(() => { this.frameId = undefined; this.paint(); this.schedule(); });
  }
  private paint(): void {
    if (this.disposed) return;
    const time = this.fixedTime ?? this.clock.now() - this.epoch;
    const actionTime = this.actionStart === undefined ? undefined : this.clock.now() - this.actionStart;
    for (const { layer, root, frames } of this.layers) {
      const frame = sampleAnimation(this.recipe, layer, time, this.talking && this.active, actionTime);
      root.style.transform = `translate(${layer.offset[0] + frame.x}px, ${layer.offset[1] + frame.y}px) rotate(${frame.rotate}deg)`;
      const selected = Math.min(Math.max(0, frame.frame), frames.length - 1);
      root.dataset.frame = String(selected);
      for (let index = 0; index < frames.length; ++index) frames[index]!.hidden = index !== selected;
    }
  }
  dispose(): void {
    this.disposed = true;
    if (this.frameId !== undefined) this.clock.cancel(this.frameId);
    this.frameId = undefined; this.root.remove();
  }
}
