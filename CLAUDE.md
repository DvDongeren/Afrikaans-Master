# Afrikaans Master

Leerwebsite Afrikaans vanuit het Nederlands. Vanilla JS, geen framework, geen npm-afhankelijkheden.
De eigenaar schrijft Nederlands; antwoord in het Nederlands.

## Opbouw
- `bron/app.js`, `bron/app.css` — de app (views in `V.*`, staat in `S`, opgeslagen in localStorage `af2`).
- `bron/data.json` — alle kaarten, dialogen, paden, lessen, extra's.
- `bron/build.py` — bouwt `public/` (bestanden met hash in de naam, sw.js, manifest, _headers). `public/` staat niet in git.
- `bron/config.json` — `{"firebase": "auto" | null | {config}, "appCheckSiteKey": "", "siteUrl": "", "authDomain": ""}`.
- `firebase.json` — hosting + beveiligingsheaders (strenge CSP: geen inline scripts toevoegen!).
- `firestore.rules` — `users/{uid}` = `{data, mt, v}` (alleen eigenaar); `reports/*` (iedereen maakt aan, beheerders lezen/wissen); `admins/{uid}` (handmatig in console).
- Nieuwe velden in `S` altijd ook toevoegen aan `DEF`, `cleanState` en zo nodig `mergeState`.
- `tests/` — Playwright-tests; `python3 tests/run_all.py` start zelf een server die de headers van firebase.json toepast.

## Werkwijze
1. Wijzig in `bron/`, draai `python3 bron/build.py` en `python3 tests/run_all.py`.
2. Commit en push naar `main`. GitHub Actions bouwt, test en publiceert naar Firebase
   (geheim `FIREBASE_SERVICE_ACCOUNT`). Faalt een test, dan wordt er niet gepubliceerd.
3. Daarna zet de job `preview` een voorbeeld op GitHub Pages (`SITE_BASE=/Afrikaans-Master/ PREVIEW=1`).
   Paden in de app zijn daarom relatief (geen `/`-paden gebruiken in app.js).
4. Afrikaanse inhoud: controleer twijfelgevallen online (bijv. DSAE, WAT) voordat je iets wijzigt.
