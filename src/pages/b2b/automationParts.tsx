// src/pages/b2b/automationParts.tsx
//
// Bausteine der Automatisierungs-Landingpage: Geräterahmen für die echten
// Screenshots, Bildbetrachter je Referenz und der 3-Schritte-Prozess-Check
// (Conversion-Strecke, schreibt in b2b_contact_requests mit segment
// "automatisierung").

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Maximize2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { VoiceInput } from '../../components/VoiceInput';
import { triggerB2bBriefing } from '../../lib/b2bBriefing';
import { automationContent as c, type RefShot } from './automationContent';

export const LIME = '#DEFF9A';
export const SKY = '#38BDF8';
export const NAVY = '#0A192F';

/* ─── Geräterahmen ─────────────────────────────────────────────────────── */
export function BrowserFrame({ src, alt, eager = false, className = '' }: { src: string; alt: string; eager?: boolean; className?: string }) {
  return (
    <div className={`relative rounded-xl p-[1px] bg-gradient-to-br from-white/25 via-white/10 to-white/[0.04] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.85),0_0_60px_-20px_rgba(56,189,248,0.25)] ${className}`}>
      <div className="rounded-[calc(0.75rem-1px)] overflow-hidden bg-[#0b1626] ring-1 ring-black/40">
        <div className="relative flex items-center gap-1.5 px-3 py-2 bg-gradient-to-b from-[#12233c] to-[#0d1b2e] border-b border-white/5" aria-hidden="true">
          <span className="w-2 h-2 rounded-full bg-[#ff5f57] shadow-[0_0_6px_rgba(255,95,87,0.6)]" />
          <span className="w-2 h-2 rounded-full bg-[#febc2e] shadow-[0_0_6px_rgba(254,188,46,0.5)]" />
          <span className="w-2 h-2 rounded-full bg-[#28c840] shadow-[0_0_6px_rgba(40,200,64,0.5)]" />
          <span className="ml-3 h-4 flex-1 max-w-[220px] rounded-full bg-white/[0.06]" />
        </div>
        <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" className="block w-full h-auto" />
      </div>
    </div>
  );
}

export function PhoneFrame({ src, alt, eager = false, className = '' }: { src: string; alt: string; eager?: boolean; className?: string }) {
  return (
    <div className={`relative rounded-[2rem] p-[1px] bg-gradient-to-b from-white/30 via-white/10 to-white/[0.05] shadow-[0_45px_90px_-25px_rgba(0,0,0,0.9),0_0_50px_-15px_rgba(56,189,248,0.3)] ${className}`}>
      <div className="rounded-[calc(2rem-1px)] p-[7px] bg-gradient-to-b from-[#0d1c30] via-[#071426] to-[#04101f] ring-1 ring-black/50">
        <div className="relative rounded-[1.55rem] overflow-hidden ring-1 ring-white/10">
          <span aria-hidden="true" className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full bg-black/85 z-10 shadow-[inset_0_0_4px_rgba(0,0,0,0.8)]" />
          <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" className="block w-full h-auto" />
        </div>
      </div>
    </div>
  );
}

export function DocFrame({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative rounded-md p-[1px] bg-gradient-to-br from-white/25 via-white/10 to-white/[0.04] shadow-[0_40px_90px_-25px_rgba(0,0,0,0.85),0_0_50px_-20px_rgba(222,255,154,0.2)] rotate-[-1deg] ${className}`}>
      <div className="rounded-[calc(0.375rem-1px)] overflow-hidden bg-white ring-1 ring-black/20">
        <img src={src} alt={alt} loading="lazy" decoding="async" className="block w-full h-auto" />
      </div>
    </div>
  );
}

function Shot({ shot, eager }: { shot: RefShot; eager?: boolean }) {
  if (shot.device === 'mobile') return <PhoneFrame src={shot.src} alt={shot.alt} eager={eager} className="w-[230px] sm:w-[260px] mx-auto" />;
  if (shot.device === 'document') return <DocFrame src={shot.src} alt={shot.alt} />;
  return <BrowserFrame src={shot.src} alt={shot.alt} eager={eager} />;
}

/* ─── Bildbetrachter je Referenz (Thumbnails + Vollbild) ───────────────── */
export function ShotViewer({ shots }: { shots: readonly RefShot[] }) {
  const reduce = useReducedMotion() ?? false;
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  useEffect(() => setI(0), [shots]);
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setZoom(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoom]);
  const shot = shots[Math.min(i, shots.length - 1)];
  const allMobile = shots.every((s) => s.device === 'mobile');

  return (
    <div>
      {allMobile ? (
        /* Handy-Apps: alle Ansichten nebeneinander statt Umschalten */
        <div className="flex gap-4 sm:gap-7 justify-start sm:justify-center items-end overflow-x-auto snap-x snap-mandatory pb-3 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {shots.map((s, k) => (
            <figure key={s.src} className={`flex-shrink-0 snap-center ${k === 1 ? 'sm:-translate-y-6' : ''}`}>
              <PhoneFrame src={s.src} alt={s.alt} className="w-[185px] sm:w-[210px]" />
              <figcaption className="mt-3 max-w-[210px] text-center font-arimo text-[11px] text-white/60 leading-snug">{s.caption}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <>
          <div className="relative group">
            <AnimatePresence mode="wait">
              <motion.div key={shot.src} initial={{ opacity: 0, y: reduce ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.25 }}>
                <Shot shot={shot} eager />
              </motion.div>
            </AnimatePresence>
            {shot.device !== 'mobile' && (
              <button
                type="button"
                onClick={() => setZoom(true)}
                className="absolute top-10 right-3 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/60 text-white text-xs font-arimo font-bold opacity-0 group-hover:opacity-100 focus:opacity-100 transition b2b-focus-ring"
              >
                <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" /> Vergrößern
              </button>
            )}
          </div>
          <p className="mt-3 font-arimo text-xs text-white/60 text-center">{shot.caption}</p>
          {shots.length > 1 && (
            <div className="mt-4 flex justify-center gap-2" role="tablist" aria-label="Ansicht wählen">
              {shots.map((s, k) => (
                <button
                  key={s.src}
                  type="button"
                  role="tab"
                  aria-selected={k === i}
                  aria-label={s.caption}
                  onClick={() => setI(k)}
                  className={`relative w-20 sm:w-24 rounded-lg overflow-hidden border-2 transition b2b-focus-ring ${k === i ? 'border-[#DEFF9A]' : 'border-white/10 opacity-60 hover:opacity-100'}`}
                >
                  <img src={s.src} alt="" loading="lazy" className="block w-full h-12 sm:h-14 object-cover object-top" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {zoom && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setZoom(false)}
            role="dialog" aria-modal="true" aria-label={shot.alt}
          >
            <button type="button" onClick={() => setZoom(false)} className="absolute top-4 right-4 p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10" aria-label="Schließen"><X className="w-6 h-6" /></button>
            <img src={shot.src} alt={shot.alt} className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Prozess-Check: 3 Schritte → Anfrage ──────────────────────────────── */
export function ProcessCheck({ presetArea, presetDetails }: { presetArea?: string | null; presetDetails?: string | null }) {
  const reduce = useReducedMotion() ?? false;
  const [step, setStep] = useState(0);
  const [area, setArea] = useState<string>('');
  const [volume, setVolume] = useState<string>('');
  const [timing, setTiming] = useState<string>('');
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', note: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  // Vorauswahl aus dem "Wo verlieren Sie Zeit?"-Finder
  useEffect(() => {
    if (presetArea) { setArea(presetArea); setStep(1); }
  }, [presetArea]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending'); setError('');
    const message = [
      `Prozess-Check (Automatisierung)`,
      area ? `Bereich: ${area}` : '',
      volume ? `Zeitaufwand heute: ${volume}` : '',
      timing ? `Zeitrahmen: ${timing}` : '',
      presetDetails ? `Rechner-Auswahl: ${presetDetails}` : '',
      form.note.trim() ? `Anliegen: ${form.note.trim()}` : '',
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
        contact: {
          name: form.name.trim(),
          company: form.company.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
        },
        segment: 'automatisierung',
        need: message,
        answers: {
          bereich: area,
          zeitaufwand_heute: volume,
          zeitrahmen: timing,
          rechner_auswahl: presetDetails || '–',
          anliegen: form.note.trim(),
        },
      });
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Senden fehlgeschlagen.');
    }
  };

  const Choice = ({ value, current, onPick }: { value: string; current: string; onPick: (v: string) => void }) => (
    <button
      type="button"
      onClick={() => { onPick(value); setStep((s) => s + 1); }}
      className={`flex items-center justify-between gap-3 w-full text-left px-4 py-3.5 rounded-xl border font-arimo text-sm font-semibold transition b2b-focus-ring ${
        current === value ? 'border-[#DEFF9A] bg-[#DEFF9A]/10 text-white' : 'border-white/12 bg-white/[0.03] text-white/80 hover:border-white/30 hover:bg-white/[0.06]'
      }`}
    >
      {value}
      <ArrowRight className="w-4 h-4 text-white/40 flex-shrink-0" aria-hidden="true" />
    </button>
  );

  const titles = ['Um welchen Bereich geht es?', 'Wie viel Zeit kostet das heute?', 'Wann soll es losgehen?', 'Wohin dürfen wir die Einschätzung schicken?'];
  const input = 'w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/12 text-white placeholder-white/35 font-arimo text-sm focus:outline-none focus:border-[#DEFF9A]';

  if (status === 'done') {
    return (
      <div className="text-center py-10">
        <CheckCircle2 className="w-12 h-12 mx-auto text-[#DEFF9A] mb-4" aria-hidden="true" />
        <p className="font-poppins font-black text-2xl text-white mb-2">Anfrage ist da!</p>
        <p className="font-arimo text-white/65 max-w-md mx-auto">{c.check.success}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Fortschritt */}
      <div className="flex items-center gap-2 mb-6" aria-hidden="true">
        {[0, 1, 2, 3].map((k) => (
          <span key={k} className="h-1.5 flex-1 rounded-full transition-colors" style={{ background: k <= step ? LIME : 'rgba(255,255,255,0.12)' }} />
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
          {step === 0 && <div className="grid sm:grid-cols-2 gap-2.5">{c.check.areas.map((a) => <Choice key={a} value={a} current={area} onPick={setArea} />)}</div>}
          {step === 1 && <div className="grid gap-2.5">{c.check.volumes.map((a) => <Choice key={a} value={a} current={volume} onPick={setVolume} />)}</div>}
          {step === 2 && <div className="grid gap-2.5">{c.check.timings.map((a) => <Choice key={a} value={a} current={timing} onPick={setTiming} />)}</div>}
          {step === 3 && (
            <form onSubmit={submit} className="grid gap-3">
              <div className="flex flex-wrap gap-1.5 mb-1">
                {[area, volume, timing].filter(Boolean).map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#DEFF9A]/10 border border-[#DEFF9A]/30 font-arimo text-[11px] font-bold text-[#DEFF9A]"><Check className="w-3 h-3" aria-hidden="true" />{t}</span>
                ))}
              </div>
              {presetDetails && (
                <div className="rounded-xl px-3.5 py-2.5 bg-[#38BDF8]/[0.08] border border-[#38BDF8]/25 flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#38BDF8] flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="font-arimo text-xs text-[#7dd3fc] leading-relaxed">
                    <span className="font-bold text-white">Aus dem Angebots-Rechner übernommen:</span>
                    <span className="block mt-0.5">{presetDetails}</span>
                  </div>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-3">
                <input className={input} required placeholder="Ihr Name *" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Ihr Name" />
                <input className={input} placeholder="Unternehmen" autoComplete="organization" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} aria-label="Unternehmen" />
                <input className={input} required type="email" placeholder="E-Mail *" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-label="E-Mail" />
                <input className={input} type="tel" placeholder="Telefon (optional)" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-label="Telefon" />
              </div>
              <textarea className={`${input} resize-none`} rows={3} placeholder="Optional: Welcher Ablauf nervt am meisten?" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} aria-label="Ablauf beschreiben" />
              {status === 'error' && <p className="font-arimo text-sm text-red-400">{error}</p>}
              <button type="submit" disabled={status === 'sending'} className="mt-1 inline-flex items-center justify-center gap-2 w-full px-6 py-4 rounded-2xl font-arimo font-bold text-[#0A192F] b2b-focus-ring transition hover:shadow-xl hover:shadow-[#DEFF9A]/20 disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }}>
                {status === 'sending' ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Wird gesendet …</> : <>Kostenlose Einschätzung anfordern <ArrowRight className="w-4 h-4" aria-hidden="true" /></>}
              </button>
              <p className="font-arimo text-[11px] text-white/40 text-center">Unverbindlich und kostenlos. Ihre Angaben nutzen wir nur für diese Anfrage. <a href="/#/datenschutz" className="underline hover:text-white/70">Datenschutz</a></p>
            </form>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
