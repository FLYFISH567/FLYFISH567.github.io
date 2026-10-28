(() => {
  'use strict';
  const api=window.FlyfishMarketData;if(!api)return;
  const CACHE='flyfish-market-cache-v2',PREF='flyfish-market-prefs-v2',INTERVAL=60000;
  let page=null,events=null,controller=null,timer=0,ticket=0,busy=false,storageOK=true,inFlight=null;
  const attempted=new Map(),failed=new Set();let checkedAt='';
  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{storageOK=false;return null;}}
  function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{storageOK=false;}}
  const old=read('flyfish-briefing-prefs-v1'),stored=read(PREF);
  let watch=api.selection(stored?.watch||old?.markets);if(!watch.length)watch=api.DEFAULTS.slice();
  let group=stored?.group==='watch'||api.GROUPS.some(g=>g.id===stored?.group)?stored.group:'watch';
  let expanded=stored?.expanded!==false;
  let cache=api.cleanSnapshot(read(CACHE));
  const $=selector=>page?.querySelector(selector);
  const element=(tag,value,cls)=>{const node=document.createElement(tag);node.textContent=value;if(cls)node.className=cls;return node;};
  const time=value=>new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value));
  function save(){write(PREF,{watch,group,expanded});}
  function cancel(){controller?.abort();if(inFlight)for(const id of inFlight.ids)if(attempted.get(id)===inFlight.at)attempted.delete(id);inFlight=null;ticket++;busy=false;}
  function activeIds(){return group==='watch'?watch:api.MARKETS.filter(m=>m.group===group).map(m=>m.id);}
  function pick(){page.querySelectorAll('[name=market]').forEach(input=>input.checked=watch.includes(input.value));}
  function render(){if(!page?.isConnected)return;
    const host=$('[data-market-grid]'),fragment=document.createDocumentFragment();
    for(const id of activeIds()){
      const market=api.byId(id),quote=cache.quotes[id],direction=quote?.percent>0?'is-up':quote?.percent<0?'is-down':'is-flat';
      const card=element('article','','market-quote pointer-surface '+direction);card.dataset.marketId=id;card.dataset.pointerLight='';card.setAttribute('aria-label',market.name);
      const heading=element('div','','market-quote-heading'),name=element('h3',market.name),region=element('span',api.GROUPS.find(g=>g.id===market.group).short);name.title=market.description;heading.append(name,region);
      const price=element('div','','market-price');price.append(element('strong',quote?quote.price.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):'—'));if(market.unit!=='点')price.append(element('small',market.unit));
      const change=element('div','','market-change');if(quote){change.append(element('span',(quote.change>0?'+':'')+quote.change.toFixed(2)),element('span',(quote.percent>0?'+':'')+quote.percent.toFixed(2)+'%','market-percent'));}else change.textContent=failed.has(id)?'暂时无法获取':'正在读取报价';
      const footer=element('footer',''),stamp=element('time',quote?api.quoteTime(quote.quotedAt):'暂无报价时间');
      if(quote){stamp.dateTime=quote.quotedAt;stamp.title=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',dateStyle:'full',timeStyle:'medium',hour12:false}).format(new Date(quote.quotedAt))+' · '+(market.provider==='tencent'?'腾讯财经':'华尔街见闻');}
      footer.append(stamp);if(failed.has(id)&&quote)footer.append(element('span','缓存','market-cached'));
      card.append(heading,price,change,footer);fragment.append(card);
    }
    host.replaceChildren(fragment);$('[data-markets-content]').hidden=!expanded;$('[data-markets-toggle]').textContent=expanded?'收起':'展开';$('[data-markets-toggle]').setAttribute('aria-expanded',String(expanded));
    page.querySelectorAll('[data-market-group]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.marketGroup===group)));
    $('[data-market-refresh]').disabled=busy||!expanded;
    $('[data-market-status]').textContent=busy?'正在更新…':checkedAt?'检查于 '+time(checkedAt):'报价时间见各卡片';
    if(!storageOK)$('[data-market-feedback]').textContent='浏览器存储不可用，自选仅保留在本次会话。';
  }
  async function request(provider,ids,signal){
    const response=await fetch(api.requestURL(provider,ids),{signal,credentials:'omit'});if(!response.ok)throw Error('HTTP '+response.status);
    if(provider==='tencent'){const buffer=await response.arrayBuffer();if(buffer.byteLength>500000)throw Error('Response too large');return api.parseTencent(new TextDecoder('gb18030').decode(buffer));}
    const body=await response.text();if(body.length>500000)throw Error('Response too large');return api.parseWscn(body);
  }
  async function refresh(){
    if(!page||!expanded||document.hidden||busy)return;
    const ids=activeIds(),due=ids.filter(id=>Date.now()-(attempted.get(id)||0)>=INTERVAL);if(!due.length)return;
    controller?.abort();const run=++ticket,own=new AbortController();controller=own;busy=true;render();
    const timeout=setTimeout(()=>own.abort(),10000),now=Date.now();due.forEach(id=>attempted.set(id,now));inFlight={ids:due,at:now};
    await Promise.all(['tencent','wscn'].map(async provider=>{
      const targets=due.filter(id=>api.byId(id).provider===provider);if(!targets.length)return;
      try{const quotes=await request(provider,targets,own.signal);if(run!==ticket||!page)return;
        for(const id of targets){const next=quotes[id],previous=cache.quotes[id];if(!next||Date.parse(next.quotedAt)>Date.now()+600000){failed.add(id);continue;}
          if(!previous||Date.parse(next.quotedAt)>=Date.parse(previous.quotedAt))cache.quotes[id]=next;failed.delete(id);
        }
      }catch{if(run===ticket&&page)targets.forEach(id=>failed.add(id));}
    }));
    clearTimeout(timeout);if(run!==ticket||!page)return;inFlight=null;busy=false;checkedAt=new Date().toISOString();cache.fetchedAt=checkedAt;write(CACHE,cache);render();
  }
  function picker(open){$('[data-market-form]').hidden=!open;$('[data-market-manage]').setAttribute('aria-expanded',String(open));if(open)pick();}
  function init(){
    page=document.querySelector('[data-markets]');if(!page)return;events=new AbortController();const signal=events.signal;
    try{const seed=api.cleanSnapshot(JSON.parse($('[data-market-seed]').textContent));for(const [id,quote] of Object.entries(seed.quotes))if(!cache.quotes[id]||Date.parse(quote.quotedAt)>Date.parse(cache.quotes[id].quotedAt))cache.quotes[id]=quote;}catch{}
    page.addEventListener('click',event=>{
      const tab=event.target.closest('[data-market-group]');if(tab){cancel();group=tab.dataset.marketGroup;save();render();refresh();}
      if(event.target.closest('[data-market-manage]'))picker($('[data-market-form]').hidden);
      if(event.target.closest('[data-market-cancel]'))picker(false);
      if(event.target.closest('[data-market-defaults]'))page.querySelectorAll('[name=market]').forEach(input=>input.checked=api.DEFAULTS.includes(input.value));
      if(event.target.closest('[data-market-refresh]'))refresh();
      if(event.target.closest('[data-markets-toggle]')){expanded=!expanded;if(!expanded)cancel();save();render();if(expanded)refresh();}
    },{signal});
    $('[data-market-form]').addEventListener('submit',event=>{event.preventDefault();const next=api.selection(Array.from(page.querySelectorAll('[name=market]:checked')).map(input=>input.value));if(!next.length){$('[data-market-feedback]').textContent='至少选择一项，再保存自选。';return;}cancel();watch=next;group='watch';save();picker(false);render();refresh();$('[data-market-manage]').focus({preventScroll:true});},{signal});
    render();refresh();timer=setInterval(refresh,INTERVAL);
  }
  function dispose(){events?.abort();cancel();clearInterval(timer);page=null;}
  document.addEventListener('flyfish:before-page',dispose);document.addEventListener('flyfish:page',init);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  window.addEventListener('pagehide',dispose);window.addEventListener('pageshow',event=>{if(event.persisted)init();});
  init();
})();
