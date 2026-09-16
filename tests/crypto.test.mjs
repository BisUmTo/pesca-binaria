import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seal,unseal,unlock,to64,from64} from '../docs/crypto.mjs';
test('LOG cifrato: round trip, chiave errata e manomissione',async()=>{
 const keys=await crypto.subtle.generateKey({name:'RSA-OAEP',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['encrypt','decrypt']);
 const pub=await crypto.subtle.exportKey('jwk',keys.publicKey),priv=await crypto.subtle.exportKey('jwk',keys.privateKey);
 const key=await unlock(priv,pub),log={name:'Studente prova',attempts:[{target:13}]};
 const envelope=await seal(log,pub);assert.deepEqual(await unseal(envelope,key),log);
 assert.ok(!JSON.stringify(envelope).includes('Studente prova'));
 const bytes=from64(envelope.ciphertext);bytes[0]^=1;
 await assert.rejects(()=>unseal({...envelope,ciphertext:to64(bytes)},key));
 await assert.rejects(()=>unlock({...priv,n:'wrong'},pub));
 const other=await crypto.subtle.generateKey({name:'RSA-OAEP',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['encrypt','decrypt']);
 await assert.rejects(()=>unseal(envelope,other.privateKey));
});
