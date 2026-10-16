// src/features/advisor/AdvisorLeadCard.tsx
//
// Erstgespräch direkt im Chat (B2B): Termin wählen (Cal.com, falls
// VITE_CAL_LINK gesetzt – sonst Wunschtermin im Formular) oder Anfrage
// abschicken. Der Chatverlauf wird – nur mit Häkchen des Nutzers – an die
// Anfrage (b2b_contact_requests.message) bzw. an die Cal-Notiz angehängt.

import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Check, Loader2, Send, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CAL_DATA_NAMESPACE, ensureCalEmbedLoaded, getCalLink } from '../../lib/calBooking';
import { trackAdvisor } from './advisorAnalytics';
import type { ChatEntry } from './useAdvisorChat';

export type LeadView = 'teaser' | 'form' | 'sent';

const SLOTS = ['Vormittag (9–12 Uhr)', 'Mittag (12–14 Uhr)', 'Nachmittag (14–17 Uhr)', 'Flexibel'];
const ACCENT = '#30E3CA';

/** Bereich der Anfrage – steuert die Spalte "segment" */
export function leadSegment(page: string, entries: ChatEntry[]): 'automatisierung' | 'bildungstraeger' | 'unternehmen' {
  const text = entries.filter((e) => e.role === 'user').map((e) => e.text).join(' ');
  if (page === 'automation' || /automatisier|software|web-?app|app-?idee|chatbot|crm|workflow|ki-?assistent/i.test(text)) return 'automatisierung';
  if (/bildungstr[äa]ger|orbit|akademie|teilnehm/i.test(text)) return 'bildungstraeger';
  return 'unternehmen';
}

/** Chatverlauf als Klartext (gekürzt, neueste Nachrichten behalten) */
export function chatTranscript(entries: ChatEntry[], max = 3500): string {
  const lines = entries.map((e) => `${e.role === 'user' ? 'Kunde' : 'KI-Berater'}: ${e.text.trim()}`);
  let out = lines.join('\n');
  if (out.length > max) out = `… (gekürzt)\n${out.slice(out.length - max)}`;
  return out;
}

const SEGMENT_LABEL = { automatisierung: 'Automatisierung & Software', bildungstraeger: 'Bildungsträger (ORBIT)', unternehmen: 'Unternehmen (NEXUS)' } as const;

const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/12 text-base sm:text-sm text-white placeholder-white/35 focus:outline-none focus:border-[#30E3CA]';

export function AdvisorLeadCard({ page, entries, view, setView, withSlot, setWithSlot }: {
  page: string;
  entries: ChatEntry[];
  view: LeadView;
  setView: (v: LeadView) => void;
  withSlot: boolean;
  setWithSlot: (v: boolean) => void;
}) {
  const calLink = getCalLink();
  useEffect(() => { if (calLink) ensureCalEmbedLoaded(); }, [calLink]);

  const segment = leadSegment(page, entries);
  const transcript = useMemo(() => chatTranscript(entries), [entries]);
  const hasChat = entries.some((e) => e.role === 'user');

  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', date: '', slot: SLOTS[0], note: '' });
  const [shareChat, setShareChat] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => { if (view === 'form') requestAnimationFrame(() => firstField.current?.focus()); }, [view]);

  const tomorrow = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Cal.com: Name/E-Mail (falls schon eingegeben) und Chat als Notiz vorbefüllen
  const calConfig = JSON.stringify({
    layout: 'month_view',
    ...(form.name.trim() ? { name: form.name.trim() } : {}),
    ...(form.email.trim() ? { email: form.email.trim() } : {}),
    ...(hasChat ? { notes: `Anfrage über den KI-Chat (${SEGMENT_LABEL[segment]})\n\n${chatTranscript(entries, 1500)}` } : {}),
  });

  const openForm = (slot: boolean) => { setWithSlot(slot); setView('form'); trackAdvisor('advisor_lead_open'); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email.trim()) || !form.company.trim()) {
      setError('Bitte Name, Unternehmen und eine gültige E-Mail angeben.');
      return;
    }
    const parts = [
      `Anfrage über den KI-Chat · Bereich: ${SEGMENT_LABEL[segment]} · Seite: ${page}`,
      withSlot && form.date ? `Wunschtermin: ${new Date(form.date).toLocaleDateString('de-DE')} · ${form.slot}` : withSlot ? `Wunschtermin: ${form.slot}` : '',
      form.note.trim() ? `Nachricht: ${form.note.trim()}` : '',
      shareChat && hasChat ? `--- Chatverlauf ---\n${transcript}` : '',
    ].filter(Boolean);
    setBusy(true);
    try {
      const { error: err } = await supabase.from('b2b_contact_requests').insert({
        company_name: form.company.trim().slice(0, 200),
        contact_name: form.name.trim().slice(0, 200),
        email: form.email.trim().slice(0, 200),
        phone: form.phone.trim() ? form.phone.trim().slice(0, 60) : null,
        segment,
        message: parts.join('\n\n').slice(0, 6000),
      });
      if (err) throw err;
      trackAdvisor('advisor_lead_submit');
      setView('sent');
    } catch {
      setError('Das Senden hat nicht geklappt. Bitte versuchen Sie es noch einmal.');
    } finally {
      setBusy(false);
    }
  };

  if (view === 'sent') {
    return (
      <div className="rounded-2xl p-4 text-sm" style={{ background: 'rgba(48,227,202,0.08)', border: '1px solid rgba(48,227,202,0.35)' }} role="status">
        <p className="font-black text-white flex items-center gap-2"><Check size={16} className="text-[#30E3CA]" aria-hidden /> Danke, Ihre Anfrage ist angekommen.</p>
        <p className="text-white/70 mt-1 text-xs leading-relaxed">
          Quentin meldet sich persönlich bei Ihnen{withSlot ? ' und bestätigt den Termin' : ''}.{shareChat && hasChat ? ' Den Chatverlauf hat er schon vorliegen.' : ''}
        </p>
      </div>
    );
  }

  if (view === 'teaser') {
    return (
      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'linear-gradient(150deg,rgba(48,227,202,0.12),rgba(8,14,24,0.95) 65%)', border: '1px solid rgba(48,227,202,0.35)' }}>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#30E3CA]/85">Kostenloses Erstgespräch</p>
          <p className="text-sm font-black text-white leading-snug mt-0.5">30 Minuten mit Quentin – unverbindlich</p>
          <p className="text-xs text-white/65 mt-1 leading-relaxed">Wir schauen uns Ihr Anliegen gemeinsam an. Ihr Chatverlauf kann direkt mitgeschickt werden.</p>
        </div>
        <div className="flex gap-2">
          {calLink ? (
            <button
              type="button"
              onClick={() => trackAdvisor('advisor_booking_click')}
              data-cal-namespace={CAL_DATA_NAMESPACE}
              data-cal-link={calLink}
              data-cal-config={calConfig}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-black text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{ background: `linear-gradient(135deg,${ACCENT},#66c0b6)` }}
            >
              <CalendarDays size={15} aria-hidden /> Termin wählen
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openForm(true)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-black text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{ background: `linear-gradient(135deg,${ACCENT},#66c0b6)` }}
            >
              <CalendarDays size={15} aria-hidden /> Termin wählen
            </button>
          )}
          <button
            type="button"
            onClick={() => openForm(false)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold text-white bg-white/[0.07] border border-white/15 hover:border-[#30E3CA]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#30E3CA]"
          >
            <Send size={14} aria-hidden /> Anfrage senden
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-2xl p-4 space-y-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(48,227,202,0.35)' }} aria-label="Erstgespräch anfragen">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#30E3CA]/85">{withSlot ? 'Termin anfragen' : 'Anfrage senden'}</p>
          <p className="text-sm font-black text-white leading-snug mt-0.5">{SEGMENT_LABEL[segment]}</p>
        </div>
        <button type="button" onClick={() => setView('teaser')} className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#30E3CA]" aria-label="Formular schließen">
          <X size={15} aria-hidden />
        </button>
      </div>

      <label className="sr-only" htmlFor="lead-name">Name</label>
      <input id="lead-name" ref={firstField} className={inputCls} placeholder="Ihr Name *" autoComplete="name" value={form.name} onChange={set('name')} required />
      <label className="sr-only" htmlFor="lead-company">Unternehmen</label>
      <input id="lead-company" className={inputCls} placeholder="Unternehmen *" autoComplete="organization" value={form.company} onChange={set('company')} required />
      <label className="sr-only" htmlFor="lead-email">E-Mail</label>
      <input id="lead-email" type="email" className={inputCls} placeholder="E-Mail *" autoComplete="email" value={form.email} onChange={set('email')} required />
      <label className="sr-only" htmlFor="lead-phone">Telefon</label>
      <input id="lead-phone" type="tel" className={inputCls} placeholder="Telefon (optional)" autoComplete="tel" value={form.phone} onChange={set('phone')} />

      {withSlot ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="lead-date" className="block text-[11px] text-white/50 mb-1">Wunschtag</label>
            <input id="lead-date" type="date" min={tomorrow} className={`${inputCls} [color-scheme:dark]`} value={form.date} onChange={set('date')} />
          </div>
          <div>
            <label htmlFor="lead-slot" className="block text-[11px] text-white/50 mb-1">Uhrzeit</label>
            <select id="lead-slot" className={`${inputCls} [color-scheme:dark]`} value={form.slot} onChange={set('slot')}>
              {SLOTS.map((s) => <option key={s} value={s} className="bg-[#0a1220]">{s}</option>)}
            </select>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setWithSlot(true)} className="text-xs font-bold text-[#30E3CA] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#30E3CA] rounded">
          + Wunschtermin angeben
        </button>
      )}

      <label className="sr-only" htmlFor="lead-note">Nachricht</label>
      <textarea id="lead-note" rows={2} maxLength={1000} className={`${inputCls} resize-none`} placeholder="Noch etwas, das Quentin wissen sollte? (optional)" value={form.note} onChange={set('note')} />

      {hasChat && (
        <label className="flex items-start gap-2 text-xs text-white/70 cursor-pointer select-none">
          <input type="checkbox" checked={shareChat} onChange={(e) => setShareChat(e.target.checked)} className="mt-0.5 accent-[#30E3CA]" />
          <span>Chatverlauf mitsenden, damit Quentin Ihr Anliegen schon kennt</span>
        </label>
      )}

      {error && <p className="text-xs text-red-300" role="alert">{error}</p>}

      <button type="submit" disabled={busy} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-sm font-black text-black disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white" style={{ background: `linear-gradient(135deg,${ACCENT},#66c0b6)` }}>
        {busy ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Send size={14} aria-hidden />}
        {withSlot ? 'Termin anfragen' : 'Anfrage absenden'}
      </button>
      <p className="text-[10px] text-white/35 leading-relaxed">
        Ihre Angaben werden nur zur Bearbeitung Ihrer Anfrage gespeichert. <a href="#/datenschutz" className="underline hover:text-white/60">Datenschutz</a>
      </p>
    </form>
  );
}
