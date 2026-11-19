import { feedbackCues } from './feedback.js';
import type { FeedbackCue } from './feedback.js';
import type { BattleEvent, BattleState, Unit } from './types.js';

export type ChessPose = 'appear' | 'idle' | 'attack' | 'cast' | 'hurt' | 'down';
export type PoseSpan = { actor: string; pose: ChessPose; at: number; length: number; facing?: string };
export type ChessPerformance = {
  participants: string[]; poses: PoseSpan[]; cues: { cue: FeedbackCue; at: number }[]; length: number;
  changes: { target: string; at: number; hp?: number; tempHp?: number; status?: Unit['status'] }[];
};

/** 一次已结算动作的只读演出计划；同一范围内的所有豁免和受击使用相同命中时刻。 */
export function planChessPerformance(state: BattleState, events: readonly BattleEvent[]): ChessPerformance | undefined {
  // 纯走格、切回合和查看资料不需要扫描战斗历史。
  if (!events.some(event => event.kind === 'attack' || event.kind === 'damage' || event.kind === 'ability'
    || event.kind === 'ability-save' || event.kind === 'condition')) return undefined;
  const first = events[0]?.seq ?? Infinity;
  const cues = feedbackCues(state, state.log).filter(cue => cue.seq >= first);
  const abilities = events.filter(event => event.kind === 'ability');
  if (!cues.length && !abilities.length) return undefined;
  const participants = new Set<string>(), poses: PoseSpan[] = [], changes: ChessPerformance['changes'] = [];
  const contacts = new Map<number, number>();
  let attackIndex = 0, contact = 460;
  const span = (actor: string, pose: ChessPose, at: number, length: number, facing?: string) => {
    participants.add(actor); poses.push({ actor, pose, at, length, facing });
  };
  for (const event of events) {
    if ('target' in event && event.target) participants.add(event.target);
    if (event.kind === 'ability') {
      participants.add(event.actor);
      span(event.actor, 'cast', 160, 560, event.target);
    }
    if (event.kind === 'attack') {
      contact = 460 + attackIndex++ * 740;
      const projected = cues.some(cue => cue.seq === event.seq && cue.kind === 'swing' && (cue.style === 'spell' || cue.style === 'ranged'));
      span(event.actor, projected ? 'cast' : 'attack', contact - 300, 560, event.target);
      span(event.target, 'idle', contact - 300, 300, event.actor);
    }
    contacts.set(event.seq, contact);
    if (event.kind === 'damage') {
      participants.add(event.actor);
      if (!poses.some(pose => pose.actor === event.actor && (pose.pose === 'attack' || pose.pose === 'cast'))) {
        const spell = cues.some(cue => cue.seq === event.seq && cue.kind === 'impact' && cue.style === 'spell');
        span(event.actor, spell ? 'cast' : 'attack', 160, 560, event.target);
      }
      changes.push({ target: event.target, at: contact, hp: event.report.hpAfter, tempHp: event.report.tempAfter });
    }
    if (event.kind === 'condition') changes.push({ target: event.actor, at: contact + 180, status: event.status,
      ...(event.status !== 'active' ? { hp: 0 } : {}) });
  }
  const scheduled = cues.map(cue => {
    const hit = contacts.get(cue.seq) ?? 460;
    if (cue.kind === 'swing') return { cue, at: hit - 170 };
    if (cue.kind === 'impact') span(cue.target, cue.reduction === 'immune' ? 'idle' : 'hurt', hit, 400, cue.actor);
    if (cue.kind === 'save') span(cue.target, cue.success ? 'idle' : 'hurt', hit, 320);
    if (cue.kind === 'down') span(cue.target, 'down', hit + 180, 480);
    return { cue, at: hit + (cue.kind === 'down' ? 180 : 0) };
  });
  for (const actor of participants) poses.unshift({ actor, pose: 'appear', at: 0, length: 160 });
  return { participants: [...participants], poses, cues: scheduled.sort((a, b) => a.at - b.at), changes,
    length: Math.max(1320, ...scheduled.map(item => item.at + 860), ...poses.map(item => item.at + item.length + 220)) };
}

export function poseAt(plan: ChessPerformance | undefined, id: string, elapsed: number, fallback: ChessPose = 'idle') {
  const spans = plan?.poses.filter(span => span.actor === id && elapsed >= span.at && elapsed < span.at + span.length);
  const span = spans?.findLast(span => span.pose === 'down') ?? spans?.at(-1);
  if (!span) return { pose: fallback, frame: fallback === 'down' ? 3 : Math.floor(Math.max(0, elapsed) / 180) % 4 };
  return { pose: span.pose, frame: Math.min(3, Math.floor(4 * (elapsed - span.at) / span.length)), facing: span.facing };
}

export function displayedUnit(unit: Unit, before: Unit | undefined, plan: ChessPerformance | undefined, elapsed: number): Unit {
  if (!before || !plan || !plan.participants.includes(unit.id)) return unit;
  const changes = plan.changes.filter(change => change.target === unit.id && change.at <= elapsed);
  let shown = { ...unit, hp: before.hp, tempHp: before.tempHp, status: before.status };
  for (const change of changes) shown = { ...shown, hp: change.hp ?? shown.hp, tempHp: change.tempHp ?? shown.tempHp, status: change.status ?? shown.status };
  // 治疗／防护事件不带 damage report，在接触时刻才显示已结算的新数值。
  if (!plan.changes.some(change => change.target === unit.id) && elapsed >= 460) return unit;
  return shown;
}
