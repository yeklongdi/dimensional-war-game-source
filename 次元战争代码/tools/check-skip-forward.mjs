import { readFileSync, writeFileSync, existsSync, readdirSync } from './evidence-files.mjs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from './project-paths.mjs';
const dir = 'docs/verification/skip-forward';
const before = JSON.parse(readFileSync(`${dir}/before.json`, 'utf8'));
const allowed = new Set(['AGENTS.md', 'README.md', 'docs/01-任务书.md', 'docs/decisions.md', 'docs/prologue-v2-spec.md',
  'src/game/campaign.ts', 'src/game/controller.ts', 'src/game/router.ts', 'src/game/runtime.ts', 'src/game/save-format.ts',
  'src/game/save-v2.ts', 'src/game/state.ts', 'src/game/story/chapter-policy.ts', 'src/game/story/player.ts',
  'src/game/system-types.ts', 'src/game/ui/app-chrome.ts', 'src/game/ui/system-view.ts', 'src/styles/system.css']);
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const protectedFiles = before.files.filter(f => !allowed.has(f.path));
const violations = protectedFiles.filter(f => !existsSync(f.path) || hash(f.path) !== f.sha256);
const list = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const prior = new Map(before.files.map(f => [f.path, f.sha256]));
const files = list.filter(f => !f.startsWith(`${dir}/`)).map(file => ({ path: file, sha256: hash(file) }));
const changes = { added: files.filter(f => !prior.has(f.path)).map(f => f.path),
  modified: files.filter(f => prior.has(f.path) && prior.get(f.path) !== f.sha256).map(f => f.path),
  deleted: before.files.filter(f => !existsSync(f.path)).map(f => f.path) };
const code = files.filter(f => /\.(?:ts|mjs|js|html)$/.test(f.path));
const overlong = code.filter(f => readFileSync(f.path, 'utf8').trimEnd().split(/\r?\n/).length > 400).map(f => f.path);
const any = code.filter(f => /\.ts$/.test(f.path) && /:\s*any\b|\bas\s+any\b/.test(readFileSync(f.path, 'utf8'))).map(f => f.path);
const credentials = files.filter(f => /\.(?:ts|mjs|js|json|md|yml)$/.test(f.path))
  .filter(f => /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(readFileSync(f.path, 'utf8'))).map(f => f.path);
const dist = [];
function walk(dir) { for (const e of readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name);
  if (e.isDirectory()) walk(p); else dist.push({ path: p.replaceAll('\\', '/'), sha256: hash(p) });
} }
if (existsSync('dist')) walk('dist');
const unexpectedDist = dist.filter(f => /(?:tests\/|dev-prologue|source\/|verification\/|\.md$|\.env)/.test(f.path));
writeFileSync(`${dir}/after.json`, JSON.stringify({ head: before.head, baseline: before.files.length, protected: protectedFiles.length,
  violations, overlong, any, credentials, unexpectedDist, changes, files, dist }, null, 2) + '\n');
writeFileSync(`${dir}/file-changes.md`, ['# 跳过与快进逐文件变更', '', ...Object.entries(changes).flatMap(([kind, paths]) =>
  [`## ${kind}`, '', ...paths.map(p => `- ${p}`), '']), '## 新增验收证据', '',
  ...list.filter(p => p.startsWith(`${dir}/`)).map(p => `- ${p}`), ''].join('\n'));
console.log(JSON.stringify({ protected: protectedFiles.length, violations: violations.length, overlong, any, credentials,
  added: changes.added.length, modified: changes.modified.length, deleted: changes.deleted.length, dist: dist.length, unexpectedDist }));
if (violations.length || overlong.length || any.length || credentials.length || unexpectedDist.length) process.exitCode = 1;
