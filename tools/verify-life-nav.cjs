'use strict';
// 验证跨页面的滑块接续不会影响原生链接、历史返回或无动画偏好。
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('themes/flyfish/source/js/life-nav.js','utf8');
const now=10000;
function run(options={}){
  let stored=options.previous?JSON.stringify(options.previous):null,resize,change;
  const events={},classes=new Set(),animations=[];
  const links=['/album/','/life/','/essay/','/bangumis/'].map((pathname,index)=>({
    pathname,target:'',hasAttribute:()=>false,
    rect:{left:100+index*66.4,top:200,width:58.4,height:40},
    getBoundingClientRect(){return this.rect;}
  }));
  const indicator={style:{},setAttribute(){},animate(frames,timing){const item={frames,timing,cancelled:false,cancel(){this.cancelled=true;}};animations.push(item);return item;}};
  const nav={querySelectorAll:()=>links,querySelector:()=>links[1],prepend(){},classList:{add:name=>classes.add(name)},addEventListener:(name,fn)=>events[name]=fn,getBoundingClientRect:()=>({left:100,top:200})};
  const storage={getItem(){if(options.blocked)throw Error('blocked');return stored;},removeItem(){stored=null;},setItem(key,value){if(options.blocked)throw Error('blocked');stored=value;}};
  vm.runInNewContext(source,{
    AbortController,document:{documentElement:{dataset:{effects:options.tier||'standard'}},addEventListener(){},querySelector:()=>nav,createElement:()=>indicator},sessionStorage:storage,
    matchMedia:()=>({matches:!!options.reduced,addEventListener:(_,fn)=>change=fn}),
    location:{pathname:'/life/'},performance:{getEntriesByType:()=>[{type:options.navigation||'navigate'}]},Date:{now:()=>now},
    window:{ResizeObserver:true,addEventListener:(name,fn)=>events[name]=fn},ResizeObserver:class{constructor(fn){resize=fn;}observe(){}disconnect(){}}
  });
  return {links,indicator,animations,events,classes,resize:()=>resize(),change:()=>change(),get stored(){return stored;},click(index,extra={}){events.click({target:{closest:()=>links[index]},button:0,...extra});}};
}
const previous={tab:'/album/',to:'/life/',time:now-100};
const moving=run({previous});
assert.equal(moving.animations.length,1);
assert.equal(moving.animations[0].timing.duration,300);
assert.equal(moving.animations[0].frames[0].transform,'translate(0px,0px)');
assert.equal(moving.animations[0].frames[1].transform,moving.indicator.style.transform);
assert.equal(moving.stored,null,'A pending transition must be consumed once');
moving.resize();assert.equal(moving.animations[0].cancelled,false,'Initial observer callback must not cancel the slide');
moving.links[1].rect.left=180;moving.links[1].rect.width=70;
moving.resize();assert.equal(moving.animations[0].cancelled,true);assert.equal(moving.indicator.style.transform,'translate(80px,0px)');assert.equal(moving.indicator.style.width,'70px');
for(const options of [{},{previous,reduced:true},{previous,blocked:true},{previous,navigation:'reload'},{previous,navigation:'back_forward'},{previous:{...previous,time:now-5000}},{previous:{...previous,time:now+100}},{previous:{...previous,to:'/essay/'}}]){
  const state=run(options);assert.equal(state.animations.length,0);assert.ok(state.classes.has('has-tab-indicator'));
}
for(const extra of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1},{defaultPrevented:true}]){const state=run();state.click(2,extra);assert.equal(state.stored,null);}
const normal=run();normal.click(2);assert.deepEqual(JSON.parse(normal.stored),{tab:'/life/',to:'/essay/',time:now});
const current=run();current.click(1);assert.equal(current.stored,null);
const reduced=run({reduced:true});reduced.click(2);assert.equal(reduced.stored,null);
const blocked=run({blocked:true});assert.doesNotThrow(()=>blocked.click(2));
const restored=run({previous});restored.events.pageshow({persisted:true});assert.equal(restored.indicator.style.width,'58.4px');
const preference=run({previous});preference.change();assert.equal(preference.animations[0].cancelled,true);
console.log('PASS: native navigation, one-time slide continuation, modified clicks, storage failure, stale/reload/history guards, resize alignment and reduced motion.');
