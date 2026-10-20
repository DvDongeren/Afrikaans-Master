/* 60-spelletjes-inzicht.js — Spelletjes en inzicht.
   Alle bestanden in bron/js worden op volgorde samengevoegd tot één script (één scope). */
/* ---------- spelletjes ---------- */
function gamePool(n){const ok=c=>!c.own&&c.af.length<=14&&c.nl.length<=14&&c.af.toLowerCase()!==c.nl.toLowerCase();
 let pool=CARDS.filter(c=>S.srs[c.id]&&ok(c));if(pool.length<n*3)pool=CARDS.filter(c=>ok(c)&&c.niveau==='Beginner');
 const out=[],sa=new Set(),sn=new Set();for(const c of shuffle(pool.slice())){const a=c.af.toLowerCase(),b=c.nl.toLowerCase();if(sa.has(a)||sn.has(b)||sa.has(b)||sn.has(a))continue;sa.add(a);sn.add(b);out.push(c);if(out.length>=n)break}return out}
V.spel=()=>{const g=S.games||{};
 draw(`${back('oef','Oefenen')}<h1>Spelletjes</h1><p class="muted" style="margin-top:6px">Even ontspannen oefenen met woorden${Object.keys(S.srs).length>=18?' die je al kent':' voor beginners'}.</p>
 <div class="list" style="margin-top:16px">${row('data-a="mem"',I.spel,'Memory','Zoek de Afrikaanse en Nederlandse paren'+(g.mem?` · record ${g.mem} beurten`:''))}${row('data-a="race"',I.bolt,'Tijdrace','Zoveel mogelijk woorden in 60 seconden'+(g.race?` · record ${g.race}`:''))}</div>`)};
V.mem=()=>{if(!st.tiles){const P=gamePool(6);st.tiles=shuffle(P.flatMap(c=>[{id:c.id,l:'af',x:c.af},{id:c.id,l:'nl',x:c.nl}]));st.open=[];st.done=[];st.moves=0;st.lock=0}
 if(st.done.length===st.tiles.length/2){const best=S.games.mem,rec=!best||st.moves<best;if(rec&&!st.saved){S.games.mem=st.moves;st.saved=1;saveNow()}
  return draw(`<div class="result stack"><div class="score">${st.moves}</div><h1>${rec?'Nieuw record!':'Alle paren gevonden'}</h1><p class="muted">${st.moves} beurten${best&&!rec?` · je record is ${best}`:''}</p><div class="stack" style="margin-top:22px"><button class="btn" data-again="mem">Nog een keer</button><button class="btn ghost" data-a="spel">Terug naar spelletjes</button></div></div>`)}
 draw(`${back('spel','Spelletjes')}<div class="row sp" style="margin-top:4px"><h1>Memory</h1><span class="muted">${st.done.length} van ${st.tiles.length/2} · ${st.moves} beurten</span></div>
 <div class="mem" role="grid" aria-label="Memory">${st.tiles.map((t,i)=>{const done=st.done.includes(t.id),open=done||st.open.includes(i);return`<button class="mt ${open?'open':''} ${done?'done':''} ${t.l}" data-mi="${i}" ${done?'disabled':''} aria-label="${open?esc(t.x):'Verborgen kaart'}"><span>${open?esc(t.x):''}</span></button>`}).join('')}</div>
 <p class="muted small" style="margin-top:12px;text-align:center"><span class="af">Groen</span> is Afrikaans, <span class="nl">blauw</span> is Nederlands.</p>`)};
function memTap(i){if(st.lock||st.open.includes(i)||st.done.includes(st.tiles[i].id))return;st.open.push(i);
 if(st.open.length===2){st.moves++;const[a,b]=st.open.map(x=>st.tiles[x]);
  if(a.id===b.id&&a.l!==b.l){st.done.push(a.id);st.open=[];if(a.l==='af')speak(a.x);else speak(b.x)}
  else{st.lock=1;buzz();setTimeout(()=>{st.open=[];st.lock=0;if(view==='mem')V.mem()},900)}}
 V.mem()}
V.race=()=>{if(st.over)return raceEnd();
 if(!st.t0){st.t0=Date.now();st.sc=0;st.q=null;clearInterval(window.__race);window.__race=setInterval(()=>{if(view!=='race'||st.over){clearInterval(window.__race);return}const left=Math.max(0,60-Math.floor((Date.now()-st.t0)/1000));const el=$('#rt');if(el)el.textContent=left+' s';if(left<=0){st.over=1;clearInterval(window.__race);raceEnd()}},250)}
 if(!st.q){const P=gamePool(3),c=P[0];if(!c)return draw('<p class="muted">Geen woorden gevonden.</p>');st.q={c,o:shuffle(P.map(x=>x.nl))}}
 const left=Math.max(0,60-Math.floor((Date.now()-st.t0)/1000));
 draw(`${back('spel','Stoppen')}<div class="row sp" style="margin-top:4px"><h1>Tijdrace</h1><span class="badge" id="rt" aria-live="off">${left} s</span></div><p class="muted">Score: <b id="rs">${st.sc}</b></p>
 <div class="card race-q"><div class="big af">${esc(st.q.c.af)}</div></div><div class="stack">${st.q.o.map(o=>`<button class="opt" data-ro="${esc(o)}">${esc(o)}</button>`).join('')}</div>`)}
function raceTap(o,el){if(st.over||st.wait)return;const ok=o===st.q.c.nl;
 if(ok){st.sc++;st.q=null;return V.race()}
 buzz();st.wait=1;el.classList.add('bad');for(const x of app.querySelectorAll('[data-ro]'))if(x.dataset.ro===st.q.c.nl)x.classList.add('ok');setTimeout(()=>{st.wait=0;st.q=null;if(view==='race'&&!st.over)V.race()},700)}
function raceEnd(){const best=S.games.race||0,rec=st.sc>best;if(rec&&!st.saved){S.games.race=st.sc;st.saved=1;saveNow()}
 draw(`<div class="result stack"><div class="score">${st.sc}</div><h1>${rec?'Nieuw record!':'Tijd is om'}</h1><p class="muted">${st.sc} ${st.sc===1?'woord':'woorden'} goed${!rec&&best?` · je record is ${best}`:''}</p><div class="stack" style="margin-top:22px"><button class="btn" data-again="race">Nog een keer</button><button class="btn ghost" data-a="spel">Terug naar spelletjes</button></div></div>`)}

/* ---------- inzicht ---------- */
V.inzicht=()=>{const now=Date.now(),E=Object.entries(S.srs),m=byId(),start=new Date();start.setHours(0,0,0,0);const t0=+start;
 const mast=E.filter(([,r])=>r.box>=4).length,due=dueCount();
 const dayAt=i=>{const d=new Date(t0);d.setDate(d.getDate()+i);return+d};
 const wk=[...Array(7)].map((_,i)=>{const a=dayAt(i),b=dayAt(i+1);return{l:i===0?'vandaag':new Date(a).toLocaleDateString('nl-NL',{weekday:'short'}),n:E.filter(([,r])=>i===0?r.due<b:r.due>=a&&r.due<b).length}}),mx=Math.max(1,...wk.map(x=>x.n));
 const by=(key)=>{const g={};for(const c of CARDS){if(c.own)continue;const k=c[key],o=g[k]||(g[k]={k,tot:0,st:0,ma:0,bs:0});o.tot++;const r=S.srs[c.id];if(r){o.st++;o.bs+=r.box;if(r.box>=4)o.ma++}}return Object.values(g)};
 const lv=by('niveau').sort((a,b)=>rank[a.k]-rank[b.k]),cat=by('categorie');
 const bar=(o)=>`<div class="ibar" role="img" aria-label="${o.st} van ${o.tot} gestart, ${o.ma} beheerst"><i class="st" style="width:${o.st/o.tot*100}%"></i><i class="ma" style="width:${o.ma/o.tot*100}%"></i></div>`;
 const hard=cat.filter(o=>o.st>=5).map(o=>({...o,avg:o.bs/o.st})).sort((a,b)=>a.avg-b.avg).slice(0,3);
 const nw=E.filter(([,r])=>r.f&&r.f>now-14*DAY),days=new Set(nw.map(([,r])=>fmt(new Date(r.f)))).size,rate=nw.length/14;
 const cur=lv.find(o=>o.st<o.tot);let est='';
 if(days>=3&&rate>0&&cur){const d=Math.ceil((cur.tot-cur.st)/rate);est=`Je start gemiddeld <b>${(Math.round(rate*10)/10).toLocaleString('nl-NL')}</b> nieuwe ${rate>=1.5||rate<0.95?'kaarten':'kaart'} per dag. In dat tempo heb je alle ${esc(cur.k)}-kaarten over ongeveer <b>${d<14?d+' dagen':d<70?Math.round(d/7)+' weken':Math.round(d/30)+' maanden'}</b> gestart.`}
 else est='Oefen een paar dagen, dan zie je hier een schatting van je tempo.';
 const sorted=cat.slice().sort((a,b)=>b.st/b.tot-a.st/a.tot||a.k.localeCompare(b.k));
 draw(`${back('meer','Meer')}<h1>Inzicht</h1>
 <div class="card stats" style="margin-top:16px"><div><div class="big">${E.length}</div><div class="muted">gestart</div></div><div><div class="big">${mast}</div><div class="muted">beheerst</div></div><div><div class="big">${due}</div><div class="muted">nu herhalen</div></div></div>
 <p class="muted small" style="margin-top:8px">Beheerst betekent: minstens vier keer achter elkaar goed, met steeds langere tussenpozen.</p>
 <div class="sec">Herhalingen de komende week</div><div class="card"><div class="wkbars">${wk.map(x=>`<div><b>${x.n}</b><span class="col"><i style="height:${x.n/mx*100}%"></i></span><span class="muted small">${x.l}</span></div>`).join('')}</div></div>
 <div class="sec">Tempo</div><div class="card"><p>${est}</p></div>
 <div class="sec">Per niveau</div><div class="card stack">${lv.map(o=>`<div><div class="row sp"><b>${esc(o.k)}</b><span class="muted small">${o.st} / ${o.tot} gestart · ${o.ma} beheerst</span></div>${bar(o)}</div>`).join('')}<p class="muted small"><span class="key st"></span>gestart <span class="key ma"></span>beheerst</p></div>
 ${hard.length?`<div class="sec">Lastigste onderwerpen</div><div class="list">${hard.map(o=>row(`data-icat="${esc(o.k)}"`,catIcon(o.k),esc(o.k),`${o.st} gestart · ${Math.round(o.ma/o.st*100)}% beheerst`)).join('')}</div>`:''}
 <div class="sec">Per onderwerp</div><div class="card stack">${sorted.map(o=>`<div><div class="row sp"><span class="row" style="gap:8px"><span class="ti sm ${catHue(o.k)}">${catIcon(o.k)}</span>${esc(o.k)}</span><span class="muted small">${o.st} / ${o.tot}</span></div>${bar(o)}</div>`).join('')}</div>`)};
