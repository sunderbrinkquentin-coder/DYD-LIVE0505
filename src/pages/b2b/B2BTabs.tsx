import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

type B2BTabsProps = {
  initialTab?: TabId;
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
};

export default function B2BTabs({ initialTab = 'unternehmen', activeTab: controlledTab, onTabChange }: B2BTabsProps) {
  const [internalTab, setInternalTab] = useState<TabId>(initialTab);
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (tab: TabId) => {
    if (onTabChange) onTabChange(tab);
    else setInternalTab(tab);
  };
  const tabSectionRef = useRef<HTMLDivElement>(null);

  const { tabA, tabB } = b2bContent.tabs;

  const switchTab = (tab: TabId) => {
    setActiveTab(tab);
    requestAnimationFrame(() => {
      tabSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <section
      ref={tabSectionRef}
      id="b2b-tabs"
      className="relative bg-[#F6F9FD] py-20 px-4 sm:px-6 lg:px-8 scroll-mt-16"
    >
      <div className="max-w-6xl mx-auto">
        {/* Tab Buttons */}
        <div
          className="flex gap-2 p-1.5 rounded-2xl bg-white border border-[#E3EBF5] shadow-sm mb-12 max-w-xl mx-auto"
          role="tablist"
          aria-label="Zielgruppe wählen"
        >
          <button
            role="tab"
            aria-selected={activeTab === 'unternehmen'}
            aria-controls="panel-unternehmen"
            id="tab-unternehmen"
            onClick={() => switchTab('unternehmen')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-arimo font-bold transition-all b2b-focus-ring ${
              activeTab === 'unternehmen'
                ? 'text-white shadow-md'
                : 'text-[#55637A] hover:text-[#0F1E34]'
            }`}
            style={
              activeTab === 'unternehmen'
                ? { background: 'linear-gradient(135deg, #0A192F, #38BDF8)' }
                : undefined
            }
          >
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">{tabA.label}</span>
            <span className="sm:hidden">Unternehmen</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'bildungstraeger'}
            aria-controls="panel-bildungstraeger"
            id="tab-bildungstraeger"
            onClick={() => switchTab('bildungstraeger')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-arimo font-bold transition-all b2b-focus-ring ${
              activeTab === 'bildungstraeger'
                ? 'text-white shadow-md'
                : 'text-[#55637A] hover:text-[#0F1E34]'
            }`}
            style={
              activeTab === 'bildungstraeger'
                ? { background: 'linear-gradient(135deg, #0A192F, #38BDF8)' }
                : undefined
            }
          >
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:inline">{tabB.label}</span>
            <span className="sm:hidden">Bildungsträger</span>
          </button>
        </div>

        {/* Tab Panels */}
        <AnimatePresence mode="wait">
          {activeTab === 'unternehmen' ? (
            <motion.div
              key="panel-a"
              role="tabpanel"
              id="panel-unternehmen"
              aria-labelledby="tab-unternehmen"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
            >
              <TabAContent ctaClick={() => switchTab('unternehmen')} />
            </motion.div>
          ) : (
            <motion.div
              key="panel-b"
              role="tabpanel"
              id="panel-bildungstraeger"
              aria-labelledby="tab-bildungstraeger"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
            >
              <TabBContent ctaClick={() => switchTab('bildungstraeger')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ─── Tab A: Unternehmen ─── */

function TabAContent({ ctaClick }: { ctaClick: () => void }) {
  const { tabA } = b2bContent.tabs;

  return (
    <div className="space-y-16">
      {/* Intro Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-2xl p-6 sm:p-8 border border-[#E3EBF5] bg-white"
        style={{ borderRadius: '18px' }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(56,189,248,0.10)' }}
          >
            <Sparkles className="w-5 h-5 text-[#38BDF8]" />
          </div>
          <p className="font-arimo text-[#0F1E34] leading-relaxed text-base sm:text-lg pt-1">
            {tabA.intro}
          </p>
        </div>
      </motion.div>

      {/* Challenge vs Solution */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl p-6 sm:p-8 border-2"
          style={{ borderColor: 'rgba(239,83,80,0.25)', background: 'rgba(239,83,80,0.03)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-[#EF5350]" />
            <h3 className="font-poppins font-bold text-lg text-[#0F1E34]">{tabA.challenge.title}</h3>
          </div>
          <ul className="space-y-3">
            {tabA.challenge.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#EF5350] flex-shrink-0" />
                <span className="font-arimo text-[#55637A] leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl p-6 sm:p-8 border-2"
          style={{ borderColor: 'rgba(56,189,248,0.25)', background: 'rgba(56,189,248,0.04)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-[#38BDF8]" />
            <h3 className="font-poppins font-bold text-lg text-[#0F1E34]">{tabA.solution.title}</h3>
          </div>
          <ul className="space-y-3">
            {tabA.solution.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #38BDF8, #DEFF9A)' }}
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
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-poppins font-bold text-xl text-[#0F1E34] mb-2 text-center"
        >
          {tabA.process.title}
        </motion.h3>
        <ProcessRail steps={tabA.process.steps} />
      </div>

      {/* Core Modules */}
      <div className="grid md:grid-cols-3 gap-6">
        {tabA.modules.map((mod, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
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
      </div>

      {/* Enterprise ROI */}
      <div className="grid sm:grid-cols-2 gap-6">
        {tabA.roi.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl p-8 border border-[#E3EBF5]"
            style={{ background: '#0A192F' }}
          >
            <div className="flex items-center gap-3 mb-3">
              {i === 0 ? (
                <TrendingDown className="w-6 h-6 text-[#DEFF9A]" />
              ) : (
                <TrendingUp className="w-6 h-6 text-[#DEFF9A]" />
              )}
              <span
                className="font-poppins font-black text-4xl"
                style={{ color: '#DEFF9A', letterSpacing: '-0.03em' }}
              >
                {stat.value}
              </span>
              <span className="font-arimo font-bold text-white/80 text-sm">{stat.label}</span>
            </div>
            <p className="font-arimo text-white/55 text-sm leading-relaxed">{stat.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Tab CTA */}
      <div className="text-center">
        <button
          onClick={ctaClick}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-arimo font-bold text-white b2b-focus-ring transition-all hover:shadow-xl hover:shadow-[#38BDF8]/25 hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #0A192F, #38BDF8)', borderRadius: '16px' }}
        >
          {tabA.cta}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Tab B: Bildungsträger ─── */

function TabBContent({ ctaClick }: { ctaClick: () => void }) {
  const { tabB } = b2bContent.tabs;
  const benefitIcons = [Target, Filter, Zap];

  return (
    <div className="space-y-16">
      {/* Intro */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-2xl p-6 sm:p-8 border border-[#E3EBF5] bg-white"
        style={{ borderRadius: '18px' }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(222,255,154,0.15)' }}
          >
            <Megaphone className="w-5 h-5 text-[#0F1E34]" />
          </div>
          <p className="font-poppins font-bold text-[#0F1E34] text-xl sm:text-2xl pt-1">
            {tabB.intro}
          </p>
        </div>
      </motion.div>

      {/* Challenge vs Solution */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl p-6 sm:p-8 border-2"
          style={{ borderColor: 'rgba(239,83,80,0.25)', background: 'rgba(239,83,80,0.03)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-[#EF5350]" />
            <h3 className="font-poppins font-bold text-lg text-[#0F1E34]">{tabB.challenge.title}</h3>
          </div>
          <ul className="space-y-3">
            {tabB.challenge.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#EF5350] flex-shrink-0" />
                <span className="font-arimo text-[#55637A] leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl p-6 sm:p-8 border-2"
          style={{ borderColor: 'rgba(56,189,248,0.25)', background: 'rgba(56,189,248,0.04)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-[#38BDF8]" />
            <h3 className="font-poppins font-bold text-lg text-[#0F1E34]">{tabB.solution.title}</h3>
          </div>
          <ul className="space-y-3">
            {tabB.solution.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #38BDF8, #DEFF9A)' }}
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
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-poppins font-bold text-xl text-[#0F1E34] mb-2 text-center"
        >
          {tabB.process.title}
        </motion.h3>
        <ProcessRail steps={tabB.process.steps} />
      </div>

      {/* Benefits */}
      <div className="grid md:grid-cols-3 gap-6">
        {tabB.benefits.map((benefit, i) => {
          const Icon = benefitIcons[i] ?? Target;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl p-6 bg-white border border-[#E3EBF5] hover:shadow-lg transition-shadow"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.10), rgba(222,255,154,0.10))' }}
              >
                <Icon className="w-5 h-5 text-[#38BDF8]" />
              </div>
              <h4 className="font-poppins font-bold text-base text-[#0F1E34] mb-2">{benefit.title}</h4>
              <p className="font-arimo text-sm text-[#55637A] leading-relaxed">{benefit.desc}</p>
            </motion.div>
          );
        })}
      </div>

      {/* CPA Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-2xl p-6 sm:p-10 border border-[#E3EBF5] bg-white"
        style={{ borderRadius: '18px' }}
      >
        <h3 className="font-poppins font-bold text-xl text-[#0F1E34] mb-8 text-center">
          {tabB.cpa.title}
        </h3>
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          {/* Classic */}
          <div className="rounded-2xl p-6 border-2 border-[#E3EBF5] bg-[#F6F9FD]">
            <p className="font-arimo font-bold text-sm text-[#55637A] mb-1">{tabB.cpa.classicLabel}</p>
            <p className="font-arimo text-xs text-[#55637A] mb-4">{tabB.cpa.classicDesc}</p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-poppins font-black text-3xl text-[#EF5350]">
                {tabB.cpa.classicValue}
              </span>
              <span className="font-arimo text-sm text-[#55637A]">{tabB.cpa.classicUnit}</span>
            </div>
          </div>
          {/* DYD */}
          <div
            className="rounded-2xl p-6 border-2 relative"
            style={{ borderColor: '#38BDF8', background: 'rgba(56,189,248,0.04)' }}
          >
            <p className="font-arimo font-bold text-sm text-[#38BDF8] mb-1">{tabB.cpa.dydLabel}</p>
            <p className="font-arimo text-xs text-[#55637A] mb-4">{tabB.cpa.dydDesc}</p>
            <div className="flex items-baseline gap-1.5">
              <span
                className="font-poppins font-black text-3xl"
                style={{ color: '#DEFF9A' }}
              >
                {tabB.cpa.dydValue}
              </span>
              <span className="font-arimo text-sm text-[#55637A]">{tabB.cpa.dydUnit}</span>
            </div>
          </div>
        </div>
        {/* Delta */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <span
            className="font-poppins font-black text-3xl"
            style={{ color: '#DEFF9A' }}
          >
            {tabB.cpa.delta}
          </span>
          <span className="font-arimo font-bold text-[#0F1E34]">{tabB.cpa.deltaLabel}</span>
        </div>
      </motion.div>

      {/* Tab CTA */}
      <div className="text-center">
        <button
          onClick={ctaClick}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-arimo font-bold text-[#0A192F] b2b-focus-ring transition-all hover:shadow-xl hover:shadow-[#DEFF9A]/25 hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)', borderRadius: '16px' }}
        >
          {tabB.cta}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
