import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ArrowRight, Building2, GraduationCap, ShieldCheck, Award, Globe, Sparkles } from 'lucide-react';
import { b2bContent } from './content';
import DydLogo from './DydLogo';

const trustIcons = [ShieldCheck, Award, GraduationCap, Globe];
const CTA_GRADIENT = 'linear-gradient(135deg, #DEFF9A, #38BDF8)';

type HeroTabId = 'unternehmen' | 'bildungstraeger';

export default function B2BHero({ onCtaClick }: { onCtaClick?: (tab: HeroTabId) => void }) {
  const { hero } = b2bContent;
  const reduce = useReducedMotion() ?? false;

  // Eine Animations-Definition für alle Blöcke: gestaffelter Fade-Up,
  // bei prefers-reduced-motion komplett neutralisiert.
  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduce ? 0 : 0.1,
        delayChildren: reduce ? 0 : 0.05,
      },
    },
  };
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 20 },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.6 } },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden b2b-hero-bg pt-16 lg:pt-[4.5rem]">
      {/* Dot-Grid-Textur */}
      <div className="absolute inset-0 b2b-dot-grid pointer-events-none" aria-hidden="true" />

      {/* Driftende Glow-Blobs (CSS sollte prefers-reduced-motion respektieren) */}
      <div
        className="absolute top-[-10%] left-[15%] w-[420px] h-[420px] rounded-full pointer-events-none b2b-glow-blob"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.20), transparent 70%)', filter: 'blur(60px)' }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-5%] right-[10%] w-[380px] h-[380px] rounded-full pointer-events-none b2b-glow-blob-2"
        style={{ background: 'radial-gradient(circle, rgba(222,255,154,0.12), transparent 70%)', filter: 'blur(70px)' }}
        aria-hidden="true"
      />

      {/* Content */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center"
      >
        {/* Prominentes, animiertes Logo */}
        <motion.div variants={fadeUp} className="flex justify-center mb-6">
          <div className="relative">
            {!reduce && (
              <motion.span
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ width: 190, height: 190, background: 'radial-gradient(circle, rgba(102,192,182,0.5), transparent 65%)' }}
                animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0.25, 0.6] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <motion.div
              animate={reduce ? {} : { y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              <DydLogo variant="gradient" className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-[0_8px_24px_rgba(102,192,182,0.35)]" />
            </motion.div>
          </div>
        </motion.div>

        {/* Eyebrow */}
        <motion.div
          variants={fadeUp}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
          style={{ background: 'rgba(56,189,248,0.10)', border: '1px solid rgba(56,189,248,0.25)' }}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
          <span
            className="text-xs font-arimo font-bold uppercase text-[#38BDF8]"
            style={{ letterSpacing: '0.12em' }}
          >
            {hero.eyebrow}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          className="font-poppins font-black text-white leading-[1.08] mb-6"
          style={{ fontSize: 'clamp(2rem, 5.5vw, 3.75rem)', letterSpacing: '-0.03em' }}
        >
          {hero.headline}
        </motion.h1>

        {/* Subline */}
        <motion.p
          variants={fadeUp}
          className="font-arimo text-white/65 leading-relaxed mb-10 max-w-3xl mx-auto"
          style={{ fontSize: 'clamp(1rem, 1.8vw, 1.25rem)' }}
        >
          {hero.subline}
        </motion.p>

        {/* CTA-Buttons */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
        >
          <button
            type="button"
            onClick={() => onCtaClick?.('unternehmen')}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-arimo font-bold text-[#0A192F] b2b-focus-ring transition hover:shadow-xl hover:shadow-[#DEFF9A]/25 hover:-translate-y-0.5"
            style={{ background: CTA_GRADIENT }}
          >
            <Building2 className="w-4 h-4" aria-hidden="true" />
            {hero.ctaPrimary}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onCtaClick?.('bildungstraeger')}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-arimo font-bold text-white b2b-focus-ring transition hover:bg-white/10 hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.18)' }}
          >
            <GraduationCap className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
            {hero.ctaSecondary}
          </button>
        </motion.div>

        {/* Trust-Chips */}
        <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2.5 mb-10">
          {hero.trustChips.map((chip, i) => {
            const Icon = trustIcons[i] ?? ShieldCheck;
            return (
              <div
                key={chip}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}
              >
                <Icon className="w-3.5 h-3.5 text-[#DEFF9A]" aria-hidden="true" />
                <span className="text-xs font-arimo font-semibold text-white/70">{chip}</span>
              </div>
            );
          })}
        </motion.div>

        {/* Stat-Chips */}
        <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
          {hero.statChips.map((stat) => (
            <div
              key={stat.label}
              className="flex items-baseline gap-1.5 px-5 py-2.5 rounded-2xl"
              style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)' }}
            >
              <span
                className="font-poppins font-black text-[#DEFF9A]"
                style={{ fontSize: '1.5rem', letterSpacing: '-0.02em' }}
              >
                {stat.value}
              </span>
              <span className="text-xs font-arimo font-semibold text-white/50">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}