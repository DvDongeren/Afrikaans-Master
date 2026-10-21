/* 98-plaatjes.js — Woorden met plaatjes: beeldwoordenboek en vier oefenvormen per thema.
   Alle bestanden in bron/js worden op volgorde samengevoegd tot één script (één scope).
   Data: data/pics.json = {themes:[{id,nl,af}], items:[[af,nl,thema,svg]], groups:[[woorden die op elkaar lijken]]}.
   Beste score per thema staat in S.pics als {thema: percentage goed (0-100)}. */
const PICS=()=>D.pics;
const pic=(s,cls='')=>`<svg class="pic ${cls}" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${s}</svg>`;
const PMODES=[['mix','Gemengd'],['woord','Woord → plaatje'],['beeld','Plaatje → woord'],['oor','Luisteren']];
let PM='mix';
const picItems=th=>{const P=PICS();return th&&th!=='alles'?P.items.filter(x=>x[2]===th):P.items};
const picTheme=th=>PICS().themes.find(t=>t.id===th);
const picFull=th=>Math.min(10,picItems(th).length);
/* Voorbeeldplaatje per thema. */
const PTI={kleur:'groen',getal:'drie',dier:'hond',kos:'appel',huis:'huis',natuur:'son',lyf:'hand',klere:'hemp',vervoer:'motor',gevoel:'bly',alles:'ster'};
const picOf=w=>{const x=PICS().items.find(y=>y[0]===w);return x?x[3]:''};

/* ---------- overzicht: thema's en beeldwoordenboek ---------- */
V.beeld=()=>{const P=PICS();st.tab=st.tab||'oef';
 const tabs=`<div class="seg" id="bt2" style="margin:16px 0">${[['oef','Oefenen'],['wb','Beeldwoordenboek']].map(([k,l])=>`<button class="chip ${st.tab===k?'on':''}" data-bt2="${k}">${l}</button>`).join('')}</div>`;
 let body='';
 if(st.tab==='wb'){const th=st.th||P.themes[0].id;
  body=`<div class="chips" id="wbt" style="margin-bottom:14px">${P.themes.map(t=>`<button class="chip ${th===t.id?'on':''}" data-wbt="${t.id}">${esc(t.nl)}</button>`).join('')}</div>
  <div class="picgrid">${picItems(th).map(x=>`<button class="pcard" data-sp="${esc(x[0])}" aria-label="${esc(x[0])}, ${esc(x[1])}">${pic(x[3])}<span class="af">${esc(x[0])}</span><span class="nl small">${esc(x[1])}</span></button>`).join('')}</div>
  <p class="muted small" style="margin-top:12px">Tik op een plaatje om het woord te horen.</p>`}
 else{const best=S.pics||{},done=P.themes.filter(t=>best[t.id]>=100).length;
  body=`<div class="lbl" style="margin:0 2px 6px">Oefenvorm</div><div class="seg pmodes" id="pmo">${PMODES.map(([k,l])=>`<button class="chip ${PM===k?'on':''}" data-pmo="${k}">${l}</button>`).join('')}</div>
  <p class="muted small" style="margin:8px 2px 0">${{mix:'Elke vraag een andere vorm.',woord:'Je ziet het Afrikaanse woord en kiest het plaatje.',beeld:'Je ziet een plaatje en kiest het Afrikaanse woord.',oor:'Je hoort het woord en kiest het plaatje.'}[PM]}${PM==='oor'&&!canSpeak()?' Je toestel heeft geen spraak; kies een andere vorm.':''}</p>
  <div class="sec">Kies een thema <span class="muted small" style="font-weight:500">· ${done} van ${P.themes.length} foutloos</span></div>
  <div class="pthemes">${P.themes.map(t=>{const it=picItems(t.id),b=best[t.id],f=picFull(t.id);return`<button class="ptile ${b>=100?'full':''}" data-pth="${t.id}">${pic(picOf(PTI[t.id])||it[0][3])}<span class="grow"><b>${esc(t.nl)}</b><span class="af small">${esc(t.af)}</span><span class="muted small">${it.length} woorden${b!==undefined?` · beste ${Math.round(b*f/100)}/${f}`:''}</span></span>${b>=100?`<span class="done-mark" aria-label="Foutloos">${I.check}</span>`:''}</button>`}).join('')}
  <button class="ptile" data-pth="alles">${pic(picOf(PTI.alles))}<span class="grow"><b>Alles door elkaar</b><span class="muted small">${P.items.length} woorden</span></span></button></div>`}
 draw(`${back('oef','Oefenen')}<h1>Plaatjes</h1><p class="muted" style="margin-top:8px">Leer de eerste woorden met tekeningen: kleuren, getallen, dieren, eten en meer. Handig als je net begint.</p>${tabs}${body}`);
 $('#bt2').onclick=e=>{const b=e.target.closest('[data-bt2]');if(b){st.tab=b.dataset.bt2;V.beeld()}};
 const w=$('#wbt');if(w){w.onclick=e=>{const b=e.target.closest('[data-wbt]');if(b){st.th=b.dataset.wbt;syncHash();V.beeld()}};const on=$('#wbt .on');on&&on.scrollIntoView({inline:'center',block:'nearest'})}
 const m=$('#pmo');if(m)m.onclick=e=>{const b=e.target.closest('[data-pmo]');if(b){PM=b.dataset.pmo;V.beeld()}};
 for(const b of app.querySelectorAll('[data-pth]'))b.onclick=()=>go('plaat',{th:b.dataset.pth,pm:PM==='oor'&&!canSpeak()?'mix':PM})};

/* ---------- oefening ---------- */
/* Drie andere woorden uit hetzelfde thema, zonder woorden die op het doel lijken (bijv. koffie/tee). */
function picOpts(x,pool){const P=PICS(),grp=new Set((P.groups.find(g=>g.includes(x[0]))||[]).filter(w=>w!==x[0]));
 let c=pool.filter(y=>y[0]!==x[0]&&!grp.has(y[0]));if(c.length<3)c=P.items.filter(y=>y[0]!==x[0]&&!grp.has(y[0]));
 return shuffle([x,...shuffle(c).slice(0,3)])}
V.plaat=()=>{const P=PICS();if(!st.q){const pool=picItems(st.th);if(!pool.length)return go('beeld');st.pool=pool;st.q=shuffle(pool).slice(0,10);st.i=0;st.sc=0;st.ans=null;st.wr=[];st.ms=[]}
 const x=st.q[st.i],n=st.q.length,th=st.th==='alles'?null:picTheme(st.th);
 if(!x){if(th){const pc=Math.round(st.sc/n*100);S.pics=S.pics||{};if((S.pics[st.th]??-1)<pc){S.pics[st.th]=pc;saveNow()}}
  const wr=st.wr.length?`<div class="sec" style="text-align:left">Om te onthouden</div><div class="picgrid" style="text-align:left">${st.wr.map(y=>`<button class="pcard" data-sp="${esc(y[0])}">${pic(y[3])}<span class="af">${esc(y[0])}</span><span class="nl small">${esc(y[1])}</span></button>`).join('')}</div>`:'';
  result(st.sc,n,st.sc===n?'Foutloos, knap gedaan!':praise(st.sc,n),`<button class="btn" id="pagain">Nog een ronde</button><button class="btn ghost" data-a="beeld">Ander thema</button>`,wr);
  $('#pagain').onclick=()=>go('plaat',{th:st.th,pm:st.pm});return}
 if(!st.ms[st.i]){const ms=st.pm==='mix'?(canSpeak()?['woord','beeld','oor']:['woord','beeld']):[st.pm];st.ms[st.i]=ms[Math.floor(Math.random()*ms.length)];st.opts=picOpts(x,st.pool)}
 const mode=st.ms[st.i],done=st.ans!==null,opts=st.opts;
 const q=mode==='beeld'?`<div class="card q pq">${pic(x[3],'big')}<div class="lbl">Wat is dit in het Afrikaans?</div></div>`
  :mode==='oor'?`<div class="card q pq"><button class="icon" style="width:76px;height:76px;margin:6px auto" data-sp="${esc(x[0])}" aria-label="Luister">${I.spk}</button><div class="lbl">Luister en kies het plaatje</div>${done?`<div class="big af" style="margin-top:6px">${esc(x[0])}</div>`:''}</div>`
  :`<div class="card q pq"><div class="row" style="justify-content:center;gap:10px"><div class="big af">${esc(x[0])}</div>${spk(x[0],'sm')}</div><div class="lbl" style="margin-top:6px">Kies het goede plaatje</div></div>`;
 const cls=y=>done?(y[0]===x[0]?'ok':y[0]===st.pick?'bad':''):'';
 const op=mode==='beeld'?`<div class="stack" id="op" style="margin-top:14px">${opts.map(y=>`<button class="opt af-opt ${cls(y)}" data-po="${esc(y[0])}" ${done?'disabled':''}>${esc(y[0])}</button>`).join('')}</div>`
  :`<div class="popts" id="op">${opts.map(y=>`<button class="popt ${cls(y)}" data-po="${esc(y[0])}" ${done?'disabled':''} aria-label="${done?esc(y[0]+' = '+y[1]):'Plaatje '+(opts.indexOf(y)+1)}">${pic(y[3])}${done?`<span class="af small">${esc(y[0])}</span>`:''}</button>`).join('')}</div>`;
 draw(`${topbar(st.i,n,'beeld')}${th?`<div class="lbl" style="margin:0 4px 8px">${esc(th.nl)} · ${esc(th.af)}</div>`:''}${q}${op}
 ${done?`<div class="card pfb ${st.ans?'good':'wrong'}" role="status"><b>${st.ans?'Goed!':'Net niet.'}</b> <span class="af">${esc(x[0])}</span> = ${esc(x[1])}</div><button class="btn" id="pnx" style="margin-top:12px">${st.i+1<n?'Volgende':'Bekijk je score'}</button>`:''}`);
 if(done){$('#pnx').onclick=()=>{st.ans=null;st.pick=null;st.i++;render()};$('#pnx').focus({preventScroll:true});return}
 if(mode==='oor'&&st.heard!==st.i){st.heard=st.i;setTimeout(()=>{if(view==='plaat'&&st.i===st.heard&&st.ans===null)speak(x[0])},300)}
 $('#op').onclick=e=>{const b=e.target.closest('[data-po]');if(!b||st.ans!==null)return;const ok=b.dataset.po===x[0];st.ans=ok;st.pick=b.dataset.po;
  if(ok){st.sc++;count()}else{st.wr.push(x);buzz('bad')}if(mode!=='woord')speak(x[0]);render()}};
