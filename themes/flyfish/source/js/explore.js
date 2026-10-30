(() => {
  'use strict';
  const dialog=document.querySelector('#site-explore');
  if(!dialog||typeof dialog.showModal!=='function')return;
  const modes=Array.from(dialog.querySelectorAll('[data-explore-kind]'));
  const status=dialog.querySelector('[data-explore-status]'),preview=dialog.querySelector('[data-explore-preview]');
  const photo=dialog.querySelector('[data-explore-photo]'),image=photo.querySelector('img'),imageError=dialog.querySelector('[data-explore-image-error]');
  const go=dialog.querySelector('[data-explore-go]'),next=dialog.querySelector('[data-explore-next]');
  const key='flyfish-explore-recent';
  let catalog=null,pending=null,kind='all',opener=null,request=0,photoRequest=0,probe=null,imageTimer=0;
  const ideas=[
    {id:'idea:music',title:'给此刻选一首歌',summary:'打开音乐馆，挑一首想听的旋律。',url:dialog.dataset.musicUrl,action:'去音乐馆'},
    {id:'idea:anime',title:'看看故事清单',summary:'从追番列表里挑一部感兴趣的故事。',url:dialog.dataset.bangumiUrl,action:'去看追番'},
    {id:'idea:sky',title:'抬头看看天空',summary:'花一分钟看看窗外，留意云和光的颜色。'},
    {id:'idea:write',title:'记下一件小事',summary:'写一句今天遇到的有趣瞬间，长短都可以。'},
    {id:'idea:stretch',title:'站起来伸个懒腰',summary:'离开座位活动一下肩颈，给自己一点休息时间。'},
    {id:'idea:curiosity',title:'给好奇心十分钟',summary:'选一个刚刚想到的问题，花十分钟探索它。'},
    {id:'idea:water',title:'喝杯水，慢一会儿',summary:'放下手里的事，给自己倒一杯水。'},
    {id:'idea:photo',title:'收藏一片光',summary:'用相机记录身边的一束光或一个喜欢的角落。'}
  ];
  // 每组只追加新条目，保留顺序，让已存储的灵感 ID 在更新后仍然稳定。
  const ideaGroups=[
    {id:'notice',label:'身边观察',items:[
      ['寻找今天的主色','看看周围，挑一种出现最多的颜色，给今天起一个颜色名字。'],
      ['替云朵起名字','找一片云，想象它是什么，再给它取一个奇怪的名字。没有云就看看树影。'],
      ['发现三个圆','在不用离开座位的范围里，找出三个圆形的东西。'],
      ['一分钟的声音地图','安静听一分钟，把听到的声音按远近排个队。'],
      ['找一处小小对称','观察一扇窗、一片叶子或一个杯子，找找它哪里对称、哪里又不一样。'],
      ['给影子拍张肖像','看看手边的影子，选一个最像小动物的，拍下来或画下来。'],
      ['给熟悉的路换个镜头','回想每天走的那段路，挑一个平时很少留意的细节，下次路过时看看。'],
      ['寻找最小的风景','只看一小块地方：杯沿、书角或窗台，把它当成一幅风景。'],
      ['看看光停在哪里','找一处被光照亮的表面，看看它和阴影交界的地方。'],
      ['观察一片叶子的纹路','挑一片能看到的叶子，用目光沿着它的叶脉走一遍。'],
      ['寻找安静的字','看看身边的包装、书脊或路牌，选一个你觉得好看的字。'],
      ['把房间当成第一次来','想象自己是第一次走进这里的人，会先注意到什么？'],
      ['找一件有岁月痕迹的东西','看看旧书、磨亮的杯柄或桌边的划痕，猜猜这些痕迹从哪里来。'],
      ['收集三种不同的蓝','从身边或相册里找三种蓝色，给它们各取一个名字。'],
      ['看看今天的天气细节','不只说晴天或下雨，试着用一句话形容光、风或空气的感觉。']
    ]},
    {id:'make',label:'随手创作',items:[
      ['用五笔画一条鱼','不用画得像，五笔之内让一条属于你的小鱼出现。'],
      ['画一张心情天气图','用太阳、云、雨或自己发明的符号，画出此刻的心情。'],
      ['给杯子设计一个角色','把手边的杯子想象成人物：它叫什么，平时做什么？'],
      ['画一张口袋地图','凭记忆画出从门口到常去地方的路线，歪歪扭扭也可以。'],
      ['给今天做一张小海报','写下日期、三个词和一个小图案，就算完成。'],
      ['设计一家不存在的小店','它卖什么、叫什么名字？给它写一句招牌上的话。'],
      ['给书签画个表情','找张闲置纸片，画一个表情，夹进下一次想翻开的书里。'],
      ['把一个字画成画','选一个喜欢的字，让它的笔画长出翅膀、树枝或小尾巴。'],
      ['给房间起个电影名','如果这里是一部电影的场景，它的片名会是什么？'],
      ['设计一枚今天的徽章','用一句短句加一个简单图案，做一枚只属于今天的徽章。'],
      ['画三格无字漫画','只用三个小画面，讲一件刚刚发生的小事。'],
      ['给桌面画一个小邻居','画一只住在键盘旁或书堆里的小生物，想想它靠什么生活。'],
      ['写一张虚构的明信片','从月球、海底或十年后的城市寄一张明信片，写两句话。'],
      ['用三个形状拼一张脸','圆、三角、方块任选三个，看看会拼出什么表情。'],
      ['给普通物件换个用途','挑一个身边的物件，为它想三个离奇又无害的新用途。']
    ]},
    {id:'sound',label:'音乐与声音',items:[
      ['听听一首歌的开头','选一首熟悉的歌，只留意前二十秒，看看之前漏听了什么。'],
      ['给雨天准备一首歌','想一首适合下雨时听的歌，把歌名记进自己的小清单。'],
      ['给出门准备一段配乐','如果下一次出门有背景音乐，你希望是哪一首？'],
      ['找出歌曲里的一件乐器','听一小段音乐，挑一种声音跟着听，不用急着认出它。'],
      ['给傍晚挑一首歌','选一首像日落颜色的歌，想想它为什么适合傍晚。'],
      ['听一次不熟悉的风格','从平时很少听的音乐里挑一首，听完再决定喜不喜欢。'],
      ['给歌单起个怪名字','用一种天气加一种食物，给一个想象中的歌单命名。'],
      ['想起第一首循环的歌','回忆最早让你反复播放的那首歌，以及当时在哪里听它。'],
      ['只听一段前奏猜歌','在自己的歌单里随机播放，看看几秒钟能猜出歌名。'],
      ['给一张照片配乐','从相册挑一张照片，想一首适合与它同时出现的歌。'],
      ['试着分辨左右声道','在音量舒适的情况下听一小段音乐，留意两边有没有不同的细节。'],
      ['给今天的片尾选歌','假如今天是一集故事，片尾响起什么旋律比较合适？'],
      ['找一首适合慢慢走的歌','选一首节奏舒服的歌，下次散步时可以听。'],
      ['用文字记录一个声音','把刚刚听到的声音写出来，像“沙沙”那样，也可以自创拟声词。'],
      ['让一段旋律变成颜色','听一小段音乐，选三种最能代表它的颜色。']
    ]},
    {id:'words',label:'文字与故事',items:[
      ['写一个只有十个字的故事','给自己十个字，试着让里面出现一点意外。'],
      ['给今天写一个章节名','把今天当成一本书中的一章，用一句短标题概括它。'],
      ['把一句话改成童话开头','从“今天出门买东西”开始，把它改写成一个童话的第一句。'],
      ['打开一本书的任意一页','从手边的书里读一小段，选一个让你停留的词。'],
      ['给未来的自己留一句话','写一句明天或下周看到时，可能会让自己微笑的话。'],
      ['替路边的小猫编个身份','想象一只小猫其实有一份秘密工作，它每天在忙什么？'],
      ['给一段对白补一句','回想喜欢的故事里的一场对话，如果你在场，会说什么？'],
      ['写一封不会寄出的感谢信','只写两三句，想想某个人曾经帮过你的一件小事。'],
      ['收藏一个喜欢的书名','从读过或想读的书里选一个书名，说说它为什么吸引你。'],
      ['用气味描述一个地方','不提地名，试着用气味写出一个你熟悉的地方。'],
      ['写一个小小反转','先写“我以为……”，再写“原来……”，看看会冒出什么故事。'],
      ['给故事里的配角放一天假','选一个喜欢的配角，想象没有主线任务时，他会怎么过一天。'],
      ['用三个词介绍一本书','不讲完整剧情，只挑三个词，让别人猜猜你说的是哪本书。'],
      ['把日常写成侦探小说','选一件小事，例如找不到钥匙，用侦探小说的口吻写两句。'],
      ['给结尾留一扇门','想一个“故事结束之后又发生了什么”的场景，写一句续篇开头。']
    ]},
    {id:'curious',label:'好奇十分钟',items:[
      ['查查一个词的来历','选一个经常说却不知道来源的词，找找它最初是什么意思。'],
      ['给一个问题拆三层','挑一个好奇的问题，连续追问三次“为什么”，看看问题会走到哪里。'],
      ['认一个陌生的字','翻一页书或看看身边文字，找一个不熟悉的字，查查读音和意思。'],
      ['看看常用工具的一个新功能','选一个每天在用的软件，只探索一个没试过的小功能。'],
      ['找一张陌生城市的地图','看看它的河流、公园和街道形状，选一处想去散步的地方。'],
      ['给知识做一次比喻','选一个最近学到的概念，用生活里的东西打个比方。'],
      ['回头看看过去的疑问','翻翻旧笔记，看看有没有一个当时没弄懂、现在可以再试试的问题。'],
      ['猜猜物件是怎么做出来的','选一个日用品，先猜制作过程，有兴趣再找资料核对。'],
      ['认识一种没见过的植物','找一种名字陌生的植物，看看它的样子和名字是否相配。'],
      ['学一句另一种语言的问候','选一种感兴趣的语言，学会一句问候，记下适合使用的场合。'],
      ['解释给十岁的自己听','选一个现在懂的知识，试着用三句话讲给小时候的自己。'],
      ['看看键盘上不常用的键','挑一个很少按的键，查查它在你常用软件里能做什么。'],
      ['给搜索词换个说法','把一个一直没查明白的问题，改成三个不同的搜索问句。'],
      ['找出一个生活中的模式','看看瓷砖、日历或歌曲节拍，找找里面重复出现的规律。'],
      ['留一个明天再想的问题','记下一个小小的好奇，不急着找答案，让它陪你待一会儿。']
    ]},
    {id:'daily',label:'生活小事',items:[
      ['给桌面留一小块空白','只收拾手掌大小的一块地方，让视线有一个可以休息的角落。'],
      ['擦亮一件常用的小东西','花一分钟擦擦眼镜盒、鼠标或桌边的小摆件，看看有没有变顺眼。'],
      ['换一张让你舒服的壁纸','从自己喜欢的照片里挑一张，试试今天的屏幕适合什么风景。'],
      ['把明天要用的东西放一起','挑两三件明天会用到的小物件，给它们安排一个不容易忘的位置。'],
      ['为下一顿饭挑一个颜色','想想下一顿想吃什么颜色的食物，给餐桌添一点小期待。'],
      ['给常用文件起个清楚的名字','只改一个名字，让下次找它时能一眼认出来。'],
      ['整理五张截图','从最近的截图里挑五张，把有用的收好，把用完的删掉。'],
      ['准备一个小小的出门包','看看纸巾、钥匙和耳机在哪里，下次出门少找一会儿。'],
      ['选一个今天想慢慢做的动作','吃一口饭、翻一页书或走一小段路，挑一个动作稍微放慢一点。'],
      ['给植物或摆件换个位置','如果方便，给桌边的小物件换个角度，看看熟悉的地方有什么变化。'],
      ['给休息起一个名字','把下一次短暂休息叫作“云朵时间”或别的名字，留一点轻松的仪式感。'],
      ['记住一个好吃的小细节','回想最近吃到的食物，是哪一种口感或香气让你喜欢？'],
      ['给周末留一件小期待','不用安排满，只选一件想做的小事，写在能看见的地方。'],
      ['为喜欢的东西留个位置','给一张票根、一片书签或一件小收藏找个合适的位置。'],
      ['把待办写得更轻一点','选一件拖着的小事，只写它最容易开始的第一步，今天想做再做。']
    ]},
    {id:'memory',label:'记忆漫游',items:[
      ['翻到一年前的照片','看看相册里差不多一年前的一天，当时的你正在做什么？'],
      ['想起一个小时候的游戏','回忆它的规则，看看现在还记得多少，有没有自己发明的玩法。'],
      ['给老朋友拟一句开场白','想一个很久没联系的人，写一句自然的问候；发不发送都可以。'],
      ['回想一次意外的好天气','有没有哪天的阳光、晚风或雨后空气，到现在还记得？'],
      ['给一个旧物讲三句话','它从哪里来、陪你去过哪里、为什么现在还留着？'],
      ['挑一张不完美的照片','找一张模糊、歪掉或表情奇怪的照片，想想它留下了什么。'],
      ['想起一段放学路','回忆曾经常走的一段路，沿途有哪些小店、声音或气味？'],
      ['记下一句被温柔对待的话','想想别人曾说过的、让你觉得被理解的一句话，用自己的话记下来。'],
      ['给一段旅行挑一个瞬间','不用选景点，想一个在路上吃东西、等车或发呆的小片段。'],
      ['想一顿让你记得的饭','谁和你一起吃？桌上有什么？最先想起的会是哪一个细节？'],
      ['看看第一次留下的记录','找找第一篇笔记、第一张照片或第一个作品，看看自己从哪里开始。'],
      ['回想一个改变口味的瞬间','有没有一本书、一首歌或一种食物，是后来才慢慢喜欢上的？'],
      ['为家乡选一个声音','如果只能用一个声音代表家乡，你会选什么？'],
      ['给某个季节留一张记忆卡','选一个季节，写下与它有关的一种颜色、一种气味和一件小事。'],
      ['想起最近的一次笑场','是什么让你突然笑了？试着把那个瞬间用一句话讲出来。']
    ]},
    {id:'play',label:'脑洞小游戏',items:[
      ['给三个物件编个共同故事','随手选三个看得见的东西，让它们在同一个故事里碰面。'],
      ['做一次字母寻宝','从周围的文字里找出 A、B、C，或者挑三个自己喜欢的字母。'],
      ['猜猜一分钟有多长','不看钟，在心里估计一分钟，结束后再看看实际过去了多久。'],
      ['给物件配一段台词','如果你的键盘、椅子或耳机突然会说话，第一句会是什么？'],
      ['想一场离奇的比赛','设计一个没有危险的奇怪项目，例如纸团滑行或书签叠高，给它起名字。'],
      ['用反义词造一个地方','想象一座“安静的闹市”或“温暖的雪山”，它会是什么样子？'],
      ['三十秒颜色接龙','选一种颜色，尽量多想几个带这种颜色的东西，想到哪算哪。'],
      ['给外星人解释一把伞','不能用“下雨”和“挡水”，试试还能怎样描述它的用途。'],
      ['选一种今天的超能力','只能用于生活小事，例如永远找得到袜子，你想要哪一种？'],
      ['给房间里的物件排个班','假如它们晚上会开会，谁主持、谁迟到、谁负责带零食？'],
      ['把两个词拼成新发明','随意选两个名词，例如“月亮”和“邮筒”，想象拼在一起会有什么功能。'],
      ['找一条藏起来的鱼','看看云、木纹或地砖纹路里，有没有像小鱼的轮廓。'],
      ['凭记忆画一个常用图标','先不打开软件，画出它的图标，再看看你记对了哪些细节。'],
      ['给今天设定一个隐藏成就','例如发现三种鸟叫或看见一朵特别的云，轻轻松松地等待触发。'],
      ['让一个普通数字变有趣','选一个眼前的数字，为它想一个故事：门牌、车次还是宇宙坐标？']
    ]}
  ];
  ideas.push(...ideaGroups.flatMap(group=>group.items.map(([title,summary],index)=>({id:`idea:${group.id}:${index+1}`,title,summary,label:group.label}))));
  const ideaKey='flyfish-explore-ideas',ideaIds=new Set(ideas.map(item=>item.id));
  let seenIdeas=[];
  try{const value=JSON.parse(sessionStorage.getItem(ideaKey)||'[]');if(Array.isArray(value))seenIdeas=[...new Set(value.filter(id=>ideaIds.has(id)))];}catch{}
  let recent=[];
  try{const value=JSON.parse(sessionStorage.getItem(key)||'[]');if(Array.isArray(value))recent=value.filter(id=>typeof id==='string').slice(-12);}catch{}
  function stopImage(){
    ++photoRequest;clearTimeout(imageTimer);if(probe){probe.onload=null;probe.onerror=null;probe=null;}
  }
  function safeEntry(entry){
    if(!entry||!['article','photo'].includes(entry.kind)||typeof entry.id!=='string'||typeof entry.title!=='string'||typeof entry.url!=='string'||(entry.kind==='photo'&&typeof entry.image!=='string'))return false;
    try{
      const url=new URL(entry.url,location.href);
      if(url.origin!==location.origin||!['http:','https:'].includes(url.protocol))return false;
      if(entry.kind==='photo'&&!['http:','https:'].includes(new URL(entry.image,location.href).protocol))return false;
      return true;
    }catch{return false;}
  }
  async function load(){
    if(catalog)return catalog;
    if(!pending){
      const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
      pending=fetch(dialog.dataset.exploreIndex,{signal:controller.signal,cache:'no-cache'}).then(response=>{if(!response.ok)throw Error('index');return response.json();}).then(data=>{
        if(!Array.isArray(data.items))throw Error('index');catalog=data.items.filter(safeEntry);return catalog;
      }).catch(error=>{pending=null;throw error;}).finally(()=>clearTimeout(timeout));
    }
    return pending;
  }
  function pick(items){
    const eligible=items.filter(item=>{
      if(kind!=='all'&&item.kind!==kind)return false;
      const url=new URL(item.url,location.href);
      return item.kind==='article'?url.pathname!==location.pathname:url.pathname+url.hash!==location.pathname+location.hash;
    });
    const last=recent.at(-1);
    let options=eligible.filter(item=>!recent.includes(item.id));
    if(!options.length)options=eligible.filter(item=>item.id!==last);
    if(!options.length)options=eligible;
    if(!options.length)return null;
    if(kind==='all'){
      const groups=['article','photo'].map(type=>options.filter(item=>item.kind===type)).filter(group=>group.length);
      options=groups[Math.floor(Math.random()*groups.length)];
    }
    return options[Math.floor(Math.random()*options.length)];
  }
  function show(entry){
    stopImage();preview.hidden=false;preview.dataset.kind=entry.kind;go.hidden=false;go.href=entry.url;
    dialog.querySelector('[data-explore-label]').textContent=(entry.kind==='article'?'一篇笔记':'一张照片')+' / '+(entry.label||'');
    dialog.querySelector('[data-explore-heading]').textContent=entry.title;
    dialog.querySelector('[data-explore-summary]').textContent=entry.kind==='article'?(entry.summary||''):'';
    const time=dialog.querySelector('[data-explore-date]');time.textContent=entry.date||'';time.dateTime=(entry.date||'').replaceAll('.','-');
    go.textContent=entry.kind==='article'?'读这篇':'去相册看看';photo.hidden=entry.kind!=='photo';
    status.textContent=entry.kind==='article'?'翻到一篇笔记。':'翻到一张照片。';
    if(entry.kind==='photo'){
      const ticket=++photoRequest;image.hidden=true;imageError.hidden=true;photo.classList.add('is-loading');
      const failed=()=>{if(ticket!==photoRequest||!dialog.open)return;++photoRequest;clearTimeout(imageTimer);if(probe){probe.onload=probe.onerror=null;probe=null;}photo.classList.remove('is-loading');imageError.hidden=false;};
      probe=new Image();probe.onload=()=>{
        if(ticket!==photoRequest||!dialog.open)return;
        clearTimeout(imageTimer);image.src=entry.image;image.alt=entry.title+' · '+(entry.label||'相册');image.hidden=false;imageError.hidden=true;photo.classList.remove('is-loading');if(probe){probe.onload=probe.onerror=null;probe=null;}
      };
      probe.onerror=failed;imageTimer=setTimeout(failed,10000);probe.src=entry.image;
    }
  }
  function showIdea() {
    let options=ideas.filter(item=>!seenIdeas.includes(item.id));
    if(!options.length){const last=seenIdeas.at(-1);seenIdeas=[];options=ideas.filter(item=>item.id!==last);}
    const item=options[Math.floor(Math.random()*options.length)];
    seenIdeas.push(item.id);
    try{sessionStorage.setItem(ideaKey,JSON.stringify(seenIdeas));}catch{}
    recent=[...recent.filter(id=>id!==item.id),item.id].slice(-12);
    try{sessionStorage.setItem(key,JSON.stringify(recent));}catch{}
    stopImage();preview.hidden=false;preview.dataset.kind='idea';photo.hidden=true;
    dialog.querySelector('[data-explore-label]').textContent='灵感扭蛋 / '+(item.label||'一件小事');
    dialog.querySelector('[data-explore-heading]').textContent=item.title;
    dialog.querySelector('[data-explore-summary]').textContent=item.summary;
    const time=dialog.querySelector('[data-explore-date]');time.textContent='';time.removeAttribute('datetime');
    go.hidden=!item.url;if(item.url){go.href=item.url;go.textContent=item.action;}else go.removeAttribute('href');
    status.textContent='给今天一点小灵感。';
  }
  async function choose(){
    const ticket=++request;stopImage();next.disabled=true;go.hidden=true;dialog.setAttribute('aria-busy','true');status.textContent='正在挑选…';
    try{
      if(kind==='idea'){showIdea();next.querySelector('span').textContent='换一个';return;}
      const items=await load();if(ticket!==request||!dialog.open)return;
      const entry=pick(items);
      if(!entry){preview.hidden=true;status.textContent='这一类暂时没有可逛的内容，换一种试试。';return;}
      recent=[...recent.filter(id=>id!==entry.id),entry.id].slice(-12);
      try{sessionStorage.setItem(key,JSON.stringify(recent));}catch{}
      show(entry);next.querySelector('span').textContent='换一个';
    }catch{
      if(ticket!==request||!dialog.open)return;
      preview.hidden=true;status.textContent='暂时没有挑选成功，再试一次吧。';next.querySelector('span').textContent='重试';
    }finally{if(ticket===request){next.disabled=false;dialog.setAttribute('aria-busy','false');}}
  }
  function revealOpeners(){document.querySelectorAll('[data-open-explore]').forEach(button=>{button.hidden=false;});}
  revealOpeners();
  document.addEventListener('flyfish:page',revealOpeners);
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-open-explore]');
    if(!button||document.querySelector('dialog[open]'))return;
    opener=button;kind=button.dataset.exploreMode==='idea'?'idea':'all';
    modes.forEach(mode=>mode.setAttribute('aria-pressed',String(mode.dataset.exploreKind===kind)));
    dialog.showModal();document.body.classList.add('dialog-open');
    modes.find(mode=>mode.dataset.exploreKind===kind)?.focus();choose();
  });
  modes.forEach(button=>button.addEventListener('click',()=>{
    kind=button.dataset.exploreKind;modes.forEach(mode=>mode.setAttribute('aria-pressed',String(mode===button)));choose();
  }));
  next.addEventListener('click',choose);
  dialog.querySelector('.explore-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();});
  dialog.addEventListener('close',()=>{
    ++request;stopImage();image.removeAttribute('src');preview.hidden=true;go.hidden=true;next.disabled=false;dialog.setAttribute('aria-busy','false');
    if(!document.querySelector('dialog[open]'))document.body.classList.remove('dialog-open');opener?.focus();
  });
})();
