(() => {
  'use strict';
  if(window.FlyfishSeasonalAtmosphere)return;
  const root=document.documentElement,key='flyfish-seasonal-atmosphere',footer=document.querySelector('.site-footer');
  if(!footer)return;
  const labels={auto:'跟随季节',spring:'春日花瓣',summer:'夏夜流萤',autumn:'秋日落叶',winter:'冬日飘雪',off:'关闭'},times={morning:'清晨',day:'白昼',evening:'黄昏',night:'夜晚'};
  const valid=value=>value==='on'?'auto':Object.hasOwn(labels,value)?value:'off';
  let mode='off',timer=0,signature='';try{mode=valid(localStorage.getItem(key));}catch{}
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const controls=document.createElement('div');controls.className='seasonal-controls';
  controls.innerHTML='<details class="seasonal-settings"><summary>四季氛围<span data-seasonal-label></span></summary><div class="seasonal-panel"><p class="seasonal-panel-title">给小站换一种时节</p><div role="group" aria-label="季节氛围"></div><p data-seasonal-note></p></div></details>';
  footer.append(controls);const details=controls.querySelector('details'),label=controls.querySelector('[data-seasonal-label]'),note=controls.querySelector('[data-seasonal-note]'),group=controls.querySelector('[role=group]');
  const layer=document.createElement('div');layer.className='seasonal-particles';layer.setAttribute('aria-hidden','true');layer.hidden=true;document.body.append(layer);
  for(const id of ['off','auto','spring','summer','autumn','winter']){const button=document.createElement('button');button.type='button';button.dataset.seasonalMode=id;button.textContent=labels[id];button.addEventListener('click',()=>{mode=id;try{localStorage.setItem(key,id);}catch{}update();});group.append(button);}
  function syncParticles(){
    const quiet=mode==='off'||document.hidden||reduced?.matches||root.dataset.effects==='light'||root.dataset.opening||!!document.querySelector('dialog[open]');
    layer.hidden=!!quiet;
    if(quiet)return;
    const season=root.dataset.atmosphereSeason,count=innerWidth<611?8:root.dataset.effects==='lively'?18:12,next=season+count;
    if(signature===next)return;signature=next;layer.replaceChildren();layer.dataset.season=season;
    for(let i=0;i<count;i++){
      const particle=document.createElement('span'),shape=document.createElement('i');particle.append(shape);
      particle.style.cssText=`--x:${i%2?88+Math.random()*11:1+Math.random()*11}vw;--s:${season==='summer'?3+Math.random()*3:5+Math.random()*7}px;--duration:${16+Math.random()*16}s;--delay:${-Math.random()*32}s;--drift:${Math.round((Math.random()-.5)*100)}px;--turn:${Math.round(Math.random()*300)}deg`;
      layer.append(particle);
    }
  }
  function update(){
    clearTimeout(timer);timer=0;
    group.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.seasonalMode===mode)));
    if(mode==='off'){delete root.dataset.atmosphereSeason;delete root.dataset.atmosphereTime;delete root.dataset.atmosphereFestival;label.textContent=' · 关';note.textContent='开启后，花瓣、流萤、落叶或雪花会轻轻经过页面边缘。';syncParticles();return;}
    const now=new Date(),month=now.getMonth(),hour=now.getHours(),season=mode==='auto'?(month<=1||month===11?'winter':month<=4?'spring':month<=7?'summer':'autumn'):mode;
    const time=hour>=5&&hour<10?'morning':hour>=10&&hour<17?'day':hour>=17&&hour<20?'evening':'night';
    root.dataset.atmosphereSeason=season;root.dataset.atmosphereTime=time;
    const festival={'1-1':['new-year','元旦'],'10-1':['national-day','国庆'],'12-25':['christmas','圣诞']}[`${month+1}-${now.getDate()}`];
    if(festival)root.dataset.atmosphereFestival=festival[0];else delete root.dataset.atmosphereFestival;
    label.textContent=` · ${labels[season]} · ${times[time]}`;
    note.textContent=reduced?.matches||root.dataset.effects==='light'?'当前保留静态氛围；动态点缀已跟随动效偏好暂停。':`${mode==='auto'?'按本地日期自动换季，也可手动预览。':'正在预览'+labels[season]+'。'}${festival?' 今天有'+festival[1]+'的色彩点缀。':''}`;
    syncParticles();if(!document.hidden){const next=new Date(now);next.setMinutes(60,0,0);timer=setTimeout(update,Math.max(1000,next-now));}
  }
  window.addEventListener('storage',event=>{if(event.key===key){mode=valid(event.newValue);update();}});
  document.addEventListener('visibilitychange',update);document.addEventListener('flyfish:effectschange',update);
  document.addEventListener('flyfish:page',()=>{details.open=false;update();});
  window.addEventListener('resize',syncParticles);window.addEventListener('pageshow',update);window.addEventListener('pagehide',()=>{clearTimeout(timer);timer=0;layer.hidden=true;});
  reduced?.addEventListener('change',update);
  new MutationObserver(syncParticles).observe(root,{attributes:true,attributeFilter:['data-opening','data-effects']});
  document.querySelectorAll('dialog').forEach(dialog=>new MutationObserver(syncParticles).observe(dialog,{attributes:true,attributeFilter:['open']}));
  window.FlyfishSeasonalAtmosphere=true;update();
})();
