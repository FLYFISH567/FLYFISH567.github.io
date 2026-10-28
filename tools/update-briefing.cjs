'use strict';
const fs=require('fs'),path=require('path'),{JSDOM}=require('jsdom');
const api=require('../themes/flyfish/source/js/briefing-sources.js');
const {collect,merge,responseText}=require('./lib/briefing-collector.cjs');
const target=path.resolve(__dirname,'../source/_data/briefing.json'),dom=new JSDOM('');
async function main(){
  const seed=api.cleanSnapshot(fs.existsSync(target)?JSON.parse(fs.readFileSync(target,'utf8')):{version:1,sources:{}});
  // 已发布数据是独立于 Actions 缓存的最近成功备份。
  if(process.argv.includes('--live'))try{merge(seed,api.cleanSnapshot(JSON.parse(await responseText('https://flyfish567.github.io/briefing/feed.json'))));}catch(e){console.warn('线上备用快照不可用：'+e.message);}
  const result=await collect(seed,{Parser:dom.window.DOMParser,log:console.log});
  fs.writeFileSync(target+'.tmp',JSON.stringify(result.snapshot,null,2)+'\n');fs.renameSync(target+'.tmp',target);
  const failures=Object.entries(result.snapshot.health).filter(([,h])=>h.status!=='ok');
  const summary=['## 资讯采集','',`检查时间：${result.snapshot.checkedAt}；成功 ${result.success}/${result.total}。`,...failures.map(([id,h])=>`- ${api.SOURCES.find(s=>s.id===id).name}：${h.error}；保留原日期。`)];
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary.join('\n')+'\n');
  console.log(`Sources ready: ${result.success}/${result.total}`);
  const minimum=process.argv.includes('--strict')?Math.ceil(result.total*.35):1;
  if(result.success<minimum)throw Error('本次可更新来源过少，停止发布，线上继续保留上一版。');
  if(failures.length&&process.env.GITHUB_ACTIONS)console.log('::warning::部分资讯来源暂时不可用，已保留最后成功的数据；详见任务摘要。');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>dom.window.close());
