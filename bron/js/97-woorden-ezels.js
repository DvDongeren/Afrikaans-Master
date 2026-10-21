/* 97-woorden-ezels.js — Woorden uit verhalen bewaren en ezelsbruggetjes bij moeilijke kaarten.
   Alle bestanden in bron/js worden op volgorde samengevoegd tot één script (één scope).
   Eigen ezelsbruggetjes staan in S.notes als {kaart-id: tekst}. */

/* ---------- woord uit een verhaal bewaren ---------- */
/* Zoekt een bestaande kaart met precies dit Afrikaanse woord (eigen kaarten eerst). */
const cardFor=w=>{const k=w.toLowerCase();let hit=null;for(const c of CARDS)if(c.af.toLowerCase()===k){if(c.own)return c;hit=hit||c}return hit};
function storySave(t,g,vb){const c=cardFor(t);
 if(c&&c.own)return'Staat al in je eigen kaarten.';
 if(c){if(!S.favs.includes(c.id)){S.favs.push(c.id);save()}return'Bewaard bij je favorieten (Kaarten › Favorieten).'}
 let id=-Date.now();for(const o of S.own)if(o.id===id)id--;
 const o={id,nl:g.slice(0,120),af:t.toLowerCase().slice(0,120),vb:(vb||'').slice(0,300)};S.own.push(o);CARDS.push(ownCard(o));resetCards();saveNow();
 return'Toegevoegd aan je eigen kaarten. Hij komt in je volgende sessie.'}
/* Knoppen in het woordvenster van een verhaal. */
function storyActions(t,g,vb){const c=cardFor(t),fav=c&&!c.own&&S.favs.includes(c.id);
 if(c&&c.own)return`<p class="muted small" style="margin-top:8px">${I.check} Staat in je eigen kaarten.</p>`;
 if(fav)return`<p class="muted small" style="margin-top:8px">${I.star} Staat bij je favorieten.</p>`;
 if(c)return`<button class="btn soft sm wsave" data-wsave="1">${I.star}Bewaar als favoriet</button>`;
 if(g)return`<button class="btn soft sm wsave" data-wsave="1">${I.plus}Toevoegen aan mijn kaarten</button>`;
 return`<button class="btn soft sm wsave" data-wown="1">${I.plus}Zelf toevoegen als kaart</button>`}
function bindStoryActions(p,t,g,vb){const s=p.querySelector('[data-wsave]'),o=p.querySelector('[data-wown]');
 if(s)s.onclick=e=>{e.stopPropagation();const m=storySave(t,g,vb);s.outerHTML=`<p class="muted small" role="status" style="margin-top:8px">${I.check} ${esc(m)}</p>`};
 if(o)o.onclick=e=>{e.stopPropagation();go('own',{af:t.toLowerCase(),vb,from:{v:'story',id:st.id}})}}

/* ---------- ezelsbruggetjes ---------- */
/* Klankregels Nederlands → Afrikaans: [patroon in NL, patroon in AF, uitleg]. */
const EZR=[
 [/sch/,/sk/,"Nederlands <b>sch</b> wordt in het Afrikaans <b>sk</b>: school → <i>skool</i>, schip → <i>skip</i>."],
 [/ij/,/y/,"Nederlands <b>ij</b> schrijf je als <b>y</b> (zelfde klank): wijn → <i>wyn</i>, tijd → <i>tyd</i>."],
 [/cht/,/g(?![a-z])|g /,"<b>-cht</b> wordt vaak <b>-g</b>: nacht → <i>nag</i>, licht → <i>lig</i>."],
 [/au/,/ou/,"Nederlands <b>au</b> wordt <b>ou</b>: blauw → <i>blou</i>, saus → <i>sous</i>."],
 [/(^|\s)z/,/(^|\s)s/,"Een <b>z</b> aan het begin wordt meestal <b>s</b>: zon → <i>son</i>, zee → <i>see</i>."],
 [/c(?!h)/,/k/,"Een <b>c</b> wordt in het Afrikaans <b>k</b> (of s): café → <i>kafee</i>."],
 [/\b\w+en\b/,null,"Werkwoorden verliezen hun <b>-en</b> en hebben één vorm: lopen → <i>loop</i>, ik loop, wij <i>loop</i>."]];
function ezelTips(c){const nl=c.nl.toLowerCase(),af=c.af.toLowerCase(),out=[];
 if(D.vv){const v=Y().VV.find(x=>x.af.toLowerCase()===af);if(v)out.push(`<b>Valse vriend:</b> lijkt op ‘${esc(v.schijn)}’, maar betekent <b>${esc(v.echt)}</b>.`)}
 const a=nzs(nl),b=nzs(af);if(a&&b&&a!==b&&Math.abs(a.length-b.length)<=2&&levN(a,b,2)<=2)out.push(`Bijna hetzelfde als het Nederlands. Let op het verschil: <b>${esc(c.nl)}</b> → <b class="af">${esc(c.af)}</b>.`);
 for(const[n,f,t]of EZR){if(out.length>=2)break;if(!n.test(nl))continue;if(f?f.test(af):(c.categorie==='Werkwoorden'&&!/en\b/.test(af)))out.push(t)}
 if(/[êëôîû]/.test(af)&&out.length<2)out.push("Let op het <b>kapje of trema</b>: <i>ê</i> klinkt als een lange è (<i>sê</i> = zeggen), <i>ô</i> als een lange o (<i>môre</i>).");
 return out}
/* Blok in de sessie na het omdraaien: eigen ezelsbruggetje en (bij een kaart die je eerder fout had) tips. */
function ezel(c){if(c.own)return'';const r=S.srs[c.id],note=S.notes[c.id],weak=!!(r&&r.box<=1&&r.t);
 if(!note&&!weak)return'';const tips=weak?ezelTips(c):[];
 return`<div class="ezel"><div class="lbl">${I.bulb}${note?'Jouw ezelsbruggetje':'Ezelsbruggetje'}</div>${note?`<p class="ezn">${esc(note)}</p>`:''}${tips.map(t=>`<p>${t}</p>`).join('')}${!note&&!tips.length?'<p>Deze kaart vind je lastig. Koppel het woord aan een beeld of aan een Nederlands woord dat erop lijkt, en schrijf dat op.</p>':''}<button class="linkbtn" data-ezel="${c.id}">${note?'Aanpassen':'Schrijf je eigen ezelsbruggetje'}</button></div>`}
function ezelEdit(id){const c=byId().get(id);if(!c)return;const cur=S.notes[id]||'';
 sheet(`<h2>Ezelsbruggetje</h2><p style="margin:10px 0 4px"><span class="af" style="font-size:1.15rem">${esc(c.af)}</span> <span class="nl">= ${esc(c.nl)}</span></p><p class="muted" style="margin-bottom:12px">Wat helpt jou dit te onthouden? Een beeld, een rijmpje of een Nederlands woord dat erop lijkt.</p>
 <textarea id="ezt" maxlength="200" aria-label="Ezelsbruggetje" placeholder="Bijvoorbeeld: robot = stoplicht, omdat het ‘automatisch’ regelt">${esc(cur)}</textarea><div class="row" style="margin-top:12px"><button class="btn ghost" data-close="1">Annuleren</button><button class="btn" id="ezs">Bewaren</button></div>`,el=>{
  const ta=el.querySelector('#ezt');setTimeout(()=>ta.focus(),50);
  el.querySelector('#ezs').onclick=()=>{const v=ta.value.trim().slice(0,200);if(v)S.notes[id]=v;else delete S.notes[id];saveNow();el.remove();render()}})}
