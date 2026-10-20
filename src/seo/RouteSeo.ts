// src/seo/RouteSeo.ts
//
// Hält Titel, Beschreibung, Canonical, Open Graph und robots beim
// Seitenwechsel aktuell (Single-Page-App). Das erste HTML kommt bereits
// passend vorgerendert vom Server (scripts/prerender-seo.mjs).

import { SITE_URL } from './site';
import { isNoindex, metaFor } from './meta';

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', value);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) { el = document.createElement('link'); el.rel = 'canonical'; document.head.appendChild(el); }
  el.href = href;
}

export function applySeo(pathname: string): void {
  const m = metaFor(pathname);
  if (m) {
    const url = m.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${m.path}`;
    document.title = m.title;
    setMeta('name', 'description', m.description);
    setMeta('property', 'og:title', m.title);
    setMeta('property', 'og:description', m.description);
    setMeta('property', 'og:url', url);
    setMeta('name', 'twitter:title', m.title);
    setMeta('name', 'twitter:description', m.description);
    setCanonical(url);
  }
  setMeta('name', 'robots', isNoindex(pathname) ? 'noindex, follow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
}
