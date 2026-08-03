// src/lib/parseMissingSkills.ts
//
// Robustes Auslesen von `learning_paths.missing_skills`.
//
// HINTERGRUND (per SQL-Diagnose bewiesen, nicht geraten):
// `missing_skills` kommt in DREI Formen vor:
//   1. Echtes jsonb-Array:            [{ skill_name: … }, …]
//   2. String mit Array:              "[{ \"skill_name\": … }, …]"
//   3. String OHNE Array-Klammern:    "{ \"skill_name\": … }, { … }"
//      → die aktuell häufigste Form. Ein nacktes JSON.parse WIRFT hier, weil
//        `{…}, {…}` kein gültiges JSON ist. Genau das ließ die alte
//        `parseSkills` still `[]` zurückgeben → keine Skills, blockierte
//        downstream die Zertifikatsausgabe.
//
// Die Reparatur ist deterministisch: fehlt die öffnende `[`, wird die Sequenz
// in `[ … ]` gewrappt und dann geparst.

export interface MissingSkill {
  skill_name: string;
  esco_code?: string | null;
  gap_severity?: string | null;
  pitch?: string | null;
  category?: string | null;
  [key: string]: unknown;
}

/**
 * Normalisiert einen einzelnen Roheintrag auf ein Objekt mit garantiertem
 * `skill_name`. Akzeptiert auch nackte Strings ("Kommunikation") und alternative
 * Feldnamen (`name`), damit die eine Array-Zeile und die String-Zeilen dasselbe
 * Ergebnis liefern.
 */
function normalizeSkill(raw: unknown): MissingSkill | null {
  if (typeof raw === "string") {
    const name = raw.trim();
    return name ? { skill_name: name } : null;
  }
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const name =
      (typeof obj.skill_name === "string" && obj.skill_name.trim()) ||
      (typeof obj.name === "string" && obj.name.trim()) ||
      "";
    if (!name) return null;
    return { ...obj, skill_name: name } as MissingSkill;
  }
  return null;
}

/**
 * Versucht, einen String zu einem Array zu parsen — deckt Form 2 und 3 ab.
 * Gibt bei Unlesbarem `null` zurück (nie werfen).
 */
function parseSkillString(input: string): unknown[] | null {
  let s = input.trim();
  if (!s) return null;

  // Form 2 evtl. doppelt-kodiert: '"[{…}]"' → einmal auspacken.
  if (s.startsWith('"') && s.endsWith('"')) {
    try {
      const unquoted = JSON.parse(s);
      if (typeof unquoted === "string") s = unquoted.trim();
    } catch {
      /* kein sauberer JSON-String — weiter mit Rohform */
    }
  }

  // Form 3: klammerlose Objekt-Sequenz `{…}, {…}` → in Array wrappen.
  if (!s.startsWith("[")) {
    if (s.endsWith(",")) s = s.slice(0, -1); // defensives Trailing-Komma
    s = `[${s}]`;
  }

  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return null;
  }
}

/**
 * Die einzige öffentliche Funktion. Gibt IMMER ein Array zurück — leer, wenn
 * nichts Verwertbares drinsteht. Wirft nie.
 */
export function parseMissingSkills(missingSkills: unknown): MissingSkill[] {
  if (missingSkills == null) return [];

  // Form 1: echtes Array
  if (Array.isArray(missingSkills)) {
    return missingSkills.map(normalizeSkill).filter((s): s is MissingSkill => s !== null);
  }

  // Form 2 / 3: String
  if (typeof missingSkills === "string") {
    const arr = parseSkillString(missingSkills);
    if (!arr) {
      console.warn("[parseMissingSkills] Konnte missing_skills nicht parsen:", missingSkills.slice(0, 120));
      return [];
    }
    return arr.map(normalizeSkill).filter((s): s is MissingSkill => s !== null);
  }

  // Einzelnes Objekt (Form „ein Skill, nicht in Array")
  if (typeof missingSkills === "object") {
    const one = normalizeSkill(missingSkills);
    return one ? [one] : [];
  }

  return [];
}