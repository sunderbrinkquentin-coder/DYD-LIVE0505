import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowRight, Save, Layout, Loader2 } from 'lucide-react';
import { CVBuilderData } from '../types/cvBuilder';
import { ClassicTemplate } from '../components/cv-templates/ClassicTemplate';
import { ModernTemplate } from '../components/cv-templates/ModernTemplate';
import { CompactTemplate } from '../components/cv-templates/CompactTemplate';
import { AvatarSidebar } from '../components/cvbuilder/AvatarSidebar';
import { supabase } from '../lib/supabase';
import { cvStorageService } from '../services/cvStorageService';

interface JobData {
  company: string;
  jobTitle: string;
  jobLink: string;
  jobDescription: string;
}

interface OptimizedCV {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city: string;
    zipCode: string;
    linkedin?: string;
    website?: string;
  };
  summary: string;
  education: Array<{
    degree: string;
    institution: string;
    fieldOfStudy?: string;
    startDate: string;
    endDate: string;
    grade?: string;
    description?: string;
  }>;
  experience: Array<{
    position: string;
    company: string;
    startDate: string;
    endDate: string;
    current?: boolean;
    responsibilities: string[];
    achievements: string[];
  }>;
  projects: Array<{
    title: string;
    role: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  skills: {
    hardSkills: string[];
    softSkills: string[];
    languages: Array<{ language: string; level: string }>;
  };
  hobbies?: string[];
}

type LayoutType = 'classic' | 'modern' | 'compact';

export function CVPreviewEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cvId } = useParams<{ cvId: string }>();

  const locationState = location.state as {
    cvData?: CVBuilderData;
    jobData?: JobData;
    applicationId?: string;
  } | null;

  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('modern');
  const [optimizedCV, setOptimizedCV] = useState<OptimizedCV | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [applicationId, setApplicationId] = useState<string | undefined>(
    locationState?.applicationId || cvId
  );
  const [cvData, setCvData] = useState<CVBuilderData | undefined>(locationState?.cvData);
  const [jobData, setJobData] = useState<JobData | undefined>(locationState?.jobData);

  useEffect(() => {
    loadCVData();
  }, [cvId]);

  const loadCVData = async () => {
    setIsLoading(true);

    try {
      if (cvId) {
        console.log('CVPreviewEditor: Loading CV from Supabase with ID:', cvId);
        const result = await cvStorageService.loadCVData(cvId);

        if (result.success && result.cvData) {
          console.log('CVPreviewEditor: CV loaded successfully');
          setCvData(result.cvData);
          setJobData(result.jobData);
          setApplicationId(result.applicationId || cvId);

          const mapped = mapCVData(result.cvData, result.jobData || {} as JobData);
          setOptimizedCV(mapped);
        } else {
          console.error('CVPreviewEditor: Failed to load CV:', result.error);
          navigate('/cv-builder');
        }
      } else if (locationState?.cvData) {
        console.log('CVPreviewEditor: Using CV data from location state');
        const mapped = mapCVData(locationState.cvData, locationState.jobData || {} as JobData);
        setOptimizedCV(mapped);
      } else {
        console.warn('CVPreviewEditor: No CV ID or data available, redirecting...');
        navigate('/cv-builder');
      }
    } catch (error) {
      console.error('CVPreviewEditor: Error loading CV data', error);
      navigate('/cv-builder');
    } finally {
      setIsLoading(false);
    }
  };

  const mapCVData = (data: CVBuilderData, job: JobData): OptimizedCV => {
    const personalData = data?.personalData ?? {};
    const schoolEducation = Array.isArray(data?.schoolEducation) ? data.schoolEducation : [];
    const professionalEducation = Array.isArray(data?.professionalEducation) ? data.professionalEducation : [];
    const workExperience = Array.isArray(data?.workExperience) ? data.workExperience : [];
    const projects = Array.isArray(data?.projects) ? data.projects : [];
    const languages = Array.isArray(data?.languages) ? data.languages : [];
    const hardSkills = Array.isArray(data?.hardSkills) ? data.hardSkills : [];
    const softSkills = Array.isArray(data?.softSkills) ? data.softSkills : [];

    return {
      profile: {
        firstName: personalData?.firstName || '',
        lastName: personalData?.lastName || '',
        email: personalData?.email || '',
        phone: personalData?.phone || '',
        city: personalData?.city || '',
        zipCode: personalData?.zipCode || '',
        linkedin: personalData?.linkedin || '',
        website: personalData?.website || ''
      },
      summary: generateSummary(data, job),
      education: [
        ...schoolEducation.map(edu => ({
          degree: edu?.schoolType || '',
          institution: edu?.schoolName || '',
          fieldOfStudy: '',
          startDate: edu?.startYear || '',
          endDate: edu?.endYear || '',
          grade: edu?.grade || '',
          description: ''
        })),
        ...professionalEducation.map(edu => ({
          degree: edu?.degree || '',
          institution: edu?.institution || '',
          fieldOfStudy: edu?.field || edu?.fieldOfStudy || '',
          startDate: edu?.startDate || '',
          endDate: edu?.endDate || '',
          grade: edu?.grade || '',
          description: edu?.description || ''
        }))
      ],
      experience: workExperience.map(exp => ({
        position: exp?.position || '',
        company: exp?.company || '',
        startDate: exp?.startDate || '',
        endDate: exp?.endDate || '',
        current: exp?.current || false,
        responsibilities: Array.isArray(exp?.tasks) ? exp.tasks : [],
        achievements: Array.isArray(exp?.achievements) ? exp.achievements : []
      })),
      projects: projects.map(proj => ({
        title: proj?.title || '',
        role: proj?.role || '',
        startDate: proj?.startDate || '',
        endDate: proj?.endDate || '',
        description: proj?.description || ''
      })),
      skills: {
        hardSkills: hardSkills.map(skill => typeof skill === 'string' ? skill : skill?.skill || '').filter(Boolean),
        softSkills: softSkills.map(skill => typeof skill === 'string' ? skill : skill?.skill || '').filter(Boolean),
        languages: languages.map(lang => ({
          language: lang?.language || '',
          level: lang?.level || ''
        }))
      },
      hobbies: Array.isArray(data?.hobbies?.hobbies) ? data.hobbies.hobbies : []
    };
  };

  const generateSummary = (data: CVBuilderData, job: JobData): string => {
    const expYears = Array.isArray(data?.workExperience) ? data.workExperience.length : 0;
    const hardSkills = Array.isArray(data?.hardSkills) ? data.hardSkills : [];
    const softSkills = Array.isArray(data?.softSkills) ? data.softSkills : [];

    const hardSkillsStrings = hardSkills.map(skill => typeof skill === 'string' ? skill : skill?.skill || '').filter(Boolean);
    const softSkillsStrings = softSkills.map(skill => typeof skill === 'string' ? skill : skill?.skill || '').filter(Boolean);
    const topSkills = [...hardSkillsStrings, ...softSkillsStrings].slice(0, 4);

    const jobTitle = job?.jobTitle || 'Fachkraft';
    const company = job?.company || 'diesem Unternehmen';

    if (topSkills.length === 0) {
      return `Motivierte/r ${jobTitle} mit ${expYears} Jahr${expYears !== 1 ? 'en' : ''} Berufserfahrung. Begeistert von der Möglichkeit, bei ${company} meine Fähigkeiten einzubringen und zum Unternehmenserfolg beizutragen.`;
    }

    return `Motivierte/r ${jobTitle} mit ${expYears} Jahr${expYears !== 1 ? 'en' : ''} Berufserfahrung. Ausgeprägte Kompetenzen in ${topSkills.join(', ')}. Begeistert von der Möglichkeit, bei ${company} meine Fähigkeiten einzubringen und zum Unternehmenserfolg beizutragen.`;
  };

  const updateProfile = (field: string, value: string) => {
    if (!optimizedCV) return;
    setOptimizedCV({
      ...optimizedCV,
      profile: {
        ...optimizedCV.profile,
        [field]: value
      }
    });
  };

  const updateSummary = (value: string) => {
    if (!optimizedCV) return;
    setOptimizedCV({
      ...optimizedCV,
      summary: value
    });
  };

  const updateExperience = (index: number, field: string, value: any) => {
    if (!optimizedCV) return;
    const newExp = [...optimizedCV.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    setOptimizedCV({ ...optimizedCV, experience: newExp });
  };

  const updateExperienceArray = (index: number, field: 'responsibilities' | 'achievements', value: string) => {
    if (!optimizedCV) return;
    const items = value.split('\n').filter(line => line.trim());
    updateExperience(index, field, items);
  };

  const handleSave = async () => {
    if (!optimizedCV) return;

    setIsSaving(true);
    try {
      const sessionId = localStorage.getItem('sessionId') || 'anonymous';

      const updateData = {
        optimized_cv_html: JSON.stringify(optimizedCV),
        status: 'optimiert',
        layout_template: selectedLayout,
        updated_at: new Date().toISOString()
      };

      if (applicationId) {
        const { error } = await supabase
          .from('job_application')
          .update(updateData)
          .eq('id', applicationId);

        if (error) throw error;
      }

      navigate('/dashboard', {
        state: { applicationId, message: 'CV erfolgreich gespeichert!' }
      });

    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderTemplate = () => {
    if (!optimizedCV) return null;

    switch (selectedLayout) {
      case 'classic':
        return <ClassicTemplate data={optimizedCV} />;
      case 'modern':
        return <ModernTemplate data={optimizedCV} />;
      case 'compact':
        return <CompactTemplate data={optimizedCV} />;
      default:
        return <ModernTemplate data={optimizedCV} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#66c0b6]/30 to-[#30E3CA]/30 blur-3xl rounded-full"></div>
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] flex items-center justify-center shadow-2xl">
                <Loader2 size={64} className="text-white animate-spin" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-[#66c0b6] to-white bg-clip-text text-transparent">
            Lade deinen CV...
          </h1>
          <p className="text-xl text-white/70">
            Einen Moment bitte, wir bereiten deinen Editor vor.
          </p>
        </div>
      </div>
    );
  }

  if (!optimizedCV) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-[1800px] mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-[#66c0b6] to-white bg-clip-text text-transparent">
              Dein optimierter CV {jobData?.company ? `für ${jobData.company}` : ''}
            </h1>
            <p className="text-lg text-white/70 max-w-3xl mx-auto">
              Wir haben deinen Lebenslauf auf deine Wunschstelle abgestimmt. Du kannst hier noch Feinheiten anpassen und ein Layout wählen.
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setSelectedLayout('classic')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                selectedLayout === 'classic'
                  ? 'bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black'
                  : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <Layout size={20} />
              Klassisch
            </button>
            <button
              onClick={() => setSelectedLayout('modern')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                selectedLayout === 'modern'
                  ? 'bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black'
                  : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <Layout size={20} />
              Modern
            </button>
            <button
              onClick={() => setSelectedLayout('compact')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                selectedLayout === 'compact'
                  ? 'bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black'
                  : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <Layout size={20} />
              Kompakt
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6 pr-4">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Profil / Zusammenfassung
                </h2>
                <textarea
                  value={optimizedCV.summary}
                  onChange={(e) => updateSummary(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:border-[#66c0b6] focus:ring-2 focus:ring-[#66c0b6]/20 resize-none"
                />
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-white">Berufserfahrung</h2>
                {optimizedCV.experience.map((exp, index) => (
                  <div key={index} className="space-y-3 pb-4 border-b border-white/10 last:border-0">
                    <input
                      value={exp.position}
                      onChange={(e) => updateExperience(index, 'position', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white font-semibold focus:outline-none focus:border-[#66c0b6]"
                    />
                    <input
                      value={exp.company}
                      onChange={(e) => updateExperience(index, 'company', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#66c0b6]"
                    />
                    <div className="text-sm text-white/60">
                      Aufgaben (eine pro Zeile):
                    </div>
                    <textarea
                      value={exp.responsibilities.join('\n')}
                      onChange={(e) => updateExperienceArray(index, 'responsibilities', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-[#66c0b6] resize-none"
                    />
                    {exp.achievements.length > 0 && (
                      <>
                        <div className="text-sm text-white/60">
                          Erfolge (eine pro Zeile):
                        </div>
                        <textarea
                          value={exp.achievements.join('\n')}
                          onChange={(e) => updateExperienceArray(index, 'achievements', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-[#66c0b6] resize-none"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>

              {optimizedCV.projects.length > 0 && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
                  <h2 className="text-xl font-bold text-white">Projekte</h2>
                  {optimizedCV.projects.map((proj, index) => (
                    <div key={index} className="space-y-2 pb-4 border-b border-white/10 last:border-0">
                      <input
                        value={proj.title}
                        onChange={(e) => {
                          const newProjects = [...optimizedCV.projects];
                          newProjects[index] = { ...newProjects[index], title: e.target.value };
                          setOptimizedCV({ ...optimizedCV, projects: newProjects });
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white font-semibold focus:outline-none focus:border-[#66c0b6]"
                      />
                      <textarea
                        value={proj.description}
                        onChange={(e) => {
                          const newProjects = [...optimizedCV.projects];
                          newProjects[index] = { ...newProjects[index], description: e.target.value };
                          setOptimizedCV({ ...optimizedCV, projects: newProjects });
                        }}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-[#66c0b6] resize-none"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="lg:hidden">
                <AvatarSidebar
                  message="Hier kannst du deinen CV feinjustieren. Wir haben schon vieles für dich vorbereitet – pass jetzt Formulierungen und Layout so an, wie es zu dir passt."
                  stepInfo="Alle Änderungen werden live in der Vorschau angezeigt."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="sticky top-4">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Live-Vorschau</h2>
                  <div className="bg-gray-100 rounded-lg">
                    <div className="flex justify-center p-8" style={{ minWidth: '210mm' }}>
                      <div style={{ width: '210mm' }}>
                        {renderTemplate()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden lg:block mt-6">
                  <AvatarSidebar
                    message="Hier kannst du deinen CV feinjustieren. Wir haben schon vieles für dich vorbereitet – pass jetzt Formulierungen und Layout so an, wie es zu dir passt."
                    stepInfo="Alle Änderungen werden live in der Vorschau angezeigt."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-6">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="group px-16 py-6 rounded-3xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold text-2xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-4 shadow-2xl hover:scale-105"
            >
              {isSaving ? (
                <>
                  <Save size={32} className="animate-spin" />
                  Speichere...
                </>
              ) : (
                <>
                  CV speichern & zum Dashboard
                  <ArrowRight size={32} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(102, 192, 182, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(102, 192, 182, 0.7);
        }
      `}</style>
    </div>
  );
}
