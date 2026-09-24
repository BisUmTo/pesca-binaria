// Count decision time, excluding intervals when input is blocked by animation.
export function createAttemptClock(now=()=>performance.now()){
 let started=now(),offset=0,pausedAt=null;
 return {
  start(savedMs=0){started=now();offset=savedMs;pausedAt=null;},
  elapsed(){return Math.round(offset+(pausedAt??now())-started);},
  pause(){if(pausedAt===null)pausedAt=now();},
  resume(){if(pausedAt!==null){offset-=now()-pausedAt;pausedAt=null;}}
 };
}
