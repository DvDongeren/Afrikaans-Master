/* 88-melden-zoeken.js — Melden, sessie-afhandeling, voortgangskalender en zoeken.
   Alle bestanden in bron/js worden op volgorde samengevoegd tot één script (één scope). */
/* ---------- melden ---------- */
function reportText(){return S.reports.map(r=>`${r.af} = ${r.nl} (kaart ${r.id}): ${r.note||'geen toelichting'}`).join('\n')}
function sheet(html,onOpen){let el=document.getElementById('sheet');if(el)el.remove();el=document.createElement('div');el.id='sheet';el.innerHTML=`<div class="sheet-bg" data-close="1"></div><div class="sheet" role="dialog" aria-modal="true">${html}</div>`;document.body.appendChild(el);
 el.addEventListener('click',e=>{if(e.target.closest('[data-close]'))el.remove()});onOpen&&onOpen(el)}
function report(id){const c=byId().get(id);if(!c)return;
 sheet(`<h2>Klopt deze kaart niet?</h2><p style="margin:10px 0 4px"><span class="af" style="font-size:1.15rem">${esc(c.af)}</span> <span class="nl">= ${esc(c.nl)}</span></p><p class="muted" style="margin-bottom:12px">Beschrijf kort wat er niet klopt. We kijken de kaart dan na.</p>
 <textarea id="rn" maxlength="500" placeholder="Bijvoorbeeld: de voorbeeldzin is onnatuurlijk" aria-label="Toelichting"></textarea><div class="row" style="margin-top:12px"><button class="btn ghost" data-close="1">Annuleren</button><button class="btn" id="rsv">Melden</button></div>`,el=>{
  setTimeout(()=>el.querySelector('#rn').focus(),50);
  el.querySelector('#rsv').onclick=async()=>{const b=el.querySelector('#rsv');b.disabled=true;b.textContent='Versturen…';const r={id,af:c.af,nl:c.nl,note:el.querySelector('#rn').value.trim(),t:Date.now()};
   const sent=await sendReport(r);if(!sent){S.reports=S.reports.filter(x=>x.id!==id);S.reports.push(r);saveNow()}
   el.querySelector('.sheet').innerHTML=`<h2>Bedankt!</h2><p class="muted" style="margin:8px 0 14px">${sent?'Je melding is verstuurd. We kijken de kaart na.':'Je melding is op dit toestel bewaard. Je vindt hem in Meer, waar je hem kunt kopiëren.'}</p><button class="btn" data-close="1">Sluiten</button>`}})}

/* ---------- sessie: beoordelen en vegen ---------- */
function sessGrade(ok){const c=st.q[st.i];if(!c||!st.open)return;st.swiped=0;grade(c.id,ok);if(!ok)buzz('bad');st.done++;if(!ok&&!st.retry.includes(c.id)){st.retry.push(c.id);st.q.push(c)}st.i++;st.open=false;st.tv=undefined;render()}
let drag=null;
document.addEventListener('pointerdown',e=>{if(view!=='sess'||!st.open)return;const fc=e.target.closest('#fc');if(!fc||e.target.closest('button,a,input'))return;drag={x:e.clientX,y:e.clientY,el:fc,dx:0,tick:0};fc.style.transition='none'});
document.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dx)<12)return;drag.dx=dx;
 drag.el.style.transform=`translateX(${dx}px) rotate(${dx/22}deg)`;drag.el.classList.toggle('sw-ok',dx>60);drag.el.classList.toggle('sw-no',dx<-60);
 const past=Math.abs(dx)>90;if(past&&!drag.tick){drag.tick=1;buzz('ok')}else if(!past)drag.tick=0});
const endDrag=()=>{if(!drag)return;const{dx,el}=drag;drag=null;el.style.transition='transform .22s ease';
 if(Math.abs(dx)>90){el.style.transform=`translateX(${dx>0?520:-520}px) rotate(${dx>0?18:-18}deg)`;const s0=st,i0=st.i;st.swiped=1;setTimeout(()=>{if(st===s0&&view==='sess'&&st.i===i0)sessGrade(dx>0)},180)}
 else{el.style.transform='';el.classList.remove('sw-ok','sw-no')}};
document.addEventListener('pointerup',endDrag);document.addEventListener('pointercancel',endDrag);

/* ---------- voortgangskalender ---------- */
function longestStreak(){const ds=[...new Set([...Object.keys(S.days).filter(k=>S.days[k]>0),...(S.frzD||[])])].sort();let best=0,cur=0,prev=null;
 for(const k of ds){const t=new Date(k+'T12:00:00').getTime();cur=prev!==null&&Math.round((t-prev)/DAY)===1?cur+1:1;best=Math.max(best,cur);prev=t}return best}
function calendar(){const W=26,g=S.goal,today=new Date();today.setHours(12,0,0,0);const dow=(today.getDay()+6)%7,start=new Date(today.getTime()-(dow+7*(W-1))*DAY);
 const FZ=new Set(S.frzD||[]),md=['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'],wd=['ma','di','wo','do','vr','za','zo'];let cells='',active=0,total=0,months='';
 for(const k in S.days){if(S.days[k]>0){active++;total+=S.days[k]}}
 for(let w=0;w<W;w++){const first=new Date(start.getTime()+w*7*DAY);months+=`<span>${first.getDate()<=7?md[first.getMonth()]:''}</span>`;
  for(let d=0;d<7;d++){const dt=new Date(start.getTime()+(w*7+d)*DAY);if(dt>today){cells+='<i class="fut"></i>';continue}
   const ds=fmt(dt),n=S.days[ds]||0,l=!n?0:n<g/2?1:n<g?2:3,fz=!n&&FZ.has(ds);cells+=`<i class="${fz?'frz':'l'+l}" title="${wd[d]} ${dt.getDate()} ${md[dt.getMonth()]}: ${fz?'rustdag gebruikt':n+' '+(n===1?'kaart':'kaarten')}"></i>`}}
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
 if(D.pics)PICS().items.forEach(x=>add('Plaatjes',x[0],x[1],['beeld',{tab:'wb',th:x[2]}]));
 PATHS().forEach(p=>add('Paden',p.title,p.desc,['path',{p:p.id}]));
 const m=MED();m.muziek.forEach(x=>add('Muziek',x.n,x.g+(x.s?' · '+x.s:''),['media',{tab:'muziek'}],x.d));
 m.films.forEach(x=>add('Films',x.t,x.g+(x.j?' · '+x.j:''),['media',{tab:'films'}],x.d));m.series.forEach(x=>add('Series',x.t,x.g,['media',{tab:'series'}],x.d));
 return a});
V.zoek=()=>{draw(`<h1>Zoeken</h1><p class="muted" style="margin:8px 0 14px">Zoek in kaarten, dialogen, verhalen, grammatica, paden en meer.</p><input type="search" id="zq" placeholder="Bijvoorbeeld: braai, nie, lughawe" aria-label="Zoeken" value="${esc(st.q||'')}" autocomplete="off"><div id="zr" style="margin-top:6px"></div>`);
 const run=()=>{const q=norm($('#zq').value.trim());st.q=$('#zq').value;syncHash();const out=$('#zr');st.res=[];
  if(q.length<2){out.innerHTML='<p class="muted" style="margin-top:16px">Typ minstens twee letters.</p>';return}
  const ix=IDX(),cards=[];for(let i=0;i<CARDS.length;i++)if(ix[i].includes(q))cards.push(CARDS[i]);
  let groups={};for(const r of SIDX())if(r.k.includes(q))(groups[r.t]=groups[r.t]||[]).push(r);
  let fz=false;if(!cards.length&&!Object.keys(groups).length&&q.length>=4&&!q.includes(' ')){fz=true;for(const i of fuzzyCards(q))cards.push(CARDS[i]);
   for(const r of SIDX())if((r.w||(r.w=r.k.split(/[^\p{L}\p{N}]+/u).filter(w=>w.length>=3))).some(w=>fuzzyOk(w,q)))(groups[r.t]=groups[r.t]||[]).push(r)}
  let h=fz&&(cards.length||Object.keys(groups).length)?`<p class="muted" style="margin-top:14px">Geen exacte treffers voor “${esc($('#zq').value.trim())}”. Bedoelde je:</p>`:'';if(cards.length)h+=`<div class="sec">Kaarten · ${cards.length}</div><div class="list">${cards.slice(0,5).map(c=>`<div class="li"><span class="grow"><span class="af" style="font-size:1.12rem;display:block">${esc(c.af)}</span><span class="nl">${esc(c.nl)}</span></span>${spk(c.af,'sm')}</div>`).join('')}${cards.length>5?`<button class="li" data-zk="1" style="color:var(--nl);font-weight:600">Alle ${cards.length} kaarten bekijken</button>`:''}</div>`;
  for(const[t,rs]of Object.entries(groups)){h+=`<div class="sec">${t} · ${rs.length}</div><div class="list">${rs.slice(0,5).map(r=>{st.res.push(r);return row(`data-zr="${st.res.length-1}"`,null,`<span class="${/Grammatica|Paden/.test(t)?'':'af'}">${esc(r.title)}</span>`,esc(r.sub))}).join('')}</div>`}
  out.innerHTML=h||`<div class="card muted" style="margin-top:16px">Niets gevonden voor “${esc($('#zq').value.trim())}”. Probeer een kortere zoekterm.</div>`};
 let t;$('#zq').oninput=()=>{clearTimeout(t);t=setTimeout(run,140)};run();requestAnimationFrame(()=>$('#zq').focus())};
