/* 80-vertalen-spiekbrief.js — Vrij vertalen en spiekbrief.
   Alle bestanden in bron/js worden op volgorde samengevoegd tot één script (één scope). */
/* ---------- vrij vertalen ---------- */
function lev(a,b){if(Math.abs(a.length-b.length)>1)return 2;const m=a.length,n=b.length;let p=[...Array(n+1).keys()];for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[n]}
function alignDiff(typed,goal){const T=nzs(typed).split(' ').filter(Boolean),raw=goal.split(/\s+/),G=raw.map(nzs);
 const eq=(x,y)=>!y?0:x===y?2:(y.length>=4&&lev(x,y)<=1)?1:0,n=T.length,m=G.length;
 const dp=[...Array(n+1)].map(()=>Array(m+1).fill(0));for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=Math.max(dp[i+1][j],dp[i][j+1],eq(T[i],G[j])?dp[i+1][j+1]+1:0);
 const mark=Array(m).fill('badw'),used=Array(n).fill(false);let i=0,j=0;
 while(i<n&&j<m){const e=eq(T[i],G[j]);if(e&&dp[i][j]===dp[i+1][j+1]+1){mark[j]=e===2?'okw':'nearw';used[i]=true;i++;j++}else if(dp[i+1][j]>=dp[i][j+1])i++;else j++}
 G.forEach((g,k)=>{if(!g)mark[k]='okw'});const extra=T.filter((_,k)=>!used[k]);
 return{ok:mark.every(x=>x!=='badw')&&!extra.length,near:mark.includes('nearw'),extra,html:raw.map((w,k)=>`<span class="${mark[k]}">${esc(w)}</span>`).join(' ')}}
const TPOOL=L(()=>{const a=[],seen=new Set(),add=(af,nl)=>{const w=af.split(/\s+/).length;if(w<3||w>9||!nl||seen.has(af))return;seen.add(af);a.push({af,nl})};
 X().REIS.forEach(r=>add(r.af,r.nl));DLG().forEach(d=>d.lines.forEach(l=>add(l.af,l.nl)));Y().ST.forEach(x=>x.s.forEach(p=>add(p[0],p[1])));return a});
V.vertaal=()=>{
 if(!st.items){if(!st.go)return draw(`${back('oef','Oefenen')}<h1>Vrij vertalen</h1><p class="muted" style="margin:8px 0 16px">Je krijgt een Nederlandse zin. Typ hoe je hem in het Afrikaans zegt. Hoofdletters en leestekens tellen niet mee, en een kleine tikfout rekenen we goed.</p><div class="card muted">Er zijn vaak meerdere goede vertalingen. Zegt de app dat het fout is, maar weet je zeker dat jouw zin ook klopt? Tik dan op <b>Ik had het goed</b>.</div><button class="btn" data-vgo="1" style="margin-top:16px">Start (10 zinnen)</button>`);
  st.items=shuffle(TPOOL().slice()).slice(0,10);st.i=0;st.sc=0;st.res=null}
 const u=st.items[st.i],n=st.items.length;
 if(!u)return result(st.sc,n,praise(st.sc,n),'<button class="btn" data-a="vertaal">Nog een ronde</button><button class="btn ghost" data-a="oef">Terug naar oefenen</button>');
 const r=st.res;
 draw(`${topbar(st.i,n,'oef')}<div class="card q"><div class="lbl">Vertaal naar het Afrikaans</div><div class="big nl" style="margin-top:10px">${esc(u.nl)}</div></div>
 ${r?`<div class="card stack" style="margin-top:12px"><div class="lbl">${r.ok?(r.near?'Goed, op een tikfout na!':'Helemaal goed!'):r.self?'Goed gerekend':'Vergelijk met deze vertaling:'}</div><div class="row sp" style="align-items:flex-start"><div class="af" style="font-size:1.2rem;line-height:1.6">${r.html}</div>${spk(u.af,'sm')}</div>${r.ok?'':`<div class="muted">Jij typte: ${esc(r.typed)||'(niets)'}</div>`}${r.extra&&r.extra.length&&!r.ok?`<div class="muted small">Niet in deze vertaling: ${esc(r.extra.join(', '))}</div>`:''}</div>
  <div class="row" style="margin-top:12px">${!r.ok&&!r.self&&r.typed?'<button class="btn ghost" data-vself="1">Ik had het goed</button>':''}<button class="btn" data-vnext="1">${st.i+1<n?'Volgende':'Klaar'}</button></div>`
 :`<form id="vf" style="margin-top:12px"><textarea id="va" rows="2" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Typ je vertaling" aria-label="Jouw vertaling"></textarea><div class="row" style="margin-top:10px"><button type="button" class="btn ghost" data-vskip="1">Weet ik niet</button><button class="btn" type="submit">Controleer</button></div></form>`}`);
 const f=$('#vf');if(f){const a=$('#va');setTimeout(()=>a.focus(),50);f.onsubmit=e=>{e.preventDefault();vCheck(a.value)};a.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();vCheck(a.value)}}}};
function vCheck(v){const u=st.items[st.i],d=alignDiff(v,u.af);st.res={...d,typed:v.trim()};if(d.ok){st.sc++;count()}else buzz('bad');V.vertaal()}

/* ---------- spiekbrief afdrukken ---------- */
V.print=()=>{st.src=st.src||'cat';st.cat=st.cat??(META.cat[0]||'');st.plv=st.plv||'Beginner';st.vb=st.vb??false;
 const lst=st.src==='fav'?CARDS.filter(c=>S.favs.includes(c.id)):st.src==='weak'?weakList():st.src==='lv'?CARDS.filter(c=>c.niveau===st.plv&&!c.own):CARDS.filter(c=>c.categorie===st.cat);
 const max=400,L=lst.slice(0,max),title=st.src==='fav'?'Mijn favorieten':st.src==='weak'?'Moeilijke kaarten':st.src==='lv'?st.plv:st.cat;
 const opt=(v,l,cur)=>`<option value="${esc(v)}" ${cur===v?'selected':''}>${esc(l)}</option>`;
 draw(`<div class="noprint">${back('kaart','Kaarten')}<h1>Spiekbrief</h1><p class="muted" style="margin-top:6px">Maak een overzicht om af te drukken of als pdf op te slaan.</p>
 <div class="card stack" style="margin-top:14px"><label class="lbl" for="psrc">Welke kaarten?</label><select class="sel" id="psrc">${opt('cat','Een onderwerp',st.src)}${opt('lv','Een niveau',st.src)}${opt('fav','Mijn favorieten ('+S.favs.length+')',st.src)}${opt('weak','Moeilijke kaarten',st.src)}</select>
 ${st.src==='cat'?`<select class="sel" id="pcat" aria-label="Onderwerp">${(S.own.length?['Eigen kaarten'].concat(META.cat):META.cat).map(c=>opt(c,c,st.cat)).join('')}</select>`:''}
 ${st.src==='lv'?`<select class="sel" id="plv" aria-label="Niveau">${META.lv.map(c=>opt(c,c,st.plv)).join('')}</select>`:''}
 <label class="check"><input type="checkbox" id="pvb" ${st.vb?'checked':''}> Met voorbeeldzinnen</label>
 <button class="btn" id="pgo" ${L.length?'':'disabled'}>${I.print}Afdrukken of opslaan als pdf</button>
 ${lst.length>max?`<p class="muted small">Alleen de eerste ${max} van ${lst.length} kaarten worden afgedrukt.</p>`:''}</div></div>
 <section class="sheetpr"><h2 class="prt">Afrikaans Master · ${esc(title)} <span class="muted">(${L.length})</span></h2>
 ${L.length?`<table class="prtab"><thead><tr><th>Nederlands</th><th>Afrikaans</th></tr></thead><tbody>${L.map(c=>`<tr><td>${esc(c.nl)}</td><td><span class="af">${esc(c.af)}</span>${st.vb&&c.voorbeeld?`<div class="pex">${esc(c.voorbeeld)}</div>`:''}</td></tr>`).join('')}</tbody></table>`:'<p class="muted">Geen kaarten in deze selectie.</p>'}</section>`);
 const on=(id,f)=>{const e=$(id);if(e)e.onchange=f};
 on('#psrc',e=>{st.src=e.target.value;V.print()});on('#pcat',e=>{st.cat=e.target.value;V.print()});on('#plv',e=>{st.plv=e.target.value;V.print()});on('#pvb',e=>{st.vb=e.target.checked;V.print()});
 $('#pgo').onclick=()=>window.print()};
