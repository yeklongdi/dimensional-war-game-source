"""按真实生成清单登记制作结果；不修改剧情、素材或历史样张证据。"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[5]
EVIDENCE = Path(__file__).resolve().parent
manifest = json.loads((EVIDENCE / 'assets.json').read_text(encoding='utf-8'))
record = ROOT / '游戏说明/素材制作/场景背景生成记录.md'
text = record.read_text(encoding='utf-8')
heading = '## 2026-10-25 整套背景制作与正式绑定'
if heading in text:
    raise RuntimeError('本轮记录已经存在，拒绝重复追加或覆盖历史')
text = text.replace('当前三图尚未绑定、未复制到正式运行资源目录、未提交／推送／部署。',
                    '三张批准原件已经保留并转换运行副本；整套36键／34图已绑定，最新验收与发布状态见本文末本轮记录及独立验收。', 1)
lines = ['', heading, '',
    '用户已批准三样张，并授权其余33键连续制作、接入与正式发布。后来进一步要求只验证背景能否显示；浏览器验收随之收敛，不再追加玩法通关、战斗或存档专项。原样张阶段JSON、截图及哈希保持原样。', '',
    '- 覆盖：52场景记录、63条原BACKGROUND、36键；34张独立运行图，新增绘图31张，批准图3张直接保留。',
    '- 运行图：全部1664×936、精确16:9、WebP；总11605802字节（约11.07MiB），最大606824字节，均小于1MiB。原始输出保留实际尺寸，微量裁边，不拉伸、不放大。',
    '- 复用：bg_grandmother_bedroom_night → bg_grandmother_house_bedroom_night；bg_grandmother_living_room_night → bg_grandmother_house_living_room_night。其余32键各用独立图片。',
    '- 延续批准图：住宅母版建立后生成卧室昼夜、客厅夜景和门口夜归；教室上午为批准教室的光照差分；施工区白天／黄昏同结构，坑底为独立视角；饭桌、雾、循环门与破裂同空间。各类夜街独立构图。',
    '- 每项真实提示词、参考输入、工具原始路径、尺寸、SHA、适用场景与绑定键见下列逐图登记及[机器清单](../工程/verification/backgrounds-v1/integration/assets.json)。所有新增绘图使用内置image_gen.imagegen，不使用生图API／CLI脚本或原作资源。',
    '- 三批准图登记user-approved；其他31张仅记“按批准方案制作／执行窗口已自检”，不声称用户逐图批准。', '',
    '| 背景主键 | 绑定键 | 运行文件 | 字节 | 状态 |', '|---|---|---|---:|---|']
for asset in sorted(manifest['assets'], key=lambda a: a['key']):
    keys = '、'.join(asset['boundKeys'])
    file = Path(asset['runtimePath']).name
    status = '用户已批准，已绑定' if asset.get('approval') == 'user-approved' else '按批准方案制作／已自检并绑定'
    lines.append(f"| `{asset['key']}` | {keys} | `{file}` | {asset['runtimeBytes']} | {status} |")
lines += ['', '### 逐图生成、来源与SHA登记', '']
for asset in sorted(manifest['assets'], key=lambda a: a['key']):
    refs = '；'.join(asset.get('references', [])) or '无输入参考图（原三样张）'
    lines += [f"#### {asset['key']}", '',
      f"- 使用场景：{'、'.join(asset['scenes'])}。", f"- 参考图：{refs}。用途：{asset['referencePurpose']}。",
      f"- 工具：{asset['tool']}；真实输出：`{asset['toolOutput']}`。",
      f"- 母版：`{asset['rawPath']}`；尺寸：{asset['rawSize']}；SHA-256：`{asset['rawSha256']}`。",
      f"- 16:9版：`{asset['selectedPath']}`；SHA-256：`{asset['selectedSha256']}`。",
      f"- 运行副本：`{asset['runtimePath']}`；尺寸：{asset['runtimeSize']}；SHA-256：`{asset['runtimeSha256']}`。",
      f"- 状态：{asset['approval']}；正式绑定：{'、'.join(asset['boundKeys'])}。",
      '- 自检：已查看工具返回画面，检查原文环境锚点、空间和时段连续性、无人／无UI／无明显可读乱码；裁切与真实WebP解码已核验。', '',
      '<details><summary>实际完整提示词</summary>', '', '```text', asset['prompt'], '```', '', '</details>', '']
lines += ['### 接入、验收与限制', '',
    '- 正式背景绑定位于src/game/story/backgrounds.ts，经既有assetBindings处理部署base；不修改原BACKGROUND节点。',
    '- BackgroundView使用真实Image.decode；BackgroundLoader使用当前run／幕／场景／背景键的租期及当前视图缓存。切换时立即回当前渐变；失败明确诊断、同一显示实例每键一次，重建或新场景可重试。旧请求成功／失败、离开后均不可覆盖。',
    '- 仅背景层image-rendering:auto，顶部遮罩改善亮窗后HUD；人物大小、三人排位、按钮和底部180px文字窗不改。',
    '- typecheck、41文件591项测试、根路径build与正式base build通过。真实浏览器34图全部解码；正式子路径本地产物34图响应、SHA和解码一致。',
    '- 正常新档观察P001–P004；七组场内切换及代表场景使用独立开发预览，故障使用明确IO条件。不把这些称为完整新档九关或实打两战。用户缩减验收后不再追加其他玩法验证。',
    '- A003正文走廊／地下、A011场内到坑底、关灯、剑发光与临时被褥等无显式BACKGROUND的镜头仍未补切，不执行CAMERA/meta或对白关键词猜镜头。四个未完成分支仍未开放，仅复用教室素材。',
    '- 完整实际验收、截图、保护哈希、发布回执和文件清单见[独立验收](../工程/backgrounds-v1-verification.md)；正式发布仅以该记录的真实回执为准。', '']
record.write_text(text.rstrip() + '\n' + '\n'.join(lines), encoding='utf-8')
print('record_assets', len(manifest['assets']))
