'use strict';
// Offline geometry and city centers from DataV GeoAtlas. No visitor location is requested.
const geography=require('../data/china.geo.json');
const cities=require('../data/travel-cities.json');
const radians=Math.PI/180;
const mercator=latitude=>Math.log(Math.tan(Math.PI/4+latitude*radians/2))/radians;
const project=([longitude,latitude])=>[20+(longitude-73)*12,20+(mercator(54)-mercator(latitude))*12];
const normalize=value=>String(value||'').replace(/特别行政区|维吾尔自治区|壮族自治区|回族自治区|自治区|自治州|地区|省|市|盟/g,'').trim();
const valid=value=>Array.isArray(value)&&value.length===2&&value.every(Number.isFinite)&&value[0]>=73&&value[0]<=136&&value[1]>=3&&value[1]<=54;
function locate(stop){
  if(valid(stop.coordinates))return stop.coordinates;
  const name=normalize(stop.city),region=normalize(stop.region);
  const candidates=cities.filter(city=>!region||normalize(city.province)===region);
  const exact=candidates.filter(city=>normalize(city.name)===name);
  if(exact.length===1)return exact[0].coordinates;
  const prefix=candidates.filter(city=>name&&normalize(city.name).startsWith(name));
  return prefix.length===1?prefix[0].coordinates:null;
}
function geometryPath(geometry){
  const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;
  return polygons.map(polygon=>polygon.map(ring=>ring.map((point,index)=>{
    const [x,y]=project(point);return `${index?'L':'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join('')+'Z').join('')).join('');
}
const regions=geography.features.map(feature=>({name:feature.properties.name,code:feature.properties.adcode,path:geometryPath(feature.geometry)}));
function travelMap(stops){
  const grouped=new Map();
  for(const record of stops){
    const status=record.status==='planned'?'planned':'visited';
    const stop={...record,status,count:status==='planned'?0:(record.count||0)};
    const key=normalize(stop.region)+':'+normalize(stop.city);
    const previous=grouped.get(key);
    // 已到访的事实优先于心愿；添加了相册后，不会被旧的心愿记录改回“想去”。
    if(previous?.status==='visited'&&status==='planned')continue;
    if(previous?.status==='planned'&&status==='visited'){
      grouped.set(key,{...stop,visits:1,coordinates:locate(stop)});continue;
    }
    if(previous){
      previous.visits++;previous.count+=stop.count||0;
      if(stop.note)previous.note=stop.note;
      if(stop.coordinates&&valid(stop.coordinates))previous.coordinates=stop.coordinates;
      if(stop.timestamp>=previous.timestamp)Object.assign(previous,{url:stop.url||previous.url,date:stop.date,timestamp:stop.timestamp});
    }
    else grouped.set(key,{...stop,visits:1,coordinates:locate(stop)});
  }
  const places=Array.from(grouped.values()).sort((a,b)=>Number(a.status==='planned')-Number(b.status==='planned')||(b.timestamp||0)-(a.timestamp||0)).map((place,index)=>{
    if(!place.coordinates)return {...place,id:index,point:null};
    const [x,y]=project(place.coordinates);
    // The South China Sea inset uses the same projection, scaled and translated.
    const inset=place.coordinates[1]<18;
    return {...place,id:index,point:inset?[Math.round(x*.55+423),Math.round(y*.55+90)]:[Math.round(x),Math.round(y)]};
  });
  return {regions,places};
}
module.exports={travelMap,locate,project};
