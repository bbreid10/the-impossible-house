'use strict';
const GUARD_ROUTE=['A','A','V','A','W','W','A','R'];
const NAMES={F:'Entrance',W:'Portrait Gallery',A:'Rotating Atrium',R:'Records Room',V:'Central Vault',E:'Service Exit'};
const LENS=['NORTH','EAST','WEST'];
const ART=['The Aster Prism','The Mourning Star','The Velvet Opal','The Midnight Reliquary'];
const CHAPTERS=['THE MIDNIGHT GALLERY','THE SCULPTURE WING','THE CURATOR’S VAULT'];
const escapeText=(x)=>String(x||'').replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,24)||'Guest';
function create({code='SOLO',visibility='private',solo=false,seed=3,difficulty='calm'}={}) {
 seed=Number.isFinite(Number(seed))?Math.abs(Math.floor(Number(seed))):3;
 return {code,visibility,solo,seed,difficulty,level:1,phase:solo?'playing':'lobby',players:[],host:null,
  tick:0,guardOffset:seed%GUARD_ROUTE.length,rotation:0,folded:false,bracedBy:null,braceUntil:0,
  lens:0,targetLens:seed%3,intel:false,blackoutUntil:0,distractionUntil:0,distractionAt:null,distractions:2,bonus:false,camerasJammedUntil:0,
  artifact:ART[seed%ART.length],loot:false,lootCarrier:null,alarm:0,actions:0,seconds:0,
  events:[{id:1,by:'MUSEUM',kind:'system',text:'The gala has ended. Security is still inside.'}],chat:[],version:1};
}
function addPlayer(s,{id,name}={}){
 if(s.phase!=='lobby'&& !s.solo)return {error:'The museum is already in lockdown. Join the next heist.'};
 if(s.players.length>=4)return {error:'Maximum four operatives.'};
 if(s.players.some(p=>p.id===id))return {error:'Already on the crew.'};
 let p={id:id||`p${s.players.length+1}`,name:escapeText(name),at:'F',ready:s.players.length===0,connected:true};
 s.players.push(p);if(!s.host)s.host=p.id;
 addEvent(s,p.name+' entered the safehouse.','join',p.name);return {ok:true,player:p};
}
function addEvent(s,text,kind='system',by='MUSEUM'){
 s.events.push({id:Date.now()+Math.random(),text,kind,by});s.events=s.events.slice(-24);s.version++;
}
function patrol(s){
 if(s.distractionUntil>s.tick)return s.distractionAt||'W';
 return GUARD_ROUTE[(s.tick+s.guardOffset)%GUARD_ROUTE.length];
}
function guardsVisible(s){return s.blackoutUntil<=s.tick;}
function laserEnabled(s){return (!s.intel||s.lens!==s.targetLens)&&s.blackoutUntil<=s.tick;}
function cameraSweep(s){return s.loot&&s.camerasJammedUntil<=s.tick&&s.blackoutUntil<=s.tick&&((s.tick+s.guardOffset)%4<2);}
function connections(s){return [['F','W'],['W','A'],...(s.rotation===1?[['A','V']]:[]),...(s.rotation===2?[['A','R']]:[]),...(s.folded?[['V','E']]:[])];}
function adjacent(s,a,b){return connections(s).some(([x,y])=>x===a&&y===b||x===b&&y===a)}
function overview(s){return {guard:patrol(s),connections:connections(s),laser:laserEnabled(s),lights:guardsVisible(s),lensTarget:LENS[s.targetLens],cameraActive:cameraSweep(s)};}
function penalize(s,reason){s.alarm++;addEvent(s,reason,'alarm');if(s.alarm>=3){s.phase='lost';addEvent(s,'LOCKDOWN. All exits are sealed.','lost');}return {ok:false,error:reason,stateChanged:true};}
function action(s,playerId,a={},now=Date.now()){
 const p=s.players.find(p=>p.id===playerId);if(!p)return {error:'Operative not found.'};
 if(s.phase==='lobby'){
  if(a.type==='READY'){p.ready=!!a.ready;s.version++;return {ok:true};}
  if(a.type==='VISIBILITY'){if(s.host!==p.id)return {error:'Only the host can change privacy.'};if(!['public','private'].includes(a.visibility))return {error:'Invalid visibility.'};s.visibility=a.visibility;s.version++;return {ok:true};}
  if(a.type==='START'){if(s.host!==p.id)return {error:'Only the host can start.'};if(s.players.length<2)return {error:'Two operatives needed for an online heist.'};if(s.players.some(x=>!x.ready))return {error:'Everyone must mark ready.'};s.phase='playing';s.tick=0;s.seconds=0;addEvent(s,'The museum doors have closed. The heist begins!','system');return {ok:true};}
  return {error:'Wait for the host.'};
 }
 if(s.phase!=='playing'){
  if(a.type==='NEXT_LEVEL'&&s.phase==='won'&&s.level<3&&(s.solo||s.host===p.id)){
   const level=s.level+1,oldPlayers=s.players.map(x=>({...x,at:'F',ready:true}));
   const next=create({code:s.code,visibility:s.visibility,solo:s.solo,seed:s.seed+level*17,difficulty:s.difficulty});
   Object.assign(s,next);s.level=level;s.players=oldPlayers;s.host=oldPlayers[0]?.id;s.phase='playing';
   addEvent(s,'CHAPTER '+level+': '+CHAPTERS[level-1]+'. New security pattern. The crew must coordinate again.','chapter');return {ok:true};
  }
  if(a.type==='RESTART'&&s.host===p.id){let n=create({code:s.code,visibility:s.visibility,solo:s.solo,seed:s.seed+7,difficulty:s.difficulty});const old=s.players.map(x=>({...x,at:'F',ready:true}));Object.assign(s,n);s.players=old;s.host=p.id;s.phase='playing';addEvent(s,'New heist. New patrol pattern.','system');return {ok:true};}
  return {error:'The heist has ended.'};
 }
 if(a.type==='CHAT'){return {error:'Use the chat endpoint.'};}
 const count=()=>{s.actions++;s.version++;};
 if(a.type==='MOVE'){
  let to=String(a.to||'');if(!(to in NAMES))return {error:'Unknown room.'};
  if(!adjacent(s,p.at,to))return {error:'There is no open passage between these rooms. Reconfigure the museum.'};
  if(p.at!=='F'&&guardsVisible(s)&&patrol(s)===to){return penalize(s,'A guard caught movement in '+NAMES[to]+'. Security is tightening.');}
  if(to==='E'&&s.loot&&s.lootCarrier===p.id&&cameraSweep(s))return penalize(s,'The service exit camera spotted the stolen artifact. Wait for its sweep or disable the cameras in Records.');
  if(to==='V'&&laserEnabled(s))return penalize(s,'The vault lasers are still live. Divert the light or cut power.');
  p.at=to;count();addEvent(s,`${p.name} entered ${NAMES[to]}.`,'move',p.name);
  if(to==='E'&&s.loot&&s.lootCarrier===p.id){s.phase='won';addEvent(s,`${p.name} extracted ${s.artifact}. The crew escaped!`,'won',p.name);}
  return {ok:true};
 }
 if(a.type==='ROTATE'){
  if(p.at!=='A')return {error:'Enter the Atrium to operate its pivot.'};
  const d=a.dir===-1?-1:1;s.rotation=(s.rotation+d+3)%3;count();addEvent(s,`${p.name} rotated the Atrium toward ${['the gallery','the vault','the records'][s.rotation]}.`,'rotate',p.name);return {ok:true};
 }
 if(a.type==='READ'){
  if(p.at!=='R')return {error:'The plans are in the Records Room.'};
  if(!s.intel){s.intel=true;count();addEvent(s,`${p.name} found the security blueprint: divert the beam ${LENS[s.targetLens]}.`,'intel',p.name);}return {ok:true};
 }
 if(a.type==='LENS'){
  if(p.at!=='A')return {error:'The mirror controls are in the Atrium.'};
  if(!s.intel)return {error:'The reflector has three settings. Find its blueprint in Records first.'};
  if(s.level>=2&&!s.solo&&!s.players.some(q=>q.id!==p.id&&q.at==='R'))return {error:'CHAPTER 2 CO-OP: A teammate must remain in Records to relay security calibration while you adjust the Atrium mirror.'};
  s.lens=(s.lens+(a.dir===-1?2:1))%3;count();addEvent(s,`${p.name} redirected the vault reflector ${LENS[s.lens]}.`,'lens',p.name);return {ok:true};
 }
 if(a.type==='BONUS'){
  if(p.at!=='W')return {error:'The special exhibit is in the Portrait Gallery.'};
  if(s.bonus)return {error:'You already recovered the curator’s secret.'};
  if(laserEnabled(s))return {error:'The framed case is wired to the vault beam. First read the blueprint and divert the beam.'};
  s.bonus=true;count();addEvent(s,`${p.name} lifted the curator’s midnight cameo. Optional prize secured.`,'bonus',p.name);return {ok:true};
 }
 if(a.type==='JAM_CAM'){
  if(p.at!=='R')return {error:'The surveillance circuit is in Records.'};
  if(!s.intel)return {error:'Read the security blueprint first.'};
  s.camerasJammedUntil=s.tick+10;count();addEvent(s,`${p.name} disabled the service corridor cameras for a short window.`,'camera',p.name);return {ok:true};
 }
 if(a.type==='WAIT'){s.tick++;count();addEvent(s,`${p.name} watched the patrol cycle.`,'wait',p.name);return {ok:true};}
 if(a.type==='BLACKOUT'){
  if(p.at!=='A'&&p.at!=='R')return {error:'The power controls are near the Atrium.'};
  if(s.blackoutUntil>s.tick)return {error:'Power is already interrupted.'};
  s.blackoutUntil=s.tick+4;count();addEvent(s,`${p.name} cut the museum lights for a few moments.`,'blackout',p.name);return {ok:true};
 }
 if(a.type==='DISTRACT'){
  if(s.distractions<=0)return {error:'No more distraction charges.'};
  s.distractions--;s.distractionUntil=s.tick+4;s.distractionAt='W';count();addEvent(s,`${p.name} triggered a decoy in the Portrait Gallery. Guards investigate.`,'lure',p.name);return {ok:true};
 }
 if(a.type==='LIFT'){
  if(p.at!=='V')return {error:'Reach the central vault first.'};
  if(s.loot)return {error:'The artifact has already been lifted.'};
  if(laserEnabled(s))return penalize(s,'A beam crossed the plinth. Security saw the attempt.');
  if(s.level>=3&&!s.solo&&!s.players.some(q=>q.id!==p.id&&q.at==='R'))return {error:'CHAPTER 3 CO-OP: Keep a second operative in Records monitoring security while the carrier takes the artifact.'};
  if(guardsVisible(s)&&patrol(s)==='V')return penalize(s,'A guard saw the vault display open.');
  s.loot=true;s.lootCarrier=p.id;count();addEvent(s,`${p.name} secured ${s.artifact}. Extract through the service exit.`,'loot',p.name);return {ok:true};
 }
 if(a.type==='BRACE'){
  if(s.solo)return {error:'The solo desk clamp is automatic. Fold the passage directly.'};
  if(p.at!=='A'&&p.at!=='R')return {error:'Brace the folding wing from the Atrium or Records.'};
  if(s.bracedBy===p.id){s.bracedBy=null;s.braceUntil=0;count();addEvent(s,`${p.name} released the folding wing.`,'fold',p.name);return {ok:true};}
  s.bracedBy=p.id;s.braceUntil=s.tick+10;count();addEvent(s,`${p.name} is holding the folding wing. Another operative can move it.`,'fold',p.name);return {ok:true};
 }
 if(a.type==='FOLD'){
  if(p.at!=='A'&&p.at!=='R')return {error:'The folding controls are in the Atrium or Records.'};
  if(!s.solo&&!(s.bracedBy&&s.bracedBy!==p.id&&s.braceUntil>s.tick))return {error:'Another operative must brace the fold before you move it.'};
  s.folded=!s.folded;s.bracedBy=null;s.braceUntil=0;count();addEvent(s,`${p.name} ${s.folded?'folded the service wing into a passage':'unfolded the service wing'}.`,'fold',p.name);return {ok:true};
 }
 return {error:'Unknown action.'};
}
function pulse(s){if(s.phase!=='playing')return false;s.tick++;s.seconds+=2.5;if(s.braceUntil&&s.tick>=s.braceUntil){s.bracedBy=null;s.braceUntil=0;addEvent(s,'The folding brace slipped.','system');}if(s.difficulty==='night'&&s.seconds>=480){s.phase='lost';addEvent(s,'The eight-minute security cycle completed. Lockdown.','lost');}s.version++;return true;}
function publicState(s){return {...s,chapterTitle:CHAPTERS[(s.level||1)-1],host:s.host,guard:patrol(s),connections:connections(s),lasersOn:laserEnabled(s),cameraActive:cameraSweep(s),lightsOn:guardsVisible(s),targetLensLabel:s.intel?LENS[s.targetLens]:null};}
const HEIST_API={create,addPlayer,action,pulse,publicState,patrol,adjacent,NAMES,LENS};
if(typeof module!=='undefined')module.exports=HEIST_API;
if(typeof window!=='undefined')window.HEIST_ENGINE=HEIST_API;
