import type { Action, ActorState, GameState } from '../state.js';
import { actorColor, displayName, placement } from '../story/config.js';
import { decodeImage, loadLayers, VisualLease } from '../visual/loading.js';
import type { ImagePort } from '../visual/loading.js';
import { resolveVisual } from '../visual/resolve.js';
import { isTalking } from '../visual/types.js';
import type { VisualPlan } from '../visual/types.js';
import { element } from './elements.js';
import { LayeredFigure, visualClock } from './layered-figure.js';
import type { FigureClock } from './layered-figure.js';
import { isStoryProp } from './props.js';
import { portraitEntries } from '../visual/entrances.js';
import { planPortraits, portraitCenters } from '../visual/portrait-layout.js';
import type { PortraitLayout } from '../visual/portrait-layout.js';
import { portraitMetric, portraitTransform, placeholderMetric } from '../visual/portrait-metrics.js';
import type { PortraitMetric } from '../visual/portrait-metrics.js';
import { DisplayTransition } from '../visual/display-transition.js';
import type { DisplaySlot } from '../visual/display-transition.js';

export type PortraitPorts = { candidates?: boolean; image?: ImagePort<HTMLImageElement>; clock?: FigureClock; fixedTime?: () => number | undefined };
class ActorPortrait {
  readonly root = element('div', 'portrait');
  private readonly lease = new VisualLease();
  private figure?: LayeredFigure;
  private state?: GameState;
  private actor?: ActorState;
  private plan?: VisualPlan;
  private readonly failed = new Set<string>();
  private readonly reported = new Set<string>();
  private readonly image: ImagePort<HTMLImageElement>;
  private readonly clock: FigureClock;
  private readonly dispatch: (action: Action) => void;
  private readonly ports: PortraitPorts;
  private presented = false;
  private center = 640;
  private metric: PortraitMetric = placeholderMetric;
  private pending = false;
  private readonly changed: () => void;
  get loading(): boolean { return this.presented && this.pending; }
  constructor(dispatch: (action: Action) => void, ports: PortraitPorts, changed: () => void) {
    this.dispatch = dispatch; this.ports = ports;
    this.changed = changed;
    this.image = ports.image ?? decodeImage; this.clock = ports.clock ?? visualClock;
  }
  update(state: GameState, actor: ActorState): void {
    const previousPose = this.actor?.pose;
    this.state = state; this.actor = actor;
    const name = displayName(state.actId, actor.actor);
    const { slot, rear } = placement(actor.position);
    Object.assign(this.root.dataset, { actor: actor.actor, asset: actor.asset ?? '', position: actor.position, slot,
      pose: actor.pose ?? '', expression: actor.expression ?? '',
      speaking: String(state.waiting?.kind === 'text' && state.waiting.speaker === actor.actor), rear: String(rear) });
    this.root.setAttribute('aria-label', name);
    this.root.style.setProperty('--actor-color', actorColor(actor.actor));
    const plan = resolveVisual(actor, state.failedAssets, this.ports.candidates);
    if (plan.diagnostic) this.warn(`mapping:${actor.pose}:${actor.expression}`, plan.diagnostic);
    this.plan = plan;
    if (!this.root.hasChildNodes() || this.root.dataset.visual === 'placeholder') {
      this.root.dataset.visual = plan.kind === 'placeholder' ? 'placeholder' : 'loading';
    }
    const requestTime = this.clock.now();
    const actionStart = this.presented && !this.paused() && !state.fastForward && previousPose !== undefined && previousPose !== actor.pose ? requestTime : undefined;
    const requestKey = plan.kind === 'layered' && this.failed.has(plan.key) ? `${plan.key}:fallback` : plan.key;
    this.lease.request(requestKey, async () => {
      this.pending = plan.kind !== 'placeholder';
      if (plan.kind === 'layered' && !this.failed.has(plan.key)) return { kind: 'layered' as const, images: await loadLayers(plan.recipe, this.image) };
      const fallback = plan.kind === 'static' ? plan.url : plan.kind === 'layered' ? plan.fallback : undefined;
      return fallback ? { kind: 'static' as const, image: await this.image(fallback) } : { kind: 'placeholder' as const };
    }, loaded => {
      this.root.classList.remove('portrait-placeholder');
      if (loaded.kind === 'layered' && plan.kind === 'layered') {
        const start = this.presented && !this.paused() && !this.state?.fastForward && actionStart !== undefined && this.clock.now() - requestTime < 300 ? actionStart : undefined;
        if (this.figure) this.figure.updateRecipe(plan.recipe, loaded.images, start);
        else this.figure = new LayeredFigure(plan.recipe, loaded.images, this.clock, start);
        if (this.root.firstElementChild !== this.figure.root) this.root.replaceChildren(this.figure.root);
        this.root.dataset.visual = 'layered';
        this.root.dataset.frame = 'layered';
        this.setMetric(portraitMetric(plan, 'layered'));
      } else if (loaded.kind === 'static') {
        this.figure?.dispose(); this.figure = undefined;
        const image = loaded.image.cloneNode() as HTMLImageElement;
        image.className = 'portrait-image'; image.alt = name;
        this.root.replaceChildren(image); this.root.dataset.visual = 'static';
        this.root.dataset.frame = plan.kind === 'static' ? plan.frame ?? 'legacy' : plan.kind === 'layered' ? plan.fallbackFrame ?? 'legacy' : 'legacy';
        this.setMetric(portraitMetric(plan, 'static', loaded.image.src));
      } else { this.figure?.dispose(); this.figure = undefined; this.placeholder(name); }
      this.pending = false; this.syncSpeech(); this.changed();
    }, error => {
      if (plan.kind === 'layered' && !this.failed.has(plan.key)) {
        this.failed.add(plan.key);
        this.warn(`layer-load:${plan.key}`, `${plan.key} 分层加载失败，保留旧画面并尝试静态回退。${String(error)}`);
        this.loadFallback(plan, name);
      } else this.staticFailure(actor, name);
    });
    this.syncSpeech();
  }
  private loadFallback(plan: Extract<VisualPlan, { kind: 'layered' }>, name: string): void {
    this.lease.request(`${plan.key}:fallback`, async () => plan.fallback ? this.image(plan.fallback) : undefined, image => {
      this.figure?.dispose(); this.figure = undefined;
      if (image) {
        const copy = image.cloneNode() as HTMLImageElement;
        copy.className = 'portrait-image'; copy.alt = name;
        this.root.classList.remove('portrait-placeholder'); this.root.replaceChildren(copy); this.root.dataset.visual = 'static'; this.root.dataset.frame = plan.fallbackFrame ?? 'legacy';
        this.setMetric(portraitMetric(plan, 'static', image.src));
      } else this.placeholder(name);
      this.pending = false; this.syncSpeech(); this.changed();
    }, () => this.staticFailure(this.actor!, name));
  }
  private staticFailure(actor: ActorState, name: string): void {
    this.figure?.dispose(); this.figure = undefined; this.placeholder(name); this.pending = false; this.changed();
    if (actor.asset && !this.state?.failedAssets[actor.asset]) this.dispatch({ type: 'asset-failed', id: actor.asset,
      message: `立绘 ${actor.asset} 无法读取，使用色块占位。` });
  }
  private placeholder(name: string): void {
    delete this.root.dataset.frame;
    this.root.classList.add('portrait-placeholder'); this.root.dataset.visual = 'placeholder';
    this.root.replaceChildren(element('span', 'portrait-initial', Array.from(name)[0] ?? '?'),
      element('span', 'portrait-name', name), element('span', 'placeholder-label', '立绘占位'));
    this.setMetric(placeholderMetric);
  }
  private warn(key: string, message: string): void {
    const id = `visual:${this.actor!.actor}:${key}`;
    if (this.reported.has(id)) return;
    this.reported.add(id); this.dispatch({ type: 'warning', key: id, message });
  }
  private syncSpeech(): void {
    if (!this.actor || !this.state) return;
    const plan = this.plan;
    const talking = this.presented && isTalking({ ...this.actor, supported: !!this.figure,
      mouthAllowed: plan?.kind === 'layered' && plan.recipe.limits.mouth, prop: this.actor.actor === '大师之剑' },
    this.state.waiting?.kind === 'text' && !this.pending && !this.paused() ? this.state.waiting : null);
    this.figure?.sync(talking, this.presented && this.actor.visible && !this.paused(), this.ports.fixedTime?.());
  }
  private paused(): boolean { return !!(this.state?.progress?.confirming || this.state?.system?.panel || this.state?.system?.stale); }
  display(slot?: DisplaySlot): void {
    this.presented = !!slot && slot.phase !== 'out';
    this.root.hidden = !slot || (!this.actor?.visible && slot.phase !== 'out');
    this.root.dataset.displayed = String(!!slot);
    this.root.dataset.phase = slot?.phase ?? 'hidden';
    if (slot) { this.center = slot.x; this.setMetric(this.metric); }
    this.syncSpeech();
  }
  private setMetric(metric: PortraitMetric): void {
    this.metric = metric;
    const transform = portraitTransform(metric, this.center);
    Object.assign(this.root.style, { left: `${transform.left}px`, top: `${transform.top}px`, width: `${transform.width}px`, height: `${transform.height}px` });
    this.root.style.setProperty('--portrait-scale', String(transform.scale));
    Object.assign(this.root.dataset, { metric: metric.group, center: String(this.center), scale: String(transform.scale), headTop: String(metric.headTop),
      headHeight: String((metric.head[1] - metric.head[0]) * metric.scale), safeWidth: String((metric.safety[1] - metric.safety[0]) * metric.scale) });
  }
  dispose(): void { this.lease.dispose(); this.figure?.dispose(); this.root.remove(); }
}

/** 稳定的按演员键显示实例；动画仅存在视图，不另建游玩状态。 */
export class PortraitsView {
  private readonly instances = new Map<string, ActorPortrait>();
  private session?: number;
  private disposed = false;
  private layout?: PortraitLayout;
  private shown: readonly DisplaySlot[] = [];
  private readonly transition: DisplayTransition;
  private readonly root: HTMLElement;
  private readonly dispatch: (action: Action) => void;
  private readonly ports: PortraitPorts;
  private readonly changed: () => void;
  get loading(): boolean { return [...this.instances.values()].some(instance => instance.loading); }
  constructor(root: HTMLElement, dispatch: (action: Action) => void, ports: PortraitPorts = {}, changed: () => void = () => {}) {
    this.root = root; this.dispatch = dispatch; this.ports = ports;
    this.changed = changed;
    this.transition = new DisplayTransition({ later: (work, ms) => window.setTimeout(work, ms), cancel: id => window.clearTimeout(id) }, slots => {
      this.shown = slots; this.applyDisplay();
    });
  }
  render(state: GameState): void {
    if (this.disposed) return;
    if (this.session !== undefined && this.session !== state.run) this.clear();
    this.session = state.run;
    const people = Object.values(state.actors).filter(actor => !isStoryProp(actor));
    this.layout = planPortraits({ ...state, actors: people, entries: portraitEntries(state) }, this.layout);
    for (const actor of people) {
      let instance = this.instances.get(actor.actor);
      if (!instance) { instance = new ActorPortrait(this.dispatch, this.ports, this.changed); this.instances.set(actor.actor, instance); this.root.append(instance.root); }
      instance.update(state, actor);
    }
    for (const [key, instance] of this.instances) if (!state.actors[key] || isStoryProp(state.actors[key]!)) { instance.dispose(); this.instances.delete(key); }
    const centers = portraitCenters(this.layout.slots.length);
    this.transition.update(this.layout.scope, this.layout.slots.map((actor, index) => ({ actor, x: centers[index]! })),
      !!state.fastForward || !!state.system?.panel || !!state.system?.stale || !!state.progress?.confirming);
    this.applyDisplay();
    Object.assign(this.root.dataset, { displayScope: this.layout.scope, displayRevision: String(this.layout.revision),
      displaySlots: this.layout.slots.join(','), lastSpoken: JSON.stringify(this.layout.lastSpoken) });
  }
  private applyDisplay(): void {
    for (const [key, instance] of this.instances) instance.display(this.shown.find(slot => slot.actor === key));
    this.changed();
  }
  private clear(): void { for (const instance of this.instances.values()) instance.dispose(); this.instances.clear(); this.layout = undefined; }
  dispose(): void { this.disposed = true; this.transition.dispose(); this.clear(); }
}
