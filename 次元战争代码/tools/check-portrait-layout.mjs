import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from './evidence-files.mjs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const dir = 'docs/verification/portrait-layout';
mkdirSync(dir, { recursive: true });
const git = args => execFileSync('git', args, { encoding: 'utf8' }).trim();
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const excluded = f => f.startsWith(`${dir}/`) || /^\.(?:online\.js|probe\.mjs|shot-menu\.png)$/.test(f);
const list = () => git(['ls-files', '--cached', '--others', '--exclude-standard', '-z']).split('\0').filter(f => f && !excluded(f));
const files = () => list().map(path => ({ path, sha256: hash(path) }));
if (process.argv.includes('--before')) {
  if (existsSync(`${dir}/before.json`)) throw new Error('开工快照已存在，拒绝覆盖');
  writeFileSync(`${dir}/before.json`, JSON.stringify({ head: git(['rev-parse', 'HEAD']), status: git(['status', '--short']), files: files() }, null, 2));
  console.log('开工快照已保存');
} else {
  const before = JSON.parse(readFileSync(`${dir}/before.json`, 'utf8'));
  const current = files(), prior = new Map(before.files.map(f => [f.path, f.sha256]));
  const changed = current.filter(f => prior.has(f.path) && prior.get(f.path) !== f.sha256).map(f => f.path);
  const deleted = before.files.filter(f => !existsSync(f.path)).map(f => f.path);
  const added = current.filter(f => !prior.has(f.path)).map(f => f.path);
  const allowed = new Set(['AGENTS.md', 'README.md', 'docs/01-任务书.md', 'docs/decisions.md', 'docs/dialogue-presentation-spec.md',
    'docs/portrait-layout-spec.md', 'src/game/ui/portraits.ts', 'src/styles/player.css', 'tools/check-portrait-layout.mjs']);
  // 审计脚本先建后采集；a281953为别窗独立提交，不计本轮成果。
  const auditScript = 'tools/check-portrait-layout.mjs', handoffFile = 'docs/verification/online-polish-route.png';
  const handoffExpected = createHash('sha256').update(execFileSync('git', ['show', `a281953:${handoffFile}`], { maxBuffer: 32 * 1024 * 1024 })).digest('hex');
  const ownAdded = [...added.filter(f => f !== handoffFile), auditScript];
  const ownChanged = changed.filter(f => f !== auditScript);
  const violations = [...changed.filter(f => !allowed.has(f)), ...deleted];
  if (!existsSync(handoffFile) || hash(handoffFile) !== handoffExpected) violations.push(handoffFile);
  const code = current.filter(f => /\.(?:ts|mjs|js)$/.test(f.path));
  const overlong = code.filter(f => readFileSync(f.path, 'utf8').trimEnd().split(/\r?\n/).length > 400).map(f => f.path);
  const any = code.filter(f => /\.ts$/.test(f.path) && /:\s*any\b|\bas\s+any\b/.test(readFileSync(f.path, 'utf8'))).map(f => f.path);
  const dist = [];
  const walk = p => { for (const e of readdirSync(p, { withFileTypes: true })) {
    const f = `${p}/${e.name}`; if (e.isDirectory()) walk(f); else dist.push({ path: f, sha256: hash(f) });
  } };
  if (existsSync('dist')) walk('dist');
  const result = { head: before.head, protected: before.files.filter(f => !allowed.has(f.path)).length, violations, overlong, any,
    handoff: { commit: 'a281953', path: handoffFile, sha256: handoffExpected },
    added: ownAdded, modified: ownChanged, deleted, files: current, dist };
  writeFileSync(`${dir}/after.json`, JSON.stringify(result, null, 2));
  writeFileSync(`${dir}/file-changes.md`, ['# 小半身构图逐文件变更', '', ...Object.entries({ added: ownAdded, modified: ownChanged, deleted }).flatMap(([k, v]) =>
    [`## ${k}`, '', ...v.map(p => `- ${p}`), '']), '证据目录见同目录文件；before已记录交接时用户文档和临时文件状态。',
    '另窗a281953新增的docs/verification/online-polish-route.png原样保留，不计本轮新增。文档窗口已交付的规格、参考图和提示词另见报告。', ''].join('\n'));
  console.log(JSON.stringify({ protected: result.protected, violations, overlong, any, added: ownAdded.length, modified: ownChanged.length, deleted }));
  if (violations.length || overlong.length || any.length) process.exitCode = 1;
}
