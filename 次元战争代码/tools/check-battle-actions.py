"""专项验收底部技能栏；独立 Chrome 上下文，不读取或改写玩家存档。"""

import argparse
import json
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


FIXTURE = """<!doctype html><html lang="zh-CN"><meta charset="utf-8">
<link rel="icon" href="data:,"><link rel="stylesheet" href="/src/styles/player.css">
<link rel="stylesheet" href="/src/styles/menu.css"><link rel="stylesheet" href="/src/styles/battle.css">
<div id="app"></div><script type="module">
import { BattleView } from '/src/game/ui/battle-view.ts';
import { openEncounter } from '/src/game/loop/encounters.ts';
import { startLoop } from '/src/game/loop/progress.ts';
import { emptyState } from '/src/game/state.ts';
import { sequence } from '/src/game/battle/dice.ts';
import { reduceBattle } from '/src/game/battle/battle.ts';
import { setBattleMode, reducePlanning } from '/src/game/battle/planning.ts';
let view, game, serial = 0;
window.startFixture = (classId = 'wizard', options = {}) => {
  view?.dispose();
  const loop = startLoop(42);
  loop.hero = { ...loop.hero, classId, hp: 3, ...options.hero };
  loop.items = { healing_potion: 1, missile_scroll: 2, acid: 1, ...options.items };
  if (options.many) {
    loop.hero.sorcerer.cantrips = ['sorcerous_burst', 'fire_bolt', 'ray_of_frost', 'shocking_grasp', 'poison_spray', 'acid_splash'];
    loop.hero.sorcerer.prepared = ['magic_missile', 'burning_hands', 'mage_armor', 'false_life'];
  }
  loop.rng = sequence([20, 1, 1, ...Array(100).fill(1)]);
  const battle = openEncounter(loop, 'boss', !!options.link, ++serial);
  if (options.near) battle.units.find(unit => unit.id === 'demo_enemy').position = { col: 1, row: 2 };
  game = { ...emptyState(serial), screen: 'battle', battleMode: 'idle', battle };
  view = new BattleView(document.querySelector('#app'), action => {
    if (action.type === 'mode') game = setBattleMode(game, action.mode);
    else if (action.type === 'plan') game = reducePlanning(game, action).state;
    else if (action.type === 'command') {
      const result = reduceBattle(game.battle, action.envelope);
      if (result.rejectedReason) throw new Error(result.rejectedReason);
      game = { ...game, battle: result.state, battleMode: 'idle', movementDraft: undefined };
    }
    view.render(game);
  });
  view.render(game);
};
window.snapshot = () => structuredClone(game);
window.startFixture();
</script></html>"""


def run(origin, output):
    output.mkdir(parents=True, exist_ok=True)
    errors, checks = [], []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome", headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
        page.route("**/__battle_actions_fixture", lambda route: route.fulfill(body=FIXTURE, content_type="text/html"))
        page.goto(origin + "/__battle_actions_fixture")
        page.wait_for_function("typeof window.startFixture === 'function'")

        def click(test_id):
            page.get_by_test_id(test_id).click()

        def shot(name, hovering=False):
            if not hovering:
                page.mouse.move(1400, 20)
            page.screenshot(path=output / (name + ".png"), animations="disabled")

        def start(class_id="wizard", **options):
            page.evaluate("([id, options]) => startFixture(id, options)", [class_id, options])

        def unchanged(before):
            assert page.evaluate("snapshot().battle") == before

        bar = page.get_by_test_id("battle-actionbar")
        expect(bar).to_be_visible()
        assert page.get_by_test_id("battle-action-slots").get_by_role("button").count() == 13
        box, board = bar.bounding_box(), page.get_by_test_id("battle-board").bounding_box()
        assert box["y"] >= board["y"] + board["height"]
        shot("02-wizard-all")
        checks.append("底栏直接展示13项且不遮挡棋盘")

        before = page.evaluate("snapshot().battle")
        page.get_by_test_id("ability-magic_missile").hover()
        expect(page.get_by_role("tooltip")).to_contain_text("一环法术位")
        page.get_by_test_id("ability-missile_scroll").hover()
        expect(page.get_by_role("tooltip")).to_contain_text("不消耗法术位")
        shot("03-scroll-tooltip", hovering=True)
        unchanged(before)
        checks.append("悬停显示效果与消耗，不推进战斗")

        click("action-category-cantrips")
        assert page.get_by_test_id("battle-action-slots").get_by_role("button").count() == 3
        click("action-category-spells")
        assert page.get_by_test_id("battle-action-slots").get_by_role("button").count() == 4
        shot("04-level-one")
        search = page.get_by_role("searchbox")
        search.fill("护甲")
        expect(page.get_by_test_id("ability-mage_armor")).to_be_visible()
        assert page.get_by_test_id("battle-action-slots").get_by_role("button").count() == 1
        search.fill("不存在")
        expect(page.get_by_text("没有匹配的技能或法术")).to_be_visible()
        click("action-category-all")
        expect(page.get_by_role("searchbox")).to_have_value("")
        unchanged(before)
        checks.append("分类、搜索和无结果提示可用，不消耗资源")

        search.focus()
        search.evaluate("""node => {
          node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
          node.value = '火焰';
          node.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
        }""")
        expect(search).to_be_focused()
        assert page.get_by_test_id("battle-action-slots").get_by_role("button").count() == 13
        search.evaluate("node => node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }))")
        expect(page.get_by_test_id("ability-fire_bolt")).to_be_visible()
        assert page.get_by_test_id("battle-action-slots").get_by_role("button").count() == 1
        search.fill("火箭")
        search.press("ArrowLeft")
        page.keyboard.insert_text("焰")
        expect(search).to_have_value("火焰箭")
        expect(page.get_by_test_id("ability-fire_bolt")).to_be_visible()
        click("action-category-all")
        checks.append("中文输入法合成期间保留输入框，中间插字后保持光标与筛选")

        click("ability-magic_missile")
        expect(page.get_by_test_id("battle-ability-use")).to_be_disabled()
        expect(page.get_by_test_id("cell-5-2")).to_have_attribute("data-ability-target", "true")
        click("cell-0-0")
        expect(page.get_by_test_id("battle-ability-use")).to_be_disabled()
        click("cell-5-2")
        expect(page.get_by_test_id("cell-5-2")).to_have_attribute("data-ability-selected", "true")
        expect(page.get_by_test_id("battle-ability-use")).to_be_enabled()
        unchanged(before)
        shot("05-spell-target")
        page.keyboard.press("Escape")
        expect(page.get_by_test_id("battle-ability-panel")).to_be_hidden()
        expect(page.get_by_test_id("cell-5-2")).to_have_attribute("data-ability-target", "false")
        unchanged(before)
        checks.append("棋盘选目标、非法目标拒绝和Escape取消均不提前扣资源")

        click("ability-magic_missile")
        click("ability-target-demo_enemy")
        click("battle-ability-use")
        after = page.evaluate("snapshot().battle")
        assert after["loop"]["hero"]["wizardSlots"] == 1
        assert after["loop"]["items"]["missile_scroll"] == 2
        assert not after["units"][0]["resources"]["action"]
        expect(page.get_by_test_id("battle-ability-panel")).to_be_hidden()
        expect(page.get_by_test_id("ability-magic_missile")).to_have_attribute("data-unavailable", "true")
        click("ability-healing_potion")
        click("ability-target-hero")
        click("battle-ability-use")
        assert page.evaluate("snapshot().battle.loop.items.healing_potion") == 0
        assert page.evaluate("snapshot().battle.units[0].hp") > 3
        checks.append("确认法术仅扣一次法术位，剩余附赠动作仍可用药水")

        start()
        click("ability-missile_scroll")
        click("cell-5-2")
        click("battle-ability-use")
        assert page.evaluate("snapshot().battle.loop.hero.wizardSlots") == 2
        assert page.evaluate("snapshot().battle.loop.items.missile_scroll") == 1
        checks.append("卷轴从背包扣除，保留法术位")

        start(hero={"wizardSlots": 0}, items={"healing_potion": 0})
        click("ability-magic_missile")
        expect(page.get_by_test_id("battle-ability-feedback")).to_contain_text("一环法术位已用完")
        expect(page.get_by_test_id("battle-ability-use")).to_be_disabled()
        click("action-category-items")
        expect(page.get_by_test_id("battle-ability-panel")).to_be_hidden()
        click("ability-healing_potion")
        expect(page.get_by_test_id("battle-ability-feedback")).to_contain_text("背包中没有此道具")
        shot("06-unavailable")
        checks.append("耗尽能力仍可查看原因，切换分类清理旧目标")

        start("sorcerer")
        click("ability-sorcerous_burst")
        click("burst-cold")
        expect(page.get_by_test_id("burst-cold")).to_be_focused()
        click("cell-5-2")
        shot("07-burst-damage")
        click("battle-ability-use")
        event = page.evaluate("snapshot().battle.log.filter(event => event.kind === 'attack').at(-1)")
        assert event["damageType"] == "cold"
        assert page.evaluate("snapshot().battle.loop.hero.sorcererSlots") == 2
        checks.append("术法爆发可直接选择伤害类型，戏法保留法术位")

        start("sorcerer", near=True)
        click("ability-burning_hands")
        expect(page.get_by_text("会波及友方。", exact=False).first).to_be_visible()
        expect(page.get_by_test_id("cell-1-2")).to_have_attribute("data-ability-target", "true")
        click("cell-1-2")
        expect(page.get_by_test_id("battle-ability-use")).to_be_enabled()
        shot("08-area-direction")
        click("battle-ability-use")
        assert page.evaluate("snapshot().battle.loop.hero.sorcererSlots") == 1
        checks.append("锥形法术通过棋盘选择合法方向，显示友伤提示")

        start("sorcerer", many=True)
        expect(page.get_by_test_id("action-page-next")).to_be_enabled()
        count = page.get_by_test_id("battle-action-slots").get_by_role("button").count()
        assert count == 14
        click("action-page-next")
        expect(page.get_by_test_id("action-page-next")).to_be_disabled()
        expect(page.get_by_test_id("action-page-previous")).to_be_enabled()
        shot("09-pagination")
        click("action-category-cantrips")
        assert page.get_by_test_id("battle-action-slots").get_by_role("button").count() == 6
        checks.append("多于14项时分页，切换分类正确回到第一页")

        start("wizard", link=True)
        click("ability-magic_missile")
        click("cell-5-2")
        click("skill-end")
        expect(page.get_by_test_id("battle-ability-panel")).to_be_hidden()
        expect(page.get_by_test_id("ability-multiattack")).to_be_visible()
        expect(page.get_by_test_id("cell-5-2")).to_have_attribute("data-ability-target", "false")
        click("skill-end")
        expect(bar).to_be_hidden()
        checks.append("换角色清理目标并切换能力；敌方回合隐藏操作栏")

        start("monk")
        expect(page.get_by_test_id("action-category-spells")).to_be_disabled()
        click("mode-move")
        expect(bar).to_be_hidden()
        expect(page.get_by_test_id("move-cancel")).to_be_visible()
        click("move-cancel")
        expect(bar).to_be_visible()
        shot("10-monk-return")
        checks.append("无施法能力时分类禁用，移动取消后恢复操作栏")

        start()
        for width, height in [(1280, 720), (1920, 1080), (1024, 768)]:
            page.set_viewport_size({"width": width, "height": height})
            page.wait_for_function("Math.abs(document.querySelector('#stage').getBoundingClientRect().width - 1280 * Math.min(innerWidth / 1280, innerHeight / 720)) < 1")
            bounds = bar.bounding_box()
            assert bounds["y"] + bounds["height"] <= height
            assert page.locator(".battle-action-library").evaluate("node => node.scrollWidth <= node.clientWidth")
        shot("11-smaller-window")
        checks.append("三种桌面窗口缩放后底栏完整可见且无横向溢出")

        page.set_viewport_size({"width": 1440, "height": 900})
        page.goto(origin + "/?debug=battle&seed=42")
        expect(bar).to_be_visible()
        expect(page.get_by_test_id("skill-dash")).to_be_visible()
        expect(page.get_by_test_id("skill-end")).to_be_visible()
        shot("01-debug")
        checks.append("正式调试入口展示原有动作与直接结束回合按钮")

        page.goto(origin + "/?seed=0")
        page.evaluate("""async () => {
          const { startLoop } = await import('/src/game/loop/progress.ts');
          const { levels } = await import('/src/content/levels.ts');
          const loop = startLoop(42); loop.day = 10; loop.slot = 'night';
          loop.phase = { kind: 'deploy', encounter: 'boss' };
          loop.hero.classId = 'wizard'; loop.hero.hp = 7;
          loop.items = { healing_potion: 1, missile_scroll: 1, acid: 1 };
          const data = { version: 2, flags: { flag_prologue_completed: true, flag_act1_completed: true,
            has_master_sword: true, prologue_3_complete: true, link_summoned: true, prologue_4_complete: true,
            flag_battle_prologue4_patrol_skipped: true, flag_battle_prologue4_deoxys_encounter_skipped: true }, completedLevelIds: levels.map(level => level.id),
            checkpoint: { kind: 'map' }, savedAt: 1792800000000, postPrologue: loop };
          localStorage.setItem('dw.save.v5', JSON.stringify({ version: 5, contentVersion: 'post_prologue_demo_v1',
            activeRunId: 'actionbar-isolated-test', revision: 1, auto: { revision: 1, data }, manual: Array(6).fill(null) }));
          localStorage.setItem('dw.settings.v1', JSON.stringify({ version: 1, bgm: 0, sfx: 0, textMs: 10 }));
        }""")
        page.reload()
        click("load-game")
        click("slot-0")
        click("system-confirm")
        click("loop-deploy-solo")
        expect(bar).to_be_visible()
        click("action-category-spells")
        click("ability-magic_missile")
        click("cell-5-2")
        page.keyboard.press("Escape")
        expect(page.get_by_test_id("system-back")).to_be_visible()
        click("system-back")
        expect(page.get_by_test_id("battle-ability-use")).to_be_enabled()
        shot("12-runtime-spell-target")
        draws = page.get_by_test_id("battle-stage").get_attribute("data-rng-draws")
        click("battle-ability-close")
        assert page.get_by_test_id("battle-stage").get_attribute("data-rng-draws") == draws
        click("ability-magic_missile")
        click("cell-5-2")
        click("battle-ability-use")
        expect(page.get_by_test_id("unit-hero")).to_have_attribute("data-action", "false")
        expect(page.get_by_test_id("ability-magic_missile")).to_have_attribute("data-unavailable", "true")
        expect(page.get_by_test_id("battle-ability-panel")).to_be_hidden()
        shot("13-runtime-after-use")
        checks.append("正式运行入口可筛选、选目标与确认施法；取消不掷骰；ESC沿用系统菜单")
        browser.close()
    report = {"passed": len(checks), "failed": len(errors), "checks": checks, "consoleErrors": errors}
    (output / "results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps({"passed": len(checks), "failed": len(errors)}, ensure_ascii=True))
    assert not errors, errors


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--origin", default="http://127.0.0.1:5182")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[2] / "游戏说明/工程/verification/battle-actionbar")
    arguments = parser.parse_args()
    run(arguments.origin.rstrip("/"), arguments.output)
