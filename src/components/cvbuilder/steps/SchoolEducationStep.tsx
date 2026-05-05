import { useState } from 'react';
import { Plus, Trash2, MapPin, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WizardStepLayout } from '../WizardStepLayout';
import { SchoolEducation } from '../../../types/cvBuilder';

interface SchoolEducationStepProps {
  data?: SchoolEducation[];
  onChange: (data: SchoolEducation[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

const SCHOOL_TYPES = [
  'Hauptschulabschluss',
  'Realschulabschluss / Mittlere Reife',
  'Fachhochschulreife (Fachabitur)',
  'Allgemeine Hochschulreife (Abitur)',
  'Sonstiges'
];

const MONTHS = [
  { value: '01', label: 'Januar' },
  { value: '02', label: 'Februar' },
  { value: '03', label: 'März' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Dezember' },
];

const BUNDESLAND_DEFAULTS: Record<string, { startMonth: string; endMonth: string; label: string }> = {
  'BY': { startMonth: '09', endMonth: '07', label: 'Bayern' },
  'BW': { startMonth: '09', endMonth: '07', label: 'Baden-Württemberg' },
  'BE': { startMonth: '08', endMonth: '07', label: 'Berlin' },
  'BB': { startMonth: '08', endMonth: '06', label: 'Brandenburg' },
  'HB': { startMonth: '08', endMonth: '06', label: 'Bremen' },
  'HH': { startMonth: '08', endMonth: '06', label: 'Hamburg' },
  'HE': { startMonth: '08', endMonth: '06', label: 'Hessen' },
  'MV': { startMonth: '08', endMonth: '06', label: 'Mecklenburg-Vorpommern' },
  'NI': { startMonth: '08', endMonth: '06', label: 'Niedersachsen' },
  'NW': { startMonth: '08', endMonth: '06', label: 'Nordrhein-Westfalen' },
  'RP': { startMonth: '08', endMonth: '06', label: 'Rheinland-Pfalz' },
  'SL': { startMonth: '08', endMonth: '06', label: 'Saarland' },
  'SN': { startMonth: '08', endMonth: '07', label: 'Sachsen' },
  'ST': { startMonth: '08', endMonth: '06', label: 'Sachsen-Anhalt' },
  'SH': { startMonth: '08', endMonth: '06', label: 'Schleswig-Holstein' },
  'TH': { startMonth: '08', endMonth: '06', label: 'Thüringen' },
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => (CURRENT_YEAR - i).toString());

const emptyEntry = (): SchoolEducation => ({
  type: '', school: '', graduation: '', year: '',
  startYear: '', startMonth: '', endYear: '', endMonth: '', location: '', focus: [],
});

export function SchoolEducationStep({ data = [], onChange, onNext, onBack, onSkip }: SchoolEducationStepProps) {
  const [attempted, setAttempted] = useState(false);
  const [entries, setEntries] = useState<SchoolEducation[]>(data.length > 0 ? data : [emptyEntry()]);
  const [focusTexts, setFocusTexts] = useState<string[]>(
    (data.length > 0 ? data : [emptyEntry()]).map(e => e.focus?.join(', ') || '')
  );
  const [bundeslaender, setBundeslaender] = useState<string[]>(
    (data.length > 0 ? data : [emptyEntry()]).map(() => '')
  );
  const [smartApplied, setSmartApplied] = useState<boolean[]>(
    (data.length > 0 ? data : [emptyEntry()]).map(() => false)
  );

  const updateEntry = (index: number, field: keyof SchoolEducation, value: any) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
    onChange(updated);
  };

  const applyBundesland = (entryIndex: number, code: string) => {
    const bl = BUNDESLAND_DEFAULTS[code];
    if (!bl) return;
    const updated = [...entries];
    updated[entryIndex] = { ...updated[entryIndex], startMonth: bl.startMonth, endMonth: bl.endMonth };
    setEntries(updated);
    onChange(updated);
    const applied = [...smartApplied];
    applied[entryIndex] = true;
    setSmartApplied(applied);
    setTimeout(() => {
      setSmartApplied(prev => { const r = [...prev]; r[entryIndex] = false; return r; });
    }, 2500);
  };

  const handleBundeslandChange = (entryIndex: number, code: string) => {
    setBundeslaender(prev => { const b = [...prev]; b[entryIndex] = code; return b; });
    if (code) applyBundesland(entryIndex, code);
  };

  const updateFocusText = (index: number, text: string) => {
    const updatedTexts = [...focusTexts];
    updatedTexts[index] = text;
    setFocusTexts(updatedTexts);
    const updated = [...entries];
    updated[index] = { ...updated[index], focus: text.split(',').map(f => f.trim()).filter(Boolean) };
    setEntries(updated);
    onChange(updated);
  };

  const addEntry = () => {
    const updatedEntries = [...entries, emptyEntry()];
    setEntries(updatedEntries);
    setFocusTexts([...focusTexts, '']);
    setBundeslaender([...bundeslaender, '']);
    setSmartApplied([...smartApplied, false]);
    onChange(updatedEntries);
  };

  const removeEntry = (index: number) => {
    if (entries.length <= 1) return;
    const updated = entries.filter((_, i) => i !== index);
    setEntries(updated);
    setFocusTexts(focusTexts.filter((_, i) => i !== index));
    setBundeslaender(bundeslaender.filter((_, i) => i !== index));
    setSmartApplied(smartApplied.filter((_, i) => i !== index));
    onChange(updated);
  };

  const isValid = entries.every(e => e.type && e.school && e.startYear && e.endYear);

  const handleNext = () => {
    if (!isValid) { setAttempted(true); return; }
    onNext();
  };

  const fieldCls = (val: string | undefined, required = false) =>
    `w-full px-3 py-2.5 rounded-xl border-2 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:bg-white/10 transition-all ${
      attempted && required && !val ? 'border-red-500/70' : 'border-white/10 focus:border-[#66c0b6]'
    }`;

  const selectCls = (val: string | undefined, required = false) =>
    `w-full px-3 py-2.5 rounded-xl border-2 bg-slate-900 text-white focus:outline-none transition-all text-sm ${
      attempted && required && !val ? 'border-red-500/70' : 'border-white/10 focus:border-[#66c0b6]'
    }`;

  const selectSmallCls = (hasError = false) =>
    `w-full px-2 py-2 rounded-xl border-2 bg-slate-900 text-white focus:outline-none transition-all text-sm ${
      hasError ? 'border-red-500/70' : 'border-white/10 focus:border-[#66c0b6]'
    }`;

  return (
    <WizardStepLayout
      title="Deine Schulbildung"
      subtitle="Füge deine schulischen Abschlüsse hinzu."
      avatarMessage="Die Schulbildung zeigt deine Basis und ist für ATS-Systeme wichtig."
      avatarStepInfo="Gib mindestens deinen höchsten Abschluss an."
      currentStepId="schoolEducation"
      onPrev={onBack}
      onNext={handleNext}
      onSkip={onSkip}
      isNextDisabled={!isValid}
      validationMessage="Bitte fülle Schulabschluss, Schulname und Zeitraum aus."
      hideProgress
    >
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3"
          >
            {entries.length > 1 && (
              <button
                onClick={() => removeEntry(index)}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all z-10"
                type="button"
              >
                <Trash2 size={15} />
              </button>
            )}

            {/* Smart-Date Bundesland row */}
            <div className="flex items-center gap-2">
              <MapPin size={13} className="text-[#66c0b6] flex-shrink-0" />
              <select
                value={bundeslaender[index] || ''}
                onChange={(e) => handleBundeslandChange(index, e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-white/10 bg-slate-900 text-white/80 text-xs focus:outline-none focus:border-[#66c0b6] transition-all"
              >
                <option value="">Bundesland wählen → Monate automatisch setzen</option>
                {Object.entries(BUNDESLAND_DEFAULTS).map(([code, bl]) => (
                  <option key={code} value={code} className="bg-slate-900">{bl.label}</option>
                ))}
              </select>
              <AnimatePresence>
                {smartApplied[index] && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#66c0b6]/20 text-[#66c0b6] text-xs font-semibold flex-shrink-0"
                  >
                    <Sparkles size={11} /> Gesetzt!
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Schulabschluss */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-1.5">Schulabschluss *</label>
              <select
                value={entry.type}
                onChange={(e) => updateEntry(index, 'type', e.target.value)}
                className={selectCls(entry.type, true)}
              >
                <option value="">Bitte wählen</option>
                {SCHOOL_TYPES.map(t => (
                  <option key={t} value={t} className="bg-slate-900">{t}</option>
                ))}
              </select>
            </div>

            {/* Schule + Ort */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-1.5">Schule *</label>
                <input
                  type="text"
                  value={entry.school}
                  onChange={(e) => updateEntry(index, 'school', e.target.value)}
                  placeholder="z.B. Gymnasium Musterstadt"
                  className={fieldCls(entry.school, true)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-1.5">Ort</label>
                <input
                  type="text"
                  value={entry.location || ''}
                  onChange={(e) => updateEntry(index, 'location', e.target.value)}
                  placeholder="z.B. München"
                  className={fieldCls(undefined)}
                />
              </div>
            </div>

            {/* Zeitraum — unter Schule/Ort, zentriert */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-1.5">Von *</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={entry.startMonth || ''}
                    onChange={(e) => updateEntry(index, 'startMonth', e.target.value)}
                    className={selectSmallCls()}
                  >
                    <option value="">Monat</option>
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value} className="bg-slate-900">{m.label}</option>
                    ))}
                  </select>
                  <select
                    value={entry.startYear || ''}
                    onChange={(e) => updateEntry(index, 'startYear', e.target.value)}
                    className={selectSmallCls(attempted && !entry.startYear)}
                  >
                    <option value="">Jahr</option>
                    {YEARS.map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-1.5">Bis *</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={entry.endMonth || ''}
                    onChange={(e) => updateEntry(index, 'endMonth', e.target.value)}
                    className={selectSmallCls()}
                  >
                    <option value="">Monat</option>
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value} className="bg-slate-900">{m.label}</option>
                    ))}
                  </select>
                  <select
                    value={entry.endYear || ''}
                    onChange={(e) => updateEntry(index, 'endYear', e.target.value)}
                    className={selectSmallCls(attempted && !entry.endYear)}
                  >
                    <option value="">Jahr</option>
                    <option value="present" className="bg-slate-900">Aktuell</option>
                    {YEARS.map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Schwerpunkte */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-1.5">
                Schwerpunkte <span className="text-white/40 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={focusTexts[index] ?? ''}
                onChange={(e) => updateFocusText(index, e.target.value)}
                placeholder="z.B. Mathematik, Naturwissenschaften (mit Komma trennen)"
                className={fieldCls(undefined)}
              />
            </div>
          </motion.div>
        ))}

        <button
          onClick={addEntry}
          className="w-full py-3 rounded-xl border-2 border-dashed border-white/20 hover:border-[#66c0b6] hover:bg-white/5 text-white/70 hover:text-white transition-all flex items-center justify-center gap-2"
          type="button"
        >
          <Plus size={18} /> Weitere Schulbildung hinzufügen
        </button>

        <div className="p-3 rounded-xl bg-[#66c0b6]/10 border border-[#66c0b6]/25">
          <p className="text-sm text-[#66c0b6] font-medium mb-0.5">Tipp: Gib deinen höchsten Schulabschluss an</p>
          <p className="text-xs text-[#66c0b6]/80">Wähle dein Bundesland — die Abschlussmonate werden automatisch vorbelegt.</p>
        </div>
      </div>
    </WizardStepLayout>
  );
}
