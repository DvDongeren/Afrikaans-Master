from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844}); errs=[]
    pg.add_init_script("addEventListener('securitypolicyviolation',e=>console.error('CSP '+e.violatedDirective+' '+e.blockedURI))"); pg.on('pageerror',lambda e:errs.append(str(e)[:140])); pg.on('console',lambda m:errs.append(m.text[:100]) if m.type=='error' else None)
    pg.goto('http://127.0.0.1:8765/'); pg.wait_for_selector('#nav [data-v]'); pg.wait_for_timeout(400)
    pg.click('#nav [data-v=oef]'); pg.click('[data-a=gram]'); print('lessen:',pg.eval_on_selector_all('[data-les]','e=>e.length'))
    pg.click('[data-les=ontkenning]'); pg.screenshot(path='g_les.png',full_page=False)
    pg.click('[data-ls]')
    LESQ=pg.evaluate("(async()=>{const F=JSON.parse(document.getElementById('app').dataset.files);return (await (await fetch(F.les)).json())})().then(L=>L.find(l=>l.id==='ontkenning').q)")
    for q in LESQ:
        pg.wait_for_timeout(100); pg.click(f'[data-lo="{q[2]}"]'); pg.wait_for_timeout(900)
    print('resultaat:',pg.inner_text('h1'),'| opgeslagen:',pg.evaluate("JSON.parse(localStorage.getItem('af2')).les"))
    pg.screenshot(path='g_klaar.png')
    pg.click('#nav [data-v=paden]'); print('paden alles:',pg.eval_on_selector_all('[data-p]','e=>e.length'))
    for g in ['Weekroute','Grammatica','Thema','Slim']:
        pg.click(f'[data-pg={g}]'); print(' ',g,pg.eval_on_selector_all('[data-p]','e=>e.length'))
    pg.click('[data-pg=Grammatica]'); pg.click('[data-p=gram_az]'); print('stappen gram_az:',pg.eval_on_selector_all('[data-step]','e=>e.length'))
    pg.click('[data-step="1"]'); pg.click('[data-ls]')
    for i in range(10):
        if pg.query_selector('[data-a=stepdone]'): break
        pg.click('.opt'); pg.wait_for_timeout(1700)
    pg.click('[data-a=stepdone]'); print('pad voortgang:',pg.evaluate("JSON.parse(localStorage.getItem('af2')).paths"))
    pg.screenshot(path='g_pad.png')
    # quiz met cat-scope + nieuw pad met dialoog
    pg.click('[data-a=paden]'); pg.click('[data-pg=Alles]'); pg.click('[data-p=nood_hulp]'); pg.click('[data-step="2"]'); print('dialoog nood:',pg.inner_text('h1'))
    pg.click('[data-a=back]'); pg.click('[data-step="6"]'); print('quiz cat-scope:',pg.inner_text('#app')[:40].replace('\n',' | '))
    pg.click('#nav [data-v=home]'); print('home doorgaan-kaart:', 'ga verder' in pg.inner_text('#app').lower())
    # dialoogregel gecontroleerd
    pg.click('[data-a=dlgs]'); pg.click('[data-t="Nood: politie / hulp"]'); print('verdwaald in dialoog:','verdwaal' in pg.inner_text('#app'))
    print('fouten',errs); b.close()
