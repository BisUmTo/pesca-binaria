import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pick, validateAttempt, validateLog, summarize, challengeFor, weightsFor } from '../docs/core.mjs';
test('13 richiede 8, 4, 1; doppia pesca vietata e superamento rompe',()=>{
 let a={target:13,width:4,picks:[],status:'playing'};
 a=pick(a,8); assert.equal(a.status,'playing');
 assert.throws(()=>pick(a,8));
 a=pick(a,4); a=pick(a,1); assert.equal(a.status,'won');
 assert.throws(()=>pick(a,2));
 assert.equal(pick({target:13,width:4,picks:[2],status:'playing'},16).status,'broken');
});
test('v2: livelli avanzati usano al massimo 1024 e includono target superiori',()=>{
 const advanced=challengeFor(100,()=>0.9);
 assert.equal(advanced.width,11);assert.equal(advanced.rulesVersion,2);
 assert.equal(Math.max(...weightsFor(advanced)),1024);assert.ok(advanced.target>1024);
 assert.equal(pick({...advanced,target:1536,picks:[],status:'playing'},1024).status,'playing');
 assert.throws(()=>pick({...advanced,picks:[],status:'playing'},2048));
 for(let n=1;n<=2047;n++){
  let a={...advanced,target:n,picks:[],status:'playing'};
  for(const v of weightsFor(a))if(n&v)a=pick(a,v);
  assert.equal(a.status,'won');
 }
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
test('v2 mantiene compatibilità LOG v1 e passa a 11 bit senza alterare vecchi tentativi',()=>{
 const attempts=[];
 for(let i=0;i<32;i++){
  const c=challengeFor(i,()=>.75,i<20?1:2),picks=c.mode==='fish'?weightsFor(c).filter(v=>!!(c.target&v)):[];
  attempts.push({...c,id:`attempt-${i}`,challengeId:`challenge-${i}`,retry:0,picks,events:picks.map((_,j)=>(j+1)*100),elapsedMs:2000,status:'won',...(c.mode==='read'?{answer:c.target}:{})});
 }
 const meta={sessionId:'migration-session',name:'Studente',className:'1 Liceo'};
 assert.equal(validateLog({...meta,version:1,attempts:attempts.slice(0,20)}),true);
 assert.equal(validateLog({...meta,version:2,attempts}),true);
 assert.equal(attempts.at(-1).width,11);
 assert.throws(()=>validateLog({...meta,version:1,attempts}));
});
