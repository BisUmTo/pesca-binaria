// Browserless integration: real application handlers, storage and Web Crypto.
// This verifies state transitions; it does not replace a visual browser check.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {unseal} from '../docs/crypto.mjs';
import {validateLog} from '../docs/core.mjs';
class Element{
 constructor(){this.children=[];this.value='';this.hidden=false;this.disabled=false;this.style={};this.textContent='';this.files=[];}
 append(...xs){this.children.push(...xs);}
 replaceChildren(...xs){this.children=xs;}
 setAttribute(k,v){this[k]=v;}
 querySelector(){return new Element();}
 click(){this.onclick?.();}
 showModal(){this.open=true;}
 close(){this.open=false;}
}
test('flusso completo: rottura, retry, 8 vittorie, inversa, LOG e classifica',async()=>{
 const original={document:globalThis.document,window:globalThis.window,localStorage:globalThis.localStorage,fetch:globalThis.fetch,setInterval:globalThis.setInterval,setTimeout:globalThis.setTimeout};
 const oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;let exported;
 const keyPair=await crypto.subtle.generateKey({name:'RSA-OAEP',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['encrypt','decrypt']);
 const publicKey=await crypto.subtle.exportKey('jwk',keyPair.publicKey),privateKey=await crypto.subtle.exportKey('jwk',keyPair.privateKey);
 const elements=new Map();
 const $=id=>elements.get(id);
 async function loadDocument(file){
  elements.clear();const html=await fs.readFile(new URL(file,import.meta.url),'utf8');
  for(const m of html.matchAll(/id="([^"]+)"/g))elements.set(m[1],new Element());
  globalThis.document={getElementById:$,createElement:()=>new Element(),addEventListener(){}};
 }
 try{
  globalThis.window={addEventListener(){}};const storage=new Map();
  globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
  globalThis.fetch=async()=>({ok:true,json:async()=>publicKey});globalThis.setInterval=()=>0;globalThis.setTimeout=()=>0;
  URL.createObjectURL=blob=>{exported=blob;return 'blob:test';};URL.revokeObjectURL=()=>{};
  await loadDocument('../docs/index.html');await import('../docs/app.mjs');await new Promise(resolve=>setImmediate(resolve));
  $('name').value='Studente Prova';$('class-name').value='1 Liceo';$('start-form').onsubmit({preventDefault(){}});
  assert.equal($('game').hidden,false);const firstTarget=$('target').textContent;
  // Highest value always breaks the net, and retry must keep the same target.
  $('balls').children[0].click();assert.equal($('broken').textContent,1);
  $('next').click();assert.equal($('target').textContent,firstTarget);
  for(let round=0;round<8;round++){
   const target=Number($('target').textContent);
   for(const ball of [...$('balls').children])if(target&Number(ball.children[0].textContent))ball.click();
   assert.equal($('wins').textContent,round+1);$('next').click();
  }
  assert.equal($('answer-form').hidden,false);
  const inverse=$('balls').children.filter(b=>b.className.includes('selected')).reduce((n,b)=>n+Number(b.children[0].textContent),0);
  $('answer').value=String(inverse);$('answer-form').onsubmit({preventDefault(){}});
  assert.equal($('wins').textContent,9);await $('download').onclick();
  const envelope=JSON.parse(await exported.text());const log=await unseal(envelope,keyPair.privateKey);assert.equal(validateLog(log),true);assert.equal(log.attempts.length,10);
  // Real teacher handlers: unlock, import the same export twice, then reject a bad key.
  await loadDocument('../docs/prof.html');await import('../docs/prof.mjs');
  await $('private-key').onchange({target:{files:[{size:1000,text:async()=>JSON.stringify(privateKey)}],value:'test'}});
  assert.equal($('prof-content').hidden,false);
  const file={name:'test.pesca-log',size:1000,text:async()=>JSON.stringify(envelope)};
  await $('logs').onchange({target:{files:[file,file],disabled:false,value:'test'}});
  assert.equal($('ranking').children.length,1);assert.equal($('totals').textContent,'1 studenti · 10 tentativi unici');
  assert.equal($('ranking').children[0].children[2].textContent,9);
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
