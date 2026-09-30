import { useEffect } from 'react';
import { CalendarCheck } from 'lucide-react';
import { ensureCalEmbedLoaded, getCalLink, CAL_DATA_NAMESPACE } from '../../lib/calBooking';

interface CalBookingButtonProps {
  label: string;
  variant?: 'primary' | 'secondary';
  className?: string;
}

const NAVY_SKY = 'linear-gradient(135deg, #0A192F, #38BDF8)';

/**
 * Buchen-Button fuers Cal.com-Popup (NEU, 30.09.2026) - ergaenzt den
 * bestehenden "Erstgespräch"-Weg (Lead-Formular, siehe B2BContactModal.tsx)
 * um eine zweite, schnellere Option: sofort einen echten Termin-Slot
 * buchen, ohne erst auf eine Antwort per E-Mail zu warten.
 *
 * Rendert bewusst NICHTS, solange VITE_CAL_LINK nicht gesetzt ist (siehe
 * calBooking.ts) - kein kaputter/funktionsloser Button auf der Seite,
 * solange Quentin sein Cal.com-Konto noch nicht verlinkt hat.
 */
export function CalBookingButton({ label, variant = 'secondary', className = '' }: CalBookingButtonProps) {
  const calLink = getCalLink();

  useEffect(() => {
    if (calLink) ensureCalEmbedLoaded();
  }, [calLink]);

  if (!calLink) return null;

  const baseClasses =
    'group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-arimo font-bold b2b-focus-ring transition hover:-translate-y-0.5';
  const variantClasses =
    variant === 'primary'
      ? 'text-white hover:shadow-xl hover:shadow-[#38BDF8]/25'
      : 'text-[#0F1E34] border border-[#E3EBF5] bg-white hover:border-[#38BDF8]/40 hover:shadow-lg';

  return (
    <button
      type="button"
      data-cal-namespace={CAL_DATA_NAMESPACE}
      data-cal-link={calLink}
      data-cal-config={JSON.stringify({ layout: 'month_view' })}
      className={`${baseClasses} ${variantClasses} ${className}`}
      style={variant === 'primary' ? { background: NAVY_SKY } : undefined}
    >
      <CalendarCheck className="w-4 h-4" aria-hidden="true" />
      {label}
    </button>
  );
}