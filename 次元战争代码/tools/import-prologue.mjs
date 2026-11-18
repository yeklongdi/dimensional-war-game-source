import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from './project-paths.mjs';
import { fileURLToPath } from 'node:url';
import { firstCycleManifest, firstCycleSources, prologueSources, storyVersion } from './prologue-sources.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const groups = [
  { version: storyVersion, files: prologueSources, manifest: 'source/story/prologue-v2/manifest.json' },
  { version: 'first_cycle_v1', files: firstCycleSources, manifest: firstCycleManifest },
];
const inputs = await Promise.all(groups.map(async group => ({
  ...group,
  files: await Promise.all(group.files.map(async item => {
    const bytes = await readFile(resolve(root, item.from));
    const target = resolve(root, item.sourceFile);
    const sha256 = hash(bytes);
    const existing = await readFile(target).catch(error => {
      if (error.code !== 'ENOENT') throw error;
    });
    if (existing && hash(existing) !== sha256) throw new Error(`快照与原稿不同，请另设修订文件：${item.sourceFile}`);
    return { bytes, target, existing, entry: { ...item, sha256 } };
  })),
})));
// 全部原稿及快照校验成功后才登记，原快照始终以排他创建保护。
for (const group of inputs) {
  for (const file of group.files) {
    if (file.existing) continue;
    await mkdir(dirname(file.target), { recursive: true });
    await writeFile(file.target, file.bytes, { flag: 'wx' });
  }
  const manifest = { contentVersion: group.version, files: group.files.map(file => file.entry) };
  await writeFile(resolve(root, group.manifest), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}
console.log('已登记四段序幕与首周期两份剧本，导入文件与原稿字节一致。');
