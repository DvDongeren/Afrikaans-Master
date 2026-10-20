"""Zoeken met tikfouten, onderwerpen, sessie in twee richtingen, uitspraakbestanden en foutmeldingen."""
import json, os, sys, time
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bron', 'tools'))
from uitspraak import ahash
from playwright.sync_api import sync_playwright
U='http://127.0.0.1:8765/'; errs=[]; TOON=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'testtoon.mp3'),'rb').read()
def page(b,state=None,init=None,sw='allow'):
    ctx=b.new_context(viewport={'width':390,'height':844},service_workers=sw); pg=ctx.new_page()
    pg.add_init_script("addEventListener('securitypolicyviolation',e=>console.error('CSP '+e.violatedDirective+' '+e.blockedURI))")
    pg.on('pageerror',lambda e:errs.append(str(e)[:160])); pg.on('console',lambda m:errs.append(m.text[:140]) if m.type=='error' else None)
    if state: pg.add_init_script("if(!localStorage.getItem('af2'))localStorage.setItem('af2',JSON.stringify(%s))"%json.dumps(state))
    if init: pg.add_init_script(init)
    return ctx,pg
def open_(pg): pg.goto(U); pg.wait_for_selector('#nav [data-v]')
with sync_playwright() as p:
    b=p.chromium.launch()
    # --- zoeken met tikfouten ---
    ctx,pg=page(b); open_(pg)
    pg.click('#nav [data-v=kaart]'); pg.fill('#s','olifnat'); pg.wait_for_timeout(400)
    print('kaarten tikfout:',pg.inner_text('#ls .muted')[:60],'|',pg.inner_text('#ls .af >> nth=0'))
    pg.keyboard.press('Escape'); pg.goto(U+'?z'); pg.wait_for_selector('#nav [data-v]'); pg.keyboard.press('/'); pg.fill('#zq','krokodiel'); pg.wait_for_timeout(400)
    print('zoeken tikfout:',pg.inner_text('#zr p.muted')[:50],'| groepen',pg.eval_on_selector_all('#zr .sec','e=>e.map(x=>x.textContent)'))
    # --- onderwerpen ---
    pg.click('#nav [data-v=kaart]'); n=pg.locator('#tp .topic').count(); pg.click('#tp [data-tp="Dieren & safari"]'); pg.wait_for_timeout(200)
    print('onderwerpen:',n,'| gekozen:',pg.input_value('#cat'),'|',pg.inner_text('#ls .muted'))
    pg.screenshot(path='z_topics.png'); ctx.close()
    # --- sessie in twee richtingen ---
    now=int(time.time()*1000)
    srs={str(i):{'box':3,'due':now-1000,'t':now-5000} for i in range(30)}
    ctx,pg=page(b,state={'srs':srs,'lvDone':True},init="Math.random=()=>0.1"); open_(pg)
    pg.click('[data-a=sess]'); pg.wait_for_selector('#fc')
    print('omgekeerd:',pg.inner_text('#fc .lbl'),'|',pg.locator('#fc.rev').count())
    pg.click('#fc'); print('antwoord:',pg.inner_text('#fc .ans .lbl'))
    pg.screenshot(path='z_rev.png'); ctx.close()
    # --- uitspraakbestanden ---
    calls=[]
    ctx,pg=page(b,sw='block',init="window.__tts=[];try{speechSynthesis.speak=u=>window.__tts.push(u.text);speechSynthesis.cancel=()=>{}}catch(e){}")
    def cfg(route): route.fulfill(status=200,content_type='application/json',body=json.dumps({'firebase':None,'appCheckSiteKey':'','audio':True}))
    known=ahash('Goeiemôre, hoe gaan dit?')
    def audio(route):
        name=route.request.url.rsplit('/',1)[1]; calls.append(name)
        if name==known+'.mp3': route.fulfill(status=200,content_type='audio/mpeg',body=TOON)
        else: route.fulfill(status=404,content_type='text/html',body='nee')
    pg.route('**/config.json',cfg); pg.route('**/audio/*.mp3',audio); open_(pg); pg.wait_for_timeout(300)
    pg.click('#nav [data-v=meer]'); pg.click('[data-s="rate:1"]'); pg.wait_for_timeout(900)
    print('bekend bestand gespeeld:',calls[-1:]==[known+'.mp3'],'| geen spraakstem nodig:',pg.evaluate('window.__tts.length')==0)
    pg.click('#nav [data-v=home]'); pg.click('.entry [data-sp], .entry .icon >> nth=0'); pg.wait_for_timeout(900)
    print('onbekend -> terugval op spraak:',pg.evaluate('window.__tts.length')>=1,'| aanvragen',len(calls))
    errs[:]=[e for e in errs if '404' not in e]  # verwacht: onbekend bestand geeft 404
    ctx.close()
    # --- technische fouten melden ---
    LOG=[]
    MOCK="""window.__cloudAdapter={signIn:async()=>{},signOut:async()=>{},onUser:f=>setTimeout(()=>f({uid:'admin1',displayName:'B',email:'',photoURL:''}),10),redirect:async()=>null,load:async()=>null,save:async()=>{},
      isAdmin:async()=>true,logError:async e=>{await window.errAdd(JSON.stringify(e))},listErrors:async()=>JSON.parse(await window.errList()),delError:async d=>{await window.errDel(d)},listReports:async()=>[]};
      localStorage.setItem('af2',JSON.stringify({cloud:1,lvDone:true}))"""
    ctx,pg=page(b)
    pg.expose_function('errAdd',lambda e:LOG.append(dict(json.loads(e),doc='e%d'%len(LOG),t=0)))
    pg.expose_function('errList',lambda:json.dumps(LOG)); pg.expose_function('errDel',lambda d:LOG.__setitem__(slice(None),[x for x in LOG if x['doc']!=d]))
    pg.add_init_script(MOCK); open_(pg); pg.wait_for_timeout(800)
    pg.evaluate("setTimeout(()=>{throw new Error('testfout voor beheer')},0)"); pg.wait_for_timeout(800)
    errs[:]=[e for e in errs if 'testfout' not in e]
    print('fout gemeld:',[ (x['m'],x['b'],x['ver']) for x in LOG])
    pg.click('#nav [data-v=meer]'); pg.wait_for_selector('[data-a=beheer]'); pg.click('[data-a=beheer]'); pg.click('[data-bt=fout]'); pg.wait_for_selector('[data-edone]')
    print('in beheer:',pg.locator('[data-edone]').count()); pg.click('[data-edone]'); pg.wait_for_timeout(300); print('na opgelost:',len(LOG))
    ctx.close()
    print('FOUTEN',errs)
