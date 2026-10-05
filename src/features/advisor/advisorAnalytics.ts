// src/features/advisor/advisorAnalytics.ts
//
// Ereignisse des Beraters – über die vorhandene GA4-Einbindung (gtag) und
// nur mit Einwilligung (Cookie-Banner, localStorage "dyd_cookie_consent_v1").
// Ohne Einwilligung oder mit VITE_ADVISOR_ANALYTICS=off passiert nichts.
// Es werden NIE Gesprächsinhalte oder personenbezogene Daten übertragen,
// nur Ereignisname, Pilotgruppe, Produkt-ID bzw. Fehlercode.

import { getAdvisorVariant } from './advisorConfig';

export type AdvisorEvent =
  | 'advisor_assignment'          // Pilotgruppe festgelegt (advisor/control)
  | 'advisor_open'
  | 'advisor_close'
  | 'advisor_start'               // erste Nachricht gesendet
  | 'advisor_recommendation_shown'
  | 'advisor_cta_click'           // Produkt-/Upgrade-Link geklickt
  | 'advisor_decline'             // Zusatzangebot abgelehnt
  | 'advisor_checkout_started'    // Checkout nach Berater-Klick gestartet
  | 'advisor_unanswered'
  | 'advisor_error'
  | 'advisor_reset';

const ONCE_PER_SESSION: AdvisorEvent[] = ['advisor_assignment', 'advisor_start'];

function hasConsent(): boolean {
  try { return localStorage.getItem('dyd_cookie_consent_v1') === 'accepted'; } catch { return false; }
}

export function trackAdvisor(event: AdvisorEvent, params: { product_id?: string; code?: string } = {}): void {
  if (String(import.meta.env.VITE_ADVISOR_ANALYTICS ?? '').toLowerCase() === 'off') return;
  if (!hasConsent()) return;
  const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  if (typeof gtag !== 'function') return;

  if (ONCE_PER_SESSION.includes(event)) {
    try {
      const key = `dyd_adv_evt_${event}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch { /* ignorieren */ }
  }
  const safe: Record<string, string> = { advisor_variant: getAdvisorVariant() };
  if (params.product_id && /^[a-z0-9_]{1,40}$/.test(params.product_id)) safe.product_id = params.product_id;
  if (params.code && /^[a-z_]{1,40}$/.test(params.code)) safe.error_code = params.code;
  try { gtag('event', event, safe); } catch { /* Analytics darf nie stören */ }
}
