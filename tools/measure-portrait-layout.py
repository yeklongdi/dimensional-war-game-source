"""只读运行素材，核对窗上实心轮廓；不加工或覆盖任何PNG。"""
import json
import math
import re
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
source = (root / 'src/game/visual/portrait-metrics.ts').read_text(encoding='utf-8')
metrics = {name: {'group': group, 'headTopSource': float(top), 'scale': float(scale)}
           for name, group, top, bottom, scale in re.findall(
               r"(\w+): metric\('([^']+)', \[(\d+), (\d+)\], ([.\d]+),", source)}

def measure(image, metric, label):
    scale = metric['scale']
    top = 210 - metric['headTopSource'] * scale
    stop = min(image.height, math.ceil((540 - top) / scale))
    # 低透明光晕不冒充实心轮廓；具体观感仍须结合正式截图人工复核。
    alpha = image.getchannel('A').crop((0, 0, image.width, stop)).point(lambda a: 255 if a >= 128 else 0)
    box = alpha.getbbox()
    return {'asset': label, **metric, 'windowAlpha128Box': box,
            'windowOpaqueWidth': round((box[2] - box[0]) * scale, 2) if box else 0}

results = []
for folder in ['prologue-v2', 'hero-half-v1']:
    for file in sorted((root / 'public/assets/portraits' / folder).glob('*.png')):
        name = file.stem
        key = next((value for prefix, value in [
            ('hero-half-bed', 'bed'), ('hero-half', 'half'), ('hero-seated', 'seated'), ('hero-sword', 'sword'),
            ('thief-unmasked', 'unmasked'), ('thief-action', 'masked'), ('thief-daily', 'daily'),
            ('link-', 'link'), ('saber-', 'saber'), ('deoxys-', 'creature')] if name.startswith(prefix)), None)
        if key:
            results.append(measure(Image.open(file).convert('RGBA'), metrics[key], str(file.relative_to(root))))

folder = root / 'public/assets/portraits/hero-layered-v3'
for pose in ['stand', 'luggage', 'prepare']:
    for angle in ([0, 7] if pose == 'prepare' else [0]):
        canvas = Image.new('RGBA', (1024, 1536))
        names = [f'body-{pose}'] + (['luggage-grip'] if pose == 'luggage' else [])
        if pose == 'prepare':
            names += ['arm-left-prepare', 'arm-right-prepare']
        names += ['head', 'eyes-puzzled' if pose == 'prepare' else 'eyes-calm', 'mouth-calm', 'hair-front']
        for name in names:
            layer = Image.open(folder / f'{name}.png').convert('RGBA')
            if angle and name.startswith('arm-'):
                pivot = (350, 405) if 'left' in name else (633, 410)
                layer = layer.rotate(angle if 'left' in name else -angle, center=pivot)
            canvas.alpha_composite(layer)
        results.append(measure(canvas, metrics['layered'], f'layered/{pose}/{angle}deg'))

out = root / 'docs/verification/portrait-layout/opaque-bounds.json'
out.write_text(json.dumps({'threshold': 128, 'textWindowTop': 540, 'measurements': results,
                           'over340': [r for r in results if r['windowOpaqueWidth'] > 340]}, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'measured': len(results), 'maxWindowOpaqueWidth': max(r['windowOpaqueWidth'] for r in results),
                  'over340': [r['asset'] for r in results if r['windowOpaqueWidth'] > 340]}))
