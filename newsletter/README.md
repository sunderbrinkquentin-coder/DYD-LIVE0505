# DYD-Newsletter: Strategie, Einrichtung, Betrieb

Ziel: Neue Nutzer:innen direkt nach der Anmeldung für den Newsletter gewinnen
(Anreiz: **50 % auf die erste Buchung**), sie über eine kurze Willkommensstrecke
zur ersten Buchung führen und danach mit einem monatlichen Newsletter zu
weiteren Käufen bewegen – vollständig DSGVO- und UWG-konform.

---

## 1. So funktioniert der Ablauf

1. **Anmeldung/Registrierung** → beim ersten Seitenaufruf im Konto erscheint
   das Angebot (`NewsletterOfferModal`). Kein vorausgewähltes Häkchen,
   vollständiger Einwilligungstext direkt über dem Button, neutrale Ablehnung.
   - „Nein, danke“ → wird nie wieder automatisch gefragt.
   - Schließen (X) → erneute Frage frühestens nach 3 Tagen.
2. **Double-Opt-in**: Die Edge Function `newsletter` speichert den
   Einwilligungsnachweis und schickt die Bestätigungsmail (Link 7 Tage gültig).
3. **Bestätigung** (`/newsletter/bestaetigen`) → Rabatt wird freigeschaltet
   (30 Tage gültig), Kontakt kommt in die Brevo-Liste, Willkommensmail geht raus.
4. **Kauf**: `stripe-checkout` zieht die 50 % automatisch ab (kein Code nötig);
   `stripe-webhook` markiert den Rabatt nach bezahlter Buchung als eingelöst.
5. **Abmeldung**: Link in jeder Mail (`/newsletter/abmelden`) + Ein-Klick-
   Abmeldung im Postfach (List-Unsubscribe) + Abmeldungen in Brevo werden per
   Webhook zurückgespielt. Der Rabatt bleibt auch nach Abmeldung erhalten.
6. **Konto löschen** → Eintrag wird gelöscht, Brevo-Kontakt ebenfalls.

An allen Kaufstellen (CV-Check, Credits, CV-Optimierung, Lernpfad,
Skill-Analyse, Kurse) zeigt `NewsletterDiscountHint` den Rabatt bzw. das
Angebot an – genau dort, wo die Kaufentscheidung fällt.

---

## 2. Einrichtung (einmalig, ca. 45 Minuten)

### 2.1 Brevo (Versanddienst, EU)
1. Konto auf brevo.com anlegen, **AVV (Auftragsverarbeitungsvertrag)** im
   Konto abschließen (Einstellungen → Sicherheit/Datenschutz).
2. **Absender-Domain authentifizieren** (Einstellungen → Absender & Domains):
   SPF, DKIM und DMARC als DNS-Einträge bei deinem Domain-Anbieter setzen.
   Ohne diese Einträge landen Mails im Spam (Pflicht bei Gmail/Yahoo).
   Empfohlener Absender: `newsletter@decide-your-dream.de`, Name „Quentin von DYD“.
3. **Liste** „DYD Newsletter“ anlegen → Listen-ID notieren.
4. **Kontakt-Attribute** anlegen (Kontakte → Einstellungen → Attribute):
   | Name | Typ |
   |---|---|
   | SIGNUP_SOURCE | Text |
   | OPT_IN_DATE | Datum |
   | DISCOUNT_PERCENT | Zahl |
   | DISCOUNT_UNTIL | Datum |
   | DISCOUNT_REDEEMED | Boolean |
   | UNSUBSCRIBE_URL | Text |
5. **API-Schlüssel** erzeugen (Einstellungen → SMTP & API → API-Schlüssel).
6. **Webhook für Abmeldungen** (Einstellungen → Webhooks → Marketing):
   URL `https://<PROJEKT>.supabase.co/functions/v1/newsletter?action=brevo-webhook&secret=<NEWSLETTER_WEBHOOK_SECRET>`
   Ereignisse: *Abgemeldet*, *Hard Bounce*, *Als Spam markiert*.
7. **Tracking**: Öffnungs- und Klick-Tracking aktiv lassen (ist im
   Einwilligungstext genannt).
8. **Datumsformat** unter Einstellungen → Konto auf `TT.MM.JJJJ` stellen,
   damit `{{ contact.DISCOUNT_UNTIL }}` in den Vorlagen deutsch erscheint.
9. **Aufräumen**: In Supabase unter Database → Extensions `pg_cron`
   aktivieren und die Migration danach erneut ausführen (oder einmalig
   `select cron.schedule('newsletter-cleanup','15 3 * * *','select public.newsletter_cleanup()');`).
   Löscht unbestätigte Anmeldungen nach 30 Tagen – so steht es in der
   Datenschutzerklärung.

### 2.2 Stripe
1. Produkte → Gutscheine → **Neuer Gutschein**: 50 %, Dauer „Einmal“,
   Name „Newsletter-Willkommensrabatt“. Die **Gutschein-ID** notieren.
2. Optional: Gutschein auf B2C-Produkte beschränken („Gilt für Produkte“).

### 2.3 Supabase
```bash
# Datenbank
supabase db push        # spielt 20261019120000_create_newsletter_subscribers.sql ein

# Secrets
supabase secrets set BREVO_API_KEY=xkeysib-… BREVO_LIST_ID=3 \
  NEWSLETTER_SENDER_EMAIL=newsletter@decide-your-dream.de NEWSLETTER_SENDER_NAME="Quentin von DYD" \
  NEWSLETTER_WEBHOOK_SECRET=<langer-zufallswert> SITE_URL=https://decide-your-dream.de \
  STRIPE_COUPON_NEWSLETTER=<gutschein-id> NEWSLETTER_DISCOUNT_DAYS=30 NEWSLETTER_DISCOUNT_PERCENT=50

# Functions
supabase functions deploy newsletter --no-verify-jwt
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy delete-account
```
Wer über Bolt/Dashboard deployt: Migration im SQL-Editor ausführen, Secrets
unter Edge Functions → Secrets eintragen, beim Deploy von `newsletter` die
JWT-Prüfung ausschalten.

### 2.4 Rechtliches (vor dem Start)
- Baustein aus `datenschutz-baustein.md` in die Datenschutzerklärung übernehmen.
- Im Impressum „§ 5 TMG“ → „§ 5 DDG“ und „§ 55 Abs. 2 RStV“ → „§ 18 Abs. 2 MStV“
  aktualisieren (TMG/RStV gelten seit 2024 bzw. 2020 nicht mehr).
- Einwilligungstext ändern? → neue Version in **beiden** Dateien anlegen
  (`src/features/newsletter/consent.ts` und
  `supabase/functions/_shared/newsletterConsent.ts`), alte Version behalten.

---

## 3. Willkommensstrecke (Brevo-Automation)

Trigger: *Kontakt wird zur Liste „DYD Newsletter“ hinzugefügt*.
Mail 1 versendet die Edge Function direkt nach der Bestätigung.

| Tag | Mail | Ziel | Bedingung |
|---|---|---|---|
| 0 | Willkommen + Rabatt aktiv (automatisch) | Erste Buchung | – |
| 2 | `02-ats-fehler.html` – Die 3 häufigsten ATS-Fehler | Vertrauen + CV-Check | – |
| 6 | `03-so-nutzt-du-den-rabatt.html` – Welche Buchung sich am meisten lohnt | Kauf | DISCOUNT_REDEEMED = false |
| 23 | `04-rabatt-endet.html` – Noch 7 Tage | Kauf | DISCOUNT_REDEEMED = false |
| 29 | `05-letzter-tag.html` – Heute letzter Tag | Kauf | DISCOUNT_REDEEMED = false |

Danach: monatlicher Newsletter (`monatlich-vorlage.html`).

---

## 4. Monatlicher Newsletter: Aufbau, der verkauft

Rhythmus: 1× pro Monat fest + max. 1 Aktions-Mail (Einwilligung: höchstens 2/Monat).
Versand: Dienstag oder Donnerstag, 7:30 Uhr (Pendelzeit) – mit Brevo-A/B-Test prüfen.

**Aufbau (immer gleich, damit Leser:innen ihn wiedererkennen):**
1. **Betreff + Vorschauzeile** – konkreter Nutzen oder Zahl, max. 45 Zeichen.
   Formeln: „Warum so viele Lebensläufe im ATS scheitern“,
   „[Vorname], dieser Satz kostet dich Einladungen“, „Neu bei DYD: …“.
2. **Thema des Monats** (aktuell, 4–6 Sätze): Arbeitsmarkt, KI im
   Recruiting, Gehalt, Bewerbungstrends – mit seriöser Quelle (z. B. Bundesagentur
   für Arbeit, IAB, Destatis, Stepstone-Studien). Endet mit „Was das für dich heißt“.
3. **Ein Tipp zum Sofort-Umsetzen** (Vorher/Nachher-Beispiel aus einem CV).
4. **DYD-Baustein** – ein Produkt, ein Problem, ein Button (nie mehr als ein Haupt-CTA).
5. **Angebot** – nur ehrliche Fristen und echte Preise.
6. **P.S.** – zweiter Klickanlass (P.S. wird überdurchschnittlich oft gelesen).

**Segmente (Brevo):**
- *Noch nie gekauft* → Fokus CV-Check/Detailanalyse.
- *Gekauft, Credits leer* → Pakete.
- *Lernpfad/Kurs gekauft* → weiterführende Kurse.
- *Inaktiv 90 Tage* → Reaktivierungsmail, danach ggf. austragen (bessere Zustellbarkeit).

**Kennzahlen (monatlich prüfen):** Klickrate (Ziel > 3 %), Umsatz pro Mail
(UTM `utm_source=newsletter` + Stripe), Abmelderate (< 0,5 %),
Anmeldequote im Angebot (Ziel > 25 %), Bestätigungsquote DOI (Ziel > 70 %),
Rabatt-Einlösequote (Ziel > 20 %). Öffnungsraten sind wegen Apple Mail
Privacy Protection nur eingeschränkt aussagekräftig.

**Tabus (rechtlich und für die Marke):** keine erfundenen Bewertungen, Zahlen
oder Fristen; keine Mails an unbestätigte Adressen; kein Kauf von Adressen;
jede Mail mit Impressum und Abmeldelink.
