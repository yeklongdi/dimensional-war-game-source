"""从 E:\\地图 的 4K 无网格原片裁切并导出 14×10（1344×960）战棋动态地图与静态封面。"""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path
from PIL import Image

MAP_ROOT = Path(r"E:\地图")
OUT_DIR = Path(__file__).resolve().parents[1] / "public" / "assets" / "battle" / "maps-v1"

# 4K 地图单元格均为 110×110 像素；按 14×10 格（1540×1100）裁切后等比缩放到 1344×960（96×96/格）。
SPECS = [
    {
        "id": "warehouse",
        "title": "科幻仓库",
        "video": MAP_ROOT / "54.-Sci-Fi Warehouse科幻仓库" / "Sci-Fi Warehouse 4k" / "Sci-Fi Warehouse 4K - Gridless.mp4",
        "poster": MAP_ROOT / "54.-Sci-Fi Warehouse科幻仓库" / "Sci-Fi Warehouse 4k" / "Sci-Fi Warehouse 4K - Gridless.jpg",
        "x0": 102, "y0": 90, "cell_4k": 110, "col_offset": 10, "row_offset": 2, "cols": 14, "rows": 10,
    },
    {
        "id": "alley",
        "title": "赛博朋克后巷",
        "video": MAP_ROOT / "47.-Cyberpunk Back Alley赛博朋克后巷" / "Cyberpunk Back Alley 4k" / "Cyberpunk Back Alley 4K - Gridless.mp4",
        "poster": MAP_ROOT / "47.-Cyberpunk Back Alley赛博朋克后巷" / "Cyberpunk Back Alley 4k" / "Cyberpunk Back Alley 4K - Gridless.jpg",
        "x0": 104, "y0": 90, "cell_4k": 110, "col_offset": 14, "row_offset": 2, "cols": 14, "rows": 10,
    },
    {
        "id": "lab",
        "title": "物质测试实验室",
        "video": MAP_ROOT / "16.-Substance Testing Lab物质检测实验室" / "Substance Testing Lab 4k" / "Substance Testing Lab 4K - Gridless.mp4",
        "poster": MAP_ROOT / "16.-Substance Testing Lab物质检测实验室" / "Substance Testing Lab 4k" / "Substance Testing Lab 4K - Gridless.jpg",
        "x0": 102, "y0": 90, "cell_4k": 110, "col_offset": 14, "row_offset": 0, "cols": 14, "rows": 10,
    },
    {
        "id": "facility",
        "title": "研究设施",
        "video": MAP_ROOT / "8.-Research Facility研究设施" / "Research Facility 4k" / "Research Facility 4k GRIDLESS.mp4",
        "poster": MAP_ROOT / "8.-Research Facility研究设施" / "Research Facility 4k" / "Research Facility 4k GRIDLESS.jpg",
        "x0": 98, "y0": 90, "cell_4k": 110, "col_offset": 10, "row_offset": 5, "cols": 14, "rows": 10,
    },
]


def build_map(spec: dict, crf: int = 34, fps: int = 30, skip_existing: bool = False) -> dict:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cell_4k = spec["cell_4k"]
    crop_x = spec["x0"] + spec["col_offset"] * cell_4k
    crop_y = spec["y0"] + spec["row_offset"] * cell_4k
    crop_w = spec["cols"] * cell_4k
    crop_h = spec["rows"] * cell_4k
    out_w = spec["cols"] * 96
    out_h = spec["rows"] * 96

    poster_path = OUT_DIR / f"{spec['id']}.webp"
    if not (skip_existing and poster_path.exists()):
        im = Image.open(spec["poster"]).convert("RGB")
        cropped = im.crop((crop_x, crop_y, crop_x + crop_w, crop_y + crop_h)).resize(
            (out_w, out_h), Image.Resampling.LANCZOS
        )
        cropped.save(poster_path, format="WEBP", quality=88, method=6)

    video_path = OUT_DIR / f"{spec['id']}.webm"
    if not (skip_existing and video_path.exists()):
        vf = f"crop={crop_w}:{crop_h}:{crop_x}:{crop_y},scale={out_w}:{out_h}:flags=lanczos,fps={fps}"
        cmd = [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(spec["video"]),
            "-vf", vf,
            "-an", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", str(crf),
            "-pix_fmt", "yuv420p", "-row-mt", "1", "-deadline", "good", "-cpu-used", "3",
            str(video_path),
        ]
        subprocess.run(cmd, check=True)

    return {
        "id": spec["id"],
        "title": spec["title"],
        "cols": spec["cols"],
        "rows": spec["rows"],
        "width": out_w,
        "height": out_h,
        "crop4k": {"x": crop_x, "y": crop_y, "w": crop_w, "h": crop_h},
        "video": f"/assets/battle/maps-v1/{spec['id']}.webm",
        "poster": f"/assets/battle/maps-v1/{spec['id']}.webp",
        "videoBytes": video_path.stat().st_size,
        "posterBytes": poster_path.stat().st_size,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--crf", type=int, default=34)
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--only", help="仅处理指定 map id")
    parser.add_argument("--skip-existing", action="store_true")
    args = parser.parse_args()

    manifest = []
    for spec in SPECS:
        if args.only and spec["id"] != args.only:
            continue
        info = build_map(spec, crf=args.crf, fps=args.fps, skip_existing=args.skip_existing)
        manifest.append(info)
        print(json.dumps(info, ensure_ascii=False), flush=True)

    if not args.only:
        (OUT_DIR / "manifest.json").write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )


if __name__ == "__main__":
    main()
