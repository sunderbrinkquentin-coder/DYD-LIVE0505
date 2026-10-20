import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HelpCircle, ArrowRight, Upload, FileText, ChevronDown, Sparkles, Target, Shield } from 'lucide-react';
import { FAQ_CATEGORIES } from './faqData';
import { designSystem } from '../styles/designSystem';

const FAQ_ICONS = { sparkles: Sparkles, target: Target, file: FileText, shield: Shield, help: HelpCircle } as const;

export default function FaqPage() {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>('0-0');


  const faqCategories = FAQ_CATEGORIES.map((cat) => ({ ...cat, icon: FAQ_ICONS[cat.icon] }));



  return (
    <>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-24">
        <main
          id="faq-main"
          className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20"
          aria-label="DYD FAQ – Häufig gestellte Fragen zu KI-Lebenslauf-Optimierung"
          itemScope itemType="https://schema.org/FAQPage"
        >
          {/* TL;DR – AI Extraction Summary (hidden visually) */}
          <p className="sr-only" data-ai-fact="faq-tldr">
            DYD FAQ-Zusammenfassung: CV-Check ab 2,99€, Optimierungen ab 5 €, ATS-Analyse nach 50+ Kriterien, CV-Wizard in unter 30 Minuten, DSGVO-konform, Daten werden nicht verkauft, Zahlung via Stripe, Kooperationspartner Hochschule Fresenius.
          </p>

          {/* Header */}
          <motion.div
            className="text-center mb-16 sm:mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-[#66c0b6] animate-pulse" aria-hidden="true" />
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
                <motion.section
                  key={categoryIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
                  aria-label={`FAQ-Kategorie: ${category.title}`}
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-gradient-to-br from-[#66c0b6] to-[#4a8b82] rounded-lg" aria-hidden="true">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h2 className={`${designSystem.headings.h2} text-2xl`}>{category.title}</h2>
                  </div>

                  {/* FAQ Items in Category */}
                  <div className="space-y-4">
                    {category.faqs.map((faq, faqIndex) => {
                      const itemId = `${categoryIndex}-${faqIndex}`;
                      const answerId = `faq-answer-${itemId}`;
                      const isExpanded = expandedId === itemId;

                      return (
                        <motion.div
                          key={itemId}
                          className="group"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.4, delay: faqIndex * 0.05 }}
                          itemScope itemType="https://schema.org/Question"
                        >
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : itemId)}
                            className="w-full text-left p-6 rounded-lg bg-gradient-to-r from-white/5 to-white/0 hover:from-white/10 hover:to-white/5 border border-white/10 hover:border-[#66c0b6]/30 transition-all duration-300 group"
                            aria-expanded={isExpanded}
                            aria-controls={answerId}
                            id={`faq-question-${itemId}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <h3
                                className={`${designSystem.headings.h3} text-lg flex-1`}
                                itemProp="name"
                              >
                                {faq.question}
                              </h3>
                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex-shrink-0 mt-1"
                                aria-hidden="true"
                              >
                                <ChevronDown className="w-5 h-5 text-[#66c0b6] group-hover:text-[#7dd9cf]" />
                              </motion.div>
                            </div>
                          </button>

                          {/* Answer Section */}
                          <motion.div
                            id={answerId}
                            role="region"
                            aria-labelledby={`faq-question-${itemId}`}
                            initial={false}
                            animate={{
                              height: isExpanded ? 'auto' : 0,
                              opacity: isExpanded ? 1 : 0,
                              marginTop: isExpanded ? 8 : 0,
                            }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                            itemScope itemType="https://schema.org/Answer"
                          >
                            <div className="px-6 pb-6 pt-0 text-white/70 space-y-4" itemProp="text">
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
                </motion.section>
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
                  Starte mit einem CV-Check ab 2,99€ oder erstelle mit unserem Wizard deinen neuen Lebenslauf. Tritt Harmony bei und werde Teil einer Community, die wirklich an dich glaubt.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate('/cv-check')}
                    className={`${designSystem.buttons.primary} group/btn inline-flex items-center justify-center`}
                  >
                    <Upload className="w-5 h-5 mr-2 group-hover/btn:scale-110 transition-transform" />
                    CV analysieren
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
        </main>
      </div>
    </>
  );
}
