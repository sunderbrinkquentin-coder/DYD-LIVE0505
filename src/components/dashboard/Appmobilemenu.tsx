import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Home,
  Search,
  FileText,
  GraduationCap,
  Kanban,
  Music,
  Building2,
  Lightbulb,
  LogIn,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Wiederverwendbares Mobile-Burgermenü für alle Pages außerhalb der LandingPage
 * (Dashboard etc.). Route-basiert – keine Abhängigkeit von Landing-Scroll-Ankern.
 * Nur mobil sichtbar (md:hidden).
 */
export default function AppMobileMenu() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  // Body-Scroll sperren, solange das Menü offen ist
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const go = (target: string) => {
    setOpen(false);
    navigate(target);
  };

  // Zu einer Landing-Section: erst zur Startseite, dann zum Anker scrollen
  const goToLandingSection = (id: string) => {
    setOpen(false);
    navigate('/');
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  return (
    <>
      {/* Burger-Button (fixiert, oben rechts) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
        aria-expanded={open}
        aria-controls="app-mobile-menu"
        className="fixed top-3 right-4 z-[60] w-10 h-10 flex items-center justify-center rounded-lg border border-white/15 bg-black/40 backdrop-blur-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="app-mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className=className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="app-mobile-panel"
              id="app-mobile-menu"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 inset-x-0 z-50 max-h-[100dvh] overflow-y-auto border-b border-white/10 bg-[#070709]/95 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
                <button
                  type="button"
                  onClick={() => go('/')}
                  className="flex items-center gap-2"
                >
                  <img
                    src="/DYD Logo RGB copy copy.svg"
                    alt="DYD Logo"
                    className="h-8 w-auto opacity-90"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Menü schließen"
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-4 py-5 space-y-6">
                {/* Navigation */}
                <div>
                  <p className="px-1 mb-2 text-[10px] font-black uppercase tracking-widest text-white/30">
                    Navigation
                  </p>
                  <div className="space-y-1">
                    {[
                      { icon: Home, label: 'Startseite', sub: 'Zurück zur Landing Page', onClick: () => go('/') },
                      { icon: LayoutDashboard, label: 'Dashboard', sub: 'Dein Bewerbungs-Cockpit', onClick: () => go(user ? '/dashboard' : '/login?redirect=/dashboard') },
                      { icon: Search, label: 'CV kostenlos checken', sub: 'ATS-Score in Sekunden', onClick: () => go('/cv-check') },
                      { icon: FileText, label: 'CV erstellen', sub: 'KI-Wizard in 10 Min.', onClick: () => go('/cv-wizard') },
                      { icon: GraduationCap, label: 'Career Academy · Skill-Gap', sub: 'Lücken finden & schließen', onClick: () => go('/career-vision') },
                      { icon: Kanban, label: 'Bewerbermanagement', sub: 'Kanban für alle Bewerbungen', onClick: () => go(user ? '/dashboard' : '/login?redirect=/dashboard') },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={item.onClick}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-white/5 transition-colors"
                      >
                        <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#66c0b6]/15 border border-[#66c0b6]/25 flex items-center justify-center">
                          <item.icon className="w-4 h-4 text-[#66c0b6]" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-white truncate">{item.label}</span>
                          <span className="block text-xs text-white/45 truncate">{item.sub}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Entdecken */}
                <div>
                  <p className="px-1 mb-2 text-[10px] font-black uppercase tracking-widest text-white/30">
                    Entdecken
                  </p>
                  <div className="space-y-1">
                    <button type="button" onClick={() => go('/festival')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/5 transition-colors">
                      <Music className="w-4 h-4 text-[#00d4d4] flex-shrink-0" />
                      <span className="text-sm text-white/80">Harmony Festival</span>
                      <span className="ml-auto text-[10px] font-bold text-[#00d4d4]/70">22.08.26</span>
                    </button>
                    <button type="button" onClick={() => go('/business')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/5 transition-colors">
                      <Building2 className="w-4 h-4 text-white/50 flex-shrink-0" />
                      <span className="text-sm text-white/80">Für Business</span>
                    </button>
                    <button type="button" onClick={() => go('/faq')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/5 transition-colors">
                      <Lightbulb className="w-4 h-4 text-white/50 flex-shrink-0" />
                      <span className="text-sm text-white/80">FAQ</span>
                    </button>
                  </div>
                </div>

                {/* Konto */}
                {!user && (
                  <div>
                    <p className="px-1 mb-2 text-[10px] font-black uppercase tracking-widest text-white/30">
                      Konto
                    </p>
                    <div className="space-y-1">
                      <button type="button" onClick={() => go('/login')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/5 transition-colors">
                        <LogIn className="w-4 h-4 text-white/50 flex-shrink-0" />
                        <span className="text-sm text-white/80">Login</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Primär-CTA */}
                <button
                  type="button"
                  onClick={() => go('/cv-check')}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold text-sm shadow-lg shadow-[#66c0b6]/20"
                >
                  CV jetzt kostenlos checken
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}