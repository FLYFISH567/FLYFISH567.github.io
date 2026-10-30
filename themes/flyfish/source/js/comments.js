(() => {
  'use strict';
  const origin='https://giscus.app';
  let host,script,observer,loading=false,frameLoaded=false,loadTimer,active=null,navId=0,sent='',generation=0,positionFrame=0;
  const bound=new WeakSet(),currentPanel=()=>document.querySelector('[data-comments]'),frame=()=>host?.querySelector('iframe.giscus-frame');
  const mark=event=>window.FlyfishNavigationDiagnostics?.mark(event,{navId,path:location.pathname,frame:'giscus-iframe'});
  const theme=()=>{const dark=document.documentElement.dataset.theme==='dark',panel=currentPanel();return (dark?panel?.dataset.commentsThemeDark:panel?.dataset.commentsThemeLight)||(dark?'dark':'light');};
  const valid=()=>active?.isConnected&&active===currentPanel();
  function backLink(){const url=new URL(location.href);url.searchParams.delete('giscus');url.hash='';return url.toString();}
  function status(message,retry=false){const panel=currentPanel();if(!panel)return;panel.querySelector('[data-comments-status]').textContent=message;panel.querySelector('[data-comments-retry]').hidden=!retry;}
  // The iframe stays connected to one body-level host. Reserve its space in the current panel.
  function position(){
    positionFrame=0;if(!valid()||!host||host.hidden)return;const mount=active.querySelector('[data-comments-mount]'),rect=mount.getBoundingClientRect(),iframe=frame();
    const height=Math.ceil(iframe?.getBoundingClientRect().height||parseFloat(iframe?.style.height)||150);
    const styles={left:(rect.left+scrollX)+'px',top:(rect.top+scrollY)+'px',width:rect.width+'px'};
    for(const [key,value]of Object.entries(styles))if(host.style[key]!==value)host.style[key]=value;
    if(mount.style.height!==height+'px')mount.style.height=height+'px';
  }
  function schedulePosition(){if(valid()&&host&&!host.hidden&&!positionFrame)positionFrame=requestAnimationFrame(position);}
  const resize='ResizeObserver' in window?new ResizeObserver(schedulePosition):null;
  function configure(){
    if(!frameLoaded||!valid())return;const config={term:active.dataset.commentsTerm||'',backLink:backLink(),theme:theme()},key=JSON.stringify(config);
    if(!config.term)return;if(key!==sent){frame().contentWindow?.postMessage({giscus:{setConfig:config}},origin);sent=key;mark('giscus.config');}
    host.hidden=false;position();status('');
  }
  function fail(preserveFrame=false){clearTimeout(loadTimer);loading=false;if(!frame())script?.remove();if(valid()){if(!preserveFrame){host.hidden=true;active.querySelector('[data-comments-mount]').style.height='';}status('评论暂时无法加载，请稍后重试，或前往 GitHub Discussions。',true);}mark('giscus.error');}
  function watch(){clearTimeout(loadTimer);loadTimer=setTimeout(fail,15000);}
  function bindFrame(){
    const iframe=frame();if(!iframe||bound.has(iframe))return;bound.add(iframe);iframe.loading='eager';iframe.style.cssText+=';display:block;width:100%;border:0;';
    iframe.addEventListener('load',()=>{frameLoaded=true;sent='';mark('giscus.frame-load');configure();schedulePosition();});resize?.observe(host);
  }
  function begin(retry=false){
    if(!valid())return;mark('giscus.activate');
    if(frame()){
      bindFrame();if(retry){
        // Only an explicit retry reloads the document. Preserve existing auth/session parameters.
        const url=new URL(frame().src);url.searchParams.set('term',active.dataset.commentsTerm||'');url.searchParams.set('backLink',backLink());url.searchParams.set('theme',theme());
        frameLoaded=false;sent='';loading=true;host.hidden=true;status('正在重新加载评论…');mark('giscus.retry');watch();frame().src=url.toString();
      }else if(frameLoaded)configure();else if(!loading)fail();else status('正在载入评论…');
      return;
    }
    if(loading){status('正在载入评论…');return;}loading=true;status('正在载入评论…');
    if(!host){host=document.createElement('div');host.id='flyfish-giscus-host';host.className='giscus';host.dataset.commentsHost='';host.hidden=true;host.style.cssText='position:absolute;z-index:1;min-width:0;';document.body.appendChild(host);}
    script=document.createElement('script');script.src=origin+'/client.js';script.async=true;script.crossOrigin='anonymous';
    Object.assign(script.dataset,{repo:'FLYFISH567/FLYFISH567.github.io',repoId:'R_kgDOOvKwMA',category:'Announcements',categoryId:'DIC_kwDOOvKwMM4DJ7Fm',mapping:'specific',term:active.dataset.commentsTerm,strict:'1',reactionsEnabled:'1',emitMetadata:'0',inputPosition:'bottom',theme:theme(),lang:'zh-CN',loading:'eager'});
    const attempt=script;script.onload=()=>{if(script!==attempt)return;bindFrame();if(!frame())fail();};script.onerror=()=>{if(script===attempt)fail();};watch();host.appendChild(script);
  }
  function deactivate(){++generation;active=null;observer?.disconnect();resize?.disconnect();cancelAnimationFrame(positionFrame);positionFrame=0;if(host)host.hidden=true;mark('giscus.hidden');}
  function init(event){
    deactivate();navId=event?.detail?.navId||0;const panel=currentPanel();if(!panel)return;const ticket=generation;
    const activate=()=>{if(ticket!==generation||!panel.isConnected||panel!==currentPanel())return;observer?.disconnect();active=panel;const mount=panel.querySelector('[data-comments-mount]');mount.setAttribute('aria-owns','flyfish-giscus-host');resize?.observe(mount);const content=document.querySelector('[data-page-content]');if(content)resize?.observe(content);if(host)resize?.observe(host);begin();};
    panel.querySelector('[data-comments-retry]').onclick=()=>{if(panel!==currentPanel())return;active=panel;begin(true);};
    if(panel.hasAttribute('data-comments-eager')||new URL(location.href).searchParams.has('giscus')||!('IntersectionObserver' in window)){activate();return;}
    observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))activate();},{rootMargin:'300px'});observer.observe(panel);
  }
  document.addEventListener('flyfish:before-page',deactivate);document.addEventListener('flyfish:page',init);
  window.addEventListener('message',event=>{if(event.origin!==origin||event.source!==frame()?.contentWindow||!event.data?.giscus)return;const data=event.data.giscus;if(data.resizeHeight){clearTimeout(loadTimer);loading=false;schedulePosition();}if(valid()&&data.error&&!data.error.includes('Discussion not found'))fail(true);});
  new MutationObserver(configure).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  window.addEventListener('resize',schedulePosition);document.addEventListener('scroll',schedulePosition,{capture:true,passive:true});document.addEventListener('animationend',schedulePosition,true);document.addEventListener('transitionend',schedulePosition,true);
  init();
})();
