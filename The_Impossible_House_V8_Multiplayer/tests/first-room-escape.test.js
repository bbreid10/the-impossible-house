/* V12 regression: clues, physical cabinet, world rewrite, multi-person escape. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../engine.js');
function start(){const g=E.newGame({solo:true});E.addPlayer(g,{id:'one',name:'Riley'});E.addPlayer(g,{id:'two',name:'June'});E.act(g,'two',{type:'READY',ready:true});assert.ok(E.act(g,'one',{type:'START'}).ok);return g;}
function doIt(g,p,a){const r=E.act(g,p,a);assert.equal(r.ok,true,`${p} ${a.type}: ${r.error}`);return r;}
test('Chapter 1 requires discovered evidence; room movement never awards words by accident',()=>{
 const g=start();
 assert.equal(E.objective(g,g.players[0]).action,'PROP');
 assert.ok(E.act(g,'two',{type:'LEVER'}).error);
 assert.ok(E.act(g,'two',{type:'SAFE',code:'231'}).error,'letter is required first');
 assert.ok(E.act(g,'two',{type:'PROP',prop:'study'}).error,'player in F cannot remotely read desk A');
 assert.deepEqual(g.shards,[]);
 doIt(g,'one',{type:'PROP',prop:'study'});assert.match(g.journal[0].description,/☾☾/);
 assert.equal(E.objective(g,g.players[0]).action,'SAFE');
 doIt(g,'two',{type:'SAFE',code:'111'});assert.equal(g.safeAttempts,1);assert.equal(g.shards.length,0);
 doIt(g,'two',{type:'SAFE',code:'231'});assert.equal(g.shards.includes('ARE DOORS'),true);
 doIt(g,'two',{type:'LEVER'});
 doIt(g,'one',{type:'ROTATE',room:'B',dir:1});doIt(g,'one',{type:'MOVE',to:'B'});
 assert.equal(g.shards.includes('MIRRORS'),false,'physical inscription must be inspected');
 assert.ok(E.act(g,'two',{type:'PROP',prop:'plaque'}).error,'F explorer cannot search the turning hall');
 doIt(g,'one',{type:'PROP',prop:'plaque'});
 assert.equal(E.objective(g,g.players[0]).action,'REWRITE');
 assert.equal(E.connection(g,'F','D').ok,false,'no distant doorway until rewriting');
 doIt(g,'one',{type:'REWRITE',rule:'mirrors'});
 assert.equal(E.connection(g,'F','D').mirrored,true,'a new walkable mirror passage is real');
 assert.equal(g.ruleChanges,1);
 doIt(g,'two',{type:'MOVE',to:'D'});assert.equal(g.players[1].room,'D');
 assert.equal(g.exitUnlocked,false);
 doIt(g,'one',{type:'ROTATE',room:'B',dir:1});doIt(g,'one',{type:'MOVE',to:'E'});
 assert.equal(g.exitUnlocked,true,'moon and sun seals opened by two explorers');
});
test('A game save can be reset and evidence and locks reset together',()=>{
 const g=start();doIt(g,'one',{type:'PROP',prop:'study'});doIt(g,'two',{type:'SAFE',code:'231'});
 doIt(g,'one',{type:'RESET'});assert.deepEqual(g.firstProps,[]);assert.equal(g.safeAttempts,0);
 assert.deepEqual(g.shards,[]);assert.equal(g.leverEnabled,false);
});
test('Rule changes are reversible and their paths close when rules change',()=>{
 const g=start();doIt(g,'one',{type:'PROP',prop:'study'});doIt(g,'two',{type:'SAFE',code:'231'});doIt(g,'two',{type:'LEVER'});doIt(g,'one',{type:'ROTATE',room:'B',dir:1});doIt(g,'one',{type:'MOVE',to:'B'});doIt(g,'one',{type:'PROP',prop:'plaque'});doIt(g,'one',{type:'REWRITE',rule:'mirrors'});
 assert.equal(E.connection(g,'D','F').ok,true);
 doIt(g,'one',{type:'RULE',rule:null});assert.equal(E.connection(g,'D','F').ok,false);
 doIt(g,'one',{type:'RULE',rule:'mirrors'});assert.equal(E.connection(g,'D','F').ok,true);
});
