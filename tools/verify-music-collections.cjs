'use strict';
const fs=require('fs'),assert=require('assert/strict'),yaml=require('js-yaml');
const base='source/music/playlists/',manifest=JSON.parse(fs.readFileSync(base+'manifest.json','utf8'));
const music=yaml.load(fs.readFileSync('_config.flyfish.yml','utf8')).music,all=new Set(),classified=new Set();
assert.equal(manifest.collections.length,5);
for(const collection of manifest.collections){
 const data=JSON.parse(fs.readFileSync(base+collection.slug+'.json','utf8')),config=music.playlists.find(item=>String(item.id)===collection.id);
 assert.ok(config,'Published collection is selectable: '+collection.name);
 assert.equal(data.length,collection.count);assert.equal(new Set(data.map(t=>t.netease_id)).size,data.length);
 assert.equal(collection.order_source,'netease-playlist-trackIds');assert.ok(collection.order_checked_at);
 assert.deepEqual(data.map(t=>t.netease_id),collection.ids,'The snapshot must preserve the verified native order, including the first and last tracks');
 assert.equal(config.backup_playlist_url,collection.backup_playlist_url);
 assert.equal(config.audio_api,'https://music.163.com/song/media/outer/url?id=:id');
 for(const track of data){
  assert.ok([0,8].includes(track.fee),'VIP/paywalled tracks must not be published');
  assert.ok(track.verified_at&&track.duration>31);
  assert.ok(Math.abs(track.verified_audio_seconds-track.duration)<=4,'Published audio must match full track duration');
  assert.equal(track.url,'https://music.163.com/song/media/outer/url?id='+track.netease_id);
  assert.equal(track.source,'https://music.163.com/song?id='+track.netease_id);
  assert.ok(collection.ids.includes(track.netease_id));all.add(track.netease_id);
  if(collection.slug!=='favorites'){assert.ok(!classified.has(track.netease_id),'Main categories must not duplicate songs');classified.add(track.netease_id);}
 }
}
assert.equal(all.size,manifest.approved_unique_songs);assert.equal(classified.size,all.size);
assert.ok(music.playlists.some(item=>String(item.id)==='12908278323'),'The original playlist remains selectable');
const study=JSON.parse(fs.readFileSync(base+'study-structure.json','utf8')),main=JSON.parse(fs.readFileSync(base+'original.json','utf8'));
assert.equal(String(music.id),study.id);assert.equal(String(music.playlists[0].id),study.id);assert.equal(music.playlists[0].name,study.name);
assert.equal(study.name,'FLYFISH_World');assert.equal(main.length,study.count);assert.equal(new Set(main.map(t=>t.netease_id)).size,main.length);
assert.ok([...all].every(id=>main.some(t=>t.netease_id===id)),'The main playlist includes every approved classification recording');
let end=0;for(const scene of study.sections){assert.equal(scene.start,end+1);assert.equal(scene.end-scene.start+1,scene.ids.length);end=scene.end;assert.ok(scene.ids.every(id=>main.find(t=>t.netease_id===id)?.scene===scene.name));}assert.equal(end,main.length);
assert.deepEqual(main.map(t=>t.netease_id),study.sections.flatMap(s=>s.ids),'The stored playlist must keep scene order');
assert.deepEqual(study.removed.map(t=>t.id).sort(),[2036445129,1387098935].sort());
for(const track of main){assert.ok([0,8].includes(track.fee));assert.ok(!study.removed.some(t=>t.id===track.netease_id));assert.ok(Math.abs(track.verified_audio_seconds-track.duration)<=4);}
console.log('PASS: five actual collections, '+all.size+' distinct verified full-length free songs, no VIP/paywalled entries, disjoint main categories, official audio links and dated fallback snapshots.');
console.log('PASS: FLYFISH_World first/default, all '+main.length+' free full recordings in variable-length style scenes, without duplicates or VIP reintroductions.');
