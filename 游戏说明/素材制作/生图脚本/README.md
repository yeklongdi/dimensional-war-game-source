# 次元战争角色模型自动导入

本目录中的脚本会自动完成：绿幕扣背景、透明边裁切、32×32格内缩放、写入游戏资源、Godot导入扫描和战斗自动接入。

游戏会按 `.tres` 内的角色 `id` 查找：

```text
res://assets/characters/<角色ID>/<角色ID>_battle_model.json
```

找到清单即使用正式模型；没有清单则保留程序占位符，不需要改 `battle_scene.gd`。

## 新角色操作

1. 在任意角色资料目录新建 `<角色ID>_导入配置.json`，配置格式见下方模板。
2. `character_id` 必须与 `data/characters/<id>.tres` 的 `id` 完全相同，只允许小写字母、数字、下划线。
3. 修改 `source`、`project_root`、网格 `columns/rows` 与每段动画的 `cells` 坐标；左移可写 `mirror_of: walk_right`。
4. 执行通用导入器：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "E:\笔记\次元战争\生图脚本\角色模型导入.ps1" `
  -ConfigPath "E:\笔记\次元战争\生图脚本\<角色>_导入配置.json"
```

5. 进入战斗截图检查：模型必须没有绿色残边，且完整位于一个32×32格内、脚底靠近格子下沿。

## 配置模板

```json
{
  "character_id": "example_hero",
  "source": "E:\\素材\\example_hero_sheet.png",
  "project_root": "E:\\yelongdi暑期项目\\游戏\\次元战争",
  "godot_executable": "E:\\yelongdi暑期项目\\游戏\\Godot_v4.7-stable_win64.exe",
  "grid": { "columns": 8, "rows": 4 },
  "fit": { "width": 28, "height": 29 },
  "chroma_key": { "green_min": 132, "hard_ratio": 1.3, "soft_ratio": 1.08 },
  "animations": [
    { "name": "idle", "cells": [[0, 0]], "fps": 4.0, "loop": true },
    { "name": "walk_right", "cells": [[0, 1], [1, 1]], "fps": 12.0, "loop": true },
    { "name": "walk_left", "mirror_of": "walk_right", "fps": 12.0, "loop": true },
    { "name": "attack", "cells": [[0, 2], [1, 2]], "fps": 12.0, "loop": false }
  ]
}
```

## 配置说明

- `fit.width / fit.height`：模型在32×32格内最大可占尺寸；默认建议28×29。
- `green_min`：绿色亮度阈值。
- `hard_ratio`：绿色相对红/蓝达到该倍数时完全透明。
- `soft_ratio`：绿边软化起点，低于 `hard_ratio`。
- `fps`：动画帧率；`loop=false` 用于攻击动画。

生成的战场图集与清单是正式游戏资源，应保留；只有 `测试截图_*.png` 及同名 `.png.import` 才需要在测试后删除。
