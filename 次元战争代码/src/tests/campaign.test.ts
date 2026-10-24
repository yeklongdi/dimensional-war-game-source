import { describe, expect, it } from 'vitest';
import { reduceCampaign, startCampaign, victoryFlags } from '../game/campaign.js';
import { battleToken, getUnit } from '../game/battle/state-helpers.js';
import { storyLibrary } from '../game/story/library.js';
import { startGame } from '../game/story/player.js';
import { fixture } from './player-helpers.js';
import { campaignAction, campaignCommand, campaignStep, reachCampaignBattle, winCurrentBattle } from './campaign-helpers.js';

describe('正式CALL与一次性剧情回流', () => {
  it.each(['battle_prologue_tutorial', 'battle_black_humanoid'])('%s 保存CALL之后的完整光标及演出', id => {
    const game = reachCampaignBattle(id);
    const scene = storyLibrary[game.actId]!.scenes.find(item => item.id === game.sceneId)!;
    const call = scene.nodes.findIndex(node => node.kind === 'call' && node.name === id);
    expect(game).toMatchObject({ screen: 'battle', nodeIndex: call + 1, waiting: { kind: 'battle', battleId: id }, battleReturn: { nodeIndex: call + 1, waitToken: game.waiting!.token } });
    expect(game.actors['男高']!.visible).toBe(true);
    expect(reduceCampaign(game, { type: 'complete-battle', token: game.waiting!.token }, storyLibrary).state).toBe(game);
    expect(reduceCampaign(game, { type: 'advance', token: game.waiting!.token }, storyLibrary).state).toBe(game);
    expect(reduceCampaign(game, { type: 'continue-story', token: battleToken(game.battle!) }, storyLibrary).state).toBe(game);
  });
  it('真实胜利后p006的SET/CHECK继续执行，只隐藏甲乙并仅回流一次', () => {
    const initial = reachCampaignBattle('battle_prologue_tutorial');
    const won = winCurrentBattle(initial), token = battleToken(won.battle!);
    expect(won.battle!.result?.outcome).toBe('win');
    expect(won.flags[victoryFlags.battle_prologue_tutorial!]).toBeUndefined();
    const resumed = campaignAction(won, { type: 'continue-story', token });
    expect(resumed).toMatchObject({ screen: 'story', sceneId: 'p007', waiting: { kind: 'text' }, flags: { flag_battle_prologue_tutorial_won: true, flag_prologue_p006_01: true } });
    expect(resumed.actors['黑衣人甲']!.visible).toBe(false);
    expect(resumed.actors['黑衣人乙']!.visible).toBe(false);
    expect(resumed.actors['怪盗']).toEqual(initial.actors['怪盗']);
    expect(Object.values(resumed.hiddenNotes).some(note => note.sceneId === 'p006' && note.kind === 'check')).toBe(true);
    expect(reduceCampaign(resumed, { type: 'continue-story', token }, storyLibrary).state).toBe(resumed);
    expect(reduceCampaign(resumed, { type: 'command', envelope: { token, origin: 'system', command: { kind: 'step' } } }, storyLibrary).state).toBe(resumed);
  });
  it('a014先停在战后第一条原文，再保留演出和两个SET，最后自然进a015', () => {
    const initial = reachCampaignBattle('battle_black_humanoid');
    const won = winCurrentBattle(initial);
    expect(won.battle!.result?.outcome).toBe('win');
    const call = initial.nodeIndex;
    const scene = storyLibrary.act1!.scenes.find(item => item.id === 'a014')!;
    const expectedTexts = scene.nodes.slice(call).filter(node => ['stage', 'dialogue', 'inner', 'narration'].includes(node.kind) && !node.meta).map(node => 'text' in node ? node.text : '');
    let state = campaignAction(won, { type: 'continue-story', token: battleToken(won.battle!) });
    expect(state).toMatchObject({ screen: 'story', sceneId: 'a014', waiting: { kind: 'text', text: expectedTexts[0], origin: { nodeIndex: call + 1 } } });
    expect(state.actors['黑色人形']!.visible).toBe(false);
    expect(state.actors['虚拟主播']).toEqual(initial.actors['虚拟主播']);
    const texts: string[] = [];
    for (let step = 0; state.sceneId === 'a014' && step < 30; step++) {
      if (state.waiting?.kind === 'text' && state.waiting.revealed === 0) texts.push(state.waiting.text);
      state = campaignStep(state);
    }
    expect(texts).toEqual(expectedTexts);
    expect(state.sceneId).toBe('a015');
    expect(state.flags).toMatchObject({ flag_battle_black_humanoid_won: true, flag_act1_a014_01: true, flag_act1_a014_02: true });
    expect(state.actors['大师之剑']!.visible).toBe(false);
  });
  it('分支内CALL的分支光标同样只推进一次', () => {
    const library = fixture([{ kind: 'choice', prompt: '选择', options: [{ index: 1, text: '测试', enabled: true, nodes: [
      { kind: 'call', name: 'battle_prologue_tutorial' }, { kind: 'stage', text: '分支战后原文' }, { kind: 'set', flag: 'flag_after_branch', note: '测试' },
    ] }] }, { kind: 'end' }]);
    const start = startCampaign(library, 42).state;
    const battle = reduceCampaign(start, { type: 'choose', token: start.waiting!.token, index: 1 }, library).state;
    expect(battle.branch?.index).toBe(1);
    const won = { ...battle, battle: { ...battle.battle!, result: { outcome: 'win' as const, reason: 'eliminated' as const } } };
    const resumed = reduceCampaign(won, { type: 'continue-story', token: battleToken(won.battle) }, library).state;
    expect(resumed.waiting).toMatchObject({ text: '分支战后原文', origin: { optionNodeIndex: 1 } });
    expect(resumed.branch?.index).toBe(2);
  });
  it('即使有胜利结果，返回token、原场景、光标或尝试不匹配都不写flag', () => {
    const won = winCurrentBattle(reachCampaignBattle('battle_prologue_tutorial'));
    const token = battleToken(won.battle!);
    for (const changed of [
      { ...won, nodeIndex: won.nodeIndex + 1 },
      { ...won, sceneId: 'p007' },
      { ...won, battleReturn: { ...won.battleReturn!, waitToken: 'old' } },
      { ...won, battleReturn: { ...won.battleReturn!, attempt: 9999 } },
    ]) expect(reduceCampaign(changed, { type: 'continue-story', token }, storyLibrary).state).toBe(changed);
    expect(won.flags.flag_battle_prologue_tutorial_won).toBeUndefined();
  });
});

describe('失败、重试与旧回调隔离', () => {
  it.each(['dead', 'stable'] as const)('%s失败不回流不写flag，完整重试仍保留剧情快照', reason => {
    const initial = reachCampaignBattle('battle_prologue_tutorial');
    const failed = { ...initial, battle: { ...initial.battle!, result: { outcome: 'lose' as const, reason }, inspiration: { hero: 0 } } };
    expect(reduceCampaign(failed, { type: 'continue-story', token: battleToken(failed.battle) }, storyLibrary).state).toBe(failed);
    const retry = campaignAction(failed, { type: 'restart', token: battleToken(failed.battle) });
    for (const key of ['waiting', 'nodeIndex', 'branch', 'flags', 'actors', 'backgroundId', 'bgmId', 'hiddenNotes'] as const) expect(retry[key]).toEqual(initial[key]);
    expect(retry.battle!.session).not.toBe(initial.battle!.session);
    expect(retry.battle!.rng).toEqual(initial.battle!.rng);
    expect(retry.battle!.log).toEqual(initial.battle!.log);
    expect(retry.battle!.inspiration).toEqual({ hero: 1 });
    expect(retry.battle!.units).toEqual(initial.battle!.units);
    const oldToken = battleToken(failed.battle);
    for (const action of [{ type: 'restart', token: oldToken }, { type: 'continue-story', token: oldToken }, { type: 'command', envelope: { token: oldToken, origin: 'player', command: { kind: 'inspire', dieIndex: 0 } } }] as const) expect(reduceCampaign(retry, action, storyLibrary).state).toBe(retry);
    const direct = campaignAction(winCurrentBattle(initial), { type: 'continue-story', token: battleToken(winCurrentBattle(initial).battle!) });
    const wonRetry = winCurrentBattle(retry), resumed = campaignAction(wonRetry, { type: 'continue-story', token: battleToken(wonRetry.battle!) });
    for (const key of ['sceneId', 'nodeIndex', 'waiting', 'flags', 'actors', 'hiddenNotes'] as const) expect(resumed[key]).toEqual(direct[key]);
  });
  it('剑痕开场之前已有临时HP，重试恢复5点并使旧动画/AI回调失效', () => {
    const game = reachCampaignBattle('battle_black_humanoid'), token = battleToken(game.battle!);
    expect(getUnit(game.battle!, 'hero')!.tempHp).toBe(5);
    expect(campaignCommand(game, { kind: 'finish-opening' }, 'system').battle!.log).toEqual(game.battle!.log);
    expect(reduceCampaign(game, { type: 'command', envelope: { token, origin: 'player', command: { kind: 'end', actor: 'hero' } } }, storyLibrary).state).toBe(game);
    const failed = { ...game, battle: { ...game.battle!, result: { outcome: 'lose' as const, reason: 'dead' as const }, units: game.battle!.units.map(unit => ({ ...unit, tempHp: 0 })) } };
    const retry = campaignAction(failed, { type: 'restart', token });
    expect(getUnit(retry.battle!, 'hero')!.tempHp).toBe(5);
    expect(retry.battle!.log.filter(event => event.kind === 'temp-hp')).toHaveLength(1);
    expect(reduceCampaign(retry, { type: 'command', envelope: { token, origin: 'system', command: { kind: 'finish-opening' } } }, storyLibrary).state).toBe(retry);
  });
  it('完整两幕经两场真实规则胜利走到a016，保留A007/A010与原flag', () => {
    let game = startCampaign(storyLibrary, 0).state;
    const scenes = new Set<string>(), texts: string[] = [], battles = new Set<string>();
    let returned = false;
    for (let count = 0; count < 1200; count++) {
      scenes.add(game.sceneId);
      if (game.screen === 'battle') battles.add(game.battle!.id);
      if (game.screen === 'story' && game.waiting?.kind === 'end' && game.actId === 'act1') break;
      if (game.waiting?.kind === 'text' && game.screen === 'story') texts.push(game.waiting.text);
      if (game.waiting?.kind === 'choice' && game.sceneId === 'a010' && !returned) {
        game = campaignAction(game, { type: 'choose', token: game.waiting.token, index: 2 }); returned = true;
      } else game = campaignStep(game);
    }
    expect(game).toMatchObject({ screen: 'story', sceneId: 'a016', waiting: { kind: 'end' } });
    expect(scenes.size).toBe(28); expect(battles.size).toBe(2);
    expect(Object.keys(game.flags)).toHaveLength(15);
    expect(game.flags.has_master_sword).toBe(true);
    expect(texts.join('')).not.toMatch(/【待确认】|【不可执行】|\[变量名待定\]|CHECK:|CAMERA:|镜头/);
    expect(texts).toContain('男高看见一座漂浮在云海之上的岛屿。');
    expect(game.actors['虚拟主播']!.visible).toBe(false);
    const restarted = campaignAction(game, { type: 'restart', token: game.waiting!.token });
    expect(restarted).toMatchObject({ sceneId: 'p001', flags: {}, campaignSeed: 0, battleSerial: game.battleSerial });
    expect(startGame(storyLibrary).state.screen).toBe('story');
  });
});
