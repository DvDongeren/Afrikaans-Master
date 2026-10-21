"""Vertraagde handelingen (na een antwoord of een veeg) mogen niet doorwerken in een ander scherm of op de volgende kaart."""
import json
from playwright.sync_api import sync_playwright
U='http://127.0.0.1:8765/'; errs=[]
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':390,'height':844},service_workers='block'); pg=ctx.new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)[:160])); pg.on('console',lambda m:errs.append(m.text[:140]) if m.type=='error' and 'vibrate' not in m.text else None)
    pg.add_init_script("if(!localStorage.getItem('af2'))localStorage.setItem('af2',JSON.stringify(%s))"%json.dumps({'lvDone':True,'ms':{'_':1},'lvl':99}))
    pg.goto(U); pg.wait_for_selector('#nav [data-v]')
    # quiz: antwoord geven en meteen weg; na de wachttijd blijft het scherm 'oefenen'
    pg.click('[data-a=quiz]'); pg.wait_for_selector('#op .opt'); pg.click('#op .opt >> nth=0'); pg.click('#nav [data-v=oef]')
    pg.wait_for_timeout(1700); h=pg.inner_text('h1'); print('quiz → oefenen:',h); assert h=='Oefenen'
    # grammaticales: zelfde, het lesscherm mag niet terugkomen
    pg.click('[data-a=gram]'); pg.click('[data-les] >> nth=0'); pg.click('[data-ls]'); pg.wait_for_selector('[data-lo]'); pg.click('[data-lo] >> nth=0'); pg.click('#nav [data-v=home]')
    pg.wait_for_timeout(1800); n=pg.locator('[data-lo]').count(); print('les → home, lesknoppen:',n); assert n==0 and pg.locator('.cta').count()==1
    # sessie: na een veeg telt een snelle extra toets niet als beoordeling van de volgende kaart
    pg.click('.cta'); pg.wait_for_selector('#fc'); pg.click('#fc'); pg.wait_for_selector('[data-g]')
    pg.wait_for_timeout(600); n0=pg.evaluate("Object.keys(JSON.parse(localStorage.getItem('af2')||'{}').srs||{}).length")
    box=pg.locator('#fc').bounding_box(); x,y=box['x']+box['width']/2,box['y']+box['height']/2
    pg.mouse.move(x,y); pg.mouse.down(); pg.mouse.move(x+60,y,steps=4); pg.mouse.move(x+160,y,steps=4); pg.mouse.up(); pg.keyboard.press('2')
    pg.wait_for_timeout(1100); d=pg.evaluate("Object.keys(JSON.parse(localStorage.getItem('af2')||'{}').srs||{}).length")
    print('beoordeeld na veeg + toets:',d-n0); assert d-n0==1, (n0,d)
    ctx.close()
    print('FOUTEN',errs)
