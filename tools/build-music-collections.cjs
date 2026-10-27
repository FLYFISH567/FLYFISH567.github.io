'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/music-import'),destination=path.join(root,'source/music/playlists');
const rows=JSON.parse(fs.readFileSync(path.join(out,'audited.json'),'utf8'));
const audio=new Map(fs.readdirSync(out).filter(f=>/^official-audio-\d+\.json$/.test(f)).flatMap(f=>JSON.parse(fs.readFileSync(path.join(out,f),'utf8'))).map(row=>[row.id,row]));
const created=JSON.parse(fs.readFileSync(path.join(out,'created-playlists.json'),'utf8'));
const eligible=rows.filter(row=>row.rights?.status==='eligible');
for(const row of eligible)assert.ok(audio.has(row.rights.id),'Missing official audio audit: '+row.rights.id);
const approved=[...new Map(eligible.filter(row=>audio.get(row.rights.id).status==='full').map(row=>[row.rights.id,row])).values()];
const passedRows=eligible.filter(row=>audio.get(row.rights.id).status==='full').length;
const definitions=[
 {slug:'instrumental',name:'留白时刻｜纯音乐',description:'钢琴、器乐、游戏配乐与电子纯音乐。',test:row=>row.language==='纯音乐'||row.language==='伴奏'},
 {slug:'japanese',name:'晴空电台｜日语',description:'日语流行、动漫与电子旋律，按原版本整理。',test:row=>row.language==='日语'},
 {slug:'chinese',name:'日常心事｜华语',description:'华语流行与说唱，熟悉的词句，随手循环。',test:row=>['国语','粤语','闽南语'].includes(row.language)},
 {slug:'world',name:'世界漫游｜外语',description:'英语、韩语等不同语种的旋律，一路换换风景。',test:row=>!['纯音乐','伴奏','日语','国语','粤语','闽南语'].includes(row.language)},
 {slug:'favorites',name:'偏爱循环｜精选',description:'第二份收藏里通过核验的曲目。',test:row=>row.source_playlists.includes(2)}
];
const second=JSON.parse(fs.readFileSync(path.join(root,'output/kugou-playlist-2.json'),'utf8')).tracks;
const sourceOrder=new Map(second.map((row,index)=>[row.hash,index]));
fs.mkdirSync(destination,{recursive:true});
const collections=definitions.map(def=>{
 const chosen=approved.filter(def.test);if(def.slug==='favorites')chosen.sort((a,b)=>(sourceOrder.get(a.hash)??999)-(sourceOrder.get(b.hash)??999));
 const native=created.find(row=>row.name===def.name);assert.ok(native?.id,'Missing created playlist: '+def.name);
 const tracks=chosen.map(row=>({name:row.rights.name,artist:row.rights.artists.join(' / '),url:'https://music.163.com/song/media/outer/url?id='+row.rights.id,pic:row.rights.pic,duration:row.rights.duration,source:'https://music.163.com/song?id='+row.rights.id,netease_id:row.rights.id,fee:row.rights.fee,verified_audio_seconds:audio.get(row.rights.id).seconds,verified_at:row.rights.checked_at}));
 const file=path.join(destination,def.slug+'.json');fs.writeFileSync(file,JSON.stringify(tracks,null,2)+'\n');
 return {slug:def.slug,name:def.name,description:def.description,id:String(native.id),count:tracks.length,source_url:'https://music.163.com/playlist?id='+native.id,backup_playlist_url:'/music/playlists/'+def.slug+'.json',ids:tracks.map(track=>track.netease_id)};
});
const manifest={checked_date:'2026-10-27',source_entries:693,unique_source_recordings:rows.length,approved_unique_songs:approved.length,collections};
fs.writeFileSync(path.join(destination,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(out,'collection-plan.json'),JSON.stringify(manifest,null,2)+'\n');
const acceptedIds=new Set(approved.map(row=>row.rights.id));
const categoryFor=id=>collections.filter(c=>c.ids.includes(id)).map(c=>c.name).join('；');
function result(row){
 if(row.rights?.status==='eligible'){const a=audio.get(row.rights.id);return a?.status==='full'?['可加入',row.rights.reason]:['未加入',a?.status==='preview'?'官方外链仅返回约 30 秒试听':'官方外链未确认完整时长'];}
 return ['未加入',row.rights?.reason||(row.status==='unmatched'?'未找到可确认的同歌手同版本录音':'搜索或核验未完成')];
}
const reportRows=rows.map(row=>{const [decision,reason]=result(row);return {title:row.title,artist:row.artists.join(' / '),source:row.source_playlists.join('、'),netease_id:row.rights?.id||'',netease_title:row.rights?.name||'',decision,reason,status:row.rights?.status||row.status,category:row.rights&&acceptedIds.has(row.rights.id)?categoryFor(row.rights.id):'',fee:row.rights?.fee??'',duration:row.rights?.duration||row.duration,audio_seconds:row.rights?audio.get(row.rights.id)?.seconds||row.rights.player_seconds:'',checked_at:row.rights?.checked_at||''};});
const escapeCSV=value=>{const text=String(value??''),safe=/^[=+\-@\t\r]/.test(text)?"'"+text:text;return '"'+safe.replaceAll('"','""')+'"';};
const columns={title:'酷狗歌曲',artist:'歌手',source:'来源歌单序号',netease_id:'网易云ID',netease_title:'网易云标题',decision:'结果',reason:'原因',status:'核验状态',category:'分类',fee:'版权标识',duration:'原曲秒数',audio_seconds:'实际或匿名音源秒数',checked_at:'核验时间'};
fs.writeFileSync(path.join(out,'完整筛选清单.csv'),'\ufeff'+[Object.values(columns).map(escapeCSV).join(','),...reportRows.map(row=>Object.keys(columns).map(key=>escapeCSV(row[key])).join(','))].join('\r\n')+'\r\n');
const line=row=>`- ${row.title} — ${row.artist}${row.netease_id?'（[网易云](https://music.163.com/song?id='+row.netease_id+')）':''}：${row.reason}`;
const vip=reportRows.filter(row=>row.status==='vip'),other=reportRows.filter(row=>row.decision==='未加入'&&row.status!=='vip');
const originalFile=path.join(out,'original-existing-audit.json'),original=fs.existsSync(originalFile)?JSON.parse(fs.readFileSync(originalFile,'utf8')):null;
const studyFile=path.join(destination,'study-structure.json'),study=fs.existsSync(studyFile)?JSON.parse(fs.readFileSync(studyFile,'utf8')):null;
const text=[
 '# 酷狗歌单迁移与筛选结果',
 '',
 '核验日期：2026-10-27。两份酷狗源歌单共 693 条记录，合并后为 '+rows.length+' 条不同曲目记录。',
 '',
 '通过网易云未登录标准音质权限检查、并逐首验证官方公开外链实际完整时长后，可加入 '+approved.length+' 首不同歌曲。精选清单与其他分类重叠，不重复计算歌曲总数。'+(passedRows-approved.length)+' 条源曲目映射到相同的网易云录音，已合并；'+(eligible.length-passedRows)+' 条候选未通过实际音源检查。',
 '',
 '## 分类歌单',
 '',
 '| 歌单 | 数量 | 内容 |',
 '| --- | ---: | --- |',
 ...collections.map(c=>'| ['+c.name+']('+c.source_url+') | '+c.count+' | '+c.description+' |'),
 '',
 '## 筛选依据',
 '',
 '- 只匹配标题、歌手/合作演唱者、版本和时长一致的录音；艺名差异使用网易云官方别名核对。未用免费翻唱、现场或不同混音替换原版。',
 '- 需要 VIP（fee=1）或单曲/数字专辑付费（fee=4）的歌曲，一律未加入，即便某第三方会员服务可播放。',
 '- fee=8 不等于整首必须 VIP；只有未登录标准音质可以完整收听，且官方外链实际时长也通过检查时才加入。',
 '- 未获取完整匿名音源、未找到同版本或时长不能确认的条目单独列出，未误标为 VIP。',
 '- 实际读取了音频元数据，没有下载并重新托管歌曲，也没有把试听文件当作完整版。',
 '- 仅将核验通过的曲目加入新建分类歌单。'+(study?'原主歌单后续另整理为 '+study.name+'，见下方补充说明。':'原有网易云歌单保留。')+'版权和播放权限以核验当天为准。',
 '',
 '## VIP / 付费，未加入（'+vip.length+' 条源记录）',
 '',...vip.map(line),
 '',
 '## 其他未加入条目（'+other.length+' 条源记录）',
 '',...other.map(line),
 '',
 '## 已通过核验的曲目',
 '',...approved.map(row=>'- ['+row.rights.name+'](https://music.163.com/song?id='+row.rights.id+') — '+row.rights.artists.join(' / ')+'；'+categoryFor(row.rights.id)),
 '',
 ...(study?['## 主歌单后续场景编排','','原歌单 ID 保持 12908278323，更名为 '+study.name+'，现为 '+study.count+' 首，作为音乐馆第一项。新增 '+study.added_ids.length+' 首学习纯音乐；保留其余原收藏，移除以下 VIP：','',...study.removed.map(t=>'- ['+t.name+'](https://music.163.com/song?id='+t.id+')'),'','场景顺序：'+study.sections.map(s=>s.start+'–'+s.end+' '+s.name).join('；')+'。','']:original?['## 原有收藏的补充检查','','原有网易云歌单仍为 '+original.count+' 首，未删除或改写。其中以下 '+original.vip.length+' 首当前标记为需要 VIP，未加入本次新分类：','',...original.vip.map(row=>'- ['+row.name+']('+row.source+') — '+row.artist),'']:[]),
 '',
 '## 来源',
 '',
 '- [酷狗歌单 1：飞飞鱼喜欢的音乐（657 首）](https://t1.kugou.com/6KdKzbcG6V2)',
 '- [酷狗歌单 2：like（36 首）](https://t1.kugou.com/6Ke09f7G6V2)',
 '- 网易云公开搜索、歌曲详情、未登录播放权限响应与官方公开外链的实际音频元数据；原始核验缓存保存在本地 output/music-import/。',
 ''
 ].join('\n');
fs.writeFileSync(path.join(out,'歌单整理与未加入清单.md'),text);
console.log(JSON.stringify({approved:approved.length,collections:collections.map(c=>({name:c.name,id:c.id,count:c.count})),vip:vip.length,otherExcluded:other.length},null,2));
