import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prologueSources, storyVersion } from './prologue-sources.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const vault = resolve(root, '..', '剧情', '序幕');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const originals = await Promise.all(prologueSources.map(async item => {
  const from = resolve(vault, item.part, item.script);
  return { ...item, from, bytes: await readFile(from) };
}));
// 全部来源读取成功后才写；已存在的快照只校验，绝不覆盖。
for (const item of originals) {
  const target = resolve(root, item.sourceFile);
  await mkdir(dirname(target), { recursive: true });
  try { await writeFile(target, item.bytes, { flag: 'wx' }); }
  catch (error) {
    if (error.code !== 'EEXIST' || hash(await readFile(target)) !== hash(item.bytes)) throw error;
  }
}
const manifest = { contentVersion: storyVersion, files: originals.map(({ bytes, ...item }) => ({ ...item, sha256: hash(bytes) })) };
const manifestPath = resolve(root, 'source/story/prologue-v2/manifest.json'), manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
try { await writeFile(manifestPath, manifestText, { flag: 'wx' }); }
catch (error) {
  if (error.code !== 'EEXIST' || await readFile(manifestPath, 'utf8') !== manifestText) throw error;
}
console.log(`已按原字节复制四段剧本；${storyVersion}，旧 source 未改写。`);
