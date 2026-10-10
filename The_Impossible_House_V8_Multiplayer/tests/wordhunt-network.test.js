/* Genuine HTTP integration: two independent authenticated clients share one hunt. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path');
const Guide=require('../guide.js'),E=require('../engine.js');
const port=45000+Math.floor(Math.random()*2500),base='http://127.0.0.1:'+port;let server;
async function post(url,body){const r=await fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};}
async function wait(){for(let i=0;i<35;i++){try{if((await fetch(base+'/api/health')).ok)return;}catch{}await new Promise(r=>setTimeout(r,100));}throw Error('Server not ready');}
test.before(async()=>{server=spawn(process.execPath,[path.join(__dirname,'..','server.js')],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:String(port)},stdio:'ignore'});await wait();});
test.after(()=>server?.kill('SIGTERM'));
test('Two live remote clients find alternating words and see the same discoveries',async()=>{
 const host=(await post('/api/create',{name:'Ada'})).body;
 const guest=(await post('/api/join',{code:host.code,name:'Robin'})).body;
 async function act(who,action){const r=await post('/api/action',{code:host.code,token:who.token,action});assert.equal(r.status,200,JSON.stringify(r.body));return r.body.state;}
 async function snap(who){const response=await fetch(base+'/api/state?code='+host.code,{headers:{Authorization:'Bearer '+who.token}});assert.equal(response.status,200);return (await response.json()).state;}
 let g=await act(guest,{type:'READY',ready:true});g=await act(host,{type:'START'});
 for(const step of Guide.solve(g,{limit:25000}).steps){g=await act(step.playerId===host.playerId?host:guest,step.action);}
 assert.equal(g.phase,'intermission');g=await act(host,{type:'NEXT'});assert.equal(g.levelId,'floor2');
 g=await act(host,{type:'MOVE',to:'D'});g=await act(host,{type:'HUNT_START'});assert.equal(g.hunt.status,'active');
 const board=E.HUNTS.floor2;
 const a=board.placements[board.words[0]],b=board.placements[board.words[1]];
 const [r1,r2]=await Promise.all([
  post('/api/action',{code:host.code,token:host.token,action:{type:'HUNT_FIND',from:a[0],to:a.at(-1)}}),
  post('/api/action',{code:host.code,token:guest.token,action:{type:'HUNT_FIND',from:b[0],to:b.at(-1)}})
 ]);
 assert.equal(r1.status,200);assert.equal(r2.status,200);
 const [hostNow,guestNow]=await Promise.all([snap(host),snap(guest)]);
 assert.deepEqual(hostNow.hunt.found,guestNow.hunt.found);
 assert.equal(hostNow.hunt.found.length,2);
 assert.deepEqual(new Set(hostNow.hunt.found.map(x=>x.by)),new Set(['Ada','Robin']));
 for(const word of board.words.slice(2)){
  const cells=board.placements[word];g=await act(guest,{type:'HUNT_FIND',from:cells[0],to:cells.at(-1)});
 }
 assert.equal(g.hunt.status,'complete');assert.equal(g.insightTokens,1);
 assert.equal((await snap(host)).hunt.found.length,5);
});
