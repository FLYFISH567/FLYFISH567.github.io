(() => {
  'use strict';
  if(window.FlyfishNavigator)return;
  const slot=()=>document.querySelector('[data-page-content]');
  if(!slot()||!window.fetch||!window.DOMParser)return;
  // Explicit, local-only instrumentation. Never reads URL switches or persists a session.
  const diagnostics=(()=>{
    let enabled=false;const records=[],limit=5000,allowed=['navId','requestId','path','asset','origin','source','state','phase','status','frame'];
    const path=value=>{try{return new URL(value,location.href).pathname;}catch{return '';}};
    return {enable(){enabled=['localhost','127.0.0.1','[::1]'].includes(location.hostname);return enabled;},disable(){enabled=false;},clear(){records.length=0;},get enabled(){return enabled;},records(){return records.map(row=>({...row}));},mark(event,fields={}){
      if(!enabled)return;const row={event,time:performance.now()};for(const key of allowed){const value=fields[key];if(value!==undefined)row[key]=['path','asset'].includes(key)?path(value):value;}
      records.push(row);if(records.length>limit)records.shift();
    }};
  })();
  window.FlyfishNavigationDiagnostics=diagnostics;
  const mark=(event,fields)=>diagnostics.mark(event,fields);
  let enabled=false,controller=null,ticket=0,current=location.href;
  const positions=new Map();
  // Limited, short-lived caches avoid downloading the whole site.
  const pageCache=new Map(),requests=new Map();
  const cacheLife=120000,cacheLimit=6,maxPageSize=512000,maxSpeculative=12;
  let speculativeCount=0,hoverTimer,requestSerial=0;
  const keyFor=url=>{const key=new URL(url,location.href);key.hash='';return key.href;};
  function cacheable(url){return url.origin===location.origin&&['http:','https:'].includes(url.protocol)&&/\/$|\.html$/.test(url.pathname)&&!url.searchParams.has('giscus');}
  function cacheGet(url){const key=keyFor(url),entry=pageCache.get(key);if(!entry)return null;if(Date.now()-entry.time>=cacheLife){pageCache.delete(key);return null;}pageCache.delete(key);pageCache.set(key,entry);return entry.text;}
  function cachePut(url,text){if(!cacheable(url)||text.length>maxPageSize)return;const key=keyFor(url);pageCache.delete(key);pageCache.set(key,{text,time:Date.now()});while(pageCache.size>cacheLimit)pageCache.delete(pageCache.keys().next().value);}
  function canPrefetch(){const connection=navigator.connection;return !document.hidden&&!connection?.saveData&&!['slow-2g','2g'].includes(connection?.effectiveType);}
  function eligibleLink(link){
    if(!link||link.target&&link.target!=='_self'||link.hasAttribute('download')||link.hasAttribute('data-no-navigation')||link.matches('[data-lightbox]'))return null;
    let url;try{url=new URL(link.href,location.href);}catch{return null;}
    if(!cacheable(url)||url.pathname===location.pathname&&url.search===location.search)return null;
    return url;
  }
  function abortError(){return new DOMException('Navigation cancelled','AbortError');}
  function startRequest(url,speculative){
    const key=keyFor(url),requestController=new AbortController();
    const entry={controller:requestController,speculative,users:0,timer:0,promise:null,id:++requestSerial};
    const fields={requestId:entry.id,path:key,origin:speculative?'prefetch':'click',frame:'main-fetch'};
    const expired=new Promise((_,reject)=>requestController.signal.addEventListener('abort',()=>reject(abortError()),{once:true}));
    const fetchPage=async()=>{
      mark('html.request.start',fields);
      const response=await fetch(key,{signal:requestController.signal,headers:{Accept:'text/html'},...(speculative?{priority:'low'}:{})});
      mark('html.headers',{...fields,status:response.status});
      if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))throw Error('page');
      const text=await response.text();
      mark('html.body.end',fields);
      if(!text.includes('data-page-content')||!/<body\b[^>]*\bdata-view\s*=/i.test(text))throw Error('layout');
      return text;
    };
    entry.timer=setTimeout(()=>requestController.abort(),speculative?4000:12000);
    entry.promise=Promise.race([fetchPage(),expired]).then(text=>{
      if(requestController.signal.aborted)throw abortError();
      cachePut(url,text);return text;
    }).catch(error=>{mark('html.request.error',{...fields,state:requestController.signal.aborted?'aborted':'failed'});throw error;}).finally(()=>{clearTimeout(entry.timer);if(requests.get(key)===entry)requests.delete(key);});
    requests.set(key,entry);return entry;
  }
  async function prefetch(url){
    if(!canPrefetch()||!cacheable(url)||speculativeCount>=maxSpeculative||cacheGet(url)||requests.has(keyFor(url))||[...requests.values()].filter(entry=>entry.speculative).length>=2)return;
    speculativeCount++;
    try{await startRequest(url,true).promise;}catch{}
  }
  function consume(entry,signal){
    if(signal.aborted)return Promise.reject(abortError());
    entry.users++;
    return new Promise((resolve,reject)=>{
      let done=false;
      const finish=(callback,value)=>{
        if(done)return;done=true;signal.removeEventListener('abort',cancel);entry.users--;callback(value);
        // A rapid second click on the same URL can join before abandoning the old request.
        queueMicrotask(()=>{if(!entry.users&&!entry.speculative&&[...requests.values()].includes(entry))entry.controller.abort();});
      };
      const cancel=()=>finish(reject,abortError());
      signal.addEventListener('abort',cancel,{once:true});
      entry.promise.then(value=>finish(resolve,value),error=>finish(reject,error));
    });
  }
  async function readPage(url,signal,navId){
    const cached=cacheGet(url);if(cached!==null){mark('html.source',{navId,path:url,source:'memory'});return cached;}
    let entry=requests.get(keyFor(url));
    if(entry?.controller.signal.aborted){requests.delete(keyFor(url));entry=null;}
    mark('html.source',{navId,path:url,source:entry?'in-flight':'new',origin:entry?.speculative?'prefetch':'click',requestId:entry?.id||requestSerial+1});
    if(entry?.speculative){
      // Promote the same fetch instead of issuing a duplicate after a fixed 250ms wait.
      entry.speculative=false;clearTimeout(entry.timer);entry.timer=setTimeout(()=>entry.controller.abort(),12000);
    }
    entry ||= startRequest(url,false);
    return consume(entry,signal);
  }
  // Warm at most two navigation pages during the opening or idle time.
  function warmNavigation(){if(!canPrefetch())return;const urls=[...document.querySelectorAll('#main-nav a[href]')].map(eligibleLink).filter(Boolean).slice(0,2);(async()=>{for(const url of urls){if(!canPrefetch())break;await prefetch(url);}})();}
  const warm=()=>{if('requestIdleCallback' in window)requestIdleCallback(warmNavigation,{timeout:1600});else setTimeout(warmNavigation,1200);};
  if(document.documentElement.dataset.opening==='pending')setTimeout(warmNavigation,250);else warm();
  document.addEventListener('pointerover',event=>{if(event.pointerType&&event.pointerType!=='mouse')return;const url=eligibleLink(event.target.closest?.('a[href]'));if(!url)return;clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>prefetch(url),120);},{passive:true});
  document.addEventListener('pointerout',()=>clearTimeout(hoverTimer),{passive:true});
  document.addEventListener('pointerdown',event=>{const url=eligibleLink(event.target.closest?.('a[href]'));if(url)prefetch(url);},{passive:true});
  document.addEventListener('focusin',event=>{const url=eligibleLink(event.target.closest?.('a[href]'));if(url)prefetch(url);});
  const notify=(name,detail)=>document.dispatchEvent(new CustomEvent(name,{detail}));
  let pendingTimer,pendingNotice;
  function pending(id){clearTimeout(pendingTimer);if(pendingNotice)pendingNotice.hidden=true;slot()?.setAttribute('aria-busy','true');pendingTimer=setTimeout(()=>{if(id!==ticket)return;if(!pendingNotice){pendingNotice=document.createElement('div');pendingNotice.className='navigation-pending';pendingNotice.setAttribute('role','status');pendingNotice.textContent='正在打开页面，请稍等…';document.body.append(pendingNotice);}pendingNotice.hidden=false;},250);}
  function scrollToPage(url,position){
    if(position){window.scrollTo({left:position.x,top:position.y,behavior:'instant'});return;}
    let target=null;try{if(url.hash)target=document.getElementById(decodeURIComponent(url.hash.slice(1)));}catch{}
    if(target)target.scrollIntoView({behavior:'instant',block:'start'});else window.scrollTo({top:0,left:0,behavior:'instant'});
  }
  async function navigate(destination,{historyMode='push',position=null}={}){
    const url=new URL(destination,location.href),id=++ticket;
    const fields={navId:id,path:url};mark('navigation.start',fields);
    if(historyMode==='push')current=location.href;
    controller?.abort();const requestController=new AbortController();controller=requestController;
    const timeout=setTimeout(()=>requestController.abort(),12000);
    let outcome='superseded';
    document.documentElement.classList.add('is-navigating');
    pending(id);
    try{
      const html=await readPage(url,requestController.signal,id);
      mark('dom.parse.start',fields);
      const next=new DOMParser().parseFromString(html,'text/html'),content=next.querySelector('[data-page-content]');
      mark('dom.parse.end',fields);
      if(!content||!next.body.dataset.view){pageCache.delete(keyFor(url));throw Error('layout');}
      if(id!==ticket||requestController.signal.aborted)throw abortError();
      mark('assets.start',fields);
      await window.FlyfishPageAssets?.prepare(next,{navId:id,signal:requestController.signal});
      mark('assets.end',fields);
      if(id!==ticket||requestController.signal.aborted)throw abortError();
      positions.set(current,{x:scrollX,y:scrollY});
      notify('flyfish:before-page',{url:url.href,navId:id});
      document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
      document.querySelectorAll('details[open]').forEach(details=>{details.open=false;});
      document.body.classList.remove('dialog-open');
      mark('dom.replace.start',fields);slot().replaceWith(document.importNode(content,true));mark('dom.replace.end',fields);
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
      mark('page.init.sync.start',fields);notify('flyfish:page',{url:url.href,view:next.body.dataset.view,navId:id});mark('page.init.sync.end',fields);
      scrollToPage(url,position);
      requestAnimationFrame(()=>{if(id!==ticket)return;scrollToPage(url,position);window.dispatchEvent(new Event('scroll'));mark('paint.opportunity',{...fields,phase:1});if(diagnostics.enabled)requestAnimationFrame(()=>mark('paint.opportunity',{...fields,phase:2}));});
      const main=document.querySelector('#main');main?.setAttribute('tabindex','-1');main?.focus({preventScroll:true});
      outcome='committed';return true;
    }catch(error){
      outcome=id!==ticket?'superseded':requestController.signal.aborted?'aborted':'failed';mark('navigation.error',{...fields,state:outcome});
      if(id!==ticket)return false;
      // 失败时保留当前内容和音乐，给出可重试的原始链接，不在后台反复刷新。
      notify('flyfish:navigation-error',{url:url.href});
      if(historyMode==='pop'){history.replaceState({flyfish:true},'',current);}
      return false;
    }finally{mark('navigation.end',{...fields,state:outcome});clearTimeout(timeout);if(id===ticket){clearTimeout(pendingTimer);if(pendingNotice)pendingNotice.hidden=true;slot()?.removeAttribute('aria-busy');document.documentElement.classList.remove('is-navigating');}}
  }
  window.FlyfishNavigator={
    enable(){if(enabled)return;enabled=true;history.replaceState({...history.state,flyfish:true},'',location.href);current=location.href;if('scrollRestoration' in history)history.scrollRestoration='manual';},
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
  window.addEventListener('popstate',()=>{
    if(!enabled)return;
    const previous=new URL(current),next=new URL(location.href);
    if(previous.pathname===next.pathname&&previous.search===next.search){current=location.href;scrollToPage(next,positions.get(current));return;}
    navigate(location.href,{historyMode:'pop',position:positions.get(location.href)||{x:0,y:0}});
  });
  window.addEventListener('hashchange',()=>{current=location.href;});
  window.addEventListener('pagehide',()=>{
    const position={x:scrollX,y:scrollY};positions.set(location.href,position);
    history.replaceState({...history.state,flyfishScroll:position},'',location.href);
  });
  window.addEventListener('pageshow',event=>{
    const type=performance.getEntriesByType?.('navigation')[0]?.type;
    const position=history.state?.flyfishScroll;
    if(position&&(event.persisted||type==='back_forward'||type==='reload'))requestAnimationFrame(()=>scrollToPage(new URL(location.href),position));
  });
  document.addEventListener('flyfish:navigation-error',event=>{
    let notice=document.querySelector('.navigation-notice');
    if(!notice){notice=document.createElement('div');notice.className='navigation-notice';notice.setAttribute('role','status');document.body.append(notice);}
    notice.replaceChildren(document.createTextNode('页面暂时没有加载成功。'));
    const retry=document.createElement('button');retry.type='button';retry.textContent='重试';retry.onclick=()=>{notice.hidden=true;navigate(event.detail.url);};
    const native=document.createElement('a');native.href=event.detail.url;native.dataset.noNavigation='';native.textContent='直接打开';
    notice.append(retry,native);notice.hidden=false;
  });
  document.addEventListener('flyfish:page',()=>{const notice=document.querySelector('.navigation-notice');if(notice)notice.hidden=true;});
  window.FlyfishNavigator.enable();
})();
