'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const path=require('node:path');
const {spawn}=require('node:child_process');
const port=48000+Math.floor(Math.random()*14000);
const base=`http://127.0.0.1:${port}`;
let server;
async function req(pathname,body){
  const r=await fetch(base+pathname,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const json=await r.json();return {status:r.status,body:json};
}
async function waitHealth(){for(let i=0;i<35;i++){try{const r=await req('/api/health');if(r.status===200)return;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}throw Error('Test server never became ready.');}
function watch(code,token,predicate){
  let request=null,buffer='';
  const ready=new Promise((resolve,reject)=>{
    request=http.get(`${base}/api/events?code=${code}&token=${token}`,(response)=>{
      response.setEncoding('utf8');response.on('data',chunk=>{
        buffer+=chunk;
        while(buffer.includes('\n\n')){
          const end=buffer.indexOf('\n\n');const frame=buffer.slice(0,end);buffer=buffer.slice(end+2);
          const event=frame.split('\n').find(line=>line.startsWith('data: '));
          if(event){try{const state=JSON.parse(event.slice(6));if(predicate(state)){resolve(state);request.destroy();return;}}catch(e){reject(e);request.destroy();return;}}
        }
      });
    });request.on('error',err=>{if(err.code!=='ECONNRESET')reject(err);});
  });
  return {ready,close:()=>request?.destroy()};
}
test.before(async()=>{
  server=spawn(process.execPath,[path.join(__dirname,'..','server.js')],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:String(port)},stdio:'ignore'});
  await waitHealth();
});
test.after(()=>{server?.kill('SIGTERM');});
test('Private and public room creation, visibility, joining, and synchronized live events',async()=>{
  const create=await req('/api/create',{name:'Ada',visibility:'private',avatar:{hair:'coils'}});
  assert.equal(create.status,200);
  const host=create.body,code=host.code;
  assert.match(code,/^[A-F0-9]{6}$/);
  let list=(await req('/api/rooms/public')).body.rooms;
  assert.equal(list.some(r=>r.code===code),false,'private lobby must not show in public discovery');
  const unauthorized=await req('/api/action',{code,token:'fake',action:{type:'READY',ready:false}});
  assert.equal(unauthorized.status,403);
  const guest=(await req('/api/join',{code,name:'Mara',avatar:{skin:'#8e5a42',hair:'braids'}})).body;
  assert.equal(guest.state.players.length,2);
  let res=await req('/api/action',{code,token:host.token,action:{type:'VISIBILITY',visibility:'public'}});
  assert.equal(res.status,200);
  list=(await req('/api/rooms/public')).body.rooms;
  assert.equal(list.some(r=>r.code===code),true,'public lobby must appear in discovery');
  const guestVisibility=await req('/api/action',{code,token:guest.token,action:{type:'VISIBILITY',visibility:'private'}});
  assert.equal(guestVisibility.status,400,'guest must not alter lobby visibility');
  res=await req('/api/action',{code,token:guest.token,action:{type:'CUSTOMIZE',name:'Mara Updated',avatar:{hair:'curls',outfit:'#a85e59'}}});
  assert.equal(res.body.state.players.find(p=>p.id===guest.playerId).name,'Mara Updated');
  const listen=watch(code,guest.token,s=>s.phase==='playing'&&s.leverEnabled===true);
  await req('/api/action',{code,token:guest.token,action:{type:'READY',ready:true}});
  res=await req('/api/action',{code,token:host.token,action:{type:'START'}});
  assert.equal(res.status,200);
  assert.equal(res.body.state.phase,'playing');
  await req('/api/action',{code,token:guest.token,action:{type:'LEVER'}});
  const push=await Promise.race([listen.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('No live SSE state arrived')),5000))]);
  assert.equal(push.leverEnabled,true,'Guest should see host-and-guest synchronized state');
  const [rotation,ping]=await Promise.all([
    req('/api/action',{code,token:host.token,action:{type:'ROTATE',room:'B',dir:1}}),
    req('/api/action',{code,token:guest.token,action:{type:'PING',room:'B'}})
  ]);
  assert.equal(rotation.status,200);assert.equal(ping.status,200);
  const state=await req('/api/state?code='+code);
  assert.equal(state.status,403,'cannot read private session without token');
  const recovered=await fetch(base+'/api/state?code='+code,{headers:{Authorization:`Bearer ${host.token}`}});
  const snapshot=(await recovered.json()).state;
  assert.equal(snapshot.rotation.B,1);assert.equal(snapshot.ping.room,'B');
  assert.equal(snapshot.players.find(p=>p.id===guest.playerId).room,'F');
  const late=(await req('/api/join',{code,name:'Late Guest'}));
  assert.equal(late.status,400,'joining in progress should be rejected for prototype');
  listen.close();
});
