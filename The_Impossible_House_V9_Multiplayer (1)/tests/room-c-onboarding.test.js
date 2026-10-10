/* Chapter 1 walkthrough regression: the exit is sealed, physical doors turn,
   the rule changes movement, and both explorers can eventually escape. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),Engine=require('../engine.js'),fs=require('node:fs'),path=require('node:path');
function setup(){
 const g=Engine.newGame({solo:true});
 Engine.addPlayer(g,{id:'alex',name:'Alex'});Engine.addPlayer(g,{id:'june',name:'June'});
 assert.ok(Engine.act(g,'june',{type:'READY',ready:true}).ok);
 assert.ok(Engine.act(g,'alex',{type:'START'}).ok);
 return g;
}
test('Room C requires two simultaneous seals; rotation and MIRRORS ARE DOORS open a real route',()=>{
 const g=setup(),act=(player,action)=>{const result=Engine.act(g,player,action);assert.ok(result.ok,`could not ${action.type}: ${result.error}`);};
 assert.equal(Engine.connection(g,'B','C').ok,false,'exit begins locked and B begins vertical');
 act('june',{type:'LEVER'});
 act('alex',{type:'ROTATE',room:'B',dir:1});
 assert.equal(Engine.doorsAt(g,'B').includes('W'),true);
 assert.equal(Engine.connection(g,'B','C').ok,false,'exit still sealed with doors facing correctly');
 act('alex',{type:'MOVE',to:'B'});
 act('alex',{type:'INSCRIBE',rule:'mirrors'});
 act('alex',{type:'RULE',rule:'mirrors'});
 assert.equal(Engine.connection(g,'F','D').ok,false,'the mirror is not an ordinary adjacent door');
 act('june',{type:'PORTAL'});
 assert.equal(g.players.find(p=>p.id==='june').room,'D','rule teleports isolated explorer to Moon Seal');
 act('alex',{type:'ROTATE',room:'B',dir:1});
 act('alex',{type:'MOVE',to:'E'});
 assert.equal(g.echoSeal,true,'two distinct people on D and E activate both seals');
 assert.equal(g.exitUnlocked,true,'exit unseals after both seals');
 act('alex',{type:'MOVE',to:'B'});
 act('alex',{type:'ROTATE',room:'B',dir:1});
 act('alex',{type:'MOVE',to:'C'});
 act('june',{type:'MOVE',to:'A'});
 act('june',{type:'MOVE',to:'B'});
 act('june',{type:'MOVE',to:'C'});
 assert.equal(g.phase,'intermission');
 assert.deepEqual(g.players.map(p=>p.room),['C','C']);
});
test('The main UI teaches the opening escape and does not add a word search home shortcut',()=>{
 const src=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
 assert.match(src,/class="rotate-dock"/);
 assert.match(src,/class="room-c-guide"/);
 assert.match(src,/class="reality-explainer"/);
 assert.doesNotMatch(src,/case 'hunt-demo'/);
 assert.match(src,/id="word-hunt-panel"/);
 assert.doesNotMatch(src,/case 'jump-hunt'/);
 assert.match(src,/function exitRouteHelp/);
 assert.match(src,/class=\"rewrite-banner\"/);
 assert.match(src,/case 'reflect'/);
});
