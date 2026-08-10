// src/config/cvQuestions.ts
// ─────────────────────────────────────────────────────────────────────────────
// Konversationeller Fragen- & Trigger-Katalog ("Taxfix-Stil").
//
// Reine Daten, render-agnostisch: Die (neuen) Step-Komponenten lesen hieraus,
// egal wie der Verzweigungs-Mechanismus final aussieht. Drei Fragetypen:
//
//   1. GATE      – Ja/Nein bzw. Auswahl, die ganze Sektionen ein-/ausblendet.
//                  Setzt Flags auf cvData.flags -> Skip-Prädikate im Wizard.
//   2. CORE      – die Pflicht-/Kernfelder einer Sektion.
//   3. TRIGGER   – optionale Nachfragen, die vergessene, hochwertige Infos
//                  rausholen (Führung, Zahlen, Budget, Auszeichnungen ...).
//                  Triggers sind NIE Pflicht und immer überspringbar.
//
// Ziel: "Alle Infos für einen perfekten Lebenslauf" — ohne dass sich der
// Nutzer ausgefragt fühlt. Pro Station zeigen wir nur die Triggers, deren
// showIf() zutrifft, und rotieren/deckeln optional die Anzahl.
// ─────────────────────────────────────────────────────────────────────────────

import type { CVBuilderData } from '../types/cvBuilder';

export type QuestionKind =
  | 'gate'        // Verzweigung
  | 'single'      // eine Auswahl (auto-advance)
  | 'multi'       // Mehrfachauswahl (Chips)
  | 'text'        // kurzer Freitext
  | 'longtext'    // langer Freitext
  | 'metric'      // gezielte Kennzahl (Zahl/%/€/Zeitraum)
  | 'entryList';  // wiederholbare Einträge (Stationen, Ausbildungen)

export interface ChoiceOption {
  value: string;
  label: string;
  hint?: string;   // kleiner Untertitel auf der Karte
  icon?: string;   // Tabler-Icon-Name (ohne "ti ti-")
}

// ── Gate-Frage: blendet Sektionen ein/aus ───────────────────────────────────
export interface GateQuestion {
  id: string;
  prompt: string;
  helper?: string;
  kind: 'gate';
  options: Array<ChoiceOption & {
    // Partieller Patch auf cvData.flags bei Auswahl dieser Option.
    setsFlags?: Partial<NonNullable<CVBuilderData['flags']>>;
  }>;
}

// ── Trigger-/Kernfrage innerhalb einer Sektion ──────────────────────────────
export interface FieldQuestion {
  id: string;
  prompt: string;
  helper?: string;
  kind: Exclude<QuestionKind, 'gate' | 'entryList'>;
  // Ziel-Feld als Dot-Path relativ zum jeweiligen Eintrag,
  // z. B. "teamSize" auf WorkExperience oder "thesisTitle" auf Education.
  field: string;
  placeholder?: string;
  options?: ChoiceOption[];
  optional?: boolean;   // Triggers: true. Kernfragen: false.
  // Kontext-Bedingung: nur zeigen, wenn sinnvoll (z. B. Führung nur bei
  // Rollen ab Junior, Note nur wenn stark). entry = aktueller Eintrag.
  showIf?: (entry: any, data: CVBuilderData) => boolean;
}

export interface SectionQuestions {
  section: string;
  gate?: GateQuestion;         // optional — nicht jede Sektion verzweigt
  core: FieldQuestion[];       // Pflicht-/Kernfragen
  triggers: FieldQuestion[];   // Achievement-Mining
}

// ═════════════════════════════════════════════════════════════════════════════
// GATE-FRAGEN (Kapitel-Verzweigung)
// ═════════════════════════════════════════════════════════════════════════════

export const GATE_WORK_EXPERIENCE: GateQuestion = {
  id: 'gate.workExperience',
  prompt: 'Hast du schon Berufserfahrung gesammelt?',
  helper: 'Zählt auch: Nebenjobs, Werkstudi, Aushilfe oder Praktika.',
  kind: 'gate',
  options: [
    { value: 'yes', label: 'Ja, ich habe schon gearbeitet', icon: 'briefcase', setsFlags: { hasWorkExperience: true } },
    { value: 'no', label: 'Noch nicht', hint: 'Wir überspringen diesen Teil für dich', icon: 'school', setsFlags: { hasWorkExperience: false } },
  ],
};

export const GATE_FORMAL_EDUCATION: GateQuestion = {
  id: 'gate.formalEducation',
  prompt: 'Machst oder hast du eine Ausbildung oder ein Studium?',
  helper: 'Schulabschluss fragen wir separat — hier geht es um Ausbildung, Studium oder Weiterbildung.',
  kind: 'gate',
  options: [
    { value: 'yes', label: 'Ja', icon: 'certificate', setsFlags: { hasFormalEducation: true } },
    { value: 'no', label: 'Nein, nur Schule', hint: 'Überspringen wir', icon: 'arrow-right', setsFlags: { hasFormalEducation: false } },
  ],
};

export const GATE_OTHER_LANGUAGES: GateQuestion = {
  id: 'gate.otherLanguages',
  prompt: 'Sprichst du weitere Sprachen?',
  helper: 'Sprachen sind eins der stärksten, oft vergessenen CV-Signale.',
  kind: 'gate',
  options: [
    { value: 'yes', label: 'Ja, mindestens eine weitere', icon: 'language', setsFlags: { hasOtherLanguages: true } },
    { value: 'no', label: 'Nein', icon: 'arrow-right', setsFlags: { hasOtherLanguages: false } },
  ],
};

// Das "Noch etwas?"-Opt-in-Cluster ersetzt die 3-4 toten Pflicht-Screens
// in der Mitte. Multi-Select: gewählte Chips landen in flags.extras,
// die Skip-Prädikate zeigen genau die gewählten Mini-Sektionen.
export const GATE_EXTRAS: GateQuestion = {
  id: 'gate.extras',
  prompt: 'Möchtest du noch etwas ergänzen?',
  helper: 'Alles hier ist optional — such dir aus, was auf dich zutrifft.',
  kind: 'gate',
  options: [
    { value: 'projects', label: 'Projekte', hint: 'Uni, privat, Kunde', icon: 'bulb' },
    { value: 'stipendien', label: 'Stipendien', icon: 'award' },
    { value: 'volunteer', label: 'Ehrenamt', icon: 'heart-handshake' },
    { value: 'certificates', label: 'Zertifikate & Auszeichnungen', icon: 'certificate' },
    { value: 'hobbies', label: 'Hobbys', icon: 'ball-basketball' },
  ],
};

// ═════════════════════════════════════════════════════════════════════════════
// TRIGGER-FRAGEN pro Sektion (die "raustriggernden" Nachfragen)
// ═════════════════════════════════════════════════════════════════════════════

// --- Berufserfahrung: hier sitzt das meiste vergessene Gold ------------------
const WORK_TRIGGERS: FieldQuestion[] = [
  {
    id: 'work.leadership',
    prompt: 'Hast du jemanden geführt, eingearbeitet oder angeleitet?',
    helper: 'Auch informell zählt — z. B. Praktikanten oder ein kleines Projektteam.',
    kind: 'single',
    field: 'teamSize',
    optional: true,
    options: [
      { value: '', label: 'Nein' },
      { value: 'informell', label: 'Ja, informell' },
      { value: 'disziplinarisch', label: 'Ja, mit Führungsverantwortung' },
    ],
  },
  {
    id: 'work.teamSizeNumber',
    prompt: 'Wie viele Personen waren das?',
    kind: 'text',
    field: 'teamSize',
    placeholder: 'z. B. 4 Personen',
    optional: true,
    showIf: (e) => !!e?.teamSize && e.teamSize !== '' && e.teamSize !== 'Nein',
  },
  {
    id: 'work.impactNumber',
    prompt: 'Gibt es eine Zahl, die sich durch deine Arbeit spürbar verändert hat?',
    helper: 'z. B. Umsatz, Bearbeitungszeit, Fehlerquote, Zufriedenheit, Reichweite, Kosten.',
    kind: 'metric',
    field: 'achievementsRaw',
    placeholder: 'z. B. Bearbeitungszeit um 30 % gesenkt',
    optional: true,
  },
  {
    id: 'work.budgetRevenue',
    prompt: 'Warst du für ein Budget oder einen Umsatz (mit)verantwortlich?',
    helper: 'Auch Mitverantwortung zählt.',
    kind: 'text',
    field: 'budget',
    placeholder: 'z. B. 100.000 € Jahresbudget',
    optional: true,
  },
  {
    id: 'work.market',
    prompt: 'Für welchen Bereich oder Markt warst du zuständig?',
    helper: 'z. B. B2B, B2C, Key Accounts, DACH-Region, ein bestimmtes Produkt.',
    kind: 'text',
    field: 'customersMarket',
    placeholder: 'z. B. B2B Key Accounts, DACH',
    optional: true,
  },
  {
    id: 'work.builtSomething',
    prompt: 'Hast du etwas eingeführt oder aufgebaut, das es vorher nicht gab?',
    helper: 'Ein Prozess, ein Tool, eine Struktur, eine Kampagne …',
    kind: 'longtext',
    field: 'achievementsRaw',
    placeholder: 'z. B. Onboarding-Prozess für neue Kollegen aufgebaut',
    optional: true,
  },
  {
    id: 'work.tools',
    prompt: 'Mit welchen Tools oder Programmen hast du hauptsächlich gearbeitet?',
    kind: 'multi',
    field: 'tools',
    placeholder: 'z. B. Excel, Salesforce, SAP, Figma',
    optional: true,
  },
  {
    id: 'work.recognition',
    prompt: 'Gab es eine Beförderung, Auszeichnung oder besonderes Lob?',
    helper: 'Solche Signale werden fast immer vergessen — sind aber sehr wertvoll.',
    kind: 'longtext',
    field: 'achievementsRaw',
    placeholder: 'z. B. nach 1 Jahr zum Teamlead befördert',
    optional: true,
  },
];

// --- Ausbildung / Studium ----------------------------------------------------
const EDUCATION_TRIGGERS: FieldQuestion[] = [
  {
    id: 'edu.focus',
    prompt: 'Welche Schwerpunkte oder relevanten Module hattest du?',
    helper: 'Besonders das, was zum Wunschjob passt.',
    kind: 'multi',
    field: 'focus',
    placeholder: 'z. B. Controlling, Marketing, Datenanalyse',
    optional: true,
  },
  {
    id: 'edu.thesis',
    prompt: 'Wie hieß deine Abschlussarbeit?',
    helper: 'Titel genügt — zeigt fachliche Tiefe.',
    kind: 'text',
    field: 'thesisTitle',
    placeholder: 'Titel deiner Bachelor-/Masterarbeit',
    optional: true,
  },
  {
    id: 'edu.grade',
    prompt: 'War deine Abschlussnote stark? Dann nimm sie mit rein.',
    helper: 'Nur wenn sie für dich spricht — sonst einfach überspringen.',
    kind: 'text',
    field: 'grades',
    placeholder: 'z. B. 1,7',
    optional: true,
  },
];

// --- Projekte ----------------------------------------------------------------
const PROJECT_TRIGGERS: FieldQuestion[] = [
  {
    id: 'proj.role',
    prompt: 'Was war deine Rolle im Projekt?',
    kind: 'text',
    field: 'role',
    placeholder: 'z. B. Projektleitung, Entwicklung, Konzept',
    optional: true,
  },
  {
    id: 'proj.result',
    prompt: 'Was kam am Ende dabei heraus?',
    helper: 'Ein Ergebnis, eine Zahl, ein sichtbares Produkt.',
    kind: 'longtext',
    field: 'result',
    placeholder: 'z. B. App mit 500 aktiven Nutzern gelauncht',
    optional: true,
  },
  {
    id: 'proj.link',
    prompt: 'Gibt es etwas zum Anschauen?',
    helper: 'Live-Demo, Repo, Case-Study — optional.',
    kind: 'text',
    field: 'link',
    placeholder: 'https://…',
    optional: true,
  },
];

// --- Ehrenamt ----------------------------------------------------------------
const VOLUNTEER_TRIGGERS: FieldQuestion[] = [
  {
    id: 'vol.impact',
    prompt: 'Was hast du dort bewirkt?',
    helper: 'Auch kleine, konkrete Wirkung zählt.',
    kind: 'longtext',
    field: 'impact',
    placeholder: 'z. B. Spendenlauf mit 2.000 € Erlös organisiert',
    optional: true,
  },
];

// --- Persönliche Daten (leicht vergessene Profile & Fakten) ------------------
const PERSONAL_TRIGGERS: FieldQuestion[] = [
  {
    id: 'pers.headline',
    prompt: 'Wie würdest du dich in einer Zeile beschreiben?',
    helper: 'Deine Überschrift ganz oben im CV — z. B. "Marketing Manager · B2B SaaS".',
    kind: 'text',
    field: 'headline',
    placeholder: 'z. B. Werkstudent Data Analytics',
    optional: true,
  },
  {
    id: 'pers.linkedin',
    prompt: 'Hast du ein LinkedIn- oder Xing-Profil?',
    helper: 'Ein gepflegtes Profil erhöht die Rückmeldequote spürbar.',
    kind: 'text',
    field: 'linkedin',
    placeholder: 'linkedin.com/in/…',
    optional: true,
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// SEKTIONS-BÜNDEL (Gate + Core + Triggers)
// core lassen wir bewusst leer, wo die bestehenden Step-Komponenten die
// Kernfelder schon abfragen — hier definieren wir vor allem Gate + Triggers.
// ═════════════════════════════════════════════════════════════════════════════

export const SECTION_QUESTIONS: Record<string, SectionQuestions> = {
  personalData: {
    section: 'personalData',
    core: [],
    triggers: PERSONAL_TRIGGERS,
  },
  professionalEducation: {
    section: 'professionalEducation',
    gate: GATE_FORMAL_EDUCATION,
    core: [],
    triggers: EDUCATION_TRIGGERS,
  },
  workExperience: {
    section: 'workExperience',
    gate: GATE_WORK_EXPERIENCE,
    core: [],
    triggers: WORK_TRIGGERS,
  },
  projects: {
    section: 'projects',
    core: [],
    triggers: PROJECT_TRIGGERS,
  },
  volunteerWork: {
    section: 'volunteerWork',
    core: [],
    triggers: VOLUNTEER_TRIGGERS,
  },
  languages: {
    section: 'languages',
    gate: GATE_OTHER_LANGUAGES,
    core: [],
    triggers: [],
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// HELFER
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Liefert die für einen konkreten Eintrag sinnvollen Trigger-Fragen.
 * `limit` deckelt die Anzahl, damit sich niemand ausgefragt fühlt
 * (z. B. 3 stärkste Nachfragen pro Station).
 */
export function getTriggersFor(
  section: string,
  entry: any,
  data: CVBuilderData,
  limit?: number,
): FieldQuestion[] {
  const bundle = SECTION_QUESTIONS[section];
  if (!bundle) return [];
  const applicable = bundle.triggers.filter(t => !t.showIf || t.showIf(entry, data));
  return typeof limit === 'number' ? applicable.slice(0, limit) : applicable;
}

/** Ist ein Gate mit "Nein" beantwortet? -> Skip-Prädikat kann Sektion überspringen. */
export function isSectionSkipped(section: string, data: CVBuilderData): boolean {
  const flags = data.flags || {};
  switch (section) {
    case 'workExperience':
      return flags.hasWorkExperience === false;
    case 'professionalEducation':
      return flags.hasFormalEducation === false;
    case 'projects':
      return Array.isArray(flags.extras) && !flags.extras.includes('projects');
    case 'stipendien':
      return Array.isArray(flags.extras) && !flags.extras.includes('stipendien');
    case 'volunteerWork':
      return Array.isArray(flags.extras) && !flags.extras.includes('volunteer');
    case 'certificates':
      return Array.isArray(flags.extras) && !flags.extras.includes('certificates');
    case 'hobbies':
      return Array.isArray(flags.extras) && !flags.extras.includes('hobbies');
    default:
      return false;
  }
}