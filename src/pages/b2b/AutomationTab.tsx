// src/pages/b2b/AutomationTab.tsx
//
// Inhalt des dritten B2B-Tabs "Automatisierung & Software" (NEU, 16.10.2026).
// Aufbau (mit eigener Sprungnavigation, damit man sich zurechtfindet):
//   Intro → Leistungen → Referenzen (3 Fallstudien mit Bild) → Prinzipien
//   → Ablauf → FAQ → Abschluss-CTA

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  ArrowRight, Bot, Check, CheckCircle2, Cpu, LayoutDashboard, LineChart, Mic, Plug,
  Plus, Sparkles, Users, Workflow, AlertCircle, ShieldCheck, Rocket, FileCheck2, Ticket, Trophy,
} from 'lucide-react';
import { automationContent as c } from './automationContent';
import { CrmTodayMockup, PodcastStudioMockup, TicketSystemMockup, TournamentMockup, TradingMockup } from './AutomationMockups';
import ProcessRail from './ProcessRail';
import { CalBookingButton } from './CalBookingButton';

const NAVY_SKY = 'linear-gradient(135deg, #0A192F, #38BDF8)';
const SKY_LIME = 'linear-gradient(135deg, #38BDF8, #DEFF9A)';
const VIEWPORT = { once: true, margin: '-60px' } as const;

function useAnims() {
  const reduce = useReducedMotion() ?? false;
  const container: Variants = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.08 } } };
  const fadeUp: Variants = { hidden: { opacity: 0, y: reduce ? 0 : 18 }, show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.45 } } };
  return { reduce, container, fadeUp };
}

const serviceIcons: Record<string, typeof Workflow> = {
  workflow: Workflow, bot: Bot, crm: Users, dashboard: LayoutDashboard, plug: Plug, app: Cpu,
};
const projectIcons: Record<string, typeof Mic> = { mic: Mic, crm: Users, chart: LineChart, ticket: Ticket, trophy: Trophy };
const projectMockups: Record<string, () => JSX.Element> = {
  podcast: PodcastStudioMockup,
  crm: CrmTodayMockup,
  trading: TradingMockup,
  tickets: TicketSystemMockup,
  tournament: TournamentMockup,
};
const principleIcons = [ShieldCheck, Rocket, FileCheck2];

function SectionHead({ id, title, subtitle }: { id?: string; title: string; subtitle?: string }) {
  const { fadeUp } = useAnims();
  return (
    <motion.div id={id} variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="text-center mb-8 scroll-mt-40">
      <h3 className="font-poppins font-bold text-xl sm:text-2xl text-[#0F1E34] mb-2">{title}</h3>
      {subtitle && <p className="font-arimo text-[#55637A] max-w-2xl mx-auto leading-relaxed">{subtitle}</p>}
    </motion.div>
  );
}

export default function AutomationTab({ onContact }: { onContact: (context?: string) => void }) {
  const { reduce, container, fadeUp } = useAnims();
  const [activeProject, setActiveProject] = useState<string>(c.references.projects[0].id);
  const project = c.references.projects.find((p) => p.id === activeProject) ?? c.references.projects[0];
  const Mockup = projectMockups[project.id];

  const jump = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });

  return (
    <div className="space-y-16">
      {/* ── Intro ─────────────────────────────────────────────────────── */}
      <motion.div variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT} className="text-center">
        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border border-[#38BDF8]/30 bg-[#38BDF8]/5">
          <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
          <span className="font-arimo text-xs font-bold text-[#38BDF8] uppercase tracking-wide">{c.intro.eyebrow}</span>
        </motion.div>
        <motion.h2
          variants={fadeUp}
          className="font-poppins font-black leading-[1.05] mb-5 max-w-3xl mx-auto"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', letterSpacing: '-0.03em', background: NAVY_SKY, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
        >
          {c.intro.headline}
        </motion.h2>
        <motion.p variants={fadeUp} className="font-arimo text-[#55637A] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-6">{c.intro.subline}</motion.p>
        <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2">
          {c.intro.chips.map((chip) => (
            <span key={chip} className="px-3 py-1.5 rounded-full bg-white border border-[#E3EBF5] font-arimo text-xs font-bold text-[#0F1E34]">{chip}</span>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Sprungnavigation (bleibt beim Scrollen sichtbar) ─────────── */}
      <nav aria-label="Bereiche Automatisierung" className="sticky top-16 lg:top-[4.75rem] z-20 -mx-4 px-4 py-2 bg-[#F6F9FD]/90 backdrop-blur-md">
        <div className="flex gap-2 overflow-x-auto justify-start sm:justify-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {c.subnav.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => jump(s.id)}
              className="flex-shrink-0 px-3 sm:px-4 py-2 rounded-full bg-white border border-[#E3EBF5] font-arimo text-xs sm:text-sm font-bold text-[#55637A] hover:text-[#0F1E34] hover:border-[#38BDF8]/50 transition b2b-focus-ring"
            >
              {s.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Leistungen ────────────────────────────────────────────────── */}
      <div>
        <SectionHead id="auto-leistungen" title={c.services.title} subtitle={c.services.subtitle} />
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {c.services.items.map((s) => {
            const Icon = serviceIcons[s.icon] ?? Workflow;
            return (
              <motion.div key={s.title} variants={fadeUp} className="rounded-2xl p-6 bg-white border border-[#E3EBF5] hover:shadow-lg hover:border-[#38BDF8]/40 transition-all">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: SKY_LIME }}>
                  <Icon className="w-5 h-5 text-[#0A192F]" aria-hidden="true" />
                </div>
                <h4 className="font-poppins font-bold text-base text-[#0F1E34] mb-1.5">{s.title}</h4>
                <p className="font-arimo text-sm text-[#55637A] leading-relaxed">{s.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── Referenzen ────────────────────────────────────────────────── */}
      <div>
        <SectionHead id="auto-referenzen" title={c.references.title} subtitle={c.references.subtitle} />

        {/* Projekt-Umschalter */}
        <div role="tablist" aria-label="Referenzprojekt wählen" className="grid grid-cols-5 gap-1 sm:gap-2 p-1.5 rounded-2xl bg-white border border-[#E3EBF5] shadow-sm max-w-3xl mx-auto mb-8">
          {c.references.projects.map((p) => {
            const selected = p.id === activeProject;
            const Icon = projectIcons[p.icon] ?? Sparkles;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="auto-project-panel"
                onClick={() => setActiveProject(p.id)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-sm font-arimo font-bold transition b2b-focus-ring ${selected ? 'text-white shadow-md' : 'text-[#55637A] hover:text-[#0F1E34]'}`}
                style={selected ? { background: NAVY_SKY } : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span className="text-center leading-tight">{p.tab}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={project.id}
            id="auto-project-panel"
            role="tabpanel"
            initial={{ opacity: 0, y: reduce ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -10 }}
            transition={{ duration: reduce ? 0 : 0.3 }}
            className="rounded-3xl bg-white border border-[#E3EBF5] p-4 sm:p-8 shadow-sm"
          >
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Bild */}
              <div className="lg:col-span-7 lg:sticky lg:top-40">
                <Mockup />
                <p className="font-arimo text-[11px] text-[#94a3b8] mt-3 text-center">{'poster' in project && project.poster ? c.references.noteWithPoster : c.references.note}</p>
              </div>

              {/* Fallstudie */}
              <div className="lg:col-span-5">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-arimo font-bold uppercase tracking-wide mb-3" style={{ background: 'rgba(222,255,154,0.25)', color: '#0F1E34' }}>
                  {project.category}
                </span>
                <h4 className="font-poppins font-black text-xl sm:text-2xl text-[#0F1E34] leading-tight mb-2" style={{ letterSpacing: '-0.02em' }}>{project.title}</h4>
                <p className="font-arimo text-[#55637A] leading-relaxed mb-6">{project.summary}</p>

                <div className="space-y-5">
                  <div>
                    <p className="flex items-center gap-1.5 font-arimo text-xs font-bold uppercase tracking-wide text-[#EF5350] mb-2"><AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />Ausgangslage</p>
                    <ul className="space-y-1.5">
                      {project.before.map((b) => (
                        <li key={b} className="flex items-start gap-2 font-arimo text-sm text-[#55637A]"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#EF5350]/70 flex-shrink-0" aria-hidden="true" />{b}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 font-arimo text-xs font-bold uppercase tracking-wide text-[#0284c7] mb-2"><Sparkles className="w-3.5 h-3.5" aria-hidden="true" />Lösung</p>
                    <ul className="space-y-1.5">
                      {project.solution.map((s) => (
                        <li key={s} className="flex items-start gap-2 font-arimo text-sm text-[#0F1E34]"><Check className="w-4 h-4 text-[#38BDF8] flex-shrink-0 mt-0.5" aria-hidden="true" />{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl p-4" style={{ background: '#0A192F' }}>
                    <p className="flex items-center gap-1.5 font-arimo text-xs font-bold uppercase tracking-wide text-[#DEFF9A] mb-2"><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />Ergebnis</p>
                    <ul className="space-y-1.5">
                      {project.outcomes.map((o) => (
                        <li key={o} className="flex items-start gap-2 font-arimo text-sm text-white/85"><span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: SKY_LIME }} aria-hidden="true" />{o}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {project.stack.map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-lg bg-[#F6F9FD] border border-[#E3EBF5] font-arimo text-[11px] font-semibold text-[#55637A]">{s}</span>
                    ))}
                  </div>
                  {'disclaimer' in project && project.disclaimer && (
                    <p className="font-arimo text-[11px] text-[#94a3b8]">{project.disclaimer}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => onContact(`Referenz: ${project.tab}`)}
                    className="inline-flex items-center gap-1.5 font-arimo text-sm font-bold text-[#0284c7] hover:text-[#0A192F] transition b2b-focus-ring rounded"
                  >
                    So etwas für unser Team <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Prinzipien ────────────────────────────────────────────────── */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="rounded-3xl px-6 py-10 sm:px-10 sm:py-12"
        style={{ background: 'radial-gradient(600px 260px at 50% 0%, rgba(86,212,255,0.22), transparent 70%), linear-gradient(150deg, #0A192F, #123059)' }}
      >
        <motion.h3 variants={fadeUp} className="font-poppins font-black text-white text-2xl sm:text-3xl text-center mb-8" style={{ letterSpacing: '-0.02em' }}>{c.principles.title}</motion.h3>
        <div className="grid md:grid-cols-3 gap-4">
          {c.principles.items.map((p, i) => {
            const Icon = principleIcons[i] ?? ShieldCheck;
            return (
              <motion.div key={p.title} variants={fadeUp} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <Icon className="w-6 h-6 text-[#DEFF9A] mb-3" aria-hidden="true" />
                <h4 className="font-poppins font-bold text-white mb-1.5">{p.title}</h4>
                <p className="font-arimo text-sm text-white/65 leading-relaxed">{p.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Ablauf ────────────────────────────────────────────────────── */}
      <div>
        <SectionHead id="auto-ablauf" title={c.process.title} />
        <ProcessRail steps={[...c.process.steps]} />
      </div>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <div>
        <SectionHead id="auto-faq" title="Häufige Fragen" />
        <AutomationFaq onContact={() => onContact('Frage aus FAQ')} />
      </div>

      {/* ── Abschluss-CTA ─────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="rounded-3xl bg-white border border-[#E3EBF5] px-6 py-10 text-center">
        <h3 className="font-poppins font-black text-2xl text-[#0F1E34] mb-2" style={{ letterSpacing: '-0.02em' }}>{c.cta.title}</h3>
        <p className="font-arimo text-[#55637A] max-w-xl mx-auto mb-6">{c.cta.subtitle}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button type="button" onClick={() => onContact()} className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-arimo font-bold text-white b2b-focus-ring transition hover:shadow-xl hover:shadow-[#38BDF8]/25 hover:-translate-y-0.5" style={{ background: NAVY_SKY }}>
            {c.cta.button}<ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
          <CalBookingButton label="Termin direkt buchen" variant="secondary" />
        </div>
      </motion.div>
    </div>
  );
}

function AutomationFaq({ onContact }: { onContact: () => void }) {
  const { reduce } = useAnims();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {c.faq.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="rounded-2xl bg-white border border-[#E3EBF5] overflow-hidden">
            <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} aria-controls={`auto-faq-${i}`} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left b2b-focus-ring">
              <span className="font-poppins font-bold text-sm sm:text-base text-[#0F1E34]">{item.q}</span>
              <Plus className={`w-5 h-5 text-[#38BDF8] flex-shrink-0 transition-transform ${isOpen ? 'rotate-45' : ''}`} style={{ transitionDuration: reduce ? '0ms' : '250ms' }} aria-hidden="true" />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div id={`auto-faq-${i}`} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduce ? 0 : 0.25 }} className="overflow-hidden">
                  <div className="px-5 pb-5">
                    <p className="font-arimo text-sm text-[#55637A] leading-relaxed">{item.a}</p>
                    {'cta' in item && item.cta && (
                      <button type="button" onClick={onContact} className="mt-3 inline-flex items-center gap-1.5 font-arimo text-xs font-bold text-[#38BDF8] hover:text-[#0A192F] transition b2b-focus-ring rounded">
                        {item.ctaLabel}<ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
