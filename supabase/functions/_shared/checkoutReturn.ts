/** Skill-Gap-Zahlungen kehren auf die veröffentlichte Website zurück. */
export function skillgapReturnUrls(siteUrl: string | undefined, pathId: string) {
  if (!siteUrl?.trim()) throw new Error('SITE_URL muss die veröffentlichte Website enthalten.');
  let site: URL;
  try { site = new URL(siteUrl.trim()); } catch { throw new Error('SITE_URL ist keine gültige URL.'); }
  if (site.protocol !== 'https:' || site.username || site.password ||
      /(^|\.)(localhost|webcontainer-api\.io|stackblitz\.io|local-credentialless\.webcontainer-api\.io)$/.test(site.hostname)) {
    throw new Error('SITE_URL muss eine öffentliche HTTPS-Adresse sein, keine lokale Bolt-Vorschau.');
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathId)) {
    throw new Error('Ungültige Analyse-ID.');
  }
  // Live-Frontend verwendet Hash-Routing. Das neue Frontend wandelt diese
  // Adresse über legacyHashRedirect vor Router-Start in einen Browser-Pfad um.
  const base = `${site.origin}/#/career-vision?resume=${encodeURIComponent(pathId)}`;
  return { success_url: `${base}&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${base}&checkout=cancelled` };
}
