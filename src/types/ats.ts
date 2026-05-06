// src/types/ats.ts

export type AtsCategory = {
  score: number;
  feedback: string;
  verbesserung?: string;
};

export type AtsResult = {
  ats_score: number;
  top_todos?: Record<string, string>;

  // Profile context fields
  erfahrungslevel?: string;
  profil_vibe?: string;
  marktwert_2026?: string;
  missing_link?: string;

  // Flat score fields
  relevanz_score?: number;
  erfolge_score?: number;
  sprache_score?: number;
  usp_score?: number;
  formales_score?: number;
  tiefe_score?: number;

  // Flat feedback fields
  relevanz_feedback?: string;
  erfolge_feedback?: string;
  sprache_feedback?: string;
  usp_feedback?: string;
  formales_feedback?: string;
  tiefe_feedback?: string;

  // Flat zitat fields (current CV state, quoted evidence)
  relevanz_zitat?: string;
  erfolge_zitat?: string;
  sprache_zitat?: string;
  usp_zitat?: string;
  formales_zitat?: string;
  tiefe_zitat?: string;

  // Flat tipp fields (recruiter recommendation)
  relevanz_tipp?: string;
  erfolge_tipp?: string;
  sprache_tipp?: string;
  usp_tipp?: string;
  formales_tipp?: string;
  tiefe_tipp?: string;

  // Legacy nested format (backwards compatibility)
  relevanz_fokus?: AtsCategory;
  erfolge_kpis?: AtsCategory;
  klarheit_sprache?: AtsCategory;
  formales?: AtsCategory;
  usp_skills?: AtsCategory;
};

function extractStringValue(text: string, key: string): string | undefined {
  const regex = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's');
  const match = text.match(regex);
  if (!match) return undefined;
  return match[1]
    .replace(/\\n/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\\\\/g, '\\')
    .replace(/\\"/g, '"');
}

function extractNumberValue(text: string, key: string): number | undefined {
  const regex = new RegExp(`"${key}"\\s*:\\s*(\\d+(?:\\.\\d+)?)`);
  const match = text.match(regex);
  return match ? Number(match[1]) : undefined;
}

function extractCategoryBlock(text: string, categoryKey: string): AtsCategory | undefined {
  const blockRegex = new RegExp(
    `"${categoryKey}"\\s*:\\s*\\{([^{}]*(?:\\{[^{}]*\\}[^{}]*)*)\\}`,
    's'
  );
  const blockMatch = text.match(blockRegex);
  if (!blockMatch) return undefined;

  const block = blockMatch[1];
  const score = extractNumberValue(block, 'score');
  const feedback = extractStringValue(block, 'feedback');
  const verbesserung = extractStringValue(block, 'verbesserung');

  if (score === undefined || feedback === undefined) return undefined;

  const cat: AtsCategory = { score, feedback };
  if (verbesserung !== undefined) cat.verbesserung = verbesserung;
  return cat;
}

function extractTodosFromText(text: string): Record<string, string> {
  const todos: Record<string, string> = {};

  for (let i = 1; i <= 3; i++) {
    const val = extractStringValue(text, `todo_${i}`);
    if (val) todos[`To-do ${i}`] = val;
  }
  if (Object.keys(todos).length > 0) return todos;

  const todosMatch = text.match(/"top_todos"\s*:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
  if (todosMatch) {
    const block = todosMatch[1];
    const pairRegex = /"([^"]+)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g;
    let m: RegExpExecArray | null;
    while ((m = pairRegex.exec(block)) !== null) {
      const value = m[2]
        .replace(/\\n/g, ' ')
        .replace(/\\t/g, ' ')
        .replace(/\\r/g, ' ')
        .replace(/\\\\/g, '\\')
        .replace(/\\"/g, '"');
      todos[m[1]] = value;
    }
  }

  return todos;
}

function mapTodosFromObject(obj: any): Record<string, string> {
  const todos: Record<string, string> = {};
  for (let i = 1; i <= 3; i++) {
    const val = obj[`todo_${i}`];
    if (typeof val === 'string') todos[`To-do ${i}`] = val;
  }
  if (Object.keys(todos).length > 0) return todos;
  if (obj.top_todos && typeof obj.top_todos === 'object') {
    return obj.top_todos as Record<string, string>;
  }
  return todos;
}

const FLAT_SCORE_KEYS = ['relevanz_score', 'erfolge_score', 'sprache_score', 'usp_score', 'formales_score', 'tiefe_score'] as const;
const FLAT_STRING_KEYS = [
  'relevanz_feedback', 'erfolge_feedback', 'sprache_feedback', 'usp_feedback', 'formales_feedback', 'tiefe_feedback',
  'relevanz_zitat', 'erfolge_zitat', 'sprache_zitat', 'usp_zitat', 'formales_zitat', 'tiefe_zitat',
  'relevanz_tipp', 'erfolge_tipp', 'sprache_tipp', 'usp_tipp', 'formales_tipp', 'tiefe_tipp',
  'erfahrungslevel', 'profil_vibe', 'marktwert_2026', 'missing_link',
] as const;

function mapFlatFields(obj: any, result: AtsResult): void {
  for (const key of FLAT_SCORE_KEYS) {
    if (typeof obj[key] === 'number') (result as any)[key] = obj[key];
  }
  for (const key of FLAT_STRING_KEYS) {
    if (typeof obj[key] === 'string' && obj[key].trim()) (result as any)[key] = obj[key];
  }
}

function fallbackExtractAtsResultFromText(text: string): AtsResult | null {
  console.log('[parseAtsJson] 🔄 Fallback-Extractor aktiv');

  const scoreMatch = text.match(/"ats_score"\s*:\s*(\d+)/);
  if (!scoreMatch) {
    console.warn('[parseAtsJson] ⚠️ Fallback: Kein ats_score gefunden');
    return null;
  }

  const result: AtsResult = { ats_score: Number(scoreMatch[1]) };

  const todos = extractTodosFromText(text);
  if (Object.keys(todos).length > 0) result.top_todos = todos;

  for (const key of FLAT_SCORE_KEYS) {
    const val = extractNumberValue(text, key);
    if (val !== undefined) (result as any)[key] = val;
  }
  for (const key of FLAT_STRING_KEYS) {
    const val = extractStringValue(text, key);
    if (val) (result as any)[key] = val;
  }

  // Legacy nested fallback
  const relevanz_fokus = extractCategoryBlock(text, 'relevanz_fokus');
  if (relevanz_fokus) result.relevanz_fokus = relevanz_fokus;
  const erfolge_kpis = extractCategoryBlock(text, 'erfolge_kpis');
  if (erfolge_kpis) result.erfolge_kpis = erfolge_kpis;
  const klarheit_sprache = extractCategoryBlock(text, 'klarheit_sprache');
  if (klarheit_sprache) result.klarheit_sprache = klarheit_sprache;
  const formales = extractCategoryBlock(text, 'formales');
  if (formales) result.formales = formales;
  const usp_skills = extractCategoryBlock(text, 'usp_skills');
  if (usp_skills) result.usp_skills = usp_skills;

  console.log('[parseAtsJson] ✅ Fallback parsed AtsResult:', result);
  return result;
}

/**
 * Make.com → internes AtsResult
 * Robust gegen kaputte JSON + verschiedene Formate
 */
export function parseAtsJson(raw: any): AtsResult | null {
  try {
    console.log('[parseAtsJson] 🔍 Input type:', typeof raw);
    console.log(
      '[parseAtsJson] 🔍 Input preview:',
      typeof raw === 'string'
        ? raw.substring(0, 200)
        : JSON.stringify(raw).substring(0, 200)
    );

    if (!raw) {
      console.warn('[parseAtsJson] ⚠️ Input is null/undefined');
      return null;
    }

    let first: any;

    // ---------- 1) String → objekt parsen ----------
    if (typeof raw === 'string') {
      let cleaned = raw.trim();
      if (!cleaned) return null;

      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.slice(firstBrace, lastBrace + 1);
      }

      try {
        first = JSON.parse(cleaned);
        if (typeof first === 'string') first = JSON.parse(first);
      } catch {
        try {
          const sanitized = cleaned
            .replace(/\\n/g, ' ').replace(/\\t/g, ' ')
            .replace(/\n/g, ' ').replace(/\t/g, ' ').replace(/\r/g, ' ')
            .replace(/[\x00-\x1F\x7F]/g, '');
          first = JSON.parse(sanitized);
          if (typeof first === 'string') first = JSON.parse(first);
        } catch {
          try {
            const aggressive = cleaned
              .replace(/\\n/g, ' ').replace(/\\t/g, ' ')
              .replace(/\n/g, ' ').replace(/\t/g, ' ').replace(/\r/g, ' ')
              .replace(/[\x00-\x1F\x7F]/g, '').replace(/\s+/g, ' ')
              .replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
            first = JSON.parse(aggressive);
            if (typeof first === 'string') first = JSON.parse(first);
          } catch {
            const fallback = fallbackExtractAtsResultFromText(cleaned);
            if (fallback) return fallback;
            console.error('[parseAtsJson] ❌ All parse strategies failed');
            return null;
          }
        }
      }
    } else {
      first = raw;
    }

    // ---------- 2) ChatGPT-Format { role, content: "{...}" } ----------
    if (first && typeof first === 'object' && 'content' in first) {
      const content = (first as any).content;
      if (typeof content === 'string') {
        const contentCleaned = content.trim();
        if (!contentCleaned) return null;
        try {
          first = JSON.parse(contentCleaned);
        } catch {
          const fallback = fallbackExtractAtsResultFromText(contentCleaned);
          if (fallback) return fallback;
          return null;
        }
      } else {
        first = content;
      }
    }

    if (!first || typeof first !== 'object') return null;

    console.log('[parseAtsJson] ✅ Final raw keys:', Object.keys(first as Record<string, unknown>));

    // ---------- 3) Make.com legacy format (overallScore + categories) ----------
    if (!('ats_score' in first) && 'overallScore' in first) {
      const categories = (first as any).categories || {};
      const improvements = (first as any).improvements || [];
      const topTodos: Record<string, string> = {};
      (improvements as string[]).slice(0, 3).forEach((item, index) => {
        topTodos[`To-do ${index + 1}`] = item;
      });
      return {
        ats_score: (first as any).overallScore,
        top_todos: topTodos,
        relevanz_fokus: categories.content,
        erfolge_kpis: categories.content,
        klarheit_sprache: categories.structure,
        formales: categories.design,
        usp_skills: categories.atsCompatibility,
      };
    }

    // ---------- 4) Standard-Format: flache Felder mappen ----------
    if (!('ats_score' in first) || typeof (first as any).ats_score !== 'number') {
      const rawString = typeof raw === 'string' ? raw : JSON.stringify(first, null, 2);
      const fallback = fallbackExtractAtsResultFromText(rawString);
      if (fallback) return fallback;
      return null;
    }

    const result: AtsResult = { ats_score: (first as any).ats_score };

    const todos = mapTodosFromObject(first);
    if (Object.keys(todos).length > 0) result.top_todos = todos;

    mapFlatFields(first, result);

    for (const key of ['relevanz_fokus', 'erfolge_kpis', 'klarheit_sprache', 'formales', 'usp_skills'] as const) {
      if (first[key] && typeof first[key] === 'object') (result as any)[key] = first[key];
    }

    console.log('[parseAtsJson] ✅ Parsed AtsResult:', result);
    return result;
  } catch (error) {
    console.error('[parseAtsJson] ❌ Unexpected error:', error);
    return null;
  }
}

// Helper Functions für UI
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-[#66c0b6]';
  if (score >= 40) return 'text-yellow-500';
  return 'text-red-500';
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500/10';
  if (score >= 60) return 'bg-[#66c0b6]/10';
  if (score >= 40) return 'bg-yellow-500/10';
  return 'bg-red-500/10';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Sehr gut';
  if (score >= 60) return 'Gut';
  if (score >= 40) return 'Verbesserungsfähig';
  return 'Dringend überarbeiten';
}

export function formatCategoryName(key: string): string {
  const names: Record<string, string> = {
    relevanz_score: 'Relevanz & Fokus',
    erfolge_score: 'Erfolge & KPIs',
    sprache_score: 'Klarheit der Sprache',
    usp_score: 'USP & Skills',
    formales_score: 'Formales & Design',
    tiefe_score: 'Erfahrungstiefe',
    relevanz_fokus: 'Relevanz & Fokus',
    erfolge_kpis: 'Erfolge & KPIs',
    klarheit_sprache: 'Klarheit der Sprache',
    formales: 'Formales',
    usp_skills: 'USP & Skills',
  };
  return names[key] || key.replace(/_/g, ' ');
}
