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

/**
 * Strips "Ändere [original text] in: [new text]" patterns so only
 * the optimised replacement is shown in the Recruiter-Empfehlung box.
 */
function extractTipp(raw: string): string {
  // Pattern: Ändere "..." in: "..." — keep only the part after "in:"
  const inColonMatch = raw.match(/\bin\s*:\s*[""„]?([\s\S]+)/i);
  if (inColonMatch) return inColonMatch[1].replace(/["""„]+$/, '').trim();

  // Pattern: content inside the SECOND [...] bracket pair
  const brackets = [...raw.matchAll(/\[([^\]]+)\]/g)];
  if (brackets.length >= 2) return brackets[1][1].trim();

  return raw;
}

export function DetailCard({ title, score, feedback, zitat, tipp, delay = 0 }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [barWidth, setBarWidth] = useState(0);
  const clampedScore = Math.max(0, Math.min(100, score));
  const cleanTipp = tipp ? extractTipp(tipp) : undefined;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay, duration: 0.45 }}
      onViewportEnter={() => setTimeout(() => setBarWidth(clampedScore), delay * 1000 + 200)}
      className="rounded-2xl bg-[#0b1220] border border-white/5 overflow-hidden"
    >
      {/* Header — score inline with title to save vertical space */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4 text-left hover:bg-white/[0.03] transition-colors"
      >
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getProgressColor(clampedScore)}`} />
        <h3 className="text-sm sm:text-base font-semibold text-white flex-1 min-w-0 truncate">{title}</h3>

        {/* Score + animated bar on the same line as the title */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="hidden sm:block w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressColor(clampedScore)}`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <span className="text-xs font-bold text-white/50 w-14 text-right">{clampedScore}/100</span>
          {expanded
            ? <ChevronUp size={15} className="text-white/35" />
            : <ChevronDown size={15} className="text-white/35" />
          }
        </div>
      </button>

      {/* Mobile-only bar (full width, below header) */}
      <div className="sm:hidden h-1 bg-white/10 mx-4 rounded-full overflow-hidden -mt-1">
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
          className="px-4 pb-4 sm:px-5 sm:pb-5 pt-3 space-y-4"
        >
          {/* Feedback */}
          {feedback && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-1.5">
                Bewertung
              </p>
              <p className="text-sm text-white/72 leading-relaxed">{feedback}</p>
            </div>
          )}

          {/* Zitat — Relevance: concrete evidence from the CV */}
          {zitat && (
            <div className="rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3">
              <div className="flex gap-2.5 items-start">
                <Quote size={14} className="text-white/25 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1.5">
                    Dein aktueller Stand im CV
                  </p>
                  <p className="text-xs sm:text-sm text-white/52 leading-relaxed italic">{zitat}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tipp — Confidence: prominent green recommendation, bullet list */}
          {cleanTipp && (() => {
            // Split on sentence boundaries, semicolons, or explicit newlines — filter empties
            const bullets = cleanTipp
              .split(/\n|(?<=\.)\s+(?=[A-ZÄÖÜ])|;\s*/)
              .map(s => s.trim())
              .filter(s => s.length > 3);
            return (
              <div className="rounded-xl bg-[#0d2420] border border-[#66c0b6]/35 px-4 py-3">
                <div className="flex gap-2.5 items-start">
                  <Lightbulb size={15} className="text-[#66c0b6] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#66c0b6]/75 mb-2">
                      Recruiter-Empfehlung
                    </p>
                    {bullets.length > 1 ? (
                      <ul className="space-y-1.5">
                        {bullets.map((b, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-[#66c0b6]/60" />
                            <span className="text-xs sm:text-sm text-[#b8ede8] leading-relaxed">{b}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs sm:text-sm text-[#b8ede8] leading-relaxed">{cleanTipp}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}
    </motion.article>
  );
}
