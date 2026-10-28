(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FlyfishMarketData=api;})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  const GROUPS=[['cn','中国内地','A 股'],['hk','中国香港','港股'],['us','美国','美股'],['jp','日本','日股'],['kr','韩国','韩股'],['gold','黄金','贵金属']].map(([id,name,short])=>({id,name,short}));
  const instrument=(id,name,group,provider,code,description,unit='点',zone='Asia/Shanghai')=>({id,name,group,provider,code,description,unit,zone});
  const MARKETS=[
    instrument('sse','上证指数','cn','tencent','sh000001','上海市场综合表现'),
    instrument('szse','深证成指','cn','tencent','sz399001','深圳市场代表性股票'),
    instrument('csi300','沪深300','cn','tencent','sh000300','沪深市场大盘股'),
    instrument('csi500','中证500','cn','tencent','sh000905','沪深市场中盘股'),
    instrument('csi1000','中证1000','cn','tencent','sh000852','沪深市场小盘股'),
    instrument('a500','中证A500','cn','tencent','sh000510','跨行业 A 股代表'),
    instrument('chinext','创业板指','cn','tencent','sz399006','创业板代表性股票'),
    instrument('star50','科创50','cn','tencent','sh000688','科创板代表性股票'),
    instrument('bse50','北证50','cn','tencent','bj899050','北京证券交易所代表'),
    instrument('hsi','恒生指数','hk','tencent','hkHSI','香港市场大盘代表'),
    instrument('hstech','恒生科技','hk','tencent','hkHSTECH','香港上市科技企业'),
    instrument('hscei','恒生国企','hk','tencent','hkHSCEI','在港上市的内地企业'),
    instrument('nasdaq','纳斯达克综合','us','tencent','usIXIC','纳斯达克市场综合表现','点','America/New_York'),
    instrument('nasdaq100','纳斯达克100','us','tencent','usNDX','纳斯达克大型非金融股','点','America/New_York'),
    instrument('sp500','标普500','us','tencent','usINX','美国大盘股代表','点','America/New_York'),
    instrument('dow','道琼斯','us','tencent','usDJI','美国大型蓝筹股','点','America/New_York'),
    instrument('nikkei','日经225','jp','wscn','JP225.OTC','日本市场代表性指数','点','Asia/Tokyo'),
    instrument('kospi','韩国综合 KOSPI','kr','wscn','KOSPI.OTC','韩国主要市场综合表现','点','Asia/Seoul'),
    instrument('gold','国际现货黄金','gold','wscn','XAUUSD.OTC','国际现货金价','美元/盎司'),
    instrument('shgold','上海金 Au99.99','gold','wscn','AU9999.SGE','上海黄金交易所现货','元/克')
  ];
  const DEFAULTS=['csi300','star50','hstech','nasdaq','sp500','nikkei','kospi','gold'];
  const ALIASES={'SSE:000001':'sse','SZSE:399001':'szse','SZSE:399006':'chinext','SSE:000300':'csi300','FOREXCOM:NSXUSD':'nasdaq100','NASDAQ:IXIC':'nasdaq','NASDAQ:NDX':'nasdaq100','FOREXCOM:SPXUSD':'sp500','SP:SPX':'sp500','FOREXCOM:DJI':'dow','OANDA:XAUUSD':'gold'};
  const byId=id=>MARKETS.find(m=>m.id===id);
  function selection(values){return [...new Set((Array.isArray(values)?values:[]).map(id=>ALIASES[id]||id).filter(id=>byId(id)))];}
  function parts(time,zone){return Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(time)).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));}
  // 腾讯美股时间为美东本地时间。通过 IANA 时区换算，兼容夏令时，不硬编码 UTC-4。
  function localTime(value,zone){
    const compact=String(value).trim(),match=compact.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/)||compact.match(/^(\d{4})[-/](\d{2})[-/](\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
    if(!match)return '';const [y,mo,d,h,mi,se]=match.slice(1).map(Number),wall=Date.UTC(y,mo-1,d,h,mi,se);let candidate=wall;
    for(let i=0;i<4;i++){const p=parts(candidate,zone),represented=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second),next=wall-(represented-candidate);if(next===candidate)break;candidate=next;}
    const p=parts(candidate,zone);return [+p.year,+p.month,+p.day,+p.hour,+p.minute,+p.second].every((v,i)=>v===[y,mo,d,h,mi,se][i])?new Date(candidate).toISOString():'';
  }
  function valid(quote){return quote&&byId(quote.id)&&typeof quote.price==='number'&&Number.isFinite(quote.price)&&quote.price>0&&typeof quote.change==='number'&&Number.isFinite(quote.change)&&typeof quote.percent==='number'&&Number.isFinite(quote.percent)&&Number.isFinite(Date.parse(quote.quotedAt));}
  function parseTencent(body){
    const quotes={};for(const match of String(body).matchAll(/(?:^|\n)\s*v_([a-zA-Z0-9_]+)="([^"\r\n]*)"\s*;?/g)){
      const market=MARKETS.find(m=>m.provider==='tencent'&&m.code===match[1]);if(!market)continue;const fields=match[2].split('~');
      if(fields.length<33||[fields[3],fields[31],fields[32]].some(v=>!/^[-+]?\d+(?:\.\d+)?$/.test(v||'')))continue;
      const quote={id:market.id,price:Number(fields[3]),change:Number(fields[31]),percent:Number(fields[32]),quotedAt:localTime(fields[30],market.zone)};
      if(valid(quote))quotes[quote.id]=quote;
    }return quotes;
  }
  function parseWscn(body){
    const json=typeof body==='string'?JSON.parse(body):body;if(json.code!==20000||!Array.isArray(json.data?.fields)||!json.data.snapshot)throw Error('行情格式变化');
    const fields=json.data.fields,quotes={};for(const market of MARKETS.filter(m=>m.provider==='wscn')){const row=json.data.snapshot[market.code];if(!Array.isArray(row))continue;const get=key=>row[fields.indexOf(key)],stamp=get('update_time');if(typeof stamp!=='number'||!Number.isFinite(stamp)||stamp<=0)continue;
      const quote={id:market.id,price:get('last_px'),change:get('px_change'),percent:get('px_change_rate'),quotedAt:new Date(stamp*1000).toISOString()};if(valid(quote))quotes[quote.id]=quote;
    }return quotes;
  }
  function requestURL(provider,ids){const items=selection(ids).map(byId).filter(m=>m.provider===provider);if(!items.length)return '';if(provider==='tencent')return 'https://qt.gtimg.cn/q='+items.map(m=>m.code).join(',');if(provider==='wscn')return 'https://api-ddc-wscn.awtmt.com/market/real?prod_code='+items.map(m=>m.code).join(',')+'&fields=prod_name,last_px,px_change,px_change_rate,update_time';return '';}
  function cleanSnapshot(data){const quotes={};if(data?.version!==1||!data.quotes)return {version:1,quotes};for(const [id,value] of Object.entries(data.quotes))if(value?.id===id&&valid(value))quotes[id]={id,price:value.price,change:value.change,percent:value.percent,quotedAt:new Date(value.quotedAt).toISOString()};return {version:1,quotes,fetchedAt:Number.isFinite(Date.parse(data.fetchedAt))?new Date(data.fetchedAt).toISOString():''};}
  function quoteTime(value,now=Date.now()){const p=parts(value,'Asia/Shanghai'),today=parts(now,'Asia/Shanghai'),same=p.year===today.year&&p.month===today.month&&p.day===today.day;return (same?'今日':p.month+'/'+p.day)+' '+p.hour+':'+p.minute;}
  return {GROUPS,MARKETS,DEFAULTS,selection,byId,localTime,valid,parseTencent,parseWscn,requestURL,cleanSnapshot,quoteTime};
});
