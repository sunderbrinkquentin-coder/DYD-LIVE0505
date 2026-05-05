import { useState } from 'react';
import { Plus, X, Check, ChevronDown, ChevronRight, CreditCard as Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExperienceLevel } from '../../types/cvBuilder';

export interface TaskWithMetrics {
  task: string;
  category: string;
  metrics: {
    number?: string;
    percentage?: string;
    money?: string;
    timeframe?: string;
    description: string;
  };
}

// ── Task categories with pre-defined tasks ────────────────────────────────────
const TASK_CATEGORIES: {
  id: string;
  label: string;
  icon: string;
  color: string;
  tasks: { task: string; coachQuestion: string; coachHint: string; options: string[]; metricKey: 'number' | 'percentage' | 'money' | 'timeframe' }[];
}[] = [
  {
    id: 'management',
    label: 'Führung & Organisation',
    icon: '👥',
    color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    tasks: [
      { task: 'Team geführt und koordiniert', coachQuestion: 'Wie viele Personen hast du geführt?', coachHint: 'Direkte Berichte oder fachliche Verantwortung', options: ['2–3', '4–5', '6–10', '10–20', '20+'], metricKey: 'number' },
      { task: 'Projekte eigenverantwortlich geleitet', coachQuestion: 'Wie viele Projekte gleichzeitig?', coachHint: 'Oder Projektvolumen in €', options: ['1', '2–3', '3–5', '5–10'], metricKey: 'number' },
      { task: 'Stakeholder-Management betrieben', coachQuestion: 'Auf welcher Ebene?', coachHint: 'z.B. C-Level, Abteilungsleiter, Kunden', options: ['Team-Ebene', 'Abteilungs-Ebene', 'Geschäftsführung', 'Externe Kunden'], metricKey: 'timeframe' },
      { task: 'Onboarding neuer Mitarbeitender begleitet', coachQuestion: 'Wie viele Personen eingearbeitet?', coachHint: 'Pro Jahr oder insgesamt', options: ['1–2', '3–5', '5–10', '10+'], metricKey: 'number' },
      { task: 'Meetings moderiert und koordiniert', coachQuestion: 'Wie viele Teilnehmer im Schnitt?', coachHint: 'Oder Häufigkeit der Meetings', options: ['5–10', '10–20', '20–50', '50+'], metricKey: 'number' },
    ],
  },
  {
    id: 'analysis',
    label: 'Analyse & Strategie',
    icon: '📊',
    color: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
    tasks: [
      { task: 'Datenanalysen durchgeführt und Berichte erstellt', coachQuestion: 'Wie viele Datensätze oder wie oft?', coachHint: 'z.B. wöchentlicher Report für 5 Abteilungen', options: ['täglich', 'wöchentlich', 'monatlich', 'pro Quartal'], metricKey: 'timeframe' },
      { task: 'KPIs definiert und getrackt', coachQuestion: 'Wie viele KPIs verantwortet?', coachHint: 'Oder welche Verbesserung erzielt', options: ['2–5', '5–10', '10–20', '20+'], metricKey: 'number' },
      { task: 'Markt- und Wettbewerbsanalysen erstellt', coachQuestion: 'Für wie viele Märkte oder Zeitraum?', coachHint: 'z.B. DACH-Markt, Monatlich', options: ['1 Markt', '2–3 Märkte', 'DACH', 'Europa', 'Global'], metricKey: 'timeframe' },
      { task: 'Strategische Initiativen entwickelt', coachQuestion: 'Welchen Effekt hatte die Initiative?', coachHint: 'Einsparung, Wachstum oder Prozessverbesserung', options: ['Kostensenkung', 'Umsatzwachstum', 'Effizienzgewinn', 'Neue Märkte'], metricKey: 'timeframe' },
      { task: 'Business Cases erstellt und präsentiert', coachQuestion: 'Volumen oder Anzahl der Cases?', coachHint: 'Entscheidungsvolumen in €', options: ['< €50k', '€50k–200k', '€200k–1Mio.', '> €1 Mio.'], metricKey: 'money' },
    ],
  },
  {
    id: 'operations',
    label: 'Prozesse & Operations',
    icon: '⚙️',
    color: 'from-orange-500/20 to-amber-500/20 border-orange-500/30',
    tasks: [
      { task: 'Prozesse optimiert und effizienter gestaltet', coachQuestion: 'Um wie viel Prozent effizienter?', coachHint: 'Zeit- oder Kostenersparnis', options: ['5–10%', '10–20%', '20–30%', '30–50%', '> 50%'], metricKey: 'percentage' },
      { task: 'Qualitätssicherung und Testing verantwortet', coachQuestion: 'Fehlerquote reduziert um wie viel?', coachHint: 'Oder Anzahl getesteter Vorgänge', options: ['10%', '20%', '30%', '50%+', 'auf 0 Fehler'], metricKey: 'percentage' },
      { task: 'Tools und Systeme eingeführt oder administriert', coachQuestion: 'Wie viele Nutzer profitieren davon?', coachHint: 'Teamgröße oder Unternehmensweit', options: ['5–10', '10–50', '50–200', '200+'], metricKey: 'number' },
      { task: 'Budgets verwaltet und Forecasts erstellt', coachQuestion: 'Welches Budgetvolumen verantwortet?', coachHint: 'Jahresbudget oder Projektbudget', options: ['< €50k', '€50k–200k', '€200k–500k', '> €500k'], metricKey: 'money' },
      { task: 'Dokumentationen und Konzepte erstellt', coachQuestion: 'Für wie viele Nutzer oder Umfang?', coachHint: 'z.B. Handbuch für 30 MA erstellt', options: ['< 10 Seiten', '10–30 Seiten', '30–100 Seiten', 'Systemdoku'], metricKey: 'timeframe' },
    ],
  },
  {
    id: 'customer',
    label: 'Kunden & Kommunikation',
    icon: '🎯',
    color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30',
    tasks: [
      { task: 'Kundenanfragen bearbeitet und gelöst', coachQuestion: 'Wie viele Anfragen pro Zeitraum?', coachHint: 'Täglich, wöchentlich oder monatlich', options: ['5–10/Tag', '10–30/Tag', '30–100/Tag', '100+/Tag'], metricKey: 'number' },
      { task: 'Kundenpräsentationen und Pitches gehalten', coachQuestion: 'Vor wie vielen Personen / Kunden?', coachHint: 'Oder Abschlussrate der Pitches', options: ['< 5', '5–20', '20–50', '50–200'], metricKey: 'number' },
      { task: 'Kundenzufriedenheit gesteigert (NPS/CSAT)', coachQuestion: 'Um wie viel Punkte/Prozent verbessert?', coachHint: 'NPS-Score oder CSAT-Rate', options: ['+ 5 Punkte', '+10 Punkte', '+15 Punkte', '+20 Punkte'], metricKey: 'percentage' },
      { task: 'Key Accounts betreut und ausgebaut', coachQuestion: 'Umsatzvolumen der Accounts?', coachHint: 'Oder Anzahl Key Accounts', options: ['< €100k', '€100k–500k', '€500k–2Mio.', '> €2 Mio.'], metricKey: 'money' },
      { task: 'Verhandlungen geführt und Verträge abgeschlossen', coachQuestion: 'Vertragsvolumen oder Anzahl?', coachHint: 'Gesamtvolumen der abgeschlossenen Verträge', options: ['< €50k', '€50k–200k', '€200k–1Mio.', '> €1 Mio.'], metricKey: 'money' },
    ],
  },
  {
    id: 'growth',
    label: 'Wachstum & Vertrieb',
    icon: '📈',
    color: 'from-teal-500/20 to-cyan-500/20 border-teal-500/30',
    tasks: [
      { task: 'Umsatz gesteigert oder Neukunden gewonnen', coachQuestion: 'Umsatzwachstum in % oder €?', coachHint: 'Prozentualer Zuwachs oder absoluter Betrag', options: ['5–10%', '10–25%', '25–50%', '> 50%'], metricKey: 'percentage' },
      { task: 'Marketingkampagnen geplant und umgesetzt', coachQuestion: 'Reichweite oder ROI der Kampagne?', coachHint: 'Personen erreicht oder ROAS', options: ['< 1.000', '1k–10k', '10k–100k', '> 100k'], metricKey: 'number' },
      { task: 'Lead-Generierung und Akquise durchgeführt', coachQuestion: 'Wie viele Leads oder Conversion-Rate?', coachHint: 'Monatliche Leads oder Abschlussrate', options: ['10–50/Mo.', '50–200/Mo.', '200–500/Mo.', '500+/Mo.'], metricKey: 'number' },
      { task: 'Partnerschaften aufgebaut und gepflegt', coachQuestion: 'Anzahl oder Umsatzpotenzial der Partner?', coachHint: 'Strategische Partner oder Distributoren', options: ['1–3', '3–10', '10–30', '30+'], metricKey: 'number' },
    ],
  },
  {
    id: 'hr_people',
    label: 'HR & Personal',
    icon: '🤝',
    color: 'from-violet-500/20 to-purple-500/20 border-violet-500/30',
    tasks: [
      { task: 'Recruiting und Personalauswahl durchgeführt', coachQuestion: 'Wie viele Stellen besetzt?', coachHint: 'Pro Jahr oder im gesamten Zeitraum', options: ['1–5', '5–15', '15–30', '30+'], metricKey: 'number' },
      { task: 'Mitarbeiterentwicklung und Schulungen durchgeführt', coachQuestion: 'Wie viele Mitarbeitende entwickelt?', coachHint: 'Oder Stunden Trainingsinhalt erstellt', options: ['2–5', '5–15', '15–50', '50+'], metricKey: 'number' },
      { task: 'Mitarbeiterzufriedenheit verbessert', coachQuestion: 'Verbesserung in Punkten oder %?', coachHint: 'eNPS-Verbesserung oder Fluktuation gesenkt', options: ['+ 5 Pkt.', '+10 Pkt.', '+15 Pkt.', 'Fluktuation halbiert'], metricKey: 'percentage' },
      { task: 'Gehaltsverhandlungen und Personalmaßnahmen begleitet', coachQuestion: 'Für wie viele Mitarbeitende?', coachHint: 'Jahresgespräche oder Anpassungen', options: ['< 5', '5–15', '15–50', '50+'], metricKey: 'number' },
    ],
  },
];

// ── Individual coaching question per selected task ─────────────────────────────
interface CoachingPopoverProps {
  task: string;
  question: string;
  hint: string;
  options: string[];
  metricKey: TaskWithMetrics['metrics'] extends infer M ? keyof Omit<M & object, 'description'> : never;
  existingMetrics?: Partial<TaskWithMetrics['metrics']>;
  onSave: (metrics: TaskWithMetrics['metrics']) => void;
  onCancel: () => void;
}

function CoachingPopover({ task, question, hint, options, metricKey, existingMetrics, onSave, onCancel }: CoachingPopoverProps) {
  const [selected, setSelected] = useState(existingMetrics?.[metricKey] ?? '');
  const [custom, setCustom] = useState('');

  const value = custom || selected;

  const handleSave = () => {
    const metrics: TaskWithMetrics['metrics'] = {
      description: value ? `${task} – ${value}` : task,
    };
    if (metricKey === 'number') metrics.number = value || undefined;
    if (metricKey === 'percentage') metrics.percentage = value || undefined;
    if (metricKey === 'money') metrics.money = value || undefined;
    if (metricKey === 'timeframe') metrics.timeframe = value || undefined;
    onSave(metrics);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="bg-[#0d1117] border border-white/15 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6"
      >
        <p className="text-[#66c0b6] text-xs font-semibold uppercase tracking-wider mb-1">{task}</p>
        <h3 className="text-white text-lg font-bold mb-1">{question}</h3>
        {hint && <p className="text-white/40 text-xs mb-4">{hint}</p>}

        <div className="grid grid-cols-3 gap-2 mb-3">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { setSelected(opt); setCustom(''); }}
              className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                selected === opt && !custom
                  ? 'border-[#66c0b6] bg-[#66c0b6]/20 text-white'
                  : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={custom}
          onChange={e => { setCustom(e.target.value); setSelected(''); }}
          placeholder="Eigene Angabe eingeben..."
          className="w-full px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white placeholder-white/35 focus:outline-none focus:border-[#66c0b6] text-sm mb-4"
        />

        {value && (
          <div className="bg-[#66c0b6]/8 border border-[#66c0b6]/20 rounded-xl px-4 py-2.5 mb-4">
            <p className="text-white/40 text-xs mb-0.5">Vorschau:</p>
            <p className="text-[#66c0b6] text-sm font-medium">{task} – {value}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/15 text-white/55 hover:bg-white/5 text-sm transition-all"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              value
                ? 'bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black hover:opacity-90'
                : 'border border-white/15 text-white/50 hover:bg-white/5'
            }`}
          >
            {value ? 'Speichern' : 'Ohne Zahl speichern'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface CategorizedTasksInputProps {
  experienceLevel: ExperienceLevel;
  industry?: string;
  value: TaskWithMetrics[];
  onChange: (tasks: TaskWithMetrics[]) => void;
}

export function CategorizedTasksInput({ value = [], onChange }: CategorizedTasksInputProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['management', 'operations']);
  const [coaching, setCoaching] = useState<{ task: string; category: string; taskDef: typeof TASK_CATEGORIES[0]['tasks'][0] } | null>(null);
  const [customTask, setCustomTask] = useState('');
  const [addingCustom, setAddingCustom] = useState(false);

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const isSelected = (task: string) => value.some(t => t.task === task);

  const handleTaskClick = (task: string, category: string, taskDef: typeof TASK_CATEGORIES[0]['tasks'][0]) => {
    if (isSelected(task)) {
      onChange(value.filter(t => t.task !== task));
    } else {
      setCoaching({ task, category, taskDef });
    }
  };

  const handleEdit = (task: string, category: string, taskDef: typeof TASK_CATEGORIES[0]['tasks'][0]) => {
    setCoaching({ task, category, taskDef });
  };

  const saveCoaching = (metrics: TaskWithMetrics['metrics']) => {
    if (!coaching) return;
    const updated = value.filter(t => t.task !== coaching.task);
    onChange([...updated, { task: coaching.task, category: coaching.category, metrics }]);
    setCoaching(null);
  };

  const addCustom = () => {
    const trimmed = customTask.trim();
    if (!trimmed || isSelected(trimmed)) return;
    onChange([...value, {
      task: trimmed,
      category: 'custom',
      metrics: { description: trimmed },
    }]);
    setCustomTask('');
    setAddingCustom(false);
  };

  const taskCountByCategory = (catId: string) =>
    value.filter(t => t.category === catId).length;

  return (
    <div className="space-y-3">
      {/* Selected summary */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pb-1">
          {value.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#66c0b6]/12 border border-[#66c0b6]/30 text-xs">
              <Check size={11} className="text-[#66c0b6] shrink-0" />
              <span className="text-white/85 max-w-[180px] truncate">{item.metrics.description || item.task}</span>
              <button
                onClick={() => {
                  const cat = TASK_CATEGORIES.find(c => c.id === item.category);
                  const taskDef = cat?.tasks.find(t => t.task === item.task);
                  if (taskDef) handleEdit(item.task, item.category, taskDef);
                }}
                className="text-white/30 hover:text-[#66c0b6] transition-colors"
              >
                <Edit2 size={10} />
              </button>
              <button
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="text-white/30 hover:text-red-400 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Category accordion */}
      {TASK_CATEGORIES.map(cat => {
        const isOpen = expandedCategories.includes(cat.id);
        const count = taskCountByCategory(cat.id);

        return (
          <div key={cat.id} className={`rounded-2xl border overflow-hidden bg-gradient-to-r ${cat.color}`}>
            <button
              onClick={() => toggleCategory(cat.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
            >
              <span className="text-lg leading-none">{cat.icon}</span>
              <span className="flex-1 font-semibold text-sm text-white">{cat.label}</span>
              {count > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#66c0b6]/25 text-[#66c0b6] text-xs font-bold">
                  {count}
                </span>
              )}
              {isOpen
                ? <ChevronDown size={15} className="text-white/50" />
                : <ChevronRight size={15} className="text-white/50" />
              }
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3 pt-1 border-t border-white/8 flex flex-wrap gap-2">
                    {cat.tasks.map(taskDef => {
                      const sel = isSelected(taskDef.task);
                      const item = value.find(t => t.task === taskDef.task);
                      return (
                        <motion.button
                          key={taskDef.task}
                          onClick={() => handleTaskClick(taskDef.task, cat.id, taskDef)}
                          whileTap={{ scale: 0.97 }}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-all ${
                            sel
                              ? 'border-[#66c0b6] bg-[#66c0b6]/20 text-white shadow-[0_0_10px_rgba(102,192,182,0.15)]'
                              : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:border-white/20'
                          }`}
                        >
                          {sel && <Check size={12} className="text-[#66c0b6] shrink-0" />}
                          <span>{taskDef.task}</span>
                          {sel && item?.metrics.number || item?.metrics.percentage || item?.metrics.money || item?.metrics.timeframe ? (
                            <span className="text-[10px] text-[#66c0b6]/70 ml-0.5">
                              · {item.metrics.number || item.metrics.percentage || item.metrics.money || item.metrics.timeframe}
                            </span>
                          ) : null}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Custom task */}
      {addingCustom ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={customTask}
            onChange={e => setCustomTask(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addCustom(); if (e.key === 'Escape') setAddingCustom(false); }}
            placeholder="Eigene Aufgabe beschreiben..."
            autoFocus
            className="flex-1 px-3 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white text-sm placeholder:text-white/35 focus:outline-none focus:border-[#66c0b6]"
          />
          <button onClick={addCustom} className="px-3 py-2 rounded-xl bg-[#66c0b6] text-black text-sm font-medium hover:opacity-90"><Check size={15} /></button>
          <button onClick={() => setAddingCustom(false)} className="px-3 py-2 rounded-xl border border-white/20 text-white/50 hover:bg-white/5"><X size={15} /></button>
        </div>
      ) : (
        <button
          onClick={() => setAddingCustom(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/20 text-white/55 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all text-sm w-full justify-center"
        >
          <Plus size={15} /> Eigene Aufgabe hinzufügen
        </button>
      )}

      {/* Coaching popover */}
      <AnimatePresence>
        {coaching && (
          <CoachingPopover
            task={coaching.task}
            question={coaching.taskDef.coachQuestion}
            hint={coaching.taskDef.coachHint}
            options={coaching.taskDef.options}
            metricKey={coaching.taskDef.metricKey as any}
            existingMetrics={value.find(t => t.task === coaching.task)?.metrics}
            onSave={saveCoaching}
            onCancel={() => setCoaching(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
