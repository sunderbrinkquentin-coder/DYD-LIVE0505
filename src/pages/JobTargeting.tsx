// src/pages/JobTargeting.tsx

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Briefcase, Building2, Link2, FileText, Loader2, Zap, Layers, X, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarSidebar } from '../components/cvbuilder/AvatarSidebar';
import { CVBuilderData } from '../types/cvBuilder';
import { toWizardBaseCv } from '../utils/cvDataMapper';
import { checkCvData, type CvIssue } from '../utils/cvDataCheck';
import { sessionManager } from '../utils/sessionManager';
import { getOrCreateTempId } from '../utils/tempIdManager';
import { supabase } from '../lib/supabase';
import { tokenService } from '../services/tokenService';

export function JobTargeting() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateBaseCvData = location.state?.cvData as CVBuilderData | undefined;
  const stateCvId = location.state?.cvId as string | undefined;
  const urlCvId = new URLSearchParams(location.search).get('cvId') || undefined;
  const existingCvId = stateCvId || urlCvId;
  const existingTempId = location.state?.tempId as string | undefined;
  const fromDashboard = location.state?.fromDashboard === true;
  const isPaidFlow = location.state?.isPaidFlow === true;

  const [baseCvData, setBaseCvData] = useState<CVBuilderData | undefined>(stateBaseCvData);
  const [isLoadingCvData, setIsLoadingCvData] = useState(!stateBaseCvData && !!existingCvId);

  console.log('[JOB-TARGETING] Received state:', {
    hasCvId: !!existingCvId,
    hasCvData: !!baseCvData,
    cvDataKeys: Object.keys(baseCvData || {}),
  });

  useEffect(() => {
    if (stateBaseCvData) return;

    if (!existingCvId) {
      if (fromDashboard) {
        setIsLoadingCvData(false);
        return;
      }
      console.warn('[JOB-TARGETING] No CV data and no cvId – redirecting to cv-wizard');
      navigate('/cv-wizard', { replace: true });
      return;
    }

    const loadCvData = async () => {
      setIsLoadingCvData(true);
      try {
        const { data, error } = await supabase
          .from('stored_cvs')
          .select('cv_data')
          .eq('id', existingCvId)
          .maybeSingle();

        if (error || !data?.cv_data) {
          if (fromDashboard) {
            setIsLoadingCvData(false);
            return;
          }
          console.warn('[JOB-TARGETING] Could not load cv_data, redirecting to cv-wizard');
          navigate('/cv-wizard', { replace: true });
          return;
        }

        setBaseCvData(data.cv_data as CVBuilderData);
      } catch (err) {
        console.error('[JOB-TARGETING] Error loading cv_data:', err);
        if (!fromDashboard) {
          navigate('/cv-wizard', { replace: true });
        }
      } finally {
        setIsLoadingCvData(false);
      }
    };

    loadCvData();
  }, [stateBaseCvData, existingCvId, navigate, fromDashboard]);

  const [formData, setFormData] = useState({
    company: '',
    jobTitle: '',
    jobLink: '',
    jobDescription: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generalistMode, setGeneralistMode] = useState(false);
  // Stufe 0: Datenprüfung vor der KI (Überschneidungen, Lücken, Standard-Daten)
  const [dataIssues, setDataIssues] = useState<CvIssue[] | null>(null);
  const [issuesAcknowledged, setIssuesAcknowledged] = useState(false);

  // ---------- Helper: Deep sanitize ----------
  const deepSanitize = (obj: any, depth = 0): any => {
    if (depth > 50) return null;

    if (obj === null || obj === undefined) return null;
    if (typeof obj === 'boolean') return obj;
    if (typeof obj === 'number') return isFinite(obj) ? obj : null;

    if (typeof obj === 'string') {
      return obj
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '')
        .replace(/[\u2000-\u200F\u2028-\u202F]/g, ' ')
        .replace(/[\uFEFF\uFFFE\uFFFF]/g, '');
    }

    if (obj instanceof Date) return obj.toISOString();

    if (Array.isArray(obj)) {
      return obj
        .map((item) => deepSanitize(item, depth + 1))
        .filter((item) => item !== null && item !== undefined);
    }

    if (typeof obj === 'object') {
      const result: any = {};
      for (const key of Object.keys(obj)) {
        const value = deepSanitize((obj as any)[key], depth + 1);
        if (value !== null && value !== undefined) {
          const cleanKey =
            typeof key === 'string' ? key.replace(/[^\w\s\-_.]/g, '') : key;
          result[cleanKey] = value;
        }
      }
      return result;
    }

    return null;
  };

  const handleClickNext = async () => {
    setError(null);

    if (!generalistMode && (!formData.company || !formData.jobTitle || !formData.jobDescription)) {
      setError('Bitte fülle Unternehmen, Jobtitel und Stellenbeschreibung aus – oder aktiviere den Generalist-Modus.');
      return;
    }

    // Stufe 0: Widersprüche in den Daten VOR der KI klären – die KI darf sie
    // nicht "wegformulieren", sonst entstehen erfundene Angaben.
    if (!issuesAcknowledged && baseCvData) {
      const issues = checkCvData(toWizardBaseCv(baseCvData) ?? baseCvData);
      if (issues.some((i) => i.severity === 'warning')) {
        setDataIssues(issues);
        return;
      }
    }

    await handleSubmit();
  };

  const handleOptimizeAnyway = async () => {
    setIssuesAcknowledged(true);
    setDataIssues(null);
    await handleSubmit();
  };

  const handleFixData = () => {
    navigate(existingCvId ? `/cv-wizard?cvId=${existingCvId}` : '/cv-wizard');
  };

  const handleSubmit = async () => {
    if (!generalistMode && (!formData.company || !formData.jobTitle || !formData.jobDescription)) return;

    const resolvedBaseCvData: CVBuilderData = baseCvData ?? {
      workExperiences: [],
      projects: [],
      hardSkills: [],
      softSkills: [],
      schoolEducation: [],
      professionalEducation: [],
      internships: [],
      hobbies: [],
      workValues: [],
      stipendien: [],
      volunteerWork: [],
      certificates: [],
      languages: [],
      summary: '',
    } as unknown as CVBuilderData;

    setIsSaving(true);

    try {
      console.log('🟦 [JOB-TARGETING] Start submission');

      // 1) Session & User sicher holen
      let sessionId: string | null = null;
      try {
        sessionId = sessionManager.getSessionId();
        console.log('🟦 [JOB-TARGETING] Session ID:', sessionId || 'anonymous');
      } catch (e) {
        console.warn('🟨 [JOB-TARGETING] Could not get session ID:', e);
      }

      let currentUserId: string | null = null;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        currentUserId = user?.id || null;
        console.log('🟦 [JOB-TARGETING] User ID:', currentUserId || 'anonymous');
      } catch (e) {
        console.warn('🟨 [JOB-TARGETING] Could not get user ID:', e);
      }

      // 2) Job-Daten
      const sanitizedJobData = generalistMode
        ? {
            company: 'Generalist-Modus',
            job_title: 'Transferable Skills & Kompetenzprofil',
            job_link: null,
            job_description: 'Optimiere den Lebenslauf auf ein starkes, allgemeines Kompetenzprofil. Betone Transferable Skills, universelle Stärken und branchenübergreifende Qualifikationen. Kein spezifisches Keyword-Matching – stattdessen ein klares, professionelles Gesamtbild.',
          }
        : {
            company: deepSanitize(formData.company),
            job_title: deepSanitize(formData.jobTitle),
            job_link: deepSanitize(formData.jobLink) || null,
            job_description: deepSanitize(formData.jobDescription),
          };

      // 3) CV-Daten übernehmen – ALLE Wizard-Felder im aktuellsten Stand.
      //    toWizardBaseCv: Änderungen aus dem Live-Editor (sections) haben Vorrang
      //    vor veralteten Wizard-Feldern, Editor-only-Felder werden entfernt
      //    (sonst würde der Editor die neu optimierten Bullets ignorieren).
      const baseData: any = toWizardBaseCv(resolvedBaseCvData) ?? resolvedBaseCvData;

      // Technische Felder aus früheren Optimierungsläufen nicht weitertragen
      const { _optimization, desired_job: _previousDesiredJob, ...wizardFields } = baseData;

      const cvDataPayload: any = deepSanitize({
        // a) ALLE Felder übernehmen (preferences, flags, künftige Wizard-Felder …)
        ...wizardFields,

        // b) Kernfelder mit sicheren Defaults (nie undefined → nie leere Sektionen durch Lücken)
        experienceLevel: baseData.experienceLevel,
        targetRole: baseData.targetRole,
        targetIndustry: baseData.targetIndustry,
        personalData: baseData.personalData ?? {},
        workExperiences: baseData.workExperiences ?? [],
        internships: baseData.internships ?? [],
        projects: baseData.projects ?? [],
        schoolEducation: baseData.schoolEducation ?? [],
        professionalEducation: baseData.professionalEducation ?? [],
        hardSkills: baseData.hardSkills ?? [],
        softSkills: baseData.softSkills ?? [],
        languages: baseData.languages ?? [],
        certificates: baseData.certificates ?? [],
        stipendien: baseData.stipendien ?? [],
        volunteerWork: baseData.volunteerWork ?? [],
        hobbies: baseData.hobbies,
        workValues: baseData.workValues,
        jobTarget: baseData.jobTarget,
        targetJob: baseData.targetJob,
        preferences: baseData.preferences,
        flags: baseData.flags,
        summary: baseData.summary,

        // c) Zielstelle für die Optimierung
        desired_job: sanitizedJobData,
      });

      // 4) Log & Speicherung in Supabase
      console.log('🟦 [JOB-TARGETING] CV payload field counts:', {
        workExperiences: cvDataPayload.workExperiences?.length ?? 0,
        schoolEducation: cvDataPayload.schoolEducation?.length ?? 0,
        professionalEducation: cvDataPayload.professionalEducation?.length ?? 0,
        hardSkills: cvDataPayload.hardSkills?.length ?? 0,
        softSkills: cvDataPayload.softSkills?.length ?? 0,
        projects: cvDataPayload.projects?.length ?? 0,
        internships: cvDataPayload.internships?.length ?? 0,
        languages: cvDataPayload.languages?.length ?? 0,
        scholarships: cvDataPayload.scholarships?.length ?? 0,
        awards: cvDataPayload.awards?.length ?? 0,
        volunteerWork: cvDataPayload.volunteerWork?.length ?? 0,
        certificates: cvDataPayload.certificates?.length ?? 0,
      });
      console.log('🟦 [JOB-TARGETING] Saving to Supabase (status=processing)...');

      const tempId = existingTempId || getOrCreateTempId();

      const jobData = {
        company: formData.company,
        jobTitle: formData.jobTitle,
        jobLink: formData.jobLink,
        jobDescription: formData.jobDescription,
      };

      if (isPaidFlow && currentUserId) {
        const consumed = await tokenService.consumeToken(currentUserId);
        if (!consumed) {
          // Weiterleitung zur echten Paywall
          setIsSaving(false);
          navigate('/checkout'); 
          return;
        }
        console.log('✅ [JOB-TARGETING] Token consumed for paid flow');
      }

      // 5) Jede Optimierung bekommt ihren EIGENEN Eintrag.
      //    Der Basis-CV (z. B. der letzte Lebenslauf bei der One-Click-Optimierung)
      //    bleibt unverändert als Grundlage erhalten. Einzige Ausnahme: ein frischer,
      //    noch nie optimierter Wizard-Entwurf (status 'draft') wird direkt verwendet,
      //    damit nach dem Wizard kein leerer Doppel-Eintrag im Dashboard entsteht.
      let cvId: string;
      const isPaidRecord = isPaidFlow;
      let reuseDraftRecord = false;

      if (existingCvId) {
        const { data: existingRow } = await supabase
          .from('stored_cvs')
          .select('status, cv_data')
          .eq('id', existingCvId)
          .maybeSingle();

        let existingCv: any = existingRow?.cv_data;
        if (typeof existingCv === 'string') {
          try { existingCv = JSON.parse(existingCv); } catch { existingCv = null; }
        }

        const wasOptimized = !!existingCv?._optimization || !!existingCv?.desired_job;
        reuseDraftRecord =
          !!existingRow &&
          (existingRow.status === 'draft' || !existingRow.status) &&
          !wasOptimized;
      }

      console.log(
        reuseDraftRecord
          ? '🟦 [JOB-TARGETING] Frischer Wizard-Entwurf → wird für die Optimierung verwendet'
          : '🟦 [JOB-TARGETING] Neuer Eintrag für diese Optimierung, Basis bleibt erhalten:',
        existingCvId ?? 'keine Basis',
      );

      const recordFields = {
        user_id: currentUserId,
        session_id: sessionId,
        temp_id: tempId,
        cv_data: cvDataPayload,
        // baseCvId: von welchem Lebenslauf diese Optimierung ausging (Nachvollziehbarkeit)
        job_data: { ...jobData, baseCvId: existingCvId ?? null },
        source: fromDashboard ? 'dashboard_optimize' : 'wizard',
        is_paid: isPaidRecord,
        download_unlocked: isPaidRecord,
        status: 'processing',
      };

      if (reuseDraftRecord && existingCvId) {
        const { error: updateError } = await supabase
          .from('stored_cvs')
          .update({ ...recordFields, updated_at: new Date().toISOString() })
          .eq('id', existingCvId);

        if (updateError) {
          console.error('❌ [JOB-TARGETING] Update error:', updateError);
          throw new Error(updateError.message || 'Failed to update CV');
        }

        cvId = existingCvId;
        console.log('✅ [JOB-TARGETING] Entwurf auf status=processing gesetzt, cvId:', cvId);
      } else {
        const { data: insertedCv, error: insertError } = await supabase
          .from('stored_cvs')
          .insert(recordFields)
          .select('id')
          .single();

        if (insertError || !insertedCv) {
          console.error('❌ [JOB-TARGETING] Insert error:', insertError);
          throw new Error(insertError?.message || 'Failed to create CV record');
        }

        cvId = insertedCv.id;
        console.log('✅ [JOB-TARGETING] Neuer Eintrag mit status=processing, cvId:', cvId);
      }

      // 6) Trigger CV Generator via Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const callbackUrl = `${supabaseUrl}/functions/v1/make-cv-callback`;

      const payload = {
        cv_id: cvId,
        session_id: sessionId,
        user_id: currentUserId,
        callback_url: callbackUrl,
        cv_draft: cvDataPayload,
        job_data: sanitizedJobData,
      };

      // Kein kompletter CV in der Browser-Konsole (enthält Kontaktdaten)
      console.log('[CV-GENERATOR] 📤 Starte Optimierung für cvId:', cvId);

      const { data: invokeData, error: invokeError } = await supabase.functions.invoke(
        'trigger-cv-generator',
        { body: payload }
      );

      // make_status heißt aus Kompatibilitätsgründen weiter so (Supabase-Engine liefert 202)
      const engineStatus = invokeData?.make_status ?? 0;
      const jobAccepted = !invokeError && (engineStatus === 200 || engineStatus === 201 || engineStatus === 202);

      if (!jobAccepted) {
        console.error('[CV-GENERATOR] ❌ Optimierung nicht gestartet:', invokeError, engineStatus, invokeData);
        await supabase
          .from('stored_cvs')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', cvId);
        throw new Error(
          invokeError
            ? 'Der Optimierungsprozess konnte nicht gestartet werden. Bitte versuche es erneut.'
            : `Die Optimierung konnte nicht gestartet werden (Status ${engineStatus}). Bitte versuche es erneut.`
        );
      }

      console.log('[CV-GENERATOR] ✅ Optimierung gestartet:', engineStatus, invokeData?.engine);
      console.log('🟩 [JOB-TARGETING] Navigate to CV Editor');
      navigate(`/cv/${cvId}`);
    } catch (err) {
      console.error('❌ [JOB-TARGETING] Unexpected error:', err);
      const msg =
        err instanceof Error
          ? err.message
          : 'Ein technischer Fehler ist aufgetreten. Bitte versuche es erneut.';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingCvData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#66c0b6] animate-spin" />
          <p className="text-white/70 font-medium">Dein CV wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
          <div className="flex-1 space-y-8 animate-fade-in">
            {fromDashboard && (
              <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#66c0b6]/15 to-[#30E3CA]/10 border border-[#66c0b6]/30">
                <Zap size={18} className="text-[#66c0b6] flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">Deine CV-Daten wurden automatisch geladen</p>
                  <p className="text-xs text-white/60">Trage nur noch die Wunschstelle ein – wir erledigen den Rest.</p>
                </div>
              </div>
            )}

            <div className="text-center space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-[#66c0b6] to-white bg-clip-text text-transparent">
                Deine Wunschstelle
              </h1>
              <p className="text-xl text-white/70 max-w-2xl mx-auto">
                Gib die Details zu deiner Wunschstelle ein. Wir passen deinen CV optimal darauf an.
              </p>
            </div>

            {/* Generalist-Mode Toggle */}
            <motion.div
              className={`flex items-start gap-4 px-5 py-4 rounded-2xl border cursor-pointer transition-all ${
                generalistMode
                  ? 'border-[#66c0b6]/50 bg-[#66c0b6]/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
              onClick={() => setGeneralistMode(v => !v)}
              whileTap={{ scale: 0.99 }}
            >
              <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                generalistMode ? 'bg-[#66c0b6]/25 text-[#66c0b6]' : 'bg-white/8 text-white/50'
              }`}>
                <Layers size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={`font-semibold text-sm transition-colors ${generalistMode ? 'text-[#66c0b6]' : 'text-white/80'}`}>
                    Generalist-Modus aktivieren
                  </p>
                  {generalistMode && (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="px-2 py-0.5 rounded-full bg-[#66c0b6] text-black text-[10px] font-bold uppercase tracking-wider"
                    >
                      Aktiv
                    </motion.span>
                  )}
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  Kein konkretes Ziel? Wir optimieren deinen CV auf Transferable Skills und ein starkes allgemeines Kompetenzprofil — statt auf ein spezifisches Keyword-Matching.
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                generalistMode ? 'border-[#66c0b6] bg-[#66c0b6]' : 'border-white/20'
              }`}>
                {generalistMode && <X size={10} className="text-black" style={{ transform: 'rotate(45deg)' }} />}
              </div>
            </motion.div>

            <AnimatePresence>
              {generalistMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl bg-[#66c0b6]/8 border border-[#66c0b6]/25 px-5 py-4 space-y-2"
                >
                  <p className="text-sm font-semibold text-[#66c0b6]">Generalist-Modus ist aktiv</p>
                  <ul className="text-xs text-white/60 space-y-1 list-disc list-inside">
                    <li>KI optimiert auf universelle, branchenübergreifende Stärken</li>
                    <li>Transferable Skills wie Leadership, Kommunikation, Analytik werden priorisiert</li>
                    <li>Kein Keyword-Matching – stattdessen ein klares Kompetenzprofil</li>
                    <li>Ideal wenn du offen für verschiedene Rollen oder Branchen bist</li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 space-y-8 transition-all ${
              generalistMode ? 'opacity-40 pointer-events-none select-none' : ''
            }`}>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-lg font-semibold text-white/90">
                  <Building2 size={20} className="text-[#66c0b6]" />
                  Unternehmen *
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="z.B. Google, BMW, Siemens..."
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:border-[#66c0b6] focus:ring-2 focus:ring-[#66c0b6]/20"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-lg font-semibold text-white/90">
                  <Briefcase size={20} className="text-[#66c0b6]" />
                  Jobtitel *
                </label>
                <input
                  type="text"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  placeholder="z.B. Software Engineer, Marketing Manager..."
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:border-[#66c0b6] focus:ring-2 focus:ring-[#66c0b6]/20"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-lg font-semibold text-white/90">
                  <Link2 size={20} className="text-[#66c0b6]" />
                  Link zur Stellenanzeige (optional)
                </label>
                <input
                  type="url"
                  value={formData.jobLink}
                  onChange={(e) => setFormData({ ...formData, jobLink: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:border-[#66c0b6] focus:ring-2 focus:ring-[#66c0b6]/20"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-lg font-semibold text-white/90">
                  <FileText size={20} className="text-[#66c0b6]" />
                  Stellenbeschreibung *
                </label>
                <p className="text-sm text-white/60">
                  Kopiere die Stellenanzeige hier hinein. Je vollständiger, desto besser können wir deinen CV anpassen.
                </p>
                <textarea
                  value={formData.jobDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, jobDescription: e.target.value })
                  }
                  placeholder="Füge hier die komplette Stellenbeschreibung ein..."
                  rows={12}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:border-[#66c0b6] focus:ring-2 focus:ring-[#66c0b6]/20 resize-none font-mono text-sm"
                />
                <p className="text-xs text-white/40">
                  💡 Tipp: Je detaillierter die Stellenbeschreibung, desto präziser die Optimierung
                </p>
              </div>

            </div>

            {/* Stufe 0: Datenprüfung – erscheint nur bei echten Widersprüchen */}
            <AnimatePresence>
              {dataIssues && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="rounded-2xl border border-amber-400/40 bg-amber-400/10 px-5 py-5 space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-amber-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">Bitte prüfe kurz deine Daten</p>
                      <p className="text-sm text-white/60">
                        Recruiter achten genau auf diese Punkte. Wir erfinden nichts – korrigiere sie am besten, bevor wir optimieren.
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {dataIssues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                        {issue.severity === 'warning'
                          ? <AlertTriangle size={14} className="text-amber-300 flex-shrink-0 mt-0.5" />
                          : <Info size={14} className="text-[#66c0b6] flex-shrink-0 mt-0.5" />}
                        <span>{issue.message}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <button
                      onClick={handleFixData}
                      className="flex-1 px-5 py-3 rounded-xl bg-white text-black font-semibold hover:opacity-90 transition-all"
                    >
                      Daten korrigieren
                    </button>
                    <button
                      onClick={handleOptimizeAnyway}
                      disabled={isSaving}
                      className="flex-1 px-5 py-3 rounded-xl border border-white/20 text-white/80 font-semibold hover:bg-white/5 transition-all disabled:opacity-50"
                    >
                      Trotzdem optimieren
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA — außerhalb der gedimmten Form, immer klickbar */}
            <div className="flex flex-col items-center gap-4 pt-2">
              {error && (
                <div className="w-full px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-center text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={handleClickNext}
                disabled={isSaving}
                className="group px-16 py-6 rounded-3xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold text-2xl hover:opacity-90 transition-all flex items-center gap-4 shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={32} className="animate-spin" />
                    KI wird gestartet...
                  </>
                ) : (
                  <>
                    CV jetzt optimieren
                    <ArrowRight size={32} className="group-hover:translate-x-2 transition-transform" />
                  </>
                )}
              </button>

              {!generalistMode && (
                <p className="text-center text-sm text-white/40">* Felder ohne Wunschstelle: Generalist-Modus aktivieren</p>
              )}
            </div>
          </div>

          <div className="lg:block hidden">
            <AvatarSidebar
              message="Jetzt fehlt nur noch deine Wunschstelle. Wir nutzen gleich deinen fertigen CV und passen ihn genau auf diese Position an."
              stepInfo="Je präziser du die Stellenbeschreibung angibst, desto besser das Ergebnis."
            />
          </div>
        </div>
      </div>
    </div>
  );
}