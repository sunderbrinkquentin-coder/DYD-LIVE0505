import { useState } from 'react';
import {
  X, Award, BookOpen, TrendingUp, CheckCircle2,
  ArrowRight, Sparkles, Clock, Zap, Lock, ShieldCheck,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_LEARNING_PATH || 'price_1TWEoZ3Sd9dZl64S5I8uj597';
const STRIPE_CHECKOUT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`;

interface LearningPathPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  learningPathId: string;
  targetJob: string;
  targetCompany?: string;
  skillCount?: number;
}

const BENEFITS = [
  {
    icon: BookOpen,
    color: '#30E3CA',
    bg: 'rgba(48,227,202,0.10)',
    border: 'rgba(48,227,202,0.22)',
    title: '5–10 strukturierte Lernmodule',
    desc: 'Schritt-für-Schritt-Roadmap, genau auf deine Skill-Gaps zugeschnitten',
  },
  {
    icon: Award,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.22)',
    title: 'Offizielles Abschlusszertifikat',
    desc: 'Beweise deinen Fortschritt — downloadbares PDF-Zertifikat nach Abschluss',
  },
  {
    icon: TrendingUp,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.10)',
    border: 'rgba(34,197,94,0.22)',
    title: 'Fortschritts-Tracking',
    desc: 'Behalte deinen Lernfortschritt immer im Blick — Modul für Modul',
  },
  {
    icon: Sparkles,
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.10)',
    border: 'rgba(56,189,248,0.22)',
    title: 'Kuratierte Lernressourcen',
    desc: 'Hochwertige Kurse, Artikel & Videos — keine Zeitverschwendung',
  },
  {
    icon: Zap,
    color: '#f97316',
    bg: 'rgba(249,115,22,0.10)',
    border: 'rgba(249,115,22,0.22)',
    title: 'Sofortiger Zugriff & lebenslang',
    desc: 'Einmal freischalten — für immer nutzen, in deinem eigenen Tempo',
  },
];

const GLOBAL_STYLES = `
  @keyframes lpShimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
  @keyframes lpPulse { 0%,100% { box-shadow:0 0 0 0 rgba(48,227,202,0.35); } 60% { box-shadow:0 0 0 14px rgba(48,227,202,0); } }
  @keyframes lpFadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes lpOrb { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(12px,-10px) scale(1.06); } }
`;

export function LearningPathPaywall({
  isOpen, onClose, learningPathId, targetJob, targetCompany, skillCount = 0,
}: LearningPathPaywallProps) {
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
      // HashRouter requires /#/ prefix so Stripe lands on the correct route
      const successUrl = `${origin}/#/learning-path-waiting/${learningPathId}?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl  = `${origin}/#/learning-path/${learningPathId}?payment=cancelled`;

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
            learning_path_id: learningPathId,
            target_job: targetJob,
            source: 'learning_path',
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
        {/* Ambient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-72 h-72 rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle,#30E3CA,transparent)', top: '-80px', right: '-60px', animation: 'lpOrb 9s ease-in-out infinite' }} />
          <div className="absolute w-48 h-48 rounded-full opacity-[0.04]"
            style={{ background: 'radial-gradient(circle,#f59e0b,transparent)', bottom: '-40px', left: '-40px' }} />
        </div>

        {/* Top accent line */}
        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg,#30E3CA,#66c0b6,#f59e0b,transparent)' }} />

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

          {/* Hero price card */}
          <div className="px-6 pb-4">
            <div className="relative overflow-hidden rounded-2xl p-5"
              style={{ background: 'linear-gradient(135deg,rgba(48,227,202,0.10),rgba(10,20,35,0.95))', border: '1px solid rgba(48,227,202,0.22)' }}>
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(48,227,202,0.6),transparent)' }} />

              {/* Döner comparison badge */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <span className="text-base leading-none">🌯</span>
                <span className="text-[10px] font-black text-amber-300">= 1 Döner + Getränk</span>
              </div>

              <div className="flex items-end gap-3">
                <div>
                  <p className="text-[11px] font-black text-[#30E3CA]/60 uppercase tracking-widest mb-1">Einmalig</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-5xl font-black text-white leading-none">9<span className="text-3xl">,99</span></span>
                    <span className="text-2xl font-black text-white/70 mb-0.5">€</span>
                  </div>
                  <p className="text-xs text-white/40 mt-1">Kein Abo · Kein Verstecktes · Einmal zahlen</p>
                </div>
              </div>

              {/* Comparison row */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl p-3 text-center"
                  style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <p className="text-[9px] font-black uppercase tracking-wider text-red-400 mb-1">Döner + Getränk</p>
                  <p className="text-lg font-black text-white/60">~9 €</p>
                  <p className="text-[9px] text-white/35 mt-0.5">Vergessen in 30 Minuten</p>
                </div>
                <div className="rounded-xl p-3 text-center"
                  style={{ background: 'rgba(48,227,202,0.07)', border: '1px solid rgba(48,227,202,0.18)' }}>
                  <p className="text-[9px] font-black uppercase tracking-wider text-[#30E3CA] mb-1">Dein Zertifikat</p>
                  <p className="text-lg font-black text-white">~9,99 €</p>
                  <p className="text-[9px] text-white/35 mt-0.5">Lebenslang im Lebenslauf</p>
                </div>
              </div>

              {skillCount > 0 && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Sparkles size={12} className="text-[#30E3CA] flex-shrink-0" />
                  <p className="text-[11px] text-white/60">
                    <span className="font-black text-white">{skillCount} personalisierte Lernpfade</span> warten auf dich
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Benefits list */}
          <div className="px-6 pb-4 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/35 mb-3">Was du bekommst</p>
            {BENEFITS.map(({ icon: Icon, color, bg, border, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-3 rounded-xl transition-all"
                style={{ background: bg, border: `1px solid ${border}` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${border}` }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white leading-snug">{title}</p>
                  <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed">{desc}</p>
                </div>
                <CheckCircle2 size={14} style={{ color }} className="flex-shrink-0 mt-1" />
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
                background: 'linear-gradient(135deg,#30E3CA,#66c0b6)',
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
                  <span className="relative z-10">Lernpfad jetzt freischalten</span>
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
