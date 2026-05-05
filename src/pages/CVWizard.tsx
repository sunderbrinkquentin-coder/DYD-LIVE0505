// src/pages/CVWizard.tsx

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowRight, ArrowLeft, Check, Loader2, AlertTriangle, X as XIcon } from 'lucide-react';

function CVWizardLoadingScreen() {
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowHint(true), 5000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <Loader2 className="w-12 h-12 text-[#66c0b6] animate-spin" />
        <p className="text-white/70 font-medium">Dein Profil wird vorbereitet...</p>
        {showHint && (
          <p className="text-white/40 text-sm max-w-xs mt-2">
            Das dauert ungewohnlich lang. Bitte drucke <strong className="text-white/60">STRG + F5</strong> um die Seite neu zu laden und starte den Prozess nochmal.
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

import { CVBuilderData } from '../types/cvBuilder';
import { mapEditorDataToWizard } from '../utils/cvDataMapper';
import { checkStepCompleteness, getIncompleteRequiredSteps } from '../utils/wizardCompleteness';

import { useAuth } from '../contexts/AuthContext';
import { sessionManager } from '../utils/sessionManager';
import { getOrCreateTempId, clearTempId } from '../utils/tempIdManager';

function adaptParsedCvToBuilderData(parsed: any): CVBuilderData {
  if (!parsed || typeof parsed !== 'object') return {};

  const raw = parsed?.editor_data || parsed;
  console.log('[Mapper] Processing source keys:', Object.keys(raw));

  // If data is already in CVBuilderData format (wizard draft), return as-is with defaults
  if (raw.personalData != null || raw.workExperiences != null || raw.experienceLevel != null) {
    console.log('[CVWizard] Data is already in CVBuilderData format, using as-is');
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
      projects: raw.projects || [],
      hardSkills: raw.hardSkills || [],
      softSkills: raw.softSkills || [],
      professionalEducation: raw.professionalEducation || [],
      languages: raw.languages || [],
      workValues: raw.workValues || { values: [], workStyle: [] },
      hobbies: raw.hobbies || { hobbies: [], details: '' },
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
    professionalEducation: [],
    hardSkills: [],
    softSkills: [],
    languages: [],
    projects: [],
    workValues: { values: [], workStyle: [] },
    hobbies: { hobbies: [], details: '' }
  } as CVBuilderData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showMotivation, setShowMotivation] = useState(false);
  const [motivationVariant, setMotivationVariant] = useState<1 | 2 | 3>(1);

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

              const withWizardData = existingCvs.find(cv => {
                const d = deepParseCvData(cv.cv_data);
                return hasRealWizardData(d);
              });

              const withCheckData = existingCvs.find(cv => {
                const d = deepParseCvData(cv.cv_data);
                return hasRealCheckData(d);
              });

              const withEditorData = existingCvs.find(cv => {
                const d = deepParseCvData(cv.cv_data);
                return isNonEmpty(d) && (d?.contact || d?.experience || d?.experiences);
              });

              const best = withWizardData || withCheckData || withEditorData;

              if (best?.cv_data) {
                const effectiveData = deepParseCvData(best.cv_data);
                prefillMapped = adaptParsedCvToBuilderData(effectiveData);
                prefillCvData = prefillMapped;
                console.log('[CVWizard] Pre-filling from existing user CV data, source:', best.source, 'firstName:', prefillMapped?.personalData?.firstName, 'workExp:', prefillMapped?.workExperiences?.length ?? 0);
              }
            }
          } catch (prefillErr) {
            console.warn('[CVWizard] Could not load prefill data:', prefillErr);
          }
        }

        try {
          const { data: newRecord, error: insertError } = await supabase
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

          if (insertError || !newRecord) {
            console.error('[CVWizard] Failed to create draft record:', insertError);
            isInitialLoadRef.current = false;
          } else {
            console.log('[CVWizard] Created new draft record with cvId:', newRecord.id);
            setCvId(newRecord.id);
            navigate(`/cv-wizard?cvId=${newRecord.id}`, { replace: true });

            if (importFromId) {
              // Coming from CV-Check: always skip entry screen and start at step 1
              console.log('[CVWizard] importFrom: skipping entry screen, starting at step 1, firstName:', prefillMapped?.personalData?.firstName);
              setTimeout(() => {
                if (prefillMapped) setCVData({ ...prefillMapped });
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
          setIsHydrated(true);
          isInitialLoadRef.current = false;
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        console.log('[CVWizard] Loading CV data for cvId:', cvId);

        const { data, error } = await supabase
          .from('stored_cvs')
          .select('cv_data, status, source')
          .eq('id', cvId)
          .single();

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
              setCVData({ ...baseData });
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

  // ---- Navigation Logic ----
  const nextStep = () => {
    if ((currentStep + 1) % 3 === 0 && currentStep > 0 && currentStep < 10) {
      setMotivationVariant((((currentStep + 1) / 3) % 3 + 1) as 1 | 2 | 3);
      setShowMotivation(true);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMotivationContinue = () => {
    setShowMotivation(false);
    setCurrentStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [isNavigating, setIsNavigating] = useState(false);
  const [dataWasImported, setDataWasImported] = useState(false);
  const [incompleteStepsSet, setIncompleteStepsSet] = useState<Set<number>>(new Set());

  const applyImportedData = (imported: CVBuilderData) => {
    const merged = { ...cvData, ...imported };
    setCVData(merged);
    saveProgress(merged);
    const isBeginner = merged.experienceLevel === 'beginner';
    const incompleteMandatory = getIncompleteRequiredSteps(merged, isBeginner);
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
    };

    try {
      await supabase
        .from('stored_cvs')
        .update({
          cv_data: finalData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', resolvedCvId);
    } catch (saveErr) {
      console.warn('[CVWizard] Final save before navigation failed:', saveErr);
    }

    console.log('[CVWizard] Navigating to job-targeting with cvId:', resolvedCvId);
    navigate(`/job-targeting?cvId=${resolvedCvId}`, {
      state: { cvId: resolvedCvId, cvData: finalData, tempId },
    });
    setIsNavigating(false);
  };

  // ---- Step Configuration ----
  const totalSteps = 11;
  const isBeginner = cvData.experienceLevel === 'beginner';

  const getStepInfo = (step: number) => {
    if (isBeginner) {
      const steps = [
        { title: 'Erfahrungslevel', message: 'Lass uns deinen Start bestimmen' },
        { title: 'Persönliche Daten', message: 'Erzähl uns ein bisschen über dich' },
        { title: 'Schulbildung', message: 'Welche Schule besuchst du / hast du besucht?' },
        { title: 'Ausbildung / Studium', message: 'Machst du eine Ausbildung oder studierst du?' },
        { title: 'Praktika & Nebenjobs', message: 'Hast du erste praktische Erfahrungen gesammelt?' },
        { title: 'Projekte', message: 'Zeig, was du außerhalb der Schule geleistet hast' },
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
          <HardSkillsStep
            skills={cvData.hardSkills || []}
            languages={cvData.languages || []}
            onSkillsChange={(skills) => updateCVData('hardSkills', skills)}
            onLanguagesChange={(languages) => updateCVData('languages', languages)}
            onNext={nextStep}
            onBack={prevStep}
          />
        );

      case 7:
        return (
          <SoftSkillsStep
            data={cvData.softSkills || []}
            onChange={(data) => updateCVData('softSkills', data)}
            onNext={nextStep}
            onBack={prevStep}
          />
        );

      case 8:
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

      case 9:
        return (
          <HobbiesStep
            data={cvData.hobbies || { hobbies: [], details: '' }}
            onChange={(data) => updateCVData('hobbies', data)}
            onNext={nextStep}
            onBack={prevStep}
          />
        );

      case 10:
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
    return <CVWizardLoadingScreen />;
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

  // ---- Main Wizard UI ----
  const completedSteps = new Set<number>();
  const stepCompletenessData = checkStepCompleteness(cvData, isBeginner);
  for (let i = 0; i < currentStep; i++) {
    if (stepCompletenessData[i]?.isComplete) {
      completedSteps.add(i);
    }
  }
  const REQUIRED_STEP_INDICES = new Set([1, 4, 6, 7]);
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
              setCurrentStep(index);
              window.scrollTo({ top: 0, behavior: 'smooth' });
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

      {/* Step Content – padding-top matches actual progress bar height */}
      <div
        style={{ paddingTop: progressBarHeight + (dataWasImported && importBannerIncomplete.length > 0 ? 32 : 0) }}
        className="min-h-screen flex flex-col"
      >
        {renderStep()}
      </div>
    </div>
  );
}
