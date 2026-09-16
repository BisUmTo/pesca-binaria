import {unlock,unseal} from './crypto.mjs';
import {validateLog,summarize} from './core.mjs';
const $=id=>document.getElementById(id);let privateKey=null,publicKey=null,rows=[];
const students=new Map(),seen=new Map();
const normalized=s=>s.trim().toLocaleLowerCase('it').replace(/\s+/g,' ');
const seconds=ms=>ms===null?'—':`${(ms/1000).toLocaleString('it',{maximumFractionDigits:2})} s`;
const percent=n=>n===null?'—':`${(n*100).toLocaleString('it',{maximumFractionDigits:1})}%`;
$('private-key').onchange=async e=>{
 $('prof-error').textContent='';const file=e.target.files[0];if(!file)return;
 try{if(file.size>20000)throw Error('File chiave troppo grande');const r=await fetch('public-key.json');if(!r.ok)throw Error('Chiave pubblica non disponibile');publicKey=await r.json();privateKey=await unlock(JSON.parse(await file.text()),publicKey);$('locked').hidden=true;$('prof-content').hidden=false;}
 catch{$('prof-error').textContent='Chiave non valida per questo gioco. Seleziona il file privato corretto.';privateKey=null;}
 e.target.value='';
};
$('lock').onclick=()=>{privateKey=null;students.clear();seen.clear();rows=[];$('locked').hidden=false;$('prof-content').hidden=true;$('imports').replaceChildren();$('prof-error').textContent='';render();};
$('logs').onchange=async e=>{
 const files=[...e.target.files];e.target.disabled=true;$('lock').disabled=true;
 try{for(const file of files){
  const li=document.createElement('li');
  try{
   if(!privateKey)throw Error('Area bloccata');if(file.size>10*1024*1024)throw Error('File troppo grande (massimo 10 MB)');
   const log=await unseal(JSON.parse(await file.text()),privateKey);validateLog(log);
   const owner=`${normalized(log.className)}::${normalized(log.name)}`;
   // Check the complete file before merging any record (atomic import).
   for(const a of log.attempts){const existing=seen.get(a.id);if(existing&&(existing.owner!==owner||existing.value!==JSON.stringify(a)))throw Error('Tentativo duplicato con dati diversi');}
   let student=students.get(owner);if(!student){student={name:log.name,className:log.className,attempts:[]};students.set(owner,student);}
   let added=0;
   for(const a of log.attempts)if(!seen.has(a.id)){seen.set(a.id,{owner,value:JSON.stringify(a)});student.attempts.push(a);added++;}
   li.textContent=`${file.name}: ${log.name}, ${added} nuovi tentativi${log.attempts.length-added?`, ${log.attempts.length-added} già presenti`:''}.`;
  }catch(error){li.textContent=`${file.name}: non importato. ${error.message==='Tentativo duplicato con dati diversi'?error.message:'File non valido, incoerente o cifrato con un’altra chiave.'}`;li.className='error';}
  $('imports').append(li);
 }}finally{e.target.value='';e.target.disabled=false;$('lock').disabled=false;render();}
};
function award(list,metric,direction,id,detail,description){
 if(!list.length){$(id).textContent='Nessun risultato idoneo';$(detail).textContent=description;return;}
 const best=Math[direction](...list.map(metric)),winners=list.filter(s=>Math.abs(metric(s)-best)<1e-9);
 $(id).textContent=winners.map(s=>`${s.name} (${s.className})`).join(' · ');$(detail).textContent=description(best);
}
function render(){
 rows=[...students.values()].map(s=>({...s,...summarize(s.attempts)})).sort((a,b)=>b.wins-a.wins||a.name.localeCompare(b.name,'it'));
 $('ranking').replaceChildren();
 for(const s of rows){const tr=document.createElement('tr');for(const value of [s.name,s.className,s.wins,s.total,s.broken,percent(s.brokenRate),seconds(s.fastestMs),s.inverse]){const td=document.createElement('td');td.textContent=value;tr.append(td);}$('ranking').append(tr);}
 const speed=rows.filter(s=>s.fastestMs!==null),precision=rows.filter(s=>s.fish>=20),games=rows.filter(s=>s.total>0);
 if(speed.length)award(speed,s=>s.fastestMs,'min','speed-winner','speed-detail',n=>`${seconds(n)} · almeno 3 bocce, prima prova`);else{$('speed-winner').textContent='Nessun risultato idoneo';$('speed-detail').textContent='Almeno 3 bocce, al primo tentativo.';}
 if(precision.length)award(precision,s=>s.brokenRate,'min','precision-winner','precision-detail',n=>`${percent(n)} di reti rotte · minimo 20 tentativi`);else{$('precision-winner').textContent='Servono più pescate';$('precision-detail').textContent='Almeno 20 tentativi di pesca per studente.';}
 if(games.length)award(games,s=>s.total,'max','games-winner','games-detail',n=>`${n} partite concluse`);else{$('games-winner').textContent='In attesa di partite';$('games-detail').textContent='Il maggior numero di partite concluse.';}
 $('totals').textContent=`${rows.length} studenti · ${seen.size} tentativi unici`;$('csv').disabled=!rows.length;
}
$('csv').onclick=()=>{
 const cell=v=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
 const data=[['Studente','Classe','Vinte','Tentativi','Reti rotte','Tentativi pesca','Percentuale rotte','Lampo secondi','Inverse vinte'],...rows.map(s=>[s.name,s.className,s.wins,s.total,s.broken,s.fish,s.brokenRate===null?'':(s.brokenRate*100).toFixed(2),s.fastestMs===null?'':(s.fastestMs/1000).toFixed(3),s.inverse])].map(r=>r.map(cell).join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob(['\uFEFF'+data],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='classifica-pesca-binaria.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);
};
