import { useState, useEffect } from 'react';
import { X, Check, CreditCard, Loader, AlertCircle, Sparkles, Coffee, IceCream, Cake } from 'lucide-react';
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
    analogy: 'Ein Cappuccino',
    analogyIcon: '☕',
    analogyDesc: 'So viel kostet ein Cappuccino – du bekommst dafür deinen nächsten Job.',
    priceId: () => import.meta.env.VITE_STRIPE_PRICE_CV_OPT_1,
    savings: null,
    popular: false,
  },
  {
    id: 'bundle-5' as const,
    credits: 5,
    price: 20,
    pricePerCredit: 4,
    title: '5 Optimierungen',
    analogy: 'Ein Stück Kuchen',
    analogyIcon: '🍰',
    analogyDesc: 'Nur 4 € pro CV – so teuer wie ein Stück Kuchen beim Bäcker.',
    priceId: () => import.meta.env.VITE_STRIPE_PRICE_CV_OPT_5,
    savings: '20 %',
    popular: true,
  },
  {
    id: 'bundle-10' as const,
    credits: 10,
    price: 30,
    pricePerCredit: 3,
    title: '10 Optimierungen',
    analogy: '2 Kugeln Eis',
    analogyIcon: '🍦',
    analogyDesc: 'Nur 3 € pro CV – günstiger als zwei Kugeln Eis.',
    priceId: () => import.meta.env.VITE_STRIPE_PRICE_CV_OPT_10,
    savings: '40 %',
    popular: false,
  },
];

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
        className="relative bg-[#0d1117] border border-white/10 rounded-2xl w-full shadow-2xl overflow-hidden"
        style={{ maxWidth: '780px', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Decorative glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(102,192,182,0.12), transparent)',
        }} />

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/10"
          style={{ background: 'rgba(13,17,23,0.96)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)' }}>
              <Sparkles size={20} className="text-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">Deinen optimierten CV freischalten</h2>
              <p className="text-sm text-white/50">KI-optimiert · ATS-ready · Sofort verfügbar</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-all">
            <X size={22} className="text-white/50" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* "Use existing token" banner */}
          {tokenChecked && userTokens > 0 && (
            <div className="rounded-xl p-4 flex items-center justify-between gap-4"
              style={{ background: 'rgba(102,192,182,0.1)', border: '1px solid rgba(102,192,182,0.3)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(102,192,182,0.15)' }}>
                  <Check size={18} style={{ color: '#66c0b6' }} />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">Du hast {userTokens} Token{userTokens !== 1 ? 's' : ''}</div>
                  <div className="text-xs text-white/55">Schalte diesen CV direkt mit einem Token frei – keine Zahlung nötig.</div>
                </div>
              </div>
              <button
                onClick={handleUseToken}
                disabled={isUsingToken || isProcessing}
                className="flex-shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)', color: '#000' }}
              >
                {isUsingToken ? <Loader size={16} className="animate-spin" /> : '1 Token verwenden'}
              </button>
            </div>
          )}

          {/* Motivation text */}
          <div className="text-center">
            <p className="text-white/70 text-sm leading-relaxed max-w-md mx-auto">
              Dein CV wurde von unserer KI auf die Stelle zugeschnitten. Jetzt fehlt nur noch ein Klick –
              und du kannst ihn als PDF herunterladen.
            </p>
          </div>

          {/* Pricing cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const isSelected = selected === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelected(plan.id)}
                  className="relative rounded-2xl cursor-pointer transition-all"
                  style={{
                    border: isSelected
                      ? '2px solid #66c0b6'
                      : plan.popular
                      ? '2px solid rgba(102,192,182,0.35)'
                      : '2px solid rgba(255,255,255,0.08)',
                    background: isSelected
                      ? 'rgba(102,192,182,0.08)'
                      : plan.popular
                      ? 'rgba(102,192,182,0.04)'
                      : 'rgba(255,255,255,0.03)',
                    padding: '20px',
                  }}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-black"
                      style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)', whiteSpace: 'nowrap' }}>
                      BELIEBT
                    </div>
                  )}
                  {plan.savings && (
                    <div className="absolute -top-3 right-3 px-2 py-1 rounded-full text-xs font-bold text-white bg-green-600">
                      -{plan.savings}
                    </div>
                  )}

                  {/* Analogy badge */}
                  <div className="text-center mb-4">
                    <div className="text-3xl mb-1">{plan.analogyIcon}</div>
                    <div className="text-xs font-semibold" style={{ color: '#66c0b6' }}>{plan.analogy}</div>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-3">
                    <div className="text-4xl font-black text-white">{plan.price} €</div>
                    <div className="text-xs text-white/50 mt-1">
                      {plan.credits > 1 ? `${plan.pricePerCredit} € pro CV` : 'einmalig'}
                    </div>
                  </div>

                  {/* Credits */}
                  <div className="text-center mb-4">
                    <div className="text-sm font-bold text-white">{plan.title}</div>
                    <div className="text-xs text-white/50 mt-0.5">{plan.analogyDesc}</div>
                  </div>

                  {/* Features */}
                  <div className="space-y-1.5 mb-4">
                    {['KI-Optimierung', 'Live-Editor', 'PDF-Download', 'Alle 5 Templates'].map((f) => (
                      <div key={f} className="flex items-center gap-2 text-xs text-white/65">
                        <Check size={12} style={{ color: '#66c0b6', flexShrink: 0 }} />
                        {f}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handlePurchase(plan.id); }}
                    disabled={isProcessing || isUsingToken}
                    className="w-full py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    style={
                      plan.popular
                        ? { background: 'linear-gradient(135deg,#66c0b6,#30E3CA)', color: '#000' }
                        : { background: 'rgba(255,255,255,0.07)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' }
                    }
                  >
                    {isProcessing ? (
                      <Loader size={15} className="animate-spin" />
                    ) : (
                      <>
                        <CreditCard size={15} />
                        Kaufen
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Comparison strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '☕', label: 'Cappuccino', price: '5 €', color: 'rgba(200,150,80,0.15)', border: 'rgba(200,150,80,0.3)' },
              { icon: '🍰', label: 'Stück Kuchen', price: '4 €/CV', color: 'rgba(200,100,100,0.12)', border: 'rgba(200,100,100,0.3)' },
              { icon: '🍦', label: '2 Kugeln Eis', price: '3 €/CV', color: 'rgba(100,180,200,0.12)', border: 'rgba(100,180,200,0.3)' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl p-3 text-center"
                style={{ background: item.color, border: `1px solid ${item.border}` }}>
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-xs text-white/70 font-semibold">{item.label}</div>
                <div className="text-xs text-white/45">{item.price}</div>
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/25">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <p className="text-center text-xs text-white/30">
            Sichere Zahlung via Stripe · Sofortiger Zugang nach Zahlung
          </p>
        </div>
      </div>
    </div>
  );
}
