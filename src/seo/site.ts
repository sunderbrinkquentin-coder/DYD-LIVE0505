// src/seo/site.ts
//
// Zentrale Entitätsdaten von DYD für Suchmaschinen und KI-Antwortmaschinen
// (GEO). EINE Quelle für Domain, Firmenname, Gründer und Profile – damit
// überall dieselben Angaben stehen (widersprüchliche Angaben kosten
// Vertrauen bei ChatGPT, Perplexity, Gemini & Co.).

import { DYD_SOCIALS } from '../config/socials';

export const SITE_URL = 'https://decide-your-dream.de';
export const SITE_NAME = 'DYD – Decide Your Dream';
export const LEGAL_NAME = 'DYD UG (haftungsbeschränkt)';
export const CONTACT_EMAIL = 'kontakt.dyd@googlemail.com';
export const LOGO_URL = `${SITE_URL}/DYD%20Logo%20RGB.svg`;
export const OG_IMAGE = `${SITE_URL}/og-dyd.png`;

export const ORG_ID = `${SITE_URL}/#organization`;
export const PERSON_ID = `${SITE_URL}/#quentin-sunderbrink`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const abs = (path: string) => (path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`);

/** Globale Entitäten – stehen auf jeder Seite */
export function globalSchema(): object[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': ORG_ID,
      name: SITE_NAME,
      legalName: LEGAL_NAME,
      alternateName: ['DYD', 'Decide Your Dream', 'decide-your-dream.de'],
      url: `${SITE_URL}/`,
      logo: { '@type': 'ImageObject', url: LOGO_URL },
      description:
        'DYD (Decide Your Dream) ist ein HR-Tech-Unternehmen aus Düsseldorf. DYD bietet KI-gestützte Bewerbungs-Tools (CV-Check, CV-Wizard, Skill-Gap-Analyse, Kurse mit Zertifikat), die Skill-Plattformen DYD NEXUS (Unternehmen) und DYD ORBIT (Bildungsträger) sowie individuelle Software, Web-Apps und KI-Automatisierung für Unternehmen.',
      foundingDate: '2024',
      founder: { '@id': PERSON_ID },
      address: { '@type': 'PostalAddress', addressLocality: 'Düsseldorf', addressRegion: 'Nordrhein-Westfalen', addressCountry: 'DE' },
      areaServed: { '@type': 'Country', name: 'Deutschland' },
      contactPoint: { '@type': 'ContactPoint', email: CONTACT_EMAIL, contactType: 'customer service', availableLanguage: ['de', 'en'], areaServed: 'DE' },
      sameAs: [DYD_SOCIALS.linkedin.url, DYD_SOCIALS.instagram.url, DYD_SOCIALS.tiktok.url],
      knowsAbout: [
        'Lebenslauf-Optimierung', 'ATS-Systeme', 'Bewerbung mit KI', 'Skill-Gap-Analyse', 'ESCO-Kompetenzrahmen',
        'Workforce Intelligence', 'Weiterbildung', 'Lead-Generierung für Bildungsträger',
        'Prozessautomatisierung', 'KI-Assistenten', 'Individuelle Softwareentwicklung', 'Web-App-Entwicklung',
      ],
      partner: { '@type': 'EducationalOrganization', name: 'Hochschule Fresenius', legalName: 'Carl Remigius Fresenius Education AG', url: 'https://www.hs-fresenius.de' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': PERSON_ID,
      name: 'Quentin Sunderbrink',
      jobTitle: 'Gründer & CEO von DYD',
      worksFor: { '@id': ORG_ID },
      homeLocation: { '@type': 'Place', name: 'Düsseldorf' },
      knowsAbout: ['KI-gestützte Bewerbungsoptimierung', 'ATS-Optimierung', 'Personaldienstleistung', 'IHK-Prüfungen', 'Prozessautomatisierung', 'Softwareentwicklung mit KI'],
      sameAs: [DYD_SOCIALS.founderLinkedin.url],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      inLanguage: 'de-DE',
      publisher: { '@id': ORG_ID },
    },
  ];
}
