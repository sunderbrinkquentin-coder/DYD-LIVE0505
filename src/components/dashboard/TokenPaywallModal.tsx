import { X, Check, CreditCard, Loader, AlertCircle, Zap, TrendingUp, Shield, ArrowRight, Users, Star } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { validateStripePriceIds } from '../../utils/stripeConfigValidator';

interface TokenPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultPlan?: 'single' | 'bundle-5' | 'bundle-10';
  successAction?: string;
}

const PRICE_IDS: Record<string, string> = {
  single: import.meta.env.VITE_STRIPE_PRICE_CV_OPT_1 || '',
  'bundle-5': import.meta.env.VITE_STRIPE_PRICE_CV_OPT_5 || '',
  'bundle-10': import.meta.env.VITE_STRIPE_PRICE_CV_OPT_10 || '',
};

const STRIPE_CHECKOUT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`;

const plans = [
  {
    id: 'single' as const,
    credits: 1,
    price: 5,
    originalPrice: null,
    pricePerCredit: '5,00',
    label: 'Starter',
    tag: null,
    savingsPct: null,
  },
  {
    id: 'bundle-5' as const,
    credits: 5,
    price: 20,
    originalPrice: 25,
    pricePerCredit: '4,00',
    label: 'Beliebt',
    tag: 'EMPFOHLEN',
    savingsPct: 20,
  },
  {
    id: 'bundle-10' as const,
    credits: 10,
    price: 30,
    originalPrice: 50,
    pricePerCredit: '3,00',
    label: 'Pro',
    tag: 'BESTES PREIS-LEISTUNGS',
    savingsPct: 40,
  },
];

const STEPS = [
  {
    icon: Zap,
    title: 'KI analysiert die Stelle',
    desc: 'Dein CV wird in Sekunden auf die Jobbeschreibung zugeschnitten.',
  },
  {
    icon: TrendingUp,
    title: 'Keywords & ATS-Score steigen',
    desc: 'Recruiter-Systeme erkennen deinen CV als hochrelevant.',
  },
  {
    icon: Shield,
    title: 'Du bewirbst dich mit Vorsprung',
    desc: 'Unbegrenzt nachbearbeiten, als PDF exportieren — fertig.',
  },
];

const SOCIAL_PROOF = [
  { name: 'Lena K.', role: 'UX Designerin', quote: 'Interview-Rate von 1 auf 4 von 5.' },
  { name: 'Marcus T.', role: 'Software Engineer', quote: '3× mehr Rückmeldungen in Woche 1.' },
];

export function TokenPaywallModal({ isOpen, onClose, onSuccess, defaultPlan, successAction }: TokenPaywallModalProps) {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'single' | 'bundle-5' | 'bundle-10'>(defaultPlan || 'bundle-5');
  const [activeStep, setActiveStep] = useState(0);

  const stripeValidation = useMemo(() => validateStripePriceIds(), []);

  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setError(null);
      setSelectedPlan(defaultPlan || 'bundle-5');
      setActiveStep(0);
    }
  }, [isOpen, defaultPlan]);

  // Cycle through benefit steps
  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => setActiveStep((s) => (s + 1) % STEPS.length), 3000);
    return () => clearInterval(id);
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePurchase = async (plan: 'single' | 'bundle-5' | 'bundle-10') => {
    setIsProcessing(true);
    setError(null);

    try {
      const priceId = PRICE_IDS[plan];
      if (!priceId) {
        setError(`Keine Stripe Price ID für Paket "${plan}" konfiguriert`);
        setIsProcessing(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setIsProcessing(false);
        onClose();
        setTimeout(() => {
          navigate('/login?redirect=' + encodeURIComponent('/dashboard') + '&action=buy-tokens');
        }, 100);
        return;
      }

      const successActionParam = successAction ? `&action=${encodeURIComponent(successAction)}` : '';
      const successUrl = `${window.location.origin}/#/dashboard?payment=success${successActionParam}`;
      const cancelUrl = `${window.location.origin}/#/dashboard?payment=cancelled`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(STRIPE_CHECKOUT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            price_id: priceId,
            success_url: successUrl,
            cancel_url: cancelUrl,
            mode: 'payment',
            metadata: { source: 'token_purchase' },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Fehler beim Erstellen der Checkout-Session');
        }

        const { url } = await response.json();
        if (!url) throw new Error('Keine Checkout-URL erhalten');
        window.location.href = url;
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        if (fetchErr.name === 'AbortError') {
          throw new Error('Verbindungs-Timeout. Bitte versuche es erneut.');
        }
        throw fetchErr;
      }
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
      setIsProcessing(false);
    }
  };

  const chosen = plans.find((p) => p.id === selectedPlan)!;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="relative bg-[#0d1117] border border-white/10 rounded-2xl w-full shadow-2xl overflow-hidden"
        style={{ maxWidth: '760px', maxHeight: '95vh', overflowY: 'auto' }}
      >
        {/* Ambient top glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '260px', pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(102,192,182,0.22), transparent 70%)',
        }} />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 hover:bg-white/10 rounded-lg transition-all"
        >
          <X size={18} className="text-white/40" />
        </button>

        {/* ── HERO ── */}
        <div className="relative z-10 text-center pt-8 pb-6 px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-xs font-semibold"
            style={{ background: 'rgba(102,192,182,0.12)', border: '1px solid rgba(102,192,182,0.28)', color: '#66c0b6' }}>
            <Star size={11} fill="currentColor" />
            KI-gestützte CV-Optimierung
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
            Mehr Interviews. In weniger Zeit.
          </h2>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            Lass KI deinen CV für jede Stelle individuell optimieren — ATS-geprüft, keyword-reich und in Sekunden.
          </p>
        </div>

        {/* ── BENEFIT JOURNEY (animated steps) ── */}
        <div className="relative z-10 mx-6 mb-6 rounded-xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex border-b border-white/8">
            {STEPS.map((step, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`flex-1 py-2.5 text-[11px] font-semibold transition-all ${
                  activeStep === i
                    ? 'text-[#66c0b6] border-b-2 border-[#66c0b6] -mb-px'
                    : 'text-white/30 hover:text-white/50'
                }`}
              >
                {i + 1}. Schritt
              </button>
            ))}
          </div>
          <div className="p-4 flex items-start gap-3">
            {(() => {
              const { icon: Icon, title, desc } = STEPS[activeStep];
              return (
                <>
                  <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,rgba(102,192,182,0.25),rgba(48,227,202,0.12))', border: '1px solid rgba(102,192,182,0.3)' }}>
                    <Icon size={16} style={{ color: '#66c0b6' }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white mb-0.5">{title}</div>
                    <div className="text-xs text-white/50">{desc}</div>
                  </div>
                </>
              );
            })()}
          </div>
          {/* Progress bar */}
          <div className="h-0.5 bg-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] transition-all duration-[2800ms]"
              style={{ width: `${((activeStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* ── PLAN CARDS ── */}
        <div className="relative z-10 px-6 mb-4">
          <div className="grid grid-cols-3 gap-3">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className="relative rounded-xl text-left transition-all duration-200 focus:outline-none"
                  style={{
                    padding: '16px 14px',
                    border: `2px solid ${isSelected ? '#66c0b6' : plan.id === 'bundle-5' ? 'rgba(102,192,182,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    background: isSelected
                      ? 'rgba(102,192,182,0.1)'
                      : plan.id === 'bundle-5'
                      ? 'rgba(102,192,182,0.04)'
                      : 'rgba(255,255,255,0.02)',
                    transform: isSelected ? 'translateY(-2px)' : 'none',
                    boxShadow: isSelected ? '0 6px 24px rgba(102,192,182,0.18)' : 'none',
                  }}
                >
                  {/* Top badge */}
                  {plan.tag && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[9px] font-black text-black"
                      style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)' }}>
                      {plan.tag}
                    </div>
                  )}
                  {plan.savingsPct && (
                    <div className="absolute -top-2.5 -right-2.5 w-9 h-9 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                      style={{ background: 'rgba(34,197,94,0.92)' }}>
                      -{plan.savingsPct}%
                    </div>
                  )}

                  <div className="mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: isSelected ? '#66c0b6' : 'rgba(255,255,255,0.3)' }}>
                      {plan.label}
                    </span>
                  </div>

                  {/* Price with anchor */}
                  <div className="flex items-baseline gap-1.5 mb-0.5">
                    <span className="text-2xl font-black text-white">€{plan.price}</span>
                    {plan.originalPrice && (
                      <span className="text-xs text-white/30 line-through">€{plan.originalPrice}</span>
                    )}
                  </div>
                  <div className="text-[10px] text-white/40 mb-3">
                    {plan.credits === 1 ? 'einmalig' : `€${plan.pricePerCredit} / Optimierung`}
                  </div>

                  <div className="text-base font-bold text-white mb-1">{plan.credits}</div>
                  <div className="text-[10px] text-white/50">
                    Credit{plan.credits > 1 ? 's' : ''}
                  </div>

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute bottom-3 right-3 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)' }}>
                      <Check size={9} className="text-black" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── SOCIAL PROOF ── */}
        <div className="relative z-10 mx-6 mb-4 grid grid-cols-2 gap-2.5">
          {SOCIAL_PROOF.map((p) => (
            <div key={p.name} className="rounded-xl p-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] flex items-center justify-center">
                  <Users size={9} className="text-black" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/80">{p.name}</div>
                  <div className="text-[9px] text-white/30">{p.role}</div>
                </div>
              </div>
              <p className="text-[10px] text-white/55 italic">"{p.quote}"</p>
            </div>
          ))}
        </div>

        {/* ── ERROR ── */}
        {!stripeValidation.isValid && (
          <div className="relative z-10 mx-6 mb-3 p-3 rounded-xl flex items-start gap-3"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 text-xs font-semibold">Stripe nicht konfiguriert</p>
              <p className="text-red-200/60 text-[10px] mt-0.5">{stripeValidation.missingKeys.join(', ')}</p>
            </div>
          </div>
        )}
        {error && (
          <div className="relative z-10 mx-6 mb-3 p-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        )}

        {/* ── CTA ── */}
        <div className="relative z-10 px-6 pb-6">
          <button
            onClick={() => handlePurchase(selectedPlan)}
            disabled={isProcessing || !stripeValidation.isValid}
            title={!stripeValidation.isValid ? 'Checkout disabled until Stripe env is configured.' : ''}
            className="w-full py-4 rounded-xl font-black text-base transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)', color: '#000' }}
          >
            {isProcessing ? (
              <>
                <Loader size={18} className="animate-spin" />
                <span>Wird geladen…</span>
              </>
            ) : (
              <>
                <CreditCard size={17} />
                <span>
                  {chosen.credits} Credit{chosen.credits > 1 ? 's' : ''} kaufen — €{chosen.price}
                </span>
                <ArrowRight size={15} />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-4 mt-3">
            {['Sichere Zahlung via Stripe', 'Sofortiger Zugang', 'Credits verfallen nicht'].map((t) => (
              <span key={t} className="text-[10px] text-white/25 flex items-center gap-1">
                <Check size={9} className="text-white/20" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
