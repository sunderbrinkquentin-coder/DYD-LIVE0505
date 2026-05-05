import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  X,
  Plus,
  User,
  GraduationCap,
  Briefcase,
  Star,
  FolderOpen,
  Globe,
  Award,
  Sparkles,
  Coins
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { agentSections } from '../config/agentFlow';
import { Section, Question } from '../types/agent';
import { AgentInput, AgentTextarea, TagInput } from '../components/agent/AgentInput';
import { useAgentPersistence } from '../hooks/useAgentPersistence';
import { dbService } from '../services/databaseService';
import { mapCVDataForDatabase } from '../utils/cvDataMapper';
import AgentProgressPanel from '../components/agent/AgentProgressPanel';
import AgentProgressTrigger from '../components/agent/AgentProgressTrigger';

const iconMap: Record<string, any> = {
  user: User,
  graduation: GraduationCap,
  briefcase: Briefcase,
  star: Star,
  folder: FolderOpen,
  globe: Globe,
  award: Award,
  sparkles: Sparkles,
};

function QuestionRenderer({
  question,
  onKeyPress,
  answers,
  updateAnswer
}: {
  question: Question;
  onKeyPress: any;
  answers: Record<string, any>;
  updateAnswer: (key: string, value: any) => void;
}) {
  const answer = answers[question.id];

  if (question.type === 'text') {
    return (
      <input
        id="answer-input"
        type="text"
        value={answer || ''}
        onChange={(e) => updateAnswer(question.id, e.target.value)}
        onKeyDown={onKeyPress}
        placeholder={question.placeholder}
        className="w-full p-4 rounded-xl bg-white bg-opacity-5 border-2 border-transparent focus:border-primary outline-none text-white text-lg transition-all focus:shadow-lg focus:shadow-primary focus:shadow-opacity-20"
      />
    );
  }

  if (question.type === 'textarea') {
    return (
      <>
        <textarea
          id="answer-input"
          value={answer || ''}
          onChange={(e) => updateAnswer(question.id, e.target.value)}
          placeholder={question.placeholder}
          className="w-full p-4 rounded-xl bg-white bg-opacity-5 border-2 border-transparent focus:border-primary outline-none text-white text-lg resize-vertical transition-all"
          rows={question.rows || 4}
          maxLength={500}
        />
        <div className="text-xs text-text-secondary text-right mt-2">
          {(answer || '').length}/500
        </div>
      </>
    );
  }

  if (question.type === 'multi_input' || question.type === 'date_range') {
    return (
      <div className="space-y-4">
        {question.fields?.map((field, idx) => (
          <div key={field.name}>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              {field.label}
            </label>
            {field.type === 'checkbox' ? (
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-white hover:bg-opacity-5 transition-all">
                <input
                  type="checkbox"
                  checked={answers[field.name] || false}
                  onChange={(e) => {
                    console.log('[QuestionRenderer] Updating checkbox:', field.name, '=', e.target.checked);
                    updateAnswer(field.name, e.target.checked);
                  }}
                  className="w-5 h-5 accent-primary"
                />
                <span className="text-white">{field.label}</span>
              </label>
            ) : field.type === 'textarea' ? (
              <textarea
                id={idx === 0 ? 'answer-input' : undefined}
                value={answers[field.name] || ''}
                onChange={(e) => {
                  console.log('[QuestionRenderer] Updating textarea:', field.name, '=', e.target.value);
                  updateAnswer(field.name, e.target.value);
                }}
                placeholder={field.placeholder}
                className="w-full p-3 rounded-lg bg-white bg-opacity-5 border-2 border-transparent focus:border-primary outline-none text-white transition-all"
                rows={field.rows || 3}
              />
            ) : field.type === 'select' ? (
              <select
                id={idx === 0 ? 'answer-input' : undefined}
                value={answers[field.name] || ''}
                onChange={(e) => {
                  console.log('[QuestionRenderer] Updating select:', field.name, '=', e.target.value);
                  updateAnswer(field.name, e.target.value);
                }}
                className="w-full p-3 rounded-lg bg-white bg-opacity-5 border-2 border-transparent focus:border-primary outline-none text-white transition-all"
              >
                <option value="">Auswählen...</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                id={idx === 0 ? 'answer-input' : undefined}
                type={field.type}
                value={answers[field.name] || ''}
                onChange={(e) => {
                  console.log('[QuestionRenderer] Updating input:', field.name, '=', e.target.value);
                  updateAnswer(field.name, e.target.value);
                }}
                onKeyDown={idx === 0 ? onKeyPress : undefined}
                placeholder={field.disabledIf && answers[field.disabledIf] ? field.placeholderIfDisabled : field.placeholder}
                disabled={field.disabledIf ? answers[field.disabledIf] : false}
                className="w-full p-3 rounded-lg bg-white bg-opacity-5 border-2 border-transparent focus:border-primary outline-none text-white transition-all disabled:opacity-50"
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  if (question.type === 'tag_input') {
    const tags = answer || [];
    return (
      <div>
        <TagInput
          tags={tags}
          onAdd={(tag) => updateAnswer(question.id, [...tags, tag])}
          onRemove={(index) => {
            const newTags = [...tags];
            newTags.splice(index, 1);
            updateAnswer(question.id, newTags);
          }}
          placeholder={question.placeholder}
        />
        <div className="text-xs text-text-secondary mt-2">
          {tags.length} hinzugefügt (min: {question.minItems || 1})
        </div>
      </div>
    );
  }

  if (question.type === 'checkbox_list') {
    const selected = answer || [];
    return (
      <div className="space-y-3">
        {question.options?.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <label
              key={option.value}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-primary bg-opacity-10 border-primary'
                  : 'bg-white bg-opacity-5 border-transparent hover:border-primary'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {
                  if (isSelected) {
                    updateAnswer(question.id, selected.filter((v: string) => v !== option.value));
                  } else if (selected.length < (question.maxItems || 99)) {
                    updateAnswer(question.id, [...selected, option.value]);
                  }
                }}
                className="w-5 h-5 accent-primary"
              />
              <span className="text-white font-medium">{option.label}</span>
            </label>
          );
        })}
        <div className="text-xs text-text-secondary mt-2">
          {selected.length} ausgewählt (min: {question.minItems}, max: {question.maxItems})
        </div>
      </div>
    );
  }

  if (question.type === 'select_from_previous') {
    const sourceData = answers[question.source || ''] || [];
    const selected = answer || [];
    return (
      <div className="space-y-3">
        {sourceData.map((item: string, index: number) => {
          const isSelected = selected.includes(item);
          return (
            <button
              key={index}
              onClick={() => {
                if (isSelected) {
                  updateAnswer(question.id, selected.filter((v: string) => v !== item));
                } else if (selected.length < (question.maxItems || 3)) {
                  updateAnswer(question.id, [...selected, item]);
                }
              }}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'bg-primary bg-opacity-10 border-primary'
                  : 'bg-white bg-opacity-5 border-transparent hover:border-primary'
              }`}
            >
              <span className="text-white font-medium">
                {isSelected && '✓ '}{item}
              </span>
            </button>
          );
        })}
        <div className="text-xs text-text-secondary mt-2">
          {selected.length} von {question.maxItems || 3} ausgewählt
        </div>
      </div>
    );
  }

  if (question.type === 'bullet_list') {
    const bullets = answer || [];
    return (
      <div className="space-y-3">
        {bullets.map((bullet: string, index: number) => (
          <div key={index} className="flex gap-3">
            <input
              type="text"
              value={bullet}
              onChange={(e) => {
                const newBullets = [...bullets];
                newBullets[index] = e.target.value;
                updateAnswer(question.id, newBullets);
              }}
              placeholder={question.placeholder}
              className="flex-1 p-3 rounded-lg bg-white bg-opacity-5 border-2 border-transparent focus:border-primary outline-none text-white transition-all"
            />
            <button
              onClick={() => {
                const newBullets = bullets.filter((_: any, i: number) => i !== index);
                updateAnswer(question.id, newBullets);
              }}
              className="p-3 rounded-lg bg-error bg-opacity-10 border-2 border-error border-opacity-30 text-error hover:bg-opacity-20 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        ))}
        {(!question.maxItems || bullets.length < question.maxItems) && (
          <button
            onClick={() => updateAnswer(question.id, [...bullets, ''])}
            className="w-full p-3 rounded-lg bg-primary bg-opacity-10 border-2 border-primary border-opacity-30 text-primary hover:bg-opacity-20 transition-all flex items-center justify-center gap-2 font-semibold"
          >
            <Plus size={20} />
            {question.addButtonText || 'Hinzufügen'}
          </button>
        )}
      </div>
    );
  }

  if (question.type === 'repeatable_list') {
    const items = answer || [];
    return (
      <div className="space-y-4">
        {items.map((item: any, index: number) => (
          <div key={index} className="p-4 rounded-xl bg-white bg-opacity-5 border border-white border-opacity-10">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white font-semibold">Eintrag {index + 1}</span>
              <button
                onClick={() => {
                  const newItems = items.filter((_: any, i: number) => i !== index);
                  updateAnswer(question.id, newItems);
                }}
                className="p-2 rounded-lg bg-error bg-opacity-10 border border-error border-opacity-30 text-error hover:bg-opacity-20 transition-all"
              >
                <X size={16} />
              </button>
            </div>
            {question.fields?.map((field) => (
              <div key={field.name} className="mb-3">
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={item[field.name] || ''}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[index] = { ...item, [field.name]: e.target.value };
                      updateAnswer(question.id, newItems);
                    }}
                    className="w-full p-2 rounded-lg bg-white bg-opacity-5 border-2 border-transparent focus:border-primary outline-none text-white text-sm transition-all"
                  >
                    <option value="">Auswählen...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={item[field.name] || ''}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[index] = { ...item, [field.name]: e.target.value };
                      updateAnswer(question.id, newItems);
                    }}
                    placeholder={field.placeholder}
                    className="w-full p-2 rounded-lg bg-white bg-opacity-5 border-2 border-transparent focus:border-primary outline-none text-white text-sm transition-all"
                  />
                )}
              </div>
            ))}
          </div>
        ))}
        <button
          onClick={() => {
            const newItem: any = {};
            question.fields?.forEach(f => newItem[f.name] = '');
            updateAnswer(question.id, [...items, newItem]);
          }}
          className="w-full p-4 rounded-lg bg-primary bg-opacity-10 border-2 border-primary border-opacity-30 text-primary hover:bg-opacity-20 transition-all flex items-center justify-center gap-2 font-semibold"
        >
          <Plus size={20} />
          {question.addButtonText || 'Hinzufügen'}
        </button>
      </div>
    );
  }

  if (question.type === 'loading_screen') {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-6">🎉</div>
        <div className="text-xl text-text-secondary mb-8">
          {question.progressMessages?.[0] || 'Verarbeite...'}
        </div>
        <div className="w-64 h-1 bg-white bg-opacity-10 rounded-full mx-auto overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: (question.duration || 5000) / 1000, ease: 'easeInOut' }}
          />
        </div>
      </div>
    );
  }

  return <div className="text-error">Unsupported question type: {question.type}</div>;
}

export default function AgentFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    agentState,
    updateAgentAnswer,
    nextQuestion,
    previousQuestion,
    nextSection: nextSectionStore,
    completeSection,
    skipSection,
    addEntry,
    resetAgent,
    resetToFirstQuestion,
    setCVData,
    setCurrentCVId,
    removeEntry,
    updateEntry,
    jumpToSection,
  } = useStore();

  const { markSectionCompleted, markSectionSkipped } = useAgentPersistence();

  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [completedSectionRef, setCompletedSectionRef] = useState<Section | null>(null);
  const [tokenBalance, setTokenBalance] = useState(3);
  const [showIntro, setShowIntro] = useState(false);
  const [showAddAnother, setShowAddAnother] = useState(false);
  const [currentEntryData, setCurrentEntryData] = useState<any>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const currentSection = agentSections[agentState.currentSection];
  const currentQuestion = currentSection?.questions[agentState.currentQuestion];

  const totalSteps = calculateTotalSteps();
  const currentStepNumber = calculateCurrentStep();
  const progressPercent = (currentStepNumber / totalSteps) * 100;

  const SectionIcon = currentSection?.icon ? iconMap[currentSection.icon] : Sparkles;

  useEffect(() => {
    const sectionParam = searchParams.get('section');
    if (sectionParam) {
      jumpToSection(sectionParam);
    } else {
      resetAgent();
    }
    loadTokenBalance();
  }, []);

  const loadTokenBalance = async () => {
    try {
      const settings = await dbService.getUserSettings();
      if (settings) {
        setTokenBalance(settings.token_balance);
      }
    } catch (error) {
      console.error('Failed to load token balance:', error);
    }
  };

  useEffect(() => {
    if (currentSection?.introQuestion && agentState.currentQuestion === 0) {
      setShowIntro(true);
    } else {
      setShowIntro(false);
    }
  }, [agentState.currentSection, agentState.currentQuestion]);

  // Reset showAddAnother when section changes
  useEffect(() => {
    setShowAddAnother(false);
  }, [agentState.currentSection]);

  useEffect(() => {
    const input = document.getElementById('answer-input');
    if (input && !isTransitioning) {
      setTimeout(() => input.focus(), 100);
    }
  }, [agentState.currentQuestion, agentState.currentSection, isTransitioning, showIntro, showAddAnother]);

  function calculateTotalSteps(): number {
    return agentSections.reduce((total, section) => {
      if (section.optional) return total + 1;
      return total + (section.totalQuestions || section.questions.length);
    }, 0);
  }

  function calculateCurrentStep(): number {
    let step = 0;
    for (let i = 0; i < agentState.currentSection; i++) {
      const section = agentSections[i];
      step += section.totalQuestions || section.questions.length;
    }
    step += agentState.currentQuestion + 1;
    return step;
  }

  function validateCurrentQuestion(): boolean {
    // TESTING MODE: All fields are optional for testing purposes
    return true;

    /* Original validation (disabled for testing)
    if (showIntro || showAddAnother || showCompletionMessage) return true;
    if (!currentQuestion) return false;
    if (!currentQuestion.required) return true;

    const answer = agentState.answers[currentQuestion.id];

    if (currentQuestion.type === 'text' || currentQuestion.type === 'textarea') {
      return !!answer && answer.trim().length > 0;
    }

    if (currentQuestion.type === 'multi_input') {
      if (!currentQuestion.fields) return false;
      return currentQuestion.fields.filter(f => f.required).every(f => {
        const val = agentState.answers[f.name] || currentEntryData[f.name];
        if (f.type === 'checkbox') return true;
        return val && val.toString().trim().length > 0;
      });
    }

    if (currentQuestion.type === 'date_range') {
      if (!currentQuestion.fields) return false;
      return currentQuestion.fields.filter(f => f.required).every(f => {
        const val = agentState.answers[f.name] || currentEntryData[f.name];
        if (f.disabledIf && agentState.answers[f.disabledIf]) return true;
        return val && val.toString().trim().length > 0;
      });
    }

    if (currentQuestion.type === 'tag_input') {
      const tags = answer || [];
      return tags.length >= (currentQuestion.minItems || 1);
    }

    if (currentQuestion.type === 'checkbox_list') {
      const selected = answer || [];
      return selected.length >= (currentQuestion.minItems || 1);
    }

    if (currentQuestion.type === 'select_from_previous') {
      const selected = answer || [];
      return selected.length >= (currentQuestion.minItems || 1);
    }

    if (currentQuestion.type === 'bullet_list') {
      const bullets = answer || [];
      return bullets.length >= (currentQuestion.minItems || 1) && bullets.every((b: string) => b.trim().length > 0);
    }

    if (currentQuestion.type === 'repeatable_list') {
      const items = answer || [];
      return items.length >= (currentQuestion.minItems || 1);
    }

    return true;
    */
  }

  const handleNext = async () => {
    if (isProcessing) {
      return;
    }

    if (!validateCurrentQuestion()) {
      const input = document.getElementById('answer-input');
      if (input) {
        input.classList.add('animate-shake');
        setTimeout(() => input.classList.remove('animate-shake'), 500);
      }
      return;
    }

    console.log('[AgentFlow:handleNext] Current Section:', currentSection?.id, 'Question:', currentQuestion?.id);
    console.log('[AgentFlow:handleNext] Current Answers:', agentState.answers);

    setIsProcessing(true);

    if (currentQuestion?.feedback) {
      setFeedbackText(currentQuestion.feedback);
      setShowFeedback(true);
      setIsTransitioning(true);

      setTimeout(() => {
        setShowFeedback(false);
        proceedToNext();
      }, 1200);
    } else {
      setIsTransitioning(true);
      setTimeout(() => {
        proceedToNext();
      }, 300);
    }
  };

  const proceedToNext = () => {
    if (showIntro) {
      setShowIntro(false);
      nextQuestion();
      setIsTransitioning(false);
      setIsProcessing(false);
      return;
    }

    if (showCompletionMessage) {
      setShowCompletionMessage(false);
      nextSectionStore();
      setIsTransitioning(false);
      setIsProcessing(false);
      return;
    }

    if (showAddAnother) {
      finishSection();
      return;
    }

    if (currentQuestion?.type === 'loading_screen') {
      setTimeout(async () => {
        await finishAgent();
        setIsProcessing(false);
      }, currentQuestion.duration || 5000);
      return;
    }

    if (currentSection.repeatable && currentQuestion) {
      setCurrentEntryData({
        ...currentEntryData,
        [currentQuestion.id]: agentState.answers[currentQuestion.id],
      });
    }

    if (agentState.currentQuestion >= currentSection.questions.length - 1) {
      if (currentSection.repeatable && currentSection.addAnotherQuestion) {
        saveCurrentEntry();
        setShowAddAnother(true);
      } else {
        finishSection();
      }
    } else {
      nextQuestion();
    }

    setIsTransitioning(false);
    setIsProcessing(false);
  };

  const handleBack = () => {
    if (showCompletionMessage) {
      setShowCompletionMessage(false);
      return;
    }

    if (showAddAnother) {
      setShowAddAnother(false);
      return;
    }

    if (showIntro) {
      return;
    }

    if (agentState.currentQuestion > 0) {
      previousQuestion();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && currentQuestion?.type !== 'textarea') {
      e.preventDefault();
      if (!isProcessing) {
        handleNext();
      }
    }
    if (e.key === 'Backspace' && agentState.currentQuestion > 0 && !agentState.answers[currentQuestion?.id || '']) {
      e.preventDefault();
      handleBack();
    }
  };

  const saveCurrentEntry = () => {
    const entry: any = {};

    currentSection.questions.forEach(q => {
      if (q.type === 'multi_input' || q.type === 'date_range') {
        q.fields?.forEach(field => {
          const value = agentState.answers[field.name] || currentEntryData[field.name];
          if (value !== undefined && value !== null && value !== '') {
            entry[field.name] = value;
          }
        });
      } else {
        const value = agentState.answers[q.id] || currentEntryData[q.id];
        if (value !== undefined && value !== null && value !== '') {
          entry[q.id] = value;
        }
      }
    });

    console.log('[saveCurrentEntry] Built entry for section', currentSection.id, ':', entry);
    addEntry(currentSection.id, entry);

    currentSection.questions.forEach(q => {
      if (q.type === 'multi_input' || q.type === 'date_range') {
        q.fields?.forEach(field => {
          updateAgentAnswer(field.name, undefined);
        });
      } else {
        updateAgentAnswer(q.id, undefined);
      }
    });
    setCurrentEntryData({});
  };

  const handleAddAnother = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setShowAddAnother(false);
    resetToFirstQuestion();
    setIsTransitioning(false);
    setIsProcessing(false);
  };

  const finishSection = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const entries = agentState.entries[currentSection.id] || [];
    let summary = '';

    if (currentSection.completionSummary) {
      const count = entries.length;
      const plural = count > 1 ? 'e' : '';
      summary = currentSection.completionSummary
        .replace('{count}', count.toString())
        .replace('{plural}', plural);
    }

    const sectionResponses: Record<string, any> = {};
    if (currentSection.repeatable) {
      sectionResponses.entries = entries;
    } else {
      currentSection.questions.forEach(q => {
        if (agentState.answers[q.id] !== undefined) {
          sectionResponses[q.id] = agentState.answers[q.id];
        }
      });
    }

    await markSectionCompleted(currentSection.id, sectionResponses);
    completeSection(currentSection.id, currentSection.name, summary);
    setCompletedSectionRef(currentSection);
    setShowCompletionMessage(true);

    setTimeout(() => {
      setShowCompletionMessage(false);
      setCompletedSectionRef(null);
      nextSectionStore();
      setIsProcessing(false);
    }, 1500);
  };

  const handleSkipSection = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    await markSectionSkipped(currentSection.id);
    skipSection(currentSection.id, currentSection.name);
    nextSectionStore();
    setIsProcessing(false);
  };

  const handleIntroButton = (action: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    if (action === 'start_section') {
      setShowIntro(false);
      nextQuestion();
      setIsProcessing(false);
    } else if (action === 'skip_section') {
      handleSkipSection();
    }
  };

  const finishAgent = async () => {
    console.log('[AgentFlow:finishAgent] Starting finishAgent');
    console.log('[AgentFlow:finishAgent] All answers:', JSON.stringify(agentState.answers, null, 2));
    console.log('[AgentFlow:finishAgent] Wunschstellen-Daten:');
    console.log('  - position:', agentState.answers.position);
    console.log('  - firma:', agentState.answers.firma);
    console.log('  - beschreibung:', agentState.answers.beschreibung);

    const cvData = buildCVData();
    setCVData(cvData);

    try {
      const responses = await dbService.getAgentResponses();

      const mappedData = mapCVDataForDatabase(cvData);

      const hardSkills = agentState.answers.hard_skills || [];
      const softSkills = agentState.answers.soft_skills || [];
      const topSkills = agentState.answers.top_skills || [];

      await dbService.saveAgentDataToBaseData({
        contact: cvData.contact,
        bildung: cvData.education,
        berufserfahrung: cvData.experience,
        skills: {
          hard: hardSkills,
          soft: softSkills,
          top: topSkills,
        },
        projekte: cvData.projects,
        sprachen: cvData.languages,
        zertifikate: cvData.certificates,
        zusaetzlich: cvData.additional,
      });

      const rolle = agentState.answers.position || '';
      const unternehmen = agentState.answers.firma || '';
      const stellenbeschreibung = agentState.answers.beschreibung || null;

      if (!rolle || !unternehmen) {
        console.error('[AgentFlow:finishAgent] FEHLER: Wunschstellen-Daten fehlen!');
        console.error('  - rolle:', rolle);
        console.error('  - unternehmen:', unternehmen);
        alert('Fehler: Wunschstelle und Firma müssen ausgefüllt sein.');
        setIsProcessing(false);
        return;
      }

      const jobAppData = {
        vorname: cvData.contact.vorname,
        nachname: cvData.contact.nachname,
        email: cvData.contact.email,
        telefon: cvData.contact.telefon,
        ort: cvData.contact.ort,
        plz: cvData.contact.plz,
        linkedin: cvData.contact.linkedin,
        website: cvData.contact.website,
        bildung_entries: cvData.education,
        berufserfahrung_entries: cvData.experience,
        projekte_entries: cvData.projects,
        sprachen_list: cvData.languages,
        zertifikate_entries: cvData.certificates,
        hard_skills: hardSkills,
        soft_skills: softSkills,
        top_skills: topSkills,
        zusaetzliche_infos: cvData.additional,
        rolle: rolle,
        unternehmen: unternehmen,
        stellenbeschreibung: stellenbeschreibung,
        berufserfahrung_entries_optimiert: null,
        projekte_entries_optimiert: null,
        skills_optimiert: null,
        profile_summary: null,
        sales: null,
        optimized_cv_html: null,
        status: 'entwurf',
      };

      console.log('[AgentFlow:finishAgent] Creating job application with data:', JSON.stringify(jobAppData, null, 2));

      const createdJobApp = await dbService.createJobApplication(jobAppData);

      if (createdJobApp?.id) {
        console.log('[AgentFlow:finishAgent] Job application created successfully with ID:', createdJobApp.id);
        setCurrentCVId(createdJobApp.id);
      } else {
        console.error('[AgentFlow:finishAgent] Job application created but no ID returned');
      }
    } catch (error) {
      console.error('[AgentFlow:finishAgent] Failed to save CV to database:', error);
      alert('Fehler beim Speichern der Daten. Bitte versuche es erneut.');
      setIsProcessing(false);
      return;
    }

    navigate('/result');
  };

  function buildCVData(): any {
    const hardSkills = agentState.answers.hard_skills || [];
    const softSkills = agentState.answers.soft_skills || [];
    const topSkills = agentState.answers.top_skills || [];
    const allSkills = [...new Set([...hardSkills, ...softSkills, ...topSkills])];

    const berufserfahrungEntries = (agentState.entries.berufserfahrung || []).map((entry: any) => ({
      position: entry.position,
      firma: entry.firma,
      von: entry.von,
      bis: entry.bis,
      aktuell: entry.aktuell,
      aufgaben: entry.aufgaben || '',
      industry: entry.industry || '',
      roleLevel: entry.roleLevel || '',
      teamSize: entry.teamSize || '',
      budget: entry.budget || '',
      revenue: entry.revenue || '',
      customersMarket: entry.kontext_markt || '',
      bullets: Array.isArray(entry.erfolge)
        ? entry.erfolge.filter((erfolg: string) => erfolg.trim().length > 0)
        : (entry.erfolge
          ? entry.erfolge.split('\n').filter((line: string) => line.trim().length > 0)
          : (entry.bullets || [])),
    }));

    return {
      contact: {
        vorname: agentState.answers.vorname,
        nachname: agentState.answers.nachname,
        email: agentState.answers.email,
        telefon: agentState.answers.telefon,
        ort: agentState.answers.ort,
        plz: agentState.answers.plz,
        linkedin: agentState.answers.linkedin,
        website: agentState.answers.website,
      },
      education: agentState.entries.bildung || [],
      experience: berufserfahrungEntries,
      skills: allSkills,
      projects: agentState.entries.projekte || [],
      languages: agentState.answers.sprachen_list || [],
      certificates: agentState.entries.zertifikate || [],
      additional: agentState.answers.zusaetzlich,
    };
  }

  if (!currentSection || !currentQuestion) {
    return <div>Loading...</div>;
  }

  const canGoBack = !isProcessing && (agentState.currentQuestion > 0 || showAddAnother || showCompletionMessage);
  const canGoNext = !isProcessing && validateCurrentQuestion();

  const handleDeleteEntry = async (sectionId: string, entryIndex: number) => {
    try {
      const currentEntries = agentState.entries[sectionId] || [];
      const updatedEntries = currentEntries.filter((_, index) => index !== entryIndex);

      removeEntry(sectionId, entryIndex);

      await dbService.updateAgentResponse(sectionId, updatedEntries);
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const handleEditEntry = async (sectionId: string, entryIndex: number, updatedData: any) => {
    try {
      updateEntry(sectionId, entryIndex, updatedData);

      const updatedEntries = agentState.entries[sectionId] || [];
      const newEntries = updatedEntries.map((entry, index) =>
        index === entryIndex ? { ...entry, ...updatedData } : entry
      );

      await dbService.updateAgentResponse(sectionId, newEntries);
    } catch (error) {
      console.error('Failed to update entry:', error);
    }
  };

  const handleAddEntry = async (sectionId: string, newEntry: any) => {
    try {
      addEntry(sectionId, newEntry);

      const updatedEntries = [...(agentState.entries[sectionId] || []), newEntry];
      await dbService.updateAgentResponse(sectionId, updatedEntries);
    } catch (error) {
      console.error('Failed to add entry:', error);
    }
  };

  const totalEntries =
    (agentState.entries.berufserfahrung?.length || 0) +
    (agentState.entries.bildung?.length || 0) +
    (agentState.entries.projekte?.length || 0) +
    (agentState.entries.zertifikate?.length || 0);

  const shouldShowPanel = agentState.currentSection >= 1 && agentState.currentSection < 7;

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      {/* Fixed Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-dark-card bg-opacity-95 backdrop-blur-sm border-b border-white border-opacity-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="mb-2">
            <div className="w-full bg-dark-bg rounded-full h-1 overflow-hidden">
              <motion.div
                className="bg-primary h-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              Sektion {currentSection.number}/{agentSections.length}
            </span>
            <span className="text-text-secondary flex items-center gap-2">
              {SectionIcon && <SectionIcon size={16} />}
              {currentSection.name}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-24 pb-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {showFeedback ? (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="text-6xl mb-4"
                >
                  {feedbackText.split(' ')[0]}
                </motion.div>
                <div className="text-2xl font-semibold text-primary">
                  {feedbackText.substring(feedbackText.indexOf(' ') + 1)}
                </div>
              </motion.div>
            ) : showCompletionMessage && completedSectionRef ? (
              <motion.div
                key="completion"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <CheckCircle size={64} className="text-primary mx-auto mb-6" />
                </motion.div>
                <h2 className="text-3xl font-bold mb-4">
                  {completedSectionRef.completionMessage}
                </h2>
                <p className="text-text-secondary">Weiter zu: {completedSectionRef.nextSection}</p>
              </motion.div>
            ) : (
              <motion.div
                key={`${agentState.currentSection}-${agentState.currentQuestion}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                {/* Section Icon */}
                <div className="text-center mb-12">
                  {SectionIcon && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="inline-block mb-6"
                    >
                      <SectionIcon className="text-primary" size={48} />
                    </motion.div>
                  )}

                  {/* Question Title */}
                  <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-3xl md:text-4xl font-semibold mb-4 leading-tight"
                  >
                    {showIntro && currentSection.introQuestion
                      ? currentSection.introQuestion.question
                      : showAddAnother && currentSection.addAnotherQuestion
                      ? currentSection.addAnotherQuestion.question
                      : currentQuestion?.question}
                  </motion.h1>

                  {/* Hint */}
                  {!showIntro && !showAddAnother && currentQuestion?.hint && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-warning text-sm"
                    >
                      {currentQuestion.hint}
                    </motion.p>
                  )}
                </div>

                {/* Question Content */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="mb-6"
                >
                  {showIntro && currentSection.introQuestion ? (
                    <IntroButtons
                      buttons={currentSection.introQuestion.buttons}
                      onAction={handleIntroButton}
                    />
                  ) : showAddAnother && currentSection.addAnotherQuestion ? (
                    <AddAnotherContent
                      addAnotherQuestion={currentSection.addAnotherQuestion}
                      entries={agentState.entries[currentSection.id] || []}
                      onAction={(action) => {
                        if (action === 'add_entry') handleAddAnother();
                        else if (action === 'complete_section') finishSection();
                      }}
                    />
                  ) : (
                    <QuestionRenderer
                      question={currentQuestion!}
                      onKeyPress={handleKeyPress}
                      answers={agentState.answers}
                      updateAnswer={updateAgentAnswer}
                    />
                  )}
                </motion.div>

                {/* Navigation Buttons */}
                {!showCompletionMessage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-between"
                  >
                    <button
                      onClick={handleBack}
                      disabled={!canGoBack}
                      className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={!canGoBack && agentState.currentQuestion === 0 && !showAddAnother && !showCompletionMessage ? 'Abgeschlossene Sektionen können nicht bearbeitet werden' : ''}
                    >
                      <ArrowLeft size={20} />
                      <span>Zurück</span>
                    </button>

                    <button
                      onClick={handleNext}
                      disabled={!canGoNext}
                      className="flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary-hover rounded-lg font-semibold transition-all button-shadow hover-glow disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        pointerEvents: isProcessing ? 'none' : 'auto'
                      }}
                    >
                      {isProcessing ? (
                        <>
                          <span>Verarbeite...</span>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </>
                      ) : (
                        <>
                          <span>Weiter</span>
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                  </motion.div>
                )}

                {/* Keyboard Hint */}
                {!showIntro && currentQuestion?.type !== 'textarea' && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center text-text-secondary text-sm mt-6"
                  >
                    Drücke <kbd className="px-2 py-1 bg-white bg-opacity-10 rounded">Enter ↵</kbd> um fortzufahren
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>

      {shouldShowPanel && (
        <>
          <AgentProgressTrigger
            totalEntries={totalEntries}
            onClick={() => setIsPanelOpen(true)}
            isOpen={isPanelOpen}
          />
          <AgentProgressPanel
            isOpen={isPanelOpen}
            onClose={() => setIsPanelOpen(false)}
            entries={{
              berufserfahrung: agentState.entries.berufserfahrung || [],
              bildung: agentState.entries.bildung || [],
              projekte: agentState.entries.projekte || [],
              zertifikate: agentState.entries.zertifikate || [],
            }}
            onDeleteEntry={handleDeleteEntry}
            onEditEntry={handleEditEntry}
            onAddEntry={handleAddEntry}
          />
        </>
      )}
    </div>
  );

  function IntroButtons({ buttons, onAction }: any) {
    return (
      <div className="grid gap-4">
        {buttons.map((button: any, idx: number) => (
          <button
            key={idx}
            onClick={() => onAction(button.action)}
            disabled={isProcessing}
            className={`p-6 rounded-xl border-2 transition-all flex items-center justify-center gap-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
              button.style === 'primary'
                ? 'bg-primary hover:bg-primary-hover border-primary text-white'
                : 'bg-white bg-opacity-5 border-white border-opacity-20 hover:border-primary hover:bg-primary hover:bg-opacity-10 text-white'
            }`}
          >
            {button.text}
          </button>
        ))}
      </div>
    );
  }

  function AddAnotherContent({ addAnotherQuestion, entries, onAction }: any) {
    return (
      <div>
        {addAnotherQuestion.showEntriesBefore && entries.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-white bg-opacity-5 border border-white border-opacity-10">
            <div className="text-sm font-semibold text-text-secondary mb-3">Bereits hinzugefügt:</div>
            {entries.map((entry: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-white mb-2">
                <CheckCircle size={16} className="text-primary" />
                {formatEntryPreview(entry, addAnotherQuestion.entryPreviewFormat || '')}
              </div>
            ))}
          </div>
        )}
        <div className="grid gap-4">
          {addAnotherQuestion.buttons.map((button: any, idx: number) => (
            <button
              key={idx}
              onClick={() => onAction(button.action)}
              disabled={isProcessing}
              className={`p-6 rounded-xl border-2 transition-all flex items-center justify-center gap-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                button.style === 'primary'
                  ? 'bg-primary hover:bg-primary-hover border-primary text-white'
                  : 'bg-white bg-opacity-5 border-white border-opacity-20 hover:border-text-secondary text-white'
              }`}
            >
              {button.text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function formatEntryPreview(entry: any, format: string): string {
    let preview = format;
    Object.keys(entry).forEach(key => {
      preview = preview.replace(`{${key}}`, entry[key] || '');
    });
    return preview;
  }
}
