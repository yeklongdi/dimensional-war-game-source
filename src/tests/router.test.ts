import { describe, expect, it } from 'vitest';
import { navigationToken, reduceApp, startApp } from '../game/router.js';
import { completionFlags } from '../game/save-format.js';
import { encodeV2 } from '../game/save-v2.js';
import { levelIds } from '../content/levels.js';
import { storyLibrary } from '../game/story/library.js';
import { battleToken } from '../game/battle/state-helpers.js';
import { appAction, appStep, freshApp, navigate, play, reachApp, sampleV2, enterLevel } from './m4-helpers.js';

// 任务书§12替代M4三卡、幕头重玩；保留其存储/生命周期断言，改为七关语义。
describe('地图导航与累计通关', () => {
  it('空档菜单零写入；开始建立地图检查点且只允许第一关', () => {
    const initial = startApp(0, { kind: 'empty' });
    expect(initial.state).toMatchObject({ screen: 'menu', progress: { completedLevelIds: [], status: 'empty' } });
    expect(initial.saves).toBeUndefined();
    const map = navigate(initial.state, 'open-map');
    expect(map).toMatchObject({ screen: 'map', map: { selected: 'grandma_home' }, progress: { checkpoint: { checkpoint: { kind: 'map' } } } });
    for (const id of [...levelIds.slice(1), 'act2']) expect(enterLevel(map, id)).toBe(map);
    expect(enterLevel(map, 'prologue_01').sceneId).toBe('p001');
  });
  it('战斗胜利不提前通关序幕，p009 END才写幕完成标记', () => {
    const won = reachApp(state => state.battle?.result?.outcome === 'win');
    expect(won.progress!.completedLevelIds).toEqual(['prologue_01']);
    const returned = appStep(won);
    expect(returned.flags.flag_battle_prologue_tutorial_won).toBe(true);
    expect(returned.flags[completionFlags.prologue]).toBeUndefined();
    const map = reachApp(state => state.screen === 'map' && state.progress!.completedLevelIds.length === 3, returned);
    expect(map.flags[completionFlags.prologue]).toBe(true);
    expect(map.progress!.checkpoint!.flags[completionFlags.prologue]).toBe(true);
    expect(map.map!.selected).toBe('school_road');
  });
  it('黑色人形胜利不提前完成第六关，序幕二结束开放第八关，已完成入口不可重玩', () => {
    const won = reachApp(state => state.battle?.id === 'battle_black_humanoid' && state.battle.result?.outcome === 'win');
    expect(won.flags[completionFlags.act1]).toBeUndefined(); expect(won.progress!.completedLevelIds).toHaveLength(5);
    const final = reachApp(state => state.screen === 'map' && state.progress!.completedLevelIds.length === 7, won);
    expect(final.flags[completionFlags.act1]).toBe(true);
    expect(final.map!.unlock).toBe(true);
    for (const id of [...levelIds.slice(0, 7), 'prologue4_01', 'act2']) expect(enterLevel(final, id)).toBe(final);
    expect(enterLevel(final, 'prologue3_01').sceneId).toBe('b001');
    const menu = navigate(final, 'main-menu'), continued = navigate(menu, 'resume');
    expect(continued.screen).toBe('map'); expect(continued.progress!.completedLevelIds).toHaveLength(7);
    expect(continued.flags).toEqual(final.flags);
  });
  it('往返地图和菜单保留关内检查点；开始游戏不清进度', () => {
    const data = sampleV2('act1');
    const menu = startApp(0, { kind: 'valid', data }).state;
    const map = navigate(menu, 'open-map');
    expect(map.progress!.checkpoint).toEqual(data);
    const back = navigate(map, 'main-menu'), resumed = navigate(back, 'resume');
    expect(resumed).toMatchObject({ screen: 'story', activeLevelId: 'act1_03', sceneId: 'a010', waiting: { kind: 'choice' } });
    expect(enterLevel(map, 'act1_01')).toBe(map);
    expect(enterLevel(map, 'act1_03').sceneId).toBe('a010');
  });
});
describe('保存纪律与生命周期回归', () => {
  it.each(['dead', 'stable'] as const)('%s失败不新增胜利或通关，重试保留原等待及RNG', reason => {
    const original = reachApp(state => state.screen === 'battle');
    const failed = { ...original, battle: { ...original.battle!, result: { outcome: 'lose' as const, reason } } };
    const retry = play(failed, { type: 'restart', token: battleToken(failed.battle) });
    expect(retry.waiting).toEqual(original.waiting); expect(retry.battle!.rng).toEqual(original.battle!.rng);
    expect(retry.flags.flag_battle_prologue_tutorial_won).toBeUndefined();
    expect(retry.flags[completionFlags.prologue]).toBeUndefined(); expect(retry.progress!.completedLevelIds).toHaveLength(1);
  });
  it('战斗模式切换不保存，异常剧情仍能返回地图', () => {
    const initial = reachApp(state => state.screen === 'battle');
    const ready = play(initial, { type: 'command', envelope: { token: battleToken(initial.battle!), origin: 'player', command: { kind: 'inspire', dieIndex: null } } });
    const mode = reduceApp(ready, { type: 'play', run: ready.run, action: { type: 'mode', token: battleToken(ready.battle!), mode: 'skills' } }, storyLibrary, 200);
    expect(mode.saves).toBeUndefined(); expect(mode.state.battleMode).toBe('skills');
    const error = { ...freshApp(), waiting: { kind: 'error' as const, token: 'error', origin: { nodeIndex: 0 }, message: '测试故障' } };
    expect(navigate(error, 'open-map').screen).toBe('map');
  });
  it('打字、补全、开发浮层不保存；禁用选择保持原状态', () => {
    const state = freshApp(), wait = state.waiting!;
    for (const action of [{ type: 'reveal', token: wait.token, count: 1 }, { type: 'advance', token: wait.token }, { type: 'toggle-debug' }] as const) {
      expect(reduceApp(state, { type: 'play', run: state.run, action }, storyLibrary, 10).saves).toBeUndefined();
    }
    const choice = reachApp(game => game.sceneId === 'a007' && game.waiting?.kind === 'choice');
    expect(play(choice, { type: 'choose', token: choice.waiting!.token, index: 1 })).toBe(choice);
    const selected = reduceApp(choice, { type: 'play', run: choice.run, action: { type: 'choose', token: choice.waiting!.token, index: 2 } }, storyLibrary, 1234);
    expect(selected.saves).toHaveLength(1);
    const request = selected.saves![0]!; expect(request.kind === 'save' && request.data.savedAt).toBe(1234);
  });
  it('A010回班后停在未完成分支，明确重新选择或刷新回选择，不完成第六关', () => {
    const choice = reachApp(game => game.sceneId === 'a010' && game.waiting?.kind === 'choice');
    const explanation = play(choice, { type: 'choose', token: choice.waiting!.token, index: 2 });
    expect(explanation).toMatchObject({ sceneId: 'a010_return_class', waiting: { kind: 'text' }, flags: { flag_act1_a010_03: true } });
    const returned = reachApp(game => game.waiting?.kind === 'choice', explanation);
    expect(returned.sceneId).toBe('a010'); expect(returned.progress!.completedLevelIds).toHaveLength(5);
    const resumed = navigate(startApp(0, { kind: 'valid', data: explanation.progress!.checkpoint! }).state, 'resume');
    expect(resumed.waiting?.kind).toBe('choice'); expect(resumed.branch).toBeUndefined(); expect(resumed.flags.flag_act1_a010_03).toBe(true);
    expect(play(resumed, { type: 'choose', token: resumed.waiting!.token, index: 1 }).sceneId).toBe('a011');
  });
  it('返回菜单或地图清除活动等待/战斗，旧输入和重复导航无效', () => {
    const game = freshApp(), oldRun = game.run, oldToken = game.waiting!.token;
    const action = { type: 'main-menu' as const, token: navigationToken(game) }, menu = appAction(game, action);
    expect(menu).toMatchObject({ screen: 'menu', waiting: null }); expect(menu.battle).toBeUndefined();
    expect(appAction(menu, action)).toBe(menu);
    const stale = { type: 'play' as const, run: oldRun, action: { type: 'advance' as const, token: oldToken } };
    expect(appAction(menu, stale)).toBe(menu);
    const resumed = navigate(menu, 'resume'); expect(appAction(resumed, stale)).toBe(resumed);
    const map = navigate(game, 'open-map'); expect(map.progress!.checkpoint!.checkpoint).toEqual(game.progress!.checkpoint!.checkpoint);
  });
  it('立即返回时转交有效待保存请求，旧保存回调无效', () => {
    const map = navigate(startApp(0, { kind: 'empty' }).state, 'open-map');
    const begun = reduceApp(map, { type: 'enter-level', token: navigationToken(map), levelId: 'prologue_01' }, storyLibrary, 100);
    const old = begun.saves![0]!;
    if (old.kind !== 'save') throw new Error('应为保存');
    const returned = reduceApp(begun.state, { type: 'main-menu', token: navigationToken(begun.state) }, storyLibrary, 200);
    const next = returned.saves![0]!;
    expect(next.kind === 'save' && next.data).toEqual(old.data); expect(next.run).not.toBe(old.run);
    expect(reduceApp(returned.state, { type: 'save-result', run: old.run, revision: old.revision, outcome: { kind: 'saved', data: old.data } }, storyLibrary, 300).state).toBe(returned.state);
  });
  it.each(['empty', 'valid'] as const)('保存中收到%s外部更新仍交接请求，已完成旧检查点归一化地图', kind => {
    const map = navigate(startApp(0, { kind: 'empty' }).state, 'open-map');
    const begun = reduceApp(map, { type: 'enter-level', token: navigationToken(map), levelId: 'prologue_01' }, storyLibrary, 100);
    const read = kind === 'empty' ? { kind } : { kind, data: sampleV2('act1') };
    const received = reduceApp(begun.state, { type: 'external-save', read }, storyLibrary, 200).state;
    expect(received.progress!.status).toBe('saving');
    const returned = reduceApp(received, { type: 'main-menu', token: navigationToken(received) }, storyLibrary, 300), request = returned.saves![0]!;
    if (request.kind !== 'save') throw new Error('应为保存');
    expect(request.data.checkpoint).toEqual(kind === 'valid' ? { kind: 'map' } : { kind: 'level', levelId: 'prologue_01', sceneId: 'p001' });
    if (kind === 'valid') expect(request.data.completedLevelIds).toHaveLength(5);
  });
  it('坏档允许会话游玩，两步确认仅替换指定来源的v2目标', () => {
    const bad = { kind: 'invalid' as const, key: 'v1' as const, raw: '坏档', message: '旧档无法读取' };
    const map = navigate(startApp(0, bad).state, 'open-map');
    const started = reduceApp(map, { type: 'enter-level', token: navigationToken(map), levelId: 'prologue_01' }, storyLibrary, 100);
    expect(started.state.screen).toBe('story'); expect(started.saves).toEqual([]);
    const ask = navigate(started.state, 'ask-replace'); expect(ask.progress!.confirming).toBe(true);
    expect(play(ask, { type: 'advance', token: ask.waiting!.token })).toBe(ask);
    const confirmed = reduceApp(ask, { type: 'confirm-replace', token: navigationToken(ask) }, storyLibrary, 200);
    expect(confirmed.saves![0]).toMatchObject({ kind: 'save', replace: { key: 'v1', raw: '坏档' }, data: { checkpoint: { kind: 'level', sceneId: 'p001' } } });
    expect(navigate(ask, 'cancel-replace').progress!.status).toBe('blocked');
  });
  it('写入失败不伪装成功，仍能推进本次剧情', () => {
    const game = freshApp(), checkpoint = game.progress!.checkpoint!;
    const changed = reduceApp(game, { type: 'save-result', run: game.run, revision: game.progress!.request,
      outcome: { kind: 'read', read: { kind: 'unavailable', message: '保存失败' } } }, storyLibrary, 200).state;
    expect(changed.progress).toMatchObject({ status: 'error', checkpoint }); expect(appStep(changed)).not.toBe(changed);
  });
  it('确认坏档替换后立即导航，授权与原始串随有效请求交接', () => {
    const bad = { kind: 'invalid' as const, key: 'v2' as const, raw: '坏档', message: '保留原件' };
    const game = enterLevel(navigate(startApp(0, bad).state, 'open-map'), 'prologue_01');
    const ask = navigate(game, 'ask-replace');
    const replacing = reduceApp(ask, { type: 'confirm-replace', token: navigationToken(ask) }, storyLibrary, 100);
    const reread = reduceApp(replacing.state, { type: 'external-save', read: bad }, storyLibrary, 101);
    expect(reread.state.progress!.status).toBe('saving');
    const map = reduceApp(reread.state, { type: 'open-map', token: navigationToken(reread.state) }, storyLibrary, 102);
    expect(map.saves![0]).toMatchObject({ kind: 'save', replace: { key: 'v2', raw: '坏档' }, data: { checkpoint: { sceneId: 'p001' } } });
    expect(map.saves![0]!.run).not.toBe(replacing.saves![0]!.run);
  });
  it.each(['empty', 'valid'] as const)('保存失败后重读%s，导航仍保留未保存提示和内存检查点', kind => {
    const map = navigate(startApp(0, { kind: 'empty' }).state, 'open-map');
    const begun = reduceApp(map, { type: 'enter-level', token: navigationToken(map), levelId: 'prologue_01' }, storyLibrary, 100);
    const failed = reduceApp(begun.state, { type: 'save-result', run: begun.state.run, revision: begun.state.progress!.request,
      outcome: { kind: 'read', read: { kind: 'unavailable', message: '保存失败，尚未写入' } } }, storyLibrary, 101).state;
    const read = kind === 'empty' ? { kind } : { kind, data: sampleV2('prologue', 'p001') };
    const received = appAction(failed, { type: 'external-save', read });
    expect(received.progress).toMatchObject({ status: 'error', message: '保存失败，尚未写入', draft: { checkpoint: { sceneId: 'p001' } } });
    const returned = navigate(received, 'open-map'); expect(returned.progress!.status).toBe('error');
    expect(enterLevel(returned, 'prologue_01').sceneId).toBe('p001');
  });
  it('外部进度只累计，不强制跳场；下一次进入拒绝旧关', () => {
    const game = freshApp(), remote = sampleV2('act1', 'a016');
    const changed = appAction(game, { type: 'external-save', read: { kind: 'valid', data: remote } });
    expect(changed.sceneId).toBe('p001'); expect(changed.waiting).toEqual(game.waiting); expect(changed.progress!.completedLevelIds).toHaveLength(6);
    const map = navigate(changed, 'open-map'); expect(enterLevel(map, 'prologue_01')).toBe(map); expect(enterLevel(map, 'act1_04').sceneId).toBe('a016');
  });
  it('独立调试场拒绝正式进度和存档操作', () => {
    const debug = { ...freshApp(), screen: 'battle-debug' as const };
    expect(appAction(debug, { type: 'external-save', read: { kind: 'valid', data: sampleV2('act1') } })).toBe(debug);
    expect(navigate(debug, 'open-map')).toBe(debug);
  });
  it('输入不可变；旧AI、战斗token不能污染恢复会话', () => {
    const battle = reachApp(state => state.screen === 'battle'), before = structuredClone(battle), token = battleToken(battle.battle!);
    const resumed = navigate(navigate(battle, 'main-menu'), 'resume'); expect(battle).toEqual(before);
    const stale = { type: 'play' as const, run: battle.run, action: { type: 'command' as const,
      envelope: { token, origin: 'ai' as const, command: { kind: 'end' as const, actor: 'grunt_a' } } } };
    expect(appAction(resumed, stale)).toBe(resumed); expect(encodeV2(resumed.progress!.checkpoint!)).not.toContain('rng');
  });
});
