'use strict';
const fs=require('fs'),path=require('path'),api=require('../themes/flyfish/source/js/market-data.js');
const target=path.resolve(__dirname,'../source/_data/markets.json');
(async()=>{const data=api.cleanSnapshot(fs.existsSync(target)?JSON.parse(fs.readFileSync(target,'utf8')):null);let success=0;
  await Promise.all(['tencent','wscn'].map(async provider=>{try{const response=await fetch(api.requestURL(provider,api.MARKETS.map(m=>m.id)),{signal:AbortSignal.timeout(12000),headers:{Origin:'https://flyfish567.github.io'}});if(!response.ok)throw Error('HTTP '+response.status);const body=provider==='tencent'?new TextDecoder('gb18030').decode(await response.arrayBuffer()):await response.text();const quotes=provider==='tencent'?api.parseTencent(body):api.parseWscn(body);if(!Object.keys(quotes).length)throw Error('暂无有效报价');Object.assign(data.quotes,quotes);success++;console.log(provider+': '+Object.keys(quotes).length+' 项');}catch(e){console.error(provider+': '+e.message+'，保留已有报价时间');}}));
  if(success){data.fetchedAt=new Date().toISOString();fs.writeFileSync(target,JSON.stringify(data,null,2)+'\n');}else process.exitCode=1;
})();
