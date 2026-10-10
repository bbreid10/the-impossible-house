/* Hand-authored SVG illustrations. Characters are procedural, not generated pictures. */
(function(root){
'use strict';
const X=(s)=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function avatar(a={},id='portrait'){
  const skin=a.skin||'#ddaa80',color=a.hairColor||'#2e2732',outfit=a.outfit||'#496d73';
  const ink='#292c30',sh=skin, light='#efe6da';
  let hair='';const hm=a.hair||'waves';
  switch(hm){
    case 'crop':hair=`<path d="M43 74Q37 30 72 32Q113 25 122 65L118 78Q105 61 96 52Q64 72 43 74Z" fill="${color}" stroke="${ink}" stroke-width="3"/><path d="M47 55Q63 41 82 42Q103 40 116 58" fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="4"/>`;break;
    case 'waves':hair=`<path d="M44 85Q31 47 54 33Q83 14 112 33Q131 52 119 86Q117 73 107 71Q104 51 87 57Q64 75 44 71Z" fill="${color}" stroke="${ink}" stroke-width="3"/><path d="M46 61Q39 45 58 37Q65 28 77 36Q91 24 102 39Q121 38 116 56" fill="none" stroke="#ffefdc" stroke-opacity=".24" stroke-width="5" stroke-linecap="round"/>`;break;
    case 'curls':hair=`<path d="M38 82Q26 55 44 35Q63 20 91 25Q120 24 128 49Q133 69 119 83L111 71Q103 66 95 57Q74 76 48 75Z" fill="${color}" stroke="${ink}" stroke-width="3"/>${[[44,58,15],[50,42,14],[65,31,17],[84,30,17],[103,35,16],[119,48,15],[116,68,13],[54,66,13]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="${ink}" stroke-width="2.5"/>`).join('')}`;break;
    case 'coils':hair=`<path d="M38 84Q15 33 63 22Q113 10 130 53L124 84Z" fill="${color}" stroke="${ink}" stroke-width="3"/>${[[40,54,13],[48,37,14],[65,28,14],[83,27,15],[103,30,15],[118,40,14],[124,57,12],[48,71,12],[115,71,13],[68,47,15],[91,47,15]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="${ink}" stroke-width="2.4"/><path d="M${x-r/2} ${y-2}q${r/2} -${r/1.8} ${r} 0" fill="none" stroke="#fff3db" stroke-opacity=".12" stroke-width="2"/>`).join('')}`;break;
    case 'bob':hair=`<path d="M45 40Q73 17 108 37Q126 47 123 118L111 126L105 75Q79 63 51 80L52 124L37 123Q34 58 45 40Z" fill="${color}" stroke="${ink}" stroke-width="3"/><path d="M47 44Q76 31 105 45" fill="none" stroke="#fff7df" stroke-opacity=".18" stroke-width="4"/>`;break;
    case 'pixie':hair=`<path d="M44 75Q32 46 54 31Q89 12 114 38Q130 54 118 77Q112 63 102 56Q78 75 45 72Z" fill="${color}" stroke="${ink}" stroke-width="3"/><path d="M44 59q18 -31 63 -19" fill="none" stroke="#fff5d7" stroke-opacity=".2" stroke-width="4"/>`;break;
    case 'locs':hair=`<path d="M42 76Q29 35 62 29Q107 17 120 64L119 88Z" fill="${color}" stroke="${ink}" stroke-width="3"/>${[42,46,113,120].map((x,i)=>`<path d="M${x} ${i%2?41:44}Q${x-8} 90 ${x+(i%2?7:-5)} ${i%2?136:125}" fill="none" stroke="${color}" stroke-width="${i%2?10:12}" stroke-linecap="round"/>`).join('')}`;break;
    case 'bun':hair=`<circle cx="81" cy="23" r="23" fill="${color}" stroke="${ink}" stroke-width="3"/><path d="M39 79Q34 33 72 35Q117 25 124 67L116 79Q99 58 84 53Q58 73 41 71Z" fill="${color}" stroke="${ink}" stroke-width="3"/>`;break;
    case 'afro':hair=`<path d="M38 81Q14 72 24 43Q20 19 46 12Q54 -10 82 6Q101 -5 118 13Q142 22 137 45Q146 72 122 86L108 70Q87 74 52 72Z" fill="${color}" stroke="${ink}" stroke-width="3"/>${[[37,42,15],[46,24,16],[66,13,18],[86,11,17],[107,19,17],[121,38,16],[122,62,17],[40,63,14]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="${ink}" stroke-width="1.7"/>`).join('')}`;break;
    case 'twists':hair=`<path d="M42 72Q30 37 56 27Q102 14 120 53L114 72Q96 66 82 51Q65 71 42 72Z" fill="${color}" stroke="${ink}" stroke-width="3"/>${[47,59,109,119].map((x,i)=>`<path d="M${x} ${i<2?57:51}q${i%2?-13:10} 36 ${i%2?-7:8} 73" stroke="${color}" fill="none" stroke-width="10" stroke-linecap="round"/><path d="M${x} 70l6 7m-6 6 6 6m-6 7 6 6m-6 7 6 6" stroke="#f2d9a4" stroke-opacity=".23" stroke-width="2"/>`).join('')}`;break;
    case 'ponytail':hair=`<path d="M44 82Q33 32 67 28Q112 19 122 66L113 75Q96 55 87 54Q66 76 46 72Z" fill="${color}" stroke="${ink}" stroke-width="3"/><path d="M119 51Q151 56 133 102Q143 125 127 153" fill="none" stroke="${color}" stroke-width="18" stroke-linecap="round"/><path d="M121 60q17 12 12 31" fill="none" stroke="#fff8d8" stroke-opacity=".2" stroke-width="3"/>`;break;
    case 'side-part':hair=`<path d="M40 75Q32 35 66 29Q108 17 123 60L117 75Q91 70 85 54Q62 75 42 73Z" fill="${color}" stroke="${ink}" stroke-width="3"/><path d="M84 41Q62 46 44 58M89 42q22 2 30 18" stroke="#e3cdb4" stroke-opacity=".34" stroke-width="2.5" fill="none"/>`;break;
    case 'braids':hair=`<path d="M41 73Q32 32 64 29Q105 14 121 58L115 76Q104 63 99 51Q71 70 42 73Z" fill="${color}" stroke="${ink}" stroke-width="3"/><path d="M113 62Q132 65 122 98L128 108L117 117L126 130L114 141L119 153" fill="none" stroke="${color}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><path d="M116 81l10 6m-10 10 10 7m-10 9 11 8m-12 9 12 8" stroke="#f8ead1" stroke-opacity=".55" stroke-width="3"/><path d="M46 66Q32 76 42 107L35 118L46 130L36 141" fill="none" stroke="${color}" stroke-width="12"/>`;break;
  }
  const item=a.accessory||'none';
  let acc='';
  if(item==='round glasses')acc=`<circle cx="64" cy="88" r="13" fill="none" stroke="#b9935a" stroke-width="3"/><circle cx="97" cy="88" r="13" fill="none" stroke="#b9935a" stroke-width="3"/><path d="M77 87q4 -5 8 0M50 83l-9 -3m70 3 10 -3" stroke="#b9935a" fill="none" stroke-width="3"/>`;
  if(item==='bow')acc=`<path d="M108 44q15 -11 18 4q-10 15 -20 4q-14 15 -18 1q2 -15 18 -7Z" fill="#d39a79" stroke="#704e4b" stroke-width="2"/><circle cx="107" cy="50" r="4" fill="#f9d7a5"/>`;
  if(item==='cap')acc=`<path d="M40 59Q39 14 83 17Q120 15 125 58Z" fill="#796b78" stroke="#403b46" stroke-width="3"/><path d="M37 60q41 13 91 0q-5 16 -41 13q-43 1 -50 -13Z" fill="#6b596a" stroke="#403b46" stroke-width="3"/>`;
  if(item==='scarf')acc=`<path d="M54 127Q81 140 107 126L115 140Q83 155 46 139Z" fill="#d3a16a" stroke="#715947" stroke-width="2"/><path d="M106 138L118 164L105 168L93 146" fill="#d3a16a" stroke="#715947" stroke-width="2"/>`;
  if(item==='star pin')acc=`<path d="m116 145 4 7 8 1-6 5 1 8-7-4-7 4 1-8-6-5 8-1Z" fill="#e5c179" stroke="#745139" stroke-width="2"/>`;
  if(item==='earrings')acc=`<circle cx="43" cy="103" r="4" fill="#dec08a" stroke="#65513e" stroke-width="1"/><circle cx="117" cy="103" r="4" fill="#dec08a" stroke="#65513e" stroke-width="1"/>`;
  if(item==='beret')acc=`<path d="M41 48Q28 20 70 13Q111 8 130 35L124 46Q79 37 41 48Z" fill="#645b67" stroke="${ink}" stroke-width="2"/><path d="M75 18v-9" stroke="#645b67" stroke-width="5" stroke-linecap="round"/>`;
  if(item==='brooch')acc=`<path d="m117 156 6 -5 6 5-6 7Z" fill="#d5b476" stroke="#665847" stroke-width="2"/><circle cx="123" cy="156" r="2" fill="#f8ebc5"/>`;
  if(item==='headband')acc=`<path d="M39 64Q50 21 86 24Q116 25 124 64" fill="none" stroke="#c98070" stroke-width="9" stroke-linecap="round"/>`;
  const dress=a.clothes||'coat';
  const garment=dress==='blazer'?`<path d="M22 180L31 146Q40 132 59 130H103Q125 134 131 152L138 180Z" fill="${outfit}" stroke="${ink}" stroke-width="3"/><path d="M70 132h22l9 48H61Z" fill="#e6ddcf"/><path d="M62 133L80 158L55 154L63 177L42 150M98 133L80 158L108 155L99 177L120 150" fill="none" stroke="#e5cbb3" stroke-width="3"/><path d="M81 161v18" stroke="#54524d" stroke-width="2"/>`:
    dress==='turtleneck'?`<path d="M21 180L32 146Q43 131 60 128H102Q123 134 130 149L140 180Z" fill="${outfit}" stroke="${ink}" stroke-width="3"/><rect x="63" y="117" width="36" height="32" rx="9" fill="${outfit}" stroke="${ink}" stroke-width="2"/><path d="M67 131h28M67 139h28" stroke="#f1e5d4" stroke-opacity=".45" stroke-width="2"/><path d="M80 150v30" stroke="#f7ecda" stroke-opacity=".28" stroke-width="2"/>`:
    dress==='sweater'?`<path d="M21 180L30 151Q38 131 58 130L103 130Q124 132 131 154L139 180Z" fill="${outfit}" stroke="${ink}" stroke-width="4"/><path d="M58 133q21 12 45 0M55 142h49M51 168h58" fill="none" stroke="#eeddb9" stroke-opacity=".5" stroke-width="4"/>`:
    dress==='dress'?`<path d="M53 125L106 126L117 145L139 180H20L43 145Z" fill="${outfit}" stroke="${ink}" stroke-width="4"/><path d="M40 161h82M56 135q23 14 48 0" fill="none" stroke="#e4bc86" stroke-width="3"/>`:
    dress==='waistcoat'?`<path d="M23 180L31 149Q43 129 61 130h39q20 2 30 22l7 28Z" fill="#f1e6d6" stroke="${ink}" stroke-width="4"/><path d="M62 129L80 150L99 129L107 180H53Z" fill="${outfit}" stroke="${ink}" stroke-width="3"/><path d="M80 151v29" stroke="#f0d7b0" stroke-width="3"/>`:
    `<path d="M23 180L29 151Q35 129 59 127L101 127Q124 130 132 153L138 180Z" fill="${outfit}" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/><path d="M60 126L80 144L101 126L100 182L61 182Z" fill="${light}" opacity=".85"/><path d="M60 126L82 142L71 155L51 135M101 126L82 142L93 155L113 135" fill="none" stroke="${ink}" stroke-opacity=".55" stroke-width="2"/>`;
  const expression=a.expression||'smile';
  const mouth=expression==='brave'?`<path d="M72 112Q81 109 90 112" stroke="#854a48" stroke-width="2.5" fill="none" stroke-linecap="round"/>`:
     expression==='curious'?`<ellipse cx="81" cy="112" rx="4" ry="5" fill="none" stroke="#854a48" stroke-width="2"/>`:`<path d="M71 111Q81 115 91 111" stroke="#854a48" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  const badgeColor=({gold:'#e3bc73',mint:'#a0c6b4',lilac:'#cbb3da'})[a.spark||'gold'];
  return `<svg viewBox="0 0 160 205" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Customized storybook explorer">
  <ellipse cx="80" cy="200" rx="55" ry="5" fill="#514035" opacity=".22"/>
  <path d="M55 169v27q9 8 21 0v-27M85 169v27q13 8 21 0v-27" fill="#4c4a55" stroke="${ink}" stroke-width="3"/>
  <path d="M51 194h28v7H47q-5 -1 4 -7Zm33 0h27q8 6 4 7H82Z" fill="#53413c" stroke="${ink}" stroke-width="2"/>
  ${garment}
  <path d="M67 112L66 139Q80 147 95 139L94 111" fill="${sh}" stroke="${ink}" stroke-width="3"/>
  <g transform="translate(16 14) scale(.80)">
  <ellipse cx="43" cy="87" rx="10" ry="15" fill="${sh}" stroke="${ink}" stroke-width="2.5"/>
  <ellipse cx="117" cy="87" rx="10" ry="15" fill="${sh}" stroke="${ink}" stroke-width="2.5"/>
  <path d="M43 70Q44 40 80 40Q116 40 117 70L115 103Q108 124 81 129Q54 124 46 105Z" fill="${sh}" stroke="${ink}" stroke-width="3"/>
  <ellipse cx="58" cy="103" rx="8" ry="4" fill="#bf7571" opacity=".08"/><ellipse cx="103" cy="103" rx="8" ry="4" fill="#bf7571" opacity=".08"/>
  <path d="M54 78Q65 74 72 79M91 79Q100 74 109 79" stroke="${ink}" stroke-opacity=".65" stroke-width="3" stroke-linecap="round" fill="none"/>
  <ellipse cx="64" cy="88" rx="2.6" ry="3" fill="${ink}"/><ellipse cx="98" cy="88" rx="2.6" ry="3" fill="${ink}"/><circle cx="65" cy="86" r="1.2" fill="#fff"/><circle cx="99" cy="86" r="1.2" fill="#fff"/>
  <path d="M81 88l-4 12q5 3 9 0" stroke="#875e50" stroke-width="1.7" fill="none" stroke-linecap="round"/>
  ${mouth}
  ${hair}${acc}
  </g>
  <circle cx="108" cy="158" r="7" fill="${badgeColor}" stroke="#725942" stroke-width="2"/><path d="m108 153 2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4Z" fill="#fff2c9"/>
  <path d="M81 144v37" stroke="${ink}" stroke-opacity=".4" stroke-width="1.5"/><circle cx="82" cy="153" r="2.5" fill="#9b8156"/><circle cx="82" cy="169" r="2.5" fill="#9b8156"/>
  <path d="M31 160l-6 22M128 160l5 22" stroke="#fff7de" stroke-opacity=".23" stroke-width="4"/>
  </svg>`;
}
function housePoster(){
// Original ink-and-wash editorial illustration. Intentionally flat and drawn:
// architectural linework, muted pigments and etched texture, not 3D gloss.
return `<svg viewBox="0 0 850 640" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustrated midnight mansion with lit windows and a great entrance">
<defs>
 <linearGradient id="midnight" x2=".84" y2="1"><stop stop-color="#131e28"/><stop offset=".58" stop-color="#26343c"/><stop offset="1" stop-color="#3e4846"/></linearGradient>
 <linearGradient id="facade" x2=".8" y2="1"><stop stop-color="#6d7271"/><stop offset="1" stop-color="#343c44"/></linearGradient>
 <linearGradient id="lantern" x2="0" y2="1"><stop stop-color="#f5dba8"/><stop offset="1" stop-color="#b98d69"/></linearGradient>
 <pattern id="engrave" width="13" height="13" patternUnits="userSpaceOnUse" patternTransform="rotate(29)"><path d="M0 0v13" stroke="#09131b" stroke-opacity=".21" stroke-width="1.3"/></pattern>
 <pattern id="brickgrid" width="50" height="24" patternUnits="userSpaceOnUse"><path d="M0 23h50M25 0v23" stroke="#0f1c23" stroke-opacity=".24" fill="none" stroke-width="1.4"/></pattern>
 <g id="arched-window"><path d="M0 69V18Q0 -2 19 -8Q39 -2 39 18V69Z" fill="url(#lantern)" stroke="#1d2530" stroke-width="5"/><path d="M19 -5V68M0 25H39" stroke="#473f3e" stroke-width="4"/><path d="M4 10q15 -20 30 0" fill="none" stroke="#f2dfb6" stroke-width="2"/></g>
 <g id="archlight"><path d="M0 44V16Q0 0 14 -6Q28 0 28 16V44Z" fill="url(#lantern)" stroke="#1e2730" stroke-width="4"/><path d="M14 -5V44M2 20H26" stroke="#534944" stroke-width="2.5"/></g>
</defs>
<rect width="850" height="640" fill="url(#midnight)"/>
<g fill="none" stroke="#d6c59f" opacity=".25"><path d="M56 43h118m-118 0v68m738 -48H674m120 0v68"/><path d="M42 412q120 -245 140 -255m615 315q-102 -282 -180 -309" stroke-dasharray="2 8"/></g>
<circle cx="675" cy="115" r="68" fill="#d7d0bb" opacity=".12"/><circle cx="675" cy="115" r="49" fill="#d7d0bb"/><circle cx="687" cy="103" r="44" fill="#b9bfb8" opacity=".15"/>
<g stroke="#c8bca9" stroke-width="1.4" opacity=".7"><path d="M123 111h8m-4 -4v8M327 77h6m-3 -3v6M584 64h8m-4 -4v8M748 252h6m-3 -3v6M87 252h6m-3 -3v6"/><circle cx="460" cy="73" r="2"/><circle cx="549" cy="145" r="1.7"/><circle cx="210" cy="72" r="1.9"/></g>
<g fill="#1c3034"><path d="M0 526Q83 480 164 520Q256 470 360 524Q477 484 580 514Q750 480 850 532V640H0Z"/><path d="M0 575Q95 527 202 572Q312 541 420 571Q548 520 850 575V640H0Z" fill="#14292e"/></g>
<!-- Stone wings, tower, and steep slate roofs -->
<g stroke="#1c2832" stroke-width="7" stroke-linejoin="round">
 <path d="M111 338L332 338V539H111Z" fill="#596366"/>
 <path d="M520 335H734V538H520Z" fill="#4f5c62"/>
 <path d="M259 210H597V539H259Z" fill="url(#facade)"/>
 <path d="M141 338L217 252L339 338Z" fill="#474350"/>
 <path d="M509 334L622 232L719 334Z" fill="#3b434f"/>
 <path d="M291 214L418 84L566 214Z" fill="#444552"/>
 <path d="M354 115L354 64L392 64L392 127" fill="#51545a"/>
 <path d="M541 181V91h41v145" fill="#535b5d"/>
 <path d="M279 539H580V258H279Z" fill="#626769"/>
</g>
<path d="M112 337H334V539H112Zm408 0H731V539H520ZM280 260h299v279H280Z" fill="url(#engrave)" opacity=".75"/>
<path d="M112 337H335V539H112ZM520 336H731V539H520ZM279 261H580V539H279Z" fill="url(#brickgrid)" opacity=".58"/>
<!-- Mouldings, carved lintels, visible brush-line imperfections -->
<g fill="none" stroke="#b2a58d" stroke-width="3" opacity=".75"><path d="M272 239H580M276 255H580M110 335H336M515 333H733M124 523H733"/><path d="M299 243l10 11m22 -11 10 11m22 -11 10 11m22 -11 10 11m22 -11 10 11m22 -11 10 11m22 -11 10 11" opacity=".55"/><path d="M428 99V55m-19 20h38"/></g>
<!-- Gothic windows -->
<use href="#arched-window" x="163" y="373"/><use href="#arched-window" x="248" y="373"/>
<use href="#arched-window" x="562" y="373"/><use href="#arched-window" x="651" y="373"/>
<use href="#arched-window" x="318" y="286"/><use href="#arched-window" x="487" y="286"/>
<use href="#archlight" x="326" y="428"/><use href="#archlight" x="501" y="428"/>
<g stroke="#272d35" stroke-width="4"><path d="M374 538V391Q377 345 425 332Q470 345 473 391V539Z" fill="#202630"/><path d="M382 538V394Q385 358 425 349Q462 359 466 396V539" fill="none" stroke="#c7a27b" stroke-width="3"/><path d="M425 351V537" stroke="#745d58" stroke-width="2"/><circle cx="450" cy="465" r="4.5" fill="#deb77c"/></g>
<!-- Clock set into a high gable -->
<circle cx="426" cy="222" r="26" fill="#e1cfad" stroke="#363b45" stroke-width="6"/><path d="M425 205v18l12 8" fill="none" stroke="#73685b" stroke-width="4" stroke-linecap="round"/>
<path d="M137 339Q239 320 331 337M521 333Q622 321 718 332" stroke="#b7a28b" stroke-width="3" fill="none"/>
<!-- Wrought-iron fence and long staircase -->
<path d="M345 539L285 634M500 539L580 634" stroke="#bc9a72" stroke-width="5"/>
<g stroke="#bc9a72" stroke-width="2" opacity=".9"><path d="M333 557H509M319 580H528M302 605H553M285 629H580"/><path d="M112 528V600m13 -72v71m13 -71v69m13 -69v67M700 527v70m13 -70v67m13 -67v67m13 -67v67"/></g>
<!-- Inked foliage and pale drifting shapes -->
<g stroke="#172e30" stroke-width="4" fill="#36524c"><path d="M78 569q-38 -42 -7 -76q22 12 22 36q7 -35 31 -38q16 46 -46 78Z"/><path d="M739 568q-33 -57 -1 -86q20 20 17 44q17 -30 34 -29q9 49 -50 71Z"/><path d="M170 550q-23 -44 7 -63q13 30 -7 63Z"/><path d="M670 548q-9 -39 20 -61q7 40 -20 61Z"/></g>
<g fill="none" stroke="#d7cab5" stroke-opacity=".22" stroke-width="2"><path d="M17 578q98 -21 203 0m435 -4q86 -17 193 8M54 606q137 -17 265 -1m293 -5q144 -16 212 -2"/></g>
<path d="M0 614Q266 599 381 624Q641 589 850 620V640H0Z" fill="#15262a"/>
<path d="M15 18H835V620H15Z" fill="none" stroke="#c8ab81" stroke-opacity=".24" stroke-width="2"/>
</svg>`;
}

function decor(id){
 const dark='#635347',gold='#a58157',paper='#ecddbf',green='#5f7f70';
 if(id==='A') return `<rect x="28" y="66" width="71" height="145" rx="5" fill="#6e594e" stroke="#483e39" stroke-width="6"/><g stroke="#b79a75" stroke-width="5"><path d="M30 109h67M30 155h67M30 199h67"/></g><g stroke="#3e413e" stroke-width="2">${Array.from({length:16},(_,i)=>`<rect x="${34+(i%4)*15}" y="${76+Math.floor(i/4)*37}" width="10" height="27" fill="${['#65857a','#aa725d','#ad9565','#62556c'][i%4]}"/>`).join('')}</g><rect x="122" y="89" width="164" height="102" rx="12" fill="#ad866a" stroke="#6e584d" stroke-width="8"/><rect x="131" y="99" width="144" height="82" rx="7" fill="#d5b38b"/><path d="M185 109h51m-51 11h51m-51 11h35" stroke="#947356" stroke-width="3"/><path d="M137 144h36l14 21h-50Z" fill="#eee0be" stroke="#92765c" stroke-width="3"/><circle cx="259" cy="153" r="10" fill="#dca267" stroke="#705c47" stroke-width="4"/>`;
 if(id==='B')return `<circle cx="160" cy="138" r="96" fill="#c8b595" stroke="#766553" stroke-width="12"/><circle cx="160" cy="138" r="78" fill="none" stroke="#bfa674" stroke-width="6" stroke-dasharray="8 6"/><circle cx="160" cy="138" r="50" fill="#e8d5af" stroke="#836d58" stroke-width="4"/><path d="M160 65v41M160 170v42M85 138h42M192 138h43" stroke="#9a7957" stroke-width="8" stroke-linecap="round"/><path d="M143 137l17 -26 17 26 -17 26Z" fill="#af8052" stroke="#5c4d48" stroke-width="4"/><circle cx="160" cy="138" r="9" fill="#fcdf9f" stroke="#594940" stroke-width="3"/><path d="M53 88l19 -14M242 75l18 13M60 193l16 12M246 201l15 -12" stroke="#756254" stroke-width="5" stroke-linecap="round"/>`;
 if(id==='C')return `<rect x="56" y="66" width="216" height="156" rx="8" fill="#ad9784" stroke="#5a5550" stroke-width="7"/><path d="M77 207h171v-22H93v-22h141v-22H110v-20h114v-20H130V80h85" fill="none" stroke="#e5cba2" stroke-width="14"/><path d="M76 212l167 -130" stroke="#7e6257" stroke-width="7"/><path d="M241 212l-167 -130" stroke="#7e6257" stroke-width="7"/><path d="M125 117q35 -24 70 0v25h-70Z" fill="#465f62" stroke="#3a4245" stroke-width="6"/><rect x="150" y="135" width="30" height="31" rx="5" fill="#c4a069" stroke="#59463b" stroke-width="5"/><path d="M155 134v-10q11 -16 21 0v10" fill="none" stroke="#8d6e4d" stroke-width="6"/>`;
 if(id==='D')return `<rect x="62" y="55" width="162" height="120" rx="65" fill="#b38c65" stroke="#6d574b" stroke-width="8"/><rect x="77" y="68" width="132" height="96" rx="48" fill="#8da4a0" stroke="#d2bf8b" stroke-width="7"/><path d="M89 139q40 -54 90 -50M114 155q35 -36 75 -38" fill="none" stroke="#d8eeee" stroke-opacity=".5" stroke-width="7"/><circle cx="242" cy="190" r="36" fill="#c4a47e" stroke="#66544c" stroke-width="5"/><path d="M247 170q-26 20 -8 40q-28 -5 -20 -26q5 -15 28 -14Z" fill="#f6e3b8"/><circle cx="78" cy="204" r="13" fill="#7c946f"/><circle cx="97" cy="214" r="10" fill="#69856d"/>`;
 if(id==='E')return `<circle cx="161" cy="137" r="84" fill="#d9c398" stroke="#8b725b" stroke-width="7"/><circle cx="161" cy="137" r="49" fill="#e9d4a3" stroke="#ac8156" stroke-width="6"/>${Array.from({length:10},(_,i)=>{const a=i*Math.PI/5;return `<path d="M${(161+61*Math.cos(a)).toFixed(0)} ${(137+61*Math.sin(a)).toFixed(0)}l${(16*Math.cos(a)).toFixed(0)} ${(16*Math.sin(a)).toFixed(0)}" stroke="#b58652" stroke-width="9" stroke-linecap="round"/>`;}).join('')}<circle cx="161" cy="137" r="25" fill="#f7e3a3"/><path d="M43 190q-25 -43 -3 -78q31 18 27 62M62 185q6 -44 32 -53q18 44 -17 63" fill="#68846c" stroke="#405a52" stroke-width="3"/><path d="M245 194q-11 -40 13 -62q23 29 9 62" fill="#7c9069" stroke="#516b55" stroke-width="4"/>`;
 if(id==='F')return `<rect x="40" y="57" width="144" height="152" rx="64" fill="#ab8762" stroke="#584843" stroke-width="8"/><rect x="52" y="70" width="120" height="127" rx="55" fill="#8fa9a7" stroke="#ded1a0" stroke-width="6"/><path d="M74 167q18 -44 66 -63M100 179q18 -20 51 -30" stroke="#efffff" stroke-opacity=".44" stroke-width="7" fill="none"/><circle cx="251" cy="132" r="35" fill="#bca07c" stroke="#74604e" stroke-width="7"/><circle cx="251" cy="132" r="16" fill="#725d51" stroke="#e9d2a2" stroke-width="5"/><path d="M252 132l18 -30 26 9" fill="none" stroke="#ad8b63" stroke-width="11" stroke-linecap="round"/><circle cx="295" cy="111" r="11" fill="#e0b67d" stroke="#795b47" stroke-width="4"/><path d="M208 208l14 -22m-7 2 28 17" stroke="#687d62" stroke-width="6"/>`;
 return '';
}
/* Chapter-specific architectural ink illustrations. Every room is a distinct
 * hand-authored composition, avoiding generative plastic/gloss textures.
 * SVG remains readable at mobile sizes and needs no external game asset API.
 */
const ROOM_TYPES={
 floor1:{A:'library',B:'mechanism',C:'exit',D:'mirror',E:'sun',F:'crank'},
 floor2:{A:'library',B:'mechanism',C:'exit',D:'portrait',E:'mechanism',F:'clock'},
 floor3:{A:'library',B:'orrery',C:'exit',D:'garden',E:'wall',F:'wall'},
 floor4:{A:'portrait',B:'portrait',C:'exit',D:'mirror',E:'sun',F:'mirror'},
 floor5:{A:'library',B:'clock',C:'exit',D:'moon',E:'mechanism',F:'clock'},
 finale:{A:'portrait',B:'heart',C:'exit',D:'mirror',E:'clock',F:'mirror'}
};
const THEMES={
 floor1:['#151e20','#3c4441','#b39265','#7b8d87'],
 floor2:['#151d22','#38454b','#b89a6a','#71928d'],
 floor3:['#1e2121','#4e4c46','#bca17d','#869388'],
 floor4:['#251d21','#49383c','#be987b','#a58486'],
 floor5:['#172028','#394856','#aeb2a8','#728993'],
 finale:['#1d1919','#473933','#c6a079','#8a8b79']
};
function roomObject(type,gold,glass){
 const line=`stroke="#1a1b1b" stroke-width="3" stroke-linejoin="round"`;
 if(type==='library')return `<g ${line}><rect x="83" y="30" width="154" height="154" fill="#473930"/><rect x="93" y="39" width="134" height="133" fill="#201f1d"/><path d="M95 79h132M95 122h132M95 165h132" stroke="${gold}" stroke-width="3"/>${Array.from({length:15},(_,i)=>`<rect x="${102+i%5*25}" y="${46+Math.floor(i/5)*42}" width="${i%4===0?13:17}" height="${i%3===0?27:30}" fill="${['#675948','#7a5d51','#66736b','#81775d','#565e61'][i%5]}" stroke="#232322" stroke-width="1.3"/>`).join('')}</g><path d="M65 182h190l-18 16H86Z" fill="${gold}" opacity=".8"/><path d="M152 181q13 -18 33 0" fill="none" stroke="#ead6ac" stroke-width="3"/>`;
 if(type==='mechanism')return `<g fill="none" stroke="${gold}" stroke-width="6"><circle cx="160" cy="106" r="79"/><circle cx="160" cy="106" r="60" stroke-width="3"/><circle cx="160" cy="106" r="38" stroke-width="2.5"/>${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return `<path d="M${160+65*Math.cos(a)} ${106+65*Math.sin(a)}L${160+75*Math.cos(a)} ${106+75*Math.sin(a)}" stroke-width="3"/>`;}).join('')}<path d="M160 40v40m-42 26h85m-43 0v48" stroke-width="5"/></g><circle cx="160" cy="106" r="12" fill="${gold}" stroke="#221f1c" stroke-width="5"/><circle cx="160" cy="106" r="4" fill="#251f1b"/><path d="M67 170h186M82 185h156" stroke="${gold}" stroke-width="4" opacity=".6"/>`;
 if(type==='exit')return `<path d="M87 199V91Q90 35 160 31Q230 35 233 91V199Z" fill="#222222" stroke="${gold}" stroke-width="10"/><path d="M103 196V94Q102 49 160 45Q218 49 216 94V196Z" fill="#34302a" stroke="#71634e" stroke-width="3"/><path d="M160 48v150" stroke="${gold}" stroke-width="3"/><path d="M102 109h114M103 171h114" stroke="${gold}" stroke-opacity=".3" stroke-width="3"/><rect x="130" y="122" width="60" height="47" fill="#212225" stroke="${gold}" stroke-width="4"/><path d="M142 121v-14q18 -29 36 0v14" fill="none" stroke="${gold}" stroke-width="7"/><circle cx="160" cy="142" r="7" fill="${gold}"/><path d="M160 148v12" stroke="${gold}" stroke-width="4"/>`;
 if(type==='mirror')return `<ellipse cx="160" cy="105" rx="72" ry="91" fill="#201f23" stroke="${gold}" stroke-width="12"/><ellipse cx="160" cy="105" rx="61" ry="79" fill="${glass}" stroke="#20262b" stroke-width="5"/><path d="M112 143Q119 81 198 53M139 174Q162 116 200 102" stroke="#e2e8dd" stroke-opacity=".35" stroke-width="9" fill="none"/><path d="M160 8v16M160 190v16M78 105h13M230 105h12" stroke="${gold}" stroke-width="7"/><path d="M119 203h82l14 13H105Z" fill="${gold}"/>`;
 if(type==='sun'||type==='moon')return `<g><circle cx="160" cy="109" r="71" fill="#302e2b" stroke="${gold}" stroke-width="8"/>${type==='sun'?`${Array.from({length:12},(_,i)=>{let a=i*Math.PI/6;return `<path d="M${160+47*Math.cos(a)} ${109+47*Math.sin(a)}L${160+65*Math.cos(a)} ${109+65*Math.sin(a)}" stroke="${gold}" stroke-width="7"/>`;}).join('')}<circle cx="160" cy="109" r="39" fill="${gold}"/>`:`<circle cx="160" cy="109" r="42" fill="${gold}"/><path d="M178 75q-47 31 -11 76q-49 -1 -49 -47q0 -35 60 -29Z" fill="#272d32"/>`}<path d="M103 193h114" stroke="${gold}" stroke-width="5"/><path d="M126 200h68l-12 12h-43Z" fill="${gold}"/></g>`;
 if(type==='crank')return `<path d="M74 186h172" stroke="${gold}" stroke-width="9"/><rect x="98" y="72" width="124" height="116" rx="9" fill="#4d453b" stroke="${gold}" stroke-width="6"/><circle cx="160" cy="121" r="42" fill="#302924" stroke="${gold}" stroke-width="9"/><circle cx="160" cy="121" r="12" fill="${gold}"/>${[0,90,180,270].map(deg=>`<path transform="rotate(${deg} 160 121)" d="M160 79V107" stroke="${gold}" stroke-width="7"/>`).join('')}<path d="M174 121h38l30 -31" fill="none" stroke="${gold}" stroke-width="10"/><circle cx="245" cy="89" r="10" fill="#d8c29c" stroke="#493c32" stroke-width="3"/>`;
 if(type==='portrait')return `<rect x="90" y="22" width="142" height="175" fill="#211e21" stroke="${gold}" stroke-width="11"/><rect x="101" y="33" width="120" height="153" fill="#49423e" stroke="#b7a285" stroke-width="2"/><path d="M136 145q-32 8 -37 42h126q-7 -35 -39 -42l-4 -19h-40Z" fill="#252827"/><ellipse cx="160" cy="96" rx="31" ry="44" fill="#a48a74"/><path d="M129 106Q116 55 159 46Q201 55 189 109L179 81Q146 69 132 88Z" fill="#272624"/><path d="M148 105h7m13 0h7m-22 20h18" stroke="#382e2b" stroke-width="2"/><path d="M79 208h170" stroke="${gold}" stroke-width="3"/>`;
 if(type==='clock')return `<circle cx="160" cy="101" r="73" fill="#31302d" stroke="${gold}" stroke-width="10"/><circle cx="160" cy="101" r="55" fill="#b1a58e" stroke="#6a5845" stroke-width="5"/>${Array.from({length:12},(_,i)=>{let a=i*Math.PI/6;return `<path d="M${160+45*Math.sin(a)} ${101-45*Math.cos(a)}L${160+52*Math.sin(a)} ${101-52*Math.cos(a)}" stroke="#312a25" stroke-width="3"/>`;}).join('')}<path d="M160 100v-35m0 35 28 17" stroke="#302a23" stroke-width="6" fill="none"/><circle cx="160" cy="101" r="6" fill="${gold}"/><path d="M159 179v36" stroke="${gold}" stroke-width="4"/><circle cx="159" cy="202" r="13" fill="${gold}" stroke="#392c27" stroke-width="5"/>`;
 if(type==='garden')return `<path d="M83 192V92Q93 37 160 32Q227 37 238 92V192Z" fill="#29403c" stroke="${gold}" stroke-width="6"/><path d="M160 31v165M83 116h155M93 73h138" stroke="#9ea69a" stroke-opacity=".5" stroke-width="4"/><path d="M125 201Q103 165 133 110M187 201q26 -34 -6 -112" stroke="#849684" stroke-width="7" fill="none"/><path d="M134 147Q94 115 104 96Q150 100 134 147ZM179 134Q205 97 229 105Q208 145 179 134ZM120 182Q82 161 91 146q36 0 29 36Z" fill="#6c8873" stroke="#273e38" stroke-width="3"/><rect x="90" y="194" width="144" height="14" fill="${gold}"/>`;
 if(type==='wall')return `<path d="M77 42H243V205H77Z" fill="#69645a" stroke="${gold}" stroke-width="7"/><path d="M77 80h166M77 118h166M77 156h166M77 195h166M118 42v38M195 42v38M157 80v38M112 118v38M193 118v38M155 156v39" fill="none" stroke="#272729" stroke-width="5"/><path d="M126 205V121Q131 100 160 98Q193 100 195 121V205" fill="none" stroke="#d5ae7f" stroke-width="3" stroke-dasharray="5 6"/><path d="M155 154h14" stroke="#d9b78d" stroke-width="2"/>`;
 if(type==='orrery')return `<g stroke="${gold}" fill="none"><ellipse cx="160" cy="113" rx="93" ry="47" stroke-width="4" transform="rotate(-28 160 113)"/><ellipse cx="160" cy="113" rx="76" ry="73" stroke-width="5" transform="rotate(32 160 113)"/><circle cx="160" cy="111" r="54" stroke-width="4"/><path d="M160 30V196M80 111h160" stroke-width="2"/></g><circle cx="160" cy="111" r="17" fill="${gold}"/><circle cx="97" cy="143" r="13" fill="${glass}" stroke="${gold}" stroke-width="4"/><circle cx="212" cy="68" r="10" fill="#a78b70" stroke="${gold}" stroke-width="3"/><path d="M99 200h125" stroke="${gold}" stroke-width="6"/>`;
 if(type==='heart')return `<path d="M160 185Q113 143 94 108Q67 60 114 48Q143 43 160 67Q184 36 222 57Q271 90 219 139Z" fill="#7a5146" stroke="${gold}" stroke-width="9"/><path d="M115 108h24l13 -27 13 52 14 -25h28" fill="none" stroke="#e3b48a" stroke-width="6" stroke-linecap="round"/><path d="M160 190v25" stroke="${gold}" stroke-width="7"/>`;
 return '';
}
function room(id,chapter='floor1'){
 // V10: perspective architectural cutaway. All shapes are deliberately authored
 // from a small geometric vocabulary rather than AI-rendered room pictures.
 const palette=THEMES[chapter]||THEMES.floor1;
 const [night,stone,gold,glass]=palette;
 const kind=(ROOM_TYPES[chapter]||ROOM_TYPES.floor1)[id]||'wall';
 const uid=`v10-${chapter}-${id}`;
 const boards=Array.from({length:10},(_,i)=>{
  const x=16+i*34;
  return `<path d="M180 158L${x} 224" stroke="#c7a575" stroke-opacity=".14" stroke-width="1.3"/>`;
 }).join('');
 const brick=Array.from({length:5},(_,row)=>Array.from({length:5},(_,col)=>
  `<path d="M${70+col*47+(row%2?24:0)} ${24+row*25}v${11}" stroke="#d4bd94" stroke-opacity=".075" stroke-width="2"/>`
 ).join('')).join('');
 return `<svg class="room-art v10-room-art" viewBox="0 10 360 184" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
 <defs>
  <linearGradient id="back-${uid}" x1="0" y1="0" x2=".76" y2="1"><stop stop-color="${stone}"/><stop offset=".65" stop-color="${night}"/><stop offset="1" stop-color="#0c1516"/></linearGradient>
  <linearGradient id="left-${uid}" x2="1" y2=".8"><stop stop-color="#0b1416"/><stop offset="1" stop-color="${stone}"/></linearGradient>
  <linearGradient id="floor-${uid}" x2=".2" y2="1"><stop stop-color="#554737"/><stop offset="1" stop-color="#191b1b"/></linearGradient>
  <radialGradient id="lamp-${uid}"><stop stop-color="#efc58c" stop-opacity=".33"/><stop offset="1" stop-color="#efc58c" stop-opacity="0"/></radialGradient>
  <pattern id="grain-${uid}" width="19" height="19" patternUnits="userSpaceOnUse"><path d="M2 6h2M11 16h1" stroke="#dcc098" stroke-opacity=".09" stroke-width=".8"/></pattern>
 </defs>
 <rect width="360" height="220" fill="#0c1314"/>
 <!-- Top and side walls frame the room like a physical model. -->
 <path d="M0 18L51 5H309L360 18L310 33H51Z" fill="#3c3025" stroke="${gold}" stroke-width="1.4" stroke-opacity=".54"/>
 <path d="M51 7H309V158H51Z" fill="url(#back-${uid})"/>
 <path d="M0 18L51 7V158L0 189Z" fill="url(#left-${uid})" stroke="#6e5840" stroke-width="2"/>
 <path d="M309 7L360 18V189L309 158Z" fill="#172022" stroke="#66503a" stroke-width="2"/>
 <path d="M0 189L51 158H309L360 189V220H0Z" fill="url(#floor-${uid})" stroke="#b9976b" stroke-opacity=".55" stroke-width="2"/>
 <path d="M50 158H310M0 188H360" stroke="${gold}" stroke-opacity=".42" stroke-width="2"/>
 ${boards}${brick}
 <!-- Pilasters, crown moulding and light shafts convey depth. -->
 <path d="M57 10v150M303 10v150" fill="none" stroke="#080f11" stroke-width="9"/>
 <path d="M58 18H303M57 149H303" stroke="${gold}" stroke-opacity=".48" stroke-width="2"/>
 <path d="M11 31v138m338 -138v138" stroke="#8f7050" stroke-opacity=".38" stroke-width="2"/>
 <ellipse cx="177" cy="75" rx="135" ry="104" fill="url(#lamp-${uid})"/>
 <!-- The furnishing is a distinct miniature scene in every named room. -->
 <g transform="translate(56 6) scale(.78 .73)">${roomObject(kind,gold,glass)}</g>
 <path d="M48 151L15 189M310 151l33 38" stroke="#edc28b" stroke-opacity=".25" stroke-width="2"/>
 <path d="M0 19L51 8M309 8l51 11M0 216H360" stroke="${gold}" stroke-opacity=".64" stroke-width="2"/>
 <rect width="360" height="220" fill="url(#grain-${uid})" opacity=".85"/>
 <rect width="360" height="220" fill="url(#lamp-${uid})" opacity=".18"/>
 </svg>`;
}
root.ImpossibleArt={avatar,housePoster,room};
})(typeof globalThis !== 'undefined'?globalThis:this);