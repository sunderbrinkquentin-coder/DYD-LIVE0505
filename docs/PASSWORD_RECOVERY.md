# Passwort vergessen

## Im Code umgesetzt

- /login öffnet die Anmeldung statt standardmäßig die Registrierung.
- /login?mode=signup öffnet gezielt die Registrierung.
- /login?mode=reset öffnet direkt die Reset-Anfrage.
- Passwort-vergessen-Link im RegisterModal (Login-Modus) und Festival-Login.
- Reset-Anfrage verwendet supabase.auth.resetPasswordForEmail.
- Der Reset-Link führt zu /reset-password; dort Passwort zweimal eingeben.
- Speicherung mit supabase.auth.updateUser; danach zurück zur Anmeldung.
- Abgelaufene Links bieten einen neuen Link an. Fehler und späte Sitzungs-
  Wiederherstellung werden behandelt, Timer beim Verlassen entfernt.
- Die Bestätigung nach der Anforderung verrät nicht, ob ein Konto existiert.

## Supabase konfigurieren

Unter Auth / URL Configuration die tatsächliche Live-Domain als Site URL und
https://<live-domain>/reset-password als erlaubte Redirect URL eintragen.
Falls nötig die entsprechenden Entwicklungs-/Vorschau-Adressen ergänzen.
Die Reset-Password-Mailvorlage muss auf {{ .ConfirmationURL }} verlinken,
damit Supabase den Token prüfen und zur App zurückleiten kann.

Der vorhandene RESEND_API_KEY als Edge-Function-Secret konfiguriert nicht
automatisch den Mailversand von Supabase Auth. Für Passwort-Reset-Mails über
Resend unter Authentication / Email / SMTP Settings Custom SMTP aktivieren:

- Host: smtp.resend.com
- Port: 465
- Benutzername: resend
- Passwort: vorhandener Resend-API-Key mit Versandberechtigung
- Absender: eine Adresse auf der in Resend verifizierten Domain
- Absendername: DYD

Den API-Key ausschließlich in Supabase hinterlegen, niemals in VITE-Variablen
oder im Frontend. Im Code ist kein neuer Newsletterversand oder eigener
unsicherer Passwort-Token-Generator nötig: Supabase Auth verwaltet die Tokens.

## Prüfung

npm run test:password-recovery
npm run build

Sieben Tests mit simulierten Auth-Antworten erfolgreich. Vor Veröffentlichung
mit einem eigenen Testkonto Mailzustellung und tatsächlichen Linkdurchlauf
prüfen. Es wurde bei der Entwicklung keine echte Reset-Mail angefordert.

Quellen:
https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
https://supabase.com/docs/guides/auth/redirect-urls
https://resend.com/docs/send-with-supabase-smtp
