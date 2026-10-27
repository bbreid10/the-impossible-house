'use strict';const test=require('node:test'),assert=require('node:assert/strict'),E=require('../engine');
function solo(){return E.newGame({solo:true});}
function readyOne(g,id='solo'){while(g.fold<2)assert.equal(E.action(g,id,{type:'FOLD'}).ok,true);while(g.dial!==3)E.action(g,id,{type:'ROTATE',dir:1});assert.equal(E.ready(g),true);}
function pass(g,id='solo'){assert.equal(E.action(g,id,{type:'SEND'}).ok,true);E.tick(g,6000);assert.equal(g.status,'landed');assert.equal(E.action(g,id,{type:'NEXT'}).ok,true);}
test('First stage physically requires bridge and aligned gate',()=>{let g=solo();assert.equal(E.ready(g),false);E.action(g,'solo',{type:'FOLD'});assert.equal(E.ready(g),false);readyOne(g);assert.equal(E.ready(g),true);});
test('Solo can complete the entire three-crossing service',()=>{let g=solo();readyOne(g);pass(g);assert.equal(g.stageIndex,1);while(g.dial!==1)E.action(g,'solo',{type:'ROTATE'});E.action(g,'solo',{type:'FOCUS'});E.action(g,'solo',{type:'FOCUS'});assert.equal(E.ready(g),true);pass(g);E.action(g,'solo',{type:'FOLD'});while(g.dial!==2)E.action(g,'solo',{type:'ROTATE'});E.action(g,'solo',{type:'BEACON'});assert.equal(E.ready(g),true);pass(g);assert.equal(g.phase,'complete');assert.equal(g.delivered,3);});
test('An incomplete crossing cannot dispatch the train',()=>{let g=solo();assert.match(E.action(g,'solo',{type:'SEND'}).error,/not connected/);});
test('The train is safe while a player studies mechanisms',()=>{let g=solo(),p=g.progress;for(let i=0;i<20;i++)E.tick(g,100);assert.equal(g.progress,p);});
test('No mechanism manipulation during transit',()=>{let g=solo();readyOne(g);E.action(g,'solo',{type:'SEND'});assert.ok(E.action(g,'solo',{type:'ROTATE'}).error);});
test('Multiplayer cannot operate the hinged bridge alone',()=>{let g=E.newGame({solo:false});E.addPlayer(g,{id:'a',name:'Ada'});E.addPlayer(g,{id:'b',name:'Bea'});E.action(g,'b',{type:'READY',ready:true});assert.equal(E.action(g,'a',{type:'START'}).ok,true);assert.match(E.action(g,'a',{type:'FOLD'}).error,/brace/);assert.equal(E.action(g,'a',{type:'HOLD'}).ok,true);assert.match(E.action(g,'a',{type:'FOLD'}).error,/another worker/i);assert.equal(E.action(g,'b',{type:'FOLD'}).ok,true);assert.equal(g.fold,1);});
test('Cooperative controls remain available to 2, 3, or 4 actual players',()=>{for(let n=2;n<=4;n++){let g=E.newGame({solo:false});for(let i=0;i<n;i++)E.addPlayer(g,{id:'p'+i,name:'Player '+i});assert.equal(g.players.length,n);let x=E.addPlayer(g,{id:'fifth',name:'fifth'});if(n===4)assert.match(x.error,/four/);else assert.equal(x.ok,true);}});
test('Rule validity and stage target orientations',()=>{let g=solo();readyOne(g);pass(g);E.action(g,'solo',{type:'FOCUS'});assert.equal(E.ready(g),false);E.action(g,'solo',{type:'FOCUS'});assert.equal(E.ready(g),false);while(g.dial!==1)E.action(g,'solo',{type:'ROTATE'});assert.equal(E.ready(g),true);});
test('Private rooms cannot be made public by non-host',()=>{let g=E.newGame({solo:false});E.addPlayer(g,{id:'a'});E.addPlayer(g,{id:'b'});assert.ok(E.action(g,'b',{type:'VISIBILITY',visibility:'public'}).error);assert.equal(E.action(g,'a',{type:'VISIBILITY',visibility:'public'}).ok,true);});
test('Player names and chat text are sanitized',()=>{let g=E.newGame({solo:false});E.addPlayer(g,{id:'a',name:'<b>One</b>'});assert.equal(g.players[0].name,'bOne/b');E.action(g,'a',{type:'CHAT',text:'<script>alert(1)</script>'});assert.equal(g.chat[0].text,'scriptalert(1)/script');});
test('Two human co-op crew can finish every crossing with no bot',()=>{
 let g=E.newGame({solo:false});E.addPlayer(g,{id:'a',name:'North'});E.addPlayer(g,{id:'b',name:'South'});
 E.action(g,'b',{type:'READY',ready:true});assert.equal(E.action(g,'a',{type:'START'}).ok,true);assert.equal(g.players.length,2);
 E.action(g,'a',{type:'HOLD'});E.action(g,'b',{type:'FOLD'});E.action(g,'b',{type:'FOLD'});
 E.action(g,'b',{type:'ROTATE'});E.action(g,'b',{type:'ROTATE'});assert.equal(E.ready(g),true);
 E.action(g,'a',{type:'SEND'});E.tick(g,6000);E.action(g,'a',{type:'NEXT'});
 E.action(g,'a',{type:'ROTATE'});E.action(g,'b',{type:'ROTATE'});E.action(g,'b',{type:'FOCUS'});E.action(g,'a',{type:'FOCUS'});assert.equal(E.ready(g),true);
 E.action(g,'a',{type:'SEND'});E.tick(g,6000);E.action(g,'a',{type:'NEXT'});
 E.action(g,'b',{type:'FOLD'});E.action(g,'a',{type:'ROTATE'});E.action(g,'b',{type:'ROTATE'});E.action(g,'a',{type:'BEACON'});assert.equal(E.ready(g),true);
 E.action(g,'a',{type:'SEND'});E.tick(g,6000);E.action(g,'a',{type:'NEXT'});
 assert.equal(g.phase,'complete');assert.equal(g.delivered,3);
});
