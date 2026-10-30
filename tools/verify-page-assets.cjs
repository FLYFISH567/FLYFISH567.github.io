'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const source=fs.readFileSync('themes/flyfish/source/js/page-assets.js','utf8');
const dom=new JSDOM('<head><script data-page-asset src="/js/daily-card.js?v=1"></script></head><body></body>',{url:'http://localhost/',runScripts:'outside-only'}),w=dom.window,doc=w.document;
const parse=html=>new w.DOMParser().parseFromString(html,'text/html'),loaded=[],append=doc.head.append.bind(doc.head);let failed=true;
doc.head.append=node=>{loaded.push(new URL(node.src||node.href).pathname);append(node);setImmediate(()=>node.dispatchEvent(new w.Event(failed&&(node.src||'').includes('retry')?'error':'load')));};w.eval(source);
(async()=>{
 const next=parse('<link data-page-asset rel="stylesheet" href="/css/markets.css"><script data-page-asset src="/js/market-data.js"></script><script data-page-asset src="/js/markets.js"></script><script data-page-asset src="/js/daily-card.js?v=1"></script>');
 await Promise.all([w.FlyfishPageAssets.prepare(next),w.FlyfishPageAssets.prepare(next)]);assert.deepEqual(loaded,['/css/markets.css','/js/market-data.js','/js/markets.js'],'Shared assets load once in dependency order');
 await w.FlyfishPageAssets.prepare(next);assert.equal(loaded.length,3,'Returning to a module never reexecutes it');
 const retry=parse('<script data-page-asset src="/js/retry.js"></script>');await assert.rejects(w.FlyfishPageAssets.prepare(retry));failed=false;await w.FlyfishPageAssets.prepare(retry);assert.equal(loaded.filter(x=>x==='/js/retry.js').length,2,'Failed dependencies can be retried');
 await assert.rejects(w.FlyfishPageAssets.prepare(parse('<script data-page-asset src="https://outside.test/js/module.js"></script>')));dom.window.close();
 const navSource=fs.readFileSync('themes/flyfish/source/js/navigation.js','utf8');const page=name=>`<html><body data-view="${name}"><main data-page-content id="main"><h1>${name}</h1></main></body></html>`;
 const d=new JSDOM(page('home'),{url:'http://localhost/',runScripts:'outside-only'}),win=d.window;win.scrollTo=()=>{};win.requestAnimationFrame=fn=>fn();win.requestIdleCallback=()=>{};const audio=d.window.document.createElement('audio');d.window.document.body.append(audio);
 win.fetch=async()=>({ok:true,headers:{get:()=> 'text/html'},text:async()=>page('toolbox')});win.FlyfishPageAssets={prepare:()=>Promise.reject(Error('offline'))};win.eval(navSource);
 assert.equal(await win.FlyfishNavigator.navigate('/toolbox/'),false);assert.equal(win.location.pathname,'/');assert.equal(win.document.querySelector('h1').textContent,'home');assert.equal(win.document.querySelector('audio'),audio,'A failed asset preserves the old page and player');
 win.FlyfishPageAssets.prepare=async()=>{};assert.equal(await win.FlyfishNavigator.navigate('/toolbox/'),true);d.window.close();
 console.log('PASS: page asset dependencies, concurrent deduplication, retry, same-origin guard and navigation failure recovery.');
})().catch(error=>{console.error(error);dom.window.close();process.exitCode=1;});
