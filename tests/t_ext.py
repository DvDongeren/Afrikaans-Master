import json
from playwright.sync_api import sync_playwright
F='http://127.0.0.1:8765/'
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':844}); pg=ctx.new_page(); errs=[]
    pg.add_init_script("addEventListener('securitypolicyviolation',e=>console.error('CSP '+e.violatedDirective+' '+e.blockedURI))"); pg.on('pageerror',lambda e:errs.append(str(e)[:160])); pg.on('console',lambda m:errs.append(m.text[:120]) if m.type=='error' else None)
    pg.goto(F); pg.wait_for_selector('#nav [data-v]'); pg.wait_for_timeout(300)
    pg.click('#nav [data-v=oef]'); print('tegels:',pg.eval_on_selector_all('.tile','e=>e.map(x=>x.querySelector("h2").innerText)')); pg.screenshot(path='e_oef.png')
    # MC-modi: antwoord altijd de goede via DOM niet bekend -> klik eerste optie, verwacht doorlopen
    for kind in ['slang','wa','menu','nie']:
        pg.click('#nav [data-v=oef]'); pg.click(f'[data-a="mc:{kind}"]')
        pos=[]
        for i in range(10):
            pg.wait_for_selector('.opt:not([disabled])'); 
            pos.append(pg.eval_on_selector_all('.opt','e=>e.length'))
            pg.click('.opt'); pg.wait_for_selector('#nx'); 
            if i==0 and kind in('wa','menu'): pg.screenshot(path=f'e_{kind}.png')
            pg.click('#nx')
        print(kind,'klaar:',pg.inner_text('h1'),'| opties per vraag',set(pos))
    # antwoordpositie gespreid? (menu: correct stond altijd op 0)
    pg.click('#nav [data-v=oef]'); pg.click('[data-a="mc:menu"]'); posi=set()
    for i in range(10):
        pg.wait_for_selector('.opt:not([disabled])'); idx=pg.evaluate("[...document.querySelectorAll('.opt')].map(e=>+e.dataset.oi)"); posi.add(idx.index(0)); pg.click('.opt'); pg.click('#nx')
    print('menu: positie van oorspronkelijk goed antwoord varieert:',sorted(posi))
    # zinnen bouwen
    pg.click('#nav [data-v=oef]'); pg.click('[data-a=zin]'); pg.click('[data-l=Kort]'); pg.click('#zs')
    for i in range(10):
        tgt=pg.evaluate("null")
        # los op via data: haal items uit app niet bereikbaar -> bouw correcte volgorde via tekst-matching op NL
        nl=pg.inner_text('.big'); sol=pg.evaluate("async(nl)=>{const F=JSON.parse(document.getElementById('app').dataset.files);return (await (await fetch(F.ext)).json()).BS.find(b=>b.nl===nl).af}",nl)
        for w in sol:
            btns=pg.query_selector_all('#zb [data-i]'); 
            for bt in btns:
                if bt.inner_text()==w: bt.click(); break
        pg.click('#zc'); pg.wait_for_selector('#zn'); 
        if i==0: pg.screenshot(path='e_zin.png')
        pg.click('#zn')
    print('zinnen:',pg.inner_text('h1'))
    # reisgids, cultuur
    pg.click('[data-a=oef]'); pg.click('[data-a=reis]'); pg.fill('#rq','luchthaven'); print('reis zoek:',pg.eval_on_selector_all('#rl .li','e=>e.length'))
    pg.click('[data-a=oef]'); pg.click('[data-a=cult]'); 
    for t in ['weetjes','za','termen']: pg.click(f'[data-ct={t}]'); print('cultuur',t,pg.eval_on_selector_all('#app .card, #app .list > .li','e=>e.length'))
    pg.screenshot(path='e_cult.png')
    # typen in sessie
    pg.click('#nav [data-v=meer]'); pg.click('[data-s="typed:true"]'); print('typed:',pg.evaluate("JSON.parse(localStorage.getItem('af2')).typed"))
    pg.click('#nav [data-v=home]'); pg.click('[data-a=sess]')
    af=pg.evaluate("async(nl)=>{const F=JSON.parse(document.getElementById('app').dataset.files);return (await (await fetch(F.cards)).text()).split('\\n').map(r=>r.split('\\t')).find(f=>f[3]===nl)[4]}",pg.inner_text('.fc .big'))
    pg.fill('#ta',af.split(' / ')[0].upper()); pg.click('#tf button[type=submit]'); print('typen goed herkend (hoofdletters):','Goed' in pg.inner_text('.fc'))
    pg.click('[data-g="1"]'); pg.fill('#ta','xyz'); pg.click('#tf button[type=submit]'); print('fout herkend:','Jij typte' in pg.inner_text('.fc')); pg.screenshot(path='e_typed.png')
    pg.click('[data-g="0"]'); pg.click('#tskip'); print('weet niet ->antwoord zichtbaar:',pg.query_selector('[data-g="1"]') is not None)
    # categoriefilter
    pg.click('#nav [data-v=kaart]'); pg.select_option('#cat','Nood & veiligheid'); print('categoriefilter:',pg.inner_text('#ls .muted'))
    # quiz met fouten-lijst
    pg.click('#nav [data-v=oef]'); pg.click('#qs')
    for i in range(10): pg.click('.opt'); pg.wait_for_timeout(1450)
    print('quiz einde bevat herhaallijst:',('Om te herhalen' in pg.inner_text('#app')) or ('Foutloos' in pg.inner_text('#app')))
    # statistieken + badges + import
    pg.click('#nav [data-v=meer]'); print('badges:',pg.eval_on_selector_all('.chip.on,.chip.lock','e=>e.length'),'| weekbalken:',pg.eval_on_selector_all('.wk div','e=>e.length')); pg.screenshot(path='e_meer.png')
    pg.evaluate("localStorage.setItem('af_srs',JSON.stringify({'0':{interval:5,due:Date.now()+1e8,ease:2.5,reps:3},'1':{interval:0,due:0},'999999':{interval:9},'295':{interval:40,due:Date.now()}}));localStorage.setItem('af_favs',JSON.stringify([2,3,999999]))")
    pg.click('#io'); print('import:',pg.inner_text('#iom'))
    # scenario-paden
    pg.click('#nav [data-v=paden]'); pg.click('[data-pg=Situatie]'); n=pg.eval_on_selector_all('[data-p]','e=>e.length'); print('situatiepaden:',n)
    pg.click('[data-p=sc_emergency]')
    steps=pg.eval_on_selector_all('[data-step]','e=>e.length')
    for i in range(steps):
        pg.click(f'[data-step="{i}"]'); pg.wait_for_timeout(80)
        if pg.query_selector('[data-fin]'): pg.click('[data-fin]')
        elif pg.query_selector('#fc'):
            for _ in range(40):
                if pg.query_selector('[data-a=stepdone]'): break
                if S:=pg.query_selector('#ta'): pg.click('#tskip')
                else: pg.click('#fc')
                pg.click('[data-g="1"]')
            pg.click('[data-a=stepdone]')
        elif pg.query_selector('.opt'):
            for _ in range(30):
                if pg.query_selector('[data-a=stepdone]'): break
                pg.click('.opt'); pg.wait_for_timeout(1450)
            pg.click('[data-a=stepdone]')
    print('noodpad voortgang:',pg.evaluate("JSON.parse(localStorage.getItem('af2')).paths.sc_emergency"),'van',steps)
    print('FOUTEN',errs); b.close()
