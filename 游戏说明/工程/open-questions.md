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

#### source/story/prologue-v2/prologue.md:140 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_door_knock [占位符]
````

### p002 · 奶奶家·进门

#### source/story/prologue-v2/prologue.md:151 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_entrance [占位符]
````

#### source/story/prologue-v2/prologue.md:152 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_homecoming_warm [占位符，延续]
````

#### source/story/prologue-v2/prologue.md:154 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 奶奶 asset=char_grandmother_warm [占位符] position=door
````

### p003 · 奶奶家·客厅

#### source/story/prologue-v2/prologue.md:192 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_living_room [占位符]
````

#### source/story/prologue-v2/prologue.md:193 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_homecoming_warm [占位符，延续]
````

#### source/story/prologue-v2/prologue.md:195 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/prologue-v2/prologue.md:196 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 奶奶 asset=char_grandmother_warm [占位符] position=right
````

### p004 · 奶奶家·整理房间与出门

#### source/story/prologue-v2/prologue.md:251 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_bedroom [占位符]
````

#### source/story/prologue-v2/prologue.md:252 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_homecoming_warm [占位符，渐弱]
````

#### source/story/prologue-v2/prologue.md:254 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/prologue-v2/prologue.md:273 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_kitchen_night [占位符]
````

#### source/story/prologue-v2/prologue.md:274 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 奶奶 asset=char_grandmother_warm [占位符] position=kitchen
````

### p005 · 旧街区·仓库区外围

#### source/story/prologue-v2/prologue.md:303 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_sun_city_old_street_night [占位符]
````

#### source/story/prologue-v2/prologue.md:304 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_old_street_mystery [占位符，待绑定]
````

#### source/story/prologue-v2/prologue.md:306 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/prologue-v2/prologue.md:323 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_metal_collision [占位符]
````

#### source/story/prologue-v2/prologue.md:325 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §3.3：镜头说明只供制作查看。

````text
CAMERA: 镜头切换至高墙另一侧的月光下。
````

#### source/story/prologue-v2/prologue.md:326 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑衣人甲 asset=char_organization_member_placeholder [占位符] position=left
````

#### source/story/prologue-v2/prologue.md:327 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑衣人乙 asset=char_organization_member_placeholder [占位符] position=right
````

#### source/story/prologue-v2/prologue.md:328 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 蒙面人 asset=char_thief_masked_black_placeholder [占位符] position=center
````

#### source/story/prologue-v2/prologue.md:360 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录男高介入仓库区冲突
````

### p006 · 仓库区外围·第一次战斗

#### source/story/prologue-v2/prologue.md:368 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_warehouse_area_night [占位符]
````

#### source/story/prologue-v2/prologue.md:369 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_first_battle [占位符，待绑定]
````

#### source/story/prologue-v2/prologue.md:377 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录序幕战斗教学完成
````

#### source/story/prologue-v2/prologue.md:379 · 制作备注 / CHECK（只记录）

- 制作备注完整保留；默认不向玩家展示。
- CHECK 中的条件与嵌套 SET / JUMP 均不解释、不执行。
- 已有处理依据：任务书 §4.5：失败后重试本场且保留剧情进度；M0 只保留 CHECK 原文。

````text
CHECK: [战斗失败处理待确认]
````

#### source/story/prologue-v2/prologue.md:381 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：2026-10-18 用户确认：本句按制作备注隐藏。

````text
NARRATION:
战斗结果返回后，继续进入战斗结束场景。
````

### p007 · 仓库区外围·蒙面人离开

#### source/story/prologue-v2/prologue.md:390 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_warehouse_area_night [占位符]
````

#### source/story/prologue-v2/prologue.md:391 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_first_battle_after [占位符，待绑定]
````

#### source/story/prologue-v2/prologue.md:393 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/prologue-v2/prologue.md:401 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 蒙面人 asset=char_thief_masked_black_placeholder [占位符] position=far
````

#### source/story/prologue-v2/prologue.md:415 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_distant_warehouse_noise [占位符]
````

#### source/story/prologue-v2/prologue.md:421 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录蒙面人在男高面前离开
````

### p008 · 奶奶家·回家

#### source/story/prologue-v2/prologue.md:430 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_living_room_night [占位符]
````

#### source/story/prologue-v2/prologue.md:431 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_homecoming_warm [占位符，低音量]
````

#### source/story/prologue-v2/prologue.md:433 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/prologue-v2/prologue.md:434 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 奶奶 asset=char_grandmother_warm [占位符] position=right
````

### p009 · 男高房间·睡前

#### source/story/prologue-v2/prologue.md:485 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_bedroom_night [占位符]
````

#### source/story/prologue-v2/prologue.md:486 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_night_before_school [占位符，待绑定]
````

#### source/story/prologue-v2/prologue.md:488 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=bed
````

#### source/story/prologue-v2/prologue.md:513 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_underground_dark [占位符]
````

#### source/story/prologue-v2/prologue.md:514 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §3.3：镜头说明只供制作查看。

````text
CAMERA: 镜头缓慢推进黑暗中的漆黑结晶。
````

#### source/story/prologue-v2/prologue.md:515 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑色结晶 asset=prop_dark_god_crystal_placeholder [占位符] position=center
````

#### source/story/prologue-v2/prologue.md:517 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_low_heartbeat [占位符]
````

#### source/story/prologue-v2/prologue.md:522 · 制作备注 / 变量名待定

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

#### source/story/prologue-v2/act1.md:221 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
````

### a002 · 上学途中·路口相撞

#### source/story/prologue-v2/act1.md:243 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_sun_city_school_road_morning [占位符]
````

#### source/story/prologue-v2/act1.md:244 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_morning [占位符，延续]
````

#### source/story/prologue-v2/act1.md:246 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/prologue-v2/act1.md:254 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 怪盗 asset=char_thief_smile [已有候选素材，尚未绑定] position=right
````

#### source/story/prologue-v2/act1.md:281 · 制作备注

- 制作备注完整保留；默认不向玩家展示。

````text
INNER:
怪盗：
【原文未提供更多心声，此处不补写。】
````

### a003 · 学校门口

#### source/story/prologue-v2/act1.md:294 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_gate_morning [占位符]
````

#### source/story/prologue-v2/act1.md:295 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_morning [占位符，延续]
````

#### source/story/prologue-v2/act1.md:297 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/prologue-v2/act1.md:306 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 老师 asset=char_teacher_placeholder [占位符] position=left
````

#### source/story/prologue-v2/act1.md:329 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §3.3：镜头说明只供制作查看。

````text
CAMERA: 镜头切换到教学楼二楼走廊。
````

#### source/story/prologue-v2/act1.md:330 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 反派 asset=char_villain_calm [占位符] position=left
````

#### source/story/prologue-v2/act1.md:331 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 偶像 asset=char_idol_neutral [占位符] position=right
````

#### source/story/prologue-v2/act1.md:359 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑色结晶 asset=prop_dark_god_crystal_placeholder [占位符] position=center
````

#### source/story/prologue-v2/act1.md:360 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_low_heartbeat [占位符]
````

### a004 · 教室·自我介绍

#### source/story/prologue-v2/act1.md:376 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_morning [占位符]
````

#### source/story/prologue-v2/act1.md:377 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_classroom_daily [占位符，待绑定]
````

#### source/story/prologue-v2/act1.md:379 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/prologue-v2/act1.md:382 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 老师 asset=char_teacher_placeholder [占位符] position=left
````

#### source/story/prologue-v2/act1.md:403 · 角色缺少素材

- 说话人“同学甲”没有任何含 asset 的 SHOW 声明。

````text
DIALOGUE:
同学甲：
这自我介绍也太像动画主角了吧……
````

#### source/story/prologue-v2/act1.md:407 · 角色缺少素材

- 说话人“同学乙”没有任何含 asset 的 SHOW 声明。

````text
DIALOGUE:
同学乙：
转学第一天就放出这种话，真有自信。
````

#### source/story/prologue-v2/act1.md:415 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 怪盗 asset=char_thief_smile [已有候选素材，尚未绑定] position=left
````

### a005 · 教室·座位安排

#### source/story/prologue-v2/act1.md:437 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_morning [占位符]
````

#### source/story/prologue-v2/act1.md:438 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_classroom_daily [占位符，延续]
````

#### source/story/prologue-v2/act1.md:440 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 老师 asset=char_teacher_placeholder [占位符] position=left
````

#### source/story/prologue-v2/act1.md:441 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/prologue-v2/act1.md:442 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 怪盗 asset=char_thief_smile [已有候选素材，尚未绑定] position=back_left
````

#### source/story/prologue-v2/act1.md:443 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=back_right
````

### a006 · 课间·带路的人选

#### source/story/prologue-v2/act1.md:500 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_day [占位符]
````

#### source/story/prologue-v2/act1.md:501 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_classroom_daily [占位符，延续]
````

#### source/story/prologue-v2/act1.md:503 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/prologue-v2/act1.md:504 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 老师 asset=char_teacher_placeholder [占位符] position=front
````

#### source/story/prologue-v2/act1.md:505 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 怪盗 asset=char_thief_smile [已有候选素材，尚未绑定] position=window
````

#### source/story/prologue-v2/act1.md:506 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
````

#### source/story/prologue-v2/act1.md:507 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 反派 asset=char_villain_calm [占位符] position=back
````

### a007 · 课间·选择校园向导

#### source/story/prologue-v2/act1.md:540 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_day [占位符]
````

#### source/story/prologue-v2/act1.md:541 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_choice [占位符，待绑定]
````

#### source/story/prologue-v2/act1.md:547 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。

````text
STAGE:
【不可执行】原文只有选项名称，没有怪盗带路正文。
````

#### source/story/prologue-v2/act1.md:553 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录玩家选择虚拟主播带路
````

#### source/story/prologue-v2/act1.md:558 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。

````text
STAGE:
【不可执行】原文只有选项名称，没有反派带路正文。
````

#### source/story/prologue-v2/act1.md:564 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。

````text
STAGE:
这是系统随机，不是玩家直接选择。
````

#### source/story/prologue-v2/act1.md:566 · 调用待接入

- 调用 random_rd3 尚未接入；保留原始调用。新增战斗在运行时阻断。
- 已有处理依据：用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。

````text
CALL: random_rd3
````

#### source/story/prologue-v2/act1.md:568 · 制作备注 / CHECK（只记录）

- 制作备注完整保留；默认不向玩家展示。
- CHECK 中的条件与嵌套 SET / JUMP 均不解释、不执行。
- 已有处理依据：用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。

````text
CHECK: [系统随机结果 = 1] -> JUMP: A007_RANDOM_UNAVAILABLE
````

#### source/story/prologue-v2/act1.md:569 · 制作备注 / 变量名待定 / CHECK（只记录）

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- CHECK 中的条件与嵌套 SET / JUMP 均不解释、不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
CHECK: [系统随机结果 = 2] -> SET: [变量名待定] 记录随机进入虚拟主播路线；JUMP: A008
````

#### source/story/prologue-v2/act1.md:570 · 制作备注 / CHECK（只记录）

- 制作备注完整保留；默认不向玩家展示。
- CHECK 中的条件与嵌套 SET / JUMP 均不解释、不执行。
- 已有处理依据：用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。

````text
CHECK: [系统随机结果 = 3] -> JUMP: A007_RANDOM_UNAVAILABLE
````

#### source/story/prologue-v2/act1.md:572 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。

````text
NARRATION:
【待确认】是否可以通过读取存档重新生成 `rd3` 结果。
````

### a007_todo_thief · 怪盗带路·未完成

#### source/story/prologue-v2/act1.md:580 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_day [占位符]
````

#### source/story/prologue-v2/act1.md:582 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。

````text
NARRATION:
【不可执行】原文没有提供怪盗带男高参观校园的正文。
本场景不补写内容，不增加新的路线结果。
````

### a007_todo_villain · 反派带路·未完成

#### source/story/prologue-v2/act1.md:593 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_day [占位符]
````

#### source/story/prologue-v2/act1.md:595 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。

````text
NARRATION:
【不可执行】原文没有提供反派带男高参观校园的正文。
本场景不补写内容，不增加新的路线结果。
````

### a007_random_unavailable · 随机结果对应未完成路线

#### source/story/prologue-v2/act1.md:606 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_day [占位符]
````

#### source/story/prologue-v2/act1.md:608 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。

````text
NARRATION:
【不可执行】`rd3` 随机结果对应怪盗或反派路线，但该路线当前没有原文正文。
````

#### source/story/prologue-v2/act1.md:611 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：用户确认：A007仅启用选项2；其他路线及random_rd3不执行，未完成分支保留。新版序幕（二）为18主场景及4未完成分支。

````text
NARRATION:
【待确认】此处应返回选项、暂停流程，还是等待路线正文补充。
````

### a008 · 虚拟主播带路参观校园

#### source/story/prologue-v2/act1.md:621 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_library_day [占位符]
````

#### source/story/prologue-v2/act1.md:622 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_daily [占位符，待绑定]
````

#### source/story/prologue-v2/act1.md:624 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/prologue-v2/act1.md:625 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
````

#### source/story/prologue-v2/act1.md:664 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_cafeteria_day [占位符]
````

#### source/story/prologue-v2/act1.md:693 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_gym_day [占位符]
````

### a009 · 废弃施工区外围

#### source/story/prologue-v2/act1.md:713 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_construction_zone_day [占位符]
````

#### source/story/prologue-v2/act1.md:714 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_mystery [占位符，待绑定]
````

#### source/story/prologue-v2/act1.md:716 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/prologue-v2/act1.md:717 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
````

### a010 · 是否进入施工区域

#### source/story/prologue-v2/act1.md:756 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_construction_zone_day [占位符]
````

#### source/story/prologue-v2/act1.md:757 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_mystery [占位符，延续]
````

#### source/story/prologue-v2/act1.md:761 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录男高选择进入施工区域
````

#### source/story/prologue-v2/act1.md:762 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 增加男高对学校地下异常的调查进度
````

#### source/story/prologue-v2/act1.md:767 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录男高选择返回班级
````

#### source/story/prologue-v2/act1.md:768 · 制作备注

- 制作备注完整保留；默认不向玩家展示。

````text
NARRATION:
【分支占位】返回班级支线尚未展开，不接入未发生的拔剑与取剑事件。
````

### a011 · 施工区域·坑底与腐蚀之剑

#### source/story/prologue-v2/act1.md:777 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_construction_zone_day [占位符]
````

#### source/story/prologue-v2/act1.md:778 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_mystery [占位符，低音量]
````

#### source/story/prologue-v2/act1.md:780 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/prologue-v2/act1.md:781 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
````

#### source/story/prologue-v2/act1.md:842 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_low_heartbeat [占位符]
````

#### source/story/prologue-v2/act1.md:852 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 大师之剑 asset=prop_master_sword_corrupted_placeholder [占位符] position=bottom_center
````

#### source/story/prologue-v2/act1.md:874 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：原文已有单线强制事件；保留制作备注，不增加分支。

````text
NARRATION:
【原文只有“选择 1：男高伸手触碰剑柄”，没有替代选项；本处转换为强制事件，不新增玩家分支。】
````

### a012 · 大师之剑·触碰与幻象

#### source/story/prologue-v2/act1.md:884 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_construction_pit [占位符]
````

#### source/story/prologue-v2/act1.md:885 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_master_sword_vision [占位符，待绑定]
````

#### source/story/prologue-v2/act1.md:891 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_master_sword_resonance [占位符]
````

#### source/story/prologue-v2/act1.md:892 · 占位素材 / 制作备注 / 未知指令

- 素材仍有原始占位 / 待绑定标记。
- 制作备注完整保留；默认不向玩家展示。
- 未定义的指令 CG；保留原文并隐藏，不中断导出。

````text
CG: cg_master_sword_vision_placeholder [占位符]
````

#### source/story/prologue-v2/act1.md:893 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §3.3：镜头说明只供制作查看。

````text
CAMERA: 镜头从剑柄金色三角宝石推进至幻象。
````

#### source/story/prologue-v2/act1.md:895 · 调用待接入

- 调用 event_master_sword_vision 尚未接入；保留原始调用。新增战斗在运行时阻断。

````text
CALL: event_master_sword_vision
````

#### source/story/prologue-v2/act1.md:897 · 制作备注

- 制作备注完整保留；默认不向玩家展示。

````text
NARRATION:
【待确认】该特殊事件只负责幻象、音效和画面演出，不在本脚本中补写林克的完整角色卡背景。
````

### a013 · 施工区域·黑色人形

#### source/story/prologue-v2/act1.md:951 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_construction_pit [占位符]
````

#### source/story/prologue-v2/act1.md:952 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_black_humanoid_appearance [占位符，待绑定]
````

#### source/story/prologue-v2/act1.md:954 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=bottom_center
````

#### source/story/prologue-v2/act1.md:955 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=top_right
````

#### source/story/prologue-v2/act1.md:956 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑色人形 asset=char_black_humanoid_placeholder [占位符] position=bottom_left
````

#### source/story/prologue-v2/act1.md:978 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_fainting [占位符]
````

### a014 · 黑色人形战斗

#### source/story/prologue-v2/act1.md:1008 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_construction_pit [占位符]
````

#### source/story/prologue-v2/act1.md:1009 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_black_humanoid_battle [占位符，待绑定]
````

#### source/story/prologue-v2/act1.md:1016 · 制作备注

- 制作备注完整保留；默认不向玩家展示。
- 已有处理依据：任务书 §5.6 / §5.9 已规定战斗数值、胜负和重试；战斗奖励尚未规定，M0 不补写。

````text
NARRATION:
【待确认】黑色人形的战斗数据、胜利条件、失败处理和战斗奖励。
````

#### source/story/prologue-v2/act1.md:1024 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/prologue-v2/act1.md:1025 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
````

#### source/story/prologue-v2/act1.md:1043 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录虚拟主播目击黑色人形
````

#### source/story/prologue-v2/act1.md:1044 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 增加男高对学校地下异常的调查进度
````

### a015 · 回到学校

#### source/story/prologue-v2/act1.md:1052 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_hallway_day [占位符]
````

#### source/story/prologue-v2/act1.md:1053 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_mystery [占位符，低音量]
````

#### source/story/prologue-v2/act1.md:1055 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

#### source/story/prologue-v2/act1.md:1056 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=center_front
````

#### source/story/prologue-v2/act1.md:1065 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_school_bell [占位符]
````

#### source/story/prologue-v2/act1.md:1070 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录男高带虚拟主播返回学校
````

### a015_recovery · 保健室与照顾交接

#### source/story/prologue-v2/act1.md:1078 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_infirmary_day [制作占位]
````

#### source/story/prologue-v2/act1.md:1079 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_school_daily [制作占位／待绑定]
````

#### source/story/prologue-v2/act1.md:1081 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=left
````

#### source/story/prologue-v2/act1.md:1085 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
````

#### source/story/prologue-v2/act1.md:1092 · 角色缺少素材

- 说话人“保健室老师”没有任何含 asset 的 SHOW 声明。

````text
DIALOGUE:
保健室老师：
先把她交给我。你去叫班主任，回来再把经过说清楚。
````

### a015_retrieve · 放学返回施工区取剑

#### source/story/prologue-v2/act1.md:1149 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_construction_zone_dusk [制作占位]
````

#### source/story/prologue-v2/act1.md:1150 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_sword_quiet_mystery [制作占位／待绑定]
````

#### source/story/prologue-v2/act1.md:1154 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
````

### a016 · 序幕（二）取剑主线结束

#### source/story/prologue-v2/act1.md:1193 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_dusk [制作占位]
````

#### source/story/prologue-v2/act1.md:1194 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_scene_transition [占位符，待绑定]
````

#### source/story/prologue-v2/act1.md:1196 · 制作备注 / CHECK（只记录）

- 制作备注完整保留；默认不向玩家展示。
- CHECK 中的条件与嵌套 SET / JUMP 均不解释、不执行。

````text
CHECK: has_master_sword == true [仅取剑主线可进入此终点]
````

#### source/story/prologue-v2/act1.md:1201 · 制作备注 / 变量名待定

- 制作备注完整保留；默认不向玩家展示。
- 原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。
- 已有处理依据：任务书 §3.6 / M0 决策：先生成场景序号 flag，仅记录布尔事件；正式命名尚待确认。

````text
SET: [变量名待定] 记录序幕（二）主线结束
````

### a010_return_class · 返回班级·未完成支线

#### source/story/prologue-v2/act1.md:1209 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_school_classroom_day [占位符]
````

#### source/story/prologue-v2/act1.md:1210 · 占位素材

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

#### source/story/prologue-v2/prologue_3.md:130 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_bedroom_night [制作占位]
````

#### source/story/prologue-v2/prologue_3.md:131 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_sword_quiet_mystery [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_3.md:136 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_3.md:164 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_light_switch [制作占位]
````

### b003 · 没有尽头的晚饭

#### source/story/prologue-v2/prologue_3.md:179 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_dining_evening [制作占位]
````

#### source/story/prologue-v2/prologue_3.md:180 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_homecoming_warm_dream [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_3.md:184 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_3.md:188 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 奶奶 asset=char_grandmother_warm [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_3.md:205 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_clock_tick_stop [制作占位]
````

### b004 · 雾中的邀请

#### source/story/prologue-v2/prologue_3.md:234 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_dream_dining_fog [制作占位]
````

#### source/story/prologue-v2/prologue_3.md:235 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_nightmare_invitation [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_3.md:240 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_3.md:247 · 角色缺少素材

- 说话人“雾中的声音”没有任何含 asset 的 SHOW 声明。

````text
DIALOGUE:
雾中的声音：
欢迎来到……属于你的梦。
````

### b005 · 男高拒绝留下

#### source/story/prologue-v2/prologue_3.md:318 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_dream_house_loop [制作占位]
````

#### source/story/prologue-v2/prologue_3.md:319 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_nightmare_pressure [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_3.md:323 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_3.md:330 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_door_loop [制作占位]
````

#### source/story/prologue-v2/prologue_3.md:342 · 角色缺少素材

- 说话人“雾中的声音”没有任何含 asset 的 SHOW 声明。

````text
DIALOGUE:
雾中的声音：
你坐下就好了呀。坐下来，再睡一会儿。
````

### b006 · 梦外的剑鸣

#### source/story/prologue-v2/prologue_3.md:379 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_dream_house_loop [制作占位]
````

#### source/story/prologue-v2/prologue_3.md:380 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_sword_answer [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_3.md:384 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_3.md:391 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_master_sword_resonance [制作占位]
````

#### source/story/prologue-v2/prologue_3.md:401 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_bedroom_night [制作占位，场内切镜]
````

#### source/story/prologue-v2/prologue_3.md:406 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_dream_house_loop [制作占位，场内切镜]
````

#### source/story/prologue-v2/prologue_3.md:407 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_3.md:421 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=right
````

### b007 · 一剑斩断噩梦

#### source/story/prologue-v2/prologue_3.md:440 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_dream_house_fracture [制作占位]
````

#### source/story/prologue-v2/prologue_3.md:441 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_sword_breaks_dream [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_3.md:446 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_3.md:450 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_3.md:454 · 角色缺少素材

- 说话人“雾中的声音”没有任何含 asset 的 SHOW 声明。

````text
DIALOGUE:
雾中的声音：
这里是我的——
````

#### source/story/prologue-v2/prologue_3.md:461 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_sword_cuts_dream [制作占位]
````

### b008 · 醒来后的陌生人

#### source/story/prologue-v2/prologue_3.md:491 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_bedroom_night [制作占位]
````

#### source/story/prologue-v2/prologue_3.md:492 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_after_dream_quiet [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_3.md:497 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_3.md:501 · 占位素材

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

#### source/story/prologue-v2/prologue_4.md:136 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_residential_junction_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:137 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_organization_tension [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:142 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:146 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:150 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑衣队员 asset=char_organization_member_placeholder [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_4.md:197 · 角色缺少素材

- 说话人“搜捕通讯”没有任何含 asset 的 SHOW 声明。

````text
DIALOGUE:
搜捕通讯：
路口小组控制现场。其余小组继续找实验体，不要全部离开搜索区域。
````

### c003 · 第一次配合

#### source/story/prologue-v2/prologue_4.md:208 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_district_access_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:209 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_first_partners_battle [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:215 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:219 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:223 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑衣队员 asset=char_organization_member_placeholder [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_4.md:237 · 调用待接入

- 调用 battle_prologue4_patrol 尚未接入；保留原始调用。新增战斗在运行时阻断。

````text
CALL: battle_prologue4_patrol
````

### c004 · 第一名干部到场

#### source/story/prologue-v2/prologue_4.md:269 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_district_battle_street_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:270 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_foreigner_approach [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:276 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:280 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:284 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑衣干部甲 asset=char_organization_officer_a_placeholder [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_4.md:298 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 不明生物·普通型 asset=char_deoxys_normal_placeholder [占位符／待核对复用] position=right
````

### c005 · 林克明显占优

#### source/story/prologue-v2/prologue_4.md:330 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_district_battle_street_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:331 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_link_advantage [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:338 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:342 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:346 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 不明生物·普通型 asset=char_deoxys_normal_placeholder [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_4.md:353 · 调用待接入

- 调用 battle_prologue4_deoxys_encounter 尚未接入；保留原始调用。新增战斗在运行时阻断。

````text
CALL: battle_prologue4_deoxys_encounter
````

#### source/story/prologue-v2/prologue_4.md:355 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_sword_energy_clash [制作占位]
````

### c006 · 防御型与第二名干部加入

#### source/story/prologue-v2/prologue_4.md:386 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_district_battle_street_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:387 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_organization_reinforcements [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:393 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:397 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:401 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 不明生物·普通型 asset=char_deoxys_normal_placeholder [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_4.md:405 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 不明生物·防御型 asset=char_deoxys_defense_placeholder [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_4.md:409 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SFX: sfx_barrier_impact [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:421 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 黑衣干部乙 asset=char_organization_officer_b_placeholder [占位符／待核对复用] position=right
````

### c007 · 局势转为棘手

#### source/story/prologue-v2/prologue_4.md:442 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_district_battle_street_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:443 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_encirclement_pressure [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:451 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:455 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

### c008 · 怪盗与女剑士接应

#### source/story/prologue-v2/prologue_4.md:496 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_district_battle_street_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:497 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_thief_escape [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:502 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:506 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:510 · 角色缺少素材

- 说话人“墙侧的声音”没有任何含 asset 的 SHOW 声明。

````text
DIALOGUE:
墙侧的声音：
两位，夜路可不是这么逛的。
再退一步，可就真撞墙了。
````

#### source/story/prologue-v2/prologue_4.md:515 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 蒙面人 asset=char_thief_masked_black_placeholder [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:536 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_district_escape_alley_night [制作占位，场内切镜]
````

#### source/story/prologue-v2/prologue_4.md:538 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 女剑士 asset=char_saber_traveler_placeholder [占位符／待核对复用] position=right
````

### c009 · 小巷中的真实身份

#### source/story/prologue-v2/prologue_4.md:562 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_district_quiet_alley_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:563 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_thief_reveal_quiet [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:570 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:574 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:578 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 蒙面人 asset=char_thief_masked_black_placeholder [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_4.md:582 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 女剑士 asset=char_saber_traveler_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:599 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 怪盗 asset=char_thief_smile [占位符／待核对复用] position=right
````

### c010 · 圣杯战争的最低限度说明

#### source/story/prologue-v2/prologue_4.md:651 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_district_quiet_alley_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:652 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_holy_grail_explanation [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:659 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:663 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 怪盗 asset=char_thief_smile [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_4.md:667 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:671 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 女剑士 asset=char_saber_traveler_placeholder [占位符／待核对复用] position=center
````

### c011 · 介绍 Saber

#### source/story/prologue-v2/prologue_4.md:746 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_district_quiet_alley_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:747 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_temporary_companions [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:754 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:758 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 怪盗 asset=char_thief_smile [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_4.md:762 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 女剑士 asset=char_saber_traveler_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:772 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: Saber asset=char_saber_traveler_placeholder [占位符／待核对复用] position=center
````

### c012 · 暂时合作

#### source/story/prologue-v2/prologue_4.md:808 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_old_district_quiet_alley_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:809 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_temporary_companions [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:815 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:819 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 怪盗 asset=char_thief_smile [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_4.md:823 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:827 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 女剑士 asset=char_saber_traveler_placeholder [占位符／待核对复用] position=center
````

### c013 · 夜归与新的同伴

#### source/story/prologue-v2/prologue_4.md:885 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_house_entrance_night [制作占位]
````

#### source/story/prologue-v2/prologue_4.md:886 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BGM: bgm_homecoming_warm_low [制作占位／待绑定]
````

#### source/story/prologue-v2/prologue_4.md:893 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
````

#### source/story/prologue-v2/prologue_4.md:897 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
````

#### source/story/prologue-v2/prologue_4.md:901 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
SHOW: 奶奶 asset=char_grandmother_warm [占位符／待核对复用] position=right
````

#### source/story/prologue-v2/prologue_4.md:938 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_living_room_night [制作占位，场内切镜]
````

#### source/story/prologue-v2/prologue_4.md:955 · 占位素材

- 素材仍有原始占位 / 待绑定标记。

````text
BACKGROUND: bg_grandmother_bedroom_night [制作占位，场内切镜]
````
