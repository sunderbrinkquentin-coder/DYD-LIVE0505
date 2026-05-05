import { useState } from 'react';
import { Plus, X, Check, CreditCard as Edit2, ChevronRight, ChevronLeft, Lightbulb, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExperienceLevel } from '../../types/cvBuilder';

// ── STAR coaching examples by industry ────────────────────────────────────────
const STAR_EXAMPLES: Record<string, { situation: string; result: string; example: string }[]> = {
  sales: [
    { situation: 'Sales / Vertrieb', result: '% Umsatzsteigerung', example: 'Neukundenakquise um 23% gesteigert durch systematisches CRM-Tracking' },
    { situation: 'Sales / Vertrieb', result: 'Anzahl Abschlüsse', example: 'Ø 8 Vertragsabschlüsse pro Monat in der DACH-Region betreut' },
  ],
  hr: [
    { situation: 'HR / Recruiting', result: 'Time-to-hire', example: 'Time-to-Hire von 45 auf 28 Tage reduziert durch Active Sourcing' },
    { situation: 'HR / Personalwesen', result: 'Mitarbeiterzufriedenheit', example: 'eNPS um 12 Punkte gesteigert durch strukturiertes Onboarding' },
  ],
  health: [
    { situation: 'Gesundheitswesen', result: 'Patientenanzahl', example: 'Tägliche Betreuung von 12–18 Patienten mit individueller Pflegedokumentation' },
    { situation: 'Gesundheitswesen', result: 'Prozessverbesserung', example: 'Dokumentationszeit um 30% reduziert durch digitales System eingeführt' },
  ],
  it: [
    { situation: 'IT / Software', result: 'Performance-Gewinn', example: 'API-Response-Zeit um 40% verbessert durch Refactoring' },
    { situation: 'IT / Entwicklung', result: 'Release-Zyklen', example: 'Deploy-Frequenz von monatlich auf wöchentlich erhöht' },
  ],
  marketing: [
    { situation: 'Marketing', result: 'Reichweite / Leads', example: 'Organischen Traffic um 35% gesteigert durch SEO-Optimierung in 3 Monaten' },
    { situation: 'Marketing', result: 'ROI der Kampagne', example: 'ROAS von 2,1 auf 3,8 verbessert durch Zielgruppen-Segmentierung' },
  ],
  logistik: [
    { situation: 'Logistik', result: 'Durchlaufzeit', example: 'Lieferzeit um 15% reduziert durch Routenoptimierung mit neuem TMS' },
    { situation: 'Supply Chain', result: 'Fehlerquote', example: 'Kommissionierfehler um 22% gesenkt durch Barcode-Scanning eingeführt' },
  ],
  finance: [
    { situation: 'Finance / Controlling', result: 'Kosteneinsparung', example: 'Betriebskosten um 8% reduziert durch Zero-Based Budgeting' },
    { situation: 'Controlling', result: 'Reporting-Effizienz', example: 'Monatsabschluss von 5 auf 2 Tage beschleunigt durch automatisiertes Dashboard' },
  ],
};

const STAR_FALLBACK = [
  { situation: 'Allgemein', result: 'Effizienzgewinn', example: 'Prozess um 20% beschleunigt durch strukturierte Priorisierung' },
  { situation: 'Teamarbeit', result: 'Projektabschluss', example: 'Cross-funktionales Projekt mit 5 Beteiligten in time & budget geliefert' },
];

export function getStarExamples(industry?: string): { situation: string; result: string; example: string }[] {
  const key = industry?.toLowerCase() ?? '';
  for (const [k, examples] of Object.entries(STAR_EXAMPLES)) {
    if (key.includes(k)) return examples;
  }
  return STAR_FALLBACK;
}

// ── STAR Coaching Popover ──────────────────────────────────────────────────────
interface STARCoachingProps {
  jobTitle?: string;
  industry?: string;
  onDismiss: () => void;
}

export function STARCoachingBanner({ jobTitle, industry, onDismiss }: STARCoachingProps) {
  const examples = getStarExamples(industry);
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-2xl border border-[#66c0b6]/30 bg-gradient-to-r from-[#66c0b6]/10 to-[#30E3CA]/5 p-4 mb-4"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-[#66c0b6] shrink-0" />
          <p className="text-[#66c0b6] font-semibold text-sm">
            Lass uns diesen Punkt messbar machen!
          </p>
        </div>
        <button onClick={onDismiss} className="text-white/30 hover:text-white/60 shrink-0">
          <X size={16} />
        </button>
      </div>
      <p className="text-white/50 text-xs mb-3">
        Starke CV-Punkte folgen der STAR-Methode: Situation → Task → Action → <strong className="text-white/70">Result</strong>.
        {jobTitle && <span> Passend für <span className="text-[#66c0b6]">{jobTitle}</span>:</span>}
      </p>
      <div className="space-y-2">
        {examples.map((ex, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <Lightbulb size={12} className="text-[#66c0b6]/70 shrink-0 mt-0.5" />
            <div>
              <span className="text-white/40">{ex.situation} · </span>
              <span className="text-white/75">{ex.example}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

interface TaskWithMetrics {
  task: string;
  metrics: {
    number?: string;
    percentage?: string;
    money?: string;
    timeframe?: string;
    description: string;
  };
}

interface MetricsQuestion {
  key: keyof Omit<TaskWithMetrics['metrics'], 'description'>;
  label: string;
  icon: string;
  question: string;
  hint: string;
  options: string[];
  inputPlaceholder: string;
}

interface TasksWithMetricsInputProps {
  experienceLevel: ExperienceLevel;
  suggestedTasks: string[];
  value: TaskWithMetrics[];
  onChange: (tasks: TaskWithMetrics[]) => void;
  title?: string;
  emptyMessage?: string;
}

function getContextualQuestions(task: string, level: ExperienceLevel): MetricsQuestion[] {
  const t = task.toLowerCase();

  const isPercentageTask =
    t.includes('steiger') || t.includes('verbess') || t.includes('optimier') ||
    t.includes('reduzier') || t.includes('spar') || t.includes('effizienz') ||
    t.includes('wachstum') || t.includes('konvers') || t.includes('rate');

  const isVolumeTask =
    t.includes('bearbeit') || t.includes('koordinier') || t.includes('manag') ||
    t.includes('betreu') || t.includes('anfrag') || t.includes('ticket') ||
    t.includes('kunden') || t.includes('projekt') || t.includes('produkt');

  const isRevenueTask =
    t.includes('umsatz') || t.includes('verkauf') || t.includes('vertrieb') ||
    t.includes('budget') || t.includes('revenue') || t.includes('einspar') ||
    t.includes('kosten');

  const isLeadTask =
    t.includes('führ') || t.includes('team') || t.includes('mitarbeiter') ||
    t.includes('aufbau') || t.includes('rekrutier') || t.includes('mentor') ||
    t.includes('leitung');

  const isTimeTask =
    t.includes('beschleunig') || t.includes('schneller') || t.includes('frist') ||
    t.includes('deadline') || t.includes('lieferzeit') ||
    t.includes('rollout') || t.includes('einführ');

  const questions: MetricsQuestion[] = [];

  if (isLeadTask) {
    const teamOptions =
      level === 'beginner' ? ['2', '3', '5'] :
      level === 'some-experience' ? ['3', '5', '8', '10'] :
      ['5', '10', '15', '20', '30'];
    questions.push({
      key: 'number',
      label: 'Teamgröße',
      icon: '👥',
      question: 'Wie viele Mitarbeitende hast du geführt oder betreut?',
      hint: 'Direkte Berichte oder auch fachliche Verantwortung zählen.',
      options: teamOptions,
      inputPlaceholder: 'Eigene Anzahl...',
    });
  } else if (isVolumeTask || (!isPercentageTask && !isRevenueTask)) {
    const volumeOptions =
      level === 'beginner' ? ['5', '10', '20', '50', '100'] :
      level === 'some-experience' ? ['10', '25', '50', '100', '250'] :
      ['20', '50', '100', '500', '1.000'];
    questions.push({
      key: 'number',
      label: 'Volumen / Menge',
      icon: '📊',
      question: `Wie viele ${
        t.includes('kunden') ? 'Kunden' :
        t.includes('projekt') ? 'Projekte' :
        t.includes('anfrag') ? 'Anfragen' :
        t.includes('ticket') ? 'Tickets' :
        'Einheiten'
      } hast du dabei typischerweise bearbeitet?`,
      hint: 'Pro Tag, Woche oder im Gesamtzeitraum – was klingt am stärksten?',
      options: volumeOptions,
      inputPlaceholder: 'Eigene Zahl eingeben...',
    });
  }

  if (isPercentageTask) {
    const pctOptions =
      level === 'beginner' ? ['5%', '10%', '15%', '20%', '30%'] :
      level === 'some-experience' ? ['10%', '15%', '20%', '30%', '40%'] :
      ['15%', '20%', '30%', '40%', '50%'];
    questions.push({
      key: 'percentage',
      label: 'Verbesserung / Wachstum',
      icon: '📈',
      question: t.includes('reduzier') || t.includes('spar')
        ? 'Um wie viel Prozent hast du reduziert oder gespart?'
        : 'Um wie viel Prozent hast du gesteigert oder verbessert?',
      hint: 'Schätz konservativ – lieber etwas weniger als übertreiben.',
      options: pctOptions,
      inputPlaceholder: 'z.B. 23%',
    });
  }

  if (isRevenueTask) {
    const moneyOptions =
      level === 'beginner' ? ['€1.000', '€5.000', '€10.000', '€50.000'] :
      level === 'some-experience' ? ['€10.000', '€50.000', '€100.000', '€500.000'] :
      ['€100.000', '€500.000', '€1 Mio.', '€5 Mio.'];
    questions.push({
      key: 'money',
      label: 'Geldwert / Budget',
      icon: '💶',
      question: t.includes('budget') || t.includes('einspar') || t.includes('kosten')
        ? 'Welches Budget oder welche Einsparung hast du verantwortet?'
        : 'Welchen Umsatz oder Auftragswert hast du verantwortet?',
      hint: 'Auch Projektbudget oder Einsparvolumen zählt hier.',
      options: moneyOptions,
      inputPlaceholder: 'z.B. €250.000',
    });
  }

  if (isTimeTask) {
    questions.push({
      key: 'timeframe',
      label: 'Zeitgewinn / Frist',
      icon: '⏱️',
      question: 'In welchem Zeitrahmen hast du das erreicht oder wie viel Zeit hast du eingespart?',
      hint: 'z.B. Rollout in 6 Wochen, oder 3 Stunden/Woche gespart.',
      options: ['1 Woche früher', '2x schneller', 'in 4 Wochen', 'in 3 Monaten', 'in 6 Monaten', 'innerhalb 1 Jahr'],
      inputPlaceholder: 'z.B. in 6 Wochen',
    });
  } else if (questions.length > 0) {
    questions.push({
      key: 'timeframe',
      label: 'Zeitraum',
      icon: '📅',
      question: 'In welchem Zeitraum oder Rhythmus?',
      hint: '"50 Anfragen pro Woche" klingt stärker als nur "50 Anfragen".',
      options: ['täglich', 'pro Woche', 'pro Monat', 'pro Quartal', 'pro Jahr', 'im Projektzeitraum'],
      inputPlaceholder: 'Eigenen Zeitraum eingeben...',
    });
  }

  if (questions.length === 0) {
    questions.push({
      key: 'number',
      label: 'Kennzahl',
      icon: '📊',
      question: 'Gibt es eine konkrete Zahl, die diese Tätigkeit greifbar macht?',
      hint: 'Anzahl, Volumen, Häufigkeit – irgendetwas Messbares.',
      options: level === 'beginner' ? ['5', '10', '20', '50'] : ['20', '50', '100', '200', '500'],
      inputPlaceholder: 'Eigene Zahl...',
    });
    questions.push({
      key: 'timeframe',
      label: 'Zeitraum',
      icon: '📅',
      question: 'In welchem Zeitraum oder Rhythmus?',
      hint: '',
      options: ['täglich', 'pro Woche', 'pro Monat', 'pro Quartal', 'pro Jahr'],
      inputPlaceholder: 'Zeitraum...',
    });
  }

  return questions;
}

function buildPreviewText(task: string, metrics: Partial<TaskWithMetrics['metrics']>): string {
  const parts: string[] = [];
  if (metrics.number) parts.push(metrics.number);
  if (metrics.percentage) parts.push(metrics.percentage);
  if (metrics.money) parts.push(metrics.money);
  if (metrics.timeframe) parts.push(metrics.timeframe);
  if (parts.length === 0) return task;
  return `${task} – ${parts.join(', ')}`;
}

export function TasksWithMetricsInput({
  experienceLevel,
  suggestedTasks,
  value = [],
  onChange,
  title = 'Wähle deine Aufgaben',
  emptyMessage = 'Wähle mindestens 3 Aufgaben aus',
}: TasksWithMetricsInputProps) {
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [questionStep, setQuestionStep] = useState(0);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customTaskName, setCustomTaskName] = useState('');
  const [metricsForm, setMetricsForm] = useState<Partial<TaskWithMetrics['metrics']>>({});

  const questions = editingTask ? getContextualQuestions(editingTask, experienceLevel) : [];
  const currentQuestion = questions[questionStep] ?? null;
  const isLastStep = questionStep === questions.length - 1;
  const currentVal = currentQuestion ? (metricsForm[currentQuestion.key] ?? '') : '';
  const hasAnyMetric = !!(metricsForm.number || metricsForm.percentage || metricsForm.money || metricsForm.timeframe);

  const openEditor = (task: string, existingMetrics?: Partial<TaskWithMetrics['metrics']>) => {
    setEditingTask(task);
    setQuestionStep(0);
    setMetricsForm(existingMetrics ?? {});
  };

  const handleTaskClick = (task: string) => {
    const existing = value.find((t) => t.task === task);
    if (existing) {
      onChange(value.filter((t) => t.task !== task));
    } else {
      openEditor(task);
    }
  };

  const handleEdit = (task: string) => {
    const existing = value.find((t) => t.task === task);
    if (existing) {
      onChange(value.filter((t) => t.task !== task));
      openEditor(task, existing.metrics);
    }
  };

  const handleAnswer = (key: keyof Omit<TaskWithMetrics['metrics'], 'description'>, val: string) => {
    setMetricsForm((prev) => ({ ...prev, [key]: val === prev[key] ? '' : val }));
  };

  const advance = () => {
    if (!isLastStep) {
      setQuestionStep((s) => s + 1);
    } else {
      finalize();
    }
  };

  const finalize = () => {
    if (!editingTask) return;
    const description = buildPreviewText(editingTask, metricsForm);
    onChange([...value, {
      task: editingTask,
      metrics: {
        number: metricsForm.number,
        percentage: metricsForm.percentage,
        money: metricsForm.money,
        timeframe: metricsForm.timeframe,
        description,
      },
    }]);
    setEditingTask(null);
    setMetricsForm({});
    setQuestionStep(0);
  };

  const handleAddCustomTask = () => {
    if (customTaskName.trim()) {
      openEditor(customTaskName.trim());
      setIsAddingCustom(false);
      setCustomTaskName('');
    }
  };

  const isSelected = (task: string) => value.some((t) => t.task === task);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
        {value.length === 0 && (
          <p className="text-white/50 text-xs mb-3">{emptyMessage}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {suggestedTasks.map((task) => (
            <button
              key={task}
              onClick={() => handleTaskClick(task)}
              className={`group px-3 py-2 rounded-xl border transition-all duration-200 flex items-center gap-2 text-sm ${
                isSelected(task)
                  ? 'border-[#66c0b6] bg-[#66c0b6]/20 text-white shadow-[0_0_16px_rgba(102,192,182,0.25)]'
                  : 'border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <span>{task}</span>
              {isSelected(task) && (
                <>
                  <Check size={14} className="text-[#66c0b6] shrink-0" />
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); handleEdit(task); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleEdit(task); } }}
                    className="ml-0.5 p-0.5 rounded hover:bg-white/10 cursor-pointer"
                  >
                    <Edit2 size={12} className="text-white/60" />
                  </span>
                </>
              )}
            </button>
          ))}

          {!isAddingCustom ? (
            <button
              onClick={() => setIsAddingCustom(true)}
              className="px-3 py-2 rounded-xl border border-dashed border-white/20 bg-white/5 text-white/60 hover:bg-white/10 hover:border-white/30 hover:text-white transition-all text-sm flex items-center gap-2"
            >
              <Plus size={14} /> Eigene hinzufügen
            </button>
          ) : (
            <div className="flex gap-2 w-full mt-1">
              <input
                type="text"
                value={customTaskName}
                onChange={(e) => setCustomTaskName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCustomTask();
                  if (e.key === 'Escape') { setIsAddingCustom(false); setCustomTaskName(''); }
                }}
                placeholder="Eigene Tätigkeit beschreiben..."
                className="flex-1 px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-[#66c0b6]"
                autoFocus
              />
              <button
                onClick={handleAddCustomTask}
                disabled={!customTaskName.trim()}
                className="px-3 py-2 rounded-xl bg-[#66c0b6] text-black font-medium hover:opacity-90 transition-all disabled:opacity-40"
              >
                <Check size={15} />
              </button>
              <button
                onClick={() => { setIsAddingCustom(false); setCustomTaskName(''); }}
                className="px-3 py-2 rounded-xl border border-white/20 text-white/60 hover:bg-white/10 transition-all"
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#66c0b6]/10 border border-[#66c0b6]/30 text-sm"
            >
              <Check size={12} className="text-[#66c0b6] shrink-0" />
              <span className="text-white/90">{item.metrics.description || item.task}</span>
              <button
                onClick={() => handleEdit(item.task)}
                className="text-white/40 hover:text-white/80 transition-colors"
              >
                <Edit2 size={11} />
              </button>
              <button
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                className="text-white/30 hover:text-red-400 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {editingTask && currentQuestion && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#0d1117] border border-white/15 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-6 max-h-[85vh] overflow-y-auto">

            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 pr-4">
                <p className="text-[#66c0b6] text-xs font-semibold uppercase tracking-wider mb-1">
                  {editingTask}
                </p>
                <h3 className="text-white text-lg font-bold leading-snug">
                  {currentQuestion.icon} {currentQuestion.question}
                </h3>
                {currentQuestion.hint && (
                  <p className="text-white/40 text-xs mt-1.5 leading-relaxed">{currentQuestion.hint}</p>
                )}
              </div>
              <button
                onClick={() => { setEditingTask(null); setMetricsForm({}); setQuestionStep(0); }}
                className="text-white/40 hover:text-white shrink-0 mt-0.5"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-1.5 mb-5">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i < questionStep ? 'bg-[#66c0b6] w-6' :
                    i === questionStep ? 'bg-[#66c0b6] w-9' :
                    'bg-white/15 w-6'
                  }`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {currentQuestion.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(currentQuestion.key, opt)}
                  className={`px-3 py-3 rounded-xl border text-sm font-medium transition-all ${
                    currentVal === opt
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
              value={currentVal}
              onChange={(e) => setMetricsForm((prev) => ({ ...prev, [currentQuestion.key]: e.target.value }))}
              placeholder={currentQuestion.inputPlaceholder}
              className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder-white/35 focus:outline-none focus:border-[#66c0b6] text-sm mb-4"
            />

            {hasAnyMetric && (
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4">
                <p className="text-white/40 text-xs mb-1">Vorschau Bulletpoint:</p>
                <p className="text-[#66c0b6] text-sm font-medium">{buildPreviewText(editingTask, metricsForm)}</p>
              </div>
            )}

            <div className="flex gap-2">
              {questionStep > 0 && (
                <button
                  onClick={() => setQuestionStep((s) => s - 1)}
                  className="flex items-center gap-1 px-4 py-3 rounded-xl border border-white/15 text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm shrink-0"
                >
                  <ChevronLeft size={15} /> Zurück
                </button>
              )}

              <button
                onClick={advance}
                className={`flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl font-semibold text-sm transition-all flex-1 ${
                  currentVal
                    ? 'bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black hover:opacity-90'
                    : 'border border-white/15 text-white/50 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                {isLastStep
                  ? (currentVal ? 'Speichern' : 'Ohne Kennzahl speichern')
                  : (currentVal
                    ? <><span>Weiter</span><ChevronRight size={15} /></>
                    : 'Überspringen'
                  )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
