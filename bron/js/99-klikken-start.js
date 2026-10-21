/* 99-klikken-start.js — Klikafhandeling, sneltoetsen en opstarten.
   Alle bestanden in bron/js worden op volgorde samengevoegd tot één script (één scope). */
/* ---------- klikken (één handler voor de hele app) ---------- */
document.addEventListener('click',e=>{const t=e.target;
 if(t.closest('[data-reload]'))return location.reload();
 const nv=t.closest('#nav [data-v]');if(nv)return go(nv.dataset.v);
 const sp=t.closest('[data-sp]');if(sp){e.stopPropagation();return speak(sp.dataset.sp)}
 if(view==='story'){const w=t.closest('.w');if(w)return storyWord(w)}
 const f=t.closest('[data-f]');if(f){const id=+f.dataset.f,i=S.favs.indexOf(id);i<0?S.favs.push(id):S.favs.splice(i,1);save();f.classList.toggle('on',i<0);f.setAttribute('aria-pressed',i<0);return}
 if(view==='sess'){
  if(t.closest('#fc')&&!st.open&&!S.typed&&!t.closest('#tf,[data-rep]')){st.open=true;st.flip=1;return render()}
  const g=t.closest('[data-g]');if(g&&!st.swiped)return sessGrade(g.dataset.g==='1')}
 const zr=t.closest('[data-zr]');if(zr&&view==='zoek'){const r=st.res[+zr.dataset.zr];return go(r.go[0],Object.assign({},r.go[1]))}
 if(t.closest('[data-zk]'))return go('kaart',{q:st.q});
 const fx=t.closest('[data-fix]');if(fx){e.stopPropagation();return fixSheet(+fx.dataset.fix,fx.dataset.fixdoc||'')}
 const ez=t.closest('[data-ezel]');if(ez){e.stopPropagation();return ezelEdit(+ez.dataset.ezel)}
 const rp=t.closest('[data-rep]');if(rp){e.stopPropagation();return report(+rp.dataset.rep)}
 const dl=t.closest('[data-del]');if(dl)return delOwn(+dl.dataset.del);
 if(t.closest('[data-lvskip]')){S.lvDone=true;saveNow();return V.home()}
 if(t.closest('[data-inst]'))return doInstall();
 if(t.closest('[data-pr]')&&view==='kaart')return go('print',{src:st.lv==='Favorieten'?'fav':['Beginner','Intermediate','Advanced'].includes(st.lv)&&!st.cat?'lv':'cat',cat:st.cat||undefined,plv:['Beginner','Intermediate','Advanced'].includes(st.lv)?st.lv:undefined});
 if(view==='vertaal'){if(t.closest('[data-vgo]')){st.go=1;return V.vertaal()}if(t.closest('[data-vskip]'))return vCheck('');
  if(t.closest('[data-vself]')){st.res.self=1;st.sc++;count();return V.vertaal()}if(t.closest('[data-vnext]')){st.i++;st.res=null;V.vertaal();return scrollTo(0,0)}}
 if(t.closest('[data-insthide]')){S.instHide=true;saveNow();return render()}
 const mi=t.closest('[data-mi]');if(mi&&view==='mem')return memTap(+mi.dataset.mi);
 const ro=t.closest('[data-ro]');if(ro&&view==='race')return raceTap(ro.dataset.ro,ro);
 const sz=t.closest('[data-sz]');if(sz)return go('seizoen',{id:sz.dataset.sz});
 const ag=t.closest('[data-again]');if(ag)return go(ag.dataset.again);
 const ic_=t.closest('[data-icat]');if(ic_)return go('kaart',{cat:ic_.dataset.icat});
 const rq=t.closest('[data-rq]');if(rq)return go('zoek',{q:rq.dataset.rq});
 const rd=t.closest('[data-rdone]');if(rd&&view==='beheer')return reportDone(rd.dataset.rdone,rd);
 const ed=t.closest('[data-edone]');if(ed&&view==='beheer')return errorDone(ed.dataset.edone,ed);
 const s=t.closest('[data-s]');if(s){const[k,val]=s.dataset.s.split(':');S[k]=k==='goal'||k==='rate'?+val:val==='true'?true:val==='false'?false:val;if(k==='startLv'){S.lvDone=true;ORDER.reset()}saveNow();theme();if(k==='rate')speak('Goeiemôre, hoe gaan dit?');return V.meer()}
 const a=t.closest('[data-a]');if(a){const k=a.dataset.a;if(k.startsWith('mc:'))return go('mc',{kind:k.slice(3)});if(k==='back')return goBack();if(k==='stepdone')return stepDone();return go(k)}
 const ex=t.closest('[data-les],[data-ls],[data-lo],[data-pg],[data-t],[data-m],[data-tr],[data-rev],[data-fin],[data-play],[data-p],[data-step],[data-story]');if(!ex)return;const D=ex.dataset;
 if(D.story)return go('story',{id:D.story});
 if(D.les)return go('les',{l:D.les});
 if(D.ls){st.n=0;st.sc=0;st.ans=null;return V.les()}
 if(D.pg){st.g=D.pg;return V.paden()}
 if(D.lo!==undefined&&view==='les'){if(st.ans)return;const q=LES().find(x=>x.id===st.l).q[st.n],ok=+D.lo===q[2];st.ans=1;for(const x of app.querySelectorAll('.opt')){if(+x.dataset.lo===q[2])x.classList.add('ok');x.disabled=true}if(!ok){ex.classList.add('bad');buzz('bad')}if(ok){st.sc++;count()}const s0=st;return setTimeout(()=>{if(st!==s0||view!=='les')return;st.ans=null;st.n++;V.les()},ok?650:1500)}
 if(D.t)return go('dlg',{t:D.t});
 if(D.m){st.m=D.m;st.rev={};return V.dlg()}
 if(D.tr){st.tr=!st.tr;return V.dlg()}
 if(D.rev){st.rev[D.rev]=1;return V.dlg()}
 if(D.play)return speakAll(DLG().find(x=>x.title===st.t).lines.map(l=>l.af));
 if(D.fin){stat('d','dlg');const d=st.t;if(!S.dlg[d]){S.dlg[d]=1;count()}saveNow();return st.ret?stepDone():go('dlgs')}
 if(D.p)return go('path',{p:D.p});
 if(D.step!==undefined&&view==='path')return runStep(st.p,+D.step)});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){const sh=document.getElementById('sheet');if(sh){sh.remove();return}}
 if(!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!document.getElementById('sheet')){
  if(view==='sess'&&st.open&&!st.swiped&&(e.key==='1'||e.key==='2')){const b=app.querySelector(`[data-g="${e.key==='1'?0:1}"]`);if(b){e.preventDefault();return b.click()}}
  if(e.key==='/'){e.preventDefault();return go('zoek')}
  if(/^[1-4]$/.test(e.key)){const o=[...app.querySelectorAll('.opt:not([disabled])')][+e.key-1];if(o){e.preventDefault();return o.click()}}
  if(view==='sess'&&!st.open&&!S.typed&&(e.key===' '||e.key==='Enter')){e.preventDefault();st.open=true;st.flip=1;return render()}}if(view==='sess'&&!st.open&&!S.typed&&(e.key===' '||e.key==='Enter')&&e.target.id==='fc'){e.preventDefault();st.open=true;render()}});

theme();mq.addEventListener?.('change',theme);
/* Kaarten komen per niveau binnen: eerst wat nodig is voor het startscherm, de rest op de achtergrond. */
const LVN=[0,1,2],GOT=new Set();let ALLP=null;
function addLevel(i){if(GOT.has(i))return;GOT.add(i);const own=CARDS.filter(c=>c.own);CARDS=CARDS.filter(c=>!c.own).concat(parseCards(D['cards'+i],META)).concat(own);resetCards();applyFixes()}
/* Kaarten die bij een taalcontrole zijn geschrapt, verdwijnen ook uit de voortgang (anders blijven ze als 'te herhalen' staan). */
function pruneGone(){const m=byId();let n=0;for(const k in S.srs)if(+k>0&&!m.has(+k)){delete S.srs[k];n++}const f=S.favs.filter(x=>x<0||m.has(x));if(f.length!==S.favs.length){S.favs=f;n++}if(n)save()}
const allCards=()=>ALLP||(ALLP=Promise.all(LVN.map(i=>load('cards'+i).then(()=>addLevel(i)))).then(()=>{pruneGone();try{checkMs()}catch{}if(['home','meer'].includes(view))render()}).catch(e=>{ALLP=null;throw e}));
const NEEDALL=v=>!['seizoen','szquiz','beeld','plaat','home','paden','dlgs','dlg','gram','les','media','klank','cult','reis','vv','stories','story','beheer'].includes(v);
/* Opstarten: alleen de beginnerskaarten en wat het eerste scherm nodig heeft (staan al als preload in de pagina);
   de overige kaarten en inhoud pas na het eerste beeld, zodat ze daar niet mee om bandbreedte concurreren. */
const later=f=>requestAnimationFrame(()=>setTimeout(f,0));
const idle=(f,t)=>'requestIdleCallback' in window?requestIdleCallback(f,{timeout:t}):setTimeout(f,t/2);
async function boot(){{const r=parseHash(location.hash);if(r&&!EXER.has(r[0])){view=r[0];st=r[1]}record(false);stat('x','visits');stat('v',view)}
 try{let m=null;try{m=JSON.parse(app.dataset.meta||'null')}catch{}if(!m)m=await load('meta');META=m;N=m.n||{};
 (DEPS[view]||[]).forEach(n=>load(n).catch(()=>{}));
 await load('cards0');addLevel(0);for(const o of S.own)CARDS.push(ownCard(o));resetCards();
 if(NEEDALL(view))await allCards()}catch(e){return loadError()}
 render();later(()=>{allCards().catch(()=>{});loadConf().then(c=>{AUDIO.on=!!(c&&c.audio)})});setTimeout(()=>['facts','paths','dlg','les','ext','vv','media','pics'].forEach(n=>load(n).catch(()=>{})),1200);
 if(/[?&](apiKey|state)=|#.*state=/.test(location.href))setTimeout(startCloud,0);else if(S.cloud)idle(startCloud,2500);idle(()=>loadFixes(),4000)}
/* Alleen lokaal (tests): inkijk in de staat. */
if(TESTHOOK)window.__t={get st(){return st},get S(){return S},D,set:o=>{Object.assign(S,o);saveNow()}};
boot();
/* offline en updates */
if('serviceWorker' in navigator&&(location.protocol==='https:'||TESTHOOK&&location.protocol==='http:')){const had=!!navigator.serviceWorker.controller;
 addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!had||document.getElementById('toast'))return;const t=document.createElement('div');t.id='toast';t.setAttribute('role','status');
  t.innerHTML='<span>Er is een nieuwe versie.</span><button class="chip on" data-reload="1">Vernieuwen</button>';document.body.appendChild(t)})}
})();
