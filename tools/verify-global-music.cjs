'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom'),ejs=require('ejs');
const source=fs.readFileSync('themes/flyfish/source/js/global-music.js','utf8');
const partial=fs.readFileSync('themes/flyfish/layout/_partials/global-music.ejs','utf8');
const pagePartial=fs.readFileSync('themes/flyfish/layout/_partials/music.ejs','utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const list=(id='123')=>[{name:'<b>First '+id+'</b>',artist:'Composer',url:'https://music.test/?id='+id+'1',duration:120,scene:'Soft'},{name:'Second '+id,url:'https://music.test/?id='+id+'2',duration:120,scene:'Rhythm'}];
function setup(options={}){
 const playlists=options.playlists||['123','456','789'].map(id=>({id,name:'Collection '+id,backup_playlist_url:'/data/'+id+'.json',api:'https://api.test/playlist/:id'}));
 const music={id:'123',server:'netease',api:'https://api.test/playlist/:id',playlists};
 const dom=new JSDOM('<main data-page-content>'+(options.home?'':ejs.render(pagePartial,{theme:{music},partial:()=>''}))+'</main>'+ejs.render(partial,{url_for:value=>value,theme:{music}}),{url:'http://localhost/music/',runScripts:'outside-only'});
 const w=dom.window,doc=w.document,audio=doc.querySelector('audio'),requests=[],timers=new Map();let paused=true,position=0,src='',plays=0,enabled=0;
 if(options.saved)w.sessionStorage.setItem('flyfish-music-session',JSON.stringify(options.saved));
 if(options.blocked)Object.defineProperty(w,'sessionStorage',{get(){throw Error('blocked');}});
 if(options.fakeTimers){w.setTimeout=(fn,delay)=>{timers.set(delay,fn);return delay;};w.clearTimeout=id=>timers.delete(id);}
 Object.defineProperties(audio,{paused:{get:()=>paused},duration:{get:()=>options.duration??120},currentTime:{get:()=>position,set:value=>position=value},src:{get:()=>src,set:value=>{src=new URL(value,w.location.href).href;position=0;paused=true;}}});
 audio.play=async()=>{plays++;if(options.reject)throw Object.assign(Error('blocked'),{name:options.reject});paused=false;audio.dispatchEvent(new w.Event('play'));audio.dispatchEvent(new w.Event('playing'));};
 audio.pause=()=>{if(paused)return;paused=true;audio.dispatchEvent(new w.Event('pause'));};audio.load=()=>{};
 w.fetch=async(url,init)=>{requests.push({url,init});if(options.fetch)return options.fetch(url,init);const id=url.match(/(?:playlist\/|data\/)(\d+)/)?.[1]||'123';return {ok:!options.fail,status:200,json:async()=>options.tracks||list(id)};};
 w.FlyfishNavigator={enable:()=>enabled++};
 const actions={};Object.defineProperty(w.navigator,'mediaSession',{value:{setActionHandler:(name,fn)=>actions[name]=fn,setPositionState(){}}});
 w.eval(source);
 const click=selector=>{const el=doc.querySelector(selector);assert.ok(el,'Missing '+selector);el.click();};
 const event=name=>audio.dispatchEvent(new w.Event(name));
 const input=(selector,value)=>{const el=doc.querySelector(selector);el.value=value;el.dispatchEvent(new w.Event('input',{bubbles:true}));};
 const choose=id=>{const el=doc.querySelector('[data-music-playlist-select]');el.value='netease:'+id;el.dispatchEvent(new w.Event('change',{bubbles:true}));};
 return {dom,w,doc,audio,requests,timers,click,event,input,choose,actions,options,get plays(){return plays;},get paused(){return paused;},get enabled(){return enabled;},position(value){position=value;event('timeupdate');}};
}
(async()=>{
 const s=setup();await flush();assert.equal(s.plays,0,'Opening the library loads metadata without playing audio');assert.equal(s.doc.querySelector('[data-music-count]').textContent,'2 首');assert.equal(s.doc.querySelectorAll('[data-refresh-music],[data-load-music],[data-music-action=stop]').length,0);assert.equal(s.doc.querySelectorAll('.music-scene-heading').length,2);
 assert.equal(s.doc.querySelector('[data-music-track] strong').textContent,'<b>First 123</b>');assert.equal(s.doc.querySelector('[data-music-track] b'),null);
 s.click('[data-music-track="1"]');await flush();s.position(35);assert.equal(s.paused,false);s.choose('456');await flush();assert.equal(s.paused,false,'Switching while playing continues with the new collection');assert.match(s.audio.src,/id=4561$/);assert.equal(s.doc.querySelector('[data-music-count]').textContent,'2 首');for(const p of s.doc.querySelectorAll('[data-music-playlist-select]')){assert.equal(p.value,'netease:456');assert.equal(p.disabled,false);}
 assert.match(s.doc.querySelector('[data-music-playlist-source]').href,/playlist\?id=456$/,'Library source opens the selected collection, not the playing song');assert.match(s.doc.querySelector('[data-music-source]').href,/song\?id=4561$/);
 s.click('[data-music-action=play]');assert.equal(s.paused,true);s.choose('789');await flush();assert.equal(s.paused,true,'Selecting from paused state does not autoplay');s.click('[data-music-action=loop]');assert.equal(s.doc.querySelector('[data-music-single-mark]').hasAttribute('hidden'),false);s.click('[data-music-action=loop]');assert.equal(s.doc.querySelector('[data-music-single-mark]').hasAttribute('hidden'),true);
 s.input('[data-music-volume]','.25');s.click('[data-music-action=mute]');assert.equal(s.audio.muted,true);assert.equal(s.doc.querySelector('[data-music-muted-mark]').hasAttribute('hidden'),false);s.click('[data-music-action=mute]');assert.equal(s.audio.muted,false);assert.equal(s.audio.volume,.25);s.input('[data-music-volume]','0');s.click('[data-music-action=mute]');assert.ok(s.audio.volume>0);
 s.click('[data-music-action=play]');await flush();s.input('[data-music-seek]','50');assert.equal(s.audio.currentTime,60);const sameAudio=s.audio;s.doc.dispatchEvent(new s.w.Event('flyfish:before-page'));s.doc.querySelector('[data-page-content]').innerHTML='<h1>Elsewhere</h1>';s.doc.dispatchEvent(new s.w.Event('flyfish:page'));assert.equal(s.doc.querySelector('audio'),sameAudio);assert.equal(s.audio.currentTime,60);assert.equal(s.paused,false);s.click('[data-music-action=next]');await flush();assert.match(s.audio.src,/id=7892$/);s.click('[data-music-action=loop]');s.event('ended');await flush();assert.match(s.audio.src,/id=7892$/);
 s.event('error');assert.match(s.doc.querySelector('[data-music-status]').textContent,/无法播放/);await s.actions.play();s.w.dispatchEvent(new s.w.StorageEvent('storage',{key:'flyfish-music-owner',newValue:'elsewhere'}));assert.equal(s.paused,true);s.dom.window.close();
 const home=setup({home:true});assert.equal(home.requests.length,0,'Other pages do not load music until the panel opens');home.click('[data-music-action=panel]');await flush();assert.equal(home.doc.querySelector('#music-controls').hidden,false);assert.ok(home.requests.length>0);assert.equal(home.plays,0);home.dom.window.close();
 const failed=setup({fail:true});await flush();assert.equal(failed.doc.querySelector('[data-retry-music]').hidden,false);failed.options.fail=false;failed.click('[data-retry-music]');await flush();assert.equal(failed.doc.querySelector('[data-music-count]').textContent,'2 首');failed.dom.window.close();
 const pending=[];const response=data=>({ok:true,status:200,json:async()=>data});
 const race=setup({fetch:(url,init)=>url.startsWith('http://localhost/data/123')?Promise.resolve(response(list())):new Promise(resolve=>pending.push({url,init,resolve}))});await flush();race.click('[data-music-track="1"]');await flush();race.position(46);race.choose('456');
 for(const node of race.doc.querySelectorAll('[data-music-playlist-loading]'))assert.equal(node.hidden,false,'Switching immediately shows a loading indicator in both views');
 assert.match(race.doc.querySelector('[data-music-playlist-loading-text]').textContent,/Collection 456/);
 assert.equal(race.doc.querySelector('[data-player-host]').getAttribute('aria-busy'),'true');
 race.event('playing');race.event('timeupdate');assert.equal(race.doc.querySelector('[data-music-playlist-loading]').hidden,false,'Audio updates cannot clear playlist loading feedback');
 race.choose('789');assert.match(race.doc.querySelector('[data-music-playlist-loading-text]').textContent,/Collection 789/);
 assert.equal(race.doc.querySelector('[data-music-playlist-select]').disabled,false);const newest=pending.find(p=>p.url.includes('/data/789'));newest.resolve(response(list('789')));await flush();for(const node of race.doc.querySelectorAll('[data-music-playlist-loading]'))assert.equal(node.hidden,true,'Loading feedback clears as soon as the new list is ready');assert.equal(race.doc.querySelector('[data-player-host]').getAttribute('aria-busy'),'false');assert.match(race.audio.src,/id=7891$/);assert.equal(race.paused,false);const old=pending.find(p=>p.url.includes('/data/456'));assert.equal(old.init.signal.aborted,true);old.resolve(response(list('456')));pending.find(p=>p.url.includes('api.test/playlist/123')).resolve(response(list('123')));await flush();assert.match(race.audio.src,/id=7891$/,'Late old responses cannot replace the latest selected playlist');assert.equal(race.doc.querySelector('[data-music-playlist-select]').value,'netease:789');race.dom.window.close();
 const fallback=setup({fetch:async url=>url.includes('api.test')?{ok:false,status:429,headers:{get:()=> '3600'}}:response(list(url.match(/data\/(\d+)/)[1]))});await flush();fallback.choose('456');await flush();fallback.choose('789');await flush();assert.equal(fallback.requests.filter(r=>r.url.includes('api.test')).length,1,'Retry-After cooldown applies across collections');assert.match(fallback.audio.src,/id=7891$/);fallback.dom.window.close();
 const preserveOptions={};const preserve=setup(preserveOptions);await flush();preserve.click('[data-music-track="1"]');await flush();preserve.position(52);const beforeSource=preserve.audio.src,beforePlays=preserve.plays;preserve.choose('123');await flush();assert.equal(preserve.audio.src,beforeSource);assert.equal(preserve.audio.currentTime,52);assert.equal(preserve.plays,beforePlays);preserveOptions.fail=true;preserve.choose('456');await flush();assert.equal(preserve.paused,false);assert.equal(preserve.audio.currentTime,52);assert.equal(preserve.doc.querySelector('[data-music-playlist-select]').value,'netease:123');assert.match(preserve.doc.querySelector('[data-player-status]').textContent,/当前歌曲继续/);assert.equal(preserve.doc.querySelector('[data-music-playlist-loading]').hidden,true,'Failure ends the spinner and exposes the recovery message');preserve.dom.window.close();
 const restore=setup({saved:{playlist:'456',server:'netease',url:'https://music.test/?id=4562',time:35,volume:.3,loop:'single'}});await flush();assert.equal(restore.doc.querySelector('[data-music-playlist-select]').value,'netease:123','A fresh music page starts with the initial collection');assert.equal(restore.plays,0);restore.dom.window.close();
 const resume=setup({home:true,saved:{playlist:'456',server:'netease',url:'https://music.test/?id=4562',time:35,volume:.3,loop:'single',muted:true}});resume.click('[data-music-action=panel]');await flush();resume.event('loadedmetadata');assert.equal(resume.audio.currentTime,35);assert.equal(resume.audio.volume,.3);assert.equal(resume.audio.muted,true);resume.dom.window.close();
 const rejected=setup({reject:'NotAllowedError'});await flush();rejected.click('[data-music-track="0"]');await flush();assert.match(rejected.doc.querySelector('[data-music-status]').textContent,/再点击一次/);rejected.dom.window.close();
 const blocked=setup({blocked:true});await flush();blocked.click('[data-music-track="0"]');await flush();assert.equal(blocked.paused,false);blocked.dom.window.close();
 const timed=setup({fakeTimers:true});await flush();timed.click('[data-music-action=play]');await flush();timed.event('waiting');timed.timers.get(20000)();assert.equal(timed.paused,true);assert.match(timed.doc.querySelector('[data-music-status]').textContent,/连接超时/);timed.dom.window.close();
 const preview=setup({duration:30,tracks:[{name:'Preview',url:'https://music.test/?server=netease&id=1',duration:200}]});await flush();preview.event('loadedmetadata');preview.click('[data-music-action=loop]');const count=preview.plays;preview.event('ended');await flush();assert.equal(preview.plays,count);assert.match(preview.doc.querySelector('[data-music-status]').textContent,/试听/);preview.dom.window.close();
 const manifest=JSON.parse(fs.readFileSync('source/music/playlists/manifest.json','utf8'));
 for(const collection of manifest.collections){
   const snapshot=JSON.parse(fs.readFileSync('source/music/playlists/'+collection.slug+'.json','utf8')),byId=new Map(snapshot.map(track=>[track.netease_id,track]));
   const nativeOrder=collection.ids.map(id=>byId.get(id));let finishLive;
   const ordered=setup({playlists:[{id:'123',name:collection.name,backup_playlist_url:'/ordered.json',api:'https://api.test/ordered'}],fetch:url=>url.startsWith('http://localhost/')?Promise.resolve(response(snapshot)):new Promise(resolve=>finishLive=resolve)});
   await flush();
   assert.equal(ordered.doc.querySelector('[data-track-title]').textContent,nativeOrder[0].name,'The initial snapshot selects the actual native first song: '+collection.name);
   const beforeSource=ordered.audio.src;
   finishLive(response(nativeOrder.map(track=>({title:track.name,author:track.artist,url:track.url}))));await flush();
   assert.equal(ordered.doc.querySelector('[data-music-track="0"]').getAttribute('aria-pressed'),'true','Background live metadata must keep the initial first song at 01: '+collection.name);
   assert.equal(ordered.doc.querySelector('[data-track-title]').textContent,nativeOrder[0].name);assert.equal(ordered.audio.src,beforeSource);assert.equal(ordered.plays,0);
   assert.deepEqual(Array.from(ordered.doc.querySelectorAll('[data-music-track] strong'),node=>node.textContent),nativeOrder.map(track=>track.name));
   ordered.dom.window.close();
 }
 console.log('PASS: verified native order for all five snapshots and background updates, first song remains at 01; automatic metadata loading, latest-choice-wins switching, play/pause continuity, loading feedback, rate limits, progress, recovery, controls, navigation and resume.');
})().catch(error=>{console.error(error);process.exitCode=1;});
