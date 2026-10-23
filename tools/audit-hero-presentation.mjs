import fs from 'node:fs';
import path from 'node:path';

// 只读剧情与原文；单独生成视觉盘点，不调用／修改剧情导出器。
const root = path.resolve(import.meta.dirname, '..');
const option = process.argv.indexOf('--output');
const outputs = path.resolve(root, option >= 0 ? process.argv[option + 1] ?? 'docs/verification/dialogue-presentation' : 'docs/verification/dialogue-presentation');
const poses = new Map(), expressions = new Map(), updates = [], entries = [];
const reviewFile = path.join(root, 'art/hero-layered-v3/review.json');
const reviews = fs.existsSync(reviewFile) ? JSON.parse(fs.readFileSync(reviewFile, 'utf8')) : [];
const approvedIds = new Set(reviews.filter(item => item.approved).map(item => item.id));
const samples = [
  ['普通站姿', '默认平静', 'hero_stand_calm', '候选已生成，视觉未通过'],
  ['普通站姿', '得意', 'hero_stand_proud', '待制作'],
  ['携带行李、站立', '紧张、期待', 'hero_luggage_nervous', '待制作'],
  ['携带行李、站立', '放松、微笑', 'hero_luggage_relaxed', '待制作'],
  ['准备伸懒腰', '疑惑', 'hero_prepare_puzzled', '待制作'],
].map(([pose, expression, id, pending]) => [pose, expression, id, approvedIds.has(id) ? 'v3视觉通过，精确匹配时启用' : pending]);
for (const actId of ['prologue', 'act1']) {
  const act = JSON.parse(fs.readFileSync(path.join(root, `src/content/${actId}.json`), 'utf8'));
  const sourceFile = act.scenes[0].meta.sourceFile;
  let sceneId = '';
  const sourceLines = fs.readFileSync(path.join(root, sourceFile), 'utf8').split(/\r?\n/).flatMap((text, index) => {
    const scene = text.match(/^SCENE[:：]\s*(\w+)/);
    if (scene) sceneId = scene[1].toLowerCase();
    const match = text.match(/^(POSE|EXPRESSION)[:：]\s*男高\s*[=＝]\s*(.+)$/);
    const inline = text.match(/^SHOW[:：]\s*男高\s+expression=([^\s[]+)/);
    const found = match ? { type: match[1], description: match[2].trim() }
      : inline ? { type: 'EXPRESSION', description: inline[1] } : undefined;
    return found ? [{ sceneId, ...found, file: sourceFile, line: index + 1, raw: text }] : [];
  });
  let current = {};
  for (const scene of act.scenes) {
    const entrySample = samples.find(item => item[0] === current.pose && item[1] === current.expression);
    entries.push({ actId, sceneId: scene.id, inherited: { ...current }, recipe: entrySample?.[2] ?? null,
      visualApproved: Boolean(entrySample && approvedIds.has(entrySample[2])) });
    const scan = (nodes, branch) => nodes.forEach((node, nodeIndex) => {
      if (node.kind === 'choice') node.options.forEach(option => scan(option.nodes, `${nodeIndex}/option-${option.index}`));
      if (node.kind !== 'show' || node.actor !== '男高') return;
      current = { ...current, ...Object.fromEntries(Object.entries(node).filter(([key]) => ['asset', 'pose', 'expression', 'position'].includes(key))) };
      const sample = samples.find(item => item[0] === current.pose && item[1] === current.expression);
      const refs = sourceLines.filter(line => line.sceneId === scene.id
        && (line.type === 'POSE' ? line.description === node.pose : line.description === node.expression));
      const row = { actId, sceneId: scene.id, nodeIndex, ...(branch ? { branch } : {}), update: node.update === true,
        original: { ...(node.pose ? { pose: node.pose } : {}), ...(node.expression ? { expression: node.expression } : {}) },
        inheritedCombination: { ...current }, refs,
        recipe: sample?.[2] ?? null, status: sample?.[3] ?? '本轮范围外，静态回退', visualApproved: Boolean(sample && approvedIds.has(sample[2])),
        fallback: sample && approvedIds.has(sample[2]) ? null
          : current.asset === 'char_male_high_normal' ? 'public/assets/portraits/hero.png（通用原立绘，非该姿态完成）' : '现有素材或明确占位',
      };
      updates.push(row);
      for (const [key, registry] of [['pose', poses], ['expression', expressions]]) if (node[key]) {
        const list = registry.get(node[key]) ?? [];
        list.push({ actId, sceneId: scene.id, nodeIndex, refs: refs.filter(ref => ref.type === (key === 'pose' ? 'POSE' : 'EXPRESSION')) });
        registry.set(node[key], list);
      }
    });
    scan(scene.nodes);
  }
}
const coverage = (key, description) => {
  const matching = updates.filter(row => row.original[key] === description), done = matching.filter(row => row.visualApproved).length;
  return done ? `${done}/${matching.length}次明确更新匹配已批准组合；其余组合不冒充完成` : '未覆盖该原文组合，保留静态回退';
};
const inventory = { counts: { poses: poses.size, expressions: expressions.size, showUpdates: updates.length },
  poses: [...poses].map(([description, occurrences]) => ({ description, occurrences, status: coverage('pose', description) })),
  expressions: [...expressions].map(([description, occurrences]) => ({ description, occurrences, status: coverage('expression', description) })),
  samples: samples.map(([pose, expression, recipe, status]) => ({ pose, expression, recipe, status, visualApproved: approvedIds.has(recipe) })), updates, sceneEntries: entries };
fs.mkdirSync(outputs, { recursive: true });
fs.writeFileSync(path.join(outputs, 'hero-inventory.json'), JSON.stringify(inventory, null, 2) + '\n');
const reference = occurrences => occurrences.flatMap(item => item.refs.map(ref => `${item.sceneId}:${item.nodeIndex} · ${ref.file}:${ref.line}`)).join('<br>');
const md = ['# 男高姿态与表情盘点', '', '只读原文与剧情JSON；节点序号从0开始。所有原文表述原样登记。通用静态回退不代表对应姿态已经完成。', '',
  `核对：${poses.size}种姿态、${expressions.size}种表情、${updates.length}次SHOW／更新。`, '',
  '## 原文姿态', '', '| 描述 | 原文位置／节点 | 状态 |', '|---|---|---|',
  ...inventory.poses.map(item => `| ${item.description} | ${reference(item.occurrences)} | ${item.status} |`), '',
  '## 原文表情', '', '| 描述 | 原文位置／节点 | 状态 |', '|---|---|---|',
  ...inventory.expressions.map(item => `| ${item.description} | ${reference(item.occurrences)} | ${item.status} |`), '',
  '## 每次更新与继承后的组合', '', '| 场景／节点 | 继承姿态 | 继承表情 | 配方／回退状态 |', '|---|---|---|---|',
  ...updates.map(item => `| ${item.sceneId}:${item.nodeIndex}${item.update ? ' update' : ''} | ${item.inheritedCombination.pose} | ${item.inheritedCombination.expression} | ${item.recipe ?? '无对应分层'}；${item.status} |`), '',
  'A007继承A006的准备伸懒腰／疑惑；A010继承A009。原文没有普通站姿默认平静，普通／得意仅为开发样板组合。P003坐沙发＋得意保留静态回退。', '',
  '源行号、各场景入口的继承值、素材映射与状态见同目录hero-inventory.json。正式注册见src/game/visual/hero.ts及public/assets/portraits/hero-layered-v3/registration.json；逐组合视觉评审见art/hero-layered-v3/review.json。', ''];
fs.writeFileSync(path.join(outputs, 'hero-inventory.md'), md.join('\n'));
console.log(`男高盘点：${poses.size}姿态／${expressions.size}表情／${updates.length}次更新；未改剧情产物。`);
