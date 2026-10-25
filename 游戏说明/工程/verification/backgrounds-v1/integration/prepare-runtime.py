"""仅复制内置工具的真实输出、等比小幅裁边并编码WebP；无生图或网络调用。"""
from pathlib import Path
from PIL import Image, ImageChops
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parents[5]
EVIDENCE = Path(__file__).resolve().parent
ART = ROOT / '次元战争代码/art/backgrounds/galgame-v1'
PUBLIC = ROOT / '次元战争代码/public/assets/backgrounds/galgame-v1'
PUBLIC.mkdir(parents=True, exist_ok=True)
manifest_path = EVIDENCE / 'assets.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
generated_path = EVIDENCE / 'generated.json'
if generated_path.exists():
    known = {a['key'] for a in manifest['assets']}
    for asset in json.loads(generated_path.read_text(encoding='utf-8'))['assets']:
        if asset['key'] not in known:
            manifest['assets'].append(asset)
            known.add(asset['key'])


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


for asset in manifest['assets']:
    key = asset['key']
    if asset.get('approval') == 'user-approved':
        raw = ROOT / asset['rawPath']
        selected = ROOT / asset['selectedPath']
        if sha(selected) != asset['approvedSha256']:
            raise RuntimeError(f'批准样张原件变化：{key}')
    else:
        raw = ART / f'{key}_master_v001.png'
        source = Path(asset['toolOutput'])
        if not raw.exists():
            shutil.copyfile(source, raw)
        elif sha(raw) != sha(source):
            raise RuntimeError(f'禁止覆盖已有母版：{key}')
        selected = ART / f'{key}_master_v001_16x9.png'
        with Image.open(raw) as image:
            image.load()
            w, h = image.size
            unit = min(w // 16, h // 9)
            target_w, target_h = unit * 16, unit * 9
            if (w - target_w) / w > .025 or (h - target_h) / h > .025:
                raise RuntimeError(f'需要人工确认较大裁切，不能自动处理：{key} {image.size}')
            x, y = (w - target_w) // 2, (h - target_h) // 2
            cropped = image.crop((x, y, x + target_w, y + target_h)).convert('RGB')
            if not selected.exists():
                cropped.save(selected)
            else:
                with Image.open(selected) as old:
                    if old.size != cropped.size or ImageChops.difference(old.convert('RGB'), cropped).getbbox():
                        raise RuntimeError(f'禁止覆盖已有裁切：{key}')
        asset['crop'] = [x, y, x + target_w, y + target_h]
        asset['rawPath'] = raw.relative_to(ROOT).as_posix()
        asset['selectedPath'] = selected.relative_to(ROOT).as_posix()
    runtime = PUBLIC / f'{key}_v1.webp'
    with Image.open(selected) as image:
        image.load()
        if image.width * 9 != image.height * 16:
            raise RuntimeError(f'不是16:9：{key}')
        if not runtime.exists():
            image.convert('RGB').save(runtime, 'WEBP', quality=92, method=6)
    with Image.open(raw) as image:
        asset['rawSize'] = list(image.size)
    with Image.open(runtime) as image:
        image.load()
        asset['runtimeSize'] = list(image.size)
    asset['rawSha256'] = sha(raw)
    asset['selectedSha256'] = sha(selected)
    asset['runtimePath'] = runtime.relative_to(ROOT).as_posix()
    asset['runtimeUrl'] = '/assets/backgrounds/galgame-v1/' + runtime.name
    asset['runtimeSha256'] = sha(runtime)
    asset['runtimeBytes'] = runtime.stat().st_size
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'uniqueImages': len(manifest['assets']),
                  'totalBytes': sum(a['runtimeBytes'] for a in manifest['assets']),
                  'overOneMiB': [a['key'] for a in manifest['assets'] if a['runtimeBytes'] > 1048576]}))
