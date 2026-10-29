(() => {
  'use strict';
  function init() {
  const root = document.querySelector('[data-toolbox]');
  if (!root || root.dataset.toolboxReady) return;
  root.dataset.toolboxReady = 'true';
  const input = root.querySelector('[data-tool-input]'), output = root.querySelector('[data-tool-output]'), status = root.querySelector('[data-tool-status]');
  const title = root.querySelector('[data-tool-title]'), description = root.querySelector('[data-tool-description]'), label = root.querySelector('[data-tool-input-label]');
  const primary = root.querySelector('[data-tool-action="primary"]'), secondary = root.querySelector('[data-tool-action="secondary"]'), now = root.querySelector('[data-tool-now]');
  const configs = {
    json: ['JSON 格式化', '粘贴 JSON，一键整理或压缩。', '例如 {"hello":"world"}', '格式化', '压缩'],
    url: ['URL 编解码', '转换单个链接参数中的特殊字符。', '输入需要处理的文本', '编码', '解码'],
    base64: ['Base64 编解码', '将 UTF-8 文本与 Base64 相互转换。', '输入文本或 Base64', '编码', '解码'],
    time: ['时间戳转换', '支持秒或毫秒时间戳，以及可识别的日期时间。', '例如 1700000000 或 2023-11-15 10:00:00', '时间戳 → 日期', '日期 → 时间戳']
  };
  const workspace = root.querySelector('[data-tool-workspace]');
  let active = 'json';
  function selectTool(key) {
    active = key; const config = configs[key];
    workspace.hidden = false;
    root.querySelectorAll('[data-tool]').forEach(button => button.setAttribute('aria-expanded', String(button.dataset.tool === key)));
    title.textContent = config[0]; description.textContent = config[1]; input.placeholder = config[2]; primary.textContent = config[3]; secondary.textContent = config[4]; now.hidden = key !== 'time';
    label.textContent = key === 'time' ? '时间戳或日期' : '输入内容'; input.value = ''; output.value = ''; status.textContent = '';
    title.focus({preventScroll:true}); workspace.scrollIntoView({behavior:'auto',block:'nearest'});
  }
  root.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => selectTool(button.dataset.tool)));
  root.querySelector('[data-tool-close]').addEventListener('click', () => { workspace.hidden = true; root.querySelectorAll('[data-tool]').forEach(button => button.setAttribute('aria-expanded', 'false')); Array.from(root.querySelectorAll('[data-tool]')).find(button => button.dataset.tool === active)?.focus(); });
  function convert(action) {
    const value = input.value;
    if (!value.trim()) { status.textContent = '请先输入内容。'; output.value = ''; return; }
    try {
      let result;
      if (active === 'json') result = JSON.stringify(JSON.parse(value), null, action === 'primary' ? 2 : 0);
      if (active === 'url') result = action === 'primary' ? encodeURIComponent(value) : decodeURIComponent(value);
      if (active === 'base64') {
        if (action === 'primary') { const bytes = new TextEncoder().encode(value); let binary = ''; bytes.forEach(byte => { binary += String.fromCharCode(byte); }); result = btoa(binary); }
        else { const text = value.replace(/\s/g, ''); if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(text)) throw new Error('Base64 格式不正确'); const binary = atob(text); result = new TextDecoder('utf-8', {fatal: true}).decode(Uint8Array.from(binary, char => char.charCodeAt(0))); }
      }
      if (active === 'time') {
        if (action === 'primary') { const raw = value.trim(); if (!/^-?\d+(?:\.\d+)?$/.test(raw)) throw new Error('请输入数字时间戳'); const number = Number(raw), date = new Date(Math.abs(number) < 1e11 ? number * 1000 : number); if (Number.isNaN(date.getTime())) throw new Error('时间戳超出范围'); result = `${date.toLocaleString('zh-CN', {hour12: false})}（本地时间）\n${date.toISOString()}（UTC）`; }
        else { const raw = value.trim(); const date = new Date(/^\d{4}-\d\d-\d\d \d\d:\d\d(?::\d\d)?$/.test(raw) ? raw.replace(' ', 'T') : raw); if (Number.isNaN(date.getTime())) throw new Error('日期格式无法识别'); result = `秒：${Math.floor(date.getTime() / 1000)}\n毫秒：${date.getTime()}`; }
      }
      output.value = result; status.textContent = '完成。';
    } catch (error) { output.value = ''; status.textContent = `转换失败：${error.message || '请检查输入内容'}`; }
  }
  primary.addEventListener('click', () => convert('primary')); secondary.addEventListener('click', () => convert('secondary'));
  now.addEventListener('click', () => { input.value = String(Math.floor(Date.now() / 1000)); convert('primary'); });
  root.querySelector('[data-tool-clear]').addEventListener('click', () => { input.value = ''; output.value = ''; status.textContent = ''; input.focus(); });
  root.querySelector('[data-tool-copy]').addEventListener('click', async () => { if (!output.value) { status.textContent = '还没有可复制的结果。'; return; } try { await navigator.clipboard.writeText(output.value); status.textContent = '已复制结果。'; } catch { output.focus(); output.select(); status.textContent = '请手动复制选中的结果。'; } });
  }
  init();
  document.addEventListener('flyfish:page', init);
})();
