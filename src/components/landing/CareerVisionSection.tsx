import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, TrendingUp, BookOpen, Award, Sparkles, ArrowRight, Check, Map } from 'lucide-react';

const ACCENT = '#66c0b6';
const ACCENT2 = '#30E3CA';

const STEPS = [
  {
    icon: Target,
    title: 'Vision eingeben',
    sub: '2 Minuten',
    gradient: `from-[${ACCENT}] to-[${ACCENT2}]`,
    gradientStyle: { background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` },
    done: true,
  },
  {
    icon: TrendingUp,
    title: 'Skill-Gap-Analyse',
    sub: 'KI-gestützt & automatisch',
    gradient: 'from-blue-500 to-cyan-500',
    gradientStyle: { background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' },
    done: true,
  },
  {
    icon: Map,
    title: 'Lernpfad erhalten',
    sub: 'Personalisiert für dich',
    gradientStyle: { background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` },
    done: false,
    highlight: true,
  },
  {
    icon: Award,
    title: 'Zertifikat',
    sub: 'Nach Abschluss',
    gradientStyle: { background: 'linear-gradient(135deg,#f59e0b,#f97316)' },
    done: false,
  },
];

const FEATURES = [
  {
    icon: Target,
    title: 'Vision definieren',
    description: 'Beschreibe deine Zielposition – mit oder ohne CV startet die Analyse sofort.',
    colorStyle: { background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` },
    details: ['Mit oder ohne CV nutzbar', 'KI-gestützte Analyse', 'Skill-Gap Erkennung'],
  },
  {
    icon: TrendingUp,
    title: 'Gap-Analyse',
    description: 'Erfahre präzise, welche Skills dich von deinem Traumjob trennen.',
    colorStyle: { background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' },
    details: ['Automatische Skill-Extraktion', 'Impact-Priorisierung', 'Markt-Insights 2026'],
  },
  {
    icon: BookOpen,
    title: 'Lernpfad',
    description: 'Strukturierte Module mit konkretem Zeitplan und kuratierten Ressourcen.',
    colorStyle: { background: 'linear-gradient(135deg,#8b5cf6,#ec4899)' },
    details: ['Wöchentlicher Zeitplan', 'Kuratierte Inhalte', 'Fortschrittstracking'],
  },
  {
    icon: Award,
    title: 'Zertifikat',
    description: 'Offizieller Abschlussnachweis – direkt einsetzbar in Bewerbungen.',
    colorStyle: { background: 'linear-gradient(135deg,#f59e0b,#f97316)' },
    details: ['PDF-Download', 'LinkedIn-ready', 'Portfolio-Nachweis'],
  },
];

const BENEFITS = [
  'KI-gestützte Gap-Analyse',
  'Personalisierte Lernpfade',
  'Kuratierte Ressourcen',
  'Fortschrittstracking',
  'Professionelle Zertifikate',
  'Keine Vorerfahrung nötig',
];

export function CareerVisionSection() {
  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <section className="relative py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#0a0a1a] to-[#020617]" />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(102,192,182,0.18) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />
      {/* Ambient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-[0.07] pointer-events-none" style={{ background: `radial-gradient(circle, ${ACCENT2}, transparent)` }} />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-[0.06] pointer-events-none" style={{ background: `radial-gradient(circle, ${ACCENT}, transparent)` }} />

      <div className="container mx-auto px-4 relative z-10">

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: `rgba(102,192,182,0.08)`, border: `1px solid rgba(102,192,182,0.22)` }}>
            <Sparkles size={15} style={{ color: ACCENT }} />
            <span className="text-sm font-bold" style={{ color: ACCENT }}>Career Academy</span>
          </div>

          <h2 className="text-5xl md:text-6xl font-black text-white mb-5 leading-tight tracking-tight">
            Von der Vision zum
            <span className="block text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` }}>
              Traumjob
            </span>
          </h2>

          <p className="text-lg text-white/60 mb-10 leading-relaxed max-w-2xl mx-auto">
            Definiere deine Zielposition, erhalte eine KI-gestützte Skill-Gap-Analyse und starte
            deinen personalisierten Lernpfad — mit oder ohne CV.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              onClick={() => navigate('/career-vision')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group px-9 py-4 rounded-xl font-black text-base text-black flex items-center gap-3 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`, boxShadow: `0 8px 32px rgba(48,227,202,0.25)` }}
            >
              <Target size={20} />
              Vision analysieren
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </motion.button>

            <motion.button
              onClick={() => document.getElementById('prozess')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-9 py-4 rounded-xl font-semibold text-base text-white/80 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              Mehr erfahren
            </motion.button>
          </div>
        </motion.div>

        {/* ── Feature cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            const isHovered = hoveredFeature === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                className="relative rounded-2xl p-6 cursor-default overflow-hidden transition-all duration-300"
                style={{
                  background: isHovered ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                  border: isHovered ? `1px solid rgba(102,192,182,0.35)` : '1px solid rgba(255,255,255,0.09)',
                  boxShadow: isHovered ? `0 8px 32px rgba(48,227,202,0.08)` : 'none',
                }}
              >
                {/* Icon */}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={feature.colorStyle}>
                  <Icon size={20} className="text-black" />
                </div>

                <h3 className="text-base font-black text-white mb-1.5">{feature.title}</h3>
                <p className="text-sm text-white/55 leading-relaxed mb-4">{feature.description}</p>

                {/* Details — always visible, opacity transitions */}
                <div className="space-y-1.5" style={{ opacity: isHovered ? 1 : 0.45, transition: 'opacity 0.25s' }}>
                  {feature.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-white/60">
                      <Check size={12} style={{ color: ACCENT }} />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Funktioniert mit und ohne CV ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl p-10 lg:p-14"
          style={{ background: `linear-gradient(135deg, rgba(102,192,182,0.08), rgba(48,227,202,0.04), transparent)`, border: `1px solid rgba(102,192,182,0.18)` }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left */}
            <div className="space-y-6">
              <div>
                <h3 className="text-3xl font-black text-white mb-3">Funktioniert mit und ohne CV</h3>
                <p className="text-white/60 text-base leading-relaxed">
                  Hast du bereits einen CV? Perfekt — wir extrahieren deine Skills automatisch.
                  Noch keinen? Kein Problem: Die KI erstellt dir eine allgemeine Top-10-Skill-Liste
                  für deine Zielposition, die du direkt verwenden kannst.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {BENEFITS.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.06 }}
                    className="flex items-center gap-2.5"
                  >
                    <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: `rgba(48,227,202,0.15)`, border: `1px solid rgba(48,227,202,0.3)` }}>
                      <Check size={11} style={{ color: ACCENT2 }} />
                    </div>
                    <span className="text-sm text-white/75">{benefit}</span>
                  </motion.div>
                ))}
              </div>

              <motion.button
                onClick={() => navigate('/career-vision')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-black text-sm text-black"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`, boxShadow: `0 6px 24px rgba(48,227,202,0.2)` }}
              >
                <Sparkles size={15} />
                Jetzt kostenlos starten
                <ArrowRight size={15} />
              </motion.button>
            </div>

            {/* Right — process flow */}
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl blur-3xl opacity-15 pointer-events-none" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` }} />

              <div className="relative rounded-2xl p-7 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-xl transition-all"
                      style={{
                        background: step.highlight
                          ? `rgba(48,227,202,0.08)`
                          : step.done
                            ? 'rgba(255,255,255,0.04)'
                            : 'rgba(255,255,255,0.025)',
                        border: step.highlight
                          ? `1px solid rgba(48,227,202,0.28)`
                          : step.done
                            ? '1px solid rgba(255,255,255,0.08)'
                            : '1px solid rgba(255,255,255,0.05)',
                        opacity: !step.done && !step.highlight ? 0.6 : 1,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={step.gradientStyle}>
                          <Icon size={17} className={step.done || step.highlight ? 'text-black' : 'text-white'} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-tight">{step.title}</p>
                          <p className="text-xs text-white/45 mt-0.5">{step.sub}</p>
                        </div>
                      </div>
                      {step.done ? (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)' }}>
                          <Check size={12} className="text-green-400" />
                        </div>
                      ) : step.highlight ? (
                        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
                          <Sparkles size={16} style={{ color: ACCENT2 }} />
                        </motion.div>
                      ) : null}
                    </motion.div>
                  );
                })}

                <div className="pt-3 border-t border-white/[0.07]">
                  <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    100% KI-gestützt · Personalisiert · Professionell
                  </p>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
