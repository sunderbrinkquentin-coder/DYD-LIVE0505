import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, FileText, Lock } from 'lucide-react';

export type ConsentType = 'cv-check' | 'cv-wizard' | 'skill-gap';

interface DsgvoConsentDialogProps {
  isOpen: boolean;
  type: ConsentType;
  onAccept: () => void;
  onDecline: () => void;
}

const CONSENT_TEXTS: Record<ConsentType, { title: string; description: string }> = {
  'cv-check': {
    title: 'DSGVO-Einwilligung: CV-Check',
    description:
      'Dein Lebenslauf wird zur Analyse hochgeladen und von unserer KI verarbeitet, um dir einen ATS-Score und Verbesserungsvorschläge zu geben. Die Verarbeitung erfolgt auf Grundlage deiner Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Du kannst deine Einwilligung jederzeit widerrufen. Weitere Informationen findest du in unserer Datenschutzerklärung.',
  },
  'cv-wizard': {
    title: 'DSGVO-Einwilligung: CV-Erstellung',
    description:
      'Die von dir eingegebenen persönlichen Angaben (Name, Kontaktdaten, Berufserfahrung etc.) werden gespeichert und verarbeitet, um deinen Lebenslauf zu erstellen. Die Verarbeitung erfolgt auf Grundlage deiner Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Du kannst deine Einwilligung jederzeit widerrufen. Weitere Informationen findest du in unserer Datenschutzerklärung.',
  },
  'skill-gap': {
    title: 'DSGVO-Einwilligung: Skill-Gap-Analyse',
    description:
      'Deine Zielposition und ggf. dein Lebenslauf werden verarbeitet, um deine Kompetenzlücken zu analysieren und einen Lernpfad zu erstellen. Die Verarbeitung erfolgt auf Grundlage deiner Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Du kannst deine Einwilligung jederzeit widerrufen. Weitere Informationen findest du in unserer Datenschutzerklärung.',
  },
};

export function DsgvoConsentDialog({ isOpen, type, onAccept, onDecline }: DsgvoConsentDialogProps) {
  const { title, description } = CONSENT_TEXTS[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onDecline}
          />
          <motion.div
            className="relative z-10 w-full max-w-lg bg-[#0a0a14] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl"
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <button
              onClick={onDecline}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              aria-label="Ablehnen"
            >
              <X size={18} className="text-white/60" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[#66c0b6]/15 border border-[#66c0b6]/30 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={24} className="text-[#66c0b6]" />
              </div>
              <h2 className="text-xl font-bold text-white pr-8">{title}</h2>
            </div>

            <p className="text-sm sm:text-base text-white/70 leading-relaxed mb-6">
              {description}
            </p>

            <div className="flex items-center gap-2 text-xs text-white/40 mb-6">
              <Lock size={14} className="flex-shrink-0" />
              <span>
                Du kannst jederzeit widersprechen. Bei Ablehnung werden keine Daten gespeichert oder verarbeitet.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onAccept}
                className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-[#66c0b6]/20"
              >
                Zustimmen und fortfahren
              </button>
              <button
                onClick={onDecline}
                className="flex-1 py-3.5 px-6 rounded-xl bg-white/5 border border-white/15 text-white/70 font-semibold text-sm hover:bg-white/10 hover:text-white transition-all"
              >
                Ablehnen
              </button>
            </div>

            <div className="mt-5 flex items-center justify-center gap-1.5">
              <FileText size={12} className="text-white/30" />
              <a
                href="/#/datenschutz"
                className="text-xs text-white/40 hover:text-[#66c0b6] transition-colors underline"
              >
                Zur Datenschutzerklärung
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
