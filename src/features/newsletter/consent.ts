// src/features/newsletter/consent.ts
//
// Einwilligungstext für den Newsletter – MUSS wortgleich zu
// supabase/functions/_shared/newsletterConsent.ts sein. Der Server speichert
// beim Abo den Text zur übermittelten Version als Nachweis.
// Text ändern → neue Version in BEIDEN Dateien anlegen.

export const NEWSLETTER_CONSENT_VERSION = '2026-10-v2-resend';

export const NEWSLETTER_CONSENT_TEXT =
  'Ja, ich möchte den DYD-Newsletter per E-Mail erhalten: Karriere- und Bewerbungstipps, aktuelle Themen aus Arbeitsmarkt und KI sowie Angebote und Neuigkeiten von DYD – höchstens zweimal im Monat. ' +
  'Als Dankeschön erhalte ich nach Bestätigung meiner E-Mail-Adresse einmalig 50 % Rabatt auf meine erste Buchung bei DYD (CV-Check, CV-Optimierungen, Anschreiben, Kurse und Lernpfade; ausgenommen Festival-Tickets und Business-Produkte), gültig 30 Tage. ' +
  'Der Versand erfolgt über den Dienstleister Resend. Dabei wird ausgewertet, ob ich E-Mails öffne und welche Links ich anklicke, um die Inhalte zu verbessern. ' +
  'Meine Einwilligung kann ich jederzeit über den Abmeldelink in jeder E-Mail widerrufen – der Rabatt bleibt mir trotzdem erhalten. Weitere Informationen in der Datenschutzerklärung.';
