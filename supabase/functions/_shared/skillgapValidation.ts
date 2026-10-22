/** Deterministische Prüfungen. Quellenzuordnung ist kein unabhängiger Faktencheck. */
export function evidenceText(value: string): string {
  return value.normalize('NFKC').toLowerCase()
    .replace(/([\p{L}])-\s*\n\s*([\p{L}])/gu, '$1$2')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
}
export function quoteIsPresent(quote: string, cv: string): boolean {
  const q = evidenceText(quote);
  // Einzelne verstreute Wörter ergeben keinen Beleg.
  return q.length >= 8 && q.split(' ').length >= 2 &&
    (` ${evidenceText(cv)} `).includes(` ${q} `);
}
export function canonicalSource(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const u = new URL(value);
    if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password) return null;
    u.hash = '';
    for (const key of [...u.searchParams.keys()]) if (/^utm_/i.test(key)) u.searchParams.delete(key);
    u.searchParams.sort();
    return u.href;
  } catch { return null; }
}
/**
 * Vergleichsschlüssel für Quellen: ignoriert Protokoll, "www.", abschließenden
 * Slash und Groß-/Kleinschreibung des Hosts. Die KI gibt URLs oft minimal
 * anders zurück als die Websuche sie zitiert (z. B. mit/ohne Slash) – ein
 * exakter Stringvergleich hat dadurch gültige Anforderungen verworfen und die
 * Analyse mit RESEARCH_THIN abbrechen lassen.
 */
export function sourceKey(value: unknown): string | null {
  const canonical = canonicalSource(value);
  if (!canonical) return null;
  const u = new URL(canonical);
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  const path = u.pathname.replace(/\/+$/, '') || '/';
  return `${host}${path}${u.search}`;
}
export function sourceWasUsed(url: unknown, sources: string[]): boolean {
  const key = sourceKey(url);
  return key !== null && sources.some(s => sourceKey(s) === key);
}
/** Gibt die tatsächlich zitierte Fassung einer Quelle zurück (für die Anzeige). */
export function matchedSource(url: unknown, sources: string[]): string | null {
  const key = sourceKey(url);
  if (key === null) return null;
  const hit = sources.find(s => sourceKey(s) === key);
  return hit ? canonicalSource(hit) : null;
}
export function assertSchema(value: unknown, schema: any, path = 'response'): void {
  const bad = () => { throw new Error(`Ungültige KI-Struktur: ${path}`); };
  if (schema.enum && !schema.enum.includes(value)) bad();
  switch (schema.type) {
    case 'object': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return bad();
      const obj = value as Record<string, unknown>;
      for (const key of schema.required ?? []) if (!(key in obj)) bad();
      for (const [key, child] of Object.entries(obj)) {
        if (!(key in schema.properties)) { if (schema.additionalProperties === false) bad(); }
        else assertSchema(child, schema.properties[key], `${path}.${key}`);
      }
      break;
    }
    case 'array':
      if (!Array.isArray(value) || value.length > (schema.maxItems ?? 100)) return bad();
      for (let i = 0; i < value.length; i++) assertSchema(value[i], schema.items, `${path}[${i}]`);
      break;
    case 'string': if (typeof value !== 'string' || value.length > (schema.maxLength ?? 6000)) bad(); break;
    case 'boolean': if (typeof value !== 'boolean') bad(); break;
    case 'integer': if (typeof value !== 'number' || !Number.isSafeInteger(value)) bad(); break;
    case 'number': if (typeof value !== 'number' || !Number.isFinite(value)) bad(); break;
    default: throw new Error(`Nicht unterstütztes Prüfschema: ${schema.type}`);
  }
}
export function weightedScore(requirements: { importance: number; status: string }[], hasEvidence: boolean) {
  const total = requirements.reduce((n, r) => n + r.importance, 0);
  const covered = requirements.reduce((n, r) => n + r.importance *
    (r.status === 'covered' ? 1 : r.status === 'partial' ? 0.5 : 0), 0);
  return { value: hasEvidence && total > 0 ? Math.round(covered / total * 100) : null,
    coveredWeight: covered, totalWeight: total };
}
export function indexedResults<T extends { req: number }>(rows: T[], count: number): T[] {
  if (rows.length !== count) throw new Error('Unvollständige Kompetenzbewertung');
  const indexes = new Set<number>();
  for (const r of rows) {
    if (!Number.isInteger(r.req) || r.req < 0 || r.req >= count || indexes.has(r.req)) {
      throw new Error('Ungültige oder doppelte Anforderungsnummer');
    }
    indexes.add(r.req);
  }
  return [...rows].sort((a, b) => a.req - b.req);
}
export async function mapLimited<T, R>(items: T[], concurrency: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const result = new Array<R>(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    for (;;) { const i = next++; if (i >= items.length) return; result[i] = await fn(items[i], i); }
  }));
  return result;
}
