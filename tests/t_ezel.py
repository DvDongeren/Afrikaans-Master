"""Woord uit een verhaal bewaren en ezelsbruggetjes bij moeilijke kaarten."""
import json, time
from playwright.sync_api import sync_playwright
U='http://127.0.0.1:8765/'; errs=[]
now=int(time.time()*1000)
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':390,'height':844},service_workers='block'); pg=ctx.new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)[:160])); pg.on('console',lambda m:errs.append(m.text[:140]) if m.type=='error' and 'vibrate' not in m.text else None)
    # kaart 1 is 'moeilijk' (box 0, eerder fout) en staat klaar om te herhalen
    st={'lvDone':True,'ms':{'_':1},'lvl':99,'srs':{'1':{'box':0,'due':now-1000,'t':now-86400000}}}
    pg.add_init_script("if(!localStorage.getItem('af2'))localStorage.setItem('af2',JSON.stringify(%s))"%json.dumps(st))
    pg.goto(U); pg.wait_for_selector('.cta')
    # --- verhaal: woord tikken en bewaren ---
    pg.click('#nav [data-v=oef]'); pg.click('[data-a=stories]'); pg.click('[data-story] >> nth=0'); pg.wait_for_selector('.w')
    words=pg.locator('.reader .w'); n=words.count(); saved=None
    for i in range(n):
        words.nth(i).click(); pg.wait_for_timeout(80)
        if pg.locator('#wp [data-wsave]').count():
            txt=pg.inner_text('#wp [data-wsave]'); w=pg.inner_text('#wp .af'); pg.click('#wp [data-wsave]'); pg.wait_for_timeout(200)
            print('bewaard:',w,'|',txt,'|',pg.inner_text('#wp [role=status]')); saved=(w,txt); break
    assert saved
    s=pg.evaluate("JSON.parse(localStorage.getItem('af2'))")
    if 'Toevoegen' in saved[1]: assert any(o['af']==saved[0].lower() for o in s['own']), s['own']
    else: assert len(s['favs'])>=1
    # woord zonder vertaling: 'zelf toevoegen' opent een ingevuld formulier
    for i in range(n):
        words.nth(i).click(); pg.wait_for_timeout(60)
        if pg.locator('#wp [data-wown]').count():
            w=pg.inner_text('#wp .af'); pg.click('#wp [data-wown]'); pg.wait_for_selector('#oaf')
            print('zelf toevoegen:',w,'→',pg.input_value('#oaf'),'| vb:',pg.input_value('#ovb')[:40]); assert pg.input_value('#oaf')==w.lower()
            pg.click('.back'); pg.wait_for_selector('.reader'); break
    # --- sessie: moeilijke kaart toont ezelsbruggetje; eigen tekst bewaren ---
    pg.click('#nav [data-v=home]'); pg.click('.cta'); pg.wait_for_selector('#fc'); pg.click('#fc'); pg.wait_for_selector('.ezel')
    print('ezelsbrug:',pg.inner_text('.ezel').replace('\n',' | ')[:120])
    pg.click('.ezel [data-ezel]'); pg.fill('#ezt','Ek verstaan = ik versta, dus begrijp'); pg.click('#ezs'); pg.wait_for_selector('.ezel .ezn')
    s=pg.evaluate("JSON.parse(localStorage.getItem('af2'))"); print('notitie:',s.get('notes')); assert s['notes'].get('1')
    pg.reload(); pg.wait_for_selector('#nav [data-v]'); pg.click('#nav [data-v=kaart]'); pg.wait_for_selector('.entry-li'); pg.fill('#s','Ek verstaan'); pg.wait_for_timeout(400)
    assert pg.locator('.entry-li .ezn').count()>=1; print('in kaartenlijst: ja')
    ctx.close()
    print('FOUTEN',errs)
