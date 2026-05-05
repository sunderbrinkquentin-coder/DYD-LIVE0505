// src/pages/CvResultPage.tsx

import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, Home, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { parseAtsJson, AtsResult } from '../types/ats';
import { AtsResultDisplay } from '../components/AtsResultDisplay';
import { useAuth } from '../contexts/AuthContext';

type RouteParams = {
  uploadId: string;
};

export default function CvResultPage() {
  const navigate = useNavigate();
  const { uploadId } = useParams<RouteParams>();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // ---- State ----
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [timeoutError, setTimeoutError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const [atsResult, setAtsResult] = useState<AtsResult | null>(null);
  const [visionText, setVisionText] = useState<string>('');

  const [isPaid, setIsPaid] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);

  const isPaymentSuccess = searchParams.get('payment') === 'success';
  const sessionId = searchParams.get('session_id');
  const shouldAutoRetry = searchParams.get('retry') === '1';

  const CONFIRM_PAYMENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-payment`;

  const confirmPaymentViaStripe = async (): Promise<boolean> => {
    if (!sessionId || !uploadId) return false;
    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const authToken = authSession?.access_token || anonKey;

      const response = await fetch(CONFIRM_PAYMENT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ session_id: sessionId, cv_id: uploadId }),
      });

      if (!response.ok) return false;
      const data = await response.json();
      return data.confirmed === true || data.already_paid === true;
    } catch {
      return false;
    }
  };

  // ---- Retry: re-trigger Make.com for existing upload without re-uploading ----
  const retryAnalysis = useCallback(async () => {
    if (!uploadId || isRetrying) return;
    setIsRetrying(true);
    setRetryError(null);

    try {
      const { data: row, error: fetchErr } = await supabase
        .from('stored_cvs')
        .select('id, file_url, file_path, file_name, source, user_id, temp_id')
        .eq('id', uploadId)
        .maybeSingle();

      if (fetchErr || !row) {
        setRetryError('Datensatz nicht gefunden. Bitte lade deinen CV erneut hoch.');
        setIsRetrying(false);
        return;
      }

      await supabase
        .from('stored_cvs')
        .update({ status: 'processing', error_message: null })
        .eq('id', uploadId);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const callbackUrl = `${supabaseUrl}/functions/v1/make-cv-callback`;

      const { data: fnData, error: fnError } = await supabase.functions.invoke('trigger-cv-check', {
        body: {
          upload_id: row.id,
          file_url: row.file_url,
          file_url_fallback: null,
          file_name: row.file_name || 'cv.pdf',
          file_path: row.file_path,
          source: row.source || 'check',
          user_id: row.user_id || null,
          temp_id: row.temp_id || null,
          callback_url: callbackUrl,
          timestamp: new Date().toISOString(),
        },
      });

      if (fnError || !(fnData as any)?.success) {
        await supabase
          .from('stored_cvs')
          .update({ status: 'failed', error_message: 'Neustart fehlgeschlagen. Bitte lade deinen CV erneut hoch.' })
          .eq('id', uploadId);
        setRetryError('Der Neustart ist fehlgeschlagen. Bitte lade deinen CV erneut hoch.');
        setIsRetrying(false);
        return;
      }

      setErrorMessage(null);
      setTimeoutError(false);
      setIsAnalyzing(true);
      setIsRetrying(false);
    } catch (_e) {
      setRetryError('Verbindungsfehler beim Neustart. Bitte versuche es erneut.');
      setIsRetrying(false);
    }
  }, [uploadId, isRetrying]);

  // ---- Auto-retry when navigated with ?retry=1 (trigger failed during upload) ----
  useEffect(() => {
    if (!shouldAutoRetry || !uploadId) return;
    const timer = setTimeout(() => {
      retryAnalysis();
    }, 1500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoRetry, uploadId]);

  // ---- Check for payment success parameter OR immediate is_paid status ----
  useEffect(() => {
    if (!uploadId) return;

    const checkInitialPaymentStatus = async () => {
      try {
        const dbPromise = supabase
          .from('stored_cvs')
          .select('is_paid')
          .eq('id', uploadId)
          .maybeSingle();

        const stripePromise = (isPaymentSuccess && sessionId) ? confirmPaymentViaStripe() : Promise.resolve(false);

        const [dbResult, confirmed] = await Promise.all([dbPromise, stripePromise]);
        const data = dbResult.data;

        if (data?.is_paid === true || confirmed) {
          setIsPaid(true);
          setPaymentPending(false);

          if (confirmed) {
            const { data: freshRow } = await supabase
              .from('stored_cvs')
              .select('id, status, is_paid, ats_json, vision_text, error_message, created_at, updated_at, make_sent_at, processed_at')
              .eq('id', uploadId)
              .maybeSingle();

            if (freshRow?.ats_json && freshRow?.status === 'completed') {
              try {
                const parsed = parseAtsJson(freshRow.ats_json);
                if (parsed) {
                  setAtsResult(parsed);
                  setVisionText(freshRow.vision_text || '');
                  setIsAnalyzing(false);
                }
              } catch (_) {}
            }
          }
        } else if (isPaymentSuccess) {
          setIsPaid(false);
          setPaymentPending(true);
        }
      } catch (_) {
        if (isPaymentSuccess) {
          setPaymentPending(true);
        }
      }
    };

    checkInitialPaymentStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadId]);

  // ---- Watch stored_cvs via Realtime + polling fallback ----
  useEffect(() => {
    if (!uploadId) {
      setErrorMessage('Keine Upload-ID gefunden.');
      setIsAnalyzing(false);
      return;
    }

    const cancelled = { value: false };
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 1;
    const MAX_POLL_ATTEMPTS = 40;
    const FAST_POLL_ATTEMPTS = 5;
    const FAST_POLL_INTERVAL_MS = 1000;
    const SLOW_POLL_INTERVAL_MS = 4000;
    const MAX_NOT_FOUND_ATTEMPTS = 10; // 10 attempts before giving up on record lookup

    const processRow = (data: any): boolean => {
      if (!data) return false;

      if (data.is_paid === true) {
        setIsPaid(true);
        setPaymentPending(false);
      }

      const status = (data.status as string | null)?.toLowerCase() || 'processing';

      if (status === 'failed') {
        const errorMsg = data.error_message || 'Die Analyse ist fehlgeschlagen';
        setErrorMessage(`${errorMsg}. Bitte versuche es erneut.`);
        setIsAnalyzing(false);
        return true;
      }

      const hasAtsJson = !!data.ats_json;
      if (!(hasAtsJson && (status === 'completed' || data.is_paid === true))) return false;

      const rawAts = data.ats_json ?? null;
      try {
        if (rawAts) {
          const parsed = parseAtsJson(rawAts);
          if (parsed) {
            setAtsResult(parsed);
          } else {
            setErrorMessage('Die Analyse konnte nicht interpretiert werden.');
            setIsAnalyzing(false);
            return true;
          }
        } else {
          setErrorMessage('Keine Analyse-Daten vorhanden.');
          setIsAnalyzing(false);
          return true;
        }
      } catch (_e) {
        setErrorMessage('Fehler beim Verarbeiten der Analyse-Daten.');
        setIsAnalyzing(false);
        return true;
      }

      setVisionText(data.vision_text || '');
      setIsAnalyzing(false);
      setTimeoutError(false);
      return true;
    };

    const schedulePoll = () => {
      if (!cancelled.value) {
        const interval = attempt <= FAST_POLL_ATTEMPTS ? FAST_POLL_INTERVAL_MS : SLOW_POLL_INTERVAL_MS;
        pollTimer = setTimeout(poll, interval);
      }
    };

    const poll = async () => {
      if (cancelled.value) return;

      try {
        const result = await supabase
          .from('stored_cvs')
          .select('id, status, is_paid, ats_json, vision_text, error_message, created_at, updated_at, make_sent_at, processed_at')
          .eq('id', uploadId)
          .maybeSingle();

        if (cancelled.value) return;

        if (result.error) {
          setErrorMessage(`Fehler beim Laden der Analyse: ${result.error.message}`);
          setIsAnalyzing(false);
          return;
        }

        if (!result.data) {
          if (attempt >= MAX_NOT_FOUND_ATTEMPTS) {
            setErrorMessage('Der Upload-Datensatz wurde nicht gefunden. Bitte kehre zurueck und versuche den Upload erneut.');
            setIsAnalyzing(false);
            return;
          }
          attempt++;
          schedulePoll();
          return;
        }

        const done = processRow(result.data);
        if (done) return;

        if (attempt < MAX_POLL_ATTEMPTS) {
          attempt++;
          schedulePoll();
        } else {
          const status = (result.data?.status as string | null)?.toLowerCase() || 'processing';
          const hasAtsJson = !!result.data?.ats_json;
          const makeSentAt = result.data?.make_sent_at;
          const timeoutMsg = status === 'uploading'
            ? 'Der Upload dauert laenger als erwartet. Bitte ueberpruefe deine Internetverbindung und lade die Seite neu.'
            : status === 'pending' || (!makeSentAt && status === 'processing')
            ? 'Die Analyse wurde nicht gestartet. Bitte klicke auf "Analyse neu starten".'
            : status === 'processing'
            ? 'Die Analyse laeuft noch. Dies kann bei grossen Dateien etwas laenger dauern.'
            : status === 'completed' && !hasAtsJson
            ? 'Die Analyse ist abgeschlossen, aber die Ergebnisse sind noch nicht verfuegbar. Bitte lade die Seite in ein paar Sekunden neu.'
            : 'Die Analyse konnte nicht abgeschlossen werden. Bitte versuche es erneut.';
          setTimeoutError(true);
          setIsAnalyzing(false);
          setErrorMessage(timeoutMsg);
        }
      } catch (_e) {
        if (attempt < MAX_POLL_ATTEMPTS) {
          attempt++;
          schedulePoll();
        } else {
          setTimeoutError(true);
          setIsAnalyzing(false);
          setErrorMessage('Ein Fehler ist beim Abrufen der Analyse aufgetreten.');
        }
      }
    };

    // ---- Initial fetch: check if already completed ----
    const fetchInitial = async () => {
      try {
        const result = await supabase
          .from('stored_cvs')
          .select('id, status, is_paid, ats_json, vision_text, error_message, created_at, updated_at, make_sent_at, processed_at')
          .eq('id', uploadId)
          .maybeSingle();

        if (cancelled.value) return;

        if (result.error) {
          setErrorMessage(`Fehler beim Laden der Analyse: ${result.error.message}`);
          setIsAnalyzing(false);
          return;
        }

        if (result.data) {
          const done = processRow(result.data);
          if (done) return;
        }
      } catch (_e) {
        // continue to polling fallback
      }

      if (!cancelled.value) {
        schedulePoll();
      }
    };

    // ---- Supabase Realtime subscription (primary mechanism) ----
    const channel = supabase
      .channel(`cv-result-${uploadId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stored_cvs',
          filter: `id=eq.${uploadId}`,
        },
        (payload) => {
          if (cancelled.value) return;
          const done = processRow(payload.new as any);
          if (done && pollTimer) {
            clearTimeout(pollTimer);
          }
        }
      )
      .subscribe();

    fetchInitial();

    return () => {
      cancelled.value = true;
      if (pollTimer) clearTimeout(pollTimer);
      supabase.removeChannel(channel);
    };
  }, [uploadId]);

  // ---- Poll for payment confirmation after analysis is loaded ----
  useEffect(() => {
    if (!uploadId || !paymentPending || isPaid) return;

    let cancelled = false;
    let attempt = 0;
    const MAX_ATTEMPTS = 30;
    const INTERVAL_MS = 500;

    const pollPayment = async () => {
      if (cancelled) return;

      attempt++;
      if (attempt > MAX_ATTEMPTS) {
        if (!cancelled && sessionId) {
          const confirmed = await confirmPaymentViaStripe();
          if (!cancelled && confirmed) {
            setPaymentPending(false);
            setIsPaid(true);
          } else if (!cancelled) {
            setPaymentPending(false);
          }
        } else {
          setPaymentPending(false);
        }
        return;
      }

      try {
        const { data } = await supabase
          .from('stored_cvs')
          .select('is_paid')
          .eq('id', uploadId)
          .maybeSingle();

        if (cancelled) return;

        if (data?.is_paid === true) {
          setPaymentPending(false);
          setIsPaid(true);
          return;
        }
      } catch (_) {}

      if (!cancelled) {
        setTimeout(pollPayment, INTERVAL_MS);
      }
    };

    pollPayment();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadId, paymentPending, isPaid]);

  // ---- Link CV to user when both atsResult and user are available ----
  useEffect(() => {
    if (!atsResult || !user || !uploadId) return;

    const tempId = sessionStorage.getItem('cv_check_temp_id') || localStorage.getItem('cv_temp_id');

    import('../services/cvCheckService').then(({ linkCVToUser }) => {
      linkCVToUser(uploadId, user.id, tempId || undefined).then((ok) => {
        if (ok) {
          console.log('[CvResultPage] CV linked to user');
        }
      });
    });
  }, [atsResult, user, uploadId]);

  // ---- UI: Error State ----
  if (errorMessage && !isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050507] via-[#0a0a0f] to-[#050507] text-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-black/40 border border-red-500/40 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-red-500" size={28} />
            <h1 className="text-2xl font-bold">Analyse-Fehler</h1>
          </div>
          <p className="text-white/70 mb-6">{errorMessage}</p>
          {retryError && (
            <p className="text-red-400 text-sm mb-4">{retryError}</p>
          )}
          <div className="flex flex-col gap-2">
            <button
              onClick={retryAnalysis}
              disabled={isRetrying}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#66c0b6] text-black font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {isRetrying ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {isRetrying ? 'Analyse wird neu gestartet...' : 'Analyse neu starten'}
            </button>
            <button
              onClick={() => navigate('/cv-check')}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition font-semibold"
            >
              <RefreshCw size={16} />
              Neuen CV hochladen
            </button>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-white/60"
            >
              <Home size={16} />
              Zur Startseite
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- UI: Loading / Analyzing ----
  if (isAnalyzing || (!atsResult && !errorMessage && !timeoutError)) {
    const isPaymentFlow = searchParams.get('payment') === 'success';
    const categories = [
      {
        title: 'Relevanz & Fokus',
        description: 'Passt dein CV zur Stelle?',
        icon: '🎯',
        details: 'Wir pruefen, ob deine Erfahrungen und Skills zur Position passen',
        delay: 0
      },
      {
        title: 'Erfolge & KPIs',
        description: 'Messbare Ergebnisse erkennbar?',
        icon: '📊',
        details: 'Zahlen und konkrete Erfolge machen deinen CV ueberzeugend',
        delay: 0.2
      },
      {
        title: 'Klarheit der Sprache',
        description: 'Verstaendlich formuliert?',
        icon: '💬',
        details: 'Klare Formulierungen helfen HR und ATS-Systemen gleichermassen',
        delay: 0.4
      },
      {
        title: 'Formales',
        description: 'Professionelle Struktur?',
        icon: '📋',
        details: 'Format, Layout und Vollstaendigkeit sind entscheidend',
        delay: 0.6
      },
      {
        title: 'USP & Skills',
        description: 'Einzigartige Staerken sichtbar?',
        icon: '⭐',
        details: 'Deine Alleinstellungsmerkmale heben dich von anderen ab',
        delay: 0.8
      }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050507] via-[#0a0a0f] to-[#050507] text-white px-4 py-8 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="inline-block mb-6"
            >
              <Loader2 className="h-16 w-16 text-[#66c0b6]" />
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-[#66c0b6] to-white bg-clip-text text-transparent">
              {isPaymentFlow ? 'Zahlung erfolgreich — Analyse wird geladen' : 'Dein CV wird jetzt analysiert'}
            </h1>

            <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
              {isPaymentFlow
                ? 'Deine Zahlung wurde verarbeitet. Die Detailanalyse wird in Kuerze freigeschaltet.'
                : 'Unser KI-gestuetztes System prueft deinen Lebenslauf nach professionellen Standards und gibt dir konkrete Verbesserungsvorschlaege.'
              }
            </p>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto mb-6">
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden shadow-inner">
                <motion.div
                  className="h-3 bg-gradient-to-r from-[#66c0b6] via-[#30E3CA] to-[#66c0b6]"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Why is CV Check Important Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12 bg-gradient-to-br from-[#66c0b6]/10 to-[#30E3CA]/5 border border-[#66c0b6]/20 rounded-2xl p-6 md:p-8"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <span className="text-3xl">💡</span>
              Warum ist ein CV-Check wichtig?
            </h2>
            <div className="grid md:grid-cols-3 gap-4 text:white/80">
              <div className="flex gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <h3 className="font-semibold text-white mb-1">ATS-Optimierung</h3>
                  <p className="text-sm">90% der Unternehmen nutzen ATS-Systeme. Dein CV muss diese passieren.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <h3 className="font-semibold text-white mb-1">Schneller Erfolg</h3>
                  <p className="text-sm">Ein optimierter CV erhoetzt deine Chancen auf ein Interview um 40%.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <h3 className="font-semibold text:white mb-1">Professioneller Eindruck</h3>
                  <p className="text-sm">Zeige HR-Manager, dass du es ernst meinst mit deiner Karriere.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Categories Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {categories.map((category) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                transition={{
                  delay: category.delay,
                  duration: 0.5
                }}
                className="relative"
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(102, 192, 182, 0.1)',
                      '0 0 30px rgba(102, 192, 182, 0.3)',
                      '0 0 20px rgba(102, 192, 182, 0.1)',
                    ]
                  }}
                  transition={{
                    duration: 2,
                    delay: category.delay,
                    repeat: Infinity,
                  }}
                  className="h-full bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 hover:border-[#66c0b6]/40 transition-all duration-300 backdrop-blur-sm"
                >
                  {/* Animated Check Indicator */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: category.delay + 1,
                      duration: 0.5,
                      type: 'spring'
                    }}
                    className="absolute top-4 right-4"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#66c0b6]/20 border border-[#66c0b6]/40 flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          delay: category.delay + 1.5,
                          repeat: Infinity,
                          ease: 'linear'
                        }}
                      >
                        <Loader2 className="w-4 h-4 text-[#66c0b6]" />
                      </motion.div>
                    </div>
                  </motion.div>

                  <div className="text-4xl mb-3">{category.icon}</div>

                  <h3 className="text-xl font-bold text-white mb-2">
                    {category.title}
                  </h3>

                  <p className="text-[#66c0b6] text-sm font-medium mb-3">
                    {category.description}
                  </p>

                  <p className="text-white/60 text-sm leading-relaxed">
                    {category.details}
                  </p>

                  {/* Animated Progress Dots */}
                  <div className="flex gap-1 mt-4">
                    {[0, 1, 2].map((dot) => (
                      <motion.div
                        key={dot}
                        animate={{
                          opacity: [0.3, 1, 0.3],
                          scale: [1, 1.2, 1]
                        }}
                        transition={{
                          duration: 1.5,
                          delay: category.delay + dot * 0.2,
                          repeat: Infinity,
                        }}
                        className="w-2 h-2 rounded-full bg-[#66c0b6]"
                      />
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-center text-white/40 text-sm"
          >
            <p className="mb-2">Die Analyse dauert in der Regel 20-30 Sekunden</p>
            <p className="text-xs font-mono">Upload-ID: {uploadId}</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // ---- UI: Timeout ohne Daten ----
  if (timeoutError && !atsResult && !errorMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050507] via-[#0a0a0f] to-[#050507] text-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-black/40 border border-yellow-500/40 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-yellow-400" size={28} />
            <h1 className="text-2xl font-bold">Analyse dauert ungewoehnlich lange</h1>
          </div>
          <p className="text-white/70 mb-6">
            Die Analyse konnte nicht rechtzeitig abgeschlossen werden. Du kannst die Analyse direkt neu starten – du musst deinen Lebenslauf nicht erneut hochladen.
          </p>
          {retryError && (
            <p className="text-red-400 text-sm mb-4">{retryError}</p>
          )}
          <div className="flex flex-col gap-2">
            <button
              onClick={retryAnalysis}
              disabled={isRetrying}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#66c0b6] text-black font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {isRetrying ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {isRetrying ? 'Analyse wird neu gestartet...' : 'Analyse neu starten'}
            </button>
            <button
              onClick={() => navigate('/cv-check')}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition font-semibold"
            >
              <RefreshCw size={16} />
              Neuen CV hochladen
            </button>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-white/60"
            >
              <Home size={16} />
              Zur Startseite
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- UI: Payment pending - show full-screen loading instead of locked paywall ----
  if (paymentPending && !isPaid && atsResult) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="inline-block mb-6"
          >
            <Loader2 className="text-[#66c0b6]" size={64} />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Zahlung wird bestaetigt
          </h2>
          <p className="text-white/60 mb-6">
            Deine Zahlung wurde erfolgreich abgeschlossen. Die Detailanalyse wird in wenigen Sekunden freigeschaltet...
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition text-white text-sm font-medium"
          >
            <RefreshCw size={16} />
            Manuell aktualisieren
          </button>
        </motion.div>
      </div>
    );
  }

  // ---- UI: Ergebnis vorhanden ----
  return (
    <AnimatePresence>
      {atsResult ? (
        <>
          <AtsResultDisplay
            result={atsResult}
            visionText={visionText}
            uploadId={uploadId}
            showActions={true}
            isPaid={isPaid}
          />
        </>
      ) : (
        <div className="min-h-screen bg-[#050816] flex items-center justify-center">
          <div className="text-center text-white/60">
            Keine auswertbaren Daten gefunden.
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
