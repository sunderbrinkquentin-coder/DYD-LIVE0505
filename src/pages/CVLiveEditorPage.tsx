import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, Loader2, AlertTriangle, Sparkles, ArrowLeft, ChevronDown, Briefcase, FileSearch, GraduationCap, Music2, Check, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { exportCVToPDFBlob, debugLogPDFHtml } from '../utils/pdfExportClient';
import { CVTemplateType } from '../components/cv-templates/CVTemplateSelector';
import { ModernCVTemplate } from '../components/cv-templates/templates/ModernCVTemplate';
import { ClassicCVTemplate } from '../components/cv-templates/templates/ClassicCVTemplate';
import { MinimalCVTemplate } from '../components/cv-templates/templates/MinimalCVTemplate';
import { CreativeCVTemplate } from '../components/cv-templates/templates/CreativeCVTemplate';
import { ProfessionalCVTemplate } from '../components/cv-templates/templates/ProfessionalCVTemplate';
import PhotoUpload from '../components/PhotoUpload';
import { CVOptimizerPaywall } from '../components/dashboard/CVOptimizerPaywall';
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
              </div>
            );
          })}
        </div>

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
      </div>
    </div>
  );
}

export function CVLiveEditorPage() {
  const { cvId } = useParams<{ cvId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

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

  const [selectedTemplate, setSelectedTemplate] = useState<CVTemplateType>('modern');
  const [isTemplateReady, setIsTemplateReady] = useState(false);
  const templateSaveTimerRef = useRef<number | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [isDownloadUnlocked, setIsDownloadUnlocked] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [showTemplateSelectForExport, setShowTemplateSelectForExport] = useState(false);

  const [showTips, setShowTips] = useState(false);
  const [showPaymentSuccessBanner, setShowPaymentSuccessBanner] = useState(false);
  const [showJobDescription, setShowJobDescription] = useState(false);

  const [templateConfirmed, setTemplateConfirmed] = useState(false);

  // 🔥 DIE ENGINE: Misst im Hintergrund und pusht die Boxen nach unten!
  // 🔥 DIE ENGINE STATE
  const [pageBreakItems, setPageBreakItems] = useState<Map<string, number>>(new Map());

  const cvPreviewRef = useRef<HTMLDivElement | null>(null);
  const mainAreaRef = useRef<HTMLDivElement | null>(null);
  const scaleObserverRef = useRef<ResizeObserver | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const autoDownloadTriggeredRef = useRef(false);

  const [scale, setScale] = useState(1);
  const [cvHeight, setCvHeight] = useState(1122);

  const mainRefCallback = (el: HTMLDivElement | null) => {
    mainAreaRef.current = el;
    if (scaleObserverRef.current) {
      scaleObserverRef.current.disconnect();
      scaleObserverRef.current = null;
    }
    if (!el) return;
    const recalc = () => {
      const available = el.clientWidth;
      if (available > 0) {
        const raw = available < 794 ? available / 794 : 1;
        setScale(Math.max(raw, 0.75)); // Minimum 75% — keeps fonts readable on mobile
      }
    };
    recalc();
    const obs = new ResizeObserver(recalc);
    obs.observe(el);
    scaleObserverRef.current = obs;
  };

  useEffect(() => {
    (window as any).__debugPdfHtml = () => debugLogPDFHtml(cvPreviewRef);
    return () => { delete (window as any).__debugPdfHtml; };
  }, []);

  // ── DIE UNZERSTÖRBARE SMART-BREAK ENGINE ──
// ── DIE UNZERSTÖRBARE SMART-BREAK ENGINE ──
  useEffect(() => {
    const timer = setTimeout(() => {
      const container = cvPreviewRef.current;
      if (!container) return;

      const PAGE_H = 1122;
      const newMap = new Map<string, number>();

      const elements = Array.from(container.querySelectorAll<HTMLElement>('[data-spacer-id]'));
      
      let runningOffset = 0;
      let maxBottom = 0;
      const parentTop = container.getBoundingClientRect().top;

      elements.forEach((el, index) => {
        const box = el.getBoundingClientRect();
        const rawTop = box.top - parentTop;
        const height = box.height;
        
        // Den aktuell angewendeten Abstand abziehen, um die echte Position zu ermitteln
        const spacerId = el.getAttribute('data-spacer-id') || `spacer-${index}`;
        const currentSpacer = pageBreakItems.get(spacerId) || 0;
        const unspacedTop = rawTop - currentSpacer;
        
        const actualTop = unspacedTop + runningOffset;
        const actualBottom = actualTop + height;

        const pageStart = Math.floor(actualTop / PAGE_H);
        const pageEnd = Math.floor((actualBottom - 1) / PAGE_H);

        // Wenn Element geschnitten wird -> Push berechnen
        if (pageEnd > pageStart && height < PAGE_H) {
          const pushDown = (pageStart + 1) * PAGE_H - actualTop;
          runningOffset += pushDown;
          newMap.set(spacerId, pushDown);
        }
        
        if (actualBottom + runningOffset > maxBottom) {
          maxBottom = actualBottom + runningOffset;
        }
      });

      // Exakte Höhe berechnen, damit Seite 2 sichtbar wird!
      setCvHeight(Math.max(PAGE_H, maxBottom + 50));

      setPageBreakItems(prev => {
        if (prev.size !== newMap.size) return newMap;
        for (const [k, v] of newMap.entries()) {
          if (prev.get(k) !== v) return newMap;
        }
        return prev;
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [editorData, selectedTemplate, pageBreakItems]);
  
  const isInitialLoadRef = useRef(true);
  const saveTimeoutRef = useRef<number | null>(null);

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
  }, [cvId]);

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
    if (hasEditorChanges && isCompleted && !isReady) return;

    const processData = async () => {
      let data: any = cvData;
      const rawHookCvData = (cvData as any)?.cv_data;
      const hookHasCvData = !!rawHookCvData &&
        typeof rawHookCvData === 'object' &&
        !Array.isArray(rawHookCvData) &&
        Object.keys(rawHookCvData).length > 0;

      if (!hookHasCvData) {
        const fetchWithRetry = async (attemptsLeft: number): Promise<any> => {
          const { data: freshData, error: fetchErr } = await supabase
            .from('stored_cvs')
            .select('cv_data, ats_json, job_data, status, download_unlocked, user_id, selected_template')
            .eq('id', cvId)
            .maybeSingle();

          if (fetchErr) {
            if (attemptsLeft <= 0) return null;
            await new Promise(resolve => setTimeout(resolve, 2000));
            return fetchWithRetry(attemptsLeft - 1);
          }
          if (!freshData) {
            if (attemptsLeft <= 0) return null;
            await new Promise(resolve => setTimeout(resolve, 2000));
            return fetchWithRetry(attemptsLeft - 1);
          }

          const hasFreshCvData = !!freshData.cv_data &&
            typeof freshData.cv_data === 'object' &&
            !Array.isArray(freshData.cv_data) &&
            Object.keys(freshData.cv_data).length > 0;

          if (hasFreshCvData || attemptsLeft <= 0) return freshData;
          await new Promise(resolve => setTimeout(resolve, 2000));
          return fetchWithRetry(attemptsLeft - 1);
        };

        const freshData = await fetchWithRetry(5);
        if (!freshData) {
          setError('Kein CV-Datensatz gefunden. Bitte starte den Prozess erneut.');
          setCvStatus('failed');
          return;
        }
        data = freshData;
      }

      if (user && !data.user_id) {
        try {
          await supabase.from('stored_cvs').update({ user_id: user.id }).eq('id', cvId);
        } catch (e) {}
      }

      const rawStatus = ((data.status as string) || 'completed').toLowerCase().trim();
      setCvStatus(rawStatus);
      setIsDownloadUnlocked(!!data.download_unlocked);

      const parseJsonRobust = (source: any): any => {
        if (!source) return null;
        if (typeof source !== 'string') return source;
        try {
          let parsed = JSON.parse(source);
          if (typeof parsed === 'string') {
            try { parsed = JSON.parse(parsed); } catch { }
          }
          return parsed;
        } catch (e) {
          return null;
        }
      };

      let rawCvData: any = null;
      const cvFields = ['cv_data', 'ats_json'];
      let cvField = '';
      for (const field of cvFields) {
        if ((data as any)?.[field]) {
          cvField = field;
          break;
        }
      }

      if (cvField) rawCvData = parseJsonRobust((data as any)[cvField]);

      if (!rawCvData || (typeof rawCvData === 'object' && !Array.isArray(rawCvData) && Object.keys(rawCvData).length === 0)) {
        const currentStatus = ((data.status as string) || '').toLowerCase().trim();
        if (currentStatus === 'processing' || currentStatus === 'pending') {
          setCvStatus(currentStatus);
          return;
        }
        setError('Die Optimierung ist abgeschlossen, aber es wurden keine CV-Daten zurückgegeben. Bitte versuche es erneut.');
        setCvStatus('failed');
        return;
      }

      if (data.job_data) {
        try {
          setJobData(parseJsonRobust(data.job_data) ?? data.job_data);
        } catch (e) {
          setJobData(data.job_data);
        }
      }

      const nonEmpty = (arr: any): any[] | null => Array.isArray(arr) && arr.length > 0 ? arr : null;

      const formatDate = (raw: any): string => {
        if (!raw) return '';
        const str = String(raw).trim();
        if (!str) return '';
        const lower = str.toLowerCase();
        if (lower === 'present' || lower === 'heute' || lower === 'aktuell' || lower === 'current' || lower === 'now') return 'Heute';
        if (/^\d{2}\/\d{4}$/.test(str)) return str;
        if (/^\d{4}$/.test(str)) return `01/${str}`;
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
        const dotDMY = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (dotDMY) return `${dotDMY[2].padStart(2, '0')}/${dotDMY[3]}`;
        const dotMY = str.match(/^(\d{1,2})\.(\d{4})$/);
        if (dotMY) return `${dotMY[1].padStart(2, '0')}/${dotMY[2]}`;
        return str;
      };

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

      const hasRootPersonalInfo = !!rawCvData?.personalInfo;
      const hasRootSections = Array.isArray(rawCvData?.sections) && rawCvData.sections.length > 0;
      const hasRootSummary = typeof rawCvData?.summary === 'string';

      const editorPayload: any = hasRootPersonalInfo || hasRootSections || hasRootSummary
        ? rawCvData
        : (rawCvData?.optimized_cv || rawCvData?.cv || rawCvData?.data || rawCvData?.editor_data || rawCvData?.cv_data || rawCvData || {});

      const photoFromPayload =
        editorPayload.photoUrl || editorPayload.photo_url ||
        editorPayload.personalInfo?.photoUrl || editorPayload.personalInfo?.photo_url ||
        editorPayload.personalData?.photoUrl || editorPayload.personalData?.photo_url;

      if (photoFromPayload) setPhotoUrl(photoFromPayload);
      if (editorPayload.photoPosition) setPhotoPosition(editorPayload.photoPosition);

      const rawPersonal = editorPayload.personalInfo || editorPayload.personal_data || editorPayload.personalData || {};
      const builderPersonal = editorPayload.personalData || editorPayload.personal_data || {};

      const personalInfo: any = {
        name: rawPersonal.name || builderPersonal.full_name || `${builderPersonal.firstName ?? ''} ${builderPersonal.lastName ?? ''}`.trim() || '',
        email: rawPersonal.email || builderPersonal.email || '',
        phone: rawPersonal.phone || builderPersonal.phone || '',
        location: rawPersonal.location || builderPersonal.location || [builderPersonal.zipCode, builderPersonal.city].filter(Boolean).join(' ') || '',
        linkedin: rawPersonal.linkedin || builderPersonal.linkedin || '',
        website: rawPersonal.website || builderPersonal.website || builderPersonal.personalWebsite || '',
        github: rawPersonal.github || builderPersonal.github || '',
        portfolio: rawPersonal.portfolio || builderPersonal.portfolio || '',
      };

      let sections: EditorSection[] = [];
      const CATEGORY_PREFIX_RE = /^(Programmiersprachen|Technische\s*F[äa]higkeiten|Fachkenntnisse|Kenntnisse|Fachliche\s*Skills|Technische\s*Skills|Tools?|SoftSkills|Soft\s*Skills|HardSkills|Hard\s*Skills|Skills|F[äa]higkeiten|Sprachen|Languages|Kompetenzen)[:\s\-–]+/i;

      const expandSkillItems = (items: any[]): any[] => {
        const result: any[] = [];
        for (const item of items) {
          let name = '';
          let level = '';
          if (typeof item === 'object' && item !== null) {
            name = item.name || item.skill || item.label || item.text || '';
            level = item.level || item.niveau || item.proficiency || '';
          } else {
            name = String(item ?? '');
          }
          name = name.replace(CATEGORY_PREFIX_RE, '').trim();
          if (name.includes(',')) {
            name.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((s: string) => result.push({ name: s, level }));
          } else if (name) {
            result.push({ name, level });
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
        const seenTypes = new Set<string>();
        sections = sections.filter((s) => {
          if (seenTypes.has(s.type)) return false;
          seenTypes.add(s.type);
          return true;
        });

        const personalSection = sections.find((s) => s.type === 'personal' || s.type === 'personalInfo');
        if (personalSection && (personalSection as any).data) {
          Object.assign(personalInfo, (personalSection as any).data);
        }
      } else {
        const experienceItems = findArray(['experiences', 'workExperiences', 'workExperience', 'work_experience', 'cv_experience', 'experience']);
        if (experienceItems.length > 0) {
          const mappedExpItems = experienceItems.map((exp: any) => ({
            title: exp.title || exp.position || exp.role || exp.jobTitle || '',
            company: exp.company || exp.employer || exp.organization || '',
            location: exp.location || exp.ort || '',
            date_from: formatDate(exp.date_from || exp.from || exp.startDate || exp.start_date || exp.start || ''),
            date_to: formatDate(exp.date_to || exp.to || exp.endDate || exp.end_date || exp.end || '') || 'Heute',
            description: exp.description || exp.responsibilities || exp.summary || '',
            bulletPoints: exp.bulletPoints || exp.bullet_points || exp.achievements || exp.tasks || [],
          }));
          const expSection: EditorSection = { type: 'experience', title: 'Berufserfahrung', items: mappedExpItems };
          sections.push(sortSectionNewestFirst(expSection));
        }

// 1. BILDUNGSSTATIONEN (Studium + Schule)
        const schoolEduItems = findArray(['schoolEducation', 'school_education']);
        const professionalEduItems = findArray(['professionalEducation', 'professional_education']);
        const basicEduItems = findArray(['education', 'cv_education']);

        const allEduItems = [...professionalEduItems, ...schoolEduItems, ...basicEduItems];
        if (allEduItems.length > 0) {
          sections.push({
            type: 'education',
            title: 'Ausbildung / Studium',
            items: allEduItems.map((edu: any) => ({
              degree: edu.degree || edu.title || edu.qualification || edu.type || '',
              institution: edu.institution || edu.school || edu.university || '',
              date_from: formatDate(edu.date_from || edu.startDate || edu.startYear || ''),
              date_to: formatDate(edu.date_to || edu.endDate || edu.endYear || edu.year || ''),
              location: edu.location || edu.ort || '',
              description: edu.description || (Array.isArray(edu.focus) ? edu.focus.join(', ') : edu.focus) || '',
              grade: edu.grade || edu.grades || edu.note || edu.gpa || '',
            })),
          });
        }

    // 2. ZERTIFIKATE & STIPENDIEN (separate Sektionen für bessere Darstellung)
        const certItems = findArray(['certificates', 'zertifikate']);
        const scholItems = findArray(['scholarships', 'stipendien']);
        const awardItems = findArray(['awards', 'auszeichnungen']);

        if (certItems.length > 0) {
          sections.push({
            type: 'certifications',
            title: 'Zertifikate',
            items: certItems.map((aw: any) => ({
              name: aw.name || aw.title || aw.degree || '',
              institution: aw.issuer || aw.institution || aw.organization || '',
              date: aw.year || aw.date || aw.date_from || '',
              description: aw.description || '',
            })).filter(i => i.name || i.institution),
          });
        }

        if (scholItems.length > 0) {
          sections.push({
            type: 'stipendien',
            title: 'Stipendien',
            items: scholItems.map((aw: any) => ({
              name: aw.name || aw.title || aw.degree || '',
              institution: aw.issuer || aw.institution || aw.organization || '',
              date: aw.year || aw.date || aw.date_from || '',
              description: aw.description || '',
            })).filter(i => i.name || i.institution),
          });
        }

        if (awardItems.length > 0) {
          sections.push({
            type: 'awards',
            title: 'Auszeichnungen',
            items: awardItems.map((aw: any) => ({
              name: aw.name || aw.title || aw.degree || '',
              institution: aw.issuer || aw.institution || aw.organization || '',
              date: aw.year || aw.date || aw.date_from || '',
              description: aw.description || '',
            })).filter(i => i.name || i.institution),
          });
        }

        // 3. EHRENAMT
        const volItems = findArray(['volunteerWork', 'ehrenamt', 'volunteering']);
        if (volItems.length > 0) {
          const items = volItems.map((vol: any, index: number) => ({
            id: index, // Eindeutige ID für den Lösch-Vorgang
            title: vol.role || vol.title || '',
            company: vol.organization || vol.company || '',
            date_from: formatDate(vol.date_from || ''),
            date_to: formatDate(vol.date_to || ''),
            description: vol.description || '',
            bulletPoints: vol.bulletPoints || [],
          })).filter(i => i.title || i.company);

          if (items.length > 0) {
            sections.push({
              type: 'volunteering',
              title: 'Ehrenamtliches Engagement',
              items: items,
            });
          }
        }
        // 4. PROJEKTE
        const projectItems = findArray(['projects', 'project', 'cv_projects']);
        if (projectItems.length > 0) {
          sections.push({
            type: 'projects',
            title: 'Projekte',
            items: projectItems.map((proj: any) => ({
              title: proj.title || proj.name || '',
              role: proj.role || proj.position || '',
              description: proj.description || proj.summary || '',
              bulletPoints: proj.bulletPoints || [],
            })),
          });
        }
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
      }

      if (!Array.isArray(sections)) sections = [];

      {
        const seenFinal = new Set<string>();
        sections = sections.filter((s) => {
          if (seenFinal.has(s.type)) return false;
          seenFinal.add(s.type);
          return true;
        });

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

      const projectsSection = sections.find((s) => s.type === 'projects');

      const resolvedSummary: string | undefined =
        editorPayload.summary ??
        editorPayload.profile_summary ??
        editorPayload.profileSummary ??
        editorPayload.matching_text ??
        editorPayload.matchingText ??
        rawCvData?.summary ??
        rawCvData?.profile_summary ??
        rawCvData?.matching_text;

      const resolvedMatchingText: string | undefined =
        editorPayload.matching_text ??
        editorPayload.matchingText ??
        editorPayload.cover_letter ??
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

      const savedTemplate = (data as any)?.selected_template || (rawCvData as any)?._selectedTemplate;
      if (savedTemplate && ['modern','classic','minimal','creative','professional'].includes(savedTemplate)) {
        setSelectedTemplate(savedTemplate as CVTemplateType);
      }

      setEditorData(mappedEditor);
    };

    processData();
  }, [cvId, isCompleted, isReady, isFailed, cvData, statusError, user]);

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

  const exportInProgressRef = useRef(false);

  useEffect(() => {
    const paymentSuccess = searchParams.get('payment') === 'success';
    if (!paymentSuccess || !editorData || !user || !cvId) return;
    if (!isTemplateReady || !templateConfirmed) return;

    if (autoDownloadTriggeredRef.current || exportInProgressRef.current) return;
    autoDownloadTriggeredRef.current = true;
    exportInProgressRef.current = true;

    const toSlug = (s: string) => s.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

    const doExportAndNavigate = async () => {
      const waitForElement = async (ref: { current: HTMLDivElement | null }, maxMs = 5000): Promise<HTMLDivElement | null> => {
        const start = Date.now();
        while (Date.now() - start < maxMs) {
          const el = ref.current;
          if (el && el.scrollHeight > 50) return el;
          await new Promise((r) => setTimeout(r, 150));
        }
        return ref.current;
      };

      const el = await waitForElement(cvPreviewRef, 5000);
      const navigateToDashboard = () => {
        navigate(`/dashboard?highlightCv=${cvId}`, { replace: true });
      };

      const existingJobData = jobData || {};
      const normalizedJobData = {
        ...existingJobData,
        jobTitle: existingJobData.jobTitle || existingJobData.positionTitle || '',
        positionTitle: existingJobData.positionTitle || existingJobData.jobTitle || '',
        company: existingJobData.company || existingJobData.companyName || '',
        companyName: existingJobData.companyName || existingJobData.company || '',
      };

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
          console.error("Fehler beim Speichern nach Export:", e);
        }
      };

      if (!el || el.scrollHeight < 50) {
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

        const liveTextareas = cvPreviewRef.current?.querySelectorAll('textarea');
        liveTextareas?.forEach((ta: any) => {
          ta.setAttribute('defaultValue', ta.value);
        });
        
        const savedTransform = el.style.transform;
        el.style.transform = 'none';

        await new Promise((resolve) => setTimeout(resolve, 300));
        let pdfBlob: Blob;
        try {
          pdfBlob = await exportCVToPDFBlob(cvPreviewRef, editorData, { quality: 0.95, scale: 2 });
        } finally {
          el.style.transform = savedTransform;
        }

        const blobUrl = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${fileBaseName}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

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
        } catch (e) {}

        await saveToDb(pdfPublicUrl);
      } catch (err) {
        await saveToDb();
      }

      exportInProgressRef.current = false;
      navigateToDashboard();
    };

    doExportAndNavigate();
  }, [templateConfirmed, editorData, user, cvId, isTemplateReady, searchParams]);

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
        const projectsSection = editorData.sections?.find((s) => s.type === 'projects');
        const languagesSection = editorData.sections?.find((s) => s.type === 'languages');

        const dataToSave = {
          ...editorData,
          projects: projectsSection?.items || editorData.projects || [],
          languages: languagesSection?.items || editorData.languages || [],
          photoUrl: photoUrl || editorData.personalInfo?.photoUrl || undefined,
          photoPosition,
        };

        await supabase
          .from('stored_cvs')
          .update({
            cv_data: dataToSave,
            updated_at: new Date().toISOString(),
          })
          .eq('id', cvId);
      } catch (error) {}
    }, 5000);

    return () => {
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    };
  }, [editorData, cvId, user, photoUrl, photoPosition]);

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

  // Paywall-Check: Token/Bezahlstatus prüfen, dann Paywall oder direkt Export
const handleDownloadClick = async () => {
  if (!user) {
    const redirectTarget = cvId ? `/cv/${cvId}` : '/dashboard';
    sessionStorage.setItem('pending_download_cv_id', cvId || '');
    navigate(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
    return;
  }

  // Bereits freigeschaltet → direkt zur Template-Auswahl
  if (isDownloadUnlocked) {
    setTemplateConfirmed(false);
    setShowTemplateSelectForExport(true);
    return;
  }

  // Prüfe ob CV in DB bereits bezahlt/freigeschaltet
  try {
    if (cvId) {
      const { data: stored } = await supabase
        .from('stored_cvs')
        .select('is_paid, download_unlocked')
        .eq('id', cvId)
        .maybeSingle();

      if (stored?.is_paid || stored?.download_unlocked) {
        setIsDownloadUnlocked(true);
        setTemplateConfirmed(false);
        setShowTemplateSelectForExport(true);
        return;
      }
    }
  } catch (_) {}

  // Nicht freigeschaltet → Paywall öffnen
  setShowPaywallModal(true);
};

  const handlePaywallSuccess = () => {
    setShowPaywallModal(false);
    setIsDownloadUnlocked(true);
    setTemplateConfirmed(false);
    setShowTemplateSelectForExport(true);
  };

const triggerDirectExport = async () => {
    if (!cvPreviewRef.current || !cvId || !user) return;
    try {
      setIsExportingPDF(true);
      const toSlug = (s: string) => s.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      const fullName = editorData?.personalInfo?.name || '';
      const lastName = fullName.trim().split(/\s+/).pop() || '';
      const co = jobData?.company || jobData?.companyName || '';
      const fileName = lastName && co
        ? `Lebenslauf_${toSlug(lastName)}_${toSlug(co)}.pdf`
        : lastName ? `Lebenslauf_${toSlug(lastName)}.pdf` : 'Lebenslauf.pdf';

      const el = cvPreviewRef.current;
      
      // 1. Sichtbarkeit erzwingen
      const parent = el.parentElement;
      if (parent) parent.style.opacity = '1';
// NEU: Warte, bis das Overlay "PDF wird generiert" sichtbar ist
      await new Promise(resolve => setTimeout(resolve, 500));
      // 2. Höhe erzwingen (Deine existierende Logik ist hier gut)
      const PAGE_H = 1122;
      const pageCountExport = Math.max(1, Math.ceil(cvHeight / PAGE_H));
      const rootEl = el.querySelector('.cv-render-root') as HTMLElement;
      if (rootEl) {
        rootEl.style.setProperty('min-height', `${pageCountExport * PAGE_H}px`, 'important');
      }

      // 3. WICHTIG: Kurze Pause, damit React das DOM wirklich rendert
      await new Promise(resolve => setTimeout(resolve, 300));

      // 4. Export mit Übergabe der editorData (falls dein Exporter das braucht)
      const blob = await exportCVToPDFBlob(cvPreviewRef, editorData);

      // 5. Cleanup
      if (rootEl) rootEl.style.removeProperty('min-height');
      if (parent) parent.style.opacity = '0.001';

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
      alert('PDF-Erstellung fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setIsExportingPDF(false);
      navigate(`/dashboard?highlightCv=${cvId}`); // ← diese Zeile neu hinzufügen
    }
  };

  const handlePhotoChange = (base64: string | null) => {
    if (base64) {
      setPhotoUrl(base64);
      setEditorData((prev: any) => {
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
      setEditorData((prev: any) => {
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
    setEditorData((prev: any) => {
      if (!prev) return prev;
      return { ...prev, personalInfo: { ...(prev.personalInfo || {}), [field]: value } };
    });
  };

  const updateSection = (sectionIndex: number, updates: Partial<EditorSection>) => {
    setHasEditorChanges(true);
    setEditorData((prev: any) => {
      if (!prev?.sections) return prev;
      const newSections = [...prev.sections];
      newSections[sectionIndex] = { ...newSections[sectionIndex], ...updates };
      return { ...prev, sections: newSections };
    });
  };

  const deleteSectionItem = (sectionIndex: number, itemIndex: number) => {
    setHasEditorChanges(true);
    setEditorData((prev: any) => {
      if (!prev?.sections?.[sectionIndex]) return prev;
      try {
        const newSections = [...prev.sections];
        const section = { ...newSections[sectionIndex] };
        if (!section.items || !Array.isArray(section.items)) return prev;
        section.items = section.items.filter((_: any, idx: number) => idx !== itemIndex);
        newSections[sectionIndex] = section;
        return { ...prev, sections: newSections };
      } catch (error) {
        return prev;
      }
    });
  };

  const deleteBulletPoint = (sectionIndex: number, itemIndex: number, bulletIndex: number) => {
    setHasEditorChanges(true);
    setEditorData((prev: any) => {
      if (!prev?.sections?.[sectionIndex]?.items) return prev;
      try {
        const newSections = prev.sections.map((sec: any, sIdx: number) => {
          if (sIdx !== sectionIndex) return sec;
          const newItems = [...sec.items];
          const item = { ...newItems[itemIndex] };
          const bullets = Array.isArray(item.bulletPoints) ? [...item.bulletPoints] : [];
          item.bulletPoints = bullets.filter((_: any, bIdx: number) => bIdx !== bulletIndex);
          newItems[itemIndex] = item;
          return { ...sec, items: newItems };
        });
        return { ...prev, sections: newSections };
      } catch {
        return prev;
      }
    });
  };

  const reorderSections = (fromIndex: number, toIndex: number) => {
    setHasEditorChanges(true);
    setEditorData((prev: any) => {
      if (!prev?.sections) return prev;
      const newSections = [...prev.sections];
      const [moved] = newSections.splice(fromIndex, 1);
      newSections.splice(toIndex, 0, moved);
      return { ...prev, sections: newSections };
    });
  };

  const updateSectionItem = (sectionIndex: number, itemIndex: number, field: string, value: any) => {
    setHasEditorChanges(true);
    setEditorData((prev: any) => {
      if (!prev?.sections?.[sectionIndex]?.items) return prev;
      const rawItems = prev.sections[sectionIndex].items;
      if (itemIndex < 0 || itemIndex >= rawItems.length) return prev;

      try {
        const newSections = prev.sections.map((sec: any, sIdx: number) => {
          if (sIdx !== sectionIndex) return sec;
          const newItems = [...sec.items];
          const currentItem = newItems[itemIndex];
          let updatedItem: any = {};

          if (typeof currentItem === 'object' && currentItem !== null) {
            updatedItem = { ...currentItem };
          } else if (typeof currentItem === 'string' || typeof currentItem === 'number') {
            updatedItem = { title: String(currentItem), position: String(currentItem), degree: String(currentItem), description: String(currentItem), bulletPoints: [] };
          }

          if (field === 'bulletPoints') {
            updatedItem.bulletPoints = Array.isArray(value) ? [...value] : [];
          } else {
            updatedItem[field] = value;
          }

          newItems[itemIndex] = updatedItem;
          return { ...sec, items: newItems };
        });
        return { ...prev, sections: newSections };
      } catch (error) {
        return prev;
      }
    });
  }
const addSectionItem = (sectionIndex: number, defaultItem: any) => {
    setHasEditorChanges(true);
    setEditorData((prev: any) => {
      if (!prev?.sections?.[sectionIndex]) return prev;
      const newSections = [...prev.sections];
      const section = { ...newSections[sectionIndex] };
      section.items = [...(section.items || []), defaultItem];
      newSections[sectionIndex] = section;
      return { ...prev, sections: newSections };
    });
  }; // <--- DIESE ZEILE HAT GEFEHLT! (Schließt die Funktion)

  if (error) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-[#050507] via-[#0a0a0f] to-[#050507] text-white flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md px-4">
          <AlertTriangle size={64} className="text-red-500 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold mb-2">Fehler</h2>
            <p className="text-white/60">{error}</p>
          </div>
          <button onClick={() => window.history.back()} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all">Zurück</button>
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
      { tag: 'CV-Check', title: 'Was ist der CV-Check?', description: 'Der CV-Check analysiert deinen bestehenden Lebenslauf vollautomatisch: Er bewertet die ATS-Kompatibilität, erkennt inhaltliche Lücken und gibt dir konkrete Verbesserungsvorschläge — kostenlos und in Sekunden.', icon: <FileSearch size={20} className="text-[#66c0b6]" />, accent: '#66c0b6' },
      { tag: 'CV-Erstellung', title: 'Wie funktioniert die CV-Optimierung?', description: 'Du gibst die Stellenanzeige ein — unsere KI liest deinen CV und passt jeden Abschnitt gezielt auf die Stelle an. Formulierungen werden jobspezifisch umgeschrieben, ATS-Keywords eingebaut und die Reihenfolge optimiert.', icon: <Sparkles size={20} className="text-[#66c0b6]" />, accent: '#66c0b6' },
      { tag: 'Career Academy', title: 'Was ist die Career Academy?', description: 'Die Career Academy hilft dir, deinen persönlichen Karrierepfad zu entwickeln. Mit KI-gestützten Gap-Analysen siehst du, welche Skills du noch brauchst, und bekommst individuell zusammengestellte Lernpfade.', icon: <GraduationCap size={20} className="text-[#66c0b6]" />, accent: '#66c0b6' },
      { tag: 'Harmony Festival', title: 'Was ist das Harmony Festival?', description: 'Ein Tag am Rhein — 22. August 2026. Live-Konzert, DJ-Sets, Stand-Up Comedy, Bierpong-Turnier und das beste Bier aus der Heimat. Kein Karriereevent — ein echtes Festival für echte Begegnung.', icon: <Music2 size={20} className="text-amber-400" />, accent: '#f59e0b', amber: true },
    ];

    return <LoadingPageContent elapsedSeconds={elapsedSeconds} activeStep={activeStep} PROCESSING_STEPS={PROCESSING_STEPS} INFOS={INFOS} />;
  }

const isPostPaymentFlow = searchParams.get('payment') === 'success';
  const showFullscreenSelect = isPostPaymentFlow || showTemplateSelectForExport;

  if (showFullscreenSelect && editorData && !templateConfirmed) {
    return (
      <div className="fixed inset-0 z-[999] bg-[#06060e] text-white flex flex-col items-center justify-center px-4 py-12">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-[#66c0b6]/6 rounded-full blur-[120px]" />
          <div className="absolute -bottom-32 right-1/4 w-[500px] h-[500px] bg-[#30E3CA]/4 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 w-full max-w-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#66c0b6]/10 border border-[#66c0b6]/30 mb-6">
              <Check size={14} className="text-[#66c0b6]" />
              <span className="text-sm text-[#66c0b6] font-medium">Bereit zum Download</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">Wähle dein CV-Design</h1>
            <p className="text-white/50 text-sm">Dein CV wird im gewählten Design als PDF erstellt und heruntergeladen.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTemplateChange(t.id)}
                className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 ${
                  selectedTemplate === t.id ? 'border-[#66c0b6] bg-[#66c0b6]/10 shadow-[0_0_20px_rgba(102,192,182,0.2)]' : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/8'
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

          <div className="flex gap-4">
            <button
              onClick={() => {
                setShowTemplateSelectForExport(false);
                if (isPostPaymentFlow) navigate(`/cv-live-editor/${cvId}`, { replace: true });
              }}
              className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-all"
            >
              Abbrechen
            </button>
<button
onClick={async () => {
  if (!isDownloadUnlocked) {
    // Erst Paywall öffnen, Modal offen lassen
    setShowPaywallModal(true);
    return; // ← sofort raus, kein setShowTemplateSelectForExport(false)
  }
  
  setShowTemplateSelectForExport(false);
  setTemplateConfirmed(true);
  await new Promise(r => setTimeout(r, 200));
  triggerDirectExport();
}}
  className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold text-lg"
>
  PDF erstellen
</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="h-screen bg-[#050507] flex flex-col overflow-hidden font-sans w-full">
      {isPostPaymentFlow && templateConfirmed && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2,6,23,0.94)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', pointerEvents: 'all' }}>
          <Loader2 className="w-14 h-14 text-[#66c0b6] animate-spin" />
          <h2 className="text-2xl font-bold text-white">PDF wird generiert...</h2>
          <p className="text-white/60 max-w-sm text-center">Bitte schließe dieses Fenster nicht.</p>
        </div>
      )}
      
      {showPaymentSuccessBanner && (
        <div className="bg-[#66c0b6] text-black px-4 py-3 flex items-center justify-between flex-shrink-0 z-[60]">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm">Zahlung erfolgreich!</span>
            <span className="text-sm">Dein CV wird jetzt als PDF erstellt...</span>
          </div>
          <button onClick={() => setShowPaymentSuccessBanner(false)} className="text-black/60 hover:text-black transition-colors text-lg font-bold leading-none">&times;</button>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 flex-shrink-0 z-50 sticky top-0 w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <button onClick={() => navigate('/dashboard')} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2 text-white/70 hover:text-white" title="Zum Dashboard">
                <ArrowLeft size={16} /> <span className="hidden sm:inline text-sm">Dashboard</span>
              </button>
              <div className="flex sm:hidden items-center gap-2">
                <button onClick={() => setShowPhotoUpload(!showPhotoUpload)} className="p-2.5 rounded-lg bg-[#66c0b6]/20 border border-[#66c0b6]/40 text-[#66c0b6]"><Camera size={18} /></button>
                <button onClick={handleDownloadClick} disabled={isExportingPDF} className={`p-2.5 rounded-lg bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black shadow-lg ${isExportingPDF ? 'opacity-50' : ''}`}>
                  {isExportingPDF ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto hide-scrollbar pb-1 sm:pb-0">
              <span className="text-sm text-white/60 hidden sm:inline flex-shrink-0">Design:</span>
              {templates.map((template) => (
                <button key={template.id} onClick={() => handleTemplateChange(template.id)} className={`px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex-shrink-0 flex items-center gap-1.5 ${selectedTemplate === template.id ? 'bg-[#66c0b6] text-black' : 'bg-white/5 text-white/70'}`}>
                  <span>{template.icon}</span> <span>{template.name}</span>
                </button>
              ))}
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <button onClick={() => setShowPhotoUpload(!showPhotoUpload)} className="px-4 py-2 rounded-lg bg-[#66c0b6]/20 hover:bg-[#66c0b6]/30 transition-all border border-[#66c0b6]/40 flex items-center gap-2"><Camera size={18} className="text-[#66c0b6]" /> <span className="text-sm font-medium text-white/90">Foto</span></button>
              <button onClick={handleDownloadClick} disabled={isExportingPDF} className={`px-5 py-2 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold text-sm hover:brightness-110 hover:shadow-lg hover:shadow-[#66c0b6]/30 transition-all flex items-center gap-2 ${isExportingPDF ? 'opacity-50 cursor-not-allowed' : 'animate-pulse-subtle'}`}>
                {isExportingPDF ? <><Loader2 size={16} className="animate-spin" /> Generiere...</> : <><Download size={16} /> Herunterladen</>}
              </button>
              <button onClick={() => setShowTips(!showTips)} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex items-center gap-2"><Sparkles size={16} className="text-[#66c0b6]" /></button>
            </div>
          </div>

          {showPhotoUpload && (
            <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <PhotoUpload currentPhoto={photoUrl} onPhotoChange={handlePhotoChange} />
            </div>
          )}
          {photoUrl && (
            <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10 space-y-2 max-w-sm">
              <p className="text-xs font-medium text-white/50">Bildausschnitt</p>
              <div className="flex items-center gap-2"><span className="text-xs text-white/40 w-14 flex-shrink-0">Horizontal</span><input type="range" min={0} max={100} value={photoPosition.x} onChange={(e) => setPhotoPosition((p) => ({ ...p, x: Number(e.target.value) }))} className="flex-1 accent-[#66c0b6]" /></div>
              <div className="flex items-center gap-2"><span className="text-xs text-white/40 w-14 flex-shrink-0">Vertikal</span><input type="range" min={0} max={100} value={photoPosition.y} onChange={(e) => setPhotoPosition((p) => ({ ...p, y: Number(e.target.value) }))} className="flex-1 accent-[#66c0b6]" /></div>
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA MIT PHYSISCHEN A4-BLÄTTERN */}
{/* MAIN CONTENT AREA MIT PHYSISCHEN A4-BLÄTTERN */}
     {/* MAIN CONTENT AREA MIT PHYSISCHEN A4-BLÄTTERN */}
      <main ref={mainRefCallback} className="flex-1 overflow-y-auto overflow-x-auto bg-[#1e1e24] w-full py-12 flex flex-col items-center">
        
        <style>{`
          [data-pdf-root] textarea, [data-pdf-root] p, [data-pdf-root] span, [data-pdf-root] div, [data-pdf-root] li {
            white-space: pre-wrap !important;
            word-break: break-word !important;
          }
          .pdf-hidden { display: block !important; }
          .nonce-export { display: none !important; }

          .a4-page-frame {
            width: 794px !important;
            height: 1122px !important;
            background-color: #ffffff !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4) !important;
            border-radius: 4px;
            position: absolute !important;
            overflow: hidden !important;
          }

          /* Schrift-Rendering auf Mobile stabilisieren */
          .a4-page-frame {
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
          }
        `}</style>

        {(() => {
          const PAGE_H = 1122;
          const GAP = 32; // Exakt 1cm Lücke
          const pageCountRender = Math.max(1, Math.ceil(cvHeight / PAGE_H));

          const templateProps = {
            pageBreakItems,
            pageCount: pageCountRender,
            personalInfo: editorData.personalInfo!,
            summary: editorData.summary,
            sections: editorData.sections!,
            photoUrl,
            photoPosition,
            onUpdatePersonalInfo: updatePersonalInfo,
            onUpdateSummary: (v: string) => setEditorData((p: any) => p ? { ...p, summary: v } : p),
            onUpdateSection: updateSection,
            onUpdateSectionItem: updateSectionItem,
            onAddSectionItem: addSectionItem,
            onDeleteSectionItem: deleteSectionItem,
            onDeleteBullet: deleteBulletPoint,
            onReorderSections: reorderSections,
          };

          const renderTemplate = () => {
            if (selectedTemplate === 'modern') return <ModernCVTemplate {...templateProps} />;
            if (selectedTemplate === 'classic') return <ClassicCVTemplate {...templateProps} />;
            if (selectedTemplate === 'minimal') return <MinimalCVTemplate {...templateProps} />;
            if (selectedTemplate === 'creative') return <CreativeCVTemplate {...templateProps} />;
            if (selectedTemplate === 'professional') return <ProfessionalCVTemplate {...templateProps} />;
            return null;
          };

          const containerHeight = (pageCountRender * PAGE_H * scale) + ((pageCountRender - 1) * GAP * scale);

          return (
            <div style={{ width: `${794 * scale}px`, height: `${containerHeight}px`, position: 'relative', margin: '0 auto', flexShrink: 0 }}>
              
              {/* LÖSUNG FÜR PDF-CRASH: Opacity 0.001 statt display none / -9999px! */}
              <div style={{ position: 'absolute', top: 0, left: 0, opacity: 0.001, zIndex: -100, pointerEvents: 'none' }}>
                <div ref={cvPreviewRef} data-pdf-root style={{ width: '794px', backgroundColor: '#ffffff' }}>
                  {renderTemplate()}
                </div>
              </div>

              {/* Sichtbare physische A4-Blätter mit exakt 1cm Lücke */}
              {Array.from({ length: pageCountRender }).map((_, pageIdx) => {
                const frameTop = pageIdx * (PAGE_H + GAP) * scale;
                const contentOffset = -(pageIdx * PAGE_H);

                return (
                  <div key={pageIdx} className="a4-page-frame" style={{ top: `${frameTop}px`, left: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                    <div style={{ position: 'absolute', top: `${contentOffset}px`, left: 0, width: '794px' }}>
                      {renderTemplate()}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
        {/* METADATA SECTION */}
        {jobData && (jobData.jobTitle || jobData.company) && (
          <div className="mt-12 px-4 w-full" style={{ width: `${794 * scale}px` }}>
            <button onClick={() => setShowJobDescription(!showJobDescription)} className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.08]">
              <div className="flex items-center gap-2 text-sm"><Briefcase size={16} className="text-[#66c0b6] flex-shrink-0" /><span className="text-white/70">Stellenbeschreibung:</span>{jobData.jobTitle && <span className="text-[#66c0b6] font-medium truncate">{String(jobData.jobTitle)}</span>}</div>
              <ChevronDown size={16} className={`text-white/40 flex-shrink-0 transition-transform ${showJobDescription ? 'rotate-180' : ''}`} />
            </button>
            {showJobDescription && (
              <div className="mt-1 bg-white/5 border border-white/10 border-t-0 rounded-b-xl overflow-hidden"><div className="p-4 space-y-3">{jobData.jobDescription && (<div className="bg-black/20 rounded-lg p-3 max-h-64 overflow-y-auto text-sm text-white/80 whitespace-pre-wrap">{String(jobData.jobDescription)}</div>)}</div></div>
            )}
          </div>
        )}

        {/* MATCHING TEXT */}
        {editorData?.matching_text && (
          <div className="mt-6 mb-12 bg-[#0f1729] border border-[#66c0b6]/20 rounded-2xl p-4 sm:p-6 w-full" style={{ width: `${794 * scale}px` }}>
            <div className="flex items-center gap-2 mb-3"><Sparkles size={18} className="text-[#66c0b6]" /><h3 className="text-white font-semibold text-sm">Generierter Matching-Text</h3></div>
            <p className="text-white/80 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{editorData.matching_text}</p>
          </div>
        )}
      </main>
      {/* CONFIGURATION & PAYMENT OVERLAYS */}
<CVOptimizerPaywall
  isOpen={showPaywallModal}
  onClose={() => setShowPaywallModal(false)}
  onSuccess={handlePaywallSuccess}
  cvId={cvId}
  userId={user?.id}
/>

      {showTemplateSelectForExport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Design auswählen</h2>
              <p className="text-white/50 text-sm">Wähle das Template für deinen PDF-Download.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {templates.map((t) => (
                <button key={t.id} onClick={() => handleTemplateChange(t.id)} className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 ${selectedTemplate === t.id ? 'border-[#66c0b6] bg-[#66c0b6]/10' : 'border-white/10 bg-white/5 hover:border-white/25'}`}>
                  {selectedTemplate === t.id && <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#66c0b6] flex items-center justify-center"><Check size={11} className="text-black" /></div>}
                  <span className="text-3xl">{t.icon}</span> <span className={`text-sm font-semibold ${selectedTemplate === t.id ? 'text-[#66c0b6]' : 'text-white/80'}`}>{t.name}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowTemplateSelectForExport(false)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all">Abbrechen</button>
              <button onClick={() => { setShowTemplateSelectForExport(false); triggerDirectExport(); }} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold transition-all flex items-center justify-center gap-2"><Download size={18} /> PDF erstellen</button>
            </div>
          </div>
        </div>
      )}

      {showTips && (
        <div className="fixed top-20 right-4 max-w-md bg-[#1a1a1a] border border-[#66c0b6]/30 rounded-xl p-4 shadow-2xl z-50">
          <div className="flex items-start gap-3">
            <Sparkles size={20} className="text-[#66c0b6] flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-2">💡 Editor-Tipps</h3>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• Klicke auf Texte, um sie direkt zu bearbeiten</li>
                <li>• Wähle ein Design aus den Templates</li>
                <li>• Lade ein Foto hoch</li>
                <li>• Lade den fertigen CV als PDF herunter</li>
              </ul>
            </div>
            <button onClick={() => setShowTips(false)} className="text-white/50 hover:text-white">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}