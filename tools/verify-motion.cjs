'use strict';
// 开屏会短暂覆盖页面，验证它可以跳过，并在资源或存储异常时自行结束。
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const layout=fs.readFileSync('themes/flyfish/layout/layout.ejs','utf8');
const boot=layout.match(/<script>(try\{if\(!matchMedia[\s\S]+?)<\/script>/)[1];
function bootstrap(options={}){
  const root={dataset:{}},timers=[];
  vm.runInNewContext(boot,{
    document:{documentElement:root},matchMedia:()=>({matches:!!options.reduced}),
    sessionStorage:{getItem:()=>{if(options.blocked)throw Error('blocked');return options.seen;}},
    location:{hash:options.hash||''},performance:{getEntriesByType:()=>[{type:options.navigation||'navigate'}]},
    setTimeout:(fn,delay)=>timers.push({fn,delay})
  });
  return {root,timers};
}
const first=bootstrap();assert.equal(first.root.dataset.opening,'pending');
assert.equal(first.timers[0].delay,2800);first.timers[0].fn();assert.equal(first.root.dataset.opening,undefined);
for(const options of [{seen:'1'},{reduced:true},{blocked:true},{hash:'#main'},{navigation:'back_forward'}]){
  const state=bootstrap(options);assert.equal(state.root.dataset.opening,undefined);assert.equal(state.timers.length,0);
}
const source=fs.readFileSync('themes/flyfish/source/js/motion.js','utf8');
function openingRun(){
  const timers=new Map(),events={},root={dataset:{opening:'pending'},removeAttribute(){delete this.dataset.opening;}};
  let skip,stored=false,serial=0;
  const opening={contains:()=>false,classList:{add(){}},querySelector:()=>({addEventListener:(_,fn)=>{skip=fn;}}),hidden:false};
  vm.runInNewContext(source,{
    document:{documentElement:root,querySelector:selector=>selector==='.opening-screen'?opening:null,addEventListener:(name,fn)=>events[name]=fn,removeEventListener:name=>delete events[name]},
    matchMedia:()=>({matches:false,addEventListener(){}}),window:{addEventListener(){}},
    sessionStorage:{setItem:()=>{stored=true;}},setTimeout:(fn,delay)=>{timers.set(++serial,{fn,delay});return serial;},clearTimeout:id=>timers.delete(id)
  });
  return {root,timers,events,skip,get removed(){return opening.hidden;},get stored(){return stored;}};
}
for(const action of ['timer','click','Escape','Enter','Tab']){
  const state=openingRun();assert.equal(state.stored,true);
  assert.equal(state.timers.get(1).delay,2000,'Opening holds for 2s before the 0.4s fade');
  if(action==='timer')state.timers.get(1).fn();else if(action==='click')state.skip();else state.events.keydown({key:action});
  assert.equal(state.root.dataset.opening,undefined,action+' must reveal page');
  [...state.timers.values()].find(timer=>timer.delay===450).fn();assert.equal(state.removed,true);
}
console.log('PASS: opening auto-dismiss, click/keyboard skip, once-per-session gate, reduced motion, anchor/history navigation, unavailable storage and script-failure fallback.');
