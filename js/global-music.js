(() => {
  'use strict';
  const dock=document.querySelector('[data-global-music]'),audio=dock?.querySelector('[data-music-audio]');
  if(!dock||!audio)return;
  const panel=dock.querySelector('#music-controls'),toggle=dock.querySelector('.music-dock-toggle');
  const key='flyfish-music-session',ownerKey='flyfish-music-owner',owner=String(Date.now())+Math.random();
  const icons={play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none"/></svg>',pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="4"/></svg>'};
  let tracks=[],index=0,pending=null,loading=false,playing=false,phase='idle',message='',loop='list',saved=null,seekAfterMetadata=0,selection=0,lastSaved=0;
  const rendered=new WeakMap();
  const sourceCooldowns=new Map();
  let mediaTrack=null,playIntent=0,bufferTimer=0;
  const previewNote=()=>tracks[index]?.shortAudio?'当前音源约 30 秒，可能是试听片段；可在网易云收听完整版。':'';
  const $=selector=>document.querySelector(selector),$$=selector=>Array.from(document.querySelectorAll(selector));
  const time=value=>{value=Math.max(0,Math.floor(Number(value)||0));return Math.floor(value/60)+':'+String(value%60).padStart(2,'0');};
  const safeURL=value=>{try{const url=new URL(value,location.href);return ['http:','https:'].includes(url.protocol)?url.href:'';}catch{return '';}};
  const trackIdentity=value=>{try{const url=new URL(value,location.href),id=url.searchParams.get('id'),server=url.searchParams.get('server'),netease=server==='netease'||url.hostname==='music.163.com'&&url.pathname==='/song/media/outer/url';return id&&netease?'netease:'+id.replace(/\.mp3$/,''):id?url.origin+url.pathname+'?server='+(server||dock.dataset.server)+'&id='+id:url.href;}catch{return value;}};
  const parseList=value=>{try{const parsed=JSON.parse(value||'[]');return Array.isArray(parsed)?parsed:[];}catch{return [];}};
  const defaults={id:dock.dataset.id,server:dock.dataset.server||'netease',api:dock.dataset.api||'',playlist_url:dock.dataset.playlistUrl||'',fallback_apis:parseList(dock.dataset.fallbackApis),name:'我的收藏'};
  const playlists=[];
  for(const entry of parseList(dock.dataset.playlists)){
    if(!entry||!['string','number'].includes(typeof entry.id))continue;
    const id=String(entry.id).trim(),server=String(entry.server||defaults.server),identity=server+':'+id;
    if(!id||playlists.some(item=>item.key===identity))continue;
    playlists.push({...defaults,...entry,id,server,key:identity,name:String(entry.name||'我的收藏'),description:String(entry.description||''),source_url:entry.source_url?safeURL(entry.source_url):''});
  }
  if(!playlists.length)playlists.push({...defaults,key:defaults.server+':'+defaults.id,description:'',source_url:''});
  let active=playlists.find(item=>item.id===defaults.id&&item.server===defaults.server)||playlists[0],requested=null;
  const pickers=new WeakSet();
  try{saved=JSON.parse(sessionStorage.getItem(key)||'null');if(saved){const previous=playlists.find(item=>item.id===saved.playlist&&item.server===(saved.server||defaults.server));if(previous)active=previous;else saved=null;}}catch{}
  audio.volume=typeof saved?.volume==='number'?Math.max(0,Math.min(1,saved.volume)):.5;
  if(saved?.loop==='single')loop='single';
  function save(){
    const track=tracks[index];if(!track)return;
    try{sessionStorage.setItem(key,JSON.stringify({playlist:active.id,server:active.server,index,time:seekAfterMetadata||audio.currentTime||0,volume:audio.volume,loop,url:track.url,name:track.name,artist:track.artist}));}catch{}
  }
  function sourceURL(){
    const track=tracks[index];let id='';
    try{id=new URL(track?.url||'',location.href).searchParams.get('id')||'';}catch{}
    if(track?.source)return track.source;
    return active.server==='netease'?(/^\d+$/.test(id)?'https://music.163.com/#/song?id='+id:'https://music.163.com/#/playlist?id='+active.id):active.source_url;
  }
  function statusText(){
    if(message)return message;
    if(previewNote()&&!['error','loading','buffering','stopped'].includes(phase))return previewNote();
    return {idle:'点击播放加载歌单，或前往音乐馆选歌。',resume:'点击播放，继续上次收听。',loading:'正在加载歌单…',ready:'已加载，选择歌曲开始收听。',playing:'',buffering:'正在缓冲…',paused:'已暂停',stopped:'已停止，进度回到开头。',error:'这首歌暂时无法播放，可换一首或在网易云收听。'}[phase]||'';
  }
  function buildPagePlayer(host){
    if(rendered.get(host)===tracks)return;rendered.set(host,tracks);host.replaceChildren();
    const controls=document.createElement('div');controls.className='music-page-player';
    for(const selector of ['.music-seek','.music-time','.music-transport','.music-volume-row'])controls.append(dock.querySelector(selector).cloneNode(true));
    const heading=document.createElement('div');heading.className='music-playlist-heading';heading.textContent='歌单 · '+tracks.length+' 首';
    const list=document.createElement('ol');list.className='music-playlist';list.setAttribute('aria-label','选择歌曲');
    tracks.forEach((track,position)=>{
      const li=document.createElement('li'),button=document.createElement('button'),number=document.createElement('span'),copy=document.createElement('span'),name=document.createElement('strong'),artist=document.createElement('small');
      button.type='button';button.dataset.musicTrack=String(position);button.setAttribute('aria-label','播放 '+track.name+'，'+track.artist);
      number.textContent=String(position+1).padStart(2,'0');number.className='music-track-number';copy.className='music-track-copy';name.textContent=track.name;artist.textContent=track.artist;
      copy.append(name,artist);button.append(number,copy);li.append(button);list.append(li);
    });
    const inline=host.closest('[data-music-page]')?.querySelector('[data-music-page-controls]');
    if(inline)inline.replaceChildren(controls);else host.append(controls);
    if(!host.closest('.player-shell')?.querySelector('[data-music-count]'))host.append(heading);
    host.append(list);
  }
  function mediaSession(){
    if(!navigator.mediaSession)return;
    const track=tracks[index];
    try{
      if(track&&track!==mediaTrack&&'MediaMetadata' in window){navigator.mediaSession.metadata=new MediaMetadata({title:track.name,artist:track.artist,album:active.name,artwork:track.pic?[{src:track.pic}]:[]});mediaTrack=track;}
      navigator.mediaSession.playbackState=playing?'playing':audio.paused?'paused':'none';
      if(Number.isFinite(audio.duration)&&audio.duration>0&&navigator.mediaSession.setPositionState)navigator.mediaSession.setPositionState({duration:audio.duration,position:Math.min(audio.duration,audio.currentTime||0),playbackRate:audio.playbackRate||1});
    }catch{}
  }
  function render(){
    const track=tracks[index],name=track?.name||saved?.name||active.name,artist=track?.artist||saved?.artist||active.description;
    dock.dataset.id=active.id;dock.dataset.server=active.server;
    for(const node of $$('[data-music-playlist-description]')){node.textContent=active.description;node.hidden=!active.description;}
    for(const wrapper of $$('[data-music-playlist-picker]'))wrapper.hidden=playlists.length<2;
    for(const picker of $$('[data-music-playlist-select]')){
      if(!pickers.has(picker)){picker.replaceChildren();for(const item of playlists){const option=document.createElement('option');option.value=item.key;option.textContent=item.name;picker.append(option);}pickers.add(picker);}
      picker.value=(requested||active).key;picker.disabled=loading;
    }
    const platform={netease:'网易云',kugou:'酷狗',tencent:'QQ音乐'}[active.server]||'音乐';
    for(const node of $$('[data-music-platform]'))node.textContent=platform+'歌单';
    const duration=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:0,current=Math.min(duration||Infinity,Math.max(0,audio.currentTime||0));
    dock.hidden=false;
    dock.classList.toggle('is-playing',playing);
    for(const page of $$('[data-music-page]'))page.classList.toggle('is-playing',playing);
    for(const record of $$('.record'))record.classList.toggle('is-playing',playing);
    for(const node of $$('[data-music-title],[data-track-title]'))node.textContent=name;
    for(const node of $$('[data-music-artist],[data-track-artist]'))node.textContent=artist;
    for(const node of $$('[data-music-status],[data-player-status]')){const text=statusText();if(node.textContent!==text)node.textContent=text;node.classList.toggle('is-error',phase==='error');node.hidden=node.hasAttribute('data-music-status')||node.closest('.music-studio')?!message&&!previewNote()&&!['idle','error','loading','buffering','resume'].includes(phase):!text;}
    for(const button of $$('[data-load-music]')){button.hidden=tracks.length>0;button.disabled=loading;button.textContent=loading?'正在加载…':phase==='error'?'重试加载歌单':saved?'加载上次歌单':'加载歌单';}
    for(const button of $$('[data-refresh-music]')){button.hidden=!tracks.length;button.disabled=loading;button.textContent=loading?'正在刷新…':'刷新歌单';}
    for(const button of $$('[data-open-music-controls]'))button.hidden=!tracks.length;
    for(const host of $$('[data-player-host]'))if(tracks.length)buildPagePlayer(host);
    for(const node of $$('[data-music-count]'))node.textContent=tracks.length?tracks.length+' 首':'我的收藏';
    for(const node of $$('[data-music-elapsed]'))node.textContent=time(current);
    for(const node of $$('[data-music-duration]'))node.textContent=time(duration);
    for(const slider of $$('[data-music-seek]')){slider.disabled=!duration;if(document.activeElement!==slider)slider.value=duration?String(current/duration*100):'0';slider.style.setProperty('--range-fill',duration?String(current/duration*100)+'%':'0%');slider.setAttribute('aria-valuetext',time(current)+' / '+time(duration));}
    for(const slider of $$('[data-music-volume]')){if(document.activeElement!==slider)slider.value=String(audio.volume);slider.style.setProperty('--range-fill',String(audio.volume*100)+'%');}
    for(const node of $$('[data-music-play-icon]'))node.innerHTML=audio.paused?icons.play:icons.pause;
    for(const button of $$('[data-music-action="play"]')){button.disabled=loading&&!tracks.length;button.setAttribute('aria-label',audio.paused?'播放歌曲':'暂停播放');}
    for(const button of $$('[data-music-action="prev"],[data-music-action="next"]'))button.disabled=tracks.length<2;
    for(const button of $$('[data-music-action="stop"]'))button.disabled=!tracks.length;
    for(const node of $$('[data-music-loop]'))node.textContent=loop==='single'?'单曲循环':'列表循环';
    for(const button of $$('[data-music-action=loop]')){button.classList.toggle('is-single',loop==='single');button.title=loop==='single'?'单曲循环':'列表循环';button.setAttribute('aria-label',button.title+'，点击切换为'+(loop==='single'?'列表循环':'单曲循环'));}
    for(const button of $$('[data-music-track]')){const active=Number(button.dataset.musicTrack)===index;button.setAttribute('aria-pressed',String(active));button.classList.toggle('is-current',active);}
    for(const link of $$('[data-music-source],[data-open-music]')){const url=sourceURL();link.hidden=!url;if(url)link.href=url;else link.removeAttribute('href');link.textContent=track?.source?'原站收听 ↗':!track||link.hasAttribute('data-compact-music-source')?platform+' ↗':'在'+platform+'听这首 ↗';link.title=track?track.name+' · 在原站收听':active.name;}
    const cover=dock.querySelector('[data-music-cover]');
    if(track?.pic&&cover.getAttribute('src')!==track.pic){cover.hidden=false;cover.src=track.pic;}
    if(!track?.pic){cover.hidden=true;cover.removeAttribute('src');}
    toggle.title=name+' · '+(playing?'正在播放':'已暂停');toggle.setAttribute('aria-label',(panel.hidden?'展开':'收起')+'音乐控制台，'+name);
    mediaSession();
  }
  function select(position,resume=0){
    if(!tracks.length)return;++selection;clearTimeout(bufferTimer);index=(position+tracks.length)%tracks.length;message='';seekAfterMetadata=Math.max(0,Number(resume)||0);
    audio.src=tracks[index].url;phase='ready';playing=false;render();save();
  }
  async function load(refresh=false,target=requested||active){
    if(pending)return pending;if(tracks.length&&target===active&&!refresh)return true;
    requested=target;loading=true;if(!tracks.length)phase='loading';message=tracks.length?(target===active?'正在刷新歌单…':'正在加载「'+target.name+'」…'):'';render();
    pending=(async()=>{
      try{
        let list=[],fromBackup=false;
        const sources=[target.playlist_url,target.api,...(Array.isArray(target.fallback_apis)?target.fallback_apis:[]),target.backup_playlist_url].filter(value=>typeof value==='string'&&value.trim());
        for(const source of [...new Set(sources)]){
          let url=safeURL(source.replaceAll(':server',encodeURIComponent(target.server)).replaceAll(':type','playlist').replaceAll(':id',encodeURIComponent(target.id)));
          if(!url)continue;
          const endpoint=new URL(url),cooldownKey=endpoint.origin+endpoint.pathname;
          if((sourceCooldowns.get(cooldownKey)||0)>Date.now())continue;
          if(refresh){const fresh=new URL(url);fresh.searchParams.set('_t',String(Date.now()));url=fresh.href;}
          const request=new AbortController(),timer=setTimeout(()=>request.abort(),10000);
          try{
            const response=await fetch(url,{signal:request.signal,credentials:'omit',cache:'no-store'});
            if(response.status===429){const value=response.headers?.get('Retry-After')||'',seconds=Number(value),until=value&&Number.isFinite(seconds)?Date.now()+Math.max(1,seconds)*1000:Date.parse(value);sourceCooldowns.set(cooldownKey,Number.isFinite(until)?until:Date.now()+60000);}
            if(!response.ok)throw Error('playlist');
            const data=await response.json();if(!Array.isArray(data))throw Error('playlist');
            const normalized=data.map(track=>track&&({...track,name:track.name||track.title,artist:track.artist||track.author}));
            list=normalized.filter(track=>track&&typeof track.name==='string'&&typeof track.url==='string'&&track.url.trim()&&safeURL(track.url)).slice(0,500).map(track=>{
              let audioURL=safeURL(track.url);
              if(target.server==='netease'&&typeof target.audio_api==='string'&&target.audio_api){const id=new URL(audioURL).searchParams.get('id')||'';if(!/^\d+$/.test(id))return null;audioURL=safeURL(target.audio_api.replaceAll(':id',encodeURIComponent(id)));if(!audioURL)return null;}
              return {name:track.name,artist:String(track.artist||''),url:audioURL,pic:track.pic?safeURL(track.pic):'',source:track.source?safeURL(track.source):'',duration:Number(track.duration)||0};
            }).filter(Boolean);
            if(!list.length)throw Error('empty');
            fromBackup=source===target.backup_playlist_url;
            break;
          }catch{}finally{clearTimeout(timer);}
        }
        if(!list.length)throw Error('playlist');
        const backupNote=fromBackup?'接口暂不可用，已加载'+(target.backup_checked_at||'此前')+'核验的歌单备份。':'';
        if(target!==active){
          save();++playIntent;audio.pause();active=target;saved=null;tracks=list;select(0);message=backupNote||'已切换到「'+active.name+'」，选择歌曲开始收听。';window.FlyfishNavigator?.enable();return true;
        }
        if(tracks.length){
          const current=tracks[index],position=list.findIndex(track=>trackIdentity(track.url)===trackIdentity(current.url));
          tracks=list;
          if(position>=0){index=position;tracks[index].shortAudio=current.shortAudio;message=backupNote||'已重新获取歌单，共 '+tracks.length+' 首。';save();}
          else{++playIntent;audio.pause();select(0);message=backupNote||'歌单已更新，原曲目已移出歌单，请选择歌曲播放。';}
          return true;
        }
        tracks=list;
        const restored=saved?.url?tracks.findIndex(track=>trackIdentity(track.url)===trackIdentity(saved.url)):-1;
        index=restored>=0?restored:!saved?.url&&Number.isInteger(saved?.index)&&saved.index>=0&&saved.index<tracks.length?saved.index:0;
        select(index,saved?.url&&restored<0?0:saved?.time||0);if(backupNote)message=backupNote;window.FlyfishNavigator?.enable();return true;
      }catch{if(tracks.length)message=target===active?'刷新失败，已保留当前歌单和播放状态，请稍后重试。':'「'+target.name+'」加载失败，已保留当前歌单和播放状态。';else{phase='error';message='歌单暂时没有加载成功，请重试；也可打开原歌单。';}return false;}
    })().finally(()=>{loading=false;pending=null;requested=null;render();});return pending;
  }
  function watchBuffer(){
    clearTimeout(bufferTimer);const version=selection;
    bufferTimer=setTimeout(()=>{if(version!==selection||phase!=='buffering')return;audio.pause();playing=false;phase='error';message='音源连接超时，可重试播放、换一首，或在网易云收听。';render();},20000);
  }
  async function play(){
    const intent=++playIntent;
    if(!tracks.length&&!await load())return;
    if(intent!==playIntent)return;
    const version=selection;message='';if(phase==='error')audio.load();phase='buffering';render();watchBuffer();
    try{await audio.play();}catch(error){if(version!==selection||error.name==='AbortError')return;clearTimeout(bufferTimer);playing=false;phase=error.name==='NotAllowedError'?'paused':'error';message=error.name==='NotAllowedError'?'再点击一次播放即可开始收听。':'';render();}
  }
  function stop(){++playIntent;clearTimeout(bufferTimer);audio.pause();try{audio.currentTime=0;}catch{}seekAfterMetadata=0;playing=false;phase='stopped';message='';render();save();}
  function step(direction){if(!tracks.length)return;select(index+direction);play();}
  function openPanel(open){panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));render();document.dispatchEvent(new CustomEvent('flyfish:music-layout'));}
  document.addEventListener('click',event=>{
    const refreshButton=event.target.closest('[data-refresh-music]');if(refreshButton){if(!refreshButton.disabled)load(true);return;}
    const loadButton=event.target.closest('[data-load-music]');if(loadButton){load();return;}
    const track=event.target.closest('[data-music-track]');if(track){select(Number(track.dataset.musicTrack));play();return;}
    const button=event.target.closest('[data-music-action]');if(!button||button.disabled)return;
    switch(button.dataset.musicAction){
      case 'panel':openPanel(panel.hidden);break;
      case 'close':openPanel(false);toggle.focus();break;
      case 'play':if(!audio.paused)audio.pause();else play();break;
      case 'prev':step(-1);break;
      case 'next':step(1);break;
      case 'stop':stop();break;
      case 'loop':loop=loop==='single'?'list':'single';render();save();break;
    }
  });
  document.addEventListener('input',event=>{
    if(event.target.matches('[data-music-seek]')&&Number.isFinite(audio.duration)&&audio.duration>0){audio.currentTime=audio.duration*Number(event.target.value)/100;render();save();}
    if(event.target.matches('[data-music-volume]')){audio.volume=Math.max(0,Math.min(1,Number(event.target.value)));render();save();}
  });
  document.addEventListener('change',event=>{const picker=event.target.closest('[data-music-playlist-select]');if(!picker||loading)return;const target=playlists.find(item=>item.key===picker.value);if(target&&target!==active){++playIntent;load(false,target);}});
  document.addEventListener('pointerdown',event=>{if(!panel.hidden&&!dock.contains(event.target)&&!event.target.closest('[data-music-action]'))openPanel(false);},{passive:true});
  dock.addEventListener('keydown',event=>{if(event.key==='Escape'){openPanel(false);toggle.focus();}});
  audio.addEventListener('loadedmetadata',()=>{const track=tracks[index];if(track){let remote=false;try{const url=new URL(track.url);remote=url.searchParams.get('server')==='netease'||/(^|\.)music\.126\.net$/.test(url.hostname)||/(^|\.)music\.163\.com$/.test(url.hostname);}catch{}track.shortAudio=remote&&audio.duration>=28&&audio.duration<=31&&(!track.duration||track.duration>audio.duration+5);}if(seekAfterMetadata&&Number.isFinite(audio.duration)){audio.currentTime=Math.min(seekAfterMetadata,Math.max(0,audio.duration-.1));seekAfterMetadata=0;}render();});
  audio.addEventListener('play',()=>{phase='buffering';message='';watchBuffer();render();});
  audio.addEventListener('playing',()=>{clearTimeout(bufferTimer);playing=true;phase='playing';message='';try{localStorage.setItem(ownerKey,owner);}catch{}render();save();});
  audio.addEventListener('waiting',()=>{playing=false;phase='buffering';watchBuffer();render();});
  audio.addEventListener('pause',()=>{++playIntent;clearTimeout(bufferTimer);playing=false;if(!['error','stopped'].includes(phase))phase='paused';render();save();});
  audio.addEventListener('error',()=>{clearTimeout(bufferTimer);playing=false;phase='error';message='';render();});
  audio.addEventListener('ended',()=>{clearTimeout(bufferTimer);if(tracks[index]?.shortAudio&&loop==='single'){playing=false;phase='paused';message=previewNote();render();save();return;}if(loop==='single'){audio.currentTime=0;play();}else step(1);});
  audio.addEventListener('timeupdate',()=>{render();if(Date.now()-lastSaved>2000){lastSaved=Date.now();save();}});
  audio.addEventListener('volumechange',()=>{render();save();});
  dock.querySelector('[data-music-cover]')?.addEventListener('error',event=>{event.target.hidden=true;});
  document.addEventListener('flyfish:before-page',()=>openPanel(false));
  document.addEventListener('flyfish:page',render);window.addEventListener('pagehide',save);
  window.addEventListener('storage',event=>{if(event.key===ownerKey&&event.newValue!==owner&&!audio.paused){audio.pause();message='已在另一个标签页播放。';render();}});
  if(navigator.mediaSession){for(const [action,handler] of Object.entries({play,pause:()=>audio.pause(),stop,previoustrack:()=>step(-1),nexttrack:()=>step(1),seekbackward:()=>{audio.currentTime=Math.max(0,audio.currentTime-10);},seekforward:()=>{if(Number.isFinite(audio.duration))audio.currentTime=Math.min(audio.duration,audio.currentTime+10);}}))try{navigator.mediaSession.setActionHandler(action,handler);}catch{}}
  if(saved)phase='resume';render();
})();
