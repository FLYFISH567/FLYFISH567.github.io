(() => {
  'use strict';
  const reefs=new Set(['1,0','1,1','3,1','1,3','2,3','3,3']);
  const moves={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  function init(){
    const game=document.querySelector('[data-fish-home]');if(!game||game.dataset.ready)return;
    game.dataset.ready='true';game.hidden=false;
    const board=game.querySelector('[data-fish-board]'),status=game.querySelector('[data-fish-status]');
    let x=0,y=0,steps=0,finished=false;
    const fish='<svg viewBox="0 0 48 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M14 16 3 7v18l11-9Zm0 0C21 5 32 5 43 16c-11 11-22 11-29 0Z"/><circle cx="34" cy="13" r="1.5" fill="currentColor" stroke="none"/><path d="m23 10 4 4m-4 8 4-4"/></svg>';
    const home='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="m4 15 12-10 12 10M7 13v13h18V13M13 26v-8h6v8"/></svg>';
    function paint(message){
      const fragment=document.createDocumentFragment();
      for(let row=0;row<5;row++)for(let col=0;col<5;col++){
        const tile=document.createElement('span');tile.className='fish-home-tile';tile.setAttribute('aria-hidden','true');
        if(reefs.has(`${col},${row}`))tile.classList.add('is-reef');
        if(col===4&&row===4){tile.classList.add('is-home');tile.innerHTML=home;}
        if(col===x&&row===y){tile.classList.add('is-fish');tile.innerHTML=fish;}
        fragment.appendChild(tile);
      }
      board.replaceChildren(fragment);
      status.textContent=message||`小鱼在第 ${y+1} 行、第 ${x+1} 列，已游 ${steps} 步。`;
    }
    function move(direction){
      if(finished||!moves[direction])return;const [dx,dy]=moves[direction],nx=x+dx,ny=y+dy;
      if(nx<0||nx>4||ny<0||ny>4){paint('到海面的边缘啦，换个方向试试。');return;}
      if(reefs.has(`${nx},${ny}`)){paint('前面是礁石，换个方向试试。');return;}
      x=nx;y=ny;steps++;if(x===4&&y===4){finished=true;paint(`到家啦！小鱼游了 ${steps} 步。可以重新开始，或回到首页。`);}else paint();
    }
    game.querySelectorAll('[data-fish-move]').forEach(button=>button.addEventListener('click',()=>move(button.dataset.fishMove)));
    board.addEventListener('keydown',event=>{const direction={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[event.key];if(direction){event.preventDefault();move(direction);}});
    game.querySelector('[data-fish-reset]').addEventListener('click',()=>{x=0;y=0;steps=0;finished=false;paint('重新出发！小鱼在第 1 行、第 1 列。');});
    paint();
  }
  init();document.addEventListener('flyfish:page',init);
})();
