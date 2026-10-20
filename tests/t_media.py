"""Pagina muziek, films en series: tabbladen, filter, links en zoeken."""
from playwright.sync_api import sync_playwright
U='http://127.0.0.1:8765/'; errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844})
    pg.add_init_script("addEventListener('securitypolicyviolation',e=>console.error('CSP '+e.violatedDirective+' '+e.blockedURI))")
    pg.on('pageerror',lambda e:errs.append(str(e)[:160])); pg.on('console',lambda m:errs.append(m.text[:140]) if m.type=='error' else None)
    pg.goto(U); pg.wait_for_selector('#nav [data-v]')
    pg.click('#nav [data-v=oef]'); pg.click('[data-a=media]'); pg.wait_for_selector('#mt')
    print('titel:',pg.inner_text('h1')); pg.screenshot(path='m_muziek.png',full_page=False)
    print('artiesten:',pg.locator('.card.media').count(),'| groepen:',pg.eval_on_selector_all('.sec','e=>e.map(x=>x.textContent)'))
    h=pg.get_attribute('.mlinks a','href'); print('spotify-link:',h)
    assert all(pg.eval_on_selector_all('.mlinks a','e=>e.map(a=>a.target==="_blank"&&a.rel.includes("noopener"))'))
    pg.click('[data-mt=films]'); n=pg.locator('.card.media').count()
    pg.click('[data-lv=Lastig]'); k=pg.locator('.card.media').count(); print('films:',n,'| Kaaps:',k)
    print('justwatch:',pg.get_attribute('.mlinks a','href'))
    pg.click('[data-mt=series]'); print('series:',pg.locator('.card.media').count())
    pg.click('[data-mt=waar]'); print('waar kijken:',pg.eval_on_selector_all('.sec','e=>e.map(x=>x.textContent)'),pg.locator('.card.media').count()); pg.screenshot(path='m_waar.png')
    pg.click('summary'); print('tips open:',pg.locator('.tips li').count())
    pg.goto(U+'?'); pg.wait_for_selector('#nav [data-v]'); pg.keyboard.press('/'); pg.fill('#zq','kanarie'); pg.wait_for_timeout(300)
    print('zoeken:',pg.eval_on_selector_all('#zr .sec','e=>e.map(x=>x.textContent)'))
    print('FOUTEN',errs)
