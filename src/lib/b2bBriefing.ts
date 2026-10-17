// src/lib/b2bBriefing.ts
//
// Nach jeder B2B-Anfrage wird automatisch ein Briefing-Prozess angestoßen:
// Die komplette Anfrage (Kontakt, Auswahl, Anliegen) wird gebündelt als JSON
// an den Make.com-Briefing-Webhook geschickt. In Make läuft dann:
// 1. Automatisches Briefing-Mail geht an den Anfragenden (Bedarf klären)
// 2. Die Antworten + Originalanfrage werden gebündelt an den Betreiber gemailt

import { getB2bBriefingWebhookUrl } from '../config/makeWebhook';

export type B2bBriefingSource = 'prozess-check' | 'kontakt-modal' | 'lead-modal';

export interface B2bBriefingPayload {
  type: 'b2b_briefing';
  source: B2bBriefingSource;
  submitted_at: string;
  contact: {
    name: string;
    company: string;
    email: string;
    phone: string | null;
  };
  segment: string;
  /** Zusammengestellte Auswahl + freitext (Bereich, Umfang, Zeitrahmen, Anliegen) */
  need: string;
  /** Strukturierte Einzelpunkte für make-Filterung/Personalisierung */
  answers: Record<string, string>;
}

/**
 * Feuert das Briefing asynchron ab – blockiert das Formular nicht.
 * Fehler werden geloggt, aber nicht an den Nutzer durchgereicht:
 * Die Anfrage selbst ist ja bereits in der Datenbank gesichert.
 */
export function triggerB2bBriefing(payload: Omit<B2bBriefingPayload, 'type' | 'submitted_at'>): void {
  const url = getB2bBriefingWebhookUrl();
  if (!url) {
    console.warn('[B2B-BRIEFING] Webhook nicht konfiguriert (VITE_MAKE_WEBHOOK_B2B_BRIEFING) – Briefing übersprungen.');
    return;
  }

  const body: B2bBriefingPayload = {
    ...payload,
    type: 'b2b_briefing',
    submitted_at: new Date().toISOString(),
  };

  fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
    .then(() => console.log('[B2B-BRIEFING] Briefing ausgelöst für', payload.contact.email))
    .catch((err) => console.error('[B2B-BRIEFING] Webhook-Fehler:', err));
}
