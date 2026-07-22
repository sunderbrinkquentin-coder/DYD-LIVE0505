export interface RawSkill {
  skill_name?: string;
  name?: string;
  pitch?: string;
  gap_severity?: number;
  market_value_bonus?: string;
  category?: string;
  priority?: string;
  esco_code?: string;
}

const SEVERITY_MAP: Record<string, number> = {
  high: 5, hoch: 5, kritisch: 5, critical: 5,
  medium: 3, mittel: 3,
  low: 1, niedrig: 1,
};

function toSeverity(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (!Number.isNaN(n) && v.trim() !== '') return n;
    return SEVERITY_MAP[v.trim().toLowerCase()] ?? 3;
  }
  return 3;
}

export function skillDisplayName(s: RawSkill): string {
  return s.skill_name || s.name || '(unbenannt)';
}

/** Ergebnis des Parsens — unterscheidet "keine Skills" von "kaputte Daten". */
export type SkillParseStatus = 'ok' | 'empty' | 'prose' | 'unparsable';

export interface SkillParseResult {
  skills: RawSkill[];
  status: SkillParseStatus;
  /** Rohtext-Anfang, falls das Feld Prosa statt JSON enthielt */
  raw?: string;
}

/** Markdown-Fences entfernen, die das LLM gelegentlich mitliefert. */
function stripFences(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

/**
 * Sammelt vollständige {...}-Objekte aus einem Text ein (klammer-balanciert,
 * string-aware). Rettet Skills auch dann, wenn Make Fließtext davor/danach
 * schreibt oder die Antwort mittendrin abgeschnitten ist.
 */
function extractObjects(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') { inString = true; continue; }
    if (ch === '{') { if (depth === 0) start = i; depth++; continue; }
    if (ch === '}') {
      depth--;
      if (depth === 0 && start >= 0) { out.push(text.slice(start, i + 1)); start = -1; }
      if (depth < 0) depth = 0;
    }
  }
  return out;
}

/**
 * Robuster Parser für `learning_paths.missing_skills`.
 *
 * Deckt alle bisher beobachteten Make-Formate ab:
 *  1. echtes Array            [{...},{...}]
 *  2. Liste ohne Klammern     {...}, {...}
 *  3. doppelt serialisiert    "[{...}]"
 *  4. Markdown-Fences         ```json [...] ```
 *  5. Prosa mit JSON drin     "Hier deine Skills: {...}, {...}"
 *  6. reine Prosa             "Da keine vorhandenen Skills angegeben wurden…"
 *
 * Fall 6 liefert status 'prose' — das ist ein Datenfehler aus Make,
 * kein leeres Analyseergebnis, und sollte im UI unterschieden werden.
 */
export function parseSkillsDetailed(raw: unknown): SkillParseResult {
  const norm = (arr: any[]): RawSkill[] =>
    arr
      .filter((s) => s && typeof s === 'object')
      .map((s) => ({ ...s, gap_severity: toSeverity(s.gap_severity) }))
      .filter((s) => Boolean(s.skill_name || s.name));

  if (raw == null) return { skills: [], status: 'empty' };
  if (Array.isArray(raw)) {
    const skills = norm(raw);
    return { skills, status: skills.length ? 'ok' : 'empty' };
  }
  if (typeof raw === 'object') {
    const skills = norm([raw]);
    return { skills, status: skills.length ? 'ok' : 'empty' };
  }
  if (typeof raw !== 'string') return { skills: [], status: 'unparsable' };

  let s = stripFences(raw.trim());
  if (!s) return { skills: [], status: 'empty' };

  // doppelt serialisiert: '"[{...}]"' → einmal auspacken (ggf. mehrfach)
  for (let i = 0; i < 3 && s.startsWith('"'); i++) {
    try {
      const unwrapped = JSON.parse(s);
      if (typeof unwrapped !== 'string') break;
      s = stripFences(unwrapped.trim());
    } catch {
      break;
    }
  }
  if (!s) return { skills: [], status: 'empty' };

  // Direktversuch, ggf. mit ergänzten Klammern
  const candidates = s.startsWith('[') || s.startsWith('{') ? [s, `[${s}]`] : [`[${s}]`, s];
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      const skills = norm(Array.isArray(parsed) ? parsed : [parsed]);
      if (skills.length) return { skills, status: 'ok' };
    } catch {
      /* nächster Versuch */
    }
  }

  // Rettungsversuch: einzelne Objekte aus dem Text herausschneiden
  const chunks = extractObjects(s);
  if (chunks.length) {
    const recovered: any[] = [];
    for (const chunk of chunks) {
      try { recovered.push(JSON.parse(chunk)); } catch { /* Fragment überspringen */ }
    }
    const skills = norm(recovered);
    if (skills.length) {
      console.warn(
        `[parseSkills] ${skills.length} Skill(s) aus fehlerhaftem Feld gerettet ` +
          '— Make liefert kein sauberes JSON.'
      );
      return { skills, status: 'ok' };
    }
  }

  // Kein einziges Objekt im Feld → das LLM hat Prosa geschrieben
  const looksLikeProse = !s.includes('"skill_name"') && !s.includes('"name"');
  console.warn(
    `[parseSkills] ${looksLikeProse ? 'Prosa statt JSON' : 'unparsebar'}:`,
    s.slice(0, 200)
  );
  return {
    skills: [],
    status: looksLikeProse ? 'prose' : 'unparsable',
    raw: s.slice(0, 500),
  };
}

/** Abwärtskompatible Variante — liefert wie bisher nur das Array. */
export function parseSkills(raw: unknown): RawSkill[] {
  return parseSkillsDetailed(raw).skills;
}

/** Liest den Skill-Namen aus einer learning_paths-Zeile. */
export function skillFromPath(path: any): string | null {
  const sel = path?.skill;
  if (typeof sel === 'string' && sel) return sel;
  if (sel && typeof sel === 'object') return sel.skill_name || sel.name || null;
  return null;
}