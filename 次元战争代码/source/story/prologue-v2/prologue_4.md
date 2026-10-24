# 序幕（四）：警报下的同行者 · Galgame 脚本

> 类型：引擎无关纯文本脚本；不是已接入游戏的运行文件。
>
> 对应：[剧情正文](序幕（四）.md) · [白板](序幕（四）.canvas)
>
> 正式演出范围：C001—C013。制作说明、状态表和素材表不进入玩家文本框。

## 第一部分：结构与角色显示

承接序幕三梦醒后的同一夜。组织为搜捕梦魇进入住宅片区，男高与林克卷入冲突，在明显压制普通型后遭遇另一形态和组织增援，最终由怪盗与 Saber 接应撤离。

| 场景 | 标题 | 地点 | 时间 |
|---|---|---|---|
| C001 | 警报与搜捕队 | 男高房间／老住宅区街道 | 序幕三结束后，同一夜 |
| C002 | 出门与认出 | 老住宅区路口，向旧街区支路移动 | 同一夜 |
| C003 | 第一次配合 | 通往旧街区的支路 | 同一夜，第一场战斗 |
| C004 | 第一名干部到场 | 旧街区支路较宽处 | 小兵战后 |
| C005 | 林克明显占优 | 旧街区支路交战处 | 同一夜，从者遭遇前半段 |
| C006 | 防御型与第二名干部加入 | 同一街道，侧巷与后方出口 | 同一场遭遇，增援抵达 |
| C007 | 局势转为棘手 | 逐渐收紧的街道包围圈 | 同一场遭遇，增援后 |
| C008 | 怪盗与女剑士接应 | 街道墙侧／包围圈外的狭巷 | 同一夜，撤离 |
| C009 | 小巷中的真实身份 | 旧街区一条暂时安静的小巷 | 脱离包围后 |
| C010 | 圣杯战争的最低限度说明 | 同一小巷 | 短暂交换情报 |
| C011 | 介绍 Saber | 同一小巷，准备转移 | 说明之后 |
| C012 | 暂时合作 | 小巷出口附近 | 同一夜，分别前 |
| C013 | 夜归与新的同伴 | 奶奶家门前、客厅与男高房间 | 同一夜，稍后 |

### 作者身份与玩家显示名

| 作者身份 | 玩家显示名 | 使用边界 |
|---|---|---|
| 男高 | 男高 | 不知道组织真正的搜捕目标，优先保护奶奶。 |
| 林克 | 金发青年 | 持续沉默；不新增自报真名或完整职阶说明。 |
| 怪盗 | 蒙面人 → 怪盗 | C009才摘下面罩，确认首夜获救者及同班同学身份。 |
| 怪盗的从者 | 女剑士 → Saber | C008接应，C011公开职阶；真名仅见作者说明。 |
| 代欧奇希斯 | 不明生物·普通型／防御型 | 制作标签注明形态，男高不凭空知道其真名。 |
| 组织干部 | 黑衣干部甲／黑衣干部乙 | 不新增姓名与完整背景。 |
| 奶奶 | 奶奶 | C013允许朋友临时借宿，尚不知道圣杯战争。 |

## 第二部分：已确定的演出与调用边界

- 怪盗的从者真名为荧，仅供作者与制作资料使用；剧情正文、对白和名字牌只使用女剑士／Saber。
- 普通型与防御型是同一代欧奇希斯灵基的两个侧面。干部甲负责普通型，干部乙负责防御型；本幕不完整讲解四相灵基、共享意识或十五枚令咒。
- 组织因探测到梦魇使用能力而搜捕她；梦魇本体仍在漫画店阁楼。男高是在出门遇到搜捕队后被认出，组织并非因林克召唤而直接定位其家门。
- 林克对普通型明显占优，后续困难来自增援协同、封锁退路及护住男高的多重任务。双方从者均未在本幕退场。
- 怪盗跟踪搜捕队来到附近，观察局面后组织接应；空间脱身后仍需绕行与确认尾随。

| 调用 | 位置 | 演出与返回约定 |
|---|---|---|
| `battle_prologue4_patrol` | C003 | 小兵战；完成后继续 C003战后段落，再进 C004。失败重试本战，不跳过为后续已胜利。 |
| `battle_prologue4_deoxys_encounter` | C005 | 一次分阶段遭遇调用。普通型受压阶段完成后返回 C005战后演出，再进 C006增援、C007撤离判断与 C008接应。不得结算为击杀或淘汰从者。 |

以上为制作交接约定，尚未实现引擎调用。普通型压制、增援与撤离的剧情结果已经确定；敌人回合门槛、伤害、奖励和失败界面留给后续战斗制作。本次不修改任何角色或怪物数据。C006—C008不再次调用同一战斗，以免重复播放普通型受压阶段。

## 第三部分：Galgame 正式脚本

### SCENE: C001

SCENE: C001
TITLE: 警报与搜捕队
TIME: 序幕三结束后，同一夜
BACKGROUND: bg_grandmother_bedroom_night [制作占位]
BGM: bgm_after_dream_quiet [制作占位／待绑定]

CHECK: prologue_3_complete == true AND link_summoned == true [章节入口约束；未满足时不得接入本幕]

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=坐在床沿，侧耳倾听
EXPRESSION: 男高=疑惑

SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
POSE: 金发青年=站在床边，转向窗户
EXPRESSION: 金发青年=警戒

SFX: sfx_search_vehicle_alarm [制作占位]

STAGE:
一阵短促的电子警报打破了房间里的安静。男高刚想继续问话，便看见窗帘边缘扫过一道白光。

DIALOGUE:
男高：
外面怎么了？

STAGE:
他掀起窗帘一角。街口停着一辆深色车辆，几个穿黑制服的人正拿着金属装置沿路查看。那身衣服，他昨晚才在仓库区见过。

DIALOGUE:
男高：
……又是他们。

STAGE:
金发青年走到窗侧，避开扫来的灯光，朝男高做了个退后一点的手势。

HIDE: 男高
HIDE: 金发青年
BACKGROUND: bg_old_residential_search_night [制作占位，场内切镜]

STAGE:
街口，队员按住耳机，盯着装置上迅速变淡的反应。

DIALOGUE:
搜捕通讯：
梦境反应确认。位置在这片住宅区。

DIALOGUE:
搜捕通讯：
反应刚刚中断。实验体还没有找到，分组继续搜索。

STAGE:
一支小队转向街道另一端，另一支留在岔路口。灯光掠过紧闭的店门与墙角，搜捕没有随着警报停止。

BACKGROUND: bg_grandmother_bedroom_night [制作占位，场内切镜]
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=站在窗边，松开窗帘
EXPRESSION: 男高=戒备
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
POSE: 金发青年=站在窗侧，避开灯光
EXPRESSION: 金发青年=警戒

STAGE:
男高松开窗帘，回头看了一眼通向楼下的房门。
奶奶的房间没有亮灯。要是那些人一路查到这扇门，他不能让她什么都不知道地卷进来。

INNER:
男高：
至少，先把他们引离这里。

JUMP: C002

### SCENE: C002

SCENE: C002
TITLE: 出门与认出
TIME: 同一夜
BACKGROUND: bg_residential_junction_night [制作占位]
BGM: bgm_organization_tension [制作占位／待绑定]

HIDE: 男高
HIDE: 金发青年

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=披上外套，与队员保持距离
EXPRESSION: 男高=戒备

SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
POSE: 金发青年=跟在男高侧后方
EXPRESSION: 金发青年=观察

SHOW: 黑衣队员 asset=char_organization_member_placeholder [占位符／待核对复用] position=right
POSE: 黑衣队员=拿着探测装置，抬头打量
EXPRESSION: 黑衣队员=怀疑

STAGE:
男高披上外套，放轻脚步下楼。奶奶房间里没有亮灯。他轻轻带上院门，走到路口时，才让自己出现在搜捕队的视线中。金发青年始终跟在侧后方。

STAGE:
一名队员本来只是朝他们举起灯，照到男高的脸后，动作忽然停住。

DIALOGUE:
黑衣队员：
是你。昨晚仓库外面那个学生。

DIALOGUE:
男高：
你们大半夜拿着那种东西，在居民区找什么？

DIALOGUE:
黑衣队员：
先站住。你身后的人，把手里的东西放下。

STAGE:
金发青年没有放剑，只把剑尖移开居民家的方向。队员看见他的装束与武器，立刻后退一步，招呼同伴靠近。

DIALOGUE:
黑衣队员：
这边有情况。昨晚放跑目标的人又出现了，还带着一个——

STAGE:
男高打断他，朝通往旧街区的支路退了几步。

DIALOGUE:
男高：
要问昨晚的事，就跟我说。
这里都是住户，别堵在别人家门口。

STAGE:
他边说边走，把两人的位置带离住宅正门。队员跟着逼近，另一人试图从旁边绕过去，抓住男高的胳膊。

DIALOGUE:
男高：
我自己会走，别动手。

STAGE:
对方却猛地收紧手指。男高拧身挣开，金发青年也在同一刻迈步，挡住了另一名队员伸来的金属装置。

DIALOGUE:
搜捕通讯：
路口小组控制现场。其余小组继续找实验体，不要全部离开搜索区域。

JUMP: C003

### SCENE: C003

SCENE: C003
TITLE: 第一次配合
TIME: 同一夜，第一场战斗
BACKGROUND: bg_old_district_access_night [制作占位]
BGM: bgm_first_partners_battle [制作占位／待绑定]

HIDE: 男高
HIDE: 金发青年
HIDE: 黑衣队员

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=摆开徒手架势，靠近墙侧
EXPRESSION: 男高=紧张，集中

SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
POSE: 金发青年=拔剑护住主路方向
EXPRESSION: 金发青年=冷静

SHOW: 黑衣队员 asset=char_organization_member_placeholder [占位符／待核对复用] position=right
POSE: 黑衣队员=招呼同伴围上
EXPRESSION: 黑衣队员=急躁

STAGE:
队员们散开，堵住两人前后。男高刚准备迎向正面的人，青年便向左侧示意，给他留出靠墙的一边。

DIALOGUE:
男高：
那边交给我？好。

STAGE:
他退进青年让出的空位，避开正面交错的攻击。

CALL: battle_prologue4_patrol

STAGE:
男高挡开伸向领口的手，用肩膀顶开近身的队员。另一人想从侧面扑上来，脚步却被青年用剑身一拨，踉跄着撞上同伴。

STAGE:
男高抬头，恰好看见街灯下又有人举起装置。

DIALOGUE:
男高：
右边！

STAGE:
青年已经转身，剑光贴着金属装置掠过，将它打落在地。他没有追着倒下的人补击，只顺势往前一步，截住后方的支援。

STAGE:
短暂的混乱很快结束。队员或抱着手臂蹲下，或退到路边，不敢再单独上前。男高扶着膝盖喘气，抬眼看向身旁仍握着剑的人。

DIALOGUE:
男高：
……你比我想的还厉害。

STAGE:
青年确认他还能站稳，才重新望向支路尽头。那里传来了不紧不慢的脚步声。

JUMP: C004

### SCENE: C004

SCENE: C004
TITLE: 第一名干部到场
TIME: 小兵战后
BACKGROUND: bg_old_district_battle_street_night [制作占位]
BGM: bgm_foreigner_approach [制作占位／待绑定]

HIDE: 男高
HIDE: 金发青年
HIDE: 黑衣队员

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=站在墙侧，调整呼吸
EXPRESSION: 男高=警惕

SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
POSE: 金发青年=向前半步，将男高护在身后
EXPRESSION: 金发青年=戒备

SHOW: 黑衣干部甲 asset=char_organization_officer_a_placeholder [占位符／待核对复用] position=right
POSE: 黑衣干部甲=停步，观察两人
EXPRESSION: 黑衣干部甲=克制，审视

STAGE:
一名黑衣干部从队员让开的通道中走来。他没有先看地上的人，目光直接停在了持剑青年的身上。

DIALOGUE:
黑衣干部甲：
退后。你们处理不了这个。

STAGE:
队员迅速让出一段空地。干部身旁，一个红蓝相间的人形生物缓缓悬起，细长的触臂在身侧展开，胸口的水晶映着路灯的冷光。

SHOW: 不明生物·普通型 asset=char_deoxys_normal_placeholder [占位符／待核对复用] position=right
POSE: 不明生物·普通型=悬浮，触臂展开
EXPRESSION: 不明生物·普通型=锁定目标

STAGE:
男高看见它没有碰到地面，喉咙不由得紧了一下。昨晚那些装置和白天的黑色人形，都没有给过他这种感觉。

DIALOGUE:
男高：
这又是什么……？

DIALOGUE:
黑衣干部甲：
新出现的从者。原来如此。

STAGE:
他看向男高，像终于把昨晚的意外和眼前的人联系到一起。

DIALOGUE:
黑衣干部甲：
那就一起留下。

STAGE:
青年没有理会干部。他把男高轻轻往侧后方挡了一下，握剑的姿势随之收紧。

JUMP: C005

### SCENE: C005

SCENE: C005
TITLE: 林克明显占优
TIME: 同一夜，从者遭遇前半段
BACKGROUND: bg_old_district_battle_street_night [制作占位]
BGM: bgm_link_advantage [制作占位／待绑定]

HIDE: 男高
HIDE: 金发青年
HIDE: 黑衣干部甲
HIDE: 不明生物·普通型

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=靠墙移动，避开主战线
EXPRESSION: 男高=紧张，随后惊讶

SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
POSE: 金发青年=持剑突进，连续截断对手攻势
EXPRESSION: 金发青年=专注

SHOW: 不明生物·普通型 asset=char_deoxys_normal_placeholder [占位符／待核对复用] position=right
POSE: 不明生物·普通型=悬浮，触臂展开
EXPRESSION: 不明生物·普通型=锁定目标

STAGE:
红蓝生物率先抬起触臂。无形的压力扫过街面，碎石一齐跳起；青年却在它完成动作之前，已经侧身跨进了攻击的空隙。

CALL: battle_prologue4_deoxys_encounter

SFX: sfx_sword_energy_clash [制作占位]

STAGE:
第一剑打偏伸来的触臂，第二步逼近胸前。普通型急速后退，刚想从另一边卷住剑刃，青年便旋腕抽剑，再次截断它的动作。

STAGE:
男高原本已经绷紧全身，准备随时躲开横扫过来的攻击。可他很快发现，对方一直在后退。

STAGE:
普通型拉开距离，水晶前浮起明亮的光。青年借墙边一踏改变方向，在光束扫过的位置留下一道残影，落地时又一次逼到近处。

STAGE:
干部伸出的手停在半空。刚才从容的神色终于沉了下来。

DIALOGUE:
男高：
能赢……

STAGE:
他说得很轻，却不是凭空给自己打气。对方每次重新组织攻击，都被青年更快一步打断；双方的位置已经从男高身前移向了街道另一端。

STAGE:
青年没有贪追过深，始终留着能退回男高身边的距离。普通型胸前再次亮起光时，他已经压下剑锋，准备继续逼近。

JUMP: C006

### SCENE: C006

SCENE: C006
TITLE: 防御型与第二名干部加入
TIME: 同一场遭遇，增援抵达
BACKGROUND: bg_old_district_battle_street_night [制作占位]
BGM: bgm_organization_reinforcements [制作占位／待绑定]

HIDE: 男高
HIDE: 金发青年
HIDE: 不明生物·普通型

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=望向新出现的敌人
EXPRESSION: 男高=惊讶

SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
POSE: 金发青年=收剑，重新判断站位
EXPRESSION: 金发青年=戒备

SHOW: 不明生物·普通型 asset=char_deoxys_normal_placeholder [占位符／待核对复用] position=right
POSE: 不明生物·普通型=悬浮，触臂展开
EXPRESSION: 不明生物·普通型=锁定目标

SHOW: 不明生物·防御型 asset=char_deoxys_defense_placeholder [占位符／待核对复用] position=right
POSE: 不明生物·防御型=展开屏障，护住普通型
EXPRESSION: 不明生物·防御型=稳定

SFX: sfx_barrier_impact [制作占位]

STAGE:
剑刃落下之前，一面厚重的屏障插入两者之间。青年的手腕随冲击微微一沉，脚步却没有乱，立即收剑滑向一旁。

STAGE:
屏障后，又一个红蓝色的身影落进街灯照亮的地方。它的轮廓比先前厚重，姿态更低，双臂展开，将普通型护在了后面。

DIALOGUE:
男高：
还有一个？！

SHOW: 黑衣干部乙 asset=char_organization_officer_b_placeholder [占位符／待核对复用] position=right
POSE: 黑衣干部乙=走入侧巷口，指挥部队
EXPRESSION: 黑衣干部乙=冷静

DIALOGUE:
黑衣干部乙：
正面交给我。封住后面，别让他们回到住宅区。

STAGE:
更多黑衣人从岔路进入。男高刚刚留意的出口，被两队人一前一后挡住；普通型也借屏障的掩护移开，重新瞄向青年侧面。

STAGE:
干部甲退到防御型旁边，简短地与后来的人交换手势。两个红蓝身影的动作随之衔接起来，一个接下剑锋，另一个便从旁侧发起攻击。

JUMP: C007

### SCENE: C007

SCENE: C007
TITLE: 局势转为棘手
TIME: 同一场遭遇，增援后
BACKGROUND: bg_old_district_battle_street_night [制作占位]
BGM: bgm_encirclement_pressure [制作占位／待绑定]

HIDE: 男高
HIDE: 金发青年
HIDE: 不明生物·普通型
HIDE: 不明生物·防御型
HIDE: 黑衣干部乙

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=迎击绕后队员，观察出口
EXPRESSION: 男高=吃力，清醒

SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
POSE: 金发青年=挡开正面攻势，回护男高
EXPRESSION: 金发青年=集中

STAGE:
青年向前逼出一步，普通型仍然被迫让开；可当他准备继续追击，侧面的屏障便再次插入，另一道攻击又紧跟着扫向男高所在的位置。

STAGE:
他立即折返，替男高挡住这一击。男高也没有站在原处等着被护住，扑向绕到身后的队员，打偏对方伸来的手。

DIALOGUE:
男高：
后面也有人！

STAGE:
青年用空着的手指向一处暂时没有被堵死的墙角。男高向那边退去，刚站稳，便看见远处又亮起一排灯。

STAGE:
对方倒下几个人，后面马上有人补上。正面的敌人始终没有追得太近，却让他们无法安心转身。

DIALOGUE:
男高：
你打得过它，可他们没打算跟你单挑！

STAGE:
青年看向被封住的巷口，又看了一眼男高身后的敌人。他把剑横过来，给男高留出移动的方向。

DIALOGUE:
男高：
明白。先出去，再想办法。

STAGE:
他提起精神，再次挡开一名队员。两人开始向墙侧移动，包围圈也跟着收紧。

JUMP: C008

### SCENE: C008

SCENE: C008
TITLE: 怪盗与女剑士接应
TIME: 同一夜，撤离
BACKGROUND: bg_old_district_battle_street_night [制作占位]
BGM: bgm_thief_escape [制作占位／待绑定]

HIDE: 男高
HIDE: 金发青年

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=随青年移动，寻找空隙
EXPRESSION: 男高=焦急

SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
POSE: 金发青年=边退边挡住攻击
EXPRESSION: 金发青年=警戒

DIALOGUE:
墙侧的声音：
两位，夜路可不是这么逛的。
再退一步，可就真撞墙了。

SHOW: 蒙面人 asset=char_thief_masked_black_placeholder [占位符／待核对复用] position=left
POSE: 蒙面人=从墙侧探身，伸手示意
EXPRESSION: 蒙面人=从容

STAGE:
男高转头，看见墙侧一片像被折起的空气。一个蒙面人从缝隙后探出身，手掌撑着边缘，正朝他们招手。

DIALOGUE:
男高：
你——

DIALOGUE:
蒙面人：
先过来！有话换个地方说！

STAGE:
青年的视线越过蒙面人，落向缝隙另一边。那里，一名持剑少女正看着出口，确认接应的方向。两人短暂对视，少女点了点头。

STAGE:
青年挡开普通型追来的触臂，让男高先通过。男高跨过那道弯折的空气，脚下已经换成另一条巷子湿冷的石面。

BACKGROUND: bg_old_district_escape_alley_night [制作占位，场内切镜]

SHOW: 女剑士 asset=char_saber_traveler_placeholder [占位符／待核对复用] position=right
POSE: 女剑士=守在通道出口，握剑戒备
EXPRESSION: 女剑士=沉着

STAGE:
青年紧随其后。有人试图从入口追来，少女立即挥剑，将伸进来的装置打落；一阵风卷起碎屑，逼得追兵掩面退开。

DIALOGUE:
女剑士：
人齐了。走。

STAGE:
蒙面人收回手，入口随之合拢。四人没有在落脚处停留，而是继续穿过转角与背街，绕开原来被封住的路线。

STAGE:
远处仍听得见搜索的呼喊，身后却没有紧跟的脚步。少女留在最后观察了一阵，才示意他们再往里走。

JUMP: C009

### SCENE: C009

SCENE: C009
TITLE: 小巷中的真实身份
TIME: 脱离包围后
BACKGROUND: bg_old_district_quiet_alley_night [制作占位]
BGM: bgm_thief_reveal_quiet [制作占位／待绑定]

HIDE: 男高
HIDE: 金发青年
HIDE: 蒙面人
HIDE: 女剑士

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=扶墙调整呼吸，望向蒙面人
EXPRESSION: 男高=疑惑

SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
POSE: 金发青年=守在巷口附近
EXPRESSION: 金发青年=观察

SHOW: 蒙面人 asset=char_thief_masked_black_placeholder [占位符／待核对复用] position=right
POSE: 蒙面人=抬手准备摘下面罩
EXPRESSION: 蒙面人=轻松

SHOW: 女剑士 asset=char_saber_traveler_placeholder [占位符／待核对复用] position=center
POSE: 女剑士=站在外侧留意来路
EXPRESSION: 女剑士=警戒

STAGE:
确认这段路暂时没有追兵，蒙面人才停在墙边，长长吐出一口气。

DIALOGUE:
蒙面人：
昨天那次，谢了。
连自己救的是谁都不知道，你也真敢冲。

STAGE:
他摘下面罩。街灯从巷口照过来，露出一张男高白天才见过的脸。

HIDE: 蒙面人

SHOW: 怪盗 asset=char_thief_smile [占位符／待核对复用] position=right
POSE: 怪盗=收起面罩
EXPRESSION: 怪盗=带笑，观察男高

DIALOGUE:
男高：
……是你？！

DIALOGUE:
怪盗：
这次轮到我带你脱身。先别急着问，追兵还没走远。

DIALOGUE:
男高：
早上路口，教室前面……还有昨天晚上被他们围住的人，全都是你？

DIALOGUE:
怪盗：
怪盗也得上课。后面那件事，麻烦小点声。

STAGE:
男高瞪着他，试图把白天那个转着笔打招呼的同学，与昨夜仓库外的蒙面人重叠起来。怪盗看着他的表情，笑意慢慢收了些。

DIALOGUE:
怪盗：
昨晚你还不知道我是谁，就冲上来了。
这个人情，我记着。

DIALOGUE:
男高：
那你可以早点提醒我，别再一个人往包围圈里走。

DIALOGUE:
怪盗：
我也没想到，今天会在另一场包围里碰见你。

DIALOGUE:
怪盗：
我跟着他们的搜捕队过来，本来想看看他们在找什么。结果先看见你站在街上。

STAGE:
男高看了一眼自己凌乱的袖口，又看向两名持剑的人。这回，他没有顺着玩笑笑过去。

SET: thief_identity_known = true

JUMP: C010

### SCENE: C010

SCENE: C010
TITLE: 圣杯战争的最低限度说明
TIME: 短暂交换情报
BACKGROUND: bg_old_district_quiet_alley_night [制作占位]
BGM: bgm_holy_grail_explanation [制作占位／待绑定]

HIDE: 男高
HIDE: 金发青年
HIDE: 女剑士
HIDE: 怪盗

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=站直，认真追问
EXPRESSION: 男高=困惑，警惕

SHOW: 怪盗 asset=char_thief_smile [占位符／待核对复用] position=right
POSE: 怪盗=靠墙简短解释
EXPRESSION: 怪盗=认真

SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
POSE: 金发青年=留意巷口与男高
EXPRESSION: 金发青年=安静

SHOW: 女剑士 asset=char_saber_traveler_placeholder [占位符／待核对复用] position=center
POSE: 女剑士=观察外侧，偶尔看向两人
EXPRESSION: 女剑士=耐心有限

DIALOGUE:
男高：
先告诉我，他们是什么人？刚才那两个东西又是什么？还有他——

STAGE:
男高指了指身旁的金发青年。青年转头看他，仍没有说话。

DIALOGUE:
怪盗：
你居然真的什么都不知道。

DIALOGUE:
怪盗：
先说最要紧的。你身边这位是从者。召唤并与从者建立联系的人，叫御主。你现在已经被他们当成这一类人了。

DIALOGUE:
男高：
我连规则都是刚听见的，怎么就算参加了？

DIALOGUE:
怪盗：
因为他们不会因为你是新手，就对你客气。

DIALOGUE:
女剑士：
挑重点。先告诉他，现在已经躲不开的是什么。

STAGE:
怪盗举了举手，收起玩笑。

DIALOGUE:
怪盗：
这件事叫圣杯战争。参与者各自拥有从者，彼此争斗。四名从者被淘汰后，圣杯就会出现。

DIALOGUE:
怪盗：
剩下的人可以争夺它。夺到圣杯，就能借里面庞大的魔力实现愿望。

DIALOGUE:
男高：
拿愿望当奖品，让这些人互相打？
这算什么规则。

DIALOGUE:
怪盗：
至少他们想让事情这样进行。按我查到的资料，刚才那群黑衣人背后的组织，参与布置了这场仪式。

DIALOGUE:
男高：
那他们刚才是在找谁？

DIALOGUE:
怪盗：
我只听见他们说在找逃出来的实验体。是不是找你，我看不像；但他们已经看见你和从者站在一起了。

STAGE:
男高低头看了看手上的灼痕。怪盗也看见了，却没有凭这个就给它下结论。

DIALOGUE:
怪盗：
你今天究竟碰过什么，我们得找时间从头对一遍。这里先别展开。

SET: holy_grail_rules_known = true

JUMP: C011

### SCENE: C011

SCENE: C011
TITLE: 介绍 Saber
TIME: 说明之后
BACKGROUND: bg_old_district_quiet_alley_night [制作占位]
BGM: bgm_temporary_companions [制作占位／待绑定]

HIDE: 男高
HIDE: 怪盗
HIDE: 金发青年
HIDE: 女剑士

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=看向女剑士
EXPRESSION: 男高=认真

SHOW: 怪盗 asset=char_thief_smile [占位符／待核对复用] position=right
POSE: 怪盗=侧身介绍同伴
EXPRESSION: 怪盗=郑重

SHOW: 女剑士 asset=char_saber_traveler_placeholder [占位符／待核对复用] position=center
POSE: 女剑士=走近半步，仍留意来路
EXPRESSION: 女剑士=沉着

DIALOGUE:
怪盗：
还有，这位是我的从者。你叫她 Saber 就好。

HIDE: 女剑士

SHOW: Saber asset=char_saber_traveler_placeholder [占位符／待核对复用] position=center
POSE: Saber=向男高颔首
EXPRESSION: Saber=平静

DIALOGUE:
男高：
刚才也谢谢你。要不是你在那边接着，我们还真不好出来。

DIALOGUE:
Saber：
你们抓住了时机。接下来也要尽快离开这里。

DIALOGUE:
男高：
Saber……这是名字？

DIALOGUE:
怪盗：
是职阶。真名和来历也是情报。
不是故意拿你当外人——这条巷子不适合把底牌全摊开。

STAGE:
Saber看向金发青年，向他轻轻点头。青年同样回礼，两人都没有在这时追问对方的身份。

STAGE:
男高看了看自己的同伴，忍住了立刻照着问职阶的冲动。眼下，对方仍会在他靠近巷口时，先一步看清外面的情况。

SET: saber_class_known = true

JUMP: C012

### SCENE: C012

SCENE: C012
TITLE: 暂时合作
TIME: 同一夜，分别前
BACKGROUND: bg_old_district_quiet_alley_night [制作占位]
BGM: bgm_temporary_companions [制作占位／待绑定]

HIDE: 男高
HIDE: 怪盗
HIDE: Saber

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=望向回家方向
EXPRESSION: 男高=担忧，坚定

SHOW: 怪盗 asset=char_thief_smile [占位符／待核对复用] position=right
POSE: 怪盗=放低声音，提出约定
EXPRESSION: 怪盗=认真

SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
POSE: 金发青年=站到男高身边
EXPRESSION: 金发青年=专注

SHOW: 女剑士 asset=char_saber_traveler_placeholder [占位符／待核对复用] position=center
POSE: 女剑士=准备带路离开
EXPRESSION: 女剑士=警戒

DIALOGUE:
男高：
要是我不想争那个愿望呢？能不能就当没这回事？

STAGE:
怪盗没有马上回答。他朝刚才交战的方向看了一眼。

DIALOGUE:
怪盗：
我也希望能这么简单。但你也见到了，他们会拦你，会动手。
你不想争，不代表他们会因此放过你和你在意的人。

STAGE:
男高沉默下来。他想起出门前没有亮灯的房间，手慢慢攥紧，又松开。

DIALOGUE:
男高：
愿望的事先放一边。我得先确认奶奶没事。

DIALOGUE:
怪盗：
那今晚先到这里。明天学校见。

DIALOGUE:
男高：
你还有东西没说清。

DIALOGUE:
怪盗：
有。我也有很多事要问你。等找个不会随时冒出追兵的地方，我们互相讲。

DIALOGUE:
男高：
行。先交换情报。别再让我什么都不知道就冲进去。

DIALOGUE:
怪盗：
这句我记住了。

STAGE:
Saber先探出巷口，确认另一侧道路没有被堵住。怪盗指了指与原路不同的方向，带着他们再绕过一段街道。

STAGE:
到了可以分开的地方，双方停步观察。确定没有人尾随后，男高与金发青年才转向回家的路。

SET: temporary_cooperation = true

JUMP: C013

### SCENE: C013

SCENE: C013
TITLE: 夜归与新的同伴
TIME: 同一夜，稍后
BACKGROUND: bg_grandmother_house_entrance_night [制作占位]
BGM: bgm_homecoming_warm_low [制作占位／待绑定]

HIDE: 男高
HIDE: 怪盗
HIDE: 金发青年
HIDE: 女剑士

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=整理外套，将包好的剑交回青年
EXPRESSION: 男高=紧张，疲惫

SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
POSE: 金发青年=将旧布裹住的剑垂在身侧
EXPRESSION: 金发青年=安静

SHOW: 奶奶 asset=char_grandmother_warm [占位符／待核对复用] position=right
POSE: 奶奶=站在门里，披着外衣
EXPRESSION: 奶奶=担忧

STAGE:
回到老住宅区后，两人又停了一次。青年沿街口看过，确认没有尾随的身影，才陪男高走向院门。

STAGE:
男高一路上已经把旧布重新裹在剑外。敲门前，他拉平被扯皱的外套，刚把手抬起来，门就开了。

DIALOGUE:
奶奶：
大半夜又往外跑。刚才外面那么响，你去哪儿了？

DIALOGUE:
男高：
我到路口看了一下。后来绕了点路……您没事吧？

DIALOGUE:
奶奶：
我能有什么事。倒是你——

STAGE:
她的目光越过男高，落在门外陌生的青年身上，又扫过他手中用旧布裹住的长包。
奶奶没有当场追问。男高赶紧侧开一步，好让她看清青年的脸。

DIALOGUE:
男高：
这是我朋友。刚才碰上，他今晚不太方便回去，能在我房间住一下吗？

STAGE:
话说到后面，男高自己也觉得含糊。青年却像听懂了眼前的处境，收好手里的长包，朝奶奶认真地欠身。

DIALOGUE:
奶奶：
先进来。站在门口吹风像什么话。

BACKGROUND: bg_grandmother_living_room_night [制作占位，场内切镜]

STAGE:
奶奶让出门，把两人领进客厅。她看见男高手背蹭出的红痕，又取来干净毛巾，让他自己把脸和手擦一擦。

DIALOGUE:
奶奶：
借住可以。明天把事情讲清楚，也别让人家家里担心。

DIALOGUE:
男高：
……知道了。

STAGE:
他接过毛巾，终于长长松了一口气。青年没有打断，也没有擅自往屋里走，直到男高示意，才跟着上楼。

HIDE: 奶奶
BACKGROUND: bg_grandmother_bedroom_night [制作占位，场内切镜]

STAGE:
回到房间，男高给青年铺好临时的被褥，把书包挪到一旁。大师之剑放在两人都能看见的地方。

DIALOGUE:
男高：
今晚先休息。你救了我，总不能再让你站着守一夜。

STAGE:
青年看了看床边的位置，最终仍在靠近门的一侧坐下。男高躺回床上，隔了一会儿，又转过头。

DIALOGUE:
男高：
还有，刚才一直忘了说。
虽然今天发生的事，我一件都还没弄明白……但欢迎你来。今晚，这里也算你的落脚处。

STAGE:
青年看向他，目光柔和了一些，认真点头。楼下，奶奶收杯子的声音轻轻响起；再往后，房子重新安静下来。

STAGE:
男高听着熟悉的声音，慢慢闭上眼。
这一次，他知道身边多了一个人。

SET: prologue_4_complete = true

END: C013

## 第四部分：分支与剧情状态表

本幕为线性主线，无好感度、结局分支或单项伪选择。下列状态名是文本交接约定，未接入任何引擎存档，也不改写现有游戏状态结构。

| 位置 | 状态 | 约定 |
|---|---|---|
| 入口 | prologue_3_complete / link_summoned | 均为 true，承接 B008。 |
| C009 | thief_identity_known | 设为 true；首次正式确认身份。 |
| C010 | holy_grail_rules_known | 设为 true，只表示得知已说明的基本规则。 |
| C011 | saber_class_known | 设为 true，不创建真名已知状态。 |
| C012 | temporary_cooperation | 设为 true，不代表无条件互信。 |
| C013 | prologue_4_complete | 设为 true；次日返校接大纲第五幕。 |

章节交接：C013结束后进入次日返校的后续章节；第五幕不重复揭露怪盗身份或首次说明圣杯规则。

## 第五部分：演出与素材需求表

资源标识均为交接用占位符；本次没有生成、下载或绑定美术、声音与战斗资源。普通男高、奶奶等名称沿用既有脚本惯例，实际文件是否可复用仍需逐姿态检查。

| 类型 | 资源标识 | 用途／场景 | 状态 |
|---|---|---|---|
| 背景 | `bg_grandmother_bedroom_night` | C001、C013 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| BGM | `bgm_after_dream_quiet` | C001 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 人物／立绘 | `char_male_high_normal` | C001、C002、C003、C004、C005、C006、C007、C008、C009、C010、C011、C012、C013 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 人物／立绘 | `char_link_silent_placeholder` | C001、C002、C003、C004、C005、C006、C007、C008、C009、C010、C012、C013 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 音效 | `sfx_search_vehicle_alarm` | C001 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 背景 | `bg_old_residential_search_night` | C001 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 背景 | `bg_residential_junction_night` | C002 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| BGM | `bgm_organization_tension` | C002 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 人物／立绘 | `char_organization_member_placeholder` | C002、C003 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 背景 | `bg_old_district_access_night` | C003 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| BGM | `bgm_first_partners_battle` | C003 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 战斗事件 | `battle_prologue4_patrol` | C003 | 仅调用说明；未实现数值与引擎逻辑 |
| 背景 | `bg_old_district_battle_street_night` | C004、C005、C006、C007、C008 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| BGM | `bgm_foreigner_approach` | C004 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 人物／立绘 | `char_organization_officer_a_placeholder` | C004 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 人物／立绘 | `char_deoxys_normal_placeholder` | C004、C005、C006 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| BGM | `bgm_link_advantage` | C005 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 战斗事件 | `battle_prologue4_deoxys_encounter` | C005 | 仅调用说明；未实现数值与引擎逻辑 |
| 音效 | `sfx_sword_energy_clash` | C005 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| BGM | `bgm_organization_reinforcements` | C006 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 人物／立绘 | `char_deoxys_defense_placeholder` | C006 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 音效 | `sfx_barrier_impact` | C006 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 人物／立绘 | `char_organization_officer_b_placeholder` | C006 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| BGM | `bgm_encirclement_pressure` | C007 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| BGM | `bgm_thief_escape` | C008 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 人物／立绘 | `char_thief_masked_black_placeholder` | C008、C009 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 背景 | `bg_old_district_escape_alley_night` | C008 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 人物／立绘 | `char_saber_traveler_placeholder` | C008、C009、C010、C011、C012 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 背景 | `bg_old_district_quiet_alley_night` | C009、C010、C011、C012 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| BGM | `bgm_thief_reveal_quiet` | C009 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 人物／立绘 | `char_thief_smile` | C009、C010、C011、C012 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| BGM | `bgm_holy_grail_explanation` | C010 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| BGM | `bgm_temporary_companions` | C011、C012 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 背景 | `bg_grandmother_house_entrance_night` | C013 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| BGM | `bgm_homecoming_warm_low` | C013 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 人物／立绘 | `char_grandmother_warm` | C013 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 背景 | `bg_grandmother_living_room_night` | C013 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 道具 | `prop_master_sword_restored_cracked` | C002—C008、C013 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 道具 | `prop_master_sword_cloth_wrap` | C013 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 画面演出 | `fx_thief_spatial_passage` | C008 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 道具 | `prop_dream_search_detector` | C001—C002 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 画面演出 | `fx_deoxys_barrier` | C006—C007 | 制作占位；已有素材须核对姿态、构图和授权后复用 |

## 第六部分：对白与连续性检查

- C001的组织通讯为玩家可见的切镜信息，不能写成男高已经听见。
- C005需以连续迫退和打断出手表现压制；C006以后用增援协同增加困难。
- C009之后才在剧情名字牌使用怪盗，C011之后才在剧情名字牌使用 Saber。
- 所有玩家可见对白、心声、舞台说明均不出现 Saber 真名。
- 林克没有对白、心声或腹语说明，男高通过动作理解其判断。
- C013回家前确认无人尾随，奶奶暂允借宿不等于已相信全部解释。
- 正式对白与心声按单次说话拆分，动作和环境保留在 STAGE，不让角色复述整段设定。
- 舞台说明涉及的动作先后，与正文和白板的场景编号逐项对应。

## 第七部分：后续制作事项

- 补齐素材表中的背景、动作、表情和声音，并检查显示名切换时不会提前暴露身份。
- 引擎接入时实现已约定入口与状态交接，再进行实际播放、存读档和资源缺失回退验收。
- 后续战斗设计分别验证普通型受压、增援进场与撤离，不用现有 CR 数值直接宣称本稿已经平衡。
