// 虚拟主播线的独立导入清单。与序幕（prologue-v2）管线完全隔离，
// 不参与 prologue-sources.mjs 的版本与场景数校验。
export const vtuberContentVersion = 'vtuber_bond1_v1';

export const vtuberSources = [
  {
    id: 'vtuber_bond1',
    title: '虚拟主播·羁绊一',
    part: '虚拟主播线',
    script: '羁绊一_Galgame脚本.md',
    sourceFile: 'source/story/vtuber/vtuber_bond1.md',
    count: 2,
  },
];

export const vtuberVault = ['游戏说明', '剧情', '个人'];
