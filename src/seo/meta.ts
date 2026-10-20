// src/seo/meta.ts
//
// Titel und Beschreibung je öffentlicher Seite. Genutzt
//  - beim Build (scripts/prerender-seo.mjs → statisches HTML je Seite)
//  - zur Laufzeit (RouteSeo.ts → Titel/Meta beim Seitenwechsel)
// Neue öffentliche Seite? Hier eintragen UND in src/seo/pages.ts Inhalt ergänzen.

export type PageMeta = {
  path: string;
  title: string;
  description: string;
  /** Kurzname für Breadcrumb und Navigation */
  name: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: number;
};

export const PAGE_META: PageMeta[] = [
  {
    path: '/',
    name: 'Start',
    title: 'DYD – KI-Lebenslauf-Check, CV-Wizard & Skill-Analyse',
    description: 'DYD prüft deinen Lebenslauf mit KI nach über 50 ATS-Kriterien, erstellt deinen CV in unter 30 Minuten und zeigt per Skill-Gap-Analyse, was dir zum Zieljob fehlt. Aus Düsseldorf, DSGVO-konform.',
    changefreq: 'weekly',
    priority: 1.0,
  },
  {
    path: '/cv-check',
    name: 'CV-Check',
    title: 'CV-Check mit KI: Lebenslauf nach 50+ ATS-Kriterien | DYD',
    description: 'Lade deinen Lebenslauf hoch und erfahre in Sekunden, ob er ATS-Systeme besteht: ATS-Score, Bewertung in 6 Kategorien, konkrete Formulierungsvorschläge. Detailanalyse für 2,99 €.',
    changefreq: 'monthly',
    priority: 0.9,
  },
  {
    path: '/cv-wizard',
    name: 'CV-Wizard',
    title: 'Lebenslauf mit KI erstellen – CV-Wizard | DYD',
    description: 'Erstelle deinen Lebenslauf Schritt für Schritt mit KI: ATS-optimiert, vier Vorlagen, PDF-Export und One-Click-Optimierung auf jede Stellenanzeige.',
    changefreq: 'monthly',
    priority: 0.8,
  },
  {
    path: '/career-vision',
    name: 'Skill-Gap-Analyse',
    title: 'Skill-Gap-Analyse: Was fehlt dir zum Zieljob? | DYD',
    description: 'Vergleiche deine Kompetenzen mit deinem Zielberuf nach dem EU-Standard ESCO: Match-Score, priorisierte Skill-Lücken und ein persönlicher Lernpfad mit Zertifikat.',
    changefreq: 'monthly',
    priority: 0.8,
  },
  {
    path: '/kurse',
    name: 'Kurse',
    title: 'Online-Kurse mit Zertifikat – DYD Career Academy | DYD',
    description: 'Fertige Lernpfade für gefragte Skills: 5 interaktive Lerneinheiten, Abschlussprüfung und prüfbares Zertifikat mit QR-Code. Einmalzahlung, kein Abo.',
    changefreq: 'weekly',
    priority: 0.8,
  },
  {
    path: '/business',
    name: 'Für Business',
    title: 'DYD für Business: Skills, Weiterbildung & Software',
    description: 'Drei Bereiche: DYD NEXUS macht Skills im Team sichtbar, DYD ORBIT gewinnt Teilnehmende für Bildungsträger über Skill-Matching (ab 199 €/Monat), Automatisierung baut individuelle Software und KI.',
    changefreq: 'weekly',
    priority: 0.9,
  },
  {
    path: '/business/automatisierung',
    name: 'Automatisierung & Software',
    title: 'Automatisierung & Software mit KI aus Düsseldorf | DYD',
    description: 'DYD baut Web-Apps, Handy-Apps, KI-Assistenten und Automatisierungen, die Routinearbeit übernehmen – mit Freigabe durch den Menschen und festem Preis. 7 eigene Systeme live, kostenloser Prozess-Check.',
    changefreq: 'weekly',
    priority: 0.9,
  },
  {
    path: '/faq',
    name: 'FAQ',
    title: 'FAQ zu CV-Check, Preisen & Datenschutz | DYD',
    description: 'Antworten auf die häufigsten Fragen zu DYD: wie der CV-Check funktioniert, was er kostet, welche Vorlagen es gibt, wie Token funktionieren und wie deine Daten geschützt sind.',
    changefreq: 'monthly',
    priority: 0.7,
  },
  {
    path: '/festival',
    name: 'Harmony Festival',
    title: 'Harmony Festival Düsseldorf – Musik & Comedy | DYD',
    description: 'Das Harmony Festival von DYD: eintägiges Musik- und Comedy-Festival im Klub Kulb Düsseldorf. Privat organisiert, Motto: Zusammenhalt statt Spaltung.',
    changefreq: 'monthly',
    priority: 0.5,
  },
  {
    path: '/impressum',
    name: 'Impressum',
    title: 'Impressum | DYD – Decide Your Dream',
    description: 'Impressum der DYD UG (haftungsbeschränkt), Düsseldorf.',
    changefreq: 'yearly',
    priority: 0.2,
  },
  {
    path: '/datenschutz',
    name: 'Datenschutz',
    title: 'Datenschutzerklärung | DYD – Decide Your Dream',
    description: 'Wie DYD personenbezogene Daten DSGVO-konform verarbeitet.',
    changefreq: 'yearly',
    priority: 0.2,
  },
  {
    path: '/agb',
    name: 'AGB',
    title: 'AGB | DYD – Decide Your Dream',
    description: 'Allgemeine Geschäftsbedingungen der DYD UG (haftungsbeschränkt).',
    changefreq: 'yearly',
    priority: 0.2,
  },
];

/** Bereiche, die nicht in Suchmaschinen gehören (Konto, Bezahlung, Editor …) */
export const NOINDEX_PREFIXES = [
  '/dashboard', '/login', '/reset-password', '/cv-paywall', '/pricing', '/payment-success', '/festival-success',
  '/cv-live-editor', '/cv/', '/cv-export-render', '/cv-preview-editor', '/cv-result', '/saved-cv-check',
  '/learning-path', '/verify/', '/admin', '/turnier', '/chat', '/agent', '/email', '/result', '/landing-modern',
  '/cv-entry', '/cv-upload', '/job-targeting', '/cv-optimization', '/newsletter',
];

export function metaFor(pathname: string): PageMeta | undefined {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return PAGE_META.find((p) => p.path === clean);
}

export function isNoindex(pathname: string): boolean {
  return NOINDEX_PREFIXES.some((p) => (p.endsWith('/') ? pathname.startsWith(p) : pathname === p || pathname.startsWith(`${p}/`)));
}
