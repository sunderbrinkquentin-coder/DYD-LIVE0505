// src/pages/b2b/OfferCalculator.tsx
//
// Interaktiver Angebots-Rechner: Projekttyp + Groesse waehlen, sofort
// Preisspanne + Dauer sehen. Basierend auf offerCalculator.ts (Stundensatz
// 50 EUR, 30 % Puffer). Der finale Preis bleibt "fester Preis nach
// Prozess-Check" – der Rechner liefert die ehrliche Groessenordnung.

import { useMemo, useState } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Clock, Euro, PackageCheck, Calculator, XCircle } from 'lucide-react';
import { PROJECT_TYPES, SIZE_LABELS, estimate, typeIncludes, exampleRefFor, type ProjectSizeId } from '../../config/offerCalculator';

const NOT_INCLUDED = ['Laufende Betriebs- und KI-Nutzungsgebühren', 'Spätere Weiterentwicklungen (auf Wunsch, wieder fester Preis)'];

export function OfferCalculator({ onCheck }: { onCheck: (presetArea?: string) => void }) {
  const reduce = useReducedMotion() ?? false;
  const [typeId, setTypeId] = useState(PROJECT_TYPES[1].id); // KI-Chatbot als Start
  const [size, setSize] = useState<ProjectSizeId>('mittel');

  const result = useMemo(() => estimate(typeId, size), [typeId, size]);
  const includes = useMemo(() => typeIncludes(typeId), [typeId]);
  const exampleRef = exampleRefFor(typeId);

  return (
    <div className="rounded-[2rem] p-6 sm:p-8 bg-gradient-to-b from-white/[0.07] to-white/[0.03] border border-white/12">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)' }}>
          <Calculator className="w-5 h-5 text-[#0A192F]" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-poppins font-black text-xl" style={{ letterSpacing: '-0.02em' }}>Was würde es kosten?</h3>
          <p className="font-arimo text-xs text-white/50">Zwei Klicks zur ehrlichen Größenordnung.</p>
        </div>
      </div>

      {/* Schritt 1: Projekttyp */}
      <fieldset className="mb-5">
        <legend className="font-arimo text-xs font-bold uppercase tracking-wide text-[#38BDF8] mb-2.5">1. Was soll entstehen?</legend>
        <div className="flex flex-wrap gap-2">
          {PROJECT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypeId(t.id)}
              aria-pressed={typeId === t.id}
              className={`px-3.5 py-2 rounded-xl font-arimo text-xs sm:text-sm font-bold border transition b2b-focus-ring ${typeId === t.id ? 'text-[#0A192F] border-transparent' : 'text-white/70 border-white/15 hover:text-white hover:border-white/35'}`}
              style={typeId === t.id ? { background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)' } : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Schritt 2: Umfang */}
      <fieldset className="mb-6">
        <legend className="font-arimo text-xs font-bold uppercase tracking-wide text-[#38BDF8] mb-2.5">2. Wie umfangreich?</legend>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(SIZE_LABELS) as ProjectSizeId[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              aria-pressed={size === s}
              className={`px-3 py-2.5 rounded-xl font-arimo text-xs font-bold border transition text-left b2b-focus-ring ${size === s ? 'text-[#0A192F] border-transparent' : 'text-white/70 border-white/15 hover:text-white hover:border-white/35'}`}
              style={size === s ? { background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)' } : undefined}
            >
              <span className="block">{SIZE_LABELS[s].label}</span>
              <span className={`block text-[10px] font-normal leading-tight mt-0.5 ${size === s ? 'text-[#0A192F]/70' : 'text-white/40'}`}>{SIZE_LABELS[s].hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Ergebnis */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={typeId + size}
            initial={{ opacity: 0, y: reduce ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -8 }}
            transition={{ duration: reduce ? 0 : 0.25 }}
          >
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <div className="rounded-2xl p-4 border border-[#DEFF9A]/25 bg-[#DEFF9A]/[0.06]">
                <p className="flex items-center gap-1.5 font-arimo text-[11px] font-bold uppercase tracking-wide text-[#DEFF9A] mb-1"><Euro className="w-3.5 h-3.5" aria-hidden="true" />Übliche Preisspanne</p>
                <p className="font-poppins font-black text-2xl text-white leading-tight">{result.priceMin} – {result.priceMax}</p>
                <p className="font-arimo text-[11px] text-white/45 mt-1">Fester Preis nach Prozess-Check – keine Stundenabrechnung.</p>
              </div>
              <div className="rounded-2xl p-4 border border-[#38BDF8]/25 bg-[#38BDF8]/[0.06]">
                <p className="flex items-center gap-1.5 font-arimo text-[11px] font-bold uppercase tracking-wide text-[#38BDF8] mb-1"><Clock className="w-3.5 h-3.5" aria-hidden="true" />Umsetzungsdauer</p>
                <p className="font-poppins font-black text-2xl text-white leading-tight">{result.weeksLabel}</p>
                <p className="font-arimo text-[11px] text-white/45 mt-1">{result.hoursLabel}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/10">
                <p className="flex items-center gap-1.5 font-arimo text-[11px] font-bold uppercase tracking-wide text-white/60 mb-2"><PackageCheck className="w-3.5 h-3.5 text-[#DEFF9A]" aria-hidden="true" />Enthalten</p>
                <ul className="space-y-1.5">
                  {includes.map((i) => (
                    <li key={i} className="flex items-start gap-2 font-arimo text-xs text-white/75"><Check className="w-3.5 h-3.5 text-[#DEFF9A] flex-shrink-0 mt-0.5" aria-hidden="true" />{i}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/10">
                <p className="flex items-center gap-1.5 font-arimo text-[11px] font-bold uppercase tracking-wide text-white/60 mb-2"><XCircle className="w-3.5 h-3.5 text-[#EF8A8A]" aria-hidden="true" />Nicht enthalten</p>
                <ul className="space-y-1.5">
                  {NOT_INCLUDED.map((i) => (
                    <li key={i} className="flex items-start gap-2 font-arimo text-xs text-white/60"><span className="mt-1.5 w-1 h-1 rounded-full bg-white/40 flex-shrink-0" aria-hidden="true" />{i}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => onCheck()}
                className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-arimo font-bold text-[#0A192F] b2b-focus-ring transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#DEFF9A]/25"
                style={{ background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)' }}
              >
                Kostenlosen Prozess-Check starten
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </button>
              {exampleRef && (
                <a
                  href={`#/business/automatisierung?projekt=${exampleRef}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-arimo font-bold text-sm text-white border border-white/20 hover:bg-white/5 b2b-focus-ring transition"
                >
                  Live-Beispiel ansehen
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
