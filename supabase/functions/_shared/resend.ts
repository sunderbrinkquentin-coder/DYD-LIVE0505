import { newsletterConfig } from './appConfig.ts';
// Newsletter transport: reuse the existing server-side RESEND_API_KEY.
// Contact properties are optional; Supabase remains authoritative for discounts.
const API = 'https://api.resend.com';
type Attributes = Record<string, string | number | boolean | null>;

export async function resendRequest(path: string, init: RequestInit, allowNotFound = false): Promise<Response> {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) throw new Error('RESEND_API_KEY fehlt');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${key}`);
  headers.set('Content-Type', 'application/json');
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`${API}${path}`, { ...init, headers, signal: AbortSignal.timeout(15_000) });
    // Contact sync + welcome mail can exceed the provider's per-second limit.
    // Retry only an explicit rate rejection, never an ambiguous send timeout.
    if (response.status === 429 && attempt < 2) {
      const seconds = Number(response.headers.get('retry-after') ?? 1);
      if (Number.isFinite(seconds) && seconds >= 0 && seconds <= 5) {
        await new Promise(resolve => setTimeout(resolve, Math.max(1, seconds) * 1000));
        continue;
      }
    }
    if (!response.ok && !(allowNotFound && response.status === 404)) {
      throw new Error(`Resend-Anfrage fehlgeschlagen (HTTP ${response.status})`);
    }
    return response;
  }
  throw new Error('Resend-Anfrage konnte nicht abgeschlossen werden');
}

export async function sendMail(opts: {
  to: { email: string; name?: string | null };
  subject: string; html: string; text: string;
  unsubscribeUrl?: string; tags?: string[];
}): Promise<boolean> {
  try {
    const senderEmail = Deno.env.get('NEWSLETTER_SENDER_EMAIL');
    if (!senderEmail?.trim()) throw new Error('NEWSLETTER_SENDER_EMAIL fehlt');
    const from = `${Deno.env.get('NEWSLETTER_SENDER_NAME') ?? 'Quentin von DYD'} <${senderEmail.trim()}>`;
    const headers: Record<string, string> = {};
    if (opts.unsubscribeUrl) {
      headers['List-Unsubscribe'] = `<${opts.unsubscribeUrl}>`;
      headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
    }
    await resendRequest('/emails', {
      method: 'POST',
      body: JSON.stringify({ from, to: [opts.to.email], subject: opts.subject,
        html: opts.html, text: opts.text, headers,
        tags: (opts.tags ?? []).map((value, i) => ({ name: `category_${i}`, value })),
      }),
    });
    return true;
  } catch (error) {
    console.error('[newsletter/resend] Versand:', error instanceof Error ? error.message : 'Unbekannter Fehler');
    return false;
  }
}

function properties(attributes: Attributes) {
  if (!newsletterConfig.syncProperties) return {};
  return { properties: Object.fromEntries(Object.entries(attributes)
    .filter(([key]) => key !== 'FIRSTNAME')
    .map(([key, value]) => [key.toLowerCase(), value == null ? null : String(value)])) };
}

/** Only call after a valid double-opt-in confirmation. */
export async function upsertContact(email: string, attributes: Attributes): Promise<void> {
  const path = `/contacts/${encodeURIComponent(email)}`;
  const data = { first_name: String(attributes.FIRSTNAME ?? ''), unsubscribed: false, ...properties(attributes) };
  const updated = await resendRequest(path, { method: 'PATCH', body: JSON.stringify(data) }, true);
  if (updated.status === 404) {
    await resendRequest('/contacts', { method: 'POST', body: JSON.stringify({ email, ...data }) });
  }
  const segment = newsletterConfig.segmentId;
  if (segment) {
    await resendRequest(`${path}/segments/${encodeURIComponent(segment)}`, { method: 'POST' });
  }
}

/** A purchase never creates a contact or changes their subscription status. */
export async function updateContactAttributes(email: string, attributes: Attributes): Promise<void> {
  if (!newsletterConfig.syncProperties) return;
  await resendRequest(`/contacts/${encodeURIComponent(email)}`, {
    method: 'PATCH', body: JSON.stringify(properties(attributes)),
  }, true);
}

export async function unsubscribeContact(email: string): Promise<void> {
  await resendRequest(`/contacts/${encodeURIComponent(email)}`, {
    method: 'PATCH', body: JSON.stringify({ unsubscribed: true }),
  }, true);
}

export async function deleteContact(email: string): Promise<void> {
  await resendRequest(`/contacts/${encodeURIComponent(email)}`, { method: 'DELETE' }, true);
}
