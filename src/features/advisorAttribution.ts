// src/features/advisor/advisorAttribution.ts
//
// Zuordnung von Käufen im Pilotbetrieb – ohne personenbezogene Daten:
//  - Klick auf eine Produktkarte im Berater merkt sich Produkt-ID + Zeitpunkt
//    (sessionStorage, nur diese Browser-Sitzung).
//  - Beim Start eines Checkouts hängen die vorhandenen Paywalls
//    advisorCheckoutMetadata() an die Stripe-Metadaten an.
//  - Der Stripe-Webhook schreibt NACH bestätigter Zahlung genau einen Eintrag
//    je Checkout in advisor_conversions (Gruppe advisor/control).
// Ein Klick ist kein Kauf: gezählt wird nur die bestätigte Zahlung.

import { getAdvisorVariant } from './advisorConfig';
import { trackAdvisor } from './advisorAnalytics';

const CLICK_KEY = 'dyd_advisor_click';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function recordAdvisorClick(productId: string): void {
  try { sessionStorage.setItem(CLICK_KEY, JSON.stringify({ p: productId, t: Date.now() })); } catch { /* ignorieren */ }
}

function lastClick(): { p: string; t: number } | null {
  try {
    const v = JSON.parse(sessionStorage.getItem(CLICK_KEY) ?? 'null');
    if (v && typeof v.p === 'string' && typeof v.t === 'number' && Date.now() - v.t < MAX_AGE_MS) return v;
  } catch { /* ignorieren */ }
  return null;
}

/** Zusätzliche Stripe-Metadaten – leer, solange kein Pilotbetrieb läuft */
export function advisorCheckoutMetadata(): Record<string, string> {
  const variant = getAdvisorVariant();
  if (variant === 'off') return {};
  const click = variant === 'advisor' ? lastClick() : null;
  if (click) {
    // Bei automatischen Wiederholungsversuchen derselben Zahlung nur einmal zählen
    let already = false;
    try {
      already = sessionStorage.getItem('dyd_advisor_checkout_tracked') === String(click.t);
      sessionStorage.setItem('dyd_advisor_checkout_tracked', String(click.t));
    } catch { /* ignorieren */ }
    if (!already) trackAdvisor('advisor_checkout_started', { product_id: click.p });
  }
  return {
    advisor_variant: variant,
    ...(click ? { advisor_product: click.p, advisor_clicked_at: String(click.t) } : {}),
  };
}
