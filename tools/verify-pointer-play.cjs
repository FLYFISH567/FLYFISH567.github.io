'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const source=fs.readFileSync('themes/flyfish/source/js/pointer-play.js','utf8');
function setup(options={}){
  const dom=new JSDOM('<main><div id="blank"></div><p>可以正常选择的文字</p><div id="raw">没有段落标签的文字也可选择</div><a href="#article">链接</a><button>按钮</button><input><div class="travel-map-canvas"><svg class="travel-map"></svg></div><button class="background-fish">小鱼</button></main><dialog></dialog>',{runScripts:'outside-only',pretendToBeVisual:true,url:'http://localhost/'});
  const w=dom.window,doc=w.document,blank=doc.querySelector('#blank'),frames=new Map(),paints=[];
  let now=100,serial=0,hidden=false,hit=blank;
  const reduced={matches:!!options.reduced,addEventListener:(_,fn)=>reduced.change=fn},mouse={matches:!options.touch,addEventListener:(_,fn)=>mouse.change=fn};
  const ctx={setTransform(){},clearRect(){},save(){},restore(){},translate(){},rotate(){},beginPath(){},ellipse(){paints.push('wave');},arc(){paints.push('drop');},stroke(){},fill(){}};
  Object.defineProperty(doc,'hidden',{get:()=>hidden});Object.defineProperty(doc.documentElement,'clientWidth',{get:()=>w.innerWidth});
  Object.defineProperty(w.performance,'now',{value:()=>now});w.devicePixelRatio=3;
  w.matchMedia=query=>query.includes('reduced')?reduced:mouse;w.HTMLCanvasElement.prototype.getContext=()=>options.noCanvas?null:ctx;
  w.requestAnimationFrame=fn=>{frames.set(++serial,fn);return serial;};w.cancelAnimationFrame=id=>frames.delete(id);
  doc.elementFromPoint=()=>hit;
  doc.documentElement.dataset.effects=options.tier||'standard';
  w.eval(source);
  const canvas=()=>doc.querySelector('[data-pointer-play]');
  function pointer(type,target=blank,x=100,y=150,extra={}){
    const event=new w.MouseEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,button:extra.button??0,buttons:extra.buttons??(type==='pointerup'?0:1),relatedTarget:extra.relatedTarget??null});
    Object.defineProperties(event,{pointerType:{value:extra.pointerType||'mouse'},pointerId:{value:extra.id??1},isPrimary:{value:true}});target.dispatchEvent(event);return event;
  }
  function tick(count=1){for(let index=0;index<count;index++){now+=40;for(const [id,fn] of [...frames]){frames.delete(id);fn(now);}}}
  return {w,doc,dom,blank,ctx,frames,paints,reduced,mouse,canvas,pointer,tick,hit:node=>hit=node,visibility(value){hidden=value;doc.dispatchEvent(new w.Event('visibilitychange'));},runAgain:()=>w.eval(source)};
}
(async()=>{
  const state=setup(),{doc,w}=state;
  assert.equal(state.canvas(),null);assert.equal(state.frames.size,0,'Idle pages allocate no canvas or animation loop');
  state.runAgain();
  for(const selector of ['a','button','input','p','#raw','.travel-map','.background-fish']){
    const e=state.pointer('pointerdown',doc.querySelector(selector));assert.equal(e.defaultPrevented,false);assert.equal(state.canvas(),null,'Existing text/control/map/fish gestures remain untouched');
  }
  state.pointer('pointerdown',state.blank,100,150,{button:2});state.pointer('pointerdown',state.blank,100,150,{pointerType:'touch'});assert.equal(state.canvas(),null);
  const down=state.pointer('pointerdown');assert.equal(down.defaultPrevented,true,'Blank-origin drags do not select nearby text');assert.ok(state.canvas());assert.equal(state.canvas().getAttribute('aria-hidden'),'true');assert.equal(state.frames.size,1);
  state.tick();assert.ok(state.paints.includes('wave'));state.paints.length=0;
  const move=state.pointer('pointermove',state.blank,190,170);state.tick();assert.equal(move.defaultPrevented,false);assert.ok(state.paints.filter(p=>p==='wave').length>2,'Dragging through blank space adds a fading wake');
  state.pointer('pointerup');state.tick(30);assert.equal(state.frames.size,0);assert.ok(state.canvas().hidden,'All particles disappear and the loop stops');
  state.pointer('pointerdown');state.tick(30);assert.equal(state.frames.size,0);
  state.pointer('pointermove',state.blank,180,160);assert.equal(state.frames.size,1,'Holding still until waves fade does not lose the ongoing drag');state.tick();state.pointer('pointerup');state.tick(30);
  state.pointer('pointerdown');state.hit(doc.querySelector('p'));state.paints.length=0;state.pointer('pointermove',state.blank,240,170);state.tick();assert.equal(state.paints.filter(p=>p==='wave').length,2,'No trail is interpolated across text');state.hit(state.blank);
  doc.dispatchEvent(new w.Event('scroll'));assert.equal(state.frames.size,0);assert.ok(state.canvas().hidden);
  for(let index=0;index<250;index++)state.pointer('pointerdown',state.blank,100+index%40,160);
  state.paints.length=0;state.tick();assert.ok(state.paints.filter(p=>p==='wave').length<=144,'Rapid clicking retains at most 72 particles');assert.equal(state.frames.size,1);assert.equal(doc.querySelectorAll('[data-pointer-play]').length,1);state.runAgain();assert.equal(state.frames.size,1);
  state.reduced.matches=true;state.reduced.change();assert.equal(state.frames.size,0);assert.ok(state.canvas().hidden);state.pointer('pointerdown');assert.equal(state.frames.size,0);
  state.reduced.matches=false;state.reduced.change();state.pointer('pointerdown');assert.equal(state.frames.size,1);state.visibility(true);assert.equal(state.frames.size,0);state.pointer('pointerdown');assert.equal(state.frames.size,0);state.visibility(false);
  state.pointer('pointerdown');doc.querySelector('dialog').open=true;await Promise.resolve();assert.equal(state.frames.size,0);state.pointer('pointerdown');assert.equal(state.frames.size,0);doc.querySelector('dialog').open=false;await Promise.resolve();
  state.pointer('pointerdown');doc.documentElement.dataset.opening='pending';await Promise.resolve();assert.equal(state.frames.size,0);delete doc.documentElement.dataset.opening;await Promise.resolve();
  state.pointer('pointerdown');w.dispatchEvent(new w.Event('blur'));assert.equal(state.frames.size,0);state.pointer('pointermove',state.blank,260,160);assert.equal(state.frames.size,0,'Leaving the window ends the drag');
  state.pointer('pointerdown');w.dispatchEvent(new w.Event('pagehide'));assert.equal(state.frames.size,0);state.pointer('pointerdown');assert.equal(state.frames.size,0);w.dispatchEvent(new w.Event('pageshow'));state.pointer('pointerdown');assert.equal(state.frames.size,1);
  w.innerWidth=500;w.innerHeight=600;w.dispatchEvent(new w.Event('resize'));assert.equal(state.canvas().width,750);assert.equal(state.canvas().height,900,'High DPI backing pixels are capped at 1.5x');assert.equal(state.frames.size,0);
  const range=doc.createRange();range.selectNodeContents(doc.querySelector('p'));w.getSelection().addRange(range);doc.dispatchEvent(new w.Event('selectionchange'));state.pointer('pointerdown');assert.equal(state.frames.size,0,'Selecting text never starts a drag effect');w.getSelection().removeAllRanges();
  state.mouse.matches=false;state.mouse.change();state.pointer('pointerdown');assert.equal(state.frames.size,0);state.dom.window.close();
  for(const options of [{touch:true},{reduced:true},{noCanvas:true},{tier:'light'}]){const quiet=setup(options);assert.doesNotThrow(()=>quiet.pointer('pointerdown'));assert.equal(quiet.canvas(),null);assert.equal(quiet.frames.size,0);quiet.dom.window.close();}
  const lively=setup({tier:'lively'});lively.pointer('pointermove',lively.blank,100,100,{buttons:0});lively.pointer('pointermove',lively.blank,140,100,{buttons:0});assert.equal(lively.frames.size,1,'Lively tier enables hover motes');lively.doc.documentElement.dataset.effects='light';lively.doc.dispatchEvent(new lively.w.Event('flyfish:effectschange'));assert.equal(lively.frames.size,0);lively.pointer('pointerdown');assert.equal(lively.frames.size,0);lively.dom.window.close();
  console.log('PASS: mouse-only blank-space gestures, click/drag rendering, text/control/map/fish protection, native event behavior, bounded particles/one idle-stopping loop, reduced motion and page/modal/scroll cleanup.');
})().catch(error=>{console.error(error);process.exitCode=1;});
