(() => {
  'use strict';
  const dialog=document.querySelector('#site-search');
  if(!dialog)return;
  const input=dialog.querySelector('input'),results=dialog.querySelector('[data-search-results]');
  const status=dialog.querySelector('[data-search-status]'),retry=dialog.querySelector('[data-search-retry]');
  let posts=null,pending=null,opener=null,timer=0;
  const lower=value=>String(value).toLocaleLowerCase();

  // 使用文本节点与 mark 输出匹配片段，正文或搜索词不会被当成 HTML。
  function highlighted(node,text,terms){
    const value=String(text),normalized=lower(value),ranges=[];
    for(const term of terms){let from=0,index;while((index=normalized.indexOf(term,from))!==-1){ranges.push([index,index+term.length]);from=index+term.length;}}
    ranges.sort((a,b)=>a[0]-b[0]);let cursor=0;
    for(let i=0;i<ranges.length;i++){
      const start=Math.max(cursor,ranges[i][0]);let end=ranges[i][1];
      while(i+1<ranges.length&&ranges[i+1][0]<=end)end=Math.max(end,ranges[++i][1]);
      if(end<=cursor)continue;
      node.append(document.createTextNode(value.slice(cursor,start)));
      const mark=document.createElement('mark');mark.textContent=value.slice(start,end);node.append(mark);cursor=end;
    }
    node.append(document.createTextNode(value.slice(cursor)));
  }
  function snippet(post,terms){
    const summary=post.summary||'';
    if(!terms.length||terms.some(term=>lower(summary).includes(term)))return summary;
    const matches=terms.map(term=>lower(post.text).indexOf(term)).filter(index=>index>=0);
    if(!matches.length)return summary;
    const start=Math.max(0,Math.min(...matches)-35),end=Math.min(post.text.length,start+145);
    return (start?'…':'')+post.text.slice(start,end)+(end<post.text.length?'…':'');
  }
  function render(){
    if(!posts)return;
    const query=lower(input.value.trim()),terms=[...new Set(query.split(/\s+/).filter(Boolean))];
    const matches=terms.length?posts.filter(post=>terms.every(term=>post.searchable.includes(term))).map(post=>({post,score:terms.reduce((score,term)=>score+(post.titleText.includes(term)?30:0)+(post.tagText.includes(term)?16:0)+(post.summaryText.includes(term)?6:0),post.titleText.includes(query)?40:0)})).sort((a,b)=>b.score-a.score).map(item=>item.post):posts.slice(0,6);
    const fragment=document.createDocumentFragment();
    for(const post of matches){
      const item=document.createElement('li'),link=document.createElement('a'),title=document.createElement('h3'),copy=document.createElement('p'),meta=document.createElement('small');
      link.href=post.url;highlighted(title,post.title,terms);highlighted(copy,snippet(post,terms),terms);meta.textContent=post.date+(post.tags.length?' · '+post.tags.map(tag=>'#'+tag).join('  '):'');
      link.append(title,copy,meta);item.append(link);fragment.append(item);
    }
    results.replaceChildren(fragment);results.scrollTop=0;
    status.textContent=terms.length?(matches.length?'找到 '+matches.length+' 篇文章':'没有找到匹配文章，试试其他关键词。'):'最近更新 · 共 '+posts.length+' 篇文章';
  }
  async function load(){
    if(posts){render();return;}
    status.textContent='正在加载搜索…';retry.hidden=true;
    if(!pending)pending=fetch(dialog.dataset.searchIndex,{cache:'no-cache'}).then(response=>{if(!response.ok)throw new Error('search');return response.json();}).then(data=>{
      if(!Array.isArray(data.posts))throw new Error('index');
      posts=data.posts.map(post=>({...post,titleText:lower(post.title),tagText:lower(post.tags.join(' ')),summaryText:lower(post.summary),searchable:lower([post.title,post.tags.join(' '),post.summary,post.text].join(' '))}));
    }).catch(error=>{pending=null;throw error;});
    try{await pending;render();}catch{status.textContent='搜索暂时无法加载，请重试。';retry.hidden=false;}
  }
  function open(){
    if(document.querySelector('dialog[open]:not(#site-search)'))return;
    if(!dialog.open){opener=document.activeElement;dialog.showModal();document.body.classList.add('dialog-open');}
    input.focus();load();
  }
  document.querySelectorAll('[data-open-search]').forEach(button=>button.addEventListener('click',open));
  dialog.querySelector('.search-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape'&&!event.isComposing){event.preventDefault();event.stopPropagation();dialog.close();}});
  dialog.addEventListener('close',()=>{clearTimeout(timer);document.body.classList.toggle('dialog-open',!!document.querySelector('dialog[open]'));if(opener?.isConnected)opener.focus({preventScroll:true});});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
  function schedule(){clearTimeout(timer);timer=setTimeout(render,100);}
  input.addEventListener('input',event=>{if(!event.isComposing)schedule();});
  input.addEventListener('compositionend',schedule);
  input.addEventListener('keydown',event=>{
    if(event.isComposing)return;
    if(event.key==='ArrowDown'){event.preventDefault();clearTimeout(timer);render();results.querySelector('a')?.focus();}
    if(event.key==='Enter'){event.preventDefault();clearTimeout(timer);render();results.querySelector('a')?.click();}
  });
  results.addEventListener('keydown',event=>{
    if(!['ArrowDown','ArrowUp'].includes(event.key))return;
    const links=Array.from(results.querySelectorAll('a')),index=links.indexOf(document.activeElement);if(index<0)return;
    event.preventDefault();const next=index+(event.key==='ArrowDown'?1:-1);if(next<0)input.focus();else links[Math.min(next,links.length-1)].focus();
  });
  retry.addEventListener('click',load);
  document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();open();}});
})();
