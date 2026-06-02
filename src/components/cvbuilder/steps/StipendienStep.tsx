import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { WizardStepLayout } from '../WizardStepLayout';
import { Stipendium } from '../../../types/cvBuilder';

interface StipendienStepProps {
  data?: Stipendium[];
  onChange: (items: Stipendium[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i));

const KNOWN_STIPENDIEN = [
  'Deutschlandstipendium',
  'DAAD-Stipendium',
  'Studienstiftung des deutschen Volkes',
  'Friedrich-Ebert-Stiftung',
  'Konrad-Adenauer-Stiftung',
  'Heinrich-Böll-Stiftung',
  'Avicenna-Studienwerk',
  'Cusanuswerk',
  'Evangelisches Studienwerk Villigst',
  'Hans-Böckler-Stiftung',
];

function emptyEntry(): Stipendium {
  return { name: '', organization: '', year: '', description: '' };
}

export function StipendienStep({ data, onChange, onNext, onBack }: StipendienStepProps) {
  const [entries, setEntries] = useState<Stipendium[]>(
    data && data.length > 0 ? data : [emptyEntry()]
  );

  const update = (index: number, field: keyof Stipendium, value: string) => {
    const updated = entries.map((e, i) => (i === index ? { ...e, [field]: value } : e));
    setEntries(updated);
    onChange(updated.filter(e => e.name.trim() || e.organization.trim()));
  };

  const addEntry = () => {
    setEntries(prev => [...prev, emptyEntry()]);
  };

  const removeEntry = (index: number) => {
    if (entries.length === 1) {
      setEntries([emptyEntry()]);
      onChange([]);
      return;
    }
    const updated = entries.filter((_, i) => i !== index);
    setEntries(updated);
    onChange(updated.filter(e => e.name.trim() || e.organization.trim()));
  };

  const applyPreset = (index: number, name: string) => {
    update(index, 'name', name);
  };

  const hasAnyData = entries.some(e => e.name.trim() || e.organization.trim());

  return (
    <WizardStepLayout
      title="Stipendien"
      subtitle="Stipendien zeigen Leistung und Engagement – ein starkes Signal für Arbeitgeber."
      avatarMessage="Wenn du ein Stipendium erhalten hast, solltest du es unbedingt im CV erwähnen!"
      avatarStepInfo="Trag deine Stipendien ein oder überspringe diesen Schritt."
      currentStepId="stipendien"
      onPrev={onBack}
      onNext={onNext}
      hideProgress
    >
      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-sm text-white/70">
            Stipendien sind ein starkes Qualitätsmerkmal. Sie zeigen, dass du ausgewählt und anerkannt wurdest.
            Du kannst diesen Schritt auch überspringen, falls du kein Stipendium hast.
          </p>
        </div>

        {entries.map((entry, index) => (
          <div key={index} className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">
                Stipendium {entries.length > 1 ? index + 1 : ''}
              </h3>
              {entries.length > 1 && (
                <button
                  onClick={() => removeEntry(index)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                  title="Entfernen"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div>
              <p className="text-xs text-white/50 mb-2">Bekannte Stipendien (Schnellauswahl)</p>
              <div className="flex flex-wrap gap-2">
                {KNOWN_STIPENDIEN.slice(0, 5).map(s => (
                  <button
                    key={s}
                    onClick={() => applyPreset(index, s)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                      entry.name === s
                        ? 'border-[#66c0b6] bg-[#66c0b6]/20 text-white'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Name des Stipendiums <span className="text-[#66c0b6]">*</span>
              </label>
              <input
                type="text"
                value={entry.name}
                onChange={e => update(index, 'name', e.target.value)}
                placeholder="z.B. Deutschlandstipendium"
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#66c0b6] transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">
                  Vergeben von
                </label>
                <input
                  type="text"
                  value={entry.organization}
                  onChange={e => update(index, 'organization', e.target.value)}
                  placeholder="z.B. Bundesministerium"
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#66c0b6] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Jahr</label>
                <select
                  value={entry.year || ''}
                  onChange={e => update(index, 'year', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#1a1a2e] text-white focus:outline-none focus:border-[#66c0b6] transition-all"
                >
                  <option value="">Jahr wählen</option>
                  {YEAR_OPTIONS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Kurze Beschreibung <span className="text-white/40">(optional)</span>
              </label>
              <textarea
                value={entry.description || ''}
                onChange={e => update(index, 'description', e.target.value)}
                placeholder="z.B. Förderstipendium für überdurchschnittliche Leistungen und soziales Engagement"
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#66c0b6] transition-all resize-none"
              />
            </div>
          </div>
        ))}

        <button
          onClick={addEntry}
          className="w-full py-3 rounded-xl border border-dashed border-white/20 text-white/50 hover:border-[#66c0b6]/50 hover:text-[#66c0b6] transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Weiteres Stipendium hinzufügen
        </button>

        {hasAnyData && (
          <div className="p-4 rounded-xl bg-[#66c0b6]/10 border border-[#66c0b6]/30">
            <p className="text-sm text-[#66c0b6] font-medium">
              Sehr gut! Stipendien heben deinen CV deutlich hervor.
            </p>
          </div>
        )}
      </div>
    </WizardStepLayout>
  );
}
