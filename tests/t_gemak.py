"""Verder waar je was, synchronisatiestatus/offline-balk en back-up als bestand."""
import json, os, time, tempfile
from playwright.sync_api import sync_playwright
U='http://127.0.0.1:8765/'; errs=[]
with sync_playwright() as p:
    b=p.chromium.launch()
    def page(state=None):
        ctx=b.new_context(viewport={'width':390,'height':844},service_workers='block',accept_downloads=True); pg=ctx.new_page()
        pg.on('pageerror',lambda e:errs.append(str(e)[:160])); pg.on('console',lambda m:errs.append(m.text[:140]) if m.type=='error' and 'vibrate' not in m.text else None)
        if state: pg.add_init_script("if(!localStorage.getItem('af2'))localStorage.setItem('af2',JSON.stringify(%s))"%json.dumps(state))
        return ctx,pg
    # --- verder waar je was ---
    ctx,pg=page({'lvDone':True,'ms':{'_':1},'lvl':99}); pg.goto(U); pg.wait_for_selector('#nav [data-v]')
    pg.click('[data-a=quiz]'); pg.wait_for_selector('#op .opt')
    for k in range(3):
        pg.click('#op .opt >> nth=0'); pg.wait_for_timeout(1600)
    q1=pg.inner_text('.card.q .big')
    pg.goto(U); pg.wait_for_selector('.resume'); print('hervatten:',pg.inner_text('.resume').replace('\n',' | ')[:80])
    pg.click('#rsgo'); pg.wait_for_selector('#op .opt'); print('zelfde vraag:',pg.inner_text('.card.q .big')==q1, '| teller:',pg.inner_text('.topbar, .bar, .top').replace('\n',' ')[:30] if pg.locator('.topbar').count() else '')
    assert pg.inner_text('.card.q .big')==q1
    pg.goto(U); pg.wait_for_selector('.resume'); pg.click('#rsx'); pg.wait_for_timeout(200); print('weggeklikt:',pg.locator('.resume').count()==0); assert pg.locator('.resume').count()==0
    pg.goto(U); pg.wait_for_selector('#nav [data-v]'); pg.wait_for_timeout(300); assert pg.locator('.resume').count()==0
    # gatentekst hervatten
    pg.click('#nav [data-v=oef]'); pg.click('[data-a=gat]'); pg.wait_for_selector('.gapq'); pg.click('#op .opt >> nth=0'); pg.wait_for_selector('#gnx'); pg.click('#gnx'); pg.wait_for_selector('.gapq')
    g1=pg.inner_text('.gapq'); pg.goto(U); pg.wait_for_selector('.resume'); print('gat hervatten:',pg.inner_text('.resume h2')); pg.click('#rsgo'); pg.wait_for_selector('.gapq'); assert pg.inner_text('.gapq')==g1
    # --- offline-balk ---
    ctx.set_offline(True); pg.evaluate("dispatchEvent(new Event('offline'))"); pg.wait_for_selector('#offbar'); print('offline:',pg.inner_text('#offbar')[:40])
    ctx.set_offline(False); pg.evaluate("dispatchEvent(new Event('online'))"); pg.wait_for_timeout(200); assert pg.locator('#offbar').count()==0
    # --- back-up als bestand ---
    pg.click('#nav [data-v=meer]'); pg.wait_for_selector('#bkdl')
    with pg.expect_download() as dl: pg.click('#bkdl')
    path=os.path.join(tempfile.gettempdir(),'bk_test.json'); dl.value.save_as(path); data=json.load(open(path))
    print('download:',dl.value.suggested_filename,'| sleutels:',sorted(data)[:4]); assert data['app']=='Afrikaans Master' and 'srs' in data['voortgang']
    ctx.close()
    ctx,pg=page({'lvDone':True,'ms':{'_':1},'lvl':99}); pg.goto(U); pg.wait_for_selector('#nav [data-v]'); pg.click('#nav [data-v=meer]'); pg.wait_for_selector('#bkup')
    data['voortgang']['srs']={'1':{'box':3,'due':int(time.time()*1000),'t':1},'2':{'box':1,'due':int(time.time()*1000),'t':1}}; json.dump(data,open(path,'w'))
    pg.on('dialog',lambda d:d.accept()); pg.set_input_files('#bkfile',path); pg.wait_for_function("document.getElementById('msg')&&/Hersteld/.test(document.getElementById('msg').textContent)") if False else pg.wait_for_timeout(800)
    s=pg.evaluate("JSON.parse(localStorage.getItem('af2'))"); print('teruggezet:',sorted(s['srs'])); assert sorted(s['srs'])==['1','2']
    ctx.close()
    print('FOUTEN',errs)
