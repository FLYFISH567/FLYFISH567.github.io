async(page)=>{
 const base='http://127.0.0.1:4041',context=await page.context().browser().newContext({viewport:{width:1280,height:900}}),tab=await context.newPage(),checks=[];const check=(value,label)=>{if(!value)throw Error(label);checks.push(label);};
 await tab.addInitScript(()=>{sessionStorage.setItem('flyfish-opening-seen','1');try{Object.defineProperty(navigator,'connection',{value:{saveData:true,effectiveType:'4g'}});}catch{}});
 await context.route('https://**',route=>route.abort());
 try{
  await tab.goto(base+'/');await tab.evaluate(()=>window.FlyfishNavigationDiagnostics.enable());
  let started;const slowStarted=new Promise(resolve=>started=resolve);
  await context.route('**/about/?race=slow',async route=>{started();await new Promise(resolve=>setTimeout(resolve,650));try{await route.continue();}catch{}});
  await tab.evaluate(()=>{window.__slowNav=window.FlyfishNavigator.navigate('/about/?race=slow');});await slowStarted;
  check(await tab.evaluate(()=>window.FlyfishNavigator.navigate('/toolbox/?race=fast')),'A second navigation succeeds while the first HTML fetch is in flight');
  check(await tab.evaluate(()=>window.__slowNav)===false,'The genuinely overlapping first request is cancelled');await tab.waitForTimeout(750);check(await tab.evaluate(()=>location.pathname==='/toolbox/'),'Late slow HTML does not replace the winning page');
  await tab.goto(base+'/');await tab.evaluate(()=>{window.FlyfishNavigationDiagnostics.enable();window.__audio=document.querySelector('audio');});
  let assetStarted;const assetPending=new Promise(resolve=>assetStarted=resolve);
  await context.route('**/js/toolbox.js?*',async route=>{assetStarted();await new Promise(resolve=>setTimeout(resolve,900));try{await route.continue();}catch{}});
  await tab.evaluate(()=>{window.__assetNav=window.FlyfishNavigator.navigate('/toolbox/?race=asset');});await assetPending;await tab.waitForTimeout(280);
  check(await tab.evaluate(()=>document.body.dataset.view==='home'&&document.querySelector('[data-page-content]').getAttribute('aria-busy')==='true'),'Pending assets preserve the old content and expose busy state');check(await tab.locator('.navigation-pending').isVisible(),'Delayed navigation feedback is visible');
  check(await tab.evaluate(()=>window.FlyfishNavigator.navigate('/about/?race=asset-winner')),'Another page can supersede an asset wait');check(await tab.evaluate(()=>window.__assetNav)===false,'Superseded asset wait returns false');await tab.waitForTimeout(950);check(await tab.evaluate(()=>document.body.dataset.view==='about'&&document.querySelector('audio')===window.__audio),'Late assets do not overwrite content or audio identity');
  await context.unroute('**/js/toolbox.js?*');
  await tab.goto(base+'/');await tab.evaluate(()=>window.FlyfishNavigationDiagnostics.enable());
  const delays={'/css/markets.css':300,'/js/briefing-sources.js':160,'/js/market-data.js':40,'/js/briefing.js':20,'/js/markets.js':20};
  await context.route('**/*',async route=>{const ms=delays[new URL(route.request().url()).pathname];if(ms)await new Promise(resolve=>setTimeout(resolve,ms));try{await route.continue();}catch{}});
  check(await tab.evaluate(()=>window.FlyfishNavigator.navigate('/briefing/')),'Both delayed dependency groups initialize');
  const records=await tab.evaluate(()=>window.FlyfishNavigationDiagnostics.records());const at=(event,asset)=>records.find(row=>row.event===event&&row.asset===asset)?.time;
  check(at('asset.start','/js/briefing-sources.js')<at('asset.end','/css/markets.css')&&at('asset.start','/js/market-data.js')<at('asset.end','/css/markets.css'),'News and market roots download while CSS is pending');
  check(at('asset.start','/js/briefing.js')>=at('asset.end','/js/briefing-sources.js')&&at('asset.start','/js/markets.js')>=at('asset.end','/js/market-data.js'),'Each consumer begins only after its producer executes');
  check(at('asset.start','/js/markets.js')<at('asset.end','/js/briefing-sources.js'),'Market consumer need not wait for the independent news root');
  await tab.locator('[data-briefing-category="world"]').click();await tab.locator('[data-market-group="us"]').click();check(await tab.locator('[data-market-group="us"]').getAttribute('aria-pressed')==='true','Real grouped modules remain interactive');
  return {checks,controlledDelays:delays,records:records.filter(row=>row.event.startsWith('asset.')),scope:'Timing-only route delays on existing generated resources; no fixture page data, logins, or comments changed.'};
 }finally{await context.close();}
}
