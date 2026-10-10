/* Game balancing: beginner guide always proposes legal, solvable puzzle actions. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),E=require('../engine.js'),G=require('../guide.js');
function fresh(){const g=E.newGame({solo:true});E.addPlayer(g,{id:'a',name:'Avery'});E.addPlayer(g,{id:'b',name:'Briar'});E.act(g,'b',{type:'READY',ready:true});E.act(g,'a',{type:'START'});return g;}
test('Guide can solve all six chapters using only legal actions',()=>{
 const g=fresh();for(let chapter=0;chapter<6;chapter++){
  const result=G.solve(g,{limit:10000});assert.ok(result&&!result.unsolved,`Guide failed chapter ${chapter+1}`);
  assert.ok(result.steps.length>=5,`Chapter ${chapter+1} unexpectedly short`);
  for(const step of result.steps){const played=E.act(g,step.playerId,step.action);assert.equal(played.ok,true,`${chapter+1}: ${step.action.type}, ${played.error}`);}
  assert.equal(g.phase,chapter===5?'complete':'intermission');
  if(chapter!==5)assert.equal(E.act(g,'a',{type:'NEXT'}).ok,true);
 }
 assert.equal(g.results.length,6);
});
test('Guide recovers after rotating the wrong way, without a restart',()=>{
 const g=fresh();assert.equal(E.act(g,'b',{type:'LEVER'}).ok,true);
 for(let n=0;n<3;n++)E.act(g,'a',{type:'ROTATE',room:'B',dir:1});
 const path=G.solve(g,{limit:10000});assert.ok(path&&!path.unsolved);assert.ok(path.steps.length>3);
 path.steps.forEach(step=>assert.equal(E.act(g,step.playerId,step.action).ok,true));
 assert.equal(g.phase,'intermission');
});
test('Hidden keepsakes require exploring their specific room and can be collected only once',()=>{
 const g=fresh();assert.ok(E.act(g,'a',{type:'SEARCH'}).error);
 E.act(g,'b',{type:'LEVER'});E.act(g,'a',{type:'ROTATE',room:'B'});E.act(g,'a',{type:'MOVE',to:'B'});E.act(g,'a',{type:'ROTATE',room:'B'});E.act(g,'a',{type:'MOVE',to:'E'});
 assert.equal(E.act(g,'a',{type:'SEARCH'}).ok,true);assert.equal(g.foundSecrets.length,1);
 assert.equal(g.foundSecrets[0].id,'moon-key');assert.ok(E.act(g,'a',{type:'SEARCH'}).error);
 const path=G.solve(g);assert.ok(path&&!path.unsolved);path.steps.forEach(s=>assert.equal(E.act(g,s.playerId,s.action).ok,true));
 E.act(g,'a',{type:'NEXT'});assert.equal(g.foundSecrets.length,1,'Keepsakes persist between floors');
});
