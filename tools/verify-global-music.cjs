'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom'),ejs=require('ejs');
const source=fs.readFileSync('themes/flyfish/source/js/global-music.js','utf8');
const partial=fs.readFileSync('themes/flyfish/layout/_partials/global-music.ejs','utf8');
const page='<main data-page-content><section data-music-page><div class="record"></div><h2 data-track-title></h2><p data-track-artist></p><button data-load-music>加载</button><p data-player-status></p><div data-player-host></div></section></main>';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function setup(options={}){
 const dom=new JSDOM((options.studio?ejs.render(fs.readFileSync('themes/flyfish/layout/_partials/music.ejs','utf8'),{theme:{music:{id:'123',server:'netease',api:'https://music.test/:server/:type/:id'}},partial:()=>''}):page)+ejs.render(partial,{theme:{music:{id:'123',server:'netease',api:'https://music.test/:server/:type/:id'}}}),{url:'http://localhost/music/',runScripts:'outside-only'});
 const w=dom.window,doc=w.document,audio=doc.querySelector('audio');let paused=true,position=0,fetches=0,plays=0,enabled=0;
 Object.defineProperties(audio,{paused:{get:()=>paused},duration:{get:()=>120},currentTime:{get:()=>position,set:value=>position=value}});
 audio.play=async()=>{plays++;if(options.reject)throw Object.assign(Error('blocked'),{name:options.reject});paused=false;audio.dispatchEvent(new w.Event('play'));audio.dispatchEvent(new w.Event('playing'));};
 audio.pause=()=>{if(paused)return;paused=true;audio.dispatchEvent(new w.Event('pause'));};audio.load=()=>{};
 w.fetch=async()=>{fetches++;return {ok:!options.fail,json:async()=>options.malformed?{}:[{name:'<b>One</b>',artist:'Artist',url:'https://music.test/?id=1',pic:'https://music.test/cover.png'},{name:'Two',url:'https://music.test/?id=2'},{name:'Three',url:'https://music.test/?id=3'},{name:'unsafe',url:'javascript:alert(1)'}]};};
 w.FlyfishNavigator={enable:()=>enabled++};
 if(options.saved)w.sessionStorage.setItem('flyfish-music-session',JSON.stringify({playlist:'123',index:1,time:35,volume:.3,loop:'single',name:'Two'}));
 if(options.blocked)Object.defineProperty(w,'sessionStorage',{get(){throw Error('blocked');}});
 const actions={};Object.defineProperty(w.navigator,'mediaSession',{value:{setActionHandler:(name,fn)=>actions[name]=fn,setPositionState(){}}});
 w.eval(source);
 const click=selector=>doc.querySelector(selector).click();
 const event=name=>audio.dispatchEvent(new w.Event(name));
 const input=(selector,value)=>{const el=doc.querySelector(selector);el.value=value;el.dispatchEvent(new w.Event('input',{bubbles:true}));};
 return {dom,w,doc,audio,click,event,input,actions,get fetches(){return fetches;},get plays(){return plays;},get enabled(){return enabled;},get paused(){return paused;},position(value){position=value;event('timeupdate');}};
}
(async()=>{
 const s=setup();assert.equal(s.fetches,0);assert.equal(s.plays,0);assert.ok(s.doc.querySelector('[data-global-music]').hidden);
 s.click('[data-load-music]');s.click('[data-load-music]');await flush();assert.equal(s.fetches,1);assert.equal(s.enabled,1);assert.equal(s.doc.querySelectorAll('[data-music-track]').length,3);assert.equal(s.doc.querySelector('[data-music-track] strong').textContent,'<b>One</b>');assert.equal(s.doc.querySelector('[data-music-track] b'),null);assert.equal(s.plays,0);assert.equal(s.doc.querySelector('[data-music-source]'),null);
 s.click('[data-music-track="0"]');await flush();assert.equal(s.paused,false);assert.ok(s.doc.querySelector('[data-global-music]').classList.contains('is-playing'));
 assert.ok(s.doc.querySelector('[data-music-status]').hidden,'Normal playback has no status line');s.position(31);const audio=s.audio;s.doc.dispatchEvent(new s.w.Event('flyfish:before-page'));s.doc.querySelector('[data-page-content]').innerHTML='<h1>Another page</h1>';s.doc.dispatchEvent(new s.w.Event('flyfish:page'));assert.equal(s.doc.querySelector('audio'),audio);assert.equal(audio.currentTime,31);assert.equal(s.paused,false);assert.equal(s.fetches,1);
 s.click('[data-music-action="panel"]');assert.equal(s.doc.querySelector('#music-controls').hidden,false);
 s.click('[data-music-action="next"]');await flush();assert.match(audio.src,/id=2$/);assert.equal(s.plays,2,'One click advances once after page initialization');
 s.click('[data-music-action="prev"]');await flush();assert.match(audio.src,/id=1$/);
 s.input('[data-music-seek]','50');assert.equal(audio.currentTime,60);s.input('[data-music-volume]','.25');assert.equal(audio.volume,.25);
 s.click('[data-music-action="play"]');assert.equal(s.paused,true);assert.equal(s.doc.querySelector('[data-global-music]').classList.contains('is-playing'),false);
 s.click('[data-music-action="play"]');await flush();s.event('waiting');assert.equal(s.doc.querySelector('[data-global-music]').classList.contains('is-playing'),false);s.event('playing');
 s.click('[data-music-action="stop"]');assert.equal(s.paused,true);assert.equal(audio.currentTime,0);assert.match(s.doc.querySelector('[data-music-status]').textContent,/停止/);
 s.event('ended');await flush();assert.match(audio.src,/id=2$/);s.click('[data-music-action="loop"]');s.event('ended');await flush();assert.match(audio.src,/id=2$/);
 s.event('error');assert.equal(s.doc.querySelector('[data-music-status]').hidden,false,'Playback errors remain visible');assert.match(s.doc.querySelector('[data-music-status]').textContent,/无法播放/);assert.equal(s.doc.querySelector('[data-global-music]').classList.contains('is-playing'),false);
 await s.actions.play();s.w.dispatchEvent(new s.w.StorageEvent('storage',{key:'flyfish-music-owner',newValue:'another-tab'}));assert.equal(s.paused,true);assert.match(s.doc.querySelector('[data-music-status]').textContent,/另一个标签/);
 s.dom.window.close();
 const studio=setup({studio:true});studio.click('[data-load-music]');await flush();for(let i=0;i<3;i++)studio.doc.dispatchEvent(new studio.w.Event('flyfish:page'));assert.equal(studio.doc.querySelectorAll('[data-music-page-controls] [data-music-action=play]').length,1);assert.equal(studio.doc.querySelectorAll('[data-player-host] [data-music-action=play]').length,0);assert.equal(studio.doc.querySelector('[data-music-count]').textContent,'3 首');studio.click('.now-playing [data-music-action=next]');await flush();assert.equal(studio.plays,1);assert.match(studio.audio.src,/id=2$/);studio.dom.window.close();
 const restored=setup({saved:true});assert.equal(restored.plays,0);assert.equal(restored.fetches,0);assert.equal(restored.doc.querySelector('[data-global-music]').hidden,false);restored.click('[data-music-action="play"]');await flush();restored.event('loadedmetadata');assert.equal(restored.audio.currentTime,35);assert.equal(restored.audio.volume,.3);assert.match(restored.audio.src,/id=2$/);restored.dom.window.close();
 for(const options of [{fail:true},{malformed:true}]){const bad=setup(options);bad.click('[data-load-music]');await flush();assert.match(bad.doc.querySelector('[data-player-status]').textContent,/没有加载成功/);assert.equal(bad.plays,0);bad.dom.window.close();}
 const rejected=setup({reject:'NotAllowedError'});rejected.click('[data-load-music]');await flush();rejected.click('[data-music-track="0"]');await flush();assert.match(rejected.doc.querySelector('[data-music-status]').textContent,/再点击一次/);rejected.dom.window.close();
 const blocked=setup({blocked:true});blocked.click('[data-load-music]');await flush();blocked.click('[data-music-track="0"]');await flush();assert.equal(blocked.paused,false);blocked.dom.window.close();
 console.log('PASS: lazy playlist/cache, safe metadata, shared native audio across content replacement, one-step controls, seek/volume/loops/stop, media state/errors, manual session resume, media keys, cross-tab ownership and unavailable storage.');
})().catch(error=>{console.error(error);process.exitCode=1;});
