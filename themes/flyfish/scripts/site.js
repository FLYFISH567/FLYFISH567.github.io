'use strict';
const {stripHTML, unescapeHTML} = require('hexo-util');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const moment = require('moment');
const dates = require('../content-dates.json');
const normalize = name => String(name || '').toLowerCase() === 'xss' ? 'XSS' : String(name || '');
const allPosts = () => hexo.locals.get('posts').sort('-date').toArray();
const data = () => hexo.locals.get('data') || {};
const tags = post => [...new Set(post.tags.toArray().map(tag => normalize(tag.name)))];
const plain = html => unescapeHTML(stripHTML(String(html || '').replace(/<(pre|figure|table|script|style|code)\b[^>]*>[\s\S]*?<\/\1>/gi, ' '))).replace(/\s+/g, ' ').trim();
const life = post => /小记|生活|日常/.test(post.source + ' ' + post.categories.toArray().map(c => c.name).join(' ')) && !post.source.endsWith('/help.md');
const topic = post => tags(post).find(t => /SQL|SSRF|SSTI|PHP|XSS|命令执行|文件上传|信息收集|目录遍历/.test(t)) || (life(post) ? '生活小记' : tags(post).includes('WP') ? 'CTF 题解' : '工具与经验');
hexo.extend.helper.register('ff_posts', allPosts);
const assetCache = new Map();
hexo.extend.helper.register('ff_asset', function (asset) {
  const file=path.join(hexo.theme_dir,'source',asset);
  const stat=fs.statSync(file),signature=stat.mtimeMs+':'+stat.size;
  let cached=assetCache.get(asset);
  if(!cached || cached.signature!==signature){cached={signature,version:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,10)};assetCache.set(asset,cached);}
  return this.url_for('/'+asset)+'?v='+cached.version;
});
hexo.extend.helper.register('ff_life', life);
hexo.extend.helper.register('ff_tags', tags);
hexo.extend.helper.register('ff_post_url', function (value) {
  // 文件名中的 #/? 是路径字符，不能让浏览器把它们当成锚点或查询串。
  return this.url_for(String(value)).replaceAll('#','%23').replaceAll('?','%3F');
});
hexo.extend.helper.register('ff_topic', topic);
hexo.extend.helper.register('ff_plain', plain);
hexo.extend.helper.register('ff_summary', function (post) {
  const explicit = hexo.theme.config.summaries?.[post.title] || post.description;
  const text = plain(explicit || post.content) || `${post.title}，保存学习过程中的代码与笔记。`;
  return text.slice(0, 105) + (text.length > 105 ? '…' : '');
});
hexo.extend.helper.register('ff_topics', function () {
  const counts = new Map();
  for (const post of allPosts()) for (const name of tags(post)) if (name !== 'test') counts.set(name, (counts.get(name) || 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({name, count}));
});
hexo.extend.helper.register('ff_essays', () => (data().essay?.[0]?.essay_list || []).slice().sort((a,b) => String(b.date).localeCompare(String(a.date))));
hexo.extend.helper.register('ff_albums', () => data().album || []);
// 相册维护入口：source/_data/album.yml。只排序展示副本，不改写原数据。
// 新记录可以追加在 album_list 末尾，保留旧 #photo-group-N 链接，页面仍把最新日期放在上面。
const albumDate=value=>{const time=moment(String(value),['YYYY-M-D','YYYY-MM-DD','YYYY/M/D','YYYY','YYYY/MM/DD'],true);return time.isValid()?time.valueOf():0;};
const albumGroups=album=>(album.album_list||[]).map((group,index)=>({group,index})).sort((a,b)=>albumDate(b.group.date)-albumDate(a.group.date));
hexo.extend.helper.register('ff_album_groups',albumGroups);
hexo.extend.helper.register('ff_album_display',()=>[...(data().album||[])].sort((a,b)=>albumDate(albumGroups(b)[0]?.group.date)-albumDate(albumGroups(a)[0]?.group.date)));
// 封面优先级：_config.flyfish.yml 的 album_covers > 相册 cover > 最新记录第一张图。
// cover 是固定封面，不会因为地图标点变化而替换。
hexo.extend.helper.register('ff_album_cover', album => {
  const choice=hexo.theme.config.album_covers?.[album.path_name];
  return choice || album.cover || albumGroups(album)[0]?.group.image?.[0];
});
hexo.extend.helper.register('ff_album_category', album => /败犬|孤独摇滚/.test(album.class_name) ? '二次元' : album.class_name);
hexo.extend.helper.register('ff_album', function (page) {
  const current = '/' + String(page.path || '').replace(/index\.html$/, '').replace(/\/$/, '');
  return (data().album || []).find(a => a.path_name.replace(/\/$/, '') === current);
});
hexo.extend.helper.register('ff_shows', () => data().bangumis || {wantWatch:[],watching:[],watched:[]});
hexo.extend.helper.register('ff_shelf', () => data().shelf || {films:[],books:[]});
hexo.extend.helper.register('ff_toolbox_links', () => data().toolbox || []);
hexo.extend.helper.register('ff_about', () => data().about?.[0] || {});
// 旧文章没有日期 front matter；固定现有日期，原始 Markdown 保持不变。
// 日后作者显式填写 date/updated 时，以作者的值为准。
hexo.extend.filter.register('before_generate', async () => {
  await Promise.all(hexo.model('Post').toArray().map(async post => {
    const saved=dates[post.source];if(!saved)return;
    const raw=fs.readFileSync(path.join(hexo.source_dir,post.source),'utf8');
    const front=raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] || '';
    const changes={};
    if(!/^date\s*:/m.test(front))changes.date=moment(saved.date);
    if(!/^updated\s*:/m.test(front) && crypto.createHash('sha256').update(raw).digest('hex')===saved.sha256)changes.updated=moment(saved.updated);
    Object.assign(post,changes);
    // 生成器会挂载 prev/next 循环引用；增量构建时只更新日期字段。
    if(Object.keys(changes).length)await post.update(changes);
  }));
// 首次正文渲染（默认优先级 10）会保存模型，须在它之后恢复历史日期。
}, 20);
hexo.extend.helper.register('ff_safe_url', function (value) {
  const url = String(value || '').trim();
  return /^(https?:\/\/|\/(?!\/)|#)/i.test(url) ? url : '#';
});
hexo.extend.helper.register('ff_page_kind', function (page) {
  if (page.ff_kind) return page.ff_kind;
  const path = String(page.path || '');
  if (/^Warning\//.test(path)) return 'warning';
  if (page.type === 'music') return 'music';
  if (page.type === 'album' || page.type === 'album_detail') return page.type;
  if (page.type === 'about') return 'about';
  if (page.type === 'essay') return 'essay';
  if (page.type === 'briefing') return 'briefing';
  if (page.type === 'shelf') return 'shelf';
  if (page.type === 'toolbox') return 'toolbox';
  if (/^bangumis\//.test(path) || page.title === hexo.config.bangumi?.title) return 'bangumi';
  if (/^(archives|categories|tags)\//.test(path) || ['categories','tags'].includes(page.type)) return 'articles';
  return 'page';
});
hexo.extend.helper.register('ff_updates', function () {
  const entries=[];
  for(const item of data().site_updates||[])if(item.date&&item.title&&/^\/(?!\/)/.test(item.url||''))entries.push({kind:'小站更新',title:item.title,date:String(item.date),url:this.url_for(item.url)});
  for(const post of allPosts()){
    if(moment(post.updated).startOf('day').isAfter(moment(post.date).startOf('day')))entries.push({kind:'文章修订',title:post.title,date:moment(post.updated).format('YYYY-MM-DD'),url:this.ff_post_url(post.path)});
  }
  for(const album of data().album||[])for(const [index,group] of (album.album_list||[]).entries()){
    const time=moment(String(group.date),['YYYY-M-D','YYYY-MM-DD','YYYY/M/D','YYYY/MM/DD'],true);
    if(time.isValid())entries.push({kind:'相册',title:group.content||album.class_name,date:time.format('YYYY-MM-DD'),url:this.url_for(album.path_name.replace(/\/$/,'')+'/')+'#photo-group-'+index});
  }
  for(const item of data().essay?.[0]?.essay_list||[]){const time=moment(String(item.date),['YYYY-MM-DD','YYYY/MM/DD'],true);if(time.isValid())entries.push({kind:'说说',title:item.content,date:time.format('YYYY-MM-DD'),url:this.url_for('/essay/')});}
  if(data().now?.updated)entries.push({kind:'近况',title:'最近在学、在做和喜欢的事',date:String(data().now.updated),url:this.url_for('/about/#now-title')});
  return entries.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,2);
});
const briefing=require('../source/js/briefing-sources.js');
const markets=require('../source/js/market-data.js');
hexo.extend.helper.register('ff_markets',()=>markets);
hexo.extend.helper.register('ff_market_snapshot',()=>markets.cleanSnapshot(data().markets));
hexo.extend.helper.register('ff_briefing',()=>briefing.cleanSnapshot(data().briefing));
hexo.extend.helper.register('ff_briefing_sources',()=>briefing.SOURCES);
hexo.extend.helper.register('ff_briefing_categories',()=>briefing.CATEGORIES);
hexo.extend.generator.register('flyfish-briefing',()=>({path:'briefing/feed.json',data:JSON.stringify(data().briefing||{version:1,sources:{}})}));
hexo.extend.helper.register('ff_related', function (post) {
  const own = tags(post);
  return allPosts().filter(p => p.path !== post.path).map(p => ({post:p,score:tags(p).filter(t => own.includes(t)).length})).sort((a,b) => b.score-a.score).slice(0,3).map(x=>x.post);
});
hexo.extend.generator.register('flyfish-hubs', () => [
  {path:'articles/index.html',layout:['hub'],data:{title:'文章库',ff_kind:'articles'}},
  {path:'life/index.html',layout:['hub'],data:{title:'小记',ff_kind:'life'}},
  {path:'comments/index.html',layout:['hub'],data:{title:'留言板',ff_kind:'contact'}},
  {path:'404.html',layout:['hub'],data:{title:'这一页暂时找不到了',ff_kind:'404'}}
]);
