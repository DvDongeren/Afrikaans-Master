/* 30-kaarten-paden.js — Kaarten, paden en dialogen.
   Alle bestanden in bron/js worden op volgorde samengevoegd tot één script (één scope). */
/* ---------- kaarten ---------- */
V.kaart=()=>{st.q=st.q||'';st.lv=st.lv||'Alles';
 draw(`<h1>Kaarten</h1><div class="stack" style="margin-top:16px"><input type="search" id="s" placeholder="Zoek in Nederlands of Afrikaans" value="${esc(st.q)}" aria-label="Zoeken">
 <div class="chips" id="lv">${['Alles','Beginner','Intermediate','Advanced','Favorieten'].map(l=>`<button class="chip ${st.lv===l?'on':''}" data-lv="${l}">${l==='Favorieten'?I.star:''}${l}</button>`).join('')}</div>
 <div class="row"><button class="btn soft" data-a="own" style="box-shadow:inset 0 0 0 1.5px var(--hair)">${I.plus}Eigen kaart</button><button class="btn soft" data-pr="1" style="box-shadow:inset 0 0 0 1.5px var(--hair)">${I.print}Spiekbrief</button></div>
 <div class="topics" id="tp" role="list" aria-label="Onderwerpen">${(S.own.length?['Eigen kaarten'].concat(META.cat):META.cat).map(c=>`<button class="topic ${catHue(c)} ${st.cat===c?'on':''}" data-tp="${esc(c)}" role="listitem" aria-pressed="${st.cat===c}"><span class="ti">${catIcon(c)}</span><span>${esc(c)}</span></button>`).join('')}</div>
 <select class="sel" id="cat" aria-label="Categorie"><option value="">Alle categorieën</option>${(S.own.length?['Eigen kaarten'].concat(META.cat):META.cat).map(c=>`<option ${st.cat===c?'selected':''}>${esc(c)}</option>`).join('')}</select><div id="ls"></div></div>`);
 let lim=25;const list=()=>{const q=norm(st.q.trim()),f=new Set(S.favs),ix=q?IDX():null,lv=st.lv,cat=st.cat,r=[];
  const keep=c=>!(cat&&c.categorie!==cat)&&!(lv!=='Alles'&&(lv==='Favorieten'?!f.has(c.id):c.niveau!==lv));
  for(let i=0;i<CARDS.length;i++){const c=CARDS[i];if(ix&&!ix[i].includes(q))continue;if(keep(c))r.push(c)}
  let fz=false;if(q&&!r.length){for(const i of fuzzyCards(q))if(keep(CARDS[i]))r.push(CARDS[i]);fz=r.length>0}
  $('#ls').innerHTML=`<div class="muted" style="margin:2px 4px 10px">${fz?`Geen exacte treffers. Bedoelde je een van deze ${r.length}?`:r.length+' kaarten'}</div>${r.length?`<div class="list grid2">${r.slice(0,lim).map(c=>`<div class="li entry-li"><div class="row sp"><div class="af grow">${esc(c.af)}</div><button class="icon star sm ${f.has(c.id)?'on':''}" data-f="${c.id}" aria-label="Favoriet" aria-pressed="${f.has(c.id)}">${I.star}</button>${spk(c.af,'sm')}</div><div class="nl">${esc(c.nl)}</div>${c.voorbeeld?`<p class="ex" style="margin-top:4px">${esc(c.voorbeeld)}</p>${exnl(c)}`:''}${c.tips?`<div class="tip">${esc(c.tips)}</div>`:''}<div class="row sp meta"><span>${esc(c.categorie)}${c.own?'':' · '+c.niveau}</span>${c.own?`<button class="linkbtn" data-del="${c.id}">${I.trash}Verwijderen</button>`:`<button class="linkbtn" data-rep="${c.id}">${I.flag}Klopt niet?</button>`}</div></div>`).join('')}</div>`:'<div class="card muted">Geen kaarten gevonden. Probeer een ander woord of filter.</div>'}${r.length>lim?'<button class="btn ghost" id="mr" style="margin-top:12px">Meer laden</button>':''}`;
  const m=$('#mr');if(m)m.onclick=()=>{lim+=25;list()}};
 const syncTp=()=>{for(const b of $('#tp').children){const on=b.dataset.tp===st.cat;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)}};
 list();$('#cat').onchange=e=>{st.cat=e.target.value;lim=25;syncTp();list()};
 $('#tp').onclick=e=>{const b=e.target.closest('[data-tp]');if(!b)return;st.cat=st.cat===b.dataset.tp?'':b.dataset.tp;$('#cat').value=st.cat;lim=25;syncTp();list()};
 {const on=$('#tp .on');if(on)on.scrollIntoView({inline:'center',block:'nearest'})}
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
