(() => {
  'use strict';
  let cleanup=()=>{};
  function initialize(){cleanup();
  const nav=document.querySelector('.life-nav');
  if(!nav)return;
  const lifecycle=new AbortController();let disposed=false,resizeObserver;
  const links=Array.from(nav.querySelectorAll('a'));
  const active=nav.querySelector('[aria-current="page"]');
  if(!active)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const key='flyfish-life-tab',duration=300;
  let previous=null,animation,placed='';
  // 只接续本标签页刚刚发生的栏目切换，不拦截链接或等待动画结束。
  try{
    previous=JSON.parse(sessionStorage.getItem(key)||'null');
    sessionStorage.removeItem(key);
  }catch{}
  const indicator=document.createElement('span');
  indicator.className='life-nav-indicator';
  indicator.setAttribute('aria-hidden','true');
  nav.prepend(indicator);
  function frame(link){
    const rect=link.getBoundingClientRect(),origin=nav.getBoundingClientRect();
    return {transform:`translate(${rect.left-origin.left}px,${rect.top-origin.top}px)`,width:`${rect.width}px`,height:`${rect.height}px`};
  }
  function place(){
    if(disposed)return;
    const next=frame(active);
    const signature=JSON.stringify(next);
    if(signature===placed)return;
    placed=signature;
    animation?.cancel();
    Object.assign(indicator.style,next);
  }
  place();nav.classList.add('has-tab-indicator');
  const from=links.find(link=>link.pathname===previous?.tab);
  const age=Date.now()-previous?.time;
  if(!reduced.matches && document.documentElement.dataset.effects!=='light' && indicator.animate && from && from!==active &&
    previous.to===location.pathname && age>=0 && age<4000 &&
    performance.getEntriesByType('navigation')[0]?.type==='navigate'){
    animation=indicator.animate([frame(from),frame(active)],{duration,easing:'cubic-bezier(.2,.7,.3,1)'});
  }
  nav.addEventListener('click',event=>{
    const link=event.target.closest('a');
    if(!links.includes(link)||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target||link.hasAttribute('download')||reduced.matches)return;
    if(link===active)return;
    try{sessionStorage.setItem(key,JSON.stringify({tab:active.pathname,to:link.pathname,time:Date.now()}));}catch{}
  });
  if('ResizeObserver' in window){resizeObserver=new ResizeObserver(place);resizeObserver.observe(nav);}
  document.fonts?.ready.then(place);
  reduced.addEventListener('change',()=>{animation?.cancel();place();},{signal:lifecycle.signal});
  window.addEventListener('pageshow',event=>{if(event.persisted)place();},{signal:lifecycle.signal});
  window.addEventListener('pagehide',()=>animation?.cancel(),{signal:lifecycle.signal});
  cleanup=()=>{disposed=true;animation?.cancel();resizeObserver?.disconnect();lifecycle.abort();};
  }
  document.addEventListener('flyfish:before-page',()=>cleanup());
  document.addEventListener('flyfish:page',initialize);
  initialize();
})();
