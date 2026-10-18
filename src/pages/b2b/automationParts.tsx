// src/pages/b2b/automationParts.tsx
//
// Bausteine der Automatisierungs-Landingpage: Geräterahmen für die echten
// Screenshots, Bildbetrachter je Referenz und der 3-Schritte-Prozess-Check
// (Conversion-Strecke, schreibt in b2b_contact_requests mit segment
// "automatisierung").

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Maximize2, Sparkles, Smartphone, Rocket, Wand2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { VoiceInput } from '../../components/VoiceInput';
import { triggerB2bBriefing } from '../../lib/b2bBriefing';
import { automationContent as c, type RefShot } from './automationContent';

export const LIME = '#DEFF9A';
export const SKY = '#38BDF8';
export const NAVY = '#0A192F';

/** Terminvorschläge für das Erstgespräch im Prozess-Check */

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

/* ─── Eigene App-Idee: individuelles Erlebnis-Panel ────────────────────── */
const APP_IDEAS = ['Kunden-App', 'Buchungs-App', 'Community-App', 'Sales-App', 'Mitglieder-App', 'Ihre Idee'];

export function AppIdeaPanel({ startCheck, openRef }: { startCheck: (area?: string, details?: string) => void; openRef: (id: string) => void }) {
  const reduce = useReducedMotion() ?? false;
  const [idea, setIdea] = useState<string>('');

  return (
    <div className="grid md:grid-cols-12 gap-6 items-center rounded-3xl p-5 sm:p-8 bg-gradient-to-br from-[#DEFF9A]/[0.07] via-white/[0.03] to-[#38BDF8]/[0.07] border border-[#DEFF9A]/30">
      <div className="md:col-span-5 order-2 md:order-1">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-arimo text-[10px] font-bold uppercase tracking-wide bg-[#DEFF9A]/15 text-[#DEFF9A]"><Wand2 className="w-3 h-3" aria-hidden="true" />100 % individuell</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-arimo text-[10px] font-bold uppercase tracking-wide bg-[#38BDF8]/15 text-[#7dd3fc]">Idee → klickbare App</span>
        </div>
        <p className="font-poppins font-black text-2xl leading-tight mb-3" style={{ letterSpacing: '-0.02em' }}>
          Ihre App. Ganz nach Ihren Wünschen.
        </p>
        <p className="font-arimo text-white/75 mb-4 leading-relaxed">
          Bei einer eigenen App bin ich <span className="font-bold text-[#DEFF9A]">ganz individuell unterwegs</span> – von der ersten Skizze über Design und Funktionen bis zum Betrieb. Sie sagen, was Ihre Kunden brauchen; ich setze es um, Schritt für Schritt mit frühen Testversionen zum Anfassen.
        </p>
        <p className="font-arimo text-xs font-bold uppercase tracking-wide text-[#DEFF9A] mb-2 flex items-center gap-1.5"><Rocket className="w-3.5 h-3.5" aria-hidden="true" />Was Sie bekommen</p>
        <ul className="space-y-2 mb-5">
          {['Alles nach Ihren Kundenwünschen – keine Baukasten-Grenzen', 'Früh eine klickbare Version statt langer Wartezeit', 'Fester Preis pro Baustein, flexibel erweiterbar', 'Übergabe inkl. Einführung – Sie behalten die Kontrolle'].map((t) => (
            <li key={t} className="flex items-start gap-2 font-arimo text-sm text-white/85"><Check className="w-4 h-4 text-[#DEFF9A] flex-shrink-0 mt-0.5" aria-hidden="true" />{t}</li>
          ))}
        </ul>

        <p className="font-arimo text-[11px] font-bold uppercase tracking-wide text-white/60 mb-2">Wonach klingt es bei Ihnen?</p>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {APP_IDEAS.map((label) => (
            <button key={label} type="button" aria-pressed={idea === label}
              onClick={() => setIdea(idea === label ? '' : label)}
              className={`px-3 py-1.5 rounded-full font-arimo text-xs font-bold border transition b2b-focus-ring ${idea === label ? 'text-[#0A192F] border-transparent' : 'text-white/70 border-white/15 hover:text-white hover:border-[#DEFF9A]/50'}`}
              style={idea === label ? { background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)' } : undefined}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button type="button" onClick={() => startCheck('Eigene App-Idee', idea ? `Eigene App – Richtung: ${idea}` : 'Eigene App – individuelle Idee')}
            className="group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-arimo font-bold text-sm text-[#0A192F] b2b-focus-ring transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#DEFF9A]/25"
            style={{ background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)' }}>
            App-Idee als Anfrage starten <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => openRef('beziehung')} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-arimo font-bold text-sm text-white border border-white/20 hover:bg-white/5 b2b-focus-ring">
            Beispiel-App ansehen <Smartphone className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
          </button>
        </div>
      </div>
      <button type="button" onClick={() => openRef('beziehung')} className="md:col-span-7 order-1 md:order-2 block text-left b2b-focus-ring rounded-xl group" aria-label="Beispiel einer eigenen App ansehen">
        <motion.div whileHover={reduce ? undefined : { scale: 1.015 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }} className="relative">
          <div className="flex gap-5 justify-center items-end">
            <PhoneFrame src="/b2b/refs/crm-cockpit.webp" alt="Individuelle Business-App: Kunden-Cockpit mit KI-Tagesbriefing (Beispiel)" className="w-[185px] sm:w-[205px]" />
            <PhoneFrame src="/b2b/refs/buchung-bestaetigung.webp" alt="Individuelle Business-App: automatische Buchungsbestätigung (Beispiel)" className="w-[185px] sm:w-[205px] sm:-translate-y-6" />
          </div>
          <div className="absolute inset-x-0 bottom-0 flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-arimo text-[11px] font-bold bg-black/70 text-white border border-white/20 backdrop-blur group-hover:bg-black/85 transition">
              <Smartphone className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />So könnte Ihre Business-App live aussehen
            </span>
          </div>
        </motion.div>
      </button>
    </div>
  );
}
