'use strict';
/*
 * Minimal server-side chat safeguards for a prototype.
 * This is intentionally NOT presented as comprehensive safety moderation.
 * Public chat needs stronger abuse tooling and human review before a large launch.
 */
const badWords=[
  'fuck','fucking','fucker','motherfucker','shit','bullshit','bitch','asshole',
  'bastard','dickhead','cunt','nigger','nigga','faggot','retard','slut',
  'whore','kys','kill yourself'
];
const escapeRegex=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const pattern=new RegExp(`\\b(?:${badWords.map(escapeRegex).join('|')})\\b`,'gi');
function moderateChat(input){
  if(typeof input!=='string')return '';
  let text=input.normalize('NFKC').replace(/[\u0000-\u001F\u007F-\u009F]/g,' ').replace(/\s+/g,' ').trim().slice(0,160);
  // Remove addresses and direct-contact data before profanity masking.
  text=text.replace(/(?:https?:\/\/|www\.)\S+/gi,'[link removed]');
  text=text.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,'[contact removed]');
  text=text.replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g,'[number removed]');
  // Common symbol substitutions are normalized for matching only; the visible text is preserved.
  const normalized=text.toLowerCase().replace(/[@4]/g,'a').replace(/[1|]/g,'i').replace(/3/g,'e').replace(/0/g,'o').replace(/\$/g,'s');
  const masked=[...text];
  for(const match of normalized.matchAll(pattern)){
    const start=match.index;
    for(let i=start;i<start+match[0].length;i++)if(masked[i] && /[a-z0-9@$!|]/i.test(masked[i]))masked[i]='*';
  }
  text=masked.join('');
  return text;
}
module.exports={moderateChat};
