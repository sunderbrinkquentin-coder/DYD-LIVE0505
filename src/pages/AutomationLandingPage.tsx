// src/pages/AutomationLandingPage.tsx
//
// Eigene Landingpage "Automatisierung & individuelle Software"
// (#/business/automatisierung, NEU 16.10.2026) – klar getrennt von der
// Skill-Plattform (#/business). Conversion-Strecke:
//   Hero (echte Screens) → "Wo verlieren Sie Zeit?" (Finder) → Live-Projekte
//   → Vorgehen → Prozess-Check (3 Schritte) → FAQ → Abschluss
// Mobile: schwebende CTA-Leiste, sobald der Hero aus dem Bild ist.

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  ArrowRight, Bot, CalendarCheck, Check, ChevronDown, Eye, LineChart, Mic, Rocket, Search, ShieldCheck,
  Sparkles, Target, Ticket, TrendingUp, Trophy, Users, Zap, FileText, Layers, Heart,
} from 'lucide-react';
import B2BHeader from './b2b/B2BHeader';
import { CalBookingButton } from './b2b/CalBookingButton';
import { automationContent as c } from './b2b/automationContent';
import { BrowserFrame, LIME, PhoneFrame, ProcessCheck, SKY, ShotViewer } from './b2b/automationParts';

const VIEWPORT = { once: true, margin: '-60px' } as const;
const refIcons = { mic: Mic, crm: Users, chart: LineChart, ticket: Ticket, trophy: Trophy, bot: Bot, heart: Heart } as const;
const stepIcons: Record<string, typeof Search> = { search: Search, target: Target, rocket: Rocket, growth: TrendingUp };

function useAnims() {
  const reduce = useReducedMotion() ?? false;
  const container: Variants = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.08 } } };
  const fadeUp: Variants = { hidden: { opacity: 0, y: reduce ? 0 : 22 }, show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.5 } } };
  return { reduce, container, fadeUp };
}

/** Rotierende Status-Meldungen im Hero – zeigen, was die Systeme tagtäglich erledigen */
const LIVE_EVENTS = [
  { Icon: Sparkles, text: 'Tagesbriefing erstellt', meta: 'Vertriebs-CRM · 07:00' },
  { Icon: FileText, text: '7 Textentwürfe zur Freigabe', meta: 'Podcast-Studio' },
  { Icon: Ticket, text: 'PDF-Ticket automatisch versendet', meta: 'Ticketsystem' },
  { Icon: ShieldCheck, text: 'Risiko-Grenzen geprüft', meta: 'Trading-Assistent · stündlich' },
  { Icon: Bot, text: 'Passendes Angebot empfohlen', meta: 'KI-Chatbot' },
];

function LiveTicker() {
  const reduce = useReducedMotion() ?? false;
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % LIVE_EVENTS.length), 2600);
    return () => window.clearInterval(t);
  }, [reduce]);
  const e = LIVE_EVENTS[i];
  return (
    <div className="inline-flex items-center gap-3 pl-2 pr-4 py-2 rounded-2xl bg-[#0A192F]/90 border border-white/15 backdrop-blur shadow-2xl" aria-live="off">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }}>
        <e.Icon className="w-4 h-4 text-[#0A192F]" aria-hidden="true" />
        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#22c55e] ring-2 ring-[#0A192F] animate-pulse" />
      </span>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, y: reduce ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -6 }} transition={{ duration: 0.25 }}>
          <p className="font-arimo text-[13px] font-bold text-white leading-tight">{e.text}</p>
          <p className="font-arimo text-[11px] text-white/50 leading-tight">{e.meta}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function AutomationLandingPage() {
  const { reduce, container, fadeUp } = useAnims();
  const [activeRef, setActiveRef] = useState<string>(c.references.items[0].id);
  const [finderPick, setFinderPick] = useState<string>(c.finder.options[0].id);
  const [presetArea, setPresetArea] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showSticky, setShowSticky] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = c.meta.title;
    window.scrollTo(0, 0);
    return () => { document.title = prev; };
  }, []);

  // Mobile CTA-Leiste nur zwischen Hero und Prozess-Check einblenden
  // (nicht über dem Formular selbst, sonst verdeckt sie die Eingabefelder)
  useEffect(() => {
    const hero = heroRef.current;
    const check = document.getElementById('prozess-check');
    if (!hero || !check || typeof IntersectionObserver === 'undefined') return;
    const seen = { hero: true, check: false };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) seen.hero = e.isIntersecting;
        if (e.target === check) seen.check = e.isIntersecting;
      }
      setShowSticky(!seen.hero && !seen.check);
    }, { threshold: 0.05 });
    io.observe(hero); io.observe(check);
    return () => io.disconnect();
  }, []);

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  const openRef = (id: string) => { setActiveRef(id); requestAnimationFrame(() => go('projekte')); };
  const startCheck = (area?: string) => { setPresetArea(area ?? null); requestAnimationFrame(() => go('prozess-check')); };

  const ref = c.references.items.find((r) => r.id === activeRef) ?? c.references.items[0];
  const finder = c.finder.options.find((o) => o.id === finderPick) ?? c.finder.options[0];
  const finderRef = c.references.items.find((r) => r.id === finder.ref) ?? c.references.items[0];
  const FinderIcon = refIcons[finderRef.icon];

  return (
    <div className="min-h-screen bg-[#07111f] text-white overflow-x-hidden">
      <B2BHeader active="automatisierung" ctaLabel="Prozess-Check" onContact={() => startCheck()} />

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative pt-28 lg:pt-36 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(800px 420px at 15% 10%, rgba(222,255,154,0.12), transparent 60%), radial-gradient(900px 500px at 85% 30%, rgba(56,189,248,0.18), transparent 60%)` }} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)' }} />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          <motion.div variants={container} initial="hidden" animate="show" className="lg:col-span-6">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6 border border-[#DEFF9A]/30 bg-[#DEFF9A]/[0.06]">
              <Zap className="w-3.5 h-3.5 text-[#DEFF9A]" aria-hidden="true" />
              <span className="font-arimo text-xs font-bold text-[#DEFF9A] uppercase tracking-wide">{c.hero.eyebrow}</span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="font-poppins font-black leading-[0.98] mb-6" style={{ fontSize: 'clamp(2.75rem, 7vw, 5.25rem)', letterSpacing: '-0.045em' }}>
              {c.hero.headline[0]}<br />
              <span style={{ background: `linear-gradient(120deg, ${LIME}, ${SKY})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{c.hero.headline[1]}</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="font-arimo text-white/70 text-lg leading-relaxed max-w-xl mb-8">{c.hero.subline}</motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mb-10">
              <button type="button" onClick={() => startCheck()} className="group inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-arimo font-bold text-[#0A192F] whitespace-nowrap b2b-focus-ring transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#DEFF9A]/25" style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }}>
                {c.hero.ctaPrimary}<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => go('projekte')} className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-arimo font-bold text-white whitespace-nowrap border border-white/20 bg-white/5 hover:bg-white/10 b2b-focus-ring transition">
                <Eye className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />{c.hero.ctaSecondary}
              </button>
            </motion.div>
            <motion.dl variants={fadeUp} className="grid grid-cols-3 gap-3 max-w-xl">
              {c.hero.proof.map((p) => (
                <div key={p.label} className="rounded-2xl px-3 py-3 bg-white/[0.04] border border-white/10">
                  <dt className="sr-only">{p.label}</dt>
                  <dd className="font-poppins font-black text-lg sm:text-xl text-[#DEFF9A] leading-tight">{p.value}</dd>
                  <dd className="font-arimo text-[11px] sm:text-xs text-white/55 leading-snug mt-1">{p.label}</dd>
                </div>
              ))}
            </motion.dl>
          </motion.div>

          {/* Collage aus echten Screens */}
          <motion.div initial={{ opacity: 0, y: reduce ? 0 : 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.7, delay: 0.15 }} className="lg:col-span-6 relative">
            <div className="relative pr-10 sm:pr-24 pb-16">
              <BrowserFrame src="/b2b/refs/crm-cockpit.webp" alt="Vertriebs-CRM mit KI-Tagesbriefing (Beispieldaten)" eager />
              <div className="absolute -right-0 sm:right-0 bottom-0 w-[38%] max-w-[210px]">
                <PhoneFrame src="/b2b/refs/trading-depot.webp" alt="Trading-Assistent im Demo-Modus" eager />
              </div>
              <div className="absolute -left-2 sm:-left-8 -bottom-2">
                <LiveTicker />
              </div>
            </div>
            <p className="mt-3 font-arimo text-[11px] text-white/40">Echte Oberflächen, gezeigt mit Beispieldaten.</p>
          </motion.div>
        </div>
      </section>

      {/* ── FINDER: Wo verlieren Sie Zeit? ─────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 bg-[#0A192F] border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="text-center mb-10">
            <h2 className="font-poppins font-black text-3xl sm:text-4xl mb-3" style={{ letterSpacing: '-0.03em' }}>{c.finder.title}</h2>
            <p className="font-arimo text-white/60 max-w-2xl mx-auto">{c.finder.subtitle}</p>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-2 mb-8" role="tablist" aria-label="Bereich wählen">
            {c.finder.options.map((o) => {
              const sel = o.id === finderPick;
              return (
                <button key={o.id} type="button" role="tab" aria-selected={sel} onClick={() => setFinderPick(o.id)}
                  className={`px-4 py-2.5 rounded-full font-arimo text-sm font-bold border transition b2b-focus-ring ${sel ? 'text-[#0A192F] border-transparent' : 'text-white/70 border-white/15 hover:text-white hover:border-white/35'}`}
                  style={sel ? { background: `linear-gradient(135deg, ${LIME}, ${SKY})` } : undefined}>
                  {o.label}
                </button>
              );
            })}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={finder.id} initial={{ opacity: 0, y: reduce ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.25 }}
              className="grid md:grid-cols-12 gap-6 items-center rounded-3xl p-5 sm:p-8 bg-white/[0.03] border border-white/10">
              <div className="md:col-span-5 order-2 md:order-1">
                <p className="font-arimo text-xs font-bold uppercase tracking-wide text-[#EF8A8A] mb-2">Heute</p>
                <p className="font-arimo text-white/75 mb-5">{finder.pain}</p>
                <p className="font-arimo text-xs font-bold uppercase tracking-wide text-[#DEFF9A] mb-2 flex items-center gap-1.5"><FinderIcon className="w-3.5 h-3.5" aria-hidden="true" />{finderRef.concept ? `So könnte es aussehen – Beispiel „${finderRef.short}“` : `So läuft es im Projekt „${finderRef.short}“`}</p>
                <ul className="space-y-2 mb-6">
                  {finderRef.automations.slice(0, 3).map((a) => (
                    <li key={a} className="flex items-start gap-2 font-arimo text-sm text-white/85"><Check className="w-4 h-4 text-[#DEFF9A] flex-shrink-0 mt-0.5" aria-hidden="true" />{a}</li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button type="button" onClick={() => startCheck(finder.checkArea)} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-arimo font-bold text-sm text-[#0A192F] b2b-focus-ring" style={{ background: LIME }}>
                    Genau das brauche ich <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => openRef(finderRef.id)} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-arimo font-bold text-sm text-white border border-white/20 hover:bg-white/5 b2b-focus-ring">
                    Projekt ansehen
                  </button>
                </div>
              </div>
              <button type="button" onClick={() => openRef(finderRef.id)} className="md:col-span-7 order-1 md:order-2 block text-left b2b-focus-ring rounded-xl" aria-label={`Projekt ${finderRef.short} ansehen`}>
                {finderRef.shots[0].device === 'mobile'
                  ? <PhoneFrame src={finderRef.shots[0].src} alt={finderRef.shots[0].alt} className="w-[200px] mx-auto" />
                  : <BrowserFrame src={finderRef.shots[0].src} alt={finderRef.shots[0].alt} />}
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── LIVE-PROJEKTE ──────────────────────────────────────────────── */}
      <section id="projekte" className="px-4 sm:px-6 lg:px-8 py-24 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="text-center mb-10">
            <span className="inline-block font-arimo text-xs font-bold uppercase tracking-[0.18em] text-[#38BDF8] mb-3">{c.references.eyebrow}</span>
            <h2 className="font-poppins font-black text-3xl sm:text-5xl mb-4" style={{ letterSpacing: '-0.035em' }}>{c.references.title}</h2>
            <p className="font-arimo text-white/60 max-w-2xl mx-auto">{c.references.subtitle}</p>
          </motion.div>

          {/* Projekt-Leiste (am Handy horizontal scrollbar) */}
          <div role="tablist" aria-label="Projekt wählen" className="flex lg:justify-center gap-2 overflow-x-auto pb-3 mb-8 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {c.references.items.map((r) => {
              const sel = r.id === activeRef;
              const Icon = refIcons[r.icon];
              return (
                <button key={r.id} type="button" role="tab" aria-selected={sel} aria-controls="projekt-panel" onClick={() => setActiveRef(r.id)}
                  className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-arimo text-sm font-bold border transition b2b-focus-ring ${sel ? 'bg-white text-[#0A192F] border-white' : 'text-white/70 border-white/12 bg-white/[0.03] hover:text-white hover:border-white/30'}`}>
                  <Icon className={`w-4 h-4 ${sel ? 'text-[#0A192F]' : 'text-[#38BDF8]'}`} aria-hidden="true" />{r.short}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={ref.id} id="projekt-panel" role="tabpanel" initial={{ opacity: 0, y: reduce ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.3 }}
              className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start rounded-[2rem] p-5 sm:p-8 lg:p-10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/10">
              <div className="lg:col-span-7 min-w-0">
                <ShotViewer shots={ref.shots} />
              </div>
              <div className="lg:col-span-5 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full font-arimo text-[10px] font-bold uppercase tracking-wide bg-[#DEFF9A]/12 text-[#DEFF9A]">{ref.category}</span>
                  {ref.concept
                    ? <span className="inline-flex items-center px-2.5 py-1 rounded-full font-arimo text-[10px] font-bold uppercase tracking-wide bg-[#ff7aa2]/15 text-[#ffb3c9]">Beispielansicht · Konzept</span>
                    : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-arimo text-[10px] font-bold uppercase tracking-wide bg-[#22c55e]/12 text-[#86efac]"><span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />Live im Einsatz</span>}
                </div>
                <h3 className="font-poppins font-black text-2xl sm:text-3xl leading-tight mb-3" style={{ letterSpacing: '-0.02em' }}>{ref.title}</h3>
                <p className="font-arimo text-white/70 leading-relaxed mb-6">{ref.pitch}</p>

                <p className="font-arimo text-xs font-bold uppercase tracking-wide text-[#38BDF8] mb-2 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" aria-hidden="true" />{ref.concept ? 'Was automatisch laufen würde' : 'Läuft automatisch'}</p>
                <ul className="space-y-2 mb-5">
                  {ref.automations.map((a) => (
                    <li key={a} className="flex items-start gap-2 font-arimo text-sm text-white/85"><Check className="w-4 h-4 text-[#38BDF8] flex-shrink-0 mt-0.5" aria-hidden="true" />{a}</li>
                  ))}
                </ul>
                {ref.ai.length > 0 && (
                  <>
                    <p className="font-arimo text-xs font-bold uppercase tracking-wide text-[#DEFF9A] mb-2 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" aria-hidden="true" />KI an Bord</p>
                    <ul className="space-y-2 mb-5">
                      {ref.ai.map((a) => (
                        <li key={a} className="flex items-start gap-2 font-arimo text-sm text-white/85"><Sparkles className="w-4 h-4 text-[#DEFF9A] flex-shrink-0 mt-0.5" aria-hidden="true" />{a}</li>
                      ))}
                    </ul>
                  </>
                )}
                <div className="flex items-start gap-2.5 rounded-2xl px-4 py-3 mb-5 bg-[#22c55e]/[0.08] border border-[#22c55e]/25">
                  <ShieldCheck className="w-5 h-5 text-[#86efac] flex-shrink-0" aria-hidden="true" />
                  <p className="font-arimo text-sm text-[#d1fadf]">{ref.control}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {ref.stack.map((s) => <span key={s} className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 font-arimo text-[11px] font-semibold text-white/60">{s}</span>)}
                </div>
                {ref.disclaimer && <p className="font-arimo text-[11px] text-white/40 mb-4">{ref.disclaimer}</p>}
                <button type="button" onClick={() => startCheck()} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-arimo font-bold text-sm text-[#0A192F] b2b-focus-ring transition hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }}>
                  So etwas für uns <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── VORGEHEN + PRINZIPIEN ──────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 bg-[#0A192F] border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="text-center mb-12">
            <span className="inline-block font-arimo text-xs font-bold uppercase tracking-[0.18em] text-[#38BDF8] mb-3">{c.approach.eyebrow}</span>
            <h2 className="font-poppins font-black text-3xl sm:text-4xl" style={{ letterSpacing: '-0.03em' }}>{c.approach.title}</h2>
          </motion.div>
          <motion.ol variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
            {c.approach.steps.map((s, i) => {
              const Icon = stepIcons[s.icon] ?? Search;
              return (
                <motion.li key={s.title} variants={fadeUp} className="relative rounded-2xl p-6 bg-white/[0.03] border border-white/10">
                  <span className="absolute top-5 right-5 font-poppins font-black text-4xl text-white/[0.07]">{i + 1}</span>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }}><Icon className="w-5 h-5 text-[#0A192F]" aria-hidden="true" /></div>
                  <h3 className="font-poppins font-bold text-lg mb-1.5">{s.title}</h3>
                  <p className="font-arimo text-sm text-white/60 leading-relaxed">{s.desc}</p>
                </motion.li>
              );
            })}
          </motion.ol>
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT} className="grid md:grid-cols-3 gap-4">
            {c.principles.map((p) => (
              <motion.div key={p.title} variants={fadeUp} className="flex items-start gap-3 rounded-2xl p-5 border border-[#DEFF9A]/20 bg-[#DEFF9A]/[0.04]">
                <ShieldCheck className="w-5 h-5 text-[#DEFF9A] flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="font-poppins font-bold mb-1">{p.title}</h3>
                  <p className="font-arimo text-sm text-white/60 leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PROZESS-CHECK (Conversion) ─────────────────────────────────── */}
      <section id="prozess-check" className="px-4 sm:px-6 lg:px-8 py-24 scroll-mt-16">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-10 items-start">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="lg:col-span-5">
            <span className="inline-block font-arimo text-xs font-bold uppercase tracking-[0.18em] text-[#DEFF9A] mb-3">{c.check.eyebrow}</span>
            <h2 className="font-poppins font-black text-3xl sm:text-4xl mb-4" style={{ letterSpacing: '-0.03em' }}>{c.check.title}</h2>
            <p className="font-arimo text-white/65 mb-6">{c.check.subtitle}</p>
            <ul className="space-y-2.5 mb-8">
              {['Kostenlos und unverbindlich', 'Antwort innerhalb von 24 Stunden', 'Konkrete Einschätzung statt Verkaufsgespräch'].map((t) => (
                <li key={t} className="flex items-center gap-2 font-arimo text-sm text-white/80"><Check className="w-4 h-4 text-[#DEFF9A]" aria-hidden="true" />{t}</li>
              ))}
            </ul>
            <div className="flex items-center gap-3">
              <CalendarCheck className="w-5 h-5 text-[#38BDF8]" aria-hidden="true" />
              <span className="font-arimo text-sm text-white/60">Lieber direkt sprechen?</span>
              <CalBookingButton label="Termin buchen" variant="secondary" />
            </div>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="lg:col-span-7 rounded-[2rem] p-6 sm:p-8 bg-gradient-to-b from-white/[0.07] to-white/[0.03] border border-white/12 shadow-2xl">
            <ProcessCheck presetArea={presetArea} />
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-poppins font-black text-2xl sm:text-3xl text-center mb-8" style={{ letterSpacing: '-0.02em' }}>Häufige Fragen</h2>
          <div className="space-y-3">
            {c.faq.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q} className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
                  <button type="button" onClick={() => setOpenFaq(open ? null : i)} aria-expanded={open} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left b2b-focus-ring">
                    <span className="font-poppins font-bold text-sm sm:text-base">{f.q}</span>
                    <ChevronDown className={`w-5 h-5 text-[#38BDF8] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduce ? 0 : 0.2 }} className="overflow-hidden">
                        <p className="px-5 pb-5 font-arimo text-sm text-white/65 leading-relaxed">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ABSCHLUSS ──────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-28">
        <div className="max-w-5xl mx-auto relative overflow-hidden rounded-[2rem] px-6 py-14 sm:px-12 text-center" style={{ background: `radial-gradient(600px 300px at 50% 0%, rgba(222,255,154,0.18), transparent 70%), linear-gradient(150deg, #0d2340, #0A192F)` }}>
          <h2 className="font-poppins font-black text-3xl sm:text-4xl mb-3" style={{ letterSpacing: '-0.03em' }}>{c.cta.title}</h2>
          <p className="font-arimo text-white/65 max-w-xl mx-auto mb-8">{c.cta.subtitle}</p>
          <button type="button" onClick={() => startCheck()} className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-arimo font-bold text-[#0A192F] b2b-focus-ring transition hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }}>
            {c.cta.button}<ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
          <p className="mt-8 font-arimo text-sm text-white/50">
            Sie suchen Skill-Intelligence für HR oder Bildung?{' '}
            <a href="#/business" className="inline-flex items-center gap-1 font-bold text-[#38BDF8] hover:text-white"><Layers className="w-3.5 h-3.5" aria-hidden="true" />Zur DYD Skill-Plattform</a>
          </p>
        </div>
      </section>

      {/* ── Mobile CTA-Leiste ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showSticky && (
          <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }} transition={{ duration: reduce ? 0 : 0.25 }}
            className="md:hidden fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pt-3 bg-gradient-to-t from-[#07111f] via-[#07111f]/95 to-transparent">
            <button type="button" onClick={() => startCheck()} className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-arimo font-bold text-[#0A192F] shadow-xl b2b-focus-ring" style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }}>
              Kostenloser Prozess-Check <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
