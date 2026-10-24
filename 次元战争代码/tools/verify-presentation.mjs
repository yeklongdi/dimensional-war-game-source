import fs from './evidence-files.mjs';
import path from './project-paths.mjs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const proof = path.join(root, 'docs/verification/dialogue-presentation');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8').replace(/^\uFEFF/, ''));
const save = (name, value) => fs.writeFileSync(path.join(proof, name), JSON.stringify(value, null, 2) + '\n');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex').toUpperCase();
const allowed = new Set(['README.md', 'docs/01-任务书.md', 'docs/decisions.md', 'src/game/ui/player-view.ts', 'src/game/ui/portraits.ts', 'src/styles/player.css']);
const before = read('docs/verification/dialogue-presentation/before.json');
const protectedFiles = before.files.filter(file => !allowed.has(file.path)).map(file => ({
  path: file.path, before: file.sha256, after: fs.existsSync(path.join(root, file.path)) ? sha(file.path) : null,
}));
const changedProtected = protectedFiles.filter(file => file.before !== file.after);
const categories = {
  source: protectedFiles.filter(file => file.path.startsWith('source/')).length,
  storyJson: protectedFiles.filter(file => /^src\/content\/(?:prologue|act1|index)\.json$/.test(file.path)).length,
  oldTests: protectedFiles.filter(file => /^src\/tests\/.*\.test\.ts$/.test(file.path)).length,
};
save('protected-after.json', { checked: protectedFiles.length, categories, changed: changedProtected, files: protectedFiles });
if (changedProtected.length || categories.source !== 4 || categories.storyJson !== 3 || categories.oldTests !== 20) throw new Error('保护文件核对失败');

const history = read('docs/verification/movement-preview/full-route-with-return.json').texts;
const current = read('docs/verification/dialogue-presentation/browser-mainline-final.json');
const supplement = read('docs/verification/dialogue-presentation/browser-a003-supplement.json');
const extra = { scene: supplement.stage.sceneId, node: supplement.stage.nodeIndex, text: supplement.text };
const equal = (a, b) => a && b && a.scene === b.scene && String(a.node) === String(b.node) && a.text === b.text;
let position = 0, usedSupplement = false;
const body = history.map((expected, index) => {
  const actual = current.texts[position];
  if (equal(expected, actual)) { ++position; return { index, scene: expected.scene, node: expected.node, match: true, source: 'browser-mainline-final.json' }; }
  if (!usedSupplement && equal(expected, extra)) { usedSupplement = true; return { index, scene: extra.scene, node: extra.node, match: true, source: 'browser-a003-supplement.json' }; }
  return { index, scene: expected.scene, node: expected.node, match: false, expected, actual };
});
const forbidden = current.texts.filter(item => /【待确认】|【不可执行】|\[变量名待定\]|CHECK|镜头/.test(item.text));
const logs = read('docs/verification/m3/rule-replays.json');
const combatComparison = current.battles.map(battle => {
  const expected = logs[battle.battle === 'prologue' ? 'inspiration0' : 'shadow0'];
  const actualLines = battle.log.split(/\r?\n/).filter(line => line.trim() && !line.startsWith('教学：'));
  const expectedLines = expected.displayLog.filter(line => !line.startsWith('教学：'));
  return { battle: battle.battle, round: Number(battle.state.round), rngDraws: Number(battle.state.rngDraws),
    equalCombatLog: JSON.stringify(actualLines) === JSON.stringify(expectedLines), note: '仅排除已由移动规划改过文案的教学行，未排除骰子、AI、伤害或移动日志。' };
});
const scenes = new Set(current.texts.map(item => item.scene));
for (const check of current.checks) if (check.data?.stage?.sceneId) scenes.add(check.data.stage.sceneId);
save('body-comparison.json', { expected: history.length, mainRun: current.texts.length, supplemental: Number(usedSupplement),
  matched: body.filter(item => item.match).length, extraMainRecords: current.texts.length - position, scenes: [...scenes], sceneCount: scenes.size,
  forbidden, combatComparison, records: body,
  recordingGap: '主线160条自动留痕少记a003:6；另起隔离新档，正常通关前三关并进入第四关，停在该节点等待逐字完成后补录。没有用原文填充浏览器记录。' });
if (body.some(item => !item.match) || position !== current.texts.length || forbidden.length || scenes.size !== 25 || combatComparison.some(item => !item.equalCombatLog)) throw new Error('正文／战斗浏览器记录核对失败');

const list = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
for (const name of ['file-changes.json', 'file-changes.md']) if (!fs.existsSync(path.join(proof, name))) fs.writeFileSync(path.join(proof, name), '');
const changes = { added: list(['ls-files', '--others', '--exclude-standard', '-z']), modified: list(['diff', '--name-only', '-z', 'HEAD']),
  deleted: list(['diff', '--name-only', '--diff-filter=D', '-z', 'HEAD']),
  externalAdded: ['E:/笔记/次元战争设定/游戏机制/对话与动态立绘.md'],
  build: 'dist由Vite重建，仍被Git忽略；生产HTML不含开发验收页。未提交、推送或部署。' };
save('file-changes.json', changes);
const md = ['# 本轮逐文件变更', '', '从开工干净工作区比较；未提交、推送或部署。下表不将Vite中间产物当成源码删除。', '', '| 类型 | 文件 |', '|---|---|',
  ...changes.added.map(file => `| 新增 | ${file} |`), ...changes.modified.map(file => `| 修改 | ${file} |`),
  ...changes.deleted.map(file => `| 删除 | ${file} |`), ...changes.externalAdded.map(file => `| 工程外授权新增 | ${file} |`), '',
  `工程内新增${changes.added.length}、修改${changes.modified.length}、删除${changes.deleted.length}；另授权新增工程外策划1份。`, '', changes.build, ''];
fs.writeFileSync(path.join(proof, 'file-changes.md'), md.join('\n'));
console.log(JSON.stringify({ protected: protectedFiles.length, categories, bodyMatched: body.filter(item => item.match).length,
  scenes: scenes.size, combatComparison, files: { added: changes.added.length, modified: changes.modified.length, deleted: changes.deleted.length, externalAdded: 1 } }, null, 2));
