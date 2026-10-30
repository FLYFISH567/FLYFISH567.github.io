'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const source=fs.readFileSync('themes/flyfish/source/js/navigation.js','utf8');
const html=name=>`<html><body data-view="${name}"><main id="main" data-page-content><h1>${name}</h1></main></body></html>`;
const create=url=>{const dom=new JSDOM(html('home'),{url,runScripts:'outside-only'}),w=dom.window;w.scrollTo=()=>{};w.requestAnimationFrame=fn=>fn();w.requestIdleCallback=()=>{};w.fetch=async()=>({ok:true,status:200,headers:{get:()=> 'text/html'},text:async()=>html('article')});w.eval(source);return dom;};
(async()=>{
 const dom=create('http://localhost/'),w=dom.window,d=w.FlyfishNavigationDiagnostics;assert.equal(d.enabled,false);await w.FlyfishNavigator.navigate('/article/');assert.equal(d.records().length,0,'Diagnostics are off by default');
 assert.equal(d.enable(),true);await w.FlyfishNavigator.navigate('/article/?giscus=private-session&other=private-token');const records=d.records();assert.ok(records.some(e=>e.event==='navigation.start'));assert.ok(records.some(e=>e.event==='html.source'));assert.ok(records.some(e=>e.event==='html.request.start'));assert.ok(records.some(e=>e.event==='html.headers'));assert.ok(records.some(e=>e.event==='html.body.end'));for(const event of ['dom.parse.start','dom.parse.end','assets.start','assets.end','dom.replace.start','dom.replace.end','page.init.sync.start','page.init.sync.end','paint.opportunity','navigation.end'])assert.ok(records.some(e=>e.event===event),event);
 assert.ok(!JSON.stringify(records).includes('private-'));assert.ok(records.filter(e=>e.path).every(e=>e.path.startsWith('/')&&!e.path.includes('?')));const n=records.length;d.disable();await w.FlyfishNavigator.navigate('/next/');assert.equal(d.records().length,n);d.clear();assert.equal(d.records().length,0);dom.window.close();
 const external=create('https://flyfish567.github.io/');assert.equal(external.window.FlyfishNavigationDiagnostics.enable(),false,'Production cannot enable local diagnostics');external.window.close();
 console.log('PASS: diagnostics default off, local enable/disable, phase records, per-navigation identity, no session/query leakage and production guard.');
})().catch(e=>{console.error(e);process.exitCode=1;});
