import json
from playwright.sync_api import sync_playwright
F='http://127.0.0.1:8765/'
STORE={}; FAIL={'on':False}
MOCK="""
window.__cloudAdapter=(()=>{let cb=null;const U={uid:'u1',displayName:'Daan Test',email:'daan@example.com',photoURL:''};
 return{signIn:async()=>{setTimeout(()=>cb&&cb(U),30)},signOut:async()=>{cb&&cb(null)},onUser:f=>{cb=f;setTimeout(()=>f(localStorage.getItem('mocklogin')?U:null),10)},redirect:async()=>null,
 load:async uid=>{const r=await window.cloudGet(uid);return r?JSON.parse(r):null},
 save:async(uid,d)=>{const ok=await window.cloudSet(uid,JSON.stringify(d));if(!ok){const e=new Error('offline');e.code='unavailable';throw e}localStorage.setItem('mocklogin','1')}}})();
"""
def device(b,init_state):
    ctx=b.new_context(viewport={'width':390,'height':844}); pg=ctx.new_page(); errs=[]
    pg.add_init_script("addEventListener('securitypolicyviolation',e=>console.error('CSP '+e.violatedDirective+' '+e.blockedURI))"); pg.on('pageerror',lambda e:errs.append(str(e)[:160])); pg.on('console',lambda m:errs.append(m.text[:140]) if m.type=='error' else None)
    pg.expose_function('cloudGet',lambda uid: STORE.get(uid))
    def cs(uid,data):
        if FAIL['on']: return False
        STORE[uid]=data; return True
    pg.expose_function('cloudSet',cs)
    pg.add_init_script(MOCK); pg.add_init_script("if(!localStorage.getItem('af2'))localStorage.setItem('af2',JSON.stringify(%s))"%json.dumps(init_state))
    pg.on('dialog',lambda d:d.accept())
    pg.goto(F); pg.wait_for_selector('#nav [data-v]'); pg.wait_for_timeout(300); return ctx,pg,errs
st=lambda pg:pg.evaluate("JSON.parse(localStorage.getItem('af2'))")
with sync_playwright() as p:
    b=p.chromium.launch()
    A={'lvDone':True,'srs':{'0':{'box':3,'due':1,'t':1000},'1':{'box':1,'due':1,'t':5000}},'days':{'2026-10-18':12,'2026-10-19':5},'favs':[0],'last':'2026-10-19','streak':2,'own':[{'id':-1,'nl':'kat','af':'kat','vb':''}],'mt':100}
    ctx,pg,errs=device(b,A)
    pg.click('#nav [data-v=meer]'); pg.wait_for_timeout(200)
    print('A: account-blok zichtbaar:','Inloggen met Google' in pg.inner_text('#acct')); pg.screenshot(path='c_meer_uit.png')
    pg.click('#cin'); pg.wait_for_timeout(600)
    print('A: ingelogd als:',pg.inner_text('#acct').split('\n')[1:3],'| cloud heeft data:', 'u1' in STORE)
    pg.screenshot(path='c_meer_in.png')
    # apparaat B met andere voortgang
    B={'lvDone':True,'srs':{'1':{'box':4,'due':1,'t':9000},'2':{'box':2,'due':1,'t':7000}},'days':{'2026-10-19':9,'2026-10-20':4},'favs':[5],'last':'2026-10-20','streak':3,'own':[{'id':-1,'nl':'hond','af':'hond','vb':''}],'mt':200,'theme':'dark'}
    ctx2,pg2,errs2=device(b,B)
    pg2.click('#nav [data-v=meer]'); pg2.wait_for_timeout(200); pg2.click('#cin'); pg2.wait_for_timeout(800)
    m=st(pg2)
    print('B samengevoegd: kaarten',sorted(m['srs'].keys()),'| kaart 1 box',m['srs']['1']['box'],'(nieuwste wint)','| dagen',m['days'],'| favorieten',sorted(m['favs']),'| reeks',m['streak'],m['last'])
    print('B eigen kaarten:',sorted(o['af'] for o in m['own']),'| ids uniek:',len({o['id'] for o in m['own']})==len(m['own']),'| thema',m['theme'])
    print('cloud == B na samenvoegen:', json.loads(json.loads(STORE['u1'])['data'])['srs'].keys()==m['srs'].keys())
    # A opnieuw openen (sessie hersteld) haalt B's voortgang op
    pg.reload(); pg.wait_for_timeout(900); a2=st(pg)
    print('A na herladen: kaarten',sorted(a2['srs'].keys()),'| eigen kaarten',sorted(o['af'] for o in a2['own']))
    # offline: opslaan mislukt, daarna herstel
    FAIL['on']=True; pg.click('#nav [data-v=home]'); pg.click('.cta'); pg.click('#fc'); pg.click('[data-g="1"]'); pg.evaluate("Object.defineProperty(navigator,'onLine',{value:false,configurable:true})")
    pg.click('#nav [data-v=meer]'); pg.wait_for_timeout(3200); print('offline status:',pg.inner_text('#acct [role=status]'))
    dot=pg.evaluate("(document.querySelector('#nav .syncdot')||{}).dataset"); print('statusstip:',dot); assert dot and dot.get('s')=='off'
    FAIL['on']=False; pg.evaluate("Object.defineProperty(navigator,'onLine',{value:true,configurable:true});dispatchEvent(new Event('online'))"); pg.wait_for_timeout(500)
    print('na online:',pg.inner_text('#acct [role=status]'))
    # uitloggen: lokale voortgang blijft
    n=len(st(pg)['srs']); pg.click('#cout'); pg.wait_for_timeout(300)
    print('uitgelogd:','Inloggen met Google' in pg.inner_text('#acct'),'| lokale kaarten behouden:',len(st(pg)['srs'])==n)
    # reset op B wordt niet teruggezet door oude gegevens
    pg2.click('#rst'); pg2.wait_for_timeout(3000); pg2.evaluate("1")
    ctx3,pg3,errs3=device(b,{'lvDone':True,'srs':{'9':{'box':5,'due':1,'t':1}},'mt':50})
    pg3.click('#nav [data-v=meer]'); pg3.wait_for_timeout(200); pg3.click('#cin'); pg3.wait_for_timeout(800)
    print('na wissen op B: oud apparaat haalt niets terug:',st(pg3)['srs'])
    print('FOUTEN',errs,errs2,errs3); b.close()
