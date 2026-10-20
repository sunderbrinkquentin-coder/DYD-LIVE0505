// src/features/newsletter/NewsletterGate.tsx
//
// Zeigt eingeloggten Nutzern EINMAL das Newsletter-Angebot (direkt nach der
// Registrierung bzw. beim ersten Login nach dem Start der Aktion).
//  - "Nein, danke" → nie wieder fragen (Server-Vermerk)
//  - X / Escape    → in 3 Tagen erneut (nur in diesem Browser)
//  - Status "pending" → dezenter Hinweis "E-Mail bestätigen" mit erneut senden
// Nicht auf Checkout-, Editor-, Druck- und Bestätigungsseiten.
// Andere Komponenten öffnen das Angebot per openNewsletterOffer(source).

import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Mail, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NewsletterOfferModal } from './NewsletterOfferModal';
import { newsletterApi } from './newsletterApi';
import { refreshNewsletterState, useNewsletterState } from './useNewsletterState';

const OPEN_EVENT = 'dyd:newsletter-offer';
const SNOOZE_DAYS = 3;
const HIDDEN_PREFIXES = [
  '/newsletter', '/cv-export-render', '/cv-live-editor', '/cv/', '/cv-preview-editor', '/payment-success', '/festival-success',
  '/learning-path-waiting', '/login', '/reset-password', '/turnier', '/admin', '/verify', '/business', '/cv-paywall', '/pricing',
];

/** Angebot aus anderen Komponenten öffnen (z. B. Hinweis im Bezahl-Dialog) */
export function openNewsletterOffer(source = 'app') {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { source } }));
}

const snoozeKey = (uid: string) => `dyd_nl_snooze_${uid}`;
function snoozed(uid: string): boolean {
  try { return Number(localStorage.getItem(snoozeKey(uid)) ?? 0) > Date.now(); } catch { return false; }
}
function snooze(uid: string) {
  try { localStorage.setItem(snoozeKey(uid), String(Date.now() + SNOOZE_DAYS * 86_400_000)); } catch { /* ignorieren */ }
}

export function NewsletterGate() {
  const { user, profile } = useAuth();
  const { state, loading } = useNewsletterState();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState('signup');
  const [pendingHidden, setPendingHidden] = useState(false);
  const [initialView, setInitialView] = useState<'offer' | 'sent'>('offer');

  const hiddenHere = HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p.endsWith('/') ? p : `${p}/`) || pathname.startsWith(p));
  const firstName = (profile?.full_name || (user?.user_metadata?.full_name as string) || '').trim().split(/\s+/)[0] || null;

  // Automatisch einmal anbieten
  useEffect(() => {
    if (!user || loading || open || hiddenHere) return;
    if (state.status !== 'none' || snoozed(user.id)) return;
    const t = window.setTimeout(() => { setSource('signup'); setInitialView('offer'); setOpen(true); }, 1500);
    return () => window.clearTimeout(t);
  }, [user, loading, state.status, hiddenHere, open]);

  // Manuell öffnen (z. B. aus dem Bezahl-Dialog)
  useEffect(() => {
    const onOpen = (e: Event) => {
      if (!user) return;
      setSource(String((e as CustomEvent).detail?.source ?? 'app'));
      setInitialView(state.status === 'pending' ? 'sent' : 'offer');
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, [user, state.status]);

  const close = useCallback(() => {
    setOpen(false);
    if (user && state.status === 'none') snooze(user.id);
  }, [user, state.status]);

  const refresh = useCallback(() => { if (user) void refreshNewsletterState(user.id); }, [user]);

  if (!user?.email) return null;

  return (
    <>
      <NewsletterOfferModal
        open={open}
        email={user.email}
        firstName={firstName}
        source={source}
        initialView={initialView}
        onClose={close}
        onSubscribed={refresh}
        onDeclined={refresh}
      />
      {!open && !hiddenHere && !pendingHidden && state.status === 'pending' && (
        <PendingReminder onOpen={() => { setInitialView('sent'); setOpen(true); }} onHide={() => setPendingHidden(true)} />
      )}
    </>
  );
}

function PendingReminder({ onOpen, onHide }: { onOpen: () => void; onHide: () => void }) {
  const [info, setInfo] = useState('');
  return (
    <div className="fixed z-[55] left-3 right-3 bottom-3 sm:left-4 sm:right-auto sm:bottom-4 sm:w-[340px] rounded-2xl p-4 text-white shadow-2xl" style={{ background: '#0b1626', border: '1px solid rgba(48,227,202,0.35)' }} role="status">
      <button type="button" onClick={onHide} className="absolute top-2 right-2 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10" aria-label="Hinweis ausblenden"><X size={14} aria-hidden /></button>
      <p className="flex items-center gap-2 text-sm font-black"><Mail size={15} className="text-[#30E3CA]" aria-hidden /> Nur noch ein Klick zu 50 %</p>
      <p className="mt-1 text-xs text-white/65 leading-relaxed">Bestätige deine E-Mail-Adresse, dann ist dein Rabatt auf die erste Buchung sofort aktiv.</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onOpen} className="flex-1 px-3 py-2 rounded-xl text-xs font-black text-black" style={{ background: 'linear-gradient(135deg,#30E3CA,#66c0b6)' }}>Postfach öffnen</button>
        <button type="button" onClick={async () => { try { await newsletterApi.resend(); setInfo('Gesendet.'); } catch (e) { setInfo(e instanceof Error ? e.message : 'Fehler'); } }} className="px-3 py-2 rounded-xl text-xs font-bold text-white/75 bg-white/[0.06] border border-white/12 hover:text-white">Erneut senden</button>
      </div>
      {info && <p className="mt-2 text-[11px] text-[#30E3CA]">{info}</p>}
    </div>
  );
}
