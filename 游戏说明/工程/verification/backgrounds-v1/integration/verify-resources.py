"""核对静态站实际响应、WebP解码和本地产物SHA，不修改浏览器或存档。"""
from pathlib import Path
from PIL import Image
from io import BytesIO
from urllib.request import urlopen
import hashlib
import json
import sys

evidence = Path(__file__).resolve().parent
manifest = json.loads((evidence / 'assets.json').read_text(encoding='utf-8'))
base, filename = sys.argv[1:3]
results = []
for asset in manifest['assets']:
    url = base.rstrip('/') + asset['runtimeUrl']
    item = {'key': asset['key'], 'url': url}
    try:
        with urlopen(url, timeout=45) as response:
            body = response.read()
            item.update(status=response.status, contentType=response.headers.get('Content-Type'), bytes=len(body))
        digest = hashlib.sha256(body).hexdigest()
        with Image.open(BytesIO(body)) as image:
            image.load()
            item['size'] = list(image.size)
            item['format'] = image.format
        item['sha256'] = digest
        item['matches'] = digest == asset['runtimeSha256'] and item['size'] == asset['runtimeSize'] and item['format'] == 'WEBP'
    except Exception as error:
        item.update(matches=False, error=str(error))
    results.append(item)
(evidence / filename).write_text(json.dumps({'base': base, 'results': results}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'checked': len(results), 'matches': sum(r['matches'] for r in results),
                  'failed': [r['key'] for r in results if not r['matches']]}))
if not all(r['matches'] for r in results):
    sys.exit(1)
