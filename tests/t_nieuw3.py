"""Examen + certificaat, seizoen + mini-quiz, plaatjes, zinnen met geluid, luisterverhaal, fouten-review, agenda, zoeken via selectie."""
import json, time, os, tempfile
from playwright.sync_api import sync_playwright
U='http://127.0.0.1:8765/'; errs=[]
now=int(time.time()*1000)
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':390,'height':844},service_workers='block',accept_downloads=True); pg=ctx.new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)[:160])); pg.on('console',lambda m:errs.append(m.text[:140]) if m.type=='error' and 'vibrate' not in m.text else None)
    pg.add_init_script("if(!localStorage.getItem('af2'))localStorage.setItem('af2',JSON.stringify(%s))"%json.dumps({'lvDone':True,'ms':{'_':1},'lvl':99}))
    S=lambda:pg.evaluate("JSON.parse(localStorage.getItem('af2'))")
    pg.goto(U); pg.wait_for_selector('.cta')
    # --- examen: alle vragen beantwoorden (met het juiste antwoord uit de staat is niet mogelijk; we kiezen de eerste optie) ---
    pg.goto(U+'#/examen'); pg.wait_for_selector('[data-exgo]'); pg.click('[data-exgo=Beginner]'); pg.wait_for_selector('#op .opt')
    n=int(pg.inner_text('.top .muted').split('/')[1])
    for i in range(n):
        pg.wait_for_selector('#op .opt:not([disabled])'); pg.click('#op .opt >> nth=0'); pg.wait_for_timeout(230)
    pg.wait_for_selector('.result'); print('examen klaar:',pg.inner_text('.result .score').replace('\n',''),'|',pg.inner_text('.result h1'))
    e=S()['exam']['Beginner']; print('opgeslagen:',e); assert 'b' in e
    # certificaat (geslaagd nabootsen)
    pg.evaluate("__t.set({exam:{Beginner:{b:90,p:Date.now()}}})"); pg.goto(U+'#/cert?lv=Beginner'); pg.wait_for_selector('#cv')
    pg.fill('#cnm','Test Persoon'); pg.wait_for_timeout(500)
    with pg.expect_download() as dl: pg.click('#cdl')
    print('certificaat:',dl.value.suggested_filename); assert dl.value.suggested_filename.endswith('.png')
    # --- seizoen: lente is open in oktober/november; anders het eerste open seizoen ---
    pg.goto(U+'#/seizoen'); pg.wait_for_selector('.sztile'); sid=pg.get_attribute('.sztile.on','data-sz'); print('open seizoen:',sid)
    pg.click('.sztile.on'); pg.wait_for_selector('[data-szq]'); pg.click('[data-szq]')
    for i in range(8):
        pg.wait_for_selector('#op .opt'); q=pg.inner_text('.card.q .big')
        good=pg.evaluate("q=>{const s=__t.D.sz.find(x=>x.id===__t.st.id);const w=s.w.find(x=>x[0]===q||x[1]===q);return w?(w[0]===q?w[1]:w[0]):''}",q)
        pg.click(f'#op .opt[data-o="{good}"]'); pg.wait_for_selector('#sznx'); pg.click('#sznx')
    pg.wait_for_selector('.result'); print('seizoen:',pg.inner_text('.result h1'),'|',S()['sz']); assert sid in S()['sz']
    # --- plaatjes: een ronde 'woord → plaatje' ---
    pg.goto(U+'#/beeld'); pg.wait_for_selector('.ptile'); pg.click('[data-pmo=woord]'); pg.click('[data-pth=kleur]')
    for i in range(10):
        pg.wait_for_selector('.popt'); w=pg.inner_text('.pq .big'); pg.click(f'.popt[data-po="{w}"]'); pg.wait_for_selector('#pnx'); pg.click('#pnx')
    pg.wait_for_selector('.result'); print('plaatjes:',pg.inner_text('.result .score').replace('\n',''),'|',S()['pics']); assert S()['pics']['kleur']==100
    # --- zinnen bouwen met geluid ---
    pg.goto(U+'#/zin'); pg.wait_for_selector('#zm'); pg.click('[data-m2=oor]'); pg.click('#zs'); pg.wait_for_selector('#zp'); assert pg.locator('.card.q .big').count()==0; print('zinnen met geluid: ja')
    # --- luisterverhaal ---
    pg.goto(U+'#/stories'); pg.wait_for_selector('[data-story]'); pg.click('[data-story] >> nth=0'); pg.click('#lm'); pg.wait_for_selector('.hid')
    k=0
    while pg.locator('#lsh').count():
        pg.click('#lsh'); pg.wait_for_selector('#lnx'); pg.click('#lnx'); k+=1
    pg.wait_for_selector('#fin'); print('luisterverhaal zinnen:',k); pg.click('#fin'); pg.wait_for_selector('[data-story]')
    # --- fouten terugkijken na een sessie ---
    pg.goto(U); pg.wait_for_selector('.cta'); pg.click('.cta'); pg.wait_for_selector('#fc')
    for i in range(40):
        if pg.locator('.result').count(): break
        pg.click('#fc'); pg.wait_for_selector('[data-g]'); pg.click('[data-g="0"]' if i==0 else '[data-g="1"]'); pg.wait_for_timeout(60)
    pg.wait_for_selector('.review'); print('review:',pg.locator('.review .rv').count(),'kaart(en)'); assert pg.locator('#srv').count()==1
    # --- agenda-herinnering ---
    pg.goto(U+'#/meer'); pg.wait_for_selector('#remt'); pg.fill('#remt','08:30')
    with pg.expect_download() as dl: pg.click('#remics')
    path=os.path.join(tempfile.gettempdir(),'h.ics'); dl.value.save_as(path); ics=open(path).read()
    print('agenda:', 'RRULE:FREQ=DAILY' in ics, 'T083000' in ics, '| google:', 'recur=RRULE' in pg.get_attribute('#remg','href')); assert 'RRULE:FREQ=DAILY' in ics and 'T083000' in ics
    # --- zoeken via selectie ---
    pg.goto(U+'#/stories'); pg.wait_for_selector('[data-story]'); pg.click('[data-story] >> nth=1'); pg.wait_for_selector('.reader')
    bx=pg.locator('.reader p >> nth=2').bounding_box(); pg.mouse.move(bx['x']+5,bx['y']+15); pg.mouse.down(); pg.mouse.move(bx['x']+150,bx['y']+15,steps=8); pg.mouse.up()
    pg.wait_for_selector('#selz'); pg.click('#selz'); pg.wait_for_selector('#zq'); print('zoeken via selectie:',pg.input_value('#zq')); assert len(pg.input_value('#zq'))>2
    ctx.close()
    print('FOUTEN',errs)
