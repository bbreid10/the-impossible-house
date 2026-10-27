'use strict';const test=require('node:test'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');const port=45287,base=`http://127.0.0.1:${port}`;let server;
async function req(route,body){let r=await fetch(base+route,{method:body?'POST':'GET',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json()};}
async function up(){for(let i=0;i<45;i++){try{let r=await req('/api/health');if(r.status===200)return;}catch{}await new Promise(r=>setTimeout(r,100));}throw Error('Server not ready');}
test.before(async()=>{server=spawn(process.execPath,['server.js'],{cwd:require('node:path').join(__dirname,'..'),env:{...process.env,PORT:String(port)},stdio:'ignore'});await up();});
test.after(()=>server?.kill('SIGTERM'));
test('Private codes and public discovery behave correctly',async()=>{let host=await req('/api/create',{name:'Orin',visibility:'private'});assert.equal(host.status,200);let code=host.body.code;assert.equal(code.length,6);let rooms=(await req('/api/rooms')).body.rooms;assert.equal(rooms.find(r=>r.code===code),undefined);let opened=await req('/api/action',{code,token:host.body.token,action:{type:'VISIBILITY',visibility:'public'}});assert.equal(opened.status,200);rooms=(await req('/api/rooms')).body.rooms;assert.ok(rooms.some(r=>r.code===code));});
test('Two travelers see the same bridge and gate changes',async()=>{let x=(await req('/api/create',{name:'A',visibility:'private'})).body;let y=(await req('/api/join',{code:x.code,name:'B'})).body;
await req('/api/action',{code:x.code,token:y.token,action:{type:'READY',ready:true}});assert.equal((await req('/api/action',{code:x.code,token:x.token,action:{type:'START'}})).status,200);
assert.equal((await req('/api/action',{code:x.code,token:x.token,action:{type:'HOLD'}})).status,200);
assert.equal((await req('/api/action',{code:x.code,token:y.token,action:{type:'FOLD'}})).status,200);
let s=await fetch(base+'/api/state?code='+x.code,{headers:{Authorization:'Bearer '+y.token}});assert.equal(s.status,200);let b=(await s.json()).state;assert.equal(b.fold,1);assert.equal(b.players.length,2);
assert.equal((await req('/api/action',{code:x.code,token:y.token,action:{type:'FOLD'}})).status,200);
for(let i=0;i<2;i++)await req('/api/action',{code:x.code,token:y.token,action:{type:'ROTATE'}});
assert.equal((await req('/api/action',{code:x.code,token:x.token,action:{type:'SEND'}})).status,200);
});
test('Four people can join, and a fifth cannot',async()=>{let x=(await req('/api/create',{name:'A'})).body;for(let n=1;n<4;n++){let r=await req('/api/join',{code:x.code,name:String(n)});assert.equal(r.status,200);}assert.equal((await req('/api/join',{code:x.code,name:'fifth'})).status,400);});
test('Online chat is shared and request tokens are required',async()=>{let x=(await req('/api/create',{name:'Captain'})).body;let y=(await req('/api/join',{code:x.code,name:'Guest'})).body;let r=await req('/api/action',{code:x.code,token:y.token,action:{type:'CHAT',text:'I have the hinge'}});assert.equal(r.status,200);assert.equal(r.body.state.chat[0].text,'I have the hinge');let unauthorized=await req('/api/action',{code:x.code,token:'invalid',action:{type:'FOLD'}});assert.equal(unauthorized.status,403);});
test('Server-sent events deliver synchronized changes without polling',async()=>{
 let host=(await req('/api/create',{name:'Holder'})).body;let guest=(await req('/api/join',{code:host.code,name:'Folder'})).body;
 let ctrl=new AbortController();let stream=await fetch(base+`/api/events?code=${host.code}&token=${guest.token}`,{signal:ctrl.signal});
 assert.equal(stream.status,200);const reader=stream.body.getReader(),dec=new TextDecoder();
 let first=dec.decode((await reader.read()).value);assert.match(first,/event: state/);
 await req('/api/action',{code:host.code,token:host.token,action:{type:'CHAT',text:'Brace the bridge'}});
 let msg='';for(let i=0;i<10&&!msg.includes('Brace the bridge');i++){let read=await Promise.race([reader.read(),new Promise((_,rej)=>setTimeout(()=>rej(Error('SSE did not update')),2500))]);msg+=dec.decode(read.value||new Uint8Array());}
 assert.match(msg,/Brace the bridge/);ctrl.abort();
});
