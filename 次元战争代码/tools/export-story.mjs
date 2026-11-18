import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from './project-paths.mjs';
import { createReleaseBundle } from './prologue-bundle.mjs';
import { firstCycleManifest, firstCycleSources, prologueSources, storyVersion } from './prologue-sources.mjs';
import { walkNodes } from './story-normalize.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourceFiles = [...prologueSources.map(item => item.sourceFile), ...firstCycleSources.map(item => item.sourceFile),
  'source/story/prologue.md', 'source/story/act1.md', 'source/data/hero.md', 'source/data/org_grunt.md'];
const copyCommands = prologueSources.map(item =>
  `Copy-Item -LiteralPath '${resolve(root, item.from)}' -Destination '${item.sourceFile}'`,
).join('\n');
const hash = buffer => createHash('sha256').update(buffer).digest('hex');

async function readManifest(path, version, sources, fingerprints, offset = 0) {
  const manifest = JSON.parse(await readFile(resolve(root, path), 'utf8'));
  if (manifest.contentVersion !== version || !Array.isArray(manifest.files) || manifest.files.length !== sources.length
    || manifest.files.some((item, i) => item.id !== sources[i].id || item.sourceFile !== sources[i].sourceFile
      || item.from !== sources[i].from || item.sha256 !== fingerprints[offset + i])) {
    throw new Error(`导入清单 ${path} 与正式快照不符，已停止导出。`);
  }
}

async function main() {
  let originals;
  try {
    originals = await Promise.all(sourceFiles.map(file => readFile(resolve(root, file))));
  } catch (error) {
    throw new Error(`无法读取指定 source 原文，已停止；未寻找替代内容。\n${error.message}\n\n新版原文复制命令如下（不得覆盖现有快照）；建议使用 node tools/import-prologue.mjs 同时登记哈希：\n${copyCommands}\n旧 source 缺失时请恢复原始副本，不能用新版替代。`);
  }
  const fingerprints = originals.map(hash);
  await readManifest('source/story/prologue-v2/manifest.json', storyVersion, prologueSources, fingerprints);
  await readManifest(firstCycleManifest, 'first_cycle_v1', firstCycleSources, fingerprints, prologueSources.length);
  const bundle = createReleaseBundle(
    Object.fromEntries(prologueSources.map((item, i) => [item.id, originals[i].toString('utf8')])),
    Object.fromEntries(firstCycleSources.map((item, i) => [item.id, originals[prologueSources.length + i].toString('utf8')])),
  );
  const outputs = [
    ...bundle.acts.map(act => [`src/content/prologue-v2/${act.id}.json`, `${JSON.stringify(act, null, 2)}\n`]),
    ['src/content/prologue-v2/index.json', `${JSON.stringify(bundle.index, null, 2)}\n`],
    ['src/content/first-cycle.json', `${JSON.stringify(bundle.firstCycle, null, 2)}\n`],
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
  console.log(`首周期 ${bundle.firstCycle.scenes.length} 场，${bundle.firstCycleWarnings.length} 条诊断；导出前后正式快照 SHA-256 一致。`);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
