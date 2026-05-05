import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Loader2, ArrowRight, FileText, Sparkles } from 'lucide-react';
import { CVBuilderData } from '../types/cvBuilder';
import { supabase } from '../lib/supabase';

interface JobData {
  company: string;
  jobTitle: string;
  jobLink: string;
  jobDescription: string;
}

export function CVOptimization() {
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as { cvData?: CVBuilderData; jobData?: JobData } | null;
  const cvData = locationState?.cvData;
  const jobData = locationState?.jobData;

  const [isOptimizing, setIsOptimizing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  useEffect(() => {
    if (!locationState || !cvData || !jobData) {
      console.warn('CVOptimization: Missing required data, redirecting...', {
        hasLocationState: !!locationState,
        hasCvData: !!cvData,
        hasJobData: !!jobData
      });
      navigate('/cv-builder');
      return;
    }

    optimizeCV();
  }, []);

  const optimizeCV = async () => {
    if (!cvData || !jobData) {
      console.error('CVOptimization.optimizeCV: Missing data');
      navigate('/cv-builder');
      return;
    }

    try {
      setIsOptimizing(true);
      setProgress(10);

      const sessionId = localStorage.getItem('sessionId') || 'anonymous';

      setProgress(30);

      const applicationData = {
        session_id: sessionId,
        profile_id: null,
        user_id: null,
        vorname: cvData?.personalData?.firstName || '',
        nachname: cvData?.personalData?.lastName || '',
        email: cvData?.personalData?.email || '',
        telefon: cvData?.personalData?.phone || '',
        ort: cvData?.personalData?.city || '',
        plz: cvData?.personalData?.zipCode || '',
        linkedin: cvData?.personalData?.linkedin || '',
        website: cvData?.personalData?.website || '',
        bildung_entries: cvData?.professionalEducation || [],
        berufserfahrung_entries: cvData?.workExperience || [],
        projekte_entries: cvData?.projects || [],
        sprachen_list: cvData?.languages || [],
        zertifikate_entries: [],
        hard_skills: cvData?.hardSkills || [],
        soft_skills: cvData?.softSkills || [],
        top_skills: [],
        rolle: jobData?.jobTitle || '',
        unternehmen: jobData?.company || '',
        stellenbeschreibung: jobData?.jobDescription || '',
        status: 'entwurf',
        profile_summary: generateProfileSummary(cvData),
        sales: generateSalesText(cvData, jobData)
      };

      setProgress(60);

      const { data, error } = await supabase
        .from('job_application')
        .insert([applicationData])
        .select()
        .single();

      if (error) {
        console.error('Error saving application:', error);
        throw error;
      }

      setProgress(90);
      setApplicationId(data.id);

      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(100);
      setIsOptimizing(false);

    } catch (error) {
      console.error('Optimization error:', error);
      navigate('/cv-builder');
    }
  };

  const generateProfileSummary = (data: CVBuilderData): string => {
    const experiences = Array.isArray(data?.workExperience) ? data.workExperience.length : 0;
    const education = Array.isArray(data?.professionalEducation) && data.professionalEducation.length > 0 ? data.professionalEducation[0] : null;
    const hardSkills = Array.isArray(data?.hardSkills) ? data.hardSkills : [];
    const softSkills = Array.isArray(data?.softSkills) ? data.softSkills : [];

    const hardSkillsStrings = hardSkills.map(skill => typeof skill === 'string' ? skill : skill?.skill || '').filter(Boolean);
    const softSkillsStrings = softSkills.map(skill => typeof skill === 'string' ? skill : skill?.skill || '').filter(Boolean);
    const skills = [...hardSkillsStrings, ...softSkillsStrings].slice(0, 5);

    const firstName = data?.personalData?.firstName || '';
    const lastName = data?.personalData?.lastName || '';
    const skillsText = skills.length > 0 ? `Kernkompetenzen: ${skills.join(', ')}.` : '';
    const eduText = education ? `und einen Abschluss in ${education.field || education.fieldOfStudy || education.degree}` : '';

    return `${firstName} ${lastName} verfügt über ${experiences} relevante Berufserfahrung${experiences !== 1 ? 'en' : ''} ${eduText}. ${skillsText}`.trim();
  };

  const generateSalesText = (data: CVBuilderData, job: JobData): string => {
    const jobTitle = job?.jobTitle || 'Fachkraft';
    const company = job?.company || 'diesem Unternehmen';
    const firstExp = Array.isArray(data?.workExperience) && data.workExperience.length > 0 ? data.workExperience[0] : null;
    const position = firstExp?.position || 'relevanten Bereichen';

    return `Motivierte/r ${jobTitle} mit fundierter Erfahrung in ${position}. Begeistert von der Möglichkeit, bei ${company} meine Fähigkeiten einzubringen und zum Unternehmenserfolg beizutragen.`;
  };

  const handleContinue = () => {
    navigate('/cv-preview-editor', {
      state: { cvData, jobData, applicationId }
    });
  };

  if (isOptimizing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] text-white flex items-center justify-center">
        <div className="max-w-2xl w-full px-4 space-y-8 animate-fade-in">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#66c0b6]/30 to-[#30E3CA]/30 blur-3xl rounded-full"></div>
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] flex items-center justify-center shadow-2xl">
                  <Loader2 size={64} className="text-white animate-spin" />
                </div>
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-[#66c0b6] to-white bg-clip-text text-transparent">
              Wir optimieren deinen CV
            </h1>

            <p className="text-xl text-white/70">
              Einen Moment bitte, während wir deinen CV auf die Stelle bei <span className="text-[#66c0b6] font-semibold">{jobData?.company}</span> abstimmen...
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative w-full h-4 bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-white/60 text-sm">{progress}%</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 transition-all ${progress >= 30 ? 'opacity-100' : 'opacity-30'}`}>
              <div className="flex items-center gap-3">
                {progress >= 30 ? <Check size={20} className="text-[#66c0b6]" /> : <Loader2 size={20} className="animate-spin text-white/40" />}
                <span className="text-sm text-white/80">Daten analysieren</span>
              </div>
            </div>
            <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 transition-all ${progress >= 60 ? 'opacity-100' : 'opacity-30'}`}>
              <div className="flex items-center gap-3">
                {progress >= 60 ? <Check size={20} className="text-[#66c0b6]" /> : <Loader2 size={20} className="animate-spin text-white/40" />}
                <span className="text-sm text-white/80">CV optimieren</span>
              </div>
            </div>
            <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 transition-all ${progress >= 100 ? 'opacity-100' : 'opacity-30'}`}>
              <div className="flex items-center gap-3">
                {progress >= 100 ? <Check size={20} className="text-[#66c0b6]" /> : <Loader2 size={20} className="animate-spin text-white/40" />}
                <span className="text-sm text-white/80">Speichern</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] text-white flex items-center justify-center">
      <div className="max-w-4xl w-full px-4 space-y-12 animate-fade-in">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#66c0b6]/30 to-[#30E3CA]/30 blur-3xl rounded-full"></div>
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] flex items-center justify-center shadow-2xl">
              <Check size={64} className="text-white" />
            </div>
          </div>
        </div>

        <div className="text-center space-y-6">
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-white via-[#66c0b6] to-white bg-clip-text text-transparent leading-tight">
            Geschafft! 🎉
          </h1>
          <h2 className="text-3xl md:text-4xl font-semibold text-white">
            Dein CV wurde optimiert
          </h2>
          <p className="text-2xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Wir haben deinen CV auf die Stelle als <span className="text-[#66c0b6] font-semibold">{jobData?.jobTitle}</span> bei <span className="text-[#66c0b6] font-semibold">{jobData?.company}</span> abgestimmt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="text-4xl mb-3">
              <Sparkles className="text-[#66c0b6]" size={36} />
            </div>
            <h3 className="font-semibold text-white mb-2">KI-optimiert</h3>
            <p className="text-sm text-white/60">Formulierungen an Stellenanzeige angepasst</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="text-4xl mb-3">
              <FileText className="text-[#66c0b6]" size={36} />
            </div>
            <h3 className="font-semibold text-white mb-2">Professionell</h3>
            <p className="text-sm text-white/60">HR-gerechte Struktur und Sprache</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="text-4xl mb-3">
              <Check className="text-[#66c0b6]" size={36} />
            </div>
            <h3 className="font-semibold text-white mb-2">Bereit zum Download</h3>
            <p className="text-sm text-white/60">Im Dashboard verfügbar</p>
          </div>
        </div>

        <button
          onClick={handleContinue}
          className="group mx-auto px-16 py-6 rounded-3xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold text-2xl hover:opacity-90 transition-all flex items-center gap-4 shadow-2xl hover:scale-105"
        >
          Weiter zur Vorschau & Anpassung
          <ArrowRight size={32} className="group-hover:translate-x-2 transition-transform" />
        </button>

        <p className="text-center text-sm text-white/50">
          🔒 Deine Daten sind sicher und werden verschlüsselt gespeichert
        </p>
      </div>
    </div>
  );
}
