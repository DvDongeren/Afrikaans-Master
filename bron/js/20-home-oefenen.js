/* 20-home-oefenen.js — Startpagina, oefenen, dagelijkse sessie en quiz.
   Alle bestanden in bron/js worden op volgorde samengevoegd tot één script (één scope). */
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
 ${installBox(true)}
 ${cont}${(()=>{const nx=msNext();return nx?`<div class="sec">Volgende mijlpaal</div><button class="card ms home-ms" data-a="mijlpalen" style="width:100%;text-align:left"><div class="row" style="gap:10px"><span class="msmedal ${nx.n?'t'+Math.min(nx.n-1,8):'off'}">${I[nx.f.ic]||I.medal}</span><span class="grow"><h2>${esc(nx.next.name)}</h2><span class="muted small">${esc(nx.f.t)}</span></span></div>${msBar(nx)}</button>`:''})()}</div><div class="col">
 <div class="sec">Woord van de dag</div>
 <div class="card entry"><div class="row sp"><div class="grow"><div class="af">${esc(wc.af)}</div><div class="nl">${esc(wc.nl)}</div></div>${spk(wc.af)}</div>${wc.voorbeeld?`<p class="ex">${esc(wc.voorbeeld)}</p>`:''}</div>
 <div class="sec">Weetje van de dag</div>
 <button class="card fact" data-a="cult" style="width:100%;text-align:left"><div class="lbl">${esc(fact.s)}</div><p>${esc(fact.t)}</p></button>
 <p class="muted" style="text-align:center;margin-top:22px">${Object.keys(S.srs).length} van ${CARDS.length} kaarten gestart</p></div></div>`)};

/* ---------- oefenen ---------- */
V.oef=()=>{const lv=st.lv||'Alles';
 draw(`<div class="row sp"><h1>Oefenen</h1><button class="x" data-a="zoek" aria-label="Zoeken">${I.search}</button></div><div style="margin-top:18px">${cta()}</div>
 <div class="secs"><section><div class="sec">Slim oefenen</div><div class="list">
 ${row('data-a="weak"',I.bolt,'Moeilijke kaarten',weakList().length?weakList().length+' kaarten die je vaak fout hebt':'Nog geen moeilijke kaarten')}
 ${row('data-a="spel"',I.spel,'Spelletjes','Memory en tijdrace')}
 ${row('data-a="luister"',I.ear,'Luisteren',canSpeak()?'Hoor een zin en typ wat je hoort':'Niet beschikbaar op dit toestel')}</div>
</section><section><div class="sec">Taal en grammatica</div><div class="list">
 ${row('data-a="gram"',I.gram,'Grammatica',N.les+' lessen met uitleg en oefeningen')}
 ${row('data-a="klank"',I.klank,'Uitspraakgids','De klanken die anders zijn dan in het Nederlands')}
 ${row('data-a="zin"',I.zin,'Zinnen bouwen',N.bs+' zinnen in de goede volgorde')}
 ${row('data-a="vertaal"',I.vertaal,'Vrij vertalen','Vertaal zelf een Nederlandse zin')}
 ${row('data-a="mc:nie"',I.nie,'Nie-drill',N.nie+' vragen over nie … nie')}
 ${row('data-a="vv"',I.vv,'Valse vrienden',N.vv+' woorden die misleiden')}</div>
</section><section><div class="sec">Lezen en luisteren</div><div class="list">
 ${row('data-a="dlgs"',I.dlg,'Dialogen',N.dlg+' gesprekken, ook als rollenspel')}
 ${row('data-a="stories"',I.story,'Verhaaltjes',N.st+' verhalen met woordhulp')}
 ${row('data-a="reis"',I.reis,'Reisgids',N.reis+' handige zinnen')}
 ${row('data-a="cult"',I.cult,'Cultuur','Weetjes en lokale woorden')}
 ${row('data-a="media"',I.media,'Muziek, films en series','Luisteren, kijken en lezen, gratis of betaald')}</div>
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
 if(!st.q||st.i===undefined){st.q=st.q||sessionQueue(S.goal);st.i=0;st.open=false;st.done=0;st.retry=[];st.rv={}}
 const c=st.q[st.i];
 if(c&&st.rv[st.i]===undefined){const r=S.srs[c.id];st.rv[st.i]=!S.typed&&!!r&&r.box>=2&&Math.random()<.35}
 const rv=c&&st.rv[st.i];
 if(!c){draw(`<div class="result stack"><div class="score">${st.done}</div><h1>Sessie klaar</h1><p class="muted">Vandaag: ${todayN()} van ${S.goal} kaarten.</p><div class="stack" style="margin-top:22px">${st.ret?'<button class="btn" data-a="stepdone">Verder met het pad</button>':'<button class="btn" data-a="home">Terug naar home</button>'}</div></div>`);return}
 let verdict='';if(st.tv===1)verdict='<span class="verdict ok">Goed!</span>';else if(st.tv===0)verdict=`<span class="verdict bad">Jij typte: ${esc(st.val)}</span>`;
 const closed=S.typed?`<form id="tf"><input type="text" id="ta" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Typ het Afrikaans" aria-label="Antwoord"><div class="row" style="margin-top:10px"><button type="button" class="btn ghost" id="tskip">Weet ik niet</button><button class="btn" type="submit">Controleer</button></div></form>`:`<div class="muted hint">Tik om het antwoord te zien</div>`;
 draw(`${topbar(st.i,st.q.length)}
 <div class="fc${st.flip?' flip':''}${rv?' rev':''}" id="fc" tabindex="0" role="button" aria-label="Toon antwoord">${rv?`<div class="lbl">Afrikaans · wat betekent dit?</div><div class="row" style="justify-content:center;gap:10px"><div class="big af">${esc(c.af)}</div>${spk(c.af,'sm')}</div>`:`<div class="lbl">Nederlands</div><div class="big">${esc(c.nl)}</div>`}
 ${st.open?`<hr class="rule"><div class="ans">${verdict}${rv?`<div class="lbl">Nederlands</div><div class="big">${esc(c.nl)}</div>`:`<div class="lbl">Afrikaans</div><div class="big af">${esc(c.af)}</div>`}${c.voorbeeld?`<p class="ex">${esc(c.voorbeeld)}</p>`:''}${c.tips?`<div class="tip">${esc(c.tips)}</div>`:''}<div class="row">${spk(c.af)}<button class="linkbtn" data-rep="${c.id}">${I.flag}Klopt niet?</button></div></div>`:closed}</div>
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
