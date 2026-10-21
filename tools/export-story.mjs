import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { createExportBundle } from './story-bundle.mjs';
import { walkNodes } from './story-normalize.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourceFiles = [
  'source/story/prologue.md', 'source/story/act1.md',
  'source/data/hero.md', 'source/data/org_grunt.md',
];
const copyCommands = [
  "$vault = 'E:\\笔记\\次元战争设定'",
  'Copy-Item "$vault\\剧情\\序幕\\序幕_Galgame脚本.md" source\\story\\prologue.md',
  'Copy-Item "$vault\\剧情\\第一幕\\第一幕_Galgame脚本.md" source\\story\\act1.md',
  'Copy-Item "$vault\\角色\\御主\\御主：热血男高+saber\\角色卡\\御主：热血男高+saber.md" source\\data\\hero.md',
  'Copy-Item "$vault\\怪物数据\\邪恶组织小弟.md" source\\data\\org_grunt.md',
].join('\n');
const hash = buffer => createHash('sha256').update(buffer).digest('hex');

async function main() {
  let originals;
  try {
    originals = await Promise.all(sourceFiles.map(file => readFile(resolve(root, file))));
  } catch (error) {
    throw new Error(`无法读取指定 source 原文，已停止；未寻找替代内容。\n${error.message}\n\n请在工程目录执行原始复制命令：\n${copyCommands}`);
  }
  const fingerprints = originals.map(hash);
  const bundle = createExportBundle({
    prologue: originals[0].toString('utf8'), act1: originals[1].toString('utf8'),
  });
  const outputs = [
    ...bundle.acts.map(act => [`src/content/${act.id}.json`, `${JSON.stringify(act, null, 2)}\n`]),
    ['src/content/index.json', `${JSON.stringify(bundle.index, null, 2)}\n`],
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
  console.log('四份 source 文件导出前后 SHA-256 一致；问题清单已更新。');
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
