import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';
import { b2bContent } from './content';

// Zentrale Gradients – einmal definiert, überall konsistent
const PILL_GRADIENT = 'linear-gradient(135deg, #38BDF8, #DEFF9A)';
const CTA_GRADIENT = 'linear-gradient(135deg, #DEFF9A, #38BDF8)';

/**
 * Zielgruppen-Umschalter: semantisch eine Navigation zwischen zwei Seiten
 * (Bewerber-Seite = extern, Business-Seite = aktuell), NICHT ein Tab-Widget.
 * Deshalb <nav> + Links + aria-current statt role="tablist"/aria-selected.
 */
function SegmentToggle({
  fluid = false,
  reduceMotion,
}: {
  fluid?: boolean;
  reduceMotion: boolean;
}) {
  const base =
    'relative px-4 py-1.5 text-sm font-arimo font-semibold rounded-full b2b-focus-ring transition-colors';
  const item = fluid ? `flex-1 text-center ${base}` : base;

  return (
    <nav
      aria-label="Zielgruppe"
      className={`flex items-center gap-1 p-1 rounded-full border border-white/15 bg-white/5 ${
        fluid ? 'w-full' : 'backdrop-blur-sm'
      }`}
    >
      <a
        href={b2bContent.header.applicantUrl}
        className={`${item} text-white/55 hover:text-white/80`}
      >
        {b2bContent.header.toggleApplicant}
      </a>

      <a
        href="#/business"
        aria-current="page"
        className={`${item} text-[#0A192F]`}
      >
        <motion.span
          layoutId="b2b-toggle-pill"
          className="absolute inset-0 rounded-full"
          style={{ background: PILL_GRADIENT }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 400, damping: 32 }
          }
          aria-hidden="true"
        />
        <span className="relative z-10">{b2bContent.header.toggleBusiness}</span>
      </a>
    </nav>
  );
}

export default function B2BHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;

  // Scroll-Zustand für den Glas-Hintergrund
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Escape schließt das Menü + Body-Scroll-Lock, solange offen
  useEffect(() => {
    if (!mobileOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen, closeMobile]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0A192F]/85 backdrop-blur-xl border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[4.5rem]">
          {/* Logo */}
          <a
            href="#/business"
            className="flex items-center gap-1.5 b2b-focus-ring"
            aria-label={b2bContent.header.logoAlt}
          >
            <span
              className="font-poppins font-black text-xl tracking-tight text-white"
              style={{ letterSpacing: '-0.04em' }}
            >
              DYD
            </span>
            <span className="text-[10px] font-arimo font-semibold text-[#38BDF8] leading-tight hidden sm:block">
              Decide Your Dream
            </span>
          </a>

          {/* Desktop: Toggle + CTA */}
          <div className="hidden md:flex items-center gap-4">
            <SegmentToggle reduceMotion={reduceMotion} />
            <a
              href="#lead-form"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-arimo font-bold text-[#0A192F] b2b-focus-ring transition-shadow hover:shadow-lg hover:shadow-[#38BDF8]/30"
              style={{ background: CTA_GRADIENT }}
            >
              {b2bContent.header.cta}
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>

          {/* Mobile: Hamburger */}
          <button
            type="button"
            className="md:hidden p-2 -mr-2 text-white b2b-focus-ring rounded-lg"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={mobileOpen}
            aria-controls="b2b-mobile-menu"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile-Menü */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="b2b-mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-[#0A192F]/95 backdrop-blur-xl border-b border-white/10"
          >
            <div className="px-4 py-4 space-y-3" onClick={closeMobile}>
              <SegmentToggle fluid reduceMotion={reduceMotion} />
              <a
                href="#lead-form"
                className="flex items-center justify-center gap-1.5 w-full px-5 py-3 rounded-full text-sm font-arimo font-bold text-[#0A192F] b2b-focus-ring"
                style={{ background: CTA_GRADIENT }}
              >
                {b2bContent.header.cta}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}