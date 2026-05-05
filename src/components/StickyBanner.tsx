import { AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

interface StickyBannerProps {
  isVisible: boolean;
  onRegister: () => void;
  onDismiss: () => void;
}

export default function StickyBanner({ isVisible, onRegister, onDismiss }: StickyBannerProps) {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 right-0 z-[1000] shadow-lg"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.95) 0%, rgba(239, 83, 80, 0.95) 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <AlertCircle className="text-white flex-shrink-0" size={20} />
              <p className="text-white text-sm sm:text-base font-medium">
                <span className="hidden sm:inline">Dein CV ist nicht gespeichert! </span>
                <span>Erstelle einen Account um ihn herunterzuladen.</span>
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={onRegister}
                className="bg-white text-error px-4 sm:px-5 py-2 rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Jetzt registrieren
              </button>

              <button
                onClick={onDismiss}
                className="text-white hover:bg-white hover:bg-opacity-20 p-1.5 rounded transition-colors"
                aria-label="Banner schließen"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
