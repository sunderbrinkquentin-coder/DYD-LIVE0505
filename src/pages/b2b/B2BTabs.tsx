import { useState, useRef, type KeyboardEvent } from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';
import {
  Building2,
  GraduationCap,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Target,
  Filter,
  Megaphone,
  Zap,
} from 'lucide-react';
import { b2bContent } from './content';
import ProcessRail from './ProcessRail';

type TabId = 'unternehmen' | 'bildungstraeger';

const NAVY_SKY = 'linear-gradient(135deg, #0A192F, #38BDF8)';
const LIME_SKY = 'linear-gradient(135deg, #DEFF9A, #38BDF8)';
const SKY_LIME = 'linear-gradient(135deg, #38BDF8, #DEFF9A)';

const VIEWPORT = { once: true, margin: '-60px' } as const;

/** Gemeinsame Scroll-Animationen; bei prefers-reduced-motion neutralisiert. */
function useAnims() {
  const reduce = useReducedMotion() ?? false;
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.1 } },
  };
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 20 },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.5 } },
  };
  const fadeLeft: Variants = {
    hidden: { opacity: 0, x: reduce ? 0 : -16 },
    show: { opacity: 1, x: 0, transition: { duration: reduce ? 0 : 0.5 } },
  };
  const fadeRight: Variants = {
    hidden: { opacity: 0, x: reduce ? 0 : 16 },
    show: { opacity: 1, x: 0, transition: { duration: reduce ? 0 : 0.5 } },
  };
  const scaleIn: Variants = {
    hidden: { opacity: 0, scale: reduce ? 1 : 0.96 },
    show: { opacity: 1, scale: 1, transition: { duration: reduce ? 0 : 0.5 } },
  };
  return { reduce, container, fadeUp, fadeLeft, fadeRight, scaleIn };
}

type B2BTabsProps = {
  initialTab?: TabId;
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  /** Wird von den Tab-CTAs aufgerufen, damit das Lead-Formular das Segment vorwählen kann. */
  onRequestDemo?: (segment: TabId) => void;
};

export default function B2BTabs({
  initialTab = 'unternehmen',
  activeTab: controlledTab,
  onTabChange,
  onRequestDemo,
}: B2BTabsProps) {
  const [internalTab, setInternalTab] = useState<TabId>(initialTab);
  const activeTab = controlledTab ?? internalTab;
  const reduce = useReducedMotion() ?? false;

  const tabSectionRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { tabA, tabB } = b2bContent.tabs;
  const tabMeta = [
    { id: 'unternehmen' as const, Icon: Building2, label: tabA.label, short: 'Unternehmen' },
    { id: 'bildungstraeger' as const, Icon: GraduationCap, label: tabB.label, short: 'Bildungsträger' },
  ];

  const selectTab = (tab: TabId) => {
    if (onTabChange) onTabChange(tab);
    else setInternalTab(tab);
  };

  const scrollTo = (el: Element | null | undefined) =>
    el?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });

  // Klick auf einen Tab: umschalten + zum Anfang des Bereichs scrollen.
  const handleTabClick = (tab: TabId) => {
    selectTab(tab);
    requestAnimationFrame(() => scrollTo(tabSectionRef.current));
  };

  // Tastatur-Navigation im Tablist (WAI-ARIA): Pfeile/Home/End.
  const onTabKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = tabMeta.findIndex((t) => t.id === activeTab);
    let next = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % tabMeta.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + tabMeta.length) % tabMeta.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabMeta.length - 1;
    else return;
    e.preventDefault();
    selectTab(tabMeta[next].id);
    tabRefs.current[next]?.focus();
  };

  // Tab-CTA: das ist die eigentliche Conversion – zum Lead-Formular, Segment vorwählen.
 const requestDemo = (segment: TabId) => {
  onRequestDemo?.(segment);
};

  return (
    <section
      ref={tabSectionRef}
      id="b2b-tabs"
      aria-label="DYD für Unternehmen und Bildungsträger"
      className="relative bg-[#F6F9FD] py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20 lg:scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto">
        {/* Tab-Buttons */}
        <div
          className="flex gap-2 p-1.5 rounded-2xl bg-white border border-[#E3EBF5] shadow-sm mb-12 max-w-xl mx-auto"
          role="tablist"
          aria-label="Zielgruppe wählen"
          onKeyDown={onTabKeyDown}
        >
          {tabMeta.map((t, i) => {
            const selected = activeTab === t.id;
            const Icon = t.Icon;
            return (
              <button
                key={t.id}
                ref={(el) => (tabRefs.current[i] = el)}
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={selected}
                aria-controls={`panel-${t.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => handleTabClick(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-arimo font-bold transition b2b-focus-ring ${
                  selected ? 'text-white shadow-md' : 'text-[#55637A] hover:text-[#0F1E34]'
                }`}
                style={selected ? { background: NAVY_SKY } : undefined}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.short}</span>
              </button>
            );
          })}
        </div>

        {/* Tab-Panels */}
        <AnimatePresence mode="wait">
          {activeTab === 'unternehmen' ? (
            <motion.div
              key="panel-a"
              role="tabpanel"
              id="panel-unternehmen"
              aria-labelledby="tab-unternehmen"
              tabIndex={0}
              initial={{ opacity: 0, y: reduce ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -16 }}
              transition={{ duration: reduce ? 0 : 0.35 }}
              className="b2b-focus-ring rounded-2xl"
            >
              <TabAContent onDemo={() => requestDemo('unternehmen')} />
            </motion.div>
          ) : (
            <motion.div
              key="panel-b"
              role="tabpanel"
              id="panel-bildungstraeger"
              aria-labelledby="tab-bildungstraeger"
              tabIndex={0}
              initial={{ opacity: 0, y: reduce ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -16 }}
              transition={{ duration: reduce ? 0 : 0.35 }}
              className="b2b-focus-ring rounded-2xl"
            >
              <TabBContent onDemo={() => requestDemo('bildungstraeger')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ─── Tab A: Unternehmen ─── */

function TabAContent({ onDemo }: { onDemo: () => void }) {
  const { tabA } = b2bContent.tabs;
  const { fadeUp, fadeLeft, fadeRight, scaleIn, container } = useAnims();

  return (
    <div className="space-y-16">
      {/* Intro-Banner */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="rounded-[18px] p-6 sm:p-8 border border-[#E3EBF5] bg-white"
      >
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(56,189,248,0.10)' }}
          >
            <Sparkles className="w-5 h-5 text-[#38BDF8]" aria-hidden="true" />
          </div>
          <p className="font-arimo text-[#0F1E34] leading-relaxed text-base sm:text-lg pt-1">{tabA.intro}</p>
        </div>
      </motion.div>

      {/* Herausforderung vs. Lösung */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          variants={fadeLeft}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="rounded-2xl p-6 sm:p-8 border-2"
          style={{ borderColor: 'rgba(239,83,80,0.25)', background: 'rgba(239,83,80,0.03)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-[#EF5350]" aria-hidden="true" />
            <h3 className="font-poppins font-bold text-lg text-[#0F1E34]">{tabA.challenge.title}</h3>
          </div>
          <ul className="space-y-3">
            {tabA.challenge.items.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#EF5350] flex-shrink-0" aria-hidden="true" />
                <span className="font-arimo text-[#55637A] leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          variants={fadeRight}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="rounded-2xl p-6 sm:p-8 border-2"
          style={{ borderColor: 'rgba(56,189,248,0.25)', background: 'rgba(56,189,248,0.04)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-[#38BDF8]" aria-hidden="true" />
            <h3 className="font-poppins font-bold text-lg text-[#0F1E34]">{tabA.solution.title}</h3>
          </div>
          <ul className="space-y-3">
            {tabA.solution.items.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: SKY_LIME }}
                  aria-hidden="true"
                />
                <span className="font-arimo text-[#0F1E34] leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Process Rail */}
      <div>
        <motion.h3
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="font-poppins font-bold text-xl text-[#0F1E34] mb-2 text-center"
        >
          {tabA.process.title}
        </motion.h3>
        <ProcessRail steps={tabA.process.steps} />
      </div>

      {/* Kernmodule */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid md:grid-cols-3 gap-6"
      >
        {tabA.modules.map((mod) => (
          <motion.div
            key={mod.title}
            variants={fadeUp}
            className="rounded-2xl p-6 bg-white border border-[#E3EBF5] hover:shadow-lg transition-shadow"
          >
            <div
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-arimo font-bold uppercase tracking-wide mb-4"
              style={{ background: 'rgba(222,255,154,0.15)', color: '#0F1E34' }}
            >
              {mod.tag}
            </div>
            <h4 className="font-poppins font-bold text-base text-[#0F1E34] mb-2">{mod.title}</h4>
            <p className="font-arimo text-sm text-[#55637A] leading-relaxed">{mod.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Enterprise-ROI */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid sm:grid-cols-2 gap-6"
      >
        {tabA.roi.map((stat, i) => (
          <motion.div
            key={stat.label}
            variants={scaleIn}
            className="rounded-2xl p-8 border border-[#E3EBF5]"
            style={{ background: '#0A192F' }}
          >
            <div className="flex items-center gap-3 mb-3">
              {i === 0 ? (
                <TrendingDown className="w-6 h-6 text-[#DEFF9A]" aria-hidden="true" />
              ) : (
                <TrendingUp className="w-6 h-6 text-[#DEFF9A]" aria-hidden="true" />
              )}
              <span className="font-poppins font-black text-4xl" style={{ color: '#DEFF9A', letterSpacing: '-0.03em' }}>
                {stat.value}
              </span>
              <span className="font-arimo font-bold text-white/80 text-sm">{stat.label}</span>
            </div>
            <p className="font-arimo text-white/55 text-sm leading-relaxed">{stat.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Tab-CTA */}
      <div className="text-center">
        <button
          type="button"
          onClick={onDemo}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-arimo font-bold text-white b2b-focus-ring transition hover:shadow-xl hover:shadow-[#38BDF8]/25 hover:-translate-y-0.5"
          style={{ background: NAVY_SKY }}
        >
          {tabA.cta}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ─── Tab B: Bildungsträger ─── */

function TabBContent({ onDemo }: { onDemo: () => void }) {
  const { tabB } = b2bContent.tabs;
  const { fadeUp, fadeLeft, fadeRight, container } = useAnims();
  const benefitIcons = [Target, Filter, Zap];

  return (
    <div className="space-y-16">
      {/* Intro */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="rounded-[18px] p-6 sm:p-8 border border-[#E3EBF5] bg-white"
      >
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(222,255,154,0.15)' }}
          >
            <Megaphone className="w-5 h-5 text-[#0F1E34]" aria-hidden="true" />
          </div>
          <p className="font-poppins font-bold text-[#0F1E34] text-xl sm:text-2xl pt-1">{tabB.intro}</p>
        </div>
      </motion.div>

      {/* Herausforderung vs. Lösung */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          variants={fadeLeft}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="rounded-2xl p-6 sm:p-8 border-2"
          style={{ borderColor: 'rgba(239,83,80,0.25)', background: 'rgba(239,83,80,0.03)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-[#EF5350]" aria-hidden="true" />
            <h3 className="font-poppins font-bold text-lg text-[#0F1E34]">{tabB.challenge.title}</h3>
          </div>
          <ul className="space-y-3">
            {tabB.challenge.items.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#EF5350] flex-shrink-0" aria-hidden="true" />
                <span className="font-arimo text-[#55637A] leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          variants={fadeRight}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="rounded-2xl p-6 sm:p-8 border-2"
          style={{ borderColor: 'rgba(56,189,248,0.25)', background: 'rgba(56,189,248,0.04)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-[#38BDF8]" aria-hidden="true" />
            <h3 className="font-poppins font-bold text-lg text-[#0F1E34]">{tabB.solution.title}</h3>
          </div>
          <ul className="space-y-3">
            {tabB.solution.items.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: SKY_LIME }}
                  aria-hidden="true"
                />
                <span className="font-arimo text-[#0F1E34] leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Process Rail */}
      <div>
        <motion.h3
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="font-poppins font-bold text-xl text-[#0F1E34] mb-2 text-center"
        >
          {tabB.process.title}
        </motion.h3>
        <ProcessRail steps={tabB.process.steps} />
      </div>

      {/* Vorteile */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid md:grid-cols-3 gap-6"
      >
        {tabB.benefits.map((benefit, i) => {
          const Icon = benefitIcons[i] ?? Target;
          return (
            <motion.div
              key={benefit.title}
              variants={fadeUp}
              className="rounded-2xl p-6 bg-white border border-[#E3EBF5] hover:shadow-lg transition-shadow"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.10), rgba(222,255,154,0.10))' }}
              >
                <Icon className="w-5 h-5 text-[#38BDF8]" aria-hidden="true" />
              </div>
              <h4 className="font-poppins font-bold text-base text-[#0F1E34] mb-2">{benefit.title}</h4>
              <p className="font-arimo text-sm text-[#55637A] leading-relaxed">{benefit.desc}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* CPA-Vergleich */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="rounded-[18px] p-6 sm:p-10 border border-[#E3EBF5] bg-white"
      >
        <h3 className="font-poppins font-bold text-xl text-[#0F1E34] mb-8 text-center">{tabB.cpa.title}</h3>
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          {/* Klassisch */}
          <div className="rounded-2xl p-6 border-2 border-[#E3EBF5] bg-[#F6F9FD]">
            <p className="font-arimo font-bold text-sm text-[#55637A] mb-1">{tabB.cpa.classicLabel}</p>
            <p className="font-arimo text-xs text-[#55637A] mb-4">{tabB.cpa.classicDesc}</p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-poppins font-black text-3xl text-[#EF5350]">{tabB.cpa.classicValue}</span>
              <span className="font-arimo text-sm text-[#55637A]">{tabB.cpa.classicUnit}</span>
            </div>
          </div>
          {/* DYD */}
          <div className="rounded-2xl p-6 border-2 relative" style={{ borderColor: '#38BDF8', background: 'rgba(56,189,248,0.04)' }}>
            <p className="font-arimo font-bold text-sm text-[#38BDF8] mb-1">{tabB.cpa.dydLabel}</p>
            <p className="font-arimo text-xs text-[#55637A] mb-4">{tabB.cpa.dydDesc}</p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-poppins font-black text-3xl" style={{ color: '#0F1E34' }}>{tabB.cpa.dydValue}</span>
              <span className="font-arimo text-sm text-[#55637A]">{tabB.cpa.dydUnit}</span>
            </div>
          </div>
        </div>
        {/* Delta */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <span className="font-poppins font-black text-3xl text-[#0F1E34]">{tabB.cpa.delta}</span>
          <span className="font-arimo font-bold text-[#0F1E34]">{tabB.cpa.deltaLabel}</span>
        </div>
      </motion.div>

      {/* Tab-CTA */}
      <div className="text-center">
        <button
          type="button"
          onClick={onDemo}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-arimo font-bold text-[#0A192F] b2b-focus-ring transition hover:shadow-xl hover:shadow-[#DEFF9A]/25 hover:-translate-y-0.5"
          style={{ background: LIME_SKY }}
        >
          {tabB.cta}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}