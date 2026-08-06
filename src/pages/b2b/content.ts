export const b2bContent = {
  header: {
    logoAlt: 'DYD – Decide Your Dream',
    applicantUrl: '/',
    toggleApplicant: 'Für Bewerber',
    toggleBusiness: 'Für Business',
    cta: 'Kontakt aufnehmen',
  },
  hero: {
    eyebrow: 'B2B & Partnerschaften',
    headline: 'Skill Intelligence für Unternehmen und Bildungsträger.',
    subline:
      'Die KI-gestützte Plattform von DYD übersetzt Erfahrung, Karriereziele und Kompetenzlücken in messbare Ergebnisse – nach EU-ESCO-Standard. Made in Germany, DSGVO-konform.',
    ctaPrimary: 'Für Unternehmen',
    ctaSecondary: 'Für Bildungsträger',
    trustChips: [
      'DSGVO-konform',
      'ESCO-Standard',
      'Kooperationspartner Hochschule Fresenius',
      'Made in Germany',
    ],
    statChips: [
      { value: '−75 %', label: 'CPA' },
      { value: '−60 %', label: 'Recruiting-Kosten' },
      { value: '+300 %', label: 'L&D-Effizienz' },
    ],
  },
  tabs: {
    tabA: {
      id: 'unternehmen',
      label: 'Unternehmen (HR & L&D)',
      intro:
        'Strategic Workforce Transformation: vorhandene Talente sichtbar machen, Skill-Gaps automatisiert aufdecken und Mitarbeitende gezielt für zukünftige Rollen entwickeln – statt teuer extern nachzubesetzen.',
      challenge: {
        title: 'Herausforderung',
        items: [
          'Keine Transparenz über vorhandene Skills im Unternehmen',
          'Teure externe Neubesetzungen statt interner Mobilität',
          'Standard-Schulungen nach Gießkannenprinzip ohne ROI',
        ],
      },
      solution: {
        title: 'Mit DYD Workforce',
        items: [
          'Echtzeit-Inventar aller Kompetenzen nach ESCO-Norm',
          'Automatisches Gap-Matching auf zukünftige Zielrollen',
          'Personalisierte Lernpfade statt Standardkatalog',
        ],
      },
      process: {
  title: 'Der Skill-Transformation-Prozess',
  steps: [
    { title: 'Skill-Mapping',   desc: 'Profile automatisch erfassen', icon: 'scan' },
    { title: 'Zielrollen-Match', desc: 'Zukunftsbedarf abgleichen',    icon: 'target' },
    { title: 'Gap-Analyse',     desc: 'Fehlbedarf ermitteln',         icon: 'gap' },
    { title: 'Lernpfad',        desc: 'Module zuweisen',              icon: 'route' },
    { title: 'Mobilität',       desc: 'Intern upskillen',             icon: 'growth' },
  ],
}, 
      modules: [
        {
          title: 'Internal Talent Marketplace',
          desc: 'Mitarbeitende entdecken interne Karrierechancen passend zum aktuellen Skill-Profil.',
          tag: 'Internal Mobility',
        },
        {
          title: 'HR Analytics Dashboard',
          desc: 'Strategische Skill-Matrix aller Abteilungen – Engpässe früh erkennen und steuern.',
          tag: 'Strategic Planning',
        },
        {
          title: 'LMS & HRIS Integration',
          desc: 'Nahtlose Anbindung an Workday, SAP SuccessFactors oder Moodle.',
          tag: 'Enterprise API',
        },
      ],
      roi: [
        {
          value: '−60 %',
          label: 'Recruiting-Kosten',
          desc: 'Interne Besetzung & gezieltes Reskilling statt externer Beschaffung (Fee ~15–30k €).',
        },
        {
          value: '+300 %',
          label: 'L&D-Effizienz',
          desc: 'Präzise Budget-Allokation nur auf tatsächliche Skill-Gaps statt Gießkanne.',
        },
      ],
      cta: 'Informationen anfragen',
    },
    tabB: {
      id: 'bildungstraeger',
      label: 'Bildungsträger & Akademien',
      intro: 'Verwandeln Sie Skill-Nachfrage in qualifizierte Leads.',
      challenge: {
        title: 'Herausforderung',
        items: [
          'Generische Kurslisten ohne Bezug zur Zielrolle',
          'Weder Erfahrung noch individuelle Skill-Lücken berücksichtigt',
          'Teure Reichweite statt echter Nachfrage – hoher Streuverlust',
        ],
      },
      solution: {
        title: 'DYD Skill Intelligence',
        items: [
          'KI verbindet Profil, Ziel und ESCO-Skills automatisch',
          'Erkennt die konkrete Kompetenzlücke jedes Nutzers',
          'Spielt passgenaue Weiterbildungen als qualifizierten Lead aus',
        ],
      },
      process: {
        title: 'Skill-Matching-Prozess',
        steps: [
          { title: 'Profil', desc: 'Werdegang erfassen' },
          { title: 'Erfahrung', desc: 'Skills auslesen' },
          { title: 'Zielrolle', desc: 'Wunsch abgleichen' },
          { title: 'Skill-Gap', desc: 'Lücke berechnen' },
          { title: 'Kurs', desc: 'Passung finden' },
          { title: 'Lead', desc: 'qualifiziert übergeben' },
        ],
      },
      benefits: [
        {
          title: 'Mehr Conversion',
          desc: 'Personalisierte Empfehlungen statt generischer Kurslisten – relevanter für jeden Interessenten.',
        },
        {
          title: 'Bessere Leads',
          desc: 'Nutzer mit konkret nachgewiesenem Entwicklungsbedarf – nicht bloß Klicks.',
        },
        {
          title: 'Weniger Streuverlust',
          desc: 'Skill-basierte Nachfrage ersetzt teure Reichweite und senkt Ihre Akquisekosten.',
        },
      ],
      cpa: {
        title: 'Business Case / CPA',
        classicLabel: 'Klassisch',
        classicDesc: 'Google & LinkedIn Ads',
        classicValue: '300–500 €',
        classicUnit: 'CPA',
        dydLabel: 'Mit DYD',
        dydDesc: 'Skill-Matching',
        dydValue: '75 €',
        dydUnit: 'CPA (Ziel)',
        delta: '−75 %',
        deltaLabel: 'Akquisekosten',
      },
      cta: 'Informationen anfragen',
    },
  },
  platformOverview: {
    title: 'Eine Plattform, ein Standard',
    subtitle:
      'DYD baut auf einem einheitlichen Kompetenz-Framework auf – europaweit anschlussfähig, datenschutzkonform und in Deutschland entwickelt.',
    features: [
      {
        icon: 'layers',
        title: 'ESCO-basierte Skill-Taxonomie',
        desc: 'Vollständig kompatibel zur europäischen ESCO-Klassifikation – Kompetenzen über Branchen und Grenzen hinweg vergleichbar.',
      },
      {
        icon: 'brain',
        title: 'KI-Analyse',
        desc: 'Automatisches Auslesen von Kompetenzen aus Lebensläufen und Profiltexten – ohne manuelles Tagging.',
      },
      {
        icon: 'shield',
        title: 'DSGVO-konform',
        desc: 'Datenverarbeitung ausschließlich auf europäischen Servern. Keine Drittanbieter-Tracking, keine Cloud-Extrawege.',
      },
      {
        icon: 'flag',
        title: 'Made in Germany',
        desc: 'Entwickelt und betreut in Düsseldorf – von einem Team mit Praxis in HR, Beratung und Hochschulbildung.',
      },
    ],
  },
  trust: {
    title: 'Vertrauen & Glaubwürdigkeit',
    partner: {
      label: 'Kooperationspartner',
      name: 'Hochschule Fresenius',
      desc: 'Eine der größten privaten Hochschulen Deutschlands – mit DYD in Workshop-Präsenz und pilotierten KI-Bewerbungstrainings.',
    },
    founder: {
      label: 'Gründer & Senior Consultant',
      name: 'Quentin Sunderbrink, B. Eng.',
      roles: [
  'Gründer & CEO von DYD – KI-Karriereplattform, made in Germany',
  'Senior Consultant mit vier Jahren Praxis in der Personaldienstleistung – kennt Auswahl und Entwicklung aus erster Hand',
  'IHK-Prüfer – bewertet Qualifikationen nach anerkanntem Standard',
  'Wirtschaftsingenieur (B. Eng.) – verbindet technisches Systemdenken mit HR-Praxis',
  '9 Jahre Abendschule parallel zum Vollzeitjob – lebt das Upskilling-Prinzip, das DYD ermöglicht',
  'Workshop-Speaker an deutschen Hochschulen (u. a. Hochschule Fresenius) für KI-gestützte Bewerbungsoptimierung',
  'Veranstalter des Harmony Festivals – organisiert ein eigenes Musik- und Comedy-Event',
],
      photoAlt: 'Porträt von Quentin Sunderbrink, Gründer von DYD',
      photoSrc: '/profile-picture.png',
      email: 'quentin@decide-your-dream.de',
      phone: '+49 211 12345678',
      linkedin: 'https://www.linkedin.com/in/quentin-sunderbrink',
    },
    badges: ['DSGVO', 'ESCO', 'Made in Germany'],
  },
} as const;
