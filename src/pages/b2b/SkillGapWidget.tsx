import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';
import { ArrowRight, Sparkles, Plus } from 'lucide-react';
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

type DemoSkill = { label: string; has: number; need: number; reason: string };

/**
 * NEU (01.10.2026, "dynamisch"/"wirklich hilfreich"): eine Sektion
 * (Vorhanden ODER Noch-zu-lernen) klickbarer Skill-Chips. Ein Klick klappt
 * eine Begründungskarte auf (skill.reason) - analog zu den aufklappbaren
 * .skill-detail-card-Elementen im echten ORBIT-Gap-Schritt, nur bewusst als
 * kompakte Chip-Reihe statt vertikaler Liste, damit das Beispiel auf der
 * Marketing-Seite nicht zu viel Platz einnimmt, solange nichts aufgeklappt
 * ist.
 */
function SkillChipSection({
  label,
  dotColor,
  bg,
  text,
  skills,
  scenarioId,
  expandedSkill,
  onToggle,
  emptyLabel,
}: {
  label: string;
  dotColor: string;
  bg: string;
  text: string;
  skills: readonly DemoSkill[];
  scenarioId: string;
  expandedSkill: string | null;
  onToggle: (key: string) => void;
  emptyLabel: string;
}) {
  const expanded = skills.find((s) => `${scenarioId}-${s.label}` === expandedSkill);
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} aria-hidden="true" />
        <span className="font-arimo text-xs font-bold text-[#0F1E34]">{label} ({skills.length})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.length === 0 && <span className="font-arimo text-xs text-[#94a3b8]">{emptyLabel}</span>}
        {skills.map((s) => {
          const key = `${scenarioId}-${s.label}`;
          const isOpen = key === expandedSkill;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(key)}
              aria-expanded={isOpen}
              className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full b2b-focus-ring transition"
              style={{ background: bg, color: text, outline: isOpen ? `1.5px solid ${text}` : undefined }}
            >
              {s.label}
              <Plus className="w-3 h-3 transition-transform" style={{ transform: isOpen ? 'rotate(45deg)' : undefined }} aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 rounded-xl p-3.5" style={{ background: bg }}>
              <p className="font-arimo text-xs font-bold mb-1" style={{ color: text }}>{expanded.label}</p>
              <p className="font-arimo text-xs text-[#0F1E34] leading-relaxed">{expanded.reason}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
  // NEU (01.10.2026, "soll dynamisch sein"): Skill-Chips sind jetzt klickbar
  // und klappen ihre Begründung (skill.reason) auf - macht das Beispiel
  // interaktiv statt eine reine statische Zahlen-Anzeige, ohne die komplette
  // Live-Rollensuche der echten Journey auf die Marketing-Seite zu verlagern.
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const scenario = skillGapDemo.scenarios[activeIndex];
  // NEU (01.10.2026): einfache, nachvollziehbare Vorhanden/Lücke-Klassifi-
  // kation aus den bestehenden has/need-Werten (kein neues Datenfeld noetig)
  // - deckt sich mit der binaeren "Vorhanden"-/"Noch zu lernen"-Logik des
  // echten ORBIT-Gap-Schritts (dort: covered_skills vs. Luecken-Skills).
  const covered = scenario.skills.filter((s) => s.has >= s.need);
  const gaps = scenario.skills.filter((s) => s.has < s.need);
  const matchPercent = Math.round((covered.length / scenario.skills.length) * 100);
  const toggleSkill = (key: string) => setExpandedSkill((cur) => (cur === key ? null : key));

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

        <p className="font-arimo text-[11px] text-[#94a3b8] mb-3">Skill anklicken für die Begründung.</p>
        <div className="space-y-5 mb-6">
          <SkillChipSection
            label="Vorhanden"
            dotColor="#178a4c"
            bg="#e5f8ec"
            text="#178a4c"
            skills={covered}
            scenarioId={scenario.id}
            expandedSkill={expandedSkill}
            onToggle={toggleSkill}
            emptyLabel="Noch keine der betrachteten Skills."
          />
          <SkillChipSection
            label="Noch zu lernen"
            dotColor="#c23a3a"
            bg="#fdeff0"
            text="#c23a3a"
            skills={gaps}
            scenarioId={scenario.id}
            expandedSkill={expandedSkill}
            onToggle={toggleSkill}
            emptyLabel="Keine offenen Lücken."
          />
        </div>

        {/* UEBERARBEITET (01.10.2026, "mehrere passende Kurse statt nur
            einem"): Ranking-Liste statt einer einzelnen Kursbox - naeher an
            der echten courseMatcher.ts-Logik im ORBIT-Dashboard, die ebenso
            mehrere Kurse gegen eine Skill-Luecke rankt. */}
        <div className="rounded-xl p-4 mb-5 space-y-3" style={{ background: '#eaf4fc', border: '1px solid #cfe6f8' }}>
          <p className="font-arimo text-xs font-bold uppercase tracking-wide" style={{ color: '#1f6fae' }}>Passende Weiterbildungen</p>
          {scenario.recommendedCourses.map((c, i) => (
            <div key={c.title} className={i > 0 ? 'pt-3 border-t' : undefined} style={i > 0 ? { borderColor: '#cfe6f8' } : undefined}>
              <p className="font-arimo text-sm text-[#0F1E34] font-semibold">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black mr-2" style={{ background: '#1f6fae', color: '#fff' }}>
                  {i + 1}
                </span>
                {c.title}
              </p>
              <p className="font-arimo text-xs text-[#55637A] mt-1 ml-7">{c.matchReason}</p>
            </div>
          ))}
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