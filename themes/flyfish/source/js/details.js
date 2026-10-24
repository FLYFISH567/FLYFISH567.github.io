(() => {
  'use strict';
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const targets='.button,.text-button,.album-filters button,.watch-tabs button,.theme-toggle';
  function ripple(event,keyboard=false){
    if(reduced.matches||root.dataset.effects==='light'||(!keyboard&&event.button!==0))return;
    const host=event.target.closest(targets);
    if(!host||host.disabled)return;
    host.querySelector('.click-ripple')?.remove();
    const rect=host.getBoundingClientRect(),diameter=Math.hypot(rect.width,rect.height)*2;
    if(!diameter)return;
    const wave=document.createElement('span');
    wave.className='click-ripple';wave.setAttribute('aria-hidden','true');
    Object.assign(wave.style,{width:`${diameter}px`,height:`${diameter}px`,left:`${(keyboard?rect.width/2:event.clientX-rect.left)-diameter/2}px`,top:`${(keyboard?rect.height/2:event.clientY-rect.top)-diameter/2}px`});
    host.classList.add('ripple-host');host.append(wave);
    // 即使偏好中途切换而取消 CSS 动画，也会清理临时节点。
    setTimeout(()=>wave.remove(),550);
  }
  document.addEventListener('pointerdown',event=>ripple(event));
  document.addEventListener('click',event=>{if(event.detail===0)ripple(event,true);});
  function syncVisibility(){
    root.classList.toggle('motion-paused',document.hidden);
  }
  syncVisibility();
  document.addEventListener('visibilitychange',syncVisibility);
  reduced.addEventListener('change',()=>{if(reduced.matches)document.querySelectorAll('.click-ripple').forEach(node=>node.remove());});
})();
