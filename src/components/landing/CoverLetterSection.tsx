import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, HelpCircle, PenLine, Quote, Sparkles, Wand2 } from 'lucide-react';
import { COVER_LETTER_PRICE, formatEuro } from '../../types/coverLetter';

interface CoverLetterSectionProps {
  isLoggedIn: boolean;
}

const BENEFITS = [
  { icon: Sparkles, title: 'Passgenau statt Vorlage', text: 'Aus Stellenanzeige + deinem CV – jede Aussage ist mit deinem Lebenslauf belegt, nichts erfunden.' },
  { icon: HelpCircle, title: 'Du verstehst jeden Satz', text: 'Zu jedem Absatz erklären wir, warum er so formuliert ist und welche Anforderung er abdeckt.' },
  { icon: Wand2, title: 'Frei anpassbar', text: 'Selbst umschreiben oder per Klick: kürzer, konkreter, selbstbewusster. Export als Word.' },
];

export function CoverLetterSection({ isLoggedIn }: CoverLetterSectionProps) {
  const navigate = useNavigate();
  const cta = () => navigate(isLoggedIn ? '/dashboard#kanban-section' : '/login?redirect=/dashboard');

  return (
    <section
      id="anschreiben"
      className="px-4 py-16 sm:px-6 lg:px-8"
      aria-label={`KI-Anschreiben mit Erklärung zu jedem Absatz – ab ${formatEuro(COVER_LETTER_PRICE.addon)}`}
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid items-center gap-10 lg:grid-cols-2"
        >
          {/* Text */}
          <div className="space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#66c0b6]/30 bg-[#66c0b6]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#66c0b6]">
              <PenLine className="h-3 w-3" /> Neu: KI-Anschreiben
            </div>
            <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl">
              Das Anschreiben, das du{' '}
              <span className="bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] bg-clip-text text-transparent">wirklich verstehst</span>
            </h2>
            <p className="mx-auto max-w-xl leading-relaxed text-white/60 lg:mx-0">
              Kein Copy-Paste-Text von der Stange: DYD schreibt dein Anschreiben direkt aus der Stellenanzeige und deinem
              Lebenslauf – und zeigt dir bei jedem Absatz, warum er drinsteht. So kannst du es im Interview auch vertreten.
            </p>

            <ul className="space-y-3 text-left">
              {BENEFITS.map((b) => (
                <li key={b.title} className="flex gap-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#66c0b6]/15">
                    <b.icon className="h-4 w-4 text-[#66c0b6]" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{b.title}</span>
                    <span className="block text-sm text-white/55">{b.text}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row lg:items-center">
              <button
                onClick={cta}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] px-6 py-3 font-bold text-black shadow-lg transition-all hover:opacity-90"
              >
                Kostenlose Vorschau erstellen <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-sm text-white/55" data-ai-fact="price-cover-letter">
                Danach <b className="text-white">{formatEuro(COVER_LETTER_PRICE.single)}</b> · mit CV-Optimierung nur{' '}
                <b className="text-white">{formatEuro(COVER_LETTER_PRICE.addon)}</b> · kein Abo
              </p>
            </div>
          </div>

          {/* Mockup */}
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] opacity-30 blur-2xl" style={{ background: 'radial-gradient(circle at 30% 30%, #66c0b6, transparent 70%)' }} />
            <div className="relative rounded-2xl bg-white p-5 text-left shadow-2xl">
              <p className="mb-2 text-[13px] font-bold text-gray-900">Bewerbung als HR Business Partner</p>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Einstieg</p>
              <p className="text-[13px] leading-relaxed text-gray-800">
                Als Recruiterin habe ich in den letzten zwei Jahren die Time-to-Hire für 40 Vertriebsstellen um 30 % gesenkt –
                genau diese Erfahrung möchte ich bei Ihnen in die strategische HR-Partnerschaft einbringen.
              </p>
              <div className="mt-2 rounded-lg border border-[#66c0b6]/25 bg-[#66c0b6]/[0.07] p-2.5">
                <p className="flex items-center gap-1 text-[11px] font-semibold text-[#3a9e94]">
                  <HelpCircle className="h-3 w-3" /> Warum steht das hier?
                </p>
                <p className="mt-1 text-[12px] text-gray-700">
                  Recruiter entscheiden in Sekunden. Statt einer Floskel startest du mit deinem stärksten, messbaren
                  Ergebnis – und verbindest es direkt mit der Kernaufgabe aus der Anzeige.
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px]">
                  <span className="flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-blue-700">
                    <Quote className="h-2.5 w-2.5" /> Anzeige: „strategische HR-Partnerschaft“
                  </span>
                  <span className="flex items-center gap-1 rounded bg-teal-100 px-1.5 py-0.5 text-teal-700">
                    <Quote className="h-2.5 w-2.5" /> Dein CV: „Time-to-Hire −30 %“
                  </span>
                </div>
              </div>
              <p className="mb-1 mt-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Qualifikation</p>
              <p aria-hidden className="select-none text-[13px] leading-relaxed text-gray-800 blur-[4px]">
                Mit meiner Erfahrung in vergleichbaren Projekten bringe ich genau die Kompetenzen mit, die Sie in Ihrer
                Ausschreibung beschreiben, insbesondere im Bereich Personalentwicklung.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['Kürzer', 'Konkreter', 'Selbstbewusster'].map((t) => (
                  <span key={t} className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600">
                    <Wand2 className="h-2.5 w-2.5" /> {t}
                  </span>
                ))}
                <span className="ml-auto flex items-center gap-1 text-[11px] text-[#3a9e94]">
                  <Check className="h-3 w-3" /> Word-Export
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
