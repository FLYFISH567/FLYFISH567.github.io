# 每日一句选句与来源

最近调整为 2026-11-12。总数为 360 条，原创、古诗词、国内名言、国外名言分别为 36、108、108、108 条。

## 取舍

- 原创从原有 184 条中保留 36 条，没有为凑数再写新句。优先留下具体的生活观察、阅读与探索，删去意思重复、过于笼统的鼓励；原有完整内容仍可从 Git 历史查看。
- 古诗词从既有 175 条中按作者轮流筛取 108 条，涵盖 37 位作者，避免少数诗人占多数。原中文诗歌数据许可不变，见同目录 `daily-quote-license.txt`。
- 国内摘句涵盖 16 位作者，选自古典思想、散文和近代文章。对照简体原典，统一常见标点和字形，摘录正文时略去校注和异文提示。
- 国外摘句涵盖 21 位作者。逐条对照 Project Gutenberg 的公版英文文本核对语境，再写中文译意。小说与戏剧中的台词和叙述按作品署名。
- 《先知》由 9 条减至 2 条，《论语》由 18 条减至 13 条。国内外摘句按作者分散到整轮，每天展示和手动换句共用这个顺序。
- 舍弃找不到出处的常见网络名句，替换不能在所用版本中核对的候选。

## 国内原典

句子所用的具体来源 URL、作者和作品名保存在 `daily-card.js` 的 `sources`，并由卡片的署名链接直接访问。

| 作者 | 作品 | 条数 |
|---|---|---:|
| 孔子 | 《论语》 | 13 |
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
| 庄子 | [《逍遥游》](https://zh.wikisource.org/zh-hans/逍遙遊) | 1 |
| 刘禹锡 | [《陋室铭》](https://zh.wikisource.org/zh-hans/陋室銘) | 1 |
| 归有光 | [《项脊轩志》](https://zh.wikisource.org/zh-hans/項脊軒志) | 1 |
| 张岱 | [《湖心亭看雪》](https://zh.wikisource.org/zh-hans/湖心亭看雪) | 1 |
| 袁宏道 | [《满井游记》](https://zh.wikisource.org/zh-hans/滿井遊記) | 1 |

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
| 纪伯伦 | [The Prophet, PG 58585](https://www.gutenberg.org/ebooks/58585) | 2 |
| 露西·莫德·蒙哥马利 | [Anne of Green Gables, PG 45](https://www.gutenberg.org/cache/epub/45/pg45-images.html) | 1 |
| 艾米莉·狄金森 | [Hope, PG 2679](https://www.gutenberg.org/cache/epub/2679/pg2679.html) | 1 |
| 玛丽·雪莱 | [Frankenstein, PG 84](https://www.gutenberg.org/files/84/84-h/84-h.htm) | 1 |
| 乔治·艾略特 | [Middlemarch, PG 145](https://www.gutenberg.org/cache/epub/145/pg145-images.html) | 1 |
| 刘易斯·卡罗尔 | [Alice’s Adventures in Wonderland, PG 11](https://www.gutenberg.org/files/11/11-h/11-h.htm) | 1 |
| 弗朗西丝·霍奇森·伯内特 | [The Secret Garden, PG 113](https://www.gutenberg.org/cache/epub/113/pg113-images.html) | 1 |
| 泰戈尔 | [The Crescent Moon, PG 6520](https://www.gutenberg.org/cache/epub/6520/pg6520-images.html) | 1 |
| 王尔德 | [The Picture of Dorian Gray, PG 174](https://www.gutenberg.org/ebooks/174) | 9 |
| 富兰克林 | [Autobiography, PG 148](https://www.gutenberg.org/ebooks/148) | 9 |
| 蒙田 | [Essays, PG 3600](https://www.gutenberg.org/ebooks/3600) | 9 |

外文核对原句保存在 `catalog.foreign` 每条记录的第三项。只取正文或作品序言中的作者论述，不用后加的译者介绍替作者发言；人物台词保留作品标识。条目中的“译意”表示本站根据所列英文原文所作的中文表达，不等于作者原始语言的逐字直译。

## 检查

运行 `npm run verify`。每日一句检查覆盖 360 条文字唯一、每十句比例、同作者间隔、单条作者在整轮的分布、原文和出处、同日稳定、跨日更新、手动换句与站内导航初始化。

2026-10-30 的原文核对材料与逐句匹配脚本在忽略的 `tmp/quote-research/` 及同目录脚本中。正式代码直接使用本地句库。
