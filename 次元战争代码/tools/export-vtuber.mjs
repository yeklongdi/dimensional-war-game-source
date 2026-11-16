// 虚拟主播线独立导出脚本：把 source/story/vtuber/*.md 解析为
// src/content/vtuber/*.json，不触碰 prologue-v2 的内容、index 与版本号。
// 用法：
//   node tools/export-vtuber.mjs            仅导出（读取 source 快照）
//   node tools/export-vtuber.mjs --import   先把原稿从游戏说明复制到 source 快照，再导出
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseStory } from './story-parser.mjs';
import { vtuberContentVersion, vtuberSources, vtuberVault } from './vtuber-sources.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'src', 'content', 'vtuber');
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
const importMode = process.argv.includes('--import');

async function snapshot(item) {
  const from = resolve(root, '..', ...vtuberVault, item.part, item.script);
  const to = resolve(root, item.sourceFile);
  if (importMode) {
    await mkdir(dirname(to), { recursive: true });
    await copyFile(from, to);
    console.log(`导入原稿：${item.script} → ${item.sourceFile}`);
  }
  return to;
}

async function main() {
  const manifestPath = resolve(root, 'source', 'story', 'vtuber', 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (manifest.contentVersion !== vtuberContentVersion) {
    throw new Error(`manifest 版本 ${manifest.contentVersion} 与脚本 ${vtuberContentVersion} 不一致。`);
  }
  const outputs = [];
  const index = { contentVersion: vtuberContentVersion, acts: [], warningCount: 0, warnings: [] };
  for (const item of vtuberSources) {
    const entry = manifest.files?.find(file => file.id === item.id);
    if (!entry || entry.sourceFile !== item.sourceFile || entry.count !== item.count) {
      throw new Error(`manifest 缺少 ${item.id} 的匹配条目。`);
    }
    const file = await snapshot(item);
    const before = hash(await readFile(file));
    if (before !== entry.sha256) {
      throw new Error(`${item.sourceFile} 的 sha256 与 manifest 不一致，请确认是否更新了原稿。`);
    }
    const markdown = await readFile(file, 'utf8');
    const { act, warnings } = parseStory(markdown, {
      id: item.id, title: item.title, sourceFile: item.sourceFile,
    });
    if (act.scenes.length !== item.count) {
      throw new Error(`${item.id} 场景数变化（${act.scenes.length} ≠ ${item.count}），请人工复核原稿。`);
    }
    const after = hash(await readFile(file));
    if (before !== after) throw new Error(`${item.sourceFile} 在导出过程中被改动，已停止。`);
    const output = resolve(outDir, `${item.id}.json`);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, `${JSON.stringify(act, null, 2)}\n`, 'utf8');
    outputs.push({ file: `${item.id}.json`, scenes: act.scenes.length, sha256: after });
    index.acts.push({ id: act.id, title: act.title, file: `${item.id}.json`, sceneCount: act.scenes.length });
    index.warningCount += warnings.length;
    index.warnings.push(...warnings);
    console.log(`导出 ${item.id}：${act.scenes.length} 场景，${warnings.length} 条诊断 → src/content/vtuber/${item.id}.json`);
  }
  await writeFile(resolve(outDir, 'index.json'), `${JSON.stringify(index, null, 2)}\n`, 'utf8');
  console.log(`版本：${vtuberContentVersion}`);
  for (const item of outputs) console.log(`  ${item.file} · ${item.scenes} 场景 · sha256 ${item.sha256.slice(0, 12)}`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
