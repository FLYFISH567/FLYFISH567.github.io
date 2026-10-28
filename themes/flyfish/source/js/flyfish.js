(() => {
  'use strict';
  const $ = (selector, scope=document) => scope.querySelector(selector);
  const $$ = (selector, scope=document) => Array.from(scope.querySelectorAll(selector));
  const root=document.documentElement;
  let pageController=new AbortController();
  const pageDisposers=[];
  let readingObserver,tocObserver,codeObserver;
  // 原生年份选择器区分鼠标和键盘聚焦，点击时不出现粗外框。
  document.addEventListener('keydown',event=>{if(event.key==='Tab')root.classList.add('keyboard-navigation');});
  document.addEventListener('pointerdown',()=>root.classList.remove('keyboard-navigation'),{passive:true});
  const storage={get:key=>{try{return localStorage.getItem(key);}catch{return null;}},set:(key,value)=>{try{localStorage.setItem(key,value);}catch{}}};
  if(storage.get('flyfish-theme')==='dark')root.dataset.theme='dark';
  $('.theme-toggle')?.setAttribute('aria-label',root.dataset.theme==='dark'?'切换浅色模式':'切换深色模式');
  function initLights(){
  // 光晕仅在指定按钮、封面和卡片内响应鼠标，不追踪整页，也不替换系统光标。
  const pointerMotion=matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
  $$('[data-pointer-light]').forEach(surface=>{
    let frame=0,position=null;
    const reset=()=>{cancelAnimationFrame(frame);frame=0;position=null;surface.classList.remove('has-pointer');['--pointer-x','--pointer-y','--parallax-x','--parallax-y'].forEach(name=>surface.style.removeProperty(name));};
    surface.addEventListener('pointermove',event=>{
      if(!pointerMotion.matches||root.dataset.effects==='light'||event.pointerType!=='mouse')return;
      position={x:event.clientX,y:event.clientY};
      if(frame)return;
      frame=requestAnimationFrame(()=>{frame=0;if(!position)return;const rect=surface.getBoundingClientRect();surface.style.setProperty('--pointer-x',`${position.x-rect.left}px`);surface.style.setProperty('--pointer-y',`${position.y-rect.top}px`);if(surface.classList.contains('sky-cover')&&rect.width&&rect.height){surface.style.setProperty('--parallax-x',`${((position.x-rect.left)/rect.width-.5)*8}px`);surface.style.setProperty('--parallax-y',`${((position.y-rect.top)/rect.height-.5)*6}px`);}surface.classList.add('has-pointer');});
    },{passive:true,signal:pageController.signal});
    surface.addEventListener('pointerleave',reset,{signal:pageController.signal});
    surface.addEventListener('pointercancel',reset,{signal:pageController.signal});
    surface.addEventListener('blur',reset,{signal:pageController.signal});
    pointerMotion.addEventListener('change',reset,{signal:pageController.signal});
    document.addEventListener('flyfish:effectschange',reset,{signal:pageController.signal});
    pageDisposers.push(reset);
  });
  }
  $('.theme-toggle')?.addEventListener('click',()=>{const dark=root.dataset.theme!=='dark';root.dataset.theme=dark?'dark':'light';storage.set('flyfish-theme',root.dataset.theme);$('.theme-toggle').setAttribute('aria-label',dark?'切换浅色模式':'切换深色模式');});
  $('.menu-toggle')?.addEventListener('click',event=>{const open=$('#main-nav').classList.toggle('is-open');event.currentTarget.setAttribute('aria-expanded',String(open));});
  function toast(text){const node=$('.toast');node.textContent=text;node.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.classList.remove('visible'),2400);}
  const backTop=$('.back-top'),siteHeader=$('.site-header'),readingProgress=$('.reading-progress');
  let readingBody=$('.article-body');
  let scrollFrame=0;
  function updateReadingProgress(){
    if(!readingProgress||!readingBody)return;
    const rect=readingBody.getBoundingClientRect(),headerHeight=siteHeader.offsetHeight;
    const available=innerHeight-headerHeight;
    const fraction=rect.height<=available?(rect.bottom<=innerHeight?1:0):Math.max(0,Math.min(1,(headerHeight-rect.top)/(rect.height-available)));
    readingProgress.style.setProperty('--reading-progress',fraction);
    readingProgress.setAttribute('aria-valuenow',String(Math.round(fraction*100)));
  }
  const updateScroll=()=>{scrollFrame=0;if(backTop)backTop.hidden=window.scrollY<650;siteHeader?.classList.toggle('is-scrolled',window.scrollY>16);updateReadingProgress();};
  const scheduleScroll=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);};
  window.addEventListener('scroll',scheduleScroll,{passive:true});window.addEventListener('resize',scheduleScroll,{passive:true});
  function initReading(){readingObserver?.disconnect();readingBody=$('.article-body');if(readingBody){readingObserver=new ResizeObserver(scheduleScroll);readingObserver.observe(readingBody);}updateScroll();}
  window.addEventListener('pageshow',scheduleScroll);updateScroll();
  backTop?.addEventListener('click',()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'}));
  function imageFailed(img){if(!img.getAttribute('src'))return;if(img.matches('[data-music-cover]')){img.hidden=true;return;}if(img.closest('.opening-avatar')){img.hidden=true;return;}img.classList.add('image-broken');if(!img.closest('#photo-viewer')&&!img.classList.contains('avatar'))img.parentElement?.classList.add('image-error');}
  document.addEventListener('error',event=>{if(event.target instanceof HTMLImageElement)imageFailed(event.target);},true);
  function scanImages(){$$('img').filter(img=>img.complete&&img.getAttribute('src')&&!img.naturalWidth).forEach(imageFailed);}
  function initLibraries(){
  const hub=$('[data-article-hub]');
  if(hub){
    const input=$('input[name=q]',hub),year=$('select[name=year]',hub),cards=$$('[data-post-card]',hub),buttons=$$('[data-topic]',hub);
    const params=new URLSearchParams(location.search);
    const search=window.FlyfishSearch,retry=$('[data-fulltext-retry]',hub);
    let fullText=null,loading=false,searchFailed=false;
    async function loadFullText(){
      if(!search||loading||fullText)return;
      loading=true;searchFailed=false;if(retry)retry.hidden=true;
      try{const records=await search.load(hub.dataset.searchIndex);fullText=new Map(records.map(post=>[search.key(post.url),post]));}catch{searchFailed=true;}
      finally{loading=false;if(hub.isConnected&&!pageController.signal.aborted)apply();}
    }
    let selected=params.get('topic')||hub.dataset.initialTopic||'';
    let category=hub.dataset.initialCategory||'';
    if(selected.toLowerCase()==='xss')selected='XSS';
    input.value=params.get('q')||'';year.value=params.get('year')||hub.dataset.initialYear||'';
    function apply(updateURL=false){
      const query=input.value.trim().toLocaleLowerCase();let count=0;
      if(query&&search&&!fullText&&!searchFailed)loadFullText();
      const words=query.split(/\s+/).filter(Boolean);
      for(const card of cards){const topics=JSON.parse(card.dataset.topics),record=fullText?.get(search.key(card.dataset.url));const textMatches=!query||(record?search.matches(record,query):words.every(word=>card.dataset.title.includes(word)));const visible=textMatches&&(!selected||topics.includes(selected))&&(!year.value||card.dataset.year===year.value)&&(!category||card.dataset.category.split('|').includes(category));card.hidden=!visible;if(visible)count++;}
      buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.topic===selected)));
      $('[data-results-count]',hub).textContent=`${selected?selected+' · ':''}${category?category+' · ':''}共 ${count} 篇文章`;
      if(query&&loading)$('[data-results-count]',hub).textContent='正在搜索标题、标签和正文…';
      if(query&&searchFailed)$('[data-results-count]',hub).textContent=`正文搜索暂不可用 · 当前按标题、摘要和标签找到 ${count} 篇`;
      if(retry)retry.hidden=!query||!searchFailed;
      $('[data-no-results]',hub).hidden=count>0||loading;
      const currentButton=buttons.find(b=>b.dataset.topic===selected);if(currentButton?.closest('details'))currentButton.closest('details').open=true;
      if(updateURL){const url=new URL(location.href);for(const key of ['q','topic','year','search'])url.searchParams.delete(key);if(query)url.searchParams.set('q',input.value.trim());if(selected)url.searchParams.set('topic',selected);if(year.value)url.searchParams.set('year',year.value);history.replaceState(null,'',url);}
    }
    buttons.forEach(button=>button.addEventListener('click',()=>{selected=button.dataset.topic;category='';apply(true);}));
    input.addEventListener('input',()=>apply(true));year.addEventListener('change',()=>apply(true));
    $('[data-reset-filters]',hub).addEventListener('click',()=>{input.value='';year.value='';selected='';category='';apply(true);});
    retry?.addEventListener('click',loadFullText);
    apply();if(params.has('search'))input.focus();
  }
  const albums=$('[data-album-library]');
  if(albums){
    const buttons=$$('[data-album-category]',albums),cards=$$('[data-album-group]',albums);
    const filteringAnimations=new Map();
    function choose(category,updateURL=false){
      if(!buttons.some(button=>button.dataset.albumCategory===category))category='';
      const animate=updateURL&&!matchMedia('(prefers-reduced-motion:reduce)').matches;
      const previous=new Map(animate?cards.filter(card=>!card.hidden).map(card=>[card,card.getBoundingClientRect()]):[]);
      filteringAnimations.forEach(animation=>animation.cancel());filteringAnimations.clear();
      let count=0;cards.forEach(card=>{card.hidden=!!category&&card.dataset.albumGroup!==category;if(!card.hidden)count++;});
      if(animate)cards.filter(card=>!card.hidden).forEach(card=>{
        card.classList.remove('motion-pending','motion-enter');
        if(!card.animate)return;
        const before=previous.get(card),after=card.getBoundingClientRect();
        const animation=card.animate(before?[{transform:`translate(${before.left-after.left}px,${before.top-after.top}px)`},{transform:'translate(0,0)'}]:[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'cubic-bezier(.2,.65,.3,1)'});
        filteringAnimations.set(card,animation);animation.onfinish=()=>filteringAnimations.delete(card);
      });
      buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.albumCategory===category)));
      $('[data-album-count]',albums).textContent=`${category?category+' · ':''}共 ${count} 本相册`;
      if(updateURL){const url=new URL(location.href);if(category)url.searchParams.set('category',category);else url.searchParams.delete('category');history.replaceState(null,'',url);}
    }
    buttons.forEach(button=>button.addEventListener('click',()=>choose(button.dataset.albumCategory,true)));
    choose(new URLSearchParams(location.search).get('category')||'');
    window.addEventListener('popstate',()=>choose(new URLSearchParams(location.search).get('category')||''),{signal:pageController.signal});
  }
  const bangumi=$('[data-bangumi]');
  if(bangumi){const tabs=$$('[data-watch-status]',bangumi),shows=$$('[data-show-status]',bangumi);function choose(status){let count=0;shows.forEach(show=>{show.hidden=show.dataset.showStatus!==status;if(!show.hidden)count++;});tabs.forEach(tab=>tab.setAttribute('aria-pressed',String(tab.dataset.watchStatus===status)));$('.watch-count',bangumi).textContent=`${tabs.find(t=>t.dataset.watchStatus===status).textContent.trim().split(/\s/)[0]} · ${count} 部`;}
    tabs.forEach(tab=>tab.addEventListener('click',()=>choose(tab.dataset.watchStatus)));choose('watching');}
  }
  // 大图使用浏览器原生对话框，Escape、焦点恢复与键盘导航都可用。
  const viewer=$('#photo-viewer');let gallery=[],photoIndex=0,photoRequest=0,photoTimer=0,photoAnimation;
  function displayPhoto(index){
    photoIndex=Math.max(0,Math.min(gallery.length-1,index));const photo=gallery[photoIndex];
    const img=$('img',viewer),stage=$('.viewer-stage',viewer),status=$('.viewer-status',viewer),request=++photoRequest;
    clearTimeout(photoTimer);photoAnimation?.cancel();
    stage.setAttribute('aria-busy','true');status.hidden=false;status.textContent='正在载入照片…';
    $('.viewer-controls p',viewer).textContent=`${photo.caption.replace(/ · \d+ \/ \d+$/,'')} · ${photoIndex+1} / ${gallery.length}`;
    $$('[data-photo-step]',viewer).forEach(b=>b.disabled=Number(b.dataset.photoStep)<0?photoIndex===0:photoIndex===gallery.length-1);
    const next=new Image();
    const failed=()=>{
      if(request!==photoRequest)return;
      ++photoRequest;clearTimeout(photoTimer);stage.setAttribute('aria-busy','false');
      img.removeAttribute('src');img.alt='';status.hidden=false;status.textContent='这张照片暂时无法加载，可以切换其他照片。';
    };
    next.onload=()=>{
      if(request!==photoRequest)return;
      clearTimeout(photoTimer);img.classList.remove('image-broken');img.src=photo.url;img.alt=photo.caption;
      stage.setAttribute('aria-busy','false');status.hidden=true;
      if(img.animate&&!matchMedia('(prefers-reduced-motion:reduce)').matches)photoAnimation=img.animate([{opacity:0,transform:'scale(.985)'},{opacity:1,transform:'scale(1)'}],{duration:240,easing:'ease-out'});
    };
    next.onerror=failed;photoTimer=setTimeout(failed,12000);next.src=photo.url;
  }
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[data-lightbox]');
    if(link){event.preventDefault();const links=$$('a[data-lightbox]').filter(a=>a.dataset.lightbox===link.dataset.lightbox);gallery=links.map(a=>({url:a.href,caption:a.dataset.caption||$('img',a)?.alt||'照片'}));displayPhoto(links.indexOf(link));viewer.showModal();document.body.classList.add('dialog-open');return;}
    const img=event.target.closest('.article-body img');if(img){event.preventDefault();const images=$$('.article-body img');gallery=images.map(i=>({url:i.src,caption:i.alt||'文章图片'}));displayPhoto(images.indexOf(img));viewer.showModal();document.body.classList.add('dialog-open');}
  });
  $('.viewer-close',viewer)?.addEventListener('click',()=>viewer.close());
  viewer?.addEventListener('close',()=>{
    ++photoRequest;clearTimeout(photoTimer);photoAnimation?.cancel();
    document.body.classList.remove('dialog-open');$('img',viewer).removeAttribute('src');
    $('.viewer-stage',viewer).setAttribute('aria-busy','false');$('.viewer-status',viewer).hidden=true;
  });
  viewer?.addEventListener('click',event=>{if(event.target===viewer)viewer.close();});
  $$('[data-photo-step]',viewer).forEach(b=>b.addEventListener('click',()=>displayPhoto(photoIndex+Number(b.dataset.photoStep))));
  viewer?.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();displayPhoto(photoIndex-1);}if(event.key==='ArrowRight'){event.preventDefault();displayPhoto(photoIndex+1);}});
  function initArticle(){
  // 复制仅提取代码列，避免把 Hexo 的行号一起复制。
  $$('figure.highlight').forEach(figure=>{const tools=document.createElement('div');tools.className='code-tools';const language=document.createElement('span');language.textContent=figure.className.replace('highlight','').trim()||'CODE';const button=document.createElement('button');button.type='button';button.textContent='复制代码';tools.append(language,button);figure.prepend(tools);button.addEventListener('click',async()=>{const lines=$$('.code .line',figure);const code=lines.length?lines.map(line=>line.textContent).join('\n'):$('.code pre',figure)?.textContent||$('pre',figure)?.textContent||'';try{await navigator.clipboard.writeText(code);toast('代码已复制');}catch{toast('暂时无法复制，请手动选择代码。');}});});
  const article=$('.article-body');if(article){const fit=()=>article.style.setProperty('--code-width',Math.max(140,article.clientWidth-55)+'px');fit();codeObserver=new ResizeObserver(fit);codeObserver.observe(article);const links=$$('.toc-nav a');tocObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){links.forEach(a=>a.classList.toggle('active',decodeURIComponent(a.hash.slice(1))===entry.target.id));}},{rootMargin:'-10% 0px -65% 0px'});$$('h2[id],h3[id]',article).forEach(h=>tocObserver.observe(h));}
  }
  function initializePage(){
    initLights();initLibraries();initArticle();initReading();scanImages();
  }
  document.addEventListener('flyfish:before-page',()=>{
    pageController.abort();pageDisposers.splice(0).forEach(dispose=>dispose());
    readingObserver?.disconnect();tocObserver?.disconnect();codeObserver?.disconnect();
    if(viewer?.open)viewer.close();gallery=[];++photoRequest;clearTimeout(photoTimer);photoAnimation?.cancel();
  });
  document.addEventListener('flyfish:page',()=>{pageController=new AbortController();initializePage();});
  initializePage();
})();
