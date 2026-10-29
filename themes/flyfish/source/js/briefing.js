(() => {
  'use strict';
  const api=window.FlyfishBriefingSources;if(!api)return;
  const {SOURCES,CATEGORIES}=api;
  const CACHE='flyfish-briefing-cache-v1',PREFS='flyfish-briefing-prefs-v1';
  let persistent=true,page=null,timer=0,busy=false,refreshController=null,status='',siteAttempt=0,siteFailed=false;
  const errors=new Map(),attempts=new Map();
  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{persistent=false;return null;}}
  function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{persistent=false;}}
  let cache=api.cleanSnapshot(read(CACHE));
  const raw=read(PREFS)||{};
  const catalog=SOURCES.map(s=>s.id),known=Array.isArray(raw.catalog)?raw.catalog:['daily','ai','radar','dev','security'];
  const subscriptions=Array.isArray(raw.sources)?raw.sources.filter(id=>catalog.includes(id)).concat(raw.sources.length?catalog.filter(id=>!known.includes(id)):[]):catalog;
  const pref={sources:[...new Set(subscriptions)],catalog,read:raw.read&&typeof raw.read==='object'&&!Array.isArray(raw.read)?raw.read:{},saved:{},notify:raw.notify===true,notifySince:Number(raw.notifySince)||0};
  function savedItems(value){return Object.fromEntries(Object.entries(value&&typeof value==='object'&&!Array.isArray(value)?value:{}).slice(-100).filter(([,item])=>SOURCES.some(s=>s.id===item?.sourceId)&&api.safeURL(item.url)&&typeof item.title==='string'&&Number.isFinite(Date.parse(item.publishedAt))).map(([id,item])=>[id,{...item,id,url:api.safeURL(item.url)}]));}
  pref.saved=savedItems(raw.saved);
  let category='all',mode='all',query='',limit=12;
  const $=(selector,root=page)=>root?.querySelector(selector);
  const dateTime=value=>{try{return new Intl.DateTimeFormat('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Shanghai'}).format(new Date(value));}catch{return '时间未知';}};
  const text=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=value;if(cls)e.className=cls;return e;};
  function save(){const entries=Object.entries(pref.read).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,1000);pref.read=Object.fromEntries(entries);write(PREFS,pref);}
  function mergeSnapshot(incoming){const newest=group=>(group?.items||[]).reduce((v,i)=>i.publishedAt>v?i.publishedAt:v,'');for(const spec of SOURCES){const next=incoming.sources[spec.id],old=cache.sources[spec.id];if(next&&(!old||Date.parse(next.fetchedAt)>Date.parse(old.fetchedAt))&&(!old||!newest(old)||!newest(next)||newest(next)>=newest(old)))cache.sources[spec.id]=next;}if(incoming.checkedAt&&(!cache.checkedAt||incoming.checkedAt>=cache.checkedAt)){cache.checkedAt=incoming.checkedAt;cache.health=incoming.health;}}
  function entries(){const seen=new Set(),items=[];for(const spec of SOURCES){if(!pref.sources.includes(spec.id))continue;for(const item of cache.sources[spec.id]?.items||[]){if(seen.has(item.id))continue;seen.add(item.id);items.push({...item,sourceId:spec.id});}}
    if(mode==='saved')for(const item of Object.values(pref.saved))if(pref.sources.includes(item.sourceId)&&!seen.has(item.id))items.push(item);
    return items.sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
  }
  function selected(){const words=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);return entries().filter(item=>{
    const source=SOURCES.find(s=>s.id===item.sourceId),haystack=[item.title,item.summary,item.byline,source.name,item.topic].join(' ').toLocaleLowerCase();
    return (category==='all'||source.category===category)&&(mode!=='unread'||!pref.read[item.id])&&(mode!=='saved'||!!pref.saved[item.id])&&words.every(word=>haystack.includes(word));
  });}
  function syncNotification(){if(!page)return;const button=$('[data-briefing-notify]'),copy=$('[data-briefing-notify-status]');
    if(!('Notification' in window)||!window.isSecureContext){button.disabled=true;button.textContent='此浏览器暂不支持桌面提醒';copy.textContent='你仍可在看板内查看未读消息。';return;}
    button.textContent=pref.notify&&Notification.permission==='granted'?'关闭桌面提醒':'开启桌面提醒';button.setAttribute('aria-pressed',String(pref.notify&&Notification.permission==='granted'));
    copy.textContent=Notification.permission==='denied'?'浏览器已阻止提醒；可在网站权限中修改。':pref.notify?'网页保持打开时，提醒已订阅来源的新消息；关闭网页后不会推送。':'网页保持打开时提醒新消息；关闭网页后不会推送。';
  }
  function renderSources(){if(!page)return;
    for(const spec of SOURCES){const group=cache.sources[spec.id],node=$('[data-briefing-source-info="'+spec.id+'"]');if(!node)continue;
      const health=cache.health?.[spec.id],failed=errors.has(spec.id)||(health&&health.status!=='ok'),latest=group?.items.reduce((v,i)=>i.publishedAt>v?i.publishedAt:v,'');
      const stamp=group?'获取于 '+dateTime(group.fetchedAt)+(group.edition?' · 简报日期 '+group.edition:latest?' · 最新报道 '+dateTime(latest):''):'暂无可用快照';
      const freshness=$('[data-briefing-source-freshness]',node);freshness.textContent=(failed?'暂时无法更新 · ':'')+stamp;freshness.classList.toggle('source-is-stale',!!failed);
      $('[data-briefing-source-records]',node).textContent=group?group.items.length+' 条':'等待更新';
    }
    page.querySelectorAll('[data-briefing-group-count]').forEach(label=>{const group=SOURCES.filter(s=>s.category===label.dataset.briefingGroupCount);label.textContent=group.filter(s=>pref.sources.includes(s.id)).length+' / '+group.length;});
  }
  function render(){if(!page?.isConnected)return;const items=selected(),feed=$('[data-briefing-feed]'),fragment=document.createDocumentFragment();
    for(const [i,item] of items.slice(0,limit).entries()){
      const source=SOURCES.find(s=>s.id===item.sourceId),card=text('article','','briefing-item pointer-surface'+(pref.read[item.id]?' is-read':''));card.dataset.itemId=item.id;card.dataset.pointerLight='';
      card.append(text('div',String(i+1).padStart(2,'0'),'briefing-item-index'));
      const body=text('div','','briefing-item-body'),meta=text('div','','briefing-item-meta');
      meta.append(text('span',source.label,'briefing-category-tag'),text('span',source.format==='indexed'?source.name:item.byline||source.name));const dateOnly=['daily','ai'].includes(source.id),time=text('time',dateOnly?api.day(item.publishedAt)+' 简报':dateTime(item.publishedAt));time.dateTime=dateOnly?api.day(item.publishedAt):item.publishedAt;meta.append(time);
      const heading=text('h2',''),a=text('a',item.title);a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';a.dataset.readLink=item.id;heading.append(a);body.append(meta,heading);
      if(item.summary)body.append(text('p',item.summary));
      const actions=text('div','','briefing-item-actions');const topic=text('span',item.topic||source.label);actions.append(topic);
      for(const [action,label,pressed] of [['read',pref.read[item.id]?'已读':'标为已读',!!pref.read[item.id]],['save',pref.saved[item.id]?'已收藏':'收藏',!!pref.saved[item.id]]]){const b=text('button',label);b.type='button';b.dataset.briefingAction=action;b.dataset.itemId=item.id;b.setAttribute('aria-pressed',String(pressed));b.setAttribute('aria-label',label+'：'+item.title);actions.append(b);}
      body.append(actions);card.append(body);fragment.append(card);
    }
    feed.replaceChildren(fragment);$('[data-briefing-empty]').hidden=items.length>0;
    $('[data-briefing-empty]').textContent=!pref.sources.length?'还没有选择资讯来源。勾选右侧订阅，就能开始阅读。':mode==='saved'?'还没有匹配的收藏，点击消息下方的“收藏”即可保存。':'暂时没有匹配的消息，换个分类或关键词试试。';
    $('[data-briefing-more]').hidden=items.length<=limit;
    $('[data-briefing-clear]').hidden=!query;
    $('[data-briefing-results]').textContent=[category==='all'?'全部资讯':CATEGORIES.find(c=>c[0]===category)?.[1],mode==='unread'?'未读':mode==='saved'?'收藏':'',query.trim()?'搜索结果':''].filter(Boolean).join(' · ');
    const delayed=cache.checkedAt&&Date.now()-Date.parse(cache.checkedAt)>10800000;
    $('[data-briefing-status]').textContent=status||(cache.checkedAt?'后台采集于 '+dateTime(cache.checkedAt)+(delayed?' · 更新延迟，显示上次内容':''):'正在检查站内更新…');
    $('[data-briefing-refresh]').disabled=busy;$('[data-briefing-refresh]').textContent=busy?'正在检查…':'检查更新';
    page.querySelectorAll('[data-briefing-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.briefingCategory===category)));
    page.querySelectorAll('[data-briefing-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.briefingMode===mode)));
    page.querySelectorAll('[data-briefing-source]').forEach(input=>input.checked=pref.sources.includes(input.dataset.briefingSource));
    $('[data-briefing-subscription-count]').textContent='已订阅 '+pref.sources.length+' / '+SOURCES.length+' 个来源';
    $('[data-briefing-storage]').textContent=persistent?'阅读状态、收藏、自选与订阅保存在本机此浏览器，关闭后仍会保留；不跨设备同步，清除网站数据或结束无痕浏览后会丢失。':'浏览器存储不可用，本次设置仅在当前页面会话中保留。';
    renderSources();syncNotification();
  }
  function announce(items){if(!items.length||!pref.notify||!('Notification' in window)||Notification.permission!=='granted')return;
    const fresh=[...new Map(items.filter(item=>Date.parse(item.publishedAt)>pref.notifySince-120000).map(item=>[item.id,item])).values()];if(!fresh.length)return;
    const signature=fresh.map(i=>i.id).sort().join('|');try{if(localStorage.getItem('flyfish-briefing-last-notice')===signature)return;localStorage.setItem('flyfish-briefing-last-notice',signature);}catch{}
    try{const n=new Notification('每日看板 · '+fresh.length+' 条新消息',{body:fresh[0].title.slice(0,110),tag:'flyfish-briefing',icon:'/favicon.svg',silent:true});n.onclick=()=>{window.focus();if(window.FlyfishNavigator?.enabled)window.FlyfishNavigator.navigate('/briefing/');else location.href='/briefing/';n.close();};}catch{}
  }
  async function responseText(url,signal){const controller=new AbortController(),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});const timeout=setTimeout(abort,10000);try{const r=await fetch(url,{signal:controller.signal,credentials:'omit',cache:'no-cache'});if(!r.ok){const e=Error('HTTP '+r.status);e.status=r.status;if(r.status===429)e.retryAfter=r.headers.get('Retry-After');throw e;}const value=await r.text();if(value.length>4000000)throw Error('来源响应过大');return value;}finally{clearTimeout(timeout);signal?.removeEventListener('abort',abort);}}
  async function refresh(force=false){const watching=pref.notify&&('Notification' in window)&&Notification.permission==='granted';if(busy||(document.hidden&&!watching)||(!page&&!watching))return;
    const now=Date.now(),siteDue=now-siteAttempt>(force?60000:300000)&&(force||!cache.checkedAt||now-Date.parse(cache.checkedAt)>=300000);
    const directDue=()=>SOURCES.filter(s=>!s.serverOnly&&pref.sources.includes(s.id)&&now-(attempts.get(s.id)||0)>60000&&(force||!cache.sources[s.id]||now-Date.parse(cache.sources[s.id].fetchedAt)>=s.ttl));
    if(!directDue().length&&!siteDue){if(force){status='刚刚已检查过，稍后再试。';render();}return;}
    busy=true;status='正在检查更新…';refreshController=new AbortController();render();const fresh=[];
    if(siteDue){siteAttempt=now;try{
      const incoming=api.cleanSnapshot(JSON.parse(await responseText(page?.dataset.feedUrl||'/briefing/feed.json',refreshController.signal)));
      if(!incoming.checkedAt||!Object.keys(incoming.sources).length)throw Error('站内快照格式变化');
      if(refreshController.signal.aborted){busy=false;return;}
      for(const spec of SOURCES){const old=cache.sources[spec.id],next=incoming.sources[spec.id];if(old&&next&&pref.sources.includes(spec.id)){const known=new Set(old.items.map(i=>i.id+'|'+i.title));fresh.push(...next.items.filter(i=>!known.has(i.id+'|'+i.title)));}}
      mergeSnapshot(incoming);siteFailed=false;
    }catch(error){if(!refreshController.signal.aborted)siteFailed=true;}}
    if(refreshController.signal.aborted){busy=false;render();return;}const due=directDue();
    await Promise.all(due.map(async spec=>{
      attempts.set(spec.id,now);const old=cache.sources[spec.id];
      try{
        let parsed;try{parsed=api.parse(spec,await responseText(api.urlFor(spec),refreshController.signal),DOMParser);}catch(error){if(spec.id!=='daily'||refreshController.signal.aborted||(error.status&&error.status!==404))throw error;parsed=api.parse(spec,await responseText(api.urlFor(spec,now-86400000),refreshController.signal),DOMParser);}
        if(refreshController.signal.aborted)return;
        const known=new Set((old?.items||[]).map(i=>i.id+'|'+i.title));if(old)fresh.push(...parsed.items.filter(i=>!known.has(i.id+'|'+i.title)));
        cache.sources[spec.id]=parsed;errors.delete(spec.id);
      }catch(error){if(!refreshController.signal.aborted){errors.set(spec.id,error.message);const seconds=Number(error.retryAfter),delay=Number.isFinite(seconds)?seconds*1000:Date.parse(error.retryAfter)-Date.now();if(Number.isFinite(delay)&&delay>0)attempts.set(spec.id,Date.now()+Math.min(delay,3600000));}}
    }));
    const aborted=refreshController.signal.aborted;busy=false;if(aborted){render();if(page)refresh();return;}
    write(CACHE,cache);status=cache.checkedAt?'后台采集于 '+dateTime(cache.checkedAt):'已检查可直连来源';
    if(siteFailed)status+=' · 站内更新暂不可用，显示上次内容';else if(cache.checkedAt&&Date.now()-Date.parse(cache.checkedAt)>10800000)status+=' · 更新延迟，显示上次内容';
    if(errors.size||Object.values(cache.health||{}).some(h=>h.status!=='ok'))status+=' · 部分来源保留旧内容';announce(fresh);render();
  }
  let pageController=null;
  function init(){page=document.querySelector('[data-briefing]');if(!page)return;
    pageController=new AbortController();const signal=pageController.signal;category=new URLSearchParams(location.search).get('category')||'all';if(!CATEGORIES.some(c=>c[0]===category))category='all';mode='all';query='';limit=12;
    page.querySelectorAll('.briefing-subscription-group').forEach(group=>group.addEventListener('toggle',()=>{if(group.open)page?.querySelectorAll('.briefing-subscription-group').forEach(other=>{if(other!==group)other.open=false;});},{signal}));
    try{mergeSnapshot(api.cleanSnapshot(JSON.parse($('[data-briefing-seed]').textContent)));write(CACHE,cache);}catch{}
    const today=new Date();$('[data-briefing-date]').textContent=new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',weekday:'long',timeZone:'Asia/Shanghai'}).format(today);
    page.addEventListener('click',event=>{
      const cat=event.target.closest('[data-briefing-category]'),filter=event.target.closest('[data-briefing-mode]'),action=event.target.closest('[data-briefing-action]'),readLink=event.target.closest('[data-read-link]');
      if(cat){category=cat.dataset.briefingCategory;limit=12;const url=new URL(location.href);if(category==='all')url.searchParams.delete('category');else url.searchParams.set('category',category);history.replaceState(history.state,'',url);render();}
      if(filter){mode=filter.dataset.briefingMode;limit=12;render();}
      if(action){const id=action.dataset.itemId,item=entries().find(i=>i.id===id)||pref.saved[id];if(!item)return;const next=action.dataset.briefingAction==='read'?action.dataset.briefingAction:'save';
        if(next==='read'){if(pref.read[id])delete pref.read[id];else pref.read[id]=Date.now();}else{if(pref.saved[id])delete pref.saved[id];else{pref.saved[id]=item;const keys=Object.keys(pref.saved);if(keys.length>100)delete pref.saved[keys[0]];}}save();render();const replacement=Array.from(page.querySelectorAll('[data-briefing-action]')).find(b=>b.dataset.itemId===id&&b.dataset.briefingAction===action.dataset.briefingAction)||$('[data-briefing-action]');replacement?.focus({preventScroll:true});}
      if(readLink){pref.read[readLink.dataset.readLink]=Date.now();save();readLink.closest('.briefing-item')?.classList.add('is-read');requestAnimationFrame(()=>render());}
    },{signal});
    const search=$('[data-briefing-search]');search.value=query;
    search.addEventListener('input',event=>{query=event.target.value;limit=12;render();},{signal});
    const clearSearch=()=>{query='';search.value='';limit=12;render();search.focus({preventScroll:true});};
    $('[data-briefing-clear]').addEventListener('click',clearSearch,{signal});
    search.addEventListener('keydown',event=>{if(event.key==='Escape'&&query){event.preventDefault();event.stopPropagation();clearSearch();}},{signal});
    page.querySelectorAll('[data-briefing-source]').forEach(input=>input.addEventListener('change',()=>{pref.sources=Array.from(page.querySelectorAll('[data-briefing-source]:checked')).map(e=>e.dataset.briefingSource);save();limit=12;render();refresh();},{signal}));
    $('[data-briefing-refresh]').addEventListener('click',()=>refresh(true),{signal});
    $('[data-briefing-read-all]').addEventListener('click',()=>{selected().forEach(i=>pref.read[i.id]=Date.now());save();render();},{signal});
    $('[data-briefing-more]').addEventListener('click',()=>{limit+=12;render();},{signal});
    $('[data-briefing-notify]').addEventListener('click',async()=>{if(pref.notify){pref.notify=false;save();syncNotification();return;}if(!('Notification' in window))return;try{const permission=Notification.permission==='default'?await Notification.requestPermission():Notification.permission;if(permission==='granted'){pref.notify=true;pref.notifySince=Date.now();save();}syncNotification();}catch{$('[data-briefing-notify-status]').textContent='暂时无法开启，仍可通过未读列表查看新消息。';}},{signal});
    render();refresh();
  }
  function dispose(){pageController?.abort();page=null;if(!pref.notify)refreshController?.abort();}
  document.addEventListener('flyfish:before-page',dispose);document.addEventListener('flyfish:page',init);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  window.addEventListener('storage',event=>{if(event.key===CACHE){mergeSnapshot(api.cleanSnapshot(read(CACHE)));render();}if(event.key===PREFS){const other=read(PREFS);if(other){pref.read=other.read||{};pref.saved=savedItems(other.saved);pref.notify=other.notify===true;pref.notifySince=Number(other.notifySince)||0;render();}}});
  timer=setInterval(()=>refresh(),60000);window.addEventListener('pagehide',()=>{dispose();clearInterval(timer);});window.addEventListener('pageshow',event=>{if(event.persisted){clearInterval(timer);timer=setInterval(()=>refresh(),60000);init();}});
  init();
})();
