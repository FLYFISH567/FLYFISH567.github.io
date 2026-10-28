'use strict';
const assert=require('assert/strict'),{execFileSync}=require('child_process');
const api=require('../themes/flyfish/source/js/briefing-sources.js');
const base='https://flyfish567.github.io',expected=process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function get(route){const response=await fetch(base+route+'?check='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(15000)});assert.ok(response.ok,route+' HTTP '+response.status);return response;}
async function main(){
  let release;
  for(let i=0;i<10;i++){try{release=await (await get('/release.json')).json();if(release.source_commit===expected)break;}catch{}await delay(10000);}
  assert.equal(release?.source_commit,expected,'CDN must serve this source release');
  const snapshot=api.cleanSnapshot(await (await get('/briefing/feed.json')).json());
  assert.ok(snapshot.checkedAt&&Date.now()-Date.parse(snapshot.checkedAt)<10800000,'News background update is less than three hours old');
  assert.ok(Object.keys(snapshot.sources).length>=Math.ceil(api.SOURCES.length*.35),'Enough dated sources remain available');
  assert.ok(Object.values(snapshot.health).filter(h=>h.status==='ok').length>=Math.ceil(api.SOURCES.length*.35),'Enough sources succeeded in the last collection');
  for(const route of ['/','/briefing/','/articles/','/music/','/Warning/']){const html=await (await get(route)).text();assert.ok(html.includes('main-nav'),route+' contains the site layout');}
  console.log('PASS: published release '+expected.slice(0,12)+', news '+snapshot.checkedAt+', '+Object.keys(snapshot.sources).length+' dated sources, five public pages.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
