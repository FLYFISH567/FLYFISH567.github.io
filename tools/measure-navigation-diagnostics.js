async(page)=>{
 const base='http://127.0.0.1:4041',browser=page.context().browser(),rows=[];
 const listing=await (await page.request.get(base+'/articles/')).text(),album=await (await page.request.get(base+'/album/')).text();
 const targets=await page.evaluate(({listing,album})=>{const p=new DOMParser();return {article:p.parseFromString(listing,'text/html').querySelector('.post-copy h2 a').getAttribute('href'),album:p.parseFromString(album,'text/html').querySelector('.album-card').getAttribute('href')};},{listing,album});
 const paths=[['/','/articles/'],['/articles/',targets.article],[targets.article,'/'],['/','/album/'],['/album/',targets.album],[targets.album,'/'],['/','/briefing/'],['/briefing/','/toolbox/'],['/toolbox/','/music/']];
 for(let index=0;index<paths.length;index++)for(let trial=0;trial<5;trial++){
  const context=await browser.newContext({viewport:{width:1280,height:900}}),tab=await context.newPage(),cdp=await context.newCDPSession(tab);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Network.setBlockedURLs',{urls:['https://*']});
  await tab.addInitScript(()=>{sessionStorage.setItem('flyfish-opening-seen','1');try{Object.defineProperty(navigator,'connection',{value:{saveData:true,effectiveType:'4g'}});}catch{}});
  try{
   const [from,to]=paths[index];await tab.goto(base+from);await tab.evaluate(()=>{window.FlyfishNavigationDiagnostics.enable();});
   for(const condition of ['cold','warm']){
    if(condition==='warm'){await tab.evaluate(from=>window.FlyfishNavigator.navigate(from),from);}
    const result=await tab.evaluate(async to=>{
     const d=window.FlyfishNavigationDiagnostics;d.clear();const committed=await window.FlyfishNavigator.navigate(to);if(!committed)throw Error('Navigation failed: '+new URL(to,location.href).pathname);
     await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
     const all=d.records(),start=all.find(x=>x.event==='navigation.start'),records=all.filter(x=>x.navId===start.navId),at=event=>records.find(x=>x.event===event)?.time,delta=(a,b)=>at(a)===undefined||at(b)===undefined?null:at(b)-at(a);
     const source=records.find(x=>x.event==='html.source'),resource=performance.getEntriesByType('resource').filter(x=>new URL(x.name).pathname===new URL(to,location.href).pathname&&x.startTime>=start.time-1).at(-1);
     return {commitMs:delta('navigation.start','navigation.end'),htmlWaitMs:delta('navigation.start','dom.parse.start'),parseMs:delta('dom.parse.start','dom.parse.end'),assetsMs:delta('assets.start','assets.end'),replaceMs:delta('dom.replace.start','dom.replace.end'),syncInitMs:delta('page.init.sync.start','page.init.sync.end'),paintOpportunityMs:records.filter(x=>x.event==='paint.opportunity').at(-1)?.time-start.time,source:source.source,htmlRequests:source.source==='memory'?0:all.filter(x=>x.event==='html.request.start').length,ttfbMs:resource?resource.responseStart-resource.requestStart:null,resourceBytes:resource?resource.transferSize:0,records:all};
    },to);
    rows.push({path:index+1,from:new URL(from,base).pathname,to:new URL(to,base).pathname,trial:trial+1,condition,...result});
   }
  }finally{await context.close();}
 }
 const stats=values=>{const a=values.filter(Number.isFinite).sort((a,b)=>a-b);return a.length?{median:a[Math.floor(a.length/2)],min:a[0],max:a.at(-1)}:null;};
 const summary=paths.flatMap((_,i)=>['cold','warm'].map(condition=>{const a=rows.filter(r=>r.path===i+1&&r.condition===condition);return {path:i+1,from:a[0].from,to:a[0].to,condition,n:a.length,commitMs:stats(a.map(r=>r.commitMs)),assetsMs:stats(a.map(r=>r.assetsMs)),syncInitMs:stats(a.map(r=>r.syncInitMs)),paintOpportunityMs:stats(a.map(r=>r.paintOpportunityMs)),ttfbMs:stats(a.map(r=>r.ttfbMs)),htmlRequests:a.map(r=>r.htmlRequests),sources:a.map(r=>r.source)};}));
 return {method:'Local static build, HTML fixture delay 200ms; 45 separate browser contexts; HTTP cache disabled, speculative fetching suppressed through saveData; cold target not visited in context; warm revisits target in same document after returning to source; no RPC wall time used; rAF is only a paint opportunity proxy. External HTTPS blocked for repeatability; no production data modified.',summary,rows};
}
