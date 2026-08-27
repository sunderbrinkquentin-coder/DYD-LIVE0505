import { Outlet, useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';

const LEGAL_LINKS = [
  { to: '/impressum', label: 'Impressum' },
  { to: '/datenschutz', label: 'Datenschutzerklärung' },
  { to: '/agb', label: 'AGB' },
  { to: '/faq', label: 'FAQ' },
];

function GlobalFooter() {
  return (
    <footer className="bg-[#0a0a14] border-t border-white/10 px-4 py-8 mt-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <span className="font-bold text-white/70">DYD</span>
            <span className="text-white/30">·</span>
            <span>Decide your Dream</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-white/50 hover:text-[#66c0b6] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-6 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} DYD – Decide your Dream UG (haftungsbeschränkt). Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function GlobalLayout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-[#020617]">
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <GlobalFooter />
    </div>
  );
}
