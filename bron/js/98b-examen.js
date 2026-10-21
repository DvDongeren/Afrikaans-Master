/* 98b-examen.js — Examen per niveau (30 vragen, geslaagd vanaf 80%) met certificaat.
   Alle bestanden in bron/js worden op volgorde samengevoegd tot één script (één scope).
   Resultaat in S.exam als {niveau: {b: beste percentage, p: tijdstip van eerste keer geslaagd}}. */
const EXN=30,EXPASS=80;
const LVNL={Beginner:'Beginner',Intermediate:'Gemiddeld (Intermediate)',Advanced:'Gevorderd (Advanced)'};
function examBuild(lv){const P=CARDS.filter(c=>!c.own&&c.niveau===lv&&okWord2(c)),used=new Set(),qs=[];
 const opts=(c,k)=>{const same=(BYCAT().get(c.categorie)||[]).filter(x=>x.id!==c.id&&x.niveau===lv&&x[k]!==c[k]),pool=shuffle(same.length>=3?same:P.filter(x=>x.id!==c.id&&x[k]!==c[k])),o=[];
  for(const x of pool){if(!o.includes(x[k])&&x[k].toLowerCase()!==c[k].toLowerCase())o.push(x[k]);if(o.length===3)break}return shuffle(o.concat(c[k]))};
 /* 10 gatenteksten uit voorbeeldzinnen van dit niveau */
 const G=GAPS().filter(g=>g.c.niveau===lv);
 for(const g of shuffle(G)){if(qs.length>=10)break;const same=G.filter(y=>y.w!==g.w&&y.c.categorie===g.c.categorie),pool=shuffle(same.length>=3?same:G.filter(y=>y.w!==g.w)),o=[];
  for(const y of pool){if(!o.includes(y.w))o.push(y.w);if(o.length===3)break}if(o.length<3)continue;used.add(g.c.id);
  qs.push({t:'gap',c:g.c,pre:g.pre,post:g.post,a:g.w,o:shuffle(o.concat(g.w))})}
 const rest=shuffle(P.filter(c=>!used.has(c.id)));let k=0;
 while(qs.length<EXN&&k<rest.length){const c=rest[k++],dir=qs.filter(q=>q.t==='na').length<=qs.filter(q=>q.t==='an').length?'na':'an',key=dir==='na'?'af':'nl';
  const o=opts(c,key);if(o.length<4)continue;qs.push({t:dir,c,q:dir==='na'?c.nl:c.af,a:c[key],o})}
 return shuffle(qs)}
/* ---------- overzicht ---------- */
V.examen=()=>{const E=S.exam||{};
 draw(`${back('oef','Oefenen')}<h1>Examen</h1><p class="muted" style="margin-top:8px">Laat zien wat je kunt: ${EXN} vragen per niveau, zonder hulp tussendoor. Met ${EXPASS}% of meer ben je geslaagd en krijg je een certificaat.</p>
 <div class="exgrid" style="margin-top:16px">${['Beginner','Intermediate','Advanced'].map((lv,i)=>{const e=E[lv];return`<div class="card exc ${e&&e.p?'passed':''}"><div class="row" style="gap:12px"><span class="msmedal ${e&&e.p?'t'+[2,4,6][i]:'off'}">${I.medal}</span><span class="grow"><h2>${LVNL[lv]}</h2><span class="muted small">${e?(e.p?`Geslaagd op ${new Date(e.p).toLocaleDateString('nl-NL',{day:'numeric',month:'long',year:'numeric'})} · beste ${e.b}%`:`Beste score ${e.b}% · nog niet geslaagd`):'Nog niet gedaan'}</span></span></div>
  <div class="row" style="margin-top:14px">${e&&e.p?`<button class="btn soft" data-cert="${lv}" style="box-shadow:inset 0 0 0 1.5px var(--hair)">${I.medal}Certificaat</button>`:''}<button class="btn" data-exgo="${lv}">${e?'Opnieuw':'Start examen'}</button></div></div>`}).join('')}</div>
 <p class="muted small" style="margin-top:14px">Er zijn drie soorten vragen: Nederlands naar Afrikaans, Afrikaans naar Nederlands en een woord invullen in een zin. Pas aan het eind zie je wat goed en fout was.</p>`);
 for(const b of app.querySelectorAll('[data-exgo]'))b.onclick=()=>go('exam',{lv:b.dataset.exgo});
 for(const b of app.querySelectorAll('[data-cert]'))b.onclick=()=>go('cert',{lv:b.dataset.cert})};
/* ---------- het examen ---------- */
V.exam=()=>{if(!st.q){st.q=examBuild(st.lv);st.i=0;st.a=[];if(st.q.length<20){draw(`${back('examen','Examen')}<p class="muted" style="margin-top:20px">Er zijn te weinig kaarten voor dit niveau geladen. Probeer het zo opnieuw.</p>`);st.q=null;return}}
 const n=st.q.length,u=st.q[st.i];
 if(!u){const ok=st.q.filter((q,i)=>st.a[i]===q.a).length,pc=Math.round(ok/n*100),pass=pc>=EXPASS;
  if(!st.saved){st.saved=1;S.exam=S.exam||{};const e=S.exam[st.lv]||{b:0};e.b=Math.max(e.b||0,pc);if(pass&&!e.p)e.p=Date.now();S.exam[st.lv]=e;count();saveNow()}
  const wr=st.q.map((q,i)=>({q,y:st.a[i]})).filter(x=>x.y!==x.q.a);
  result(ok,n,pass?'Geslaagd! Gefeliciteerd.':'Nog niet geslaagd',pass?`<button class="btn" data-certnow="1">${I.medal}Bekijk je certificaat</button><button class="btn ghost" data-a="examen">Terug naar examens</button>`:`<button class="btn" data-exagain="1">Opnieuw proberen</button><button class="btn ghost" data-a="examen">Terug naar examens</button>`,
   `<p class="muted">${pc}% goed${pass?'':` · je hebt ${EXPASS}% nodig (${Math.ceil(n*EXPASS/100)} vragen)`}</p>${wr.length?`<div class="sec" style="text-align:left">Wat er fout ging (${wr.length})</div><div class="stack" style="text-align:left">${wr.map(({q,y})=>`<div class="card exr"><div class="lbl">${q.t==='gap'?'Vul in':q.t==='na'?'Nederlands → Afrikaans':'Afrikaans → Nederlands'}</div><p class="${q.t==='an'||q.t==='gap'?'af':''}" style="margin-top:4px">${q.t==='gap'?esc(q.pre)+'<b>___</b>'+esc(q.post):esc(q.q)}</p><p class="small" style="margin-top:6px"><span class="bad-t">Jij: ${esc(y||'(niets)')}</span> · <span class="ok-t">Goed: ${esc(q.a)}</span></p></div>`).join('')}</div>`:''}`);
  const c=$('[data-certnow]');if(c)c.onclick=()=>go('cert',{lv:st.lv});const g=$('[data-exagain]');if(g)g.onclick=()=>go('exam',{lv:st.lv});return}
 const qh=u.t==='gap'?`<div class="lbl">Vul het ontbrekende woord in</div><div class="big af gapq">${esc(u.pre)}<span class="gap"> ? </span>${esc(u.post)}</div>`
  :`<div class="lbl">${u.t==='na'?'Wat is dit in het Afrikaans?':'Wat betekent dit?'}</div><div class="big ${u.t==='an'?'af':''}">${esc(u.q)}</div>`;
 draw(`${topbar(st.i,n,'examen')}<div class="lbl" style="margin:0 4px 8px">Examen ${esc(st.lv)} · geen hulp tussendoor</div><div class="card q">${qh}</div>
 <div class="stack" id="op" style="margin-top:14px">${u.o.map(o=>`<button class="opt ${u.t==='an'?'':'af-opt'}" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>
 <button class="btn ghost" id="exsk" style="margin-top:12px">Weet ik niet</button>`);
 const s0=st,next=v=>{st.a[st.i]=v;setTimeout(()=>{if(st!==s0||view!=='exam')return;st.i++;V.exam();scrollTo(0,0)},180)};
 $('#op').onclick=e=>{const b=e.target.closest('.opt');if(!b||st.a[st.i]!==undefined)return;b.classList.add('sel');for(const x of $('#op').children)x.disabled=true;next(b.dataset.o)};
 $('#exsk').onclick=()=>{if(st.a[st.i]===undefined)next('')}};
/* ---------- certificaat ---------- */
const certName=()=>{try{return localStorage.getItem('af2n')||''}catch{return''}};
async function drawCert(cv,lv,name){const W=1600,H=1130;cv.width=W;cv.height=H;const g=cv.getContext('2d'),e=(S.exam||{})[lv]||{};
 try{await Promise.all(['600 80px Lora','400 40px Lora','italic 400 40px Lora'].map(f=>document.fonts.load(f)))}catch{}
 g.fillStyle='#fbf8ef';g.fillRect(0,0,W,H);
 g.strokeStyle='#14704a';g.lineWidth=14;g.strokeRect(40,40,W-80,H-80);g.strokeStyle='#e3a20f';g.lineWidth=3;g.strokeRect(70,70,W-140,H-140);
 const T=(t,y,font,col)=>{g.font=font;g.fillStyle=col;g.textAlign='center';g.fillText(t,W/2,y)};
 T('AFRIKAANS MASTER',190,'700 38px Lora, Georgia, serif','#14704a');
 T('Sertifikaat',300,'600 104px Lora, Georgia, serif','#14201a');
 T('Certificaat',360,'italic 400 42px Lora, Georgia, serif','#5b6860');
 T('Hiermee word bevestig dat',450,'400 38px Lora, Georgia, serif','#5b6860');
 const nm=(name||'').trim()||'—';T(nm.length>32?nm.slice(0,31)+'…':nm,560,'600 84px Lora, Georgia, serif','#14704a');
 g.strokeStyle='#cfc6ad';g.lineWidth=2;g.beginPath();g.moveTo(420,590);g.lineTo(W-420,590);g.stroke();
 T('die Afrikaanse eksamen op vlak '+lv+' geslaag het',670,'400 44px Lora, Georgia, serif','#14201a');
 T('(het Afrikaans-examen op niveau '+({Beginner:'Beginner',Intermediate:'Gemiddeld',Advanced:'Gevorderd'}[lv]||lv)+' heeft gehaald)',725,'italic 400 32px Lora, Georgia, serif','#5b6860');
 T('Score: '+(e.b||0)+'%  ·  '+(e.p?new Date(e.p).toLocaleDateString('nl-NL',{day:'numeric',month:'long',year:'numeric'}):''),820,'400 36px Lora, Georgia, serif','#14201a');
 /* zegel */
 const cx=W-300,cy=H-250;g.fillStyle='#e3a20f';g.beginPath();for(let i=0;i<24;i++){const a=i/24*Math.PI*2,r=i%2?92:104;g.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}g.closePath();g.fill();
 g.fillStyle='#fbeecb';g.beginPath();g.arc(cx,cy,74,0,7);g.fill();g.fillStyle='#7f5500';g.textAlign='center';{const t=lv.toUpperCase();let fs=30;g.font=`700 ${fs}px Lora, Georgia, serif`;while(fs>14&&g.measureText(t).width>124){fs--;g.font=`700 ${fs}px Lora, Georgia, serif`}g.fillText(t,cx,cy+fs/3)}
 g.fillStyle='#5b6860';g.font='400 30px Lora, Georgia, serif';g.textAlign='left';g.fillText(location.host||'Afrikaans Master',140,H-150)}
V.cert=()=>{const lv=st.lv,e=(S.exam||{})[lv];if(!e||!e.p)return go('examen');const nm=certName()||(cloud.user&&cloud.user.name)||'';
 draw(`${back('examen','Examen')}<h1>Je certificaat</h1><p class="muted" style="margin-top:8px">Vul je naam in zoals die op het certificaat moet staan. Je naam wordt alleen op dit toestel bewaard.</p>
 <label class="lbl" for="cnm" style="margin-top:14px">Naam</label><input type="text" id="cnm" maxlength="40" autocomplete="name" value="${esc(nm)}" style="margin-top:8px">
 <canvas id="cv" class="certcv" aria-label="Certificaat ${esc(lv)}"></canvas>
 <div class="row" style="margin:14px 0 120px">${navigator.share?`<button class="btn" id="csh">${I.share}Delen</button>`:''}<button class="btn ${navigator.share?'ghost':''}" id="cdl">${I.dl}Opslaan als afbeelding</button></div><p class="muted small" id="cms" role="status"></p>`);
 const cv=$('#cv');let ready=drawCert(cv,lv,nm),t;
 $('#cnm').oninput=e2=>{clearTimeout(t);t=setTimeout(()=>{const v=e2.target.value.slice(0,40);try{localStorage.setItem('af2n',v)}catch{}ready=drawCert(cv,lv,v)},200)};
 const blob=async()=>{await ready;return new Promise(r=>cv.toBlob(r,'image/png'))},fn='afrikaans-certificaat-'+lv.toLowerCase()+'.png';
 $('#cdl').onclick=async()=>{const b=await blob(),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=fn;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);$('#cms').textContent='Certificaat opgeslagen.'};
 const sh=$('#csh');if(sh)sh.onclick=async()=>{const b=await blob(),f=new File([b],fn,{type:'image/png'});try{if(navigator.canShare&&navigator.canShare({files:[f]}))await navigator.share({files:[f],text:'Ek het my Afrikaanse eksamen geslaag!'});else await navigator.share({text:'Ek het my Afrikaanse eksamen geslaag! '+location.origin+location.pathname})}catch(x){if(x&&x.name!=='AbortError')$('#cms').textContent='Delen lukte niet; gebruik Opslaan als afbeelding.'}}};
