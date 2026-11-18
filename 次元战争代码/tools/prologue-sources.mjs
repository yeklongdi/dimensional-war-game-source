export const storyVersion = 'prologue_four_parts_v1';
export const prologueSources = [
  { id: 'prologue', title: '序幕（一）：搬来太阳市的前一天', part: '序幕（一）', script: '序幕_Galgame脚本.md', count: 9 },
  { id: 'act1', title: '序幕（二）：转学生来到太阳市第一高中', part: '序幕（二）', script: '序幕（二）_Galgame脚本.md', count: 22 },
  { id: 'prologue_3', title: '序幕（三）：床边的勇者', part: '序幕（三）', script: '序幕（三）_Galgame脚本.md', count: 8 },
  { id: 'prologue_4', title: '序幕（四）：警报下的同行者', part: '序幕（四）', script: '序幕（四）_Galgame脚本.md', count: 13 },
].map(item => ({
  ...item,
  sourceFile: `source/story/prologue-v2/${item.id === 'prologue_4' ? 'prologue_4_r2' : item.id}.md`,
  from: `../游戏说明/剧情/主线/序幕/${item.part}/${item.script}`,
}));

export const firstCycleSources = [
  {
    id: 'main', sceneIds: ['m101', 'm102', 'm103'],
    from: '../游戏说明/剧情/主线/第一幕/第一幕（一）_Galgame脚本.md',
    sourceFile: 'source/story/first-cycle/main.md',
  },
  {
    id: 'thief_bond1', sceneIds: ['t101', 't102', 't103'],
    from: '../游戏说明/剧情/个人/怪盗线/羁绊一_Galgame脚本.md',
    sourceFile: 'source/story/first-cycle/thief_bond1.md',
  },
];
export const firstCycleManifest = 'source/story/first-cycle/manifest.json';
