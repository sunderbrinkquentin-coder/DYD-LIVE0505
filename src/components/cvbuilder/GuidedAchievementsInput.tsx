import { useState } from 'react';
import { Plus, X, Check, ChevronRight, ChevronLeft, Sparkles, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExperienceLevel } from '../../types/cvBuilder';

export interface GuidedAchievement {
  category: string;
  task: string;
  metricKey: 'number' | 'percentage' | 'money' | 'timeframe';
  metricValue: string;
  resultText: string;
}

interface AchievementCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  prompt: string;
  examples: string[];
  metricLabel: string;
  metricKey: 'number' | 'percentage' | 'money' | 'timeframe';
  options: string[];
  inputPlaceholder: string;
}

const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
  {
    id: 'efficiency',
    label: 'Prozessverbesserung',
    icon: '⚙️',
    color: 'from-orange-500/20 to-amber-500/20 border-orange-500/30',
    prompt: 'Hast du einen Prozess verbessert, beschleunigt oder vereinfacht?',
    examples: [
      'Bearbeitungszeit halbiert',
      'Workflow automatisiert',
      'Dokumentationsvorlage eingeführt',
    ],
    metricLabel: 'Wie viel Zeit oder Aufwand wurde gespart?',
    metricKey: 'percentage',
    options: ['10%', '20%', '30%', '50%', '70%'],
    inputPlaceholder: 'z.B. 35%',
  },
  {
    id: 'revenue',
    label: 'Umsatz & Kosten',
    icon: '💶',
    color: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
    prompt: 'Hast du Umsatz gesteigert, Kosten gesenkt oder ein Budget verantwortet?',
    examples: [
      'Umsatz gesteigert',
      'Betriebskosten gesenkt',
      'Budget verantwortet',
    ],
    metricLabel: 'Welcher Betrag oder welche Prozentänderung?',
    metricKey: 'money',
    options: ['< €10k', '€10k–50k', '€50k–200k', '€200k–1Mio.', '> €1 Mio.'],
    inputPlaceholder: 'z.B. €250.000',
  },
  {
    id: 'growth',
    label: 'Wachstum & Reichweite',
    icon: '📈',
    color: 'from-teal-500/20 to-cyan-500/20 border-teal-500/30',
    prompt: 'Hast du Wachstum erzeugt – Leads, Kunden, Reichweite, Nutzer?',
    examples: [
      'Neukunden gewonnen',
      'Follower-Reichweite aufgebaut',
      'Lead-Generierung erhöht',
    ],
    metricLabel: 'Wie viel Wachstum oder welche Anzahl?',
    metricKey: 'number',
    options: ['10', '50', '100', '500', '1.000+'],
    inputPlaceholder: 'z.B. 350 Neukunden',
  },
  {
    id: 'quality',
    label: 'Qualität & Zufriedenheit',
    icon: '✅',
    color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    prompt: 'Hast du die Qualität verbessert oder Kundenzufriedenheit gesteigert?',
    examples: [
      'Fehlerquote reduziert',
      'Kundenzufriedenheit (NPS) erhöht',
      'Positive Feedback-Quote erreicht',
    ],
    metricLabel: 'Um wie viel hast du die Qualität verbessert?',
    metricKey: 'percentage',
    options: ['+5 Pkt.', '+10 Pkt.', '+15 Pkt.', '+20 Pkt.', 'auf 95%+'],
    inputPlaceholder: 'z.B. NPS von 6 auf 8',
  },
  {
    id: 'leadership',
    label: 'Führung & Team',
    icon: '👥',
    color: 'from-violet-500/20 to-purple-500/20 border-violet-500/30',
    prompt: 'Hast du ein Team geführt, geschult oder jemanden eingearbeitet?',
    examples: [
      'Teammitglieder eingearbeitet',
      'Schulungen durchgeführt',
      'Mentoring übernommen',
    ],
    metricLabel: 'Wie viele Personen oder welches Teamvolumen?',
    metricKey: 'number',
    options: ['2', '5', '10', '15', '20+'],
    inputPlaceholder: 'z.B. 8 Mitarbeitende',
  },
  {
    id: 'project',
    label: 'Projektabschluss',
    icon: '🎯',
    color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30',
    prompt: 'Hast du ein Projekt erfolgreich abgeschlossen – in Time, Budget oder Qualität?',
    examples: [
      'Projekt pünktlich geliefert',
      'Unter Budget abgeschlossen',
      'Meilenstein erreicht',
    ],
    metricLabel: 'In welchem Zeitrahmen oder mit welchem Ergebnis?',
    metricKey: 'timeframe',
    options: ['in 4 Wochen', 'in 3 Monaten', 'in 6 Monaten', 'unter Budget', 'vor Deadline'],
    inputPlaceholder: 'z.B. 3 Monate früher als geplant',
  },
];

interface GuidedAchievementsInputProps {
  experienceLevel: ExperienceLevel;
  value: GuidedAchievement[];
  onChange: (achievements: GuidedAchievement[]) => void;
  title?: string;
  emptyMessage?: string;
}

type WizardStep = 'category' | 'task' | 'metric' | 'result';

export function GuidedAchievementsInput({
  value = [],
  onChange,
  title = 'Erfolge hinzufügen',
  emptyMessage = 'Füge mindestens einen Erfolg hinzu, der dich von anderen abhebt.',
}: GuidedAchievementsInputProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | null>(null);
  const [taskText, setTaskText] = useState('');
  const [metricValue, setMetricValue] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const resetWizard = () => {
    setWizardStep('category');
    setSelectedCategory(null);
    setTaskText('');
    setMetricValue('');
    setEditingIndex(null);
  };

  const startAdd = () => {
    resetWizard();
    setIsAdding(true);
  };

  const startEdit = (index: number) => {
    const item = value[index];
    const cat = ACHIEVEMENT_CATEGORIES.find(c => c.id === item.category);
    setSelectedCategory(cat || null);
    setTaskText(item.task);
    setMetricValue(item.metricValue);
    setEditingIndex(index);
    setWizardStep('result');
    setIsAdding(true);
  };

  const selectCategory = (cat: AchievementCategory) => {
    setSelectedCategory(cat);
    setWizardStep('task');
  };

  const confirmTask = () => {
    if (!taskText.trim()) return;
    setWizardStep('metric');
  };

  const confirmMetric = () => {
    if (!metricValue.trim()) return;
    setWizardStep('result');
  };

  const finalize = () => {
    if (!selectedCategory || !taskText.trim()) return;
    const resultText = metricValue.trim()
      ? `${taskText.trim()} – ${metricValue.trim()}`
      : taskText.trim();

    const achievement: GuidedAchievement = {
      category: selectedCategory.id,
      task: taskText.trim(),
      metricKey: selectedCategory.metricKey,
      metricValue: metricValue.trim(),
      resultText,
    };

    if (editingIndex !== null) {
      const updated = [...value];
      updated[editingIndex] = achievement;
      onChange(updated);
    } else {
      onChange([...value, achievement]);
    }
    setIsAdding(false);
    resetWizard();
  };

  const removeAchievement = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const stepNumber = wizardStep === 'category' ? 1 : wizardStep === 'task' ? 2 : wizardStep === 'metric' ? 3 : 4;
  const stepLabels: Record<WizardStep, string> = {
    category: 'Kategorie',
    task: 'Beschreibung',
    metric: 'Kennzahl',
    result: 'Vorschau',
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
        {value.length === 0 && !isAdding && (
          <p className="text-white/50 text-xs mb-3">{emptyMessage}</p>
        )}
      </div>

      {/* Selected achievements */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#66c0b6]/10 border border-[#66c0b6]/30"
            >
              <Check size={14} className="text-[#66c0b6] shrink-0" />
              <span className="text-white/90 text-sm flex-1">{item.resultText}</span>
              <button
                onClick={() => startEdit(index)}
                className="text-white/40 hover:text-[#66c0b6] transition-colors shrink-0"
              >
                <Sparkles size={13} />
              </button>
              <button
                onClick={() => removeAchievement(index)}
                className="text-white/30 hover:text-red-400 transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      {!isAdding && (
        <button
          onClick={startAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/20 text-white/55 hover:text-white hover:border-[#66c0b6]/40 hover:bg-[#66c0b6]/5 transition-all text-sm w-full justify-center"
        >
          <Plus size={16} /> Erfolg hinzufügen
        </button>
      )}

      {/* Guided wizard modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="bg-[#0d1117] border border-white/15 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-6 max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-[#66c0b6]" />
                  <h3 className="text-white text-lg font-bold">Erfolg hinzufügen</h3>
                </div>
                <button
                  onClick={() => { setIsAdding(false); resetWizard(); }}
                  className="text-white/40 hover:text-white shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-5">
                {(['category', 'task', 'metric', 'result'] as WizardStep[]).map((step, i) => {
                  const stepNum = i + 1;
                  const isDone = stepNumber > stepNum;
                  const isCurrent = stepNumber === stepNum;
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className={`flex items-center gap-2 ${isCurrent ? 'opacity-100' : 'opacity-50'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isDone ? 'bg-[#66c0b6] text-black' :
                          isCurrent ? 'bg-[#66c0b6]/30 border border-[#66c0b6] text-[#66c0b6]' :
                          'bg-white/10 text-white/40'
                        }`}>
                          {isDone ? <Check size={12} /> : stepNum}
                        </div>
                        <span className={`text-xs font-medium ${isCurrent ? 'text-white' : 'text-white/50'} hidden sm:inline`}>
                          {stepLabels[step]}
                        </span>
                      </div>
                      {i < 3 && (
                        <div className={`flex-1 h-0.5 mx-1 rounded-full ${isDone ? 'bg-[#66c0b6]/50' : 'bg-white/10'}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Step 1: Category selection */}
              <AnimatePresence mode="wait">
                {wizardStep === 'category' && (
                  <motion.div
                    key="category"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <p className="text-white/60 text-sm mb-3">
                      Was für ein Erfolg war das? Wähle eine Kategorie:
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {ACHIEVEMENT_CATEGORIES.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => selectCategory(cat)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-gradient-to-r ${cat.color} text-left transition-all hover:scale-[1.02]`}
                        >
                          <span className="text-xl">{cat.icon}</span>
                          <div className="flex-1">
                            <p className="text-white font-semibold text-sm">{cat.label}</p>
                            <p className="text-white/45 text-xs mt-0.5">{cat.prompt}</p>
                          </div>
                          <ChevronRight size={16} className="text-white/40 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Task description */}
                {wizardStep === 'task' && selectedCategory && (
                  <motion.div
                    key="task"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div>
                      <p className="text-[#66c0b6] text-xs font-semibold uppercase tracking-wider mb-1">
                        {selectedCategory.icon} {selectedCategory.label}
                      </p>
                      <h3 className="text-white text-base font-bold mb-2">
                        Beschreibe deinen Erfolg in einem Satz
                      </h3>
                      <p className="text-white/45 text-xs mb-3">
                        Beispiele: {selectedCategory.examples.join(' · ')}
                      </p>
                    </div>
                    <textarea
                      value={taskText}
                      onChange={e => setTaskText(e.target.value)}
                      placeholder="z.B. Automatisierung des Berichtswesens eingeführt"
                      className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder-white/35 focus:outline-none focus:border-[#66c0b6] text-sm resize-none"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setWizardStep('category'); setTaskText(''); }}
                        className="flex items-center gap-1 px-4 py-3 rounded-xl border border-white/15 text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm shrink-0"
                      >
                        <ChevronLeft size={15} /> Zurück
                      </button>
                      <button
                        onClick={confirmTask}
                        disabled={!taskText.trim()}
                        className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl font-semibold text-sm transition-all flex-1 bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black hover:opacity-90 disabled:opacity-40"
                      >
                        Weiter <ChevronRight size={15} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Metric */}
                {wizardStep === 'metric' && selectedCategory && (
                  <motion.div
                    key="metric"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div>
                      <p className="text-[#66c0b6] text-xs font-semibold uppercase tracking-wider mb-1">
                        {selectedCategory.icon} {selectedCategory.label}
                      </p>
                      <h3 className="text-white text-base font-bold mb-1">
                        {selectedCategory.metricLabel}
                      </h3>
                      <p className="text-white/45 text-xs mb-3">
                        Schätze konservativ – lieber etwas weniger als übertreiben.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedCategory.options.map(opt => (
                        <button
                          key={opt}
                          onClick={() => setMetricValue(opt)}
                          className={`px-3 py-3 rounded-xl border text-sm font-medium transition-all ${
                            metricValue === opt
                              ? 'border-[#66c0b6] bg-[#66c0b6]/20 text-white shadow-[0_0_12px_rgba(102,192,182,0.2)]'
                              : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:border-white/20'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={metricValue}
                      onChange={e => setMetricValue(e.target.value)}
                      placeholder={selectedCategory.inputPlaceholder}
                      className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder-white/35 focus:outline-none focus:border-[#66c0b6] text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setWizardStep('task'); setMetricValue(''); }}
                        className="flex items-center gap-1 px-4 py-3 rounded-xl border border-white/15 text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm shrink-0"
                      >
                        <ChevronLeft size={15} /> Zurück
                      </button>
                      <button
                        onClick={confirmMetric}
                        disabled={!metricValue.trim()}
                        className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl font-semibold text-sm transition-all flex-1 bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black hover:opacity-90 disabled:opacity-40"
                      >
                        Weiter <ChevronRight size={15} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Result preview */}
                {wizardStep === 'result' && selectedCategory && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div>
                      <p className="text-[#66c0b6] text-xs font-semibold uppercase tracking-wider mb-1">
                        Vorschau
                      </p>
                      <h3 className="text-white text-base font-bold mb-3">
                        So sieht dein Erfolg im Lebenslauf aus:
                      </h3>
                    </div>
                    <div className="bg-[#66c0b6]/10 border border-[#66c0b6]/30 rounded-xl px-5 py-4">
                      <p className="text-[#66c0b6] text-sm font-medium leading-relaxed">
                        {metricValue.trim()
                          ? `${taskText.trim()} – ${metricValue.trim()}`
                          : taskText.trim()}
                      </p>
                    </div>
                    <p className="text-white/40 text-xs">
                      Du kannst die Beschreibung oder Kennzahl noch anpassen, indem du zurückgehst.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setWizardStep('metric')}
                        className="flex items-center gap-1 px-4 py-3 rounded-xl border border-white/15 text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm shrink-0"
                      >
                        <ChevronLeft size={15} /> Zurück
                      </button>
                      <button
                        onClick={finalize}
                        className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl font-bold text-sm transition-all flex-1 bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black hover:opacity-90"
                      >
                        <Check size={16} /> Speichern
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
