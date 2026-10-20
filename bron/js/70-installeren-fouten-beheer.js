/* 70-installeren-fouten-beheer.js — Installeren als app, foutmeldingen en beheer.
   Alle bestanden in bron/js worden op volgorde samengevoegd tot één script (één scope). */
/* ---------- installeren als app ---------- */
let INST=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();INST=e;if(['home','meer'].includes(view))render()});
addEventListener('appinstalled',()=>{INST=null;S.instHide=true;saveNow();if(['home','meer'].includes(view))render()});
const standalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch{return false}};
const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function installBox(home){if(standalone()||!(INST||isIOS()))return'';if(home&&(S.instHide||Object.keys(S.days).length<2))return'';
 return`<div class="card stack inst"${home?' style="margin-top:12px"':''}><div class="row" style="gap:12px"><span class="ico">${I.dl}</span><h2 class="grow">Zet de app op je beginscherm</h2></div><p class="muted">${INST?'Dan open je Afrikaans Master met één tik, ook zonder internet.':'Tik in Safari onderaan op de deelknop (vierkant met pijl) en kies <b>Zet op beginscherm</b>.'}</p>${INST||home?`<div class="row">${home?'<button class="btn ghost" data-insthide="1">Niet nu</button>':''}${INST?'<button class="btn" data-inst="1">Installeren</button>':''}</div>`:''}</div>`}
async function doInstall(){const e=INST;if(!e)return;INST=null;try{await e.prompt();const c=await e.userChoice;if(c&&c.outcome==='accepted'){S.instHide=true;saveNow()}}catch{}render()}

/* ---------- fouten opvangen en (zonder persoonsgegevens) melden ---------- */
const VER=((document.currentScript&&document.currentScript.src||'').match(/app\.(\w+)\.js/)||[])[1]||'dev';
const browser=()=>{const u=navigator.userAgent;return(/Edg\//.test(u)?'Edge':/Firefox\//.test(u)?'Firefox':/Chrome\//.test(u)?'Chrome':/Safari\//.test(u)?'Safari':'Anders')+(/Mobi|Android|iPhone|iPad/.test(u)?' mobiel':'')};
let ERRN=0;const ERRSEEN=new Set();
async function logError(kind,msg,stack){const m=String(msg||'').slice(0,300);if(!m||ERRSEEN.has(m)||ERRN>=3||TESTHOOK&&!window.__cloudAdapter)return;ERRSEEN.add(m);ERRN++;
 try{if(!await getCfg())return;const fb=await fbInit();if(fb.logError)await fb.logError({k:kind,m,s:String(stack||'').slice(0,800),v:String(view).slice(0,20),ver:VER,b:browser()})}catch{}}
addEventListener('error',e=>{if(e.filename&&!e.filename.startsWith(location.origin))return;logError('error',e.message,e.error&&e.error.stack)});
addEventListener('unhandledrejection',e=>{const r=e.reason;logError('promise',r&&r.message||r,r&&r.stack)});

/* ---------- meldingen beheren (alleen voor beheerders) ---------- */
async function sendReport(r){if(!(r.id>=0))return false;try{if(!await getCfg())return false;const fb=await fbInit();if(!fb.report)return false;
 await fb.report({id:r.id,af:r.af.slice(0,200),nl:r.nl.slice(0,200),note:r.note.slice(0,500),...(cloud.user?{by:cloud.user.uid}:{})});return true}catch{return false}}
V.beheer=()=>{if(!cloud.user||!cloud.admin)return draw(`${back('meer','Meer')}<h1>Meldingen</h1><p class="muted" style="margin-top:8px">Alleen beheerders kunnen meldingen bekijken. Log in met het beheerdersaccount.</p>`);
 const tabs=`<div class="seg" id="bt" style="margin:14px 0 4px"><button class="chip ${st.tab!=='fout'?'on':''}" data-bt="meld">Kaarten</button><button class="chip ${st.tab==='fout'?'on':''}" data-bt="fout">Technische fouten</button></div>`;
 const bindTabs=()=>{$('#bt').onclick=e=>{const b=e.target.closest('[data-bt]');if(b&&b.dataset.bt!==(st.tab||'meld')){st.tab=b.dataset.bt;st.list=null;st.err=null;V.beheer()}}};
 if(st.tab==='fout'){if(!st.list){draw(`${back('meer','Meer')}<h1>Meldingen</h1>${tabs}<p class="loading" role="status">Laden…</p>`);bindTabs();FB.listErrors().then(l=>{st.list=l;if(view==='beheer')V.beheer()},e=>{st.list=[];st.err=String(e&&e.code||e);if(view==='beheer')V.beheer()});return}
  draw(`${back('meer','Meer')}<h1>Meldingen</h1>${tabs}<p class="muted" style="margin-top:6px">${st.list.length?st.list.length+' technische '+(st.list.length===1?'fout':'fouten')+' bij gebruikers. Er worden geen persoonsgegevens bewaard.':'Geen technische fouten.'}${st.err?' <span style="color:var(--bad)">Laden lukte niet ('+esc(st.err)+').</span>':''}</p>
  <div class="stack" style="margin-top:14px">${st.list.map(r=>`<div class="card media"><div class="mh"><h2 style="font-size:1rem;overflow-wrap:anywhere">${esc(r.m)}</h2><span class="tag">${esc(r.k||'')}</span></div><p class="muted small">${r.t?new Date(r.t).toLocaleString('nl-NL',{dateStyle:'medium',timeStyle:'short'}):''} · pagina ${esc(r.v||'?')} · ${esc(r.b||'')} · versie ${esc(r.ver||'?')}</p>${r.s?`<details><summary class="small">Details</summary><pre class="stack-trace">${esc(r.s)}</pre></details>`:''}<div class="row" style="margin-top:10px"><button class="btn ghost" data-edone="${esc(r.doc)}">Opgelost</button></div></div>`).join('')}</div>`);bindTabs();return}
 if(!st.list){draw(`${back('meer','Meer')}<h1>Meldingen</h1>${tabs}<p class="loading" role="status">Laden…</p>`);bindTabs();FB.listReports().then(l=>{st.list=l;if(view==='beheer')V.beheer()},e=>{st.list=[];st.err=String(e&&e.code||e);if(view==='beheer')V.beheer()});return}
 const L=st.list,txt=L.map(r=>`${r.af} = ${r.nl} (kaart ${r.id}): ${r.note||'geen toelichting'}`).join('\n');
 draw(`${back('meer','Meer')}<h1>Meldingen</h1>${tabs}<p class="muted" style="margin-top:6px">${L.length?L.length+' open '+(L.length===1?'melding':'meldingen')+' van gebruikers.':'Geen open meldingen.'}${st.err?' <span style="color:var(--bad)">Laden lukte niet ('+esc(st.err)+').</span>':''}</p>
 <div class="stack" style="margin-top:14px">${L.map(r=>`<div class="card media"><div class="mh"><h2 class="af">${esc(r.af)}</h2><span class="tag">kaart ${r.id}</span></div><div class="nl">${esc(r.nl)}</div><p>${esc(r.note)||'<span class="muted">Geen toelichting</span>'}</p><p class="muted small">${r.t?new Date(r.t).toLocaleString('nl-NL',{dateStyle:'medium',timeStyle:'short'}):''}${r.by?' · ingelogde gebruiker':' · anoniem'}</p><div class="row" style="margin-top:10px"><button class="btn soft" data-rq="${esc(r.af)}" style="box-shadow:inset 0 0 0 1.5px var(--hair)">Kaart opzoeken</button><button class="btn ghost" data-rdone="${esc(r.doc)}">Afgehandeld</button></div></div>`).join('')}</div>
 ${L.length?`<div class="stack" style="margin-top:16px"><button class="btn soft" id="rcp" style="box-shadow:inset 0 0 0 1.5px var(--hair)">Alles kopiëren</button><p class="muted" id="rcm" role="status"></p></div>`:''}`);
 bindTabs();const c=$('#rcp');if(c)c.onclick=async()=>{try{await navigator.clipboard.writeText(txt);$('#rcm').textContent='Gekopieerd.'}catch{$('#rcm').textContent='Kopiëren lukte niet.'}}};
async function errorDone(doc,btn){btn.disabled=true;try{await FB.delError(doc);st.list=st.list.filter(r=>r.doc!==doc);V.beheer()}catch(e){btn.disabled=false;alert('Verwijderen lukte niet ('+(e&&e.code||e)+').')}}
async function reportDone(doc,btn){btn.disabled=true;try{await FB.delReport(doc);st.list=st.list.filter(r=>r.doc!==doc);V.beheer()}catch(e){btn.disabled=false;alert('Verwijderen lukte niet ('+(e&&e.code||e)+').')}}
