import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Home, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { parseAtsJson } from '../types/ats';
import { AtsResultDisplay } from '../components/AtsResultDisplay';
import { useAuth } from '../contexts/AuthContext';

export default function SavedCvCheckPage() {
  const navigate = useNavigate();
  const { analysisId } = useParams<{ analysisId: string }>();
  const { user } = useAuth();

  const [analysis, setAnalysis] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalysis = async () => {
      if (!analysisId) {
        setError('Keine Analyse-ID gefunden.');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('ats_analyses')
          .select('*')
          .eq('id', analysisId)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!data) {
          setError('Analyse nicht gefunden.');
          setIsLoading(false);
          return;
        }

        // Prüfe ob User Zugriff hat
        if (data.user_id !== user?.id) {
          setError('Du hast keinen Zugriff auf diese Analyse.');
          setIsLoading(false);
          return;
        }

        setAnalysis(data);
        setIsLoading(false);
      } catch (err: any) {
        console.error('[SavedCvCheckPage] Error loading analysis:', err);
        setError(err.message || 'Fehler beim Laden der Analyse.');
        setIsLoading(false);
      }
    };

    loadAnalysis();
  }, [analysisId, user]);

  const parsedAnalysis = (() => {
    if (!analysis?.analysis_data) return null;
    const raw = analysis.analysis_data;
    const parsed = parseAtsJson(raw);
    if (parsed) return parsed;
    if (typeof raw === 'string') {
      try {
        const inner = JSON.parse(raw);
        return parseAtsJson(inner);
      } catch {
        return null;
      }
    }
    return null;
  })();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050507] via-[#0a0a0f] to-[#050507] text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-[#66c0b6] animate-spin mx-auto mb-4" />
          <p className="text-white/60">Lade Analyse...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050507] via-[#0a0a0f] to-[#050507] text-white flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-md"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <div>
            <h1 className="text-2xl font-bold mb-2">Fehler</h1>
            <p className="text-white/60">{error}</p>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-[#66c0b6] hover:bg-[#55a89d] text-black rounded-lg transition-all flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Zurück zum Dashboard
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all flex items-center gap-2"
            >
              <Home size={20} />
              Zur Startseite
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050507] via-[#0a0a0f] to-[#050507] text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Deine CV-Analyse</h1>
              <p className="text-white/60">
                Gespeichert am {new Date(analysis.created_at).toLocaleDateString('de-DE')}
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Zurück
            </button>
          </div>

          {parsedAnalysis && (
            <AtsResultDisplay
              result={parsedAnalysis}
              uploadId={analysis.upload_id}
              showActions={false}
              isFromDashboard={true}
              isPaid={true}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
