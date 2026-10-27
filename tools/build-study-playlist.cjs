'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{assessRights}=require('./music-import.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/study-playlist-v2'),base=path.join(root,'source/music/playlists');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
fs.mkdirSync(out,{recursive:true});
async function get(url){const response=await fetch(url,{headers:{Referer:'https://music.163.com/'},signal:AbortSignal.timeout(20000)});assert.ok(response.ok,'HTTP '+response.status);const data=await response.json();assert.equal(data.code,200);return data;}
async function prepare(){
 const definition=read(path.join(base,'style-order.json')),previous=read(path.join(base,'study-structure.json')),before=read(path.join(base,'original.json'));
 const pool=new Map(['instrumental','japanese','chinese','world','favorites','original'].flatMap(slug=>read(path.join(base,slug+'.json'))).map(t=>[t.netease_id,t]));
 const sections=definition.sections.map(s=>({...s})),ids=sections.flatMap(s=>s.ids);
 assert.equal(new Set(ids).size,ids.length);assert.deepEqual(new Set(ids),new Set(pool.keys()),'Every approved recording belongs to exactly one scene');
 const songs=new Map(),players=new Map(),checkedAt=new Date().toISOString();
 for(let i=0;i<ids.length;i+=50){const batch=ids.slice(i,i+50);const detail=await get('https://music.163.com/api/v3/song/detail?c='+encodeURIComponent(JSON.stringify(batch.map(id=>({id})))));const player=await get('https://music.163.com/api/song/enhance/player/url?ids='+encodeURIComponent(JSON.stringify(batch))+'&br=128000');for(const s of detail.songs)songs.set(s.id,s);for(const p of player.data)players.set(p.id,p);}
 const audio=new Map([...fs.readdirSync(path.join(root,'output/music-import')).filter(f=>/^official-audio-\d+\.json$/.test(f)).flatMap(f=>read(path.join(root,'output/music-import',f))),...read(path.join(root,'output/study-playlist/audio-verified.json'))].map(t=>[t.id,t]));
 const tracks=ids.map(id=>{
   const song=songs.get(id),player=players.get(id),record=pool.get(id),checked=audio.get(id);assert.ok(song&&player&&record);
   const verdict=assessRights(song,player);assert.equal(verdict.status,'eligible',song.name+': '+verdict.reason);
   assert.equal(checked?.status,'full','Missing actual audio evidence: '+song.name);assert.ok(Math.abs(checked.seconds-song.dt/1000)<=4);
   return {...record,name:song.name,artist:song.ar.map(a=>a.name).join(' / '),fee:song.fee,duration:song.dt/1000,verified_at:checkedAt,verified_audio_seconds:checked.seconds,scene:sections.find(s=>s.ids.includes(id)).name};
 });
 let offset=0;for(const section of sections){section.start=offset+1;offset+=section.ids.length;section.end=offset;}
 const description='FLYFISH_World｜从轻柔留白，到人声、节拍与说唱，再到高能收尾。\n'+sections.map(s=>s.start+'–'+s.end+' '+s.name+'：'+s.description).join('\n')+'\n汇集原收藏与分类歌单的免费完整版本，重复录音只保留一次。按风格与场景编排，不按语言或固定曲数分段。2026-10-27 核验。';
 const plan={id:12908278323,name:definition.name,description,basis:definition.basis,checked_at:checkedAt,before_ids:before.map(t=>t.netease_id),before_name:previous.name,removed:previous.removed,added_ids:ids.filter(id=>!before.some(t=>t.netease_id===id)),sections,ids,tracks};
 fs.writeFileSync(path.join(out,'plan.json'),JSON.stringify(plan,null,2)+'\n');
 console.log(JSON.stringify({count:ids.length,added:plan.added_ids.length,sections:sections.map(s=>({name:s.name,start:s.start,end:s.end})),rights:'all eligible; actual audio evidence matches current duration'},null,2));
}
function publish(){
 const plan=read(path.join(out,'plan.json')),native=read(path.join(out,'native-verified.json'));
 assert.equal(native.name,plan.name);assert.deepEqual(native.ids,plan.ids);assert.equal(native.description,plan.description);
 fs.writeFileSync(path.join(base,'original.json'),JSON.stringify(plan.tracks,null,2)+'\n');
 const structure={id:String(plan.id),name:plan.name,description:plan.description,basis:plan.basis,checked_at:plan.checked_at,count:plan.ids.length,added_ids:plan.added_ids,removed:plan.removed,sections:plan.sections};
 fs.writeFileSync(path.join(base,'study-structure.json'),JSON.stringify(structure,null,2)+'\n');
 const lines=['# FLYFISH_World｜按风格渐进的主歌单','','[网易云歌单](https://music.163.com/playlist?id=12908278323)','','共 '+plan.ids.length+' 首，不设分段数量上限。汇集分类歌单及原收藏，按网易云录音 ID 去重。',plan.basis,'','已排除 VIP、付费或仅试听版本；此前移除的《又三郎》《神様のダンス》未重新加入。',''];
 for(const s of plan.sections){lines.push('## '+s.start+'–'+s.end+' · '+s.name,'',s.description,'');for(const id of s.ids){const t=plan.tracks.find(t=>t.netease_id===id);lines.push((plan.ids.indexOf(id)+1)+'. ['+t.name+']('+t.source+') — '+t.artist);}lines.push('');}
 fs.writeFileSync(path.join(out,'FLYFISH_World编排说明.md'),lines.join('\n'));
 console.log('Published '+plan.ids.length+' verified tracks in '+plan.sections.length+' variable-length scenes.');
}
if(process.argv.includes('--write'))publish();else prepare().catch(error=>{console.error(error);process.exitCode=1;});
