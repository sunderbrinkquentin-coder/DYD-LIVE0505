import { useState } from 'react';
import { WizardStepLayout } from '../WizardStepLayout';
import { PersonalData } from '../../../types/cvBuilder';

interface PersonalDataStepProps {
  data: Partial<PersonalData>;
  onChange: (data: PersonalData) => void;
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  showValidationImmediately?: boolean;
}

export function PersonalDataStep({
  data,
  onChange,
  onNext,
  onBack,
  onSkip,
  showValidationImmediately = false,
}: PersonalDataStepProps) {
  const [attempted, setAttempted] = useState(showValidationImmediately);

  const missing = {
    firstName: !data.firstName,
    lastName: !data.lastName,
    city: !data.city,
    email: !data.email,
    phone: !data.phone,
  };

  const isValid = !Object.values(missing).some(Boolean);

  const update = (field: keyof PersonalData, value: string) => {
    onChange({ ...data, [field]: value } as PersonalData);
  };

  const handleNext = () => {
    if (!isValid) {
      setAttempted(true);
      return;
    }
    onNext();
  };

  const fieldClass = (invalid: boolean) =>
    `w-full px-3 py-2.5 rounded-xl border-2 bg-white/5 text-white text-sm sm:text-base placeholder:text-white/40 focus:outline-none focus:bg-white/10 transition-all touch-manipulation ${
      attempted && invalid
        ? 'border-red-500/70 focus:border-red-400'
        : 'border-white/10 focus:border-[#66c0b6]'
    }`;

  return (
    <WizardStepLayout
      title="Wie können Recruiter dich erreichen?"
      subtitle="Nur die wichtigsten Kontaktdaten – keine vollständige Adresse nötig."
      avatarMessage="Recruiter möchten dich schnell kontaktieren können."
      avatarStepInfo="Datenschutz ist wichtig – vollständige Adresse ist nicht nötig, Stadt reicht aus."
      currentStepId="personalData"
      onPrev={onBack}
      onNext={handleNext}
      onSkip={onSkip}
      isNextDisabled={!isValid}
      validationMessage="Vorname, Nachname, Stadt, E-Mail und Telefon werden benötigt – Recruiter müssen dich kontaktieren können."
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-white/80 mb-1.5">
              Vorname *
            </label>
            <input
              type="text"
              value={data.firstName || ''}
              onChange={(e) => update('firstName', e.target.value)}
              placeholder="Max"
              className={fieldClass(missing.firstName)}
            />
            {attempted && missing.firstName && (
              <p className="text-red-400 text-xs mt-1">Bitte Vornamen eingeben</p>
            )}
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-white/80 mb-1.5">
              Nachname *
            </label>
            <input
              type="text"
              value={data.lastName || ''}
              onChange={(e) => update('lastName', e.target.value)}
              placeholder="Mustermann"
              className={fieldClass(missing.lastName)}
            />
            {attempted && missing.lastName && (
              <p className="text-red-400 text-xs mt-1">Bitte Nachnamen eingeben</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm sm:text-base font-semibold text-white/90 mb-2">
            Stadt *
          </label>
          <input
            type="text"
            value={data.city || ''}
            onChange={(e) => update('city', e.target.value)}
            placeholder="Berlin"
            className={fieldClass(missing.city)}
          />
          {attempted && missing.city && (
            <p className="text-red-400 text-xs mt-1">Bitte Stadt eingeben</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-white/80 mb-1.5">
              E-Mail *
            </label>
            <input
              type="email"
              value={data.email || ''}
              onChange={(e) => update('email', e.target.value)}
              placeholder="max@example.com"
              className={fieldClass(missing.email)}
            />
            {attempted && missing.email && (
              <p className="text-red-400 text-xs mt-1">Bitte E-Mail eingeben</p>
            )}
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-white/80 mb-1.5">
              Telefon *
            </label>
            <input
              type="tel"
              value={data.phone || ''}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="+49 151 12345678"
              className={fieldClass(missing.phone)}
            />
            {attempted && missing.phone && (
              <p className="text-red-400 text-xs mt-1">Bitte Telefonnummer eingeben</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm sm:text-base font-semibold text-white/90 mb-2">
            LinkedIn (optional)
          </label>
          <input
            type="url"
            value={data.linkedin || ''}
            onChange={(e) => update('linkedin', e.target.value)}
            placeholder="linkedin.com/in/dein-profil"
            className="w-full px-3 py-2.5 rounded-xl border-2 border-white/10 bg-white/5 text-white text-sm sm:text-base placeholder:text-white/40 focus:outline-none focus:border-[#66c0b6] focus:bg-white/10 transition-all touch-manipulation"
          />
        </div>
      </div>
    </WizardStepLayout>
  );
}
