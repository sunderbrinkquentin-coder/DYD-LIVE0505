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

/**
 * Make schreibt missing_skills als String OHNE Array-Klammern:
 *   {"skill_name":"A",...}, {"skill_name":"B",...}
 * Das ist kein gültiges JSON. Hier wird der Wrapper ergänzt und
 * gap_severity von "High"/"Medium" auf Zahlen normalisiert.
 */
export function parseSkills(raw: unknown): RawSkill[] {
  const norm = (arr: any[]): RawSkill[] =>
    arr.filter(Boolean).map((s) => ({ ...s, gap_severity: toSeverity(s.gap_severity) }));

  if (!raw) return [];
  if (Array.isArray(raw)) return norm(raw);
  if (typeof raw === 'object') return norm([raw]);
  if (typeof raw !== 'string') return [];

  let s = raw.trim();
  if (!s) return [];
  if (s.startsWith('"')) { try { s = JSON.parse(s) as string; } catch { /* */ } }
  s = s.trim();
  if (!s) return [];
  if (!s.startsWith('[')) s = `[${s}]`;

  try {
    const p = JSON.parse(s);
    return norm(Array.isArray(p) ? p : [p]);
  } catch (e) {
    console.error('[parseSkills] unparsebar:', s.slice(0, 150), e);
    return [];
  }
}

/** Liest den Skill-Namen aus einer learning_paths-Zeile. */
export function skillFromPath(path: any): string | null {
  const sel = path?.skill;
  if (typeof sel === 'string' && sel) return sel;
  if (sel && typeof sel === 'object') return sel.skill_name || sel.name || null;
  return null;
}