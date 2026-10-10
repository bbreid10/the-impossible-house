/*
 * THE IMPOSSIBLE HOUSE — Prototype relay server.
 * Uses only built-in Node.js modules. SSE broadcasts authoritative game snapshots;
 * ordered HTTP POST actions prevent simultaneous players from desynchronizing.
 * IMPORTANT: rooms are in-memory for this prototype; restarting resets them.
 */
'use strict';
const http=require('http');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const Engine=require('./engine.js');
const {moderateChat}=require('./moderation.js');
const PORT=Number(process.env.PORT||4173);
const HOST=process.env.HOST||'0.0.0.0';
const rooms=new Map();
const ipRequests=new Map();
function allowRequest(req,kind,limit=20){
  const remote=req.socket.remoteAddress||'unknown';
  const key=remote+':'+kind,now=Date.now();
  const old=(ipRequests.get(key)||[]).filter(t=>now-t<60000);
  if(old.length>=limit){ipRequests.set(key,old);return false;}
  old.push(now);ipRequests.set(key,old);return true;
}
function publishChat(room,playerId,text){
  if(room.game.phase!=='playing' && room.game.phase!=='lobby')return {error:'Chat is closed for this expedition.'};
  if(typeof text!=='string'||text.length>400)return {error:'Please keep your message short.'};
  const msg=moderateChat(text);if(!msg)return {error:'Type a message first.'};
  const now=Date.now(),last=room.lastChatAt.get(playerId)||0;
  if(now-last<1200)return {error:'Please wait a moment before sending another message.'};
  room.lastChatAt.set(playerId,now);
  const p=room.game.players.find(p=>p.id===playerId);
  room.game.chat.push({id:crypto.randomUUID(),playerId,name:p.name,text:msg,at:now});
  room.game.chat=room.game.chat.slice(-45);room.game.version++;broadcast(room);return {ok:true};
}

const files={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/engine.js':'engine.js','/art.js':'art.js','/guide.js':'guide.js','/styles.css':'styles.css','/v4.css':'v4.css','/v6.css':'v6.css','/v8.css':'v8.css','/assets/house-diorama.webp':'assets/house-diorama.webp'};
const mime={'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.html':'text/html; charset=utf-8','.webp':'image/webp'};
function out(res,status,body){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'same-origin'});res.end(JSON.stringify(body));}
function fail(res,message,status=400){out(res,status,{error:message});}
function code(){let c;do{c=crypto.randomBytes(3).toString('hex').toUpperCase()}while(rooms.has(c));return c;}
function roomFor(c){return rooms.get(String(c||'').trim().toUpperCase());}
function findMember(room,token){return room && room.tokens.get(String(token||''));}
function frame(res,event,data){res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);}
function broadcast(room){for(const s of room.clients){try{frame(s.res,'state',room.game);}catch{}}}
function joinMember(room,name,avatar){
  const id=crypto.randomUUID(),token=crypto.randomBytes(24).toString('base64url');
  const result=Engine.addPlayer(room.game,{id,name:moderateChat(name||'Explorer').slice(0,16),avatar});
  if(result.error)return {error:result.error};
  room.tokens.set(token,id);broadcast(room);return {code:room.game.code,token,playerId:id,state:room.game};
}
async function parseBody(req){return await new Promise((resolve,reject)=>{let buf='';req.on('data',chunk=>{buf+=chunk;if(buf.length>15000){reject(new Error('Request too large.'));req.destroy();}});req.on('end',()=>{try{resolve(JSON.parse(buf||'{}'));}catch{reject(new Error('Invalid JSON.'));}});req.on('error',reject);});}
function visibleRooms(){return [...rooms.values()].filter(r=>r.game.visibility==='public'&&r.game.phase==='lobby'&&r.game.players.length<4).map(r=>({code:r.game.code,count:r.game.players.length,host:r.game.players[0]?.name||'Explorer'}));}
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  const route=url.pathname;
  if(req.method==='GET'&&route==='/api/health')return out(res,200,{ok:true,name:'The Impossible House',mode:'hosted-multiplayer-ready',online:true});
  if(req.method==='GET'&&route==='/api/rooms/public')return out(res,200,{rooms:visibleRooms()});
  if(req.method==='GET'&&route==='/api/state'){
    const room=roomFor(url.searchParams.get('code'));
    const token=req.headers.authorization?.replace(/^Bearer\s+/i,'');
    const playerId=findMember(room,token);
    if(!playerId)return fail(res,'Could not recover this expedition.',403);
    return out(res,200,{playerId,state:room.game});
  }
  if(req.method==='GET'&&route==='/api/events'){
    const room=roomFor(url.searchParams.get('code'));
    const token=url.searchParams.get('token');
    const playerId=findMember(room,token);
    if(!playerId)return fail(res,'Invalid expedition token.',403);
    res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});
    const client={res,playerId};room.clients.add(client);
    const who=room.game.players.find(p=>p.id===playerId);
    if(who){who.connected=true;room.game.version++;}
    frame(res,'state',room.game);broadcast(room);
    const ticker=setInterval(()=>{try{res.write(': still-here\n\n');}catch{}},15000);
    req.on('close',()=>{
      clearInterval(ticker);room.clients.delete(client);
      const still=[...room.clients].some(c=>c.playerId===playerId);
      if(!still){setTimeout(()=>{if(![...room.clients].some(c=>c.playerId===playerId)){
        const p=room.game.players.find(p=>p.id===playerId);if(p){p.connected=false; if(room.game.hostId===playerId){const next=room.game.players.find(g=>g.id!==playerId&&g.connected);if(next){room.game.hostId=next.id;if(room.game.phase==='lobby')next.ready=true;}} room.game.version++;broadcast(room);}
      }},4500);}
    });return;
  }
  if(req.method==='POST'&&route.startsWith('/api/')){
    let body;try{body=await parseBody(req)}catch(err){return fail(res,err.message);}
    if(route==='/api/create'){
      if(!allowRequest(req,'create',15))return fail(res,'Too many rooms created. Try again soon.',429);
      const c=code(),visibility=body.visibility==='public'?'public':'private';
      const room={game:Engine.newGame({code:c,visibility}),tokens:new Map(),clients:new Set(),lastChatAt:new Map(),reports:[],createdAt:Date.now()};
      room.game.chat=[];
      rooms.set(c,room);return out(res,200,joinMember(room,body.name,body.avatar));
    }
    if(route==='/api/join'){
      if(!allowRequest(req,'join',35))return fail(res,'Too many join attempts. Please wait a minute.',429);
      const room=roomFor(body.code);
      if(!room)return fail(res,'No house found for that code.',404);
      const value=joinMember(room,body.name,body.avatar);
      if(value.error)return fail(res,value.error);
      return out(res,200,value);
    }
    if(route==='/api/leave'){
      const room=roomFor(body.code),playerId=findMember(room,body.token);
      if(!playerId)return fail(res,'Expedition session not found.',403);
      if(room.game.phase==='lobby'){
        room.game.players=room.game.players.filter(p=>p.id!==playerId);
        room.tokens.delete(body.token);
        for(const client of [...room.clients])if(client.playerId===playerId){client.res.end();room.clients.delete(client);}
        if(room.game.hostId===playerId){room.game.hostId=room.game.players[0]?.id||null;if(room.game.players[0])room.game.players[0].ready=true;}
        if(room.game.players.length===0){rooms.delete(room.game.code);}else{room.game.version++;broadcast(room);}
      } else {
        // Preserve progress and the session token to support voluntary reconnect.
        const player=room.game.players.find(p=>p.id===playerId);if(player){player.connected=false;if(room.game.hostId===playerId){const next=room.game.players.find(p=>p.id!==playerId&&p.connected);if(next)room.game.hostId=next.id;}room.game.version++;broadcast(room);}
      }
      return out(res,200,{ok:true});
    }
    if(route==='/api/action'){
      const room=roomFor(body.code),playerId=findMember(room,body.token);
      if(!playerId)return fail(res,'Your expedition session expired.',403);
      if(body.action?.type==='CHAT'){
        if(!allowRequest(req,'chat',55))return fail(res,'Chat is moving too quickly. Try again shortly.',429);
        const result=publishChat(room,playerId,body.action.text);
        if(result.error)return fail(res,result.error,429);
        return out(res,200,{ok:true,state:room.game});
      }
      if(body.action?.type==='REPORT'){
        const msg=room.game.chat.find(m=>m.id===body.action.messageId);
        if(!msg||msg.playerId===playerId)return fail(res,'That message cannot be reported.');
        if(!room.reports.some(r=>r.reporterId===playerId&&r.messageId===msg.id))
          room.reports.push({reporterId:playerId,messageId:msg.id,at:Date.now()});
        return out(res,200,{ok:true});
      }
      if(body.action?.type==='REOPEN'){
        if(room.game.hostId!==playerId || room.game.phase==='lobby')return fail(res,'Only the host can reopen the lobby after starting.');
        const current=room.game;
        const game=Engine.newGame({code:current.code,visibility:current.visibility});
        game.chat=(current.chat||[]).slice(-15);
        const retained=current.players.filter(p=>p.connected || p.id===playerId);
        for(const p of retained){Engine.addPlayer(game,{id:p.id,name:p.name,avatar:p.avatar});game.players[game.players.length-1].ready=p.id===playerId;}
        game.hostId=playerId;
        for(const [token,id] of room.tokens)if(!retained.some(p=>p.id===id))room.tokens.delete(token);
        room.game=game;room.lastChatAt.clear();broadcast(room);return out(res,200,{ok:true,state:room.game});
      }
      if(body.action?.type==='REMOVE'){
        if(room.game.phase!=='lobby'||room.game.hostId!==playerId)return fail(res,'Only the host can remove guests before a game.');
        const target=body.action.playerId;
        if(target===playerId||!room.game.players.some(p=>p.id===target))return fail(res,'Cannot remove that explorer.');
        room.game.players=room.game.players.filter(p=>p.id!==target);
        for(const [token,id] of room.tokens)if(id===target)room.tokens.delete(token);
        for(const client of [...room.clients])if(client.playerId===target){frame(client.res,'removed',{reason:'The host removed you from this room.'});client.res.end();room.clients.delete(client);}
        room.game.version++;broadcast(room);return out(res,200,{ok:true,state:room.game});
      }
      const result=Engine.act(room.game,playerId,body.action);
      if(result.error)return fail(res,result.error);
      broadcast(room);return out(res,200,{ok:true,state:room.game});
    }
    return fail(res,'Not found.',404);
  }
  if(req.method==='GET' && files[route]){
    const file=path.join(__dirname,files[route]);
    try{const stat=fs.statSync(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)],'Content-Length':stat.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});fs.createReadStream(file).pipe(res);}
    catch{fail(res,'File not found.',404);}return;
  }
  if(req.method==='GET' && route==='/favicon.ico'){res.writeHead(204);return res.end();}
  return fail(res,'Not found.',404);
});
// Idle rooms are cleared periodically so public discovery stays usable.
setInterval(()=>{const now=Date.now();for(const [c,r] of rooms){if(!r.clients.size && now-r.createdAt>1000*60*60*6)rooms.delete(c);}for(const [ip,times] of ipRequests){if(times.every(t=>now-t>120000))ipRequests.delete(ip);}},60*1000).unref();
server.listen(PORT,HOST,()=>console.log(`The Impossible House listening on http://localhost:${PORT}`));
module.exports={server,rooms};
