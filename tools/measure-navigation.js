async (page) => {
 const context=await page.context().browser().newContext({reducedMotion:'reduce'});
 const tab=await context.newPage(),requests=[];const cdp=await context.newCDPSession(tab);await cdp.send('Network.enable');await cdp.send('Network.setBlockedURLs',{urls:['https://*']});tab.on('request',r=>requests.push({url:new URL(r.url()).pathname,type:r.resourceType()}));
 await tab.addInitScript(()=>{window.__documentToken=Math.random();});
 await tab.goto('http://127.0.0.1:4041/');await tab.waitForTimeout(500);
 const assets=await tab.evaluate(()=>performance.getEntriesByType('resource').filter(e=>/\.(?:js|css)(?:\?|$)/.test(e.name)).map(e=>({name:new URL(e.name).pathname,bytes:e.decodedBodySize})));
 const rows=[];
 for(const [href,view] of [['/articles/','articles'],['/','home'],['/album/','album'],['/','home'],['/briefing/','briefing'],['/toolbox/','toolbox'],['/music/','music']]) {
  const token=await tab.evaluate(()=>window.__documentToken),start=requests.length,clock=Date.now();
  await tab.locator('#main-nav a').evaluateAll((links,href)=>links.find(a=>a.getAttribute('href')===href).click(),href);
  await tab.waitForURL('**'+href);await tab.waitForFunction(view=>document.body.dataset.view===view,view);
  rows.push({href,visibleMs:Date.now()-clock,documentReload:await tab.evaluate(old=>window.__documentToken!==old,token),documentRequests:requests.slice(start).filter(r=>r.type==='document').length,htmlRequests:requests.slice(start).filter(r=>r.url===href&&(r.type==='document'||r.type==='fetch')).length});
 }
 const result={assets:{requests:assets.length,jsBytes:assets.filter(x=>x.name.endsWith('.js')).reduce((n,x)=>n+x.bytes,0),cssBytes:assets.filter(x=>x.name.endsWith('.css')).reduce((n,x)=>n+x.bytes,0)},rows};await context.close();return result;
}
