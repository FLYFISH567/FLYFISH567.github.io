(() => {
  'use strict';
  const loaded=new Map();
  const key=node=>new URL(node.tagName==='SCRIPT'?node.src:node.href,location.href).href;
  // This deferred bootstrap runs after all modules included by the initial static page.
  document.querySelectorAll('[data-page-asset]').forEach(node=>loaded.set(key(node),Promise.resolve()));
  function load(node,context={},independent=false){
    const url=new URL(key(node));
    const fields={navId:context.navId,asset:url.href,phase:node.tagName==='SCRIPT'?'script':'stylesheet'},mark=(event)=>window.FlyfishNavigationDiagnostics?.mark(event,fields);
    if(url.origin!==location.origin||!/^\/(?:js\/[^/]+\.js|css\/[^/]+\.css)$/.test(url.pathname))return Promise.reject(Error('asset URL'));
    if(loaded.has(url.href)){mark('asset.reuse');return loaded.get(url.href);}
    const promise=new Promise((resolve,reject)=>{
      const asset=document.createElement(node.tagName==='SCRIPT'?'script':'link');
      let timer,settled=false;
      const failed=()=>{if(settled)return;settled=true;clearTimeout(timer);asset.remove();loaded.delete(url.href);mark('asset.error');reject(Error('asset load'));};
      asset.onload=()=>{if(settled)return;settled=true;clearTimeout(timer);mark('asset.end');resolve();};asset.onerror=failed;
      if(node.tagName==='SCRIPT'){asset.src=url.href;asset.async=independent;}else{asset.rel='stylesheet';asset.href=url.href;}
      asset.dataset.pageAsset='';timer=setTimeout(failed,8000);mark('asset.start');document.head.append(asset);
    });
    loaded.set(url.href,promise);return promise;
  }
  window.FlyfishPageAssets={async prepare(next,context={}){
    if(context.signal?.aborted)throw new DOMException('Asset wait cancelled','AbortError');
    const wait=promise=>new Promise((resolve,reject)=>{
      const signal=context.signal,cancel=()=>reject(new DOMException('Asset wait cancelled','AbortError'));
      if(signal?.aborted){cancel();return;}signal?.addEventListener('abort',cancel,{once:true});
      promise.then(resolve,reject).finally(()=>signal?.removeEventListener('abort',cancel));
    });
    const scripts=[...next.querySelectorAll('script[data-page-asset]')],names=scripts.map(node=>new URL(key(node)).pathname);
    const chain=async(nodes,independent=false)=>{for(const node of nodes){if(context.signal?.aborted)throw new DOMException('Asset wait cancelled','AbortError');await wait(load(node,context,independent));}};
    const css=Promise.all([...next.querySelectorAll('link[data-page-asset]')].map(node=>wait(load(node,context))));
    // Only these two audited dependency chains are independent. Unknown script lists stay serial.
    const grouped=names.join('|')==='/js/briefing-sources.js|/js/briefing.js|/js/market-data.js|/js/markets.js';
    await Promise.all([css,grouped?Promise.all([chain(scripts.slice(0,2),true),chain(scripts.slice(2),true)]):chain(scripts)]);
  }};
})();
