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
    print('niveau startscherm:',pg.locator('.lvb').count()) if False else None
    ctx.close()
    # niveau, deelkaart en gatentekst
    ctx,pg=page({'srs':srs,'days':days,'last':today.isoformat(),'streak':8,'lvDone':True,'ms':{'_':1},'lvl':1}); pg.goto(U); pg.wait_for_selector('.lvb')
    print('niveau:',pg.inner_text('.lvb')); pg.wait_for_selector('#mstoast',timeout=8000); print('niveaumelding:',pg.inner_text('#mstoast').replace('\n',' | '))
    pg.click('.lvb'); pg.wait_for_selector('.lvcard'); print('niveaukaart:',pg.inner_text('.lvcard h2'),'|',pg.inner_text('.frzcard h2'))
    pg.click('[data-a=deel]'); pg.wait_for_selector('#shc'); pg.wait_for_timeout(1200)
    px=pg.evaluate("(()=>{const c=document.getElementById('shc');const d=c.getContext('2d').getImageData(540,300,1,1).data;return [c.width,c.height,d[0],d[1],d[2]]})()"); print('deelkaart:',px); assert px[0]==1080 and px[3]>60
    pg.screenshot(path='z_deel.png',full_page=True)
    pg.goto(U+'#'); pg.wait_for_selector('#nav [data-v]'); pg.click('#nav [data-v=kaart]'); pg.fill('#s','kuier'); pg.wait_for_timeout(400)
    print('kaartvertaling:',pg.inner_text('#ls .exnl >> nth=0')); assert pg.locator('#ls .exnl').count()>0
    pg.click('#nav [data-v=oef]'); pg.click('[data-a=gat]'); pg.wait_for_selector('.gapq')
    print('gatentekst:',pg.inner_text('.gapq'),'|',pg.locator('#op .opt').count(),'opties'); pg.click('#op .opt >> nth=0'); pg.wait_for_selector('.gap.ok, .gap.bad')
    print('na antwoord:',pg.inner_text('.gapq'),'| uitleg:',pg.inner_text('.gapfb .fbh'),'| woorden',pg.locator('.gapfb .gl').count()); pg.wait_for_timeout(2500)
    assert pg.locator('.gapfb').count()==1 and pg.locator('.gapfb .exnl').count()==1; print('vertaling:',pg.inner_text('.gapfb .exnl'))
    pg.screenshot(path='z_gat.png',full_page=True); pg.click('#gnx'); pg.wait_for_selector('.gapq'); print('volgende:',pg.locator('.gapfb').count()==0); ctx.close()
    # rustdag: reeks blijft staan na een gemiste dag
    y2=(today-datetime.timedelta(2)).isoformat()
    ctx,pg=page({'srs':srs,'days':{y2:10},'last':y2,'streak':9,'frz':1,'lvDone':True,'ms':{'_':1},'lvl':99}); pg.goto(U); pg.wait_for_selector('.hero .badge >> nth=1')
    print('reeks met rustdag:',pg.inner_text('.hero .badge >> nth=1'))
    pg.click('#nav [data-v=oef]'); pg.click('[data-a=gat]'); pg.wait_for_selector('.gapq'); pg.click('#op .opt >> nth=0'); pg.wait_for_selector('.gapfb'); pg.wait_for_timeout(700)
    s2=pg.evaluate("JSON.parse(localStorage.getItem('af2'))"); print('na oefenen:',s2['streak'],s2['frz'],s2['frzD']); assert s2['streak']==10 and s2['frz']==0 and s2['frzD']==[(today-datetime.timedelta(1)).isoformat()]
    ctx.close()
    print('FOUTEN',errs)
