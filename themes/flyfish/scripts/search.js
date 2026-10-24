'use strict';
const {stripHTML,unescapeHTML,url_for}=require('hexo-util');
const moment=require('moment');

hexo.extend.generator.register('flyfish-search-index',()=>({
  path:'search-index.json',
  data:JSON.stringify({version:1,posts:hexo.locals.get('posts').sort('-date').toArray().map(post=>({
    title:post.title,
    url:url_for.call(hexo,post.path,{relative:false}).replaceAll('#','%23').replaceAll('?','%3F'),
    date:moment(post.date).format('YYYY.MM.DD'),
    tags:[...new Set(post.tags.toArray().map(tag=>tag.name.toLowerCase()==='xss'?'XSS':tag.name))],
    summary:hexo.extend.helper.get('ff_summary')(post),
    text:unescapeHTML(stripHTML(String(post.content||'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<\/(p|li|h[1-6]|pre|td|tr)>/gi,' '))).replace(/\s+/g,' ').trim()
  }))})
}));
