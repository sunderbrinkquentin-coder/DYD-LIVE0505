// src/config/offerCalculator.ts
//
// Zentrale Kalkulationslogik fuer den Angebots-Rechner auf der
// Automatisierungsseite (#/business/automatisierung).
//
// SO PASST QUENTIN DIE ZAHLEN AN: Nur die Werte in PROJECT_TYPES und
// HOURLY_RATE / BUFFER_FACTOR aendern. Alles andere (Preisspanne,
// Dauer, Anzeige) berechnet sich daraus automatisch.

export const HOURLY_RATE = 50; // EUR pro Arbeitsstunde
export const BUFFER_FACTOR = 1.3; // +30 % Puffer (Absprachen, Tests, Nachbesserung)

export type ProjectSizeId = 'klein' | 'mittel' | 'gross';

export type ProjectTypeInfo = {
  id: string;
  label: string;
  /** Aufwandsbereich in Stunden (ohne Puffer) */
  hoursMin: number;
  hoursMax: number;
  /** Umsetzungsdauer in Wochen (realistisch inkl. Feedback-Schleifen) */
  weeks: [number, number];
  /** Was beim Typ typischerweise enthalten ist */
  includes: string[];
  /** Individueller Nutzen-Satz, der im Rechner-Ergebnis gezeigt wird */
  tagline: string;
  /** Meistgewählter Typ (Badge im Rechner) */
  popular?: boolean;
  /** Verwandte Referenzprojekt-ID aus automationContent (fuer Verlinkung) */
  exampleRef?: string;
};

export const SIZE_LABELS: Record<ProjectSizeId, { label: string; hint: string; factor: number }> = {
  klein: { label: 'Klein', hint: 'Ein klarer Ablauf, wenige Anpassungen', factor: 0.7 },
  mittel: { label: 'Mittel', hint: 'Mehrere Bausteine, typischer Erstumfang', factor: 1 },
  gross: { label: 'Groß', hint: 'Volles System mit Anbindungen', factor: 1.5 },
};

export const PROJECT_TYPES: ProjectTypeInfo[] = [
  {
    id: 'automatisierung',
    label: 'Kleine Automatisierung',
    hoursMin: 10,
    hoursMax: 20,
    weeks: [1, 2],
    includes: ['Ein klar abgegrenzter Ablauf', 'Einmalige Übergabe mit Kurzdoku', 'Feste Zieldauer genannt'],
    tagline: 'Ihr Ablauf läuft danach von allein – Sie sparen jede Woche Zeit.',
    exampleRef: 'podcast',
  },
  {
    id: 'chatbot',
    label: 'KI-Chatbot / KI-Assistent',
    hoursMin: 25,
    hoursMax: 45,
    weeks: [2, 3],
    includes: ['Chat-Widget auf Ihrer Website', 'KI-Anbindung im Hintergrund', 'Testbetrieb mit Auswertung'],
    tagline: 'Ihr Chatbot berät Kunden rund um die Uhr – auch wenn Sie schlafen.',
    popular: true,
    exampleRef: 'chatbot',
  },
  {
    id: 'tickets',
    label: 'Ticket- / Eventsystem',
    hoursMin: 30,
    hoursMax: 50,
    weeks: [2, 4],
    includes: ['Online-Verkauf & Bezahlung', 'Automatische Tickets als PDF', 'Teilnehmerverwaltung'],
    tagline: 'Ihr eigener Ticketshop verkauft, zieht Geld ein und stellt Tickets aus.',
    exampleRef: 'tickets',
  },
  {
    id: 'turnier',
    label: 'Cockpit / Verwaltungs-Tool',
    hoursMin: 40,
    hoursMax: 60,
    weeks: [3, 5],
    includes: ['Eigene Verwaltungsoberfläche', 'Rollen & Freigaben', 'Dokumentation & Einführung'],
    tagline: 'Verwaltung mit wenigen Klicks – statt Excel-Chaos und Papierzetteln.',
    exampleRef: 'turnier',
  },
  {
    id: 'crm',
    label: 'CRM / Vertriebstool',
    hoursMin: 40,
    hoursMax: 70,
    weeks: [3, 6],
    includes: ['Kundenüberblick & Tagesplan', 'KI-Vorbereitung, Sie geben frei', 'Anbindung bestehender Tools'],
    tagline: 'Jeden Morgen ein fertiger Tagesplan – KI bereitet vor, Sie geben frei.',
    exampleRef: 'crm',
  },
  {
    id: 'trading',
    label: 'Daten- / Regel-Assistent',
    hoursMin: 60,
    hoursMax: 90,
    weeks: [4, 8],
    includes: ['Regel-Engine mit Protokoll', 'Risikokontrollen & Grenzen', 'Höchste Nachvollziehbarkeit'],
    tagline: 'Feste Regeln statt Bauchgefühl – jede Entscheidung nachvollziehbar.',
    exampleRef: 'trading',
  },
  {
    id: 'app',
    label: 'Eigene App (MVP)',
    hoursMin: 60,
    hoursMax: 120,
    weeks: [4, 8],
    includes: ['Von der Idee zur nutzbaren App', 'Frühe Testversion zum Klicken', 'Übergabe inkl. Einführung'],
    tagline: 'Von der Idee zur klickbaren App – Ihr erster Baustein geht live.',
    exampleRef: 'buchung',
  },
];

/** Auf 500er-Schritte aufrunden – glatte Zahlen sind gesprächsfähiger. */
const round500 = (n: number) => Math.ceil(n / 500) * 500;

const eur = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export type OfferEstimate = {
  priceMin: string;
  priceMax: string;
  weeksLabel: string;
  hoursLabel: string;
};

/**
 * Preisspanne = Stunden × Stundensatz × Puffer × Groessenfaktor,
 * kleinere Seite mit hoursMin × 0.9 (untere Grenze darstellen),
 * groessere Seite mit hoursMax, beides auf 500 € aufgerundet.
 */
export function estimate(typeId: string, size: ProjectSizeId): OfferEstimate | null {
  const type = PROJECT_TYPES.find((t) => t.id === typeId);
  if (!type) return null;
  const f = SIZE_LABELS[size].factor;
  const low = round500(type.hoursMin * HOURLY_RATE * BUFFER_FACTOR * f * 0.9);
  const high = round500(type.hoursMax * HOURLY_RATE * BUFFER_FACTOR * f);
  return {
    priceMin: eur(low),
    priceMax: eur(high),
    weeksLabel: `${type.weeks[0]}–${type.weeks[1]} Wochen`,
    hoursLabel: `${type.hoursMin}–${type.hoursMax} Std. Aufwand (inkl. Puffer)`,
  };
}

export function typeIncludes(typeId: string): string[] {
  return PROJECT_TYPES.find((t) => t.id === typeId)?.includes ?? [];
}

export function projectTypeInfo(typeId: string): ProjectTypeInfo | undefined {
  return PROJECT_TYPES.find((t) => t.id === typeId);
}

export function exampleRefFor(typeId: string): string | undefined {
  return PROJECT_TYPES.find((t) => t.id === typeId)?.exampleRef;
}
