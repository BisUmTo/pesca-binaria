import {challengeFor,pick,sum,summarize,VERSION} from './core.mjs';
import {seal} from './crypto.mjs';
const $=id=>document.getElementById(id),STORE='pesca-binaria-v1';
let state=null,pub=null,clock=performance.now(),carry=0,lastExport=0;
const id=()=>crypto.randomUUID();
const elapsed=()=>Math.round(carry+performance.now()-clock);
function save(){
 if(!state)return;
 if(state.current?.status==='playing')state.current.elapsedMs=elapsed();
 try{localStorage.setItem(STORE,JSON.stringify(state));$('save-status').textContent='Progressi salvati su questo dispositivo.';}catch{$('save-status').textContent='Questo browser non salva i progressi. Scarica il LOG prima di chiudere.';}
}
function startAttempt(challenge,retry=0){
 state.current={...challenge,id:id(),retry,picks:[],events:[],status:'playing',elapsedMs:0};
 carry=0;clock=performance.now();save();render();
}
function newChallenge(){const wins=summarize(state.attempts).wins;startAttempt({...challengeFor(wins),challengeId:id()});}
function settle(){
 state.current.elapsedMs=elapsed();state.attempts.push({...state.current,picks:[...state.current.picks],events:[...state.current.events]});save();render();
}
function render(){
 $('welcome').hidden=!!state;$('game').hidden=!state;if(!state)return;
 const a=state.current,s=summarize(state.attempts),done=a.status!=='playing';
 $('player').textContent=`${state.name} · ${state.className}`;$('level').textContent=`Livello ${Math.min(5,1+Math.floor(s.wins/4))}`;
 $('level-progress').style.width=`${s.wins>=16?100:(s.wins%4)*25}%`;
 $('wins').textContent=s.wins;$('broken').textContent=s.broken;$('attempts').textContent=s.total;
 $('mode-label').textContent=a.mode==='fish'?'DECIMALE IN BINARIO':'BINARIO IN DECIMALE';
 $('challenge-title').textContent=a.mode==='fish'?'La rete regge fino a':'Queste sono le bocce pescate';
 $('target').textContent=a.mode==='fish'?a.target:'1 = presa · 0 = lasciata';$('target').className='target'+(a.mode==='read'?' reverse':'');
 $('prompt').textContent=a.mode==='fish'?'Tocca le bocce. La somma deve essere esatta.':'Somma solo le bocce con bit 1.';
 $('balls').replaceChildren();
 for(let i=a.width-(a.mode==='fish'?0:1);i>=0;i--){
  const value=2**i,selected=a.mode==='fish'?a.picks.includes(value):!!(a.target&value);
  const b=document.createElement(a.mode==='fish'?'button':'div');b.className='ball'+(i===a.width?' rescue':'')+(selected?' selected':a.mode==='read'?' zero':'');
  if(a.mode==='fish'){b.type='button';b.disabled=done||selected;b.setAttribute('aria-label',`Pesca ${value}${selected?', già pescata':''}`);b.setAttribute('aria-pressed',String(selected));b.onclick=()=>{state.current=pick(state.current,value);state.current.events.push(elapsed());if(state.current.status!=='playing')settle();else{save();render();}};}
  else b.setAttribute('aria-label',`${value}, bit ${selected?1:0}`);
  const number=document.createElement('span');number.textContent=value;b.append(number);
  const caption=document.createElement('small');caption.textContent=a.mode==='read'?`bit ${selected?1:0}`:selected?'presa':i===a.width?'rompi':`2${'⁰¹²³⁴⁵⁶⁷⁸'[i]}`;b.append(caption);$('balls').append(b);
 }
 $('net').hidden=a.mode==='read';$('net').className='net'+(a.status==='broken'?' broken':'');$('net-total').textContent=sum(a.picks);
 $('net-bits').textContent=sum(a.picks).toString(2).padStart(a.width,'0');
 $('answer-form').hidden=a.mode!=='read'||done;$('answer').value='';
 $('next').hidden=!done;$('next').textContent=a.status==='won'?'Prossima sfida':'Riprova lo stesso numero';
 $('feedback').className='feedback'+(a.status==='won'?' success':done?' failure':'');
 $('feedback').textContent=a.status==='won'?`Esatto! ${a.target.toString(2).padStart(a.width,'0')}₂ = ${a.target}₁₀`:a.status==='broken'?`Rete rotta: ${sum(a.picks)} supera ${a.target}. Riproviamo!`:a.status==='wrong'?'Non è la somma giusta. Riprova contando solo i bit 1.':a.retry?'Nuovo tentativo, stesso numero.':'';
 $('download').disabled=!pub||state.attempts.length===0;
}
$('start-form').onsubmit=e=>{e.preventDefault();const name=$('name').value.trim(),className=$('class-name').value.trim();if(!name||!className)return;state={version:VERSION,sessionId:id(),name,className,createdAt:new Date().toISOString(),attempts:[],current:null};newChallenge();};
$('answer-form').onsubmit=e=>{e.preventDefault();if(state.current.status!=='playing')return;const answer=Number($('answer').value);if(!Number.isInteger(answer)||answer<0||answer>511)return;state.current.answer=answer;state.current.status=answer===state.current.target?'won':'wrong';settle();};
$('next').onclick=()=>{const a=state.current;if(a.status==='won')newChallenge();else startAttempt({target:a.target,width:a.width,mode:a.mode,challengeId:a.challengeId},a.retry+1);};
function downloadFile(data,name){const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);}
$('download').onclick=async()=>{
 $('download').disabled=true;
 try{save();const {current,...log}=state;const envelope=await seal({...log,exportedAt:new Date().toISOString()},pub);downloadFile(JSON.stringify(envelope),`pesca-${state.name.replace(/[^a-z0-9]/gi,'-')}-${new Date().toISOString().slice(0,10)}.pesca-log`);lastExport=state.attempts.length;$('save-status').textContent='LOG scaricato. Allegalo alla consegna su Classroom. Include i tentativi conclusi.';}
 catch{$('global-error').textContent='Non riesco a creare il LOG. Riprova senza chiudere questa pagina.';}finally{$('download').disabled=false;}
};
$('switch').onclick=()=>{$('switch-warning').textContent=lastExport<state.attempts.length?'Ci sono tentativi che non hai ancora scaricato.':'';$('switch-dialog').showModal();};
$('cancel-switch').onclick=()=>$('switch-dialog').close();
$('confirm-switch').onclick=()=>{state=null;lastExport=0;try{localStorage.removeItem(STORE);}catch{}$('switch-dialog').close();render();};
document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});window.addEventListener('pagehide',save);setInterval(save,5000);
async function init(){
 if(!crypto.subtle||!crypto.randomUUID){$('global-error').textContent='Apri il gioco dal sito HTTPS di GitHub Pages o da localhost per usare i LOG cifrati.';$('start-form').querySelector('button').disabled=true;return;}
 try{const r=await fetch('public-key.json');if(!r.ok)throw Error();pub=await r.json();}catch{$('global-error').textContent='Chiave pubblica non disponibile. Ricarica la pagina prima di iniziare.';$('start-form').querySelector('button').disabled=true;return;}
 try{const raw=localStorage.getItem(STORE);if(raw){const candidate=JSON.parse(raw);if(candidate.version===VERSION&&candidate.current&&Array.isArray(candidate.attempts)){state=candidate;carry=state.current.elapsedMs||0;clock=performance.now();}}}catch{$('global-error').textContent='I progressi salvati non sono leggibili. Puoi iniziare una nuova partita.';}
 render();
}
init();
