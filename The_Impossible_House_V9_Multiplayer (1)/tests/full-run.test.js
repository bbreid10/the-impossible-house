/* Real HTTP integration: two separate clients, filtered chat, entire campaign. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path');
const Guide=require('../guide.js');
const port=57000+Math.floor(Math.random()*7000),base='http://127.0.0.1:'+port;let server;
async function post(url,body){const r=await fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};}
async function wait(){for(let i=0;i<35;i++){try{if((await fetch(base+'/api/health')).ok)return;}catch{}await new Promise(r=>setTimeout(r,100));}throw Error('Server not ready');}
test.before(async()=>{server=spawn(process.execPath,[path.join(__dirname,'..','server.js')],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:String(port)},stdio:'ignore'});await wait();});
test.after(()=>server?.kill('SIGTERM'));
test('Two authenticated network clients solve all six chapters and send filtered chat',async()=>{
 const host=(await post('/api/create',{visibility:'private',name:'Avery'})).body;
 const guest=(await post('/api/join',{code:host.code,name:'Sam'})).body;
 async function act(who,action){const res=await post('/api/action',{code:host.code,token:who.token,action});assert.equal(res.status,200,`${action.type}: ${JSON.stringify(res.body)}`);return res.body.state;}
 let g=await act(guest,{type:'READY',ready:true});g=await act(host,{type:'START'});
 g=await act(host,{type:'CHAT',text:'Please read your half of the clue!'});assert.equal(g.chat.length,1);
 g=await act(guest,{type:'CHAT',text:'This is a fucking weird house!'});assert.ok(g.chat[1].text.includes('****'));
 for(let stage=0;stage<6;stage++){
  const solution=Guide.solve(g,{limit:25000});assert.ok(solution&&!solution.unsolved,`stage ${stage+1} must be solvable`);
  assert.ok(solution.steps.length>=6);
  for(const step of solution.steps)g=await act(step.playerId===host.playerId?host:guest,step.action);
  assert.equal(g.phase,stage===5?'complete':'intermission');
  if(stage!==5)g=await act(host,{type:'NEXT'});
 }
 assert.equal(g.phase,'complete');assert.equal(g.results.length,6);assert.deepEqual(g.players.map(p=>p.room),['C','C']);
});
