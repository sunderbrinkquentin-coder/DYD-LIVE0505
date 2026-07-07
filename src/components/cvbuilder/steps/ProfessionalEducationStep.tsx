import { useState } from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
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

// FIX: Ein Eintrag ist "aktiv", sobald IRGENDEIN inhaltliches Feld gefüllt ist —
// vorher zählten nur Institution/Abschluss. Folge: Einträge mit nur ausgewählten
// Zeiten wurden beim Weiterklicken stillschweigend GELÖSCHT.
function hasAnyContent(e: ProfessionalEducation): boolean {
  return !!(
    e.institution?.trim() ||
    e.degree?.trim() ||
    e.startYear ||
    e.endYear ||
    e.startMonth ||
    e.endMonth ||
    e.location?.trim() ||
    e.grades?.trim()
  );
}

// FIX: Pro Eintrag prüfen, WAS fehlt — damit die Fehlermeldung sagen kann,
// welche Karte blockiert, statt generisch "Zeitraum fehlt" zu behaupten.
function getMissingFields(e: ProfessionalEducation): string[] {
  const missing: string[] = [];
  if (!e.institution?.trim()) missing.push('Institution');
  if (!e.degree?.trim()) missing.push('Abschluss');
  if (!e.startYear) missing.push('Von-Jahr');
  if (!e.endYear) missing.push('Bis-Jahr');
  return missing;
}

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

  // Aktive Einträge = alles mit irgendeinem Inhalt (siehe hasAnyContent)
  const activeEntries = entries.filter(hasAnyContent);

  // FIX: Karten-genaue Validierung — wir wissen jetzt pro Index, was fehlt
  const entryProblems: Map<number, string[]> = new Map();
  entries.forEach((e, i) => {
    if (!hasAnyContent(e)) return; // komplett leere Karten blockieren nie
    const missing = getMissingFields(e);
    if (missing.length > 0) entryProblems.set(i, missing);
  });

  const isValid = entryProblems.size === 0;

  // FIX: Dynamische Fehlermeldung, die die konkrete Karte + Felder benennt —
  // vorher stand pauschal "Zeitraum fehlt", auch wenn Karte 1 perfekt war
  // und nur eine halb ausgefüllte Karte 2 blockierte.
  const validationMessage = (() => {
    if (isValid) return 'Bitte fülle Institution, Abschluss und Zeitraum aus – diese Informationen sind auf deinem Lebenslauf sichtbar.';
    const [firstIdx, missing] = [...entryProblems.entries()][0];
    const cardLabel = entries.length > 1 ? `In Ausbildung ${firstIdx + 1} fehlt: ` : 'Es fehlt noch: ';
    return cardLabel + missing.join(', ') + '. Leere Karten kannst du einfach löschen.';
  })();

  const handleNext = () => {
    if (!isValid) {
      setAttempted(true);
      return;
    }
    setAttempted(false); // FIX: Fehlerzustand zurücksetzen, sobald alles passt
    // Bereinigt: nur inhaltlich gefüllte Einträge werden gespeichert
    const cleanedEntries = activeEntries.length > 0 ? activeEntries : [];
    onChange(cleanedEntries);
    onNext();
  };

  // FIX: Rote Ränder nur auf Karten, die wirklich ein Problem haben —
  // vorher wurden nach einem Klick ALLE leeren Pflichtfelder rot, auch
  // in Karten, die den Nutzer gar nicht blockierten.
  const dynInput = (value: string | undefined, entryIndex: number) =>
    `w-full px-3 py-2.5 rounded-xl border-2 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:bg-white/10 transition-all ${
      attempted && entryProblems.has(entryIndex) && !value ? 'border-red-500/70 focus:border-red-400' : 'border-white/10 focus:border-[#66c0b6]'
    }`;

  const dynSelect = (value: string | undefined, entryIndex: number) =>
    `w-full px-2 py-2.5 rounded-xl border-2 bg-white/5 text-white focus:outline-none focus:bg-white/10 transition-all text-sm ${
      attempted && entryProblems.has(entryIndex) && !value ? 'border-red-500/70 focus:border-red-400' : 'border-white/10 focus:border-[#66c0b6]'
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
      validationMessage={validationMessage}
      hideProgress
    >
      <div className="space-y-4">
        {entries.map((entry, index) => {
          const problems = entryProblems.get(index);
          return (
          <div
            key={index}
            className={`relative p-4 rounded-2xl bg-white/5 border space-y-3 ${
              attempted && problems ? 'border-red-500/40' : 'border-white/10'
            }`}
          >
            {/* FIX: Karten-genauer Hinweis direkt an der betroffenen Karte */}
            {attempted && problems && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25">
                <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-300/90">
                  Hier fehlt noch: <span className="font-semibold">{problems.join(', ')}</span>
                  {entries.length > 1 && ' — oder lösche diese Karte, falls du sie nicht brauchst.'}
                </p>
              </div>
            )}

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
                  className={dynInput(entry.type, index)}
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
                    className={dynInput(entry.institution, index)}
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
                  className={dynInput(entry.degree, index)}
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
                      className={dynSelect(entry.startMonth || 'optional', index)}
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
                      className={dynSelect(entry.startYear, index)}
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
                      className={dynSelect(entry.endMonth || 'optional', index)}
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
                      className={dynSelect(entry.endYear, index)}
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
          );
        })}

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