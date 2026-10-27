'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{assessRights}=require('./music-import.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/study-playlist'),base=path.join(root,'source/music/playlists');
fs.mkdirSync(out,{recursive:true});
// Editorial sequence: texture and arrangement matter as well as BPM. No language ordering.
const blocks=[
 {name:'安静入座',description:'轻柔器乐与舒缓配乐，适合阅读、写作和进入状态。',ids:[461074907,468176711,1843577172,2678687238,1866180834,492999917,39227633,1294556048,34892891,2146702266,4964085,3444367012,407007703,2642201902,27514091]},
 {name:'提速专注',description:'旋律鲜明、节拍渐强的纯音乐，适合刷题、编码或整理笔记。',ids:[450811732,1407432606,520460198,32857745,1966523854,448596416,30854944,30854966,410801523,33469659,1897801144,34040716,28921656,28830411,441617611]}
];
async function get(url){const r=await fetch(url,{headers:{Referer:'https://music.163.com/'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('HTTP '+r.status);const d=await r.json();assert.equal(d.code,200);return d;}
async function prepare(){
 const before=JSON.parse(fs.readFileSync(path.join(out,'native-before.json'),'utf8'));
 assert.equal(before.id,12908278323);assert.equal(before.owner,1455201675);assert.equal(before.tracks.length,before.ids.length);
 const pool=JSON.parse(fs.readFileSync(path.join(base,'instrumental.json'),'utf8')),byId=new Map(pool.map(t=>[t.netease_id,t]));
 const studyIds=blocks.flatMap(b=>b.ids);assert.equal(studyIds.length,30);assert.equal(new Set(studyIds).size,30);for(const id of studyIds)assert.ok(byId.has(id),'Missing curated source '+id);
 const removed=before.tracks.filter(t=>[1,4].includes(t.fee)),keep=before.ids.filter(id=>!removed.some(t=>t.id===id)&&!studyIds.includes(id));
 const sections=[...blocks,{name:'课间放松',description:'保留原有非 VIP 收藏，学习后换换心情。',ids:keep}];
 const ids=sections.flatMap(b=>b.ids),songs=new Map(),players=new Map(),checkedAt=new Date().toISOString();
 for(let i=0;i<ids.length;i+=50){const batch=ids.slice(i,i+50);const detail=await get('https://music.163.com/api/v3/song/detail?c='+encodeURIComponent(JSON.stringify(batch.map(id=>({id})))));const player=await get('https://music.163.com/api/song/enhance/player/url?ids='+encodeURIComponent(JSON.stringify(batch))+'&br=128000');for(const s of detail.songs)songs.set(s.id,s);for(const p of player.data)players.set(p.id,p);}
 const tracks=ids.map(id=>{const s=songs.get(id),p=players.get(id);assert.ok(s&&p);const verdict=assessRights(s,p);assert.equal(verdict.status,'eligible',s.name+': '+verdict.reason);return {name:s.name,artist:s.ar.map(a=>a.name).join(' / '),url:'https://music.163.com/song/media/outer/url?id='+id,pic:s.al.picUrl,duration:s.dt/1000,source:'https://music.163.com/song?id='+id,netease_id:id,fee:s.fee,verified_at:checkedAt};});
 let offset=0;for(const section of sections){section.start=offset+1;offset+=section.ids.length;section.end=offset;}
 const description='从安静入座，到提速专注，再到课间放松。\n01–15 安静入座：轻柔器乐，阅读、写作、进入状态。\n16–30 提速专注：旋律与节拍渐强，刷题、编码、整理笔记。\n31–'+ids.length+' 课间放松：保留原有非 VIP 收藏。\n按场景编排，不按语言排序。2026-10-27 核验免费完整音源。';
 const plan={id:12908278323,name:'FLYFISH_World',description,checked_at:checkedAt,before_ids:before.ids,before_name:before.name,removed,added_ids:studyIds.filter(id=>!before.ids.includes(id)),sections,ids,tracks};
 fs.writeFileSync(path.join(out,'plan.json'),JSON.stringify(plan,null,2)+'\n');console.log(JSON.stringify({name:plan.name,count:ids.length,added:plan.added_ids.length,removed:removed.map(t=>t.name),sections:sections.map(s=>({name:s.name,start:s.start,end:s.end}))},null,2));
}
function publishFiles(){
 const plan=JSON.parse(fs.readFileSync(path.join(out,'plan.json'),'utf8')),native=JSON.parse(fs.readFileSync(path.join(out,'native-verified.json'),'utf8'));
 assert.equal(native.id,plan.id);assert.equal(native.name,plan.name);assert.deepEqual(native.ids,plan.ids);
 const audio=new Map(JSON.parse(fs.readFileSync(path.join(out,'audio-verified.json'),'utf8')).map(t=>[t.id,t]));
 const tracks=plan.tracks.map(t=>{const checked=audio.get(t.netease_id);assert.equal(checked?.status,'full','Audio not verified: '+t.name);return {...t,verified_audio_seconds:checked.seconds};});
 fs.writeFileSync(path.join(base,'original.json'),JSON.stringify(tracks,null,2)+'\n');
 const structure={id:String(plan.id),name:plan.name,description:plan.description,checked_at:plan.checked_at,count:tracks.length,added_ids:plan.added_ids,removed:plan.removed.map(t=>({id:t.id,name:t.name})),sections:plan.sections};
 fs.writeFileSync(path.join(base,'study-structure.json'),JSON.stringify(structure,null,2)+'\n');
 const lines=['# FLYFISH_World｜学习与日常编排','','[网易云歌单](https://music.163.com/playlist?id=12908278323)','','共 '+tracks.length+' 首。新增 '+plan.added_ids.length+' 首学习纯音乐，移除 '+plan.removed.length+' 首 VIP，保留其余原收藏。','','已移除：'+plan.removed.map(t=>t.name).join('、')+'。',''];
 for(const section of plan.sections){lines.push('## '+section.start+'–'+section.end+' · '+section.name,'',section.description,'');for(const id of section.ids){const t=tracks.find(t=>t.netease_id===id);lines.push((plan.ids.indexOf(id)+1)+'. ['+t.name+']('+t.source+') — '+t.artist);}lines.push('');}
 lines.push('编排是按曲目质感、器乐编制和节奏变化做出的场景选择；不只按 BPM 或语言机械排序。试听偏好因人而异。全部曲目已重新核验未登录标准音质权限及实际完整音频时长。','');
 fs.writeFileSync(path.join(out,'FLYFISH_World编排说明.md'),lines.join('\n'));console.log('Written '+tracks.length+' ordered tracks and scene structure.');
}
if(process.argv.includes('--write'))publishFiles();else prepare().catch(error=>{console.error(error);process.exitCode=1;});
