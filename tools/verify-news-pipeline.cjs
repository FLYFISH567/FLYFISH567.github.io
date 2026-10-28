'use strict';
const assert=require('assert/strict'),fs=require('fs'),{JSDOM}=require('jsdom'),yaml=require('js-yaml');
const api=require('../themes/flyfish/source/js/briefing-sources.js'),{collect,merge,responseText}=require('./lib/briefing-collector.cjs');
const dom=new JSDOM(''),Parser=dom.window.DOMParser,now=Date.now();
const item=(date,title='Current news')=>`<item><title>${title}</title><link>https://example.org/news</link><guid>story</guid><pubDate>${new Date(date).toUTCString()}</pubDate></item>`;
async function main(){
  const base=api.cleanSnapshot({version:1,sources:{}}),stamp=new Date(now-86400000).toISOString();
  for(const spec of api.SOURCES)base.sources[spec.id]={fetchedAt:stamp,edition:'',tip:'',items:[{id:spec.id+':old',title:'Previous story',url:'https://example.org/old',publishedAt:stamp,updatedAt:stamp,summary:'',byline:'',topic:spec.label}]};
  const before=structuredClone(base),counts={};
  const fetcher=async url=>{const spec=api.SOURCES.find(s=>api.urlFor(s)===url||s.id==='daily'&&url.includes('/60s/'));assert.ok(spec,url);counts[spec.id]=(counts[spec.id]||0)+1;
    if(spec.id==='cnn')return {ok:false,status:503,headers:new Map()};
    if(spec.id==='dev'&&counts.dev===1)throw Error('transient failure');
    let body;if(spec.format==='daily'||spec.format==='ai')body=JSON.stringify({date:api.day(),news:spec.format==='ai'?[]:['Current news'],link:'https://example.org/news'});
    else if(spec.format==='atom')body=`<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>new</id><title>Current</title><published>${new Date(now).toISOString()}</published><link rel="alternate" href="https://example.org/news"/></entry></feed>`;
    else if(spec.format==='indexed')body='<rss><channel>'+item(now).replace('</item>',`<source url="https://${spec.domain}">Publisher</source></item>`)+'</channel></rss>';
    else body='<rss><channel>'+item(spec.id==='bbc'?now-10*86400000:now)+'</channel></rss>';
    return {ok:true,headers:new Map(),text:async()=>body};
  };
  const result=await collect(base,{Parser,now,fetcher,sleep:async()=>{}});
  assert.equal(result.success,api.SOURCES.length-2);assert.equal(counts.dev,2,'Transient errors retry');assert.equal(counts.cnn,2,'Retries are bounded');
  for(const id of ['cnn','bbc']){assert.deepEqual(result.snapshot.sources[id],before.sources[id],'Failed or frozen feeds preserve actual last-success dates and contents');assert.equal(result.snapshot.health[id].failures,1);}
  assert.equal(result.snapshot.health.bbc.status,'stale');assert.equal(result.snapshot.health.cnn.status,'error');assert.equal(result.snapshot.health.dev.status,'ok');assert.equal(result.snapshot.sources.ai.items.length,0,'An empty AI edition does not become fabricated news');
  const spec=api.SOURCES.find(s=>s.id==='ap');assert.throws(()=>api.parse(spec,'<rss><channel>'+item(now).replace('</item>','<source url="https://apnews.com.attacker.example">Fake</source></item>')+'</channel></rss>',Parser),'Indexed publisher must match the actual source domain');
  const guancha=api.SOURCES.find(s=>s.id==='guancha');
  const guanchaFeed=publisher=>'<rss><channel>'+item(now).replace('</item>',`<source url="https://${publisher}">观察者网</source></item>`)+'</channel></rss>';
  assert.equal(api.parse(guancha,guanchaFeed('www.guancha.cn'),Parser).items.length,1,'Guancha official-site stories are accepted');
  assert.throws(()=>api.parse(guancha,guanchaFeed('user.guancha.cn'),Parser),'Fengwen user posts are a separate publication stream');
  const older=structuredClone(result.snapshot);older.sources.dev.fetchedAt=new Date(now+10000).toISOString();older.sources.dev.items[0].publishedAt=stamp;const chosen=merge(structuredClone(result.snapshot),older);assert.equal(chosen.sources.dev.items[0].title,'Current news','A newer fetch cannot roll content back');
  await assert.rejects(()=>responseText('https://example.org',async()=>({ok:true,headers:new Map([['content-length','5000000']])})),/too large/);
  const workflow=yaml.load(fs.readFileSync('.github/workflows/pages.yml','utf8'));assert.equal(workflow.on.schedule[0].cron,'17 * * * *');assert.equal(workflow.jobs.deploy.needs,'build');assert.equal(workflow.jobs.check.needs,'deploy');assert.equal(workflow.concurrency['cancel-in-progress'],false);
  console.log('PASS: partial outages, bounded retries, frozen feeds, rollback protection, empty editions, indexed-publisher validation, size limits and scheduled deployment gates.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>dom.window.close());
