async(page)=>{
 const context=await page.context().browser().newContext({viewport:{width:1280,height:900}}),tab=await context.newPage(),cdp=await context.newCDPSession(tab),events=[];
 await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Network.setBlockedURLs',{urls:['https://*']});await tab.addInitScript(()=>{sessionStorage.setItem('flyfish-opening-seen','1');try{Object.defineProperty(navigator,'connection',{value:{saveData:true,effectiveType:'4g'}});}catch{}});
 try{
  await tab.goto('http://127.0.0.1:4041/');await tab.evaluate(()=>window.FlyfishNavigationDiagnostics.enable());cdp.on('Tracing.dataCollected',data=>events.push(...data.value));const complete=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));
  await cdp.send('Tracing.start',{categories:'devtools.timeline,v8,blink.user_timing',transferMode:'ReportEvents'});
  await tab.evaluate(async()=>{performance.mark('flyfish-bench-start');await window.FlyfishNavigator.navigate('/briefing/');await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));performance.mark('flyfish-bench-end');});
  await cdp.send('Tracing.end');await complete;
  const start=events.find(e=>e.name==='flyfish-bench-start')?.ts,end=events.find(e=>e.name==='flyfish-bench-end')?.ts,summary={};
  for(const e of events)if(e.ph==='X'&&e.ts>=start&&e.ts<=end&&['Layout','Paint','UpdateLayoutTree','FunctionCall','EvaluateScript','V8.CompileCode'].includes(e.name)){const row=summary[e.name]||={count:0,inclusiveMs:0};row.count++;row.inclusiveMs+=(e.dur||0)/1000;}
  return {method:'Single cold home-to-briefing Chrome trace with in-page User Timing markers. Inclusive event durations may overlap and must not be summed into CPU or painting percentages. End marker follows two rAF opportunities, not all painting.',summary,traceEvents:events};
 }finally{await context.close();}
}
