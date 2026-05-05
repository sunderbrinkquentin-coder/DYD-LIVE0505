import { MessageCircle, CheckCircle, Lightbulb, Star } from 'lucide-react';
import { WIZARD_STEP_CONTENT, StepContent } from '../../config/wizardStepContent';

interface AvatarSidebarProps {
  message: string;
  stepInfo?: string;
  currentStepId?: string;
}

export function AvatarSidebar({ message, stepInfo, currentStepId }: AvatarSidebarProps) {
  const stepContent: StepContent | undefined = currentStepId
    ? WIZARD_STEP_CONTENT[currentStepId]
    : undefined;

  return (
    <div className="hidden lg:block lg:w-72 xl:w-80 flex-shrink-0">
      <div className="sticky top-24 space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#66c0b6]/30 to-[#30E3CA]/30 blur-3xl rounded-full"></div>

          <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#66c0b6]/40 to-[#30E3CA]/40 blur-2xl rounded-full"></div>
                <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] flex items-center justify-center shadow-xl border-2 border-white/10">
                  <svg viewBox="0 0 100 100" className="w-16 h-16">
                    <circle cx="50" cy="35" r="18" fill="#0a0a0a" />
                    <ellipse cx="50" cy="70" rx="28" ry="32" fill="#0a0a0a" />
                    <circle cx="44" cy="32" r="3" fill="white" />
                    <circle cx="56" cy="32" r="3" fill="white" />
                    <path d="M 42 42 Q 50 46 58 42" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MessageCircle size={20} className="text-[#66c0b6] mt-1 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-base text-white/95 leading-relaxed font-medium">
                    {message}
                  </p>
                  {stepInfo && (
                    <p className="text-sm text-white/70 leading-relaxed">
                      {stepInfo}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <div className="w-2 h-2 rounded-full bg-[#66c0b6] animate-pulse"></div>
                <span>Ich bin die ganze Zeit für dich da</span>
              </div>
            </div>
          </div>
        </div>

        {stepContent && (
          <>
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-[#66c0b6] mb-3 flex items-center gap-2">
                <MessageCircle size={16} />
                Warum ist das wichtig?
              </h3>
              <p className="text-sm text-white/80 leading-relaxed">
                {stepContent.why}
              </p>
            </div>

            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-[#66c0b6] mb-3 flex items-center gap-2">
                <CheckCircle size={16} />
                Was gehört rein?
              </h3>
              <ul className="space-y-2">
                {stepContent.whatToInclude.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-white/80">
                    <span className="text-[#66c0b6] mt-0.5">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-[#66c0b6] mb-3 flex items-center gap-2">
                <Star size={16} />
                Deine Vorteile
              </h3>
              <ul className="space-y-2">
                {stepContent.advantages.map((advantage, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-white/80">
                    <span className="text-[#66c0b6] mt-0.5">✓</span>
                    <span className="leading-relaxed">{advantage}</span>
                  </li>
                ))}
              </ul>
            </div>

            {stepContent.tip && (
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                  <Lightbulb size={16} />
                  Profi-Tipp
                </h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  {stepContent.tip}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
