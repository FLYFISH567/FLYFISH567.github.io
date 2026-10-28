'use strict';
// 只读取公开订阅，更新首屏备用快照；日常浏览器会按来源缓存周期自行更新。
const fs=require('fs'),path=require('path'),{JSDOM}=require('jsdom');
const api=require('../themes/flyfish/source/js/briefing-sources.js');
const target=path.resolve(__dirname,'../source/_data/briefing.json');
const dom=new JSDOM(''),Parser=dom.window.DOMParser;
async function main(){
  const snapshot=api.cleanSnapshot(fs.existsSync(target)?JSON.parse(fs.readFileSync(target,'utf8')):{version:1,sources:{}});
  const results=await Promise.allSettled(api.SOURCES.map(async spec=>{
    const dates=spec.id==='daily'?[Date.now(),Date.now()-86400000]:[Date.now()];let error;
    for(const date of dates){try{const response=await fetch(api.urlFor(spec,date),{headers:{Origin:'https://flyfish567.github.io','User-Agent':'FLYFISHING/1.0 (+https://flyfish567.github.io/)'},signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('HTTP '+response.status);const text=await response.text();if(text.length>4000000)throw Error('Feed too large');snapshot.sources[spec.id]=api.parse(spec,text,Parser);console.log(spec.name+': '+snapshot.sources[spec.id].items.length+' 条');return;}catch(e){error=e;}}
    throw Error(spec.name+': '+error.message);
  }));
  for(const result of results)if(result.status==='rejected')console.error(result.reason.message+'（保留旧快照）');
  fs.writeFileSync(target,JSON.stringify(snapshot,null,2)+'\n');dom.window.close();
  if(results.every(r=>r.status==='rejected'))process.exitCode=1;
}
main().catch(e=>{console.error(e.message);dom.window.close();process.exitCode=1;});
