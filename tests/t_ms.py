"""Mijlpalen: voortgang, felicitatie bij een nieuwe mijlpaal en de overzichtspagina."""
import json, time, datetime
from playwright.sync_api import sync_playwright
U='http://127.0.0.1:8765/'; errs=[]
now=int(time.time()*1000); today=datetime.date.today()
days={(today-datetime.timedelta(d)).isoformat():20 for d in range(8)}
srs={str(i):{'box':4 if i<30 else 1,'due':now+86400000,'t':now} for i in range(1,121)}
with sync_playwright() as p:
    b=p.chromium.launch()
    def page(state):
        ctx=b.new_context(viewport={'width':390,'height':844},service_workers='block'); pg=ctx.new_page()
        pg.on('pageerror',lambda e:errs.append(str(e)[:160])); pg.on('console',lambda m:errs.append(m.text[:140]) if m.type=='error' else None)
        pg.add_init_script("if(!localStorage.getItem('af2'))localStorage.setItem('af2',JSON.stringify(%s))"%json.dumps(state)); return ctx,pg
    # bestaande gebruiker zonder mijlpalen: eerste controle is stil
    ctx,pg=page({'srs':srs,'days':days,'last':today.isoformat(),'streak':8,'lvDone':True}); pg.goto(U); pg.wait_for_selector('#nav [data-v]'); pg.wait_for_timeout(1500)
    print('stil eerst:',pg.locator('#mstoast').count()); assert pg.locator('#mstoast').count()==0
    s=pg.evaluate("JSON.parse(localStorage.getItem('af2'))"); print('opgeslagen:',len(s['ms'])); assert s['ms'].get('_') and s['ms'].get('reeks:1')
    print('startscherm:',pg.inner_text('.home-ms')[:90].replace('\n',' | '))
    ctx.close()
    # nieuwe mijlpaal: felicitatie
    ctx,pg=page({'srs':srs,'days':days,'last':today.isoformat(),'streak':8,'lvDone':True,'ms':{'_':1}}); pg.goto(U); pg.wait_for_selector('#mstoast',timeout=8000)
    print('melding:',pg.inner_text('#mstoast').replace('\n',' | '))
    pg.click('#mstoast [data-a=mijlpalen]'); pg.wait_for_selector('.ms-grid')
    print('pagina:',pg.inner_text('.stats').replace('\n',' '),'| reeksen',pg.locator('.ms-grid .ms').count())
    pg.screenshot(path='z_ms.png',full_page=True)
    pg.click('#nav [data-v=meer]'); pg.wait_for_selector('[data-a=mijlpalen]'); print('meer:',pg.inner_text('[data-a=mijlpalen]').replace('\n',' | '))
    ctx.close()
    print('FOUTEN',errs)
