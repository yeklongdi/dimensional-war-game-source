"""机械尺寸整理与证据整理；不调用生图API，不绘制背景，不修改原图。"""
from pathlib import Path
from PIL import Image
import hashlib
import json

evidence = Path(__file__).resolve().parent
root = evidence.parents[3]
manifest_file = evidence / 'generation-manifest.json'
manifest = json.loads(manifest_file.read_text(encoding='utf-8'))
for asset in manifest['assets']:
    source = Path(asset['source'])
    raw = root / asset['path']
    data = raw.read_bytes()
    if hashlib.sha256(source.read_bytes()).digest() != hashlib.sha256(data).digest():
        raise RuntimeError('复制未保持原字节：' + asset['key'])
    with Image.open(raw) as image:
        image.load()
        width, height = image.size
        unit = min(width // 16, height // 9)
        target = (unit * 16, unit * 9)
        left, top = (width - target[0]) // 2, (height - target[1]) // 2
        box = [left, top, left + target[0], top + target[1]]
        selected = raw.with_name(raw.stem + '_16x9.png')
        if selected.exists():
            raise RuntimeError('裁切候选已存在，拒绝覆盖：' + str(selected))
        image.crop(box).save(selected)
        asset.update(rawSize=[width, height], rawMode=image.mode, rawSha256=hashlib.sha256(data).hexdigest(),
                     selectedPath=selected.relative_to(root).as_posix(), selectedSize=list(target),
                     selectedSha256=hashlib.sha256(selected.read_bytes()).hexdigest(), crop=box,
                     cropNote='仅裁左右各4px、上2px下3px；无拉伸、无放大、未改绘画内容。')
manifest_file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
print(json.dumps({'prepared': len(manifest['assets']), 'raw': [a['rawSize'] for a in manifest['assets']],
                  'selected': [a['selectedSize'] for a in manifest['assets']]}))
