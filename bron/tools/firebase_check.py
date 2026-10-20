#!/usr/bin/env python3
"""Zoekt uit waarom publiceren op Firebase mislukt. Drukt alleen projectnamen, statuscodes en
Google-foutmeldingen af, nooit de sleutel zelf.

Gebruik: GOOGLE_APPLICATION_CREDENTIALS=sleutel.json python3 firebase_check.py PROJECT-ID
"""
import json, os, sys
import google.auth.transport.requests
from google.oauth2 import service_account

project = sys.argv[1]
info = json.load(open(os.environ['GOOGLE_APPLICATION_CREDENTIALS']))
creds = service_account.Credentials.from_service_account_info(
    info, scopes=['https://www.googleapis.com/auth/cloud-platform'])
s = google.auth.transport.requests.AuthorizedSession(creds)
print(f"::notice::Sleutel hoort bij project '{info.get('project_id')}', account {info.get('client_email')}")

def check(naam, url):
    r = s.get(url)
    try:
        e = r.json().get('error', {})
        msg = e.get('message', '')
        reden = ','.join(d.get('reason', '') for d in e.get('details', []) if d.get('reason'))
    except Exception:
        msg, reden = r.text[:200], ''
    soort = 'notice' if r.ok else 'error'
    print(f"::{soort}::{naam}: HTTP {r.status_code} {reden} {msg[:300]}".strip())
    return r.ok

check('Firebase-project', f'https://firebase.googleapis.com/v1beta1/projects/{project}')
check('Google Cloud-project', f'https://cloudresourcemanager.googleapis.com/v1/projects/{project}')
check('Hosting-sites', f'https://firebasehosting.googleapis.com/v1beta1/projects/{project}/sites')
r = s.get(f'https://firebase.googleapis.com/v1beta1/projects?pageSize=20')
if r.ok:
    ids = [p.get('projectId') for p in r.json().get('results', [])]
    print(f"::notice::Firebase-projecten die deze sleutel kan zien: {', '.join(ids) or 'geen'}")
