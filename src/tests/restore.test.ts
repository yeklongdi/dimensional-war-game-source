import { describe, expect, it } from 'vitest';
import type { GameState } from '../game/state.js';
import { emptyState } from '../game/state.js';
import { resumeScene, scenePresentation } from '../game/story/restore.js';
import { storyLibrary } from '../game/story/library.js';
import { startApp } from '../game/router.js';
import { appStep, freshApp, navigate, play, reachApp, sampleV2 } from './m4-helpers.js';

const presentation = (state: GameState) => ({ actors: state.actors, backgroundId: state.backgroundId, bgmId: state.bgmId, sceneTitle: state.sceneTitle, time: state.time });
describe('M4 场景开头恢复与静默演出重建', () => {
  it('可达的38个主场景及回班分支入口演出与真实推进一致', () => {
    let game = freshApp(), last = ''; const scenes: string[] = [];
    for (let step = 0; step < 1600; step++) {
      if (game.screen === 'story' && game.sceneId !== last) {
        const restored = resumeScene(game, storyLibrary, game.actId as 'prologue' | 'act1', game.sceneId, game.run + 10).state;
        expect(presentation(restored), game.sceneId).toEqual(presentation(game));
        expect(restored.branch).toBeUndefined(); scenes.push(game.sceneId); last = game.sceneId;
      }
      if (game.waiting?.kind === 'blocked-call') break;
      game = appStep(game);
    }
    expect(new Set(scenes).size).toBe(39);
  });
  it('A007/A010无SHOW时沿用素材及位置，恢复不增加过去的SET或CALL副作用', () => {
    const base = emptyState(); base.campaignSeed = 0;
    for (const id of ['a007', 'a010']) {
      const transition = resumeScene(base, storyLibrary, 'act1', id, 2);
      expect(transition.state.flags).toEqual({}); expect(transition.state.battle).toBeUndefined();
      expect(transition.effects.some(effect => effect.kind === 'sfx')).toBe(false);
      expect(transition.effects.some(effect => effect.kind === 'warn' && effect.key.startsWith('call:'))).toBe(false);
      expect(transition.state.actors['虚拟主播']!.asset).toBe('char_virtual_streamer_shy');
    }
    const restored = resumeScene(base, storyLibrary, 'act1', 'a010', 2).state;
    expect(restored.actors['虚拟主播']!.position).toBe('right');
    expect(restored.actors['老师']!.visible).toBe(false);
  });
  it('增量SHOW不覆盖早先快照，a015重建包含战后状态并应用剑退场', () => {
    const first = scenePresentation(storyLibrary, 'act1', 'a008');
    const copy = structuredClone(first);
    const after = resumeScene(emptyState(), storyLibrary, 'act1', 'a015', 2).state;
    expect(first).toEqual(copy);
    expect(after.actors['大师之剑']!.visible).toBe(false);
    expect(after.actors['黑色人形']!.visible).toBe(false);
    expect(after.actors['虚拟主播']!.pose).toBe('昏迷');
  });
  it('A007选择后的刷新清除原分支，从该场景开头开始', () => {
    const choice = reachApp(state => state.sceneId === 'a007' && state.waiting?.kind === 'choice');
    const selected = play(choice, { type: 'choose', token: choice.waiting!.token, index: 2 });
    const resumed = navigate(startApp(0, { kind: 'valid', data: selected.progress!.checkpoint! }).state, 'resume');
    const point = selected.progress!.checkpoint!.checkpoint;
    expect(resumed.sceneId).toBe(point.kind === 'level' ? point.sceneId : '无关内检查点');
    expect(resumed.branch).toBeUndefined();
    expect(resumed.flags.flag_act1_a007_01).toBe(true);
    expect(resumed.waiting?.kind === 'text' ? resumed.waiting.revealed : 0).toBe(0);
  });
  it.each([
    ['prologue', 'p006', 'battle_prologue_tutorial'], ['act1', 'a014', 'battle_black_humanoid'],
  ] as const)('%s战斗中刷新不恢复战斗中途，历史胜利也不能跳过CALL', (actId, sceneId, id) => {
    const data = sampleV2(actId, sceneId); data.flags[`flag_${id}_won`] = true;
    const restored = navigate(startApp(0, { kind: 'valid', data }).state, 'resume');
    expect(restored.sceneId).toBe(sceneId); expect(restored.battle).toBeUndefined();
    const entered = reachApp(state => state.screen === 'battle', restored);
    expect(entered.battle!.id).toBe(id);
    expect(entered.battle!.units.find(unit => unit.id === 'hero')!.hp).toBe(10);
    expect(entered.flags[`flag_${id}_won`]).toBe(true);
    expect(entered.battle!.result).toBeUndefined();
  });
  it('未开放的三个路线和第二幕不能派生恢复快照', () => {
    for (const id of ['a007_todo_thief', 'a007_todo_villain', 'a007_random_unavailable']) expect(() => scenePresentation(storyLibrary, 'act1', id)).toThrow('未开放');
  });
});
