import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle,
  Zap,
  Shield,
  FileText,
  TrendingUp,
  Users,
  Award,
  Smartphone,
  ChevronDown,
  ArrowRight,
  Target,
  Brain,
  Rocket,
  Star,
  Check,
  X,
  Music,
  Heart,
  Calendar,
  MapPin,
  Headphones,
  Briefcase,
  Building2,
  GraduationCap,
  Globe,
  Lightbulb,
  Clock,
  Building,
  Handshake,
  Mic,
  Mail,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CareerVisionSection } from '../components/landing/CareerVisionSection';
import { AboutSection } from '../components/landing/AboutSection';
import { ProcessTimeline } from '../components/landing/ProcessTimeline';
import FestivalPopup from '../components/FestivalPopup';

const FESTIVAL_SECTIONS = [
  { label: 'Programm',   anchor: 'programm',  emoji: '🎶' },
  { label: 'Tickets',    anchor: 'tickets',   emoji: '🎟️' },
  { label: 'Ticket gegen Hilfe',  anchor: 'crew',      emoji: '🤝' },
  { label: 'Sponsoren',  anchor: 'sponsoren', emoji: '🏢' },
  { label: 'Rahmendaten', anchor: 'hardfacts', emoji: '📍' },
] as const;

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [festivalOpen, setFestivalOpen] = useState(false);
  const { scrollYProgress } = useScroll();

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  // Handle pricing button clicks for optimization packages
  const handleOptimizationClick = (plan: 'single' | 'bundle-5' | 'bundle-10' = 'single') => {
    if (!user) {
      const redirectTarget = encodeURIComponent(`/dashboard?action=buy-tokens&plan=${plan}`);
      navigate(`/login?redirect=${redirectTarget}&action=buy-tokens`);
      return;
    }

    navigate(`/dashboard?action=buy-tokens&plan=${plan}`);
  };

  // Dynamisches Background-Logo mit mehr Sichtbarkeit
  const logoOpacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.5, 0.8, 1],
    [0.08, 0.12, 0.15, 0.1, 0.08]
  );
  const logoScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.2, 1.6, 1.3]);
  const logoRotate = useTransform(scrollYProgress, [0, 1], [-3, 8]);
  const logoY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const logoX = useTransform(scrollYProgress, [0, 1], [0, -50]);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050507] via-[#0a0a0f] to-[#050507] text-white relative overflow-hidden">
      <FestivalPopup />
      {/* Dynamisches Background Logo - mehrere Ebenen mit innovativen Effekten */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Hauptlogo - subtil und elegant */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: logoOpacity }}
        >
          <motion.img
            src="/DYD Logo RGB copy copy.svg"
            alt=""
            className="w-[120vw] sm:w-[900px] h-auto opacity-20 blur-2xl"
            style={{
              scale: logoScale,
              rotate: logoRotate,
              y: logoY,
              x: logoX,
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </motion.div>

        {/* Zweites Logo - dynamischer Effekt mit Parallax */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: useTransform(
              scrollYProgress,
              [0, 0.3, 0.6, 1],
              [0.03, 0.08, 0.12, 0.06]
            ),
          }}
        >
          <motion.img
            src="/DYD Logo RGB copy copy.svg"
            alt=""
            className="w-[80vw] sm:w-[700px] h-auto opacity-15 blur-xl"
            style={{
              scale: useTransform(scrollYProgress, [0, 1], [1.3, 1.9]),
              rotate: useTransform(scrollYProgress, [0, 1], [5, -8]),
              x: useTransform(scrollYProgress, [0, 1], [-60, 100]),
              y: useTransform(scrollYProgress, [0, 1], [0, -80]),
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </motion.div>

        {/* Drittes Logo - gegenläufige Bewegung */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: useTransform(
              scrollYProgress,
              [0, 0.4, 0.8, 1],
              [0.04, 0.06, 0.09, 0.04]
            ),
          }}
        >
          <motion.img
            src="/DYD Logo RGB copy copy.svg"
            alt=""
            className="w-[60vw] sm:w-[500px] h-auto opacity-25 blur-lg"
            style={{
              scale: useTransform(scrollYProgress, [0, 1], [1.6, 1.2]),
              rotate: useTransform(scrollYProgress, [0, 1], [-10, 12]),
              x: useTransform(scrollYProgress, [0, 1], [80, -120]),
              y: useTransform(scrollYProgress, [0, 1], [40, 120]),
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </motion.div>

        {/* Animierte Partikel-Effekte */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#66c0b6] rounded-full"
            style={{
              left: `${(i * 7 + 10) % 100}%`,
              top: `${(i * 13 + 20) % 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.sin(i) * 20, 0],
              opacity: [0.1, 0.4, 0.1],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.2,
            }}
          />
        ))}

        {/* Gradient Overlays mit Puls-Effekt */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050507]/85 via-transparent to-[#050507]/90"></div>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#66c0b6]/8 via-[#30E3CA]/5 to-[#2d5365]/8"
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        ></motion.div>

        {/* Radial Gradient für Tiefe */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(102,192,182,0.06),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(45,83,101,0.08),transparent_50%)]"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10">
        {/* Navigation */}
<nav className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <motion.div
                className="flex items-center gap-3 cursor-pointer"
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <motion.img
                  src="/DYD Logo RGB copy copy.svg"
                  alt="DYD Logo"
                  className="h-10 w-auto opacity-90 drop-shadow-lg"
                  animate={{
                    filter: [
                      'drop-shadow(0 0 8px rgba(102,192,182,0.3))',
                      'drop-shadow(0 0 12px rgba(102,192,182,0.5))',
                      'drop-shadow(0 0 8px rgba(102,192,182,0.3))',
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </motion.div>

              <div className="hidden md:flex items-center gap-6">
                <motion.button
                  type="button"
                  onClick={() => scrollToId('prozess')}
                  className="text-white/70 hover:text-white transition-colors"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  So funktioniert&apos;s
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => scrollToId('preise')}
                  className="text-white/70 hover:text-white transition-colors"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Preise
                </motion.button>

                {/* ── FESTIVAL MIT HOVER-DROPDOWN ── */}
                <div
                  className="relative"
                  onMouseEnter={() => setFestivalOpen(true)}
                  onMouseLeave={() => setFestivalOpen(false)}
                >
                  <motion.button
                    type="button"
                    onClick={() => navigate('/festival')}
                    className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Festival
                    <motion.svg
                      width="12" height="12" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round"
                      animate={{ rotate: festivalOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </motion.svg>
                  </motion.button>

                  <AnimatePresence>
                    {festivalOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52 rounded-2xl overflow-hidden"
                        style={{
                          background: 'rgba(8,12,16,0.97)',
                          border: '1px solid rgba(0,212,212,0.18)',
                          boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 40px rgba(0,212,212,0.08)',
                          backdropFilter: 'blur(20px)',
                        }}
                      >
                        <div style={{ height: '2px', background: 'linear-gradient(to right, transparent, rgba(0,212,212,0.7), transparent)' }} />

                        <button
                          type="button"
                          onClick={() => navigate('/festival')}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                          style={{ borderBottom: '1px solid rgba(0,212,212,0.08)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,212,0.06)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ fontSize: '15px' }}>🎪</span>
                          <div>
                            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 700, color: '#00d4d4' }}>
                              Zum Festival
                            </div>
                            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: 'rgba(0,212,212,0.45)', marginTop: '1px' }}>
                              22. August 2026 · Düsseldorf
                            </div>
                          </div>
                        </button>

                        <div className="py-1">
                          {FESTIVAL_SECTIONS.map((section) => (
                            <button
                              key={section.anchor}
                              type="button"
                              onClick={() => {
                                navigate(`/festival#${section.anchor}`);
                                setTimeout(() => {
                                  const el = document.getElementById(section.anchor);
                                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }, 100);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <span style={{ fontSize: '14px', flexShrink: 0 }}>{section.emoji}</span>
                              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: 'rgba(200,240,240,0.75)' }}>
                                {section.label}
                              </span>
                            </button>
                          ))}
                        </div>

                        <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(0,212,212,0.2), transparent)' }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* ── ENDE FESTIVAL DROPDOWN ── */}

                <motion.button
                  onClick={() => navigate(user ? '/dashboard' : '/login')}
                  className="text-white/70 hover:text-white transition-colors"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {user ? 'Dashboard' : 'Login'}
                </motion.button>

                <motion.button
                  onClick={() => navigate('/cv-check')}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-semibold shadow-lg shadow-[#66c0b6]/20 relative overflow-hidden group"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></span>
                  <span className="relative">Jetzt starten</span>
                </motion.button>
              </div>

              <button
                onClick={() => navigate('/login?redirect=/dashboard')}
                className="md:hidden px-4 py-2 rounded-lg bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-semibold text-sm"
              >
                Login
              </button>
            </div>
          </div>
        </nav>
        <main id="main-content" aria-label="DYD Hauptinhalt – KI-Lebenslauf-Optimierung für Deutschland">

        {/* Hero Section */}
        <section
          className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8"
          aria-label="Hero – KI-Lebenslauf-Optimierung"
          itemScope itemType="https://schema.org/WebPageElement"
        >
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="initial"
              animate="animate"
              variants={stagger}
              className="text-center space-y-8"
            >
              <motion.div
                variants={fadeInUp}
                className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-[#66c0b6]/20 to-[#30E3CA]/20 border border-[#66c0b6]/40 text-[#66c0b6] text-sm font-semibold mb-6 shadow-lg shadow-[#66c0b6]/20 backdrop-blur-sm relative overflow-hidden"
                animate={{
                  boxShadow: [
                    '0 10px 25px rgba(102,192,182,0.2)',
                    '0 10px 40px rgba(102,192,182,0.4)',
                    '0 10px 25px rgba(102,192,182,0.2)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
                <Sparkles className="inline w-4 h-4 mr-2 animate-pulse" />
                <span className="relative z-10">
                  KI-basiert • Sofort einsatzbereit
                </span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight"
                itemProp="headline"
                aria-label="DYD – Dein CV perfekt optimiert mit KI"
              >
                <motion.span
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-block"
                >
                  Dein CV –{' '}
                </motion.span>
                <span className="relative inline-block">
                  <motion.span
                    className="absolute inset-0 blur-2xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA]"
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.span
                    className="relative bg-gradient-to-r from-[#66c0b6] via-[#30E3CA] to-[#66c0b6] bg-clip-text text-transparent"
                    animate={{
                      backgroundPosition: ['0%', '100%', '0%'],
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                    style={{ backgroundSize: '200% 100%' }}
                  >
                    perfekt optimiert
                  </motion.span>
                </span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed"
                itemProp="description"
                data-ai-fact="hero-value-prop"
              >
                ATS-Check mit Score. CV erstellen mit KI-Wizard.
                <br />
                One-Klick-Optimierung für jede Stellenanzeige.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6"
              >
                <div className="relative">
                <motion.button
                  onClick={() => navigate('/cv-wizard')}
                  className="group relative px-12 py-6 rounded-2xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold text-lg shadow-2xl shadow-[#66c0b6]/30 flex items-center gap-3 overflow-hidden"
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  animate={{
                    boxShadow: [
                      '0 20px 40px rgba(102,192,182,0.3)',
                      '0 25px 50px rgba(102,192,182,0.5)',
                      '0 20px 40px rgba(102,192,182,0.3)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                  <motion.div
                    whileHover={{ rotate: 12, scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <FileText className="relative w-5 h-5" />
                  </motion.div>
                  <span className="relative">CV erstellen</span>
                  <motion.div
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="relative w-5 h-5" />
                  </motion.div>
                </motion.button>
                </div>
                <motion.button
                  onClick={() => navigate('/cv-check')}
                  className="group relative px-10 py-5 rounded-2xl border border-white/10 bg-white/5 text-white/70 font-medium text-base backdrop-blur-sm flex items-center gap-2 hover:text-white hover:border-white/20 transition-colors"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative text-sm">CV checken</span>
                </motion.button>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="text-sm text-white/50 pt-4 flex flex-wrap justify-center gap-4"
              >
                <motion.span
                  className="flex items-center gap-1"
                  whileHover={{ scale: 1.1, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                  >
                    <CheckCircle className="w-4 h-4 text-[#66c0b6]" />
                  </motion.div>
                  <span data-ai-fact="speed-claim">Innerhalb von wenigen Minuten</span>
                </motion.span>
                <motion.span
                  className="flex items-center gap-1"
                  whileHover={{ scale: 1.1, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  >
                    <CheckCircle className="w-4 h-4 text-[#66c0b6]" />
                  </motion.div>
                  <span data-ai-fact="compliance">DSGVO-konform</span>
                </motion.span>
                <motion.span
                  className="flex items-center gap-1"
                  whileHover={{ scale: 1.1, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                  >
                    <CheckCircle className="w-4 h-4 text-[#66c0b6]" />
                  </motion.div>
                  <span>Perfekt fürs Handy optimiert</span>
                </motion.span>
                <motion.span
                  className="flex items-center gap-1"
                  whileHover={{ scale: 1.1, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}
                  >
                    <CheckCircle className="w-4 h-4 text-[#66c0b6]" />
                  </motion.div>
                  <span data-ai-fact="ats-optimized">ATS-optimiert</span>
                </motion.span>
                <motion.span
                  className="flex items-center gap-1"
                  whileHover={{ scale: 1.1, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
                  >
                    <Handshake className="w-4 h-4 text-[#66c0b6]" />
                  </motion.div>
                  <span data-ai-fact="partnership" title="DYD ist offizieller Kooperationspartner der Carl Remigius Fresenius Education AG">Kooperationspartner Carl Remigius Fresenius Education AG</span>
                </motion.span>
              </motion.div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
              className="flex justify-center mt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              <motion.div
                className="flex flex-col items-center gap-2 cursor-pointer"
                onClick={() => scrollToId('features')}
                whileHover={{ scale: 1.1 }}
              >
                <span className="text-xs text-white/40 font-medium tracking-wider">
                  SCROLL
                </span>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ChevronDown className="w-6 h-6 text-[#66c0b6]" />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Process Section - So funktioniert's */}
        <ProcessTimeline />

        {/* Features Section */}
        <section
          id="features"
          className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 relative"
          aria-label="DYD Funktionen – KI-CV-Check, Wizard, ATS-Optimierung"
          itemScope itemType="https://schema.org/ItemList"
        >
          {/* Animated background elements */}
          <motion.div
            className="absolute top-20 left-10 w-2 h-2 bg-[#66c0b6] rounded-full"
            animate={{
              scale: [1, 2, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-40 right-20 w-3 h-3 bg-[#30E3CA] rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.4, 0.9, 0.4],
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          />
          <motion.div
            className="absolute bottom-20 left-1/4 w-2 h-2 bg-[#66c0b6] rounded-full"
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{ duration: 5, repeat: Infinity, delay: 2 }}
          />

          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <motion.h2
                className="text-4xl md:text-6xl font-bold mb-4"
                whileInView={{ scale: [0.9, 1] }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <motion.span
                  className="inline-block"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                >
                  Alles,
                </motion.span>{' '}
                <motion.span
                  className="inline-block"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                >
                  was
                </motion.span>{' '}
                <motion.span
                  className="inline-block"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                >
                  du
                </motion.span>{' '}
                <motion.span
                  className="inline-block bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] bg-clip-text text-transparent"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                >
                  brauchst
                </motion.span>
              </motion.h2>
              <motion.div
                className="text-xl text-white/70"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                Professionell, KI-gestützt und sofort einsatzbereit
              </motion.div>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Sparkles,
                  title: 'Kostenloser CV-Check',
                  description:
                    'Erhalte sofort einen detaillierten ATS-Score und konkrete Verbesserungsvorschläge – komplett kostenlos.',
                },
                {
                  icon: Brain,
                  title: 'KI-basierte Analyse',
                  description:
                    'Unsere KI analysiert deinen CV nach 50+ Kriterien und vergleicht ihn mit erfolgreichen Bewerbungen.',
                },
                {
                  icon: Target,
                  title: 'ATS-Kompatibilität',
                  description:
                    'Erfahre genau, wie gut dein CV von Bewerbungssystemen gelesen wird und was du verbessern kannst.',
                },
                {
                  icon: FileText,
                  title: 'CV-Erstellung mit Wizard',
                  description:
                    'Erstelle in 10 Minuten einen professionellen CV mit unserem intelligenten Schritt-für-Schritt Wizard.',
                },
                {
                  icon: Zap,
                  title: 'One-Klick Optimierung',
                  description:
                    'Optimiere deinen CV automatisch für jede Stellenanzeige – perfekt angepasst in Sekunden.',
                },
                {
                  icon: Smartphone,
                  title: 'Mobil perfekt',
                  description:
                    'Alle Funktionen optimiert für Smartphone, Tablet und Desktop – überall und jederzeit nutzbar.',
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -8 }}
                  className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 cursor-pointer overflow-hidden"
                >
                  <motion.div className="absolute inset-0 bg-gradient-to-br from-[#66c0b6]/5 to-[#30E3CA]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <motion.div
                    className="absolute top-0 right-0 w-32 h-32 bg-[#66c0b6]/10 rounded-full blur-3xl"
                    whileHover={{ scale: 1.5, rotate: 45 }}
                    transition={{ duration: 0.7 }}
                  />
                  <motion.div
                    className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#30E3CA]/5 rounded-full blur-2xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 90, 0],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <div className="relative z-10">
                    <motion.div
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#66c0b6]/30 to-[#30E3CA]/30 flex items-center justify-center mb-6 shadow-lg shadow-[#66c0b6]/20"
                      whileHover={{ scale: 1.15, rotate: 12 }}
                      animate={{
                        boxShadow: [
                          '0 10px 25px rgba(102,192,182,0.2)',
                          '0 15px 35px rgba(102,192,182,0.4)',
                          '0 10px 25px rgba(102,192,182,0.2)',
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: index * 0.2,
                        }}
                      >
                        <feature.icon className="w-8 h-8 text-[#66c0b6]" />
                      </motion.div>
                    </motion.div>
                    <motion.h3
                      className="text-xl font-bold mb-3 group-hover:text-[#66c0b6] transition-colors"
                      whileHover={{ x: 5 }}
                      itemProp="name"
                    >
                      {feature.title}
                    </motion.h3>
                    <p className="text-white/70 leading-relaxed group-hover:text-white/90 transition-colors"
                      itemProp="description">
                      {feature.description}
                    </p>
                  </div>
                  <motion.div
                    className="absolute inset-0 border-2 border-[#66c0b6]/0 group-hover:border-[#66c0b6]/50 rounded-3xl transition-all duration-300"
                    whileHover={{
                      boxShadow: '0 0 30px rgba(102,192,182,0.3)',
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <AboutSection />

        {/* Pricing Section */}
        <section
          id="preise"
          className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-white/5 to-transparent relative overflow-hidden"
          aria-label="CV-Optimierung Preise – ab 5 Euro, kein Abo"
          itemScope itemType="https://schema.org/OfferCatalog"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#66c0b6]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[#30E3CA]/5 rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            {/* CV Optimization Packages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-16 sm:mt-20"
            >
              <div className="text-center mb-8 sm:mb-12">
                <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-400 text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  Pay-per-Use Optimierungen
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4"
                  itemProp="name"
                  aria-label="CV-Optimierung Pakete: Einsteiger 5 €, Bestseller 20 €, Karriere-Paket 30 €">
                  CV-Optimierung Pakete
                </h2>
                <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto">
                  Einmalige Optimierungen ohne Abo – perfekt für gezieltes
                  Bewerbungs-Tuning
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                {/* Einsteiger */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="relative bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-6 sm:p-8 overflow-hidden group"
                >
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-bold">
                    Einsteiger
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="relative z-10">
                    <div className="mb-6 sm:mb-8">
                      <div className="text-3xl sm:text-4xl font-bold mb-2">
                        1 Optimierung
                      </div>
                      <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2"
                        data-ai-fact="price-single" itemProp="price" content="5" aria-label="Einmalige CV-Optimierung für 5 Euro">
                        5 €
                      </div>
                      <p className="text-xs sm:text-sm text-white/60">5 €/CV</p>
                    </div>

                    <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                      {[
                        '1× CV-Optimierung',
                        'PDF-Download',
                        'Sofort verfügbar',
                        'Alle 3 Premium-Layouts',
                        'STAR-Bullets & Keywords',
                        'Dashboard-Zugang',
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-cyan-500/30 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-cyan-400" />
                          </div>
                          <span className="text-sm sm:text-base text-white/80">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleOptimizationClick('single')}
                      className="w-full py-3 sm:py-4 rounded-xl border-2 border-cyan-500/40 text-cyan-400 font-semibold hover:bg-cyan-500/10 transition-all text-sm sm:text-base"
                    >
                      Jetzt starten
                    </button>
                  </div>
                </motion.div>

                {/* Beliebteste Wahl */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.05, y: -8 }}
                  className="relative bg-gradient-to-br from-[#66c0b6]/20 to-[#30E3CA]/20 backdrop-blur-xl border-2 border-[#66c0b6] rounded-3xl p-6 sm:p-8 overflow-hidden group shadow-xl shadow-[#66c0b6]/30"
                >
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold shadow-lg flex items-center gap-1">
                    <Star className="w-3 h-3 fill-black" />
                    BESTSELLER
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#66c0b6]/10 to-[#30E3CA]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="relative z-10">
                    <div className="mb-6 sm:mb-8">
                      <div className="text-3xl sm:text-4xl font-bold mb-2">
                        5 Optimierungen
                      </div>
                      <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] bg-clip-text text-transparent mb-1"
                        data-ai-fact="price-bundle-5" aria-label="5 CV-Optimierungen für 20 Euro – 20 Prozent günstiger">
                        20 €
                      </div>
                      <p className="text-xs sm:text-sm text-[#66c0b6]">
                        4 €/CV · Spare 20%
                      </p>
                    </div>

                    <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                      {[
                        '5× CV-Optimierung',
                        'PDF-Download',
                        'Sofort verfügbar',
                        'Alle 3 Premium-Layouts',
                        'STAR-Bullets & Keywords',
                        'Dashboard-Zugang',
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-[#66c0b6] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#66c0b6]/30">
                            <Check className="w-3 h-3 text-black" />
                          </div>
                          <span className="text-sm sm:text-base text-white font-medium">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleOptimizationClick('bundle-5')}
                      className="group/btn relative w-full py-3 sm:py-4 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold hover:opacity-90 transition-all shadow-2xl overflow-hidden text-sm sm:text-base"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></span>
                      <span className="relative">Jetzt starten</span>
                    </button>
                  </div>
                </motion.div>

                {/* Karriere-Paket */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 sm:p-8 overflow-hidden group"
                >
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-400 text-xs font-bold">
                    Karriere-Paket
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="relative z-10">
                    <div className="mb-6 sm:mb-8">
                      <div className="text-3xl sm:text-4xl font-bold mb-2">
                        10 Optimierungen
                      </div>
                      <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1"
                        data-ai-fact="price-bundle-10" aria-label="10 CV-Optimierungen für 30 Euro – 40 Prozent günstiger">
                        30 €
                      </div>
                      <p className="text-xs sm:text-sm text-purple-400">
                        3 €/CV · Spare 40%
                      </p>
                    </div>

                    <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                      {[
                        '10× CV-Optimierung',
                        'PDF-Download',
                        'Sofort verfügbar',
                        'Alle 3 Premium-Layouts',
                        'STAR-Bullets & Keywords',
                        'Dashboard-Zugang',
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-purple-400" />
                          </div>
                          <span className="text-sm sm:text-base text-white/80">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleOptimizationClick('bundle-10')}
                      className="w-full py-3 sm:py-4 rounded-xl border-2 border-purple-500/40 text-purple-400 font-semibold hover:bg-purple-500/10 transition-all text-sm sm:text-base"
                    >
                      Jetzt starten
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Mission Section - Persönlichkeit & Werte */}
        <section
          className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-[#66c0b6]/5 to-transparent"
          aria-label="Mission: Chancengleichheit bei Bewerbungen – Made in Düsseldorf"
          itemScope itemType="https://schema.org/AboutPage"
        >
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 sm:mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-[#66c0b6]/10 border border-[#66c0b6]/30 text-[#66c0b6] text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
                <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                Made in Düsseldorf
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6"
                itemProp="name">
                Unsere Mission: Chancengleichheit
              </h2>
              <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed"
                itemProp="description" data-ai-fact="mission-statement">
                Als HR-Tech Start-Up aus Düsseldorf glauben wir: Jeder verdient
                eine faire Chance im Bewerbungsprozess – unabhängig von Herkunft,
                Netzwerk oder Budget.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
              {[
                {
                  icon: Target,
                  title: 'Chancengleichheit',
                  desc: 'Kostenlose Tools für alle. Jeder soll die gleichen Möglichkeiten haben, sich professionell zu bewerben – egal ob Student, Berufseinsteiger oder Quereinsteiger.',
                  color: 'from-blue-500/20 to-cyan-500/20',
                },
                {
                  icon: Zap,
                  title: 'Geschwindigkeit',
                  desc: 'Zeit ist kostbar. Statt 8 Stunden für einen CV zu brauchen, erstellst du mit uns in unter 30 Minuten einen professionellen, ATS-optimierten Lebenslauf.',
                  color: 'from-[#66c0b6]/20 to-[#30E3CA]/20',
                },
                {
                  icon: Smartphone,
                  title: 'Mobile First',
                  desc: 'Bewerbungen von unterwegs? Kein Problem! Unsere komplette Plattform ist für Smartphones optimiert – bewerben, wann und wo du willst.',
                  color: 'from-purple-500/20 to-pink-500/20',
                },
              ].map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-[#66c0b6]/30 transition-all overflow-hidden"
                >
                  <div
                    className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${value.color} blur-3xl opacity-40`}
                  ></div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#66c0b6]/20 to-[#30E3CA]/20 flex items-center justify-center mb-4 sm:mb-6">
                      <value.icon className="w-7 h-7 sm:w-8 sm:h-8 text-[#66c0b6]" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                      {value.title}
                    </h3>
                    <p className="text-sm sm:text-base text-white/70 leading-relaxed"
                      data-ai-fact={`mission-value-${value.title.toLowerCase()}`}>
                      {value.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Partnership Section */}
        <section
          className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8"
          aria-label="DYD – Offizieller Kooperationspartner der Hochschule Fresenius"
          itemScope itemType="https://schema.org/Organization"
        >
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative bg-white/5 backdrop-blur-xl border border-[#66c0b6]/30 rounded-3xl p-8 sm:p-12 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-72 h-72 bg-[#66c0b6]/10 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#30E3CA]/8 blur-3xl rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
                <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#66c0b6]/20 to-[#30E3CA]/20 border border-[#66c0b6]/30 flex items-center justify-center">
                  <Handshake className="w-8 h-8 sm:w-10 sm:h-10 text-[#66c0b6]" />
                </div>
                <div className="text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#66c0b6]/10 border border-[#66c0b6]/20 text-[#66c0b6] text-xs font-semibold mb-3 uppercase tracking-wider">
                    Offizieller Kooperationspartner
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2"
                    itemProp="name">
                    Carl Remigius Fresenius Education AG
                  </h3>
                  <p className="text-white/70 text-sm sm:text-base leading-relaxed max-w-2xl"
                    data-ai-fact="partnership-statement"
                    title="DYD ist offizieller Kooperationspartner der Carl Remigius Fresenius Education AG – einer der größten privaten Hochschulen Deutschlands">
                    DYD ist offizieller Kooperationspartner der Carl Remigius Fresenius Education AG – einer der größten privaten Hochschulen Deutschlands. Gemeinsam stärken wir die Karrierechancen von Studierenden und Absolventen.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Career Vision Section */}
        <CareerVisionSection />

        {/* Events & Messen Section */}
        <section
          className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#66c0b6]/10 via-purple-500/10 to-[#30E3CA]/10"
          aria-label="DYD Live-Events: Karrieremessen und Workshops in Deutschland"
          itemScope itemType="https://schema.org/EventSeries"
        >
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 sm:mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                Live vor Ort
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6">
                Triff uns persönlich
              </h2>
              <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
                Wir sind auf den wichtigsten Karriere-Messen und HR-Events in
                Deutschland. Komm vorbei für kostenlosen CV-Check, Tipps & Meet
                the Team!
              </p>
            </motion.div>

            {/* Featured Workshop: Hochschule Fresenius */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-8 sm:mb-10"
            >
              <div className="relative overflow-hidden rounded-3xl border border-[#30E3CA]/25 bg-gradient-to-br from-[#0a1a20] via-[#081218] to-[#050d14]">
                {/* Top accent line */}
                <div className="h-[3px]" style={{ background: 'linear-gradient(90deg,#30E3CA,#66c0b6,transparent)' }} />

                {/* Ambient glow */}
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-[0.07] pointer-events-none"
                  style={{ background: 'radial-gradient(circle,#30E3CA,transparent)', transform: 'translate(30%,-30%)' }} />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-[0.04] pointer-events-none"
                  style={{ background: 'radial-gradient(circle,#f59e0b,transparent)', transform: 'translate(-30%,30%)' }} />

                <div className="relative z-10 flex flex-col lg:flex-row gap-0">
                  {/* Left: content */}
                  <div className="flex-1 p-6 sm:p-8 lg:p-10 space-y-5">
                    {/* Badge row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest text-amber-300 border border-amber-400/30"
                        style={{ background: 'rgba(245,158,11,0.10)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        28. Mai 2026
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest text-[#30E3CA] border border-[#30E3CA]/25"
                        style={{ background: 'rgba(48,227,202,0.07)' }}>
                        Exklusiv · ~50 Teilnehmer
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-[#30E3CA]/60 mb-2">Workshop · Hochschule Fresenius</p>
                      <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight"
                        itemProp="name"
                        data-ai-fact="workshop-title"
                        title="Workshop am 28. Mai 2026 an der Hochschule Fresenius: KI-gestützte CV-Optimierung, ATS, Personal Branding">
                        Beyond the Template:<br />
                        <span className="text-[#30E3CA]">Dein CV-Boost</span> im KI-Zeitalter
                      </h3>
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-[#66c0b6] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-white">28. Mai 2026</p>
                          <p className="text-xs text-white/50">Mega Event der Hochschule Fresenius</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Users className="w-4 h-4 text-[#66c0b6] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-white">~50 der besten Studierenden</p>
                          <p className="text-xs text-white/50">Exklusiver Workshop für Top-Talente</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-4 h-4 text-[#66c0b6] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-white">KI-gestützte CV-Optimierung live</p>
                          <p className="text-xs text-white/50">ATS, Storytelling & Personal Branding im KI-Zeitalter</p>
                        </div>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#30E3CA]/30 text-sm font-bold text-[#30E3CA]"
                      style={{ background: 'rgba(48,227,202,0.08)' }}>
                      <GraduationCap className="w-4 h-4" />
                      Workshop: KI &amp; CV-Optimierung
                    </div>
                  </div>

                  {/* Right: lineup image */}
                  <div className="lg:w-[320px] flex-shrink-0 flex items-end justify-center lg:justify-end overflow-hidden">
                    <img
                      src="/public-static/Workshop_LineUP_Quentin.png"
                      alt="Workshop Lineup – Quentin Sunderbrink"
                      className="w-full max-w-[280px] lg:max-w-none lg:w-[320px] object-contain object-bottom rounded-b-3xl lg:rounded-none lg:rounded-br-3xl"
                      style={{ maxHeight: '380px' }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {[
                {
                  name: 'Azubi2B Stuttgart',
                  date: '23.11.2025',
                  location: 'Stuttgart',
                  type: 'Karrieremesse',
                  booth: 'Standinfo folgt',
                  highlight: 'Live CV-Checks',
                  icon: Briefcase,
                  color: 'from-blue-500/20 to-cyan-500/20',
                },
                {
                  name: 'Absolventenkongress Köln',
                  date: '27.-28.11.2025',
                  location: 'Köln',
                  type: 'Studien- & Karrieremesse',
                  booth: 'Standinfo folgt',
                  highlight: 'Workshop: ATS-Optimierung',
                  icon: GraduationCap,
                  color: 'from-[#66c0b6]/20 to-[#30E3CA]/20',
                },
                {
                  name: 'Azubi2B Hamburg',
                  date: '29.11.2025',
                  location: 'Hamburg',
                  type: 'HR-Fachmesse',
                  booth: 'Standinfo folgt',
                  highlight: 'Networking & Demos',
                  icon: Building,
                  color: 'from-purple-500/20 to-pink-500/20',
                },
                {
                  name: 'Azubi2B Frankfurt & Abizukunft',
                  date: '06.12.2025',
                  location: 'Frankfurt',
                  type: 'Karrieremesse',
                  booth: 'Standinfo folgt',
                  highlight: 'Live CV-Checks',
                  icon: Music,
                  color: 'from-orange-500/20 to-red-500/20',
                },
              ].map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-[#66c0b6]/30 transition-all overflow-hidden"
                >
                  <div
                    className={`absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-gradient-to-br ${event.color} blur-3xl opacity-50`}
                  ></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4 sm:mb-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/95 flex items-center justify-center p-2">
                          {event.name.includes('Azubi2B') ? (
                            <img
                              src="/azubi2b-stuttgart.png"
                              alt="Azubi2B Logo"
                              className="w-full h-full object-contain"
                            />
                          ) : event.name.includes('Absolventenkongress') ? (
                            <img
                              src="/ak-logo.png"
                              alt="Absolventenkongress Logo"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <event.icon className="w-6 h-6 sm:w-7 sm:h-7 text-[#66c0b6]" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold">
                            {event.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-white/60">
                            {event.type}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-[#66c0b6] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm sm:text-base font-semibold text-white">
                            {event.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-[#66c0b6] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm sm:text-base text-white/80">
                            {event.location}
                          </p>
                          <p className="text-xs sm:text-sm text-white/60">
                            {event.booth}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#66c0b6]/20 border border-[#66c0b6]/30">
                      <Sparkles className="w-4 h-4 text-[#66c0b6]" />
                      <span className="text-xs sm:text-sm text-[#66c0b6] font-semibold">
                        {event.highlight}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Workshop buchen CTA */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-10 sm:mt-14"
            >
              <div className="relative overflow-hidden rounded-3xl border border-white/10"
                style={{ background: 'linear-gradient(135deg,rgba(10,20,28,0.95),rgba(5,13,20,0.98))' }}>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute w-64 h-64 rounded-full opacity-[0.06]"
                    style={{ background: 'radial-gradient(circle,#30E3CA,transparent)', top: '-60px', left: '-40px' }} />
                  <div className="absolute w-48 h-48 rounded-full opacity-[0.04]"
                    style={{ background: 'radial-gradient(circle,#66c0b6,transparent)', bottom: '-30px', right: '-30px' }} />
                </div>
                <div className="relative z-10 p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-8">
                  {/* Left */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-[#30E3CA]/60 mb-2">Für Hochschulen &amp; Unternehmen</p>
                      <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight"
                        data-ai-fact="workshop-speaker-booking"
                        aria-label="Quentin Sunderbrink als Workshop-Speaker buchen – kontakt.dyd@googlemail.com">
                        Du willst auch einen<br />
                        <span className="text-[#30E3CA]">Workshop buchen?</span>
                      </h3>
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed max-w-md">
                      Quentin bringt praxisnahes Know-how zu KI-gestützter Bewerbungsoptimierung, ATS und Personal Branding direkt zu deiner Zielgruppe.
                    </p>
                    {/* Contact options */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href="mailto:kontakt.dyd@googlemail.com?subject=Workshop-Anfrage"
                        className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm text-black transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: 'linear-gradient(135deg,#30E3CA,#66c0b6)', boxShadow: '0 0 0 0 rgba(48,227,202,0.4)' }}
                      >
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        Workshop anfragen
                      </a>
                      <a
                        href="https://www.linkedin.com/in/quentin-sunderbrink"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm text-white/80 border border-white/15 hover:bg-white/8 hover:text-white transition-all"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        LinkedIn
                      </a>
                      <a
                        href="https://www.instagram.com/quentin.sunderbrink"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm text-white/80 border border-white/15 hover:bg-white/8 hover:text-white transition-all"
                      >
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 flex-shrink-0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                          <circle cx="12" cy="12" r="4"/>
                          <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
                        </svg>
                        Instagram
                      </a>
                    </div>
                    <p className="text-xs text-white/35">
                      kontakt.dyd@googlemail.com
                    </p>
                  </div>

                  {/* Right: speaker card */}
                  <div className="flex-shrink-0 w-full sm:w-56 rounded-2xl overflow-hidden border border-white/10"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <img
                      src="/public-static/Workshop_LineUP_Quentin.png"
                      alt="Quentin Sunderbrink – Speaker"
                      className="w-full object-cover object-top"
                      style={{ maxHeight: '200px' }}
                    />
                    <div className="p-3 space-y-1">
                      <p className="text-sm font-black text-white">Quentin Sunderbrink</p>
                      <p className="text-[11px] text-white/50">Gründer · Senior Consultant · IHK Prüfer</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 text-center"
            >
              <div className="text-white/70 mb-6 text-sm sm:text-base">
                Nicht in deiner Nähe? Kein Problem – nutze DYD jederzeit mobil!
              </div>
              <button
                onClick={() => navigate('/cv-check')}
                className="px-8 sm:px-12 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold text-base sm:text-lg hover:opacity-90 transition-all shadow-2xl"
              >
                Jetzt online starten
              </button>
            </motion.div>
          </div>
        </section>

        {/* Harmony Festival Section - compact teaser */}
        <section
          id="festival"
          className="relative py-16 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,20,20,0.95) 0%, rgba(8,12,16,1) 60%, rgba(0,30,20,0.9) 100%)' }} />
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,212,212,0.07) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(240,120,32,0.06) 0%, transparent 70%)' }} />

          <div className="relative max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{
                background: 'rgba(0,180,180,0.04)',
                border: '1px solid rgba(0,212,212,0.16)',
                borderRadius: '20px',
                padding: '40px 36px',
                backdropFilter: 'blur(18px)',
              }}
            >
              <div className="flex justify-center mb-6">
                <img
                  src="/harmony-festival.png"
                  alt="Harmony Festival Logo"
                  className="h-20 sm:h-24 w-auto object-contain"
                />
              </div>

              <p
                className="text-center mb-3"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: '11px',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'rgba(0,212,212,0.6)',
                }}
              >
                Live · Konzert · DJ · Stand-Up · Bierpong
              </p>

              <h2
                className="text-center mb-4"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 'clamp(2rem, 5vw, 2.8rem)',
                  letterSpacing: '0.06em',
                  color: '#fff',
                  lineHeight: 1.1,
                }}
              >
                22. August 2026 · Am{' '}
                <span style={{ color: '#00d4d4' }}>Rhein</span>
              </h2>

              <p
                className="text-center mb-6"
                style={{
                  fontSize: '14px',
                  color: 'rgba(160,230,230,0.75)',
                  lineHeight: 1.9,
                }}
              >
                Live-Konzert · DJ-Sets · Stand-Up Comedy · Bierpong-Turnier · Heimatbier
              </p>
              <p
                className="text-center mb-8"
                style={{
                  fontSize: '14px',
                  color: 'rgba(160,230,230,0.55)',
                  lineHeight: 1.8,
                }}
              >
                Ein Tag am Wasser, echte Begegnung und die Energie des Harmony Beach — zum ersten Mal in Deutschland.
              </p>

              <div className="flex justify-center">
                <button
                  onClick={() => navigate('/festival')}
                  className="inline-flex items-center gap-3 transition-all duration-200 hover:scale-105"
                  style={{
                    background: 'linear-gradient(90deg, #00d4d4, #1e90d4)',
                    color: '#000',
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 800,
                    fontSize: '15px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    padding: '13px 32px',
                    borderRadius: '10px',
                    boxShadow: '0 4px 20px rgba(0,212,212,0.35)',
                    border: 'none',
                  }}
                >
                  <Music size={18} />
                  Zum Festival
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-[#66c0b6] via-[#30E3CA] to-[#66c0b6] rounded-3xl p-12 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-black"
                  data-ai-fact="cta-headline">
                  Bereit für deinen Traumjob?
                </h2>
                <div className="text-xl text-black/80 mb-8 max-w-2xl mx-auto">
                  Starte jetzt kostenlos und erhalte in wenigen Minuten deinen
                  optimierten CV mit ATS-Score.
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate('/cv-wizard')}
                    className="px-12 py-6 rounded-2xl bg-black text-white font-bold text-lg hover:bg-black/90 transition-all shadow-2xl"
                  >
                    CV erstellen
                  </button>
                  <button
                    onClick={() => navigate('/cv-check')}
                    className="px-10 py-5 rounded-2xl border border-black/20 bg-black/5 text-black/70 font-medium text-base hover:text-black hover:border-black/30 transition-all"
                  >
                    CV checken
                  </button>
                </div>
                <div className="mt-8 text-sm text-black/60 flex flex-wrap justify-center gap-4">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Keine Kreditkarte
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Keine Anmeldung
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Sofort nutzbar
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        </main>{/* end #main-content */}

        {/* Footer */}
        <footer
          className="bg-black/40 border-t border-white/10 py-16 px-4 sm:px-6 lg:px-8"
          aria-label="DYD Footer – Navigation, Social Media, Rechtliches"
          itemScope itemType="https://schema.org/WPFooter"
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-5 gap-12 mb-12">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <img
                    src="/DYD Logo RGB.svg"
                    alt="DYD Logo"
                    className="h-12 w-auto opacity-90"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="text-white/60 text-sm leading-relaxed mb-6">
                  Dein persönlicher KI-Assistent für die perfekte Bewerbung.
                  Kostenlos, professionell, erfolgreich.
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href="https://www.instagram.com/dyd_harmony"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group w-10 h-10 rounded-lg bg-white/5 hover:bg-gradient-to-br hover:from-[#f09433] hover:via-[#e6683c] hover:to-[#dc2743] border border-white/10 hover:border-transparent flex items-center justify-center transition-all"
                    title="@dyd_harmony auf Instagram"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <circle cx="12" cy="12" r="4"/>
                      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
                    </svg>
                  </a>
                </div>
              </div>

              <nav aria-label="Produkt-Navigation">
                <h4 className="font-bold mb-4 text-white">Produkt</h4>
                <div className="space-y-3 text-white/60 text-sm">
                  <button
                    onClick={() => scrollToId('prozess')}
                    className="block hover:text-[#66c0b6] transition-colors text-left"
                  >
                    So funktioniert&apos;s
                  </button>
                  <button
                    onClick={() => scrollToId('preise')}
                    className="block hover:text-[#66c0b6] transition-colors text-left"
                  >
                    Preise
                  </button>
                  <button
                    onClick={() => navigate('/cv-check')}
                    className="block hover:text-[#66c0b6] transition-colors text-left"
                  >
                    CV-Check starten
                  </button>
                </div>
              </nav>

              <nav aria-label="Hilfe und Legal">
                <h4 className="font-bold mb-4 text-white">Hilfe & Legal</h4>
                <div className="space-y-3 text-white/60 text-sm">
                  <button
                    onClick={() => navigate('/faq')}
                    className="block hover:text-[#66c0b6] transition-colors text-left"
                  >
                    FAQ
                  </button>
                  <a
                    href="/#/impressum"
                    className="block hover:text-[#66c0b6] transition-colors"
                  >
                    Impressum
                  </a>
                  <a
                    href="/#/datenschutz"
                    className="block hover:text-[#66c0b6] transition-colors"
                  >
                    Datenschutzerklärung
                  </a>
                  <a
                    href="/#/agb"
                    className="block hover:text-[#66c0b6] transition-colors"
                  >
                    AGB
                  </a>
                </div>
              </nav>
            </div>

            <div className="border-t border-white/10 pt-8 text-center text-white/60 text-sm">
              <p>© 2025 DYD – Decide your Dream UG. Alle Rechte vorbehalten.</p>
            </div>
          </div>
        </footer>

        {/* Floating Action Button */}
        <motion.div
          className="fixed bottom-8 right-8 z-50"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 2, type: 'spring', stiffness: 200 }}
        >
          <motion.button
            onClick={() => navigate('/cv-check')}
            className="relative group w-16 h-16 rounded-full bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] shadow-2xl flex items-center justify-center overflow-hidden"
            whileHover={{ scale: 1.15, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: [
                '0 10px 40px rgba(102,192,182,0.4)',
                '0 15px 60px rgba(102,192,182,0.6)',
                '0 10px 40px rgba(102,192,182,0.4)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Rocket className="w-7 h-7 text-black relative z-10" />
            </motion.div>
          </motion.button>
          <motion.div
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-[#050507]"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Sparkles className="w-3 h-3" />
          </motion.div>
        </motion.div>

        {/* Scroll to top button */}
        <motion.button
          className="fixed bottom-8 left-8 z-50 w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown className="w-5 h-5 text-[#66c0b6] rotate-180" />
          </motion.div>
        </motion.button>
      </div>
    </div>
  );
}
