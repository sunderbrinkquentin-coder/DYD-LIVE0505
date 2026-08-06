import { motion } from 'framer-motion';
import { ArrowRight, Building2, GraduationCap, ShieldCheck, Award, Globe, Sparkles } from 'lucide-react';
import { b2bContent } from './content';

const trustIcons = [ShieldCheck, Award, GraduationCap, Globe];

type HeroTabId = 'unternehmen' | 'bildungstraeger';

export default function B2BHero({ onCtaClick }: { onCtaClick?: (tab: HeroTabId) => void }) {
  const { hero } = b2bContent;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden b2b-hero-bg pt-16 lg:pt-18">
      {/* Dot grid texture */}
      <div className="absolute inset-0 b2b-dot-grid pointer-events-none" />

      {/* Drifting glow blobs */}
      <div
        className="absolute top-[-10%] left-[15%] w-[420px] h-[420px] rounded-full pointer-events-none b2b-glow-blob"
        style={{
          background: 'radial-gradient(circle, rgba(56,189,248,0.20), transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute bottom-[-5%] right-[10%] w-[380px] h-[380px] rounded-full pointer-events-none b2b-glow-blob-2"
        style={{
          background: 'radial-gradient(circle, rgba(222,255,154,0.12), transparent 70%)',
          filter: 'blur(70px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
          style={{
            background: 'rgba(56,189,248,0.10)',
            border: '1px solid rgba(56,189,248,0.25)',
          }}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span
            className="text-xs font-arimo font-bold uppercase tracking-widest text-[#38BDF8]"
            style={{ letterSpacing: '0.12em' }}
          >
            {hero.eyebrow}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-poppins font-black text-white leading-[1.08] mb-6"
          style={{
            fontSize: 'clamp(2rem, 5.5vw, 3.75rem)',
            letterSpacing: '-0.03em',
          }}
        >
          {hero.headline}
        </motion.h1>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-arimo text-white/65 leading-relaxed mb-10 max-w-3xl mx-auto"
          style={{ fontSize: 'clamp(1rem, 1.8vw, 1.25rem)' }}
        >
          {hero.subline}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
        >
          <button
            onClick={() => onCtaClick?.('unternehmen')}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-arimo font-bold text-[#0A192F] b2b-focus-ring transition-all hover:shadow-xl hover:shadow-[#DEFF9A]/25 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)',
              borderRadius: '16px',
            }}
          >
            <Building2 className="w-4 h-4" />
            {hero.ctaPrimary}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => onCtaClick?.('bildungstraeger')}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-arimo font-bold text-white b2b-focus-ring transition-all hover:bg-white/10 hover:-translate-y-0.5"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '16px',
            }}
          >
            <GraduationCap className="w-4 h-4 text-[#38BDF8]" />
            {hero.ctaSecondary}
          </button>
        </motion.div>

        {/* Trust Chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-2.5 mb-10"
        >
          {hero.trustChips.map((chip, i) => {
            const Icon = trustIcons[i] ?? ShieldCheck;
            return (
              <div
                key={i}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                <Icon className="w-3.5 h-3.5 text-[#DEFF9A]" />
                <span className="text-xs font-arimo font-semibold text-white/70">{chip}</span>
              </div>
            );
          })}
        </motion.div>

        {/* Stat Chips */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-4"
        >
          {hero.statChips.map((stat, i) => (
            <div
              key={i}
              className="flex items-baseline gap-1.5 px-5 py-2.5 rounded-2xl"
              style={{
                background: 'rgba(56,189,248,0.06)',
                border: '1px solid rgba(56,189,248,0.15)',
              }}
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
      </div>
    </section>
  );
}
