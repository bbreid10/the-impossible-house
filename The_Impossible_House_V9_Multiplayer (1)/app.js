/*
 * The Impossible House — illustrated browser client.
 * Solo story uses the exact multiplayer rules while letting one tester switch
 * between explorers. Online sessions use a server-authoritative shared state.
 */
(()=>{
'use strict';
const E=window.ImpossibleEngine, Art=window.ImpossibleArt, Guide=window.ImpossibleGuide, mount=document.getElementById('app');
if(!E||!Art){mount.textContent='The house lost its rulebook. Please reload.';return;}
const escape=(text)=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const symbol={house:'⌂',arrow:'→',back:'←',star:'✦',lock:'♢',globe:'◎',users:'♧',spark:'✧',book:'▤',chat:'☏',eye:'◉',rotate:'↻',link:'⛓',moon:'☾',sun:'☼',mirror:'◇',check:'✓',clock:'◷',cup:'♔',menu:'☰',pin:'⌖'};
const profileKey='impossible-house-profile-v3',sessionKey='impossible-house-session-v8',soloKey='impossible-house-solo-v8';
const ui={screen:'home',online:false,checking:true,game:null,solo:false,selectedPlayer:null,playerId:null,token:null,stream:null,
 guided:false,practiceTurn:0,practiceComplete:false,blockedReason:'',soundOn:false,guideCache:null,huntFrom:null,lastExpiredHuntStamp:0,
 name:'Explorer',avatar:{...E.avatarFallback},avatarTab:'hair',lobbyType:'private',code:'',invited:false,publicRooms:[],
 error:'',toast:'',tab:'rules',showGuide:false,helpPage:0,selectedRoom:null,chatDraft:'',muted:new Set(),connection:'offline',working:false,returnTo:'home'};
try{const data=JSON.parse(localStorage.getItem(profileKey)||'{}');if(data.name)ui.name=E.cleanName(data.name);if(data.avatar)ui.avatar=E.cleanAvatar(data.avatar);}catch{}
const params=new URLSearchParams(location.search),invite=params.get('room');if(invite&&/^[A-F0-9]{6}$/i.test(invite)){ui.code=invite.toUpperCase();ui.invited=true;ui.screen='match';}
const isSoloSaved=()=>{try{return !!localStorage.getItem(soloKey);}catch{return false;}};
const saveProfile=()=>{try{localStorage.setItem(profileKey,JSON.stringify({name:ui.name,avatar:ui.avatar}));}catch{}};
function saveSolo(){if(ui.solo&&ui.game)try{localStorage.setItem(soloKey,JSON.stringify({game:ui.game,selectedPlayer:ui.selectedPlayer}));}catch{}}
function saveSession(){if(!ui.solo&&ui.token&&ui.game)try{localStorage.setItem(sessionKey,JSON.stringify({token:ui.token,code:ui.game.code}));}catch{}}
function avatar(data=ui.avatar){return `<span class="avatar-art">${Art.avatar(data)}</span>`;}
function button(text,action,variant='primary',attrs=''){return `<button type="button" class="btn ${variant}" data-action="${action}" ${attrs}>${text}</button>`;}
function badge(text,cls=''){return `<span class="tag ${cls}">${text}</span>`;}
function coachStep(g){
 if(!ui.guided||!Guide||!g||g.players.length!==2||g.phase!=='playing')return null;
 if(ui.guideCache?.version===g.version&&ui.guideCache?.levelId===g.levelId)return ui.guideCache;
 const solved=Guide.solve(g,{limit:10000});
 const next=solved?.steps?.[0]||null;
 const result={version:g.version,levelId:g.levelId,next,info:next?Guide.describe(g,next):null,unsolved:!!solved?.unsolved};
 ui.guideCache=result;return result;
}
function playSound(kind){
 if(!ui.soundOn)return;
 try{
  const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;
  const a=window.__houseAudio||(window.__houseAudio=new Context());
  const o=a.createOscillator(),v=a.createGain(),now=a.currentTime;
  o.type='sine';o.frequency.setValueAtTime(kind==='RULE'?610:kind==='ROTATE'?325:kind==='PORTAL'?480:620,now);
  if(kind==='RULE'||kind==='PORTAL')o.frequency.exponentialRampToValueAtTime(kind==='RULE'?920:710,now+.19);
  v.gain.setValueAtTime(.0001,now);v.gain.exponentialRampToValueAtTime(.055,now+.018);v.gain.exponentialRampToValueAtTime(.0001,now+.25);
  o.connect(v);v.connect(a.destination);o.start(now);o.stop(now+.27);
 }catch{}
}
function toast(message){ui.toast=message;render();}
function topbar(){return `<header class="topbar"><button class="brand" data-action="home" aria-label="Return to game menu"><span class="brand-mark">⌂</span><span>THE IMPOSSIBLE<br><b>HOUSE</b></span></button><span class="header-label">AN UNLIKELY ESCAPE</span><button class="profile-chip" data-action="creator">${avatar(ui.avatar)}<span>${escape(ui.name)}<small>YOUR EXPLORER</small></span></button></header>`;}
function layout(content,kind=''){return `<div class="app-shell">${topbar()}<main class="page ${kind}">${content}</main><footer class="bottomline"><span>✧ AN ESCAPE-ROOM MYSTERY WHERE WORDS CHANGE THE FLOORPLAN</span><span>${ui.online?'● FRIEND ROOMS AVAILABLE':'○ SOLO PLAY AVAILABLE'}</span></footer></div>${ui.toast?`<div class="toast" role="status">${escape(ui.toast)}</div>`:''}${ui.showGuide?`<div class="modal-shade"><div class="modal-content v4-help"><button class="modal-close" data-action="close-help" aria-label="Close guide">×</button><span class="eyebrow">THE HOUSE FIELD GUIDE</span><h2>Four things to know</h2><div class="help-steps"><p><strong>1 · SWITCH</strong> In solo mode, tap either explorer portrait to control that person.</p><p><strong>2 · WALK</strong> Tap a room with a <em>green border</em>. Two facing doors must line up.</p><p><strong>3 · TURN</strong> Use the big ROTATE buttons <em>below the six-room map</em> to turn Room B 90°. North/South and East/West connect different corridors.</p><p><strong>4 · CHANGE A RULE</strong> Collect two word cards, write the sentence and cast it. MIRRORS ARE DOORS, for example, lets you teleport between Rooms D and F. Only one rule is active at a time. Room C is the sealed exit.</p></div><p class="help-extra">Need exact instructions? Turn on <b>Guide me</b> above the map. It can show you the next legal move.</p>${button('Back to the house →','close-help','primary wide')}</div></div>`:''}`;}

function home(){return layout(`<div class="home-grid"><section class="home-copy"><p class="eyebrow">A COOPERATIVE ESCAPE-ROOM MYSTERY · SIX CHAPTERS</p><h1 class="hero-title">The house<br><i>rewrites itself.</i></h1><p class="hero-sub">Six rooms. One sealed exit. Every law you write alters the architecture. <b>Find the crank. Rotate a room. Discover a rule. Rebuild the way out.</b> Each chapter introduces one new escape-room mystery. Play solo as two explorers or solve it together online.</p><div class="home-ctas">${button('Begin the story <span>→</span>','solo','primary huge')}${button('Enter with friends <span>→</span>','match','secondary huge')}${isSoloSaved()?button('Continue previous escape ↗','continue-solo','light'):''}</div><div class="home-mini-actions">${button('Customize your explorer','creator','light')}${button('How the house works','help','light')}${button('Select chapter (playtesting)','chapters','text')}${button('Try controls (60 sec)','practice','text')}</div><div class="home-proof"><span>01 / EXPLORE</span><span>02 / REWRITE REALITY</span><span>03 / ESCAPE TOGETHER</span></div>${!ui.online?'<p class="warning-note">Solo play is available. Hosted multiplayer rooms become available when the server is online.</p>':''}</section><section class="hero-art"><div class="hero-art-stage"><img src="assets/foyer-architectural.webp" alt="A candlelit architectural escape room with deep shadows and antique stairs"/><span class="hero-seal">SIX ROOMS<br><strong>ONE EXIT</strong></span></div><div class="house-quote"><b>RULE NO. 1</b><span>The house must obey what you write.</span></div></section></div>`,'home-page');}
function chapters(){
 const titles=['Learn to open Room C (no word search yet)','🔎 TEAM WORD SEARCH + linked gears','Open walls + brass orrery','Deduce the portrait order','Solve a three-rune sequence','Combine rules + final Word Hunt'];
 return layout(`<section class="chapter-page"><p class="eyebrow">SOLO PLAYTEST · CHOOSE WHERE TO START</p><h1>Every room is a<br><i>different puzzle.</i></h1><p>Start anywhere to test puzzles without replaying the story. Different chapters have different puzzles, including an optional shared word hunt hidden in the story. Earlier magic cards will already be unlocked.</p><div class="chapter-cards">${E.LEVELS.map((l,i)=>`<button class="chapter-pick" data-action="pick-chapter" data-index="${i}"><span>CHAPTER ${i+1} / ${E.LEVELS.length}</span><b>${escape(l.title)}</b><small>${escape(titles[i])}</small><em>Play →</em></button>`).join('')}</div>${button('← Back','home','light')}</section>`,'wide-page');
}
function help(){const pages=[
 {n:'01',title:'Walk through matching doors',text:'You are inside a floor plan of six rooms. Tap a green-outlined neighboring room to enter. A passage works only when the doors on both sides face each other.',pic:'🚪  →  🚪',note:'Green = reachable · Gold = your room · Red = locked'},
 {n:'02',title:'Rotate the glowing room',text:'Use the large ROTATE ROOM B arrows underneath the map. Turning 90° changes North/South doors into East/West doors. To reach Room C, Room B must face East/West and the exit must be unsealed.',pic:'↕  ⟳  ↔',note:'You can rotate the cog room from anywhere once it has power.'},
 {n:'03',title:'Write a rule. Change the house.',text:'Each floor hides word fragments. Collect both halves, write a sentence, and cast its magic. In the finale, switch between your learned rules to escape.',pic:'MIRRORS + ARE DOORS',note:'Solo: switch portraits to control both explorers. Online: each friend controls one.'}
];const p=pages[ui.helpPage];return layout(`<section class="help-wrap"><p class="eyebrow">HOUSE RULES · SIMPLE ENOUGH, USUALLY</p><h1>How to escape a house<br><i>that cheats.</i></h1><div class="help-paper"><div class="help-number">${p.n} / 03</div><div class="help-illustration">${escape(p.pic)}</div><h2>${escape(p.title)}</h2><p>${escape(p.text)}</p><span class="help-note">${escape(p.note)}</span><div class="help-footer">${button('← Back','help-prev','light',ui.helpPage===0?'disabled':'')}${button(ui.helpPage===2?'Start solo story →':'Next →',ui.helpPage===2?'solo':'help-next','primary')}</div></div>${button('← Return to menu','home','text')}</section>`,'help-page');}
function publish(){
 const live=ui.online&&location.protocol.startsWith('http');
 return layout(`<section class="publish-page"><p class="eyebrow">INVITE YOUR FRIENDS · PUBLIC WEBSITE</p><h1>A door your friends<br><i>can actually open.</i></h1><p class="practice-sub">${live?'This copy is connected to a real room server. Share this website, create a private room, or browse public rooms.':'The downloaded HTML is a solo playtest. To play online, the multiplayer ZIP must run on a public server. A file on your Mac cannot become an online room by itself.'}</p><div class="publish-steps">${live?`<div class="publish-step"><span>✓</span><div><h2>Website is connected</h2><p>Public site: ${escape(location.origin)}. Create a room, then copy its invite link to a friend.</p>${button('Create or join a room →','match','primary')}</div></div>`:`<div class="publish-step"><span>01</span><div><h2>Get the full game ZIP</h2><p>Use the V7 Multiplayer ZIP attached to this ChatGPT message, not the solo HTML. Extract it to a folder.</p></div></div><div class="publish-step"><span>02</span><div><h2>Put the files on GitHub</h2><p>Make a new repository at <a href="https://github.com/new" target="_blank" rel="noopener noreferrer">github.com/new</a>. Upload the extracted files into the repository root.</p></div></div><div class="publish-step"><span>03</span><div><h2>Deploy on Render</h2><p>Open <a href="https://dashboard.render.com" target="_blank" rel="noopener noreferrer">dashboard.render.com</a>. Create a Node Web Service connected to that repository, select Free if offered, and use <code>npm install</code> and <code>npm start</code>.</p></div></div><div class="publish-step"><span>04</span><div><h2>Share the HTTPS link</h2><p>Once Render says Live, open its URL, select Play with friends, and send someone a private room link. Public rooms will appear in the room browser.</p></div></div>`}</div><p class="info-banner">Free hosting may sleep when idle and reset rooms after a restart. Public chat uses a basic filter, not comprehensive human moderation. Test first with friends you trust.</p>${button('← Return to the game','home','light')}</section>`,'publish-wrapper');
}
function practice(){
 const turn=ui.practiceTurn%2===1;
 return layout(`<section class="practice-page"><p class="eyebrow">60-SECOND PRACTICE · NO PRESSURE</p><h1>First, learn <i>the doors.</i></h1><p class="practice-sub">You're in the Study on the left. You want to reach the Exit on the right. The middle room is facing the wrong way.</p><div class="practice-board"><div class="practice-room"><span>📚</span><strong>YOU</strong><small>STUDY</small><div class="practice-door east"></div></div><div class="practice-gap ${turn?'linked':''}">${turn?'✓':'×'}</div><div class="practice-room practice-center ${turn?'open':''}"><span class="practice-rotation">${turn?'← →':'↑ ↓'}</span><strong>TURNING HALL</strong><small>${turn?'DOORS LINE UP!':'DOORS BLOCKED'}</small><div class="practice-door ${turn?'west':'north'}"></div><div class="practice-door ${turn?'east':'south'}"></div></div><div class="practice-gap ${turn?'linked':''}">${turn?'✓':'×'}</div><div class="practice-room"><span>🚪</span><strong>EXIT</strong><small>WAITING</small><div class="practice-door west"></div></div></div><div class="practice-note"><span class="practice-number">${ui.practiceComplete?'3':turn?'2':'1'} / 3</span><div><h2>${ui.practiceComplete?'You opened your first path!':turn?'The green doors are connected.':'The middle doors don’t face the exits.'}</h2><p>${ui.practiceComplete?'In the real game, tap green rooms to move, switch explorers to cooperate, and collect Word Cards to bend the rules.':turn?'Tap Walk through to practice escaping. If a passage turns green, you can use it.':'Tap Rotate room. The doors will change from up/down to left/right.'}</p></div></div><div class="practice-actions">${!ui.practiceComplete?button('↻ Rotate the room','practice-rotate','secondary'):''}${turn&&!ui.practiceComplete?button('Walk through the connected doors →','practice-walk','primary'):''}${ui.practiceComplete?button('Enter the guided story →','solo','primary huge'):''}${button('← Back to menu','home','light')}</div></section>`,'practice-wrapper');
}
function creator(){const a=ui.avatar;
 const swatch=(key,arr)=>`<div class="swatches">${arr.map((v,i)=>`<button type="button" data-action="avatar" data-key="${key}" data-value="${escape(v)}" aria-label="${key} option ${i+1}" title="${key} ${i+1}" class="swatch ${a[key]===v?'selected':''}" style="--swatch:${v}"></button>`).join('')}</div>`;
 const option=(key,v,label,preview='')=>`<button data-action="avatar" data-key="${key}" data-value="${escape(v)}" class="style-tile ${a[key]===v?'selected':''}">${preview||`<span class="option-icon">✦</span>`}<span>${escape(label)}</span></button>`;
 const hair=E.HAIRS.map(h=>option('hair',h,h,avatar({...a,hair:h}))).join('');
 const clothes=E.CLOTHES.map(h=>option('clothes',h,h,avatar({...a,clothes:h}))).join('');
 const extras=E.ACCESSORIES.map(h=>option('accessory',h,h,avatar({...a,accessory:h}))).join('');
 const tabs=[['hair','HAIR'],['face','FACE'],['outfit','OUTFIT'],['extras','EXTRAS']];
 const panel=ui.avatarTab==='hair'?`<div class="creator-section"><h3>Choose your hairstyle</h3><div class="styles-grid">${hair}</div><h3>Hair color</h3>${swatch('hairColor',E.HAIR_COLORS)}</div>`:
 ui.avatarTab==='face'?`<div class="creator-section"><h3>Skin tone</h3>${swatch('skin',E.SKINS)}<h3>Expression</h3><div class="styles-grid compact">${E.EXPRESSIONS.map(h=>option('expression',h,h,avatar({...a,expression:h}))).join('')}</div></div>`:
 ui.avatarTab==='outfit'?`<div class="creator-section"><h3>Explorer outfit</h3><div class="styles-grid compact">${clothes}</div><h3>Fabric color</h3>${swatch('outfit',E.OUTFITS)}</div>`:
 `<div class="creator-section"><h3>Accessories</h3><div class="styles-grid">${extras}</div><h3>Magic pin color</h3><div class="pill-options">${E.SPARKS.map(s=>option('spark',s,s)).join('')}</div></div>`;
 return layout(`<div class="creator-shell"><div class="creator-left"><p class="eyebrow">THE GUEST BOOK</p><h1>Make your<br><i>entrance.</i></h1><p>Your explorer should feel like you. Mix different faces, hairstyles, outfits, and odd little accessories.</p><div class="character-stage"><span class="stage-spark one">✦</span><span class="stage-spark two">✧</span><div class="stage-arch">${avatar(a)}</div><span class="stage-plaque">${escape(ui.name)}</span></div></div><div class="creator-right"><div class="creator-header"><div><span class="eyebrow">THE DRESSING ROOM</span><h2>Your explorer</h2></div>${button('↻ Surprise me','random-avatar','light small')}</div><label for="creator-name">Explorer name</label><input id="creator-name" data-model="name" maxlength="16" value="${escape(ui.name)}" placeholder="Your name" class="text-input"/><div class="creator-tabs">${tabs.map(([id,label])=>`<button data-action="avatar-tab" data-value="${id}" class="${ui.avatarTab===id?'active':''}">${label}</button>`).join('')}</div>${panel}<div class="creator-save">${button('Save explorer →','save-creator','primary wide')}${button('← Back','creator-back','text')}</div></div></div>`,'creator-page');}
function match(){return layout(`<section class="match-page"><header class="section-heading"><p class="eyebrow">THE GUEST BOOK</p><h1>Who's coming<br><i>inside?</i></h1><p>Make a room for your friends or join another group. Everyone gets their own explorer.</p></header><div class="identity-strip">${avatar(ui.avatar)}<div><label for="quick-name">YOUR NAME</label><input id="quick-name" data-model="name" value="${escape(ui.name)}" maxlength="16"></div>${button('Customize','creator','light')}</div>${ui.invited?`<div class="invitation-alert">✉ You have an invitation to room <b>${escape(ui.code)}</b>. Choose your name and press Join.</div>`:''}<div class="match-cards"><section class="sheet"><div class="card-top"><span class="card-number">01</span><h2>Create a room</h2></div><p>You'll be the host. Choose who can discover your room.</p><div class="privacy-choices"><button data-action="visibility" data-value="private" class="privacy ${ui.lobbyType==='private'?'on':''}"><span>♢</span><b>Private</b><small>Only people with your invitation can find it.</small></button><button data-action="visibility" data-value="public" class="privacy ${ui.lobbyType==='public'?'on':''}"><span>◎</span><b>Public</b><small>Listed for other explorers to join.</small></button></div>${button('Create '+ui.lobbyType+' room →','create','primary wide',ui.online?'':'disabled')}</section><section class="sheet"><div class="card-top"><span class="card-number">02</span><h2>Join an expedition</h2></div><p>Enter your friend's six-character invitation code.</p><div class="code-form"><input aria-label="Room code" data-model="code" maxlength="6" placeholder="ABC123" value="${escape(ui.code)}"/>${button('Join →','join','secondary',ui.online?'':'disabled')}</div><div class="public-box"><span class="mini-label">NO CODE?</span><h3>Find a public room</h3>${button('Browse open rooms →','browse','outline wide',ui.online?'':'disabled')}</div></section></div>${!ui.online?`<div class="info-banner">⚑ The room server is not running here. <b>Solo Story</b> still works without a server. To play online, use the ZIP's Node server or deploy it to Render.</div>`:''}${button('← Back to menu','home','text')}</section>`,'wide-page');}
function browse(){return layout(`<section class="browse-page"><p class="eyebrow">THE PUBLIC GUESTBOOK</p><h1>Open expeditions.</h1><p>Join a room that's waiting for explorers.</p><div class="sheet"><div class="list-heading"><h2>Available rooms</h2>${button('↻ Refresh','browse','light small')}</div>${ui.publicRooms.length?ui.publicRooms.map(r=>`<div class="public-row"><span class="public-symbol">⌂</span><div><b>${escape(r.host)}'s house</b><small>${escape(r.code)} • ${r.count} / 4 explorers</small></div>${button('Join →','join-public','secondary',`data-code="${escape(r.code)}"`)}</div>`).join(''):'<div class="empty-browse">No one is hosting a public game yet. Open the first room!</div>'}</div>${button('← Room options','match','text')}</section>`,'wide-page');}
function chatContent(){const g=ui.game;const msgs=(g.chat||[]).filter(m=>!ui.muted.has(m.playerId));
 return `<section class="chat-pane"><div class="chat-messages" aria-live="polite">${msgs.length?msgs.map(m=>`<div class="chat-msg"><div class="chat-avatar">${avatar(g.players.find(p=>p.id===m.playerId)?.avatar||E.avatarFallback)}</div><div class="bubble"><div class="bubble-head"><b>${escape(m.name)}</b><span>${m.playerId===ui.playerId?'YOU':''}</span></div><div class="bubble-text">${escape(m.text)}</div></div>${m.playerId!==ui.playerId?`<div class="message-tools"><button data-action="mute" data-id="${escape(m.playerId)}" title="Mute player">⊘</button><button data-action="report" data-id="${escape(m.id)}" title="Report message">⚑</button></div>`:''}</div>`).join(''):'<div class="no-messages">No notes yet. Say hello or ask for a clue.</div>'}</div><div class="quick-chats">${['Try turning the room','I found something!','Meet at the exit'].map(s=>`<button data-action="quick-chat" data-message="${escape(s)}">${escape(s)}</button>`).join('')}</div><form id="chat-form" class="chat-form"><input maxlength="180" id="chat-input" data-model="chat" value="${escape(ui.chatDraft)}" placeholder="Message your team…" ${ui.solo?'disabled':''} aria-label="Team chat message"><button type="submit" ${ui.solo?'disabled':''}>Send</button></form><small class="chat-disclaimer">Basic message censoring and spam limits are on. Mute and report are available. Not fully moderated.</small></section>`;
}
function lobby(){const g=ui.game,me=g.players.find(p=>p.id===ui.playerId),host=g.hostId===ui.playerId;return layout(`<section class="lobby-page"><div class="lobby-heading"><div><p class="eyebrow">THE GUEST BOOK · WAITING ROOM</p><h1>Gather your<br><i>explorers.</i></h1></div>${badge(g.visibility==='private'?'♢ PRIVATE ROOM':'◎ PUBLIC ROOM',g.visibility==='public'?'public-badge':'')}</div><div class="lobby-grid"><section class="sheet lobby-main"><p class="mini-label">ROOM CODE</p><div class="room-code">${escape(g.code)}</div><p>Send this code or the invitation link. Friends can join from their own browser or phone.</p><div class="invite-btns">${button('✉ Copy invite link','copy-link','primary')}${button('Copy code','copy-code','light')}</div><div class="invite-url">${escape(inviteURL())}</div>${host?`<div class="lobby-privacy"><span>Room visibility</span>${button('♢ Private','set-room-visibility',g.visibility==='private'?'selected-small':'light',`data-value="private"`)}${button('◎ Public','set-room-visibility',g.visibility==='public'?'selected-small':'light',`data-value="public"`)}</div>`:''}<div class="lobby-rule"><b>How to start</b><p>Wait for two explorers, everyone marks Ready, and the host opens the door. The first floor teaches the rules as you play.</p></div></section><div class="lobby-side"><section class="sheet"><div class="list-heading"><h2>Explorers <span>${g.players.length}/4</span></h2>${badge(ui.connection==='connected'?'● LIVE':'○ CONNECTING')}</div>${g.players.map(p=>`<div class="guest"><div class="guest-pic">${avatar(p.avatar)}</div><div class="guest-details"><b>${escape(p.name)}${p.id===g.hostId?' ♔':''}</b><span>${p.ready?'✓ Ready':'○ Not ready'} ${p.connected?'':' · Disconnected'}</span></div>${host&&p.id!==ui.playerId?button('×','kick','text',`data-id="${escape(p.id)}"`):''}</div>`).join('')}${Array.from({length:4-g.players.length},()=>'<div class="empty-guest">+ Waiting for an explorer</div>').join('')}${button(me.ready?'✓ You are ready':'Mark ready','ready',me.ready?'light wide':'secondary wide')}${host?button(g.players.length<2?'Need at least 2 explorers':g.players.every(p=>p.ready)?'Open the house →':'Waiting for everyone to be ready','start','primary wide',g.players.length<2||!g.players.every(p=>p.ready)?'disabled':''):''}</section><section class="sheet lobby-chat"><div class="list-heading"><h2>Guestbook chat</h2>${badge('FILTERED')}</div>${chatContent()}</section></div></div>${button('← Leave this room','leave-room','text')}</section>`,'lobby-page-outer');}
function current(){if(!ui.game)return null;return ui.game.players.find(p=>p.id===(ui.solo?ui.selectedPlayer:ui.playerId))||ui.game.players[0];}
function activeLog(g){return [...g.log].reverse().find(x=>['house','magic','discovery'].includes(x.kind))?.text||'The House has decided to be quiet for once.';}
function objectsForRoom(g,id){const l=E.level(g);if(E.HUNTS[l.id]?.room===id&&g.hunt?.status!=='complete'&&g.hunt?.status!=='active'&&!l.shards[id])return {kind:'word',label:'TORN PAGE'};if(l.lever===id&&!g.leverEnabled)return {kind:'lever',label:g.levelIndex===2?'KNOCK':'CRANK'};
 if(l.shards[id]&&!g.shards.includes(l.shards[id]))return {kind:'word',label:'WORD CARD'};
 if((l.riddle?.clues||l.sequence?.clues||{})[id]&&!g.cluesRead.includes(id))return {kind:'word',label:'READ CLUE'};
 if(l.dial?.room===id&&!g.dialSolved)return {kind:'word',label:'BRASS DIALS'};
 if(l.riddle?.room===id&&!g.riddleSolved)return {kind:'word',label:'PORTRAIT PUZZLE'};
 if(l.sequence?.rooms.includes(id)&&g.runeProgress<l.sequence.rooms.length)return {kind:'word',label:'RUNE '+(l.sequence.rooms.indexOf(id)+1)};
 if(id===l.exit&&!g.exitUnlocked)return {kind:'lock',label:'SEALED'};
 if(l.plates.includes(id))return {kind:'plate',label:id===l.plates[0]?'MOON SEAL':'SUN SEAL'};
 if(l.mirrors.includes(id))return {kind:'mirror',label:'MIRROR'};
 return null;}
function doorMarkers(g,id){const l=E.level(g),room=l.rooms[id],ds=E.doorsAt(g,id);
 const standard=ds.map(d=>{const target=Object.values(l.rooms).find(r=>r.row===room.row+(d==='S'?1:d==='N'?-1:0)&&r.col===room.col+(d==='E'?1:d==='W'?-1:0));const pass=target&&E.connection(g,id,target.id).ok;return `<span class="door ${d} ${pass?'open':''}" aria-hidden="true"></span>`;}).join('');
 const ghost=((g.activeRule==='borrowed'?(l.borrowed||[]):[]).concat(g.activeRule==='linked'&&l.paired?.includes(id)?[l.paired]:[])).filter(pair=>pair.includes(id)).map(pair=>{
  const other=l.rooms[pair.find(x=>x!==id)];if(!other)return '';
  const d=other.col>room.col?'E':other.col<room.col?'W':other.row>room.row?'S':'N';
  return ds.includes(d)?'':`<span class="door ${d} open magic-door" aria-hidden="true"></span>`;
 }).join('');
 return standard+ghost;}
function roomTile(g,id,me,objective,coach){
 const l=E.level(g),r=l.rooms[id],occ=g.players.filter(p=>p.room===id);
 const self=me.room===id,reachable=!self&&E.connection(g,me.room,id).ok,portal=!self&&g.activeRule==='mirrors'&&l.mirrors.includes(me.room)&&l.mirrors.includes(id);
 const object=objectsForRoom(g,id),highlight=coach?.info?.target===id||(!coach&&objective.target===id),turned=l.rotators.includes(id);
 const secret=E.SECRETS[l.id],hasSecret=secret?.room===id&&!g.foundSecrets?.some(s=>s.id===secret.id);
 return `<div class="room-shell ${highlight?'coach-target':''} ${turned?'room-turnable':''} ${g.activeRule&&E.ruleEffect(g,g.activeRule).rooms.includes(id)?'reality-affected':''}"><button class="room-tile ${self?'my-room':''} ${reachable||portal?'reachable':''} ${highlight?'recommended':''} ${id===l.exit&&!g.exitUnlocked?'locked':''}" data-action="room" data-room="${id}" aria-label="${escape(r.name)}. ${self?'Your room.':reachable||portal?'You can walk here.':'Passage blocked.'}"><span class="scene-illustration">${Art.room(id,l.id)}</span>${doorMarkers(g,id)}<span class="room-topline"><span class="room-index">${id}</span>${object?`<span class="object-tag ${object.kind}">${escape(object.label)}</span>`:''}</span><span class="room-characters">${occ.map(p=>`<span class="mini-person ${p.id===(ui.solo?ui.selectedPlayer:ui.playerId)?'self':''}" title="${escape(p.name)}">${avatar(p.avatar)}</span>`).join('')}</span><span class="room-footer"><b>${escape(r.name)}</b>${self?'<small>YOU ARE HERE</small>':reachable||portal?'<small>✓ WALK HERE</small>':''}</span>${highlight?'<span class="target-spark">✦</span>':''}${id===l.exit?`<span class="exit-sign ${g.exitUnlocked?'unsealed':'sealed'}">${g.exitUnlocked?'✓ EXIT OPEN':'🔒 ROOM C · EXIT SEALED'}</span>`:''}${l.plates.includes(id)?`<span class="plate-sign ${occ.length?'lit':''}">${occ.length?'● SEAL ACTIVE':'○ STAND HERE'}</span>`:''}${(g.activeRule==='mirrors'&&l.mirrors.includes(id))?'<span class="magic-sign">◇ MIRROR PORTAL</span>':''}${(g.activeRule==='borrowed'&&(l.borrowed||[]).some(pair=>pair.includes(id)))?'<span class="magic-sign">✦ NEW DOOR</span>':''}${(g.activeRule==='linked'&&l.paired?.includes(id))?'<span class="magic-sign">⚙ GEAR PASSAGE</span>':''}</button>${highlight?'<span class="next-room-ribbon">NEXT CLUE</span>':''}${turned?`<div class="rotate-here-label">↻ ROTATE THIS ROOM USING CONTROLS BELOW ↓</div>`:''}${l.lever===id&&!g.leverEnabled&&self?`<button class="tile-interact" data-action="lever">⚙ ${g.levelIndex===2?'KNOCK ON WALL':'PULL CRANK'}</button>`:''}${hasSecret&&self?'<span class="tile-secret">✧ A LITTLE SECRET…</span>':''}</div>`;
}
function wordbook(g){
 const l=E.level(g),rule=l.required,words=rule?E.RULES[rule]:null;
 const found=words?[words.subject,words.predicate].map(w=>g.shards.includes(w)):[];
 const cards=Object.values(E.RULES).filter(card=>g.unlockedRules.includes(card.id)).map(card=>{
  const effect=E.ruleEffect(g,card.id),active=g.activeRule===card.id;
  return `<button data-action="cast" data-id="${card.id}" class="rule-card ${active?'active':''}" ${active?'disabled':''}><span class="rule-icon">${card.symbol}</span><span><b>${escape(card.title)}</b><small>${escape(effect.ways.length?effect.ways.join(' · '):'No matching mechanism on this floor')}</small></span><span class="cast-status">${active?'IN FORCE':'CAST'}</span></button>`;
 }).join('');
 const effect=g.activeRule?E.ruleEffect(g,g.activeRule):null;
 return `<section class="wordbook"><div class="rulebook-intro"><p class="mini-label">THE BOOK OF IMPOSSIBILITIES</p><h3>Write it. Make it real.</h3><p>Collect a sentence, inscribe it, then cast it. The floor plan physically changes. <b>Only one law can exist at a time.</b></p></div>${words&&!g.completedCards.includes(rule)?`<div class="word-fragments"><span class="fragment ${found[0]?'found':''}">${found[0]?escape(words.subject):'UNKNOWN'}</span><span class="fragment ${found[1]?'found':''}">${found[1]?escape(words.predicate):'UNKNOWN'}</span></div>${button('Inscribe this law','inscribe','secondary wide',found.every(Boolean)?'':'disabled')}`:''}<div class="rule-cards">${cards||'<div class="empty-rules">Search the rooms for both halves of the first sentence.</div>'}</div><div class="rule-tip">${effect?`<b>THE WORLD IS DIFFERENT NOW</b><ul>${effect.changes.map(change=>`<li>${escape(change)}</li>`).join('')}</ul><small>Modified rooms: ${escape(effect.rooms.join(', ')||'none on this floor')}</small>`:'<b>NO RULE ACTIVE</b><p>Start with the word cards. When you cast MIRRORS ARE DOORS, an impossible distance becomes a passage.</p>'}</div></section>`;
}
// Basic navigation teaching remains visible even when step-by-step spoilers are off.
function roomCSteps(g,me){
 const l=E.level(g);if(l.id!=='floor1')return '';
 const mirrorOn=g.activeRule==='mirrors',hasMirror=g.shards.includes('MIRRORS');
 const other=g.players.find(p=>p.id!==me.id);
 const steps=[
  {done:g.leverEnabled,title:'Wake the mechanism',detail:'Control the explorer at Room F. Pull the brass crank to power the Turning Hall.',room:'F'},
  {done:hasMirror,title:'Enter the Turning Hall',detail:'Turn B until its doors face east and west. Click A, then B. Take the MIRRORS word fragment.',room:'B'},
  {done:mirrorOn,title:'Rewrite the house',detail:'In the rulebook, assemble MIRRORS + ARE DOORS. Inscribe the sentence, then cast the new rule. Watch Rooms D and F connect.',room:null},
  {done:g.echoSeal,title:'Light the two seals',detail:'Use the mirror portal to send the explorer from F to D. Move the other explorer to E by rotating B north and south. Stand on D and E at the same time.',room:'D'},
  {done:g.phase!=='playing',title:'Bring everyone to the exit',detail: g.exitUnlocked?exitRouteHelpText(g,me):'When both seals are lit, Room C unlocks. Move out of E through B, turn B east/west, and bring both explorers into C.',room:'C'}
 ];
 const next=steps.findIndex(x=>!x.done),focus=next<0?steps.length-1:next,task=steps[focus];
 return `<section class="room-c-guide" aria-label="Chapter 1 escape instructions"><div class="room-c-head"><div><span class="mini-label">CHAPTER 01 · THE FIRST ESCAPE</span><h2>Get both explorers into Room C.</h2></div><span class="room-c-status ${g.exitUnlocked?'open':''}">${g.exitUnlocked?'EXIT OPEN':'EXIT SEALED'}</span></div><div class="room-c-current"><span class="step-numeral">0${focus+1}</span><div><b>${escape(task.title)}</b><p>${escape(task.detail)}</p><span class="step-small">${escape(me.name)} is in Room ${escape(me.room)}. ${ui.solo?'Switch explorers by choosing a portrait above.':'Each player controls their own explorer.'}</span></div></div><div class="room-c-steps">${steps.map((step,i)=>`<div class="room-c-step ${step.done?'done':''} ${i===focus?'now':''}"><span>${step.done?'✓':'0'+(i+1)}</span><div><b>${escape(step.title)}</b></div></div>`).join('')}</div>${g.exitUnlocked?exitRouteHelp(g,me):''}</section>`;
}
function exitRouteHelpText(g,me){
 const side=E.doorsAt(g,'B').includes('E');
 const instructions={A:side?'Click green Room B, then Room C.':'Rotate B east/west, click B, then click C.',B:side?'Room C is green. Click it.':'Rotate B east/west, then click C.',C:'This explorer is safe. Switch to the other explorer.',D:'Go D → A. Then rotate B east/west to enter B → C.',E:side?'Turn B north/south, enter B, then rotate B east/west to enter C.':'Enter B, rotate B east/west, then enter C.',F:'Use the mirror to travel F → D, then walk D → A → B → C.'};
 return instructions[me.room]||'Follow the green passages to Room C.';
}
function exitRouteHelp(g,me){
 return `<div class="room-c-route"><b>ROOM C IS OPEN · YOUR ROUTE</b><p>${escape(exitRouteHelpText(g,me))}</p></div>`;
}
// The ROTATE control lives immediately below the floor plan, where people look
// after seeing Room B. It tells them what a turn accomplishes before they click.
function rotationDock(g,me){
 const l=E.level(g),rid=l.rotators[0];if(!rid)return '';
 const d=E.doorsAt(g,rid),horizontal=d.includes('E')||d.includes('W'),orientation=horizontal?'EAST / WEST':'NORTH / SOUTH';
 const extra=rid==='B'?'':'',link=g.activeRule==='linked'&&l.paired;
 const now=horizontal?`<b>Sideways ↔</b><small>Room A → Room B → Room C (once exit is unlocked)</small>`:`<b>Vertical ↕</b><small>Room B connects toward Room E. A and C are not connected to B.</small>`;
 const other=horizontal?'Rotate 90° to face North / South ↕':'Rotate 90° to face East / West ↔';
 const occupant=g.players.find(p=>p.room===l.lever);
 const switchButton=!g.leverEnabled&&ui.solo&&occupant?button(`Switch to ${escape(occupant.name)} in Room ${l.lever}`,'switch','light',`data-id="${escape(occupant.id)}"`):'';
 return `<section class="rotate-dock" aria-label="Rotate the map room"><div class="rotate-dock-top"><div><span class="rotate-index">ROOM ${rid} · ${escape(l.rooms[rid].name.toUpperCase())}</span><h2>Rotate this room to open a path</h2><p>The map stays in place. <b>Only Room ${rid} turns 90°.</b> That changes which doors connect to neighboring rooms.</p></div><div class="orientation-badge"><span>DOORS FACE</span><b>${orientation}</b></div></div><div class="rotate-control-row"><button class="rotate-primary" data-action="rotate-left" data-room="${rid}" ${g.leverEnabled?'':'disabled'} aria-label="Rotate room ${rid} left 90 degrees"><span class="rotate-symbol">↶</span><span>ROTATE LEFT <small>90°</small></span></button><div class="rotation-preview"><span class="rotation-now">CURRENT LAYOUT</span>${now}<span class="rotation-next">${other}</span></div><button class="rotate-primary" data-action="rotate-right" data-room="${rid}" ${g.leverEnabled?'':'disabled'} aria-label="Rotate room ${rid} right 90 degrees"><span class="rotate-symbol">↷</span><span>ROTATE RIGHT <small>90°</small></span></button></div>${!g.leverEnabled?`<div class="rotate-locked">🔒 First activate the crank in Room ${l.lever} to power rotation. ${switchButton}</div>`:''}${link?`<p class="rotate-linked">✦ ACTIVE RULE: Room ${l.paired.find(x=>x!==rid)} also rotates in the opposite direction.</p>`:''}</section>`;
}
// Makes the result of casting a rule discoverable without reading a guide.
function realityExplainer(g){
 const l=E.level(g),rule=g.activeRule,effect=rule?E.ruleEffect(g,rule):null;
 return `<section class="reality-explainer"><span class="reality-eyebrow">THE HOUSE OBEYS YOUR WORDS</span>${effect?`<div class="reality-row"><span class="reality-mark">LAW ${g.ruleChanges}</span><div><h3>${escape(E.RULES[rule].title)}</h3><p>These rooms have changed: <b>${escape(effect.rooms.join(', ')||'none')}</b>.</p><div class="reality-effects">${effect.changes.map(c=>`<span>✓ ${escape(c)}</span>`).join('')}</div><p class="effect-doors">NEW CONNECTIONS: ${escape(effect.ways.join(' · ')||'No new passage on this floor')}</p></div></div>`:`<div class="reality-row"><span class="reality-mark dimmed">NO LAW</span><div><h3>Reality is waiting to be rewritten.</h3><p>When a sentence becomes true, rooms change their behavior. The effect is more than a clue: it opens ways to physically escape.</p></div></div>`}<p class="reality-foot">Casting another House Rule replaces this one. You may need to rewrite reality more than once to escape.</p></section>`;
}
function realityBanner(g){
 const r=g.lastRewrite;if(!r||!r.rule)return '';
 return `<div class="rewrite-banner" role="status"><span class="rewrite-symbol">↯</span><div><small>REALITY REWRITTEN · LAW ${r.serial}</small><b>${escape(E.RULES[r.rule].title)}</b><span>${escape(r.ways.length?r.ways.join('  ·  '):r.changes.join(' · '))}</span></div></div>`;
}
function teamStrip(g){return `<div class="party-strip"><span class="mini-label">YOUR EXPLORERS</span><div class="party-members">${g.players.map(p=>`<button class="party-member ${p.id===(ui.solo?ui.selectedPlayer:ui.playerId)?'selected':''}" data-action="switch" data-id="${escape(p.id)}" title="${ui.solo?'Control':'View'} ${escape(p.name)}"><span class="party-avatar">${avatar(p.avatar)}</span><span><b>${escape(p.name)}</b><small>${escape(E.rooms(g)[p.room]?.name||'Waiting')}${p.connected?'':' · Offline'}</small></span>${p.id===(ui.solo?ui.selectedPlayer:ui.playerId)?'<span class="playing-marker">YOU</span>':''}</button>`).join('')}</div>${ui.solo?'<div class="solo-tip">SOLO MODE · Click a portrait to switch explorers</div>':''}</div>`;}
function actionButtons(g,me,o){
 const l=E.level(g),v=[];
 if(!g.leverEnabled&&me.room===l.lever)v.push(button(l.number===3?'✧ Knock on the wall':'⚙ Pull the brass crank','lever','gold-action'));
 if(l.mirrors.includes(me.room)&&g.activeRule==='mirrors'){v.push(button('◇ Step through mirror','portal','gold-action'));const distant=l.mirrors.find(x=>x!==me.room);if(!g.journal.some(x=>x.key===`${l.id}-reflection-${distant}`))v.push(button('◎ Examine the reflection','reflect','light'));}
 const clue=(l.riddle?.clues||l.sequence?.clues||{})[me.room];if(clue&&!g.cluesRead.includes(me.room))v.push(button('✉ Read the hidden clue note','clue-read','gold-action'));
 const bonus=E.HUNTS[l.id];if(bonus?.room===me.room&&g.hunt?.status!=='complete'&&g.hunt?.status!=='active')v.push(button('Read the torn puzzle page','hunt-open','gold-action'));
 const secret=E.SECRETS[l.id];if(secret?.room===me.room&&!g.foundSecrets?.some(s=>s.id===secret.id))v.push(button('✦ Discover a hidden keepsake','search','light'));
 const key=`${l.id}-${me.room}`;if(!g.journal.some(x=>x.key===key))v.push(button('◉ Inspect room','inspect','light'));
 return `<section class="actions-tray"><div><p class="mini-label">YOU ARE IN</p><h3>${escape(E.rooms(g)[me.room].name)}</h3></div><div class="actions-list">${v.join('')||'<span class="all-clear">No objects to use here. Click a green room to move.</span>'}</div></section>`;
}

// New thinking challenges appear next to the map, not hidden behind notebook tabs.
// The actual correct answers live in the authoritative engine, never in buttons.
function thinkingPanel(g,me){
 const l=E.level(g),challenge=l.riddle||l.sequence;if(!challenge)return '';
 const clues=challenge.clues||{},read=Object.keys(clues).filter(id=>g.cluesRead.includes(id));
 const notes=Object.entries(clues).map(([id,words])=>`<div class="thinking-note ${g.cluesRead.includes(id)?'revealed':''}"><span>✉ ${escape(l.rooms[id].name)}</span><p>${g.cluesRead.includes(id)?escape(words):'A note waits here. Send an explorer to read it.'}</p></div>`).join('');
 let task='';
 if(l.riddle){
  if(g.riddleSolved){task='<div class="thinking-solved">✓ Portrait verdict solved. Work together on the two seals.</div>';}
  else if(me.room===l.riddle.room){
   task=`<div class="thinking-question"><h3>Which symbol belongs in the middle?</h3><p>The order can be worked out from the two notes. Wrong answers are safe.</p><div class="answer-choices">${l.riddle.options.map(o=>button(escape(o.label),'riddle-answer','puzzle-choice',`data-answer="${o.id}" ${read.length<2?'disabled':''}`)).join('')}</div></div>`;
  }else task=`<p class="thinking-prompt">When the clues are ready, bring an explorer to <b>${escape(l.rooms[l.riddle.room].name)}</b> and answer the portraits.</p>`;
 }
 if(l.sequence){
  const progress=g.runeProgress||0,steps=l.sequence.rooms;
  const symbols=['B','D','E'].map(id=>{const lit=steps.slice(0,progress).includes(id);return `<div class="rune-chip ${lit?'done':''}"><small>${escape(l.rooms[id].name)}</small><b>${escape(l.sequence.symbols[id])}</b><span>${lit?'✓ activated':'awaiting touch'}</span></div>`;}).join('');
  task=`<div class="thinking-question"><h3>Touch the three runes in order</h3><p>Use both notes to deduce the sequence. If you touch the wrong one, the runes simply reset.</p><div class="rune-progress-text">${progress} of 3 runes activated. Determine the next symbol from the clues.</div><div class="rune-track">${symbols}</div>${steps.includes(me.room)&&progress<steps.length?button('✧ Touch '+escape(l.sequence.symbols[me.room]),'rune-touch','gold-action wide',read.length<2?'disabled':''):''}${progress===steps.length?'<div class="thinking-solved">✓ Runes complete. Hold both seals to open the staircase.</div>':''}</div>`;
 }
 return `<section class="thinking-panel" aria-label="Floor puzzle"><div class="thinking-heading"><span>🗝 THE HOUSE TESTS YOUR WITS</span><b>${escape(l.riddle?'The Portraits’ Question':'The Borrowed Hour')}</b></div><div class="thinking-notes">${notes}</div>${task}<div class="thinking-foot">${read.length}/2 notes found · ${g.puzzleMistakes||0} safe retries</div></section>`;
}
// Word hunts are optional bursts of cooperation, NOT the way to clear every
// floor. One shared grid and one shared found list are broadcast to the team.
function huntPanel(g){
 const b=E.HUNTS[g.levelId];if(!b)return '';
 const me=current(),h=g.hunt||{status:'idle'},location=E.level(g).rooms[b.room].name;
 if(!['active','complete'].includes(h.status)&&me.room!==b.room)return `<section id="word-hunt-panel" class="hunt-teaser"><span class="mini-label">OPTIONAL DISCOVERY · CHAPTER ${g.levelIndex+1}</span><h2>A torn page in the ${escape(location)}</h2><p>Something is hidden in Room ${b.room}. Reach the room and examine the page to uncover a timed team word puzzle. It is not required for the exit.</p><span>TEAM NOTE: Any player can start it there; everyone can contribute once it opens.</span></section>`;
 const remaining=Math.max(0,Math.ceil(((h.expiresAt||0)-Date.now())/1000));
 const active=h.status==='active'&&remaining>0,finished=h.status==='complete';
 const found=new Set((h.found||[]).map(f=>f.word));
 const foundCells=new Set((h.found||[]).flatMap(f=>f.indices||[]));
 const grid=[...b.grid].map((letter,index)=>`<button type="button" class="hunt-cell ${foundCells.has(index)?'found':''} ${ui.huntFrom===index?'picked':''}" data-action="hunt-cell" data-index="${index}" aria-label="Row ${1+Math.floor(index/b.size)}, column ${1+index%b.size}, ${letter}" ${active?'':'disabled'}>${letter}</button>`).join('');
 return `<section id="word-hunt-panel" class="puzzle-atelier hunt-panel" aria-label="Shared word hunt"><header class="atelier-header"><div><span class="atelier-kicker">THE HOUSE'S INTERLUDE · OPTIONAL</span><h2>${escape(b.title)}</h2><p>${escape(b.subtitle)}</p></div><span class="atelier-type">TEAM WORD HUNT</span></header><div class="atelier-body"><div class="hunt-explainer"><p><b>How it works:</b> Find five hidden words, then click their first and last letters. Words can run backwards or diagonally.</p><p><b>Play together:</b> Everyone sees this same puzzle live. Your teammate's discoveries light up instantly.</p><div class="hunt-word-list">${b.words.map(word=>`<span class="hunt-word ${found.has(word)?'solved':''}">${found.has(word)?'✓ ':''}${escape(word)}${found.has(word)?`<small>${escape(h.found.find(x=>x.word===word)?.by||'Team')}</small>`:''}</span>`).join('')}</div><div class="hunt-scoreline"><span>${found.size} / ${b.words.length} FOUND</span><span class="hunt-clock" data-expires="${h.expiresAt||0}">${active?`${remaining}s`:'75s'}</span></div>${finished?`<div class="hunt-reward"><b>✓ Chapter secret uncovered</b><p>${escape(b.reward)}</p></div>`:active?`<p class="hunt-tip">${ui.huntFrom===null?'Select the first letter of a word.':'Now select its last letter. Tap the same letter to cancel.'}</p>`:`<div class="hunt-start">${button((h.expiresAt&&remaining===0)?'Try the 75-second hunt again ↻':'Start the 75-second challenge →','hunt-start','primary wide')}<small>Optional challenge. Missing the timer never ends the story.</small></div>`}</div><div class="hunt-surface">${active?`<div class="hunt-live-dot">● LIVE SHARED GRID</div>`:`<div class="hunt-live-dot muted">${finished?'✓ ALL WORDS FOUND':'◷ WAITING FOR TEAM'}</div>`}<div class="hunt-grid" style="--hunt-size:${b.size}" role="group" aria-label="Letter search grid">${grid}</div><div class="hunt-grid-foot">${active?'Tap the first and last letters':'Finds synchronize for all players'} · ${h.attempts||0} attempt${h.attempts===1?'':'s'}</div></div></div></section>`;
}
function dialPanel(g,me){
 const d=E.level(g).dial;if(!d)return '';
 const available=me.room===d.room&&!g.dialSolved;
 const rings=(g.dialSettings||[0,0,0]).map((value,i)=>`<div class="dial-column"><span class="dial-index">0${i+1}</span><button class="dial-btn" data-action="dial-turn" data-index="${i}" data-delta="-1" ${available?'':'disabled'} aria-label="Previous symbol on dial ${i+1}">‹</button><div class="dial-face"><span>${escape(d.symbols[value])}</span><small>${escape(d.labels[value])}</small></div><button class="dial-btn" data-action="dial-turn" data-index="${i}" data-delta="1" ${available?'':'disabled'} aria-label="Next symbol on dial ${i+1}">›</button></div>`).join('');
 return `<section class="puzzle-atelier dial-panel" aria-label="Brass dial puzzle"><header class="atelier-header"><div><span class="atelier-kicker">CHAPTER PUZZLE · REQUIRED</span><h2>${escape(d.title)}</h2><p>Read the inscription. Align all three celestial windows.</p></div><span class="atelier-type">MECHANICAL DEDUCTION</span></header><div class="dial-puzzle"><div class="dial-riddles">${d.riddles.map((text,i)=>`<p><span>${i+1<10?'0':''}${i+1}</span>${escape(text)}</p>`).join('')}<small>${g.dialSolved?'The brass seal has lifted. You can now open the staircase.':available?'Tap ‹ or › to rotate one symbol at a time.':'Reach the Crossing Room to operate the brass instrument.'}</small></div><div class="dial-console">${rings}<div class="dial-result ${g.dialSolved?'solved':''}">${g.dialSolved?'✓ INSTRUMENT ALIGNED':'THREE WINDOWS · ONE COMBINATION'}</div></div></div></section>`;
}
function guideBox(g,me,coach){
 if(coach?.info&&coach.next){
  const step=coach.next,info=coach.info,actor=g.players.find(x=>x.id===step.playerId),needsPlayer=info.spatial&&me.id!==step.playerId;
  const nextLabel=needsPlayer?ui.solo?`Switch to ${escape(actor.name)} →`:`Ask ${escape(actor.name)} to act →`:info.label;
  return `<section class="guide-box v4-guided"><div class="guide-icon">✧</div><div class="guide-main"><span class="mini-label">GUIDED STORY · ONE MOVE AT A TIME</span><h2>${escape(needsPlayer?`First, switch to ${actor.name}`:info.title)}</h2><p>${escape(info.detail)}</p><div class="coach-context">${escape(actor.name)}'s move · ${coach.unsolved?'Alternative route may be needed':'Follow the gold NEXT MOVE marker on the map'}</div></div><div class="guide-buttons">${button(nextLabel,'coach-next','primary coach-cta')}${button('Guide: ON','guide-toggle','hint-btn')}${button('How?','help-during','hint-btn')}</div></section>`;
 }
 const o=E.objective(g,me);let action='';
 if(o.action==='LEVER'&&me.room===E.level(g).lever)action=button(o.label,'lever','primary');
 if(o.action==='INSCRIBE')action=button('Write your Word Card →','inscribe','primary');
 if(o.action==='RULE')action=button(o.label||'Cast rule','cast','primary',`data-id="${o.rule}"`);
 if(o.action==='ROTATE')action=button('Rotate the Heart ↻','rotate-right','primary');
 let switchHint='';if(ui.solo&&o.action==='LEVER'&&me.room!==E.level(g).lever){const p=g.players.find(x=>x.room===E.level(g).lever);if(p)switchHint=button(`Switch to ${escape(p.name)} →`,'switch','primary',`data-id="${escape(p.id)}"`);}
 return `<section class="guide-box v4-unguided"><div class="guide-icon">✦</div><div class="guide-main"><span class="mini-label">CURRENT OBJECTIVE</span><h2>${escape(o.title)}</h2><p>${escape(o.detail)}</p></div><div class="guide-buttons">${action||switchHint}${g.players.length===2?button('Guide me step by step','guide-toggle','primary'):button('Get a floor hint','hint','primary')}${button(g.insightTokens?'Use free insight':'Need a hint?','hint','hint-btn')}</div></section>`;
}
function stageStatus(g){return `<div class="stage-status"><div><span class="eyebrow">CHAPTER ${g.levelIndex+1} OF ${E.LEVELS.length}</span><h1>${escape(E.level(g).title)}</h1><p>${escape(E.level(g).epigraph)}</p></div><div class="stage-meta"><span>${ui.solo?'● SOLO STORY':ui.connection==='connected'?'● LIVE CO-OP':'○ RECONNECTING'}</span><span>↻ ${g.rotations} ROTATIONS</span><span>✧ ${g.ruleChanges} RULE CHANGES</span><span>✦ ${(g.foundSecrets||[]).length} SECRETS</span><span>✧ ${g.insightTokens||0} FREE INSIGHT${g.insightTokens===1?'':'S'}</span></div></div>`;}
function statusPills(g){return `<div class="stage-progress">${E.progress(g).map((x,i)=>`<span class="${x.done?'done':!E.progress(g).slice(0,i).some(z=>!z.done)?'current':''}">${x.done?'✓':i+1} ${escape(x.label)}</span>`).join('')}</div>`;}
function game(){
 const g=ui.game,me=current(),l=E.level(g),o=E.objective(g,me),coach=coachStep(g);
 const marker=coach?.info?.target;
 return layout(`<section class="game-page"><div class="game-header">${stageStatus(g)}<div class="game-top-buttons">${button(ui.soundOn?'♫ Sound on':'♪ Sound off','sound-toggle','light small')}${button('◉ Rules','help-during','light small')}${button('⌂ Leave','leave-room','light small')}</div></div><div class="mission-ribbon"><span>THIS CHAPTER</span><strong>${escape(l.intro)}</strong><em>Secrets discovered: ${(g.foundSecrets||[]).length}/${E.LEVELS.length}</em></div>${teamStrip(g)}${guideBox(g,me,coach)}${realityBanner(g)}${statusPills(g)}<div class="game-grid"><section class="board-frame"><div class="board-title"><span>STEP 1: CLICK GREEN ROOM TO WALK · STEP 2: ROTATE B USING BUTTONS BELOW ↓</span><span class="legend"><i></i> Green = walk here</span></div>${roomCSteps(g,me)}<div class="rooms-grid">${Object.keys(l.rooms).map(id=>roomTile(g,id,me,o,coach)).join('')}</div>${rotationDock(g,me)}${ui.blockedReason?`<div class="blocked-explainer"><span>🚪</span><div><b>Why can't I enter?</b><p>${escape(ui.blockedReason)}</p></div>${ui.guided?'':button('Guide me','guide-toggle','light small')}</div>`:''}<div class="board-footer"><span>✦ GOLD = YOUR EXPLORER. GREEN = OPEN PASSAGE.</span><span>${ui.solo?'CLICK ANOTHER PORTRAIT TO SWITCH':'TEAMMATES CAN ACT AT THE SAME TIME'}</span></div>${actionButtons(g,me,o)}${realityExplainer(g)}${thinkingPanel(g,me)}${dialPanel(g,me)}${huntPanel(g)}</section><aside class="side-column"><div class="sidebook"><div class="side-tabs"><button data-action="tab" data-value="rules" class="${ui.tab==='rules'?'active':''}">✎ WORD CARDS</button><button data-action="tab" data-value="chat" class="${ui.tab==='chat'?'active':''}">☏ CHAT</button><button data-action="tab" data-value="journal" class="${ui.tab==='journal'?'active':''}">◉ NOTEBOOK</button></div>${ui.tab==='rules'?wordbook(g):ui.tab==='chat'?ui.solo?'<div class="solo-chat-msg">In solo play, tap the two explorer portraits to solve the puzzle together. In a hosted game, each friend uses a separate device and chats here.</div>':chatContent():`<div class="journal"><h3>Explorer notebook</h3><p>Examine rooms and find optional keepsakes. You have ${(g.foundSecrets||[]).length} of ${E.LEVELS.length} hidden discoveries.</p>${g.journal.length?g.journal.map(n=>`<div class="journal-note"><b>${escape(n.title)}</b><p>${escape(n.description)}</p></div>`).join(''):'<div class="empty-rules">Nothing yet. Explore the house or click Inspect room.</div>'}</div>`}</div><div class="house-says"><span>THE HOUSE WHISPERS</span><p>“${escape(activeLog(g).replace(/^The House:?\s*[“”]?/, '').replace(/[“”]$/,''))}”</p></div><div class="play-tools">${button('⌖ Ping a room','ping','light')}${button('↻ Restart floor','reset','light')}</div><div class="board-mini-help">Confused? Use <b>Guide me</b> for a route suggestion. You still choose answers to the logic and mechanical puzzles.</div></aside></div></section>`,'game-page-shell');
}
function intermission(){const g=ui.game,l=E.level(g),res=g.results[g.results.length-1];return layout(`<section class="ending-card"><p class="eyebrow">CHAPTER ${g.levelIndex+1} COMPLETE</p><div class="finish-spark">✦</div><h1>You outsmarted<br><i>the house.</i></h1><div class="stars">${'★'.repeat(res.stars)}${'☆'.repeat(3-res.stars)}</div><p class="finish-sub">${escape(l.title)} · The staircase shifts again.</p><div class="scoreline"><span><b>${res.rotations}</b><small>ROTATIONS</small></span><span><b>${res.moves}</b><small>MOVES</small></span><span><b>${res.hints}</b><small>HINTS</small></span></div><p class="finish-quote">“I suppose you have become inconveniently good at this.”</p><p class="secret-result">✦ ${(g.foundSecrets||[]).length} / ${E.LEVELS.length} mysterious keepsakes discovered</p>${ui.solo||g.hostId===ui.playerId?button('Enter the next chapter →','next','primary huge'):badge('Waiting for host to open the next floor')}${button('↻ Replay this floor','reset','light')}</section>`,'ending-page');}
function victory(){const g=ui.game,total=g.results.reduce((n,x)=>n+x.stars,0);return layout(`<section class="ending-card victory"><p class="eyebrow">THE IMPOSSIBLE HOUSE · THE END</p><div class="finish-spark">✺</div><h1>You're free.<br><i>For now.</i></h1><p class="finish-sub">The door swings open. The House waves, very reluctantly.</p><div class="stars">${total} / ${E.LEVELS.length*3} STARS</div><div class="result-table">${g.results.map((x,i)=>`<div><span>${i+1}. ${escape(x.title)}</span><b>${'★'.repeat(x.stars)}${'☆'.repeat(3-x.stars)}</b></div>`).join('')}</div><p class="finish-quote">“You could visit again. Not that I care.”</p><p class="secret-result">✦ ${(g.foundSecrets||[]).length} / ${E.LEVELS.length} keepsakes found ${g.foundSecrets?.length===E.LEVELS.length?'· The house remembers you forever.':''}</p>${button('⌂ Back to menu','home','primary huge')}${button('↻ Replay the final floor','reset','light')}</section>`,'ending-page');}
function inviteURL(){const u=new URL(location.href);u.searchParams.set('room',ui.game?.code||'');u.hash='';return u.toString();}
function render(){const active=document.activeElement?.id==='chat-input';const caret=active?document.activeElement.selectionStart:null;
 let out;if(ui.game&&['intermission','complete'].includes(ui.game.phase)){out=ui.game.phase==='complete'?victory():intermission();}
 else if(ui.game&&ui.game.phase==='playing')out=game();
 else if(ui.game&&ui.game.phase==='lobby'&&ui.screen==='lobby')out=lobby();
 else if(ui.screen==='practice')out=practice();else if(ui.screen==='chapters')out=chapters();else if(ui.screen==='publish')out=publish();else if(ui.screen==='creator')out=creator();else if(ui.screen==='help')out=help();else if(ui.screen==='match')out=match();else if(ui.screen==='browse')out=browse();else out=home();
 mount.innerHTML=out; if(active){const n=document.getElementById('chat-input');if(n){n.focus();if(caret!==null)n.setSelectionRange(caret,caret);}}
}
function notify(message){ui.toast=message;render();setTimeout(()=>{if(ui.toast===message){ui.toast='';const t=mount.parentElement.querySelector('.toast');if(t)t.remove();}},3300);}
async function api(endpoint,payload){const signal=AbortSignal.timeout?AbortSignal.timeout(14000):undefined;const opt=payload?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal}:{signal};
 const response=await fetch('/api/'+endpoint,opt),result=await response.json();if(!response.ok||result.error)throw Error(result.error||'Could not reach the House server.');return result;}
function endStream(){if(ui.stream){ui.stream.close();ui.stream=null;}}
function listen(){endStream();if(!ui.token||!ui.game)return;
 const s=new EventSource(`/api/events?code=${encodeURIComponent(ui.game.code)}&token=${encodeURIComponent(ui.token)}`);ui.stream=s;
 s.addEventListener('state',event=>{if(s!==ui.stream)return;try{ui.game=JSON.parse(event.data);ui.screen=ui.game.phase==='lobby'?'lobby':'game';ui.connection='connected';render();}catch(err){console.warn('Bad server state',err);}});
 s.addEventListener('removed',()=>{endStream();ui.game=null;ui.token=null;ui.screen='home';notify('The host removed you from the waiting room.');});
 s.addEventListener('error',()=>{if(s!==ui.stream)return;ui.connection='reconnecting';const marker=document.querySelector('.stage-meta span');if(marker)marker.textContent='○ RECONNECTING';});
}
async function enterRoom(result){ui.game=result.state;ui.playerId=result.playerId;ui.selectedPlayer=ui.playerId;ui.token=result.token;ui.solo=false;ui.guided=true;ui.guideCache=null;ui.screen='lobby';ui.invited=false;ui.tab='rules';ui.connection='connected';saveProfile();saveSession();render();listen();}
async function requestAction(action){if(ui.working||!ui.game)return;ui.working=true;
 try{if(ui.solo){const actingId=['NEXT','RESET','START'].includes(action.type)?ui.game.hostId:ui.selectedPlayer;const result=E.act(ui.game,actingId,action);if(result.error)throw Error(result.error);saveSolo();}
 else {const result=await api('action',{code:ui.game.code,token:ui.token,action});ui.game=result.state;}
 ui.screen=ui.game.phase==='lobby'?'lobby':'game';ui.blockedReason='';ui.guideCache=null;playSound(action.type);render();}catch(e){notify(e.message);}finally{ui.working=false;}}
function startSolo(continuePrevious=false){endStream();ui.solo=true;ui.guided=true;ui.guideCache=null;ui.blockedReason='';ui.huntFrom=null;ui.screen='game';ui.tab='rules';ui.game=null;ui.playerId='solo-one';ui.selectedPlayer='solo-one';ui.token=null;
 if(continuePrevious){try{const old=JSON.parse(localStorage.getItem(soloKey)||'null');if(old?.game?.players?.length===2){ui.game=old.game;ui.selectedPlayer=old.selectedPlayer;}}catch{}}
 if(!ui.game){ui.game=E.newGame({solo:true});E.addPlayer(ui.game,{id:'solo-one',name:ui.name,avatar:ui.avatar});E.addPlayer(ui.game,{id:'solo-two',name:'Juniper',avatar:{skin:E.SKINS[4],hair:'coils',hairColor:E.HAIR_COLORS[0],outfit:E.OUTFITS[3],accessory:'round glasses',clothes:'waistcoat',expression:'curious',spark:'mint'}});
 E.act(ui.game,'solo-two',{type:'READY',ready:true});E.act(ui.game,'solo-one',{type:'START'});}
 saveProfile();saveSolo();render();}
async function create(){if(!ui.online)return notify('Online rooms need the game server or a public deployment.');if(ui.working)return;ui.working=true;
 try{const r=await api('create',{name:ui.name,avatar:ui.avatar,visibility:ui.lobbyType});await enterRoom(r);}catch(e){notify(e.message);}finally{ui.working=false;}}
async function join(code){if(!ui.online)return notify('Online rooms need a running game server.');if(!/^[A-F0-9]{6}$/i.test(code||''))return notify('Please enter a six-character room code.');if(ui.working)return;ui.working=true;
 try{const r=await api('join',{code:code.toUpperCase(),name:ui.name,avatar:ui.avatar});await enterRoom(r);}catch(e){notify(e.message);}finally{ui.working=false;}}
async function publicList(){try{ui.publicRooms=(await api('rooms/public')).rooms;ui.screen='browse';render();}catch(e){notify(e.message);}}
async function resumeOnline(){let saved;try{saved=JSON.parse(localStorage.getItem(sessionKey)||'null');}catch{}if(!saved||!ui.online)return notify('No live room to return to.');try{
 const res=await fetch('/api/state?code='+encodeURIComponent(saved.code),{headers:{Authorization:'Bearer '+saved.token}}),value=await res.json();if(!res.ok)throw Error(value.error||'Session unavailable.');ui.game=value.state;ui.token=saved.token;ui.playerId=value.playerId;ui.selectedPlayer=ui.playerId;ui.solo=false;ui.screen=ui.game.phase==='lobby'?'lobby':'game';listen();render();
 }catch(e){notify(e.message);}}
async function leave(){if(ui.game&&!ui.solo&&ui.token){try{await api('leave',{code:ui.game.code,token:ui.token});}catch{}}
 endStream();ui.game=null;ui.token=null;ui.solo=false;ui.screen='home';ui.selectedRoom=null;ui.guideCache=null;render();}
async function copyText(value,name){try{await navigator.clipboard.writeText(value);notify(name+' copied! Send it to your friends.');}catch{notify('Clipboard not available. Select and copy the code shown above.');}}
async function roomClick(id){const g=ui.game,me=current(),l=E.level(g);if(!g||g.phase!=='playing')return;ui.selectedRoom=id;
 if(id===l.exit&&!g.exitUnlocked){const objective=E.objective(g,me);ui.blockedReason=`Room ${id} is the EXIT, and it is still sealed. Your current task is: ${objective.title}. ${objective.detail} After completing the chapter objectives, rotate Room B toward Room C and walk through B to reach it.`;render();return;}
 if(me.room===id){ui.blockedReason='';render();return;}
 if(g.activeRule==='mirrors'&&l.mirrors.includes(me.room)&&l.mirrors.includes(id))return requestAction({type:'PORTAL'});
 const c=E.connection(g,me.room,id);if(c.ok)return requestAction({type:'MOVE',to:id});
 ui.blockedReason=c.why==='Those rooms are not neighbors. Move one room at a time.'?`Room ${id} is not beside your explorer in Room ${me.room}. Walk through the connected rooms one at a time. Green borders show allowed moves.`:`${c.why} The big rotate controls are directly beneath the room map. Match the doorways or cast a rule that changes the passage.`;render();
}
async function sendChat(text=ui.chatDraft){if(ui.solo)return;const value=String(text||'').trim();if(!value)return;ui.chatDraft='';await requestAction({type:'CHAT',text:value});}
async function clickAction(btn){const a=btn.dataset.action;if(!a)return;
 switch(a){
  case 'home':await leave();break;
  case 'solo':startSolo();break;
  case 'solo-guided':startSolo();ui.guided=true;render();break;
  case 'chapters':ui.screen='chapters';render();break;
  case 'pick-chapter':{const index=Number(btn.dataset.index);if(!Number.isInteger(index)||index<0||index>=E.LEVELS.length)break;startSolo();await requestAction({type:'CHAPTER',index});break;}
  case 'solo-challenge':startSolo();ui.guided=false;ui.guideCache=null;render();break;
  case 'publish':ui.screen='publish';render();break;
  case 'practice':ui.practiceTurn=0;ui.practiceComplete=false;ui.screen='practice';render();break;
  case 'practice-rotate':ui.practiceTurn++;ui.practiceComplete=false;playSound('ROTATE');render();break;
  case 'practice-walk':if(ui.practiceTurn%2===1){ui.practiceComplete=true;playSound('RULE');}render();break;
  case 'sound-toggle':ui.soundOn=!ui.soundOn;render();break;
  case 'guide-toggle':ui.guided=!ui.guided;ui.guideCache=null;ui.blockedReason='';render();break;
  case 'coach-next':{const step=coachStep(ui.game)?.next;if(!step)return notify('Try using a hint or resetting this floor.');
   if(step.action.type==='DIAL'){return notify('Read the three clues beside the brass instrument, then tap the brass arrows. Think of each symbol in turn.');}
   if(step.action.type==='RIDDLE'){ui.tab='journal';return notify('Read the two notes, then choose one of the three symbols in the Portrait Puzzle beneath the map.');}
   if(step.action.type==='RUNE'&&current().room===E.level(ui.game).sequence?.rooms[ui.game.runeProgress])return notify('The next rune is here. Use the glowing Touch Rune button under the map.');const info=Guide.describe(ui.game,step);const actor=ui.game.players.find(p=>p.id===step.playerId);if(info.spatial&&current().id!==step.playerId){if(ui.solo){ui.selectedPlayer=actor.id;saveSolo();render();}else await sendChat(`${actor.name}, please ${info.title.toLowerCase()}.`);break;}await requestAction(step.action);if(step.action.type==='INSCRIBE'||step.action.type==='RULE')ui.tab='rules';break;}
  case 'continue-solo':startSolo(true);break;
  case 'match':ui.screen='match';render();break;
  case 'help':ui.screen='help';ui.helpPage=0;render();break;
  case 'help-during':ui.showGuide=true;render();break;
  case 'close-help':ui.showGuide=false;render();break;
  case 'help-next':ui.helpPage=Math.min(2,ui.helpPage+1);render();break;
  case 'help-prev':ui.helpPage=Math.max(0,ui.helpPage-1);render();break;
  case 'creator':ui.returnTo=ui.screen;ui.screen='creator';render();break;
  case 'creator-back':ui.screen=ui.returnTo||'home';render();break;
  case 'save-creator':saveProfile();if(ui.game&&!ui.solo&&ui.game.phase==='lobby')await requestAction({type:'CUSTOMIZE',avatar:ui.avatar,name:ui.name});ui.screen=ui.returnTo||'home';render();break;
  case 'avatar-tab':ui.avatarTab=btn.dataset.value;render();break;
  case 'avatar':if(['skin','hair','hairColor','outfit','accessory','clothes','expression','spark'].includes(btn.dataset.key)){ui.avatar[btn.dataset.key]=btn.dataset.value;render();}break;
  case 'random-avatar':for(const [key,values] of Object.entries({skin:E.SKINS,hair:E.HAIRS,hairColor:E.HAIR_COLORS,outfit:E.OUTFITS,accessory:E.ACCESSORIES,clothes:E.CLOTHES,expression:E.EXPRESSIONS,spark:E.SPARKS}))ui.avatar[key]=values[Math.floor(Math.random()*values.length)];render();break;
  case 'visibility':ui.lobbyType=btn.dataset.value;render();break;
  case 'create':await create();break;
  case 'join':await join(ui.code);break;
  case 'join-public':await join(btn.dataset.code);break;
  case 'browse':await publicList();break;
  case 'resume-online':await resumeOnline();break;
  case 'copy-link':await copyText(inviteURL(),'Invite link');break;
  case 'copy-code':await copyText(ui.game.code,'Room code');break;
  case 'ready':await requestAction({type:'READY',ready:!ui.game.players.find(p=>p.id===ui.playerId).ready});break;
  case 'start':await requestAction({type:'START'});break;
  case 'set-room-visibility':await requestAction({type:'VISIBILITY',visibility:btn.dataset.value});break;
  case 'kick':if(confirm('Remove this explorer from the lobby?'))await requestAction({type:'REMOVE',playerId:btn.dataset.id});break;
  case 'switch':if(ui.solo){ui.selectedPlayer=btn.dataset.id;saveSolo();render();}else notify('In a live game, each friend controls their own explorer.');break;
  case 'room':await roomClick(btn.dataset.room);break;
  case 'lever':await requestAction({type:'LEVER'});break;
  case 'clue-read':ui.tab='journal';await requestAction({type:'CLUE'});break;
  case 'riddle-answer':await requestAction({type:'RIDDLE',answer:btn.dataset.answer});break;
  case 'rune-touch':await requestAction({type:'RUNE'});break;
  case 'dial-turn':await requestAction({type:'DIAL',index:Number(btn.dataset.index),delta:Number(btn.dataset.delta)});break;
  case 'hunt-open':document.getElementById('word-hunt-panel')?.scrollIntoView({behavior:'smooth',block:'start'});break;
  case 'hunt-start':ui.huntFrom=null;await requestAction({type:'HUNT_START'});document.getElementById('word-hunt-panel')?.scrollIntoView({behavior:'smooth',block:'start'});break;
  case 'hunt-cell':{const index=Number(btn.dataset.index),board=E.HUNTS[ui.game?.levelId],h=ui.game?.hunt;
   if(!board||!h||h.status!=='active'||Date.now()>=h.expiresAt)break;
   if(ui.huntFrom===null){ui.huntFrom=index;render();break;}
   if(ui.huntFrom===index){ui.huntFrom=null;render();break;}
   const from=ui.huntFrom;ui.huntFrom=null;await requestAction({type:'HUNT_FIND',from,to:index});break;}
  case 'rotate-left':await requestAction({type:'ROTATE',room:btn.dataset.room||'B',dir:-1});break;
  case 'rotate-right':await requestAction({type:'ROTATE',room:btn.dataset.room||'B',dir:1});break;
  case 'portal':await requestAction({type:'PORTAL'});break;
  case 'reflect':ui.tab='journal';await requestAction({type:'REFLECT'});break;
  case 'inscribe':ui.tab='rules';await requestAction({type:'INSCRIBE',rule:E.level(ui.game).required});break;
  case 'search':ui.tab='journal';await requestAction({type:'SEARCH'});break;
  case 'cast':ui.tab='rules';await requestAction({type:'RULE',rule:btn.dataset.id});break;
  case 'inspect':ui.tab='journal';await requestAction({type:'INSPECT',room:current().room});break;
  case 'hint':await requestAction({type:'HINT'});break;
  case 'ping':await requestAction({type:'PING',room:ui.selectedRoom||current().room});notify('Room marked for your teammates.');break;
  case 'tab':ui.tab=btn.dataset.value;render();break;
  case 'quick-chat':await sendChat(btn.dataset.message);break;
  case 'mute':ui.muted.add(btn.dataset.id);render();break;
  case 'report':await requestAction({type:'REPORT',messageId:btn.dataset.id});notify('Report recorded in this room session.');break;
  case 'reset':if(confirm('Restart this floor? Your current floor progress will reset.'))await requestAction({type:'RESET'});break;
  case 'next':await requestAction({type:'NEXT'});break;
  case 'leave-room':await leave();break;
 }
}
mount.addEventListener('click',e=>{const btn=e.target.closest('[data-action]');if(btn&&!btn.disabled)clickAction(btn);});
mount.addEventListener('input',e=>{const model=e.target.dataset.model;if(model==='name')ui.name=E.cleanName(e.target.value);if(model==='code')ui.code=e.target.value.toUpperCase().replace(/[^A-F0-9]/g,'').slice(0,6);if(model==='chat')ui.chatDraft=e.target.value;});
mount.addEventListener('submit',e=>{if(e.target.id==='chat-form'){e.preventDefault();sendChat();}});
mount.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('[data-model="code"]')){e.preventDefault();join(ui.code);}});
// Lightweight clock updates avoid repaints and keep the selected grid letter intact.
setInterval(()=>{const el=mount.querySelector('.hunt-clock[data-expires]');if(!el||!ui.game)return;
 const h=ui.game.hunt;if(h?.status!=='active')return;const remaining=Math.max(0,Math.ceil((h.expiresAt-Date.now())/1000));
 el.textContent=remaining+'s';if(!remaining&&ui.lastExpiredHuntStamp!==h.expiresAt){ui.lastExpiredHuntStamp=h.expiresAt;ui.huntFrom=null;render();}
},400);
document.addEventListener('keydown',e=>{if(e.target.closest('input,textarea,button')||!ui.game||ui.game.phase!=='playing')return;
 if(ui.solo&&['1','2','3','4'].includes(e.key)){const p=ui.game.players[Number(e.key)-1];if(p){ui.selectedPlayer=p.id;saveSolo();render();}return;}
 if(e.key.toLowerCase()==='r'){e.preventDefault();requestAction({type:'ROTATE',room:'B',dir:1});}
 if(e.key.toLowerCase()==='h'){e.preventDefault();requestAction({type:'HINT'});}
 const d={ArrowUp:'N',ArrowRight:'E',ArrowDown:'S',ArrowLeft:'W'}[e.key];if(d){e.preventDefault();const r=E.rooms(ui.game)[current().room],dst=Object.values(E.rooms(ui.game)).find(x=>x.row===r.row+(d==='S'?1:d==='N'?-1:0)&&x.col===r.col+(d==='E'?1:d==='W'?-1:0));if(dst)roomClick(dst.id);}
});
(async()=>{try{ui.online=!!(await api('health')).ok;ui.connection=ui.online?'connected':'offline';}catch{ui.online=false;ui.connection='offline';}ui.checking=false;
 if(ui.online&&!ui.invited){try{const s=JSON.parse(localStorage.getItem(sessionKey)||'null');if(s){const res=await fetch('/api/state?code='+encodeURIComponent(s.code),{headers:{Authorization:'Bearer '+s.token}});if(res.ok){ui.hasOnlineSession=true;}}}catch{}}
 render();})();
})();
