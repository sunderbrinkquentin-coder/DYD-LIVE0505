import { useState, useRef, type KeyboardEvent } from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';
import {
  Building2, GraduationCap, AlertTriangle, Sparkles, ArrowRight,
  TrendingDown, TrendingUp, Target, Filter, Megaphone, Zap, Plus,
  Palette, Code2, Check,
} from 'lucide-react';
import { b2bContent } from './content';
import ProcessRail from './ProcessRail';
import { NexusMockup, OrbitMockup } from './ProductMockups';

type TabId = 'unternehmen' | 'bildungstraeger';

const NAVY_SKY = 'linear-gradient(135deg, #0A192F, #38BDF8)';
const LIME_SKY = 'linear-gradient(135deg, #DEFF9A, #38BDF8)';
const SKY_LIME = 'linear-gradient(135deg, #38BDF8, #DEFF9A)';

const VIEWPORT = { once: true, margin: '-60px' } as const;

function useAnims() {
  const reduce = useReducedMotion() ?? false;
  const container: Variants = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.1 } } };
  const fadeUp: Variants = { hidden: { opacity: 0, y: reduce ? 0 : 20 }, show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.5 } } };
  const fadeLeft: Variants = { hidden: { opacity: 0, x: reduce ? 0 : -16 }, show: { opacity: 1, x: 0, transition: { duration: reduce ? 0 : 0.5 } } };
  const fadeRight: Variants = { hidden: { opacity: 0, x: reduce ? 0 : 16 }, show: { opacity: 1, x: 0, transition: { duration: reduce ? 0 : 0.5 } } };
  const scaleIn: Variants = { hidden: { opacity: 0, scale: reduce ? 1 : 0.96 }, show: { opacity: 1, scale: 1, transition: { duration: reduce ? 0 : 0.5 } } };
  const letter: Variants = { hidden: { opacity: 0, y: reduce ? 0 : 14 }, show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.4 } } };
  return { reduce, container, fadeUp, fadeLeft, fadeRight, scaleIn, letter };
}

/* ─── Produkt-Intro + Mockup ─── */
function ProductIntro({
  eyebrow, product, mockup,
}: {
  eyebrow: string;
  product: { name: string; tagline: string; acronym: readonly { letter: string; word: string }[] };
  mockup: React.ReactNode;
}) {
  const { container, fadeUp, letter } = useAnims();
  return (
    <div className="space-y-10">
      <motion.div variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT} className="text-center">
        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border border-[#38BDF8]/30 bg-[#38BDF8]/5">
          <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
          <span className="font-arimo text-xs font-bold text-[#38BDF8] uppercase tracking-wide">{eyebrow}</span>
        </motion.div>

        <motion.h2 variants={fadeUp} className="font-poppins font-black leading-none mb-6" style={{ fontSize: 'clamp(2.25rem, 6vw, 4rem)', letterSpacing: '-0.04em', background: NAVY_SKY, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
          {product.name}
        </motion.h2>

        <motion.div variants={container} className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mb-6">
          {product.acronym.map((a) => (
            <motion.div key={a.letter + a.word} variants={letter} className="flex items-center gap-2.5 pl-2.5 pr-4 py-2 rounded-xl bg-white border border-[#E3EBF5] hover:border-[#38BDF8]/40 hover:shadow-md transition-all">
              <span className="font-poppins font-black text-2xl w-9 h-9 flex items-center justify-center rounded-lg text-[#0A192F]" style={{ background: SKY_LIME }}>{a.letter}</span>
              <span className="font-arimo font-bold text-sm text-[#0F1E34]">{a.word}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.p variants={fadeUp} className="font-arimo text-[#55637A] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">{product.tagline}</motion.p>
      </motion.div>

      {/* Produkt-Mockup */}
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={VIEWPORT} transition={{ duration: 0.6 }} className="max-w-3xl mx-auto">
        {mockup}
        <p className="text-center font-arimo text-xs text-[#94a3b8] mt-3">Illustrative Produktvorschau – Design in Entwicklung.</p>
      </motion.div>
    </div>
  );
}

/* ─── White Label / API ─── */
function Delivery() {
  const { delivery } = b2bContent;
  const { container, fadeUp } = useAnims();
  const iconMap: Record<string, typeof Palette> = { palette: Palette, code: Code2 };

  return (
    <div>
      <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="text-center mb-8">
        <h3 className="font-poppins font-bold text-xl sm:text-2xl text-[#0F1E34] mb-2">{delivery.title}</h3>
        <p className="font-arimo text-[#55637A] max-w-2xl mx-auto leading-relaxed">{delivery.subtitle}</p>
      </motion.div>

      <motion.div variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT} className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {delivery.options.map((o) => {
          const Icon = iconMap[o.icon] ?? Code2;
          return (
            <motion.div key={o.title} variants={fadeUp} className="rounded-2xl p-6 bg-white border border-[#E3EBF5] hover:shadow-lg hover:border-[#38BDF8]/40 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: SKY_LIME }}>
                  <Icon className="w-5 h-5 text-[#0A192F]" aria-hidden="true" />
                </div>
                <h4 className="font-poppins font-black text-lg text-[#0F1E34]">{o.title}</h4>
              </div>
              <p className="font-arimo text-sm text-[#55637A] leading-relaxed mb-4">{o.desc}</p>
              <ul className="space-y-2">
                {o.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#38BDF8] flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="font-arimo text-sm text-[#0F1E34]">{pt}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

/* ─── FAQ-Akkordeon ─── */
function FAQ({ items }: { items: readonly { q: string; a: string }[] }) {
  const { reduce, container, fadeUp } = useAnims();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div>
      <motion.h3 variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="font-poppins font-bold text-xl text-[#0F1E34] mb-6 text-center">Häufige Fragen</motion.h3>
      <motion.div variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT} className="max-w-3xl mx-auto space-y-3">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <motion.div key={item.q} variants={fadeUp} className="rounded-2xl bg-white border border-[#E3EBF5] overflow-hidden">
              <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} aria-controls={`faq-panel-${i}`} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left b2b-focus-ring">
                <span className="font-poppins font-bold text-sm sm:text-base text-[#0F1E34]">{item.q}</span>
                <Plus className={`w-5 h-5 text-[#38BDF8] flex-shrink-0 transition-transform ${isOpen ? 'rotate-45' : ''}`} style={{ transitionDuration: reduce ? '0ms' : '250ms' }} aria-hidden="true" />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div id={`faq-panel-${i}`} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduce ? 0 : 0.25, ease: 'easeInOut' }} className="overflow-hidden">
                    <p className="font-arimo text-sm text-[#55637A] leading-relaxed px-5 pb-5">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

type B2BTabsProps = {
  initialTab?: TabId;
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  onRequestDemo?: (segment: TabId) => void;
};

export default function B2BTabs({ initialTab = 'unternehmen', activeTab: controlledTab, onTabChange, onRequestDemo }: B2BTabsProps) {
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

  const selectTab = (tab: TabId) => { if (onTabChange) onTabChange(tab); else setInternalTab(tab); };
  const scrollTo = (el: Element | null | undefined) => el?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  const handleTabClick = (tab: TabId) => { selectTab(tab); requestAnimationFrame(() => scrollTo(tabSectionRef.current)); };

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

  const requestDemo = (segment: TabId) => { onRequestDemo?.(segment); };

  return (
    <div className="space-y-10">
      <motion.div variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT} className="text-center">
        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border border-[#38BDF8]/30 bg-[#38BDF8]/5">
          <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
          <span className="font-arimo text-xs font-bold text-[#38BDF8] uppercase tracking-wide">{eyebrow}</span>
        </motion.div>

        <motion.h2 variants={fadeUp} className="font-poppins font-black leading-none mb-6" style={{ fontSize: 'clamp(2.25rem, 6vw, 4rem)', letterSpacing: '-0.04em', background: NAVY_SKY, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
          {product.name}
        </motion.h2>

        <motion.div variants={container} className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mb-6">
          {product.acronym.map((a) => (
            <motion.div key={a.letter + a.word} variants={letter} className="flex items-center gap-2.5 pl-2.5 pr-4 py-2 rounded-xl bg-white border border-[#E3EBF5] hover:border-[#38BDF8]/40 hover:shadow-md transition-all">
              <span className="font-poppins font-black text-2xl w-9 h-9 flex items-center justify-center rounded-lg text-[#0A192F]" style={{ background: SKY_LIME }}>{a.letter}</span>
              <span className="font-arimo font-bold text-sm text-[#0F1E34]">{a.word}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.p variants={fadeUp} className="font-arimo text-[#55637A] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">{product.tagline}</motion.p>
      </motion.div>

      {/* Produkt-Mockup */}
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={VIEWPORT} transition={{ duration: 0.6 }} className="max-w-3xl mx-auto">
        {mockup}
        <p className="text-center font-arimo text-xs text-[#94a3b8] mt-3">Illustrative Produktvorschau – Design in Entwicklung.</p>
      </motion.div>
    </div>
  );
}



  return (
    <div>
      <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="text-center mb-8">
        <h3 className="font-poppins font-bold text-xl sm:text-2xl text-[#0F1E34] mb-2">{delivery.title}</h3>
        <p className="font-arimo text-[#55637A] max-w-2xl mx-auto leading-relaxed">{delivery.subtitle}</p>
      </motion.div>

      <motion.div variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT} className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {delivery.options.map((o) => {
          const Icon = iconMap[o.icon] ?? Code2;
          return (
            <motion.div key={o.title} variants={fadeUp} className="rounded-2xl p-6 bg-white border border-[#E3EBF5] hover:shadow-lg hover:border-[#38BDF8]/40 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: SKY_LIME }}>
                  <Icon className="w-5 h-5 text-[#0A192F]" aria-hidden="true" />
                </div>
                <h4 className="font-poppins font-black text-lg text-[#0F1E34]">{o.title}</h4>
              </div>
              <p className="font-arimo text-sm text-[#55637A] leading-relaxed mb-4">{o.desc}</p>
              <ul className="space-y-2">
                {o.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#38BDF8] flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="font-arimo text-sm text-[#0F1E34]">{pt}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

/* ─── FAQ-Akkordeon ─── */
function FAQ({ items }: { items: readonly { q: string; a: string }[] }) {
  const { reduce, container, fadeUp } = useAnims();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div>
      <motion.h3 variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="font-poppins font-bold text-xl text-[#0F1E34] mb-6 text-center">Häufige Fragen</motion.h3>
      <motion.div variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT} className="max-w-3xl mx-auto space-y-3">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <motion.div key={item.q} variants={fadeUp} className="rounded-2xl bg-white border border-[#E3EBF5] overflow-hidden">
              <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} aria-controls={`faq-panel-${i}`} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left b2b-focus-ring">
                <span className="font-poppins font-bold text-sm sm:text-base text-[#0F1E34]">{item.q}</span>
                <Plus className={`w-5 h-5 text-[#38BDF8] flex-shrink-0 transition-transform ${isOpen ? 'rotate-45' : ''}`} style={{ transitionDuration: reduce ? '0ms' : '250ms' }} aria-hidden="true" />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div id={`faq-panel-${i}`} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduce ? 0 : 0.25, ease: 'easeInOut' }} className="overflow-hidden">
                    <p className="font-arimo text-sm text-[#55637A] leading-relaxed px-5 pb-5">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

type B2BTabsProps = {
  initialTab?: TabId;
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  onRequestDemo?: (segment: TabId) => void;
};

export default function B2BTabs({ initialTab = 'unternehmen', activeTab: controlledTab, onTabChange, onRequestDemo }: B2BTabsProps) {
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

  const selectTab = (tab: TabId) => { if (onTabChange) onTabChange(tab); else setInternalTab(tab); };
  const scrollTo = (el: Element | null | undefined) => el?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  const handleTabClick = (tab: TabId) => { selectTab(tab); requestAnimationFrame(() => scrollTo(tabSectionRef.current)); };

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

  const requestDemo = (segment: TabId) => { onRequestDemo?.(segment); };

  const renderTab = (i: number) => {
    const t = tabMeta[i];
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
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-arimo font-bold transition b2b-focus-ring ${selected ? 'text-white shadow-md' : 'text-[#55637A] hover:text-[#0F1E34]'}`}
        style={selected ? { background: NAVY_SKY } : undefined}
      >
        <Icon className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t.label}</span>
        <span className="sm:hidden">{t.short}</span>
      </button>
    );
  };

  return (
    <section ref={tabSectionRef} id="b2b-tabs" aria-label="DYD für Unternehmen und Bildungsträger" className="relative bg-[#F6F9FD] py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20 lg:scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex gap-2 p-1.5 rounded-2xl bg-white border border-[#E3EBF5] shadow-sm mb-12 max-w-xl mx-auto" role="tablist" aria-label="Zielgruppe wählen" onKeyDown={onTabKeyDown}>
          {tabMeta.map((t, i) => {
            const selected = activeTab === t.id;
            const Icon = t.Icon;
            return (
              <button key={t.id} ref={(el) => (tabRefs.current[i] = el)} role="tab" id={`tab-${t.id}`} aria-selected={selected} aria-controls={`panel-${t.id}`} tabIndex={selected ? 0 : -1} onClick={() => handleTabClick(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-arimo font-bold transition b2b-focus-ring ${selected ? 'text-white shadow-md' : 'text-[#55637A] hover:text-[#0F1E34]'}`}
                style={selected ? { background: NAVY_SKY } : undefined}>
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.short}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'unternehmen' ? (
            <motion.div key="panel-a" role="tabpanel" id="panel-unternehmen" aria-labelledby="tab-unternehmen" tabIndex={0} initial={{ opacity: 0, y: reduce ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -16 }} transition={{ duration: reduce ? 0 : 0.35 }} className="b2b-focus-ring rounded-2xl">
              <TabAContent onDemo={() => requestDemo('unternehmen')} />
            </motion.div>
          ) : (
            <motion.div key="panel-b" role="tabpanel" id="panel-bildungstraeger" aria-labelledby="tab-bildungstraeger" tabIndex={0} initial={{ opacity: 0, y: reduce ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -16 }} transition={{ duration: reduce ? 0 : 0.35 }} className="b2b-focus-ring rounded-2xl">
              <TabBContent onDemo={() => requestDemo('bildungstraeger')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ─── Tab A: Unternehmen (NEXUS) ─── */
function TabAContent({ onDemo }: { onDemo: () => void }) {
  const { tabA } = b2bContent.tabs;
  const { fadeUp, fadeLeft, fadeRight, scaleIn, container } = useAnims();

  return (
    <div className="space-y-16">
      <ProductIntro eyebrow={tabA.eyebrow} product={tabA.product} mockup={<NexusMockup />} />

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div variants={fadeLeft} initial="hidden" whileInView="show" viewport={VIEWPORT} className="rounded-2xl p-6 sm:p-8 border-2" style={{ borderColor: 'rgba(239,83,80,0.25)', background: 'rgba(239,83,80,0.03)' }}>
          <div className="flex items-center gap-2 mb-5"><AlertTriangle className="w-5 h-5 text-[#EF5350]" aria-hidden="true" /><h3 className="font-poppins font-bold text-lg text-[#0F1E34]">{tabA.challenge.title}</h3></div>
          <ul className="space-y-3">{tabA.challenge.items.map((item) => (<li key={item} className="flex items-start gap-2.5"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#EF5350] flex-shrink-0" aria-hidden="true" /><span className="font-arimo text-[#55637A] leading-relaxed">{item}</span></li>))}</ul>
        </motion.div>
        <motion.div variants={fadeRight} initial="hidden" whileInView="show" viewport={VIEWPORT} className="rounded-2xl p-6 sm:p-8 border-2" style={{ borderColor: 'rgba(56,189,248,0.25)', background: 'rgba(56,189,248,0.04)' }}>
          <div className="flex items-center gap-2 mb-5"><Sparkles className="w-5 h-5 text-[#38BDF8]" aria-hidden="true" /><h3 className="font-poppins font-bold text-lg text-[#0F1E34]">{tabA.solution.title}</h3></div>
          <ul className="space-y-3">{tabA.solution.items.map((item) => (<li key={item} className="flex items-start gap-2.5"><span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: SKY_LIME }} aria-hidden="true" /><span className="font-arimo text-[#0F1E34] leading-relaxed">{item}</span></li>))}</ul>
        </motion.div>
      </div>

      <div>
        <motion.h3 variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="font-poppins font-bold text-xl text-[#0F1E34] mb-2 text-center">{tabA.process.title}</motion.h3>
        <ProcessRail steps={tabA.process.steps} />
      </div>

      <motion.div variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT} className="grid md:grid-cols-3 gap-6">
        {tabA.modules.map((mod) => (
          <motion.div key={mod.title} variants={fadeUp} className="rounded-2xl p-6 bg-white border border-[#E3EBF5] hover:shadow-lg transition-shadow">
            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-arimo font-bold uppercase tracking-wide mb-4" style={{ background: 'rgba(222,255,154,0.15)', color: '#0F1E34' }}>{mod.tag}</div>
            <h4 className="font-poppins font-bold text-base text-[#0F1E34] mb-2">{mod.title}</h4>
            <p className="font-arimo text-sm text-[#55637A] leading-relaxed">{mod.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT} className="grid sm:grid-cols-2 gap-6">
        {tabA.roi.map((stat, i) => (
          <motion.div key={stat.label} variants={scaleIn} className="rounded-2xl p-8 border border-[#E3EBF5]" style={{ background: '#0A192F' }}>
            <div className="flex items-center gap-3 mb-3">
              {i === 0 ? <TrendingDown className="w-6 h-6 text-[#DEFF9A]" aria-hidden="true" /> : <TrendingUp className="w-6 h-6 text-[#DEFF9A]" aria-hidden="true" />}
              <span className="font-poppins font-black text-4xl" style={{ color: '#DEFF9A', letterSpacing: '-0.03em' }}>{stat.value}</span>
              <span className="font-arimo font-bold text-white/80 text-sm">{stat.label}</span>
            </div>
            <p className="font-arimo text-white/55 text-sm leading-relaxed">{stat.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      <Delivery />
      <FAQ items={tabA.faq} />

      <div className="text-center">
        <button type="button" onClick={onDemo} className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-arimo font-bold text-white b2b-focus-ring transition hover:shadow-xl hover:shadow-[#38BDF8]/25 hover:-translate-y-0.5" style={{ background: NAVY_SKY }}>{tabA.cta}<ArrowRight className="w-4 h-4" aria-hidden="true" /></button>
      </div>
    </div>
  );
}

/* ─── Tab B: Bildungsträger (ORBIT) ─── */
function TabBContent({ onDemo }: { onDemo: () => void }) {
  const { tabB } = b2bContent.tabs;
  const { fadeUp, fadeLeft, fadeRight, container } = useAnims();
  const benefitIcons = [Target, Filter, Zap];

  return (
    <div className="space-y-16">
      <ProductIntro eyebrow={tabB.eyebrow} product={tabB.product} mockup={<OrbitMockup />} />

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div variants={fadeLeft} initial="hidden" whileInView="show" viewport={VIEWPORT} className="rounded-2xl p-6 sm:p-8 border-2" style={{ borderColor: 'rgba(239,83,80,0.25)', background: 'rgba(239,83,80,0.03)' }}>
          <div className="flex items-center gap-2 mb-5"><AlertTriangle className="w-5 h-5 text-[#EF5350]" aria-hidden="true" /><h3 className="font-poppins font-bold text-lg text-[#0F1E34]">{tabB.challenge.title}</h3></div>
          <ul className="space-y-3">{tabB.challenge.items.map((item) => (<li key={item} className="flex items-start gap-2.5"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#EF5350] flex-shrink-0" aria-hidden="true" /><span className="font-arimo text-[#55637A] leading-relaxed">{item}</span></li>))}</ul>
        </motion.div>
        <motion.div variants={fadeRight} initial="hidden" whileInView="show" viewport={VIEWPORT} className="rounded-2xl p-6 sm:p-8 border-2" style={{ borderColor: 'rgba(56,189,248,0.25)', background: 'rgba(56,189,248,0.04)' }}>
          <div className="flex items-center gap-2 mb-5"><Sparkles className="w-5 h-5 text-[#38BDF8]" aria-hidden="true" /><h3 className="font-poppins font-bold text-lg text-[#0F1E34]">{tabB.solution.title}</h3></div>
          <ul className="space-y-3">{tabB.solution.items.map((item) => (<li key={item} className="flex items-start gap-2.5"><span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: SKY_LIME }} aria-hidden="true" /><span className="font-arimo text-[#0F1E34] leading-relaxed">{item}</span></li>))}</ul>
        </motion.div>
      </div>

      <div>
        <motion.h3 variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="font-poppins font-bold text-xl text-[#0F1E34] mb-2 text-center">{tabB.process.title}</motion.h3>
        <ProcessRail steps={tabB.process.steps} />
      </div>

      <motion.div variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT} className="grid md:grid-cols-3 gap-6">
        {tabB.benefits.map((benefit, i) => {
          const Icon = benefitIcons[i] ?? Target;
          return (
            <motion.div key={benefit.title} variants={fadeUp} className="rounded-2xl p-6 bg-white border border-[#E3EBF5] hover:shadow-lg transition-shadow">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.10), rgba(222,255,154,0.10))' }}><Icon className="w-5 h-5 text-[#38BDF8]" aria-hidden="true" /></div>
              <h4 className="font-poppins font-bold text-base text-[#0F1E34] mb-2">{benefit.title}</h4>
              <p className="font-arimo text-sm text-[#55637A] leading-relaxed">{benefit.desc}</p>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="rounded-[18px] p-6 sm:p-10 border border-[#E3EBF5] bg-white">
        <h3 className="font-poppins font-bold text-xl text-[#0F1E34] mb-8 text-center">{tabB.cpa.title}</h3>
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          <div className="rounded-2xl p-6 border-2 border-[#E3EBF5] bg-[#F6F9FD]">
            <p className="font-arimo font-bold text-sm text-[#55637A] mb-1">{tabB.cpa.classicLabel}</p>
            <p className="font-arimo text-xs text-[#55637A] mb-4">{tabB.cpa.classicDesc}</p>
            <div className="flex items-baseline gap-1.5"><span className="font-poppins font-black text-3xl text-[#EF5350]">{tabB.cpa.classicValue}</span><span className="font-arimo text-sm text-[#55637A]">{tabB.cpa.classicUnit}</span></div>
          </div>
          <div className="rounded-2xl p-6 border-2 relative" style={{ borderColor: '#38BDF8', background: 'rgba(56,189,248,0.04)' }}>
            <p className="font-arimo font-bold text-sm text-[#38BDF8] mb-1">{tabB.cpa.dydLabel}</p>
            <p className="font-arimo text-xs text-[#55637A] mb-4">{tabB.cpa.dydDesc}</p>
            <div className="flex items-baseline gap-1.5"><span className="font-poppins font-black text-3xl" style={{ color: '#0F1E34' }}>{tabB.cpa.dydValue}</span><span className="font-arimo text-sm text-[#55637A]">{tabB.cpa.dydUnit}</span></div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-center gap-3"><span className="font-poppins font-black text-3xl text-[#0F1E34]">{tabB.cpa.delta}</span><span className="font-arimo font-bold text-[#0F1E34]">{tabB.cpa.deltaLabel}</span></div>
      </motion.div>

      <Delivery />
      <FAQ items={tabB.faq} />

      <div className="text-center">
        <button type="button" onClick={onDemo} className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-arimo font-bold text-[#0A192F] b2b-focus-ring transition hover:shadow-xl hover:shadow-[#DEFF9A]/25 hover:-translate-y-0.5" style={{ background: LIME_SKY }}>{tabB.cta}<ArrowRight className="w-4 h-4" aria-hidden="true" /></button>
      </div>
    </div>
  );
}