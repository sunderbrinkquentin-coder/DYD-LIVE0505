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
  meta: { generated_at: string; tone: CoverLetterTone; model: string; word_count: number };
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
