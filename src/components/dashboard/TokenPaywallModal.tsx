import { X, Check, CreditCard, Loader, AlertCircle, Zap, Shield, TrendingUp, Star } from 'lucide-react';
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

export function TokenPaywallModal({ isOpen, onClose, onSuccess, defaultPlan, successAction }: TokenPaywallModalProps) {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'single' | 'bundle-5' | 'bundle-10'>(defaultPlan || 'bundle-5');

  const stripeValidation = useMemo(() => validateStripePriceIds(), []);

  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setError(null);
      setSelectedPlan(defaultPlan || 'bundle-5');
    }
  }, [isOpen, defaultPlan]);

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

  const plans = [
    {
      id: 'single' as const,
      credits: 1,
      price: '5',
      pricePerCredit: '5,00',
      title: '1 Optimierung',
      subtitle: 'Zum Ausprobieren',
      savings: null,
      popular: false,
    },
    {
      id: 'bundle-5' as const,
      credits: 5,
      price: '20',
      pricePerCredit: '4,00',
      title: '5 Optimierungen',
      subtitle: 'Beliebteste Wahl',
      savings: '20% sparen',
      popular: true,
    },
    {
      id: 'bundle-10' as const,
      credits: 10,
      price: '30',
      pricePerCredit: '3,00',
      title: '10 Optimierungen',
      subtitle: 'Bestes Preis-Leistungs-Verhältnis',
      savings: '40% sparen',
      popular: false,
    },
  ];

  const benefits = [
    { icon: Zap, text: 'KI analysiert die Stelle & optimiert deinen CV in Sekunden' },
    { icon: TrendingUp, text: 'Höhere Interview-Rate durch keyword-optimierte Bewerbungen' },
    { icon: Shield, text: 'Unbegrenzte Nachbearbeitung & PDF-Export inklusive' },
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="relative px-6 pt-6 pb-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X size={20} className="text-white/50" />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#66c0b6] to-[#30E3CA]">
              <Star size={16} className="text-black" />
            </div>
            <span className="text-xs font-semibold tracking-widest uppercase text-[#66c0b6]">CV-Optimierung</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">
            Heb dich von der Masse ab
          </h2>
          <p className="text-white/60 text-sm mb-5">
            Lass KI deinen CV perfekt auf jede Stelle abstimmen — in Sekunden.
          </p>

          {/* Benefits */}
          <div className="flex flex-col gap-2 mb-6">
            {benefits.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="p-1.5 rounded-md bg-[#66c0b6]/15 flex-shrink-0">
                  <Icon size={14} className="text-[#66c0b6]" />
                </div>
                <span className="text-sm text-white/75">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {!stripeValidation.isValid && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 text-sm font-semibold">Stripe nicht konfiguriert</p>
                <p className="text-red-200/60 text-xs mt-0.5">{stripeValidation.missingKeys.join(', ')}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Plan cards */}
          <div className="grid grid-cols-3 gap-3">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative rounded-xl p-4 border-2 transition-all text-left ${
                    isSelected
                      ? 'border-[#66c0b6] bg-[#66c0b6]/10'
                      : plan.popular
                      ? 'border-[#66c0b6]/30 bg-white/5 hover:border-[#66c0b6]/60'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  {plan.popular && !isSelected && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black text-[10px] font-bold whitespace-nowrap">
                      BELIEBT
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#66c0b6] text-black text-[10px] font-bold whitespace-nowrap">
                      AUSGEWÄHLT
                    </div>
                  )}
                  {plan.savings && (
                    <div className="absolute -top-2.5 -right-2.5 px-2 py-0.5 rounded-full bg-green-500 text-white text-[10px] font-bold">
                      {plan.savings}
                    </div>
                  )}

                  <div className="text-2xl font-bold text-white mb-0.5">{plan.credits}</div>
                  <div className="text-[10px] text-white/50 mb-2">Credit{plan.credits > 1 ? 's' : ''}</div>
                  <div className="text-xl font-bold text-[#66c0b6]">€{plan.price}</div>
                  <div className="text-[10px] text-white/40 mt-0.5">€{plan.pricePerCredit}/Credit</div>
                  <div className="text-[11px] text-white/60 mt-2 leading-tight">{plan.subtitle}</div>
                </button>
              );
            })}
          </div>

          {/* What's included */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-1.5">
            {[
              'CV-Optimierung für 1 Stelle pro Credit',
              'KI-gestützte Keyword-Analyse',
              'Unbegrenzte Nachbearbeitung & PDF-Export',
              'Credits verfallen nicht',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <Check size={14} className="text-[#66c0b6] flex-shrink-0" />
                <span className="text-sm text-white/70">{item}</span>
              </div>
            ))}
          </div>

          {/* CTA button */}
          <button
            onClick={() => handlePurchase(selectedPlan)}
            disabled={isProcessing || !stripeValidation.isValid}
            title={!stripeValidation.isValid ? 'Checkout disabled until Stripe env is configured.' : ''}
            className="w-full py-3.5 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black hover:opacity-90 hover:scale-[1.01]"
          >
            {isProcessing ? (
              <>
                <Loader size={18} className="animate-spin" />
                <span>Wird geladen...</span>
              </>
            ) : (
              <>
                <CreditCard size={18} />
                <span>
                  {plans.find(p => p.id === selectedPlan)?.credits} Credit{(plans.find(p => p.id === selectedPlan)?.credits ?? 1) > 1 ? 's' : ''} kaufen — €{plans.find(p => p.id === selectedPlan)?.price}
                </span>
              </>
            )}
          </button>

          <p className="text-xs text-white/30 text-center">
            Sichere Zahlung über Stripe · Sofortiger Zugang · Keine Abonnement-Falle
          </p>
        </div>
      </div>
    </div>
  );
}
