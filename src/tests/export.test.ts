import { describe, expect, it } from 'vitest';
import prologueRaw from '../../source/story/prologue.md?raw';
import act1Raw from '../../source/story/act1.md?raw';
import prologueJson from '../content/prologue.json';
import act1Json from '../content/act1.json';
import indexJson from '../content/index.json';
import questions from '../../docs/open-questions.md?raw';
import { createExportBundle } from '../../tools/story-bundle.mjs';
import type { Act, ContentIndex } from '../content/types.js';
import { allNodes, choiceOf, exportedTextBlocks, originalTextBlocks, sceneOf, sourceScene } from './export-helpers.js';

const prologue = prologueJson as Act;
const act1 = act1Json as Act;
const index = indexJson as ContentIndex;
const acts = [prologue, act1];

describe('真实剧本导出回归', () => {
  it('序幕 9 场，第一幕 19 场，保留三个未完成场景', () => {
    expect(prologue.scenes).toHaveLength(9);
    expect(act1.scenes).toHaveLength(19);
    for (const id of ['a007_todo_thief', 'a007_todo_villain', 'a007_random_unavailable']) {
      expect(sceneOf(act1, id).nodes.some(node => node.kind === 'narration' && node.meta)).toBe(true);
    }
    for (const act of acts) {
      expect(new Set(act.scenes.map(scene => scene.id)).size).toBe(act.scenes.length);
      for (const scene of act.scenes) expect(scene.id).toMatch(/^[a-z0-9_]+$/);
    }
  });

  it('A007 原样保留四个选项，仅虚拟主播启用', () => {
    const choice = choiceOf(sceneOf(act1, 'a007'));
    expect(choice.options.map(option => [option.index, option.text, option.enabled])).toEqual([
      [1, '怪盗。', false], [2, '虚拟主播。', true], [3, '反派。', false], [4, '让老师选择。', false],
    ]);
    expect(choice.options[3]!.nodes).toContainEqual({ kind: 'call', name: 'random_rd3' });
    expect(choice.options[3]!.nodes.filter(node => node.kind === 'check')).toHaveLength(3);
  });

  it('A009 只跳转，A010 获得原提示语、两项选项和原始分支指令', () => {
    const source = sceneOf(act1, 'a009');
    expect(source.nodes.some(node => node.kind === 'choice')).toBe(false);
    expect(source.nodes.at(-1)).toEqual({ kind: 'jump', target: 'a010' });
    const choice = choiceOf(sceneOf(act1, 'a010'));
    expect(choice.prompt).toBe('男高是否进入废弃施工现场。');
    expect(choice.options.map(option => [option.text, option.enabled])).toEqual([
      ['去废弃施工现场看看。', true], ['回班上。', true],
    ]);
    expect(choice.options[0]!.nodes.at(-1)).toEqual({ kind: 'jump', target: 'a011' });
    expect(choice.options[1]!.nodes.at(-1)).toEqual({ kind: 'jump', target: 'a016' });
    expect(choice.options[1]!.nodes.find(node => node.kind === 'narration')).toMatchObject({ meta: true });
  });

  it('两个战斗调用各一次；其他调用也完整保留', () => {
    const calls = acts.flatMap(act => act.scenes.flatMap(scene => [...allNodes(scene.nodes)]))
      .filter(node => node.kind === 'call').map(node => node.name);
    expect(calls.filter(name => name.startsWith('battle_'))).toEqual([
      'battle_prologue_tutorial', 'battle_black_humanoid',
    ]);
    expect(calls).toContain('random_rd3');
    expect(calls).toContain('event_master_sword_vision');
  });

  it('包含制作标记的所有节点均标为 meta，含心声和选项内部', () => {
    const marked = /【(?:待确认|不可执行|暂无线性后果)】|\[变量名待定\]/;
    for (const act of acts) for (const scene of act.scenes) {
      for (const node of allNodes(scene.nodes)) {
        const text = 'text' in node ? node.text : 'note' in node ? node.note : 'raw' in node ? node.raw : '';
        if (text.startsWith('【') || marked.test(text) || ['check', 'meta', 'unknown'].includes(node.kind)) {
          expect(node.meta, `${scene.id}: ${text}`).toBe(true);
        }
      }
    }
    expect(sceneOf(act1, 'a002').nodes.find(node => node.kind === 'inner')).toMatchObject({ meta: true });
    for (const [act, id, text] of [
      [prologue, 'p006', '战斗结果返回后，继续进入战斗结束场景。'],
      [act1, 'a007', '这是系统随机，不是玩家直接选择。'],
    ] as const) {
      expect([...allNodes(sceneOf(act, id).nodes)].find(node => 'text' in node && node.text === text)).toMatchObject({ meta: true });
    }
  });

  it('表情更新留在对应对白之后，跨场景不改写早先的 SHOW', () => {
    const p001 = sceneOf(prologue, 'p001');
    expect(p001.nodes.find(node => node.kind === 'show' && node.actor === '男高')).toMatchObject({ expression: '紧张、期待' });
    const p002 = sceneOf(prologue, 'p002');
    const index = p002.nodes.findIndex(node => node.kind === 'show' && node.actor === '男高');
    expect(p002.nodes[index]).toEqual({ kind: 'show', actor: '男高', update: true, expression: '放松、微笑' });
    expect(p002.nodes[index - 1]).toMatchObject({ kind: 'dialogue', speaker: '奶奶' });
    expect(sceneOf(prologue, 'p005').nodes).toContainEqual({
      kind: 'show', actor: '男高', expression: '认真、出头', update: true,
    });
  });

  it('素材标记不污染资源名或位置；场景初始背景不被后续切换覆盖', () => {
    expect(sceneOf(prologue, 'p001').nodes.find(node => node.kind === 'show')).toMatchObject({
      asset: 'char_male_high_normal', position: 'center', placeholder: true,
    });
    expect(sceneOf(act1, 'a002').nodes.find(node => node.kind === 'show' && node.actor === '怪盗')).toMatchObject({
      asset: 'char_thief_smile', position: 'right', placeholder: true,
    });
    expect(sceneOf(act1, 'a008').background).toBe('bg_school_library_day');
    expect(sceneOf(act1, 'a008').nodes.flatMap(node => node.kind === 'background' ? [node.name] : [])).toEqual([
      'bg_school_library_day', 'bg_school_cafeteria_day', 'bg_school_gym_day',
    ]);
  });

  it.each([
    ['p005', prologue, prologueRaw], ['a007', act1, act1Raw], ['a012', act1, act1Raw],
  ] as const)('%s 文字逐段与原文一致', (id, act, raw) => {
    const expected = originalTextBlocks(sourceScene(raw, id));
    expect(expected.length).toBeGreaterThan(0);
    expect(exportedTextBlocks(sceneOf(act, id))).toEqual(expected);
  });

  it('诊断数与清单一致，同一原文位置仅一条，CG 不丢失', () => {
    expect(index.warningCount).toBe(index.warnings.length);
    const locations = index.warnings.map(warning => `${warning.sourceFile}:${warning.line}`);
    expect(new Set(locations).size).toBe(locations.length);
    expect(index.warnings.filter(warning => warning.categories.includes('missing_asset')).map(warning => warning.details.join(' '))).toEqual([
      '说话人“同学甲”没有任何含 asset 的 SHOW 声明。', '说话人“同学乙”没有任何含 asset 的 SHOW 声明。',
    ]);
    expect(sceneOf(act1, 'a012').nodes.find(node => node.kind === 'unknown')).toEqual({
      kind: 'unknown', raw: 'CG: cg_master_sword_vision_placeholder [占位符]', meta: true, placeholder: true,
    });
    expect(questions).toContain(`warning 共 **${index.warningCount} 条**`);
    expect(questions.match(/^#### /gm)).toHaveLength(index.warningCount);
    expect(questions).toContain('random_rd3');
  });

  it('重新解析得到相同产物，连续导出无时间戳或随机差异', () => {
    const sources = { prologue: prologueRaw, act1: act1Raw };
    const first = createExportBundle(sources);
    const second = createExportBundle(sources);
    expect(first).toEqual(second);
    expect(first.acts).toEqual(acts);
    expect(first.index).toEqual(index);
    expect(first.questions).toBe(questions);
  });
});
