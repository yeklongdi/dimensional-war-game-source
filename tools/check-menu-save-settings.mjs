import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const directory = 'docs/verification/menu-save-settings';
const before = JSON.parse(readFileSync(`${directory}/before.json`, 'utf8'));
const allowed = new Set(['AGENTS.md', 'README.md', 'docs/01-任务书.md', 'docs/decisions.md',
  'docs/menu-save-settings-spec.md', 'docs/decisions-menu-save-settings.md', 'prompts/主菜单-多存档-设置.md',
  'src/game/audio.ts', 'src/game/campaign.ts', 'src/game/controller.ts', 'src/game/state.ts',
  'src/game/ui/app-chrome.ts', 'src/game/ui/menu-view.ts', 'src/game/ui/portraits.ts', 'src/tests/fixtures/save-browser.ts']);
const sha256 = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const protectedFiles = before.files.filter(f => !allowed.has(f.path));
const violations = protectedFiles.filter(f => !existsSync(f.path) || sha256(f.path) !== f.sha256);
const paths = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' })
  .split('\0').filter(Boolean).filter(p => !p.startsWith(`${directory}/`));
const previous = new Map(before.files.map(f => [f.path, f.sha256]));
const files = paths.map(file => ({ path: file, sha256: sha256(file) }));
const changes = { generated: files.filter(f => !previous.has(f.path)).map(f => f.path),
  modified: files.filter(f => previous.has(f.path) && previous.get(f.path) !== f.sha256).map(f => f.path),
  deleted: before.files.filter(f => !existsSync(f.path)).map(f => f.path) };
const overlong = files.filter(f => /\.(?:ts|mjs|js|html)$/.test(f.path))
  .filter(f => readFileSync(f.path, 'utf8').trimEnd().split(/\r?\n/).length > 400).map(f => f.path);
const any = files.filter(f => /\.(?:ts)$/.test(f.path) && /:\s*any\b|\bas\s+any\b/.test(readFileSync(f.path, 'utf8'))).map(f => f.path);
const secret = files.filter(f => /\.(?:ts|mjs|js|md|json|yml|html)$/.test(f.path))
  .filter(f => /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(readFileSync(f.path, 'utf8'))).map(f => f.path);
const distFiles = [];
function walk(dir) { for (const entry of readdirSync(dir, { withFileTypes: true })) {
  const file = path.join(dir, entry.name); if (entry.isDirectory()) walk(file); else distFiles.push(file.replaceAll('\\', '/'));
} }
walk('dist');
const extra = distFiles.filter(f => /(?:tests\/|source\/|verification\/|\.md$|\.env)/.test(f));
const output = { baselineHead: before.head, baselineCount: before.files.length, protectedCount: protectedFiles.length,
  protectedViolations: violations, over400Lines: overlong, anyTypes: any, credentialMatches: secret, changes,
  dist: { count: distFiles.length, unexpected: extra, index: readFileSync('dist/index.html', 'utf8'),
    files: distFiles.map(file => ({ path: file, sha256: sha256(file) })) }, files };
writeFileSync(`${directory}/after.json`, `${JSON.stringify(output, null, 2)}\n`);
const evidence = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0')
  .filter(p => p.startsWith(`${directory}/`) && !p.endsWith('.log'));
writeFileSync(`${directory}/file-changes.md`, ['# 本轮逐文件变更', '', '相对开工工作区（包含文档窗口成果）；验收目录单独列出。', '',
  ...Object.entries(changes).flatMap(([kind, values]) => [`## ${kind}`, '', ...values.map(v => `- ${v}`), '']),
  '## 新验收证据', '', ...evidence.map(v => `- ${v}`), `- ${directory}/checks.log（明确加入版本控制的命令记录）`, ''].join('\n'));
console.log(JSON.stringify({ baseline: before.files.length, protected: protectedFiles.length, violations: violations.length,
  generated: changes.generated.length, modified: changes.modified.length, deleted: changes.deleted.length, overlong, any, secret, distUnexpected: extra }));
if (violations.length || overlong.length || any.length || secret.length || extra.length) process.exitCode = 1;
