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

  // Interne Links (<a href="/business"> usw.) ohne Neuladen über den Router
  // öffnen. Sonst fragt jeder Klick den Server nach /business – und hängt
  // damit an den Netlify-Weiterleitungen. So funktioniert die Navigation in
  // der App immer, unabhängig von der Server-Konfiguration.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('/') || href.startsWith('//')) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download') || anchor.getAttribute('rel')?.includes('external')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Dateien (PDF, Bilder, Videos, llms.txt …) normal laden
      if (/\.[a-z0-9]{2,5}$/i.test(url.pathname)) return;
      // Alte Hash-Links (/#/business) → echten Pfad
      const legacy = url.hash.startsWith('#/') ? url.hash.slice(1) : null;
      const target = legacy ?? `${url.pathname}${url.search}${url.hash}`;
      // Reine Sprungmarke auf derselben Seite (#tickets) dem Browser überlassen
      if (!legacy && url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;
      e.preventDefault();
      void router.navigate(target);
      if (!url.hash || legacy) window.scrollTo(0, 0);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <AuthProvider>
      <CareerVisionProvider>
        <RouterProvider router={router} />
      </CareerVisionProvider>
    </AuthProvider>
  );
}