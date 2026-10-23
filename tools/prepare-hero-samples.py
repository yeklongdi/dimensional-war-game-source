"""机械整理 imagegen 原画；不绘制人物，不改历史素材。完整画布及掩膜坐标可复现。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops, ImageFilter
import hashlib
import json
from functools import cache

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'public/assets/portraits/hero-layered-v3'
MASTERS = ROOT / 'art/hero-layered-v3/masters'
EVIDENCE = ROOT / 'docs/verification/hero-visual-samples'
SIZE = (1024, 1536)
records = []


@cache
def source(name):
    image = Image.open(MASTERS / name).convert('RGBA')
    assert image.size == SIZE, (name, image.size)
    # 生成器的主体不透明度为253，轮廓外光晕远低于220。
    # 只作轮廓阈值整理，不改RGB、不重绘衣服或五官。母版原字节保留。
    image.putalpha(image.getchannel('A').point(lambda alpha: 255 if alpha >= 220 else 0))
    connected = image.getchannel('A').copy()
    ImageDraw.floodfill(connected, (500, 500), 128)
    image.putalpha(connected.point(lambda alpha: 255 if alpha == 128 else 0))
    return image


def masked(image, shapes):
    mask = Image.new('L', SIZE, 0)
    draw = ImageDraw.Draw(mask)
    for shape in shapes:
        if len(shape) == 4 and isinstance(shape[0], int):
            draw.rectangle(shape, fill=255)
        else:
            draw.polygon(shape, fill=255)
    alpha = ImageChops.multiply(image.getchannel('A'), mask)
    result = Image.new('RGBA', SIZE)
    result.paste(image, (0, 0), alpha)
    return result


def save(name, image, origin, shapes):
    path = ASSETS / (name + '.png')
    clean = Image.new('RGBA', SIZE)
    clean.paste(image, (0, 0), image.getchannel('A'))
    image = clean
    image.save(path, optimize=True)
    alpha = image.getchannel('A')
    records.append({'file': path.relative_to(ROOT).as_posix(), 'source': origin,
                    'canvas': SIZE, 'cropOffset': [0, 0], 'mask': shapes,
                    'bounds': alpha.getbbox(), 'alphaValues': [i for i, count in enumerate(alpha.histogram()) if count],
                    'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    return image


def face_frames(emotion, master, speech):
    region = [(438, 192, 586, 282)]
    eyes = masked(master, region)
    save('eyes-' + emotion, eyes, emotion + ' master', region)
    # 只替换眼睑区域，眉形仍来自各自表情，眨眼不改变情绪。
    eye_shapes = [[(451, 231), (480, 239), (500, 246), (500, 262), (450, 261)],
                  [(535, 250), (560, 247), (569, 249), (569, 270), (534, 274)]]
    brows = {
        'calm': [[(438, 192), (518, 192), (518, 245), (501, 243), (445, 223), (438, 223)],
                 [(532, 214), (586, 214), (586, 241), (532, 249)]],
        'proud': [[(438, 192), (518, 192), (518, 242), (500, 240), (448, 220), (438, 221)],
                  [(532, 214), (586, 214), (586, 241), (532, 249)]],
        'nervous': [(438, 192, 518, 226), (532, 210, 586, 239)],
        'relaxed': [(438, 192, 518, 225), (532, 210, 586, 237)],
        'puzzled': [[(438, 192), (518, 192), (518, 232), (494, 229), (466, 216), (438, 219)],
                    [(532, 214), (586, 214), (586, 242), (532, 249)]],
    }[emotion]
    for phase in ['half', 'closed']:
        result = masked(blank, region)
        result.alpha_composite(masked(master, brows))
        result.alpha_composite(masked(source('blink-' + phase + '-generated.png'), eye_shapes))
        save('eyes-' + emotion + '-' + phase, result, 'blank + blink-' + phase + ' + ' + emotion + ' brows', brows + eye_shapes)
    mouth_region = [(464, 278, 542, 321)]
    save('mouth-' + emotion, masked(master, mouth_region), emotion + ' master', mouth_region)
    save('mouth-' + emotion + '-speech', masked(speech, mouth_region), emotion + ' speech', mouth_region)


calm = source('stand-calm-generated.png')
blank = source('stand-blank-generated.png')
save('body-stand', masked(calm, [(0, 328, 1023, 1535)]), 'stand-calm-generated.png', [(0, 328, 1023, 1535)])
save('head', masked(blank, [(0, 177, 1023, 338)]), 'stand-blank-generated.png', [(0, 177, 1023, 338)])
save('hair-front', masked(calm, [(0, 0, 1023, 185)]), 'stand-calm-generated.png', [(0, 0, 1023, 185)])
face_frames('calm', calm, source('calm-speech-generated.png'))
for emotion in ['proud', 'nervous', 'relaxed', 'puzzled']:
    face_frames(emotion, source(emotion + '-generated.png'), source(emotion + '-speech-generated.png'))

luggage = source('luggage-complete-generated.png')
grip_shapes = [[(143, 479), (392, 479), (530, 627), (549, 879), (120, 879)]]
grip = masked(luggage, grip_shapes)
body = masked(luggage, [(0, 328, 1023, 1535)])
cut = grip.getchannel('A').filter(ImageFilter.MinFilter(7))
body.putalpha(ImageChops.subtract(body.getchannel('A'), cut))
save('body-luggage', body, 'luggage-complete-generated.png', ['exclude left grip interior; 3px overlap; right suitcase stays attached'])
save('luggage-grip', grip, 'luggage-complete-generated.png', grip_shapes)

prepare = source('prepare-generated.png')
save('body-prepare', masked(source('prepare-torso-generated.png'), [(0, 328, 1023, 1535)]),
     'prepare-torso-generated.png', [(0, 328, 1023, 1535)])
arm_shapes = {
    'arm-left': [(165, 260), (385, 260), (385, 355), (375, 392), (366, 472), (305, 490), (225, 518), (169, 520), (160, 460)],
    'arm-right': [(575, 343), (607, 278), (732, 278), (785, 351), (831, 526), (809, 568), (760, 573), (664, 531), (611, 485), (577, 440)],
}
arm_seeds = {'arm-left': (225, 400), 'arm-right': (760, 430)}
for name, polygon in arm_shapes.items():
    part = masked(prepare, [polygon])
    component = part.getchannel('A').copy()
    assert component.getpixel(arm_seeds[name]) == 255, name
    ImageDraw.floodfill(component, arm_seeds[name], 128)
    part.putalpha(component.point(lambda alpha: 255 if alpha == 128 else 0))
    save(name + '-prepare', part, 'prepare-generated.png', [polygon, {'connectedSeed': arm_seeds[name]}])

combinations = [('stand', 'calm'), ('stand', 'proud'), ('luggage', 'nervous'),
                ('luggage', 'relaxed'), ('prepare', 'puzzled')]
face_sheet = Image.new('RGB', (1000, 600), '#e9e4dc')
for col, (pose, emotion) in enumerate(combinations):
    for row, phase in enumerate(['', '-half', '-closed']):
        combined = Image.new('RGBA', SIZE)
        names = ['body-' + pose]
        if pose == 'luggage':
            names.append('luggage-grip')
        if pose == 'prepare':
            names.extend(name + '-prepare' for name in arm_shapes)
        names.extend(['head', 'eyes-' + emotion + phase, 'mouth-' + emotion, 'hair-front'])
        for name in names:
            combined.alpha_composite(Image.open(ASSETS / (name + '.png')))
        crop = combined.crop((400, 184, 600, 384))
        face_sheet.paste(crop, (col * 200, row * 200), crop.getchannel('A'))
        if row == 0:
            for color, label in [('#f2ece1', 'light'), ('#172132', 'dark')]:
                bg = Image.new('RGBA', SIZE, color)
                bg.alpha_composite(combined)
                bg.thumbnail((512, 768))
                bg.convert('RGB').save(EVIDENCE / (emotion + '-composite-' + label + '.jpg'))
face_sheet.save(EVIDENCE / 'five-expressions-blink-sheet.png')

# 静止拼合对照：用同一画布直接合成，不作非等比缩放或独立重定位。
combined = Image.new('RGBA', SIZE)
for name in ['body-stand', 'head', 'eyes-calm', 'mouth-calm', 'hair-front']:
    combined.alpha_composite(Image.open(ASSETS / (name + '.png')))
for color, label in [('#f2ece1', 'light'), ('#172132', 'dark')]:
    bg = Image.new('RGBA', SIZE, color)
    bg.alpha_composite(combined)
    bg.thumbnail((512, 768))
    bg.convert('RGB').save(EVIDENCE / ('calm-composite-' + label + '.jpg'))
(ASSETS / 'registration.json').write_text(json.dumps({'canvas': SIZE, 'anchor': [512, 1536],
    'alphaThreshold': 220, 'layers': records}, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'layers': len(records), 'canvas': SIZE}, ensure_ascii=False))
