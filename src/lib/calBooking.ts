/**
 * Cal.com-Terminbuchung als Popup (NEU, 30.09.2026).
 *
 * WICHTIG: Cal.com war bisher nirgends im Projekt hinterlegt - weder im
 * Code noch als natives Bolt-Connector (Bolt selbst bietet aktuell nur
 * Notion/Linear/GitHub/Miro/Sentry/Context7/Granola/Jira als Connectors -
 * die sind ausserdem nur fuer Bolts eigene KI beim Bauen gedacht, nicht
 * fuer ein Buchungs-Widget auf der fertigen Website). Deshalb hier Cal.coms
 * offizielles, abhaengigkeitsfreies "vanilla JS"-Embed-Snippet - kein neues
 * npm-Paket noetig, funktioniert in jeder Website unabhaengig vom Tool,
 * mit dem sie gebaut wurde.
 *
 * AKTIVIERUNG (durch Quentin): VITE_CAL_LINK in Bolts Environment-Variablen
 * setzen, Format "dein-cal-username/dein-event-slug" (z.B.
 * "quentin-sunderbrink/erstgespraech") - den Link/Slug findest du in
 * Cal.com unter dem jeweiligen Event-Type ("Copy link"). Ohne gesetzten
 * Wert bleibt der Buchen-Button ausgeblendet (siehe CalBookingButton.tsx) -
 * kein kaputter Button, kein Absturz.
 */

const CAL_NAMESPACE = 'erstgespraech';
let calInitialized = false;

/** Cal.coms offizielles Embed-Snippet, 1:1 uebernommen (siehe
 *  cal.com/docs -> Embed -> "vanilla JS"), nur in TypeScript getypt statt
 *  der offiziellen JS-Variante. Muss GENAU so aussehen, damit Cal.coms
 *  eigenes embed.js-Script (das dieser Code nachlaedt) die Aufrufe wie
 *  erwartet verarbeitet. */
function installCalLoader(): void {
  const w = window as unknown as {
    Cal?: {
      (...args: unknown[]): void;
      loaded?: boolean;
      ns: Record<string, ((...args: unknown[]) => void) & { q?: unknown[] }>;
      q: unknown[];
    };
  };

  if (w.Cal) return;

  const cal = function (...args: unknown[]) {
    const api = cal as unknown as { q: unknown[]; loaded?: boolean; ns: Record<string, unknown> };
    if (!api.loaded) {
      api.ns = {};
      api.q = api.q || [];
      const script = document.createElement('script');
      script.src = 'https://app.cal.com/embed/embed.js';
      document.head.appendChild(script);
      api.loaded = true;
    }

    if (args[0] === 'init') {
      const namespace = args[1] as string | undefined;
      const inner = (...innerArgs: unknown[]) => {
        (inner as unknown as { q: unknown[] }).q.push(innerArgs);
      };
      (inner as unknown as { q: unknown[] }).q = [];

      if (typeof namespace === 'string') {
        api.ns[namespace] = api.ns[namespace] || inner;
        (api.ns[namespace] as unknown as { q: unknown[] }).q.push(args);
        api.q.push(['initNamespace', namespace]);
      } else {
        api.q.push(args);
      }
      return;
    }

    api.q.push(args);
  } as unknown as typeof w.Cal & { q: unknown[]; ns: Record<string, unknown> };

  cal!.q = [];
  cal!.ns = {};
  w.Cal = cal;
}

/** Initialisiert Cal.com genau einmal (Popup-Modus, im Marken-Blau der
 *  Website). Macht bei fehlendem VITE_CAL_LINK nichts (siehe
 *  CalBookingButton.tsx, das dann gar nicht erst rendert). */
export function ensureCalEmbedLoaded(): void {
  if (calInitialized) return;
  const calLink = (import.meta.env.VITE_CAL_LINK as string | undefined) ?? '';
  if (!calLink) return;

  installCalLoader();
  const w = window as unknown as { Cal: (...args: unknown[]) => void };
  w.Cal('init', CAL_NAMESPACE, { origin: 'https://cal.com' });

  const calNs = (
    window as unknown as { Cal: { ns: Record<string, (...args: unknown[]) => void> } }
  ).Cal.ns[CAL_NAMESPACE];
  calNs('ui', {
    styles: { branding: { brandColor: '#38BDF8' } },
    hideEventTypeDetails: false,
    layout: 'month_view',
  });

  calInitialized = true;
}

export function getCalLink(): string {
  return (import.meta.env.VITE_CAL_LINK as string | undefined) ?? '';
}

export const CAL_DATA_NAMESPACE = CAL_NAMESPACE;