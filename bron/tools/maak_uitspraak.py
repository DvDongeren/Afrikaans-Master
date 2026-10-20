#!/usr/bin/env python3
"""Maakt uitspraakbestanden (mp3) met Google Cloud Text-to-Speech, stem af-ZA-Standard-A.

Gebruik:  GOOGLE_APPLICATION_CREDENTIALS=sleutel.json python3 bron/tools/maak_uitspraak.py [map]
Alleen teksten zonder bestaand bestand worden aangevraagd. Stopt netjes (zonder fout) als de
dienst niet aan staat, zodat de site gewoon gepubliceerd wordt.
Nodig: pip install google-auth requests
"""
import base64, concurrent.futures as cf, json, os, sys, time
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from uitspraak import ahash, teksten, voor_spraak

OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', '..', 'audio-cache'))
MAX_CHARS = int(os.environ.get('MAX_CHARS', '600000'))  # ruim onder de gratis 4 miljoen tekens per maand
VOICE = {'languageCode': 'af-ZA', 'name': 'af-ZA-Standard-A'}
URL = 'https://texttospeech.googleapis.com/v1/text:synthesize'

def note(kind, msg):
    print(f'::{kind}::{msg}' if os.environ.get('GITHUB_ACTIONS') else f'{kind}: {msg}', flush=True)

def main():
    os.makedirs(OUT, exist_ok=True)
    d = json.load(open(os.path.join(HERE, '..', 'data.json'), encoding='utf-8'))
    todo = sorted(t for t in teksten(d) if not os.path.exists(os.path.join(OUT, ahash(t) + '.mp3')))
    have = len(os.listdir(OUT))
    if not todo:
        print(f'Alle uitspraakbestanden zijn er al ({have}).'); return have
    try:
        import requests
        from google.oauth2 import service_account
        from google.auth.transport.requests import Request
    except ImportError:
        note('warning', 'google-auth/requests niet geïnstalleerd; uitspraak overgeslagen.'); return have
    key = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    if not key or not os.path.exists(key):
        note('warning', 'Geen sleutel voor Google; uitspraak overgeslagen.'); return have
    creds = service_account.Credentials.from_service_account_file(key, scopes=['https://www.googleapis.com/auth/cloud-platform'])
    creds.refresh(Request())
    sess = requests.Session()
    budget = MAX_CHARS
    batch = []
    for t in todo:
        n = len(voor_spraak(t))
        if n > budget: break
        budget -= n; batch.append(t)
    stop = {'reden': None}

    def one(t):
        if stop['reden']: return False
        body = {'input': {'text': voor_spraak(t)}, 'voice': VOICE,
                'audioConfig': {'audioEncoding': 'MP3', 'speakingRate': 0.95, 'sampleRateHertz': 22050}}
        for poging in range(5):
            if not creds.valid: creds.refresh(Request())
            r = sess.post(URL, json=body, headers={'Authorization': 'Bearer ' + creds.token}, timeout=30)
            if r.status_code == 200:
                data = base64.b64decode(r.json()['audioContent'])
                tmp = os.path.join(OUT, ahash(t) + '.tmp')
                open(tmp, 'wb').write(data); os.replace(tmp, os.path.join(OUT, ahash(t) + '.mp3'))
                return True
            if r.status_code in (403, 401, 400) and poging == 0:
                stop['reden'] = f'{r.status_code}: {r.text[:300]}'; return False
            time.sleep(2 ** poging)
        return False

    ok = 0
    with cf.ThreadPoolExecutor(8) as ex:
        for res in ex.map(one, batch):
            ok += bool(res)
    if stop['reden']:
        note('warning', 'Uitspraak maken lukte niet. Staat de Text-to-Speech API aan en is facturering gekoppeld? ' + stop['reden'])
    rest = len(todo) - ok
    print(f'Uitspraak: {ok} nieuw, {have + ok} totaal' + (f', nog {rest} te gaan (volgende keer verder)' if rest else ''))
    return have + ok

if __name__ == '__main__':
    n = main()
    out = os.environ.get('GITHUB_OUTPUT')
    if out:
        open(out, 'a').write(f'n={n}\n')
