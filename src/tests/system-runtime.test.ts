import { describe, expect, it } from 'vitest';
import { menuHarness, loadAuto } from './menu-helpers.js';
import { sampleV2 } from './m4-helpers.js';
import { reduceRuntime, systemToken } from '../game/runtime.js';
import { navigationToken } from '../game/router.js';
import { storyLibrary } from '../game/story/library.js';
import { newVault, saveKeyV3 } from '../game/save-v3.js';
import { battleToken } from '../game/battle/state-helpers.js';
import { reduceCampaign } from '../game/campaign.js';

async function reachBattle(h: ReturnType<typeof menuHarness>) {
  for (let i = 0; i < 30 && h.state.screen === 'story'; i++) {
    const wait = h.state.waiting!;
    await h.action({ type: 'play', run: h.state.run, action: { type: 'advance', token: wait.token } });
  }
}

describe('真正新游戏与独立恢复', () => {
  it('空档成功写入后才进地图，生成持久身份，只开放第一关', async () => {
    const h = menuHarness(); await h.system('new'); expect(h.state.screen).toBe('map');
    expect(h.state.progress!.completedLevelIds).toEqual([]); expect(h.state.flags).toEqual({}); expect(h.state.system!.activeRunId).toContain('new-run');
    expect(h.m.values.has(saveKeyV3)).toBe(true);
  });
  it('已有进度的新游戏取消不变；确认清空进度但保留六槽和设置', async () => {
    const h = menuHarness(sampleV2('act1', 'a014')); await loadAuto(h); await h.system('open'); await h.system('save'); await h.system('pick-save', 1); await h.system('back'); await h.system('go-menu');
    await h.system('settings'); await h.action({ type: 'settings-change', data: { version: 1, bgm: 17, sfx: 42, textMs: 60 } }); await h.system('back');
    const before = JSON.parse(h.m.values.get(saveKeyV3)!), identity = h.state.system!.activeRunId;
    await h.system('new'); expect(h.state.system!.panel).toBe('confirm'); await h.system('cancel'); expect(h.m.values.get(saveKeyV3)).toBe(JSON.stringify(before));
    await h.system('new'); await h.system('confirm'); const after = JSON.parse(h.m.values.get(saveKeyV3)!);
    expect(h.state.screen).toBe('map'); expect(h.state.flags).toEqual({}); expect(h.state.progress!.completedLevelIds).toEqual([]);
    expect(after.manual).toEqual(before.manual); expect(h.state.settings).toEqual({ version: 1, bgm: 17, sfx: 42, textMs: 60 }); expect(h.state.system!.activeRunId).not.toBe(identity);
  });
  it('激活写失败保留旧活动状态和原档，取消不丢当前等待', async () => {
    const h = menuHarness(sampleV2()); await loadAuto(h); const waiting = h.state.waiting, auto = h.m.values.get(saveKeyV3);
    await h.system('open'); await h.system('load'); await h.system('pick-load', 0); h.setFailure(true); await h.system('confirm');
    expect(h.state.waiting).toBe(waiting); expect(h.m.values.get(saveKeyV3)).toBe(auto); expect(h.state.system!.message).toContain('失败');
    await h.system('cancel'); expect(h.state.waiting).toBe(waiting); expect(h.state.system!.panel).toBe('load');
  });
  it.each(['p001', 'p002', 'a007', 'a010', 'p006', 'a014'])('%s从场景头恢复，战斗重新开场，不保存逐字/规划', async scene => {
    const h = menuHarness(sampleV2(scene.startsWith('p') ? 'prologue' : 'act1', scene)); await loadAuto(h);
    expect(h.state.sceneId).toBe(scene); expect(h.state.movementDraft).toBeUndefined(); expect(h.state.branch).toBeUndefined();
    if (scene === 'p006' || scene === 'a014') { expect(h.state.screen).toBe('story'); await reachBattle(h); expect(h.state.screen).toBe('battle'); expect(h.state.battleReturn?.battleId).toBe(h.state.battle?.id); }
    else if (scene === 'a007' || scene === 'a010') expect(h.state.waiting?.kind).toBe('choice');
    else { expect(h.state.waiting).toMatchObject({ kind: 'text', revealed: 0 }); }
    expect(JSON.stringify(JSON.parse(h.m.values.get(saveKeyV3)!).auto)).not.toMatch(/movementDraft|revealed|pendingRoll|actors/);
  });
  it('已完成前八关恢复地图，已完成关不可重开，只开放未完成第九关', async () => {
    const all = sampleV2('act1', 'a016'); all.completedLevelIds.push('act1_04', 'prologue3_01');
    Object.assign(all.flags, { flag_act1_completed: true, has_master_sword: true, link_summoned: true, prologue_3_complete: true }); all.checkpoint = { kind: 'map' };
    const h = menuHarness(all); await loadAuto(h); expect(h.state.screen).toBe('map'); expect(h.state.progress!.completedLevelIds).toHaveLength(8);
    const before = h.state; await h.action({ type: 'enter-level', token: navigationToken(h.state), levelId: 'prologue_01' }); expect(h.state).toBe(before);
  });
});
describe('模态暂停、原等待与过期输入', () => {
  it('规则入口同样拒绝暂停推进；窗口尺寸变化仅更新布局而不保存', async () => {
    const h = menuHarness(sampleV2('prologue', 'p001')); await loadAuto(h); await h.system('open');
    const before = h.state;
    expect(reduceCampaign(before, { type: 'advance', token: before.waiting!.token }, storyLibrary).state).toBe(before);
    await h.system('go-map'); await h.system('open'); const raw = h.m.values.get(saveKeyV3);
    await h.action({ type: 'resize-map', token: navigationToken(h.state), viewport: { width: 900, height: 620 } });
    expect(h.state.map!.viewport).toEqual({ width: 900, height: 620 }); expect(h.state.system!.panel).toBe('system');
    expect(h.m.values.get(saveKeyV3)).toBe(raw);
  });
  it('剧情暂停拒绝reveal/advance，取消后保留原光标与已显示数量', async () => {
    const h = menuHarness(sampleV2('prologue', 'p001')); await loadAuto(h);
    const wait = h.state.waiting!; await h.system('open'); const paused = h.state;
    for (const action of [{ type: 'reveal' as const, token: wait.token, count: 9 }, { type: 'advance' as const, token: wait.token }]) {
      await h.action({ type: 'play', run: h.state.run, action }); expect(h.state).toBe(paused);
    }
    await h.system('back'); expect(h.state.waiting).toBe(wait);
    await h.action({ type: 'play', run: h.state.run, action: { type: 'advance', token: wait.token } }); expect(h.state.waiting).not.toBe(wait);
  });
  it.each(['p006', 'a014'])('%s暂停保留借机/激励/开场与RNG、日志，拒绝系统命令', async scene => {
    const h = menuHarness(sampleV2(scene === 'p006' ? 'prologue' : 'act1', scene)); await loadAuto(h); await reachBattle(h); const battle = h.state.battle;
    await h.system('open'); const before = h.state;
    await h.action({ type: 'play', run: h.state.run, action: { type: 'command', envelope: { token: battleToken(battle!), origin: 'system', command: { kind: 'finish-opening' } } } });
    expect(h.state).toBe(before); expect(h.state.battle).toBe(battle); await h.system('settings'); await h.system('back'); await h.system('back'); expect(h.state.battle).toBe(battle);
  });
  it('跨窗口切换身份立即冻结，旧导航/剧情/保存结果不能恢复旧进度', async () => {
    const h = menuHarness(sampleV2('prologue', 'p001')); await loadAuto(h);
    h.m.values.set(saveKeyV3, JSON.stringify(newVault('foreign-run-identity', sampleV2('act1', 'a014')))); h.external(); expect(h.state.system!.stale).toBe(true);
    const before = h.state; await h.system('back'); expect(h.state).toBe(before);
    await h.action({ type: 'play', run: h.state.run, action: { type: 'advance', token: h.state.waiting!.token } }); expect(h.state).toBe(before);
    await h.system('reload'); expect(h.state.screen).toBe('story'); expect(h.state.sceneId).toBe('a014'); expect(h.state.system!.activeRunId).toBe('foreign-run-identity');
    expect(h.state.system!.stale).toBe(false); expect(h.state.progress!.completedLevelIds.length).toBeGreaterThan(0);
  });
  it('重复确认、旧token与旧会话均不产生第二次转换', async () => {
    const h = menuHarness(sampleV2()); await h.system('new'); const token = systemToken(h.state); await h.system('confirm'); const before = h.state;
    await h.action({ type: 'system', intent: 'confirm', token }); expect(h.state).toBe(before);
    const r = reduceRuntime(h.state, { type: 'play', run: h.state.run - 1, action: { type: 'toggle-debug' } }, storyLibrary, 0); expect(r.state).toBe(h.state);
  });
  it('接受另一窗口的新运行后，本窗口操作编号不复用，手动保存可以完成', async () => {
    const h = menuHarness(sampleV2('prologue', 'p001')); await loadAuto(h); const revision = h.state.system!.revision;
    h.m.values.set(saveKeyV3, JSON.stringify(newVault('another-active-run', sampleV2('prologue', 'p002')))); h.external(); await h.system('reload');
    expect(h.state.system!.revision).toBeGreaterThan(revision); await h.system('open'); await h.system('save'); await h.system('pick-save', 1);
    expect(h.state.system!.pending).toBeUndefined(); expect(h.state.system!.message).toBe('手动槽1已保存。');
    expect(JSON.parse(h.m.values.get(saveKeyV3)!).manual[0].data.checkpoint.sceneId).toBe('p002');
  });
  it('查看菜单、槽位和修改设置均不写游戏进度', async () => {
    const h = menuHarness(); await h.system('new'); const raw = h.m.values.get(saveKeyV3);
    await h.system('open'); await h.system('load'); await h.system('back'); await h.system('settings');
    const wait = h.state.waiting, flags = h.state.flags, run = h.state.run;
    await h.action({ type: 'settings-change', data: { version: 1, bgm: 0, sfx: 0, textMs: 10 } });
    expect(h.m.values.get(saveKeyV3)).toBe(raw); expect(h.state.waiting).toBe(wait); expect(h.state.flags).toBe(flags); expect(h.state.run).toBe(run);
  });
});
