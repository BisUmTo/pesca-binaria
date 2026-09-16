const enc=new TextEncoder(),dec=new TextDecoder();
export const to64=bytes=>{let s='';for(const b of new Uint8Array(bytes))s+=String.fromCharCode(b);return btoa(s);};
export const from64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
export async function importPublic(jwk){return crypto.subtle.importKey('jwk',jwk,{name:'RSA-OAEP',hash:'SHA-256'},false,['encrypt']);}
export async function importPrivate(jwk){return crypto.subtle.importKey('jwk',jwk,{name:'RSA-OAEP',hash:'SHA-256'},false,['decrypt']);}
export async function seal(log,publicJwk){
 const pub=await importPublic(publicJwk),key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt']);
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode('pesca-binaria-v1')},key,enc.encode(JSON.stringify(log)));
 const wrappedKey=await crypto.subtle.encrypt({name:'RSA-OAEP'},pub,await crypto.subtle.exportKey('raw',key));
 return {format:'pesca-binaria',version:1,keyId:publicJwk.n.slice(0,20),iv:to64(iv),wrappedKey:to64(wrappedKey),ciphertext:to64(ciphertext)};
}
export async function unseal(envelope,privateKey){
 if(envelope?.format!=='pesca-binaria'||envelope.version!==1)throw Error('Formato file non riconosciuto');
 const raw=await crypto.subtle.decrypt({name:'RSA-OAEP'},privateKey,from64(envelope.wrappedKey));
 const key=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['decrypt']);
 return JSON.parse(dec.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:from64(envelope.iv),additionalData:enc.encode('pesca-binaria-v1')},key,from64(envelope.ciphertext))));
}
export async function unlock(jwk,publicJwk){
 if(jwk.n!==publicJwk.n||!jwk.d)throw Error('Questa chiave non appartiene al gioco');
 const key=await importPrivate(jwk),pub=await importPublic(publicJwk),nonce=crypto.getRandomValues(new Uint8Array(32));
 const encrypted=await crypto.subtle.encrypt('RSA-OAEP',pub,nonce);
 const plain=new Uint8Array(await crypto.subtle.decrypt('RSA-OAEP',key,encrypted));
 if(!plain.every((v,i)=>v===nonce[i]))throw Error('Chiave non valida');return key;
}
