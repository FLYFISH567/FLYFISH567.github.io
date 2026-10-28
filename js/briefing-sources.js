(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FlyfishBriefingSources=api;})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  const SOURCES=[
    {id:'daily',name:'每日 60 秒',category:'general',label:'综合要闻',format:'daily',url:'https://60s-static.viki.moe/60s/:date.json',home:'https://github.com/vikiboss/60s-static-host',ttl:3600000,note:'国内与国际要闻，由每日 60 秒整理。'},
    {id:'ai',name:'AI 工具集 / 60s',category:'ai',label:'AI 动态',format:'ai',url:'https://60s.crystelf.top/v2/ai-news',home:'https://ai-bot.cn/daily-ai-news/',ttl:21600000,note:'国内外模型、产品与行业报道，通常汇总前一日；并非每天都有新条目。'},
    {id:'radar',name:'Radar Ultra',category:'radar',label:'Codex 雷达',format:'atom',url:'https://data.radarultra.com/open/codex-resets/feed/zh-hans.atom',home:'https://radarultra.com/zh-hans/codex',ttl:900000,note:'第三方重置观察；预告、执行、人工确认均保留来源状态，不代表个人剩余额度。'},
    {id:'dev',name:'GitHub Changelog',category:'dev',label:'开发工具',format:'rss',url:'https://github.blog/changelog/feed/',home:'https://github.blog/changelog/',ttl:3600000,note:'GitHub 官方产品与开发工具更新，保留原文语言。'},
    {id:'security',name:'GitHub Security',category:'security',label:'安全阅读',format:'rss',url:'https://github.blog/security/feed/',home:'https://github.blog/security/',ttl:3600000,note:'GitHub 官方安全研究与公告，不以条数补齐每日内容。'}
  ];
  const CATEGORIES=[['all','全部'],['general','综合要闻'],['ai','AI 动态'],['radar','Codex 雷达'],['dev','开发工具'],['security','安全阅读']];

  function safeURL(value){try{const u=new URL(String(value));return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}}
  function day(value=Date.now()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));}
  function iso(value){const n=Date.parse(value);return Number.isFinite(n)?new Date(n).toISOString():'';}
  function plain(value,Parser){const d=new Parser().parseFromString(String(value||''),'text/html');d.querySelectorAll('script,style').forEach(e=>e.remove());return (d.body?.textContent||'').replace(/\s+/g,' ').trim();}
  function topic(text){return /降价|价格|资费|免费|额度|定价/.test(text)?'价格与额度':/发布|升级|上线|开源|模型/.test(text)?'发布与升级':'行业观察';}
  function parse(spec,text,Parser){
    let items=[],edition='',tip='';
    if(['daily','ai'].includes(spec.format)){
      const json=JSON.parse(text),data=json.data||json;
      if(!/^\d{4}-\d{2}-\d{2}$/.test(data.date)||!Array.isArray(data.news))throw Error('数据格式变化');
      edition=data.date;tip=plain(data.tip||'',Parser).slice(0,160);
      items=data.news.slice(0,spec.format==='daily'?15:16).map((entry,i)=>{
        const title=plain(typeof entry==='string'?entry:entry.title,Parser).slice(0,300),url=safeURL(typeof entry==='string'?data.link:entry.link);
        return {id:spec.id+':'+edition+':'+(url&&spec.format==='ai'?url:i),title,url,summary:typeof entry==='string'?'':plain(entry.detail,Parser).slice(0,150),publishedAt:iso(edition+'T00:00:00+08:00'),updatedAt:iso(edition+'T00:00:00+08:00'),byline:typeof entry==='string'?'':plain(entry.source,Parser).slice(0,60),topic:spec.format==='ai'?topic(title):'新闻简报'};
      });
    }else{
      const doc=new Parser().parseFromString(text,'application/xml');if(doc.querySelector('parsererror'))throw Error('订阅格式变化');
      const nodes=Array.from(doc.querySelectorAll(spec.format==='atom'?'entry':'item'));
      if(!nodes.length)throw Error('订阅暂无条目');
      items=nodes.slice(0,10).map(node=>{
        const get=tag=>node.getElementsByTagName(tag)[0]?.textContent||'';
        const url=safeURL(spec.format==='atom'?Array.from(node.getElementsByTagName('link')).find(e=>e.getAttribute('rel')==='alternate')?.getAttribute('href'):get('link'));
        const publishedAt=iso(get('published')||get('pubDate')||get('updated'));
        const title=plain(get('title'),Parser).slice(0,220);
        return {id:spec.id+':'+(get('id')||get('guid')||url),title,url,summary:plain(get('description')||get('content')||get('summary'),Parser).slice(0,spec.id==='radar'?160:130),publishedAt,updatedAt:iso(get('updated'))||publishedAt,byline:'',topic:spec.id==='radar'?(title.includes('人工确认')?'人工确认':title.includes('已执行')?'已执行':title.includes('已预告')?'已预告':'来源记录'):spec.label};
      });
    }
    items=items.filter(x=>x.title&&x.url&&x.publishedAt);if(!items.length&&spec.format!=='ai')throw Error('没有可用条目');
    return {fetchedAt:new Date().toISOString(),edition,tip,items};
  }
  function cleanSnapshot(data){
    const sources={};if(data?.version!==1||!data.sources)return {version:1,sources};
    for(const spec of SOURCES){const group=data.sources[spec.id];if(!group||!Array.isArray(group.items)||!iso(group.fetchedAt))continue;
      sources[spec.id]={fetchedAt:iso(group.fetchedAt),edition:/^\d{4}-\d{2}-\d{2}$/.test(group.edition)?group.edition:'',tip:typeof group.tip==='string'?group.tip.slice(0,160):'',items:group.items.slice(0,30).filter(x=>typeof x.id==='string'&&typeof x.title==='string'&&safeURL(x.url)&&iso(x.publishedAt)).map(x=>({id:x.id.slice(0,600),title:x.title.slice(0,300),url:safeURL(x.url),summary:String(x.summary||'').slice(0,160),publishedAt:iso(x.publishedAt),updatedAt:iso(x.updatedAt)||iso(x.publishedAt),byline:String(x.byline||'').slice(0,60),topic:String(x.topic||spec.label).slice(0,40)}))};
    }
    return {version:1,sources};
  }
  function urlFor(spec,date=Date.now()){return spec.url.replace(':date',day(date));}
  return {SOURCES,CATEGORIES,safeURL,day,parse,cleanSnapshot,urlFor};
});
