// src/utils/cvDataCheck.ts
//
// Stufe 0 der CV-Optimierung: deterministische Datenprüfung VOR dem KI-Aufruf.
// Findet Widersprüche, die keine KI auflösen darf, ohne Fakten zu erfinden:
//   - parallele Vollzeit-Stationen ohne Kennzeichnung (nebenberuflich/Teilzeit)
//   - Lücken > 3 Monate
//   - verdächtige Standard-Daten (alles im Januar, Monat fehlt)
//   - fehlende Enddaten bei nicht laufenden Stationen
//   - laufendes Studium/Ausbildung ohne "aktuell"-Kennzeichnung
// Ergebnis wird in JobTargeting.tsx angezeigt, bevor die Optimierung startet.

export type CvIssueSeverity = 'warning' | 'info';

export interface CvIssue {
  severity: CvIssueSeverity;
  message: string;
}

interface Period {
  label: string;
  start: number; // Monatsindex: Jahr * 12 + (Monat - 1)
  end: number;
  fullTime: boolean;
  startMonthKnown: boolean;
  endMonthKnown: boolean;
  isCurrent: boolean;
  isEducation: boolean;
}

const GAP_THRESHOLD_MONTHS = 3;
const PART_TIME_TYPES = new Set(['part-time', 'working-student', 'internship', 'freelance', 'mini-job']);

const now = new Date();
const NOW_INDEX = now.getFullYear() * 12 + now.getMonth();

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
}

/** Parst "2020-01", "01/2020", "01.2020", "2020" (+ optionaler Monat). */
function parseYearMonth(raw: unknown, monthRaw?: unknown): { index: number; monthKnown: boolean } | null {
  const s = str(raw);
  const explicitMonth = Number.parseInt(str(monthRaw), 10);

  let year: number | null = null;
  let month: number | null = null;

  let m = s.match(/^(\d{4})-(\d{1,2})/);
  if (m) { year = +m[1]; month = +m[2]; }
  if (!m && (m = s.match(/^(\d{1,2})[./](\d{4})$/))) { month = +m[1]; year = +m[2]; }
  if (!m && (m = s.match(/(\d{4})/))) { year = +m[1]; }

  if (year === null) return null;
  if (month === null && explicitMonth >= 1 && explicitMonth <= 12) month = explicitMonth;

  const monthKnown = month !== null && month >= 1 && month <= 12;
  return { index: year * 12 + ((monthKnown ? month! : 1) - 1), monthKnown };
}

function formatIndex(i: number): string {
  const year = Math.floor(i / 12);
  const month = (i % 12) + 1;
  return `${String(month).padStart(2, '0')}/${year}`;
}

function collectPeriods(cv: any, issues: CvIssue[]): Period[] {
  const periods: Period[] = [];

  const push = (
    label: string,
    startRaw: unknown, startMonth: unknown,
    endRaw: unknown, endMonth: unknown,
    isCurrent: boolean, fullTime: boolean, isEducation: boolean,
  ) => {
    const start = parseYearMonth(startRaw, startMonth);
    if (!start) return;
    const end = isCurrent ? { index: NOW_INDEX, monthKnown: true } : parseYearMonth(endRaw, endMonth);
    if (!end) {
      issues.push({ severity: 'warning', message: `${label}: Enddatum fehlt – bitte ergänzen oder als „aktuell" markieren.` });
      return;
    }
    periods.push({
      label,
      start: start.index,
      end: Math.max(end.index, start.index),
      fullTime,
      startMonthKnown: start.monthKnown,
      endMonthKnown: end.monthKnown,
      isCurrent,
      isEducation,
    });
  };

  const arr = (v: unknown): any[] => (Array.isArray(v) ? v : []);

  for (const e of arr(cv?.workExperiences)) {
    const label = [str(e.jobTitle), str(e.company)].filter(Boolean).join(' – ') || 'Berufserfahrung';
    const current = !!e.current || /heute|aktuell|present/i.test(str(e.endDate));
    push(label, e.startDate, e.startMonth, e.endDate, e.endMonth, current, !PART_TIME_TYPES.has(str(e.employmentType)), false);
  }
  for (const e of arr(cv?.internships)) {
    const label = [str(e.jobTitle ?? e.title), str(e.company)].filter(Boolean).join(' – ') || 'Praktikum';
    push(label, e.startDate, e.startMonth, e.endDate, e.endMonth, !!e.current, false, false);
  }
  for (const e of arr(cv?.professionalEducation)) {
    const label = [str(e.degree), str(e.institution)].filter(Boolean).join(' – ') || 'Ausbildung';
    const isApprenticeship = e.type === 'apprenticeship';
    push(label, e.startYear, e.startMonth, e.endYear, e.endMonth, !!e.current, isApprenticeship, true);
    const end = parseYearMonth(e.endYear, e.endMonth);
    if (!e.current && end && end.index > NOW_INDEX) {
      issues.push({ severity: 'info', message: `${label}: Ende liegt in der Zukunft – als „laufend" bzw. „voraussichtlich ${formatIndex(end.index)}" kennzeichnen.` });
    }
  }
  for (const e of arr(cv?.schoolEducation)) {
    const label = [str(e.graduation || e.type), str(e.school)].filter(Boolean).join(' – ') || 'Schule';
    push(label, e.startYear, e.startMonth, e.endYear || e.year, e.endMonth, false, false, true);
  }
  return periods;
}

export function checkCvData(cv: any): CvIssue[] {
  const issues: CvIssue[] = [];
  const periods = collectPeriods(cv, issues);

  // 1) Parallele Vollzeit-Stationen (> 1 Monat Überschneidung)
  const fullTime = periods.filter((p) => p.fullTime);
  for (let i = 0; i < fullTime.length; i++) {
    for (let j = i + 1; j < fullTime.length; j++) {
      const a = fullTime[i];
      const b = fullTime[j];
      const overlap = Math.min(a.end, b.end) - Math.max(a.start, b.start);
      if (overlap > 1) {
        issues.push({
          severity: 'warning',
          message:
            `„${a.label}" und „${b.label}" überschneiden sich ` +
            `(${formatIndex(Math.max(a.start, b.start))} – ${formatIndex(Math.min(a.end, b.end))}). ` +
            'Bitte Daten prüfen oder eine Station als Teilzeit/nebenberuflich kennzeichnen.',
        });
      }
    }
  }

  // 2) Lücken > 3 Monate zwischen allen Stationen (inkl. Bildung)
  const sorted = [...periods].sort((a, b) => a.start - b.start);
  let coveredUntil = sorted.length ? sorted[0].end : NOW_INDEX;
  for (const p of sorted.slice(1)) {
    const gap = p.start - coveredUntil - 1;
    if (gap > GAP_THRESHOLD_MONTHS) {
      issues.push({
        severity: 'warning',
        message:
          `Lücke von ${formatIndex(coveredUntil + 1)} bis ${formatIndex(p.start - 1)} (${gap} Monate). ` +
          'Bitte erklären (z. B. Weiterbildung, Elternzeit, Neuorientierung) oder fehlende Station ergänzen.',
      });
    }
    coveredUntil = Math.max(coveredUntil, p.end);
  }
  if (sorted.length && NOW_INDEX - coveredUntil - 1 > GAP_THRESHOLD_MONTHS) {
    issues.push({
      severity: 'warning',
      message: `Seit ${formatIndex(coveredUntil + 1)} ist keine Station eingetragen. Bitte aktuelle Tätigkeit ergänzen oder erklären.`,
    });
  }

  // 3) Verdächtige Standard-Daten
  const withMonths = periods.filter((p) => p.startMonthKnown && (p.endMonthKnown || p.isCurrent));
  const januaryOnly = withMonths.filter((p) => p.start % 12 === 0 && (p.isCurrent || p.end % 12 === 0));
  if (januaryOnly.length >= 3) {
    issues.push({
      severity: 'info',
      message: `${januaryOnly.length} Stationen beginnen und enden im Januar – bitte prüfen, ob das die echten Monate sind.`,
    });
  }
  const missingMonth = periods.filter((p) => !p.isEducation && (!p.startMonthKnown || (!p.endMonthKnown && !p.isCurrent)));
  for (const p of missingMonth) {
    issues.push({ severity: 'info', message: `${p.label}: Monat fehlt – Recruiter erwarten das Format MM/JJJJ.` });
  }

  return issues;
}