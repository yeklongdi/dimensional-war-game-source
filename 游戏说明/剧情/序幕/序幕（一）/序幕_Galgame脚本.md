# 序幕（一）：搬来太阳市的前一天 · Galgame 脚本

> 转换类型：引擎无关纯文本脚本
>
> 转换范围：原文《序幕：搬来太阳市的前一天》
>
> 目标引擎：后续接入 Godot 4；本文件当前不包含 GDScript。
>
> 身份显示约束：怪盗是作者身份；正式演出只显示“蒙面人”，不在本幕揭露同班同学身份。

## 第一部分：原文结构分析

### 1. 场景数量

核心场景 9 个：`P001` 至 `P009`。

### 2. 场景地点与时间

| 场景编号 | 地点 | 时间 |
|---|---|---|
| P001 | 奶奶家门前 | 下午、傍晚前 |
| P002 | 奶奶家门内 | 下午 |
| P003 | 奶奶家客厅 | 下午至傍晚 |
| P004 | 男高房间、奶奶家厨房 | 晚饭后、入夜前 |
| P005 | 太阳市旧街区、仓库区外围 | 夜晚 |
| P006 | 仓库区外围 | 夜晚，战斗中 |
| P007 | 仓库区外围 | 夜晚，战斗后 |
| P008 | 奶奶家客厅、浴室 | 夜晚 |
| P009 | 男高房间、学校地下深处 | 深夜 |

### 3. 出场角色

- 热血男高：十七岁，六岁时离开太阳市，主动转学回来陪伴奶奶。
- 奶奶：男高留在太阳市的家人。
- 黑衣组织行动人员：身份未在本幕公开。
- 怪盗：穿着黑衣、遮住脸，在仓库区被黑衣组织行动人员围困；本幕不公开其姓名和真实身份。

### 4. 本幕主要目的

- 交代男高回到太阳市、陪伴奶奶的动机。
- 展现男高热血、直率、憧憬勇者的性格。
- 让男高第一次接触黑衣组织与被其围困的怪盗。
- 完成第一次战斗教学。
- 埋下太阳市第一高中、旧街区仓库区和学校地下异动的伏笔。

### 5. 重要伏笔

- 黑衣组织行动人员正在仓库区围捕穿着黑衣、遮住脸的怪盗。
- 黑衣组织行动人员使用了身份和用途不明的金属装置。
- 怪盗试图从包围中脱身，本幕不公开其姓名和真实身份。
- 男高认为自己只是“多管闲事”，尚未理解事件的真正性质。
- 学校地下埋藏着黑色结晶，结晶像心脏一样跳动。
- 男高将成为太阳市第一高中的学生。

### 6. 玩家已经知道的信息

- 男高因为想陪伴奶奶而转学回太阳市。
- 男高喜欢动漫、漫画和游戏，憧憬勇者。
- 男高在夜晚遇到了黑衣组织行动人员和被围困的怪盗。
- 男高介入并完成了一场战斗。
- 太阳市第一高中地下存在不明结晶。

### 7. 角色知道但玩家还不知道的信息

- 黑衣人所属组织的名称、目的和具体身份。
- 怪盗的姓名、真实身份与行动目的。
- 黑衣组织围捕怪盗的真正原因。
- 学校地下结晶与太阳市、圣杯战争之间的关系。
- 男高是否已经受到太阳市异常力量影响。

### 8. 需要转化成选项的地方

- 原文没有真正的玩家选项。
- 第一次战斗作为独立战斗事件调用。
- 男高介入并保护被围困的怪盗的动作按原文处理为强制事件，不新增单一选项。

### 9. 需要调用战斗或特殊事件的地方

- `P006`：战斗教学。
- `P009`：学校地下结晶异动只使用视觉和音效演出，不调用战斗。

## 第二部分：问题与待确认事项

### 1. 时间线问题

- 【待确认】男高从发现黑衣组织行动人员与怪盗到返回奶奶家的具体经过时间。
- 【待确认】男高第二天上学的准确起床时间和路程时长。

### 2. 人物关系问题

- 【待确认】奶奶是否知道太阳市近期存在异常事件。
- 【待确认】男高的父母是否知道他在夜间遇到战斗。

### 3. 世界观规则问题

- 【待确认】黑衣组织是否就是背景设定中的神秘组织。
- 【待确认】怪盗与黑衣组织发生冲突的具体原因。
- 【待确认】学校地下黑色结晶是否就是黑暗神遗骸的一部分。

### 4. 战斗信息问题

- 【待确认】序幕战斗的敌人数量、敌人数据和胜利条件。
- 【待确认】战斗失败后是返回战斗前、重新读取存档，还是直接进入剧情失败。
- 【待确认】男高在没有明确从者的情况下为何能够完成战斗。

### 5. 素材问题

- 当前目录没有可直接确认的奶奶家、旧街区和仓库区背景图。
- 当前目录没有与本幕黑衣、遮脸的怪盗完全对应的立绘或战斗素材。
- 当前目录没有已绑定到序幕的 BGM 和音效。

## 第三部分：Galgame 正式脚本

### SCENE: P001

SCENE: P001
TITLE: 奶奶家门前
TIME: 下午、傍晚前
BACKGROUND: bg_grandmother_house_dusk [占位符]
BGM: bgm_homecoming_warm [占位符，待绑定]

SHOW: 男高 asset=char_male_high_normal [占位符] position=center
POSE: 男高=携带行李、站立
EXPRESSION: 男高=紧张、期待

STAGE:
男高拎着行李箱和行李袋，站在奶奶家门前。
背景为两层老房子、门前桂花树和褪色门板。
镜头从房屋和桂花树缓慢推进到男高。

INNER:
男高：
六年了……终于回来了。

INNER:
男高：
这次不是只回来住几天。
以后，换我陪奶奶了。

SFX: sfx_door_knock [占位符]

STAGE:
男高伸手敲门。
JUMP: P002

### SCENE: P002

SCENE: P002
TITLE: 奶奶家·进门
TIME: 下午
BACKGROUND: bg_grandmother_house_entrance [占位符]
BGM: bgm_homecoming_warm [占位符，延续]

SHOW: 奶奶 asset=char_grandmother_warm [占位符] position=door
POSE: 奶奶=手持抹布、站在门内
EXPRESSION: 奶奶=惊喜、眼眶泛红

STAGE:
门内很快传来拖鞋声。
奶奶一只手里还攥着抹布，开门看见他，先笑了起来，目光却在他脸上停了好一会儿。

DIALOGUE:
奶奶：
可算到了。路上累不累？先让我看看。

EXPRESSION: 男高=放松、微笑

DIALOGUE:
男高：
奶奶，我回来了。
您怎么还跟以前一样，第一句话就问我累不累？

STAGE:
奶奶仰头打量男高，伸手替他理了理被行李带压歪的衣领。

DIALOGUE:
奶奶：
不问你，还能问谁？
快进来，饭马上就好。

STAGE:
奶奶让开门口，男高拎着行李进屋。
HIDE: 男高
HIDE: 奶奶
JUMP: P003

### SCENE: P003

SCENE: P003
TITLE: 奶奶家·客厅
TIME: 下午至傍晚
BACKGROUND: bg_grandmother_house_living_room [占位符]
BGM: bgm_homecoming_warm [占位符，延续]

SHOW: 男高 asset=char_male_high_normal [占位符] position=left
SHOW: 奶奶 asset=char_grandmother_warm [占位符] position=right
POSE: 男高=坐在沙发上
POSE: 奶奶=坐在男高旁边、仔细打量
EXPRESSION: 男高=得意
EXPRESSION: 奶奶=欣慰、感伤

STAGE:
客厅还是记忆里的旧木柜、茶壶和满墙老照片。
奶奶拉着男高坐下，一会儿看他的脸，一会儿又捏捏他的手臂，像是要把错过的几年一次看回来。

DIALOGUE:
奶奶：
长这么高了。瘦是瘦了点，倒是结实。
眉眼……有点像你爷爷年轻的时候。

EXPRESSION: 男高=热血、得意

DIALOGUE:
男高：
那正好。以后家里的重活归我，您就负责验收。

DIALOGUE:
奶奶：
先把自己的行李收拾好，再来夸口。

DIALOGUE:
男高：
保证完成任务！

STAGE:
奶奶笑着拍了他一下，起身想去看厨房。男高却先一步把茶壶拎起来，跟了过去。

DIALOGUE:
男高：
奶奶，我回来可不只是为了上学。
以后别什么事都一个人扛。还有我呢。

STAGE:
奶奶背对着他停了一下，再开口时，声音仍带着笑。

DIALOGUE:
奶奶：
知道。那今天先帮我把这壶茶端过去，别洒了。

STAGE:
男高应得响亮。画面停在祖孙二人一前一后的背影上，随后淡出至晚饭后。
HIDE: 男高
HIDE: 奶奶
JUMP: P004

### SCENE: P004

SCENE: P004
TITLE: 奶奶家·整理房间与出门
TIME: 晚饭后、入夜前
BACKGROUND: bg_grandmother_house_bedroom [占位符]
BGM: bgm_homecoming_warm [占位符，渐弱]

SHOW: 男高 asset=char_male_high_normal [占位符] position=center
POSE: 男高=整理行李
EXPRESSION: 男高=怀念、轻松

STAGE:
男高把行李搬进自己的房间。

NARRATION:
房间不大，却收拾得很干净。床单像刚晒过，书桌也空出了足够的位置。

STAGE:
窗台上摆着一个旧铁皮机器人，边角已经生了锈。
那是爷爷以前送给他的玩具。男高用袖口擦去薄灰，把它转向门口，端端正正地放好。

STAGE:
男高把衣服叠进衣柜，把明天报到要用的书本和文具装进书包。
他带来的游戏卡带就放在机器人旁边，像新旧两段生活终于在同一张书桌上碰了面。
窗外的路灯逐渐亮起。

BACKGROUND: bg_grandmother_house_kitchen_night [占位符]
SHOW: 奶奶 asset=char_grandmother_warm [占位符] position=kitchen
EXPRESSION: 奶奶=关心

DIALOGUE:
男高：
奶奶，我想出去走走，认认路。

DIALOGUE:
奶奶：
都这个点了，还出去？
别走远。找不到路就打电话，我给你留门。

EXPRESSION: 男高=轻松、准备出门

DIALOGUE:
男高：
知道。就在附近转一圈，顺便看看明天怎么走。

STAGE:
男高换上外套，走出家门。
HIDE: 男高
HIDE: 奶奶
JUMP: P005

### SCENE: P005

SCENE: P005
TITLE: 旧街区·仓库区外围
TIME: 夜晚
BACKGROUND: bg_sun_city_old_street_night [占位符]
BGM: bgm_old_street_mystery [占位符，待绑定]

SHOW: 男高 asset=char_male_high_normal [占位符] position=left
POSE: 男高=散步、观察四周
EXPRESSION: 男高=好奇

STAGE:
商业街的霓虹灯还亮着，但行人已经不多。
男高沿街认路，不知不觉走进旧街区。
背景切换为昏暗路灯、关闭的店铺和高墙围住的仓库区。

INNER:
男高：
刚才明明还在商业街……怎么走到这种地方来了？

STAGE:
墙上没有公司名称，只有一块被雨水侵蚀得难以辨认的警示牌。
高墙附近传来金属碰撞声和挣扎声。

SFX: sfx_metal_collision [占位符]

CAMERA: 镜头切换至高墙另一侧的月光下。
SHOW: 黑衣人甲 asset=char_organization_member_placeholder [占位符] position=left
SHOW: 黑衣人乙 asset=char_organization_member_placeholder [占位符] position=right
SHOW: 蒙面人 asset=char_thief_masked_black_placeholder [占位符] position=center
POSE: 黑衣人甲=持金属装置、逼近
POSE: 黑衣人乙=封锁退路
POSE: 蒙面人=被逼到墙角、试图逃跑

STAGE:
蒙面人穿着黑衣，面部被遮住，正被黑衣组织行动人员逼到墙角。
黑衣组织行动人员封锁退路，蒙面人试图从包围中脱身。
男高躲到墙角阴影里，观察高墙另一侧的情况。

INNER:
男高：
几个人堵一个，手里还拿着东西……
这怎么看都不像普通争执。

STAGE:
蒙面人刚侧身避开伸来的金属装置，另一名黑衣人便再次堵住缺口。
男高看了看四周，没有看见其他路人。他吸了口气，从阴影里走了出去。
SHOW: 男高 expression=认真、出头

DIALOGUE:
男高：
喂！先把东西放下！

STAGE:
黑衣人回头，看见男高后短暂愣住。

DIALOGUE:
男高：
有什么话不能好好说？
这么多人堵一个，我可不能装作没看见！

SET: [变量名待定] 记录男高介入仓库区冲突
JUMP: P006

### SCENE: P006

SCENE: P006
TITLE: 仓库区外围·第一次战斗
TIME: 夜晚
BACKGROUND: bg_warehouse_area_night [占位符]
BGM: bgm_first_battle [占位符，待绑定]

STAGE:
黑衣人将注意力转向男高。
战斗界面切入。

CALL: battle_prologue_tutorial

SET: [变量名待定] 记录序幕战斗教学完成

CHECK: [战斗失败处理待确认]

NARRATION:
战斗结果返回后，继续进入战斗结束场景。
JUMP: P007

### SCENE: P007

SCENE: P007
TITLE: 仓库区外围·蒙面人离开
TIME: 夜晚、战斗后
BACKGROUND: bg_warehouse_area_night [占位符]
BGM: bgm_first_battle_after [占位符，待绑定]

SHOW: 男高 asset=char_male_high_normal [占位符] position=center
POSE: 男高=战斗后喘息
EXPRESSION: 男高=疑惑、警惕

STAGE:
几个黑衣人倒在地上，另一些黑衣人退回仓库区阴影。
男高转头看向墙角。

SHOW: 蒙面人 asset=char_thief_masked_black_placeholder [占位符] position=far
POSE: 蒙面人=战斗后站稳、观察男高、准备离开

INNER:
男高：
他到底是什么人？
那些人为什么非要抓住他？

STAGE:
男高刚想开口叫住对方，蒙面人却先朝他轻轻点了一下头。
那不是答案，更像一句来不及说出口的道谢。
下一刻，蒙面人转身钻进夜色，很快便看不清了。
远处仓库区重新亮起灯光，隐约传来人声。

SFX: sfx_distant_warehouse_noise [占位符]

INNER:
男高：
糟了，得赶紧回家。

SET: [变量名待定] 记录蒙面人在男高面前离开
HIDE: 蒙面人
JUMP: P008

### SCENE: P008

SCENE: P008
TITLE: 奶奶家·回家
TIME: 夜晚
BACKGROUND: bg_grandmother_house_living_room_night [占位符]
BGM: bgm_homecoming_warm [占位符，低音量]

SHOW: 男高 asset=char_male_high_normal [占位符] position=left
SHOW: 奶奶 asset=char_grandmother_warm [占位符] position=right
POSE: 男高=刚跑回家、呼吸急促
POSE: 奶奶=坐在藤椅上等待
EXPRESSION: 男高=装作平静
EXPRESSION: 奶奶=关心

STAGE:
男高一路小跑回到老房子。
客厅的灯还亮着，奶奶从藤椅上站起。

DIALOGUE:
奶奶：
回来啦？怎么气喘吁吁的，外面冷不冷？

DIALOGUE:
男高：
不冷。就是走错了条路，怕您等急，跑回来的。

STAGE:
奶奶看了眼他皱起来的外套，没有继续追问，只把留给他的那盏灯调亮了一些。

DIALOGUE:
奶奶：
快去洗漱吧。明天一早还要报到，别第一天就没精神。

DIALOGUE:
男高：
知道。您也早点睡，不用一直等我。

STAGE:
男高走进浴室。
热水落下，镜头给到他握紧的、指节发红的手。

INNER:
男高：
也许真是我稀里糊涂撞进了别人的麻烦。
可那些装置、那个人的身手……还有他们看彼此的眼神，都不像小事。

INNER:
男高：
不过，要我现在装作没看见，还是做不到。

HIDE: 男高
HIDE: 奶奶
JUMP: P009

### SCENE: P009

SCENE: P009
TITLE: 男高房间·睡前
TIME: 深夜
BACKGROUND: bg_grandmother_house_bedroom_night [占位符]
BGM: bgm_night_before_school [占位符，待绑定]

SHOW: 男高 asset=char_male_high_normal [占位符] position=bed
POSE: 男高=躺在床上、望向天花板
EXPRESSION: 男高=期待、认真

STAGE:
枕边放着明天报到要用的书包。
窗台上的铁皮机器人被月光照出一道暗亮的边，像仍在替这个房间守着什么。

INNER:
男高：
明天开始，我就是太阳市第一高中的学生了。

INNER:
男高：
先把日子过好。好好上学，也多陪陪奶奶。

INNER:
男高：
至于今晚那种事……
真再碰上，我还是会站出来。毕竟，我想成为的就是那种勇者。

STAGE:
男高闭上眼睛。
镜头从房间拉远，切换至学校地下深处。

BACKGROUND: bg_school_underground_dark [占位符]
CAMERA: 镜头缓慢推进黑暗中的漆黑结晶。
SHOW: 黑色结晶 asset=prop_dark_god_crystal_placeholder [占位符] position=center

SFX: sfx_low_heartbeat [占位符]

STAGE:
黑色结晶像心脏一样，极轻微地跳动了一下。

SET: [变量名待定] 记录序幕结束
END: P009

## 第四部分：分支与变量表

本幕原文没有玩家主动选项，只有战斗事件调用。

| 编号 | 触发位置 | 玩家选择 | 变量变化 | 后续跳转 | 是否影响结局 |
|---|---|---|---|---|---|
| P-B01 | P005 | 无 | 记录男高介入仓库区冲突 | P006 | 原文未说明 |
| P-B02 | P006 | 无，进入战斗教学 | 记录战斗教学完成，变量名待定 | P007 | 原文未说明 |
| P-B03 | P007 | 无 | 记录怪盗离开，变量名待定 | P008 | 原文未说明 |
| P-B04 | P009 | 无 | 记录序幕（一）结束 | 序幕（二） | 原文未说明 |

## 第五部分：演出与素材需求表

| 编号 | 类型 | 素材名称 | 用途 | 是否已有 | 备注 |
|---|---|---|---|---|---|
| P-M01 | 背景 | `bg_grandmother_house_dusk` | 奶奶家门前黄昏 | 否 | 占位符 |
| P-M02 | 背景 | `bg_grandmother_house_entrance` | 进门 | 否 | 占位符 |
| P-M03 | 背景 | `bg_grandmother_house_living_room` | 客厅重逢 | 否 | 占位符 |
| P-M04 | 背景 | `bg_grandmother_house_bedroom` | 整理房间 | 否 | 占位符 |
| P-M05 | 背景 | `bg_grandmother_house_kitchen_night` | 出门前厨房 | 否 | 占位符 |
| P-M06 | 背景 | `bg_sun_city_old_street_night` | 旧街区 | 否 | 占位符 |
| P-M07 | 背景 | `bg_warehouse_area_night` | 仓库区外围 | 否 | 占位符 |
| P-M08 | 背景 | `bg_grandmother_house_living_room_night` | 夜间回家 | 否 | 占位符 |
| P-M09 | 背景 | `bg_grandmother_house_bedroom_night` | 睡前 | 否 | 占位符 |
| P-M10 | 背景 | `bg_school_underground_dark` | 地下结晶 | 否 | 占位符 |
| P-M11 | 立绘 | `char_male_high_normal` | 男高 | 部分已有 | 现有男高主立绘和序列帧可作为候选，尚未绑定 |
| P-M12 | 立绘 | `char_grandmother_warm` | 奶奶 | 否 | 占位符 |
| P-M13 | 立绘 | `char_organization_member_placeholder` | 黑衣人 | 否 | 占位符 |
| P-M14 | 立绘 | `char_thief_masked_black_placeholder` | 黑衣、遮脸的怪盗 | 否 | 占位符；需要确认与现有怪盗角色素材的绑定关系 |
| P-M15 | 立绘 | `prop_dark_god_crystal_placeholder` | 黑色结晶 | 否 | 占位符或特殊图片 |
| P-M16 | BGM | `bgm_homecoming_warm` | 重逢、回家 | 待确认 | 原文未指定；现有音乐仅作为候选 |
| P-M17 | BGM | `bgm_old_street_mystery` | 旧街区悬疑 | 待确认 | 原文未指定 |
| P-M18 | BGM | `bgm_first_battle` | 战斗教学 | 待确认 | 原文未指定 |
| P-M19 | BGM | `bgm_night_before_school` | 睡前与伏笔 | 待确认 | 原文未指定 |
| P-M20 | 音效 | `sfx_door_knock` | 敲门 | 否 | 占位符 |
| P-M21 | 音效 | `sfx_metal_collision` | 仓库金属碰撞 | 否 | 占位符 |
| P-M22 | 音效 | `sfx_distant_warehouse_noise` | 仓库区远处人声 | 否 | 占位符 |
| P-M23 | 音效 | `sfx_low_heartbeat` | 地下结晶跳动 | 否 | 占位符 |
| P-M24 | 战斗 | `battle_prologue_tutorial` | 第一次战斗教学 | 否 | 需要后续 Godot 战斗事件绑定 |
| P-M25 | UI | 战斗结果界面 | 序幕战斗返回 | 否 | 现有战斗界面需确认是否适用 |

## 第六部分：对白质量检查

### 1. 人物性格

- 男高的对白整体符合热血、直率、憧憬勇者的设定。
- 奶奶的对白符合温暖、关心男高的身份。
- 黑衣人对白只承担当前场景功能，没有擅自透露组织背景。

### 2. 过度解释

- 黑衣组织的身份和目的没有在对白中解释，符合原文信息量。
- 仓库区环境、怪盗的黑衣和遮脸特征主要通过舞台指令与画面表现，没有让男高机械复述全部信息。

### 3. 文本框长度

- 长段落已经拆成一到两句文本框。
- 男高与奶奶的重逢对白保留短句和停顿。
- 地下结晶和怪盗撤离部分使用旁白、镜头和音效分担文本量。

### 4. 重复表达

- 男高的“站出来”与勇者憧憬集中保留在结尾，前文更多用照顾奶奶、主动介入等行动表现，不连续重复口号。
- 奶奶的重逢与欣慰改用端详、整理衣领、留灯等动作承接，避免连续使用功能相近的感叹句。

### 5. 不自然对白

- 仓库区介入台词已改为先要求放下装置，再表明不能袖手旁观；配音时应有短暂观察和吸气的过程，而不是毫无判断地直接喊口号。
- 战后疑问与决心均保留为男高心声，不使用普通对白框显示。

### 6. 说话风格混淆

- 本幕出场对白较少，尚未形成黑衣组织行动人员的独立风格。
- 怪盗没有直接对白，保持其身份未揭示的处理。

### 7. 应转为演出指令的内容

- 老房子、桂花树、茶壶使用背景、道具或 CG 表现。
- 怪盗撤离和黑色结晶跳动使用镜头、音效和画面演出。
- 男高握拳、喘息、洗澡后的指节发红使用立绘表情或特写。

### 8. 配音难度

- 男高的热血台词需要较高音量和较快节奏。
- 奶奶的对白需要温暖、带轻微哽咽感。
- 男高心声建议不配音或使用较低音量的内心旁白，具体方式待确认。

## 第七部分：修改建议

【建议编号】P-S01
原文问题：序幕战斗只有“进行战斗教学”的占位说明。
建议方向：补充战斗事件的敌人、胜利条件、失败处理和战斗结束返回节点。
是否影响剧情：会影响实际可玩性，不改变当前剧情事件。
是否需要我确认：是。

【建议编号】P-S02
原文问题：黑衣组织行动人员的身份、怪盗的姓名与真实身份暂未揭示。
建议方向：在后续幕中逐步揭示，不在序幕中直接解释。
是否影响剧情：会影响伏笔回收。
是否需要我确认：是。

【建议编号】P-S03
原文问题：男高为什么能独自击退黑衣人尚未说明。
建议方向：后续通过男高自身能力、战斗训练或太阳市力量解释，当前不补写。
是否影响剧情：会影响力量体系的自洽性。
是否需要我确认：是。
