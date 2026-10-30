async(page)=>{
 // Manual read-only Playwright CLI regression; run after npm run build. Theme CSS is previewed from public/.
 const context=await page.context().browser().newContext({viewport:{width:1280,height:1000}}),tab=await context.newPage(),results=[];
 await context.route('https://flyfish567.github.io/css/giscus-*.css*',route=>route.fulfill({path:'D:/FLYFISH_NEW_BLOG/public/css/'+new URL(route.request().url()).pathname.split('/').at(-1),contentType:'text/css',headers:{'access-control-allow-origin':'*'}}));
 await context.route('https://giscus.app/**',route=>['GET','HEAD'].includes(route.request().method())?route.continue():route.abort());
 const check=(ok,label)=>{if(!ok)throw Error(label);};
 try{
  await tab.goto('https://flyfish567.github.io/comments/');const f=tab.frameLocator('iframe.giscus-frame');await f.locator('textarea').waitFor({timeout:30000});
  for(const width of [1280,390,320])for(const mode of ['light','dark']){
   await tab.setViewportSize({width,height:1000});
   await tab.evaluate(mode=>{document.documentElement.dataset.theme=mode;},mode);
   await f.locator('.gsc-comment').first().evaluate((el,mode)=>new Promise((resolve,reject)=>{let n=0;const t=setInterval(()=>{if(document.documentElement.style.colorScheme===mode||getComputedStyle(document.documentElement).colorScheme===mode){clearInterval(t);resolve();}else if(++n>200){clearInterval(t);reject(Error('Theme did not apply'));}},25);}),mode);
   const menu=f.locator('.gsc-comment .gsc-reactions-menu').first(),toggle=menu.locator('summary');if(await menu.evaluate(e=>e.open))await toggle.click();await toggle.click();await tab.waitForTimeout(200);
   const state=await menu.evaluate(el=>{const p=el.querySelector('.gsc-reactions-popover'),r=p.getBoundingClientRect(),cs=getComputedStyle(p),buttons=[...p.querySelectorAll('button')],point=e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e===hit||e.contains(hit);};return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,frameWidth:document.documentElement.clientWidth,frameHeight:document.documentElement.clientHeight,opaque:cs.backgroundColor!=='rgba(0, 0, 0, 0)',radius:cs.borderRadius,shadow:cs.boxShadow!=='none',cardOverflow:getComputedStyle(el.closest('.gsc-comment')).overflow,allEightReachable:buttons.length===8&&buttons.every(point),loginReachable:point(p.querySelector('a')),buttonsDisabled:buttons.every(b=>b.disabled),buttonHeight:buttons[0].getBoundingClientRect().height};});
   results.push({width,mode,...state});check(state.allEightReachable&&state.loginReachable,'Popover hit targets clipped: '+width+'/'+mode);check(state.left>=0&&state.right<=state.frameWidth,'Popover exceeds frame: '+width+'/'+mode);check(state.cardOverflow==='visible'&&state.opaque&&state.shadow&&state.radius==='12px','Popover surface style');check(state.buttonsDisabled,'Read-only anonymous check must not enable reaction submission');
   await tab.screenshot({path:'output/playwright/reaction-'+width+'-'+mode+'.png'});
   await toggle.click();check(!await menu.evaluate(e=>e.open),'Toggle close');await toggle.focus();await toggle.press('Space');await tab.waitForTimeout(150);check(await menu.evaluate(e=>e.open),'Keyboard opens picker');await toggle.press('Space');check(!await menu.evaluate(e=>e.open),'Keyboard closes picker');const globalMenu=f.locator('.gsc-reactions .gsc-reactions-menu');await globalMenu.locator('summary').click();await tab.waitForTimeout(150);const globalState=await globalMenu.locator('.gsc-reactions-popover').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=document.documentElement.clientWidth;});check(globalState,'Global picker exceeds frame: '+width+'/'+mode);await globalMenu.locator('summary').click();
  }
  return {results,scope:'Read-only real Giscus with only custom CSS mapped to local build; anonymous reaction buttons remain disabled; no login or reaction/comment write.'};
 }finally{await context.close();}
}
