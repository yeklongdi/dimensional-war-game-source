"""只检查虚拟主播立绘；在隔离的无头 Chrome 上下文中运行，不读写玩家存档。"""
import argparse
import json
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


LAB = r"""async () => {
  await import('/src/styles/player.css');
  const [{ PlayerView }, { emptyState }, { reduceGame, startScene }, { storyLibrary }] = await Promise.all([
    import('/src/game/ui/player-view.ts'), import('/src/game/state.ts'),
    import('/src/game/story/player.ts'), import('/src/game/story/library.ts')]);
  const root = document.querySelector('#app'), messages = [];
  let state = emptyState(), run = 2000;
  const view = new PlayerView(root, action => {
    if (action.type === 'warning' || action.type === 'asset-failed') messages.push(action);
    if (action.type === 'asset-failed') state.failedAssets[action.id] = true;
    else state = reduceGame(state, action, storyLibrary).state;
    view.render(state);
  }, () => {});
  const next = document.createElement('button'); next.id = 'vtuber-check-next'; next.textContent = '推进验收片段';
  next.style.cssText = 'position:fixed;top:4px;left:4px;z-index:100';
  next.onclick = () => {
    if (state.waiting?.kind === 'text') {
      state.waiting.revealed = Array.from(state.waiting.text).length;
      state = reduceGame(state, { type: 'advance', token: state.waiting.token }, storyLibrary).state;
      view.render(state);
    }
  };
  document.body.append(next);
  window.vtuberLab = {
    show(pose, expression, count = 1) {
      state = { ...emptyState(++run), actId: 'vtuber_bond1', sceneId: 'art_check', backgroundId: 'bg_school_library_day',
        actors: { 虚拟主播: { actor: '虚拟主播', asset: 'char_virtual_streamer_shy', visible: true, position: 'right', pose, expression } },
        waiting: { kind: 'text', textKind: 'dialogue', speaker: '虚拟主播', text: '此画面仅用于立绘检查。',
          revealed: 99, token: 'art:' + run, origin: { nodeIndex: 0 } } };
      if (count >= 2) state.actors.怪盗 = { actor: '怪盗', asset: 'char_thief_smile', visible: true, position: 'left', expression: '认真' };
      if (count >= 3) state.actors.金发青年 = { actor: '金发青年', asset: 'char_link_silent_placeholder', visible: true, position: 'center', expression: '安静' };
      view.render(state);
    },
    scene(act, scene) {
      state = startScene({ ...emptyState(++run), actId: act, sceneId: scene,
        flags: { prologue_4_complete: true } }, storyLibrary).state;
      view.render(state);
    },
    read() { return { waiting: state.waiting?.kind, actor: state.actors['虚拟主播'], messages }; }
  };
}"""

CASES = [
    ('', '默认平静', 'shy'), ('', '微笑', 'smile'), ('', '害羞、耳朵发红', 'embarrassed'),
    ('', '受惊', 'startled'), ('', '不安', 'tense'),
    ('缩在角落座位上，面前支着打开的笔记本电脑，指尖轻落键盘', '专注，安静', 'laptop-focus'),
    ('猛地一激灵，双手飞快压合笔记本电脑盖子，连人带椅往后缩贴墙壁', '受惊，慌乱戒备', 'laptop-guard'),
    ('单手抬起电脑一角抽出旧书，双手捧着推过桌面', '慌张掩饰，急切', 'book-offer'),
    ('望着门口方向抬起半只手，小声提醒', '慢半拍回神，焦急小声', 'reminder'),
    ('趴在坑边、即将失去意识', '恐惧', 'pit-collapse'), ('昏迷', '恐惧', 'unconscious'),
    ('躺在病床上，逐渐醒来', '疲惫，疑惑', 'bed-awake'),
]


def boot(context, origin):
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
    page.route('**/__vtuber-art-check__', lambda route: route.fulfill(content_type='text/html', body=
               '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">'
               '<link rel="icon" href="data:,"></head><body><div id="app"></div></body></html>'))
    page.goto(origin.rstrip('/') + '/__vtuber-art-check__')
    page.evaluate(LAB)
    return page, errors


def sprite(page, suffix):
    portrait = page.locator('.portrait[data-actor="虚拟主播"]')
    expect(portrait).to_have_attribute('data-visual', 'static')
    image = portrait.locator('img.portrait-image')
    expect(image).to_have_attribute('src', suffix)
    page.wait_for_function("() => [...document.querySelectorAll('.portrait img')].every(i => i.complete && i.naturalWidth > 0)")
    return portrait


def shot(page, output, name):
    page.wait_for_function("() => [...document.querySelectorAll('.portrait[data-displayed=\"true\"]')].every(p => !p.hidden && Number(getComputedStyle(p).opacity) >= .99)")
    page.locator('#vtuber-check-next').evaluate("el => el.style.visibility = 'hidden'")
    page.screenshot(path=output / (name + '.png'), animations='disabled')
    page.locator('#vtuber-check-next').evaluate("el => el.style.visibility = ''")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--origin', default='http://127.0.0.1:5174')
    parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[2] / '游戏说明/工程/verification/vtuber-v1/runtime')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel='chrome', headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page, errors = boot(context, args.origin)
        for pose, expression, name in CASES:
            page.evaluate('([p,e]) => vtuberLab.show(p,e)', [pose, expression])
            portrait = sprite(page, '/assets/portraits/vtuber-v1/vtuber-' + name + '.png')
            head = float(portrait.get_attribute('data-head-height'))
            assert 130 <= head <= 150, (name, head)
            assert float(portrait.get_attribute('data-safe-width')) <= 340
            results.append({'case': name, 'visual': 'static', 'headHeight': head})
            if name in ['shy', 'pit-collapse', 'unconscious', 'bed-awake']:
                shot(page, args.output, name)
        scales = []
        for count in [1, 2, 3]:
            page.evaluate('n => vtuberLab.show("", "默认平静", n)', count)
            portrait = sprite(page, '/assets/portraits/vtuber-v1/vtuber-shy.png')
            expect(page.locator('.portrait[data-displayed="true"]')).to_have_count(count)
            scales.append(portrait.get_attribute('data-scale'))
        assert len(set(scales)) == 1
        shot(page, args.output, 'three-people')
        page.evaluate('() => vtuberLab.scene("vtuber_bond1", "v101")')
        seen = []
        for _ in range(140):
            state = page.evaluate('() => vtuberLab.read()')
            if state.get('waiting') != 'text':
                break
            if (state.get('actor') or {}).get('visible'):
                portrait = page.locator('.portrait[data-actor="虚拟主播"]')
                expect(portrait).to_have_attribute('data-visual', 'static')
                page.wait_for_function("() => !document.querySelector('.scene-loading:not([hidden])')")
                src = portrait.locator('img.portrait-image').get_attribute('src')
                name = src.split('/')[-1]
                if name not in seen:
                    seen.append(name)
                    shot(page, args.output, 'v101-' + name.removesuffix('.png'))
            page.locator('#vtuber-check-next').click()
        assert seen == ['vtuber-laptop-focus.png', 'vtuber-laptop-guard.png', 'vtuber-book-offer.png', 'vtuber-reminder.png'], seen
        assert not errors, errors
        assert not [m for m in page.evaluate('() => vtuberLab.read().messages') if m['type'] == 'asset-failed']
        context.close()
        failed_context = browser.new_context(viewport={'width': 1280, 'height': 720})
        failed_context.route('**/vtuber-shy.png', lambda route: route.abort())
        failed_page, _ = boot(failed_context, args.origin)
        failed_page.evaluate('() => vtuberLab.show("", "默认平静")')
        failed = failed_page.locator('.portrait[data-actor="虚拟主播"]')
        expect(failed).to_have_attribute('data-visual', 'placeholder')
        expect(failed).to_contain_text('立绘占位')
        shot(failed_page, args.output, 'missing-image-placeholder')
        failed_context.close()
        browser.close()
    report = {'assets': results, 'storySequence': seen, 'oneTwoThreeSameScale': scales[0],
              'missingImageFallback': 'explicit_placeholder', 'consoleErrors': errors, 'savedGameUsed': False}
    (args.output / 'browser-checks.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(json.dumps({'立绘显示': len(results), 'V101动作切换': len(seen), '多人尺度': '通过', '缺图占位': '通过', '控制台错误': len(errors)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
