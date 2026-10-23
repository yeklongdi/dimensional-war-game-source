import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

// 本轮相对开工快照核对；不运行导出器，不覆盖任何历史验收。
const root = path.resolve(import.meta.dirname, '..');
const evidence = path.join(root, 'docs/verification/hero-visual-samples');
const before = JSON.parse(fs.readFileSync(path.join(evidence, 'before.json'), 'utf8'));
const allowed = new Set([
  'README.md', 'docs/01-任务书.md', 'docs/decisions.md', 'docs/dialogue-presentation-spec.md',
  'docs/senrenbanka-presentation-study.md', 'src/game/visual/hero.ts', 'src/game/visual/resolve.ts',
  'src/tests/visual-rules.test.ts', 'src/tests/visual-loading.test.ts', 'src/tests/visual-refresh.test.ts',
  'src/tests/fixtures/portrait-browser.ts', 'tools/audit-hero-presentation.mjs',
]);
const hash = file => fs.existsSync(file) ? createHash('sha256').update(fs.readFileSync(file)).digest('hex') : null;
const rows = before.files.map(file => {
  const actual = hash(path.join(root, file.path));
  return { path: file.path, before: file.sha256, after: actual, protected: !allowed.has(file.path), unchanged: actual === file.sha256 };
});
const unexpected = rows.filter(row => row.protected && !row.unchanged);
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const snapshot = { headBefore: before.head, headAfter: head, unchangedHead: head === before.head,
  baselineFiles: rows.length, protectedFiles: rows.filter(row => row.protected).length,
  unexpected, files: rows,
  authorizedExternal: { ...before.external, after: hash(before.external.path),
    changed: hash(before.external.path) !== before.external.sha256 },
};
fs.writeFileSync(path.join(evidence, 'after.json'), JSON.stringify(snapshot, null, 2) + '\n');

const walk = (directory, relative = '') => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  if (!relative && ['.git', 'node_modules', 'dist', '.sites-deploy', '.github-pages-deploy'].includes(entry.name)) return [];
  if (entry.name === '__pycache__') return [];
  const name = relative ? `${relative}/${entry.name}` : entry.name, full = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(full, name) : entry.isFile() ? [name] : [];
});
for (const name of ['file-changes.json', 'file-changes.md']) {
  const destination = path.join(evidence, name);
  if (!fs.existsSync(destination)) fs.writeFileSync(destination, '');
}
const files = walk(root).sort(), prior = new Set(before.files.map(file => file.path));
const added = files.filter(file => !prior.has(file));
const modified = rows.filter(row => !row.unchanged && row.after !== null).map(row => row.path);
const deleted = rows.filter(row => row.after === null).map(row => row.path);
const changes = { basis: '本阶段开工前before.json，包含上轮未提交成果；不把git全部脏文件计作本轮新增',
  excludes: ['.git/', 'node_modules/', 'dist/（本轮构建产物另列）', '.sites-deploy/', '.github-pages-deploy/', '__pycache__/'],
  counts: { added: added.length, modified: modified.length, deleted: deleted.length }, added, modified, deleted,
  externalModified: snapshot.authorizedExternal.changed ? [before.external.path] : [] };
fs.writeFileSync(path.join(evidence, 'file-changes.json'), JSON.stringify(changes, null, 2) + '\n');
const md = ['# 本阶段逐文件变更', '', changes.basis, '',
  `工程新增${added.length}、修改${modified.length}、删除${deleted.length}；工程外仅修改用户指定策划说明1份。`, '',
  '排除.git、node_modules、dist、两个历史发布工作目录与Python缓存；dist是本轮两次Vite构建的派生产物，不作为源码或受保护内容。历史发布目录没有被本轮操作。', ''];
for (const [title, list] of [['修改', modified], ['新增', added], ['删除', deleted], ['授权工程外修改', changes.externalModified]]) {
  md.push(`## ${title}`, '', ...(list.length ? list.map(file => `- ${file}`) : ['无。']), '');
}
fs.writeFileSync(path.join(evidence, 'file-changes.md'), md.join('\n'));

const code = files.filter(file => /\.(ts|mjs|py)$/.test(file) && (file.startsWith('src/') || file.startsWith('tools/')));
const longFiles = code.flatMap(file => {
  const lines = fs.readFileSync(path.join(root, file), 'utf8').trimEnd().split(/\r?\n/).length;
  return lines > 400 ? [{ file, lines }] : [];
});
console.log(JSON.stringify({ baseline: rows.length, protected: snapshot.protectedFiles, unexpected,
  headUnchanged: snapshot.unchangedHead, changes: changes.counts, externalModified: changes.externalModified,
  codeFilesOver400: longFiles }, null, 2));
if (unexpected.length || !snapshot.unchangedHead || longFiles.length || deleted.length) process.exitCode = 1;
