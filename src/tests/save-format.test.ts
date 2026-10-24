import { describe, expect, it } from 'vitest';
import { allowedFlags, completionFlags, decodeSave, encodeSave, mergeFlags } from '../game/save-format.js';
import { legacyLibrary as storyLibrary } from './legacy-library.js';
import { sampleSave } from './m4-helpers.js';

describe('M4 五字段存档校验', () => {
  it('仅编码五字段且往返保留布尔值和毫秒时间', () => {
    const data = sampleSave('act1'); data.flags.flag_act1_a010_03 = false;
    const raw = encodeSave(data);
    expect(Object.keys(JSON.parse(raw))).toEqual(['actId', 'sceneId', 'flags', 'savedAt', 'unlockedActs']);
    expect(decodeSave(raw, storyLibrary)).toEqual({ kind: 'valid', data });
    expect(raw).not.toMatch(/nodeIndex|battle|rng|token|actors|branch/);
  });
  it('空槽和损坏 JSON 明确区分，原始坏档完整保留', () => {
    expect(decodeSave(null, storyLibrary)).toEqual({ kind: 'empty' });
    expect(decodeSave('{坏了', storyLibrary)).toMatchObject({ kind: 'invalid', raw: '{坏了' });
  });
  it.each([
    { actId: 'act2' }, { actId: 'act1', sceneId: 'p003' }, { sceneId: 'p010' },
    { actId: 'act1', sceneId: 'a007_todo_thief' }, { actId: 'act1', sceneId: 'a007_todo_villain' },
    { actId: 'act1', sceneId: 'a007_random_unavailable' }, { flags: { flag_hacked: true } },
    { flags: { flag_prologue_p005_01: 1 } }, { flags: [] }, { unlockedActs: ['prologue', 'act2'] },
    { unlockedActs: ['prologue', 'act1'] }, { savedAt: -1 }, { savedAt: 0.5 }, { savedAt: '2026-10-21' },
    { savedAt: 8_640_000_000_000_001 }, { nodeIndex: 5 },
  ])('拒绝非法数据 %j', patch => {
    expect(decodeSave(JSON.stringify({ ...sampleSave(), ...patch }), storyLibrary).kind).toBe('invalid');
  });
  it('第一幕需要有效解锁，切片完成不能缺少序幕完成记录', () => {
    expect(decodeSave(encodeSave({ ...sampleSave('act1'), flags: {}, unlockedActs: ['prologue'] }), storyLibrary).kind).toBe('invalid');
    const data = sampleSave(); data.flags[completionFlags.act1] = true;
    expect(decodeSave(encodeSave(data), storyLibrary).kind).toBe('invalid');
  });
  it('仅允许12个导出flag、两个正式胜利和两个新增通关flag', () => {
    expect(allowedFlags(storyLibrary).size).toBe(16);
    expect(decodeSave('{"actId":"prologue","sceneId":"p001","flags":{"__proto__":true},"savedAt":0,"unlockedActs":["prologue"]}', storyLibrary).kind).toBe('invalid');
  });
  it('累计合并不撤销已获得的记录，也不修改输入', () => {
    const first = { flag_prologue_p005_01: true }, second = { flag_prologue_p005_01: false, flag_prologue_p006_01: true };
    expect(mergeFlags(first, second)).toEqual({ flag_prologue_p005_01: true, flag_prologue_p006_01: true });
    expect(second.flag_prologue_p005_01).toBe(false);
  });
});
