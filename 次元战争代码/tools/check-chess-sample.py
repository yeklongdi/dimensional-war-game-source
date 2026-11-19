"""专项验证棋子样例与离线预览；使用独立 Chrome 上下文，不接触玩家存档。"""

import argparse
import json
from pathlib import Path
from time import monotonic

from playwright.sync_api import expect, sync_playwright


def run(origin, output):
    output.mkdir(parents=True, exist_ok=True)
    errors, checks = [], []
    failure = None
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome", headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        context.add_init_script("""
          window.storageTouches = 0;
          for (const name of ['getItem','setItem','removeItem','clear']) {
            const original = Storage.prototype[name];
            Storage.prototype[name] = function(...args) { window.storageTouches++; return original.apply(this,args); };
          }
          const decode = HTMLImageElement.prototype.decode;
          HTMLImageElement.prototype.decode = async function() {
            if (this.src.includes('/chess-v1/')) await new Promise(resolve => setTimeout(resolve, 300));
            return decode.call(this);
          };
        """)
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
        stage = page.get_by_test_id("battle-stage")

        def click(ident):
            page.get_by_test_id(ident).click()

        def snapshot():
            return json.loads(stage.get_attribute("data-sample-snapshot"))

        def ready():
            expect(stage).to_have_attribute("data-chess-assets", "ready")
            expect(stage).to_have_attribute("data-chess-busy", "false")

        def reset(name="melee"):
            click("sample-" + name)
            ready()

        def idle():
            expect(stage).to_have_attribute("data-chess-busy", "false", timeout=10000)

        def shot(name):
            page.screenshot(path=output / (name + ".png"), animations="disabled")

        try:
            page.goto(origin + "/dev-chess.html")
            expect(page.get_by_test_id("sample-play")).to_be_disabled()
            ready()
            expect(page.get_by_test_id("sample-play")).to_be_enabled()
            checks.append("素材解码完成前禁用交战，完成后恢复操作")
            expect(stage).to_have_attribute("data-chess-visible", "hero")
            expect(stage).to_have_attribute("data-chess-selected", "hero")
            page.wait_for_function("JSON.parse(document.querySelector('#stage').dataset.chessPoses).hero.pose === 'idle'")
            shot("01-idle")
            checks.append("透明素材真实解码，默认显示当前行动者与雕塑棋子")

            before = snapshot()
            click("cell-3-2")
            expect(stage).to_have_attribute("data-chess-visible", "black_a")
            expect(stage).to_have_attribute("data-turn-id", "hero")
            expect(page.get_by_test_id("unit-black_a")).to_have_attribute("aria-pressed", "true")
            assert snapshot() == before
            shot("03-inspect-enemy")
            page.get_by_test_id("unit-black_b").press("Enter")
            expect(stage).to_have_attribute("data-chess-selected", "black_b")
            assert snapshot() == before
            checks.append("可点选敌方棋子或键盘查看资料，不改变行动权、资源或随机数")

            click("sample-play")
            expect(stage).to_have_attribute("data-chess-busy", "true")
            page.wait_for_function("document.querySelector('#stage').dataset.chessVisible.split(',').length === 3")
            expect(page.get_by_test_id("sample-end")).to_be_disabled()
            assert page.get_by_test_id("battle-actionbar").evaluate("node => node.inert")
            committed = snapshot()
            page.get_by_test_id("skill-end").evaluate("node => node.click()")
            page.get_by_test_id("mode-move").evaluate("node => node.click()")
            assert snapshot() == committed
            page.wait_for_function("JSON.parse(document.querySelector('#stage').dataset.chessPoses).black_a?.pose === 'hurt'")
            shot("02-impact")
            idle()
            expect(stage).to_have_attribute("data-chess-visible", "black_b")
            assert snapshot()["units"][0]["position"] == before["units"][0]["position"]
            assert snapshot()["units"][1]["position"] == before["units"][1]["position"]
            sounds = json.loads(stage.get_attribute("data-sample-sounds"))
            assert [sound["id"] for sound in sounds] == ["fx_select", "fx_select", "fx_punch", "fx_blade"]
            checks.append("双方交战时临时显现，演出锁拦截重复动作，结束后恢复查看对象且不改变格位")
            checks.append("选中音效与真实挥击／命中音效均按预期播放")

            reset()
            click("sample-play")
            page.wait_for_timeout(140)
            progressed = int(stage.get_attribute("data-chess-time"))
            stamp = monotonic()
            click("chess-speed")
            expect(stage).to_have_attribute("data-chess-speed", "2")
            changed = int(stage.get_attribute("data-chess-time"))
            assert changed >= progressed and changed - progressed < 250
            click("chess-speed")
            expect(stage).to_have_attribute("data-chess-speed", "4")
            after_command = snapshot()
            shot("04-speed-four")
            idle()
            assert monotonic() - stamp < 1.3
            assert snapshot() == after_command
            count = len(json.loads(stage.get_attribute("data-sample-sounds")))
            click("chess-speed")
            expect(stage).to_have_attribute("data-chess-speed", "1")
            assert len(json.loads(stage.get_attribute("data-sample-sounds"))) == count
            assert any(sound["speed"] == 4 for sound in json.loads(stage.get_attribute("data-sample-sounds")))
            checks.append("演出中切换1/2/4倍速不跳回开头、不重播，不改变结算，并同步后续音效速度")

            reset("cast")
            click("sample-play")
            page.wait_for_function("JSON.parse(document.querySelector('#stage').dataset.chessPoses).hero?.pose === 'cast'")
            shot("05-cast")
            idle()
            assert snapshot()["loop"]["hero"]["wizardSlots"] == 1
            checks.append("独立施法动作与魔法飞弹反馈接入真实法术结算")

            reset("area")
            click("sample-play")
            page.wait_for_function("document.querySelector('#stage').dataset.chessVisible.split(',').length === 3")
            page.wait_for_function("Object.values(JSON.parse(document.querySelector('#stage').dataset.chessPoses)).filter(p=>p.pose==='hurt').length === 3")
            shot("06-area")
            idle()
            events = snapshot()["log"]
            assert len([event for event in events if event["kind"] == "ability-save"]) == 3
            assert len([event for event in events if event["kind"] == "damage"]) == 3
            checks.append("范围效果同时显现全部受影响者，包含友方波及与各目标的豁免／受击")

            reset("down")
            click("sample-play")
            page.wait_for_function("JSON.parse(document.querySelector('#stage').dataset.chessPoses).black_a?.pose === 'down'")
            shot("07-falling")
            page.wait_for_function("JSON.parse(document.querySelector('#stage').dataset.chessPoses).black_a?.pose === 'down' && JSON.parse(document.querySelector('#stage').dataset.chessPoses).black_a?.frame === 3")
            expect(stage).to_have_attribute("data-chess-busy", "true")
            idle()
            expect(stage).to_have_attribute("data-chess-visible", "hero")
            shot("08-fallen-piece")
            before = snapshot()
            click("cell-3-2")
            expect(stage).to_have_attribute("data-chess-selected", "black_a")
            page.wait_for_function("JSON.parse(document.querySelector('#stage').dataset.chessPoses).black_a?.pose === 'down'")
            assert snapshot() == before
            shot("09-inspect-fallen")
            checks.append("倒地四帧结束才解锁，之后保留失能棋子，再点选可查看倒地人物")

            reset()
            click("cell-4-2")
            click("sample-end")
            expect(stage).to_have_attribute("data-turn-id", "black_a")
            expect(stage).to_have_attribute("data-chess-selected", "black_a")
            page.wait_for_function("document.querySelector('#stage').dataset.turnId === 'hero' && document.querySelector('#stage').dataset.chessBusy === 'false'", timeout=15000)
            expect(stage).to_have_attribute("data-chess-selected", "hero")
            shot("10-next-turn")
            checks.append("玩家与敌方回合自动选中行动者，AI等待上一组演出完成")

            reset()
            click("mode-move")
            click("cell-2-0")
            click("move-confirm")
            page.wait_for_function("JSON.parse(document.querySelector('#stage').dataset.sampleSnapshot).units[0].position.row === 0 && document.querySelector('#stage').dataset.chessBusy === 'false'", timeout=15000)
            shot("11-top-row")
            checks.append("移动与借机演出后继续原路径，顶行人物与样例控件保留空间")

            reset()
            click("sample-play")
            expect(stage).to_have_attribute("data-chess-busy", "true")
            reset("area")
            page.wait_for_timeout(1500)
            assert json.loads(stage.get_attribute("data-sample-sounds")) == []
            expect(stage).to_have_attribute("data-chess-busy", "false")
            checks.append("切换样例清理旧动作、特效与音效，旧演出不会回放")
            assert page.evaluate("window.storageTouches") == 0
            checks.append("样例全程未调用Storage读写接口")

            requests = []
            page.on("request", lambda request: requests.append(request.url) if request.url.startswith(("http:", "https:")) else None)
            page.set_viewport_size({"width": 728, "height": 720})
            page.goto((output / "chess-sample.html").as_uri())
            ready()
            expect(page.get_by_test_id("sample-play")).to_be_visible()
            assert page.locator(".battle-board").bounding_box()["width"] <= 728
            click("sample-play")
            page.wait_for_function("JSON.parse(document.querySelector('#stage').dataset.chessPoses).black_a?.pose === 'hurt'")
            shot("12-inline-preview")
            idle()
            assert not requests, requests
            checks.append("离线HTML在728px宽度可交互，图片与音效内嵌，无外部网络请求")

            page.set_viewport_size({"width": 1440, "height": 900})
            page.goto(origin + "/?debug=battle&seed=42")
            expect(stage).to_be_visible()
            assert stage.get_attribute("data-chess") is None
            assert page.locator(".battle-chess-people").count() == 0
            shot("13-existing-battle")
            checks.append("正式调试入口继续使用原显示方式，样例未自动替换正式战斗")
        except Exception as error:
            failure = error
            shot("failure")
        finally:
            report = {"passed": len(checks), "failed": len(errors) + int(failure is not None),
                      "checks": checks, "consoleErrors": errors, "failure": str(failure) if failure else None}
            (output / "results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
            browser.close()
    print(json.dumps({"passed": len(checks), "failed": report["failed"]}))
    if failure:
        raise failure
    assert not errors, errors


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--origin", default="http://127.0.0.1:5182")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[2] / "游戏说明/工程/verification/chess-sample")
    arguments = parser.parse_args()
    run(arguments.origin.rstrip("/"), arguments.output)
