(() => {
  'use strict';
  if(window.FlyfishNavigator)return;
  const slot=()=>document.querySelector('[data-page-content]');
  if(!slot()||!window.fetch||!window.DOMParser)return;
  let enabled=false,controller=null,ticket=0,current=location.href;
  const positions=new Map();
  const notify=(name,detail)=>document.dispatchEvent(new CustomEvent(name,{detail}));
  function scrollToPage(url,position){
    if(position){window.scrollTo({left:position.x,top:position.y,behavior:'instant'});return;}
    let target=null;try{if(url.hash)target=document.getElementById(decodeURIComponent(url.hash.slice(1)));}catch{}
    if(target)target.scrollIntoView({behavior:'instant',block:'start'});else window.scrollTo({top:0,left:0,behavior:'instant'});
  }
  async function navigate(destination,{historyMode='push',position=null}={}){
    const url=new URL(destination,location.href),id=++ticket;
    if(historyMode==='push')current=location.href;
    controller?.abort();const requestController=new AbortController();controller=requestController;
    const timeout=setTimeout(()=>requestController.abort(),12000);
    document.documentElement.classList.add('is-navigating');
    try{
      const response=await fetch(url.href,{signal:controller.signal,headers:{Accept:'text/html'}});
      if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))throw Error('page');
      const next=new DOMParser().parseFromString(await response.text(),'text/html'),content=next.querySelector('[data-page-content]');
      if(!content||!next.body.dataset.view)throw Error('layout');
      if(id!==ticket)return false;
      positions.set(current,{x:scrollX,y:scrollY});
      notify('flyfish:before-page',{url:url.href});
      document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
      document.querySelectorAll('details[open]').forEach(details=>{details.open=false;});
      document.body.classList.remove('dialog-open');
      slot().replaceWith(document.importNode(content,true));
      document.body.dataset.view=next.body.dataset.view;
      document.title=next.title;
      for(const selector of ['meta[name="description"]','link[rel="canonical"]']){
        const existing=document.querySelector(selector),replacement=next.querySelector(selector);
        if(existing&&replacement)existing.replaceWith(document.importNode(replacement,true));
      }
      const active=next.querySelector('#main-nav a[aria-current=page]')?.getAttribute('href');
      document.querySelectorAll('#main-nav a').forEach(link=>{if(link.getAttribute('href')===active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
      document.querySelector('#main-nav')?.classList.remove('is-open');
      document.querySelector('.menu-toggle')?.setAttribute('aria-expanded','false');
      const progress=document.querySelector('.reading-progress');if(progress)progress.hidden=next.body.dataset.view!=='post';
      if(historyMode==='push')history.pushState({flyfish:true},'',url.href);
      current=url.href;
      notify('flyfish:page',{url:url.href,view:next.body.dataset.view});
      scrollToPage(url,position);
      requestAnimationFrame(()=>{scrollToPage(url,position);window.dispatchEvent(new Event('scroll'));});
      const main=document.querySelector('#main');main?.setAttribute('tabindex','-1');main?.focus({preventScroll:true});
      return true;
    }catch(error){
      if(id!==ticket)return false;
      // 失败时保留当前内容和音乐，给出可重试的原始链接，不在后台反复刷新。
      notify('flyfish:navigation-error',{url:url.href});
      if(historyMode==='pop'){history.replaceState({flyfish:true},'',current);}
      return false;
    }finally{clearTimeout(timeout);if(id===ticket)document.documentElement.classList.remove('is-navigating');}
  }
  window.FlyfishNavigator={
    enable(){enabled=true;history.replaceState({...history.state,flyfish:true},'',location.href);current=location.href;if('scrollRestoration' in history)history.scrollRestoration='manual';},
    navigate,
    get enabled(){return enabled;}
  };
  document.addEventListener('click',event=>{
    if(!enabled||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    const link=event.target.closest('a[href]');
    if(!link||link.target&&link.target!=='_self'||link.hasAttribute('download')||link.hasAttribute('data-no-navigation')||link.matches('[data-lightbox]'))return;
    const url=new URL(link.href,location.href);
    if(url.origin!==location.origin||!['http:','https:'].includes(url.protocol)||!/\/$|\.html$/.test(url.pathname))return;
    if(url.pathname===location.pathname&&url.search===location.search&&url.hash)return;
    event.preventDefault();navigate(url.href);
  });
  window.addEventListener('popstate',()=>{if(enabled)navigate(location.href,{historyMode:'pop',position:positions.get(location.href)||{x:0,y:0}});});
  document.addEventListener('flyfish:navigation-error',event=>{
    let notice=document.querySelector('.navigation-notice');
    if(!notice){notice=document.createElement('div');notice.className='navigation-notice';notice.setAttribute('role','status');document.body.append(notice);}
    notice.replaceChildren(document.createTextNode('页面暂时没有加载成功。'));
    const retry=document.createElement('button');retry.type='button';retry.textContent='重试';retry.onclick=()=>{notice.hidden=true;navigate(event.detail.url);};
    const native=document.createElement('a');native.href=event.detail.url;native.dataset.noNavigation='';native.textContent='直接打开';
    notice.append(retry,native);notice.hidden=false;
  });
  document.addEventListener('flyfish:page',()=>{const notice=document.querySelector('.navigation-notice');if(notice)notice.hidden=true;});
})();
