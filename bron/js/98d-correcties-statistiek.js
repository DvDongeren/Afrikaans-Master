/* 98d-correcties-statistiek.js — Kaartcorrecties door de beheerder en anonieme gebruikstellingen.
   Alle bestanden in bron/js worden op volgorde samengevoegd tot één script (één scope).
   Beide gaan via de lichte REST-ingang van Firestore, zodat gewone bezoekers de Firebase-bibliotheek niet hoeven te laden. */
async function fbRest(){const c=await getCfg();return c&&c.fb&&c.fb.projectId&&c.fb.apiKey?{p:c.fb.projectId,k:c.fb.apiKey}:null}
const FSURL=p=>`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(p)}/databases/(default)/documents`;

/* ---------- correcties: fixes/{kaart-id} = {af,nl,voorbeeld,vbnl,tips}; iedereen leest, alleen beheerders schrijven ---------- */
const FXK='af2fx',FXF=['af','nl','voorbeeld','vbnl','tips'];
let FIX=(()=>{try{const o=JSON.parse(localStorage.getItem(FXK)||'null');return o&&Array.isArray(o.l)?o:{t:0,l:[]}}catch{return{t:0,l:[]}}})();
function fixSave(){FIX.t=Date.now();try{localStorage.setItem(FXK,JSON.stringify(FIX))}catch{}}
/* Past de correcties toe op de geladen kaarten. Geeft het aantal gewijzigde velden terug. */
function applyFixes(){if(!FIX.l.length||!CARDS.length)return 0;const m=byId();let n=0;
 for(const f of FIX.l){const c=m.get(f.id);if(!c||c.own)continue;for(const k of FXF)if(typeof f[k]==='string'&&f[k]!==c[k]&&(f[k]||(k!=='af'&&k!=='nl'))){c[k]=f[k];n++}}
 if(n)resetCards();return n}
async function loadFixes(force){if(!force&&Date.now()-FIX.t<6*36e5)return;
 try{let l;if(TESTHOOK&&window.__cloudAdapter){if(!window.__cloudAdapter.listFixes)return;l=await window.__cloudAdapter.listFixes()}
  else{const r=await fbRest();if(!r)return;const res=await fetch(FSURL(r.p)+'/fixes?pageSize=300&key='+encodeURIComponent(r.k),{credentials:'omit'});if(!res.ok)return;const j=await res.json();
   l=(j.documents||[]).map(d=>{const o={id:+String(d.name).split('/').pop()};for(const k of FXF){const v=d.fields&&d.fields[k];if(v&&typeof v.stringValue==='string')o[k]=v.stringValue.slice(0,400)}return o}).filter(o=>o.id>0&&o.af&&o.nl)}
  FIX={t:0,l:l.slice(0,1000)};fixSave();if(applyFixes()&&['kaart','zoek','home'].includes(view))render()}catch{}}
/* Bewerkscherm voor de beheerder (vanuit een melding, het gebruiksoverzicht, de correctielijst of de kaartenlijst). */
function fixSheet(id,doc){const c=byId().get(id);if(!c)return alert('Kaart '+id+' is niet gevonden.');
 const f=(k,l,max,area)=>`<label class="lbl" for="fx_${k}">${l}</label>${area?`<textarea id="fx_${k}" maxlength="${max}" rows="2">${esc(c[k]||'')}</textarea>`:`<input type="text" id="fx_${k}" maxlength="${max}" value="${esc(c[k]||'')}">`}`;
 sheet(`<h2>Kaart ${id} verbeteren</h2><div class="stack fxs" style="margin-top:12px">${f('af','Afrikaans',200)}${f('nl','Nederlands',200)}${f('voorbeeld','Voorbeeldzin (Afrikaans)',400,1)}${f('vbnl','Vertaling van de voorbeeldzin',400,1)}${f('tips','Tip (mag leeg)',400,1)}</div>
 <p class="muted small" style="margin-top:8px">De correctie geldt meteen voor alle gebruikers.${doc?' De melding wordt daarna als afgehandeld verwijderd.':''}</p><div class="row" style="margin-top:12px"><button class="btn ghost" data-close="1">Annuleren</button><button class="btn" id="fxs">Opslaan</button></div><p class="muted small" id="fxm" role="status"></p>`,el=>{
  el.querySelector('#fxs').onclick=async()=>{const o={};for(const k of FXF)o[k]=el.querySelector('#fx_'+k).value.trim();
   if(!o.af||!o.nl){el.querySelector('#fxm').textContent='Afrikaans en Nederlands zijn verplicht.';return}
   const b=el.querySelector('#fxs');b.disabled=true;
   try{await FB.saveFix(id,o);if(doc)await FB.delReport(doc);FIX.l=FIX.l.filter(x=>x.id!==id).concat([{id,...o}]);fixSave();applyFixes();el.remove();
    if(view==='beheer'){if(doc&&st.list)st.list=st.list.filter(r=>r.doc!==doc);if(st.tab==='fix')st.list=null;V.beheer()}else render()}
   catch(e){b.disabled=false;el.querySelector('#fxm').textContent='Opslaan lukte niet ('+(e&&e.code||e&&e.message||e)+').'}}})}

/* ---------- anonieme statistiek: stats/{datum} = {v:{scherm:n}, d:{oefening:n}, f:{c<kaart>:n}, x:{visits:n}} ----------
   Alleen optellingen, zonder gebruikers-ID of toestel-ID. Uit te zetten in Meer (S.stat = false). */
const STK='af2s';
let STB=(()=>{try{const o=JSON.parse(localStorage.getItem(STK)||'null');return o&&typeof o==='object'?o:{}}catch{return{}}})();
let stT=0;const stSave=()=>{if(!stT)stT=setTimeout(()=>{stT=0;try{localStorage.setItem(STK,JSON.stringify(STB))}catch{}},800)};
function stat(g,k){if(S.stat===false||!/^[a-z][a-z0-9]{0,24}$/.test(k))return;const d=fmt(new Date()),b=STB[d]||(STB[d]={}),o=b[g]||(b[g]={});o[k]=(o[k]||0)+1;stSave()}
let stBusy=false;
async function statFlush(keep){if(S.stat===false){STB={};try{localStorage.removeItem(STK)}catch{}return}
 const days=Object.keys(STB).sort().slice(-7);if(!days.length||stBusy)return;stBusy=true;const snap={};for(const d of days)snap[d]=STB[d];STB={};try{localStorage.setItem(STK,'{}')}catch{}
 try{if(TESTHOOK&&window.__cloudAdapter){if(window.__cloudAdapter.stats)await window.__cloudAdapter.stats(snap)}
  else{const r=await fbRest();if(r){const writes=days.map(d=>({transform:{document:`projects/${r.p}/databases/(default)/documents/stats/${d}`,
    fieldTransforms:Object.entries(snap[d]).flatMap(([g,o])=>Object.entries(o).slice(0,400).map(([k,n])=>({fieldPath:g+'.'+k,increment:{integerValue:String(n|0)}})))}}));
   const res=await fetch(FSURL(r.p)+':commit?key='+encodeURIComponent(r.k),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({writes}),keepalive:!!keep,credentials:'omit'});
   if(!res.ok&&res.status>=500)throw 0}}}
 catch{/* later opnieuw proberen */for(const d in snap){const b=STB[d]||(STB[d]={});for(const g in snap[d]){const o=b[g]||(b[g]={});for(const k in snap[d][g])o[k]=(o[k]||0)+snap[d][g][k]}}stSave()}
 finally{stBusy=false}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')statFlush(true)});
setInterval(()=>statFlush(false),10*6e4);
if(TESTHOOK)window.__statFlush=statFlush;
