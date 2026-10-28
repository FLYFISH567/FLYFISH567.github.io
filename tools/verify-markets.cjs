'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom'),api=require('../themes/flyfish/source/js/market-data.js');
const html=fs.readFileSync('public/briefing/index.html','utf8'),seed=JSON.parse(fs.readFileSync('source/_data/markets.json','utf8'));
const code=fs.readFileSync('themes/flyfish/source/js/markets.js','utf8'),parser=fs.readFileSync('themes/flyfish/source/js/market-data.js','utf8');
assert.equal(api.MARKETS.length,20);assert.equal(api.GROUPS.length,6);assert.equal(Object.keys(api.cleanSnapshot(seed).quotes).length,20);
assert.deepEqual(api.selection(['SSE:000001','FOREXCOM:SPXUSD','unknown','sse']),['sse','sp500'],'Existing choices migrate to actual index IDs');
assert.equal(api.localTime('2026-10-27 17:15:59','America/New_York'),'2026-10-27T21:15:59.000Z');
assert.equal(api.localTime('2026-12-01 16:00:00','America/New_York'),'2026-12-01T21:00:00.000Z','Winter uses EST');
assert.equal(api.localTime('20261028141516','Asia/Shanghai'),'2026-10-28T06:15:16.000Z');
assert.equal(api.localTime('20260230120000','Asia/Shanghai'),'','Invalid dates are rejected');
assert.equal(api.quoteTime('2026-10-28T06:15:00Z',Date.parse('2026-10-28T08:00:00Z')),'今日 14:15');
assert.equal(api.quoteTime('2026-10-27T06:15:00Z',Date.parse('2026-10-28T08:00:00Z')),'10/27 14:15','Old quotes retain the source date');
function tencent(code,price,change,percent,date){const fields=Array(33).fill('0');fields[3]=String(price);fields[30]=date;fields[31]=String(change);fields[32]=String(percent);return `v_${code}="${fields.join('~')}";`;}
const raw=tencent('sh000688',1275.87,23.59,1.88,'20261028141118')+'\n'+tencent('usIXIC',26477.81,308.43,1.18,'2026-10-27 17:15:59');
const parsed=api.parseTencent(raw);assert.equal(parsed.star50.price,1275.87);assert.equal(parsed.nasdaq.quotedAt,'2026-10-27T21:15:59.000Z');assert.equal(parsed.nasdaq.percent,1.18);
assert.deepEqual(api.parseTencent('window.hacked=true;\nv_unknown="bad";'),{},'Public quote text is parsed, never executed');
assert.deepEqual(api.parseTencent(tencent('sh000688',0,0,0,'20261028141118')),{},'Missing and zero prices never become a fake quote');
const wscn={code:20000,data:{fields:['prod_name','last_px','px_change','px_change_rate','update_time'],snapshot:{'XAUUSD.OTC':['Gold',4030,-30.33,-0.75,1793167872]}}};
assert.equal(api.parseWscn(wscn).gold.price,4030);assert.equal(api.byId('gold').unit,'美元/盎司');assert.equal(api.byId('shgold').unit,'元/克');
const flush=async()=>{for(let i=0;i<35;i++)await Promise.resolve();};
const open=[];
function setup(options={}){
 const dom=new JSDOM(html,{url:'https://blog.example/briefing/',runScripts:'outside-only',pretendToBeVisual:true});open.push(dom);const w=dom.window,doc=w.document;
 w.TextDecoder=TextDecoder;if(options.prefs)w.localStorage.setItem('flyfish-market-prefs-v2',JSON.stringify(options.prefs));if(options.old)w.localStorage.setItem('flyfish-briefing-prefs-v1',JSON.stringify({markets:options.old}));
 if(options.hidden)Object.defineProperty(doc,'hidden',{value:true});if(options.blocked)Object.defineProperty(w,'localStorage',{get(){throw Error('blocked');}});
 let calls=0;const intervals=new Map();let serial=0;
 w.setInterval=(fn,delay)=>{intervals.set(++serial,{fn,delay});return serial;};w.clearInterval=id=>intervals.delete(id);
 w.fetch=async(url,init)=>{calls++;if(options.fetch)return options.fetch(url,init);throw Error('offline');};w.eval(parser);w.eval(code);
 return {dom,w,doc,intervals,get calls(){return calls;},click(selector){const node=doc.querySelector(selector);assert.ok(node,selector);node.click();}};
}
(async()=>{try{
 const state=setup();await flush();assert.equal(state.calls,2,'One batch per selected provider');assert.equal(state.doc.querySelectorAll('[data-market-id]').length,8);assert.equal(state.doc.querySelectorAll('.market-cached').length,8);
 assert.equal(state.doc.querySelector('[data-market-id=nasdaq] time').dateTime,seed.quotes.nasdaq.quotedAt,'An offline quote keeps its actual timestamp');assert.equal(state.intervals.size,1);
 state.click('[data-market-group=cn]');await flush();assert.equal(state.doc.querySelectorAll('[data-market-id]').length,9);assert.ok(state.doc.querySelector('[data-market-id=star50]'));assert.ok(state.doc.querySelector('[data-market-id=bse50]'));
 state.click('[data-market-group=hk]');await flush();assert.equal(state.doc.querySelectorAll('[data-market-id]').length,3);assert.ok(state.doc.querySelector('[data-market-id=hstech]'));
 state.click('[data-market-group=gold]');await flush();assert.equal(state.doc.querySelectorAll('[data-market-id]').length,2);assert.match(state.doc.querySelector('[data-market-grid]').textContent,/元\/克/);
 state.click('[data-market-manage]');state.doc.querySelectorAll('[name=market]').forEach(i=>i.checked=false);state.doc.querySelector('[data-market-form]').dispatchEvent(new state.w.Event('submit',{bubbles:true,cancelable:true}));assert.match(state.doc.querySelector('[data-market-feedback]').textContent,/至少/);
 state.doc.querySelector('[name=market][value=hstech]').checked=true;state.doc.querySelector('[name=market][value=star50]').checked=true;state.doc.querySelector('[data-market-form]').dispatchEvent(new state.w.Event('submit',{bubbles:true,cancelable:true}));await flush();assert.equal(state.doc.querySelectorAll('[data-market-id]').length,2);const saved=JSON.parse(state.w.localStorage.getItem('flyfish-market-prefs-v2'));assert.deepEqual(saved.watch,['star50','hstech']);
 state.doc.dispatchEvent(new state.w.CustomEvent('flyfish:before-page'));assert.equal(state.intervals.size,0);state.doc.dispatchEvent(new state.w.CustomEvent('flyfish:page'));assert.equal(state.intervals.size,1);assert.equal(state.doc.querySelectorAll('[data-market-id]').length,2,'No duplicate handlers after site navigation');
 state.click('[data-markets-toggle]');assert.equal(state.doc.querySelector('[data-markets-content]').hidden,true);
 const restored=setup({prefs:saved});await flush();assert.equal(restored.doc.querySelectorAll('[data-market-id]').length,2);
 const hidden=setup({hidden:true});await flush();assert.equal(hidden.calls,0,'Hidden pages do not poll quotes');
 const blocked=setup({blocked:true});await flush();blocked.click('[data-market-manage]');assert.match(blocked.doc.querySelector('[data-market-feedback]').textContent,/存储不可用/);
 const pending=[];const race=setup({prefs:{watch:['sse'],group:'watch'},fetch:(url)=>new Promise(resolve=>pending.push({url,resolve}))});race.click('[data-market-group=us]');assert.equal(pending.length,2);
 const response=body=>({ok:true,arrayBuffer:async()=>new TextEncoder().encode(body).buffer});pending[1].resolve(response(raw));await flush();pending[0].resolve(response(tencent('sh000001',99999,999,99,'20261028141118')));await flush();assert.equal(race.doc.querySelector('[data-market-group=us]').getAttribute('aria-pressed'),'true');assert.equal(race.doc.querySelectorAll('[data-market-id]').length,4);const cached=JSON.parse(race.w.localStorage.getItem('flyfish-market-cache-v2'));assert.notEqual(cached.quotes.sse.price,99999,'A late cancelled response cannot replace the newest view/cache');
 assert.equal(state.doc.querySelectorAll('iframe,script[src*=tradingview]').length,0,'No opaque embedded quote widgets');
 console.log('PASS: 20 real instruments/6 groups, GBK quote parsing, US daylight/winter timezone conversion, actual quote timestamps, no synthetic prices, provider batching, region/watchlist persistence, offline/cache states, request races and navigation/visibility cleanup.');
 }finally{open.forEach(dom=>dom.window.close());}
})().catch(error=>{console.error(error);process.exitCode=1;});
