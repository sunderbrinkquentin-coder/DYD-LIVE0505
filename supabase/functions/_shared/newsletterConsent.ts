// supabase/functions/_shared/newsletterConsent.ts
//
// Einwilligungstexte für den Newsletter – versioniert. Gespeichert wird beim
// Abo IMMER der Text der Version, die der Nutzer gesehen hat (Nachweis nach
// Art. 7 Abs. 1 DSGVO). Text ändern = neue Version anlegen, alte behalten.
// Muss wortgleich zu src/features/newsletter/consent.ts sein.

export const NEWSLETTER_CONSENT: Record<string, string> = {
  "2026-10-v1":
    "Ja, ich möchte den DYD-Newsletter per E-Mail erhalten: Karriere- und Bewerbungstipps, aktuelle Themen aus Arbeitsmarkt und KI sowie Angebote und Neuigkeiten von DYD – höchstens zweimal im Monat. " +
    "Als Dankeschön erhalte ich nach Bestätigung meiner E-Mail-Adresse einmalig 50 % Rabatt auf meine erste Buchung bei DYD (CV-Check, CV-Optimierungen, Anschreiben, Kurse und Lernpfade; ausgenommen Festival-Tickets und Business-Produkte), gültig 30 Tage. " +
    "Der Versand erfolgt über den Dienstleister Brevo (EU). Dabei wird ausgewertet, ob ich E-Mails öffne und welche Links ich anklicke, um die Inhalte zu verbessern. " +
    "Meine Einwilligung kann ich jederzeit über den Abmeldelink in jeder E-Mail widerrufen – der Rabatt bleibt mir trotzdem erhalten. Weitere Informationen in der Datenschutzerklärung.",
};

export const CURRENT_CONSENT_VERSION = "2026-10-v1";
