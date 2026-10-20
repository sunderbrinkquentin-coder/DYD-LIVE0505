// src/pages/NewsletterConfirmPage.tsx
//
// Ziel des Bestätigungslinks aus der Double-Opt-in-Mail:
// /newsletter/bestaetigen?token=… → Abo bestätigen, Rabatt freischalten.

import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileSearch, GraduationCap, Layers, Loader2, XCircle } from 'lucide-react';
import { newsletterApi, NewsletterError } from '../features/newsletter/newsletterApi';
import { refreshNewsletterState } from '../features/newsletter/useNewsletterState';
import { useAuth } from '../contexts/AuthContext';

type State = { kind: 'loading' } | { kind: 'ok'; until: string | null; percent: number; active: boolean } | { kind: 'error'; message: string; expired: boolean };

const OFFERS = [
  { to: '/dashboard', icon: Layers, title: '10 CV-Optimierungen', text: 'Jede Bewerbung passgenau – mit Rabatt 1,50 € pro Stelle.' },
  { to: '/cv-check', icon: FileSearch, title: 'CV-Check Detailanalyse', text: 'Sehen, woran dein CV im ATS scheitert – mit fertigen Formulierungen.' },
  { to: '/kurse', icon: GraduationCap, title: 'Kurs mit Zertifikat', text: 'Gefragten Skill lernen, Zertifikat direkt in LinkedIn.' },
];

export default function NewsletterConfirmPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { user } = useAuth();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    newsletterApi.confirm(token)
      .then((r) => {
        setState({ kind: 'ok', until: r.discount_expires_at ?? null, percent: r.percent ?? 50, active: r.discount_active !== false });
        if (user) void refreshNewsletterState(user.id);
      })
      .catch((e) => setState({ kind: 'error', message: e instanceof NewsletterError ? e.message : 'Das hat nicht geklappt.', expired: e instanceof NewsletterError && e.code === 'expired' }));
  }, [token, user]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 text-white">
      <div className="w-full max-w-xl">
        {state.kind === 'loading' && (
          <p className="flex items-center justify-center gap-2 text-white/70" role="status"><Loader2 className="animate-spin" size={18} aria-hidden /> Wir bestätigen deine Anmeldung …</p>
        )}

        {state.kind === 'error' && (
          <div className="rounded-3xl p-8 text-center bg-white/[0.04] border border-white/10">
            <XCircle className="mx-auto text-red-300" size={40} aria-hidden />
            <h1 className="mt-4 text-2xl font-black">Link nicht mehr gültig</h1>
            <p className="mt-2 text-white/70">{state.message}</p>
            <Link to={user ? '/dashboard' : '/login'} className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-black" style={{ background: 'linear-gradient(135deg,#30E3CA,#66c0b6)' }}>
              {user ? 'Zum Dashboard' : 'Anmelden'} <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        )}

        {state.kind === 'ok' && (
          <div className="rounded-3xl p-7 sm:p-9 bg-white/[0.04] border border-[#30E3CA]/30">
            <CheckCircle2 className="text-[#30E3CA]" size={40} aria-hidden />
            <h1 className="mt-4 text-3xl sm:text-4xl font-black leading-tight">Bestätigt – {state.active ? <>deine <span className="text-[#30E3CA] whitespace-nowrap">{state.percent} %</span> sind aktiv.</> : 'willkommen zurück.'}</h1>
            {state.active && (
              <p className="mt-3 text-white/75">Der Rabatt wird bei deiner nächsten Buchung automatisch abgezogen{state.until ? ` – gültig bis ${new Date(state.until).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}. Kein Code nötig.</p>
            )}
            <div className="mt-7 grid gap-3">
              {OFFERS.map(({ to, icon: Icon, title, text }) => (
                <Link key={to} to={user ? to : `/login?redirect=${encodeURIComponent(to)}`} className="group flex items-center gap-4 rounded-2xl p-4 bg-white/[0.04] border border-white/10 hover:border-[#30E3CA]/50 transition-colors">
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#30E3CA]/12 text-[#30E3CA]"><Icon size={20} aria-hidden /></span>
                  <span className="flex-1">
                    <span className="block font-black">{title}</span>
                    <span className="block text-sm text-white/60">{text}</span>
                  </span>
                  <ArrowRight size={18} className="text-white/40 group-hover:text-[#30E3CA] transition-colors" aria-hidden />
                </Link>
              ))}
            </div>
            <p className="mt-6 text-xs text-white/40">Du kannst den Newsletter jederzeit über den Link in jeder E-Mail abbestellen – dein Rabatt bleibt dir trotzdem.</p>
          </div>
        )}
      </div>
    </div>
  );
}
