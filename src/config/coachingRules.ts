// src/config/coachingRules.ts
// ─────────────────────────────────────────────────────────────────────────────
// Dynamischer Coach: statt statischer Sidebar-Strings bewerten Regeln die
// LIVE-Daten und feuern den relevantesten, wertvollsten Hinweis. Der Coach
// triggert vergessene Infos raus (Nudge) UND belohnt Fortschritt (Lob) —
// derselbe Slot wechselt den Inhalt, während getippt wird.
//
// Töne:
//   nudge     – "hier fehlt noch etwas Wertvolles" (orange)
//   guide     – kontextabhängiger Hinweis (teal, neutral)
//   praise    – Bestätigung, sobald ein starkes Feld gefüllt ist (teal)
//   progress  – Ermutigung / Fortschritt (teal)
//
// selectCoachTip() wählt die feuernde Regel mit der höchsten priority.
// Alles rein datengetrieben, keine UI hier drin.
// ─────────────────────────────────────────────────────────────────────────────

import type { CVBuilderData } from '../types/cvBuilder';

export type CoachTone = 'nudge' | 'guide' | 'praise' | 'progress';

export interface CoachContext {
  section: string;
  data: CVBuilderData;
  entry?: any; // aktueller Eintrag (z. B. aktive Berufsstation)
}

export interface CoachTip {
  id: string;
  tone: CoachTone;
  message: string;
  ctaLabel?: string;  // optionaler Button ("Zahl ergänzen")
  ctaField?: string;  // Zielfeld, zu dem gescrollt/gesprungen wird
}

interface CoachRule {
  id: string;
  priority: number; // höher = wichtiger
  when: (ctx: CoachContext) => boolean;
  tip: (ctx: CoachContext) => CoachTip;
}

// ── Helfer ───────────────────────────────────────────────────────────────────

const isBlank = (v: any): boolean =>
  v == null ||
  (typeof v === 'string' && v.trim() === '') ||
  (Array.isArray(v) && v.length === 0);

const hasDigit = (v: any): boolean => typeof v === 'string' && /\d/.test(v);

/** Enthält eine Berufsstation irgendeine belegbare Zahl? */
function stationHasNumber(entry: any): boolean {
  if (!entry) return false;
  if (!isBlank(entry.revenue) || !isBlank(entry.budget) || !isBlank(entry.teamSize)) return true;
  if (hasDigit(entry.achievementsRaw)) return true;
  const awm = entry.achievementsWithMetrics;
  if (Array.isArray(awm)) {
    return awm.some((a: any) => {
      const m = a?.metrics || {};
      return !isBlank(m.number) || !isBlank(m.percentage) || !isBlank(m.money) || hasDigit(m.description);
    });
  }
  return false;
}

const SENIOR_LEVELS = new Set(['senior', 'lead', 'head', 'director', 'cxo']);
const ROLE_LEVEL_LABEL: Record<string, string> = {
  senior: 'Senior', lead: 'Lead / Teamlead', head: 'Head of',
  director: 'Director / VP', cxo: 'C-Level',
};

// ── Regelsätze pro Sektion ────────────────────────────────────────────────────

const WORK_RULES: CoachRule[] = [
  {
    id: 'work.leadershipGap',
    priority: 90,
    when: ({ entry }) => SENIOR_LEVELS.has(entry?.roleLevel) && isBlank(entry?.teamSize),
    tip: ({ entry }) => ({
      id: 'work.leadershipGap',
      tone: 'guide',
      message: `Du hast „${ROLE_LEVEL_LABEL[entry.roleLevel] || 'diese Rolle'}" gewählt — wie viele Personen hast du geführt? Führung ist ein Top-Signal.`,
      ctaLabel: 'Teamgröße ergänzen',
      ctaField: 'teamSize',
    }),
  },
  {
    id: 'work.noNumber',
    priority: 80,
    when: ({ entry }) => !!entry?.jobTitle?.trim() && !stationHasNumber(entry),
    tip: () => ({
      id: 'work.noNumber',
      tone: 'nudge',
      message: 'Diese Station hat noch keine Zahl. Eine einzige Kennzahl (Umsatz, Zeit, %) macht den stärksten Unterschied.',
      ctaLabel: 'Zahl ergänzen',
      ctaField: 'achievements',
    }),
  },
  {
    id: 'work.noTools',
    priority: 60,
    when: ({ entry }) => isBlank(entry?.tools) && isBlank(entry?.toolsText),
    tip: () => ({
      id: 'work.noTools',
      tone: 'nudge',
      message: 'Trag die Tools ein, mit denen du gearbeitet hast — sie matchen 1:1 mit ATS-Scansystemen.',
      ctaLabel: 'Tools ergänzen',
      ctaField: 'tools',
    }),
  },
  {
    id: 'work.hasNumber',
    priority: 40,
    when: ({ entry }) => stationHasNumber(entry),
    tip: () => ({
      id: 'work.hasNumber',
      tone: 'praise',
      message: 'Stark — eine konkrete Zahl. Genau das scannen Recruiter zuerst.',
    }),
  },
  {
    id: 'work.recognition',
    priority: 25,
    when: ({ entry }) => !!entry?.company?.trim(),
    tip: () => ({
      id: 'work.recognition',
      tone: 'guide',
      message: 'Gab es eine Beförderung oder Auszeichnung? Solche Signale werden fast immer vergessen — und wirken enorm.',
    }),
  },
];

const INTERNSHIP_RULES: CoachRule[] = [
  {
    id: 'intern.noTasks',
    priority: 70,
    when: ({ entry }) => !!entry?.jobTitle && isBlank(entry?.tasks) && isBlank(entry?.bullets),
    tip: () => ({
      id: 'intern.noTasks',
      tone: 'nudge',
      message: 'Wähl 2–4 Punkte aus, was du dort gemacht hast — auch kleine Aufgaben zeigen Praxisbezug.',
    }),
  },
  {
    id: 'intern.encourage',
    priority: 30,
    when: ({ entry }) => Array.isArray(entry?.tasks) && entry.tasks.length >= 2,
    tip: () => ({
      id: 'intern.encourage',
      tone: 'praise',
      message: 'Perfekt — das zeigt Initiative. Jede praktische Erfahrung zählt im Lebenslauf.',
    }),
  },
];

const PERSONAL_RULES: CoachRule[] = [
  {
    id: 'pers.noHeadline',
    priority: 65,
    when: ({ data }) => isBlank(data.personalData?.headline),
    tip: () => ({
      id: 'pers.noHeadline',
      tone: 'guide',
      message: 'Eine Überschrift ganz oben („Marketing Manager · B2B") ordnet dich in 1 Sekunde ein — stark für den ersten Eindruck.',
      ctaLabel: 'Überschrift hinzufügen',
      ctaField: 'headline',
    }),
  },
  {
    id: 'pers.noLinkedin',
    priority: 50,
    when: ({ data }) => isBlank(data.personalData?.linkedin) && isBlank(data.personalData?.xing),
    tip: () => ({
      id: 'pers.noLinkedin',
      tone: 'nudge',
      message: 'Ein LinkedIn- oder Xing-Profil erhöht die Rückmeldequote spürbar. Lohnt sich fast immer.',
      ctaField: 'linkedin',
    }),
  },
  {
    id: 'pers.complete',
    priority: 30,
    when: ({ data }) => {
      const p = data.personalData || {};
      return !!(p.firstName && p.lastName && p.city && p.email && p.phone);
    },
    tip: () => ({
      id: 'pers.complete',
      tone: 'praise',
      message: 'Kontakt komplett — Recruiter können dich sofort erreichen.',
    }),
  },
];

const HARD_SKILLS_RULES: CoachRule[] = [
  {
    id: 'skills.tooFew',
    priority: 70,
    when: ({ data }) => (data.hardSkills?.length ?? 0) < 3,
    tip: () => ({
      id: 'skills.tooFew',
      tone: 'nudge',
      message: 'Recruiter erwarten meist 6–10 Hard Skills. Wähl ruhig alle, die du wirklich beherrschst.',
    }),
  },
  {
    id: 'skills.noLanguages',
    priority: 60,
    when: ({ data }) => (data.languages?.length ?? 0) === 0,
    tip: () => ({
      id: 'skills.noLanguages',
      tone: 'guide',
      message: 'Sprachen sind eins der stärksten, oft vergessenen CV-Signale — auch Grundkenntnisse zählen.',
    }),
  },
  {
    id: 'skills.solid',
    priority: 30,
    when: ({ data }) => (data.hardSkills?.length ?? 0) >= 6,
    tip: () => ({
      id: 'skills.solid',
      tone: 'praise',
      message: 'Gute Bandbreite — genug Substanz, damit ATS-Systeme dich sauber einordnen.',
    }),
  },
];

const SOFT_SKILLS_RULES: CoachRule[] = [
  {
    id: 'soft.noSituation',
    priority: 60,
    when: ({ data }) => (data.softSkills || []).some(s => isBlank(s.situation)),
    tip: () => ({
      id: 'soft.noSituation',
      tone: 'nudge',
      message: 'Ein Soft Skill mit konkreter Situation wirkt belegbar statt behauptet — „Führung: 4er-Team im Uniprojekt".',
    }),
  },
  {
    id: 'soft.strong',
    priority: 30,
    when: ({ data }) => {
      const s = data.softSkills || [];
      return s.length >= 4 && s.every(x => !isBlank(x.situation));
    },
    tip: () => ({
      id: 'soft.strong',
      tone: 'praise',
      message: 'Sehr glaubwürdig — Skills mit Situationen heben dich von Floskel-CVs ab.',
    }),
  },
];

const SCHOOL_RULES: CoachRule[] = [
  {
    id: 'school.noFocus',
    priority: 55,
    when: ({ data }) => {
      const started = (data.schoolEducation || []).filter(e => e.type || e.school);
      return started.length > 0 && started.some(e => !(e.focus && e.focus.length > 0));
    },
    tip: () => ({
      id: 'school.noFocus',
      tone: 'guide',
      message: 'Leistungskurse oder Schwerpunkte machen deinen Abschluss aussagekräftiger – besonders das, was zum Wunschjob passt.',
    }),
  },
  {
    id: 'school.solid',
    priority: 35,
    when: ({ data }) => (data.schoolEducation || []).some(e => !!(e.type && e.school && e.focus && e.focus.length > 0)),
    tip: () => ({
      id: 'school.solid',
      tone: 'praise',
      message: 'Sauber – Abschluss samt Schwerpunkten ist erfasst. Genau das ordnet dich klar ein.',
    }),
  },
];

const PROF_EDU_RULES: CoachRule[] = [
  {
    id: 'profedu.grades',
    priority: 40,
    when: ({ data }) =>
      (data.professionalEducation || []).some(
        e => !!(e.institution && e.degree && e.startYear && e.endYear) && (!e.grades || !e.grades.trim()),
      ),
    tip: () => ({
      id: 'profedu.grades',
      tone: 'guide',
      message: 'Ist deine Abschlussnote stark? Dann nimm sie mit rein – sie spricht sofort für dich. Sonst einfach weglassen.',
    }),
  },
  {
    id: 'profedu.solid',
    priority: 35,
    when: ({ data }) =>
      (data.professionalEducation || []).some(e => !!(e.institution && e.degree && e.startYear && e.endYear && e.grades && e.grades.trim())),
    tip: () => ({
      id: 'profedu.solid',
      tone: 'praise',
      message: 'Sauber – deine Qualifikation ist vollständig erfasst.',
    }),
  },
];

const PROJECT_RULES: CoachRule[] = [
  {
    id: 'proj.noBullets',
    priority: 50,
    when: ({ data }) => {
      const started = (data.projects || []).filter(p => p.title && p.title.trim());
      return started.length > 0 && started.some(p => !((p.bulletPoints || []).filter(Boolean).length > 0));
    },
    tip: () => ({
      id: 'proj.noBullets',
      tone: 'guide',
      message: 'Ein paar konkrete Punkte – was du gemacht und erreicht hast – machen dein Projekt erst aussagekräftig.',
    }),
  },
  {
    id: 'proj.solid',
    priority: 30,
    when: ({ data }) =>
      (data.projects || []).some(p => !!(p.title && p.title.trim()) && (p.bulletPoints || []).filter(Boolean).length > 0),
    tip: () => ({
      id: 'proj.solid',
      tone: 'praise',
      message: 'Stark – ein Projekt mit konkreten Punkten zeigt Verantwortung und Wirkung.',
    }),
  },
];

const RULES_BY_SECTION: Record<string, CoachRule[]> = {
  workExperience: WORK_RULES,
  internships: INTERNSHIP_RULES,
  personalData: PERSONAL_RULES,
  hardSkills: HARD_SKILLS_RULES,
  softSkills: SOFT_SKILLS_RULES,
  schoolEducation: SCHOOL_RULES,
  professionalEducation: PROF_EDU_RULES,
  // Gemergter Bildungs-Step: Schul- + Ausbildungs-Regeln zusammen.
  education: [...SCHOOL_RULES, ...PROF_EDU_RULES],
  projects: PROJECT_RULES,
};

// ── Öffentliche API ────────────────────────────────────────────────────────────

/**
 * Wählt den aktuell wertvollsten Tipp für eine Sektion anhand der Live-Daten.
 * Gibt null zurück, wenn keine Regel feuert (dann greift der Fallback in der UI).
 */
export function selectCoachTip(
  section: string,
  data: CVBuilderData,
  entry?: any,
): CoachTip | null {
  const rules = RULES_BY_SECTION[section];
  if (!rules) return null;
  const ctx: CoachContext = { section, data, entry };
  const firing = rules
    .filter(r => {
      try { return r.when(ctx); } catch { return false; }
    })
    .sort((a, b) => b.priority - a.priority);
  return firing.length > 0 ? firing[0].tip(ctx) : null;
}