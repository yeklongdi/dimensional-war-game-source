# 男高透明半身与表情补齐

用户在查看A008旧全身回退后要求继续确保半身＋表情，并再次明确“占位不用改，只需要修改已经确定形象那几个”。本次只调整既定形象，不生成奶奶、主播或其他占位人物。

新增10张1024×1536 RGBA PNG，位于`public/assets/portraits/hero-half-v1`。使用内置imagegen编辑已批准男高形象；表情差分以同一半身母版为参考，保留黑发、脸型、黑金外套、红内衫与项链。`jobs.json`为实际提示、参考和生成源记录；`registration.json`记录原PNG的SHA、尺寸、透明比例。Python仅读取alpha数据，没有编辑图片。

| 素材 | 表情／姿态用途 |
|---|---|
| hero-half-friendly | 好奇、友善、轻松；A008等 |
| hero-half-alert | 认真、警戒、犹豫后决定 |
| hero-half-worried | 担心、焦急、尴尬紧张 |
| hero-half-tired | 疲惫、吃力但清醒 |
| hero-half-pained | 痛苦、挣扎求生 |
| hero-half-angry | 愤怒、困倦 |
| hero-half-surprised | 震惊、惊讶、茫然 |
| hero-half-excited | 自信、兴奋、期待 |
| hero-half-bed-sleepy | A001刚醒、困倦慌张，斜靠局部枕头 |
| hero-half-bed-awake | 同一躺靠姿态清醒、自信；睡前期待也用此姿态 |

映射见`src/game/visual/hero-half.ts`，只登记脚本EXPRESSION，不读取对白猜情绪。运行优先级为原五个已批准动态→已制作坐姿／持剑→对应半身表情。原`hero.png`原件保留，正式解析和动态图层加载失败的后备均不再使用它。

新半身使用`bust`固定显示框，表情切换沿相同构图；旧坐姿、持剑及从者等沿`waist`框，上下半身由同一舞台和文字窗裁切显示。同槽人物拉开间距，避免窄占位遮住宽半身的脸；不改变剧本位置、剧情状态或存档。

28张新图（首批18＋本次10）均在浏览器成功加载，深浅底透明边缘已检查。四段已定形象的84组姿态／表情状态逐一通过真实下拉操作检查，无缺图占位、未加载图或旧`hero.png`。证据见`docs/verification/prologue-v2/known-portrait-states-browser.json`及`a008-half-fixed.png`、`hero-half-dark.png`、`hero-half-light.png`、`a001-half-bed.png`等截图。

本轮保证透明半身与已登记表情覆盖，不声称50个男高状态的完整身体动作均已绘制。跑步、抱扶、取剑、扶门、闪避等在没有专用图时用对应半身表情演示并保留动作缺口诊断；坐姿、持剑、躺靠各有专用图。其他人物占位按用户再次确认保留。
