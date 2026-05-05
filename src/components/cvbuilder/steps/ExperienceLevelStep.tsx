import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { ExperienceLevel } from '../../../types/cvBuilder';
import { AvatarSidebar } from '../AvatarSidebar';

interface ExperienceLevelStepProps {
  value?: ExperienceLevel;
  onChange?: (level: ExperienceLevel) => void;
  onNext: (level?: ExperienceLevel) => void;
  onBack?: () => void;
  uploadSlot?: React.ReactNode;
}

const options = [
  {
    id: 'beginner' as ExperienceLevel,
    title: 'Ich stehe am Anfang meiner Karriere',
    description: 'Schüler, Studierende, Absolventen ohne Berufserfahrung',
    benefit: '✨ Wir fokussieren auf Ausbildung & Projekte'
  },
  {
    id: 'some-experience' as ExperienceLevel,
    title: 'Ich habe erste praktische Erfahrungen gesammelt',
    description: 'Praktika, Werkstudententätigkeit, Nebenjobs (0–3 Jahre)',
    benefit: '🚀 Wir heben deine Erfahrungen optimal hervor'
  },
  {
    id: 'experienced' as ExperienceLevel,
    title: 'Ich bringe relevante Berufserfahrung mit',
    description: '3–10+ Jahre Erfahrung in meinem Bereich',
    benefit: '💼 Wir machen deine Erfolge messbar & konkret'
  }
];

export function ExperienceLevelStep({
  onNext,
  onBack,
  uploadSlot,
}: ExperienceLevelStepProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:p-6 lg:max-w-7xl lg:mx-auto">
      <div className="flex-1 space-y-4 lg:space-y-6 animate-fade-in px-4 sm:px-0">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold bg-gradient-to-r from-white via-[#66c0b6] to-white bg-clip-text text-transparent leading-tight px-2">
            Wo stehst du gerade in deiner Karriere?
          </h1>
          <p className="text-sm sm:text-base text-white/60 leading-relaxed px-2">
            Wir passen alle Fragen individuell an deine Situation an.
          </p>
        </div>

        {uploadSlot && (
          <div className="max-w-4xl mx-auto w-full">
            {uploadSlot}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 max-w-4xl mx-auto">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onNext(option.id)}
              className="group relative rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 hover:bg-white/10 hover:border-[#66c0b6]/40 transition-all duration-300 shadow-lg hover:shadow-[0_0_40px_rgba(102,192,182,0.3)] cursor-pointer text-left hover:scale-[1.01]"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#66c0b6]/20 to-[#30E3CA]/20 flex items-center justify-center border border-[#66c0b6]/30 group-hover:scale-110 transition-transform flex-shrink-0">
                  <Check size={20} className="text-[#66c0b6]" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-0.5 group-hover:text-[#66c0b6] transition-colors">
                    {option.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/60 mb-1">
                    {option.description}
                  </p>
                  <p className="text-xs text-[#66c0b6] font-medium">
                    {option.benefit}
                  </p>
                </div>

                <ArrowRight size={20} className="text-[#66c0b6] group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>

        <div className="text-center px-4">
          <p className="text-xs text-white/40">
            Deine Antworten bleiben bei dir und werden nicht an Dritte weitergegeben
          </p>
        </div>

        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#020617] via-[#020617]/95 to-transparent z-50 px-4 pb-safe pb-4 pt-3">
          <div className="flex items-center">
            <button
              onClick={onBack}
              disabled={!onBack}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-white/70 hover:text-white active:bg-white/10 transition-all touch-manipulation min-w-[90px] disabled:opacity-0 disabled:pointer-events-none"
            >
              <ArrowLeft size={18} />
              <span className="font-medium text-sm">Zurück</span>
            </button>
          </div>
        </div>

        <div className="hidden lg:flex items-center pt-2">
          <button
            onClick={onBack}
            disabled={!onBack}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all disabled:opacity-0 disabled:pointer-events-none"
          >
            <ArrowLeft size={20} />
            Zurück
          </button>
        </div>
      </div>

      <div className="lg:block hidden">
        <AvatarSidebar
          message="Deine Antwort hilft uns, die perfekten Fragen und Empfehlungen für deinen CV zu geben."
          stepInfo="Jeder Karriereweg ist einzigartig – wir passen uns deiner Situation an."
          currentStepId="experienceLevel"
        />
      </div>
    </div>
  );
}
