# Afrikaans Master

Leerwebsite om Afrikaans te leren vanuit het Nederlands. Deze opslagplaats bevat de broncode;
GitHub bouwt, test en publiceert de website automatisch op Firebase Hosting.

## Hoe updates werken
1. Een wijziging komt in `bron/` (door Claude of door jou) en wordt naar `main` gepusht.
2. GitHub Actions bouwt de website, draait alle tests in een echte browser en zet hem live.
   Je ziet de voortgang onder het tabblad **Actions**.
3. Faalt een test, dan wordt er niets gepubliceerd en blijft de vorige versie online.
4. Elke run bewaart de gebouwde site als download (*Artifacts* > `website`).
5. Terug naar een vorige versie: Firebase-console > **Hosting** > *Release history* > ⋮ > **Rollback**.

## Voorbeeldversie
Bij elke update komt ook een voorbeeldversie online op
https://dvdongeren.github.io/Afrikaans-Master/ — handig om te kijken. Daar werkt inloggen niet,
de extra beveiligingsheaders ontbreken en zoekmachines slaan hem over. Voor echte bezoekers
gebruik je de Firebase-versie. (Eenmalig aanzetten: **Settings > Pages > Source: GitHub Actions**.)

## Wat zit erin

| Map / bestand        | Wat het is |
|----------------------|------------|
| `bron/`              | De broncode: app (`bron/js/`), opmaak, alle data, privacyverklaring, `build.py`. |
| `bron/tools/`        | Hulpscripts, onder meer voor de uitspraakbestanden. |
| `docs/`              | Rapporten, zoals de taalcontrole. |
| `bron/config.json`   | Instellingen voor inloggen, App Check en eigen domein (stap 6b en 9). |
| `tests/`             | Automatische tests (`python3 tests/run_all.py`). |
| `firebase.json`      | Hostinginstellingen met de beveiligingsheaders (CSP enzovoort). |
| `firestore.rules`    | Databaseregels: iedereen kan alleen zijn eigen voortgang lezen en schrijven. |
| `.github/workflows/` | De automatische bouw-, test- en publicatiestap. |

Eenmalig instellen kost ongeveer een half uur en gaat helemaal via de browser.

## 1. Firebase-project maken
1. Ga naar https://console.firebase.google.com en kies **Project maken** (Create a project).
2. Kies een naam, bijvoorbeeld `afrikaans-master`. Google Analytics mag uit.
3. Noteer de **project-ID** (staat onder de naam, bijvoorbeeld `afrikaans-master-1a2b3`).

## 2. Inloggen met Google aanzetten
1. Open **Authentication** (soms onder *Security / Beveiliging*) en klik **Get started**.
2. Tab **Sign-in method** > **Google** > zet **Enable** aan.
3. Kies je e-mailadres als *support email* en klik **Save**.

## 3. Database aanmaken
1. Open **Firestore Database** en klik **Create database**.
2. Kies een locatie in Europa (bijvoorbeeld `eur3` of `europe-west4`).
3. Kies **production mode**. De juiste regels worden bij het publiceren automatisch geplaatst.

## 4. Web-app registreren
1. Ga naar **Project settings** (tandwiel) > **Your apps** > klik het **</>**-icoon (Web).
2. Geef een naam, vink **Firebase Hosting** aan en klik **Register app**.
   De configuratie die je ziet hoef je niet te kopiëren: op Firebase Hosting wordt die
   automatisch geladen (`"firebase": "auto"` in `config.json`).

## 5. GitHub toestemming geven om te publiceren
GitHub heeft een sleutel nodig waarmee het (alleen) op dit Firebase-project mag publiceren.

1. Ga naar https://console.cloud.google.com/iam-admin/serviceaccounts en kies bovenaan je
   Firebase-project. **Let op:** Google Cloud opent vaak een ander project (met een naam als
   *My First Project* en een ID als `nth-plexus-123456`). Kies het project met dezelfde ID als
   in de Firebase-console (Projectinstellingen > Project-ID).
2. Klik **Create service account**. Naam: `github-publiceren`. Klik **Create and continue**.
3. Geef deze rollen (zoek ze op naam en klik telkens **Add another role**):
   - **Firebase Hosting Admin**
   - **Firebase Rules Admin**
   - **API Keys Viewer**

   Klik **Done**.
4. Klik op het nieuwe account > tab **Keys** > **Add key** > **Create new key** > **JSON** > **Create**.
   Er wordt een bestand gedownload. Dit is een geheim: deel het met niemand.
5. Ga op GitHub naar de opslagplaats > **Settings** > **Secrets and variables** > **Actions** >
   **New repository secret**.
   Naam: `FIREBASE_SERVICE_ACCOUNT`. Plak bij *Secret* de volledige inhoud van het JSON-bestand.
   Klik **Add secret** en verwijder daarna het gedownloade bestand van je computer.
6. Ga naar het tabblad **Actions** > *Bouwen, testen en publiceren* > **Run workflow**.
   Na een paar minuten staat de site op `https://JOUW-PROJECT-ID.web.app`.
   Open hem, ga naar **Meer** en klik **Inloggen met Google**.

**Controle:** in Authentication > Settings > **Authorized domains** moeten je adressen
(`…web.app` en `…firebaseapp.com`) staan. Meestal staan ze er al.

**Mislukt het publiceren met "Failed to get Firebase project …"?** Dan hoort de sleutel bij een
Google Cloud-project waar Firebase niet aan hangt. Maak de sleutel opnieuw aan in het juiste project
(stap 1) en vervang het geheim. Gebruik je bewust één sleutel voor een ander project, zet dan bij
**Settings > Secrets and variables > Actions > Variables** de variabele `FIREBASE_PROJECT` op de
project-ID van Firebase.

**Mislukt het publiceren met "permission denied"?** Voeg de rol toe die in de foutmelding
genoemd wordt (IAM > je service account > potloodje), of als het snel moet de rol **Firebase Admin**.

## 6. Extra beveiliging (aanbevolen voor publiek gebruik)

### a. API-sleutel beperken
De Firebase-sleutel is geen geheim (hij staat altijd in de browser), maar je kunt wel
beperken waar hij werkt:
1. Ga naar https://console.cloud.google.com/apis/credentials en kies je project.
2. Open de sleutel **Browser key (auto created by Firebase)**.
3. Kies onder *Application restrictions* **Websites** en voeg toe:
   `https://JOUW-ID.web.app/*`, `https://JOUW-ID.firebaseapp.com/*` en eventueel je eigen domein.
4. Opslaan. Test daarna of inloggen nog werkt.

### b. App Check (blokkeert verzoeken die niet van jouw site komen)
1. Maak een reCAPTCHA Enterprise-sleutel: https://console.cloud.google.com/security/recaptcha
   > **Create key** > platform *Website* > voeg je domeinen toe. Kopieer de sleutel (site key).
2. In de Firebase-console: **App Check** > **Apps** > je web-app > **reCAPTCHA Enterprise** >
   plak de sleutel > **Save**.
3. Zet de sleutel in `bron/config.json`:

       { "firebase": "auto", "appCheckSiteKey": "JOUW-SITE-KEY" }

4. Push de wijziging (of laat Claude dat doen). Kijk een paar dagen bij App Check > **APIs** > *Cloud Firestore* of de
   verzoeken als "verified" binnenkomen. Klik daarna **Enforce** (afdwingen).
   Doe dat ook voor *Authentication* als die optie er staat.

### c. Budgetwaarschuwing
Blijf op het gratis **Spark**-abonnement: dan kan er nooit een rekening komen. Ga je naar
Blaze, stel dan een budgetwaarschuwing in (Google Cloud > Billing > Budgets & alerts).

## 7. Privacyverklaring invullen
Open `bron/privacy.html` en vervang (of vraag Claude het te doen) `[JOUW NAAM]` en `[JOUW E-MAILADRES]`. Verplicht als anderen de site gebruiken (AVG).

## 8. Meldingen ontvangen (beheerder worden)
Bezoekers kunnen bij elke kaart melden dat er iets niet klopt. Die meldingen komen in de
database terecht; alleen beheerders kunnen ze lezen.

1. Open de site en log één keer in met Google (Meer > Inloggen met Google).
2. Firebase-console > **Authentication** > **Users**: kopieer je **User UID**.
3. **Firestore Database** > **Start collection** > Collection ID: `admins` > **Next**.
4. Document ID: plak je UID. Voeg een veld toe, bijvoorbeeld `naam` (string) met je naam. **Save**.
5. Herlaad de site. Onder Meer > Account staat nu **Meldingen beheren**: je ziet alle meldingen,
   kunt de kaart opzoeken en een melding als afgehandeld wegklikken.

Meldingen kunnen ook zonder account worden ingestuurd. Zet daarom App Check aan (stap 6b) om
spam van buiten de site tegen te houden. Zonder Firebase (zoals op de voorbeeldversie) blijft
een melding op het toestel van de gebruiker.

## 9. Eigen domeinnaam
1. Koop een domeinnaam bij een registrar naar keuze, bijvoorbeeld `afrikaansmaster.nl`.
2. Firebase-console > **Hosting** > **Add custom domain**. Vul `www.afrikaansmaster.nl` in en
   kies dat het kale domein (`afrikaansmaster.nl`) daarheen doorstuurt.
3. Zet de DNS-records die Firebase toont bij je registrar. Het controleren en het
   HTTPS-certificaat kunnen tot 24 uur duren.
4. Voeg het domein toe aan:
   - Authentication > Settings > **Authorized domains**;
   - de API-sleutelbeperking (stap 6a): `https://www.afrikaansmaster.nl/*`;
   - de reCAPTCHA-sleutel als je App Check gebruikt.
5. Zet in `bron/config.json`:

       "siteUrl": "https://www.afrikaansmaster.nl",
       "authDomain": "www.afrikaansmaster.nl"

   `siteUrl` zorgt voor een sitemap en de juiste vermelding in zoekmachines. `authDomain`
   laat het inloggen via je eigen domein lopen, zodat het ook in Safari en Firefox goed werkt.
   Laat beide leeg (`""`) zolang het domein nog niet werkt.
6. Push de wijziging (of vraag Claude het te doen).

## 10. Echte Afrikaanse uitspraak (aanbevolen)
Veel telefoons hebben geen Afrikaanse voorleesstem en lezen dan met een Nederlandse stem voor.
GitHub kan voor alle kaarten, zinnen en dialogen (ongeveer 8000 teksten) eenmalig geluidsbestanden
maken met Google's Afrikaanse stem. Zolang dit niet aan staat, gebruikt de app de stem van het toestel.

1. Google Cloud console (zelfde project) > **APIs & Services** > **Enable APIs** > zoek
   **Cloud Text-to-Speech API** > **Enable**.
2. Google vereist hiervoor een **factureringsaccount** (Billing). Je Firebase-project gaat daarmee
   van Spark naar het Blaze-abonnement. Gebruik blijft gratis binnen de limieten: Text-to-Speech
   geeft 4 miljoen tekens per maand gratis; alles maken kost ongeveer 125.000 tekens, daarna alleen
   nieuwe teksten. **Stel meteen een budgetwaarschuwing in** (Billing > Budgets & alerts, bijv. € 1).
3. Start bij **Actions** de workflow opnieuw. Bij de run staat hoeveel bestanden er gemaakt zijn.
   Staat er een waarschuwing met "PERMISSION_DENIED"? Geef het service account `github-publiceren`
   dan de rol die in de melding genoemd wordt (IAM > potloodje > Add another role).

De bestanden worden tussen runs bewaard, dus alleen nieuwe of gewijzigde teksten worden aangevraagd.
Per run wordt maximaal 600.000 tekens aangevraagd, ruim binnen de gratis hoeveelheid.

## Wat al ingebouwd is
- **Strenge beveiligingsheaders**: een Content-Security-Policy die alleen scripts van de eigen
  site en van Google/Firebase toestaat, bescherming tegen inbedden in andere sites
  (clickjacking), HTTPS afdwingen (HSTS), geen camera/microfoon/locatie.
- **Geen inline scripts**: alle code staat in aparte bestanden, zodat de CSP streng kan zijn.
- **Strenge databaseregels**: alleen de eigenaar mag zijn document lezen of schrijven, en
  alleen met de verwachte velden en maximaal ~900 kB.
- **Invoercontrole**: back-ups en clouddata worden gecontroleerd en opgeschoond voordat de app
  ze gebruikt.
- **Account verwijderen**: gebruikers kunnen zelf hun account en clouddata wissen
  (Meer > Account en cloudgegevens verwijderen).
- **Offline werken en snel laden**: een service worker bewaart de app. Bij een nieuwe versie
  verschijnt de melding "Er is een nieuwe versie" met een knop Vernieuwen.
- **Versiecodes in bestandsnamen**: browsers bewaren bestanden een jaar, maar krijgen na een
  update meteen de nieuwe versie.

## Bijwerken
Wijzig de bestanden in `bron/` en push naar `main`; de rest gaat automatisch.
Bij elke run meet GitHub ook snelheid en toegankelijkheid (Lighthouse); de scores staan als
melding bij de run. Lokaal controleren kan met `python3 bron/build.py` en `python3 tests/run_all.py`
(eenmalig nodig: `pip install playwright` en `python3 -m playwright install chromium`).

## Lokaal testen
De site werkt niet meer door op `index.html` te dubbelklikken (de browser blokkeert dan het
laden van de databestanden). Bouw de site en start een kleine server:

    python3 bron/build.py
    python3 tests/serve.py 8000

en open http://localhost:8000. Inloggen werkt alleen op het echte webadres.

## Problemen oplossen
- **Inloggen werkt niet / pop-up sluit meteen.** Open de ontwikkelaarstools (F12) > Console.
  Staat er *Refused to … because it violates the Content Security Policy*? Voeg het genoemde
  domein toe aan de juiste regel (`script-src`, `connect-src` of `frame-src`) in
  `firebase.json` en push de wijziging.
- **Doorsturen werkt niet in Safari of Firefox.** Gebruik het adres op `.firebaseapp.com`, of
  zet bij een eigen domein in `bron/config.json` de volledige configuratie met
  `"authDomain": "jouw-eigen-domein.nl"` (zie hieronder). De pop-up werkt meestal overal.
- **Eigen domein?** Zie stap 9.

## Andere host dan Firebase (Netlify, Cloudflare Pages)
Download de gebouwde site (Actions > laatste run > *Artifacts* > `website`) en upload die. Het bestand `public/_headers` bevat dezelfde
beveiligingsheaders in het formaat van die hosts. Zet in `bron/config.json` je
Firebase-configuratie (Project settings > Your apps > *SDK setup and configuration* > Config):

    {
      "firebase": { "apiKey": "…", "authDomain": "JOUW-ID.firebaseapp.com",
                    "projectId": "JOUW-ID", "appId": "…" },
      "appCheckSiteKey": ""
    }

Voeg het adres toe aan *Authorized domains*. De databaseregels plaats je met
`npx firebase-tools deploy --only firestore:rules`. Zet je `"firebase": null`, dan is inloggen uit en
werkt de app alleen met lokale opslag.

## Kosten
Het gratis Spark-abonnement is ruim voldoende: Firestore 50.000 keer lezen en 20.000 keer
schrijven per dag, Hosting 10 GB opslag en 360 MB dataverkeer per dag. Een eerste bezoek kost
ongeveer 200 kB (gecomprimeerd), daarna laadt de app uit de cache. Zie
https://firebase.google.com/pricing.
