'use strict';
const assert=require('assert/strict'),fs=require('fs'),{JSDOM}=require('jsdom');
const source=fs.readFileSync('themes/flyfish/source/js/seasonal-atmosphere.js','utf8');
function setup({saved,blocked}={}){
 const dom=new JSDOM('<html data-theme="dark"><body><nav><button class="theme-toggle">主题</button></nav><footer class="site-footer"></footer><dialog></dialog></body></html>',{runScripts:'outside-only',url:'https://example.test/'}),w=dom.window,doc=w.document;let now=new Date(2026,2,1,9,59).getTime(),hidden=false,id=0;const timers=new Map(),media=new w.EventTarget();media.matches=false;w.matchMedia=()=>media;
 const NativeDate=w.Date;w.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}};
 Object.defineProperty(doc,'hidden',{get:()=>hidden});w.setTimeout=(fn,delay)=>{const n=++id;timers.set(n,{fn,at:now+delay});return n;};w.clearTimeout=n=>timers.delete(n);
 if(saved)w.localStorage.setItem('flyfish-seasonal-atmosphere',saved);if(blocked)Object.defineProperty(w,'localStorage',{get(){throw Error('unavailable');}});w.eval(source);
 return {w,doc,timers,media,choose:mode=>doc.querySelector(`[data-seasonal-mode="${mode}"]`).click(),setTime(date){now=date.getTime();},visibility(value){hidden=value;doc.dispatchEvent(new w.Event('visibilitychange'));},tick(ms){now+=ms;for(const[n,t]of[...timers])if(t.at<=now){timers.delete(n);t.fn();}},close:()=>dom.window.close()};
}
(async()=>{
const s=setup(),root=s.doc.documentElement,layer=s.doc.querySelector('.seasonal-particles');assert.ok(s.doc.querySelector('.site-footer .seasonal-settings'));assert.equal(s.doc.querySelector('nav .seasonal-settings'),null);assert.equal(layer.hidden,true);assert.equal(s.timers.size,0);
s.choose('auto');assert.equal(root.dataset.atmosphereSeason,'spring');assert.equal(root.dataset.atmosphereTime,'morning');assert.equal(root.dataset.theme,'dark');assert.ok(layer.children.length>0&&layer.children.length<=18);s.tick(60000);assert.equal(root.dataset.atmosphereTime,'day');assert.equal(s.timers.size,1);
for(const season of ['spring','summer','autumn','winter']){s.choose(season);assert.equal(layer.dataset.season,season);assert.equal(root.dataset.atmosphereSeason,season);assert.equal(s.doc.querySelectorAll('[aria-pressed=true]').length,1);}
s.visibility(true);assert.equal(s.timers.size,0);assert.equal(layer.hidden,true);s.visibility(false);assert.equal(layer.hidden,false);
root.dataset.effects='light';s.doc.dispatchEvent(new s.w.Event('flyfish:effectschange'));assert.equal(layer.hidden,true);root.dataset.effects='standard';s.doc.dispatchEvent(new s.w.Event('flyfish:effectschange'));s.media.matches=true;s.media.dispatchEvent(new s.w.Event('change'));assert.equal(layer.hidden,true);s.media.matches=false;s.media.dispatchEvent(new s.w.Event('change'));assert.equal(layer.hidden,false);
s.doc.querySelector('dialog').setAttribute('open','');await Promise.resolve();assert.equal(layer.hidden,true);s.doc.querySelector('dialog').removeAttribute('open');await Promise.resolve();assert.equal(layer.hidden,false);
s.choose('auto');for(const[date,id]of[[new Date(2026,9,1,12),'national-day'],[new Date(2026,11,25,12),'christmas'],[new Date(2027,0,1,12),'new-year']]){s.setTime(date);s.doc.dispatchEvent(new s.w.Event('flyfish:page'));assert.equal(root.dataset.atmosphereFestival,id);assert.equal(root.dataset.theme,'dark');}
s.setTime(new Date(2027,0,2,0));s.w.dispatchEvent(new s.w.Event('pageshow'));assert.equal(root.dataset.atmosphereFestival,undefined);s.w.eval(source);assert.equal(s.doc.querySelectorAll('.seasonal-settings').length,1);assert.equal(s.doc.querySelectorAll('.seasonal-particles').length,1);
s.w.dispatchEvent(new s.w.StorageEvent('storage',{key:'flyfish-seasonal-atmosphere',newValue:'off'}));assert.equal(root.dataset.atmosphereSeason,undefined);assert.equal(layer.hidden,true);s.close();
const old=setup({saved:'on'});assert.equal(old.doc.documentElement.dataset.atmosphereSeason,'spring');old.close();const blocked=setup({blocked:true});blocked.choose('winter');assert.equal(blocked.doc.documentElement.dataset.atmosphereSeason,'winter');blocked.close();
console.log('PASS: footer season previews, bounded particles, motion/dialog/visibility suspension, theme preservation, calendar and storage fallback.');
})().catch(error=>{console.error(error);process.exitCode=1;});
