# 序幕（三）：床边的勇者 · Galgame 脚本

> 类型：引擎无关纯文本脚本；不是已接入游戏的运行文件。
>
> 对应：[剧情正文](序幕（三）.md) · [白板](序幕（三）.canvas)
>
> 正式演出范围：B001—B008。制作说明、状态表和素材表不进入玩家文本框。

## 第一部分：结构与角色显示

承接开学第一天放学取剑后的晚饭，结束于同一夜梦醒后的首次会面。前半段建立家庭生活的温暖，后半段让梦魇的强留构成真实危险，并完成林克的召唤。

| 场景 | 标题 | 地点 | 时间 |
|---|---|---|---|
| B001 | 晚饭与新同学 | 奶奶家餐桌 | 开学第一天傍晚 |
| B002 | 床边的大师之剑 | 男高房间 | 当晚，洗漱后 |
| B003 | 没有尽头的晚饭 | 梦中的奶奶家餐桌 | 梦境，时间停滞 |
| B004 | 雾中的邀请 | 梦中的餐厅与雾 | 梦境 |
| B005 | 男高拒绝留下 | 循环的梦境房屋 | 梦境 |
| B006 | 梦外的剑鸣 | 梦境门前／现实中的男高房间 | 同一时刻 |
| B007 | 一剑斩断噩梦 | 正在崩解的梦境 | 梦境结束前 |
| B008 | 醒来后的陌生人 | 男高房间 | 同一夜，梦醒后 |

### 作者身份与玩家显示名

| 作者身份 | 玩家显示名 | 使用边界 |
|---|---|---|
| 男高 | 男高 | 尚不知道圣杯战争，主动抵抗梦境。 |
| 奶奶 | 奶奶 | 梦中的形象由梦境重现，不代表奶奶本人受到控制。 |
| 梦魇 | 雾中的声音 | 只见朦胧轮廓；不公开本体所在位置。 |
| 林克 | 金发青年 | 全幕无对白、无心声；不在角色对话中自报姓名或职阶。 |

## 第二部分：已确定的演出与调用边界

- 大师之剑已在序幕二放学后取回；剑形灼痕是现有共鸣线索，本幕不把它直接认定为令咒。
- 梦魇本体仍在漫画店阁楼。她模仿漫画中的梦魇，将强留他人视为正常行为；本幕不向男高揭露其身世、住处或从者。
- 林克通过大师之剑与男高的召唤联系介入此次梦境，切断本次束缚，不据此新增可自由进入任意梦境的通用能力。
- 白天触剑建立联系，本幕的求生呼唤完成召唤；不重复安排另一套正式召唤仪式。

本幕没有独立数值战斗调用。B005是剧情中的挣扎，B006—B007由本脚本连续演出召唤与破梦，避免演出重复。

梦魇没有在本幕退场。其本体仍在漫画店阁楼，此信息仅供作者掌握。

## 第三部分：Galgame 正式脚本

### SCENE: B001

SCENE: B001
TITLE: 晚饭与新同学
TIME: 开学第一天傍晚
BACKGROUND: bg_grandmother_dining_evening [制作占位]
BGM: bgm_homecoming_warm [制作占位／待绑定]

CHECK: has_master_sword == true [章节入口约束；未满足时不得接入本幕]

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=坐在餐桌旁，校服袖口挽起
EXPRESSION: 男高=轻松，偶尔走神

SHOW: 奶奶 asset=char_grandmother_warm [占位符／待核对复用] position=right
POSE: 奶奶=给男高夹菜
EXPRESSION: 奶奶=关切，微笑

STAGE:
男高回到奶奶家时，厨房里正响着锅铲碰到锅沿的声音。他先把用旧布包好的剑放进楼上的房间，洗净手，才下楼接过奶奶手中的碗。

STAGE:
饭桌上摆着热菜和两副碗筷。奶奶看他坐稳，先往他碗里夹了一筷子菜。

DIALOGUE:
奶奶：
新学校怎么样？有人肯跟你一起吃饭吗？

DIALOGUE:
男高：
有啊！我前面那家伙挺会聊天的，旁边那位……声音有点小，不过人很好。

DIALOGUE:
奶奶：
那就好。你说话也别总那么大声，别把人家吓着。

DIALOGUE:
男高：
我有那么吓人吗？

STAGE:
奶奶抬眼看他。他想起自己今天在讲台上的自我介绍，自己先笑了起来。

DIALOGUE:
男高：
好吧，下次注意。学校图书馆可大了，还有体育馆。操场那边有一块——

STAGE:
他的话停在半截。坑底的黑色人形、倒在围栏旁的少女，以及那把仍留着裂纹的剑，一起挤进脑海。

DIALOGUE:
奶奶：
有一块什么？

DIALOGUE:
男高：
施工的地方，围起来了。我们就从旁边经过。

STAGE:
他说完低头扒了一口饭。奶奶没有追问施工区，只把汤碗推近了些。

DIALOGUE:
奶奶：
先把饭吃了。第一天认那么多路，累了吧？

DIALOGUE:
男高：
还行。明天早上我帮您收拾，您别又一个人全做完了。

STAGE:
奶奶笑着说好。男高看着碗边升起的热气，肩膀慢慢放松，刚才那句含糊的话却还硌在心里。

INNER:
男高：
总不能让她第一天就替我担心。
……明天再想办法弄清楚。

JUMP: B002

### SCENE: B002

SCENE: B002
TITLE: 床边的大师之剑
TIME: 当晚，洗漱后
BACKGROUND: bg_grandmother_bedroom_night [制作占位]
BGM: bgm_sword_quiet_mystery [制作占位／待绑定]

HIDE: 男高
HIDE: 奶奶

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=坐在床沿，解开旧布
EXPRESSION: 男高=疑惑，疲惫

STAGE:
帮奶奶收好碗筷、洗漱完毕，男高回到房间，轻轻关上门。旧铁皮机器人仍摆在窗台上，书包靠着书桌，只有床边多出的长条包裹显得格外陌生。

STAGE:
他解开旧布，把大师之剑横放在膝上。翼状护手上的金色三角在台灯下泛着微光，剑刃恢复了明亮的颜色，细小的腐蚀裂纹却还在。

INNER:
男高：
白天看到的那些……到底是谁的记忆？

STAGE:
他试着再次握住剑柄，等了一会儿。没有空岛，没有巨龙，也没有那个从高处坠下的金发青年。房间里只有台灯轻微的电流声。

DIALOGUE:
男高：
白天动静那么大，现在倒装起一把普通的剑来了。

STAGE:
说完，他也觉得自己的问题有些好笑。困意这时才一下子涌上来，他打了个哈欠，把剑平放在床边，拉好窗帘。

DIALOGUE:
男高：
明天再想。先睡觉……这回可不能又让奶奶叫半天。

SFX: sfx_light_switch [制作占位]

STAGE:
台灯熄灭。男高翻了个身，呼吸渐渐放缓。

STAGE:
月光从窗帘缝隙落下来。床边，剑刃中央的金色纹路缓缓亮起；被袖口盖住的剑形灼痕，也回应似的闪了一下。

JUMP: B003

### SCENE: B003

SCENE: B003
TITLE: 没有尽头的晚饭
TIME: 梦境，时间停滞
BACKGROUND: bg_grandmother_dining_evening [制作占位]
BGM: bgm_homecoming_warm_dream [制作占位／待绑定]

HIDE: 男高

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=重新坐在饭桌旁
EXPRESSION: 男高=茫然，逐渐警觉

SHOW: 奶奶 asset=char_grandmother_warm [占位符／待核对复用] position=right
POSE: 奶奶=坐在桌对面，动作重复
EXPRESSION: 奶奶=笑容固定

STAGE:
男高再抬起头时，面前还是那碗热汤。筷子正握在手里，奶奶坐在桌对面，笑着看他。

DIALOGUE:
男高：
……我不是已经睡了吗？

STAGE:
奶奶像没听见，只伸手指了指他的饭碗。他迟疑着夹起一块菜，低头时，却发现刚才夹走的那一块仍留在原处。

STAGE:
他又夹了一次。盘子没有变化，汤面升起的热气也像沿着同一道弧线反复飘动。

SFX: sfx_clock_tick_stop [制作占位]

STAGE:
墙上的钟轻响一声。秒针往前挪了一格，又退回原位。

DIALOGUE:
男高：
奶奶，钟是不是坏了？

STAGE:
没有回答。桌对面的人仍维持着那个笑容。男高放下筷子，朝窗外看去：路灯下没有行人，也没有车影，夜色浓得像贴在玻璃上。

STAGE:
他等了很久，远处的天边没有一点变亮的迹象。身后的饭菜却一直冒着热气。

INNER:
男高：
不对。刚才已经收过碗了。这里是梦。

STAGE:
他站起身。桌对面的身影终于动了一下，周围随之浮起淡淡的白雾。

JUMP: B004

### SCENE: B004

SCENE: B004
TITLE: 雾中的邀请
TIME: 梦境
BACKGROUND: bg_dream_dining_fog [制作占位]
BGM: bgm_nightmare_invitation [制作占位／待绑定]

HIDE: 男高
HIDE: 奶奶

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=站在椅子旁，望向雾中
EXPRESSION: 男高=警惕

STAGE:
白雾漫过饭桌，桌对面的奶奶逐渐看不清了。一个陌生的声音从那个方向响起，故意拖长尾音，像在郑重念出某句排练过的话。

DIALOGUE:
雾中的声音：
欢迎来到……属于你的梦。

DIALOGUE:
男高：
谁？我奶奶呢？

DIALOGUE:
雾中的声音：
她就在你身边呀。你不是很喜欢这里吗？那就一直留下来。

STAGE:
雾里隐约出现一个纤细的轮廓。她没有走近，只歪着头，像等着对方赞叹这张永远温暖的饭桌。

DIALOGUE:
雾中的声音：
这里有热饭，有你想见的人。想要什么，还可以再告诉我。

DIALOGUE:
男高：
我想醒过来。

DIALOGUE:
雾中的声音：
……那个不算。

STAGE:
她答得太快，刚才故作深沉的腔调一下子漏了底。短暂安静后，她又压低声音。

DIALOGUE:
雾中的声音：
留在这里就不会累。也不用担心，想见的人会不见。

STAGE:
男高望向奶奶方才坐着的位置。那里的身影像一张被水泡开的照片，越看越模糊。

DIALOGUE:
男高：
你不是她。

DIALOGUE:
雾中的声音：
哪里不像？脸是一样的，饭也是热的。
你明明很喜欢这些。

DIALOGUE:
男高：
我奶奶会嫌我吵，会催我吃饭，也会听我把话说完。
你只会让我留下。

DIALOGUE:
雾中的声音：
……留下不好吗？

DIALOGUE:
男高：
好不好，也该由我自己选。
我要醒过来。

DIALOGUE:
雾中的声音：
为什么？明明睡着就不会累了。

JUMP: B005

### SCENE: B005

SCENE: B005
TITLE: 男高拒绝留下
TIME: 梦境
BACKGROUND: bg_dream_house_loop [制作占位]
BGM: bgm_nightmare_pressure [制作占位／待绑定]

HIDE: 男高

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=推门，扶住门框保持站立
EXPRESSION: 男高=愤怒，困倦

STAGE:
男高没有再等回答。他绕开饭桌，冲到门口，拧开门把。

SFX: sfx_door_loop [制作占位]

STAGE:
门外仍是一张饭桌。热汤、两副碗筷、停住的钟，都在同样的位置。

STAGE:
他一口气穿过第二扇门，接着是第三扇。每次脚步落地，椅背都正好抵在他的膝后。

DIALOGUE:
男高：
把门打开！真的那一扇！

DIALOGUE:
雾中的声音：
你坐下就好了呀。坐下来，再睡一会儿。

STAGE:
雾缠上他的脚踝。男高的眼皮忽然重得抬不起来，连自己刚才为什么站起来，都有一瞬间想不清。

STAGE:
他抓紧门框，盯住木头上的一道划痕，一遍遍在心里报出自己的名字、学校和今天发生的事。

INNER:
男高：
我回到太阳市了。今天第一天上学。
奶奶还在外面。明早她要是再来叫我……我得应她一声。

DIALOGUE:
男高：
有人真的在等我回去。我不能留在这儿。

DIALOGUE:
雾中的声音：
这里也有人等你。你看，饭还热着呢。

STAGE:
椅子被无形的力量拉到身后。男高用肩膀抵住门框，拼命不让自己坐下；指尖却一点点滑落，脚下也再使不出刚才的力气。

DIALOGUE:
男高：
我说了……放我出去！

JUMP: B006

### SCENE: B006

SCENE: B006
TITLE: 梦外的剑鸣
TIME: 同一时刻
BACKGROUND: bg_dream_house_loop [制作占位]
BGM: bgm_sword_answer [制作占位／待绑定]

HIDE: 男高

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=扶着门框，握住发热的手
EXPRESSION: 男高=痛苦，重新集中精神

STAGE:
一阵灼热从手上传来。男高猛地睁开一点眼睛，看见袖口下的剑形灼痕正在发光。

SFX: sfx_master_sword_resonance [制作占位]

STAGE:
与白天相同的剑鸣穿过浓雾。他下意识朝声音伸出手，指尖碰到的却仍是空处。

DIALOGUE:
男高：
是那把剑……？

HIDE: 男高
BACKGROUND: bg_grandmother_bedroom_night [制作占位，场内切镜]

STAGE:
现实中，床边的大师之剑轻轻震动。沿剑刃亮起的金色纹路，与男高手上的光连在一起。白天触剑时建立的联系，在这一刻终于得到了清晰的回应。

BACKGROUND: bg_dream_house_loop [制作占位，场内切镜]
SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=扶住门框，抬头望向剑光
EXPRESSION: 男高=挣扎，求生

STAGE:
男高咬住牙，抬头望向雾中透进来的一线亮光。

DIALOGUE:
男高：
谁都好……如果你听得见，帮我一把！

STAGE:
光落在门前，一只手越过雾，稳稳握住了他的手腕。

SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=right
POSE: 金发青年=持剑，扶住男高
EXPRESSION: 金发青年=专注

STAGE:
男高抬起头。金发、陌生的服装，以及那把翼状护手的剑——白天幻象中的青年，此刻正站在他面前。

STAGE:
青年没有开口。他先扶稳男高，随后转过身，将剑横在两人与浓雾之间。

SET: link_summoned = true

JUMP: B007

### SCENE: B007

SCENE: B007
TITLE: 一剑斩断噩梦
TIME: 梦境结束前
BACKGROUND: bg_dream_house_fracture [制作占位]
BGM: bgm_sword_breaks_dream [制作占位／待绑定]

HIDE: 男高
HIDE: 金发青年

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=勉强站稳，跟住青年
EXPRESSION: 男高=震惊

SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=right
POSE: 金发青年=站在男高身前，举剑
EXPRESSION: 金发青年=冷静，警戒

DIALOGUE:
雾中的声音：
这里是我的——

STAGE:
话没说完，青年已经向前踏出一步。剑刃沿着雾中最亮的缝隙落下。

SFX: sfx_sword_cuts_dream [制作占位]

STAGE:
缠在脚踝上的白雾骤然松开。饭桌、墙壁和一扇扇重复的门，同时裂开一道清晰的口子。

STAGE:
青年反手握住男高的手腕，带着他朝那道裂口走去。身后，刚才从容的声音一下子拔高。

DIALOGUE:
雾中的声音：
等一下！我还没说可以结束——！

STAGE:
她试着把雾重新聚起来。青年转身挡住最后一缕追来的白雾，剑锋一振，男高眼前的房屋便彻底散开。

STAGE:
热汤的气味、停住的钟和模糊的身影都远去了。男高听见自己急促的呼吸，以及有人在近处踩过木地板的轻响。

STAGE:
那只握着他手腕的手没有松开。

SET: nightmare_encountered = true

JUMP: B008

### SCENE: B008

SCENE: B008
TITLE: 醒来后的陌生人
TIME: 同一夜，梦醒后
BACKGROUND: bg_grandmother_bedroom_night [制作占位]
BGM: bgm_after_dream_quiet [制作占位／待绑定]

HIDE: 男高
HIDE: 金发青年

SHOW: 男高 asset=char_male_high_normal [占位符／待核对复用] position=left
POSE: 男高=从床上坐起，扶着被子
EXPRESSION: 男高=惊魂未定，疑惑

SHOW: 金发青年 asset=char_link_silent_placeholder [占位符／待核对复用] position=right
POSE: 金发青年=站在床边，持大师之剑
EXPRESSION: 金发青年=观察，克制

STAGE:
男高猛地坐起来，差点撞上床边的人。那人及时后退半步，空着的手仍护在他肩旁。

STAGE:
房间还是原来的房间。书包、台灯、窗台上的铁皮机器人，全都在。他连着喘了几口气，才确定自己终于回来了。

DIALOGUE:
男高：
刚才……是你把我拉出来的？

STAGE:
金发青年看了他片刻，轻轻点头。

DIALOGUE:
男高：
那你是谁？又是怎么进我房间的？

STAGE:
青年低头看了一眼手中的剑。男高顺着看过去：床边的旧布已经空了，对方握着的，正是自己带回家的大师之剑。

DIALOGUE:
男高：
你是跟着这把剑来的？

STAGE:
青年没有回答。他的目光从男高发亮的手移到脸上，确认男高能够坐稳，才慢慢放低剑尖。

STAGE:
男高抬起手，摸了摸已经不再发烫的灼痕。他有一肚子问题，却先把身子往床里挪了挪，给对方让出一点地方。

DIALOGUE:
男高：
我还不知道你是谁，也不知道你为什么会出现。
但刚才是你救了我。……谢谢。

STAGE:
青年微微颔首。两人隔着床边那一小块月光，安静地看着彼此。

SET: prologue_3_complete = true

END: B008

## 第四部分：分支与剧情状态表

本幕为线性主线，无好感度、结局分支或单项伪选择。下列状态名是文本交接约定，未接入任何引擎存档，也不改写现有游戏状态结构。

| 位置 | 状态 | 约定 |
|---|---|---|
| 入口 | has_master_sword | true；只接受序幕二取剑主线。 |
| B006 | link_summoned | 设为 true，林克通过本次联系现界。 |
| B007 | nightmare_encountered | 设为 true；不等于已知梦魇的身份。 |
| B008 | prologue_3_complete | 设为 true，可衔接 C001。 |

章节交接：B008结束后由章节入口进入 C001；不使用不存在的幕内跳转目标。

## 第五部分：演出与素材需求表

资源标识均为交接用占位符；本次没有生成、下载或绑定美术、声音与战斗资源。普通男高、奶奶等名称沿用既有脚本惯例，实际文件是否可复用仍需逐姿态检查。

| 类型 | 资源标识 | 用途／场景 | 状态 |
|---|---|---|---|
| 背景 | `bg_grandmother_dining_evening` | B001、B003 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| BGM | `bgm_homecoming_warm` | B001 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 人物／立绘 | `char_male_high_normal` | B001、B002、B003、B004、B005、B006、B007、B008 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 人物／立绘 | `char_grandmother_warm` | B001、B003 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 背景 | `bg_grandmother_bedroom_night` | B002、B006、B008 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| BGM | `bgm_sword_quiet_mystery` | B002 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 音效 | `sfx_light_switch` | B002 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| BGM | `bgm_homecoming_warm_dream` | B003 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 音效 | `sfx_clock_tick_stop` | B003 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 背景 | `bg_dream_dining_fog` | B004 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| BGM | `bgm_nightmare_invitation` | B004 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 背景 | `bg_dream_house_loop` | B005、B006 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| BGM | `bgm_nightmare_pressure` | B005 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 音效 | `sfx_door_loop` | B005 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| BGM | `bgm_sword_answer` | B006 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 音效 | `sfx_master_sword_resonance` | B006 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 人物／立绘 | `char_link_silent_placeholder` | B006、B007、B008 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 背景 | `bg_dream_house_fracture` | B007 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| BGM | `bgm_sword_breaks_dream` | B007 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 音效 | `sfx_sword_cuts_dream` | B007 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| BGM | `bgm_after_dream_quiet` | B008 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 道具 | `prop_master_sword_restored_cracked` | B002、B006—B008 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 道具 | `prop_master_sword_cloth_wrap` | B001—B002 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| CG／画面演出 | `cg_link_dream_rescue` | B006—B007 | 制作占位；已有素材须核对姿态、构图和授权后复用 |
| 画面演出 | `fx_dream_loop_fog_fracture` | B003—B007 | 制作占位；已有素材须核对姿态、构图和授权后复用 |

## 第六部分：对白与连续性检查

- 晚饭的真实奶奶与梦中重现的奶奶分开处理。
- 梦魇的对白同时保留诱导、困惑和强留，不把危险写成无害玩笑。
- B006—B007直接演出召唤与破梦，不再调用另一个会重复播放同一内容的特殊事件。
- B008后以章节结束交接 C001，不增加警报抢占本幕收束。
- 正式对白与心声按单次说话拆分，动作和环境保留在 STAGE，不让角色复述整段设定。
- 舞台说明涉及的动作先后，与正文和白板的场景编号逐项对应。

## 第七部分：后续制作事项

- 补齐素材表中的背景、动作、表情和声音，并检查显示名切换时不会提前暴露身份。
- 引擎接入时实现已约定入口与状态交接，再进行实际播放、存读档和资源缺失回退验收。
- 破梦演出使用同一救援事件的连续画面，不另行增加一次召唤或第二场梦。
