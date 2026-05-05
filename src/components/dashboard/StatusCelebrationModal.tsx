import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type CelebrationStatus = 'interview' | 'offer' | 'rejected';

interface StatusCelebrationModalProps {
  status: CelebrationStatus;
  jobTitle?: string;
  company?: string;
  onClose: () => void;
}

const QUESTIONS: Record<CelebrationStatus, [string, string, string]> = {
  interview: [
    'Wie reibungslos lief der Bewerbungsprozess bis hierhin?',
    'Was wäre ein cooles Add-on, das dir den Prozess noch leichter machen würde?',
    'Wie wahrscheinlich ist es, dass du DYD weiterempfehlen würdest?',
  ],
  offer: [
    'Wie reibungslos lief der gesamte Bewerbungsprozess?',
    'Was wäre ein cooles Add-on, das dir den Prozess noch leichter gemacht hätte?',
    'Wie wahrscheinlich ist es, dass du DYD weiterempfehlen würdest?',
  ],
  rejected: [
    'Wie reibungslos lief der Bewerbungsprozess insgesamt?',
    'Was wäre ein cooles Add-on, das dir den Prozess noch leichter gemacht hätte?',
    'Wie wahrscheinlich ist es, dass du DYD weiterempfehlen würdest?',
  ],
};

const CONTENT: Record<
  CelebrationStatus,
  { emoji: string; title: string; subtitle: string; accent: string; headerGradient: string }
> = {
  interview: {
    emoji: '🤞',
    title: 'Wir drücken dir die Daumen!',
    subtitle: 'Du hast ein Interview ergattert – das ist schon ein großer Erfolg!',
    accent: 'text-sky-600',
    headerGradient: 'from-sky-500 to-cyan-400',
  },
  offer: {
    emoji: '🎉',
    title: 'Herzlichen Glückwunsch!',
    subtitle: 'Du hast ein Angebot erhalten – fantastisch! Wir freuen uns riesig für dich.',
    accent: 'text-green-600',
    headerGradient: 'from-green-500 to-emerald-400',
  },
  rejected: {
    emoji: '😔',
    title: 'Schade ...',
    subtitle:
      'Das ist enttäuschend – aber kein Grund aufzugeben. Jede Absage bringt dich einem Ja näher.',
    accent: 'text-red-600',
    headerGradient: 'from-red-400 to-rose-400',
  },
};

interface StarRatingProps {
  value: number;
  onChange: (v: number) => void;
  accent: string;
}

function StarRating({ value, onChange, accent }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= (hovered || value);
        return (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(n)}
            className={`w-8 h-8 text-xl transition-all duration-100 select-none ${
              filled ? `opacity-100 scale-110 ${accent}` : 'opacity-30 text-gray-400'
            }`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

export function StatusCelebrationModal({
  status,
  jobTitle,
  company,
  onClose,
}: StatusCelebrationModalProps) {
  const content = CONTENT[status];
  const questions = QUESTIONS[status];

  const [visible, setVisible] = useState(false);
  const [ratings, setRatings] = useState<[number, number, number]>([0, 0, 0]);
  const [addonText, setAddonText] = useState('');
  const [freeText, setFreeText] = useState('');
  const [allowPublish, setAllowPublish] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user ?? null;

      const { error: dbError } = await supabase.from('user_feedback').insert({
        user_id: user?.id ?? null,
        trigger_status: status,
        job_title: jobTitle ?? null,
        company: company ?? null,
        rating_1: ratings[0] || null,
        rating_2: null,
        rating_3: ratings[1] || null,
        free_text: [
          addonText.trim() ? `Add-on Wunsch: ${addonText.trim()}` : '',
          freeText.trim() ? `Weiteres: ${freeText.trim()}` : '',
        ].filter(Boolean).join('\n\n') || null,
        allow_publish: allowPublish,
      });

      if (dbError) {
        setError('Feedback konnte nicht gespeichert werden. Bitte versuche es erneut.');
        return;
      }

      setSubmitted(true);
      setTimeout(handleClose, 1500);
    } catch {
      setError('Ein unbekannter Fehler ist aufgetreten.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        visible ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent'
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-lg transition-all duration-200 overflow-hidden ${
          visible
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`h-1.5 bg-gradient-to-r ${content.headerGradient}`} />

        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          <div className="text-center mb-5">
            <div className="text-4xl mb-2 select-none">{content.emoji}</div>
            <h2 className="text-xl font-bold text-gray-900">{content.title}</h2>
            {(jobTitle || company) && (
              <p className="text-sm text-gray-500 mt-1">
                {jobTitle && <span className="font-medium text-gray-700">{jobTitle}</span>}
                {jobTitle && company && <span className="text-gray-400"> bei </span>}
                {company && <span className="font-medium text-gray-700">{company}</span>}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">{content.subtitle}</p>
          </div>

          {!submitted ? (
            <>
              <div className="mb-1">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Hilf uns, DYD noch besser zu machen – beantworte kurz 3 Fragen:
                </p>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-3.5">
                    <p className="text-sm text-gray-700 mb-2">{questions[0]}</p>
                    <StarRating
                      value={ratings[0]}
                      onChange={(v) =>
                        setRatings((prev) => {
                          const next = [...prev] as [number, number, number];
                          next[0] = v;
                          return next;
                        })
                      }
                      accent={content.accent}
                    />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-sm text-gray-700 mb-2">{questions[1]}</p>
                    <textarea
                      value={addonText}
                      onChange={(e) => setAddonText(e.target.value)}
                      placeholder="z.B. Interview-Vorbereitung, Gehaltsverhandlung, ..."
                      rows={1}
                      className="w-full text-sm border border-gray-200 rounded-xl p-2 focus:outline-none focus:border-[#66c0b6] resize-none text-gray-700 placeholder-gray-300 transition-colors bg-white"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3.5">
                    <p className="text-sm text-gray-700 mb-2">{questions[2]}</p>
                    <StarRating
                      value={ratings[1]}
                      onChange={(v) =>
                        setRatings((prev) => {
                          const next = [...prev] as [number, number, number];
                          next[1] = v;
                          return next;
                        })
                      }
                      accent={content.accent}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Hast du noch weitere Gedanken? (optional)
                </label>
                <textarea
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder="Was können wir bei DYD noch besser machen?"
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-[#66c0b6] resize-none text-gray-700 placeholder-gray-300 transition-colors"
                />
              </div>

              <label className="flex items-start gap-3 mt-3 cursor-pointer select-none">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={allowPublish}
                    onChange={(e) => setAllowPublish(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      allowPublish
                        ? 'bg-[#66c0b6] border-[#66c0b6]'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {allowPublish && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-500 leading-relaxed">
                  Ich bin damit einverstanden, dass DYD mein Feedback (anonym) veröffentlichen
                  darf, um anderen Nutzern bei ihrer Entscheidung zu helfen.
                </span>
              </label>

              {error && (
                <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Überspringen
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#66c0b6] hover:bg-[#52b0a6] text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Wird gesendet…
                    </span>
                  ) : (
                    'Feedback absenden'
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🙏</div>
              <p className="text-base font-bold text-gray-800">Vielen Dank für dein Feedback!</p>
              <p className="text-sm text-gray-500 mt-1">
                Du hilfst uns, DYD jeden Tag besser zu machen.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
