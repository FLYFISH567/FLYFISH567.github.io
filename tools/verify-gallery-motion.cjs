'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('themes/flyfish/source/js/flyfish.js','utf8');
const start=source.indexOf("  const viewer=$('#photo-viewer');");
const end=source.indexOf("  document.addEventListener('click',event=>",start);
const requests=[],timers=new Map(),stage={},status={},caption={},img={classList:{remove(){}},removeAttribute(name){delete this[name];},animate(){return {cancel(){}};}};
let serial=0;
const context=vm.createContext({
  $:selector=>selector==='#photo-viewer'?{}:selector==='img'?img:selector==='.viewer-stage'?{setAttribute:(key,value)=>stage[key]=value}:selector==='.viewer-status'?status:caption,
  $$:()=>[],Image:class{constructor(){requests.push(this);}},matchMedia:()=>({matches:false}),
  setTimeout:(fn)=>{timers.set(++serial,fn);return serial;},clearTimeout:id=>timers.delete(id)
});
vm.runInContext(source.slice(start,end),context);
vm.runInContext("gallery=[{url:'one.jpg',caption:'第一张'},{url:'two.jpg',caption:'第二张'}];displayPhoto(0);displayPhoto(1);",context);
requests[0].onload();assert.equal(img.src,undefined,'Old image must not replace the latest selection');
requests[1].onload();assert.equal(img.src,'two.jpg');assert.equal(img.alt,'第二张');assert.equal(stage['aria-busy'],'false');assert.equal(status.hidden,true);
assert.equal(caption.textContent,'第二张 · 2 / 2');
vm.runInContext('displayPhoto(0)',context);requests[2].onerror();
assert.equal(img.src,undefined);assert.equal(status.hidden,false);assert.match(status.textContent,/无法加载/);
requests[2].onload();assert.equal(img.src,undefined,'A late load after failure must remain ignored');
vm.runInContext('displayPhoto(1)',context);[...timers.values()][0]();assert.equal(stage['aria-busy'],'false');
requests[3].onload();assert.equal(img.src,undefined,'A timed-out request must remain ignored');
const progressStart=source.indexOf('  function updateReadingProgress()');
const progressEnd=source.indexOf('  const updateScroll=',progressStart);
let rect={top:80,bottom:2080,height:2000},value,scale;
const progress=vm.createContext({
  readingBody:{getBoundingClientRect:()=>rect},siteHeader:{offsetHeight:80},innerHeight:800,
  readingProgress:{style:{setProperty:(_,number)=>scale=number},setAttribute:(_,number)=>value=Number(number)}
});
vm.runInContext(source.slice(progressStart,progressEnd),progress);
function check(next,expected){rect=next;vm.runInContext('updateReadingProgress()',progress);assert.equal(value,expected);assert.ok(scale>=0&&scale<=1);}
check({top:300,bottom:2300,height:2000},0);
check({top:-560,bottom:1440,height:2000},50);
check({top:-1200,bottom:800,height:2000},100);
check({top:100,bottom:400,height:300},100);
console.log('PASS: latest-photo selection wins, error/timeout recovery, late-request protection, and reading progress at start/middle/end/short articles.');
