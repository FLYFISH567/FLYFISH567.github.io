async(page)=>{
 const base='http://127.0.0.1:4041',context=await page.context().browser().newContext({viewport:{width:1280,height:900}}),tab=await context.newPage(),requests=[],steps=[],checks=[],discussionTerms=new Set(),expectedTerms=new Set();
 await context.route('https://flyfish567.github.io/css/giscus-*.css*',route=>route.fulfill({path:'D:/FLYFISH_NEW_BLOG/public/css/'+new URL(route.request().url()).pathname.split('/').at(-1),contentType:'text/css',headers:{'access-control-allow-origin':'*'}}));
 tab.on('request',r=>{const u=new URL(r.url());if(u.origin==='https://giscus.app'&&u.pathname==='/api/discussions'&&u.searchParams.has('term'))discussionTerms.add(u.searchParams.get('term'));if(r.resourceType()==='document'){requests.push({frame:r.frame()===tab.mainFrame()?'main':'iframe',path:u.pathname,giscus:u.origin==='https://giscus.app'&&u.pathname.includes('/widget')});}});
 await tab.addInitScript(()=>{sessionStorage.setItem('flyfish-opening-seen','1');window.__giscusFrameLoads=0;if(parent!==window){window.__flyfishConfigs=[];window.addEventListener('message',event=>{if(event.data?.giscus?.setConfig)window.__flyfishConfigs.push(JSON.parse(JSON.stringify(event.data.giscus.setConfig)));});}document.addEventListener('load',event=>{if(event.target.matches?.('iframe.giscus-frame'))window.__giscusFrameLoads++;},true);});
 const frame=()=>tab.frameLocator('iframe.giscus-frame');
 const settled=async()=>{await tab.waitForSelector('iframe.giscus-frame',{timeout:25000});await frame().locator('textarea').waitFor({state:'visible',timeout:25000});};
 const record=async(label,fn)=>{const before=requests.length;await fn();await tab.waitForTimeout(350);steps.push({label,mainDocuments:requests.slice(before).filter(r=>r.frame==='main').length,widgetDocuments:requests.slice(before).filter(r=>r.giscus).length});};
 try{
  await tab.goto(base+'/articles/');const articles=await tab.locator('.post-copy h2 a').evaluateAll(a=>a.slice(0,2).map(e=>e.getAttribute('href')));
  await record('first article before scroll',async()=>{await tab.locator('.post-copy h2 a').first().click();await tab.waitForSelector('[data-comments]');});
  await record('first article activation',async()=>{await tab.locator('[data-comments]').scrollIntoViewIfNeeded();await settled();});
  // Isolate the DOM move without any config change; this is a browser-only probe, never a server write.
  await frame().locator('body').evaluate(()=>window.__flyfishFrameProbe='preserved');
  await record('same-parent append probe',async()=>{const loads=await tab.evaluate(()=>window.__giscusFrameLoads);await tab.evaluate(()=>{const h=document.querySelector('.giscus');h.parentNode.appendChild(h);});await tab.waitForFunction(n=>window.__giscusFrameLoads>n,loads);await settled();});
  const appendPreservesContext=await frame().locator('body').evaluate(()=>window.__flyfishFrameProbe==='preserved');
  await frame().locator('body').evaluate(()=>{window.__flyfishStableProbe='same-context';window.__flyfishConfigs=[];});
  for(let trial=1;trial<=5;trial++){
   const target=articles[trial%2];
   await record('article switch before activation '+trial,async()=>{await tab.evaluate(url=>window.FlyfishNavigator.navigate(url),target);await tab.waitForSelector('[data-comments]');});
   await record('article activation '+trial,async()=>{await tab.locator('[data-comments]').scrollIntoViewIfNeeded();await settled();});
   const expected=await tab.locator('[data-comments]').getAttribute('data-comments-term');
   expectedTerms.add(expected);
   const correct=await frame().locator('body').evaluate((body,term)=>window.__flyfishStableProbe==='same-context'&&window.__flyfishConfigs.at(-1)?.term===term,expected);
   if(!correct)throw Error('Article configuration or iframe context changed: '+trial);checks.push('Correct distinct article term and preserved context '+trial);
  }
  await record('return home',async()=>{await tab.evaluate(()=>window.FlyfishNavigator.navigate('/'));if(!await tab.locator('.giscus').evaluate(h=>h.hidden))throw Error('Home must retain a hidden host');});
  await record('guestbook eager',async()=>{await tab.locator('#main-nav a[href="/comments/"]').click();await settled();});
  const config=await tab.locator('[data-comments]').evaluate(panel=>({term:panel.dataset.commentsTerm,backLink:location.origin+location.pathname}));
  expectedTerms.add(config.term);
  await tab.locator('.theme-toggle').click();await tab.waitForFunction(()=>!document.documentElement.classList.contains('theme-transition'));await tab.waitForTimeout(300);
  config.theme=await tab.locator('[data-comments]').evaluate(panel=>document.documentElement.dataset.theme==='dark'?panel.dataset.commentsThemeDark:panel.dataset.commentsThemeLight);
  const boardState=await frame().locator('body').evaluate((body,c)=>{const last=window.__flyfishConfigs.at(-1);return {sameContext:window.__flyfishStableProbe==='same-context',term:last?.term===c.term,backlink:last?.backLink===c.backLink,theme:last?.theme===c.theme,distinct:new Set(window.__flyfishConfigs.map(x=>x.term)).size>=3};},config);
  if(![boardState.sameContext,boardState.term,boardState.backlink,boardState.theme,boardState.distinct].every(Boolean))throw Error('Board configuration: '+JSON.stringify(boardState));checks.push('Guestbook, clean backlink, theme and three distinct terms through postMessage');
  if(![...expectedTerms].every(term=>discussionTerms.has(term)))throw Error('Giscus did not request the distinct expected discussions');checks.push('Actual Giscus discussion API used both article terms and the board term');
  await tab.setViewportSize({width:390,height:844});await tab.locator('[data-comments]').scrollIntoViewIfNeeded();await tab.waitForTimeout(300);
  const aligned=await tab.evaluate(()=>{const a=document.querySelector('[data-comments-mount]').getBoundingClientRect(),b=document.querySelector('.giscus').getBoundingClientRect();return Math.abs(a.left-b.left)<2&&Math.abs(a.top-b.top)<2&&Math.abs(a.width-b.width)<2&&document.documentElement.scrollWidth<=innerWidth;});if(!aligned)throw Error('Persistent host misaligned on mobile');checks.push('390px host aligns with reserved comment space');
  await tab.screenshot({path:'output/playwright/giscus-persistent-mobile.png'});
  await tab.setViewportSize({width:1280,height:900});await tab.evaluate(()=>window.FlyfishNavigator.navigate('/articles/'));
  await tab.locator('.post-copy h2 a').getByText('魔术方法构造和析构',{exact:true}).click();await tab.waitForSelector('[data-comments]');await tab.waitForTimeout(350);
  const longTerm=await tab.locator('[data-comments]').getAttribute('data-comments-term');
  if(!await tab.evaluate(()=>document.querySelector('[data-comments]').getBoundingClientRect().top>innerHeight+300&&document.querySelector('.giscus').hidden))throw Error('An offscreen subsequent article must retain lazy activation');
  if(await frame().locator('body').evaluate((body,term)=>window.__flyfishConfigs.at(-1)?.term===term,longTerm))throw Error('Offscreen article configured too early');
  await tab.locator('[data-comments]').scrollIntoViewIfNeeded();await frame().locator('body').evaluate((body,term)=>new Promise((resolve,reject)=>{const started=Date.now(),id=setInterval(()=>{if(window.__flyfishConfigs.at(-1)?.term===term){clearInterval(id);resolve();}else if(Date.now()-started>5000){clearInterval(id);reject(Error('Lazy article did not activate'));}},20);}),longTerm);await settled();checks.push('An offscreen later article waits for intersection even with an existing iframe');
  return {steps,checks,distinctDiscussions:expectedTerms.size,appendPreservesContext,mainDocuments:requests.filter(r=>r.frame==='main').length,widgetDocuments:requests.filter(r=>r.giscus).length,requestPaths:requests,scope:'Real Giscus loaded read-only, no login or comment. URLs reduced to pathname; session and other query values never returned. Explicit same-parent append probe is intentionally outside application navigation.'};
 }finally{await context.close();}
}
