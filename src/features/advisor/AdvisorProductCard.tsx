// src/features/advisor/AdvisorProductCard.tsx
//
// Produktkarte im Berater. Preis, Leistungen und Ziel kommen ausschließlich
// aus den geprüften Serverdaten – das Modell kann hier nichts einschleusen.

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, Check, X } from 'lucide-react';
import type { AdvisorCard } from './advisorApi';
import { recordAdvisorClick } from './advisorAttribution';
import { trackAdvisor } from './advisorAnalytics';
import { CAL_DATA_NAMESPACE, ensureCalEmbedLoaded, getCalLink } from '../../lib/calBooking';

const ROLE_LABEL: Record<AdvisorCard['role'], string> = {
  main: 'Empfehlung',
  alternative: 'Alternative',
  addon: 'Ergänzung',
};

/** Nur interne Pfade der App sind als Ziel erlaubt */
function safePath(path: string): string | null {
  return /^\/[A-Za-z0-9/_#?=&.-]*$/.test(path) && !path.startsWith('//') ? path : null;
}

export function AdvisorProductCard({ card, onDecline, onNavigate }: {
  card: AdvisorCard;
  onDecline: (productId: string) => void;
  onNavigate: () => void;
}) {
  const navigate = useNavigate();
  const calLink = card.target_type === 'demo' ? getCalLink() : '';
  useEffect(() => { if (calLink) ensureCalEmbedLoaded(); }, [calLink]);

  const path = safePath(card.target_path);
  const go = () => {
    recordAdvisorClick(card.product_id);
    trackAdvisor('advisor_cta_click', { product_id: card.product_id });
    if (calLink) return; // Cal.com öffnet das Popup selbst (data-cal-*)
    if (!path) return;
    onNavigate();
    navigate(path);
  };

  return (
    <article
      className="rounded-2xl p-4 space-y-3 text-left"
      style={{
        background: card.role === 'main' ? 'linear-gradient(150deg,rgba(48,227,202,0.10),rgba(8,14,24,0.95) 60%)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${card.role === 'main' ? 'rgba(48,227,202,0.35)' : 'rgba(255,255,255,0.10)'}`,
      }}
      aria-label={`${ROLE_LABEL[card.role]}: ${card.name}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#30E3CA]/80">{ROLE_LABEL[card.role]}</p>
          <h4 className="text-sm font-black text-white leading-snug mt-0.5">{card.name}</h4>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-base font-black text-white whitespace-nowrap">{card.price_label}</p>
          {card.yearly_label && <p className="text-[10px] text-white/45 whitespace-nowrap">oder {card.yearly_label}</p>}
        </div>
      </div>

      {card.reason && <p className="text-xs text-white/75 leading-relaxed">{card.reason}</p>}

      {card.includes.length > 0 && (
        <ul className="space-y-1">
          {card.includes.slice(0, 4).map((item) => (
            <li key={item} className="flex items-start gap-1.5 text-[11px] text-white/60">
              <Check size={12} className="text-[#66c0b6] mt-0.5 flex-shrink-0" aria-hidden /> {item}
            </li>
          ))}
        </ul>
      )}

      {card.savings_label && (
        <p className="text-[11px] font-bold text-amber-300/90">{card.savings_label}</p>
      )}

      {card.next_step && <p className="text-[11px] text-white/45 leading-relaxed">Nächster Schritt: {card.next_step}</p>}

      <div className="flex items-center gap-2 pt-1">
        {calLink ? (
          <button
            type="button"
            onClick={go}
            data-cal-namespace={CAL_DATA_NAMESPACE}
            data-cal-link={calLink}
            data-cal-config={JSON.stringify({ layout: 'month_view' })}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-black text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{ background: 'linear-gradient(135deg,#30E3CA,#66c0b6)' }}
          >
            <CalendarDays size={15} aria-hidden /> {card.cta_label}
          </button>
        ) : (
          <button
            type="button"
            onClick={go}
            disabled={!path}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-black text-black disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{ background: 'linear-gradient(135deg,#30E3CA,#66c0b6)' }}
          >
            {card.cta_label} <ArrowRight size={15} aria-hidden />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDecline(card.product_id)}
          className="px-3 py-2.5 rounded-xl text-xs font-bold text-white/55 hover:text-white bg-white/5 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#30E3CA]"
          aria-label={`${card.name} passt nicht`}
        >
          <X size={14} className="inline -mt-0.5" aria-hidden /> Passt nicht
        </button>
      </div>
      {card.requires_login && <p className="text-[10px] text-white/35">Für den Kauf brauchst du ein kostenloses Konto.</p>}
    </article>
  );
}
