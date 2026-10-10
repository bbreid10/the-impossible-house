/*
 * Optional beginner's guide: finds a legal route out of any two-explorer puzzle
 * state. It uses exactly the same validated actions as the multiplayer server,
 * and never moves a player unless the user chooses to follow a proposed step.
 * The guide is separate from the win condition and is not necessary to play.
 */
(function(root,factory){
  const value=factory(typeof module!=='undefined'&&module.exports?require('./engine.js'):root.ImpossibleEngine);
  if(typeof module!=='undefined'&&module.exports)module.exports=value;
  root.ImpossibleGuide=value;
})(typeof globalThis!=='undefined'?globalThis:this,function(E){
'use strict';
function key(g){
  return [g.phase,g.players.map(p=>p.room).join(','),Object.entries(g.rotation).map(([k,v])=>`${k}${v}`).join(','),+g.leverEnabled,
    g.shards.slice().sort().join(','),g.completedCards.slice().sort().join(','),g.activeRule||'-',+g.echoSeal,+g.heartRang,+g.exitUnlocked,g.cluesRead?.slice().sort().join(',')||'-',+g.riddleSolved,g.runeProgress||0,+g.dialSolved,...(g.dialSettings||[])].join('|');
}
function candidateActions(g){
  const actions=[],l=E.level(g),p0=g.players[0];
  // Find useful interactions first. For equal length solutions these appear early.
  const challenge=l.riddle||l.sequence;
  if(challenge){const clues=challenge.clues||{};for(const p of g.players)if(clues[p.room]&&!g.cluesRead.includes(p.room))actions.push({playerId:p.id,action:{type:'CLUE'}});}
  if(l.riddle&&!g.riddleSolved&&Object.keys(l.riddle.clues).every(r=>g.cluesRead.includes(r)))for(const p of g.players)if(p.room===l.riddle.room)actions.push({playerId:p.id,action:{type:'RIDDLE',answer:l.riddle.answer}});
  if(l.sequence&&g.runeProgress<l.sequence.rooms.length&&Object.keys(l.sequence.clues).every(r=>g.cluesRead.includes(r)))for(const p of g.players)if(p.room===l.sequence.rooms[g.runeProgress])actions.push({playerId:p.id,action:{type:'RUNE'}});
  // A guide may recommend one dial adjustment at a time. This prevents the
  // room-routing solver from getting stuck on a new, non-spatial puzzle state.
  if(l.dial&&!g.dialSolved){
    const index=g.dialSettings.findIndex((value,i)=>value!==l.dial.target[i]);
    if(index>=0){
      const current=g.dialSettings[index],target=l.dial.target[index];
      const delta=(target-current+4)%4<=2?1:-1;
      for(const p of g.players)if(p.room===l.dial.room)actions.push({playerId:p.id,action:{type:'DIAL',index,delta}});
    }
  }
  for(const p of g.players){if(!g.leverEnabled&&p.room===l.lever)actions.push({playerId:p.id,action:{type:'LEVER'}});}
  if(l.required&&!g.completedCards.includes(l.required)){
    const info=E.RULES[l.required];
    if(g.shards.includes(info.subject)&&g.shards.includes(info.predicate))actions.push({playerId:p0.id,action:{type:'INSCRIBE',rule:l.required}});
  }
  for(const id of g.unlockedRules){
    if(l.id==='floor4'&&id!=='mirrors')continue;
    if(l.id==='floor5'&&id!=='linked')continue;
    if(g.activeRule!==id)actions.push({playerId:p0.id,action:{type:'RULE',rule:id}});
  }
  for(const p of g.players){if(g.activeRule==='mirrors'&&l.mirrors.includes(p.room))actions.push({playerId:p.id,action:{type:'PORTAL'}});}
  if(g.leverEnabled){for(const id of l.rotators)actions.push({playerId:p0.id,action:{type:'ROTATE',room:id,dir:1}});}
  for(const p of g.players){for(const to of Object.keys(l.rooms)){
    if(to!==p.room&&E.connection(g,p.room,to).ok)actions.push({playerId:p.id,action:{type:'MOVE',to}});
  }}
  return actions;
}
function solve(original,{limit=10000}={}){
  if(!original||original.phase!=='playing'||original.players.length!==2)return null;
  const first=structuredClone(original),seen=new Set([key(first)]),queue=[{state:first,parent:-1,step:null}];
  let index=0;
  while(index<queue.length&&index<limit){
    const item=queue[index];
    if(item.state.phase==='intermission'||item.state.phase==='complete'){
      const path=[];let n=index;
      while(queue[n].parent>=0){path.push(queue[n].step);n=queue[n].parent;}
      return {steps:path.reverse(),visited:index+1};
    }
    for(const step of candidateActions(item.state)){
      const next=structuredClone(item.state),result=E.act(next,step.playerId,step.action);
      if(result.error)continue;
      const signature=key(next);
      if(seen.has(signature))continue;
      seen.add(signature);
      queue.push({state:next,parent:index,step});
    }
    index++;
  }
  return {steps:[],visited:index,unsolved:true};
}
function describe(g,step){
  if(!step)return {title:'You found the way out!',detail:'Every explorer has reached the exit.',target:null,label:'',spatial:false};
  const {action,playerId}=step,p=g.players.find(p=>p.id===playerId),l=E.level(g),where=l.rooms[p.room]?.name||'the house';
  switch(action.type){
    case 'CLUE':return {title:'Read the clue note',detail:`${p.name} is in ${where}. Examine the glowing clue and add it to the shared notebook. Both explorers have a clue to contribute.`,target:p.room,label:'✉ Read clue',spatial:true};
    case 'RIDDLE':return {title:'Solve the portraits’ question',detail:`${p.name} must stand in ${where}. Read both notes and choose the middle symbol. You can retry safely.`,target:p.room,label:'Choose a portrait',spatial:true,reasoning:true};
    case 'DIAL':return {title:'Turn the brass orrery',detail:`${p.name} is at the instrument. Read the three poetic clues and turn dial ${action.index+1} by one symbol. All players see the alignment.`,target:l.dial?.room||null,label:'Tune dial',spatial:true,reasoning:true};
    case 'RUNE':return {title:'Touch the next rune',detail:`${p.name} has reached the next rune room: ${where}. Look for the glowing Rune button. Clues reveal the proper order.`,target:p.room,label:'Touch rune',spatial:true,reasoning:true};
    case 'LEVER':return {title:'Pull the brass mechanism',detail:`${p.name} is already in ${where}. Use the crank to power the rotating chamber.`,target:p.room,label:'Pull the crank',spatial:true};
    case 'ROTATE':return {title:`Turn the ${l.rooms[action.room].name}`,detail:'Look for the two curved arrows directly on the glowing cog room. A turn changes which doors line up.',target:action.room,label:'↻ Rotate the room',spatial:false};
    case 'MOVE':return {title:`Walk to ${l.rooms[action.to].name}`,detail:`${p.name} can walk from ${where} to the green-outlined room. Click that room on the map.`,target:action.to,label:`Walk to ${l.rooms[action.to].name} →`,spatial:true};
    case 'PORTAL':return {title:'Use the glowing mirror',detail:`${p.name} is standing beside a silver mirror. Cast magic first, then step through it to the matching mirror.`,target:p.room,label:'◇ Step through mirror',spatial:true};
    case 'INSCRIBE':return {title:'Complete the magical sentence',detail:'Both word fragments have been found. Put them together in the Word Cards panel.',target:null,label:'✎ Write the sentence',spatial:false};
    case 'RULE':return {title:'Rewrite the house rules',detail:`Choose the card “${E.RULES[action.rule].title}”. Its effect will immediately appear on the map.`,target:null,label:`✧ Cast ${E.RULES[action.rule].title}`,spatial:false};
    default:return {title:'Try the next action',detail:'Follow the highlighted room or control.',target:null,label:'Continue',spatial:false};
  }
}
return {solve,describe};
});
