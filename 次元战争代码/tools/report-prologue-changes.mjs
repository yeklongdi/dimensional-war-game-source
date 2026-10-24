import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from './project-paths.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const before = JSON.parse(await readFile(resolve(root, 'docs/verification/prologue-v2/before.json'), 'utf8'));
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
const fields = git(['diff', '--name-status', '-z', before.head]), changes = new Map();
for (let i = 0; i < fields.length; i += 2) changes.set(fields[i + 1], fields[i]);
for (const file of git(['ls-files', '--others', '--exclude-standard', '-z'])) changes.set(file, 'A');
const markdown = 'docs/prologue-v2-file-changes.md', dataFile = 'docs/verification/prologue-v2/file-changes.json';
changes.set(markdown, 'A'); changes.set(dataFile, 'A');
const groups = Object.fromEntries(['A', 'M', 'D'].map(kind => [kind, [...changes].filter(([, status]) => status === kind).map(([file]) => file).sort()]));
const data = { baseline: before.head, generated: groups.A.length, modified: groups.M.length, deleted: groups.D.length, files: groups };
const lines = ['# 四段序幕实际文件变更', '', `相对开工提交\`${before.head}\`；新增${data.generated}、修改${data.modified}、删除${data.deleted}。`,
  '', '仅列当前工程相对基线的实际成果，不含被忽略的dist／node_modules与工程外原始生成缓存。旧source、旧剧情JSON、vault和已批准男高素材未改。', ''];
for (const [kind, label] of [['A', '新增'], ['M', '修改'], ['D', '删除']]) {
  lines.push(`## ${label}（${groups[kind].length}）`, '');
  lines.push(...(groups[kind].length ? groups[kind].map(file => `- [${file}](../${file})`) : ['无。']), '');
}
await writeFile(resolve(root, markdown), `${lines.join('\n')}\n`);
await writeFile(resolve(root, dataFile), `${JSON.stringify(data, null, 2)}\n`);
console.log(`实际工程成果：新增${data.generated}、修改${data.modified}、删除${data.deleted}；完整清单 ${markdown}。`);
