'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom'),ejs=require('ejs');
const source=fs.readFileSync('themes/flyfish/source/js/effects.js','utf8');
for(const saved of [null,'light','standard','lively','invalid']){
 const dom=new JSDOM(ejs.render(fs.readFileSync('themes/flyfish/layout/_partials/footer-fish.ejs','utf8')),{url:'http://localhost/',runScripts:'outside-only'}),w=dom.window,doc=w.document,pref={matches:false,addEventListener:(_,fn)=>pref.change=fn};w.matchMedia=()=>pref;
 if(saved)w.localStorage.setItem('flyfish-effects-tier',saved);let changes=0;doc.addEventListener('flyfish:effectschange',()=>changes++);w.eval(source);
 assert.equal(doc.documentElement.dataset.effects,['light','standard','lively'].includes(saved)?saved:'standard');
 for(const [tier,cap] of [['light',2],['standard',6],['lively',9]]){doc.querySelector(`[data-effects-tier="${tier}"]`).click();assert.equal(doc.documentElement.dataset.effects,tier);assert.equal(w.localStorage.getItem('flyfish-effects-tier'),tier);assert.equal(doc.querySelectorAll('[data-effects-tier][aria-pressed=true]').length,1);assert.match(doc.querySelector('[data-effects-note]').textContent,new RegExp('自动模式最多 '+cap+' 条'));assert.match(doc.querySelector('[data-effects-note]').textContent,/手动数量独立设置/);}
 pref.matches=true;pref.change();assert.match(doc.querySelector('[data-effects-note]').textContent,/系统已减少/);assert.equal(doc.documentElement.dataset.effects,'lively');w.dispatchEvent(new w.StorageEvent('storage',{key:'flyfish-effects-tier',newValue:'light'}));assert.equal(doc.documentElement.dataset.effects,'light');assert.ok(changes>=6);dom.window.close();
}
console.log('PASS: default standard tier, persisted preference, immediate shared events, one pressed control, explicit automatic fish density and independent manual counts, reduced-motion override and cross-tab synchronization.');
