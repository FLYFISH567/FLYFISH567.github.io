(() => {
  'use strict';
  function init() {
    const root = document.querySelector('[data-shelf]');
    if (!root || root.dataset.shelfReady) return;
    root.dataset.shelfReady = 'true';
    const links = [...root.querySelectorAll('[data-shelf-filter]')];
    const panels = [...root.querySelectorAll('[data-shelf-section]')];
    function select(id, updateUrl) {
      if (!panels.some(panel => panel.dataset.shelfSection === id)) return;
      links.forEach(link => { if (link.dataset.shelfFilter === id) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
      panels.forEach(panel => { panel.hidden = panel.dataset.shelfSection !== id; });
      if (updateUrl) { const url = new URL(location.href); url.hash = id; history.replaceState(history.state, '', url.href); }
    }
    links.forEach(link => link.addEventListener('click', event => { if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return; event.preventDefault(); select(link.dataset.shelfFilter, true); }));
    select(location.hash === '#books' ? 'books' : 'films', false);
  }
  init();
  document.addEventListener('flyfish:page', init);
  window.addEventListener('hashchange', () => { const root = document.querySelector('[data-shelf]'); const link = root?.querySelector(`[data-shelf-filter="${location.hash === '#books' ? 'books' : 'films'}"]`); link?.click(); });
})();
