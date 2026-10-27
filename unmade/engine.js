/* The Unmade Line. Original browser co-op spatial puzzle. No dependencies. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.UnmadeEngine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const STAGES=[
 {id:'span',number:'01',name:'THE BROKEN SPAN',place:'St. Orin Viaduct',lead:'Bring the two halves of the railway together.',description:'Someone holds the hinge steady. Someone else unfolds the bridge.',target:3,signal:'WEST',hint:'Brace the hinge, unfold the bridge twice, then point the gate toward the incoming rails.'},
 {id:'lens',number:'02',name:'THE MOON OBSERVATORY',place:'Halcyon Glassworks',lead:'Make a track from moonlight.',description:'The lens carries light. The tower chooses where it lands.',target:1,signal:'EAST',hint:'Turn the glass tower to face the arrival platform, then focus its lens until the pale track becomes solid.'},
 {id:'ridge',number:'03',name:'THE UNMADE PASS',place:'The Hollow Ridge',lead:'Open a route through solid stone.',description:'The ridge folds. The signal is hidden inside.',target:2,signal:'SOUTH',hint:'Unfold the cliff face, rotate the hanging signal toward the lower passage and ignite the beacon.'}
];
const DIRECTIONS=['NORTH','EAST','SOUTH','WEST'];
const MAX_PLAYERS=4;
function safeName(n){return String(n||'Traveler').replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,18)||'Traveler';}
function record(g,text,playerId,kind='action'){let p=g.players.find(p=>p.id===playerId);g.events.unshift({id:++g.serial,at:Date.now(),by:p?p.name:'The Line',text,kind});g.events=g.events.slice(0,26);g.version++;}
function resetStage(g,index){g.stageIndex=index;g.status='prepare';g.progress=0.115;g.holder=null;g.fold=0;g.dial=(index===0?1:index===1?3:0);g.lens=0;g.beacon=false;g.version++;}
function newGame({code='LOCAL',visibility='private',solo=true,mode='relaxed'}={}){
 const g={code,visibility,solo,mode:mode==='night'?'night':'relaxed',players:[],hostId:null,phase:solo?'playing':'lobby',stageIndex:0,status:'prepare',progress:.115,fold:0,dial:1,lens:0,beacon:false,holder:null,version:0,serial:0,events:[],chat:[],startedAt:null,finishedAt:null,delivered:0,actions:0};
 if(solo){g.players.push({id:'solo',name:'You',ready:true,connected:true});g.hostId='solo';g.startedAt=Date.now();}
 return g;
}
function addPlayer(g,{id,name}={}){if(g.phase!=='lobby')return {error:'This departure has already begun.'};if(g.players.length>=MAX_PLAYERS)return {error:'The train has four crew positions.'};if(g.players.some(p=>p.id===id))return {error:'You are already here.'};const p={id:id||`p${g.players.length+1}`,name:safeName(name),ready:g.players.length===0,connected:true};g.players.push(p);if(!g.hostId)g.hostId=p.id;record(g,`${p.name} joined the crew.`,p.id,'join');return {ok:true,playerId:p.id};}
function orientation(g){return DIRECTIONS[g.dial]};
function ready(g){if(g.stageIndex===0)return g.fold>=2&&g.dial===STAGES[0].target;
 if(g.stageIndex===1)return g.dial===STAGES[1].target&&g.lens===2;
 return g.fold>=1&&g.dial===STAGES[2].target&&g.beacon;}
function progressFlags(g){return {bridge:g.fold>=2,hinge:!!g.holder,tower:g.dial===STAGES[g.stageIndex].target,light:g.lens===2,tunnel:g.fold>=1,beacon:g.beacon,ready:ready(g)};}
function action(g,playerId,a){const p=g.players.find(x=>x.id===playerId);if(!p)return {error:'Join a crew to operate the railway.'};if(!a||typeof a.type!=='string')return {error:'Unknown action.'};const t=a.type;
 if(t==='READY'&&g.phase==='lobby'){p.ready=!!a.ready;g.version++;return {ok:true};}
 if(t==='VISIBILITY'&&g.phase==='lobby'){if(playerId!==g.hostId)return {error:'Only the host can change visibility.'};if(!['public','private'].includes(a.visibility))return {error:'Choose public or private.'};g.visibility=a.visibility;g.version++;return {ok:true};}
 if(t==='MODE'&&g.phase==='lobby'){if(playerId!==g.hostId)return {error:'Only the host can change the shift.'};g.mode=a.mode==='night'?'night':'relaxed';g.version++;return {ok:true};}
 if(t==='START'&&g.phase==='lobby'){if(playerId!==g.hostId)return {error:'Only the host can start.'};if(g.players.length<2)return {error:'Invite at least one friend or play solo.'};if(!g.players.every(x=>x.ready))return {error:'Everyone must mark Ready.'};g.phase='playing';g.startedAt=Date.now();resetStage(g,0);record(g,'The final train is ready to depart.',playerId,'start');return {ok:true};}
 if(t==='CHAT'){if(g.solo)return {error:'Chat is for online crews.'};const txt=String(a.text||'').trim().replace(/[<>\u0000-\u001f]/g,'').slice(0,180);if(!txt)return {error:'Write a message.'};g.chat.push({id:++g.serial,name:p.name,playerId,at:Date.now(),text:txt});g.chat=g.chat.slice(-35);g.version++;return {ok:true};}
 if(t==='RESTART'){if(!g.solo&&playerId!==g.hostId)return {error:'The host restarts the route.'};if(!['complete','failed'].includes(g.phase))return {error:'Finish the line first.'};g.phase='playing';g.startedAt=Date.now();g.finishedAt=null;g.delivered=0;g.actions=0;resetStage(g,0);record(g,'A new night service begins.',playerId,'start');return {ok:true};}
 if(g.phase!=='playing')return {error:'The line is not in service.'};
 if(g.mode==='night' && (Date.now()-g.startedAt)>8*60*1000){g.phase='failed';record(g,'The last light went out. Try again.',null,'end');return {error:'The night shift has ended.'};}
 if(t==='NEXT'){if(g.status!=='landed')return {error:'The train has not reached the platform yet.'};if(!g.solo&&playerId!==g.hostId)return {error:'The host signals the next section.'};if(g.stageIndex===STAGES.length-1){g.phase='complete';g.finishedAt=Date.now();record(g,'The Unmade Line reached the final station.',playerId,'end');return {ok:true};}resetStage(g,g.stageIndex+1);record(g,`Entered ${STAGES[g.stageIndex].place}.`,playerId,'travel');return {ok:true};}
 if(t==='SEND'){if(g.status!=='prepare')return {error:'The train is already moving.'};if(!ready(g))return {error:'The track is not connected yet.'};g.status='moving';record(g,`${p.name} cleared the signal.`,playerId,'train');return {ok:true};}
 if(g.status!=='prepare')return {error:'The mechanisms are locked while the train passes.'};
 const stage=g.stageIndex;
 if(t==='HOLD'){
   if(stage!==0)return {error:'This stretch has no stabilizer.'};
   if(g.fold>=2)return {error:'The bridge has already clicked into place.'};
   if(g.holder && g.holder!==playerId)return {error:'Another worker is bracing the hinge.'};
   g.holder=(g.holder===playerId?null:playerId);record(g,g.holder?`${p.name} braced the hinge.`:`${p.name} released the hinge.`,playerId,'hold');return {ok:true};
 }
 if(t==='FOLD'){
   if(stage!==0&&stage!==2)return {error:'There is no fold here.'};
   if(stage===0){if(g.fold>=2)return {error:'The bridge is fully unfolded.'};if(!g.solo&&!g.holder)return {error:'A teammate must brace the hinge.'};if(!g.solo&&g.holder===playerId)return {error:'Another worker must move the span while you brace it.'};g.fold++;record(g,`${p.name} unfolded the bridge${g.fold===2?' into place':''}.`,playerId,'fold');}
   else {g.fold=g.fold?0:1;record(g,`${p.name} ${g.fold?'opened':'closed'} the stone cut.`,playerId,'fold');}
   g.actions++;return {ok:true};
 }
 if(t==='ROTATE'){
   const d=a.dir===-1?-1:1;g.dial=(g.dial+d+4)%4;record(g,`${p.name} turned the ${stage===0?'gate':stage===1?'glass tower':'hanging signal'} ${orientation(g).toLowerCase()}.`,playerId,'rotate');g.actions++;return {ok:true};
 }
 if(t==='FOCUS'&&stage===1){g.lens=(g.lens+1)%3;record(g,`${p.name} refocused the moonlens.`,playerId,'light');g.actions++;return {ok:true};}
 if(t==='BEACON'&&stage===2){g.beacon=!g.beacon;record(g,`${p.name} ${g.beacon?'lit':'extinguished'} the hollow beacon.`,playerId,'light');g.actions++;return {ok:true};}
 return {error:'That mechanism is not available here.'};
}
function tick(g,deltaMs=100){if(g.phase!=='playing'||g.status!=='moving')return false;const old=g.progress;g.progress=Math.min(.94,g.progress+(deltaMs/5500)*.825);if(g.progress>=.94){g.progress=.94;g.status='landed';g.delivered++;record(g,`The train reached ${STAGES[g.stageIndex].place}.`,null,'arrival');}else g.version++;return old!==g.progress;}
function snapshot(g){return g;} // The browser receives a server-created snapshot; no private tokens are stored in game state.
return {STAGES,DIRECTIONS,newGame,addPlayer,action,tick,ready,progressFlags,orientation,safeName,snapshot};
});
