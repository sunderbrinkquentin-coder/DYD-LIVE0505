// src/App.tsx
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CareerVisionProvider } from './contexts/CareerVisionContext';
import { router } from './routes';
import { applySeo } from './seo/RouteSeo';

// Titel/Meta bei jedem Seitenwechsel aktualisieren (GEO/SEO)
applySeo(router.state.location.pathname);
router.subscribe((state) => applySeo(state.location.pathname));

export default function App() {
  return (
    <AuthProvider>
      <CareerVisionProvider>
        <RouterProvider router={router} />
      </CareerVisionProvider>
    </AuthProvider>
  );
}
