// src/seo/pages.ts
//
// Inhalte und strukturierte Daten (JSON-LD) je öffentlicher Seite für das
// Vorrendern (scripts/prerender-seo.mjs). Suchmaschinen und KI-Crawler
// (GPTBot, ClaudeBot, PerplexityBot …) führen oft kein JavaScript aus –
// sie lesen genau dieses HTML. Besucher sehen danach die normale React-Seite.
//
// Regeln: nur belegbare Fakten, keine erfundenen Bewertungen/Zahlen,
// Preise nur wie in der App hinterlegt. Inhalte möglichst aus denselben
// Quellen wie die Seiten selbst (FAQ, B2B- und Automatisierungs-Inhalte).

import { FAQ_CATEGORIES } from '../pages/faqData';
import { automationContent as auto } from '../pages/b2b/automationContent';
import { b2bContent } from '../pages/b2b/content';
import { PAGE_META, type PageMeta } from './meta';
import { abs, globalSchema, ORG_ID, PERSON_ID, WEBSITE_ID } from './site';

export type Section = { h2: string; text?: string; list?: string[]; links?: { label: string; href: string }[] };
export type Faq = { q: string; a: string };
export type SeoPage = PageMeta & {
  h1: string;
  intro: string;
  sections: Section[];
  faq?: Faq[];
  schema: object[];
};

const meta = (path: string) => {
  const m = PAGE_META.find((p) => p.path === path);
  if (!m) throw new Error(`PAGE_META fehlt für ${path}`);
  return m;
};

const crumbs = (path: string) => {
  const parts = path === '/' ? [] : path.split('/').filter(Boolean);
  const items = [{ name: 'Start', item: abs('/') }];
  let acc = '';
  for (const part of parts) {
    acc += `/${part}`;
    const m = PAGE_META.find((p) => p.path === acc);
    if (m) items.push({ name: m.name, item: abs(acc) });
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.item })),
  };
};

const webPage = (m: PageMeta, type = 'WebPage', extra: Record<string, unknown> = {}) => ({
  '@context': 'https://schema.org',
  '@type': type,
  '@id': `${abs(m.path)}#webpage`,
  url: abs(m.path),
  name: m.title,
  description: m.description,
  inLanguage: 'de-DE',
  isPartOf: { '@id': WEBSITE_ID },
  publisher: { '@id': ORG_ID },
  dateModified: BUILD_DATE,
  ...extra,
});

const faqSchema = (path: string, faq: Faq[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${abs(path)}#faq`,
  mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

export const BUILD_DATE = new Date().toISOString().slice(0, 10);

// ── Angebote der Bewerber-Tools (Preise wie in der App) ──────────────────
const CV_OFFERS = [
  { name: 'CV-Check Detailanalyse', price: '2.99', description: 'Bewertung in 6 Kategorien, Zitate aus dem CV mit Recruiter-Kommentar, Formulierungsvorschläge' },
  { name: '1 CV-Optimierung', price: '5.00', description: 'Lebenslauf auf eine Stellenanzeige zuschneiden' },
  { name: '5 CV-Optimierungen', price: '20.00', description: '4 € pro Optimierung' },
  { name: '10 CV-Optimierungen', price: '30.00', description: '3 € pro Optimierung' },
  { name: 'KI-Anschreiben', price: '3.99', description: 'Anschreiben passend zur Stelle, frei bearbeitbar' },
];

const offer = (o: { name: string; price: string; description?: string }, url: string) => ({
  '@type': 'Offer', name: o.name, price: o.price, priceCurrency: 'EUR', description: o.description, url, availability: 'https://schema.org/InStock',
});

const cvApp = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  '@id': `${abs('/')}#cv-tools`,
  name: 'DYD Bewerbungs-Tools',
  alternateName: ['DYD CV-Check', 'DYD CV-Wizard'],
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web (Browser, Smartphone)',
  url: abs('/'),
  inLanguage: 'de-DE',
  description: 'KI-Web-App für Bewerbungen: CV-Check nach über 50 ATS-Kriterien, CV-Wizard, One-Click-Optimierung auf Stellenanzeigen, KI-Anschreiben, Skill-Gap-Analyse nach ESCO mit Lernpfad und Bewerbungsmanagement.',
  featureList: [
    'CV-Check nach über 50 ATS-Kriterien',
    'CV-Wizard: Lebenslauf in unter 30 Minuten',
    'One-Click-Optimierung auf eine Stellenanzeige',
    'KI-Anschreiben passend zur Stelle',
    'Skill-Gap-Analyse nach dem EU-Standard ESCO',
    'Lernpfade und Kurse mit prüfbarem Zertifikat',
    'Bewerbungsmanagement (kostenlos)',
  ],
  offers: CV_OFFERS.map((o) => offer(o, abs('/cv-check'))),
  provider: { '@id': ORG_ID },
  author: { '@id': PERSON_ID },
};

// ── Seiten ───────────────────────────────────────────────────────────────
function home(): SeoPage {
  const m = meta('/');
  const faq: Faq[] = [
    { q: 'Was ist DYD?', a: 'DYD (Decide Your Dream) ist eine KI-Plattform aus Düsseldorf für Bewerbung und Karriere. Sie prüft Lebensläufe nach über 50 ATS-Kriterien, hilft beim Erstellen und Optimieren des CVs, schreibt passende Anschreiben und zeigt per Skill-Gap-Analyse, welche Kompetenzen zum Zieljob fehlen.' },
    { q: 'Was kostet DYD?', a: 'Die Detailanalyse des CV-Checks kostet 2,99 €. Eine One-Click-Optimierung kostet 5 €, im Paket 5 für 20 € oder 10 für 30 €. Ein KI-Anschreiben kostet 3,99 €. Das Bewerbungsmanagement ist kostenlos. Es gibt kein Abo.' },
    { q: 'Was ist ein ATS und warum ist der Check wichtig?', a: 'Ein Applicant Tracking System (ATS) ist eine Bewerbermanagement-Software, die Lebensläufe automatisch ausliest und sortiert, bevor ein Mensch sie sieht. Der DYD CV-Check zeigt, woran ein Lebenslauf dabei scheitern würde, und gibt konkrete Verbesserungen.' },
    { q: 'Ist DYD DSGVO-konform?', a: 'Ja. DYD wird in Deutschland entwickelt und betrieben und verarbeitet Daten DSGVO-konform. Daten werden nicht verkauft, Zahlungen laufen über Stripe.' },
    { q: 'Wer steht hinter DYD?', a: 'DYD wurde von Quentin Sunderbrink in Düsseldorf gegründet. Er hat mehrere Jahre in der Personaldienstleistung gearbeitet und ist IHK-Prüfer. DYD ist Kooperationspartner der Hochschule Fresenius.' },
    { q: 'Bietet DYD auch etwas für Unternehmen?', a: 'Ja: DYD NEXUS macht Skills in Teams sichtbar, DYD ORBIT gewinnt Teilnehmende für Bildungsträger über Skill-Matching, und unter „Automatisierung“ entwickelt DYD individuelle Software, Apps und KI-Assistenten.' },
  ];
  return {
    ...m,
    h1: 'DYD – Bewerbung und Karriere mit KI',
    intro: 'DYD (Decide Your Dream) ist eine KI-Plattform aus Düsseldorf für Bewerbung und Karriere – für Studierende, Berufseinsteiger:innen und alle, die sich verändern wollen. Kooperationspartner der Hochschule Fresenius, DSGVO-konform, ohne Abo.',
    sections: [
      { h2: 'Die Bewerbungs-Tools', list: [
        'CV-Check: Lebenslauf nach über 50 ATS-Kriterien prüfen, ATS-Score und Bewertung in 6 Kategorien.',
        'CV-Wizard: Lebenslauf in unter 30 Minuten erstellen, vier Vorlagen, PDF-Export.',
        'One-Click-Optimierung: den Lebenslauf auf eine konkrete Stellenanzeige zuschneiden.',
        'KI-Anschreiben: passend zur Stelle, jeder Absatz erklärt, frei bearbeitbar.',
        'Skill-Gap-Analyse: Vergleich mit dem Zielberuf nach dem EU-Standard ESCO, mit persönlichem Lernpfad.',
        'Kurse mit Zertifikat: fertige Lernpfade mit Abschlussprüfung und QR-prüfbarem Zertifikat.',
        'Bewerbungsmanagement: alle Bewerbungen und ihren Status im Blick – kostenlos.',
      ], links: [
        { label: 'CV-Check starten', href: '/cv-check' }, { label: 'Lebenslauf erstellen', href: '/cv-wizard' },
        { label: 'Skill-Gap-Analyse', href: '/career-vision' }, { label: 'Kurse', href: '/kurse' },
      ] },
      { h2: 'Preise', list: [
        'CV-Check Detailanalyse: 2,99 €',
        'CV-Optimierung: 5 € einzeln, 5 Stück für 20 €, 10 Stück für 30 €',
        'KI-Anschreiben: 3,99 €',
        'Bewerbungsmanagement: kostenlos',
        'Kein Abo, keine versteckten Kosten',
      ] },
      { h2: 'Für Unternehmen und Bildungsträger', text: 'DYD NEXUS (Skill-Plattform für HR & L&D), DYD ORBIT (Teilnehmergewinnung für Bildungsträger, ab 199 € im Monat, 7 Tage kostenlos testen) und individuelle Software & KI-Automatisierung.', links: [
        { label: 'DYD für Business', href: '/business' }, { label: 'Automatisierung & Software', href: '/business/automatisierung' },
      ] },
    ],
    faq,
    schema: [webPage(m, 'WebPage', { about: { '@id': ORG_ID }, mainEntity: { '@id': `${abs('/')}#cv-tools` } }), cvApp, faqSchema('/', faq), crumbs('/')],
  };
}

function cvCheck(): SeoPage {
  const m = meta('/cv-check');
  const faq: Faq[] = [
    { q: 'Was prüft der DYD CV-Check?', a: 'Der CV-Check liest den Lebenslauf aus und bewertet ihn nach über 50 Kriterien in sechs Kategorien: Relevanz, Erfolge, Sprache, Alleinstellungsmerkmal (USP), Formales und Erfahrungstiefe – inklusive ATS-Lesbarkeit.' },
    { q: 'Was kostet der CV-Check?', a: 'Die Detailanalyse mit Bewertung aller Kategorien, Zitaten aus dem CV mit Recruiter-Kommentar und fertigen Formulierungsvorschlägen kostet 2,99 € als Einmalzahlung.' },
    { q: 'Wie lange dauert der CV-Check?', a: 'Das Ergebnis liegt in der Regel nach wenigen Sekunden bis Minuten vor.' },
  ];
  return {
    ...m,
    h1: 'CV-Check mit KI: Besteht dein Lebenslauf das ATS?',
    intro: 'Die meisten größeren Unternehmen lassen Lebensläufe zuerst von einem Applicant Tracking System (ATS) auslesen. Der DYD CV-Check zeigt dir Zeile für Zeile, woran dein Lebenslauf dort hängen bleibt – und wie du ihn verbesserst.',
    sections: [
      { h2: 'So funktioniert der CV-Check', list: ['Lebenslauf als PDF hochladen', 'KI-Analyse nach über 50 Kriterien', 'ATS-Score und Bewertung in 6 Kategorien', 'Konkrete Formulierungsvorschläge und Top-Prioritäten'] },
      { h2: 'Was die Detailanalyse zeigt (2,99 €)', list: [
        'Bewertung & Feedback zu allen 6 Kategorien (Relevanz, Erfolge, Sprache, USP, Formales, Erfahrungstiefe)',
        'Konkrete Zitate aus deinem CV mit Recruiter-Kommentar',
        'Fertige Formulierungsvorschläge zum direkten Übernehmen',
        'Deine persönlichen Top-Prioritäten für die größte Wirkung',
      ] },
      { h2: 'Danach', text: 'Mit der One-Click-Optimierung (ab 5 €) passt DYD deinen Lebenslauf auf eine konkrete Stellenanzeige an.', links: [{ label: 'Lebenslauf neu erstellen', href: '/cv-wizard' }, { label: 'Häufige Fragen', href: '/faq' }] },
    ],
    faq,
    schema: [webPage(m, 'WebPage', { mainEntity: { '@id': `${abs('/')}#cv-tools` } }), {
      '@context': 'https://schema.org', '@type': 'Service', '@id': `${abs('/cv-check')}#service`,
      name: 'KI-CV-Check nach über 50 ATS-Kriterien', serviceType: 'Lebenslauf-Analyse', provider: { '@id': ORG_ID },
      areaServed: { '@type': 'Country', name: 'Deutschland' }, offers: offer(CV_OFFERS[0], abs('/cv-check')),
    }, faqSchema('/cv-check', faq), crumbs('/cv-check')],
  };
}

function cvWizard(): SeoPage {
  const m = meta('/cv-wizard');
  return {
    ...m,
    h1: 'Lebenslauf erstellen mit KI – in unter 30 Minuten',
    intro: 'Der DYD CV-Wizard führt dich Schritt für Schritt zu einem modernen, ATS-optimierten Lebenslauf – auch wenn du bei null startest.',
    sections: [
      { h2: 'Was der CV-Wizard kann', list: [
        'Geführte Eingabe aller Stationen: Berufserfahrung, Ausbildung, Skills, Sprachen',
        'KI-Formulierungshilfe für Erfolge und Aufgaben',
        'Vier Vorlagen: Professional, Minimal, Creative, Classic',
        'Live-Editor mit Vorschau und PDF-Download',
        'One-Click-Optimierung auf eine Stellenanzeige (ab 5 €)',
      ] },
    ],
    schema: [webPage(m, 'WebPage', { mainEntity: { '@id': `${abs('/')}#cv-tools` } }), {
      '@context': 'https://schema.org', '@type': 'HowTo', name: 'Lebenslauf mit dem DYD CV-Wizard erstellen', totalTime: 'PT30M',
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Persönliche Daten und Ziel angeben' },
        { '@type': 'HowToStep', position: 2, name: 'Berufserfahrung und Ausbildung eintragen' },
        { '@type': 'HowToStep', position: 3, name: 'Skills und Sprachen ergänzen' },
        { '@type': 'HowToStep', position: 4, name: 'Vorlage wählen, im Live-Editor anpassen und als PDF herunterladen' },
      ],
    }, crumbs('/cv-wizard')],
  };
}

function careerVision(): SeoPage {
  const m = meta('/career-vision');
  const faq: Faq[] = [
    { q: 'Was ist eine Skill-Gap-Analyse?', a: 'Eine Skill-Gap-Analyse vergleicht die eigenen Kompetenzen mit den Anforderungen eines Zielberufs. DYD nutzt dafür den europäischen Kompetenzrahmen ESCO und zeigt einen Match-Score, die wichtigsten fehlenden Skills und einen passenden Lernpfad.' },
    { q: 'Was ist ESCO?', a: 'ESCO (European Skills, Competences, Qualifications and Occupations) ist die mehrsprachige Klassifikation der EU für Berufe und Kompetenzen. Sie macht Skills zwischen Lebenslauf, Stellenanzeigen und Weiterbildungen vergleichbar.' },
  ];
  return {
    ...m,
    h1: 'Skill-Gap-Analyse: Was fehlt dir zum Zieljob?',
    intro: 'DYD vergleicht die Kompetenzen aus deinem Lebenslauf mit deinem Zielberuf nach dem EU-Standard ESCO – und zeigt dir, welche Skills dir am meisten weiterhelfen.',
    sections: [
      { h2: 'Ablauf', list: ['Lebenslauf und Zielberuf angeben', 'Match-Score nach ESCO berechnen', 'Priorisierte Skill-Lücken sehen', 'Persönlichen Lernpfad mit Lerneinheiten, Abschlussprüfung und Zertifikat starten'] },
    ],
    faq,
    schema: [webPage(m), faqSchema('/career-vision', faq), crumbs('/career-vision')],
  };
}

function kurse(): SeoPage {
  const m = meta('/kurse');
  return {
    ...m,
    h1: 'Kurse mit Zertifikat – DYD Career Academy',
    intro: 'Fertige Lernpfade für gefragte Skills: 5 interaktive Lerneinheiten, Abschlussprüfung und ein prüfbares Zertifikat mit QR-Code – als Einmalzahlung, ohne Abo.',
    sections: [
      { h2: 'Das bekommst du', list: ['5 interaktive Lerneinheiten pro Kurs', 'Abschlussprüfung', 'Zertifikat mit QR-Code zur Echtheitsprüfung', 'Direkt für LinkedIn und den Lebenslauf nutzbar'] },
      { h2: 'Persönlicher Lernpfad', text: 'Statt eines fertigen Kurses kannst du über die Skill-Gap-Analyse einen Lernpfad erstellen lassen, der genau auf deinen Zielberuf zugeschnitten ist.', links: [{ label: 'Zur Skill-Gap-Analyse', href: '/career-vision' }] },
    ],
    schema: [webPage(m, 'CollectionPage'), {
      '@context': 'https://schema.org', '@type': 'EducationalOrganization', '@id': `${abs('/kurse')}#academy`,
      name: 'DYD Career Academy', parentOrganization: { '@id': ORG_ID }, url: abs('/kurse'),
      description: 'Online-Lernpfade mit Abschlussprüfung und prüfbarem Zertifikat.',
    }, crumbs('/kurse')],
  };
}

function business(): SeoPage {
  const m = meta('/business');
  const nexus = b2bContent.tabs.tabA;
  const orbit = b2bContent.tabs.tabB;
  const faq: Faq[] = [...nexus.faq, ...orbit.faq].map((f) => ({ q: f.q, a: f.a }));
  return {
    ...m,
    h1: 'DYD für Business: drei Bereiche',
    intro: b2bContent.hero.subline,
    sections: [
      { h2: 'Für Unternehmen: DYD NEXUS', text: nexus.product.tagline, list: ['Skill-Inventar der Belegschaft nach ESCO', 'Automatisches Gap-Matching auf Zielrollen', 'Personalisierte Lernpfade statt Standardkatalog', 'Interne Besetzung statt teurer externer Suche', 'API- und White-Label-Option'] },
      { h2: 'Für Bildungsträger: DYD ORBIT', text: orbit.product.tagline, list: [
        'Passende Teilnehmende über echte Skill-Gap-Analyse statt Streuwerbung',
        'Pakete: Starter 199 €, Growth 399 €, Professional 699 € pro Monat (jährlich 2 Monate gratis)',
        '7 Tage kostenlos testen, ohne Zahlungsdaten',
        'Selbstbedienung: Registrierung, API-Zugang und Abo-Verwaltung online',
        'Weiterbildungs-Finder per iframe auf der eigenen Website einbetten',
        'Für Bildungsträger, Volkshochschulen, IHK, Transfergesellschaften und Agentur für Arbeit',
      ] },
      { h2: 'Automatisierung & individuelle Software', text: 'Web-Apps, Handy-Apps, KI-Assistenten und Automatisierungen für die eigenen Abläufe eines Unternehmens – unabhängig von Branche und Thema.', links: [{ label: 'Zu Automatisierung & Software', href: '/business/automatisierung' }] },
    ],
    faq,
    schema: [webPage(m), {
      '@context': 'https://schema.org', '@type': 'SoftwareApplication', '@id': `${abs('/business')}#nexus`,
      name: 'DYD NEXUS', applicationCategory: 'BusinessApplication', applicationSubCategory: 'Workforce Intelligence, HR-Tech', operatingSystem: 'Web',
      url: abs('/business?tab=unternehmen'), description: nexus.product.tagline, provider: { '@id': ORG_ID }, inLanguage: 'de-DE',
    }, {
      '@context': 'https://schema.org', '@type': 'SoftwareApplication', '@id': `${abs('/business')}#orbit`,
      name: 'DYD ORBIT', applicationCategory: 'BusinessApplication', applicationSubCategory: 'EdTech, Lead-Generierung', operatingSystem: 'Web',
      url: abs('/business?tab=bildungstraeger'), description: orbit.product.tagline, provider: { '@id': ORG_ID }, inLanguage: 'de-DE',
      offers: [['Starter', '199.00'], ['Growth', '399.00'], ['Professional', '699.00']].map(([n, p]) => ({
        '@type': 'Offer', name: `DYD ORBIT ${n}`, price: p, priceCurrency: 'EUR', url: abs('/business?tab=bildungstraeger'),
        priceSpecification: { '@type': 'UnitPriceSpecification', price: p, priceCurrency: 'EUR', unitText: 'Monat', referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' } },
      })),
    }, faqSchema('/business', faq), crumbs('/business')],
  };
}

function automation(): SeoPage {
  const m = meta('/business/automatisierung');
  const faq: Faq[] = auto.faq.map((f) => ({ q: f.q, a: f.a }));
  const app = auto.finder.options.find((o) => 'build' in o);
  const build = app && 'build' in app ? app.build : null;
  return {
    ...m,
    h1: 'Automatisierung & individuelle Software: Software, die mitarbeitet',
    intro: auto.hero.subline,
    sections: [
      { h2: 'Was DYD baut', list: ['Web-Apps und Handy-Apps (installierbar auf iPhone und Android)', 'KI-Assistenten und Chatbots', 'Automatisierungen für E-Mails, Dokumente und Berichte', 'Interne Tools, Kundenportale und Dashboards', 'Schnittstellen zwischen bestehenden Programmen'] },
      ...(build ? [{ h2: `Eigene App-Idee: ${build.title}`, list: [...build.points] }] : []),
      { h2: 'Live-Projekte (7 selbst entwickelte Systeme)', list: auto.references.items.map((r) => `${r.title}: ${r.pitch}`) },
      { h2: 'So läuft ein Projekt', list: ['Kostenloser Prozess-Check (ca. 30 Minuten, unverbindlich)', 'Angebot mit festem Preis für den ersten Baustein', 'Früh eine klickbare Version zum Testen', 'Übergabe mit Einführung und Dokumentation, Weiterentwicklung optional'] },
      { h2: 'Grundsätze', list: ['KI bereitet vor, der Mensch gibt frei – nichts geht ungeprüft nach außen', 'Klein starten mit einem klar abgegrenzten Baustein', 'Alles nachvollziehbar protokolliert', 'Fester Preis statt offener Stundenabrechnung'] },
    ],
    faq,
    schema: [webPage(m), {
      '@context': 'https://schema.org', '@type': 'ProfessionalService', '@id': `${abs('/business/automatisierung')}#service`,
      name: 'DYD Automatisierung & individuelle Software', serviceType: ['Softwareentwicklung', 'App-Entwicklung', 'KI-Automatisierung', 'Prozessautomatisierung'],
      description: m.description, url: abs('/business/automatisierung'), provider: { '@id': ORG_ID }, parentOrganization: { '@id': ORG_ID },
      areaServed: [{ '@type': 'City', name: 'Düsseldorf' }, { '@type': 'Country', name: 'Deutschland' }],
      address: { '@type': 'PostalAddress', addressLocality: 'Düsseldorf', addressCountry: 'DE' },
      knowsAbout: ['Web-App-Entwicklung', 'Handy-Apps', 'KI-Assistenten', 'Chatbots', 'CRM', 'Ticketsysteme', 'Prozessautomatisierung'],
      hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Leistungen', itemListElement: [
        { '@type': 'Offer', name: 'Kostenloser Prozess-Check', price: '0', priceCurrency: 'EUR', description: 'ca. 30 Minuten, unverbindlich' },
        { '@type': 'Offer', name: 'Erster Baustein zum Festpreis', description: 'Individuelles Angebot nach dem Prozess-Check' },
      ] },
    }, {
      '@context': 'https://schema.org', '@type': 'ItemList', '@id': `${abs('/business/automatisierung')}#projekte`, name: 'Live-Projekte von DYD',
      itemListElement: auto.references.items.map((r, i) => ({ '@type': 'ListItem', position: i + 1, item: {
        '@type': 'CreativeWork', name: r.title, description: r.pitch, genre: r.category, creator: { '@id': ORG_ID },
        image: r.shots[0] ? abs(r.shots[0].src) : undefined,
      } })),
    }, faqSchema('/business/automatisierung', faq), crumbs('/business/automatisierung')],
  };
}

function faqPage(): SeoPage {
  const m = meta('/faq');
  const all: Faq[] = FAQ_CATEGORIES.flatMap((c) => c.faqs.map((f) => ({ q: f.question, a: `${f.answer} ${f.details}`.trim() })));
  return {
    ...m,
    h1: 'Häufige Fragen zu DYD',
    intro: 'Alles Wichtige zu CV-Check, CV-Wizard, Preisen, Token, Datenschutz und dem Harmony Festival.',
    sections: FAQ_CATEGORIES.map((c) => ({ h2: c.title, list: c.faqs.map((f) => f.question) })),
    faq: all,
    schema: [webPage(m, 'FAQPage', { mainEntity: all.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }), crumbs('/faq')],
  };
}

function festival(): SeoPage {
  const m = meta('/festival');
  return {
    ...m,
    h1: 'Harmony Festival Düsseldorf',
    intro: 'Eintägiges Musik- und Comedy-Festival, veranstaltet von DYD. Privat organisiert, ohne Konzern-Budget und ohne Gewinnmarge. Motto: Zusammenhalt statt Spaltung.',
    sections: [{ h2: 'Harmony Festival 2026', list: ['Samstag, 22. August 2026', 'Klub Kulb, Burgplatz 11, 40213 Düsseldorf', 'Einlass 16:00 Uhr, Programm 16:30 bis 02:00 Uhr', 'Zutritt ab 18 Jahren'] }],
    schema: [webPage(m), {
      '@context': 'https://schema.org', '@type': 'MusicEvent', '@id': `${abs('/festival')}#harmony-2026`, name: 'Harmony Festival 2026',
      startDate: '2026-08-22T16:00:00+02:00', endDate: '2026-08-23T02:00:00+02:00',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode', eventStatus: 'https://schema.org/EventScheduled',
      location: { '@type': 'Place', name: 'Klub Kulb', address: { '@type': 'PostalAddress', streetAddress: 'Burgplatz 11', postalCode: '40213', addressLocality: 'Düsseldorf', addressCountry: 'DE' } },
      organizer: { '@id': ORG_ID }, typicalAgeRange: '18-', url: abs('/festival'),
    }, crumbs('/festival')],
  };
}

const legal = (path: string, h1: string, text: string): SeoPage => {
  const m = meta(path);
  return { ...m, h1, intro: text, sections: [], schema: [webPage(m), crumbs(path)] };
};

export function buildSeoPages(): SeoPage[] {
  return [
    home(), cvCheck(), cvWizard(), careerVision(), kurse(), business(), automation(), faqPage(), festival(),
    legal('/impressum', 'Impressum', 'Angaben gemäß § 5 DDG zur DYD UG (haftungsbeschränkt), Düsseldorf.'),
    legal('/datenschutz', 'Datenschutzerklärung', 'Informationen zur DSGVO-konformen Verarbeitung personenbezogener Daten bei DYD.'),
    legal('/agb', 'Allgemeine Geschäftsbedingungen', 'Allgemeine Geschäftsbedingungen der DYD UG (haftungsbeschränkt).'),
  ];
}

export { globalSchema };
