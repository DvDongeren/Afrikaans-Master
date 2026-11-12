"""Omzetter, dictee per letter, zinsbouwer (focus, slepen) en de langere lijst valse vrienden."""
import json
from playwright.sync_api import sync_playwright
U='http://127.0.0.1:8765/'; errs=[]
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':390,'height':844},service_workers='block',has_touch=False); pg=ctx.new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)[:160])); pg.on('console',lambda m:errs.append(m.text[:140]) if m.type=='error' and 'vibrate' not in m.text else None)
    pg.add_init_script("if(!localStorage.getItem('af2'))localStorage.setItem('af2',JSON.stringify(%s));window.__said=[];speechSynthesis.speak=u=>{window.__said.push([u.text,u.rate])}"%json.dumps({'lvDone':True,'ms':{'_':1}}))
    pg.goto(U+'#/oef'); pg.wait_for_selector('[data-a=omzet]')
    # --- omzetter ---
    pg.click('[data-a=omzet]'); pg.wait_for_selector('#og')
    chips=pg.locator('#of [data-or]').count(); print('regelkeuzes:',chips); assert chips>=6
    pg.click('#of [data-or=nie]'); assert 'Dubbele ontkenning' in pg.inner_text('.tip')
    pg.click('#og'); pg.wait_for_selector('#oa')
    u=pg.evaluate("(()=>{const s=window.__t.st,u=s.items[s.i];return{nl:u.nl,af:u.af,n:u.s.length,all:s.items.every(x=>x.s.some(y=>y[0]==='nie'))}})()")
    print('zin:',u['nl'],'->',u['af'],'| alleen ontkenning:',u['all']); assert u['all']
    pg.click('[data-ch="ê"]'); assert pg.input_value('#oa')=='ê'
    pg.fill('#oa','Ek weet nie'); pg.click('#om button[type=submit]'); pg.wait_for_selector('.omz li')
    assert 'Net niet' in pg.inner_text('.pfb') and pg.locator('.omz li').count()==1
    for _ in range(u['n']-1): pg.click('#ost')
    assert pg.locator('.omz li').count()==u['n'] and pg.locator('.omz mark').count()>=u['n']
    print('stappen getoond:',u['n'],'| eindzin:',pg.inner_text('.card .af')); assert u['af'] in pg.inner_text('#app')
    pg.click('#onx'); pg.wait_for_selector('#oa')
    af=pg.evaluate("window.__t.st.items[window.__t.st.i].af"); pg.fill('#oa',af.upper()); pg.click('#om button[type=submit]')
    pg.wait_for_selector('#onx'); print('goed antwoord:',pg.inner_text('.pfb')[:8],'| score',pg.evaluate("window.__t.st.sc")); assert pg.evaluate("window.__t.st.sc")==1
    pg.click('#onx'); pg.click('#osk'); pg.wait_for_selector('#ost'); assert pg.locator('.pfb').count()==0
    # --- dictee ---
    pg.goto(U+'#/luister'); pg.wait_for_selector('#lgo'); assert 'Dictee' in pg.inner_text('h1')
    pg.click('[data-ll=k]'); pg.click('#lgo'); pg.wait_for_selector('#la')
    it=pg.evaluate("window.__t.st.items.map(x=>x.af)"); print('korte zinnen:',max(len(x.split()) for x in it)); assert max(len(x.split()) for x in it)<=4
    r=pg.evaluate("""(()=>{const f=dictDiffT;return [f('Ek het more gewerk','Ek het môre gewerk.'),f('Ek het môre gewerk','Ek het môre gewerk.'),f('Ek hed môre','Ek het môre gewerk.'),f("ek sien n hond daar","Ek sien 'n hond.")]})()""")
    print('accent:',r[0]['ok'],r[0]['acc'],'| exact:',r[1]['ok'],r[1]['acc'],'| fout:',r[2]['ok'],'| te veel:',r[3]['extra'])
    assert r[0]['ok'] and r[0]['acc'] and '<u>ô</u>' in r[0]['html'] and r[1]['ok'] and not r[1]['acc']
    assert not r[2]['ok'] and 'he<u>t</u>' in r[2]['html'] and '<u>g</u><u>e</u>' in r[2]['html'] and r[3]['extra']==['daar']
    s=pg.evaluate("window.__t.st.items[0].af"); w=s.split(); pg.fill('#la',' '.join(w[:-1]+['x'+w[-1][1:]])); pg.click('#lf button[type=submit]')
    pg.wait_for_selector('.dict .badw'); print('letter onderstreept:',pg.locator('.dict .badw u').count()); assert pg.locator('.dict .badw u').count()>=1
    # --- zinsbouwer: focus op ontkenning, slepen ---
    pg.goto(U+'#/zin'); pg.wait_for_selector('#zs'); pg.click('[data-zf=nie]'); pg.click('#zs'); pg.wait_for_selector('#zb')
    assert pg.evaluate("window.__t.st.items.every(x=>x.af.includes('nie'))"); print('alle zinnen met nie:',pg.evaluate("window.__t.st.items.length"))
    for _ in range(3): pg.click('#zb .chip >> nth=0')
    a0=pg.evaluate("window.__t.st.a.slice()")
    bx=pg.locator('#za .chip >> nth=2').bounding_box(); t0=pg.locator('#za .chip >> nth=0').bounding_box()
    pg.mouse.move(bx['x']+bx['width']/2,bx['y']+bx['height']/2); pg.mouse.down(); pg.mouse.move(t0['x']+30,t0['y']+10,steps=6); pg.mouse.move(t0['x']+2,t0['y']+bx['height']/2,steps=4); pg.mouse.up(); pg.wait_for_timeout(200)
    a1=pg.evaluate("window.__t.st.a.slice()"); print('slepen:',a0,'->',a1); assert a1==[a0[2],a0[0],a0[1]]
    pg.wait_for_timeout(450); pg.click('#za .chip >> nth=0'); assert pg.evaluate("window.__t.st.a.length")==2
    n=pg.locator('#zb .chip').count()
    for _ in range(n): pg.click('#zb .chip >> nth=0')
    pg.click('#zc'); pg.wait_for_selector('#zn'); print('na controle gemarkeerd:',pg.locator('#za .okc,#za .badc').count(),'| uitslag',pg.evaluate("window.__t.st.res"))
    # --- valse vrienden ---
    pg.goto(U+'#/vv'); pg.wait_for_selector('.card.vv'); k=pg.locator('.card.vv').count(); print('valse vrienden:',k); assert k==40 and 'kêrel' in pg.inner_text('#app')
    b.close()
print('FOUTEN',errs); assert not errs
