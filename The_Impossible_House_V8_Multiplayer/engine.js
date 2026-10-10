/*
 * The Impossible House: deterministic, server-authoritative puzzle engine.
 * Rooms, player movement, House Rule cards and objectives are pure game logic.
 * The same engine runs in local solo play and on the Node multiplayer server.
 */
(function(root, factory){
  const engine=factory();
  if(typeof module!=='undefined' && module.exports)module.exports=engine;
  root.ImpossibleEngine=engine;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const DIRECTION=['N','E','S','W'];
const OPPOSITE={N:'S',E:'W',S:'N',W:'E'};
const RULES={
  mirrors:{id:'mirrors',title:'MIRRORS ARE DOORS',subject:'MIRRORS',predicate:'ARE DOORS',short:'Bend distance. Teleport and see through reflections.',desc:'Mirrors connect distant rooms and reveal what waits on their far side.',accent:'#9dc8d6',symbol:'◇'},
  linked:{id:'linked',title:'ROOMS TURN TOGETHER',subject:'ROOMS',predicate:'TURN TOGETHER',short:'Move two rooms as one. Open a living gear passage.',desc:'Turning one cog room turns the other in reverse and opens a gear passage between them.',accent:'#d8ba7e',symbol:'↻'},
  borrowed:{id:'borrowed',title:'WALLS BECOME DOORS',subject:'WALLS',predicate:'BECOME DOORS',short:'Turn sealed masonry into multiple walkable passages.',desc:'Every wall marked with the missing-door symbol opens a real passage.',accent:'#ba9bd5',symbol:'✦'}
};
// Physical evidence found by interacting with real props in Chapter 1.
const FIRST_ROOM_PROPS={
 study:{room:'A',name:'Caretaker’s letter',description:'In the Study, somebody left a letter beside a drawn lock. It explains why the house can be rewritten.'},
 cabinet:{room:'F',name:'Brass cabinet',description:'The winding key and one half of a sentence are sealed behind three number wheels.'},
 plaque:{room:'B',name:'The turning inscription',description:'Words etched behind the rotating brass wheel.'}
};
const FIRST_SAFE_CODE='231'; // Clue on Study letter: two moons, three stars, one sun.
const SECRETS={
  floor1:{room:'E',id:'moon-key',name:'The Moon’s Spare Key',detail:'A silver key no longer opens anything. The House keeps it anyway.'},
  floor2:{room:'D',id:'clockwork-bird',name:'A Clockwork Sparrow',detail:'It chirps each time someone makes a brave decision.'},
  floor3:{room:'A',id:'unsent-letter',name:'An Unsent Letter',detail:'Dear Guests, please stay for tea. Signed, The House.'},
  floor4:{room:'B',id:'portrait-scrap',name:'The Inverted Portrait',detail:'It has been painted upside down for two hundred years.'},
  floor5:{room:'D',id:'minute-hand',name:'A Clock With No Hours',detail:'It ticks only when somebody remembers a promise.'},
  finale:{room:'B',id:'first-invitation',name:'The First Invitation',detail:'A dusty invitation addressed to Nobody, from the loneliest mansion.'}
};
const SKINS=['#f6d7b5','#e8b78e','#cf956d','#ae7051','#86523f','#603c36','#482d2a','#322322'];
const HAIRS=['crop','waves','curls','coils','afro','bob','braids','twists','pixie','locs','bun','ponytail','side-part'];
const HAIR_COLORS=['#302734','#4c3530','#775038','#a2764b','#c3a070','#d8bc9c','#7b505a','#3b4851'];
const OUTFITS=['#385d62','#b66c58','#74708d','#b78d57','#60775c','#7c5879','#6d7060','#ac756f'];
const ACCESSORIES=['none','round glasses','bow','cap','scarf','star pin','headband','earrings','beret','brooch'];
const CLOTHES=['coat','waistcoat','sweater','dress','blazer','turtleneck'];
const EXPRESSIONS=['smile','curious','brave'];
const SPARKS=['gold','mint','lilac'];
const avatarFallback={skin:SKINS[2],hair:'waves',hairColor:HAIR_COLORS[0],outfit:OUTFITS[0],accessory:'none',clothes:'coat',expression:'smile',spark:'gold'};
function cleanName(value){return String(value||'').replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,16)||'Explorer';}
function cleanAvatar(obj){const o=obj&&typeof obj==='object'?obj:{};const pick=(key,options)=>options.includes(o[key])?o[key]:avatarFallback[key];return {skin:pick('skin',SKINS),hair:pick('hair',HAIRS),hairColor:pick('hairColor',HAIR_COLORS),outfit:pick('outfit',OUTFITS),accessory:pick('accessory',ACCESSORIES),clothes:pick('clothes',CLOTHES),expression:pick('expression',EXPRESSIONS),spark:pick('spark',SPARKS)};}
const r=(id,name,row,col,doors,detail='',rotatable=false)=>({id,name,short:name,row,col,doors,description:detail,rotatable});
const LEVELS=[
 {
  id:'floor1',number:1,title:'The House Has Opinions',subtitle:'The Turning Hall',epigraph:'Nothing is quite where it belongs.',intro:'Investigate the Study and locked cabinet, discover a hidden sentence, and use it to reunite at the exit.',required:'mirrors',spawn:['A','F'],
  rooms:{
   A:r('A','The Study',0,0,['E','S'],'A caretaker’s letter waits on the desk. Count the symbols to decode the brass cabinet.'),
   B:r('B','Turning Hall',0,1,['N','S'],'An engraving is hidden behind the great turning wheel. Rotate the hall to enter and inspect it.',true),
   C:r('C','The Staircase',0,2,['W'],'The exit is sealed by two ancient symbols.'),
   D:r('D','Mirror Gallery',1,0,['N'],'A silver mirror. A moon plate glimmers underfoot.'),
   E:r('E','Sun Chamber',1,1,['N'],'A golden sun plate hums whenever somebody stands here.'),
   F:r('F','East Mirror',1,2,[],'A locked cabinet contains the winding key. The ancient mirror reflects a room far away.')
  },rotators:['B'],lever:'F',shards:{F:'ARE DOORS',B:'MIRRORS'},plates:['D','E'],exit:'C',mirrors:['D','F'],
  story:['The House: “The caretaker left a note on the Study desk. One guest seems to have been stranded beside my mirror.”','The House: “You changed my words. I suppose I must change my walls.”'],
  hints:['Find and read the letter on the desk in A. Count its moons, stars and suns: 2-3-1.','Enter the cabinet code in F. The key inside powers the crank.','Rotate the hall to face left/right, enter B and inspect the hidden inscription.','Use both words to rewrite the rule MIRRORS ARE DOORS. This physically opens a doorway between D and F.','Put different explorers on the Moon and Sun seals, then bring both into exit C.']
 },
 {
  id:'floor2',number:2,title:'The Clockwork Gallery',subtitle:'The House is Ticklish',epigraph:'A room never turns alone.',intro:'The two cog rooms share a secret connection. Discover their sentence.',required:'linked',spawn:['A','F'],
  rooms:{
   A:r('A','Sunroom',0,0,['E','S'],'A faded map of the house rests on the windowsill.'),
   B:r('B','Clockwork Core',0,1,['N','S'],'A huge brass cog set into the floor.',true),
   C:r('C','Bell Tower',0,2,['W'],'Two bells hold the tower door shut.'),
   D:r('D','Gear Gallery',1,0,['N','E'],'A word fragment hidden behind a curious brass painting.'),
   E:r('E','Pendulum Hall',1,1,['N','S'],'The sister cog room, currently facing the wrong way.',true),
   F:r('F','Observatory',1,2,['W'],'A wind-up lever and the second half of a sentence.')
  },rotators:['B'],paired:['B','E'],lever:'F',shards:{D:'ROOMS',F:'TURN TOGETHER'},plates:['B','E'],exit:'C',mirrors:[],
  story:['The House: “My rooms have close relationships. Rather unhealthy ones.”'],
  hints:['One explorer should wind the clock in the Observatory. The other can search the Gear Gallery.','Combine ROOMS and TURN TOGETHER to learn the clockwork rule.','Cast the linked rule, then rotate the upper cog room once. The lower one moves too.','Stand in the two cog rooms at the same time to ring the twin bells.','The tower is unlocked. Everyone can reach it through the Sunroom and upper cog room.']
 },
 {
  id:'floor3',number:3,title:'The Forgotten Wing',subtitle:'Walls Have Feelings',epigraph:'An obstacle is simply an unflattered doorway.',intro:'Find the hidden door, then tune the brass orrery to unlock the attic.',required:'borrowed',spawn:['A','F'],
  rooms:{
   A:r('A','Ink Library',0,0,['E','S'],'Ink writes itself across the wallpaper.'),
   B:r('B','Crossing Room',0,1,['N','S'],'An old turning chamber.',true),
   C:r('C','Attic Door',0,2,['W'],'Two carved seals guard the attic stairs.'),
   D:r('D','Glass Garden',1,0,['N'],'An inscription grows among the vines: WALLS.'),
   E:r('E','Blank Gallery',1,1,['N'],'An ordinary-looking blank wall conceals a path.'),
   F:r('F','Forgotten Cell',1,2,[],'Knock on the wall. It might answer.')
  },rotators:['B'],lever:'F',shards:{D:'WALLS',F:'BECOME DOORS'},plates:['D','E'],exit:'C',mirrors:[],borrowed:[['E','F'],['D','E']],
  dial:{room:'B',title:'The Brass Orrery',symbols:['☾','☼','✦','◷'],labels:['Moon','Sun','Star','Clock'],target:[2,3,0],riddles:['First comes a light with five points, but no flame.','Second comes the witness that counts every hour.','Last comes the wanderer who borrows the sun’s light.']},
  story:['The House: “I dislike walls. They never listen.”'],
  hints:['Knock on the lonely wall in the Forgotten Cell and investigate the Glass Garden.','Combine WALLS and BECOME DOORS. Cast the sentence to open a wall passage.','The new doorway connects the isolated cell and the Blank Gallery.','When you can enter the Crossing Room, align the three brass dials: Star, Clock, Moon.','The exit is open. Rotate the Crossing Room as necessary and regroup at the attic door.']
 },

 {
  id:'floor4',number:4,title:'The Portrait Parliament',subtitle:'Two Clues, One Truth',epigraph:'Three portraits. Only one answer.',intro:'Each explorer has half a clue. Compare them, choose the middle symbol, and escape.',required:null,spawn:['A','F'],
  rooms:{
   A:r('A','Sun Archive',0,0,['E','S'],'A portrait whispers: The Sun comes before the Moon.'),
   B:r('B','Judgment Hall',0,1,['N','S'],'Three judgment portraits ask for the symbol in the middle.',true),
   C:r('C','Verdict Door',0,2,['W'],'The verdict and both seals unlock this door.'),
   D:r('D','Silver Gallery',1,0,['N'],'Moon seal and a silver mirror.'),
   E:r('E','Golden Chamber',1,1,['N'],'A sun seal beneath faded chandeliers.'),
   F:r('F','Clock Reflection',1,2,[],'A whisper: The clock follows the Moon. A mirror glimmers.')
  },rotators:['B'],lever:null,shards:{},plates:['D','E'],exit:'C',mirrors:['D','F'],
  riddle:{room:'B',title:'The Portraits’ Verdict',prompt:'Which symbol is in the middle of the three?',clues:{A:'The Sun refuses to stand directly beside the Clock.',F:'The Moon insists on standing immediately before the Clock.'},options:[{id:'sun',label:'☼ Sun'},{id:'moon',label:'☾ Moon'},{id:'clock',label:'◷ Clock'}],answer:'moon'},
  story:['The House: “Three portraits, one answer. None of them ever agrees with me.”'],
  hints:['Read the note in Sun Archive and the note in Clock Reflection.','The sun comes before the moon, and the clock comes after the moon.','Enter the Judgment Hall and choose the middle symbol.','Use MIRRORS ARE DOORS to rescue the explorer in the reflection.','Hold both seals, then rotate the hall to connect the Verdict Door.']
 },
 {
  id:'floor5',number:5,title:'The Borrowed Hour',subtitle:'The Moon, the Clock, the Sun',epigraph:'An hour may be borrowed, never stolen.',intro:'Two clues reveal the order. Link the gear rooms, then touch three runes in sequence.',required:null,spawn:['A','F'],
  rooms:{
   A:r('A','Hourglass Library',0,0,['E','S'],'A note says the moon opens the hour. The other half is missing.'),
   B:r('B','Great Clock',0,1,['N','S'],'The clock rune is carved into a turning chamber.',true),
   C:r('C','Dawn Staircase',0,2,['W'],'The staircase awakens after the three runes and both seals.'),
   D:r('D','Moon Landing',1,0,['N','E'],'A moon rune and cool silver seal.'),
   E:r('E','Sun Gear',1,1,['N','S'],'The rotating gear-room has a sun rune and golden seal.',true),
   F:r('F','Dusty Observatory',1,2,['W'],'The clock precedes the sun. The sun must finish the sequence.')
  },rotators:['B'],paired:['B','E'],lever:null,shards:{},plates:['D','E'],exit:'C',mirrors:[],
  sequence:{rooms:['D','B','E'],symbols:{D:'☾ Moon',B:'◷ Clock',E:'☼ Sun'},clues:{A:'The Moon wakes the mechanism. Nothing may be touched before it.',F:'The Sun must finish the hour. The Clock never follows the Sun.'}},
  story:['The House: “Time is quite flexible. Appointments are not.”'],
  hints:['Read both clue notes before touching the runes.','Order: Moon first, Clock second, Sun third.','Cast ROOMS TURN TOGETHER, then rotate the Great Clock to turn the Sun Gear.','Touch the Moon rune, then Clock, then Sun. Wrong order merely resets the runes.','Hold Moon Landing and Sun Gear simultaneously, then everyone walks into the Dawn Staircase.']
 },
 {
  id:'finale',number:6,title:'The Heart of the House',subtitle:'One Last Little Favor',epigraph:'It never wanted you to leave. Not really.',intro:'All three sentences are yours. This time you must change the rules more than once.',required:null,spawn:['A','F'],
  rooms:{
   A:r('A','Last Foyer',0,0,['E','S'],'The foyer is covered in tiny photographs of past explorers.'),
   B:r('B','The Heart',0,1,['N','S'],'A great wooden heart ticks inside the rotating chamber.',true),
   C:r('C','Front Door',0,2,[],'The front door has become a wall. How rude.'),
   D:r('D','Echo Gallery',1,0,['N'],'A mirror and a moon seal.'),
   E:r('E','Bone Clock',1,1,['N','S'],'The Sun Plate and the lower cog room.',true),
   F:r('F','Silent Mirror',1,2,[],'A second mirror. Not all paths need doors.')
  },rotators:['B'],paired:['B','E'],lever:null,shards:{},plates:['D','E'],exit:'C',mirrors:['D','F'],borrowed:[['B','C'],['E','F']],
  story:['The House: “I suppose you wish to leave. You always do.”'],
  hints:['Use MIRRORS ARE DOORS to free the explorer in the Silent Mirror.','One explorer must stand in Echo Gallery; another must reach the Bone Clock.','Once the two plates are held, cast ROOMS TURN TOGETHER and rotate the Heart.','After the heart rings, rotate back so the trapped explorer can leave the Bone Clock.','Cast WALLS BECOME DOORS and rotate the Heart sideways. The front door appears on its east wall. Regroup and escape.']
 }
];
// Bonus team word hunts appear only in Chapters 2 and 6. The rest of the
// campaign is made of room-routing, a mechanical dial, clues and rune logic.
// Boards are deterministic so every browser sees the same letters.
const HUNT_DEFS={
 floor2:{room:'D',title:'The Clockmaker’s Margins',subtitle:'Find five hidden words before the ink dries.',words:['PENDULUM','GEARS','BRASS','ECHO','CLOCK'],reward:'A hidden marginal note reads: one cog turns against the other. Your team has earned one free insight.'},
 finale:{room:'A',title:'The Guestbook Cipher',subtitle:'The House buried five memories in its last page.',words:['THRESHOLD','SHADOW','MIRROR','HEART','MEMORY'],reward:'A final dedication appears: old rules do not vanish. They wait to be used in a new order. One free insight earned.'}
};
function randomFromSeed(seed){let x=seed>>>0;return ()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296;};}
function makeHunt(def,seed){
 const size=10,random=randomFromSeed(seed),cells=Array(size*size).fill('');
 const directions=[[1,1],[0,-1],[1,0],[1,-1],[-1,0],[0,1],[-1,1],[-1,-1]];
 const placements={};
 for(const [n,word] of def.words.entries()){
  const options=[directions[n%directions.length],...directions];let placed=false;
  for(const [dr,dc] of options){
   for(let attempt=0;attempt<350;attempt++){
    const row=Math.floor(random()*size),col=Math.floor(random()*size),endR=row+dr*(word.length-1),endC=col+dc*(word.length-1);
    if(endR<0||endR>=size||endC<0||endC>=size)continue;
    const indices=[...word].map((_,i)=>(row+i*dr)*size+col+i*dc);
    if(!indices.every((index,i)=>!cells[index]||cells[index]===word[i]))continue;
    indices.forEach((index,i)=>{cells[index]=word[i];});placements[word]=indices;placed=true;break;
   }
   if(placed)break;
  }
  if(!placed)throw Error('Word board placement failed');
 }
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
 for(let i=0;i<cells.length;i++)if(!cells[i])cells[i]=alphabet[Math.floor(random()*alphabet.length)];
 return {...def,size,grid:cells.join(''),placements};
}
const HUNTS={floor2:makeHunt(HUNT_DEFS.floor2,742),finale:makeHunt(HUNT_DEFS.finale,1976)};
// Reject guessed words or arbitrary paths. A find must be one straight line on
// the actual board, including diagonal and backwards paths.
function selectedWord(board,from,to){
 const n=board.size;
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=n*n||to>=n*n||from===to)return null;
 const a=[Math.floor(from/n),from%n],b=[Math.floor(to/n),to%n],dR=b[0]-a[0],dC=b[1]-a[1];
 if(dR!==0&&dC!==0&&Math.abs(dR)!==Math.abs(dC))return null;
 const stepR=Math.sign(dR),stepC=Math.sign(dC),length=Math.max(Math.abs(dR),Math.abs(dC))+1;
 if(length>n)return null;
 const indices=Array.from({length},(_,i)=>(a[0]+i*stepR)*n+(a[1]+i*stepC));
 return {word:indices.map(i=>board.grid[i]).join(''),indices};
}
const LEVEL_BY_ID=Object.fromEntries(LEVELS.map(l=>[l.id,l]));
function level(state){return LEVEL_BY_ID[state.levelId]||LEVELS[0];}
function rooms(state){return level(state).rooms;}
function rotateDir(dir,turns){return DIRECTION[(DIRECTION.indexOf(dir)+turns%4+4)%4];}
function doorsAt(state,id){const room=rooms(state)[id];return room?room.doors.map(dir=>rotateDir(dir,state.rotation[id]||0)):[];}
function adjacentSide(a,b){if(!a||!b)return null;if(a.row===b.row&&a.col+1===b.col)return 'E';if(a.row===b.row&&a.col-1===b.col)return 'W';if(a.col===b.col&&a.row+1===b.row)return 'S';if(a.col===b.col&&a.row-1===b.row)return 'N';return null;}
function mirrorEdge(state,from,to){
 const m=level(state).mirrors||[];
 return state.activeRule==='mirrors'&&m.length>1&&from!==to&&m.includes(from)&&m.includes(to);
}
function borrowedEdge(state,from,to){return state.activeRule==='borrowed' && (level(state).borrowed||[]).some(([a,b])=>a===from&&b===to || b===from&&a===to);}
// A CAST of ROOMS TURN TOGETHER creates a *walkable* gear-shaft passage as
// well as linking rotations. This is real world geometry, not a text bonus.
function gearEdge(state,from,to){
 const l=level(state);return state.activeRule==='linked'&&Array.isArray(l.paired)&&l.paired.includes(from)&&l.paired.includes(to)&&from!==to;
}
// Shared preview. The server's rules and the client's "what changes" panel
// both use these exact affected rooms. Clients never validate movement.
function ruleEffect(state,rule){
 const l=level(state);
 if(rule==='mirrors')return l.mirrors.length>1?{rooms:[...l.mirrors],ways:[`${l.mirrors.join(' ↔ ')} mirror tunnel`],changes:['A real, clickable passage appears between the two distant mirror rooms','Stranded explorers can walk through glass to reunite','Reflections also reveal hidden clues'],color:'#bdc8cd'}:{rooms:[],ways:[],changes:['No paired mirrors on this floor. Try another rule.'],color:'#bdc8cd'};
 if(rule==='linked')return l.paired?.length===2?{rooms:[...l.paired],ways:[`${l.paired.join(' ↔ ')} gear shaft`],changes:['Both cog rooms rotate in opposite directions','An open shaft connects their floors, even with misaligned doors'],color:'#d7b488'}:{rooms:[],ways:[],changes:['No paired gears on this floor. Try another rule.'],color:'#d7b488'};
 if(rule==='borrowed'){const edges=l.borrowed||[];return {rooms:[...new Set(edges.flat())],ways:edges.map(([a,b])=>`${a} ↔ ${b} missing doorway`),changes:[`${edges.length} wall passage${edges.length===1?'':'s'} become real`,'Blocked routes reopen when you cast this rule'],color:'#c5ab91'};}
 return {rooms:[],ways:[],changes:[],color:'#d7b488'};
}
function connection(state,from,to){
 const all=rooms(state),a=all[from],b=all[to];
 if(!a||!b)return {ok:false,why:'That room does not exist.'};
 const side=adjacentSide(a,b);
 // When the player REWRITES reality, a new non-adjacent exit truly exists.
 // This is ordinary validated movement, not only a secret teleport button.
 if(!side && mirrorEdge(state,from,to))return {ok:true,mirrored:true,dir:'PORTAL'};
 if(!side)return {ok:false,why:'Those rooms are not connected. Look for an illuminated passage or rewrite a law of the House.'};
 // Borrowed doors appear on BOTH marked adjoining walls, irrespective of ordinary doors.
 const aligned=doorsAt(state,from).includes(side)&&doorsAt(state,to).includes(OPPOSITE[side]);
 if(!aligned&&!borrowedEdge(state,from,to)&&!gearEdge(state,from,to))return {ok:false,why:'Those doors are not connected. Try rotating a cog room or changing the House Rule.'};
 if(to===level(state).exit&&!state.exitUnlocked)return {ok:false,why:'The exit is sealed. Follow the objective to unlock it.'};
 return {ok:true,dir:side,borrowed:!aligned&&borrowedEdge(state,from,to),geared:!aligned&&gearEdge(state,from,to)};
}
function note(state,text,kind='system'){state.log.push({text,kind,at:Date.now()});if(state.log.length>12)state.log.shift();}
function newGame({code='SOLO00',visibility='private',solo=false}={}){
 const g={code,visibility,solo,hostId:null,players:[],phase:'lobby',levelId:'floor1',levelIndex:0,
  rotation:{},leverEnabled:false,firstProps:[],safeAttempts:0,shards:[],completedCards:[],unlockedRules:[],activeRule:null,lastRewrite:null,exitUnlocked:false,heartRang:false,echoSeal:false,
  cluesRead:[],riddleSolved:false,runeProgress:0,puzzleMistakes:0,dialSettings:[0,0,0],dialSolved:false,
  hunt:{status:'idle',found:[],expiresAt:0,attempts:0},insightTokens:0,
  moves:0,rotations:0,ruleChanges:0,hintsUsed:0,totalHints:0,startedAt:null,finishedAt:null,results:[],journal:[],version:0,ping:null,
  log:[],chat:[],foundSecrets:[]};
 resetFloor(g,0,false);g.phase='lobby';g.log=[];note(g,'The House: “Do come in. I have nearly everything under control.”','house');return g;
}
function resetFloor(state,index,hasStarted=true){
 const l=LEVELS[index];if(!l)throw Error('Unknown level index');
 state.levelId=l.id;state.levelIndex=index;state.rotation={};for(const room of Object.values(l.rooms))if(room.rotatable)state.rotation[room.id]=0;
 state.leverEnabled=!l.lever;state.firstProps=[];state.safeAttempts=0;state.shards=[];state.completedCards=[];state.activeRule=null;state.lastRewrite=null;state.exitUnlocked=false;state.heartRang=false;state.echoSeal=false;
 state.cluesRead=[];state.riddleSolved=false;state.runeProgress=0;state.puzzleMistakes=0;state.dialSettings=[0,0,0];state.dialSolved=false;
 state.hunt={status:'idle',found:[],expiresAt:0,attempts:0};
 state.moves=0;state.rotations=0;state.ruleChanges=0;state.hintsUsed=0;state.startedAt=hasStarted?Date.now():null;state.finishedAt=null;
 if(hasStarted){state.phase='playing';state.players.forEach((p,i)=>{p.room=l.spawn[i%l.spawn.length];});state.log=[];note(state,l.story[0],'house');}
}
function addPlayer(state,{id,name,avatar}={}){
 if(state.phase!=='lobby')return {error:'The expedition has already started. Ask the host to reopen the lobby.'};
 if(state.players.length>=4)return {error:'This house only has room for four explorers.'};
 if(state.players.some(p=>p.id===id))return {error:'Already in this expedition.'};
 const p={id:id||`p${state.players.length+1}`,name:cleanName(name),avatar:cleanAvatar(avatar),room:null,ready:state.players.length===0,connected:true};
 state.players.push(p);if(!state.hostId)state.hostId=p.id;
 state.version++;note(state,`${p.name} has entered the guestbook.`);return {ok:true,player:p};
}
function participantsAt(state,id){return state.players.filter(p=>p.room===id);}
function recalc(state){
 if(state.phase!=='playing')return;
 const l=level(state);const [a,b]=l.plates;
 if(!state.echoSeal&&participantsAt(state,a).length>0&&participantsAt(state,b).length>0 &&
  new Set([...participantsAt(state,a),...participantsAt(state,b)].map(p=>p.id)).size>=2){
  state.echoSeal=true;note(state,state.levelIndex===3?'The twin seals awaken. The Heart still needs to turn.':'The two seals light up. The exit is unlocked!','discovery');
 }
 const challengeSolved=(!l.riddle || state.riddleSolved)&&(!l.sequence || state.runeProgress===l.sequence.rooms.length)&&(!l.dial || state.dialSolved);
 if(l.id==='finale'){if(state.echoSeal&&state.heartRang)state.exitUnlocked=true;}
 else if(state.echoSeal&&challengeSolved)state.exitUnlocked=true;
 if(state.exitUnlocked && state.players.length>=2 && state.players.every(p=>p.room===l.exit)){
   state.finishedAt=Date.now();const stars=rating(state,'complete');
   state.results.push({levelId:state.levelId,title:l.title,stars,moves:state.moves,rotations:state.rotations,hints:state.hintsUsed,seconds:Math.round((state.finishedAt-state.startedAt)/1000)});
   state.phase=state.levelIndex===LEVELS.length-1?'complete':'intermission';
   note(state,state.phase==='complete'?'The House: “You found the door. Will you come back sometime?”':'The house gives a dramatic shudder. A new floor appears.','house');
 }
}
function success(state,message='',kind='system'){if(message)note(state,message,kind);state.version++;recalc(state);return {ok:true};}
function turnRoom(state,room,dir){
 const l=level(state);if(!l.rotators.includes(room))return {error:'That room is fixed in place.'};
 if(!state.leverEnabled)return {error:'The mechanism is locked. Find its switch first.'};
 const d=dir===-1?-1:1;state.rotation[room]=((state.rotation[room]||0)+d+4)%4;
 if(state.activeRule==='linked'&&l.paired){
  const other=l.paired.find(x=>x!==room);if(other)state.rotation[other]=((state.rotation[other]||0)-d+4)%4;
  if(l.id==='finale'&&state.echoSeal&&!state.heartRang){state.heartRang=true;note(state,'DING! The Heart rings. The front door is ready to be rewritten.','magic');}
 }
 state.rotations++;return success(state,`The ${l.rooms[room].name} turns ${d>0?'clockwise':'counterclockwise'}.`,'magic');
}
function findShard(state,room){const l=level(state),shard=l.shards[room];if(shard&&!state.shards.includes(shard)){
 state.shards.push(shard);note(state,`A word fragment appears: “${shard}”.`,'discovery');
}}
function act(state,playerId,action){
 if(!action||typeof action.type!=='string')return {error:'Invalid request.'};
 const p=state.players.find(x=>x.id===playerId);if(!p)return {error:'Explorer not found.'};
 const t=action.type;
 if(t==='READY'&&state.phase==='lobby'){p.ready=!!action.ready;return success(state);}
 if(t==='CUSTOMIZE'&&state.phase==='lobby'){p.avatar=cleanAvatar(action.avatar);p.name=cleanName(action.name);return success(state);}
 if(t==='VISIBILITY'&&state.phase==='lobby'&&state.hostId===playerId){if(!['private','public'].includes(action.visibility))return {error:'Invalid visibility.'};state.visibility=action.visibility;return success(state);}
 if(t==='START'&&state.phase==='lobby'){
  if(state.hostId!==playerId)return {error:'Only the room host can start.'};
  if(state.players.length<2)return {error:'At least two explorers are needed.'};
  if(!state.players.every(x=>x.ready))return {error:'Everyone must be ready.'};
  resetFloor(state,0,true);return success(state);
 }
 if(t==='CHAPTER'&&state.solo&&state.hostId===playerId&&Number.isInteger(action.index)&&action.index>=0&&action.index<LEVELS.length&&state.phase==='playing'){
  resetFloor(state,action.index,true);return success(state,'Playtest mode: the House opens the chosen chapter.');
 }
 if(t==='NEXT'&&state.phase==='intermission'){
  if(state.hostId!==playerId)return {error:'Only the host can choose the next floor.'};
  resetFloor(state,state.levelIndex+1,true);return success(state);
 }
 if(t==='RESET'&&['playing','intermission','complete'].includes(state.phase)){
  if(state.hostId!==playerId)return {error:'Only the host may restart.'};
  resetFloor(state,state.levelIndex,true);return success(state);
 }
 if(state.phase!=='playing')return {error:'The house is not open right now.'};
 const l=level(state),all=l.rooms;
 if(t==='MOVE'){
  if(p.room===action.to)return {error:'You are already there.'};
  const c=connection(state,p.room,action.to);if(!c.ok)return {error:c.why};
  p.room=action.to;state.moves++;if(l.id!=='floor1')findShard(state,action.to);return success(state, c.mirrored?`${p.name} walks THROUGH the mirror into ${all[action.to].name}. The new law has changed the floor plan!`:'');
 }
 if(t==='PORTAL'){
  if(state.activeRule!=='mirrors')return {error:'Activate MIRRORS ARE DOORS first.'};
  if(!l.mirrors.includes(p.room))return {error:'There is no enchanted mirror here.'};
  p.room=l.mirrors.find(x=>x!==p.room);state.moves++;return success(state,`${p.name} steps through a silver mirror.`,'magic');
 }
 // Mirrors are now tools for investigation as well as travel. A reflection
 // reads the distant mirror-room's clue from the other side of the floor.
 if(t==='REFLECT'){
  if(state.activeRule!=='mirrors'||!l.mirrors.includes(p.room)||l.mirrors.length<2)return {error:'Stand at an enchanted mirror after casting MIRRORS ARE DOORS.'};
  const destination=l.mirrors.find(x=>x!==p.room),refKey=`${l.id}-reflection-${destination}`;
  if(state.journal.some(entry=>entry.key===refKey))return {error:'That reflection is already in your notebook.'};
  const clue=l.riddle?.clues?.[destination]||l.sequence?.clues?.[destination];
  const detail=clue||l.rooms[destination].description;
  if(clue&&!state.cluesRead.includes(destination))state.cluesRead.push(destination);
  state.journal.push({key:refKey,title:`Reflection of ${l.rooms[destination].name}`,description:`From Room ${p.room} you witness Room ${destination}: ${detail}`});
  return success(state,`The mirror shows Room ${destination}: ${detail}`,'discovery');
 }
 if(t==='LEVER'){
  if(p.room!==l.lever)return {error:'The switch is in another room.'};
  if(state.leverEnabled)return {error:'The mechanism is already active.'};
  if(l.id==='floor1'&&!state.firstProps?.includes('cabinet'))return {error:'The crank has no winding key. Open the brass cabinet first by using the clue in the Study.'};
  state.leverEnabled=true;if(l.id!=='floor1')findShard(state,p.room);
  return success(state,'CLUNK! The winding key powers the hall. You can now rotate the giant mechanism in Room B.','discovery');
 }
 // A small, physical escape-room interaction: read a note, crack a cabinet,
 // and inspect a hidden engraving. The server checks who is in which room.
 if(t==='PROP' && l.id==='floor1'){
   const prop=action.prop;
   if(!['study','plaque'].includes(prop))return {error:'That object cannot be inspected that way.'};
   if(p.room!==FIRST_ROOM_PROPS[prop].room)return {error:`Move to Room ${FIRST_ROOM_PROPS[prop].room} to inspect that object.`};
   if(state.firstProps.includes(prop))return {error:'Your team already examined that evidence. Open Notes to read it again.'};
   if(prop==='plaque'&&!state.leverEnabled)return {error:'The brass wheel must turn before you can read the engraving.'};
   state.firstProps.push(prop);
   if(prop==='study'){
     state.journal.push({key:'floor1-letter',title:'Caretaker’s letter · Study',description:'“To wake the house, count the marks in order: moons, stars, suns. ☾☾ / ★★★ / ☼. Behind the three brass wheels waits a winding key. The HOUSE obeys what you WRITE.”'});
     return success(state,'You found a real clue! The letter shows ☾☾ / ★★★ / ☼. Count each group for the code on the brass cabinet in Room F.','discovery');
   }
   findShard(state,'B');
   state.journal.push({key:'floor1-inscription',title:'Engraving · Turning Hall',description:'Behind the rotating wheel: “MIRRORS”. This word belongs to the sentence found in the brass cabinet. What if the sentence could be made true?'});
   return success(state,'You read the hidden inscription: MIRRORS. The team now has a second word fragment.','discovery');
 }
 if(t==='SAFE' && l.id==='floor1'){
   if(p.room!=='F')return {error:'The combination cabinet is in Room F.'};
   if(state.firstProps.includes('cabinet'))return {error:'The cabinet is already open. Use the winding key to pull the crank.'};
   if(typeof action.code!=='string'|| !/^\d{3}$/.test(action.code))return {error:'Enter the three-number combination found in the caretaker’s letter.'};
   if(!state.firstProps.includes('study'))return {error:'Find the caretaker’s letter in the Study first. It explains the lock.'};
   if(action.code!==FIRST_SAFE_CODE){state.safeAttempts++;return success(state,'The cabinet rattles, but stays shut. The letter shows three groups: moons, stars, suns. Count each group.','house');}
   state.firstProps.push('cabinet');findShard(state,'F');
   state.journal.push({key:'floor1-cabinet',title:'Inside the brass cabinet',description:'A winding key, and the word fragment “ARE DOORS”. Another half of the sentence must be hidden near the turning wheel in Room B.'});
   return success(state,'CLICK! The cabinet opens. You recover a winding key and a paper fragment: ARE DOORS. The wheel in B may hide the other half.','discovery');
 }
 if(t==='REWRITE'){
   const rule=action.rule||l.required,info=RULES[rule];
   if(!info||rule!==l.required)return {error:'That sentence is not on this floor.'};
   if(!state.shards.includes(info.subject)||!state.shards.includes(info.predicate))return {error:'Find both word fragments first.'};
   if(state.activeRule===rule)return {error:'The new law is already in effect.'};
   if(!state.completedCards.includes(rule)){state.completedCards.push(rule);state.unlockedRules.push(rule);}
   const old=state.activeRule;state.activeRule=rule;state.ruleChanges++;
   const effect=ruleEffect(state,rule);
   state.lastRewrite={rule,old,rooms:effect.rooms,ways:effect.ways,changes:effect.changes,serial:state.ruleChanges,at:Date.now()};
   return success(state,`THE HOUSE CHANGES: ${info.title}! A new ${effect.ways.join(' · ')} opens. Click a glowing mirror room to walk through it.`,'magic');
 }
 if(t==='ROTATE')return turnRoom(state,action.room,action.dir);
 if(t==='INSCRIBE'){
  const rule=action.rule||l.required;
  if(!RULES[rule])return {error:'That sentence is not in the rulebook.'};
  if(rule!==l.required)return {error:'This floor has a different sentence to discover.'};
  if(state.completedCards.includes(rule))return {error:'You have already written this sentence.'};
  const info=RULES[rule];if(!state.shards.includes(info.subject)||!state.shards.includes(info.predicate))return {error:'Find both word fragments to write this sentence.'};
  state.completedCards.push(rule);state.unlockedRules.push(rule);return success(state,`THE RULEBOOK WRITES: ${info.title}`,'discovery');
 }
 if(t==='RULE'){
  if(action.rule!==null&&!state.unlockedRules.includes(action.rule))return {error:'You have not unlocked that rule.'};
  if(action.rule!==null&&!RULES[action.rule])return {error:'Unknown House Rule.'};
  if(state.activeRule===action.rule)return {error:'This rule is already active.'};
  const old=state.activeRule;
  state.activeRule=action.rule;state.ruleChanges++;
  const effect=action.rule?ruleEffect(state,action.rule):{rooms:[],ways:[],changes:['The house has returned to ordinary physics.']};
  state.lastRewrite={rule:action.rule,old,rooms:effect.rooms,ways:effect.ways,changes:effect.changes,serial:state.ruleChanges,at:Date.now()};
  return success(state,action.rule?`REALITY REWRITTEN: ${RULES[action.rule].title}. ${effect.changes.join('; ')}.`:'The words fade. Every magical passage closes.','magic');
 }
 if(t==='CLUE'){
  const clues=l.riddle?.clues||l.sequence?.clues;
  if(!clues||!clues[p.room])return {error:'There is no clue note in this room.'};
  if(state.cluesRead.includes(p.room))return {error:'The clue is already written in the team notebook.'};
  state.cluesRead.push(p.room);state.journal.push({key:`${l.id}-clue-${p.room}`,title:`✉ Clue from ${all[p.room].name}`,description:clues[p.room]});
  return success(state,`${p.name} found a clue: “${clues[p.room]}”`,'discovery');
 }
 if(t==='RIDDLE'){
  if(!l.riddle||p.room!==l.riddle.room)return {error:'Visit the Portrait Tribunal to answer its question.'};
  if(state.riddleSolved)return {error:'You have already solved the portraits.'};
  if(!Object.keys(l.riddle.clues).every(room=>state.cluesRead.includes(room)))return {error:'Read both clue notes first, one in each starting room.'};
  if(!l.riddle.options.some(o=>o.id===action.answer))return {error:'Choose one of the visible portrait symbols.'};
  if(action.answer!==l.riddle.answer){state.puzzleMistakes++;return success(state,'The portraits shake their heads. Not quite. Re-read the two clues, then try again.','house');}
  state.riddleSolved=true;return success(state,'The portraits bow. Correct! The Verdict Door is ready for the two seals.','discovery');
 }
 if(t==='RUNE'){
  if(!l.sequence||!l.sequence.rooms.includes(p.room))return {error:'Stand in a rune room to touch its symbol.'};
  if(state.runeProgress===l.sequence.rooms.length)return {error:'The three runes are already glowing.'};
  if(!Object.keys(l.sequence.clues).every(room=>state.cluesRead.includes(room)))return {error:'Read both clue notes before touching the runes.'};
  const expected=l.sequence.rooms[state.runeProgress];
  if(p.room!==expected){state.runeProgress=0;state.puzzleMistakes++;return success(state,'The runes blink and reset. The house is forgiving today. Read both clues and try a different order.','house');}
  state.runeProgress++;return success(state,state.runeProgress===l.sequence.rooms.length?'The three runes harmonize! Now occupy both seals.':`${l.sequence.symbols[p.room]} glows. ${l.sequence.rooms.length-state.runeProgress} rune(s) remain.`,'discovery');
 }
 // Shared, optional timed hunt. Any explorer may open the same board. The Node
 // server processes simultaneous finds sequentially; all clients receive the
 // updated found-word list through the existing live room event stream.
 if(t==='HUNT_START'){
  const board=HUNTS[l.id],now=Date.now();if(!board)return {error:'This chapter has no word hunt.'};
  if(p.room!==board.room)return {error:`The torn puzzle page is in Room ${board.room} (${l.rooms[board.room].name}). Visit it to begin the timed challenge. Once begun, everyone can solve together.`};
  if(state.hunt.status==='complete')return {error:'Your team already completed this word hunt.'};
  if(state.hunt.status==='active'&&state.hunt.expiresAt>now)return {error:'The hunt is already running. Find the words together.'};
  state.hunt={status:'active',found:[],expiresAt:now+75000,attempts:(state.hunt?.attempts||0)+1};
  return success(state,`${p.name} opened the ${board.title}. Everyone can search the same grid for 75 seconds!`,'discovery');
 }
 if(t==='HUNT_FIND'){
  const board=HUNTS[l.id],now=Date.now(),hunt=state.hunt;
  if(!board||hunt.status!=='active')return {error:'Open the word hunt first.'};
  if(now>=hunt.expiresAt)return {error:'The ink has dried. Start another attempt.'};
  const selection=selectedWord(board,action.from,action.to);
  if(!selection)return {error:'Choose two letters in a straight row, column, or diagonal.'};
  const word=board.words.find(w=>w===selection.word||w===[...selection.word].reverse().join(''));
  if(!word)return {error:'That is not one of the five hidden words. Look for diagonals and backwards letters.'};
  if(hunt.found.some(item=>item.word===word))return {ok:true,duplicate:true};
  hunt.found.push({word,by:p.name,at:now,indices:selection.indices});
  if(hunt.found.length===board.words.length){
   hunt.status='complete';hunt.completedAt=now;
   state.insightTokens=(state.insightTokens||0)+1;
   state.journal.push({key:`${l.id}-wordhunt`,title:`✧ ${board.title}`,description:board.reward});
   return success(state,`${p.name} found ${word}. All five discoveries are shared. Your team earned a free Insight token!`,'discovery');
  }
  return success(state,`${p.name} found ${word}! ${board.words.length-hunt.found.length} remain.`,'discovery');
 }
 // Required mechanical-dial puzzle is deliberately different from word hunts.
 // The symbols, not arbitrary hidden numerical codes, appear on the dials.
 if(t==='DIAL'){
  const d=l.dial;if(!d)return {error:'This chapter has no brass dials.'};
  if(p.room!==d.room)return {error:`Enter ${l.rooms[d.room].name} to turn the orrery.`};
  if(state.dialSolved)return {error:'The brass orrery is already aligned.'};
  if(!Number.isInteger(action.index)||action.index<0||action.index>2||![-1,1].includes(action.delta))return {error:'Choose a dial and rotate it one position.'};
  state.dialSettings[action.index]=(state.dialSettings[action.index]+action.delta+4)%4;
  if(state.dialSettings.every((setting,i)=>setting===d.target[i])){
   state.dialSolved=true;
   return success(state,'The brass orrery aligns. A hidden seal releases from the attic door.','discovery');
  }
  return success(state,`${p.name} adjusts brass dial ${action.index+1}. The instrument hums.`, 'magic');
 }
 if(t==='HINT'){
  const hints=hint(state,p),free=state.insightTokens>0;
  if(free)state.insightTokens--;else{state.hintsUsed++;state.totalHints++;}
  return success(state,`The House whispers: “${hints[0]}”${free?' (Free Insight used.)':''}`,'house');
 }
 if(t==='PING'){
  if(!all[action.room])return {error:'That room is not on this floor.'};
  state.ping={room:action.room,by:p.name,at:Date.now()};return success(state,`${p.name} pointed at ${all[action.room].name}.`,'ping');
 }
 if(t==='SEARCH'){
  const secret=SECRETS[l.id];
  if(!secret||p.room!==secret.room)return {error:'There is no mysterious keepsake in this room.'};
  if(!Array.isArray(state.foundSecrets))state.foundSecrets=[];
  if(state.foundSecrets.some(s=>s.id===secret.id))return {error:'Your team already found this keepsake.'};
  state.foundSecrets.push({...secret,level:l.number});
  state.journal.push({key:`secret-${secret.id}`,title:`✦ ${secret.name}`,description:secret.detail});
  return success(state,`You discovered a keepsake: ${secret.name}!`,'discovery');
 }
 if(t==='INSPECT'){
  if(!all[action.room]||action.room!==p.room)return {error:'Visit that room to inspect it.'};
  const key=`${l.id}-${p.room}`;
  if(state.journal.some(x=>x.key===key))return {error:'You have already inspected this room.'};
  state.journal.push({key,title:all[p.room].name,description:all[p.room].description});
  return success(state,`Journal updated: ${all[p.room].name}.`,'discovery');
 }
 return {error:'That action is not possible here.'};
}
function unlockFromPrevious(state){
 const previous=LEVELS.slice(0,state.levelIndex).map(l=>l.required).filter(Boolean);
 state.unlockedRules=[...new Set([...previous,...state.unlockedRules])];
 state.completedCards=[...new Set([...previous,...state.completedCards])];
}
// Patch stage reset once, so permanent House Rules persist between floors.
const begin=resetFloor;
resetFloor=function(state,index,hasStarted=true){begin(state,index,hasStarted);unlockFromPrevious(state);};
function objective(state,p){
 if(state.phase==='intermission')return {title:'Floor escaped!',detail:'The house has moved the staircase. Continue when everyone is ready.',action:'NEXT',label:'Enter next floor',target:null};
 if(state.phase==='complete')return {title:'You escaped the Impossible House!',detail:'The front door opens. The house seems disappointed.',action:null};
 const l=level(state),rule=l.required;
 if(l.id==='floor1'){
  const props=state.firstProps||[];
  if(!props.includes('study'))return {title:'Read the caretaker’s letter',detail:'A letter lies on the desk in the Study (Room A). Click Read Letter to discover your first clue.',target:'A',action:'PROP',prop:'study'};
  if(!props.includes('cabinet'))return {title:'Open the locked brass cabinet',detail:'Room F has a three-number lock. In the Study letter, count the moons, stars and suns. Work with your teammate to enter the code.',target:'F',action:'SAFE'};
  if(!state.leverEnabled)return {title:'Use the key to power the hall',detail:'The cabinet contained a winding key. Pull the crank in Room F to activate Room B.',target:'F',action:'LEVER'};
  if(!props.includes('plaque'))return {title:'Find the inscription inside Room B',detail:'Rotate Room B sideways to align it with Room A. Enter the hall and inspect the brass engraving.',target:'B',action:'PROP',prop:'plaque'};
  if(state.activeRule!=='mirrors')return {title:'Rewrite reality with your clues',detail:'You found MIRRORS + ARE DOORS. Put them together and make the statement TRUE. This creates a new passage between D and F.',target:null,action:'REWRITE',rule:'mirrors'};
  if(!state.echoSeal)return {title:'Light the Moon and Sun seals',detail:'The mirror rule opened a passage between Rooms F and D. Use it to reach the Moon seal while another explorer reaches the Sun seal in E.',target:'D',action:null};
  return {title:'Escape through the unsealed Staircase',detail:'Both seals have opened C. Rotate B so its doors face left/right, then bring every explorer into C.',target:'C',action:null};
 }
 if(l.riddle && !state.riddleSolved){
  const unread=Object.keys(l.riddle.clues).find(room=>!state.cluesRead.includes(room));
  if(unread)return {title:'Compare the two portrait clues',detail:`Read the note in ${l.rooms[unread].name}. Each explorer begins beside one clue.`,target:unread,action:'CLUE'};
  return {title:'Solve the portrait verdict',detail:`Travel to ${l.rooms[l.riddle.room].name}. Decide which symbol is between the other two. Wrong guesses are safe.`,target:l.riddle.room,action:'RIDDLE'};
 }
 if(l.sequence && state.runeProgress<l.sequence.rooms.length){
  const unread=Object.keys(l.sequence.clues).find(room=>!state.cluesRead.includes(room));
  if(unread)return {title:'Read both clock clues',detail:`Investigate the note in ${l.rooms[unread].name}, then compare it with your teammate's note.`,target:unread,action:'CLUE'};
  if(state.activeRule!=='linked')return {title:'Link the two gear rooms',detail:'Cast ROOMS TURN TOGETHER. Rotating the Great Clock also turns the Sun Gear so your teammate can leave the observatory.',action:'RULE',rule:'linked',label:'Cast linked rooms'};
  const next=l.sequence.rooms[state.runeProgress];
  return {title:`Find rune ${state.runeProgress+1} of 3`,detail:'Compare the two notes to work out which symbol comes next. Reach its room and touch that rune. Wrong orders simply reset.',target:null,action:'RUNE'};
 }
 if(rule){
  if(!state.leverEnabled)return {title:'Wake up the house',detail:`Switch to the explorer in ${l.rooms[l.lever].name}, then interact with the switch.`,target:l.lever,action:'LEVER',label:'Activate switch'};
  if(!state.completedCards.includes(rule)){
   const info=RULES[rule];if(state.shards.includes(info.subject)&&state.shards.includes(info.predicate))return {title:'Write the magic sentence',detail:`You found both fragments. Inscribe “${info.title}” in your book.`,action:'INSCRIBE',label:'Write the rule'};
   const missing=[info.subject,info.predicate].filter(sh=>!state.shards.includes(sh));
   const foundRoom=Object.entries(l.shards).find(([,word])=>missing.includes(word))?.[0];
   return {title:'Find the missing words',detail:`You still need: ${missing.join(' + ')}. The glowing clue is in ${l.rooms[foundRoom].name}.`,target:foundRoom,action:null};
  }
  if(state.activeRule!==rule && !state.echoSeal){return {title:'Change reality',detail:`Select “${RULES[rule].title}” to make the new sentence true.`,action:'RULE',label:'Cast the House Rule',rule};}
 }else if(l.id==='floor4'||l.id==='finale'){
  if(!state.echoSeal && state.activeRule!=='mirrors')return {title:'Use your mirror rule',detail:'Cast MIRRORS ARE DOORS to free your teammate from the Silent Mirror.',action:'RULE',label:'Cast MIRRORS ARE DOORS',rule:'mirrors'};
 }
 if(l.dial&&!state.dialSolved)return {title:'Align the brass orrery',detail:'Enter the Crossing Room. Use its three handwritten clues to set the Star, Clock, and Moon dials. Your teammate can turn rooms while you solve it.',target:l.dial.room,action:'DIAL'};
 if(!state.echoSeal)return {title:'Work together to unseal the exit',detail:`Place two different explorers on ${l.rooms[l.plates[0]].name} and ${l.rooms[l.plates[1]].name} at the same time.`,target:l.plates[0],action:null};
 if(l.id==='finale' && !state.heartRang)return {title:'Make the Heart ring',detail:'Cast ROOMS TURN TOGETHER. Rotate the glowing Heart chamber once.',target:'B',action:state.activeRule==='linked'?'ROTATE': 'RULE',rule:'linked',label:state.activeRule==='linked'?'Rotate the Heart':'Cast ROOMS TURN TOGETHER'};
 if(l.id==='finale' && state.activeRule!=='borrowed')return {title:'Invent the exit',detail:'Cast WALLS BECOME DOORS. The final blank wall becomes a doorway.',target:'C',action:'RULE',rule:'borrowed',label:'Cast WALLS BECOME DOORS'};
 return {title:'The door is open. Escape together!',detail:'Bring every explorer to the exit. Rotate the glowing chamber to reconnect the final passage.',target:l.exit,action:null};
}
function hint(state,p){
 const l=level(state);if(state.phase!=='playing')return ['Enjoy your victory.'];
 const o=objective(state,p);
 if(l.id==='floor1')return [o.detail,'Click the glowing object in the room where the clue is found. The Notes drawer keeps your evidence.','MIRRORS ARE DOORS turns two distant mirror chambers into a real new doorway.'];
 const generic={
  'Wake up the house':`Look for the brass mechanism in ${l.rooms[l.lever].name}. Switch explorers in solo mode if needed.`,
  'Find the missing words':`A glowing word fragment is waiting in ${l.rooms[o.target]?.name||'another room'}. Green room borders show where you can walk.`,
  'Write the magic sentence':'Both fragments are in the Word Cards panel. Write the finished sentence to unlock its power.',
  'Change reality':'Cast the highlighted House Rule card before trying the magical passage.',
  'Align the brass orrery':'The three dials show symbols, not numbers. Read the clues beneath them. You need Star, Clock, Moon from left to right.',
  'Work together to unseal the exit':`Two distinct explorers must occupy ${l.rooms[l.plates[0]].name} and ${l.rooms[l.plates[1]].name}. Rotate the cog chamber to make paths align.`,
  'Use your mirror rule':'In the rulebook, select MIRRORS ARE DOORS and use the portal to free the stranded explorer.',
  'Make the Heart ring':'Change to ROOMS TURN TOGETHER, then rotate the Heart once. Both cog rooms will move.',
  'Invent the exit':'Switch to WALLS BECOME DOORS. The front wall can become an exit.',
  'The door is open. Escape together!':'Everyone must reach the exit. Sometimes you must rotate the hall while your explorer is inside it.'
 };
 return [generic[o.title]||l.hints[Math.min(4,state.hintsUsed%5)],...l.hints];
}
function progress(state){const l=level(state);
 if(l.id==='floor1')return [
  {label:'Investigate',done:(state.firstProps||[]).includes('study')},
  {label:'Unlock cabinet',done:(state.firstProps||[]).includes('cabinet')},
  {label:'Rewrite',done:state.activeRule==='mirrors'},
  {label:'Escape',done:['intermission','complete'].includes(state.phase)}];
 if(l.dial)return [
 {label:'Find words',done:state.completedCards.includes(l.required)},
 {label:'Brass dials',done:state.dialSolved},
 {label:'Two seals',done:state.echoSeal},
 {label:'Escape',done:['intermission','complete'].includes(state.phase)}];if(l.riddle)return [
 {label:'Two clues',done:Object.keys(l.riddle.clues).every(r=>state.cluesRead.includes(r))},
 {label:'Verdict',done:state.riddleSolved},
 {label:'Two seals',done:state.echoSeal},
 {label:'Escape',done:['intermission','complete'].includes(state.phase)}];
 if(l.sequence)return [
 {label:'Two clues',done:Object.keys(l.sequence.clues).every(r=>state.cluesRead.includes(r))},
 {label:`Runes ${state.runeProgress}/3`,done:state.runeProgress===l.sequence.rooms.length},
 {label:'Two seals',done:state.echoSeal},
 {label:'Escape',done:['intermission','complete'].includes(state.phase)}];return [
 {label:'Discover',done:!l.required || state.completedCards.includes(l.required)},
 {label:'Rewrite',done:!!state.activeRule},
 {label:'Cooperate',done:state.echoSeal},
 {label:'Escape',done:['intermission','complete'].includes(state.phase)}
];}
function rating(state,phase=state.phase){if(!['intermission','complete'].includes(phase))return 0;if(state.hintsUsed===0&&state.rotations<=5)return 3;if(state.hintsUsed<=2&&state.rotations<=9)return 2;return 1;}
return {LEVELS,LEVEL_BY_ID,RULES,SECRETS,FIRST_ROOM_PROPS,HUNTS,selectedWord,SKINS,HAIRS,HAIR_COLORS,OUTFITS,ACCESSORIES,CLOTHES,EXPRESSIONS,SPARKS,avatarFallback,
 newGame,addPlayer,act,rooms,level,doorsAt,connection,ruleEffect,progress,objective,hint,rating,cleanAvatar,cleanName};
});
