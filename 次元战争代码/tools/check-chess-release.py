"""通过正式入口验收棋子演出。仅在独立浏览器中写入测试存档。"""

import argparse
import json
from pathlib import Path
from tempfile import TemporaryDirectory

from playwright.sync_api import expect, sync_playwright


LEVELS = [
    "prologue_01", "prologue_02", "prologue_03", "act1_01", "act1_02",
    "act1_03", "act1_04", "prologue3_01", "prologue4_01",
]
COMPLETION_FLAGS = {
    "flag_prologue_completed": True, "flag_act1_completed": True, "has_master_sword": True,
    "prologue_3_complete": True, "link_summoned": True, "prologue_4_complete": True,
    "flag_battle_prologue4_patrol_skipped": True, "flag_battle_prologue4_deoxys_encounter_skipped": True,
}


def snapshot_for_deploy(encounter="patrol", hp=7, seed=42):
    hero = {
        "classId": "wizard", "hp": hp, "tempHp": 0, "mageArmor": False, "hitDie": 1,
        "fighter": {"style": "defense", "weapon": "longsword", "mastery": ["longsword", "javelin", "shortbow"]},
        "wizard": {
            "cantrips": ["fire_bolt", "ray_of_frost", "shocking_grasp"],
            "prepared": ["magic_missile", "burning_hands", "mage_armor", "false_life"],
        },
        "sorcerer": {
            "cantrips": ["sorcerous_burst", "fire_bolt", "shocking_grasp", "acid_splash"],
            "prepared": ["magic_missile", "burning_hands"],
        },
        "wind": 2, "wizardSlots": 2, "recovery": True, "sorcererSlots": 2, "innate": 2,
    }
    loop = {
        "cycle": 0, "day": 2 if encounter == "patrol" else 10,
        "slot": "after_school" if encounter == "patrol" else "night",
        "phase": {"kind": "deploy", "encounter": encounter}, "rng": {"kind": "seeded", "seed": seed, "value": seed, "draws": 0},
        "gold": 20, "xp": 0, "sync": 0, "linkUses": 2, "divineAid": 3, "hero": hero,
        "items": {"healing_potion": 1, "missile_scroll": 0, "acid": 0}, "completed": [], "clues": [], "interludes": [],
    }
    return {"completedLevelIds": LEVELS, "flags": COMPLETION_FLAGS, "checkpoint": {"kind": "map"}, "postPrologue": loop}


class BattleBrowser:
    def __init__(self, browser, url, checkpoint, errors, seed=42):
        self.context = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        self.context.set_default_timeout(10000)
        self.page = self.context.new_page()
        self.stage = self.page.get_by_test_id("battle-stage")
        self.page.on("pageerror", lambda error: errors.append(str(error)))
        self.page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        data = {"version": 2, "savedAt": 1792800000000, **checkpoint}
        vault = {
            "version": 5, "contentVersion": "post_prologue_demo_v1", "activeRunId": "chess-release-isolated-test",
            "revision": 1, "auto": {"revision": 1, "data": data}, "manual": [None] * 6,
        }
        self.page.goto(f"{url}?seed={seed}")
        self.page.evaluate("""vault => {
          localStorage.setItem('dw.save.v5', JSON.stringify(vault));
          localStorage.setItem('dw.settings.v1', JSON.stringify({version: 1, bgm: 0, sfx: 35, textMs: 10}));
        }""", vault)
        self.page.reload()
        for button in ("load-game", "slot-0", "system-confirm"):
            self.click(button)

    def control(self, name):
        return self.page.get_by_test_id(name)

    def click(self, name):
        self.control(name).click()

    def ready(self):
        expect(self.stage).to_have_attribute("data-screen", "battle")
        expect(self.stage).to_have_attribute("data-chess-assets", "ready")
        self.idle()

    def idle(self):
        expect(self.stage).to_have_attribute("data-chess-busy", "false")

    def value(self, name):
        return self.stage.get_attribute("data-" + name)

    def shot(self, folder, name):
        self.page.screenshot(path=folder / (name + ".jpg"), quality=89, animations="disabled")


def tutorial(browser, url, errors, output):
    game = BattleBrowser(browser, url, {
        "flags": {}, "completedLevelIds": LEVELS[:1],
        "checkpoint": {"kind": "level", "levelId": "prologue_02", "sceneId": "p006"},
    }, errors, seed=42)
    if not game.stage.is_visible():
        game.click("open-system")
        game.click("system-skip")
    game.ready()
    expect(game.stage).to_have_attribute("data-battle-id", "battle_prologue_tutorial")
    expect(game.control("inspiration-dialog")).to_be_visible()
    game.click("inspiration-decline")
    game.page.wait_for_function("""() => {
      const s = document.querySelector('#stage').dataset;
      return s.waiting === 'player' && s.chessBusy === 'false';
    }""")
    expect(game.control("unit-hero")).to_have_attribute("data-chess-material", "sprite")
    expect(game.control("unit-black_a")).to_have_attribute("data-chess-material", "sprite")
    expect(game.control("unit-black_b")).to_have_attribute("data-chess-material", "sprite")
    expect(game.stage).to_have_attribute("data-chess-selected", "hero")
    board = game.control("battle-board")
    expect(board).to_have_attribute("data-map-asset", "warehouse")
    expect(board).to_have_attribute("data-max-pan-x", "672")
    expect(board).to_have_attribute("data-max-pan-y", "480")
    token = game.value("token")
    game.click("cell-5-3")
    expect(game.stage).to_have_attribute("data-chess-visible", "black_a")
    assert game.value("turn-id") == "hero" and game.value("token") == token

    # 拖动战斗地图可平移视野，不误触取消或选中。
    box = board.bounding_box()
    pan_before = (int(board.get_attribute("data-pan-x")), int(board.get_attribute("data-pan-y")))
    game.page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    game.page.mouse.down()
    game.page.mouse.move(box["x"] + box["width"] / 2 - 110, box["y"] + box["height"] / 2 - 70, steps=6)
    game.page.mouse.up()
    pan_after = (int(board.get_attribute("data-pan-x")), int(board.get_attribute("data-pan-y")))
    assert pan_after != pan_before, (pan_before, pan_after)
    expect(game.stage).to_have_attribute("data-chess-selected", "black_a")
    game.shot(output, "01a-warehouse-panned")

    # 滚轮缩放战斗视野，不触发上下平移；点击百分比重置为 100%。
    expect(board).to_have_attribute("data-zoom", "1.00")
    game.page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    game.page.mouse.wheel(0, 480)
    assert float(board.get_attribute("data-zoom")) < 1.0, board.get_attribute("data-zoom")
    game.shot(output, "01c-warehouse-zoomed")
    game.page.mouse.wheel(0, -400)
    game.page.mouse.wheel(0, -400)
    assert float(board.get_attribute("data-zoom")) > 1.0, board.get_attribute("data-zoom")
    game.click("camera-zoom")
    expect(board).to_have_attribute("data-zoom", "1.00")
    game.click("camera-recenter")

    # 点击棋盘空白格与面板外空白背景，均彻底取消选中。
    game.click("cell-3-2")
    expect(game.stage).to_have_attribute("data-chess-selected", "")
    expect(game.stage).to_have_attribute("data-chess-visible", "")
    expect(game.control("unit-hero")).to_have_attribute("aria-pressed", "false")
    expect(game.page.locator(".chess-inspection-label")).to_have_count(0)
    game.shot(output, "01b-warehouse-deselected")

    game.click("cell-5-3")
    expect(game.stage).to_have_attribute("data-chess-selected", "black_a")
    stage_box = game.stage.bounding_box()
    game.page.mouse.click(stage_box["x"] + stage_box["width"] - 20, stage_box["y"] + stage_box["height"] - 10)
    expect(game.stage).to_have_attribute("data-chess-selected", "")
    expect(game.stage).to_have_attribute("data-chess-visible", "")
    expect(game.control("unit-black_a")).to_have_attribute("aria-pressed", "false")

    game.control("unit-hero").press("Enter")
    expect(game.stage).to_have_attribute("data-chess-selected", "hero")
    game.shot(output, "01-warehouse")
    game.context.close()


def patrol_victory(browser, url, errors, output):
    game = BattleBrowser(browser, url, snapshot_for_deploy(), errors)
    game.click("loop-deploy-solo")
    game.ready()
    expect(game.stage).to_have_attribute("data-turn-id", "hero")
    expect(game.control("unit-demo_enemy")).to_have_attribute("data-chess-material", "placeholder")
    game.click("action-category-spells")
    game.click("ability-magic_missile")
    game.click("cell-9-3")
    game.click("battle-ability-use")
    expect(game.stage).to_have_attribute("data-chess-busy", "true")
    expect(game.stage).to_have_attribute("data-result", "eliminated")
    expect(game.control("battle-modal")).to_be_hidden()
    expect(game.stage).to_have_attribute("data-chess-visible", "hero,demo_enemy")
    game.click("open-system")
    expect(game.stage).to_have_attribute("data-chess-paused", "true")
    expect(game.control("system-dialog")).to_be_visible()
    frozen = game.value("chess-time")
    game.page.wait_for_timeout(150)
    assert game.value("chess-time") == frozen
    game.click("system-back")
    token, draws = game.value("token"), game.value("rng-draws")
    game.click("chess-speed")
    expect(game.stage).to_have_attribute("data-chess-speed", "2")
    game.click("chess-speed")
    expect(game.stage).to_have_attribute("data-chess-speed", "4")
    game.idle()
    assert game.value("token") == token and game.value("rng-draws") == draws
    expect(game.control("battle-continue-story")).to_be_visible()
    game.shot(output, "02-victory")
    game.click("battle-continue-story")
    expect(game.stage).to_have_count(0)
    game.page.wait_for_function("""() => {
      const saved = JSON.parse(localStorage.getItem('dw.save.v5'));
      return saved?.auto?.data?.postPrologue?.hero?.wizardSlots === 1;
    }""")
    game.context.close()


def partner(browser, url, errors, output):
    game = BattleBrowser(browser, url, snapshot_for_deploy("first"), errors)
    game.click("loop-deploy-link")
    game.ready()
    expect(game.stage).to_have_attribute("data-turn-id", "link")
    expect(game.stage).to_have_attribute("data-chess-selected", "link")
    expect(game.control("unit-link")).to_have_attribute("data-chess-material", "placeholder")
    expect(game.page.get_by_text("正在查看：金发青年 · 像素素材待补")).to_be_visible()
    game.shot(output, "03-partner")
    game.click("skill-end")
    expect(game.stage).to_have_attribute("data-turn-id", "hero")
    expect(game.stage).to_have_attribute("data-chess-selected", "hero")
    game.context.close()


def defeat(browser, url, errors, output):
    # 固定种子会先击倒 1 HP 的男高，下一轮由敌方近战造成最终失败。
    game = BattleBrowser(browser, url, snapshot_for_deploy("patrol", hp=1, seed=12), errors)
    game.click("loop-deploy-solo")
    game.ready()
    expect(game.stage).to_have_attribute("data-turn-id", "hero")
    game.click("skill-end")
    expect(game.stage).to_have_attribute("data-turn-id", "demo_enemy")
    expect(game.stage).to_have_attribute("data-chess-selected", "demo_enemy")
    expect(game.stage).to_have_attribute("data-chess-busy", "true")
    expect(game.control("unit-hero")).to_have_attribute("data-status", "unconscious")
    token = game.value("token")
    game.page.wait_for_timeout(400)
    assert game.value("token") == token
    game.page.wait_for_function("""() => {
      const s = document.querySelector('#stage').dataset;
      return s.result === 'dead' && s.chessBusy === 'true';
    }""", timeout=12000)
    expect(game.control("system-layer")).to_be_hidden()
    expect(game.stage).to_have_attribute("data-chess-visible", "hero,demo_enemy")
    game.shot(output, "04-final-hit")
    game.click("chess-speed")
    game.click("chess-speed")
    game.idle()
    expect(game.control("system-layer")).to_be_visible()
    expect(game.control("system-dialog")).to_contain_text("战斗失败")
    game.click("slot-0")
    game.click("system-confirm")
    expect(game.control("loop-deploy-solo")).to_be_visible()
    game.context.close()


def main(url, output):
    output.mkdir(parents=True, exist_ok=True)
    errors, checks = [], []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome", headless=True)
        for test, name in (
            (tutorial, "序幕仓库战点选、两套素材解码与英雄激励先攻"),
            (patrol_victory, "正式施法、暂停、实时切速、胜利结算及资源保存"),
            (partner, "双人出战、占位标注与回合自动跟随"),
            (defeat, "敌方等待演出、战败后自动打开读档并恢复出战"),
        ):
            test(browser, url, errors, output)
            checks.append(name)
        browser.close()
    assert not errors, errors
    report = {"passed": len(checks), "failed": 0, "checks": checks, "consoleErrors": errors}
    (output / "results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"passed": len(checks), "failed": len(errors)}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", required=True)
    parser.add_argument("--output", type=Path)
    arguments = parser.parse_args()
    if arguments.output:
        main(arguments.url.rstrip("/") + "/", arguments.output)
    else:
        with TemporaryDirectory(prefix="chess-release-") as folder:
            main(arguments.url.rstrip("/") + "/", Path(folder))
