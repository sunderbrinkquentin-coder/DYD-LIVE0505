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

/* ─── Akronym Daten-Struktur für Conversion ─── */
const ACRONYM_DATA = {
  enterprise: {
    badge: "Für B2B Enterprises & HR Teams",
    brandName: "DYD ORBIT",
    subline: "Optimized Reskilling & Business Intelligence Tool",
    description: "Die Steuerung für strategische Personalentwicklung und interne Mobilität.",
    letters: [
      { letter: 'O', word: 'Optimized', desc: 'Maximierte Effizienz bei der internen Besetzung' },
      { letter: 'R', word: 'Reskilling', desc: 'ESCO-gestützte Weiterbildungspfade für IT & Fachkräfte' },
      { letter: 'B', word: 'Business', desc: 'Ausrichtung der Skill-Entwicklung an echten ROI-Zielen' },
      { letter: 'I', word: 'Intelligence', desc: 'Prädikative KI-Analytik für Skill-Lücken & Workforce' },
      { letter: 'T', word: 'Tool', desc: 'Nahtlose Enterprise-Integration (Workday, SAP, Moodle)' }
    ],
    ctaText: "DYD ORBIT für Enterprise anfragen",
    ctaLink: "#contact"
  },
  education: {
    badge: "Für Bildungsträger & Akademien",
    brandName: "DYD NEXUS",
    subline: "Next-Skill Evolution & X-Learning Universal System",
    description: "Der universelle Schnittpunkt zwischen didaktischem Angebot und Arbeitsmarkt.",
    letters: [
      { letter: 'N', word: 'Next-Skill', desc: 'Identifikation von Zukunfts-Skills vor dem Markt' },
      { letter: 'E', word: 'Evolution', desc: 'Didaktische Weiterentwicklung von Kurs-Lehrplänen' },
      { letter: 'X', word: 'X-Learning', desc: 'Schnittstellenübergreifendes Matching von Bildungsangeboten' },
      { letter: 'U', word: 'Universal', desc: 'Standardisiertes Alignment nach EU-ESCO Taxonomie' },
      { letter: 'S', word: 'System', desc: 'Automatisierte Employability-Dashboarding & Analytics' }
    ],
    ctaText: "DYD NEXUS für Akademien testen",
    ctaLink: "#contact"
  }
};

/* ─── Überarbeitete Plattform-Überblick Section ─── */

export function PlatformOverviewSection() {
  const [activeTab, setActiveTab] = useState<'enterprise' | 'education'>('enterprise');
  const { fadeUp, container } = useSectionAnims();

  const currentData = ACRONYM_DATA[activeTab];

  return (
    <section aria-labelledby="b2b-platform-title" className="relative bg-[#0A192F] py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Subtle Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#38BDF8]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header Badge & Title */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 border border-[#38BDF8]/30 bg-[#38BDF8]/5">
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
            <span className="font-arimo text-xs font-bold text-[#38BDF8] uppercase tracking-wide">
              Die Plattform-Architektur
            </span>
          </div>
          <h2 id="b2b-platform-title" className="font-poppins font-black text-3xl sm:text-5xl text-white mb-4" style={{ letterSpacing: '-0.03em' }}>
            Smartes Intelligence-Design.
          </h2>
          <p className="font-arimo text-white/60 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Wähle deine Perspektive, um zu sehen, wie DYD den Transfer von Skills in messbaren Erfolg übersetzt.
          </p>
        </motion.div>

        {/* Dynamic Dual-Tab Switcher */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('enterprise')}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-poppins font-bold text-sm transition-all duration-300 ${
                activeTab === 'enterprise'
                  ? 'bg-gradient-to-r from-[#38BDF8] to-[#2b7fd4] text-[#0A192F] shadow-lg shadow-[#38BDF8]/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Unternehmen (DYD ORBIT)</span>
            </button>
            <button
              onClick={() => setActiveTab('education')}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-poppins font-bold text-sm transition-all duration-300 ${
                activeTab === 'education'
                  ? 'bg-gradient-to-r from-[#DEFF9A] to-[#38BDF8] text-[#0A192F] shadow-lg shadow-[#DEFF9A]/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Bildungsträger (DYD NEXUS)</span>
            </button>
          </div>
        </div>

        {/* Active Sub-Banner */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-10"
        >
          <span className="font-arimo text-xs font-bold uppercase tracking-wider text-[#DEFF9A] mb-1 block">
            {currentData.badge}
          </span>
          <h3 className="font-poppins font-black text-2xl sm:text-3xl text-white tracking-tight">
            {currentData.brandName} <span className="text-white/40 font-normal text-lg sm:text-xl">({currentData.subline})</span>
          </h3>
          <p className="font-arimo text-white/50 text-sm sm:text-base mt-2 max-w-xl mx-auto">
            {currentData.description}
          </p>
        </motion.div>

        {/* Interactive Acronym Cards */}
        <motion.div 
          key={`cards-${activeTab}`}
          variants={container} 
          initial="hidden" 
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-12"
        >
          {currentData.letters.map((item) => (
            <motion.div
              key={item.letter}
              variants={fadeUp}
              className="group relative rounded-2xl p-5 border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-[#38BDF8]/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Big Glowing Letter */}
                <div className="font-poppins font-black text-4xl sm:text-5xl text-[#38BDF8] group-hover:text-[#DEFF9A] transition-colors mb-2">
                  {item.letter}
                </div>
                {/* Word */}
                <div className="font-poppins font-bold text-base text-white mb-2 tracking-wide">
                  {item.word}
                </div>
                {/* Description */}
                <p className="font-arimo text-xs text-white/50 group-hover:text-white/80 transition-colors leading-relaxed">
                  {item.desc}
                </p>
              </div>
              
              {/* Subtle Indicator Line */}
              <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
                <div className="w-0 group-hover:w-full h-full bg-gradient-to-r from-[#38BDF8] to-[#DEFF9A] transition-all duration-500" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Conversion CTA Footer */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="text-center">
          <a
            href={currentData.ctaLink}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-poppins font-bold text-base text-[#0A192F] transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#38BDF8]/20"
            style={{ background: 'linear-gradient(135deg, #DEFF9A 0%, #38BDF8 100%)' }}
          >
            <span>{currentData.ctaText}</span>
            <ArrowRight className="w-5 h-5" />
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