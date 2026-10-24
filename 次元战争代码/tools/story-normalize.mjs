export function* walkNodes(nodes) {
  for (const node of nodes) {
    yield node;
    if (node.kind === 'choice') {
      for (const option of node.options) yield* walkNodes(option.nodes);
    }
  }
}

export function normalizeChoices(act, locations, collector) {
  const scenes = new Map(act.scenes.map(scene => [scene.id, scene]));
  for (const scene of act.scenes) {
    for (let index = 0; index + 1 < scene.nodes.length; index++) {
      const choice = scene.nodes[index];
      const jump = scene.nodes[index + 1];
      if (choice.kind !== 'choice' || choice.options.length || jump.kind !== 'jump') continue;
      const destination = scenes.get(jump.target);
      const target = destination?.nodes.find(node => node.kind === 'choice' && !node.prompt && node.options.length);
      if (!target) continue;
      target.prompt = choice.prompt;
      if (choice.meta) target.meta = true;
      scene.nodes.splice(index, 1);
      index--;
    }
  }
  for (const scene of act.scenes) {
    for (const node of walkNodes(scene.nodes)) {
      const token = locations.get(node);
      if (node.kind === 'choice' && (!node.prompt || !node.options.length)) {
        collector.add(scene.id, token, 'missing_prompt', '选择节点缺少提示语或选项；保留原文，等待确认。');
      }
      if (node.kind === 'jump' && !scenes.has(node.target)) {
        collector.add(scene.id, token, 'unresolved_jump', `找不到跳转目标 ${node.target}；未补写场景。`);
      }
    }
  }
}
