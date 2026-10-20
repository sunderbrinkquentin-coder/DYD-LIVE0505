// src/features/newsletter/newsletterApi.ts
//
// Aufrufe der Edge Function "newsletter" und Lesen des eigenen Status
// (View my_newsletter_status – zeigt nur den eigenen Eintrag, ohne Tokens/IPs).

import { supabase } from '../../lib/supabase';
import { NEWSLETTER_CONSENT_VERSION } from './consent';

export type NewsletterStatus = 'none' | 'pending' | 'confirmed' | 'unsubscribed' | 'declined';

export interface NewsletterState {
  status: NewsletterStatus;
  discountActive: boolean;
  discountPercent: number;
  discountExpiresAt: string | null;
  discountRedeemedAt: string | null;
}

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newsletter`;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export class NewsletterError extends Error {
  constructor(public code: string, message: string) { super(message); }
}

async function call<T>(body: Record<string, unknown>, withAuth: boolean): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', apikey: ANON };
  if (withAuth) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new NewsletterError('unauthorized', 'Bitte melde dich an.');
    headers.Authorization = `Bearer ${session.access_token}`;
  } else {
    headers.Authorization = `Bearer ${ANON}`;
  }
  let res: Response;
  try {
    res = await fetch(FN_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  } catch {
    throw new NewsletterError('network', 'Keine Verbindung. Bitte versuche es erneut.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new NewsletterError(String(data.error ?? res.status), String(data.message ?? 'Da ist etwas schiefgelaufen.'));
  return data as T;
}

export const newsletterApi = {
  subscribe: (source: string, firstName?: string | null) =>
    call<{ status: NewsletterStatus; email?: string; mail_sent?: boolean }>({ action: 'subscribe', consent_version: NEWSLETTER_CONSENT_VERSION, source, first_name: firstName ?? undefined }, true),
  resend: () => call<{ status: NewsletterStatus }>({ action: 'resend' }, true),
  decline: () => call<{ status: NewsletterStatus }>({ action: 'decline' }, true),
  confirm: (token: string) =>
    call<{ status: NewsletterStatus; discount_active?: boolean; discount_expires_at?: string | null; percent?: number }>({ action: 'confirm', token }, false),
  unsubscribe: (token: string) => call<{ status: NewsletterStatus }>({ action: 'unsubscribe', token }, false),

  async getState(): Promise<NewsletterState> {
    const { data, error } = await supabase.from('my_newsletter_status').select('*').maybeSingle();
    if (error || !data) return { status: 'none', discountActive: false, discountPercent: 50, discountExpiresAt: null, discountRedeemedAt: null };
    return {
      status: data.status as NewsletterStatus,
      discountActive: !!data.discount_active,
      discountPercent: data.discount_percent ?? 50,
      discountExpiresAt: data.discount_expires_at,
      discountRedeemedAt: data.discount_redeemed_at,
    };
  },
};
