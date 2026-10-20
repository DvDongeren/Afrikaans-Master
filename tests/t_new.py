from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844}); errs=[]
    pg.add_init_script("addEventListener('securitypolicyviolation',e=>console.error('CSP '+e.violatedDirective+' '+e.blockedURI))"); pg.on('pageerror',lambda e:errs.append(str(e)[:120])); pg.on('console',lambda m:errs.append(m.text[:100]) if m.type=='error' else None)
    pg.goto('http://127.0.0.1:8765/'); pg.wait_for_selector('#nav [data-v]'); pg.wait_for_timeout(400)
    pg.screenshot(path='n_home.png')
    pg.click('[data-a=sess]'); pg.click('#fc'); pg.wait_for_timeout(100); pg.screenshot(path='n_sess.png')
    for i in range(3): pg.click('[data-g="1"]'); pg.click('#fc')
    pg.click('#nav [data-v=oef]'); pg.click('#qs')
    for i in range(10):
        pg.click('.opt'); pg.wait_for_timeout(1500)
    print('quiz klaar:',pg.inner_text('h1'))
    pg.click('#nav [data-v=kaart]'); pg.fill('#s','dank'); pg.wait_for_timeout(300)
    print('zoek-resultaat:',pg.inner_text('#ls .muted'))
    pg.click('[data-f]'); pg.click('#nav [data-v=meer]'); pg.click('#cp'); pg.click('[data-s="theme:dark"]'); pg.wait_for_timeout(200)
    print('thema',pg.evaluate("document.documentElement.dataset.theme"),'| gestart:',pg.inner_text('.card .big'))
    pg.click('#nav [data-v=home]'); pg.screenshot(path='n_dark.png')
    print('fouten',errs); b.close()
