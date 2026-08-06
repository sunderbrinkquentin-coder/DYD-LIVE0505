import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { Layers, Brain, ShieldCheck, Flag, Sparkles } from 'lucide-react';
import { b2bContent } from './content';
function useSectionAnims() {
  const reduce = useReducedMotion() ?? false;

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduce ? 0 : 0.1,
      },
    },
  };

// 1. Viewport-Konstante definieren (behebt VIEWPORT is not defined)
const VIEWPORT = { once: true, margin: '-50px' } as const;

// 2. Animations-Hook (falls useSectionAnims auch noch irgendwo fehlt)
function useSectionAnims() {
  const reduce = useReducedMotion() ?? false;
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.1 } },
  };
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 20 },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.5 } },
  };
  return { container, fadeUp, reduce };
}
}

// Zuordnung der Icon-Strings aus content.ts zu Lucide-Icon-Komponenten
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  layers: Layers,
  brain: Brain,
  shield: ShieldCheck,
  flag: Flag,
};

export function PlatformOverviewSection() {
  const { platformOverview } = b2bContent;
  const reduce = useReducedMotion() ?? false;

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduce ? 0 : 0.1,
      },
    },
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 20 },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.5 } },
  };

  return (
    <section className="relative py-24 bg-[#0A192F] overflow-hidden border-t border-white/5">
      {/* Background Micro-Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)',
          filter: 'blur(80px)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/20 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="text-xs font-arimo font-bold tracking-wider text-[#38BDF8] uppercase">
              DYD Standard
            </span>
          </div>
          
          <h2 className="font-poppins font-black text-white text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-6">
            {platformOverview.title}
          </h2>
          
          <p className="font-arimo text-lg text-white/70 leading-relaxed">
            {platformOverview.subtitle}
          </p>
        </div>

        {/* Feature Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {platformOverview.features.map((feature) => {
            const IconComponent = iconMap[feature.icon] || Layers;

            return (
              <motion.div
                key={feature.title} /* ✅ Hier stand vorher fehlerhaft brandName */
                variants={fadeUp}
                className="group relative p-8 rounded-2xl bg-white/[0.03] border border-white/10 transition-all duration-300 hover:bg-white/[0.06] hover:border-[#38BDF8]/30 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center mb-6 text-[#38BDF8] group-hover:scale-110 group-hover:bg-[#38BDF8]/20 transition-transform">
                  <IconComponent className="w-6 h-6" />
                </div>

                <h3 className="font-poppins font-bold text-xl text-white mb-3">
                  {feature.title} /* ✅ Geändert von brandName auf title */
                </h3>

                <p className="font-arimo text-white/65 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── 2. Vertrauen & Glaubwürdigkeit ─── */

type TrustSectionProps = {
  onContact?: () => void;
  onContactClick?: () => void;
};

export function TrustSection({ onContact, onContactClick }: TrustSectionProps) {
  const { trust } = b2bContent;
  const { fadeUp, fadeLeft, fadeRight, container } = useSectionAnims();
  const badgeIcons: Record<string, typeof Lock> = { DSGVO: Lock, ESCO: Layers, 'Made in Germany': Flag };

  const f = trust.founder as typeof trust.founder & { calendarUrl?: string };
  const handleContact = onContactClick ?? onContact ?? (() => { window.location.href = `mailto:${f.email}`; });

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

          {/* Gründer */}
          <motion.div variants={fadeRight} initial="hidden" whileInView="show" viewport={VIEWPORT} className="rounded-2xl bg-white border border-[#E3EBF5] overflow-hidden hover:shadow-lg transition-shadow">
            <div className="flex flex-col sm:flex-row">
              <div className="relative sm:w-44 flex-shrink-0 flex items-center justify-center p-6" style={{ background: 'linear-gradient(155deg, #0A192F 0%, #123059 55%, #2b7fd4 130%)' }}>
                <img
                  src={f.photoSrc}
                  alt={f.photoAlt}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover"
                  style={{ boxShadow: '0 12px 30px -8px rgba(0,0,0,0.55)', outline: '3px solid rgba(255,255,255,0.14)', outlineOffset: '0px' }}
                />
              </div>

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

/* ─── 3. Events Section ─── */

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