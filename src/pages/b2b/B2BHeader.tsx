import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Menu, X, ArrowRight, Layers, Workflow } from 'lucide-react';
import { b2bContent } from './content';
import DydLogo from './DydLogo';

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

export type B2BArea = 'skills' | 'automation';

/**
 * Bereichs-Weiche (NEU, 16.10.2026): trennt die zwei B2B-Angebote klar –
 * Skill-Plattform (NEXUS/ORBIT, fertiges Produkt) vs. Automatisierung &
 * Software (individuelle Entwicklung). Echte Links auf zwei eigene Seiten.
 */
function AreaSwitch({ area, fluid = false }: { area: B2BArea; fluid?: boolean }) {
  const items = [
    { id: 'skills' as const, href: '#/business', label: 'Skill-Plattform', Icon: Layers },
    { id: 'automation' as const, href: '#/business/automatisierung', label: 'Automatisierung', Icon: Workflow },
  ];
  return (
    <nav aria-label="Angebot" className={`flex items-center gap-1 ${fluid ? 'w-full grid grid-cols-2' : ''}`}>
      {items.map((it) => {
        const active = it.id === area;
        return (
          <a
            key={it.id}
            href={it.href}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-arimo font-bold transition-colors b2b-focus-ring ${
              active ? 'text-white bg-white/12 ring-1 ring-white/20' : 'text-white/55 hover:text-white'
            }`}
            style={active ? { background: 'rgba(255,255,255,0.10)' } : undefined}
          >
            <it.Icon className={`w-4 h-4 ${active ? (it.id === 'automation' ? 'text-[#DEFF9A]' : 'text-[#38BDF8]') : ''}`} aria-hidden="true" />
            {it.label}
          </a>
        );
      })}
    </nav>
  );
}

type B2BHeaderProps = {
  /** Öffnet das Kontakt-/Lead-Modal (ohne Segment → Nutzer wählt im Modal). */
  onContact?: () => void;
  /** Welche B2B-Seite gerade aktiv ist (für die Bereichs-Weiche) */
  area?: B2BArea;
  /** Eigener Text für den Kontakt-Button */
  ctaLabel?: string;
};

export default function B2BHeader({ onContact, area = 'skills', ctaLabel }: B2BHeaderProps) {
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

  const handleContact = () => {
    closeMobile();
    onContact?.();
  };

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
            className="flex items-center gap-2.5 b2b-focus-ring"
            aria-label={b2bContent.header.logoAlt}
          >
            <DydLogo variant="white" className="h-9 w-9" />
            <span className="flex flex-col leading-none">
              <span className="font-poppins font-black text-lg text-white tracking-tight" style={{ letterSpacing: '-0.04em' }}>DYD</span>
              <span className="text-[9px] font-arimo font-semibold text-[#66c0b6] hidden sm:block">Decide Your Dream</span>
            </span>
          </a>

          {/* Desktop: Bereichs-Weiche */}
          <div className="hidden lg:flex">
            <AreaSwitch area={area} />
          </div>

          {/* Desktop: Toggle + CTA */}
          <div className="hidden md:flex items-center gap-4">
            <SegmentToggle reduceMotion={reduceMotion} />
            <button
              type="button"
              onClick={handleContact}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-arimo font-bold text-[#0A192F] b2b-focus-ring transition-shadow hover:shadow-lg hover:shadow-[#38BDF8]/30"
              style={{ background: CTA_GRADIENT }}
            >
              {ctaLabel ?? b2bContent.header.cta}
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
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
            <div className="px-4 py-4 space-y-3">
              <AreaSwitch area={area} fluid />
              <SegmentToggle fluid reduceMotion={reduceMotion} />
              <button
                type="button"
                onClick={handleContact}
                className="flex items-center justify-center gap-1.5 w-full px-5 py-3 rounded-full text-sm font-arimo font-bold text-[#0A192F] b2b-focus-ring"
                style={{ background: CTA_GRADIENT }}
              >
                {ctaLabel ?? b2bContent.header.cta}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}