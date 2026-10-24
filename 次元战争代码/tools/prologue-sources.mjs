export const storyVersion = 'prologue_four_parts_v1';
export const prologueSources = [
  { id: 'prologue', title: '序幕（一）：搬来太阳市的前一天', part: '序幕（一）', script: '序幕_Galgame脚本.md', count: 9 },
  { id: 'act1', title: '序幕（二）：转学生来到太阳市第一高中', part: '序幕（二）', script: '序幕（二）_Galgame脚本.md', count: 22 },
  { id: 'prologue_3', title: '序幕（三）：床边的勇者', part: '序幕（三）', script: '序幕（三）_Galgame脚本.md', count: 8 },
  { id: 'prologue_4', title: '序幕（四）：警报下的同行者', part: '序幕（四）', script: '序幕（四）_Galgame脚本.md', count: 13 },
].map(item => ({ ...item, sourceFile: `source/story/prologue-v2/${item.id}.md` }));
