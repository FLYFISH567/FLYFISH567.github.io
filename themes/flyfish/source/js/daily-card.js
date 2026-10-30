(() => {
  'use strict';
  /* QUOTE_CATALOG_START — 四类比例 1:3:3:3；外文第三列为核对原句，非现成中文译本。 */
  const sources = {
  "original": {
    "author": "小站手记",
    "work": "原创"
  },
  "poem-1": {
    "author": "王维",
    "work": "终南别业",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-2": {
    "author": "张九龄",
    "work": "望月怀远",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-3": {
    "author": "杜甫",
    "work": "春夜喜雨",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-4": {
    "author": "李白",
    "work": "行路难",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-5": {
    "author": "陆游",
    "work": "游山西村",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-6": {
    "author": "苏轼",
    "work": "定风波",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-7": {
    "author": "王之涣",
    "work": "登鹳雀楼",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-8": {
    "author": "陶渊明",
    "work": "饮酒·其五",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-9": {
    "author": "朱熹",
    "work": "春日",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-10": {
    "author": "李商隐",
    "work": "夜雨寄北",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-11": {
    "author": "王湾",
    "work": "次北固山下",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-12": {
    "author": "张旭",
    "work": "桃花溪",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-13": {
    "author": "韩愈",
    "work": "山石",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-14": {
    "author": "杜牧",
    "work": "赠别二首·其一",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-15": {
    "author": "许浑",
    "work": "早秋三首·其一",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-16": {
    "author": "李益",
    "work": "喜见外弟又言别",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-17": {
    "author": "司空曙",
    "work": "云阳馆与韩绅宿别",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-18": {
    "author": "刘长卿",
    "work": "送方外上人",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-19": {
    "author": "孟浩然",
    "work": "秋登兰山寄张五",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-20": {
    "author": "裴迪",
    "work": "崔九欲往南山马上口号与别",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-21": {
    "author": "崔颢",
    "work": "黄鹤楼",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-22": {
    "author": "祖咏",
    "work": "终南望余雪",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-23": {
    "author": "李颀",
    "work": "琴歌",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-24": {
    "author": "綦毋潜",
    "work": "春泛若耶溪",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-25": {
    "author": "王昌龄",
    "work": "同从弟销南斋玩月忆山阴崔少府",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-26": {
    "author": "常建",
    "work": "宿王昌龄隐居",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-27": {
    "author": "白居易",
    "work": "琵琶引",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-28": {
    "author": "贾岛",
    "work": "寻隐者不遇",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-29": {
    "author": "温庭筠",
    "work": "利州南渡",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-30": {
    "author": "张祜",
    "work": "集灵台二首·其一",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-31": {
    "author": "柳宗元",
    "work": "晨诣超师院读禅经",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-32": {
    "author": "刘禹锡",
    "work": "金陵五题 乌衣巷",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-33": {
    "author": "孟郊",
    "work": "游子吟",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-34": {
    "author": "钱起",
    "work": "谷口书斋寄杨补阙",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-35": {
    "author": "韦应物",
    "work": "寄李儋元锡",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-36": {
    "author": "岑参",
    "work": "与高适薛据慈恩寺浮图",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-37": {
    "author": "刘方平",
    "work": "夜月",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-38": {
    "author": "王维",
    "work": "山居秋暝",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-39": {
    "author": "杜甫",
    "work": "望岳",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-40": {
    "author": "李白",
    "work": "关山月",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-41": {
    "author": "王之涣",
    "work": "登鹳雀楼",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-42": {
    "author": "李商隐",
    "work": "夜雨寄北",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-43": {
    "author": "王湾",
    "work": "次北固山下",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-44": {
    "author": "韩愈",
    "work": "山石",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-45": {
    "author": "杜牧",
    "work": "秋夕",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-46": {
    "author": "许浑",
    "work": "早秋三首·其一",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-47": {
    "author": "李益",
    "work": "夜上受降城闻笛",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-48": {
    "author": "司空曙",
    "work": "喜外弟卢纶见宿",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-49": {
    "author": "刘长卿",
    "work": "送灵澈上人",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-50": {
    "author": "孟浩然",
    "work": "秋登兰山寄张五",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-51": {
    "author": "崔颢",
    "work": "黄鹤楼",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-52": {
    "author": "李颀",
    "work": "送陈章甫",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-53": {
    "author": "綦毋潜",
    "work": "春泛若耶溪",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-54": {
    "author": "王昌龄",
    "work": "同从弟销南斋玩月忆山阴崔少府",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-55": {
    "author": "常建",
    "work": "宿王昌龄隐居",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-56": {
    "author": "白居易",
    "work": "琵琶引",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-57": {
    "author": "贾岛",
    "work": "寻隐者不遇",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-58": {
    "author": "温庭筠",
    "work": "利州南渡",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-59": {
    "author": "张祜",
    "work": "题金陵渡",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-60": {
    "author": "柳宗元",
    "work": "晨诣超师院读禅经",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-61": {
    "author": "刘禹锡",
    "work": "和乐天春词",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-62": {
    "author": "钱起",
    "work": "谷口书斋寄杨补阙",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-63": {
    "author": "韦应物",
    "work": "寄李儋元锡",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-64": {
    "author": "岑参",
    "work": "与高适薛据慈恩寺浮图",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-65": {
    "author": "刘方平",
    "work": "夜月",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-66": {
    "author": "王维",
    "work": "使至塞上",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-67": {
    "author": "杜甫",
    "work": "春宿左省",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-68": {
    "author": "李白",
    "work": "关山月",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-69": {
    "author": "王之涣",
    "work": "凉州词二首·其一",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-70": {
    "author": "李商隐",
    "work": "寄令狐郎中",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-71": {
    "author": "韩愈",
    "work": "八月十五夜赠张功曹",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-72": {
    "author": "杜牧",
    "work": "金谷园",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-73": {
    "author": "许浑",
    "work": "秋日赴阙题潼关驿楼",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-74": {
    "author": "刘长卿",
    "work": "送灵澈上人",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-75": {
    "author": "孟浩然",
    "work": "夏日南亭怀辛大",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-76": {
    "author": "崔颢",
    "work": "黄鹤楼",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-77": {
    "author": "李颀",
    "work": "送陈章甫",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-78": {
    "author": "綦毋潜",
    "work": "春泛若耶溪",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-79": {
    "author": "王昌龄",
    "work": "同从弟销南斋玩月忆山阴崔少府",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-80": {
    "author": "常建",
    "work": "宿王昌龄隐居",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-81": {
    "author": "白居易",
    "work": "琵琶引",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-82": {
    "author": "温庭筠",
    "work": "利州南渡",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-83": {
    "author": "柳宗元",
    "work": "登柳州城楼寄漳汀封连四州",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-84": {
    "author": "钱起",
    "work": "谷口书斋寄杨补阙",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-85": {
    "author": "韦应物",
    "work": "寄全椒山中道士",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-86": {
    "author": "岑参",
    "work": "与高适薛据慈恩寺浮图",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-87": {
    "author": "刘方平",
    "work": "春怨",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-88": {
    "author": "王维",
    "work": "送别",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-89": {
    "author": "杜甫",
    "work": "春宿左省",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-90": {
    "author": "李白",
    "work": "清平调·其一",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-91": {
    "author": "李商隐",
    "work": "落花",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-92": {
    "author": "杜牧",
    "work": "旅宿",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-93": {
    "author": "刘长卿",
    "work": "新年作",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-94": {
    "author": "孟浩然",
    "work": "夏日南亭怀辛大",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-95": {
    "author": "李颀",
    "work": "送陈章甫",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-96": {
    "author": "白居易",
    "work": "赋得古原草送别",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-97": {
    "author": "温庭筠",
    "work": "瑶瑟怨",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-98": {
    "author": "柳宗元",
    "work": "溪居",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-99": {
    "author": "钱起",
    "work": "送僧归日本",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-100": {
    "author": "韦应物",
    "work": "秋夜寄丘二十二员外",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-101": {
    "author": "王维",
    "work": "送别",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-102": {
    "author": "杜甫",
    "work": "春宿左省",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-103": {
    "author": "李白",
    "work": "长相思",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-104": {
    "author": "李商隐",
    "work": "落花",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-105": {
    "author": "刘长卿",
    "work": "寻南溪常山道人隐居",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-106": {
    "author": "孟浩然",
    "work": "宿业师山房期丁大不至",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-107": {
    "author": "李颀",
    "work": "听安万善吹觱篥歌",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "poem-108": {
    "author": "温庭筠",
    "work": "瑶瑟怨",
    "url": "https://github.com/chinese-poetry/chinese-poetry"
  },
  "confucius": {
    "author": "孔子",
    "work": "论语",
    "url": "https://zh.wikisource.org/zh-hans/%E8%AB%96%E8%AA%9E/%E5%85%A8%E8%A6%BD"
  },
  "mencius": {
    "author": "孟子",
    "work": "孟子",
    "url": "https://zh.wikisource.org/zh-hans/%E5%AD%9F%E5%AD%90/%E5%85%A8%E8%A6%BD"
  },
  "xunzi": {
    "author": "荀子",
    "work": "劝学",
    "url": "https://zh.wikisource.org/zh-hans/%E8%8D%80%E5%AD%90/%E5%8B%B8%E5%AD%B8%E7%AF%87"
  },
  "laozi": {
    "author": "老子",
    "work": "道德经",
    "url": "https://zh.wikisource.org/zh-hans/%E8%80%81%E5%AD%90_(%E5%8C%AF%E6%A0%A1%E7%89%88)"
  },
  "zhuxi": {
    "author": "朱熹",
    "work": "朱子读书法",
    "url": "https://zh.wikisource.org/zh-hans/%E6%9C%B1%E5%AD%90%E8%AE%80%E6%9B%B8%E6%B3%95"
  },
  "wang": {
    "author": "王阳明",
    "work": "传习录·卷上",
    "url": "https://zh.wikisource.org/zh-hans/%E5%82%B3%E7%BF%92%E9%8C%84/%E5%8D%B7%E4%B8%8A"
  },
  "hanyu": {
    "author": "韩愈",
    "work": "进学解",
    "url": "https://zh.wikisource.org/zh-hans/%E9%80%B2%E5%AD%B8%E8%A7%A3"
  },
  "hanyu2": {
    "author": "韩愈",
    "work": "师说",
    "url": "https://zh.wikisource.org/zh-hans/%E5%B8%AB%E8%AA%AA"
  },
  "liang": {
    "author": "梁启超",
    "work": "最苦与最乐",
    "url": "https://zh.wikisource.org/zh-hans/%E6%9C%80%E8%8B%A6%E8%88%87%E6%9C%80%E6%A8%82"
  },
  "liang2": {
    "author": "梁启超",
    "work": "敬业与乐业",
    "url": "https://zh.wikisource.org/zh-hans/%E6%95%AC%E6%A5%AD%E8%88%87%E6%A8%82%E6%A5%AD"
  },
  "luxun": {
    "author": "鲁迅",
    "work": "故乡",
    "url": "https://zh.wikisource.org/zh-hans/%E6%95%85%E9%84%89"
  },
  "luxun2": {
    "author": "鲁迅",
    "work": "呐喊·自序",
    "url": "https://zh.wikisource.org/zh-hans/%E5%90%B6%E5%96%8A"
  },
  "luxun3": {
    "author": "鲁迅",
    "work": "热风·随感录四十一",
    "url": "https://zh.wikisource.org/zh-hans/%E7%86%B1%E9%A2%A8/%E9%9A%A8%E6%84%9F%E9%8C%84/%E5%9B%9B%E5%8D%81%E4%B8%80"
  },
  "luxun5": {
    "author": "鲁迅",
    "work": "好的故事",
    "url": "https://zh.wikisource.org/zh-hans/%E5%A5%BD%E7%9A%84%E6%95%85%E4%BA%8B"
  },
  "zhuge": {
    "author": "诸葛亮",
    "work": "诫子书",
    "url": "https://zh.wikisource.org/zh-hans/%E8%AA%A1%E5%AD%90%E6%9B%B8"
  },
  "sushi": {
    "author": "苏轼",
    "work": "前赤壁赋",
    "url": "https://zh.wikisource.org/zh-hans/%E5%89%8D%E8%B5%A4%E5%A3%81%E8%B3%A6"
  },
  "bacon": {
    "author": "培根",
    "work": "论说文集",
    "url": "https://www.gutenberg.org/ebooks/575",
    "translation": "根据所链公版英文文本译意；小说与戏剧为作品摘句，不表示作者在现实中的个人断言。"
  },
  "emerson": {
    "author": "爱默生",
    "work": "随笔集",
    "url": "https://www.gutenberg.org/ebooks/16643",
    "translation": "根据所链公版英文文本译意；小说与戏剧为作品摘句，不表示作者在现实中的个人断言。"
  },
  "thoreau": {
    "author": "梭罗",
    "work": "瓦尔登湖",
    "url": "https://www.gutenberg.org/ebooks/205",
    "translation": "根据所链公版英文文本译意；小说与戏剧为作品摘句，不表示作者在现实中的个人断言。"
  },
  "marcus": {
    "author": "马可·奥勒留",
    "work": "沉思录",
    "url": "https://www.gutenberg.org/ebooks/2680",
    "translation": "根据所链公版英文文本译意；小说与戏剧为作品摘句，不表示作者在现实中的个人断言。"
  },
  "epictetus": {
    "author": "爱比克泰德",
    "work": "手册",
    "url": "https://www.gutenberg.org/ebooks/45109",
    "translation": "根据所链公版英文文本译意；小说与戏剧为作品摘句，不表示作者在现实中的个人断言。"
  },
  "shakespeare": {
    "author": "莎士比亚",
    "work": "哈姆雷特",
    "url": "https://www.gutenberg.org/ebooks/1524",
    "translation": "根据所链公版英文文本译意；小说与戏剧为作品摘句，不表示作者在现实中的个人断言。"
  },
  "austen": {
    "author": "简·奥斯汀",
    "work": "傲慢与偏见",
    "url": "https://www.gutenberg.org/ebooks/1342",
    "translation": "根据所链公版英文文本译意；小说与戏剧为作品摘句，不表示作者在现实中的个人断言。"
  },
  "dickens": {
    "author": "狄更斯",
    "work": "双城记",
    "url": "https://www.gutenberg.org/ebooks/98",
    "translation": "根据所链公版英文文本译意；小说与戏剧为作品摘句，不表示作者在现实中的个人断言。"
  },
  "tolstoy": {
    "author": "托尔斯泰",
    "work": "安娜·卡列尼娜",
    "url": "https://www.gutenberg.org/ebooks/1399",
    "translation": "根据所链公版英文文本译意；小说与戏剧为作品摘句，不表示作者在现实中的个人断言。"
  },
  "dostoyevsky": {
    "author": "陀思妥耶夫斯基",
    "work": "卡拉马佐夫兄弟",
    "url": "https://www.gutenberg.org/ebooks/28054",
    "translation": "根据所链公版英文文本译意；小说与戏剧为作品摘句，不表示作者在现实中的个人断言。"
  },
  "gibran": {
    "author": "纪伯伦",
    "work": "先知",
    "url": "https://www.gutenberg.org/ebooks/58585",
    "translation": "根据所链公版英文文本译意；小说与戏剧为作品摘句，不表示作者在现实中的个人断言。"
  },
  "wilde": {
    "author": "王尔德",
    "work": "道林·格雷的画像",
    "url": "https://www.gutenberg.org/ebooks/174",
    "translation": "根据所链公版英文文本译意；小说与戏剧为作品摘句，不表示作者在现实中的个人断言。"
  },
  "franklin": {
    "author": "富兰克林",
    "work": "富兰克林自传",
    "url": "https://www.gutenberg.org/ebooks/148",
    "translation": "根据所链公版英文文本译意；小说与戏剧为作品摘句，不表示作者在现实中的个人断言。"
  },
  "montaigne": {
    "author": "蒙田",
    "work": "随笔集",
    "url": "https://www.gutenberg.org/ebooks/3600",
    "translation": "根据所链公版英文文本译意；小说与戏剧为作品摘句，不表示作者在现实中的个人断言。"
  }
};
  const catalog = {
  "original": [
    [
      "慢慢来，生活自有它的节奏。",
      "original"
    ],
    [
      "把好奇心装进口袋，再出发。",
      "original"
    ],
    [
      "愿你有勇气认真，也有时间发呆。",
      "original"
    ],
    [
      "允许生活留白，灵感才有地方停靠。",
      "original"
    ],
    [
      "把喜欢的歌留给今天的路。",
      "original"
    ],
    [
      "走慢一点，路边的花才有机会被看见。",
      "original"
    ],
    [
      "眼前的小事，也能组成值得纪念的一天。",
      "original"
    ],
    [
      "对自己的期待，可以温柔一点。",
      "original"
    ],
    [
      "先整理桌面，再慢慢整理心情。",
      "original"
    ],
    [
      "把疑问写下来，探索就有了起点。",
      "original"
    ],
    [
      "雨停之后，不妨去看看路上的水光。",
      "original"
    ],
    [
      "把大问题拆成小步骤，第一步就没那么难。",
      "original"
    ],
    [
      "留意今天最安静的那个瞬间。",
      "original"
    ],
    [
      "偶尔换一条回家的路，看看不同的风景。",
      "original"
    ],
    [
      "把烦恼放在纸上，不必一直揣在心里。",
      "original"
    ],
    [
      "路灯亮起来的时候，城市也有温柔的样子。",
      "original"
    ],
    [
      "把想说的话认真写下来，给未来留封信。",
      "original"
    ],
    [
      "一场好雨，会让远山显得格外清楚。",
      "original"
    ],
    [
      "一本好书，能让安静的下午变得辽阔。",
      "original"
    ],
    [
      "认真听完一首歌，也是一种休息。",
      "original"
    ],
    [
      "窗台上的光，会随着时间慢慢移动。",
      "original"
    ],
    [
      "如果答案暂时找不到，就先收藏这个问题。",
      "original"
    ],
    [
      "书签停住的地方，故事会等你回来。",
      "original"
    ],
    [
      "认真观察一片叶子，也是在认识世界。",
      "original"
    ],
    [
      "做笔记的时候，也在为未来的自己搭桥。",
      "original"
    ],
    [
      "学会向别人求助，也是解决问题的一部分。",
      "original"
    ],
    [
      "小鱼游得不急，也能慢慢穿过整片海。",
      "original"
    ],
    [
      "把计划写得小一点，行动就容易开始。",
      "original"
    ],
    [
      "记住一片晚霞，也算收藏了一天。",
      "original"
    ],
    [
      "一段音乐结束，安静也有它的旋律。",
      "original"
    ],
    [
      "把问题说清楚，答案就有了轮廓。",
      "original"
    ],
    [
      "雨滴落在窗上，世界暂时有了另一种声音。",
      "original"
    ],
    [
      "在旧照片里，时间会换一种方式停留。",
      "original"
    ],
    [
      "从一行代码开始，也能搭建一个小世界。",
      "original"
    ],
    [
      "错误信息不只是阻碍，也可能是线索。",
      "original"
    ],
    [
      "提问是一种能力，认真倾听也是。",
      "original"
    ]
  ],
  "poetry": [
    [
      "行到水穷处，坐看云起时。",
      "poem-1"
    ],
    [
      "海上生明月，天涯共此时。",
      "poem-2"
    ],
    [
      "随风潜入夜，润物细无声。",
      "poem-3"
    ],
    [
      "长风破浪会有时，直挂云帆济沧海。",
      "poem-4"
    ],
    [
      "山重水复疑无路，柳暗花明又一村。",
      "poem-5"
    ],
    [
      "竹杖芒鞋轻胜马，谁怕？",
      "poem-6"
    ],
    [
      "欲穷千里目，更上一层楼。",
      "poem-7"
    ],
    [
      "采菊东篱下，悠然见南山。",
      "poem-8"
    ],
    [
      "等闲识得东风面，万紫千红总是春。",
      "poem-9"
    ],
    [
      "君问归期未有期，巴山夜雨涨秋池。",
      "poem-10"
    ],
    [
      "客路青山外，行舟绿水前。",
      "poem-11"
    ],
    [
      "桃花尽日随流水，洞在清溪何处边。",
      "poem-12"
    ],
    [
      "升堂坐阶新雨足，芭蕉叶大支子肥。",
      "poem-13"
    ],
    [
      "春风十里扬州路，卷上珠帘总不如。",
      "poem-14"
    ],
    [
      "遥夜泛清瑟，西风生翠萝。",
      "poem-15"
    ],
    [
      "明日巴陵道，秋山又几重。",
      "poem-16"
    ],
    [
      "故人江海别，几度隔山川。",
      "poem-17"
    ],
    [
      "孤云将野鹤，岂向人间住。",
      "poem-18"
    ],
    [
      "北山白云里，隐者自怡悦。",
      "poem-19"
    ],
    [
      "归山深浅去，须尽丘壑美。",
      "poem-20"
    ],
    [
      "昔人已乘白云去，此地空余黄鹤楼。",
      "poem-21"
    ],
    [
      "终南阴岭秀，积雪浮云端。",
      "poem-22"
    ],
    [
      "一声已动物皆静，四座无言星欲稀。",
      "poem-23"
    ],
    [
      "晚风吹行舟，花路入溪口。",
      "poem-24"
    ],
    [
      "高卧南斋时，开帷月初吐。",
      "poem-25"
    ],
    [
      "清溪深不测，隐处唯孤云。",
      "poem-26"
    ],
    [
      "浔阳江头夜送客，枫叶荻花秋索索。",
      "poem-27"
    ],
    [
      "松下问童子，言师采药去。",
      "poem-28"
    ],
    [
      "澹然空水对斜晖，曲岛苍茫接翠微。",
      "poem-29"
    ],
    [
      "日光斜照集灵台，红树花迎晓露开。",
      "poem-30"
    ],
    [
      "道人庭宇静，苔色连深竹。",
      "poem-31"
    ],
    [
      "朱雀桥边野草花，乌衣巷口夕阳斜。",
      "poem-32"
    ],
    [
      "谁言寸草心，报得三春晖。",
      "poem-33"
    ],
    [
      "泉壑带茅茨，云霞生薜帷。",
      "poem-34"
    ],
    [
      "去年花里逢君别，今日花开已一年。",
      "poem-35"
    ],
    [
      "四角碍白日，七层摩苍穹。",
      "poem-36"
    ],
    [
      "更深月色半人家，北斗阑干南斗斜。",
      "poem-37"
    ],
    [
      "明月松间照，清泉石上流。",
      "poem-38"
    ],
    [
      "会当凌绝顶，一览众山小。",
      "poem-39"
    ],
    [
      "明月出天山，苍茫云海间。",
      "poem-40"
    ],
    [
      "白日依山尽，黄河入海流。",
      "poem-41"
    ],
    [
      "何当共剪西窗烛，却话巴山夜雨时。",
      "poem-42"
    ],
    [
      "潮平两岸阔，风正一帆悬。",
      "poem-43"
    ],
    [
      "夜深静卧百虫绝，清月出岭光入扉。",
      "poem-44"
    ],
    [
      "天阶夜色凉如水，坐看牵牛织女星。",
      "poem-45"
    ],
    [
      "高树晓还密，远山晴更多。",
      "poem-46"
    ],
    [
      "回乐峰前沙似雪，受降城下月如霜。",
      "poem-47"
    ],
    [
      "雨中黄叶树，灯下白头人。",
      "poem-48"
    ],
    [
      "苍苍竹林寺，杳杳钟声晚。",
      "poem-49"
    ],
    [
      "天边树若荠，江畔舟如月。",
      "poem-50"
    ],
    [
      "黄鹤一去不复返，白云千载空悠悠。",
      "poem-51"
    ],
    [
      "四月南风大麦黄，枣花未落桐阴长。",
      "poem-52"
    ],
    [
      "际夜转西壑，隔山望南斗。",
      "poem-53"
    ],
    [
      "清辉淡水木，演漾在窗户。",
      "poem-54"
    ],
    [
      "松际露微月，清光犹为君。",
      "poem-55"
    ],
    [
      "忽闻水上琵琶声，主人忘归客不发。",
      "poem-56"
    ],
    [
      "只在此山中，云深不知处。",
      "poem-57"
    ],
    [
      "数丛沙草群鸥散，万顷江田一鹭飞。",
      "poem-58"
    ],
    [
      "潮落夜江斜月里，两三星火是瓜州。",
      "poem-59"
    ],
    [
      "日出雾露余，青松如膏沐。",
      "poem-60"
    ],
    [
      "行到中庭数花朵，蜻蜓飞上玉搔头。",
      "poem-61"
    ],
    [
      "竹怜新雨后，山爱夕阳时。",
      "poem-62"
    ],
    [
      "闻道欲来相问讯，西楼望月几回圆。",
      "poem-63"
    ],
    [
      "下窥指高鸟，俯听闻惊风。",
      "poem-64"
    ],
    [
      "今夜偏知春气暖，虫声新透绿窗纱。",
      "poem-65"
    ],
    [
      "大漠孤烟直，长河落日圆。",
      "poem-66"
    ],
    [
      "花隐掖垣暮，啾啾栖鸟过。",
      "poem-67"
    ],
    [
      "长风几万里，吹度玉门关。",
      "poem-68"
    ],
    [
      "黄河远上白云间，一片孤城万仞山。",
      "poem-69"
    ],
    [
      "嵩云秦树久离居，双鲤迢迢一纸书。",
      "poem-70"
    ],
    [
      "纤云四卷天无河，清风吹空月舒波。",
      "poem-71"
    ],
    [
      "繁华事散逐香尘，流水无情草自春。",
      "poem-72"
    ],
    [
      "树色随山迥，河声入海遥。",
      "poem-73"
    ],
    [
      "荷笠带夕阳，青山独归远。",
      "poem-74"
    ],
    [
      "山光忽西落，池月渐东上。",
      "poem-75"
    ],
    [
      "晴川历历汉阳树，春草萋萋鹦鹉洲。",
      "poem-76"
    ],
    [
      "青山朝别暮还见，嘶马出门思旧乡。",
      "poem-77"
    ],
    [
      "潭烟飞溶溶，林月低向后。",
      "poem-78"
    ],
    [
      "千里其如何，微风吹兰杜。",
      "poem-79"
    ],
    [
      "茅亭宿花影，药院滋苔纹。",
      "poem-80"
    ],
    [
      "大弦嘈嘈如急雨，小弦切切如私语。",
      "poem-81"
    ],
    [
      "谁解乘舟寻范蠡，五湖烟水独忘机。",
      "poem-82"
    ],
    [
      "惊风乱颭芙蓉水，密雨斜侵薜荔墙。",
      "poem-83"
    ],
    [
      "闲鹭栖常早，秋花落更迟。",
      "poem-84"
    ],
    [
      "落叶满空山，何处寻行迹。",
      "poem-85"
    ],
    [
      "连山若波涛，奔凑似朝东。",
      "poem-86"
    ],
    [
      "寂寞空庭春欲晚，梨花满地不开门。",
      "poem-87"
    ],
    [
      "君言不得意，归卧南山陲。",
      "poem-88"
    ],
    [
      "星临万户动，月傍九霄多。",
      "poem-89"
    ],
    [
      "云想衣裳花想容，春风拂槛露华浓。",
      "poem-90"
    ],
    [
      "高阁客竟去，小园花乱飞。",
      "poem-91"
    ],
    [
      "湘江好烟月，门系钓鱼船。",
      "poem-92"
    ],
    [
      "老至居人下，春归在客先。",
      "poem-93"
    ],
    [
      "荷风送香气，竹露滴清响。",
      "poem-94"
    ],
    [
      "腹中贮书一万卷，不肯低头在草莽。",
      "poem-95"
    ],
    [
      "野火烧不尽，春风吹又生。",
      "poem-96"
    ],
    [
      "冰簟银床梦不成，碧天如水夜云轻。",
      "poem-97"
    ],
    [
      "闲依农圃邻，偶似山林客。",
      "poem-98"
    ],
    [
      "水月通禅观，鱼龙听梵声。",
      "poem-99"
    ],
    [
      "山空松子落，幽人应未眠。",
      "poem-100"
    ],
    [
      "但去莫复问，白云无尽时。",
      "poem-101"
    ],
    [
      "不寝听金钥，因风想玉珂。",
      "poem-102"
    ],
    [
      "卷帷望月空长叹，美人如花隔云端。",
      "poem-103"
    ],
    [
      "芳心向春尽，所得是沾衣。",
      "poem-104"
    ],
    [
      "白云依静渚，春草闭闲门。",
      "poem-105"
    ],
    [
      "松月生夜凉，风泉满清听。",
      "poem-106"
    ],
    [
      "变调如闻杨柳春，上林繁花照眼新。",
      "poem-107"
    ],
    [
      "雁声远过潇湘去，十二楼中月自明。",
      "poem-108"
    ]
  ],
  "domestic": [
    [
      "学而时习之，不亦说乎？",
      "confucius"
    ],
    [
      "有朋自远方来，不亦乐乎？",
      "confucius"
    ],
    [
      "人不知而不愠，不亦君子乎？",
      "confucius"
    ],
    [
      "学而不思则罔，思而不学则殆。",
      "confucius"
    ],
    [
      "温故而知新，可以为师矣。",
      "confucius"
    ],
    [
      "知之为知之，不知为不知，是知也。",
      "confucius"
    ],
    [
      "三人行，必有我师焉。",
      "confucius"
    ],
    [
      "知之者不如好之者，好之者不如乐之者。",
      "confucius"
    ],
    [
      "己所不欲，勿施于人。",
      "confucius"
    ],
    [
      "君子和而不同，小人同而不和。",
      "confucius"
    ],
    [
      "见贤思齐焉，见不贤而内自省也。",
      "confucius"
    ],
    [
      "君子欲讷于言而敏于行。",
      "confucius"
    ],
    [
      "岁寒，然后知松柏之后凋也。",
      "confucius"
    ],
    [
      "工欲善其事，必先利其器。",
      "confucius"
    ],
    [
      "不患人之不己知，患不知人也。",
      "confucius"
    ],
    [
      "君子求诸己，小人求诸人。",
      "confucius"
    ],
    [
      "过而不改，是谓过矣。",
      "confucius"
    ],
    [
      "不义而富且贵，于我如浮云。",
      "confucius"
    ],
    [
      "天时不如地利，地利不如人和。",
      "mencius"
    ],
    [
      "得道者多助，失道者寡助。",
      "mencius"
    ],
    [
      "富贵不能淫，贫贱不能移，威武不能屈。",
      "mencius"
    ],
    [
      "老吾老，以及人之老；幼吾幼，以及人之幼。",
      "mencius"
    ],
    [
      "穷则独善其身，达则兼善天下。",
      "mencius"
    ],
    [
      "人皆可以为尧舜。",
      "mencius"
    ],
    [
      "君子有终身之忧，无一朝之患也。",
      "mencius"
    ],
    [
      "自暴者，不可与有言也；自弃者，不可与有为也。",
      "mencius"
    ],
    [
      "爱人者，人恒爱之；敬人者，人恒敬之。",
      "mencius"
    ],
    [
      "生于忧患而死于安乐也。",
      "mencius"
    ],
    [
      "尽信书，则不如无书。",
      "mencius"
    ],
    [
      "人之患，在好为人师。",
      "mencius"
    ],
    [
      "学不可以已。",
      "xunzi"
    ],
    [
      "青，取之于蓝而青于蓝；冰，水为之而寒于水。",
      "xunzi"
    ],
    [
      "君子博学而日参省乎己，则知明而行无过矣。",
      "xunzi"
    ],
    [
      "吾尝终日而思矣，不如须臾之所学也。",
      "xunzi"
    ],
    [
      "吾尝跂而望矣，不如登高之博见也。",
      "xunzi"
    ],
    [
      "不积跬步，无以至千里；不积小流，无以成江海。",
      "xunzi"
    ],
    [
      "骐骥一跃，不能十步；驽马十驾，功在不舍。",
      "xunzi"
    ],
    [
      "锲而不舍，金石可镂。",
      "xunzi"
    ],
    [
      "君子生非异也，善假于物也。",
      "xunzi"
    ],
    [
      "上善若水。",
      "laozi"
    ],
    [
      "知人者智，自知者明。",
      "laozi"
    ],
    [
      "胜人者有力，自胜者强。",
      "laozi"
    ],
    [
      "知足者富。",
      "laozi"
    ],
    [
      "大方无隅，大器晚成。",
      "laozi"
    ],
    [
      "大音希声，大象无形。",
      "laozi"
    ],
    [
      "天下难事，必作于易；天下大事，必作于细。",
      "laozi"
    ],
    [
      "合抱之木，生于毫末；九层之台，起于累土。",
      "laozi"
    ],
    [
      "千里之行，始于足下。",
      "laozi"
    ],
    [
      "为学日益，为道日损。",
      "laozi"
    ],
    [
      "知者不言，言者不知。",
      "laozi"
    ],
    [
      "信言不美，美言不信。",
      "laozi"
    ],
    [
      "人若不自向前，师友如何著得力！",
      "zhuxi"
    ],
    [
      "圣人言语，一重又一重，须入深去看。",
      "zhuxi"
    ],
    [
      "人看文字，只看得一重，更不去讨他第二重。",
      "zhuxi"
    ],
    [
      "学者所患，在于轻浮，不沉著痛快。",
      "zhuxi"
    ],
    [
      "读书，须是穷究道理彻底。",
      "zhuxi"
    ],
    [
      "读书以观圣贤之意；因圣贤之意，以观自然之理。",
      "zhuxi"
    ],
    [
      "圣贤之言，须常将来眼头过，口头转，心头运。",
      "zhuxi"
    ],
    [
      "学者读书，须是于无味处当致思焉。",
      "zhuxi"
    ],
    [
      "少看熟读，反复体验，不必想象计获。",
      "zhuxi"
    ],
    [
      "知是行之始，行是知之成。",
      "wang"
    ],
    [
      "知是行的主意，行是知的功夫。",
      "wang"
    ],
    [
      "未有知而不行者。知而不行，只是未知。",
      "wang"
    ],
    [
      "人须在事上磨，方立得住。",
      "wang"
    ],
    [
      "立志用功，如种树然。",
      "wang"
    ],
    [
      "立志贵专一。",
      "wang"
    ],
    [
      "心即理也。天下又有心外之事、心外之理乎？",
      "wang"
    ],
    [
      "凡明不得、行不去，须反在自心上体当，即可通。",
      "wang"
    ],
    [
      "心外无理，心外无事。",
      "wang"
    ],
    [
      "只念念要存天理，即是立志。",
      "wang"
    ],
    [
      "此心无私欲之蔽，即是天理。",
      "wang"
    ],
    [
      "种树者必培其根，种德者必养其心。",
      "wang"
    ],
    [
      "业精于勤，荒于嬉；行成于思，毁于随。",
      "hanyu"
    ],
    [
      "诸生业患不能精，无患有司之不明。",
      "hanyu"
    ],
    [
      "少始知学，勇于敢为。",
      "hanyu"
    ],
    [
      "师者，所以传道受业解惑也。",
      "hanyu2"
    ],
    [
      "人非生而知之者，孰能无惑？",
      "hanyu2"
    ],
    [
      "闻道有先后，术业有专攻，如是而已。",
      "hanyu2"
    ],
    [
      "人生最苦的事，莫苦于身上背着一种未了的责任。",
      "liang"
    ],
    [
      "尽得大的责任，就得大快乐；尽得小的责任，就得小快乐。",
      "liang"
    ],
    [
      "快乐之权，操之在己。",
      "liang"
    ],
    [
      "责任是要解除了才没有，并不是卸了就没有。",
      "liang"
    ],
    [
      "日日在那里尽责任，便日日在那里得苦中真乐。",
      "liang"
    ],
    [
      "大抵天下事，从苦中得来的乐，才算是真乐。",
      "liang"
    ],
    [
      "我确信“敬业乐业”四个字，是人类生活的不二法门。",
      "liang2"
    ],
    [
      "凡职业没有不是神圣的，所以凡职业没有不是可敬的。",
      "liang2"
    ],
    [
      "凡做一件事，便忠于一件事，将全副精力集中到这事上头。",
      "liang2"
    ],
    [
      "因自己的才能、境地，做一种劳作做到圆满，便是天地间第一等人。",
      "liang2"
    ],
    [
      "做工苦，难道不做工就不苦吗？",
      "liang2"
    ],
    [
      "人生能从自己职业中领略出趣味，生活才有价值。",
      "liang2"
    ],
    [
      "希望是本无所谓有，无所谓无的。",
      "luxun"
    ],
    [
      "其实地上本没有路，走的人多了，也便成了路。",
      "luxun"
    ],
    [
      "我只觉得我四面有看不见的高墙，将我隔成孤身，使我非常气闷。",
      "luxun"
    ],
    [
      "希望是在于将来，决不能以我之必无的证明，来折服了他之所谓可有。",
      "luxun2"
    ],
    [
      "凡有一人的主张，得了赞和，是促其前进的，得了反对，是促其奋斗的。",
      "luxun2"
    ],
    [
      "然而几个人既然起来，你不能说决没有毁坏这铁屋的希望。",
      "luxun2"
    ],
    [
      "愿中国青年都摆脱冷气，只是向上走，不必听自暴自弃者流的话。",
      "luxun3"
    ],
    [
      "能做事的做事，能发声的发声。",
      "luxun3"
    ],
    [
      "有一分热，发一分光。",
      "luxun3"
    ],
    [
      "纵令不过一洼浅水，也可以学学大海。",
      "luxun3"
    ],
    [
      "我真爱这一篇好的故事，趁碎影还在，我要追回他，完成他，留下他。",
      "luxun5"
    ],
    [
      "我在朦胧中，看见一个好的故事。",
      "luxun5"
    ],
    [
      "静以修身，俭以养德。",
      "zhuge"
    ],
    [
      "非澹泊无以明志，非宁静无以致远。",
      "zhuge"
    ],
    [
      "非学无以广才，非志无以成学。",
      "zhuge"
    ],
    [
      "清风徐来，水波不兴。",
      "sushi"
    ],
    [
      "取之无禁，用之不竭，是造物者之无尽藏也。",
      "sushi"
    ],
    [
      "逝者如斯，而未尝往也；盈虚者如彼，而卒莫消长也。",
      "sushi"
    ]
  ],
  "foreign": [
    [
      "读书可以怡情，可以修饰谈吐，也可以增长才干。",
      "bacon",
      "Studies serve for delight, for ornament, and for ability."
    ],
    [
      "阅读使人充实，交谈使人敏捷，写作使人严谨。",
      "bacon",
      "Reading maketh a full man; conference a ready man; and writing an exact man."
    ],
    [
      "有些书宜浅尝，有些宜吞读，少数则须咀嚼消化。",
      "bacon",
      "Some books are to be tasted, others to be swallowed, and some few to be chewed and digested"
    ],
    [
      "读书不是为了反驳、盲信或寻找谈资，而是为了权衡与思考。",
      "bacon",
      "not to contradict and confute; nor to believe and take for granted; nor to find talk and discourse; but to weigh and consider."
    ],
    [
      "人群并不等于陪伴。",
      "bacon",
      "a crowd is not company"
    ],
    [
      "报复是一种野蛮的正义。",
      "bacon",
      "Revenge is a kind of wild justice"
    ],
    [
      "聪明的人创造的机会，比发现的更多。",
      "bacon",
      "A wise man will make more opportunities, than he finds."
    ],
    [
      "顺境最能显露恶习，逆境最能显露美德。",
      "bacon",
      "prosperity doth best discover vice, but adversity doth best discover virtue."
    ],
    [
      "本性常被隐藏，有时被克服，却很少被消灭。",
      "bacon",
      "Nature is often hidden; sometimes overcome; seldom extinguished."
    ],
    [
      "相信自己，每颗心都会为这根弦共鸣。",
      "emerson",
      "Trust thyself: every heart vibrates to that iron string."
    ],
    [
      "除了你自己，没有什么能带给你内心的安宁。",
      "emerson",
      "Nothing can bring you peace but yourself."
    ],
    [
      "愚蠢地固守一致，是狭小心灵的怪物。",
      "emerson",
      "A foolish consistency is the hobgoblin of little minds"
    ],
    [
      "若要成为自己，就不能一味随众。",
      "emerson",
      "Whoso would be a man must be a nonconformist."
    ],
    [
      "坚持做自己，不要模仿别人。",
      "emerson",
      "Insist on yourself; never imitate."
    ],
    [
      "最终值得守护的，是你自己心灵的完整。",
      "emerson",
      "Nothing is at last sacred but the integrity of your own mind."
    ],
    [
      "朋友，是一个让我能够坦诚相待的人。",
      "emerson",
      "A friend is a person with whom I may be sincere."
    ],
    [
      "人生是一段进程，而不是一个驻点。",
      "emerson",
      "Man's life is a progress, and not a station."
    ],
    [
      "有朋友停留的屋子，是幸福的屋子。",
      "emerson",
      "Happy is the house that shelters a friend!"
    ],
    [
      "我走进树林，是因为想清醒而认真地生活。",
      "thoreau",
      "I went to the woods because I wished to live deliberately"
    ],
    [
      "生活被琐碎的细节消磨了。",
      "thoreau",
      "Our life is frittered away by detail."
    ],
    [
      "我从未找到比独处更适合相伴的伙伴。",
      "thoreau",
      "I never found the companion that was so companionable as solitude."
    ],
    [
      "比起爱、金钱和名声，请给我真实。",
      "thoreau",
      "Rather than love, than money, than fame, give me truth."
    ],
    [
      "如果有人跟不上同伴，也许只是听见了不同的鼓点。",
      "thoreau",
      "If a man does not keep pace with his companions, perhaps it is because he hears a different drummer."
    ],
    [
      "简化，再简化。",
      "thoreau",
      "Simplify, simplify."
    ],
    [
      "书籍是世界珍藏的财富，是世代与民族应得的遗产。",
      "thoreau",
      "Books are the treasured wealth of the world and the fit inheritance of generations and nations."
    ],
    [
      "善良是唯一永不落空的投资。",
      "thoreau",
      "Goodness is the only investment that never fails."
    ],
    [
      "自然与人生，像各人的性情一样丰富多样。",
      "thoreau",
      "Nature and human life are as various as our several constitutions."
    ],
    [
      "最好的报复，是不变成对方那样的人。",
      "marcus",
      "The best kind of revenge is, not to become like unto them."
    ],
    [
      "我们的生命是一场战役，也是一段旅程。",
      "marcus",
      "Our life is a warfare, and a mere pilgrimage."
    ],
    [
      "人的一生，不过像时间里的一个点。",
      "marcus",
      "The time of a man's life is as a point;"
    ],
    [
      "回到自己心中，让自己重新安静下来。",
      "marcus",
      "Retire into thyself."
    ],
    [
      "把喜悦放在一件接一件友善的行动里。",
      "marcus",
      "Let this be thy only joy, and thy only comfort, from one sociable kind action without intermission to pass unto another"
    ],
    [
      "为什么要让外界发生的事情，如此分散你的心神？",
      "marcus",
      "Why should any of these things that happen externally, so much distract thee?"
    ],
    [
      "困扰人的不是事物本身，而是人对事物的看法。",
      "epictetus",
      "Men are disturbed not by things, but by the views which they take of things."
    ],
    [
      "不要要求事情如你所愿，而要愿事情如其发生。",
      "epictetus",
      "Demand not that events should happen as you wish; but wish them to happen as they do happen"
    ],
    [
      "先为自己定下独处与相处时都能保持的品格。",
      "epictetus",
      "Begin by prescribing to yourself some character and demeanor, such as you may preserve both alone and in company."
    ],
    [
      "每件事都有两把手：一把让人承受，一把却不能。",
      "epictetus",
      "Everything has two handles"
    ],
    [
      "若想有进步，就甘愿在外物上被人看作愚钝。",
      "epictetus",
      "If you would improve, be content to be thought foolish and dull with regard to externals."
    ],
    [
      "当你开始某件事，先想想它的前因与后果。",
      "epictetus",
      "consider what precedes and what follows"
    ],
    [
      "少说话，只说必要的话，而且用简短的语言。",
      "epictetus",
      "Be mostly silent, or speak merely what is needful, and in few words."
    ],
    [
      "不要只谈论原则，而要用行动把它们展示出来。",
      "epictetus",
      "Never proclaim yourself a philosopher, nor make much talk among the ignorant about your principles, but show them by actions."
    ],
    [
      "不必对每一句诋毁都急着辩解。",
      "epictetus",
      "If anyone tells you that a certain person speaks ill of you, do not make excuses about what is said of you"
    ],
    [
      "最要紧的是忠于你自己。",
      "shakespeare",
      "This above all: to thine own self be true"
    ],
    [
      "世间本无绝对的好坏，是思想赋予了它们分别。",
      "shakespeare",
      "there is nothing either good or bad but thinking makes it so."
    ],
    [
      "天地间的事物，比你的哲学所梦想的更多。",
      "shakespeare",
      "There are more things in heaven and earth, Horatio"
    ],
    [
      "简洁是智慧的灵魂。",
      "shakespeare",
      "brevity is the soul of wit"
    ],
    [
      "人是一件多么奇妙的杰作。",
      "shakespeare",
      "What a piece of work is man!"
    ],
    [
      "人知道自己是什么，却不知道自己可能成为什么。",
      "shakespeare",
      "We know what we are, but know not what we may be."
    ],
    [
      "没有什么乐趣能比得上阅读。",
      "austen",
      "there is no enjoyment like reading!"
    ],
    [
      "我对一个人的好感一旦失去，就不会再有。",
      "austen",
      "My good opinion once lost is lost for ever."
    ],
    [
      "虚荣与骄傲是两回事，尽管常被当作同义词。",
      "austen",
      "Vanity and pride are different things"
    ],
    [
      "我的勇气，总在别人试图威吓我时升起。",
      "austen",
      "My courage always rises with every attempt to intimidate me."
    ],
    [
      "想到过去时，只让那些能带来愉悦的回忆留下。",
      "austen",
      "Think only of the past as its remembrance gives you pleasure."
    ],
    [
      "直到这一刻，我才真正认识自己。",
      "austen",
      "Till this moment I never knew myself."
    ],
    [
      "那是最好的时代，也是最坏的时代。",
      "dickens",
      "It was the best of times, it was the worst of times"
    ],
    [
      "那是希望之春，也是绝望之冬。",
      "dickens",
      "it was the spring of hope, it was the winter of despair"
    ],
    [
      "每个人对于别人而言，都是一个深奥的秘密。",
      "dickens",
      "every human creature is constituted to be that profound secret and mystery to every other"
    ],
    [
      "世界的一切伟大与渺小，仿佛都藏在一颗闪烁的星里。",
      "dickens",
      "So does a whole world, with all its greatnesses and littlenesses, lie in a twinkling star."
    ],
    [
      "这是我做过的远比从前更好的事。",
      "dickens",
      "It is a far, far better thing that I do, than I have ever done"
    ],
    [
      "我看见美丽的城与光辉的人们，从深渊中升起。",
      "dickens",
      "I see a beautiful city and a brilliant people rising from this abyss"
    ],
    [
      "幸福的家庭彼此相似，不幸的家庭各有各的不幸。",
      "tolstoy",
      "Happy families are all alike; every unhappy family is unhappy in its own way."
    ],
    [
      "春天是计划与打算的时节。",
      "tolstoy",
      "Spring is the time of plans and projects."
    ],
    [
      "尊重，是为了填补本该有爱的地方而发明的。",
      "tolstoy",
      "Respect was invented to cover the empty place where love should be."
    ],
    [
      "有多少颗心，就有多少种爱。",
      "tolstoy",
      "so many hearts, so many kinds of love"
    ],
    [
      "生活所有的丰富、魅力与美，都由光与影交织而成。",
      "tolstoy",
      "All the variety, all the charm, all the beauty of life is made up of light and shadow."
    ],
    [
      "若总在寻找完美，就永远无法满足。",
      "tolstoy",
      "If you look for perfection, you will never be satisfied."
    ],
    [
      "我想，每个人都应当把热爱生活放在一切之上。",
      "dostoyevsky",
      "I think every one should love life above everything in the world."
    ],
    [
      "真实的爱，比梦中的爱更艰难。",
      "dostoyevsky",
      "Love in action is a harsh and dreadful thing compared with love in dreams."
    ],
    [
      "人活着的秘密，不只是生存，还要有值得活下去的东西。",
      "dostoyevsky",
      "the secret of man's being is not only to live but to have something to live for"
    ],
    [
      "最重要的是，不要对自己说谎。",
      "dostoyevsky",
      "Above all, don’t lie to yourself."
    ],
    [
      "童年保存下来的一份美好记忆，也许就是最好的教育。",
      "dostoyevsky",
      "some good, sacred memory, preserved from childhood, is perhaps the best education."
    ],
    [
      "爱上帝创造的万物，乃至其中的每一粒沙。",
      "dostoyevsky",
      "Love all God’s creation, the whole and every grain of sand in it."
    ],
    [
      "工作，是看得见的爱。",
      "gibran",
      "Work is love made visible."
    ],
    [
      "在亲密之中，也要给彼此留些空间。",
      "gibran",
      "Let there be spaces in your togetherness"
    ],
    [
      "爱彼此，但不要把爱变成束缚。",
      "gibran",
      "Love one another, but make not a bond of love"
    ],
    [
      "你给出的若只是财物，那还只是很少的一部分。",
      "gibran",
      "You give but little when you give of your possessions."
    ],
    [
      "真正的给予，是把自己也献出来。",
      "gibran",
      "It is when you give of yourself that you truly give."
    ],
    [
      "你的快乐，是揭下面具的悲伤。",
      "gibran",
      "Your joy is your sorrow unmasked."
    ],
    [
      "在友谊的甜美中，让欢笑与快乐彼此分享。",
      "gibran",
      "And in the sweetness of friendship let there be laughter, and sharing of pleasures."
    ],
    [
      "把你最好的部分留给朋友。",
      "gibran",
      "And let your best be for your friend."
    ],
    [
      "愿友谊不为别的目的，只为心灵更加深厚。",
      "gibran",
      "And let there be no purpose in friendship save the deepening of the spirit."
    ],
    [
      "艺术家是美好事物的创造者。",
      "wilde",
      "The artist is the creator of beautiful things."
    ],
    [
      "揭示艺术而隐藏艺术家，是艺术的目的。",
      "wilde",
      "To reveal art and conceal the artist is art’s aim."
    ],
    [
      "那些在美好事物里找到美好意义的人，才是有修养的人。",
      "wilde",
      "Those who find beautiful meanings in beautiful things are the cultivated."
    ],
    [
      "经验，只是人人给自己的错误取的名字。",
      "wilde",
      "Experience was of no ethical value. It was merely the name men gave to their mistakes."
    ],
    [
      "我们每个人，心里都同时装着天堂与地狱。",
      "wilde",
      "Each of us has Heaven and Hell in him"
    ],
    [
      "如今人们知道一切事物的价格，却不知道它们的价值。",
      "wilde",
      "Nowadays people know the price of everything and the value of nothing."
    ],
    [
      "比被人议论更糟的，是根本无人谈起。",
      "wilde",
      "There is only one thing in the world worse than being talked about, and that is not being talked about."
    ],
    [
      "世人所谓不道德的书，正是让他们看见自己羞耻的书。",
      "wilde",
      "The books that the world calls immoral are books that show the world its own shame."
    ],
    [
      "一切艺术，都不以实用为目的。",
      "wilde",
      "All art is quite useless."
    ],
    [
      "花费应当有益于别人或自己；不要浪费。",
      "franklin",
      "Make no expense but to do good to others or yourself; i.e., waste nothing."
    ],
    [
      "人的幸福，更多来自每天的小便利，而非偶尔降临的巨大好运。",
      "franklin",
      "Human felicity is produc'd not so much by great pieces of good fortune that seldom happen, as by little advantages that occur every day."
    ],
    [
      "不要把有用的时间浪费在无谓的事情上。",
      "franklin",
      "Lose no time; be always employ’d in something useful; cut off all unnecessary actions."
    ],
    [
      "先下定决心做该做的事，再坚持完成所决定的事。",
      "franklin",
      "Resolve to perform what you ought; perform without fail what you resolve."
    ],
    [
      "不要因为小事或不可避免的意外而烦乱。",
      "franklin",
      "Be not disturbed at trifles, or at accidents common or unavoidable."
    ],
    [
      "不做伤害别人的事，也不忽略自己应尽的善意。",
      "franklin",
      "Wrong none by doing injuries, or omitting the benefits that are your duty."
    ],
    [
      "只说有益于别人或自己的话。",
      "franklin",
      "Speak not but what may benefit others or yourself; avoid trifling conversation."
    ],
    [
      "让物各有其位，让事各有其时。",
      "franklin",
      "Let all your things have their places; let each part of your business have its time."
    ],
    [
      "不以欺骗伤人；思考要正直，说话也应如此。",
      "franklin",
      "Use no hurtful deceit; think innocently and justly, and, if you speak, speak accordingly."
    ],
    [
      "我研究自己，比研究其他任何事物更多。",
      "montaigne",
      "I study myself more than any other subject."
    ],
    [
      "世界不过是一所不断探问的学校。",
      "montaigne",
      "The world is but a school of inquisition"
    ],
    [
      "生命本身无所谓善恶，它是由我们塑造的善恶的舞台。",
      "montaigne",
      "Life in itself is neither good nor evil; it is the scene of good or evil as you make it."
    ],
    [
      "世上最伟大的事，是懂得属于自己。",
      "montaigne",
      "The greatest thing in the world is for a man to know that he is his own."
    ],
    [
      "我所知道的，只是我什么也不知道。",
      "montaigne",
      "What do I know?"
    ],
    [
      "旅行时，我习惯从交谈的人那里学一点东西。",
      "montaigne",
      "I observe in my travels this custom, ever to learn something from the information of those with whom I confer"
    ],
    [
      "我说真话，不是说到我所希望的程度，而是说到我所敢的程度。",
      "montaigne",
      "I speak truth, not so much as I would, but as much as I dare"
    ],
    [
      "只靠背诵，并不算真正的知识。",
      "montaigne",
      "To know by rote, is no knowledge"
    ],
    [
      "人可以凭别人的学问增长知识，却只能凭自己的智慧变得明智。",
      "montaigne",
      "a man can never be wise but by his own wisdom"
    ]
  ]
};
  /* QUOTE_CATALOG_END */
  const categoryNames={original:'小站原创',poetry:'古诗词',domestic:'国内名言',foreign:'国外名言'};
  const groups=Object.fromEntries(Object.entries(catalog).map(([category,rows])=>[category,rows.map(([text,sourceId])=>{const source=sources[sourceId];return {text,category,url:source.url,attribution:category==='original'?'小站手记 · 原创':source.author+' ·《'+source.work+'》'+(category==='foreign'?'（译意）':'')};})]));
  // 每十句恰好 1 条原创、3 条诗词、3 条国内名言、3 条国外名言。
  const sequence=['original','poetry','domestic','foreign','poetry','foreign','domestic','poetry','domestic','foreign'];
  const used={original:0,poetry:0,domestic:0,foreign:0},quotes=[];
  for(let i=0;i<36;i++)for(const category of sequence)quotes.push(groups[category][used[category]++]);
  let timer, selectedDay = null, offset = 0;
  function render() {
    clearTimeout(timer);
    const quote = document.querySelector('[data-daily-quote]');
    const attribution = document.querySelector('[data-daily-attribution]');
    if (!quote) return;
    const now = new Date();
    const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
    if (selectedDay !== day) { selectedDay = day; offset = 0; }
    const entry = quotes[(((day + offset) % quotes.length) + quotes.length) % quotes.length];
    quote.textContent = entry.text;
    quote.dataset.quoteCategory=entry.category;
    if (attribution) {
      attribution.textContent = entry.attribution;
      attribution.title=categoryNames[entry.category];
      if(entry.url){attribution.href=entry.url;attribution.target='_blank';attribution.rel='noopener noreferrer';attribution.setAttribute('aria-label',entry.attribution+'，查看原文来源');}
      else {attribution.removeAttribute('href');attribution.removeAttribute('target');attribution.removeAttribute('rel');attribution.removeAttribute('aria-label');}
    }
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    timer = setTimeout(render, next - now + 100);
  }
  function initMoment() {
    const card = document.querySelector('[data-sidebar-moment]');
    if (!card || card.dataset.momentReady) return;
    const tabs = card.querySelector('[data-moment-tabs]');
    const buttons = [...card.querySelectorAll('[data-moment-tab]')];
    const panels = [...card.querySelectorAll('[data-moment-panel]')];
    if (!tabs || !buttons.length) return;
    card.dataset.momentReady = 'true';
    tabs.hidden = false;
    const next = card.querySelector('[data-daily-next]');
    if (next) { next.hidden = false; next.addEventListener('click', () => { offset = (offset + 1) % quotes.length; render(); }); }
    buttons.forEach(button => button.addEventListener('click', () => {
      const selected = button.dataset.momentTab;
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      panels.forEach(panel => { panel.hidden = panel.dataset.momentPanel !== selected; });
    }));
  }
  function initPage() { render(); initMoment(); }
  initPage();
  document.addEventListener('flyfish:page', initPage);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
})();
