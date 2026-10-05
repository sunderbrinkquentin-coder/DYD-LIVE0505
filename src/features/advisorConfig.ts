// src/features/advisor/advisorConfig.ts
//
// Freischaltung und Pilotbetrieb des KI-Produktberaters.
//
//   VITE_ADVISOR_ENABLED   "true" = Berater im Frontend verfügbar (Standard: aus)
//   VITE_ADVISOR_ROLLOUT   0–100: Anteil der Besucher, die den Berater sehen.
//                          Die übrigen bilden die Vergleichsgruppe ("control").
//                          Standard 0 = nur Vorschau (siehe unten).
//
// Vorschau für interne Tests ohne Rollout: einmal in der Browser-Konsole
//   localStorage.setItem('dyd_advisor_preview', '1')
// ausführen (entfernen mit removeItem). Die Gruppe wird pro Browser einmal
// zufällig festgelegt und bleibt stabil.

export type AdvisorVariant = 'advisor' | 'control' | 'off';

const VARIANT_KEY = 'dyd_advisor_variant';
const PREVIEW_KEY = 'dyd_advisor_preview';

function storageGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function storageSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* privater Modus */ }
}

export function advisorEnabled(): boolean {
  return String(import.meta.env.VITE_ADVISOR_ENABLED ?? '').toLowerCase() === 'true';
}

function rolloutPercent(): number {
  const n = Number(import.meta.env.VITE_ADVISOR_ROLLOUT ?? 0);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
}

/** Pilotgruppe dieses Browsers (stabil). 'off' = Berater abgeschaltet. */
export function getAdvisorVariant(): AdvisorVariant {
  if (!advisorEnabled()) return 'off';
  if (storageGet(PREVIEW_KEY) === '1') return 'advisor';
  const pct = rolloutPercent();
  if (pct <= 0) return 'off';
  const stored = storageGet(VARIANT_KEY);
  // Bei Änderung des Rollouts bleibt die Zuordnung stabil; 100 % = alle sehen den Berater
  if (pct >= 100) return 'advisor';
  if (stored === 'advisor' || stored === 'control') return stored;
  const variant: AdvisorVariant = Math.random() * 100 < pct ? 'advisor' : 'control';
  storageSet(VARIANT_KEY, variant);
  return variant;
}

/** Seiten, auf denen der Berater nicht erscheint (Checkout, Editor, Lernen, Druckansicht) */
const HIDDEN_PREFIXES = [
  '/cv-paywall', '/pricing', '/payment-success', '/festival-success',
  '/cv-live-editor', '/cv/', '/cv-wizard', '/cv-export-render', '/cv-preview-editor', '/cv/edit',
  '/learning-path', '/learning-path-waiting', '/login', '/reset-password', '/verify/', '/admin', '/turnier',
  '/chat', '/agent', '/email', '/result',
];

export function advisorHiddenOn(pathname: string): boolean {
  return HIDDEN_PREFIXES.some((p) => (p.endsWith('/') ? pathname.startsWith(p) : pathname === p || pathname.startsWith(`${p}/`)));
}

/** Nur notwendiger Seitenkontext: grobe Seitenart + ggf. bekannte Produkt-ID */
export function pageContext(pathname: string): { page: string; product: string | null } {
  if (pathname === '/' || pathname === '') return { page: 'home', product: null };
  if (pathname.startsWith('/kurse')) return { page: 'courses', product: 'academy_course' };
  if (pathname.startsWith('/career-vision')) return { page: 'career', product: 'skillgap_analysis' };
  if (pathname.startsWith('/cv-check') || pathname.startsWith('/cv-upload') || pathname.startsWith('/cv-result')) return { page: 'cv', product: 'cv_check' };
  if (pathname.startsWith('/business')) return { page: 'business', product: null };
  if (pathname.startsWith('/dashboard')) return { page: 'dashboard', product: null };
  if (pathname.startsWith('/faq')) return { page: 'faq', product: null };
  return { page: 'other', product: null };
}
