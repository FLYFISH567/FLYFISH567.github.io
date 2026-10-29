'use strict';
const assert=require('assert/strict'),fs=require('fs'),{JSDOM}=require('jsdom');
const source=fs.readFileSync('themes/flyfish/source/js/seasonal-atmosphere.js','utf8');
function setup({saved,blocked}={}){
  const dom=new JSDOM('<html data-theme="dark"><body><nav><button class="theme-toggle">主题</button></nav></body></html>',{runScripts:'outside-only',url:'https://example.test/'});
  const w=dom.window,doc=w.document;let now=new Date(2026,2,1,9,59).getTime(),hidden=false,id=0;const timers=new Map();
  const NativeDate=w.Date;w.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}};
  Object.defineProperty(doc,'hidden',{get:()=>hidden});
  w.setTimeout=(fn,delay)=>{const n=++id;timers.set(n,{fn,at:now+delay});return n;};w.clearTimeout=n=>timers.delete(n);
  if(saved)w.localStorage.setItem('flyfish-seasonal-atmosphere',saved);
  if(blocked)Object.defineProperty(w,'localStorage',{get(){throw Error('unavailable');}});
  w.eval(source);
  return {w,doc,timers,button:doc.querySelector('.seasonal-toggle'),setTime(date){now=date.getTime();},visibility(value){hidden=value;doc.dispatchEvent(new w.Event('visibilitychange'));},tick(ms){now+=ms;for(const [n,t] of [...timers])if(t.at<=now){timers.delete(n);t.fn();}},close(){dom.window.close();}};
}
const state=setup(),root=state.doc.documentElement;
assert.equal(state.button.getAttribute('aria-pressed'),'false');assert.equal(root.dataset.atmosphereSeason,undefined);assert.equal(state.timers.size,0);
state.button.click();assert.equal(root.dataset.atmosphereSeason,'spring');assert.equal(root.dataset.atmosphereTime,'morning');assert.equal(root.dataset.theme,'dark');assert.equal(state.button.getAttribute('aria-pressed'),'true');
state.tick(60000);assert.equal(root.dataset.atmosphereTime,'day');assert.equal(state.timers.size,1);
state.visibility(true);assert.equal(state.timers.size,0);state.setTime(new Date(2026,9,1,21));state.visibility(false);assert.equal(root.dataset.atmosphereSeason,'autumn');assert.equal(root.dataset.atmosphereTime,'night');
assert.equal(root.dataset.atmosphereFestival,'national-day');assert.match(state.button.textContent,/国庆/);
state.setTime(new Date(2026,9,2,0));state.w.dispatchEvent(new state.w.Event('pageshow'));assert.equal(root.dataset.atmosphereFestival,undefined,'The festival ends after its calendar day');
for(const [date,id,label] of [[new Date(2026,11,25,12),'christmas','圣诞'],[new Date(2027,0,1,12),'new-year','元旦']]){state.setTime(date);state.doc.dispatchEvent(new state.w.Event('flyfish:page'));assert.equal(root.dataset.atmosphereFestival,id);assert.match(state.button.textContent,new RegExp(label));assert.equal(root.dataset.theme,'dark');}
state.doc.dispatchEvent(new state.w.Event('flyfish:page'));state.w.eval(source);assert.equal(state.doc.querySelectorAll('.seasonal-toggle').length,1);assert.equal(state.timers.size,1);
state.w.dispatchEvent(new state.w.Event('pagehide'));assert.equal(state.timers.size,0);state.w.dispatchEvent(new state.w.Event('pageshow'));assert.equal(state.timers.size,1);
state.w.dispatchEvent(new state.w.StorageEvent('storage',{key:'flyfish-seasonal-atmosphere',newValue:'off'}));assert.equal(root.dataset.atmosphereSeason,undefined);assert.equal(root.dataset.atmosphereFestival,undefined,'Disabling atmosphere removes festival styling');assert.equal(root.dataset.theme,'dark');state.close();
const restored=setup({saved:'on'});assert.equal(restored.doc.documentElement.dataset.atmosphereSeason,'spring');restored.close();
const blocked=setup({blocked:true});blocked.button.click();assert.equal(blocked.doc.documentElement.dataset.atmosphereSeason,'spring');blocked.button.click();assert.equal(blocked.doc.documentElement.dataset.atmosphereSeason,undefined);blocked.close();
const css=fs.readFileSync('themes/flyfish/source/css/seasonal-atmosphere.css','utf8');assert.doesNotMatch(css,/animation\s*:/);assert.doesNotMatch(css,/--(?:bg|surface|ink|blue)\s*:/);
console.log('PASS: opt-in seasonal atmosphere and fixed-date festivals, local time, background pause, navigation, theme preservation and unavailable storage.');
