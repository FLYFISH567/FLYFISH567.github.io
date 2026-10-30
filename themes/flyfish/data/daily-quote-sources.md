# 每日一句选句与来源

本轮调整：2026-10-30。总数为 360 条，原创、古诗词、国内名言、国外名言分别为 36、108、108、108 条。

## 取舍

- 原创从原有 184 条中保留 36 条，没有为凑数再写新句。优先留下具体的生活观察、阅读与探索，删去意思重复、过于笼统的鼓励；原有完整内容仍可从 Git 历史查看。
- 古诗词从既有 175 条中按作者轮流筛取 108 条，涵盖 37 位作者，避免少数诗人占多数。原中文诗歌数据许可不变，见同目录 `daily-quote-license.txt`。
- 国内名言选择古典思想、散文和近代文章，单独列为散文名言，诗词不重复归入此类。对照简体原典，统一常见标点及“著/着”等字形；古籍校注、异文提示不算入正文。
- 国外部分保留 14 位作者的 108 条作品摘句。逐条以 Project Gutenberg 公版英文文本查找、阅读语境，再写中文译意；没有使用现成中文译本。小说与戏剧的台词或叙述是作品摘句，不把角色话语当作作者在现实中的断言。
- 舍弃找不到出处的常见网络名句，替换不能在所用版本中核对的候选。

## 国内原典

句子所用的具体来源 URL、作者和作品名保存在 `daily-card.js` 的 `sources`，并由卡片的署名链接直接访问。

| 作者 | 作品 | 条数 |
|---|---|---:|
| 孔子 | 《论语》 | 18 |
| 孟子 | 《孟子》 | 12 |
| 荀子 | 《劝学》 | 9 |
| 老子 | 《道德经》 | 12 |
| 朱熹 | 《朱子读书法》 | 9 |
| 王阳明 | 《传习录·卷上》 | 12 |
| 韩愈 | 《进学解》《师说》 | 6 |
| 梁启超 | 《最苦与最乐》《敬业与乐业》 | 12 |
| 鲁迅 | 《故乡》《呐喊·自序》《热风·随感录四十一》《好的故事》 | 12 |
| 诸葛亮 | 《诫子书》 | 3 |
| 苏轼 | 《前赤壁赋》 | 3 |

上述正文链接到维基文库的原作页面。引文使用公版正文，保留作者与作品署名；不使用其现代页面注释作为作者原话。

## 国外原作

| 作者 | 所用英文书目 | 条数 |
|---|---|---:|
| 培根 | [The Essays, PG 575](https://www.gutenberg.org/ebooks/575) | 9 |
| 爱默生 | [Essays, PG 16643](https://www.gutenberg.org/ebooks/16643) | 9 |
| 梭罗 | [Walden, PG 205](https://www.gutenberg.org/ebooks/205) | 9 |
| 马可·奥勒留 | [Meditations, PG 2680](https://www.gutenberg.org/ebooks/2680) | 6 |
| 爱比克泰德 | [The Enchiridion, PG 45109](https://www.gutenberg.org/ebooks/45109) | 9 |
| 莎士比亚 | [Hamlet, PG 1524](https://www.gutenberg.org/ebooks/1524) | 6 |
| 简·奥斯汀 | [Pride and Prejudice, PG 1342](https://www.gutenberg.org/ebooks/1342) | 6 |
| 狄更斯 | [A Tale of Two Cities, PG 98](https://www.gutenberg.org/ebooks/98) | 6 |
| 托尔斯泰 | [Anna Karenina, PG 1399](https://www.gutenberg.org/ebooks/1399) | 6 |
| 陀思妥耶夫斯基 | [The Brothers Karamazov, PG 28054](https://www.gutenberg.org/ebooks/28054) | 6 |
| 纪伯伦 | [The Prophet, PG 58585](https://www.gutenberg.org/ebooks/58585) | 9 |
| 王尔德 | [The Picture of Dorian Gray, PG 174](https://www.gutenberg.org/ebooks/174) | 9 |
| 富兰克林 | [Autobiography, PG 148](https://www.gutenberg.org/ebooks/148) | 9 |
| 蒙田 | [Essays, PG 3600](https://www.gutenberg.org/ebooks/3600) | 9 |

外文核对原句保存在 `catalog.foreign` 每条记录的第三项。只取正文或作品序言中的作者论述，不用后加的译者介绍替作者发言；人物台词保留作品标识。条目中的“译意”表示本站根据所列英文原文所作的中文表达，不等于作者原始语言的逐字直译。

## 检查

运行 `npm run verify`。每日一句检查覆盖：360 条文字唯一、精确配比、每十句比例、外文原句和出处存在、原创清理旧链接、同日稳定、跨日更新、手动换句与站内导航初始化。

本轮一次性原文核对的下载材料与逐句匹配脚本在忽略的 `tmp/quote-research/` 及同目录脚本中；这些只用于本机研究，不作为发布依赖。正式代码不联网下载书籍，不增加第三方名言接口请求。
