export const VERSION=1;
export const sum=xs=>xs.reduce((a,b)=>a+b,0);
export function challengeFor(wins,random=Math.random){
 const width=Math.min(8,4+Math.floor(wins/4));
 return {width,target:1+Math.floor(random()*(2**width-1)),mode:wins>=8&&(wins-8)%3===0?'read':'fish'};
}
export function pick(a,value){
 if(a.status!=='playing'||!Number.isInteger(value)||value<1||value>2**a.width||(value&(value-1))||a.picks.includes(value))throw Error('Pesca non valida');
 const picks=[...a.picks,value],n=sum(picks);
 return {...a,picks,status:n===a.target?'won':n>a.target?'broken':'playing'};
}
export function validateAttempt(a){
 const bad=()=>{throw Error('Partita incoerente');};
 if(!a||typeof a.id!=='string'||a.id.length<5||typeof a.challengeId!=='string'||a.challengeId.length<5)bad();
 if(!Number.isInteger(a.width)||a.width<4||a.width>8||!Number.isInteger(a.target)||a.target<1||a.target>=2**a.width)bad();
 if(!Number.isInteger(a.retry)||a.retry<0||!Number.isFinite(a.elapsedMs)||a.elapsedMs<0||a.elapsedMs>604800000)bad();
 if(!Array.isArray(a.picks)||!Array.isArray(a.events)||a.events.length!==a.picks.length)bad();
 let previous=0;
 for(const t of a.events){if(!Number.isFinite(t)||t<previous||t>a.elapsedMs)bad();previous=t;}
 if(a.mode==='fish'){
  let rebuilt={...a,picks:[],status:'playing'};
  for(const p of a.picks)rebuilt=pick(rebuilt,p);
  if(rebuilt.status!==a.status||!['won','broken'].includes(a.status)||a.answer!==undefined)bad();
 }else if(a.mode==='read'){
  if(a.picks.length||!Number.isInteger(a.answer)||a.answer<0||a.answer>511||!['won','wrong'].includes(a.status)||(a.answer===a.target)!==(a.status==='won'))bad();
 }else bad();
 return true;
}
export function validateLog(log){
 if(log?.version!==VERSION||typeof log.sessionId!=='string'||typeof log.name!=='string'||!log.name.trim()||log.name.length>80||typeof log.className!=='string'||log.className.length>40||!Array.isArray(log.attempts)||log.attempts.length>20000)throw Error('Formato LOG non valido');
 const seen=new Set(),challenges=new Set();let previous=null,wins=0;
 for(const a of log.attempts){
  validateAttempt(a);if(seen.has(a.id))throw Error('Tentativo duplicato nel LOG');seen.add(a.id);
  if(previous&&previous.status!=='won'){
   if(a.challengeId!==previous.challengeId||a.target!==previous.target||a.mode!==previous.mode||a.width!==previous.width||a.retry!==previous.retry+1)throw Error('Ripetizione incoerente');
  }else{
   const expected=challengeFor(wins,()=>0);
   if(challenges.has(a.challengeId)||a.retry!==0||a.mode!==expected.mode||a.width!==expected.width)throw Error('Progressione incoerente');
   challenges.add(a.challengeId);
  }
  if(a.status==='won')wins++;previous=a;
 }
 return true;
}
export function summarize(attempts){
 const unique=[...new Map(attempts.map(a=>[a.id,a])).values()];
 const fish=unique.filter(a=>a.mode==='fish'), broken=fish.filter(a=>a.status==='broken').length;
 const times=fish.filter(a=>a.status==='won'&&a.picks.length>=3&&a.retry===0).map(a=>a.elapsedMs);
 return {total:unique.length,wins:unique.filter(a=>a.status==='won').length,fish:fish.length,broken,brokenRate:fish.length?broken/fish.length:null,fastestMs:times.length?Math.min(...times):null,inverse:unique.filter(a=>a.mode==='read'&&a.status==='won').length};
}
