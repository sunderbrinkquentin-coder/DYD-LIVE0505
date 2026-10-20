// src/legacyHashRedirect.ts
//
// Umstellung von Hash-URLs (alt: decide-your-dream.de/#/business) auf echte
// URLs (neu: decide-your-dream.de/business). Alte Links aus E-Mails,
// QR-Codes auf Zertifikaten, Lesezeichen, externen Verweisen und
// Make-Szenarien funktionieren weiter: Der Hash-Pfad wird VOR dem Start des
// Routers per replaceState in einen echten Pfad umgeschrieben.
// Hash-Fragmente, die nicht mit "#/" beginnen (z. B. Supabase-Tokens
// "#access_token=…" oder Sprungmarken "#tickets"), bleiben unangetastet.

const LEGACY_PREFIX = '#' + '/';
const { hash, pathname } = window.location;
if (hash.startsWith(LEGACY_PREFIX)) {
  const target = hash.slice(1); // "/business?tab=x#anker"
  const base = pathname === '/' || pathname === '/index.html' ? '' : pathname.replace(/\/$/, '');
  window.history.replaceState(window.history.state, '', base + target);
}

export {};
