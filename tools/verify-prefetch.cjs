'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const source=fs.readFileSync('themes/flyfish/source/js/navigation.js','utf8');
const html=name=>`<!doctype html><html><head><title>${name}</title></head><body data-view="${name}"><nav id="main-nav"><a href="/">首页</a><a href="/articles/">文章</a><a href="/album/">日常</a><a href="/briefing/">每日</a></nav><main data-page-content id="main"><h1>${name}</h1></main></body></html>`;
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function setup({saveData=false,slow=false}={}){
 const dom=new JSDOM(html('home'),{url:'https://example.test/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,doc=w.document,calls=[];let idle,now=1000000;
 Object.defineProperty(w.navigator,'connection',{value:{saveData,effectiveType:slow?'2g':'4g'},configurable:true});
 w.Date.now=()=>now;w.requestIdleCallback=fn=>{idle=fn;};w.scrollTo=()=>{};w.requestAnimationFrame=fn=>fn();
 w.fetch=async url=>{calls.push(new URL(url).pathname);return {ok:true,headers:{get:()=> 'text/html'},text:async()=>html(new URL(url).pathname.split('/')[1])};};
 w.eval(source);return {dom,w,doc,calls,idle:()=>idle(),advance:ms=>{now+=ms;}};
}
(async()=>{
 const a=setup();a.idle();await flush();await flush();assert.deepEqual(a.calls,['/articles/','/album/'],'Only two main pages are warmed');
 a.w.FlyfishNavigator.enable();await a.w.FlyfishNavigator.navigate('/articles/');assert.equal(a.calls.length,2,'Navigation reuses completed prefetch');assert.equal(a.doc.querySelector('h1').textContent,'articles');
 a.advance(120001);await a.w.FlyfishNavigator.navigate('/album/');assert.equal(a.calls.filter(x=>x==='/album/').length,2,'Expired entries are fetched again');a.dom.window.close();
 for(const options of [{saveData:true},{slow:true}]){const b=setup(options);b.idle();const link=b.doc.querySelector('a[href="/articles/"]');link.dispatchEvent(new b.w.FocusEvent('focusin',{bubbles:true}));await flush();assert.equal(b.calls.length,0,'Slow and data-saving connections never prefetch');b.dom.window.close();}
 const c=setup();const external=c.doc.createElement('a');external.href='https://other.example/';c.doc.body.append(external);external.dispatchEvent(new c.w.FocusEvent('focusin',{bubbles:true}));const hash=c.doc.createElement('a');hash.href='/#section';c.doc.body.append(hash);hash.dispatchEvent(new c.w.FocusEvent('focusin',{bubbles:true}));await flush();assert.equal(c.calls.length,0,'External links and in-page anchors never prefetch');c.dom.window.close();
 // A failed speculative request must fall back to a normal navigation.
 const d=setup();let failedCalls=0;d.w.fetch=async url=>{failedCalls++;if(failedCalls===1)throw Error('offline');return {ok:true,headers:{get:()=> 'text/html'},text:async()=>html('articles')};};
 d.doc.querySelector('a[href="/articles/"]').dispatchEvent(new d.w.FocusEvent('focusin',{bubbles:true}));await flush();d.w.FlyfishNavigator.enable();assert.equal(await d.w.FlyfishNavigator.navigate('/articles/'),true);assert.equal(failedCalls,2);assert.equal(d.doc.querySelector('h1').textContent,'articles');d.dom.window.close();
 // An unresponsive prefetch must not hold up a click indefinitely.
 const e=setup();let slowCalls=0;e.w.fetch=url=>{slowCalls++;return slowCalls===1?new Promise(()=>{}):Promise.resolve({ok:true,headers:{get:()=> 'text/html'},text:async()=>html('articles')});};
 e.doc.querySelector('a[href="/articles/"]').dispatchEvent(new e.w.FocusEvent('focusin',{bubbles:true}));await flush();e.w.FlyfishNavigator.enable();assert.equal(await e.w.FlyfishNavigator.navigate('/articles/'),true);assert.equal(slowCalls,2);e.dom.window.close();
 console.log('PASS: bounded warmup, cache reuse and expiry, data-saver and slow-network guards, failed or stalled prefetch fallback, external/anchor exclusions.');
})().catch(error=>{console.error(error);process.exitCode=1;});
