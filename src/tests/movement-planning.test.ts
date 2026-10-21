import { describe, expect, it } from 'vitest';
import { reducePlanning, setBattleMode } from '../game/battle/planning.js';
import { currentDraft, movementOverlay } from '../game/battle/movement-preview.js';
import { battleToken, getUnit } from '../game/battle/state-helpers.js';
import { reduceDebugGame } from '../game/battle/debug-state.js';
import { chooseAi } from '../game/battle/ai.js';
import { currentLevel } from '../content/levels.js';
import { storyLibrary } from '../game/story/library.js';
import { reduceApp } from '../game/router.js';
import { command, finishMovement, patchUnit } from './battle-helpers.js';
import { battleCommand, navigate, play, reachApp } from './m4-helpers.js';
import { editPlan, planAction, planningGame } from './movement-helpers.js';

describe('集中移动草稿与预览', () => {
  it('悬停不执行、不消耗或更改战斗、日志、RNG、教学计数；重复悬停是同一状态', () => {
    const initial = planningGame(), battle = initial.battle!, ai = chooseAi(battle);
    const hovered = editPlan(initial, 'hover', { col: 3, row: 2 });
    expect(hovered.battle).toBe(battle); expect(movementOverlay(hovered)!.path).toHaveLength(2);
    expect(hovered.movementDraft!.waypoints).toEqual([]); expect(movementOverlay(hovered)!.selectedSteps).toBe(0);
    expect(editPlan(hovered, 'hover', { col: 3, row: 2 })).toBe(hovered); expect(chooseAi(hovered.battle!)).toEqual(ai);
    expect(reducePlanning(hovered, planAction(hovered, 'confirm')).state).toBe(hovered);
  });
  it('确认只提交已点击部分，悬停终点不参与；确认后不能重复确认或修改', () => {
    let game = editPlan(planningGame(), 'add', { col: 2, row: 2 });
    game = editPlan(game, 'hover', { col: 4, row: 2 });
    expect(movementOverlay(game)!.path).toHaveLength(3);
    const confirm = planAction(game, 'confirm'), next = reducePlanning(game, confirm).state;
    expect(next.battle!.pendingMove!.path).toEqual([{ col: 2, row: 2 }]); expect(next.movementDraft).toBeUndefined();
    expect(movementOverlay(next)!.kind).toBe('executing'); expect(reducePlanning(next, confirm).state).toBe(next);
    expect(reducePlanning(next, planAction(game, 'add', { col: 3, row: 2 })).state).toBe(next);
  });
  it('离开只清悬停；撤回、清空和取消各自保留或退出移动模式', () => {
    let game = editPlan(planningGame(), 'add', { col: 2, row: 2 }); game = editPlan(game, 'add', { col: 3, row: 3 });
    game = editPlan(game, 'hover', { col: 4, row: 3 }); game = editPlan(game, 'leave');
    expect(game.movementDraft!.hover).toBeUndefined(); expect(game.movementDraft!.waypoints).toHaveLength(2);
    expect(movementOverlay(game)!.path.at(-1)).toEqual({ col: 3, row: 3 });
    game = editPlan(game, 'undo'); expect(game.movementDraft!.waypoints).toEqual([{ col: 2, row: 2 }]);
    game = editPlan(game, 'clear'); expect(game.battleMode).toBe('move'); expect(game.movementDraft!.waypoints).toEqual([]);
    expect(editPlan(game, 'clear')).toBe(game);
    game = editPlan(game, 'cancel'); expect(game.battleMode).toBe('idle'); expect(game.movementDraft).toBeUndefined();
  });
  it('可达格从最后点按实际剩余步数计算，绕路耗尽后不再加入新点', () => {
    let game = planningGame();
    for (const point of [{ col: 1, row: 0 }, { col: 3, row: 0 }, { col: 3, row: 2 }]) game = editPlan(game, 'add', point);
    const overlay = movementOverlay(game)!;
    expect(overlay.selectedSteps).toBe(6); expect(overlay.remainingSteps).toBe(0); expect(overlay.reachable).toEqual([{ col: 3, row: 2 }]);
    const denied = reducePlanning(game, planAction(game, 'add', { col: 4, row: 2 }));
    expect(denied.state).toBe(game); expect(denied.rejectedReason).toContain('移动力');
    const hovered = editPlan(game, 'hover', { col: 4, row: 2 }); expect(movementOverlay(hovered)!.path).toEqual(overlay.path);
  });
  it('非法选点保留合法路线；连续点击末点或初始原地不产生零长段', () => {
    let game = planningGame(); expect(editPlan(game, 'add', { col: 1, row: 2 })).toBe(game);
    game = editPlan(game, 'add', { col: 2, row: 2 }); expect(editPlan(game, 'add', { col: 2, row: 2 })).toBe(game);
    for (const point of [{ col: 99, row: 0 }, { col: 5, row: 0 }]) expect(reducePlanning(game, planAction(game, 'add', point)).state).toBe(game);
  });
  it.each(['run', 'token', 'actor'] as const)('%s过期输入不能作用于当前草稿', field => {
    const game = editPlan(planningGame(), 'add', { col: 2, row: 2 }), action = planAction(game, 'confirm');
    const stale = field === 'run' ? { ...action, run: action.run - 1 } : field === 'token' ? { ...action, token: 'stale' } : { ...action, actor: 'black_a' };
    expect(reducePlanning(game, stale).state).toBe(game);
  });
  it('旧战斗版本的草稿不显示也不能确认；切模式、换回合与重开清除', () => {
    const game = editPlan(planningGame(), 'add', { col: 2, row: 2 });
    const outdated = { ...game, battle: { ...game.battle!, revision: game.battle!.revision + 1 } };
    expect(currentDraft(outdated)).toBeUndefined(); expect(movementOverlay(outdated)).toBeUndefined();
    expect(reducePlanning(outdated, planAction(game, 'confirm')).state).toBe(outdated);
    expect(setBattleMode(game, 'attack').movementDraft).toBeUndefined();
    const ended = reduceDebugGame(game, { type: 'command', envelope: { token: battleToken(game.battle!), origin: 'player', command: { kind: 'end', actor: 'hero' } } }).state;
    expect(ended.movementDraft).toBeUndefined();
    const restarted = reduceDebugGame(game, { type: 'restart', token: battleToken(game.battle!) }).state;
    expect(restarted.movementDraft).toBeUndefined(); expect(reduceDebugGame(restarted, planAction(game, 'confirm')).state).toBe(restarted);
  });
});

describe('执行展示、暂停及正式流程隔离', () => {
  it('剩余路线从真实移动进度派生，暂停保留，到达立即清除', () => {
    let game = editPlan(planningGame(), 'add', { col: 3, row: 2 }); game = editPlan(game, 'confirm');
    expect(movementOverlay(game)!.path).toHaveLength(2);
    const next = command(game.battle!, { kind: 'step' }, 'system');
    const moving = { ...game, battle: next };
    expect(movementOverlay(moving)).toMatchObject({ from: game.battle!.pendingMove!.path[0], path: [{ col: 3, row: 2 }] });
    const paused = { ...moving, battle: { ...next, pendingReaction: { reactor: 'black_a', moving: 'hero' } } };
    expect(movementOverlay(paused)!.path).toEqual(movementOverlay(moving)!.path);
    expect(movementOverlay({ ...game, battle: finishMovement(next) })).toBeUndefined();
  });
  it.each(['unconscious', 'dead', 'stable'] as const)('%s即使内核尚留pendingMove也立即隐藏', status => {
    let game = editPlan(planningGame(), 'add', { col: 3, row: 2 }); game = editPlan(game, 'confirm');
    expect(movementOverlay({ ...game, battle: patchUnit(game.battle!, 'hero', { hp: 0, status }) })).toBeUndefined();
  });
  it('敌方移动、反应等待和结算不显示己方规划；敌方移动不画执行路线', () => {
    const game = planningGame(), battle = game.battle!;
    expect(movementOverlay({ ...game, battle: { ...battle, pendingMove: { actor: 'black_a', path: [{ col: 4, row: 0 }], index: 0, reactors: null } } })).toBeUndefined();
    expect(movementOverlay({ ...game, battle: { ...battle, pendingReaction: { reactor: 'hero', moving: 'black_a' } } })).toBeUndefined();
    expect(movementOverlay({ ...game, battle: { ...battle, result: { outcome: 'win', reason: 'eliminated' } } })).toBeUndefined();
  });
  it('敌方借机失能后停止路线，未执行步骤不扣费', () => {
    let game = planningGame();
    let battle = patchUnit(game.battle!, 'black_a', { position: { col: 2, row: 2 } });
    battle = { ...patchUnit(battle, 'hero', { hp: 1 }), rng: { kind: 'sequence', values: [20, 1, 1], index: 0, draws: 3 } };
    game = setBattleMode({ ...game, battle }, 'move');
    game = editPlan(game, 'add', { col: 1, row: 0 }); game = editPlan(game, 'confirm');
    const stopped = finishMovement(game.battle!);
    expect(getUnit(stopped, 'hero')).toMatchObject({ hp: 0, position: { col: 1, row: 1 }, resources: { movement: 25 } });
    expect(movementOverlay({ ...game, battle: stopped })).toBeUndefined();
  });
  it('正式规划不改变进度/保存次数，返回地图和菜单清草稿且旧请求失效', () => {
    let game = reachApp(state => state.screen === 'battle' && Boolean(state.battle?.pendingRoll));
    game = battleCommand(game, { kind: 'inspire', dieIndex: null });
    game = play(game, { type: 'mode', token: battleToken(game.battle!), mode: 'move' });
    const original = game.battle!, progress = structuredClone(game.progress), flags = { ...game.flags };
    const target = movementOverlay(game)!.reachable.find(point => point.col !== getUnit(original, 'hero')!.position.col || point.row !== getUnit(original, 'hero')!.position.row)!;
    for (const operation of ['hover', 'add', 'undo', 'clear'] as const) {
      const action = planAction(game, operation, target), transition = reduceApp(game, { type: 'play', run: game.run, action }, storyLibrary, 999999);
      expect(transition.saves).toBeUndefined(); expect(transition.state.battle).toBe(original); expect(transition.state.progress).toEqual(progress); expect(transition.state.flags).toEqual(flags);
      game = transition.state;
    }
    game = editPlan(game, 'add', target); const stale = planAction(game, 'confirm');
    for (const destination of ['open-map', 'main-menu'] as const) {
      const left = navigate(game, destination); expect(left.movementDraft).toBeUndefined();
      expect(left.progress!.checkpoint!.checkpoint).toMatchObject({ kind: 'level', sceneId: 'p006' });
      expect(JSON.stringify(left.progress)).not.toContain('waypoints'); expect(currentLevel(left.progress!.completedLevelIds)!.id).toBe('prologue_02');
      expect(reduceApp(left, { type: 'play', run: game.run, action: stale }, storyLibrary, 999999).state).toBe(left);
    }
  });
});
