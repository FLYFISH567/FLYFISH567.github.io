(() => {
  'use strict';
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const opening=document.querySelector('.opening-screen');
  const replay=document.querySelector('[data-replay-opening]');
  let openingTimer,cleanupTimer,observer;
  let cardsStarted=false;
  const pending=new Set();
  const quiet=()=>reduced.matches||root.dataset.effects==='light';
  function revealAll(){
    observer?.disconnect();
    pending.forEach(node=>node.classList.remove('motion-pending','motion-enter'));
    pending.clear();
  }
  function startCards(){
    if(cardsStarted||quiet()||!('IntersectionObserver' in window))return;
    cardsStarted=true;
    observer=new IntersectionObserver(entries=>{
      let order=0;
      for(const entry of entries){
        if(!entry.isIntersecting)continue;
        const node=entry.target;
        observer.unobserve(node);
        node.classList.remove('motion-pending');
        node.style.setProperty('--entry-delay',`${Math.min(order++,3)*45}ms`);
        node.classList.add('motion-enter');
        const finishEntry=event=>{
          if(event.target!==node)return;
          node.classList.remove('motion-enter');
          node.style.removeProperty('--entry-delay');
          pending.delete(node);
          node.removeEventListener('animationend',finishEntry);
        };
        node.addEventListener('animationend',finishEntry);
      }
    },{threshold:0,rootMargin:'0px 0px -24px 0px'});
    // 只处理内容卡片；正文、目录与筛选控件保持立即可读。
    document.querySelectorAll('.post-card,.album-card,.essay-card,.show-card,.about-section').forEach(node=>{
      if(node.getBoundingClientRect().top<innerHeight&&!node.classList.contains('essay-card'))return;
      pending.add(node);node.classList.add('motion-pending');observer.observe(node);
    });
  }
  let finished=false;
  function finishOpening(){
    if(finished)return;
    finished=true;clearTimeout(openingTimer);
    const restore=opening?.contains(document.activeElement);
    root.removeAttribute('data-opening');
    if(opening){
      opening.classList.add('is-finished');
      opening.inert=true;
      if(restore)document.querySelector('.brand')?.focus({preventScroll:true});
      cleanupTimer=setTimeout(()=>{opening.hidden=true;},450);
    }
    document.removeEventListener('keydown',skipKey);
    startCards();
  }
  function skipKey(event){
    if(['Escape','Enter','Tab'].includes(event.key))finishOpening();
  }
  opening?.querySelector('[data-skip-opening]').addEventListener('click',finishOpening);
  if(replay){
    replay.hidden=quiet()||!document.querySelector('.home-intro');
    replay.addEventListener('click',()=>{
      if(quiet()||!opening)return;
      clearTimeout(cleanupTimer);clearTimeout(openingTimer);
      finished=false;opening.hidden=false;opening.inert=false;
      opening.classList.remove('is-finished');root.dataset.opening='pending';
      document.addEventListener('keydown',skipKey);
      openingTimer=setTimeout(finishOpening,2000);
    });
  }
  if(opening&&root.dataset.opening==='pending'&&!quiet()){
    opening.hidden=false;opening.inert=false;
    try{sessionStorage.setItem('flyfish-opening-seen','1');}catch{}
    document.addEventListener('keydown',skipKey);
    openingTimer=setTimeout(finishOpening,2000);
    // 后台标签恢复时直接显示内容。
    document.addEventListener('visibilitychange',()=>{if(document.hidden)finishOpening();},{once:true});
  }else{
    if(opening)opening.hidden=true;root.removeAttribute('data-opening');startCards();
  }
  reduced.addEventListener('change',()=>{
    if(replay)replay.hidden=quiet()||!document.querySelector('.home-intro');
    if(!reduced.matches)return;
    finishOpening();clearTimeout(cleanupTimer);if(opening)opening.hidden=true;revealAll();
  });
  document.addEventListener('flyfish:effectschange',()=>{if(quiet()){finishOpening();revealAll();}else{cardsStarted=false;startCards();}if(replay)replay.hidden=quiet()||!document.querySelector('.home-intro');});
  document.addEventListener('flyfish:before-page',()=>{revealAll();cardsStarted=false;});
  document.addEventListener('flyfish:page',()=>{startCards();if(replay)replay.hidden=quiet()||!document.querySelector('.home-intro');});
  window.addEventListener('pageshow',event=>{if(event.persisted){finishOpening();revealAll();}});
})();
