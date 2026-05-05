import { useState, ReactNode } from 'react';
import { ArrowLeft, ArrowRight, SkipForward } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { AvatarSidebar } from './AvatarSidebar';

interface WizardStepLayoutProps {
  currentStep?: number;
  totalSteps?: number;
  title: string;
  subtitle?: string;
  avatarMessage?: string;
  avatarStepInfo?: string;
  currentStepId?: string;
  onPrev?: () => void;
  onNext: () => void;
  onSkip?: () => void;
  isNextDisabled?: boolean;
  nextButtonText?: string;
  hideProgress?: boolean;
  validationMessage?: string;
  children: ReactNode;
}

export function WizardStepLayout({
  currentStep,
  totalSteps,
  title,
  subtitle,
  avatarMessage,
  avatarStepInfo,
  currentStepId,
  onPrev,
  onNext,
  onSkip,
  isNextDisabled = false,
  nextButtonText = 'Weiter',
  hideProgress = false,
  validationMessage,
  children
}: WizardStepLayoutProps) {
  const [showValidationHint, setShowValidationHint] = useState(false);

  const handleNextClick = () => {
    if (isNextDisabled) {
      setShowValidationHint(true);
      return;
    }
    setShowValidationHint(false);
    onNext();
  };

  const handleSkip = () => {
    setShowValidationHint(false);
    onSkip?.();
  };

  const NextButton = ({ mobile }: { mobile?: boolean }) => (
    <button
      onClick={handleNextClick}
      className={
        mobile
          ? `flex-1 px-5 py-3 rounded-xl font-bold text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg touch-manipulation ${
              isNextDisabled
                ? 'bg-gradient-to-r from-[#66c0b6]/60 to-[#30E3CA]/60 text-black/70'
                : 'bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black hover:opacity-90'
            }`
          : `px-12 py-4 rounded-2xl font-bold text-lg transition-all flex items-center gap-3 shadow-2xl ml-auto ${
              isNextDisabled
                ? 'bg-gradient-to-r from-[#66c0b6]/60 to-[#30E3CA]/60 text-black/70 cursor-pointer'
                : 'bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black hover:opacity-90 hover:scale-105'
            }`
      }
    >
      {nextButtonText}
      <ArrowRight size={mobile ? 20 : 22} />
    </button>
  );

  const ValidationHint = () => (
    showValidationHint && isNextDisabled ? (
      <div className="mx-4 mb-2 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 animate-fade-in lg:mx-0 lg:mt-3">
        <p className="text-amber-400 text-sm font-medium">
          {validationMessage || 'Bitte fülle die markierten Pflichtfelder aus, um fortzufahren.'}
        </p>
        {onSkip && (
          <button
            onClick={handleSkip}
            className="mt-2 flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            <SkipForward size={13} />
            Diesen Schritt überspringen
          </button>
        )}
      </div>
    ) : null
  );

  return (
    <div className="h-full flex flex-col lg:flex-row lg:gap-8 lg:p-6 lg:max-w-7xl lg:mx-auto">
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full lg:h-auto">
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto lg:overflow-visible px-4 lg:px-0 pt-4 pb-28 lg:pt-0 lg:pb-0">
          <div className="max-w-3xl mx-auto space-y-4 lg:space-y-6">
            {/* Title Section */}
            <div className="text-center space-y-1.5 lg:space-y-3 animate-fade-in">
              <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold bg-gradient-to-r from-white via-[#66c0b6] to-white bg-clip-text text-transparent leading-tight px-2">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm sm:text-base lg:text-lg text-white/60 px-2">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Step Content */}
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </div>

        {/* Bottom Navigation - Fixed on Mobile */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#020617] via-[#020617]/95 to-transparent z-50 pt-3">
          <ValidationHint />
          <div className="flex justify-between items-center gap-3 px-4 pb-safe pb-4">
            <button
              onClick={onPrev}
              disabled={!onPrev}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-white/70 hover:text-white active:bg-white/10 transition-all touch-manipulation min-w-[90px] disabled:opacity-0 disabled:pointer-events-none"
            >
              <ArrowLeft size={18} />
              <span className="font-medium text-sm">Zurück</span>
            </button>
            <NextButton mobile />
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:block pt-6">
          <ValidationHint />
          <div className="flex justify-between items-center">
            <button
              onClick={onPrev}
              disabled={!onPrev}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all disabled:opacity-0 disabled:pointer-events-none"
            >
              <ArrowLeft size={20} />
              Zurück
            </button>
            <NextButton />
          </div>
        </div>
      </div>

      {/* Avatar Sidebar - Desktop Only */}
      {avatarMessage && (
        <div className="hidden lg:block">
          <AvatarSidebar
            message={avatarMessage}
            stepInfo={avatarStepInfo}
            currentStepId={currentStepId}
          />
        </div>
      )}
    </div>
  );
}
