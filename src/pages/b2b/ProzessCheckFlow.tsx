// src/pages/b2b/ProzessCheckFlow.tsx
//
// Conversion-Flow "3 Klicks zum Erstgespräch" als mehrstufiger Prozess:
//   1. Termin fixieren – konkretes Datum + Uhrzeit (Pflicht), optional
//      Direktbuchung im Cal.com-Kalender (falls VITE_CAL_LINK gesetzt).
//   2. Kontaktdaten (Name, E-Mail Pflicht, Entscheider-Haken).
//   3. KI-Berater: persönliche Bedarfsanalyse im Chat-Stil – stellt Fragen
//      wie ein professioneller Berater, mit Schnellantworten; auch später
//      per E-Mail nachreichbar.
// Wird sowohl inline auf der Seite als auch im Popup (bei "Direkt Anfrage
// stellen") verwendet. Schreibt in b2b_contact_requests (segment
// "automatisierung") und feuert den Make.com-Briefing-Webhook.

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Bot, CalendarCheck, Check, CheckCircle2, Loader2, Send, User, X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { triggerB2bBriefing } from '../../lib/b2bBriefing';
import { CalBookingButton } from './CalBookingButton';

const LIME = '#DEFF9A';
const SKY = '#38BDF8';

const TIMES = ['08:30', '10:00', '11:30', '14:00', '15:30', '17:00'];

/** Die nächsten count Werktage (Sa/So übersprungen) */
function nextBusinessDays(count = 10): Date[] {
  const out: Date[] = [];
  const d = new Date();
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) out.push(new Date(d));
  }
  return out;
}

const fmtDay = (d: Date) =>
  `${d.toLocaleDateString('de-DE', { weekday: 'short' })}, ${d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}`;

const fmtFull = (d: Date, time: string) =>
  `${d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} · ${time} Uhr`;

/* ─── Fragen des KI-Beraters ───────────────────────────────────────────── */
interface ConsultantQuestion {
  id: string;
  label: string;
  chips: string[];
  placeholder: string;
}

const QUESTIONS: ConsultantQuestion[] = [
  { id: 'ziel', label: 'Was soll die Lösung am Ende für Ihr Geschäft tun?', chips: ['Zeit sparen', 'Fehler reduzieren', 'Mehr Umsatz', 'Kunden besser bedienen'], placeholder: 'z. B. Angebote in 5 Minuten statt 2 Tagen' },
  { id: 'nutzer', label: 'Wer arbeitet damit – und wie viele?', chips: ['Nur ich', '2–5 Personen', '6–20 Personen', 'Kunden selbst'], placeholder: 'z. B. Vertrieb (3) + Backoffice (2)' },
  { id: 'tools', label: 'Mit welchen Tools arbeiten Sie heute?', chips: ['Excel / Tabellen', 'E-Mail & Outlook', 'CRM / Warenwirtschaft', 'Papier & Telefon'], placeholder: 'z. B. Excel, Lexware, Gmail' },
  { id: 'daten', label: 'Wo liegen Ihre Daten heute?', chips: ['Excel', 'Datenbank', 'Papier / Scans', 'In mehreren Köpfen'], placeholder: 'z. B. Kundenliste in Excel, Rechnungen auf Papier' },
  { id: 'schnittstellen', label: 'Soll etwas angebunden werden?', chips: ['Website', 'Buchhaltung', 'Shop / Bestellungen', 'Kalender / E-Mail', 'Noch offen'], placeholder: 'z. B. Google Kalender + SEPA-Lastschrift' },
  { id: 'budget', label: 'Welcher Rahmen passt ungefähr?', chips: ['bis 3.000 €', '3.000–8.000 €', '8.000–20.000 €', 'Noch offen'], placeholder: 'gerne auch „weiß nicht" – ich ordne das ein' },
];

/* ─── Der 3-Klick-Flow ─────────────────────────────────────────────────── */
export function ProzessCheckFlow({ presetArea, presetDetails }: { presetArea?: string | null; presetDetails?: string | null }) {
  const reduce = useReducedMotion() ?? false;
  const [step, setStep] = useState(0);
  const days = useMemo(() => nextBusinessDays(), []);
  const [day, setDay] = useState<Date | null>(null);
  const [time, setTime] = useState('');
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', note: '' });
  const [decider, setDecider] = useState(false);
  // KI-Berater-Chat
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [chatDraft, setChatDraft] = useState('');
  const [skippedAnalysis, setSkippedAnalysis] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Vorauswahl aus Finder / Rechner: direkt zu Schritt 1 (Termin) bzw. im Popup bleibt Termin Schritt 1
  useEffect(() => {
    if (presetArea) setStep(0);
  }, [presetArea]);

  useEffect(() => {
    if (step === 2) chatEndRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
  }, [qIdx, step, reduce]);

  const appointmentFull = day && time ? fmtFull(day, time) : '';
  const input = 'w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/12 text-white placeholder-white/35 font-arimo text-sm focus:outline-none focus:border-[#DEFF9A]';

  const submit = async (skipChat: boolean) => {
    if (!day || !time) { setError('Bitte wählen Sie zuerst Datum und Uhrzeit für Ihr Erstgespräch.'); setStep(0); return; }
    if (!form.name.trim() || !form.email.trim()) { setError('Bitte geben Sie Name und E-Mail an.'); setStep(1); return; }
    setStatus('sending');
    setError('');
    const analysis = QUESTIONS
      .map((q) => (answers[q.id]?.trim() ? `${q.id}: ${answers[q.id].trim()}` : ''))
      .filter(Boolean);
    const message = [
      'Prozess-Check (Automatisierung) – Termin gebunden',
      presetArea ? `Bereich: ${presetArea}` : '',
      presetDetails ? `Auswahl: ${presetDetails}` : '',
      `Festes Erstgespräch: ${appointmentFull}`,
      `Entscheider:in: ${decider ? 'ja' : 'nein'}`,
      form.note.trim() ? `Anliegen: ${form.note.trim()}` : '',
      skipChat || analysis.length === 0
        ? 'Bedarfsanalyse: wird vom KI-Berater per E-Mail nachgereicht'
        : `Bedarfsanalyse (KI-Berater):\n${analysis.map((l) => `- ${l}`).join('\n')}`,
    ].filter(Boolean).join('\n');
    try {
      const { error: err } = await supabase.from('b2b_contact_requests').insert({
        company_name: form.company.trim() || '–',
        contact_name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        segment: 'automatisierung',
        message,
      });
      if (err) throw err;
      triggerB2bBriefing({
        source: 'prozess-check',
        contact: { name: form.name.trim(), company: form.company.trim(), email: form.email.trim(), phone: form.phone.trim() || null },
        segment: 'automatisierung',
        need: message,
        answers: {
          bereich: presetArea || '–',
          rechner_auswahl: presetDetails || '–',
          termin_datum: day.toLocaleDateString('de-DE'),
          termin_uhrzeit: time,
          termin_fix: appointmentFull,
          entscheidet: decider ? 'ja' : 'nein',
          anliegen: form.note.trim(),
          bedarfsanalyse: skipChat || analysis.length === 0 ? 'nachgereicht-später' : analysis.join(' | '),
        },
      });
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Senden fehlgeschlagen.');
    }
  };

  const titles = ['Ihr Termin – Datum & Uhrzeit', 'Wohin dürfen wir bestätigen?', 'Ihre persönliche Bedarfsanalyse'];

  if (status === 'done') {
    return (
      <div className="text-center py-10">
        <CheckCircle2 className="w-12 h-12 mx-auto text-[#DEFF9A] mb-4" aria-hidden="true" />
        <p className="font-poppins font-black text-2xl text-white mb-2">Termin notiert!</p>
        <p className="font-arimo text-white/70 max-w-md mx-auto mb-3">
          Ihr Erstgespräch: <span className="font-bold text-white">{appointmentFull}</span>.
        </p>
        <p className="font-arimo text-white/60 max-w-md mx-auto">
          Die Bestätigung geht in wenigen Minuten an {form.email.trim()}. {skippedAnalysis || Object.keys(answers).length === 0
            ? 'Ihren Fragebogen zur Bedarfsanalyse senden wir Ihnen gleich per E-Mail mit – 2 Minuten, gerne vor dem Termin ausfüllen.'
            : 'Der KI-Berater hat Ihre Analyse bereits ausgewertet – Ihr Vorschlag liegt bei der Bestätigung bei.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Fortschritt: 3 Klicks */}
      <div className="flex items-center gap-2 mb-5" aria-hidden="true">
        {['Termin', 'Kontakt', 'Analyse'].map((label, k) => (
          <div key={label} className="flex-1">
            <span className="h-1.5 block rounded-full transition-colors" style={{ background: k <= step ? LIME : 'rgba(255,255,255,0.12)' }} />
            <span className={`mt-1 block font-arimo text-[10px] font-bold uppercase tracking-wide ${k === step ? 'text-[#DEFF9A]' : 'text-white/35'}`}>
              {k + 1}. {label}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mb-4">
        <p className="font-poppins font-bold text-lg text-white">{titles[step]}</p>
        {step > 0 && (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-1 font-arimo text-xs font-bold text-white/50 hover:text-white b2b-focus-ring rounded">
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Zurück
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: reduce ? 0 : 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduce ? 0 : -16 }} transition={{ duration: reduce ? 0 : 0.2 }}>
          {/* ── Schritt 1: Termin ── */}
          {step === 0 && (
            <div className="grid gap-4">
              <p className="font-arimo text-sm text-white/65">Wählen Sie Datum und Uhrzeit – das ist Ihr verbindlicher Terminwunsch für das kostenlose Erstgespräch (30 Min., online). Wir bestätigen sofort per E-Mail.</p>
              <div>
                <p className="font-arimo text-[11px] font-bold uppercase tracking-wide text-white/60 mb-2 flex items-center gap-1.5"><CalendarCheck className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />Datum</p>
                <div className="flex flex-wrap gap-2">
                  {days.map((d) => {
                    const sel = day?.toDateString() === d.toDateString();
                    return (
                      <button key={d.toISOString()} type="button" aria-pressed={sel}
                        onClick={() => setDay(sel ? null : d)}
                        className={`px-3.5 py-2 rounded-xl font-arimo text-xs font-bold border transition b2b-focus-ring ${sel ? 'border-[#DEFF9A] bg-[#DEFF9A]/10 text-[#DEFF9A]' : 'border-white/15 text-white/70 hover:border-white/35 hover:text-white'}`}>
                        {fmtDay(d)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="font-arimo text-[11px] font-bold uppercase tracking-wide text-white/60 mb-2 flex items-center gap-1.5"><CalendarCheck className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />Uhrzeit</p>
                <div className="flex flex-wrap gap-2">
                  {TIMES.map((t) => {
                    const sel = time === t;
                    return (
                      <button key={t} type="button" aria-pressed={sel}
                        onClick={() => setTime(sel ? '' : t)}
                        className={`px-3.5 py-2 rounded-xl font-arimo text-xs font-bold border transition b2b-focus-ring ${sel ? 'border-[#DEFF9A] bg-[#DEFF9A]/10 text-[#DEFF9A]' : 'border-white/15 text-white/70 hover:border-white/35 hover:text-white'}`}>
                        {t} Uhr
                      </button>
                    );
                  })}
                </div>
              </div>
              {day && time && (
                <div className="rounded-xl px-4 py-3 bg-[#DEFF9A]/[0.07] border border-[#DEFF9A]/25 font-arimo text-sm text-white flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#DEFF9A] flex-shrink-0" aria-hidden="true" />Ihr Termin: <span className="font-bold">{appointmentFull}</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <button type="button" onClick={() => setStep(1)} disabled={!day || !time}
                  className="group inline-flex items-center justify-center gap-2 flex-1 px-6 py-3.5 rounded-2xl font-arimo font-bold text-[#0A192F] b2b-focus-ring transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
                  style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }}>
                  Weiter – Kontakt <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </button>
                <CalBookingButton label="Direkt im Kalender buchen" variant="secondary" className="!px-5 !py-3.5 text-sm" />
              </div>
              <p className="font-arimo text-[11px] text-white/40">Sie sehen keinen passenden Slot? Buchen Sie direkt im Kalender oder schicken Sie uns eine Mail – wir finden eine Zeit.</p>
            </div>
          )}

          {/* ── Schritt 2: Kontakt ── */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); if (form.name.trim() && form.email.trim()) { setError(''); setStep(2); } else setError('Bitte geben Sie Name und E-Mail an.'); }} className="grid gap-3">
              <div className="flex flex-wrap gap-1.5">
                {[presetArea, presetDetails, appointmentFull].filter(Boolean).map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#DEFF9A]/10 border border-[#DEFF9A]/30 font-arimo text-[11px] font-bold text-[#DEFF9A]"><Check className="w-3 h-3" aria-hidden="true" />{t}</span>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input className={input} required placeholder="Ihr Name *" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Ihr Name" />
                <input className={input} placeholder="Unternehmen" autoComplete="organization" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} aria-label="Unternehmen" />
                <input className={input} required type="email" placeholder="E-Mail *" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-label="E-Mail" />
                <input className={input} type="tel" placeholder="Telefon (optional)" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-label="Telefon" />
              </div>
              <textarea className={`${input} resize-none`} rows={2} placeholder="Optional: Welcher Ablauf nervt am meisten?" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} aria-label="Ablauf beschreiben" />
              <label className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 bg-white/[0.04] border border-white/10 cursor-pointer select-none">
                <input type="checkbox" checked={decider} onChange={(e) => setDecider(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#DEFF9A]" />
                <span className="font-arimo text-xs text-white/75 leading-relaxed">Ich bin Entscheider:in und kann über das Projekt entscheiden.</span>
              </label>
              {error && <p className="font-arimo text-sm text-red-400">{error}</p>}
              <button type="submit" className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 rounded-2xl font-arimo font-bold text-[#0A192F] b2b-focus-ring transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#DEFF9A]/20" style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }}>
                Weiter – zum KI-Berater <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <p className="font-arimo text-[11px] text-white/40 text-center">Unverbindlich und kostenlos. Ihre Angaben nutzen wir nur für diese Anfrage. <a href="/#/datenschutz" className="underline hover:text-white/70">Datenschutz</a></p>
            </form>
          )}

          {/* ── Schritt 3: KI-Berater-Bedarfsanalyse ── */}
          {step === 2 && (
            <div className="grid gap-3">
              <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 max-h-[340px] overflow-y-auto space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }}><Bot className="w-4 h-4 text-[#0A192F]" aria-hidden="true" /></span>
                  <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 bg-white/[0.06] border border-white/10 font-arimo text-sm text-white/85 leading-relaxed">
                    Schön, {form.name.trim() || 'schön, dass Sie da sind'}! Ich bin Ihr persönlicher Berater. In ~2 Minuten klären wir die wichtigsten Punkte, damit Ihr Erstgespräch direkt konkret wird. Fertig?
                  </div>
                </div>
                {QUESTIONS.slice(0, qIdx).map((q, k) => (
                  <div key={q.id}>
                    <div className="flex items-start gap-2.5">
                      <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }}><Bot className="w-4 h-4 text-[#0A192F]" aria-hidden="true" /></span>
                      <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 bg-white/[0.06] border border-white/10 font-arimo text-sm text-white/85 leading-relaxed">{q.label}</div>
                    </div>
                    <div className="flex items-start gap-2.5 mt-2 justify-end">
                      <div className="rounded-2xl rounded-tr-sm px-3.5 py-2.5 font-arimo text-sm bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-white leading-relaxed">{answers[q.id]}</div>
                      <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/10"><User className="w-4 h-4 text-white/70" aria-hidden="true" /></span>
                    </div>
                    <span className="sr-only">Frage {k + 1}</span>
                  </div>
                ))}
                {qIdx < QUESTIONS.length ? (
                  <div className="flex items-start gap-2.5">
                    <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }}><Bot className="w-4 h-4 text-[#0A192F]" aria-hidden="true" /></span>
                    <div className="flex-1 rounded-2xl rounded-tl-sm px-3.5 py-2.5 bg-white/[0.06] border border-white/10">
                      <p className="font-arimo text-sm text-white/85 leading-relaxed mb-2">{QUESTIONS[qIdx].label}</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {QUESTIONS[qIdx].chips.map((chip) => (
                          <button key={chip} type="button"
                            onClick={() => setChatDraft(chatDraft ? `${chatDraft}, ${chip}` : chip)}
                            className="px-2.5 py-1 rounded-full font-arimo text-[11px] font-bold border border-white/15 text-white/70 hover:text-white hover:border-[#DEFF9A]/50 transition b2b-focus-ring">
                            {chip}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input className={input} placeholder={QUESTIONS[qIdx].placeholder} value={chatDraft} onChange={(e) => setChatDraft(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (chatDraft.trim()) { setAnswers({ ...answers, [QUESTIONS[qIdx].id]: chatDraft.trim() }); setChatDraft(''); setQIdx((i) => i + 1); } } }}
                          aria-label={QUESTIONS[qIdx].label} />
                        <button type="button" onClick={() => { if (chatDraft.trim()) { setAnswers({ ...answers, [QUESTIONS[qIdx].id]: chatDraft.trim() }); setChatDraft(''); setQIdx((i) => i + 1); } }}
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 b2b-focus-ring" style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }} aria-label="Antwort senden">
                          <Send className="w-4 h-4 text-[#0A192F]" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5">
                    <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }}><Bot className="w-4 h-4 text-[#0A192F]" aria-hidden="true" /></span>
                    <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 bg-white/[0.06] border border-white/10 font-arimo text-sm text-white/85 leading-relaxed">
                      Perfekt! Ich habe alles. Ihr Erstgespräch am <span className="font-bold">{appointmentFull}</span> wird so direkt konkret – gute Vorbereitung!
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              {error && <p className="font-arimo text-sm text-red-400">{error}</p>}
              <div className="grid sm:grid-cols-2 gap-2.5">
                <button type="button" onClick={() => { setSkippedAnalysis(true); submit(true); }} disabled={status === 'sending'}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-arimo font-bold text-sm text-white border border-white/20 hover:bg-white/5 b2b-focus-ring disabled:opacity-60">
                  {status === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null} Später per E-Mail
                </button>
                <button type="button" onClick={() => submit(false)} disabled={status === 'sending' || qIdx < QUESTIONS.length}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-arimo font-bold text-sm text-[#0A192F] b2b-focus-ring transition disabled:opacity-40"
                  style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }}>
                  {status === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <><CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Absenden & Termin sichern</>}
                </button>
              </div>
              {qIdx < QUESTIONS.length && <p className="font-arimo text-[11px] text-white/40 text-center">Noch {QUESTIONS.length - qIdx} Frage(n) – oder später per E-Mail beantworten.</p>}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─── Popup: Prozess mit Stunden/Preis + Flow ──────────────────────────── */
export function ProzessCheckModal({ open, onClose, presetArea, presetDetails }: {
  open: boolean; onClose: () => void; presetArea?: string | null; presetDetails?: string | null;
}) {
  const reduce = useReducedMotion() ?? false;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog" aria-modal="true" aria-label="Prozess-Check – Anfrage stellen">
      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 24, scale: reduce ? 1 : 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: reduce ? 0 : 16 }}
        transition={{ duration: reduce ? 0 : 0.25 }}
        className="relative w-full max-w-2xl my-6 rounded-[1.75rem] p-[1px] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.9),0_0_80px_-30px_rgba(56,189,248,0.35)]"
        style={{ background: `linear-gradient(160deg, rgba(222,255,154,0.4), rgba(56,189,248,0.25), rgba(255,255,255,0.08))` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-[calc(1.75rem-1px)] bg-[#0A192F] p-5 sm:p-7">
          <button type="button" onClick={onClose} className="absolute top-3 right-3 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 b2b-focus-ring" aria-label="Schließen">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Prozess-Kopf: Auswahl aus dem Rechner (Preis, Stunden, Dauer) */}
          {presetDetails && (
            <div className="mb-5 rounded-2xl px-4 py-3 bg-[#DEFF9A]/[0.07] border border-[#DEFF9A]/25">
              <p className="flex items-center gap-1.5 font-arimo text-[11px] font-bold uppercase tracking-wide text-[#DEFF9A] mb-1">
                <Check className="w-3.5 h-3.5" aria-hidden="true" />Ihre Auswahl wird übernommen
              </p>
              <p className="font-arimo text-sm text-white/85 leading-relaxed">{presetDetails}</p>
              <p className="font-arimo text-[11px] text-white/45 mt-1">Verbindlicher Festpreis nach dem Prozess-Check – keine offene Stundenabrechnung.</p>
            </div>
          )}

          <div className="flex items-center gap-2 mb-1">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }}><CalendarCheck className="w-4 h-4 text-[#0A192F]" aria-hidden="true" /></span>
            <h2 className="font-poppins font-black text-xl sm:text-2xl" style={{ letterSpacing: '-0.02em' }}>3 Klicks zum Erstgespräch</h2>
          </div>
          <p className="font-arimo text-xs text-white/50 mb-5">1 Termin fixieren · 2 Kontakt · 3 KI-Berater-Analyse – kostenlos, unverbindlich, Antwort sofort.</p>

          <ProzessCheckFlow presetArea={presetArea} presetDetails={presetDetails} />
        </div>
      </motion.div>
    </motion.div>
  );
}
