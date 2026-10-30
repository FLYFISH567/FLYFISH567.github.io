'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const home=fs.readFileSync('public/index.html','utf8'),explore=fs.readFileSync('themes/flyfish/source/js/explore.js','utf8');
const dom=new JSDOM(home,{runScripts:'outside-only',url:'https://example.com/'}),w=dom.window,d=w.document,dialog=d.querySelector('#site-explore');
let fetches=0;w.fetch=()=>{fetches++;return Promise.reject(Error('unexpected request'));};w.Math.random=()=>0;dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;dialog.dispatchEvent(new w.Event('close'));};w.eval(explore);
const opener=d.querySelector('[data-open-explore][data-explore-mode="idea"]');assert.ok(opener&&!opener.hidden);opener.click();
assert.equal(dialog.open,true);assert.equal(fetches,0,'Ideas do not require network');assert.equal(d.querySelector('[data-explore-kind="idea"]').getAttribute('aria-pressed'),'true');assert.match(d.querySelector('[data-explore-heading]').textContent,/歌/);assert.equal(d.querySelector('[data-explore-go]').getAttribute('href'),'/music/');
const titles=new Set([d.querySelector('[data-explore-heading]').textContent]),summaries=new Set([d.querySelector('[data-explore-summary]').textContent]),labels=new Set();
d.querySelector('[data-explore-next]').click();assert.match(d.querySelector('[data-explore-heading]').textContent,/故事/);assert.equal(d.querySelector('[data-explore-go]').getAttribute('href'),'/bangumis/');titles.add(d.querySelector('[data-explore-heading]').textContent);summaries.add(d.querySelector('[data-explore-summary]').textContent);
const partialHistory=w.sessionStorage.getItem('flyfish-explore-ideas');
for(let i=2;i<128;i++){
 d.querySelector('[data-explore-next]').click();const title=d.querySelector('[data-explore-heading]').textContent,summary=d.querySelector('[data-explore-summary]').textContent;
 assert.ok(title.trim()&&summary.trim(),'Every idea has a title and a concrete prompt');assert.ok(!titles.has(title),'No repeated idea within a complete round');assert.ok(!summaries.has(summary),'Prompts are distinct');titles.add(title);summaries.add(summary);labels.add(d.querySelector('[data-explore-label]').textContent);
 assert.equal(d.querySelector('[data-explore-go]').hidden,true);assert.equal(d.querySelector('[data-explore-go]').hasAttribute('href'),false,'Offline prompts do not retain the previous destination');
}
assert.equal(titles.size,128);assert.ok(labels.size>=8,'Ideas span multiple subjects');assert.equal(JSON.parse(w.sessionStorage.getItem('flyfish-explore-ideas')).length,128);
const last=d.querySelector('[data-explore-heading]').textContent;d.querySelector('[data-explore-next]').click();assert.notEqual(d.querySelector('[data-explore-heading]').textContent,last,'The next round does not repeat the previous final idea');assert.equal(fetches,0);dialog.close();
const dynamic=d.createElement('button');dynamic.dataset.openExplore='';dynamic.dataset.exploreMode='idea';dynamic.hidden=true;d.body.append(dynamic);d.dispatchEvent(new w.Event('flyfish:page'));assert.equal(dynamic.hidden,false);dynamic.click();assert.equal(dialog.open,true,'Entry works after navigation');dialog.close();dom.window.close();
for(const blocked of [false,true]){
 const restored=new JSDOM(home,{runScripts:'outside-only',url:'https://example.com/'}),rw=restored.window,rd=rw.document,modal=rd.querySelector('#site-explore');rw.Math.random=()=>0;modal.showModal=()=>{modal.open=true;};rw.fetch=()=>{throw Error('Ideas must remain offline');};
 if(blocked)Object.defineProperty(rw,'sessionStorage',{get(){throw Error('Storage unavailable');}});else rw.sessionStorage.setItem('flyfish-explore-ideas',partialHistory);
 rw.eval(explore);rd.querySelector('[data-explore-mode="idea"]').click();
 if(!blocked)assert.match(rd.querySelector('[data-explore-heading]').textContent,/天空/,'Refresh resumes without repeating previously drawn ideas');
 else{const seen=new Set();for(let i=0;i<128;i++){const title=rd.querySelector('[data-explore-heading]').textContent;assert.ok(!seen.has(title),'In-memory deduplication works without sessionStorage');seen.add(title);rd.querySelector('[data-explore-next]').click();}}
 restored.window.close();
}
const html=fs.readFileSync('public/404.html','utf8'),script=fs.readFileSync('themes/flyfish/source/js/fish-home.js','utf8');const gameDom=new JSDOM(html,{runScripts:'outside-only',url:'https://example.com/404.html'}),g=gameDom.window,doc=g.document;g.eval(script);
const game=doc.querySelector('[data-fish-home]'),board=doc.querySelector('[data-fish-board]'),status=doc.querySelector('[data-fish-status]');assert.equal(game.hidden,false);assert.equal(board.children.length,25);assert.match(status.textContent,/第 1 行、第 1 列/);
const key=value=>board.dispatchEvent(new g.KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true}));key('ArrowRight');assert.match(status.textContent,/礁石/);for(let i=0;i<4;i++)key('ArrowDown');for(let i=0;i<4;i++)doc.querySelector('[data-fish-move="right"]').click();assert.match(status.textContent,/到家啦.*8 步/);doc.querySelector('[data-fish-reset]').click();assert.match(status.textContent,/重新出发/);assert.ok(doc.querySelector('.not-found a[href="/"]'));
const original=game.outerHTML;game.outerHTML=original.replace('data-ready="true"','');doc.dispatchEvent(new g.Event('flyfish:page'));assert.equal(doc.querySelector('[data-fish-board]').children.length,25);gameDom.window.close();
console.log('PASS: 128 distinct offline ideas, full-round deduplication, round boundary, refresh/storage fallback and navigation entry; 404 game keyboard, obstacles, completion and reset.');
