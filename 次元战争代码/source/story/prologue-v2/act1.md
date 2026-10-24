# 序幕（二）：转学生来到太阳市第一高中 · Galgame 脚本

> 转换类型：引擎无关纯文本脚本
>
> 转换范围：原文《序幕（二）：转学生来到太阳市第一高中》
>
> 目标引擎：后续接入 Godot 4；本文件当前不包含 GDScript。

## 第一部分：原文结构分析

### 1. 场景数量

核心主线场景 18 个：保留 `A001` 至 `A016`，增加 `A015_RECOVERY`、`A015_RETRIEVE` 两个衔接场景。

未完成分支占位场景 4 个：`A007_TODO_THIEF`、`A007_TODO_VILLAIN`、`A007_RANDOM_UNAVAILABLE`、`A010_RETURN_CLASS`。这些节点只结束当前未完成分支，不接入序幕三。

### 2. 场景地点与时间

| 场景编号 | 地点 | 时间 |
|---|---|---|
| A001 | 奶奶家、前往学校的道路 | 高二开学第一天清晨 |
| A002 | 上学路口 | 清晨 |
| A003 | 太阳市第一高中校门、教学楼二楼 | 清晨 |
| A004 | 太阳市第一高中教室 | 上午上课铃响后 |
| A005 | 教室与座位区 | 上午 |
| A006 | 教室、讲台附近 | 上午最后一节课结束后的课间 |
| A007 | 教室 | 课间，选择带路角色 |
| A008 | 图书馆、食堂、体育馆 | 白天、课间参观校园 |
| A009 | 操场东北角废弃施工区外围 | 白天 |
| A010 | 废弃施工区入口 | 白天，玩家选择后 |
| A011 | 废弃施工区坑底 | 白天 |
| A012 | 废弃施工区坑底、幻象空间 | 白天与幻象时间混合 |
| A013 | 废弃施工区坑底与坑边 | 白天 |
| A014 | 废弃施工区坑底 | 白天，战斗中及战斗后 |
| A015 | 太阳市第一高中教学楼 | 白天，课间铃响 |
| A015_RECOVERY | 保健室、教室 | 白天至临近放学 |
| A015_RETRIEVE | 废弃施工区、回家主路 | 当日放学后、傍晚 |
| A016 | 取剑主线结束节点 | 同日傍晚 |

### 3. 出场角色

- 热血男高：高二第一天转入太阳市第一高中，昨晚刚在仓库区经历异常事件。
- 奶奶：男高的家人，在 A001 中叫醒并送男高上学。
- 虚拟主播：男高的邻居，同班学生；现实中社恐，网络上是虚拟主播。
- 怪盗：男高在上学路上撞到的同学，正在暗中调查父亲失踪与神秘组织。
- 反派御主：家境优越、礼貌得体但危险的学生。
- 偶像：停止活动后回到校园的国民偶像，对反派御主有特殊忠诚。
- 老师：负责接待转学生、安排座位并安排校园向导。
- 同学甲、同学乙及其他学生：承担校园反应。
- 神秘组织相关人物：只在原文的后续设定和未完成路线中出现，本幕正式剧情没有让其直接登场。
- 黑色人形：从腐蚀大师之剑上脱落的污秽聚合体，身份未揭示。

### 4. 本幕主要目的

- 展现男高转入太阳市第一高中的第一天。
- 让怪盗、反派、偶像和虚拟主播以普通学生身份出场。
- 建立男高与怪盗的初步关系。
- 展示虚拟主播的现实社恐特征。
- 让反派注意到男高，让偶像注意到反派的异常反应。
- 通过校园设施介绍建立后续日常和调查场景。
- 让男高发现学校地下的异常、被腐蚀的大师之剑和黑色人形。
- 为后续圣杯战争和从者召唤埋下伏笔。

### 5. 重要伏笔

- 男高因为昨晚的仓库区事件睡过头。
- 虚拟主播住在男高隔壁，但两人此前并不熟悉。
- 怪盗已经注意到转学生，并在暗中调查父亲失踪与神秘组织的关系。
- 反派主动注意男高，认为男高“有趣”。
- 偶像察觉反派对男高的兴趣，并因此产生不安。
- 学校东北角施工区多年没有施工，地下存在异常。
- 坑底出现心跳声和一把被黑绿色污秽腐蚀的大师之剑。
- 男高触碰剑柄后看到来自其他世界的幻象。
- 黑色污秽聚合成非人的黑色人形。
- 男高为了保护昏迷的虚拟主播而选择战斗。
- 男高手上的剑形灼痕在回到学校后仍然发光。

### 6. 玩家已经知道的信息

- 男高在序幕一已经遇到黑衣人与身份未明的蒙面人，尚未确认蒙面人与同班怪盗是同一人。
- 男高已经回到太阳市并转入第一高中。
- 怪盗、反派、偶像、虚拟主播都在同一所高中，并可能参与后续事件。
- 学校地下存在与太阳市异常力量有关的未知事物。
- 男高在施工区触碰了被腐蚀的剑，并与黑色人形战斗。

### 7. 角色知道但玩家还不知道的信息

- 怪盗的父亲为何失踪，以及父亲和神秘组织的具体关系。
- 反派御主真正的动机与圣杯战争资格来源。
- 偶像对反派的忠诚会发展到什么程度。
- 虚拟主播的现实身份与网络身份之间的完整差异。
- 施工区为何长期封锁。
- 黑色人形的真实身份。
- 大师之剑与后续从者召唤之间的关系。
- 黑暗神遗骸、学校地下结晶和圣杯战争之间的具体关系。

### 8. 需要转化成选项的地方

- A007：选择由谁带男高参观校园。
- A010：选择进入废弃施工区，或返回班级。
- 原文中“男高伸手触碰剑柄”只有一个选项，没有对应的替代选项，转换为强制事件，并在问题清单中标记。

### 9. 需要调用战斗或特殊事件的地方

- `A007`：`rd3`，属于系统随机，不是普通玩家选择。
- `A012`：大师之剑触碰后的幻象事件。
- `A014`：黑色人形战斗。

## 第二部分：问题与待确认事项

### 1. 时间线问题

- 【待确认】A001 中“昨晚”与 A002 以后事件之间的准确时间长度。
- 【待确认】“上午的最后一节课结束”与校园参观开始的具体时间。
- 【待确认】男高从施工区返回学校是否仍处于同一节课间。
- 【已确认】本幕放学后取剑带回家，直接衔接同日傍晚的序幕三晚饭；两次夜间事件分别发生在搬回当晚与开学当晚。

### 2. 人物关系问题

- 【待确认】虚拟主播为何住在男高隔壁，以及两人此前是否见过面。
- 【待确认】怪盗、反派和偶像是否原本就是同班同学，还是本幕才首次集中出现。
- 【待确认】老师是否知道施工区的真实情况。
- 【已确认】虚拟主播跟进施工区的动机在 A011 处理：她既不能放男高独自下去，又担心被老师发现，因此停在坑边守望，不进入坑底。

### 3. 世界观与道具问题

- 【已确认】大师之剑作为召唤联系的媒介：白天触剑建立联系，序幕三求生愿望完成召唤；本幕不让男高提前知道答案。
- 【待确认】大师之剑为何会出现在太阳市第一高中地下。
- 【待确认】剑上的黑绿色污秽是否就是黑暗神力量，还是另一种污染。
- 【待确认】黑色人形是否属于怪物数据体系中的已知生物。
- 【已确认】剑形灼痕在序幕三与大师之剑共鸣，暂不直接认定为令咒；其他用途仍未确定。
- 【待确认】A012 的幻象是否属于林克的记忆、剑的记忆，或第三方力量展示。

### 4. 选项和分支后果

- 怪盗带路路线只有选项名称，没有正文，标记为【不可执行】。
- 反派带路路线只有选项名称，没有正文，标记为【不可执行】。
- “让老师选择”使用 `rd3`，属于系统随机，不是玩家直接选择。
- `rd3` 随机到怪盗或反派时没有可执行正文，统一跳转到 `A007_RANDOM_UNAVAILABLE`。
- “回班上”跳转到 `A010_RETURN_CLASS` 并结束，保持未完成分支状态；不经过取剑主线，也不接入 B001。
- 原文没有明确的好感度、调查度或结局变化，因此不擅自增加数值后果。
- 【待确认】系统随机结果是否可以通过读取存档重新生成。

### 5. 对白口吻问题

- 男高的热血口号辨识度高，但后续需要避免每次对话都使用相同的“勇者”表达。
- 虚拟主播的结巴和停顿符合设定，但不能让她长期只依赖结巴表现社恐。
- 怪盗当前台词数量较少，尚未充分体现轻浮、机敏和戏剧化的说话方式。
- 反派当前对白主要体现冷漠和兴趣，独特语言习惯仍需后续确认。
- 偶像在当前正文中的直接对白极少，暂不能完整判断她的独立说话风格。

### 6. 重复剧情

- 本幕施工区事件负责触剑与救人；序幕四旧街区事件负责初次配合、组织增援和怪盗接应。原先大纲中重复的仓库包围与召唤顺序已同步调整。
- 黑暗神结晶的“心跳”意象在序幕和序幕（二）附近重复出现，当前保留，因为它承担持续伏笔功能。

### 7. 缺少素材

- 当前目录没有可直接确认的学校内部背景图。
- 当前目录没有虚拟主播、反派、偶像和奶奶的正式立绘。
- 当前目录没有施工区、大师之剑和黑色人形的正式素材。
- 当前目录没有该幕已确定的 BGM、音效和 CG 绑定。
- 当前目录没有 Godot 对话系统或战斗调用脚本。

## 第三部分：Galgame 正式脚本

### SCENE: A001

SCENE: A001
TITLE: 清晨睡过头
TIME: 高二开学第一天清晨
BACKGROUND: bg_grandmother_house_bedroom_morning [占位符]
BGM: bgm_school_morning [占位符，待绑定]

SHOW: 男高 asset=char_male_high_normal [占位符] position=center
SHOW: 奶奶 asset=char_grandmother_warm [占位符] position=door
POSE: 男高=躺在床上、刚醒
POSE: 奶奶=端着早饭、站在门口
EXPRESSION: 男高=困倦、慌张
EXPRESSION: 奶奶=催促、关心

STAGE:
闹钟已经响过几遍，男高仍把半张脸埋在被子里。
昨晚的金属装置、蒙面人的背影和仓库区重新亮起的灯，在断续的梦里转了一夜。

INNER:
男高：
那些人后来怎么样了……
不行，再想下去天都要亮了。

STAGE:
奶奶端着早饭上楼，在门边站了两秒，直接伸手拉开了窗帘。

DIALOGUE:
奶奶：
快起来！第一天上学就要迟到，像什么话！

DIALOGUE:
男高：
起了起了……我真的醒了。

STAGE:
男高匆忙洗漱，抓起书包和外套冲下楼。
奶奶追到门口，把装着水煮蛋和面包的袋子塞给他，又替他正了正外套领子。

DIALOGUE:
奶奶：
路上慢点跑！别又摔了！

EXPRESSION: 男高=自信、急着出门

DIALOGUE:
男高：
知道，我保证看着路！奶奶，晚上见！

STAGE:
男高从门口冲出去。
HIDE: 男高
HIDE: 奶奶

SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
POSE: 虚拟主播=背着书包、站在隔壁门口
EXPRESSION: 虚拟主播=疑惑

STAGE:
隔壁房子的门也正好打开。
虚拟主播只看见一个陌生少年从邻居家冲出来，朝学校方向跑去。

INNER:
虚拟主播：
没见过的人……是邻居家新搬来的吗？

STAGE:
虚拟主播沿着街道朝学校走去。
HIDE: 虚拟主播
JUMP: A002

### SCENE: A002

SCENE: A002
TITLE: 上学途中·路口相撞
TIME: 清晨
BACKGROUND: bg_sun_city_school_road_morning [占位符]
BGM: bgm_school_morning [占位符，延续]

SHOW: 男高 asset=char_male_high_normal [占位符] position=left
POSE: 男高=飞奔、手里攥着水煮蛋
EXPRESSION: 男高=着急

STAGE:
男高一路飞奔，晨风灌进领口，书包在背后一跳一跳。
学校大门已经出现在街道尽头。

SHOW: 怪盗 asset=char_thief_smile [已有候选素材，尚未绑定] position=right
POSE: 怪盗=从路口拐出
EXPRESSION: 怪盗=意外

STAGE:
路口拐角突然闪出一道身影。
男高和对方来不及停下，结结实实地撞在一起。

DIALOGUE:
男高：
抱歉！你没事吧？

STAGE:
男高赶紧伸手扶了对方一把，又接住自己差点掉落的水煮蛋。
上课预备铃从远处传来，他急得回头看了一眼学校。

DIALOGUE:
男高：
真的对不起！我快迟到了，先走一步！

DIALOGUE:
怪盗：
一大早的，赶着去哪儿啊……

STAGE:
怪盗站稳后拍了拍衣摆，望着男高飞奔的背影，意外地挑了下眉。

INNER:
怪盗：
【原文未提供更多心声，此处不补写。】

HIDE: 男高
HIDE: 怪盗
JUMP: A003

### SCENE: A003

SCENE: A003
TITLE: 学校门口
TIME: 清晨
BACKGROUND: bg_school_gate_morning [占位符]
BGM: bgm_school_morning [占位符，延续]

SHOW: 男高 asset=char_male_high_normal [占位符] position=center
POSE: 男高=叼着面包、跑进校门
EXPRESSION: 男高=匆忙

STAGE:
晨光中的校牌泛着旧金属的颜色。
校园包含高楼、操场、旧教学楼和远处被围栏封住的施工区域。
男高叼着半片面包冲进校门，书包拉链没有完全拉上。

SHOW: 老师 asset=char_teacher_placeholder [占位符] position=left
POSE: 老师=追着男高喊话
EXPRESSION: 老师=严肃、无奈

DIALOGUE:
老师：
那个学生！站住！
学校里面不许跑！第一天报到就横冲直撞，像什么样子！

STAGE:
男高猛地刹住脚，转身站直，嘴里的面包还没来得及拿下。

DIALOGUE:
男高：
对不起，老师！我下次一定提前出门！

STAGE:
老师看了看他快要滑到地上的书包，又看了眼时间，无奈地朝教学楼一抬手。

DIALOGUE:
老师：
先把拉链拉好，赶紧去报到。走廊里不许再跑！

CAMERA: 镜头切换到教学楼二楼走廊。
SHOW: 反派 asset=char_villain_calm [占位符] position=left
SHOW: 偶像 asset=char_idol_neutral [占位符] position=right
POSE: 反派=靠在栏杆边、拿着饮料
POSE: 偶像=站在反派身旁
EXPRESSION: 反派=玩味
EXPRESSION: 偶像=疑惑、不安

DIALOGUE:
反派：
刚转来就撞人，又被老师追着训……他倒是一点都不怯场。

DIALOGUE:
偶像：
你好像很在意他。

DIALOGUE:
反派：
只是觉得这股精神劲很新鲜。
就是不知道，遇上真正的麻烦以后，还能不能保住。

DIALOGUE:
偶像：
……是吗。

STAGE:
反派抿了一口饮料，语气仍像随口闲谈。
偶像也笑了一下，目光却重新落向男高离开的方向。
镜头短暂掠过学校地下。

SHOW: 黑色结晶 asset=prop_dark_god_crystal_placeholder [占位符] position=center
SFX: sfx_low_heartbeat [占位符]

STAGE:
黑色结晶在地下深处极轻微地跳动了一下。
HIDE: 黑色结晶
HIDE: 男高
HIDE: 老师
HIDE: 反派
HIDE: 偶像
JUMP: A004

### SCENE: A004

SCENE: A004
TITLE: 教室·自我介绍
TIME: 上午上课铃响后
BACKGROUND: bg_school_classroom_morning [占位符]
BGM: bgm_school_classroom_daily [占位符，待绑定]

SHOW: 男高 asset=char_male_high_normal [占位符] position=center
POSE: 男高=站在讲台前、拿着白板笔
EXPRESSION: 男高=自信、兴奋
SHOW: 老师 asset=char_teacher_placeholder [占位符] position=left
POSE: 老师=站在教室门口
EXPRESSION: 老师=平静

STAGE:
上课铃响起时，男高正好赶到教室门口。
他走到讲台前，从讲台上拿起笔，在白板上写下自己的名字。

DIALOGUE:
男高：
大家好！我叫——！
今天开始转入这个班，请大家多多关照！

DIALOGUE:
男高：
搬东西、找路、体育活动都可以叫我。
要是有人遇到麻烦，也欢迎来找我！

STAGE:
教室安静几秒，随后响起压低的笑声和窃窃私语。

DIALOGUE:
同学甲：
这自我介绍也太像动画主角了吧……

DIALOGUE:
同学乙：
转学第一天就放出这种话，真有自信。

STAGE:
男高听出大家是在笑，却只当他们记住了自己，坦然拍了拍胸脯。
靠窗位置上的怪盗认出了男高。

SHOW: 怪盗 asset=char_thief_smile [已有候选素材，尚未绑定] position=left
POSE: 怪盗=托腮看向男高
EXPRESSION: 怪盗=有趣、微笑

INNER:
怪盗：
是他啊。……这所学校，看来要热闹起来了。

STAGE:
男高也认出怪盗，朝他挥手。
怪盗抬手回了个很轻的招呼，随即用笔尖点了点讲台，提醒他老师还站在旁边。

HIDE: 男高
HIDE: 老师
HIDE: 怪盗
JUMP: A005

### SCENE: A005

SCENE: A005
TITLE: 教室·座位安排
TIME: 上午
BACKGROUND: bg_school_classroom_morning [占位符]
BGM: bgm_school_classroom_daily [占位符，延续]

SHOW: 老师 asset=char_teacher_placeholder [占位符] position=left
SHOW: 男高 asset=char_male_high_normal [占位符] position=center
SHOW: 怪盗 asset=char_thief_smile [已有候选素材，尚未绑定] position=back_left
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=back_right
POSE: 老师=指向空座位
POSE: 男高=拎着书包准备落座
EXPRESSION: 男高=期待
EXPRESSION: 虚拟主播=紧张

DIALOGUE:
老师：
好了，大家安静。新同学先别急着坐。
你就坐那边——怪盗后面，虚拟主播左边那个空位。

DIALOGUE:
男高：
好，谢谢老师！

STAGE:
男高拎着书包走向座位，坐到怪盗后面、虚拟主播左边。
他先朝邻座笑了一下，又刻意压低了一点声音。

DIALOGUE:
男高：
你好。以后请多关照。

EXPRESSION: 虚拟主播=紧张、躲避视线

DIALOGUE:
虚拟主播：
……嗯。请、请多关照。

STAGE:
怪盗从前排回过头，正好对上男高的视线。

DIALOGUE:
怪盗：
又见面了，转学生。你这登场方式，想不记住都难。

DIALOGUE:
男高：
早上真是抱歉。回头我正式赔罪。

DIALOGUE:
怪盗：
先坐好吧，新同学。老师可看这边了。

STAGE:
男高立刻坐直，用力点头。
HIDE: 老师
HIDE: 男高
HIDE: 怪盗
HIDE: 虚拟主播
JUMP: A006

### SCENE: A006

SCENE: A006
TITLE: 课间·带路的人选
TIME: 上午最后一节课结束后的课间
BACKGROUND: bg_school_classroom_day [占位符]
BGM: bgm_school_classroom_daily [占位符，延续]

SHOW: 男高 asset=char_male_high_normal [占位符] position=center
SHOW: 老师 asset=char_teacher_placeholder [占位符] position=front
SHOW: 怪盗 asset=char_thief_smile [已有候选素材，尚未绑定] position=window
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
SHOW: 反派 asset=char_villain_calm [占位符] position=back
POSE: 男高=准备伸懒腰
POSE: 老师=朝男高招手
EXPRESSION: 男高=疑惑
EXPRESSION: 老师=平常

STAGE:
课间铃声响起，教室热闹起来。
老师把男高叫到讲台附近。

DIALOGUE:
老师：
转学生，你过来一下。

DIALOGUE:
老师：
你刚转来，对学校还不熟吧。
课间正好有时间，让同学带你逛逛校园，认认路。

DIALOGUE:
老师：
他们都是这个班的学生。你自己看看，想跟谁一起去？

STAGE:
镜头依次给到怪盗、虚拟主播和反派。
怪盗转笔并挑眉，虚拟主播低头整理书本，反派靠着椅背微笑。
JUMP: A007

### SCENE: A007

SCENE: A007
TITLE: 课间·选择校园向导
TIME: 课间
BACKGROUND: bg_school_classroom_day [占位符]
BGM: bgm_school_choice [占位符，待绑定]

CHOICE: 男高选择由谁带他参观校园。

OPTION 1:
怪盗。
STAGE:
【不可执行】原文只有选项名称，没有怪盗带路正文。
JUMP: A007_TODO_THIEF

OPTION 2:
虚拟主播。
SET: [变量名待定] 记录玩家选择虚拟主播带路
JUMP: A008

OPTION 3:
反派。
STAGE:
【不可执行】原文只有选项名称，没有反派带路正文。
JUMP: A007_TODO_VILLAIN

OPTION 4:
让老师选择。
STAGE:
这是系统随机，不是玩家直接选择。
CALL: random_rd3

CHECK: [系统随机结果 = 1] -> JUMP: A007_RANDOM_UNAVAILABLE
CHECK: [系统随机结果 = 2] -> SET: [变量名待定] 记录随机进入虚拟主播路线；JUMP: A008
CHECK: [系统随机结果 = 3] -> JUMP: A007_RANDOM_UNAVAILABLE

NARRATION:
【待确认】是否可以通过读取存档重新生成 `rd3` 结果。

### SCENE: A007_TODO_THIEF

SCENE: A007_TODO_THIEF
TITLE: 怪盗带路·未完成
TIME: 课间
BACKGROUND: bg_school_classroom_day [占位符]

NARRATION:
【不可执行】原文没有提供怪盗带男高参观校园的正文。
本场景不补写内容，不增加新的路线结果。

END: A007_TODO_THIEF

### SCENE: A007_TODO_VILLAIN

SCENE: A007_TODO_VILLAIN
TITLE: 反派带路·未完成
TIME: 课间
BACKGROUND: bg_school_classroom_day [占位符]

NARRATION:
【不可执行】原文没有提供反派带男高参观校园的正文。
本场景不补写内容，不增加新的路线结果。

END: A007_TODO_VILLAIN

### SCENE: A007_RANDOM_UNAVAILABLE

SCENE: A007_RANDOM_UNAVAILABLE
TITLE: 随机结果对应未完成路线
TIME: 课间
BACKGROUND: bg_school_classroom_day [占位符]

NARRATION:
【不可执行】`rd3` 随机结果对应怪盗或反派路线，但该路线当前没有原文正文。

NARRATION:
【待确认】此处应返回选项、暂停流程，还是等待路线正文补充。

END: A007_RANDOM_UNAVAILABLE

### SCENE: A008

SCENE: A008
TITLE: 虚拟主播带路参观校园
TIME: 白天、课间
BACKGROUND: bg_school_library_day [占位符]
BGM: bgm_school_daily [占位符，待绑定]

SHOW: 男高 asset=char_male_high_normal [占位符] position=left
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
POSE: 男高=自然跟随
POSE: 虚拟主播=低头带路、与男高保持距离
EXPRESSION: 男高=好奇、友善
EXPRESSION: 虚拟主播=紧张

STAGE:
老师的话音落下后，虚拟主播发现所有人都看向她。
她下意识把怀里的书抱紧，过了两秒才放下东西，走到离男高半步远的位置。

DIALOGUE:
虚拟主播：
那……跟我来吧。

STAGE:
虚拟主播带男高进入主教学楼一层东侧的图书馆。
一进门，她的脚步反而稳了些，像是回到了自己熟悉的地方。
镜头表现书架、靠窗自习区和安静的馆内环境。

DIALOGUE:
虚拟主播：
这里是图书馆。靠窗的是自习区，校史和地方志在最里面。

DIALOGUE:
虚拟主播：
藏书大概有八万多册。平时……很安静。

DIALOGUE:
男高：
你记得好清楚。

DIALOGUE:
虚拟主播：
嗯。这里人少……我常来。

EXPRESSION: 虚拟主播=害羞、耳朵发红
STAGE:
她说完便继续往前带路，像是终于找到一段不用临时组织语言的介绍。

BACKGROUND: bg_school_cafeteria_day [占位符]

STAGE:
两人从图书馆出来，绕到主教学楼后方。
隔着操场可以看到食堂。

DIALOGUE:
虚拟主播：
那是食堂。一楼是打饭窗口，二楼座位多一些。

DIALOGUE:
虚拟主播：
中午靠窗的位置很抢手……我一般坐里面，那里人少。

DIALOGUE:
男高：
懂了。以后找不到你，就先去看最安静的角落。

STAGE:
虚拟主播脚步一顿，耳朵慢慢红了。

DIALOGUE:
虚拟主播：
……也不用特意找我。

DIALOGUE:
男高：
那边那个呢？

BACKGROUND: bg_school_gym_day [占位符]

DIALOGUE:
虚拟主播：
体育馆。一楼是篮球场和羽毛球场，二楼是观众席。

DIALOGUE:
虚拟主播：
下雨天的体育课都在那边上。

STAGE:
男高一边听一边点头。
她介绍得越具体，声音反而越平稳；只有发现男高正看着自己时，才会突然卡住。
JUMP: A009

### SCENE: A009

SCENE: A009
TITLE: 废弃施工区外围
TIME: 白天
BACKGROUND: bg_school_construction_zone_day [占位符]
BGM: bgm_school_mystery [占位符，待绑定]

SHOW: 男高 asset=char_male_high_normal [占位符] position=left
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
POSE: 男高=停步观察围栏
POSE: 虚拟主播=紧张、放慢脚步
EXPRESSION: 男高=好奇
EXPRESSION: 虚拟主播=不安

STAGE:
两人沿操场边小路往回走，来到操场与围墙之间的东北角。
镜头表现铁皮围栏、褪色的“施工中”牌子、塌陷大坑和生锈塔吊。

DIALOGUE:
男高：
这里是什么地方？怎么围了这么大一块？

DIALOGUE:
虚拟主播：
听说……这里原本要建新楼，但一直没有真的动工。

DIALOGUE:
虚拟主播：
学校不让靠近，说是施工危险。
也有人传，说地下挖出过什么奇怪的东西。

DIALOGUE:
虚拟主播：
我不知道哪个是真的……不过老师特意提醒过，不要来这边。

STAGE:
男高望着围栏后的大坑。
镜头在围栏深处短暂停留，表现似乎有什么东西正在注视男高。

CHOICE: 男高是否进入废弃施工现场。
JUMP: A010

### SCENE: A010

SCENE: A010
TITLE: 是否进入施工区域
TIME: 白天
BACKGROUND: bg_school_construction_zone_day [占位符]
BGM: bgm_school_mystery [占位符，延续]

OPTION 1:
去废弃施工现场看看。
SET: [变量名待定] 记录男高选择进入施工区域
SET: [变量名待定] 增加男高对学校地下异常的调查进度
JUMP: A011

OPTION 2:
回班上。
SET: [变量名待定] 记录男高选择返回班级
NARRATION:
【分支占位】返回班级支线尚未展开，不接入未发生的拔剑与取剑事件。
JUMP: A010_RETURN_CLASS

### SCENE: A011

SCENE: A011
TITLE: 施工区域·坑底与腐蚀之剑
TIME: 白天
BACKGROUND: bg_school_construction_zone_day [占位符]
BGM: bgm_school_mystery [占位符，低音量]

SHOW: 男高 asset=char_male_high_normal [占位符] position=left
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
POSE: 男高=推开铁皮小门、准备进入
POSE: 虚拟主播=慌张跟随
EXPRESSION: 男高=兴奋、好奇
EXPRESSION: 虚拟主播=害怕、焦虑

STAGE:
男高沿围栏走了几步，发现东侧有一扇锈迹斑斑的铁皮小门。
门闩只是虚挂着，没有上锁。

DIALOGUE:
男高：
门都没锁，看来只是不想让人随便进。

STAGE:
男高推开小门走进去。
虚拟主播飞快地观察四周，确认暂时没有老师经过，才咬咬牙跟到门内，却停在坑边不肯再往前。

DIALOGUE:
虚拟主播：
等、等一下……这里真的不能进。

DIALOGUE:
虚拟主播：
老师说过不能靠近。被发现了，肯定会被叫家长的……

DIALOGUE:
虚拟主播：
而且这里真的很危险。听说有人晚上路过，还听见里面传出奇怪的声音……

DIALOGUE:
男高：
我听见了。所以我下去看一眼就回来，不会乱碰。

STAGE:
男高走到坑边，朝下面看了看。大坑深得看不见完整的底部，只有塌落的泥土和裸露的钢筋。

DIALOGUE:
男高：
你留在上面等我。要是有人过来，就先提醒我。

DIALOGUE:
虚拟主播：
你至少先找条能下去的路——

STAGE:
男高撑着坑沿跃下，落地时屈膝卸力，很快站稳。
虚拟主播没能拦住他，只能跪趴在坑边，一半身体藏在防尘布后。

DIALOGUE:
虚拟主播：
……只看一眼。说好了。

DIALOGUE:
男高：
知道——嗯？

STAGE:
男高停下脚步。
坑底传来极轻、极轻的心跳声。

SFX: sfx_low_heartbeat [占位符]

DIALOGUE:
虚拟主播：
我们……还是回去吧。

STAGE:
男高顺着防尘布的破口朝坑底看去。
坑底泥土发黑，中央悬着一把剑，剑尖朝下，离地半尺，微微颤动。

SHOW: 大师之剑 asset=prop_master_sword_corrupted_placeholder [占位符] position=bottom_center
POSE: 大师之剑=悬浮、下半段被黑绿色污秽覆盖
EXPRESSION: 虚拟主播=恐惧

INNER:
男高：
这是……什么？

STAGE:
男高观察剑身。
剑柄顶端是紫蓝色菱形剑首，握柄缠着青绿色绳纹，翼状护手中央嵌着暗淡的金色三角宝石。
剑身上半段泛着象牙白的冷光，下半段被黑绿色污秽腐蚀，剑尖扭曲发黑。

DIALOGUE:
虚拟主播：
别碰它……那个看起来，很不正常。

EXPRESSION: 男高=被吸引、犹豫
STAGE:
男高明知不该靠近，却还是不由自主地朝剑柄伸出手。
剑身极轻微地颤动，金色三角宝石比刚才亮了一点。

NARRATION:
【原文只有“选择 1：男高伸手触碰剑柄”，没有替代选项；本处转换为强制事件，不新增玩家分支。】

JUMP: A012

### SCENE: A012

SCENE: A012
TITLE: 大师之剑·触碰与幻象
TIME: 白天与幻象时间混合
BACKGROUND: bg_school_construction_pit [占位符]
BGM: bgm_master_sword_vision [占位符，待绑定]

STAGE:
男高的手指触碰到剑柄。
整座大坑忽然安静下来，连风声都像被截断。

SFX: sfx_master_sword_resonance [占位符]
CG: cg_master_sword_vision_placeholder [占位符]
CAMERA: 镜头从剑柄金色三角宝石推进至幻象。

CALL: event_master_sword_vision

NARRATION:
【待确认】该特殊事件只负责幻象、音效和画面演出，不在本脚本中补写林克的完整角色卡背景。

NARRATION:
男高看见一座漂浮在云海之上的岛屿。

NARRATION:
他看见一名右臂被异样力量侵蚀的青年从空中坠落。

NARRATION:
他看见一座升上天空的城堡，漆黑瘴气从地底涌出，将白色剑刃一点点染成黑绿色。

NARRATION:
画面再次变换。
一条发出金色光芒的巨龙在云层间盘旋，巨龙头顶插着一把残破的剑。

NARRATION:
那个青年站在巨龙头顶，伸手重新握住剑柄。

NARRATION:
光芒、龙鳞、坠落的城堡和远去的身影交错闪过。
这些不是男高的记忆，但他能感受到其中的失去、恐惧和决心。

NARRATION:
幻象最后停留在一片安静的草地上。
青年拔出剑，剑刃发出清澈的鸣响。

STAGE:
男高猛地回过神来。
他双手握住剑柄，用力向上拔。

STAGE:
大师之剑被一点点拔出。
覆盖在下半截剑刃上的黑绿色污秽蠕动起来，脱离剑身并落到泥土上。
剑身重新露出象牙白的光泽，但仍残留腐蚀裂纹。

DIALOGUE:
男高：
刚才那些……不是我睡糊涂了吧？

DIALOGUE:
男高：
一把剑，怎么会让我看到那种东西……

STAGE:
男高抱着大师之剑，转身走向坑边。
污秽在他身后的泥土中缓慢聚拢。
JUMP: A013

### SCENE: A013

SCENE: A013
TITLE: 施工区域·黑色人形
TIME: 白天
BACKGROUND: bg_school_construction_pit [占位符]
BGM: bgm_black_humanoid_appearance [占位符，待绑定]

SHOW: 男高 asset=char_male_high_normal [占位符] position=bottom_center
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=top_right
SHOW: 黑色人形 asset=char_black_humanoid_placeholder [占位符] position=bottom_left
POSE: 男高=持剑、准备保护虚拟主播
POSE: 虚拟主播=趴在坑边、即将失去意识
POSE: 黑色人形=由污秽聚合、站起
EXPRESSION: 男高=震惊、警戒
EXPRESSION: 虚拟主播=恐惧

STAGE:
黑绿色污秽沿坑底向中央爬行，聚成一团扭曲阴影。
阴影逐渐长出双腿、躯干、手臂和头颅。
它的脸上没有五官，只有两点暗红色光芒。

STAGE:
虚拟主播看见黑色人形，先是撑着坑边想提醒男高。

DIALOGUE:
虚拟主播：
后、后面……快上来——

STAGE:
她的声音没能说完。恐惧抽走了她全身的力气，身体软软倒在坑边。

SFX: sfx_fainting [占位符]

DIALOGUE:
男高：
喂！你怎么了——
这、这是什么东西？！

STAGE:
男高看向昏迷的虚拟主播，又看向坑底正在逼近的黑色人形。
把她留在这里逃跑做不到，带着她直接爬上坑壁也来不及。
他握紧大师之剑，站到了两者之间。

INNER:
男高：
不能把她丢在这里。

DIALOGUE:
男高：
本来想先带她上去的……
看来只能先解决你了！

STAGE:
黑色人形抬起由污渍凝成的手臂，黑色能量在掌心聚集。
JUMP: A014

### SCENE: A014

SCENE: A014
TITLE: 黑色人形战斗
TIME: 白天
BACKGROUND: bg_school_construction_pit [占位符]
BGM: bgm_black_humanoid_battle [占位符，待绑定]

STAGE:
战斗界面切入。

CALL: battle_black_humanoid

NARRATION:
【待确认】黑色人形的战斗数据、胜利条件、失败处理和战斗奖励。

STAGE:
战斗结束后，大坑重新安静下来。
黑色人形消失，只剩零散的黑色污渍留在泥土上。
大师之剑的光芒慢慢收敛，只剩剑刃中央一条极细的金色纹路。

SHOW: 男高 asset=char_male_high_normal [占位符] position=center
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
POSE: 男高=战斗后疲惫、扶住虚拟主播
POSE: 虚拟主播=昏迷
EXPRESSION: 男高=麻烦、担心

STAGE:
男高把大师之剑插回坑底旁边的泥土，随后冲向坑边扶住虚拟主播。
他先俯身确认她还有呼吸，才松了口气，小心抱起她，沿着坑壁向上爬。

STAGE:
虚拟主播的书包掉在铁皮围栏旁边。
男高先把她抱出施工区，再折返回去捡起书包，并把铁皮小门重新关上。

STAGE:
男高回头看向坑底。
大师之剑静静插在泥土中，金色纹路一闪而过。
更深的泥土里，一缕极细的黑气朝学校地下延伸。

SET: [变量名待定] 记录虚拟主播目击黑色人形
SET: [变量名待定] 增加男高对学校地下异常的调查进度
JUMP: A015

### SCENE: A015

SCENE: A015
TITLE: 回到学校
TIME: 白天、课间铃响
BACKGROUND: bg_school_hallway_day [占位符]
BGM: bgm_school_mystery [占位符，低音量]

SHOW: 男高 asset=char_male_high_normal [占位符] position=center
SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=center_front
POSE: 男高=抱着虚拟主播、疲惫
POSE: 虚拟主播=昏迷
EXPRESSION: 男高=尴尬、担心

STAGE:
男高抱着昏迷的虚拟主播回到教学楼。
课间铃声刚好响起，走廊上的学生纷纷停下脚步看向他们。

SFX: sfx_school_bell [占位符]

STAGE:
男高没有察觉，自己手上的剑形灼痕正在袖口下缓缓发光。

SET: [变量名待定] 记录男高带虚拟主播返回学校
JUMP: A015_RECOVERY

### SCENE: A015_RECOVERY

SCENE: A015_RECOVERY
TITLE: 保健室与照顾交接
TIME: 白天，回到教学楼后
BACKGROUND: bg_school_infirmary_day [制作占位]
BGM: bgm_school_daily [制作占位／待绑定]

SHOW: 男高 asset=char_male_high_normal [占位符] position=left
POSE: 男高=站在病床边
EXPRESSION: 男高=担心，松一口气

SHOW: 虚拟主播 asset=char_virtual_streamer_shy [占位符] position=right
POSE: 虚拟主播=躺在病床上，逐渐醒来
EXPRESSION: 虚拟主播=疲惫，疑惑

STAGE:
男高没有在走廊停留，径直把虚拟主播送到保健室。老师接过人，指挥他把她放到床上，又让他去通知班主任。

DIALOGUE:
保健室老师：
先把她交给我。你去叫班主任，回来再把经过说清楚。

STAGE:
男高照做，直到班主任赶来、老师接手照看，他才从门边慢慢松开一直攥紧的手。

STAGE:
过了一阵，虚拟主播睁开眼，看见他还站在床边，下意识把被子往上拉了拉。

DIALOGUE:
男高：
醒了？现在有没有好一点？

DIALOGUE:
虚拟主播：
……嗯。对不起，我什么都没帮上。

DIALOGUE:
男高：
你道什么歉。是我非要进去，才害你碰上那种东西。
要道歉也是我先说。……抱歉。

STAGE:
虚拟主播抓紧被角，轻轻摇头。她想起坑底那把剑，声音又低了下去。

DIALOGUE:
虚拟主播：
那把剑——

STAGE:
门外响起老师的脚步。她停住话，男高也没有再追问，只把她的书包放到伸手就能拿到的地方。

DIALOGUE:
男高：
先休息。我已经把老师叫来了。
有什么话，等你好一点再说。

STAGE:
他向老师确认这里有人照顾，才离开保健室。
下午的课照常继续；临近放学，虚拟主播回教室拿书包。男高特意观察她能否正常回应，又在门口低声补了一句。

DIALOGUE:
男高：
下次我不会再让你跟着我冒险了。

DIALOGUE:
虚拟主播：
……下次也不要自己一个人去。

JUMP: A015_RETRIEVE

### SCENE: A015_RETRIEVE

SCENE: A015_RETRIEVE
TITLE: 放学返回施工区取剑
TIME: 当日放学后，傍晚
BACKGROUND: bg_school_construction_zone_dusk [制作占位]
BGM: bgm_sword_quiet_mystery [制作占位／待绑定]

HIDE: 虚拟主播

SHOW: 男高 asset=char_male_high_normal [占位符] position=center
POSE: 男高=取剑，抖开旧布包裹
EXPRESSION: 男高=犹豫，决定

STAGE:
放学的人群朝校门涌去，男高走到半路，却又停下脚步。剑还留在施工区里，白天那一幕也没有真正从脑海中消失。

INNER:
男高：
要是又有人进去，碰到它……
总不能把这种东西留在谁都能靠近的地方。

STAGE:
他调转方向，沿原路回到操场东北角。铁皮小门仍虚掩着，坑底的剑也还插在原处。

STAGE:
这一次，他没有直接往下跳，而是沿先前出来时能落脚的坑壁慢慢下去。确认周围没有新的动静，才握住剑柄，将剑从土中抽出。

STAGE:
金色纹路微微一亮，随即安静下来。男高等了一会儿，没有再看见幻象，也没有污秽从剑上落下。

DIALOGUE:
男高：
先带回去藏好。总比留在这种谁都能进来的地方强。

STAGE:
他从围栏旁的旧布堆中挑出一块没有破洞的布，抖净尘土，把剑刃和护手仔细裹好。上到地面后，又将铁皮小门重新关上。

STAGE:
离开学校时，剑已经包在旧布里，被他夹在身侧。一路上，他不时低头确认布角没有松开，沿主路回到老住宅区。

SET: has_master_sword = true
JUMP: A016

### SCENE: A016

SCENE: A016
TITLE: 序幕（二）取剑主线结束
TIME: 当日傍晚
BACKGROUND: bg_grandmother_house_dusk [制作占位]
BGM: bgm_scene_transition [占位符，待绑定]

CHECK: has_master_sword == true [仅取剑主线可进入此终点]

STAGE:
男高带着包好的大师之剑回到奶奶家门前，屋里传来准备晚饭的声音。

SET: [变量名待定] 记录序幕（二）主线结束
END: A016

### SCENE: A010_RETURN_CLASS

SCENE: A010_RETURN_CLASS
TITLE: 返回班级·未完成支线
TIME: 白天
BACKGROUND: bg_school_classroom_day [占位符]
BGM: bgm_school_daily [占位符]

STAGE:
男高收回望向施工区的目光，跟着向导回到班上。

END: A010_RETURN_CLASS

## 第四部分：分支与变量表

| 编号 | 触发位置 | 玩家选择 | 变量变化 | 后续跳转 | 是否影响结局 |
|---|---|---|---|---|---|
| A-B01 | A007 | 选择怪盗 | 记录选择，变量名待定 | A007_TODO_THIEF | 原文未说明；当前不可执行 |
| A-B02 | A007 | 选择虚拟主播 | 记录选择，变量名待定 | A008 | 原文未说明 |
| A-B03 | A007 | 选择反派 | 记录选择，变量名待定 | A007_TODO_VILLAIN | 原文未说明；当前不可执行 |
| A-B04 | A007 | 让老师选择 | 调用 `random_rd3` | 结果为 1 或 3 时进入 A007_RANDOM_UNAVAILABLE；结果为 2 时进入 A008 | 原文未说明 |
| A-B05 | A010 | 进入废弃施工现场 | 记录进入施工区，增加调查进度，变量名待定 | A011 | 原文未说明 |
| A-B06 | A010 | 回班上 | 记录返回班级，变量名待定 | A010_RETURN_CLASS | 未完成支线，在此结束，不接 B001 |
| A-B07 | A011 | 触碰剑柄 | 原文单一选项，按强制事件处理 | A012 | 原文未说明 |
| A-B08 | A014 | 战斗结果 | 记录战斗结果，变量名待定 | A015 → A015_RECOVERY | 本稿承接已完成战斗后的救人情节；数值与失败制作另行处理 |
| A-B09 | A015_RETRIEVE | 放学取剑，强制衔接 | has_master_sword = true | A016；章节交接至 B001 | 仅已拔剑主线接入序幕三 |

`has_master_sword` 初始为 false，仅 A015_RETRIEVE 设置为 true。此名称为剧情文档交接约定，未接入现有游戏存档；本次未改写任何引擎状态结构。

## 第五部分：演出与素材需求表

| 编号 | 类型 | 素材名称 | 用途 | 是否已有 | 备注 |
|---|---|---|---|---|---|
| A-M01 | 背景 | `bg_grandmother_house_bedroom_morning` | 男高睡过头 | 否 | 占位符 |
| A-M02 | 背景 | `bg_sun_city_school_road_morning` | 上学路上 | 否 | 占位符 |
| A-M03 | 背景 | `bg_school_gate_morning` | 学校门口 | 否 | 占位符 |
| A-M04 | 背景 | `bg_school_classroom_morning` | 自我介绍 | 否 | 占位符 |
| A-M05 | 背景 | `bg_school_classroom_day` | 课间选向导 | 否 | 占位符 |
| A-M06 | 背景 | `bg_school_library_day` | 图书馆 | 否 | 占位符 |
| A-M07 | 背景 | `bg_school_cafeteria_day` | 食堂 | 否 | 占位符 |
| A-M08 | 背景 | `bg_school_gym_day` | 体育馆 | 否 | 占位符 |
| A-M09 | 背景 | `bg_school_construction_zone_day` | 施工区外围 | 否 | 占位符 |
| A-M10 | 背景 | `bg_school_construction_pit` | 坑底 | 否 | 占位符 |
| A-M11 | 背景 | `bg_school_hallway_day` | 回到学校 | 否 | 占位符 |
| A-M12 | 立绘 | `char_male_high_normal` | 男高 | 部分已有 | `角色\御主\御主：热血男高+saber\图片\热血男高_主立绘.png` 可作为候选 |
| A-M13 | 立绘 | `char_virtual_streamer_shy` | 虚拟主播 | 否 | 占位符 |
| A-M14 | 立绘 | `char_thief_smile` | 怪盗 | 部分已有 | `角色\御主\御主：怪盗+（rider）\图片\怪盗 站立 待机.png` 等可作为候选 |
| A-M15 | 立绘 | `char_villain_calm` | 反派 | 否 | 占位符 |
| A-M16 | 立绘 | `char_idol_neutral` | 偶像 | 否 | 占位符 |
| A-M17 | 立绘 | `char_teacher_placeholder` | 老师 | 否 | 占位符 |
| A-M18 | 立绘 | `char_black_humanoid_placeholder` | 黑色人形 | 否 | 占位符 |
| A-M19 | 道具 | `prop_master_sword_corrupted_placeholder` | 被腐蚀的大师之剑 | 否 | 占位符 |
| A-M20 | 道具 | `prop_dark_god_crystal_placeholder` | 学校地下结晶 | 否 | 占位符 |
| A-M21 | CG | `cg_master_sword_vision_placeholder` | 大师之剑幻象 | 否 | 占位符 |
| A-M22 | BGM | `bgm_school_morning` | 早晨、上学 | 待确认 | 原文未指定 |
| A-M23 | BGM | `bgm_school_classroom_daily` | 教室日常 | 待确认 | 原文未指定 |
| A-M24 | BGM | `bgm_school_daily` | 校园参观 | 待确认 | 原文未指定 |
| A-M25 | BGM | `bgm_school_mystery` | 施工区与异常 | 待确认 | 原文未指定 |
| A-M26 | BGM | `bgm_master_sword_vision` | 剑的幻象 | 待确认 | 原文未指定 |
| A-M27 | BGM | `bgm_black_humanoid_battle` | 黑色人形战斗 | 待确认 | 原文未指定 |
| A-M28 | 音效 | `sfx_low_heartbeat` | 学校地下结晶、施工区坑底 | 否 | 占位符 |
| A-M29 | 音效 | `sfx_master_sword_resonance` | 触碰剑柄 | 否 | 占位符 |
| A-M30 | 音效 | `sfx_fainting` | 虚拟主播昏倒 | 否 | 占位符 |
| A-M31 | 音效 | `sfx_school_bell` | 回到学校 | 否 | 占位符 |
| A-M32 | 战斗 | `battle_black_humanoid` | 黑色人形战斗 | 否 | 需要后续 Godot 战斗事件绑定 |
| A-M33 | 特殊事件 | `event_master_sword_vision` | 剑柄触碰幻象 | 否 | 当前由 A012 的演出脚本表示 |
| A-M34 | 特殊事件 | `random_rd3` | 老师随机决定向导 | 否 | 需要后续确定随机与存档规则 |
| A-M35 | UI | `游戏机制\剧情\对话界面.png` | 对话界面候选 | 已有 | 仅记录候选，不自动绑定 |
| A-M36 | UI | `游戏机制\战斗\战斗界面.png` | 战斗界面候选 | 已有 | 仅记录候选，不自动绑定 |
| A-M37 | 背景 | `bg_school_infirmary_day` | A015_RECOVERY 保健室 | 待核对 | 制作占位 |
| A-M38 | 背景 | `bg_school_construction_zone_dusk` | A015_RETRIEVE 放学取剑 | 待核对 | 制作占位 |
| A-M39 | 道具 | `prop_master_sword_cloth_wrap` | 包好带回家的大师之剑 | 待核对 | 制作占位 |

## 第六部分：对白质量检查

### 1. 人物性格

- 男高的迟到、冲刺、热血自我介绍和主动进入施工区，符合其直率、冲动、憧憬勇者的设定；被老师叫住和保健室道歉则补上责任感，避免只剩莽撞。
- 虚拟主播通过抱紧书、避开视线、记住馆内资料和偏好人少位置表现社恐，不再只依赖结巴。
- 怪盗在路口和教室中的短对白呈现轻松、观察感与掩饰身份的分寸，怪盗动机仍留待后续揭露。
- 反派的对白从泛泛的“有趣”调整为关注男高受挫后能否坚持，贴合其观察他人挣扎的兴趣。
- 偶像通过简短追问和克制的笑容表现对反派注意力的敏感，不提前公开两人的深层关系。

### 2. 过度解释

- 校园设施介绍保留原有信息，但已拆成多段对白和场景切换。
- 大师之剑外观信息通过舞台指令和道具占位符表现，不让角色重复复述画面内容。
- 林克、黑暗神、圣杯战争的完整背景没有直接放入当前对白。

### 3. 文本框长度

- 长篇小说段落已经拆成较短的 `NARRATION`、`DIALOGUE` 和 `STAGE`。
- 虚拟主播的说明性台词仍有部分两句组合，后续配音时可以进一步拆分。
- A012 幻象部分按画面段落切分，避免一次性显示完整设定。

### 4. 重复表达

- 男高的勇者憧憬保留在序幕一结尾，本幕更多通过冲出去、保护同伴和主动认错表现人物核心，避免机械重复口号。
- 施工区的“危险”“不该靠近”由虚拟主播分层表达：先讲学校规定，再讲传闻，最后直接阻止触剑；配音时应逐渐加快而不是持续结巴。

### 5. 不自然对白

- “老师，可以让反派带我去吗？他看起来挺靠谱的！”原文中存在，但由于反派路线没有正文，本脚本只保留选项，不扩展反派对白。
- 男高的座位回应已改为“好，谢谢老师”，保留热情但避免过度口语化。
- 虚拟主播的介绍台词已减少连续结巴，紧张时以短停顿、抱书和回避视线补足表演。

### 6. 说话风格混淆

- 男高和怪盗都能轻松接话：男高保持直接、会认真道歉；怪盗则用观察、调侃和轻描淡写掩饰真实注意。
- 反派与偶像已通过简短对白区分声线：反派像在看一场值得期待的反应，偶像则克制地确认他的注意力落在何处。

### 7. 应转为旁白或演出指令的内容

- 校门、教学楼、图书馆、食堂、体育馆和施工区的空间信息主要转为背景与 `STAGE`。
- 大师之剑的外观、幻象和黑色人形的成形过程主要转为 CG、镜头、道具和特殊演出。
- 角色走路、冲刺、抱起虚拟主播、推门和进入坑底主要转为动作指令。

### 8. 配音难度

- 男高自我介绍和施工区战斗前的喊话需要较强的情绪爆发。
- 虚拟主播的台词需要处理小声、停顿、结巴和恐惧之间的变化。
- 反派的语气需要保持礼貌、平静和危险感的并存。
- 偶像心声如果配音，需要确认是否与普通对白采用不同处理。

## 第七部分：修改建议

【建议编号】A-S01
原文问题：怪盗带路和反派带路只有选项名称，没有正文。
建议方向：后续分别补写校园参观内容，并明确两条路线在日常关系、调查信息和主线事件上的差异。
是否影响剧情：会影响序幕（二）的可玩性和角色路线入口。
是否需要我确认：是。

【建议编号】A-S02
原文问题：`rd3` 随机结果可能进入当前不存在的路线。
建议方向：在路线正文补齐前，建议暂时禁用该选项或让随机结果仅在已完成路线中生效。
是否影响剧情：会影响玩家能否正常完成流程。
是否需要我确认：是。

【已处理】A-S03
确认结果：白天触剑建立联系，放学取剑带回家，序幕三在求生呼唤时完成林克召唤。本幕对白不提前解释这套联系。

【已处理】A-S04
处理结果：A011 明确男高让虚拟主播留在坑边、她因担心被发现和不愿丢下男高而停在施工区内；保健室段落由男高主动承担把她卷入危险的责任。未新增路线结果或设定信息。

【已处理】A-S05
确认结果：A015 → A015_RECOVERY（保健室与照顾交接）→ A015_RETRIEVE（放学取剑）→ A016。仅这条主线衔接序幕三；返回班级分支独立结束。
