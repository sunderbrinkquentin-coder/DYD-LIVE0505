import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { WizardStepLayout } from '../WizardStepLayout';
import { Hobbies } from '../../../types/cvBuilder';

interface HobbiesStepProps {
  data?: Hobbies;
  onChange: (hobbies: Hobbies) => void;
  onNext: () => void;
  onBack: () => void;
}

const HOBBY_SUGGESTIONS = [
  { value: 'sport', label: 'Sport', icon: '⚽' },
  { value: 'reading', label: 'Lesen', icon: '📚' },
  { value: 'music', label: 'Musik', icon: '🎵' },
  { value: 'photography', label: 'Fotografie', icon: '📷' },
  { value: 'cooking', label: 'Kochen', icon: '👨‍🍳' },
  { value: 'travel', label: 'Reisen', icon: '✈️' },
  { value: 'gaming', label: 'Gaming', icon: '🎮' },
  { value: 'art', label: 'Kunst & Design', icon: '🎨' },
  { value: 'volunteering', label: 'Ehrenamt', icon: '🤝' },
  { value: 'technology', label: 'Technologie', icon: '💻' },
  { value: 'nature', label: 'Natur & Wandern', icon: '🌲' },
  { value: 'writing', label: 'Schreiben', icon: '✍️' }
];

export function HobbiesStep({ data, onChange, onNext, onBack }: HobbiesStepProps) {
  const [hobbies, setHobbies] = useState<string[]>(data?.hobbies || []);
  const [customHobby, setCustomHobby] = useState('');

  const toggleHobby = (hobby: string) => {
    const updated = hobbies.includes(hobby)
      ? hobbies.filter(h => h !== hobby)
      : [...hobbies, hobby];

    setHobbies(updated);
    onChange({ hobbies: updated, details: data?.details || '' });
  };

  const addCustomHobby = () => {
    if (customHobby.trim() && !hobbies.includes(customHobby.trim())) {
      const updated = [...hobbies, customHobby.trim()];
      setHobbies(updated);
      onChange({ hobbies: updated, details: data?.details || '' });
      setCustomHobby('');
    }
  };

  const removeHobby = (hobby: string) => {
    const updated = hobbies.filter(h => h !== hobby);
    setHobbies(updated);
    onChange({ hobbies: updated, details: data?.details || '' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomHobby();
    }
  };

  return (
    <WizardStepLayout
      title="Deine Hobbys & Interessen"
      subtitle="Zeig deine Persönlichkeit! Hobbys können den Cultural Fit unterstreichen."
      avatarMessage="Hobbys machen dein Profil menschlicher und helfen beim Einstieg ins Gespräch."
      avatarStepInfo="Wähle 3-5 Hobbys aus, die zu deiner Zielposition passen."
      currentStepId="hobbies"
      onPrev={onBack}
      onNext={onNext}
      hideProgress
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Beliebte Hobbys</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {HOBBY_SUGGESTIONS.map((hobby) => {
              const isSelected = hobbies.includes(hobby.label);
              return (
                <button
                  key={hobby.value}
                  onClick={() => toggleHobby(hobby.label)}
                  className={`p-4 rounded-xl border transition-all duration-200 hover:scale-105 ${
                    isSelected
                      ? 'border-[#66c0b6] bg-[#66c0b6]/20 text-white shadow-[0_0_20px_rgba(102,192,182,0.3)]'
                      : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="text-2xl mb-1">{hobby.icon}</div>
                  <div className="text-sm font-medium">{hobby.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {hobbies.some(h => !HOBBY_SUGGESTIONS.find(s => s.label === h)) && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Deine eigenen Hobbys</h3>
            <div className="flex flex-wrap gap-3">
              {hobbies
                .filter(h => !HOBBY_SUGGESTIONS.find(s => s.label === h))
                .map((hobby) => (
                  <button
                    key={hobby}
                    onClick={() => removeHobby(hobby)}
                    className="group px-5 py-3 rounded-xl border border-[#66c0b6] bg-[#66c0b6]/20 text-white shadow-[0_0_20px_rgba(102,192,182,0.3)] transition-all duration-200 hover:scale-105 flex items-center gap-2"
                  >
                    <span>{hobby}</span>
                    <X size={14} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
            </div>
          </div>
        )}

        <div className="border-t border-white/10 pt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Eigenes Hobby hinzufügen</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={customHobby}
              onChange={(e) => setCustomHobby(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="z.B. Yoga, Schach, Modellbau..."
              className="flex-1 px-4 py-3.5 rounded-xl border-2 border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#66c0b6] focus:bg-white/10 transition-all"
            />
            <button
              onClick={addCustomHobby}
              disabled={!customHobby.trim()}
              className="px-6 py-3.5 rounded-xl bg-[#66c0b6]/20 border border-[#66c0b6]/30 text-[#66c0b6] hover:bg-[#66c0b6]/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus size={20} />
              Hinzufügen
            </button>
          </div>
        </div>

        {hobbies.length > 0 && (
          <div className="p-4 rounded-xl bg-[#66c0b6]/10 border border-[#66c0b6]/30">
            <p className="text-sm text-[#66c0b6] font-medium mb-1">
              ✓ Du hast {hobbies.length} {hobbies.length === 1 ? 'Hobby' : 'Hobbys'} ausgewählt
            </p>
            <p className="text-xs text-[#66c0b6]/90">
              💡 Tipp: 3-5 Hobbys sind ideal. Wähle solche, die zum Job passen (z.B. Teamarbeit → Mannschaftssport).
            </p>
          </div>
        )}
      </div>
    </WizardStepLayout>
  );
}
