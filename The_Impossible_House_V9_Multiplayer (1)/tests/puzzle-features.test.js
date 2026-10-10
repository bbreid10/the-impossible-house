'use strict';
// Tests new V6 mechanics without bypassing game action validation.
const test=require('node:test');const assert=require('node:assert/strict');
const E=require('../engine.js');
function gameAt(chapter){
 const g=E.newGame({solo:true});
 E.addPlayer(g,{id:'a',name:'Alex'});E.addPlayer(g,{id:'b',name:'Morgan'});
 E.act(g,'b',{type:'READY',ready:true});const start=E.act(g,'a',{type:'START'});assert.equal(start.ok,true);
 const move=E.act(g,'a',{type:'CHAPTER',index:chapter});assert.equal(move.ok,true);return g;
}
function pass(g,id,action){const x=E.act(g,id,action);assert.equal(x.ok,true,`${JSON.stringify(action)} failed: ${x.error}`);return x;}
function fails(g,id,action){const before=JSON.stringify(g);const x=E.act(g,id,action);assert.ok(x.error,`Expected action to fail ${JSON.stringify(action)}`);assert.equal(JSON.stringify(g),before);}

test('Each word hunt has 5 genuine straight-line paths with diagonal and reverse words',()=>{
 for(const [chapter,b] of Object.entries(E.HUNTS)){
  assert.equal(b.size,10);assert.equal(b.words.length,5);assert.equal(b.grid.length,100);
  let diag=false,reverse=false;
  for(const word of b.words){
   const positions=b.placements[word],first=positions[0],last=positions.at(-1),selection=E.selectedWord(b,first,last);
   assert.equal(selection.word,word,`Hidden ${word} in ${chapter}`);
   assert.deepEqual(selection.indices,positions);
   const dr=Math.floor(last/10)-Math.floor(first/10),dc=last%10-first%10;
   if(dr&&dc)diag=true;if(dr<0||dc<0)reverse=true;
  }
  assert.ok(diag&&reverse,`${chapter} must include diagonals and backwards words`);
 }
 assert.equal(E.selectedWord(E.HUNTS.floor2,0,23),null,'Crooked lines are invalid');
});

test('Two explorers simultaneously contribute to one authoritative word hunt and earn a shared reward',()=>{
 const g=gameAt(1),b=E.HUNTS.floor2;
 pass(g,'a',{type:'MOVE',to:'D'});
 pass(g,'a',{type:'HUNT_START'});assert.equal(g.hunt.status,'active');
 fails(g,'b',{type:'HUNT_START'});
 fails(g,'a',{type:'HUNT_FIND',from:0,to:23});
 let finder=['a','b','a','b','a'];
 for(const [i,word] of b.words.entries()){
  const cells=b.placements[word];const actor=finder[i];pass(g,actor,{type:'HUNT_FIND',from:cells[0],to:cells.at(-1)});
  assert.equal(g.hunt.found.length,i+1);assert.equal(g.hunt.found.at(-1).by,actor==='a'?'Alex':'Morgan');
  // A second player clicking the same word cannot double-count or double-award it.
  if(i===0){const before=JSON.stringify(g);const dup=pass(g,'b',{type:'HUNT_FIND',from:cells[0],to:cells.at(-1)});assert.equal(dup.duplicate,true);assert.equal(JSON.stringify(g),before);}
 }
 assert.equal(g.hunt.status,'complete');assert.equal(g.insightTokens,1);
 assert.equal(g.journal.filter(x=>x.key==='floor2-wordhunt').length,1);
 fails(g,'a',{type:'HUNT_START'});
 pass(g,'b',{type:'HINT'});assert.equal(g.insightTokens,0);assert.equal(g.hintsUsed,0,'Free insight should not cost score');
});

test('Expired hunts restart safely, do not prevent escapes, and reset between chapters',()=>{
 const g=gameAt(1),b=E.HUNTS.floor2,word=b.words[0],p=b.placements[word];
 fails(g,'a',{type:'HUNT_START'});pass(g,'a',{type:'MOVE',to:'D'});
 pass(g,'a',{type:'HUNT_START'});g.hunt.expiresAt=Date.now()-10;
 fails(g,'b',{type:'HUNT_FIND',from:p[0],to:p.at(-1)});
 pass(g,'a',{type:'HUNT_START'});assert.equal(g.hunt.attempts,2);assert.equal(g.hunt.found.length,0);
 const oldTokens=g.insightTokens;
 pass(g,'a',{type:'CHAPTER',index:5});assert.equal(g.hunt.status,'idle');assert.equal(g.hunt.attempts,0);
 assert.equal(g.insightTokens,oldTokens);
});

test('Brass orrery accepts only valid in-room dial turns and genuinely blocks the third floor exit',()=>{
 const g=gameAt(2),d=E.level(g).dial;
 assert.equal(g.dialSolved,false);assert.equal(d.room,'B');
 fails(g,'a',{type:'DIAL',index:0,delta:1});
 // A player must reach the instrument rather than manipulate it remotely.
 pass(g,'b',{type:'LEVER'});pass(g,'a',{type:'ROTATE',room:'B'});pass(g,'a',{type:'MOVE',to:'B'});
 fails(g,'a',{type:'DIAL',index:4,delta:1});fails(g,'a',{type:'DIAL',index:0,delta:2});
 assert.equal(g.exitUnlocked,false);
 pass(g,'a',{type:'DIAL',index:0,delta:1});pass(g,'a',{type:'DIAL',index:0,delta:1});
 assert.equal(g.dialSolved,false);
 pass(g,'a',{type:'DIAL',index:1,delta:-1});assert.equal(g.dialSolved,true);
 fails(g,'a',{type:'DIAL',index:2,delta:1});
});

test('Custom characters include mature clothing and natural hairstyles while rejecting arbitrary input',()=>{
 for(const hair of ['afro','twists','ponytail','side-part'])assert.equal(E.cleanAvatar({hair}).hair,hair);
 for(const clothes of ['blazer','turtleneck'])assert.equal(E.cleanAvatar({clothes}).clothes,clothes);
 assert.equal(E.cleanAvatar({hair:'not-real'}).hair,E.avatarFallback.hair);
});
