#!/usr/bin/env python3
"""Zet correcties van de beheerder (Beheer › Correcties › Kopieer als JSON) vast in bron/data.json.

Gebruik:  python3 bron/tools/correcties.py correcties.json [--droog]
          --droog  laat alleen zien wat er zou veranderen.
Daarna: bouwen, testen en committen. De correcties in de app kun je dan verwijderen.
"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'data.json')
VELDEN = ('af', 'nl', 'voorbeeld', 'vbnl', 'tips')
if len(sys.argv) < 2:
    sys.exit(__doc__)
fixes = json.load(open(sys.argv[1], encoding='utf-8'))
droog = '--droog' in sys.argv
d = json.load(open(DATA, encoding='utf-8'))
kaarten = {c['id']: c for c in d['cards']}
n = 0
for f in fixes:
    c = kaarten.get(int(f['id']))
    if not c:
        print(f"! kaart {f['id']} bestaat niet meer, overgeslagen"); continue
    for k in VELDEN:
        nieuw = (f.get(k) or '').strip()
        if k in ('af', 'nl') and not nieuw:
            continue
        oud = c.get(k, '')
        if nieuw != oud:
            print(f"kaart {c['id']} {k}: {oud!r} -> {nieuw!r}"); n += 1
            if nieuw: c[k] = nieuw
            else: c.pop(k, None)
if droog:
    print(f'{n} wijzigingen (niets opgeslagen)')
else:
    open(DATA, 'w', encoding='utf-8').write(json.dumps(d, ensure_ascii=False, indent=1) + '\n')
    print(f'{n} wijzigingen opgeslagen in data.json')
