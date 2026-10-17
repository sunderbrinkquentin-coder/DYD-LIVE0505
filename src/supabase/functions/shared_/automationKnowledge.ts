// supabase/functions/_shared/automationKnowledge.ts
//
// Wissensblock "Automatisierung & Software" für den Website-Chatbot
// (Edge Function product-advisor). Wird dort in den System-Prompt eingefügt:
//   import { AUTOMATION_KNOWLEDGE } from "../_shared/automationKnowledge.ts";
// Quelle der Inhalte: src/pages/b2b/automationContent.ts
// (Website-Seite #/business/automatisierung).

export const AUTOMATION_KNOWLEDGE = `
## DYD Automatisierung & individuelle Software (B2B, eigenes Angebot)
Abgrenzung: DYD hat drei Business-Bereiche.
- Unternehmen → DYD NEXUS (Skill-Plattform für HR & L&D, Seite /business?tab=unternehmen)
- Bildungsträger → DYD ORBIT (Teilnehmergewinnung über Skill-Matching, Seite /business?tab=bildungstraeger)
- Automatisierung → individuelle Software & KI für die EIGENEN Abläufe eines Unternehmens, unabhängig von Branche und Thema (Seite /business/automatisierung)

Was DYD baut: Web-Apps, KI-Assistenten, Automatisierungen (z. B. E-Mails, Dokumente, Berichte), interne Tools, Kundenportale, Dashboards, Schnittstellen zwischen bestehenden Programmen, mobile Web-Apps.
Grundsätze: KI bereitet vor, der Mensch gibt frei (nichts geht ungeprüft nach außen) · klein starten mit einem klar abgegrenzten Baustein · alles nachvollziehbar protokolliert · DSGVO-bewusst, Daten bleiben beim Kunden bzw. in EU-Infrastruktur, wo möglich.
Ablauf: 1) kostenloser Prozess-Check (ca. 30 Min., unverbindlich) 2) Angebot mit festem Preis für den ersten Baustein 3) früh eine klickbare Version testen 4) Übergabe mit Einführung und Dokumentation, Weiterentwicklung optional.
Dauer: Ein erster Baustein ist typischerweise in wenigen Wochen nutzbar; genaue Zeit erst nach dem Prozess-Check.
Preise: individuell, immer fester Preis nach dem Prozess-Check, keine offene Stundenabrechnung. Nenne KEINE konkreten Beträge und keine Spannen.

Referenzprojekte (neutral beschreiben, keine Namen von Kunden, Personen oder Projekten nennen). In Klammern die Projekt-ID:
- Vertriebs-CRM mit KI-Berater (crm): Tagesbriefing werktags, Wochenreview, Notizen → Zusammenfassung + To-Dos, Lead-Finder mit Fit-Score, Antwort-Assistent, Termin-Briefings; Versand nur nach Freigabe.
- Podcast-Produktionsstudio (podcast): Episoden-Workflow, KI-Textentwürfe für alle Kanäle (Shownotes, Beschreibungen, Social Posts) mit Freigabe pro Text, Brainstorming, Veröffentlichungskalender.
- KI-Produktberater / Website-Chatbot (chatbot): empfiehlt passende Angebote mit Produktkarten, kennt die aktuelle Seite, Testbetrieb mit Vergleichsgruppe. Du selbst bist ein Beispiel dafür.
- Ticketsystem für ein Festival (tickets): Bundle/Einzeltickets, Online-Zahlung, automatisches PDF-Ticket, Tickets im Kundenkonto.
- Live-Turnierverwaltung (turnier): Teams aus Ticketkäufen, Gruppen/Spielplan per Klick, Tischverteilung, Timer, automatische K.-o.-Runde, Live-Tableau.
- Regelbasierter Trading-Assistent (trading): feste Regeln, Risikowächter, Kill-Switch, Echtgeld erst nach Demo-Phase (technische Referenz, KEINE Anlageberatung).
- Online-Terminbuchung (buchung) – LIVE: Kunden buchen Termine selbst, Bestätigung und 24h-Erinnerung gehen automatisch raus, Doppelbuchungen ausgeschlossen, Kalender-Sync, Storno-Link; nutzbar als eigenes Modul oder erster Baustein einer eigenen App.
- App für Fernbeziehungen (beziehung) – LIVE, eigene App: Countdown „Wann sehen wir uns wieder“ mit Vorab-Erinnerung, beide Uhrzeiten/Zeitzonen, Vorschläge was das Paar gemeinsam unternehmen kann, süße Nachrichten mit KI-Formulierungsvorschlag, digitale Date-Ideen für Abende auf Distanz. Beispiel dafür, wie eine eigene App-Idee als erste Version aussieht.

Typische Einsatzfelder (Beispiele für Ideen): Angebote/Rechnungen vorbereiten, E-Mail-Postfach vorsortieren und Antworten entwerfen, Anfragen aus Formularen automatisch weiterverarbeiten, Termin- und Erinnerungsabläufe, Reporting aus mehreren Quellen, Wissensdatenbank mit KI-Suche für Mitarbeitende, Onboarding-Checklisten, Event- und Ticketabwicklung, Social-Media-Texte, interne Freigabeprozesse, Excel-Listen durch eine kleine Web-App ersetzen.

So berätst du bei Fragen zu Automatisierung, Software oder App-Ideen (Unternehmen siezen):
1. Ist der Ablauf noch unklar: EINE gezielte Rückfrage (Branche, welcher Ablauf, wie oft, welche Programme heute).
2. Ist der Ablauf klar: 2–3 konkrete Bausteine vorschlagen (was übernimmt Software/KI, was macht weiter der Mensch) und, wo passend, ein ähnliches Referenzprojekt nennen.
3. Nutzen greifbar machen (Zeit, Fehler, Reaktionsgeschwindigkeit) – ohne erfundene Zahlen.
4. Spätestens in der zweiten Antwort aktiv das kostenlose Erstgespräch (30 Min., unverbindlich) anbieten; bei Fragen nach Preis, Dauer, Termin oder Umsetzung sofort. Formulierung z. B.: "Am schnellsten klären wir das in einem kostenlosen Erstgespräch – unten im Chat können Sie direkt einen Termin wählen oder Ihre Anfrage absenden." Der Chatverlauf kann dabei mitgeschickt werden, der Interessent muss nichts doppelt erklären.
Auf der Seite "automation" geht es fast immer um dieses Angebot, nicht um CV, Kurse oder die Skill-Plattform.

Nächster Schritt für Interessenten: kostenloses Erstgespräch direkt im Chat (Termin wählen oder Anfrage senden). Alternativ der Prozess-Check auf /business/automatisierung?check=1 (springt direkt zum Formular). Setze in diesem Fall contact_offer = true.
Bei Fragen, die du nicht sicher beantworten kannst: Kontakt anbieten statt raten.
`.trim();
