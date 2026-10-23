import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), directory = path.join(root, 'docs/verification/dialogue-refresh');
const baseline = JSON.parse(await readFile(path.join(directory, 'before.json'), 'utf8'));
const allowed = new Set(['README.md', 'docs/01-任务书.md', 'docs/decisions.md', 'docs/dialogue-presentation-spec.md', 'docs/senrenbanka-presentation-study.md',
  'src/game/ui/layered-figure.ts', 'src/game/ui/portraits.ts', 'src/game/visual/animation.ts', 'src/game/visual/loading.ts', 'src/game/visual/resolve.ts',
  'src/tests/fixtures/portrait-browser.ts', 'tools/audit-hero-presentation.mjs']);
const hash = data => createHash('sha256').update(data).digest('hex');
const protectedFiles = [], modified = [], deleted = [];
for (const entry of baseline.files) {
  let after;
  try { after = hash(await readFile(path.join(root, entry.path))); } catch { deleted.push(entry.path); continue; }
  if (allowed.has(entry.path)) { if (after !== entry.sha256) modified.push(entry.path); }
  else protectedFiles.push({ path: entry.path, before: entry.sha256, after, unchanged: after === entry.sha256 });
}
const unexpected = protectedFiles.filter(file => !file.unchanged);
if (unexpected.length || deleted.length) throw new Error(`保护失败：${JSON.stringify({ unexpected, deleted })}`);
let maxCodeLines = 0;
async function inspect(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) await inspect(file);
    else if (/\.(ts|mjs|js)$/.test(entry.name)) {
      const lines = (await readFile(file, 'utf8')).trimEnd().split('\n').length; maxCodeLines = Math.max(maxCodeLines, lines);
      if (lines > 400) throw new Error(`${path.relative(root, file)} 超过400行`);
    }
  }
}
await inspect(path.join(root, 'src')); await inspect(path.join(root, 'tools'));
const external = { ...baseline.external, after: hash(await readFile(baseline.external.path)), authorizedUpdate: true };
await writeFile(path.join(directory, 'after.json'), JSON.stringify({ baselineHead: baseline.head, unchangedProtected: protectedFiles.length,
  maxCodeLines, modified, deleted, unexpected, external, protectedFiles }, null, 2));
for (const name of ['file-changes.json', 'file-changes.md']) { try { await readFile(path.join(directory, name)); } catch { await writeFile(path.join(directory, name), ''); } }
const original = new Set(baseline.files.map(file => file.path));
const addedPaths = new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' })
  .split('\0').filter(file => file && !original.has(file)));
async function includeEvidence(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) await includeEvidence(file);
    else addedPaths.add(path.relative(root, file).replaceAll('\\', '/'));
  }
}
await includeEvidence(directory); // 包含被通用gitignore忽略、但本轮实际生成的命令日志。
const added = [...addedPaths].filter(file => !original.has(file)).sort();
const changes = { added, modified: modified.sort(), deleted, externalModified: [external.path] };
await writeFile(path.join(directory, 'file-changes.json'), JSON.stringify(changes, null, 2));
const section = (label, files) => `## ${label}（${files.length}）\n\n${files.map(file => `- ${file}`).join('\n') || '无。'}\n\n`;
await writeFile(path.join(directory, 'file-changes.md'), '# 本轮实际文件变化\n\n' + section('工程内新增', added) + section('工程内修改', changes.modified)
  + section('删除', deleted) + section('用户指定工程外说明更新', changes.externalModified));
console.log(JSON.stringify({ original: baseline.files.length, protected: protectedFiles.length, added: added.length, modified: modified.length, deleted: deleted.length, maxCodeLines }));
