/* 93-mijlpalen.js — Mijlpalen: reeksen met oplopende niveaus, voortgang naar de volgende stap en een felicitatie.
   Alle bestanden in bron/js worden op volgorde samengevoegd tot één script (één scope).
   Behaalde mijlpalen staan in S.ms als {id: tijdstip}; S.ms._ markeert dat de eerste stille controle gedaan is. */
const MSKL=['Brons','Zilver','Goud','Smaragd','Saffier','Robijn','Diamant','Legende','Legende+'];
const fmtN=n=>n.toLocaleString('nl-NL');
const MS1={'dagen op rij':'dag op rij',dagen:'dag',weekenden:'weekend',antwoorden:'antwoord',kaarten:'kaart',onderwerpen:'onderwerp',dialogen:'dialoog',lessen:'les',verhalen:'verhaal',paden:'pad',punten:'punt',favorieten:'favoriet'};
const msU=(f,n)=>n===1?(MS1[f.u]||f.u):f.u;
/* Alle cijfers waar mijlpalen op letten, in één keer berekend. */
function msStats(){const E=Object.entries(S.srs),dk=Object.keys(S.days).filter(k=>S.days[k]>0).sort(),all=GOT.size>=3;
 const best=longestStreak();
 const wk=new Set();for(const k of dk){const d=new Date(k+'T12:00:00');if(d.getDay()===6){const z=fmt(new Date(+d+DAY));if(S.days[z]>0)wk.add(k)}}
 const m=byId(),lv={Intermediate:0,Advanced:0},cats=new Set(),catTot={},catSt={};let st=0,ma=0,top=0;
 for(const[k,r]of E){if(+k<0)continue;const c=m.get(+k);if(!c)continue;st++;if(r.box>=4){ma++;if(c.niveau in lv)lv[c.niveau]++}if(r.box>=6)top++;cats.add(c.categorie);catSt[c.categorie]=(catSt[c.categorie]||0)+1}
 let total=0;for(const c of CARDS)if(!c.own){total++;catTot[c.categorie]=(catTot[c.categorie]||0)+1}
 const catFull=Object.keys(catTot).filter(k=>catSt[k]>=catTot[k]).length;
 const P=D.paths?PATHS():null,pathDone=P?P.filter(p=>(S.paths[p.id]||[]).length>=p.steps.length).length:null;
 const L=D.les?LES():null,perfect=L?L.filter(l=>S.les[l.id]===l.q.length).length:null;
 return{all,best,cur:streak(),days:dk.length,reps:dk.reduce((a,k)=>a+S.days[k],0),goal:dk.filter(k=>S.days[k]>=S.goal).length,wk:wk.size,
  st,ma,top,lvI:lv.Intermediate,lvA:lv.Advanced,cats:cats.size,catN:Object.keys(catTot).length,catFull,total,
  dlg:Object.keys(S.dlg).length,les:Object.keys(S.les).length,perfect,st2:Object.keys(S.stories).length,pathDone,pathN:P?P.length:null,
  race:(S.games||{}).race||0,mem:(S.games||{}).mem?1:0,own:S.own.length,favs:S.favs.length}}
/* Families: een titel, een icoon, de waarde en de stappen. Een stap is [drempel, naam]; 'need' = welke gegevens nodig zijn. */
const MSF=[
 {id:'reeks',ic:'flame',t:'Dagen op rij',u:'dagen op rij',v:s=>Math.max(s.best,s.cur),steps:[[3,'Op gang'],[7,'Een week vol'],[14,'Twee weken'],[30,'Een maand'],[60,'Twee maanden'],[100,'Honderd dagen'],[180,'Een half jaar'],[365,'Een heel jaar']]},
 {id:'dagen',ic:'chart',t:'Dagen geoefend',u:'dagen',v:s=>s.days,steps:[[1,'Eerste dag'],[5,'Vijf dagen'],[10,'Tien dagen'],[25,'Vaste gast'],[50,'Vijftig dagen'],[100,'Honderd dagen'],[200,'Tweehonderd dagen'],[365,'Jaarrond']]},
 {id:'doel',ic:'star',t:'Dagdoel gehaald',u:'keer',v:s=>s.goal,steps:[[1,'Doel gehaald'],[7,'Zeven keer'],[30,'Dertig keer'],[100,'Honderd keer'],[250,'Doelgericht']]},
 {id:'weekend',ic:'sess',t:'Weekendleerder',u:'weekenden',sub:'Zaterdag én zondag geoefend',v:s=>s.wk,steps:[[1,'Weekend vol'],[4,'Vier weekenden'],[12,'Twaalf weekenden'],[52,'Een jaar weekenden']]},
 {id:'herh',ic:'quiz',t:'Antwoorden gegeven',u:'antwoorden',v:s=>s.reps,steps:[[50,'Vijftig'],[250,'Tweehonderdvijftig'],[1000,'Duizend'],[2500,'Tweeduizend­vijfhonderd'],[5000,'Vijfduizend'],[10000,'Tienduizend'],[25000,'Onvermoeibaar']]},
 {id:'kaart',ic:'kaart',t:'Kaarten gestart',u:'kaarten',need:'all',v:s=>s.st,steps:s=>[[10,'Tien kaarten'],[50,'Vijftig kaarten'],[100,'Honderd kaarten'],[250,'Kwart duizend'],[500,'Vijfhonderd'],[1000,'Duizend kaarten'],[2000,'Tweeduizend'],[3000,'Drieduizend'],[s.total,'Alle kaarten']]},
 {id:'beheerst',ic:'medal',t:'Kaarten beheerst',u:'beheerst',need:'all',sub:'Vier keer op rij goed, met steeds langere pauzes',v:s=>s.ma,steps:[[10,'Tien vast'],[25,'Vijfentwintig'],[50,'Vijftig'],[100,'Honderd'],[250,'Tweehonderdvijftig'],[500,'Vijfhonderd'],[1000,'Duizend'],[2000,'Woordenschatkoning']]},
 {id:'top',ic:'bolt',t:'IJzersterk',u:'kaarten',need:'all',sub:'Kaarten in het hoogste herhaalvak',v:s=>s.top,steps:[[10,'Tien ijzersterk'],[50,'Vijftig'],[250,'Tweehonderdvijftig'],[1000,'Duizend']]},
 {id:'lvI',ic:'pad',t:'Intermediate beheerst',u:'kaarten',need:'all',v:s=>s.lvI,steps:[[25,'Verder dan de basis'],[100,'Gevorderd op weg'],[250,'Intermediate-kenner']]},
 {id:'lvA',ic:'pad',t:'Advanced beheerst',u:'kaarten',need:'all',v:s=>s.lvA,steps:[[25,'Advanced-proever'],[100,'Gevorderd'],[250,'Bijna moedertaal']]},
 {id:'cats',ic:'cult',t:'Onderwerpen verkend',u:'onderwerpen',need:'all',v:s=>s.cats,steps:s=>[[3,'Rondkijker'],[10,'Ontdekker'],[20,'Wereldreiziger'],[s.catN,'Alles gezien']]},
 {id:'catFull',ic:'check',t:'Onderwerpen compleet',u:'onderwerpen',need:'all',sub:'Elke kaart van het onderwerp gestart',v:s=>s.catFull,steps:[[1,'Eerste onderwerp'],[5,'Vijf onderwerpen'],[15,'Vijftien onderwerpen']]},
 {id:'dlg',ic:'dlg',t:'Dialogen',u:'dialogen',v:s=>s.dlg,steps:()=>[[1,'Eerste gesprek'],[5,'Babbelaar'],[10,'Prater'],[20,'Gesprekspartner'],[N.dlg||33,'Alle dialogen']]},
 {id:'les',ic:'gram',t:'Grammaticalessen',u:'lessen',v:s=>s.les,steps:()=>[[1,'Eerste les'],[5,'Vijf lessen'],[10,'Tien lessen'],[N.les||17,'Alle lessen']]},
 {id:'perfect',ic:'star',t:'Foutloze lessen',u:'lessen',need:'les',v:s=>s.perfect,steps:()=>[[1,'Foutloos'],[5,'Vijf keer foutloos'],[N.les||17,'Grammaticameester']]},
 {id:'st2',ic:'story',t:'Verhalen gelezen',u:'verhalen',v:s=>s.st2,steps:()=>[[1,'Eerste verhaal'],[3,'Lezer'],[N.st||6,'Alle verhalen']]},
 {id:'pad',ic:'pad',t:'Leerpaden voltooid',u:'paden',need:'paths',v:s=>s.pathDone,steps:s=>[[1,'Eerste pad'],[3,'Drie paden'],[5,'Vijf paden'],[10,'Tien paden'],[s.pathN,'Alle paden']]},
 {id:'race',ic:'spel',t:'Tijdrace',u:'punten',sub:'Je beste score',v:s=>s.race,steps:[[10,'Snel'],[20,'Bliksemsnel'],[30,'Supersonisch'],[40,'Onverslaanbaar']]},
 {id:'mem',ic:'spel',t:'Memory',u:'keer',v:s=>s.mem,steps:[[1,'Memory gespeeld']]},
 {id:'own',ic:'plus',t:'Eigen kaarten',u:'kaarten',v:s=>s.own,steps:[[1,'Eigen woord'],[10,'Verzamelaar'],[50,'Woordenboekmaker']]},
 {id:'favs',ic:'star',t:'Favorieten',u:'favorieten',v:s=>s.favs,steps:[[10,'Lievelingswoorden'],[50,'Vijftig favorieten'],[200,'Fan']]}];
const msOk=(f,s)=>f.need==='all'?s.all:f.need==='les'?s.perfect!==null:f.need==='paths'?s.pathDone!==null:true;
/* Stappen oplopend en zonder dubbele of lege drempels (bijv. als 'alle kaarten' samenvalt met een vaste stap). */
function msSteps(f,s){const raw=typeof f.steps==='function'?f.steps(s):f.steps,out=[];for(const x of raw)if(x[0]>0&&(!out.length||x[0]>out[out.length-1][0]))out.push(x);return out}
function msList(s=msStats()){return MSF.filter(f=>msOk(f,s)).map(f=>{const steps=msSteps(f,s),v=f.v(s)||0;const got=steps.map((x,i)=>!!S.ms[f.id+':'+i]||v>=x[0]);const ni=got.indexOf(false);
 return{f,steps,v,got,n:got.filter(Boolean).length,next:ni<0?null:{i:ni,at:steps[ni][0],name:steps[ni][1],pct:Math.min(1,v/steps[ni][0]),from:ni?steps[ni-1][0]:0}}})}
/* Nieuwe mijlpalen opslaan en vieren. De eerste keer (bestaande gebruikers) gebeurt dat stil. */
let msQ=[];
function checkMs(){if(!S.ms)S.ms={};const s=msStats(),now=Date.now(),fresh=[];
 for(const f of MSF){if(!msOk(f,s))continue;const v=f.v(s)||0;msSteps(f,s).forEach((x,i)=>{const k=f.id+':'+i;if(!S.ms[k]&&v>=x[0]){S.ms[k]=now;fresh.push({ic:f.ic,i,head:'Mijlpaal behaald!',text:f.t+': '+x[1]})}})}
 const xp=xpInfo();
 if(!S.ms._){S.ms._=now;S.lvl=xp.L;delete S.frzNew;save();return}
 const extra=[];if(xp.L>(S.lvl||0)){if(S.lvl)extra.push({ic:'star',i:Math.min(Math.floor(xp.L/4),8),head:'Niveau '+xp.L+' bereikt!',text:'Je bent nu '+xp.title+'.',big:1});S.lvl=xp.L;save()}
 if(S.frzNew){delete S.frzNew;extra.push({ic:'shield',i:4,head:'Rustdag verdiend!',text:'Mis je een dag, dan blijft je reeks toch staan.',big:1});save()}
 if(fresh.length){save();msQ.push(...fresh)}if(extra.length)msQ.push(...extra);msToast()}
/* Eerst niveau en rustdag apart tonen, daarna de mijlpalen samen. */
function msToast(){if(!msQ.length||document.getElementById('mstoast'))return;const bi=msQ.findIndex(x=>x.big);let a,x;
 if(bi>=0){x=msQ.splice(bi,1)[0];a=[x]}else{a=msQ.splice(0,msQ.length);x=a.reduce((p,q)=>q.i>p.i?q:p)}
 const t=document.createElement('div');t.id='mstoast';t.setAttribute('role','status');
 t.innerHTML=`<span class="msmedal t${Math.min(x.i,8)}">${I[x.ic]||I.medal}</span><span class="grow"><b>${a.length>1?a.length+' nieuwe mijlpalen!':esc(x.head)}</b><span>${esc(x.text)}${a.length>1?' en meer':''}</span></span><button class="chip on" data-a="mijlpalen">Bekijk</button>`;
 document.body.appendChild(t);if(!navigator.userActivation||navigator.userActivation.hasBeenActive)buzz('ok');setTimeout(()=>t.classList.add('out'),5200);setTimeout(()=>{t.remove();msToast()},5600)}
const medals=(r)=>`<span class="msdots" aria-hidden="true">${r.steps.map((x,i)=>`<i class="${r.got[i]?'on t'+Math.min(i,8):''}"></i>`).join('')}</span>`;
function msBar(r){if(!r.next)return`<p class="muted small">Alles behaald in deze reeks.</p>`;const left=r.next.at-r.v;
 return`<div class="ibar" role="img" aria-label="${fmtN(r.v)} van ${fmtN(r.next.at)}"><i class="ma" style="width:${Math.round(r.next.pct*100)}%"></i></div><p class="muted small">Volgende: <b>${esc(r.next.name)}</b> · nog ${fmtN(left)} ${msU(r.f,left)}</p>`}
/* De mijlpaal die het dichtst bij is (voor het startscherm). */
function msNext(){const L=msList().filter(r=>r.next&&r.v>0);if(!L.length)return null;L.sort((a,b)=>b.next.pct-a.next.pct);return L[0]}
V.mijlpalen=()=>{checkMs();const s=msStats(),L=msList(s),got=L.reduce((a,r)=>a+r.n,0),tot=L.reduce((a,r)=>a+r.steps.length,0);
 const near=L.filter(r=>r.next&&r.v>0).sort((a,b)=>b.next.pct-a.next.pct).slice(0,3);
 const recent=Object.entries(S.ms).filter(([k])=>k!=='_').sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,t])=>{const[id,i]=k.split(':'),r=L.find(x=>x.f.id===id);return r&&r.steps[+i]?{r,i:+i,t}:null}).filter(Boolean);
 const card=r=>`<div class="card ms"><div class="row sp"><span class="row" style="gap:10px"><span class="msmedal ${r.n?'t'+Math.min(r.n-1,8):'off'}">${I[r.f.ic]||I.medal}</span><span><h2>${esc(r.f.t)}</h2><span class="muted small">${r.n?esc(r.steps[r.n-1][1])+' · '+MSKL[Math.min(r.n-1,8)]:(r.f.sub?esc(r.f.sub):'Nog niet behaald')}</span></span></span><span class="muted small">${r.n}/${r.steps.length}</span></div>${medals(r)}${msBar(r)}</div>`;
 const x=xpInfo(),f=S.frz||0;
 draw(`${back('meer','Meer')}<div class="row sp"><h1>Mijlpalen</h1><button class="btn soft sm" data-a="deel">${I.share}Delen</button></div>
 <div class="duo"><div class="card lvcard"><div class="row" style="gap:12px"><span class="lvnum">${x.L}</span><span class="grow"><h2>Niveau ${x.L} · ${esc(x.title)}</h2><span class="muted small">${fmtN(x.xp)} punten · nog ${fmtN(x.to-x.xp)} tot niveau ${x.L+1}</span></span></div>
 <div class="ibar" role="img" aria-label="${fmtN(x.xp-x.from)} van ${fmtN(x.to-x.from)} punten"><i class="ma" style="width:${Math.round((x.xp-x.from)/(x.to-x.from)*100)}%"></i></div>
 <details class="xpd"><summary>Zo verdien je punten</summary><ul>${x.parts.map(p=>`<li><span>${p[0]}</span><span class="muted">${p[2]} per stuk · ${fmtN(p[1]*p[2])}</span></li>`).join('')}</ul></details></div>
 <div class="card frzcard"><div class="row" style="gap:12px"><span class="msmedal ${f?'t4':'off'}">${I.shield}</span><span class="grow"><h2>${f?f+' '+(f===1?'rustdag':'rustdagen')+' klaar':'Nog geen rustdag'}</h2><span class="muted small">Elke 7 dagen op rij verdien je een rustdag (maximaal 2). Mis je een dag, dan blijft je reeks staan.${(S.frzD||[]).length?' Al '+S.frzD.length+' keer gebruikt.':''}</span></span></div></div></div>
 <div class="card stats" style="margin-top:12px"><div><div class="big">${got}</div><div class="muted">behaald</div></div><div><div class="big">${tot}</div><div class="muted">in totaal</div></div><div><div class="big">${s.best}</div><div class="muted">langste reeks</div></div></div>
 <div class="ibar" style="margin-top:10px" role="img" aria-label="${got} van ${tot} mijlpalen"><i class="ma" style="width:${tot?Math.round(got/tot*100):0}%"></i></div>
 ${near.length?`<div class="sec">Bijna binnen</div><div class="ms-grid">${near.map(card).join('')}</div>`:''}
 ${recent.length?`<div class="sec">Laatst behaald</div><div class="card"><div class="chips wrap">${recent.map(x=>`<span class="chip on"><span class="msmini t${Math.min(x.i,8)}"></span>${esc(x.r.steps[x.i][1])}</span>`).join('')}</div></div>`:''}
 <div class="sec">Alle reeksen</div><div class="ms-grid">${L.map(card).join('')}</div>
 <p class="muted small" style="text-align:center;margin:18px 0 120px">Niveaus: ${MSKL.slice(0,8).join(' · ')}</p>`)};
