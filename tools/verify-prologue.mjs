import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { walkNodes } from './story-normalize.mjs';
import { prologueSources } from './prologue-sources.mjs';

// 本机验收：baseline包含只读vault与旧美术的绝对路径；不作为CI依赖。
const root = fileURLToPath(new URL('../', import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = async file => JSON.parse(await readFile(resolve(root, file), 'utf8'));
const before = await json('docs/verification/prologue-v2/before.json');
for (const item of before.protected) assert.equal(sha(await readFile(item.path)), item.sha256, item.path);
const manifest = await json('source/story/prologue-v2/manifest.json');
for (const item of manifest.files) {
  assert.equal(sha(await readFile(resolve(root, item.sourceFile))), item.sha256, item.sourceFile);
  assert.equal(sha(await readFile(item.from)), item.sha256, item.from);
}
for (const file of ['src/content/prologue.json', 'src/content/act1.json', 'src/content/index.json']) {
  const old = spawnSync('git', ['show', `${before.head}:${file}`], { cwd: root });
  assert.equal(old.status, 0); assert.equal(sha(await readFile(resolve(root, file))), sha(old.stdout), file);
}
const outputFiles = [...prologueSources.map(item => `src/content/prologue-v2/${item.id}.json`),
  'src/content/prologue-v2/index.json', 'docs/open-questions.md'];
const hashes = async () => Object.fromEntries(await Promise.all(outputFiles.map(async file => [file, sha(await readFile(resolve(root, file)))])));
const runs = [];
for (let i = 0; i < 2; i++) {
  const run = spawnSync(process.execPath, ['tools/export-story.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr); runs.push({ stdout: run.stdout.trim(), hashes: await hashes() });
}
assert.deepEqual(runs[0], runs[1], '两次实际导出必须一致');
const acts = await Promise.all(prologueSources.map(item => json(`src/content/prologue-v2/${item.id}.json`)));
assert.deepEqual(acts.map(act => act.scenes.length), [9, 22, 8, 13]);
const a007 = acts[1].scenes.find(scene => scene.id === 'a007').nodes.find(node => node.kind === 'choice');
assert.equal(a007.options.length, 4); assert.deepEqual(a007.options.filter(item => item.enabled).map(item => item.index), [2]);
const calls = [...new Set(acts.flatMap(act => act.scenes.flatMap(scene => [...walkNodes(scene.nodes)]
  .filter(node => node.kind === 'call').map(node => node.name))))].sort();
assert.deepEqual(calls, ['battle_black_humanoid', 'battle_prologue4_deoxys_encounter', 'battle_prologue4_patrol',
  'battle_prologue_tutorial', 'event_master_sword_vision', 'random_rd3'].sort());
const registration = await json('art/prologue-v2/registration.json'), halfRegistration = await json('art/hero-half-v1/registration.json');
const allAssets = [...registration.assets, ...halfRegistration.assets];
assert.equal(registration.assets.length, 18); assert.equal(halfRegistration.assets.length, 10);
for (const asset of allAssets) {
  const png = await readFile(resolve(root, asset.file));
  assert.equal(sha(png), asset.sha256, asset.file);
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1024, 1536]);
  assert.equal(png[25], 6, `${asset.id} 必须为RGBA`);
}
const index = await json('src/content/prologue-v2/index.json');
const codeFiles = async dir => (await Promise.all((await readdir(resolve(root, dir), { withFileTypes: true })).map(async file =>
  file.isDirectory() ? codeFiles(`${dir}/${file.name}`) : /\.(ts|mjs|mts)$/.test(file.name) ? [`${dir}/${file.name}`] : []))).flat();
for (const file of [...await codeFiles('src'), ...await codeFiles('tools')])
  assert.ok((await readFile(resolve(root, file), 'utf8')).split('\n').length <= 401, `${file} 超过400行`);
const result = { protectedFiles: before.protected.length, protectedChanged: 0, snapshots: manifest.files.length,
  historicalJsonChanged: 0, deterministic: true, exportRuns: runs, scenes: acts.map(act => ({ id: act.id, count: act.scenes.length })),
  mainScenes: 48, unfinishedScenes: 4, a007Options: 4, a007Enabled: [2], calls, warnings: index.warningCount,
  portraits: allAssets.length, rgba: true, codeLineLimit: true };
await writeFile(resolve(root, 'docs/verification/prologue-v2/checks.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(`保护 ${before.protected.length} 份、4份新快照、旧JSON3份均不变；两次导出一致；场景9/22/8/13，warning ${index.warningCount}；${allAssets.length}份RGBA立绘哈希通过。`);
