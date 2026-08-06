import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';
import { b2bContent } from './content';

export default function B2BHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0A192F]/85 backdrop-blur-xl border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <a
            href="#/business"
            className="flex items-center gap-2 b2b-focus-ring"
            aria-label={b2bContent.header.logoAlt}
          >
            <div className="flex items-center gap-1.5">
              <span
                className="font-poppins font-black text-xl tracking-tight text-white"
                style={{ letterSpacing: '-0.04em' }}
              >
                DYD
              </span>
              <span className="text-[10px] font-arimo font-semibold text-[#38BDF8] leading-tight hidden sm:block">
                Decide Your Dream
              </span>
            </div>
          </a>

          {/* Desktop Segment Toggle */}
          <div
            className="hidden md:flex items-center gap-1 p-1 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm"
            role="tablist"
            aria-label="Zielgruppe wählen"
          >
            <a
              href={b2bContent.header.applicantUrl}
              className="relative px-4 py-1.5 text-sm font-arimo font-semibold text-white/55 hover:text-white/80 transition-colors rounded-full b2b-focus-ring"
              role="tab"
              aria-selected="false"
            >
              {b2bContent.header.toggleApplicant}
            </a>
            <div
              className="relative px-4 py-1.5 text-sm font-arimo font-semibold text-[#0A192F] rounded-full b2b-focus-ring"
              role="tab"
              aria-selected="true"
            >
              <motion.div
                layoutId="b2b-toggle-pill"
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #38BDF8, #DEFF9A)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
              <span className="relative z-10">{b2bContent.header.toggleBusiness}</span>
            </div>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <a
              href="#lead-form"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-arimo font-bold text-[#0A192F] b2b-focus-ring transition-all hover:shadow-lg hover:shadow-[#38BDF8]/30"
              style={{
                background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)',
              }}
            >
              {b2bContent.header.cta}
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 text-white b2b-focus-ring"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menü öffnen"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-[#0A192F]/95 backdrop-blur-xl border-b border-white/10"
          >
            <div className="px-4 py-4 space-y-3">
              {/* Mobile Toggle */}
              <div
                className="flex items-center gap-1 p-1 rounded-full border border-white/15 bg-white/5"
                role="tablist"
                aria-label="Zielgruppe wählen"
              >
                <a
                  href={b2bContent.header.applicantUrl}
                  className="flex-1 text-center px-3 py-2 text-sm font-arimo font-semibold text-white/55 rounded-full b2b-focus-ring"
                  role="tab"
                  aria-selected="false"
                >
                  {b2bContent.header.toggleApplicant}
                </a>
                <div
                  className="flex-1 text-center px-3 py-2 text-sm font-arimo font-semibold text-[#0A192F] rounded-full b2b-focus-ring"
                  role="tab"
                  aria-selected="true"
                  style={{
                    background: 'linear-gradient(135deg, #38BDF8, #DEFF9A)',
                  }}
                >
                  {b2bContent.header.toggleBusiness}
                </div>
              </div>
              {/* Mobile CTA */}
              <a
                href="#lead-form"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-1.5 w-full px-5 py-3 rounded-full text-sm font-arimo font-bold text-[#0A192F] b2b-focus-ring"
                style={{
                  background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)',
                }}
              >
                {b2bContent.header.cta}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
