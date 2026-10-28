'use strict';
const api=require('../../themes/flyfish/source/js/briefing-sources.js');
const latest=group=>(group?.items||[]).reduce((value,item)=>item.publishedAt>value?item.publishedAt:value,'');
function merge(target,incoming){
  for(const spec of api.SOURCES){const next=incoming.sources[spec.id],old=target.sources[spec.id];
    if(next&&(!old||Date.parse(next.fetchedAt)>Date.parse(old.fetchedAt))&&(!old||!latest(old)||!latest(next)||latest(next)>=latest(old))){target.sources[spec.id]=next;if(incoming.health?.[spec.id])target.health[spec.id]=incoming.health[spec.id];}
  }
  return target;
}
async function responseText(url,fetcher=fetch){
  const response=await fetcher(url,{headers:{'User-Agent':'FLYFISHING News Reader/2.0 (+https://flyfish567.github.io/briefing/)','Accept':'application/rss+xml, application/atom+xml, application/json, text/xml;q=0.9, */*;q=0.5'},signal:AbortSignal.timeout(15000)});
  if(!response.ok){const error=Error('HTTP '+response.status);error.retryAfter=response.headers?.get('retry-after');throw error;}
  if(Number(response.headers?.get('content-length'))>4000000)throw Error('Feed too large');
  const reader=response.body?.getReader();if(!reader){const value=await response.text();if(Buffer.byteLength(value)>4000000)throw Error('Feed too large');return value;}
  let size=0;const chunks=[];try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>4000000){await reader.cancel();throw Error('Feed too large');}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=Buffer.concat(chunks),start=bytes.subarray(0,200).toString('ascii');const charset=/encoding=["']([^"']+)/i.exec(start)?.[1]||'utf-8';return new TextDecoder(charset).decode(bytes);
}
async function collect(snapshot,{Parser,fetcher=fetch,now=Date.now(),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),log=()=>{}}={}){
  snapshot=api.cleanSnapshot(snapshot);const checkedAt=new Date(now).toISOString();let cursor=0,success=0;
  await Promise.all(Array.from({length:4},async()=>{while(cursor<api.SOURCES.length){const spec=api.SOURCES[cursor++],old=snapshot.sources[spec.id];let error,parsed;
    const dates=spec.id==='daily'?[now,now-86400000]:[now];
    for(let attempt=0;attempt<2&&!parsed;attempt++){
      for(const date of dates){try{
        const next=api.parse(spec,await responseText(api.urlFor(spec,date),fetcher),Parser),newest=latest(next),previous=latest(old);
        const maxDays=spec.category==='ai'?7:['dev','security','radar'].includes(spec.category)?21:3;
        if(newest&&now-Date.parse(newest)>maxDays*86400000)throw Error('来源内容已超过 '+maxDays+' 天未更新');
        if(previous&&newest&&Date.parse(newest)<Date.parse(previous)-300000)throw Error('来源日期倒退，保留较新快照');
        if(old?.edition&&next.edition&&next.edition<old.edition)throw Error('日报日期倒退');
        parsed=next;break;
      }catch(e){error=e;}}
      if(!parsed&&attempt===0){const seconds=Number(error?.retryAfter);if(Number.isFinite(seconds)&&seconds>5)break;await sleep(Number.isFinite(seconds)&&seconds>0?seconds*1000:700);}
    }
    if(parsed){snapshot.sources[spec.id]=parsed;snapshot.health[spec.id]={status:'ok',checkedAt,failures:0,error:'',latestAt:latest(parsed)};success++;log(spec.name+': '+parsed.items.length+' 条');}
    else{snapshot.health[spec.id]={status:/未更新|倒退/.test(error?.message)?'stale':'error',checkedAt,failures:(snapshot.health[spec.id]?.failures||0)+1,error:String(error?.message||'Unknown error').slice(0,160),latestAt:latest(old)};log(spec.name+': '+snapshot.health[spec.id].error+'（保留旧快照）');}
  }}));
  snapshot.checkedAt=checkedAt;return {snapshot,success,total:api.SOURCES.length};
}
module.exports={collect,merge,latest,responseText};
