import { useState } from 'react';
import { ArrowRight, ArrowLeft, Plus, X, Check, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarSidebar } from './AvatarSidebar';
import { SoftSkill } from '../../types/cvBuilder';
import { SOFT_SKILL_SITUATIONS } from '../../config/cvBuilderSteps';

// ── Hierarchical skill tree ────────────────────────────────────────────────────
const SKILL_TREE: {
  value: string;
  label: string;
  icon: string;
  subSkills: { value: string; label: string }[];
}[] = [
  {
    value: 'communication',
    label: 'Kommunikation',
    icon: '💬',
    subSkills: [
      { value: 'verhandlung', label: 'Verhandlungsführung' },
      { value: 'storytelling', label: 'Storytelling' },
      { value: 'konflikt', label: 'Konfliktmanagement' },
      { value: 'praesentieren', label: 'Präsentieren' },
      { value: 'aktives-zuhoeren', label: 'Aktives Zuhören' },
    ],
  },
  {
    value: 'leadership',
    label: 'Leadership',
    icon: '⭐',
    subSkills: [
      { value: 'motivation', label: 'Teammotivation' },
      { value: 'delegation', label: 'Delegation' },
      { value: 'entscheiden', label: 'Entscheidungsstärke' },
      { value: 'coaching-skill', label: 'Coaching & Mentoring' },
      { value: 'vision', label: 'Visionskommunikation' },
    ],
  },
  {
    value: 'problem-solving',
    label: 'Problemlösung',
    icon: '🧩',
    subSkills: [
      { value: 'analytik', label: 'Analytisches Denken' },
      { value: 'kreativ-loesen', label: 'Kreative Lösungsfindung' },
      { value: 'root-cause', label: 'Root-Cause-Analyse' },
      { value: 'entscheidung-u', label: 'Entscheidung unter Druck' },
    ],
  },
  {
    value: 'teamwork',
    label: 'Teamarbeit',
    icon: '🤝',
    subSkills: [
      { value: 'zusammenarbeit', label: 'Cross-funktionale Zusammenarbeit' },
      { value: 'remote-kolab', label: 'Remote-Kollaboration' },
      { value: 'feedback-geben', label: 'Konstruktives Feedback' },
      { value: 'onboarding-skill', label: 'Kolleginnen einarbeiten' },
    ],
  },
  {
    value: 'adaptability',
    label: 'Anpassungsfähigkeit',
    icon: '🔄',
    subSkills: [
      { value: 'ambiguity', label: 'Umgang mit Unklarheit' },
      { value: 'lernbereit', label: 'Lernbereitschaft' },
      { value: 'veraenderung', label: 'Veränderungsbereitschaft' },
      { value: 'resilienz', label: 'Resilienz' },
    ],
  },
  {
    value: 'time-management',
    label: 'Zeitmanagement',
    icon: '⏱️',
    subSkills: [
      { value: 'priorisierung', label: 'Priorisierung' },
      { value: 'selbstorganisation', label: 'Selbstorganisation' },
      { value: 'multitasking', label: 'Multitasking' },
      { value: 'deadline-skill', label: 'Deadline-Sicherheit' },
    ],
  },
  {
    value: 'initiative',
    label: 'Eigeninitiative',
    icon: '🚀',
    subSkills: [
      { value: 'proaktiv', label: 'Proaktives Handeln' },
      { value: 'ownership', label: 'Ownership-Mentalität' },
      { value: 'innovation-init', label: 'Innovationsantrieb' },
    ],
  },
  {
    value: 'customer-focus',
    label: 'Kundenorientierung',
    icon: '🎯',
    subSkills: [
      { value: 'empathie', label: 'Empathie' },
      { value: 'beschwerde', label: 'Beschwerdemanagement' },
      { value: 'beduerfe', label: 'Bedarfsanalyse' },
      { value: 'service-skill', label: 'Serviceorientierung' },
    ],
  },
  {
    value: 'creativity',
    label: 'Kreativität',
    icon: '💡',
    subSkills: [
      { value: 'brainstorm', label: 'Brainstorming' },
      { value: 'design-think', label: 'Design Thinking' },
      { value: 'konzept', label: 'Konzeptentwicklung' },
    ],
  },
  {
    value: 'analytical-thinking',
    label: 'Analytisches Denken',
    icon: '📊',
    subSkills: [
      { value: 'datenanalyse', label: 'Datenanalyse' },
      { value: 'kpi-skill', label: 'KPI-Steuerung' },
      { value: 'forecasting-skill', label: 'Forecasting' },
      { value: 'reporting-skill', label: 'Reporting' },
    ],
  },
];

interface SoftSkillsStepProps {
  data?: SoftSkill[];
  onChange: (skills: SoftSkill[]) => void;
  onNext: () => void;
  onBack: () => void;
}

interface SelectedSkill {
  parentValue: string;
  subValue?: string; // if sub-skill was chosen
  displayLabel: string;
  situation: string;
  example?: string;
}

export function SoftSkillsStep({
  data: initialSkills = [],
  onChange,
  onNext,
  onBack,
}: SoftSkillsStepProps) {
  const [selected, setSelected] = useState<SelectedSkill[]>(() =>
    initialSkills.map(s => ({
      parentValue: s.skill,
      displayLabel: s.skill,
      situation: s.situation,
      example: s.example,
    }))
  );
  const [expandedParent, setExpandedParent] = useState<string | null>(null);
  const [situationModal, setSituationModal] = useState<{ skillKey: string; label: string } | null>(null);
  const [customSkill, setCustomSkill] = useState('');
  const [customSkills, setCustomSkills] = useState<string[]>([]);

  const isParentSelected = (val: string) =>
    selected.some(s => s.parentValue === val);

  const isSubSelected = (parentVal: string, subVal: string) =>
    selected.some(s => s.parentValue === parentVal && s.subValue === subVal);

  const removeSkill = (key: string) => {
    setSelected(prev => prev.filter(s =>
      !(s.subValue ? s.subValue === key : s.parentValue === key)
    ));
  };

  const toggleParent = (parent: typeof SKILL_TREE[0]) => {
    const already = isParentSelected(parent.value);
    if (already) {
      // deselect all sub-skills + parent
      setSelected(prev => prev.filter(s => s.parentValue !== parent.value));
      if (expandedParent === parent.value) setExpandedParent(null);
    } else {
      // expand sub-skill menu
      setExpandedParent(expandedParent === parent.value ? null : parent.value);
    }
  };

  const selectSubSkill = (parent: typeof SKILL_TREE[0], sub: { value: string; label: string }) => {
    const alreadySub = isSubSelected(parent.value, sub.value);
    if (alreadySub) {
      removeSkill(sub.value);
    } else {
      // Add directly without forcing dialog
      setSelected(prev => [...prev, {
        parentValue: parent.value,
        subValue: sub.value,
        displayLabel: `${parent.label} — ${sub.label}`,
        situation: '',
      }]);
    }
  };

  const selectParentDirectly = (parent: typeof SKILL_TREE[0]) => {
    if (isParentSelected(parent.value)) {
      removeSkill(parent.value);
    } else {
      // Add directly without forcing dialog
      setSelected(prev => [...prev, {
        parentValue: parent.value,
        displayLabel: parent.label,
        situation: '',
      }]);
    }
  };

  const saveSituation = (situation: string, example?: string) => {
    if (!situationModal) return;
    const { skillKey, label } = situationModal;
    const [parentVal, subVal] = skillKey.includes('::') ? skillKey.split('::') : [skillKey, undefined];
    setSelected(prev => {
      const filtered = prev.filter(s =>
        !(s.parentValue === parentVal && s.subValue === subVal)
      );
      return [...filtered, {
        parentValue: parentVal,
        subValue: subVal,
        displayLabel: label,
        situation,
        example,
      }];
    });
    setSituationModal(null);
  };

  const addCustom = () => {
    const trimmed = customSkill.trim();
    if (!trimmed || customSkills.includes(trimmed)) return;
    setCustomSkills(prev => [...prev, trimmed]);
    setCustomSkill('');
    setSituationModal({ skillKey: `custom::${trimmed}`, label: trimmed });
  };

  const handleContinue = () => {
    if (selected.length === 0) return;
    onChange(selected.map(s => ({
      skill: s.displayLabel,
      situation: s.situation || '',
      example: s.example,
    })));
    onNext();
  };

  const getSituations = (skillKey: string): string[] => {
    const [parentVal] = skillKey.includes('::') ? skillKey.split('::') : [skillKey];
    return SOFT_SKILL_SITUATIONS[parentVal] || [
      'In Projekten', 'Im Team', 'Mit Kunden', 'In Herausforderungen', 'Im Alltag'
    ];
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:p-6 lg:max-w-7xl lg:mx-auto">
      <div className="flex-1 space-y-8 animate-fade-in px-4 lg:px-0">

        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-white via-[#66c0b6] to-white bg-clip-text text-transparent">
            Welche Soft Skills zeichnen dich aus?
          </h2>
          <p className="text-base text-gray-300">
            Klicke auf eine Kategorie um spezifische Ausprägungen zu wählen.
          </p>
        </div>

        {/* Tag Cloud / Skill Grid */}
        <div className="max-w-5xl mx-auto">

          {/* Selected skills tag cloud */}
          <AnimatePresence>
            {selected.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                  Deine Skills ({selected.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selected.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#66c0b6]/15 border border-[#66c0b6]/40 text-sm"
                    >
                      <Check size={11} className="text-[#66c0b6]" />
                      <span className="text-white/90 font-medium">{s.displayLabel}</span>
                      {s.situation
                        ? <span className="text-white/40 text-xs">· {s.situation}</span>
                        : (
                          <button
                            onClick={() => setSituationModal({
                              skillKey: s.subValue ? `${s.parentValue}::${s.subValue}` : s.parentValue,
                              label: s.displayLabel,
                            })}
                            className="text-[#66c0b6]/60 hover:text-[#66c0b6] text-xs underline transition-colors"
                          >
                            + Situation
                          </button>
                        )
                      }
                      <button
                        onClick={() => removeSkill(s.subValue ?? s.parentValue)}
                        className="text-white/30 hover:text-red-400 transition-colors ml-1"
                      >
                        <X size={13} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Parent skill grid */}
          <div className="space-y-2">
            {SKILL_TREE.map((parent) => {
              const hasSelected = isParentSelected(parent.value);
              const isExpanded = expandedParent === parent.value;
              const selectedSubs = selected.filter(s => s.parentValue === parent.value && s.subValue);

              return (
                <div key={parent.value} className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">

                  {/* Parent row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => toggleParent(parent)}
                      className={`flex-1 flex items-center gap-3 text-left transition-all ${
                        hasSelected ? 'text-white' : 'text-white/75 hover:text-white'
                      }`}
                    >
                      <span className="text-xl leading-none w-7 shrink-0">{parent.icon}</span>
                      <span className="font-semibold text-sm">{parent.label}</span>
                      {selectedSubs.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#66c0b6]/20 text-[#66c0b6] text-xs font-bold">
                          {selectedSubs.length}
                        </span>
                      )}
                    </button>

                    {/* Expand sub-skills */}
                    <button
                      onClick={() => setExpandedParent(isExpanded ? null : parent.value)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        isExpanded
                          ? 'border-[#66c0b6]/40 bg-[#66c0b6]/10 text-[#66c0b6]'
                          : 'border-white/15 text-white/50 hover:text-white hover:border-white/25'
                      }`}
                    >
                      Ausprägungen
                      <ChevronDown
                        size={13}
                        className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Direct-select parent (without sub) */}
                    <button
                      onClick={() => selectParentDirectly(parent)}
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                        hasSelected && !selectedSubs.length
                          ? 'border-[#66c0b6] bg-[#66c0b6]/20 text-[#66c0b6]'
                          : 'border-white/15 text-white/40 hover:border-white/30 hover:text-white/70'
                      }`}
                      title="Direkt als Skill wählen (ohne Ausprägung)"
                    >
                      {hasSelected && !selectedSubs.length ? <Check size={13} /> : <Plus size={13} />}
                    </button>
                  </div>

                  {/* Sub-skills dropdown */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3 pt-1 border-t border-white/8">
                          <p className="text-xs text-white/40 mb-2.5">Wähle eine oder mehrere Ausprägungen:</p>
                          <div className="flex flex-wrap gap-2">
                            {parent.subSkills.map((sub) => {
                              const isSel = isSubSelected(parent.value, sub.value);
                              return (
                                <motion.button
                                  key={sub.value}
                                  onClick={() => selectSubSkill(parent, sub)}
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-all ${
                                    isSel
                                      ? 'border-[#66c0b6] bg-[#66c0b6]/20 text-white shadow-[0_0_10px_rgba(102,192,182,0.2)]'
                                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:border-white/20'
                                  }`}
                                >
                                  {isSel && <Check size={12} className="text-[#66c0b6] shrink-0" />}
                                  {sub.label}
                                  {!isSel && (
                                    <Sparkles size={10} className="text-white/25" />
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Custom skill */}
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-sm font-semibold text-white/70 mb-3">Eigenen Skill hinzufügen</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addCustom(); }}
                placeholder="Eigenen Soft Skill eingeben..."
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/35 focus:outline-none focus:border-[#66c0b6] text-sm"
              />
              <button
                onClick={addCustom}
                disabled={!customSkill.trim()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-semibold hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-2 text-sm"
              >
                <Plus size={16} /> Hinzufügen
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-white/70 hover:text-white"
            >
              <ArrowLeft size={18} /> Zurück
            </button>
            <button
              onClick={handleContinue}
              disabled={selected.length === 0}
              className="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold text-base hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2.5 shadow-xl"
            >
              Weiter <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="hidden lg:block">
        <AvatarSidebar
          message="Spezifische Ausprägungen machen dich einzigartig. 'Verhandlungsführung' klingt stärker als nur 'Kommunikation'."
          stepInfo="Wähle 4–8 Skills mit konkreten Situationsbeispielen für maximale Glaubwürdigkeit."
          currentStepId="softSkills"
        />
      </div>

      {/* Situation dialog */}
      <AnimatePresence>
        {situationModal && (
          <SituationDialog
            label={situationModal.label}
            situations={getSituations(situationModal.skillKey)}
            onSave={saveSituation}
            onCancel={() => setSituationModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface SituationDialogProps {
  label: string;
  situations: string[];
  onSave: (situation: string, example?: string) => void;
  onCancel: () => void;
}

function SituationDialog({ label, situations, onSave, onCancel }: SituationDialogProps) {
  const [selected, setSelected] = useState('');
  const [example, setExample] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#0a0f1e] border border-white/15 rounded-3xl p-7 max-w-lg w-full shadow-2xl"
      >
        <h3 className="text-xl font-bold text-white mb-1">{label}</h3>
        <p className="text-white/45 text-sm mb-5">In welcher Situation hast du diesen Skill gezeigt?</p>

        <div className="grid grid-cols-2 gap-2 mb-5">
          {situations.map((s) => (
            <button
              key={s}
              onClick={() => setSelected(selected === s ? '' : s)}
              className={`px-3 py-2.5 rounded-xl border text-sm text-left transition-all ${
                selected === s
                  ? 'border-[#66c0b6] bg-[#66c0b6]/20 text-white'
                  : 'border-white/10 bg-white/5 text-white/75 hover:bg-white/10'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <textarea
          value={example}
          onChange={(e) => setExample(e.target.value)}
          placeholder='Z.B. "Koordination eines 4-köpfigen Teams während eines Uniprojekts..."'
          rows={3}
          maxLength={200}
          className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/35 focus:outline-none focus:border-[#66c0b6] resize-none text-sm mb-1"
        />
        <p className="text-xs text-white/35 mb-5">{example.length}/200</p>

        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white/65 hover:bg-white/5 transition-all text-sm"
          >
            Abbrechen
          </button>
          <button
            onClick={() => onSave(selected, example.trim() || undefined)}
            disabled={!selected}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
          >
            Speichern
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
