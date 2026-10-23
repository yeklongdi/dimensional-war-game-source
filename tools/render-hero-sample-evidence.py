"""机械拼排实际浏览器截图；不生成或重绘人物美术。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'docs/verification/hero-visual-samples'
FONT = ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', 22)
SAMPLES = [('calm', '普通站姿／默认平静'), ('proud', '普通站姿／得意'),
           ('nervous', '行李站立／紧张期待'), ('relaxed', '行李站立／放松微笑'),
           ('puzzled', '准备伸懒腰／疑惑')]

overview = Image.new('RGB', (1280, 1200), '#101721')
pen = ImageDraw.Draw(overview)
for index, (key, title) in enumerate(SAMPLES):
    x, y = index % 2 * 640, index // 2 * 400
    pen.text((x + 16, y + 6), title, fill='#ecdca5', font=FONT)
    frame = Image.open(DEST / f'{key}-final-dark.jpg').resize((640, 360))
    overview.paste(frame, (x, y + 40))
pen.text((655, 835), '浏览器最终截图 · 本地交付', fill='#ecdca5', font=FONT)
pen.text((655, 875), '原截图与动作关键帧分别留存', fill='#b9c8da', font=FONT)
overview.save(DEST / 'five-final-samples.jpg', quality=94)

sheet = Image.new('RGB', (1160, 1170), '#e9e4dc')
pen = ImageDraw.Draw(sheet)
for col, title in enumerate(['静止', '半闭眼', '闭眼', '说话嘴']):
    pen.text((235 + col * 230, 10), title, fill='#111111', font=FONT)
for row, (key, title) in enumerate(SAMPLES):
    y = 50 + row * 220
    pen.text((8, y + 70), title.replace('／', '\n'), fill='#111111', font=FONT)
    for col, suffix in enumerate(['final-dark', 'half', 'closed', 'speech']):
        frame = Image.open(DEST / f'{key}-{suffix}.jpg')
        # 所有截图为同一1280×720逻辑画面；用相同脸部矩形裁切，不重定位五官。
        face = frame.crop((545, 125, 730, 290)).resize((222, 198))
        sheet.paste(face, (230 + col * 230, y))
sheet.save(DEST / 'five-expression-keyframes.jpg', quality=95)
print('已拼排五组合实际窗口图与眉眼／口型关键帧；原截图不改。')
