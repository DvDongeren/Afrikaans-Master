"""Uitspraakgids, spelletjes, inzicht, lezen, installeren en centrale meldingen."""
import json
from playwright.sync_api import sync_playwright
U='http://127.0.0.1:8765/'; errs=[]; REPORTS=[]
MOCK="""
window.__cloudAdapter=(()=>{let cb=null;const U={uid:'admin1',displayName:'Beheerder',email:'b@example.com',photoURL:''};
 return{signIn:async()=>{localStorage.setItem('mocklogin','1');setTimeout(()=>cb&&cb(U),30)},signOut:async()=>{cb&&cb(null)},
 onUser:f=>{cb=f;setTimeout(()=>f(localStorage.getItem('mocklogin')?U:null),10)},redirect:async()=>null,
 load:async()=>null,save:async()=>{},
 report:async r=>{await window.repAdd(JSON.stringify(r))},
 isAdmin:async uid=>uid==='admin1',
 listReports:async()=>JSON.parse(await window.repList()),
 delReport:async doc=>{await window.repDel(doc)}}})();
"""
def page(b,mock=False,voices=None,state=None):
    ctx=b.new_context(viewport={'width':390,'height':844}); pg=ctx.new_page()
    pg.add_init_script("addEventListener('securitypolicyviolation',e=>console.error('CSP '+e.violatedDirective+' '+e.blockedURI))")
    pg.on('pageerror',lambda e:errs.append(str(e)[:160])); pg.on('console',lambda m:errs.append(m.text[:140]) if m.type=='error' else None)
    pg.on('dialog',lambda d:d.accept())
    if voices is not None:
        pg.add_init_script("try{speechSynthesis.getVoices=()=>%s}catch(e){}"%json.dumps(voices))
    if state: pg.add_init_script("if(!localStorage.getItem('af2'))localStorage.setItem('af2',JSON.stringify(%s))"%json.dumps(state))
    if mock:
        pg.expose_function('repAdd',lambda r: REPORTS.append(dict(json.loads(r),doc='d%d'%len(REPORTS),t=0)))
        pg.expose_function('repList',lambda: json.dumps(REPORTS))
        pg.expose_function('repDel',lambda d: REPORTS.__setitem__(slice(None),[x for x in REPORTS if x['doc']!=d]))
        pg.add_init_script(MOCK)
    pg.goto(U); pg.wait_for_selector('#nav [data-v]'); return ctx,pg

with sync_playwright() as p:
    b=p.chromium.launch()
    # --- uitspraakgids zonder Afrikaanse stem ---
    ctx,pg=page(b,voices=[{'lang':'nl-NL','name':'Xander'}])
    pg.click('#nav [data-v=oef]'); pg.click('[data-a=klank]'); pg.wait_for_selector('.card.media')
    print('klanken:',pg.locator('.card.media').count(),'| stemwaarschuwing:',pg.locator('.card.warn').count())
    pg.click('#nav [data-v=meer]'); print('meer: stemuitleg:',pg.locator('[data-a=klank].linkbtn').count()); ctx.close()
    # --- met Afrikaanse stem: geen waarschuwing ---
    ctx,pg=page(b,voices=[{'lang':'af-ZA','name':'Afrikaans'}])
    pg.click('#nav [data-v=oef]'); pg.click('[data-a=klank]'); pg.wait_for_selector('.card.media'); print('met af-stem waarschuwing:',pg.locator('.card.warn').count()); ctx.close()

    # --- spelletjes ---
    ctx,pg=page(b)
    pg.click('#nav [data-v=oef]'); pg.click('[data-a=spel]'); pg.click('[data-a=mem]'); pg.wait_for_selector('.mem')
    pg.screenshot(path='x_mem.png')
    pairs=pg.evaluate("async()=>{const F=JSON.parse(document.getElementById('app').dataset.files);const t=(await Promise.all(['cards0','cards1','cards2'].map(n=>fetch(F[n]).then(r=>r.text())))).join('\\n');const m={};for(const r of t.split('\\n')){const f=r.split('\\t');if(f.length>4){(m[f[4]]=m[f[4]]||[]).push(f[3]);(m[f[3]]=m[f[3]]||[]).push(f[4])}}return m}")
    seen={}
    for _ in range(60):
        if pg.locator('.result').count(): break
        closed=pg.eval_on_selector_all('[data-mi]:not(.done):not(.open)','e=>e.map(x=>+x.dataset.mi)')
        if not closed: pg.wait_for_timeout(950); continue
        a=closed[0]; pg.click(f'[data-mi="{a}"]'); ta=pg.inner_text(f'[data-mi="{a}"]'); seen[a]=ta
        mate=[i for i,t in seen.items() if i!=a and i in closed and t in pairs.get(ta,[])]
        if mate: bidx=mate[0]
        else: bidx=[i for i in closed if i!=a and i not in seen][0] if [i for i in closed if i!=a and i not in seen] else [i for i in closed if i!=a][0]
        pg.click(f'[data-mi="{bidx}"]')
        if pg.locator('.result').count(): break
        seen[bidx]=pg.inner_text(f'[data-mi="{bidx}"]') if pg.locator(f'[data-mi="{bidx}"]').count() else ''
        pg.wait_for_timeout(950)
    print('memory klaar:',pg.inner_text('h1'),'| beurten:',pg.inner_text('.score'))
    rec=pg.evaluate("JSON.parse(localStorage.getItem('af2')).games"); print('record opgeslagen:',rec)
    pg.click('[data-again=mem]'); print('opnieuw:',pg.locator('[data-mi]').count())
    # tijdrace (tijd versnellen)
    pg.click('[data-a=spel]'); pg.click('[data-a=race]'); pg.wait_for_selector('[data-ro]')
    pg.screenshot(path='x_race.png')
    for _ in range(5):
        pg.click('[data-ro]'); pg.wait_for_timeout(750)
    pg.evaluate("st.t0=Date.now()-61000") if False else None
    pg.clock if False else None
    print('race loopt, score zichtbaar:',pg.locator('#rs').count())
    ctx.close()
    ctx=b.new_context(viewport={'width':390,'height':844}); pg=ctx.new_page(); pg.clock.install()
    pg.on('pageerror',lambda e:errs.append(str(e)[:160]))
    pg.goto(U); pg.wait_for_selector('#nav [data-v]'); pg.click('#nav [data-v=oef]'); pg.click('[data-a=spel]'); pg.click('[data-a=race]'); pg.wait_for_selector('[data-ro]')
    pg.clock.fast_forward(62000); pg.wait_for_selector('.result',timeout=5000); print('race einde:',pg.inner_text('h1'),'| score',pg.inner_text('.score'))
    ctx.close()

    # --- inzicht met voortgang ---
    import time; now=int(time.time()*1000); D=864e5
    srs={str(i):{'box':(i%6),'due':now+(i%7)*D,'t':now-1000,'f':now-(i%10)*D} for i in range(60)}
    ctx,pg=page(b,state={'srs':srs,'days':{'2026-10-18':5,'2026-10-19':9,'2026-10-20':3},'lvDone':True})
    pg.click('#nav [data-v=meer]'); pg.click('[data-a=inzicht]'); pg.wait_for_selector('.wkbars')
    print('inzicht: dagen',pg.locator('.wkbars > div').count(),'| niveaus',pg.locator('.ibar').count()>3,'| tempo:',pg.inner_text('.sec:has-text("Tempo") + .card')[:90])
    pg.screenshot(path='x_inzicht.png',full_page=True)
    if pg.locator('[data-icat]').count():
        pg.click('[data-icat]'); print('lastig onderwerp opent kaarten:',pg.inner_text('h1'))
    ctx.close()

    # --- lezen-tab ---
    ctx,pg=page(b)
    pg.click('#nav [data-v=oef]'); pg.click('[data-a=media]'); pg.click('[data-mt=lezen]')
    print('lezen secties:',pg.eval_on_selector_all('.sec','e=>e.map(x=>x.textContent)'),'| eerste boeklink:',pg.get_attribute('.sec:has-text("Boeken") + .stack .mlinks a','href')[:60])
    pg.screenshot(path='x_lezen.png')
    w=pg.evaluate("document.querySelector('#mt').scrollWidth<=document.querySelector('#mt').clientWidth+1"); print('tabbladen passen:',w)
    ctx.close()

    # --- installeren (nagebootste browsermelding) ---
    ctx,pg=page(b,state={'days':{'2026-10-18':5,'2026-10-19':9},'lvDone':True})
    pg.evaluate("(()=>{const e=new Event('beforeinstallprompt');e.prompt=async()=>{window.__prompted=1};e.userChoice=Promise.resolve({outcome:'accepted'});dispatchEvent(e)})()")
    pg.wait_for_timeout(200); print('installeerkaart op home:',pg.locator('.inst').count())
    pg.click('[data-inst]'); pg.wait_for_timeout(200)
    print('prompt getoond:',pg.evaluate('window.__prompted===1'),'| daarna verborgen:',pg.locator('.inst').count()==0)
    ctx.close()

    # --- centrale meldingen + beheer ---
    ctx,pg=page(b,mock=True)
    pg.click('#nav [data-v=kaart]'); pg.wait_for_selector('[data-rep]')
    pg.click('[data-rep] >> nth=0'); pg.fill('#rn','Voorbeeldzin klopt niet'); pg.click('#rsv'); pg.wait_for_selector('.sheet h2:has-text("Bedankt")')
    print('melding:',pg.inner_text('.sheet p'),'| centraal:',len(REPORTS),'| lokaal:',len(pg.evaluate("(JSON.parse(localStorage.getItem('af2'))||{}).reports||[]")))
    pg.click('.sheet [data-close]')
    pg.click('#nav [data-v=meer]'); pg.wait_for_selector('#cin'); pg.click('#cin'); pg.wait_for_selector('[data-a=beheer]')
    pg.click('[data-a=beheer]'); pg.wait_for_selector('[data-rdone]')
    print('beheer:',pg.locator('[data-rdone]').count(),'melding(en)'); pg.screenshot(path='x_beheer.png')
    pg.click('[data-rdone]'); pg.wait_for_timeout(300); print('na afhandelen:',pg.inner_text('#app p.muted')[:40],'| centraal over:',len(REPORTS))
    ctx.close()
    # zonder cloud: lokaal bewaren
    ctx,pg=page(b)
    pg.click('#nav [data-v=kaart]'); pg.wait_for_selector('[data-rep]'); pg.click('[data-rep] >> nth=0'); pg.click('#rsv'); pg.wait_for_selector('.sheet h2:has-text("Bedankt")')
    print('zonder cloud:',pg.inner_text('.sheet p')[:50],'| lokaal:',len(pg.evaluate("JSON.parse(localStorage.getItem('af2')).reports")))
    ctx.close()
    print('FOUTEN',errs)
