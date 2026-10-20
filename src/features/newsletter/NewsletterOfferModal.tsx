// src/features/newsletter/NewsletterOfferModal.tsx
//
// Angebot direkt nach der Anmeldung: Newsletter abonnieren → 50 % auf die
// erste Buchung. DSGVO: aktive Handlung (Button), vollständiger
// Einwilligungstext direkt über dem Button, neutrale Ablehnung ohne
// Druck ("Nein, danke"), Double-Opt-in per E-Mail.

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Gift, Loader2, Mail, X } from 'lucide-react';
import { NEWSLETTER_CONSENT_TEXT } from './consent';
import { newsletterApi, NewsletterError } from './newsletterApi';

type View = 'offer' | 'sent';

const BENEFITS = [
  'Bewerbungstipps, die wirklich wirken – kurz und umsetzbar',
  'Neues aus Arbeitsmarkt & KI, das deine Chancen verbessert',
  'Exklusive Angebote nur für Abonnent:innen',
];

export function NewsletterOfferModal({ open, email, firstName, source, initialView = 'offer', onClose, onSubscribed, onDeclined }: {
  open: boolean;
  email: string;
  firstName?: string | null;
  source: string;
  initialView?: View;
  onClose: () => void;          // "später" (X, Escape, Klick daneben)
  onSubscribed: () => void;
  onDeclined: () => void;
}) {
  const [view, setView] = useState<View>(initialView);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resendInfo, setResendInfo] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { if (open) { setView(initialView); setError(''); setResendInfo(''); } }, [open, initialView]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => primaryRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>('button, a[href], input');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; prev?.focus?.(); };
  }, [open, onClose]);

  if (!open) return null;

  const subscribe = async () => {
    setBusy(true); setError('');
    try {
      const r = await newsletterApi.subscribe(source, firstName);
      if (r.status === 'confirmed') { onSubscribed(); onClose(); return; }
      setView('sent');
      onSubscribed();
    } catch (e) {
      setError(e instanceof NewsletterError ? e.message : 'Das hat nicht geklappt. Bitte versuche es erneut.');
    } finally { setBusy(false); }
  };

  const decline = async () => {
    setBusy(true);
    try { await newsletterApi.decline(); } catch { /* still schließen */ }
    setBusy(false);
    onDeclined();
    onClose();
  };

  const resend = async () => {
    setResendInfo('');
    try { await newsletterApi.resend(); setResendInfo('Neue E-Mail ist unterwegs.'); }
    catch (e) { setResendInfo(e instanceof NewsletterError ? e.message : 'Bitte versuche es gleich noch einmal.'); }
  };

  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  const inbox = /gmail|googlemail/.test(domain) ? { label: 'Gmail öffnen', href: 'https://mail.google.com/' }
    : /outlook|hotmail|live\.|msn/.test(domain) ? { label: 'Outlook öffnen', href: 'https://outlook.live.com/mail/0/' }
    : /gmx/.test(domain) ? { label: 'GMX öffnen', href: 'https://www.gmx.net/' }
    : /web\.de/.test(domain) ? { label: 'WEB.DE öffnen', href: 'https://web.de/' }
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4" role="presentation">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nl-offer-title"
        className="relative w-full sm:max-w-[460px] max-h-[94vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl text-white shadow-2xl"
        style={{ background: 'linear-gradient(165deg,#0d1b2e 0%,#060b16 70%)', border: '1px solid rgba(48,227,202,0.28)' }}
      >
        <button type="button" onClick={onClose} className="absolute top-3 right-3 p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#30E3CA]" aria-label="Später entscheiden">
          <X size={18} aria-hidden />
        </button>

        {view === 'offer' ? (
          <div className="px-6 pt-7 pb-6 sm:px-7">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest text-[#30E3CA] bg-[#30E3CA]/10 border border-[#30E3CA]/30">
              <Gift size={12} aria-hidden /> Willkommensgeschenk
            </span>
            <h2 id="nl-offer-title" className="mt-3 text-[28px] sm:text-[32px] font-black leading-[1.08] tracking-tight">
              50 % auf deine<br /><span className="text-[#30E3CA]">erste Buchung</span>
            </h2>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              {firstName ? `${firstName}, hol` : 'Hol'} dir den DYD-Newsletter – und zahl bei deinem ersten CV-Check, Paket oder Kurs nur die Hälfte.
            </p>

            <div className="mt-4 flex items-center gap-3 rounded-2xl px-4 py-3 bg-white/[0.05] border border-white/10">
              <span className="text-xs text-white/60 leading-tight">Beispiel:<br />10 CV-Optimierungen</span>
              <span className="ml-auto text-sm text-white/45 line-through">30,00 €</span>
              <span className="text-xl font-black text-[#30E3CA]">15,00 €</span>
            </div>

            <ul className="mt-4 space-y-2">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-white/85"><Check size={16} className="mt-0.5 flex-shrink-0 text-[#30E3CA]" aria-hidden />{b}</li>
              ))}
            </ul>

            <p className="mt-5 text-[11px] leading-relaxed text-white/50">
              {NEWSLETTER_CONSENT_TEXT.replace(/Datenschutzerklärung\.$/, '')}
              <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/80">Datenschutzerklärung</a>.
            </p>

            {error && <p className="mt-3 text-xs text-red-300" role="alert">{error}</p>}

            <button
              ref={primaryRef}
              type="button"
              onClick={subscribe}
              disabled={busy}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl text-base font-black text-black disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-transform hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#30E3CA,#66c0b6)', boxShadow: '0 10px 30px rgba(48,227,202,0.25)' }}
            >
              {busy ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Gift size={18} aria-hidden />}
              Ja, Newsletter abonnieren &amp; 50 % sichern
            </button>
            <button type="button" onClick={decline} disabled={busy} className="mt-2 w-full px-5 py-3 rounded-2xl text-sm font-semibold text-white/55 hover:text-white hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#30E3CA]">
              Nein, danke
            </button>
            <p className="mt-1 text-center text-[11px] text-white/35">Max. 2 E-Mails im Monat · jederzeit mit einem Klick abbestellbar</p>
          </div>
        ) : (
          <div className="px-6 pt-8 pb-7 sm:px-7 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#30E3CA]/15 text-[#30E3CA]"><Mail size={26} aria-hidden /></span>
            <h2 id="nl-offer-title" className="mt-4 text-2xl font-black leading-tight">Fast geschafft – bestätige deine E-Mail</h2>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              Wir haben dir an <strong className="text-white">{email}</strong> einen Bestätigungslink geschickt. Ein Klick – und deine <strong className="text-white">50 % sind sofort aktiv</strong>.
            </p>
            {inbox && (
              <a href={inbox.href} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex w-full items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-black text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white" style={{ background: 'linear-gradient(135deg,#30E3CA,#66c0b6)' }}>
                <Mail size={16} aria-hidden /> {inbox.label}
              </a>
            )}
            <p className="mt-4 text-xs text-white/45">Nichts angekommen? Schau im Spam-Ordner nach oder{' '}
              <button type="button" onClick={resend} className="underline text-white/70 hover:text-white">sende die E-Mail erneut</button>.
            </p>
            {resendInfo && <p className="mt-2 text-xs text-[#30E3CA]" role="status">{resendInfo}</p>}
            <button ref={inbox ? undefined : primaryRef} type="button" onClick={onClose} className="mt-5 w-full px-5 py-3 rounded-2xl text-sm font-bold text-white bg-white/[0.07] border border-white/15 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#30E3CA]">
              Weiter zu DYD
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
