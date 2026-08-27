import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Plus, Trash2, Calendar, MapPin, Building2, Briefcase, FileText, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface StationFieldConfig {
  type: string;
  label: string;
  icon: 'briefcase' | 'graduation' | 'project' | 'language' | 'skill' | 'certificate' | 'volunteer' | 'simple';
  fields: StationField[];
}

export interface StationField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'textarea' | 'date-range' | 'bullets';
  required?: boolean;
}

const FIELD_GROUPS: Record<string, StationFieldConfig> = {
  experience: {
    type: 'experience',
    label: 'Berufsstation',
    icon: 'briefcase',
    fields: [
      { key: 'title', label: 'Position / Rolle', placeholder: 'z.B. Marketing Manager', type: 'text', required: true },
      { key: 'company', label: 'Unternehmen', placeholder: 'z.B. Siemens AG', type: 'text', required: true },
      { key: 'location', label: 'Ort', placeholder: 'z.B. München', type: 'text' },
      { key: 'dateRange', label: 'Zeitraum', placeholder: '', type: 'date-range' },
      { key: 'description', label: 'Beschreibung / Aufgaben', placeholder: 'Kurze Beschreibung deiner Hauptaufgaben...', type: 'textarea' },
      { key: 'bulletPoints', label: 'Erfolge & Highlights', placeholder: 'z.B. Umsatz um 30% gesteigert', type: 'bullets' },
    ],
  },
  education: {
    type: 'education',
    label: 'Ausbildung / Studium',
    icon: 'graduation',
    fields: [
      { key: 'degree', label: 'Abschluss / Studiengang', placeholder: 'z.B. Bachelor Informatik', type: 'text', required: true },
      { key: 'institution', label: 'Institution / Hochschule', placeholder: 'z.B. TU München', type: 'text', required: true },
      { key: 'location', label: 'Ort', placeholder: 'z.B. München', type: 'text' },
      { key: 'dateRange', label: 'Zeitraum', placeholder: '', type: 'date-range' },
      { key: 'description', label: 'Schwerpunkte / Beschreibung', placeholder: 'z.B. Schwerpunkt: Künstliche Intelligenz', type: 'textarea' },
    ],
  },
  projects: {
    type: 'projects',
    label: 'Projekt',
    icon: 'project',
    fields: [
      { key: 'title', label: 'Projektname', placeholder: 'z.B. Web-App Relaunch', type: 'text', required: true },
      { key: 'role', label: 'Deine Rolle', placeholder: 'z.B. Frontend Lead', type: 'text' },
      { key: 'description', label: 'Beschreibung', placeholder: 'Kurze Projektbeschreibung...', type: 'textarea' },
      { key: 'bulletPoints', label: 'Ergebnisse / Beiträge', placeholder: 'z.B. Ladezeit um 50% reduziert', type: 'bullets' },
    ],
  },
  volunteering: {
    type: 'volunteering',
    label: 'Ehrenamt',
    icon: 'volunteer',
    fields: [
      { key: 'title', label: 'Rolle / Position', placeholder: 'z.B. Jugendbetreuer', type: 'text', required: true },
      { key: 'company', label: 'Organisation', placeholder: 'z.B. DRJ e.V.', type: 'text', required: true },
      { key: 'location', label: 'Ort', placeholder: 'z.B. Düsseldorf', type: 'text' },
      { key: 'dateRange', label: 'Zeitraum', placeholder: '', type: 'date-range' },
      { key: 'description', label: 'Beschreibung', placeholder: 'Was hast du gemacht?', type: 'textarea' },
    ],
  },
  certifications: {
    type: 'certifications',
    label: 'Zertifikat',
    icon: 'certificate',
    fields: [
      { key: 'name', label: 'Name des Zertifikats', placeholder: 'z.B. AWS Solutions Architect', type: 'text', required: true },
      { key: 'institution', label: 'Aussteller', placeholder: 'z.B. Amazon Web Services', type: 'text' },
      { key: 'date', label: 'Datum', placeholder: 'z.B. 03/2025', type: 'text' },
    ],
  },
  stipendien: {
    type: 'stipendien',
    label: 'Stipendium',
    icon: 'certificate',
    fields: [
      { key: 'name', label: 'Name des Stipendiums', placeholder: 'z.B. Deutschlandstipendium', type: 'text', required: true },
      { key: 'institution', label: 'Vergeber', placeholder: 'z.B. BMW Group', type: 'text' },
      { key: 'date', label: 'Datum', placeholder: 'z.B. 2024', type: 'text' },
    ],
  },
  awards: {
    type: 'awards',
    label: 'Auszeichnung',
    icon: 'certificate',
    fields: [
      { key: 'name', label: 'Name der Auszeichnung', placeholder: 'z.B. Best Thesis Award', type: 'text', required: true },
      { key: 'institution', label: 'Vergeber', placeholder: 'z.B. TU München', type: 'text' },
      { key: 'date', label: 'Datum', placeholder: 'z.B. 2025', type: 'text' },
    ],
  },
  languages: {
    type: 'languages',
    label: 'Sprache',
    icon: 'language',
    fields: [
      { key: 'language', label: 'Sprache', placeholder: 'z.B. Englisch', type: 'text', required: true },
      { key: 'level', label: 'Niveau', placeholder: 'z.B. Verhandlungssicher (C1)', type: 'text' },
    ],
  },
  skills: {
    type: 'skills',
    label: 'Fähigkeit',
    icon: 'skill',
    fields: [
      { key: 'skill', label: 'Fähigkeit', placeholder: 'z.B. Python', type: 'text', required: true },
      { key: 'level', label: 'Niveau (optional)', placeholder: 'z.B. Fortgeschritten', type: 'text' },
    ],
  },
  soft_skills: {
    type: 'soft_skills',
    label: 'Soft Skill',
    icon: 'skill',
    fields: [
      { key: 'skill', label: 'Stärke', placeholder: 'z.B. Teamführung', type: 'text', required: true },
    ],
  },
  work_values: {
    type: 'work_values',
    label: 'Wert / Arbeitsweise',
    icon: 'simple',
    fields: [
      { key: 'label', label: 'Wert', placeholder: 'z.B. Eigenverantwortung', type: 'text', required: true },
    ],
  },
  hobbies: {
    type: 'hobbies',
    label: 'Hobby / Interesse',
    icon: 'simple',
    fields: [
      { key: 'label', label: 'Hobby', placeholder: 'z.B. Bergsteigen', type: 'text', required: true },
    ],
  },
};

const ICON_MAP = {
  briefcase: Briefcase,
  graduation: Award,
  project: FileText,
  language: Award,
  skill: Award,
  certificate: Award,
  volunteer: Briefcase,
  simple: Award,
};

interface AddStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (type: string, item: any) => void;
  stationType: string | null;
}

export function AddStationModal({ isOpen, onClose, onAdd, stationType }: AddStationModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [bullets, setBullets] = useState<string[]>(['']);

  useEffect(() => {
    if (isOpen && stationType) {
      setCurrentStep(0);
      setFormData({});
      setDateFrom('');
      setDateTo('');
      setIsCurrent(false);
      setBullets(['']);
    }
  }, [isOpen, stationType]);

  if (!isOpen || !stationType) return null;

  const config = FIELD_GROUPS[stationType];
  if (!config) return null;

  const Icon = ICON_MAP[config.icon] || Award;
  const visibleFields = config.fields;
  const currentField = visibleFields[currentStep];
  const isLastStep = currentStep === visibleFields.length - 1;

  const canProceed = () => {
    if (!currentField) return false;
    if (!currentField.required) return true;
    if (currentField.type === 'date-range') {
      return dateFrom.trim().length > 0 || isCurrent;
    }
    if (currentField.type === 'bullets') {
      return bullets.some((b) => b.trim().length > 0);
    }
    return (formData[currentField.key] ?? '').trim().length > 0;
  };

  const handleNext = () => {
    if (!canProceed()) return;
    if (currentField.type === 'date-range') {
      setFormData((prev) => ({
        ...prev,
        date_from: dateFrom,
        date_to: isCurrent ? 'Heute' : dateTo,
      }));
    } else if (currentField.type === 'bullets') {
      setFormData((prev) => ({
        ...prev,
        bulletPoints: bullets.filter((b) => b.trim().length > 0),
      }));
    }
    if (isLastStep) {
      handleSave();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleSave = () => {
    const finalData: Record<string, any> = { ...formData };
    finalData.date_from = dateFrom;
    finalData.date_to = isCurrent ? 'Heute' : dateTo;
    finalData.bulletPoints = bullets.filter((b) => b.trim().length > 0);

    if (stationType === 'experience') {
      finalData.title = finalData.title || '';
      finalData.company = finalData.company || '';
      finalData.location = finalData.location || '';
    } else if (stationType === 'education') {
      finalData.degree = finalData.degree || '';
      finalData.institution = finalData.institution || '';
      finalData.location = finalData.location || '';
    } else if (stationType === 'projects') {
      finalData.title = finalData.title || '';
      finalData.role = finalData.role || '';
    }

    onAdd(stationType, finalData);
    onClose();
  };

  const stepLabels = visibleFields.map((f) => f.label);
  const progress = ((currentStep + 1) / visibleFields.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className="bg-[#0d1117] border border-white/15 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-[#0d1117] border-b border-white/10 px-6 py-4 z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#66c0b6]/15 border border-[#66c0b6]/30 flex items-center justify-center">
                  <Icon size={18} className="text-[#66c0b6]" />
                </div>
                <div>
                  <h3 className="text-white text-base font-bold leading-tight">{config.label} hinzufügen</h3>
                  <p className="text-white/40 text-xs">Schritt {currentStep + 1} von {visibleFields.length}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#66c0b6] to-[#30E3CA]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-1 mt-3 overflow-x-auto hide-scrollbar">
              {stepLabels.map((label, i) => (
                <div
                  key={i}
                  className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap transition-all ${
                    i === currentStep
                      ? 'bg-[#66c0b6]/20 text-[#66c0b6] border border-[#66c0b6]/40'
                      : i < currentStep
                        ? 'text-[#66c0b6]/60'
                        : 'text-white/30'
                  }`}
                >
                  {i < currentStep && <Check size={9} className="inline mr-1" />}
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {currentField && (
                  <>
                    <div>
                      <label className="text-white/70 text-sm font-semibold block mb-1.5">
                        {currentField.label}
                        {currentField.required && <span className="text-[#66c0b6] ml-1">*</span>}
                      </label>
                      <p className="text-white/40 text-xs mb-3">{currentField.placeholder}</p>
                    </div>

                    {currentField.type === 'text' && (
                      <input
                        type="text"
                        value={formData[currentField.key] ?? ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, [currentField.key]: e.target.value }))}
                        placeholder={currentField.placeholder}
                        autoFocus
                        className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder-white/35 focus:outline-none focus:border-[#66c0b6] text-sm"
                      />
                    )}

                    {currentField.type === 'textarea' && (
                      <textarea
                        value={formData[currentField.key] ?? ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, [currentField.key]: e.target.value }))}
                        placeholder={currentField.placeholder}
                        autoFocus
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder-white/35 focus:outline-none focus:border-[#66c0b6] text-sm resize-none"
                      />
                    )}

                    {currentField.type === 'date-range' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-white/50 text-xs mb-1.5 block">Von</label>
                            <input
                              type="text"
                              value={dateFrom}
                              onChange={(e) => setDateFrom(e.target.value)}
                              placeholder="MM/JJJJ"
                              className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder-white/35 focus:outline-none focus:border-[#66c0b6] text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-white/50 text-xs mb-1.5 block">Bis</label>
                            <input
                              type="text"
                              value={dateTo}
                              onChange={(e) => setDateTo(e.target.value)}
                              placeholder="MM/JJJJ"
                              disabled={isCurrent}
                              className={`w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder-white/35 focus:outline-none focus:border-[#66c0b6] text-sm ${isCurrent ? 'opacity-40' : ''}`}
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isCurrent}
                            onChange={(e) => setIsCurrent(e.target.checked)}
                            className="w-4 h-4 accent-[#66c0b6] rounded"
                          />
                          <span className="text-white/70 text-sm">Aktuelle Position</span>
                        </label>
                      </div>
                    )}

                    {currentField.type === 'bullets' && (
                      <div className="space-y-2">
                        {bullets.map((bullet, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-[#66c0b6] mt-3 text-sm shrink-0">•</span>
                            <input
                              type="text"
                              value={bullet}
                              onChange={(e) => {
                                const newBullets = [...bullets];
                                newBullets[i] = e.target.value;
                                setBullets(newBullets);
                              }}
                              placeholder={currentField.placeholder}
                              className="flex-1 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white placeholder-white/35 focus:outline-none focus:border-[#66c0b6] text-sm"
                            />
                            {bullets.length > 1 && (
                              <button
                                onClick={() => setBullets(bullets.filter((_, idx) => idx !== i))}
                                className="mt-2 text-white/30 hover:text-red-400 transition-colors shrink-0"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => setBullets([...bullets, ''])}
                          className="flex items-center gap-1.5 text-[#66c0b6] text-sm font-medium hover:text-[#30E3CA] transition-colors mt-2"
                        >
                          <Plus size={15} /> Weiteren Erfolg hinzufügen
                        </button>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-[#0d1117] border-t border-white/10 px-6 py-4 flex gap-2">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center gap-1 px-4 py-3 rounded-xl border border-white/15 text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            >
              <ChevronLeft size={15} /> Zurück
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl font-semibold text-sm transition-all flex-1 bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLastStep ? (
                <><Check size={16} /> Speichern</>
              ) : (
                <>Weiter <ChevronRight size={15} /></>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function getStationFields(type: string): StationFieldConfig | null {
  return FIELD_GROUPS[type] || null;
}

export function hasGuidedModal(type: string): boolean {
  return !!FIELD_GROUPS[type];
}
