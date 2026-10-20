"""Offline werken, update-melding en 404 via de service worker."""
from playwright.sync_api import sync_playwright
import os,re,subprocess
U='http://127.0.0.1:8765/'; errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':844}); pg=ctx.new_page()
    pg.add_init_script("addEventListener('securitypolicyviolation',e=>console.error('CSP '+e.violatedDirective+' '+e.blockedURI))")
    pg.on('pageerror',lambda e:errs.append(str(e)[:160])); pg.on('console',lambda m:errs.append(m.text[:140]) if m.type=='error' else None)
    pg.goto(U); pg.wait_for_selector('#nav [data-v]')
    pg.wait_for_function("navigator.serviceWorker.controller||new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',()=>r(1)))",timeout=15000)
    pg.wait_for_timeout(1500)
    n=pg.evaluate("caches.keys().then(async k=>{const c=await caches.open(k[0]);return (await c.keys()).length})")
    print('in cache:',n,'bestanden')
    ctx.set_offline(True)
    pg.reload(); pg.wait_for_selector('#nav [data-v]')
    pg.click('#nav [data-v=paden]'); pg.wait_for_selector('.card,.tile,[data-p]',timeout=5000)
    pg.click('#nav [data-v=oef]'); pg.wait_for_timeout(300)
    print('offline werkt:',pg.inner_text('h1'))
    ctx.set_offline(False)
    errs[:]=[e for e in errs if 'ERR_INTERNET_DISCONNECTED' not in e and 'Failed to fetch' not in e]
    # nieuwe versie uitrollen -> melding
    sw=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','public','sw.js'); orig=open(sw).read()
    open(sw,'w').write(re.sub(r"VERSION='[^']+'","VERSION='testupdate'",orig))
    try:
        pg.reload(); pg.wait_for_selector('#nav [data-v]')
        pg.evaluate("navigator.serviceWorker.getRegistration().then(r=>r.update())")
        pg.wait_for_selector('#toast',timeout=15000)
        print('update-melding:',pg.inner_text('#toast').replace('\n',' '))
        pg.click('#toast [data-reload]'); pg.wait_for_selector('#nav [data-v]'); print('na vernieuwen melding weg:',pg.locator('#toast').count()==0)
    finally: open(sw,'w').write(orig)
    E=list(errs)
    r=pg.goto(U+'bestaat-niet'); print('404-pagina:',r.status,pg.inner_text('h1'))
    print('FOUTEN',E)
