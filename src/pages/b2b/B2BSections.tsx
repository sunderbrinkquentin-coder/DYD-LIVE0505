import { useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  Layers, Brain, Shield, Flag,
  Calendar, MapPin, Users, CheckCircle2,
  GraduationCap, Award, Lock, Sparkles,
  Mail, Linkedin, CalendarClock, ArrowRight, Building2, BookOpen
} from 'lucide-react';
import { b2bContent } from './content';

const iconMap: Record<string, typeof Layers> = {
  layers: Layers, brain: Brain, shield: Shield, flag: Flag,
};

function useSectionAnims() {
  const reduce = useReducedMotion() ?? false;
  const container: Variants = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.1 } } };
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 22 },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.5 } },
  };
  const fadeLeft: Variants = {
    hidden: { opacity: 0, x: reduce ? 0 : -20 },
    show: { opacity: 1, x: 0, transition: { duration: reduce ? 0 : 0.5 } },
  };
  const fadeRight: Variants = {
    hidden: { opacity: 0, x: reduce ? 0 : 20 },
    show: { opacity: 1, x: 0, transition: { duration: reduce ? 0 : 0.5 } },
  };
  return { reduce, container, fadeUp, fadeLeft, fadeRight };
}

const VIEWPORT = { once: true, margin: '-80px' } as const;

/* ─── Produktdaten für ORBIT & NEXUS ─── */
const SOLUTIONS = {
  enterprise: {
    badge: "Für Unternehmen & B2B Enterprise",
    brandName: "DYD ORBIT",
    acronymList: [
      { letter: 'O', word: 'ptimized' },
      { letter: 'R', word: 'eskilling' },
      { letter: 'B', word: 'usiness' },
      { letter: 'I', word: 'ntelligence' },
      { letter: 'T', word: 'ool' },
    ],
    tagline: "Die prädikative Steuerungsplattform für KI-gestütztes Skill-Mapping, ESCO-Analytik & interne Mobilität.",
    highlights: [
      "Präzise Skill-Gap-Analytik nach EU-ESCO Standard",
      "Automatisierte Karriere- & Weiterbildungspfade",
      "Nahtlose Integration in SAP, Workday & Moodle"
    ],
    ctaText: "DYD ORBIT Demo anfragen",
    ctaLink: "#contact",
    accentColor: "#38BDF8",
    secondaryColor: "#DEFF9A"
  },
  education: {
    badge: "Für Bildungsträger & Akademien",
    brandName: "DYD NEXUS",
    acronymList: [
      { letter: 'N', word: 'ext-Skill' },
      { letter: 'E', word: 'volution' },
      { letter: 'X', word: '-Learning' },
      { letter: 'U', word: 'niversal' },
      { letter: 'S', word: 'ystem' },
    ],
    tagline: "Die KI-Schnittstelle zur Standardisierung von Kursangeboten nach EU-ESCO Taxonomie und zur Maximierung der Employability.",
    highlights: [
      "Lehrplan-Alignment mit aktuellen Arbeitsmarktdaten",
      "Echtzeit-Matching von Kursinhalten mit Anforderungsprofilen",
      "Messbare Steigerung der Vermittlungsquote von Absolventen"
    ],
    ctaText: "DYD NEXUS für Akademien testen",
    ctaLink: "#contact",
    accentColor: "#DEFF9A",
    secondaryColor: "#38BDF8"
  }
};

/* ─── Plattform-Überblick Section ─── */

export function PlatformOverviewSection() {
  const [activeTab, setActiveTab] = useState<'enterprise' | 'education'>('enterprise');
  const { fadeUp } = useSectionAnims();

  const current = SOLUTIONS[activeTab];

  return (
    <section aria-labelledby="b2b-platform-title" className="relative bg-[#0A192F] py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#38BDF8]/5 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Top Header Badge */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3 border border-[#38BDF8]/30 bg-[#38BDF8]/5">
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
            <span className="font-arimo text-xs font-bold text-[#38BDF8] uppercase tracking-wider">
              Die Plattform-Architektur
            </span>
          </div>
          <h2 id="b2b-platform-title" className="font-poppins font-black text-2xl sm:text-4xl text-white tracking-tight">
            Zielgerichtete Skill-Intelligence
          </h2>
        </motion.div>

        {/* 1. SWITCHER GANZ OBEN */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('enterprise')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-poppins font-bold text-sm transition-all duration-300 ${
                activeTab === 'enterprise'
                  ? 'bg-[#38BDF8] text-[#0A192F] shadow-lg shadow-[#38BDF8]/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Für Unternehmen</span>
            </button>
            <button
              onClick={() => setActiveTab('education')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-poppins font-bold text-sm transition-all duration-300 ${
                activeTab === 'education'
                  ? 'bg-[#DEFF9A] text-[#0A192F] shadow-lg shadow-[#DEFF9A]/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Für Bildungsträger</span>
            </button>
          </div>
        </div>

        {/* 2. HAUPTKARTE MIT NAME SOFORT OBEN */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl p-8 sm:p-12 border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] backdrop-blur-md text-center relative overflow-hidden shadow-2xl"
        >
          {/* Badge */}
          <span 
            className="font-arimo text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-block mb-3 border"
            style={{ 
              color: current.accentColor, 
              backgroundColor: `${current.accentColor}10`,
              borderColor: `${current.accentColor}30`
            }}
          >
            {current.badge}
          </span>

          {/* MASSIVER PRODUKTNAME (ORBIT / NEXUS) SOFORT UNTER DEM SWITCHER */}
          <h3 className="font-poppins font-black text-5xl sm:text-7xl text-white tracking-tight mb-2">
            {current.brandName}
          </h3>

          {/* AKRONYM DEZENT DIREKT DARUNTER */}
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 mb-6 text-sm sm:text-lg font-poppins font-semibold">
            {current.acronymList.map((item, idx) => (
              <span key={item.word} className="inline-flex items-center">
                <span style={{ color: current.accentColor }} className="font-black">
                  {item.letter}
                </span>
                <span className="text-white/60 font-medium">
                  {item.word}
                </span>
                {idx < current.acronymList.length - 1 && (
                  <span className="text-white/20 ml-2">•</span>
                )}
              </span>
            ))}
          </div>

          {/* Tagline */}
          <p className="font-arimo text-white/70 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            {current.tagline}
          </p>

          {/* Highlights Grid */}
          <div className="grid sm:grid-cols-3 gap-4 mb-10 text-left border-t border-b border-white/10 py-6">
            {current.highlights.map((feat) => (
              <div key={feat} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: current.accentColor }} />
                <span className="font-arimo text-xs sm:text-sm text-white/80 leading-snug">{feat}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <a
            href={current.ctaLink}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-poppins font-bold text-sm sm:text-base text-[#0A192F] transition-all duration-300 hover:scale-105 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${current.accentColor}, ${current.secondaryColor})` }}
          >
            <span>{current.ctaText}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>

      </div>
    </section>
  );
}

/* ─── Vertrauen & Glaubwürdigkeit ─── */

type TrustSectionProps = {
  /** Öffnet das Kontakt-Modal; wenn nicht gesetzt, fällt der Kontakt-Button auf mailto zurück. */
  onContact?: () => void;
};

export function TrustSection({ onContact }: TrustSectionProps) {
  const { trust } = b2bContent;
  const { fadeUp, fadeLeft, fadeRight, container } = useSectionAnims();
  const badgeIcons: Record<string, typeof Lock> = { DSGVO: Lock, ESCO: Layers, 'Made in Germany': Flag };

  const f = trust.founder as typeof trust.founder & { calendarUrl?: string };
  const handleContact = onContact ?? (() => { window.location.href = `mailto:${f.email}`; });

  return (
    <section aria-labelledby="b2b-trust-title" className="relative bg-[#F6F9FD] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="text-center mb-14">
          <h2 id="b2b-trust-title" className="font-poppins font-black text-3xl sm:text-4xl text-[#0F1E34] mb-4" style={{ letterSpacing: '-0.03em' }}>
            {trust.title}
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Partner */}
          <motion.div variants={fadeLeft} initial="hidden" whileInView="show" viewport={VIEWPORT} className="rounded-2xl p-8 bg-white border border-[#E3EBF5] hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-[#38BDF8]" aria-hidden="true" />
              <span className="font-arimo text-xs font-bold uppercase tracking-wide text-[#55637A]">{trust.partner.label}</span>
            </div>
            <h3 className="font-poppins font-black text-2xl text-[#0F1E34] mb-3">{trust.partner.name}</h3>
            <p className="font-arimo text-[#55637A] leading-relaxed mb-5">{trust.partner.desc}</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-arimo font-bold text-[#0F1E34] bg-[#38BDF8]/8 border border-[#38BDF8]/20">Workshop-Präsenz</span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-arimo font-bold text-[#0F1E34] bg-[#38BDF8]/8 border border-[#38BDF8]/20">Pilotierte KI-Trainings</span>
            </div>
          </motion.div>

          {/* Founder */}
          <motion.div variants={fadeRight} initial="hidden" whileInView="show" viewport={VIEWPORT} className="rounded-2xl bg-white border border-[#E3EBF5] overflow-hidden hover:shadow-lg transition-shadow">
            <div className="flex flex-col sm:flex-row">
              {/* Foto-Panel (Verlauf NUR hier) */}
              <div className="relative sm:w-44 flex-shrink-0 flex items-center justify-center p-6" style={{ background: 'linear-gradient(155deg, #0A192F 0%, #123059 55%, #2b7fd4 130%)' }}>
                <img
                  src={f.photoSrc}
                  alt={f.photoAlt}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover"
                  style={{ boxShadow: '0 12px 30px -8px rgba(0,0,0,0.55)', outline: '3px solid rgba(255,255,255,0.14)', outlineOffset: '0px' }}
                />
              </div>

              {/* Inhalt (Weiß, gut lesbar) */}
              <div className="flex-1 p-6 sm:p-7">
                <span className="font-arimo text-xs font-bold uppercase tracking-wide text-[#55637A]">{f.label}</span>
                <h3 className="font-poppins font-black text-xl text-[#0F1E34] mb-4">{f.name}</h3>

                <ul className="space-y-2 mb-6">
                  {f.roles.map((role) => (
                    <li key={role} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#38BDF8] flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="font-arimo text-sm text-[#55637A] leading-snug">{role}</span>
                    </li>
                  ))}
                </ul>

                {/* Buttons: Termin (primär) · Kontakt · LinkedIn */}
                <div className="flex flex-wrap gap-2.5">
                  {f.calendarUrl ? (
                    <a
                      href={f.calendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-arimo font-bold text-[#0A192F] transition hover:shadow-lg hover:shadow-[#38BDF8]/25"
                      style={{ background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)' }}
                    >
                      <CalendarClock className="w-4 h-4" aria-hidden="true" /> Termin anfragen
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={handleContact}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-arimo font-bold text-[#0A192F] transition hover:shadow-lg hover:shadow-[#38BDF8]/25"
                      style={{ background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)' }}
                    >
                      <CalendarClock className="w-4 h-4" aria-hidden="true" /> Termin anfragen
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleContact}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-arimo font-bold text-[#0F1E34] border border-[#E3EBF5] hover:border-[#38BDF8]/40 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" /> Kontakt
                  </button>

                  <a
                    href={f.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-arimo font-bold text-[#0F1E34] border border-[#E3EBF5] hover:border-[#38BDF8]/40 transition-colors"
                  >
                    <Linkedin className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" /> LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Badges */}
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT} className="flex flex-wrap items-center justify-center gap-4 mt-10">
          {trust.badges.map((badge) => {
            const Icon = badgeIcons[badge] ?? Award;
            return (
              <motion.div key={badge} variants={fadeUp} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2" style={{ borderColor: 'rgba(56,189,248,0.25)', background: 'rgba(56,189,248,0.04)' }}>
                <Icon className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
                <span className="font-poppins font-bold text-sm text-[#0F1E34]">{badge}</span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── DYD live: Workshops & Messeauftritte ─── */

export function EventsSection() {
  const { events } = b2bContent as typeof b2bContent & {
    events: { title: string; subtitle: string; note: string; entries: Array<{ date: string; title: string; location?: string; audience?: string; topics?: string[]; placeholder?: boolean }> };
  };
  const { fadeUp, fadeLeft, container } = useSectionAnims();

  return (
    <section aria-labelledby="b2b-events-title" className="relative bg-[#0A192F] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 border border-[#DEFF9A]/30 bg-[#DEFF9A]/5">
            <Calendar className="w-3.5 h-3.5 text-[#DEFF9A]" aria-hidden="true" />
            <span className="font-arimo text-xs font-bold text-[#DEFF9A] uppercase tracking-wide">Live vor Ort</span>
          </div>
          <h2 id="b2b-events-title" className="font-poppins font-black text-3xl sm:text-4xl text-white mb-4" style={{ letterSpacing: '-0.03em' }}>{events.title}</h2>
          <p className="font-arimo text-white/55 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">{events.subtitle}</p>
        </motion.div>

        <div className="relative">
          <div aria-hidden="true" className="absolute left-4 sm:left-6 top-0 bottom-0 w-[2px] rounded-full" style={{ background: 'linear-gradient(180deg, #38BDF8, #DEFF9A)', boxShadow: '0 0 10px rgba(56,189,248,0.2)' }} />

          <motion.div variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT} className="space-y-6">
            {events.entries.map((entry) => {
              const accent = !entry.placeholder;
              return (
                <motion.div key={entry.title} variants={fadeLeft} className="relative pl-14 sm:pl-20">
                  <div className="absolute left-0 top-2 w-8 sm:w-12 h-8 sm:h-12 rounded-full flex items-center justify-center z-10" style={{ background: '#0A192F', border: `2px solid ${accent ? '#38BDF8' : 'rgba(255,255,255,0.15)'}`, boxShadow: accent ? '0 0 12px rgba(56,189,248,0.25)' : 'none' }}>
                    <Calendar className={`w-4 h-4 ${accent ? 'text-[#DEFF9A]' : 'text-white/25'}`} aria-hidden="true" />
                  </div>
                  <div className={`rounded-2xl p-6 border transition-colors ${entry.placeholder ? 'border-dashed border-white/15 bg-white/[0.02]' : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07]'}`}>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className={`font-poppins font-bold text-sm ${accent ? 'text-[#38BDF8]' : 'text-white/40'}`}>{entry.date}</span>
                    </div>
                    <h3 className={`font-poppins font-bold text-lg mb-3 ${accent ? 'text-white' : 'text-white/40'}`}>{entry.title}</h3>
                    <div className="flex flex-wrap gap-4">
                      {entry.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-white/40" aria-hidden="true" />
                          <span className="font-arimo text-sm text-white/50">{entry.location}</span>
                        </div>
                      )}
                      {entry.audience && (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-white/40" aria-hidden="true" />
                          <span className="font-arimo text-sm text-white/50">{entry.audience}</span>
                        </div>
                      )}
                    </div>
                    {entry.topics && entry.topics.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {entry.topics.map((topic) => (
                          <span key={topic} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-arimo font-semibold" style={{ background: 'rgba(222,255,154,0.10)', color: '#DEFF9A' }}>{topic}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="mt-8 rounded-2xl p-5 border border-dashed border-[#DEFF9A]/30 bg-[#DEFF9A]/[0.03]">
          <p className="font-arimo text-sm text-white/40 italic text-center">{events.note}</p>
        </motion.div>
      </div>
    </section>
  );
}