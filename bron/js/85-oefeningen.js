/* 85-oefeningen.js — Valse vrienden, verhaaltjes, luisteren, niveautoets en eigen kaarten.
   Alle bestanden in bron/js worden op volgorde samengevoegd tot één script (één scope). */
/* ---------- valse vrienden ---------- */
V.vv=()=>{const VV=Y().VV;
 draw(`${back('oef','Oefenen')}<h1>Valse vrienden</h1><p class="muted" style="margin:8px 0 16px">Woorden die op Nederlands lijken, maar in het Afrikaans iets anders betekenen.</p><button class="btn" data-a="mc:vv">Oefen met 10 vragen</button>
 <div class="stack cols" style="margin-top:16px">${VV.map(v=>`<div class="card vv"><div class="row sp"><div class="af">${esc(v.af)}</div>${spk(v.af,'sm')}</div>
 <div class="pair"><div><div class="lbl">Je denkt</div><div class="strike">${esc(v.schijn)}</div></div><div><div class="lbl">Het betekent</div><div style="font-weight:650">${esc(v.echt)}</div></div></div>
 <div class="bub"><div class="af">${esc(v.ex[0])}</div><div class="nl" style="font-size:.92rem">${esc(v.ex[1])}</div></div><p class="muted" style="margin-top:10px">${esc(v.tip)}</p></div>`).join('')}</div>`)};

/* ---------- verhaaltjes ---------- */
V.stories=()=>{const ST=Y().ST,n=ST.filter(x=>S.stories[x.id]).length;
 draw(`${back('oef','Oefenen')}<h1>Verhaaltjes</h1><p class="muted" style="margin:8px 0 16px">${n} van ${ST.length} gelezen</p>
 <div class="list grid2">${ST.map(x=>row(`data-story="${x.id}"`,null,esc(x.t),x.niv+' · '+x.s.length+' zinnen',S.stories[x.id]?mark(1):undefined)).join('')}</div>`)};
const CG=L(()=>{const m=new Map(),bad=new Set();for(const c of CARDS){const k=c.af.toLowerCase();if(!/^\p{L}+$/u.test(k))continue;const v=m.get(k);if(v!==undefined&&v!==c.nl)bad.add(k);else m.set(k,c.nl)}bad.forEach(k=>m.delete(k));return m});
const wordRe=/('n(?!\p{L})|\p{L}+(?:['’-]\p{L}+)*)/gu;
function gloss(w,x){const k=w.toLowerCase();return k==="'n"?'een':x.g[k]||Y().G0[k]||CG().get(k)||null}
V.story=()=>{const x=Y().ST.find(z=>z.id===st.id);if(!x)return go('stories');
 const html=x.s.map(p=>`<p>${p[0].split(wordRe).map((t,j)=>j%2?`<span class="w" data-w="${esc(t)}">${esc(t)}</span>`:esc(t)).join('')}${spk(p[0],'sm')}${st.tr?`<span class="nl">${esc(p[1])}</span>`:''}</p>`).join('');
 draw(`<div class="row sp">${back('back','Verhaaltjes')}<button class="chip ${st.tr?'on':''}" id="tt" style="margin-top:-14px">Vertaling</button></div><h1>${esc(x.t)}</h1><p class="muted" style="margin:8px 0 16px">${x.niv} · tik op een woord voor de vertaling</p>
 <div class="card reader">${html}</div>
 <div class="row" style="margin:16px 0 120px"><button class="btn soft" id="pl">${I.spk}Voorlezen</button><button class="btn" id="fin">${S.stories[x.id]?'Opnieuw gelezen':'Klaar met lezen'}</button></div><div id="wp" role="status"></div>`);
 $('#tt').onclick=()=>{st.tr=!st.tr;V.story()};
 $('#pl').onclick=()=>speakAll(x.s.map(p=>p[0]));
 $('#fin').onclick=()=>{if(!S.stories[x.id]){S.stories[x.id]=1;count()}saveNow();go('stories')}};
function storyWord(w){const x=Y().ST.find(z=>z.id===st.id);for(const z of app.querySelectorAll('.w.on'))z.classList.remove('on');w.classList.add('on');
 const t=w.dataset.w,g=gloss(t,x),p=$('#wp');p.style.display='block';
 p.innerHTML=`<div class="row sp"><div class="grow"><div class="af" style="font-size:1.25rem">${esc(t)}</div><div>${g?esc(g):'<span class="muted">Geen vertaling bekend. Zet "Vertaling" aan.</span>'}</div></div>${spk(t)}</div>`}

/* ---------- oude voortgang ---------- */
async function importOld(){await load('ext');let srs,favs;try{srs=JSON.parse(localStorage.getItem('af_srs')||'null');favs=JSON.parse(localStorage.getItem('af_favs')||'null')}catch{}
 const DUP=X().DUP,m=byId(),rs=id=>{let n=0;id=+id;while(DUP[id]!==undefined&&n++<8)id=DUP[id];return m.has(id)?id:null};let a=0,b=0;
 if(srs&&typeof srs==='object')for(const[k,r]of Object.entries(srs)){const id=rs(k);if(id===null||!r)continue;const iv=+r.interval||0,box=iv<=0?0:iv<=1?1:iv<=3?2:iv<=7?3:iv<=14?4:iv<=30?5:6,old=S.srs[id];
  if(!old||old.box<box){S.srs[id]={box,due:+r.due>1e11?+r.due:Date.now(),t:Date.now()};a++}}
 if(Array.isArray(favs))for(const k of favs){const id=rs(k);if(id!==null&&!S.favs.includes(id)){S.favs.push(id);b++}}
 saveNow();return[a,b]}

/* ---------- moeilijke kaarten ---------- */
function weakList(){const m=byId(),out=[];for(const k in S.srs){const r=S.srs[k];if(r.box<=1&&r.t){const c=m.get(+k);if(c)out.push([c,r.t])}}return out.sort((a,b)=>b[1]-a[1]).map(x=>x[0])}
V.weak=()=>{const w=weakList();if(!w.length){draw(`${back('oef','Oefenen')}<h1>Moeilijke kaarten</h1><div class="card" style="margin-top:16px"><p>Je hebt nog geen moeilijke kaarten. Kaarten die je fout hebt in een sessie of quiz komen hier vanzelf terecht.</p></div><button class="btn" data-a="sess" style="margin-top:16px">Start een gewone sessie</button>`);return}
 go('sess',{q:shuffle(w.slice(0,20))})};

/* ---------- luisteren ---------- */
const LPOOL=L(()=>{const a=[],seen=new Set();const add=(af,nl)=>{const w=af.split(/\s+/).length;if(w<2||w>9||seen.has(af))return;seen.add(af);a.push({af,nl})};
 X().REIS.forEach(r=>add(r.af,r.nl));DLG().forEach(d=>d.lines.forEach(l=>add(l.af,l.nl)));return a});
function wordDiff(typed,goal){const T=nzs(typed).split(' ').filter(Boolean),G=goal.split(/\s+/);let ok=0;
 const html=G.map((g,i)=>{const good=T[i]!==undefined&&T[i]===nzs(g);if(good)ok++;return`<span class="${good?'okw':'badw'}">${esc(g)}</span>`}).join(' ');return{ok:ok===G.length&&T.length===G.length,html}}
V.luister=()=>{
 if(!st.items){if(!st.go){draw(`${back('oef','Oefenen')}<h1>Luisteren</h1><p class="muted" style="margin:8px 0 16px">Je hoort een Afrikaanse zin. Typ wat je hoort. Hoofdletters en leestekens tellen niet mee.</p>${canSpeak()?'':'<div class="tip">Je toestel heeft geen spraakfunctie, dus deze oefening werkt hier niet.</div>'}<div class="card muted">Tip: werkt de uitspraak niet goed? Zet in je telefoon bij Tekst-naar-spraak een Afrikaanse of Nederlandse stem aan. In Meer kun je de spraaksnelheid instellen.</div><button class="btn" id="lgo" style="margin-top:16px" ${canSpeak()?'':'disabled'}>Start met 10 zinnen</button>`);$('#lgo').onclick=()=>{st.go=1;V.luister()};return}
  st.items=shuffle(LPOOL()).slice(0,10);st.i=0;st.sc=0;st.res=null}
 const u=st.items[st.i],n=st.items.length;
 if(!u){result(st.sc,n,praise(st.sc,n),'<button class="btn" data-a="luister">Nog een ronde</button><button class="btn ghost" data-a="oef">Terug naar oefenen</button>');return}
 const r=st.res;
 draw(`${topbar(st.i,n,'oef')}<div class="card q"><div class="lbl">Luister en typ</div><div class="row" style="justify-content:center;gap:14px;margin-top:12px"><button class="icon" style="width:72px;height:72px" id="lp" aria-label="Afspelen">${I.spk}</button><button class="chip" id="ls2">Langzaam</button></div></div>
 ${r?`<div class="card stack" style="margin-top:12px"><div class="lbl">${r.ok?'Helemaal goed!':'Zo moest het:'}</div><div class="af" style="font-size:1.2rem;line-height:1.6">${r.html}</div><div class="nl">${esc(u.nl)}</div>${r.ok?'':`<div class="muted">Jij typte: ${esc(r.typed)||'(niets)'}</div>`}</div><button class="btn" id="ln" style="margin-top:12px">${st.i+1<n?'Volgende':'Klaar'}</button>`
 :`<form id="lf" style="margin-top:12px"><input type="text" id="la" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Typ wat je hoort" aria-label="Wat hoor je?"><div class="row" style="margin-top:10px"><button type="button" class="btn ghost" id="lsk">Weet ik niet</button><button class="btn" type="submit">Controleer</button></div></form>`}`);
 $('#lp').onclick=()=>speak(u.af);$('#ls2').onclick=()=>speak(u.af,.6);
 if(r){$('#ln').onclick=()=>{st.i++;st.res=null;V.luister();scrollTo(0,0)};return}
 const check=v=>{const d=wordDiff(v,u.af);st.res={ok:d.ok,html:d.html,typed:v.trim()};if(d.ok){st.sc++;count()}else buzz('bad');V.luister()};
 $('#lf').onsubmit=e=>{e.preventDefault();check($('#la').value)};$('#lsk').onclick=()=>check('');
 if(!st.played){st.played=st.i+1;setTimeout(()=>speak(u.af),250)}else if(st.played!==st.i+1){st.played=st.i+1;setTimeout(()=>speak(u.af),250)}
 requestAnimationFrame(()=>{const t=$('#la');t&&t.focus()})};

/* ---------- niveautoets ---------- */
V.toets=()=>{
 if(!st.items){const pick=lv=>shuffle(CARDS.filter(c=>!c.own&&c.niveau===lv&&okWord2(c))).slice(0,4).map(c=>({c,lv}));
  st.items=[...pick('Beginner'),...pick('Intermediate'),...pick('Advanced')];st.i=0;st.res={Beginner:0,Intermediate:0,Advanced:0};st.ans=null}
 const it=st.items[st.i],n=st.items.length;
 if(!it){const R=st.res,lv=R.Beginner<3?'Beginner':R.Intermediate<3?'Intermediate':'Advanced',nm={Beginner:'Beginner',Intermediate:'Intermediate',Advanced:'Advanced'};
  S.startLv=lv;S.lvDone=true;ORDER.reset();saveNow();
  draw(`<div class="result stack"><div class="score" style="font-size:2.6rem">${nm[lv]}</div><h1>Hier begin je</h1><p class="muted">Beginner ${R.Beginner}/4 · Intermediate ${R.Intermediate}/4 · Advanced ${R.Advanced}/4</p><p class="muted">${lv==='Beginner'?'We beginnen bij de basis.':lv==='Intermediate'?'Je kent de basis al. Nieuwe kaarten beginnen bij Intermediate.':'Je kent de basis en Intermediate al. Nieuwe kaarten beginnen bij Advanced.'} Je kunt dit altijd aanpassen in Meer.</p><div class="stack" style="margin-top:22px"><button class="btn" data-a="sess">Start je sessie</button><button class="btn ghost" data-a="home">Home</button></div></div>`);return}
 const c=it.c;if(!st.cur||st.cur.id!==c.id){const same=CARDS.filter(x=>!x.own&&x.niveau===it.lv&&x.id!==c.id&&x.af!==c.af),opts=[];for(const x of shuffle(same)){if(!opts.includes(x.af))opts.push(x.af);if(opts.length===3)break}st.cur={id:c.id,opts:shuffle(opts.concat(c.af))}}
 draw(`${topbar(st.i,n,'home')}<div class="card q"><div class="lbl">Wat is dit in het Afrikaans?</div><div class="big">${esc(c.nl)}</div></div>
 <div class="stack" id="op" style="margin-top:14px">${st.cur.opts.map(o=>`<button class="opt af-opt" data-o="${esc(o)}">${esc(o)}</button>`).join('')}<button class="btn ghost" id="tdk">Weet ik niet</button></div>`);
 const s0=st,next=ok=>{if(ok)st.res[it.lv]++;setTimeout(()=>{if(st!==s0||view!=='toets')return;st.i++;st.cur=null;st.ans=null;V.toets()},ok?500:900)};
 $('#op').onclick=e=>{const b=e.target.closest('.opt');if(!b||st.ans)return;st.ans=1;const ok=b.dataset.o===c.af;for(const x of $('#op').querySelectorAll('.opt')){if(x.dataset.o===c.af)x.classList.add('ok');x.disabled=true}if(!ok)b.classList.add('bad');next(ok)};
 $('#tdk').onclick=()=>{if(st.ans)return;st.ans=1;next(false)}};
const okWord2=c=>c.nl.toLowerCase()!==c.af.toLowerCase()&&c.af.length<=30;

/* ---------- eigen kaarten ---------- */
const resetCards=()=>{[byId,IDX,TOK,BYCAT,ORDER,GAPS].forEach(f=>f.reset());CG.reset()};
V.own=()=>{draw(`${back('back','Kaarten')}<h1>Eigen kaart</h1><p class="muted" style="margin:8px 0 16px">Voeg een woord of zin toe. Hij komt in je dagelijkse sessie als eerstvolgende nieuwe kaart.</p>
 <form id="of" class="stack"><label class="lbl" for="onl">Nederlands</label><input type="text" id="onl" required maxlength="120" autocomplete="off" placeholder="bijvoorbeeld: stoplicht">
 <label class="lbl" for="oaf">Afrikaans</label><input type="text" id="oaf" required maxlength="120" autocomplete="off" autocapitalize="off" placeholder="bijvoorbeeld: robot">
 <label class="lbl" for="ovb">Voorbeeldzin (mag leeg)</label><input type="text" id="ovb" maxlength="300" autocomplete="off" placeholder="bijvoorbeeld: Draai links by die robot.">
 <button class="btn" type="submit">Opslaan</button><p class="muted" id="om" role="status"></p></form>`);
 $('#of').onsubmit=e=>{e.preventDefault();const nl=$('#onl').value.trim(),af=$('#oaf').value.trim(),vb=$('#ovb').value.trim();if(!nl||!af){$('#om').textContent='Vul Nederlands en Afrikaans in.';return}
  let id=-Date.now();for(const o of S.own)if(o.id===id)id--;const o={id,nl,af,vb};S.own.push(o);CARDS.push(ownCard(o));resetCards();saveNow();
  $('#om').textContent='Opgeslagen: '+af+'.';$('#onl').value='';$('#oaf').value='';$('#ovb').value='';$('#onl').focus()}};
function delOwn(id){const c=byId().get(id);if(!c||!confirm('Eigen kaart "'+c.af+'" verwijderen?'))return;S.own=S.own.filter(o=>o.id!==id);delete S.srs[id];S.favs=S.favs.filter(x=>x!==id);
 const i=CARDS.findIndex(x=>x.id===id);if(i>=0)CARDS.splice(i,1);resetCards();saveNow();V.kaart()}
