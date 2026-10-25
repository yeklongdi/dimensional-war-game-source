import { describe, expect, it } from 'vitest';
import { navigationToken } from '../game/router.js';
import { battleToken } from '../game/battle/state-helpers.js';
import { completionFlags } from '../game/save-format.js';
import { sampleV2 } from './m4-helpers.js';
import { atLastText, loadAuto, storyHarness, walk } from './new-game-prologue-helpers.js';
import { storyLibrary } from '../game/story/library.js';

const firstTextOf = (actId: string, sceneId: string) => {
  const scene = storyLibrary[actId]!.scenes.find(item => item.id === sceneId)!;
  const node = scene.nodes.find(item => ['stage', 'dialogue', 'inner', 'narration'].includes(item.kind))!;
  if (!('text' in node)) throw new Error('首节点不是正文');
  return node.text;
};

// 专项范围：new-game-prologue-flow-spec.md §3–§4、T01–T04。只覆盖新入口与序幕一两处内部衔接。
describe('T01 无进度新游戏直入序幕（一）', () => {
  it('空档新游戏写入成功后直接进入prologue_01/p001，初始检查点为关内，不经过地图', async () => {
    const h = storyHarness();
    expect(h.state.screen).toBe('menu');
    await h.system('new');
    expect(h.state.screen).toBe('story');
    expect(h.state.activeLevelId).toBe('prologue_01');
    expect(h.state.sceneId).toBe('p001');
    expect(h.state.progress!.completedLevelIds).toEqual([]);
    expect(h.state.flags).toEqual({});
    expect(h.state.map).toBeUndefined();
    expect(h.auto().checkpoint).toEqual({ kind: 'level', levelId: 'prologue_01', sceneId: 'p001' });
    expect(h.auto().completedLevelIds).toEqual([]);
    const wait = h.state.waiting!;
    expect(wait).toMatchObject({ kind: 'text', revealed: 0, origin: { nodeIndex: 3 } });
    expect(wait.kind === 'text' && wait.text.startsWith(firstTextOf('prologue', 'p001').slice(0, 20))).toBe(true);
  });
  it('重复新游戏、旧系统token与旧激活回调不重复启动，也不跳过P001首句', async () => {
    const h = storyHarness();
    const menuToken = navigationToken(h.state);
    await h.system('new');
    const entered = h.state;
    expect(entered.waiting).toMatchObject({ kind: 'text', revealed: 0, origin: { nodeIndex: 3 } });
    // 同一次入口之后的旧菜单导航与旧系统动作不得再次启动或推进正文。
    await h.action({ type: 'open-map', token: menuToken });
    await h.system('new');
    expect(h.state).toBe(entered);
    // 旧激活回调（错误运行身份）被拒绝，正文仍停在第一句未补全。
    await h.action({ type: 'vault-result', request: { kind: 'auto', id: 'stale-activation', runId: 'stale-run-identity', session: 0, revision: 0,
      data: sampleV2('prologue', 'p001') }, outcome: { kind: 'stale' } });
    expect(h.state).toBe(entered);
    expect(h.state.waiting).toMatchObject({ kind: 'text', revealed: 0 });
  });
});

describe('T02 有进度的新游戏确认、取消与写入失败', () => {
  it('取消不改档；确认后直入P001，手动槽与设置保持', async () => {
    const h = storyHarness(sampleV2('act1', 'a014'), sampleV2('act1', 'a014'));
    await loadAuto(h);
    expect(h.state.sceneId).toBe('a014');
    await h.system('open'); await h.system('go-menu');
    await h.system('settings');
    await h.action({ type: 'settings-change', data: { version: 1, bgm: 17, sfx: 42, textMs: 60 } });
    await h.system('back');
    const beforeRaw = JSON.stringify(h.vault()), manualBefore = h.vault()!.manual;
    await h.system('new');
    expect(h.state.system!.panel).toBe('confirm');
    await h.system('cancel');
    expect(JSON.stringify(h.vault())).toBe(beforeRaw);
    expect(h.state.screen).toBe('menu');
    await h.system('new'); await h.system('confirm');
    expect(h.state.screen).toBe('story');
    expect(h.state.activeLevelId).toBe('prologue_01');
    expect(h.state.sceneId).toBe('p001');
    expect(h.state.progress!.completedLevelIds).toEqual([]);
    expect(h.state.flags).toEqual({});
    expect(h.auto().checkpoint).toEqual({ kind: 'level', levelId: 'prologue_01', sceneId: 'p001' });
    expect(h.vault()!.manual).toEqual(manualBefore);
    expect(h.state.settings).toEqual({ version: 1, bgm: 17, sfx: 42, textMs: 60 });
  });
  it('写入失败保留旧状态与旧档，重试成功后才进入P001', async () => {
    const h = storyHarness(sampleV2('act1', 'a014'), sampleV2('act1', 'a014'));
    await loadAuto(h);
    await h.system('open'); await h.system('go-menu');
    const beforeRaw = JSON.stringify(h.vault()), beforeCompleted = h.state.progress!.completedLevelIds;
    h.setFailure(true);
    await h.system('new'); await h.system('confirm');
    expect(h.state.screen).toBe('menu');
    expect(h.state.system!.message).toContain('保存失败');
    expect(JSON.stringify(h.vault())).toBe(beforeRaw);
    expect(h.state.progress!.completedLevelIds).toEqual(beforeCompleted);
    h.setFailure(false);
    await h.system('confirm');
    expect(h.state.screen).toBe('story');
    expect(h.state.sceneId).toBe('p001');
    expect(h.auto().checkpoint).toEqual({ kind: 'level', levelId: 'prologue_01', sceneId: 'p001' });
  });
});

describe('T03 序幕一两处内部衔接', () => {
  it('P004末句与自动指令完成后只结算第一关并直接进入P005，不显示地图', async () => {
    const h = storyHarness();
    await h.system('new');
    await walk(h, atLastText('p004', 13));
    expect(h.state.progress!.completedLevelIds).toEqual([]);
    const lastToken = h.state.waiting!.kind === 'text' ? h.state.waiting!.token : '';
    await h.play({ type: 'advance', token: lastToken });
    expect(h.state.screen).toBe('story');
    expect(h.state.sceneId).toBe('p004');
    expect(h.state.progress!.completedLevelIds).toEqual([]);
    expect(h.state.flags.flag_prologue_p005_01).toBeUndefined();
    await h.play({ type: 'advance', token: lastToken });
    expect(h.state.screen).toBe('story');
    expect(h.state.map).toBeUndefined();
    expect(h.state.activeLevelId).toBe('prologue_02');
    expect(h.state.sceneId).toBe('p005');
    expect(h.state.progress!.completedLevelIds).toEqual(['prologue_01']);
    expect(h.state.flags.flag_prologue_p005_01).toBeUndefined();
    expect(h.state.flags[completionFlags.prologue]).toBeUndefined();
    expect(h.state.waiting).toMatchObject({ kind: 'text', revealed: 0 });
    expect(h.auto().checkpoint).toEqual({ kind: 'level', levelId: 'prologue_02', sceneId: 'p005' });
    const settled = h.state;
    await h.play({ type: 'advance', token: lastToken });
    expect(h.state).toBe(settled);
  });
  it('P007完成后只结算第二关并直接进入P008，完成前缀逐次增长', async () => {
    const h = storyHarness();
    await h.system('new');
    await walk(h, atLastText('p007', 8));
    expect(h.state.progress!.completedLevelIds).toEqual(['prologue_01']);
    await h.play({ type: 'advance', token: h.state.waiting!.token });
    await h.play({ type: 'advance', token: h.state.waiting!.token });
    expect(h.state.screen).toBe('story');
    expect(h.state.map).toBeUndefined();
    expect(h.state.activeLevelId).toBe('prologue_03');
    expect(h.state.sceneId).toBe('p008');
    expect(h.state.progress!.completedLevelIds).toEqual(['prologue_01', 'prologue_02']);
    expect(h.state.flags[completionFlags.prologue]).toBeUndefined();
    expect(h.auto().checkpoint).toEqual({ kind: 'level', levelId: 'prologue_03', sceneId: 'p008' });
    expect(h.state.waiting).toMatchObject({ kind: 'text', revealed: 0 });
    expect(h.state.progress!.completedLevelIds).toHaveLength(2);
  });
  it('快进在两处关末按原归属停止，不自动获胜、不自动结算下一关', async () => {
    const h = storyHarness();
    await h.system('new');
    await h.system('open'); await h.system('skip');
    for (let index = 0; index < 400 && h.state.fastForward; index++) {
      const wait = h.state.waiting;
      if (wait?.kind !== 'text') break;
      await h.action({ type: 'fast-forward', intent: 'tick', run: h.state.run, revision: h.state.fastForward!.revision, token: wait.token });
    }
    expect(h.state.fastForward).toBeUndefined();
    expect(h.state.screen).toBe('story');
    expect(h.state.sceneId).toBe('p005');
    expect(h.state.progress!.completedLevelIds).toEqual(['prologue_01']);
    expect(h.state.waiting).toMatchObject({ kind: 'text', revealed: 0 });
  });
});

describe('T04 P006教学战停等与返回后正文', () => {
  it('P006仍进入教学战，明确跳过后继续原CALL后的SET与正文，到P007末句才结算第二关', async () => {
    const h = storyHarness();
    await h.system('new');
    await walk(h, state => state.screen === 'battle' && state.battle?.id === 'battle_prologue_tutorial');
    expect(h.state.progress!.completedLevelIds).toEqual(['prologue_01']);
    expect(h.state.battle!.result).toBeUndefined();
    expect(h.state.flags.flag_battle_prologue_tutorial_won).toBeUndefined();
    expect(h.state.flags.flag_battle_prologue_tutorial_skipped).toBeUndefined();
    expect(h.state.flags.flag_prologue_p006_01).toBeUndefined();
    await h.system('open'); await h.system('skip');
    expect(h.state.screen).toBe('story');
    expect(h.state.sceneId).toBe('p007');
    expect(h.state.flags.flag_battle_prologue_tutorial_skipped).toBe(true);
    // 既有跳过契约同时写胜利标志并按胜利返回；本次只记录为“跳过”，不声称战斗实打胜利。
    expect(h.state.flags.flag_battle_prologue_tutorial_won).toBe(true);
    expect(h.state.flags.flag_prologue_p006_01).toBe(true);
    expect(h.state.progress!.completedLevelIds).toEqual(['prologue_01']);
    expect(h.state.waiting).toMatchObject({ kind: 'text' });
    await walk(h, atLastText('p007', 8));
    expect(h.state.progress!.completedLevelIds).toEqual(['prologue_01']);
    expect(h.state.flags.flag_prologue_p007_01).toBeUndefined();
    await h.play({ type: 'advance', token: h.state.waiting!.token });
    await h.play({ type: 'advance', token: h.state.waiting!.token });
    expect(h.state.sceneId).toBe('p008');
    expect(h.state.flags.flag_prologue_p007_01).toBe(true);
    expect(h.state.progress!.completedLevelIds).toEqual(['prologue_01', 'prologue_02']);
  });
  it('返回剧情后的旧战斗token不再结算或复制完成记录', async () => {
    const h = storyHarness();
    await h.system('new');
    await walk(h, state => state.screen === 'battle' && !!state.battle);
    const battleTokenValue = battleToken(h.state.battle!);
    await h.system('open'); await h.system('skip');
    const settled = h.state;
    expect(settled.screen).toBe('story');
    await h.play({ type: 'continue-story', token: battleTokenValue });
    expect(h.state).toBe(settled);
    await h.play({ type: 'skip-battle', token: battleTokenValue });
    expect(h.state).toBe(settled);
    expect(h.state.progress!.completedLevelIds).toEqual(['prologue_01']);
  });
});
