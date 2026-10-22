import { sampleAnimation } from '../visual/animation.js';
import type { Layer, LayerRecipe } from '../visual/types.js';
import { element } from './elements.js';

export type FigureClock = { now: () => number; request: (tick: () => void) => number; cancel: (id: number) => void };
export const visualClock: FigureClock = {
  now: () => performance.now(), request: tick => window.requestAnimationFrame(tick), cancel: id => window.cancelAnimationFrame(id),
};
export class LayeredFigure {
  readonly root = element('div', 'portrait-layered');
  private readonly layers: { layer: Layer; root: HTMLElement; frames: HTMLImageElement[] }[];
  private readonly epoch: number;
  private frameId?: number;
  private talking = false;
  private active = true;
  private actionStart?: number;
  private fixedTime?: number;
  private disposed = false;
  private readonly recipe: LayerRecipe;
  private readonly clock: FigureClock;
  constructor(recipe: LayerRecipe, decoded: ReadonlyMap<string, HTMLImageElement>, clock = visualClock, actionStart?: number) {
    this.recipe = recipe; this.clock = clock;
    this.epoch = clock.now(); this.actionStart = actionStart;
    this.root.dataset.recipe = recipe.id;
    this.root.style.width = `${recipe.canvas[0]}px`; this.root.style.height = `${recipe.canvas[1]}px`;
    this.layers = recipe.layers.map(layer => {
      const root = element('div', 'portrait-layer');
      root.dataset.layer = layer.id;
      root.style.zIndex = String(layer.z);
      root.style.transformOrigin = `${layer.pivot[0]}px ${layer.pivot[1]}px`;
      const frames = layer.frames.map((url, index) => {
        const image = decoded.get(url)!.cloneNode() as HTMLImageElement;
        image.alt = ''; image.draggable = false;
        const registration = layer.registration?.[index] ?? layer.registration?.[0];
        if (registration) {
          image.style.transformOrigin = `${registration.pivot[0]}px ${registration.pivot[1]}px`;
          image.style.transform = `translate(${registration.offset[0]}px, ${registration.offset[1]}px) scale(${registration.scale[0]}, ${registration.scale[1]})`;
        }
        root.append(image); return image;
      });
      this.root.append(root); return { layer, root, frames };
    });
    this.paint(); this.schedule();
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
      root.dataset.frame = String(frame.frame);
      for (let index = 0; index < frames.length; ++index) frames[index]!.hidden = index !== frame.frame;
    }
  }
  dispose(): void {
    this.disposed = true;
    if (this.frameId !== undefined) this.clock.cancel(this.frameId);
    this.frameId = undefined; this.root.remove();
  }
}
