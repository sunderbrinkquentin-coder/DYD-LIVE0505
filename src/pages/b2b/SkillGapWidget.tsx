import { useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { b2bContent } from './content';

const NAVY_SKY = 'linear-gradient(135deg, #0A192F, #38BDF8)';
const SKY_LIME = 'linear-gradient(135deg, #38BDF8, #DEFF9A)';
const VIEWPORT = { once: true, margin: '-60px' } as const;

function useAnims() {
  const reduce = useReducedMotion() ?? false;
  const container: Variants = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.08 } } };
  const fadeUp: Variants = { hidden: { opacity: 0, y: reduce ? 0 : 16 }, show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.45 } } };
  return { reduce, container, fadeUp };
}

/**
 * NEU (01.10.2026, auf Kundenwunsch "soll so aussehen wie bei ORBIT"):
 * 1:1 nachgebaute MatchRing-Komponente aus dem echten ORBIT-Produkt
 * (JourneyPage.tsx, Gap-/Motivation-Schritt - dort zeigt sie
 * gapResult.match_percentage). Gleicher Mint->Blau-Verlauf (#8fecb4 ->
 * #2f8fd6), gleiche Ring-Mechanik (Umfang/Offset, -90deg gedreht, damit der
 * Ring oben beginnt) und dieselbe mittig platzierte Prozentzahl - bewusst
 * so originalgetreu wie möglich, damit dieses Marketing-Beispiel auf den
 * ersten Blick als "genau das, was Sie im echten Produkt sehen" erkennbar
 * ist. Einzige bewusste Abweichung: font-poppins statt "Baloo 2", weil
 * dieser Font auf der Marketing-Seite nicht geladen ist.
 */
function MatchRing({ percent, size = 88, reduce }: { percent: number; size?: number; reduce: boolean }) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - safePercent / 100);
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef1f7" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#dydMatchRingGradientMarketing)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: reduce ? 'none' : 'stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)' }}
        />
        <defs>
          <linearGradient id="dydMatchRingGradientMarketing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8fecb4" />
            <stop offset="100%" stopColor="#2f8fd6" />
          </linearGradient>
        </defs>
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-poppins font-black text-[#0F1E34]"
        style={{ fontSize: size * 0.22 }}
      >
        {safePercent}%
      </div>
    </div>
  );
}

/**
 * Interaktives "Show, don't tell"-Widget (NEU, 30.09.2026): statt nur zu
 * beschreiben, dass ORBIT Skill-Lücken sichtbar macht, zeigt es das direkt
 * an drei kuratierten Beispiel-Szenarien (siehe b2bContent.tabs.tabB.
 * skillGapDemo in content.ts). Bewusst mit klar sichtbarer "Illustrative
 * Beispieldaten"-Kennzeichnung, damit niemand das mit einer echten,
 * personalisierten Analyse verwechselt.
 */
export function SkillGapWidget({ onCta }: { onCta?: () => void }) {
  const { skillGapDemo } = b2bContent.tabs.tabB;
  const { reduce, container, fadeUp } = useAnims();
  const [activeIndex, setActiveIndex] = useState(0);
  const scenario = skillGapDemo.scenarios[activeIndex];
  // NEU (01.10.2026): einfache, nachvollziehbare Vorhanden/Lücke-Klassifi-
  // kation aus den bestehenden has/need-Werten (kein neues Datenfeld noetig)
  // - deckt sich mit der binaeren "Vorhanden"-/"Noch zu lernen"-Logik des
  // echten ORBIT-Gap-Schritts (dort: covered_skills vs. Luecken-Skills).
  const covered = scenario.skills.filter((s) => s.has >= s.need);
  const gaps = scenario.skills.filter((s) => s.has < s.need);
  const matchPercent = Math.round((covered.length / scenario.skills.length) * 100);

  return (
    <div>
      <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border border-[#38BDF8]/30 bg-[#38BDF8]/5">
          <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
          <span className="font-arimo text-xs font-bold text-[#38BDF8] uppercase tracking-wide">Live-Beispiel</span>
        </div>
        <h3 className="font-poppins font-bold text-xl sm:text-2xl text-[#0F1E34] mb-2">{skillGapDemo.title}</h3>
        <p className="font-arimo text-[#55637A] max-w-2xl mx-auto leading-relaxed">{skillGapDemo.subtitle}</p>
      </motion.div>

      {/* Szenario-Umschalter */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-wrap justify-center gap-2 mb-8"
        role="tablist"
        aria-label="Beispiel-Szenario wählen"
      >
        {skillGapDemo.scenarios.map((s, i) => {
          const selected = i === activeIndex;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveIndex(i)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-arimo font-bold border transition b2b-focus-ring ${
                selected
                  ? 'text-white border-transparent shadow-md'
                  : 'text-[#55637A] border-[#E3EBF5] bg-white hover:border-[#38BDF8]/40 hover:text-[#0F1E34]'
              }`}
              style={selected ? { background: NAVY_SKY } : undefined}
            >
              {s.fromLabel} <ArrowRight className="inline w-3 h-3 mx-1" aria-hidden="true" /> {s.toLabel}
            </button>
          );
        })}
      </motion.div>

      {/* UEBERARBEITET (01.10.2026, auf Kundenwunsch "soll so aussehen wie
          bei ORBIT"): vorher zwei uebereinandergelegte Prozent-Balken in der
          Marketing-Navy/Sky-Optik - hatte mit dem echten Ergebnis-Bildschirm
          in ORBIT optisch nichts zu tun. Jetzt dieselbe visuelle Sprache wie
          im echten Produkt (siehe MatchRing-Komponente oben + .skill-chip/
          .gap-section-label in journey.css des ORBIT-Dashboard-Projekts):
          ein animierter Match-Ring fuer die Gesamt-Uebereinstimmung, darunter
          zwei Sektionen mit pillenfoermigen Chips - gruen fuer "Vorhanden",
          rot fuer "Noch zu lernen" - statt gestapelter Balken. */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="max-w-2xl mx-auto rounded-2xl p-6 sm:p-8 bg-white border border-[#E3EBF5]"
      >
        <div className="flex items-center gap-5 sm:gap-6 mb-7">
          <MatchRing percent={matchPercent} reduce={reduce} />
          <p className="font-arimo text-sm text-[#55637A] leading-relaxed">
            Für die Zielrolle <strong className="text-[#0F1E34]">{scenario.toLabel}</strong> sind bereits{' '}
            <strong className="text-[#0F1E34]">{matchPercent}%</strong> der betrachteten Skills vorhanden.
          </p>
        </div>

        <div className="space-y-5 mb-6">
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#178a4c' }} aria-hidden="true" />
              <span className="font-arimo text-xs font-bold text-[#0F1E34]">Vorhanden ({covered.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {covered.length === 0 && <span className="font-arimo text-xs text-[#94a3b8]">Noch keine der betrachteten Skills.</span>}
              {covered.map((s) => (
                <span
                  key={`${scenario.id}-${s.label}-covered`}
                  className="inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background: '#e5f8ec', color: '#178a4c' }}
                >
                  {s.label}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#c23a3a' }} aria-hidden="true" />
              <span className="font-arimo text-xs font-bold text-[#0F1E34]">Noch zu lernen ({gaps.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {gaps.length === 0 && <span className="font-arimo text-xs text-[#94a3b8]">Keine offenen Lücken.</span>}
              {gaps.map((s) => (
                <span
                  key={`${scenario.id}-${s.label}-gap`}
                  className="inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background: '#fdeff0', color: '#c23a3a' }}
                >
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 mb-5" style={{ background: '#eaf4fc', border: '1px solid #cfe6f8' }}>
          <p className="font-arimo text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#1f6fae' }}>Passende Weiterbildung</p>
          <p className="font-arimo text-sm text-[#0F1E34] font-semibold">{scenario.recommendedCourse}</p>
        </div>

        <button
          type="button"
          onClick={onCta}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-arimo font-bold text-sm text-white b2b-focus-ring transition hover:-translate-y-0.5"
          style={{ background: SKY_LIME, color: '#0A192F' }}
        >
          {skillGapDemo.ctaLabel}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>

        <p className="text-center font-arimo text-[11px] text-[#94a3b8] mt-4">{skillGapDemo.note}</p>
      </motion.div>
    </div>
  );
}