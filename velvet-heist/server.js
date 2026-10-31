'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const E=require('./engine');const ROOT=__dirname;
const PORT=Number(process.env.PORT||4422);const HOST='0.0.0.0';
const rooms=new Map();const ipLog=new Map();const files={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js','/engine.js':'engine.js','/assets/hero-museum.webp':'assets/hero-museum.webp','/assets/museum-stage.webp':'assets/museum-stage.webp','/assets/museum-night.webp':'assets/museum-night.webp'};
const types={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',webp:'image/webp'};
function send(res,code,data){let text=JSON.stringify(data);res.writeHead(code,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(text);}
function fail(res,status,reason){send(res,status,{error:reason});}
function rate(req,name,max){let key=(req.socket.remoteAddress||'')+':'+name;let now=Date.now(),arr=(ipLog.get(key)||[]).filter(t=>now-t<60000);if(arr.length>=max)return false;arr.push(now);ipLog.set(key,arr);return true;}
function body(req){return new Promise((resolve,reject)=>{let parts='',tooBig=false;req.on('data',b=>{parts+=b;if(parts.length>12000){tooBig=true;req.destroy();reject(new Error('Too large'));}});req.on('end',()=>{if(tooBig)return;try{resolve(JSON.parse(parts||'{}'));}catch{reject(new Error('Invalid JSON'))}});req.on('error',reject);});}
function code(){let c;do{c=crypto.randomBytes(4).toString('hex').slice(0,6).toUpperCase()}while(rooms.has(c));return c;}
function roomBy(c){return rooms.get(String(c||'').trim().toUpperCase())}
function membership(r,t){return r?.tokens.get(String(t||''))}
function join(r,name){const id=crypto.randomUUID(),token=crypto.randomBytes(26).toString('base64url');let ans=E.addPlayer(r.state,{id,name});if(ans.error)return ans;r.tokens.set(token,id);r.updated=Date.now();broadcast(r);return {code:r.state.code,token,playerId:id,state:E.publicState(r.state)}}
function frame(res,kind,d){res.write('event: '+kind+'\ndata: '+JSON.stringify(d)+'\n\n')}
function broadcast(r){let s=E.publicState(r.state);for(const c of r.clients){try{frame(c.res,'state',s)}catch{r.clients.delete(c)}}}
setInterval(()=>{for(const [key,r] of rooms){if(Date.now()-r.updated>1000*60*60*4){for(const c of r.clients)try{c.res.end()}catch{}rooms.delete(key);continue;}if(E.pulse(r.state))broadcast(r);}},2500).unref();
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost');let pathname=u.pathname;
 if(req.method==='GET'&&pathname==='/api/health')return send(res,200,{ok:true,name:'The Velvet Heist',build:'0.2.0',online:true});
 if(req.method==='GET'&&pathname==='/api/public'){return send(res,200,{rooms:[...rooms.values()].filter(r=>r.state.phase==='lobby'&&r.state.visibility==='public'&&r.state.players.length<4).map(r=>({code:r.state.code,count:r.state.players.length,host:r.state.players[0]?.name||'Guest',difficulty:r.state.difficulty}))});}
 if(req.method==='GET'&&pathname==='/api/state'){
  const r=roomBy(u.searchParams.get('code'));const id=membership(r,req.headers.authorization?.replace(/^Bearer\s+/i,''));if(!id)return fail(res,403,'Room closed or session expired.');return send(res,200,{playerId:id,state:E.publicState(r.state)});
 }
 if(req.method==='GET'&&pathname==='/api/events'){
  const r=roomBy(u.searchParams.get('code'));const id=membership(r,u.searchParams.get('token'));if(!id)return fail(res,403,'Session invalid.');
  res.writeHead(200,{'content-type':'text/event-stream; charset=utf-8','cache-control':'no-cache, no-transform','connection':'keep-alive','x-accel-buffering':'no'});const c={id,res};r.clients.add(c);frame(res,'state',E.publicState(r.state));
  const keep=setInterval(()=>{try{res.write(': keepalive\n\n')}catch{}},15000);req.on('close',()=>{clearInterval(keep);r.clients.delete(c);});return;
 }
 if(req.method==='POST'&&pathname.startsWith('/api/')){
  if(!rate(req,'api',80))return fail(res,429,'Too many requests.');let v;try{v=await body(req)}catch{return fail(res,400,'Invalid request')}
  if(pathname==='/api/create'){
   if(rooms.size>=75)return fail(res,429,'Too many active rooms');let visibility=v.visibility==='public'?'public':'private',difficulty=v.difficulty==='night'?'night':'calm';let c=code();let r={state:E.create({code:c,visibility,difficulty,seed:crypto.randomInt(0,1000000)}),tokens:new Map(),clients:new Set(),updated:Date.now()};rooms.set(c,r);return send(res,200,join(r,v.name));
  }
  if(pathname==='/api/join'){
   const r=roomBy(v.code);if(!r)return fail(res,404,'No room with that code.');const result=join(r,v.name);return result.error?fail(res,400,result.error):send(res,200,result);
  }
  if(pathname==='/api/action'){
   const r=roomBy(v.code),id=membership(r,v.token);if(!id)return fail(res,403,'Invalid session.');let ans=E.action(r.state,id,v.action);if(ans.ok||ans.stateChanged){r.updated=Date.now();broadcast(r);}return send(res,ans.error?400:200,{...ans,state:E.publicState(r.state)});
  }
  if(pathname==='/api/chat'){
   const r=roomBy(v.code),id=membership(r,v.token);if(!id)return fail(res,403,'Invalid session.');let msg=String(v.text||'').trim();if(!msg||msg.length>280)return fail(res,400,'Message must be 1–280 characters.');const p=r.state.players.find(p=>p.id===id);r.state.chat.push({id:crypto.randomUUID(),name:p.name,text:msg.slice(0,280),at:Date.now()});r.state.chat=r.state.chat.slice(-40);r.state.version++;r.updated=Date.now();broadcast(r);return send(res,200,{ok:true});
  }
  return fail(res,404,'Unknown endpoint.');
 }
 if(req.method!=='GET'||!files[pathname])return fail(res,404,'Not found.');
 const f=path.join(ROOT,files[pathname]);try{const data=fs.readFileSync(f);res.writeHead(200,{'content-type':types[path.extname(f).slice(1)]||'application/octet-stream','cache-control':'public,max-age=120','x-content-type-options':'nosniff','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"});res.end(data);}catch{fail(res,500,'File missing.');}
});
server.listen(PORT,HOST,()=>console.log('Velvet Heist server on '+PORT));
module.exports=server;
