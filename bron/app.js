(()=>{
'use strict';
/* ---------- data: kaarten compact (tab/regel), de rest pas bij eerste gebruik ---------- */
const L=f=>{let v,d=0;const g=()=>d?v:(d=1,v=f());g.reset=()=>{d=0;v=undefined};return g};
const FILES=JSON.parse(document.getElementById('app').dataset.files||'{}'),D={},PR={};
function load(n){return PR[n]||(PR[n]=fetch(FILES[n],{credentials:'same-origin'}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return n==='cards'?r.text():r.json()}).then(v=>(D[n]=v)).catch(e=>{delete PR[n];throw e}))}
function parseCards(t,m){const R=t.split('\n'),o=[],lv=m.lv,ct=m.cat;for(const r of R){if(!r)continue;const f=r.split('\t');o.push({id:+f[0],niveau:lv[+f[1]],categorie:ct[+f[2]],nl:f[3],af:f[4],voorbeeld:f[5],tips:f[6]||''})}return o}
let META={lv:[],cat:[],n:{}},CARDS=[],N={};
const DLG=()=>D.dlg,PATHS=()=>D.paths,LES=()=>D.les,X=()=>D.ext,Y=()=>D.vv,FACTS=()=>D.facts;
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
const BYCAT=L(()=>{const m=new Map();for(const c of CARDS){let a=m.get(c.categorie);if(!a)m.set(c.categorie,a=[]);a.push(c)}return m});
const ORDER=L(()=>{const s0=rank[S.startLv]||0,k=c=>c.own?-1:(rank[c.niveau]-s0+3)%3;return CARDS.slice().sort((a,b)=>k(a)-k(b)||a.id-b.id)});
const okWord=c=>{const n=t=>t.toLowerCase().replace(/[^\p{L} ]/gu,'').trim();return c.niveau!=='Advanced'&&n(c.nl)!==n(c.af)&&n(c.voorbeeld)!==n(c.af)&&c.voorbeeld.split(' ').length>=4&&c.af.length<=40};
function wordOfDay(){const d=Math.floor(Date.now()/DAY),n=CARDS.length;let i=(d*7919)%n;for(let k=0;k<n;k++,i=(i+1)%n)if(okWord(CARDS[i]))return CARDS[i];return CARDS[0]}

/* ---------- opslag: gebundeld schrijven, altijd wegschrijven bij verlaten ---------- */
const KEY='af2';
const DEF=()=>({srs:{},favs:[],streak:0,last:'',days:{},theme:'auto',goal:15,paths:{},dlg:{},les:{},lp:'',typed:false,stories:{},own:[],reports:[],rate:1,startLv:'',lvDone:false,haptic:true});
let S=DEF();try{Object.assign(S,JSON.parse(localStorage.getItem(KEY))||{})}catch{}
const ownCard=o=>({id:o.id,niveau:'Beginner',categorie:'Eigen kaarten',nl:o.nl,af:o.af,voorbeeld:o.vb||'',tips:'',own:1});
let saveT=0;
const saveNow=()=>{clearTimeout(saveT);saveT=0;S.mt=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S))}catch{}if(cloud.user)schedulePush()};
const save=()=>{if(!saveT)saveT=setTimeout(saveNow,400)};
addEventListener('pagehide',saveNow);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveNow()});

/* ---------- leerlogica ---------- */
const todayN=()=>S.days[fmt(new Date())]||0;
const streak=()=>{const t=fmt(new Date()),y=fmt(new Date(Date.now()-DAY));return(S.last===t||S.last===y)?S.streak:0};
function count(){const t=fmt(new Date());S.days[t]=(S.days[t]||0)+1;if(S.last!==t){S.streak=S.last===fmt(new Date(Date.now()-DAY))?S.streak+1:1;S.last=t}save()}
function grade(id,ok){const r=S.srs[id]||{box:0};r.box=ok?Math.min(r.box+1,6):0;r.due=Date.now()+(ok?BOX[r.box]*DAY:6e5);r.t=Date.now();S.srs[id]=r;count()}
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
let VOICE;
const pickVoice=()=>{try{const v=speechSynthesis.getVoices();VOICE=v.find(x=>/^af/i.test(x.lang))||v.find(x=>/^nl/i.test(x.lang))||null}catch{}};
try{pickVoice();speechSynthesis.onvoiceschanged=pickVoice}catch{}
function utt(t,r){const u=new SpeechSynthesisUtterance(t);u.lang='af-ZA';u.rate=r||S.rate||1;if(VOICE){u.voice=VOICE;u.lang=VOICE.lang}return u}
function speak(t,r){try{speechSynthesis.cancel();speechSynthesis.speak(utt(t,r))}catch{}}
const canSpeak=()=>'speechSynthesis' in window;
function buzz(k){if(!S.haptic)return;try{navigator.vibrate&&navigator.vibrate(k==='bad'?[25,45,25]:10)}catch{}}
function speakAll(a){try{speechSynthesis.cancel();a.forEach(t=>speechSynthesis.speak(utt(t)))}catch{}}

/* ---------- thema ---------- */
const mq=matchMedia('(prefers-color-scheme: dark)');
function theme(){const m=S.theme==='auto'?(mq.matches?'dark':'light'):S.theme;document.documentElement.dataset.theme=m;$('meta[name=theme-color]').content=m==='dark'?'#0b110e':'#eef1ec'}

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
medal:ic('<circle cx="12" cy="14.5" r="5.5"/><path d="M8.5 9.8L6 3h4l2 4.5L14 3h4l-2.5 6.8"/>')};

/* ---------- navigatie ---------- */
let view='home',st={};
const NAV=[['home','Home',I.home],['oef','Oefen',I.oef],['paden','Paden',I.pad],['kaart','Kaarten',I.kaart],['zoek','Zoeken',I.search],['meer','Meer',I.meer]];
const navEl=document.getElementById('nav');
navEl.innerHTML=NAV.map(([k,l,i])=>`<button data-v="${k}" ${k==='zoek'?'class="desk"':''}>${i}<span>${l}</span></button>`).join('');
const PARENT={sess:'oef',quiz:'oef',dlgs:'oef',dlg:'oef',gram:'oef',les:'oef',mc:'oef',zin:'oef',reis:'oef',cult:'oef',vv:'oef',stories:'oef',story:'oef',path:'paden',luister:'oef',weak:'oef',toets:'home',own:'kaart',zoek:'zoek'};
function setNav(){const cur=st&&st.ret?'paden':PARENT[view]||view;for(const b of navEl.children){const on=b.dataset.v===cur;b.classList.toggle('on',on);on?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current')}}
function go(v,s){view=v;st=s||{};render();scrollTo(0,0)}
const V={};
const WIDE=new Set(['home','oef','kaart','paden','zoek','vv','gram','dlgs','stories','cult','reis','path']);
const DEPS={home:['facts','paths'],paden:['paths'],path:['paths','les','dlg'],dlgs:['dlg'],dlg:['dlg'],gram:['les'],les:['les'],mc:['ext','vv'],zin:['ext'],reis:['ext'],cult:['ext','facts'],vv:['vv'],stories:['vv'],story:['vv'],luister:['ext','dlg'],zoek:['dlg','vv','les','ext','paths'],meer:['paths']};
function render(){setNav();app.className=WIDE.has(view)?'wide':'focus';const need=(DEPS[view]||[]).filter(n=>!D[n]);
 if(need.length){const v=view,s0=st;app.innerHTML='<p class="loading" role="status">Laden…</p>';Promise.all(need.map(load)).then(()=>{if(view===v&&st===s0)render()},loadError);return}
 (V[view]||V.home)()}
function loadError(){app.className='focus';app.innerHTML=`<div class="result stack"><h1>Laden lukte niet</h1><p class="muted">De inhoud kon niet worden opgehaald. Controleer je internetverbinding en probeer het opnieuw.</p><div class="stack" style="margin-top:22px"><button class="btn" data-reload="1">Opnieuw proberen</button></div></div>`}
const draw=h=>{app.innerHTML=h};
const back=(a,l)=>`<button class="back" data-a="${a}">${I.back}${l}</button>`;
const topbar=(i,n,a='back')=>`<div class="top"><button class="x" data-a="${a}" aria-label="Stoppen">${I.x}</button><div class="bar"><i style="width:${i/n*100}%"></i></div><span class="muted" style="font-variant-numeric:tabular-nums">${Math.min(i+1,n)} / ${n}</span></div>`;
const spk=(t,cls='')=>`<button class="icon ${cls}" data-sp="${esc(t)}" aria-label="Uitspraak">${I.spk}</button>`;
const mark=k=>k?`<span class="done-mark" aria-label="Gedaan">${I.check}</span>`:'';
const row=(attrs,icon,title,sub,trail)=>`<button class="li tile" ${attrs}>${icon?`<span class="ico">${icon}</span>`:''}<span class="grow"><h2>${title}</h2>${sub?`<span class="muted">${sub}</span>`:''}</span>${trail??`<span class="chev">${I.chev}</span>`}</button>`;
function result(sc,n,msg,btns,extra=''){draw(`<div class="result stack"><div class="score" aria-label="${sc} van ${n} goed">${sc}<small> / ${n}</small></div>${msg?`<h1>${msg}</h1>`:''}${extra}<div class="stack" style="margin-top:22px">${btns}</div></div>`)}
const praise=(sc,n)=>sc===n?'Foutloos, knap gedaan!':sc>=n*.7?'Goed bezig!':'Oefening baart kunst';

/* ---------- sessieknop met voortgang ---------- */
function cta(){const g=S.goal,n=todayN(),d=dueCount(),pct=Math.min(1,n/g);
 return`<button class="cta" data-a="sess"><span class="grow"><b>${n>=g?'Doel gehaald, nog een ronde?':'Dagelijkse sessie'}</b><small>${d} te herhalen · daarna nieuwe kaarten</small></span><span class="n">${Math.min(n,g)}/${g}</span><span class="fill"><i style="width:${pct*100}%"></i></span></button>`}

/* ---------- home ---------- */
V.home=()=>{const h=new Date().getHours(),hi=h<12?['Goeiemôre','Goedemorgen']:h<18?['Goeiemiddag','Goedemiddag']:['Goeienaand','Goedenavond'];
 const wc=wordOfDay(),F=FACTS(),fact=F[Math.floor(Date.now()/DAY)%F.length];
 let cont='';if(S.lp){const lp=PATHS().find(p=>p.id===S.lp),dn=lp&&(S.paths[lp.id]||[]),nxi=lp?lp.steps.findIndex((_,i)=>!dn.includes(i)):-1;
  if(nxi>=0)cont=`<div class="sec">Ga verder met je pad</div><div class="list">${row(`data-p="${lp.id}"`,I.pad,esc(lp.title),'Volgende: '+esc(lp.steps[nxi].title))}</div>`}
 const s=streak();
 draw(`<div class="home-grid"><div class="col"><header class="hero"><div class="row sp"><span class="brand">Afrikaans Master</span><span class="row" style="gap:8px">${s?`<span class="badge">${I.flame}${s} ${s===1?'dag':'dagen'} op rij</span>`:`<span class="muted small">Begin vandaag je reeks</span>`}<button class="x" data-a="zoek" aria-label="Zoeken">${I.search}</button></span></div>
 <div class="hero-row"><div><div class="hello">${hi[0]}</div><div class="nl">${hi[1]}</div></div><svg class="illu" viewBox="0 0 120 84" aria-hidden="true"><circle cx="86" cy="26" r="13" class="sun"/><path d="M6 64 L30 40 Q32 38 35 38 L84 38 Q87 38 89 40 L114 64" class="mtn"/><path d="M16 72h88M30 79h60" class="sea"/></svg></div></header>
 ${cta()}
 <div class="quick" style="margin-top:12px"><button data-a="quiz">${I.quiz}Quiz</button><button data-a="dlgs">${I.dlg}Dialogen</button><button data-a="stories">${I.story}Verhalen</button></div>
 ${!S.lvDone&&Object.keys(S.srs).length<30?`<div class="card stack" style="margin-top:12px"><h2>Wat is je niveau?</h2><p class="muted">Doe de niveautoets van 12 vragen. Daarna start je sessie op jouw niveau.</p><div class="row"><button class="btn ghost" data-lvskip="1">Niet nu</button><button class="btn" data-a="toets">Start toets</button></div></div>`:''}
 ${cont}</div><div class="col">
 <div class="sec">Woord van de dag</div>
 <div class="card entry"><div class="row sp"><div class="grow"><div class="af">${esc(wc.af)}</div><div class="nl">${esc(wc.nl)}</div></div>${spk(wc.af)}</div><p class="ex">${esc(wc.voorbeeld)}</p></div>
 <div class="sec">Weetje van de dag</div>
 <button class="card fact" data-a="cult" style="width:100%;text-align:left"><div class="lbl">${esc(fact.s)}</div><p>${esc(fact.t)}</p></button>
 <p class="muted" style="text-align:center;margin-top:22px">${Object.keys(S.srs).length} van ${CARDS.length} kaarten gestart</p></div></div>`)};

/* ---------- oefenen ---------- */
V.oef=()=>{const lv=st.lv||'Alles';
 draw(`<div class="row sp"><h1>Oefenen</h1><button class="x" data-a="zoek" aria-label="Zoeken">${I.search}</button></div><div style="margin-top:18px">${cta()}</div>
 <div class="secs"><section><div class="sec">Slim oefenen</div><div class="list">
 ${row('data-a="weak"',I.bolt,'Moeilijke kaarten',weakList().length?weakList().length+' kaarten die je vaak fout hebt':'Nog geen moeilijke kaarten')}
 ${row('data-a="luister"',I.ear,'Luisteren',canSpeak()?'Hoor een zin en typ wat je hoort':'Niet beschikbaar op dit toestel')}</div>
</section><section><div class="sec">Taal en grammatica</div><div class="list">
 ${row('data-a="gram"',I.gram,'Grammatica',N.les+' lessen met uitleg en oefeningen')}
 ${row('data-a="zin"',I.zin,'Zinnen bouwen',N.bs+' zinnen in de goede volgorde')}
 ${row('data-a="mc:nie"',I.nie,'Nie-drill',N.nie+' vragen over nie … nie')}
 ${row('data-a="vv"',I.vv,'Valse vrienden',N.vv+' woorden die misleiden')}</div>
</section><section><div class="sec">Lezen en luisteren</div><div class="list">
 ${row('data-a="dlgs"',I.dlg,'Dialogen',N.dlg+' gesprekken, ook als rollenspel')}
 ${row('data-a="stories"',I.story,'Verhaaltjes',N.st+' verhalen met woordhulp')}
 ${row('data-a="reis"',I.reis,'Reisgids',N.reis+' handige zinnen')}
 ${row('data-a="cult"',I.cult,'Cultuur','Weetjes en lokale woorden')}</div>
</section><section><div class="sec">In de praktijk</div><div class="list">
 ${row('data-a="mc:wa"',I.wa,'WhatsApp',N.wa+' chats: kies het beste antwoord')}
 ${row('data-a="mc:menu"',I.menu,'Restaurant',N.menu+' menu\'s om van te bestellen')}
 ${row('data-a="mc:slang"',I.slang,'Slang',N.sl+' uitdrukkingen uit de spreektaal')}</div>
</section><section><div class="sec">Quiz</div><div class="card stack"><div class="muted">10 meerkeuzevragen, Nederlands en Afrikaans door elkaar.</div>
 <div class="chips" id="lv">${['Alles','Beginner','Intermediate','Advanced'].map(l=>`<button class="chip ${lv===l?'on':''}" data-lv="${l}">${l}</button>`).join('')}</div><button class="btn" id="qs">Start quiz</button></div></section></div>`);
 $('#lv').onclick=e=>{const b=e.target.closest('[data-lv]');if(!b)return;st.lv=b.dataset.lv;for(const x of $('#lv').children)x.classList.toggle('on',x===b)};
 $('#qs').onclick=()=>go('quiz',{lv:st.lv||'Alles'})};

/* ---------- dagelijkse sessie ---------- */
V.sess=()=>{
 if(!st.q||st.i===undefined){st.q=st.q||sessionQueue(S.goal);st.i=0;st.open=false;st.done=0;st.retry=[]}
 const c=st.q[st.i];
 if(!c){draw(`<div class="result stack"><div class="score">${st.done}</div><h1>Sessie klaar</h1><p class="muted">Vandaag: ${todayN()} van ${S.goal} kaarten.</p><div class="stack" style="margin-top:22px">${st.ret?'<button class="btn" data-a="stepdone">Verder met het pad</button>':'<button class="btn" data-a="home">Terug naar home</button>'}</div></div>`);return}
 let verdict='';if(st.tv===1)verdict='<span class="verdict ok">Goed!</span>';else if(st.tv===0)verdict=`<span class="verdict bad">Jij typte: ${esc(st.val)}</span>`;
 const closed=S.typed?`<form id="tf"><input type="text" id="ta" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Typ het Afrikaans" aria-label="Antwoord"><div class="row" style="margin-top:10px"><button type="button" class="btn ghost" id="tskip">Weet ik niet</button><button class="btn" type="submit">Controleer</button></div></form>`:`<div class="muted hint">Tik om het antwoord te zien</div>`;
 draw(`${topbar(st.i,st.q.length)}
 <div class="fc${st.flip?' flip':''}" id="fc" tabindex="0" role="button" aria-label="Toon antwoord"><div class="lbl">Nederlands</div><div class="big">${esc(c.nl)}</div>
 ${st.open?`<hr class="rule"><div class="ans">${verdict}<div class="lbl">Afrikaans</div><div class="big af">${esc(c.af)}</div><p class="ex">${esc(c.voorbeeld)}</p>${c.tips?`<div class="tip">${esc(c.tips)}</div>`:''}<div class="row">${spk(c.af)}<button class="linkbtn" data-rep="${c.id}">${I.flag}Klopt niet?</button></div></div>`:closed}</div>
 ${st.open?`<div class="row" style="margin-top:14px"><button class="btn ghost" data-g="0">Nog niet</button><button class="btn" data-g="1">Ik wist het</button></div><p class="muted swipe-hint">Of veeg de kaart: naar rechts als je het wist, naar links als nog niet.</p>`:''}`);st.flip=0;{const f=$('#fc');f&&f.addEventListener('animationend',()=>f.classList.remove('flip'),{once:true})}
 if(S.typed&&!st.open){const nz=t=>nzs(t).replace(/^n /,''),alts=[nz(c.af)].concat(c.af.split(/\s*\/\s*/).map(x=>nz(x.replace(/\(.*?\)/g,''))));
  $('#tf').onsubmit=e=>{e.preventDefault();const v=$('#ta').value;st.val=v.trim();st.tv=alts.includes(nz(v))?1:0;if(!st.tv)buzz('bad');st.open=true;st.flip=1;render()};
  $('#tskip').onclick=()=>{st.tv=-1;st.open=true;render()};requestAnimationFrame(()=>{const t=$('#ta');t&&t.focus()})}};

/* ---------- quiz ---------- */
V.quiz=()=>{
 if(!st.q){const pool=st.pool||(st.lv&&st.lv!=='Alles'?CARDS.filter(c=>c.niveau===st.lv):CARDS);st.q=shuffle(pool).slice(0,st.n||10);st.i=0;st.score=0;st.ans=null;st.wr=[]}
 const c=st.q[st.i];
 if(!c){const wr=st.wr.length?`<div class="sec" style="text-align:left">Om te herhalen</div><div class="list" style="text-align:left">${st.wr.map(c=>`<div class="li"><span class="grow"><span class="af" style="font-size:1.15rem;display:block">${esc(c.af)}</span><span class="nl">${esc(c.nl)}</span></span>${spk(c.af,'sm')}</div>`).join('')}</div>`:'';
  result(st.score,st.q.length,praise(st.score,st.q.length),st.ret?'<button class="btn" data-a="stepdone">Verder met het pad</button>':'<button class="btn" data-a="oef">Opnieuw oefenen</button><button class="btn ghost" data-a="home">Home</button>',wr);return}
 if(!st.cur||st.cur.id!==c.id){const rev=st.audio?false:Math.random()<.5,k=rev?'nl':'af',q=rev?'af':'nl';
  const same=(BYCAT().get(c.categorie)||[]).filter(x=>x.id!==c.id&&x[k]!==c[k]),pool=shuffle(same.length>=3?same:CARDS.filter(x=>x.id!==c.id&&x[k]!==c[k])),opts=[];
  for(const x of pool){if(!opts.includes(x[k]))opts.push(x[k]);if(opts.length===3)break}
  st.cur={id:c.id,k,q,opts:shuffle(opts.concat(c[k]))}}
 const u=st.cur;
 draw(`${topbar(st.i,st.q.length)}
 <div class="card q"><div class="lbl">${u.q==='nl'?'Nederlands':'Afrikaans'}</div>${st.audio&&st.ans===null?`<button class="icon" style="margin:10px auto 6px;width:72px;height:72px" data-sp="${esc(c.af)}" aria-label="Luister">${I.spk}</button><div class="muted">Luister en kies de vertaling</div>`:`<div class="big ${u.q==='af'?'af':''}">${esc(c[u.q])}</div>`}</div>
 <div class="stack" id="op" style="margin-top:14px">${u.opts.map(o=>`<button class="opt ${u.k==='af'?'af-opt':''}" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>`);
 $('#op').onclick=e=>{const b=e.target.closest('.opt');if(!b||st.ans!==null)return;const ok=b.dataset.o===c[u.k];st.ans=1;
  for(const x of $('#op').children){if(x.dataset.o===c[u.k])x.classList.add('ok');x.disabled=true}if(!ok)b.classList.add('bad');
  if(ok){st.score++;count()}else{grade(c.id,false);st.wr.push(c);buzz('bad')}setTimeout(()=>{st.ans=null;st.i++;st.cur=null;render()},ok?650:1400)}};

/* ---------- kaarten ---------- */
V.kaart=()=>{st.q=st.q||'';st.lv=st.lv||'Alles';
 draw(`<h1>Kaarten</h1><div class="stack" style="margin-top:16px"><input type="search" id="s" placeholder="Zoek in Nederlands of Afrikaans" value="${esc(st.q)}" aria-label="Zoeken">
 <div class="chips" id="lv">${['Alles','Beginner','Intermediate','Advanced','Favorieten'].map(l=>`<button class="chip ${st.lv===l?'on':''}" data-lv="${l}">${l==='Favorieten'?I.star:''}${l}</button>`).join('')}</div>
 <button class="btn soft" data-a="own" style="box-shadow:inset 0 0 0 1.5px var(--hair)">${I.plus}Eigen kaart toevoegen</button>
 <select class="sel" id="cat" aria-label="Categorie"><option value="">Alle categorieën</option>${(S.own.length?['Eigen kaarten'].concat(META.cat):META.cat).map(c=>`<option ${st.cat===c?'selected':''}>${esc(c)}</option>`).join('')}</select><div id="ls"></div></div>`);
 let lim=25;const list=()=>{const q=norm(st.q.trim()),f=new Set(S.favs),ix=q?IDX():null,lv=st.lv,cat=st.cat,r=[];
  for(let i=0;i<CARDS.length;i++){const c=CARDS[i];if(ix&&!ix[i].includes(q))continue;if(cat&&c.categorie!==cat)continue;if(lv!=='Alles'&&(lv==='Favorieten'?!f.has(c.id):c.niveau!==lv))continue;r.push(c)}
  $('#ls').innerHTML=`<div class="muted" style="margin:2px 4px 10px">${r.length} kaarten</div>${r.length?`<div class="list grid2">${r.slice(0,lim).map(c=>`<div class="li entry-li"><div class="row sp"><div class="af grow">${esc(c.af)}</div><button class="icon star sm ${f.has(c.id)?'on':''}" data-f="${c.id}" aria-label="Favoriet" aria-pressed="${f.has(c.id)}">${I.star}</button>${spk(c.af,'sm')}</div><div class="nl">${esc(c.nl)}</div><p class="ex" style="margin-top:4px">${esc(c.voorbeeld)}</p>${c.tips?`<div class="tip">${esc(c.tips)}</div>`:''}<div class="row sp meta"><span>${esc(c.categorie)}${c.own?'':' · '+c.niveau}</span>${c.own?`<button class="linkbtn" data-del="${c.id}">${I.trash}Verwijderen</button>`:`<button class="linkbtn" data-rep="${c.id}">${I.flag}Klopt niet?</button>`}</div></div>`).join('')}</div>`:'<div class="card muted">Geen kaarten gevonden. Probeer een ander woord of filter.</div>'}${r.length>lim?'<button class="btn ghost" id="mr" style="margin-top:12px">Meer laden</button>':''}`;
  const m=$('#mr');if(m)m.onclick=()=>{lim+=25;list()}};
 list();$('#cat').onchange=e=>{st.cat=e.target.value;lim=25;list()};
 let t;$('#s').oninput=e=>{clearTimeout(t);t=setTimeout(()=>{st.q=e.target.value;lim=25;list()},120)};
 $('#lv').onclick=e=>{const b=e.target.closest('[data-lv]');if(!b)return;st.lv=b.dataset.lv;for(const x of $('#lv').children)x.classList.toggle('on',x===b);lim=25;list()}};

/* ---------- paden ---------- */
const markStep=(p,i)=>{const a=S.paths[p]=S.paths[p]||[];if(!a.includes(i))a.push(i);saveNow()};
function goBack(){if(st.ret)return go('path',{p:st.ret.p});if(view==='own')return go('kaart',S.own.length?{cat:'Eigen kaarten'}:{});go(['quiz','mc','zin','reis','cult','vv','stories','gram','dlgs','luister','weak'].includes(view)?'oef':view==='story'?'stories':view==='dlg'?'dlgs':view==='les'?'gram':'home')}
function stepDone(){markStep(st.ret.p,st.ret.i);go('path',{p:st.ret.p})}
V.paden=()=>{const P=PATHS(),g=st.g||'Alles',tot=P.reduce((a,p)=>a+p.steps.length,0),dn=P.reduce((a,p)=>a+(S.paths[p.id]||[]).length,0);
 draw(`<h1>Paden</h1><p class="muted" style="margin-top:8px">Routes met uitleg, kaarten, dialogen en quizzen. ${dn} van ${tot} stappen gedaan.</p>
 <div class="chips" id="pg" style="margin-top:16px">${['Alles','Weekroute','Grammatica','Situatie','Thema','Slim'].map(x=>`<button class="chip ${g===x?'on':''}" data-pg="${x}">${x}</button>`).join('')}</div>
 <div class="list grid2" style="margin-top:14px">${P.filter(p=>g==='Alles'||p.g===g).map(p=>{const n=(S.paths[p.id]||[]).length,t=p.steps.length;
  return`<button class="li" data-p="${p.id}" style="display:block"><div class="row sp"><h2>${esc(p.title)}</h2><span class="muted" style="font-variant-numeric:tabular-nums">${n}/${t}</span></div><div class="muted" style="margin:2px 0 10px">${esc(p.desc)}</div><div class="bar"><i style="width:${n/t*100}%"></i></div></button>`}).join('')}</div>`)};
V.path=()=>{const p=PATHS().find(x=>x.id===st.p);if(!p)return go('paden');const dn=S.paths[p.id]||[],nx=p.steps.findIndex((_,i)=>!dn.includes(i)),lab={les:'Les',info:'Uitleg',category:'Kaarten',dialogue:'Dialoog',quiz:'Quiz'};
 draw(`${back('paden','Alle paden')}<h1>${esc(p.title)}</h1><p class="muted" style="margin:8px 0 14px">${esc(p.desc)}</p><div class="bar"><i style="width:${dn.length/p.steps.length*100}%"></i></div>
 <div class="steps" style="margin-top:14px">${p.steps.map((x,i)=>{const ok=dn.includes(i);
  const sub=x.type==='info'?esc(x.text):lab[x.type]+(x.type==='quiz'?' · '+(x.count||10)+' vragen':x.type==='category'?' · '+esc(x.cat):x.type==='dialogue'?' · '+esc(x.dialogueTitle):x.type==='les'?' · uitleg en oefeningen':'');
  return`<button class="step ${i===nx?'next':''}" data-step="${i}"><span class="dot ${ok?'ok':''}">${ok?I.check:i+1}</span><span class="stx"><h2>${esc(x.title)}${i===nx?'<span class="pill">Volgende</span>':''}</h2><span class="muted">${sub}</span></span></button>`}).join('')}</div>`)};
function runStep(pid,i){const p=PATHS().find(x=>x.id===pid),x=p.steps[i],ret={p:pid,i};
 S.lp=pid;save();if(x.type==='info'){markStep(pid,i);return V.path()}
 if(x.type==='les')return go('les',{l:x.les,ret});
 if(x.type==='dialogue')return go('dlg',{t:x.dialogueTitle,ret});
 if(x.type==='quiz')return go('quiz',{pool:poolFor(x.scope),n:x.count||10,audio:!!x.audioFirst,ret});
 const all=(BYCAT().get(x.cat)||[]).slice().sort((a,b)=>(isDue(b.id)?1:0)-(isDue(a.id)?1:0)||(S.srs[a.id]?1:0)-(S.srs[b.id]?1:0)||rank[a.niveau]-rank[b.niveau]);
 go('sess',{q:shuffle(all.slice(0,12)),ret})}

/* ---------- dialogen ---------- */
V.dlgs=()=>{const D=DLG(),nd=D.filter(d=>S.dlg[d.title]).length;
 draw(`${back('oef','Oefenen')}<div class="row sp"><h1>Dialogen</h1></div><p class="muted" style="margin:8px 0 16px">${nd} van ${D.length} gedaan</p>
 <div class="list">${D.map(d=>row(`data-t="${esc(d.title)}"`,null,esc(d.title),d.lines.length+' regels',S.dlg[d.title]?mark(1):undefined)).join('')}</div>`)};
V.dlg=()=>{const d=DLG().find(x=>x.title===st.t);if(!d)return go('dlgs');st.m=st.m||'lees';st.tr=st.tr!==false;st.rev=st.rev||{};
 draw(`<div class="row sp">${back('back','Terug')}<button class="chip" data-play="1" style="margin-top:-14px">${I.spk}Alles luisteren</button></div><h1>${esc(d.title)}</h1>
 <div class="chips" style="margin:16px 0"><span class="seg" style="flex:1"><button class="chip ${st.m==='lees'?'on':''}" data-m="lees">Lezen</button><button class="chip ${st.m==='rol'?'on':''}" data-m="rol">Rol spelen</button></span>${st.m==='lees'?`<button class="chip ${st.tr?'on':''}" data-tr="1">Vertaling</button>`:''}</div>
 ${st.m==='rol'?'<p class="muted" style="margin-bottom:12px">Jij bent de tweede persoon. Bedenk eerst je antwoord en tik dan om het te zien.</p>':''}
 <div class="stack">${d.lines.map((l,i)=>{const me=i%2===1;
  return st.m==='rol'&&me&&!st.rev[i]?`<div class="bub me"><button class="btn soft" style="min-height:44px" data-rev="${i}">Jouw beurt: tik om te zien</button></div>`
  :`<div class="bub ${me?'me':''}"><div class="row sp" style="align-items:flex-start"><div class="af">${esc(l.af)}</div>${spk(l.af,'sm')}</div>${st.m==='rol'||st.tr?`<div class="nl" style="margin-top:4px;font-size:.92rem">${esc(l.nl)}</div>`:''}</div>`}).join('')}</div>
 <button class="btn" data-fin="1" style="margin-top:22px">Klaar met dit gesprek</button>`)};

/* ---------- grammatica ---------- */
V.gram=()=>{const A=LES(),dn=A.filter(l=>S.les[l.id]!==undefined).length;
 draw(`${back('oef','Oefenen')}<h1>Grammatica</h1><p class="muted" style="margin:8px 0 16px">${dn} van ${A.length} gedaan. Voor een vaste volgorde: het pad "Grammatica A–Z".</p>
 <div class="list">${A.map(l=>row(`data-les="${l.id}"`,null,esc(l.t),S.les[l.id]!==undefined?'Beste score: '+S.les[l.id]+' / '+l.q.length:l.q.length+' oefenvragen',S.les[l.id]!==undefined?mark(1):undefined)).join('')}</div>`)};
V.les=()=>{const l=LES().find(x=>x.id===st.l);if(!l)return go('gram');
 if(st.n===undefined){draw(`${back('back','Terug')}<h1>${esc(l.t)}</h1><div class="card" style="margin-top:16px;line-height:1.6">${esc(l.rule)}</div>
  <div class="sec">Voorbeelden</div><div class="list">${l.ex.map(e=>`<div class="li"><span class="grow"><span class="af" style="font-size:1.12rem;display:block">${esc(e[0])}</span><span class="nl">${esc(e[1])}</span></span>${spk(e[0],'sm')}</div>`).join('')}</div>
  <button class="btn" data-ls="1" style="margin-top:20px">Oefenen (${l.q.length} vragen)</button>`);return}
 const q=l.q[st.n];
 if(!q){S.les[l.id]=Math.max(S.les[l.id]||0,st.sc);saveNow();result(st.sc,l.q.length,st.sc===l.q.length?'Foutloos!':'Lees de uitleg nog eens en probeer opnieuw.',(st.ret?'<button class="btn" data-a="stepdone">Verder met het pad</button>':'<button class="btn" data-a="gram">Terug naar lessen</button>')+'<button class="btn ghost" data-ls="1">Opnieuw oefenen</button>');return}
 if(!st.o||st.oi!==st.n){st.o=shuffle(q[1].map((_,i)=>i));st.oi=st.n}
 draw(`${topbar(st.n,l.q.length)}<div class="card q"><div class="lbl">Kies de juiste Afrikaanse zin</div><div class="big" style="font-size:1.4rem">${esc(q[0])}</div></div>
 <div class="stack" style="margin-top:14px">${st.o.map(i=>`<button class="opt" data-lo="${i}">${esc(q[1][i])}</button>`).join('')}</div>`)};

/* ---------- meerkeuze-oefeningen ---------- */
const MCT={slang:'Slang',nie:'Nie-drill',menu:'Restaurant',wa:'WhatsApp',vv:'Valse vrienden'};
function vvBuild(){const VV=Y().VV;return shuffle(VV.map((v,i)=>{const others=shuffle(VV.filter((_,j)=>j!==i)).slice(0,2).map(o=>o.echt);
 return{q:v.ex[0],sub:'Wat betekent "'+v.af+'" in deze zin?',opts:[v.echt,v.schijn].concat(others),a:0,ex:v.ex[1]+' — '+v.tip,say:v.ex[0]}})).slice(0,10)}
function mcBuild(k){const x=X();let it;
 if(k==='slang')it=x.SL.map(x=>({q:x.af,sub:'Wat betekent dit?',opts:x.opts,a:x.a,ex:x.expl,say:x.af}));
 else if(k==='nie')it=x.NIE.map(x=>({q:x.nl,sub:'Kies de juiste Afrikaanse zin',opts:x.opts,a:x.a,ex:x.expl,afopts:1}));
 else if(k==='menu')it=x.MENU.map(x=>({head:x.title,menu:x.items,q:x.q,sub:'Wat zeg je?',opts:x.opts,a:x.a,ex:'',afopts:1}));
 else if(k==='vv')it=vvBuild();
 else it=x.WA.map(w=>({head:w.emoji+' '+w.contact,q:w.messages[0].t,tr:w.messages[0].nl,opts:w.choices.map(c=>c.t),a:w.choices.findIndex(c=>c.ok),ex:w.choices.map(c=>c.exp+' ('+c.nl+')'),follow:w.follow,say:w.messages[0].t,chat:1,afopts:1}));
 return shuffle(it).slice(0,10)}
V.mc=()=>{const T=MCT[st.kind];if(!T)return go('oef');
 if(!st.items){st.items=mcBuild(st.kind);st.i=0;st.sc=0;st.pick=null;st.perm=null}
 const u=st.items[st.i],n=st.items.length;
 if(!u){result(st.sc,n,praise(st.sc,n),`<button class="btn" data-a="mc:${st.kind}">Nog een ronde</button><button class="btn ghost" data-a="oef">Terug naar oefenen</button>`);return}
 if(!st.perm)st.perm=shuffle(u.opts.map((_,i)=>i));
 const done=st.pick!==null,exv=done?(Array.isArray(u.ex)?u.ex[st.pick]:u.ex):'';
 const qtxt=st.kind==='nie'||st.kind==='menu'?`<div class="big" style="font-size:1.35rem">${esc(u.q)}</div>`:`<div class="${u.chat?'':'big '}af" style="font-size:${u.chat?'1.2rem':'1.6rem'}">${esc(u.q)}</div>`;
 draw(`${topbar(st.i,n,'oef')}
 ${u.head?`<div class="lbl" style="margin:0 4px 8px">${esc(u.head)}</div>`:''}
 ${u.menu?`<div class="card" style="margin-bottom:12px">${u.menu.map(m=>`<div class="mrow"><span class="af" style="font-weight:500">${esc(m[0])}</span><b>${esc(m[1])}</b></div>`).join('')}</div>`:''}
 <div class="${u.chat?'bub':'card q'}"><div class="row ${u.chat?'sp':''}" style="${u.chat?'align-items:flex-start':'justify-content:center'}">${qtxt}${u.say?spk(u.say,'sm'):''}</div>${u.sub?`<div class="muted" style="margin-top:8px">${esc(u.sub)}</div>`:''}${u.tr&&done?`<div class="nl" style="margin-top:6px">${esc(u.tr)}</div>`:''}</div>
 <div class="stack" id="op" style="margin-top:14px">${st.perm.map(i=>`<button class="opt ${u.afopts?'af-opt':''} ${done?(i===u.a?'ok':i===st.pick?'bad':''):''}" data-oi="${i}" ${done?'disabled':''}>${esc(u.opts[i])}</button>`).join('')}</div>
 ${done?`<div class="stack" style="margin-top:14px">${exv?`<div class="tip">${esc(exv)}</div>`:''}${u.follow&&st.pick===u.a?`<div class="bub"><div class="af">${esc(u.follow.t)}</div><div class="nl">${esc(u.follow.nl)}</div></div>`:''}<button class="btn" id="nx">${st.i+1<n?'Volgende':'Klaar'}</button></div>`:''}`);
 if(!done)$('#op').onclick=e=>{const b=e.target.closest('.opt');if(!b)return;st.pick=+b.dataset.oi;if(st.pick===u.a){st.sc++;count()}else buzz('bad');V.mc()};
 else $('#nx').onclick=()=>{st.i++;st.pick=null;st.perm=null;V.mc();scrollTo(0,0)}};

/* ---------- zinnen bouwen ---------- */
V.zin=()=>{const BS=X().BS;
 if(!st.items){const lv=st.zl||'Alles',f={Alles:()=>1,Kort:b=>b.af.length<=4,Middel:b=>b.af.length===5,Lang:b=>b.af.length>=6}[lv];
  if(!st.go){st.zl=lv;draw(`${back('oef','Oefenen')}<h1>Zinnen bouwen</h1><p class="muted" style="margin:8px 0 16px">Tik de Afrikaanse woorden in de goede volgorde. De plaats van het werkwoord en van 'nie' zijn het lastigst.</p><div class="seg" id="zl">${['Alles','Kort','Middel','Lang'].map(l=>`<button class="chip ${lv===l?'on':''}" data-l="${l}">${l}</button>`).join('')}</div><button class="btn" id="zs" style="margin-top:16px">Start met 10 zinnen</button>`);
   $('#zl').onclick=e=>{const b=e.target.closest('[data-l]');if(b){st.zl=b.dataset.l;V.zin()}};$('#zs').onclick=()=>{st.go=1;V.zin()};return}
  st.items=shuffle(BS.filter(f)).slice(0,10);st.i=0;st.sc=0;st.t=null}
 const u=st.items[st.i],n=st.items.length;
 if(!u){result(st.sc,n,praise(st.sc,n),'<button class="btn" data-a="zin">Nog een ronde</button><button class="btn ghost" data-a="oef">Terug naar oefenen</button>');return}
 if(!st.t){st.t=shuffle(u.af.map((w,i)=>i));st.a=[];st.res=null}
 const bank=st.t.filter(i=>!st.a.includes(i)),sent=st.a.map(i=>u.af[i]).join(' ');
 draw(`${topbar(st.i,n,'oef')}<div class="card q"><div class="lbl">Vertaal naar het Afrikaans</div><div class="big" style="font-size:1.4rem">${esc(u.nl)}</div></div>
 <div class="card zin-area" id="za" style="margin-top:12px">${st.a.map(i=>`<button class="chip on" data-i="${i}" ${st.res?'disabled':''}>${esc(u.af[i])}</button>`).join('')||'<span class="muted">Tik hieronder de woorden aan</span>'}</div>
 ${st.res?`<div class="tip" style="margin-top:12px;${st.res==='ok'?'':'background:color-mix(in srgb,var(--bad) 12%,var(--surface))'}">${st.res==='ok'?'Goed!':'Niet helemaal. De standaardzin is: <b class="af">'+esc(u.af.join(' '))+'</b><br><span class="muted">Soms kan een andere volgorde ook.</span>'}</div><div class="row" style="margin-top:12px">${spk(u.af.join(' '))}<button class="btn" id="zn">${st.i+1<n?'Volgende':'Klaar'}</button></div>`
 :`<div class="chips wrap" id="zb" style="margin-top:14px">${bank.map(i=>`<button class="chip" data-i="${i}" style="font-family:var(--serif);font-size:1rem">${esc(u.af[i])}</button>`).join('')}</div><div class="row" style="margin-top:16px"><button class="btn ghost" id="zw">Wissen</button><button class="btn" id="zc" ${bank.length?'disabled':''}>Controleer</button></div>`}`);
 if(st.res){$('#zn').onclick=()=>{st.i++;st.t=null;V.zin();scrollTo(0,0)};return}
 $('#zb').onclick=e=>{const b=e.target.closest('[data-i]');if(b){st.a.push(+b.dataset.i);V.zin()}};
 $('#za').onclick=e=>{const b=e.target.closest('[data-i]');if(b){st.a.splice(st.a.indexOf(+b.dataset.i),1);V.zin()}};
 $('#zw').onclick=()=>{st.a=[];V.zin()};
 $('#zc').onclick=()=>{if(bank.length)return;const ok=nzs(sent)===nzs(u.af.join(' '));st.res=ok?'ok':'bad';if(ok){st.sc++;count()}else buzz('bad');V.zin()}};

/* ---------- reisgids en cultuur ---------- */
V.reis=()=>{const R=X().REIS;
 draw(`${back('oef','Oefenen')}<h1>Reisgids</h1><p class="muted" style="margin:8px 0 16px">Handige zinnen voor onderweg, met uitspraak.</p><input type="search" id="rq" placeholder="Zoek een zin" aria-label="Zoeken" value="${esc(st.q||'')}"><div class="list" id="rl" style="margin-top:12px"></div>`);
 const d=()=>{const q=norm($('#rq').value.trim());const h=R.filter(r=>!q||norm(r.nl+' '+r.af).includes(q)).map(r=>`<div class="li"><span class="grow"><span class="af" style="font-size:1.12rem;display:block">${esc(r.af)}</span><span class="nl">${esc(r.nl)}</span></span>${spk(r.af,'sm')}</div>`).join('');$('#rl').innerHTML=h||'<div class="li muted">Niets gevonden.</div>'};
 d();$('#rq').oninput=d};
V.cult=()=>{st.tab=st.tab||'weetjes';const x=X();let body='';
 if(st.tab==='weetjes')body=`<div class="stack">${FACTS().map(f=>`<div class="card"><div class="lbl">${esc(f.s)}</div><p style="margin-top:6px">${esc(f.t)}</p>${f.url?`<a href="${esc(f.url)}" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;color:var(--nl);font-weight:600">Lees meer</a>`:''}</div>`).join('')}</div>`;
 else if(st.tab==='za')body=`<div class="stack">${x.ZA.map(z=>`<div class="card"><p class="af" style="font-size:1.08rem;font-weight:500;line-height:1.5">${esc(z.fact)}</p><div class="chips wrap" style="margin-top:12px">${z.words.map(w=>`<button class="chip" data-sp="${esc(w.af)}">${I.spk}<span class="af">${esc(w.af)}</span><span class="nl">${esc(w.nl)}</span></button>`).join('')}</div></div>`).join('')}</div>`;
 else body=`<div class="list">${Object.entries(x.CULT).sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>`<div class="li" style="align-items:flex-start"><span class="grow"><span class="af" style="font-size:1.15rem;display:block">${esc(k)}</span><span class="muted">${esc(v)}</span></span>${spk(k,'sm')}</div>`).join('')}</div>`;
 draw(`${back('oef','Oefenen')}<h1>Cultuur</h1><div class="seg" id="ct" style="margin:16px 0">${[['weetjes','Weetjes'],['za','ZA vandaag'],['termen','Lokale woorden']].map(t=>`<button class="chip ${st.tab===t[0]?'on':''}" data-ct="${t[0]}">${t[1]}</button>`).join('')}</div>${body}`);
 $('#ct').onclick=e=>{const b=e.target.closest('[data-ct]');if(b){st.tab=b.dataset.ct;V.cult()}}};

/* ---------- valse vrienden ---------- */
V.vv=()=>{const VV=Y().VV;
 draw(`${back('oef','Oefenen')}<h1>Valse vrienden</h1><p class="muted" style="margin:8px 0 16px">Woorden die op Nederlands lijken, maar in het Afrikaans iets anders betekenen.</p><button class="btn" data-a="mc:vv">Oefen met 10 vragen</button>
 <div class="stack" style="margin-top:16px">${VV.map(v=>`<div class="card vv"><div class="row sp"><div class="af">${esc(v.af)}</div>${spk(v.af,'sm')}</div>
 <div class="pair"><div><div class="lbl">Je denkt</div><div class="strike">${esc(v.schijn)}</div></div><div><div class="lbl">Het betekent</div><div style="font-weight:650">${esc(v.echt)}</div></div></div>
 <div class="bub"><div class="af">${esc(v.ex[0])}</div><div class="nl" style="font-size:.92rem">${esc(v.ex[1])}</div></div><p class="muted" style="margin-top:10px">${esc(v.tip)}</p></div>`).join('')}</div>`)};

/* ---------- verhaaltjes ---------- */
V.stories=()=>{const ST=Y().ST,n=ST.filter(x=>S.stories[x.id]).length;
 draw(`${back('oef','Oefenen')}<h1>Verhaaltjes</h1><p class="muted" style="margin:8px 0 16px">${n} van ${ST.length} gelezen</p>
 <div class="list">${ST.map(x=>row(`data-story="${x.id}"`,null,esc(x.t),x.niv+' · '+x.s.length+' zinnen',S.stories[x.id]?mark(1):undefined)).join('')}</div>`)};
const CG=L(()=>{const m=new Map(),bad=new Set();for(const c of CARDS){const k=c.af.toLowerCase();if(!/^\p{L}+$/u.test(k))continue;const v=m.get(k);if(v!==undefined&&v!==c.nl)bad.add(k);else m.set(k,c.nl)}bad.forEach(k=>m.delete(k));return m});
const wordRe=/('n(?!\p{L})|\p{L}+(?:['’-]\p{L}+)*)/gu;
function gloss(w,x){const k=w.toLowerCase();return k==="'n"?'een':x.g[k]||Y().G0[k]||CG().get(k)||null}
V.story=()=>{const x=Y().ST.find(z=>z.id===st.id);if(!x)return go('stories');
 const html=x.s.map(p=>`<p>${p[0].split(wordRe).map((t,j)=>j%2?`<span class="w" data-w="${esc(t)}">${esc(t)}</span>`:esc(t)).join('')}${spk(p[0],'sm')}${st.tr?`<span class="nl">${esc(p[1])}</span>`:''}</p>`).join('');
 draw(`<div class="row sp">${back('back','Verhaaltjes')}<button class="chip ${st.tr?'on':''}" id="tt" style="margin-top:-14px">Vertaling</button></div><h1>${esc(x.t)}</h1><p class="muted" style="margin:8px 0 16px">${x.niv} · tik op een woord voor de vertaling</p>
 <div class="card reader">${html}</div>
 <div class="row" style="margin:16px 0 120px"><button class="btn soft" id="pl">${I.spk}Voorlezen</button><button class="btn" id="fin">${S.stories[x.id]?'Opnieuw gelezen':'Klaar met lezen'}</button></div><div id="wp" role="status"></div>`);
 $('#tt').onclick=()=>{st.tr=!st.tr;V.story()};
 $('#pl').onclick=()=>speakAll(x.s.map(p=>p[0]));
 $('#fin').onclick=()=>{if(!S.stories[x.id]){S.stories[x.id]=1;count()}saveNow();go('stories')}};
function storyWord(w){const x=Y().ST.find(z=>z.id===st.id);for(const z of app.querySelectorAll('.w.on'))z.classList.remove('on');w.classList.add('on');
 const t=w.dataset.w,g=gloss(t,x),p=$('#wp');p.style.display='block';
 p.innerHTML=`<div class="row sp"><div class="grow"><div class="af" style="font-size:1.25rem">${esc(t)}</div><div>${g?esc(g):'<span class="muted">Geen vertaling bekend. Zet "Vertaling" aan.</span>'}</div></div>${spk(t)}</div>`}

/* ---------- oude voortgang ---------- */
async function importOld(){await load('ext');let srs,favs;try{srs=JSON.parse(localStorage.getItem('af_srs')||'null');favs=JSON.parse(localStorage.getItem('af_favs')||'null')}catch{}
 const DUP=X().DUP,m=byId(),rs=id=>{let n=0;id=+id;while(DUP[id]!==undefined&&n++<8)id=DUP[id];return m.has(id)?id:null};let a=0,b=0;
 if(srs&&typeof srs==='object')for(const[k,r]of Object.entries(srs)){const id=rs(k);if(id===null||!r)continue;const iv=+r.interval||0,box=iv<=0?0:iv<=1?1:iv<=3?2:iv<=7?3:iv<=14?4:iv<=30?5:6,old=S.srs[id];
  if(!old||old.box<box){S.srs[id]={box,due:+r.due>1e11?+r.due:Date.now(),t:Date.now()};a++}}
 if(Array.isArray(favs))for(const k of favs){const id=rs(k);if(id!==null&&!S.favs.includes(id)){S.favs.push(id);b++}}
 saveNow();return[a,b]}

/* ---------- moeilijke kaarten ---------- */
function weakList(){const m=byId(),out=[];for(const k in S.srs){const r=S.srs[k];if(r.box<=1&&r.t){const c=m.get(+k);if(c)out.push([c,r.t])}}return out.sort((a,b)=>b[1]-a[1]).map(x=>x[0])}
V.weak=()=>{const w=weakList();if(!w.length){draw(`${back('oef','Oefenen')}<h1>Moeilijke kaarten</h1><div class="card" style="margin-top:16px"><p>Je hebt nog geen moeilijke kaarten. Kaarten die je fout hebt in een sessie of quiz komen hier vanzelf terecht.</p></div><button class="btn" data-a="sess" style="margin-top:16px">Start een gewone sessie</button>`);return}
 go('sess',{q:shuffle(w.slice(0,20))})};

/* ---------- luisteren ---------- */
const LPOOL=L(()=>{const a=[],seen=new Set();const add=(af,nl)=>{const w=af.split(/\s+/).length;if(w<2||w>9||seen.has(af))return;seen.add(af);a.push({af,nl})};
 X().REIS.forEach(r=>add(r.af,r.nl));DLG().forEach(d=>d.lines.forEach(l=>add(l.af,l.nl)));return a});
function wordDiff(typed,goal){const T=nzs(typed).split(' ').filter(Boolean),G=goal.split(/\s+/);let ok=0;
 const html=G.map((g,i)=>{const good=T[i]!==undefined&&T[i]===nzs(g);if(good)ok++;return`<span class="${good?'okw':'badw'}">${esc(g)}</span>`}).join(' ');return{ok:ok===G.length&&T.length===G.length,html}}
V.luister=()=>{
 if(!st.items){if(!st.go){draw(`${back('oef','Oefenen')}<h1>Luisteren</h1><p class="muted" style="margin:8px 0 16px">Je hoort een Afrikaanse zin. Typ wat je hoort. Hoofdletters en leestekens tellen niet mee.</p>${canSpeak()?'':'<div class="tip">Je toestel heeft geen spraakfunctie, dus deze oefening werkt hier niet.</div>'}<div class="card muted">Tip: werkt de uitspraak niet goed? Zet in je telefoon bij Tekst-naar-spraak een Afrikaanse of Nederlandse stem aan. In Meer kun je de spraaksnelheid instellen.</div><button class="btn" id="lgo" style="margin-top:16px" ${canSpeak()?'':'disabled'}>Start met 10 zinnen</button>`);$('#lgo').onclick=()=>{st.go=1;V.luister()};return}
  st.items=shuffle(LPOOL()).slice(0,10);st.i=0;st.sc=0;st.res=null}
 const u=st.items[st.i],n=st.items.length;
 if(!u){result(st.sc,n,praise(st.sc,n),'<button class="btn" data-a="luister">Nog een ronde</button><button class="btn ghost" data-a="oef">Terug naar oefenen</button>');return}
 const r=st.res;
 draw(`${topbar(st.i,n,'oef')}<div class="card q"><div class="lbl">Luister en typ</div><div class="row" style="justify-content:center;gap:14px;margin-top:12px"><button class="icon" style="width:72px;height:72px" id="lp" aria-label="Afspelen">${I.spk}</button><button class="chip" id="ls2">Langzaam</button></div></div>
 ${r?`<div class="card stack" style="margin-top:12px"><div class="lbl">${r.ok?'Helemaal goed!':'Zo moest het:'}</div><div class="af" style="font-size:1.2rem;line-height:1.6">${r.html}</div><div class="nl">${esc(u.nl)}</div>${r.ok?'':`<div class="muted">Jij typte: ${esc(r.typed)||'(niets)'}</div>`}</div><button class="btn" id="ln" style="margin-top:12px">${st.i+1<n?'Volgende':'Klaar'}</button>`
 :`<form id="lf" style="margin-top:12px"><input type="text" id="la" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Typ wat je hoort" aria-label="Wat hoor je?"><div class="row" style="margin-top:10px"><button type="button" class="btn ghost" id="lsk">Weet ik niet</button><button class="btn" type="submit">Controleer</button></div></form>`}`);
 $('#lp').onclick=()=>speak(u.af);$('#ls2').onclick=()=>speak(u.af,.6);
 if(r){$('#ln').onclick=()=>{st.i++;st.res=null;V.luister();scrollTo(0,0)};return}
 const check=v=>{const d=wordDiff(v,u.af);st.res={ok:d.ok,html:d.html,typed:v.trim()};if(d.ok){st.sc++;count()}else buzz('bad');V.luister()};
 $('#lf').onsubmit=e=>{e.preventDefault();check($('#la').value)};$('#lsk').onclick=()=>check('');
 if(!st.played){st.played=st.i+1;setTimeout(()=>speak(u.af),250)}else if(st.played!==st.i+1){st.played=st.i+1;setTimeout(()=>speak(u.af),250)}
 requestAnimationFrame(()=>{const t=$('#la');t&&t.focus()})};

/* ---------- niveautoets ---------- */
V.toets=()=>{
 if(!st.items){const pick=lv=>shuffle(CARDS.filter(c=>!c.own&&c.niveau===lv&&okWord2(c))).slice(0,4).map(c=>({c,lv}));
  st.items=[...pick('Beginner'),...pick('Intermediate'),...pick('Advanced')];st.i=0;st.res={Beginner:0,Intermediate:0,Advanced:0};st.ans=null}
 const it=st.items[st.i],n=st.items.length;
 if(!it){const R=st.res,lv=R.Beginner<3?'Beginner':R.Intermediate<3?'Intermediate':'Advanced',nm={Beginner:'Beginner',Intermediate:'Intermediate',Advanced:'Advanced'};
  S.startLv=lv;S.lvDone=true;ORDER.reset();saveNow();
  draw(`<div class="result stack"><div class="score" style="font-size:2.6rem">${nm[lv]}</div><h1>Hier begin je</h1><p class="muted">Beginner ${R.Beginner}/4 · Intermediate ${R.Intermediate}/4 · Advanced ${R.Advanced}/4</p><p class="muted">${lv==='Beginner'?'We beginnen bij de basis.':lv==='Intermediate'?'Je kent de basis al. Nieuwe kaarten beginnen bij Intermediate.':'Je kent de basis en Intermediate al. Nieuwe kaarten beginnen bij Advanced.'} Je kunt dit altijd aanpassen in Meer.</p><div class="stack" style="margin-top:22px"><button class="btn" data-a="sess">Start je sessie</button><button class="btn ghost" data-a="home">Home</button></div></div>`);return}
 const c=it.c;if(!st.cur||st.cur.id!==c.id){const same=CARDS.filter(x=>!x.own&&x.niveau===it.lv&&x.id!==c.id&&x.af!==c.af),opts=[];for(const x of shuffle(same)){if(!opts.includes(x.af))opts.push(x.af);if(opts.length===3)break}st.cur={id:c.id,opts:shuffle(opts.concat(c.af))}}
 draw(`${topbar(st.i,n,'home')}<div class="card q"><div class="lbl">Wat is dit in het Afrikaans?</div><div class="big">${esc(c.nl)}</div></div>
 <div class="stack" id="op" style="margin-top:14px">${st.cur.opts.map(o=>`<button class="opt af-opt" data-o="${esc(o)}">${esc(o)}</button>`).join('')}<button class="btn ghost" id="tdk">Weet ik niet</button></div>`);
 const next=ok=>{if(ok)st.res[it.lv]++;setTimeout(()=>{st.i++;st.cur=null;st.ans=null;V.toets()},ok?500:900)};
 $('#op').onclick=e=>{const b=e.target.closest('.opt');if(!b||st.ans)return;st.ans=1;const ok=b.dataset.o===c.af;for(const x of $('#op').querySelectorAll('.opt')){if(x.dataset.o===c.af)x.classList.add('ok');x.disabled=true}if(!ok)b.classList.add('bad');next(ok)};
 $('#tdk').onclick=()=>{if(st.ans)return;st.ans=1;next(false)}};
const okWord2=c=>c.nl.toLowerCase()!==c.af.toLowerCase()&&c.af.length<=30;

/* ---------- eigen kaarten ---------- */
const resetCards=()=>{[byId,IDX,BYCAT,ORDER].forEach(f=>f.reset());CG.reset()};
V.own=()=>{draw(`${back('back','Kaarten')}<h1>Eigen kaart</h1><p class="muted" style="margin:8px 0 16px">Voeg een woord of zin toe. Hij komt in je dagelijkse sessie als eerstvolgende nieuwe kaart.</p>
 <form id="of" class="stack"><label class="lbl" for="onl">Nederlands</label><input type="text" id="onl" required maxlength="120" autocomplete="off" placeholder="bijvoorbeeld: stoplicht">
 <label class="lbl" for="oaf">Afrikaans</label><input type="text" id="oaf" required maxlength="120" autocomplete="off" autocapitalize="off" placeholder="bijvoorbeeld: robot">
 <label class="lbl" for="ovb">Voorbeeldzin (mag leeg)</label><input type="text" id="ovb" maxlength="300" autocomplete="off" placeholder="bijvoorbeeld: Draai links by die robot.">
 <button class="btn" type="submit">Opslaan</button><p class="muted" id="om" role="status"></p></form>`);
 $('#of').onsubmit=e=>{e.preventDefault();const nl=$('#onl').value.trim(),af=$('#oaf').value.trim(),vb=$('#ovb').value.trim();if(!nl||!af){$('#om').textContent='Vul Nederlands en Afrikaans in.';return}
  let id=-Date.now();for(const o of S.own)if(o.id===id)id--;const o={id,nl,af,vb};S.own.push(o);CARDS.push(ownCard(o));resetCards();saveNow();
  $('#om').textContent='Opgeslagen: '+af+'.';$('#onl').value='';$('#oaf').value='';$('#ovb').value='';$('#onl').focus()}};
function delOwn(id){const c=byId().get(id);if(!c||!confirm('Eigen kaart "'+c.af+'" verwijderen?'))return;S.own=S.own.filter(o=>o.id!==id);delete S.srs[id];S.favs=S.favs.filter(x=>x!==id);
 const i=CARDS.findIndex(x=>x.id===id);if(i>=0)CARDS.splice(i,1);resetCards();saveNow();V.kaart()}

/* ---------- melden ---------- */
function reportText(){return S.reports.map(r=>`${r.af} = ${r.nl} (kaart ${r.id}): ${r.note||'geen toelichting'}`).join('\n')}
function sheet(html,onOpen){let el=document.getElementById('sheet');if(el)el.remove();el=document.createElement('div');el.id='sheet';el.innerHTML=`<div class="sheet-bg" data-close="1"></div><div class="sheet" role="dialog" aria-modal="true">${html}</div>`;document.body.appendChild(el);
 el.addEventListener('click',e=>{if(e.target.closest('[data-close]'))el.remove()});onOpen&&onOpen(el)}
function report(id){const c=byId().get(id);if(!c)return;
 sheet(`<h2>Klopt deze kaart niet?</h2><p style="margin:10px 0 4px"><span class="af" style="font-size:1.15rem">${esc(c.af)}</span> <span class="nl">= ${esc(c.nl)}</span></p><p class="muted" style="margin-bottom:12px">Beschrijf kort wat er niet klopt. Je melding blijft op dit toestel; in Meer kun je alle meldingen kopiëren.</p>
 <textarea id="rn" maxlength="500" placeholder="Bijvoorbeeld: de voorbeeldzin is onnatuurlijk" aria-label="Toelichting"></textarea><div class="row" style="margin-top:12px"><button class="btn ghost" data-close="1">Annuleren</button><button class="btn" id="rsv">Melden</button></div>`,el=>{
  setTimeout(()=>el.querySelector('#rn').focus(),50);
  el.querySelector('#rsv').onclick=()=>{S.reports=S.reports.filter(r=>r.id!==id);S.reports.push({id,af:c.af,nl:c.nl,note:el.querySelector('#rn').value.trim(),t:Date.now()});saveNow();
   el.querySelector('.sheet').innerHTML='<h2>Bedankt!</h2><p class="muted" style="margin:8px 0 14px">Je melding is opgeslagen. Je vindt hem in Meer.</p><button class="btn" data-close="1">Sluiten</button>'}})}

/* ---------- sessie: beoordelen en vegen ---------- */
function sessGrade(ok){const c=st.q[st.i];grade(c.id,ok);if(!ok)buzz('bad');st.done++;if(!ok&&!st.retry.includes(c.id)){st.retry.push(c.id);st.q.push(c)}st.i++;st.open=false;st.tv=undefined;render()}
let drag=null;
document.addEventListener('pointerdown',e=>{if(view!=='sess'||!st.open)return;const fc=e.target.closest('#fc');if(!fc||e.target.closest('button,a,input'))return;drag={x:e.clientX,y:e.clientY,el:fc,dx:0,tick:0};fc.style.transition='none'});
document.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dx)<12)return;drag.dx=dx;
 drag.el.style.transform=`translateX(${dx}px) rotate(${dx/22}deg)`;drag.el.classList.toggle('sw-ok',dx>60);drag.el.classList.toggle('sw-no',dx<-60);
 const past=Math.abs(dx)>90;if(past&&!drag.tick){drag.tick=1;buzz('ok')}else if(!past)drag.tick=0});
const endDrag=()=>{if(!drag)return;const{dx,el}=drag;drag=null;el.style.transition='transform .22s ease';
 if(Math.abs(dx)>90){el.style.transform=`translateX(${dx>0?520:-520}px) rotate(${dx>0?18:-18}deg)`;setTimeout(()=>sessGrade(dx>0),180)}
 else{el.style.transform='';el.classList.remove('sw-ok','sw-no')}};
document.addEventListener('pointerup',endDrag);document.addEventListener('pointercancel',endDrag);

/* ---------- voortgangskalender ---------- */
function longestStreak(){const ds=Object.keys(S.days).filter(k=>S.days[k]>0).sort();let best=0,cur=0,prev=null;
 for(const k of ds){const t=new Date(k+'T12:00:00').getTime();cur=prev!==null&&Math.round((t-prev)/DAY)===1?cur+1:1;best=Math.max(best,cur);prev=t}return best}
function calendar(){const W=26,g=S.goal,today=new Date();today.setHours(12,0,0,0);const dow=(today.getDay()+6)%7,start=new Date(today.getTime()-(dow+7*(W-1))*DAY);
 const md=['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'],wd=['ma','di','wo','do','vr','za','zo'];let cells='',active=0,total=0,months='';
 for(const k in S.days){if(S.days[k]>0){active++;total+=S.days[k]}}
 for(let w=0;w<W;w++){const first=new Date(start.getTime()+w*7*DAY);months+=`<span>${first.getDate()<=7?md[first.getMonth()]:''}</span>`;
  for(let d=0;d<7;d++){const dt=new Date(start.getTime()+(w*7+d)*DAY);if(dt>today){cells+='<i class="fut"></i>';continue}
   const n=S.days[fmt(dt)]||0,l=!n?0:n<g/2?1:n<g?2:3;cells+=`<i class="l${l}" title="${wd[d]} ${dt.getDate()} ${md[dt.getMonth()]}: ${n} ${n===1?'kaart':'kaarten'}"></i>`}}
 return`<div class="cal-stats"><div><div class="big">${streak()}</div><div class="muted">dagen op rij</div></div><div><div class="big">${longestStreak()}</div><div class="muted">langste reeks</div></div><div><div class="big">${active}</div><div class="muted">actieve dagen</div></div></div>
 <div class="cal" id="cal"><div class="cal-m" style="grid-template-columns:repeat(${W},var(--c))">${months}</div><div class="cal-g" style="grid-template-columns:repeat(${W},var(--c))" role="img" aria-label="Kalender van de laatste ${W} weken: ${active} actieve dagen">${cells}</div></div>
 <div class="cal-leg muted"><span>Minder</span><i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><span>Doel gehaald</span></div>`}

/* ---------- overal zoeken ---------- */
const SIDX=L(()=>{const a=[],add=(t,title,sub,go,extra='')=>a.push({t,title,sub,go,k:norm(title+' '+sub+' '+extra)});
 DLG().forEach(d=>d.lines.forEach(l=>add('Dialogen',l.af,d.title+' · '+l.nl,['dlg',{t:d.title}])));
 Y().ST.forEach(x=>x.s.forEach(p=>add('Verhaaltjes',p[0],x.t+' · '+p[1],['story',{id:x.id}])));
 LES().forEach(l=>add('Grammatica',l.t,l.rule.slice(0,90)+'…',['les',{l:l.id}],l.rule+' '+l.ex.map(e=>e.join(' ')).join(' ')));
 Y().VV.forEach(v=>add('Valse vrienden',v.af,'betekent: '+v.echt,['vv',{}],v.schijn+' '+v.tip));
 X().REIS.forEach(r=>add('Reisgids',r.af,r.nl,['reis',{q:r.af}]));
 X().SL.forEach(x=>add('Slang',x.af,x.opts[x.a],['mc',{kind:'slang'}],x.expl));
 Object.entries(X().CULT).forEach(([k,v])=>add('Cultuur',k,v,['cult',{tab:'termen'}]));
 PATHS().forEach(p=>add('Paden',p.title,p.desc,['path',{p:p.id}]));
 return a});
V.zoek=()=>{draw(`<h1>Zoeken</h1><p class="muted" style="margin:8px 0 14px">Zoek in kaarten, dialogen, verhalen, grammatica, paden en meer.</p><input type="search" id="zq" placeholder="Bijvoorbeeld: braai, nie, lughawe" aria-label="Zoeken" value="${esc(st.q||'')}" autocomplete="off"><div id="zr" style="margin-top:6px"></div>`);
 const run=()=>{const q=norm($('#zq').value.trim());st.q=$('#zq').value;const out=$('#zr');st.res=[];
  if(q.length<2){out.innerHTML='<p class="muted" style="margin-top:16px">Typ minstens twee letters.</p>';return}
  const ix=IDX(),cards=[];for(let i=0;i<CARDS.length;i++)if(ix[i].includes(q))cards.push(CARDS[i]);
  const groups={};for(const r of SIDX())if(r.k.includes(q))(groups[r.t]=groups[r.t]||[]).push(r);
  let h='';if(cards.length)h+=`<div class="sec">Kaarten · ${cards.length}</div><div class="list">${cards.slice(0,5).map(c=>`<div class="li"><span class="grow"><span class="af" style="font-size:1.12rem;display:block">${esc(c.af)}</span><span class="nl">${esc(c.nl)}</span></span>${spk(c.af,'sm')}</div>`).join('')}${cards.length>5?`<button class="li" data-zk="1" style="color:var(--nl);font-weight:600">Alle ${cards.length} kaarten bekijken</button>`:''}</div>`;
  for(const[t,rs]of Object.entries(groups)){h+=`<div class="sec">${t} · ${rs.length}</div><div class="list">${rs.slice(0,5).map(r=>{st.res.push(r);return row(`data-zr="${st.res.length-1}"`,null,`<span class="${/Grammatica|Paden/.test(t)?'':'af'}">${esc(r.title)}</span>`,esc(r.sub))}).join('')}</div>`}
  out.innerHTML=h||`<div class="card muted" style="margin-top:16px">Niets gevonden voor “${esc($('#zq').value.trim())}”. Probeer een kortere zoekterm.</div>`};
 let t;$('#zq').oninput=()=>{clearTimeout(t);t=setTimeout(run,140)};run();requestAnimationFrame(()=>$('#zq').focus())};

/* ---------- account en synchronisatie (Firebase, optioneel) ---------- */
const SDKV='12.19.0',SDK=n=>`https://www.gstatic.com/firebasejs/${SDKV}/firebase-${n}.js`;
const cloud={avail:undefined,user:null,status:'',at:0,busy:false};
let CFG;
async function getCfg(){if(CFG!==undefined)return CFG;if(TESTHOOK&&window.__cloudAdapter)return CFG={fb:{}};if(!/^https?:$/.test(location.protocol))return CFG=null;
 let c={};try{const r=await fetch('/config.json',{cache:'no-store'});if(r.ok)c=await r.json()}catch{}
 let fb=c&&'firebase' in c?c.firebase:'auto';if(fb==='auto'){fb=null;try{const r=await fetch('/__/firebase/init.json',{cache:'no-store'});if(r.ok)fb=await r.json()}catch{}}
 return CFG=fb&&fb.apiKey?{fb,appCheck:typeof c.appCheckSiteKey==='string'?c.appCheckSiteKey.trim():''}:null}
let FB=null;
async function fbInit(){if(FB)return FB;
 if(TESTHOOK&&window.__cloudAdapter){FB=window.__cloudAdapter;return FB}
 const cfg=await getCfg();if(!cfg)throw new Error('nocfg');
 const A=await import(SDK('app')),app=A.initializeApp(cfg.fb);
 if(cfg.appCheck){const AC=await import(SDK('app-check'));AC.initializeAppCheck(app,{provider:new AC.ReCaptchaEnterpriseProvider(cfg.appCheck),isTokenAutoRefreshEnabled:true})}
 const[Au,F]=await Promise.all([import(SDK('auth')),import(SDK('firestore'))]);
 const auth=Au.getAuth(app),db=F.getFirestore(app);
 FB={signIn:async()=>{const p=new Au.GoogleAuthProvider();try{await Au.signInWithPopup(auth,p)}catch(e){if(e&&/popup-blocked|operation-not-supported/.test(e.code||''))return Au.signInWithRedirect(auth,p);if(e&&/popup-closed|cancelled-popup/.test(e.code||''))return;throw e}},
  signOut:()=>Au.signOut(auth),onUser:cb=>Au.onAuthStateChanged(auth,cb),redirect:()=>Au.getRedirectResult(auth).catch(()=>null),
  load:async uid=>{const d=await F.getDoc(F.doc(db,'users',uid));return d.exists()?d.data():null},
  save:(uid,data)=>F.setDoc(F.doc(db,'users',uid),data),
  remove:async uid=>{await F.deleteDoc(F.doc(db,'users',uid));const u=auth.currentUser;if(!u)return;try{await Au.deleteUser(u)}catch(e){if(/requires-recent-login/.test(e&&e.code||'')){await Au.reauthenticateWithPopup(u,new Au.GoogleAuthProvider());await Au.deleteUser(u)}else throw e}}};
 return FB}
function cleanState(o){if(!o||typeof o!=='object'||Array.isArray(o))return null;const d=DEF(),r={};
 const obj=v=>v&&typeof v==='object'&&!Array.isArray(v),num=v=>typeof v==='number'&&isFinite(v),str=(v,m)=>typeof v==='string'&&v.length<=m;
 r.srs={};if(obj(o.srs))for(const[k,v]of Object.entries(o.srs)){if(/^-?\d{1,15}$/.test(k)&&obj(v)&&num(v.box)&&num(v.due))r.srs[k]={box:Math.max(0,Math.min(6,v.box|0)),due:v.due,...(num(v.t)?{t:v.t}:{})}}
 r.days={};if(obj(o.days))for(const[k,v]of Object.entries(o.days))if(/^\d{4}-\d{2}-\d{2}$/.test(k)&&num(v))r.days[k]=Math.max(0,Math.min(100000,v|0));
 r.favs=Array.isArray(o.favs)?o.favs.filter(num).slice(0,10000):[];
 r.paths={};if(obj(o.paths))for(const[k,v]of Object.entries(o.paths))if(str(k,60)&&Array.isArray(v))r.paths[k]=v.filter(num).slice(0,100);
 for(const k of['dlg','stories'])r[k]={},obj(o[k])&&Object.keys(o[k]).slice(0,500).forEach(x=>{if(str(x,120))r[k][x]=1});
 r.les={};if(obj(o.les))for(const[k,v]of Object.entries(o.les))if(str(k,60)&&num(v))r.les[k]=v|0;
 r.own=Array.isArray(o.own)?o.own.filter(x=>obj(x)&&num(x.id)&&str(x.nl,120)&&str(x.af,120)).slice(0,2000).map(x=>({id:x.id,nl:x.nl,af:x.af,vb:str(x.vb,300)?x.vb:''})):[];
 r.reports=Array.isArray(o.reports)?o.reports.filter(x=>obj(x)&&num(x.id)).slice(0,2000).map(x=>({id:x.id,af:String(x.af||'').slice(0,120),nl:String(x.nl||'').slice(0,120),note:String(x.note||'').slice(0,500),t:num(x.t)?x.t:0})):[];
 r.streak=num(o.streak)?o.streak|0:0;r.last=str(o.last,10)&&/^\d{4}-\d{2}-\d{2}$|^$/.test(o.last)?o.last:'';
 r.theme=['auto','light','dark'].includes(o.theme)?o.theme:d.theme;r.goal=[10,15,25,40].includes(o.goal)?o.goal:d.goal;r.rate=[0.7,0.85,1].includes(o.rate)?o.rate:d.rate;
 r.startLv=['','Beginner','Intermediate','Advanced'].includes(o.startLv)?o.startLv:'';for(const k of['typed','lvDone','haptic'])r[k]=typeof o[k]==='boolean'?o[k]:d[k];
 r.lp=str(o.lp,60)?o.lp:'';for(const k of['mt','resetAt','cloud'])if(num(o[k]))r[k]=o[k];return Object.assign(d,r)}
function mergeState(a,b){
 if(!b)return a;if((b.resetAt||0)>(a.mt||0))return Object.assign(DEF(),b);if((a.resetAt||0)>(b.mt||0))return a;
 const newest=(b.mt||0)>(a.mt||0)?b:a,o=Object.assign(DEF(),newest),U=(x,y)=>[...new Set([...(x||[]),...(y||[])])];
 o.srs={};const sa=a.srs||{},sb=b.srs||{};
 for(const k of new Set([...Object.keys(sa),...Object.keys(sb)])){const x=sa[k],y=sb[k];o.srs[k]=!x?y:!y?x:(x.t||y.t)?((x.t||0)>=(y.t||0)?x:y):(x.box>=y.box?x:y)}
 o.days={...(a.days||{})};for(const[k,v]of Object.entries(b.days||{}))o.days[k]=Math.max(o.days[k]||0,v);
 if((a.last||'')===(b.last||'')){o.last=a.last;o.streak=Math.max(a.streak||0,b.streak||0)}else{const w=(a.last||'')>(b.last||'')?a:b;o.last=w.last;o.streak=w.streak}
 o.favs=U(a.favs,b.favs);o.paths={};for(const k of new Set([...Object.keys(a.paths||{}),...Object.keys(b.paths||{})]))o.paths[k]=U((a.paths||{})[k],(b.paths||{})[k]);
 o.dlg={...(b.dlg||{}),...(a.dlg||{})};o.stories={...(b.stories||{}),...(a.stories||{})};
 o.les={...(b.les||{})};for(const[k,v]of Object.entries(a.les||{}))o.les[k]=Math.max(o.les[k]??0,v);
 const own=new Map(),used=new Set();for(const x of[...(b.own||[]),...(a.own||[])]){const key=x.id+'|'+x.af;if(own.has(key))continue;let c={...x};if(used.has(c.id))c.id=-Date.now()-own.size-1;used.add(c.id);own.set(key,c)}o.own=[...own.values()];
 const rp=new Map();for(const r of[...(b.reports||[]),...(a.reports||[])])rp.set(r.id+'|'+r.t,r);o.reports=[...rp.values()];
 o.theme=a.theme;o.rate=a.rate;o.haptic=a.haptic;
 o.mt=Math.max(a.mt||0,b.mt||0);o.cloud=1;return o}
function applyState(n){S=n;for(let i=CARDS.length-1;i>=0;i--)if(CARDS[i].own)CARDS.splice(i,1);for(const o of S.own)CARDS.push(ownCard(o));resetCards();theme();
 try{localStorage.setItem(KEY,JSON.stringify(S))}catch{}if(['home','meer','oef'].includes(view))render()}
let pushT=0;
function schedulePush(){clearTimeout(pushT);pushT=setTimeout(push,2500)}
async function push(){if(!cloud.user)return;clearTimeout(pushT);cloud.status='saving';acctRefresh();
 try{const data=JSON.stringify(S);if(data.length>850000)throw Object.assign(new Error('te groot'),{code:'too-large'});await FB.save(cloud.user.uid,{data,mt:Math.round(S.mt||Date.now()),v:1});cloud.status='ok';cloud.at=Date.now()}catch(e){cloud.status=navigator.onLine===false?'offline':'error';cloud.err=String(e&&e.code||e&&e.message||e)}acctRefresh()}
async function pull(){if(!cloud.user)return;cloud.status='saving';acctRefresh();
 try{const r=await FB.load(cloud.user.uid);const remote=r&&typeof r.data==='string'&&r.data.length<900000?cleanState(JSON.parse(r.data)):null;applyState(mergeState(S,remote));S.mt=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S))}catch{}await push()}
 catch(e){cloud.status=navigator.onLine===false?'offline':'error';cloud.err=String(e&&e.code||e&&e.message||e);acctRefresh()}}
async function startCloud(){if(cloud.started)return;cloud.started=1;
 try{const fb=await fbInit();cloud.avail=true;if(fb.redirect)await fb.redirect();
  fb.onUser(u=>{const was=cloud.user&&cloud.user.uid;cloud.user=u?{uid:u.uid,name:u.displayName||'',email:u.email||'',photo:u.photoURL||''}:null;
   if(u&&was!==u.uid){S.cloud=1;pull()}else if(!u){S.cloud=0;cloud.status='';try{localStorage.setItem(KEY,JSON.stringify(S))}catch{}}acctRefresh()})}
 catch(e){cloud.avail=false;cloud.started=0;cloud.loadErr=String(e&&e.message||e);acctRefresh()}}
addEventListener('online',()=>{if(cloud.user&&cloud.status!=='ok')push()});
function accountBox(){
 if(cloud.avail===undefined){getCfg().then(c=>{if(cloud.avail===undefined){cloud.avail=!!c;acctRefresh()}});return'<div id="acct"></div>'}
 if(!cloud.avail)return'<div id="acct"></div>';
 const u=cloud.user,st={saving:'Bezig met opslaan…',ok:'Opgeslagen'+(cloud.at?' om '+new Date(cloud.at).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}):''),offline:'Offline. Wordt opgeslagen zodra je weer online bent.',error:'Opslaan lukte niet. Probeer het opnieuw.'}[cloud.status]||'';
 return`<div id="acct"><div class="sec">Account</div><div class="card stack">${u?`<div class="row"><span class="avatar">${u.photo?`<img src="${esc(u.photo)}" alt="" referrerpolicy="no-referrer">`:esc((u.name||u.email||'?')[0].toUpperCase())}</span><span class="grow"><b>${esc(u.name||'Ingelogd')}</b><span class="muted" style="display:block">${esc(u.email)}</span></span></div>
 <p class="muted" role="status">${st||'Je voortgang wordt bewaard in je account.'}</p><div class="row"><button class="btn soft" id="csync" style="box-shadow:inset 0 0 0 1.5px var(--hair)">Nu opslaan</button><button class="btn ghost" id="cout">Uitloggen</button></div><button class="linkbtn" id="cdel" style="color:var(--bad)">${I.trash}Account en cloudgegevens verwijderen</button>`
 :`<p>Log in met je Google-account om je voortgang te bewaren en op andere apparaten verder te gaan.</p><button class="btn" id="cin">${I.user}Inloggen met Google</button><p class="muted small">Alleen je leervoortgang wordt opgeslagen. Niemand anders kan hem lezen. <a href="/privacy.html" style="color:var(--nl)">Privacyverklaring</a>.${cloud.loginErr?'<br><span style="color:var(--bad)">'+esc(cloud.loginErr)+'</span>':''}</p>`}</div></div>`}
function acctRefresh(){if(view!=='meer')return;const el=$('#acct');if(!el)return;el.outerHTML=accountBox();bindAccount()}
function bindAccount(){const i=$('#cin'),o=$('#cout'),y=$('#csync');
 if(i)i.onclick=async()=>{cloud.loginErr='';i.disabled=true;try{await startCloud();await FB.signIn()}catch(e){cloud.loginErr='Inloggen lukte niet ('+(e&&e.code||e&&e.message||'onbekende fout')+').';i.disabled=false;acctRefresh()}};
 if(o)o.onclick=async()=>{await push();try{await FB.signOut()}catch{}cloud.user=null;S.cloud=0;saveNow();V.meer()};
 if(y)y.onclick=()=>pull();
 const dl=$('#cdel');if(dl)dl.onclick=async()=>{if(!confirm('Je account en je opgeslagen voortgang in de cloud worden verwijderd. De voortgang op dit toestel blijft staan. Doorgaan?'))return;
  try{clearTimeout(pushT);const u=cloud.user;cloud.user=null;await FB.remove(u.uid);S.cloud=0;saveNow();cloud.status='';alert('Je account en cloudgegevens zijn verwijderd.');V.meer()}catch(e){cloud.user=cloud.user||null;alert('Verwijderen lukte niet ('+(e&&e.code||e&&e.message||'fout')+'). Probeer het opnieuw.');startCloud()}}}

/* ---------- meer ---------- */
V.meer=()=>{const k=Object.values(S.srs),m=k.filter(r=>r.box>=4).length,nd=Object.keys(S.dlg).length,tot=Object.values(S.days).reduce((a,b)=>a+b,0);
 const wd=['zo','ma','di','wo','do','vr','za'];
 const pathDone=Object.entries(S.paths).some(([id,a])=>{const p=PATHS().find(x=>x.id===id);return p&&a.length>=p.steps.length});
 const bd=[['Eerste stap',tot>0],['3 dagen op rij',streak()>=3],['7 dagen op rij',streak()>=7],['100 kaarten',k.length>=100],['500 kaarten',k.length>=500],['25 beheerst',m>=25],['10 dialogen',nd>=10],['Alle lessen',Object.keys(S.les).length>=N.les],['Pad voltooid',pathDone]];
 const seg=(key,opts)=>`<div class="seg">${opts.map(([v,l])=>`<button class="chip ${S[key]===v?'on':''}" data-s="${key}:${v}">${l}</button>`).join('')}</div>`;
 draw(`<h1>Meer</h1>${accountBox()}
 <div class="card stats" style="margin-top:18px"><div><div class="big">${k.length}</div><div class="muted">gestart</div></div><div><div class="big">${m}</div><div class="muted">beheerst</div></div><div><div class="big">${S.favs.length}</div><div class="muted">favorieten</div></div></div>
 <div class="sec">Je voortgang</div><div class="card">${calendar()}</div>
 <div class="sec">Mijlpalen</div><div class="card"><div class="chips wrap">${bd.map(b=>`<span class="chip ${b[1]?'on':'lock'}">${b[1]?I.check:I.medal}${b[0]}</span>`).join('')}</div></div>
 <div class="sec">Instellingen</div><div class="card set"><h2>Uiterlijk</h2>${seg('theme',[['auto','Automatisch'],['light','Licht'],['dark','Donker']])}<h2>Dagelijks doel</h2>${seg('goal',[[10,'10'],[15,'15'],[25,'25'],[40,'40']])}<h2>Antwoorden in de sessie</h2>${seg('typed',[[false,'Tikken'],[true,'Typen']])}<h2>Trillen bij fouten</h2>${seg('haptic',[[true,'Aan'],[false,'Uit']])}<h2>Spraaksnelheid</h2>${seg('rate',[[0.7,'Langzaam'],[0.85,'Rustig'],[1,'Normaal']])}<h2>Startniveau nieuwe kaarten</h2>${seg('startLv',[['Beginner','Beginner'],['Intermediate','Intermediate'],['Advanced','Advanced']])}<button class="btn ghost" data-a="toets" style="margin-top:12px">Niveautoets doen</button></div>
 ${S.reports.length?`<div class="sec">Meldingen (${S.reports.length})</div><div class="card stack"><p class="muted">Kaarten waarvan je zei dat er iets niet klopt. Kopieer de lijst en stuur hem naar een nakijker.</p><textarea id="rpt" readonly aria-label="Meldingen">${esc(reportText())}</textarea><div class="row"><button class="btn soft" id="rpc" style="box-shadow:inset 0 0 0 1.5px var(--hair)">Kopiëren</button><button class="btn danger" id="rpx">Wissen</button></div><p class="muted" id="rpm" role="status"></p></div>`:''}
 <div class="sec">Back-up</div><div class="card stack"><p class="muted">Kopieer je voortgang, of plak een eerdere back-up om die terug te zetten.</p><textarea id="bk" aria-label="Back-up" placeholder="Plak hier je back-up"></textarea><div class="row"><button class="btn soft" id="cp" style="box-shadow:inset 0 0 0 1.5px var(--hair)">Kopiëren</button><button class="btn ghost" id="rs">Herstel</button></div><p class="muted" id="msg" role="status"></p></div>
 <div class="sec">Oude voortgang</div><div class="card stack"><p class="muted">Eerder een oudere versie van Afrikaans Master gebruikt op dit toestel? Neem je kaartvoortgang en favorieten over.</p><button class="btn soft" id="io" style="box-shadow:inset 0 0 0 1.5px var(--hair)">Voortgang overnemen</button><p class="muted" id="iom" role="status"></p></div>
 <div class="stack" style="margin-top:22px"><button class="btn danger" id="rst">Voortgang wissen</button></div><p class="muted small" style="text-align:center;margin-top:22px"><a href="/privacy.html" style="color:var(--nl)">Privacyverklaring</a> · Afrikaans Master</p>`);
 if($('#rpc')){$('#rpc').onclick=async()=>{try{await navigator.clipboard.writeText(reportText());$('#rpm').textContent='Gekopieerd.'}catch{$('#rpt').select();$('#rpm').textContent='Selecteer en kopieer de tekst hierboven.'}};$('#rpx').onclick=()=>{if(confirm('Alle meldingen wissen?')){S.reports=[];saveNow();V.meer()}}}
 {const c=$('#cal');if(c)c.scrollLeft=c.scrollWidth}
 bindAccount();
 $('#io').onclick=async()=>{const[a,b]=await importOld();$('#iom').textContent=a||b?a+' kaarten en '+b+' favorieten overgenomen.':'Geen oude voortgang gevonden in deze app of browser.'};
 $('#cp').onclick=async()=>{saveNow();const j=JSON.stringify(S);$('#bk').value=j;try{await navigator.clipboard.writeText(j);$('#msg').textContent='Gekopieerd.'}catch{$('#bk').select();$('#msg').textContent='Selecteer en kopieer de tekst hierboven.'}};
 $('#rs').onclick=()=>{try{const raw=$('#bk').value;if(raw.length>2e6)throw 0;const o=cleanState(JSON.parse(raw));if(!o)throw 0;S=Object.assign(DEF(),o,{theme:S.theme,cloud:S.cloud});for(let i=CARDS.length-1;i>=0;i--)if(CARDS[i].own)CARDS.splice(i,1);for(const x of S.own)CARDS.push(ownCard(x));resetCards();saveNow();theme();$('#msg').textContent='Hersteld.';setTimeout(V.meer,600)}catch{$('#msg').textContent='Dit is geen geldige back-up.'}};
 $('#rst').onclick=()=>{if(confirm('Alle voortgang wissen?')){const keep={theme:S.theme,goal:S.goal,typed:S.typed,rate:S.rate,own:S.own,cloud:S.cloud};S=Object.assign(DEF(),keep,{resetAt:Date.now()});ORDER.reset();saveNow();V.meer()}}};

/* ---------- klikken (één handler voor de hele app) ---------- */
document.addEventListener('click',e=>{const t=e.target;
 if(t.closest('[data-reload]'))return location.reload();
 const nv=t.closest('#nav [data-v]');if(nv)return go(nv.dataset.v);
 const sp=t.closest('[data-sp]');if(sp){e.stopPropagation();return speak(sp.dataset.sp)}
 if(view==='story'){const w=t.closest('.w');if(w)return storyWord(w)}
 const f=t.closest('[data-f]');if(f){const id=+f.dataset.f,i=S.favs.indexOf(id);i<0?S.favs.push(id):S.favs.splice(i,1);save();f.classList.toggle('on',i<0);f.setAttribute('aria-pressed',i<0);return}
 if(view==='sess'){
  if(t.closest('#fc')&&!st.open&&!S.typed&&!t.closest('#tf,[data-rep]')){st.open=true;st.flip=1;return render()}
  const g=t.closest('[data-g]');if(g)return sessGrade(g.dataset.g==='1')}
 const zr=t.closest('[data-zr]');if(zr&&view==='zoek'){const r=st.res[+zr.dataset.zr];return go(r.go[0],Object.assign({},r.go[1]))}
 if(t.closest('[data-zk]'))return go('kaart',{q:st.q});
 const rp=t.closest('[data-rep]');if(rp){e.stopPropagation();return report(+rp.dataset.rep)}
 const dl=t.closest('[data-del]');if(dl)return delOwn(+dl.dataset.del);
 if(t.closest('[data-lvskip]')){S.lvDone=true;saveNow();return V.home()}
 const s=t.closest('[data-s]');if(s){const[k,val]=s.dataset.s.split(':');S[k]=k==='goal'||k==='rate'?+val:val==='true'?true:val==='false'?false:val;if(k==='startLv'){S.lvDone=true;ORDER.reset()}saveNow();theme();if(k==='rate')speak('Goeiemôre, hoe gaan dit?');return V.meer()}
 const a=t.closest('[data-a]');if(a){const k=a.dataset.a;if(k.startsWith('mc:'))return go('mc',{kind:k.slice(3)});if(k==='back')return goBack();if(k==='stepdone')return stepDone();return go(k)}
 const ex=t.closest('[data-les],[data-ls],[data-lo],[data-pg],[data-t],[data-m],[data-tr],[data-rev],[data-fin],[data-play],[data-p],[data-step],[data-story]');if(!ex)return;const D=ex.dataset;
 if(D.story)return go('story',{id:D.story});
 if(D.les)return go('les',{l:D.les});
 if(D.ls){st.n=0;st.sc=0;st.ans=null;return V.les()}
 if(D.pg){st.g=D.pg;return V.paden()}
 if(D.lo!==undefined&&view==='les'){if(st.ans)return;const q=LES().find(x=>x.id===st.l).q[st.n],ok=+D.lo===q[2];st.ans=1;for(const x of app.querySelectorAll('.opt')){if(+x.dataset.lo===q[2])x.classList.add('ok');x.disabled=true}if(!ok){ex.classList.add('bad');buzz('bad')}if(ok){st.sc++;count()}return setTimeout(()=>{st.ans=null;st.n++;V.les()},ok?650:1500)}
 if(D.t)return go('dlg',{t:D.t});
 if(D.m){st.m=D.m;st.rev={};return V.dlg()}
 if(D.tr){st.tr=!st.tr;return V.dlg()}
 if(D.rev){st.rev[D.rev]=1;return V.dlg()}
 if(D.play)return speakAll(DLG().find(x=>x.title===st.t).lines.map(l=>l.af));
 if(D.fin){const d=st.t;if(!S.dlg[d]){S.dlg[d]=1;count()}saveNow();return st.ret?stepDone():go('dlgs')}
 if(D.p)return go('path',{p:D.p});
 if(D.step!==undefined&&view==='path')return runStep(st.p,+D.step)});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){const sh=document.getElementById('sheet');if(sh){sh.remove();return}}
 if(!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!document.getElementById('sheet')){
  if(view==='sess'&&st.open&&(e.key==='1'||e.key==='2')){const b=app.querySelector(`[data-g="${e.key==='1'?0:1}"]`);if(b){e.preventDefault();return b.click()}}
  if(e.key==='/'){e.preventDefault();return go('zoek')}
  if(/^[1-4]$/.test(e.key)){const o=[...app.querySelectorAll('.opt:not([disabled])')][+e.key-1];if(o){e.preventDefault();return o.click()}}
  if(view==='sess'&&!st.open&&!S.typed&&(e.key===' '||e.key==='Enter')){e.preventDefault();st.open=true;st.flip=1;return render()}}if(view==='sess'&&!st.open&&!S.typed&&(e.key===' '||e.key==='Enter')&&e.target.id==='fc'){e.preventDefault();st.open=true;render()}});

theme();mq.addEventListener?.('change',theme);
async function boot(){try{const[m,c]=await Promise.all([load('meta'),load('cards')]);META=m;N=m.n||{};CARDS=parseCards(c,m);for(const o of S.own)CARDS.push(ownCard(o));resetCards()}catch(e){return loadError()}
 render();setTimeout(()=>['facts','paths','dlg','les','ext','vv'].forEach(n=>load(n).catch(()=>{})),400);
 if(S.cloud||/[?&](apiKey|state)=|#.*state=/.test(location.href))setTimeout(startCloud,500)}
boot();
/* offline en updates */
if('serviceWorker' in navigator&&(location.protocol==='https:'||TESTHOOK&&location.protocol==='http:')){const had=!!navigator.serviceWorker.controller;
 addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!had||document.getElementById('toast'))return;const t=document.createElement('div');t.id='toast';t.setAttribute('role','status');
  t.innerHTML='<span>Er is een nieuwe versie.</span><button class="chip on" data-reload="1">Vernieuwen</button>';document.body.appendChild(t)})}
})();
