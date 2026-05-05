import { Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Step {
  id: string;
  label: string;
  shortLabel?: string;
}

interface WizardProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps: Set<number>;
  incompleteSteps?: Set<number>;
  onStepClick?: (index: number) => void;
}

export function WizardProgressIndicator({
  steps,
  currentStep,
  completedSteps,
  incompleteSteps = new Set(),
  onStepClick,
}: WizardProgressIndicatorProps) {
  const progressPercent = Math.round(((currentStep + 1) / steps.length) * 100);
  const currentStepData = steps[currentStep];
  const nextStep = steps[currentStep + 1];

  return (
    <div className="w-full bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border-b border-white/10">

      {/* ── Mobile: horizontally scrollable step bubbles + progress bar ── */}
      <div className="lg:hidden px-4 pt-3 pb-2">
        {/* Step dots row – scrollable */}
        <div className="overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <div className="flex items-center gap-1 min-w-max mx-auto w-fit">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = completedSteps.has(index) || index < currentStep;
              const isIncomplete = incompleteSteps.has(index) && !isActive;
              const isClickable = !isActive;
              const label = step.shortLabel || step.label;

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => isClickable && onStepClick?.(index)}
                    className={`
                      flex flex-col items-center gap-0.5
                      ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                    `}
                  >
                    <div
                      className={`
                        relative w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                        font-semibold text-[10px] transition-all duration-300
                        ${isActive
                          ? 'bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] text-[#0a0a0a] shadow-lg shadow-[#66c0b6]/30 ring-2 ring-[#66c0b6]/40 ring-offset-1 ring-offset-transparent'
                          : isIncomplete
                          ? 'bg-orange-500/15 text-orange-400 border border-orange-500/40'
                          : isCompleted
                          ? 'bg-[#66c0b6]/20 text-[#66c0b6] border border-[#66c0b6]/40'
                          : 'bg-white/5 text-white/30 border border-white/10'
                        }
                      `}
                    >
                      {isIncomplete ? (
                        <AlertCircle size={12} strokeWidth={2.5} />
                      ) : isCompleted && !isActive ? (
                        <Check size={12} strokeWidth={3} />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <span
                      className={`
                        text-[9px] font-medium leading-tight max-w-[52px] text-center truncate
                        ${isActive ? 'text-[#66c0b6]' : isIncomplete ? 'text-orange-400/70' : isCompleted ? 'text-white/50' : 'text-white/25'}
                      `}
                    >
                      {label}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-4 h-px flex-shrink-0 mx-0.5 rounded-full transition-colors duration-500 ${
                        index < currentStep ? 'bg-[#66c0b6]' : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress bar + step counter */}
        <div className="flex items-center justify-between mt-2 mb-1">
          <span className="text-[10px] text-white/50 truncate max-w-[160px]">
            {nextStep
              ? <>Weiter: <span className="text-white/70">{nextStep.shortLabel || nextStep.label}</span></>
              : <span className="text-[#66c0b6] font-semibold">Fast fertig!</span>
            }
          </span>
          <span className="text-xs font-bold text-[#66c0b6] flex-shrink-0 ml-2">
            {currentStep + 1} / {steps.length}
          </span>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] rounded-full"
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* ── Desktop: full step list in a single row ── */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-1">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = completedSteps.has(index);
            const isPast = index < currentStep;
            const isIncomplete = incompleteSteps.has(index) && !isActive;
            const isLast = index === steps.length - 1;
            const isClickable = !isActive;

            return (
              <div key={step.id} className="flex items-center flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <motion.div
                    className="relative flex-shrink-0"
                    animate={isActive ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                    transition={isActive ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}}
                  >
                    <div
                      onClick={() => isClickable && onStepClick?.(index)}
                      title={isPast ? `Zurück zu: ${step.label}` : isActive ? step.label : `Springen zu: ${step.label}`}
                      className={`
                        w-7 h-7 rounded-full flex items-center justify-center
                        transition-all duration-300 font-semibold text-[10px]
                        ${isClickable ? 'cursor-pointer hover:ring-2 hover:ring-[#66c0b6]/60 hover:scale-110' : ''}
                        ${
                          isActive
                            ? 'bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] text-[#0a0a0a] shadow-lg shadow-[#66c0b6]/30'
                            : isIncomplete
                            ? 'bg-orange-500/15 text-orange-400 border border-orange-500/40'
                            : isCompleted || isPast
                            ? 'bg-[#66c0b6]/20 text-[#66c0b6] border border-[#66c0b6]/40'
                            : 'bg-white/5 text-white/40 border border-white/10'
                        }
                      `}
                    >
                      {isIncomplete ? (
                        <AlertCircle size={12} strokeWidth={2.5} />
                      ) : isCompleted || isPast ? (
                        <Check size={12} strokeWidth={3} />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-[#66c0b6]/30"
                        animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                      />
                    )}
                  </motion.div>

                  {/* Label – always visible on lg, just truncate hard */}
                  <div className="flex-1 min-w-0">
                    <motion.p
                      animate={isActive ? { opacity: [0.7, 1, 0.7] } : {}}
                      transition={isActive ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
                      onClick={() => isClickable && onStepClick?.(index)}
                      className={`
                        text-[10px] font-medium truncate transition-all duration-300 leading-tight
                        ${isClickable ? 'cursor-pointer hover:text-[#66c0b6]' : ''}
                        ${
                          isActive
                            ? 'text-[#66c0b6]'
                            : isIncomplete
                            ? 'text-orange-400/80'
                            : isCompleted || isPast
                            ? 'text-white/60'
                            : 'text-white/35 hover:text-white/60'
                        }
                      `}
                    >
                      {step.shortLabel || step.label}
                    </motion.p>
                  </div>
                </div>

                {!isLast && (
                  <div className="flex-shrink-0 w-3 lg:w-5 h-px mx-1">
                    <div
                      className={`
                        h-full rounded-full transition-all duration-500
                        ${
                          isPast || isCompleted
                            ? 'bg-gradient-to-r from-[#66c0b6] to-[#30E3CA]'
                            : 'bg-white/10'
                        }
                      `}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-2.5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-white/40">Gesamtfortschritt</p>
            {nextStep && (
              <p className="text-[10px] text-white/40">
                Weiter: <span className="text-white/60 font-medium">{nextStep.shortLabel || nextStep.label}</span>
              </p>
            )}
          </div>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] rounded-full"
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
