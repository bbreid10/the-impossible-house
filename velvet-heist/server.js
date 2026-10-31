import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {WebSocketServer,WebSocket} from 'ws';
const ROOT=path.dirname(fileURLToPath(import.meta.url));
const rooms=new Map();
const fresh=()=>({camera:false,lights:false,clue:false,terminal:false,caseOpen:false,diamond:false,escape:false,alarm:0,code:String(Math.floor(1000+Math.random()*9000)),revision:0});
const clean=(v,n=160)=>String(v??'').replace(/[<>\x00-\x1f]/g,'').trim().slice(0,n);
const server=http.createServer((req,res)=>{
 let u;try{u=new URL(req.url,'http://localhost')}catch{res.writeHead(400);return res.end()};
 if(u.pathname==='/api/health'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({ok:true,game:'The Beautiful Heist',build:'competition-1'}))};
 const alias=u.pathname==='/'?'index.html':u.pathname.replace(/^\//,'');
 if(!['index.html','game.js','assets/hero-museum.webp','assets/museum-stage.webp','assets/museum-night.webp'].includes(alias)){res.writeHead(404);return res.end('Not found')};
 const f=path.join(ROOT,alias.startsWith('assets/')?'': 'public',alias);
 fs.readFile(f,(e,b)=>{if(e){res.writeHead(404);return res.end('Missing resource')}res.writeHead(200,{'Content-Type':alias.endsWith('.js')?'text/javascript; charset=utf-8':alias.endsWith('.html')?'text/html; charset=utf-8':'image/webp'});res.end(b)});
});
const wss=new WebSocketServer({server,path:'/ws'});
const send=(ws,x)=>{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(x))};
const all=(r,x)=>{for(const p of r.players.values())send(p.ws,x)};
const snap=r=>({type:'state',state:r.state,players:[...r.players.values()].map(p=>({id:p.id,name:p.name,x:p.x,z:p.z})),room:r.code});
const allowed={camera:s=>true,lights:s=>s.camera,clue:s=>s.lights,terminal:s=>s.clue,caseOpen:s=>s.terminal,diamond:s=>s.caseOpen,escape:s=>s.diamond};
const notices={camera:'Camera redirected: its surveillance beam now points away from the gallery.',lights:'Gallery lights and motion sensors are disabled.',clue:'Curator inscription discovered. Crew field notes now contain the vault combination.',terminal:'The vault accepted your code. The display can now be unlocked.',caseOpen:'Diamond case unlocked.',diamond:'The Aster Diamond is secured. Escape through the service door!',escape:'The crew has escaped. Heist complete!'};
wss.on('connection',ws=>{
 let r=null,id=Math.random().toString(36).slice(2,10),lastMove=0;
 ws.on('message',raw=>{let m;try{m=JSON.parse(raw.toString())}catch{return}if(!m||typeof m!=='object')return;
  if(m.type==='join'){if(r)return;const wanted=clean(m.room,6).toUpperCase().replace(/[^A-Z0-9]/g,'');r=wanted?rooms.get(wanted):null;if(wanted&&!r)return send(ws,{type:'error',message:'Crew code not found'});if(!r){let c;do{c=Math.random().toString(36).slice(2,7).toUpperCase()}while(rooms.has(c));r={code:c,players:new Map(),state:fresh()};rooms.set(c,r)}if(r.players.size>=4){send(ws,{type:'error',message:'Room full'});r=null;return}r.players.set(id,{id,ws,name:clean(m.name,18)||'Operative',x:0,z:8});send(ws,{type:'welcome',id,code:r.code});all(r,snap(r));all(r,{type:'notice',message:'An operative joined the crew.'});return;}
  if(!r||!r.players.has(id))return;const s=r.state;
  if(m.type==='chat'){const msg=clean(m.message,180);if(msg)all(r,{type:'chat',name:r.players.get(id).name,message:msg});return}
  if(m.type==='move'){const x=Number(m.x),z=Number(m.z);if(Date.now()-lastMove<90)return;lastMove=Date.now();if(Number.isFinite(x)&&Number.isFinite(z)&&Math.abs(x)<28&&Math.abs(z)<32){const p=r.players.get(id);p.x=x;p.z=z;all(r,{type:'move',id,x,z})}return}
  if(m.type==='hint'){if(s.clue)send(ws,{type:'note',message:'The curator inscription reveals the vault combination: '+s.code});return}
  if(m.type==='restart'){r.state=fresh();all(r,snap(r));return}
  if(m.type!=='action')return;
  const a=clean(m.action,20);
  if(!Object.hasOwn(allowed,a))return;
  if(s[a])return;
  if(a==='terminal'&&clean(m.code,4)!==s.code){s.alarm=Math.min(100,s.alarm+16);all(r,{type:'notice',message:'Wrong vault code: security suspicion +16.'});all(r,snap(r));return}
  if(!allowed[a](s)){send(ws,{type:'notice',message:'Not yet. Complete the previous objective first.'});return}
  s[a]=true;s.revision++;all(r,{type:'notice',message:notices[a]});all(r,snap(r));
 });
 ws.on('close',()=>{if(!r)return;r.players.delete(id);all(r,snap(r));if(!r.players.size)rooms.delete(r.code)});
});
server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Beautiful Heist multiplayer online'));
