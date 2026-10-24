(() => {
  'use strict';
  let cleanup=()=>{};
  function initialize(){cleanup();
  const map=document.querySelector('[data-travel-map]');
  if(!map)return;
  const lifecycle=new AbortController();
  const links=Array.from(map.querySelectorAll('[data-place]'));
  const svg=map.querySelector('.travel-map'),tools=map.querySelector('[data-map-tools]');
  const zoomIn=map.querySelector('[data-map-zoom="in"]'),zoomOut=map.querySelector('[data-map-zoom="out"]');
  const resetButton=map.querySelector('[data-map-reset]'),scaleLabel=map.querySelector('[data-map-scale]');
  const filters=map.querySelector('[data-map-filters]'),filterButtons=Array.from(map.querySelectorAll('[data-map-filter]'));
  const placeList=map.querySelector('.travel-places'),groups=Array.from(map.querySelectorAll('[data-travel-group]'));
  let hovered=null,focused=null;
  function update(){
    const selected=focused??hovered;
    for(const link of links)link.classList.toggle('is-highlighted',link.dataset.place===selected);
  }
  for(const link of links){
    link.addEventListener('pointerenter',()=>{hovered=link.dataset.place;update();});
    link.addEventListener('pointerleave',()=>{hovered=null;update();});
    link.addEventListener('focus',()=>{focused=link.dataset.place;update();});
    link.addEventListener('blur',()=>{focused=null;update();});
  }
  if(!svg||!tools)return;
  tools.hidden=false;
  const full={x:0,y:0,width:800,height:600},view={...full};
  // 固定档位方便理解当前比例；800% 是视觉放大，不会加载新的市县边界。
  const levels=[1,1.5,2,3,4,6,8];
  let zoom=1,drag=null;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const pins=Array.from(svg.querySelectorAll('.travel-pin')).map(link=>({link,x:Number(link.querySelector('.pin-core').getAttribute('cx')),y:Number(link.querySelector('.pin-core').getAttribute('cy'))}));
  const visiblePins=()=>pins.filter(pin=>!pin.link.hasAttribute('hidden'));
  function positionLabels(){
    // 密集城市的文字换到点的下方或两侧；仅移动名称，真实经纬度和点击区域不变。
    const labels=[],gap=4/zoom,radius=8/zoom;
    const overlaps=(a,b)=>a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
    const shown=visiblePins(),markers=shown.map(pin=>({left:pin.x-radius,right:pin.x+radius,top:pin.y-radius,bottom:pin.y+radius}));
    for(const pin of shown){
      const text=pin.link.querySelector('text'),fontSize=parseFloat(getComputedStyle(text).fontSize)||19/zoom;
      const measured=typeof text.getComputedTextLength==='function'?text.getComputedTextLength():0;
      const width=Math.max(measured,text.textContent.length*fontSize); // 首屏字体尚未就绪时测量可能为 0。
      const candidates=[{x:pin.x,y:pin.y-22/zoom,anchor:'middle'},{x:pin.x,y:pin.y+fontSize*.9+14/zoom,anchor:'middle'},{x:pin.x+17/zoom,y:pin.y+6/zoom,anchor:'start'},{x:pin.x-17/zoom,y:pin.y+6/zoom,anchor:'end'}];
      let chosen=candidates[0],box;
      for(const candidate of candidates){
        const left=candidate.x-(candidate.anchor==='middle'?width/2:candidate.anchor==='end'?width:0);
        const bounds={left,right:left+width,top:candidate.y-fontSize*.9,bottom:candidate.y+fontSize*.25};
        if(bounds.left<view.x||bounds.right>view.x+view.width||bounds.top<view.y||bounds.bottom>view.y+view.height)continue;
        if(labels.some(other=>overlaps(bounds,other))||markers.some(other=>overlaps(bounds,other)))continue;
        chosen=candidate;box=bounds;break;
      }
      text.setAttribute('x',chosen.x);text.setAttribute('y',chosen.y);text.setAttribute('text-anchor',chosen.anchor);
      if(box)labels.push(box);
    }
  }
  function draw(){
    view.x=clamp(view.x,0,full.width-view.width);view.y=clamp(view.y,0,full.height-view.height);
    svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.width} ${view.height}`);
    svg.style.setProperty('--map-zoom',zoom);svg.style.touchAction=zoom>1?'none':'pan-y';
    svg.classList.toggle('is-zoomed',zoom>1);
    scaleLabel.textContent=Math.round(zoom*100)+'%';zoomIn.disabled=zoom>=8;zoomOut.disabled=zoom<=1;resetButton.disabled=zoom===1;
    // 标记和文字保持屏幕上的大小，缩放到县/景点时不会变成巨大的圆。
    positionLabels();
  }
  function magnify(next,anchor=null){
    finishDrag();next=clamp(next,levels[0],levels[levels.length-1]);
    if(next===zoom)return;
    let cx=view.x+view.width/2,cy=view.y+view.height/2;
    const shown=visiblePins();
    if(!anchor&&zoom===1&&next>1&&shown.length){
      const selected=shown.find(pin=>pin.link.dataset.place===(focused??hovered));
      cx=selected?selected.x:shown.reduce((sum,pin)=>sum+pin.x,0)/shown.length;cy=selected?selected.y:shown.reduce((sum,pin)=>sum+pin.y,0)/shown.length;
    }
    zoom=next;view.width=full.width/zoom;view.height=full.height/zoom;
    view.x=anchor?anchor.x-anchor.fx*view.width:cx-view.width/2;view.y=anchor?anchor.y-anchor.fy*view.height:cy-view.height/2;
    draw();
  }
  const nextLevel=direction=>levels[clamp(levels.indexOf(zoom)+direction,0,levels.length-1)];
  function reset(){finishDrag();zoom=1;Object.assign(view,full);draw();}
  if(filters){
    filters.hidden=false;
    for(const button of filterButtons)button.addEventListener('click',()=>{
      const status=button.dataset.mapFilter;if(!['all','visited','planned'].includes(status))return;
      if(button.getAttribute('aria-pressed')==='true')return;
      filterButtons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
      for(const pin of pins){
        const hidden=status!=='all'&&pin.link.dataset.status!==status;
        pin.link.toggleAttribute('hidden',hidden);
        if(hidden)pin.link.setAttribute('aria-hidden','true');else pin.link.removeAttribute('aria-hidden');
      }
      groups.forEach(group=>{group.hidden=status!=='all'&&group.dataset.travelGroup!==status;});
      if(placeList){placeList.scrollTop=0;placeList.setAttribute('aria-label',status==='planned'?'心愿目的地':status==='visited'?'已到访的地点':'已到访与心愿目的地，各按日期排列');}
      hovered=null;focused=null;update();reset(); // 换一类地点时恢复全国视图，避免新标点落在放大视野之外。
    });
  }
  zoomIn.addEventListener('click',()=>magnify(nextLevel(1)));zoomOut.addEventListener('click',()=>magnify(nextLevel(-1)));
  resetButton.addEventListener('click',reset);
  svg.addEventListener('dblclick',event=>{
    if(event.target.closest('.travel-pin')||event.ctrlKey||event.metaKey||event.altKey)return;
    const rect=svg.getBoundingClientRect();if(!rect.width||!rect.height)return;
    event.preventDefault();
    const fx=clamp((event.clientX-rect.left)/rect.width,0,1),fy=clamp((event.clientY-rect.top)/rect.height,0,1);
    magnify(nextLevel(event.shiftKey?-1:1),{x:view.x+fx*view.width,y:view.y+fy*view.height,fx,fy});
  });
  svg.addEventListener('keydown',event=>{
    if(event.target!==svg||event.ctrlKey||event.metaKey||event.altKey)return;
    if(['+','=','-','0','Home'].includes(event.key)){
      event.preventDefault();if(event.key==='0'||event.key==='Home')reset();else magnify(nextLevel(event.key==='-'?-1:1));
    }else if(zoom>1&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
      event.preventDefault();view.x+=event.key==='ArrowLeft'?-view.width*.12:event.key==='ArrowRight'?view.width*.12:0;
      view.y+=event.key==='ArrowUp'?-view.height*.12:event.key==='ArrowDown'?view.height*.12:0;draw();
    }
  });
  function finishDrag(){
    if(!drag)return;const id=drag.id;drag=null;svg.classList.remove('is-dragging');
    try{if(svg.hasPointerCapture(id))svg.releasePointerCapture(id);}catch{}
  }
  svg.addEventListener('pointerdown',event=>{
    if(event.button!==0||event.target.closest('.travel-pin'))return;
    // 鼠标操作不触发 SVG 的浏览器默认焦点框；全国视图仍允许手机上下滑动页面。
    if(event.pointerType!=='touch')event.preventDefault();
    if(zoom<=1||drag)return;
    event.preventDefault();drag={id:event.pointerId,x:event.clientX,y:event.clientY,startX:view.x,startY:view.y};
    try{svg.setPointerCapture(event.pointerId);}catch{drag=null;return;}svg.classList.add('is-dragging');
  });
  svg.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    const rect=svg.getBoundingClientRect();if(!rect.width||!rect.height)return;
    view.x=drag.startX-(event.clientX-drag.x)*view.width/rect.width;view.y=drag.startY-(event.clientY-drag.y)*view.height/rect.height;draw();
  });
  for(const name of ['pointerup','pointercancel','lostpointercapture'])svg.addEventListener(name,event=>{if(drag?.id===event.pointerId)finishDrag();});
  window.addEventListener('blur',finishDrag,{signal:lifecycle.signal});window.addEventListener('pagehide',finishDrag,{signal:lifecycle.signal});window.addEventListener('resize',()=>{finishDrag();draw();},{signal:lifecycle.signal});
  cleanup=()=>{finishDrag();lifecycle.abort();};
  draw();
  }
  document.addEventListener('flyfish:before-page',()=>cleanup());
  document.addEventListener('flyfish:page',initialize);
  initialize();
})();
