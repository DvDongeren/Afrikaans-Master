/* 00-basis.js — Basis: data laden, hulpfuncties, opslag, leerlogica, spraak, thema en iconen.
   Alle bestanden in bron/js worden op volgorde samengevoegd tot één script (één scope). */
(()=>{
'use strict';
/* ---------- data: kaarten compact (tab/regel), de rest pas bij eerste gebruik ---------- */
const L=f=>{let v,d=0;const g=()=>d?v:(d=1,v=f());g.reset=()=>{d=0;v=undefined};return g};
const FILES=JSON.parse(document.getElementById('app').dataset.files||'{}'),D={},PR={};
function load(n){return PR[n]||(PR[n]=fetch(FILES[n],{credentials:'same-origin'}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return /^cards\d$/.test(n)?r.text():r.json()}).then(v=>(D[n]=v)).catch(e=>{delete PR[n];throw e}))}
function parseCards(t,m){const R=t.split('\n'),o=[],lv=m.lv,ct=m.cat;for(const r of R){if(!r)continue;const f=r.split('\t');o.push({id:+f[0],niveau:lv[+f[1]],categorie:ct[+f[2]],nl:f[3],af:f[4],voorbeeld:f[5],tips:f[6]||''})}return o}
let META={lv:[],cat:[],n:{}},CARDS=[],N={};
const DLG=()=>D.dlg,PATHS=()=>D.paths,LES=()=>D.les,X=()=>D.ext,Y=()=>D.vv,FACTS=()=>D.facts,MED=()=>D.media;
const TESTHOOK=location.protocol==='file:'||/^(localhost|127\.0\.0\.1)$/.test(location.hostname);

/* ---------- helpers ---------- */
const $=(s,e=document)=>e.querySelector(s);
const app=document.getElementById('app');
const esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=t=>t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const nzs=t=>norm(t).replace(/['’‘`´]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const DAY=864e5,BOX=[0,1,3,7,14,30,60],rank={Beginner:0,Intermediate:1,Advanced:2};
const fmt=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const byId=L(()=>{const m=new Map();for(const c of CARDS)m.set(c.id,c);return m});
const IDX=L(()=>CARDS.map(c=>norm(c.nl+' '+c.af)));
const TOK=L(()=>IDX().map(s=>[...new Set(s.split(/[^\p{L}\p{N}]+/u).filter(w=>w.length>=3))]));
/* tikfouten toestaan: één letter verschil vanaf 4 letters, twee vanaf 8 */
const fuzzyOk=(w,q)=>{const k=q.length>=8?2:1;return Math.abs(w.length-q.length)<=k&&levN(w,q,k)<=k};
/* afstand met verwisseling van twee letters als één fout (olifnat → olifant) */
function levN(a,b,k){const m=a.length,n=b.length;let pp=null,p=[...Array(n+1).keys()];for(let i=1;i<=m;i++){const c=[i];let lo=i;for(let j=1;j<=n;j++){let v=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));if(pp&&i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])v=Math.min(v,pp[j-2]+1);c[j]=v;if(v<lo)lo=v}if(lo>k)return k+1;pp=p;p=c}return p[n]}
function fuzzyCards(q){if(q.length<4||q.includes(' '))return[];const T=TOK(),r=[];for(let i=0;i<CARDS.length;i++)if(T[i].some(w=>fuzzyOk(w,q)))r.push(i);return r}
const BYCAT=L(()=>{const m=new Map();for(const c of CARDS){let a=m.get(c.categorie);if(!a)m.set(c.categorie,a=[]);a.push(c)}return m});
const ORDER=L(()=>{const s0=rank[S.startLv]||0,k=c=>c.own?-1:(rank[c.niveau]-s0+3)%3;return CARDS.slice().sort((a,b)=>k(a)-k(b)||a.id-b.id)});
const okWord=c=>{const n=t=>t.toLowerCase().replace(/[^\p{L} ]/gu,'').trim();return c.niveau!=='Advanced'&&n(c.nl)!==n(c.af)&&n(c.voorbeeld)!==n(c.af)&&c.voorbeeld.split(' ').length>=4&&c.af.length<=40};
function wordOfDay(){const P=CARDS.filter(c=>c.niveau==='Beginner'&&!c.own).sort((a,b)=>a.id-b.id),d=Math.floor(Date.now()/DAY),n=P.length;if(!n)return CARDS[0];let i=(d*7919)%n;for(let k=0;k<n;k++,i=(i+1)%n)if(okWord(P[i]))return P[i];return P[0]}

/* ---------- opslag: gebundeld schrijven, altijd wegschrijven bij verlaten ---------- */
const KEY='af2';
const DEF=()=>({srs:{},favs:[],streak:0,last:'',days:{},theme:'auto',goal:15,paths:{},dlg:{},les:{},lp:'',typed:false,stories:{},own:[],reports:[],rate:1,startLv:'',lvDone:false,haptic:true,games:{},instHide:false,fs:'n',read:false,ms:{},frz:0,frzD:[],lvl:0});
let S=DEF();try{Object.assign(S,JSON.parse(localStorage.getItem(KEY))||{})}catch{}
const ownCard=o=>({id:o.id,niveau:'Beginner',categorie:'Eigen kaarten',nl:o.nl,af:o.af,voorbeeld:o.vb||'',tips:'',own:1});
let saveT=0;
const saveNow=()=>{clearTimeout(saveT);saveT=0;msSoon();S.mt=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S))}catch{}if(cloud.user)schedulePush()};
const save=()=>{if(!saveT)saveT=setTimeout(saveNow,400)};
let msT=0;const msSoon=()=>{if(!msT&&typeof checkMs==='function'&&CARDS.length)msT=setTimeout(()=>{msT=0;try{checkMs()}catch{}},250)};
addEventListener('pagehide',saveNow);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveNow()});

/* ---------- leerlogica ---------- */
const todayN=()=>S.days[fmt(new Date())]||0;
/* Reeks met rustdagen: elke 7 dagen op rij levert een rustdag op (maximaal 2). Een gemiste dag kost een rustdag in plaats van je reeks. */
const dayAt=k=>Date.parse(k+'T12:00:00');
const missed=()=>S.last?Math.round((dayAt(fmt(new Date()))-dayAt(S.last))/DAY)-1:Infinity;
const streak=()=>{const m=missed();return m<=0||m<=(S.frz||0)?S.streak:0};
function count(){const t=fmt(new Date());S.days[t]=(S.days[t]||0)+1;
 if(S.last!==t){const m=missed();
  if(m===0)S.streak++;
  else if(m>0&&m<=(S.frz||0)){S.frz-=m;for(let i=1;i<=m;i++)S.frzD.push(fmt(new Date(dayAt(S.last)+i*DAY)));S.frzD=S.frzD.slice(-400);S.streak++}
  else S.streak=1;
  S.last=t;if(S.streak%7===0&&(S.frz||0)<2){S.frz=(S.frz||0)+1;S.frzNew=1}}
 save()}
function grade(id,ok){const r=S.srs[id]||{box:0};r.box=ok?Math.min(r.box+1,6):0;r.due=Date.now()+(ok?BOX[r.box]*DAY:6e5);r.t=Date.now();if(!r.f)r.f=r.t;S.srs[id]=r;count()}
const isDue=id=>{const r=S.srs[id];return!!r&&r.due<=Date.now()};
function dueCount(){const now=Date.now();let n=0;for(const k in S.srs)if(S.srs[k].due<=now)n++;return n}
function sessionQueue(n){const now=Date.now(),due=[],m=byId();
 for(const k in S.srs){const r=S.srs[k];if(r.due<=now){const c=m.get(+k);if(c)due.push(c)}}
 due.sort((a,b)=>S.srs[a.id].due-S.srs[b.id].due);if(due.length>n)due.length=n;
 const need=n-due.length;if(need>0)for(const c of ORDER()){if(!S.srs[c.id]){due.push(c);if(due.length>=n)break}}
 return due}
function poolFor(sc){const now=Date.now(),k=c=>S.srs[c.id];let r;
 if(sc==='review7')r=CARDS.filter(c=>k(c)&&(k(c).t||0)<now-7*DAY);
 else if(sc==='hard')r=CARDS.filter(c=>k(c)&&k(c).box<=1);
 else if(sc==='smart')r=CARDS.filter(c=>isDue(c.id)||(k(c)&&k(c).box<=2));
 else if(sc&&sc.startsWith('cat:'))r=BYCAT().get(sc.slice(4))||[];
 else r=CARDS.filter(c=>c.niveau===sc);
 if(r.length<4&&sc==='review7')r=CARDS.filter(c=>k(c));
 return r.length>=4?r:CARDS}

/* ---------- spraak ---------- */
let VOICE,AFV=null;
const pickVoice=()=>{try{const v=speechSynthesis.getVoices();VOICE=v.find(x=>/^af/i.test(x.lang))||v.find(x=>/^nl/i.test(x.lang))||null;const was=AFV;AFV=v.length?!!v.find(x=>/^af/i.test(x.lang)):null;if(was!==AFV)setTimeout(()=>{if(view==='klank')render()})}catch{}};
const voiceNote=()=>AFV===false&&!AUDIO.on?`<div class="card warn" role="note"><h2>Geen Afrikaanse stem op dit toestel</h2><p>De voorleesknop gebruikt nu een Nederlandse stem, dus de uitspraak klopt niet helemaal. Lees de uitleg en luister vooral naar echte sprekers, bijvoorbeeld via Muziek, films en series. Op Android kun je bij Instellingen › Tekst-naar-spraak kijken of er een Afrikaanse stem te downloaden is.</p></div>`:'';
try{pickVoice();speechSynthesis.onvoiceschanged=pickVoice}catch{}
const AUDIO={on:false};let CUR=null;
function ahash(t){const b=new TextEncoder().encode(t);let h1=0x811c9dc5,h2=0x050c5d1f;for(const x of b){h1=Math.imul(h1^x,0x01000193)>>>0;h2=Math.imul(h2^x,0x01000193)>>>0}return h1.toString(16).padStart(8,'0')+h2.toString(16).padStart(8,'0')}
function playFile(t,r){return new Promise(res=>{try{if(CUR){CUR.pause();CUR=null}const a=new Audio('audio/'+ahash(t.trim())+'.mp3');CUR=a;a.playbackRate=r||S.rate||1;a.onended=()=>res(true);a.onerror=()=>res(false);const p=a.play();if(p)p.catch(()=>res(false))}catch{res(false)}})}
function ttsSpeak(t,r){try{speechSynthesis.cancel();speechSynthesis.speak(utt(t,r))}catch{}}
function utt(t,r){const u=new SpeechSynthesisUtterance(t);u.lang='af-ZA';u.rate=r||S.rate||1;if(VOICE){u.voice=VOICE;u.lang=VOICE.lang}return u}
function speak(t,r){if(!AUDIO.on)return ttsSpeak(t,r);try{speechSynthesis.cancel()}catch{}playFile(t,r).then(ok=>{if(!ok)ttsSpeak(t,r)})}
const canSpeak=()=>AUDIO.on||'speechSynthesis' in window;
function buzz(k){if(!S.haptic)return;try{navigator.vibrate&&navigator.vibrate(k==='bad'?[25,45,25]:10)}catch{}}
function speakAll(a){if(!AUDIO.on){try{speechSynthesis.cancel();a.forEach(t=>speechSynthesis.speak(utt(t)))}catch{}return}const tok=Symbol();speakAll.tok=tok;(async()=>{for(const t of a){if(speakAll.tok!==tok)return;if(!await playFile(t))await new Promise(res=>{try{const u=utt(t);u.onend=u.onerror=res;speechSynthesis.speak(u)}catch{res()}})}})()}

/* ---------- thema ---------- */
const mq=matchMedia('(prefers-color-scheme: dark)');
function theme(){const m=S.theme==='auto'?(mq.matches?'dark':'light'):S.theme;document.documentElement.dataset.theme=m;document.querySelectorAll('meta[name=theme-color]').forEach(x=>x.content=m==='dark'?'#0b110e':'#eef1ec');const de=document.documentElement;de.dataset.fs=S.fs||'n';if(S.read)de.dataset.read='1';else delete de.dataset.read}

/* ---------- iconen ---------- */
const ic=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const I={
home:ic('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
oef:ic('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>'),
pad:ic('<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6a3 3 0 000-6h-4a3 3 0 010-6h6"/>'),
kaart:ic('<rect x="4" y="3" width="16" height="14" rx="2"/><path d="M8 21h8M8 7h8M8 11h5"/>'),
meer:ic('<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'),
spk:ic('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 8a5 5 0 010 8"/>'),
star:ic('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z"/>'),
flame:ic('<path d="M12 3c.6 3.2 4.8 5 4.8 10a4.8 4.8 0 01-9.6 0c0-2 1-3.4 2.2-4.3.1 1.3.7 2.2 1.7 2.6-.4-3.4.3-5.9.9-8.3z"/>'),
chev:ic('<path d="M9 6l6 6-6 6"/>'),back:ic('<path d="M15 6l-6 6 6 6"/>'),x:ic('<path d="M6 6l12 12M18 6L6 18"/>'),check:ic('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
gram:ic('<path d="M5 4.5A1.5 1.5 0 016.5 3H19v15H6.5A1.5 1.5 0 005 19.5z"/><path d="M5 19.5A1.5 1.5 0 006.5 21H19v-3"/><path d="M9 7h6M9 10.5h4"/>'),
dlg:ic('<path d="M4 4h11a2 2 0 012 2v6a2 2 0 01-2 2H9l-4 3.5V14H4a2 2 0 01-2-2V6a2 2 0 012-2z"/><path d="M20 9a2 2 0 012 2v6a2 2 0 01-2 2h-1v2.5L15.5 19H12"/>'),
zin:ic('<rect x="2.5" y="5.5" width="8" height="5.5" rx="1.6"/><rect x="13.5" y="5.5" width="8" height="5.5" rx="1.6"/><rect x="7.5" y="13.5" width="9" height="5.5" rx="1.6"/>'),
nie:ic('<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>'),
vv:ic('<path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/>'),
story:ic('<path d="M2.5 5.5c3-1.2 6.2-1 9.5 1 3.3-2 6.5-2.2 9.5-1V19c-3-1.2-6.2-1-9.5 1-3.3-2-6.5-2.2-9.5-1z"/><path d="M12 6.5V20"/>'),
vertaal:ic('<path d="M4 5h8M8 3v2M5.5 5c.5 3 2.5 5.5 5.5 7M10.5 5c-.6 3-2.6 5.6-6 7.5"/><path d="M13 21l4-9 4 9M14.5 18h5"/>'),
print:ic('<path d="M7 8V3h10v5"/><rect x="3" y="8" width="18" height="9" rx="2"/><path d="M7 14h10v7H7z"/>'),
klank:ic('<path d="M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3z"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>'),
spel:ic('<rect x="2.5" y="7" width="19" height="11" rx="4"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="16" cy="11.5" r="1"/><circle cx="18" cy="13.5" r="1"/>'),
chart:ic('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
dl:ic('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
inbox:ic('<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 2h6l1-2h5"/>'),
media:ic('<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>'),
reis:ic('<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7M3 12h18"/>'),
cult:ic('<path d="M2 20h20"/><path d="M3.5 20L7 10h10l3.5 10"/><path d="M7 10l2-2h6l2 2"/>'),
wa:ic('<rect x="6" y="2.5" width="12" height="19" rx="2.6"/><path d="M10.5 18.5h3"/>'),
menu:ic('<path d="M7 3v18M4.5 3v5a2.5 2.5 0 005 0V3"/><path d="M17.5 21V3c-2.3 1.5-3 4.5-3 8h3"/>'),
slang:ic('<path d="M20.5 12a8.5 8.5 0 01-12.4 7.5L3.5 21l1.6-4.4A8.5 8.5 0 1120.5 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>'),
quiz:ic('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-1 .7-1.5 1.3-1.5 2.4M12 17h.01"/>'),
sess:ic('<rect x="3.5" y="6.5" width="13" height="14" rx="2"/><path d="M7.5 3.5h11a2 2 0 012 2v11"/>'),
user:ic('<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5"/>'),
search:ic('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
ear:ic('<path d="M4 15v-3a8 8 0 0116 0v3"/><rect x="3" y="14" width="4.5" height="7" rx="1.6"/><rect x="16.5" y="14" width="4.5" height="7" rx="1.6"/>'),
bolt:ic('<path d="M13 2.5L4.5 14h7l-1 7.5L19 10h-7z"/>'),
plus:ic('<path d="M12 5v14M5 12h14"/>'),
flag:ic('<path d="M5 21V4h11l-2 4 2 4H5"/>'),
trash:ic('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
medal:ic('<circle cx="12" cy="14.5" r="5.5"/><path d="M8.5 9.8L6 3h4l2 4.5L14 3h4l-2.5 6.8"/>'),
shield:ic('<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z"/><path d="M9 12l2 2 4-4"/>'),
share:ic('<path d="M12 15V3M7.5 7.5L12 3l4.5 4.5"/><path d="M5 12v7.5h14V12"/>')};
