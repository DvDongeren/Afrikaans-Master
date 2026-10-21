/* 96-gemak.js — Verder waar je was, synchronisatiestatus en back-up als bestand.
   Alle bestanden in bron/js worden op volgorde samengevoegd tot één script (één scope). */

/* ---------- verder waar je was ----------
   Een onderbroken sessie, quiz of gatentekst wordt per toestel bewaard (localStorage 'af2r'), 24 uur lang. */
const RKEY='af2r',RNAME={sess:'Dagelijkse sessie',quiz:'Quiz',gat:'Gatentekst'};
const rGet=()=>{try{const r=JSON.parse(localStorage.getItem(RKEY)||'null');return r&&RNAME[r.v]&&Date.now()-r.t<DAY&&Array.isArray(r.ids)&&r.i<r.ids.length?r:null}catch{return null}};
const forget=k=>{try{const r=JSON.parse(localStorage.getItem(RKEY)||'null');if(!k||(r&&r.v===k))localStorage.removeItem(RKEY)}catch{}};
function remember(k){if(st.ret||st.audio||st.pool||!st.q||!st.i)return;const id=x=>x&&(x.c?x.c.id:x.id);
 const r={v:k,t:Date.now(),ids:st.q.map(id),i:st.i,sc:k==='sess'?st.done||0:st.score||0,wr:(k==='sess'?st.retry||[]:st.wr||[]).map(id),lv:st.lv||'',k:k==='quiz'&&st.cur?st.cur.k:''};
 try{localStorage.setItem(RKEY,JSON.stringify(r))}catch{}}
async function resume(){const r=rGet();if(!r)return go('home');try{await allCards()}catch{return loadError()}
 const m=byId(),G=r.v==='gat'?new Map(GAPS().map(g=>[g.c.id,g])):null,get=i=>G?G.get(i):m.get(i);
 const q=r.ids.map(get).filter(Boolean),wr=r.wr.map(get).filter(Boolean);if(q.length<=r.i){forget();return go(r.v)}
 if(r.v==='sess')go('sess',{q,i:r.i,open:false,done:r.sc,retry:wr,rv:{}});
 else go(r.v,{q,i:r.i,score:r.sc,ans:null,wr,lv:r.lv,rk:r.k||''})}
function resumeBox(){const r=rGet();if(!r||view===r.v)return'';
 return`<div class="sec">Ga verder waar je was</div><div class="card resume"><div class="row" style="gap:12px"><span class="ico">${r.v==='gat'?I.zin:r.v==='quiz'?I.quiz:I.sess}</span><span class="grow"><h2>${RNAME[r.v]}</h2><span class="muted small">Vraag ${r.i+1} van ${r.ids.length} · ${r.sc} goed</span></span><button class="x" id="rsx" aria-label="Niet verdergaan">${I.x}</button></div>
 <div class="ibar" role="img" aria-label="${r.i} van ${r.ids.length} gedaan"><i class="ma" style="width:${Math.round(r.i/r.ids.length*100)}%"></i></div><button class="btn" id="rsgo" style="margin-top:12px">Verder</button></div>`}
function bindResume(){const g=$('#rsgo'),x=$('#rsx');if(g)g.onclick=resume;if(x)x.onclick=()=>{forget();const b=x.closest('.resume');b&&b.previousElementSibling&&b.previousElementSibling.remove();b&&b.remove()}}

/* ---------- synchronisatiestatus ----------
   Een stip op 'Meer' (alleen als je bent ingelogd) en een balk bovenin als je offline bent. */
let syncOkT=0;
function syncUI(){const b=navEl.querySelector('[data-v=meer]');if(!b)return;let d=b.querySelector('.syncdot');
 const on=navigator.onLine!==false,u=cloud.user,s=cloud.status;
 const k=!u?'':!on?'off':s==='error'?'err':s==='saving'||s==='pending'?'busy':s==='ok'&&Date.now()-cloud.at<3000?'ok':'';
 const t={off:'Offline: je voortgang wordt opgeslagen zodra je weer online bent',err:'Opslaan in de cloud lukte niet',busy:'Bezig met opslaan in de cloud',ok:'Opgeslagen in de cloud'}[k];
 if(!k){d&&d.remove()}else{if(!d){d=document.createElement('span');d.className='syncdot';d.setAttribute('role','img');b.appendChild(d)}d.dataset.s=k;d.setAttribute('aria-label',t);d.title=t}
 if(k==='ok'){clearTimeout(syncOkT);syncOkT=setTimeout(syncUI,3100)}
 let bar=document.getElementById('offbar');
 if(!on){if(!bar){bar=document.createElement('div');bar.id='offbar';bar.setAttribute('role','status');document.body.prepend(bar)}
  bar.textContent='Je bent offline. Oefenen gaat gewoon door; je voortgang blijft bewaard op dit toestel'+(u?' en gaat naar de cloud zodra je weer online bent.':'.')}
 else if(bar)bar.remove()}
addEventListener('online',syncUI);addEventListener('offline',syncUI);

/* ---------- back-up als bestand ---------- */
function backupFile(){saveNow();const o={app:'Afrikaans Master',versie:1,gemaakt:new Date().toISOString(),voortgang:S};
 const b=new Blob([JSON.stringify(o)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');
 a.href=u;a.download='afrikaans-master-backup-'+fmt(new Date())+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}
/* Zet een back-up terug (bestand of geplakte tekst). Geeft een melding terug. */
function restoreRaw(raw){if(typeof raw!=='string'||raw.length>2e6)throw 0;let o=JSON.parse(raw);if(o&&o.voortgang&&typeof o.voortgang==='object')o=o.voortgang;o=cleanState(o);if(!o)throw 0;
 S=Object.assign(DEF(),o,{theme:S.theme,cloud:S.cloud,fs:S.fs,read:S.read});for(let i=CARDS.length-1;i>=0;i--)if(CARDS[i].own)CARDS.splice(i,1);for(const x of S.own)CARDS.push(ownCard(x));
 resetCards();forget();saveNow();theme();return Object.keys(S.srs).length}

/* ---------- herinnering in je eigen agenda ----------
   Een dagelijkse afspraak als .ics-bestand (Apple, Outlook, Google) of als Google Agenda-link. Geen server nodig. */
const remTime=()=>{try{const t=localStorage.getItem('af2rt');return/^\d\d:\d\d$/.test(t||'')?t:'19:00'}catch{return'19:00'}};
function remStart(t){const[h,m]=t.split(':').map(Number),d=new Date();d.setHours(h,m,0,0);if(d<=new Date())d.setDate(d.getDate()+1);return d}
const icsT=d=>fmt(d).replace(/-/g,'')+'T'+String(d.getHours()).padStart(2,'0')+String(d.getMinutes()).padStart(2,'0')+'00';
const appUrl=()=>location.origin+location.pathname;
function remIcs(t){const a=remStart(t),b=new Date(+a+15*6e4),now=new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';
 const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Afrikaans Master//NL','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:am-'+Date.now()+'@afrikaans-master','DTSTAMP:'+now,
  'DTSTART:'+icsT(a),'DTEND:'+icsT(b),'RRULE:FREQ=DAILY','SUMMARY:Afrikaans oefenen','DESCRIPTION:Even je dagelijkse sessie doen in Afrikaans Master: '+appUrl(),'URL:'+appUrl(),
  'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:Afrikaans oefenen','TRIGGER:-PT0M','END:VALARM','END:VEVENT','END:VCALENDAR'];
 const u=URL.createObjectURL(new Blob([L.join('\r\n')+'\r\n'],{type:'text/calendar'})),x=document.createElement('a');x.href=u;x.download='afrikaans-oefenen.ics';document.body.appendChild(x);x.click();x.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}
function remGoogle(t){const a=remStart(t),b=new Date(+a+15*6e4);let tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch{}
 const q=new URLSearchParams({action:'TEMPLATE',text:'Afrikaans oefenen',details:'Even je dagelijkse sessie doen: '+appUrl(),dates:icsT(a)+'/'+icsT(b),recur:'RRULE:FREQ=DAILY'});if(tz)q.set('ctz',tz);
 return'https://calendar.google.com/calendar/render?'+q.toString()}
function remBox(){const t=remTime();
 return`<div class="sec">Herinnering</div><div class="card stack rem"><p class="muted">Zet een dagelijkse afspraak in je eigen agenda, zodat je telefoon je eraan herinnert.</p>
 <label class="row" style="gap:12px"><span class="grow"><b>Tijdstip</b></span><input type="time" id="remt" value="${t}" aria-label="Tijdstip van de herinnering"></label>
 <div class="row wrapbtns"><button class="btn soft" id="remics" style="box-shadow:inset 0 0 0 1.5px var(--hair)">${I.dl}Agenda-bestand</button><a class="btn soft" id="remg" target="_blank" rel="noopener noreferrer" href="${esc(remGoogle(t))}" style="box-shadow:inset 0 0 0 1.5px var(--hair);text-decoration:none">Google Agenda</a></div>
 <p class="muted small">Het agenda-bestand werkt met Apple Agenda, Outlook en de meeste agenda-apps: open het en kies Toevoegen.</p></div>`}
function bindRem(){const i=$('#remt');if(!i)return;const upd=()=>{const t=/^\d\d:\d\d$/.test(i.value)?i.value:'19:00';try{localStorage.setItem('af2rt',t)}catch{}$('#remg').href=remGoogle(t)};
 i.onchange=upd;$('#remics').onclick=()=>{upd();remIcs(remTime())}}

/* ---------- zoek een geselecteerd woord vanuit elk scherm ----------
   Selecteer (of druk lang op) een woord of korte zin: er verschijnt een knop 'Zoek …'. */
let selT=0;
document.addEventListener('selectionchange',()=>{clearTimeout(selT);selT=setTimeout(selCheck,300)});
const selHide=()=>{const b=document.getElementById('selz');if(b)b.remove()};
/* Een half geselecteerd woord aanvullen tot het hele woord (alleen voor de zoekterm, de selectie zelf blijft). */
const selWord=r=>{const L=/[\p{L}'’-]/u,x=r.cloneRange(),sc=x.startContainer,ec=x.endContainer;
 if(sc.nodeType===3){let o=x.startOffset;while(o>0&&L.test(sc.data[o-1]))o--;x.setStart(sc,o)}
 if(ec.nodeType===3){let o=x.endOffset;while(o<ec.data.length&&L.test(ec.data[o]))o++;x.setEnd(ec,o)}return String(x)};
function selCheck(){const s=getSelection(),raw=s&&s.rangeCount&&!s.isCollapsed?selWord(s.getRangeAt(0)):'',t=raw.trim().replace(/[.,!?;:"“”()…]+$/,'').replace(/^[“"(']+/,'');
 if(!t||t.length<2||t.length>40||t.split(/\s+/).length>4||view==='zoek'||!s.rangeCount)return selHide();
 const r=s.getRangeAt(0),n=r.commonAncestorContainer,el=n.nodeType===1?n:n.parentElement;
 if(!el||!app.contains(el)||el.closest('input,textarea,select,#sheet,canvas'))return selHide();
 const rc=r.getBoundingClientRect();if(!rc.width&&!rc.height)return selHide();
 let b=document.getElementById('selz');
 if(!b){b=document.createElement('button');b.id='selz';b.type='button';document.body.appendChild(b);
  b.addEventListener('pointerdown',e=>e.preventDefault());
  b.onclick=()=>{const q=b.dataset.q;selHide();try{getSelection().removeAllRanges()}catch{}go('zoek',{q})}}
 b.dataset.q=t;b.innerHTML=`${I.search}<span>Zoek “${esc(t)}”</span>`;
 /* op een aanraakscherm onder de selectie (het menu van het toestel staat erboven) */
 const below=matchMedia('(pointer:coarse)').matches||rc.top<70,w=Math.min(260,innerWidth-16);
 b.style.top=(below?rc.bottom+scrollY+10:rc.top+scrollY-46)+'px';b.style.left=Math.round(Math.min(Math.max(8,rc.left+rc.width/2-w/2),innerWidth-w-8)+scrollX)+'px';b.style.maxWidth=w+'px'}
