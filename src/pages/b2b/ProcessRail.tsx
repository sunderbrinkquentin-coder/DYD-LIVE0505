import { motion, useReducedMotion, type Variants } from 'framer-motion';

/** Defensiv typisiert: unterstützt sowohl {title,desc} als auch {label,sub}. */
export type ProcessStep = {
  title?: string;
  label?: string;
  desc?: string;
  sub?: string;
};

const LINE_GRADIENT_H = 'linear-gradient(90deg, #38BDF8, #DEFF9A)';
const LINE_GRADIENT_V = 'linear-gradient(180deg, #38BDF8, #DEFF9A)';
const PULSE_BG = 'radial-gradient(circle, #DEFF9A 0%, #38BDF8 70%)';
const RING = 'conic-gradient(from 180deg, #38BDF8, #DEFF9A, #38BDF8)';

export default function ProcessRail({ steps }: { steps: readonly ProcessStep[] }) {
  const reduce = useReducedMotion() ?? false;
  const n = Math.max(steps.length, 1);
  const inset = `${50 / n}%`; // trifft die Mitte des ersten/letzten Badges

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.12 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 18 },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.45 } },
  };

  return (
    <div className="relative pt-4">
      {/* ── Connector Desktop (horizontal) ── */}
      <div
        className="hidden md:block absolute h-[2px] rounded-full"
        style={{ top: 24, left: inset, right: inset, background: LINE_GRADIENT_H, opacity: 0.5 }}
        aria-hidden="true"
      >
        {!reduce && (
          <motion.span
            className="absolute top-1/2 w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{ background: PULSE_BG, boxShadow: '0 0 14px 3px rgba(222,255,154,0.6)' }}
            initial={{ left: '0%' }}
            animate={{ left: ['0%', '100%'] }}
            transition={{ duration: n * 0.7, ease: 'linear', repeat: Infinity }}
          />
        )}
      </div>

      {/* ── Connector Mobile (vertikal) ── */}
      <div
        className="md:hidden absolute w-[2px] rounded-full"
        style={{ left: 23, top: 24, bottom: 24, background: LINE_GRADIENT_V, opacity: 0.5 }}
        aria-hidden="true"
      >
        {!reduce && (
          <motion.span
            className="absolute left-1/2 w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{ background: PULSE_BG, boxShadow: '0 0 14px 3px rgba(222,255,154,0.6)' }}
            initial={{ top: '0%' }}
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: n * 0.7, ease: 'linear', repeat: Infinity }}
          />
        )}
      </div>

      {/* ── Steps ── */}
      <motion.ol
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        className="relative flex flex-col md:grid gap-8 md:gap-4 list-none m-0 p-0"
        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
      >
        {steps.map((step, i) => {
          const title = step.title ?? step.label ?? '';
          const desc = step.desc ?? step.sub;
          return (
            <motion.li
              key={title || i}
              variants={item}
              className="group relative z-10 flex md:flex-col items-start md:items-center gap-4 md:gap-3"
            >
              {/* Nummern-Badge mit Conic-Ring */}
              <div
                className="flex-shrink-0 w-12 h-12 rounded-full p-[2px] transition-transform duration-300 group-hover:scale-110"
                style={{ background: RING, boxShadow: '0 6px 18px -6px rgba(56,189,248,0.5)' }}
              >
                <div className="w-full h-full rounded-full bg-[#0A192F] flex items-center justify-center">
                  <span className="font-poppins font-black text-lg text-[#DEFF9A]" aria-hidden="true">
                    {i + 1}
                  </span>
                </div>
              </div>

              {/* Text */}
              <div className="md:text-center md:px-1">
                <h4 className="font-poppins font-bold text-[15px] text-[#0F1E34] leading-tight mb-1">
                  {title}
                </h4>
                {desc && (
                  <p className="font-arimo text-xs text-[#55637A] leading-snug">{desc}</p>
                )}
              </div>
            </motion.li>
          );
        })}
      </motion.ol>
    </div>
  );
}