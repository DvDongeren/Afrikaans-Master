/* 96-gemak.js — Verder waar je was, synchronisatiestatus en back-up als bestand.
   Alle bestanden in bron/js worden op volgorde samengevoegd tot één script (één scope). */

/* ---------- verder waar je was ----------
   Een onderbroken sessie, quiz of gatentekst wordt per toestel bewaard (localStorage 'af2r'), 24 uur lang. */
const RKEY='af2r',RNAME={sess:'Dagelijkse sessie',quiz:'Quiz',gat:'Gatentekst'};
const rGet=()=>{try{const r=JSON.parse(localStorage.getItem(RKEY)||'null');return r&&RNAME[r.v]&&Date.now()-r.t<DAY&&Array.isArray(r.ids)&&r.i<r.ids.length?r:null}catch{return null}};
const forget=k=>{try{const r=JSON.parse(localStorage.getItem(RKEY)||'null');if(!k||(r&&r.v===k))localStorage.removeItem(RKEY)}catch{}};
function remember(k){if(st.ret||st.audio||st.pool||!st.q||!st.i)return;const id=x=>x&&(x.c?x.c.id:x.id);
 const r={v:k,t:Date.now(),ids:st.q.map(id),i:st.i,sc:k==='sess'?st.done||0:st.score||0,wr:(k==='sess'?st.retry||[]:st.wr||[]).map(id),lv:st.lv||''};
 try{localStorage.setItem(RKEY,JSON.stringify(r))}catch{}}
async function resume(){const r=rGet();if(!r)return go('home');try{await allCards()}catch{return loadError()}
 const m=byId(),G=r.v==='gat'?new Map(GAPS().map(g=>[g.c.id,g])):null,get=i=>G?G.get(i):m.get(i);
 const q=r.ids.map(get).filter(Boolean),wr=r.wr.map(get).filter(Boolean);if(q.length<=r.i){forget();return go(r.v)}
 if(r.v==='sess')go('sess',{q,i:r.i,open:false,done:r.sc,retry:wr,rv:{}});
 else go(r.v,{q,i:r.i,score:r.sc,ans:null,wr,lv:r.lv})}
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
