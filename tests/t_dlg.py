from playwright.sync_api import sync_playwright
def V(pg):
    for sel,n in (('[data-ls]','les'),('#fc','sess'),('[data-fin]','dlg'),('.opt','quiz'),('[data-step]','path'),('[data-p]','paden')):
        if pg.query_selector(sel): return n
    return '?'
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844}); errs=[]
    pg.add_init_script("addEventListener('securitypolicyviolation',e=>console.error('CSP '+e.violatedDirective+' '+e.blockedURI))"); pg.on('pageerror',lambda e:errs.append(str(e)[:140])); pg.on('console',lambda m:errs.append(m.text[:100]) if m.type=='error' else None)
    pg.goto('http://127.0.0.1:8765/'); pg.wait_for_selector('#nav [data-v]'); pg.wait_for_timeout(400)
    print('nav:',pg.eval_on_selector_all('#nav button','e=>e.map(x=>x.innerText)'))
    # dialogen
    pg.click('[data-a=dlgs]'); print('dialogen:',pg.eval_on_selector_all('[data-t]','e=>e.length'))
    pg.click('[data-t]'); pg.screenshot(path='n_dlg.png')
    pg.click('[data-m=rol]'); print('verborgen beurten:',pg.eval_on_selector_all('[data-rev]','e=>e.length')); pg.click('[data-rev]'); 
    pg.click('[data-fin]'); print('na klaar ->',pg.inner_text('h1'),'|',pg.inner_text('.muted'))
    # pad doorlopen
    pg.click('#nav [data-v=paden]'); print('paden:',pg.eval_on_selector_all('[data-p]','e=>e.length')); pg.screenshot(path='n_paden.png')
    pg.click('[data-p=week1]'); pg.screenshot(path='n_path.png')
    steps=pg.eval_on_selector_all('[data-step]','e=>e.length'); print('stappen week1:',steps)
    for i in range(steps):
        pg.click(f'[data-step="{i}"]'); pg.wait_for_timeout(100)
        kind=V(pg)
        if kind=='sess':
            for _ in range(40):
                if pg.query_selector('[data-a=stepdone]'): break
                pg.click('#fc'); pg.click('[data-g="1"]')
            pg.click('[data-a=stepdone]')
        elif kind=='les':
            pg.click('[data-ls]')
            for _ in range(10):
                if pg.query_selector('[data-a=stepdone]'): break
                pg.click('.opt'); pg.wait_for_timeout(1700)
            pg.click('[data-a=stepdone]')
        elif kind=='dlg': pg.click('[data-fin]')
        elif kind=='quiz':
            for _ in range(30):
                if pg.query_selector('[data-a=stepdone]'): break
                pg.click('.opt'); pg.wait_for_timeout(1500)
            pg.click('[data-a=stepdone]')
        print(' stap',i,kind,'->',V(pg))
    print('voortgang week1:',pg.evaluate("JSON.parse(localStorage.getItem('af2')).paths"))
    # audio-first quiz pad
    pg.click('[data-a=paden]'); pg.click('[data-p=audio_focus]'); pg.click('[data-step="1"]'); print('audio quiz knop:',pg.eval_on_selector_all('.card [data-sp]','e=>e.length'))
    print('fouten',errs); b.close()
