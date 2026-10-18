// src/lib/b2bBriefing.ts
//
// Nach jeder B2B-Anfrage wird das Briefing per Edge Function versendet:
//  1. Bestätigungs-Mail an den Kunden (Resend)
//  2. quentin@decideyourdream.de in CC + eigene Detail-Mail mit allen Angaben

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
  /** Strukturierte Einzelpunkte für Personalisierung */
  answers: Record<string, string>;
}

/**
 * Feuert das Briefing asynchron ab – blockiert das Formular nicht.
 * Fehler werden geloggt, aber nicht an den Nutzer durchgereicht:
 * Die Anfrage selbst ist ja bereits in der Datenbank gesichert.
 */
export function triggerB2bBriefing(payload: Omit<B2bBriefingPayload, 'type' | 'submitted_at'>): void {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-b2b-briefing`;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const body: B2bBriefingPayload = {
    ...payload,
    type: 'b2b_briefing',
    submitted_at: new Date().toISOString(),
  };

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify(body),
  })
    .then(async (res) => {
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        console.error(`[B2B-BRIEFING] Versand fehlgeschlagen (${res.status}): ${detail.slice(0, 200)}`);
        return;
      }
      console.log('[B2B-BRIEFING] Briefing versendet an', payload.contact.email);
    })
    .catch((err) => console.error('[B2B-BRIEFING] Netzwerkfehler:', err));
}
