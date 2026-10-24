export type DisplaySlot = { actor: string; x: number; phase: 'steady' | 'out' | 'in' };
export type DisplayClock = { later: (work: () => void, ms: number) => number; cancel: (id: number) => void };
/** 同槽先淡出后换入；计时只属于视图，修订号使已排队旧回调失效。 */
export class DisplayTransition {
  private scope = '';
  private signature = '';
  private revision = 0;
  private timer?: number;
  private disposed = false;
  private current: readonly DisplaySlot[] = [];
  private readonly clock: DisplayClock;
  private readonly changed: (slots: readonly DisplaySlot[]) => void;
  constructor(clock: DisplayClock, changed: (slots: readonly DisplaySlot[]) => void) { this.clock = clock; this.changed = changed; }
  update(scope: string, target: readonly { actor: string; x: number }[], immediate = false): void {
    if (this.disposed) return;
    const signature = JSON.stringify(target);
    if (scope === this.scope && signature === this.signature && !(immediate && this.timer !== undefined)) return;
    const reset = scope !== this.scope;
    this.cancel(); this.scope = scope; this.signature = signature;
    const revision = this.revision;
    const old = this.current, next = target.map(slot => ({ ...slot, phase: 'steady' as const }));
    const removed = old.filter(slot => !target.some(n => n.actor === slot.actor));
    if (reset || immediate || !removed.length) { this.current = next; this.changed(next); return; }
    this.current = old.map(slot => ({ ...slot, phase: removed.some(r => r.actor === slot.actor) ? 'out' : 'steady' }));
    this.changed(this.current);
    this.timer = this.clock.later(() => {
      if (this.disposed || revision !== this.revision || scope !== this.scope) return;
      this.timer = undefined;
      this.current = next.map(slot => ({ ...slot, phase: old.some(o => o.actor === slot.actor) ? 'steady' : 'in' }));
      this.changed(this.current);
    }, 150);
  }
  private cancel(): void { ++this.revision; if (this.timer !== undefined) this.clock.cancel(this.timer); this.timer = undefined; }
  dispose(): void { this.disposed = true; this.cancel(); this.current = []; }
}
