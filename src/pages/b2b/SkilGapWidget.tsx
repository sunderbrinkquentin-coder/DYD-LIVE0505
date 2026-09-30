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

      {/* Skill-Balken */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="max-w-2xl mx-auto rounded-2xl p-6 sm:p-8 bg-white border border-[#E3EBF5]"
      >
        <div className="space-y-5 mb-2">
          {scenario.skills.map((skill) => (
            <div key={`${scenario.id}-${skill.label}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-arimo font-bold text-sm text-[#0F1E34]">{skill.label}</span>
                <span className="font-arimo text-xs text-[#94a3b8]">
                  {skill.has}% vorhanden · {skill.need}% benötigt
                </span>
              </div>
              <div className="relative h-2.5 rounded-full bg-[#F0F4FA] overflow-hidden mb-1">
                <motion.div
                  key={`${scenario.id}-${skill.label}-need`}
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.need}%` }}
                  transition={{ duration: reduce ? 0 : 0.6, ease: 'easeOut' }}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ background: 'rgba(56,189,248,0.18)' }}
                />
                <motion.div
                  key={`${scenario.id}-${skill.label}-has`}
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.has}%` }}
                  transition={{ duration: reduce ? 0 : 0.6, ease: 'easeOut', delay: reduce ? 0 : 0.1 }}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ background: NAVY_SKY }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 mt-5 mb-6 text-xs font-arimo text-[#55637A]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: NAVY_SKY }} aria-hidden="true" />
            Vorhanden
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(56,189,248,0.35)' }} aria-hidden="true" />
            Benötigt für Zielrolle
          </span>
        </div>

        <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)' }}>
          <p className="font-arimo text-xs font-bold text-[#38BDF8] uppercase tracking-wide mb-1">Passende Weiterbildung</p>
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