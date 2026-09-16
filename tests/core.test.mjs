import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pick, validateAttempt, validateLog, summarize, challengeFor } from '../docs/core.mjs';
test('13 richiede 8, 4, 1; doppia pesca vietata e superamento rompe',()=>{
 let a={target:13,width:4,picks:[],status:'playing'};
 a=pick(a,8); assert.equal(a.status,'playing');
 assert.throws(()=>pick(a,8));
 a=pick(a,4); a=pick(a,1); assert.equal(a.status,'won');
 assert.throws(()=>pick(a,2));
 assert.equal(pick({target:13,width:4,picks:[2],status:'playing'},16).status,'broken');
});
test('tutti i target ammettono una soluzione e una boccia di rottura',()=>{
 for(let width=4;width<=8;width++)for(let n=1;n<2**width;n++){
  let a={target:n,width,picks:[],status:'playing'};
  for(let i=width-1;i>=0;i--)if(n&(2**i))a=pick(a,2**i);
  assert.equal(a.status,'won');
  assert.equal(pick({target:n,width,picks:[],status:'playing'},2**width).status,'broken');
 }
});
const valid={id:'attempt-123',challengeId:'challenge-123',target:13,width:4,mode:'fish',picks:[8,4,1],events:[100,200,300],elapsedMs:300,status:'won',retry:0};
test('LOG: ricostruisce risultati e respinge durate, scelte e esiti falsi',()=>{
 assert.equal(validateAttempt(valid),true);
 for(const patch of [{picks:[8,8]},{elapsedMs:-1},{target:12},{events:[200,100,300]},{status:'broken'},{picks:[8,4,1,2],events:[1,2,3,4]}])assert.throws(()=>validateAttempt({...valid,...patch}));
 assert.equal(validateAttempt({...valid,mode:'read',picks:[],events:[],answer:13}),true);
 assert.throws(()=>validateAttempt({...valid,mode:'read',picks:[],events:[],answer:12}));
});
test('premi: esclude ripetizioni dalla velocità e deduplica tentativi',()=>{
 const s=summarize([valid,valid,{...valid,id:'attempt-456',retry:1,elapsedMs:250,events:[50,150,250]}]);
 assert.equal(s.total,2); assert.equal(s.fastestMs,300); assert.equal(s.wins,2);
});
test('progressione: le inverse iniziano dopo 8 vittorie',()=>{
 for(let wins=0;wins<8;wins++)assert.equal(challengeFor(wins,()=>0.5).mode,'fish');
 assert.equal(challengeFor(8,()=>0.5).mode,'read');
 assert.equal(challengeFor(9,()=>0.5).mode,'fish');
});
test('LOG rifiuta retry e progressioni alterate',()=>{
 const base={version:1,sessionId:'session-123',name:'Prova',className:'1 Liceo',attempts:[valid]};
 assert.equal(validateLog(base),true);
 assert.throws(()=>validateLog({...base,attempts:[{...valid,retry:1}]}));
 const broken={...valid,id:'broken-123',picks:[16],events:[200],elapsedMs:200,status:'broken'};
 assert.equal(validateLog({...base,attempts:[broken,{...valid,retry:1}]}),true);
 assert.throws(()=>validateLog({...base,attempts:[broken,{...valid,retry:0}]}));
 assert.throws(()=>validateLog({...base,attempts:[valid,{...valid,id:'another-456'}]}));
});
