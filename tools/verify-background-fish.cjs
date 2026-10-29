'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom'),ejs=require('ejs');
const source=fs.readFileSync('themes/flyfish/source/js/background-fish.js','utf8');
function setup(options={}){
  const html=fs.readFileSync('themes/flyfish/layout/_partials/background-fish.ejs','utf8');
  const controls=ejs.render(fs.readFileSync('themes/flyfish/layout/_partials/footer-fish.ejs','utf8'));
  const dom=new JSDOM('<header class="site-header"></header><div class="site-shell"><article class="post-card"></article></div><dialog></dialog>'+controls+html,{runScripts:'outside-only',url:'http://localhost/'});
  const w=dom.window,doc=w.document,ocean=doc.querySelector('[data-background-fish]');
  const frames=new Map(),timers=new Map();let now=100,serial=0,seed=options.seed??31,hidden=false,crowded=!!options.crowded;
  const media=matches=>{const listeners=[];return {matches,addEventListener:(_,fn)=>listeners.push(fn),change(){for(const listener of listeners)listener();}};};
  const capture=new Map(),reduced=media(!!options.reduced),mouse=media(!options.touch);
  w.innerWidth=options.width||1440;w.innerHeight=options.height||900;
  Object.defineProperty(doc.documentElement,'clientWidth',{get:()=>w.innerWidth});Object.defineProperty(doc,'hidden',{get:()=>hidden});Object.defineProperty(w.performance,'now',{value:()=>now});
  const headerHeight=options.headerHeight||78;
  doc.querySelector('.site-header').getBoundingClientRect=()=>({left:0,right:w.innerWidth,top:0,bottom:headerHeight,width:w.innerWidth,height:headerHeight});
  doc.querySelector('.post-card').getBoundingClientRect=()=>crowded?{left:0,right:w.innerWidth,top:78,bottom:w.innerHeight,width:w.innerWidth,height:w.innerHeight-78}:options.gutter?{left:options.gutter,right:w.innerWidth,top:headerHeight,bottom:w.innerHeight,width:w.innerWidth-options.gutter,height:w.innerHeight-headerHeight}:{left:300,right:600,top:150,bottom:450,width:300,height:300};
  doc.querySelector('[data-fish-summon]').getBoundingClientRect=()=>({left:20,top:w.innerHeight-45,width:60,height:25});
  if(options.panelBlocks)for(const panel of doc.querySelectorAll('.fish-settings-panel,.effects-panel'))panel.getBoundingClientRect=()=>panel.closest('details').open?{left:0,right:w.innerWidth,top:78,bottom:w.innerHeight,width:w.innerWidth,height:w.innerHeight-78}:{left:0,right:0,top:0,bottom:0,width:0,height:0};
  w.HTMLElement.prototype.setPointerCapture=function(id){capture.set(this,id);};w.HTMLElement.prototype.hasPointerCapture=function(id){return capture.get(this)===id;};w.HTMLElement.prototype.releasePointerCapture=function(){capture.delete(this);};
  w.Math.random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};w.matchMedia=query=>query.includes('reduced')?reduced:mouse;
  w.requestAnimationFrame=fn=>{frames.set(++serial,fn);return serial;};w.cancelAnimationFrame=id=>frames.delete(id);
  w.setTimeout=(fn,delay)=>{timers.set(++serial,{fn,at:now+delay});return serial;};w.clearTimeout=id=>timers.delete(id);
  w.ResizeObserver=class{observe(){}};
  if(options.saved)w.localStorage.setItem('flyfish-fish-mode',options.saved);
  if(options.blocked)Object.defineProperty(w,'localStorage',{get(){throw Error('blocked');}});
  if(options.opening)doc.documentElement.dataset.opening='pending';
  doc.documentElement.dataset.effects=options.tier||'standard';
  if(options.withEffects)w.eval(fs.readFileSync('themes/flyfish/source/js/effects.js','utf8'));
  w.eval(source);
  const fish=()=>Array.from(ocean.querySelectorAll('.background-fish:not(.is-retiring)')).filter(el=>!el.hidden);
  const point=el=>{const values=el.style.transform.match(/translate3d\(([-.\d]+)px,([-.\d]+)px/);return {x:Number(values[1]),y:Number(values[2])};};
  const custom=value=>{const input=doc.querySelector('[data-fish-custom]');input.value=value;input.dispatchEvent(new w.Event('input'));doc.querySelector('[data-fish-custom-form]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));};
  const mode=value=>{const button=doc.querySelector(`[data-fish-mode="${value}"]`);if(button)button.click();else custom(value);};
  function tick(count=1){for(let step=0;step<count;step++){now+=40;for(const [id,timer] of [...timers])if(timer.at<=now){timers.delete(id);timer.fn();}for(const [id,fn] of [...frames]){frames.delete(id);fn(now);}}}
  function pointer(el,type,x,y,extra={}){const event=new w.MouseEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,button:0});Object.defineProperties(event,{pointerType:{value:extra.type||'mouse'},pointerId:{value:extra.id??1}});el.dispatchEvent(event);}
  return {dom,w,doc,ocean,frames,timers,reduced,mouse,capture,fish,point,mode,custom,tick,pointer,runAgain:()=>w.eval(source),crowd(value){crowded=value;},visibility(value){hidden=value;doc.dispatchEvent(new w.Event('visibilitychange'));}};
}
(async()=>{
  const state=setup({saved:'auto'}),{w,doc}=state;
  assert.equal(state.fish().length,6);assert.equal(doc.querySelector('[data-fish-count]').textContent,'自动 · 6 条');assert.equal(state.frames.size,1);
  const points=state.fish().map(state.point);
  state.tick(50);assert.ok(state.fish().some((el,i)=>Math.hypot(state.point(el).x-points[i].x,state.point(el).y-points[i].y)>1),'Autonomous swimming');
  for(let step=0;step<350;step++){state.tick();const path=state.fish().map(state.point);for(const p of path){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(!(p.x+39>297&&p.x+5<603&&p.y+32>147&&p.y+4<453),'Automatic routes stay outside the card');}}
  state.runAgain();assert.equal(state.frames.size,1);assert.equal(doc.querySelectorAll('.background-fish').length,6,'Repeated initialization does not duplicate fish or loops');
  const fish=state.fish()[0],before=state.point(fish);state.pointer(fish,'pointerenter',before.x+20,before.y+16);state.tick(5);assert.deepEqual(state.point(fish),before);
  state.pointer(fish,'pointerdown',before.x+20,before.y+16);assert.ok(fish.classList.contains('is-held'));assert.equal(state.capture.get(fish),1);
  state.pointer(fish,'pointermove',500,250);assert.deepEqual(state.point(fish),{x:480,y:234});
  state.pointer(fish,'pointermove',-500,99999);assert.equal(state.point(fish).x,8);assert.ok(state.point(fish).y<=856);
  state.pointer(fish,'pointermove',500,250);state.pointer(fish,'pointerup',500,250);assert.equal(state.capture.has(fish),false);state.tick();assert.ok(fish.classList.contains('is-occluded'));
  state.tick(10);assert.equal(fish.classList.contains('is-occluded'),false,'Release on a card relocates promptly into safe space');
  const moved=state.point(fish);assert.ok(!(moved.x+39>297&&moved.x+5<603&&moved.y+32>147&&moved.y+4<453));
  state.pointer(fish,'pointerdown',500,250,{type:'touch'});assert.equal(fish.classList.contains('is-held'),false);
  fish.focus();assert.equal(fish.getAttribute('aria-pressed'),'true');const focused=state.point(fish);
  fish.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',cancelable:true}));assert.equal(state.point(fish).x,Math.min(1388,focused.x+22));
  fish.dispatchEvent(new w.KeyboardEvent('keydown',{key:' ',cancelable:true}));assert.equal(fish.getAttribute('aria-pressed'),'false');const resumed=state.point(fish);state.tick(20);assert.notDeepEqual(state.point(fish),resumed,'Space resumes swimming while focus remains on the fish');fish.blur();
  state.pointer(fish,'pointerdown',500,250);state.pointer(fish,'lostpointercapture',500,250);assert.equal(fish.classList.contains('is-held'),false);
  state.mode('1');assert.equal(state.fish().length,1);assert.equal(w.localStorage.getItem('flyfish-fish-mode'),'1');assert.equal(state.fish()[0].getAttribute('aria-hidden'),null);
  state.mode('3');assert.equal(state.fish().length,3);state.tick(10);assert.equal(state.fish().length,3,'Stale retirement timers cannot hide reactivated fish');
  const summon=doc.querySelector('[data-fish-summon]');summon.click();const called=state.fish().find(el=>el.classList.contains('is-called'));assert.ok(called);const calledPoint=state.point(called);summon.click();assert.deepEqual(state.point(called),calledPoint,'Repeated summons are throttled');assert.equal(state.fish().length,3);assert.equal(state.frames.size,1);
  state.visibility(true);assert.ok(state.ocean.hidden);assert.equal(state.frames.size,0);state.visibility(false);assert.equal(state.frames.size,1);
  doc.querySelector('dialog').setAttribute('open','');await Promise.resolve();assert.ok(state.ocean.hidden);assert.equal(state.frames.size,0);doc.querySelector('dialog').removeAttribute('open');await Promise.resolve();assert.equal(state.frames.size,1);
  w.innerWidth=390;w.innerHeight=844;w.dispatchEvent(new w.Event('resize'));assert.equal(state.fish().length,3,'Manual count is not silently capped by viewport width when there is room');assert.match(doc.querySelector('[data-fish-note]').textContent,/已设为 3 条/);assert.equal(w.localStorage.getItem('flyfish-fish-mode'),'3');
  w.innerWidth=1440;w.dispatchEvent(new w.Event('resize'));assert.equal(state.fish().length,3);
  state.crowd(true);w.dispatchEvent(new w.Event('resize'));assert.equal(state.fish().length,0);assert.equal(state.frames.size,0);assert.equal(doc.querySelector('[data-fish-count]').textContent,'3 条 · 暂歇');assert.match(doc.querySelector('[data-fish-note]').textContent,/已设为 3 条，当前留白可容纳 0 条/);
  state.crowd(false);w.dispatchEvent(new w.Event('scroll'));state.tick(6);assert.equal(state.fish().length,3,'Scrolling out of a crowded area wakes an empty pool');assert.equal(state.frames.size,1);
  state.mode('off');assert.equal(state.frames.size,0);assert.ok(state.ocean.hidden);state.mode('auto');assert.equal(state.frames.size,1);
  state.reduced.matches=true;state.reduced.change();assert.equal(state.frames.size,0);assert.ok(state.ocean.hidden);assert.equal(doc.querySelector('[data-fish-control]').hidden,false);assert.equal(doc.querySelector('[data-fish-count]').textContent,'已减少动态');
  state.reduced.matches=false;state.reduced.change();state.mouse.matches=false;state.mouse.change();assert.ok(state.fish().every(el=>el.tabIndex===-1&&el.getAttribute('aria-hidden')==='true'));
  w.dispatchEvent(new w.Event('pagehide'));assert.equal(state.frames.size,0);w.dispatchEvent(new w.Event('pageshow'));assert.equal(state.frames.size,1);state.dom.window.close();
  for(const options of [{saved:'off'},{reduced:true},{opening:true}]){const quiet=setup(options);assert.ok(quiet.ocean.hidden);assert.equal(quiet.frames.size,0);quiet.dom.window.close();}
  const blocked=setup({blocked:true});assert.doesNotThrow(()=>blocked.mode('2'));assert.equal(blocked.fish().length,2);blocked.dom.window.close();
  const tablet=setup({width:1100,saved:'auto'});assert.equal(tablet.fish().length,4);tablet.dom.window.close();
  const manual=setup({width:1100,saved:'3'});assert.equal(manual.fish().length,3,'Manual three bypasses the automatic two-fish screen cap');manual.dom.window.close();
  const tight=setup({width:700,height:240,headerHeight:150,gutter:80,saved:'3'});assert.equal(tight.fish().length,1);assert.equal(tight.doc.querySelector('[data-fish-count]').textContent,'3 条 · 留白限 1');assert.match(tight.doc.querySelector('[data-fish-note]').textContent,/当前留白可容纳 1 条/);tight.w.innerHeight=900;tight.w.dispatchEvent(new tight.w.Event('resize'));assert.equal(tight.fish().length,3,'More space restores the full manual preference');tight.dom.window.close();
  const mobile=setup({width:390,touch:true,saved:'auto'});assert.ok(mobile.fish().length<=1);assert.ok(mobile.fish().every(el=>el.disabled&&el.tabIndex===-1));mobile.dom.window.close();
  const dropping=setup({saved:'1'}),dropped=dropping.fish()[0],origin=dropping.point(dropped);
  dropping.pointer(dropped,'pointerdown',origin.x+20,origin.y+16);dropping.pointer(dropped,'pointermove',70,516);dropping.pointer(dropped,'pointerup',70,516);
  assert.deepEqual(dropping.point(dropped),{x:50,y:500});dropping.tick(20);assert.deepEqual(dropping.point(dropped),{x:50,y:500},'Safe drop stays exactly at the release point for a short rest');
  dropping.tick(70);assert.notDeepEqual(dropping.point(dropped),{x:50,y:500},'Swimming resumes from the drop point');
  const current=dropping.point(dropped);dropping.pointer(dropped,'pointerdown',current.x+20,current.y+16);dropping.pointer(dropped,'pointermove',500,250);dropping.pointer(dropped,'pointerup',500,250);dropping.tick(10);
  const nearby=dropping.point(dropped);assert.ok(Math.hypot(nearby.x-480,nearby.y-234)<180,'Drop over content chooses nearby safe space, not a random part of the viewport');dropping.dom.window.close();
  const roaming=setup({saved:'1'}),positions=[];let flips=0,lastFacing=roaming.fish()[0].style.getPropertyValue('--fish-facing');
  for(let index=0;index<750;index++){roaming.tick();const el=roaming.fish()[0];positions.push(roaming.point(el));const facing=el.style.getPropertyValue('--fish-facing');if(facing!==lastFacing)flips++;lastFacing=facing;}
  assert.ok(Math.max(Math.max(...positions.map(p=>p.x))-Math.min(...positions.map(p=>p.x)),Math.max(...positions.map(p=>p.y))-Math.min(...positions.map(p=>p.y)))>180,'Roaming explores beyond a small local pocket');assert.ok(flips<20,'Fish do not flicker repeatedly between left and right');roaming.dom.window.close();
  const many=setup({saved:'12',tier:'lively'}),input=many.doc.querySelector('[data-fish-custom]');
  assert.equal(many.fish().length,12);assert.equal(input.value,'12');assert.equal(input.max,'12');
  for(const el of many.fish())for(const prop of ['--fish-scale','--fish-opacity'])assert.ok(Number.isFinite(Number(el.style.getPropertyValue(prop))),'Every fish beyond the original three has a valid visual variant');
  many.tick(80);assert.equal(many.frames.size,1);
  many.custom('8');assert.equal(many.fish().length,8);assert.equal(many.w.localStorage.getItem('flyfish-fish-mode'),'8');
  for(const invalid of ['13','999','0','-1','1.5','']){many.custom(invalid);assert.equal(many.fish().length,8);assert.equal(many.w.localStorage.getItem('flyfish-fish-mode'),'8');assert.ok(input.validationMessage);}
  many.doc.querySelector('[data-fish-settings]').open=true;input.focus();input.value='11';input.dispatchEvent(new many.w.Event('input'));many.tick(30);assert.equal(input.value,'11','Animation/control updates do not overwrite a custom count being edited');
  many.custom('11');assert.equal(many.fish().length,11);assert.equal(many.doc.querySelector('[data-fish-settings]').open,false);assert.equal(many.doc.activeElement.tagName,'SUMMARY','Applying a setting returns focus to the visible count control');
  for(let index=0;index<6;index++){many.mode('1');many.custom('12');}
  many.tick(10);assert.equal(many.fish().length,12);assert.equal(many.doc.querySelectorAll('.background-fish').length,12,'Pool never grows beyond the limit');assert.equal(many.frames.size,1);
  many.w.dispatchEvent(new many.w.StorageEvent('storage',{key:'flyfish-fish-mode',newValue:'7'}));assert.equal(many.fish().length,7);assert.equal(input.value,'7');
  many.w.dispatchEvent(new many.w.StorageEvent('storage',{key:'flyfish-fish-mode',newValue:'1000'}));assert.equal(many.fish().length,6,'Invalid stored counts fall back safely to six');
  many.reduced.matches=true;many.reduced.change();assert.ok(input.disabled);assert.ok(many.doc.querySelector('[data-fish-custom-form] button').disabled);many.custom('12');assert.equal(many.fish().length,0);many.dom.window.close();
  const overlapping=setup({saved:'3'}),[first,second]=overlapping.fish();
  // Holding one fish at the exact drop point of another must not trigger relocation or avoidance.
  for(const el of [first,second]){const p=overlapping.point(el);overlapping.pointer(el,'pointerdown',p.x+20,p.y+16);overlapping.pointer(el,'pointermove',70,516);overlapping.pointer(el,'pointerup',70,516);}
  overlapping.tick(20);assert.deepEqual(overlapping.point(first),{x:50,y:500});assert.deepEqual(overlapping.point(second),{x:50,y:500});assert.ok(!first.classList.contains('is-occluded')&&!second.classList.contains('is-occluded'),'Fish may overlap without collisions');
  overlapping.tick(100);assert.notDeepEqual(overlapping.point(first),{x:50,y:500},'An overlapping fish can resume its own route');assert.notDeepEqual(overlapping.point(second),{x:50,y:500});overlapping.dom.window.close();
  for(const saved of ['12','8','2','13','-1']){const restored=setup({saved,tier:'lively'});assert.equal(restored.fish().length,['13','-1'].includes(saved)?6:Number(saved));restored.dom.window.close();}
  const defaults=setup();assert.equal(defaults.fish().length,6);defaults.custom('9');assert.equal(defaults.fish().length,9);assert.equal(defaults.w.localStorage.getItem('flyfish-fish-mode'),'9');
  for(const [tier,count] of [['light',9],['lively',9],['standard',9]]){defaults.doc.documentElement.dataset.effects=tier;defaults.doc.dispatchEvent(new defaults.w.Event('flyfish:effectschange'));assert.equal(defaults.fish().length,count);}
  defaults.dom.window.close();
  const gathering=setup({saved:'3'}),call=gathering.doc.querySelector('[data-fish-summon]'),progress=gathering.doc.querySelector('[data-fish-summon-status]');
  const calledIds=[],landings=[];
  for(let index=0;index<3;index++){
    call.click();const guests=gathering.fish().filter(fish=>fish.classList.contains('is-called'));
    assert.equal(guests.length,index+1,'Successive summons bring different members of the existing pool');
    const newcomer=guests.find(fish=>!calledIds.includes(fish.dataset.fishId));calledIds.push(newcomer.dataset.fishId);landings.push(gathering.point(newcomer));
    assert.equal(progress.textContent,`${index+1}/3`);call.click();gathering.tick(12);
    for(const [i,id] of calledIds.entries())assert.deepEqual(gathering.point(gathering.fish().find(fish=>fish.dataset.fishId===id)),landings[i],'Earlier guests stay put while another is called');
  }
  call.click();assert.equal(progress.textContent,'都来啦');assert.equal(gathering.fish().length,3);assert.equal(gathering.doc.querySelectorAll('.background-fish').length,3);assert.equal(gathering.w.localStorage.getItem('flyfish-fish-mode'),'3');
  assert.equal(gathering.frames.size,1,'Summons reuse the single animation loop');
  const firstGuest=gathering.fish().find(fish=>fish.dataset.fishId===calledIds[0]),guestPoint=gathering.point(firstGuest);
  gathering.pointer(firstGuest,'pointerdown',guestPoint.x+20,guestPoint.y+16);gathering.pointer(firstGuest,'pointermove',70,516);gathering.pointer(firstGuest,'pointerup',70,516);
  gathering.tick(20);assert.ok(!firstGuest.classList.contains('is-called'));assert.deepEqual(gathering.point(firstGuest),{x:50,y:500},'Dragging takes over from the summon without jumping back');
  gathering.tick(130);assert.equal(progress.textContent,'');assert.ok(gathering.fish().every(fish=>!fish.classList.contains('is-called')),'Guests resume roaming and progress clears after their rest');
  call.click();assert.equal(progress.textContent,'1/3');gathering.mode('off');assert.equal(progress.textContent,'');gathering.mode('3');assert.equal(progress.textContent,'');assert.ok(gathering.fish().every(fish=>!fish.classList.contains('is-called')),'Reactivation does not restore stale summon state');gathering.dom.window.close();
  const cappedSummon=setup({saved:'12'});cappedSummon.doc.querySelector('[data-fish-summon]').click();assert.equal(cappedSummon.doc.querySelector('[data-fish-summon-status]').textContent,'1/12','Progress follows the full manual pool in the standard tier');assert.equal(cappedSummon.w.localStorage.getItem('flyfish-fish-mode'),'12');cappedSummon.dom.window.close();
  const oneGuest=setup({saved:'1'}),oneCall=oneGuest.doc.querySelector('[data-fish-summon]');oneCall.click();const onePoint=oneGuest.point(oneGuest.fish()[0]);oneGuest.tick(12);oneCall.click();oneGuest.tick(100);assert.deepEqual(oneGuest.point(oneGuest.fish()[0]),onePoint,'An exhausted summon does not extend or reset the current guest');oneGuest.tick(30);assert.notDeepEqual(oneGuest.point(oneGuest.fish()[0]),onePoint);oneGuest.dom.window.close();
  for(const tier of ['light','standard','lively'])for(let count=1;count<=12;count++){
    const configured=setup({saved:String(count),tier});assert.equal(configured.fish().length,count,`Manual ${count} works in ${tier} when there is room`);
    configured.tick(5);configured.doc.dispatchEvent(new configured.w.Event('flyfish:page'));configured.tick(5);
    assert.equal(configured.fish().length,count);assert.equal(configured.frames.size,1);assert.ok(configured.fish().every(fish=>Number.isFinite(configured.point(fish).x)));
    assert.equal(configured.w.localStorage.getItem('flyfish-fish-mode'),String(count));configured.dom.window.close();
  }
  const integrated=setup({saved:'12',withEffects:true});
  for(const [tier,automatic] of [['light',2],['standard',6],['lively',9]]){
    integrated.doc.querySelector(`[data-effects-tier="${tier}"]`).click();assert.equal(integrated.fish().length,12,'Real effects controls do not cap an explicit manual count');
    integrated.mode('auto');assert.equal(integrated.fish().length,automatic,'Automatic density follows the effects control');integrated.custom('12');
  }
  integrated.reduced.matches=true;integrated.reduced.change();assert.equal(integrated.fish().length,0);assert.equal(integrated.frames.size,0);
  integrated.reduced.matches=false;integrated.reduced.change();assert.equal(integrated.fish().length,12);assert.equal(integrated.frames.size,1,'System motion override restores the manual preference');
  const stale=integrated.fish()[11],stalePoint=integrated.point(stale);integrated.pointer(stale,'pointerenter',stalePoint.x+20,stalePoint.y+16);integrated.mode('1');integrated.custom('12');const restarted=integrated.point(stale);integrated.tick(100);assert.notDeepEqual(integrated.point(stale),restarted,'A retired hovered fish does not remain stuck after reactivation');
  integrated.doc.querySelector('[data-fish-summon]').click();integrated.doc.dispatchEvent(new integrated.w.Event('flyfish:page'));assert.ok(integrated.fish().every(fish=>!fish.classList.contains('is-called')));assert.equal(integrated.doc.querySelector('[data-fish-summon-status]').textContent,'','Navigation clears old-page summon progress');integrated.dom.window.close();
  for(const panelType of ['fish','effects']){
    const panels=setup({saved:'12',panelBlocks:true}),panel=panels.doc.querySelector(`[data-${panelType}-settings]`);
    panel.open=true;panel.dispatchEvent(new panels.w.Event('toggle'));assert.equal(panels.fish().length,0);assert.equal(panels.frames.size,0);
    panel.open=false;panel.dispatchEvent(new panels.w.Event('toggle'));assert.equal(panels.fish().length,12,'Closing an obstructing settings panel restores the pool even from an idle zero-fish state');assert.equal(panels.frames.size,1);panels.dom.window.close();
  }
  const density=setup({saved:'12',width:700,height:240,headerHeight:150,gutter:80});assert.equal(density.fish().length,1);assert.match(density.doc.querySelector('[data-fish-count]').textContent,/留白限 1/);assert.match(density.doc.querySelector('[data-fish-settings] summary').title,/留白/);density.w.innerHeight=900;density.w.dispatchEvent(new density.w.Event('resize'));assert.ok(density.fish().length>1);assert.equal(density.w.localStorage.getItem('flyfish-fish-mode'),'12');density.dom.window.close();
  // 模拟实页：左侧正文与右上侧栏占满，只剩右下 274×160 左右的口袋。
  const pocket=setup({saved:'12',width:1265,height:720});
  pocket.doc.querySelector('.post-card').getBoundingClientRect=()=>({left:40,right:922,top:108,bottom:800,width:882,height:692});
  const sidebar=pocket.doc.createElement('aside');sidebar.className='side-panel';sidebar.getBoundingClientRect=()=>({left:950,right:1224,top:108,bottom:549,width:274,height:441});pocket.doc.body.append(sidebar);
  pocket.w.dispatchEvent(new pocket.w.Event('resize'));assert.equal(pocket.fish().length,12,'Manual packing uses the real fish footprint, not the automatic spacious density');
  pocket.mode('auto');assert.ok(pocket.fish().length<=4,'The same space stays sparse in automatic mode');pocket.custom('12');
  pocket.tick(10);for(let step=0;step<180;step++){pocket.tick();for(const el of pocket.fish()){const p=pocket.point(el);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(p.x>=8&&p.x<=1213&&p.y>=86&&p.y<=676);assert.ok(!(p.x+39>37&&p.x+5<925&&p.y+32>105&&p.y+4<803));assert.ok(!(p.x+39>947&&p.x+5<1227&&p.y+32>105&&p.y+4<552));}}
  assert.equal(pocket.frames.size,1);pocket.dom.window.close();
  const separation=points=>Math.min(...points.flatMap((point,index)=>points.slice(index+1).map(other=>Math.hypot(point.x-other.x,point.y-other.y))));
  for(const gutter of [0,80])for(let seed=1;seed<=12;seed++){
    const scattered=setup({saved:'6',seed:seed*7919,gutter}),births=scattered.fish().map(scattered.point);
    assert.equal(births.length,6);assert.ok(separation(births)>90,'Births use separate parts of the available space, including narrow gutters');
    scattered.tick(80);const movements=scattered.fish().map((fish,index)=>{const point=scattered.point(fish);return {x:point.x-births[index].x,y:point.y-births[index].y};});
    const opposed=axis=>movements.some(delta=>delta[axis]>3)&&movements.some(delta=>delta[axis]<-3);
    assert.ok(gutter?opposed('y'):opposed('x')||opposed('y'),'Independent fish do not all depart in the same direction');
    scattered.mode('off');scattered.mode('6');assert.ok(separation(scattered.fish().map(scattered.point))>90,'Reactivation also spreads births');
    scattered.dom.window.close();
  }
  // 窄边带里的鱼也要有横向变化；开放留白里的航段应呈弧线。
  for(const options of [{saved:'1',gutter:80,seed:31},{saved:'1',seed:491}]){
    const curved=setup(options),positions=[];
    for(let step=0;step<550;step++){curved.tick();positions.push(curved.point(curved.fish()[0]));}
    assert.ok(Math.max(...positions.map(p=>p.x))-Math.min(...positions.map(p=>p.x))>12,'A narrow gutter does not pin fish to a single vertical line');
    let turning=false;
    for(let step=2;step<positions.length;step++){const a=positions[step-2],b=positions[step-1],c=positions[step];if(Math.abs((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x))>.0001)turning=true;}
    assert.ok(turning,'Swimming includes smooth changes of direction');curved.dom.window.close();
  }
  const steady=setup({seed:491}),remeasured=setup({seed:491});steady.tick(45);remeasured.tick(45);
  remeasured.w.dispatchEvent(new remeasured.w.Event('resize'));steady.tick(20);remeasured.tick(20);
  assert.deepEqual(remeasured.fish().map(remeasured.point),steady.fish().map(steady.point),'An unchanged layout does not reset all routes');
  steady.dom.window.close();remeasured.dom.window.close();
  const growth=setup({saved:'6',seed:31}),firstActions=new Map(),seenActions=new Set();
  for(let step=1;step<=751;step++){
    growth.tick();
    for(const el of growth.fish())if(el.dataset.action){if(!firstActions.has(el))firstActions.set(el,step);seenActions.add(el.dataset.action);}
  }
  assert.equal(firstActions.size,6,'Every fish starts an action within 1–30 seconds of active animation');
  assert.ok(new Set(firstActions.values()).size>1,'Fish do not all act at the same time');
  assert.ok(seenActions.size>1,'The school performs different actions');
  growth.tick(25);const beforeHidden=growth.fish().map(el=>el.dataset.action||'');growth.visibility(true);growth.tick(1000);
  assert.deepEqual(growth.fish().map(el=>el.dataset.action||''),beforeHidden,'Background time does not advance actions');
  growth.visibility(false);growth.doc.dispatchEvent(new growth.w.Event('flyfish:page'));
  assert.ok(growth.fish().every(el=>!el.dataset.action),'Navigation clears previous-page actions');assert.equal(growth.frames.size,1);growth.dom.window.close();
  const quietGrowth=setup({saved:'6',tier:'light'});quietGrowth.tick(800);
  assert.ok(quietGrowth.fish().every(el=>!el.dataset.action),'Light effects omit extra actions');quietGrowth.dom.window.close();
  console.log('PASS: independent short fish actions, background pause, navigation reset and light-effects behavior.');
  console.log('PASS: dispersed births across 24 seeded wide/gutter layouts, mixed travel directions and stable routes during measurement.');
  console.log('PASS: manual counts 1–12 in all three tiers, integrated automatic density controls, panel recovery, stale interaction cleanup, cross-page summons and system motion overrides.');
  console.log('PASS: custom 1–12 counts/validation/persistence, bounded pool and one loop, overlapping fish without collisions, safe content routes, drag/keyboard/touch, scroll recovery and motion/dialog/history suspension.');
})().catch(error=>{console.error(error);process.exitCode=1;});
