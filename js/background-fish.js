(() => {
  'use strict';
  const ocean=document.querySelector('[data-background-fish]');
  if(!ocean||ocean.dataset.ready)return;
  const template=ocean.querySelector('[data-fish-template]');
  if(!template)return;
  ocean.dataset.ready='true';
  const root=document.documentElement,control=document.querySelector('[data-fish-control]');
  const settings=document.querySelector('[data-fish-settings]'),effectsSettings=document.querySelector('[data-effects-settings]'),summonButton=document.querySelector('[data-fish-summon]');
  const countLabel=document.querySelector('[data-fish-count]'),note=document.querySelector('[data-fish-note]');
  const summonStatus=document.querySelector('[data-fish-summon-status]');
  const choices=Array.from(document.querySelectorAll('[data-fish-mode]'));
  const customForm=document.querySelector('[data-fish-custom-form]'),customInput=document.querySelector('[data-fish-custom]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mouse=matchMedia('(hover:hover) and (pointer:fine)');
  // 所有入口（预设、自定义、存储）共用上限；仅保留一个动画循环，鱼之间可自由交错。
  const key='flyfish-fish-mode',maxFish=12;
  const validMode=value=>value==='auto'||value==='off'||(typeof value==='string'&&/^[1-9]\d*$/.test(value)&&Number(value)<=maxFish);
  let mode='6';try{const saved=localStorage.getItem(key);if(validMode(saved))mode=saved;}catch{}
  // 手动数量优先；动效档位只控制自动模式的密度，以及下面的游速。
  const automaticCount=()=>{
    const counts=width>=1400&&height>=680?[2,6,9]:width>=960&&height>=540?[2,4,6]:[1,1,2];
    return counts[root.dataset.effects==='light'?0:root.dataset.effects==='lively'?2:1];
  };
  if(customInput)customInput.max=String(maxFish);
  const avoid='.site-header,.post-card,.side-panel,.reading-panel,.illustrated-heading,.life-nav,.album-card,.photo-grid,.show-card,.now-playing,.player-shell,.about-profile,.about-section,.about-facts,.about-more,.about-intro,.about-favourites,.now-card,.about-footprints,.intro-copy>*,.sky-cover,.section-heading,.pagination,.hub-controls,.topic-filters,.album-filters,.watch-tabs,.filter-status,.watch-count,.site-footer,.fish-settings[open],.fish-settings[open] .fish-settings-panel,.effects-settings[open] .effects-panel,.music-dock,.music-controls,.navigation-notice';
  const pool=[],size=44,fishHeight=36,margin=8;
  const bearing=Math.random()*Math.PI*2,goldenAngle=Math.PI*(3-Math.sqrt(5));
  let width=innerWidth,height=innerHeight,top=86,boxes=[],spaces=[],capacity=0,autoCapacity=0,autoCap=1;
  let dirty=true,frame=0,last=0,pageHidden=false,suspended=false,scrollUntil=0,summonUntil=0,scrollTimer=0;
  let clock=performance.now(),dialogOpen=false,summonSerial=0,controlsAt=Infinity,feedbackUntil=0,feedback='';
  const clamp=(value,min,max)=>Math.max(min,Math.min(value,Math.max(min,max)));
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const active=()=>pool.filter(fish=>fish.active);
  const engaged=fish=>fish.held||fish.hovered||fish.focused||fish.paused;
  const bounds=point=>({x:clamp(point.x,margin,width-size-margin),y:clamp(point.y,top,height-fishHeight-margin)});
  const covered=point=>boxes.some(rect=>point.x+size-5>rect.left-3&&point.x+5<rect.right+3&&point.y+fishHeight-4>rect.top-3&&point.y+4<rect.bottom+3);
  function clearPath(from,to){
    const steps=Math.max(1,Math.ceil(distance(from,to)/16));
    for(let step=1;step<=steps;step++){
      const point={x:from.x+(to.x-from.x)*step/steps,y:from.y+(to.y-from.y)*step/steps};
      if(covered(point))return false;
    }
    return true;
  }
  function available(near=null){
    const candidates=spaces.slice();
    if(near)candidates.sort((a,b)=>distance(a,near)-distance(b,near));
    return candidates.length?candidates[near?0:Math.floor(Math.random()*candidates.length)]:null;
  }
  function birthplace(fish){
    // 只在出生或自动迁回留白时分散摆放；游动中不检查鱼与鱼的碰撞。
    const peers=active().filter(other=>other!==fish&&!covered(other));
    if(!peers.length)return available();
    let best=null,score=-Infinity;
    for(const point of spaces){
      const separation=Math.min(...peers.map(other=>distance(point,other)));
      const value=separation+Math.random()*12;
      if(value>score){score=value;best=point;}
    }
    return best;
  }
  function summonPlace(near,fish){
    // 仅在召唤落点分散摆放，不增加鱼之间的碰撞或追逐逻辑。
    const peers=active().filter(other=>other!==fish&&!covered(other));
    const candidates=spaces.filter(point=>distance(point,near)<420&&peers.every(other=>distance(point,other)>=(other.calledUntil>clock?84:60)))
      .sort((a,b)=>distance(a,near)-distance(b,near)).slice(0,8);
    return candidates.length?candidates[Math.floor(Math.random()*candidates.length)]:null;
  }
  function waypoint(fish){
    // 每条鱼有自己的航程、方向和随机选择，不再都奔向同一个最远端点。
    const candidates=spaces.filter(point=>distance(point,fish)>60&&distance(point,fish)<900).map(point=>{
      const length=distance(point,fish),alignment=((point.x-fish.x)*fish.heading.x+(point.y-fish.y)*fish.heading.y)/length;
      const novelty=fish.trail.length?Math.min(180,...fish.trail.map(previous=>distance(point,previous))):120;
      return {point,score:alignment*90+novelty*.6-Math.abs(length-fish.cruise)*.4+Math.random()*90};
    }).sort((a,b)=>b.score-a.score);
    for(const candidate of candidates)if(clearPath(fish,candidate.point))return {...candidate.point};
    // 狭窄通道里也按各自方向选择短途路线，不统一排到最远的一头。
    const nearby=spaces.filter(point=>distance(point,fish)>28).map(point=>{
      const length=distance(point,fish),alignment=((point.x-fish.x)*fish.heading.x+(point.y-fish.y)*fish.heading.y)/length;
      return {point,score:alignment*65-Math.abs(length-fish.cruise)*.25+Math.random()*60};
    }).sort((a,b)=>b.score-a.score);
    for(const candidate of nearby)if(clearPath(fish,candidate.point))return {...candidate.point};
    return null; // 狭小留白中可以歇一会儿，不强行穿过正文。
  }
  function measure(){
    width=document.documentElement.clientWidth||innerWidth;height=innerHeight;
    const header=document.querySelector('.site-header')?.getBoundingClientRect();
    top=Math.min((header?.bottom||78)+8,Math.max(margin,height-fishHeight-margin));
    boxes=Array.from(document.querySelectorAll(avoid),el=>el.getBoundingClientRect()).filter(rect=>rect.width&&rect.height&&rect.bottom>0&&rect.top<height);
    spaces=[];
    if(height>220){
      const xs=new Set([margin,Math.max(margin,width-size-margin)]),ys=new Set([top,Math.max(top,height-fishHeight-margin)]);
      for(let x=margin;x<width-size-margin;x+=56)xs.add(x);
      for(let y=top;y<height-fishHeight-margin;y+=48)ys.add(y);
      // Include the actual edges of cards: a coarse grid can miss a usable gutter.
      for(const rect of boxes){
        for(const x of [rect.left-size-margin,rect.right+margin])if(x>=margin&&x<=width-size-margin)xs.add(Math.round(x));
        for(const y of [rect.top-fishHeight-margin,rect.bottom+margin])if(y>=top&&y<=height-fishHeight-margin)ys.add(Math.round(y));
      }
      for(const y of [...ys].sort((a,b)=>a-b))for(const x of [...xs].sort((a,b)=>a-b)){const point={x,y};if(!covered(point))spaces.push(point);}
    }
    const roomy=[],fitted=[];
    // 自动模式保留疏朗间距；手动数量按实际 44×36 尺寸加留隙计算容量。
    // 仅对静态留白采样，鱼游动时不执行任何鱼间碰撞检测。
    for(const point of spaces){
      if(roomy.length<maxFish&&roomy.every(other=>distance(point,other)>=88))roomy.push(point);
      if(fitted.length<maxFish&&fitted.every(other=>Math.abs(point.x-other.x)>=size+8||Math.abs(point.y-other.y)>=fishHeight+8))fitted.push(point);
      if(roomy.length===maxFish&&fitted.length===maxFish)break;
    }
    autoCap=automaticCount();autoCapacity=roomy.length;capacity=fitted.length;
    for(const fish of pool){
      Object.assign(fish,bounds(fish));
      // 布局重测不打断有效路线，避免滚动、字体加载时整群同时重新出发。
      if(fish.target){const next=bounds(fish.target);if(distance(next,fish.target)>1||covered(fish.target)||!clearPath(fish,fish.target))fish.target=null;}
    }
    dirty=false;
  }
  function render(fish){
    const el=fish.el;
    el.style.transform=`translate3d(${fish.x}px,${fish.y}px,0)`;
    el.style.setProperty('--fish-facing',fish.facing);
    el.classList.toggle('is-held',!!fish.held);
    el.classList.toggle('is-resting',!!(fish.held||fish.hovered||fish.paused||fish.restUntil>clock));
    el.classList.toggle('hint-below',fish.y<top+42);
    el.classList.toggle('is-occluded',!!fish.relocating);
    el.setAttribute('aria-pressed',String(fish.paused));
    const message=fish.held?'抓住啦 · 松手留在这里':fish.paused?'休息一下 · 空格继续':fish.calledUntil>clock?'我来啦':fish.restUntil>clock?'在这里歇一会儿':'按住拖动';
    if(fish.caption.textContent!==message)fish.caption.textContent=message;
    if(engaged(fish)||fish.calledUntil>clock){
      fish.caption.style.left=`${clamp(fish.x+size/2-fish.caption.offsetWidth/2,8,width-fish.caption.offsetWidth-8)-fish.x}px`;
    }
    el.classList.toggle('is-called',fish.calledUntil>clock);
    el.disabled=!fish.active||!mouse.matches;
    el.tabIndex=fish.active&&mouse.matches&&(!fish.relocating||fish.focused)?0:-1;
    if(fish.active&&mouse.matches&&(!fish.relocating||fish.focused))el.removeAttribute('aria-hidden');else el.setAttribute('aria-hidden','true');
  }
  function release(fish,dropped=false){
    if(!fish.held)return;
    const id=fish.held.id;fish.held=null;fish.hovered=false;fish.target=null;
    if(dropped){
      clock=performance.now();
      if(!covered(fish)){fish.restUntil=clock+2000;fish.retry=fish.restUntil;fish.dropPoint=null;}
      else {fish.dropPoint={x:fish.x,y:fish.y};fish.restUntil=0;}
    }
    try{if(fish.el.hasPointerCapture(id))fish.el.releasePointerCapture(id);}catch{}
    render(fish);
  }
  function createFish(index){
    const el=template.content.firstElementChild.cloneNode(true);
    el.hidden=true;el.dataset.fishId=String(index+1);
    el.setAttribute('aria-label',`背景小鱼 ${index+1}：按住拖动，方向键移动，空格暂停或继续`);
    const variant=index%3;
    el.style.setProperty('--fish-scale',[1,.86,.76][variant]);el.style.setProperty('--fish-opacity',[.42,.36,.31][variant]);
    el.style.setProperty('--tail-duration',`${.36+variant*.07}s`);if(variant===1)el.classList.add('fish-teal');
    const angle=bearing+index*goldenAngle+(Math.random()-.5)*.35;
    const heading={x:Math.cos(angle),y:Math.sin(angle)};
    const fish={el,caption:el.querySelector('.fish-caption'),active:false,x:8,y:top,facing:heading.x<0?-1:1,heading,cruise:140+Math.random()*260,pace:.78+Math.random()*.44,trail:[],turnAfter:0,restUntil:0,dropPoint:null,target:null,retry:0,held:null,hovered:false,focused:false,paused:false,relocating:0,calledUntil:0,lastSummoned:0,retireTimer:0};
    el.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'&&mouse.matches&&!suspended){fish.hovered=true;render(fish);}});
    el.addEventListener('pointerleave',()=>{fish.hovered=false;render(fish);});
    el.addEventListener('pointerdown',event=>{
      if(!mouse.matches||event.pointerType!=='mouse'||event.button!==0||suspended||!fish.active)return;
      event.preventDefault();event.stopPropagation();for(const other of pool)release(other);
      fish.calledUntil=0;fish.retry=0;fish.paused=false;fish.restUntil=0;fish.dropPoint=null;fish.relocating=0;fish.held={id:event.pointerId,dx:event.clientX-fish.x,dy:event.clientY-fish.y};
      try{el.setPointerCapture(event.pointerId);}catch{fish.held=null;}render(fish);
    });
    el.addEventListener('pointermove',event=>{
      if(!fish.held||event.pointerId!==fish.held.id)return;
      const next=bounds({x:event.clientX-fish.held.dx,y:event.clientY-fish.held.dy});
      if(Math.abs(next.x-fish.x)>1)fish.facing=next.x<fish.x?-1:1;Object.assign(fish,next);render(fish);
    });
    el.addEventListener('pointerup',event=>{if(fish.held?.id===event.pointerId){event.preventDefault();event.stopPropagation();release(fish,true);}});
    el.addEventListener('pointercancel',()=>release(fish));el.addEventListener('lostpointercapture',()=>release(fish));
    el.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();});
    el.addEventListener('animationend',event=>{if(event.animationName==='fish-wake')el.classList.remove('is-arriving');});
    el.addEventListener('focus',()=>{fish.focused=true;fish.paused=true;fish.relocating=0;render(fish);});
    el.addEventListener('blur',()=>{fish.focused=false;fish.paused=false;release(fish);render(fish);});
    el.addEventListener('keydown',event=>{
      const moves={ArrowLeft:[-22,0],ArrowRight:[22,0],ArrowUp:[0,-22],ArrowDown:[0,22]};
      if(moves[event.key]){fish.calledUntil=0;fish.retry=0;event.preventDefault();const [dx,dy]=moves[event.key];Object.assign(fish,bounds({x:fish.x+dx,y:fish.y+dy}));if(dx)fish.facing=dx<0?-1:1;fish.paused=true;render(fish);}
      else if(event.key===' '||event.key==='Enter'){fish.calledUntil=0;fish.retry=0;event.preventDefault();fish.hovered=false;fish.restUntil=0;fish.paused=!fish.paused;render(fish);}
      else if(event.key==='Escape'){fish.paused=false;el.blur();}
    });
    ocean.append(el);pool.push(fish);return fish;
  }
  function updateControls(){
    const count=active().length;
    if(control)control.hidden=false;
    const label=reduced.matches?'已减少动态':mode==='off'?'已关闭':mode==='auto'?`自动 · ${count?count+' 条':'休息中'}`:count===Number(mode)?`${mode} 条`:`${mode} 条 · ${count?'留白限 '+count:'暂歇'}`;
    if(countLabel&&countLabel.textContent!==label)countLabel.textContent=label;
    if(settings)settings.querySelector('summary').title=reduced.matches?'系统已减少动态，小鱼暂停':mode==='off'?'已关闭背景小鱼':mode==='auto'?`自动模式，当前在游 ${count} 条`:count<Number(mode)?`已设 ${mode} 条，当前留白可显示 ${count} 条；空间恢复后自动补齐`:`当前在游 ${count} 条，手动数量不受动效档位限制`;
    settings?.querySelector('summary')?.setAttribute('aria-label',`设置背景小鱼数量，当前${label}`);
    if(note)note.textContent=reduced.matches?'已跟随系统设置暂停动画。':mode==='off'?'已关闭背景小鱼。':mode==='auto'?(capacity===0?'这里留白较少，小鱼暂时休息。':`自动模式随屏幕和留白调整，当前显示 ${count} 条。`):Number(mode)>count?`已设为 ${mode} 条，当前留白可容纳 ${count} 条；其余暂歇，滚动到宽敞处会回来。`:`已设为 ${mode} 条，手动数量优先于动效档位；按住小鱼可以拖动。`;
    choices.forEach(button=>{button.setAttribute('aria-pressed',String(button.dataset.fishMode===mode));button.disabled=reduced.matches&&button.dataset.fishMode!=='off';});
    if(customInput){customInput.disabled=reduced.matches;if(document.activeElement!==customInput)customInput.value=/^\d+$/.test(mode)?mode:'';}
    if(customForm)customForm.querySelector('button').disabled=reduced.matches;
    const guests=active().filter(fish=>fish.calledUntil>clock).length;
    const status=count&&!suspended?(clock<feedbackUntil?feedback:guests?`${guests}/${count}`:''):'';
    if(summonStatus&&summonStatus.textContent!==status)summonStatus.textContent=status;
    if(summonStatus)summonStatus.setAttribute('aria-label',clock<feedbackUntil?feedback:`已召来 ${guests} 条，当前在游 ${count} 条`);
    if(summonButton){summonButton.disabled=!count||suspended||clock<summonUntil;summonButton.title=mode==='off'?'先在旁边开启小鱼':!count?'这里暂时没有足够留白':`从当前在游的 ${count} 条里叫来一位，歇一会儿再继续游`;}
    controlsAt=Math.min(...[summonUntil,feedbackUntil,...active().map(fish=>fish.calledUntil)].filter(time=>time>clock),Infinity);
  }
  function reconcile(){
    const wanted=reduced.matches||mode==='off'?0:Math.min(mode==='auto'?autoCap:Number(mode),mode==='auto'?autoCapacity:capacity,maxFish);
    for(let index=0;index<Math.max(wanted,pool.length);index++){
      const fish=pool[index]||createFish(index);
      if(index<wanted&&!fish.active){
        const place=birthplace(fish);if(!place)continue;
        clearTimeout(fish.retireTimer);fish.retireTimer=0;Object.assign(fish,place,{active:true,relocating:0,target:null,retry:0,paused:false,restUntil:0,dropPoint:null,calledUntil:0});
        fish.trail=[];fish.restUntil=clock+150+index*65+Math.random()*650;
        fish.el.classList.remove('is-retiring');fish.el.classList.add('is-arriving');render(fish);fish.el.hidden=false;
      }else if(index>=wanted&&fish.active){
        fish.active=false;fish.calledUntil=0;release(fish);fish.el.blur();fish.hovered=false;fish.focused=false;fish.paused=false;fish.el.tabIndex=-1;fish.el.setAttribute('aria-hidden','true');fish.el.classList.add('is-retiring');
        clearTimeout(fish.retireTimer);fish.retireTimer=setTimeout(()=>{fish.retireTimer=0;if(!fish.active)fish.el.hidden=true;},260);
      }
    }
    updateControls();
  }
  function blocked(){return pageHidden||document.hidden||reduced.matches||mode==='off'||root.dataset.opening==='pending'||dialogOpen;}
  function stop(){cancelAnimationFrame(frame);frame=0;last=0;}
  function sync(){
    clock=performance.now();suspended=blocked();ocean.hidden=suspended||!active().length;
    for(const fish of pool){if(suspended||!mouse.matches){fish.el.blur();release(fish);fish.hovered=false;}render(fish);}
    updateControls();if(suspended||!active().length){stop();return;}if(!frame)frame=requestAnimationFrame(tick);
  }
  function tick(time){
    frame=0;clock=time;if(blocked()){sync();return;}frame=requestAnimationFrame(tick);
    if(last&&time-last<32)return;
    const delta=last?Math.min((time-last)/1000,.07):0;last=time;if(time<scrollUntil)return;
    ocean.classList.remove('is-scrolling');
    if(dirty){measure();reconcile();if(!active().length){sync();return;}}
    if(time>=controlsAt)updateControls();
    for(const fish of active()){
      if(!fish.held&&!fish.hovered&&!fish.paused){
        if(covered(fish)){
          if(!fish.relocating)fish.relocating=time+240;
          if(time>=fish.relocating){const place=fish.dropPoint?available(fish.dropPoint):birthplace(fish);if(place){Object.assign(fish,place);fish.relocating=0;fish.target=null;fish.dropPoint=null;fish.calledUntil=0;fish.restUntil=0;}else fish.relocating=time+400;}
        }else{
          fish.relocating=0;if(fish.target&&covered(fish.target))fish.target=null;
          if(fish.target&&distance(fish,fish.target)<6){fish.trail.push({...fish.target});fish.trail=fish.trail.slice(-6);fish.target=null;fish.restUntil=time+250+Math.random()*1100;fish.retry=fish.restUntil;}
          if(time<fish.restUntil){render(fish);continue;}
          if(!fish.target&&time>=fish.retry){fish.target=waypoint(fish);fish.retry=time+1200;}
          if(fish.target){
            const dx=fish.target.x-fish.x,dy=fish.target.y-fish.y,length=Math.hypot(dx,dy),speed=root.dataset.effects==='light'?15:root.dataset.effects==='lively'?26:22,step=Math.min(length,(mouse.matches?speed:15)*fish.pace*delta);
            const next=bounds({x:fish.x+dx/length*step,y:fish.y+dy/length*step});
            if(!covered(next)){Object.assign(fish,next);fish.heading={x:dx/length,y:dy/length};if(Math.abs(dx)>14&&time>=fish.turnAfter){fish.facing=dx<0?-1:1;fish.turnAfter=time+1200;}}else fish.target=null;
          }
        }
      }
      render(fish);
    }
    // 拖动或键盘接管后，进度在同一个动画循环里同步。
    if(summonStatus?.textContent)updateSummonProgress();
  }
  function updateSummonProgress(){
    const guests=active().filter(fish=>fish.calledUntil>clock).length;
    if(clock>=feedbackUntil&&summonStatus.textContent!==(guests?`${guests}/${active().length}`:''))updateControls();
  }
  function refresh(){if(!ocean.isConnected)return;clock=performance.now();measure();reconcile();sync();}
  function changeMode(next){
    if(!validMode(next))return;mode=next;try{localStorage.setItem(key,mode);}catch{}
    if(customInput){customInput.value=/^\d+$/.test(mode)?mode:'';customInput.setCustomValidity('');}
    if(settings){settings.open=false;settings.querySelector('summary').focus();}refresh();
  }
  choices.forEach(button=>button.addEventListener('click',()=>{if(!button.disabled)changeMode(button.dataset.fishMode);}));
  customInput?.addEventListener('input',()=>customInput.setCustomValidity(''));
  customForm?.addEventListener('submit',event=>{
    event.preventDefault();if(reduced.matches)return;
    const value=customInput.value.trim();
    if(!validMode(value)||!/^\d+$/.test(value)){customInput.setCustomValidity(`请输入 1–${maxFish} 之间的整数`);customInput.reportValidity();return;}
    changeMode(value);
  });
  summonButton?.addEventListener('click',()=>{
    clock=performance.now();if(blocked()||clock<summonUntil)return;
    if(settings)settings.open=false;measure();reconcile();
    const rect=summonButton.getBoundingClientRect(),near={x:rect.left,y:Math.max(top,rect.top-90)};
    // 优先叫还没来过的鱼；同轮随机挑选，已在身边或正在互动的鱼不重置。
    const candidates=active().filter(fish=>!engaged(fish)&&fish.calledUntil<=clock);
    const earliest=Math.min(...candidates.map(fish=>fish.lastSummoned));
    const next=candidates.filter(fish=>fish.lastSummoned===earliest);
    const fish=next[Math.floor(Math.random()*next.length)],place=fish&&summonPlace(near,fish);
    summonUntil=clock+450;feedbackUntil=0;
    if(!fish||!place){feedback=!fish?(active().every(fish=>fish.calledUntil>clock)?'都来啦':'稍等一下'):'附近有点挤';feedbackUntil=clock+1600;updateControls();sync();return;}
    const stay=clock+5000;
    Object.assign(fish,place,{target:null,retry:stay,restUntil:stay,relocating:0,dropPoint:null,calledUntil:stay,lastSummoned:++summonSerial});
    fish.trail=[];fish.el.classList.remove('is-arriving');
    render(fish);updateControls();sync();
  });
  // 面板是绝对定位，不一定触发布局观察器；开合都重新核对留白，零条时也能恢复。
  [settings,effectsSettings].forEach(panel=>panel?.addEventListener('toggle',refresh));
  document.addEventListener('pointerdown',event=>{if(settings?.open&&!settings.contains(event.target))settings.open=false;},{passive:true});
  settings?.addEventListener('keydown',event=>{if(event.key==='Escape'){settings.open=false;settings.querySelector('summary').focus();}});
  window.addEventListener('scroll',()=>{dirty=true;scrollUntil=performance.now()+140;ocean.classList.add('is-scrolling');for(const fish of pool)fish.hovered=false;clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{scrollUntil=0;ocean.classList.remove('is-scrolling');refresh();},160);},{passive:true});
  window.addEventListener('resize',()=>{scrollUntil=0;for(const fish of pool)release(fish);refresh();},{passive:true});
  window.addEventListener('blur',()=>{for(const fish of pool){release(fish);fish.hovered=false;}});
  window.addEventListener('pagehide',()=>{pageHidden=true;clearTimeout(scrollTimer);sync();});
  window.addEventListener('pageshow',()=>{pageHidden=false;scrollUntil=0;refresh();});
  document.addEventListener('visibilitychange',()=>{for(const fish of pool)fish.hovered=false;sync();});
  window.addEventListener('storage',event=>{if(event.key===key){mode=validMode(event.newValue)?event.newValue:'6';refresh();}});
  document.addEventListener('flyfish:effectschange',refresh);document.addEventListener('flyfish:page',()=>{
    for(const fish of pool){release(fish);fish.el.blur();fish.hovered=false;if(fish.calledUntil){fish.calledUntil=0;fish.restUntil=0;fish.retry=0;}}
    feedbackUntil=0;refresh();
  });
  reduced.addEventListener('change',refresh);mouse.addEventListener('change',refresh);
  new MutationObserver(refresh).observe(root,{attributes:true,attributeFilter:['data-opening']});
  const dialogs=Array.from(document.querySelectorAll('dialog'));
  const updateDialogs=()=>{dialogOpen=dialogs.some(dialog=>dialog.open);sync();};
  dialogs.forEach(dialog=>new MutationObserver(updateDialogs).observe(dialog,{attributes:true,attributeFilter:['open']}));
  if('ResizeObserver' in window)new ResizeObserver(()=>{dirty=true;if(!frame&&!blocked())refresh();}).observe(document.querySelector('.site-shell')||document.body);
  document.fonts?.ready.then(refresh);dialogOpen=dialogs.some(dialog=>dialog.open);refresh();
})();
