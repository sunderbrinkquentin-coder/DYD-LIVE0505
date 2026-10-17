// src/pages/CoverLetterPage.tsx
//
// Öffentliche Anschreiben-Seite (#/anschreiben): Nutzen, Preis, Ablauf
// und eine interaktive Generator-Vorschau (Demo-Daten, keine Eingabe nötig).

import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, BadgeCheck, Check, ChevronDown, Clock, FileText, HelpCircle,
  PenLine, Quote, ShieldCheck, Sparkles, Wand2, Zap,
} from 'lucide-react';
import { COVER_LETTER_PRICE, formatEuro, REWRITE_PRESETS, ROLE_LABEL } from '../types/coverLetter';

const HOW_IT_WORKS = [
  { icon: FileText, title: 'Stellenanzeige + CV hochladen', desc: 'PDF oder Text – beides reicht. Kein Formular-Fragenkatalog am Anfang.' },
  { icon: HelpCircle, title: 'Kurzer Fragebogen', desc: '5 Fragen zu dir: Woher kommst du, was motiviert dich, was ist dein stärkstes Ergebnis?' },
  { icon: Zap, title: 'Anschreiben entsteht', desc: 'Unter 30 Minuten hast du ein fertiges Anschreiben – mit Erklärung zu jedem Absatz.' },
  { icon: Wand2, title: 'Anpassen & exportieren', desc: 'Per Klick kürzer, konkreter oder selbstbewusster. Export als Word-Datei.' },
];

const FAQ = [
  { q: 'Ist das Anschreiben wirklich von mir?', a: 'Ja – jede Aussage stammt aus deinem Lebenslauf oder deiner Stellenanzeige. Nichts wird erfunden. Zu jedem Absatz siehst du die Belege und kannst alles selbst umschreiben.' },
  { q: 'Warum nur 2,99 € statt Abo?', a: 'Weil ein Anschreiben ein einmaliger Bedarf ist. Du zahlst pro Anschreiben – kein Abo, keine Kündigungsfrist, keine versteckten Kosten.' },
  { q: 'Was ist der Unterschied zwischen 2,99 € und 3,99 €?', a: `Das KI-Anschreiben gibt es für ${formatEuro(COVER_LETTER_PRICE.single)}. In Kombination mit der CV-Optimierung kostet es nur ${formatEuro(COVER_LETTER_PRICE.addon)} – weil die KI dann deinen optimierten Lebenslauf direkt nutzt.` },
  { q: 'Erkenne ich das Anschreiben als KI-Text?', a: 'Nein. Die KI entfernt automatisch Floskeln („hiermit bewerbe ich mich…") und baut jeden Absatz um konkrete Belege aus deinem CV auf. Du kannst den Ton frei wählen und jeden Satz ändern.' },
  { q: 'Bekomme ich eine Word-Datei?', a: 'Ja. Nach dem Freischalten exportierst du das Anschreiben als Word-Datei im DIN-5008-Format – fertig zum Hochladen im Bewerberportal.' },
  { q: 'Wie schnell ist das Anschreiben fertig?', a: 'In der Regel unter 30 Minuten von der Stellenanzeige bis zum fertigen Entwurf – inklusive Fragebogen.' },
];

type SourceTag = { type: 'job' | 'cv'; quote: string };

type DemoParagraph = {
  id: string;
  role: keyof typeof ROLE_LABEL;
  text: string;
  why: string;
  sources: SourceTag[];
};

const DEMO_PARAGRAPHS: DemoParagraph[] = [
  {
    id: 'p1',
    role: 'einstieg',
    text: 'Als Recruiterin habe ich in den letzten zwei Jahren die Time-to-Hire für 40 Vertriebsstellen um 30 % gesenkt – genau diese Erfahrung möchte ich bei Ihnen in die strategische HR-Partnerschaft einbringen.',
    why: 'Recruiter entscheiden in Sekunden. Statt einer Floskel startest du mit deinem stärksten, messbaren Ergebnis – und verbindest es direkt mit der Kernaufgabe aus der Anzeige.',
    sources: [
      { type: 'job', quote: 'Anzeige: „strategische HR-Partnerschaft“' },
      { type: 'cv', quote: 'Dein CV: „Time-to-Hire −30 %“' },
    ],
  },
  {
    id: 'p2',
    role: 'motivation',
    text: 'Besonders gereizt hat mich, dass Sie Recruiting und Personalentwicklung in einem Team bündeln – die Schnittstelle, in der ich in den letzten Jahren am meisten gewachsen bin.',
    why: 'Zeigt, dass du die Anzeige wirklich gelesen hast – und verknüpft deine Entwicklung mit der konkreten Struktur des Unternehmens.',
    sources: [{ type: 'job', quote: 'Anzeige: „Recruiting & PE in einem Team“' }],
  },
  {
    id: 'p3',
    role: 'qualifikation',
    text: 'Mit meinem Personalerzertifikat (IHK) und 60 geführten Erstgesprächen pro Quartal bringe ich das Durchhaltevermögen und Strukturdenken mit, das Ihre Ausschreibung für den Bereich Active Sourcing fordert.',
    why: 'Zwei Belege statt Adjektive: ein Nachweis und eine Zahl aus deinem CV – direkt gemappt auf die Anforderung „Active Sourcing“.',
    sources: [
      { type: 'cv', quote: 'Dein CV: „IHK Personalerzertifikat“' },
      { type: 'cv', quote: 'Dein CV: „60 Erstgespräche/Quartal“' },
      { type: 'job', quote: 'Anzeige: „Active Sourcing“' },
    ],
  },
];

function DemoLetter() {
  const [open, setOpen] = useState<string | null>('p1');
  const [appliedPreset, setAppliedPreset] = useState<string | null>(null);

  const presets = useMemo(
    () => REWRITE_PRESETS.map((label) => label.split(' ').slice(0, 2).join(' ')),
    [],
  );

  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[2rem] opacity-30 blur-2xl" style={{ background: 'radial-gradient(circle at 30% 30%, #66c0b6, transparent 70%)' }} aria-hidden="true" />
      <div className="relative rounded-2xl bg-white p-5 text-left shadow-2xl sm:p-6">
        <div className="mb-1 flex items-center justify-between gap-3">
          <p className="text-[13px] font-bold text-gray-900">Bewerbung als HR Business Partner</p>
          <span className="flex items-center gap-1 rounded-full bg-[#66c0b6]/15 px-2 py-0.5 text-[10px] font-bold text-[#3a9e94]">
            <BadgeCheck className="h-3 w-3" /> Live-Vorschau
          </span>
        </div>
        <p className="mb-4 text-[11px] text-gray-400">Beispiel aus echten Generator-Ausgaben – klicke auf einen Absatz.</p>

        <div className="space-y-2">
          {DEMO_PARAGRAPHS.map((p) => {
            const isOpen = open === p.id;
            const shownText = appliedPreset
              ? `${p.text} ${appliedPreset === 'Kürzer und' ? '– Kompakt, ohne Füllwörter.' : appliedPreset === 'Konkreter mit' ? 'Die Zahl stammt direkt aus deinem CV.' : 'So wie es sich gehört.'}`
              : p.text;
            return (
              <div key={p.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : p.id)}
                  aria-expanded={isOpen}
                  className="w-full text-left"
                >
                  <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {ROLE_LABEL[p.role]}
                    <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </p>
                  <p className="text-[13px] leading-relaxed text-gray-800">{shownText}</p>
                </button>
                {isOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                    <div className="mt-2.5 rounded-lg border border-[#66c0b6]/25 bg-[#66c0b6]/[0.07] p-2.5">
                      <p className="flex items-center gap-1 text-[11px] font-semibold text-[#3a9e94]">
                        <HelpCircle className="h-3 w-3" /> Warum steht das hier?
                      </p>
                      <p className="mt-1 text-[12px] leading-relaxed text-gray-700">{p.why}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {p.sources.map((s) => (
                          <span key={s.quote} className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] ${s.type === 'job' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
                            <Quote className="h-2.5 w-2.5" /> {s.quote}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mb-1.5 mt-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Per Klick umschreiben</p>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((t, i) => {
            const active = appliedPreset === t;
            return (
              <button
                key={REWRITE_PRESETS[i]}
                type="button"
                onClick={() => setAppliedPreset(active ? null : t)}
                className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] transition ${active ? 'border-[#66c0b6] bg-[#66c0b6]/10 text-[#3a9e94]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                <Wand2 className="h-2.5 w-2.5" /> {t}
              </button>
            );
          })}
          <span className="ml-auto flex items-center gap-1 text-[11px] text-[#3a9e94]">
            <Check className="h-3 w-3" /> Word-Export
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CoverLetterPage() {
  const navigate = useNavigate();
  const target = '/dashboard?anschreiben=1';
  const cta = () => navigate(`/login?redirect=${encodeURIComponent(target)}`);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#0A192F] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A192F]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/" className="font-poppins text-lg font-black tracking-tight">
            Decide<span className="text-[#30E3CA]">Your</span>Dream
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <Link to="/pricing" className="transition hover:text-white">CV-Analyse</Link>
            <Link to="/business" className="transition hover:text-white">Für Unternehmen</Link>
            <Link to="/faq" className="transition hover:text-white">FAQ</Link>
          </nav>
          <button
            type="button"
            onClick={cta}
            className="rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] px-4 py-2 text-sm font-bold text-black transition hover:opacity-90"
          >
            Kostenlose Vorschau
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pt-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(700px 400px at 20% 10%, rgba(102,192,182,0.14), transparent 60%), radial-gradient(800px 450px at 85% 30%, rgba(48,227,202,0.10), transparent 60%)' }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#66c0b6]/30 bg-[#66c0b6]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#66c0b6]">
              <PenLine className="h-3 w-3" /> KI-Anschreiben von DYD
            </div>
            <h1 className="mb-5 font-poppins text-4xl font-black leading-[1.05] sm:text-5xl" style={{ letterSpacing: '-0.03em' }}>
              Das Anschreiben, das du{' '}
              <span className="bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] bg-clip-text text-transparent">wirklich verstehst</span>
            </h1>
            <p className="mb-4 max-w-xl leading-relaxed text-white/70">
              DYD schreibt dein Anschreiben direkt aus der Stellenanzeige und deinem Lebenslauf – und zeigt dir bei jedem
              Absatz, warum er drinsteht und welche Aussage aus deinem CV belegt ist. Damit du es im Interview auch vertreten kannst.
            </p>
            <ul className="mb-8 space-y-2">
              {[
                'Jede Aussage mit CV-Beleg – nichts erfunden',
                'Erklärung zu jedem Absatz',
                'Fertig in unter 30 Minuten',
              ].map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm text-white/80">
                  <Check className="h-4 w-4 flex-shrink-0 text-[#66c0b6]" /> {t}
                </li>
              ))}
            </ul>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={cta}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] px-6 py-3.5 font-bold text-black shadow-lg transition hover:opacity-90"
              >
                Kostenlose Vorschau erstellen <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-sm text-white/55" data-ai-fact="price-cover-letter">
                Danach <b className="text-white">{formatEuro(COVER_LETTER_PRICE.single)}</b> · mit CV-Optimierung nur{' '}
                <b className="text-white">{formatEuro(COVER_LETTER_PRICE.addon)}</b> · kein Abo
              </p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
            <DemoLetter />
          </motion.div>
        </div>
      </section>

      {/* Warum kein Abo / Nutzen */}
      <section className="border-y border-white/5 bg-[#07111f] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center font-poppins text-3xl font-black sm:text-4xl"
            style={{ letterSpacing: '-0.03em' }}
          >
            Warum Bewerber:innen das Anschreiben von DYD nehmen
          </motion.h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Sparkles, title: 'Passgenau statt Vorlage', desc: 'Aus Stellenanzeige + deinem CV – jede Aussage ist mit deinem Lebenslauf belegt, nichts erfunden.' },
              { icon: HelpCircle, title: 'Du verstehst jeden Satz', desc: 'Zu jedem Absatz erklären wir, warum er so formuliert ist und welche Anforderung aus der Anzeige er abdeckt.' },
              { icon: Wand2, title: 'Frei anpassbar', desc: 'Selbst umschreiben oder per Klick: kürzer, konkreter, selbstbewusster. Export als Word-Datei.' },
              { icon: Clock, title: 'Unter 30 Minuten', desc: 'Von der Stellenanzeige bis zum fertigen Anschreiben – inklusive kurzen Fragebogen zu dir.' },
              { icon: ShieldCheck, title: 'Floskel-Filter', desc: 'Die KI entfernt automatisch Standardfloskeln wie „hiermit bewerbe ich mich“ – bevor du sie siehst.' },
              { icon: BadgeCheck, title: 'Kein Abo', desc: `Zahle nur, wenn du ein Anschreiben freischaltest: ${formatEuro(COVER_LETTER_PRICE.single)} – oder ${formatEuro(COVER_LETTER_PRICE.addon)} mit CV-Optimierung.` },
            ].map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#66c0b6]/15">
                  <b.icon className="h-5 w-5 text-[#66c0b6]" />
                </div>
                <h3 className="mb-1.5 font-poppins font-bold">{b.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ablauf */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center font-poppins text-3xl font-black sm:text-4xl"
            style={{ letterSpacing: '-0.03em' }}
          >
            So läuft es ab
          </motion.h2>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((s, i) => (
              <motion.li
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <span className="absolute right-5 top-5 font-poppins text-4xl font-black text-white/[0.07]">{i + 1}</span>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#66c0b6] to-[#30E3CA]">
                  <s.icon className="h-5 w-5 text-[#0A192F]" />
                </div>
                <h3 className="mb-1.5 font-poppins font-bold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{s.desc}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-white/5 bg-[#07111f] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center font-poppins text-3xl font-black sm:text-4xl"
            style={{ letterSpacing: '-0.03em' }}
          >
            Häufige Fragen zum Anschreiben
          </motion.h2>
          <div className="space-y-3">
            {FAQ.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={f.q} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="font-poppins text-sm font-bold sm:text-base">{f.q}</span>
                    <ChevronDown className={`h-4 w-4 flex-shrink-0 text-[#66c0b6] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="overflow-hidden px-5 pb-4 text-sm leading-relaxed text-white/65"
                    >
                      {f.a}
                    </motion.p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Abschluss-CTA */}
      <section className="px-4 py-20 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl rounded-[2rem] border border-[#66c0b6]/25 bg-[#66c0b6]/[0.06] p-8 sm:p-12"
        >
          <h2 className="mb-3 font-poppins text-3xl font-black sm:text-4xl" style={{ letterSpacing: '-0.03em' }}>
            Deine nächste Bewerbung verdient ein echtes Anschreiben
          </h2>
          <p className="mb-6 text-white/65">
            Starte mit der kostenlosen Vorschau – du siehst sofort Einstieg und Erklärungen, bevor du etwas zahlst.
          </p>
          <button
            type="button"
            onClick={cta}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] px-8 py-4 font-bold text-black shadow-lg transition hover:opacity-90"
          >
            Kostenlose Vorschau erstellen <ArrowRight className="h-4 w-4" />
          </button>
          <p className="mt-4 text-sm text-white/55">
            {formatEuro(COVER_LETTER_PRICE.single)} pro Anschreiben · {formatEuro(COVER_LETTER_PRICE.addon)} mit CV-Optimierung · kein Abo
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} DecideYourDream · quentin@decideyourdream.de</p>
          <div className="flex gap-5">
            <Link to="/impressum" className="transition hover:text-white">Impressum</Link>
            <Link to="/datenschutz" className="transition hover:text-white">Datenschutz</Link>
            <Link to="/agb" className="transition hover:text-white">AGB</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
