# 第一幕（一）：抽屉里的来信 · Galgame 脚本

> 类型：引擎无关纯文本脚本；供游戏接入与演出转化使用。
>
> 对应：[剧情正文](第一幕（一）：抽屉里的来信.md)
>
> 关联个人线：[怪盗线 · 羁绊一](../../个人/怪盗线/羁绊一.md)（[剧本](../../个人/怪盗线/羁绊一_Galgame脚本.md)） · [虚拟主播线 · 羁绊一](../../个人/虚拟主播线/羁绊一.md)
>
> 正式演出范围：M101—M103（M101～M102 为序幕四结束次日自动触发的开篇主线；M103 为截至 Day 6 夜晚仍未触发[怪盗线 · 羁绊一](../../个人/怪盗线/羁绊一.md)时，于 Day 7 夜晚强制触发的催约场景）。制作说明、状态表和素材表不进入玩家文本框。

## 第一部分：结构与角色显示

承接序幕（四）C013 夜归借宿后的次日清晨与白天。男高在奶奶面前用远方朋友借宿的说法圆场，出门时由林克主动灵体化随行；白天在教室补觉时，前排同学（怪盗）往男高桌肚塞入约见便签并在放学前故意敲醒提示，由此开启十日自由备战周期（方案 B：收到信当天为 Day 1，共 10 天）；若 Day 1～Day 6 夜晚玩家一直未前往旧街区老仓库，Day 7 夜晚自动触发 M103，由蒙面怪盗与 Saber 亲自找上门带走男高强制进入[怪盗线 · 羁绊一](../../个人/怪盗线/羁绊一.md)后半段。

| 场景 | 标题 | 地点 | 时间／触发节点 |
|---|---|---|---|
| M101 | 清晨的掩护与随行 | 奶奶家（客厅／院门） | Day 1 清晨（承接 C013，自动触发） |
| M102 | 白天教室：抽屉里的来信 | 太阳市第一高中·高二教室 | Day 1 白天（紧接 M101，自动触发；结束后解锁 Day 1 放学后自由行动） |
| M103 | 第七夜的登门催约 | 老住宅区路口 → 空间通道 | Day 7 夜晚（仅当 `thief_bond1_complete == false` 时强制触发，锁定该时段） |

### 作者身份与玩家显示名

| 作者身份 | 玩家显示名 | 使用边界 |
|---|---|---|
| 男高 | 男高 | 未知前排同学即蒙面怪盗；误以为收到的便签是情书，拆开后大失所望，只当是“传单广告”。 |
| 奶奶 | 奶奶 | 暂允朋友借宿几天，尚不知道圣杯战争与异常事件。 |
| 林克 | 金发青年 | M101 全程无对白、无心声，以欠身、点头与灵体化动作沟通；M103 随灼痕警告短暂现身戒备。 |
| 怪盗（校园同班同学伪装） | 前排同学 | **M102 必须使用 `前排同学`**，严禁在玩家文本框直接显示“怪盗”，维持身份信息差；M102 复用例行校服不戴面罩立绘。 |
| 怪盗（夜间蒙面状态） | 怪盗 | 仅在 M103 夜间登场时使用，全程佩戴面罩，不摘面罩也不暴露白日同学身份。 |
| 荧 | Saber | 仅在 M103 随怪盗短暂现身警戒；玩家视角只知职阶 `Saber`，不显示真名。 |

## 第二部分：已确定的演出与调用边界

- **方案 B 周期与触发机制**：
  - `M102` 结束后立即开启十日周期：`current_day = 1`，`cycle_total_days = 10`，`monster_release_day = 10`，进入 `Day 1 放学后` 自由行动时段。
  - `Day 1 ～ Day 6` 夜晚玩家可主动前往旧街区老仓库触发[怪盗线 · 羁绊一](../../个人/怪盗线/羁绊一.md) `T101`。
  - 若到 `Day 7 夜晚` 时 `thief_bond1_complete` 仍为 `false`，系统强制切入 `M103`，随后直接 `JUMP` 至 `T101`（或经由空间通道直接抵达旧街区老仓库外围），并标注当前只剩第 8、第 9 两天准备期。
- **战斗调用**：本文件 `M101—M103` 为纯剧情与调度衔接场景，无战棋战斗调用（战斗发生在后续接入的 `T102`）。

## 第三部分：Galgame 正式脚本

### SCENE: M101

SCENE: M101
TITLE: 清晨的掩护与随行
TIME: Day 1 清晨
BACKGROUND: bg_grandmother_house_living_room [复用既有背景键 BG03]
BGM: bgm_morning_home_warm [制作占位／待绑定]

CHECK: prologue_4_complete == true [章节入口约束，承接序幕四 C013]

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=顶着黑眼圈坐在餐桌旁，端起水杯干咳圆场
EXPRESSION: 男高=困倦，强装镇定

SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
POSE: 金发青年=站在窗边收好地铺，随后在桌旁端正静候
EXPRESSION: 金发青年=安静，沉稳

SHOW: 奶奶 asset=char_grandmother_warm [占位符／待核对复用] position=right
POSE: 奶奶=端着咸菜摆好碗筷，目光落在青年身上询问
EXPRESSION: 奶奶=温和，略带关切

STAGE:
天刚蒙蒙亮，客厅的木桌上已经摆好了温热的早饭。
男高顶着一双睡意还没消干净的黑眼圈下楼时，金发青年早已把昨晚借宿的地铺叠得方方正正，正安静地站在窗边，手边那柄裹着旧帆布的长剑也收拾得一丝不苟。

STAGE:
奶奶端着最后一碟咸菜从厨房走出来，目光在青年身上打了个转，终究还是没把话说太重，只把两副碗筷摆好，顺口追问起昨夜答应“一早说清楚”的那句交代。

STAGE:
男高早有准备，端起水杯干咳两声，把夜里在被窝里现编好的说辞顺溜地搬了出来——只说这是自己在老家那边认识的远房朋友，前阵子家里长辈外出办事不太方便照看，偏偏昨夜在太阳市刚下车又撞见外头闹腾腾的，自己实在不好意思让人露宿街头，才先领回家里暂住几天。

DIALOGUE:
奶奶：
家里真没人能照应，先在楼上空屋多住两天倒也没什么。不过小伙子要是方便，还是早点给家里捎个信报个平安，免得大人在外头干着急。

POSE: 金发青年=放下筷子，朝奶奶郑重地微微欠身行礼
EXPRESSION: 金发青年=礼貌，领意

STAGE:
金发青年听懂了话里的善意，放下筷子朝奶奶郑重地微微欠身，算是应下。

HIDE: 奶奶
BACKGROUND: bg_grandmother_house_entrance [复用既有背景键 BG02，场内切镜]

STAGE:
吃过早饭，男高背起书包走到院门外侧，确认奶奶已经回厨房收拾碗筷后，才赶紧回身压低声音朝门里的金发青年招了招手。

POSE: 男高=探头往街口张望，压低声音叮嘱
EXPRESSION: 男高=紧张，小声

DIALOGUE:
男高：
喂，我待会儿还得照常去学校上课。你先别急着跟出大门口啊——万一真顶着这身打扮、背着一把剑大摇大摆逛大街，别说奶奶会吓一跳，半条街的人都得围过来报警！

STAGE:
他一边说着，一边紧张地往街口方向张望了两眼，正琢磨着白天该把这位沉默寡言的“勇者同伴”怎么安置在家里才不露馅。

POSE: 金发青年=站在檐下阴影里，轻轻点头
FX: fx_servant_spirit_form [制作占位：金发青年化作微光隐去身形]
SFX: sfx_spirit_dissolve_soft [制作占位]
HIDE: 金发青年

STAGE:
谁知站在檐下阴影里的金发青年只是朝他轻轻点了点头。
下一瞬，青年周身的轮廓在晨光里微微一晃，整个人连同那柄裹布长剑竟化作一缕极淡的微光，悄无声息地隐去身形——没有声响，也没有惊动屋里的奶奶，只有男高右手手背上那道尚未消退的剑形灼痕微微一暖，隐约传来某种“就在身侧”的安心感。

POSE: 男高=眨眼愣住，试着伸手朝空气里晃半下
EXPRESSION: 男高=惊喜，暗暗得意

STAGE:
男高愣在原地眨了眨眼，试着伸手朝空气里晃了半下，虽碰不到实处，却能清晰感觉到那股稳重可靠的同行气息正安静跟在自己身旁。

INNER:
男高：
哦……原来还可以这样隐身跟着走啊！不愧是传说里的从者，真厉害！

STAGE:
他顿时放下大半颗心，压着嘴角暗暗偷笑一声，抓紧书包肩带小跑着赶往太阳市第一高中。

SET: link_spirit_follow_unlocked = true
HIDE: 男高
JUMP: M102

---

### SCENE: M102

SCENE: M102
TITLE: 白天教室：抽屉里的来信
TIME: Day 1 白天（早读至放学前）
BACKGROUND: bg_school_classroom_day [复用既有背景键 BG15]
BGM: bgm_school_afternoon_lazy [制作占位／待绑定]

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=双臂枕在桌面趴着熟睡
EXPRESSION: 男高=疲惫沉睡

SHOW: 前排同学 asset=char_thief_smile [复用既有校园立绘，不戴面罩] position=right
POSE: 前排同学=端坐前排，侧耳留意身后动静
EXPRESSION: 前排同学=无奈，戏谑

STAGE:
这天上午的教室里阳光正好，粉笔在黑板上刷刷作响，男高却从早读课起就把脑袋埋在两臂之间，整个人几乎焊死在了课桌上。
昨晚半夜惊醒破梦、跟着金发青年在大街小巷逃了一路、同神秘组织硬碰硬打了两场，好不容易摸回屋里躺下，脑子里又翻来覆去琢磨着“圣杯战争”“怎么尽快变强”“到底该怎么找到其他御主组队”这一堆乱七八糟的念头，几乎彻夜没怎么合眼。眼下一坐进温暖安稳的教室，困意立刻铺天盖地压了下来。

STAGE:
课间铃响了一轮又一轮，他硬是从第一节数学课一路睡到了下午临近放学。
坐在男高正前方的同学，早在上午第一节课前就趁着他趴在桌上补觉的工夫，悄无声息地往他桌肚里塞进了一封折得整整齐齐的信。原本想着这人睡一两节课总该伸手掏书、顺便看见那封信，谁料从早读一直熬到下午最后半堂自习，身后传来的依旧是均匀无比的呼吸声。

SFX: sfx_pen_drop_floor [制作占位]
POSE: 前排同学=故意松手掉笔，弯腰捡笔时抬指节敲两下男高课桌边沿
EXPRESSION: 前排同学=打趣，笑意

STAGE:
前排同学终于没了耐心。他借着低头翻书的动作侧耳听了下背后的动静，确认讲台上的老师正背身写板书，索性指尖一松，故意让手里的中性笔“啪嗒”一声掉在地上，顺着桌脚骨碌碌滚到了男高椅子底下。
他借势弯腰去捡笔，顺手抬起指节，在男高的课桌边沿不轻不重地敲了两下。

DIALOGUE:
前排同学：
喂，转学生，快下课了。再这么一路睡到放学，口水都要流进作业本里了。

POSE: 男高=迷迷糊糊抬头，抬手胡乱蹭蹭脸颊
EXPRESSION: 男高=睡眼惺忪

DIALOGUE:
男高：
……唔，已经快放学了吗？

STAGE:
前排同学把笔捡回手里转了一圈，压低嗓门朝他桌下偏了偏下巴，唇角带着点漫不经心的笑意。

DIALOGUE:
前排同学：
可不嘛。顺便提一句，我刚才低头找笔的时候好像瞅见……你桌肚最里头，是不是被人塞了封信啊？

POSE: 男高=猛地坐直身子
EXPRESSION: 男高=吃惊，随即微红

DIALOGUE:
男高：
啊？信？

STAGE:
男高刚清醒一半的脑子瞬间卡了一下，紧接着像是忽然想到了什么了不得的青春校园桥段，脸颊“腾”地一下悄悄泛起一层热意。
他下意识左右飞快瞄了两眼教室里埋头写题的同学们，心跳莫名漏了半拍，赶紧坐直身子伸手往桌肚里一摸——指尖果然碰到了一个叠得平整干净的纸信封。

INNER:
男高：
不会吧……我才刚转学过来没几天，怎么突然在抽屉里收到信了？！难不成是班里哪个女生……还是隔壁班……

SFX: sfx_paper_unfold [制作占位]
SHOW: 怪盗邀约信件 asset=prop_thief_invitation_letter [制作占位] position=center
POSE: 男高=躲在课桌后小心拆开信封展开便签
EXPRESSION: 男高=期待，压不住笑意

STAGE:
他压着止不住上扬的嘴角，假装镇定地低着头，躲在课桌遮挡后小心翼翼拆开信封，展开里头那张简洁得不能再简洁的便签——
上面只写着两行字：“转学生：这几天得空的话，挑个晚上来旧街区老仓库外头找我。——怪盗”

HIDE: 怪盗邀约信件
POSE: 男高=盯着信纸愣住两秒，随即肩膀一垮垂头丧气
EXPRESSION: 男高=期望落空，无语

STAGE:
男高盯着纸面上龙飞凤舞的那两行字足足愣了两秒。
下一刻，他脸上那点刚升起来的期待、羞涩和纯情幻想“啪嚓”一声碎了个干干净净，肩膀瞬间垮成一团，忍不住在座位里小声咕哝出一句大失所望的吐槽。

DIALOGUE:
男高：
……切，搞了半天居然是那家伙啊！

POSE: 前排同学=肩膀轻抖憋笑，偏过半张脸挑眉打趣
EXPRESSION: 前排同学=促狭，忍笑

STAGE:
话音刚落，前排背对着他的同学肩膀忽然极轻地抖了一下，像是在竭力憋住什么快要满出来的笑意。他慢悠悠偏过半张脸，眉梢挑起一个促狭的弧度。

DIALOGUE:
前排同学：
怎么着，看你刚才拆信前紧张成那样，还以为是什么女孩子写的情书？结果拆开一看大失所望啊？

POSE: 男高=把便签揉成一团塞进裤兜，急忙收拾书本遮掩
EXPRESSION: 男高=脸红，嘴硬心虚

DIALOGUE:
男高：
哪、哪有的事！谁指望那种东西了！
没什么啦，就一张乱七八糟的传单广告！谁这么无聊连校园桌肚都塞这种东西……

STAGE:
前排同学挑了挑眉，没再继续拆穿他，只意味深长地顺着他的话头轻轻“哦”了一声，慢条斯理转回身去收拾桌面。

SFX: sfx_school_dismissal_bell [制作占位]

STAGE:
几秒后，悠长的放学铃声顺着走廊响彻整个教学楼。

HIDE: 男高
HIDE: 前排同学

SET: thief_invitation_received = true
SET: free_action_unlocked = true
SET: current_day = 1
SET: cycle_total_days = 10
SET: monster_release_day = 10
SET: current_period = after_school
END: M102

---

### SCENE: M103

SCENE: M103
TITLE: 第七夜的登门催约
TIME: Day 7 夜晚（未触发怪盗线羁绊一时强制锁定该时段）
BACKGROUND: bg_residential_junction_night [复用既有背景键 BG30]
BGM: bgm_thief_night_visit [制作占位／待绑定]

CHECK: current_day == 7 && current_period == night && thief_bond1_complete == false [方案 B 强制保底条件]

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=拎着补给袋沿路灯走回家，突然停步警戒
EXPRESSION: 男高=警觉

STAGE:
一连过去六天，男高放学后不是忙着在市里打听动静、跑去兼职赚补给钱，就是埋头研究自己那点新觉醒的本事，竟把裤兜里那张揉成一团的约见便签彻底抛在了脑后。
这天入夜后，男高拎着刚买好的几样补给品沿着老住宅区路灯往回走。拐过熟悉的路口墙角时，前方的空气忽然毫无征兆地像水面般泛起一圈波纹。

FX: fx_thief_spatial_passage [制作占位／沿用序幕四通道演出]
SFX: sfx_spatial_rift_open [制作占位]

SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
POSE: 金发青年=在男高身侧凝实半步，手按剑柄戒备
EXPRESSION: 金发青年=警觉

STAGE:
男高脚步一顿，手背灼痕随之微热；身侧虚空中金发青年的身影几乎在同时凝实半步，手已按在了剑柄上。

SHOW: 怪盗 asset=char_thief_masked_black_placeholder [占位符／待核对复用] position=right
POSE: 怪盗=从阴影裂隙里从容踏出，保持蒙面
EXPRESSION: 怪盗=调侃，从容

SHOW: Saber asset=char_saber_traveler_placeholder [占位符／待核对复用] position=right
POSE: Saber=提剑静立在怪盗身侧观察四周
EXPRESSION: Saber=警戒，稳重

STAGE:
下一秒，两道人影自裂开的阴影缝隙里从容踏出。黑风衣、礼帽、脸上依旧严严实实地覆着那副只露笑意的面罩，身旁跟着提剑静立的 Saber。

DIALOGUE:
怪盗：
晚上好啊，转学生。一连七天没在仓库外头见着你人影——我还以为你当真把我的信当成广告传单，顺手扔进垃圾桶了呢。

POSE: 男高=尴尬挠头干笑
EXPRESSION: 男高=尴尬，心虚

DIALOGUE:
男高：
呃……怪盗？！你怎么直接找上门来了！
咳、不是故意放你鸽子的！这几天又是熟悉环境又是琢磨怎么找其他御主、还想着攒点装备，一忙起来就给忘了……

POSE: 怪盗=收敛调侃，侧身指向身后的空间通道
EXPRESSION: 怪盗=认真，催促

DIALOGUE:
怪盗：
行了，这趟亲自过来可不是为了听你赔礼道歉的。外头情况变了，我刚盯上一桩十万火急的大麻烦，今晚缺个信得过的帮手——你现在有空，还是得跟我们走一趟？

STAGE:
他说着侧过身，背后尚未散去的空间通道仍泛着微弱幽光；一旁的 Saber 朝男高与金发青年略微颔首，示意通道那一端暂且安全。

POSE: 男高=眼神一亮，一把拍上胸口
EXPRESSION: 男高=干劲十足，痛快

DIALOGUE:
男高：
没问题！既然是同伴开口求援，哪有推辞的道理——走，现在就出发！

STAGE:
怪盗隔着面罩微不可察地挑了下眉，侧身朝通道内一抬手，四人随即一同踏入空间通道。

SET: thief_bond1_forced_entry = true
HIDE: 男高
HIDE: 金发青年
HIDE: 怪盗
HIDE: Saber
JUMP: T101 [无缝跳转至 个人/怪盗线/羁绊一_Galgame脚本.md 中的 T101]

## 第四部分：分支与剧情状态表

本段负责从序幕过渡至第一幕的十日自由备战周期，并设置第七夜的强制保底汇合机制（方案 B）。

| 位置 | 状态 | 约定 |
|---|---|---|
| M101 入口 | `prologue_4_complete` | 需为 `true`（承接 C013）。 |
| M101 结束 | `link_spirit_follow_unlocked` | 设为 `true`，记录林克可灵体化随男高日间外出。 |
| M102 结束 | `thief_invitation_received` / `free_action_unlocked` | 均设为 `true`；同时设定 `current_day = 1`、`cycle_total_days = 10`、`monster_release_day = 10`、`current_period = after_school`。 |
| Day 1～6 夜晚 | 自由选择前往旧街区老仓库 | 若主动赴约，直接进入[怪盗线 · 羁绊一](../../个人/怪盗线/羁绊一_Galgame脚本.md) `T101`。 |
| M103 触发 | `current_day == 7 && current_period == night && thief_bond1_complete == false` | 强制锁定 Day 7 夜晚行动，写入 `thief_bond1_forced_entry = true` 后无缝跳转 `T101`。 |

## 第五部分：演出与素材需求表

| 类型 | 资源标识 | 用途／场景 | 状态 |
|---|---|---|---|
| 背景 | `bg_grandmother_house_living_room` | M101 | 复用既有背景键 BG03 |
| 背景 | `bg_grandmother_house_entrance` | M101（场内切镜） | 复用既有背景键 BG02 |
| 背景 | `bg_school_classroom_day` | M102 | 复用既有背景键 BG15 |
| 背景 | `bg_residential_junction_night` | M103 | 复用既有背景键 BG30 |
| 人物／立绘 | `char_male_high_normal` | M101、M102、M103 | 制作占位；已有素材须核对复用 |
| 人物／立绘 | `char_link_silent_placeholder` | M101、M103 | 制作占位；已有素材须核对复用 |
| 人物／立绘 | `char_grandmother_warm` | M101 | 制作占位；已有素材须核对复用 |
| 人物／立绘 | `char_thief_smile` | M102（前排同学状态，不戴面罩） | 复用既有校园立绘，显示名锁定为 `前排同学` |
| 人物／立绘 | `char_thief_masked_black_placeholder` | M103（夜间蒙面状态） | 制作占位；全程蒙面 |
| 人物／立绘 | `char_saber_traveler_placeholder` | M103 | 制作占位；已有素材须核对复用 |
| 道具 | `prop_thief_invitation_letter` | M102（怪盗约见便签） | 制作占位 |
| 画面演出 | `fx_servant_spirit_form` | M101（林克灵体化） | 制作占位 |
| 画面演出 | `fx_thief_spatial_passage` | M103（空间通道出场与离开） | 复用序幕四空间通道演出 |
| BGM | `bgm_morning_home_warm` | M101 | 制作占位／待绑定 |
| BGM | `bgm_school_afternoon_lazy` | M102 | 制作占位／待绑定 |
| BGM | `bgm_thief_night_visit` | M103 | 制作占位／待绑定 |
| 音效 | `sfx_spirit_dissolve_soft` | M101（灵体化） | 制作占位 |
| 音效 | `sfx_pen_drop_floor` | M102（掉笔敲桌） | 制作占位 |
| 音效 | `sfx_paper_unfold` | M102（拆信展开） | 制作占位 |
| 音效 | `sfx_school_dismissal_bell` | M102（放学铃声） | 制作占位 |
| 音效 | `sfx_spatial_rift_open` | M103（空间裂隙开启） | 制作占位 |
