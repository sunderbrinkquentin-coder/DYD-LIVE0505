// src/components/cv-templates/tokens.ts
//
// Zentrale Design-Tokens für alle CV-Templates.
//
// WARUM DIESE DATEI EXISTIERT:
// Vorher waren Farben in jedem Template hartkodiert. Beim Kopieren einer
// Sektion von Template A nach Template B wanderten die Farben mit — so
// entstand im Kreativ-Template weißer Text (#f9fafb) auf weißem Grund.
// Dieser Fehler ist mit Tokens strukturell nicht mehr möglich: ein Template
// kennt nur noch `t.text`, `t.muted`, `t.accent` — nie einen Hex-Wert.
//
// REGEL: Kein `#rrggbb` und kein `text-[#...]` mehr in den Template-Dateien.

export type TemplateId = 'modern' | 'classic' | 'minimal' | 'creative' | 'professional';

export interface TemplateTokens {
  /** Akzentfarbe: Überschriften, Bullets, Hervorhebungen */
  accent: string;
  /** Akzent, stark abgeschwächt: Trennlinien unter Überschriften */
  accentSoft: string;

  /** Primärer Fließtext und Titel */
  text: string;
  /** Sekundärtext: Institution, Firma, Datum, Niveau */
  muted: string;
  /** Tertiärtext: Ort, Randnotizen */
  faint: string;

  /** Rahmen von Karten und Trennlinien */
  border: string;
  /** Hintergrund von Karten */
  surface: string;
  /** Hintergrund abgesetzter Blöcke (z. B. Profil-Box) */
  surfaceAlt: string;

  /** Chips: Skills, Soft Skills, Werte, Hobbys */
  chipBg: string;
  chipBorder: string;
  chipText: string;

  /** Chips für Soft Skills, falls das Template sie visuell trennt */
  chipAltBg: string;
  chipAltBorder: string;

  /** Aufzählungspunkt vor Bullets */
  bullet: string;
}

/**
 * Eine Schriftfamilie für alle Templates.
 *
 * Vorher setzten Classic explizit `Inter`, Kreativ und Minimal dagegen
 * Tailwinds `font-sans` (also `ui-sans-serif, system-ui, …`). Das sind zwei
 * verschiedene Schriften — der Grund, warum das Kreativ-Template "falsche
 * Schriftart" zeigte. Der PDF-Export lädt zudem nur Inter und Roboto vor
 * (`waitForFonts`), weshalb alles andere im Export als Fallback landete.
 *
 * Wenn ein Template künftig eine eigene Display-Schrift bekommt, muss sie
 * hier ergänzt UND in `waitForFonts()` vorgeladen werden. Sonst rendert der
 * Export still eine andere Schrift als die Preview.
 */
export const FONT_STACK = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';

/** Slate-Skala von Tailwind — als benannte Konstanten, damit die Tokens lesbar bleiben. */
const SLATE = {
  900: '#0f172a',
  800: '#1e293b',
  700: '#334155',
  600: '#475569',
  500: '#64748b',
  400: '#94a3b8',
  300: '#cbd5e1',
  200: '#e2e8f0',
  100: '#f1f5f9',
  50: '#f8fafc',
} as const;

const WHITE = '#ffffff';

export const TEMPLATE_TOKENS: Record<TemplateId, TemplateTokens> = {
  classic: {
    accent: '#1e3a8a',
    accentSoft: '#c7d2fe',
    text: SLATE[900],
    muted: SLATE[600],
    faint: SLATE[500],
    border: SLATE[200],
    surface: WHITE,
    surfaceAlt: SLATE[50],
    chipBg: SLATE[50],
    chipBorder: SLATE[200],
    chipText: SLATE[700],
    chipAltBg: WHITE,
    chipAltBorder: SLATE[200],
    bullet: '#1e3a8a',
  },

  minimal: {
    accent: SLATE[600],
    accentSoft: SLATE[300],
    text: SLATE[900],
    muted: SLATE[600],
    faint: SLATE[400],
    border: SLATE[200],
    surface: WHITE,
    surfaceAlt: SLATE[50],
    chipBg: SLATE[100],
    chipBorder: SLATE[300],
    chipText: SLATE[800],
    chipAltBg: WHITE,
    chipAltBorder: SLATE[200],
    bullet: SLATE[500],
  },

  creative: {
    accent: '#22c1c3',
    accentSoft: '#a5f3fc',
    text: SLATE[900],
    // Vorher: '#e2e8f0' — nahezu weiß auf weißem Grund. Das war der Bug.
    muted: SLATE[600],
    faint: SLATE[400],
    // Vorher: 'border-white/30' — unsichtbar. Ebenfalls der Bug.
    border: SLATE[200],
    surface: WHITE,
    surfaceAlt: SLATE[50],
    chipBg: '#f0fdfe',
    chipBorder: '#38bdf8',
    chipText: SLATE[800],
    chipAltBg: '#f5f3ff',
    chipAltBorder: '#a855f7',
    bullet: '#22c1c3',
  },

  modern: {
    accent: '#66c0b6',
    accentSoft: '#99f6e4',
    text: SLATE[900],
    muted: SLATE[600],
    faint: SLATE[400],
    border: SLATE[200],
    surface: WHITE,
    surfaceAlt: SLATE[50],
    chipBg: '#f0fdfa',
    chipBorder: '#66c0b6',
    chipText: SLATE[800],
    chipAltBg: WHITE,
    chipAltBorder: SLATE[200],
    bullet: '#66c0b6',
  },

  professional: {
    accent: '#0a192f',
    accentSoft: SLATE[300],
    text: SLATE[900],
    muted: SLATE[600],
    faint: SLATE[400],
    border: SLATE[200],
    surface: WHITE,
    surfaceAlt: SLATE[50],
    chipBg: SLATE[50],
    chipBorder: SLATE[300],
    chipText: SLATE[800],
    chipAltBg: WHITE,
    chipAltBorder: SLATE[200],
    bullet: '#0a192f',
  },
};

export function getTokens(id: TemplateId): TemplateTokens {
  return TEMPLATE_TOKENS[id] ?? TEMPLATE_TOKENS.classic;
}

// ── Schriftgrößen ────────────────────────────────────────────────────────────
//
// Der PDF-Exporter enthielt bisher eine "Sicherheitsnetz"-Regel, die jedes
// Element über 13px innerhalb einer Section auf 9px zwang — und damit auch
// Positionstitel zerstörte. Statt einer Notbremse im Exporter definieren wir
// die Skala hier und halten uns in den Templates daran.

export const FONT_SIZE = {
  name: '22px',
  jobTitle: '12px',
  sectionTitle: '9px',
  itemTitle: '11px',
  itemSubtitle: '10px',
  body: '9.5px',
  meta: '9px',
  chip: '9px',
} as const;

/**
 * Obergrenze für den Chip-Guard im PDF-Export.
 * Chips sind die einzige Stelle, an der iOS-Text-Boosting die Größe verzerrt
 * (input/contenteditable werden auf min. 16px gezwungen). Nur dort greift der
 * Exporter noch korrigierend ein — nicht mehr flächendeckend.
 */
export const CHIP_MAX_FONT_PX = 10;