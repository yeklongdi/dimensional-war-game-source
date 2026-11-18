# 怪盗 · 羁绊（一）：夜探外部实验室 · Galgame 脚本

> 类型：引擎无关纯文本脚本；供游戏接入与演出转化使用。
>
> 对应：[剧情正文](羁绊一.md)
>
> 前半段关联：[第一幕（一）：抽屉里的来信](../../主线/第一幕/第一幕（一）：抽屉里的来信.md)（[剧本](../../主线/第一幕/第一幕（一）_Galgame脚本.md)中的 `M102` 教室收信与 `M103` 第七夜强制催约）
>
> 正式演出范围：T101—T103（兼容 Day 1～6 夜晚主动前往旧街区老仓库触发，以及 Day 7 夜晚由 `M103` 强制 `JUMP` 接入）。制作说明、状态表和素材表不进入玩家文本框。

## 第一部分：结构与角色显示

承接主线[第一幕（一）：抽屉里的来信](../../主线/第一幕/第一幕（一）：抽屉里的来信.md)的收信剧情。男高与林克、蒙面怪盗、Saber 在旧街区老仓库外围汇合后，潜入组织伪装在偏僻厂房下的外部实验室；击败巡逻队与畸变实验体后，从终端和纸面记录中获取 **`APTX-4869`** 实验模型与**第 10 天全城释放怪物**的情报；撤离至小巷后，双方定下**务必赶在第 10 天前（最晚第 9 天结束前）击破据点**的作战期限。

| 场景 | 标题 | 地点 | 时间／触发节点 |
|---|---|---|---|
| T101 | 旧街区老仓库汇合 | 旧街区老仓库外围 | Day 1～6 夜晚（自由赴约）或 Day 7 夜晚（承接 `M103` 空间通道抵达） |
| T102 | 潜入外部实验室与遭遇战 | 神秘组织据点·外部实验室 | 紧接 T101（内含 1 场战棋战斗调用） |
| T103 | APTX-4869 资料与十日死线 | 外部实验室 → 旧街区安静小巷 | 战后紧接 T102 |

### 作者身份与玩家显示名

| 作者身份 | 玩家显示名 | 使用边界 |
|---|---|---|
| 男高 | 男高 | 未知怪盗即白天的前排同学，也不知 `APTX-4869` 的实际关联对象。 |
| 林克 | 金发青年 | 全程无对白、无心声，只以动作与神态参与戒备、作战与点头表态。 |
| 怪盗（夜间蒙面状态） | 怪盗 | 全程佩戴面罩（`char_thief_masked_black_placeholder`），不摘面罩也不暗示校园身份。 |
| 荧 | Saber | 玩家显示名固定为 `Saber`，全程不透露真名 `荧`。 |
| 组织巡逻队员 | 组织巡逻队员 | 外部实验室警戒与放怪单位。 |

## 第二部分：已确定的演出与调用边界

- **双入口兼容（方案 B）**：
  - 入口 A（主动赴约）：`thief_invitation_received == true && thief_bond1_complete == false && current_day <= 6 && current_period == night`，玩家主动选择前往旧街区老仓库时进入 `T101`。
  - 入口 B（强制保底）：`current_day == 7 && current_period == night && thief_bond1_complete == false`，由 `M103` 结尾直接 `JUMP: T101`。
  - `T101` 首段利用条件分支或兼顾台词处理两种入场画面，其余流程统一并轨。
- **信息差严格守则**：
  - `APTX-4869` 仅作为实验体模型编号出现；玩家可见文本中**禁止出现“梦魇”“魅魔”“漫画店”等词**。
  - 倒计时显示使用 `{10 - current_day}`（方案 B：收到信当天为 Day 1，总周期 10 天；若第 7 夜触发则剩余 2 个整日即第 8、第 9 天）。
- **战斗调用约定**：
  - `T102` 末尾调用 `CALL: battle_thief_bond1_outer_lab`；战败走读档重战，胜利后继续播放 `T103`。

| 战斗标识 | 位置 | 我方参战 | 敌方构成 | 说明 |
|---|---|---|---|---|
| `battle_thief_bond1_outer_lab` | T102 结尾 | 男高、金发青年、怪盗、Saber | 组织巡逻队员若干＋畸变实验体×2 | 外部实验室走廊遭遇战；仅调用约定，未实现数值与地图数据 |

## 第三部分：Galgame 正式脚本

### SCENE: T101

SCENE: T101
TITLE: 旧街区老仓库汇合
TIME: Day 1～6 夜晚（自由赴约）或 Day 7 夜晚（承接 M103）
BACKGROUND: bg_warehouse_area_night [复用既有背景键 BG07]
BGM: bgm_night_alley_stealth [制作占位／待绑定]

CHECK: thief_invitation_received == true && thief_bond1_complete == false [入口约束]

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=站在仓库外围空地，朝黑漆漆的铁门方向张望
EXPRESSION: 男高=好奇，轻微戒备

SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
POSE: 金发青年=站在男高身侧，忽然偏头望向仓库顶檐暗影
EXPRESSION: 金发青年=警觉，沉静

STAGE:
夜风贴着旧街区高耸的砖墙掠过，废弃仓库前方的空地一片冷清，只有街口那盏昏黄的路灯拉出长长的影子。
【若 `thief_bond1_forced_entry == false`（Day 1～6 主动赴约）】男高按照裤兜里那张便签上的地址摸到仓库外围，正踮着脚张望，身侧的金发青年忽然微微偏头，视线直直落向仓库顶檐的暗影处。
【若 `thief_bond1_forced_entry == true`（承接 `M103`）】伴随着幽暗水波般的空气裂隙在墙角悄然合拢，男高与金发青年随怪盗、Saber 一同踏出通道，稳稳落在仓库外围阴影中。

SFX: sfx_roof_landing_light [制作占位]
SHOW: 怪盗 asset=char_thief_masked_black_placeholder [占位符／待核对复用] position=right
POSE: 怪盗=从仓库二层铁皮檐沿轻巧翻身落地，保持蒙面
EXPRESSION: 怪盗=从容，带笑

SHOW: Saber asset=char_saber_traveler_placeholder [占位符／待核对复用] position=right
POSE: Saber=提剑落在怪盗身侧，先扫视空地四周再朝男高颔首
EXPRESSION: Saber=冷静，警戒

STAGE:
仓库二层生锈的铁皮檐沿上发出一声极轻的鞋底磕碰声。下一秒，黑衣礼帽、面上依旧严严实实戴着微笑面罩的怪盗轻巧翻身落地，风衣下摆在夜风里划出一道利落的弧线；半步之外，提剑而立的 Saber 也随之落在他身侧，先是扫视了一圈空地确认没有埋伏，才朝男高略微颔首。

DIALOGUE:
怪盗：
行，人齐了。还以为你白天看了信会犯嘀咕不敢来呢——看来胆子比我想象的还大点。

POSE: 男高=抱胸昂首，随即凑上前追问
EXPRESSION: 男高=干劲十足，好奇

DIALOGUE:
男高：
少啰嗦！既然都是同一条船上的同伴，喊我帮忙哪有缩在家里不露面的道理！
不过……大晚上的特意叫我跑这一趟，你到底是查到什么了？

SHOW: 手绘街区草图 asset=prop_thief_district_sketch [制作占位] position=center
POSE: 怪盗=收敛调侃，摸出手绘街区草图指尖点向偏僻厂房区
EXPRESSION: 怪盗=认真

STAGE:
怪盗收敛起几分调侃的语气，从怀里摸出一张折得棱角分明的手绘街区草图，指尖点在仓库区更深处的一片偏僻厂房区轮廓上。

DIALOGUE:
怪盗：
这几天我顺着上次那帮搜捕队的车辙印往回摸，终于盯上一处不对劲的落脚点。
表面上看只是城南一间早该停产的旧仓储厂房，可一到后半夜就会有人按点轮换外围暗哨，还往里头运过好几批封得严严实实的重型设备。

HIDE: 手绘街区草图

DIALOGUE:
Saber：
外围结界和巡逻的规格都不像普通仓库。单靠我们两个人硬闯，一旦被里头的警报拖住，退路很容易被封死。

DIALOGUE:
怪盗：
所以才来找你和这位沉默的剑士搭把手。我负责找盲区开道进去摸情报，真撞上人了，就得靠你们顶在前面帮着撕开口子——怎么样，这单干不干？

POSE: 男高=眼睛一亮，干脆利落一拍拳头
EXPRESSION: 男高=兴奋，坚定

POSE: 金发青年=将手轻搭剑柄向前跨出半步
EXPRESSION: 金发青年=专注，无声表态

STAGE:
男高听完眼睛瞬间亮了起来。在他心里，这不正是自己盼了好几天的“勇者小队正式出动讨伐反派秘密基地”么！他当即干脆利落地一拍拳头，身侧的金发青年也同时将手轻搭上背后的剑柄，向前跨出半步，无声表态。

DIALOGUE:
男高：
干！当然干！废话少说，带路吧！

HIDE: 男高
HIDE: 金发青年
HIDE: 怪盗
HIDE: Saber
JUMP: T102

---

### SCENE: T102

SCENE: T102
TITLE: 潜入外部实验室与遭遇战
TIME: 同夜
BACKGROUND: bg_organization_outer_lab_night [制作占位／待绑定]
BGM: bgm_lab_infiltration_tension [制作占位／待绑定]

SHOW: 怪盗 asset=char_thief_masked_black_placeholder [占位符／待核对复用] position=right
POSE: 怪盗=环顾冷光走廊与深处厚重的合金隔离门，压低声音示意终端
EXPRESSION: 怪盗=警惕，盘算

SHOW: Saber asset=char_saber_traveler_placeholder [占位符／待核对复用] position=right
POSE: Saber=提剑守在通道侧翼，紧盯走廊拐角
EXPRESSION: Saber=警戒

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=猫着腰贴着墙根往里打量
EXPRESSION: 男高=紧张，惊讶

SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
POSE: 金发青年=紧随男高身侧警戒四周动静
EXPRESSION: 金发青年=专注

STAGE:
避开外墙明面上的照明死角后，四人顺着怪盗提前踩好点的通风管道与一处偏僻侧窗，在空间裂隙的短暂掩护下悄无声息地翻进了据点内部。
脚尖落地时，扑面而来的却不是什么废旧厂房的灰尘味，而是一股刺鼻的消毒药剂与臭氧混杂的冰冷气息。

STAGE:
头顶一排排苍白的冷光灯沿着金属走廊延伸过去，两侧摆满闪烁着绿色指示灯的监控机柜和密封玻璃器皿——这分明是一座伪装在旧厂房壳子底下的秘密外部实验室。走廊最深处，一扇厚重得近乎夸张的合金隔离门紧闭着，门锁旁亮着一道暗红色的权限红灯，将里头的核心区域彻底隔绝开来。

DIALOGUE:
怪盗：
啧，果然把里外隔得严严实实。那扇合金门后头多半才是他们真正藏东西的核心区……咱们先别硬撞门，把外围这几台终端里的数据扒下来再说！

SFX: sfx_flashlight_alert_footsteps [制作占位]
SHOW: 组织巡逻队员 asset=char_organization_member_placeholder [占位符／待核对复用] position=right
POSE: 组织巡逻队员=手电光柱扫过走廊，举枪示警并开启隔离栅栏
EXPRESSION: 组织巡逻队员=惊喝，戒备

STAGE:
话音刚落，男高刚刚顺着墙根往前猫了两步，转角走廊尽头忽然响起几声沉重的军靴踏地声，手电光柱瞬间扫了过来！

DIALOGUE:
组织巡逻队员：
什么人？！怎么混进外部实验区的——快拉响隔离警报，把备战笼里的实验体放出来拦住他们！

SFX: sfx_cage_open_roar [制作占位]
SHOW: 畸变实验体 asset=char_aberration_monster_placeholder [制作占位] position=center

STAGE:
铁栅栏“哐当”一声弹开，两头浑身缠绕着黑紫色畸变脉络的实验怪物嘶吼着扑出阴影，连同几名全副武装的组织队员瞬间堵住了走廊中段！

POSE: 男高=直起身握紧拳头向前迈步
EXPRESSION: 男高=斗志昂扬

DIALOGUE:
男高：
切，还是被发现了！不过正好，正愁没地方活动筋骨呢——上吧！

BGM: bgm_first_partners_battle [制作占位／待绑定]
CALL: battle_thief_bond1_outer_lab [触发外部实验室遭遇战；仅调用说明，未实现数值与地图]

HIDE: 组织巡逻队员
HIDE: 畸变实验体
JUMP: T103

---

### SCENE: T103

SCENE: T103
TITLE: APTX-4869 资料与十日死线
TIME: 战后，同夜
BACKGROUND: bg_organization_outer_lab_night [延续]
BGM: bgm_lab_secret_discovery [制作占位／待绑定]

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=翻看金属工作台上的纸面记录
EXPRESSION: 男高=疑惑，认真

SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
POSE: 金发青年=在工作台与走廊间保持警戒
EXPRESSION: 金发青年=警觉

SHOW: 怪盗 asset=char_thief_masked_black_placeholder [占位符／待核对复用] position=right
POSE: 怪盗=在主终端前插上解码器飞快操作
EXPRESSION: 怪盗=专注，急促

SHOW: Saber asset=char_saber_traveler_placeholder [占位符／待核对复用] position=right
POSE: Saber=提剑守在合金隔离门前方中段
EXPRESSION: Saber=警戒

STAGE:
一番交锋后，最后一只畸变实验体在剑光与交错掩护下倒地消散，几名巡逻队员也陆续失去战斗力。
怪盗没有半刻耽搁，立刻踩着倒地的机柜跃到主终端前，拔出一枚改装过的解码器插进接口，飞快敲起键盘；Saber 则守在走廊中段警戒那扇厚重的合金隔离门，男高与金发青年迅速散开，顺手翻检起旁边金属工作台上的纸面记录。

DIALOGUE:
男高：
喂，这桌子上乱七八糟写的是什么……“实验体模型编号：APTX-4869”？

DIALOGUE:
怪盗：
先全拍下来带走！等等……终端里的总控简报我解开了，你赶紧过来看一眼这段时间表！

SHOW: 终端机密简报 asset=prop_terminal_aptx4869_report [制作占位] position=center
POSE: 男高=凑到终端屏幕前阅读加粗标红的工程摘要
EXPRESSION: 男高=震惊，怒火上涌

STAGE:
男高凑到终端屏幕前。冷白的光映在两人面前，几行加粗标红的工程摘要赫然跳入眼帘——
【终端简报】：依托高活性样本 `APTX-4869` 的模型数据，核心隔离区内正培育高阶吞噬类异变个体；目前载体已入最终阶段，预定于**本周期第 10 天**于太阳市全城释放。

HIDE: 终端机密简报

DIALOGUE:
男高：
什、什么玩意儿？！“本周期第 10 天于全城释放”？！他们疯了吧，要放一只怪物把整座太阳市都吞掉？！

POSE: 怪盗=盯着屏幕上剩余倒计时数字，语气沉下
EXPRESSION: 怪盗=凝重

DIALOGUE:
怪盗：
看来那帮人根本没打算只暗地里抢个圣杯就算完……他们手里还攥着另一张掀桌子的底牌。算算日子，今天已经是第 {current_day} 天了，距离第 10 天满打满算也就只剩 {10 - current_day} 天。
【若为第 7 夜触发追加】而且咱们今晚才刚摸到这儿——算下来，真正能留给咱们动手破局的，也就只剩明天第 8 天和后天第 9 天这两天了。

SFX: sfx_heavy_door_alarm_red [制作占位]
POSE: 男高=拳头攥得咯吱作响，猛地抬头望向走廊深处
EXPRESSION: 男高=咬牙，紧张

STAGE:
男高脸色一沉，拳头瞬间攥得咯吱作响。可还没等他再往后翻那份资料，走廊尽头那扇厚重的合金隔离门突然亮起刺目的红光，低沉急促的机械警报声陡然响彻整间实验室！

DIALOGUE:
Saber：
门后的高能反应正在迅速聚集，大批武装增援也快赶到外围通道了——不能再拖，立刻撤！

FX: fx_thief_spatial_passage [复用序幕四空间通道演出]
SFX: sfx_spatial_rift_open [制作占位]

DIALOGUE:
怪盗：
资料已经拷贝完了！再留下来只会把人全折在这儿——跟我进通道！

STAGE:
怪盗一把拔出解码器与桌面上那叠写着 `APTX-4869` 的纸质残页塞进风衣内袋，反手划开一道幽暗的空间裂隙。男高咬了咬牙，回头死死盯了一眼那扇缓缓开启重型门锁的合金隔离门，随即和金发青年、Saber 一同退入空间通道之中。

BACKGROUND: bg_old_district_quiet_alley_night [复用既有背景键 BG34，场内切镜]
BGM: bgm_alley_resolve_night [制作占位／待绑定]

POSE: 男高=一拳砸在砖墙上，胸口剧烈起伏
EXPRESSION: 男高=不甘，懊恼

STAGE:
下一秒，空间通道在旧街区一条僻静小巷的阴影里合拢。四人各自稳住呼吸，确认没有追兵跟出，男高一拳砸在身旁的砖墙上，胸口还剧烈起伏着。

DIALOGUE:
男高：
可恶……就差那么一扇门！要不是后头增援来得太快，刚才真想直接把那鬼地方给砸个稀巴烂！

DIALOGUE:
怪盗：
冷静点，刚才那种规模的隔离门靠蛮力硬撞是撞不开的，里头指不定还藏着什么级别的干部和怪物。今天能抢出这批第一手情报、摸清第 10 天这个死线，已经不算白跑了。

POSE: 怪盗=转身隔着面罩认真望向男高
EXPRESSION: 怪盗=严肃，叮嘱

DIALOGUE:
怪盗：
不过有一点你说得没错——绝不能真等到第 10 天让那东西放出来祸害全城。
这几天我再把刚抢出来的加密路径摸一遍，看怎么绕开外头那层防护；你和你的从者也抓紧把状态练起来、备齐补给——咱们务必赶在第 10 天怪物放出前，最晚第 9 天结束前，杀回来端掉这座据点！

POSE: 男高=抬头眼神亮起滚烫战意，重重一点头
EXPRESSION: 男高=坚定，热血

DIALOGUE:
男高：
一言为定！你尽管查路线，准备功夫交给我——第 10 天之前，咱们一定把那个老巢给掀了！

POSE: 金发青年=在旁安静垂目颔首
EXPRESSION: 金发青年=沉稳

STAGE:
金发青年在旁安静地垂目颔首，手背上的剑形灼痕与男高的共鸣微微一闪。
怪盗轻轻笑了一声，朝男高抬手挥了挥，随后带着 Saber 转身隐入夜色深处。

HIDE: 男高
HIDE: 金发青年
HIDE: 怪盗
HIDE: Saber

SET: thief_bond_level = 1
SET: thief_bond1_complete = true
SET: aptx4869_model_known = true
SET: base_raid_deadline_day = 9
SET: monster_release_day = 10
END: T103

## 第四部分：分支与剧情状态表

本剧本承接主线[第一幕（一）_Galgame脚本](../../主线/第一幕/第一幕（一）_Galgame脚本.md)中的 `M102`（主动入口）或 `M103`（第 7 夜强制保底入口），统一落至同一段夜探与倒计时确立结局。

| 位置 | 状态 | 约定 |
|---|---|---|
| T101 入口 | `thief_invitation_received == true && thief_bond1_complete == false` | 兼容 Day 1～6 夜晚主动赴约（`thief_bond1_forced_entry == false`）与 Day 7 夜晚 `M103` 强制赴约（`true`）。 |
| T102 战斗 | `battle_thief_bond1_outer_lab` | 仅约定调用节点；战败通过读档重试，胜利进入 T103。 |
| T103 结束 | `thief_bond_level = 1` / `thief_bond1_complete = true` | 设为已完成怪盗羁绊一，并写入 `aptx4869_model_known = true`、`base_raid_deadline_day = 9`、`monster_release_day = 10`。 |

## 第五部分：演出与素材需求表

| 类型 | 资源标识 | 用途／场景 | 状态 |
|---|---|---|---|
| 背景 | `bg_warehouse_area_night` | T101 | 复用既有背景键 BG07 |
| 背景 | `bg_organization_outer_lab_night` | T102、T103（实验室部分） | 制作占位／待绑定 |
| 背景 | `bg_old_district_quiet_alley_night` | T103（巷内撤离后尾声） | 复用既有背景键 BG34 |
| 人物／立绘 | `char_male_high_normal` | T101、T102、T103 | 制作占位；已有素材须核对复用 |
| 人物／立绘 | `char_link_silent_placeholder` | T101、T102、T103 | 制作占位；已有素材须核对复用 |
| 人物／立绘 | `char_thief_masked_black_placeholder` | T101、T102、T103 | 制作占位；全程蒙面 |
| 人物／立绘 | `char_saber_traveler_placeholder` | T101、T102、T103 | 制作占位；已有素材须核对复用 |
| 人物／立绘 | `char_organization_member_placeholder` | T102 | 制作占位；已有素材须核对复用 |
| 怪物／敌方 | `char_aberration_monster_placeholder` | T102（畸变实验体） | 制作占位 |
| 道具 | `prop_thief_district_sketch` | T101（怪盗手绘街区草图） | 制作占位 |
| 道具 | `prop_terminal_aptx4869_report` | T103（终端简报画面） | 制作占位 |
| 画面演出 | `fx_thief_spatial_passage` | T103（撤离通道） | 复用序幕四空间通道演出 |
| 战斗事件 | `battle_thief_bond1_outer_lab` | T102 | 仅调用说明；未实现数值与引擎逻辑 |
| BGM | `bgm_night_alley_stealth` | T101 | 制作占位／待绑定 |
| BGM | `bgm_lab_infiltration_tension` | T102（潜入至遇敌前） | 制作占位／待绑定 |
| BGM | `bgm_first_partners_battle` | T102（遇敌至战斗） | 复用序幕四战斗占位／待绑定 |
| BGM | `bgm_lab_secret_discovery` | T103（实验室发现资料） | 制作占位／待绑定 |
| BGM | `bgm_alley_resolve_night` | T103（小巷约定尾声） | 制作占位／待绑定 |
| 音效 | `sfx_roof_landing_light` | T101（屋檐轻落） | 制作占位 |
| 音效 | `sfx_flashlight_alert_footsteps` | T102（巡逻发现） | 制作占位 |
| 音效 | `sfx_cage_open_roar` | T102（释放实验体） | 制作占位 |
| 音效 | `sfx_heavy_door_alarm_red` | T103（隔离门红灯警报） | 制作占位 |
| 音效 | `sfx_spatial_rift_open` | T103（开启撤离裂隙） | 制作占位 |
