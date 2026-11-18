"""通过正式入口验收主动赴约、保底催约和十日副本。"""

import argparse
import json
import runpy
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


helpers = runpy.run_path(str(Path(__file__).with_name("check-post-prologue.py")))
click, snapshot, wait_saved, load_slot, system, seed_vault = (
    helpers[name] for name in ("click", "snapshot", "wait_saved", "load_slot", "system", "seed_vault")
)
check_phase, skip_day, event, wait_turn = (
    helpers[name] for name in ("check_phase", "skip_day", "event", "wait_turn")
)
drive = """goal => {
    const stage = document.querySelector('[data-testid="story-stage"]');
    if (goal.scene && stage?.dataset.sceneId === goal.scene) return true;
    if (goal.wait && stage?.dataset.waitKind === goal.wait) return true;
    if (stage?.dataset.waitKind === 'error') throw new Error('剧情停在错误状态');
    if (stage?.dataset.waitKind === 'text') stage.dispatchEvent(new MouseEvent('click', {bubbles: true, detail: 1}));
    return false;
}"""


def story_until(page, *, scene=None, wait=None):
    page.wait_for_function(drive, arg={"scene": scene, "wait": wait}, timeout=20_000, polling=35)
    wait_saved(page)


def load_auto(page):
    page.reload()
    click(page, "load-game")
    load_slot(page)
    wait_saved(page)


def finish_story(page):
    story_until(page, wait="end")
    click(page, "end-levels")
    wait_saved(page)


def photo(page, output, label):
    page.screenshot(path=output / f"{label}.jpg", quality=82, animations="disabled")


def enter_story(page, url, scene):
    page.goto(url)
    seed_vault(page, "dw.save.v5", "post_prologue_demo_v1", "prologue4_01", scene,
               helpers["TAIL_FLAGS"], helpers["LEVELS"][:-1])
    load_auto(page)
    expect(page.get_by_test_id("story-stage")).to_have_attribute("data-scene-id", scene)


def read_invitation(page, output=None):
    story_until(page, scene="m101")
    story_until(page, scene="m102")
    assert snapshot(page)["postPrologue"]["storyScene"] == "m102"
    load_auto(page)
    expect(page.get_by_test_id("story-stage")).to_have_attribute("data-scene-id", "m102")
    if output:
        story_until(page, wait="end")
        photo(page, output, "01-invitation-complete")
    finish_story(page)
    check_phase(page, "city", 1, 1)
    assert snapshot(page)["flags"]["thief_invitation_received"] is True


def outer_lab(page, day, output, reload_at_stop=False):
    story_until(page, wait="blocked-call")
    assert snapshot(page)["postPrologue"]["storyScene"] == "t102"
    assert snapshot(page)["postPrologue"]["day"] == day
    if reload_at_stop:
        photo(page, output, "02-lab-battle-stop")
        load_auto(page)
        story_until(page, wait="blocked-call")
    expect(page.get_by_test_id("blocked-call")).to_contain_text("尚未制作")
    system(page, "skip")
    story_until(page, scene="t103")
    assert snapshot(page)["flags"]["flag_battle_thief_bond1_outer_lab_skipped"] is True
    assert not page.get_by_test_id("battle-stage").is_visible()
    finish_story(page)
    assert snapshot(page)["flags"]["aptx4869_model_known"] is True


def active_visit(page, url, output):
    enter_story(page, url, "c009")
    story_until(page, scene="c012")
    assert snapshot(page)["flags"]["thief_classmate_identity_known"] is False
    read_invitation(page, output)
    event(page, "high_school", "school_request")
    event(page, "school_road", "job")
    event(page, "old_warehouse", "thief_bond1")
    expect(page.get_by_test_id("story-stage")).to_have_attribute("data-scene-id", "t101")
    outer_lab(page, 1, output, reload_at_stop=True)
    check_phase(page, "interlude", 1, 1)
    click(page, "loop-continue")
    check_phase(page, "city", 1, 2)
    expect(page.get_by_test_id("loop-deadline")).to_contain_text("据点行动截止第 9 天")


def fight_and_settle(page):
    click(page, "loop-deploy-link")
    for _ in range(18):
        actor, kind = wait_turn(page)
        if kind == "result":
            break
        if actor == "link":
            click(page, "ability-slaying_bow")
            click(page, "ability-target-demo_enemy")
            click(page, "battle-ability-use")
        if page.get_by_test_id("battle-continue-story").is_visible():
            break
        click(page, "skill-end")
    click(page, "battle-continue-story")
    wait_saved(page)


def forced_visit_and_dungeon(page, url, output):
    enter_story(page, url, "c013")
    read_invitation(page)
    skip_day(page)
    click(page, "loop-continue")
    for day in range(2, 7):
        check_phase(page, "city", 1, day)
        skip_day(page)
    event(page, "high_school", "vtuber_bond1")
    finish_story(page)
    skip_day(page)
    expect(page.get_by_test_id("story-stage")).to_have_attribute("data-scene-id", "m103")
    photo(page, output, "03-day-seven")
    outer_lab(page, 7, output)
    expect(page.get_by_test_id("story-stage")).to_have_attribute("data-scene-id", "v102")
    load_auto(page)
    expect(page.get_by_test_id("story-stage")).to_have_attribute("data-scene-id", "v102")
    finish_story(page)
    check_phase(page, "city", 1, 8)
    photo(page, output, "04-deadlines")
    for day in range(8, 11):
        check_phase(page, "city", 1, day)
        skip_day(page)
    check_phase(page, "crisis", 1, 10)
    click(page, "loop-continue")
    check_phase(page, "deploy")
    fight_and_settle(page)
    check_phase(page, "safe")
    click(page, "loop-rest-long")
    wait_saved(page)
    click(page, "loop-continue")
    check_phase(page, "deploy")
    fight_and_settle(page)
    fight_and_settle(page)
    check_phase(page, "settlement", 1, 10)
    photo(page, output, "05-dungeon-settlement")
    load_auto(page)
    check_phase(page, "settlement", 1, 10)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    url = args.url.rstrip("/") + "/?seed=0"
    errors, checks = [], []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        for check in (active_visit, forced_visit_and_dungeon):
            with browser.new_context(viewport={"width": 1366, "height": 820}) as context:
                page = context.new_page()
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.on("console", lambda entry: errors.append(entry.text) if entry.type == "error" else None)
                check(page, url, args.output)
                checks.append(check.__name__)
                print(check.__name__, flush=True)
    result = {"checks": checks, "errors": errors, "url": url}
    (args.output / "results.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    assert not errors, errors


if __name__ == "__main__":
    main()
