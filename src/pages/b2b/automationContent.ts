// src/pages/b2b/automationContent.ts
//
// Inhalte der eigenen Landingpage "Automatisierung & Software"
// (#/business/automatisierung, NEU 16.10.2026).
//
// Referenzen: Funktionen 1:1 aus dem echten Code der Projekte abgeleitet.
// Bilder unter /public/b2b/refs/ sind ECHTE Screenshots der Anwendungen –
// lokal gestartet mit erfundenen Beispieldaten (keine Kunden-, Konto- oder
// Personendaten, Namen/Logos neutralisiert). Projektnamen bewusst neutral.

export type RefShot = { src: string; alt: string; caption: string; device: 'desktop' | 'mobile' | 'document' };
export type Reference = {
  id: string;
  short: string;
  category: string;
  icon: 'mic' | 'crm' | 'chart' | 'ticket' | 'trophy' | 'bot' | 'calendar';
  title: string;
  pitch: string;
  shots: RefShot[];
  automations: string[];
  ai: string[];
  control: string;
  stack: string[];
  disclaimer?: string;
  /** true = Beispielansicht/Konzept, KEIN Screenshot einer laufenden App */
  concept?: boolean;
};

export const automationContent = {
  meta: {
    title: 'Automatisierung & individuelle Software | DYD',
  },

  hero: {
    eyebrow: 'DYD Automatisierung & Software',
    headline: ['Software, die', 'mitarbeitet.'],
    subline:
      'Wir bauen Web-Apps, KI-Assistenten und Automatisierungen, die Routinearbeit übernehmen – und Ihnen trotzdem die Kontrolle lassen. Keine Folien, sondern Systeme, die täglich laufen.',
    ctaPrimary: 'Kostenlosen Prozess-Check starten',
    ctaSecondary: 'Live-Projekte ansehen',
    proof: [
      { value: '7', label: 'selbst entwickelte Systeme' },
      { value: 'KI + Freigabe', label: 'nichts geht ungeprüft nach außen' },
      { value: 'Fester Preis', label: 'für den ersten Baustein' },
    ],
  },

  /** Interaktive Einstiegsfrage: Wo verlieren Sie Zeit? → passende Referenz */
  finder: {
    title: 'Wo verlieren Sie heute die meiste Zeit?',
    subtitle: 'Wählen Sie einen Bereich – wir zeigen Ihnen ein echtes System, das genau das löst.',
    options: [
      { id: 'vertrieb', label: 'Vertrieb & Kundenkontakt', ref: 'crm', checkArea: 'Vertrieb & Kundenkontakt', pain: 'Follow-ups vergessen, Antworten formulieren, Überblick behalten.' },
      { id: 'content', label: 'Content & Redaktion', ref: 'podcast', checkArea: 'Content & Redaktion', pain: 'Texte für jeden Kanal, Freigaben, Veröffentlichungsplanung.' },
      { id: 'events', label: 'Events & Tickets', ref: 'tickets', checkArea: 'Events & Tickets', pain: 'Ticketverkauf, Teilnehmerlisten, Abläufe vor Ort.' },
      { id: 'service', label: 'Anfragen & Beratung', ref: 'chatbot', checkArea: 'Anfragen & Beratung', pain: 'Immer gleiche Fragen beantworten, passende Angebote empfehlen.' },
      { id: 'daten', label: 'Daten & Entscheidungen', ref: 'trading', checkArea: 'Daten & Reporting', pain: 'Regeln konsequent anwenden, Risiken überwachen, alles dokumentieren.' },
      { id: 'appidee', label: 'Eigene App-Idee', ref: 'buchung', checkArea: 'Etwas anderes', pain: 'Eine klare Idee für eine App – aber kein Team, das sie entwirft, baut und betreibt.' },
      { id: 'ablauf', label: 'Abläufe vor Ort', ref: 'turnier', checkArea: 'Events & Tickets', pain: 'Pläne auf Papier, Ergebnisse auf Zuruf, Wartezeiten.' },
    ],
  },

  references: {
    eyebrow: 'Live-Projekte',
    title: 'Echte Systeme. Echte Oberflächen.',
    subtitle: 'Screenshots der laufenden Anwendungen – gezeigt mit Beispieldaten, damit keine echten Kunden- oder Kontodaten sichtbar sind.',
    items: [
      {
        id: 'crm',
        short: 'Vertriebs-CRM',
        category: 'Vertrieb',
        icon: 'crm',
        title: 'Vertriebs-CRM mit KI-Berater',
        pitch: 'Jeden Morgen ein fertiges Tagesbriefing: Was ist heute wichtig, wen anrufen, was droht liegen zu bleiben. Die KI schreibt mit – verschickt wird erst nach Freigabe.',
        shots: [
          { src: '/b2b/refs/crm-cockpit.webp', alt: 'Cockpit des Vertriebs-CRM mit KI-Tagesbriefing', caption: 'Cockpit: KI-Briefing mit den 3 wichtigsten Schritten des Tages', device: 'desktop' },
          { src: '/b2b/refs/crm-freigabe.webp', alt: 'Freigabe-Postfach mit KI-Entwurf einer Follow-up-Mail', caption: 'Freigabe: KI-Entwurf prüfen, anpassen, mit einem Klick senden', device: 'desktop' },
          { src: '/b2b/refs/crm-unternehmen.webp', alt: 'Unternehmensliste mit Score und nächstem Schritt', caption: 'Pipeline mit Score, Phase und fälligem nächsten Schritt', device: 'desktop' },
        ],
        automations: [
          'Tagesbriefing werktags automatisch, Wochenreview freitags',
          'Gesprächsnotizen → Zusammenfassung + To-Dos mit Fälligkeit',
          'Lead-Finder recherchiert passende Unternehmen inkl. Fit-Score',
          'Fällige Follow-ups werden erkannt und als Entwurf vorbereitet',
        ],
        ai: ['Antwort-Assistent: erkennt Interesse, Einwand oder „später“ und schlägt die Antwort vor', 'Termin-Briefing mit Bedarfsfragen und Einwandbehandlung', 'Aufholplan, wenn ein Monatsziel wackelt'],
        control: 'Nach außen geht nichts ohne Freigabe.',
        stack: ['Web-App & Handy-App', 'KI-Berater', 'E-Mail-Versand', 'Push-Erinnerungen'],
      },
      {
        id: 'podcast',
        short: 'Podcast-Studio',
        category: 'Content & Redaktion',
        icon: 'mic',
        title: 'Produktions-Studio für einen Podcast',
        pitch: 'Vom ersten Gedanken bis zur Veröffentlichung an einem Ort: Episoden-Workflow, KI-Textentwürfe für alle Kanäle und eine klare Freigabe pro Text.',
        shots: [
          { src: '/b2b/refs/podcast-start.webp', alt: 'Startseite des Podcast-Studios mit Fokus-Aufgaben und aktueller Folge', caption: 'Start: Fokus des Tages, aktuelle Folge, Veröffentlichungskalender', device: 'desktop' },
          { src: '/b2b/refs/podcast-texte.webp', alt: 'Textprüfung einer Episode mit sieben KI-Entwürfen', caption: 'Texte prüfen: 7 KI-Entwürfe – Shownotes, Beschreibungen, Social Posts', device: 'desktop' },
        ],
        automations: [
          'Produktionsaufgaben entstehen automatisch aus dem Episodenstand',
          'Aufgaben nach Veröffentlichungstermin priorisiert',
          'Veröffentlichungskalender mit allen geplanten Folgen',
          'Leistungsdaten der Plattformen an einem Ort',
        ],
        ai: ['Aus dem Transkript: Shownotes, Beschreibungen, YouTube- und LinkedIn-Texte', 'Brainstorming-Partner für neue Folgen', 'Gast-Briefing zur Vorbereitung'],
        control: 'Jeder Text wird einzeln geprüft und freigegeben.',
        stack: ['Web-App', 'KI-Textassistent', 'Kalender', 'Team-Login'],
      },
      {
        id: 'chatbot',
        short: 'KI-Chatbot',
        category: 'Beratung & Vertrieb',
        icon: 'bot',
        title: 'KI-Produktberater für eine Website',
        pitch: 'Ein Chatbot, der nicht nur Fragen beantwortet, sondern das passende Angebot empfiehlt – mit Preis, Inhalten und direktem Weg zum Kauf.',
        shots: [
          { src: '/b2b/refs/chatbot-mobil.webp', alt: 'KI-Berater im Chat mit Produktempfehlung', caption: 'Empfehlung mit Produktkarte, Preis und nächstem Schritt', device: 'mobile' },
          { src: '/b2b/refs/chatbot-desktop.webp', alt: 'KI-Berater als Fenster auf der Website', caption: 'Auf jeder Seite verfügbar – mit passenden Einstiegsfragen', device: 'desktop' },
        ],
        automations: [
          'Kennt die Seite, auf der der Besucher gerade ist',
          'Produktkarten mit Preis, Inhalten und Direkt-Link',
          '„Passt nicht“ wird gemerkt, keine Wiederholung',
          'Testbetrieb mit Vergleichsgruppe und Auswertung',
        ],
        ai: ['Versteht freie Fragen statt starrer Klickpfade', 'Bietet Kontakt an, wenn eine Frage offen bleibt'],
        control: 'Schlüssel nur auf dem Server, Gespräche werden nicht gespeichert.',
        stack: ['Website-Widget', 'KI-Schnittstelle', 'Analytics'],
      },
      {
        id: 'tickets',
        short: 'Ticketsystem',
        category: 'Events',
        icon: 'ticket',
        title: 'Ticketsystem für ein Festival',
        pitch: 'Eigener Ticketshop statt teurer Plattform: Programmpunkte einzeln oder als Bundle buchen, online bezahlen – das PDF-Ticket entsteht automatisch.',
        shots: [
          { src: '/b2b/refs/tickets-shop.webp', alt: 'Ticketauswahl mit Bundle-Angebot', caption: 'Ticketauswahl: Bundle, Einzeltickets, Freigetränk inklusive', device: 'desktop' },
          { src: '/b2b/refs/ticket-pdf.webp', alt: 'Automatisch erzeugtes PDF-Ticket mit Beispieldaten', caption: 'Automatisch erzeugtes PDF-Ticket – inkl. Programm und Turnier-Team', device: 'document' },
        ],
        automations: [
          'Sichere Online-Zahlung direkt im Shop',
          'PDF-Ticket mit Programm, Einlass und Ticketnummer',
          'Tickets im Kundenkonto jederzeit abrufbar',
          'Turnier-Startplätze landen direkt in der Turnierverwaltung',
        ],
        ai: [],
        control: 'Volle Kontrolle über Preise, Gestaltung und Daten.',
        stack: ['Web-App', 'Online-Zahlung', 'PDF-Erstellung', 'Kundenkonto'],
      },
      {
        id: 'turnier',
        short: 'Live-Turnier',
        category: 'Events vor Ort',
        icon: 'trophy',
        title: 'Live-Turnierverwaltung',
        pitch: 'Gruppen auslosen, Tische belegen, Zeit stoppen, Ergebnisse eintragen – die Turnierleitung steuert alles vom Handy, die Gäste sehen alles live.',
        shots: [
          { src: '/b2b/refs/turnier-tableau.webp', alt: 'Live-Tableau mit Rundentimer und Tischbelegung', caption: 'Live-Tableau für Gäste: Timer, Tische, Tabellen in Echtzeit', device: 'desktop' },
          { src: '/b2b/refs/turnier-cockpit.webp', alt: 'Turnier-Cockpit der Turnierleitung', caption: 'Turnier-Cockpit: Teams, Spielwellen, Ergebnis-Eingabe', device: 'desktop' },
        ],
        automations: [
          'Teams werden aus den Ticketkäufen übernommen',
          'Gruppen und Spielplan per Klick',
          'Spielwellen automatisch auf freie Tische verteilt',
          'K.-o.-Runde entsteht automatisch aus den Tabellen',
        ],
        ai: [],
        control: 'Korrekturen jederzeit möglich, jede Partie nachvollziehbar.',
        stack: ['Web-App (mobil)', 'Echtzeit-Datenbank', 'Live-Anzeige'],
      },
      {
        id: 'trading',
        short: 'Trading-Bot',
        category: 'Finanzen & Daten',
        icon: 'chart',
        title: 'Regelbasierter Trading-Assistent',
        pitch: 'Feste Regeln statt Bauchgefühl: Der Assistent handelt nach Trend und Momentum, ein Risikowächter prüft stündlich – Echtgeld erst nach bestandener Demo-Phase.',
        shots: [
          { src: '/b2b/refs/trading-depot.webp', alt: 'Depotansicht im Demo-Modus', caption: 'Depot im Demo-Modus mit Verlauf und Aufteilung', device: 'mobile' },
          { src: '/b2b/refs/trading-bot.webp', alt: 'Steuerung des Bots mit Kill-Switch', caption: 'Steuerung: pausieren, ausführen, Kill-Switch', device: 'mobile' },
          { src: '/b2b/refs/trading-aktivitaet.webp', alt: 'Aktivitätsprotokoll mit Begründung je Order', caption: 'Protokoll: jede Order mit Begründung', device: 'mobile' },
        ],
        automations: [
          'Läuft werktags serverseitig nach festem Zeitplan',
          'Risikowächter prüft stündlich, Stop-Loss beim Broker',
          'Echtgeld nur nach Demo-Phase und mit Budget-Deckel',
          'Rückblick-Test der Strategie vor dem Einsatz',
        ],
        ai: [],
        control: 'Kill-Switch schließt mit einem Klick alle Positionen.',
        stack: ['Handy-App', 'Regel-Engine', 'Broker-Schnittstelle', 'Protokollierung'],
        disclaimer: 'Technische Referenz – keine Anlageberatung.',
      },
      {
        id: 'buchung',
        short: 'Terminbuchung',
        category: 'Kunden & Termine',
        icon: 'calendar',
        title: 'Online-Terminbuchung mit Erinnerungen',
        pitch: 'Kunden wählen selbst einen freien Termin, bekommen Bestätigung und automatische Erinnerung – und Sie hören auf, per E-Mail-Ping-Pong Termine zu finden. Beispiel aus der typischen Erstversion einer eigenen App.',
        shots: [
          { src: '/b2b/refs/buchung-kalender.webp', alt: 'Kalenderansicht einer Online-Terminbuchung mit freien Zeiten', caption: 'Kalender: freie Zeiten und Dienstleistung in einem Schritt wählen', device: 'mobile' },
          { src: '/b2b/refs/buchung-bestaetigung.webp', alt: 'Terminbestätigung mit Erinnerungen', caption: 'Bestätigung: Termin, Video-Meeting-Link, automatische Erinnerung', device: 'mobile' },
        ],
        automations: [
          'Kunden buchen selbst – ohne E-Mail-Hin und her',
          'Bestätigung und Erinnerung gehen automatisch raus',
          'Doppelbuchungen sind technisch ausgeschlossen',
          'Termine landen direkt im Kalender des Teams',
        ],
        ai: ['Schlägt passende Alternativzeiten vor, wenn ein Termin platzt'],
        control: 'Öffnungs-, Puffer- und Stornierungszeiten bestimmen Sie selbst.',
        stack: ['Handy-App', 'Online-Zahlung (optional)', 'E-Mail & Push', 'Kalender-Sync'],
        disclaimer: 'Beispielansicht – zeigt den typischen ersten Baustein einer eigenen App.',
      },
    ] as Reference[],
  },

  approach: {
    eyebrow: 'So arbeiten wir',
    title: 'Vom Problem zum laufenden System',
    steps: [
      { title: 'Prozess-Check', desc: 'Kostenlos, 30 Minuten: Wo geht Zeit verloren, was lässt sich sinnvoll automatisieren?', icon: 'search' },
      { title: 'Fester Preis', desc: 'Ein klar abgegrenzter erster Baustein mit festem Preis – keine offene Stundenabrechnung.', icon: 'target' },
      { title: 'Früh testen', desc: 'Sie klicken früh eine echte Version durch und geben Feedback, bevor alles fertig ist.', icon: 'rocket' },
      { title: 'Laufen lassen', desc: 'Übergabe mit Einführung und Dokumentation. Weiterentwicklung auf Wunsch.', icon: 'growth' },
    ],
  },

  principles: [
    { title: 'Mensch entscheidet', desc: 'KI bereitet vor, Sie geben frei. Wichtige Schritte laufen nie unbemerkt.' },
    { title: 'Klein starten', desc: 'Ein Ablauf, der schnell wirkt – statt eines Großprojekts über Monate.' },
    { title: 'Nachvollziehbar', desc: 'Protokolle und Begründungen zeigen jederzeit, was automatisch passiert ist.' },
  ],

  check: {
    eyebrow: 'Kostenloser Prozess-Check',
    title: 'In 3 Klicks zum Erstgespräch',
    subtitle: 'Beantworten Sie drei kurze Fragen – wir melden uns mit einer ersten Einschätzung.',
    areas: ['Vertrieb & Kundenkontakt', 'Content & Redaktion', 'Events & Tickets', 'Anfragen & Beratung', 'Daten & Reporting', 'Etwas anderes'],
    volumes: ['Ein paar Stunden pro Woche', 'Mehrere Stunden pro Tag', 'Ein ganzes Team ist damit beschäftigt'],
    timings: ['So schnell wie möglich', 'In den nächsten 3 Monaten', 'Ich informiere mich erst'],
    success: 'Danke! Wir melden uns innerhalb von 24 Stunden mit einer ersten Einschätzung.',
  },

  faq: [
    { q: 'Was kostet ein Projekt?', a: 'Nach dem kostenlosen Prozess-Check bekommen Sie ein Angebot mit festem Preis für einen klar abgegrenzten ersten Baustein. Keine offene Stundenabrechnung, keine versteckten Folgekosten.' },
    { q: 'Wie schnell gibt es ein erstes Ergebnis?', a: 'Wir starten mit einem kleinen Baustein, den Sie früh als klickbare Version testen – statt monatelang auf ein Gesamtsystem zu warten.' },
    { q: 'Müssen wir unsere Tools ersetzen?', a: 'Nein. Oft ist es am sinnvollsten, vorhandene Tools zu verbinden und nur die Lücken mit einer eigenen Lösung zu schließen.' },
    { q: 'Was passiert mit unseren Daten?', a: 'Wir nutzen nur die Daten, die der Ablauf braucht, und klären Zugriffe, Speicherorte und Verantwortlichkeiten vor dem Start gemeinsam mit Ihnen.' },
    { q: 'Wie verlässlich ist die KI?', a: 'KI bereitet vor – Menschen entscheiden. In allen unseren Systemen gehen wichtige Schritte erst nach Freigabe raus, und jede Aktion ist protokolliert.' },
    { q: 'Was ist der Unterschied zur DYD Skill-Plattform?', a: 'Die Skill-Plattform (NEXUS/ORBIT) ist ein fertiges Produkt für HR, L&D und Bildungsträger. Automatisierung & Software ist individuelle Entwicklung für Ihre eigenen Abläufe – unabhängig von Branche und Thema.' },
  ],

  cta: {
    title: 'Welcher Ablauf soll als Erstes laufen?',
    subtitle: 'Im kostenlosen Prozess-Check finden wir den Baustein mit der größten Wirkung.',
    button: 'Prozess-Check starten',
  },

  /** Teaser auf der Skill-Plattform-Seite (Abgrenzung + Verweis) */
  teaser: {
    eyebrow: 'Außerdem von DYD',
    title: 'Automatisierung & individuelle Software',
    text: 'Unabhängig von Skills und Weiterbildung: Wir bauen Web-Apps, KI-Assistenten und Automatisierungen für Ihre eigenen Abläufe.',
    button: 'Live-Projekte ansehen',
  },
} as const;
