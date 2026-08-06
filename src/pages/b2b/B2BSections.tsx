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

/* ─── Präsentations-Daten für ORBIT & NEXUS ─── */
const PRODUCT_SOLUTIONS = [
  {
    id: "orbit",
    categoryBadge: "B2B Enterprise HR & Personalentwicklung",
    categoryIcon: Building2,
    badgeColor: "#38BDF8",
    accentColor: "#DEFF9A",
    brandName: "DYD ORBIT",
    acronymList: [
      { letter: 'O', word: 'ptimized' },
      { letter: 'R', word: 'eskilling' },
      { letter: 'B', word: 'usiness' },
      { letter: 'I', word: 'ntelligence' },
      { letter: 'T', word: 'ool' },
    ],
    tagline: "Die prädikative Steuerungsplattform für KI-gestütztes Skill-Mapping & interne Mobilität.",
    highlights: [
      "Echtzeit Skill-Gap-Analytik nach ESCO-Standard",
      "Automatisierte Karriere- & Reskilling-Pfade",
      "Seamless Integration in SAP, Workday & Moodle"
    ],
    ctaText: "DYD ORBIT Demo anfragen",
    ctaLink: "#contact"
  },
  {
    id: "nexus",
    categoryBadge: "Bildungsträger & Akademien",
    categoryIcon: BookOpen,
    badgeColor: "#DEFF9A",
    accentColor: "#38BDF8",
    brandName: "DYD NEXUS",
    acronymList: [
      { letter: 'N', word: 'ext-Skill' },
      { letter: 'E', word: 'volution' },
      { letter: 'X', word: '-Learning' },
      { letter: 'U', word: 'niversal' },
      { letter: 'S', word: 'ystem' },
    ],
    tagline: "Die universelle Schnittstelle zur Standardisierung von Bildungsangeboten & Maximierung der Employability.",
    highlights: [
      "Lehrplan-Alignment mit der EU-ESCO Taxonomie",
      "Echtzeit-Abgleich von Kursinhalten mit dem Arbeitsmarkt",
      "Messbare Steigerung der Absolventen-Vermittlungsquote"
    ],
    ctaText: "DYD NEXUS für Akademien testen",
    ctaLink: "#contact"
  }
];

/* ─── High-End Plattform-Überblick Section ─── */

export function PlatformOverviewSection() {
  const { fadeUp, container } = useSectionAnims();

  return (
    <section aria-labelledby="b2b-platform-title" className="relative bg-[#0A192F] py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#38BDF8]/5 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[#DEFF9A]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header Title */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 border border-[#38BDF8]/30 bg-[#38BDF8]/5">
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
            <span className="font-arimo text-xs font-bold text-[#38BDF8] uppercase tracking-wider">
              Die DYD Produkt-Architektur
            </span>
          </div>
          <h2 id="b2b-platform-title" className="font-poppins font-black text-3xl sm:text-5xl text-white mb-4 tracking-tight">
            Echtzeit-Skill-Intelligence.
          </h2>
          <p className="font-arimo text-white/60 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Zwei spezialisierte Kernsysteme für maximale Wirksamkeit am Arbeitsmarkt und in der Unternehmensentwicklung.
          </p>
        </motion.div>

        {/* Die beiden Flaggschiff-Produkte im Überblick */}
        <motion.div 
          variants={container} 
          initial="hidden" 
          whileInView="show" 
          viewport={VIEWPORT} 
          className="grid lg:grid-cols-2 gap-8"
        >
          {PRODUCT_SOLUTIONS.map((product) => {
            const Icon = product.categoryIcon;
            return (
              <motion.div
                key={product.id}
                variants={fadeUp}
                className="group relative rounded-3xl p-8 sm:p-10 border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] backdrop-blur-md flex flex-col justify-between hover:border-[#38BDF8]/40 transition-all duration-500 hover:shadow-2xl hover:shadow-[#38BDF8]/10"
              >
                <div>
                  {/* Category Badge */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                      <Icon className="w-4 h-4" style={{ color: product.badgeColor }} />
                    </div>
                    <span className="font-arimo text-xs font-bold uppercase tracking-wider text-white/70">
                      {product.categoryBadge}
                    </span>
                  </div>

                  {/* MASSIVER PRODUKTNAME (ORBIT / NEXUS) */}
                  <h3 className="font-poppins font-black text-5xl sm:text-6xl text-white tracking-tight mb-3 group-hover:scale-[1.02] transition-transform origin-left">
                    {product.brandName}
                  </h3>

                  {/* DEZENTE AKRONYM-BEDEUTUNGEN DIREKT DARUNTER */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mb-6 text-sm sm:text-base font-poppins font-semibold">
                    {product.acronymList.map((item, idx) => (
                      <span key={item.word} className="inline-flex items-center">
                        <span style={{ color: product.accentColor }} className="font-black text-base sm:text-lg">
                          {item.letter}
                        </span>
                        <span className="text-white/60 font-medium">
                          {item.word}
                        </span>
                        {idx < product.acronymList.length - 1 && (
                          <span className="text-white/20 ml-2.5">•</span>
                        )}
                      </span>
                    ))}
                  </div>

                  {/* Tagline / Kurzbeschreibung */}
                  <p className="font-arimo text-white/70 text-sm sm:text-base mb-8 leading-relaxed">
                    {product.tagline}
                  </p>

                  {/* Bullet Highlights */}
                  <div className="space-y-3 mb-10 border-t border-white/10 pt-6">
                    {product.highlights.map((feat) => (
                      <div key={feat} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#38BDF8]" />
                        <span className="font-arimo text-xs sm:text-sm text-white/80 leading-snug">
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Call to Action Button */}
                <div>
                  <a
                    href={product.ctaLink}
                    className="inline-flex items-center justify-center gap-3 w-full py-4 rounded-xl font-poppins font-bold text-sm text-[#0A192F] transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${product.badgeColor}, ${product.accentColor})` }}
                  >
                    <span>{product.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>

                {/* Subtle Glow Indicator on Hover */}
                <div className="absolute inset-0 rounded-3xl border border-white/0 group-hover:border-[#38BDF8]/30 pointer-events-none transition-all duration-500" />
              </motion.div>
            );
          })}
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