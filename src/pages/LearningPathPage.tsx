import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LearningPathDashboard } from '../components/career/LearningPathDashboard';
import { CareerVisionCard } from '../components/career/CareerVisionCard';
import { careerService } from '../services/careerService';
import { certificateService } from '../services/certificateService';
import { LearningPath } from '../types/learningPath';
import { supabase } from '../lib/supabase';

export default function LearningPathPage() {
  const { pathId } = useParams<{ pathId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef = useRef(0);
  const isCompletedRef = useRef(false);

  useEffect(() => {
    if (pathId) {
      loadLearningPath(true);
    }
  }, [pathId]);

  // Realtime: any UPDATE on this row triggers a silent re-fetch (no loader flicker)
  useEffect(() => {
    if (!pathId) return;

    const channel = supabase
      .channel(`lp_page_${pathId}_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'learning_paths', filter: `id=eq.${pathId}` },
        (payload) => {
          console.log('[LearningPath] Realtime UPDATE received, status:', payload.new?.status);
          // Silent refresh — no loader, just swap the data
          loadLearningPath(false);
        },
      )
      .subscribe((status) => console.log('[LearningPath] Realtime channel:', status));

    realtimeChannelRef.current = channel;

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      stopPolling();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathId]);

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  // Fallback polling: if status is still 'analyzing' after load, poll every 3 s (max 30 tries)
  const startPollingIfNeeded = (path: LearningPath) => {
    if (isCompletedRef.current) return;
    if (path.status === 'completed' || path.status === 'curriculum_ready') {
      isCompletedRef.current = true;
      stopPolling();
      return;
    }
    if (pollCountRef.current >= 30) return;

    pollTimerRef.current = setTimeout(async () => {
      pollCountRef.current += 1;
      console.log(`[LearningPath] Poll attempt ${pollCountRef.current}`);
      await loadLearningPath(false);
    }, 3000);
  };

  // showLoader = true only for the initial page load, false for silent refreshes
  const loadLearningPath = async (showLoader = false) => {
    if (!pathId) return;

    if (showLoader) setIsLoading(true);
    setError(null);

    try {
      const path = await careerService.getLearningPath(pathId);

      if (!path) {
        setError('Lernpfad nicht gefunden');
        return;
      }

      setLearningPath(path);
      startPollingIfNeeded(path);
    } catch (err: any) {
      console.error('[LearningPath] Load error:', err);
      setError(err.message || 'Fehler beim Laden des Lernpfads');
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  const handleCertificateRequest = async () => {
    if (!learningPath) return;

    const recipientName =
      user?.email?.split('@')[0] || learningPath.user_id?.substring(0, 8) || 'Teilnehmer';

    setIsGeneratingCertificate(true);

    try {
      await certificateService.issueCertificate(learningPath, recipientName);
      await loadLearningPath(true);
    } catch (err: any) {
      console.error('[Certificate] Generation error:', err);
      alert('Fehler beim Erstellen des Zertifikats: ' + err.message);
    } finally {
      setIsGeneratingCertificate(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#66c0b6] animate-spin" />
          <p className="text-white/70 font-medium">Lade Lernpfad...</p>
        </div>
      </div>
    );
  }

  if (error || !learningPath) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
          <p className="text-red-400">{error || 'Lernpfad nicht gefunden'}</p>
          <button
            onClick={() => navigate('/career-vision')}
            className="px-6 py-3 bg-[#66c0b6] text-black rounded-xl hover:opacity-90"
          >
            Zurück zur Career Vision
          </button>
        </div>
      </div>
    );
  }

  const showDashboard = learningPath.curriculum && (learningPath.is_paid || learningPath.curriculum.modules.length > 0);

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/career-vision')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={20} />
            <span>Zurück</span>
          </button>

          {learningPath.status === 'completed' && (
            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#66c0b6]/20 to-[#30E3CA]/20 border border-[#66c0b6]/30">
              <span className="text-[#66c0b6] font-semibold">✓ Abgeschlossen</span>
            </div>
          )}
        </div>

        {!showDashboard ? (
          <div className="max-w-3xl mx-auto">
            <CareerVisionCard
              learningPath={learningPath}
              variant="detail"
              onStartLearning={(_skillIndex?: number) => {
                if (learningPath.is_paid || !!learningPath.curriculum) {
                  navigate(`/learning-path/${learningPath.id}`);
                }
              }}
            />
          </div>
        ) : (
          <LearningPathDashboard
            learningPath={learningPath}
            onCertificateRequest={handleCertificateRequest}
          />
        )}

        {isGeneratingCertificate && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#020617] border border-white/10 rounded-2xl p-8 max-w-md text-center space-y-4">
              <Loader2 className="w-16 h-16 text-[#66c0b6] animate-spin mx-auto" />
              <h3 className="text-xl font-bold text-white">Erstelle Zertifikat...</h3>
              <p className="text-white/70">
                Dein Zertifikat wird generiert und automatisch heruntergeladen.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
