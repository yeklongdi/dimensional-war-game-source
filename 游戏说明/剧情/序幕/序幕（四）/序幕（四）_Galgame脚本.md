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
一阵急促的电子警报声忽然划破夜色，打破了卧室里的宁静。男高刚想开口继续询问，就见窗帘边缘扫过一道刺眼的白光。

DIALOGUE:
男高：
外头怎么回事？

STAGE:
他凑到窗边掀开窗帘一角往下看。街口停着一辆深色厢型车，几名身穿黑色制服的人正端着金属探测装置沿街搜寻——那身黑制服，他昨晚才在仓库区外见过。

DIALOGUE:
男高：
……又是昨晚那帮穿黑制服的家伙！

STAGE:
金发青年悄无声息地移步到窗侧，避开楼下扫来的探照灯光，朝男高打了个往后退的手势。

HIDE: 男高
HIDE: 金发青年
BACKGROUND: bg_old_residential_search_night [制作占位，场内切镜]

STAGE:
街口处，领头的黑衣队员按住耳麦，死死盯着金属装置屏幕上迅速衰减的波纹反应。

DIALOGUE:
搜捕通讯：
已确认梦境波动反应，源头就在这片老住宅区附近。

DIALOGUE:
搜捕通讯：
波动反应刚刚中断！目标实验体还没找到，各小组立刻散开继续搜！

STAGE:
一支搜捕小队迅速转向街道另一端，另一支小队则驻守在岔路口。雪亮的探照灯束一寸寸掠过紧闭的店铺卷帘门与院墙角落，丝毫没有收队离开的迹象。

BACKGROUND: bg_grandmother_bedroom_night [制作占位，场内切镜]
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=站在窗边，松开窗帘
EXPRESSION: 男高=戒备
SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=center
POSE: 金发青年=站在窗侧，避开灯光
EXPRESSION: 金发青年=警戒

STAGE:
男高轻轻放下窗帘，回头望了一眼通往一楼的房门。
奶奶的卧室黑着灯，显然已经睡熟了。要是任由外头那帮人顺着街巷挨家挨户搜过来，势必会惊动毫不知情的奶奶。

INNER:
男高：
绝不能让他们顺着路搜到家里来……至少，得先把这帮人从奶奶家附近引开！

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
男高抓起外套披上，放轻脚步走下楼梯。确认一楼奶奶房里没有动静后，他轻轻反手带上院门，直到绕出巷子走到大路口，才故意现身在搜捕队的视野里。金发青年始终不远不近地护在他侧后方。

STAGE:
一名黑衣队员起初只是例行公事地举灯照来，待看清男高的面孔后，手里的动作骤然一顿。

DIALOGUE:
黑衣队员：
……慢着，是你？昨晚在仓库区外头搅局的那个学生！

DIALOGUE:
男高：
你们大半夜抄着这种古怪家伙，在居民区里乱晃什么？

DIALOGUE:
黑衣队员：
少废话，站在那儿别动！你后头那个人，把手里的剑放下！

STAGE:
金发青年没有放下武器，只是微调角度，将剑尖移开了附近民宅的方向。黑衣队员看清青年的异域装束与长剑，脸色微变地后退半步，立刻抬手招呼周围的同伴合拢。

DIALOGUE:
黑衣队员：
呼叫各组，路口有情况！昨晚放跑目标的那小子又冒出来了，身边还跟着个拿冷兵器的——

STAGE:
男高高声打断他，一边说话一边故意朝通往旧街区的偏僻支路后退：

DIALOGUE:
男高：
想算昨晚的账，冲我来就行！
这儿到处都是住户，别堵在人家家门口！

STAGE:
他步步后撤，顺势将搜捕队员的注意力带离了住宅区正门。几名队员立刻压了上来，其中一人趁机从侧翼包抄，伸手就往男高肩膀抓去。

DIALOGUE:
男高：
我自己会走，少动手动脚的！

STAGE:
那名队员五指猛地收紧。男高沉肩拧身一把挣脱，身后的金发青年也在同一瞬间疾步上前，一剑格开了另一名队员捅过来的金属装置。

DIALOGUE:
搜捕通讯：
路口小组先就地控制那两个人！其余小组继续搜捕实验体，不准擅自撤离搜索区！

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
数名黑衣队员迅速散开，将支路前后的去路堵死。男高刚摆开架势准备迎击正面的敌人，金发青年便朝左侧偏了下头，主动替他挡下正面，将靠墙一侧的空当留给他。

DIALOGUE:
男高：
左边交给我？没问题！

STAGE:
他毫不犹豫地闪进青年让出的侧翼位置，避开了正面交错刺来的金属装置。

CALL: battle_prologue4_patrol

STAGE:
男高抬臂格开抓向衣领的手，顺势沉肩猛撞，将近身的队员顶得连退数步。另一名队员刚想从死角偷袭，脚下却被青年横剑一拨，重心失衡地一头撞翻了旁边的同伴。

STAGE:
男高刚喘上一口气，余光忽见街灯阴影下又有人举起了通电的装置。

DIALOGUE:
男高：
当心右边！

STAGE:
不用他多言，青年已然旋身挥剑，凛冽的剑光贴着金属装置擦过，当场将其挑飞在地。他没有恋战追击倒地的队员，而是顺势踏前一步，精准地截断了后方涌来的支援。

STAGE:
短短几个照面，支路上的混战便已分出高下。黑衣队员们或捂着脱臼的手臂蹲在地上，或狼狈地退到马路牙子边，一时没人敢再贸然上前。男高扶着膝盖喘了口气，转头望向身旁气定神闲的持剑青年。

DIALOGUE:
男高：
呼……你也太能打了吧，比我想的还要厉害得多。

STAGE:
青年看了他一眼，确认他没有受伤，目光随即越过人群望向支路尽头——幽暗的街角处，正传来一阵不疾不徐的脚步声。

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
外围的黑衣队员纷纷向两侧退开，一名衣着更为考究的黑衣干部从通道中央缓步走来。他甚至没低头看一眼地上的手下，视线直接锁定在了持剑的金发青年身上。

DIALOGUE:
黑衣干部甲：
都退下。这种对手，凭你们应付不了。

STAGE:
队员们如蒙大赦般迅速撤出一段空地。而在干部身侧，一个红蓝相间的异形生物正凭空缓缓浮起——细长柔韧的触臂在身体两侧舒展开来，胸口镶嵌的紫晶器官在街灯下折射出森冷的寒光。

SHOW: 不明生物·普通型 asset=char_deoxys_normal_placeholder [占位符／待核对复用] position=right
POSE: 不明生物·普通型=悬浮，触臂展开
EXPRESSION: 不明生物·普通型=锁定目标

STAGE:
看着那个双脚完全脱离地面的诡异生物，男高喉结不由自主地滚动了一下。无论是昨晚的黑衣打手，还是白天坑底的无面黑影，都远没有眼前这东西带来的压迫感强烈。

DIALOGUE:
男高：
这、这又是什么怪物……？

DIALOGUE:
黑衣干部甲：
新现界的从者么……怪不得昨晚能坏我们的事。

STAGE:
干部的目光转向男高，似乎终于将昨晚仓库区的意外与眼前的少年彻底串联了起来。

DIALOGUE:
黑衣干部甲：
既然自己撞上来了，那就连人带从者，一并留在这儿吧。

STAGE:
金发青年根本没有理会干部的威胁。他反手将男高往侧后方轻轻一挡，双手握剑的架势瞬间压低。

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
红蓝生物率先发难，两条触臂刚一抬起，无形的念动风压便震得路面碎石齐齐飞溅；然而金发青年的动作比它更快，在风压合拢前的刹那已然贴地疾冲，一步跨进了攻击的死角。

CALL: battle_prologue4_deoxys_encounter

SFX: sfx_sword_energy_clash [制作占位]

STAGE:
第一剑干脆利落地荡开抽来的触臂，紧接着垫步欺身，剑锋直逼对方胸口水晶。普通型急忙向后飘退，另一侧触臂刚想顺势缠住剑身，青年手腕一旋，剑刃如游鱼般滑出，反手一击再次将它的攻势硬生生截断。

STAGE:
男高原本已经全身紧绷，随时准备翻滚躲避余波；可看了两招他才惊讶地发现，从头到尾被压着后退的，竟然是对面那个诡异的悬浮生物。

STAGE:
普通型强行拉开距离，胸口水晶骤然凝聚起刺目的能量光束。青年脚尖在路旁院墙上一借力，整个人在半空折出利落的锐角，炽白光束擦着残影轰在空处，而他落地时已再度欺近对方身前。

STAGE:
后方观战的黑衣干部抬起的手僵在半空，原本胜券在握的冷淡神色终于彻底沉了下来。

DIALOGUE:
男高：
有戏……能赢！

STAGE:
男高忍不住低呼出声。这不是盲目的乐观——对面每次试图蓄力或重整态势，都会被青年快如疾风的连斩提前打断，战线已经被硬生生推到了街道另一头。

STAGE:
即便占尽上风，青年也始终没有孤军深入，每一步进退都死死卡在随时能回援男高的距离内。眼看普通型胸口的水晶再次亮起微光，青年手腕下压，已做好了一鼓作气斩落重击的准备。

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
就在剑锋即将劈落的瞬间，一面凝若实质的厚重力场屏障突兀地横插在两者之间。反震的巨力震得青年手腕微沉，他当机立断收剑变招，轻巧地向侧方滑开数步。

STAGE:
半透明的屏障后方，又一道红蓝相间的身影缓缓落入街灯下。它的躯干比先前那个宽厚数倍，双臂如盾牌般交叠展开，严严实实地将普通型护在了身后。

DIALOGUE:
男高：
怎么又冒出来一个？！

SHOW: 黑衣干部乙 asset=char_organization_officer_b_placeholder [占位符／待核对复用] position=right
POSE: 黑衣干部乙=走入侧巷口，指挥部队
EXPRESSION: 黑衣干部乙=冷静

DIALOGUE:
黑衣干部乙：
正面由我接手。把后路给我封死，绝不能放他们退回住宅区。

STAGE:
急促的脚步声从两侧岔路同时涌出。男高刚才留意过的两条退路，转眼被两队增援的黑衣人堵得水泄不通；而缓过一口气的普通型也借着屏障掩护飘向侧翼，重新锁定了青年的身侧。

STAGE:
先前那名干部退到防御型身旁，与新来的干部简短地交换了一个手势。两具红蓝身影的动作瞬间同步——一个顶在前面硬抗剑锋，另一个则专门从刁钻的死角发起冷酷的偷袭。

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
青年再度踏步突刺，普通型依然不敢硬接他的锋芒；可只要他稍一追击，防御型的厚重屏障便会立刻切入阻拦，而普通型的念动光束则毫不讲理地绕过正面，直奔后方的男高袭去。

STAGE:
青年不得不中途折返，挥剑替男高劈散袭来的能量。男高也绝不肯干站在原地当累赘，转身一记重拳砸开摸到身后的黑衣队员，打偏了对方伸来的电击装置。

DIALOGUE:
男高：
后头也包上来了！

STAGE:
青年腾出左手，朝不远处一截尚未合围的墙角指了一下。男高会意地边退边挡挪过去，可刚一站稳，就见巷道远端又亮起了一排刺目的车灯。

STAGE:
每打倒几个黑衣队员，外围立刻就有新的增援填补上来。正面的两具红蓝生物更是滑溜得从不与青年硬拼，只是一味拉扯夹击，死死拖住他们突围的脚步。

DIALOGUE:
男高：
单打独斗他们根本奈何不了你，可这帮家伙是打算用车轮战硬耗死咱们啊！

STAGE:
青年冷冷扫了一眼被封死的巷口，又回头确认了一眼男高的体力。他将大师之剑横在身前，替男高撑开了一条贴墙移动的空隙。

DIALOGUE:
男高：
明白！先冲出包围圈，之后再想办法！

STAGE:
男高咬牙振作精神，一脚踹开扑上来的队员。两人背靠着背向墙侧移动，而四周的黑衣包围网也随之一步步收紧。

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
两位，大半夜压马路可不是这么个逛法。
再往后退一步，可就真撞南墙了。

SHOW: 蒙面人 asset=char_thief_masked_black_placeholder [占位符／待核对复用] position=left
POSE: 蒙面人=从墙侧探身，伸手示意
EXPRESSION: 蒙面人=从容

STAGE:
男高闻声猛地转头，只见身旁的砖墙边竟凭空裂开了一道如同折纸般扭曲的空间缝隙。一名黑衣蒙面人正单手撑着缝隙边缘探出半个身子，笑吟吟地朝他们招手。

DIALOGUE:
男高：
你是——

DIALOGUE:
蒙面人：
先钻进来！有什么话咱们换个安全地方再聊！

STAGE:
金发青年的目光越过蒙面人，落在裂缝另一端。昏暗的小巷里，一名手持单手剑的少女正稳稳守在出口处，视线交汇的刹那，少女朝他微不可察地点了点头。

STAGE:
青年毫不犹豫地挥剑劈开追袭而来的触臂，侧身护着男高率先跨入裂缝。男高只觉眼前景物一晃，脚下踩着的已变成另一条背街窄巷湿冷的石板地。

BACKGROUND: bg_old_district_escape_alley_night [制作占位，场内切镜]

SHOW: 女剑士 asset=char_saber_traveler_placeholder [占位符／待核对复用] position=right
POSE: 女剑士=守在通道出口，握剑戒备
EXPRESSION: 女剑士=沉着

STAGE:
金发青年紧随其后跃出通道。两名黑衣队员刚想顺着尚未闭合的缝隙追进来，守在旁边的持剑少女已然疾步上前，一剑挑飞探入的金属装置，剑锋裹挟的凛冽劲风卷起满地沙石，逼得追兵慌忙掩面后退。

DIALOGUE:
女剑士：
人齐了，撤。

STAGE:
蒙面人潇洒地五指一收，墙面上的空间裂缝瞬间抹平消失。四人没有在原地多待一秒，借着错综复杂的转角与背街小巷疾步穿行，眨眼间便绕开了组织封锁的主干道。

STAGE:
外围街道上隐约还回荡着搜捕队的呼喝声，身后却已听不见追兵的脚步。断后的持剑少女停在巷尾倾听片刻，才抬手示意众人拐进更深处的一条死胡同。

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
确认周围彻底甩开了追兵后，蒙面人这才靠在斑驳的砖墙边，长长地吐出一口气。

DIALOGUE:
蒙面人：
呼……昨晚在仓库那边，多谢你替我解围了。
连被围的是谁都没看清就敢往上冲，该说你是胆子肥呢，还是太热心肠？

STAGE:
说话间，他抬手扯下了脸上的黑色面罩。巷口斜斜投进来的街灯光晕下，露出了一张男高白天才在教室里见过的熟悉面孔。

HIDE: 蒙面人

SHOW: 怪盗 asset=char_thief_smile [占位符／待核对复用] position=right
POSE: 怪盗=收起面罩
EXPRESSION: 怪盗=带笑，观察男高

DIALOGUE:
男高：
……怎么是你？！

DIALOGUE:
怪盗：
礼尚往来，今晚换我捞你一把。先小点声，外头的追兵还没走远呢。

DIALOGUE:
男高：
等一下……早上路口撞到的、教室里坐我前排的……还有昨晚被那帮黑衣人堵在墙角的蒙面人，全都是你？！

DIALOGUE:
怪盗：
再怎么说我也还是个高中生，白天总得按时上课吧？至于昨晚那档子事……麻烦压低点嗓门，我可不想明天一早登上校园头条。

STAGE:
男高瞪大眼睛盯着他，努力想把白天那个在座位上转着笔打招呼的同班同学，跟眼前这个神出鬼没的黑衣蒙面人重叠到一块儿。怪盗看着他呆滞的表情，脸上的玩笑之色也渐渐收敛了几分。

DIALOGUE:
怪盗：
不过说真的，昨晚你明明连我的脸都没见着，二话不说就冲出来帮我挡了一阵。
这份人情，我一直记着呢。

DIALOGUE:
男高：
既、既然记着，白天在班里你倒是偷偷给我提个醒啊！害我今晚又稀里糊涂撞进这帮人的包围圈里！

DIALOGUE:
怪盗：
天地良心，我哪能料到才过了一天，你就能惹上这么大阵仗？

DIALOGUE:
怪盗：
我今晚本来是悄悄缀在他们搜捕队后头，想摸清他们在找什么东西，谁知道一拐过街角，先看见你带着个人跟他们打起来了。

STAGE:
男高低头看了一眼自己被扯乱的袖口，又转头看向巷口并肩戒备的两名持剑者。这一回，他没有再顺着对方的玩笑话接茬。

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
那你快给我交个底，那帮黑衣人到底是什么来头？刚才那两个红蓝相间的怪物是什么？还有他——

STAGE:
男高抬手指向身旁的金发青年。青年闻声侧头看了他一眼，依旧一言不发。

DIALOGUE:
怪盗：
……合着你真是两眼一抹黑，什么都不知道就跟人家打起来了？

DIALOGUE:
怪盗：
行，那我长话短说。你身边这位，叫做“从者”；而把从者召唤出来、跟他们建立契约联系的人，就叫“御主”。不管你是怎么把他叫出来的，现在那帮黑衣人已经把你当成御主盯上了。

DIALOGUE:
男高：
不是，我连这词儿都是头一回听说，怎么莫名其妙就算参赛了？！

DIALOGUE:
怪盗：
因为那帮家伙可不会管你是不是刚入门的新手，更不会跟你讲什么规矩。

DIALOGUE:
女剑士：
挑要紧的说。先把他眼下躲不掉的麻烦讲清楚。

STAGE:
怪盗做了个投降的手势，彻底收起了调侃的语气。

DIALOGUE:
怪盗：
好。简单来说，这场争斗叫做“圣杯战争”。被选中的御主各自召唤出从者，彼此捉对厮杀。等淘汰掉四名从者之后，“圣杯”就会现世。

DIALOGUE:
怪盗：
到时候，活下来的人就能去抢夺圣杯——谁能把圣杯抢到手，谁就能靠里面庞大的魔力，实现自己的愿望。

DIALOGUE:
男高：
拿实现愿望当诱饵，逼着这么多人拼命厮杀？
这算哪门子的混账规则！

DIALOGUE:
怪盗：
至少幕后那帮人是这么盘算的。按我手头查到的线索，刚才追杀咱们的黑衣人背后有个神秘组织，这场所谓的圣杯仪式，十有八九就是他们一手攒出来的局。

DIALOGUE:
男高：
那他们今晚兴师动众地闯进住宅区，到底是在找谁？

DIALOGUE:
怪盗：
我半路听了一耳朵，他们像是在搜捕什么逃出来的“实验体”。原本多半不是冲你来的，但谁让你带着从者跟他们撞了个正着呢？这下想不被顺手盯上都难了。

STAGE:
男高下意识低头看了一眼手背上的剑形灼痕。怪盗的目光也扫过了那道痕迹，却没有贸然下定论。

DIALOGUE:
怪盗：
至于你今天到底碰过什么邪门东西、怎么把从者叫出来的，咱们回头得找个工夫从头到尾对一遍。这儿不是久留之地，先不多聊了。

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
对了，正式介绍一下，这位是我的从者。你叫她 Saber 就行。

HIDE: 女剑士

SHOW: Saber asset=char_saber_traveler_placeholder [占位符／待核对复用] position=center
POSE: Saber=向男高颔首
EXPRESSION: Saber=平静

DIALOGUE:
男高：
刚才真是多亏你了！要不是你在通道那头接应，我们俩今晚还真不好脱身。

DIALOGUE:
Saber：
是你们自己抓住了突围的时机。不过眼下还不安全，得尽快离开这片街区。

DIALOGUE:
男高：
Saber……这是她的名字吗？

DIALOGUE:
怪盗：
是职阶，你可以理解成代号。在圣杯战争里，从者的真名和来历都是保命的底牌。
可不是我故意拿你当外人啊——主要是这黑灯瞎火的巷子里，实在不适合把老底全掀出来。

STAGE:
Saber转头看向金发青年，向他轻轻颔首致意。青年同样微微点头回礼，两人都很有默契地没有在这时试探对方的底细。

STAGE:
男高看了看身旁的青年，把差点脱口而出的职阶问题又咽了回去——哪怕一句话也没说，每当他靠近巷口半步，青年都会不动声色地先一步替他探清外头的动静。

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
那要是我压根不想争什么愿望呢？就不能直接退出，当没这回事吗？

STAGE:
怪盗没有立刻接话，只是偏头朝刚才交火的街区方向看了一眼。

DIALOGUE:
怪盗：
我也巴不得能这么省事。可刚才你也亲眼见着了，那帮人根本不会跟你讲道理。
就算你不想争，也不代表他们会大发慈悲，放过你和你身边重要的人。

STAGE:
男高沉默了下来。脑海里浮现出出门前奶奶那间黑着灯的卧室，他的拳头慢慢攥紧，又一点点松开。

DIALOGUE:
男高：
……愿望什么的先放一边。我得赶紧回去确认我奶奶平安无事。

DIALOGUE:
怪盗：
行，那今晚就先散了。明天学校见。

DIALOGUE:
男高：
喂，你肯定还有不少事儿没跟我交底呢。

DIALOGUE:
怪盗：
那是自然，我也有一肚子问题想问你呢。等明天找个不会随时冒出追兵的清静地方，咱们再敞开了互通有无。

DIALOGUE:
男高：
一言为定！先把情报对清楚，我可不想再像今晚这样，两眼一抹黑就撞进枪口里。

DIALOGUE:
怪盗：
哈哈，这话我记下了。

STAGE:
Saber率先探出巷口观察片刻，确认另一侧的小路没有搜捕队驻守。怪盗指向与来路相反的背街，领着众人又七拐八拐地绕过了一段街区。

STAGE:
直到抵达岔路口的分别处，四人停步屏息观察了一阵。确认四周再无任何尾随的动静后，男高才与金发青年转身踏上回家的路。

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
绕回西侧的老住宅区后，两人又在街角停步确认了一次。金发青年仔细扫视过前后的阴影，确定没有任何尾巴跟来，才陪着男高走到自家院门前。

STAGE:
回来路上，男高已经重新用旧帆布将大师之剑裹好。站在门前，他深吸一口气扯平皱巴巴的校服外套，刚抬起手准备敲门，屋门便从里面拉开了。

DIALOGUE:
奶奶：
怎么大半夜的又往外跑？刚才外头闹哄哄的，你跑哪儿去了？

DIALOGUE:
男高：
我就是听见动静，到前头路口瞅了一眼，回来时绕了点路……奶奶，您在家没受惊吧？

DIALOGUE:
奶奶：
我在屋里能有什么事。倒是你——

STAGE:
奶奶的话音一顿，目光越过男高的肩膀，落在了门外那名陌生的金发青年身上，又扫过对方手里用旧帆布裹着的长条物件。
她没有当着外人的面盘问，男高连忙侧身让开半步，好让奶奶看清青年的模样。

DIALOGUE:
男高：
啊，这位是我刚认识的朋友！刚才在路上碰见的，他今晚家里有点事不太方便回去，能让他先在我屋里借宿一晚吗？

STAGE:
这借口找得实在仓促，男高越说越觉得心虚。谁知身旁的金发青年却仿佛听懂了眼下的窘境，将长条帆布包收拢在身侧，十分郑重地朝奶奶微微欠身行礼。

DIALOGUE:
奶奶：
快先进屋吧，大半夜让人家站在门口吹冷风像什么话。

BACKGROUND: bg_grandmother_living_room_night [制作占位，场内切镜]

STAGE:
奶奶侧身让开玄关，把两人领进亮着灯的客厅。一眼瞥见男高手背上擦出的红痕，她转身去洗漱间取来一条温热的湿毛巾，塞进男高手里让他擦脸擦手。

DIALOGUE:
奶奶：
先在屋里住下可以，但明天一早可得把来龙去脉跟我说清楚，也别让人家家里人跟着干着急。

DIALOGUE:
男高：
……好，我知道了。

STAGE:
男高接过温热的毛巾，悬了一路的心总算落回了肚子里。金发青年安静地站在玄关边没有乱走，直到男高朝他招手示意，才放轻脚步跟着走上二楼。

HIDE: 奶奶
BACKGROUND: bg_grandmother_bedroom_night [制作占位，场内切镜]

STAGE:
回到卧室，男高从柜子里抱出备用的被褥在地板上铺好，又把桌边的书包往里挪了挪。裹着旧布的大师之剑就平放在两人抬眼就能看见的中央。

DIALOGUE:
男高：
今晚就先在这儿将就一宿吧。你刚救了我，我总不能再让你跟门神似的站着守一夜。

STAGE:
青年低头看了看铺好的被褥，最终还是挑了靠近房门与窗户内侧的位置盘膝坐下。男高钻进被窝躺下，过了片刻，又忍不住翻身探出脑袋。

DIALOGUE:
男高：
对了，刚才一路忙着跑，有句话一直没顾上跟你说。
虽然今天这一出接一出的，我到现在还是满脑子问号……但还是欢迎你来。从今晚起，这儿也是你的落脚处了，请多指教啦。

STAGE:
月色下，金发青年转头望向他，原本冷峻的眉眼柔和了几分，认真地点了点头。楼下隐约传来奶奶收拾茶杯与关灯的轻响，随后，整栋老房子彻底归于宁静。

STAGE:
男高听着耳畔熟悉的动静，眼皮渐渐合拢。
这一回，在沉入梦乡之前他清楚地知道，自己的床边已经不再是孤身一人了。

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
