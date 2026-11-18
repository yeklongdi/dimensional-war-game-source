export type PresentationSpeed = 1 | 2 | 4;

/** 仅用于演出的虚拟时间；改速不会跳帧、重播或改变规则状态。 */
export class PresentationClock {
  private wall: number;
  private time = 0;
  private rate: PresentationSpeed = 1;
  private paused = false;
  private readonly read: () => number;
  constructor(read: () => number = () => performance.now()) { this.read = read; this.wall = read(); }
  now() {
    const wall = this.read();
    if (!this.paused) this.time += Math.max(0, wall - this.wall) * this.rate;
    this.wall = wall; return this.time;
  }
  get speed() { return this.rate; }
  setSpeed(rate: PresentationSpeed) { this.now(); this.rate = rate; }
  setPaused(paused: boolean) { this.now(); this.paused = paused; }
}
