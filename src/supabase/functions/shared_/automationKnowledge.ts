// supabase/functions/_shared/automationKnowledge.ts
//
// Wissensblock "Automatisierung & Software" für den KI-Produktberater
// (Edge Function product-advisor). Wird in den System-Prompt eingefügt,
// sobald die Function angepasst ist. Quelle der Inhalte:
// src/pages/b2b/automationContent.ts (Website-Seite #/business/automatisierung).

export const AUTOMATION_KNOWLEDGE = `
## DYD Automatisierung & individuelle Software (B2B, eigenes Angebot)
Abgrenzung: Die DYD Skill-Plattform (NEXUS für Unternehmen, ORBIT für Bildungsträger) ist ein fertiges Produkt rund um Skills und Weiterbildung. "Automatisierung & Software" ist individuelle Entwicklung für die EIGENEN Abläufe eines Unternehmens – unabhängig von Branche und Thema.

Was DYD baut: Web-Apps, KI-Assistenten, Automatisierungen, interne Tools, Dashboards, Schnittstellen.
Grundsätze: KI bereitet vor, der Mensch gibt frei (nichts geht ungeprüft nach außen) · klein starten mit einem klar abgegrenzten Baustein · alles nachvollziehbar protokolliert.
Ablauf: 1) kostenloser Prozess-Check (ca. 30 Min.) 2) Angebot mit festem Preis für den ersten Baustein 3) früh eine klickbare Version testen 4) Übergabe mit Einführung und Dokumentation, Weiterentwicklung optional.
Preise: individuell, immer fester Preis nach dem Prozess-Check, keine offene Stundenabrechnung. Nenne KEINE konkreten Beträge.

Referenzprojekte (neutral beschreiben, keine Namen von Kunden oder Projekten nennen):
- Vertriebs-CRM mit KI-Berater: Tagesbriefing werktags, Wochenreview, Notizen → Zusammenfassung + To-Dos, Lead-Finder mit Fit-Score, Antwort-Assistent, Termin-Briefings; Versand nur nach Freigabe.
- Podcast-Produktionsstudio: Episoden-Workflow, KI-Textentwürfe für alle Kanäle (Shownotes, Beschreibungen, Social Posts) mit Freigabe pro Text, Brainstorming, Veröffentlichungskalender.
- KI-Produktberater (Website-Chatbot): empfiehlt passende Angebote mit Produktkarten, kennt die aktuelle Seite, Testbetrieb mit Vergleichsgruppe.
- Ticketsystem für ein Festival: Bundle/Einzeltickets, Online-Zahlung, automatisches PDF-Ticket, Tickets im Kundenkonto.
- Live-Turnierverwaltung: Teams aus Ticketkäufen, Gruppen/Spielplan per Klick, Tischverteilung, Timer, automatische K.-o.-Runde, Live-Tableau.
- Regelbasierter Trading-Assistent: feste Regeln, Risikowächter, Kill-Switch, Echtgeld erst nach Demo-Phase (technische Referenz, keine Anlageberatung).

Nächster Schritt für Interessenten: kostenloser Prozess-Check auf /business/automatisierung (Abschnitt "Prozess-Check"), alternativ Termin buchen.
Bei Fragen, die du nicht sicher beantworten kannst: Kontakt anbieten statt raten.
`.trim();
