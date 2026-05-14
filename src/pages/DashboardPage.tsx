// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Briefcase, LogOut, ClipboardCheck, Coins, CheckCircle, Target, Lock, ExternalLink, Calendar, TrendingUp, FileSearch, ChevronDown, ChevronUp, Download, FileText, X, Zap, ArrowRight, Settings, CreditCard as Edit2, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cvStorageService } from '../services/cvStorageService';
import { tokenService } from '../services/tokenService';
import { careerService } from '../services/careerService';

import { OptimizeJobModal } from '../components/dashboard/OptimizeJobModal';
import { CreateCVChoiceModal } from '../components/dashboard/CreateCVChoiceModal';
import { CVAdjustmentModal } from '../components/dashboard/CVAdjustmentModal';
import { TokenPaywallModal } from '../components/dashboard/TokenPaywallModal';
import { KanbanBoard } from '../components/dashboard/KanbanBoard';
import { WizardCVOverview } from '../components/dashboard/WizardCVOverview';
import { CareerVisionCard } from '../components/career/CareerVisionCard';
import { HarmonyTicketsSection } from '../components/dashboard/HarmonyTicketsSection';
import { AccountSettingsModal } from '../components/dashboard/AccountSettingsModal';
import { AtsResultDisplay } from '../components/AtsResultDisplay';
import { parseAtsJson } from '../types/ats';
import { useAuth } from '../contexts/AuthContext';
import { LearningPath } from '../types/learningPath';
import { mapEditorDataToWizard } from '../utils/cvDataMapper';

export function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { logout, profile } = useAuth();

  const [userCVs, setUserCVs] = useState<any[]>([]);
  const [cvChecks, setCvChecks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCVForOptimize, setSelectedCVForOptimize] = useState<any | null>(null);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallDefaultPlan, setPaywallDefaultPlan] = useState<'single' | 'bundle-5' | 'bundle-10' | undefined>(undefined);
  const [userTokens, setUserTokens] = useState<number>(0);
  const [optimizedJobData, setOptimizedJobData] = useState<any>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showTicketSuccess, setShowTicketSuccess] = useState(false);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [lpResults, setLpResults] = useState<Record<string, boolean>>({}); // pathId → has completed learning_results
  const [userFirstName, setUserFirstName] = useState<string>('');
  const [festivalTickets, setFestivalTickets] = useState<any[]>([]);
  const [isCvChecksExpanded, setIsCvChecksExpanded] = useState(false);
  const [isFinishedCvsExpanded, setIsFinishedCvsExpanded] = useState(false);
  const [newCvPopup, setNewCvPopup] = useState<{ jobTitle: string; company: string } | null>(null);
  const [existingCvDataForQuick, setExistingCvDataForQuick] = useState<any>(null);
  const [existingWizardCvId, setExistingWizardCvId] = useState<string | null>(null);
  const [paywallFromCreateCv, setPaywallFromCreateCv] = useState(false);
  const [showCreateCVChoice, setShowCreateCVChoice] = useState(false);
  const [showWizardOverview, setShowWizardOverview] = useState(false);
  const [showOptimizeTip, setShowOptimizeTip] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [highlightedCvId, setHighlightedCvId] = useState<string | null>(null);
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);
  const [showNewCvCheckBanner, setShowNewCvCheckBanner] = useState(false);
  const [newCvUnlockId, setNewCvUnlockId] = useState<string | null>(null);


  // ---------- Ladefunktionen ----------


  async function loadCVs() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setUserCVs([]);
        return;
      }

      console.log('[Dashboard] Loading CVs from stored_cvs for user:', user.id);

      const { data, error } = await supabase
        .from('stored_cvs')
        .select(
          'id, cv_data, job_data, updated_at, status, source, is_paid, download_unlocked, file_name, pdf_url, created_at, download_count, ats_json, contact_person, application_deadline'
        )
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Dashboard] Error loading CVs:', error);
        setUserCVs([]);
        return;
      }

      console.log('[Dashboard] Loaded', data?.length || 0, 'CVs');
      console.log(
        '[Dashboard] CVs with download_unlocked:',
        data?.filter((cv) => cv.download_unlocked).length || 0
      );
      setUserCVs(data || []);
    } catch (error) {
      console.error('[Dashboard] Error loading CVs:', error);
      setUserCVs([]);
    }
  }

  async function loadCvChecks() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log(
        '[Dashboard] Loading CV checks - User:',
        user?.id,
        'Session:',
        session?.user?.id
      );

      let query = supabase
        .from('stored_cvs')
        .select('id, created_at, status, file_name, ats_json, error_message, is_paid')
        .eq('user_id', user?.id)
        .eq('source', 'check')
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) {
        console.error('[Dashboard] Error loading CV checks:', error);
        return;
      }

      console.log('[Dashboard] cvChecks loaded:', data?.length || 0, 'checks');

      const mappedData = (data || []).map((check) => ({
        ...check,
        analysis_status: check.status,
      }));

      setCvChecks(mappedData);
    } catch (error) {
      console.error('[Dashboard] Error loading CV checks:', error);
    }
  }

  async function loadUserTokens() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const tokens = await tokenService.getUserTokens(user.id);
      setUserTokens(tokens?.credits || 0);
    } catch (error) {
      console.error('Error loading user tokens:', error);
    }
  }

  async function loadUserProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[Dashboard] Error loading profile:', error);
        return;
      }

      if (profile?.full_name) {
        const firstName = profile.full_name.split(' ')[0];
        setUserFirstName(firstName);
      }
    } catch (error) {
      console.error('[Dashboard] Error loading user profile:', error);
    }
  }

  async function loadFestivalTickets() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: byUserId } = await supabase
        .from('festival_ticket_sales')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data: byEmail } = await supabase
        .from('festival_ticket_sales')
        .select('*')
        .eq('buyer_email', user.email)
        .is('user_id', null)
        .order('created_at', { ascending: false });

      if (byEmail && byEmail.length > 0) {
        const ids = byEmail.map((t: any) => t.id);
        await supabase
          .from('festival_ticket_sales')
          .update({ user_id: user.id })
          .in('id', ids);
        byEmail.forEach((t: any) => { t.user_id = user.id; });
      }

      const combined = [...(byUserId || []), ...(byEmail || [])];
      const seen = new Set<string>();
      const unique = combined.filter((t: any) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
      unique.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      if (unique.length === 0) {
        const storedSessionId = localStorage.getItem('harmony_festival_session_id');
        if (storedSessionId) {
          try {
            const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
            const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
            const res = await fetch(`${SUPABASE_URL}/functions/v1/confirm-festival-ticket`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
              body: JSON.stringify({ session_id: storedSessionId, user_id: user.id }),
            });
            if (res.ok) {
              const json = await res.json();
              if (json.ticket) {
                setFestivalTickets([json.ticket]);
                localStorage.removeItem('harmony_festival_session_id');
                return;
              }
            }
          } catch {
            // fallback failed silently
          }
        }
      }

      setFestivalTickets(unique);
    } catch (err) {
      console.error('[Dashboard] Error loading festival tickets:', err);
    }
  }

  async function loadLearningPaths() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLearningPaths([]);
        return;
      }

      console.log('[Dashboard] Loading learning paths for user:', user.id);

      const paths = await careerService.getUserLearningPaths(user.id);
      console.log('[Dashboard] Loaded', paths.length, 'learning paths');
      setLearningPaths(paths);

      // Check which paths have completed learning_results (one-click start available)
      if (paths.length > 0) {
        const ids = paths.filter(p => p.is_paid).map(p => p.id);
        if (ids.length > 0) {
          const { data: results } = await supabase
            .from('learning_results')
            .select('id, status')
            .in('id', ids);
          const map: Record<string, boolean> = {};
          (results ?? []).forEach((r: any) => {
            map[r.id] = r.status === 'completed';
          });
          setLpResults(map);
        }
      }
    } catch (error) {
      console.error('[Dashboard] Error loading learning paths:', error);
      setLearningPaths([]);
    }
  }

  // ---------- Effects ----------

  useEffect(() => {
    setIsLoading(true);
    (async () => {
      await loadCVs();
      await loadCvChecks();
      await loadUserTokens();
      await loadUserProfile();
      await loadLearningPaths();
      await loadFestivalTickets();
      setIsLoading(false);
    })();

    // Prüfe ob Paywall nach Login angezeigt werden soll
    const actionParam = searchParams.get('action');
    const cvIdParam = searchParams.get('cvId');

    if (actionParam === 'buy-tokens') {
      const planParam = searchParams.get('plan') as 'single' | 'bundle-5' | 'bundle-10' | null;
      if (planParam && ['single', 'bundle-5', 'bundle-10'].includes(planParam)) {
        setPaywallDefaultPlan(planParam);
      }
      setShowPaywall(true);
      setSearchParams({});
    } else if (actionParam === 'cv-unlock' && cvIdParam) {
      console.log('[Dashboard] 🔓 CV unlock flow - redirecting to paywall with cvId:', cvIdParam);
      navigate(`/cv-paywall?cvId=${cvIdParam}&source=cv-unlock`, { replace: true });
    }

    // Nach erfolgreicher Zahlung Daten neu laden
    const paymentParam = searchParams.get('payment');
    const downloadCvParam = searchParams.get('downloadCv');
    const highlightCvParam = searchParams.get('highlightCv');
    const postPaymentAction = searchParams.get('action');

    if (paymentParam === 'success') {
      console.log('[Dashboard] ✅ Payment successful - reloading CVs');
      setShowPaymentSuccess(true);

      if (highlightCvParam) {
        setHighlightedCvId(highlightCvParam);
        setTimeout(() => setHighlightedCvId(null), 15000);
      }

      const showNewCvToast = (cvs: any[], forceCvId?: string) => {
        const targetCv = forceCvId
          ? cvs.find((cv) => cv.id === forceCvId)
          : cvs
              .filter((cv) => cv.pdf_url && cv.source !== 'check')
              .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
        if (targetCv) {
          const jd = targetCv.job_data || {};
          const jobTitle = jd.jobTitle || jd.positionTitle || targetCv.cv_data?.targetJob || 'Dein Lebenslauf';
          const company = jd.company || jd.companyName || '';
          setNewCvPopup({ jobTitle, company });
          setTimeout(() => setNewCvPopup(null), 10000);
        }
      };

      const pollTokens = async (retries: number, prevCredits: number) => {
        await loadUserTokens();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || retries <= 0) return;
        const { data: tokenRow } = await supabase
          .from('user_tokens')
          .select('credits')
          .eq('user_id', user.id)
          .maybeSingle();
        if ((tokenRow?.credits ?? 0) > prevCredits) return;
        setTimeout(() => pollTokens(retries - 1, prevCredits), 3000);
      };

      setTimeout(async () => {
        await loadCVs();
        const freshCvs = await (async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return [];
          const { data } = await supabase.from('stored_cvs').select('id, cv_data, job_data, updated_at, status, source, is_paid, download_unlocked, file_name, pdf_url, created_at').eq('user_id', user.id).order('updated_at', { ascending: false });
          return data || [];
        })();

        if (postPaymentAction === 'create-cv') {
          const optimizedCvs = freshCvs.filter((cv: any) => cv.source !== 'check' && cv.cv_data);
          if (optimizedCvs.length > 0) {
            const richestCv = optimizedCvs.find((cv: any) =>
              cv.cv_data?.personalData?.firstName ||
              (cv.cv_data?.workExperiences?.length ?? 0) > 0 ||
              (cv.cv_data?.hardSkills?.length ?? 0) > 0 ||
              (cv.cv_data?.schoolEducation?.length ?? 0) > 0 ||
              (cv.cv_data?.professionalEducation?.length ?? 0) > 0
            ) ?? optimizedCvs[0];

            const { data: freshRow } = await supabase
              .from('stored_cvs')
              .select('cv_data')
              .eq('id', richestCv.id)
              .maybeSingle();

            let rawData = freshRow?.cv_data ?? richestCv.cv_data;
            if (typeof rawData === 'string') {
              try { rawData = JSON.parse(rawData); } catch { rawData = richestCv.cv_data; }
            }

            const hasRealData =
              rawData &&
              typeof rawData === 'object' &&
              (rawData.personalData?.firstName ||
                (rawData.workExperiences?.length ?? 0) > 0 ||
                (rawData.hardSkills?.length ?? 0) > 0 ||
                (rawData.schoolEducation?.length ?? 0) > 0 ||
                (rawData.professionalEducation?.length ?? 0) > 0);

            if (hasRealData) {
              setExistingCvDataForQuick(rawData);
            } else {
              setExistingCvDataForQuick(null);
            }
            setShowCreateCVChoice(true);
          } else {
            navigate('/job-targeting', {
              state: { fromDashboard: true, isPaidFlow: true },
            });
          }
        }

        setTimeout(() => showNewCvToast(freshCvs, highlightCvParam || undefined), 800);
        const { data: { user } } = await supabase.auth.getUser();
        const { data: tokenRow } = user
          ? await supabase.from('user_tokens').select('credits').eq('user_id', user.id).maybeSingle()
          : { data: null };
        const prevCredits = tokenRow?.credits ?? 0;
        await loadUserTokens();
        await loadCvChecks();
        await loadLearningPaths();
        await loadFestivalTickets();

        setTimeout(() => pollTokens(4, prevCredits), 3000);

        // ✅ Auto-Download nach CV-Kauf (aus Editor Flow)
        if (downloadCvParam) {
          console.log('[Dashboard] 📥 Auto-downloading CV after payment:', downloadCvParam);
          try {
            const { data: cvData, error } = await supabase
              .from('stored_cvs')
              .select('pdf_url, file_name')
              .eq('id', downloadCvParam)
              .maybeSingle();

            if (error) {
              console.error('[Dashboard] ❌ Error loading CV for download:', error);
            } else if (cvData?.pdf_url) {
              console.log('[Dashboard] ✅ PDF URL found, starting download:', cvData.pdf_url);

              // PDF direkt öffnen/downloaden
              const link = document.createElement('a');
              link.href = cvData.pdf_url;
              link.target = '_blank';
              link.download = cvData.file_name || 'lebenslauf.pdf';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } else {
              console.log('[Dashboard] ⚠️ No PDF URL yet for CV:', downloadCvParam);
            }
          } catch (err) {
            console.error('[Dashboard] ❌ Error during auto-download:', err);
          }
        }
      }, 1000);

      setTimeout(() => {
        setShowPaymentSuccess(false);
      }, 8000);

      const newParams = new URLSearchParams(searchParams);
      newParams.delete('payment');
      newParams.delete('cvId');
      newParams.delete('downloadCv');
      newParams.delete('highlightCv');
      newParams.delete('action');
      setSearchParams(newParams);
    }

    // Neuer CV-Check wurde gespeichert (Weiterleitung von AtsResultDisplay)
    const cvCheckParam = searchParams.get('cv_check');
    const cvUnlockParam = searchParams.get('cv_unlock');
    if (cvCheckParam === 'new') {
      setShowNewCvCheckBanner(true);
      if (cvUnlockParam) setNewCvUnlockId(cvUnlockParam);
      setTimeout(() => setShowNewCvCheckBanner(false), 8000);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('cv_check');
      newParams.delete('cv_unlock');
      setSearchParams(newParams);
    }

    // Nach erfolgreichem Festival-Ticket-Kauf
    const ticketSuccessParam = searchParams.get('ticket_success');
    if (ticketSuccessParam === '1') {
      setShowTicketSuccess(true);
      setTimeout(async () => {
        await loadFestivalTickets();
      }, 2000);
      setTimeout(() => setShowTicketSuccess(false), 6000);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('ticket_success');
      setSearchParams(newParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('dyd_optimize_tip_seen')) {
      const t = setTimeout(() => setShowOptimizeTip(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  // Auto-Refresh für Entwürfe ohne PDF (alle 10 Sekunden)
  useEffect(() => {
    const draftsWithoutPdf = userCVs.filter(
      (cv) => (cv.download_unlocked || cv.is_paid) && !cv.pdf_url
    );

    if (draftsWithoutPdf.length === 0) return;

    console.log('[Dashboard] Auto-refresh aktiv:', draftsWithoutPdf.length, 'Entwürfe warten auf PDF');

    const intervalId = setInterval(async () => {
      console.log('[Dashboard] Refreshing CVs...');
      await loadCVs();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [userCVs]);

  // ---------- Actions ----------

  const handleOptimizeCV = async (cv: any) => {
    setSelectedCVForOptimize(cv);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    if (userTokens <= 0) {
      setShowPaywall(true);
    } else {
      setShowOptimizeModal(true);
    }
  };

  const handleSubmitJobData = async (jobData: any) => {
    if (!selectedCVForOptimize) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const consumed = await tokenService.consumeToken(user.id);
      if (!consumed) {
        throw new Error('Nicht genügend Credits');
      }

      await cvStorageService.saveCVData({
        id: selectedCVForOptimize.id,
        cvData: selectedCVForOptimize.cv_data,
        jobData,
        isPaid: true,
        mode: 'update',
        source: 'dashboard_optimize',
      });

      setOptimizedJobData(jobData);
      await loadUserTokens();

      setShowOptimizeModal(false);
      setShowAdjustmentModal(true);
    } catch (error) {
      console.error('Error optimizing CV:', error);
      alert(
        'Fehler beim Optimieren: ' +
          (error instanceof Error ? error.message : 'Unbekannter Fehler')
      );
    }
  };

  const handleRepeatWizard = () => {
    if (!selectedCVForOptimize) return;
    navigate(`/cv-wizard?mode=update&cvId=${selectedCVForOptimize.id}`);
  };

  const handleGoToEditor = () => {
    if (!selectedCVForOptimize) return;
    navigate(`/cv-live-editor/${selectedCVForOptimize.id}`, {
      state: {
        cvData: selectedCVForOptimize.cv_data,
        jobData: optimizedJobData,
      },
    });
  };

  const handlePaywallClose = () => {
    setShowPaywall(false);
    setPaywallFromCreateCv(false);
  };

  const handlePaywallSuccess = async () => {
    await loadUserTokens();
    setShowPaywall(false);
    if (paywallFromCreateCv) {
      setPaywallFromCreateCv(false);
      setShowCreateCVChoice(true);
    } else {
      setShowOptimizeModal(true);
    }
  };

  const handleCreateCV = async () => {
    // Re-fetch token balance to avoid acting on stale state
    let currentTokens = userTokens;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const tokens = await tokenService.getUserTokens(user.id);
        currentTokens = tokens?.credits ?? 0;
        setUserTokens(currentTokens);
      }
    } catch {
      // Fall back to existing state value
    }

    const existingOptimized = userCVs.filter(
      (cv) => cv.source !== 'check' && cv.cv_data
    );

    if (existingOptimized.length > 0) {
      const wizardCv = existingOptimized.find(
        (cv) =>
          cv.cv_data?.personalData?.firstName ||
          (cv.cv_data?.workExperiences?.length ?? 0) > 0 ||
          (cv.cv_data?.hardSkills?.length ?? 0) > 0 ||
          (cv.cv_data?.schoolEducation?.length ?? 0) > 0 ||
          (cv.cv_data?.professionalEducation?.length ?? 0) > 0
      );

      const richestCv = wizardCv ?? existingOptimized[0];

      const { data: latestRow } = await supabase
        .from('stored_cvs')
        .select('cv_data')
        .eq('id', richestCv.id)
        .maybeSingle();

      let rawData = latestRow?.cv_data ?? richestCv.cv_data;
      if (typeof rawData === 'string') {
        try {
          rawData = JSON.parse(rawData);
        } catch {
          rawData = richestCv.cv_data;
        }
      }

      // Check if this is wizard-format data (has personalData / workExperiences etc.)
      const isWizardFormat =
        rawData &&
        typeof rawData === 'object' &&
        (rawData.personalData?.firstName ||
          (rawData.workExperiences?.length ?? 0) > 0 ||
          (rawData.hardSkills?.length ?? 0) > 0 ||
          (rawData.schoolEducation?.length ?? 0) > 0 ||
          (rawData.professionalEducation?.length ?? 0) > 0);

      // For optimizer/sections format, convert to wizard format for display
      const isOptimizerFormat =
        !isWizardFormat &&
        rawData &&
        typeof rawData === 'object' &&
        (Array.isArray(rawData.sections) || rawData.contact || rawData.experience);

      let mappedData: any = null;
      if (isWizardFormat) {
        mappedData = rawData;
      } else if (isOptimizerFormat) {
        try {
          mappedData = mapEditorDataToWizard(rawData);
        } catch {
          mappedData = null;
        }
      }

      setExistingCvDataForQuick(mappedData);
      setExistingWizardCvId(richestCv.id ?? null);

      if (currentTokens <= 0) {
        setPaywallFromCreateCv(true);
        setShowPaywall(true);
        return;
      }

      setShowWizardOverview(true);
    } else {
      if (currentTokens <= 0) {
        setPaywallFromCreateCv(true);
        setShowPaywall(true);
      } else {
        // No existing CVs — show empty Status Quo screen so user can enter data
        setExistingCvDataForQuick(null);
        setExistingWizardCvId(null);
        setShowWizardOverview(true);
      }
    }
  };

  const handleWizardOverviewContinue = (updatedData: any) => {
    setShowWizardOverview(false);
    if (userTokens <= 0) {
      setPaywallFromCreateCv(true);
      setShowPaywall(true);
    } else {
      // Use the user-confirmed (possibly edited) data from the Status Quo screen
      const dataToUse = updatedData ?? existingCvDataForQuick;
      const hasValidData =
        dataToUse &&
        typeof dataToUse === 'object' &&
        (dataToUse.personalData?.firstName ||
          (dataToUse.workExperiences?.length ?? 0) > 0 ||
          (dataToUse.hardSkills?.length ?? 0) > 0 ||
          (dataToUse.schoolEducation?.length ?? 0) > 0 ||
          (dataToUse.professionalEducation?.length ?? 0) > 0);
      navigate('/job-targeting', {
        state: hasValidData
          ? { cvData: dataToUse, fromDashboard: true, isPaidFlow: true }
          : { fromDashboard: true, isPaidFlow: true },
      });
    }
  };

  const handleOneClickCV = () => {
    setShowCreateCVChoice(false);
    const hasValidData =
      existingCvDataForQuick &&
      typeof existingCvDataForQuick === 'object' &&
      (existingCvDataForQuick.personalData?.firstName ||
        (existingCvDataForQuick.workExperiences?.length ?? 0) > 0 ||
        (existingCvDataForQuick.hardSkills?.length ?? 0) > 0 ||
        (existingCvDataForQuick.schoolEducation?.length ?? 0) > 0 ||
        (existingCvDataForQuick.professionalEducation?.length ?? 0) > 0);

    if (!hasValidData) {
      console.warn('[Dashboard] No valid CV data found – navigating without prefill');
      navigate('/job-targeting', {
        state: { fromDashboard: true, isPaidFlow: true },
      });
      return;
    }

    navigate('/job-targeting', {
      state: { cvData: existingCvDataForQuick, fromDashboard: true, isPaidFlow: true },
    });
  };

  const handleWizardCV = () => {
    setShowCreateCVChoice(false);
    navigate('/job-targeting', {
      state: { fromDashboard: true, isPaidFlow: true },
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Berechne CV-Check-Daten
  const allCvChecks = cvChecks;
  const latestCompletedCheck = cvChecks.find(
    (check) => check.analysis_status === 'completed' || check.ats_json
  );

  // ---------- Render ----------

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] text-white">
      {showPaymentSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black px-6 py-4 rounded-xl shadow-2xl border-2 border-white/20 flex items-center gap-3 max-w-md">
            <CheckCircle size={24} className="flex-shrink-0" />
            <div>
              <div className="font-bold text-lg">Zahlung erfolgreich!</div>
              <div className="text-sm text-black/80">
                Deine Credits werden gutgeschrieben – die Anzeige aktualisiert sich automatisch.
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewCvCheckBanner && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300 max-w-sm w-full">
          <div
            className="rounded-2xl px-5 py-4 shadow-2xl border flex items-start gap-3"
            style={{
              background: 'linear-gradient(135deg, #0d2420 0%, #0a1e1b 100%)',
              borderColor: 'rgba(102,192,182,0.4)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(102,192,182,0.1)',
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] flex items-center justify-center flex-shrink-0 mt-0.5">
              <ClipboardCheck size={18} className="text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-snug">CV-Check gespeichert!</p>
              <p className="text-xs text-white/55 mt-0.5 leading-snug">
                Deine Analyse ist jetzt unter "Meine CV-Analysen" abrufbar.
              </p>
              {newCvUnlockId && (
                <button
                  onClick={() => {
                    setShowNewCvCheckBanner(false);
                    navigate(`/cv-paywall?cvId=${newCvUnlockId}&source=cv_unlock`);
                  }}
                  className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-[#66c0b6] hover:text-[#30E3CA] transition-colors"
                >
                  <Lock size={12} />
                  Detailanalyse freischalten
                </button>
              )}
            </div>
            <button
              onClick={() => setShowNewCvCheckBanner(false)}
              className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0 mt-0.5"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {showOptimizeTip && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 max-w-xs w-full animate-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl p-5 shadow-2xl" style={{ background: 'linear-gradient(135deg, #0f1a19 0%, #0d1514 100%)', border: '1px solid rgba(102,192,182,0.25)', boxShadow: '0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(102,192,182,0.08)' }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #66c0b6, #30E3CA)', boxShadow: '0 2px 12px rgba(102,192,182,0.35)' }}>
                  <Zap size={16} className="text-black" />
                </div>
                <span className="text-xs font-bold tracking-widest" style={{ color: '#66c0b6', textTransform: 'uppercase' }}>Tipp</span>
              </div>
              <button
                onClick={() => {
                  setShowOptimizeTip(false);
                  localStorage.setItem('dyd_optimize_tip_seen', '1');
                }}
                className="p-1 rounded-lg hover:bg-white/10 transition-all flex-shrink-0"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                <X size={15} />
              </button>
            </div>
            <p className="text-sm font-bold text-white mb-1.5">CV einmal erstellt – immer wieder nutzen</p>
            <p className="text-xs leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Du musst deinen Lebenslauf kein zweites Mal ausfüllen. Einfach <span style={{ color: '#66c0b6', fontWeight: 600 }}>Wunschstelle hinzufügen</span> und dein CV wird automatisch passend optimiert.
            </p>
            <button
              onClick={() => {
                setShowOptimizeTip(false);
                localStorage.setItem('dyd_optimize_tip_seen', '1');
              }}
              className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #66c0b6, #30E3CA)', color: '#0d1514' }}
            >
              Verstanden <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {showTicketSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-md" style={{ background: 'linear-gradient(135deg, #00d4d4, #1e90d4)', color: '#080c10', border: '2px solid rgba(255,255,255,0.15)' }}>
            <CheckCircle size={24} className="flex-shrink-0" />
            <div>
              <div className="font-bold text-lg">Festival-Ticket gesichert!</div>
              <div className="text-sm" style={{ color: 'rgba(8,12,16,0.75)' }}>
                Dein Harmony-Ticket ist jetzt hier in deinem Dashboard.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-[#66c0b6] to-white bg-clip-text text-transparent">
                {profile?.full_name ? `Hallo ${profile.full_name.split(' ')[0]}!` : 'Hallo!'}
              </h1>
              <p className="text-xs sm:text-sm text-white/70 mt-1">
                Behalte alle deine Bewerbungen im Blick
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                <Coins size={18} className="text-[#66c0b6]" />
                <div>
                  <div className="text-xs text-white/60">Credits</div>
                  <div className="text-sm font-bold">{userTokens}</div>
                </div>
              </div>

              <button
                onClick={() => setShowAccountSettings(true)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2 text-white/70 hover:text-white text-sm"
                title="Konto-Einstellungen"
              >
                <Settings size={18} />
                <span className="hidden sm:inline">Einstellungen</span>
              </button>

              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2 text-white/70 hover:text-white text-sm"
                title="Ausloggen"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Ausloggen</span>
              </button>

              <button
                onClick={handleCreateCV}
                className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Neuen CV</span>
                <span className="sm:hidden">CV erstellen</span>
              </button>

              <button
                onClick={() => navigate('/cv-check')}
                className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <ClipboardCheck size={18} />
                <span className="hidden sm:inline">CV-Check</span>
                <span className="sm:hidden">Check</span>
              </button>

              <button
                onClick={() => navigate('/career-vision')}
                className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-black font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm shadow-lg"
              style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)' }}
              >
                <Target size={18} />
                <span className="hidden sm:inline">Career Vision</span>
                <span className="sm:hidden">Vision</span>
              </button>
            </div>
          </div>

          {/* One-Click CV Hero Banner */}
          {userCVs.filter(cv => cv.source !== 'check' && cv.cv_data).length > 0 && (
            <div
              onClick={handleCreateCV}
              className="relative overflow-hidden rounded-2xl border border-[#66c0b6]/40 bg-gradient-to-r from-[#0d2a28] via-[#0f3330] to-[#0a1f1d] cursor-pointer group hover:border-[#66c0b6]/70 transition-all duration-300 hover:shadow-xl hover:shadow-[#66c0b6]/10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#66c0b6]/5 via-transparent to-[#30E3CA]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex flex-col sm:flex-row items-center gap-5 px-6 py-5">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] flex items-center justify-center shadow-lg shadow-[#66c0b6]/30">
                  <Zap size={26} className="text-black" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <span className="text-base sm:text-lg font-bold text-white">Neuen CV in Minuten erstellen</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#66c0b6]/20 text-[#66c0b6] border border-[#66c0b6]/30">One-Click</span>
                  </div>
                  <p className="text-sm text-white/60">
                    Deine Daten sind bereits gespeichert. Trage nur noch die Wunschstelle ein – wir erstellen deinen optimierten CV automatisch.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
                    <span className="text-xs text-white/50 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#66c0b6]" />
                      CV-Daten automatisch vorausgefüllt
                    </span>
                    <span className="text-xs text-white/50 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#66c0b6]" />
                      KI-Optimierung auf Wunschstelle
                    </span>
                    <span className="text-xs text-white/50 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#66c0b6]" />
                      PDF sofort downloadbar
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold text-sm shadow-lg group-hover:shadow-[#66c0b6]/40 transition-all">
                    <Plus size={16} />
                    Jetzt erstellen
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Career Vision — Lernpfade */}
          {learningPaths.length > 0 && (() => {
            const paidPaths = [...learningPaths]
              .filter(p => p.is_paid)
              .sort((a, b) => {
                // Ready first, then in_progress, then others
                const score = (p: LearningPath) =>
                  lpResults[p.id] ? 3 : p.status === 'completed' ? 2 : p.status === 'in_progress' ? 1 : 0;
                if (score(b) !== score(a)) return score(b) - score(a);
                return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
              });
            const unpaidPaths = learningPaths.filter(p => !p.is_paid);
            const primaryUnpaid = unpaidPaths[0];

            return (
              <div className="space-y-4">
                {/* Section header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#30E3CA]/10 border border-[#30E3CA]/20 flex items-center justify-center">
                      <Target size={16} className="text-[#30E3CA]" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-white leading-none">Career Vision</h2>
                      <p className="text-[11px] text-white/40 mt-0.5">Dein persönlicher Karriere-Fahrplan</p>
                    </div>
                  </div>
                  {learningPaths.length > 1 && (
                    <button
                      onClick={() => navigate('/career-vision')}
                      className="text-[11px] text-[#66c0b6]/70 hover:text-[#66c0b6] transition-colors font-semibold flex items-center gap-1"
                    >
                      Alle {learningPaths.length} <ArrowRight size={11} />
                    </button>
                  )}
                </div>

                {/* Paid learning paths list */}
                {paidPaths.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/25 px-1">
                      Meine Lernpfade
                    </p>
                    {paidPaths.map((path) => {
                      const isReady = lpResults[path.id] === true;
                      const isProcessing = !isReady && (path.status === 'in_progress' || path.status === 'curriculum_ready');
                      const isCompleted = path.status === 'completed' && isReady;

                      return (
                        <div
                          key={path.id}
                          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all hover:scale-[1.005]"
                          style={{
                            background: isReady
                              ? 'linear-gradient(135deg,rgba(34,197,94,0.07),rgba(8,13,24,0.98))'
                              : isProcessing
                              ? 'linear-gradient(135deg,rgba(48,227,202,0.05),rgba(8,13,24,0.98))'
                              : 'rgba(255,255,255,0.02)',
                            border: isReady
                              ? '1px solid rgba(34,197,94,0.22)'
                              : isProcessing
                              ? '1px solid rgba(48,227,202,0.18)'
                              : '1px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          {/* Status icon */}
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background: isReady ? 'rgba(34,197,94,0.12)' : isProcessing ? 'rgba(48,227,202,0.1)' : 'rgba(255,255,255,0.04)',
                              border: isReady ? '1px solid rgba(34,197,94,0.3)' : isProcessing ? '1px solid rgba(48,227,202,0.25)' : '1px solid rgba(255,255,255,0.09)',
                            }}
                          >
                            {isReady ? (
                              <CheckCircle size={16} className="text-green-400" />
                            ) : isProcessing ? (
                              <div className="w-3.5 h-3.5 rounded-full border-2 border-[#30E3CA]/40 border-t-[#30E3CA] animate-spin" />
                            ) : (
                              <Target size={15} className="text-white/30" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-white leading-tight truncate">{path.target_job}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {isReady ? (
                                <span className="text-[10px] font-black uppercase tracking-wider text-green-400/70">
                                  Bereit zum Starten
                                </span>
                              ) : isProcessing ? (
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#30E3CA]/60">
                                  Wird erstellt…
                                </span>
                              ) : (
                                <span className="text-[10px] text-white/30">Freigeschaltet</span>
                              )}
                              {path.target_company && (
                                <span className="text-[10px] text-white/25 truncate">· {path.target_company}</span>
                              )}
                            </div>
                          </div>

                          {/* Action button */}
                          <button
                            onClick={() => {
                              if (isReady) {
                                navigate(`/learning-path/${path.id}`);
                              } else {
                                navigate(`/learning-path-waiting/${path.id}`);
                              }
                            }}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black transition-all hover:scale-105 active:scale-95"
                            style={{
                              background: isReady
                                ? 'rgba(34,197,94,0.12)'
                                : 'rgba(48,227,202,0.08)',
                              border: isReady
                                ? '1px solid rgba(34,197,94,0.3)'
                                : '1px solid rgba(48,227,202,0.2)',
                              color: isReady ? '#4ade80' : '#30E3CA',
                            }}
                          >
                            {isReady ? (
                              <>
                                <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
                                  <polygon points="2,1 10,6 2,11"/>
                                </svg>
                                Starten
                              </>
                            ) : (
                              <>
                                <div className="w-2.5 h-2.5 rounded-full border border-current border-t-transparent animate-spin" />
                                Öffnen
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Unpaid path — show the first one as a teaser with CareerVisionCard */}
                {primaryUnpaid && (
                  <CareerVisionCard
                    learningPath={primaryUnpaid}
                    variant="compact"
                    onStartLearning={() => navigate(`/learning-path/${primaryUnpaid.id}`)}
                  />
                )}

                {!primaryUnpaid && paidPaths.length === 0 && learningPaths.slice(0, 1).map(path => (
                  <CareerVisionCard
                    key={path.id}
                    learningPath={path}
                    variant="compact"
                    onStartLearning={() => navigate(`/learning-path/${path.id}`)}
                  />
                ))}

                {learningPaths.length > 3 && (
                  <button
                    onClick={() => navigate('/career-vision')}
                    className="w-full py-2.5 rounded-xl text-[12px] font-bold text-white/50 bg-white/[0.03] border border-white/8 hover:border-white/15 hover:text-white/70 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Target size={13} />
                    {learningPaths.length - 3} weitere Analysen anzeigen
                  </button>
                )}

                {/* Certificate showcase */}
                {(() => {
                  const certPaths = learningPaths.filter(p => p.certificate_url && p.certificate_issued_at);
                  if (!certPaths.length) return null;
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}>
                          <Award size={12} className="text-amber-400" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-white/30">Meine Zertifikate</span>
                      </div>
                      {certPaths.map(path => (
                        <div
                          key={path.id}
                          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                          style={{ background: 'linear-gradient(135deg,rgba(251,191,36,0.06),rgba(249,115,22,0.04))', border: '1px solid rgba(251,191,36,0.18)' }}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
                            <Award size={18} className="text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-white leading-tight truncate">{path.target_job}</p>
                            <p className="text-[10px] text-white/35 mt-0.5">
                              Abgeschlossen {path.certificate_issued_at ? new Date(path.certificate_issued_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
                            </p>
                          </div>
                          <a
                            href={path.certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all hover:scale-105 flex-shrink-0"
                            style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.28)', color: '#fbbf24' }}
                          >
                            <Download size={12} />
                            PDF
                          </a>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {cvChecks.length > 0 && (() => {
            const latestCheck = cvChecks[0];
            const olderChecks = cvChecks.slice(1);

            const renderCheckScore = (check: any) => {
              if (!check.ats_json) return null;
              try {
                const parsed = typeof check.ats_json === 'string' ? JSON.parse(check.ats_json) : check.ats_json;
                return parsed?.gesamtbewertung?.punkte ?? parsed?.overall_score ?? parsed?.score ?? null;
              } catch { return null; }
            };

            const renderCheckAction = (check: any) => {
              const isPaid = check.is_paid === true;
              const isCompleted = check.status === 'completed' || !!check.ats_json;
              const isExpanded = expandedCheckId === check.id;
              if (isCompleted && isPaid) {
                return (
                  <button
                    onClick={() => setExpandedCheckId(isExpanded ? null : check.id)}
                    className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold hover:opacity-90 transition-all shadow-lg whitespace-nowrap text-xs sm:text-sm flex items-center gap-1.5"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {isExpanded ? 'Schließen' : 'Analyse anzeigen'}
                  </button>
                );
              }
              if (isCompleted && !isPaid) {
                return (
                  <button
                    onClick={() => navigate(`/cv-paywall?cvId=${check.id}&source=cv_unlock`)}
                    className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition-all whitespace-nowrap text-xs sm:text-sm flex items-center gap-1.5"
                  >
                    <Lock size={14} />
                    Freischalten
                  </button>
                );
              }
              return (
                <span className="px-3 py-2 text-xs text-white/40 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  Wird analysiert...
                </span>
              );
            };

            const renderExpandedAnalysis = (check: any) => {
              if (expandedCheckId !== check.id) return null;
              const parsed = parseAtsJson(check.ats_json);
              if (!parsed) return (
                <div className="px-4 pb-4 pt-0">
                  <p className="text-sm text-white/50 text-center py-4">Analyse konnte nicht geladen werden.</p>
                </div>
              );
              return (
                <div className="border-t border-white/10 mt-3 pt-3">
                  <AtsResultDisplay
                    result={parsed}
                    uploadId={check.id}
                    showActions={false}
                    isFromDashboard={true}
                    isPaid={true}
                  />
                </div>
              );
            };

            const latestScore = renderCheckScore(latestCheck);
            const latestIsPaid = latestCheck.is_paid === true;
            const latestIsCompleted = latestCheck.status === 'completed' || !!latestCheck.ats_json;
            const scoreColor = latestScore !== null
              ? latestScore >= 80 ? 'text-green-400' : latestScore >= 60 ? 'text-yellow-400' : 'text-red-400'
              : 'text-white/40';
            const scoreBg = latestScore !== null
              ? latestScore >= 80 ? 'bg-green-400/10 border-green-400/30' : latestScore >= 60 ? 'bg-yellow-400/10 border-yellow-400/30' : 'bg-red-400/10 border-red-400/30'
              : 'bg-white/5 border-white/10';

            return (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileSearch size={20} className="text-[#66c0b6]" />
                  <h2 className="text-base sm:text-lg font-bold text-white">Meine CV-Analysen</h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white/60 border border-white/15">
                    {cvChecks.length}
                  </span>
                </div>

                {/* Latest check — large card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-5 hover:border-[#66c0b6]/30 transition-all mb-3">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center border ${latestIsPaid ? 'bg-[#66c0b6]/15 border-[#66c0b6]/40' : 'bg-white/5 border-white/15'}`}>
                      <FileSearch size={24} className={latestIsPaid ? 'text-[#66c0b6]' : 'text-white/40'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                            {latestCheck.file_name || 'CV-Analyse'}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-white/50 flex items-center gap-1">
                              <Calendar size={11} />
                              {new Date(latestCheck.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                            {latestIsPaid && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#66c0b6]/20 text-[#66c0b6] border border-[#66c0b6]/30">
                                Freigeschaltet
                              </span>
                            )}
                            {!latestIsCompleted && (
                              <span className="text-xs text-white/40 flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                                Wird analysiert...
                              </span>
                            )}
                          </div>
                        </div>
                        {latestScore !== null && (
                          <div className={`px-3 py-2 rounded-xl border flex-shrink-0 text-center ${scoreBg}`}>
                            <div className={`text-2xl font-bold ${scoreColor}`}>{latestScore}%</div>
                            <div className="text-xs text-white/50 mt-0.5">ATS-Score</div>
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        {renderCheckAction(latestCheck)}
                      </div>
                    </div>
                  </div>
                  {renderExpandedAnalysis(latestCheck)}
                </div>

                {/* Older checks — collapsed */}
                {olderChecks.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setIsCvChecksExpanded(!isCvChecksExpanded)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                    >
                      <span className="text-sm text-white/60 font-medium">
                        {olderChecks.length} weitere Analyse{olderChecks.length !== 1 ? 'n' : ''}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-white/40 transition-transform duration-300 ${isCvChecksExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isCvChecksExpanded && (
                      <div className="px-4 pb-4 space-y-2 border-t border-white/10 pt-3">
                        {olderChecks.map((check) => {
                          const score = renderCheckScore(check);
                          const sc = score !== null
                            ? score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'
                            : 'text-white/40';
                          return (
                            <div key={check.id} className="bg-white/[0.03] border border-white/10 rounded-lg hover:border-[#66c0b6]/20 transition-all overflow-hidden">
                              <div className="flex items-center gap-3 p-3">
                                <FileSearch size={16} className={check.is_paid ? 'text-[#66c0b6]' : 'text-white/30'} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-white truncate">{check.file_name || 'CV-Analyse'}</p>
                                  <p className="text-xs text-white/40">{new Date(check.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                                </div>
                                {score !== null && <span className={`text-sm font-bold flex-shrink-0 ${sc}`}>{score}%</span>}
                                <div className="flex-shrink-0">{renderCheckAction(check)}</div>
                              </div>
                              {renderExpandedAnalysis(check)}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          <HarmonyTicketsSection tickets={festivalTickets} />

          {/* Fertige CVs — neuester groß, ältere im Dropdown */}
          {(() => {
            const finishedCvs = userCVs.filter((cv) => (cv.download_unlocked || cv.is_paid) && cv.pdf_url && cv.source !== 'check');
            if (finishedCvs.length === 0) return null;
            const latestCv = finishedCvs[0];
            const olderCvs = finishedCvs.slice(1);

            const getCvLabel = (cv: any) => {
              const cvData = cv.cv_data as any;
              const personalName =
                cvData?.personalData?.firstName
                  ? `${cvData.personalData.firstName} ${cvData.personalData.lastName || ''}`.trim()
                  : cvData?.personalInfo?.name || cv.file_name || 'Lebenslauf';
              const jobTitle = cv.job_data?.jobTitle || cv.job_data?.positionTitle || cvData?.targetRole || '';
              const company = cv.job_data?.company || cv.job_data?.companyName || '';
              return { personalName, jobTitle, company };
            };

            const { personalName: latestName, jobTitle: latestJob, company: latestCompany } = getCvLabel(latestCv);

            return (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Download size={20} className="text-[#66c0b6]" />
                  <h2 className="text-base sm:text-lg font-bold text-white">Fertige Lebensläufe</h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white/60 border border-white/15">
                    {finishedCvs.length}
                  </span>
                </div>

                {/* Latest CV — large card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-5 hover:border-[#66c0b6]/30 transition-all mb-3">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center border bg-[#66c0b6]/15 border-[#66c0b6]/40">
                      <FileText size={24} className="text-[#66c0b6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                            {latestJob ? `${latestJob}${latestCompany ? ` – ${latestCompany}` : ''}` : latestName}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-white/50 flex items-center gap-1">
                              <Calendar size={11} />
                              {new Date(latestCv.updated_at || latestCv.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#66c0b6]/20 text-[#66c0b6] border border-[#66c0b6]/30">
                              Fertig
                            </span>
                            {latestJob && <span className="text-xs text-white/40 truncate">{latestName}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2 flex-wrap">
                        <button
                          onClick={() => navigate(`/cv-live-editor/${latestCv.id}`)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold transition-all"
                        >
                          <Edit2 size={15} />
                          Editor öffnen
                        </button>
                        <button
                          onClick={() => window.open(latestCv.pdf_url, '_blank')}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black text-sm font-bold hover:opacity-90 transition-all"
                        >
                          <Download size={15} />
                          PDF herunterladen
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Older CVs — collapsed */}
                {olderCvs.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setIsFinishedCvsExpanded(!isFinishedCvsExpanded)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                    >
                      <span className="text-sm text-white/60 font-medium">
                        {olderCvs.length} weitere{olderCvs.length !== 1 ? '' : 'r'} Lebenslauf{olderCvs.length !== 1 ? 'läufe' : 'e'}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-white/40 transition-transform duration-300 ${isFinishedCvsExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isFinishedCvsExpanded && (
                      <div className="px-4 pb-4 space-y-2 border-t border-white/10 pt-3">
                        {olderCvs.map((cv) => {
                          const { personalName, jobTitle, company } = getCvLabel(cv);
                          return (
                            <div key={cv.id} className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-lg p-3 hover:border-[#66c0b6]/20 transition-all">
                              <FileText size={16} className="text-[#66c0b6] flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">
                                  {jobTitle ? `${jobTitle}${company ? ` – ${company}` : ''}` : personalName}
                                </p>
                                <p className="text-xs text-white/40">{new Date(cv.updated_at || cv.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => navigate(`/cv-live-editor/${cv.id}`)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-all"
                                >
                                  <Edit2 size={12} />
                                  Editor
                                </button>
                                <button
                                  onClick={() => window.open(cv.pdf_url, '_blank')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black text-xs font-bold hover:opacity-90 transition-all"
                                >
                                  <Download size={13} />
                                  PDF
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          <div id="kanban-section" className="flex items-center gap-2 mb-2">
            <Briefcase size={20} className="text-white/50" />
            <h2 className="text-base sm:text-lg font-bold text-white">Bewerbungs-Kanban</h2>
          </div>
          <p className="text-xs sm:text-sm text-white/60 mb-3">Verschiebe deine Bewerbungen zwischen den Spalten um den Status zu aktualisieren</p>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#66c0b6] mx-auto"></div>
              <p className="mt-4 text-white/60">Lade Bewerbungen...</p>
            </div>
          ) : (
            <KanbanBoard cvs={userCVs} onCVUpdate={loadCVs} highlightedCvId={highlightedCvId} />
          )}
        </div>
      </div>

      {showWizardOverview && (
        <WizardCVOverview
          isOpen={showWizardOverview}
          cvData={existingCvDataForQuick ?? ({} as any)}
          cvId={existingWizardCvId}
          onClose={() => setShowWizardOverview(false)}
          onContinue={handleWizardOverviewContinue}
        />
      )}

      <CreateCVChoiceModal
        isOpen={showCreateCVChoice}
        onClose={() => setShowCreateCVChoice(false)}
        onOneClick={handleOneClickCV}
        onWizard={handleWizardCV}
        userTokens={userTokens}
        hasExistingCvData={!!existingCvDataForQuick}
      />

      <OptimizeJobModal
        isOpen={showOptimizeModal}
        onClose={() => setShowOptimizeModal(false)}
        onSubmit={handleSubmitJobData}
      />

      <CVAdjustmentModal
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        onRepeatWizard={handleRepeatWizard}
        onGoToEditor={handleGoToEditor}
      />

      <TokenPaywallModal
        isOpen={showPaywall}
        onClose={handlePaywallClose}
        onSuccess={handlePaywallSuccess}
        defaultPlan={paywallDefaultPlan}
        successAction={paywallFromCreateCv ? 'create-cv' : undefined}
      />

      {newCvPopup && (
        <div className="fixed bottom-6 right-6 z-50 w-80 animate-fade-in">
          <div className="bg-gradient-to-br from-[#0d2a28] to-[#0a1f1d] border border-[#66c0b6]/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-black" />
                </div>
                <span className="text-sm font-bold text-white">Optimierung gestartet!</span>
              </div>
              <button onClick={() => setNewCvPopup(null)} className="text-white/40 hover:text-white/80 transition-colors text-xl leading-none w-6 h-6 flex items-center justify-center">
                &times;
              </button>
            </div>

            {/* Card preview */}
            <div className="mx-4 mb-3 bg-white rounded-xl p-3 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#66c0b6] animate-pulse" />
                <span className="text-xs font-semibold text-[#3a9e94] uppercase tracking-wide">Neu — Entwurf</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 line-clamp-1">{newCvPopup.jobTitle}</p>
              {newCvPopup.company && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Briefcase className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{newCvPopup.company}</span>
                </div>
              )}
              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">In Bearbeitung</span>
                <span className="text-xs text-[#3a9e94] font-semibold flex items-center gap-1">
                  Im Kanban sichtbar
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 pb-4 space-y-2">
              <button
                onClick={() => {
                  setNewCvPopup(null);
                  document.getElementById('kanban-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black text-sm font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Briefcase className="w-4 h-4" />
                Zum Kanban-Board
              </button>
              <p className="text-xs text-white/35 text-center">Ziehe die Kachel in „Beworben", sobald du dich beworben hast</p>
            </div>
          </div>
        </div>
      )}

      {showAccountSettings && (
        <AccountSettingsModal
          onClose={() => setShowAccountSettings(false)}
          onAccountDeleted={() => navigate('/')}
        />
      )}
    </div>
  );
}
