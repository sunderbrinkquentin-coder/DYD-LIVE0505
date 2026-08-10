// src/pages/CVWizard.tsx

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowRight, ArrowLeft, Check, Loader2, AlertTriangle, X as XIcon, ChevronRight, Plus } from 'lucide-react';

function CVWizardLoadingScreen({ onTimeout }: { onTimeout?: () => void }) {
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowHint(true), 5000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!onTimeout) return;
    const t = setTimeout(onTimeout, 20_000);
    return () => clearTimeout(t);
  }, [onTimeout]);
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <Loader2 className="w-12 h-12 text-[#66c0b6] animate-spin" />
        <p className="text-white/70 font-medium">Dein Profil wird vorbereitet...</p>
        {showHint && (
          <p className="text-white/40 text-sm max-w-xs mt-2">
            Das dauert ungewohnlich lang. Bitte drücke <strong className="text-white/60">STRG + F5</strong> um die Seite neu zu laden und starte den Prozess nochmal.
          </p>
        )}
      </div>
    </div>
  );
}

import { AvatarSidebar } from '../components/cvbuilder/AvatarSidebar';
import { MotivationScreen } from '../components/cvbuilder/MotivationScreen';
import { WizardEntryScreen } from '../components/cvbuilder/WizardEntryScreen';
import { WizardCVUpload } from '../components/cvbuilder/WizardCVUpload';
import { ProgressBar } from '../components/cvbuilder/ProgressBar';
import { WizardProgressIndicator } from '../components/cvbuilder/WizardProgressIndicator';
import { WIZARD_STEPS, getStepByIndex } from '../config/wizardSteps';

// Step Components
import { ExperienceLevelStep } from '../components/cvbuilder/steps/ExperienceLevelStep';
import { PersonalDataStep } from '../components/cvbuilder/steps/PersonalDataStep';
import { SchoolEducationStep } from '../components/cvbuilder/steps/SchoolEducationStep';
import { ProfessionalEducationStep } from '../components/cvbuilder/steps/ProfessionalEducationStep';
import { WorkExperienceStep } from '../components/cvbuilder/steps/WorkExperienceStep';
import { InternshipsStep } from '../components/cvbuilder/steps/InternshipsStep';
import { ProjectsStep } from '../components/cvbuilder/steps/ProjectsStep';
import { HardSkillsStep } from '../components/cvbuilder/HardSkillsStep';
import { SoftSkillsStep } from '../components/cvbuilder/SoftSkillsStep';
import { WorkValuesStep } from '../components/cvbuilder/steps/WorkValuesStep';
import { HobbiesStep } from '../components/cvbuilder/steps/HobbiesStep';
import { CompletionStep } from '../components/cvbuilder/steps/CompletionStep';
import { StipendienStep } from '../components/cvbuilder/steps/StipendienStep';
import { VolunteerStep } from '../components/cvbuilder/steps/VolunteerStep';
import { CertificatesStep } from '../components/cvbuilder/steps/CertificatesStep';

import { CVBuilderData } from '../types/cvBuilder';
import { mapEditorDataToWizard } from '../utils/cvDataMapper';
import { checkStepCompleteness, getIncompleteRequiredSteps } from '../utils/wizardCompleteness';
import {
  isSectionSkipped,
  GATE_WORK_EXPERIENCE,
  GATE_FORMAL_EDUCATION,
  GATE_EXTRAS,
} from '../config/cvQuestions';

import { useAuth } from '../contexts/AuthContext';
import { sessionManager } from '../utils/sessionManager';
import { getOrCreateTempId, clearTempId } from '../utils/tempIdManager';
import { cvProfileService } from '../services/cvProfileService';

// ─────────────────────────────────────────────────────────────────────────────
// Flow-Umbau: Zuordnung Step-Index → Section-Key (aus der renderStep-Reihenfolge)
// Nur verzweigbare/überspringbare Sektionen. Schulbildung (2) bleibt immer
// sichtbar und ist bewusst NICHT hier gelistet.
// ─────────────────────────────────────────────────────────────────────────────
const STEP_SECTION: Record<number, string> = {
  3: 'professionalEducation',
  4: 'workExperience',
  5: 'projects',
  6: 'stipendien',
  7: 'volunteerWork',
  8: 'certificates',
  12: 'hobbies',
};

const SECTION_STEP: Record<string, number> = {
  professionalEducation: 3,
  workExperience: 4,
  projects: 5,
  stipendien: 6,
  volunteerWork: 7,
  certificates: 8,
  hobbies: 12,
};

const SECTION_LABEL: Record<string, string> = {
  professionalEducation: 'Ausbildung/Studium',
  workExperience: 'Berufserfahrung',
  projects: 'Projekte',
  stipendien: 'Stipendien',
  volunteerWork: 'Ehrenamt',
  certificates: 'Zertifikate',
  hobbies: 'Hobbys',
};

// section-key → extras-value (Cluster nutzt 'volunteer', Section heißt 'volunteerWork')
const EXTRAS_VALUE: Record<string, string> = {
  projects: 'projects',
  stipendien: 'stipendien',
  volunteerWork: 'volunteer',
  certificates: 'certificates',
  hobbies: 'hobbies',
};

// Runde 2: Motivation-Screens entschärft. Statt der mechanischen %-3-Kadenz
// (4 Interrupts) erscheint nur noch beim BETRETEN dieser Steps ein Screen.
// Bewusst reduziert auf einen sinnvollen Meilenstein; leicht erweiterbar.
const MOTIVATION_ON_ENTER: Record<number, 1 | 2 | 3> = {
  9: 2, // Übergang von Inhalten zu den Skills – „starke Basis, jetzt die Skills"
};

/** Leitet Gate-Flags aus vorhandenen Daten ab (Import-Fall), ohne bereits
 *  gesetzte Antworten zu überschreiben. Extras bleibt bewusst offen, damit das
 *  Cluster noch erscheint und die erkannten Sektionen dort vorausgewählt sind. */
function deriveFlags(d: any): CVBuilderData['flags'] {
  const flags = { ...(d?.flags || {}) };
  if (flags.hasWorkExperience === undefined && (d?.workExperiences?.length ?? 0) > 0) {
    flags.hasWorkExperience = true;
  }
  if (flags.hasFormalEducation === undefined && (d?.professionalEducation?.length ?? 0) > 0) {
    flags.hasFormalEducation = true;
  }
  return flags;
}

/** Vorauswahl der Cluster-Chips anhand vorhandener Inhalte. */
function deriveExtrasFromContent(d: any): string[] {
  const out: string[] = [];
  if ((d?.projects?.length ?? 0) > 0) out.push('projects');
  if ((d?.stipendien?.length ?? 0) > 0) out.push('stipendien');
  if ((d?.volunteerWork?.length ?? 0) > 0) out.push('volunteer');
  if ((d?.certificates?.length ?? 0) > 0) out.push('certificates');
  if ((d?.hobbies?.hobbies?.length ?? 0) > 0 || d?.hobbies?.details) out.push('hobbies');
  return out;
}

// ── Gate-Screen (eine Frage, große Antwortkarten, Auto-Advance) ───────────────
function GateScreen({
  gate,
  onAnswer,
  onBack,
}: {
  gate: typeof GATE_WORK_EXPERIENCE;
  onAnswer: (setsFlags: any) => void;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen w-full bg-[#020617] text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <button
            onClick={onBack}
            className="mb-8 flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={18} /> Zurück
          </button>
          <h1 className="text-2xl font-semibold mb-2 leading-snug">{gate.prompt}</h1>
          {gate.helper && <p className="text-white/50 mb-8">{gate.helper}</p>}
          <div className="flex flex-col gap-3">
            {gate.options.map((opt: any) => (
              <button
                key={opt.value}
                onClick={() => onAnswer(opt.setsFlags || {})}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#66c0b6]/60 hover:bg-[#66c0b6]/10 transition-all text-left"
              >
                <div className="flex-1">
                  <p className="font-medium text-white">{opt.label}</p>
                  {opt.hint && <p className="text-xs text-white/40 mt-0.5">{opt.hint}</p>}
                </div>
                <ChevronRight size={18} className="text-white/40" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── „Noch etwas?"-Cluster (Mehrfachauswahl, ersetzt die tote Mitte) ───────────
function ExtrasClusterScreen({
  initialSelected,
  onConfirm,
  onBack,
}: {
  initialSelected: string[];
  onConfirm: (selected: string[]) => void;
  onBack: () => void;
}) {
  const [sel, setSel] = useState<Set<string>>(new Set(initialSelected));
  const toggle = (v: string) =>
    setSel((prev) => {
      const n = new Set(prev);
      n.has(v) ? n.delete(v) : n.add(v);
      return n;
    });

  return (
    <div className="min-h-screen w-full bg-[#020617] text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <button
            onClick={onBack}
            className="mb-8 flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={18} /> Zurück
          </button>
          <h1 className="text-2xl font-semibold mb-2 leading-snug">{GATE_EXTRAS.prompt}</h1>
          {GATE_EXTRAS.helper && <p className="text-white/50 mb-8">{GATE_EXTRAS.helper}</p>}
          <div className="grid grid-cols-1 gap-3 mb-8">
            {GATE_EXTRAS.options.map((c: any) => {
              const active = sel.has(c.value);
              return (
                <button
                  key={c.value}
                  onClick={() => toggle(c.value)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                    active
                      ? 'bg-[#66c0b6]/15 border-[#66c0b6]/60'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-medium text-white">{c.label}</p>
                    {c.hint && <p className="text-xs text-white/40 mt-0.5">{c.hint}</p>}
                  </div>
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center ${
                      active ? 'border-[#66c0b6] bg-[#66c0b6]/20 text-[#66c0b6]' : 'border-white/15 text-white/40'
                    }`}
                  >
                    {active ? <Check size={15} /> : <Plus size={15} />}
                  </div>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => onConfirm(Array.from(sel))}
            className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            Weiter <ArrowRight size={20} />
          </button>
          <button
            onClick={() => onConfirm(Array.from(new Set(initialSelected)))}
            className="w-full mt-2 py-2 text-white/50 hover:text-white/70 text-sm transition-colors"
          >
            Nichts weiter hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
}

function adaptParsedCvToBuilderData(parsed: any): CVBuilderData {
  if (!parsed || typeof parsed !== 'object') return {};

  const raw = parsed?.editor_data || parsed;
  console.log('[Mapper] Processing source keys:', Object.keys(raw));

  // If data is already in CVBuilderData format (wizard draft), return as-is with defaults
 if (raw.personalData != null || raw.workExperiences != null || raw.experienceLevel != null) {
  const workExperiences = (raw.workExperiences || []).map((exp: any) => {
    if (Array.isArray(exp.tasksWithMetrics) && exp.tasksWithMetrics.length > 0) return exp;
    const bullets: string[] = Array.isArray(exp.bullets) ? exp.bullets.filter(Boolean) :
      Array.isArray(exp.tasks) ? exp.tasks.filter(Boolean) : [];
    return {
      ...exp,
      tasksWithMetrics: bullets.map((b: string) => ({ task: b, metrics: { description: b } })),
    };
  });
  return {
    ...raw,
    workExperiences,
    schoolEducation: raw.schoolEducation || [],        // ✅ NEU
    projects: raw.projects || [],
    hardSkills: raw.hardSkills || [],
    softSkills: raw.softSkills || [],
    professionalEducation: raw.professionalEducation || [],
    languages: raw.languages || [],
    workValues: raw.workValues || { values: [], workStyle: [] },
    hobbies: raw.hobbies || { hobbies: [], details: '' },
    stipendien: raw.stipendien || [],                  // ✅ NEU
    volunteerWork: raw.volunteerWork || [],            // ✅ NEU
    certificates: raw.certificates || [],              // ✅ NEU
  } as CVBuilderData;
}

  // Snake_case / Make / CV-Check format — delegate to the full multi-format mapper
  return mapEditorDataToWizard(raw);
}


export function CVWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const modeIsNew = searchParams.get('mode') === 'new';
  const importFromId = searchParams.get('importFrom');

  // ---- States ----
  const [cvId, setCvId] = useState<string | null>(
    modeIsNew ? null : (location.state?.cvId || searchParams.get('cvId'))
  );
  const [tempId, setTempId] = useState<string | null>(null);
const [cvData, setCVData] = useState<CVBuilderData>({
  personalData: {},
  workExperiences: [],
  schoolEducation: [],        // ✅ NEU
  professionalEducation: [],
  hardSkills: [],
  softSkills: [],
  languages: [],
  projects: [],
  workValues: { values: [], workStyle: [] },
  hobbies: { hobbies: [], details: '' },
  stipendien: [],             // ✅ NEU
  volunteerWork: [],          // ✅ NEU
  certificates: [],           // ✅ NEU
} as CVBuilderData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showMotivation, setShowMotivation] = useState(false);
  const [motivationVariant, setMotivationVariant] = useState<1 | 2 | 3>(1);

  // ---- Flow-Umbau: Interstitials (Gate-Fragen / Cluster) ----
  const [interstitial, setInterstitial] = useState<'edu' | 'work' | 'extras' | null>(null);
  const [pendingSectionStep, setPendingSectionStep] = useState<number | null>(null);
  const [pendingStep, setPendingStep] = useState<number | null>(null);

  const [isHydrated, setIsHydrated] = useState(false);
  const [showEntryScreen, setShowEntryScreen] = useState(false);
  const prefillMappedRef = useRef<CVBuilderData | null>(null);

  const cvIdRef = useRef<string | null>(null);
  const userRef = useRef(user);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);
  const hasInitializedRef = useRef(false);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const [progressBarHeight, setProgressBarHeight] = useState(160);

  cvIdRef.current = cvId;
  userRef.current = user;

  // ---- Measure progress bar height dynamically ----
  useEffect(() => {
    const el = progressBarRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setProgressBarHeight(el.offsetHeight);
    });
    ro.observe(el);
    setProgressBarHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  // ---- Database Sync (Load) ----
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initWizard = async () => {
      isInitialLoadRef.current = true;
      if (!cvId) {
        // Create draft BLOCKING – UI waits until cvId is available
        setIsLoading(true);

        clearTempId();
        const newTempId = getOrCreateTempId();
        const sessionId = sessionManager.getSessionId();
        const userId = user?.id || null;

        setTempId(newTempId);

        // For logged-in users, try to load their most recent completed CV data as starting point
        let prefillCvData: any = {};
        let prefillMapped: CVBuilderData | null = null;

        const deepParseCvData = (raw: any): any => {
          let parsed = raw;
          // Parse until we get an object (handles triple/double serialization from Make/Supabase)
          for (let i = 0; i < 5; i++) {
            if (typeof parsed !== 'string') break;
            try { parsed = JSON.parse(parsed); } catch { break; }
          }
          // Unwrap nested editor_data string if present
          if (parsed && typeof parsed === 'object' && typeof parsed.editor_data === 'string') {
            try { parsed = { ...parsed, editor_data: JSON.parse(parsed.editor_data) }; } catch {}
          }
          // If editor_data is an object, use it as the effective data
          if (parsed && typeof parsed === 'object' && parsed.editor_data && typeof parsed.editor_data === 'object') {
            parsed = parsed.editor_data;
          }
          return parsed;
        };

        if (importFromId) {
          // Workflow A: Import from a specific stored_cvs record (e.g. from CV-Check)
          try {
            const { data: importRow } = await supabase
              .from('stored_cvs')
              .select('cv_data')
              .eq('id', importFromId)
              .maybeSingle();

            if (importRow?.cv_data) {
              const effectiveData = deepParseCvData(importRow.cv_data);
              console.log('[CVWizard] importFrom effectiveData keys:', effectiveData && typeof effectiveData === 'object' ? Object.keys(effectiveData) : typeof effectiveData);
              prefillMapped = adaptParsedCvToBuilderData(effectiveData);
              prefillCvData = prefillMapped;
              console.log('[CVWizard] importFrom mapped – firstName:', prefillMapped?.personalData?.firstName, 'workExp:', prefillMapped?.workExperiences?.length ?? 0);
            }
          } catch (importErr) {
            console.warn('[CVWizard] Could not import from CV:', importErr);
          }
      } else if (!importFromId && userId && !modeIsNew) {
          // NEU: cv_profiles ist die primäre Quelle für den Status Quo
          try {
            const profile = await cvProfileService.ensureProfile(userId);
            if (profile?.cv_data && Object.keys(profile.cv_data).length > 0) {
              prefillMapped = adaptParsedCvToBuilderData(profile.cv_data);
              prefillCvData = prefillMapped;
              console.log('[CVWizard] Prefill aus cv_profiles – firstName:', prefillMapped?.personalData?.firstName);
            }
          } catch (e) {
            console.warn('[CVWizard] Profil-Prefill fehlgeschlagen:', e);
          }

          // Fallback: alte stored_cvs-Heuristik NUR wenn das Profil (noch) leer ist
          const profileWasEmpty =
            !prefillMapped ||
            !(prefillMapped.personalData?.firstName || (prefillMapped.workExperiences?.length ?? 0) > 0);

          if (profileWasEmpty) {
            try {
              const { data: existingCvs } = await supabase
                .from('stored_cvs')
                .select('cv_data, status, source, updated_at')
                .eq('user_id', userId)
                .not('cv_data', 'is', null)
                .neq('cv_data', '{}')
                .order('updated_at', { ascending: false })
                .limit(10);

              console.log('[CVWizard] Prefill candidates (all sources):', existingCvs?.length ?? 0);

              if (existingCvs && existingCvs.length > 0) {
                const isNonEmpty = (d: any) => d && typeof d === 'object' && Object.keys(d).length > 0;

                const hasRealWizardData = (d: any) => {
                  if (!isNonEmpty(d)) return false;
                  if (d?.personalData == null && d?.workExperiences == null && d?.professionalEducation == null) return false;
                  const pd = d?.personalData;
                  const hasName = pd?.firstName?.trim() || pd?.lastName?.trim();
                  const hasExp = Array.isArray(d?.workExperiences) && d.workExperiences.length > 0;
                  const hasEdu = Array.isArray(d?.professionalEducation) && d.professionalEducation.length > 0;
                  return !!(hasName || hasExp || hasEdu);
                };

                const hasRealCheckData = (d: any) => {
                  if (!isNonEmpty(d)) return false;
                  const hasPersonal = d?.personal_data && (d.personal_data?.full_name || d.personal_data?.email);
                  const hasExp = Array.isArray(d?.experiences) && d.experiences.length > 0;
                  return !!(hasPersonal || hasExp);
                };

                const withWizardData = existingCvs.find(cv => hasRealWizardData(deepParseCvData(cv.cv_data)));
                const withCheckData = existingCvs.find(cv => hasRealCheckData(deepParseCvData(cv.cv_data)));
                const withEditorData = existingCvs.find(cv => {
                  const d = deepParseCvData(cv.cv_data);
                  return isNonEmpty(d) && (d?.contact || d?.experience || d?.experiences);
                });

                const best = withWizardData || withCheckData || withEditorData;

                if (best?.cv_data) {
                  const effectiveData = deepParseCvData(best.cv_data);
                  prefillMapped = adaptParsedCvToBuilderData(effectiveData);
                  prefillCvData = prefillMapped;
                  console.log('[CVWizard] Pre-filling from stored_cvs fallback, source:', best.source);

                  // Einmalig ins Profil migrieren — ab jetzt greift oben immer cv_profiles
                  cvProfileService
                    .saveProfile(userId, prefillMapped, 'migrated')
                    .catch(err => console.warn('[CVWizard] Profil-Migration fehlgeschlagen:', err));
                }
              }
            } catch (prefillErr) {
              console.warn('[CVWizard] Could not load prefill data:', prefillErr);
            }
          }
        }
        try {
          const insertPromise = supabase
            .from('stored_cvs')
            .insert({
              user_id: userId,
              session_id: sessionId,
              temp_id: newTempId,
              source: 'wizard',
              status: 'draft',
              cv_data: prefillCvData,
            })
            .select('id')
            .single();
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('DB insert timed out')), 15_000)
          );
          const { data: newRecord, error: insertError } = await Promise.race([insertPromise, timeoutPromise]);

          if (insertError || !newRecord) {
            console.error('[CVWizard] Failed to create draft record:', insertError);
            setLoadError('Dein Profil konnte nicht erstellt werden. Bitte lade die Seite neu.');
            setIsHydrated(true);
            isInitialLoadRef.current = false;
            setIsLoading(false);
          } else {
            console.log('[CVWizard] Created new draft record with cvId:', newRecord.id);
            setCvId(newRecord.id);
            navigate(`/cv-wizard?cvId=${newRecord.id}`, { replace: true });

            if (importFromId) {
              // Coming from CV-Check: always skip entry screen and start at step 1
              console.log('[CVWizard] importFrom: skipping entry screen, starting at step 1, firstName:', prefillMapped?.personalData?.firstName);
              setTimeout(() => {
                if (prefillMapped) setCVData({ ...prefillMapped, flags: deriveFlags(prefillMapped) });
                setDataWasImported(true);
                setIsHydrated(true);
                setIsLoading(false);
                isInitialLoadRef.current = false;
                setShowEntryScreen(false);
                setCurrentStep(1);
              }, 100);
            } else {
              // Normal new-wizard flow: show entry screen so user can upload or start fresh
              prefillMappedRef.current = prefillMapped;
              setIsHydrated(true);
              // isInitialLoadRef stays true until user proceeds from entry screen
              setIsLoading(false);
              setShowEntryScreen(true);
            }
          }
        } catch (err: any) {
          console.error('[CVWizard] Init error:', err.message);
          setLoadError('Dein Profil konnte nicht erstellt werden. Bitte lade die Seite neu.');
          setIsHydrated(true);
          isInitialLoadRef.current = false;
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        console.log('[CVWizard] Loading CV data for cvId:', cvId);

        const loadPromise = supabase
          .from('stored_cvs')
          .select('cv_data, status, source')
          .eq('id', cvId)
          .single();
        const loadTimeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('DB load timed out')), 15_000)
        );
        const { data, error } = await Promise.race([loadPromise, loadTimeoutPromise]);

        if (error) {
          console.error('[CVWizard] Load error:', error);
          throw error;
        }

        if (data?.cv_data) {
          const deepParseCvDataLoad = (raw: any): any => {
            let parsed = raw;
            for (let i = 0; i < 5; i++) {
              if (typeof parsed !== 'string') break;
              try { parsed = JSON.parse(parsed); } catch { break; }
            }
            if (parsed && typeof parsed === 'object' && typeof parsed.editor_data === 'string') {
              try { parsed = { ...parsed, editor_data: JSON.parse(parsed.editor_data) }; } catch {}
            }
            if (parsed && typeof parsed === 'object' && parsed.editor_data && typeof parsed.editor_data === 'object') {
              parsed = parsed.editor_data;
            }
            return parsed;
          };

          const raw = deepParseCvDataLoad(data.cv_data);
          console.log('[CVWizard] Loaded cv_data keys:', raw && typeof raw === 'object' ? Object.keys(raw) : typeof raw);

          const baseData: CVBuilderData = adaptParsedCvToBuilderData(raw);

          console.log('[CVWizard] Final mapped data:', {
            experienceLevel: baseData.experienceLevel,
            firstName: baseData.personalData?.firstName,
            lastName: baseData.personalData?.lastName,
            workExperiencesCount: baseData.workExperiences?.length || 0,
            professionalEducationCount: baseData.professionalEducation?.length || 0,
            hardSkillsCount: baseData.hardSkills?.length || 0,
            projectsCount: baseData.projects?.length || 0,
          });

          if (baseData && typeof baseData === 'object') {
            const hasContent = !!(baseData.personalData?.firstName || (baseData.workExperiences?.length ?? 0) > 0);
            if (hasContent) {
              console.log('[CVWizard] System: Applying imported data to state...');
              setCVData({ ...baseData, flags: deriveFlags(baseData) });
              setTimeout(() => {
                setIsHydrated(true);
                isInitialLoadRef.current = false;
                setIsLoading(false);
                setShowEntryScreen(false);
                setCurrentStep(1);
              }, 1000);
            } else {
              setIsHydrated(true);
              isInitialLoadRef.current = false;
              setIsLoading(false);
            }
          } else {
            setIsHydrated(true);
            isInitialLoadRef.current = false;
            setIsLoading(false);
          }
        } else {
          console.log('[CVWizard] No cv_data found, starting fresh');
          setIsHydrated(true);
          isInitialLoadRef.current = false;
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('[CVWizard] Initialization error:', err.message);
        setLoadError('Dein Profil konnte nicht geladen werden.');
        setIsHydrated(true);
        isInitialLoadRef.current = false;
        setIsLoading(false);
      }
    };

    initWizard();
  }, [cvId]);

  // ---- 🔥 SAVE: Speichert aktuellen cvData-Stand in Supabase ----
  const saveProgress = useCallback(async (dataToSave: CVBuilderData) => {
    const currentCvId = cvIdRef.current;
    if (!currentCvId) {
      console.warn('[CVWizard] Cannot auto-save without cvId');
      return;
    }

    setIsSaving(true);
    try {
      const sessionId = sessionManager.getSessionId();
      const userId = userRef.current?.id || null;

      const { error } = await supabase
        .from('stored_cvs')
        .update({
          cv_data: dataToSave,
          session_id: sessionId,
          user_id: userId,
          updated_at: new Date().toISOString(),
          status: 'draft',
        })
        .eq('id', currentCvId);

      if (error) {
        console.error('[CVWizard] Auto-save error:', error);
      } else {
        console.log('[CVWizard] Auto-save successful');
      }
    } catch (err) {
      console.error('[CVWizard] Auto-save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // ---- 🔥 DEBOUNCED AUTO-SAVE: Reagiert auf cvData-Änderungen ----
  useEffect(() => {
    if (!isHydrated || isLoading || isInitialLoadRef.current) {
      console.log('[CVWizard] Auto-save blocked: System not hydrated yet');
      return;
    }
    if (!cvData.personalData?.firstName) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveProgress(cvData), 1000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [cvData, isHydrated, isLoading, saveProgress]);

  // ---- 🔥 UPDATE: Aktualisiert State (Auto-Save läuft via useEffect) ----
  const updateCVData = <K extends keyof CVBuilderData>(
    key: K,
    value: CVBuilderData[K]
  ) => {
    setCVData((prev) => ({ ...prev, [key]: value }));
  };

  // ---- Step Configuration (früh, weil Navigation sie referenziert) ----
  const totalSteps = 14;
  const isBeginner = cvData.experienceLevel === 'beginner';

  // ─────────────────────────────────────────────────────────────────────────
  // Flow-Umbau: Skip-Prädikate + Interstitial-Auflösung
  // ─────────────────────────────────────────────────────────────────────────
  const isSkippedAt = (d: CVBuilderData, index: number): boolean => {
    const section = STEP_SECTION[index];
    return section ? isSectionSkipped(section, d) : false;
  };

  const nextVisible = (d: CVBuilderData, from: number): number => {
    let i = from;
    while (i < totalSteps && isSkippedAt(d, i)) i++;
    return i;
  };

  const gateAt = (d: CVBuilderData, step: number, beginner: boolean): 'edu' | 'work' | null => {
    if (step === 3 && d.flags?.hasFormalEducation === undefined) return 'edu';
    if (step === 4 && !beginner && d.flags?.hasWorkExperience === undefined) return 'work';
    return null;
  };

  const clusterAt = (d: CVBuilderData, step: number): boolean =>
    step >= 5 && step <= 8 && d.flags?.extras === undefined;

  type EntryResolution = { interstitial: 'edu' | 'work' | 'extras'; sectionStep: number } | { step: number };

  const resolveEntry = (d: CVBuilderData, targetRaw: number, beginner: boolean): EntryResolution => {
    const t = nextVisible(d, targetRaw);
    const g = gateAt(d, t, beginner);
    if (g) return { interstitial: g, sectionStep: t };
    if (clusterAt(d, t)) return { interstitial: 'extras', sectionStep: t };
    return { step: t };
  };

  // ---- Navigation Logic ----
  // Runde 2: zentrales „Landen" auf einem Step — zeigt ggf. EINEN Motivations-
  // Screen beim Betreten bestimmter Steps (statt der alten %-3-Kadenz).
  const landOn = (target: number) => {
    const variant = MOTIVATION_ON_ENTER[target];
    if (variant && target !== currentStep) {
      setPendingStep(target);
      setMotivationVariant(variant);
      setShowMotivation(true);
    } else {
      setCurrentStep(target);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextStep = () => {
    const from = currentStep;
    const res = resolveEntry(cvData, from + 1, isBeginner);
    if ('interstitial' in res) {
      setPendingSectionStep(res.sectionStep);
      setInterstitial(res.interstitial);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    landOn(res.step);
  };

  const prevStep = () => {
    let t = currentStep - 1;
    while (t > 0 && isSkippedAt(cvData, t)) t--;
    setCurrentStep(Math.max(0, t));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMotivationContinue = () => {
    setShowMotivation(false);
    setCurrentStep(pendingStep != null ? pendingStep : currentStep + 1);
    setPendingStep(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ---- Gate / Cluster Handler ----
  const handleGateAnswer = (setsFlags: any) => {
    const newData: CVBuilderData = { ...cvData, flags: { ...(cvData.flags || {}), ...setsFlags } };
    setCVData(newData);
    setInterstitial(null);
    const target = pendingSectionStep ?? currentStep + 1;
    const res = resolveEntry(newData, target, isBeginner);
    if ('interstitial' in res) {
      setPendingSectionStep(res.sectionStep);
      setInterstitial(res.interstitial);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      landOn(res.step);
    }
  };

  const handleClusterConfirm = (selected: string[]) => {
    const newData: CVBuilderData = { ...cvData, flags: { ...(cvData.flags || {}), extras: selected as any } };
    setCVData(newData);
    setInterstitial(null);
    const target = pendingSectionStep ?? currentStep + 1;
    const res = resolveEntry(newData, target, isBeginner);
    if ('interstitial' in res) {
      setPendingSectionStep(res.sectionStep);
      setInterstitial(res.interstitial);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      landOn(res.step);
    }
  };

  const handleGateBack = () => {
    // currentStep wurde beim Anzeigen des Interstitials nie verändert
    setInterstitial(null);
    setPendingStep(null);
  };

  // ---- Ausgeblendete Sektion jederzeit wieder einblenden ----
  const unhideSection = (section: string) => {
    const newFlags: any = { ...(cvData.flags || {}) };
    if (section === 'workExperience') newFlags.hasWorkExperience = true;
    else if (section === 'professionalEducation') newFlags.hasFormalEducation = true;
    else {
      const val = EXTRAS_VALUE[section];
      newFlags.extras = Array.from(new Set([...(newFlags.extras || []), val]));
    }
    const newData: CVBuilderData = { ...cvData, flags: newFlags };
    setCVData(newData);
    const idx = SECTION_STEP[section];
    if (idx != null) setCurrentStep(idx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToIndex = (index: number) => {
    const section = STEP_SECTION[index];
    if (section && isSectionSkipped(section, cvData)) {
      unhideSection(section);
      return;
    }
    setCurrentStep(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [isNavigating, setIsNavigating] = useState(false);
  const [dataWasImported, setDataWasImported] = useState(false);
  const [incompleteStepsSet, setIncompleteStepsSet] = useState<Set<number>>(new Set());

  const applyImportedData = (imported: CVBuilderData) => {
    const merged = { ...cvData, ...imported };
    const withFlags: CVBuilderData = { ...merged, flags: deriveFlags(merged) };
    setCVData(withFlags);
    saveProgress(withFlags);
    const isBeginnerLevel = withFlags.experienceLevel === 'beginner';
    const incompleteMandatory = getIncompleteRequiredSteps(withFlags, isBeginnerLevel);
    setIncompleteStepsSet(new Set(incompleteMandatory));
    setDataWasImported(true);
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ---- FINALIZING: Weiter zu Job-Targeting (Webhook + Editor werden dort ausgelöst) ----
  const handleGoToJobTargeting = async () => {
    setIsNavigating(true);

    let resolvedCvId = cvId;

    if (!resolvedCvId) {
      console.warn('[CVWizard] cvId missing – attempting to create draft record now');
      try {
        const newTempId = tempId || getOrCreateTempId();
        const sessionId = sessionManager.getSessionId();
        const userId = user?.id || null;

        if (!tempId) setTempId(newTempId);

        const { data: newRecord, error: insertError } = await supabase
          .from('stored_cvs')
          .insert({
            user_id: userId,
            session_id: sessionId,
            temp_id: newTempId,
            source: 'wizard',
            status: 'draft',
            cv_data: cvData,
          })
          .select('id')
          .single();

        if (insertError || !newRecord) {
          console.error('[CVWizard] Retry insert failed:', insertError);
          setLoadError('Daten konnten nicht gespeichert werden. Bitte versuche es erneut.');
          setIsNavigating(false);
          return;
        }

        resolvedCvId = newRecord.id;
        setCvId(resolvedCvId);
        console.log('[CVWizard] Retry insert successful, cvId:', resolvedCvId);
      } catch (err: any) {
        console.error('[CVWizard] Retry insert exception:', err.message);
        setLoadError('Daten konnten nicht gespeichert werden. Bitte versuche es erneut.');
        setIsNavigating(false);
        return;
      }
    }

const finalData: CVBuilderData = {
  ...cvData,
  workExperiences: cvData.workExperiences || [],
  projects: cvData.projects || [],
  hardSkills: cvData.hardSkills || [],
  softSkills: cvData.softSkills || [],
  schoolEducation: cvData.schoolEducation || [],
  professionalEducation: cvData.professionalEducation || [],
  languages: cvData.languages || [],
  workValues: cvData.workValues || { values: [], workStyle: [] },
  hobbies: cvData.hobbies || { hobbies: [], details: '' },
  // ✅ NEU
  stipendien: cvData.stipendien || [],
  volunteerWork: cvData.volunteerWork || [],
  certificates: cvData.certificates || [],
};

    // Best-effort save with timeout guard — navigation always proceeds regardless
    const saveTimeout = new Promise<void>(resolve => setTimeout(resolve, 8000));
    const saveAttempt = supabase
      .from('stored_cvs')
      .update({ cv_data: finalData, updated_at: new Date().toISOString() })
      .eq('id', resolvedCvId)
      .then(({ error }) => {
        if (error) console.warn('[CVWizard] Final save before navigation failed:', error.message);
      })
      .catch(err => console.warn('[CVWizard] Final save exception:', err));

    await Promise.race([saveAttempt, saveTimeout]);
// NEU: Status Quo aktualisieren — der Wizard-Abschluss definiert die Grunddaten
    if (user?.id) {
      cvProfileService
        .saveProfile(user.id, finalData, 'wizard')
        .catch(err => console.warn('[CVWizard] Profil-Update fehlgeschlagen:', err));
    }
    setIsNavigating(false);
    console.log('[CVWizard] Navigating to job-targeting with cvId:', resolvedCvId);
    navigate(`/job-targeting?cvId=${resolvedCvId}`, {
      state: { cvId: resolvedCvId, cvData: finalData, tempId },
    });
  };

  const getStepInfo = (step: number) => {
    if (isBeginner) {
      const steps = [
        { title: 'Erfahrungslevel', message: 'Lass uns deinen Start bestimmen' },
        { title: 'Persönliche Daten', message: 'Erzähl uns ein bisschen über dich' },
        { title: 'Schulbildung', message: 'Welche Schule besuchst du / hast du besucht?' },
        { title: 'Ausbildung / Studium', message: 'Machst du eine Ausbildung oder studierst du?' },
        { title: 'Praktika & Nebenjobs', message: 'Hast du erste praktische Erfahrungen gesammelt?' },
        { title: 'Projekte', message: 'Zeig, was du außerhalb der Schule geleistet hast' },
        { title: 'Stipendien', message: 'Hast du ein Stipendium erhalten?' },
        { title: 'Ehrenamtliche Arbeit', message: 'Bist du ehrenamtlich aktiv?' },
        { title: 'Zertifikate & Auszeichnungen', message: 'Welche Zertifikate oder Preise hast du erhalten?' },
        { title: 'Fachliche Skills', message: 'Was kannst du – Tools, Software, Sprachen?' },
        { title: 'Soft Skills', message: 'Deine persönlichen Stärken' },
        { title: 'Werte & Arbeitsstil', message: 'Was ist dir bei der Arbeit wichtig?' },
        { title: 'Hobbies', message: 'Was machst du in deiner Freizeit?' },
        { title: 'Fertig!', message: 'Dein CV ist bereit' },
      ];
      return steps[step] || steps[0];
    }
    const steps = [
      { title: 'Erfahrungslevel', message: 'Lass uns dein Erfahrungslevel bestimmen' },
      { title: 'Persönliche Daten', message: 'Erzähl uns ein bisschen über dich' },
      { title: 'Schulbildung', message: 'Welche Schule hast du besucht?' },
      { title: 'Ausbildung/Studium', message: 'Deine berufliche Ausbildung' },
      { title: 'Berufserfahrung', message: 'Deine praktischen Erfahrungen' },
      { title: 'Projekte', message: 'Besondere Projekte, an denen du gearbeitet hast' },
      { title: 'Stipendien', message: 'Hast du ein Stipendium erhalten?' },
      { title: 'Ehrenamtliche Arbeit', message: 'Bist du ehrenamtlich aktiv?' },
      { title: 'Zertifikate & Auszeichnungen', message: 'Welche Zertifikate oder Preise hast du erhalten?' },
      { title: 'Hard Skills', message: 'Deine technischen Fähigkeiten' },
      { title: 'Soft Skills', message: 'Deine persönlichen Stärken' },
      { title: 'Werte & Arbeitsstil', message: 'Was ist dir bei der Arbeit wichtig?' },
      { title: 'Hobbies', message: 'Was machst du in deiner Freizeit?' },
      { title: 'Fertig!', message: 'Dein CV ist bereit' },
    ];
    return steps[step] || steps[0];
  };

  // ---- Render Step Content ----
  const renderStep = () => {
    const stepInfo = getStepInfo(currentStep);

    switch (currentStep) {
      case 0:
        return (
          <ExperienceLevelStep
            value={cvData.experienceLevel}
            onChange={(value) => updateCVData('experienceLevel', value)}
            onNext={(level) => {
              if (level) updateCVData('experienceLevel', level);
              nextStep();
            }}
            uploadSlot={
              <WizardCVUpload
                userId={user?.id ?? null}
                onDataImported={applyImportedData}
              />
            }
          />
        );

      case 1:
        return (
          <PersonalDataStep
            key={isHydrated ? 'hydrated' : 'initial'}
            data={cvData.personalData || {}}
            onChange={(data) => updateCVData('personalData', data)}
            onNext={nextStep}
            onBack={prevStep}
            onSkip={nextStep}
            showValidationImmediately={dataWasImported && liveIncompleteSteps.has(1)}
          />
        );

      case 2:
        return (
          <SchoolEducationStep
            data={cvData.schoolEducation || []}
            onChange={(data) => updateCVData('schoolEducation', data)}
            onNext={nextStep}
            onBack={prevStep}
            onSkip={nextStep}
          />
        );

      case 3:
        return (
          <ProfessionalEducationStep
            data={cvData.professionalEducation || []}
            experienceLevel={cvData.experienceLevel}
            onChange={(data) => updateCVData('professionalEducation', data)}
            onNext={nextStep}
            onBack={prevStep}
            onSkip={nextStep}
          />
        );

      case 4:
        return isBeginner ? (
          <InternshipsStep
            data={cvData.workExperiences || []}
            onChange={(data) => updateCVData('workExperiences', data)}
            onNext={nextStep}
            onBack={prevStep}
          />
        ) : (
          <WorkExperienceStep
            data={cvData.workExperiences || []}
            experienceLevel={cvData.experienceLevel}
            onChange={(data) => updateCVData('workExperiences', data)}
            onNext={nextStep}
            onBack={prevStep}
            onSkip={nextStep}
          />
        );

      case 5:
        return (
          <ProjectsStep
            data={cvData.projects || []}
            experienceLevel={cvData.experienceLevel}
            onChange={(data) => updateCVData('projects', data)}
            onNext={nextStep}
            onBack={prevStep}
          />
        );

      case 6:
        return (
          <StipendienStep
            data={cvData.stipendien || []}
            onChange={(data) => updateCVData('stipendien', data)}
            onNext={nextStep}
            onBack={prevStep}
          />
        );

      case 7:
        return (
          <VolunteerStep
            data={cvData.volunteerWork || []}
            onChange={(data) => updateCVData('volunteerWork', data)}
            onNext={nextStep}
            onBack={prevStep}
          />
        );

      case 8:
        return (
          <CertificatesStep
            data={cvData.certificates || []}
            onChange={(data) => updateCVData('certificates', data)}
            onNext={nextStep}
            onBack={prevStep}
          />
        );

      case 9:
        return (
          <HardSkillsStep
            skills={cvData.hardSkills || []}
            languages={cvData.languages || []}
            onSkillsChange={(skills) => updateCVData('hardSkills', skills)}
            onLanguagesChange={(languages) => updateCVData('languages', languages)}
            onNext={nextStep}
            onBack={prevStep}
          />
        );

      case 10:
        return (
          <SoftSkillsStep
            data={cvData.softSkills || []}
            onChange={(data) => updateCVData('softSkills', data)}
            onNext={nextStep}
            onBack={prevStep}
          />
        );

      case 11:
        return (
          <WorkValuesStep
            currentStep={currentStep}
            totalSteps={totalSteps}
            initialValues={cvData.workValues || { values: [], workStyle: [] }}
            onNext={(data) => {
              updateCVData('workValues', data);
              nextStep();
            }}
            onPrev={prevStep}
          />
        );

      case 12:
        return (
          <HobbiesStep
            data={cvData.hobbies || { hobbies: [], details: '' }}
            onChange={(data) => updateCVData('hobbies', data)}
            onNext={nextStep}
            onBack={prevStep}
          />
        );

      case 13:
        return (
          <CompletionStep
            cvData={cvData}
            onComplete={handleGoToJobTargeting}
            onBack={prevStep}
            isLoading={isNavigating}
          />
        );

      default:
        return null;
    }
  };

  // ---- Loading State ----
  if (isLoading) {
    return <CVWizardLoadingScreen onTimeout={() => {
      setLoadError('Das Laden dauerte zu lange. Bitte lade die Seite neu.');
      setIsLoading(false);
    }} />;
  }

  // ---- Error State ----
  if (loadError) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <p className="text-red-400">{loadError}</p>
          <button
            onClick={() => {
              setLoadError(null);
              handleGoToJobTargeting();
            }}
            className="px-6 py-3 bg-[#66c0b6] text-black rounded-xl hover:opacity-90 font-semibold"
          >
            Nochmal versuchen
          </button>
          <button
            onClick={() => navigate('/')}
            className="block w-full px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
          >
            Zurück zur Startseite
          </button>
        </div>
      </div>
    );
  }

  // ---- Motivation Screen ----
  if (showMotivation) {
    return (
      <MotivationScreen variant={motivationVariant} onContinue={handleMotivationContinue} />
    );
  }

  // ---- Entry Screen (Upload vs New) ----
  if (showEntryScreen) {
    return (
      <div className="min-h-screen w-full bg-[#020617] text-white flex flex-col">
        <div className="flex-1 flex flex-col justify-center py-8">
          <WizardEntryScreen
            userId={user?.id ?? null}
            wizardCvId={cvId}
            onUploadComplete={(imported) => {
              isInitialLoadRef.current = false;
              setShowEntryScreen(false);
              applyImportedData(imported);
            }}
            onCreateNew={() => {
              isInitialLoadRef.current = false;
              const emptyData: CVBuilderData = {
                personalData: {},
                workExperiences: [],
                professionalEducation: [],
                hardSkills: [],
                softSkills: [],
                languages: [],
                projects: [],
                workValues: { values: [], workStyle: [] },
                hobbies: { hobbies: [], details: '' },
              };
              setCVData(emptyData);
              saveProgress(emptyData);
              setShowEntryScreen(false);
              setCurrentStep(0);
            }}
          />
        </div>
      </div>
    );
  }

  // ---- Interstitials: Gate-Fragen / „Noch etwas?"-Cluster ----
  if (interstitial === 'work' || interstitial === 'edu') {
    const gate = interstitial === 'work' ? GATE_WORK_EXPERIENCE : GATE_FORMAL_EDUCATION;
    return <GateScreen gate={gate} onAnswer={handleGateAnswer} onBack={handleGateBack} />;
  }
  if (interstitial === 'extras') {
    return (
      <ExtrasClusterScreen
        initialSelected={deriveExtrasFromContent(cvData)}
        onConfirm={handleClusterConfirm}
        onBack={handleGateBack}
      />
    );
  }

  // ---- Main Wizard UI ----
  const completedSteps = new Set<number>();
  const stepCompletenessData = checkStepCompleteness(cvData, isBeginner);
  for (let i = 0; i < currentStep; i++) {
    if (stepCompletenessData[i]?.isComplete) {
      completedSteps.add(i);
    }
  }
  const REQUIRED_STEP_INDICES = new Set([1, 4, 9, 10]);
  const liveIncompleteSteps = dataWasImported
    ? new Set(stepCompletenessData
        .filter(s => REQUIRED_STEP_INDICES.has(s.stepIndex) && s.stepIndex < currentStep && !s.isComplete)
        .map(s => s.stepIndex))
    : incompleteStepsSet;

  const wizardStepsForLevel = isBeginner
    ? WIZARD_STEPS.map((s, i) => {
        if (i === 4) return { ...s, label: 'Praktika & Nebenjobs', shortLabel: 'Praktika' };
        if (i === 5) return { ...s, label: 'Projekte', shortLabel: 'Projekte' };
        if (i === 3) return { ...s, label: 'Ausbildung / Studium', shortLabel: 'Ausbildung' };
        return s;
      })
    : WIZARD_STEPS;

  const importBannerIncomplete = Array.from(liveIncompleteSteps)
    .filter(i => i !== currentStep)
    .map(i => wizardStepsForLevel[i]?.shortLabel || wizardStepsForLevel[i]?.label)
    .filter(Boolean);

  // Aktuell ausgeblendete Sektionen (für die „Immer nachtragbar"-Leiste)
  const hiddenSections = Object.values(STEP_SECTION).filter(
    (sec, idx, arr) => arr.indexOf(sec) === idx && isSectionSkipped(sec, cvData)
  );

  console.log('[CVWizard] Rendering Step', currentStep, 'with data:', cvData.personalData?.firstName, '| isLoading:', isLoading, '| isInitialLoad:', isInitialLoadRef.current);

  return (
    <div className="min-h-screen w-full bg-[#020617] text-white relative">
      {/* Auto-Save Indicator */}
      {isSaving && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/50">
          <Loader2 size={12} className="animate-spin" /> Speichere...
        </div>
      )}

      {/* Progress Indicator */}
      <div ref={progressBarRef} className="fixed top-0 left-0 right-0 z-40">
        <WizardProgressIndicator
          steps={wizardStepsForLevel}
          currentStep={currentStep}
          completedSteps={completedSteps}
          incompleteSteps={liveIncompleteSteps}
          onStepClick={(index) => {
            if (index !== currentStep) {
              goToIndex(index);
            }
          }}
        />
      </div>

      {/* Import Summary Banner */}
      {dataWasImported && importBannerIncomplete.length > 0 && (
        <div
          className="fixed z-30 left-0 right-0 flex items-center justify-center gap-2 px-4 py-1.5 bg-orange-500/10 border-b border-orange-500/20 text-xs text-orange-300/90"
          style={{ top: progressBarHeight }}
        >
          <AlertTriangle size={12} className="text-orange-400 flex-shrink-0" />
          <span>
            <span className="font-semibold text-orange-300">Noch ausstehend:</span>{' '}
            {importBannerIncomplete.join(' · ')}
          </span>
          <button
            onClick={() => setDataWasImported(false)}
            className="ml-auto text-orange-400/50 hover:text-orange-400 transition-colors"
          >
            <XIcon size={12} />
          </button>
        </div>
      )}
{/* Level-Switcher: jederzeit zwischen den Erfahrungsstufen wechseln */}
{currentStep > 0 && currentStep < 13 && (
  <div
    className="fixed z-30 right-4"
    style={{ top: progressBarHeight + (dataWasImported && importBannerIncomplete.length > 0 ? 40 : 8) }}
  >
    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#0a1220]/90 backdrop-blur border border-white/10 shadow-lg">
      {([
        { value: 'beginner',         label: 'Einsteiger'       },
        { value: 'some-experience',  label: 'Erste Erfahrung'  },
        { value: 'experienced',      label: 'Berufserfahren'   },
      ] as const).map((lvl) => {
        const isActive = cvData.experienceLevel === lvl.value;
        return (
          <button
            key={lvl.value}
            onClick={() => updateCVData('experienceLevel', lvl.value)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
              isActive
                ? 'bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black'
                : 'text-white/50 hover:text-white'
            }`}
          >
            {lvl.label}
          </button>
        );
      })}
    </div>
  </div>
)}
      {/* Step Content – padding-top matches actual progress bar height */}
      <div
        style={{ paddingTop: progressBarHeight + (dataWasImported && importBannerIncomplete.length > 0 ? 32 : 0) }}
        className="min-h-screen flex flex-col"
      >
        {/* „Immer nachtragbar"-Leiste: ausgeblendete Sektionen wieder einblenden */}
        {hiddenSections.length > 0 && currentStep > 0 && currentStep < 13 && (
          <div className="max-w-3xl mx-auto w-full px-4 pt-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-white/40">Ausgeblendet:</span>
              {hiddenSections.map((sec) => (
                <button
                  key={sec}
                  onClick={() => unhideSection(sec)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-[#66c0b6]/50 transition-colors"
                >
                  <Plus size={11} /> {SECTION_LABEL[sec] || sec}
                </button>
              ))}
            </div>
          </div>
        )}
        {renderStep()}
      </div>
    </div>
  );
}