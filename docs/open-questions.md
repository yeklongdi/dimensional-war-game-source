# 内容问题与制作备注

> 由导出脚本覆盖生成；人工决定请记录到 decisions.md。原文与 source/ 均不改写。

场景：序幕（一）：搬来太阳市的前一天 9 / 序幕（二）：转学生来到太阳市第一高中 22 / 序幕（三）：床边的勇者 8 / 序幕（四）：警报下的同行者 13。

warning 共 **297 条**；同一原文位置的多个类别合并计一条。

条目包括已由任务书确定处理方式的制作备注；“已有处理依据”不会从原文或清单中删除。

## 优先待决事项

- **序幕（四）两场战斗待制作**：C003的battle_prologue4_patrol及C005的battle_prologue4_deoxys_encounter只保留调用并阻断，不能跳过或伪造胜利。分阶段目标、失败与数值仍需确认。
- **人物素材覆盖（已确认范围）**：用户决定有图按图、从者据官方图参考制作，且再次确认其他占位不用改。首批18张加男高10张，共28张；已定形象84组状态有半身表情显示。完整动作缺口见art/prologue-v2/README.md及art/hero-half-v1/README.md，不自行设计无图人物外貌。
- **未完成分支**：A007仅主播路线启用；A010返回班级分支播放已有文本后停止，不开放序幕（三）。新稿取代旧的自动返回选项约定。
- **A012 幻象演出如何绑定**：`event_master_sword_vision` 与 `CG: cg_master_sword_vision_placeholder` 尚无执行约定及绑定素材；请确定沿用占位演出，还是提供对应 CG / 音效映射。已有幻象旁白完整保留。
- **占位素材的绑定清单**：原文仍有背景、立绘、BGM、SFX占位标记；运行绑定见工程配置，不改原文标记。缺失项按任务书§16显式占位；同学甲乙与一般学生本轮保留场外对白。
- **旧稿待定变量与重复事件如何对应**：待定SET按幕、场景、序号生成flag；A010与A014都记录地下异常调查，后续是否合为事件仍待确认。新版明确布尔SET保留原变量名和值，本轮不自行改成数值系统。

## 序幕（一）：搬来太阳市的前一天（prologue）

### p001 · 奶奶家门前

#### source/story/prologue-v2/prologue.md:119 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_dusk [占位符]
````

#### source/story/prologue-v2/prologue.md:120 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_homecoming_warm [占位符，待绑定]
````

#### source/story/prologue-v2/prologue.md:122 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/prologue-v2/prologue.md:139 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_door_knock [占位符]
````

### p002 · 奶奶家·进门

#### source/story/prologue-v2/prologue.md:150 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_entrance [占位符]
````

#### source/story/prologue-v2/prologue.md:151 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_homecoming_warm [占位符，延续]
````

#### source/story/prologue-v2/prologue.md:153 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 奶奶 asset=char_grandmother_warm [占位符] position=door
````

### p003 · 奶奶家·客厅

#### source/story/prologue-v2/prologue.md:191 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_living_room [占位符]
````

#### source/story/prologue-v2/prologue.md:192 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_homecoming_warm [占位符，延续]
````

#### source/story/prologue-v2/prologue.md:194 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/prologue-v2/prologue.md:195 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 奶奶 asset=char_grandmother_warm [占位符] position=right
````

### p004 · 奶奶家·整理房间与出门

#### source/story/prologue-v2/prologue.md:239 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_bedroom [占位符]
````

#### source/story/prologue-v2/prologue.md:240 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_homecoming_warm [占位符，渐弱]
````

#### source/story/prologue-v2/prologue.md:242 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/prologue-v2/prologue.md:257 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_kitchen_night [占位符]
````

#### source/story/prologue-v2/prologue.md:258 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 奶奶 asset=char_grandmother_warm [占位符] position=kitchen
````

### p005 · 旧街区·仓库区外围

#### source/story/prologue-v2/prologue.md:287 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_sun_city_old_street_night [占位符]
````

#### source/story/prologue-v2/prologue.md:288 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_old_street_mystery [占位符，待绑定]
````

#### source/story/prologue-v2/prologue.md:290 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/prologue-v2/prologue.md:307 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_metal_collision [占位符]
````

#### source/story/prologue-v2/prologue.md:309 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §3.3：镜头说明只供制作查看。

````text
CAMERA: 镜头切换至高墙另一侧的月光下。
````

#### source/story/prologue-v2/prologue.md:310 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑衣人甲 asset=char_organization_member_placeholder [占位符] position=left
````

#### source/story/prologue-v2/prologue.md:311 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑衣人乙 asset=char_organization_member_placeholder [占位符] position=right
````

#### source/story/prologue-v2/prologue.md:312 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 蒙面人 asset=char_thief_masked_black_placeholder [占位符] position=center
````

#### source/story/prologue-v2/prologue.md:343 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录男高介入仓库区冲突
````

### p006 · 仓库区外围·第一次战斗

#### source/story/prologue-v2/prologue.md:351 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_warehouse_area_night [占位符]
````

#### source/story/prologue-v2/prologue.md:352 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_first_battle [占位符，待绑定]
````

#### source/story/prologue-v2/prologue.md:360 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录序幕战斗教学完成
````

#### source/story/prologue-v2/prologue.md:362 · 制作备注 / CHECK（只记录）

- 制作备注完整保留；默认不向玩家展示。
- CHECK 中的条件与嵌套 SET / JUMP 均不解释、不执行。
- 已有处理依据：任务书 §4.5：失败后重试本场且保留剧情进度；M0 只保留 CHECK 原文。

````text
CHECK: [战斗失败处理待确认]
````

#### source/story/prologue-v2/prologue.md:364 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：2026-10-18 用户确认：本句按制作备注隐藏。

````text
NARRATION:
战斗结果返回后，继续进入战斗结束场景。
````

### p007 · 仓库区外围·蒙面人离开

#### source/story/prologue-v2/prologue.md:373 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_warehouse_area_night [占位符]
````

#### source/story/prologue-v2/prologue.md:374 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_first_battle_after [占位符，待绑定]
````

#### source/story/prologue-v2/prologue.md:376 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/prologue-v2/prologue.md:384 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 蒙面人 asset=char_thief_masked_black_placeholder [占位符] position=far
````

#### source/story/prologue-v2/prologue.md:396 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_distant_warehouse_noise [占位符]
````

#### source/story/prologue-v2/prologue.md:402 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录蒙面人在男高面前离开
````

### p008 · 奶奶家·回家

#### source/story/prologue-v2/prologue.md:411 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_living_room_night [占位符]
````

#### source/story/prologue-v2/prologue.md:412 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_homecoming_warm [占位符，低音量]
````

#### source/story/prologue-v2/prologue.md:414 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/prologue-v2/prologue.md:415 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 奶奶 asset=char_grandmother_warm [占位符] position=right
````

### p009 · 男高房间·睡前

#### source/story/prologue-v2/prologue.md:468 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_bedroom_night [占位符]
````

#### source/story/prologue-v2/prologue.md:469 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_night_before_school [占位符，待绑定]
````

#### source/story/prologue-v2/prologue.md:471 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=bed
````

#### source/story/prologue-v2/prologue.md:494 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_underground_dark [占位符]
````

#### source/story/prologue-v2/prologue.md:495 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §3.3：镜头说明只供制作查看。

````text
CAMERA: 镜头缓慢推进黑暗中的漆黑结晶。
````

#### source/story/prologue-v2/prologue.md:496 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑色结晶 asset=prop_dark_god_crystal_placeholder [占位符] position=center
````

#### source/story/prologue-v2/prologue.md:498 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_low_heartbeat [占位符]
````

#### source/story/prologue-v2/prologue.md:503 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录序幕结束
````


## 序幕（二）：转学生来到太阳市第一高中（act1）

### a001 · 清晨睡过头

#### source/story/prologue-v2/act1.md:172 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_bedroom_morning [占位符]
````

#### source/story/prologue-v2/act1.md:173 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_morning [占位符，待绑定]
````

#### source/story/prologue-v2/act1.md:175 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/prologue-v2/act1.md:176 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 奶奶 asset=char_grandmother_warm [占位符] position=door
````

#### source/story/prologue-v2/act1.md:213 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
````

### a002 · 上学途中·路口相撞

#### source/story/prologue-v2/act1.md:235 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_sun_city_school_road_morning [占位符]
````

#### source/story/prologue-v2/act1.md:236 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_morning [占位符，延续]
````

#### source/story/prologue-v2/act1.md:238 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/prologue-v2/act1.md:246 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 怪盗 asset=char_thief_smile [已有候选素材，尚未绑定] position=right
````

#### source/story/prologue-v2/act1.md:265 · 制作备注

- 制作备注完整保留；默认不向玩家展示。

````text
INNER:
怪盗：
【原文未提供更多心声，此处不补写。】
````

### a003 · 学校门口

#### source/story/prologue-v2/act1.md:278 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_gate_morning [占位符]
````

#### source/story/prologue-v2/act1.md:279 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_morning [占位符，延续]
````

#### source/story/prologue-v2/act1.md:281 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/prologue-v2/act1.md:290 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 老师 asset=char_teacher_placeholder [占位符] position=left
````

#### source/story/prologue-v2/act1.md:310 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §3.3：镜头说明只供制作查看。

````text
CAMERA: 镜头切换到教学楼二楼走廊。
````

#### source/story/prologue-v2/act1.md:311 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 反派 asset=char_villain_calm [占位符] position=left
````

#### source/story/prologue-v2/act1.md:312 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 偶像 asset=char_idol_neutral [占位符] position=right
````

#### source/story/prologue-v2/act1.md:331 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑色结晶 asset=prop_dark_god_crystal_placeholder [占位符] position=center
````

#### source/story/prologue-v2/act1.md:332 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_low_heartbeat [占位符]
````

### a004 · 教室·自我介绍

#### source/story/prologue-v2/act1.md:348 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_morning [占位符]
````

#### source/story/prologue-v2/act1.md:349 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_classroom_daily [占位符，待绑定]
````

#### source/story/prologue-v2/act1.md:351 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/prologue-v2/act1.md:354 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 老师 asset=char_teacher_placeholder [占位符] position=left
````

#### source/story/prologue-v2/act1.md:374 · 角色缺少素材

- 说话人“同学甲”没有任何含 asset 的 SHOW 声明。

````text
DIALOGUE:
同学甲：
这自我介绍也太像动画主角了吧……
````

#### source/story/prologue-v2/act1.md:378 · 角色缺少素材

- 说话人“同学乙”没有任何含 asset 的 SHOW 声明。

````text
DIALOGUE:
同学乙：
还说什么遇到困难来找他……
````

#### source/story/prologue-v2/act1.md:386 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 怪盗 asset=char_thief_smile [已有候选素材，尚未绑定] position=left
````

### a005 · 教室·座位安排

#### source/story/prologue-v2/act1.md:408 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_morning [占位符]
````

#### source/story/prologue-v2/act1.md:409 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_classroom_daily [占位符，延续]
````

#### source/story/prologue-v2/act1.md:411 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 老师 asset=char_teacher_placeholder [占位符] position=left
````

#### source/story/prologue-v2/act1.md:412 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/prologue-v2/act1.md:413 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 怪盗 asset=char_thief_smile [已有候选素材，尚未绑定] position=back_left
````

#### source/story/prologue-v2/act1.md:414 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=back_right
````

### a006 · 课间·带路的人选

#### source/story/prologue-v2/act1.md:463 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_day [占位符]
````

#### source/story/prologue-v2/act1.md:464 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_classroom_daily [占位符，延续]
````

#### source/story/prologue-v2/act1.md:466 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/prologue-v2/act1.md:467 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 老师 asset=char_teacher_placeholder [占位符] position=front
````

#### source/story/prologue-v2/act1.md:468 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 怪盗 asset=char_thief_smile [已有候选素材，尚未绑定] position=window
````

#### source/story/prologue-v2/act1.md:469 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
````

#### source/story/prologue-v2/act1.md:470 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 反派 asset=char_villain_calm [占位符] position=back
````

### a007 · 课间·选择校园向导

#### source/story/prologue-v2/act1.md:503 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_day [占位符]
````

#### source/story/prologue-v2/act1.md:504 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_choice [占位符，待绑定]
````

#### source/story/prologue-v2/act1.md:510 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。

````text
STAGE:
【不可执行】原文只有选项名称，没有怪盗带路正文。
````

#### source/story/prologue-v2/act1.md:516 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录玩家选择虚拟主播带路
````

#### source/story/prologue-v2/act1.md:521 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。

````text
STAGE:
【不可执行】原文只有选项名称，没有反派带路正文。
````

#### source/story/prologue-v2/act1.md:527 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。

````text
STAGE:
这是系统随机，不是玩家直接选择。
````

#### source/story/prologue-v2/act1.md:529 · 调用待接入

- 调用 random_rd3 尚未接入；保留原始调用。新增战斗在运行时阻断。
- 已有处理依据：用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。

````text
CALL: random_rd3
````

#### source/story/prologue-v2/act1.md:531 · 制作备注 / CHECK（只记录）

- 制作备注完整保留；默认不向玩家展示。
- CHECK 中的条件与嵌套 SET / JUMP 均不解释、不执行。
- 已有处理依据：用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。

````text
CHECK: [系统随机结果 = 1] -> JUMP: A007_RANDOM_UNAVAILABLE
````

#### source/story/prologue-v2/act1.md:532 · 制作备注 / 变量名待定 / CHECK（只记录）

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- CHECK 中的条件与嵌套 SET / JUMP 均不解释、不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
CHECK: [系统随机结果 = 2] -> SET: [变量名待定] 记录随机进入虚拟主播路线；JUMP: A008
````

#### source/story/prologue-v2/act1.md:533 · 制作备注 / CHECK（只记录）

- 制作备注完整保留；默认不向玩家展示。
- CHECK 中的条件与嵌套 SET / JUMP 均不解释、不执行。
- 已有处理依据：用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。

````text
CHECK: [系统随机结果 = 3] -> JUMP: A007_RANDOM_UNAVAILABLE
````

#### source/story/prologue-v2/act1.md:535 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。

````text
NARRATION:
【待确认】是否可以通过读取存档重新生成 `rd3` 结果。
````

### a007_todo_thief · 怪盗带路·未完成

#### source/story/prologue-v2/act1.md:543 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_day [占位符]
````

#### source/story/prologue-v2/act1.md:545 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。

````text
NARRATION:
【不可执行】原文没有提供怪盗带男高参观校园的正文。
本场景不补写内容，不增加新的路线结果。
````

### a007_todo_villain · 反派带路·未完成

#### source/story/prologue-v2/act1.md:556 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_day [占位符]
````

#### source/story/prologue-v2/act1.md:558 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。

````text
NARRATION:
【不可执行】原文没有提供反派带男高参观校园的正文。
本场景不补写内容，不增加新的路线结果。
````

### a007_random_unavailable · 随机结果对应未完成路线

#### source/story/prologue-v2/act1.md:569 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_day [占位符]
````

#### source/story/prologue-v2/act1.md:571 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。

````text
NARRATION:
【不可执行】`rd3` 随机结果对应怪盗或反派路线，但该路线当前没有原文正文。
````

#### source/story/prologue-v2/act1.md:574 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。

````text
NARRATION:
【待确认】此处应返回选项、暂停流程，还是等待路线正文补充。
````

### a008 · 虚拟主播带路参观校园

#### source/story/prologue-v2/act1.md:584 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_library_day [占位符]
````

#### source/story/prologue-v2/act1.md:585 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_daily [占位符，待绑定]
````

#### source/story/prologue-v2/act1.md:587 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/prologue-v2/act1.md:588 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
````

#### source/story/prologue-v2/act1.md:623 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_cafeteria_day [占位符]
````

#### source/story/prologue-v2/act1.md:641 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_gym_day [占位符]
````

### a009 · 废弃施工区外围

#### source/story/prologue-v2/act1.md:661 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_construction_zone_day [占位符]
````

#### source/story/prologue-v2/act1.md:662 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_mystery [占位符，待绑定]
````

#### source/story/prologue-v2/act1.md:664 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/prologue-v2/act1.md:665 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
````

### a010 · 是否进入施工区域

#### source/story/prologue-v2/act1.md:704 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_construction_zone_day [占位符]
````

#### source/story/prologue-v2/act1.md:705 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_mystery [占位符，延续]
````

#### source/story/prologue-v2/act1.md:709 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录男高选择进入施工区域
````

#### source/story/prologue-v2/act1.md:710 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 增加男高对学校地下异常的调查进度
````

#### source/story/prologue-v2/act1.md:715 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录男高选择返回班级
````

#### source/story/prologue-v2/act1.md:716 · 制作备注

- 制作备注完整保留；默认不向玩家展示。

````text
NARRATION:
【分支占位】返回班级支线尚未展开，不接入未发生的拔剑与取剑事件。
````

### a011 · 施工区域·坑底与腐蚀之剑

#### source/story/prologue-v2/act1.md:725 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_construction_zone_day [占位符]
````

#### source/story/prologue-v2/act1.md:726 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_mystery [占位符，低音量]
````

#### source/story/prologue-v2/act1.md:728 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/prologue-v2/act1.md:729 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
````

#### source/story/prologue-v2/act1.md:772 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_low_heartbeat [占位符]
````

#### source/story/prologue-v2/act1.md:782 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 大师之剑 asset=prop_master_sword_corrupted_placeholder [占位符] position=bottom_center
````

#### source/story/prologue-v2/act1.md:800 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：原文已有单线强制事件；保留制作备注，不增加分支。

````text
NARRATION:
【原文只有“选择 1：男高伸手触碰剑柄”，没有替代选项；本处转换为强制事件，不新增玩家分支。】
````

### a012 · 大师之剑·触碰与幻象

#### source/story/prologue-v2/act1.md:810 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_construction_pit [占位符]
````

#### source/story/prologue-v2/act1.md:811 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_master_sword_vision [占位符，待绑定]
````

#### source/story/prologue-v2/act1.md:817 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_master_sword_resonance [占位符]
````

#### source/story/prologue-v2/act1.md:818 · 占位素材 / 制作备注 / 未知指令

- 素材仍有原始占位 / 待绑定标记。
- 制作备注完整保留；默认不向玩家展示。
- 未定义的指令 CG；保留原文并隐藏，不中断导出。

````text
CG: cg_master_sword_vision_placeholder [占位符]
````

#### source/story/prologue-v2/act1.md:819 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §3.3：镜头说明只供制作查看。

````text
CAMERA: 镜头从剑柄金色三角宝石推进至幻象。
````

#### source/story/prologue-v2/act1.md:821 · 调用待接入

- 调用 event_master_sword_vision 尚未接入；保留原始调用。新增战斗在运行时阻断。

````text
CALL: event_master_sword_vision
````

#### source/story/prologue-v2/act1.md:823 · 制作备注

- 制作备注完整保留；默认不向玩家展示。

````text
NARRATION:
【待确认】该特殊事件只负责幻象、音效和画面演出，不在本脚本中补写林克的完整角色卡背景。
````

### a013 · 施工区域·黑色人形

#### source/story/prologue-v2/act1.md:877 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_construction_pit [占位符]
````

#### source/story/prologue-v2/act1.md:878 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_black_humanoid_appearance [占位符，待绑定]
````

#### source/story/prologue-v2/act1.md:880 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=bottom_center
````

#### source/story/prologue-v2/act1.md:881 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=top_right
````

#### source/story/prologue-v2/act1.md:882 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑色人形 asset=char_black_humanoid_placeholder [占位符] position=bottom_left
````

#### source/story/prologue-v2/act1.md:897 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_fainting [占位符]
````

### a014 · 黑色人形战斗

#### source/story/prologue-v2/act1.md:921 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_construction_pit [占位符]
````

#### source/story/prologue-v2/act1.md:922 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_black_humanoid_battle [占位符，待绑定]
````

#### source/story/prologue-v2/act1.md:929 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §5.6 / §5.9 已规定战斗数值、胜负和重试；战斗奖励尚未规定，M0 不补写。

````text
NARRATION:
【待确认】黑色人形的战斗数据、胜利条件、失败处理和战斗奖励。
````

#### source/story/prologue-v2/act1.md:937 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/prologue-v2/act1.md:938 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
````

#### source/story/prologue-v2/act1.md:956 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录虚拟主播目击黑色人形
````

#### source/story/prologue-v2/act1.md:957 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 增加男高对学校地下异常的调查进度
````

### a015 · 回到学校

#### source/story/prologue-v2/act1.md:965 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_hallway_day [占位符]
````

#### source/story/prologue-v2/act1.md:966 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_mystery [占位符，低音量]
````

#### source/story/prologue-v2/act1.md:968 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/prologue-v2/act1.md:969 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=center_front
````

#### source/story/prologue-v2/act1.md:978 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_school_bell [占位符]
````

#### source/story/prologue-v2/act1.md:983 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录男高带虚拟主播返回学校
````

### a015_recovery · 保健室与照顾交接

#### source/story/prologue-v2/act1.md:991 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_infirmary_day [制作占位]
````

#### source/story/prologue-v2/act1.md:992 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_daily [制作占位／待绑定]
````

#### source/story/prologue-v2/act1.md:994 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/prologue-v2/act1.md:998 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
````

#### source/story/prologue-v2/act1.md:1005 · 角色缺少素材

- 说话人“保健室老师”没有任何含 asset 的 SHOW 声明。

````text
DIALOGUE:
保健室老师：
先把她交给我。你去叫班主任，回来再把经过说清楚。
````

### a015_retrieve · 放学返回施工区取剑

#### source/story/prologue-v2/act1.md:1040 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_construction_zone_dusk [制作占位]
````

#### source/story/prologue-v2/act1.md:1041 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_sword_quiet_mystery [制作占位／待绑定]
````

#### source/story/prologue-v2/act1.md:1045 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

### a016 · 序幕（二）取剑主线结束

#### source/story/prologue-v2/act1.md:1083 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_dusk [制作占位]
````

#### source/story/prologue-v2/act1.md:1084 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_scene_transition [占位符，待绑定]
````

#### source/story/prologue-v2/act1.md:1086 · 制作备注 / CHECK（只记录）

- 制作备注完整保留；默认不向玩家展示。
- CHECK 中的条件与嵌套 SET / JUMP 均不解释、不执行。

````text
CHECK: has_master_sword == true [仅取剑主线可进入此终点]
````

#### source/story/prologue-v2/act1.md:1091 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录序幕（二）主线结束
````

### a010_return_class · 返回班级·未完成支线

#### source/story/prologue-v2/act1.md:1099 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_day [占位符]
````

#### source/story/prologue-v2/act1.md:1100 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_daily [占位符]
````


## 序幕（三）：床边的勇者（prologue_3）

### b001 · 晚饭与新同学

#### source/story/prologue-v2/prologue_3.md:51 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_dining_evening [制作占位]
````

#### source/story/prologue-v2/prologue_3.md:52 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_homecoming_warm [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_3.md:54 · 制作备注 / CHECK（只记录）

- 制作备注完整保留；默认不向玩家展示。
- CHECK 中的条件与嵌套 SET / JUMP 均不解释、不执行。

````text
CHECK: has_master_sword == true [章节入口约束；未满足时不得接入本幕]
````

#### source/story/prologue-v2/prologue_3.md:56 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_3.md:60 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 奶奶 asset=char_grandmother_warm [占位符／待核对复用] position=right
````

### b002 · 床边的大师之剑

#### source/story/prologue-v2/prologue_3.md:125 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_bedroom_night [制作占位]
````

#### source/story/prologue-v2/prologue_3.md:126 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_sword_quiet_mystery [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_3.md:131 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_3.md:159 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_light_switch [制作占位]
````

### b003 · 没有尽头的晚饭

#### source/story/prologue-v2/prologue_3.md:174 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_dining_evening [制作占位]
````

#### source/story/prologue-v2/prologue_3.md:175 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_homecoming_warm_dream [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_3.md:179 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_3.md:183 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 奶奶 asset=char_grandmother_warm [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_3.md:200 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_clock_tick_stop [制作占位]
````

### b004 · 雾中的邀请

#### source/story/prologue-v2/prologue_3.md:229 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_dream_dining_fog [制作占位]
````

#### source/story/prologue-v2/prologue_3.md:230 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_nightmare_invitation [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_3.md:235 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_3.md:242 · 角色缺少素材

- 说话人“雾中的声音”没有任何含 asset 的 SHOW 声明。

````text
DIALOGUE:
雾中的声音：
欢迎来到……属于你的梦。
````

### b005 · 男高拒绝留下

#### source/story/prologue-v2/prologue_3.md:294 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_dream_house_loop [制作占位]
````

#### source/story/prologue-v2/prologue_3.md:295 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_nightmare_pressure [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_3.md:299 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_3.md:306 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_door_loop [制作占位]
````

#### source/story/prologue-v2/prologue_3.md:318 · 角色缺少素材

- 说话人“雾中的声音”没有任何含 asset 的 SHOW 声明。

````text
DIALOGUE:
雾中的声音：
你坐下就好了呀。坐下来，再睡一会儿。
````

### b006 · 梦外的剑鸣

#### source/story/prologue-v2/prologue_3.md:354 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_dream_house_loop [制作占位]
````

#### source/story/prologue-v2/prologue_3.md:355 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_sword_answer [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_3.md:359 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_3.md:366 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_master_sword_resonance [制作占位]
````

#### source/story/prologue-v2/prologue_3.md:376 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_bedroom_night [制作占位，场内切镜]
````

#### source/story/prologue-v2/prologue_3.md:381 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_dream_house_loop [制作占位，场内切镜]
````

#### source/story/prologue-v2/prologue_3.md:382 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_3.md:396 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=right
````

### b007 · 一剑斩断噩梦

#### source/story/prologue-v2/prologue_3.md:415 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_dream_house_fracture [制作占位]
````

#### source/story/prologue-v2/prologue_3.md:416 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_sword_breaks_dream [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_3.md:421 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_3.md:425 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_3.md:429 · 角色缺少素材

- 说话人“雾中的声音”没有任何含 asset 的 SHOW 声明。

````text
DIALOGUE:
雾中的声音：
这里是我的——
````

#### source/story/prologue-v2/prologue_3.md:436 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_sword_cuts_dream [制作占位]
````

### b008 · 醒来后的陌生人

#### source/story/prologue-v2/prologue_3.md:466 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_bedroom_night [制作占位]
````

#### source/story/prologue-v2/prologue_3.md:467 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_after_dream_quiet [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_3.md:472 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_3.md:476 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=right
````


## 序幕（四）：警报下的同行者（prologue_4）

### c001 · 警报与搜捕队

#### source/story/prologue-v2/prologue_4.md:63 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_bedroom_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:64 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_after_dream_quiet [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:66 · 制作备注 / CHECK（只记录）

- 制作备注完整保留；默认不向玩家展示。
- CHECK 中的条件与嵌套 SET / JUMP 均不解释、不执行。

````text
CHECK: prologue_3_complete == true AND link_summoned == true [章节入口约束；未满足时不得接入本幕]
````

#### source/story/prologue-v2/prologue_4.md:68 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:72 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:76 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_search_vehicle_alarm [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:97 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_residential_search_night [制作占位，场内切镜]
````

#### source/story/prologue-v2/prologue_4.md:102 · 角色缺少素材

- 说话人“搜捕通讯”没有任何含 asset 的 SHOW 声明。

````text
DIALOGUE:
搜捕通讯：
梦境反应确认。位置在这片住宅区。
````

#### source/story/prologue-v2/prologue_4.md:113 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_bedroom_night [制作占位，场内切镜]
````

#### source/story/prologue-v2/prologue_4.md:114 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:117 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

### c002 · 出门与认出

#### source/story/prologue-v2/prologue_4.md:131 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_residential_junction_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:132 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_organization_tension [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:137 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:141 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:145 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑衣队员 asset=char_organization_member_placeholder [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_4.md:191 · 角色缺少素材

- 说话人“搜捕通讯”没有任何含 asset 的 SHOW 声明。

````text
DIALOGUE:
搜捕通讯：
路口小组控制现场。其余小组继续找实验体，不要全部离开搜索区域。
````

### c003 · 第一次配合

#### source/story/prologue-v2/prologue_4.md:202 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_district_access_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:203 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_first_partners_battle [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:209 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:213 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:217 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑衣队员 asset=char_organization_member_placeholder [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_4.md:231 · 调用待接入

- 调用 battle_prologue4_patrol 尚未接入；保留原始调用。新增战斗在运行时阻断。

````text
CALL: battle_prologue4_patrol
````

### c004 · 第一名干部到场

#### source/story/prologue-v2/prologue_4.md:263 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_district_battle_street_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:264 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_foreigner_approach [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:270 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:274 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:278 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑衣干部甲 asset=char_organization_officer_a_placeholder [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_4.md:292 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 不明生物·普通型 asset=char_deoxys_normal_placeholder [占位符／待核对复用] position=right
````

### c005 · 林克明显占优

#### source/story/prologue-v2/prologue_4.md:324 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_district_battle_street_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:325 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_link_advantage [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:332 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:336 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:340 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 不明生物·普通型 asset=char_deoxys_normal_placeholder [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_4.md:347 · 调用待接入

- 调用 battle_prologue4_deoxys_encounter 尚未接入；保留原始调用。新增战斗在运行时阻断。

````text
CALL: battle_prologue4_deoxys_encounter
````

#### source/story/prologue-v2/prologue_4.md:349 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_sword_energy_clash [制作占位]
````

### c006 · 防御型与第二名干部加入

#### source/story/prologue-v2/prologue_4.md:380 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_district_battle_street_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:381 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_organization_reinforcements [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:387 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:391 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:395 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 不明生物·普通型 asset=char_deoxys_normal_placeholder [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_4.md:399 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 不明生物·防御型 asset=char_deoxys_defense_placeholder [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_4.md:403 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_barrier_impact [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:415 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑衣干部乙 asset=char_organization_officer_b_placeholder [占位符／待核对复用] position=right
````

### c007 · 局势转为棘手

#### source/story/prologue-v2/prologue_4.md:436 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_district_battle_street_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:437 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_encirclement_pressure [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:445 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:449 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

### c008 · 怪盗与女剑士接应

#### source/story/prologue-v2/prologue_4.md:490 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_district_battle_street_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:491 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_thief_escape [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:496 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:500 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:504 · 角色缺少素材

- 说话人“墙侧的声音”没有任何含 asset 的 SHOW 声明。

````text
DIALOGUE:
墙侧的声音：
再往那边退，可真没路了。
````

#### source/story/prologue-v2/prologue_4.md:508 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 蒙面人 asset=char_thief_masked_black_placeholder [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:529 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_district_escape_alley_night [制作占位，场内切镜]
````

#### source/story/prologue-v2/prologue_4.md:531 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 女剑士 asset=char_saber_traveler_placeholder [占位符／待核对复用] position=right
````

### c009 · 小巷中的真实身份

#### source/story/prologue-v2/prologue_4.md:555 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_district_quiet_alley_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:556 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_thief_reveal_quiet [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:563 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:567 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:571 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 蒙面人 asset=char_thief_masked_black_placeholder [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_4.md:575 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 女剑士 asset=char_saber_traveler_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:591 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 怪盗 asset=char_thief_smile [占位符／待核对复用] position=right
````

### c010 · 圣杯战争的最低限度说明

#### source/story/prologue-v2/prologue_4.md:642 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_district_quiet_alley_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:643 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_holy_grail_explanation [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:650 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:654 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 怪盗 asset=char_thief_smile [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_4.md:658 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:662 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 女剑士 asset=char_saber_traveler_placeholder [占位符／待核对复用] position=center
````

### c011 · 介绍 Saber

#### source/story/prologue-v2/prologue_4.md:736 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_district_quiet_alley_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:737 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_temporary_companions [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:744 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:748 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 怪盗 asset=char_thief_smile [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_4.md:752 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 女剑士 asset=char_saber_traveler_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:762 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: Saber asset=char_saber_traveler_placeholder [占位符／待核对复用] position=center
````

### c012 · 暂时合作

#### source/story/prologue-v2/prologue_4.md:797 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_district_quiet_alley_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:798 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_temporary_companions [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:804 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:808 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 怪盗 asset=char_thief_smile [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_4.md:812 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:816 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 女剑士 asset=char_saber_traveler_placeholder [占位符／待核对复用] position=center
````

### c013 · 夜归与新的同伴

#### source/story/prologue-v2/prologue_4.md:873 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_entrance_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:874 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_homecoming_warm_low [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:881 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:885 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:889 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 奶奶 asset=char_grandmother_warm [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_4.md:925 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_living_room_night [制作占位，场内切镜]
````

#### source/story/prologue-v2/prologue_4.md:942 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_bedroom_night [制作占位，场内切镜]
````
