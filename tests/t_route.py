"""Adres per scherm: terugknop van de browser, herladen en directe links."""
from playwright.sync_api import sync_playwright
import json
U='http://127.0.0.1:8765/'; errs=[]
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':390,'height':844},service_workers='block'); pg=ctx.new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)[:160])); pg.on('console',lambda m:errs.append(m.text[:140]) if m.type=='error' and 'vibrate' not in m.text else None)
    pg.add_init_script("if(!localStorage.getItem('af2'))localStorage.setItem('af2',JSON.stringify(%s))"%json.dumps({'lvDone':True,'ms':{'_':1},'lvl':99}))
    pg.goto(U); pg.wait_for_selector('.cta')
    h1=lambda:pg.inner_text('h1') if pg.locator('h1').count() else '(home)'
    pg.click('#nav [data-v=oef]'); pg.click('[data-a=gram]'); pg.wait_for_selector('[data-les]'); pg.click('[data-les] >> nth=0'); pg.wait_for_selector('[data-ls]')
    print('adres les:',pg.url.split('#')[1]); assert '#/les?l=' in pg.url
    pg.go_back(); pg.wait_for_timeout(400); print('terug 1:',h1()); assert h1()=='Grammatica'
    pg.go_back(); pg.wait_for_timeout(400); print('terug 2:',h1()); assert h1()=='Oefenen'
    pg.go_back(); pg.wait_for_timeout(400); print('terug 3:',pg.locator('.cta').count()); assert pg.locator('.cta').count()==1
    pg.go_forward(); pg.wait_for_timeout(400); assert h1()=='Oefenen'
    # terugknop in de app = echt terug (geen extra stap)
    pg.click('[data-a=gram]'); pg.wait_for_selector('[data-les]'); pg.click('.back'); pg.wait_for_timeout(300); assert h1()=='Oefenen'
    pg.go_back(); pg.wait_for_timeout(400); assert pg.locator('.cta').count()==1; print('app-terug telt als terug: ja')
    # directe link naar een pad en zoekopdracht (ook na herladen)
    pg.goto(U+'#/path?p=week1'); pg.wait_for_timeout(800); print('link pad:',h1()); assert 'Week 1' in h1()
    pg.goto(U+'#/zoek?q=braai'); pg.reload(); pg.wait_for_selector('#zq'); pg.wait_for_timeout(400); print('link zoeken:',pg.input_value('#zq'),'| treffers:',pg.locator('#zr .sec').count()); assert pg.input_value('#zq')=='braai'
    # kaartenfilter in het adres
    pg.click('#nav [data-v=kaart]'); pg.wait_for_selector('#s'); pg.fill('#s','hond'); pg.wait_for_timeout(400); print('kaarten-adres:',pg.url.split('#')[1]); assert 'q=hond' in pg.url
    # oefening herstart niet vanzelf na herladen
    pg.goto(U+'#/quiz'); pg.wait_for_timeout(800); assert pg.locator('.cta').count()==1; print('quiz-link → home: ja')
    # onbekend adres → home
    pg.goto(U+'#/bestaatniet'); pg.reload(); pg.wait_for_timeout(600); assert pg.locator('.cta').count()==1
    ctx.close()
    print('FOUTEN',errs)
