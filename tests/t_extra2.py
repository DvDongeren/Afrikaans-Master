"""Vrij vertalen, nieuwe lessen, tekstgrootte en spiekbrief."""
import json
from playwright.sync_api import sync_playwright
U='http://127.0.0.1:8765/'; errs=[]
def page(b,state=None,**kw):
    ctx=b.new_context(viewport={'width':390,'height':844},**kw); pg=ctx.new_page()
    pg.add_init_script("addEventListener('securitypolicyviolation',e=>console.error('CSP '+e.violatedDirective+' '+e.blockedURI))")
    pg.on('pageerror',lambda e:errs.append(str(e)[:160])); pg.on('console',lambda m:errs.append(m.text[:140]) if m.type=='error' else None)
    if state: pg.add_init_script("if(!localStorage.getItem('af2'))localStorage.setItem('af2',JSON.stringify(%s))"%json.dumps(state))
    pg.goto(U); pg.wait_for_selector('#nav [data-v]'); return ctx,pg
FETCH="""async()=>{const F=JSON.parse(document.getElementById('app').dataset.files);const g=async n=>(await fetch(F[n])).json();const[x,d,v]=await Promise.all([g('ext'),g('dlg'),g('vv')]);const m={};
 x.REIS.forEach(r=>m[r.nl]=m[r.nl]||r.af);d.forEach(q=>q.lines.forEach(l=>m[l.nl]=m[l.nl]||l.af));v.ST.forEach(s=>s.s.forEach(p=>m[p[1]]=m[p[1]]||p[0]));return m}"""
with sync_playwright() as p:
    b=p.chromium.launch()
    # --- vrij vertalen ---
    ctx,pg=page(b); M=pg.evaluate(FETCH)
    pg.click('#nav [data-v=oef]'); pg.click('[data-a=vertaal]'); pg.click('[data-vgo]'); pg.wait_for_selector('#va')
    nl=pg.inner_text('.card.q .big'); af=M[nl]; pg.fill('#va',af.upper()); pg.click('#vf button[type=submit]')
    print('goed:',pg.inner_text('.card.stack .lbl'))
    pg.click('[data-vnext]'); nl=pg.inner_text('.card.q .big'); af=M[nl]
    w=af.split(); k=max(range(len(w)),key=lambda i:len(w[i])); 
    if len(w[k].strip('.,?!'))>=4: w[k]=w[k][:-1] if w[k][-1].isalpha() else w[k][:-2]+w[k][-1]
    pg.fill('#va',' '.join(w)); pg.keyboard.press('Enter'); print('tikfout:',pg.inner_text('.card.stack .lbl'),'|',' '.join(w))
    pg.click('[data-vnext]'); pg.fill('#va','ek weet regtig nie'); pg.click('#vf button[type=submit]')
    print('fout:',pg.inner_text('.card.stack .lbl'),'| rood:',pg.locator('.badw').count()>0); pg.screenshot(path='y_vertaal.png')
    pg.click('[data-vself]'); print('zelf goed:',pg.inner_text('.card.stack .lbl'))
    for _ in range(7):
        pg.click('[data-vnext]'); pg.click('[data-vskip]')
    pg.click('[data-vnext]'); print('eind:',pg.inner_text('.score'))
    ctx.close()
    # --- lessen ---
    ctx,pg=page(b)
    pg.click('#nav [data-v=oef]'); pg.click('[data-a=gram]'); pg.wait_for_timeout(200)
    print('lessen in lijst:',pg.locator('[data-les]').count())
    pg.click('[data-les=lydend]'); print('les:',pg.inner_text('h1')); pg.click('[data-ls]')
    for _ in range(60):
        if pg.locator('.result').count(): break
        en=pg.locator('.opt:enabled')
        if en.count(): en.first.click()
        else:
            nx=pg.locator('button:has-text("Volgende"),button:has-text("Klaar")')
            if nx.count(): nx.first.click()
        pg.wait_for_timeout(400)
    print('les-resultaat zichtbaar:',pg.locator('.result').count())
    ctx.close()
    # --- tekstgrootte en lettertype ---
    ctx,pg=page(b)
    base=pg.evaluate("parseFloat(getComputedStyle(document.documentElement).fontSize)")
    pg.click('#nav [data-v=meer]'); pg.click('[data-s="fs:xl"]'); pg.click('[data-s="read:true"]')
    big=pg.evaluate("parseFloat(getComputedStyle(document.documentElement).fontSize)")
    pg.reload(); pg.wait_for_selector('#nav [data-v]')
    pre=pg.evaluate("document.documentElement.dataset.fs+'/'+document.documentElement.dataset.read")
    fam=pg.evaluate("getComputedStyle(document.querySelector('.hello')||document.body).fontFamily")[:30]
    print('tekstgrootte:',base,'->',big,'| na herladen:',pre,'| lettertype:',fam)
    pg.screenshot(path='y_groot.png'); ctx.close()
    # --- spiekbrief ---
    ctx,pg=page(b,state={'favs':[0,1,2,3],'lvDone':True})
    pg.click('#nav [data-v=kaart]'); pg.click('[data-pr]'); pg.wait_for_selector('.prtab')
    print('spiekbrief:',pg.inner_text('.prt')[:60],'| rijen',pg.locator('.prtab tbody tr').count())
    pg.select_option('#psrc','fav'); print('favorieten:',pg.locator('.prtab tbody tr').count())
    pg.check('#pvb'); print('voorbeelden:',pg.locator('.pex').count())
    pg.emulate_media(media='print'); vis=pg.evaluate("[getComputedStyle(document.querySelector('nav')).display,getComputedStyle(document.querySelector('.noprint')).display]")
    print('bij afdrukken verborgen:',vis)
    pdf=pg.pdf(format='A4'); print('pdf bytes >5000:',len(pdf)>5000); open('y_spiek.pdf','wb').write(pdf)
    pg.emulate_media(media='screen'); pg.screenshot(path='y_spiek.png'); ctx.close()
    print('FOUTEN',errs)
