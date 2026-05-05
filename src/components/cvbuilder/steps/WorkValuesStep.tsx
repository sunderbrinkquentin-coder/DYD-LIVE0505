import { useState } from 'react';
import { WizardStepLayout } from '../WizardStepLayout';
import { WorkValues } from '../../../types/cvBuilder';

interface WorkValuesStepProps {
  currentStep: number;
  totalSteps: number;
  initialValues?: WorkValues;
  onNext: (values: WorkValues) => void;
  onPrev: () => void;
}

const WORK_VALUE_OPTIONS = [
  "Teamwork",
  "Eigenverantwortung",
  "Struktur & Klarheit",
  "Kreativität",
  "Weiterentwicklung",
  "Impact / Sinnhaftigkeit",
  "Flexibilität",
  "Offene Kommunikation",
  "Lernkultur",
  "Stabilität & Sicherheit",
];

const WORK_STYLE_OPTIONS = [
  "Hands-on",
  "Analytisch",
  "Pragmatisch",
  "Strukturiert",
  "Kundenorientiert",
  "Schnell & umsetzungsstark",
  "Detailorientiert",
  "Kommunikativ",
];

export function WorkValuesStep({
  currentStep,
  totalSteps,
  initialValues,
  onNext,
  onPrev,
}: WorkValuesStepProps) {

  const [values, setValues] = useState<string[]>(initialValues?.values ?? []);
  const [workStyle, setWorkStyle] = useState<string[]>(initialValues?.workStyle ?? []);

  const toggleValue = (list: string[], setter: (v: string[]) => void, item: string) => {
    setter(list.includes(item) ? list.filter((v) => v !== item) : [...list, item]);
  };

  const handleNext = () => {
    onNext({
      values,
      workStyle,
    });
  };

  const disableNext = values.length === 0 && workStyle.length === 0;

  return (
    <WizardStepLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title="Arbeitswerte & Arbeitsweise"
      subtitle="Wähle 3–5 Werte und Eigenschaften aus, die deinen Stil am besten widerspiegeln."
      currentStepId="workValues"
      onPrev={onPrev}
      onNext={handleNext}
      isNextDisabled={disableNext}
      nextButtonText="Weiter"
      avatarMessage="Werte zeigen Cultural Fit"
      avatarStepInfo="Wähle, was dich im Arbeitsalltag wirklich ausmacht."
    >
      <div className="space-y-6">

        {/* Arbeitswerte */}
        <div>
          <h2 className="text-base font-semibold text-white mb-1.5">Arbeitswerte</h2>
          <p className="text-white/60 text-xs mb-3">
            Was ist dir im Job wirklich wichtig?
          </p>
          <div className="flex flex-wrap gap-2">
            {WORK_VALUE_OPTIONS.map((opt) => {
              const active = values.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleValue(values, setValues, opt)}
                  className={`px-3 py-2 rounded-full text-sm border transition ${
                    active
                      ? "bg-[#66c0b6] text-black border-transparent"
                      : "bg-white/5 text-white/80 border-white/20 hover:bg-white/10"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Arbeitsstil */}
        <div>
          <h2 className="text-base font-semibold text-white mb-1.5">Arbeitsstil</h2>
          <p className="text-white/60 text-xs mb-3">
            Wie arbeitest du im Alltag? Wähle Eigenschaften aus deinem Arbeitsstil.
          </p>
          <div className="flex flex-wrap gap-2">
            {WORK_STYLE_OPTIONS.map((opt) => {
              const active = workStyle.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleValue(workStyle, setWorkStyle, opt)}
                  className={`px-3 py-2 rounded-full text-sm border transition ${
                    active
                      ? "bg-[#66c0b6] text-black border-transparent"
                      : "bg-white/5 text-white/80 border-white/20 hover:bg-white/10"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </WizardStepLayout>
  );
}
