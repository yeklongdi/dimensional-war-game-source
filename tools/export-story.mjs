import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { createPrologueBundle } from './prologue-bundle.mjs';
import { prologueSources, storyVersion } from './prologue-sources.mjs';
import { walkNodes } from './story-normalize.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourceFiles = [...prologueSources.map(item => item.sourceFile),
  'source/story/prologue.md', 'source/story/act1.md', 'source/data/hero.md', 'source/data/org_grunt.md'];
const copyCommands = prologueSources.map(item =>
  `Copy-Item -LiteralPath 'E:\\笔记\\次元战争设定\\剧情\\序幕\\${item.part}\\${item.script}' -Destination '${item.sourceFile}'`,
).join('\n');
const hash = buffer => createHash('sha256').update(buffer).digest('hex');

async function main() {
  let originals;
  try {
    originals = await Promise.all(sourceFiles.map(file => readFile(resolve(root, file))));
  } catch (error) {
    throw new Error(`无法读取指定 source 原文，已停止；未寻找替代内容。\n${error.message}\n\n新版原文复制命令如下（不得覆盖现有快照）；建议使用 node tools/import-prologue.mjs 同时登记哈希：\n${copyCommands}\n旧 source 缺失时请恢复原始副本，不能用新版替代。`);
  }
  const fingerprints = originals.map(hash);
  const manifest = JSON.parse(await readFile(resolve(root, 'source/story/prologue-v2/manifest.json'), 'utf8'));
  if (manifest.contentVersion !== storyVersion || !Array.isArray(manifest.files) || manifest.files.length !== prologueSources.length
    || manifest.files.some((item, i) => item.id !== prologueSources[i].id || item.sourceFile !== prologueSources[i].sourceFile || item.sha256 !== fingerprints[i])) {
    throw new Error('新版快照与导入清单版本、文件或哈希不符，停止导出。');
  }
  const bundle = createPrologueBundle(Object.fromEntries(prologueSources.map((item, i) => [item.id, originals[i].toString('utf8')])));
  const outputs = [
    ...bundle.acts.map(act => [`src/content/prologue-v2/${act.id}.json`, `${JSON.stringify(act, null, 2)}\n`]),
    ['src/content/prologue-v2/index.json', `${JSON.stringify(bundle.index, null, 2)}\n`],
    ['docs/open-questions.md', bundle.questions],
  ];
  const current = await Promise.all(sourceFiles.map(file => readFile(resolve(root, file))));
  if (current.some((buffer, index) => hash(buffer) !== fingerprints[index])) {
    throw new Error('导出期间 source 内容发生变化，已停止写入产物；请重新运行。');
  }
  for (const [file, contents] of outputs) {
    const destination = resolve(root, file);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, contents, 'utf8');
  }
  const after = await Promise.all(sourceFiles.map(file => readFile(resolve(root, file))));
  if (after.some((buffer, index) => hash(buffer) !== fingerprints[index])) {
    throw new Error('source 哈希校验失败，未通过 M0 验收；请检查原文是否被同时编辑。');
  }
  const calls = bundle.acts.flatMap(act => act.scenes.flatMap(scene =>
    [...walkNodes(scene.nodes)].filter(node => node.kind === 'call' && node.name.startsWith('battle_')),
  ));
  const act1 = bundle.acts.find(act => act.id === 'act1');
  const options = act1.scenes.find(scene => scene.id === 'a007').nodes.find(node => node.kind === 'choice').options;
  console.log(`${bundle.acts.map(act => `${act.title} ${act.scenes.length} 场景`).join(' / ')} / warning ${bundle.index.warningCount} 条`);
  console.log(`A007 ${options.length} 个选项 / battle calls：${calls.map(call => call.name).join('、')}`);
  console.log('四份新快照与四份旧 source 导出前后 SHA-256 一致；问题清单已更新。');
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
