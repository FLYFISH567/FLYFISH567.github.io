(() => {
  'use strict';
  if(window.FlyfishSeasonalAtmosphere)return;
  const root=document.documentElement,key='flyfish-seasonal-atmosphere';
  let enabled=false,timer=0;
  try{enabled=localStorage.getItem(key)==='on';}catch{}
  const seasons=['冬','春','夏','秋'],times={morning:'清晨',day:'白昼',evening:'黄昏',night:'夜晚'};
  const festivals={'1-1':['new-year','元旦'],'10-1':['national-day','国庆'],'12-25':['christmas','圣诞']};
  const button=document.createElement('button');
  button.type='button';button.className='seasonal-toggle';button.setAttribute('aria-pressed','false');
  const target=document.querySelector('.theme-toggle');
  if(!target)return;
  target.before(button);
  function update(){
    clearTimeout(timer);timer=0;
    if(!enabled){
      delete root.dataset.atmosphereSeason;delete root.dataset.atmosphereTime;delete root.dataset.atmosphereFestival;
      button.textContent='时光氛围 · 关';button.title='开启随季节和时间变化的背景氛围';
      button.setAttribute('aria-label','开启时光氛围');button.setAttribute('aria-pressed','false');return;
    }
    const now=new Date(),month=now.getMonth(),hour=now.getHours();
    const season=month<=1||month===11?'winter':month<=4?'spring':month<=7?'summer':'autumn';
    const seasonLabel=seasons[season==='winter'?0:season==='spring'?1:season==='summer'?2:3];
    const time=hour>=5&&hour<10?'morning':hour>=10&&hour<17?'day':hour>=17&&hour<20?'evening':'night';
    root.dataset.atmosphereSeason=season;root.dataset.atmosphereTime=time;
    const festival=festivals[`${month+1}-${now.getDate()}`];
    if(festival)root.dataset.atmosphereFestival=festival[0];else delete root.dataset.atmosphereFestival;
    button.textContent=`${festival?festival[1]:seasonLabel} · ${times[time]}`;button.title='关闭随季节和时间变化的背景氛围';
    button.setAttribute('aria-label',`关闭时光氛围，当前${seasonLabel}季${times[time]}${festival?'，'+festival[1]+'点缀':''}`);button.setAttribute('aria-pressed','true');
    if(!document.hidden){
      const next=new Date(now);next.setMinutes(60,0,0);
      timer=setTimeout(update,Math.max(1000,next-now));
    }
  }
  button.addEventListener('click',()=>{enabled=!enabled;try{localStorage.setItem(key,enabled?'on':'off');}catch{}update();});
  window.addEventListener('storage',event=>{if(event.key===key){enabled=event.newValue==='on';update();}});
  document.addEventListener('visibilitychange',update);
  document.addEventListener('flyfish:page',update);
  window.addEventListener('pageshow',update);
  window.addEventListener('pagehide',()=>{clearTimeout(timer);timer=0;});
  window.FlyfishSeasonalAtmosphere=true;update();
})();
