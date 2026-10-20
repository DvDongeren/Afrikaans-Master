from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844}); errs=[]
    pg.add_init_script("addEventListener('securitypolicyviolation',e=>console.error('CSP '+e.violatedDirective+' '+e.blockedURI))"); pg.on('pageerror',lambda e:errs.append(str(e)[:160])); pg.on('console',lambda m:errs.append(m.text[:120]) if m.type=='error' else None)
    pg.goto('http://127.0.0.1:8765/'); pg.wait_for_selector('#nav [data-v]'); pg.wait_for_timeout(300)
    pg.click('#nav [data-v=oef]'); print('tegels:',pg.eval_on_selector_all('.tile h2','e=>e.map(x=>x.innerText)'))
    pg.click('[data-a=vv]'); print('valse vrienden:',pg.eval_on_selector_all('.card .af','e=>e.length')); pg.screenshot(path='v_vv.png')
    pg.click('[data-a="mc:vv"]'); good=0; trap=0
    for i in range(10):
        pg.wait_for_selector('.opt:not([disabled])')
        txt=pg.inner_text('#app'); 
        opts=pg.evaluate("[...document.querySelectorAll('.opt')].map(e=>+e.dataset.oi)"); pg.click(f'.opt[data-oi="0"]'); pg.wait_for_selector('#nx')
        good+= 'ok' in (pg.get_attribute('.opt[data-oi="0"]','class') or '')
        if i==0: pg.screenshot(path='v_vvq.png')
        pg.click('#nx')
    print('vv quiz: goed gekozen',good,'/10 ->',pg.inner_text('h1'))
    pg.click('[data-a=oef]'); pg.click('[data-a=stories]'); print('verhalen:',pg.eval_on_selector_all('[data-story]','e=>e.length'))
    for sid in ['winkel','braai','robot','kaapstad','dokter','beurtkrag']:
        pg.click(f'[data-story={sid}]')
        words=pg.eval_on_selector_all('.w','e=>e.map(x=>x.dataset.w)'); miss=[]
        for w in sorted(set(words)):
            pg.click(f'.w[data-w="{w}"]'); t=pg.inner_text('#wp')
            if 'Geen vertaling' in t: miss.append(w)
        print(sid,len(words),'woorden, zonder vertaling:',miss)
        if sid=='winkel': pg.click('.w[data-w="rand"]'); pg.screenshot(path='v_story.png'); pg.click('#tt'); pg.screenshot(path='v_story_tr.png')
        pg.click('#fin'); 
    print('gelezen:',pg.inner_text('.muted'),pg.evaluate("JSON.parse(localStorage.getItem('af2')).stories"))
    print('FOUTEN',errs); b.close()
