(() => {
  'use strict';
  if(window.FlyfishSeasonalAtmosphere)return;
  const root=document.documentElement,key='flyfish-seasonal-atmosphere',footer=document.querySelector('.site-footer');
  if(!footer)return;
  const labels={auto:'跟随季节',spring:'春日花瓣',summer:'夏夜流萤',autumn:'秋日落叶',winter:'冬日飘雪',off:'关闭'},times={morning:'清晨',day:'白昼',evening:'黄昏',night:'夜晚'};
  const valid=value=>value==='on'?'auto':Object.hasOwn(labels,value)?value:'off';
  let mode='off',timer=0,signature='',pageHidden=false,frame=0,lastFrame=0,windGroups=[];try{mode=valid(localStorage.getItem(key));}catch{}
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  // One shared environment drives all particles. Values are in pixels per second.
  const climates={spring:{speed:5,gust:10},summer:{speed:2.5,gust:5},autumn:{speed:7,gust:16},winter:{speed:6,gust:12}};
  const wind={direction:1,speed:0,strength:0,gust:false,gustStrength:0,target:1,changeIn:0,gustIn:18+Math.random()*25,gustTime:0,gustDuration:0};
  function stopWind(){if(frame)clearTimeout(frame);frame=0;lastFrame=0;}
  function tickWind(){
    frame=0;if(layer.hidden||pageHidden)return;
    frame=setTimeout(tickWind,250);
    // CSS interpolates between infrequent updates without a continuous JS frame loop.
    const time=performance.now();
    const dt=lastFrame?Math.min((time-lastFrame)/1000,.3):0;lastFrame=time;
    const climate=climates[layer.dataset.season];if(!climate)return;
    wind.changeIn-=dt;
    if(wind.changeIn<=0){wind.target=(Math.random()*2-1);wind.changeIn=12+Math.random()*18;}
    wind.direction+=(wind.target-wind.direction)*Math.min(1,dt*.08);
    wind.strength+=(.55+Math.sin(time/9000)*.2-wind.strength)*Math.min(1,dt*.16);
    wind.gustIn-=dt;
    if(!wind.gust&&wind.gustIn<=0){wind.gust=true;wind.gustTime=0;wind.gustDuration=4+Math.random()*4;}
    if(wind.gust){wind.gustTime+=dt;wind.gustStrength=Math.sin(Math.PI*Math.min(1,wind.gustTime/wind.gustDuration));if(wind.gustTime>=wind.gustDuration){wind.gust=false;wind.gustStrength=0;wind.gustIn=25+Math.random()*35;}}
    wind.speed=climate.speed*wind.strength+climate.gust*wind.gustStrength;
    for(const group of windGroups){
      // A soft boundary keeps the motion in the page margins without a visible wrap.
      const edge=Math.max(0,1-Math.abs(group.offset)/150);
      const response=group.response*(1+group.gustResponse*wind.gustStrength);
      group.offset=Math.max(-150,Math.min(150,group.offset+wind.direction*wind.speed*response*dt*(Math.sign(wind.direction)===Math.sign(group.offset)?edge:1)));
      group.el.style.transform=`translate3d(${group.offset.toFixed(2)}px,0,0)`;
    }
  }
  const controls=document.createElement('div');controls.className='seasonal-controls';
  controls.innerHTML='<details class="seasonal-settings"><summary>四季氛围<span data-seasonal-label></span></summary><div class="seasonal-panel"><p class="seasonal-panel-title">给小站换一种时节</p><div role="group" aria-label="季节氛围"></div><p data-seasonal-note></p></div></details>';
  footer.append(controls);const details=controls.querySelector('details'),label=controls.querySelector('[data-seasonal-label]'),note=controls.querySelector('[data-seasonal-note]'),group=controls.querySelector('[role=group]');
  const layer=document.createElement('div');layer.className='seasonal-particles';layer.setAttribute('aria-hidden','true');layer.hidden=true;document.body.append(layer);
  for(const id of ['off','auto','spring','summer','autumn','winter']){const button=document.createElement('button');button.type='button';button.dataset.seasonalMode=id;button.textContent=labels[id];button.addEventListener('click',()=>{mode=id;try{localStorage.setItem(key,id);}catch{}update();});group.append(button);}
  function syncParticles(){
    const quiet=mode==='off'||pageHidden||document.hidden||reduced?.matches||root.dataset.effects==='light'||root.dataset.opening||!!document.querySelector('dialog[open]');
    layer.hidden=!!quiet;
    if(quiet){stopWind();return;}
    const season=root.dataset.atmosphereSeason,count=innerWidth<611?8:root.dataset.effects==='lively'?18:12,next=season+count;
    if(signature===next){if(!frame)frame=setTimeout(tickWind,250);return;}signature=next;layer.replaceChildren();layer.dataset.season=season;
    windGroups=[.55,.9,1.25].map((response,index)=>{const el=document.createElement('div');el.className='seasonal-wind-group';layer.append(el);return {el,offset:0,response,gustResponse:index===2?.55:0};});
    for(let i=0;i<count;i++){
      const particle=document.createElement('span'),track=document.createElement('span'),shape=document.createElement('i');track.className='seasonal-track';track.append(shape);particle.append(track);
      if(season==='winter'){
        const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.3');svg.setAttribute('stroke-linecap','round');
        const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d','M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7M9 4l3 3 3-3M9 20l3-3 3 3M3.6 10.6l4.1-1.1-1.1-4.1M20.4 13.4l-4.1 1.1 1.1 4.1M6.6 18.6l1.1-4.1-4.1-1.1M17.4 5.4l-1.1 4.1 4.1 1.1');svg.append(path);shape.append(svg);
      }
      const size=season==='summer'?3+Math.random()*3:season==='winter'?9+Math.random()*13:5+Math.random()*7;
      const duration=season==='summer'?20+Math.random()*16:season==='winter'?18+(22-size)*1.2+Math.random()*8:16+Math.random()*16;
      particle.style.cssText=`--x:${i%2?88+Math.random()*11:1+Math.random()*11}vw;--s:${size}px;--duration:${duration}s;--delay:${-Math.random()*duration}s;--drift:${Math.round((Math.random()-.5)*100)}px;--turn:${Math.round(Math.random()*300)}deg;--flutter:${4+Math.random()*4}s;--float-x:${12+Math.random()*24}px`;
      if(season==='autumn'&&i%4===0)particle.classList.add('seasonal-twirl');
      const group=season==='winter'?Math.min(2,Math.floor((size-9)/13*3)):i%4===0?2:i%2;
      windGroups[group].el.append(particle);
    }
    if(!frame)frame=setTimeout(tickWind,250);
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
    syncParticles();if(!pageHidden&&!document.hidden){const next=new Date(now);next.setMinutes(60,0,0);timer=setTimeout(update,Math.max(1000,next-now));}
  }
  window.addEventListener('storage',event=>{if(event.key===key){mode=valid(event.newValue);update();}});
  document.addEventListener('visibilitychange',update);document.addEventListener('flyfish:effectschange',update);
  document.addEventListener('flyfish:page',()=>{details.open=false;update();});
  window.addEventListener('resize',syncParticles);window.addEventListener('pageshow',()=>{pageHidden=false;update();});window.addEventListener('pagehide',()=>{pageHidden=true;clearTimeout(timer);timer=0;layer.hidden=true;stopWind();});
  reduced?.addEventListener('change',update);
  new MutationObserver(syncParticles).observe(root,{attributes:true,attributeFilter:['data-opening','data-effects']});
  const dialogObserver=new MutationObserver(syncParticles);
  function observeDialogs(){dialogObserver.disconnect();document.querySelectorAll('dialog').forEach(dialog=>dialogObserver.observe(dialog,{attributes:true,attributeFilter:['open']}));}
  document.addEventListener('flyfish:page',observeDialogs);observeDialogs();
  window.FlyfishSeasonalAtmosphere=true;update();
})();
