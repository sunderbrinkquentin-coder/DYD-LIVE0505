import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User,
  GraduationCap,
  Briefcase,
  Star,
  Award,
  Globe,
  Folder,
  PlusCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  X,
} from 'lucide-react';
import { useStore } from '../store/useStore';

interface Question {
  id: string;
  question: string;
  placeholder?: string;
  type: 'text' | 'email' | 'url' | 'textarea' | 'yes_no' | 'tags' | 'date_range';
  required: boolean;
  hint?: string;
  feedback?: string;
  skipText?: string;
}

interface Section {
  id: string;
  title: string;
  icon: typeof User;
  questions: Question[];
}

const sections: Section[] = [
  {
    id: 'kontakt',
    title: 'Kontaktinformationen',
    icon: User,
    questions: [
      {
        id: 'name',
        question: 'Wie lautet dein vollständiger Name?',
        placeholder: 'Vorname Nachname',
        type: 'text',
        required: true,
      },
      {
        id: 'email',
        question: 'Welche E-Mail-Adresse sollen Recruiter verwenden?',
        placeholder: 'deine@email.de',
        type: 'email',
        required: true,
      },
      {
        id: 'location',
        question: 'In welchem Ort bist du aktuell?',
        placeholder: 'z.B. München',
        type: 'text',
        required: true,
      },
      {
        id: 'linkedin',
        question: 'Hast du ein LinkedIn-Profil?',
        placeholder: 'https://linkedin.com/in/...',
        type: 'url',
        required: false,
        skipText: 'Kein LinkedIn-Profil',
      },
    ],
  },
  {
    id: 'bildung',
    title: 'Bildungsweg',
    icon: GraduationCap,
    questions: [
      {
        id: 'institution',
        question: 'Welche Bildungseinrichtung hast du besucht?',
        placeholder: 'z.B. Technische Universität München',
        type: 'text',
        required: true,
      },
      {
        id: 'degree',
        question: 'Welchen Abschluss hast du gemacht?',
        placeholder: 'z.B. Bachelor of Science Informatik',
        type: 'text',
        required: true,
      },
      {
        id: 'timeframe',
        question: 'Von wann bis wann?',
        placeholder: 'MM/YYYY - MM/YYYY',
        type: 'text',
        required: true,
      },
    ],
  },
  {
    id: 'berufserfahrung',
    title: 'Berufserfahrung',
    icon: Briefcase,
    questions: [
      {
        id: 'company',
        question: 'In welchem Unternehmen warst du tätig?',
        placeholder: 'z.B. BMW AG',
        type: 'text',
        required: true,
        feedback: '💡 Super!',
      },
      {
        id: 'position',
        question: 'Was war deine Position?',
        placeholder: 'z.B. Senior Product Manager',
        type: 'text',
        required: true,
        feedback: '👍 Perfekt!',
      },
      {
        id: 'tasks',
        question: 'Was waren deine Hauptaufgaben?',
        placeholder: 'z.B. Leitung von cross-funktionalen Produktteams...',
        type: 'textarea',
        required: true,
        hint: '💡 Tipp: Beschreibe deine täglichen Verantwortlichkeiten',
      },
      {
        id: 'achievements',
        question: 'Welche konkreten Ergebnisse hast du erzielt?',
        placeholder: 'z.B. Umsatzsteigerung um 25%, Effizienz um 30% verbessert...',
        type: 'textarea',
        required: true,
        hint: '💡 Tipp: Nutze wenn möglich Zahlen und KPIs',
        feedback: '🎯 Großartig! Zahlen machen den Unterschied!',
      },
    ],
  },
  {
    id: 'skills',
    title: 'Skills & Kompetenzen',
    icon: Star,
    questions: [
      {
        id: 'skills',
        question: 'Welche Fachkompetenzen, Tools oder Methoden beherrschst du?',
        placeholder: 'z.B. Projektmanagement, Python, React...',
        type: 'textarea',
        required: true,
      },
    ],
  },
  {
    id: 'sprachen',
    title: 'Sprachen',
    icon: Globe,
    questions: [
      {
        id: 'languages',
        question: 'Welche Sprachen sprichst du und wie gut?',
        placeholder: 'z.B. Deutsch (Muttersprache), Englisch (Fließend)',
        type: 'textarea',
        required: true,
      },
    ],
  },
];

export default function AIChat() {
  const navigate = useNavigate();
  const { updateCVSection } = useStore();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentSection = sections[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];
  const totalQuestions = sections.reduce((acc, section) => acc + section.questions.length, 0);
  const answeredQuestions = Object.keys(answers).length;
  const progress = (answeredQuestions / totalQuestions) * 100;

  useEffect(() => {
    const input = document.getElementById('answer-input');
    if (input && !isTransitioning) {
      setTimeout(() => input.focus(), 100);
    }
  }, [currentQuestionIndex, currentSectionIndex, isTransitioning]);

  const handleNext = () => {
    if (currentQuestion.required && !answer.trim()) {
      setError('Dieses Feld ist erforderlich');
      const input = document.getElementById('answer-input');
      if (input) {
        input.classList.add('animate-shake');
        setTimeout(() => input.classList.remove('animate-shake'), 500);
      }
      return;
    }

    setError('');
    setAnswers({ ...answers, [`${currentSection.id}_${currentQuestion.id}`]: answer });

    if (currentQuestion.feedback) {
      setFeedbackText(currentQuestion.feedback);
      setShowFeedback(true);
      setIsTransitioning(true);

      setTimeout(() => {
        setShowFeedback(false);
        moveToNextQuestion();
      }, 1200);
    } else {
      setIsTransitioning(true);
      setTimeout(() => {
        moveToNextQuestion();
      }, 300);
    }
  };

  const moveToNextQuestion = () => {
    setAnswer('');

    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentQuestionIndex(0);
    } else {
      updateCVSection('all', answers);
      navigate('/processing');
      return;
    }

    setIsTransitioning(false);
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const prevKey = `${currentSection.id}_${currentSection.questions[currentQuestionIndex - 1].id}`;
      setAnswer(answers[prevKey] || '');
    } else if (currentSectionIndex > 0) {
      const prevSection = sections[currentSectionIndex - 1];
      setCurrentSectionIndex(currentSectionIndex - 1);
      setCurrentQuestionIndex(prevSection.questions.length - 1);
      const prevKey = `${prevSection.id}_${prevSection.questions[prevSection.questions.length - 1].id}`;
      setAnswer(answers[prevKey] || '');
    }
    setError('');
  };

  const handleSkip = () => {
    setAnswer('');
    handleNext();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && currentQuestion.type !== 'textarea') {
      e.preventDefault();
      handleNext();
    }
    if (e.key === 'Backspace' && !answer && (currentQuestionIndex > 0 || currentSectionIndex > 0)) {
      e.preventDefault();
      handleBack();
    }
  };

  const SectionIcon = currentSection?.icon;

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      <div className="fixed top-0 left-0 right-0 z-50 bg-dark-card bg-opacity-95 backdrop-blur-sm border-b border-white border-opacity-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="mb-2">
            <div className="w-full bg-dark-bg rounded-full h-1 overflow-hidden">
              <motion.div
                className="bg-primary h-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              Sektion {currentSectionIndex + 1}/{sections.length}
            </span>
            <span className="text-text-secondary flex items-center gap-2">
              {SectionIcon && <SectionIcon size={16} />}
              {currentSection?.title}
            </span>
          </div>
        </div>
      </div>

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
            ) : (
              <motion.div
                key={`${currentSectionIndex}-${currentQuestionIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
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
                  <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-3xl md:text-4xl font-semibold mb-4 leading-tight"
                  >
                    {currentQuestion?.question}
                  </motion.h1>
                  {currentQuestion?.hint && (
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

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="mb-6"
                >
                  {currentQuestion?.type === 'textarea' ? (
                    <textarea
                      id="answer-input"
                      value={answer}
                      onChange={(e) => {
                        setAnswer(e.target.value);
                        setError('');
                      }}
                      onKeyDown={handleKeyPress}
                      placeholder={currentQuestion.placeholder}
                      className={`w-full p-4 rounded-xl bg-white bg-opacity-5 border-2 ${
                        error
                          ? 'border-error'
                          : 'border-transparent focus:border-primary'
                      } outline-none text-white text-lg resize-vertical transition-all`}
                      rows={4}
                      maxLength={500}
                    />
                  ) : currentQuestion?.type === 'yes_no' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => {
                          setAnswer('Ja');
                          setTimeout(handleNext, 100);
                        }}
                        className="p-6 rounded-xl bg-white bg-opacity-5 border-2 border-transparent hover:border-primary hover:bg-primary hover:bg-opacity-10 transition-all flex flex-col items-center gap-3"
                      >
                        <CheckCircle size={32} className="text-primary" />
                        <span className="text-xl font-semibold">Ja</span>
                      </button>
                      <button
                        onClick={() => {
                          setAnswer('Nein');
                          setTimeout(handleNext, 100);
                        }}
                        className="p-6 rounded-xl bg-white bg-opacity-5 border-2 border-transparent hover:border-text-secondary hover:bg-white hover:bg-opacity-5 transition-all flex flex-col items-center gap-3"
                      >
                        <X size={32} className="text-text-secondary" />
                        <span className="text-xl font-semibold">Nein</span>
                      </button>
                    </div>
                  ) : (
                    <input
                      id="answer-input"
                      type={currentQuestion?.type === 'email' ? 'email' : currentQuestion?.type === 'url' ? 'url' : 'text'}
                      value={answer}
                      onChange={(e) => {
                        setAnswer(e.target.value);
                        setError('');
                      }}
                      onKeyDown={handleKeyPress}
                      placeholder={currentQuestion?.placeholder}
                      className={`w-full p-4 rounded-xl bg-white bg-opacity-5 border-2 ${
                        error
                          ? 'border-error'
                          : 'border-transparent focus:border-primary'
                      } outline-none text-white text-lg transition-all focus:shadow-lg focus:shadow-primary focus:shadow-opacity-20`}
                    />
                  )}
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-error text-sm mt-2 flex items-center gap-2"
                    >
                      <span>⚠</span> {error}
                    </motion.p>
                  )}
                  {currentQuestion?.type === 'textarea' && (
                    <div className="text-xs text-text-secondary text-right mt-2">
                      {answer.length}/500
                    </div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-between"
                >
                  <button
                    onClick={handleBack}
                    disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
                    className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft size={20} />
                    <span>Zurück</span>
                  </button>

                  <div className="flex items-center gap-4">
                    {!currentQuestion?.required && currentQuestion?.skipText && (
                      <button
                        onClick={handleSkip}
                        className="text-text-secondary hover:text-white underline transition-colors text-sm"
                      >
                        {currentQuestion.skipText}
                      </button>
                    )}
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary-hover rounded-lg font-semibold transition-all button-shadow hover-glow"
                    >
                      <span>
                        {currentSectionIndex === sections.length - 1 &&
                        currentQuestionIndex === currentSection.questions.length - 1
                          ? 'Fertig'
                          : 'Weiter'}
                      </span>
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </motion.div>

                {currentQuestion?.type !== 'textarea' && (
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
    </div>
  );
}
