'use strict';
// Read-only cross-platform matching and anonymous NetEase rights audit. No account cookies.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const workspace=path.resolve(__dirname,'..'),out=path.join(workspace,'output/music-import');
fs.mkdirSync(path.join(out,'search'),{recursive:true});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const norm=value=>String(value||'').normalize('NFKC').toLowerCase().normalize('NFD').replace(/\p{M}/gu,'').replace(/[^\p{L}\p{N}]/gu,'');
const base=value=>norm(String(value||'').replace(/[（(][^）)]*[）)]/g,'').replace(/\b(?:feat(?:uring)?\.?|ft\.).*$/i,''));
const artistNames=value=>[value,String(value||'').replace(/[（(][^）)]*[）)]/g,''),...String(value||'').split(/[\/／]/),...Array.from(String(value||'').matchAll(/[（(]([^）)]+)[）)]/g),m=>m[1])].map(norm).filter(Boolean);
const titleVariants=song=>[song.name,...(song.alias||[]),...(song.transNames||[]),...(song.tns||[])].filter(Boolean);
const versions=value=>{
 const s=String(value||'').toLowerCase();
 return ['live','remix','dj','sped','slowed','cover','instrumental'].filter(k=>({live:/\blive\b|现场|演唱会/,remix:/\bremix\b|混音/,dj:/\bdj\b|dj版/,sped:/sped\s*up|speed\s*up|加速/,slowed:/slowed|降速|慢速/,cover:/\bcover\b|翻唱/,instrumental:/instrumental|伴奏/})[k].test(s)).join('|');
};
let nextRequest=0;
async function request(url){
 const delay=Math.max(0,nextRequest-Date.now());nextRequest=Math.max(nextRequest,Date.now())+330;await sleep(delay);
 const response=await fetch(url,{headers:{Referer:'https://music.163.com/'},signal:AbortSignal.timeout(18000)});
 if(!response.ok)throw Error('HTTP '+response.status);
 const data=await response.json();if(data.code!==200)throw Error('NetEase code '+data.code);return data;
}
async function search(query){
 const file=path.join(out,'search',crypto.createHash('sha256').update(query).digest('hex')+'.json');
 if(fs.existsSync(file))return JSON.parse(fs.readFileSync(file,'utf8')).data;
 const url='https://music.163.com/api/search/get?type=1&limit=10&s='+encodeURIComponent(query);
 let data;for(let attempt=0;attempt<3;attempt++){try{data=await request(url);break;}catch(error){if(attempt===2)throw error;await sleep((attempt+1)*2000);}}
 fs.writeFileSync(file,JSON.stringify({query,checked_at:new Date().toISOString(),data}));return data;
}
async function enrichAliases(track,songs){
 for(const song of songs){
  if(rank(track,song).score>=85)continue;
  const title=titleVariants(song).some(name=>norm(name)===norm(track.title)||base(name)&&base(name)===base(track.title));
  if(!title||Math.abs(song.duration/1000-track.duration)>4||versions(track.title)!==versions(song.name))continue;
  for(const artist of song.artists||[]){
   const file=path.join(out,'search','artist-'+artist.id+'.json');
   try{let detail;if(fs.existsSync(file))detail=JSON.parse(fs.readFileSync(file,'utf8'));else{const result=await request('https://music.163.com/api/artist/'+artist.id);detail={checked_at:new Date().toISOString(),artist:result.artist};fs.writeFileSync(file,JSON.stringify(detail));}
    if(detail.artist)artist.alias=[...new Set([...(artist.alias||[]),...(detail.artist.alias||[]),...(detail.artist.transNames||[])])];
   }catch{}
  }
 }
 return songs;
}
function rank(track,song){
 const sourceVersions=versions(track.title),targetVersions=versions(song.name);
 if(sourceVersions!==targetVersions)return {score:0,reason:'版本标签不同'};
 const variants=titleVariants(song);
 let title=0;
 for(const name of variants){if(norm(name)===norm(track.title))title=Math.max(title,1);else if(base(name)&&base(name)===base(track.title))title=Math.max(title,.96);}
 if(!title)return {score:0,reason:'标题不一致'};
 const artists=(song.artists||song.ar||[]).flatMap(a=>[a.name,...(a.alias||[]),...(a.transNames||[])]).filter(Boolean).flatMap(artistNames);
 const sourceArtists=track.artists.filter(a=>norm(a));
 const matched=sourceArtists.filter(a=>artistNames(a).some(b=>artists.includes(b))).length;
 if(!sourceArtists.length||matched!==sourceArtists.length)return {score:0,reason:'歌手或合作演唱者不一致'};
 const duration=(song.duration||song.dt||0)/1000,diff=Math.abs(duration-track.duration);
 if(!duration||diff>Math.max(8,track.duration*.04))return {score:0,reason:'时长不一致'};
 return {score:Math.round(title*65+matched/sourceArtists.length*25+Math.max(0,10-diff)),reason:'标题、歌手、版本与时长匹配'};
}
function prepare(){
 const records=new Map();
 for(const n of [1,2]){
  const data=JSON.parse(fs.readFileSync(path.join(workspace,`output/kugou-playlist-${n}.json`),'utf8'));
  if(data.total!==data.captured)throw Error('Incomplete source playlist '+n);
  for(const raw of data.tracks){
   const title=raw.name.includes(' - ')?raw.name.slice(raw.name.indexOf(' - ')+3):raw.title;
   const artists=raw.artists.some(a=>norm(a))?raw.artists.filter(a=>norm(a)):raw.name.split(' - ')[0].split('、');
   const identity=norm(title)+'|'+artists.map(norm).sort().join('|');
   if(records.has(identity)){records.get(identity).source_playlists.push(n);continue;}
   records.set(identity,{...raw,title,artists,source_playlists:[n]});
  }
 }
 return [...records.values()];
}
async function matchAll(){
 const tracks=prepare(),file=path.join(out,'matches.json');
 const old=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[];
 const oldByHash=new Map((process.argv.includes('--rescore')?[]:old.filter(row=>row.status!=='search_error')).map(row=>[row.hash,row]));
 const results=new Array(tracks.length);let cursor=0,done=0;
 async function worker(){while(cursor<tracks.length){const i=cursor++,track=tracks[i];
  if(oldByHash.has(track.hash)){results[i]={...oldByHash.get(track.hash),source_playlists:track.source_playlists};done++;continue;}
  try{
   const query=track.title+' '+track.artists.slice(0,2).join(' ');
   let data=await search(query);await enrichAliases(track,data.result?.songs||[]);let candidates=(data.result?.songs||[]).map(song=>({song,...rank(track,song)})).sort((a,b)=>b.score-a.score);
   if(!candidates.length||candidates[0].score<85){
    const alt=track.title.replace(/[（(][^）)]*[）)]/g,'').trim();
    data=await search(alt);await enrichAliases(track,data.result?.songs||[]);const all=new Map([...candidates,...(data.result?.songs||[]).map(song=>({song,...rank(track,song)}))].map(c=>[c.song.id,c]));candidates=[...all.values()].sort((a,b)=>b.score-a.score);
   }
   const top=candidates[0];results[i]={...track,status:top?.score>=85?'matched':'unmatched',match:top?.score>=85?top.song:null,score:top?.score||0,candidates:candidates.slice(0,4).map(c=>({id:c.song.id,name:c.song.name,artists:(c.song.artists||[]).map(a=>a.name),fee:c.song.fee,duration:c.song.duration,score:c.score,reason:c.reason}))};
  }catch(error){results[i]={...track,status:'search_error',error:error.message};}
  done++;if(done%20===0||done===tracks.length){fs.writeFileSync(file,JSON.stringify(results.filter(Boolean),null,2));console.log(`Matching ${done}/${tracks.length}; matched=${results.filter(r=>r?.status==='matched').length}`);}
 }}
 await Promise.all([worker(),worker()]);fs.writeFileSync(file,JSON.stringify(results,null,2));
 console.log(JSON.stringify({sourceRows:693,unique:tracks.length,matched:results.filter(r=>r.status==='matched').length,unmatched:results.filter(r=>r.status==='unmatched').length,errors:results.filter(r=>r.status==='search_error').length}));
 return results;
}
async function rights(rows){
 const ids=[...new Set(rows.filter(r=>r.match).map(r=>r.match.id))],checks=new Map();
 for(let i=0;i<ids.length;i+=50){
  const batch=ids.slice(i,i+50),file=path.join(out,'rights-'+crypto.createHash('sha256').update(batch.join(',')).digest('hex')+'.json');
  let result;if(fs.existsSync(file))result=JSON.parse(fs.readFileSync(file,'utf8'));else{
   const detail=await request('https://music.163.com/api/v3/song/detail?c='+encodeURIComponent(JSON.stringify(batch.map(id=>({id})))));
   const player=await request('https://music.163.com/api/song/enhance/player/url?ids='+encodeURIComponent(JSON.stringify(batch))+'&br=128000');
   result={checked_at:new Date().toISOString(),detail,player};fs.writeFileSync(file,JSON.stringify(result,null,2));
  }
  const players=new Map(result.player.data.map(song=>[song.id,song]));
  for(const song of result.detail.songs){const p=players.get(song.id),{status,reason}=assessRights(song,p);
   checks.set(song.id,{id:song.id,name:song.name,artists:song.ar.map(a=>a.name),album:song.al.name,pic:song.al.picUrl,duration:song.dt/1000,fee:song.fee,player_fee:p?.fee,player_seconds:(p?.time||0)/1000,trial:p?.freeTrialInfo||null,status,reason,checked_at:result.checked_at});
  }
  console.log(`Rights ${Math.min(i+50,ids.length)}/${ids.length}`);
 }
 const audited=rows.map(row=>({...row,rights:row.match?checks.get(row.match.id)||{status:'unverified',reason:'歌曲详情缺失'}:null}));
 fs.writeFileSync(path.join(out,'audited.json'),JSON.stringify(audited,null,2));
 console.log(JSON.stringify(audited.reduce((counts,row)=>{const k=row.rights?.status||row.status;counts[k]=(counts[k]||0)+1;return counts;},{})));
}
function assessRights(song,player){
 if(song.fee===1||song.fee===4)return {status:'vip',reason:song.fee===4?'付费专辑/单曲':'需要 VIP'};
 if(player?.freeTrialInfo||(player?.time>0&&player.time<=31000&&song.dt>35000))return {status:'preview',reason:'仅返回试听片段'};
 if(!player?.url||player.code!==200)return {status:'unavailable',reason:'未登录无法获取播放地址'};
 if([0,8].includes(song.fee)&&!player.freeTrialInfo&&player.time>=song.dt-3500&&player.time>31000)return {status:'eligible',reason:'未登录标准音质可完整播放'};
 return {status:'unverified',reason:'暂未确认可免费完整播放'};
}
module.exports={norm,rank,versions,assessRights};
if(require.main===module)(async()=>{const rows=await matchAll();await rights(rows);})().catch(error=>{console.error(error);process.exitCode=1;});
