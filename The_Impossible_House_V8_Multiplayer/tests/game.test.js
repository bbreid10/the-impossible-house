'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),E=require('../engine.js'),G=require('../guide.js');
function setup(count=2){const g=E.newGame();for(let i=0;i<count;i++)E.addPlayer(g,{id:`p${i}`,name:`Explorer ${i+1}`});for(let i=1;i<count;i++)E.act(g,`p${i}`,{type:'READY',ready:true});ok(g,'p0',{type:'START'});return g;}
function ok(g,p,a){const res=E.act(g,p,a);assert.equal(res.ok,true,`Expected ${JSON.stringify(a)} to work on ${g.levelId}, got ${res.error}`);return g;}
function bad(g,p,a){const before=JSON.stringify(g);const r=E.act(g,p,a);assert.ok(r.error,`Expected ${JSON.stringify(a)} to be rejected`);assert.equal(JSON.stringify(g),before,'Rejected action must not change state');}
function prepareEvidence(g,p0='p0',p1='p1'){
 ok(g,p0,{type:'PROP',prop:'study'});
 ok(g,p1,{type:'SAFE',code:'231'});
 ok(g,p1,{type:'LEVER'});
}
function discoverLaw(g,p0='p0'){
 ok(g,p0,{type:'ROTATE',room:'B'});
 ok(g,p0,{type:'MOVE',to:'B'});
 ok(g,p0,{type:'PROP',prop:'plaque'});
 ok(g,p0,{type:'REWRITE',rule:'mirrors'});
 assert.equal(E.connection(g,'F','D').mirrored,true,'new mirror rule creates a real clickable door');
}
function finish1(g){
 prepareEvidence(g);discoverLaw(g);
 ok(g,'p1',{type:'MOVE',to:'D'});
 ok(g,'p0',{type:'ROTATE',room:'B'});ok(g,'p0',{type:'MOVE',to:'E'});
 assert.equal(g.exitUnlocked,true);ok(g,'p0',{type:'MOVE',to:'B'});ok(g,'p0',{type:'ROTATE',room:'B'});
 ok(g,'p0',{type:'MOVE',to:'C'});ok(g,'p1',{type:'MOVE',to:'A'});ok(g,'p1',{type:'MOVE',to:'B'});ok(g,'p1',{type:'MOVE',to:'C'});return g;
}
function finish2(g){ok(g,'p1',{type:'LEVER'});ok(g,'p0',{type:'MOVE',to:'D'});ok(g,'p0',{type:'INSCRIBE',rule:'linked'});ok(g,'p0',{type:'RULE',rule:'linked'});ok(g,'p0',{type:'ROTATE',room:'B'});assert.equal(g.rotation.E,3,'paired room must turn counterclockwise');ok(g,'p0',{type:'MOVE',to:'A'});ok(g,'p0',{type:'MOVE',to:'B'});ok(g,'p1',{type:'MOVE',to:'E'});ok(g,'p0',{type:'MOVE',to:'C'});ok(g,'p1',{type:'MOVE',to:'D'});ok(g,'p1',{type:'MOVE',to:'A'});ok(g,'p1',{type:'MOVE',to:'B'});ok(g,'p1',{type:'MOVE',to:'C'});return g;}
function finish3(g){ok(g,'p1',{type:'LEVER'});ok(g,'p0',{type:'MOVE',to:'D'});ok(g,'p0',{type:'INSCRIBE',rule:'borrowed'});ok(g,'p0',{type:'RULE',rule:'borrowed'});assert.equal(E.connection(g,'F','E').ok,true,'borrowed wall should be a door');ok(g,'p1',{type:'MOVE',to:'E'});ok(g,'p1',{type:'MOVE',to:'B'});ok(g,'p0',{type:'MOVE',to:'A'});ok(g,'p0',{type:'ROTATE',room:'B'});ok(g,'p0',{type:'MOVE',to:'B'});ok(g,'p0',{type:'DIAL',index:0,delta:1});ok(g,'p0',{type:'DIAL',index:0,delta:1});ok(g,'p0',{type:'DIAL',index:1,delta:-1});assert.equal(g.dialSolved,true);ok(g,'p0',{type:'MOVE',to:'C'});ok(g,'p1',{type:'MOVE',to:'C'});return g;}
function finishFinal(g){ok(g,'p0',{type:'RULE',rule:'mirrors'});ok(g,'p1',{type:'PORTAL'});ok(g,'p0',{type:'ROTATE',room:'B'});ok(g,'p0',{type:'MOVE',to:'B'});ok(g,'p0',{type:'ROTATE',room:'B'});ok(g,'p0',{type:'MOVE',to:'E'});assert.equal(g.echoSeal,true);assert.equal(g.exitUnlocked,false);ok(g,'p0',{type:'RULE',rule:'linked'});ok(g,'p0',{type:'ROTATE',room:'B'});assert.equal(g.heartRang,true);ok(g,'p0',{type:'ROTATE',room:'B'});ok(g,'p0',{type:'MOVE',to:'B'});ok(g,'p0',{type:'ROTATE',room:'B'});ok(g,'p0',{type:'RULE',rule:'borrowed'});assert.equal(E.connection(g,'B','C').ok,true);ok(g,'p0',{type:'MOVE',to:'C'});ok(g,'p1',{type:'MOVE',to:'A'});ok(g,'p1',{type:'MOVE',to:'B'});ok(g,'p1',{type:'MOVE',to:'C'});return g;}

test('Doors only connect when orientations match, and rules are earned',()=>{
 const g=setup();assert.equal(E.connection(g,'A','D').ok,true);assert.equal(E.connection(g,'A','B').ok,false);
 bad(g,'p0',{type:'MOVE',to:'B'});bad(g,'p0',{type:'ROTATE',room:'B'});bad(g,'p1',{type:'PORTAL'});bad(g,'p0',{type:'RULE',rule:'linked'});bad(g,'p1',{type:'INSCRIBE',rule:'mirrors'});
 bad(g,'p1',{type:'LEVER'});prepareEvidence(g);ok(g,'p0',{type:'ROTATE',room:'B'});assert.equal(E.connection(g,'A','B').ok,true);
});
test('First chapter cooperatively reveals cards, opens seals, and moves both explorers out',()=>{
 const g=setup();finish1(g);assert.equal(g.phase,'intermission');assert.deepEqual(g.unlockedRules,['mirrors']);assert.equal(g.results.length,1);assert.equal(g.results[0].stars,3);
});
test('Six chapter campaign includes two collaborative logic puzzles before the final rule swap',()=>{
 const g=setup();finish1(g);ok(g,'p0',{type:'NEXT'});finish2(g);ok(g,'p0',{type:'NEXT'});finish3(g);
 for(const stage of ['floor4','floor5']){
  ok(g,'p0',{type:'NEXT'});assert.equal(g.levelId,stage);
  const path=G.solve(g,{limit:25000});assert.ok(path&&!path.unsolved,stage+' must be solvable');
  for(const step of path.steps)ok(g,step.playerId,step.action);
  assert.equal(g.phase,'intermission');assert.ok(g.cluesRead.length>=2);
  if(stage==='floor4')assert.equal(g.riddleSolved,true);
  if(stage==='floor5')assert.equal(g.runeProgress,3);
 }
 ok(g,'p0',{type:'NEXT'});assert.deepEqual(g.unlockedRules,['mirrors','linked','borrowed']);finishFinal(g);
 assert.equal(g.phase,'complete');assert.equal(g.results.length,6);assert.ok(g.results.every(r=>r.stars>=1));
});
test('Logic clues must be found, and a wrong answer never ends a run',()=>{
 const g=setup();finish1(g);ok(g,'p0',{type:'NEXT'});finish2(g);ok(g,'p0',{type:'NEXT'});finish3(g);ok(g,'p0',{type:'NEXT'});
 bad(g,'p0',{type:'RIDDLE',answer:'moon'}); // Not in the riddle room yet
 ok(g,'p0',{type:'CLUE'});ok(g,'p1',{type:'CLUE'});
 ok(g,'p0',{type:'ROTATE',room:'B'});ok(g,'p0',{type:'MOVE',to:'B'});
 ok(g,'p0',{type:'RIDDLE',answer:'clock'});assert.equal(g.riddleSolved,false);assert.equal(g.puzzleMistakes,1);assert.equal(g.phase,'playing');
 ok(g,'p0',{type:'RIDDLE',answer:'moon'});assert.equal(g.riddleSolved,true);
});
test('Pressure plates need distinct explorers and every explorer must reach the exit',()=>{
 const g=setup(3);prepareEvidence(g);discoverLaw(g);ok(g,'p1',{type:'MOVE',to:'D'});ok(g,'p0',{type:'ROTATE',room:'B'});ok(g,'p0',{type:'MOVE',to:'E'});assert.equal(g.exitUnlocked,true);
 ok(g,'p0',{type:'MOVE',to:'B'});ok(g,'p0',{type:'ROTATE',room:'B'});ok(g,'p0',{type:'MOVE',to:'C'});ok(g,'p1',{type:'MOVE',to:'A'});ok(g,'p1',{type:'MOVE',to:'B'});ok(g,'p1',{type:'MOVE',to:'C'});
 assert.equal(g.phase,'playing','third explorer still needs to reach exit');ok(g,'p2',{type:'MOVE',to:'B'});ok(g,'p2',{type:'MOVE',to:'C'});assert.equal(g.phase,'intermission');
});
test('A reset restores the stage and cannot be executed by guests',()=>{
 const g=setup();prepareEvidence(g);ok(g,'p0',{type:'ROTATE',room:'B'});bad(g,'p1',{type:'RESET'});ok(g,'p0',{type:'RESET'});assert.equal(g.leverEnabled,false);assert.equal(g.rotation.B,0);assert.equal(g.players[1].room,'F');
});
test('Names and character choices are sanitized and limits are enforced',()=>{
 const a=E.cleanAvatar({hair:'dinosaur',skin:'#111111',outfit:'#FFFFFF',accessory:'star pin',clothes:'dress'});
 assert.equal(a.skin,E.avatarFallback.skin);assert.equal(a.hair,E.avatarFallback.hair);assert.equal(a.outfit,E.avatarFallback.outfit);
 assert.equal(a.accessory,'star pin');assert.equal(a.clothes,'dress');assert.equal(E.cleanName('<<HELLO>>'), 'HELLO');assert.equal(E.cleanName('a'.repeat(40)).length,16);
});
test('No irreversible timer or move caps, and hints only affect score',()=>{
 const g=setup();for(let i=0;i<5;i++)ok(g,'p0',{type:'HINT'});assert.equal(g.phase,'playing');assert.equal(g.hintsUsed,5);assert.equal(g.startedAt!==null,true);
});
test('Solo playtesters may jump to any chapter, but online rooms cannot skip floors',()=>{
 const solo=E.newGame({solo:true});E.addPlayer(solo,{id:'a',name:'A'});E.addPlayer(solo,{id:'b',name:'B'});ok(solo,'b',{type:'READY',ready:true});ok(solo,'a',{type:'START'});
 ok(solo,'a',{type:'CHAPTER',index:4});assert.equal(solo.levelId,'floor5');assert.deepEqual(solo.unlockedRules,['mirrors','linked','borrowed']);
 assert.equal(solo.players[0].room,'A');assert.equal(solo.players[1].room,'F');
 const online=setup();bad(online,'p0',{type:'CHAPTER',index:4});bad(solo,'b',{type:'CHAPTER',index:3});
});
