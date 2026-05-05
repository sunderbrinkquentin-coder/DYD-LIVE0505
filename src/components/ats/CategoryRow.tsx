import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getProgressColor } from '../../utils/atsHelpers';

export function CategoryRow({
  title,
  score,
  delay,
}: {
  title: string;
  score: number;
  delay: number;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(score), delay * 1000);
    return () => clearTimeout(timer);
  }, [score, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span className="text-white/90 font-medium">{title}</span>
        <span className="text-white/60 text-xs font-semibold">{score}/100</span>
      </div>
      <div className="h-1.5 sm:h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressColor(
            score
          )}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </motion.div>
  );
}
