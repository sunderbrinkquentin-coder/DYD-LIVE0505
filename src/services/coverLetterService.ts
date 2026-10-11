import { supabase } from '../lib/supabase';
import type { CoverLetter, CoverLetterBrief, CoverLetterContent } from '../types/coverLetter';

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export class CoverLetterError extends Error {
  constructor(message: string, public code?: string, public status?: number) {
    super(message);
  }
}

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new CoverLetterError('Bitte melde dich an.', 'AUTH', 401);
  return { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' };
}

async function callFunction<T>(name: string, body: unknown): Promise<T> {
  const res = await fetch(`${FN_URL}/${name}`, { method: 'POST', headers: await authHeader(), body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new CoverLetterError(data.error || `Der Server ist gerade nicht erreichbar (${res.status}). Bitte versuch es gleich noch einmal.`, data.code, res.status);
  return data as T;
}

export const coverLetterService = {
  /** Neuester Entwurf zu einer Bewerbung (oder null) */
  async getLatestForApplication(applicationId: string): Promise<CoverLetter | null> {
    const { data, error } = await supabase
      .from('cover_letters')
      .select('id')
      .eq('application_id', applicationId)
      .order('is_unlocked', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? this.get(data.id) : null;
  },

  /** Status aller Anschreiben (für Karten-Badges) */
  async listStatus(): Promise<{ application_id: string; is_unlocked: boolean }[]> {
    const { data, error } = await supabase.from('cover_letters').select('application_id, is_unlocked');
    if (error) throw error;
    return data ?? [];
  },

  async get(id: string): Promise<CoverLetter | null> {
    const { data, error } = await supabase.rpc('get_cover_letter', { p_id: id });
    if (error) throw error;
    return (data as CoverLetter) ?? null;
  },

  generate(applicationId: string, brief: CoverLetterBrief) {
    return callFunction<CoverLetter>('cover-letter', { action: 'generate', application_id: applicationId, brief });
  },

  rewriteParagraph(coverLetterId: string, paragraphId: string, instruction: string) {
    return callFunction<CoverLetter>('cover-letter', {
      action: 'rewrite',
      cover_letter_id: coverLetterId,
      paragraph_id: paragraphId,
      instruction,
    });
  },

  regenerate(coverLetterId: string, brief?: CoverLetterBrief) {
    return callFunction<CoverLetter>('cover-letter', { action: 'regenerate', cover_letter_id: coverLetterId, brief });
  },

  async save(id: string, letter: CoverLetterContent): Promise<void> {
    const { data, error } = await supabase.rpc('save_cover_letter', { p_id: id, p_letter: letter });
    if (error) throw error;
    if (!data) throw new CoverLetterError('Speichern nicht möglich – ist das Anschreiben freigeschaltet?');
  },

  async unlockWithCredit(id: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('unlock_cover_letter_with_credit', { p_id: id });
    if (error) throw error;
    return data === true;
  },

  async addonEligible(id: string): Promise<boolean> {
    const { data } = await supabase.rpc('cover_letter_addon_eligible', { p_id: id });
    return data === true;
  },

  /** Stripe-Checkout starten; kommt zurück auf /dashboard?cover_letter=…&application=… */
  async checkout(letter: CoverLetter, variant: 'single' | 'addon') {
    const priceId =
      variant === 'addon'
        ? import.meta.env.VITE_STRIPE_PRICE_COVER_LETTER_ADDON
        : import.meta.env.VITE_STRIPE_PRICE_COVER_LETTER;
    if (!priceId) throw new CoverLetterError('Preis nicht konfiguriert.');

    const back = `${window.location.origin}/dashboard?cover_letter=${letter.id}&application=${letter.application_id}`;
    const { url } = await callFunction<{ url: string }>('stripe-checkout', {
      price_id: priceId,
      success_url: `${back}&paid=1`,
      cancel_url: back,
      mode: 'payment',
      metadata: { cover_letter_id: letter.id, source: 'cover_letter', variant },
    });
    window.location.href = url;
  },
};

// ─── Export-Helfer ───────────────────────────────────────────────────
/** Zeilen des DIN-5008-Briefkopfs */
export function letterHeaderLines(l: CoverLetterContent) {
  const sender = l.sender
    ? [l.sender.name, l.sender.street, l.sender.zip_city, l.sender.phone, l.sender.email].filter(Boolean)
    : [];
  const r = l.recipient;
  const person =
    r && r.name && r.salutation !== 'unbekannt'
      ? `${r.salutation === 'frau' ? 'Frau ' : r.salutation === 'herr' ? 'Herrn ' : ''}${r.title ? `${r.title} ` : ''}${r.name}`
      : '';
  const recipient = r ? [r.company, r.department, person, r.street, r.zip_city].filter(Boolean) : [];
  return { sender, recipient, placeDate: l.place_date || new Date().toLocaleDateString('de-DE') };
}

export function letterToPlainText(l: CoverLetterContent): string {
  const h = letterHeaderLines(l);
  return [
    ...(h.sender.length ? [h.sender.join(' · '), ''] : []),
    ...(h.recipient.length ? [...h.recipient, ''] : []),
    h.placeDate,
    '',
    l.subject,
    '',
    l.salutation,
    '',
    ...l.paragraphs.map((p) => `${p.text ?? ''}\n`),
    l.closing,
    '',
    l.sender_name,
  ].join('\n').trim();
}

export async function downloadLetterDocx(l: CoverLetterContent, fileBase: string) {
  const { AlignmentType, Document, Packer, Paragraph, TextRun } = await import('docx');
  const h = letterHeaderLines(l);
  const para = (text: string, opts: { bold?: boolean; after?: number; right?: boolean; size?: number } = {}) =>
    new Paragraph({
      alignment: opts.right ? AlignmentType.RIGHT : AlignmentType.LEFT,
      spacing: { after: opts.after ?? 200, line: 300 },
      children: [new TextRun({ text, bold: opts.bold, font: 'Calibri', size: opts.size ?? 22 })],
    });
  const block = (lines: string[], after = 400, size?: number, right = false) =>
    lines.map((t, i) => para(t, { after: i === lines.length - 1 ? after : 0, size, right }));

  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 1134, bottom: 1134, left: 1417, right: 1134 } } },
        children: [
          ...(h.sender.length ? block(h.sender, 500, 20, true) : []),
          ...(h.recipient.length ? block(h.recipient, 500) : []),
          para(h.placeDate, { after: 400, right: true }),
          para(l.subject, { bold: true, after: 400 }),
          para(l.salutation),
          ...l.paragraphs.map((p) => para(p.text ?? '')),
          para(l.closing, { after: 600 }),
          para(l.sender_name || ''),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Anschreiben-${fileBase.replace(/[^a-zA-Z0-9äöüÄÖÜß-]+/g, '-')}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
