import type { Action, ActorState, GameState } from '../state.js';
import { actorColor, displayName, placement, slotX } from '../story/config.js';
import { decodeImage, loadLayers, VisualLease } from '../visual/loading.js';
import type { ImagePort } from '../visual/loading.js';
import { resolveVisual } from '../visual/resolve.js';
import { isTalking } from '../visual/types.js';
import type { VisualPlan } from '../visual/types.js';
import { element } from './elements.js';
import { LayeredFigure, visualClock } from './layered-figure.js';
import type { FigureClock } from './layered-figure.js';

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
  constructor(dispatch: (action: Action) => void, ports: PortraitPorts) {
    this.dispatch = dispatch; this.ports = ports;
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
    this.root.hidden = !actor.visible;
    this.root.setAttribute('aria-label', name);
    this.root.style.setProperty('--actor-color', actorColor(actor.actor));
    if (!this.root.hasChildNodes()) this.placeholder(name);
    const plan = resolveVisual(actor, state.failedAssets, this.ports.candidates);
    if (plan.diagnostic) this.warn(`mapping:${actor.pose}:${actor.expression}`, plan.diagnostic);
    this.plan = plan;
    const requestTime = this.clock.now();
    const actionStart = previousPose !== undefined && previousPose !== actor.pose ? requestTime : undefined;
    this.lease.request(plan.key, async () => {
      if (plan.kind === 'layered' && !this.failed.has(plan.key)) return { kind: 'layered' as const, images: await loadLayers(plan.recipe, this.image) };
      const fallback = plan.kind === 'static' ? plan.url : plan.kind === 'layered' ? plan.fallback : undefined;
      return fallback ? { kind: 'static' as const, image: await this.image(fallback) } : { kind: 'placeholder' as const };
    }, loaded => {
      this.root.classList.remove('portrait-placeholder');
      if (loaded.kind === 'layered' && plan.kind === 'layered') {
        const start = actionStart !== undefined && this.clock.now() - requestTime < 300 ? actionStart : undefined;
        if (this.figure) this.figure.updateRecipe(plan.recipe, loaded.images, start);
        else this.figure = new LayeredFigure(plan.recipe, loaded.images, this.clock, start);
        if (this.root.firstElementChild !== this.figure.root) this.root.replaceChildren(this.figure.root);
        this.root.dataset.visual = 'layered';
      } else if (loaded.kind === 'static') {
        this.figure?.dispose(); this.figure = undefined;
        const image = loaded.image.cloneNode() as HTMLImageElement;
        image.className = 'portrait-image'; image.alt = name;
        this.root.replaceChildren(image); this.root.dataset.visual = 'static';
      } else { this.figure?.dispose(); this.figure = undefined; this.placeholder(name); }
      this.syncSpeech();
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
        this.root.classList.remove('portrait-placeholder'); this.root.replaceChildren(copy); this.root.dataset.visual = 'static';
      } else this.placeholder(name);
    }, () => this.staticFailure(this.actor!, name));
  }
  private staticFailure(actor: ActorState, name: string): void {
    this.figure?.dispose(); this.figure = undefined; this.placeholder(name);
    if (actor.asset && !this.state?.failedAssets[actor.asset]) this.dispatch({ type: 'asset-failed', id: actor.asset,
      message: `立绘 ${actor.asset} 无法读取，使用色块占位。` });
  }
  private placeholder(name: string): void {
    this.root.classList.add('portrait-placeholder'); this.root.dataset.visual = 'placeholder';
    this.root.replaceChildren(element('span', 'portrait-initial', Array.from(name)[0] ?? '?'),
      element('span', 'portrait-name', name), element('span', 'placeholder-label', '立绘占位'));
  }
  private warn(key: string, message: string): void {
    const id = `visual:${this.actor!.actor}:${key}`;
    if (this.reported.has(id)) return;
    this.reported.add(id); this.dispatch({ type: 'warning', key: id, message });
  }
  private syncSpeech(): void {
    if (!this.actor || !this.state) return;
    const plan = this.plan;
    const talking = isTalking({ ...this.actor, supported: !!this.figure,
      mouthAllowed: plan?.kind === 'layered' && plan.recipe.limits.mouth, prop: this.actor.actor === '大师之剑' },
    this.state.waiting?.kind === 'text' && !this.state.progress?.confirming && !this.state.system?.panel && !this.state.system?.stale ? this.state.waiting : null);
    this.figure?.sync(talking, this.actor.visible, this.ports.fixedTime?.());
  }
  dispose(): void { this.lease.dispose(); this.figure?.dispose(); this.root.remove(); }
}

/** 稳定的按演员键显示实例；动画仅存在视图，不另建游玩状态。 */
export class PortraitsView {
  private readonly instances = new Map<string, ActorPortrait>();
  private session?: number;
  private disposed = false;
  private readonly root: HTMLElement;
  private readonly dispatch: (action: Action) => void;
  private readonly ports: PortraitPorts;
  constructor(root: HTMLElement, dispatch: (action: Action) => void, ports: PortraitPorts = {}) {
    this.root = root; this.dispatch = dispatch; this.ports = ports;
  }
  render(state: GameState): void {
    if (this.disposed) return;
    if (this.session !== undefined && this.session !== state.run) this.clear();
    this.session = state.run;
    const visible = Object.values(state.actors).filter(actor => actor.visible);
    for (const actor of Object.values(state.actors)) {
      let instance = this.instances.get(actor.actor);
      if (!instance) { instance = new ActorPortrait(this.dispatch, this.ports); this.instances.set(actor.actor, instance); this.root.append(instance.root); }
      const { slot } = placement(actor.position), peers = visible.filter(other => placement(other.position).slot === slot);
      const offset = (peers.findIndex(other => other.actor === actor.actor) - (peers.length - 1) / 2) * 136;
      instance.root.style.left = `${slotX[slot] + offset}px`;
      instance.update(state, actor);
    }
    for (const [key, instance] of this.instances) if (!state.actors[key]) { instance.dispose(); this.instances.delete(key); }
  }
  private clear(): void { for (const instance of this.instances.values()) instance.dispose(); this.instances.clear(); }
  dispose(): void { this.disposed = true; this.clear(); }
}
