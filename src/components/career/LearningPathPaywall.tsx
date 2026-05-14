import { useState } from 'react';
import {
  X, Award, BookOpen, TrendingUp, CheckCircle2,
  ArrowRight, Sparkles, Clock, Zap, Lock, ShieldCheck, Layers,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Single path: 5 € — unlocks only the current learning path
const PRICE_ID_SINGLE = import.meta.env.VITE_STRIPE_PRICE_LEARNING_PATH_SINGLE || 'price_1TWw5G3Sd9dZl64SKYanIg6m';
// All paths: 9,99 € — unlocks every learning path for this user
const PRICE_ID_ALL = import.meta.env.VITE_STRIPE_PRICE_LEARNING_PATH || 'price_1TWEoZ3Sd9dZl64S5I8uj597';

const STRIPE_CHECKOUT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`;

type Plan = 'single' | 'all';

interface LearningPathPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  learningPathId: string;
  targetJob: string;
  targetCompany?: string;
  skillCount?: number;
  selectedSkill?: string;
}

const BENEFITS_SINGLE = [
  {
    icon: BookOpen,
    title: '5–10 strukturierte Lernmodule',
    desc: 'Schritt-für-Schritt-Roadmap, genau auf diesen Lernpfad zugeschnitten',
  },
  {
    icon: Award,
    title: 'Offizielles Abschlusszertifikat',
    desc: 'Downloadbares PDF-Zertifikat nach Abschluss aller Module',
  },
  {
    icon: TrendingUp,
    title: 'Fortschritts-Tracking',
    desc: 'Behalte deinen Lernfortschritt immer im Blick — Modul für Modul',
  },
  {
    icon: Zap,
    title: 'Lebenslanger Zugriff',
    desc: 'Einmal freischalten — in deinem eigenen Tempo absolvieren',
  },
];

const BENEFITS_ALL = [
  {
    icon: Layers,
    title: 'Alle Lernpfade freischalten',
    desc: 'Jeder neue Lernpfad, den du startest, ist automatisch freigeschaltet',
  },
  {
    icon: Award,
    title: 'Unbegrenzte Zertifikate',
    desc: 'Für jeden abgeschlossenen Lernpfad erhältst du ein offizielles Zertifikat',
  },
  {
    icon: TrendingUp,
    title: 'Fortschritts-Tracking',
    desc: 'Behalte alle Lernpfade und ihren Fortschritt im Blick',
  },
  {
    icon: Sparkles,
    title: 'Kuratierte Lernressourcen',
    desc: 'Hochwertige Kurse, Artikel & Videos für jeden deiner Pfade',
  },
  {
    icon: Zap,
    title: 'Lebenslanger Zugriff',
    desc: 'Einmal zahlen — alle zukünftigen Lernpfade inklusive',
  },
];

const GLOBAL_STYLES = `
  @keyframes lpShimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
  @keyframes lpPulse { 0%,100% { box-shadow:0 0 0 0 rgba(48,227,202,0.35); } 60% { box-shadow:0 0 0 14px rgba(48,227,202,0); } }
  @keyframes lpFadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes lpOrb { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(12px,-10px) scale(1.06); } }
`;

export function LearningPathPaywall({
  isOpen, onClose, learningPathId, targetJob, targetCompany, skillCount = 0, selectedSkill,
}: LearningPathPaywallProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan>('single');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAllPlan = selectedPlan === 'all';
  const priceId = isAllPlan ? PRICE_ID_ALL : PRICE_ID_SINGLE;
  const benefits = isAllPlan ? BENEFITS_ALL : BENEFITS_SINGLE;

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

      const origin = window.location.origin;
      const skillParam = selectedSkill ? `&skill=${encodeURIComponent(selectedSkill)}` : '';
      const successUrl = `${origin}/#/learning-path-waiting/${learningPathId}?session_id={CHECKOUT_SESSION_ID}${skillParam}`;
      const cancelUrl  = `${origin}/#/learning-path/${learningPathId}?payment=cancelled`;

      const resp = await fetch(STRIPE_CHECKOUT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          price_id: priceId,
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            learning_path_id: learningPathId,
            target_job: targetJob,
            source: isAllPlan ? 'learning_path_all' : 'learning_path',
            unlock_all: isAllPlan ? 'true' : 'false',
            ...(selectedSkill ? { selected_skill: selectedSkill } : {}),
          },
        }),
      });

      const data = await resp.json();
      if (!resp.ok || !data.url) throw new Error(data.error || 'Checkout konnte nicht gestartet werden.');

      window.location.href = data.url;
    } catch (e: any) {
      setError(e.message || 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <style>{GLOBAL_STYLES}</style>

      <div
        className="relative w-full sm:max-w-lg overflow-hidden"
        style={{
          background: 'linear-gradient(160deg,#080f18,#050b12)',
          borderRadius: '24px 24px 0 0',
          border: '1px solid rgba(48,227,202,0.18)',
          borderBottom: 'none',
          animation: 'lpFadeUp 0.35s ease',
          maxHeight: '96vh',
          overflowY: 'auto',
        }}
      >
        {/* Ambient orb */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-72 h-72 rounded-full opacity-[0.05]"
            style={{ background: 'radial-gradient(circle,#30E3CA,transparent)', top: '-80px', right: '-60px', animation: 'lpOrb 9s ease-in-out infinite' }} />
        </div>

        {/* Top accent line */}
        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg,#30E3CA,#66c0b6,transparent)' }} />

        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(48,227,202,0.12)', border: '1px solid rgba(48,227,202,0.28)' }}>
                <Lock size={20} className="text-[#30E3CA]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#30E3CA]/70">Lernpfad freischalten</p>
                <h2 className="text-lg font-black text-white leading-tight mt-0.5">{targetJob}</h2>
                {targetCompany && (
                  <p className="text-xs text-white/40 mt-0.5">@ {targetCompany}</p>
                )}
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-all flex-shrink-0 mt-0.5">
              <X size={18} />
            </button>
          </div>

          {/* Plan toggle */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {/* Single plan */}
              <button
                onClick={() => setSelectedPlan('single')}
                className="relative flex flex-col items-center gap-1 py-3.5 px-3 rounded-xl transition-all duration-200"
                style={{
                  background: !isAllPlan ? 'linear-gradient(135deg,rgba(48,227,202,0.12),rgba(102,192,182,0.08))' : 'transparent',
                  border: !isAllPlan ? '1px solid rgba(48,227,202,0.3)' : '1px solid transparent',
                }}
              >
                {!isAllPlan && (
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#30E3CA]" />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: !isAllPlan ? '#30E3CA' : 'rgba(255,255,255,0.35)' }}>
                  Einzelner Pfad
                </span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-2xl font-black" style={{ color: !isAllPlan ? '#ffffff' : 'rgba(255,255,255,0.5)' }}>5</span>
                  <span className="text-base font-black" style={{ color: !isAllPlan ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)' }}>€</span>
                </div>
                <span className="text-[9px] text-white/30">Nur dieser Pfad</span>
              </button>

              {/* All paths plan */}
              <button
                onClick={() => setSelectedPlan('all')}
                className="relative flex flex-col items-center gap-1 py-3.5 px-3 rounded-xl transition-all duration-200"
                style={{
                  background: isAllPlan ? 'linear-gradient(135deg,rgba(249,115,22,0.12),rgba(251,191,36,0.08))' : 'transparent',
                  border: isAllPlan ? '1px solid rgba(249,115,22,0.3)' : '1px solid transparent',
                }}
              >
                {isAllPlan && (
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#f97316]" />
                )}
                {/* Best value badge */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-black text-black"
                  style={{ background: 'linear-gradient(90deg,#f59e0b,#f97316)', whiteSpace: 'nowrap' }}>
                  BESTES ANGEBOT
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: isAllPlan ? '#f97316' : 'rgba(255,255,255,0.35)' }}>
                  Alle Pfade
                </span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-2xl font-black" style={{ color: isAllPlan ? '#ffffff' : 'rgba(255,255,255,0.5)' }}>9<span className="text-base">,99</span></span>
                  <span className="text-base font-black" style={{ color: isAllPlan ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)' }}>€</span>
                </div>
                <span className="text-[9px] text-white/30">Alle zukünftigen Pfade</span>
              </button>
            </div>

            {/* Plan context hint */}
            <p className="text-[11px] text-white/35 text-center mt-2.5 leading-relaxed">
              {isAllPlan
                ? 'Einmalig 9,99 € — schaltet jeden Lernpfad frei, den du jemals startest.'
                : `Nur "${targetJob}" wird freigeschaltet. Weitere Pfade können einzeln oder mit dem Komplett-Paket erworben werden.`}
            </p>
          </div>

          {/* Benefits list */}
          <div className="px-6 pb-4 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/35 mb-3">Was du bekommst</p>
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-3 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(48,227,202,0.08)', border: '1px solid rgba(48,227,202,0.15)' }}>
                  <Icon size={15} className="text-[#66c0b6]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white leading-snug">{title}</p>
                  <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed">{desc}</p>
                </div>
                <CheckCircle2 size={14} className="text-[#66c0b6] flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {[
                { icon: ShieldCheck, text: 'Stripe gesichert' },
                { icon: Clock, text: 'Sofortiger Zugriff' },
                { icon: Award, text: 'Zertifikat inklusive' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <Icon size={12} className="text-[#30E3CA]/60" />
                  <span className="text-[10px] font-bold text-white/35">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-6 mb-3 px-4 py-3 rounded-xl text-sm text-red-300"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          {/* CTA */}
          <div className="p-6 pt-0 space-y-3">
            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="group relative w-full py-4 rounded-2xl font-black text-[16px] text-black flex items-center justify-center gap-3 overflow-hidden transition-all duration-200 hover:scale-[1.015] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: isAllPlan
                  ? 'linear-gradient(135deg,#f59e0b,#f97316)'
                  : 'linear-gradient(135deg,#30E3CA,#66c0b6)',
                animation: isLoading ? 'none' : 'lpPulse 2.5s ease-in-out infinite',
              }}
            >
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)', backgroundSize: '200% 100%', animation: isLoading ? 'none' : 'lpShimmer 2s ease-in-out infinite' }} />
              {isLoading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-black/40 border-t-black animate-spin relative z-10" />
                  <span className="relative z-10">Wird vorbereitet…</span>
                </>
              ) : (
                <>
                  <Sparkles size={19} className="relative z-10 group-hover:rotate-12 transition-transform" />
                  <span className="relative z-10">
                    {isAllPlan ? 'Alle Lernpfade freischalten · 9,99 €' : `Lernpfad freischalten · 5 €`}
                  </span>
                  <ArrowRight size={17} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white/40 hover:text-white/70 transition-colors disabled:opacity-50"
            >
              Vielleicht später
            </button>
            <p className="text-center text-[10px] text-white/22">
              Sichere Zahlung via Stripe · Sofortiger Zugriff · Kein Abo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
