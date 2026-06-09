import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Plus, Trash2, Wrench, Info, FolderOpen, CheckCircle, AlertCircle, X, ChevronRight, Briefcase, SkipForward } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { AvatarSidebar } from '../AvatarSidebar';
import { WorkExperience, ExperienceLevel, Project } from '../../../types/cvBuilder';
import { STARCoachingBanner } from '../TasksWithMetricsInput';
import { CategorizedTasksInput } from '../CategorizedTasksInput';
import { ACHIEVEMENTS_BY_LEVEL } from '../../../config/cvBuilderSteps';
import { TasksWithMetricsInput } from '../TasksWithMetricsInput';
import { getPersonalizedSuggestions } from '../../../services/cvSuggestionsService';

interface WorkExperienceStepProps {
  data?: WorkExperience[];
  experienceLevel?: ExperienceLevel;
  onChange: (experiences: WorkExperience[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

type LocalWorkExperience = WorkExperience & {
  industry?: string;
  roleLevel?: string;
  revenue?: string;
  budget?: string;
  teamSize?: string;
  customersMarket?: string;
  toolsText?: string;
  startMonth?: string;
  startYear?: string;
  endMonth?: string;
  endYear?: string;
  current?: boolean;
  tasksWithMetrics?: any[];
  achievementsWithMetrics?: any[];
  stationProjects?: Project[];
};

const INDUSTRIES = [
  { value: 'sales', label: 'Vertrieb / Sales' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Finance / Controlling' },
  { value: 'hr', label: 'HR / Personalwesen' },
  { value: 'logistik', label: 'Logistik / Supply Chain' },
  { value: 'health', label: 'Gesundheitswesen' },
  { value: 'it', label: 'IT / Software' },
  { value: 'produktion', label: 'Produktion / Fertigung' },
  { value: 'public', label: 'Öffentlicher Dienst' },
  { value: 'consulting', label: 'Beratung / Consulting' },
  { value: 'retail', label: 'Einzelhandel / Retail' },
  { value: 'other', label: 'Sonstiges' },
];

const ROLE_LEVELS = [
  { value: '', label: 'Level wählen (optional)' },
  { value: 'internship', label: 'Praktikum / Praktikant' },
  { value: 'werkstudent', label: 'Werkstudent' },
  { value: 'trainee', label: 'Trainee / Auszubildender' },
  { value: 'junior', label: 'Junior (0–2 Jahre)' },
  { value: 'mid', label: 'Mid-Level (2–5 Jahre)' },
  { value: 'senior', label: 'Senior (5+ Jahre)' },
  { value: 'lead', label: 'Lead / Teamlead' },
  { value: 'head', label: 'Head of / Abteilungsleiter' },
  { value: 'director', label: 'Director / VP' },
  { value: 'cxo', label: 'C-Level (CEO, CFO, ...)' },
];

const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 50 }, (_, i) => String(currentYear - i));

const createEmptyExperience = (): LocalWorkExperience => ({
  jobTitle: '',
  company: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  startMonth: '',
  startYear: '',
  endMonth: '',
  endYear: '',
  industry: '',
  roleLevel: '',
  revenue: '',
  budget: '',
  teamSize: '',
  customersMarket: '',
  toolsText: '',
  tasks: [],
  achievements: [],
  tools: [],
  bullets: [],
  tasksWithMetrics: [],
  achievementsWithMetrics: [],
  stationProjects: [],
});

function formatDate(month?: string, year?: string) {
  if (!month || !year) return '';
  return `${month}.${year}`;
}

function syncDates(exp: LocalWorkExperience): LocalWorkExperience {
  const startDate = formatDate(exp.startMonth, exp.startYear);
  let endDate = '';
  if (exp.current) {
    endDate = 'Heute';
  } else {
    endDate = formatDate(exp.endMonth, exp.endYear);
  }
  return { ...exp, startDate, endDate };
}

function getSortValue(exp: LocalWorkExperience): number {
  const year = parseInt(exp.startYear || '0', 10);
  const month = parseInt(exp.startMonth || '0', 10);
  return year * 100 + month;
}

const createEmptyProject = (): Project => ({
  name: '',
  description: '',
  role: '',
  result: '',
  technologies: [],
});

export function WorkExperienceStep({
  data,
  experienceLevel,
  onChange,
  onNext,
  onBack,
  onSkip,
}: WorkExperienceStepProps) {
  const [showValidationHint, setShowValidationHint] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [experiences, setExperiences] = useState<LocalWorkExperience[]>(() => {
    if (data && data.length > 0) {
      return data.map((exp) => ({
        ...exp,
        startMonth: (exp as any).startMonth ?? '',
        startYear: (exp as any).startYear ?? '',
        endMonth: (exp as any).endMonth ?? '',
        endYear: (exp as any).endYear ?? '',
        current: (exp as any).current ?? false,
        tasksWithMetrics: (exp as any).tasksWithMetrics ?? [],
        achievementsWithMetrics: (exp as any).achievementsWithMetrics ?? [],
        stationProjects: (exp as any).stationProjects ?? [],
      }));
    }
    return [createEmptyExperience()];
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'tasks' | 'projects'>('tasks');
  const [showConfirmNext, setShowConfirmNext] = useState(false);
  const [showStarCoaching, setShowStarCoaching] = useState(true);
  const [tasksSuggestions, setTasksSuggestions] = useState<string[]>([]);
  const [achievementsSuggestions, setAchievementsSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const activeExp = experiences[activeIndex];
  const expLevel: ExperienceLevel = experienceLevel || 'beginner';

  const sortedExperienceIndices = experiences
    .map((exp, index) => ({ exp, index }))
    .sort((a, b) => getSortValue(b.exp) - getSortValue(a.exp))
    .map(item => item.index);

  const updateExperience = (index: number, field: keyof LocalWorkExperience, value: any) => {
    setExperiences(prev => {
      const updated = [...prev];
      let exp = { ...updated[index], [field]: value };
      if (['startMonth', 'startYear', 'endMonth', 'endYear', 'current'].includes(field as string)) {
        exp = syncDates(exp);
      }
      updated[index] = exp;
      onChange(updated as WorkExperience[]);
      return updated;
    });
  };

  const updateTasksWithMetrics = (index: number, tasks: any[]) => {
    setExperiences(prev => {
      const updated = [...prev];
      const exp = { ...updated[index] };
      exp.tasksWithMetrics = tasks;
      exp.tasks = tasks.map((t: any) => t.metrics?.description || t.task || '').filter(Boolean);
      updated[index] = exp;
      onChange(updated as WorkExperience[]);
      return updated;
    });
  };

  const updateAchievementsWithMetrics = (index: number, achievements: any[]) => {
    setExperiences(prev => {
      const updated = [...prev];
      const exp = { ...updated[index] };
      exp.achievementsWithMetrics = achievements;
      exp.achievements = achievements.map((t: any) => t.metrics?.description || t.task || '').filter(Boolean);
      updated[index] = exp;
      onChange(updated as WorkExperience[]);
      return updated;
    });
  };

  const updateStationProjects = (index: number, projects: Project[]) => {
    setExperiences(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], stationProjects: projects };
      onChange(updated as WorkExperience[]);
      return updated;
    });
  };

  const addStationProject = (index: number) => {
    const current = experiences[index].stationProjects || [];
    updateStationProjects(index, [...current, createEmptyProject()]);
  };

  const removeStationProject = (expIndex: number, projectIndex: number) => {
    const current = experiences[expIndex].stationProjects || [];
    updateStationProjects(expIndex, current.filter((_, i) => i !== projectIndex));
  };

  const updateStationProjectField = (expIndex: number, projectIndex: number, field: keyof Project, value: any) => {
    const current = [...(experiences[expIndex].stationProjects || [])];
    current[projectIndex] = { ...current[projectIndex], [field]: value };
    updateStationProjects(expIndex, current);
  };

  const addExperience = () => {
    const newExp = createEmptyExperience();
    setExperiences(prev => {
      const updated = [...prev, newExp];
      onChange(updated as WorkExperience[]);
      return updated;
    });
    setActiveIndex(experiences.length);
    setActiveTab('tasks');
  };

  const removeExperience = (index: number) => {
    if (experiences.length === 1) return;
    setExperiences(prev => {
      const updated = prev.filter((_, i) => i !== index);
      setActiveIndex(Math.max(0, index - 1));
      onChange(updated as WorkExperience[]);
      return updated;
    });
  };

  const handleNext = () => {
    if (!isValidExperience) {
      setShowValidationHint(true);
      setAttempted(true);
      return;
    }
    setShowValidationHint(false);
    setShowConfirmNext(true);
  };

  const handleConfirmNext = () => {
    setShowConfirmNext(false);
    onNext();
  };

  const handleAddAnotherStation = () => {
    setShowConfirmNext(false);
    addExperience();
  };

  const updateToolsText = (index: number, text: string) => {
    setExperiences(prev => {
      const updated = [...prev];
      const exp = { ...updated[index] };
      exp.toolsText = text;
      exp.tools = text.split(',').map(t => t.trim()).filter(Boolean);
      updated[index] = exp;
      onChange(updated as WorkExperience[]);
      return updated;
    });
  };

  useEffect(() => {
    const loadSuggestions = async () => {
      if (!activeExp) return;
      if (!activeExp.jobTitle || !activeExp.company) {
        setTasksSuggestions(TASKS_BY_LEVEL[expLevel]);
        setAchievementsSuggestions(ACHIEVEMENTS_BY_LEVEL[expLevel]);
        return;
      }
      setIsLoadingSuggestions(true);
      try {
        const context = {
          jobTitle: activeExp.jobTitle,
          company: activeExp.company,
          industry: activeExp.industry,
          experienceLevel: expLevel,
          location: activeExp.location,
          startDate: activeExp.startDate,
          endDate: activeExp.endDate,
          current: activeExp.current,
        };
        const [tasks, achievements] = await Promise.all([
          getPersonalizedSuggestions({ context, type: 'tasks', count: 12 }),
          getPersonalizedSuggestions({ context, type: 'achievements', count: 10 }),
        ]);
        setTasksSuggestions(tasks);
        setAchievementsSuggestions(achievements);
      } catch {
        setTasksSuggestions(TASKS_BY_LEVEL[expLevel]);
        setAchievementsSuggestions(ACHIEVEMENTS_BY_LEVEL[expLevel]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };
    loadSuggestions();
  }, [activeIndex, activeExp?.jobTitle, activeExp?.company, activeExp?.industry, expLevel]);

  if (!activeExp) return null;

  const isValidExperience =
    activeExp.jobTitle?.trim() &&
    activeExp.company?.trim() &&
    activeExp.startMonth &&
    activeExp.startYear &&
    (activeExp.current || (activeExp.endMonth && activeExp.endYear));

  const selectBase =
    'w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/40 text-white text-sm md:text-base focus:outline-none focus:border-[#66c0b6]';

  const reqInput = (value: string | undefined) =>
    `w-full px-4 py-3 rounded-xl bg-white/10 border text-white placeholder-white/40 focus:outline-none transition-colors ${
      attempted && !value?.trim()
        ? 'border-red-500/70 focus:border-red-400 bg-red-500/5'
        : 'border-white/25 focus:border-[#66c0b6]'
    }`;

  const reqSelect = (value: string | undefined) =>
    `${selectBase} ${attempted && !value ? 'border-red-500/70 focus:border-red-400' : ''}`;

  const stationProjects = activeExp.stationProjects || [];

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:p-6 lg:max-w-7xl lg:mx-auto">
      <div className="flex-1 space-y-4 animate-fade-in max-w-3xl mx-auto w-full pb-28 lg:pb-0 px-4 lg:px-0">
        <div className="text-center space-y-1.5">
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold bg-gradient-to-r from-white via-[#66c0b6] to-white bg-clip-text text-transparent leading-tight">
            Berufserfahrung
          </h1>
          <p className="text-sm text-white/60">
            Je detaillierter deine Angaben, desto stärker werden die Bulletpoints.
          </p>
        </div>

        {/* Station Tabs – improved card layout */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Berufsstationen ({experiences.length})</p>
            <button
              onClick={addExperience}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#66c0b6]/15 text-[#66c0b6] hover:bg-[#66c0b6]/25 transition-all text-xs font-medium"
            >
              <Plus size={14} /> Station hinzufügen
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sortedExperienceIndices.map((index, tabOrderIndex) => {
              const exp = experiences[index];
              const isActive = index === activeIndex;
              const hasCompany = exp.company?.trim();
              const hasTitle = exp.jobTitle?.trim();
              const period =
                exp.startDate && exp.endDate
                  ? `${exp.startDate} – ${exp.endDate}`
                  : exp.startDate || null;
              const isFilled = !!(hasCompany && hasTitle && exp.startMonth && exp.startYear);

              return (
                <button
                  key={index}
                  onClick={() => { setActiveIndex(index); setActiveTab('tasks'); setAttempted(false); }}
                  className={`
                    relative flex items-start gap-3 p-3 rounded-xl text-left transition-all border
                    ${isActive
                      ? 'bg-[#66c0b6]/15 border-[#66c0b6]/50 ring-1 ring-[#66c0b6]/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }
                  `}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 ${isActive ? 'bg-[#66c0b6]/30' : 'bg-white/10'}`}>
                    <Briefcase size={14} className={isActive ? 'text-[#66c0b6]' : 'text-white/50'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-white/80'}`}>
                      {hasTitle ? exp.jobTitle : `Station ${tabOrderIndex + 1}`}
                    </p>
                    {hasCompany && (
                      <p className="text-xs text-white/50 truncate">{exp.company}</p>
                    )}
                    {period && (
                      <p className="text-xs text-white/35 mt-0.5">{period}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    {isFilled && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold">
                        <CheckCircle size={9} /> OK
                      </span>
                    )}
                    {isActive && <ChevronRight size={12} className="text-[#66c0b6]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Formular */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 space-y-5 border border-white/10">

          {/* Block 1: Pflichtfelder */}
          <div>
            <p className="text-xs font-semibold text-[#66c0b6] uppercase tracking-wider mb-3">Position & Unternehmen</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-1.5">
                  Position / Jobtitel *
                  <span className="ml-1 text-white/40 text-xs font-normal">– exakt wie auf dem Vertrag</span>
                </label>
                <input
                  type="text"
                  value={activeExp.jobTitle || ''}
                  onChange={(e) => updateExperience(activeIndex, 'jobTitle', e.target.value)}
                  placeholder="z.B. Sales Manager, Software Engineer"
                  className={reqInput(activeExp.jobTitle)}
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-1.5">Unternehmen *</label>
                <input
                  type="text"
                  value={activeExp.company || ''}
                  onChange={(e) => updateExperience(activeIndex, 'company', e.target.value)}
                  placeholder="z.B. SAP AG, BMW Group"
                  className={reqInput(activeExp.company)}
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-1.5">
                  Senioritätslevel
                  <span className="ml-1 text-white/40 text-xs font-normal">– hilft der KI beim Schreiben</span>
                </label>
                <select
                  value={(activeExp as any).roleLevel || ''}
                  onChange={(e) => updateExperience(activeIndex, 'roleLevel' as any, e.target.value)}
                  className={selectBase}
                >
                  {ROLE_LEVELS.map((rl) => (
                    <option key={rl.value} value={rl.value}>{rl.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-1.5">Branche</label>
                <select
                  value={activeExp.industry || ''}
                  onChange={(e) => updateExperience(activeIndex, 'industry', e.target.value)}
                  className={selectBase}
                >
                  <option value="">Branche wählen</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind.value} value={ind.value}>{ind.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-1.5">Standort</label>
                <input
                  type="text"
                  value={activeExp.location || ''}
                  onChange={(e) => updateExperience(activeIndex, 'location', e.target.value)}
                  placeholder="z.B. München / Remote"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder-white/40 focus:outline-none focus:border-[#66c0b6]"
                />
              </div>
            </div>
          </div>

          {/* Block 2: Zeitraum */}
          <div>
            <p className="text-xs font-semibold text-[#66c0b6] uppercase tracking-wider mb-3">Zeitraum *</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/60 mb-1.5">Startdatum</p>
                <div className="grid grid-cols-2 gap-2">
                  <select value={activeExp.startMonth || ''} onChange={(e) => updateExperience(activeIndex, 'startMonth', e.target.value)} className={reqSelect(activeExp.startMonth)}>
                    <option value="">Monat</option>
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={activeExp.startYear || ''} onChange={(e) => updateExperience(activeIndex, 'startYear', e.target.value)} className={reqSelect(activeExp.startYear)}>
                    <option value="">Jahr *</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-white/60">Enddatum</p>
                  <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                    <input type="checkbox" checked={!!activeExp.current} onChange={(e) => updateExperience(activeIndex, 'current', e.target.checked)} className="rounded" />
                    Aktuell hier tätig
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select value={activeExp.current ? '' : activeExp.endMonth || ''} onChange={(e) => updateExperience(activeIndex, 'endMonth', e.target.value)} disabled={!!activeExp.current} className={`${!activeExp.current ? reqSelect(activeExp.endMonth) : selectBase} disabled:opacity-40`}>
                    <option value="">Monat</option>
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={activeExp.current ? '' : activeExp.endYear || ''} onChange={(e) => updateExperience(activeIndex, 'endYear', e.target.value)} disabled={!!activeExp.current} className={`${!activeExp.current ? reqSelect(activeExp.endYear) : selectBase} disabled:opacity-40`}>
                    <option value="">Jahr *</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Block 3: Tools & Software */}
          <div>
            <label className="flex items-center gap-2 text-white/80 text-sm font-medium mb-1.5">
              <Wrench size={14} className="text-[#66c0b6]" />
              Tools & Software
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#66c0b6]/15 text-[#66c0b6] text-xs font-semibold">ATS</span>
            </label>
            <p className="text-xs text-white/45 mb-2">
              Komma-getrennt – diese Begriffe matchen direkt mit ATS-Scansystemen
            </p>
            <input
              type="text"
              value={(activeExp as any).toolsText || activeExp.tools?.join(', ') || ''}
              onChange={(e) => updateToolsText(activeIndex, e.target.value)}
              placeholder="z.B. Salesforce, HubSpot, Excel, SAP, Jira, Figma, Python..."
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder-white/40 focus:outline-none focus:border-[#66c0b6]"
            />
          </div>

          {/* Block 4: KPIs & Kontext */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-semibold text-[#66c0b6] uppercase tracking-wider">Kontext & KPIs</p>
              <span className="text-xs text-white/40">(optional – aber sehr empfohlen)</span>
              <div className="relative group">
                <Info size={13} className="text-white/30 cursor-help" />
                <div className="absolute left-0 bottom-full mb-1 w-64 p-2.5 rounded-xl bg-slate-800 border border-white/10 text-xs text-white/70 hidden group-hover:block z-10 leading-relaxed">
                  Zahlen und Kontext machen deine Bulletpoints deutlich stärker. Recruiter lesen CVs in 6–8 Sekunden – Zahlen stechen sofort ins Auge.
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-1.5">Umsatz / Revenue</label>
                <input
                  type="text"
                  value={activeExp.revenue || ''}
                  onChange={(e) => updateExperience(activeIndex, 'revenue', e.target.value)}
                  placeholder="z.B. 2 Mio. € Umsatzverantwortung"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder-white/40 focus:outline-none focus:border-[#66c0b6]"
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-1.5">Budget</label>
                <input
                  type="text"
                  value={activeExp.budget || ''}
                  onChange={(e) => updateExperience(activeIndex, 'budget', e.target.value)}
                  placeholder="z.B. 500k€ Marketingbudget"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder-white/40 focus:outline-none focus:border-[#66c0b6]"
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-1.5">Teamgröße / Führung</label>
                <input
                  type="text"
                  value={activeExp.teamSize || ''}
                  onChange={(e) => updateExperience(activeIndex, 'teamSize', e.target.value)}
                  placeholder="z.B. 8 Mitarbeitende geführt"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder-white/40 focus:outline-none focus:border-[#66c0b6]"
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-1.5">Kunden / Markt</label>
                <input
                  type="text"
                  value={activeExp.customersMarket || ''}
                  onChange={(e) => updateExperience(activeIndex, 'customersMarket', e.target.value)}
                  placeholder="z.B. B2B Enterprise, DACH-Region"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder-white/40 focus:outline-none focus:border-[#66c0b6]"
                />
              </div>
            </div>
          </div>

          {/* Aufgaben / Projekte Tabs */}
          <div>
            <div className="flex gap-1 mb-4 bg-white/5 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'tasks'
                    ? 'bg-[#66c0b6] text-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Aufgaben & Erfolge
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'projects'
                    ? 'bg-[#66c0b6] text-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <FolderOpen size={14} />
                Projekte
                {stationProjects.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'projects' ? 'bg-black/20 text-black' : 'bg-[#66c0b6]/20 text-[#66c0b6]'}`}>
                    {stationProjects.length}
                  </span>
                )}
              </button>
            </div>

            {activeTab === 'tasks' && (
              <div className="space-y-6">
                <AnimatePresence>
                  {showStarCoaching && (
                    <STARCoachingBanner
                      jobTitle={activeExp.jobTitle}
                      industry={activeExp.industry}
                      onDismiss={() => setShowStarCoaching(false)}
                    />
                  )}
                </AnimatePresence>
                <div>
                  <p className="text-xs font-semibold text-[#66c0b6] uppercase tracking-wider mb-3">
                    Aufgaben & Verantwortlichkeiten
                    <span className="ml-2 text-white/35 font-normal normal-case">– wähle aus Kategorien</span>
                  </p>
                  <CategorizedTasksInput
                    experienceLevel={expLevel}
                    industry={activeExp.industry}
                    value={(activeExp.tasksWithMetrics as any[]) || []}
                    onChange={(tasks) => updateTasksWithMetrics(activeIndex, tasks)}
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#66c0b6] uppercase tracking-wider mb-1.5">Messbare Erfolge</p>
                  <p className="text-xs text-white/45 mb-3">Optional – Recruiter entscheiden oft anhand von Zahlen.</p>
                  <TasksWithMetricsInput
                    experienceLevel={expLevel}
                    suggestedTasks={achievementsSuggestions.length > 0 ? achievementsSuggestions : ACHIEVEMENTS_BY_LEVEL[expLevel]}
                    value={(activeExp.achievementsWithMetrics as any[]) || []}
                    onChange={(achievements) => updateAchievementsWithMetrics(activeIndex, achievements)}
                    title="Erfolge mit Zahlen belegen"
                    emptyMessage="Klicke auf einen Erfolg und füge Zahlen hinzu"
                  />
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-4">
                <p className="text-xs text-white/50">
                  Füge Projekte hinzu, die du in dieser Station umgesetzt hast.
                </p>

                {stationProjects.map((project, pIdx) => (
                  <div key={pIdx} className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#66c0b6]">Projekt {pIdx + 1}</span>
                      <button
                        onClick={() => removeStationProject(activeIndex, pIdx)}
                        className="p-1 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={project.name || ''}
                      onChange={(e) => updateStationProjectField(activeIndex, pIdx, 'name', e.target.value)}
                      placeholder="Projektname *"
                      className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/35 focus:outline-none focus:border-[#66c0b6] text-sm"
                    />
                    <textarea
                      value={project.description || ''}
                      onChange={(e) => updateStationProjectField(activeIndex, pIdx, 'description', e.target.value)}
                      placeholder="Kurze Beschreibung des Projekts"
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/35 focus:outline-none focus:border-[#66c0b6] text-sm resize-none"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={project.role || ''}
                        onChange={(e) => updateStationProjectField(activeIndex, pIdx, 'role', e.target.value)}
                        placeholder="Deine Rolle (z.B. Projektleiter)"
                        className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/35 focus:outline-none focus:border-[#66c0b6] text-sm"
                      />
                      <input
                        type="text"
                        value={project.result || ''}
                        onChange={(e) => updateStationProjectField(activeIndex, pIdx, 'result', e.target.value)}
                        placeholder="Ergebnis / Erfolg"
                        className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/35 focus:outline-none focus:border-[#66c0b6] text-sm"
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => addStationProject(activeIndex)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/20 text-white/50 hover:text-white hover:border-[#66c0b6]/40 hover:bg-[#66c0b6]/5 transition-all text-sm"
                >
                  <Plus size={16} /> Projekt hinzufügen
                </button>
              </div>
            )}
          </div>

          {experiences.length > 1 && (
            <button
              onClick={() => removeExperience(activeIndex)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
            >
              <Trash2 size={18} /> Diese Station entfernen
            </button>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:block pt-4">
          {showValidationHint && !isValidExperience && (
            <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/25 animate-fade-in">
              <p className="text-red-400 text-sm font-medium mb-1">Bitte fülle die rot markierten Felder aus:</p>
              <ul className="text-red-300/80 text-xs space-y-0.5 ml-3">
                {!activeExp.jobTitle?.trim() && <li>• Position / Jobtitel</li>}
                {!activeExp.company?.trim() && <li>• Unternehmen</li>}
                {!activeExp.startYear && <li>• Startjahr</li>}
                {!activeExp.current && !activeExp.endYear && <li>• Endjahr (oder „Aktuell hier tätig" aktivieren)</li>}
              </ul>
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="mt-2 flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
                >
                  <SkipForward size={13} />
                  Diesen Schritt überspringen
                </button>
              )}
            </div>
          )}
          <div className="flex justify-between items-center">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all"
            >
              <ArrowLeft size={20} /> Zurück
            </button>
            <button
              onClick={handleNext}
              className={`px-12 py-4 rounded-2xl font-bold text-lg transition-all flex items-center gap-3 shadow-2xl ${
                isValidExperience
                  ? 'bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black hover:opacity-90 hover:scale-105'
                  : 'bg-gradient-to-r from-[#66c0b6]/60 to-[#30E3CA]/60 text-black/70 cursor-pointer'
              }`}
            >
              Weiter <ArrowRight size={22} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#020617] via-[#020617]/95 to-transparent z-50 pt-3">
          {showValidationHint && !isValidExperience && (
            <div className="mx-4 mb-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25 animate-fade-in">
              <p className="text-red-400 text-sm font-medium mb-1">Rot markierte Felder ausfüllen:</p>
              <ul className="text-red-300/80 text-xs space-y-0.5 ml-3">
                {!activeExp.jobTitle?.trim() && <li>• Position / Jobtitel</li>}
                {!activeExp.company?.trim() && <li>• Unternehmen</li>}
                {!activeExp.startYear && <li>• Startjahr</li>}
                {!activeExp.current && !activeExp.endYear && <li>• Endjahr oder „Aktuell" wählen</li>}
              </ul>
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="mt-1.5 flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
                >
                  <SkipForward size={13} />
                  Überspringen
                </button>
              )}
            </div>
          )}
          <div className="flex justify-between items-center gap-3 px-4 pb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-white/70 hover:text-white active:bg-white/10 transition-all touch-manipulation min-w-[90px]"
            >
              <ArrowLeft size={18} />
              <span className="font-medium text-sm">Zurück</span>
            </button>
            <button
              onClick={handleNext}
              className={`flex-1 px-5 py-3 rounded-xl font-bold text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg touch-manipulation ${
                isValidExperience
                  ? 'bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black hover:opacity-90'
                  : 'bg-gradient-to-r from-[#66c0b6]/60 to-[#30E3CA]/60 text-black/70'
              }`}
            >
              Weiter <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="hidden lg:block">
        <AvatarSidebar
          message="Tools & Zahlen sind Gold wert! Recruiter scannen CVs in Sekunden – konkrete Zahlen und bekannte Software-Namen fallen sofort auf."
          stepInfo="Tipp: Gib alle Tools kommagetrennt ein. Je mehr Kontext (Teamgröße, Umsatz, KPIs), desto stärker werden die KI-Bulletpoints."
          currentStepId="workExperience"
        />
      </div>

      {/* Confirmation Popup */}
      {showConfirmNext && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirmNext(false)} />
          <div className="relative bg-[#0f1a2e] border border-white/15 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#66c0b6]/20 flex items-center justify-center">
                <AlertCircle size={20} className="text-[#66c0b6]" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Alle Stationen eingetragen?</h3>
                <p className="text-white/55 text-sm mt-1">
                  Hast du alle deine Berufsstationen eingetragen oder möchtest du noch eine weitere hinzufügen?
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-5">
              <button
                onClick={handleConfirmNext}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold hover:opacity-90 transition-all"
              >
                <CheckCircle size={18} /> Ja, alles eingetragen – weiter
              </button>
              <button
                onClick={handleAddAnotherStation}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition-all"
              >
                <Plus size={18} /> Noch eine Station hinzufügen
              </button>
              <button
                onClick={() => setShowConfirmNext(false)}
                className="w-full px-5 py-2.5 rounded-xl text-white/50 hover:text-white/70 text-sm transition-all"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
