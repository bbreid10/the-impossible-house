/* The Unmade Line • shared authoritative server, no third-party dependencies. */
'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const E=require('./engine');const PORT=Number(process.env.PORT||4173);
const games=new Map(),rate=new Map(),MAX_ROOMS=100;
const ROUTES={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/client.js':'client.js','/engine.js':'engine.js'};
function send(res,code,data){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
function err(res,msg,code=400){send(res,code,{error:msg});}
function readBody(req){return new Promise((resolve,reject)=>{let d='';req.on('data',b=>{d+=b;if(d.length>9000){reject(Error('Request is too long.'));req.destroy();}});req.on('end',()=>{try{resolve(JSON.parse(d||'{}'));}catch{reject(Error('Invalid request.'));}});req.on('error',reject);});}
function throttle(req,kind,max=35){const key=(req.socket.remoteAddress||'local')+'|'+kind;const now=Date.now(),recent=(rate.get(key)||[]).filter(t=>now-t<60000);if(recent.length>=max)return false;recent.push(now);rate.set(key,recent);return true;}
function roomCode(){let c;do{c=crypto.randomBytes(4).toString('hex').toUpperCase().slice(0,6);}while(games.has(c));return c;}
function getRoom(c){return games.get(String(c||'').trim().toUpperCase());}
function member(room,token){return room?.tokens.get(String(token||''))||null;}
function view(room){return E.snapshot(room.g);}
function emit(room){const js=JSON.stringify(view(room));for(const client of [...room.clients]){try{client.res.write('event: state\ndata: '+js+'\n\n');}catch{room.clients.delete(client);}}}
function attach(room,name){let id=crypto.randomUUID(),token=crypto.randomBytes(24).toString('base64url');const r=E.addPlayer(room.g,{id,name});if(r.error)return {error:r.error};room.tokens.set(token,id);emit(room);return {code:room.g.code,token,playerId:id,state:view(room)};}
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');const route=url.pathname;
 if(req.method==='GET'&&route==='/api/health')return send(res,200,{ok:true,game:'The Unmade Line',build:'0.1.0',multiplayer:true});
 if(req.method==='GET'&&route==='/api/rooms')return send(res,200,{rooms:[...games.values()].filter(x=>x.g.visibility==='public'&&x.g.phase==='lobby'&&x.g.players.length<4).map(x=>({code:x.g.code,count:x.g.players.length,host:x.g.players[0]?.name||'Traveler',mode:x.g.mode}))});
 if(req.method==='GET'&&route==='/api/state'){
  const room=getRoom(url.searchParams.get('code')),who=member(room,req.headers.authorization?.replace(/^Bearer\s+/i,''));
  return who?send(res,200,{playerId:who,state:view(room)}):err(res,'This invitation is no longer valid.',403);
 }
 if(req.method==='GET'&&route==='/api/events'){
  const room=getRoom(url.searchParams.get('code')),who=member(room,url.searchParams.get('token'));if(!who)return err(res,'Not invited.',403);
  res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-store','Connection':'keep-alive','X-Accel-Buffering':'no'});
  const c={res,who};room.clients.add(c);const p=room.g.players.find(p=>p.id===who);if(p){p.connected=true;room.g.version++;}emit(room);
  let timer=setInterval(()=>{try{res.write(': ping\n\n');}catch{}},14000);
  req.on('close',()=>{clearInterval(timer);room.clients.delete(c);setTimeout(()=>{if([...room.clients].every(c=>c.who!==who)){const p=room.g.players.find(p=>p.id===who);if(p){p.connected=false;if(room.g.holder===who)room.g.holder=null;room.g.version++;emit(room);}}},1600);});return;
 }
 if(req.method==='POST'&&route.startsWith('/api/')){
  let body;try{body=await readBody(req);}catch(e){return err(res,e.message);}
  if(route==='/api/create'){
    if(!throttle(req,'create',15)||games.size>=MAX_ROOMS)return err(res,'Too many trains are boarding. Try again shortly.',429);
    const c=roomCode(),g=E.newGame({code:c,solo:false,visibility:body.visibility==='public'?'public':'private',mode:body.mode});const room={g,tokens:new Map(),clients:new Set(),created:Date.now(),chats:new Map()};games.set(c,room);return send(res,200,attach(room,body.name));
  }
  if(route==='/api/join'){
    if(!throttle(req,'join',50))return err(res,'Too many boarding attempts.',429);
    const room=getRoom(body.code);if(!room)return err(res,'No train for that invitation.',404);const r=attach(room,body.name);return r.error?err(res,r.error):send(res,200,r);
  }
  if(route==='/api/action'){
    const room=getRoom(body.code),who=member(room,body.token);if(!who)return err(res,'Invalid crew credentials.',403);
    if(!body.action||typeof body.action.type!=='string')return err(res,'Action missing.');
    if(body.action.type==='CHAT'){
      const now=Date.now(),last=room.chats.get(who)||0;if(now-last<850)return err(res,'You can send another message shortly.',429);room.chats.set(who,now);
    }
    const r=E.action(room.g,who,body.action);if(r.error)return err(res,r.error);emit(room);return send(res,200,{ok:true,state:view(room)});
  }
  return err(res,'Unknown request.',404);
 }
 if(req.method==='GET'&&Object.prototype.hasOwnProperty.call(ROUTES,route)){
   const name=ROUTES[route],file=path.join(__dirname,name);let ext=path.extname(name),type=ext==='.js'?'application/javascript':ext==='.css'?'text/css':'text/html';
   try{const data=fs.readFileSync(file);res.writeHead(200,{'Content-Type':type+'; charset=utf-8','Cache-Control':name==='index.html'?'no-store':'public, max-age=900','X-Content-Type-Options':'nosniff'});return res.end(data);}catch{return err(res,'Missing resource.',404);}
 }
 err(res,'Not found.',404);
});
setInterval(()=>{let now=Date.now();for(const [c,room] of games){if(E.tick(room.g,100))emit(room);if(now-room.created>5*60*60*1000){for(const client of room.clients){try{client.res.end();}catch{}}games.delete(c);}}},100).unref();
server.listen(PORT,'0.0.0.0',()=>console.log(`The Unmade Line listening on ${PORT}`));
module.exports={server,games};
