import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Download,
  FileText,
  Edit,
  Flame,
  ArrowRight,
  Crown,
  Check,
  Target,
  ListChecks,
  Wand,
  Bell,
  Eye,
  X,
  Plus,
  Minus,
  UserCircle,
  User,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import Button from '../components/Button';
import RegisterModal from '../components/RegisterModal';
import PhotoUpload from '../components/PhotoUpload';
import StickyBanner from '../components/StickyBanner';
import {
  ModernTemplate,
  AzubiTemplate,
  UniTemplate,
  BeratungTemplate,
  FinanceTemplate,
} from '../components/CVTemplates';
import { authService } from '../services/authService';
import { dataMigrationService } from '../services/dataMigrationService';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { downloadAsPDF } from '../utils/pdfExport.tsx';
// import { downloadAsDOCX } from '../utils/docxExport';

interface Template {
  id: 'modern' | 'azubi' | 'uni' | 'beratung' | 'finance';
  label: string;
  icon: typeof Sparkles;
}

const templates: Template[] = [
  { id: 'modern', label: 'Modern', icon: Sparkles },
  { id: 'azubi', label: 'Azubi', icon: Briefcase },
  { id: 'uni', label: 'Universität', icon: GraduationCap },
  { id: 'beratung', label: 'Beratung', icon: TrendingUp },
  { id: 'finance', label: 'Finance', icon: TrendingUp },
];

const jobMatches = [
  {
    company: 'BMW AG',
    position: 'Senior Product Manager',
    location: 'München',
    salary: '70-85k',
    matchLocked: true,
  },
  {
    company: 'SAP',
    position: 'Product Manager',
    location: 'Walldorf',
    salary: '65-80k',
    matchLocked: true,
  },
];

const sampleCVData = {
  name: 'Max Mustermann',
  jobTitle: 'Product Manager',
  email: 'max@example.com',
  phone: '+49 123 456789',
  location: 'München',
  address: '123 Hauptstraße, 80331 München, Deutschland',
  profile:
    'Erfahrener Product Manager mit 5+ Jahren Expertise in der digitalen Produktentwicklung. Spezialisiert auf agile Methoden, User-Research und datengetriebene Entscheidungen. Nachweisliche Erfolge in der Skalierung von SaaS-Produkten und Cross-funktionaler Teamführung.',
  experience: [
    {
      position: 'Senior Product Manager',
      company: 'TechCorp GmbH',
      timeframe: '2020 - Heute',
      groupName: 'Digital Products Team',
      bullets: [
        'Leitung der Produktstrategie für B2B SaaS-Plattform mit 50.000+ Nutzern',
        'Steigerung der User-Retention um 35% durch datengetriebene Features',
        'Management von 3 cross-funktionalen Teams (Engineering, Design, Data)',
      ],
      selectedExperience: [
        {
          title: 'Enterprise Dashboard Redesign',
          description:
            'Led complete overhaul of analytics dashboard, resulting in 45% increase in daily active users and 30% reduction in support tickets',
        },
        {
          title: 'AI Integration Initiative',
          description:
            'Spearheaded integration of machine learning features for predictive analytics, driving 25% increase in customer satisfaction scores',
        },
      ],
    },
    {
      position: 'Product Manager',
      company: 'StartupXYZ',
      timeframe: '2018 - 2020',
      groupName: 'Mobile Innovation',
      bullets: [
        'Entwicklung und Launch von Mobile App (iOS & Android)',
        'Durchführung von 100+ User-Interviews und A/B-Tests',
        'Erreichen von Product-Market-Fit innerhalb von 18 Monaten',
      ],
      selectedExperience: [
        {
          title: 'Mobile App Launch',
          description:
            'Successfully launched mobile application from concept to market, achieving 50k downloads in first quarter',
        },
      ],
    },
  ],
  education: [
    {
      degree: 'M.Sc. Wirtschaftsinformatik',
      institution: 'TU München',
      timeframe: '2015 - 2018',
      city: 'München',
      country: 'Deutschland',
      details: 'Schwerpunkt: Digital Business & Product Management',
      gpa: '1.5',
      gpaScale: '1.0',
      honors: ['Summa Cum Laude', 'Dean\'s List (4 semesters)', 'Best Thesis Award 2018'],
      relevantCoursework: [
        'Advanced Data Analytics',
        'Digital Business Models',
        'Product Management',
        'Machine Learning',
        'Agile Software Development',
      ],
    },
    {
      degree: 'B.Sc. Informatik',
      institution: 'LMU München',
      timeframe: '2012 - 2015',
      city: 'München',
      country: 'Deutschland',
      gpa: '1.8',
      gpaScale: '1.0',
      honors: ['Dean\'s List (2 semesters)'],
      relevantCoursework: [
        'Algorithms & Data Structures',
        'Database Systems',
        'Software Engineering',
        'Statistics',
      ],
    },
  ],
  skills: [
    'Product Strategy',
    'Agile/Scrum',
    'User Research',
    'Data Analysis',
    'SQL',
    'Jira',
    'Figma',
    'A/B Testing',
  ],
  technicalSkills: [
    'Python',
    'SQL',
    'Tableau',
    'Google Analytics',
    'Amplitude',
    'Mixpanel',
    'Jira',
    'Confluence',
    'Figma',
    'Adobe XD',
  ],
  languages: [
    { name: 'Deutsch', level: 'Muttersprache' },
    { name: 'Englisch', level: 'Fließend' },
    { name: 'Spanisch', level: 'Grundkenntnisse' },
  ],
  projects: [
    {
      title: 'AI-Powered Recommendation Engine',
      description:
        'Entwicklung eines Machine-Learning-basierten Empfehlungssystems, das die User-Engagement um 40% steigerte',
    },
  ],
  certifications: [
    'Certified Scrum Product Owner (CSPO)',
    'Google Analytics Certified',
    'AWS Cloud Practitioner',
    'Product Management Certificate (General Assembly)',
  ],
  activities: [
    {
      organization: 'Tech Leaders Munich',
      position: 'Board Member & Event Organizer',
      timeframe: '2019 - Heute',
      city: 'München',
      country: 'Deutschland',
      bullets: [
        'Organized 12+ networking events with 500+ attendees annually',
        'Mentored 15+ junior product managers in career development',
        'Led panel discussions on digital transformation and innovation',
      ],
    },
    {
      organization: 'Startup Weekend Munich',
      position: 'Volunteer Coach & Judge',
      timeframe: '2017 - Heute',
      city: 'München',
      country: 'Deutschland',
      bullets: [
        'Coached 20+ startup teams on product strategy and MVP development',
        'Evaluated business ideas and provided feedback to aspiring entrepreneurs',
      ],
    },
  ],
  interests:
    'Marathon running (completed 5 marathons), Travel (visited 30+ countries), Photography, Cooking international cuisine, Reading technology and business books',
};

export default function CVPreview() {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [pendingFormat, setPendingFormat] = useState<'pdf' | 'docx' | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(80);
  const navigate = useNavigate();

  const {
    email,
    selectedTemplate,
    switchTemplate,
    photoBase64,
    setPhoto,
    showPhotoInCV,
    togglePhotoDisplay,
  } = useStore();

  useEffect(() => {
    if (showPremiumModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showPremiumModal]);

  const handleDownload = async (format: 'pdf' | 'docx') => {
    await triggerDownload(format);
  };

  const triggerDownload = async (format: 'pdf' | 'docx') => {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      if (format === 'pdf') {
        await downloadAsPDF(sampleCVData, photoBase64, showPhotoInCV, selectedTemplate);
      }
      // DOCX temporarily disabled
      // else {
      //   await downloadAsDOCX(sampleCVData, photoBase64, showPhotoInCV);
      // }

      showToast('CV erfolgreich heruntergeladen!', 'success');
    } catch (error) {
      console.error('Download error:', error);
      setDownloadError(
        `${format.toUpperCase()}-Generierung fehlgeschlagen. Bitte versuche es erneut.`
      );
      showToast(
        `${format.toUpperCase()}-Download fehlgeschlagen`,
        'error'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    console.log(`Toast [${type}]: ${message}`);
  };

  const handleEdit = () => {
    navigate('/cv/edit');
  };

  const handleRegisterSuccess = async () => {
    const user = await authService.getCurrentUser();
    if (!user) return;

    await dataMigrationService.migrateToUser(user.id);
    setShowRegisterModal(false);
    showToast('Account erfolgreich erstellt!', 'success');

    if (pendingFormat) {
      setTimeout(async () => {
        showToast('CV wird heruntergeladen...', 'success');
        await triggerDownload(pendingFormat);
        setPendingFormat(null);
      }, 500);
    }

    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  const handleSkip = () => {
    localStorage.setItem('skipped_registration', 'true');
    setShowRegisterModal(false);
    setShowBanner(true);
    setPendingFormat(null);
  };

  const handleBannerDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('banner_dismissed', 'true');
  };

  const handleBannerRegister = () => {
    setShowBanner(false);
    setShowRegisterModal(true);
  };

  const increaseZoom = () => setZoomLevel(Math.min(zoomLevel + 10, 150));
  const decreaseZoom = () => setZoomLevel(Math.max(zoomLevel - 10, 50));

  const renderTemplate = () => {
    const props = {
      data: sampleCVData,
      photo: photoBase64,
      showPhoto: showPhotoInCV,
    };

    switch (selectedTemplate) {
      case 'azubi':
        return <AzubiTemplate {...props} />;
      case 'uni':
        return <UniTemplate {...props} />;
      case 'beratung':
        return <BeratungTemplate {...props} />;
      case 'finance':
        return <FinanceTemplate {...props} />;
      default:
        return <ModernTemplate {...props} />;
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <StickyBanner
        isVisible={showBanner}
        onRegister={handleBannerRegister}
        onDismiss={handleBannerDismiss}
      />
      <header className="bg-dark-card border-b border-white border-opacity-10 px-6 py-6">
        <div className="max-w-[1800px] mx-auto">
          <h1 className="text-3xl font-bold text-white">Dein optimierter Lebenslauf ist fertig!</h1>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row max-w-[1800px] mx-auto">
        <aside className="w-full lg:w-[30%] bg-dark-card lg:rounded-r-2xl p-6 lg:p-8 space-y-8 order-2 lg:order-1">
          <section>
            <h2 className="text-base font-semibold text-white mb-3">CV-Stil</h2>
            <div className="space-y-2">
              <button
                onClick={() => togglePhotoDisplay(true)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                  showPhotoInCV
                    ? 'bg-primary bg-opacity-20 border-primary border-[3px]'
                    : 'bg-white bg-opacity-5 border-gray-600 border-opacity-20 hover:bg-primary hover:bg-opacity-10 hover:border-primary'
                }`}
              >
                <UserCircle size={20} className="text-primary" />
                <span className="text-sm font-medium text-white">Mit Foto</span>
              </button>
              <button
                onClick={() => togglePhotoDisplay(false)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                  !showPhotoInCV
                    ? 'bg-primary bg-opacity-20 border-primary border-[3px]'
                    : 'bg-white bg-opacity-5 border-gray-600 border-opacity-20 hover:bg-primary hover:bg-opacity-10 hover:border-primary'
                }`}
              >
                <User size={20} className="text-primary" />
                <span className="text-sm font-medium text-white">Ohne Foto</span>
              </button>
            </div>
          </section>

          {showPhotoInCV && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h2 className="text-base font-semibold text-white mb-3">Profilfoto</h2>
              <div className="flex justify-center">
                <PhotoUpload
                  currentPhoto={photoBase64}
                  onPhotoChange={setPhoto}
                />
              </div>
            </motion.section>
          )}

          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Template wählen</h2>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              {templates.map((template) => {
                const Icon = template.icon;
                return (
                  <motion.button
                    key={template.id}
                    onClick={() => switchTemplate(template.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`h-20 rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
                      selectedTemplate === template.id
                        ? 'bg-primary bg-opacity-20 border-3 border-primary'
                        : 'bg-white bg-opacity-5 border-2 border-gray-600 border-opacity-20 hover:bg-primary hover:bg-opacity-10 hover:border-primary'
                    }`}
                  >
                    <Icon size={24} className="text-primary" />
                    <span className="text-sm font-medium text-white">{template.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Dein ATS-Score</h2>
            <div className="bg-white bg-opacity-5 rounded-xl p-6 border border-white border-opacity-10">
              <div className="text-5xl font-bold text-primary mb-3">87/100</div>
              <div className="w-full h-2 bg-white bg-opacity-10 rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '87%' }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
              <p className="text-sm text-text-secondary">Besser als 87% aller CVs</p>
            </div>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-3">Download</h3>
            <div className="space-y-2">
              <Button
                icon={isDownloading ? Loader2 : Download}
                className="w-full"
                onClick={() => handleDownload('pdf')}
                disabled={isDownloading}
              >
                {isDownloading ? 'Wird generiert...' : 'Als PDF'}
              </Button>
              {/* DOCX temporarily disabled - focus on PDF first */}
              {/* <Button
                icon={isDownloading ? Loader2 : FileText}
                variant="secondary"
                className="w-full"
                onClick={() => handleDownload('docx')}
                disabled={isDownloading}
              >
                {isDownloading ? 'Wird generiert...' : 'Als DOCX'}
              </Button> */}
            </div>
            {downloadError && (
              <p className="text-xs text-error mt-2">{downloadError}</p>
            )}
            <Button
              icon={Edit}
              variant="ghost"
              className="w-full mt-3 border-2 border-primary text-primary hover:bg-primary hover:bg-opacity-10"
              onClick={handleEdit}
            >
              CV bearbeiten
            </Button>
          </section>

          <section className="border-t border-white border-opacity-10 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="text-error" size={20} />
                <h3 className="text-base font-semibold text-white">Job-Matches</h3>
              </div>
              <span className="bg-error text-white text-xs px-2 py-1 rounded-full font-medium">
                5 neu
              </span>
            </div>

            <div className="space-y-3 mb-4">
              {jobMatches.map((job, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white bg-opacity-5 border border-gray-600 border-opacity-20 rounded-xl p-4 cursor-pointer"
                  onClick={() => setShowPremiumModal(true)}
                >
                  <div className="font-semibold text-white text-sm">{job.company}</div>
                  <div className="text-text-secondary text-xs mt-1">{job.position}</div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-gray-500">{job.location}</span>
                    <span className="text-gray-500">{job.salary}</span>
                  </div>
                  <div className="text-warning text-xs mt-2 font-medium">Match: 🔒 Premium</div>
                </motion.div>
              ))}
            </div>

            <p className="text-sm text-primary mb-4">+ 3 weitere Jobs</p>

            <Button
              icon={ArrowRight}
              variant="ghost"
              className="w-full border-2 border-primary text-primary hover:bg-primary hover:bg-opacity-10"
              onClick={() => setShowPremiumModal(true)}
            >
              Alle Jobs ansehen
            </Button>
          </section>

          <section
            className="rounded-xl p-5 border"
            style={{
              background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.1) 0%, rgba(78, 205, 196, 0.05) 100%)',
              borderColor: 'rgba(78, 205, 196, 0.3)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Crown className="text-warning" size={20} />
              <h3 className="text-base font-semibold text-white">Premium Features</h3>
            </div>

            <ul className="space-y-2 mb-4">
              {[
                'Detaillierte Job-Matches',
                'CV-Anpassung pro Stelle',
                'Sichtbar für Recruiter',
                'Wöchentlich neue Jobs',
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-text-secondary">
                  <Check size={16} className="text-success flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              className="w-full"
              onClick={() => setShowPremiumModal(true)}
            >
              7 Tage kostenlos testen
            </Button>
          </section>
        </aside>

        <main className="flex-1 p-6 lg:p-10 order-1 lg:order-2">
          <div className="mx-auto" style={{ maxWidth: '210mm' }}>
            <div
              className="bg-white rounded-lg shadow-2xl mx-auto"
              style={{
                width: '210mm',
                minHeight: '297mm',
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.3s ease',
              }}
            >
              {renderTemplate()}
            </div>

            <div className="flex items-center justify-center gap-4 mt-6 sticky bottom-6">
              <button
                onClick={decreaseZoom}
                className="bg-white bg-opacity-10 text-white border border-gray-600 border-opacity-20 px-3 py-2 rounded-lg hover:bg-white hover:bg-opacity-15 transition-colors"
              >
                <Minus size={20} />
              </button>
              <span className="text-white font-medium">{zoomLevel}%</span>
              <button
                onClick={increaseZoom}
                className="bg-white bg-opacity-10 text-white border border-gray-600 border-opacity-20 px-3 py-2 rounded-lg hover:bg-white hover:bg-opacity-15 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {showPremiumModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{
              background: 'rgba(10, 25, 41, 0.95)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={() => setShowPremiumModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[600px] rounded-2xl p-10 shadow-2xl"
              style={{
                background: '#132F4C',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              }}
            >
              <button
                onClick={() => setShowPremiumModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="flex justify-center mb-6">
                <Briefcase className="text-primary" size={64} />
              </div>

              <h2 className="text-3xl font-bold text-center mb-4">
                💼 Entdecke deine perfekten Job-Matches
              </h2>
              <p className="text-center text-text-secondary mb-8">
                Mit Premium siehst du, welche Stellen wirklich zu dir passen
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: Target, title: 'Match-Score sehen', desc: '94% Passung zu BMW Senior PM' },
                  { icon: ListChecks, title: 'Anforderungen abgleichen', desc: '8 von 9 Requirements erfüllt' },
                  { icon: Wand, title: 'CV automatisch anpassen', desc: 'Für jede Stelle optimiert' },
                  { icon: Bell, title: 'Wöchentlich neue Matches', desc: 'Verpasse keine Chance' },
                  { icon: Eye, title: 'Wer hat dich angesehen', desc: 'Recruiter-Interesse live tracken' },
                ].map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={index}
                      className="flex gap-4 p-4 bg-white bg-opacity-5 rounded-xl"
                    >
                      <Icon className="text-primary flex-shrink-0" size={24} />
                      <div>
                        <div className="font-semibold text-white mb-1">{feature.title}</div>
                        <div className="text-sm text-text-secondary">{feature.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                className="p-6 rounded-xl mb-6"
                style={{
                  background: 'rgba(78, 205, 196, 0.1)',
                  border: '2px solid #4ECDC4',
                }}
              >
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-bold text-primary">9€</span>
                  <span className="text-text-secondary">pro Monat</span>
                </div>
                <ul className="space-y-2">
                  {['Jederzeit kündbar', 'Keine Vertragsbindung', '7 Tage kostenlos testen'].map(
                    (item, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-white">
                        <Check size={16} className="text-success" />
                        {item}
                      </li>
                    )
                  )}
                </ul>
              </div>

              <Button
                icon={ArrowRight}
                className="w-full text-lg py-4"
                onClick={() => console.log('Navigate to checkout')}
              >
                7 Tage kostenlos testen
              </Button>

              <button
                onClick={() => setShowPremiumModal(false)}
                className="w-full mt-4 text-sm text-gray-500 hover:text-white transition-colors underline"
              >
                Nein danke
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={handleRegisterSuccess}
        onSkip={handleSkip}
        prefilledEmail={email}
      />
    </div>
  );
}
