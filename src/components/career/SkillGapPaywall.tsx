import { useState } from 'react';
import { X, Search, TrendingUp, BarChart3, CheckCircle2, ArrowRight, Sparkles, Clock, ShieldCheck, Brain } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_SKILLGAP || 'price_1TX5kM3Sd9dZl64SnHfqWvLx';
const STRIPE_CHECKOUT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`;

const GLOBAL_STYLES = `
  @keyframes sgShimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
  @keyframes sgPulse { 0%,100% { box-shadow:0 0 0 0 rgba(48,227,202,0.35); } 60% { box-shadow:0 0 0 14px rgba(48,227,202,0); } }
  @keyframes sgFadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes sgOrb { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(12px,-10px) scale(1.06); } }
`;

const BENEFITS = [
  {
    icon: Search,
    title: 'Tiefe Skill-Gap Analyse',
    desc: 'KI identifiziert bis zu 5 kritische Lücken zwischen deinem Profil und der Zielposition',
  },
  {
    icon: BarChart3,
    title: 'ESCO-validierte Ergebnisse',
    desc: 'Alle Skills werden gegen den EU-Standard ESCO abgeglichen — keine Floskeln',
  },
  {
    icon: TrendingUp,
    title: 'Markt-Prioritäten 2026',
    desc: 'Jede Lücke wird mit aktuellem Marktwert und Impact-Score bewertet',
  },
  {
    icon: Brain,
    title: 'Strategischer Karriere-Ausblick',
    desc: 'Persönlicher Match-Score + Outlook für deine Zielposition und Branche',
  },
];

interface SkillGapPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  learningPathId: string;
  targetJob: string;
  targetCompany?: string;
}

export function SkillGapPaywall({ isOpen, onClose, learningPathId, targetJob, targetCompany }: SkillGapPaywallProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

      const origin = window.location.origin;
      // ✅ Fix: ?resume= statt ?analysis= damit resumePathId-Flow in CareerVisionSection greift
      const successUrl = `${origin}/#/career-vision?resume=${learningPathId}&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl  = `${origin}/#/career-vision`;

      const resp = await fetch(STRIPE_CHECKOUT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          price_id: PRICE_ID,
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            skillgap_path_id: learningPathId,
            target_job: targetJob,
            source: 'skillgap_analysis',
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
          animation: 'sgFadeUp 0.35s ease',
          maxHeight: '96vh',
          overflowY: 'auto',
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-72 h-72 rounded-full opacity-[0.05]"
            style={{ background: 'radial-gradient(circle,#30E3CA,transparent)', top: '-80px', right: '-60px', animation: 'sgOrb 9s ease-in-out infinite' }} />
        </div>

        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg,#30E3CA,#66c0b6,transparent)' }} />

        <div className="relative">
          <div className="flex items-start justify-between p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(48,227,202,0.12)', border: '1px solid rgba(48,227,202,0.28)' }}>
                <Search size={20} className="text-[#30E3CA]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#30E3CA]/70">Skill-Gap Analyse</p>
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

          <div className="px-6 pb-4">
            <div
              className="flex items-center justify-between p-4 rounded-2xl"
              style={{ background: 'rgba(48,227,202,0.07)', border: '1px solid rgba(48,227,202,0.2)' }}
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#30E3CA]/70 mb-1">Einmalige Zahlung</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">3</span>
                  <span className="text-2xl font-black text-white/80">,99 €</span>
                </div>
                <p className="text-[11px] text-white/40 mt-0.5">Skill-Gap Analyse · kein Abo</p>
              </div>
              <div className="text-right">
                <div className="px-3 py-1.5 rounded-xl text-[11px] font-black text-black"
                  style={{ background: 'linear-gradient(135deg,#30E3CA,#66c0b6)' }}>
                  Sofort starten
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-4 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/35 mb-3">Was du bekommst</p>
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-3 rounded-xl"
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

          <div className="px-6 pb-4">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {[
                { icon: ShieldCheck, text: 'Stripe gesichert' },
                { icon: Clock, text: 'Sofortiger Zugriff' },
                { icon: Sparkles, text: 'KI-gestützt' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <Icon size={12} className="text-[#30E3CA]/60" />
                  <span className="text-[10px] font-bold text-white/35">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mx-6 mb-3 px-4 py-3 rounded-xl text-sm text-red-300"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <div className="p-6 pt-0 space-y-3">
            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="group relative w-full py-4 rounded-2xl font-black text-[16px] text-black flex items-center justify-center gap-3 overflow-hidden transition-all duration-200 hover:scale-[1.015] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: 'linear-gradient(135deg,#30E3CA,#66c0b6)',
                animation: isLoading ? 'none' : 'sgPulse 2.5s ease-in-out infinite',
              }}
            >
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)', backgroundSize: '200% 100%', animation: isLoading ? 'none' : 'sgShimmer 2s ease-in-out infinite' }} />
              {isLoading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-black/40 border-t-black animate-spin relative z-10" />
                  <span className="relative z-10">Wird vorbereitet…</span>
                </>
              ) : (
                <>
                  <Sparkles size={19} className="relative z-10 group-hover:rotate-12 transition-transform" />
                  <span className="relative z-10">Skill-Gap analysieren · 3,99 €</span>
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