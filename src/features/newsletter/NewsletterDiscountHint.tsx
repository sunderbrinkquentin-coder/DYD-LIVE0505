// src/features/newsletter/NewsletterDiscountHint.tsx
//
// Hinweis an Kaufstellen (Bezahl-Dialoge, Kursseite):
//  - Rabatt aktiv   → "−50 % werden im Checkout automatisch abgezogen"
//  - noch nie Rabatt → "50 % sparen mit dem Newsletter" (öffnet das Angebot)
//  - Bestätigung offen → "E-Mail bestätigen und 50 % sparen"
// Für Gäste und nach eingelöstem Rabatt wird nichts angezeigt.

import { Gift } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { openNewsletterOffer } from './NewsletterGate';
import { useNewsletterState } from './useNewsletterState';

export function NewsletterDiscountHint({ source, className = '', tone = 'dark' }: { source: string; className?: string; tone?: 'dark' | 'light' }) {
  const { user } = useAuth();
  const { state, loading } = useNewsletterState();
  if (!user || loading || state.discountRedeemedAt) return null;

  const base = `flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs leading-snug ${className}`;
  const color = tone === 'dark'
    ? { background: 'rgba(48,227,202,0.10)', border: '1px solid rgba(48,227,202,0.35)', color: '#e6fffb' }
    : { background: '#ECFDF9', border: '1px solid #99F6E4', color: '#0F3D3A' };

  if (state.discountActive) {
    const until = state.discountExpiresAt ? new Date(state.discountExpiresAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' }) : null;
    return (
      <div className={base} style={color} role="note">
        <Gift size={16} className="flex-shrink-0 text-[#30E3CA]" aria-hidden />
        <span><strong>−{state.discountPercent} % Willkommensrabatt aktiv</strong> – wird im Checkout automatisch abgezogen{until ? ` (gültig bis ${until})` : ''}.</span>
      </div>
    );
  }
  if (state.discountExpiresAt) return null; // Rabatt gab es schon (abgelaufen)

  const pending = state.status === 'pending';
  return (
    <button type="button" onClick={() => openNewsletterOffer(source)} className={`${base} w-full text-left hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#30E3CA]`} style={color}>
      <Gift size={16} className="flex-shrink-0 text-[#30E3CA]" aria-hidden />
      <span>{pending
        ? <><strong>Fast geschafft:</strong> Bestätige deine E-Mail und spar 50 % auf diese Buchung.</>
        : <><strong>50 % sparen:</strong> Newsletter abonnieren und nur die Hälfte zahlen →</>}
      </span>
    </button>
  );
}
