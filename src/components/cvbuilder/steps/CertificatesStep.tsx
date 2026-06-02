import { useState } from 'react';
import { Plus, Trash2, Award } from 'lucide-react';
import { WizardStepLayout } from '../WizardStepLayout';
import { Certificate } from '../../../types/cvBuilder';

interface CertificatesStepProps {
  data?: Certificate[];
  onChange: (items: Certificate[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const YEAR_OPTIONS = Array.from({ length: 20 }, (_, i) => String(new Date().getFullYear() - i));

const CERTIFICATE_SUGGESTIONS = [
  { name: 'Google Analytics Zertifikat', issuer: 'Google' },
  { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services' },
  { name: 'Microsoft Azure Fundamentals', issuer: 'Microsoft' },
  { name: 'Scrum Master Zertifizierung', issuer: 'Scrum Alliance / PSI' },
  { name: 'HubSpot Marketing Zertifikat', issuer: 'HubSpot Academy' },
  { name: 'ECDL / ICDL', issuer: 'ECDL Foundation' },
  { name: 'Erste-Hilfe-Schein', issuer: 'DRK / DLRG' },
  { name: 'Führerschein Klasse B', issuer: 'Fahrschule' },
  { name: 'Cisco CCNA', issuer: 'Cisco' },
  { name: 'Salesforce Administrator', issuer: 'Salesforce' },
];

const AWARD_SUGGESTIONS = [
  'Jahrgangsbester / Schulpreisträger',
  'IHK-Bestenehrung',
  'Unternehmenspreis für besondere Leistung',
  'Hackathon-Gewinner',
  'Bundeswettbewerb Informatik',
  'Jugend forscht',
];

function emptyEntry(): Certificate {
  return { name: '', issuer: '', year: '', description: '' };
}

export function CertificatesStep({ data, onChange, onNext, onBack }: CertificatesStepProps) {
  const [entries, setEntries] = useState<Certificate[]>(
    data && data.length > 0 ? data : [emptyEntry()]
  );

  const update = (index: number, field: keyof Certificate, value: string) => {
    const updated = entries.map((e, i) => (i === index ? { ...e, [field]: value } : e));
    setEntries(updated);
    onChange(updated.filter(e => e.name.trim()));
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
    onChange(updated.filter(e => e.name.trim()));
  };

  const applyPreset = (index: number, preset: { name: string; issuer: string }) => {
    const updated = entries.map((e, i) =>
      i === index ? { ...e, name: preset.name, issuer: preset.issuer } : e
    );
    setEntries(updated);
    onChange(updated.filter(e => e.name.trim()));
  };

  const applyAward = (index: number, award: string) => {
    update(index, 'name', award);
  };

  const hasAnyData = entries.some(e => e.name.trim());

  return (
    <WizardStepLayout
      title="Zertifikate & Auszeichnungen"
      subtitle="Zertifikate belegen deine Kompetenzen, Auszeichnungen deine besondere Leistung."
      avatarMessage="Zertifikate und Preise sind starke Belege für deine Fähigkeiten – trag sie unbedingt ein!"
      avatarStepInfo="Füge Zertifikate, Kurse oder Auszeichnungen hinzu. Dieser Schritt ist optional."
      currentStepId="certificates"
      onPrev={onBack}
      onNext={onNext}
      hideProgress
    >
      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-sm text-white/70">
            Hier kannst du sowohl offizielle Zertifikate (z.B. von Google, AWS, Cisco) als auch
            Auszeichnungen und Preise eintragen. Du kannst diesen Schritt auch überspringen.
          </p>
        </div>

        {entries.map((entry, index) => (
          <div key={index} className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-[#66c0b6]" />
                <h3 className="text-white font-semibold">
                  Eintrag {entries.length > 1 ? index + 1 : ''}
                </h3>
              </div>
              {entries.length > 1 && (
                <button
                  onClick={() => removeEntry(index)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Zertifikat-Schnellauswahl */}
            <div>
              <p className="text-xs text-white/50 mb-2">Bekannte Zertifikate</p>
              <div className="flex flex-wrap gap-2">
                {CERTIFICATE_SUGGESTIONS.slice(0, 6).map(s => (
                  <button
                    key={s.name}
                    onClick={() => applyPreset(index, s)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                      entry.name === s.name
                        ? 'border-[#66c0b6] bg-[#66c0b6]/20 text-white'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Auszeichnungen-Schnellauswahl */}
            <div>
              <p className="text-xs text-white/50 mb-2">Auszeichnungen & Preise</p>
              <div className="flex flex-wrap gap-2">
                {AWARD_SUGGESTIONS.map(a => (
                  <button
                    key={a}
                    onClick={() => applyAward(index, a)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                      entry.name === a
                        ? 'border-[#66c0b6] bg-[#66c0b6]/20 text-white'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Name des Zertifikats / der Auszeichnung <span className="text-[#66c0b6]">*</span>
              </label>
              <input
                type="text"
                value={entry.name}
                onChange={e => update(index, 'name', e.target.value)}
                placeholder="z.B. Google Analytics Zertifikat, IHK-Bestenehrung"
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#66c0b6] transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">
                  Aussteller / Organisation
                </label>
                <input
                  type="text"
                  value={entry.issuer}
                  onChange={e => update(index, 'issuer', e.target.value)}
                  placeholder="z.B. Google, IHK"
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
              <input
                type="text"
                value={entry.description || ''}
                onChange={e => update(index, 'description', e.target.value)}
                placeholder="z.B. Bestanden mit Auszeichnung (95/100 Punkten)"
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#66c0b6] transition-all"
              />
            </div>
          </div>
        ))}

        <button
          onClick={addEntry}
          className="w-full py-3 rounded-xl border border-dashed border-white/20 text-white/50 hover:border-[#66c0b6]/50 hover:text-[#66c0b6] transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Weiteres Zertifikat / Auszeichnung hinzufügen
        </button>

        {hasAnyData && (
          <div className="p-4 rounded-xl bg-[#66c0b6]/10 border border-[#66c0b6]/30">
            <p className="text-sm text-[#66c0b6] font-medium">
              Zertifikate und Auszeichnungen erfasst – das macht deinen CV noch stärker!
            </p>
          </div>
        )}
      </div>
    </WizardStepLayout>
  );
}
