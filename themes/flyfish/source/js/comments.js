(() => {
  'use strict';
  const origin = 'https://giscus.app';
  let host, script, observer, loading = false, started = false, frameLoaded = false, loadTimer;
  const currentPanel = () => document.querySelector('[data-comments]');
  const frame = () => host?.querySelector('iframe.giscus-frame');
  const theme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  const term = () => currentPanel()?.dataset.commentsTerm || '';
  function backLink() { const url = new URL(location.href); url.searchParams.delete('giscus'); url.hash = ''; return url.toString(); }
  function status(message, retry = false) { const panel = currentPanel(); if (!panel) return; panel.querySelector('[data-comments-status]').textContent = message; panel.querySelector('[data-comments-retry]').hidden = !retry; }
  function configure() { if (!frameLoaded) return; frame()?.contentWindow?.postMessage({giscus:{setConfig:{term:term(),backLink:backLink(),theme:theme()}}}, origin); }
  function retarget() {
    const current = frame(); if (!current || !currentPanel()) return;
    const url = new URL(current.src); const backlink = backLink();
    if (url.searchParams.get('term') !== term() || url.searchParams.get('backLink') !== backlink) {
      frameLoaded = false; url.searchParams.set('term', term()); url.searchParams.set('backLink', backlink); url.searchParams.set('origin', backlink); current.src = url.toString();
    } else configure();
  }
  function fail() { clearTimeout(loadTimer); if (!started) script?.remove(); loading = false; status('评论暂时无法加载，请稍后重试，或前往 GitHub Discussions。', true); }
  function begin() {
    const panel = currentPanel(); if (!panel) return;
    if (started && frame()) { frameLoaded = false; frame().src = frame().src; status('正在重新加载评论…'); return; }
    if (loading) return;
    loading = true; status('正在载入评论…');
    host ||= document.createElement('div'); host.className = 'giscus'; host.hidden = false;
    panel.querySelector('[data-comments-mount]').appendChild(host);
    script = document.createElement('script'); script.src = origin + '/client.js'; script.async = true; script.crossOrigin = 'anonymous';
    Object.assign(script.dataset, {repo:'FLYFISH567/FLYFISH567.github.io',repoId:'R_kgDOOvKwMA',category:'Announcements',categoryId:'DIC_kwDOOvKwMM4DJ7Fm',mapping:'specific',term:term(),strict:'1',reactionsEnabled:'1',emitMetadata:'0',inputPosition:'bottom',theme:theme(),lang:'zh-CN'});
    script.onload = () => { clearTimeout(loadTimer); loading = false; started = true; if (frame()) { frame().addEventListener('load', () => { frameLoaded = true; status(''); configure(); }); status(''); retarget(); } else fail(); };
    script.onerror = fail;
    host.appendChild(script); loadTimer = setTimeout(() => { if (loading) fail(); }, 15000);
  }
  function init() {
    observer?.disconnect(); const panel = currentPanel(); if (!panel) return;
    panel.querySelector('[data-comments-retry]').addEventListener('click', begin, {once: false});
    if (host) { host.hidden = false; panel.querySelector('[data-comments-mount]').appendChild(host); if (frame()) { status('正在载入评论…'); retarget(); return; } }
    if (new URL(location.href).searchParams.has('giscus')) { begin(); return; }
    if ('IntersectionObserver' in window) { observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); begin(); } }, {rootMargin:'300px'}); observer.observe(panel); }
    else begin();
  }
  document.addEventListener('flyfish:before-page', () => { frameLoaded = false; observer?.disconnect(); if (host) { host.hidden = true; document.body.appendChild(host); } });
  document.addEventListener('flyfish:page', init);
  window.addEventListener('message', event => { if (event.origin !== origin || event.source !== frame()?.contentWindow || !event.data?.giscus) return; const error = event.data.giscus.error; if (error && !error.includes('Discussion not found')) fail(); });
  new MutationObserver(configure).observe(document.documentElement, {attributes:true,attributeFilter:['data-theme']});
  init();
})();
