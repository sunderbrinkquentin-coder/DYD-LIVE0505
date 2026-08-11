import { useState } from 'react';
import { Plus, Trash2, MapPin, Sparkles, AlertTriangle, School, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WizardStepLayout } from '../WizardStepLayout';
import { SchoolEducation, ProfessionalEducation, EducationType } from '../../../types/cvBuilder';

// ─────────────────────────────────────────────────────────────────────────────
// Gemeinsamer Bildungs-Step: Schulbildung UND Ausbildung/Studium in einem Screen.
// Speicherung bleibt bewusst GETRENNT: onSchoolChange (schoolEducation) und
// onProfessionalChange (professionalEducation). Dadurch bleiben Mapper/PDF/Overview
// unverändert. Pro Eintrag wird über zwei Add-Buttons entschieden, welcher Typ.
// ─────────────────────────────────────────────────────────────────────────────

interface EducationStepProps {
  schoolData?: SchoolEducation[];
  professionalData?: ProfessionalEducation[];
  experienceLevel?: string;
  onSchoolChange: (data: SchoolEducation[]) => void;
  onProfessionalChange: (data: ProfessionalEducation[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

const SCHOOL_TYPES = [
  'Hauptschulabschluss',
  'Realschulabschluss / Mittlere Reife',
  'Fachhochschulreife (Fachabitur)',
  'Allgemeine Hochschulreife (Abitur)',
  'Sonstiges',
];

const EDUCATION_TYPES: { value: EducationType; label: string; description: string }[] = [
  { value: 'university', label: 'Studium (Bachelor / Master / Diplom)', description: 'Universität oder Fachhochschule' },
  { value: 'apprenticeship', label: 'Ausbildung (dual / schulisch)', description: 'Berufsausbildung mit IHK-Abschluss' },
  { value: 'certification', label: 'Weiterbildung / Zertifikat', description: 'z.B. Online-Kurs, Bootcamp, Zertifizierung' },
  { value: 'school', label: 'Fachschule / Meister / Techniker', description: 'Weiterbildender Abschluss' },
];

const MONTHS = [
  { value: '01', label: 'Januar' }, { value: '02', label: 'Februar' },
  { value: '03', label: 'März' }, { value: '04', label: 'April' },
  { value: '05', label: 'Mai' }, { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' }, { value: '08', label: 'August' },
  { value: '09', label: 'September' }, { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' }, { value: '12', label: 'Dezember' },
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

type Row =
  | { id: string; kind: 'school'; school: SchoolEducation }
  | { id: string; kind: 'professional'; professional: ProfessionalEducation };

let idCounter = 0;
const nextId = () => `edu_${Date.now()}_${idCounter++}`;

const emptySchool = (): SchoolEducation => ({
  type: '', school: '', graduation: '', year: '',
  startYear: '', startMonth: '', endYear: '', endMonth: '', location: '', focus: [],
});

const emptyProfessional = (): ProfessionalEducation => ({
  type: 'university', institution: '', degree: '',
  startMonth: '', startYear: '', endMonth: '', endYear: '',
  location: '', focus: [], projects: [], grades: '',
});

function hasProfContent(e: ProfessionalEducation): boolean {
  return !!(
    e.institution?.trim() || e.degree?.trim() || e.startYear || e.endYear ||
    e.startMonth || e.endMonth || e.location?.trim() || e.grades?.trim()
  );
}
function hasSchoolContent(e: SchoolEducation): boolean {
  return !!(e.type || e.school?.trim() || e.startYear || e.endYear || e.location?.trim() || (e.focus && e.focus.length > 0));
}

export function EducationStep({
  schoolData = [],
  professionalData = [],
  onSchoolChange,
  onProfessionalChange,
  onNext,
  onBack,
  onSkip,
}: EducationStepProps) {
  const [attempted, setAttempted] = useState(false);

  const [rows, setRows] = useState<Row[]>(() => {
    const initial: Row[] = [
      ...professionalData.map((p) => ({ id: nextId(), kind: 'professional' as const, professional: p })),
      ...schoolData.map((s) => ({ id: nextId(), kind: 'school' as const, school: s })),
    ];
    return initial.length > 0 ? initial : [{ id: nextId(), kind: 'school', school: emptySchool() }];
  });

  // UI-only state (pro Zeile): Bundesland-Auswahl, "Gesetzt!"-Badge, Schwerpunkte-Rohtext
  const [bundesland, setBundesland] = useState<Record<string, string>>({});
  const [smartApplied, setSmartApplied] = useState<Record<string, boolean>>({});
  const [focusText, setFocusText] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    // Initialwerte werden beim ersten Render der Zeilen gesetzt (siehe unten)
    return m;
  });

  const emit = (rs: Row[]) => {
    onSchoolChange(rs.filter((r): r is Extract<Row, { kind: 'school' }> => r.kind === 'school').map((r) => r.school));
    onProfessionalChange(rs.filter((r): r is Extract<Row, { kind: 'professional' }> => r.kind === 'professional').map((r) => r.professional));
  };

  const updateSchool = (id: string, field: keyof SchoolEducation, value: any) => {
    setRows((prev) => {
      const updated = prev.map((r) =>
        r.id === id && r.kind === 'school' ? { ...r, school: { ...r.school, [field]: value } } : r
      );
      emit(updated);
      return updated;
    });
  };

  const updateProf = (id: string, field: keyof ProfessionalEducation, value: any) => {
    setRows((prev) => {
      const updated = prev.map((r) =>
        r.id === id && r.kind === 'professional' ? { ...r, professional: { ...r.professional, [field]: value } } : r
      );
      emit(updated);
      return updated;
    });
  };

  const applyBundesland = (id: string, code: string) => {
    const bl = BUNDESLAND_DEFAULTS[code];
    if (!bl) return;
    setRows((prev) => {
      const updated = prev.map((r) =>
        r.id === id && r.kind === 'school'
          ? { ...r, school: { ...r.school, startMonth: bl.startMonth, endMonth: bl.endMonth } }
          : r
      );
      emit(updated);
      return updated;
    });
    setSmartApplied((s) => ({ ...s, [id]: true }));
    setTimeout(() => setSmartApplied((s) => ({ ...s, [id]: false })), 2500);
  };

  const handleBundeslandChange = (id: string, code: string) => {
    setBundesland((b) => ({ ...b, [id]: code }));
    if (code) applyBundesland(id, code);
  };

  const updateFocusText = (id: string, text: string) => {
    setFocusText((f) => ({ ...f, [id]: text }));
    updateSchool(id, 'focus', text.split(',').map((s) => s.trim()).filter(Boolean));
  };

  const addSchool = () => setRows((prev) => { const u = [...prev, { id: nextId(), kind: 'school' as const, school: emptySchool() }]; emit(u); return u; });
  const addProfessional = () => setRows((prev) => { const u = [...prev, { id: nextId(), kind: 'professional' as const, professional: emptyProfessional() }]; emit(u); return u; });

  const removeRow = (id: string) => {
    setRows((prev) => {
      let updated = prev.filter((r) => r.id !== id);
      if (updated.length === 0) updated = [{ id: nextId(), kind: 'school', school: emptySchool() }];
      emit(updated);
      return updated;
    });
  };

  // ── Validierung: Zeilen mit Inhalt müssen vollständig sein; leere blockieren nie
  const rowProblems: Map<string, string[]> = new Map();
  rows.forEach((r) => {
    if (r.kind === 'school') {
      if (!hasSchoolContent(r.school)) return;
      const missing: string[] = [];
      if (!r.school.type) missing.push('Schulabschluss');
      if (!r.school.school?.trim()) missing.push('Schule');
      if (!r.school.startYear) missing.push('Von-Jahr');
      if (!r.school.endYear) missing.push('Bis-Jahr');
      if (missing.length) rowProblems.set(r.id, missing);
    } else {
      if (!hasProfContent(r.professional)) return;
      const missing: string[] = [];
      if (!r.professional.institution?.trim()) missing.push('Institution');
      if (!r.professional.degree?.trim()) missing.push('Abschluss');
      if (!r.professional.startYear) missing.push('Von-Jahr');
      if (!r.professional.endYear) missing.push('Bis-Jahr');
      if (missing.length) rowProblems.set(r.id, missing);
    }
  });

  const isValid = rowProblems.size === 0;

  const validationMessage = (() => {
    if (isValid) return 'Bitte fülle bei jedem Eintrag Abschluss/Institution und Zeitraum aus – leere Karten kannst du einfach löschen.';
    const firstMissing = [...rowProblems.values()][0];
    return 'Es fehlt noch: ' + firstMissing.join(', ') + '. Leere Karten kannst du einfach löschen.';
  })();

  const handleNext = () => {
    if (!isValid) { setAttempted(true); return; }
    setAttempted(false);
    // Bereinigt speichern: nur Zeilen mit Inhalt
    onSchoolChange(rows.filter((r): r is Extract<Row, { kind: 'school' }> => r.kind === 'school' && hasSchoolContent(r.school)).map((r) => r.school));
    onProfessionalChange(rows.filter((r): r is Extract<Row, { kind: 'professional' }> => r.kind === 'professional' && hasProfContent(r.professional)).map((r) => r.professional));
    onNext();
  };

  const schoolRowsCount = rows.filter((r) => r.kind === 'school').length;
  const profRowsCount = rows.filter((r) => r.kind === 'professional').length;

  const fieldCls = (invalid: boolean) =>
    `w-full px-3 py-2.5 rounded-xl border-2 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:bg-white/10 transition-all ${
      invalid ? 'border-red-500/70 focus:border-red-400' : 'border-white/10 focus:border-[#66c0b6]'
    }`;
  const selectCls = (invalid: boolean) =>
    `w-full px-3 py-2.5 rounded-xl border-2 bg-slate-900 text-white focus:outline-none transition-all text-sm ${
      invalid ? 'border-red-500/70 focus:border-red-400' : 'border-white/10 focus:border-[#66c0b6]'
    }`;
  const smallSelectCls = (invalid: boolean) =>
    `w-full px-2 py-2 rounded-xl border-2 bg-slate-900 text-white focus:outline-none transition-all text-sm ${
      invalid ? 'border-red-500/70' : 'border-white/10 focus:border-[#66c0b6]'
    }`;

  return (
    <WizardStepLayout
      title="Deine Bildung"
      subtitle="Schulbildung, Ausbildung und Studium – alles an einem Ort."
      avatarMessage="Bildung ist dein Fundament und für ATS-Systeme wichtig."
      avatarStepInfo="Gib deinen Schulabschluss an und ergänze Ausbildung oder Studium, falls vorhanden."
      currentStepId="education"
      coachData={{ schoolEducation: rows.filter((r) => r.kind === 'school').map((r: any) => r.school), professionalEducation: rows.filter((r) => r.kind === 'professional').map((r: any) => r.professional) }}
      coachSection="schoolEducation"
      onPrev={onBack}
      onNext={handleNext}
      onSkip={onSkip}
      isNextDisabled={!isValid}
      validationMessage={validationMessage}
      hideProgress
    >
      <div className="space-y-4">
        {rows.map((r) => {
          const problems = rowProblems.get(r.id);
          const invalid = attempted && !!problems;

          if (r.kind === 'school') {
            const entry = r.school;
            const focusVal = focusText[r.id] ?? (entry.focus?.join(', ') || '');
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative p-4 rounded-2xl bg-white/5 border space-y-3 ${invalid ? 'border-red-500/40' : 'border-white/10'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-white/70">
                    <School size={13} className="text-[#66c0b6]" /> Schulbildung
                  </span>
                  <button onClick={() => removeRow(r.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all" type="button">
                    <Trash2 size={15} />
                  </button>
                </div>

                {invalid && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25">
                    <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-300/90">Hier fehlt noch: <span className="font-semibold">{problems!.join(', ')}</span></p>
                  </div>
                )}

                {/* Bundesland-Smart-Dates */}
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-[#66c0b6] flex-shrink-0" />
                  <select
                    value={bundesland[r.id] || ''}
                    onChange={(e) => handleBundeslandChange(r.id, e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-white/10 bg-slate-900 text-white/80 text-xs focus:outline-none focus:border-[#66c0b6] transition-all"
                  >
                    <option value="">Bundesland wählen → Monate automatisch setzen</option>
                    {Object.entries(BUNDESLAND_DEFAULTS).map(([code, bl]) => (
                      <option key={code} value={code} className="bg-slate-900">{bl.label}</option>
                    ))}
                  </select>
                  <AnimatePresence>
                    {smartApplied[r.id] && (
                      <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#66c0b6]/20 text-[#66c0b6] text-xs font-semibold flex-shrink-0">
                        <Sparkles size={11} /> Gesetzt!
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-1.5">Schulabschluss *</label>
                  <select value={entry.type} onChange={(e) => updateSchool(r.id, 'type', e.target.value)} className={selectCls(invalid && !entry.type)}>
                    <option value="">Bitte wählen</option>
                    {SCHOOL_TYPES.map((t) => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-1.5">Schule *</label>
                    <input type="text" value={entry.school} onChange={(e) => updateSchool(r.id, 'school', e.target.value)} placeholder="z.B. Gymnasium Musterstadt" className={fieldCls(invalid && !entry.school?.trim())} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-1.5">Ort</label>
                    <input type="text" value={entry.location || ''} onChange={(e) => updateSchool(r.id, 'location', e.target.value)} placeholder="z.B. München" className={fieldCls(false)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-1.5">Von *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select value={entry.startMonth || ''} onChange={(e) => updateSchool(r.id, 'startMonth', e.target.value)} className={smallSelectCls(false)}>
                        <option value="">Monat</option>
                        {MONTHS.map((m) => <option key={m.value} value={m.value} className="bg-slate-900">{m.label}</option>)}
                      </select>
                      <select value={entry.startYear || ''} onChange={(e) => updateSchool(r.id, 'startYear', e.target.value)} className={smallSelectCls(invalid && !entry.startYear)}>
                        <option value="">Jahr</option>
                        {YEARS.map((y) => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-1.5">Bis *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select value={entry.endMonth || ''} onChange={(e) => updateSchool(r.id, 'endMonth', e.target.value)} className={smallSelectCls(false)}>
                        <option value="">Monat</option>
                        {MONTHS.map((m) => <option key={m.value} value={m.value} className="bg-slate-900">{m.label}</option>)}
                      </select>
                      <select value={entry.endYear || ''} onChange={(e) => updateSchool(r.id, 'endYear', e.target.value)} className={smallSelectCls(invalid && !entry.endYear)}>
                        <option value="">Jahr</option>
                        <option value="present" className="bg-slate-900">Aktuell</option>
                        {YEARS.map((y) => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-1.5">
                    Schwerpunkte <span className="text-white/40 font-normal">(optional)</span>
                  </label>
                  <input type="text" value={focusVal} onChange={(e) => updateFocusText(r.id, e.target.value)} placeholder="z.B. Mathematik, Naturwissenschaften (mit Komma trennen)" className={fieldCls(false)} />
                </div>
              </motion.div>
            );
          }

          // professional
          const entry = r.professional;
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative p-4 rounded-2xl bg-white/5 border space-y-3 ${invalid ? 'border-red-500/40' : 'border-white/10'}`}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-white/70">
                  <GraduationCap size={13} className="text-[#66c0b6]" /> Ausbildung / Studium
                </span>
                <button onClick={() => removeRow(r.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all" type="button">
                  <Trash2 size={15} />
                </button>
              </div>

              {invalid && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25">
                  <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-300/90">Hier fehlt noch: <span className="font-semibold">{problems!.join(', ')}</span></p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">Art der Ausbildung *</label>
                <select value={entry.type} onChange={(e) => updateProf(r.id, 'type', e.target.value as EducationType)} className={selectCls(false)}>
                  {EDUCATION_TYPES.map((t) => <option key={t.value} value={t.value} className="bg-slate-900">{t.label}</option>)}
                </select>
                <p className="text-xs text-white/50 mt-1">{EDUCATION_TYPES.find((t) => t.value === entry.type)?.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-2">Institution / Schule *</label>
                  <input type="text" value={entry.institution} onChange={(e) => updateProf(r.id, 'institution', e.target.value)} placeholder="z.B. TU München, IHK München" className={fieldCls(invalid && !entry.institution?.trim())} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-2">Ort (optional)</label>
                  <input type="text" value={entry.location || ''} onChange={(e) => updateProf(r.id, 'location', e.target.value)} placeholder="z.B. München, Berlin" className={fieldCls(false)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">Abschluss / Fachrichtung *</label>
                <input type="text" value={entry.degree} onChange={(e) => updateProf(r.id, 'degree', e.target.value)} placeholder="z.B. Bachelor Informatik, Kaufmann für Büromanagement" className={fieldCls(invalid && !entry.degree?.trim())} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-2">Von *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select value={entry.startMonth || ''} onChange={(e) => updateProf(r.id, 'startMonth', e.target.value)} className={smallSelectCls(false)}>
                      <option value="">Monat</option>
                      {MONTHS.map((m) => <option key={m.value} value={m.value} className="bg-slate-900">{m.label}</option>)}
                    </select>
                    <select value={entry.startYear} onChange={(e) => updateProf(r.id, 'startYear', e.target.value)} className={smallSelectCls(invalid && !entry.startYear)}>
                      <option value="">Jahr *</option>
                      {YEARS.map((y) => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-2">Bis *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select value={entry.endMonth || ''} onChange={(e) => updateProf(r.id, 'endMonth', e.target.value)} className={smallSelectCls(false)}>
                      <option value="">Monat</option>
                      {MONTHS.map((m) => <option key={m.value} value={m.value} className="bg-slate-900">{m.label}</option>)}
                    </select>
                    <select value={entry.endYear} onChange={(e) => updateProf(r.id, 'endYear', e.target.value)} className={smallSelectCls(invalid && !entry.endYear)}>
                      <option value="">Jahr *</option>
                      <option value="present" className="bg-slate-900">Aktuell</option>
                      {YEARS.map((y) => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">Abschlussnote (optional)</label>
                <input type="text" value={entry.grades || ''} onChange={(e) => updateProf(r.id, 'grades', e.target.value)} placeholder="z.B. 1,5 / sehr gut / mit Auszeichnung" className={fieldCls(false)} />
              </div>
            </motion.div>
          );
        })}

        {/* Zwei getrennte Add-Buttons – so wählt man den Eintragstyp explizit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={addSchool} type="button"
            className="py-3 rounded-xl border-2 border-dashed border-white/20 hover:border-[#66c0b6] hover:bg-white/5 text-white/70 hover:text-white transition-all flex items-center justify-center gap-2">
            <School size={16} /> Schulbildung hinzufügen
          </button>
          <button onClick={addProfessional} type="button"
            className="py-3 rounded-xl border-2 border-dashed border-white/20 hover:border-[#66c0b6] hover:bg-white/5 text-white/70 hover:text-white transition-all flex items-center justify-center gap-2">
            <GraduationCap size={16} /> Ausbildung / Studium hinzufügen
          </button>
        </div>

        <div className="p-3 rounded-xl bg-[#66c0b6]/10 border border-[#66c0b6]/25">
          <p className="text-sm text-[#66c0b6] font-medium mb-0.5">Tipp: Schulabschluss immer angeben</p>
          <p className="text-xs text-[#66c0b6]/80">
            {profRowsCount === 0
              ? 'Machst du eine Ausbildung oder ein Studium? Füg sie mit dem rechten Button hinzu.'
              : `${schoolRowsCount} Schulbildung · ${profRowsCount} Ausbildung/Studium erfasst.`}
          </p>
        </div>
      </div>
    </WizardStepLayout>
  );
}