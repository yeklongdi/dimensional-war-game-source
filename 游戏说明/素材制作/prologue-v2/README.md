# 四段序幕静态立绘与表情

首批18张1024×1536 RGBA PNG已复制到`public/assets/portraits/prologue-v2`；用户继续要求半身后追加的男高10张见[补充记录](../hero-half-v1/README.md)，合计28张。全部使用内置imagegen生成／编辑，没有用Python修改图片。`registration.json`记录生成原件路径、PNG的SHA-256、尺寸和透明信息；本轮不覆盖vault图片、旧hero.png或已批准hero-layered-v3。

`prompts.json`保存13条原始请求；另5条见`prompt-supplement.json`，其中最初日常三表情明确标为按批准设计补录的说明，不冒称逐字原始请求。后补两条夜间行动差分为原始请求。

## 覆盖与实际映射

| 文件名（均为.png） | 检查结果与接入 |
|---|---|
| thief-daily-smile | 日常服、黑发蓝眼、去礼帽／眼镜；微笑；A004／A005托腮状态 |
| thief-daily-serious | 同一日常形象，认真；明确表达认真而无夜间行动POSE时使用 |
| thief-daily-alert | 同一日常形象，警觉／意外；A002路口状态 |
| thief-action | 按用户已有图的礼帽、单片眼镜、白礼服行动形态；P005／P007、C008／C009摘面罩前 |
| thief-unmasked-action-smile | 露脸但保留白礼服、红领带、披风；C009收起面罩，不能误换日常服 |
| thief-unmasked-action-serious | 同一夜间行动服认真差分；C010／C011／C012 |
| link-calm | 金发蓝眼尖耳、蓝英杰服、正常双臂；B008观察及安静状态，玩家名“金发青年” |
| link-guard | 同一人物警戒持剑；B006／B007及夜街护卫状态 |
| link-wrapped | 同一人物、旧布裹剑；C013明确包剑POSE优先于表情映射 |
| saber-calm | 金发、白花、白蓝旅行服、持剑平静；C008／C011，女剑士与Saber共用身份素材 |
| saber-alert | 同一人物警戒差分；C009／C012 |
| saber-impatient | 同一人物耐心有限差分；C010 |
| deoxys-normal | 沿已有图保留橙蓝躯体、胸口核心和细触臂；C004／C005等，玩家仍称不明生物 |
| deoxys-defense | 官方防御型参考，宽厚躯体与护臂；C006起；与普通型明确区分 |
| hero-seated-proud | 沿已批准男高形象，真实坐姿、得意；P003，未再用普通站姿冒充坐沙发 |
| hero-seated-calm | 坐姿、较放松表情；B001餐桌状态 |
| hero-seated-alert | 坐姿、疑惑／警觉；B002／B003／B008／C001 |
| hero-sword-guard | 持大师之剑、警戒；仅精确匹配A013原POSE与表情，避免泛化覆盖其他演出 |

映射实现见`src/game/visual/static-portraits.ts`。当前四段完整状态盘点见`docs/verification/prologue-v2/visual-inventory.json`，旧五动态配方优先于新静态，不被覆盖。

## 视觉复核

18图均核对透明通道、固定画布及SHA，浏览器全部实际加载成功。深／浅背景对照见`docs/verification/prologue-v2/screenshots/contact-*.png`；P003、B008、C006、C009、C011、C013等实际播放器截图与DEV记录见本轮验收。图中人物主体清晰，日常／行动态、蒙面／露脸、两生物形态可区分；本轮静态差分没有增加口型或Live2D，不把重绘差分称为逐像素固定分层。

原图由用户指定为“蒙面形态”，实际图中可见面部、礼帽和单片眼镜，本轮遵从该指定。源稿“黑衣／面罩”的文字保持原样；没有另造一套未经确认的黑衣形象。C009夜间仅移去礼帽与眼镜并露出同一黑发脸型，保留行动服。

## 明确限制

- 奶奶、虚拟主播、反派、偶像、老师、组织成员／干部和黑色人形等无既定图片人物按用户最新决定保留占位；不计作已绘制。保健室老师、同学及一般学生保留场外对白。
- 男高四段共有大量复杂POSE。跑步／叼面包、抱人／扶人、取剑包裹、扶门挣扎、窗边站位、徒手迎击和退避等没有逐一制作完整动作，现已使用对应透明半身表情代演并记录动作缺口。旧带背景原件保留，但不再用于实际解析或动态失败回退。
- 新坐姿图显示坐姿，但未逐场画出沙发／餐桌／床被，属于人物静态构图；Link“扶住男高”、连续截击等动作也未逐帧绘制。静态人物不能还原所有双人接触和位移。
- 当前背景、音效、幻象动画、CG、剑与结晶仍有占位。道具独立展示，不混入人物首字／口型系统。
- C003后的重要人物和表情是在DEV预览核对；正式玩家在第一场未开放新战斗前停止，不能看到后续流程或通过预览修改进度。

## 参考来源

- 用户vault已有怪盗、男高与普通型图片，按用户授权仅作本项目既有形象参考。
- [任天堂《王国之泪》人物页](https://www.nintendo.com/jp/zelda/totk/character/index.html)：金发青年服装与外貌参考。本项目资料明确其双臂恢复，未画机械右臂。
- [官方HoYoWiki旅行者资料](https://wiki.hoyolab.com/pc/genshin/entry/2674?lang=zh-cn)：女剑士荧的形象参考；真名只在制作者资料出现，不进玩家名字牌。
- [宝可梦官方普通型图鉴](https://id.portal-pokemon.com/pokedex/0386/)与[防御型图鉴](https://id.portal-pokemon.com/pokedex/0386_2/)：形态参考；玩家不显示资料真名。

`references`是浏览器查阅公开资料页的截图，不是解包或抽取原游戏资源。生成图片及参考页不因工程源码采用MIT而获得额外再授权；继续适用仓库资源说明。
