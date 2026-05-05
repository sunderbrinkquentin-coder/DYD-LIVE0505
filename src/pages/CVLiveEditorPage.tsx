import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, Loader2, AlertTriangle, Sparkles, ArrowLeft, ChevronDown, Briefcase, FileSearch, GraduationCap, Music2, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { exportCVToPDFBlob, debugLogPDFHtml } from '../utils/pdfExportClient';
import { CVTemplateType } from '../components/cv-templates/CVTemplateSelector';
import { ModernCVTemplate } from '../components/cv-templates/templates/ModernCVTemplate';
import { ClassicCVTemplate } from '../components/cv-templates/templates/ClassicCVTemplate';
import { MinimalCVTemplate } from '../components/cv-templates/templates/MinimalCVTemplate';
import { CreativeCVTemplate } from '../components/cv-templates/templates/CreativeCVTemplate';
import { ProfessionalCVTemplate } from '../components/cv-templates/templates/ProfessionalCVTemplate';
import PhotoUpload from '../components/PhotoUpload';
import { supabase } from '../lib/supabase';
import { useCvOptimizationStatus } from '../hooks/useCvOptimizationStatus';

interface EditorSection {
  type: string;
  title?: string;
  content?: string;
  items?: any[];
  [key: string]: any;
}

interface EditorData {
  personalInfo?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    [key: string]: any;
  };
  summary?: string;
  matching_text?: string;
  sections?: EditorSection[];
  projects?: any[];
  languages?: any[];
  [key: string]: any;
}

const templates = [
  { id: 'modern' as CVTemplateType, name: 'Modern', icon: '🌊' },
  { id: 'classic' as CVTemplateType, name: 'Klassisch', icon: '📜' },
  { id: 'minimal' as CVTemplateType, name: 'Minimal', icon: '⚪' },
  { id: 'creative' as CVTemplateType, name: 'Kreativ', icon: '🎨' },
  { id: 'professional' as CVTemplateType, name: 'Professional', icon: '💼' },
];

interface LoadingPageProps {
  elapsedSeconds: number;
  activeStep: number;
  PROCESSING_STEPS: { label: string; detail: string }[];
  INFOS: { tag: string; title: string; description: string; icon: React.ReactNode; accent: string; amber?: boolean }[];
}

function LoadingPageContent({ elapsedSeconds, activeStep, PROCESSING_STEPS, INFOS }: LoadingPageProps) {
  const [expandedInfo, setExpandedInfo] = useState<number | null>(null);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const t = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(t);
  }, []);

  const currentStep = PROCESSING_STEPS[Math.min(activeStep, PROCESSING_STEPS.length - 1)];

  return (
    <div className="min-h-screen bg-[#06060e] text-white overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-[#66c0b6]/6 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] bg-[#30E3CA]/4 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 left-1/3 w-[400px] h-[400px] bg-[#66c0b6]/5 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-12">

        {/* Main loader */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#66c0b6]/20 to-[#30E3CA]/10 border border-[#66c0b6]/30 flex items-center justify-center">
                <Loader2 size={36} className="text-[#66c0b6] animate-spin" />
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#66c0b6] animate-ping opacity-75" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#66c0b6]" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">
            Dein CV wird optimiert{dots}
          </h1>
          <p className="text-white/40 text-sm mb-2">{elapsedSeconds}s · Automatische Weiterleitung sobald fertig</p>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#66c0b6]/10 border border-[#66c0b6]/20">
            <div className="w-2 h-2 rounded-full bg-[#66c0b6] animate-pulse" />
            <span className="text-sm text-[#66c0b6] font-medium">{currentStep?.label}</span>
          </div>
          {currentStep?.detail && (
            <p className="text-white/30 text-xs mt-2">{currentStep.detail}</p>
          )}
        </div>

        {/* Steps timeline */}
        <div className="mb-12 space-y-1">
          {PROCESSING_STEPS.map((step, i) => {
            const done = i < activeStep;
            const active = i === activeStep;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
                  active ? 'bg-[#66c0b6]/8 border border-[#66c0b6]/20' : 'border border-transparent'
                }`}
              >
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ${
                  done ? 'bg-[#66c0b6]' : active ? 'border-2 border-[#66c0b6]' : 'border border-white/10'
                }`}>
                  {done
                    ? <Check size={12} className="text-black" />
                    : active
                      ? <div className="w-2 h-2 rounded-full bg-[#66c0b6] animate-pulse" />
                      : null}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium transition-all duration-500 ${done ? 'text-[#66c0b6]' : active ? 'text-white' : 'text-white/20'}`}>
                    {step.label}
                  </span>
                  {active && (
                    <p className="text-xs text-white/40 mt-0.5 truncate">{step.detail}</p>
                  )}
                </div>
                {active && (
                  <div className="flex gap-1 flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#66c0b6] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#66c0b6] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#66c0b6] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info accordions */}
        <div className="mb-4">
          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-white/25 uppercase tracking-widest flex-shrink-0">Während du wartest</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <div className="space-y-2">
            {INFOS.map((info, i) => {
              const isOpen = expandedInfo === i;
              return (
                <div
                  key={i}
                  className="rounded-xl border overflow-hidden transition-all duration-300"
                  style={{ borderColor: isOpen ? (info.amber ? 'rgba(245,158,11,0.35)' : 'rgba(102,192,182,0.35)') : 'rgba(255,255,255,0.06)' }}
                >
                  <button
                    onClick={() => setExpandedInfo(isOpen ? null : i)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: info.amber ? 'rgba(245,158,11,0.1)' : 'rgba(102,192,182,0.1)' }}
                    >
                      {info.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-[10px] uppercase tracking-widest font-semibold"
                        style={{ color: info.accent }}
                      >
                        {info.tag}
                      </span>
                      <p className="text-sm font-medium text-white leading-tight">{info.title}</p>
                    </div>
                    <ChevronDown
                      size={16}
                      className="flex-shrink-0 text-white/30 transition-transform duration-300"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-white/[0.05]">
                      <p className="text-sm text-white/60 leading-relaxed">{info.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-white/15 text-xs pb-6 mt-4">
          Diese Seite aktualisiert sich automatisch — kein Neuladen nötig.
        </p>
      </div>
    </div>
  );
}

export function CVLiveEditorPage() {
  const { cvId } = useParams<{ cvId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  console.log('[CV EDITOR] Route cvId ===>', cvId);

  const {
    cvData,
    isLoading,
    isCompleted,
    isReady,
    isFailed,
    error: statusError,
    elapsedSeconds,
  } = useCvOptimizationStatus(cvId);

  const [editorData, setEditorData] = useState<EditorData | null>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoPosition, setPhotoPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [cvStatus, setCvStatus] = useState<string>('processing');
  const [error, setError] = useState<string | null>(null);
  const [hasEditorChanges, setHasEditorChanges] = useState(false);

  const [selectedTemplate, setSelectedTemplate] =
    useState<CVTemplateType>('modern');
  const [isTemplateReady, setIsTemplateReady] = useState(false);
  const templateSaveTimerRef = useRef<number | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [isDownloadUnlocked, setIsDownloadUnlocked] = useState(false);

  const [showTips, setShowTips] = useState(false);
  const [showPaymentSuccessBanner, setShowPaymentSuccessBanner] = useState(false);
  const [showJobDescription, setShowJobDescription] = useState(false);

  const [templateConfirmed, setTemplateConfirmed] = useState(false);

  const cvPreviewRef = useRef<HTMLDivElement | null>(null);
  const pdfRenderRef = useRef<HTMLDivElement | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const autoDownloadTriggeredRef = useRef(false);

  // Expose debug helper on window so it can be triggered from DevTools console:
  //   window.__debugPdfHtml()
  useEffect(() => {
    (window as any).__debugPdfHtml = () => debugLogPDFHtml(pdfRenderRef);
    return () => { delete (window as any).__debugPdfHtml; };
  }, []);

  // Auto-Save Refs
  const isInitialLoadRef = useRef(true);
  const saveTimeoutRef = useRef<number | null>(null);

  // Fetch selected_template from DB on mount (especially needed for post-payment PDF render)
  useEffect(() => {
    if (!cvId) {
      setIsTemplateReady(true);
      return;
    }
    supabase
      .from('stored_cvs')
      .select('selected_template')
      .eq('id', cvId)
      .maybeSingle()
      .then(({ data }) => {
        const t = data?.selected_template;
        if (t && ['modern','classic','minimal','creative','professional'].includes(t)) {
          setSelectedTemplate(t as CVTemplateType);
        }
        setIsTemplateReady(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cvId]);

  // 🔁 Datenverarbeitung wenn useCvOptimizationStatus fertig ist
  useEffect(() => {
    if (!cvId) {
      setError('Keine CV-ID gefunden.');
      return;
    }

    if (!isCompleted && !isReady && !isFailed) return;

    if (isFailed) {
      setError(statusError || 'Die CV-Optimierung ist fehlgeschlagen. Bitte versuche es erneut.');
      setCvStatus('failed');
      return;
    }

    if (!cvData || !cvData.id) return;

    // Don't overwrite user edits with Make.com optimized data
    if (hasEditorChanges && isCompleted && !isReady) return;

    const processData = async () => {
      console.log('[CV EDITOR] ✅ processing cv_data from hook', { cvId, isCompleted, isReady });

      let data: any = cvData;

      const rawHookCvData = (cvData as any)?.cv_data;
      const hookHasCvData = !!rawHookCvData &&
        typeof rawHookCvData === 'object' &&
        !Array.isArray(rawHookCvData) &&
        Object.keys(rawHookCvData).length > 0;

      if (!hookHasCvData) {
        console.log('[CV EDITOR] 🔄 Hook cv_data empty – fetching fresh from Supabase (with retries)...');

        const fetchWithRetry = async (attemptsLeft: number): Promise<any> => {
          const { data: freshData, error: fetchErr } = await supabase
            .from('stored_cvs')
            .select('cv_data, ats_json, job_data, status, download_unlocked, user_id, selected_template')
            .eq('id', cvId)
            .maybeSingle();

          if (fetchErr) {
            console.warn('[CV EDITOR] ⚠️ Fetch error:', fetchErr.message);
            if (attemptsLeft <= 0) return null;
            await new Promise(resolve => setTimeout(resolve, 2000));
            return fetchWithRetry(attemptsLeft - 1);
          }

          if (!freshData) {
            console.warn('[CV EDITOR] ⚠️ No row yet for', cvId);
            if (attemptsLeft <= 0) return null;
            await new Promise(resolve => setTimeout(resolve, 2000));
            return fetchWithRetry(attemptsLeft - 1);
          }

          const hasFreshCvData = !!freshData.cv_data &&
            typeof freshData.cv_data === 'object' &&
            !Array.isArray(freshData.cv_data) &&
            Object.keys(freshData.cv_data).length > 0;

          if (hasFreshCvData || attemptsLeft <= 0) {
            return freshData;
          }

          console.log(`[CV EDITOR] 🔄 cv_data still empty (status=${freshData.status}), retrying in 2s (${attemptsLeft} left)...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return fetchWithRetry(attemptsLeft - 1);
        };

        const freshData = await fetchWithRetry(5);

        if (!freshData) {
          console.warn('[CV EDITOR] ⚠️ Kein Datensatz für id', cvId);
          setError('Kein CV-Datensatz gefunden. Bitte starte den Prozess erneut.');
          setCvStatus('failed');
          return;
        }

        data = freshData;
      } else {
        console.log('[CV EDITOR] ✅ Using cv_data from hook (no second fetch needed)');
      }

      if (user && !data.user_id) {
        try {
          await supabase.from('stored_cvs').update({ user_id: user.id }).eq('id', cvId);
        } catch (linkError) {
          console.error('[CVLiveEditor] Fehler beim Setzen der user_id:', linkError);
        }
      }

      const rawStatus = ((data.status as string) || 'completed').toLowerCase().trim();
      setCvStatus(rawStatus);
      setIsDownloadUnlocked(!!data.download_unlocked);

      // --- Robust JSON parsing (handles single & double-encoded strings) ---
      const parseJsonRobust = (source: any): any => {
        if (!source) return null;
        if (typeof source !== 'string') return source;
        try {
          let parsed = JSON.parse(source);
          if (typeof parsed === 'string') {
            try { parsed = JSON.parse(parsed); } catch { /* keep first parse */ }
          }
          return parsed;
        } catch (e) {
          console.error('[CV EDITOR] ⚠️ JSON.parse failed:', e);
          return null;
        }
      };

      // --- cv_data aus Supabase holen/parsen (no deepSanitize – trust DB data) ---
      let rawCvData: any = null;

      const cvFields = ['cv_data', 'ats_json'];
      let cvField = '';
      for (const field of cvFields) {
        if ((data as any)?.[field]) {
          cvField = field;
          break;
        }
      }

      console.log('[CV EDITOR] 🔍 Available data fields:', {
        has_cv_data: !!(data as any)?.cv_data,
        has_ats_json: !!(data as any)?.ats_json,
        using: cvField || 'none',
      });

      if (cvField) {
        rawCvData = parseJsonRobust((data as any)[cvField]);
      }

      if (!rawCvData || (typeof rawCvData === 'object' && !Array.isArray(rawCvData) && Object.keys(rawCvData).length === 0)) {
        const currentStatus = ((data.status as string) || '').toLowerCase().trim();
        if (currentStatus === 'processing' || currentStatus === 'pending') {
          console.log('[CV EDITOR] ⏳ cv_data empty and status=processing – keeping loading screen');
          setCvStatus(currentStatus);
          return;
        }
        console.warn('[CV EDITOR] ⚠️ cv_data is empty after Make processing');
        setError('Die Optimierung ist abgeschlossen, aber es wurden keine CV-Daten zurückgegeben. Bitte versuche es erneut.');
        setCvStatus('failed');
        return;
      }

      console.log('[CV EDITOR] 🔍 rawCvData Inhalt:', rawCvData);

      if (data.job_data) {
        try {
          setJobData(parseJsonRobust(data.job_data) ?? data.job_data);
        } catch (e) {
          setJobData(data.job_data);
        }
      }

      // Helper: returns arr only if it's a non-empty array
      const nonEmpty = (arr: any): any[] | null =>
        Array.isArray(arr) && arr.length > 0 ? arr : null;

      // Helper: formats a date value to MM/YYYY or 'Heute'
      const formatDate = (raw: any): string => {
        if (!raw) return '';
        const str = String(raw).trim();
        if (!str) return '';
        const lower = str.toLowerCase();
        if (lower === 'present' || lower === 'heute' || lower === 'aktuell' || lower === 'current' || lower === 'now') return 'Heute';
        // Already in MM/YYYY format
        if (/^\d{2}\/\d{4}$/.test(str)) return str;
        // Only a year: YYYY
        if (/^\d{4}$/.test(str)) return `01/${str}`;
        // ISO date: YYYY-MM-DD or YYYY-MM
        const iso = str.match(/^(\d{4})-(\d{2})/);
        if (iso) {
          const y = iso[1];
          const m = iso[2];
          const d = new Date(`${y}-${m}-01`);
          if (!isNaN(d.getTime())) {
            if (d > new Date()) return 'Heute';
            return `${m}/${y}`;
          }
        }
        // DD.MM.YYYY or MM.YYYY
        const dotDMY = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (dotDMY) return `${dotDMY[2].padStart(2, '0')}/${dotDMY[3]}`;
        const dotMY = str.match(/^(\d{1,2})\.(\d{4})$/);
        if (dotMY) return `${dotMY[1].padStart(2, '0')}/${dotMY[2]}`;
        return str;
      };

      // Helper: fallback search across nesting levels for a non-empty array
      const findArray = (fieldNames: string[]): any[] => {
        const sources = [
          rawCvData,
          rawCvData?.editor_data,
          rawCvData?.optimized_cv,
          rawCvData?.cv,
          rawCvData?.data,
          rawCvData?.cv_data,
          rawCvData?.cv_data?.editor_data,
        ].filter(Boolean);

        for (const field of fieldNames) {
          for (const src of sources) {
            const found = nonEmpty(src?.[field]);
            if (found) return found;
          }
        }
        return [];
      };

      // 1) editorPayload: PRIORITIZE flat root fields, fall back to nested keys
      // If rawCvData itself has personalInfo/summary/sections directly, use it as-is
      const hasRootPersonalInfo = !!rawCvData?.personalInfo;
      const hasRootSections = Array.isArray(rawCvData?.sections) && rawCvData.sections.length > 0;
      const hasRootSummary = typeof rawCvData?.summary === 'string';

      const editorPayload: any = hasRootPersonalInfo || hasRootSections || hasRootSummary
        ? rawCvData
        : (rawCvData?.optimized_cv ||
           rawCvData?.cv ||
           rawCvData?.data ||
           rawCvData?.editor_data ||
           rawCvData?.cv_data ||
           rawCvData ||
           {});

      console.log('[CV EDITOR] 📦 Using editorPayload (root fields present:', hasRootPersonalInfo || hasRootSections, ')');

      // 2) Foto extrahieren
      const photoFromPayload =
        editorPayload.photoUrl ||
        editorPayload.photo_url ||
        editorPayload.personalInfo?.photoUrl ||
        editorPayload.personalInfo?.photo_url ||
        editorPayload.personalData?.photoUrl ||
        editorPayload.personalData?.photo_url ||
        editorPayload.personal_data?.photoUrl ||
        editorPayload.personal_data?.photo_url;

      if (photoFromPayload) {
        setPhotoUrl(photoFromPayload);
      }

      if (editorPayload.photoPosition) {
        setPhotoPosition(editorPayload.photoPosition);
      }

      // 3) Personal Info mappen
      const rawPersonal =
        editorPayload.personalInfo ||
        editorPayload.personal_data ||
        editorPayload.personalData ||
        {};

      const builderPersonal =
        editorPayload.personalData || editorPayload.personal_data || {};

      const personalInfo: any = {
        name:
          rawPersonal.name ||
          builderPersonal.full_name ||
          `${builderPersonal.firstName ?? ''} ${builderPersonal.lastName ?? ''}`.trim() ||
          '',
        email: rawPersonal.email || builderPersonal.email || '',
        phone: rawPersonal.phone || builderPersonal.phone || '',
        location:
          rawPersonal.location ||
          builderPersonal.location ||
          [builderPersonal.zipCode, builderPersonal.city].filter(Boolean).join(' ') ||
          '',
        linkedin: rawPersonal.linkedin || builderPersonal.linkedin || '',
        website: rawPersonal.website || builderPersonal.website || builderPersonal.personalWebsite || '',
        github: rawPersonal.github || builderPersonal.github || '',
        portfolio: rawPersonal.portfolio || builderPersonal.portfolio || '',
        experienceLevel: editorPayload.experienceLevel || '',
        roleType: editorPayload.targetRole || '',
        industryType: editorPayload.targetIndustry || '',
      };

      // 4) Sections: 1:1 passthrough if present, manual mapping ONLY as fallback
      let sections: EditorSection[] = [];

      const CATEGORY_PREFIX_RE = /^(Programmiersprachen|Technische\s*F[äa]higkeiten|Fachkenntnisse|Kenntnisse|Fachliche\s*Skills|Technische\s*Skills|Tools?|SoftSkills|Soft\s*Skills|HardSkills|Hard\s*Skills|Skills|F[äa]higkeiten|Sprachen|Languages|Kompetenzen)[:\s\-–]+/i;

      const cleanSkillText = (raw: any): string => {
        if (typeof raw !== 'string') return typeof raw === 'object' && raw !== null ? (raw.name || raw.skill || raw.text || String(raw)) : String(raw ?? '');
        return raw.replace(CATEGORY_PREFIX_RE, '').trim();
      };

      const expandSkillItems = (items: any[]): any[] => {
        const result: any[] = [];
        for (const item of items) {
          const text = cleanSkillText(item);
          if (text.includes(',')) {
            text.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((s: string) => result.push(s));
          } else if (text) {
            result.push(text);
          }
        }
        return result;
      };

      const normalizeSkillSection = (section: EditorSection): EditorSection => {
        const skillTypes = ['skills', 'soft_skills', 'hard_skills', 'tools', 'technical_skills'];
        if (!skillTypes.includes(section.type) || !Array.isArray(section.items)) return section;
        return { ...section, items: expandSkillItems(section.items) };
      };

      const normalizeDateSection = (section: EditorSection): EditorSection => {
        const dateTypes = ['experience', 'education', 'projects', 'volunteering', 'courses'];
        if (!dateTypes.includes(section.type) || !Array.isArray(section.items)) return section;
        return {
          ...section,
          items: section.items.map((item: any) => ({
            ...item,
            date_from: item.date_from ? formatDate(item.date_from) : item.date_from,
            date_to: item.date_to ? formatDate(item.date_to) : item.date_to,
          })),
        };
      };

      const sortSectionNewestFirst = (section: EditorSection): EditorSection => {
        if (section.type !== 'experience' || !Array.isArray(section.items)) return section;
        const parseDateVal = (raw: string): number => {
          if (!raw) return 0;
          const lower = raw.toLowerCase();
          if (lower === 'heute' || lower === 'present' || lower === 'current') return 999999;
          const mmyyyy = raw.match(/^(\d{2})\/(\d{4})$/);
          if (mmyyyy) return parseInt(mmyyyy[2], 10) * 100 + parseInt(mmyyyy[1], 10);
          const yyyy = raw.match(/^(\d{4})$/);
          if (yyyy) return parseInt(yyyy[1], 10) * 100;
          return 0;
        };
        return {
          ...section,
          items: [...section.items].sort((a, b) => {
            const aEnd = parseDateVal(a.date_to || '');
            const bEnd = parseDateVal(b.date_to || '');
            if (aEnd !== bEnd) return bEnd - aEnd;
            return parseDateVal(b.date_from || '') - parseDateVal(a.date_from || '');
          }),
        };
      };

      if (Array.isArray(editorPayload.sections) && editorPayload.sections.length > 0) {
        sections = (editorPayload.sections as EditorSection[]).map(normalizeSkillSection).map(normalizeDateSection).map(sortSectionNewestFirst);
        // Deduplicate: keep only the first occurrence of each section type
        const seenTypes = new Set<string>();
        sections = sections.filter((s) => {
          if (seenTypes.has(s.type)) return false;
          seenTypes.add(s.type);
          return true;
        });
        console.log('[CV EDITOR] 📚 1:1 sections from editorPayload:', sections.map((s) => s.type));

        const personalSection = sections.find((s) => s.type === 'personal' || s.type === 'personalInfo');
        if (personalSection && (personalSection as any).data) {
          Object.assign(personalInfo, (personalSection as any).data);
        }
      } else {
        // Fallback: manual mapping from individual arrays
        console.log('[CV EDITOR] 🔧 No sections array found – building from individual fields (fallback)');

        // Experience
        const experienceItems = findArray(['experiences', 'workExperiences', 'workExperience', 'work_experience', 'cv_experience', 'experience']);
        if (experienceItems.length > 0) {
          const mappedExpItems = experienceItems.map((exp: any) => ({
            title: exp.title || exp.position || exp.role || exp.jobTitle || '',
            company: exp.company || exp.employer || exp.organization || '',
            date_from: formatDate(exp.date_from || exp.from || exp.startDate || exp.start_date || exp.start || ''),
            date_to: formatDate(exp.date_to || exp.to || exp.endDate || exp.end_date || exp.end || '') || 'Heute',
            description: exp.description || exp.responsibilities || exp.summary || '',
            bulletPoints: exp.bulletPoints || exp.bullet_points || exp.achievements || exp.tasks || [],
          }));
          const expSection: EditorSection = { type: 'experience', title: 'Berufserfahrung', items: mappedExpItems };
          sections.push(sortSectionNewestFirst(expSection));
        } else {
          sections.push({ type: 'experience', title: 'Berufserfahrung', items: [] });
        }

        // Education
        const schoolEduItems = nonEmpty(editorPayload.schoolEducation) || [];
        const professionalEduItems = nonEmpty(editorPayload.professionalEducation) || [];
        const wizardCombinedEdu = [...professionalEduItems, ...schoolEduItems];
        const educationItems = findArray(['education', 'cv_education']).length > 0
          ? findArray(['education', 'cv_education'])
          : nonEmpty(wizardCombinedEdu) || [];

        if (educationItems.length > 0) {
          sections.push({
            type: 'education',
            title: 'Ausbildung / Studium',
            items: educationItems.map((edu: any) => ({
              degree: edu.degree || edu.title || edu.qualification || edu.graduation || edu.type || '',
              institution: edu.institution || edu.school || edu.university || edu.schoolName || '',
              date_from: formatDate(edu.date_from || edu.from || edu.startDate || edu.start_date || edu.start || edu.startYear || ''),
              date_to: formatDate(edu.date_to || edu.to || edu.endDate || edu.end_date || edu.end || edu.endYear || edu.year || ''),
              description: edu.description || (Array.isArray(edu.focus) ? edu.focus.join(', ') : edu.focus) || edu.field || '',
            })),
          });
        }

        // Projects
        const projectItems = findArray(['projects', 'project', 'cv_projects']);
        if (projectItems.length > 0) {
          sections.push({
            type: 'projects',
            title: 'Projekte',
            items: projectItems.map((proj: any) => ({
              title: proj.title || proj.name || proj.projectName || '',
              role: proj.role || proj.position || '',
              description: proj.description || proj.summary || proj.result || '',
              bulletPoints: proj.bulletPoints || proj.bullet_points || proj.tasks || proj.achievements || [],
            })),
          });
        }

        // Skills
        const isLanguageItem = (item: any): boolean => {
          const langs = ['deutsch', 'englisch', 'französisch', 'spanisch', 'italienisch', 'portugiesisch', 'russisch', 'chinesisch', 'japanisch', 'arabisch', 'türkisch', 'polnisch', 'niederländisch', 'schwedisch', 'norwegian', 'dänisch', 'finnisch', 'griechisch', 'german', 'english', 'french', 'spanish', 'italian', 'portuguese', 'russian', 'chinese', 'japanese', 'arabic', 'turkish', 'polish', 'dutch', 'swedish', 'danish', 'finnish', 'greek'];
          if (typeof item === 'string') return langs.some(l => item.toLowerCase().includes(l));
          if (typeof item === 'object' && item !== null) {
            const s = JSON.stringify(item).toLowerCase();
            return langs.some(l => s.includes(l)) || 'sprache' in item || 'language' in item || 'niveau' in item;
          }
          return false;
        };

        const collectedLanguagesFallback: any[] = [];
        const skillsData = editorPayload.skills || editorPayload.cv_hard_skills || editorPayload.hard_skills || [];
        const wizardHardSkills = Array.isArray(editorPayload.hardSkills) ? editorPayload.hardSkills : [];
        const wizardSoftSkills = Array.isArray(editorPayload.softSkills) ? editorPayload.softSkills : [];

        if (skillsData && !Array.isArray(skillsData) && typeof skillsData === 'object') {
          const hardSkillsItems = skillsData.hardSkills || skillsData.hard || skillsData.hard_skills || [];
          const softSkillsItems = skillsData.softSkills || skillsData.soft || skillsData.soft_skills || [];
          const pureHard: any[] = [];
          hardSkillsItems.forEach((i: any) => isLanguageItem(i) ? collectedLanguagesFallback.push(i) : pureHard.push(i));
          if (pureHard.length > 0) sections.push({ type: 'skills', title: 'Fähigkeiten', items: expandSkillItems(pureHard) });
          const pureSoft: any[] = [];
          softSkillsItems.forEach((i: any) => isLanguageItem(i) ? collectedLanguagesFallback.push(i) : pureSoft.push(i));
          if (pureSoft.length > 0) sections.push({ type: 'soft_skills', title: 'Soft Skills', items: expandSkillItems(pureSoft) });
        } else if (wizardHardSkills.length > 0) {
          const pure: any[] = [];
          wizardHardSkills.forEach((i: any) => {
            const s = i?.skill || i;
            isLanguageItem(s) ? collectedLanguagesFallback.push(s) : pure.push(s);
          });
          if (pure.length > 0) sections.push({ type: 'skills', title: 'Fähigkeiten', items: expandSkillItems(pure) });
        } else if (Array.isArray(skillsData) && skillsData.length > 0) {
          const pure: any[] = [];
          skillsData.forEach((i: any) => isLanguageItem(i) ? collectedLanguagesFallback.push(i) : pure.push(i));
          if (pure.length > 0) sections.push({ type: 'skills', title: 'Fähigkeiten', items: expandSkillItems(pure) });
        }

        if (wizardSoftSkills.length > 0) {
          const softItems = wizardSoftSkills.map((i: any) => i?.skill || i).filter(Boolean);
          if (softItems.length > 0) sections.push({ type: 'soft_skills', title: 'Soft Skills', items: expandSkillItems(softItems) });
        }

        // Languages (fallback path) — only add if no languages section exists yet
        if (!sections.some((s) => s.type === 'languages')) {
          const langRaw = rawCvData?.languages || editorPayload.languages || editorPayload.language || editorPayload.languageSkills || editorPayload.language_skills || editorPayload.cv_languages || editorPayload.sprachkenntnisse || [];
          const allLangs = [...(Array.isArray(langRaw) ? langRaw : []), ...collectedLanguagesFallback];
          if (allLangs.length > 0) {
            const normalized = allLangs.map((item: any) => {
              if (typeof item === 'string') return { language: item, level: '' };
              if (typeof item === 'object' && item !== null) return { language: item.language || item.name || item.sprache || String(item), level: item.level || item.niveau || item.proficiency || '' };
              return { language: String(item), level: '' };
            }).filter((l) => l.language && l.language.trim());
            if (normalized.length > 0) {
              sections.push({ type: 'languages', title: 'Sprachen', items: normalized });
            }
          }
        }

        // Optional sections
        [
          { key: ['workValues', 'work_values', 'values'], subKey: 'values', type: 'work_values', title: 'Arbeitsweise & Werte' },
          { key: ['certifications', 'certificates', 'cv_certifications'], type: 'certifications', title: 'Zertifikate' },
          { key: ['hobbies', 'interests', 'cv_hobbies'], type: 'hobbies', title: 'Hobbys & Interessen' },
          { key: ['volunteering', 'volunteerExperience', 'cv_volunteering'], type: 'volunteering', title: 'Ehrenamtliches Engagement' },
          { key: ['courses', 'trainings', 'cv_courses'], type: 'courses', title: 'Kurse & Weiterbildungen' },
          { key: ['awards', 'honors', 'cv_awards'], type: 'awards', title: 'Auszeichnungen' },
        ].forEach(({ key, subKey, type, title }) => {
          let items: any = null;
          for (const k of key) {
            const v = editorPayload[k];
            if (v) { items = subKey ? (v[subKey] || v.workStyle || v) : v; break; }
          }
          if (Array.isArray(items) && items.length > 0 && !sections.some(s => s.type === type)) {
            sections.push({ type, title, items });
          }
        });
      }

      if (!Array.isArray(sections)) sections = [];

      // Final deduplication across all paths
      {
        // 1) Deduplicate by type (keep first occurrence)
        const seenFinal = new Set<string>();
        sections = sections.filter((s) => {
          if (seenFinal.has(s.type)) return false;
          seenFinal.add(s.type);
          return true;
        });

        // 2) Merge sections that share an identical normalized title
        const normalize = (t: string) => (t || '').toLowerCase().replace(/[^a-z0-9äöüß]/g, '');
        const titleMap = new Map<string, number>();
        const merged: typeof sections = [];
        for (const sec of sections) {
          const titleKey = normalize(sec.title || sec.type);
          if (titleMap.has(titleKey)) {
            const targetIdx = titleMap.get(titleKey)!;
            if (Array.isArray(sec.items) && sec.items.length > 0) {
              merged[targetIdx] = {
                ...merged[targetIdx],
                items: [...(merged[targetIdx].items || []), ...sec.items],
              };
            }
          } else {
            titleMap.set(titleKey, merged.length);
            merged.push(sec);
          }
        }
        sections = merged;
      }

      console.log('[CV EDITOR] 🎯 FINALE MAPPED SECTIONS:', sections.map(s => ({ type: s.type, items: Array.isArray(s.items) ? s.items.length : 'n/a' })));

      // 5) Languages: only keep top-level languages if NO languages section exists (avoid duplicates)
      const languagesSection = sections.find((s) => s.type === 'languages');
      const normalizedLanguages: any[] = languagesSection ? [] : [];

      // 6) Projects: extract from sections for top-level sync
      const projectsSection = sections.find((s) => s.type === 'projects');

      const resolvedSummary: string | undefined =
        editorPayload.summary ??
        editorPayload.profile_summary ??
        editorPayload.profileSummary ??
        editorPayload.aboutMe ??
        editorPayload.about_me ??
        editorPayload.matching_text ??
        editorPayload.matchingText ??
        editorPayload.generated_summary ??
        editorPayload.generatedSummary ??
        editorPayload.optimized_description ??
        editorPayload.profile_headline ??
        editorPayload.cover_letter ??
        editorPayload.coverLetter ??
        editorPayload.motivation?.text ??
        rawCvData?.summary ??
        rawCvData?.profile_summary ??
        rawCvData?.matching_text;

      const resolvedMatchingText: string | undefined =
        editorPayload.matching_text ??
        editorPayload.matchingText ??
        editorPayload.cover_letter ??
        editorPayload.coverLetter ??
        rawCvData?.matching_text ??
        rawCvData?.matchingText;

      const mappedEditor: EditorData = {
        ...rawCvData,
        ...editorPayload,
        personalInfo,
        summary: resolvedSummary,
        matching_text: resolvedMatchingText,
        sections,
        projects: projectsSection?.items || editorPayload.projects || rawCvData?.projects || [],
        languages: [],
      };

      console.log('[CV EDITOR] 🎯 Top-level projects:', mappedEditor.projects?.length || 0);
      console.log('[CV EDITOR] 🎯 Top-level languages:', mappedEditor.languages?.length || 0);

      // Restore saved template selection if present
      const savedTemplate = (data as any)?.selected_template || (rawCvData as any)?._selectedTemplate;
      if (savedTemplate && ['modern','classic','minimal','creative','professional'].includes(savedTemplate)) {
        setSelectedTemplate(savedTemplate as CVTemplateType);
      }

      setEditorData(mappedEditor);
    };

    processData();
  }, [cvId, isCompleted, isReady, isFailed, cvData, statusError, user]);

  // ------- Supabase Realtime: sofort aktualisieren wenn Make.com schreibt -------
  useEffect(() => {
    if (!cvId || hasEditorChanges) return;

    const channel = supabase
      .channel(`stored_cvs:${cvId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stored_cvs',
          filter: `id=eq.${cvId}`,
        },
        (payload) => {
          const newRow = payload.new as any;
          if (!newRow) return;
          const newStatus = (newRow.status || '').toLowerCase().trim();
          console.log('[CVLiveEditor] 🔄 Realtime update received. Status:', newStatus);
          setCvStatus(newStatus);
          if (newRow.download_unlocked !== undefined) {
            setIsDownloadUnlocked(!!newRow.download_unlocked);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cvId, hasEditorChanges]);

  // ------- Unlock-Status nach Zahlung setzen -------
  useEffect(() => {
    const paymentSuccess = searchParams.get('payment') === 'success';
    if (paymentSuccess) {
      setIsDownloadUnlocked(true);
      setShowPaymentSuccessBanner(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ------- Auto-Download nach erfolgreicher Zahlung -------
  // Runs once after templateConfirmed becomes true + editorData + cvPreviewRef are ready
  useEffect(() => {
    const paymentSuccess = searchParams.get('payment') === 'success';
    if (!paymentSuccess || !editorData || !user || !cvId) return;
    if (!isTemplateReady || !templateConfirmed) return;

    // Guard against double-fire
    if (autoDownloadTriggeredRef.current) return;
    autoDownloadTriggeredRef.current = true;

    const toSlug = (s: string) => s.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

    const doExportAndNavigate = async () => {
      // Wait for React to fully render the PDF template (pdfRenderRef is in the post-payment step-2 UI)
      // Poll until the element has real content or timeout after 5s
      const waitForElement = async (ref: { current: HTMLDivElement | null }, maxMs = 5000): Promise<HTMLDivElement | null> => {
        const start = Date.now();
        while (Date.now() - start < maxMs) {
          const el = ref.current;
          if (el && el.scrollHeight > 50) return el;
          await new Promise((r) => setTimeout(r, 150));
        }
        return ref.current;
      };

      const el = await waitForElement(pdfRenderRef, 5000);

      // Regardless of whether PDF succeeds, always navigate to dashboard
      const navigateToDashboard = () => navigate(`/dashboard?payment=success&highlightCv=${cvId}`);

      // Build job_data with all field name conventions for Kanban
      const existingJobData = jobData || {};
      const normalizedJobData = {
        ...existingJobData,
        jobTitle: existingJobData.jobTitle || existingJobData.positionTitle || '',
        positionTitle: existingJobData.positionTitle || existingJobData.jobTitle || '',
        company: existingJobData.company || existingJobData.companyName || '',
        companyName: existingJobData.companyName || existingJobData.company || '',
      };

      // Always save the current state to DB before navigating
      const saveToDb = async (pdfPublicUrl?: string) => {
        try {
          const finalData = prepareCvDataForSave(editorData);
          await supabase.from('stored_cvs').update({
            cv_data: finalData,
            user_id: user.id,
            download_unlocked: true,
            status: 'completed',
            job_data: normalizedJobData,
            ...(pdfPublicUrl ? { pdf_url: pdfPublicUrl } : {}),
            updated_at: new Date().toISOString(),
          }).eq('id', cvId);
        } catch (e) {
          console.warn('[CVLiveEditor] DB save failed:', e);
        }
      };

      if (!el || el.scrollHeight < 50) {
        // Template not rendered — save + navigate without PDF
        await saveToDb();
        navigateToDashboard();
        return;
      }

      try {
        setIsExportingPDF(true);

        const fullName = editorData.personalInfo?.name || '';
        const lastName = fullName.trim().split(/\s+/).pop() || '';
        const co = normalizedJobData.company || '';
        const fileBaseName = lastName && co
          ? `Lebenslauf_${toSlug(lastName)}_${toSlug(co)}`
          : lastName ? `Lebenslauf_${toSlug(lastName)}` : 'Lebenslauf_Optimiert';

        const pdfBlob = await exportCVToPDFBlob(pdfRenderRef, editorData.personalInfo, { quality: 0.95, scale: 2 });

        // Trigger browser download
        const blobUrl = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${fileBaseName}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

        // Upload to Supabase storage
        let pdfPublicUrl: string | undefined;
        try {
          const filePath = `${user.id}/${cvId}.pdf`;
          const { error: uploadError } = await supabase.storage.from('cv-pdfs').upload(filePath, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true,
          });
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('cv-pdfs').getPublicUrl(filePath);
            pdfPublicUrl = urlData.publicUrl;
          }
        } catch (e) {
          console.warn('[CVLiveEditor] PDF storage upload failed:', e);
        }

        await saveToDb(pdfPublicUrl);
      } catch (err) {
        console.error('[CVLiveEditor] PDF export error:', err);
        // Save without PDF url
        await saveToDb();
      }

      // Always navigate regardless of success/failure
      navigateToDashboard();
    };

    doExportAndNavigate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateConfirmed, editorData, user, cvId, isTemplateReady]);

  // ------- Auto-Save (cv_data) -------
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    if (!editorData || !cvId || !user) return;

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        console.log('[CVLiveEditor] 💾 Auto-saving changes...');

        const projectsSection = editorData.sections?.find(
          (s) => s.type === 'projects'
        );
        const languagesSection = editorData.sections?.find(
          (s) => s.type === 'languages'
        );

        const dataToSave = {
          ...editorData,
          // Sync projects and languages from sections to top-level
          projects: projectsSection?.items || editorData.projects || [],
          languages: languagesSection?.items || editorData.languages || [],
          // Persist photo so it survives page reloads
          photoUrl: photoUrl || editorData.personalInfo?.photoUrl || undefined,
          photoPosition,
        };

        const { error } = await supabase
          .from('stored_cvs')
          .update({
            cv_data: dataToSave,
            updated_at: new Date().toISOString(),
          })
          .eq('id', cvId);

        if (error) {
          console.error('[CVLiveEditor] ❌ Auto-save error:', error);
        } else {
          console.log('[CVLiveEditor] ✅ Auto-saved');
        }
      } catch (error) {
        console.error('[CVLiveEditor] ❌ Auto-save failed:', error);
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editorData, cvId, user]);

  // Helper function to ensure projects and languages are synced between sections and top-level
  const prepareCvDataForSave = (data: EditorData) => {
    const projectsSection = data.sections?.find((s) => s.type === 'projects');
    const languagesSection = data.sections?.find((s) => s.type === 'languages');

    return {
      ...data,
      projects: projectsSection?.items || data.projects || [],
      languages: languagesSection?.items || data.languages || [],
      photoUrl: photoUrl || data.personalInfo?.photoUrl || undefined,
    };
  };

  // ------- Download button: redirect to paywall (post-payment handled via useEffect above) -------
  const handleDownloadClick = () => {
    if (!cvId) return;
    if (!user) {
      const redirectTo = encodeURIComponent(`/cv-paywall?cvId=${cvId}&source=cv_optimizer`);
      navigate(`/login?redirect=${redirectTo}`);
      return;
    }
    navigate(`/cv-paywall?cvId=${cvId}&source=cv_optimizer`);
  };

  const handlePhotoChange = (base64: string | null) => {
    if (base64) {
      setPhotoUrl(base64);
      // Also embed photo in editorData so it persists across template switches and page reloads
      setEditorData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          personalInfo: { ...prev.personalInfo, photoUrl: base64 },
          photoUrl: base64,
        };
      });
      setShowPhotoUpload(false);
    } else {
      setPhotoUrl('');
      setEditorData((prev) => {
        if (!prev) return prev;
        const { photoUrl: _p, ...restPersonal } = prev.personalInfo || {};
        return {
          ...prev,
          personalInfo: restPersonal,
          photoUrl: undefined,
        };
      });
    }
  };

  const handleTemplateChange = (templateId: CVTemplateType) => {
    setSelectedTemplate(templateId);
    if (!cvId) return;
    if (templateSaveTimerRef.current) window.clearTimeout(templateSaveTimerRef.current);
    templateSaveTimerRef.current = window.setTimeout(async () => {
      await supabase
        .from('stored_cvs')
        .update({ selected_template: templateId, updated_at: new Date().toISOString() })
        .eq('id', cvId);
    }, 500);
  };

  const updatePersonalInfo = (field: string, value: string) => {
    setHasEditorChanges(true);
    setEditorData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        personalInfo: { ...(prev.personalInfo || {}), [field]: value },
      };
    });
  };

  const updateSection = (
    sectionIndex: number,
    updates: Partial<EditorSection>
  ) => {
    setHasEditorChanges(true);
    setEditorData((prev) => {
      if (!prev?.sections) return prev;
      const newSections = [...prev.sections];
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        ...updates,
      };
      return { ...prev, sections: newSections };
    });
  };

  const deleteSectionItem = (sectionIndex: number, itemIndex: number) => {
    setHasEditorChanges(true);
    setEditorData((prev) => {
      if (!prev?.sections?.[sectionIndex]) return prev;

      try {
        const newSections = [...prev.sections];
        const section = { ...newSections[sectionIndex] };

        if (!section.items || !Array.isArray(section.items)) {
          console.warn(
            '[CVLiveEditor] ⚠️ Section has no items array:',
            section
          );
          return prev;
        }

        if (itemIndex < 0 || itemIndex >= section.items.length) {
          console.warn(
            '[CVLiveEditor] ⚠️ Invalid item index:',
            itemIndex
          );
          return prev;
        }

        const newItems = section.items.filter((_: any, idx: number) => idx !== itemIndex);
        section.items = newItems;

        newSections[sectionIndex] = section;

        console.log(
          '[CVLiveEditor] ✅ Deleted item:',
          itemIndex,
          'from section:',
          sectionIndex
        );
        return { ...prev, sections: newSections };
      } catch (error) {
        console.error('[CVLiveEditor] ❌ Delete error:', error);
        return prev;
      }
    });
  };

  const updateSectionItem = (
    sectionIndex: number,
    itemIndex: number,
    field: string,
    value: any
  ) => {
    setHasEditorChanges(true);
    setEditorData((prev) => {
      if (!prev?.sections?.[sectionIndex]) return prev;

      try {
        const newSections = [...prev.sections];
        const section = { ...newSections[sectionIndex] };

        if (!section.items || !Array.isArray(section.items)) {
          console.warn(
            '[CVLiveEditor] ⚠️ Section has no items array:',
            section
          );
          return prev;
        }

        if (itemIndex < 0 || itemIndex >= section.items.length) {
          console.warn(
            '[CVLiveEditor] ⚠️ Invalid item index:',
            itemIndex
          );
          return prev;
        }

        const newItems = [...section.items];
        newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
        section.items = newItems;
        newSections[sectionIndex] = section;

        return { ...prev, sections: newSections };
      } catch (error) {
        console.error('[CVLiveEditor] ❌ Update error:', error);
        return prev;
      }
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050507] via-[#0a0a0f] to-[#050507] text-white flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md px-4">
          <AlertTriangle size={64} className="text-red-500 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold mb-2">Fehler</h2>
            <p className="text-white/60">{error}</p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
          >
            Zurück
          </button>
        </div>
      </div>
    );
  }

  if (!editorData) {
    const isPostPayment = searchParams.get('payment') === 'success';

    if (isPostPayment && isLoading) {
      return (
        <div className="min-h-screen bg-[#06060e] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <Loader2 className="w-12 h-12 text-[#66c0b6] animate-spin" />
            <p className="text-white/70 font-medium">Dein CV wird geladen...</p>
          </div>
        </div>
      );
    }

    const STEP_THRESHOLDS = [0, 2, 5, 8, 12, 17];
    const activeStep = STEP_THRESHOLDS.findIndex((t, i) => {
      const next = STEP_THRESHOLDS[i + 1];
      return next === undefined || elapsedSeconds < next;
    });

    const PROCESSING_STEPS = [
      { label: 'CV-Daten werden eingelesen', detail: 'Struktur und Inhalte werden erkannt' },
      { label: 'Stellenanzeige wird analysiert', detail: 'Keywords und Anforderungen werden extrahiert' },
      { label: 'KI optimiert Formulierungen', detail: 'Jeder Satz wird auf die Stelle zugeschnitten' },
      { label: 'ATS-Keywords werden eingebaut', detail: 'Relevante Begriffe werden strategisch platziert' },
      { label: 'Struktur & Layout werden angepasst', detail: 'Abschnitte werden priorisiert und geordnet' },
      { label: 'Finaler Qualitätscheck läuft', detail: 'Vollständigkeit und Konsistenz werden geprüft' },
    ];

    const INFOS = [
      {
        tag: 'CV-Check',
        title: 'Was ist der CV-Check?',
        description: 'Der CV-Check analysiert deinen bestehenden Lebenslauf vollautomatisch: Er bewertet die ATS-Kompatibilität, erkennt inhaltliche Lücken und gibt dir konkrete Verbesserungsvorschläge — kostenlos und in Sekunden.',
        icon: <FileSearch size={20} className="text-[#66c0b6]" />,
        accent: '#66c0b6',
      },
      {
        tag: 'CV-Erstellung',
        title: 'Wie funktioniert die CV-Optimierung?',
        description: 'Du gibst die Stellenanzeige ein — unsere KI liest deinen CV und passt jeden Abschnitt gezielt auf die Stelle an. Formulierungen werden jobspezifisch umgeschrieben, ATS-Keywords eingebaut und die Reihenfolge optimiert.',
        icon: <Sparkles size={20} className="text-[#66c0b6]" />,
        accent: '#66c0b6',
      },
      {
        tag: 'Career Academy',
        title: 'Was ist die Career Academy?',
        description: 'Die Career Academy hilft dir, deinen persönlichen Karrierepfad zu entwickeln. Mit KI-gestützten Gap-Analysen siehst du, welche Skills du noch brauchst, und bekommst individuell zusammengestellte Lernpfade.',
        icon: <GraduationCap size={20} className="text-[#66c0b6]" />,
        accent: '#66c0b6',
      },
      {
        tag: 'Harmony Festival',
        title: 'Was ist das Harmony Festival?',
        description: 'Ein Tag am Rhein — 22. August 2026. Live-Konzert, DJ-Sets, Stand-Up Comedy, Bierpong-Turnier und das beste Bier aus der Heimat. Kein Karriereevent — ein echtes Festival für echte Begegnung.',
        icon: <Music2 size={20} className="text-amber-400" />,
        accent: '#f59e0b',
        amber: true,
      },
    ];

    return (
      <LoadingPageContent
        elapsedSeconds={elapsedSeconds}
        activeStep={activeStep}
        PROCESSING_STEPS={PROCESSING_STEPS}
        INFOS={INFOS}
      />
    );
  }

  const isPostPaymentFlow = searchParams.get('payment') === 'success';

  if (isPostPaymentFlow && editorData) {
    const safePersonalInfo = editorData.personalInfo || {};
    const safeSections = Array.isArray(editorData.sections) && editorData.sections.length > 0
      ? editorData.sections
      : [{ type: 'experience', title: 'Berufserfahrung', items: [] }];

    // Step 1: Template selection
    if (!templateConfirmed) {
      return (
        <div className="min-h-screen bg-[#06060e] text-white flex flex-col items-center justify-center px-4 py-12">
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-[#66c0b6]/6 rounded-full blur-[120px]" />
            <div className="absolute -bottom-32 right-1/4 w-[500px] h-[500px] bg-[#30E3CA]/4 rounded-full blur-[100px]" />
          </div>
          <div className="relative z-10 w-full max-w-2xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#66c0b6]/10 border border-[#66c0b6]/30 mb-6">
                <Check size={14} className="text-[#66c0b6]" />
                <span className="text-sm text-[#66c0b6] font-medium">Zahlung erfolgreich</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">Wähle dein CV-Design</h1>
              <p className="text-white/50 text-sm">Dein CV wird im gewählten Design als PDF erstellt und heruntergeladen.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    handleTemplateChange(t.id);
                  }}
                  className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 ${
                    selectedTemplate === t.id
                      ? 'border-[#66c0b6] bg-[#66c0b6]/10 shadow-[0_0_20px_rgba(102,192,182,0.2)]'
                      : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/8'
                  }`}
                >
                  {selectedTemplate === t.id && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#66c0b6] flex items-center justify-center">
                      <Check size={11} className="text-black" />
                    </div>
                  )}
                  <span className="text-3xl">{t.icon}</span>
                  <span className={`text-sm font-semibold ${selectedTemplate === t.id ? 'text-[#66c0b6]' : 'text-white/80'}`}>{t.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                autoDownloadTriggeredRef.current = false;
                setTemplateConfirmed(true);
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-3"
            >
              <Sparkles size={20} />
              PDF mit "{templates.find(t => t.id === selectedTemplate)?.name}"-Design erstellen
            </button>
          </div>
        </div>
      );
    }

    // Step 2: PDF generation — render CV normally behind spinner overlay
    return (
      <div style={{ position: 'relative', background: '#f8fafc' }}>
        {/* Full-screen spinner overlay */}
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: 'rgba(2,6,23,0.92)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
        }}>
          <Loader2 className="w-14 h-14 text-[#66c0b6] animate-spin" />
          <h2 className="text-2xl font-bold text-white">PDF wird generiert...</h2>
          <p className="text-white/60 max-w-sm text-center">Bitte schließe dieses Fenster nicht.</p>
        </div>
        {/* CV rendered visibly so html2canvas can capture it properly */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0', background: '#e5e7eb' }}>
          <div
            ref={pdfRenderRef}
            data-pdf-root
            className="bg-white shadow-2xl"
            style={{
              width: '794px',
              minWidth: '794px',
              maxWidth: '794px',
              height: 'auto',
            }}
          >
            <div className="w-full">
              {selectedTemplate === 'modern' && (
                <ModernCVTemplate personalInfo={safePersonalInfo} summary={editorData.summary} sections={safeSections} photoUrl={photoUrl} onUpdatePersonalInfo={updatePersonalInfo} onUpdateSummary={(v) => setEditorData((p) => p ? { ...p, summary: v } : p)} onUpdateSection={updateSection} onUpdateSectionItem={updateSectionItem} onDeleteSectionItem={deleteSectionItem} />
              )}
              {selectedTemplate === 'classic' && (
                <ClassicCVTemplate personalInfo={safePersonalInfo} summary={editorData.summary} sections={safeSections} photoUrl={photoUrl} onUpdatePersonalInfo={updatePersonalInfo} onUpdateSummary={(v) => setEditorData((p) => p ? { ...p, summary: v } : p)} onUpdateSection={updateSection} onUpdateSectionItem={updateSectionItem} />
              )}
              {selectedTemplate === 'minimal' && (
                <MinimalCVTemplate personalInfo={safePersonalInfo} summary={editorData.summary} sections={safeSections} photoUrl={photoUrl} onUpdatePersonalInfo={updatePersonalInfo} onUpdateSummary={(v) => setEditorData((p) => p ? { ...p, summary: v } : p)} onUpdateSection={updateSection} onUpdateSectionItem={updateSectionItem} />
              )}
              {selectedTemplate === 'creative' && (
                <CreativeCVTemplate personalInfo={safePersonalInfo} summary={editorData.summary} sections={safeSections} photoUrl={photoUrl} onUpdatePersonalInfo={updatePersonalInfo} onUpdateSummary={(v) => setEditorData((p) => p ? { ...p, summary: v } : p)} onUpdateSection={updateSection} onUpdateSectionItem={updateSectionItem} />
              )}
              {selectedTemplate === 'professional' && (
                <ProfessionalCVTemplate personalInfo={safePersonalInfo} summary={editorData.summary} sections={safeSections} photoUrl={photoUrl} onUpdatePersonalInfo={updatePersonalInfo} onUpdateSummary={(v) => setEditorData((p) => p ? { ...p, summary: v } : p)} onUpdateSection={updateSection} onUpdateSectionItem={updateSectionItem} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050507] via-[#0a0a0f] to-[#050507] flex flex-col">
      {showPaymentSuccessBanner && (
        <div className="bg-[#66c0b6] text-black px-4 py-3 flex items-center justify-between flex-shrink-0 z-[60]">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm">Zahlung erfolgreich!</span>
            <span className="text-sm">Dein CV wird jetzt als PDF erstellt...</span>
          </div>
          <button
            onClick={() => setShowPaymentSuccessBanner(false)}
            className="text-black/60 hover:text-black transition-colors text-lg font-bold leading-none"
          >
            &times;
          </button>
        </div>
      )}
      {/* Header / Controls */}
      <div className="bg-black/30 backdrop-blur-md border-b border-white/10 flex-shrink-0 z-50 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2 text-white/70 hover:text-white"
                title="Zum Dashboard"
              >
                <ArrowLeft size={16} />
                <span className="text-sm hidden sm:inline">Dashboard</span>
              </button>
              <span className="text-white/20 hidden sm:inline">|</span>
              <span className="text-sm text-white/60 hidden sm:inline">Design:</span>
              <div className="flex gap-2 flex-wrap">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateChange(template.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedTemplate === template.id
                        ? 'bg-[#66c0b6] text-black'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <span className="mr-1">{template.icon}</span>
                    <span className="hidden sm:inline">{template.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPhotoUpload(!showPhotoUpload)}
                className="px-4 py-2 rounded-lg bg-[#66c0b6]/20 hover:bg-[#66c0b6]/30 transition-all border border-[#66c0b6]/40 flex items-center gap-2"
                title="Foto hochladen"
              >
                <Camera size={24} className="text-[#66c0b6]" />
                <span className="text-sm font-medium text-white/90">Foto</span>
              </button>

              <button
                onClick={handleDownloadClick}
                disabled={isExportingPDF}
                className={`px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold text-sm hover:brightness-110 hover:shadow-lg hover:shadow-[#66c0b6]/30 transition-all flex items-center gap-2 ${
                  isExportingPDF ? 'opacity-50 cursor-not-allowed' : 'animate-pulse-subtle'
                }`}
                style={{ boxShadow: isExportingPDF ? undefined : '0 0 16px rgba(102,192,182,0.35)' }}
              >
                {isExportingPDF ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generiere PDF...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    CV herunterladen
                  </>
                )}
              </button>

              {/* Tipps Button - Info only */}
              <button
                onClick={() => setShowTips(!showTips)}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex items-center gap-2"
                title="Tipps anzeigen"
              >
                <Sparkles size={18} className="text-[#66c0b6]" />
                <span className="text-sm font-medium text-white/90">Tipps</span>
              </button>
            </div>
          </div>

          {showPhotoUpload && (
            <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <PhotoUpload
                currentPhoto={photoUrl}
                onPhotoChange={handlePhotoChange}
              />
            </div>
          )}

          {photoUrl && (
            <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10 space-y-2">
              <p className="text-xs font-medium text-white/50">Bildausschnitt</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40 w-14 flex-shrink-0">Horizontal</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={photoPosition.x}
                  onChange={(e) => setPhotoPosition((p) => ({ ...p, x: Number(e.target.value) }))}
                  className="flex-1 accent-[#66c0b6] cursor-pointer"
                />
                <span className="text-xs text-white/40 w-7 text-right flex-shrink-0">{photoPosition.x}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40 w-14 flex-shrink-0">Vertikal</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={photoPosition.y}
                  onChange={(e) => setPhotoPosition((p) => ({ ...p, y: Number(e.target.value) }))}
                  className="flex-1 accent-[#66c0b6] cursor-pointer"
                />
                <span className="text-xs text-white/40 w-7 text-right flex-shrink-0">{photoPosition.y}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* A4-Vorschau – feste 210mm Breite, WYSIWYG-Blatt-Optik */}
      <div className="flex-1 flex flex-col items-center py-4 sm:py-8 px-2 sm:px-4 overflow-auto bg-zinc-800/40">
        <div className="flex flex-col items-center w-full">
          {/* Mobile scale wrapper: on small screens, scale the 794px CV to fit the viewport */}
          <div
            className="cv-scale-wrapper"
            style={{
              width: '794px',
              transformOrigin: 'top center',
            }}
          >
          <div
            ref={cvPreviewRef}
            data-pdf-root
            className="bg-white shadow-2xl border border-slate-200"
            style={{
              width: '794px',
              minWidth: '794px',
              maxWidth: '794px',
              height: 'auto',
              minHeight: 'auto',
              boxShadow: '0 8px 48px 0 rgba(0,0,0,0.45), 0 2px 8px 0 rgba(0,0,0,0.25)',
              borderRadius: '4px',
            }}
          >
            <div className="w-full">
              {selectedTemplate === 'modern' &&
                editorData.personalInfo &&
                editorData.sections && (
                  <ModernCVTemplate
                    personalInfo={editorData.personalInfo}
                    summary={editorData.summary}
                    sections={editorData.sections}
                    photoUrl={photoUrl}
                    photoPosition={photoPosition}
                    onUpdatePersonalInfo={updatePersonalInfo}
                    onUpdateSummary={(value) =>
                      setEditorData((prev) =>
                        prev ? { ...prev, summary: value } : prev
                      )
                    }
                    onUpdateSection={updateSection}
                    onUpdateSectionItem={updateSectionItem}
                    onDeleteSectionItem={deleteSectionItem}
                  />
                )}

              {selectedTemplate === 'classic' &&
                editorData.personalInfo &&
                editorData.sections && (
                  <ClassicCVTemplate
                    personalInfo={editorData.personalInfo}
                    summary={editorData.summary}
                    sections={editorData.sections}
                    photoUrl={photoUrl}
                    photoPosition={photoPosition}
                    onUpdatePersonalInfo={updatePersonalInfo}
                    onUpdateSummary={(value) =>
                      setEditorData((prev) =>
                        prev ? { ...prev, summary: value } : prev
                      )
                    }
                    onUpdateSection={updateSection}
                    onUpdateSectionItem={updateSectionItem}
                  />
                )}

              {selectedTemplate === 'minimal' &&
                editorData.personalInfo &&
                editorData.sections && (
                  <MinimalCVTemplate
                    personalInfo={editorData.personalInfo}
                    summary={editorData.summary}
                    sections={editorData.sections}
                    photoUrl={photoUrl}
                    photoPosition={photoPosition}
                    onUpdatePersonalInfo={updatePersonalInfo}
                    onUpdateSummary={(value) =>
                      setEditorData((prev) =>
                        prev ? { ...prev, summary: value } : prev
                      )
                    }
                    onUpdateSection={updateSection}
                    onUpdateSectionItem={updateSectionItem}
                  />
                )}

              {selectedTemplate === 'creative' &&
                editorData.personalInfo &&
                editorData.sections && (
                  <CreativeCVTemplate
                    personalInfo={editorData.personalInfo}
                    summary={editorData.summary}
                    sections={editorData.sections}
                    photoUrl={photoUrl}
                    photoPosition={photoPosition}
                    onUpdatePersonalInfo={updatePersonalInfo}
                    onUpdateSummary={(value) =>
                      setEditorData((prev) =>
                        prev ? { ...prev, summary: value } : prev
                      )
                    }
                    onUpdateSection={updateSection}
                    onUpdateSectionItem={updateSectionItem}
                  />
                )}

              {selectedTemplate === 'professional' &&
                editorData.personalInfo &&
                editorData.sections && (
                  <ProfessionalCVTemplate
                    personalInfo={editorData.personalInfo}
                    summary={editorData.summary}
                    sections={editorData.sections}
                    photoUrl={photoUrl}
                    photoPosition={photoPosition}
                    onUpdatePersonalInfo={updatePersonalInfo}
                    onUpdateSummary={(value) =>
                      setEditorData((prev) =>
                        prev ? { ...prev, summary: value } : prev
                      )
                    }
                    onUpdateSection={updateSection}
                    onUpdateSectionItem={updateSectionItem}
                  />
                )}
            </div>
          </div>
          </div>{/* end cv-scale-wrapper */}

          {jobData && (jobData.jobTitle || jobData.company) && (
            <div className="mt-4" style={{ width: '794px', maxWidth: '794px' }}>
              <button
                onClick={() => setShowJobDescription(!showJobDescription)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.08] hover:border-[#66c0b6]/30 transition-all"
              >
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase size={16} className="text-[#66c0b6] flex-shrink-0" />
                  <span className="text-white/70">Stellenbeschreibung:</span>
                  {jobData.jobTitle && (
                    <span className="text-[#66c0b6] font-medium truncate">{String(jobData.jobTitle)}</span>
                  )}
                  {jobData.company && (
                    <span className="text-white/50 truncate hidden sm:inline">bei {String(jobData.company)}</span>
                  )}
                </div>
                <ChevronDown
                  size={16}
                  className={`text-white/40 flex-shrink-0 transition-transform duration-200 ${showJobDescription ? 'rotate-180' : ''}`}
                />
              </button>

              {showJobDescription && (
                <div className="mt-1 bg-white/5 border border-white/10 border-t-0 rounded-b-xl overflow-hidden">
                  <div className="p-4 space-y-3">
                    {jobData.company && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/40 uppercase tracking-wide w-20 flex-shrink-0">Unternehmen</span>
                        <span className="text-sm text-white font-medium">{String(jobData.company)}</span>
                      </div>
                    )}
                    {jobData.jobTitle && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/40 uppercase tracking-wide w-20 flex-shrink-0">Position</span>
                        <span className="text-sm text-white font-medium">{String(jobData.jobTitle)}</span>
                      </div>
                    )}
                    {jobData.jobDescription && (
                      <div>
                        <span className="text-xs text-white/40 uppercase tracking-wide block mb-2">Stellenbeschreibung</span>
                        <div className="bg-black/20 rounded-lg p-3 max-h-64 overflow-y-auto">
                          <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                            {String(jobData.jobDescription)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {editorData.matching_text && (
            <div className="mt-6 bg-[#0f1729] border border-[#66c0b6]/20 rounded-2xl p-6" style={{ width: '794px', maxWidth: '794px' }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-[#66c0b6]" />
                <h3 className="text-white font-semibold text-sm">Generierter Matching-Text</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                {editorData.matching_text}
              </p>
            </div>
          )}

          {/* ── NÄCHSTER SCHRITT CTA ─────────────────────────────────── */}
          <div className="mt-8 mb-6" style={{ width: '794px', maxWidth: '794px' }}>
            <div
              className="relative overflow-hidden rounded-2xl border border-[#66c0b6]/30"
              style={{
                background: 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 50%, #091520 100%)',
                boxShadow: '0 0 60px rgba(102,192,182,0.08), 0 4px 24px rgba(0,0,0,0.4)',
              }}
            >
              {/* Decorative glow blobs */}
              <div
                className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(102,192,182,0.12) 0%, transparent 70%)' }}
              />
              <div
                className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(48,227,202,0.07) 0%, transparent 70%)' }}
              />

              <div className="relative z-10 p-8">
                {/* Step indicator */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-full text-black font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg, #66c0b6, #30E3CA)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span className="text-[#66c0b6] text-xs font-semibold tracking-widest uppercase">CV ist bereit</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-[#66c0b6]/20 to-transparent" />
                </div>

                <div className="flex items-start justify-between gap-8">
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-2xl leading-tight mb-2">
                      Nächster Schritt:
                      <br />
                      <span style={{ background: 'linear-gradient(90deg, #66c0b6, #30E3CA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        CV als PDF herunterladen
                      </span>
                    </h3>
                    <p className="text-white/55 text-sm leading-relaxed max-w-sm">
                      Dein optimierter Lebenslauf ist fertig. Lade ihn als professionelles PDF herunter und bewirb dich direkt.
                    </p>

                    <div className="mt-4 flex items-center gap-4 text-xs text-white/40">
                      <span className="flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        ATS-optimiert
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Professionelles Design
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Sofort bewerben
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 flex-shrink-0">
                    <button
                      onClick={handleDownloadClick}
                      disabled={isExportingPDF}
                      className="group relative px-7 py-4 rounded-xl font-bold text-base text-black transition-all disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, #66c0b6 0%, #30E3CA 100%)',
                        boxShadow: '0 4px 20px rgba(102,192,182,0.4), 0 0 0 0 rgba(102,192,182,0)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 28px rgba(102,192,182,0.55), 0 0 0 0 rgba(102,192,182,0)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(102,192,182,0.4), 0 0 0 0 rgba(102,192,182,0)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <span className="flex items-center gap-2.5">
                        {isExportingPDF ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        )}
                        {isExportingPDF ? 'Generiere PDF...' : 'Jetzt als PDF herunterladen'}
                      </span>
                    </button>

                    <button
                      onClick={() => navigate('/dashboard')}
                      className="px-7 py-3 rounded-xl font-medium text-sm text-white/70 border border-white/10 hover:bg-white/5 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                      Zum Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tipps Banner */}
      {showTips && (
        <div className="fixed top-20 right-4 max-w-md bg-[#1a1a1a] border border-[#66c0b6]/30 rounded-xl p-4 shadow-2xl z-50">
          <div className="flex items-start gap-3">
            <Sparkles
              size={20}
              className="text-[#66c0b6] flex-shrink-0 mt-1"
            />
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-2">💡 Editor-Tipps</h3>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• Klicke auf Texte, um sie direkt zu bearbeiten</li>
                <li>• Wähle ein Design aus den Templates</li>
                <li>• Lade ein Foto für ein professionelles Erscheinungsbild hoch</li>
                <li>• Lade den fertigen CV als PDF herunter</li>
              </ul>
            </div>
            <button
              onClick={() => setShowTips(false)}
              className="text-white/50 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
