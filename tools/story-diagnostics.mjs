const CATEGORY_LABELS = {
  placeholder: '占位素材', meta: '制作备注', variable: '变量名待定',
  check: 'CHECK（只记录）', unknown: '未知指令', missing_asset: '角色缺少素材',
  pending_call: '调用待接入', unresolved_jump: '跳转目标缺失', missing_prompt: '选项提示语缺失',
};

export function policyResolution(sceneId, token) {
  const raw = token.raw;
  if (token.key === 'CAMERA') return '任务书 §3.3：镜头说明只供制作查看。';
  if (raw.includes('[变量名待定]')) return '任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。';
  if (sceneId === 'p006' && token.key === 'CHECK') return '任务书 §4.5：失败后重试本场且保留剧情进度；M0 只保留 CHECK 原文。';
  if (sceneId === 'p006' && token.value === '战斗结果返回后，继续进入战斗结束场景。') {
    return '2026-10-18 用户确认：本句按制作备注隐藏。';
  }
  if (sceneId === 'a007' || sceneId.startsWith('a007_')) {
    return '任务书 §4.5：本切片仅启用选项 2；其他路线及 random_rd3 不执行。用户确认三个未完成场景完整保留并计入 19 场。';
  }
  if (sceneId === 'a010' && raw.includes('【暂无线性后果】')) {
    return '任务书 §4.5：M1 在选择“回班上”后单独显示此原文，再返回选项；导出仍保留 meta 和原始 JUMP。';
  }
  if (sceneId === 'a011' && raw.includes('【原文只有')) return '原文已有单线强制事件；保留制作备注，不增加分支。';
  if (sceneId === 'a014' && raw.includes('【待确认】')) {
    return '任务书 §5.6 / §5.9 已规定战斗数值、胜负和重试；战斗奖励尚未规定，M0 不补写。';
  }
  if (sceneId === 'a016' && raw.includes('【待确认】')) return '任务书 §1.1：第一幕结束后返回关卡选择，本切片到此结束。';
  return '';
}

export function createCollector(actId, sourceFile) {
  const records = new Map();
  return {
    add(sceneId, token, category, detail, resolution = '') {
      const key = `${sceneId}:${token.line}`;
      let record = records.get(key);
      if (!record) {
        record = {
          actId, sceneId, sourceFile, line: token.line, raw: token.raw,
          categories: [], details: [], resolutions: [],
        };
        records.set(key, record);
      }
      if (!record.categories.includes(category)) record.categories.push(category);
      if (detail && !record.details.includes(detail)) record.details.push(detail);
      if (resolution && !record.resolutions.includes(resolution)) record.resolutions.push(resolution);
    },
    finish() {
      return [...records.values()].sort((left, right) => left.line - right.line);
    },
  };
}

export function renderQuestions(acts, warnings) {
  const lines = [
    '# M0 内容问题与制作备注', '',
    '> 由导出脚本覆盖生成；人工决定请记录到 decisions.md。原文与 source/ 均不改写。', '',
    `场景：${acts.map(act => `${act.title} ${act.scenes.length}`).join(' / ')}。`, '',
    `warning 共 **${warnings.length} 条**；同一原文位置的多个类别合并计一条。`, '',
    '条目包括已由任务书确定处理方式的制作备注；“已有处理依据”不会从原文或清单中删除。', '',
    '## 优先待决事项', '',
  ];
  if (warnings.some(item => item.categories.includes('pending_call') && item.raw.includes('event_master_sword_vision'))) {
    lines.push('- **A012 幻象演出如何绑定**：`event_master_sword_vision` 与 `CG: cg_master_sword_vision_placeholder` 尚无执行约定及绑定素材；请确定沿用占位演出，还是提供对应 CG / 音效映射。已有幻象旁白完整保留。');
  }
  if (warnings.some(item => item.categories.includes('placeholder'))) {
    lines.push('- **占位素材的绑定清单**：背景、立绘、BGM、SFX 仍含占位标记；请确定哪些素材 id 对应现有文件。任务书已允许缺失时占位，M0 不复制媒体；同学甲、同学乙也缺少立绘声明。');
  }
  if (warnings.some(item => item.categories.includes('variable'))) {
    lines.push('- **正式变量名与重复事件如何对应**：当前 flag 按幕、场景、SET 序号生成；A010 与 A014 都有“增加男高对学校地下异常的调查进度”。请确定后续是否对应同一事件及正式命名。本切片依任务书只记录布尔值，不进行数值计算。');
  }
  for (const act of acts) {
    lines.push('', `## ${act.title}（${act.id}）`, '');
    for (const scene of act.scenes) {
      const items = warnings.filter(item => item.actId === act.id && item.sceneId === scene.id);
      if (!items.length) continue;
      lines.push(`### ${scene.id} · ${scene.title}`, '');
      for (const item of items) {
        lines.push(
          `#### ${item.sourceFile}:${item.line} · ${item.categories.map(category => CATEGORY_LABELS[category]).join(' / ')}`,
          '', ...item.details.map(detail => `- ${detail}`),
          ...item.resolutions.map(resolution => `- 已有处理依据：${resolution}`),
          '', '````text', item.raw, '````', '',
        );
      }
    }
  }
  return `${lines.join('\n').trimEnd()}\n`;
}
