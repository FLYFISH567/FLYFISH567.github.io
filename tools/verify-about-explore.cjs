'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),cheerio=require('cheerio'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),output=path.join(root,'public');
const load=route=>cheerio.load(fs.readFileSync(path.join(output,route),'utf8'));
const catalog=JSON.parse(fs.readFileSync(path.join(output,'explore-index.json'),'utf8'));
const about=load('about/index.html');
assert.equal(about('.now-card').length,3);assert.equal(about('.about-now time').attr('datetime'),'2026-10-23');
assert.equal(about('.about-footprints').parent().attr('id'),'main','Footprints use the full about column');
const independent=require('js-yaml').load(fs.readFileSync(path.join(root,'source/_data/footprints.yml'),'utf8')).places||[];
assert.deepEqual(about('[data-travel-group=visited] .travel-stop h3').map((_,el)=>about(el).text()).get(),['南昌','贵阳',...independent.map(place=>place.name)],'Dated album visits come first, then undated independent visits in source order');
assert.deepEqual(about('.travel-stop[href]').map((_,el)=>about(el).attr('href')).get(),['/wordScenery/#photo-group-0','/wordScenery/#photo-group-1',...independent.filter(place=>place.url).map(place=>place.url)]);
assert.equal(about('.now-card a,.now-card[href]').length,0,'Recent state cards are display-only');
assert.equal(about('.travel-pin[data-status=visited]').length,2+independent.length);assert.equal(about('.about-footprints img').length,0,'Travel map replaces album cover cards');
assert.equal(about('.travel-region').length,35,'All 34 province-level regions and South China Sea markings stay in the base map');
assert.equal(catalog.items.filter(item=>item.kind==='article').length,45);assert.equal(catalog.items.filter(item=>item.kind==='photo').length,53);
assert.equal(new Set(catalog.items.map(item=>item.id)).size,catalog.items.length,'Catalog entries are unique');
for(const name of ['xss漏洞基础','SQL注入之一句话木马'])assert.ok(!catalog.items.some(item=>item.kind==='article'&&item.title===name));
for(const name of ['FUZZ!','一句话木马大全','SQL盲注脚本'])assert.ok(catalog.items.some(item=>item.kind==='article'&&item.title===name),'Short and code-only notes stay eligible');
assert.ok(catalog.items.find(item=>item.title==='NSSround#28Team_Web_WP').url.includes('%23'));
assert.ok(!catalog.items.some(item=>item.image==='https://bu.dusays.com/2023/04/09/643293997b92b.jpeg'));
for(const item of catalog.items){
  const url=new URL(item.url,'http://localhost/'),route=decodeURIComponent(url.pathname)+'index.html';
  assert.ok(fs.existsSync(path.join(output,route)),item.url);
  if(item.kind==='photo'){
    const page=load(route),target=page('[id]').filter((_,el)=>page(el).attr('id')===url.hash.slice(1));
    assert.equal(target.length,1,'Every photo links to its own unique thumbnail');assert.equal(target.find('img').attr('src'),item.image);
  }
}
console.log('PASS: true-data recent status/footprints, exact destination anchors, 45 nonempty articles/53 unique photos, short notes preserved and source URLs encoded.');
const source=fs.readFileSync(path.join(root,'themes/flyfish/source/js/explore.js'),'utf8');
const fixture={items:[
  {id:'a',kind:'article',title:'<b>原样标题</b>',url:'/article/a/',summary:'一篇笔记',date:'2026.01.01'},
  {id:'b',kind:'article',title:'笔记 B',url:'/article/b/',summary:'另一篇笔记'},
  {id:'p',kind:'photo',title:'照片 P',url:'/album/#photo-0-0',image:'https://images.example/p.jpg'},
  {id:'q',kind:'photo',title:'照片 Q',url:'/album/#photo-0-1',image:'https://images.example/q.jpg'},
  {id:'bad',kind:'article',title:'禁止外跳',url:'https://example.org/'},
  {id:'bad2',kind:'photo',title:'禁止脚本图片',url:'/album/',image:'javascript:alert(1)'}
]};
function setup(options={}){
  const dom=new JSDOM(fs.readFileSync(path.join(output,'about/index.html'),'utf8'),{runScripts:'outside-only',url:options.url||'http://localhost/about/'});
  const w=dom.window,doc=w.document,dialog=doc.querySelector('#site-explore');
  const images=[],timers=new Map();let serial=0,fetches=0,failed=!!options.failed,deferredResolve;
  dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;dialog.dispatchEvent(new w.Event('close'));};
  w.setTimeout=(fn,delay)=>{timers.set(++serial,{fn,delay});return serial;};w.clearTimeout=id=>timers.delete(id);
  w.Image=class{constructor(){images.push(this);}set src(value){this.url=value;}};
  w.fetch=()=>{fetches++;return options.deferred?new Promise(resolve=>{deferredResolve=resolve;}):failed?Promise.reject(Error('offline')):Promise.resolve({ok:true,json:()=>options.fixture||fixture});};
  if(options.blocked)Object.defineProperty(w,'sessionStorage',{get(){throw Error('blocked');}});
  if(options.otherDialog)doc.querySelector('#site-search').setAttribute('open','');
  w.eval(source);
  const click=selector=>doc.querySelector(selector).click();
  const flush=async()=>{for(let i=0;i<16;i++)await Promise.resolve();};
  return {dom,w,doc,dialog,images,timers,click,flush,get fetches(){return fetches;},resolve(){deferredResolve({ok:true,json:()=>options.fixture||fixture});},setFailure(value){failed=value;}};
}
(async()=>{
  const state=setup(),{doc}=state;assert.equal(state.fetches,0,'No catalog request before opening');
  state.click('[data-open-explore]');await state.flush();assert.ok(state.dialog.open);assert.equal(state.fetches,1);
  state.click('[data-explore-kind="article"]');await state.flush();assert.equal(doc.querySelector('[data-explore-preview]').dataset.kind,'article');
  let last=doc.querySelector('[data-explore-go]').getAttribute('href');
  for(let i=0;i<16;i++){state.click('[data-explore-next]');await state.flush();const next=doc.querySelector('[data-explore-go]').getAttribute('href');assert.notEqual(next,last,'No immediate repeat while another item is eligible');last=next;}
  const history=JSON.parse(state.w.sessionStorage.getItem('flyfish-explore-recent'));assert.equal(history.filter(id=>['a','b'].includes(id)).length,2);assert.ok(history.length<=12);assert.ok(history.every(id=>['a','b','p','q'].includes(id)));
  assert.equal(doc.querySelector('[data-explore-heading] b'),null,'Titles render as literal text');
  assert.equal(state.fetches,1,'Catalog request is cached');
  state.click('[data-explore-kind="photo"]');await state.flush();const old=state.images.at(-1),oldLoad=old.onload;
  state.click('[data-explore-next]');await state.flush();oldLoad();assert.equal(doc.querySelector('[data-explore-photo] img').hidden,true,'Late image completion cannot overwrite selection');
  state.images.at(-1).onload();assert.equal(doc.querySelector('[data-explore-photo] img').hidden,false);
  state.click('[data-explore-next]');await state.flush();const late=state.images.at(-1).onload;
  [...state.timers.values()].find(timer=>timer.delay===10000).fn();late();assert.equal(doc.querySelector('[data-explore-image-error]').hidden,false);assert.equal(doc.querySelector('[data-explore-photo] img').hidden,true,'A timed-out image cannot restore stale content');
  state.dialog.close();assert.equal(doc.body.classList.contains('dialog-open'),false);assert.equal(doc.querySelector('[data-explore-preview]').hidden,true);state.dom.window.close();
  const fast=setup({deferred:true});fast.click('[data-open-explore]');fast.click('[data-explore-kind="photo"]');fast.click('[data-explore-kind="article"]');fast.resolve();await fast.flush();assert.equal(fast.fetches,1);assert.equal(fast.doc.querySelector('[data-explore-preview]').dataset.kind,'article');fast.dom.window.close();
  const closed=setup({deferred:true});closed.click('[data-open-explore]');closed.dialog.close();closed.resolve();await closed.flush();assert.equal(closed.doc.querySelector('[data-explore-preview]').hidden,true);closed.dom.window.close();
  const retry=setup({failed:true});retry.click('[data-open-explore]');await retry.flush();assert.equal(retry.doc.querySelector('[data-explore-next]').disabled,false);assert.match(retry.doc.querySelector('[data-explore-status]').textContent,/再试一次/);retry.setFailure(false);retry.click('[data-explore-next]');await retry.flush();assert.equal(retry.doc.querySelector('[data-explore-preview]').hidden,false);retry.dom.window.close();
  const current=setup({url:'http://localhost/article/a/'});current.click('[data-open-explore]');current.click('[data-explore-kind="article"]');await current.flush();assert.equal(current.doc.querySelector('[data-explore-go]').getAttribute('href'),'/article/b/');current.dom.window.close();
  const empty=setup({fixture:{items:[]}});empty.click('[data-open-explore]');await empty.flush();assert.equal(empty.doc.querySelector('[data-explore-go]').hidden,true);assert.match(empty.doc.querySelector('[data-explore-status]').textContent,/暂时没有/);empty.dom.window.close();
  const modal=setup({otherDialog:true});modal.click('[data-open-explore]');assert.equal(modal.fetches,0);assert.equal(modal.dialog.open,false);modal.dom.window.close();
  const blocked=setup({blocked:true});blocked.click('[data-open-explore]');await blocked.flush();assert.equal(blocked.doc.querySelector('[data-explore-preview]').hidden,false);blocked.dom.window.close();
  console.log('PASS: lazy fetch/cache/retry, category selection, nonrepeat history, current-page exclusion, literal text/URL filtering, async image races/timeouts, storage failure and modal cleanup.');
})().catch(error=>{console.error(error);process.exitCode=1;});
