// src/pages/b2b/automationContent.ts
//
// Inhalte für den B2B-Tab "Automatisierung" (NEU, 16.10.2026).
// Bewusst als eigene Datei neben content.ts, damit Texte zentral pflegbar
// bleiben, ohne die große content.ts weiter aufzublähen.
//
// WICHTIG – Referenzen: Die drei Projekte werden NEUTRAL beschrieben (keine
// Projekt-, Firmen- oder Personennamen, keine echten Zahlen). Die Bilder
// sind nachgebaute Ansichten mit erfundenen Beispieldaten (AutomationMockups.tsx),
// KEINE Screenshots der echten Apps.

export const automationContent = {
  tab: {
    label: 'Automatisierung & Software',
    short: 'Automatisierung',
  },

  intro: {
    eyebrow: 'Automatisierung & individuelle Software',
    headline: 'Weniger Handarbeit. Mehr Zeit für das, was zählt.',
    subline:
      'Wir bauen schlanke Web-Apps, Workflows und KI-Assistenten, die wiederkehrende Aufgaben übernehmen – passgenau für Ihre Abläufe statt Standard-Software von der Stange.',
    chips: ['Workflows', 'KI-Assistenten', 'Interne Tools', 'Dashboards', 'Schnittstellen'],
  },

  /** In-Page-Navigation des Tabs – hilft, sich im Bereich zurechtzufinden. */
  subnav: [
    { id: 'auto-leistungen', label: 'Leistungen' },
    { id: 'auto-referenzen', label: 'Referenzen' },
    { id: 'auto-ablauf', label: 'Ablauf' },
    { id: 'auto-faq', label: 'Fragen' },
  ],

  services: {
    title: 'Was wir für Sie automatisieren',
    subtitle: 'Typische Aufgaben, die heute Zeit kosten – und morgen im Hintergrund laufen.',
    items: [
      { icon: 'workflow', title: 'Wiederkehrende Abläufe', desc: 'Daten übertragen, Status setzen, Erinnerungen verschicken – automatisch und nachvollziehbar.' },
      { icon: 'bot', title: 'KI-Assistenten', desc: 'Texte vorbereiten, Inhalte prüfen, Informationen zusammenfassen – mit Freigabe durch Ihr Team.' },
      { icon: 'crm', title: 'Vertrieb & CRM', desc: 'Leads, Follow-ups und Pipeline an einem Ort – mit klarer Tagesansicht statt Excel-Listen.' },
      { icon: 'dashboard', title: 'Dashboards & Reporting', desc: 'Die wichtigsten Kennzahlen live auf einen Blick, statt Berichte von Hand zu bauen.' },
      { icon: 'plug', title: 'Schnittstellen', desc: 'Bestehende Tools sinnvoll verbinden – per API, Webhook oder Automatisierungsplattform.' },
      { icon: 'app', title: 'Individuelle Web-Apps', desc: 'Interne Tools, die genau zu Ihrem Prozess passen – im Browser und auf dem Handy nutzbar.' },
    ],
  },

  references: {
    title: 'Referenzen aus der Praxis',
    subtitle: 'Fünf Projekte aus Medien, Vertrieb, Finanzen und Events – ein Prinzip: Routine automatisieren, Kontrolle behalten.',
    note: 'Nachgebaute Ansichten mit Beispieldaten – aus Datenschutzgründen ohne echte Inhalte.',
    /** Hinweis für Projekte mit echtem Event-Motiv (Plakat/Flyer) */
    noteWithPoster: 'Links: originales Event-Motiv. Rechts: nachgebaute Ansicht mit Beispieldaten.',
    projects: [
      {
        id: 'podcast',
        tab: 'Content',
        icon: 'mic',
        category: 'Medien & Content',
        title: 'Produktions-Studio für einen Karriere-Podcast',
        summary:
          'Ein zentrales Studio, in dem ein Podcast-Team Episoden vorbereitet, Inhalte prüft und Veröffentlichungen plant.',
        before: [
          'Themen, Gästefragen und Notizen verteilt auf mehrere Tools',
          'Freigaben per Nachricht – der aktuelle Stand war oft unklar',
          'Veröffentlichungen mussten einzeln und von Hand geplant werden',
        ],
        solution: [
          'Episoden-Board von der Idee bis zur Veröffentlichung',
          'KI-gestützte Vorbereitung: Leitfaden, Fragen und Shownotes als Entwurf',
          'Prüfschritt mit Checkliste, bevor etwas live geht',
          'Redaktionskalender für alle geplanten Veröffentlichungen',
          'Geschützter Team-Zugang',
        ],
        outcomes: [
          'Ein Ort für den gesamten Produktionsprozess',
          'Klarer Status jeder Episode für das ganze Team',
          'Vorbereitung startet mit einem Entwurf statt mit einem leeren Blatt',
        ],
        stack: ['Web-App', 'KI-Textassistent', 'Datenbank & Login', 'Redaktionsplanung'],
      },
      {
        id: 'crm',
        tab: 'CRM',
        icon: 'crm',
        category: 'Vertrieb',
        title: 'Schlankes Vertriebs-CRM mit Tagesfokus',
        summary:
          'Ein maßgeschneidertes CRM, das jeden Morgen zeigt, was heute zu tun ist – für mehrere Produkte und Leistungen gleichzeitig.',
        before: [
          'Kontakte und Gesprächsnotizen in Listen und Postfächern',
          'Follow-ups gingen im Tagesgeschäft unter',
          'Kein Überblick, in welcher Phase welcher Kontakt steht',
        ],
        solution: [
          '„Heute“-Ansicht mit fälligen Aufgaben und Follow-ups',
          'Pipeline nach Phasen – per Klick weiterschieben',
          'Kontakte nach Produkt bzw. Leistung getrennt',
          'Anmeldung per Magic Link – ohne Passwort-Chaos',
          'Als App auf dem Handy nutzbar',
        ],
        outcomes: [
          'Kein Follow-up mehr vergessen',
          'Pipeline-Überblick in Sekunden statt Suchen in Listen',
          'Vertrieb auch unterwegs vom Handy aus',
        ],
        stack: ['Web-App (mobil)', 'Datenbank & Magic-Link-Login', 'Automatische Erinnerungen'],
      },
      {
        id: 'trading',
        tab: 'Trading',
        icon: 'chart',
        category: 'Finanzen',
        title: 'Regelbasierte Trading-Automatisierung',
        summary:
          'Eine App, die festgelegte Investment-Regeln automatisch ausführt – mit klaren Grenzen, Freigaben und vollständigem Protokoll.',
        before: [
          'Marktbeobachtung und Ausführung kosteten täglich Zeit',
          'Regeln wurden im Alltag nicht konsequent eingehalten',
          'Kaum Übersicht über Entscheidungen und deren Gründe',
        ],
        solution: [
          'Strategien als feste Regeln definieren',
          'Risiko-Grenzen, die automatisch greifen',
          'Freigabe-Modus: Vorschläge erst nach Bestätigung ausführen',
          'Lückenloses Protokoll jeder Aktion',
          'Übersichtliches Dashboard mit Status auf einen Blick',
        ],
        outcomes: [
          '„Automatisch investieren. Volle Kontrolle.“ – Regeln statt Bauchgefühl',
          'Weniger Zeit vor dem Bildschirm',
          'Jede Entscheidung ist nachvollziehbar dokumentiert',
        ],
        stack: ['Web-App', 'Regel-Engine', 'Broker-Schnittstelle', 'Protokollierung'],
        disclaimer: 'Technische Referenz – keine Anlageberatung.',
      },
      {
        id: 'tickets',
        tab: 'Tickets',
        icon: 'ticket',
        category: 'Events',
        poster: true,
        title: 'Ticketsystem für ein Musik- & Comedy-Festival',
        summary:
          'Ein eigener Ticketshop für ein eintägiges Festival: Programmpunkte einzeln oder als Bundle buchen, online bezahlen, Ticket sofort als PDF erhalten.',
        before: [
          'Ticketplattformen mit hohen Gebühren und wenig Gestaltungsspielraum',
          'Einzelne Programmpunkte ließen sich nicht flexibel kombinieren',
          'Teilnehmerlisten mussten von Hand zusammengeführt werden',
        ],
        solution: [
          'Ticketauswahl mit Einzel-Tickets und günstigerem Bundle',
          'Sichere Online-Zahlung direkt im Shop',
          'Ticket wird automatisch als PDF erzeugt und zugestellt',
          'Alle Tickets gesammelt im eigenen Konto abrufbar',
          'Passende Zusatzangebote direkt beim Kauf (z. B. Merch)',
        ],
        outcomes: [
          'Volle Kontrolle über Gestaltung, Preise und Daten',
          'Kein manuelles Versenden von Tickets mehr',
          'Startplätze fürs Turnier landen automatisch in der Turnierverwaltung',
        ],
        stack: ['Web-App', 'Online-Zahlung', 'PDF-Erstellung', 'Datenbank & Login'],
      },
      {
        id: 'tournament',
        tab: 'Turnier',
        icon: 'trophy',
        category: 'Events',
        poster: true,
        title: 'Live-Turnierverwaltung für ein Bierpong-Turnier',
        summary:
          'Vom Ticket bis zum Finale: Teams, Gruppen, Tische und Spielzeiten werden automatisch geplant – das Publikum verfolgt alles live.',
        before: [
          'Spielpläne auf Papier, Ergebnisse auf Zuruf',
          'Wartezeiten, weil Tische nicht gleichmäßig belegt waren',
          'Niemand wusste, wer wann gegen wen spielt',
        ],
        solution: [
          'Teams werden direkt aus den Ticketkäufen übernommen',
          'Gruppen auslosen und Spielplan per Klick erzeugen',
          'Spielwellen automatisch auf freie Tische verteilen',
          'Rundentimer, Ergebnis-Eingabe und automatische K.-o.-Runde',
          'Live-Board für alle Gäste – aktualisiert sich in Echtzeit',
        ],
        outcomes: [
          'Turnierleitung steuert alles vom Handy aus',
          'Keine Zettelwirtschaft und keine Rechenfehler bei Tabellen',
          'Gäste sehen jederzeit, wann sie dran sind',
        ],
        stack: ['Web-App (mobil)', 'Echtzeit-Datenbank', 'Spielplan-Logik', 'Live-Board'],
      },
    ],
  },

  process: {
    title: 'So arbeiten wir zusammen',
    steps: [
      { title: 'Erstgespräch', desc: 'Kostenlos: Wir verstehen Ihren Ablauf und wo heute Zeit verloren geht.', icon: 'search' },
      { title: 'Konzept & Angebot', desc: 'Klarer Umfang, fester Preis, ein erster sinnvoller Schritt.', icon: 'target' },
      { title: 'Prototyp', desc: 'Sie testen früh eine klickbare Version und geben Feedback.', icon: 'rocket' },
      { title: 'Übergabe & Betreuung', desc: 'Einführung, Dokumentation und auf Wunsch laufende Weiterentwicklung.', icon: 'growth' },
    ],
  },

  principles: {
    title: 'Worauf Sie sich verlassen können',
    items: [
      { title: 'Sie behalten die Kontrolle', desc: 'Wichtige Schritte laufen mit Freigabe – Automatisierung ersetzt keine Entscheidung.' },
      { title: 'Klein starten, schnell nutzen', desc: 'Lieber ein Ablauf, der in kurzer Zeit wirkt, als ein Großprojekt über Monate.' },
      { title: 'Nachvollziehbar & dokumentiert', desc: 'Sie wissen jederzeit, was automatisch passiert und warum.' },
    ],
  },

  faq: [
    { q: 'Was kostet ein Automatisierungs-Projekt?', a: 'Das hängt vom Umfang ab. Nach dem kostenlosen Erstgespräch erhalten Sie ein Angebot mit festem Preis für einen klar abgegrenzten ersten Schritt – ohne versteckte Folgekosten.', cta: true, ctaLabel: 'Erstgespräch anfragen' },
    { q: 'Wie schnell sehen wir ein erstes Ergebnis?', a: 'Wir starten bewusst mit einem kleinen, klar abgegrenzten Baustein. So können Sie früh eine klickbare Version testen, statt lange auf ein fertiges Gesamtsystem zu warten.' },
    { q: 'Müssen wir unsere bestehenden Tools ersetzen?', a: 'Nein. Oft ist es am sinnvollsten, vorhandene Tools zu verbinden und nur die Lücken mit einer eigenen Lösung zu schließen.' },
    { q: 'Wie gehen Sie mit unseren Daten um?', a: 'Wir arbeiten nur mit den Daten, die für den jeweiligen Ablauf nötig sind, und klären Zugriffe, Speicherorte und Verantwortlichkeiten gemeinsam mit Ihnen vor dem Start.' },
    { q: 'Was passiert nach der Übergabe?', a: 'Sie erhalten eine Einführung und eine Dokumentation. Auf Wunsch betreuen und erweitern wir die Lösung weiter – Sie sind aber nicht daran gebunden.' },
  ],

  cta: {
    title: 'Welcher Ablauf kostet Sie heute am meisten Zeit?',
    subtitle: 'Erzählen Sie uns davon – im Erstgespräch zeigen wir, was sich davon automatisieren lässt.',
    button: 'Erstgespräch vereinbaren',
  },
} as const;
