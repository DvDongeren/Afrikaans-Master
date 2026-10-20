/* 50-media-uitspraak.js — Muziek, films en series; uitspraakgids.
   Alle bestanden in bron/js worden op volgorde samengevoegd tot één script (één scope). */
/* ---------- muziek, films en series ---------- */
const ext=(u,l,cls='')=>`<a class="chip ${cls}" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${l}<span class="sr"> (opent in nieuw venster)</span></a>`;
const enc=encodeURIComponent,YT=q=>'https://www.youtube.com/results?search_query='+enc(q),SP=q=>'https://open.spotify.com/search/'+enc(q),JW=q=>'https://www.justwatch.com/nl/search?q='+enc(q);
V.media=()=>{const m=MED();st.tab=st.tab||'muziek';st.lv=st.lv||'';let body='';
 const lvl=l=>`<span class="tag ${l.startsWith('Makkelijk')?'ok':/^(Lastig|Gevorderd)/.test(l)?'hard':''}">${esc(l)}</span>`;
 const title=x=>`<div class="card media"><div class="mh"><h2 class="af">${esc(x.t)}</h2>${lvl(x.lv)}</div><div class="muted small">${esc(x.g)}${x.j?' · '+x.j:''}</div><p>${esc(x.d)}</p><div class="chips wrap mlinks">${ext(JW(x.t),'Waar te zien','on')}${ext(YT(x.t+' trailer'),'Trailer')}</div></div>`;
 const filt=list=>{const L=st.lv?list.filter(x=>x.lv.startsWith(st.lv)):list;return`<div class="seg" id="mlv" style="margin:0 0 14px">${[['','Alle'],['Makkelijk','Makkelijk'],['Gemiddeld','Gemiddeld'],['Lastig','Kaaps']].map(([v,l])=>`<button class="chip ${st.lv===v?'on':''}" data-lv="${v}">${l}</button>`).join('')}</div><div class="stack cols">${L.map(title).join('')}</div>`};
 if(st.tab==='muziek'){const G=[...new Set(m.muziek.map(x=>x.g))];
  body=G.map(g=>`<section><div class="sec">${esc(g)}</div><div class="stack cols">${m.muziek.filter(x=>x.g===g).map(x=>`<div class="card media"><h2 class="af">${esc(x.n)}</h2><p>${esc(x.d)}</p>${x.s?`<p class="small"><span class="muted">Begin met:</span> <span class="af">${esc(x.s)}</span></p>`:''}<div class="chips wrap mlinks">${ext(SP(x.n),'Spotify','on')}${ext(YT(x.n+(x.s?' '+x.s:'')),'YouTube')}</div></div>`).join('')}</div></section>`).join('')}
 else if(st.tab==='films')body=filt(m.films);
 else if(st.tab==='series')body=filt(m.series);
 else if(st.tab==='lezen'){const R=m.lezen,GB=q=>'https://www.google.com/search?tbm=bks&q='+enc(q);
  body=`<section><div class="sec">Nieuws en artikelen</div><div class="stack cols">${R.nieuws.map(x=>`<div class="card media"><div class="mh"><h2>${esc(x.n)}</h2><span class="tag ${x.prijs==='Gratis'?'ok':''}">${esc(x.prijs)}</span></div><p>${esc(x.d)}</p><div class="chips mlinks">${ext(x.url,'Openen','on')}</div></div>`).join('')}</div></section>
  ${['Makkelijk','Gemiddeld','Gevorderd'].map(l=>`<section><div class="sec">Boeken · ${l.toLowerCase()}</div><div class="stack cols">${R.boeken.filter(b=>b.lv===l).map(b=>`<div class="card media"><div class="mh"><h2 class="af">${esc(b.t)}</h2>${lvl(b.lv)}</div><div class="muted small">${esc(b.a)}</div><p>${esc(b.d)}</p><div class="chips mlinks">${ext(GB(b.t+' '+b.a),'Zoek dit boek','on')}</div></div>`).join('')}</div></section>`).join('')}
  <p class="muted small" style="margin-top:14px">${esc(R.tip)}</p>`}
 else body=`<section><div class="sec">Gratis</div><div class="stack cols">${m.gratis.map(x=>`<div class="card media"><div class="mh"><h2>${esc(x.n)}</h2><span class="tag ok">Gratis</span></div><p>${esc(x.d)}</p><div class="chips mlinks">${ext(x.url,'Openen','on')}</div></div>`).join('')}</div></section>
  <section><div class="sec">Betaald</div><div class="stack cols">${m.betaald.map(x=>`<div class="card media"><div class="mh"><h2>${esc(x.n)}</h2>${x.n==='JustWatch'?'<span class="tag ok">Gratis hulpmiddel</span>':'<span class="tag">Betaald</span>'}</div><p>${esc(x.d)}</p><div class="chips mlinks">${ext(x.url,'Openen','on')}</div></div>`).join('')}</div></section>
  <p class="muted small" style="margin-top:14px">Waar een film of serie te zien is, verandert vaak. Daarom linken we naar zoekpagina's in plaats van naar vaste adressen.</p>`;
 draw(`${back('oef','Oefenen')}<h1>Muziek, films en series</h1><p class="muted" style="margin-top:6px">Leer Afrikaans door te luisteren, te kijken en te lezen.</p>
 <details class="card tips" style="margin-top:14px"><summary>Tips om ermee te leren</summary><ul>${m.tips.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></details>
 <div class="seg" id="mt" style="margin:16px 0">${[['muziek','Muziek'],['films','Films'],['series','Series'],['lezen','Lezen'],['waar','Bronnen']].map(t=>`<button class="chip ${st.tab===t[0]?'on':''}" data-mt="${t[0]}">${t[1]}</button>`).join('')}</div>${body}`);
 $('#mt').onclick=e=>{const b=e.target.closest('[data-mt]');if(b){st.tab=b.dataset.mt;st.lv='';V.media();scrollTo(0,0)}};
 const lv=$('#mlv');if(lv)lv.onclick=e=>{const b=e.target.closest('[data-lv]');if(b){st.lv=b.dataset.lv;V.media()}}};

/* ---------- uitspraakgids ---------- */
V.klank=()=>{const K=X().KLANK;
 draw(`${back('oef','Oefenen')}<h1>Uitspraakgids</h1><p class="muted" style="margin-top:6px">De klanken die anders zijn dan in het Nederlands. Tik op een woord om het te horen.</p>${voiceNote()}
 <div class="stack cols" style="margin-top:16px">${K.map(k=>`<div class="card media"><div class="mh"><h2 class="af klank">${esc(k.k)}</h2><span class="tag">${esc(k.t)}</span></div><p>${esc(k.nl)}</p><div class="chips wrap" style="margin-top:12px">${k.ex.map(([a,n])=>`<button class="chip" data-sp="${esc(a)}">${I.spk}<span class="af">${esc(a)}</span><span class="nl">${esc(n)}</span></button>`).join('')}</div></div>`).join('')}</div>`)};
