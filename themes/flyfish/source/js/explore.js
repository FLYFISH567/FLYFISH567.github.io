(() => {
  'use strict';
  const dialog=document.querySelector('#site-explore');
  if(!dialog||typeof dialog.showModal!=='function')return;
  const modes=Array.from(dialog.querySelectorAll('[data-explore-kind]'));
  const status=dialog.querySelector('[data-explore-status]'),preview=dialog.querySelector('[data-explore-preview]');
  const photo=dialog.querySelector('[data-explore-photo]'),image=photo.querySelector('img'),imageError=dialog.querySelector('[data-explore-image-error]');
  const go=dialog.querySelector('[data-explore-go]'),next=dialog.querySelector('[data-explore-next]');
  const key='flyfish-explore-recent';
  let catalog=null,pending=null,kind='all',opener=null,request=0,photoRequest=0,probe=null,imageTimer=0;
  const ideas=[
    {id:'idea:music',title:'给此刻选一首歌',summary:'打开音乐馆，挑一首想听的旋律。',url:dialog.dataset.musicUrl,action:'去音乐馆'},
    {id:'idea:anime',title:'看看故事清单',summary:'从追番列表里挑一部感兴趣的故事。',url:dialog.dataset.bangumiUrl,action:'去看追番'},
    {id:'idea:sky',title:'抬头看看天空',summary:'花一分钟看看窗外，留意云和光的颜色。'},
    {id:'idea:write',title:'记下一件小事',summary:'写一句今天遇到的有趣瞬间，长短都可以。'},
    {id:'idea:stretch',title:'站起来伸个懒腰',summary:'离开座位活动一下肩颈，给自己一点休息时间。'},
    {id:'idea:curiosity',title:'给好奇心十分钟',summary:'选一个刚刚想到的问题，花十分钟探索它。'},
    {id:'idea:water',title:'喝杯水，慢一会儿',summary:'放下手里的事，给自己倒一杯水。'},
    {id:'idea:photo',title:'收藏一片光',summary:'用相机记录身边的一束光或一个喜欢的角落。'}
  ];
  let recent=[];
  try{const value=JSON.parse(sessionStorage.getItem(key)||'[]');if(Array.isArray(value))recent=value.filter(id=>typeof id==='string').slice(-12);}catch{}
  function stopImage(){
    ++photoRequest;clearTimeout(imageTimer);if(probe){probe.onload=null;probe.onerror=null;probe=null;}
  }
  function safeEntry(entry){
    if(!entry||!['article','photo'].includes(entry.kind)||typeof entry.id!=='string'||typeof entry.title!=='string'||typeof entry.url!=='string'||(entry.kind==='photo'&&typeof entry.image!=='string'))return false;
    try{
      const url=new URL(entry.url,location.href);
      if(url.origin!==location.origin||!['http:','https:'].includes(url.protocol))return false;
      if(entry.kind==='photo'&&!['http:','https:'].includes(new URL(entry.image,location.href).protocol))return false;
      return true;
    }catch{return false;}
  }
  async function load(){
    if(catalog)return catalog;
    if(!pending){
      const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
      pending=fetch(dialog.dataset.exploreIndex,{signal:controller.signal,cache:'no-cache'}).then(response=>{if(!response.ok)throw Error('index');return response.json();}).then(data=>{
        if(!Array.isArray(data.items))throw Error('index');catalog=data.items.filter(safeEntry);return catalog;
      }).catch(error=>{pending=null;throw error;}).finally(()=>clearTimeout(timeout));
    }
    return pending;
  }
  function pick(items){
    const eligible=items.filter(item=>{
      if(kind!=='all'&&item.kind!==kind)return false;
      const url=new URL(item.url,location.href);
      return item.kind==='article'?url.pathname!==location.pathname:url.pathname+url.hash!==location.pathname+location.hash;
    });
    const last=recent.at(-1);
    let options=eligible.filter(item=>!recent.includes(item.id));
    if(!options.length)options=eligible.filter(item=>item.id!==last);
    if(!options.length)options=eligible;
    if(!options.length)return null;
    if(kind==='all'){
      const groups=['article','photo'].map(type=>options.filter(item=>item.kind===type)).filter(group=>group.length);
      options=groups[Math.floor(Math.random()*groups.length)];
    }
    return options[Math.floor(Math.random()*options.length)];
  }
  function show(entry){
    stopImage();preview.hidden=false;preview.dataset.kind=entry.kind;go.hidden=false;go.href=entry.url;
    dialog.querySelector('[data-explore-label]').textContent=(entry.kind==='article'?'一篇笔记':'一张照片')+' / '+(entry.label||'');
    dialog.querySelector('[data-explore-heading]').textContent=entry.title;
    dialog.querySelector('[data-explore-summary]').textContent=entry.kind==='article'?(entry.summary||''):'';
    const time=dialog.querySelector('[data-explore-date]');time.textContent=entry.date||'';time.dateTime=(entry.date||'').replaceAll('.','-');
    go.textContent=entry.kind==='article'?'读这篇':'去相册看看';photo.hidden=entry.kind!=='photo';
    status.textContent=entry.kind==='article'?'翻到一篇笔记。':'翻到一张照片。';
    if(entry.kind==='photo'){
      const ticket=++photoRequest;image.hidden=true;imageError.hidden=true;photo.classList.add('is-loading');
      const failed=()=>{if(ticket!==photoRequest||!dialog.open)return;++photoRequest;clearTimeout(imageTimer);if(probe){probe.onload=probe.onerror=null;probe=null;}photo.classList.remove('is-loading');imageError.hidden=false;};
      probe=new Image();probe.onload=()=>{
        if(ticket!==photoRequest||!dialog.open)return;
        clearTimeout(imageTimer);image.src=entry.image;image.alt=entry.title+' · '+(entry.label||'相册');image.hidden=false;imageError.hidden=true;photo.classList.remove('is-loading');if(probe){probe.onload=probe.onerror=null;probe=null;}
      };
      probe.onerror=failed;imageTimer=setTimeout(failed,10000);probe.src=entry.image;
    }
  }
  function showIdea() {
    const options=ideas.filter(item=>item.id!==recent.at(-1));
    const item=options[Math.floor(Math.random()*options.length)];
    recent=[...recent.filter(id=>id!==item.id),item.id].slice(-12);
    try{sessionStorage.setItem(key,JSON.stringify(recent));}catch{}
    stopImage();preview.hidden=false;preview.dataset.kind='idea';photo.hidden=true;
    dialog.querySelector('[data-explore-label]').textContent='灵感扭蛋 / 一件小事';
    dialog.querySelector('[data-explore-heading]').textContent=item.title;
    dialog.querySelector('[data-explore-summary]').textContent=item.summary;
    const time=dialog.querySelector('[data-explore-date]');time.textContent='';time.removeAttribute('datetime');
    go.hidden=!item.url;if(item.url){go.href=item.url;go.textContent=item.action;}else go.removeAttribute('href');
    status.textContent='给今天一点小灵感。';
  }
  async function choose(){
    const ticket=++request;stopImage();next.disabled=true;go.hidden=true;dialog.setAttribute('aria-busy','true');status.textContent='正在挑选…';
    try{
      if(kind==='idea'){showIdea();next.querySelector('span').textContent='换一个';return;}
      const items=await load();if(ticket!==request||!dialog.open)return;
      const entry=pick(items);
      if(!entry){preview.hidden=true;status.textContent='这一类暂时没有可逛的内容，换一种试试。';return;}
      recent=[...recent.filter(id=>id!==entry.id),entry.id].slice(-12);
      try{sessionStorage.setItem(key,JSON.stringify(recent));}catch{}
      show(entry);next.querySelector('span').textContent='换一个';
    }catch{
      if(ticket!==request||!dialog.open)return;
      preview.hidden=true;status.textContent='暂时没有挑选成功，再试一次吧。';next.querySelector('span').textContent='重试';
    }finally{if(ticket===request){next.disabled=false;dialog.setAttribute('aria-busy','false');}}
  }
  function revealOpeners(){document.querySelectorAll('[data-open-explore]').forEach(button=>{button.hidden=false;});}
  revealOpeners();
  document.addEventListener('flyfish:page',revealOpeners);
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-open-explore]');
    if(!button||document.querySelector('dialog[open]'))return;
    opener=button;kind=button.dataset.exploreMode==='idea'?'idea':'all';
    modes.forEach(mode=>mode.setAttribute('aria-pressed',String(mode.dataset.exploreKind===kind)));
    dialog.showModal();document.body.classList.add('dialog-open');
    modes.find(mode=>mode.dataset.exploreKind===kind)?.focus();choose();
  });
  modes.forEach(button=>button.addEventListener('click',()=>{
    kind=button.dataset.exploreKind;modes.forEach(mode=>mode.setAttribute('aria-pressed',String(mode===button)));choose();
  }));
  next.addEventListener('click',choose);
  dialog.querySelector('.explore-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();});
  dialog.addEventListener('close',()=>{
    ++request;stopImage();image.removeAttribute('src');preview.hidden=true;go.hidden=true;next.disabled=false;dialog.setAttribute('aria-busy','false');
    if(!document.querySelector('dialog[open]'))document.body.classList.remove('dialog-open');opener?.focus();
  });
})();
