#!/usr/bin/env python3
"""Bouwt de publieke website in ../public uit de bestanden in deze map.

Gebruik:  python3 build.py
Nodig:    Python 3.8+ (geen extra pakketten).

Elk bestand krijgt een versiecode in de naam (bijv. app.3f9a1c2e.js). Browsers en de
service worker mogen die bestanden daardoor een jaar bewaren; na een wijziging verandert
de naam vanzelf en haalt iedereen de nieuwe versie op.
"""
import base64, datetime, hashlib, json, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.environ.get('SITE_BASE', '/').rstrip('/') + '/'  # bijv. /Afrikaans-Master/ voor GitHub Pages
PREVIEW = os.environ.get('PREVIEW') == '1'      # voorbeeldversie: inloggen uit, niet indexeren
OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'public'))
src = lambda *p: os.path.join(HERE, *p)
read = lambda p: open(src(p), encoding='utf-8').read()
j = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))

# public/ wordt telkens helemaal opnieuw opgebouwd; instellingen staan in bron/config.json
if os.path.isdir(OUT):
    shutil.rmtree(OUT)
for d in ('assets/fonts', 'data', 'icons'):
    os.makedirs(os.path.join(OUT, d), exist_ok=True)

def emit(folder, name, ext, data):
    """Schrijf data als folder/name.<hash>.ext en geef het pad vanaf de root terug."""
    if isinstance(data, str):
        data = data.encode('utf-8')
    h = hashlib.sha256(data).hexdigest()[:10]
    rel = f'{folder}/{name}.{h}.{ext}'
    with open(os.path.join(OUT, rel), 'wb') as f:
        f.write(data)
    return BASE + rel

# ---------- data ----------
d = json.load(open(src('data.json'), encoding='utf-8'))
C = d['cards']
lv = ['Beginner', 'Intermediate', 'Advanced']
cat = sorted({c['categorie'] for c in C})
rows = []
for c in C:
    f = [str(c['id']), str(lv.index(c['niveau'])), str(cat.index(c['categorie'])), c['nl'], c['af'], c['voorbeeld']]
    if c.get('tips'):
        f.append(c['tips'])
    assert not any(('\t' in x or '\n' in x) for x in f), c['id']
    rows.append('\t'.join(f))
X = dict(d['extd'])
FACTS = X.pop('FACTS')
n = {'les': len(d['lesd']), 'bs': len(X['BS']), 'nie': len(X['NIE']), 'vv': len(d['vvd']['VV']), 'dlg': len(d['dlgd']),
     'st': len(d['vvd']['ST']), 'reis': len(X['REIS']), 'wa': len(X['WA']), 'menu': len(X['MENU']), 'sl': len(X['SL'])}
FILES = {
    'meta': emit('data', 'meta', 'json', j({'lv': lv, 'cat': cat, 'n': n})),
    'cards': emit('data', 'cards', 'txt', '\n'.join(rows)),
    'facts': emit('data', 'facts', 'json', j(FACTS)),
    'paths': emit('data', 'paths', 'json', j(d['pathd'])),
    'dlg': emit('data', 'dlg', 'json', j(d['dlgd'])),
    'les': emit('data', 'les', 'json', j(d['lesd'])),
    'ext': emit('data', 'ext', 'json', j(X)),
    'vv': emit('data', 'vv', 'json', j(d['vvd'])),
    'media': emit('data', 'media', 'json', j(d['mediad'])),
}

# ---------- lettertype ----------
fonts = {}
for w, style, fn in (('300 499', 'normal', 'lora-400'), ('500 800', 'normal', 'lora-600'), ('300 800', 'italic', 'lora-400i')):
    fonts[fn] = (w, style, emit('assets/fonts', fn, 'woff', open(src('fonts', fn + '.woff'), 'rb').read()))
shutil.copy(src('fonts', 'OFL.txt'), os.path.join(OUT, 'assets', 'fonts', 'OFL.txt'))
fontcss = '/* Lora (c) The Lora Project Authors, SIL Open Font License 1.1 */' + ''.join(
    f"@font-face{{font-family:'Lora';font-style:{s};font-weight:{w};font-display:swap;src:url({p}) format('woff')}}"
    for w, s, p in fonts.values())

# ---------- css en js ----------
css = read('app.css')
css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
css = re.sub(r'\s*\n\s*', '', css)
CSS = emit('assets', 'app', 'css', fontcss + css)
js = read('app.js')
js = '\n'.join(l for l in js.split('\n') if not re.match(r'\s*/\*.*\*/\s*$', l))
JS = emit('assets', 'app', 'js', js)
BOOT = emit('assets', 'boot', 'js', read('boot.js'))

# ---------- iconen ----------
for fn in os.listdir(src('icons')):
    if fn != 'icon-only.png':
        shutil.copy(src('icons', fn), os.path.join(OUT, 'icons', fn))

manifest = {
    'name': 'Afrikaans Master', 'short_name': 'Afrikaans', 'lang': 'nl', 'dir': 'ltr',
    'description': 'Leer Afrikaans vanuit het Nederlands.',
    'start_url': BASE, 'scope': BASE, 'id': BASE, 'display': 'standalone',
    'background_color': '#eef1ec', 'theme_color': '#14603f',
    'icons': [
        {'src': BASE + 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
        {'src': BASE + 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
        {'src': BASE + 'icons/icon-maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'},
    ],
}
open(os.path.join(OUT, 'manifest.webmanifest'), 'w', encoding='utf-8').write(j(manifest))

# ---------- pagina's ----------
files_attr = j(FILES).replace('&', '&amp;').replace("'", '&#39;')
head = f'''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#eef1ec" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0b110e" media="(prefers-color-scheme: dark)">
<link rel="icon" type="image/svg+xml" href="{BASE}icons/favicon.svg">
<link rel="apple-touch-icon" href="{BASE}icons/apple-180.png">
<link rel="manifest" href="{BASE}manifest.webmanifest">
<script src="{BOOT}"></script>
<link rel="preload" href="{fonts['lora-600'][2]}" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="{CSS}">'''
index = f'''<!doctype html>
<html lang="nl">
<head>
{head}
<title>Afrikaans Master – leer Afrikaans vanuit het Nederlands</title>
<meta name="description" content="Gratis Afrikaans leren vanuit het Nederlands: woordkaarten, grammatica, dialogen, verhaaltjes, luisteroefeningen en leerpaden. Werkt ook offline.">
<meta name="apple-mobile-web-app-title" content="Afrikaans Master">{'<meta name="robots" content="noindex">' if PREVIEW else ''}
<meta property="og:title" content="Afrikaans Master">
<meta property="og:description" content="Leer Afrikaans vanuit het Nederlands: kaarten, grammatica, dialogen en verhaaltjes.">
<meta property="og:type" content="website">
<link rel="preload" href="{FILES['meta']}" as="fetch" crossorigin>
<link rel="preload" href="{FILES['cards']}" as="fetch" crossorigin>
<script defer src="{JS}"></script>
</head>
<body>
<main id="app" aria-live="polite" data-files='{files_attr}'><div class="boot"><div><b>Afrikaans Master</b><p class="muted">Laden…</p></div></div></main>
<nav aria-label="Hoofdmenu"><div id="nav"></div></nav>
<noscript><p style="padding:24px;text-align:center">Deze app heeft JavaScript nodig.</p></noscript>
</body>
</html>
'''
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(index)

today = datetime.date.today().strftime('%d-%m-%Y')
for page in ('privacy.html', '404.html'):
    t = read(page).replace('__BOOT__', BOOT).replace('__CSS__', CSS).replace('__DATUM__', today).replace('__BASE__', BASE)
    open(os.path.join(OUT, page), 'w', encoding='utf-8').write(t)

open(os.path.join(OUT, 'robots.txt'), 'w').write('User-agent: *\n' + ('Disallow: /\n' if PREVIEW else 'Allow: /\n'))
cfg = json.load(open(src('config.json'), encoding='utf-8'))  # controleert meteen of het geldige JSON is
if PREVIEW:
    cfg = {'firebase': None, 'appCheckSiteKey': ''}
assert set(cfg) <= {'firebase', 'appCheckSiteKey'}, 'onbekende sleutel in config.json'
open(os.path.join(OUT, 'config.json'), 'w', encoding='utf-8').write(j(cfg))

# ---------- headers voor andere hosts (Netlify, Cloudflare Pages) ----------
fbj = os.path.join(HERE, '..', 'firebase.json')
if os.path.exists(fbj) and BASE == '/':
    hs = json.load(open(fbj, encoding='utf-8'))['hosting']['headers']
    find = lambda src_: next(h['headers'] for h in hs if h['source'] == src_)
    block = lambda path, kv: path + '\n' + ''.join(f"  {x['key']}: {x['value']}\n" for x in kv)
    nc = find('/')
    parts = [block('/*', find('**'))]
    parts += [block(p_, find('/@(assets|data)/**')) for p_ in ('/assets/*', '/data/*')]
    parts += [block('/icons/*', find('/icons/**'))]
    parts += [block(p_, nc) for p_ in ('/', '/index.html', '/sw.js', '/config.json', '/manifest.webmanifest', '/privacy.html')]
    open(os.path.join(OUT, '_headers'), 'w', encoding='utf-8').write('\n'.join(parts))

# ---------- service worker ----------
precache = [BASE + p_ for p_ in ('', 'privacy.html', 'manifest.webmanifest', 'icons/favicon.svg', 'icons/icon-192.png')] + [
            BOOT, CSS, JS] + [p for _, _, p in fonts.values()] + list(FILES.values())
version = hashlib.sha256(j(precache).encode() + index.encode() + read('privacy.html').encode() + read('sw.template.js').encode()).hexdigest()[:10]
sw = read('sw.template.js').replace('__VERSION__', version).replace('__BASE__', BASE).replace('__PRECACHE__', j(precache))
open(os.path.join(OUT, 'sw.js'), 'w', encoding='utf-8').write(sw)

total = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(OUT) for f in fs)
print(f'klaar: {OUT}  ({total // 1024} KB, versie {version})')
