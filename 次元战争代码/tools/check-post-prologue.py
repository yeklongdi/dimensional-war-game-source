"""用独立 Chrome 上下文验收序幕后流程。运行需要已有的 Python Playwright。"""

import argparse
import json
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright


LEVELS = [
    "prologue_01", "prologue_02", "prologue_03", "act1_01", "act1_02",
    "act1_03", "act1_04", "prologue3_01", "prologue4_01",
]
TAIL_FLAGS = {
    "flag_prologue_completed": True, "flag_act1_completed": True, "has_master_sword": True,
    "prologue_3_complete": True, "link_summoned": True, "flag_battle_prologue4_patrol_skipped": True,
    "flag_battle_prologue4_deoxys_encounter_skipped": True,
}
SETTINGS = '{"version":1,"bgm":0,"sfx":0,"textMs":10}'
FAULTS = """
const put = Storage.prototype.setItem, remove = Storage.prototype.removeItem;
Storage.prototype.setItem = function (key, value) {
  if (this === localStorage && key === 'dw.save.v5' && window.failV5) throw new Error('验收模拟写入失败');
  return put.call(this, key, value);
};
Storage.prototype.removeItem = function (key) {
  if (this === localStorage && key === 'dw.save.v4' && window.failV4Removal) throw new Error('验收模拟清理失败');
  return remove.call(this, key);
};
"""


def click(page, test_id):
    page.get_by_test_id(test_id).click()


def snapshot(page):
    return page.evaluate("JSON.parse(localStorage.getItem('dw.save.v5')).auto.data")


def wait_saved(page):
    page.wait_for_function("['ready','saved'].includes(document.querySelector('#stage')?.dataset.saveStatus)")


def system(page, intent):
    click(page, "open-system")
    click(page, "system-" + intent)


def load_slot(page, slot=0):
    click(page, "slot-" + str(slot))
    click(page, "system-confirm")


def screenshot(page, folder, name):
    page.screenshot(path=folder / (name + ".png"), animations="disabled")


def seed_vault(page, key, scope, level, scene, flags, completed, manual=None):
    data = {
        "version": 2, "flags": flags, "completedLevelIds": completed,
        "checkpoint": {"kind": "level", "levelId": level, "sceneId": scene}, "savedAt": 1792800000000,
    }
    slot = {"revision": 1, "data": data}
    value = {
        "version": int(key[-1]), "contentVersion": scope, "activeRunId": "isolated-browser-fixture",
        "revision": 1, "auto": slot, "manual": [slot] * 6 if manual else [None] * 6,
    }
    page.evaluate("([key,value,settings]) => { localStorage.setItem(key,value); localStorage.setItem('dw.settings.v1',settings) }",
                  [key, json.dumps(value), SETTINGS])


def check_cleanup(context, origin, folder):
    page = context.new_page()
    page.add_init_script(FAULTS)
    page.goto(origin)
    seed_vault(page, "dw.save.v4", "prologue_four_parts_v1", "prologue_01", "p001", {}, [], manual=True)
    page.evaluate("localStorage.setItem('dw.save.v3','验收旧版原串')")
    original = page.evaluate("localStorage.getItem('dw.save.v4')")
    page.reload()
    click(page, "start-game")
    expect(page.get_by_test_id("system-dialog")).to_contain_text("删除旧 v4 的自动档与六个手动槽")
    screenshot(page, folder, "01-v4-confirmation")
    page.evaluate("window.failV5 = true")
    click(page, "system-confirm")
    expect(page.get_by_test_id("system-dialog")).to_contain_text("保存失败")
    assert page.evaluate("localStorage.getItem('dw.save.v4')") == original
    assert page.evaluate("localStorage.getItem('dw.save.v5')") is None
    page.evaluate("window.failV5 = false; window.failV4Removal = true")
    click(page, "system-confirm")
    expect(page.get_by_test_id("story-stage")).to_have_attribute("data-scene-id", "p001")
    wait_saved(page)
    assert page.evaluate("localStorage.getItem('dw.save.v4')") == original
    assert snapshot(page)["checkpoint"]["sceneId"] == "p001"
    system(page, "go-menu")
    click(page, "load-game")
    click(page, "system-cleanup-v4")
    page.evaluate("window.failV4Removal = false")
    click(page, "system-confirm")
    expect(page.get_by_test_id("system-dialog")).to_contain_text("旧 v4 存档已清理")
    assert page.evaluate("localStorage.getItem('dw.save.v4')") is None
    assert page.evaluate("localStorage.getItem('dw.save.v3')") == "验收旧版原串"
    assert page.evaluate("localStorage.getItem('dw.settings.v1')") == SETTINGS
    page.close()


def check_clean_start(context, origin, _folder):
    page = context.new_page()
    page.goto(origin)
    seed_vault(page, "dw.save.v4", "prologue_four_parts_v1", "prologue_01", "p001", {}, [], manual=True)
    page.reload()
    click(page, "start-game")
    click(page, "system-confirm")
    expect(page.get_by_test_id("story-stage")).to_have_attribute("data-scene-id", "p001")
    wait_saved(page)
    assert page.evaluate("localStorage.getItem('dw.save.v4')") is None
    assert snapshot(page)["checkpoint"]["sceneId"] == "p001"
    page.close()


def check_phase(page, phase, cycle=None, day=None):
    stage = page.get_by_test_id("city-map" if phase == "city" else "loop-stage")
    expect(stage).to_be_visible()
    if phase != "city":
        expect(stage).to_have_attribute("data-phase", phase)
    if cycle:
        expect(stage).to_have_attribute("data-cycle", str(cycle))
    if day:
        expect(stage).to_have_attribute("data-day", str(day))
    wait_saved(page)


def location(page, code):
    pin = page.get_by_test_id("location-" + code)
    # 键盘访问会把画面移到视口外的地点。
    pin.focus()
    pin.press("Enter")


def event(page, pin, ident):
    location(page, pin)
    click(page, "loop-event-" + ident)
    wait_saved(page)


def buy(page, ident):
    click(page, "loop-buy-" + ident)
    wait_saved(page)


def skip_day(page):
    click(page, "loop-skip")
    click(page, "loop-skip-confirm")
    wait_saved(page)


def wait_turn(page):
    page.wait_for_function("""() => {
      const state = document.querySelector('[data-testid="battle-stage"]')?.dataset;
      return state && (state.waiting === 'player' || state.waiting === 'reaction' || state.waiting === 'result');
    }""")
    stage = page.get_by_test_id("battle-stage")
    if stage.get_attribute("data-waiting") == "reaction":
        click(page, "reaction-decline")
        return wait_turn(page)
    return stage.get_attribute("data-turn-id"), stage.get_attribute("data-waiting")


def open_ability(page, ident):
    click(page, "mode-skills")
    click(page, "battle-open-abilities")
    page.get_by_test_id("battle-ability-select").select_option(ident)


def use_ability(page, ident):
    open_ability(page, ident)
    click(page, "battle-ability-use")


def end_turn(page):
    click(page, "mode-skills")
    click(page, "skill-end")


def run_battle(page, with_link, folder=None, photo=None, spell="magic_missile", potion=False, acid=False):
    click(page, "loop-deploy-link" if with_link else "loop-deploy-solo")
    for _ in range(15):
        actor, kind = wait_turn(page)
        if kind == "result":
            break
        if actor == "link":
            open_ability(page, "slaying_bow")
            if folder and photo:
                screenshot(page, folder, photo)
                photo = None
            click(page, "battle-ability-use")
        elif with_link:
            end_turn(page)
            continue
        elif potion:
            if int(page.get_by_test_id("unit-hero").get_attribute("data-hp")) >= 7:
                end_turn(page)
                continue
            use_ability(page, "healing_potion")
            potion = False
            use_ability(page, spell)
        elif acid:
            open_ability(page, "acid")
            if not page.get_by_test_id("battle-ability-use").is_enabled():
                click(page, "battle-ability-close")
                click(page, "skill-end")
                continue
            click(page, "battle-ability-use")
            acid = False
        else:
            use_ability(page, spell)
        if page.get_by_test_id("battle-continue-story").is_visible():
            break
        end_turn(page)
    click(page, "battle-continue-story")
    wait_saved(page)


def reach_deadline(page, cycle):
    for _ in range(12):
        phase = snapshot(page)["postPrologue"]["phase"]["kind"]
        if phase == "crisis":
            break
        if phase == "interlude":
            click(page, "loop-continue")
            wait_saved(page)
        else:
            skip_day(page)
    check_phase(page, "crisis", cycle, 10)
    system(page, "save")
    click(page, "system-back")
    expect(page.get_by_test_id("system-go-map")).to_be_disabled()
    click(page, "system-back")
    click(page, "loop-continue")
    check_phase(page, "deploy")


def check_parallel(page, context, origin):
    other = context.new_page()
    other.goto(origin)
    click(other, "load-game")
    load_slot(other)
    check_phase(other, "city")
    click(page, "system-reload")
    check_phase(page, "city")
    click(page, "loop-shop")
    buy(page, "healing_potion")
    expect(other.get_by_test_id("system-reload")).to_be_visible()
    assert snapshot(page)["postPrologue"]["items"]["healing_potion"] >= 2
    click(page, "loop-panel-close")
    other.close()


def check_loop(context, origin, folder):
    page = context.new_page()
    page.goto(origin + "?seed=0")
    seed_vault(page, "dw.save.v5", "post_prologue_demo_v1", "prologue4_01", "c013", TAIL_FLAGS, LEVELS[:-1])
    page.reload()
    click(page, "load-game")
    load_slot(page)
    expect(page.get_by_test_id("story-stage")).to_have_attribute("data-scene-id", "c013")
    system(page, "skip")
    check_phase(page, "intro", 1, 1)
    screenshot(page, folder, "02-c013-handoff")
    click(page, "loop-continue")
    check_phase(page, "city")
    event(page, "high_school", "school_request")
    event(page, "school_road", "job")
    click(page, "loop-shop")
    assert snapshot(page)["postPrologue"]["gold"] == 46
    screenshot(page, folder, "03-night-shop")
    for item in ("healing_potion", "missile_scroll", "acid"):
        buy(page, item)
    click(page, "loop-panel-close")
    location(page, "grandma_home")
    click(page, "loop-sync")
    check_phase(page, "interlude")
    click(page, "loop-continue")
    check_phase(page, "city", 1, 2)
    click(page, "loop-intel")
    expect(page.get_by_text("暂无新情报。")).to_be_visible()
    click(page, "loop-panel-close")

    location(page, "grandma_home")
    click(page, "loop-respec")
    page.get_by_label("选择职业").select_option("wizard")
    screenshot(page, folder, "04-class-change")
    click(page, "loop-respec-confirm")
    wait_saved(page)
    assert snapshot(page)["postPrologue"]["hero"]["classId"] == "wizard"
    event(page, "old_warehouse", "street_patrol")
    check_phase(page, "deploy")
    click(page, "loop-deploy-solo")
    for _ in range(28):
        actor, kind = wait_turn(page)
        if kind == "result":
            break
        assert actor == "hero"
        end_turn(page)
    expect(page.get_by_test_id("system-dialog")).to_contain_text("战斗失败")
    screenshot(page, folder, "05-defeat-load")
    load_slot(page)
    check_phase(page, "deploy")
    assert snapshot(page)["postPrologue"]["linkUses"] == 2
    run_battle(page, False, spell="missile_scroll", potion=True)
    assert snapshot(page)["postPrologue"]["items"]["missile_scroll"] == 0
    assert snapshot(page)["postPrologue"]["items"]["healing_potion"] == 1
    assert snapshot(page)["postPrologue"]["gold"] == 16
    check_parallel(page, context, origin)
    skip_day(page)
    check_phase(page, "city", 1, 3)
    event(page, "high_school", "school_patrol")
    run_battle(page, False, acid=True)
    assert snapshot(page)["postPrologue"]["items"]["acid"] == 0
    system(page, "save")
    click(page, "slot-1")
    expect(page.get_by_test_id("system-dialog")).to_contain_text("手动槽1已保存")
    click(page, "system-back")
    click(page, "system-back")

    reach_deadline(page, 1)
    run_battle(page, True, folder, "06-dual-battle")
    check_phase(page, "safe")
    click(page, "loop-rest-long")
    wait_saved(page)
    assert snapshot(page)["postPrologue"]["linkUses"] == 2
    screenshot(page, folder, "07-safe-point")
    click(page, "loop-continue")
    check_phase(page, "deploy")
    run_battle(page, True)
    run_battle(page, True)
    check_phase(page, "settlement", 1, 10)
    click(page, "loop-continue")
    check_phase(page, "city", 2, 1)
    reach_deadline(page, 2)
    assert "cycle_2_dawn" in snapshot(page)["postPrologue"]["interludes"]
    run_battle(page, True)
    click(page, "loop-rest-short")
    wait_saved(page)
    click(page, "loop-continue")
    check_phase(page, "deploy")
    run_battle(page, False)
    run_battle(page, True)
    check_phase(page, "settlement", 2, 10)
    click(page, "loop-continue")
    check_phase(page, "complete", 2, 10)
    screenshot(page, folder, "08-demo-complete")
    page.reload()
    click(page, "load-game")
    load_slot(page)
    check_phase(page, "complete", 2, 10)
    page.close()


def main():
    expect.set_options(timeout=18_000)
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--evidence", type=Path, required=True)
    args = parser.parse_args()
    if urlsplit(args.url).hostname not in ("127.0.0.1", "localhost", "::1"):
        parser.error("只允许隔离本机 Vite 地址。")
    args.evidence.mkdir(parents=True, exist_ok=True)
    errors = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        for validate in (check_cleanup, check_clean_start, check_loop):
            context = browser.new_context(viewport={"width": 1366, "height": 820})

            def monitor(page):
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)

            context.on("page", monitor)
            try:
                validate(context, args.url, args.evidence)
                print(validate.__name__ + " 通过", flush=True)
            finally:
                context.close()
        browser.close()
    assert not errors, errors
    print("三个独立浏览器上下文通过，控制台错误 0。")


if __name__ == "__main__":
    main()
