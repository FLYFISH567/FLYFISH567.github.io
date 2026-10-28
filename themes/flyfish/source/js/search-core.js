(() => {
  'use strict';
  const lower=value=>String(value||'').toLocaleLowerCase();
  let posts=null,pending=null;
  const terms=query=>[...new Set(lower(query).trim().split(/\s+/).filter(Boolean))];
  const prepare=post=>({...post,titleText:lower(post.title),tagText:lower((post.tags||[]).join(' ')),summaryText:lower(post.summary),searchable:lower([post.title,(post.tags||[]).join(' '),post.summary,post.text].join(' '))});
  function key(value){try{return decodeURIComponent(new URL(value,location.href).pathname).replace(/index\.html$/,'');}catch{return value;}}
  function matches(post,query){return terms(query).every(term=>post.searchable.includes(term));}
  function rank(records,query){const words=terms(query),q=lower(query).trim();return records.filter(post=>matches(post,q)).map((post,index)=>({post,index,score:words.reduce((score,term)=>score+(post.titleText.includes(term)?30:0)+(post.tagText.includes(term)?16:0)+(post.summaryText.includes(term)?6:0),post.titleText.includes(q)?40:0)})).sort((a,b)=>b.score-a.score||a.index-b.index).map(x=>x.post);}
  async function load(url){
    if(posts)return posts;
    if(!pending)pending=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);try{const response=await fetch(url,{signal:controller.signal,cache:'no-cache'});if(!response.ok)throw Error('index');const data=await response.json();if(!Array.isArray(data.posts))throw Error('index');posts=data.posts.map(prepare);return posts;}finally{clearTimeout(timer);}})().catch(error=>{pending=null;throw error;});
    return pending;
  }
  window.FlyfishSearch={load,prepare,matches,rank,key};
})();
