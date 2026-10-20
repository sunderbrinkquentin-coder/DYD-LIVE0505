// src/pages/b2b/businessAreas.ts
//
// Die DREI gleichrangigen Business-Bereiche (NEU, 16.10.2026) – eine
// einzige Quelle für Header, Hero-Auswahl und Tab-Leiste, damit überall
// dieselben Namen, Farben und Ziele stehen.
//   Unternehmen      → Skill-Plattform NEXUS   (Tab auf #/business)
//   Bildungsträger   → Skill-Plattform ORBIT   (Tab auf #/business)
//   Automatisierung  → eigene Seite            (/business/automatisierung)

export type BusinessAreaId = 'unternehmen' | 'bildungstraeger' | 'automatisierung';

export const BUSINESS_AREAS: {
  id: BusinessAreaId;
  label: string;
  product: string;
  forWhom: string;
  promise: string;
  href: string;
  accent: string;
}[] = [
  {
    id: 'unternehmen',
    label: 'Unternehmen',
    product: 'DYD NEXUS',
    forWhom: 'Für HR & L&D',
    promise: 'Skills im Team sichtbar machen und intern besetzen statt extern suchen.',
    href: '/business?tab=unternehmen',
    accent: '#38BDF8',
  },
  {
    id: 'bildungstraeger',
    label: 'Bildungsträger',
    product: 'DYD ORBIT',
    forWhom: 'Für Akademien & Bildungsträger',
    promise: 'Passende Teilnehmende über Skill-Matching gewinnen – planbar statt Klickpreise.',
    href: '/business?tab=bildungstraeger',
    accent: '#7DD3FC',
  },
  {
    id: 'automatisierung',
    label: 'Automatisierung',
    product: 'Software & KI',
    forWhom: 'Für jedes Unternehmen',
    promise: 'Individuelle Web-Apps und KI-Assistenten, die Ihre Routinearbeit übernehmen.',
    href: '/business/automatisierung',
    accent: '#DEFF9A',
  },
];
