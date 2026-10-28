'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const html=fs.readFileSync('public/articles/index.html','utf8'),index=JSON.parse(fs.readFileSync('public/search-index.json','utf8'));
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
function setup(failed=false){
 const dom=new JSDOM(html,{url:'https://blog.example/articles/?q=updatexml',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,doc=w.document;let fail=failed,calls=0;
 w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}disconnect(){}};w.IntersectionObserver=class{observe(){}disconnect(){}};w.scrollTo=()=>{};
 w.fetch=async()=>{calls++;if(fail)throw Error('offline');return {ok:true,json:async()=>index};};
 const dialog=doc.querySelector('#site-search');dialog.showModal=()=>dialog.open=true;dialog.close=()=>{dialog.open=false;dialog.dispatchEvent(new w.Event('close'));};
 for(const file of ['search-core','flyfish','search'])w.eval(fs.readFileSync('themes/flyfish/source/js/'+file+'.js','utf8'));
 return {dom,w,doc,get calls(){return calls;},recover(){fail=false;}};
}
(async()=>{
 const state=setup();await flush();const {doc,w}=state;
 const visible=()=>[...doc.querySelectorAll('[data-post-card]')].filter(e=>!e.hidden);
 assert.equal(visible().length,5,'Body-only keyword is found in the article library');assert.equal(state.calls,1);
 doc.querySelector('[data-open-search]').click();await flush();const input=doc.querySelector('#site-search input');input.value='updatexml';input.dispatchEvent(new w.Event('input'));await new Promise(resolve=>setTimeout(resolve,130));
 const library=visible().map(e=>w.FlyfishSearch.key(e.dataset.url)).sort(),modal=[...doc.querySelectorAll('[data-search-results] a')].map(e=>w.FlyfishSearch.key(e.href)).sort();assert.deepEqual(library,modal,'Both entry points share the same full-text result set');assert.equal(state.calls,1,'Both search entry points share one index request');
 doc.querySelector('input[name=q]').value='SQL updatexml';doc.querySelector('input[name=q]').dispatchEvent(new w.Event('input'));assert.equal(visible().length,5,'Whitespace-separated terms use AND matching');
 doc.querySelector('[data-topic=SSRF]').click();assert.equal(visible().length,0,'Topic filter still intersects full-text results');state.dom.window.close();
 const offline=setup(true);await flush();assert.match(offline.doc.querySelector('[data-results-count]').textContent,/正文搜索暂不可用/);assert.equal(offline.doc.querySelector('[data-fulltext-retry]').hidden,false);offline.recover();offline.doc.querySelector('[data-fulltext-retry]').click();await flush();assert.equal([...offline.doc.querySelectorAll('[data-post-card]')].filter(e=>!e.hidden).length,5);offline.dom.window.close();
 console.log('PASS: shared full-text results, body-only and multiword queries, topic intersection, one cached index, graceful failure and retry.');
})().catch(error=>{console.error(error);process.exitCode=1;});
