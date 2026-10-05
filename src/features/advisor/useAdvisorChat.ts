// src/features/advisor/useAdvisorChat.ts
//
// Gesprächszustand des Beraters (nur im Speicher des Tabs, wird nicht
// gespeichert): Nachrichten, Laden, Fehler mit Wiederholung, abgelehnte
// Angebote, Doppelklick-Schutz.

import { useCallback, useRef, useState } from 'react';
import { AdvisorError, askAdvisor, type AdvisorCard, type AdvisorMessage } from './advisorApi';
import { trackAdvisor } from './advisorAnalytics';

export interface ChatEntry {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  cards?: AdvisorCard[];
  quickReplies?: string[];
  contactOffer?: boolean;
}

export interface ChatError { code: string; message: string; retryable: boolean }

const MAX_TURNS = 30;

export function useAdvisorChat(context: { page: string; product: string | null }) {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [declined, setDeclined] = useState<string[]>([]);
  const idRef = useRef(1);
  const inflight = useRef<AbortController | null>(null);
  const lastSent = useRef<{ text: string; history: AdvisorMessage[] } | null>(null);

  const run = useCallback(async (history: AdvisorMessage[], declinedNow: string[]) => {
    inflight.current?.abort();
    const ctrl = new AbortController();
    inflight.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const res = await askAdvisor({ messages: history, page: context.page, product: context.product, declined: declinedNow, signal: ctrl.signal });
      if (ctrl.signal.aborted) return;
      setEntries((e) => [...e, {
        id: idRef.current++,
        role: 'assistant',
        text: res.reply,
        cards: res.cards,
        quickReplies: res.quick_replies,
        contactOffer: res.contact_offer,
      }]);
      res.cards.forEach((c) => trackAdvisor('advisor_recommendation_shown', { product_id: c.product_id }));
      if (res.unanswered) trackAdvisor('advisor_unanswered');
    } catch (e) {
      if (e instanceof AdvisorError && e.code === 'aborted') return;
      const err = e instanceof AdvisorError ? e : new AdvisorError('unknown', 'Da ist etwas schiefgelaufen.', true);
      setError({ code: err.code, message: err.message, retryable: err.retryable });
      trackAdvisor('advisor_error', { code: err.code.replace(/[^a-z_]/g, '_').slice(0, 40) });
    } finally {
      if (inflight.current === ctrl) {
        inflight.current = null;
        setLoading(false);
      }
    }
  }, [context.page, context.product]);

  const historyOf = (list: ChatEntry[]): AdvisorMessage[] =>
    list.map((e) => ({ role: e.role, content: e.text }));

  const send = useCallback((text: string) => {
    const clean = text.trim().slice(0, 600);
    if (!clean || loading) return;           // Doppelte Absendung verhindern
    if (entries.filter((e) => e.role === 'user').length >= MAX_TURNS) {
      setError({ code: 'too_long', message: 'Das Gespräch ist sehr lang geworden. Starte es bitte neu.', retryable: false });
      return;
    }
    if (!entries.some((e) => e.role === 'user')) trackAdvisor('advisor_start');
    const next = [...entries, { id: idRef.current++, role: 'user' as const, text: clean }];
    setEntries(next);
    const history = historyOf(next);
    lastSent.current = { text: clean, history };
    void run(history, declined);
  }, [entries, loading, declined, run]);

  const retry = useCallback(() => {
    if (!lastSent.current || loading) return;
    void run(lastSent.current.history, declined);
  }, [loading, declined, run]);

  const decline = useCallback((productId: string) => {
    if (declined.includes(productId)) return;
    const nextDeclined = [...declined, productId];
    setDeclined(nextDeclined);
    trackAdvisor('advisor_decline', { product_id: productId });
    // Karte ausblenden; das Modell erfährt die Ablehnung mit der nächsten Nachricht
    setEntries((list) => list.map((e) => (e.cards ? { ...e, cards: e.cards.filter((c) => c.product_id !== productId) } : e)));
  }, [declined]);

  const reset = useCallback(() => {
    inflight.current?.abort();
    inflight.current = null;
    setEntries([]);
    setDeclined([]);
    setError(null);
    setLoading(false);
    lastSent.current = null;
    trackAdvisor('advisor_reset');
  }, []);

  return { entries, loading, error, declined, send, retry, decline, reset };
}
