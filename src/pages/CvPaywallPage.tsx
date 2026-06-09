// src/pages/CvPaywallPage.tsx
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Loader, Sparkles, Shield, Zap, AlertCircle, Star, Coins } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { validateStripePriceIds } from '../utils/stripeConfigValidator';
import { tokenService } from '../services/tokenService';

interface Package {
  id: string;
  title: string;
  optimizations: number;
  price: number;
  pricePerUnit: number;
  features: string[];
  popular?: boolean;
  bestValue?: boolean;
  badge?: string;
}

const CV_CHECK_PACKAGE: Package = {
  id: 'cv_check',
  title: 'Detailanalyse',
  optimizations: 1,
  price: 5,
  pricePerUnit: 5,
  features: [
    'Detaillierte Kategorien-Bewertung',
    'Individuelles Feedback',
    'Konkrete Verbesserungsvorschläge',
    'Top-3 Prioritäten',
    'Direkt verfügbar',
  ],
  popular: true,
};

const OPTIMIZER_PACKAGES: Package[] = [
  {
    id: 'single',
    title: '1 Optimierung',
    optimizations: 1,
    price: 5,
    pricePerUnit: 5,
    features: [
      'KI-optimierter Lebenslauf',
      'Live-Editor mit 5 Vorlagen',
      'PDF-Download',
      'Direkt verfügbar',
    ],
  },
  {
    id: 'five',
    title: '5 Optimierungen',
    optimizations: 5,
    price: 20,
    pricePerUnit: 4,
    features: [
      '5 KI-optimierte Lebensläufe',
      'Live-Editor mit 5 Vorlagen',
      'PDF-Download für alle CVs',
      '20% günstiger als Einzelkauf',
      'Für mehrere Bewerbungen',
    ],
    popular: true,
    badge: 'Beliebt',
  },
  {
    id: 'ten',
    title: '10 Optimierungen',
    optimizations: 10,
    price: 30,
    pricePerUnit: 3,
    features: [
      '10 KI-optimierte Lebensläufe',
      'Live-Editor mit 5 Vorlagen',
      'PDF-Download für alle CVs',
      '40% günstiger als Einzelkauf',
      'Für intensive Jobsuche',
    ],
    bestValue: true,
    badge: 'Bestes Angebot',
  },
];

// Supabase Edge Function URL für stripe-checkout
const STRIPE_CHECKOUT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`;

// Stripe Price IDs Mapping
const PRICE_IDS: Record<string, string> = {
  cv_check: import.meta.env.VITE_STRIPE_PRICE_CV_CHECK || '',
  single: import.meta.env.VITE_STRIPE_PRICE_CV_OPT_1 || '',
  five: import.meta.env.VITE_STRIPE_PRICE_CV_OPT_5 || '',
  ten: import.meta.env.VITE_STRIPE_PRICE_CV_OPT_10 || '',
};

export default function CvPaywallPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const cvId = searchParams.get('cvId');
  const source = searchParams.get('source');
  const planFromState = (location.state as any)?.plan;

  const { user } = useAuth();

  const [isChecking, setIsChecking] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPackageId, setProcessingPackageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userTokens, setUserTokens] = useState<number>(0);
  const [isUsingToken, setIsUsingToken] = useState(false);
  const [showSlowHint, setShowSlowHint] = useState(false);
  // Prevents redirect loop: only redirect to login once per page load
  const [hasRedirectedToLogin, setHasRedirectedToLogin] = useState(false);

  useEffect(() => {
    setIsProcessing(false);
    setProcessingPackageId(null);
    setShowSlowHint(false);
    if (searchParams.get('payment') === 'cancelled') {
      setError('Zahlung wurde abgebrochen. Du kannst es jederzeit erneut versuchen.');
    }
  }, []);

  const isCvCheckFlow = source === 'cv_unlock';
  const displayPackages = isCvCheckFlow ? [CV_CHECK_PACKAGE] : OPTIMIZER_PACKAGES;

  const stripeValidation = useMemo(() => {
    if (isCvCheckFlow) {
      const cvCheckPriceId = import.meta.env.VITE_STRIPE_PRICE_CV_CHECK;
      return {
        isValid: !!cvCheckPriceId && cvCheckPriceId.trim() !== '',
        missingKeys: !cvCheckPriceId || cvCheckPriceId.trim() === '' ? ['VITE_STRIPE_PRICE_CV_CHECK'] : []
      };
    }
    return validateStripePriceIds();
  }, [isCvCheckFlow]);

  useEffect(() => {
    if (!cvId) {
      setIsChecking(false);
      return;
    }

    if (!user) {
      // Only redirect to login once — avoids loop when Supabase session propagates after login
      if (hasRedirectedToLogin) return;
      setHasRedirectedToLogin(true);
      localStorage.setItem('paywall_cv_id', cvId);
      if (source) {
        localStorage.setItem('paywall_cv_source', source);
      }

      const redirectTarget = `/cv-paywall?cvId=${cvId}${source ? `&source=${source}` : ''}`;
      navigate(`/login?redirect=${encodeURIComponent(redirectTarget)}`, { replace: true });
      return;
    }

    setIsChecking(true);
  }, [user, cvId, source, navigate, hasRedirectedToLogin]);

  useEffect(() => {
    if (!cvId) {
      setIsChecking(false);
      return;
    }
    if (!user) return;
    checkIfPaid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cvId, user]);

  const checkIfPaid = async () => {
    if (!cvId) {
      setError('Keine CV-ID gefunden');
      setIsChecking(false);
      return;
    }

    try {
      const { data: storedData, error: storedError } = await supabase
        .from('stored_cvs')
        .select('is_paid, download_unlocked')
        .eq('id', cvId)
        .maybeSingle();

      if (storedError) {
        console.error('[CvPaywall] stored_cvs error:', storedError);
      }

      if (storedData?.is_paid || storedData?.download_unlocked) {
        navigate(`/cv-live-editor/${cvId}?payment=success`, { replace: true });
        return;
      }

      // Check if user has tokens — if so, use one and skip paywall
      if (user && !isCvCheckFlow) {
        const tokens = await tokenService.getUserTokens(user.id);
        const credits = tokens?.credits || 0;
        setUserTokens(credits);

        if (credits > 0) {
          setIsChecking(false);
          return;
        }
      }

      setIsChecking(false);
    } catch (err) {
      console.error('[CvPaywall] Error checking payment:', err);
      setError('Fehler beim Prüfen des Zahlungsstatus');
      setIsChecking(false);
    }
  };

  const handleUseToken = async () => {
    if (!cvId || !user || userTokens <= 0) return;
    setIsUsingToken(true);
    setError(null);

    try {
      const consumed = await tokenService.consumeToken(user.id);
      if (!consumed) {
        setError('Kein Token verfügbar. Bitte kaufe ein Paket.');
        setIsUsingToken(false);
        return;
      }

      const { error: unlockError } = await supabase
        .from('stored_cvs')
        .update({
          download_unlocked: true,
          unlocked_via_token: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cvId);

      if (unlockError) {
        console.error('[CvPaywall] Error unlocking CV via token:', unlockError);
        setError('Fehler beim Freischalten. Bitte versuche es erneut.');
        setIsUsingToken(false);
        return;
      }

      navigate(`/cv-live-editor/${cvId}?payment=success`, { replace: true });
    } catch (err) {
      console.error('[CvPaywall] Token usage error:', err);
      setError('Fehler beim Verwenden des Tokens.');
      setIsUsingToken(false);
    }
  };

  const handleSelectPackage = async (pkg: Package) => {
    if (!cvId) {
      alert('Keine CV-ID gefunden');
      return;
    }

    if (!user) {
      const redirectTarget = `/cv-paywall?cvId=${cvId}${source ? `&source=${source}` : ''}`;
      navigate(`/login?redirect=${encodeURIComponent(redirectTarget)}`, { replace: true });
      return;
    }

    setIsProcessing(true);
    setProcessingPackageId(pkg.id);
    setError(null);
    setShowSlowHint(false);

    const slowHintTimer = setTimeout(() => setShowSlowHint(true), 5000);

    const attemptCheckout = async (accessToken: string, priceId: string, successUrl: string, cancelUrl: string): Promise<string> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      try {
        const response = await fetch(STRIPE_CHECKOUT_URL, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            price_id: priceId,
            success_url: successUrl,
            cancel_url: cancelUrl,
            mode: 'payment',
            metadata: {
              cv_id: cvId,
              source: isCvCheckFlow ? 'cv_unlock' : 'cv_optimizer',
              token_count: String(pkg.optimizations),
            },
          }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const text = await response.text();
          let errorMessage = 'Fehler beim Starten des Zahlungsvorgangs';
          try {
            const errorData = JSON.parse(text);
            if (errorData.error) errorMessage = errorData.error;
          } catch {
            errorMessage = `Server Fehler (${response.status})`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (data?.error) throw new Error(data.error);
        if (!data?.url) throw new Error('Keine gültige Checkout-URL erhalten');

        return data.url;
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          throw new Error('Verbindungs-Timeout. Bitte versuche es erneut.');
        }
        throw err;
      }
    };

    try {
      let priceId: string;
      if (isCvCheckFlow) {
        priceId = PRICE_IDS['cv_check'];
      } else {
        priceId = PRICE_IDS[pkg.id];
      }

      if (!priceId || priceId.trim() === '') {
        setError(`Keine Stripe Price ID konfiguriert${isCvCheckFlow ? ' (VITE_STRIPE_PRICE_CV_CHECK fehlt)' : ''}`);
        clearTimeout(slowHintTimer);
        setIsProcessing(false);
        setProcessingPackageId(null);
        setShowSlowHint(false);
        return;
      }

      let session = (await supabase.auth.getSession()).data.session;

      if (session?.expires_at && session.expires_at * 1000 - Date.now() < 60000) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        if (refreshed.session) session = refreshed.session;
      }

      if (!session?.access_token) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        session = refreshed.session;
      }

      if (!session?.access_token) {
        setError('Authentifizierung fehlgeschlagen. Bitte melde dich erneut an.');
        clearTimeout(slowHintTimer);
        setIsProcessing(false);
        setProcessingPackageId(null);
        setShowSlowHint(false);

        const redirectTarget = `/cv-paywall?cvId=${cvId}${source ? `&source=${source}` : ''}`;
        navigate(`/login?redirect=${encodeURIComponent(redirectTarget)}`, { replace: true });
        return;
      }

      let successUrl: string;
      successUrl = `${window.location.origin}/#/payment-success?cvId=${cvId}&session_id={CHECKOUT_SESSION_ID}${source ? `&source=${source}` : ''}`;

      const cancelUrl = `${window.location.origin}/#/cv-paywall?cvId=${cvId}&payment=cancelled${source ? `&source=${source}` : ''}`;

      const MAX_RETRIES = 3;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const checkoutUrl = await attemptCheckout(session.access_token, priceId, successUrl, cancelUrl);
          clearTimeout(slowHintTimer);
          sessionStorage.setItem('pending_cv_id', cvId);
          if (source) sessionStorage.setItem('pending_cv_source', source);
          window.location.href = checkoutUrl;
          return;
        } catch (err: any) {
          lastError = err;
          if (attempt < MAX_RETRIES) {
            const delay = attempt === 1 ? 2000 : 3000;
            await new Promise(res => setTimeout(res, delay));
            const { data: refreshed } = await supabase.auth.refreshSession();
            if (refreshed.session) session = refreshed.session;
          }
        }
      }

      clearTimeout(slowHintTimer);
      setError(lastError?.message || 'Fehler beim Starten des Zahlungsvorgangs. Bitte versuche es erneut.');
      setIsProcessing(false);
      setProcessingPackageId(null);
      setShowSlowHint(false);
    } catch (err: any) {
      clearTimeout(slowHintTimer);
      setError(err?.message || 'Fehler beim Starten des Zahlungsvorgangs');
      setIsProcessing(false);
      setProcessingPackageId(null);
      setShowSlowHint(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="inline-block mb-6"
          >
            <Loader className="text-[#66c0b6]" size={64} />
          </motion.div>
          <h2 className="text-xl font-bold text-white mb-2">Prüfe Zahlungsstatus...</h2>
        </motion.div>
      </div>
    );
  }

  if (!cvId && planFromState === 'pro') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Pro-Plan Upgrade</h1>
          <p className="text-white/60 mb-6">
            Der monatliche Pro-Plan wird bald verfügbar sein. Nutze aktuell unsere Optimierungspakete, um CVs zu optimieren.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/cv-check')}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              CV jetzt checken
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-6 py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
            >
              Zum Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!cvId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <h1 className="text-2xl font-bold text-white mb-4">Keine CV-ID gefunden</h1>
          <p className="text-white/60 mb-6">Bitte starte den Prozess von Anfang an.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            Zur Startseite
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#66c0b6]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#30E3CA]/10 rounded-full blur-3xl"></div>
      </div>

      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Decide Your Dream</h1>
                <p className="text-xs text-white/50">{isCvCheckFlow ? 'CV Analyse' : 'CV Optimierung'}</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-12 space-y-3 md:space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm mb-3">
            <Shield className="w-4 h-4 text-[#66c0b6]" />
            <span className="text-white/70">Sichere Zahlung</span>
            <span className="text-white/30">·</span>
            <Zap className="w-4 h-4 text-[#66c0b6]" />
            <span className="text-white/70">Sofortiger Zugriff</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-[#66c0b6] to-white bg-clip-text text-transparent leading-tight">
            {isCvCheckFlow ? 'Detailanalyse freischalten' : 'CV-Optimierungen freischalten'}
          </h1>

          <p className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto">
            {isCvCheckFlow
              ? 'Erhalte Zugriff auf detaillierte Kategorien-Bewertungen, konkretes Feedback und Verbesserungsvorschläge für deinen Lebenslauf.'
              : 'Erhalte KI-optimierte Lebensläufe, die auf deine Zielstelle zugeschnitten sind. Wähle das passende Paket.'}
          </p>
        </motion.div>

        {/* Token Banner – only for CV optimizer flow when user has credits */}
        {!isCvCheckFlow && userTokens > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mb-8"
          >
            <div className="rounded-2xl bg-gradient-to-r from-[#66c0b6]/15 to-[#30E3CA]/10 border border-[#66c0b6]/40 p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] flex items-center justify-center mx-auto mb-3">
                <Coins size={22} className="text-black" />
              </div>
              <p className="text-white font-semibold text-lg mb-1">
                Du hast {userTokens} {userTokens === 1 ? 'Credit' : 'Credits'}
              </p>
              <p className="text-white/60 text-sm mb-4">
                Kein Kauf nötig — verwende einfach einen deiner Credits.
              </p>
              <button
                onClick={handleUseToken}
                disabled={isUsingToken}
                className="w-full rounded-full bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-semibold py-3 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUsingToken ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Freischalten...
                  </>
                ) : (
                  <>
                    <Coins size={18} />
                    1 Credit verwenden & freischalten
                  </>
                )}
              </button>
              <p className="text-white/40 text-xs mt-2">Danach noch {userTokens - 1} Credits übrig</p>
            </div>
          </motion.div>
        )}

        {!stripeValidation.isValid && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-200 font-semibold">Stripe Price IDs missing in environment configuration</p>
                <p className="text-xs text-red-200/70 mt-1">{stripeValidation.missingKeys.join(', ')}</p>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center"
          >
            <p className="text-sm text-red-200">{error}</p>
          </motion.div>
        )}

        <div className={`${isCvCheckFlow ? 'max-w-md mx-auto' : 'grid md:grid-cols-3 gap-6 max-w-5xl mx-auto'}`}>
          {displayPackages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {pkg.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap ${pkg.bestValue ? 'bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black' : 'bg-white/20 text-white border border-white/30'}`}>
                  {pkg.bestValue && <Star size={10} className="inline mr-1" />}
                  {pkg.badge}
                </div>
              )}
              <div className={`h-full rounded-2xl backdrop-blur-xl p-6 md:p-8 transition-all ${pkg.bestValue ? 'bg-gradient-to-b from-[#66c0b6]/10 to-[#30E3CA]/5 border-2 border-[#66c0b6]/50 shadow-lg shadow-[#66c0b6]/10' : pkg.popular && !isCvCheckFlow ? 'bg-white/5 border border-white/20' : 'bg-white/5 border border-[#66c0b6]/30'}`}>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-3">{pkg.title}</h3>
                  <div className="mb-1">
                    <span className="text-5xl md:text-6xl font-bold text-[#66c0b6]">{pkg.price}€</span>
                  </div>
                  {!isCvCheckFlow && pkg.optimizations > 1 && (
                    <p className="text-sm text-[#66c0b6]/70 font-medium mb-1">
                      {pkg.pricePerUnit} €/Optimierung
                    </p>
                  )}
                  {isCvCheckFlow && (
                    <p className="text-sm text-white/60">Einmalige Zahlung</p>
                  )}
                  {!isCvCheckFlow && (
                    <p className="text-sm text-white/60">
                      {pkg.optimizations === 1 ? 'Einmalige Zahlung' : `${pkg.optimizations} Optimierungen`}
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-white/80">
                      <Check size={18} className="text-[#66c0b6] flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3">
                  <button
                    onClick={() => handleSelectPackage(pkg)}
                    disabled={isProcessing || !stripeValidation.isValid}
                    title={!stripeValidation.isValid ? 'Checkout disabled until Stripe env is configured.' : ''}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${pkg.bestValue ? 'bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black hover:shadow-xl hover:shadow-[#66c0b6]/30' : 'bg-white/10 border border-[#66c0b6]/40 text-white hover:bg-[#66c0b6]/20'}`}
                  >
                    {isProcessing && processingPackageId === pkg.id
                      ? 'Weiterleitung zu Stripe...'
                      : 'Jetzt freischalten'}
                  </button>
                  {isProcessing && processingPackageId === pkg.id && showSlowHint && (
                    <p className="text-xs text-white/50 text-center">Beim ersten Mal kann dies etwas laenger dauern...</p>
                  )}
                  {!stripeValidation.isValid && (
                    <p className="text-xs text-red-400 text-center">Checkout disabled until Stripe env is configured.</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center space-y-3"
        >
          <p className="text-xs text-white/50">
            {isCvCheckFlow
              ? 'Nach der Zahlung erhältst du sofort Zugriff auf die detaillierte Analyse.'
              : 'Nach der Zahlung werden die Optimierungen deinem Konto gutgeschrieben. Du kannst sie jederzeit einlösen.'}
          </p>
          <p className="text-xs text-white/40">Alle Preise inkl. MwSt. · Sichere Zahlung über Stripe</p>
          <button
            onClick={() => navigate(-1)}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Zurück
          </button>
        </motion.div>
      </div>
    </div>
  );
}
