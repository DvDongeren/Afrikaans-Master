/* 94-punten-delen-gatentekst.js — Punten en niveaus, deelbare voortgangskaart en de gatentekst.
   Alle bestanden in bron/js worden op volgorde samengevoegd tot één script (één scope). */
/* ---------- punten en niveaus ----------
   Punten worden uit de voortgang berekend (niet apart opgeslagen), zodat ze op elk apparaat gelijk zijn. */
const xpNeed=L=>100*(L-1)+25*(L-1)*(L-2);
const LVT=[[30,'Legende'],[25,'Meester'],[20,'Taalvriend'],[15,'Kenner'],[11,'Kuierder'],[8,'Prater'],[5,'Leerling'],[3,'Beginner'],[1,'Nuweling']];
const lvTitle=L=>LVT.find(x=>L>=x[0])[1];
function xpInfo(){const E=Object.values(S.srs),reps=Object.values(S.days).reduce((a,b)=>a+b,0),ma=E.filter(r=>r.box>=4).length;
 const steps=Object.values(S.paths).reduce((a,p)=>a+p.length,0),ms=Object.keys(S.ms||{}).filter(k=>k!=='_').length;
 const parts=[['Antwoorden',reps,1],['Beheerste kaarten',ma,5],['Dialogen',Object.keys(S.dlg).length,15],['Grammaticalessen',Object.keys(S.les).length,25],['Verhalen',Object.keys(S.stories).length,10],['Stappen in leerpaden',steps,5],['Mijlpalen',ms,20]];
 const xp=parts.reduce((a,p)=>a+p[1]*p[2],0);let L=1;while(L<999&&xpNeed(L+1)<=xp)L++;
 return{xp,L,title:lvTitle(L),from:xpNeed(L),to:xpNeed(L+1),parts}}

/* ---------- deelbare voortgangskaart ---------- */
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
async function drawShare(cv){const W=1080,H=1350;cv.width=W;cv.height=H;const g=cv.getContext('2d');
 try{await Promise.all(['600 80px Lora','400 40px Lora','italic 400 40px Lora'].map(f=>document.fonts.load(f)))}catch{}
 const s=msStats(),Lm=msList(s),got=Lm.reduce((a,r)=>a+r.n,0),tot=Lm.reduce((a,r)=>a+r.steps.length,0),x=xpInfo(),cur=streak();
 const bg=g.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#1b7a50');bg.addColorStop(1,'#0b3a26');g.fillStyle=bg;g.fillRect(0,0,W,H);
 g.fillStyle='#e8b33a';g.globalAlpha=.9;g.beginPath();g.arc(975,105,75,0,7);g.fill();g.globalAlpha=1;
 g.fillStyle='rgba(255,255,255,.07)';g.beginPath();g.moveTo(0,H);g.lineTo(0,1130);g.lineTo(260,930);g.quadraticCurveTo(280,912,310,912);g.lineTo(760,912);g.quadraticCurveTo(790,912,810,930);g.lineTo(W,1110);g.lineTo(W,H);g.fill();
 const T=(t,x0,y,font,col,al='left')=>{g.font=font;g.fillStyle=col;g.textAlign=al;g.fillText(t,x0,y)};
 T('AFRIKAANS MASTER',80,130,'700 34px Lora, Georgia, serif','#e8b33a');
 T('Ek leer Afrikaans!',80,230,'600 84px Lora, Georgia, serif','#fff');
 T('Ik leer Afrikaans!',80,290,'italic 400 40px Lora, Georgia, serif','rgba(255,255,255,.75)');
 const big=cur||s.best;T(String(big),80,560,'600 260px Lora, Georgia, serif','#e8b33a');
 g.font='600 260px Lora, Georgia, serif';const bw=g.measureText(String(big)).width;
 T(cur?(cur===1?'dag':'dagen'):'dagen',110+bw,470,'600 64px Lora, Georgia, serif','#fff');T(cur?'op rij':'langste reeks',110+bw,540,'400 46px Lora, Georgia, serif','rgba(255,255,255,.8)');
 const box=(bx,by,val,lbl)=>{g.fillStyle='rgba(255,255,255,.09)';rr(g,bx,by,440,190,28);g.fill();T(val,bx+36,by+100,'600 72px Lora, Georgia, serif','#fff');T(lbl,bx+36,by+150,'400 34px Lora, Georgia, serif','rgba(255,255,255,.78)')};
 box(80,640,'Niveau '+x.L,x.title);box(560,640,fmtN(s.st),'woorden gestart');box(80,860,fmtN(s.ma),'woorden beheerst');box(560,860,got+' / '+tot,'mijlpalen');
 const cols=['#b7773f','#9aa6ad','#d6a419','#1f9a63','#2f6fd0','#c23b4b','#47b6d6','#7b4bd1','#e2683c'],med=[];
 for(const r of Lm)r.got.forEach((ok,i)=>{if(ok)med.push(i)});med.sort((a,b)=>b-a);
 med.slice(0,14).forEach((i,k)=>{g.fillStyle=cols[Math.min(i,8)];g.beginPath();g.arc(110+k*62,1140,24,0,7);g.fill();g.fillStyle='rgba(0,0,0,.18)';g.beginPath();g.arc(110+k*62,1146,24,0,Math.PI);g.fill()});
 T(location.host||'Afrikaans Master',W/2,1270,'400 36px Lora, Georgia, serif','rgba(255,255,255,.85)','center')}
V.deel=()=>{draw(`${back('mijlpalen','Mijlpalen')}<h1>Deel je voortgang</h1><p class="muted">Een plaatje met je reeks, niveau en mijlpalen, om te delen via WhatsApp of sociale media.</p>
 <canvas id="shc" class="sharecv" aria-label="Voortgangskaart"></canvas>
 <div class="row" style="margin:14px 0 120px">${navigator.share?`<button class="btn" id="shs">${I.share}Delen</button>`:''}<button class="btn ${navigator.share?'ghost':''}" id="shd">${I.dl||''}Opslaan als afbeelding</button></div><p class="muted small" id="shm" role="status"></p>`);
 const cv=$('#shc'),ready=drawShare(cv);
 const blob=async()=>{await ready;return new Promise(r=>cv.toBlob(r,'image/png'))};
 $('#shd').onclick=async()=>{const b=await blob(),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='afrikaans-voortgang.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);$('#shm').textContent='Afbeelding opgeslagen.'};
 if($('#shs'))$('#shs').onclick=async()=>{const b=await blob(),f=new File([b],'afrikaans-voortgang.png',{type:'image/png'}),txt='Ek leer Afrikaans! Doe je mee? '+location.origin+location.pathname;
  try{if(navigator.canShare&&navigator.canShare({files:[f]}))await navigator.share({files:[f],text:txt});else await navigator.share({text:txt,url:location.origin+location.pathname})}catch(e){if(e&&e.name!=='AbortError')$('#shm').textContent='Delen lukte niet; gebruik Opslaan als afbeelding.'}}};

/* ---------- gatentekst ----------
   Voorbeeldzinnen waarin het Afrikaanse woord van de kaart letterlijk voorkomt; dat woord wordt het gat. */
const escRe=t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const GAPS=L(()=>{const out=[];for(const c of CARDS){if(c.own)continue;const w=c.af.trim().replace(/^(die|'n)\s+/i,'');
  if(w.length<2||!/^\p{L}[\p{L}'-]*$/u.test(w))continue;const v=c.voorbeeld||'';if(v.split(/\s+/).length<3)continue;
  const m=new RegExp("(^|[^\\p{L}'-])("+escRe(w)+")(?![\\p{L}'-])",'iu').exec(v);if(!m)continue;const at=m.index+m[1].length;
  out.push({c,w:w.toLowerCase(),pre:v.slice(0,at),hit:v.substr(at,w.length),post:v.slice(at+w.length)})}return out});
V.gat=()=>{if(!st.q){const G=GAPS(),lv=S.startLv||'Beginner',a=shuffle(G.filter(g=>S.srs[g.c.id])).slice(0,6),b=shuffle(G.filter(g=>!S.srs[g.c.id]&&g.c.niveau===lv));
  st.q=shuffle([...a,...b].slice(0,10));if(st.q.length<10)st.q=shuffle(G).slice(0,10);st.i=0;st.score=0;st.ans=null;st.wr=[]}
 const u=st.q[st.i];
 if(!u){const wr=st.wr.length?`<div class="sec" style="text-align:left">Om te herhalen</div><div class="list" style="text-align:left">${st.wr.map(g=>`<div class="li"><span class="grow"><span class="af" style="display:block">${esc(g.pre)}<b>${esc(g.hit)}</b>${esc(g.post)}</span><span class="nl">${esc(g.c.af)} = ${esc(g.c.nl)}</span></span>${spk(g.c.voorbeeld,'sm')}</div>`).join('')}</div>`:'';
  result(st.score,st.q.length,praise(st.score,st.q.length),'<button class="btn" data-again="gat">Nog een ronde</button><button class="btn ghost" data-a="oef">Oefenen</button>',wr);return}
 if(!st.cur||st.cur.c!==u.c){const same=GAPS().filter(g=>g.c.categorie===u.c.categorie&&g.w!==u.w),pool=shuffle(same.length>=3?same:GAPS().filter(g=>g.w!==u.w)),opts=[];
  for(const g of pool){if(!opts.includes(g.w))opts.push(g.w);if(opts.length===3)break}st.cur={c:u.c,opts:shuffle(opts.concat(u.w))}}
 const done=st.ans!==null;
 draw(`${topbar(st.i,st.q.length)}
 <div class="card q"><div class="lbl">Vul het ontbrekende woord in</div><div class="big af gapq">${esc(u.pre)}<span class="gap ${done?(st.ans?'ok':'bad'):''}">${done?esc(u.hit):' ? '}</span>${esc(u.post)}</div><div class="muted" style="margin-top:8px">Hint: ${esc(u.c.nl.toLowerCase().replace(/^(de|het|een)\s+/,'')===u.w?u.c.categorie:u.c.nl)}</div></div>
 <div class="stack" id="op" style="margin-top:14px">${st.cur.opts.map(o=>`<button class="opt af-opt" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>`);
 $('#op').onclick=e=>{const b=e.target.closest('.opt');if(!b||st.ans!==null)return;const ok=b.dataset.o===u.w;st.ans=ok;
  if(ok){st.score++;count()}else{grade(u.c.id,false);st.wr.push(u);buzz('bad')}
  render();for(const x of $('#op').children){if(x.dataset.o===u.w)x.classList.add('ok');else if(!ok&&x.dataset.o===b.dataset.o)x.classList.add('bad');x.disabled=true}
  speak(u.c.voorbeeld);setTimeout(()=>{if(view!=='gat')return;st.ans=null;st.i++;st.cur=null;render()},ok?1300:2400)}};
