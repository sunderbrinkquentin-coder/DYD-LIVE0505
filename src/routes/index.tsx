import { createHashRouter } from 'react-router-dom';

import CvEntryPage from '../pages/CvEntryPage';
import LandingPage from '../pages/LandingPage';
import ModernLandingPage from '../pages/ModernLandingPage';
import EmailCapture from '../pages/EmailCapture';
import AIChat from '../pages/AIChat';
import CVPreview from '../pages/CVPreview';
import CVEditor from '../pages/CVEditor';
import AgentFlow from '../pages/AgentFlow';
import { DashboardPage } from '../pages/DashboardPage';
import B2BLanding from '../pages/B2BLanding';
import B2BDashboard from '../pages/B2BDashboard';
import { CVWizard } from '../pages/CVWizard';
import CVCheckPage from '../pages/CVCheckPage';
import CvResultPage from '../pages/CvResultPage';
import SavedCvCheckPage from '../pages/SavedCvCheckPage';
import CvPaywallPage from '../pages/CvPaywallPage';
import PaymentSuccessPage from '../pages/PaymentSuccessPage';
import { JobTargeting } from '../pages/JobTargeting';
import { CVOptimization } from '../pages/CVOptimization';
import { CVPreviewEditor } from '../pages/CVPreviewEditor';
import { CVLiveEditorPage } from '../pages/CVLiveEditorPage';
import { LoginPage } from '../pages/LoginPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import ErrorBoundary from '../components/ErrorBoundary';
import ImpressumPage from '../pages/ImpressumPage';
import DatenschutzPage from '../pages/DatenschutzPage';
import AgbPage from '../pages/AgbPage';
import FaqPage from '../pages/FaqPage';
import CareerVisionPage from '../pages/CareerVisionPage';
import LearningPathPage from '../pages/LearningPathPage';
import LearningPathWaitingPage from '../pages/LearningPathWaitingPage';
import HarmonyFestivalPage from '../pages/HarmonyFestivalPage';
import FestivalPaymentSuccessPage from '../pages/FestivalPaymentSuccessPage';

// 🔐 AUTH GUARD IMPORT
import { PrivateRoute } from '../components/PrivateRoute';

export const router = createHashRouter([
  // Landing
  {
    path: '/',
    element: <LandingPage />,
    errorElement: <ErrorBoundary />,
  },

  { path: '/landing-modern', element: <ModernLandingPage /> },
  { path: '/cv-entry', element: <CvEntryPage /> },

  // Legal
  { path: '/impressum', element: <ImpressumPage /> },
  { path: '/datenschutz', element: <DatenschutzPage /> },
  { path: '/agb', element: <AgbPage /> },
  { path: '/faq', element: <FaqPage /> },
  { path: '/festival', element: <HarmonyFestivalPage /> },
  { path: '/festival-success', element: <FestivalPaymentSuccessPage /> },

  // Auth
  { path: '/login', element: <LoginPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

  // CV Check
  { path: '/cv-upload', element: <CVCheckPage /> },
  { path: '/cv-check', element: <CVCheckPage /> },

  // Analyse → öffentlich
  { path: '/cv-result/:uploadId', element: <CvResultPage /> },

  // Gespeicherte Analyse → geschützt
  {
    path: '/saved-cv-check/:analysisId',
    element: (
      <PrivateRoute>
        <SavedCvCheckPage />
      </PrivateRoute>
    ),
  },

  { path: '/cv-paywall', element: <CvPaywallPage /> },
  { path: '/pricing', element: <CvPaywallPage /> },
  { path: '/payment-success', element: <PaymentSuccessPage /> },

  // Wizard
  { path: '/cv-wizard', element: <CVWizard /> },

  // CV Editor (Live)
  { path: '/cv-live-editor/:cvId', element: <CVLiveEditorPage /> },
  { path: '/cv/:cvId/editor', element: <CVLiveEditorPage /> },
  { path: '/cv/:cvId', element: <CVLiveEditorPage /> },

  // Old editors
  { path: '/cv/edit', element: <CVEditor /> },
  { path: '/cv-preview-editor', element: <CVPreviewEditor /> },

  // Optimization
  { path: '/job-targeting', element: <JobTargeting /> },
  { path: '/cv-optimization', element: <CVOptimization /> },

  // Career Vision
  { path: '/career-vision', element: <CareerVisionPage /> },
  { path: '/learning-path/:pathId', element: <LearningPathPage /> },
  { path: '/learning-path-waiting/:pathId', element: <LearningPathWaitingPage /> },

  // 🔐 Dashboard → jetzt geschützt
  {
    path: '/dashboard',
    element: (
      <PrivateRoute>
        <DashboardPage />
      </PrivateRoute>
    ),
  },

  // B2B (ENTSCHEIDE SELBST OB GESCHÜTZT)
  { path: '/unternehmen', element: <B2BLanding /> },
  { path: '/unternehmen/dashboard', element: <B2BDashboard /> },

  // Legacy
  { path: '/email', element: <EmailCapture /> },
  { path: '/chat', element: <AgentFlow /> },
  { path: '/chat-old', element: <AIChat /> },
  { path: '/agent', element: <AgentFlow /> },
  { path: '/result', element: <CVPreview /> },
]);
