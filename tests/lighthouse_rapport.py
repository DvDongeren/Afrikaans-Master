"""Zet de Lighthouse-uitslag om in meldingen die op GitHub bij de run verschijnen."""
import glob, json, os, sys
d = sys.argv[1] if len(sys.argv) > 1 else '.lighthouseci'
files = sorted(glob.glob(os.path.join(d, 'lhr-*.json')))
if not files:
    print('::warning::Geen Lighthouse-resultaat gevonden.'); sys.exit(0)
r = json.load(open(files[-1]))
cats = {k: round((v.get('score') or 0) * 100) for k, v in r['categories'].items()}
naam = {'performance': 'Snelheid', 'accessibility': 'Toegankelijkheid', 'best-practices': 'Goede praktijken', 'seo': 'Vindbaarheid'}
regel = ' · '.join(f"{naam.get(k, k)} {v}" for k, v in cats.items())
print(f'::notice title=Lighthouse::{regel}')
for k in ('accessibility', 'best-practices', 'seo'):
    for ref in r['categories'][k]['auditRefs']:
        a = r['audits'].get(ref['id'], {})
        if ref.get('weight', 0) > 0 and a.get('score') is not None and a['score'] < 1:
            print(f"::warning title={naam[k]}::{a.get('title','')} ({ref['id']})")
m = r['audits']
vals = [f"{label} {m[key].get('displayValue', '')}" for key, label in (('first-contentful-paint', 'Eerste beeld'), ('largest-contentful-paint', 'Grootste element'), ('speed-index', 'Snelheidsindex'), ('total-blocking-time', 'Blokkeertijd'), ('cumulative-layout-shift', 'Verspringen')) if key in m]
print('::notice title=Lighthouse-metingen::' + ' · '.join(vals))
def snippets(o):
    """Zoek alle html-fragmenten (node.snippet) in een audit, ongeacht het formaat van de Lighthouse-versie."""
    if isinstance(o, dict):
        if isinstance(o.get('snippet'), str):
            yield o['snippet']
        for v in o.values():
            yield from snippets(v)
    elif isinstance(o, list):
        for v in o:
            yield from snippets(v)
for aid, a in m.items():
    if 'lcp' in aid or 'largest-contentful' in aid:
        el = next(snippets(a.get('details', {})), '')
        ph = [f"{x.get('phase') or x.get('subpart') or x.get('label')} {round(x.get('timing') or x.get('duration') or 0)}" for t in (a.get('details', {}).get('items') or []) if isinstance(t, dict) for x in (t.get('items') or []) if isinstance(x, dict) and (x.get('phase') or x.get('subpart'))]
        if el or ph:
            print(f'::notice title=Grootste element ({aid})::' + (el[:160] + ' ' if el else '') + ' · '.join(ph))
for key, title, lab in (('mainthread-work-breakdown', 'Hoofdthread', 'groupLabel'), ('bootup-time', 'Scripttijd', 'url')):
    it = sorted(m.get(key, {}).get('details', {}).get('items', []), key=lambda x: -(x.get('duration') or x.get('total') or 0))[:4]
    if it:
        print(f'::notice title={title}::' + ' · '.join(f"{str(x.get(lab) or x.get('group',''))[-40:]} {round(x.get('duration') or x.get('total') or 0)} ms" for x in it))
ops = sorted((a for a in m.values() if a.get('details', {}).get('type') == 'opportunity' and (a.get('numericValue') or 0) > 100), key=lambda a: -a['numericValue'])
for a in ops[:4]:
    print(f"::notice title=Kans::{a.get('title', '')} ({a.get('displayValue', '')})")
