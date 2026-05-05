import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { AtsCategory } from '../../types/ats';
import { getProgressColor } from '../../utils/atsHelpers';

export function DetailCard({
  title,
  category,
  delay,
}: {
  title: string;
  category?: AtsCategory;
  delay: number;
}) {
  if (!category) return null;

  const score = Math.max(0, Math.min(100, category.score ?? 0));

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="rounded-xl sm:rounded-2xl bg-[#0b1220] border border-white/5 p-3.5 sm:p-4 md:p-5 space-y-2.5 sm:space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${getProgressColor(score)}`}
          />
          <h3 className="text-sm sm:text-base font-semibold text-white">{title}</h3>
        </div>
        <span className="text-xs sm:text-sm text-white/60 font-semibold">{score}/100</span>
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        {category.feedback && (
          <div>
            <p className="text-xs font-semibold uppercase text-white/60 mb-1.5">
              Feedback
            </p>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">{category.feedback}</p>
          </div>
        )}

        {category.verbesserung && (
          <div className="bg-teal-500/15 border border-teal-400/60 rounded-lg sm:rounded-xl px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="flex gap-2.5 sm:gap-3 items-start">
              <Lightbulb className="text-teal-400 flex-shrink-0 mt-0.5" size={16} />
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase text-teal-300 mb-1">
                  Empfehlung
                </p>
                <p className="text-xs sm:text-sm text-teal-50 leading-relaxed">
                  {category.verbesserung}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.article>
  );
}
