import type { FeedbackCue } from './feedback.js';

/**
 * 表现时间轴：只决定「何时播什么」，不碰规则、不掷骰。
 * 以 seq 去重，因此重渲染、读档或同一状态再次提交都不会重播。
 * 每次 take 的 delay 都相对本次提交重新计时，避免跨批次累积成过量延迟。
 */
export type ScheduledCue = { cue: FeedbackCue; delay: number };

const gaps: Record<FeedbackCue['kind'], number> = { swing: 0, impact: 34, save: 70, heal: 90, ward: 90, down: 140 };
const reducedGaps: Record<FeedbackCue['kind'], number> = { swing: 0, impact: 20, save: 20, heal: 0, ward: 0, down: 40 };

export class FeedbackTimeline {
  private session = Number.NaN;
  private lastSeq = -1;
  private readonly reduced: () => boolean;

  constructor(reduced: () => boolean = () => false) { this.reduced = reduced; }

  /** 换战斗实例（含重试）时清空游标，保证新战斗从头播放。 */
  begin(session: number) {
    if (session === this.session) return;
    this.session = session;
    this.lastSeq = -1;
  }
  reset() { this.session = Number.NaN; this.lastSeq = -1; }

  /** 挂载或从存档恢复时把已有事件记为已播，避免回放历史伤害。 */
  skip(cues: readonly FeedbackCue[]) {
    for (const cue of cues) if (cue.seq > this.lastSeq) this.lastSeq = cue.seq;
  }

  /** 返回本次真正需要播放的指令；已播过或乱序的事件直接丢弃。 */
  take(cues: readonly FeedbackCue[]): ScheduledCue[] {
    const table = this.reduced() ? reducedGaps : gaps;
    const scheduled: ScheduledCue[] = [];
    let elapsed = 0;
    for (const cue of cues) {
      if (cue.seq <= this.lastSeq) continue;
      this.lastSeq = cue.seq;
      elapsed += table[cue.kind];
      scheduled.push({ cue, delay: elapsed });
    }
    return scheduled;
  }
}
