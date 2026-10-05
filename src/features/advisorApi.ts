// src/features/advisor/advisorApi.ts
//
// Aufruf der Edge Function "product-advisor". Der OpenAI-Schlüssel liegt
// ausschließlich auf dem Server; hier wird nur der öffentliche Anon-Key bzw.
// das Login-Token des Nutzers mitgeschickt (die Nutzer-ID prüft der Server).

import { supabase } from '../../lib/supabase';

export interface AdvisorCard {
  product_id: string;
  role: 'main' | 'alternative' | 'addon';
  name: string;
  segment: 'b2c' | 'b2b';
  summary: string;
  includes: string[];
  price_label: string;
  yearly_label: string | null;
  savings_label: string | null;
  reason: string;
  cta_label: string;
  target_type: 'route' | 'demo';
  target_path: string;
  requires_login: boolean;
  next_step: string;
  course: { id: string; skill: string } | null;
}

export interface AdvisorReply {
  reply: string;
  cards: AdvisorCard[];
  quick_replies: string[];
  contact_offer: boolean;
  unanswered: boolean;
}

export interface AdvisorMessage { role: 'user' | 'assistant'; content: string }

export class AdvisorError extends Error {
  constructor(public code: string, message: string, public retryable: boolean) { super(message); }
}

const URL_ = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/product-advisor`;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export async function askAdvisor(input: {
  messages: AdvisorMessage[];
  page: string;
  product: string | null;
  declined: string[];
  signal?: AbortSignal;
}): Promise<AdvisorReply> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? ANON;

  const timeout = AbortSignal.timeout(35_000);
  const signal = input.signal ? anySignal([input.signal, timeout]) : timeout;

  let res: Response;
  try {
    res = await fetch(URL_, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, apikey: ANON },
      body: JSON.stringify({
        messages: input.messages.slice(-12),
        page: input.page,
        product: input.product,
        declined: input.declined,
      }),
    });
  } catch (e) {
    if ((e as Error)?.name === 'AbortError' && input.signal?.aborted) throw new AdvisorError('aborted', '', false);
    throw new AdvisorError('network', 'Keine Verbindung. Bitte prüfe deine Internetverbindung und versuch es erneut.', true);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok || !body) {
    const code = String(body?.error ?? `http_${res.status}`);
    const message = String(body?.message ?? 'Da ist etwas schiefgelaufen. Bitte versuch es noch einmal.');
    const retryable = !['disabled', 'not_configured', 'invalid', 'too_large'].includes(code) && res.status !== 400;
    throw new AdvisorError(code, message, retryable);
  }
  return {
    reply: String(body.reply ?? ''),
    cards: Array.isArray(body.cards) ? body.cards : [],
    quick_replies: Array.isArray(body.quick_replies) ? body.quick_replies.map(String).slice(0, 3) : [],
    contact_offer: !!body.contact_offer,
    unanswered: !!body.unanswered,
  };
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const ctrl = new AbortController();
  for (const s of signals) {
    if (s.aborted) { ctrl.abort(); break; }
    s.addEventListener('abort', () => ctrl.abort(), { once: true });
  }
  return ctrl.signal;
}
