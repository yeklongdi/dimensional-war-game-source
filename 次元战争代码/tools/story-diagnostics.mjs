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
    return '用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。';
  }
  if (sceneId === 'a010' && raw.includes('【暂无线性后果】')) {
    return '任务书 §16：按新版原文进入A010_RETURN_CLASS，播放已有正文后停在未完成分支；系统提供重新选择，不执行旧版自动返回循环。';
  }
  if (sceneId === 'a011' && raw.includes('【原文只有')) return '原文已有单线强制事件；保留制作备注，不增加分支。';
  if (sceneId === 'a014' && raw.includes('【待确认】')) {
    return '任务书 §5.6 / §5.9 已规定战斗数值、胜负和重试；战斗奖励尚未规定，M0 不补写。';
  }
  if (sceneId === 'a016' && raw.includes('【待确认】')) return '任务书 §16：序幕（二）完成后返回地图并开放序幕（三）；本轮正式流程在C003未接战斗处阻断。';
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
    '# 内容问题与制作备注', '',
    '> 由导出脚本覆盖生成；人工决定请记录到 decisions.md。原文与 source/ 均不改写。', '',
    `场景：${acts.map(act => `${act.title} ${act.scenes.length}`).join(' / ')}。`, '',
    `warning 共 **${warnings.length} 条**；同一原文位置的多个类别合并计一条。`, '',
    '条目包括已由任务书确定处理方式的制作备注；“已有处理依据”不会从原文或清单中删除。', '',
    '## 优先待决事项', '',
  ];
  if (acts.some(act => act.id === 'prologue_4')) {
    lines.push('- **序幕（四）两场战斗待制作**：C003的battle_prologue4_patrol及C005的battle_prologue4_deoxys_encounter只保留调用并阻断，不能跳过或伪造胜利。分阶段目标、失败与数值仍需确认。',
      '- **人物素材覆盖（已确认范围）**：用户决定有图按图、从者据官方图参考制作，且再次确认其他占位不用改。首批18张加男高10张，共28张；已定形象84组状态有半身表情显示。完整动作缺口见art/prologue-v2/README.md及art/hero-half-v1/README.md，不自行设计无图人物外貌。',
      '- **未完成分支**：A007仅主播路线启用；A010返回班级分支播放已有文本后停止，不开放序幕（三）。新稿取代旧的自动返回选项约定。');
  }
  if (warnings.some(item => item.categories.includes('pending_call') && item.raw.includes('event_master_sword_vision'))) {
    lines.push('- **A012 幻象演出如何绑定**：`event_master_sword_vision` 与 `CG: cg_master_sword_vision_placeholder` 尚无执行约定及绑定素材；请确定沿用占位演出，还是提供对应 CG / 音效映射。已有幻象旁白完整保留。');
  }
  if (warnings.some(item => item.categories.includes('placeholder'))) {
    lines.push('- **占位素材的绑定清单**：原文仍有背景、立绘、BGM、SFX占位标记；运行绑定见工程配置，不改原文标记。缺失项按任务书§16显式占位；同学甲乙与一般学生本轮保留场外对白。');
  }
  if (warnings.some(item => item.categories.includes('variable'))) {
    lines.push('- **旧稿待定变量与重复事件如何对应**：待定SET按幕、场景、序号生成flag；A010与A014都记录地下异常调查，后续是否合为事件仍待确认。新版明确布尔SET保留原变量名和值，本轮不自行改成数值系统。');
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
