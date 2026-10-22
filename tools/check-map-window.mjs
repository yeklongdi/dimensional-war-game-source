import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidence = path.join(root, 'docs/verification/map-window');
const baseline = JSON.parse(await readFile(path.join(evidence, 'before.json'), 'utf8'));
const allowed = new Set([
  'README.md', 'docs/01-任务书.md', 'docs/decisions.md', 'docs/decisions-map-selection.md', 'docs/map-selection-spec.md',
  'src/game/map-camera.ts', 'src/game/router.ts', 'src/game/state.ts', 'src/game/ui/map-view.ts', 'src/styles/map.css', 'src/tests/m4-helpers.ts',
]);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const protectedFiles = [], modified = [], deleted = [];
for (const original of baseline.files) {
  let bytes;
  try { bytes = await readFile(path.join(root, original.path)); }
  catch { deleted.push(original.path); continue; }
  const after = hash(bytes);
  if (allowed.has(original.path)) { if (after !== original.sha256) modified.push(original.path); }
  else protectedFiles.push({ path: original.path, before: original.sha256, after, unchanged: original.sha256 === after });
}
const unexpected = protectedFiles.filter(file => !file.unchanged);
if (deleted.length || unexpected.length) throw new Error(`保护文件变化：${JSON.stringify({ deleted, unexpected })}`);
const code = [];
async function inspect(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, item.name);
    if (item.isDirectory()) await inspect(full);
    else if (/\.(ts|mjs|js)$/.test(item.name)) {
      const lines = (await readFile(full, 'utf8')).trimEnd().split('\n').length;
      if (lines > 400) throw new Error(`代码超过400行：${path.relative(root, full)} (${lines})`);
      code.push({ path: path.relative(root, full).replaceAll('\\', '/'), lines });
    }
  }
}
await inspect(path.join(root, 'src')); await inspect(path.join(root, 'tools'));
const result = { baselineHead: baseline.head, originalFiles: baseline.files.length, unchangedProtected: protectedFiles.length,
  modified, deleted, unexpected, codeFiles: code.length, maxCodeLines: Math.max(...code.map(file => file.lines)), protectedFiles };
await writeFile(path.join(evidence, 'after.json'), JSON.stringify(result, null, 2) + '\n');
for (const name of ['file-changes.json', 'file-changes.md']) {
  try { await readFile(path.join(evidence, name)); } catch { await writeFile(path.join(evidence, name), ''); }
}
const originalPaths = new Set(baseline.files.map(file => file.path));
const added = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' })
  .split('\0').filter(file => file && !originalPaths.has(file)).sort();
const changes = { added, modified: modified.sort(), deleted };
await writeFile(path.join(evidence, 'file-changes.json'), JSON.stringify(changes, null, 2) + '\n');
const section = (name, files) => `## ${name}（${files.length}）\n\n${files.map(file => `- ${file}`).join('\n') || '无。'}\n`;
await writeFile(path.join(evidence, 'file-changes.md'), '# 本轮文件变更\n\n' + section('新增', added) + '\n' + section('修改', changes.modified) + '\n' + section('删除', deleted));
console.log(JSON.stringify({ protected: result.unchangedProtected, original: result.originalFiles, modified: modified.length, added: added.length,
  deleted: deleted.length, codeFiles: result.codeFiles, maxCodeLines: result.maxCodeLines }));
