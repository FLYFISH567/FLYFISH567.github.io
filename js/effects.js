(() => {
  'use strict';
  const root=document.documentElement,key='flyfish-effects-tier',allowed=['light','standard','lively'];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let tier=allowed.includes(root.dataset.effects)?root.dataset.effects:'standard';
  try{const stored=localStorage.getItem(key);if(allowed.includes(stored))tier=stored;}catch{}
  const labels={light:'轻量',standard:'标准',lively:'活泼'};
  function apply(next,save=false){
    if(!allowed.includes(next))return;tier=next;root.dataset.effects=tier;
    if(save)try{localStorage.setItem(key,tier);}catch{}
    for(const button of document.querySelectorAll('[data-effects-tier]'))button.setAttribute('aria-pressed',String(button.dataset.effectsTier===tier));
    const note=document.querySelector('[data-effects-note]');
    if(note)note.textContent=reduced.matches?'系统已减少动态效果，装饰动画暂停；档位偏好会保留。':tier==='light'?'关闭水波、漂浮和视差；小鱼慢游，自动模式最多 2 条。手动数量独立设置。':tier==='standard'?'保留点击水波和轻微反馈；自动模式最多 6 条小鱼。手动数量独立设置。':'开启水波尾迹与移动光点，小鱼稍快；自动模式最多 9 条。手动数量独立设置。';
    const label=document.querySelector('[data-effects-label]');if(label)label.textContent=labels[tier];
    document.dispatchEvent(new CustomEvent('flyfish:effectschange',{detail:{tier,reduced:reduced.matches}}));
  }
  document.querySelectorAll('[data-effects-tier]').forEach(button=>button.addEventListener('click',()=>apply(button.dataset.effectsTier,true)));
  const settings=document.querySelector('[data-effects-settings]');
  document.addEventListener('pointerdown',event=>{if(settings?.open&&!settings.contains(event.target))settings.open=false;},{passive:true});
  settings?.addEventListener('keydown',event=>{if(event.key==='Escape'){settings.open=false;settings.querySelector('summary').focus();}});
  window.addEventListener('storage',event=>{if(event.key===key)apply(allowed.includes(event.newValue)?event.newValue:'standard');});
  reduced.addEventListener('change',()=>apply(tier));
  apply(tier);
})();
