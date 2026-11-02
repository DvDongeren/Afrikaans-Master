/* 20-home-oefenen.js — Startpagina, oefenen, dagelijkse sessie en quiz.
   Alle bestanden in bron/js worden op volgorde samengevoegd tot één script (één scope). */
/* ---------- home ---------- */
V.home=()=>{const h=new Date().getHours(),hi=h<12?['Goeiemôre','Goedemorgen']:h<18?['Goeiemiddag','Goedemiddag']:['Goeienaand','Goedenavond'];
 const wc=wordOfDay(),F=FACTS(),fact=F[Math.floor(Date.now()/DAY)%F.length];
 const s=streak(),xp=xpInfo(),nst=Object.keys(S.srs).length,next=homeNext();
 draw(`<header class="hero"><div class="row sp"><span class="brand">Afrikaans Master</span><span class="row" style="gap:8px"><button class="badge lvb" data-a="mijlpalen" aria-label="Niveau ${xp.L}, naar mijlpalen">Niv. ${xp.L}</button>${s?`<span class="badge" title="${s} ${s===1?'dag':'dagen'} op rij">${I.flame}${s}${S.frz?`<span class="frzb" title="${S.frz} ${S.frz===1?'rustdag':'rustdagen'}">${I.shield}${S.frz}</span>`:''}</span>`:''}<button class="x" data-a="zoek" aria-label="Zoeken">${I.search}</button></span></div>
 <div class="hero-row"><div><div class="hello">${hi[0]}</div><div class="nl">${hi[1]}</div></div><svg class="illu" viewBox="0 0 120 84" aria-hidden="true"><circle cx="86" cy="26" r="13" class="sun"/><path d="M6 64 L30 40 Q32 38 35 38 L84 38 Q87 38 89 40 L114 64" class="mtn"/><path d="M16 72h88M30 79h60" class="sea"/></svg></div></header><div class="home-grid"><div class="col">
 ${resumeBox()}<h2 class="sec dsk">Vandaag</h2>${cta()}
 ${nst<10?'<p class="muted small homehint">Elke dag een korte sessie: je herhaalt wat je bijna vergeet en leert een paar nieuwe kaarten. Hoe vaker je iets goed hebt, hoe later het terugkomt.</p>':''}
 <div class="quick" style="margin-top:12px"><button data-a="quiz">${I.quiz}Quiz</button><button data-a="dlgs">${I.dlg}Dialogen</button><button data-a="stories">${I.story}Verhalen</button></div>
 ${!S.lvDone&&nst<30?`<div class="card stack" style="margin-top:12px"><h2>Wat is je niveau?</h2><p class="muted">Doe de niveautoets van 12 vragen. Daarna start je sessie op jouw niveau.</p><div class="row"><button class="btn ghost" data-lvskip="1">Niet nu</button><button class="btn" data-a="toets">Start toets</button></div></div>`:''}
 ${next?`<h2 class="sec">Verder</h2><div class="list">${next}</div>`:''}</div><div class="col">
 <h2 class="sec">Woord van de dag</h2>
 <div class="card entry"><div class="row sp"><div class="grow"><div class="af">${esc(wc.af)}</div><div class="nl">${esc(wc.nl)}</div></div>${spk(wc.af)}</div>${wc.voorbeeld?`<p class="ex">${esc(wc.voorbeeld)}</p>${exnl(wc)}`:''}</div>
 <h2 class="sec">Weetje van de dag</h2>
 <button class="card fact" data-a="cult" style="width:100%;text-align:left"><span class="lbl">${esc(fact.s)}</span><p>${esc(fact.t)}</p></button>
 ${installBox(true)}
 <p class="muted small" style="text-align:center;margin-top:22px">${nst} van ${CARDS.length} kaarten gestart</p></div></div>`);bindResume()};
/* Eén compacte lijst 'Verder': seizoen, je pad en de dichtstbijzijnde mijlpaal (in plaats van drie losse blokken). */
function homeNext(){const out=[];
 for(const s of szActive().filter(x=>!szDone(x)))out.push(row(`data-sz="${s.id}"`,I[s.ic]||I.star,'Seizoen: '+esc(s.t),`${s.w.length} woorden en een mini-quiz · nog tot ${dmy(szWin(s).b)}`));
 if(S.lp){const lp=PATHS().find(p=>p.id===S.lp),dn=lp&&(S.paths[lp.id]||[]),nxi=lp?lp.steps.findIndex((_,i)=>!dn.includes(i)):-1;
  if(nxi>=0)out.push(row(`data-p="${lp.id}"`,lp.ic&&I[lp.ic]||I.pad,esc(lp.title),'Volgende stap: '+esc(lp.steps[nxi].title)))}
 const nx=msNext();if(nx){const left=nx.next.at-nx.v;out.push(row('data-a="mijlpalen"',`<span class="msmedal sm ${nx.n?'t'+Math.min(nx.n-1,8):'off'}">${I[nx.f.ic]||I.medal}</span>`,'Mijlpaal: '+esc(nx.next.name),`${esc(nx.f.t)} · nog ${fmtN(left)} ${msU(nx.f,left)}`))}
 return out.join('')}

/* ---------- oefenen: vier groepen, per groep vier zichtbaar, de rest klapt open ---------- */
const OEFG=()=>{const wk=weakList().length,a=szActive(),e=S.exam||{},ep=['Beginner','Intermediate','Advanced'].filter(l=>e[l]&&e[l].p).length;return[
 ['Slim oefenen',[['weak',I.bolt,'Moeilijke kaarten',wk?wk+' kaarten die je vaak fout hebt':'Nog geen moeilijke kaarten'],['gat',I.zin,'Gatentekst','Vul het ontbrekende woord in een echte zin in'],['beeld',I.pic,'Plaatjes',(N.pics||118)+' eerste woorden met tekeningen'],['luister',I.ear,'Luisteren',canSpeak()?'Hoor een zin en typ wat je hoort':'Niet beschikbaar op dit toestel']]],
 ['Taal en grammatica',[['gram',I.gram,'Grammatica',N.les+' lessen met uitleg en oefeningen'],['zin',I.zin,'Zinnen bouwen',N.bs+' zinnen in de goede volgorde'],['vertaal',I.vertaal,'Vrij vertalen','Vertaal zelf een Nederlandse zin'],['vv',I.vv,'Valse vrienden',N.vv+' woorden die misleiden'],['klank',I.klank,'Uitspraakgids','De klanken die anders zijn dan in het Nederlands'],['mc:nie',I.nie,'Ontkenning: nie … nie',N.nie+' vragen over de dubbele ontkenning']]],
 ['Lezen en in de praktijk',[['dlgs',I.dlg,'Dialogen',N.dlg+' gesprekken, ook als rollenspel'],['stories',I.story,'Verhaaltjes',N.st+' verhalen, ook om te beluisteren'],['mc:wa',I.wa,'WhatsApp',N.wa+' chats: kies het beste antwoord'],['reis',I.reis,'Reisgids',N.reis+' handige zinnen'],['mc:menu',I.menu,'Restaurant',N.menu+' menu\'s om van te bestellen'],['mc:slang',I.slang,'Spreektaal',N.sl+' uitdrukkingen uit het dagelijks leven'],['cult',I.cult,'Cultuur','Weetjes en lokale woorden'],['media',I.media,'Muziek, films en series','Luisteren, kijken en lezen']]],
 ['Spelen en toetsen',[['quizkies',I.quiz,'Quiz','10 vragen, kies zelf het niveau'],['spel',I.spel,'Spelletjes','Memory en tijdrace'],['examen',I.medal,'Examen',ep?ep+' van 3 niveaus gehaald':'30 vragen per niveau, met certificaat'],['seizoen',I.star,'Seizoenen',a.length?'Nu: '+a.map(s=>s.t).join(', '):'Thema\'s bij de tijd van het jaar']]]]};
V.oef=()=>{const G=OEFG(),it=x=>row(`data-a="${x[0]}"`,x[1],x[2],x[3]);
 draw(`<div class="row sp"><h1>Oefenen</h1><button class="x" data-a="zoek" aria-label="Zoeken">${I.search}</button></div><div style="margin-top:18px">${cta()}</div>
 <div class="secs">${G.map(([t,L])=>`<section><h2 class="sec">${t}</h2><div class="list">${L.slice(0,4).map(it).join('')}</div>${L.length>4?`<details class="more"${(st.open||[]).includes(t)?' open':''} data-grp="${esc(t)}"><summary>Nog ${L.length-4}: ${L.slice(4).map(x=>x[2]).join(', ')}</summary><div class="list">${L.slice(4).map(it).join('')}</div></details>`:''}</section>`).join('')}</div>`);
 for(const d of app.querySelectorAll('details.more'))d.ontoggle=()=>{const t=d.dataset.grp;st.open=(st.open||[]).filter(x=>x!==t);if(d.open)st.open.push(t)}};
/* Quiz: eerst het niveau kiezen. */
function quizSheet(){sheet(`<h2>Quiz</h2><p class="muted" style="margin:8px 0 12px">10 meerkeuzevragen, Nederlands en Afrikaans door elkaar. Welk niveau?</p>
 <div class="chips wrap" id="lv">${['Alles','Beginner','Intermediate','Advanced'].map((l,i)=>`<button class="chip ${i?'':'on'}" data-lv="${l}">${lvd(l)}</button>`).join('')}</div>
 <div class="row" style="margin-top:16px"><button class="btn ghost" data-close="1">Annuleren</button><button class="btn" id="qs">Start quiz</button></div>`,el=>{let lv='Alles';
 el.querySelector('#lv').onclick=e=>{const b=e.target.closest('[data-lv]');if(!b)return;lv=b.dataset.lv;for(const x of el.querySelectorAll('[data-lv]'))x.classList.toggle('on',x===b)};
 el.querySelector('#qs').onclick=()=>{el.remove();go('quiz',{lv})};setTimeout(()=>el.querySelector('#qs').focus(),50)})}

/* ---------- dagelijkse sessie ---------- */
V.sess=()=>{
 if(!st.q||st.i===undefined){st.q=st.q||sessionQueue(S.goal);st.i=0;st.open=false;st.done=0;st.retry=[];st.rv={}}
 const c=st.q[st.i];if(c)remember('sess');else forget('sess');
 if(c&&st.rv[st.i]===undefined){const r=S.srs[c.id];st.rv[st.i]=!S.typed&&!!r&&r.box>=2&&Math.random()<.35}
 const rv=c&&st.rv[st.i];
 if(!c){if(!st.__sd){st.__sd=1;stat('d','sess')}const m=byId(),bad=st.retry.map(id=>m.get(id)).filter(Boolean);
  draw(`<div class="result stack"><div class="score">${st.done}</div><h1>Sessie klaar</h1><p class="muted">Vandaag: ${todayN()} van ${S.goal} kaarten.${bad.length?` Je had er ${bad.length} niet in één keer goed.`:' Alles in één keer goed!'}</p><div class="stack" style="margin-top:22px">${st.ret?'<button class="btn" data-a="stepdone">Verder met het pad</button>':`${bad.length?'<button class="btn" id="srv">Oefen deze nog een keer</button>':''}<button class="btn ${bad.length?'ghost':''}" data-a="home">Terug naar home</button>`}</div>
  ${bad.length?`<h2 class="sec">Even terugkijken</h2><div class="stack review">${bad.map(c=>`<div class="card rv"><div class="row sp"><div class="grow"><div class="af">${esc(c.af)}</div><div class="nl">${esc(c.nl)}</div></div>${spk(c.af,'sm')}</div>${c.voorbeeld?`<p class="ex">${esc(c.voorbeeld)}</p>${exnl(c)}`:''}${S.notes[c.id]?`<div class="ezel"><div class="lbl">${I.bulb}Jouw ezelsbruggetje</div><p class="ezn">${esc(S.notes[c.id])}</p></div>`:''}${(()=>{const t=c.own?[]:ezelTips(c);return t.length?`<div class="ezel"><div class="lbl">${I.bulb}Ezelsbruggetje</div>${t.map(x=>`<p>${x}</p>`).join('')}</div>`:''})()}${c.own?'':`<button class="linkbtn" data-ezel="${c.id}">${I.bulb}${S.notes[c.id]?'Ezelsbruggetje aanpassen':'Eigen ezelsbruggetje'}</button>`}</div>`).join('')}</div>`:''}</div>`);
  const r=$('#srv');if(r)r.onclick=()=>go('sess',{q:shuffle(bad)});return}
 let verdict='';if(st.tv===1)verdict='<span class="verdict ok">Goed!</span>';else if(st.tv===0)verdict=`<span class="verdict bad">Jij typte: ${esc(st.val)}</span>`;
 const closed=S.typed?`<form id="tf"><input type="text" id="ta" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Typ het Afrikaans" aria-label="Antwoord"><div class="row" style="margin-top:10px"><button type="button" class="btn ghost" id="tskip">Weet ik niet</button><button class="btn" type="submit">Controleer</button></div></form>`:`<div class="muted hint">Tik om het antwoord te zien</div>`;
 draw(`${topbar(st.i,st.q.length)}
 <div class="fc${st.flip?' flip':''}${rv?' rev':''}" id="fc" tabindex="0" role="button" aria-label="Toon antwoord">${rv?`<div class="lbl">Afrikaans · wat betekent dit?</div><div class="row" style="justify-content:center;gap:10px"><div class="big af">${esc(c.af)}</div>${spk(c.af,'sm')}</div>`:`<div class="lbl">Nederlands</div><div class="big">${esc(c.nl)}</div>`}
 ${st.open?`<hr class="rule"><div class="ans">${verdict}${rv?`<div class="lbl">Nederlands</div><div class="big">${esc(c.nl)}</div>`:`<div class="lbl">Afrikaans</div><div class="big af">${esc(c.af)}</div>`}${c.voorbeeld?`<p class="ex">${esc(c.voorbeeld)}</p>${exnl(c)}`:''}${c.tips?`<div class="tip">${esc(c.tips)}</div>`:''}${ezel(c)}<div class="row">${spk(c.af)}${!c.own&&!S.notes[c.id]&&!ezel(c)?`<button class="linkbtn" data-ezel="${c.id}">${I.bulb}Ezelsbruggetje</button>`:''}<button class="linkbtn" data-rep="${c.id}">${I.flag}Klopt niet?</button></div></div>`:closed}</div>
 ${st.open?`<div class="row" style="margin-top:14px"><button class="btn ghost" data-g="0">Nog niet</button><button class="btn" data-g="1">Ik wist het</button></div><p class="muted swipe-hint">Of veeg de kaart: naar rechts als je het wist, naar links als nog niet.</p>`:''}`);st.flip=0;{const f=$('#fc');f&&f.addEventListener('animationend',()=>f.classList.remove('flip'),{once:true})}
 if(S.typed&&!st.open){const nz=t=>nzs(t).replace(/^n /,''),alts=[nz(c.af)].concat(c.af.split(/\s*\/\s*/).map(x=>nz(x.replace(/\(.*?\)/g,''))));
  $('#tf').onsubmit=e=>{e.preventDefault();const v=$('#ta').value;st.val=v.trim();st.tv=alts.includes(nz(v))?1:0;if(!st.tv)buzz('bad');st.open=true;st.flip=1;render()};
  $('#tskip').onclick=()=>{st.tv=-1;st.open=true;render()};requestAnimationFrame(()=>{const t=$('#ta');t&&t.focus()})}};

/* ---------- quiz ---------- */
V.quiz=()=>{
 if(!st.q){const pool=st.pool||(st.lv&&st.lv!=='Alles'?CARDS.filter(c=>c.niveau===st.lv):CARDS);st.q=shuffle(pool).slice(0,st.n||10);st.i=0;st.score=0;st.ans=null;st.wr=[]}
 const c=st.q[st.i];if(!c)forget('quiz');
 if(!c){const wr=st.wr.length?`<h2 class="sec" style="text-align:left">Om te herhalen</h2><div class="list" style="text-align:left">${st.wr.map(c=>`<div class="li"><span class="grow"><span class="af" style="font-size:1.15rem;display:block">${esc(c.af)}</span><span class="nl">${esc(c.nl)}</span></span>${spk(c.af,'sm')}</div>`).join('')}</div>`:'';
  result(st.score,st.q.length,praise(st.score,st.q.length),st.ret?'<button class="btn" data-a="stepdone">Verder met het pad</button>':'<button class="btn" data-a="oef">Opnieuw oefenen</button><button class="btn ghost" data-a="home">Home</button>',wr);return}
 if(!st.cur||st.cur.id!==c.id){const rev=st.audio?false:st.rk?st.rk==='nl':Math.random()<.5;st.rk='';const k=rev?'nl':'af',q=rev?'af':'nl';
  const same=(BYCAT().get(c.categorie)||[]).filter(x=>x.id!==c.id&&x[k]!==c[k]),pool=shuffle(same.length>=3?same:CARDS.filter(x=>x.id!==c.id&&x[k]!==c[k])),opts=[];
  for(const x of pool){if(!opts.includes(x[k]))opts.push(x[k]);if(opts.length===3)break}
  st.cur={id:c.id,k,q,opts:shuffle(opts.concat(c[k]))}}
 const u=st.cur,done=st.ans!=null;remember('quiz');
 draw(`${topbar(st.i,st.q.length)}
 <div class="card q"><div class="lbl">${u.q==='nl'?'Nederlands':'Afrikaans'}</div>${st.audio&&st.ans==null?`<button class="icon" style="margin:10px auto 6px;width:72px;height:72px" data-sp="${esc(c.af)}" aria-label="Luister">${I.spk}</button><div class="muted">Luister en kies de vertaling</div>`:`<div class="big ${u.q==='af'?'af':''}">${esc(c[u.q])}</div>`}</div>
 <div class="stack" id="op" style="margin-top:14px">${u.opts.map(o=>`<button class="opt ${u.k==='af'?'af-opt':''} ${done?(o===c[u.k]?'ok':o===st.pick?'bad':''):''}" data-o="${esc(o)}" ${done?'disabled':''}>${esc(o)}</button>`).join('')}</div>
 ${done?fbCard(st.ans,c.af,c.nl,c.voorbeeld?`<p class="ex" style="margin-top:6px">${esc(c.voorbeeld)}</p>`:'')+nextBtn('qnx',st.i+1>=st.q.length):''}`);
 if(done){$('#qnx').onclick=()=>{st.ans=null;st.pick=null;st.i++;st.cur=null;render()};return focusNext('qnx')}
 $('#op').onclick=e=>{const b=e.target.closest('.opt');if(!b||st.ans!=null)return;const ok=b.dataset.o===c[u.k];st.ans=ok;st.pick=b.dataset.o;
  if(ok){st.score++;count()}else{grade(c.id,false);st.wr.push(c);buzz('bad')}if(st.audio||u.q==='nl')speak(c.af);render()}};
