'use strict';
// Integration checks against the pre-refactor content inventory and generated site.
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const assert=require('assert/strict');
const cheerio=require('cheerio');
const root=path.resolve(__dirname,'..');
const output=path.resolve(root,process.argv[2]||'public');
const baseline=JSON.parse(fs.readFileSync(path.join(root,'tools/fixtures/content-baseline.json'),'utf8'));
// 用户明确要求移除测试文章；原件仍保存在重构前备份中。
const removedTest={file:'source/_posts/help.md',source:'_posts/help.md',route:'article/help/index.html'};
const expectedPosts=baseline.posts.filter(post=>post.source!==removedTest.source);
const load=relative=>cheerio.load(fs.readFileSync(path.join(output,relative),'utf8'));
for(const [file,hash] of Object.entries(baseline.hashes)){
  const original=path.join(root,file);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(original)).digest('hex'),hash,`Source changed: ${file}`);
}
for(const post of expectedPosts){
  const $=load(post.path+'index.html');
  assert.equal($('.article-heading h1').text().trim(),post.title,`Missing article: ${post.path}`);
  const published=$('.article-heading time').first().attr('datetime');
  assert.ok(Math.abs(Date.parse(published)-Date.parse(post.date))<1000,`Date changed: ${post.title}`);
  assert.ok($('.article-body').length,`Missing body: ${post.title}`);
}
const hub=load('articles/index.html');assert.equal(hub('[data-post-card]').length,expectedPosts.length,'Article hub must include all retained posts');
assert.equal(hub('[data-post-card][data-topics*=test]').length,0,'Test article must not appear in search');
assert.ok(!fs.existsSync(path.join(output,removedTest.route)),'Stale test article HTML must be removed');
assert.ok(!fs.existsSync(path.join(output,'tags/test/index.html')),'Stale test tag must be removed');
if(fs.existsSync(path.join(output,'search.xml'))){
  const search=cheerio.load(fs.readFileSync(path.join(output,'search.xml'),'utf8'),{xmlMode:true});
  assert.ok(!search('entry url').toArray().some(node=>search(node).text()==='/article/help/'),'Test article must be removed from the search index');
}
assert.equal(hub('[data-topic="XSS"]').length,1,'XSS aliases must have one filter');
assert.equal(hub('[data-topic="xss"]').length,0,'Lowercase XSS alias should be merged');
for(const route of ['index.html','articles/index.html','life/index.html','music/index.html','briefing/index.html','about/index.html','album/index.html','essay/index.html','bangumis/index.html','comments/index.html','archives/index.html','categories/index.html','tags/index.html']){
  const $=load(route);assert.deepEqual($('#main-nav a').map((_,el)=>$(el).attr('href')).get(),['/','/articles/','/album/','/briefing/','/music/','/about/'],`Unexpected navigation: ${route}`);
  assert.equal($('#main-nav button[data-open-search][aria-controls="site-search"]').length,1,`Search must open a dialog: ${route}`);
  assert.equal($('#site-search').length,1,`Missing standalone search dialog: ${route}`);
  assert.equal($('#main-nav a[href^="javascript:"]').length,0,`Nonfunctional parent navigation: ${route}`);
  assert.equal($('#loading-box,#loading-screen,.loading-bg').length,0,`Blocking preloader: ${route}`);
  assert.ok(!$('#main-nav').text().match(/警示|友链|留言板/),`Obsolete navigation: ${route}`);
  $('a[href^="/"],link[rel=stylesheet],script[src^="/"]').each((_,node)=>{
    const href=$(node).attr('href')||$(node).attr('src');if(!href||href.startsWith('//')||$(node).closest('.article-body').length)return;
    const url=new URL(href,'http://localhost');let local=decodeURIComponent(url.pathname);if(local.endsWith('/'))local+='index.html';
    assert.ok(fs.existsSync(path.join(output,local)),`Broken internal link in ${route}: ${href}`);
  });
}
const shows=load('bangumis/index.html');assert.equal(shows('[data-show-status]').length,56,'Bangumi records must be preserved');
const albums=load('album/index.html');assert.equal(albums('.album-card').length,5,'Album groups must be preserved');
assert.deepEqual(albums('[data-album-category]').map((_,node)=>albums(node).attr('data-album-category')).get(),['','日常','旅游','游戏','二次元'],'Album filters must match the existing collections');
assert.equal(albums('[data-album-group="二次元"]').length,2,'Anime collections must share one category');
const lifeNavigation=['/album/','/life/','/essay/','/bangumis/'];
for(const route of ['life/index.html','essay/index.html','album/index.html','bangumis/index.html','Game/index.html']){
  const $=load(route);assert.deepEqual($('.life-nav a').map((_,node)=>$(node).attr('href')).get(),lifeNavigation,`Equal-level life navigation: ${route}`);
  assert.equal($('.life-nav [aria-current=page]').length,1,`One active life section: ${route}`);
  const main=$('#main').html();assert.ok(main.indexOf('page-heading')<main.indexOf('life-nav'),`Title must precede section navigation: ${route}`);
}
const life=load('life/index.html');assert.equal(life('.collection-links,.sidebar').length,0,'Life notes should not repeat sibling recommendations or unrelated sidebar content');
const searchIndex=JSON.parse(fs.readFileSync(path.join(output,'search-index.json'),'utf8'));
assert.equal(searchIndex.posts.length,expectedPosts.length,'Search must contain every retained article');
assert.deepEqual(searchIndex.posts.map(post=>post.title).sort(),expectedPosts.map(post=>post.title).sort(),'Search titles must match the content inventory');
for(const post of searchIndex.posts){
  const local=decodeURIComponent(new URL(post.url,'http://localhost').pathname);
  assert.ok(fs.existsSync(path.join(output,local,'index.html')),`Broken search result URL: ${post.url}`);
}
assert.ok(searchIndex.posts.find(post=>post.title==='NSSround#28Team_Web_WP').url.includes('%23'),'Search must encode literal # in article paths');
assert.ok(searchIndex.posts.some(post=>post.text.includes('unserialize')),'Search must include article body text');
const music=load('music/index.html');assert.equal(music('[data-music-page]').attr('data-id'),'12908278323','Original playlist must be retained');
assert.equal(music('.music-aside,.music-links,.sidebar').length,0,'Music must focus on the player');
assert.equal(music('[data-music-page] a[href^="/"]').length,0,'Music content must not promote other sections');
assert.equal(music('script[src*="APlayer"],script[src*="Meting"]').length,0,'Music dependencies should be loaded on demand');
console.log(`PASS: ${expectedPosts.length} preserved articles, ${Object.keys(baseline.hashes).length} unchanged source files, removed test article absent, stable URLs/dates, navigation and internal links, 5 albums, 56 bangumi records, original music playlist.`);
