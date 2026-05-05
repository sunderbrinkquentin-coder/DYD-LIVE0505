import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, TrendingUp, ArrowLeft, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CareerVisionSection } from '../components/career/CareerVisionSection';
import { CareerVisionCard } from '../components/career/CareerVisionCard';
import { careerService } from '../services/careerService';
import { LearningPath } from '../types/learningPath';
import { supabase } from '../lib/supabase';

export default function CareerVisionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cvId, setCvId] = useState<string | null>(null);
  const [userPaths, setUserPaths] = useState<LearningPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      if (user?.id) {
        const { data: cvData } = await supabase
          .from('stored_cvs')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cvData) setCvId(cvData.id);

        const paths = await careerService.getUserLearningPaths(user.id);
        setUserPaths(paths);
      }
    } catch (error) {
      console.error('[CareerVision] Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalysisComplete = (pathId: string) => {
    navigate(`/learning-path/${pathId}`);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm"
        >
          <ArrowLeft size={16} />
          Zurück zum Dashboard
        </button>

        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] mb-2">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black">Career Vision Analyse</h1>
          <p className="text-white/60 max-w-xl mx-auto leading-relaxed">
            Definiere deine Traumposition und wir identifizieren deine persönlichen Wachstums-Chancen — basierend auf ESCO-Daten und aktuellen Markttrends 2026.
          </p>
        </div>

        {/* How it works — compact */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Target size={16} />, title: 'Vision eingeben', desc: 'Zielposition + Wunschunternehmen' },
            { icon: <TrendingUp size={16} />, title: 'KI analysiert', desc: 'Skills, Gaps & Markttrends' },
            { icon: <Award size={16} />, title: 'Plan starten', desc: 'Strukturierter Lernpfad + Zertifikat' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-2 p-4 rounded-xl text-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[#30E3CA]"
                style={{ background: 'rgba(48,227,202,0.08)', border: '1px solid rgba(48,227,202,0.15)' }}>
                {icon}
              </div>
              <p className="text-xs font-black text-white">{title}</p>
              <p className="text-[10px] text-white/40 leading-tight">{desc}</p>
            </div>
          ))}
        </div>

        {/* Analysis form */}
        <div className="rounded-3xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="p-6 sm:p-8">
            <CareerVisionSection cvId={cvId || undefined} onAnalysisComplete={handleAnalysisComplete} />
          </div>
        </div>

        {/* Existing paths */}
        {!isLoading && userPaths.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-[#66c0b6]" />
              <h2 className="text-base font-black text-white">Deine bisherigen Analysen</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#66c0b6]/10 text-[#66c0b6] font-bold border border-[#66c0b6]/15">
                {userPaths.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userPaths.map((path) => (
                <CareerVisionCard
                  key={path.id}
                  learningPath={path}
                  variant="compact"
                  onStartLearning={() => navigate(`/learning-path/${path.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
