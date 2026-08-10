// src/components/cvbuilder/SmartCoach.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Dynamischer Coach — ersetzt/ergänzt die statische AvatarSidebar.
//
//   <SmartCoach section="workExperience" data={cvData} entry={activeExp} />
//   <SmartCoachBar section="workExperience" data={cvData} entry={activeExp} />
//
// SmartCoach     = Desktop-Karte (rechte Spalte, wie bisher AvatarSidebar)
// SmartCoachBar  = schlanke Mobile-Leiste (schließt die bisherige Mobile-Lücke,
//                  weil AvatarSidebar `hidden lg:block` war)
//
// Beide lesen selectCoachTip() und wechseln den Inhalt live, während getippt
// wird. Fällt keine Regel, greift der optionale Fallback (Drop-in für die
// bisherigen statischen Texte).
// ─────────────────────────────────────────────────────────────────────────────

import { AnimatePresence, motion } from 'framer-motion';
import { Lightbulb, TrendingUp, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { useState } from 'react';
import type { CVBuilderData } from '../../types/cvBuilder';
import { selectCoachTip, CoachTip, CoachTone } from '../../config/coachingRules';

interface CoachProps {
  section: string;
  data: CVBuilderData;
  entry?: any;
  /** Fallback, wenn keine Regel feuert (bisheriger statischer Text). */
  fallbackTitle?: string;
  fallbackMessage?: string;
  /** Wird mit dem Zielfeld aufgerufen, wenn der CTA geklickt wird. */
  onCtaClick?: (field?: string) => void;
}

const TONE_STYLES: Record<CoachTone, { ring: string; icon: string; accent: string; Icon: typeof Lightbulb }> = {
  nudge:    { ring: 'border-orange-400/35',  icon: 'text-orange-300',  accent: 'text-orange-300',  Icon: Lightbulb },
  guide:    { ring: 'border-[#66c0b6]/35',   icon: 'text-[#66c0b6]',   accent: 'text-[#66c0b6]',   Icon: Lightbulb },
  praise:   { ring: 'border-[#66c0b6]/45',   icon: 'text-[#66c0b6]',   accent: 'text-[#66c0b6]',   Icon: CheckCircle2 },
  progress: { ring: 'border-[#66c0b6]/35',   icon: 'text-[#66c0b6]',   accent: 'text-[#66c0b6]',   Icon: TrendingUp },
};

function resolveTip(props: CoachProps): CoachTip | null {
  const live = selectCoachTip(props.section, props.data, props.entry);
  if (live) return live;
  if (props.fallbackMessage) {
    return { id: 'fallback', tone: 'guide', message: props.fallbackMessage };
  }
  return null;
}

// ── Desktop-Karte (rechte Spalte) ──────────────────────────────────────────────
export function SmartCoach(props: CoachProps) {
  const tip = resolveTip(props);
  if (!tip) return null;
  const s = TONE_STYLES[tip.tone];
  const Icon = s.Icon;

  return (
    <div className="w-72 shrink-0">
      <div className={`sticky top-28 rounded-2xl bg-[#0a1220]/80 backdrop-blur border ${s.ring} p-5`}>
        <div className="flex items-center gap-2 mb-3">
          <Icon size={18} className={s.icon} />
          <span className={`text-[11px] font-semibold tracking-wider ${s.accent}`}>COACH</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={tip.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            <p className="text-sm text-white/85 leading-relaxed">{tip.message}</p>
            {tip.ctaLabel && (
              <button
                onClick={() => props.onCtaClick?.(tip.ctaField)}
                className={`mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border ${s.ring} ${s.accent} text-sm font-medium hover:bg-white/5 transition-colors`}
              >
                {tip.ctaLabel} <ArrowRight size={15} />
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Mobile-Leiste (über der fixen Bottom-Navigation) ────────────────────────────
export function SmartCoachBar(props: CoachProps) {
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const tip = resolveTip(props);
  if (!tip || tip.id === dismissedId) return null;
  const s = TONE_STYLES[tip.tone];
  const Icon = s.Icon;

  return (
    <div className="lg:hidden px-4 mb-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={tip.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className={`flex items-start gap-2.5 rounded-xl bg-[#0a1220]/90 backdrop-blur border ${s.ring} px-3.5 py-2.5`}
        >
          <Icon size={16} className={`${s.icon} mt-0.5 shrink-0`} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/85 leading-snug">{tip.message}</p>
            {tip.ctaLabel && (
              <button
                onClick={() => props.onCtaClick?.(tip.ctaField)}
                className={`mt-1.5 inline-flex items-center gap-1 text-xs font-medium ${s.accent}`}
              >
                {tip.ctaLabel} <ArrowRight size={12} />
              </button>
            )}
          </div>
          <button
            onClick={() => setDismissedId(tip.id)}
            className="text-white/30 hover:text-white/60 transition-colors shrink-0"
            aria-label="Tipp ausblenden"
          >
            <X size={14} />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}