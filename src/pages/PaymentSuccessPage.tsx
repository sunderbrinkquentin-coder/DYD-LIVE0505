import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const CONFIRM_PAYMENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-payment`;

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resolvedRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cvId = searchParams.get('cvId');
  const sessionId = searchParams.get('session_id');
  const sourceParam = searchParams.get('source');
  const sessionCvId = sessionStorage.getItem('pending_cv_id') || localStorage.getItem('paywall_cv_id');
  const sessionSource = sessionStorage.getItem('pending_cv_source') || localStorage.getItem('paywall_cv_source');
  const actualCvId = cvId || sessionCvId;
  const actualSource = sourceParam || sessionSource;

  const redirectToResult = () => {
    sessionStorage.removeItem('pending_cv_id');
    sessionStorage.removeItem('pending_cv_source');
    localStorage.removeItem('paywall_cv_id');
    localStorage.removeItem('paywall_cv_source');

    const isCvCheck = actualSource === 'cv_unlock' || actualSource === 'cv_check';
    if (actualCvId && isCvCheck) {
      const sid = sessionId ? `&session_id=${sessionId}` : '';
      navigate(`/cv-result/${actualCvId}?payment=success${sid}`, { replace: true });
    } else if (actualCvId && !isCvCheck) {
      navigate(`/cv-live-editor/${actualCvId}?payment=success`, { replace: true });
    } else {
      navigate('/dashboard?payment=success', { replace: true });
    }
  };

  const handleSuccess = () => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;

    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    if (hardTimeoutRef.current) clearTimeout(hardTimeoutRef.current);

    setStatus('success');
    setTimeout(redirectToResult, 500);
  };

  const confirmViaStripe = async (): Promise<boolean> => {
    if (!sessionId || !actualCvId) return false;

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
        body: JSON.stringify({ session_id: sessionId, cv_id: actualCvId }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.confirmed === true;
    } catch {
      return false;
    }
  };

  const checkDbOnce = async (): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from('stored_cvs')
        .select('is_paid, download_unlocked')
        .eq('id', actualCvId)
        .maybeSingle();

      return !!(data?.is_paid || data?.download_unlocked);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!actualCvId) {
      setStatus('error');
      setErrorMessage('Keine CV-ID gefunden.');
      setTimeout(() => navigate('/'), 3000);
      return;
    }

    checkDbOnce().then((alreadyPaid) => {
      if (alreadyPaid) {
        handleSuccess();
        return;
      }

      const channel = supabase
        .channel(`payment-success-${actualCvId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'stored_cvs',
            filter: `id=eq.${actualCvId}`,
          },
          (payload) => {
            const row = payload.new as { is_paid?: boolean; download_unlocked?: boolean };
            if (row.is_paid || row.download_unlocked) {
              handleSuccess();
            }
          }
        )
        .subscribe();

      fallbackTimerRef.current = setTimeout(async () => {
        if (resolvedRef.current) return;

        const [confirmed, paid] = await Promise.all([confirmViaStripe(), checkDbOnce()]);
        if (confirmed || paid) {
          handleSuccess();
        }
      }, 800);

      const retryFallback = async () => {
        if (resolvedRef.current) return;
        const [confirmed, paid] = await Promise.all([confirmViaStripe(), checkDbOnce()]);
        if (confirmed || paid) handleSuccess();
      };
      const retryTimer1 = setTimeout(retryFallback, 2500);
      const retryTimer2 = setTimeout(retryFallback, 5000);

      hardTimeoutRef.current = setTimeout(() => {
        clearTimeout(retryTimer1);
        clearTimeout(retryTimer2);
        if (resolvedRef.current) return;
        resolvedRef.current = true;
        setStatus('success');
        setTimeout(redirectToResult, 500);
      }, 30000);

      return () => {
        supabase.removeChannel(channel);
        if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
        if (hardTimeoutRef.current) clearTimeout(hardTimeoutRef.current);
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualCvId]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {status === 'checking' && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="inline-block mb-6"
            >
              <Loader className="text-[#66c0b6]" size={64} />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Zahlung wird verarbeitet
            </h2>
            <p className="text-white/60">
              Bitte warten Sie einen Moment...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="inline-block mb-6"
            >
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                <Check className="text-green-400" size={48} />
              </div>
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Zahlung erfolgreich!
            </h2>
            <p className="text-white/60 mb-6">
              Dein CV wird nun freigegeben. Kurz darauf wirst du weitergeleitet...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="inline-block mb-6"
            >
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                <AlertCircle className="text-red-400" size={48} />
              </div>
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Fehler beim Verarbeiten
            </h2>
            <p className="text-white/60 mb-6">
              {errorMessage}
            </p>
            <p className="text-sm text-white/40">
              Du wirst automatisch zurückgeleitet...
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
