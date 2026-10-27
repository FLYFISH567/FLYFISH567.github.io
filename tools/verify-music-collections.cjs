'use strict';
const fs=require('fs'),assert=require('assert/strict'),yaml=require('js-yaml');
const base='source/music/playlists/',manifest=JSON.parse(fs.readFileSync(base+'manifest.json','utf8'));
const music=yaml.load(fs.readFileSync('_config.flyfish.yml','utf8')).music,all=new Set(),classified=new Set();
assert.equal(manifest.collections.length,5);
for(const collection of manifest.collections){
 const data=JSON.parse(fs.readFileSync(base+collection.slug+'.json','utf8')),config=music.playlists.find(item=>String(item.id)===collection.id);
 assert.ok(config,'Published collection is selectable: '+collection.name);
 assert.equal(data.length,collection.count);assert.equal(new Set(data.map(t=>t.netease_id)).size,data.length);
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
console.log('PASS: five actual collections, '+all.size+' distinct verified full-length free songs, no VIP/paywalled entries, disjoint main categories, official audio links and dated fallback snapshots.');
