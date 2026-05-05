import { useState } from 'react';
import { ArrowRight, ArrowLeft, Plus, X, Star } from 'lucide-react';
import { AvatarSidebar } from './AvatarSidebar';
import { HardSkill, Language } from '../../types/cvBuilder';
import { HARD_SKILLS_BY_INDUSTRY, COMMON_LANGUAGES } from '../../config/cvBuilderSteps';

interface HardSkillsStepProps {
  skills?: HardSkill[];
  languages?: Language[];
  onSkillsChange: (skills: HardSkill[]) => void;
  onLanguagesChange: (languages: Language[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const LEVEL_LABELS: Record<number, string> = {
  1: 'Grundkenntnisse',
  2: 'Basiswissen',
  3: 'Fortgeschritten',
  4: 'Sehr gut',
  5: 'Experte',
};

function levelNumberToString(n: number): string {
  if (n <= 1) return 'beginner';
  if (n === 2) return 'basic';
  if (n === 3) return 'intermediate';
  if (n === 4) return 'advanced';
  return 'expert';
}

export function HardSkillsStep({
  skills = [],
  languages: initialLanguages = [],
  onSkillsChange,
  onLanguagesChange,
  onNext,
  onBack
}: HardSkillsStepProps) {
  const suggestedSkills = [
    ...HARD_SKILLS_BY_INDUSTRY.tech.slice(0, 5),
    ...HARD_SKILLS_BY_INDUSTRY.finance.slice(0, 4),
    ...HARD_SKILLS_BY_INDUSTRY.marketing.slice(0, 4),
    ...HARD_SKILLS_BY_INDUSTRY.other
  ];

  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    Array.isArray(skills) ? skills.map(s => s.skill) : []
  );
  const [skillLevels, setSkillLevels] = useState<Record<string, number>>(
    Array.isArray(skills)
      ? Object.fromEntries(skills.map(s => [s.skill, (s as any).numericLevel ?? 3]))
      : {}
  );
  const [skillLevelPicker, setSkillLevelPicker] = useState<string | null>(null);
  const [customSkill, setCustomSkill] = useState('');
  const [customSkills, setCustomSkills] = useState<string[]>(
    Array.isArray(skills)
      ? skills.filter(s => !(suggestedSkills ?? []).includes(s.skill)).map(s => s.skill)
      : []
  );

  const [languages, setLanguages] = useState<Language[]>(initialLanguages);
  const [newLanguage, setNewLanguage] = useState({ name: '', level: 'basic' as const });
  const [isAddingLanguage, setIsAddingLanguage] = useState(false);
  const [selectedLanguageForLevel, setSelectedLanguageForLevel] = useState<string | null>(null);

  const languageLevels = [
    { value: 'basic', label: 'Grundkenntnisse' },
    { value: 'intermediate', label: 'Konversationssicher' },
    { value: 'advanced', label: 'Fließend in Wort und Schrift' },
    { value: 'native', label: 'Muttersprache / Verhandlungssicher' }
  ];

  const buildAllSkills = (selected: string[], levels: Record<string, number>): HardSkill[] =>
    selected.map(s => ({
      skill: s,
      category: customSkills.includes(s) ? 'other' : 'tool',
      level: levelNumberToString(levels[s] ?? 3),
      numericLevel: levels[s] ?? 3,
    } as any));

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      const updated = selectedSkills.filter(s => s !== skill);
      setSelectedSkills(updated);
      onSkillsChange(buildAllSkills(updated, skillLevels));
    } else {
      setSkillLevelPicker(skill);
    }
  };

  const confirmSkillWithLevel = (skill: string, level: number) => {
    const updated = selectedSkills.includes(skill) ? selectedSkills : [...selectedSkills, skill];
    const levels = { ...skillLevels, [skill]: level };
    setSelectedSkills(updated);
    setSkillLevels(levels);
    setSkillLevelPicker(null);
    onSkillsChange(buildAllSkills(updated, levels));
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (!trimmed) return;
    if (selectedSkills.includes(trimmed) || customSkills.includes(trimmed)) return;
    setCustomSkills(prev => [...prev, trimmed]);
    setCustomSkill('');
    setSkillLevelPicker(trimmed);
  };

  const removeCustomSkill = (skill: string) => {
    setCustomSkills(prev => prev.filter(s => s !== skill));
    const updated = selectedSkills.filter(s => s !== skill);
    setSelectedSkills(updated);
    onSkillsChange(buildAllSkills(updated, skillLevels));
  };

  const addLanguage = () => {
    if (newLanguage.name.trim()) {
      setLanguages(prev => [...prev, { language: newLanguage.name.trim(), level: newLanguage.level }]);
      setNewLanguage({ name: '', level: 'basic' });
      setIsAddingLanguage(false);
    }
  };

  const selectLanguageWithLevel = (languageName: string, level: string) => {
    if (!languages.find(l => l.language === languageName)) {
      setLanguages(prev => [...prev, { language: languageName, level: level as any }]);
    }
    setSelectedLanguageForLevel(null);
  };

  const isLanguageSelected = (languageName: string) => {
    return languages.some(l => l.language === languageName);
  };

  const removeLanguage = (index: number) => {
    setLanguages(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    onSkillsChange(buildAllSkills(selectedSkills, skillLevels));
    onLanguagesChange(languages);
    onNext();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomSkill();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:p-6 lg:max-w-7xl lg:mx-auto">
      <div className="flex-1 space-y-10 animate-fade-in px-4 lg:px-0">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-[#66c0b6] to-white bg-clip-text text-transparent">
            Hard Skills & Sprachen
          </h2>
          <p className="text-xl text-gray-300">
            Wähle deine Skills aus und füge deine Sprachkenntnisse hinzu.
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Beliebte Hard Skills
            </h3>
            <p className="text-sm text-white/50 mb-4">Klicke auf einen Skill, um ihn hinzuzufügen und dein Level zu wählen.</p>
            {suggestedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {suggestedSkills.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  const lvl = skillLevels[skill];
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`flex flex-col items-start px-4 py-2.5 rounded-xl border transition-all duration-200 hover:scale-105 ${
                        isSelected
                          ? 'border-[#66c0b6] bg-[#66c0b6]/20 text-white shadow-[0_0_20px_rgba(102,192,182,0.3)]'
                          : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <span>{skill}</span>
                      {isSelected && lvl && (
                        <span className="flex items-center gap-0.5 mt-0.5">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} size={8} className={n <= lvl ? 'text-[#66c0b6] fill-[#66c0b6]' : 'text-white/20'} />
                          ))}
                          <span className="text-xs text-[#66c0b6]/80 ml-1">{LEVEL_LABELS[lvl]}</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <p className="text-white/70 text-center">
                  Wir haben keine automatischen Vorschläge gefunden – bitte gib deine Skills manuell ein.
                </p>
              </div>
            )}
          </div>

          {customSkills.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Deine eigenen Skills</h3>
              <div className="flex flex-wrap gap-3">
                {customSkills.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  const lvl = skillLevels[skill];
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`group flex flex-col items-start px-4 py-2.5 rounded-xl border transition-all duration-200 hover:scale-105 ${
                        isSelected
                          ? 'border-[#66c0b6] bg-[#66c0b6]/20 text-white shadow-[0_0_20px_rgba(102,192,182,0.3)]'
                          : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {skill}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCustomSkill(skill);
                          }}
                          className="p-0.5 rounded-full hover:bg-red-500/20 transition-colors"
                        >
                          <X size={12} className="text-red-400" />
                        </button>
                      </span>
                      {isSelected && lvl && (
                        <span className="flex items-center gap-0.5 mt-0.5">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} size={8} className={n <= lvl ? 'text-[#66c0b6] fill-[#66c0b6]' : 'text-white/20'} />
                          ))}
                          <span className="text-xs text-[#66c0b6]/80 ml-1">{LEVEL_LABELS[lvl]}</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t border-white/10 pt-8">
            <h3 className="text-lg font-semibold text-white mb-4">Eigenen Hard Skill hinzufügen</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Eigenen Hard Skill eingeben..."
                className="flex-1 px-5 py-4 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#66c0b6] focus:ring-2 focus:ring-[#66c0b6]/20"
              />
              <button
                onClick={addCustomSkill}
                disabled={!customSkill.trim()}
                className="px-6 py-4 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-xl"
              >
                <Plus size={20} />
                Hinzufügen
              </button>
            </div>
            <p className="text-sm text-white/50 mt-2">
              Drücke Enter oder klicke auf "Hinzufügen", um den Skill zur Liste hinzuzufügen.
            </p>
          </div>

          <div className="border-t border-white/10 pt-8">
            <h3 className="text-lg font-semibold text-white mb-4">Sprachkenntnisse</h3>

            <div className="mb-6">
              <p className="text-sm text-white/60 mb-3">Häufige Sprachen</p>
              <div className="flex flex-wrap gap-3">
                {COMMON_LANGUAGES.map((lang) => {
                  const isSelected = isLanguageSelected(lang);
                  const isSelectingLevel = selectedLanguageForLevel === lang;

                  return (
                    <div key={lang} className="relative">
                      <button
                        onClick={() => {
                          if (isSelected) {
                            setLanguages(prev => prev.filter(l => l.language !== lang));
                          } else {
                            setSelectedLanguageForLevel(lang);
                          }
                        }}
                        className={`px-5 py-3 rounded-xl border transition-all duration-200 hover:scale-105 ${
                          isSelected
                            ? 'border-[#66c0b6] bg-[#66c0b6]/20 text-white shadow-[0_0_20px_rgba(102,192,182,0.3)]'
                            : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        {lang}
                      </button>

                      {isSelectingLevel && (
                        <div className="absolute top-full left-0 mt-2 bg-[#0a0f1e] border border-white/20 rounded-xl p-3 shadow-2xl z-50 min-w-[240px]">
                          <p className="text-xs text-white/60 mb-2">Niveau wählen:</p>
                          <div className="space-y-2">
                            {languageLevels.map((level) => (
                              <button
                                key={level.value}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectLanguageWithLevel(lang, level.value);
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/90 hover:bg-[#66c0b6]/20 hover:text-white transition-all"
                              >
                                {level.label}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLanguageForLevel(null);
                            }}
                            className="w-full mt-2 px-3 py-2 rounded-lg text-xs text-white/60 hover:bg-white/10 transition-all"
                          >
                            Abbrechen
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {languages.length > 0 && (
              <div className="space-y-3 mb-4">
                {languages.map((lang, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{lang.language}</p>
                      <p className="text-white/60 text-sm">
                        {languageLevels.find(l => l.value === lang.level)?.label}
                      </p>
                    </div>
                    <button
                      onClick={() => removeLanguage(index)}
                      className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      <X size={18} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!isAddingLanguage ? (
              <button
                onClick={() => setIsAddingLanguage(true)}
                className="w-full px-5 py-4 rounded-xl border border-dashed border-white/20 bg-white/5 text-white/70 hover:bg-white/10 hover:border-white/30 hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                <span>Weitere Sprache hinzufügen</span>
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={newLanguage.name}
                  onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addLanguage();
                    if (e.key === 'Escape') {
                      setIsAddingLanguage(false);
                      setNewLanguage({ name: '', level: 'basic' });
                    }
                  }}
                  placeholder="z.B. Englisch, Spanisch, Französisch..."
                  className="w-full px-5 py-4 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#66c0b6] focus:ring-2 focus:ring-[#66c0b6]/20"
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-2">
                  {languageLevels.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setNewLanguage({ ...newLanguage, level: level.value as any })}
                      className={`px-4 py-3 rounded-xl border transition-all text-sm ${
                        newLanguage.level === level.value
                          ? 'border-[#66c0b6] bg-[#66c0b6]/20 text-white'
                          : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addLanguage}
                    disabled={!newLanguage.name.trim()}
                    className="flex-1 px-5 py-3 rounded-xl bg-[#66c0b6] text-black font-medium hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Hinzufügen
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingLanguage(false);
                      setNewLanguage({ name: '', level: 'basic' });
                    }}
                    className="px-5 py-3 rounded-xl border border-white/20 text-white/70 hover:bg-white/10 transition-all"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="text-2xl">✅</div>
              <div>
                <p className="text-white/90 font-medium">
                  {selectedSkills.length} Skills ausgewählt
                </p>
                <p className="text-sm text-white/60">
                  Wähle die Skills, die du wirklich beherrschst.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-white/70 hover:text-white"
            >
              <ArrowLeft size={18} />
              Zurück
            </button>
            <button
              onClick={handleContinue}
              disabled={selectedSkills.length === 0}
              className="px-12 py-4 rounded-2xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold text-lg hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-3 shadow-xl"
            >
              Weiter
              <ArrowRight size={22} />
            </button>
          </div>
        </div>
      </div>

      <div className="hidden lg:block">
        <AvatarSidebar
          message="Hard Skills und Sprachen sind wichtig für ATS-Systeme."
          stepInfo="Füge alle relevanten Skills und Sprachkenntnisse hinzu. Sprachen werden jetzt direkt hier erfasst."
          currentStepId="hardSkills"
        />
      </div>

      {skillLevelPicker && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">
              Level für <span className="text-[#66c0b6]">{skillLevelPicker}</span>
            </h3>
            <p className="text-sm text-white/50 mb-5">Wie gut beherrschst du diesen Skill?</p>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => confirmSkillWithLevel(skillLevelPicker, n)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#66c0b6]/50 hover:bg-[#66c0b6]/10 transition-all text-left"
                >
                  <span className="flex items-center gap-0.5 flex-shrink-0">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={14} className={s <= n ? 'text-[#66c0b6] fill-[#66c0b6]' : 'text-white/20'} />
                    ))}
                  </span>
                  <span className="text-white font-medium">{LEVEL_LABELS[n]}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setSkillLevelPicker(null)}
              className="w-full mt-3 py-2 text-sm text-white/40 hover:text-white/60 transition-all"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
