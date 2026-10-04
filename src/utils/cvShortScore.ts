// src/utils/cvShortScore.ts
//
// Kleiner Feinschliff-Score (0–100) für den Live-Editor.
// Bewertet NUR Sprache & Struktur der Texte – bewusst klein gehalten.
// Inhalt, ATS-Lesbarkeit und Stellen-Passung bewertet der kostenpflichtige
// CV-Check. Spiegelt scoreCv() aus supabase/functions/trigger-cv-generator,
// arbeitet aber auf dem Editor-Format (sections[]), damit er sich beim
// Übernehmen von Journey-Vorschlägen live aktualisiert.

const BLACKLIST = [
  'teamfähig', 'belastbar', 'hochmotiviert', 'leidenschaftlich', 'transferstark',
  'führungspersönlichkeit', 'end-to-end', 'ganzheitlich', 'maßgeblich', 'erfolgreich',
  'ergebnisorientiert', 'nachhaltig', 'maßgeschneidert', 'reibungslos', 'innovativ',
  'synergie', 'diverse', 'verantwortlich für', 'zuständig für', 'unterstützte bei',
  'hands-on', 'proaktiv', 'dynamisch', 'zielstrebig', 'kundenorientiert',
];

const GER_LEVEL = /^(A1|A2|B1|B2|C1|C2|native|muttersprache)$/i;

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
}

function bulletsOf(item: any): string[] {
  const raw = Array.isArray(item?.bulletPoints) && item.bulletPoints.length
    ? item.bulletPoints
    : Array.isArray(item?.description) ? item.description : [];
  return raw.map((b: unknown) => str(b).replace(/^[-•\u2022\s]+/, '').replace(/[.;,]+$/, '')).filter(Boolean);
}

function leadingVerb(b: string): string {
  return (b.split(/\s+/)[0] ?? '').toLowerCase().replace(/[^a-zäöüß-]/g, '');
}

function hasNumber(b: string): boolean {
  return /(?<![\p{L}\d.,])\d+(?:[.,]\d+)*(?![\p{L}\d])/u.test(b);
}

export interface ShortScore {
  total: number;
  parts: Record<string, number>;
}

/** Score auf Basis der Editor-Daten (personalInfo, summary, sections[]). */
export function scoreEditorCv(editorData: any): ShortScore {
  const sections: any[] = Array.isArray(editorData?.sections) ? editorData.sections : [];
  const relevant: string[][] = [];
  const allBullets: string[] = [];

  for (const section of sections) {
    const type = str(section?.type);
    const items: any[] = Array.isArray(section?.items) ? section.items : [];
    if (!['experience', 'education', 'projects', 'volunteering'].includes(type)) continue;
    for (const item of items) {
      const bullets = bulletsOf(item);
      allBullets.push(...bullets);
      const isSchool = str(item?._sid).startsWith('schoolEducation');
      if ((type === 'experience' || type === 'education') && !isSchool) relevant.push(bullets);
    }
  }

  const summary = str(editorData?.summary);
  const headline = str(editorData?.personalInfo?.title);
  const text = [summary, ...allBullets].join(' ').toLowerCase();
  const ratio = (n: number, d: number) => (d > 0 ? n / d : 0);

  const sentences = summary.split(/[.!?]+\s/).filter((x) => x.trim().length > 10).length;
  const floskeln = BLACKLIST.reduce((n, w) => n + (text.split(w).length - 1), 0);
  const verbs = allBullets.map(leadingVerb).filter(Boolean);
  const languages: any[] = sections.find((s) => s?.type === 'languages')?.items ?? [];

  const parts: Record<string, number> = {
    headline: headline ? 5 : 0,
    profil: summary.length >= 150 && summary.length <= 480 && sentences >= 2 && sentences <= 4 ? 15 : summary ? 7 : 0,
    stationen: Math.round(20 * ratio(relevant.filter((b) => b.length >= 2).length, relevant.length)),
    kennzahlen: Math.round(15 * Math.min(1, ratio(allBullets.filter(hasNumber).length, allBullets.length) / 0.4)),
    floskeln: Math.max(0, 15 - floskeln * 3),
    laenge: Math.round(10 * ratio(allBullets.filter((b) => b.length >= 60 && b.length <= 180).length, allBullets.length)),
    vielfalt: Math.round(10 * ratio(new Set(verbs).size, verbs.length)),
    platzhalter: /\[[^\]]*\]/.test(text) ? 0 : 5,
    sprachen: languages.every((l: any) => GER_LEVEL.test(str(l?.level ?? l?.proficiency))) ? 5 : 0,
  };

  const total = Math.max(0, Math.min(100, Object.values(parts).reduce((a, b) => a + b, 0)));
  return { total, parts };
}

/** Kurze Einordnung für die Anzeige. */
export function scoreLabel(total: number): string {
  if (total >= 85) return 'Sehr stark';
  if (total >= 70) return 'Stark';
  if (total >= 55) return 'Solide';
  return 'Ausbaufähig';
}