"""整理已生成位图和浏览器截图；不调用生图、浏览器或正式游戏控制器。"""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFont
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parents[4]
EVIDENCE = Path(__file__).resolve().parent
ART = ROOT / '次元战争代码/art/backgrounds/galgame-v1'
RECORD = ROOT / '游戏说明/素材制作/场景背景生成记录.md'
MANIFEST = json.loads((EVIDENCE / 'generation-manifest.json').read_text(encoding='utf-8-sig'))
BEFORE = json.loads((EVIDENCE / 'before.json').read_text(encoding='utf-8-sig'))
BROWSER = json.loads((EVIDENCE / 'browser-preview.json').read_text(encoding='utf-8-sig'))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def relative(path):
    return path.relative_to(ROOT).as_posix()


def link(path, label):
    return f'[{label}](<{path.as_posix()}>)'


def validate_protection():
    differences = []
    for entry in BEFORE['files']:
        path = ROOT / entry['path']
        if not path.is_file() or sha(path) != entry['sha256']:
            differences.append(entry['path'])
    if differences:
        raise RuntimeError(f'保护文件发生变化：{differences}')
    return len(BEFORE['files'])


protected_count = validate_protection()
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
if head != BEFORE['head']:
    raise RuntimeError('Git HEAD 与开工快照不同，不能宣称未提交')
if len(BROWSER['checks']) != 9 or BROWSER['errors'] or BROWSER['warnings']:
    raise RuntimeError('浏览器证据不完整或包含错误／警告')
for check in BROWSER['checks']:
    data = check['data']
    if data['size'] != {'w': 1280, 'h': 720} or any(not item['loaded'] for item in data['images']):
        raise RuntimeError('预览视口或图片加载不符合要求')
    expected = {'clean': 0, 'one': 1, 'three': 3}[check['mode']]
    if len(data['portraits']) != expected:
        raise RuntimeError('预览演员数量不符合要求')
    if expected and data['textWindow']['h'] != 180:
        raise RuntimeError('文字窗高度与现有配置不符')

image_results = []
for asset in MANIFEST['assets']:
    raw, selected = ROOT / asset['path'], ROOT / asset['selectedPath']
    with Image.open(raw) as source, Image.open(selected) as target:
        source.load()
        target.load()
        if list(source.size) != asset['rawSize'] or list(target.size) != asset['selectedSize']:
            raise RuntimeError('图片尺寸与生成清单不同')
        if target.width * 9 != target.height * 16 or target.mode != 'RGB':
            raise RuntimeError('候选不是不透明16:9图片')
        if ImageChops.difference(source.crop(tuple(asset['crop'])), target).getbbox():
            raise RuntimeError('裁切图与原件不匹配')
    if sha(raw) != asset['rawSha256'] or sha(selected) != asset['selectedSha256']:
        raise RuntimeError('图片哈希与生成清单不同')
    image_results.append({'key': asset['key'], 'decoded': True, 'opaque': True,
                          'ratio': '16:9', 'cropMatchesRaw': True,
                          'status': '候选／待用户批准'})

overview_path = EVIDENCE / 'backgrounds-v1-overview.png'
if overview_path.exists() or RECORD.exists():
    raise FileExistsError('拒绝覆盖已有总览或制作记录，请另存版本')
font_path = 'C:/Windows/Fonts/msyh.ttc'
font = ImageFont.truetype(font_path, 23)
small = ImageFont.truetype(font_path, 19)
large = ImageFont.truetype(font_path, 30)
overview = Image.new('RGB', (1920, 1290), '#101725')
draw = ImageDraw.Draw(overview)
draw.text((24, 12), '太阳市背景候选 v001 · 构图合成预览，未接入游戏', font=large, fill='#f1e4bd')
draw.text((24, 55), '每行：纯背景 / 男高单人 / 男高、女剑士、怪盗三人。统一演员仅作构图测试，不代表剧情人物关系。', font=small, fill='#c1cad9')
names = ['奶奶家门前', '白天教室', '夜间安静小巷']
modes = [('clean', '纯背景'), ('one', '男高单人'), ('three', '统一三人')]
for row, asset in enumerate(MANIFEST['assets']):
    y = 90 + row * 400
    for col, (mode, label) in enumerate(modes):
        x = col * 640
        draw.text((x + 16, y + 5), f'{names[row]} · {label}', font=font, fill='#e1e6ef')
        with Image.open(EVIDENCE / f"{asset['key']}_{mode}.png") as screenshot:
            screenshot.load()
            if screenshot.size != (1280, 720):
                raise RuntimeError('截图并非1280×720')
            overview.paste(screenshot.resize((640, 360), Image.Resampling.LANCZOS), (x, y + 40))
overview.save(overview_path)

lines = [
    '# 场景背景生成记录', '',
    '日期：2026-10-25。范围：三张代表候选及统一演员构图预览。三张均为**候选／待用户批准**；未批准、未绑定、未复制到正式运行资源目录、未提交／推送／部署。', '',
    '本记录只登记候选画面和验收事实，不把院落、教室陈设或巷道画法新增为正式剧情／地理设定。', '',
    '## 依据与工具', '',
    '- 正式剧情核对：52个场景记录、63处背景指令、36个背景键；四段序幕、九关、dw.save.v4。本轮仅只读核对。',
    '- 真正绘图工具：内置 `image_gen.imagegen`，每个资产独立生成一次；不透明背景。没有使用API、CLI、模型调用脚本或原作解包资源。',
    '- 参考用途：按用户已确认的二维手绘Galgame构图与柔和光影原则描述；未向工具提交《千恋＊万花》图像。',
    '- 三次工具输出均为1672×941。原件完整保留；另外裁为1664×936的精确16:9版：裁切框[4, 2, 1668, 938]，左／右各4px、上2px、下3px。无拉伸、无放大，裁切逐像素核验一致。',
    '- `prepare-candidates.py`仅复制与机械裁切；`finish-samples.py`仅核验和拼接已有浏览器截图，不绘制背景。', '',
    '## 候选与实际完整提示词', '',
]
for index, asset in enumerate(MANIFEST['assets']):
    lines += [
        f"### {index + 1}. {names[index]}：{asset['key']}", '',
        '状态：**候选v001／待用户批准**。', '',
        f"- 工具原始返回文件：`{asset['source']}`", 
        f"- 项目原件：{link(ROOT / asset['path'], Path(asset['path']).name)}；1672×941，RGB。",
        f"- 原件SHA-256：`{asset['rawSha256']}`。",
        f"- 精确16:9裁切：{link(ROOT / asset['selectedPath'], Path(asset['selectedPath']).name)}；1664×936，RGB。",
        f"- 裁切SHA-256：`{asset['selectedSha256']}`。",
        '- 输入参考图：无。原作参考只体现于文字描述的表现原则。', '',
        '实际完整提示词：', '', '```text', asset['prompt'], '```', '',
        '候选细节及待确认：' + ' '.join(asset['notes']), '',
    ]

lines += [
    '## 隔离浏览器预览', '',
    '- 地址：`http://127.0.0.1:43930/art/backgrounds/galgame-v1/preview.html`。仅开发服务器可用，非正式游戏截图。',
    '- 复用真实PlayerView、立绘解析、人物尺度／排位、亮度／层级及底部文字窗；预览层指定候选背景。没有挂载剧情推进、音频或存档控制器。',
    '- 单人：男高，中心640；三人：男高、女剑士、怪盗，中心256／640／1024。使用现有批准素材，固定视觉时间0；没有缩小人物来掩盖背景遮挡。',
    '- 男高：普通站姿／默认平静，原生分层；女剑士：平静；怪盗：露脸行动服。女剑士和怪盗使用当前批准静态素材。',
    '- 9张浏览器截图均为1280×720。单人／三人文字窗均为y=540、高180；全部图片已解码；控制台error=0、warning=0。',
    '- 合成图的HUD及文字窗均标明“构图合成／未接入”；住宅及教室三人仅构图压力测试，不代表新增人物在场关系。', '',
    link(overview_path, '九图对照总览'), '',
    '| 背景 | 纯背景 | 男高单人 | 统一三人 |',
    '|---|---|---|---|',
]
for name, asset in zip(names, MANIFEST['assets']):
    cells = [link(EVIDENCE / f"{asset['key']}_{mode}.png", label) for mode, label in modes]
    lines.append('| ' + ' | '.join([name, *cells]) + ' |')

lines += [
    '', '## 目视检查与仍需用户判断', '',
    '| 候选 | 实际观察 | 尚未批准的细节／问题 |',
    '|---|---|---|',
    '| 奶奶家门前 | 两层旧房、桂花树、褪色门可辨；下午暖光，没有深夜或强烈落日；三人图仍能识别树冠和二层结构。 | 生成图带小院、院门与二楼栏杆，超出正式文字已确定的最少结构。保持候选，须用户看图决定保留或重绘，不能据此落为房屋平面设定。 |',
    '| 白天教室 | 空白白板、讲台、课桌椅及侧窗光清楚；三人图仍可读白板和教室结构。 | 左窗、右门和陈设仅候选布局。原有浅色HUD叠在左上亮窗时对比偏弱；本轮未修改正式UI。 |',
    '| 夜间安静小巷 | 墙体、地面和暖色街灯可辨，仍为围合小巷，三人头部与背景有可辨轮廓。 | 远端转向与连通感不够明确，可能读作尽头；请用户判断是否需要把巷口重绘得更清楚。夜景下黑发／深色服装对比弱于白天，但未见完全丢失。 |',
    '',
    '逐张目视未见烘焙人物、尸体、敌人、乱码、可读文字、UI、水印、剑、黑色结晶、海岸、山地或神社。背景模式为RGB不透明；没有用CSS、SVG或占位图替代绘画。',
    '构图验收只覆盖静止叠放、识别性及遮挡；不代表正式接入、剧情流程、动态演出或全部36个背景完成。', '',
    '## 工程回归与保护', '',
    '- `npm run typecheck`：通过。',
    '- `npm test`：39个测试文件、569项测试通过。',
    '- `npm run build`：通过，94个模块。默认生产构建没有新增art预览入口。',
    '- 以上三项只证明工程回归未受影响，不代替美术批准。实际输出见 ' + link(EVIDENCE / 'engineering-checks.txt', '工程检查日志') + '。',
    f'- 开工快照中的{protected_count}个原有文件SHA-256全部一致；Git HEAD保持`{head}`。保留开工时已有的6项文档改动／未跟踪文件，未覆盖其内容。',
    '- 正式源码、source、三份剧情JSON、原有素材、绑定配置、导出器、自动问题清单、历史验收与存档规则未改变；backgroundBindings保持空表。本轮没有游戏接入。',
    '- 前后保护及新增文件明细：' + link(EVIDENCE / 'before.json', '开工哈希') + '、' + link(EVIDENCE / 'after.json', '交付哈希与完整文件清单') + '。', '',
    '## 本轮实际文件变更', '',
    '- 新增art文件8个：3张原始候选PNG、3张16:9裁切PNG、preview.html、preview.mjs。',
    '- 新增验收文件17个：before.json、generation-manifest.json、browser-preview.json、engineering-checks.txt、9张浏览器截图、backgrounds-v1-overview.png、prepare-candidates.py、finish-samples.py、after.json。',
    '- 新增本制作记录1个。另有开发服务器产生的本地日志dev-output.log、dev-error.log；二者当前为未跟踪文件，不属于游戏发布内容。',
    '- 本轮合计新增28个文件（26个交付文件及2个本地服务器日志）；修改0、移动0、删除0。构建产物dist为既有ignored输出，不提交；未修改既有源码。', '',
    '## 查看及停止点', '',
    '打开隔离预览地址，选背景及“纯背景／男高单人／三人”。F2可隐藏或显示预览工具。若服务器已停止，在程序目录运行`npm run dev -- --host 127.0.0.1 --port 43930 --strictPort`后访问同一路径。',
    '三张仍待用户批准。下一步只根据用户看图意见修订或推进；本轮不开展整套制作、正式绑定、提交、推送或发布。', '',
]
RECORD.write_text('\n'.join(lines), encoding='utf-8')

protected_count = validate_protection()
new_paths = [p for p in ART.rglob('*') if p.is_file()]
new_paths += [p for p in EVIDENCE.rglob('*') if p.is_file() and p.name != 'after.json']
new_paths.append(RECORD)
inventory = []
for path in sorted(new_paths):
    item = {'path': relative(path), 'sha256': sha(path), 'bytes': path.stat().st_size,
            'role': '本地服务器日志（未纳入交付）' if path.suffix == '.log' else '交付文件'}
    if path.suffix.lower() == '.png':
        with Image.open(path) as img:
            img.load()
            item['size'] = list(img.size)
    inventory.append(item)
after = {
    'head': head, 'protectedChecked': protected_count, 'protectedDifferences': [],
    'contentCounts': BEFORE['counts'], 'originalWorkspaceStatusPreserved': BEFORE['status'],
    'imageValidation': image_results,
    'browser': {'previewCount': 9, 'errors': 0, 'warnings': 0, 'viewport': [1280, 720]},
    'engineering': {'typecheck': 'passed', 'testFiles': 39, 'tests': 569, 'build': 'passed'},
    'newFiles': inventory,
    'self': 'after.json为本清单本身，不纳入自身SHA；其余交付文件逐项登记。',
    'changes': {'newDeliverableFilesIncludingThisManifest': 26, 'localServerLogs': 2,
                'modifiedExistingFiles': 0, 'moved': 0, 'deleted': 0},
    'status': '候选／待用户批准；未接入、未提交、未推送、未发布',
}
(EVIDENCE / 'after.json').write_text(json.dumps(after, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'protectedChecked': protected_count, 'differences': 0,
                  'deliverables': sum(item['role'] == '交付文件' for item in inventory) + 1,
                  'localLogs': sum(item['role'] != '交付文件' for item in inventory),
                  'overview': relative(overview_path)}, ensure_ascii=True))
