from playwright.sync_api import sync_playwright
F='http://127.0.0.1:8765/'
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844}); errs=[]
    pg.add_init_script("addEventListener('securitypolicyviolation',e=>console.error('CSP '+e.violatedDirective+' '+e.blockedURI))"); pg.on('pageerror',lambda e:errs.append(str(e)[:160])); pg.on('console',lambda m:errs.append(m.text[:140]) if m.type=='error' else None)
    pg.add_init_script("localStorage.setItem('af2',JSON.stringify({lvDone:true}));window.__vib=[];navigator.vibrate=x=>{window.__vib.push(x);return true}")
    pg.goto(F); pg.wait_for_selector('#nav [data-v]'); pg.click('.cta'); n1=pg.inner_text('.fc .big')
    pg.click('#fc'); print('draai-animatie na omdraaien:', 'flip' in pg.get_attribute('#fc','class'))
    box=pg.locator('#fc').bounding_box(); cx=box['x']+box['width']/2; cy=box['y']+box['height']/2
    def swipe(dx):
        pg.mouse.move(cx,cy); pg.mouse.down()
        for i in range(1,11): pg.mouse.move(cx+dx*i/10,cy+2)
        pg.mouse.up(); pg.wait_for_timeout(400)
    swipe(160); n2=pg.inner_text('.fc .big')
    srs=pg.evaluate("JSON.parse(localStorage.getItem('af2')||'{}').srs||null")
    print('naar rechts vegen -> volgende kaart:',n1!=n2,'| tik-trilling bij drempel:',pg.evaluate("window.__vib"))
    pg.click('#fc'); pg.wait_for_timeout(450); swipe(-160)
    print('naar links -> trilling bij fout:',pg.evaluate("window.__vib.at(-1)"),'| teller:',pg.inner_text('.top .muted'))
    pg.click('#fc'); pg.wait_for_timeout(450); swipe(40); print('kleine veeg -> kaart blijft:',pg.query_selector('[data-g]') is not None)
    pg.evaluate("document.dispatchEvent(new Event('visibilitychange'))"); 
    # zoeken
    pg.click('#nav [data-v=home]'); pg.keyboard.press('/'); print('"/" opent zoeken:',pg.inner_text('h1'))
    pg.fill('#zq','lughawe'); pg.wait_for_timeout(300); print('groepen:',pg.eval_on_selector_all('#zr .sec','e=>e.map(x=>x.innerText)'))
    pg.click('#zr [data-zr]'); print('resultaat opent:',pg.inner_text('h1'))
    pg.click('#nav [data-v=meer]'); print('kalendercellen:',pg.eval_on_selector_all('.cal-g i','e=>e.length'),'| trillen-instelling:',pg.eval_on_selector_all('[data-s^="haptic"]','e=>e.length'))
    pg.click('[data-s="haptic:false"]'); pg.click('#nav [data-v=oef]'); pg.click('#qs'); n=len(pg.evaluate('window.__vib'))
    for i in range(3): pg.click('.opt'); pg.wait_for_timeout(1450)
    print('trillen uit -> geen nieuwe trillingen:',len(pg.evaluate('window.__vib'))==n)
    print('FOUTEN',errs); b.close()
