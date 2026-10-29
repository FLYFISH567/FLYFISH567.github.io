'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('themes/flyfish/source/js/daily-card.js','utf8');
let current=new Date(2026,0,1,23,59,59,0).getTime(),callback,delay;
class FakeDate extends Date { constructor(...args){super(...(args.length?args:[current]));} static now(){return current;} }
const events={},nodes={'[data-daily-quote]':{},'[data-daily-attribution]':{},'[data-daily-date]':{}};
const document={hidden:false,querySelector:selector=>nodes[selector],addEventListener:(name,fn)=>events[name]=fn};
vm.runInNewContext(source,{Date:FakeDate,document,setTimeout:(fn,ms)=>{callback=fn;delay=ms;return 1;},clearTimeout:()=>{}});
const result=()=>({text:nodes['[data-daily-quote]'].textContent,attribution:nodes['[data-daily-attribution]'].textContent,date:nodes['[data-daily-date]'].dateTime});
const first=result();assert.ok(first.text&&first.attribution);assert.equal(first.date,'2026-01-01');assert.equal(delay,1100);
events['flyfish:page']();assert.deepEqual(result(),first,'Same day must be stable after navigation');
current=new Date(2026,0,2,0,0,0,100).getTime();callback();assert.equal(result().date,'2026-01-02');assert.notEqual(result().text,first.text,'Midnight advances the sentence');
const seen=new Set(),attributions=new Set();
for(let i=0;i<36;i++) {current=new Date(2026,0,1+i,12).getTime();events['flyfish:page']();const item=result();assert.ok(item.text&&item.attribution);assert.ok(!seen.has(item.text),'Sentences should be unique');seen.add(item.text);attributions.add(item.attribution);}
assert.equal(seen.size,36);assert.ok([...attributions].some(value=>value.includes('译意')));assert.ok([...attributions].some(value=>value.includes('原创')));assert.ok([...attributions].some(value=>value.includes('王维')));
const saved=nodes['[data-daily-quote]'];nodes['[data-daily-quote]']=null;events['flyfish:page']();nodes['[data-daily-quote]']=saved;current=new Date(2026,1,8,10).getTime();events['flyfish:page']();assert.equal(result().date,'2026-02-08','Returning to the page must refresh');
current=new Date(2026,1,9,10).getTime();events.visibilitychange();assert.equal(result().date,'2026-02-09','Returning to a visible tab refreshes the date');
console.log('PASS: 36 distinct daily sentences, source labels, stable same-day selection, midnight refresh, navigation and visibility recovery.');
// 首页侧栏用真实生成的标记验证手动切换和站内返回。
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('public/index.html','utf8');
const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://example.test/'}),win=dom.window,doc=win.document;
let card=doc.querySelector('[data-sidebar-moment]');
assert.ok(card,'Home sidebar contains the daily card');
assert.equal(card.querySelector('[data-moment-tabs]').hidden,true,'No-script default keeps controls hidden');
assert.equal(card.querySelector('[data-moment-panel="quote"]').hidden,false,'No-script default shows a quote');
assert.equal(card.querySelector('[data-moment-panel="essay"]').hidden,true);
assert.ok(card.querySelector('noscript a[href="/essay/"]'),'No-script users can still reach notes');
win.eval(source);
const checkSwitch=()=>{
  const tabs=card.querySelector('[data-moment-tabs]'),quote=card.querySelector('[data-moment-tab="quote"]'),essay=card.querySelector('[data-moment-tab="essay"]');
  assert.equal(tabs.hidden,false);assert.equal(quote.getAttribute('aria-pressed'),'true');
  essay.click();assert.equal(essay.getAttribute('aria-pressed'),'true');assert.equal(quote.getAttribute('aria-pressed'),'false');
  assert.equal(card.querySelector('[data-moment-panel="quote"]').hidden,true);assert.equal(card.querySelector('[data-moment-panel="essay"]').hidden,false);
  quote.click();assert.equal(card.querySelector('[data-moment-panel="quote"]').hidden,false);assert.equal(card.querySelector('[data-moment-panel="essay"]').hidden,true);
};
checkSwitch();
const next=new JSDOM(html).window.document.querySelector('[data-sidebar-moment]');card.replaceWith(doc.importNode(next,true));card=doc.querySelector('[data-sidebar-moment]');doc.dispatchEvent(new win.Event('flyfish:page'));checkSwitch();
win.close();
console.log('PASS: home quote and latest note switch accessibly, retain a no-script fallback, and initialize after navigation.');
