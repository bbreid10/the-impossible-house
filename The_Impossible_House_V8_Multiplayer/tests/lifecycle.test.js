/* Room lifecycle: users can leave a waiting room and the host can restart a stuck run. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path');
const port=54000+Math.floor(Math.random()*2200),base='http://127.0.0.1:'+port;
let child;
async function request(pathname,body){const r=await fetch(base+pathname,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};}
async function wait(){for(let n=0;n<40;n++){try{if((await fetch(base+'/api/health')).ok)return;}catch{}await new Promise(r=>setTimeout(r,80));}throw Error('No server');}
test.before(async()=>{child=spawn(process.execPath,[path.join(__dirname,'..','server.js')],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:String(port)},stdio:'ignore'});await wait();});
test.after(()=>child?.kill('SIGTERM'));
test('Leaves waiting rooms cleanly; host can reopen floor with disconnected guests removed',async()=>{
  const host=(await request('/api/create',{visibility:'public',name:'H'})).body;
  let guest=(await request('/api/join',{code:host.code,name:'G'})).body;
  assert.equal((await request('/api/leave',{code:host.code,token:guest.token})).status,200);
  const list=await (await fetch(base+'/api/rooms/public')).json();
  assert.equal(list.rooms.find(r=>r.code===host.code).count,1);
  guest=(await request('/api/join',{code:host.code,name:'G2'})).body;
  await request('/api/action',{code:host.code,token:guest.token,action:{type:'READY',ready:true}});
  let r=await request('/api/action',{code:host.code,token:host.token,action:{type:'START'}});assert.equal(r.body.state.phase,'playing');
  r=await request('/api/leave',{code:host.code,token:guest.token});assert.equal(r.status,200);
  r=await request('/api/action',{code:host.code,token:host.token,action:{type:'REOPEN'}});
  assert.equal(r.status,200);assert.equal(r.body.state.phase,'lobby');assert.equal(r.body.state.players.length,1);
  const newGuest=await request('/api/join',{code:host.code,name:'Replacement'});assert.equal(newGuest.status,200);
});
