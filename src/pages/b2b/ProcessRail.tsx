import { Fragment } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  ScanSearch, Target, Gauge, Route, GraduationCap, Rocket,
  User, Briefcase, Search, BookOpen, Send, TrendingUp,
  ArrowDownRight, ArrowUpRight, ArrowDown,
} from 'lucide-react';

/** Defensiv: unterstützt {title,desc} oder {label,sub}, optional icon-Key. */
export type ProcessStep = {
  title?: string;
  label?: string;
  desc?: string;
  sub?: string;
  icon?: string;
};

// Optionale Icon-Zuordnung aus content.ts (step.icon = 'target' …)
const iconMap: Record<string, typeof Target> = {
  scan: ScanSearch, target: Target, gap: Gauge, route: Route,
  grad: GraduationCap, rocket: Rocket, user: User, briefcase: Briefcase,
  search: Search, book: BookOpen, lead: Send, growth: TrendingUp,
};
// Fallback, falls kein icon gesetzt ist – wird zyklisch verwendet
const DEFAULT_ICONS = [ScanSearch, Target, Gauge, Route, GraduationCap, Rocket];

const OFFSET = 20; // Zickzack-Versatz in px

export default function ProcessRail({ steps }: { steps: ProcessStep[] }) {
  const reduce = useReducedMotion() ?? false;
  const n = steps.length;

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.1 } },
  };
  const cardVariant = (offset: number): Variants => ({
    hidden: { opacity: 0, y: reduce ? offset : offset + 14 },
    show: { opacity: 1, y: offset, transition: { duration: reduce ? 0 : 0.45, ease: 'easeOut' } },
  });
  const connVariant: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: reduce ? 0 : 0.3 } },
  };

  const resolve = (step: ProcessStep, i: number) => ({
    title: step.title ?? step.label ?? '',
    desc: step.desc ?? step.sub,
    Icon: (step.icon && iconMap[step.icon]) ?? DEFAULT_ICONS[i % DEFAULT_ICONS.length],
  });

  const Card = ({ step, i, offset }: { step: ProcessStep; i: number; offset: number }) => {
    const { title, desc, Icon } = resolve(step, i);
    return (
      <motion.div variants={cardVariant(offset)} role="listitem" className="flex-1 min-w-0">
        <div className="group relative h-full rounded-2xl bg-white border border-[#E3EBF5] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#38BDF8]/40 hover:shadow-xl hover:shadow-[#38BDF8]/10">
          {/* Ghost-Nummer für editorialen Look */}
          <span
            aria-hidden="true"
            className="absolute top-1.5 right-3 font-poppins font-black text-4xl leading-none select-none text-[#0A192F]/5"
          >
            {i + 1}
          </span>

          {/* Icon-Chip mit Nummern-Badge */}
          <div className="relative inline-flex mb-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(222,255,154,0.20))',
                border: '1px solid rgba(56,189,248,0.28)',
              }}
            >
              <Icon className="w-5 h-5 text-[#0A192F]" aria-hidden="true" />
            </div>
            <span
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-poppins font-black text-[#0A192F]"
              style={{ background: 'linear-gradient(135deg, #38BDF8, #DEFF9A)' }}
            >
              {i + 1}
            </span>
          </div>

          <h4 className="font-poppins font-bold text-sm text-[#0F1E34] leading-tight mb-1">{title}</h4>
          {desc && <p className="font-arimo text-xs text-[#55637A] leading-snug">{desc}</p>}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="pt-6 pb-2">
      {/* ── Desktop: Zickzack-Reihe mit diagonalen Verbindern ── */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        role="list"
        className="hidden md:flex items-stretch justify-center gap-1"
      >
        {steps.map((step, i) => {
          const up = i % 2 === 0;
          const goesDown = up; // von „oben"-Karte zur nächsten „unten"-Karte
          return (
            <Fragment key={(step.title ?? step.label ?? '') + i}>
              <Card step={step} i={i} offset={up ? -OFFSET : OFFSET} />
              {i < n - 1 && (
                <motion.div variants={connVariant} aria-hidden="true" className="flex-none self-center px-0.5">
                  {goesDown ? (
                    <ArrowDownRight className="w-5 h-5 text-[#38BDF8]" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-[#38BDF8]" />
                  )}
                </motion.div>
              )}
            </Fragment>
          );
        })}
      </motion.div>

      {/* ── Mobile: gestapelt mit Abwärtspfeilen ── */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        role="list"
        className="md:hidden flex flex-col items-stretch gap-0"
      >
        {steps.map((step, i) => (
          <Fragment key={(step.title ?? step.label ?? '') + i}>
            <Card step={step} i={i} offset={0} />
            {i < n - 1 && (
              <motion.div variants={connVariant} aria-hidden="true" className="self-center py-1.5">
                <ArrowDown className="w-5 h-5 text-[#38BDF8]" />
              </motion.div>
            )}
          </Fragment>
        ))}
      </motion.div>
    </div>
  );
}