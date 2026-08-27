import { useState, useRef } from 'react';
import { WizardStepLayout } from '../WizardStepLayout';
import { PersonalData } from '../../../types/cvBuilder';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^\+?[\d\s\-()]{6,}$/;

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
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const headlineRef = useRef<HTMLInputElement | null>(null);
  const linkedinRef = useRef<HTMLInputElement | null>(null);

  const missing = {
    firstName: !data.firstName?.trim(),
    lastName: !data.lastName?.trim(),
    city: !data.city?.trim(),
    email: !data.email?.trim(),
    phone: !data.phone?.trim(),
  };

  const emailInvalid = !!data.email?.trim() && !EMAIL_REGEX.test(data.email.trim());
  const phoneInvalid = !!data.phone?.trim() && !PHONE_REGEX.test(data.phone.trim());

  const isValid =
    !Object.values(missing).some(Boolean) && !emailInvalid && !phoneInvalid;

  const update = (field: keyof PersonalData, value: string) => {
    onChange({ ...data, [field]: value } as PersonalData);
  };

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleNext = () => {
    setAttempted(true);
    setTouched({ email: true, phone: true, firstName: true, lastName: true, city: true });
    if (!isValid) return;
    onNext();
  };

  const handleCoachCta = (field?: string) => {
    const el =
      field === 'headline' ? headlineRef.current :
      field === 'linkedin' ? linkedinRef.current :
      null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
    }
  };

  const fieldClass = (invalid: boolean) =>
    `w-full px-3 py-2.5 rounded-xl border-2 bg-white/5 text-white text-sm sm:text-base placeholder:text-white/40 focus:outline-none focus:bg-white/10 transition-all touch-manipulation ${
      (attempted || touched.field) && invalid
        ? 'border-red-500/70 focus:border-red-400'
        : 'border-white/10 focus:border-[#66c0b6]'
    }`;

  const showError = (field: string, condition: boolean) =>
    (attempted || touched[field]) && condition;

  return (
    <WizardStepLayout
      title="Wie können Recruiter dich erreichen?"
      subtitle="Nur die wichtigsten Kontaktdaten – keine vollständige Adresse nötig."
      helpText={'Tipp: Die Überschrift ist der erste Eindruck – nenne hier deine Kernkompetenz oder Wunschrolle, z. B. \u201eMarketing Manager · B2B SaaS\u201c. Das hilft ATS-Systemen, dich schneller zuzuordnen.'}
      avatarMessage="Recruiter möchten dich schnell kontaktieren können."
      avatarStepInfo="Datenschutz ist wichtig – vollständige Adresse ist nicht nötig, Stadt reicht aus."
      currentStepId="personalData"
      coachData={{ personalData: data }}
      onCoachCta={handleCoachCta}
      onPrev={onBack}
      onNext={handleNext}
      onSkip={onSkip}
      isNextDisabled={!isValid}
      validationMessage="Vorname, Nachname, Stadt, E-Mail und Telefon werden benötigt – mit gültigem Format."
    >
      <div className="space-y-5">
        {/* Gruppe: Name */}
        <div>
          <p className="text-xs font-semibold text-[#66c0b6] uppercase tracking-wider mb-3">Dein Name</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-white/80 mb-1.5">
                Vorname *
              </label>
              <input
                type="text"
                value={data.firstName || ''}
                onChange={(e) => update('firstName', e.target.value)}
                onBlur={() => markTouched('firstName')}
                placeholder="Max"
                className={fieldClass(missing.firstName)}
              />
              {showError('firstName', missing.firstName) && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
                  Bitte Vornamen eingeben
                </p>
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
                onBlur={() => markTouched('lastName')}
                placeholder="Mustermann"
                className={fieldClass(missing.lastName)}
              />
              {showError('lastName', missing.lastName) && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
                  Bitte Nachnamen eingeben
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Gruppe: Profil-Kopfzeile */}
        <div className="pt-2 border-t border-white/10">
          <p className="text-xs font-semibold text-[#66c0b6] uppercase tracking-wider mb-3">Profil-Überschrift</p>
          <div>
            <label className="block text-sm sm:text-base font-semibold text-white/90 mb-2">
              Überschrift <span className="text-white/40 font-normal">(optional)</span>
            </label>
            <input
              ref={headlineRef}
              type="text"
              value={data.headline || ''}
              onChange={(e) => update('headline', e.target.value)}
              placeholder="z. B. Marketing Manager · B2B SaaS"
              className="w-full px-3 py-2.5 rounded-xl border-2 border-white/10 bg-white/5 text-white text-sm sm:text-base placeholder:text-white/40 focus:outline-none focus:border-[#66c0b6] focus:bg-white/10 transition-all touch-manipulation"
            />
            <p className="text-xs text-white/40 mt-1">Deine Ein-Zeilen-Überschrift ganz oben im Lebenslauf – nenne deine stärkste Kompetenz oder angestrebte Rolle.</p>
          </div>
        </div>

        {/* Gruppe: Kontakt */}
        <div className="pt-2 border-t border-white/10">
          <p className="text-xs font-semibold text-[#66c0b6] uppercase tracking-wider mb-3">Kontakt & Standort</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm sm:text-base font-semibold text-white/90 mb-2">
                Stadt *
              </label>
              <input
                type="text"
                value={data.city || ''}
                onChange={(e) => update('city', e.target.value)}
                onBlur={() => markTouched('city')}
                placeholder="Berlin"
                className={fieldClass(missing.city)}
              />
              {showError('city', missing.city) && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
                  Bitte Stadt eingeben
                </p>
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
                  onBlur={() => markTouched('email')}
                  placeholder="max@example.com"
                  className={fieldClass(missing.email || emailInvalid)}
                />
                {showError('email', missing.email) && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
                    Bitte E-Mail-Adresse eingeben
                  </p>
                )}
                {showError('email', emailInvalid) && !missing.email && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
                    Ungültiges E-Mail-Format – bitte prüfe die Eingabe (z. B. max@example.com)
                  </p>
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
                  onBlur={() => markTouched('phone')}
                  placeholder="+49 151 12345678"
                  className={fieldClass(missing.phone || phoneInvalid)}
                />
                {showError('phone', missing.phone) && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
                    Bitte Telefonnummer eingeben
                  </p>
                )}
                {showError('phone', phoneInvalid) && !missing.phone && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
                    Ungültiges Format – nur Ziffern, +, Leerzeichen und Bindestriche erlaubt
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold text-white/90 mb-2">
                LinkedIn <span className="text-white/40 font-normal">(optional)</span>
              </label>
              <input
                ref={linkedinRef}
                type="url"
                value={data.linkedin || ''}
                onChange={(e) => update('linkedin', e.target.value)}
                placeholder="linkedin.com/in/dein-profil"
                className="w-full px-3 py-2.5 rounded-xl border-2 border-white/10 bg-white/5 text-white text-sm sm:text-base placeholder:text-white/40 focus:outline-none focus:border-[#66c0b6] focus:bg-white/10 transition-all touch-manipulation"
              />
            </div>
          </div>
        </div>
      </div>
    </WizardStepLayout>
  );
}
