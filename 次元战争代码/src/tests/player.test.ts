import { describe, expect, it } from 'vitest';
import type { StoryNode } from '../content/types.js';
import { displayName, placement } from '../game/story/config.js';
import { storyLibrary } from '../game/story/library.js';
import { reduceGame, startGame } from '../game/story/player.js';
import { fixture, next, reach } from './player-helpers.js';

describe('M1 节点与制作备注', () => {
  it('meta SET 记录原 flag；CHECK 原文与未知指令不执行、不产生空白等待', () => {
    const nodes: StoryNode[] = [
      { kind: 'set', flag: 'flag_fixture', note: '[变量名待定]', meta: true },
      { kind: 'check', raw: 'CHECK: SET flag_bad; JUMP: missing', meta: true },
      { kind: 'inner', speaker: '男高', text: '【待确认】心声', meta: true },
      { kind: 'meta', directive: 'CAMERA', raw: 'CAMERA: 备注', meta: true },
      { kind: 'unknown', raw: 'CG: pending', meta: true },
      { kind: 'stage', text: '可见正文' }, { kind: 'end' },
    ];
    const library = fixture(nodes);
    const initial = startGame(library).state;
    expect(initial.flags).toEqual({ flag_fixture: true });
    expect(initial.waiting).toMatchObject({ kind: 'text', text: '可见正文', origin: { nodeIndex: 5 } });
    expect(Object.values(initial.hiddenNotes)).toHaveLength(5);
    expect(next(initial, library).waiting?.kind).toBe('end');
    expect(nodes[0]).toEqual({ kind: 'set', flag: 'flag_fixture', note: '[变量名待定]', meta: true });
  });

  it('meta 对所有节点有记录语义，不取消背景/演出/SET 等指令', () => {
    const library = fixture([
      { kind: 'background', name: 'bg_fixture', meta: true },
      { kind: 'show', actor: '男高', asset: 'char_male_high_normal', position: 'left', meta: true },
      { kind: 'narration', text: '隐藏文字', meta: true }, { kind: 'end' },
    ]);
    const state = startGame(library).state;
    expect(state.backgroundId).toBe('bg_fixture');
    expect(state.actors['男高']?.visible).toBe(true);
    expect(state.waiting?.kind).toBe('end');
    expect(Object.values(state.hiddenNotes)).toHaveLength(3);
  });

  it('第一次推进只补全文字，过期 token 不会推进下一句', () => {
    const library = fixture([{ kind: 'stage', text: '第一句😀' }, { kind: 'stage', text: '第二句' }, { kind: 'end' }]);
    const state = startGame(library).state;
    const token = state.waiting!.token;
    const complete = reduceGame(state, { type: 'advance', token }, library).state;
    expect(complete.waiting).toMatchObject({ token, revealed: 4 });
    expect(state.waiting).toMatchObject({ revealed: 0 });
    const following = reduceGame(complete, { type: 'advance', token }, library).state;
    expect(following.waiting).toMatchObject({ text: '第二句', revealed: 0 });
    expect(reduceGame(following, { type: 'reveal', token, count: 100 }, library).state).toBe(following);
  });

  it('混合 STAGE 的镜头原句完整进入制作记录，其余正文与 JSON 保真', () => {
    const raw = JSON.stringify(storyLibrary);
    const state = startGame(storyLibrary).state;
    expect(state.waiting).toMatchObject({ text: '男高拎着行李箱和行李袋，站在奶奶家门前。\n背景为两层老房子、门前桂花树和褪色门板。' });
    expect(Object.values(state.hiddenNotes)).toContainEqual(expect.objectContaining({ kind: 'stage-camera', raw: '镜头从房屋和桂花树缓慢推进到男高。' }));
    expect(JSON.stringify(storyLibrary)).toBe(raw);
  });
});

describe('M1 立绘状态', () => {
  it('跨场景保留演员；update 只更新明确字段，早先状态与素材不变', () => {
    const library = fixture([
      { kind: 'show', actor: '男高', asset: 'char_male_high_normal', position: 'right', expression: '微笑', pose: '站立' },
      { kind: 'stage', text: '之前' }, { kind: 'jump', target: 'p002' },
    ], [{ id: 'p002', title: '下一场', time: '白天', meta: { sourceFile: 'fixture', line: 10 }, nodes: [
      { kind: 'show', actor: '男高', update: true, expression: '惊讶' }, { kind: 'stage', text: '之后' }, { kind: 'end' },
    ] }]);
    const initial = startGame(library).state;
    const following = next(initial, library);
    expect(initial.actors['男高']?.expression).toBe('微笑');
    expect(following.sceneId).toBe('p002');
    expect(following.actors['男高']).toMatchObject({ position: 'right', asset: 'char_male_high_normal', expression: '惊讶', pose: '站立', visible: true });
    expect(following.warnings).toEqual({});
  });

  it('缺少更新目标或未知位置时占位且去重警告', () => {
    const state = startGame(fixture([
      { kind: 'show', actor: '陌生人', update: true, expression: '疑惑' },
      { kind: 'show', actor: '陌生人', update: true, expression: '笑' },
      { kind: 'show', actor: '男高', asset: 'char_male_high_normal', position: 'unknown' }, { kind: 'end' },
    ])).state;
    expect(state.actors['陌生人']).toMatchObject({ visible: true, position: 'center', expression: '笑' });
    expect(state.actors['男高']?.position).toBe('center');
    expect(Object.keys(state.warnings)).toHaveLength(3);
    expect(placement('bottom_center').slot).toBe('center');
    expect(placement('top_right').slot).toBe('right');
    expect(placement('bottom_left').slot).toBe('left');
    expect(placement('back').rear).toBe(true);
  });

  it('真实 a007 沿用前场人物；a008 的主播更新仍在 right，按确认配置退场', () => {
    const choice = reach('a007', 'choice');
    expect(choice.actors['怪盗']?.visible).toBe(true);
    const nextScene = reduceGame(choice, { type: 'choose', token: choice.waiting!.token, index: 2 }, storyLibrary).state;
    expect(nextScene.sceneId).toBe('a008');
    expect(nextScene.actors['虚拟主播']?.position).toBe('right');
    expect(nextScene.actors['怪盗']?.visible).toBe(false);
    expect(nextScene.actors['老师']?.visible).toBe(false);
    expect(nextScene.actors['反派']?.visible).toBe(false);
    let later = nextScene;
    while (later.sceneId === 'a008' && later.waiting?.kind === 'text') {
      expect(later.actors['虚拟主播']?.position).toBe('right');
      later = next(later);
    }
    expect(displayName('prologue', '怪盗')).toBe('蒙面人');
    expect(displayName('act1', '怪盗')).toBe('怪盗');
  });
});

describe('M1 选择与调用', () => {
  it('A007 四项按导出 enabled；禁用选项完全不改变状态，第二项正常进入 a008', () => {
    const state = reach('a007', 'choice');
    expect(state.waiting?.kind === 'choice' && state.waiting.options.map(option => option.enabled)).toEqual([false, true, false, false]);
    for (const index of [1, 3, 4, 99]) expect(reduceGame(state, { type: 'choose', token: state.waiting!.token, index }, storyLibrary).state).toBe(state);
    const chosen = reduceGame(state, { type: 'choose', token: state.waiting!.token, index: 2 }, storyLibrary).state;
    expect(chosen.sceneId).toBe('a008');
    expect(chosen.flags.flag_act1_a007_01).toBe(true);
  });

  it('A010第二项隐藏制作备注，播放已有分支后阻断；明确重新选择，原跳转不改', () => {
    const choice = reach('a010', 'choice');
    const option = choice.waiting?.kind === 'choice' ? choice.waiting.options[1] : undefined;
    const copy = JSON.stringify(option);
    const explanation = reduceGame(choice, { type: 'choose', token: choice.waiting!.token, index: 2 }, storyLibrary).state;
    expect(explanation.flags.flag_act1_a010_03).toBe(true);
    expect(explanation).toMatchObject({ sceneId: 'a010_return_class', waiting: { kind: 'text', textKind: 'stage' } });
    const stopped = next(explanation);
    expect(stopped.waiting?.kind).toBe('unfinished');
    expect(reduceGame(stopped, { type: 'advance', token: stopped.waiting!.token }, storyLibrary).state).toBe(stopped);
    const returned = reduceGame(stopped, { type: 'reselect', token: stopped.waiting!.token }, storyLibrary).state;
    expect(returned.sceneId).toBe('a010');
    expect(returned.waiting).toMatchObject({ kind: 'choice', prompt: '男高是否进入废弃施工现场。' });
    expect(returned.actors).toEqual(choice.actors);
    expect(JSON.stringify(option)).toBe(copy);
    const entered = reduceGame(returned, { type: 'choose', token: returned.waiting!.token, index: 1 }, storyLibrary).state;
    expect(entered.sceneId).toBe('a011');
    expect(entered.flags).toMatchObject({ flag_act1_a010_01: true, flag_act1_a010_02: true, flag_act1_a010_03: true });
  });

  it.each([
    ['p006', 'battle_prologue_tutorial', ['黑衣人甲', '黑衣人乙']],
    ['a014', 'battle_black_humanoid', ['黑色人形']],
  ] as const)('%s 的战斗只恢复一次，并只清理配置敌方', (sceneId, battleId, enemies) => {
    const state = reach(sceneId, 'battle');
    const token = state.waiting!.token;
    expect(state.waiting).toMatchObject({ kind: 'battle', battleId });
    for (const enemy of enemies) expect(state.actors[enemy]?.visible).toBe(true);
    expect(reduceGame(state, { type: 'advance', token }, storyLibrary).state).toBe(state);
    const resumed = reduceGame(state, { type: 'complete-battle', token }, storyLibrary).state;
    expect(resumed.waiting?.kind).toBe('text');
    for (const enemy of enemies) expect(resumed.actors[enemy]?.visible).toBe(false);
    expect(resumed.actors['男高']?.visible).toBe(true);
    expect(reduceGame(resumed, { type: 'complete-battle', token }, storyLibrary).state).toBe(resumed);
    expect(state.actors[enemies[0]]?.visible).toBe(true);
  });

  it('非战斗调用去重警告后继续，CG 仅记录', () => {
    const { state, effects } = startGame(fixture([
      { kind: 'call', name: 'event_master_sword_vision' },
      { kind: 'unknown', raw: 'CG: placeholder', meta: true },
      { kind: 'call', name: 'event_master_sword_vision' },
      { kind: 'call', name: 'future_event' }, { kind: 'narration', text: '原文旁白' },
    ]));
    expect(state.waiting).toMatchObject({ kind: 'text', text: '原文旁白' });
    expect(effects.filter(effect => effect.kind === 'warn')).toHaveLength(2);
    expect(Object.values(state.hiddenNotes)[0]?.raw).toBe('CG: placeholder');
  });
});

describe('M1 两幕流程', () => {
  it('序幕结束进入 a001，演出重置且 flag 保留；第一幕结束重新开始清空 flag', () => {
    const end = reach('p009', 'end');
    const act1 = reduceGame(end, { type: 'enter-act1', token: end.waiting!.token }, storyLibrary).state;
    expect(act1.actId).toBe('act1');
    expect(act1.sceneId).toBe('a001');
    expect(act1.flags).toEqual(end.flags);
    expect(act1.actors['怪盗']).toBeUndefined();
    const final = reach('a016', 'end');
    const restart = reduceGame(final, { type: 'restart', token: final.waiting!.token }, storyLibrary).state;
    expect(restart).toMatchObject({ actId: 'prologue', sceneId: 'p001', flags: {}, run: final.run + 1 });
    expect(reduceGame(restart, { type: 'advance', token: final.waiting!.token }, storyLibrary).state).toBe(restart);
  });

  it('新版前两段含取剑主线与两个battle可到达，A012不阻断，显式取剑flag记录', () => {
    let state = startGame(storyLibrary).state;
    const scenes = new Set<string>();
    const battles: string[] = [];
    const texts: string[] = [];
    let returned = false;
    for (let step = 0; step < 600; step++) {
      scenes.add(state.sceneId);
      const wait = state.waiting!;
      expect(wait.kind).not.toBe('error');
      if (wait.kind === 'text') {
        texts.push(wait.text);
        expect(wait.text).not.toMatch(/【待确认】|【不可执行】|\[变量名待定\]|CHECK:|CAMERA:|镜头/);
        state = next(state);
      } else if (wait.kind === 'choice') {
        const index = state.sceneId === 'a007' ? 2 : !returned ? 2 : 1;
        if (state.sceneId === 'a010') returned = true;
        state = reduceGame(state, { type: 'choose', token: wait.token, index }, storyLibrary).state;
      } else if (wait.kind === 'battle') {
        battles.push(wait.battleId);
        state = reduceGame(state, { type: 'complete-battle', token: wait.token }, storyLibrary).state;
      } else if (wait.kind === 'end') {
        if (state.actId === 'act1') break;
        state = reduceGame(state, { type: 'enter-act1', token: wait.token }, storyLibrary).state;
      } else if (wait.kind === 'unfinished') {
        state = reduceGame(state, { type: 'reselect', token: wait.token }, storyLibrary).state;
      }
    }
    expect(state).toMatchObject({ actId: 'act1', sceneId: 'a016', waiting: { kind: 'end' } });
    expect(scenes.size).toBe(28);
    expect(battles).toEqual(['battle_prologue_tutorial', 'battle_black_humanoid']);
    expect(Object.keys(state.flags)).toHaveLength(13);
    expect(state.flags.has_master_sword).toBe(true);
    expect(texts).toContain('男高看见一座漂浮在云海之上的岛屿。');
    expect(state.warnings['call:event_master_sword_vision']).toBeDefined();
    expect(state.actors['大师之剑']?.visible).toBe(false);
    expect(state.actors['虚拟主播']?.visible).toBe(false);
    expect(Object.values(state.hiddenNotes).filter(note => note.kind === 'stage-camera')).toHaveLength(8);
  });
});
