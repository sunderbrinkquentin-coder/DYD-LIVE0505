import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { WizardStepLayout } from '../WizardStepLayout';
import { VolunteerWork } from '../../../types/cvBuilder';

interface VolunteerStepProps {
  data?: VolunteerWork[];
  onChange: (items: VolunteerWork[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const MONTHS = [
  { value: '01', label: 'Jan' }, { value: '02', label: 'Feb' },
  { value: '03', label: 'Mär' }, { value: '04', label: 'Apr' },
  { value: '05', label: 'Mai' }, { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' }, { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' }, { value: '10', label: 'Okt' },
  { value: '11', label: 'Nov' }, { value: '12', label: 'Dez' },
];
const YEAR_OPTIONS = Array.from({ length: 20 }, (_, i) => String(new Date().getFullYear() - i));

const VOLUNTEER_SUGGESTIONS = [
  { role: 'Trainer / Übungsleiter', org: 'Sportverein' },
  { role: 'Teamleiter', org: 'DLRG / Rettungsdienst' },
  { role: 'Mentor', org: 'Nachhilfeprogramm' },
  { role: 'Projektkoordinator', org: 'NGO / Hilfsorganisation' },
  { role: 'Schülermentor', org: 'Schule / Bildungseinrichtung' },
  { role: 'Feuerwehrmann/-frau', org: 'Freiwillige Feuerwehr' },
];

const BULLET_SUGGESTIONS = [
  'Verantwortlich für die Organisation und Durchführung von Veranstaltungen',
  'Koordination eines Teams von Freiwilligen',
  'Betreuung und Förderung von Teilnehmenden',
  'Öffentlichkeitsarbeit und Social-Media-Betreuung',
  'Mittelakquise und Projektverwaltung',
  'Aufbau und Pflege von Partnerschaften',
];

function emptyEntry(): VolunteerWork {
  return { role: '', organization: '', startDate: '', endDate: '', current: false, description: '', bulletPoints: [] };
}

function toDate(month: string, year: string) {
  return month && year ? `${year}-${month}` : '';
}

function fromDate(date: string): { month: string; year: string } {
  if (!date) return { month: '', year: '' };
  const [y, m] = date.split('-');
  return { month: m || '', year: y || '' };
}

export function VolunteerStep({ data, onChange, onNext, onBack }: VolunteerStepProps) {
  const [entries, setEntries] = useState<VolunteerWork[]>(
    data && data.length > 0 ? data : [emptyEntry()]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const update = (index: number, field: keyof VolunteerWork, value: any) => {
    const updated = entries.map((e, i) => (i === index ? { ...e, [field]: value } : e));
    setEntries(updated);
    onChange(updated.filter(e => e.role.trim() || e.organization.trim()));
  };

  const updateDate = (index: number, which: 'start' | 'end', part: 'month' | 'year', value: string) => {
    const entry = entries[index];
    const current = which === 'start' ? fromDate(entry.startDate || '') : fromDate(entry.endDate || '');
    const next = { ...current, [part]: value };
    const field = which === 'start' ? 'startDate' : 'endDate';
    update(index, field, toDate(next.month, next.year));
  };

  const toggleBullet = (index: number, bullet: string) => {
    const current = entries[index].bulletPoints || [];
    const next = current.includes(bullet)
      ? current.filter(b => b !== bullet)
      : [...current, bullet];
    update(index, 'bulletPoints', next);
  };

  const addEntry = () => {
    setEntries(prev => [...prev, emptyEntry()]);
    setActiveIndex(entries.length);
  };

  const removeEntry = (index: number) => {
    if (entries.length === 1) {
      setEntries([emptyEntry()]);
      onChange([]);
      setActiveIndex(0);
      return;
    }
    const updated = entries.filter((_, i) => i !== index);
    setEntries(updated);
    onChange(updated.filter(e => e.role.trim() || e.organization.trim()));
    setActiveIndex(Math.min(activeIndex, updated.length - 1));
  };

  const active = entries[activeIndex] || emptyEntry();
  const startParts = fromDate(active.startDate || '');
  const endParts = fromDate(active.endDate || '');

  return (
    <WizardStepLayout
      title="Ehrenamtliche Arbeit"
      subtitle="Freiwilliges Engagement zeigt soziale Kompetenz, Verantwortungsbewusstsein und Teamfähigkeit."
      avatarMessage="Ehrenamt ist im CV oft unterschätzt – dabei beeindruckt es viele Arbeitgeber sehr!"
      avatarStepInfo="Trage dein Engagement ein oder überspringe diesen Schritt."
      currentStepId="volunteerWork"
      onPrev={onBack}
      onNext={onNext}
      hideProgress
    >
      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-sm text-white/70">
            Ehrenamtliche Tätigkeiten zeigen wichtige Soft Skills wie Empathie, Teamfähigkeit und Eigeninitiative.
            Du kannst diesen Schritt überspringen, falls du kein Ehrenamt ausübst.
          </p>
        </div>

        {/* Tab-Navigation */}
        {entries.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {entries.map((e, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeIndex === i
                    ? 'bg-[#66c0b6]/20 border border-[#66c0b6] text-white'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:border-white/30'
                }`}
              >
                {e.role || `Tätigkeit ${i + 1}`}
              </button>
            ))}
          </div>
        )}

        <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">
              {entries.length > 1 ? `Tätigkeit ${activeIndex + 1}` : 'Deine ehrenamtliche Tätigkeit'}
            </h3>
            {entries.length > 1 && (
              <button
                onClick={() => removeEntry(activeIndex)}
                className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {/* Schnellauswahl */}
          <div>
            <p className="text-xs text-white/50 mb-2">Schnellauswahl</p>
            <div className="flex flex-wrap gap-2">
              {VOLUNTEER_SUGGESTIONS.map(s => (
                <button
                  key={s.role}
                  onClick={() => {
                    update(activeIndex, 'role', s.role);
                    if (!active.organization) update(activeIndex, 'organization', s.org);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                    active.role === s.role
                      ? 'border-[#66c0b6] bg-[#66c0b6]/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'
                  }`}
                >
                  {s.role}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Rolle / Tätigkeit <span className="text-[#66c0b6]">*</span>
              </label>
              <input
                type="text"
                value={active.role}
                onChange={e => update(activeIndex, 'role', e.target.value)}
                placeholder="z.B. Trainer, Helfer"
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#66c0b6] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Organisation <span className="text-[#66c0b6]">*</span>
              </label>
              <input
                type="text"
                value={active.organization}
                onChange={e => update(activeIndex, 'organization', e.target.value)}
                placeholder="z.B. Rotes Kreuz"
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#66c0b6] transition-all"
              />
            </div>
          </div>

          {/* Zeitraum */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Zeitraum</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/40 mb-1.5">Von</p>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={startParts.month}
                    onChange={e => updateDate(activeIndex, 'start', 'month', e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-white/10 bg-[#1a1a2e] text-white text-sm focus:outline-none focus:border-[#66c0b6] transition-all"
                  >
                    <option value="">Mon.</option>
                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <select
                    value={startParts.year}
                    onChange={e => updateDate(activeIndex, 'start', 'year', e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-white/10 bg-[#1a1a2e] text-white text-sm focus:outline-none focus:border-[#66c0b6] transition-all"
                  >
                    <option value="">Jahr</option>
                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1.5">Bis</p>
                {active.current ? (
                  <div className="px-4 py-2.5 rounded-xl border border-[#66c0b6]/30 bg-[#66c0b6]/10 text-[#66c0b6] text-sm">
                    Aktuell
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={endParts.month}
                      onChange={e => updateDate(activeIndex, 'end', 'month', e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-white/10 bg-[#1a1a2e] text-white text-sm focus:outline-none focus:border-[#66c0b6] transition-all"
                    >
                      <option value="">Mon.</option>
                      {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <select
                      value={endParts.year}
                      onChange={e => updateDate(activeIndex, 'end', 'year', e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-white/10 bg-[#1a1a2e] text-white text-sm focus:outline-none focus:border-[#66c0b6] transition-all"
                    >
                      <option value="">Jahr</option>
                      {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                )}
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active.current || false}
                    onChange={e => update(activeIndex, 'current', e.target.checked)}
                    className="w-4 h-4 accent-[#66c0b6]"
                  />
                  <span className="text-sm text-white/60">Aktuell noch aktiv</span>
                </label>
              </div>
            </div>
          </div>

          {/* Aufgaben */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Was hast du gemacht? <span className="text-white/40">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {BULLET_SUGGESTIONS.map(b => (
                <button
                  key={b}
                  onClick={() => toggleBullet(activeIndex, b)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all text-left ${
                    (active.bulletPoints || []).includes(b)
                      ? 'border-[#66c0b6] bg-[#66c0b6]/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={addEntry}
          className="w-full py-3 rounded-xl border border-dashed border-white/20 text-white/50 hover:border-[#66c0b6]/50 hover:text-[#66c0b6] transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Weiteres Engagement hinzufügen
        </button>

        {entries.some(e => e.role.trim()) && (
          <div className="p-4 rounded-xl bg-[#66c0b6]/10 border border-[#66c0b6]/30">
            <p className="text-sm text-[#66c0b6] font-medium">
              Ehrenamt erfasst – das stärkt dein Profil enorm!
            </p>
          </div>
        )}
      </div>
    </WizardStepLayout>
  );
}
