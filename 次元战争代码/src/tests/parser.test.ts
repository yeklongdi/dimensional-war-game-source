import { describe, expect, it } from 'vitest';
import { parseStory } from '../../tools/story-parser.mjs';
import { allNodes, fixture } from './export-helpers.js';

const options = { id: 'act1', title: '格式测试', sourceFile: 'fixture.md' };
const parse = (body: string) => parseStory(fixture(body), options);

describe('导出格式与边界', () => {
  it('只解析正式部分，忽略标题副本，支持全角冒号和无空行的指令边界', () => {
    const { act } = parse([
      '### SCENE：T001', '', 'SCENE：T001', 'TITLE：测试', 'TIME：白天',
      'SHOW：甲 asset=char_a [占位符，延续] position=left',
      'DIALOGUE：', '甲：', '第一行。', '第二行。',
      'INNER：', '甲：', '心声。', 'END：T001',
    ].join('\n'));
    expect(act.scenes.map(scene => scene.id)).toEqual(['t001']);
    expect(act.scenes[0]!.nodes).toEqual([
      { kind: 'show', actor: '甲', asset: 'char_a', position: 'left', placeholder: true },
      { kind: 'dialogue', speaker: '甲', text: '第一行。\n第二行。' },
      { kind: 'inner', speaker: '甲', text: '心声。' }, { kind: 'end' },
    ]);
  });

  it('连续表情也逐次保留，只合并尚未赋值的初始状态', () => {
    const { act } = parse([
      'SCENE: T001', 'SHOW: 甲 asset=char_a', 'POSE: 甲=站立', 'EXPRESSION: 甲=平静',
      'DIALOGUE:', '甲：', '文字。', 'EXPRESSION: 甲=认真', 'EXPRESSION: 甲=微笑',
      'POSE: 甲=坐下', 'END: T001',
    ].join('\n'));
    const shows = act.scenes[0]!.nodes.filter(node => node.kind === 'show');
    expect(shows.map(node => node.expression)).toEqual(['平静', '认真', '微笑']);
    expect(shows[0]).toMatchObject({ pose: '站立', asset: 'char_a' });
    expect(shows[1]).toMatchObject({ update: true });
    expect(shows[2]).toMatchObject({ update: true, pose: '坐下' });
  });

  it('跨场景增量 SHOW 可沿用素材，不回写前一场，也不误报缺失', () => {
    const { act, warnings } = parse([
      'SCENE: T001', 'SHOW: 甲 asset=char_a expression=平静', 'JUMP: T002',
      'SCENE: T002', 'SHOW: 甲 expression=认真', 'END: T002',
    ].join('\n'));
    expect(act.scenes[0]!.nodes[0]).toMatchObject({ expression: '平静' });
    expect(act.scenes[1]!.nodes[0]).toEqual({ kind: 'show', actor: '甲', expression: '认真', update: true });
    expect(warnings.some(warning => warning.categories.includes('missing_asset'))).toBe(false);
  });

  it('未知指令保留为隐藏节点并继续；同一位置的三类问题合并为一条', () => {
    const { act, warnings } = parse([
      'SCENE: T001', 'CG: cg_test [占位符]', 'STAGE:', '正文。', 'END: T001',
    ].join('\n'));
    expect(act.scenes[0]!.nodes).toEqual([
      { kind: 'unknown', raw: 'CG: cg_test [占位符]', meta: true, placeholder: true },
      { kind: 'stage', text: '正文。' }, { kind: 'end' },
    ]);
    expect(warnings).toHaveLength(1);
    expect(new Set(warnings[0]!.categories)).toEqual(new Set(['placeholder', 'meta', 'unknown']));
  });

  it('制作标记覆盖文本、选项、SET、CHECK；条件内部不生成 SET 或跳转', () => {
    const { act, warnings } = parse([
      'SCENE: T001', 'CHOICE: 测试。', 'OPTION 1:', '【不可执行】测试选项。',
      'SET: [变量名待定] 记录测试甲',
      'CHECK: [条件] -> SET: [变量名待定] 记录条件；JUMP: MISSING',
      'INNER:', '甲：', '【原文说明】保留。', '',
      'OPTION 2:', '测试选项乙。', 'SET: [变量名待定] 记录测试乙', 'END: T001',
    ].join('\n'));
    const nodes = [...allNodes(act.scenes[0]!.nodes)];
    const sets = nodes.filter(node => node.kind === 'set');
    expect(sets.map(node => node.flag)).toEqual(['flag_act1_t001_01', 'flag_act1_t001_02']);
    expect(sets[0]).toMatchObject({ note: 'SET: [变量名待定] 记录测试甲', meta: true });
    expect(nodes.find(node => node.kind === 'check')).toMatchObject({
      raw: 'CHECK: [条件] -> SET: [变量名待定] 记录条件；JUMP: MISSING', meta: true,
    });
    expect(nodes.find(node => node.kind === 'inner')).toMatchObject({ meta: true });
    expect(nodes.some(node => node.kind === 'jump')).toBe(false);
    expect(warnings.some(warning => warning.categories.includes('unresolved_jump'))).toBe(false);
    const choice = act.scenes[0]!.nodes[0];
    expect(choice).toMatchObject({ kind: 'choice', options: [expect.objectContaining({ meta: true }), expect.anything()] });
  });

  it('行内文字与空说话人可保留，调用参数不丢失，缺素材角色有来源定位', () => {
    const { act, warnings } = parse([
      'SCENE: T001', 'STAGE: 行内舞台说明。', 'DIALOGUE:', '旁人：', '文字。', '',
      'INNER: 无名字的心声。', 'CALL: event_test effect=fade target=screen',
      'JUMP: MISSING',
    ].join('\n'));
    expect(act.scenes[0]!.nodes).toContainEqual({ kind: 'inner', speaker: '', text: '无名字的心声。' });
    expect(act.scenes[0]!.nodes).toContainEqual({ kind: 'call', name: 'event_test', args: { effect: 'fade', target: 'screen' } });
    expect(warnings.find(warning => warning.categories.includes('missing_asset'))).toMatchObject({ sourceFile: 'fixture.md', sceneId: 't001', line: 5 });
    expect(warnings.some(warning => warning.categories.includes('unresolved_jump'))).toBe(true);
  });

  it('缺少正式脚本边界、没有场景或重复 id 时明确失败', () => {
    expect(() => parseStory('SCENE: T001', options)).toThrow('边界');
    expect(() => parse('')).toThrow('没有 SCENE');
    expect(() => parse('SCENE: T001\nSCENE: T001')).toThrow('重复');
  });
});
