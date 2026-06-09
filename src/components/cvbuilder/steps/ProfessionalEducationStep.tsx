import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { WizardStepLayout } from '../WizardStepLayout';
import { ProfessionalEducation, EducationType } from '../../../types/cvBuilder';

interface ProfessionalEducationStepProps {
  data?: ProfessionalEducation[];
  experienceLevel?: string;
  onChange: (data: ProfessionalEducation[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

const EDUCATION_TYPES: { value: EducationType; label: string; description: string }[] = [
  { value: 'university', label: 'Studium (Bachelor / Master / Diplom)', description: 'Universität oder Fachhochschule' },
  { value: 'apprenticeship', label: 'Ausbildung (dual / schulisch)', description: 'Berufsausbildung mit IHK-Abschluss' },
  { value: 'certification', label: 'Weiterbildung / Zertifikat', description: 'z.B. Online-Kurs, Bootcamp, Zertifizierung' },
  { value: 'school', label: 'Fachschule / Meister / Techniker', description: 'Weiterbildender Abschluss' }
];

const MONTHS = [
  '01', '02', '03', '04', '05', '06',
  '07', '08', '09', '10', '11', '12',
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => (CURRENT_YEAR - i).toString());

const inputClass = 'w-full px-3 py-2.5 rounded-xl border-2 border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#66c0b6] focus:bg-white/10 transition-all';
const selectClass = 'w-full px-2 py-2.5 rounded-xl border-2 border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#66c0b6] focus:bg-white/10 transition-all text-sm';

export function ProfessionalEducationStep({ data = [], experienceLevel, onChange, onNext, onBack, onSkip }: ProfessionalEducationStepProps) {
  const isBeginner = experienceLevel === 'beginner';
  const [attempted, setAttempted] = useState(false);
  const [entries, setEntries] = useState<ProfessionalEducation[]>(
    data.length > 0 ? data : [{
      type: 'university',
      institution: '',
      degree: '',
      startMonth: '',
      startYear: '',
      endMonth: '',
      endYear: '',
      location: '',
      focus: [],
      projects: [],
      grades: ''
    }]
  );

  const updateEntry = (index: number, field: keyof ProfessionalEducation, value: any) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
    onChange(updated);
  };

  const addEntry = () => {
    const newEntry: ProfessionalEducation = {
      type: 'university',
      institution: '',
      degree: '',
      startMonth: '',
      startYear: '',
      endMonth: '',
      endYear: '',
      location: '',
      focus: [],
      projects: [],
      grades: ''
    };
    const updated = [...entries, newEntry];
    setEntries(updated);
    onChange(updated);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      const updated = entries.filter((_, i) => i !== index);
      setEntries(updated);
      onChange(updated);
    }
  };

// Filtert leere Geister-Einträge heraus, bei denen nichts eingetippt wurde
  const activeEntries = entries.filter(e => e.institution?.trim() || e.degree?.trim());

  // Validiert nur die Einträge, die auch wirklich Daten enthalten
  const isValid = activeEntries.every(e => 
    e.type && 
    e.institution?.trim() && 
    e.degree?.trim() && 
    e.startYear && 
    e.endYear
  );

  const handleNext = () => {
    if (!isValid) {
      setAttempted(true);
      return;
    }
    // Bereinigt die Daten vor dem Speichern, damit keine leeren Dummys in der Datenbank landen
    const cleanedEntries = activeEntries.length > 0 ? activeEntries : [];
    onChange(cleanedEntries);
    onNext();
  };

  const dynInput = (value: string | undefined) =>
    `w-full px-3 py-2.5 rounded-xl border-2 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:bg-white/10 transition-all ${
      attempted && !value ? 'border-red-500/70 focus:border-red-400' : 'border-white/10 focus:border-[#66c0b6]'
    }`;

  const dynSelect = (value: string | undefined) =>
    `w-full px-2 py-2.5 rounded-xl border-2 bg-white/5 text-white focus:outline-none focus:bg-white/10 transition-all text-sm ${
      attempted && !value ? 'border-red-500/70 focus:border-red-400' : 'border-white/10 focus:border-[#66c0b6]'
    }`;

  return (
    <WizardStepLayout
      title={isBeginner ? 'Ausbildung oder Studium' : 'Deine Ausbildung & Studium'}
      subtitle={
        isBeginner
          ? 'Machst du eine Ausbildung oder studierst du? Gib hier deine aktuelle oder geplante Qualifikation an.'
          : 'Füge deine berufliche Ausbildung und akademische Laufbahn hinzu.'
      }
      avatarMessage={isBeginner ? 'Deine Ausbildung ist dein Fundament!' : 'Ausbildung zeigt Recruiter deine fachliche Qualifikation.'}
      avatarStepInfo="Gib alle relevanten Abschlüsse an - auch unvollständige sind wertvoll."
      currentStepId="professionalEducation"
      onPrev={onBack}
      onNext={handleNext}
      onSkip={onSkip}
      isNextDisabled={!isValid}
      validationMessage="Bitte fülle Institution, Abschluss und Zeitraum aus – diese Informationen sind auf deinem Lebenslauf sichtbar."
      hideProgress
    >
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <div
            key={index}
            className="relative p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3"
          >
            {entries.length > 1 && (
              <button
                onClick={() => removeEntry(index)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                type="button"
              >
                <Trash2 size={18} />
              </button>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">
                  Art der Ausbildung *
                </label>
                <select
                  value={entry.type}
                  onChange={(e) => updateEntry(index, 'type', e.target.value as EducationType)}
                  className={dynInput(entry.type)}
                >
                  {EDUCATION_TYPES.map((type) => (
                    <option key={type.value} value={type.value} className="bg-slate-900">
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-white/50 mt-1">
                  {EDUCATION_TYPES.find(t => t.value === entry.type)?.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-2">
                    Institution / Schule *
                  </label>
                  <input
                    type="text"
                    value={entry.institution}
                    onChange={(e) => updateEntry(index, 'institution', e.target.value)}
                    placeholder="z.B. TU München, IHK München"
                    className={dynInput(entry.institution)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-2">
                    Ort (optional)
                  </label>
                  <input
                    type="text"
                    value={entry.location || ''}
                    onChange={(e) => updateEntry(index, 'location', e.target.value)}
                    placeholder="z.B. München, Berlin"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">
                  Abschluss / Fachrichtung *
                </label>
                <input
                  type="text"
                  value={entry.degree}
                  onChange={(e) => updateEntry(index, 'degree', e.target.value)}
                  placeholder="z.B. Bachelor Informatik, Kaufmann für Büromanagement"
                  className={dynInput(entry.degree)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-2">
                    Von *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={entry.startMonth || ''}
                      onChange={(e) => updateEntry(index, 'startMonth', e.target.value)}
                      className={dynSelect(entry.startMonth || 'optional')}
                    >
                      <option value="">Monat</option>
                      {MONTHS.map((m) => (
                        <option key={m} value={m} className="bg-slate-900">
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      value={entry.startYear}
                      onChange={(e) => updateEntry(index, 'startYear', e.target.value)}
                      className={dynSelect(entry.startYear)}
                    >
                      <option value="">Jahr *</option>
                      {YEARS.map((year) => (
                        <option key={year} value={year} className="bg-slate-900">
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-2">
                    Bis *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={entry.endMonth || ''}
                      onChange={(e) => updateEntry(index, 'endMonth', e.target.value)}
                      className={dynSelect(entry.endMonth || 'optional')}
                    >
                      <option value="">Monat</option>
                      {MONTHS.map((m) => (
                        <option key={m} value={m} className="bg-slate-900">
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      value={entry.endYear}
                      onChange={(e) => updateEntry(index, 'endYear', e.target.value)}
                      className={dynSelect(entry.endYear)}
                    >
                      <option value="">Jahr *</option>
                      <option value="present" className="bg-slate-900">Aktuell</option>
                      {YEARS.map((year) => (
                        <option key={year} value={year} className="bg-slate-900">
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">
                  Abschlussnote (optional)
                </label>
                <input
                  type="text"
                  value={entry.grades || ''}
                  onChange={(e) => updateEntry(index, 'grades', e.target.value)}
                  placeholder="z.B. 1,5 / sehr gut / mit Auszeichnung"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addEntry}
          className="w-full py-4 rounded-xl border-2 border-dashed border-white/20 hover:border-[#66c0b6] hover:bg-white/5 text-white/70 hover:text-white transition-all flex items-center justify-center gap-2"
          type="button"
        >
          <Plus size={20} />
          Weitere Ausbildung hinzufügen
        </button>

        <div className="space-y-3 mt-6">
          <div className="p-4 rounded-xl bg-[#66c0b6]/10 border border-[#66c0b6]/30">
            <p className="text-sm text-[#66c0b6] font-medium mb-1">
              Was gehört rein?
            </p>
            <ul className="text-xs text-[#66c0b6]/90 space-y-1 ml-4">
              <li>• Studium: Bachelor, Master, Diplom mit Fachrichtung</li>
              <li>• Ausbildung: IHK-Abschluss mit genauer Berufsbezeichnung</li>
              <li>• Weiterbildungen: Nur relevante Zertifikate (z.B. Google Analytics, AWS)</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <p className="text-sm text-blue-400 font-medium mb-1">
              Profi-Tipp
            </p>
            <p className="text-xs text-blue-400/90">
              Auch abgebrochene Studiengänge können wertvoll sein - sie zeigen Fachkenntnisse.
              Schreib z.B. "2 Semester Betriebswirtschaft (nicht abgeschlossen)"
            </p>
          </div>
        </div>
      </div>
    </WizardStepLayout>
  );
}
