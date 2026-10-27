/* Postmarked Elsewhere — deterministic, shared puzzle rules. No dependencies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PostmarkedEngine=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DIRECTIONS=['NORTH','EAST','SOUTH','WEST'];
const CLOCK=['DUSK','MIDNIGHT','DAWN'];
const WATER=['HIGH','LOW','RISING'];
const STAMPS=['NOCTURNE','EXPRESS','FRAGILE'];
const MAX_PLAYERS=4;
function safeName(input){return String(input||'Explorer').replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,22)||'Explorer';}
function clone(a){return JSON.parse(JSON.stringify(a));}
function makeContracts(seed){
 const a=seed%2===0, b=seed%3===0;
 const recipient=a?'Apartment 4B':'Apartment 6C';
 const bank=a?'eastern':'western';
 const clock=a?'the clock casts no shadow':'the first gas lamps are lit';
 const blackout=a?'MIDNIGHT':'DUSK';
 return [{
   id:'blackwater',number:'017',name:'The Blackwater Address',recipient,region:'Blackwater Lane',
   front:`To ${recipient}, Blackwater Lane. Fourth residence on the ${bank} bank. Deliver when ${clock}. Do not cross by boat.`,
   reverse:'TRANSFER PRESS / ATLAS NOTE: Directions are mirrored on the receiving card. Read the canal from the opposite bank. The tower gate must face the destination.',
   atlas:'A canal divides the district. The fourth numbered residence is across the water. A hinged promenade can be held across the gap while the clocktower gate is turned into alignment.',
   ledger:'Postal register: nocturnal addresses require the moon-and-ink NOCTURNE stamp. The bridge hinge returns unless someone braces it.',
   requiredAngle:a?3:1, requiredDial:blackout, requiredStamp:'NOCTURNE',dialOptions:CLOCK,dialLabel:'Clock',foldLabel:'FOLD THE PROMENADE',turnLabel:'ROTATE CLOCKTOWER',
   drawing:'blackwater', hint:['The transfer press reverses east and west. Compare the address to the back of the envelope.','The destination is across the canal. Two people need to manipulate the bridge and tower at the same time.','The time condition and the NOCTURNE stamp are separate from the route. The fourth house is counted along the street.']
 },{
   id:'conservatory',number:'031',name:'The Folded Conservatory',recipient:'The Glasshouse',region:'Below the Cairn',
   front:b?'To the Glasshouse beneath Cairn Hill. Fold back the western ridge. The parcel must arrive upside down, and only when the water is low.':'To the Glasshouse beneath Cairn Hill. Fold back the western ridge. Keep the parcel upright. Dispatch when the water has retreated.',
   reverse:'HANDLE WITH CARE: the crest on the address is the destination marker. The hill is a single hinged piece; someone must brace it while a second person turns the greenhouse to meet the path.',
   atlas:'Cairn Hill hides a glass conservatory. Folding the ridge uncovers its door, but the approach does not meet the threshold until the greenhouse orientation is corrected.',
   ledger:'Postal register: botanical and glass shipments use the FRAGILE stamp. The flood dial controls the valley water level, not the weather.',
   requiredAngle:b?2:0, requiredDial:'LOW', requiredStamp:'FRAGILE',dialOptions:WATER,dialLabel:'Water',foldLabel:'FOLD THE RIDGE',turnLabel:'ROTATE GLASSHOUSE',drawing:'conservatory',
   hint:['The delivery instruction describes how the greenhouse must be oriented. Compare it to the compass on the folding card.','The ridge must stay folded while the destination is rotated into place. The flood dial is elsewhere on the apparatus.','The route requires the low-water position. Inspect both sides of the envelope to confirm how to handle the parcel.']
 }];
}
function createGame({code='SOLO',visibility='private',solo=false,difficulty='standard',seed=1,name='Explorer'}={}){
 const s={code:String(code),visibility:visibility==='public'?'public':'private',solo:!!solo,difficulty:['standard','expert','relaxed'].includes(difficulty)?difficulty:'standard',seed:Number(seed)||1,phase:solo?'playing':'lobby',
 hostId:solo?'solo':null,players:solo?[{id:'solo',name:safeName(name),ready:true,connected:true}]:[],index:0,deliveries:makeContracts(Number(seed)||1),completed:[],
 world:{foldHolder:null,aligned:false,angle:0,dial:'DUSK',stamp:null,inspected:[],hintTier:0}, events:[],chat:[],version:0,score:1000,errors:0,hintsUsed:0,startedAt:solo?Date.now():null,expired:false,pendingDelivery:false,deliveryAt:null,incident:null};
 record(s,'WELCOME','The night shift has begun. Read the mail before moving the machinery.',null);return s;
}
function record(g,type,message,actor,extra={}){g.version++;g.events.push({seq:g.version,type,message,actor:actor||null,at:Date.now(),...extra});g.events=g.events.slice(-35);}
function join(g,{id,name}={}){if(g.phase!=='lobby')return{error:'This shift has already started.'};if(g.players.length>=MAX_PLAYERS)return{error:'This sorting desk is full (4 players).'};if(g.players.some(p=>p.id===id))return{error:'Explorer already joined.'};let p={id:id||('p'+(g.players.length+1)),name:safeName(name),ready:g.players.length===0,connected:true};g.players.push(p);if(!g.hostId)g.hostId=p.id;record(g,'JOIN',`${p.name} joined the night shift.`,p.id);return{ok:true};}
function limitSeconds(g){return g.difficulty==='expert'?480:g.difficulty==='standard'?900:null;}
function expired(g){let max=limitSeconds(g);return max!=null&&g.startedAt!=null&&Date.now()-g.startedAt>=max*1000;}
function current(g){return g.deliveries[g.index]||null;}
function resetStation(g){const d=current(g);g.world={foldHolder:null,aligned:false,angle:d?.id==='blackwater'?0:1,dial:d?.id==='blackwater'?'DUSK':'HIGH',stamp:null,inspected:[],hintTier:0};}
function checkRoute(g){let d=current(g);if(!d)return false;return Boolean(g.world.foldHolder)&&g.world.aligned&&g.world.angle===d.requiredAngle&&g.world.dial===d.requiredDial;}
function solveStatus(g){let d=current(g);if(!d)return{route:false,ready:false};return{foldActive:!!g.world.foldHolder,routeAligned:g.world.aligned,route:checkRoute(g),stampApplied:!!g.world.stamp,ready:checkRoute(g)&&g.world.stamp===d.requiredStamp};}
function apply(g,playerId,action){if(!action||typeof action!=='object')return{error:'Invalid action.'};const p=g.players.find(x=>x.id===playerId);if(!p)return{error:'Not a member of this shift.'};if(g.phase==='lobby'){
 if(action.type==='READY'){p.ready=!!action.ready;record(g,'READY',`${p.name} is ${p.ready?'ready':'not ready'}.`,p.id);return{ok:true};}
 if(action.type==='VISIBILITY'){if(g.hostId!==playerId)return{error:'Only the host can change visibility.'};if(!['public','private'].includes(action.visibility))return{error:'Invalid room type.'};g.visibility=action.visibility;record(g,'LOBBY',`The room is now ${g.visibility}.`,playerId);return{ok:true};}
 if(action.type==='START'){if(g.hostId!==playerId)return{error:'Only the host can start.'};if(g.players.length<2)return{error:'Invite at least one other player to start online. Solo has its own mode.'};if(g.players.some(x=>!x.ready))return{error:'Every player must mark Ready.'};g.phase='playing';g.startedAt=Date.now();resetStation(g);record(g,'START',`${p.name} opened the sorting office.`,playerId);return{ok:true};}
 return{error:'The game has not begun.'};}
 if(g.phase!=='playing')return{error:'This shift is complete.'};if(g.pendingDelivery)return{error:'Delivery in progress.'};if(expired(g)){g.expired=true;g.phase='finished';record(g,'TIME','The night shift has ended.',null);return{error:'The shift ran out of time.'};}
 const w=g.world,d=current(g);let k=String(action.type||'');
 if(k==='INSPECT'){
  let target=String(action.target||'');if(!['front','reverse','atlas','ledger'].includes(target))return{error:'Nothing to inspect.'};
  if(!w.inspected.includes(target)){w.inspected.push(target);record(g,'DISCOVERY',`${p.name} inspected the ${target==='front'?'delivery address':target==='reverse'?'reverse postmark':target==='atlas'?'folded atlas':'postal register'}.`,playerId,{target});}return{ok:true};
 }
 if(k==='FOLD'){
  if(w.foldHolder===playerId){w.foldHolder=null;w.aligned=false;record(g,'FOLD',`${p.name} released the ${d.id==='blackwater'?'promenade':'ridge'}.`,playerId);return{ok:true};}
  if(w.foldHolder&&w.foldHolder!==playerId)return{error:'Another player is already bracing the fold.'};
  w.foldHolder=playerId;w.aligned=false;record(g,'FOLD',`${p.name} is holding the ${d.id==='blackwater'?'promenade':'ridge'} in place.`,playerId);return{ok:true};
 }
 if(k==='ROTATE'){
  if(!w.foldHolder)return{error:'The folding piece must be held in position first.'};
  if(!g.solo&&w.foldHolder===playerId)return{error:'You are bracing the fold. Ask a teammate to rotate the destination.'};
  if(![1,-1].includes(action.dir))return{error:'Invalid rotation.'};
  w.angle=(w.angle+action.dir+4)%4;w.aligned=true;record(g,'ROTATE',`${p.name} turned the ${d.id==='blackwater'?'clocktower':'conservatory'} toward ${DIRECTIONS[w.angle].toLowerCase()}.`,playerId);return{ok:true};
 }
 if(k==='DIAL'){
  let options=d.dialOptions;let val=String(action.value||'');if(!options.includes(val))return{error:'That setting does not exist.'};w.dial=val;record(g,'DIAL',`${p.name} set the ${d.dialLabel.toLowerCase()} dial to ${val.toLowerCase()}.`,playerId);return{ok:true};
 }
 if(k==='BLOT'){
  if(!g.incident||g.incident.type!=='INK'||g.incident.cleared)return{error:'There is no ink spill to clean.'};
  const spot=Number(action.spot);if(!Number.isInteger(spot)||spot<0||spot>2)return{error:'Select an ink stain.'};if(g.incident.stains[spot]===false)return{error:'That stain is already clean.'};g.incident.stains[spot]=false;record(g,'BLOT',`${p.name} blotted ink from the sorting desk.`,playerId,{spot});if(g.incident.stains.every(x=>x===false)){g.incident.cleared=true;record(g,'CLEAR','The sorting press is clean again. The ink parcel is contained.',playerId);}return{ok:true};
 }
 if(k==='STAMP'){
  if(g.incident&&!g.incident.cleared)return{error:'The stamping press is covered in black ink. Use the blotter to clean the three stains first.'};
  let val=String(action.value||'');if(!STAMPS.includes(val))return{error:'Unknown stamp.'};w.stamp=val;record(g,'STAMP',`${p.name} applied the ${val.toLowerCase()} stamp.`,playerId);return{ok:true};
 }
 if(k==='HINT'){
  if(w.hintTier>=3)return{error:'No additional hints available on this delivery.'};let hint=d.hint[w.hintTier];w.hintTier++;g.hintsUsed++;g.score=Math.max(0,g.score-35);record(g,'HINT',`The postal archive offers a clue: ${hint}`,playerId,{hintTier:w.hintTier});return{ok:true,hint};
 }
 if(k==='DISPATCH'){
  if(!w.inspected.includes('front'))return{error:'Inspect the address before dispatching.'};
  const route=checkRoute(g);const stamp=w.stamp===d.requiredStamp;
  if(!route||!stamp){g.errors++;g.score=Math.max(0,g.score-75);record(g,'MISHAP',route?'The sorting machine rejected the postage. Check the postal register.':'Delivery failed: the world is not yet in a traversable configuration.',playerId);return{error:route?'Postage was rejected. Check the register.':'No continuous route reaches the destination. Recheck the clues, fold, orientation, and dial.'};}
  g.pendingDelivery=true;g.deliveryAt=Date.now();record(g,'DISPATCH',`${p.name} dispatched parcel ${d.number}. The route is holding.`,playerId,{parcel:d.id});return{ok:true,dispatch:true};
 }
 return{error:'Unknown control.'};
}
function finalizeDelivery(g){if(!g.pendingDelivery||g.phase!=='playing')return{error:'No delivery is traveling.'};const d=current(g);g.pendingDelivery=false;g.completed.push({id:d.id,number:d.number,name:d.name,recipient:d.recipient});g.score+=140;record(g,'DELIVERED',`Parcel ${d.number} reached ${d.region}. Successful delivery.`,null,{parcel:d.id});g.index++;
 if(g.index>=g.deliveries.length){g.phase='finished';let elapsed=Math.max(1,Math.round((Date.now()-g.startedAt)/1000));g.score+=Math.max(0,Math.floor(600-elapsed)*2);record(g,'FINISH',`Shift complete. ${g.completed.length} impossible deliveries processed.`,null);}
 else {resetStation(g);g.incident={type:'INK',cleared:false,stains:[true,true,true]};record(g,'SPILL','An unregistered ink parcel burst on the sorting desk. Clean the stamping press while colleagues work on the next route.',null);record(g,'INCOMING',`A new delivery arrived: ${current(g).name}.`,null);}
 return{ok:true};
}
return{createGame,join,apply,finalizeDelivery,solveStatus,current,checkRoute,limitSeconds,expired,safeName,STAMPS,CLOCK,WATER,DIRECTIONS,makeContracts,clone};
});