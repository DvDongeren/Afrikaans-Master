#!/usr/bin/env python3
"""Bouwt de publieke website in ../public uit de bestanden in deze map.

Gebruik:  python3 build.py
Nodig:    Python 3.8+ (geen extra pakketten).

Elk bestand krijgt een versiecode in de naam (bijv. app.3f9a1c2e.js). Browsers en de
service worker mogen die bestanden daardoor een jaar bewaren; na een wijziging verandert
de naam vanzelf en haalt iedereen de nieuwe versie op.
"""
import base64, datetime, hashlib, json, os, re, shutil, subprocess, sys

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

# ---------- instellingen ----------
cfg = json.load(open(src('config.json'), encoding='utf-8'))  # controleert meteen of het geldige JSON is
assert set(cfg) <= {'firebase', 'appCheckSiteKey', 'siteUrl', 'authDomain'}, 'onbekende sleutel in config.json'
SITE_URL = (cfg.get('siteUrl') or '').rstrip('/')
assert not SITE_URL or re.match(r'^https://[a-z0-9.-]+$', SITE_URL), 'siteUrl moet zijn als https://www.voorbeeld.nl'
if PREVIEW:
    cfg = {'firebase': None, 'appCheckSiteKey': ''}
    SITE_URL = ''
cfg.pop('siteUrl', None)

# ---------- uitspraakbestanden (gemaakt door tools/maak_uitspraak.py) ----------
sys.path.insert(0, src('tools'))
from uitspraak import ahash, teksten
AUDIO_SRC = os.environ.get('AUDIO_DIR') or os.path.join(HERE, '..', 'audio-cache')

# ---------- data ----------
d = json.load(open(src('data.json'), encoding='utf-8'))
C = d['cards']
lv = ['Beginner', 'Intermediate', 'Advanced']
cat = sorted({c['categorie'] for c in C})
rows = {0: [], 1: [], 2: []}
for c in C:
    f = [str(c['id']), str(lv.index(c['niveau'])), str(cat.index(c['categorie'])), c['nl'], c['af'], c['voorbeeld']]
    if c.get('tips') or c.get('vbnl'):
        f.append(c.get('tips', ''))
    if c.get('vbnl'):
        f.append(c['vbnl'])
    assert not any(('\t' in x or '\n' in x) for x in f), c['id']
    rows[lv.index(c['niveau'])].append('\t'.join(f))
X = dict(d['extd'])
FACTS = X.pop('FACTS')
n = {'les': len(d['lesd']), 'bs': len(X['BS']), 'nie': len(X['NIE']), 'vv': len(d['vvd']['VV']), 'dlg': len(d['dlgd']),
     'st': len(d['vvd']['ST']), 'reis': len(X['REIS']), 'wa': len(X['WA']), 'menu': len(X['MENU']), 'sl': len(X['SL'])}
FILES = {
    'meta': emit('data', 'meta', 'json', j({'lv': lv, 'cat': cat, 'n': n})),
    'cards0': emit('data', 'cards0', 'txt', '\n'.join(rows[0])),
    'cards1': emit('data', 'cards1', 'txt', '\n'.join(rows[1])),
    'cards2': emit('data', 'cards2', 'txt', '\n'.join(rows[2])),
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
ESBUILD = shutil.which('esbuild')
def minify(code, loader):
    """Echt verkleinen met esbuild als dat geïnstalleerd is (zoals op GitHub); anders eenvoudig."""
    if ESBUILD:
        r = subprocess.run([ESBUILD, '--minify', '--loader=' + loader, '--log-level=warning'],
                           input=code.encode('utf-8'), capture_output=True)
        if r.returncode == 0:
            return r.stdout.decode('utf-8')
        sys.exit('esbuild faalde: ' + r.stderr.decode('utf-8'))
    if loader == 'css':
        code = re.sub(r'/\*.*?\*/', '', code, flags=re.S)
        return re.sub(r'\s*\n\s*', '', code)
    return '\n'.join(l for l in code.split('\n') if not re.match(r'\s*/\*.*\*/\s*$', l))
JS_PARTS = sorted(f for f in os.listdir(src('js')) if f.endswith('.js')) if os.path.isdir(src('js')) else []
js_src = '\n'.join(read(os.path.join('js', f)) for f in JS_PARTS) if JS_PARTS else read('app.js')
CSS_TEXT = minify(fontcss + read('app.css'), 'css')
CSS = emit('assets', 'app', 'css', CSS_TEXT)
JS = emit('assets', 'app', 'js', minify(js_src, 'js'))
BOOT = emit('assets', 'boot', 'js', read('boot.js'))
BOOT_INLINE = minify(read('boot.js'), 'js').strip()
assert '</' not in BOOT_INLINE and '</' not in CSS_TEXT

# Het kleine startscript staat in de pagina zelf (geen extra wachttijd). De CSP staat het toe via
# zijn hash; die wordt hier in firebase.json bijgewerkt zodat ze altijd overeenkomt.
BOOT_HASH = "'sha256-" + base64.b64encode(hashlib.sha256(BOOT_INLINE.encode('utf-8')).digest()).decode() + "'"
fbj_path = os.path.join(HERE, '..', 'firebase.json')
if os.path.exists(fbj_path):
    raw = open(fbj_path, encoding='utf-8').read()
    fbj = json.loads(raw)
    for h in fbj['hosting']['headers']:
        for kv in h['headers']:
            if kv['key'] == 'Content-Security-Policy':
                parts = [x.strip() for x in kv['value'].split(';')]
                for i, part in enumerate(parts):
                    if part.startswith('script-src'):
                        toks = [t for t in part.split() if not t.startswith("'sha256-")]
                        toks.insert(2, BOOT_HASH)
                        parts[i] = ' '.join(toks)
                kv['value'] = '; '.join(parts)
    new = json.dumps(fbj, indent=2) + '\n'
    if new != raw:
        open(fbj_path, 'w', encoding='utf-8').write(new)

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
CANON = (f'\n<link rel="canonical" href="{SITE_URL}/">\n<meta property="og:url" content="{SITE_URL}/">'
         f'\n<meta property="og:image" content="{SITE_URL}/icons/icon-512.png">') if SITE_URL else ''
NOINDEX = '\n<meta name="robots" content="noindex">' if PREVIEW else ''
meta_attr = j({'lv': lv, 'cat': cat, 'n': n}).replace('&', '&amp;').replace("'", '&#39;')
files_attr = j(FILES).replace('&', '&amp;').replace("'", '&#39;')
head = f'''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#eef1ec" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0b110e" media="(prefers-color-scheme: dark)">
<link rel="icon" type="image/svg+xml" href="{BASE}icons/favicon.svg">
<link rel="apple-touch-icon" href="{BASE}icons/apple-180.png">
<link rel="manifest" href="{BASE}manifest.webmanifest">
<script>{BOOT_INLINE}</script>
<link rel="preload" href="{fonts['lora-600'][2]}" as="font" type="font/woff" crossorigin>
<style>{CSS_TEXT}</style>'''
index = f'''<!doctype html>
<html lang="nl">
<head>
{head}
<title>Afrikaans Master – leer Afrikaans vanuit het Nederlands</title>
<meta name="description" content="Gratis Afrikaans leren vanuit het Nederlands: woordkaarten, grammatica, dialogen, verhaaltjes, luisteroefeningen en leerpaden. Werkt ook offline.">
<meta name="apple-mobile-web-app-title" content="Afrikaans Master">{NOINDEX}
<meta property="og:title" content="Afrikaans Master">
<meta property="og:description" content="Leer Afrikaans vanuit het Nederlands: kaarten, grammatica, dialogen en verhaaltjes.">
<meta property="og:type" content="website">{CANON}
<link rel="preload" href="{FILES['cards0']}" as="fetch" crossorigin>
<script defer src="{JS}"></script>
</head>
<body>
<main id="app" aria-live="polite" data-files='{files_attr}' data-meta='{meta_attr}'><div class="boot"><div><b>Afrikaans Master</b><p class="muted">Laden…</p></div></div></main>
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

robots = 'User-agent: *\n' + ('Disallow: /\n' if PREVIEW else 'Allow: /\n')
if SITE_URL:
    robots += f'Sitemap: {SITE_URL}/sitemap.xml\n'
    open(os.path.join(OUT, 'sitemap.xml'), 'w', encoding='utf-8').write(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + ''.join(f'  <url><loc>{SITE_URL}/{p_}</loc></url>\n' for p_ in ('', 'privacy.html')) + '</urlset>\n')
open(os.path.join(OUT, 'robots.txt'), 'w').write(robots)
n_audio = 0
if os.path.isdir(AUDIO_SRC):
    os.makedirs(os.path.join(OUT, 'audio'), exist_ok=True)
    for t in teksten(d):
        f = ahash(t) + '.mp3'
        if os.path.exists(os.path.join(AUDIO_SRC, f)):
            shutil.copy(os.path.join(AUDIO_SRC, f), os.path.join(OUT, 'audio', f)); n_audio += 1
if n_audio:
    cfg['audio'] = True
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
    parts += [block('/audio/*', find('/audio/**'))]
    parts += [block(p_, nc) for p_ in ('/', '/index.html', '/sw.js', '/config.json', '/manifest.webmanifest', '/privacy.html')]
    open(os.path.join(OUT, '_headers'), 'w', encoding='utf-8').write('\n'.join(parts))

# ---------- service worker ----------
precache = [BASE + p_ for p_ in ('', 'privacy.html', 'manifest.webmanifest', 'icons/favicon.svg', 'icons/icon-192.png')] + [
            BOOT, CSS, JS] + [p for _, _, p in fonts.values()] + list(FILES.values())
version = hashlib.sha256(j(precache).encode() + index.encode() + read('privacy.html').encode() + read('sw.template.js').encode()).hexdigest()[:10]
sw = read('sw.template.js').replace('__VERSION__', version).replace('__BASE__', BASE).replace('__PRECACHE__', j(precache))
open(os.path.join(OUT, 'sw.js'), 'w', encoding='utf-8').write(sw)

total = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(OUT) for f in fs)
print(f'klaar: {OUT}  ({total // 1024} KB, versie {version}, uitspraak: {n_audio} bestanden, verkleinen: {"esbuild" if ESBUILD else "eenvoudig"})')
