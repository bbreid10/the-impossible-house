'use strict';
/* V8 regression coverage: a House Rule changes *actual passages*, not prose.
 * The deterministic engine is the same module used by the multiplayer server. */
const test=require('node:test'), assert=require('node:assert/strict'), E=require('../engine.js');
function expedition(index){const g=E.newGame({solo:true});E.addPlayer(g,{id:'one',name:'Ava'});E.addPlayer(g,{id:'two',name:'Cole'});E.act(g,'two',{type:'READY',ready:true});assert.ok(E.act(g,'one',{type:'START'}).ok);if(index)assert.ok(E.act(g,'one',{type:'CHAPTER',index}).ok);return g;}
test('linked rule adds a traversable gear shaft, even when room doors face wrong directions',()=>{
 const g=expedition(1);g.unlockedRules.push('linked');assert.ok(E.act(g,'one',{type:'RULE',rule:'linked'}).ok);
 const effect=E.ruleEffect(g,'linked');assert.deepEqual(effect.rooms,['B','E']);
 assert.ok(E.act(g,'two',{type:'LEVER'}).ok);
 // Rotate B and its sister E one quarter in opposite directions. Ordinary
 // south-to-north door alignment is broken, but the law maintains the shaft.
 assert.ok(E.act(g,'one',{type:'ROTATE',room:'B',dir:1}).ok);
 assert.equal(E.doorsAt(g,'B').includes('S'),false);
 assert.equal(E.connection(g,'B','E').geared,true);
 assert.ok(g.lastRewrite.ways.some(t=>t.includes('B ↔ E')));
 assert.ok(E.act(g,'one',{type:'RULE',rule:null}).ok);
 assert.equal(E.connection(g,'B','E').ok,false,'undoing the law closes the magical shaft');
});
test('walls become doors opens multiple previously sealed stone passages',()=>{
 const g=expedition(2);g.unlockedRules.push('borrowed');
 assert.equal(E.connection(g,'D','E').ok,false);
 assert.equal(E.connection(g,'E','F').ok,false);
 assert.ok(E.act(g,'one',{type:'RULE',rule:'borrowed'}).ok);
 assert.equal(E.connection(g,'D','E').borrowed,true);
 assert.equal(E.connection(g,'E','F').borrowed,true);
 assert.equal(E.ruleEffect(g,'borrowed').ways.length,2);
});
test('mirrors are doors allows remote clue reconnaissance from reflection',()=>{
 const g=expedition(3);g.unlockedRules.push('mirrors');
 assert.ok(E.act(g,'one',{type:'RULE',rule:'mirrors'}).ok);
 const p=g.players[0];p.room='D';
 assert.ok(E.act(g,'one',{type:'REFLECT'}).ok);
 assert.ok(g.cluesRead.includes('F'),'remote clue from mirror room F was read');
 assert.ok(g.journal.some(x=>x.key==='floor4-reflection-F'));
 assert.equal(E.act(g,'one',{type:'REFLECT'}).error.includes('already'),true);
});
test('only one law operates at a time and replacing a law closes its previous passages',()=>{
 const g=expedition(5);g.unlockedRules.push('mirrors','linked','borrowed');
 assert.ok(E.act(g,'one',{type:'RULE',rule:'mirrors'}).ok);
 assert.ok(g.lastRewrite.rooms.includes('F'));
 assert.ok(E.act(g,'one',{type:'RULE',rule:'borrowed'}).ok);
 assert.equal(g.lastRewrite.old,'mirrors');
 assert.equal(g.activeRule,'borrowed');
 assert.equal(E.connection(g,'E','F').borrowed,true);
 assert.equal(g.lastRewrite.ways.length,2);
});
