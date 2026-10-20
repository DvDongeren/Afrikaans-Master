"""Uitspraakbestanden: welke Afrikaanse teksten de app voorleest, en de bestandsnaam per tekst.

Wordt gebruikt door build.py (bestanden meenemen) en maak_uitspraak.py (bestanden maken).
De bestandsnaam is een hash van de tekst; app.js (ahash) rekent precies hetzelfde uit.
"""
import json, os

def ahash(t):
    h1, h2 = 0x811c9dc5, 0x050c5d1f
    for x in t.encode('utf-8'):
        h1 = ((h1 ^ x) * 0x01000193) & 0xffffffff
        h2 = ((h2 ^ x) * 0x01000193) & 0xffffffff
    return f'{h1:08x}{h2:08x}'

def teksten(d):
    """Alle Afrikaanse teksten waar in de app een voorleesknop bij staat."""
    T = set()
    add = lambda t: isinstance(t, str) and t.strip() and T.add(t.strip())
    for c in d['cards']:
        add(c['af']); add(c.get('voorbeeld'))
    for x in d['dlgd']:
        for l in x['lines']: add(l['af'])
    vv = d['vvd']
    for x in vv.get('ST', []):
        for p in x['s']: add(p[0])
    for v in vv.get('VV', []):
        add(v.get('af'))
        if v.get('ex'): add(v['ex'][0])
    X = d['extd']
    for r in X.get('REIS', []): add(r['af'])
    for b in X.get('BS', []): add(' '.join(b['af']) if isinstance(b['af'], list) else b['af'])
    for z in X.get('ZA', []):
        for w in z.get('words', []): add(w['af'])
    for k in X.get('CULT', {}): add(k)
    for k in X.get('KLANK', []):
        for a, _ in k['ex']: add(a)
    for q in X.get('SL', []): add(q.get('af'))
    for w in X.get('WA', []):
        for m in w.get('messages', []): add(m.get('t'))
    for l in d['lesd']:
        for e in l['ex']: add(e[0])
    add('Goeiemôre, hoe gaan dit?')
    return T

def voor_spraak(t):
    """Tekst zoals die naar de spraakdienst gaat: alternatieven met / als korte pauze."""
    return t.replace(' / ', ', ').replace('/', ', ')

if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    d = json.load(open(os.path.join(here, '..', 'data.json'), encoding='utf-8'))
    T = teksten(d)
    print(len(T), 'teksten,', sum(len(voor_spraak(t)) for t in T), 'tekens')
