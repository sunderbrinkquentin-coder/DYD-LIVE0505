// src/pages/b2b/OfferCalculator.tsx
//
// Interaktiver Angebots-Rechner: Projekttyp waehlen, dann Budget-Regler
// verschieben – Preis, Dauer und Aufwand aktualisieren sich live. Bei
// "Eigene App" ist der Spielraum besonders gross (flexNote). Der finale
// Preis bleibt "fester Preis nach Prozess-Check".

import { useMemo, useState } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Clock, Euro, PackageCheck, Calculator, XCircle, Sparkles, Flame, GripHorizontal, SlidersHorizontal } from 'lucide-react';
import { PROJECT_TYPES, estimateByBudget, typeIncludes, exampleRefFor, projectTypeInfo, type ProjectSizeId } from '../../config/offerCalculator';
import { CalBookingButton } from './CalBookingButton';

const NOT_INCLUDED = ['Laufende Betriebs- und KI-Nutzungsgebühren', 'Spätere Weiterentwicklungen (auf Wunsch, wieder fester Preis)'];

/** Schnellwahl-Punkte auf dem Regler (0..1 innerhalb des Typ-Bereichs) */
const PRESETS: { id: ProjectSizeId; label: string; hint: string; fraction: number }[] = [
  { id: 'klein', label: 'Einstieg', hint: 'schlank starten', fraction: 0 },
  { id: 'mittel', label: 'Mittel', hint: 'typischer Erstumfang', fraction: 0.5 },
  { id: 'gross', label: 'Groß', hint: 'volles System', fraction: 1 },
];

export function OfferCalculator({ onCheck }: { onCheck: (presetArea?: string, presetDetails?: string) => void }) {
  const reduce = useReducedMotion() ?? false;
  const [typeId, setTypeId] = useState(PROJECT_TYPES[1].id); // KI-Chatbot als Start
  const [fraction, setFraction] = useState(0.5);

  const result = useMemo(() => estimateByBudget(typeId, fraction), [typeId, fraction]);
  const includes = useMemo(() => typeIncludes(typeId), [typeId]);
  const exampleRef = exampleRefFor(typeId);
  const type = projectTypeInfo(typeId);

  const selectType = (id: string) => {
    setTypeId(id);
    setFraction(0.5);
  };

  const requestDetails = result && type
    ? `${type.label} · Orientierung ${result.priceMin}–${result.priceMax} · ${result.weeksLabelShort}`
    : undefined;

  return (
    <div className="rounded-[2rem] p-6 sm:p-8 bg-gradient-to-b from-white/[0.07] to-white/[0.03] border border-white/12">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)' }}>
          <Calculator className="w-5 h-5 text-[#0A192F]" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-poppins font-black text-xl" style={{ letterSpacing: '-0.02em' }}>Was würde es kosten?</h3>
          <p className="font-arimo text-xs text-white/50">Typ wählen, Regler verschieben – der Preis folgt live.</p>
        </div>
      </div>

      {/* Schritt 1: Projekttyp */}
      <fieldset className="mb-6">
        <legend className="font-arimo text-xs font-bold uppercase tracking-wide text-[#38BDF8] mb-2.5">1. Was soll entstehen?</legend>
        <div className="flex flex-wrap gap-2">
          {PROJECT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectType(t.id)}
              aria-pressed={typeId === t.id}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-arimo text-xs sm:text-sm font-bold border transition b2b-focus-ring ${typeId === t.id ? 'text-[#0A192F] border-transparent' : 'text-white/70 border-white/15 hover:text-white hover:border-white/35'}`}
              style={typeId === t.id ? { background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)' } : undefined}
            >
              {t.popular && typeId !== t.id && <Sparkles className="w-3.5 h-3.5 text-[#DEFF9A]" aria-hidden="true" />}
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Ergebnis */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={typeId}
            initial={{ opacity: 0, y: reduce ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -8 }}
            transition={{ duration: reduce ? 0 : 0.25 }}
          >
            {/* Preis-Hero mit verschiebbarem Budget-Regler */}
            <div className="relative rounded-[1.25rem] p-[1px] mb-4 bg-gradient-to-br from-[#DEFF9A]/70 via-[#38BDF8]/40 to-white/10 shadow-[0_30px_70px_-25px_rgba(56,189,248,0.35)]">
              <div className="rounded-[calc(1.25rem-1px)] p-5 sm:p-6 bg-[#0A192F]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="flex items-center gap-1.5 font-arimo text-[11px] font-bold uppercase tracking-wide text-[#DEFF9A]"><Euro className="w-3.5 h-3.5" aria-hidden="true" />Ihr Budget-Spielfeld</p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-arimo text-[10px] font-bold bg-[#22c55e]/15 text-[#86efac]">Fester Preis</span>
                </div>
                <p className="font-poppins font-black text-3xl sm:text-4xl leading-none bg-gradient-to-r from-[#DEFF9A] to-[#38BDF8] bg-clip-text text-transparent transition-all" style={{ letterSpacing: '-0.02em' }}>
                  {result.priceMin} – {result.priceMax}
                </p>

                {/* Verschiebbarer Regler */}
                <div className="mt-6">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(fraction * 100)}
                    onChange={(e) => setFraction(Number(e.target.value) / 100)}
                    aria-label="Umfang einstellen – Preis passt sich live an"
                    className="b2b-range w-full cursor-pointer appearance-none bg-transparent"
                  />
                  <div className="flex justify-between mt-1.5 font-arimo text-[10px] text-white/40">
                    <span>Schlanker Einstieg</span>
                    <span className="inline-flex items-center gap-1 text-[#DEFF9A]/80"><SlidersHorizontal className="w-3 h-3" aria-hidden="true" />Regler verschieben</span>
                    <span>Volles System</span>
                  </div>
                  {/* Schnellwahl-Markierungen */}
                  <div className="flex gap-2 mt-3">
                    {PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFraction(p.fraction)}
                        aria-pressed={Math.abs(fraction - p.fraction) < 0.05}
                        className={`flex-1 rounded-xl px-2 py-2 text-center border transition b2b-focus-ring ${
                          Math.abs(fraction - p.fraction) < 0.05
                            ? 'border-[#DEFF9A] bg-[#DEFF9A]/[0.08]'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/30'
                        }`}
                      >
                        <span className={`block font-arimo text-[11px] font-bold ${Math.abs(fraction - p.fraction) < 0.05 ? 'text-[#DEFF9A]' : 'text-white/60'}`}>{p.label}</span>
                        <span className="block font-arimo text-[10px] text-white/40">{p.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {type && <p className="font-arimo text-sm text-[#7dd3fc] mt-4 flex items-start gap-1.5"><Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />{type.tagline}</p>}
                {type?.flexNote && (
                  <p className="font-arimo text-xs text-[#DEFF9A]/85 mt-2 rounded-xl px-3 py-2 bg-[#DEFF9A]/[0.06] border border-[#DEFF9A]/20 leading-relaxed">
                    {type.flexNote}
                  </p>
                )}
                <p className="font-arimo text-xs text-white/50 mt-3">Verbindlicher Festpreis nach dem kostenlosen Prozess-Check – keine offene Stundenabrechnung.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-2xl p-4 border border-[#38BDF8]/25 bg-[#38BDF8]/[0.06]">
                <p className="flex items-center gap-1.5 font-arimo text-[11px] font-bold uppercase tracking-wide text-[#38BDF8] mb-1"><Clock className="w-3.5 h-3.5" aria-hidden="true" />Umsetzungsdauer</p>
                <p className="font-poppins font-black text-xl text-white leading-tight">{result.weeksLabelShort}</p>
                <p className="font-arimo text-[11px] text-white/45 mt-1">frühe klickbare Version noch früher</p>
              </div>
              <div className="rounded-2xl p-4 border border-white/10 bg-white/[0.03]">
                <p className="flex items-center gap-1.5 font-arimo text-[11px] font-bold uppercase tracking-wide text-white/60 mb-1"><Calculator className="w-3.5 h-3.5" aria-hidden="true" />Aufwand</p>
                <p className="font-poppins font-black text-xl text-white leading-tight">{result.hoursLabel.split(' ')[0]}</p>
                <p className="font-arimo text-[11px] text-white/45 mt-1">Arbeitsstunden inkl. Puffer</p>
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

            {/* Vertrauenselemente */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
              {[
                'Antwort innerhalb von 24 h',
                'Kostenlos & unverbindlich',
                'Feste Zieldauer genannt',
              ].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 font-arimo text-[11px] font-semibold text-white/60"><Check className="w-3.5 h-3.5 text-[#DEFF9A]" aria-hidden="true" />{t}</span>
              ))}
            </div>

            {/* Knappheit + Empfehlung */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-5 rounded-2xl px-4 py-3 bg-[#DEFF9A]/[0.06] border border-[#DEFF9A]/20">
              <span className="inline-flex items-center gap-1.5 font-arimo text-[12px] font-bold text-[#DEFF9A]"><Flame className="w-4 h-4" aria-hidden="true" />Aktuell 2 freie Projektplätze pro Monat</span>
              <span className="font-arimo text-[11px] text-white/50">Der Prozess-Check sichert Ihren Platz – unverbindlich.</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => onCheck(type?.label, requestDetails)}
                className="group inline-flex items-center justify-center gap-2 w-full sm:flex-1 px-6 py-4 rounded-2xl font-arimo font-bold text-base text-[#0A192F] b2b-focus-ring transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#DEFF9A]/25"
                style={{ background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)' }}
              >
                Direkt Anfrage stellen – Auswahl wird übernommen
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </button>
              {exampleRef && (
                <a
                  href={`/business/automatisierung?projekt=${exampleRef}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-arimo font-bold text-sm text-white border border-white/20 hover:bg-white/5 b2b-focus-ring transition flex-shrink-0"
                >
                  Live-Beispiel ansehen
                </a>
              )}
            </div>
            <div className="flex justify-center mt-3">
              <CalBookingButton label="Lieber direkt Termin buchen?" variant="secondary" className="!px-5 !py-2.5 text-sm" />
            </div>
            <p className="font-arimo text-[11px] text-white/40 text-center mt-3">30 Minuten · online · ohne Verpflichtung</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
