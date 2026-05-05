import { useRouteError, useNavigate } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ErrorBoundary() {
  const error = useRouteError() as any;
  const navigate = useNavigate();

  console.error('[ErrorBoundary] Route error:', error);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-2xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-6"
        >
          <AlertCircle className="text-red-500" size={48} />
        </motion.div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
          {error?.status === 404 ? 'Seite nicht gefunden' : 'Ein Fehler ist aufgetreten'}
        </h1>

        <p className="text-lg text-white/70 mb-8">
          {error?.status === 404
            ? 'Die gesuchte Seite existiert nicht.'
            : error?.statusText || error?.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-[#66c0b6]/20 transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center gap-2">
              <Home size={20} />
              <span>Zur Startseite</span>
            </div>
          </button>

          <button
            onClick={() => window.history.back()}
            className="px-8 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300"
          >
            Zurück
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && error?.stack && (
          <div className="mt-8 bg-black/30 rounded-lg p-4 text-left">
            <p className="text-xs text-red-300 font-mono whitespace-pre-wrap overflow-x-auto">
              {error.stack}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
