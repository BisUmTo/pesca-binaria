const files={pick:'drop_001',win:'confirmation_002',break:'glass_001',wrong:'error_004',click:'click_003'};
let sound=true,reduced=false;const voices=[];
export function configureEffects(settings){sound=settings.sound;reduced=settings.reduced;if(!sound)for(const voice of voices)voice.pause();}
export function playSound(name){
 if(!sound||typeof Audio==='undefined'||!files[name])return;
 const voice=new Audio(`assets/audio/${files[name]}.wav`);voice.volume=name==='win'?.3:.23;
 voices.push(voice);if(voices.length>6)voices.shift().pause();voice.play().catch(()=>{});
}
export async function flyMarble(origin,destination,color,hue){
 if(reduced||!origin?.animate||!destination)return;
 const a=origin.getBoundingClientRect(),b=destination.getBoundingClientRect(),clone=origin.cloneNode(true);clone.className='orb orb-flight';
 Object.assign(clone.style,{left:`${a.left}px`,top:`${a.top}px`,width:`${a.width}px`,height:`${a.height}px`});
 clone.style.setProperty('--orb-color',color);clone.style.setProperty('--hue',hue);clone.setAttribute('aria-hidden','true');document.body.append(clone);
 const dx=b.left+b.width/2-a.left-a.width/2,dy=b.top+b.height/2-a.top-a.height/2;
 try{await clone.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx*.55}px,${dy*.3-20}px) scale(1.1)`,offset:.45,opacity:1},{transform:`translate(${dx}px,${dy}px) scale(${b.width/a.width})`,opacity:1}],{duration:360,easing:'cubic-bezier(.25,.65,.45,1)',fill:'forwards'}).finished;}catch{}finally{clone.remove();}
}
export function celebrate(anchor){
 if(reduced||!anchor?.animate)return;const box=anchor.getBoundingClientRect();
 for(let i=0;i<14;i++){
  const particle=document.createElement('span');particle.className='spark';particle.setAttribute('aria-hidden','true');Object.assign(particle.style,{left:`${box.left+box.width/2}px`,top:`${box.top+15}px`,opacity:'.8'});document.body.append(particle);
  const angle=Math.PI*2*i/14,dx=Math.cos(angle)*(60+i*5),dy=Math.sin(angle)*(35+i*4)-30;
  particle.animate([{transform:'translate(0,0) scale(.2)',opacity:1},{transform:`translate(${dx}px,${dy}px) rotate(${i*40}deg) scale(1)`,opacity:.9,offset:.65},{transform:`translate(${dx*1.2}px,${dy+45}px) scale(.3)`,opacity:0}],{duration:650,easing:'ease-out'}).finished.catch(()=>{}).finally(()=>particle.remove());
 }
}
