import { useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, Trash2, Sparkles } from 'lucide-react';
import { AvatarSidebar } from '../AvatarSidebar';
import { WorkExperience } from '../../../types/cvBuilder';

interface InternshipsStepProps {
  data?: WorkExperience[];
  onChange: (experiences: WorkExperience[]) => void;
  onNext: () => void;
  onBack: () => void;
}

type LocalEntry = WorkExperience & {
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  current: boolean;
};

const ENTRY_TYPES = [
  { value: 'Praktikum', label: 'Praktikum' },
  { value: 'Werkstudent', label: 'Werkstudentenstelle' },
  { value: 'Nebenjob', label: 'Nebenjob / Aushilfe' },
  { value: 'Ferienjob', label: 'Ferienjob' },
  { value: 'Freiwilliges Engagement', label: 'Freiwilliges Engagement / Ehrenamt' },
  { value: 'Au-pair', label: 'Au-pair / Work & Travel' },
  { value: 'Sonstiges', label: 'Sonstiges' },
];

const TASK_PRESETS: Record<string, string[]> = {
  Praktikum: [
    'Unterstützung des Teams bei täglichen Aufgaben',
    'Erstellung von Präsentationen und Berichten',
    'Mitarbeit bei einem konkreten Projektauftrag',
    'Kommunikation mit Kunden / Ansprechpartnern',
    'Eigenständige Recherche und Datenauswertung',
    'Teilnahme an Team-Meetings und Besprechungen',
  ],
  Werkstudent: [
    'Unterstützung des Fachbereichs XX Stunden/Woche',
    'Eigenständige Bearbeitung von Aufgabenpaketen',
    'Mitarbeit in agilen Prozessen (Scrum, Kanban)',
    'Erstellung und Pflege von Dokumentationen',
    'Analyse und Aufbereitung von Daten',
    'Abstimmung mit internen Schnittstellen',
  ],
  Nebenjob: [
    'Kundenbetreuung und Serviceorientierung',
    'Kassiertätigkeit und Abrechnung',
    'Wareneingang, -pflege und Lagerhaltung',
    'Einarbeitung neuer Kolleg:innen',
    'Öffnungs- und Kassenabschluss',
  ],
  Ferienjob: [
    'Unterstützung in der Produktion / Kommissionierung',
    'Allgemeine Büro- und Verwaltungstätigkeiten',
    'Kundenkontakt und Serviceaufgaben',
    'Materialtransport und Lagerhaltung',
  ],
  'Freiwilliges Engagement': [
    'Organisation und Durchführung von Veranstaltungen',
    'Betreuung von Teilnehmer:innen / Zielgruppen',
    'Koordination im Team und mit externen Partnern',
    'Öffentlichkeitsarbeit und Social Media',
    'Fundraising und Spendenaquise',
  ],
};

const DEFAULT_TASKS = [
  'Unterstützung des Teams bei täglichen Aufgaben',
  'Eigenständige Bearbeitung kleinerer Projekte',
  'Kommunikation mit internen Ansprechpartnern',
  'Erstellung von Präsentationen und Dokumenten',
];

const MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 15 }, (_, i) => String(currentYear - i));

const selectBase =
  'w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/40 text-white text-sm focus:outline-none focus:border-[#66c0b6]';

function createEmpty(): LocalEntry {
  return {
    jobTitle: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    startMonth: '',
    startYear: '',
    endMonth: '',
    endYear: '',
    tasks: [],
    responsibilities: [],
    tools: [],
    kpis: [],
    achievements: [],
    bullets: [],
    tasksWithMetrics: [],
    achievementsWithMetrics: [],
    industry: '',
    roleLevel: '',
    revenue: '',
    budget: '',
    teamSize: '',
    customersMarket: '',
    achievementsRaw: '',
  };
}

function syncDates(e: LocalEntry): LocalEntry {
  const startDate = e.startMonth && e.startYear ? `${e.startMonth}.${e.startYear}` : '';
  const endDate = e.current ? 'Heute' : (e.endMonth && e.endYear ? `${e.endMonth}.${e.endYear}` : '');
  return { ...e, startDate, endDate };
}

export function InternshipsStep({ data, onChange, onNext, onBack }: InternshipsStepProps) {
  const [entries, setEntries] = useState<LocalEntry[]>(() => {
    if (data && data.length > 0) {
      return data.map((e) => ({
        ...e,
        startMonth: (e as any).startMonth ?? '',
        startYear: (e as any).startYear ?? '',
        endMonth: (e as any).endMonth ?? '',
        endYear: (e as any).endYear ?? '',
        current: (e as any).current ?? false,
      }));
    }
    return [createEmpty()];
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const [toggledTasks, setToggledTasks] = useState<Set<string>>(new Set());
  // Custom bullet inputs per entry index: index -> string[]
  const [customBullets, setCustomBullets] = useState<Record<number, string[]>>({});

  const active = entries[activeIndex];

  const update = (index: number, field: keyof LocalEntry, value: any) => {
    setEntries((prev) => {
      const updated = [...prev];
      let e = { ...updated[index], [field]: value };
      if (['startMonth','startYear','endMonth','endYear','current'].includes(field as string)) {
        e = syncDates(e);
      }
      updated[index] = e;
      onChange(updated as WorkExperience[]);
      return updated;
    });
  };

  const mergedBullets = (presetTasks: string[], idx: number) => [
    ...presetTasks,
    ...(customBullets[idx] || []).filter(Boolean),
  ];

  const toggleTask = (index: number, task: string) => {
    const key = `${index}:${task}`;
    setToggledTasks((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    setEntries((prev) => {
      const updated = [...prev];
      const e = { ...updated[index] };
      const tasks = [...(e.tasks || [])];
      const idx = tasks.indexOf(task);
      if (idx >= 0) tasks.splice(idx, 1);
      else tasks.push(task);
      e.tasks = tasks;
      e.bullets = mergedBullets(tasks, index);
      updated[index] = e;
      onChange(updated as WorkExperience[]);
      return updated;
    });
  };

  const updateCustomBullet = (entryIndex: number, bulletIndex: number, value: string) => {
    setCustomBullets((prev) => {
      const current = [...(prev[entryIndex] || [])];
      current[bulletIndex] = value;
      const next = { ...prev, [entryIndex]: current };
      setEntries((prevEntries) => {
        const updated = [...prevEntries];
        const e = { ...updated[entryIndex] };
        e.bullets = mergedBullets(e.tasks || [], entryIndex);
        // use updated custom list directly
        e.bullets = [...(e.tasks || []), ...current.filter(Boolean)];
        updated[entryIndex] = e;
        onChange(updated as WorkExperience[]);
        return updated;
      });
      return next;
    });
  };

  const addCustomBullet = (entryIndex: number) => {
    setCustomBullets((prev) => ({
      ...prev,
      [entryIndex]: [...(prev[entryIndex] || []), ''],
    }));
  };

  const removeCustomBullet = (entryIndex: number, bulletIndex: number) => {
    setCustomBullets((prev) => {
      const current = [...(prev[entryIndex] || [])];
      current.splice(bulletIndex, 1);
      const next = { ...prev, [entryIndex]: current };
      setEntries((prevEntries) => {
        const updated = [...prevEntries];
        const e = { ...updated[entryIndex] };
        e.bullets = [...(e.tasks || []), ...current.filter(Boolean)];
        updated[entryIndex] = e;
        onChange(updated as WorkExperience[]);
        return updated;
      });
      return next;
    });
  };

  const addEntry = () => {
    const next = [...entries, createEmpty()];
    setEntries(next);
    onChange(next as WorkExperience[]);
    setActiveIndex(next.length - 1);
  };

  const removeEntry = (index: number) => {
    if (entries.length === 1) return;
    const next = entries.filter((_, i) => i !== index);
    setEntries(next);
    onChange(next as WorkExperience[]);
    setActiveIndex(Math.max(0, index - 1));
  };

  const isValid =
    active.jobTitle?.trim() &&
    active.company?.trim() &&
    active.startMonth &&
    active.startYear &&
    (active.current || (active.endMonth && active.endYear));

  const presets = TASK_PRESETS[active.jobTitle] || DEFAULT_TASKS;

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:p-6 lg:max-w-7xl lg:mx-auto">
      <div className="flex-1 space-y-4 animate-fade-in max-w-3xl mx-auto w-full pb-28 lg:pb-0 px-4 lg:px-0">
        <div className="text-center space-y-1.5">
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold bg-gradient-to-r from-white via-[#66c0b6] to-white bg-clip-text text-transparent leading-tight">
            Praktika & Nebenjobs
          </h1>
          <p className="text-sm text-white/60 max-w-lg mx-auto">
            Hast du Praktika, Ferienjobs oder Nebenjobs gemacht? Auch kurze Erfahrungen zählen –
            sie zeigen Initiative und Praxisbezug.
          </p>
        </div>

        <div className="bg-[#66c0b6]/10 border border-[#66c0b6]/30 rounded-xl px-4 py-3 text-sm text-[#66c0b6]">
          Keine Erfahrung? Kein Problem – klicke einfach auf "Weiter" und wir überspringen diesen Schritt.
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {entries.map((e, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm ${
                i === activeIndex
                  ? 'bg-[#66c0b6] text-black font-semibold'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {e.company?.trim() || e.jobTitle?.trim() || `Eintrag ${i + 1}`}
            </button>
          ))}
          <button
            onClick={addEntry}
            className="px-3 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-all flex items-center gap-1.5 text-sm"
          >
            <Plus size={16} /> Hinzufügen
          </button>
        </div>

        <div className="bg-white/5 rounded-2xl p-4 space-y-4 border border-white/10">
          {/* Art der Tätigkeit */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Art der Tätigkeit *
            </label>
            <select
              value={active.jobTitle || ''}
              onChange={(e) => update(activeIndex, 'jobTitle', e.target.value)}
              className={selectBase}
            >
              <option value="">Bitte auswählen…</option>
              {ENTRY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Unternehmen & Ort */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Unternehmen / Organisation *
              </label>
              <input
                type="text"
                value={active.company || ''}
                onChange={(e) => update(activeIndex, 'company', e.target.value)}
                placeholder="z.B. Lidl GmbH, Stadtbibliothek München"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder-white/40 focus:outline-none focus:border-[#66c0b6]"
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Ort (optional)
              </label>
              <input
                type="text"
                value={active.location || ''}
                onChange={(e) => update(activeIndex, 'location', e.target.value)}
                placeholder="z.B. München"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder-white/40 focus:outline-none focus:border-[#66c0b6]"
              />
            </div>
          </div>

          {/* Zeitraum */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">Zeitraum *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/60 mb-1">Start</p>
                <div className="grid grid-cols-2 gap-2">
                  <select value={active.startMonth} onChange={(e) => update(activeIndex, 'startMonth', e.target.value)} className={selectBase}>
                    <option value="">Monat</option>
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={active.startYear} onChange={(e) => update(activeIndex, 'startYear', e.target.value)} className={selectBase}>
                    <option value="">Jahr</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-white/60">Ende</p>
                  <label className="flex items-center gap-1.5 text-xs text-white/70">
                    <input type="checkbox" checked={!!active.current} onChange={(e) => update(activeIndex, 'current', e.target.checked)} className="rounded" />
                    Aktuell
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select value={active.current ? '' : active.endMonth} onChange={(e) => update(activeIndex, 'endMonth', e.target.value)} disabled={!!active.current} className={`${selectBase} disabled:opacity-40`}>
                    <option value="">Monat</option>
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={active.current ? '' : active.endYear} onChange={(e) => update(activeIndex, 'endYear', e.target.value)} disabled={!!active.current} className={`${selectBase} disabled:opacity-40`}>
                    <option value="">Jahr</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Aufgaben – Klick-Auswahl */}
          {active.jobTitle && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-[#66c0b6]" size={16} />
                <label className="text-white/80 text-sm font-medium">
                  Was hast du dort gemacht? (wähle passende Punkte)
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {presets.map((task) => {
                  const key = `${activeIndex}:${task}`;
                  const selected = toggledTasks.has(key) || (active.tasks || []).includes(task);
                  return (
                    <button
                      key={task}
                      type="button"
                      onClick={() => toggleTask(activeIndex, task)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                        selected
                          ? 'bg-[#66c0b6] text-black border-[#66c0b6] font-semibold'
                          : 'bg-white/5 text-white/80 border-white/20 hover:bg-white/10'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '}{task}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-white/40 mt-2">
                Tipp: Wähle 2–4 Punkte, die am besten zu deiner Erfahrung passen.
              </p>

              {/* Eigene Bullet-Punkte */}
              <div className="mt-4 space-y-2">
                <p className="text-xs text-white/60 font-medium">
                  Eigene Punkte hinzufügen (optional):
                </p>
                {(customBullets[activeIndex] || []).map((bullet, bIdx) => (
                  <div key={bIdx} className="flex items-center gap-2">
                    <span className="text-[#66c0b6] text-sm shrink-0">–</span>
                    <input
                      type="text"
                      value={bullet}
                      onChange={(e) => updateCustomBullet(activeIndex, bIdx, e.target.value)}
                      placeholder="z. B. Eigenverantwortliche Bearbeitung von Bestellungen"
                      className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 focus:outline-none focus:border-[#66c0b6] text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomBullet(activeIndex, bIdx)}
                      className="text-white/30 hover:text-red-400 transition-colors shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addCustomBullet(activeIndex)}
                  className="flex items-center gap-1.5 text-xs text-[#66c0b6] hover:text-white transition-colors mt-1"
                >
                  <Plus size={14} /> Eigenen Punkt hinzufügen
                </button>
              </div>
            </div>
          )}

          {entries.length > 1 && (
            <button
              onClick={() => removeEntry(activeIndex)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all text-sm"
            >
              <Trash2 size={16} /> Diesen Eintrag entfernen
            </button>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex justify-between items-center pt-4">
          <button onClick={onBack} className="flex items-center gap-2 px-6 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all">
            <ArrowLeft size={20} /> Zurück
          </button>
          <button
            onClick={onNext}
            className="px-12 py-4 rounded-2xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold text-lg hover:opacity-90 transition-all flex items-center gap-3 shadow-2xl hover:scale-105"
          >
            Weiter <ArrowRight size={22} />
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#020617] via-[#020617]/95 to-transparent z-50 px-4 pb-4 pt-3">
          <div className="flex justify-between items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-white/70 hover:text-white transition-all min-w-[90px]">
              <ArrowLeft size={18} />
              <span className="font-medium text-sm">Zurück</span>
            </button>
            <button
              onClick={onNext}
              className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold text-base hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              Weiter <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="hidden lg:block">
        <AvatarSidebar
          message="Jede Erfahrung zählt!"
          stepInfo="Praktika, Ferienjobs oder Ehrenamt – zeige, dass du anpackst. Kein Eintrag? Kein Problem, einfach überspringen."
          currentStepId="workExperience"
        />
      </div>
    </div>
  );
}
