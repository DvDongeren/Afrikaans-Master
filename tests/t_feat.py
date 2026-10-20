from playwright.sync_api import sync_playwright
F='http://127.0.0.1:8765/'
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2); pg=ctx.new_page(); errs=[]
    pg.add_init_script("addEventListener('securitypolicyviolation',e=>console.error('CSP '+e.violatedDirective+' '+e.blockedURI))"); pg.on('pageerror',lambda e:errs.append(str(e)[:160])); pg.on('console',lambda m:errs.append(m.text[:120]) if m.type=='error' else None)
    pg.on('dialog',lambda d:d.accept())
    # gesproken tekst opvangen (headless heeft geen stemmen)
    pg.add_init_script("window.__said=[];const o=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{window.__said.push([u.text,u.rate]);};")
    pg.goto(F); pg.wait_for_selector('#nav [data-v]'); pg.wait_for_timeout(300)
    print('home: niveautoets-uitnodiging zichtbaar:','Wat is je niveau' in pg.inner_text('#app')); pg.screenshot(path='f_home.png')
    # 1. niveautoets: beginner alles goed, intermediate alles goed, advanced fout
    pg.click('[data-a=toets]')
    for i in range(12):
        pg.wait_for_selector('.opt:not([disabled])')
        nl=pg.inner_text('.q .big')
        good=pg.evaluate("async(nl)=>{const F=JSON.parse(document.getElementById('app').dataset.files);const r=(await Promise.all(['cards0','cards1','cards2'].map(n=>fetch(F[n]).then(r=>r.text())))).join('\\n').split('\\n').map(x=>x.split('\\t')).filter(f=>f[3]===nl);return r.map(f=>f[4])}",nl)
        lvl=i//4
        if lvl<2:
            opts=pg.eval_on_selector_all('.opt','e=>e.map(x=>x.dataset.o)'); tgt=[o for o in opts if o in good][0]
            pg.click(f'.opt[data-o="{tgt}"]')
        else: pg.click('#tdk')
        pg.wait_for_timeout(1000)
    print('toets uitslag:',pg.inner_text('.score'),'| startLv:',pg.evaluate("JSON.parse(localStorage.getItem('af2')).startLv"))
    pg.screenshot(path='f_toets.png')
    pg.click('[data-a=sess]'); nl=pg.inner_text('.fc .big')
    lv=pg.evaluate("async(nl)=>{const F=JSON.parse(document.getElementById('app').dataset.files);const m=await (await fetch(F.meta)).json();const f=(await Promise.all(['cards0','cards1','cards2'].map(n=>fetch(F[n]).then(r=>r.text())))).join('\\n').split('\\n').map(x=>x.split('\\t')).find(f=>f[3]===nl);return m.lv[+f[1]]}",nl)
    print('eerste nieuwe kaart in sessie heeft niveau:',lv)
    # 2. sneltoetsen + meldknop in sessie
    pg.keyboard.press('Space'); print('spatie draait om:',pg.query_selector('[data-g]') is not None)
    pg.click('[data-rep]'); pg.fill('#rn','test: voorbeeldzin klinkt raar'); pg.click('#rsv'); print('melding opgeslagen:',len(pg.evaluate("JSON.parse(localStorage.getItem('af2')).reports")))
    pg.screenshot(path='f_sheet.png'); pg.click('.sheet [data-close]')
    pg.keyboard.press('1'); print('toets 1 = nog niet -> volgende kaart:',pg.query_selector('[data-g]') is None)
    pg.keyboard.press('Space'); pg.keyboard.press('2')
    # 3. moeilijke kaarten
    pg.click('#nav [data-v=oef]'); print('oefen-rij moeilijk:',pg.inner_text('[data-a=weak]').replace('\n',' | '))
    pg.click('[data-a=weak]'); print('moeilijke sessie start met #fc:',pg.query_selector('#fc') is not None)
    # 4. luisteren
    pg.click('#nav [data-v=oef]'); pg.click('[data-a=luister]'); pg.click('#lgo'); pg.wait_for_timeout(400)
    said=pg.evaluate("window.__said.at(-1)"); print('luisteren speelt automatisch af:',said)
    pg.fill('#la',said[0].upper()+'!!'); pg.click('#lf button[type=submit]'); print('goed herkend:','Helemaal goed' in pg.inner_text('#app'))
    pg.click('#ln'); pg.wait_for_timeout(400); s2=pg.evaluate("window.__said.at(-1)")[0]
    words=s2.split(); typed=' '.join(words[:-1]+['verkeerd'])
    pg.fill('#la',typed); pg.click('#lf button[type=submit]'); print('fout woord gemarkeerd:',pg.eval_on_selector_all('.badw','e=>e.map(x=>x.innerText)'))
    pg.screenshot(path='f_luister.png')
    pg.click('#ls2'); print('langzaam-knop snelheid:',pg.evaluate("window.__said.at(-1)[1]"))
    # 5. eigen kaarten
    pg.click('#nav [data-v=kaart]'); pg.click('[data-a=own]'); pg.fill('#onl','zonnebrandcrème'); pg.fill('#oaf','sonskerm'); pg.fill('#ovb','Smeer sonskerm aan.'); pg.click('#of button[type=submit]')
    print('eigen kaart:',pg.inner_text('#om'))
    pg.click('.back'); print('lijst eigen kaarten:',pg.inner_text('#ls .muted'),'|',pg.inner_text('#ls .af'))
    pg.screenshot(path='f_own.png')
    pg.click('#nav [data-v=home]'); pg.click('[data-a=sess]'); print('eigen kaart als eerste nieuwe in sessie?', pg.inner_text('.fc .big'))
    pg.click('#nav [data-v=kaart]'); pg.select_option('#cat','Eigen kaarten'); pg.click('[data-del]'); pg.wait_for_timeout(100); print('na verwijderen:',pg.inner_text('#ls .muted'))
    # 6. spraaksnelheid + meldingen in meer
    pg.click('#nav [data-v=meer]'); pg.click('[data-s="rate:0.7"]'); print('snelheid opgeslagen:',pg.evaluate("JSON.parse(localStorage.getItem('af2')).rate"),'| testzin gesproken met:',pg.evaluate("window.__said.at(-1)[1]"))
    print('meldingen in meer:',pg.inner_text('#rpt')[:60])
    pg.click('#nav [data-v=kaart]'); pg.click('[data-sp]'); print('uitspraak gebruikt snelheid:',pg.evaluate("window.__said.at(-1)[1]"))
    # quiz: sneltoets 1-4
    pg.click('#nav [data-v=oef]'); pg.click('#qs'); pg.keyboard.press('3'); print('toets 3 kiest antwoord:',pg.eval_on_selector_all('.opt.ok,.opt.bad','e=>e.length')>0)
    print('FOUTEN',errs); b.close()
