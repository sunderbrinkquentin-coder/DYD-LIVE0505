# DYD-Newsletter – Resend

Der aktive Newslettercode nutzt den bereits vorhandenen Supabase-Secret
`RESEND_API_KEY`, denselben Namen wie `send-b2b-briefing`. Es gibt keine
Brevo-API-Aufrufe mehr. `brevo.ts` ist nur ein Kompatibilitäts-Reexport für ältere
Imports. Keine produktiven Zugangsdaten gehören ins Frontend oder Repository.

## Ablauf

1. Anmeldung speichert Einwilligung v2 und sendet Double-Opt-in über Resend.
2. Bestätigung aktiviert den bestehenden 50-%-Rabatt und synchronisiert den
   Kontakt nach Resend. Die Willkommensmail wird ebenfalls über Resend versendet.
3. Kauf verbucht den Rabatt weiterhin in Supabase/Stripe. Optional werden
   Kontaktattribute nach Resend gespiegelt; ein Ausfall blockiert den Kauf nicht.
4. Link und One-Click-Abmeldung setzen den Status in Supabase und Resend.
5. Signierte Resend-Webhooks übernehmen Abmeldungen, Bounces und Beschwerden.
6. Kontolöschung entfernt auch den Resend-Kontakt. Bei einem Providerfehler wird
   der Vorgang als Fehler gemeldet, damit die Löschung wiederholt werden kann.

## Einmalige Einrichtung / Deployment

- Den bestehenden `RESEND_API_KEY` in Supabase weiterverwenden. Für Kontakte
  braucht er passende Zugriffsrechte (ein reiner Sending-Key reicht dafür nicht).
- `NEWSLETTER_SENDER_EMAIL` auf eine bei Resend freigegebene Absenderadresse setzen.
  Optional `NEWSLETTER_SENDER_NAME` (Standard: Quentin von DYD).
  Alternativ wird `RESEND_FROM_EMAIL` als vollständige Absenderangabe genutzt.
  Es wird keine neue Absenderadresse automatisch als verifiziert angenommen.
- `SITE_URL` auf die tatsächliche Live-Domain setzen. Bestehende Stripe-
  Rabattsecrets und die Newsletter-Tabelle bleiben erhalten.
- Für einen getrennten Marketingverteiler ein Resend-Segment „DYD Newsletter“
  anlegen und `RESEND_NEWSLETTER_SEGMENT_ID` setzen. Ohne diesen Wert werden
  Kontakte ohne Segment angelegt. Kampagnen ausschließlich an bestätigte
  Newsletterkontakte richten, nicht pauschal an alle Kontakte des Resend-Kontos.
- Resend-Webhook einrichten:
  `https://<projekt>.supabase.co/functions/v1/newsletter?action=resend-webhook`
  Events: `contact.updated`, `email.bounced`, `email.complained`, `email.suppressed`.
  Das Signing Secret (`whsec_…`) als `RESEND_WEBHOOK_SECRET` in Supabase speichern.
  Signaturen werden mit Svix und dem unveränderten Request-Body geprüft;
  ein Secret als URL-Parameter wird nicht mehr verwendet.

```bash
supabase functions deploy newsletter --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy delete-account
npm ci
npm run test:newsletter
npm run build
```

Frontend zusammen mit der Newsletterfunktion aktualisieren: neue Anmeldungen
akzeptieren nur `2026-10-v2-resend`. Alte Einwilligungstexte bleiben als historische
Nachweise unverändert erhalten. Bereits bestehende Bestätigungslinks funktionieren
weiter. Beim Providerwechsel auch den Datenschutzhinweis aktualisieren.

## Optionale Kontaktattribute

Standardmäßig bleiben Rabatt-/Quellinformationen ausschließlich in Supabase,
und nur Name, E-Mail und Abostatus werden in Resend gepflegt. Wer Resend-Kampagnen
nach Rabattstatus segmentieren möchte, legt folgende Custom Properties vom Typ
`string` an und setzt anschließend `RESEND_SYNC_PROPERTIES=true`:

- `signup_source`
- `opt_in_date`
- `discount_percent`
- `discount_until`
- `discount_redeemed` (Werte `true` / `false` als Text)
- `unsubscribe_url`

Ein Kontakt wird erst nach gültigem Double-Opt-in abonniert. Käufe erzeugen keine
neuen Abonnements und setzen einen abgemeldeten Kontakt niemals zurück.

## Bestehende Kontakte und Kampagnen

Diese Codeänderung importiert keine alten Brevo-Kontakte und versendet keine
Kampagne. Vor Abschalten bestehender Brevo-Automationen bestätigte Abonnenten mit
Abmeldestatus aus Supabase abgleichen und den gewünschten Verteiler nach Resend
übernehmen. Pending/declined/unsubscribed dürfen nicht als abonniert importiert
werden. Bereits vorhandene Brevo-Automationen deaktivieren, um Doppelversand zu
vermeiden. Alte Providerdaten werden durch diese Änderung nicht rückwirkend gelöscht.

Das Repository hatte keinen Scheduler für Monatsnewsletter oder die geplante
Willkommensserie an Tag 2/6/23/29. Diese waren nur als externe Brevo-Automation
beschrieben. Sie müssen bei Bedarf als Resend-Kampagnen/Automationen eingerichtet
werden; der Code versendet aktuell Bestätigungs- und Willkommensmails.
Die Dateien unter `brevo-vorlagen/` sind historische HTML-Entwürfe, keine aktiven
Versandjobs. Brevo-Platzhalter vor Verwendung in Resend ersetzen.

## Fehler und Kontrolle

- Fehlende Konfiguration oder abgelehnte Bestätigungsmail: HTTP 502 statt falscher
  Erfolgsmeldung. Nur erfolgreich gesendete Mails erhöhen den Versandzähler.
- Explizite 429-Antworten werden begrenzt wiederholt; unbekannte Versand-Timeouts
  nicht automatisch, damit nicht versehentlich doppelte Mails entstehen.
- Abmeldung wird lokal gespeichert; ein erneuter Aufruf wiederholt eine zuvor
  fehlgeschlagene Resend-Synchronisierung.
- Bestätigung liefert `contact_synced` und `welcome_sent`. Bei `false` Logs prüfen
  und Kontaktsynchronisierung bzw. Willkommensmail gezielt nachholen. Der bereits
  gewährte Rabatt bleibt erhalten; es gibt keinen Hintergrund-Reparaturjob.
- Live prüfen: Anmeldung, Bestätigung, Rabatt, Abmeldung, signierter Webhook und
  Kontolöschung. Die automatisierten Tests verwenden ausschließlich Mock-Aufrufe.

API-Grundlagen:
- https://resend.com/docs/api-reference/emails/send-email
- https://resend.com/docs/api-reference/contacts/create-contact
- https://resend.com/docs/api-reference/contacts/update-contact
- https://resend.com/docs/webhooks/verify-webhooks-requests
