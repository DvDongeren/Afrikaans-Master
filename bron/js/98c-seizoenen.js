/* 98c-seizoenen.js — Seizoensthema's: tijdelijke mini-paden (woorden, voorbeeldzinnen en een mini-quiz).
   Alle bestanden in bron/js worden op volgorde samengevoegd tot één script (één scope).
   Data: data/sz.json = [{id,t,nl,from:'MM-DD',to:'MM-DD' | easter:[van,tot],ic,intro,w:[[af,nl,vb,vbnl]]}].
   Voltooid: S.sz = {id: jaartal van het seizoen waarin de mini-quiz gehaald is}. */
const SZ=()=>D.sz;
/* Paaszondag (gregoriaanse kalender). */
function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=(h+l-7*m+114)%31+1;return new Date(y,mo-1,da)}
/* Het venster waarin we nu zitten, of anders het eerstvolgende. */
function szWin(s,now=new Date()){const mk=yy=>{if(s.easter){const e=easter(yy);return[new Date(+e+s.easter[0]*DAY),new Date(+e+s.easter[1]*DAY+DAY-1)]}
  const[fm,fd]=s.from.split('-').map(Number),[tm,td]=s.to.split('-').map(Number),a=new Date(yy,fm-1,fd),b=new Date(yy,tm-1,td,23,59,59);if(b<a)b.setFullYear(yy+1);return[a,b]};
 const y=now.getFullYear();for(const yy of[y-1,y]){const[a,b]=mk(yy);if(now>=a&&now<=b)return{on:true,a,b}}
 let nx=null;for(const yy of[y,y+1]){const[a,b]=mk(yy);if(a>now&&(!nx||a<nx.a))nx={on:false,a,b}}return nx}
const szDone=s=>{const w=szWin(s);return w&&(S.sz||{})[s.id]===w.a.getFullYear()};
const szActive=()=>D.sz?SZ().filter(s=>szWin(s).on):[];
const dmy=d=>d.toLocaleDateString('nl-NL',{day:'numeric',month:'long'});
/* Kaart op home en bij oefenen: actieve seizoenen die je nog niet hebt afgerond. */
function szBox(){const A=szActive().filter(s=>!szDone(s));if(!A.length)return'';
 return`<div class="sec">Seizoensthema</div><div class="list">${A.map(s=>row(`data-sz="${s.id}"`,I[s.ic]||I.star,esc(s.t)+(s.nl!==s.t?` <span class="muted small" style="font-weight:500">· ${esc(s.nl)}</span>`:''),`${s.w.length} woorden en een mini-quiz · nog tot ${dmy(szWin(s).b)}`)).join('')}</div>`}
/* ---------- overzicht en detail ---------- */
V.seizoen=()=>{const L=SZ(),s=st.id&&L.find(x=>x.id===st.id);
 if(!s){const sorted=L.map(x=>({x,w:szWin(x)})).sort((a,b)=>(b.w.on-a.w.on)||(a.w.a-b.w.a));
  return draw(`${back('oef','Oefenen')}<h1>Seizoenen</h1><p class="muted" style="margin-top:8px">Kleine thema's die bij de tijd van het jaar in Zuid-Afrika horen. Elk seizoen is maar een paar weken open: leer de woorden en haal de mini-quiz voor je mijlpaal.</p>
  <div class="szgrid" style="margin-top:16px">${sorted.map(({x,w})=>`<button class="card sztile ${w.on?'on':'off'} ${szDone(x)?'done':''}" data-sz="${x.id}"><span class="msmedal ${w.on?(szDone(x)?'t3':'t2'):'off'}">${I[x.ic]||I.star}</span><span class="grow"><h2>${esc(x.t)}</h2><span class="muted small">${x.nl!==x.t?esc(x.nl)+' · ':''}${w.on?(szDone(x)?'voltooid':'nu open, tot '+dmy(w.b)):'vanaf '+dmy(w.a)}</span></span>${szDone(x)?`<span class="done-mark">${I.check}</span>`:''}</button>`).join('')}</div>`)}
 const w=szWin(s),done=szDone(s);
 draw(`${back('back','Seizoenen')}<div class="row" style="gap:12px"><span class="msmedal ${w.on?'t2':'off'}">${I[s.ic]||I.star}</span><h1>${esc(s.t)}</h1></div><p class="muted" style="margin-top:8px">${s.nl!==s.t?esc(s.nl)+' · ':''}${w.on?'open tot '+dmy(w.b):'komt terug op '+dmy(w.a)}</p>
 <div class="card" style="margin-top:14px;line-height:1.6">${esc(s.intro)}</div>
 ${w.on?`<div class="sec">Woorden</div><div class="list grid2">${s.w.map(x=>`<div class="li" style="display:block"><div class="row sp"><span class="af" style="font-size:1.15rem">${esc(x[0])}</span>${spk(x[0],'sm')}</div><div class="nl">${esc(x[1])}</div><p class="ex" style="margin-top:4px">${esc(x[2])}</p><p class="exnl">${esc(x[3])}</p></div>`).join('')}</div>
 <div class="row" style="margin:18px 0 8px">${canSpeak()?`<button class="btn soft" id="szall" style="box-shadow:inset 0 0 0 1.5px var(--hair)">${I.spk}Alles beluisteren</button>`:''}<button class="btn" data-szq="${s.id}">${done?'Mini-quiz nog eens':'Start de mini-quiz'}</button></div>${done?`<p class="muted small">${I.check} Voltooid dit seizoen. Mooi!</p>`:''}`
 :`<div class="card muted" style="margin-top:12px">Dit seizoen is nu gesloten. Vanaf ${dmy(w.a)} kun je de woorden leren en de mini-quiz doen.</div>`}`);
 const a=$('#szall');if(a)a.onclick=()=>speakAll(s.w.map(x=>x[2]));
 const q=$('[data-szq]');if(q)q.onclick=()=>go('szquiz',{id:s.id})};
/* ---------- mini-quiz: 8 vragen, geslaagd vanaf 6 goed ---------- */
V.szquiz=()=>{const s=SZ().find(x=>x.id===st.id);if(!s||!szWin(s).on)return go('seizoen');
 if(!st.q){st.q=shuffle(s.w).slice(0,8).map((x,i)=>{const dir=i%2?'an':'na',k=dir==='na'?0:1,o=shuffle(s.w.filter(y=>y!==x&&y[k]!==x[k])).slice(0,3).map(y=>y[k]);return{x,dir,a:x[k],o:shuffle(o.concat(x[k]))}});st.i=0;st.sc=0;st.ans=null}
 const n=st.q.length,u=st.q[st.i];
 if(!u){const pass=st.sc>=6;if(pass&&!st.saved){st.saved=1;S.sz=S.sz||{};S.sz[s.id]=szWin(s).a.getFullYear();saveNow()}
  result(st.sc,n,pass?'Seizoen voltooid!':'Bijna! Met 6 goed haal je het.',`${pass?'':`<button class="btn" data-szq2="1">Opnieuw proberen</button>`}<button class="btn ${pass?'':'ghost'}" data-szback="1">Terug naar ${esc(s.t)}</button>`);
  const r=$('[data-szq2]');if(r)r.onclick=()=>go('szquiz',{id:s.id});$('[data-szback]').onclick=()=>go('seizoen',{id:s.id});return}
 const done=st.ans!==null;
 draw(`${topbar(st.i,n,'oef')}<div class="lbl" style="margin:0 4px 8px">${esc(s.t)}</div><div class="card q"><div class="lbl">${u.dir==='na'?'Wat is dit in het Afrikaans?':'Wat betekent dit?'}</div><div class="big ${u.dir==='an'?'af':''}">${esc(u.dir==='na'?u.x[1]:u.x[0])}</div></div>
 <div class="stack" id="op" style="margin-top:14px">${u.o.map(o=>`<button class="opt ${u.dir==='na'?'af-opt':''} ${done?(o===u.a?'ok':o===st.pick?'bad':''):''}" data-o="${esc(o)}" ${done?'disabled':''}>${esc(o)}</button>`).join('')}</div>
 ${done?`<div class="card" style="margin-top:12px"><p class="ex">${esc(u.x[2])}</p><p class="exnl">${esc(u.x[3])}</p></div><button class="btn" id="sznx" style="margin-top:12px">${st.i+1<n?'Volgende':'Bekijk je score'}</button>`:''}`);
 if(done){$('#sznx').onclick=()=>{st.i++;st.ans=null;st.pick=null;render()};return}
 $('#op').onclick=e=>{const b=e.target.closest('.opt');if(!b||st.ans!==null)return;st.pick=b.dataset.o;st.ans=st.pick===u.a;if(st.ans){st.sc++;count()}else buzz('bad');speak(u.x[0]);render()}};
