# M0 内容问题与制作备注

> 由导出脚本覆盖生成；人工决定请记录到 decisions.md。原文与 source/ 均不改写。

场景：序幕 9 / 第一幕 19。

warning 共 **158 条**；同一原文位置的多个类别合并计一条。

条目包括已由任务书确定处理方式的制作备注；“已有处理依据”不会从原文或清单中删除。

## 优先待决事项

- **A012 幻象演出如何绑定**：`event_master_sword_vision` 与 `CG: cg_master_sword_vision_placeholder` 尚无执行约定及绑定素材；请确定沿用占位演出，还是提供对应 CG / 音效映射。已有幻象旁白完整保留。
- **占位素材的绑定清单**：背景、立绘、BGM、SFX 仍含占位标记；请确定哪些素材 id 对应现有文件。任务书已允许缺失时占位，M0 不复制媒体；同学甲、同学乙也缺少立绘声明。
- **正式变量名与重复事件如何对应**：当前 flag 按幕、场景、SET 序号生成；A010 与 A014 都有“增加男高对学校地下异常的调查进度”。请确定后续是否对应同一事件及正式命名。本切片依任务书只记录布尔值，不进行数值计算。

## 序幕（prologue）

### p001 · 奶奶家门前

#### source/story/prologue.md:117 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_dusk [占位符]
````

#### source/story/prologue.md:118 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_homecoming_warm [占位符，待绑定]
````

#### source/story/prologue.md:120 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/prologue.md:137 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_door_knock [占位符]
````

### p002 · 奶奶家·进门

#### source/story/prologue.md:148 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_entrance [占位符]
````

#### source/story/prologue.md:149 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_homecoming_warm [占位符，延续]
````

#### source/story/prologue.md:151 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 奶奶 asset=char_grandmother_warm [占位符] position=door
````

### p003 · 奶奶家·客厅

#### source/story/prologue.md:189 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_living_room [占位符]
````

#### source/story/prologue.md:190 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_homecoming_warm [占位符，延续]
````

#### source/story/prologue.md:192 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/prologue.md:193 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 奶奶 asset=char_grandmother_warm [占位符] position=right
````

### p004 · 奶奶家·整理房间与出门

#### source/story/prologue.md:237 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_bedroom [占位符]
````

#### source/story/prologue.md:238 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_homecoming_warm [占位符，渐弱]
````

#### source/story/prologue.md:240 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/prologue.md:255 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_kitchen_night [占位符]
````

#### source/story/prologue.md:256 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 奶奶 asset=char_grandmother_warm [占位符] position=kitchen
````

### p005 · 旧街区·仓库区外围

#### source/story/prologue.md:285 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_sun_city_old_street_night [占位符]
````

#### source/story/prologue.md:286 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_old_street_mystery [占位符，待绑定]
````

#### source/story/prologue.md:288 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/prologue.md:305 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_metal_collision [占位符]
````

#### source/story/prologue.md:307 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §3.3：镜头说明只供制作查看。

````text
CAMERA: 镜头切换至高墙另一侧的月光下。
````

#### source/story/prologue.md:308 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑衣人甲 asset=char_organization_member_placeholder [占位符] position=left
````

#### source/story/prologue.md:309 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑衣人乙 asset=char_organization_member_placeholder [占位符] position=right
````

#### source/story/prologue.md:310 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 怪盗 asset=char_thief_masked_black_placeholder [占位符] position=center
````

#### source/story/prologue.md:341 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录男高介入仓库区冲突
````

### p006 · 仓库区外围·第一次战斗

#### source/story/prologue.md:349 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_warehouse_area_night [占位符]
````

#### source/story/prologue.md:350 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_first_battle [占位符，待绑定]
````

#### source/story/prologue.md:358 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录序幕战斗教学完成
````

#### source/story/prologue.md:360 · 制作备注 / CHECK（只记录）

- 制作备注完整保留；默认不向玩家展示。
- CHECK 中的条件与嵌套 SET / JUMP 均不解释、不执行。
- 已有处理依据：任务书 §4.5：失败后重试本场且保留剧情进度；M0 只保留 CHECK 原文。

````text
CHECK: [战斗失败处理待确认]
````

#### source/story/prologue.md:362 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：2026-10-18 用户确认：本句按制作备注隐藏。

````text
NARRATION:
战斗结果返回后，继续进入战斗结束场景。
````

### p007 · 仓库区外围·怪盗离开

#### source/story/prologue.md:371 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_warehouse_area_night [占位符]
````

#### source/story/prologue.md:372 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_first_battle_after [占位符，待绑定]
````

#### source/story/prologue.md:374 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/prologue.md:382 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 怪盗 asset=char_thief_masked_black_placeholder [占位符] position=far
````

#### source/story/prologue.md:394 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_distant_warehouse_noise [占位符]
````

#### source/story/prologue.md:400 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录怪盗在男高面前离开
````

### p008 · 奶奶家·回家

#### source/story/prologue.md:409 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_living_room_night [占位符]
````

#### source/story/prologue.md:410 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_homecoming_warm [占位符，低音量]
````

#### source/story/prologue.md:412 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/prologue.md:413 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 奶奶 asset=char_grandmother_warm [占位符] position=right
````

### p009 · 男高房间·睡前

#### source/story/prologue.md:465 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_bedroom_night [占位符]
````

#### source/story/prologue.md:466 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_night_before_school [占位符，待绑定]
````

#### source/story/prologue.md:468 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=bed
````

#### source/story/prologue.md:491 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_underground_dark [占位符]
````

#### source/story/prologue.md:492 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §3.3：镜头说明只供制作查看。

````text
CAMERA: 镜头缓慢推进黑暗中的漆黑结晶。
````

#### source/story/prologue.md:493 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑色结晶 asset=prop_dark_god_crystal_placeholder [占位符] position=center
````

#### source/story/prologue.md:495 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_low_heartbeat [占位符]
````

#### source/story/prologue.md:500 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录序幕结束
````


## 第一幕（act1）

### a001 · 清晨睡过头

#### source/story/act1.md:170 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_bedroom_morning [占位符]
````

#### source/story/act1.md:171 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_morning [占位符，待绑定]
````

#### source/story/act1.md:173 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/act1.md:174 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 奶奶 asset=char_grandmother_warm [占位符] position=door
````

#### source/story/act1.md:211 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
````

### a002 · 上学途中·路口相撞

#### source/story/act1.md:233 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_sun_city_school_road_morning [占位符]
````

#### source/story/act1.md:234 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_morning [占位符，延续]
````

#### source/story/act1.md:236 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/act1.md:244 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 怪盗 asset=char_thief_smile [已有候选素材，尚未绑定] position=right
````

#### source/story/act1.md:263 · 制作备注

- 制作备注完整保留；默认不向玩家展示。

````text
INNER:
怪盗：
【原文未提供更多心声，此处不补写。】
````

### a003 · 学校门口

#### source/story/act1.md:276 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_gate_morning [占位符]
````

#### source/story/act1.md:277 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_morning [占位符，延续]
````

#### source/story/act1.md:279 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/act1.md:288 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 老师 asset=char_teacher_placeholder [占位符] position=left
````

#### source/story/act1.md:308 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §3.3：镜头说明只供制作查看。

````text
CAMERA: 镜头切换到教学楼二楼走廊。
````

#### source/story/act1.md:309 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 反派 asset=char_villain_calm [占位符] position=left
````

#### source/story/act1.md:310 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 偶像 asset=char_idol_neutral [占位符] position=right
````

#### source/story/act1.md:329 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑色结晶 asset=prop_dark_god_crystal_placeholder [占位符] position=center
````

#### source/story/act1.md:330 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_low_heartbeat [占位符]
````

### a004 · 教室·自我介绍

#### source/story/act1.md:346 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_morning [占位符]
````

#### source/story/act1.md:347 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_classroom_daily [占位符，待绑定]
````

#### source/story/act1.md:349 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/act1.md:352 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 老师 asset=char_teacher_placeholder [占位符] position=left
````

#### source/story/act1.md:372 · 角色缺少素材

- 说话人“同学甲”没有任何含 asset 的 SHOW 声明。

````text
DIALOGUE:
同学甲：
这自我介绍也太像动画主角了吧……
````

#### source/story/act1.md:376 · 角色缺少素材

- 说话人“同学乙”没有任何含 asset 的 SHOW 声明。

````text
DIALOGUE:
同学乙：
还说什么遇到困难来找他……
````

#### source/story/act1.md:384 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 怪盗 asset=char_thief_smile [已有候选素材，尚未绑定] position=left
````

### a005 · 教室·座位安排

#### source/story/act1.md:406 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_morning [占位符]
````

#### source/story/act1.md:407 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_classroom_daily [占位符，延续]
````

#### source/story/act1.md:409 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 老师 asset=char_teacher_placeholder [占位符] position=left
````

#### source/story/act1.md:410 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/act1.md:411 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 怪盗 asset=char_thief_smile [已有候选素材，尚未绑定] position=back_left
````

#### source/story/act1.md:412 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=back_right
````

### a006 · 课间·带路的人选

#### source/story/act1.md:461 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_day [占位符]
````

#### source/story/act1.md:462 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_classroom_daily [占位符，延续]
````

#### source/story/act1.md:464 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/act1.md:465 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 老师 asset=char_teacher_placeholder [占位符] position=front
````

#### source/story/act1.md:466 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 怪盗 asset=char_thief_smile [已有候选素材，尚未绑定] position=window
````

#### source/story/act1.md:467 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
````

#### source/story/act1.md:468 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 反派 asset=char_villain_calm [占位符] position=back
````

### a007 · 课间·选择校园向导

#### source/story/act1.md:501 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_day [占位符]
````

#### source/story/act1.md:502 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_choice [占位符，待绑定]
````

#### source/story/act1.md:508 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §4.5：本切片仅启用选项 2；其他路线及 random_rd3 不执行。用户确认三个未完成场景完整保留并计入 19 场。

````text
STAGE:
【不可执行】原文只有选项名称，没有怪盗带路正文。
````

#### source/story/act1.md:514 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录玩家选择虚拟主播带路
````

#### source/story/act1.md:519 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §4.5：本切片仅启用选项 2；其他路线及 random_rd3 不执行。用户确认三个未完成场景完整保留并计入 19 场。

````text
STAGE:
【不可执行】原文只有选项名称，没有反派带路正文。
````

#### source/story/act1.md:525 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §4.5：本切片仅启用选项 2；其他路线及 random_rd3 不执行。用户确认三个未完成场景完整保留并计入 19 场。

````text
STAGE:
这是系统随机，不是玩家直接选择。
````

#### source/story/act1.md:527 · 调用待接入

- 调用 random_rd3 尚未接入；M0 只保留数据。
- 已有处理依据：任务书 §4.5：本切片仅启用选项 2；其他路线及 random_rd3 不执行。用户确认三个未完成场景完整保留并计入 19 场。

````text
CALL: random_rd3
````

#### source/story/act1.md:529 · 制作备注 / CHECK（只记录）

- 制作备注完整保留；默认不向玩家展示。
- CHECK 中的条件与嵌套 SET / JUMP 均不解释、不执行。
- 已有处理依据：任务书 §4.5：本切片仅启用选项 2；其他路线及 random_rd3 不执行。用户确认三个未完成场景完整保留并计入 19 场。

````text
CHECK: [系统随机结果 = 1] -> JUMP: A007_RANDOM_UNAVAILABLE
````

#### source/story/act1.md:530 · 制作备注 / 变量名待定 / CHECK（只记录）

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- CHECK 中的条件与嵌套 SET / JUMP 均不解释、不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
CHECK: [系统随机结果 = 2] -> SET: [变量名待定] 记录随机进入虚拟主播路线；JUMP: A008
````

#### source/story/act1.md:531 · 制作备注 / CHECK（只记录）

- 制作备注完整保留；默认不向玩家展示。
- CHECK 中的条件与嵌套 SET / JUMP 均不解释、不执行。
- 已有处理依据：任务书 §4.5：本切片仅启用选项 2；其他路线及 random_rd3 不执行。用户确认三个未完成场景完整保留并计入 19 场。

````text
CHECK: [系统随机结果 = 3] -> JUMP: A007_RANDOM_UNAVAILABLE
````

#### source/story/act1.md:533 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §4.5：本切片仅启用选项 2；其他路线及 random_rd3 不执行。用户确认三个未完成场景完整保留并计入 19 场。

````text
NARRATION:
【待确认】是否可以通过读取存档重新生成 `rd3` 结果。
````

### a007_todo_thief · 怪盗带路·未完成

#### source/story/act1.md:541 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_day [占位符]
````

#### source/story/act1.md:543 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §4.5：本切片仅启用选项 2；其他路线及 random_rd3 不执行。用户确认三个未完成场景完整保留并计入 19 场。

````text
NARRATION:
【不可执行】原文没有提供怪盗带男高参观校园的正文。
本场景不补写内容，不增加新的路线结果。
````

### a007_todo_villain · 反派带路·未完成

#### source/story/act1.md:554 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_day [占位符]
````

#### source/story/act1.md:556 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §4.5：本切片仅启用选项 2；其他路线及 random_rd3 不执行。用户确认三个未完成场景完整保留并计入 19 场。

````text
NARRATION:
【不可执行】原文没有提供反派带男高参观校园的正文。
本场景不补写内容，不增加新的路线结果。
````

### a007_random_unavailable · 随机结果对应未完成路线

#### source/story/act1.md:567 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_day [占位符]
````

#### source/story/act1.md:569 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §4.5：本切片仅启用选项 2；其他路线及 random_rd3 不执行。用户确认三个未完成场景完整保留并计入 19 场。

````text
NARRATION:
【不可执行】`rd3` 随机结果对应怪盗或反派路线，但该路线当前没有原文正文。
````

#### source/story/act1.md:572 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §4.5：本切片仅启用选项 2；其他路线及 random_rd3 不执行。用户确认三个未完成场景完整保留并计入 19 场。

````text
NARRATION:
【待确认】此处应返回选项、暂停流程，还是等待路线正文补充。
````

### a008 · 虚拟主播带路参观校园

#### source/story/act1.md:582 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_library_day [占位符]
````

#### source/story/act1.md:583 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_daily [占位符，待绑定]
````

#### source/story/act1.md:585 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/act1.md:586 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
````

#### source/story/act1.md:621 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_cafeteria_day [占位符]
````

#### source/story/act1.md:639 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_gym_day [占位符]
````

### a009 · 废弃施工区外围

#### source/story/act1.md:659 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_construction_zone_day [占位符]
````

#### source/story/act1.md:660 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_mystery [占位符，待绑定]
````

#### source/story/act1.md:662 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/act1.md:663 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
````

### a010 · 是否进入施工区域

#### source/story/act1.md:702 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_construction_zone_day [占位符]
````

#### source/story/act1.md:703 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_mystery [占位符，延续]
````

#### source/story/act1.md:707 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录男高选择进入施工区域
````

#### source/story/act1.md:708 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 增加男高对学校地下异常的调查进度
````

#### source/story/act1.md:713 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录男高选择返回班级
````

#### source/story/act1.md:714 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §4.5：M1 在选择“回班上”后单独显示此原文，再返回选项；导出仍保留 meta 和原始 JUMP。

````text
NARRATION:
【暂无线性后果】原文仅说明男高收回目光，决定先回班上，后续支线暂不展开。
````

### a011 · 施工区域·坑底与腐蚀之剑

#### source/story/act1.md:723 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_construction_zone_day [占位符]
````

#### source/story/act1.md:724 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_mystery [占位符，低音量]
````

#### source/story/act1.md:726 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/act1.md:727 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
````

#### source/story/act1.md:770 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_low_heartbeat [占位符]
````

#### source/story/act1.md:780 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 大师之剑 asset=prop_master_sword_corrupted_placeholder [占位符] position=bottom_center
````

#### source/story/act1.md:798 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：原文已有单线强制事件；保留制作备注，不增加分支。

````text
NARRATION:
【原文只有“选择 1：男高伸手触碰剑柄”，没有替代选项；本处转换为强制事件，不新增玩家分支。】
````

### a012 · 大师之剑·触碰与幻象

#### source/story/act1.md:808 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_construction_pit [占位符]
````

#### source/story/act1.md:809 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_master_sword_vision [占位符，待绑定]
````

#### source/story/act1.md:815 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_master_sword_resonance [占位符]
````

#### source/story/act1.md:816 · 占位素材 / 制作备注 / 未知指令

- 素材仍有原始占位 / 待绑定标记。
- 制作备注完整保留；默认不向玩家展示。
- 未定义的指令 CG；保留原文并隐藏，不中断导出。

````text
CG: cg_master_sword_vision_placeholder [占位符]
````

#### source/story/act1.md:817 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §3.3：镜头说明只供制作查看。

````text
CAMERA: 镜头从剑柄金色三角宝石推进至幻象。
````

#### source/story/act1.md:819 · 调用待接入

- 调用 event_master_sword_vision 尚未接入；M0 只保留数据。

````text
CALL: event_master_sword_vision
````

#### source/story/act1.md:821 · 制作备注

- 制作备注完整保留；默认不向玩家展示。

````text
NARRATION:
【待确认】该特殊事件只负责幻象、音效和画面演出，不在本脚本中补写林克的完整角色卡背景。
````

### a013 · 施工区域·黑色人形

#### source/story/act1.md:875 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_construction_pit [占位符]
````

#### source/story/act1.md:876 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_black_humanoid_appearance [占位符，待绑定]
````

#### source/story/act1.md:878 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=bottom_center
````

#### source/story/act1.md:879 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=top_right
````

#### source/story/act1.md:880 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑色人形 asset=char_black_humanoid_placeholder [占位符] position=bottom_left
````

#### source/story/act1.md:895 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_fainting [占位符]
````

### a014 · 黑色人形战斗

#### source/story/act1.md:919 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_construction_pit [占位符]
````

#### source/story/act1.md:920 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_black_humanoid_battle [占位符，待绑定]
````

#### source/story/act1.md:927 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §5.6 / §5.9 已规定战斗数值、胜负和重试；战斗奖励尚未规定，M0 不补写。

````text
NARRATION:
【待确认】黑色人形的战斗数据、胜利条件、失败处理和战斗奖励。
````

#### source/story/act1.md:935 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/act1.md:936 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
````

#### source/story/act1.md:954 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录虚拟主播目击黑色人形
````

#### source/story/act1.md:955 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 增加男高对学校地下异常的调查进度
````

### a015 · 回到学校

#### source/story/act1.md:963 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_hallway_day [占位符]
````

#### source/story/act1.md:964 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_mystery [占位符，低音量]
````

#### source/story/act1.md:966 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/act1.md:967 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=center_front
````

#### source/story/act1.md:976 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_school_bell [占位符]
````

#### source/story/act1.md:981 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录男高带虚拟主播返回学校
````

### a016 · 第一幕结束

#### source/story/act1.md:989 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_hallway_day [占位符]
````

#### source/story/act1.md:990 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_scene_transition [占位符，待绑定]
````

#### source/story/act1.md:995 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §1.1：第一幕结束后返回关卡选择，本切片到此结束。

````text
NARRATION:
【待确认】第一幕结束后是否直接进入下一幕，或先返回教室、保健室或其他校园场景。
````

#### source/story/act1.md:998 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录第一幕结束
````
