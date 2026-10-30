'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const source=fs.readFileSync('themes/flyfish/source/js/navigation.js','utf8');
const html=name=>`<!doctype html><html><head><title>${name}</title></head><body data-view="${name}"><nav id="main-nav"><a href="/">首页</a><a href="/articles/">文章</a><a href="/album/">日常</a><a href="/briefing/">每日</a></nav><main data-page-content id="main"><h1>${name}</h1></main></body></html>`;
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const response=name=>({ok:true,headers:{get:()=> 'text/html'},text:async()=>html(name)});
function setup({saveData=false,slow=false}={}){
 const dom=new JSDOM(html('home'),{url:'https://example.test/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,doc=w.document,calls=[];let idle,now=1000000;
 Object.defineProperty(w.navigator,'connection',{value:{saveData,effectiveType:slow?'2g':'4g'},configurable:true});
 w.Date.now=()=>now;w.requestIdleCallback=fn=>{idle=fn;};w.scrollTo=()=>{};w.requestAnimationFrame=fn=>fn();
 w.fetch=async url=>{calls.push(new URL(url).pathname);return response(new URL(url).pathname.split('/')[1]);};
 w.eval(source);return {dom,w,doc,calls,idle:()=>idle(),advance:ms=>{now+=ms;},prefetch:href=>doc.querySelector(`a[href="${href}"]`).dispatchEvent(new w.FocusEvent('focusin',{bubbles:true}))};
}
(async()=>{
 const a=setup();a.idle();await flush();await flush();assert.deepEqual(a.calls,['/articles/','/album/']);
 await a.w.FlyfishNavigator.navigate('/articles/');assert.equal(a.calls.length,2,'Completed prefetch is reused');
 a.advance(120001);await a.w.FlyfishNavigator.navigate('/album/');assert.equal(a.calls.filter(x=>x==='/album/').length,2);a.dom.window.close();
 for(const options of [{saveData:true},{slow:true}]){const b=setup(options);b.idle();b.prefetch('/articles/');await flush();assert.equal(b.calls.length,0);assert.equal(await b.w.FlyfishNavigator.navigate('/articles/'),true,'Data saver still permits intentional navigation');b.dom.window.close();}
 const c=setup();for(const href of ['https://other.example/','/#section','/about/?giscus=token']){const link=c.doc.createElement('a');link.href=href;c.doc.body.append(link);link.dispatchEvent(new c.w.FocusEvent('focusin',{bubbles:true}));}await flush();assert.equal(c.calls.length,0);c.dom.window.close();
 const d=setup();let failedCalls=0;d.w.fetch=async()=>{if(++failedCalls===1)throw Error('offline');return response('articles');};d.prefetch('/articles/');await flush();assert.equal(await d.w.FlyfishNavigator.navigate('/articles/'),true);assert.equal(failedCalls,2);d.dom.window.close();
 // A real click waits for the same fetch even when the prefetch takes over 250ms.
 const e=setup();let finish,count=0,signal;e.w.fetch=(url,init)=>{count++;signal=init.signal;return new Promise(resolve=>{finish=resolve;});};e.prefetch('/articles/');await flush();
 const first=e.w.FlyfishNavigator.navigate('/articles/');await new Promise(resolve=>setTimeout(resolve,300));assert.equal(count,1,'No duplicate after 250ms');
 const second=e.w.FlyfishNavigator.navigate('/articles/');await flush();assert.equal(count,1,'Rapid same-target click reuses its request');assert.equal(signal.aborted,false);finish(response('articles'));assert.equal(await first,false);assert.equal(await second,true);e.dom.window.close();
 // Superseded foreground fetches are cancelled; servers ignoring abort cannot replace the new page.
 const f=setup();let oldResolve,oldSignal;f.w.fetch=(url,init)=>url.includes('/articles/')?(oldSignal=init.signal,new Promise(resolve=>{oldResolve=resolve;})):Promise.resolve(response('album'));
 const old=f.w.FlyfishNavigator.navigate('/articles/'),newer=f.w.FlyfishNavigator.navigate('/album/');assert.equal(await newer,true);assert.equal(await old,false);assert.equal(oldSignal.aborted,true);oldResolve(response('articles'));await flush();assert.equal(f.doc.querySelector('h1').textContent,'album');f.dom.window.close();
 // Bound a stuck promoted request even if fetch ignores AbortSignal. Retry can create a new request.
 const g=setup(),realTimer=g.w.setTimeout;g.w.setTimeout=(fn,ms)=>realTimer(fn,ms===12000?20:ms);let stuck=true;g.w.fetch=()=>stuck?new Promise(()=>{}):Promise.resolve(response('articles'));g.prefetch('/articles/');await flush();assert.equal(await g.w.FlyfishNavigator.navigate('/articles/'),false);assert.equal(g.doc.querySelector('h1').textContent,'home');assert.equal(g.doc.querySelector('.navigation-notice').hidden,false);stuck=false;assert.equal(await g.w.FlyfishNavigator.navigate('/articles/'),true);g.dom.window.close();
 const h=setup({saveData:true});for(let i=0;i<7;i++)await h.w.FlyfishNavigator.navigate('/p'+i+'/');await h.w.FlyfishNavigator.navigate('/p0/');assert.equal(h.calls.filter(url=>url==='/p0/').length,2,'Page cache evicts the oldest entry beyond six pages');h.dom.window.close();
 console.log('PASS: automatic navigation, bounded warmup/cache/expiry, in-flight reuse, independent cancellation, timeouts/retry and data-saver guards.');
})().catch(error=>{console.error(error);process.exitCode=1;});
