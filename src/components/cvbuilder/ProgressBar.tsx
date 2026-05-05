import { useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const STEP_NAMES = [
  'Start',
  'Persönliche Daten',
  'Schulbildung',
  'Ausbildung / Studium',
  'Berufserfahrung',
  'Projekte',
  'Hard Skills & Sprachen',
  'Soft Skills',
  'Arbeitswerte',
  'Arbeitsstil',
  'Hobbys & Interessen',
  'Abschluss'
];

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const percentage = (currentStep / totalSteps) * 100;
  const nextStep = currentStep < totalSteps - 1 ? currentStep + 1 : null;

  return (
    <div className="w-full lg:mb-8">
      {/* Progress Bar */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-base font-medium text-white/70">
          Schritt {currentStep} von {totalSteps}
        </span>
        <span className="text-base text-[#66c0b6] font-bold">
          {Math.round(percentage)}%
        </span>
      </div>

      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden shadow-inner mb-6">
        <div
          className="h-full bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] transition-all duration-500 ease-out rounded-full shadow-lg"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Current & Next Step Info */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <p className="text-xs text-white/50 mb-1">Aktueller Schritt</p>
            <p className="text-lg font-semibold text-white">
              {STEP_NAMES[currentStep] || `Schritt ${currentStep}`}
            </p>
          </div>

          {nextStep !== null && (
            <div className="flex-1 border-l border-white/10 pl-4 ml-4">
              <p className="text-xs text-white/50 mb-1">Als Nächstes</p>
              <p className="text-sm font-medium text-[#66c0b6]">
                {STEP_NAMES[nextStep] || `Schritt ${nextStep}`}
              </p>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 text-sm text-white/60 hover:text-white/90 transition-colors pt-2 border-t border-white/10 mt-2"
        >
          {isExpanded ? 'Übersicht ausblenden' : 'Alle Schritte anzeigen'}
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expandable Step Overview */}
      {isExpanded && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 animate-fade-in">
          <p className="text-sm font-semibold text-white/90 mb-3">Alle Schritte im Überblick</p>
          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
            {STEP_NAMES.map((name, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  index === currentStep
                    ? 'bg-[#66c0b6]/20 border border-[#66c0b6]/40'
                    : index < currentStep
                    ? 'bg-white/5 border border-white/5'
                    : 'bg-white/[0.02] border border-white/5'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    index < currentStep
                      ? 'bg-[#66c0b6] text-black'
                      : index === currentStep
                      ? 'bg-[#66c0b6]/40 text-[#66c0b6] border-2 border-[#66c0b6]'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {index < currentStep ? (
                    <Check size={14} />
                  ) : (
                    <span className="text-xs font-bold">{index}</span>
                  )}
                </div>
                <span
                  className={`text-sm ${
                    index === currentStep
                      ? 'text-white font-semibold'
                      : index < currentStep
                      ? 'text-white/70'
                      : 'text-white/40'
                  }`}
                >
                  {name}
                </span>
                {index === currentStep && (
                  <span className="ml-auto text-xs text-[#66c0b6] font-medium">Aktuell</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
