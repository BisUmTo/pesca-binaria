import {challengeFor,pick,sum,summarize,validateLog,weightsFor,VERSION} from './core.mjs';
import {seal} from './crypto.mjs';
import {createAttemptClock} from './clock.mjs';
import {configureEffects,playSound,flyMarble,celebrate} from './effects.mjs';
const $=id=>document.getElementById(id),STORE='pesca-binaria-v1',PREFS='pesca-binaria-preferences-v2';
const colors=['#b8ee44','#ffb832','#f780f5','#55e5ff','#6ca6ff','#bb80ff','#ff719c','#8be57a','#ff8257','#57dfb7','#d5b7ff'];
const hues=[-125,-185,90,-20,0,55,115,-105,165,-65,40];
const timer=createAttemptClock();
let state=null,pub=null,lastExport=0,busy=false;
let prefs={sound:true,reduced:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false};
try{prefs={...prefs,...JSON.parse(localStorage.getItem(PREFS)||'{}')};}catch{}
const id=()=>crypto.randomUUID(),elapsed=()=>timer.elapsed();
function preferences(){
 const systemReduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
 const reduced=systemReduced||prefs.reduced;configureEffects({...prefs,reduced});document.body.classList.toggle('reduced-motion',reduced);
 $('sound-icon').src=`assets/icons/${prefs.sound?'speaker-high':'speaker-slash'}.svg`;$('sound').setAttribute('aria-pressed',String(prefs.sound));$('sound').setAttribute('aria-label',prefs.sound?'Disattiva suoni':'Attiva suoni');
 $('motion').disabled=systemReduced;$('motion').textContent=systemReduced?'Movimento ridotto dal dispositivo':reduced?'Animazioni ridotte':'Riduci animazioni';$('motion').setAttribute('aria-pressed',String(reduced));$('motion').setAttribute('aria-label',systemReduced?'Movimento ridotto dalle impostazioni del dispositivo':reduced?'Attiva animazioni':'Riduci animazioni');
 try{localStorage.setItem(PREFS,JSON.stringify(prefs));}catch{}
}
function save(){
 if(!state)return;if(state.current?.status==='playing')state.current.elapsedMs=elapsed();
 try{localStorage.setItem(STORE,JSON.stringify(state));$('save-status').textContent=lastExport===state.attempts.length&&lastExport>0?'LOG scaricato. Allegalo alla consegna su Classroom.':'Progressi salvati in questo browser.';}
 catch{$('save-status').textContent='Il browser non salva i progressi. Scarica il LOG prima di chiudere.';}
}
function startAttempt(challenge,retry=0){state.current={...challenge,id:id(),retry,picks:[],events:[],status:'playing',elapsedMs:0};timer.start();busy=false;save();render();}
function newChallenge(){startAttempt({...challengeFor(summarize(state.attempts).wins),challengeId:id()});}
function finishAttempt(){state.current.elapsedMs=elapsed();state.attempts.push({...state.current,picks:[...state.current.picks],events:[...state.current.events]});}
function paintColor(node,value){const i=Math.log2(value);node.style.setProperty('--orb-color',colors[i]);node.style.setProperty('--hue',`${hues[i]}deg`);node.style.setProperty('--size-step',i);node.style.setProperty('--delay',`${-i*.57}s`);}
function element(tag,cls,text){const node=document.createElement(tag);node.className=cls;if(text!==undefined)node.textContent=text;return node;}
function orb(value){const o=element('span','orb');o.append(element('span','orb-skin'),element('span','orb-number'+(value>=100?' long-number':''),value));return o;}
// Fixed slots per challenge: the picture moves while the touch target stays put.
function arranged(values,seed){let n=[...seed].reduce((v,c)=>(v*31+c.charCodeAt(0))>>>0,7);return values.map(value=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return {value,key:n};}).sort((a,b)=>a.key-b.key).map(x=>x.value);}
async function take(value,button,keyboard=false){
 if(busy||state.current.status!=='playing')return;const source=button.querySelector('.orb');busy=true;
 const a=state.current=pick(state.current,value);a.events.push(elapsed());if(a.status!=='playing')finishAttempt();save();playSound('pick');
 button.classList.add('caught');for(const b of $('balls').children)if(b.tagName==='BUTTON')b.disabled=true;
 timer.pause();try{await flyMarble(source,$('net-landing'),colors[Math.log2(value)],`${hues[Math.log2(value)]}deg`);}finally{timer.resume();busy=false;render();}
 if(a.status==='won'){playSound('win');celebrate($('collector'));$('next').focus();}
 else if(a.status==='broken'){playSound('break');$('next').focus();}
 else if(keyboard)[...$('balls').children].find(b=>!b.disabled)?.focus({preventScroll:true});
}
function renderCatch(a,values,reading){
 const captured=reading?values.filter(value=>a.target&value):a.picks;
 $('catch').replaceChildren();$('catch').className='catch'+(captured.length>5?' many':'');
 for(const value of captured){const ball=element('span','catch-marble');paintColor(ball,value);ball.append(orb(value));$('catch').append(ball);}
 $('net-scene').className='net-scene'+(a.status==='broken'?' is-broken':a.status==='won'?' is-won':'');
 $('net-art').src=`assets/v3/fishing-net${a.status==='broken'?'-broken':''}.webp`;
}
function render(){
 $('welcome').hidden=!!state;$('game').hidden=!state;document.body.classList.toggle('playing',!!state);$('switch').disabled=!state;if(!state){
  $('download').disabled=true;$('player').textContent='';$('level').textContent='Pronti a partire?';$('level-progress').style.width='0%';
  for(const key of ['wins','broken','attempts'])$(key).textContent=0;
  $('save-status').textContent='Inizia una partita per salvare i progressi.';$('download-error').textContent='';document.body.classList.toggle('read-mode',false);return;
 }
 const a=state.current,s=summarize(state.attempts),done=a.status!=='playing',values=weightsFor(a),reading=a.mode==='read';document.body.classList.toggle('read-mode',reading);
 $('player').textContent=`${state.name} · ${state.className}`;$('level').textContent=`Livello ${Math.min(8,1+Math.floor(s.wins/4))}`;
 $('level-progress').style.width=`${s.wins>=28?100:(s.wins%4)*25}%`;$('wins').textContent=s.wins;$('broken').textContent=s.broken;$('attempts').textContent=s.total;
 $('mode-label').textContent=reading?'BINARIO IN DECIMALE':'DECIMALE IN BINARIO';$('challenge-title').textContent=reading?'Quanto vale?':'Obiettivo';$('target').textContent=reading?'?':a.target;
 $('prompt').textContent=reading?'Somma solo le biglie con il bit 1.':'Tocca una biglia per pescarla.';
 $('balls').replaceChildren();$('balls').className='marble-field'+(values.length>6?' many':'');$('balls').style.setProperty('--columns',Math.min(values.length,6));
 for(const value of arranged(values,a.challengeId)){
  const selected=reading?!!(a.target&value):a.picks.includes(value),b=element(reading?'div':'button',reading?`read-marble ${selected?'selected':'zero'}`:`marble-button ${selected?'caught':''}`);paintColor(b,value);b.append(orb(value));
  if(!reading){b.type='button';b.disabled=done||selected||busy;b.setAttribute('aria-label',`Pesca ${value}${selected?', già pescata':''}`);b.setAttribute('aria-pressed',String(selected));b.onclick=e=>take(value,b,e?.detail===0);}else b.setAttribute('aria-label',`${value}, bit ${selected?1:0}`);
  $('balls').append(b);
 }
 $('net-bits').replaceChildren();$('net-bits').className='binary-rail'+(values.length>=9?' dense':'');$('net-bits').style.setProperty('--count',values.length);const bits=[];
 for(const value of values){
  const on=reading?!!(a.target&value):a.picks.includes(value),slot=element('div','bit-slot'+(on?' lit':''));paintColor(slot,value);bits.push(on?'1':'0');slot.setAttribute('aria-label',`Peso ${value}, bit ${on?1:0}`);
  const sphere=element('span','bit-orb');sphere.id=`bit-orb-${value}`;sphere.setAttribute('aria-hidden','true');slot.append(element('span','bit-weight',value),element('span','bit-digit',on?'1':'0'),sphere);$('net-bits').append(slot);
 }
 $('binary-reading').textContent=`Numero binario: ${bits.join(' ')}`;$('net').hidden=reading;$('net-total').textContent=sum(a.picks);$('net-capacity').textContent=`/ ${a.target}`;$('net-fill').style.width=`${Math.min(100,sum(a.picks)/a.target*100)}%`;
 renderCatch(a,values,reading);$('collector').className='collector'+(a.status==='broken'?' is-broken':a.status==='won'?' is-won':'');$('answer-form').hidden=!reading||done;$('answer').max=(a.rulesVersion??1)===1?511:2047;$('answer').value='';$('next').hidden=!done;$('next').textContent=a.status==='won'?'Prossima sfida':'Riprova questo numero';
 $('feedback').className='feedback'+(a.status==='won'?' success':done?' failure':'');$('feedback').textContent=a.status==='won'?`Pescata perfetta! ${a.target.toString(2)}₂ = ${a.target}₁₀`:a.status==='broken'?`Rete rotta! ${sum(a.picks)} supera ${a.target}.`:a.status==='wrong'?'Non ancora: somma solo i bit accesi.':a.retry?'Stesso numero. Una nuova pescata.':'';
 $('download').disabled=!pub||!state.attempts.length||busy;
}
$('start-form').onsubmit=e=>{e.preventDefault();if(!pub)return;const name=$('name').value.trim(),className=$('class-name').value.trim();if(!name||!className)return;state={version:VERSION,sessionId:id(),name,className,createdAt:new Date().toISOString(),attempts:[],current:null};playSound('click');newChallenge();$('balls').children[0]?.focus({preventScroll:true});$('menu-dialog').close();};
$('answer-form').onsubmit=e=>{e.preventDefault();if(busy||state.current.status!=='playing')return;const raw=$('answer').value;if(raw.trim()==='')return;const answer=Number(raw);if(!Number.isInteger(answer)||answer<0||answer>((state.current.rulesVersion??1)===1?511:2047))return;state.current.answer=answer;state.current.status=answer===state.current.target?'won':'wrong';finishAttempt();save();render();playSound(state.current.status==='won'?'win':'wrong');if(state.current.status==='won')celebrate($('collector'));$('next').focus();};
$('next').onclick=()=>{if(busy)return;playSound('click');const a=state.current;if(a.status==='won')newChallenge();else startAttempt({target:a.target,width:a.width,mode:a.mode,challengeId:a.challengeId,rulesVersion:a.rulesVersion??1},a.retry+1);if(state.current.mode==='read')$('answer').focus();else [...$('balls').children].find(b=>!b.disabled)?.focus({preventScroll:true});};
function downloadFile(data,name){const url=URL.createObjectURL(new Blob([data],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);}
$('download').onclick=async()=>{
 if(busy||!state?.attempts.length)return;$('download').disabled=true;$('download-error').textContent='';
 try{save();const {current,...log}=state;validateLog(log);const envelope=await seal({...log,exportedAt:new Date().toISOString()},pub);downloadFile(JSON.stringify(envelope),`pesca-${state.name.replace(/[^a-z0-9]/gi,'-')}-${new Date().toISOString().slice(0,10)}.pesca-log`);lastExport=state.attempts.length;$('save-status').textContent='LOG scaricato. Allegalo alla consegna su Classroom.';}
 catch{$('download-error').textContent='Non riesco a creare il LOG. Riprova senza chiudere questa pagina.';}finally{$('download').disabled=false;}
};
$('menu').onclick=()=>{$('menu-dialog').showModal();playSound('click');};$('close-menu').onclick=()=>$('menu-dialog').close();
$('sound').onclick=()=>{prefs.sound=!prefs.sound;preferences();playSound('click');};$('motion').onclick=()=>{prefs.reduced=!prefs.reduced;preferences();};$('help').onclick=()=>{$('help-dialog').showModal();playSound('click');};$('close-help').onclick=()=>$('help-dialog').close();
$('switch').onclick=()=>{if(busy)return;$('switch-warning').textContent=lastExport<state.attempts.length?'Ci sono tentativi che non hai ancora scaricato.':'';$('switch-dialog').showModal();};$('cancel-switch').onclick=()=>$('switch-dialog').close();$('confirm-switch').onclick=()=>{state=null;lastExport=0;try{localStorage.removeItem(STORE);}catch{}$('switch-dialog').close();$('menu-dialog').close();render();$('name').focus();};
document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});window.addEventListener('pagehide',save);setInterval(save,5000);
async function init(){
 preferences();if(!crypto.subtle||!crypto.randomUUID){$('global-error').textContent='Apri il gioco dal sito HTTPS di GitHub Pages o da localhost per usare i LOG cifrati.';$('start-form').querySelector('button').disabled=true;return;}
 try{const r=await fetch('public-key.json');if(!r.ok)throw Error();pub=await r.json();}catch{$('global-error').textContent='Chiave pubblica non disponibile. Ricarica prima di iniziare.';$('start-form').querySelector('button').disabled=true;return;}
 try{
  const raw=localStorage.getItem(STORE);if(raw){const candidate=JSON.parse(raw);validateLog(candidate);if(candidate.current){const a=candidate.current,rules=a.rulesVersion??1,maxWidth=rules===1?8:11;if(!Number.isInteger(a.width)||a.width<4||a.width>maxWidth||!Array.isArray(a.picks)||!Number.isFinite(a.elapsedMs)||!['playing','won','broken','wrong'].includes(a.status))throw Error();state={...candidate,version:VERSION};timer.start(a.elapsedMs||0);}}
 }catch{$('global-error').textContent='I progressi salvati non sono leggibili. I dati originali sono ancora nel browser.';}
 render();
}
init();
