// src/pages/NewsletterUnsubscribePage.tsx
//
// Abmeldung über den Link in jeder Newsletter-Mail: /newsletter/abmelden?t=…
// Bewusst mit einem Klick (Button), damit E-Mail-Programme, die Links vorab
// öffnen, niemanden versehentlich abmelden. Ein-Klick-Abmeldung direkt im
// Postfach läuft zusätzlich über den List-Unsubscribe-Header.

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, MailX } from 'lucide-react';
import { newsletterApi, NewsletterError } from '../features/newsletter/newsletterApi';

export default function NewsletterUnsubscribePage() {
  const [params] = useSearchParams();
  const token = params.get('t') ?? '';
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const unsubscribe = async () => {
    setState('busy');
    try { await newsletterApi.unsubscribe(token); setState('done'); }
    catch (e) { setMessage(e instanceof NewsletterError ? e.message : 'Das hat nicht geklappt.'); setState('error'); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 text-white">
      <div className="w-full max-w-md rounded-3xl p-8 text-center bg-white/[0.04] border border-white/10">
        {state === 'done' ? (
          <>
            <CheckCircle2 className="mx-auto text-[#30E3CA]" size={40} aria-hidden />
            <h1 className="mt-4 text-2xl font-black">Du bist abgemeldet</h1>
            <p className="mt-2 text-white/70">Du bekommst keinen Newsletter mehr von uns. Ein bereits erhaltener Rabatt bleibt dir erhalten.</p>
            <Link to="/" className="mt-6 inline-block text-sm font-bold text-[#30E3CA] hover:underline">Zur Startseite</Link>
          </>
        ) : (
          <>
            <MailX className="mx-auto text-white/70" size={40} aria-hidden />
            <h1 className="mt-4 text-2xl font-black">Newsletter abbestellen?</h1>
            <p className="mt-2 text-white/70">Schade, dass du gehst. Mit einem Klick meldest du dich ab – ohne Login.</p>
            {state === 'error' && <p className="mt-3 text-sm text-red-300" role="alert">{message}</p>}
            <button type="button" onClick={unsubscribe} disabled={state === 'busy' || !token} className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-black disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#30E3CA,#66c0b6)' }}>
              {state === 'busy' && <Loader2 size={16} className="animate-spin" aria-hidden />} Jetzt abmelden
            </button>
            <Link to="/" className="mt-3 inline-block text-sm text-white/50 hover:text-white">Doch nicht – zurück zu DYD</Link>
          </>
        )}
      </div>
    </div>
  );
}
