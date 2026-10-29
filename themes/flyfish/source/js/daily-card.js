(() => {
  'use strict';
  const quotes = [
    '慢慢来，生活自有它的节奏。',
    '今天也可以从一件小事开始。',
    '把好奇心装进口袋，再出发。',
    '偶尔绕路，也会遇见新的风景。',
    '愿你有勇气认真，也有时间发呆。',
    '给自己一点耐心，答案会慢慢浮现。',
    '不用急着发光，先自在地生长。',
    '今天的云，也许正在为你路过。',
    '把平凡的一天，过成喜欢的样子。',
    '累了就歇一歇，海浪也有退潮的时候。',
    '允许生活留白，灵感才有地方停靠。',
    '每一次出发，都算数。'
  ];
  let timer;
  function render() {
    clearTimeout(timer);
    const quote = document.querySelector('[data-daily-quote]');
    const date = document.querySelector('[data-daily-date]');
    if (!quote || !date) return;
    const now = new Date();
    const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
    quote.textContent = quotes[((day % quotes.length) + quotes.length) % quotes.length];
    date.dateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    date.textContent = `${now.getMonth() + 1} / ${now.getDate()}`;
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    timer = setTimeout(render, next - now + 100);
  }
  render();
  document.addEventListener('flyfish:page', render);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
})();
