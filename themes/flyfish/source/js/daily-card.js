(() => {
  'use strict';
  // 中文古诗摘录，括号中的链接指向可核对的原作。增删时保留文字、作者和作品名。
  const classics = [
    ['行到水穷处，坐看云起时。', '王维 ·《终南别业》'], // https://zh.wikisource.org/wiki/終南別業
    ['海上生明月，天涯共此时。', '张九龄 ·《望月怀远》'], // https://zh.wikisource.org/wiki/望月懷遠
    ['随风潜入夜，润物细无声。', '杜甫 ·《春夜喜雨》'], // https://zh.wikisource.org/wiki/春夜喜雨
    ['长风破浪会有时，直挂云帆济沧海。', '李白 ·《行路难》'], // https://zh.wikisource.org/wiki/行路難_(李白)
    ['明月松间照，清泉石上流。', '王维 ·《山居秋暝》'], // https://zh.wikisource.org/wiki/山居秋暝
    ['山重水复疑无路，柳暗花明又一村。', '陆游 ·《游山西村》'], // https://zh.wikisource.org/wiki/御選唐宋詩醇_(四庫全書本)/卷42
    ['会当凌绝顶，一览众山小。', '杜甫 ·《望岳》'], // https://zh.wikisource.org/wiki/全唐詩/卷216
    ['竹杖芒鞋轻胜马，谁怕？', '苏轼 ·《定风波》'], // https://zh.wikisource.org/wiki/定風波_(蘇軾)
    ['欲穷千里目，更上一层楼。', '王之涣 ·《登鹳雀楼》'], // https://zh.wikisource.org/wiki/欽定古今圖書集成/方輿彙編/職方典/第0328卷
    ['采菊东篱下，悠然见南山。', '陶渊明 ·《饮酒·其五》'], // https://zh.wikisource.org/wiki/夢溪筆談/續筆談
    ['大漠孤烟直，长河落日圆。', '王维 ·《使至塞上》'], // https://zh.wikisource.org/wiki/古今詩刪_(四庫全書本)/卷14
    ['等闲识得东风面，万紫千红总是春。', '朱熹 ·《春日》'] // https://zh.wikisource.org/wiki/春日_(朱熹)
  ];
  // 以下为根据公版英文原作写的译意，并非引用某一现成译本。
  const world = [
    ['冬天来了，春天还会远吗？', '雪莱 ·《西风颂》（译意）'], // https://www.gutenberg.org/cache/epub/4798/pg4798.html
    ['希望像一只有羽毛的鸟，栖息在心灵里。', '艾米莉·狄金森 ·《希望》（译意）'], // https://www.gutenberg.org/cache/epub/2679/pg2679.html
    ['去奋斗，去寻找，去发现，而不屈服。', '丁尼生 ·《尤利西斯》（译意）'], // https://www.gutenberg.org/cache/epub/8601/pg8601.html
    ['没有什么魅力能胜过一颗温柔的心。', '简·奥斯汀 ·《爱玛》（译意）'], // https://www.gutenberg.org/cache/epub/158/pg158-images.html
    ['我们由梦的材料织成。', '莎士比亚 ·《暴风雨》（译意）'], // https://www.gutenberg.org/files/47518/47518-h/47518-h.htm
    ['世界有那么多事物，足够让我们快乐。', '史蒂文森 ·《快乐的想法》（译意）'] // https://www.gutenberg.org/files/79196/79196-h/79196-h.htm
  ];
  const notes = [
    '慢慢来，生活自有它的节奏。', '今天也可以从一件小事开始。', '把好奇心装进口袋，再出发。',
    '偶尔绕路，也会遇见新的风景。', '愿你有勇气认真，也有时间发呆。', '给自己一点耐心，答案会慢慢浮现。',
    '不用急着发光，先自在地生长。', '今天的云，也许正在为你路过。', '把平凡的一天，过成喜欢的样子。',
    '累了就歇一歇，海浪也有退潮的时候。', '允许生活留白，灵感才有地方停靠。', '每一次出发，都算数。',
    '给忙碌按下暂停，听听窗外的声音。', '把喜欢的歌留给今天的路。', '小小的进步，也值得被记住。',
    '不妨抬头，看看天空换了什么颜色。', '让好奇带路，也让自己偶尔迷路。', '今天的故事，可以从一个微笑开始。'
  ];
  // 六天一组穿插不同题材，减少连续多天风格相同；日期按访客本地日历计算。
  const quotes = [];
  const groups = {notes: notes.map(text => [text, '小站手记 · 原创']), classics: classics.slice(), world: world.slice()};
  const pattern = ['notes', 'classics', 'notes', 'world', 'notes', 'classics'];
  while (groups.notes.length || groups.classics.length || groups.world.length) {
    for (const name of pattern) if (groups[name].length) quotes.push(groups[name].shift());
  }
  let timer;
  function render() {
    clearTimeout(timer);
    const quote = document.querySelector('[data-daily-quote]');
    const attribution = document.querySelector('[data-daily-attribution]');
    const date = document.querySelector('[data-daily-date]');
    if (!quote || !date) return;
    const now = new Date();
    const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
    const entry = quotes[((day % quotes.length) + quotes.length) % quotes.length];
    quote.textContent = entry[0];
    if (attribution) attribution.textContent = entry[1];
    date.dateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    date.textContent = `${now.getMonth() + 1} / ${now.getDate()}`;
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
