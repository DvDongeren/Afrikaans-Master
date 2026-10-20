/* 90-account.js — Account en synchronisatie (Firebase).
   Alle bestanden in bron/js worden op volgorde samengevoegd tot één script (één scope). */
/* ---------- account en synchronisatie (Firebase, optioneel) ---------- */
const SDKV='12.19.0',SDK=n=>`https://www.gstatic.com/firebasejs/${SDKV}/firebase-${n}.js`;
const cloud={avail:undefined,user:null,status:'',at:0,busy:false};
let CFG,CONF;
const loadConf=()=>CONF||(CONF=fetch('config.json',{cache:'no-store'}).then(r=>r.ok?r.json():{}).catch(()=>({})));
async function getCfg(){if(CFG!==undefined)return CFG;if(TESTHOOK&&window.__cloudAdapter)return CFG={fb:{}};if(!/^https?:$/.test(location.protocol))return CFG=null;
 const c=await loadConf()||{};
 let fb=c&&'firebase' in c?c.firebase:'auto';if(fb==='auto'){fb=null;try{const r=await fetch('/__/firebase/init.json',{cache:'no-store'});if(r.ok)fb=await r.json()}catch{}}
 if(fb&&typeof c.authDomain==='string'&&/^[a-z0-9.-]+$/i.test(c.authDomain))fb={...fb,authDomain:c.authDomain};
 return CFG=fb&&fb.apiKey?{fb,appCheck:typeof c.appCheckSiteKey==='string'?c.appCheckSiteKey.trim():''}:null}
let FB=null;
async function fbInit(){if(FB)return FB;
 if(TESTHOOK&&window.__cloudAdapter){FB=window.__cloudAdapter;return FB}
 const cfg=await getCfg();if(!cfg)throw new Error('nocfg');
 const A=await import(SDK('app')),app=A.initializeApp(cfg.fb);
 if(cfg.appCheck){const AC=await import(SDK('app-check'));AC.initializeAppCheck(app,{provider:new AC.ReCaptchaEnterpriseProvider(cfg.appCheck),isTokenAutoRefreshEnabled:true})}
 const[Au,F]=await Promise.all([import(SDK('auth')),import(SDK('firestore'))]);
 const auth=Au.getAuth(app),db=F.getFirestore(app);
 FB={signIn:async()=>{const p=new Au.GoogleAuthProvider();try{await Au.signInWithPopup(auth,p)}catch(e){if(e&&/popup-blocked|operation-not-supported/.test(e.code||''))return Au.signInWithRedirect(auth,p);if(e&&/popup-closed|cancelled-popup/.test(e.code||''))return;throw e}},
  signOut:()=>Au.signOut(auth),onUser:cb=>Au.onAuthStateChanged(auth,cb),redirect:()=>Au.getRedirectResult(auth).catch(()=>null),
  load:async uid=>{const d=await F.getDoc(F.doc(db,'users',uid));return d.exists()?d.data():null},
  save:(uid,data)=>F.setDoc(F.doc(db,'users',uid),data),
  report:r=>F.addDoc(F.collection(db,'reports'),{...r,t:F.serverTimestamp()}),
  isAdmin:async uid=>{try{return(await F.getDoc(F.doc(db,'admins',uid))).exists()}catch{return false}},
  listReports:async()=>(await F.getDocs(F.query(F.collection(db,'reports'),F.orderBy('t','desc'),F.limit(300)))).docs.map(d=>{const x=d.data();return{doc:d.id,id:x.id,af:x.af,nl:x.nl,note:x.note||'',by:x.by||'',t:x.t&&x.t.toMillis?x.t.toMillis():0}}),
  delReport:doc=>F.deleteDoc(F.doc(db,'reports',doc)),
  logError:e=>F.addDoc(F.collection(db,'errors'),{...e,t:F.serverTimestamp()}),
  listErrors:async()=>(await F.getDocs(F.query(F.collection(db,'errors'),F.orderBy('t','desc'),F.limit(200)))).docs.map(d=>{const x=d.data();return{doc:d.id,...x,t:x.t&&x.t.toMillis?x.t.toMillis():0}}),
  delError:doc=>F.deleteDoc(F.doc(db,'errors',doc)),
  remove:async uid=>{await F.deleteDoc(F.doc(db,'users',uid));const u=auth.currentUser;if(!u)return;try{await Au.deleteUser(u)}catch(e){if(/requires-recent-login/.test(e&&e.code||'')){await Au.reauthenticateWithPopup(u,new Au.GoogleAuthProvider());await Au.deleteUser(u)}else throw e}}};
 return FB}
function cleanState(o){if(!o||typeof o!=='object'||Array.isArray(o))return null;const d=DEF(),r={};
 const obj=v=>v&&typeof v==='object'&&!Array.isArray(v),num=v=>typeof v==='number'&&isFinite(v),str=(v,m)=>typeof v==='string'&&v.length<=m;
 r.srs={};if(obj(o.srs))for(const[k,v]of Object.entries(o.srs)){if(/^-?\d{1,15}$/.test(k)&&obj(v)&&num(v.box)&&num(v.due))r.srs[k]={box:Math.max(0,Math.min(6,v.box|0)),due:v.due,...(num(v.t)?{t:v.t}:{}),...(num(v.f)?{f:v.f}:{})}}
 r.days={};if(obj(o.days))for(const[k,v]of Object.entries(o.days))if(/^\d{4}-\d{2}-\d{2}$/.test(k)&&num(v))r.days[k]=Math.max(0,Math.min(100000,v|0));
 r.favs=Array.isArray(o.favs)?o.favs.filter(num).slice(0,10000):[];
 r.paths={};if(obj(o.paths))for(const[k,v]of Object.entries(o.paths))if(str(k,60)&&Array.isArray(v))r.paths[k]=v.filter(num).slice(0,100);
 for(const k of['dlg','stories'])r[k]={},obj(o[k])&&Object.keys(o[k]).slice(0,500).forEach(x=>{if(str(x,120))r[k][x]=1});
 r.les={};if(obj(o.les))for(const[k,v]of Object.entries(o.les))if(str(k,60)&&num(v))r.les[k]=v|0;
 r.own=Array.isArray(o.own)?o.own.filter(x=>obj(x)&&num(x.id)&&str(x.nl,120)&&str(x.af,120)).slice(0,2000).map(x=>({id:x.id,nl:x.nl,af:x.af,vb:str(x.vb,300)?x.vb:''})):[];
 r.reports=Array.isArray(o.reports)?o.reports.filter(x=>obj(x)&&num(x.id)).slice(0,2000).map(x=>({id:x.id,af:String(x.af||'').slice(0,120),nl:String(x.nl||'').slice(0,120),note:String(x.note||'').slice(0,500),t:num(x.t)?x.t:0})):[];
 r.streak=num(o.streak)?o.streak|0:0;r.last=str(o.last,10)&&/^\d{4}-\d{2}-\d{2}$|^$/.test(o.last)?o.last:'';
 r.theme=['auto','light','dark'].includes(o.theme)?o.theme:d.theme;r.goal=[10,15,25,40].includes(o.goal)?o.goal:d.goal;r.rate=[0.7,0.85,1].includes(o.rate)?o.rate:d.rate;
 r.startLv=['','Beginner','Intermediate','Advanced'].includes(o.startLv)?o.startLv:'';r.games={};if(obj(o.games))for(const k of['mem','race'])if(num(o.games[k])&&o.games[k]>=0&&o.games[k]<1e4)r.games[k]=o.games[k]|0;
 r.fs=['n','l','xl'].includes(o.fs)?o.fs:'n';
 for(const k of['typed','lvDone','haptic','instHide','read'])r[k]=typeof o[k]==='boolean'?o[k]:d[k];
 r.lp=str(o.lp,60)?o.lp:'';for(const k of['mt','resetAt','cloud'])if(num(o[k]))r[k]=o[k];return Object.assign(d,r)}
function mergeState(a,b){
 if(!b)return a;if((b.resetAt||0)>(a.mt||0))return Object.assign(DEF(),b);if((a.resetAt||0)>(b.mt||0))return a;
 const newest=(b.mt||0)>(a.mt||0)?b:a,o=Object.assign(DEF(),newest),U=(x,y)=>[...new Set([...(x||[]),...(y||[])])];
 o.srs={};const sa=a.srs||{},sb=b.srs||{};
 for(const k of new Set([...Object.keys(sa),...Object.keys(sb)])){const x=sa[k],y=sb[k];o.srs[k]=!x?y:!y?x:(x.t||y.t)?((x.t||0)>=(y.t||0)?x:y):(x.box>=y.box?x:y)}
 o.days={...(a.days||{})};for(const[k,v]of Object.entries(b.days||{}))o.days[k]=Math.max(o.days[k]||0,v);
 if((a.last||'')===(b.last||'')){o.last=a.last;o.streak=Math.max(a.streak||0,b.streak||0)}else{const w=(a.last||'')>(b.last||'')?a:b;o.last=w.last;o.streak=w.streak}
 o.favs=U(a.favs,b.favs);o.paths={};for(const k of new Set([...Object.keys(a.paths||{}),...Object.keys(b.paths||{})]))o.paths[k]=U((a.paths||{})[k],(b.paths||{})[k]);
 o.dlg={...(b.dlg||{}),...(a.dlg||{})};o.stories={...(b.stories||{}),...(a.stories||{})};
 o.les={...(b.les||{})};for(const[k,v]of Object.entries(a.les||{}))o.les[k]=Math.max(o.les[k]??0,v);
 const own=new Map(),used=new Set();for(const x of[...(b.own||[]),...(a.own||[])]){const key=x.id+'|'+x.af;if(own.has(key))continue;let c={...x};if(used.has(c.id))c.id=-Date.now()-own.size-1;used.add(c.id);own.set(key,c)}o.own=[...own.values()];
 const rp=new Map();for(const r of[...(b.reports||[]),...(a.reports||[])])rp.set(r.id+'|'+r.t,r);o.reports=[...rp.values()];
 const ga=a.games||{},gb=b.games||{};o.games={};if(ga.race!=null||gb.race!=null)o.games.race=Math.max(ga.race??0,gb.race??0);if(ga.mem!=null||gb.mem!=null)o.games.mem=Math.min(ga.mem??1e4,gb.mem??1e4);
 o.theme=a.theme;o.rate=a.rate;o.haptic=a.haptic;o.fs=a.fs||'n';o.read=!!a.read;o.instHide=a.instHide||b.instHide;
 o.mt=Math.max(a.mt||0,b.mt||0);o.cloud=1;return o}
function applyState(n){S=n;for(let i=CARDS.length-1;i>=0;i--)if(CARDS[i].own)CARDS.splice(i,1);for(const o of S.own)CARDS.push(ownCard(o));resetCards();theme();
 try{localStorage.setItem(KEY,JSON.stringify(S))}catch{}if(['home','meer','oef'].includes(view))render()}
let pushT=0;
function schedulePush(){clearTimeout(pushT);pushT=setTimeout(push,2500)}
async function push(){if(!cloud.user)return;clearTimeout(pushT);cloud.status='saving';acctRefresh();
 try{const data=JSON.stringify(S);if(data.length>850000)throw Object.assign(new Error('te groot'),{code:'too-large'});await FB.save(cloud.user.uid,{data,mt:Math.round(S.mt||Date.now()),v:1});cloud.status='ok';cloud.at=Date.now()}catch(e){cloud.status=navigator.onLine===false?'offline':'error';cloud.err=String(e&&e.code||e&&e.message||e)}acctRefresh()}
async function pull(){if(!cloud.user)return;cloud.status='saving';acctRefresh();
 try{const r=await FB.load(cloud.user.uid);const remote=r&&typeof r.data==='string'&&r.data.length<900000?cleanState(JSON.parse(r.data)):null;applyState(mergeState(S,remote));S.mt=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S))}catch{}await push()}
 catch(e){cloud.status=navigator.onLine===false?'offline':'error';cloud.err=String(e&&e.code||e&&e.message||e);acctRefresh()}}
async function startCloud(){if(cloud.started)return;cloud.started=1;
 try{const fb=await fbInit();cloud.avail=true;if(fb.redirect)await fb.redirect();
  fb.onUser(u=>{const was=cloud.user&&cloud.user.uid;cloud.user=u?{uid:u.uid,name:u.displayName||'',email:u.email||'',photo:u.photoURL||''}:null;
   if(u&&was!==u.uid){S.cloud=1;pull();cloud.admin=false;fb.isAdmin&&fb.isAdmin(u.uid).then(a=>{cloud.admin=!!a;acctRefresh()})}else if(!u){S.cloud=0;cloud.status='';try{localStorage.setItem(KEY,JSON.stringify(S))}catch{}}acctRefresh()})}
 catch(e){cloud.avail=false;cloud.started=0;cloud.loadErr=String(e&&e.message||e);acctRefresh()}}
addEventListener('online',()=>{if(cloud.user&&cloud.status!=='ok')push()});
function accountBox(){
 if(cloud.avail===undefined){getCfg().then(c=>{if(cloud.avail===undefined){cloud.avail=!!c;acctRefresh()}});return'<div id="acct"></div>'}
 if(!cloud.avail)return'<div id="acct"></div>';
 const u=cloud.user,st={saving:'Bezig met opslaan…',ok:'Opgeslagen'+(cloud.at?' om '+new Date(cloud.at).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}):''),offline:'Offline. Wordt opgeslagen zodra je weer online bent.',error:'Opslaan lukte niet. Probeer het opnieuw.'}[cloud.status]||'';
 return`<div id="acct"><div class="sec">Account</div><div class="card stack">${u?`<div class="row"><span class="avatar">${u.photo?`<img src="${esc(u.photo)}" alt="" referrerpolicy="no-referrer">`:esc((u.name||u.email||'?')[0].toUpperCase())}</span><span class="grow"><b>${esc(u.name||'Ingelogd')}</b><span class="muted" style="display:block">${esc(u.email)}</span></span></div>
 <p class="muted" role="status">${st||'Je voortgang wordt bewaard in je account.'}</p><div class="row"><button class="btn soft" id="csync" style="box-shadow:inset 0 0 0 1.5px var(--hair)">Nu opslaan</button><button class="btn ghost" id="cout">Uitloggen</button></div>${cloud.admin?`<button class="btn soft" data-a="beheer" style="box-shadow:inset 0 0 0 1.5px var(--hair)">${I.inbox}Meldingen beheren</button>`:''}<button class="linkbtn" id="cdel" style="color:var(--bad)">${I.trash}Account en cloudgegevens verwijderen</button>`
 :`<p>Log in met je Google-account om je voortgang te bewaren en op andere apparaten verder te gaan.</p><button class="btn" id="cin">${I.user}Inloggen met Google</button><p class="muted small">Alleen je leervoortgang wordt opgeslagen. Niemand anders kan hem lezen. <a href="privacy.html" style="color:var(--nl)">Privacyverklaring</a>.${cloud.loginErr?'<br><span style="color:var(--bad)">'+esc(cloud.loginErr)+'</span>':''}</p>`}</div></div>`}
function acctRefresh(){if(view!=='meer')return;const el=$('#acct');if(!el)return;el.outerHTML=accountBox();bindAccount()}
function bindAccount(){const i=$('#cin'),o=$('#cout'),y=$('#csync');
 if(i)i.onclick=async()=>{cloud.loginErr='';i.disabled=true;try{await startCloud();await FB.signIn()}catch(e){cloud.loginErr='Inloggen lukte niet ('+(e&&e.code||e&&e.message||'onbekende fout')+').';i.disabled=false;acctRefresh()}};
 if(o)o.onclick=async()=>{await push();try{await FB.signOut()}catch{}cloud.user=null;S.cloud=0;saveNow();V.meer()};
 if(y)y.onclick=()=>pull();
 const dl=$('#cdel');if(dl)dl.onclick=async()=>{if(!confirm('Je account en je opgeslagen voortgang in de cloud worden verwijderd. De voortgang op dit toestel blijft staan. Doorgaan?'))return;
  try{clearTimeout(pushT);const u=cloud.user;cloud.user=null;await FB.remove(u.uid);S.cloud=0;saveNow();cloud.status='';alert('Je account en cloudgegevens zijn verwijderd.');V.meer()}catch(e){cloud.user=cloud.user||null;alert('Verwijderen lukte niet ('+(e&&e.code||e&&e.message||'fout')+'). Probeer het opnieuw.');startCloud()}}}
