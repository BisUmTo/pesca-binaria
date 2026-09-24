import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAttemptClock} from '../docs/clock.mjs';
test('tempo di ragionamento uguale con e senza animazioni',()=>{
 function solve(animationMs){let now=0;const clock=createAttemptClock(()=>now);clock.start();const picks=[];
  for(let i=0;i<3;i++){now+=100;picks.push(clock.elapsed());clock.pause();now+=animationMs;assert.equal(clock.elapsed(),(i+1)*100);clock.resume();}
  return picks;
 }
 assert.deepEqual(solve(360),solve(0));assert.deepEqual(solve(360),[100,200,300]);
});
test('ripresa e pausa ripetuta non duplicano né perdono tempo',()=>{
 let now=1000;const clock=createAttemptClock(()=>now);clock.start(250);now+=100;clock.pause();now+=50;clock.pause();now+=100;assert.equal(clock.elapsed(),350);clock.resume();clock.resume();now+=60;assert.equal(clock.elapsed(),410);
});
