(()=>{'use strict';const $=id=>document.getElementById(id),socket=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws');let state={},id='',code='',joined=false,players=[],shown=0;
const order=['camera','lights','clue','terminal','caseOpen','diamond','escape'];
const objectives=['Redirect the corridor surveillance camera.','Cut gallery lights to disable the motion sensors.','Inspect the curator inscription for the four-digit code.','Use the security keypad to authorize the display.','Unlock the diamond display case.','Take the Aster Diamond.','Escape through the service door.'];
const labels={camera:'SURVEILLANCE CAMERA',lights:'GALLERY CIRCUIT',clue:'CURATOR INSCRIPTION',terminal:'SECURITY TERMINAL',caseOpen:'DIAMOND DISPLAY',diamond:'ASTER DIAMOND',escape:'SERVICE EXIT'};
const notes={camera:'The camera points toward the grand gallery. Redirecting it creates a blind spot. The motion sensors remain active until the lights are cut.',lights:'The motion sensors share a circuit with the gallery lights. Disable them only once the camera points away.',clue:'The curator hid a four-digit code in the gallery inscription. Every operative can view it in Field Notes after it is discovered.',terminal:'The keypad requires the four-digit combination from the curator inscription. A wrong code increases suspicion.',caseOpen:'The display lock is connected to the authorized keypad.',diamond:'The Aster Diamond is ready to steal.',escape:'Reach the service exit with the diamond before the crew is caught.'};
const say=t=>{const e=$('notice');e.textContent=t;e.style.display='block';clearTimeout(shown);shown=setTimeout(()=>e.style.display='none',4400)};
const msg=(who,body)=>{const p=document.createElement('p'),b=document.createElement('b');b.textContent=who+': ';p.append(b,document.createTextNode(body));$('messages').append(p);$('messages').scrollTop=$('messages').scrollHeight};
const render=()=>{let i=order.findIndex(k=>!state[k]);if(i<0)i=7;$('step').textContent=i===7?'OPERATION COMPLETE':'MISSION '+String(i+1).padStart(2,'0')+' / 07';$('objective').textContent=objectives[i]||'The heist is complete. Congratulations!';$('alarm').style.width=(state.alarm||0)+'%';$('alarmText').textContent='SUSPICION '+(state.alarm||0)+'%';document.body.classList.toggle('dark',!!state.lights);document.body.classList.toggle('redirect',!!state.camera);document.querySelectorAll('[data-action]').forEach(b=>{const a=b.dataset.action;b.disabled=!!state[a] || a!==order[i];b.title=labels[a]+(state[a]?' (complete)':'')});$('online').textContent=players.length+'/4 operatives';if(state.escape){modal('OPERATION COMPLETE','Beautifully stolen.','Your crew escaped with the Aster Diamond. Mission accomplished.',false)}};
function modal(label,title,body,pass){$('modalLabel').textContent=label;$('modalTitle').textContent=title;$('modalBody').textContent=body;$('pass').style.display=pass?'block':'none';$('modalGo').style.display=pass?'inline-block':'none';$('modal').classList.add('open');if(pass)$('pass').focus()}
function close(){$('modal').classList.remove('open')}
const action=(a,extra={})=>{if(socket.readyState!==1||!joined){say('Connect to a crew first');return}socket.send(JSON.stringify({type:'action',action:a,...extra}))};
socket.onopen=()=>say('Connected. Create a crew to begin the heist.');
socket.onclose=()=>say('Connection lost. Refresh to reconnect.');
socket.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}
if(m.type==='welcome'){id=m.id;code=m.code;joined=true;$('room').textContent=code;$('welcome').classList.remove('open');msg('SYSTEM','Welcome to the museum. Share crew code '+code+' with friends.');say('Crew '+code+' is ready. Begin by redirecting the camera.')}
if(m.type==='state'){state=m.state||{};players=m.players||[];render()}
if(m.type==='notice') {say(m.message);msg('MISSION',m.message)}
if(m.type==='chat')msg(m.name,m.message);
if(m.type==='note')modal('FIELD NOTES','Curator inscription',m.message,false);
if(m.type==='error')say(m.message)};
$('start').onclick=()=>{if(socket.readyState!==1)return say('Still connecting to server.');socket.send(JSON.stringify({type:'join',name:$('name').value,room:$('joinCode').value}))};
$('copy').onclick=()=>{if(code&&navigator.clipboard)navigator.clipboard.writeText(code).then(()=>say('Crew code copied: '+code)).catch(()=>say('Your crew code is '+code));else say('Crew code: '+code)};
$('chatForm').onsubmit=e=>{e.preventDefault();const input=$('chatInput'),s=input.value.trim();if(s&&joined){socket.send(JSON.stringify({type:'chat',message:s}));input.value=''}};
document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{let a=b.dataset.action;if(a==='terminal'){modal('SECURITY TERMINAL','Vault authorization',notes[a],true);return}if(a==='clue'){action(a);setTimeout(()=>socket.send(JSON.stringify({type:'hint'})),180);return}action(a)});
$('modalGo').onclick=()=>{action('terminal',{code:$('pass').value});$('pass').value='';close()};
$('modalClose').onclick=close;
$('notes').onclick=()=>{if(state.clue){socket.send(JSON.stringify({type:'hint'}))}else modal('FIELD NOTES','Curator archive','Find and inspect the curator inscription in the gallery to reveal the code.',false)};
$('showHelp').onclick=()=>modal('HEIST BRIEFING','The Midnight Gallery','This is a shared, cooperative heist. Redirect the camera first, then cut power, inspect the curator inscription and enter its four-digit code at the terminal. Unlock the case, take the diamond and escape. Use the crew chat to coordinate. Wrong combinations raise suspicion.',false);
document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
})();