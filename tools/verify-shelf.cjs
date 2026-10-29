'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const markup=fs.readFileSync('public/shelf/index.html','utf8'),script=fs.readFileSync('themes/flyfish/source/js/shelf.js','utf8');
function setup(hash=''){const dom=new JSDOM(markup,{url:'https://example.com/shelf/'+hash,runScripts:'outside-only'});dom.window.eval(script);return dom;}
let dom=setup(),doc=dom.window.document;
assert.equal(doc.querySelector('[data-shelf-section=films]').hidden,false);assert.equal(doc.querySelector('[data-shelf-section=books]').hidden,true);
doc.querySelector('[data-shelf-filter=books]').click();assert.equal(doc.querySelector('[data-shelf-section=films]').hidden,true);assert.equal(doc.querySelector('[data-shelf-section=books]').hidden,false);assert.equal(doc.querySelector('[data-shelf-filter=books]').getAttribute('aria-current'),'page');assert.equal(dom.window.location.hash,'#books');
doc.querySelector('[data-shelf-filter=films]').click();assert.equal(doc.querySelector('[data-shelf-section=films]').hidden,false);assert.equal(doc.querySelector('[data-shelf-section=books]').hidden,true);dom.window.close();
dom=setup('#books');doc=dom.window.document;assert.equal(doc.querySelector('[data-shelf-section=books]').hidden,false);assert.equal(doc.querySelector('[data-shelf-section=films]').hidden,true);dom.window.close();
dom=new JSDOM(markup,{url:'https://example.com/shelf/'});assert.equal(dom.window.document.querySelector('[data-shelf-section=films]').hidden,false);assert.equal(dom.window.document.querySelector('[data-shelf-section=books]').hidden,false);dom.window.close();
console.log('PASS: shelf category filters, links, deep link and no-JavaScript fallback.');
