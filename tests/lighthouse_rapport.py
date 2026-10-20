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
lcp = m.get('largest-contentful-paint-element', {}).get('details', {})
try:
    print('::notice title=Grootste element::' + str(lcp['items'][0]['items'][0]['node'].get('snippet', ''))[:200])
except Exception:
    pass
ops = sorted((a for a in m.values() if a.get('details', {}).get('type') == 'opportunity' and (a.get('numericValue') or 0) > 100), key=lambda a: -a['numericValue'])
for a in ops[:4]:
    print(f"::notice title=Kans::{a.get('title', '')} ({a.get('displayValue', '')})")
