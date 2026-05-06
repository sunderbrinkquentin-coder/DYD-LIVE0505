import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Quote, ChevronDown, ChevronUp } from 'lucide-react';
import { getProgressColor } from '../../utils/atsHelpers';

type Props = {
  title: string;
  score: number;
  feedback?: string;
  zitat?: string;
  tipp?: string;
  delay?: number;
};

export function DetailCard({ title, score, feedback, zitat, tipp, delay = 0 }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [barWidth, setBarWidth] = useState(0);
  const clampedScore = Math.max(0, Math.min(100, score));

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay, duration: 0.45 }}
      onViewportEnter={() => setTimeout(() => setBarWidth(clampedScore), delay * 1000 + 200)}
      className="rounded-2xl bg-[#0b1220] border border-white/5 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 sm:px-5 sm:py-4 text-left hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getProgressColor(clampedScore)}`} />
          <h3 className="text-sm sm:text-base font-semibold text-white truncate">{title}</h3>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <span className="text-xs font-bold text-white/50">{clampedScore}/100</span>
          {expanded
            ? <ChevronUp size={16} className="text-white/40" />
            : <ChevronDown size={16} className="text-white/40" />
          }
        </div>
      </button>

      {/* Animated score bar — always visible */}
      <div className="h-1.5 bg-white/10 mx-4 sm:mx-5 rounded-full overflow-hidden -mt-1 mb-1">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressColor(clampedScore)}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Expandable content */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-3 pt-2"
        >
          {/* Feedback — Relevance: user recognises their situation */}
          {feedback && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1.5">
                Bewertung
              </p>
              <p className="text-sm text-white/75 leading-relaxed">{feedback}</p>
            </div>
          )}

          {/* Zitat — concrete evidence from the CV */}
          {zitat && (
            <div className="rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3">
              <div className="flex gap-2.5 items-start">
                <Quote size={14} className="text-white/30 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-1.5">
                    Dein aktueller Stand im CV
                  </p>
                  <p className="text-xs sm:text-sm text-white/55 leading-relaxed italic">{zitat}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tipp — Confidence: prominent mint-green recommendation */}
          {tipp && (
            <div className="rounded-xl bg-[#0d2420] border border-[#66c0b6]/35 px-4 py-3">
              <div className="flex gap-2.5 items-start">
                <Lightbulb size={15} className="text-[#66c0b6] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#66c0b6]/80 mb-1.5">
                    Recruiter-Empfehlung
                  </p>
                  <p className="text-xs sm:text-sm text-[#b8ede8] leading-relaxed">{tipp}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.article>
  );
}
