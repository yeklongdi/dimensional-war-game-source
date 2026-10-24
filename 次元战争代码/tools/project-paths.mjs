import nodePath from 'node:path';
import { fileURLToPath } from 'node:url';

export const codeRoot = fileURLToPath(new URL('../', import.meta.url));
export const repositoryRoot = nodePath.dirname(codeRoot.replace(/[\\/]$/, ''));
export const documentationRoot = nodePath.join(repositoryRoot, '游戏说明', '工程');

/** 旧验收仍保留原路径；仅在读取或写入本地文件时映射，不改历史证据。 */
export function currentPath(input) {
  if (!nodePath.isAbsolute(input)) return input;
  const relative = nodePath.relative(repositoryRoot, input).replaceAll('\\', '/');
  if (relative.startsWith('../') || nodePath.isAbsolute(relative)) return input;
  let value = relative;
  if (value.startsWith('游戏文件/')) value = `次元战争代码/${value.slice('游戏文件/'.length)}`;
  if (value.startsWith('次元战争代码/次元战争代码/')) value = value.slice('次元战争代码/'.length);
  if (value.startsWith('次元战争代码/游戏说明/')) value = value.slice('次元战争代码/'.length);
  if (value.startsWith('次元战争代码/')) {
    const local = value.slice('次元战争代码/'.length);
    if (local === 'docs' || local.startsWith('docs/')) value = `游戏说明/工程${local.slice(4)}`;
    else if (local === 'prompts' || local.startsWith('prompts/')) value = `游戏说明/交接提示词${local.slice(7)}`;
    else if (['README.md', 'CONTRIBUTING.md', 'THIRD_PARTY_NOTICES.md'].includes(local)) value = `游戏说明/工程/${local}`;
    else if (/^\d\d-[^/]+\.md$/.test(local)) value = `游戏说明/历史开工包/${local}`;
    else if (local.startsWith('art/') && local.endsWith('.md')) value = `游戏说明/素材制作/${local.slice(4)}`;
    return nodePath.join(repositoryRoot, value);
  }
  const [top] = value.split('/');
  if (['背景故事', '剧情', '怪物数据', '游戏机制', '小点子'].includes(top)) value = `游戏说明/${value}`;
  else if (top === '角色') value = `${/\.(md|canvas)$/.test(value) ? '游戏说明' : '次元战争代码/素材原件'}/${value}`;
  else if (['地图', '音乐'].includes(top)) value = `次元战争代码/素材原件/${value}`;
  else if (top === '生图脚本') value = value.endsWith('.md') ? `游戏说明/素材制作/${value}` : `次元战争代码/${value}`;
  else if (['大纲.md', '座位.md'].includes(value)) value = `游戏说明/${value}`;
  return nodePath.join(repositoryRoot, value);
}

export const resolve = (...parts) => currentPath(nodePath.resolve(...parts));
export const join = (...parts) => currentPath(nodePath.join(...parts));
export * from 'node:path';
export default { ...nodePath, resolve, join };
