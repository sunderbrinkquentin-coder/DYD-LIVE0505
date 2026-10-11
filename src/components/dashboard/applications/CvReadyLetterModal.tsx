import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, FileCheck2, HelpCircle, ShieldCheck, Sparkles, Wand2, X } from 'lucide-react';
import type { TrackedApplication } from '../../../types/applications';
import { COVER_LETTER_PRICE, formatEuro } from '../../../types/coverLetter';

interface CvReadyLetterModalProps {
  app: TrackedApplication;
  /** Kombi-Preis verfügbar (verknüpfter CV ist bezahlt) */
  addonPrice: boolean;
  onStart: () => void;
  onLater: () => void;
}

/**
 * Pop-up direkt nach dem CV-Export: Anschreiben im selben Atemzug verkaufen.
 * Bewusst ruhig und hochwertig – kein Countdown, kein Dark Pattern.
 */
export function CvReadyLetterModal({ app, addonPrice, onStart, onLater }: CvReadyLetterModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onLater();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onLater]);

  return createPortal(
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onLater}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[560px] animate-[fade-in_0.3s_ease] overflow-hidden rounded-t-3xl border border-white/10 bg-[#0b0d0e] text-white shadow-2xl sm:rounded-3xl"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#30E3CA]/20 blur-3xl" />
        <button onClick={onLater} className="absolute right-3 top-3 rounded-xl p-2 text-white/40 hover:bg-white/10 hover:text-white" aria-label="Später">
          <X className="h-5 w-5" />
        </button>

        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[#30E3CA]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#30E3CA]/15">
              <FileCheck2 className="h-3.5 w-3.5" />
            </span>
            Dein Lebenslauf ist fertig
          </div>

          <h2 className="mt-4 text-[26px] font-black leading-tight sm:text-[30px]">
            Jetzt das passende Anschreiben –{' '}
            <span className="bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] bg-clip-text text-transparent">in 1 Minute</span>
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-white/60">
            Für <b className="text-white">{app.job_title}</b>
            {app.company && <> bei <b className="text-white">{app.company}</b></>}. Stelle und CV sind schon hinterlegt –
            du beantwortest nur 6 kurze Fragen.
          </p>

          {/* Mini-Vorschau: zeigt das Alleinstellungsmerkmal */}
          <div className="mt-5 rounded-2xl bg-white p-4 text-gray-900">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Einstieg</p>
            <div className="mt-1.5 space-y-1.5">
              <div className="h-2 w-full rounded-full bg-gray-300" />
              <div className="h-2 w-11/12 rounded-full bg-gray-300" />
              <div className="h-2 w-2/3 rounded-full bg-gray-300" />
            </div>
            <div className="mt-3 rounded-xl border border-[#66c0b6]/30 bg-[#66c0b6]/10 p-2.5">
              <p className="flex items-center gap-1 text-[11px] font-semibold text-[#2f857c]">
                <HelpCircle className="h-3 w-3" /> Warum steht das hier?
              </p>
              <p className="mt-0.5 text-[12px] text-gray-700">
                Du startest mit deinem stärksten Ergebnis und verknüpfst es direkt mit der Kernaufgabe aus der Anzeige.
              </p>
            </div>
          </div>

          <ul className="mt-5 grid gap-2 text-[13px] text-white/75 sm:grid-cols-2">
            {[
              'In deinem Ton, nicht nach Vorlage',
              'Passend zu Level und Branche',
              'Floskel-Check inklusive',
              'Jeder Absatz erklärt & editierbar',
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="h-4 w-4 flex-shrink-0 text-[#30E3CA]" /> {t}
              </li>
            ))}
          </ul>

          <button
            onClick={onStart}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] py-3.5 text-[16px] font-bold text-black shadow-[0_10px_40px_rgba(48,227,202,0.35)] transition hover:brightness-110 active:scale-[0.99]"
          >
            <Wand2 className="h-5 w-5" /> Anschreiben jetzt erstellen
          </button>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12px] text-white/45">
            <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> Vorschau kostenlos</span>
            <span>·</span>
            {addonPrice ? (
              <span>
                danach nur <b className="text-white">{formatEuro(COVER_LETTER_PRICE.addon)}</b>{' '}
                <s className="text-white/30">{formatEuro(COVER_LETTER_PRICE.single)}</s> als Kombi zu deinem CV
              </span>
            ) : (
              <span>danach {formatEuro(COVER_LETTER_PRICE.single)} oder 1 Credit</span>
            )}
            <span>·</span>
            <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> kein Abo</span>
          </div>

          <button onClick={onLater} className="mx-auto mt-4 block text-[13px] text-white/40 hover:text-white/70">
            Später – ich finde es in meiner Bewerbung
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
