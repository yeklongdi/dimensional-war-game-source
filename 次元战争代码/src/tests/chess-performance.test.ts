import { describe, expect, it } from 'vitest';
import { PresentationClock } from '../game/battle/presentation-clock.js';
import { displayedUnit, planChessPerformance, poseAt } from '../game/battle/chess-performance.js';
import { chessSampleGame } from '../dev/chess-sample-state.js';
import { command, patchUnit } from './battle-helpers.js';

describe('战斗演出虚拟时钟', () => {
  it('加速时保持当前进度，之后按新倍率推进', () => {
    let wall = 0; const clock = new PresentationClock(() => wall);
    wall = 100; expect(clock.now()).toBe(100);
    clock.setSpeed(2); expect(clock.now()).toBe(100);
    wall = 200; expect(clock.now()).toBe(300);
    clock.setSpeed(4); wall = 250; expect(clock.now()).toBe(500);
    clock.setSpeed(1); wall = 300; expect(clock.now()).toBe(550);
  });
  it('暂停与恢复不跳过动作，也不把后台等待计入演出', () => {
    let wall = 0; const clock = new PresentationClock(() => wall);
    wall = 100; clock.setPaused(true);
    wall = 5000; expect(clock.now()).toBe(100);
    clock.setSpeed(4); clock.setPaused(false);
    wall = 5100; expect(clock.now()).toBe(500);
  });
  it('重复读取不重复推进，4倍速完整经过同一段虚拟时间', () => {
    let wall = 0; const clock = new PresentationClock(() => wall);
    clock.setSpeed(4); wall = 330;
    expect(clock.now()).toBe(1320); expect(clock.now()).toBe(1320);
  });
});

describe('棋上人物与现有打击反馈同步', () => {
  const strike = () => {
    const before = chessSampleGame('melee', 1).battle;
    const after = command(before, { kind: 'attack', actor: 'hero', target: 'black_a', attackId: 'unarmed', resource: 'action' });
    return { before, after, plan: planChessPerformance(after, after.log.slice(before.log.length))! };
  };
  it('攻击者与受击者一起显现，命中时人物正处于攻击接触帧', () => {
    const { plan } = strike(), impact = plan.cues.find(item => item.cue.kind === 'impact')!;
    expect(plan.participants.sort()).toEqual(['black_a', 'hero']);
    expect(poseAt(plan, 'hero', impact.at)).toMatchObject({ pose: 'attack', frame: 2 });
    expect(poseAt(plan, 'black_a', impact.at).pose).toBe('hurt');
    expect(plan.cues.find(item => item.cue.kind === 'swing')!.at).toBeLessThan(impact.at);
  });
  it('人物与棋子始终保留实际格位，规划与变速不改变掷骰或结算', () => {
    const { before, after } = strike(), snapshot = JSON.stringify(after);
    const plan = planChessPerformance(after, after.log.slice(before.log.length))!;
    for (const at of [0, 180, 460, 1000]) poseAt(plan, 'hero', at);
    expect(JSON.stringify(after)).toBe(snapshot);
    expect(after.units.map(unit => unit.position)).toEqual(before.units.map(unit => unit.position));
  });
  it('棋盘生命条在命中时更新，演出开头保留受击前生命值', () => {
    const { before, after, plan } = strike(), original = before.units[1]!, target = after.units[1]!;
    const impact = plan.cues.find(item => item.cue.kind === 'impact')!;
    expect(displayedUnit(target, original, plan, impact.at - 1).hp).toBe(6);
    expect(displayedUnit(target, original, plan, impact.at).hp).toBe(1);
  });
  it('范围效果中所有受影响者同时显现、同时豁免与受击，包括友方波及', () => {
    const before = chessSampleGame('area', 2).battle;
    const after = command(before, { kind: 'ability', actor: 'hero', ability: 'acid_splash', point: { col: 3, row: 2 } });
    const plan = planChessPerformance(after, after.log.slice(before.log.length))!;
    expect(plan.participants.sort()).toEqual(['black_a', 'black_b', 'hero']);
    const impacts = plan.cues.filter(item => item.cue.kind === 'impact');
    expect(impacts).toHaveLength(3); expect(new Set(impacts.map(item => item.at)).size).toBe(1);
    expect(new Set(plan.cues.filter(item => item.cue.kind === 'save').map(item => item.at)).size).toBe(1);
  });
  it('免疫目标显示豁免／免疫反馈，人物保持站立而不冒充受伤', () => {
    const before = patchUnit(chessSampleGame('area', 2).battle, 'black_a', { immunities: ['acid'] });
    const after = command(before, { kind: 'ability', actor: 'hero', ability: 'acid_splash', point: { col: 3, row: 2 } });
    const plan = planChessPerformance(after, after.log.slice(before.log.length))!;
    const impact = plan.cues.find(item => item.cue.kind === 'impact' && item.cue.target === 'black_a')!;
    expect(impact.cue).toMatchObject({ reduction: 'immune', amount: 0 });
    expect(poseAt(plan, 'black_a', impact.at).pose).toBe('idle');
  });
  it('倒地四帧完整播完后才结束演出，失能状态与真实结算相符', () => {
    const before = chessSampleGame('down', 3).battle;
    const after = command(before, { kind: 'attack', actor: 'hero', target: 'black_a', attackId: 'unarmed', resource: 'action' });
    const plan = planChessPerformance(after, after.log.slice(before.log.length))!;
    const down = plan.poses.find(pose => pose.actor === 'black_a' && pose.pose === 'down')!;
    expect(poseAt(plan, 'black_a', down.at + down.length - 1)).toMatchObject({ pose: 'down', frame: 3 });
    expect(plan.length).toBeGreaterThan(down.at + down.length);
    expect(after.units[1]?.status).toBe('defeated');
  });
  it('进入已有战斗不会为先攻、移动和回合记录播放攻击动画', () => {
    const state = chessSampleGame('melee', 1).battle;
    expect(planChessPerformance(state, state.log)).toBeUndefined();
    const ended = command(state, { kind: 'end', actor: 'hero' });
    expect(planChessPerformance(ended, ended.log.slice(state.log.length))).toBeUndefined();
  });
  it('远程攻击使用施法／远程起手并在命中帧触发受击', () => {
    const moved = patchUnit(chessSampleGame('melee', 1).battle, 'black_a', { position: { col: 0, row: 0 } });
    const before = patchUnit(moved, 'hero', {
      attacks: [{ id: 'shortbow', name: '短弓', kind: 'ranged', bonus: 4, range: { normal: 16, max: 64 }, damage: '1d6+2', damageType: 'piercing' }],
    });
    const after = command(before, { kind: 'attack', actor: 'hero', target: 'black_b', attackId: 'shortbow', resource: 'action' });
    const plan = planChessPerformance(after, after.log.slice(before.log.length))!;
    const impact = plan.cues.find(item => item.cue.kind === 'impact')!;
    expect(poseAt(plan, 'hero', impact.at).pose).toBe('cast');
    expect(poseAt(plan, 'black_b', impact.at).pose).toBe('hurt');
  });
  it('选中音效 fx_select 已登记为本地战斗音效', async () => {
    const { sfxBindings } = await import('../game/story/config.js');
    expect(sfxBindings.fx_select).toMatch(/\/assets\/audio\/sfx\/fx_select\.wav$/);
  });
});
