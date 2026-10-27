'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const E=require('./engine.js');
const PORT=Number(process.env.PORT||4174);const HOST=process.env.HOST||'0.0.0.0';
const rooms=new Map();const limits=new Map();
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon'};
function json(res,status,obj){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(obj));}
function error(res,status,message){json(res,status,{error:message})}
function guard(req,route,max=40){let ip=req.socket.remoteAddress||'0';let k=ip+':'+route;let a=(limits.get(k)||[]).filter(t=>Date.now()-t<60000);if(a.length>=max){limits.set(k,a);return false;}a.push(Date.now());limits.set(k,a);return true;}
function parse(req){return new Promise((resolve,reject)=>{let s='',done=false;req.on('data',d=>{if(done)return;s+=d;if(s.length>16000){done=true;reject(Error('Request too large'));req.destroy();}});req.on('end',()=>{if(done)return;try{resolve(JSON.parse(s||'{}'))}catch{reject(Error('Invalid JSON'))}});req.on('error',reject);});}
function code(){let str='';const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';for(let i=0;i<6;i++)str+=chars[crypto.randomInt(chars.length)];return rooms.has(str)?code():str;}
function room(code){return rooms.get(String(code||'').toUpperCase())}
function member(r,token){return r?.tokens.get(String(token||''))}
function snapshot(g){return g;}
function frame(res,event,value){res.write(`event: ${event}\ndata: ${JSON.stringify(value)}\n\n`)}
function broadcast(r){r.lastActive=Date.now();for(let client of r.streams)try{frame(client.res,'state',snapshot(r.game))}catch{}}
function join(r,name){const id=crypto.randomUUID(),token=crypto.randomBytes(24).toString('base64url');const result=E.join(r.game,{id,name});if(result.error)return result;r.tokens.set(token,id);broadcast(r);return{ok:true,code:r.game.code,token,playerId:id,state:snapshot(r.game)};}
function logChat(g,who,text){const msg=String(text||'').trim().replace(/[\u0000-\u001f<>]/g,'').slice(0,280);if(!msg)return null;g.chat.push({id:crypto.randomUUID(),by:who.id,name:who.name,text:msg,at:Date.now()});g.chat=g.chat.slice(-65);g.version++;return msg;}
const STATIC=new Map([['/','index.html'],['/index.html','index.html'],['/style.css','style.css'],['/app.js','app.js'],['/engine.js','engine.js'],['/favicon.svg','favicon.svg']]);
const srv=http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost');const pathname=u.pathname;
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
 if(req.method==='GET'&&pathname==='/api/health')return json(res,200,{ok:true,game:'Postmarked Elsewhere',build:'0.4.0',mode:'multiplayer',activeRooms:rooms.size});
 if(req.method==='GET'&&pathname==='/api/public'){let list=[...rooms.values()].filter(r=>r.game.visibility==='public'&&r.game.phase==='lobby'&&r.game.players.length<4).map(r=>({code:r.game.code,count:r.game.players.length,difficulty:r.game.difficulty,host:r.game.players[0]?.name||'Explorer'}));return json(res,200,{rooms:list});}
 if(req.method==='GET'&&pathname==='/api/state'){let r=room(u.searchParams.get('code')),playerId=member(r,req.headers.authorization?.replace(/^Bearer\s+/i,''));if(!playerId)return error(res,403,'Invalid session.');return json(res,200,{ok:true,state:r.game,playerId});}
 if(req.method==='GET'&&pathname==='/api/events'){
  let r=room(u.searchParams.get('code')),p=member(r,u.searchParams.get('token'));if(!p)return error(res,403,'Invalid session token.');res.writeHead(200,{'content-type':'text/event-stream; charset=utf-8','cache-control':'no-cache, no-transform','connection':'keep-alive','x-accel-buffering':'no'});const client={res,playerId:p};r.streams.add(client);frame(res,'state',r.game);let me=r.game.players.find(x=>x.id===p);if(me)me.connected=true;broadcast(r);let ticker=setInterval(()=>{try{res.write(': heartbeat\n\n')}catch{}},15000);req.on('close',()=>{clearInterval(ticker);r.streams.delete(client);setTimeout(()=>{if(![...r.streams].some(c=>c.playerId===p)){const pl=r.game.players.find(x=>x.id===p);if(pl){pl.connected=false;if(r.game.world.foldHolder===p){r.game.world.foldHolder=null;r.game.world.aligned=false;}broadcast(r)}}},3500)});return;
 }
 if(req.method==='POST'&&pathname.startsWith('/api/')){
  if(!guard(req,pathname,pathname==='/api/action'?160:pathname==='/api/chat'?40:25))return error(res,429,'Too many requests.');let body;try{body=await parse(req)}catch(e){return error(res,400,e.message)}
  if(pathname==='/api/create'){
   if(rooms.size>200)return error(res,503,'Room capacity reached.');let c=code(),difficulty=['standard','expert','relaxed'].includes(body.difficulty)?body.difficulty:'standard';let g=E.createGame({code:c,visibility:body.visibility,difficulty,seed:crypto.randomInt(1,100000)});let r={game:g,tokens:new Map(),streams:new Set(),lastChat:new Map(),lastActive:Date.now()};rooms.set(c,r);return json(res,200,join(r,body.name));
  }
  if(pathname==='/api/join'){
   let r=room(body.code);if(!r)return error(res,404,'No shift found for that code.');let result=join(r,body.name);if(result.error)return error(res,409,result.error);return json(res,200,result);
  }
  let r=room(body.code),p=member(r,body.token);if(!p)return error(res,403,'Not a member of this shift.');
  if(pathname==='/api/action'){
   let result=E.apply(r.game,p,body.action);if(result.ok&&result.dispatch)setTimeout(()=>{E.finalizeDelivery(r.game);broadcast(r)},1800);
   broadcast(r);return json(res,result.error?409:200,{...result,state:r.game});
  }
  if(pathname==='/api/chat'){
   const last=r.lastChat.get(p)||0;if(Date.now()-last<850)return error(res,429,'Send one message at a time.');let who=r.game.players.find(x=>x.id===p),msg=logChat(r.game,who,body.text);if(!msg)return error(res,400,'Message is empty.');r.lastChat.set(p,Date.now());broadcast(r);return json(res,200,{ok:true});
  }
  return error(res,404,'Unknown action.');
 }
 if(req.method!=='GET'&&req.method!=='HEAD')return error(res,405,'Method not supported.');
 let file=STATIC.get(pathname);if(!file)return error(res,404,'Not found.');
 const full=path.join(__dirname,file);fs.readFile(full,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'content-type':MIME[path.extname(file)]||'application/octet-stream','cache-control':'no-store','x-content-type-options':'nosniff'});if(req.method==='HEAD')res.end();else res.end(data)});
});
setInterval(()=>{const now=Date.now();for(const [k,r] of rooms){if(now-r.lastActive>2*60*60*1000)rooms.delete(k)}for(const [k,arr] of limits)if(arr.length&&now-arr[arr.length-1]>120000)limits.delete(k)},5*60*1000).unref();
srv.listen(PORT,HOST,()=>console.log(`Postmarked Elsewhere listening on ${HOST}:${PORT}`));
module.exports={srv,rooms};
