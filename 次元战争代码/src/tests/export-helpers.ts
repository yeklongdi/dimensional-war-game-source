import type { Act, ChoiceNode, Scene, StoryNode } from '../content/types.js';

export function sceneOf(act: Act, id: string): Scene {
  const scene = act.scenes.find(item => item.id === id);
  if (!scene) throw new Error(`缺少场景 ${id}`);
  return scene;
}

export function choiceOf(scene: Scene): ChoiceNode {
  const choice = scene.nodes.find(node => node.kind === 'choice');
  if (!choice) throw new Error(`场景 ${scene.id} 没有选择节点`);
  return choice;
}

export function* allNodes(nodes: StoryNode[]): Generator<StoryNode> {
  for (const node of nodes) {
    yield node;
    if (node.kind === 'choice') {
      for (const option of node.options) yield* allNodes(option.nodes);
    }
  }
}

export function fixture(body: string): string {
  return [
    'SCENE: outside_before', '## 第三部分：Galgame 正式脚本',
    body, '## 第四部分：分支与变量表', 'SCENE: outside_after',
  ].join('\n');
}

export function sourceScene(raw: string, id: string): string {
  const normalized = raw.replace(/\r\n/g, '\n');
  const marker = `\nSCENE: ${id.toUpperCase()}\n`;
  const start = normalized.indexOf(marker);
  if (start < 0) throw new Error(`原文缺少场景 ${id}`);
  const tail = normalized.slice(start + marker.length);
  const end = tail.search(/^### SCENE:|^## 第四部分/m);
  return end < 0 ? tail : tail.slice(0, end);
}

/** 对真实原文独立抽取文字段，校对完整文字及顺序，不依赖导出器的分词结果。 */
export function originalTextBlocks(rawScene: string) {
  const pattern = /^(STAGE|DIALOGUE|INNER|NARRATION)[:：]\n([\s\S]*?)(?=\n(?:\n|[A-Z][A-Z0-9_]*(?: \d+)?[:：])|(?![\s\S]))/gm;
  return [...rawScene.matchAll(pattern)].map(match => {
    const kind = match[1]!.toLowerCase();
    const body = match[2]!;
    const speech = /^(.*)[:：]\n([\s\S]*)$/.exec(body);
    return (kind === 'dialogue' || kind === 'inner') && speech
      ? { kind, speaker: speech[1], text: speech[2] }
      : { kind, text: body };
  });
}

export function exportedTextBlocks(scene: Scene) {
  return [...allNodes(scene.nodes)].flatMap(node => {
    if (!('text' in node)) return [];
    return [{ kind: node.kind, ...('speaker' in node ? { speaker: node.speaker } : {}), text: node.text }];
  });
}
