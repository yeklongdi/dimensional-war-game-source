"""将 ImageGen 透明图集切分为运行素材；只裁切、统一画格与缩放，不改绘角色。"""

import json
from pathlib import Path

from PIL import Image

PROJECT = Path(__file__).resolve().parents[1]
SOURCE = PROJECT / "artwork/battle-chess-v1"
OUTPUT = PROJECT / "public/assets/battle/chess-v1"
STATES = ["appear", "idle", "attack", "cast", "hurt", "down"]


def prepare():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    pieces = Image.open(SOURCE / "pieces-source.png").convert("RGBA")
    poses = Image.open(SOURCE / "poses-source.png").convert("RGBA")
    assert pieces.getchannel("A").getextrema() == (0, 255), "棋子图必须有真实透明通道"
    assert poses.getchannel("A").getextrema() == (0, 255), "像素图必须有真实透明通道"
    for index, name in enumerate(["hero", "black"]):
        bounds = (round(index * pieces.width / 2), 0, round((index + 1) * pieces.width / 2), pieces.height)
        piece = pieces.crop(bounds)
        piece = piece.crop(piece.getchannel("A").getbbox())
        piece.thumbnail((192, 320), Image.Resampling.LANCZOS)
        piece.save(OUTPUT / (name + "-piece.png"))
        sheet = Image.new("RGBA", (256, 384))
        for row in range(6):
            for frame in range(4):
                column = index * 4 + frame
                box = (round(column * poses.width / 8), round(row * poses.height / 6),
                       round((column + 1) * poses.width / 8), round((row + 1) * poses.height / 6))
                cell = poses.crop(box).resize((60, 60), Image.Resampling.NEAREST)
                # 所有姿态共用画格原点和脚底基线，避免按外接框缩放导致拳头伸出时身体变小。
                sheet.alpha_composite(cell, (frame * 64 + 2, row * 64))
        sheet.save(OUTPUT / (name + "-poses.png"))
    manifest = {"version": 1, "frameWidth": 64, "frameHeight": 64, "frames": 4,
                "footY": 60, "states": STATES,
                "subjects": {"hero": "男高，沿既有形象", "black": "普通黑衣人，类型共用"},
                "source": "内置 image_gen；原图保留在 artwork/battle-chess-v1"}
(OUTPUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps({"files": [path.name for path in OUTPUT.iterdir()], "frames": 48}))


if __name__ == "__main__":
    prepare()
