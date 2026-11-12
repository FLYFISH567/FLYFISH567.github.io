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
    time: ['时间戳转换', '支持秒或毫秒时间戳。日期时间可加 Z 或 +08:00，省略时区时使用本地时间。', '例如 1700000000 或 2026-11-12 10:00:00+08:00', '时间戳 → 日期', '日期 → 时间戳']
  };
  const workspace = root.querySelector('[data-tool-workspace]');
  const drafts = new Map();
  let active;
  function selectTool(key) {
    if (active) drafts.set(active, {input: input.value, output: output.value});
    active = key; const config = configs[key];
    const draft = drafts.get(key);
    workspace.hidden = false;
    root.querySelectorAll('[data-tool]').forEach(button => button.setAttribute('aria-expanded', String(button.dataset.tool === key)));
    title.textContent = config[0]; description.textContent = config[1]; input.placeholder = config[2]; primary.textContent = config[3]; secondary.textContent = config[4]; now.hidden = key !== 'time';
    label.textContent = key === 'time' ? '时间戳或日期' : '输入内容';
    input.value = draft?.input ?? ''; output.value = draft?.output ?? ''; status.textContent = '';
    title.focus({preventScroll:true}); workspace.scrollIntoView({behavior:'auto',block:'nearest'});
  }
  root.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => selectTool(button.dataset.tool)));
  root.querySelector('[data-tool-close]').addEventListener('click', () => { workspace.hidden = true; root.querySelectorAll('[data-tool]').forEach(button => button.setAttribute('aria-expanded', 'false')); Array.from(root.querySelectorAll('[data-tool]')).find(button => button.dataset.tool === active)?.focus(); });
  function parseDate(raw) {
    const parts = /^(\d{4})([-/])(\d{2})\2(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(\.\d{1,3})?)?\s*(Z|[+-]\d{2}:?\d{2})?)?$/i.exec(raw);
    if (!parts) throw new Error('请使用 YYYY-MM-DD 或 YYYY-MM-DD HH:mm[:ss] 格式');
    const [, year, , month, day, hour = '00', minute = '00', second = '00', fraction = '', zone = ''] = parts;
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const monthLength = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][Number(month) - 1];
    if (!monthLength || Number(day) < 1 || Number(day) > monthLength || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) {
      throw new Error('日期或时间不存在');
    }
    const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}${fraction}${zone.toUpperCase()}`);
    if (Number.isNaN(date.getTime())) throw new Error('日期或时区格式不正确');
    if (!zone && (date.getDate() !== Number(day) || date.getHours() !== Number(hour) || date.getMinutes() !== Number(minute))) {
      throw new Error('此时间在本地时区不存在，请注明时区');
    }
    return date;
  }
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
        else { const date = parseDate(value.trim()); result = `秒：${Math.floor(date.getTime() / 1000)}\n毫秒：${date.getTime()}`; }
      }
      output.value = result; status.textContent = '完成。';
    } catch (error) { output.value = ''; status.textContent = `转换失败：${error.message || '请检查输入内容'}`; }
  }
  primary.addEventListener('click', () => convert('primary')); secondary.addEventListener('click', () => convert('secondary'));
  now.addEventListener('click', () => { input.value = String(Math.floor(Date.now() / 1000)); convert('primary'); });
  root.querySelector('[data-tool-clear]').addEventListener('click', () => { input.value = ''; output.value = ''; status.textContent = ''; input.focus(); });
  root.querySelector('[data-tool-copy]').addEventListener('click', async () => {
    const value = output.value, tool = active;
    if (!value) { status.textContent = '还没有可复制的结果。'; return; }
    try {
      await navigator.clipboard.writeText(value);
      if (active === tool && output.value === value && !workspace.hidden) status.textContent = '已复制结果。';
    } catch {
      if (active !== tool || output.value !== value || workspace.hidden) return;
      output.focus(); output.select(); status.textContent = '请手动复制选中的结果。';
    }
  });
  }
  init();
  document.addEventListener('flyfish:page', init);
})();
