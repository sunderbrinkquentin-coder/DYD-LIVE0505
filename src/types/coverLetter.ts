export type CoverLetterTone = 'professionell' | 'modern' | 'selbstbewusst' | 'herzlich';
export type ParagraphRole = 'einstieg' | 'motivation' | 'qualifikation' | 'mehrwert' | 'abschluss';

export interface CoverLetterSource {
  type: 'job' | 'cv';
  quote: string;
}

export interface CoverLetterParagraph {
  id: string;
  role: ParagraphRole;
  /** null = gesperrt (Vorschau) */
  text: string | null;
  why: string;
  sources: CoverLetterSource[];
  /** von der Person selbst geändert */
  edited?: boolean;
  /** nur in der Vorschau: Länge des gesperrten Texts */
  text_length?: number;
}

export interface CoverLetterContent {
  subject: string;
  salutation: string;
  paragraphs: CoverLetterParagraph[];
  closing: string;
  sender_name: string;
  tips: string[];
  meta: {
    generated_at: string;
    tone: CoverLetterTone;
    model: string;
    word_count: number;
    /** Anzahl KI-Floskeln, die automatisch entfernt wurden */
    cliches_fixed?: number;
    /** Welche Angaben aus dem Fragebogen eingeflossen sind (kurz) */
    personal_details?: string[];
    /** Kernanforderungen der Anzeige und ob das Anschreiben sie abdeckt */
    requirements?: { label: string; covered: boolean }[];
  };
  /** DIN-5008-Briefkopf (bei Vorschau sichtbar) */
  sender?: LetterSender;
  recipient?: LetterRecipient;
  place_date?: string;
}

export type ContactSalutation = 'frau' | 'herr' | 'divers' | 'unbekannt';

export interface LetterRecipient {
  company: string;
  salutation: ContactSalutation;
  title: string;      // z. B. "Dr."
  name: string;       // Vor- und Nachname
  role: string;       // z. B. "Head of People"
  department: string; // z. B. "Personalabteilung"
  street: string;
  zip_city: string;
  reference: string;  // Kennziffer / Referenznummer
}

export interface LetterSender {
  name: string;
  street: string;
  zip_city: string;
  phone: string;
  email: string;
}

export const EMPTY_RECIPIENT: LetterRecipient = {
  company: '', salutation: 'unbekannt', title: '', name: '', role: '', department: '', street: '', zip_city: '', reference: '',
};
export const EMPTY_SENDER: LetterSender = { name: '', street: '', zip_city: '', phone: '', email: '' };

/** Anrede nach DIN 5008 / üblicher Praxis */
export function buildSalutation(r: Pick<LetterRecipient, 'salutation' | 'title' | 'name'>): string {
  const last = r.name.trim().split(/\s+/).slice(-1)[0] ?? '';
  const t = r.title.trim() ? `${r.title.trim()} ` : '';
  if (r.salutation === 'frau' && last) return `Sehr geehrte Frau ${t}${last},`;
  if (r.salutation === 'herr' && last) return `Sehr geehrter Herr ${t}${last},`;
  if (r.salutation === 'divers' && r.name.trim()) return `Guten Tag ${t}${r.name.trim()},`;
  return 'Sehr geehrte Damen und Herren,';
}

export interface CoverLetter {
  id: string;
  application_id: string;
  tone: CoverLetterTone;
  is_unlocked: boolean;
  unlocked_via: 'credit' | 'stripe' | 'stripe_addon' | 'admin' | null;
  rewrite_count: number;
  regenerate_count: number;
  created_at: string;
  updated_at: string;
  letter: CoverLetterContent;
}

export const COVER_LETTER_PRICE = { single: 3.99, addon: 2.99 } as const;
export const formatEuro = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

export const TONE_OPTIONS: { id: CoverLetterTone; label: string; hint: string }[] = [
  { id: 'professionell', label: 'Professionell', hint: 'Klassisch & sachlich' },
  { id: 'modern', label: 'Modern', hint: 'Direkt & persönlich' },
  { id: 'selbstbewusst', label: 'Selbstbewusst', hint: 'Ergebnisse vorne' },
  { id: 'herzlich', label: 'Herzlich', hint: 'Motivation & Werte' },
];

export const ROLE_LABEL: Record<ParagraphRole, string> = {
  einstieg: 'Einstieg',
  motivation: 'Motivation',
  qualifikation: 'Qualifikation',
  mehrwert: 'Dein Mehrwert',
  abschluss: 'Abschluss',
};

export const REWRITE_PRESETS = [
  'Kürzer und prägnanter',
  'Konkreter mit Ergebnissen aus meinem CV',
  'Selbstbewusster formulieren',
  'Stärkerer Bezug zur Stellenanzeige',
];

// ─────────────────────────────────────────────────────────────────────
// Fragebogen ("Brief") – macht das Anschreiben individuell
// ─────────────────────────────────────────────────────────────────────
export type CareerLevel =
  | 'einstieg' | 'young_professional' | 'professional' | 'senior' | 'fuehrung' | 'quereinstieg' | 'wiedereinstieg';
export type CompanyCulture =
  | 'konzern' | 'mittelstand' | 'startup' | 'oeffentlich' | 'agentur' | 'sozial' | 'handwerk' | 'unsicher';
export type SpecialCase = 'none' | 'luecke' | 'quereinstieg' | 'kurze_station' | 'umzug' | 'ueberqualifiziert' | 'wiedereinstieg';
export type StartOption = 'sofort' | 'kuendigungsfrist' | 'datum' | 'offen';
export type LetterLength = 'kompakt' | 'standard';

export interface CoverLetterBrief {
  level?: CareerLevel;
  culture?: CompanyCulture;
  motivations: string[];
  motivation_own_words: string;
  highlights: string[];
  proudest: string;
  special: SpecialCase;
  special_note: string;
  start: StartOption;
  start_detail: string;
  salary: string;
  tone: CoverLetterTone;
  length: LetterLength;
  recipient: LetterRecipient;
  sender: LetterSender;
}

export const EMPTY_BRIEF: CoverLetterBrief = {
  motivations: [],
  motivation_own_words: '',
  highlights: [],
  proudest: '',
  special: 'none',
  special_note: '',
  start: 'offen',
  start_detail: '',
  salary: '',
  tone: 'professionell',
  length: 'standard',
  recipient: EMPTY_RECIPIENT,
  sender: EMPTY_SENDER,
};

type Opt<T extends string> = { id: T; label: string; hint?: string; emoji?: string };

export const LEVEL_OPTIONS: Opt<CareerLevel>[] = [
  { id: 'einstieg', label: 'Berufseinstieg', hint: 'Ausbildung, Studium, Praktika', emoji: '🎓' },
  { id: 'young_professional', label: 'Erste Berufsjahre', hint: '1–3 Jahre Erfahrung', emoji: '🌱' },
  { id: 'professional', label: 'Berufserfahren', hint: '3–7 Jahre', emoji: '💼' },
  { id: 'senior', label: 'Senior / Expert:in', hint: '7+ Jahre, Fachverantwortung', emoji: '🎯' },
  { id: 'fuehrung', label: 'Führungskraft', hint: 'Team- oder Bereichsleitung', emoji: '🧭' },
  { id: 'quereinstieg', label: 'Quereinstieg', hint: 'Neue Branche oder Rolle', emoji: '🔀' },
  { id: 'wiedereinstieg', label: 'Wiedereinstieg', hint: 'Nach Elternzeit, Pause o. Ä.', emoji: '🔁' },
];

export const CULTURE_OPTIONS: Opt<CompanyCulture>[] = [
  { id: 'konzern', label: 'Konzern', emoji: '🏢' },
  { id: 'mittelstand', label: 'Mittelstand', emoji: '🏭' },
  { id: 'startup', label: 'Startup / Scale-up', emoji: '🚀' },
  { id: 'oeffentlich', label: 'Öffentlicher Dienst', emoji: '🏛️' },
  { id: 'agentur', label: 'Agentur / Beratung', emoji: '💡' },
  { id: 'sozial', label: 'Sozial / Gesundheit / Bildung', emoji: '🤝' },
  { id: 'handwerk', label: 'Handwerk / Produktion / Logistik', emoji: '🔧' },
  { id: 'unsicher', label: 'Weiß ich nicht', emoji: '🤷' },
];

export const MOTIVATION_OPTIONS: Opt<string>[] = [
  { id: 'produkt', label: 'Produkt oder Mission überzeugt mich', emoji: '✨' },
  { id: 'naechster_schritt', label: 'Nächster Karriereschritt / mehr Verantwortung', emoji: '📈' },
  { id: 'fachlich', label: 'Die Aufgaben passen genau zu mir', emoji: '🧩' },
  { id: 'lernen', label: 'Ich will mich fachlich weiterentwickeln', emoji: '📚' },
  { id: 'kultur', label: 'Team, Werte, Arbeitsweise', emoji: '🫶' },
  { id: 'branche', label: 'Ich will in diese Branche', emoji: '🔭' },
  { id: 'region', label: 'Standort / Region', emoji: '📍' },
  { id: 'empfehlung', label: 'Empfehlung / Kontakt im Unternehmen', emoji: '🗣️' },
];

export const SPECIAL_OPTIONS: Opt<SpecialCase>[] = [
  { id: 'none', label: 'Nichts davon', emoji: '👍' },
  { id: 'quereinstieg', label: 'Ich wechsle Branche/Rolle', emoji: '🔀' },
  { id: 'luecke', label: 'Lücke im Lebenslauf', emoji: '⏸️' },
  { id: 'kurze_station', label: 'Kurze Station / schneller Wechsel', emoji: '⏱️' },
  { id: 'umzug', label: 'Ich ziehe in die Region', emoji: '📦' },
  { id: 'ueberqualifiziert', label: 'Ich wirke evtl. überqualifiziert', emoji: '🎚️' },
  { id: 'wiedereinstieg', label: 'Wiedereinstieg nach Pause', emoji: '🔁' },
];

export const START_OPTIONS: Opt<StartOption>[] = [
  { id: 'sofort', label: 'Ab sofort' },
  { id: 'kuendigungsfrist', label: 'Nach Kündigungsfrist' },
  { id: 'datum', label: 'Ab Datum' },
  { id: 'offen', label: 'Nicht erwähnen' },
];

export const LENGTH_OPTIONS: Opt<LetterLength>[] = [
  { id: 'kompakt', label: 'Kompakt', hint: '~200 Wörter, ideal für Online-Formulare' },
  { id: 'standard', label: 'Klassisch', hint: '~300 Wörter, eine DIN-A4-Seite' },
];
