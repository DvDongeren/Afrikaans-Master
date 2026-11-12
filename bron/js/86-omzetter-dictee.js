/* 86-omzetter-dictee.js — Lettertoetsen, dictee per letter en de omzetter (Nederlands → Afrikaans in stappen). */
/* ---------- lettertoetsen voor ê, ë, ô … (staan niet op elk toetsenbord) ---------- */
const accRow=id=>`<div class="acc" role="group" aria-label="Letters met een accent">${['ê','ë','ô','î','û','ï','é',"'n"].map(c=>`<button type="button" class="chip" data-ch="${c}" data-for="${id}">${c}</button>`).join('')}</div>`;
document.addEventListener('click',e=>{const b=e.target.closest('[data-ch]');if(!b)return;const t=document.getElementById(b.dataset.for);if(!t)return;
 const a=t.selectionStart??t.value.length,z=t.selectionEnd??a,c=b.dataset.ch;t.value=t.value.slice(0,a)+c+t.value.slice(z);t.focus();try{t.setSelectionRange(a+c.length,a+c.length)}catch{}});

/* ---------- dictee: vergelijkt per woord en daarbinnen per letter ----------
   okw = goed · accw = alleen een accent of apostrof anders (telt goed, wel gemeld) · badw = fout, verkeerde letters onderstreept. */
const dcl=t=>t.toLowerCase().replace(/ŉ/g,"'n").replace(/[’‘`´]/g,"'").replace(/[^\p{L}\p{N}' ]/gu,' ').replace(/\s+/g,' ').trim();
function lcsMark(a,b,eq){const n=a.length,m=b.length,dp=[...Array(n+1)].map(()=>Array(m+1).fill(0));
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=eq(a[i],b[j])?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 const pair=Array(m).fill(-1);let i=0,j=0;while(i<n&&j<m){if(eq(a[i],b[j])){pair[j]=i;i++;j++}else if(dp[i+1][j]>=dp[i][j+1])i++;else j++}return pair}
function dictDiff(typed,goal){const T=dcl(typed).split(' ').filter(Boolean),raw=goal.split(/\s+/),G=raw.map(dcl);
 /* eerst de woorden die (op accenten na) kloppen aan elkaar koppelen; wat ertussen overblijft hoort bij elkaar */
 const pair=lcsMark(T,G,(x,y)=>!!y&&nzs(x)===nzs(y)),used=new Set(pair.filter(x=>x>=0));
 let prev=-1;G.forEach((g,k)=>{if(pair[k]>=0){prev=pair[k];return}if(!g)return;let nx=T.length;for(let q=k+1;q<G.length;q++)if(pair[q]>=0){nx=pair[q];break}
  for(let c=prev+1;c<nx;c++)if(!used.has(c)){pair[k]=c;used.add(c);prev=c;break}});
 let bad=0,acc=0;const html=raw.map((w,k)=>{const g=G[k];if(!g)return esc(w);const t=pair[k]>=0?T[pair[k]]:null;
  if(t===g)return`<span class="okw">${esc(w)}</span>`;
  if(t!==null&&nzs(t)===nzs(g))acc++;else bad++;
  const tc=[...(t||'')],hit=new Set();if(t!==null){const lo=[...w].map(c=>dcl(c)||c.toLowerCase());lcsMark(tc,lo,(x,y)=>x===y).forEach((p,j)=>{if(p>=0)hit.add(j)})}
  return`<span class="${t!==null&&nzs(t)===nzs(g)?'accw':'badw'}">${[...w].map((c,j)=>hit.has(j)||!/[\p{L}\p{N}']/u.test(c)?esc(c):`<u>${esc(c)}</u>`).join('')}</span>`}).join(' ');
 const extra=T.filter((_,k)=>!used.has(k));return{ok:!bad&&!extra.length,acc:acc>0,extra,html}}

/* ---------- omzetter ---------- */
const omk=t=>esc(t).replace(/\*([^*]+)\*/g,'<mark>$1</mark>');
V.omzet=()=>{const O=X().OMZ,R=X().OMR;
 if(!st.items){const f=st.f||'',has=k=>O.filter(o=>o.s.some(s=>s[0]===k));
  if(!st.go){draw(`${back('oef','Oefenen')}<h1>Omzetter</h1><p class="muted" style="margin:8px 0 16px">Een Nederlandse zin wordt stap voor stap Afrikaans. Probeer hem eerst zelf. Daarna zie je per stap welke regel je nodig had.</p>
   <div class="lbl" style="margin:0 2px 6px">Oefen op</div><div class="chips wrap" id="of"><button class="chip ${f?'':'on'}" data-or="">Alle regels</button>${Object.keys(R).filter(k=>has(k).length>=4).map(k=>`<button class="chip ${f===k?'on':''}" data-or="${k}">${esc(R[k][0])}</button>`).join('')}</div>
   ${f?`<div class="tip" style="margin-top:12px"><b>${esc(R[f][0])}.</b> ${esc(R[f][1])}</div>`:''}
   <button class="btn" id="og" style="margin-top:16px">Start met ${Math.min(6,(f?has(f):O).length)} zinnen</button>
   <details style="margin-top:18px"><summary>Alle ${Object.keys(R).length} regels op een rij</summary><div class="list">${Object.values(R).map(r=>`<div class="li" style="display:block"><b>${esc(r[0])}</b><div class="muted" style="margin-top:2px">${esc(r[1])}</div></div>`).join('')}</div></details>`);
   $('#of').onclick=e=>{const b=e.target.closest('[data-or]');if(b){st.f=b.dataset.or;V.omzet()}};$('#og').onclick=()=>{st.go=1;V.omzet()};return}
  st.items=shuffle(f?has(f):O).slice(0,6);st.i=0;st.sc=0;st.res=null;st.k=0}
 const u=st.items[st.i],n=st.items.length;
 if(!u){result(st.sc,n,praise(st.sc,n),'<button class="btn" data-a="omzet">Nog een ronde</button><button class="btn ghost" data-a="oef">Terug naar oefenen</button>');return}
 const r=st.res,k=st.k,all=r&&k>=u.s.length;
 draw(`${topbar(st.i,n,'oef')}<div class="card q"><div class="lbl">Maak hier Afrikaans van</div><div class="big" style="font-size:1.4rem">${esc(u.nl)}</div></div>
 ${!r?`<form id="om" style="margin-top:12px"><input type="text" id="oa" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Jouw Afrikaanse zin" aria-label="Jouw Afrikaanse zin">${accRow('oa')}<div class="row" style="margin-top:10px"><button type="button" class="btn ghost" id="osk">Toon de stappen</button><button class="btn" type="submit">Controleer</button></div></form>`
 :`${r.typed?`<div class="card pfb ${r.ok?'good':'wrong'}" role="status"><b>${r.ok?'Goed!':'Net niet.'}</b> ${r.ok?'Zo kom je er:':`Jij typte: <span class="af">${esc(r.typed)}</span>`}</div>`:''}
  <ol class="omz">${u.s.slice(0,k).map(s=>`<li><div class="lbl">${esc(R[s[0]][0])}</div><div class="af">${omk(s[1])}</div><div class="muted small">${esc(s[2]||R[s[0]][2])}</div></li>`).join('')}</ol>
  ${all?`<div class="card" style="margin-top:12px"><div class="lbl">Afrikaans</div><div class="af" style="font-size:1.3rem;margin-top:4px">${esc(u.af)}</div></div><div class="row" style="margin-top:12px">${spk(u.af)}${nextBtn('onx',st.i+1>=n)}</div>`
  :`<button class="btn" id="ost" style="margin-top:12px">Volgende stap (${k+1} van ${u.s.length})</button>`}`}`);
 if(!r){const check=v=>{v=v.trim();const ok=!!v&&nzs(v)===nzs(u.af);st.res={ok,typed:v};st.k=ok?u.s.length:1;if(ok){st.sc++;count()}else if(v)buzz('bad');V.omzet()};
  $('#om').onsubmit=e=>{e.preventDefault();check($('#oa').value)};$('#osk').onclick=()=>check('');requestAnimationFrame(()=>{const t=$('#oa');t&&t.focus({preventScroll:true})});return}
 if(all){$('#onx').onclick=()=>{st.i++;st.res=null;st.k=0;V.omzet();scrollTo(0,0)};focusNext('onx')}
 else{$('#ost').onclick=()=>{st.k++;V.omzet()};focusNext('ost')}};
