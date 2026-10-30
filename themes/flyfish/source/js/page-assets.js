(() => {
  'use strict';
  const loaded=new Map();
  const key=node=>new URL(node.tagName==='SCRIPT'?node.src:node.href,location.href).href;
  // This deferred bootstrap runs after all modules included by the initial static page.
  document.querySelectorAll('[data-page-asset]').forEach(node=>loaded.set(key(node),Promise.resolve()));
  function load(node){
    const url=new URL(key(node));
    if(url.origin!==location.origin||!/^\/(?:js\/[^/]+\.js|css\/[^/]+\.css)$/.test(url.pathname))return Promise.reject(Error('asset URL'));
    if(loaded.has(url.href))return loaded.get(url.href);
    const promise=new Promise((resolve,reject)=>{
      const asset=document.createElement(node.tagName==='SCRIPT'?'script':'link');
      let timer,settled=false;
      const failed=()=>{if(settled)return;settled=true;clearTimeout(timer);asset.remove();loaded.delete(url.href);reject(Error('asset load'));};
      asset.onload=()=>{if(settled)return;settled=true;clearTimeout(timer);resolve();};asset.onerror=failed;
      if(node.tagName==='SCRIPT'){asset.src=url.href;asset.async=false;}else{asset.rel='stylesheet';asset.href=url.href;}
      asset.dataset.pageAsset='';timer=setTimeout(failed,8000);document.head.append(asset);
    });
    loaded.set(url.href,promise);return promise;
  }
  window.FlyfishPageAssets={async prepare(next){
    await Promise.all([...next.querySelectorAll('link[data-page-asset]')].map(load));
    // Dependencies such as briefing-sources -> briefing and market-data -> markets stay ordered.
    for(const node of next.querySelectorAll('script[data-page-asset]'))await load(node);
  }};
})();
