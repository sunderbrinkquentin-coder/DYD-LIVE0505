import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HelpCircle, ArrowRight, Upload, FileText, ChevronDown, Sparkles, Target, Shield } from 'lucide-react';
import { FaqSchema } from '../components/seo/FaqSchema';
import { designSystem } from '../styles/designSystem';

export default function FaqPage() {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<number | null>(0);

  useEffect(() => {
    document.title = 'DYD CV-Check & Lebenslauf Generator – FAQ';

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Alle Antworten zu deinem perfekten Lebenslauf: CV-Analyse, ATS-Optimierung, Harmony KI-Assistent und vieles mehr bei DYD – Decide Your Dream.'
      );
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Alle Antworten zu deinem perfekten Lebenslauf: CV-Analyse, ATS-Optimierung, Harmony KI-Assistent und vieles mehr bei DYD – Decide Your Dream.';
      document.head.appendChild(meta);
    }
  }, []);

  const faqCategories = [
    {
      title: 'Erste Schritte',
      icon: Sparkles,
      faqs: [
        {
          question: 'Was ist DYD – Decide Your Dream?',
          answer:
            'DYD ist deine intelligente Plattform für einen perfekten Lebenslauf – gemacht von Menschen, die verstehen, wie wichtig dein CV für deine Karriere ist. Hier analysieren wir deinen Lebenslauf mit echtem Durchblick und geben dir konkrete Verbesserungsvorschläge, damit dein CV nicht nur schön aussieht, sondern auch bei den Unternehmen durchkommt.',
          details:
            'Mit unserem CV-Check und CV-Wizard haben wir eine Plattform entwickelt, die dich wirklich weiterbringt – ohne den ganzen Umschweif. Dein CV wird auf Herz und Nieren geprüft: Formatierung, Keywords, ATS-Kompatibilität, Inhalt. Du erhältst ehrliches Feedback und konkrete Verbesserungsvorschläge. So wird aus einem guten CV ein großartiger CV, mit dem du wirklich Chancen hast.',
        },
        {
          question: 'Wer steckt hinter DYD?',
          answer:
            'DYD ist von Decide Your Dream UG entwickelt – von Menschen, die selbst die Frustration der Jobsuche kennen und etwas daran ändern wollten.',
          details:
            'Wir verstehen, wie schwierig es sein kann, seine Fähigkeiten in einem CV richtig zu transportieren. Deshalb haben wir DYD nicht aus reiner Gewinnsucht gebaut, sondern aus echtem Willen, dir zu helfen. Wir wollen, dass dein Lebenslauf dich wirklich repräsentiert – und dass du die Chancen bekommst, die du verdienst.',
        },
        {
          question: 'Kostet DYD wirklich etwas?',
          answer:
            'Der CV-Check ist kostenlos – probiere ihn aus und sehe selbst, wie hilfreich er ist. Für mehr Analysen brauchst du Token, unser Guthaben-System.',
          details:
            'Token sind dein Guthaben bei DYD. Du kaufst dir Token-Pakete – ganz ohne Abo oder versteckte Gebühren – und nutzt sie, wann du möchtest. So zahlst du nur für das, was du wirklich brauchst. Und das Beste: Die Token verfallen nicht. Du kannst sie jederzeit verwenden.',
        },
      ],
    },
    {
      title: 'CV-Analyse & Technik',
      icon: Target,
      faqs: [
        {
          question: 'Wie funktioniert die CV-Analyse?',
          answer:
            'Du lädst deinen Lebenslauf als PDF hoch, und schon geht\'s los. Die Analyse läuft vollautomatisch – in wenigen Minuten erhältst du einen detaillierten Report.',
          details:
            'Nach dem Upload wird dein CV gründlich geprüft: ATS-Kompatibilität (passt dein CV in automatische Scanning-Systeme?), Keywords (enthältst du die relevanten Begriffe?), Struktur (ist dein CV übersichtlich?), Rechtschreibung und Formatierung. Du erhältst danach einen detaillierten Report mit Scores und konkreten Verbesserungen, die dir helfen, deinen CV zu optimieren.',
        },
        {
          question: 'Was bedeutet ATS und warum ist das wichtig?',
          answer:
            'ATS steht für Applicant Tracking System – das sind automatische Filter-Systeme, die große Unternehmen nutzen, um Bewerbungen zu scannen. Dein CV muss erst diesen Test bestehen, bevor ihn ein echter Mensch überhaupt zu sehen bekommt.',
          details:
            'ATS-Systeme suchen nach bestimmten Keywords und Formatierungen. Wenn dein CV „falsch" formatiert ist (z.B. seltsame Fonts, Tabellen oder Grafiken), kann das System ihn nicht richtig lesen – und deine Bewerbung verschwindet. Unser CV-Check prüft genau das. So kannst du sichergehen, dass dein CV auch wirklich bei den Unternehmen ankommt.',
        },
        {
          question: 'Kann ich meinen CV mit dem CV-Wizard erstellen?',
          answer:
            'Absolut! Der CV-Wizard führt dich Schritt für Schritt durch die Erstellung – mit Fragen zu deinen Daten, Erfahrungen und Fähigkeiten. Am Ende erhältst du einen professionell formatierten Lebenslauf als PDF.',
          details:
            'Der Wizard beginnt mit deinen Grunddaten, geht über deine Berufserfahrung, Ausbildung und Skills. Bei jedem Eintrag bekommst du Vorschläge für bessere Formulierungen. Am Ende kannst du aus verschiedenen modernen Vorlagen wählen. Der Export erfolgt als PDF – perfekt für sofort versenden.',
        },
        {
          question: 'Was prüft der CV-Check alles in meinem CV?',
          answer:
            'Der CV-Check analysiert deinen Lebenslauf in vielen Kategorien: Struktur, Keywords, Formatierung, ATS-Kompatibilität, Rechtschreibung, Länge und Relevanz – und noch mehr.',
          details:
            'Für jede Kategorie bekommst du einen ehrlichen Score und konkretes Feedback. Der Check zeigt dir auch genau, wo Probleme sind – z.B. „Wichtige Keywords aus deiner Branche sind unterrepräsentiert" oder „Das PDF hat eine Formatierungsproblematik". Du erhältst konkrete Tipps, wie du es besser machst.',
        },
      ],
    },
    {
      title: 'Lebenslauf & Technisches',
      icon: FileText,
      faqs: [
        {
          question: 'Welche CV-Vorlagen gibt es?',
          answer:
            'Du kannst aus mehreren modernen, professionellen Vorlagen wählen: Classic, Professional, Minimal, Modern und Creative. Jede wurde speziell für ATS-Systeme optimiert.',
          details:
            'Jede Vorlage wurde mit realen ATS-Systemen getestet – damit du sichergehen kannst, dass dein CV auch wirklich gelesen wird. Du kannst die Vorlagen jederzeit wechseln, ohne dass deine Daten verloren gehen. Wähle die Vorlage, die zu dir und deiner Branche passt.',
        },
        {
          question: 'In welchem Format kann ich meinen CV herunterladen?',
          answer:
            'Dein CV wird als PDF heruntergeladen – das ist das sichere, universelle Format für alle Bewerbungen.',
          details:
            'PDF garantiert, dass dein CV überall gleich aussieht – bei jeder Bewerbung, auf jedem Rechner. Keine Überraschungen durch unterschiedliche Software. Das Format ist außerdem vollständig ATS-optimiert und funktioniert problemlos in allen Bewerbungsportalen. Einfach hochladen und senden.',
        },
        {
          question: 'Wie sicher sind meine Daten wirklich gespeichert?',
          answer:
            'Deine CVs und Analyseergebnisse werden mit höchsten Sicherheitsstandards bei Supabase gespeichert – einem Backend-Service, dem auch große Tech-Unternehmen vertrauen.',
          details:
            'Alle deine Daten werden verschlüsselt übertragen und gespeichert. Nur du hast Zugriff – das ist durch starke Sicherheitsrichtlinien gewährleistet. Wir verkaufen oder teilen deine Daten mit niemandem. Wenn du dein Konto löschst, können wir alles auf Wunsch vollständig entfernen. Das ist dir wichtig – uns auch.',
        },
        {
          question: 'Was sind Token und wie viele brauche ich?',
          answer:
            'Token sind dein Guthaben bei DYD. Mit jedem Token kannst du eine Aktion durchführen – einen CV-Check oder eine Optimierung.',
          details:
            'Für einen CV-Check brauchst du 1 Token. Du kaufst Token-Pakete – ganz flexibel, ohne Abo – und nutzt sie, wann du möchtest. Sie verfallen nicht und sind immer verfügbar. So hast du volle Kontrolle über dein Budget und kannst genau so viel oder wenig nutzen, wie du brauchst.',
        },
      ],
    },
    {
      title: 'Bezahlung & Datenschutz',
      icon: Shield,
      faqs: [
        {
          question: 'Wie funktioniert die Bezahlung?',
          answer:
            'Wir nutzen Stripe – einen der sichersten Zahlungsanbieter weltweit. Du wählst dein Token-Paket und wirst weitergeleitet. Das war\'s.',
          details:
            'Nach der Bezahlung wird dein Token-Guthaben sofort gutgeschrieben – du siehst es direkt im Dashboard. Stripe speichert deine Zahlungsdaten sicher – wir sehen diese nicht. Du kannst per Kreditkarte, PayPal oder Banküberweisung bezahlen. Einfach, sicher, transparent.',
        },
        {
          question: 'Werden meine Zahlungsdaten bei euch gespeichert?',
          answer:
            'Nein, absolut nicht. Deine Zahlungsdaten bleiben privat – nur zwischen dir und Stripe.',
          details:
            'Wir sehen nur, dass die Zahlung geklappt hat und wie viele Token du jetzt hast. Kreditkartennummern, Bankinformationen – das bleibt komplett privat zwischen dir und Stripe. So ist dein Geld und deine Privatsphäre 100% geschützt. Auch wenn wir gehackt würden (was wir nicht wollen!), können deine Zahlungsdaten nicht betroffen sein.',
        },
        {
          question: 'Wie lange werden meine CVs und Analysen gespeichert?',
          answer:
            'Solange du möchtest. Deine CVs und Analyseergebnisse bleiben in deinem Konto verfügbar. Du kannst sie jederzeit herunterladen oder löschen.',
          details:
            'Wenn du dein Konto löschst, werden alle deine Daten innerhalb von 30 Tagen vollständig aus unseren Systemen entfernt – wirklich alles. Das ist rechtlich so vorgesehen und wir halten uns dran. Du kannst jederzeit eine Kopie deiner Daten anfordern (dein Datenschutzrecht). Bei uns hast du die volle Kontrolle.',
        },
        {
          question: 'Verkauft ihr meine Daten weiter?',
          answer:
            'Definitiv nicht. Deine Daten gehören dir – nicht uns.',
          details:
            'Wir nutzen deine Daten nur, um dir DYD zu ermöglichen. Wir verkaufen, teilen oder weitergeben nichts – nicht an Unternehmen, nicht an Recruiter, nicht an wen auch immer. Das steht in unserer Datenschutzerklärung und wir nehmen das ernst. Dein Vertrauen ist das wertvollste, was wir haben.',
        },
      ],
    },
    {
      title: 'Harmony – Unser Festival',
      icon: Sparkles,
      faqs: [
        {
          question: 'Was ist Harmony?',
          answer:
            'Harmony ist nicht nur ein KI-Tool – Harmony ist unser Festival für deine Träume! Es ist eine Gemeinschaft und Plattform, auf der Menschen wie du ihre Karriereziele feiern, sich austauschen und gemeinsam wachsen.',
          details:
            'Harmony bringt Jobsuchende, Berufseinsteiger und Profis zusammen. Hier findest du nicht nur Technologie, sondern echte Unterstützung, Inspiration und Community. Wir glauben: Deine Karriere sollte Spaß machen. Mit Harmony kreierst du nicht nur einen besseren CV – du wirst Teil einer Bewegung, die Bewerbungen neu denkt.',
        },
        {
          question: 'Wie bin ich Teil von Harmony?',
          answer:
            'Wenn du DYD nutzt, bist du bereits Teil von Harmony! Du wirst Teil einer Community, die sich gegenseitig unterstützt und inspiriert.',
          details:
            'Mit deinem Account bei DYD trittst du dem Harmony-Festival bei. Du kannst in der Community teilnehmen, von anderen lernen, Tipps geben und gemeinsam mit Hunderten anderen an deiner Traumkarriere arbeiten. Das ist nicht nur eine Plattform – das ist dein Netzwerk.',
        },
        {
          question: 'Was bekomme ich als Teil von Harmony?',
          answer:
            'Du bekommst Zugang zu einer unterstützenden Community, exklusive Tipps, Inspiration und das Gefühl, nicht alleine zu sein bei deiner Jobsuche.',
          details:
            'Harmony bietet dir: Austausch mit anderen Jobsuchenden, regelmäßige Tipps und Best Practices für die Jobsuche, Zugang zu Events und Workshops, und die Gewissheit, dass du Teil von etwas Größerem bist. Deine Erfolgsgeschichte könnte die nächste sein, die andere inspiriert.',
        },
      ],
    },
    {
      title: 'Hilfe & Support',
      icon: HelpCircle,
      faqs: [
        {
          question: 'Mein CV-Check dauert länger als 5 Minuten. Was ist los?',
          answer:
            'Das kann passieren. Der CV-Check muss deinen PDF einlesen und dann gründlich analysieren. Bei großeren Dateien oder vielen gleichzeitigen Anfragen kann das etwas dauern.',
          details:
            'Normalerweise sind Analysen nach 2-5 Minuten fertig. Wenn es deutlich länger dauert, überprüfe: 1) Hast du eine stabile Internetverbindung? 2) Ist deine PDF-Datei zu groß (ideal: unter 5 MB)? 3) Versuche, die Seite zu aktualisieren. 4) Probiere einen anderen Browser. Wenn es immer noch nicht klappt, schreib uns gerne – wir helfen dir gerne weiter!',
        },
        {
          question: 'Mein PDF wird nicht hochgeladen. Was kann ich tun?',
          answer:
            'Das kann mehrere Gründe haben. Lass mich dir helfen, das zu lösen!',
          details:
            'Überprüfe folgende Punkte: 1) Ist es wirklich eine PDF-Datei (nicht Word, nicht Bild)? 2) Ist die Datei kleiner als 10 MB? 3) Versuche einen anderen Browser – manchmal ist das der Kniff. 4) Leere deinen Browser-Cache. 5) Versuche es mit einem anderen Device. Wenn das alles nicht hilft, schreib uns ruhig eine E-Mail – wir kümmer uns um dein Problem!',
        },
        {
          question: 'Ich habe Feedback oder Feature-Ideen. Wo höre ich das?',
          answer:
            'Dein Feedback ist uns richtig wichtig – sag gerne Bescheid!',
          details:
            'Schreib uns einfach eine E-Mail oder nutze das Feedback-Formular auf der Seite. Wir lesen wirklich jedes Feedback und arbeiten aktiv danach. Viele Features sind bereits von Nutzer-Vorschlägen entstanden. Du möchtest neue Funktionen sehen? Dann sag Bescheid – vielleicht ist deine Idee die nächste, die wir umsetzen!',
        },
      ],
    },
  ];

  const allFaqs = faqCategories.flatMap(cat => cat.faqs);
  const faqSchemaData = allFaqs.map((faq) => ({
    question: faq.question,
    answer: `${faq.answer} ${faq.details}`,
  }));

  return (
    <>
      <FaqSchema faqs={faqSchemaData} />

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20">
          {/* Header */}
          <motion.div
            className="text-center mb-16 sm:mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-[#66c0b6] animate-pulse" />
              <h1 className={designSystem.headings.h1}>Häufig gestellte Fragen</h1>
            </div>
            <p className={`${designSystem.text.secondary} text-lg sm:text-xl max-w-2xl mx-auto`}>
              Alles, was du über deinen perfekten Lebenslauf und Harmony wissen musst
            </p>
          </motion.div>

          {/* FAQ Categories */}
          <div className="space-y-12 sm:space-y-16">
            {faqCategories.map((category, categoryIndex) => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={categoryIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-gradient-to-br from-[#66c0b6] to-[#4a8b82] rounded-lg">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h2 className={`${designSystem.headings.h2} text-2xl`}>{category.title}</h2>
                  </div>

                  {/* FAQ Items in Category */}
                  <div className="space-y-4">
                    {category.faqs.map((faq, faqIndex) => {
                      const itemId = `${categoryIndex}-${faqIndex}`;
                      const isExpanded = expandedId === itemId;

                      return (
                        <motion.div
                          key={itemId}
                          className="group"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.4, delay: faqIndex * 0.05 }}
                        >
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : itemId)}
                            className="w-full text-left p-6 rounded-lg bg-gradient-to-r from-white/5 to-white/0 hover:from-white/10 hover:to-white/5 border border-white/10 hover:border-[#66c0b6]/30 transition-all duration-300 group"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <h3 className={`${designSystem.headings.h3} text-lg flex-1`}>
                                {faq.question}
                              </h3>
                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex-shrink-0 mt-1"
                              >
                                <ChevronDown className="w-5 h-5 text-[#66c0b6] group-hover:text-[#7dd9cf]" />
                              </motion.div>
                            </div>
                          </button>

                          {/* Answer Section */}
                          <motion.div
                            initial={false}
                            animate={{
                              height: isExpanded ? 'auto' : 0,
                              opacity: isExpanded ? 1 : 0,
                              marginTop: isExpanded ? 8 : 0,
                            }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 pt-0 text-white/70 space-y-4">
                              <p className="leading-relaxed text-base">
                                {faq.answer}
                              </p>
                              {faq.details && (
                                <p className={`${designSystem.text.muted} leading-relaxed text-sm`}>
                                  {faq.details}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* CTA Section */}
          <motion.div
            className="mt-16 sm:mt-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#66c0b6]/10 via-[#4a8b82]/10 to-transparent p-8 sm:p-12 border border-[#66c0b6]/20 hover:border-[#66c0b6]/40 transition-all duration-300">
              {/* Gradient Orb Background */}
              <div className="absolute -right-20 -top-20 w-40 h-40 bg-[#66c0b6]/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 text-center">
                <h2 className={`${designSystem.headings.h2} mb-4`}>
                  Es ist Zeit für deinen großen Traum
                </h2>
                <p className={`${designSystem.text.secondary} text-lg mb-3 max-w-2xl mx-auto`}>
                  Dein perfekter Lebenslauf wartet – und ein ganzes Festival unterstützt dich dabei.
                </p>
                <p className={`${designSystem.text.muted} text-base mb-8 max-w-2xl mx-auto`}>
                  Starte kostenlos mit einer CV-Analyse oder erstelle mit unserem Wizard deinen neuen Lebenslauf. Tritt Harmony bei und werde Teil einer Community, die wirklich an dich glaubt.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate('/cv-check')}
                    className={`${designSystem.buttons.primary} group/btn inline-flex items-center justify-center`}
                  >
                    <Upload className="w-5 h-5 mr-2 group-hover/btn:scale-110 transition-transform" />
                    CV kostenlos analysieren
                  </button>
                  <button
                    onClick={() => navigate('/cv-wizard')}
                    className={`${designSystem.buttons.secondary} group/btn inline-flex items-center justify-center`}
                  >
                    <Sparkles className="w-5 h-5 mr-2 group-hover/btn:scale-110 transition-transform" />
                    Neuen CV erstellen
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Back to Home */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <button
              onClick={() => navigate('/')}
              className={`${designSystem.buttons.ghost} hover:text-[#66c0b6]`}
            >
              Zurück zur Startseite
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </motion.div>
        </div>
      </div>
    </>
  );
}
