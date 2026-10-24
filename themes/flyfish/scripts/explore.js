'use strict';
const {stripHTML,unescapeHTML,url_for}=require('hexo-util');
const moment=require('moment');
const {travelMap}=require('../lib/travel-map.cjs');
const data=()=>hexo.locals.get('data')||{};
const localUrl=value=>url_for.call(hexo,value,{relative:false}).replaceAll('#','%23').replaceAll('?','%3F');
const dateOf=value=>moment(String(value),['YYYY-M-D','YYYY-MM-DD','YYYY/M/D','YYYY/MM/DD'],true);
const validImage=value=>typeof value==='string'&&/^(https?:\/\/|\/(?!\/))/i.test(value);
// 只判断正文是否为空。短笔记、代码和纯图片笔记仍可被选中。
function hasBody(post){
  const html=String(post.content||'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
  return !!unescapeHTML(stripHTML(html)).replace(/\s/g,'')||/<(?:img|video|audio|iframe)\b[^>]+(?:src|data-src)\s*=/i.test(html);
}
function footprints(){
  const result=[];
  for(const album of data().album||[]){
    if(!/旅游|旅行/.test(album.class_name||''))continue;
    for(const [index,group] of (album.album_list||[]).entries()){
      const images=(group.image||[]).filter(validImage);if(!images.length)continue;
      const parts=String(group.content||album.class_name).split(/[-—·/]/).map(part=>part.trim()).filter(Boolean);
      const time=dateOf(group.date);
      result.push({city:parts.at(-1),region:parts.length>1?parts[0]:'',title:group.content||album.class_name,
        date:time.isValid()?time.format('YYYY.MM.DD'):'',timestamp:time.isValid()?time.valueOf():0,
        count:images.length,coordinates:group.coordinates,image:images.includes(album.cover)?album.cover:images[0],url:localUrl(album.path_name.replace(/\/$/,'')+'/')+'#photo-group-'+index});
    }
  }
  return result.sort((a,b)=>a.timestamp-b.timestamp);
}
hexo.extend.helper.register('ff_now',()=>data().now||{});
hexo.extend.helper.register('ff_footprints',footprints);
// 独立足迹编辑入口：source/_data/footprints.yml；不要求有相册或照片。
hexo.extend.helper.register('ff_travel_map',()=>{
  const entries=(records,status)=>(records||[]).filter(place=>place.name).map(place=>{
    const time=dateOf(place.date);
    const url=typeof place.url==='string'&&/^(https?:\/\/|\/(?!\/))/i.test(place.url)?place.url:undefined;
    return {city:String(place.name),region:String(place.region||''),coordinates:place.coordinates,
      note:String(place.note||''),url,count:0,manual:true,status,
      date:time.isValid()?time.format('YYYY.MM.DD'):'',timestamp:time.isValid()?time.valueOf():0};
  });
  return travelMap([...footprints(),...entries(data().footprints?.places,'visited'),...entries(data().footprints?.wishlist,'planned')]);
});
hexo.extend.generator.register('flyfish-explore-index',()=>{
  const items=[],seen=new Set(),excluded=new Set(hexo.theme.config.explore?.exclude_images||[]);
  for(const post of hexo.locals.get('posts').sort('-date').toArray()){
    if(!hasBody(post))continue;
    items.push({id:'article:'+post.path,kind:'article',title:post.title,url:localUrl(post.path),
      date:moment(post.date).format('YYYY.MM.DD'),label:hexo.extend.helper.get('ff_topic')(post),
      summary:hexo.extend.helper.get('ff_summary')(post)});
  }
  for(const album of data().album||[])for(const [groupIndex,group] of (album.album_list||[]).entries()){
    for(const [imageIndex,image] of (group.image||[]).entries()){
      if(!validImage(image)||excluded.has(image)||seen.has(image))continue;seen.add(image);
      const time=dateOf(group.date);
      items.push({id:'photo:'+image,kind:'photo',title:group.content||album.class_name,label:album.class_name,
        date:time.isValid()?time.format('YYYY.MM.DD'):'',image,
        url:localUrl(album.path_name.replace(/\/$/,'')+'/')+`#photo-${groupIndex}-${imageIndex}`});
    }
  }
  return {path:'explore-index.json',data:JSON.stringify({version:1,items})};
});
