import { useState, useEffect } from 'react';
import { X, Check, CreditCard, Loader, AlertCircle, Sparkles, Zap, Shield, TrendingUp, Award, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { tokenService } from '../../services/tokenService';

interface CVOptimizerPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cvId: string | undefined;
  userId: string | undefined;
}

const STRIPE_CHECKOUT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`;

const PLANS = [
  {
    id: 'single' as const,
    credits: 1,
    price: 5,
    pricePerCredit: 5,
    title: '1 Optimierung',
    subtitle: 'Einmaliger Einstieg',
    icon: '☕',
    iconLabel: 'Wie ein Cappuccino',
    priceId: () => import.meta.env.VITE_STRIPE_PRICE_CV_OPT_1,
    savings: null,
    popular: false,
    color: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  {
    id: 'bundle-5' as const,
    credits: 5,
    price: 20,
    pricePerCredit: 4,
    title: '5 Optimierungen',
    subtitle: 'Für aktive Jobsuche',
    icon: '🚀',
    iconLabel: '20% Ersparnis',
    priceId: () => import.meta.env.VITE_STRIPE_PRICE_CV_OPT_5,
    savings: '20%',
    popular: true,
    color: 'rgba(102,192,182,0.08)',
    borderColor: '#66c0b6',
  },
  {
    id: 'bundle-10' as const,
    credits: 10,
    price: 30,
    pricePerCredit: 3,
    title: '10 Optimierungen',
    subtitle: 'Intensivpaket',
    icon: '⚡',
    iconLabel: '40% Ersparnis',
    priceId: () => import.meta.env.VITE_STRIPE_PRICE_CV_OPT_10,
    savings: '40%',
    popular: false,
    color: 'rgba(48,227,202,0.05)',
    borderColor: 'rgba(48,227,202,0.4)',
  },
];

const TRUST_SIGNALS = [
  { icon: Zap, text: 'KI-optimiert in 60 Sek.' },
  { icon: Shield, text: 'ATS-geprüft' },
  { icon: Award, text: '5 Premium-Templates' },
  { icon: Clock, text: 'Sofort verfügbar' },
];

const FEATURES = ['KI-Optimierung auf Stellenbeschreibung', 'Live-Editor', 'PDF-Export', 'Alle 5 Templates'];

export function CVOptimizerPaywall({ isOpen, onClose, onSuccess, cvId, userId }: CVOptimizerPaywallProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUsingToken, setIsUsingToken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userTokens, setUserTokens] = useState(0);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [selected, setSelected] = useState<'single' | 'bundle-5' | 'bundle-10'>('bundle-5');

  useEffect(() => {
    if (!isOpen || !userId) return;
    setError(null);
    setIsProcessing(false);
    setIsUsingToken(false);
    tokenService.getUserTokens(userId).then((t) => {
      setUserTokens(t?.credits ?? 0);
      setTokenChecked(true);
    });
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handlePurchase = async (planId: 'single' | 'bundle-5' | 'bundle-10') => {
    setIsProcessing(true);
    setError(null);

    try {
      const plan = PLANS.find((p) => p.id === planId)!;
      const priceId = plan.priceId();
      if (!priceId) {
        setError('Checkout momentan nicht verfügbar. Bitte versuche es später.');
        setIsProcessing(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Bitte melde dich an, um fortzufahren.');
        setIsProcessing(false);
        return;
      }

      const successUrl = cvId
        ? `${window.location.origin}/#/payment-success?cvId=${cvId}&session_id={CHECKOUT_SESSION_ID}`
        : `${window.location.origin}/#/dashboard?payment=success`;
      const cancelUrl = `${window.location.origin}/#/dashboard?payment=cancelled`;

      if (cvId) sessionStorage.setItem('pending_cv_id', cvId);

      const res = await fetch(STRIPE_CHECKOUT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          price_id: priceId,
          success_url: successUrl,
          cancel_url: cancelUrl,
          mode: 'payment',
          metadata: { cv_id: cvId ?? '', source: 'cv_optimizer', token_count: String(plan.credits) },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Fehler beim Starten des Checkouts.');
      }

      const { url } = await res.json();
      if (!url) throw new Error('Keine Checkout-URL erhalten.');
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten.');
      setIsProcessing(false);
    }
  };

  const handleUseToken = async () => {
    if (!cvId || !userId || userTokens <= 0) return;
    setIsUsingToken(true);
    setError(null);

    try {
      const consumed = await tokenService.consumeToken(userId);
      if (!consumed) {
        setError('Token nicht verfügbar. Bitte kaufe ein Paket.');
        setIsUsingToken(false);
        return;
      }

      const { error: unlockErr } = await supabase
        .from('stored_cvs')
        .update({ download_unlocked: true, unlocked_via_token: true, updated_at: new Date().toISOString() })
        .eq('id', cvId);

      if (unlockErr) {
        setError('Fehler beim Freischalten. Bitte versuche es erneut.');
        setIsUsingToken(false);
        return;
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Verwenden des Tokens.');
      setIsUsingToken(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div
        className="relative bg-[#0a0e17] border border-white/10 rounded-2xl w-full shadow-2xl overflow-hidden"
        style={{ maxWidth: '820px', maxHeight: '94vh', overflowY: 'auto' }}
      >
        {/* Ambient glow background */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 50% at 50% -5%, rgba(102,192,182,0.18), transparent 60%)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, right: 0, width: '400px', height: '300px', pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 100% 100%, rgba(48,227,202,0.08), transparent 60%)',
        }} />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-lg hover:bg-white/10 transition-all"
        >
          <X size={20} className="text-white/50" />
        </button>

        {/* Token banner — shown prominently if user has credits */}
        {tokenChecked && userTokens > 0 && (
          <div className="relative z-10 mx-6 mt-6 rounded-xl overflow-hidden">
            <div style={{
              background: 'linear-gradient(135deg, rgba(102,192,182,0.2), rgba(48,227,202,0.1))',
              border: '1.5px solid rgba(102,192,182,0.5)',
              borderRadius: '12px',
              padding: '14px 18px',
            }}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)' }}>
                  <Check size={16} className="text-black" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">
                    Du hast {userTokens} Credit{userTokens !== 1 ? 's'  : ''} — kein Kauf nötig!
                  </div>
                  <div className="text-xs text-white/60 mt-0.5">Schalte diesen CV direkt frei und spare Zeit.</div>
                </div>
              </div>
              <button
                onClick={handleUseToken}
                disabled={isUsingToken || isProcessing}
                className="flex-shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)', color: '#000' }}
              >
                {isUsingToken ? <Loader size={15} className="animate-spin" /> : <><Sparkles size={14} /> Jetzt freischalten</>}
              </button>
            </div>
          </div>
        )}

        {/* Hero section */}
        <div className="relative z-10 text-center px-6 pt-8 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-xs font-semibold"
            style={{ background: 'rgba(102,192,182,0.12)', border: '1px solid rgba(102,192,182,0.3)', color: '#66c0b6' }}>
            <TrendingUp size={12} />
            Dein KI-optimierter CV ist fertig
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
            Jetzt freischalten &amp; downloaden
          </h2>
          <p className="text-white/55 text-sm max-w-sm mx-auto">
            Dein CV wurde auf die Zielstelle zugeschnitten und ATS-optimiert. Schalte ihn mit einem Klick frei.
          </p>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-5">
            {TRUST_SIGNALS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs text-white/50">
                <Icon size={12} style={{ color: '#66c0b6' }} />
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Pricing cards */}
        <div className="relative z-10 px-6 pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLANS.map((plan) => {
              const isSelected = selected === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelected(plan.id)}
                  className="relative rounded-2xl cursor-pointer transition-all duration-200"
                  style={{
                    border: `2px solid ${isSelected ? plan.borderColor : plan.popular ? 'rgba(102,192,182,0.25)' : plan.borderColor}`,
                    background: isSelected ? plan.color : plan.popular ? 'rgba(102,192,182,0.04)' : 'rgba(255,255,255,0.02)',
                    padding: '18px 16px 16px',
                    transform: isSelected && plan.popular ? 'translateY(-2px)' : 'none',
                    boxShadow: isSelected && plan.popular ? '0 8px 32px rgba(102,192,182,0.2)' : 'none',
                  }}
                >
                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black text-black whitespace-nowrap"
                      style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)' }}>
                      EMPFOHLEN
                    </div>
                  )}
                  {/* Savings badge */}
                  {plan.savings && (
                    <div className="absolute -top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                      style={{ background: 'rgba(34,197,94,0.9)' }}>
                      -{plan.savings}
                    </div>
                  )}

                  <div className="text-center mb-3">
                    <div className="text-2xl mb-1">{plan.icon}</div>
                    <div className="text-[10px] font-medium" style={{ color: '#66c0b6' }}>{plan.iconLabel}</div>
                  </div>

                  <div className="text-center mb-3">
                    <div className="text-3xl font-black text-white">{plan.price}<span className="text-lg font-semibold text-white/70"> €</span></div>
                    <div className="text-[10px] text-white/40 mt-0.5">
                      {plan.credits > 1 ? `${plan.pricePerCredit} € pro CV` : 'einmalig'}
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    <div className="text-sm font-bold text-white">{plan.title}</div>
                    <div className="text-[10px] text-white/45 mt-0.5">{plan.subtitle}</div>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    {FEATURES.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-[10px] text-white/60">
                        <Check size={11} style={{ color: '#66c0b6', flexShrink: 0 }} />
                        {f}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handlePurchase(plan.id); }}
                    disabled={isProcessing || isUsingToken}
                    className="w-full py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    style={
                      plan.popular || isSelected
                        ? { background: 'linear-gradient(135deg,#66c0b6,#30E3CA)', color: '#000' }
                        : { background: 'rgba(255,255,255,0.07)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' }
                    }
                  >
                    {isProcessing ? (
                      <Loader size={15} className="animate-spin" />
                    ) : (
                      <>
                        <CreditCard size={14} />
                        Kaufen
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Value comparison strip */}
        <div className="relative z-10 px-6 py-4">
          <p className="text-center text-[10px] text-white/30 mb-3 uppercase tracking-wider">Vergleich: Was bekommst du für den Preis?</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: '☕', what: 'Cappuccino', cost: '5 €', vs: '1 optimierter CV' },
              { icon: '🍰', what: '5 CVs', cost: '20 € gesamt', vs: '4 € pro Bewerbung' },
              { icon: '⚡', what: '10 CVs', cost: '30 € gesamt', vs: '3 € pro Bewerbung' },
            ].map((item) => (
              <div key={item.what} className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-xl mb-1">{item.icon}</div>
                <div className="text-[10px] font-semibold text-white/70">{item.cost}</div>
                <div className="text-[9px] text-white/35 mt-0.5">{item.vs}</div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="relative z-10 mx-6 mb-4 flex items-start gap-3 p-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <p className="relative z-10 text-center text-[10px] text-white/25 pb-5">
          Sichere Zahlung via Stripe · Sofortiger Zugang nach Zahlung · Credits verfallen nicht
        </p>
      </div>
    </div>
  );
}
