(() => {
  'use strict';
  const root=document.documentElement;
  if(root.dataset.pointerWaterReady)return;
  root.dataset.pointerWaterReady='true';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mouse=matchMedia('(hover:hover) and (pointer:fine)');
  // 留白才参与互动；正文、原生控件、地图、播放器和小鱼继续使用自己的手势。
  const excluded='a,button,input,textarea,select,label,summary,[contenteditable],[role=button],[role=slider],[draggable=true],dialog,.site-header,.site-footer,.opening-screen,.travel-map-canvas,.background-fish,.fish-settings,.music-dock,.reading-panel,.article-body,.post-copy,.post-symbol,.essay-card,.show-card,.note-panel,.now-playing,.player-shell,.aplayer,pre,code';
  const surfaces='html,body,div,section,main,article,aside,header,footer,nav';
  const limit=72;
  let canvas=null,ctx=null,unsupported=false,particles=[],frame=0,lastFrame=0,drag=null,hover=null,lastHover=0,lastTrail=0,pageHidden=false;
  let width=innerWidth,height=innerHeight,blue='',teal='';
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const blocked=()=>unsupported||pageHidden||document.hidden||reduced.matches||root.dataset.effects==='light'||!mouse.matches||root.dataset.opening==='pending'||!!document.querySelector('dialog[open]');
  const selected=()=>{const selection=window.getSelection();return selection&&!selection.isCollapsed;};
  const safe=target=>target instanceof Element&&target.matches(surfaces)&&!target.closest(excluded)&&!Array.from(target.childNodes).some(node=>node.nodeType===3&&node.textContent.trim());
  function colors(){blue=getComputedStyle(root).getPropertyValue('--blue').trim()||'#3976e7';teal=root.dataset.theme==='dark'?'#8dd3cf':'#4d9eae';}
  function clear(resetInput=true){
    cancelAnimationFrame(frame);frame=0;lastFrame=0;particles=[];
    if(resetInput){drag=null;hover=null;}
    if(canvas){ctx?.clearRect(0,0,width,height);canvas.hidden=true;}
  }
  function prepare(){
    if(canvas)return true;
    canvas=document.createElement('canvas');canvas.className='pointer-water';canvas.dataset.pointerPlay='';canvas.setAttribute('aria-hidden','true');canvas.hidden=true;
    try{ctx=canvas.getContext('2d');}catch{}
    if(!ctx){canvas=null;unsupported=true;return false;}
    document.body.append(canvas);resize();return true;
  }
  function resize(){
    clear();width=root.clientWidth||innerWidth;height=innerHeight;
    if(canvas){
      // 限制高分屏像素开销，空闲时不保留动画循环。
      const ratio=Math.min(devicePixelRatio||1,1.5);
      canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
    }
    colors();
  }
  function emit(type,point,angle=0){
    if(!prepare())return;
    if(particles.length>=(root.dataset.effects==='lively'?limit:36))particles.shift();
    particles.push({type,x:point.x,y:point.y,angle,born:performance.now(),life:type==='ring'?850:type==='wake'?760:520,size:type==='wake'?8+Math.random()*3:1.5+Math.random(),color:Math.random()>.65?teal:blue});
    canvas.hidden=false;if(!frame)frame=requestAnimationFrame(draw);
  }
  function draw(now){
    frame=0;if(blocked()){clear();return;}
    particles=particles.filter(particle=>now-particle.born<particle.life);
    if(!particles.length){clear(false);return;}
    frame=requestAnimationFrame(draw);
    if(lastFrame&&now-lastFrame<32)return;lastFrame=now;
    ctx.clearRect(0,0,width,height);
    for(const p of particles){
      const age=clamp((now-p.born)/p.life,0,1),fade=1-age;
      ctx.save();ctx.translate(p.x,p.y);ctx.strokeStyle=p.color;ctx.fillStyle=p.color;ctx.lineWidth=1.2;
      if(p.type==='ring'){
        // 椭圆双波纹和几颗小水滴，颜色随网站主题变化。
        for(let ring=0;ring<2;ring++){
          const progress=clamp((age-ring*.1)/(1-ring*.1),0,1),radius=5+progress*49;
          ctx.globalAlpha=fade*(ring?.34:.58);ctx.beginPath();ctx.ellipse(0,0,radius,radius*.68,0,0,Math.PI*2);ctx.stroke();
        }
        for(let dot=0;dot<5;dot++){
          const angle=dot*Math.PI*2/5-.5,radius=10+age*29;
          ctx.globalAlpha=fade*.48;ctx.beginPath();ctx.arc(Math.cos(angle)*radius,Math.sin(angle)*radius*.68,1.6*(1-age)+.4,0,Math.PI*2);ctx.fill();
        }
      }else if(p.type==='wake'){
        ctx.translate(Math.sin(p.angle)*age*5,-age*7);ctx.rotate(p.angle);
        ctx.globalAlpha=fade*.48;ctx.beginPath();ctx.ellipse(0,0,p.size+age*5,(p.size+age*5)*.42,0,0,Math.PI*2);ctx.stroke();
        ctx.globalAlpha=fade*.22;ctx.beginPath();ctx.arc(-3,0,1.5,0,Math.PI*2);ctx.fill();
      }else{
        ctx.globalAlpha=fade*.35;ctx.beginPath();ctx.arc(Math.sin(age*3)*3,-age*9,p.size*(1-age*.4),0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    }
  }
  document.addEventListener('pointerdown',event=>{
    if(blocked()||event.pointerType!=='mouse'||event.button!==0||event.isPrimary===false||selected()||!safe(event.target))return;
    // 只阻止从留白开始的默认选字，避免拖水波时顺带选中附近标题；正文起手不会进入这里。
    event.preventDefault();
    emit('ring',{x:event.clientX,y:event.clientY});
    drag={id:event.pointerId,origin:{x:event.clientX,y:event.clientY},last:{x:event.clientX,y:event.clientY}};hover=null;lastTrail=0;
  });
  document.addEventListener('pointermove',event=>{
    if(blocked()||event.pointerType!=='mouse')return;
    if(selected()){drag=null;hover=null;return;}
    const point={x:event.clientX,y:event.clientY},now=performance.now();
    if(!safe(event.target)){if(drag)drag.last=null;hover=null;return;}
    if(drag){
      if(event.pointerId!==drag.id)return;
      if(!(event.buttons&1)){drag=null;return;}
      if(!drag.last){drag.last=point;return;}
      const length=distance(point,drag.last);
      if(distance(point,drag.origin)<8||length<15||now-lastTrail<24)return;
      const from=drag.last,steps=Math.min(4,Math.ceil(length/22)),angle=Math.atan2(point.y-from.y,point.x-from.x);
      for(let step=1;step<=steps;step++){
        const p={x:from.x+(point.x-from.x)*step/steps,y:from.y+(point.y-from.y)*step/steps};
        // 大跨度鼠标移动也不会在跨过的卡片和文字上补画尾迹。
        if(safe(document.elementFromPoint(p.x,p.y)))emit('wake',p,angle);
      }
      drag.last=point;lastTrail=now;
    }else if(event.buttons===0&&root.dataset.effects==='lively'){
      if(hover&&distance(point,hover)>=20&&now-lastHover>=100){emit('mote',point);lastHover=now;hover=point;}
      else if(!hover)hover=point;
    }
  },{passive:true});
  const release=event=>{if(drag?.id===event.pointerId)drag=null;hover=null;};
  document.addEventListener('pointerup',release,{passive:true});document.addEventListener('pointercancel',release,{passive:true});
  document.addEventListener('pointerout',event=>{if(!event.relatedTarget){drag=null;hover=null;}},{passive:true});
  document.addEventListener('dragstart',clear,{passive:true});document.addEventListener('selectionchange',()=>{if(selected())clear();});
  document.addEventListener('scroll',clear,{passive:true,capture:true});
  window.addEventListener('blur',clear);window.addEventListener('resize',resize,{passive:true});
  window.addEventListener('pagehide',()=>{pageHidden=true;clear();});window.addEventListener('pageshow',()=>{pageHidden=false;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
  reduced.addEventListener('change',clear);mouse.addEventListener('change',clear);
  document.addEventListener('flyfish:effectschange',clear);document.addEventListener('flyfish:before-page',clear);
  new MutationObserver(()=>{colors();if(blocked())clear();}).observe(root,{attributes:true,attributeFilter:['data-theme','data-opening']});
  for(const dialog of document.querySelectorAll('dialog'))new MutationObserver(()=>{if(dialog.open)clear();}).observe(dialog,{attributes:true,attributeFilter:['open']});
  colors();
})();
