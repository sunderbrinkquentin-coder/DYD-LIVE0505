import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function CircularScore({ score }: { score: number }) {
  const [progress, setProgress] = useState(0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setProgress(score), 300);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44">
      <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="10"
          fill="none"
        />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="stroke-teal-400"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-white"
        >
          {score}
        </motion.div>
        <div className="text-xs text-white/50">/ 100</div>
      </div>
    </div>
  );
}
