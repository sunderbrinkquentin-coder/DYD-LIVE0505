// src/App.tsx
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CareerVisionProvider } from './contexts/CareerVisionContext';
import { router } from './routes';
import { applySeo } from './seo/RouteSeo';

export default function App() {
  // SEO/Meta-Tags sicher innerhalb eines Effects bei Mount & Router-Änderungen aktualisieren
  useEffect(() => {
    // Initial beim Laden setzen
    applySeo(router.state.location.pathname);

    // Bei jedem Routenwechsel lauschen
    const unsubscribe = router.subscribe((state) => {
      applySeo(state.location.pathname);
    });

    // Cleanup-Funktion beim Unmounten der App
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AuthProvider>
      <CareerVisionProvider>
        <RouterProvider router={router} />
      </CareerVisionProvider>
    </AuthProvider>
  );
}