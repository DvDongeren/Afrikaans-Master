/* 40-taal.js — Grammatica, meerkeuze-oefeningen, zinnen bouwen, reisgids en cultuur.
   Alle bestanden in bron/js worden op volgorde samengevoegd tot één script (één scope). */
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
