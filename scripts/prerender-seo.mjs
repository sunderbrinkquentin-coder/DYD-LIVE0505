// scripts/prerender-seo.mjs
//
// Läuft nach "vite build" (siehe package.json → build). Erzeugt für jede
// öffentliche Seite eine eigene HTML-Datei mit
//   - eigenem Titel, Beschreibung, Canonical, Open Graph, robots
//   - globalen + seitenspezifischen strukturierten Daten (JSON-LD)
//   - lesbarem Inhalt ohne JavaScript (für KI-Crawler wie GPTBot,
//     ClaudeBot, PerplexityBot, die meist kein JavaScript ausführen)
// sowie sitemap.xml, llms.txt und llms-full.txt – alles aus EINER Quelle
// (src/seo/*.ts), damit Angaben nie auseinanderlaufen.

import { build } from 'esbuild';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const tmp = join(root, 'node_modules', '.cache', 'seo-prerender.mjs');

// 1) SEO-Quellen (TypeScript) für Node bündeln und laden
const siteTmp = join(root, 'node_modules', '.cache', 'seo-site.mjs');
await build({ entryPoints: [join(root, 'src/seo/site.ts')], bundle: true, platform: 'node', format: 'esm', outfile: siteTmp, logLevel: 'error' });
await build({ entryPoints: [join(root, 'src/seo/pages.ts')], bundle: true, platform: 'node', format: 'esm', outfile: tmp, logLevel: 'error' });

const { buildSeoPages, globalSchema, BUILD_DATE } = await import(pathToFileURL(tmp).href + `?t=${Date.now()}`);
const { SITE_URL, SITE_NAME, LEGAL_NAME, CONTACT_EMAIL, abs } = await import(pathToFileURL(siteTmp).href + `?t=${Date.now()}`);

const pages = buildSeoPages();

// Modus "--sync-source": schreibt die vollständige Startseite (alle Meta-Daten,
// strukturierten Daten und Inhalte) in die Quell-index.html im Projekt –
// damit die Datei auch ohne Build vollständig ist (npm run seo:sync).
const SYNC_SOURCE = process.argv.includes('--sync-source');
const templatePath = SYNC_SOURCE ? join(root, 'index.html') : join(dist, 'index.html');
const template = await readFile(templatePath, 'utf8');
for (const m of ['<!--SEO-->', '<!--/SEO-->', '<!--SEO-BODY-->', '<!--/SEO-BODY-->']) {
  if (!template.includes(m)) throw new Error(`index.html: Platzhalter ${m} fehlt`);
}

// ── Hilfsfunktionen ────────────────────────────────────────────────────
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonLd = (obj) => `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2).replace(/</g, '\\u003c').replace(/^/gm, '    ')}\n    </script>`;
const NAV = pages.filter((p) => p.priority >= 0.5);

function headFor(p) {
  const url = abs(p.path);
  const robots = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
  return [
    `<title>${esc(p.title)}</title>`,
    `<meta name="description" content="${esc(p.description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<link rel="alternate" hreflang="de" href="${url}" />`,
    `<link rel="alternate" hreflang="x-default" href="${url}" />`,
    `<meta property="og:title" content="${esc(p.title)}" />`,
    `<meta property="og:description" content="${esc(p.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta name="twitter:title" content="${esc(p.title)}" />`,
    `<meta name="twitter:description" content="${esc(p.description)}" />`,
    `<meta property="article:modified_time" content="${BUILD_DATE}" />`,
    ...globalSchema().map(jsonLd),
    ...p.schema.map(jsonLd),
  ].join('\n    ');
}

function bodyFor(p) {
  const crumbs = p.path === '/' ? [] : [{ name: 'Start', path: '/' }, ...pages.filter((x) => x.path !== '/' && p.path.startsWith(x.path) && (p.path === x.path || p.path.startsWith(x.path + '/'))).sort((a, b) => a.path.length - b.path.length).map((x) => ({ name: x.name, path: x.path }))];
  const sec = p.sections.map((s) => [
    `<section><h2>${esc(s.h2)}</h2>`,
    s.text ? `<p>${esc(s.text)}</p>` : '',
    s.list ? `<ul>${s.list.map((li) => `<li>${esc(li)}</li>`).join('')}</ul>` : '',
    s.links ? `<p>${s.links.map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join(' · ')}</p>` : '',
    '</section>',
  ].join('')).join('\n');
  const faq = p.faq?.length && p.path !== '/faq'
    ? `<section><h2>Häufige Fragen</h2>${p.faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('')}</section>`
    : p.faq?.length ? `<section><h2>Alle Fragen und Antworten</h2>${p.faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('')}</section>` : '';
  return `<div id="seo-content">
<header><p><a href="/"><strong>${esc(SITE_NAME)}</strong></a></p><nav aria-label="Hauptnavigation"><ul>${NAV.map((n) => `<li><a href="${n.path}">${esc(n.name)}</a></li>`).join('')}</ul></nav></header>
<main>
${crumbs.length ? `<nav aria-label="Brotkrumen"><ol>${crumbs.map((c) => `<li><a href="${c.path}">${esc(c.name)}</a></li>`).join('')}</ol></nav>` : ''}
<h1>${esc(p.h1)}</h1>
<p>${esc(p.intro)}</p>
${sec}
${faq}
<p><small>Zuletzt aktualisiert: ${BUILD_DATE}</small></p>
</main>
<footer><p>${esc(LEGAL_NAME)} · Düsseldorf, Deutschland · <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p><ul><li><a href="/impressum">Impressum</a></li><li><a href="/datenschutz">Datenschutz</a></li><li><a href="/agb">AGB</a></li><li><a href="/llms.txt">llms.txt</a></li></ul></footer>
</div>`;
}

const between = (src, start, end, content) =>
  src.slice(0, src.indexOf(start) + start.length) + content + src.slice(src.indexOf(end));

function render(p) {
  const withHead = between(template, '<!--SEO-->', '<!--/SEO-->', `\n    ${headFor(p)}\n    `);
  return between(withHead, '<!--SEO-BODY-->', '<!--/SEO-BODY-->', `\n${bodyFor(p)}\n`);
}

if (SYNC_SOURCE) {
  await writeFile(templatePath, render(pages.find((p) => p.path === '/')));
  await rm(tmp, { force: true }); await rm(siteTmp, { force: true });
  console.log('SEO: index.html im Projekt mit vollständiger Startseite aktualisiert.');
  process.exit(0);
}

// ── Seiten schreiben ───────────────────────────────────────────────────
for (const p of pages) {
  const file = p.path === '/' ? join(dist, 'index.html') : join(dist, `${p.path.slice(1)}.html`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, render(p));
}

// ── sitemap.xml ────────────────────────────────────────────────────────
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${pages.map((p) => {
  const imgs = p.schema.flatMap((s) => (s['@type'] === 'ItemList' ? s.itemListElement.map((e) => e.item?.image).filter(Boolean) : []));
  return `  <url>
    <loc>${abs(p.path)}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority.toFixed(1)}</priority>${imgs.map((i) => `\n    <image:image><image:loc>${i}</image:loc></image:image>`).join('')}
  </url>`;
}).join('\n')}
</urlset>
`;
await writeFile(join(dist, 'sitemap.xml'), sitemap);

// ── llms.txt (kurz) und llms-full.txt (vollständig) ────────────────────
const byPath = Object.fromEntries(pages.map((p) => [p.path, p]));
const line = (path) => `- [${byPath[path].name}](${abs(path)}): ${byPath[path].description}`;
const llms = `# ${SITE_NAME}

> DYD (Decide Your Dream) ist ein HR-Tech-Unternehmen aus Düsseldorf (${LEGAL_NAME}), gegründet von Quentin Sunderbrink. DYD bietet KI-Bewerbungs-Tools für Bewerber:innen, die Skill-Plattformen DYD NEXUS (Unternehmen) und DYD ORBIT (Bildungsträger) sowie individuelle Software, Apps und KI-Automatisierung für Unternehmen. Kooperationspartner der Hochschule Fresenius. DSGVO-konform.

Kontakt: ${CONTACT_EMAIL} · Website: ${SITE_URL}/ · Ausführliche Fassung: ${SITE_URL}/llms-full.txt

## Für Bewerber:innen
${['/', '/cv-check', '/cv-wizard', '/career-vision', '/kurse'].map(line).join('\n')}

## Für Unternehmen und Bildungsträger
${['/business', '/business/automatisierung'].map(line).join('\n')}

## Weitere Seiten
${['/faq', '/festival'].map(line).join('\n')}

## Optional
${['/impressum', '/datenschutz', '/agb'].map(line).join('\n')}
`;
await writeFile(join(dist, 'llms.txt'), llms);

const full = [`# ${SITE_NAME} – vollständige Informationen\n\nStand: ${BUILD_DATE}. Quelle: ${SITE_URL}/\n`,
  ...pages.filter((p) => p.priority >= 0.5).map((p) => [
    `\n## ${p.h1}\nURL: ${abs(p.path)}\n\n${p.intro}\n`,
    ...p.sections.map((s) => `\n### ${s.h2}\n${s.text ? s.text + '\n' : ''}${s.list ? s.list.map((l) => `- ${l}`).join('\n') + '\n' : ''}`),
    p.faq?.length ? `\n### Häufige Fragen\n${p.faq.map((f) => `\n**${f.q}**\n${f.a}`).join('\n')}\n` : '',
  ].join('')),
].join('\n');
await writeFile(join(dist, 'llms-full.txt'), full);

await rm(tmp, { force: true }); await rm(siteTmp, { force: true });
console.log(`SEO-Prerender: ${pages.length} Seiten, sitemap.xml, llms.txt, llms-full.txt geschrieben.`);
