"""Beheer: kaart verbeteren vanuit een melding, correcties voor iedereen, anonieme statistiek (en uitzetten)."""
import json
from playwright.sync_api import sync_playwright
U='http://127.0.0.1:8765/'; errs=[]; LOG={'fix':[],'del':[],'stats':[]}
MOCK="""
window.__cloudAdapter=(()=>{let cb=null;const U={uid:'admin1',displayName:'Beheerder',email:'b@example.com',photoURL:''};
 return{signIn:async()=>{localStorage.setItem('mocklogin','1');setTimeout(()=>cb&&cb(U),20)},signOut:async()=>{cb&&cb(null)},onUser:f=>{cb=f;setTimeout(()=>f(localStorage.getItem('mocklogin')?U:null),10)},redirect:async()=>null,
 load:async()=>null,save:async()=>{},isAdmin:async()=>true,
 listReports:async()=>[{doc:'r1',id:3,af:'Ek praat \\'n bietjie Afrikaans',nl:'Ik spreek een beetje Afrikaans',note:'test',t:Date.now(),by:''}],
 delReport:async d=>window.logDel(d),saveFix:async(id,f)=>window.logFix(JSON.stringify({id,...f})),
 listFixes:async()=>JSON.parse(localStorage.getItem('mockfixes')||'[]'),delFix:async()=>{},
 listStats:async()=>[{day:'2026-10-20',v:{home:5,oef:3},d:{quiz:2},f:{c3:4,c4:1},x:{visits:6}},{day:'2026-10-21',v:{home:2},d:{sess:1},f:{c3:1},x:{visits:2}}],
 stats:async s=>window.logStats(JSON.stringify(s)),listErrors:async()=>[]}})();
"""
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':1280,'height':900},service_workers='block'); pg=ctx.new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)[:160])); pg.on('console',lambda m:errs.append(m.text[:140]) if m.type=='error' and 'vibrate' not in m.text else None)
    pg.expose_function('logFix',lambda s:LOG['fix'].append(json.loads(s))); pg.expose_function('logDel',lambda d:LOG['del'].append(d)); pg.expose_function('logStats',lambda s:LOG['stats'].append(json.loads(s)))
    pg.add_init_script(MOCK); pg.add_init_script("if(!localStorage.getItem('af2'))localStorage.setItem('af2',JSON.stringify({lvDone:true,ms:{_:1},lvl:99,cloud:1}))")
    pg.on('dialog',lambda d:d.accept())
    pg.goto(U); pg.wait_for_selector('.cta')
    # --- statistiek: schermen tellen en versturen ---
    pg.click('#nav [data-v=oef]'); pg.click('[data-a=gram]'); pg.wait_for_selector('[data-les]'); pg.wait_for_timeout(1000)
    pg.evaluate("window.__statFlush()"); pg.wait_for_timeout(300)
    s=LOG['stats'][-1]; day=list(s)[0]; print('statistiek:',s[day]); assert s[day]['v'].get('gram')==1 and s[day]['x']['visits']==1
    # --- beheer: inloggen en kaart verbeteren vanuit melding ---
    pg.click('#nav [data-v=meer]'); pg.click('#cin'); pg.wait_for_selector('[data-a=beheer]'); pg.click('[data-a=beheer]'); pg.wait_for_selector('[data-fixdoc]')
    pg.click('[data-fixdoc]'); pg.wait_for_selector('#fx_nl'); pg.fill('#fx_nl','Ik spreek een klein beetje Afrikaans'); pg.click('#fxs'); pg.wait_for_timeout(400)
    print('correctie opgeslagen:',LOG['fix'][-1]['id'],LOG['fix'][-1]['nl'],'| melding weg:',LOG['del']); assert LOG['fix'][-1]['id']==3 and LOG['del']==['r1']
    assert 'Geen open meldingen' in pg.inner_text('#app')
    # --- gebruik-tabblad ---
    pg.click('[data-bt=stat]'); pg.wait_for_selector('.bstat'); t=pg.inner_text('#app'); print('gebruik:', 'Bezoeken per dag · 8' in t, '| moeilijkste kaart staat erin:', 'fout' in t); assert 'Bezoeken per dag · 8' in t
    # --- correcties voor iedereen: een andere gebruiker krijgt de verbeterde kaart ---
    ctx2=b.new_context(viewport={'width':390,'height':844},service_workers='block'); pg2=ctx2.new_page()
    pg2.on('pageerror',lambda e:errs.append(str(e)[:160]))
    pg2.add_init_script(MOCK); pg2.add_init_script("localStorage.setItem('mockfixes',JSON.stringify([{id:3,af:'Ek praat \\'n bietjie Afrikaans',nl:'GECORRIGEERD',voorbeeld:'',vbnl:'',tips:''}]));if(!localStorage.getItem('af2'))localStorage.setItem('af2',JSON.stringify({lvDone:true,ms:{_:1},lvl:99,stat:false}))")
    pg2.goto(U); pg2.wait_for_selector('.cta'); pg2.wait_for_timeout(4500)
    pg2.click('#nav [data-v=kaart]'); pg2.fill('#s',"Ek praat 'n bietjie"); pg2.wait_for_timeout(500); txt=pg2.inner_text('#ls'); print('andere gebruiker ziet:', 'GECORRIGEERD' in txt); assert 'GECORRIGEERD' in txt
    # statistiek staat uit: niets versturen
    n=len(LOG['stats']); pg2.evaluate("window.__statFlush()"); pg2.wait_for_timeout(300); print('uitgezet, verstuurd:',len(LOG['stats'])-n); assert len(LOG['stats'])==n
    ctx2.close(); ctx.close()
    print('FOUTEN',errs)
