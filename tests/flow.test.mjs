// Browserless integration: real application handlers, storage and Web Crypto.
// This verifies state transitions; it does not replace a visual browser check.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {unseal} from '../docs/crypto.mjs';
import {validateLog} from '../docs/core.mjs';
class Element{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.value='';this.hidden=false;this.disabled=false;this.style={setProperty(k,v){this[k]=v;}};this.textContent='';this.files=[];this.className='';this.classList={add:(s)=>{this.className+=' '+s;},toggle:(s,on)=>{this.className=this.className.split(' ').filter(x=>x!==s).concat(on?[s]:[]).join(' ');}};}
 append(...xs){this.children.push(...xs);}
 replaceChildren(...xs){this.children=xs;}
 setAttribute(k,v){this[k]=v;}
 querySelector(selector){const search=node=>{for(const child of node.children){if(selector.startsWith('.')&&child.className.split(' ').includes(selector.slice(1)))return child;const found=search(child);if(found)return found;}};return search(this)||new Element();}
 click(){if(!this.disabled)return this.onclick?.();}
 focus(){globalThis.document.activeElement=this;}
 showModal(){this.open=true;}
 close(){this.open=false;}
}
test('flusso v2: bit, retry, inverse, 11 posizioni, ripresa, audio, LOG e classifica',async()=>{
 const original={document:globalThis.document,window:globalThis.window,localStorage:globalThis.localStorage,fetch:globalThis.fetch,setInterval:globalThis.setInterval,setTimeout:globalThis.setTimeout};
 const oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;let exported;
 const keyPair=await crypto.subtle.generateKey({name:'RSA-OAEP',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['encrypt','decrypt']);
 const publicKey=await crypto.subtle.exportKey('jwk',keyPair.publicKey),privateKey=await crypto.subtle.exportKey('jwk',keyPair.privateKey);
 const elements=new Map();
 const $=id=>elements.get(id);
 async function loadDocument(file){
  elements.clear();const html=await fs.readFile(new URL(file,import.meta.url),'utf8');
  for(const m of html.matchAll(/id="([^"]+)"/g))elements.set(m[1],new Element());
  globalThis.document={body:new Element('body'),getElementById:$,createElement:tag=>new Element(tag),addEventListener(){}};
 }
 try{
  globalThis.window={addEventListener(){}};const storage=new Map();
  globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
  globalThis.fetch=async()=>({ok:true,json:async()=>publicKey});globalThis.setInterval=()=>0;globalThis.setTimeout=()=>0;
  URL.createObjectURL=blob=>{exported=blob;return 'blob:test';};URL.revokeObjectURL=()=>{};
  await loadDocument('../docs/index.html');await import('../docs/app.mjs');await new Promise(resolve=>setImmediate(resolve));
  $('name').value='Studente Prova';$('class-name').value='1 Liceo';$('start-form').onsubmit({preventDefault(){}});
  assert.equal($('game').hidden,false);const firstTarget=$('target').textContent;
  assert.ok($('net-bits').children.every(slot=>slot.children[1].textContent==='0'));
  const valueOf=b=>Number(b.querySelector('.orb-number').textContent);
  // Retry must keep the same target after an overflowing pick.
  await $('balls').children.find(b=>valueOf(b)===16).click();assert.equal($('broken').textContent,1);
  $('next').click();assert.equal($('target').textContent,firstTarget);
  for(let round=0;round<8;round++){
   const target=Number($('target').textContent);
   for(const value of [1024,512,256,128,64,32,16,8,4,2,1])if(target&value){await $('balls').children.find(b=>valueOf(b)===value).click();const slot=$('net-bits').children.find(s=>s.children[0].textContent===value);assert.equal(slot.children[1].textContent,'1');assert.ok(slot.className.includes('lit'));}
   assert.equal($('wins').textContent,round+1);$('next').click();
  }
  assert.equal($('answer-form').hidden,false);
  const legacy=JSON.parse(storage.get('pesca-binaria-v1'));legacy.version=1;
  for(const a of [...legacy.attempts,legacy.current])delete a.rulesVersion;
  storage.set('pesca-binaria-v1',JSON.stringify(legacy));
  await loadDocument('../docs/index.html');await import('../docs/app.mjs?restore=legacy');await new Promise(resolve=>setImmediate(resolve));
  assert.equal($('answer').max,511);
  $('answer').value='600';$('answer-form').onsubmit({preventDefault(){}});assert.equal($('attempts').textContent,9);
  const inverse=$('balls').children.filter(b=>b.className.includes('selected')).reduce((n,b)=>n+valueOf(b),0);
  $('answer').value=String(inverse);$('answer-form').onsubmit({preventDefault(){}});
  assert.equal($('wins').textContent,9);
  for(let wins=9;wins<28;wins++){
   $('next').click();
   if(!$('answer-form').hidden){const n=$('balls').children.filter(b=>b.className.includes('selected')).reduce((sum,b)=>sum+valueOf(b),0);$('answer').value=String(n);$('answer-form').onsubmit({preventDefault(){}});}
   else{const n=Number($('target').textContent);for(const value of [1024,512,256,128,64,32,16,8,4,2,1])if(n&value)await $('balls').children.find(b=>valueOf(b)===value).click();}
   assert.equal($('wins').textContent,wins+1);
  }
  $('next').click();assert.equal($('net-bits').children.length,11);assert.equal($('net-bits').children[0].children[0].textContent,1024);
  assert.ok($('net-bits').children.every(s=>s.children[1].textContent==='0'));
  const resumedTarget=$('target').textContent;
  await loadDocument('../docs/index.html');await import('../docs/app.mjs?restore=v2');await new Promise(resolve=>setImmediate(resolve));
  assert.equal($('game').hidden,false);assert.equal($('target').textContent,resumedTarget);assert.equal($('wins').textContent,28);assert.equal($('global-error').textContent,'');
  $('sound').click();assert.equal($('sound')['aria-pressed'],'false');$('motion').click();assert.equal($('motion')['aria-pressed'],'true');
  await $('download').onclick();
  const envelope=JSON.parse(await exported.text());const log=await unseal(envelope,keyPair.privateKey);assert.equal(validateLog(log),true);assert.equal(log.attempts.length,29);
  // Real teacher handlers: unlock, import the same export twice, then reject a bad key.
  await loadDocument('../docs/prof.html');await import('../docs/prof.mjs');
  await $('private-key').onchange({target:{files:[{size:1000,text:async()=>JSON.stringify(privateKey)}],value:'test'}});
  assert.equal($('prof-content').hidden,false);
  const file={name:'test.pesca-log',size:1000,text:async()=>JSON.stringify(envelope)};
  await $('logs').onchange({target:{files:[file,file],disabled:false,value:'test'}});
  assert.equal($('ranking').children.length,1);assert.equal($('totals').textContent,'1 studenti · 29 tentativi unici');
  assert.equal($('ranking').children[0].children[2].textContent,28);
  assert.equal($('ranking').children[0].children[4].textContent,1);
  $('csv').click();assert.match(await exported.text(),/Studente Prova/);
  $('lock').click();assert.equal($('prof-content').hidden,true);
  await $('private-key').onchange({target:{files:[{size:1000,text:async()=>JSON.stringify(publicKey)}],value:'test'}});
  assert.equal($('prof-content').hidden,true);assert.match($('prof-error').textContent,/Chiave non valida/);
 }finally{
  for(const [k,v] of Object.entries(original))if(v===undefined)delete globalThis[k];else globalThis[k]=v;
  URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;
 }
});
