// src/pages/CvExportRenderPage.tsx
//
// ─────────────────────────────────────────────────────────────────────────────
// DRUCK-ONLY-SEITE FÜR DEN SERVERSEITIGEN PDF-EXPORT
// ─────────────────────────────────────────────────────────────────────────────
//
// Diese Seite hat keine eigene UI für Menschen. Sie wird ausschließlich von
// der Netlify-Function `netlify/functions/export-cv-pdf.ts` per Headless-
// Chromium (Puppeteer) aufgerufen, um daraus ein echtes, durchsuchbares PDF zu
// drucken (`page.pdf()`) — statt wie bisher einen Screenshot der Live-Editor-
// Vorschau zu machen (siehe src/utils/pdfExportClient.ts).
//
// Bewusste Entscheidung: diese Seite dupliziert NICHT die komplexe
// Rohdaten-Normalisierung aus CVLiveEditorPage.tsx (Sektionen zusammenführen,
// summary aus mehreren möglichen Feldern auflösen etc.). Diese Normalisierung
// passiert dort nur beim ALLERERSTEN Laden von Wizard-/Make-Rohdaten. Sobald
// ein CV einmal im Live-Editor war (Voraussetzung, um überhaupt zum Download
// zu kommen), liegt `stored_cvs.cv_data` bereits fertig im `EditorData`-Format
// in der Datenbank — genau das, was der Autosave-Effect dort hineinschreibt.
// Diese Seite liest also `cv_data` direkt und reicht es unverändert an die
// Templates weiter. Dadurch gibt es für dieses Mapping weiterhin nur EINE
// Quelle der Wahrheit (CVLiveEditorPage.tsx), keine zweite, die auseinander-
// laufen könnte.
//
// Sicherheit: Diese Seite braucht keinen eingeloggten User. Sie liest die
// CV-Zeile über ein kurzlebiges, einmaliges Export-Token, das die Netlify-
// Function unmittelbar vor dem Aufruf selbst erzeugt (siehe dortige
// Kommentare + supabase/migrations/20261004120000_add_cv_export_token.sql). Die
// Supabase-Abfrage unten filtert ausdrücklich nach `id` UND `export_token`
// zusammen — die RLS-Policy allein reicht nicht als Schutz, siehe Migration.
//
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { supabase } from '../lib/supabase';
import { PDF_RENDER_STYLES_CSS } from '../components/cv-templates/pdfRenderStyles';
import {
  computePagedLayout,
  applyPushes,
  pageSliceHeight,
  containerHeightFor,
  PAGE_HEIGHT_PX,
  type BreakResult,
} from '../components/cv-templates/breakEngine';
import { DensityWrapper, clampDensity, templateMinHeight } from '../components/cv-templates/layoutDensity';
import type { CVTemplateProps, EditorSection, PersonalInfo } from '../components/cv-templates/EditableText';
import type { CVTemplateType } from '../components/cv-templates/CVTemplateSelector';
import { ModernCVTemplate } from '../components/cv-templates/templates/ModernCVTemplate';
import { ClassicCVTemplate } from '../components/cv-templates/templates/ClassicCVTemplate';
import { MinimalCVTemplate } from '../components/cv-templates/templates/MinimalCVTemplate';
import { CreativeCVTemplate } from '../components/cv-templates/templates/CreativeCVTemplate';
import { ProfessionalCVTemplate } from '../components/cv-templates/templates/ProfessionalCVTemplate';

// Muss zu TEMPLATE_PAGE_BG in CVLiveEditorPage.tsx passen (dort die
// eigentliche Quelle der Wahrheit für die Editor-Vorschau). Bewusst hier
// dupliziert statt dort exportiert, um CVLiveEditorPage.tsx nicht anfassen
// zu müssen — ändert sich eine der beiden Farben, bitte die andere mitziehen.
const TEMPLATE_PAGE_BG: Record<CVTemplateType, string> = {
  modern: '#f0faf8',
  classic: '#ffffff',
  minimal: '#ffffff',
  creative: '#ffffff',
  professional: '#ffffff',
};

const VALID_TEMPLATES: CVTemplateType[] = ['modern', 'classic', 'minimal', 'creative', 'professional'];

// Alle onUpdate*/onReorder*-Handler aus CVTemplateProps sind für den
// interaktiven Editor gedacht. In diesem reinen Druck-Kontext klickt oder
// tippt niemand — die Handler werden nie aufgerufen, müssen aber laut
// CVTemplateProps als Pflichtfelder vorhanden sein.
const noop = () => {};

// ── Dateiname: Lebenslauf_Nachname_Firma ────────────────────────────────────
// Der Browser übernimmt beim "Als PDF speichern" den Seitentitel als Dateinamen,
// der serverseitige Druck schreibt ihn in die PDF-Metadaten. Deshalb wird
// document.title auf genau diesen Namen gesetzt.
const LEGAL_FORMS_RE =
  /\b(gmbh\s*&\s*co\.?\s*kgaa?|gmbh\s*&\s*co\.?\s*kg|gmbh|mbh|ag|se|kgaa|kg|ohg|gbr|ug|e\.\s?v\.?|ev|inc\.?|ltd\.?|llc|plc|corp\.?|co\.?)(?=\s|$|[.,&])/gi;

function toFileNamePart(value: string): string {
  return value
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(LEGAL_FORMS_RE, ' ')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

function buildCvFileName(cvData: Record<string, any>, jobData: Record<string, any> | null): string {
  const info = cvData.personalInfo ?? {};
  const pd = cvData.personalData ?? {};
  const fullName = String(info.name ?? '').trim();
  const lastName = String(
    info.lastName || pd.lastName || (fullName ? fullName.split(/\s+/).slice(-1)[0] : ''),
  );

  const rawCompany = String(
    jobData?.company || jobData?.companyName || cvData.desired_job?.company || '',
  );
  // Generalist-Modus hat keine echte Firma → Firmenteil weglassen
  const company = /generalist/i.test(rawCompany) ? '' : rawCompany;

  return ['Lebenslauf', toFileNamePart(lastName), toFileNamePart(company)]
    .filter(Boolean)
    .join('_');
}

// ── Telefonnummer lesbar formatieren: +4915737567939 → +49 157 37567939 ─────
// Nur eindeutige Fälle (deutsche Mobilnummern) werden gruppiert, alles andere
// bleibt unverändert, um keine falsche Vorwahl-Trennung zu erzeugen.
function formatPhone(raw: unknown): string {
  const original = typeof raw === 'string' ? raw.trim() : '';
  const digits = original.replace(/[^\d+]/g, '');
  const mobile = digits.match(/^(?:\+49|0049|0)(1[5-7]\d)(\d{6,8})$/);
  if (mobile) return `+49 ${mobile[1]} ${mobile[2]}`;
  return original;
}

interface LoadedCv {
  personalInfo: PersonalInfo;
  summary?: string;
  sections: EditorSection[];
  photoUrl?: string;
  photoPosition?: { x: number; y: number };
  template: CVTemplateType;
  fileName: string;
  /** Verdichtung aus dem Editor ("Seiten besser nutzen"), 1 = normal */
  density: number;
}

export function CvExportRenderPage() {
  const { cvId } = useParams<{ cvId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  // `print=1`: clientseitiger Aufruf aus CVLiveEditorPage.tsx (neuer Tab,
  // eigene, eingeloggte Session) statt des serverseitigen Puppeteer-Drucks.
  // Löst KEIN Token ein — die RLS-Policy auf `stored_cvs` (nur der/die
  // Besitzer:in darf die eigene Zeile lesen) ist hier der Schutz, genau wie
  // überall sonst im eingeloggten Bereich der App.
  const autoPrint = searchParams.get('print') === '1';

  const [data, setData] = useState<LoadedCv | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Unsichtbarer Mess-Render (wie im Editor) → daraus die Seitenaufteilung
  const measureRef = useRef<HTMLDivElement | null>(null);
  const pagesRef = useRef<HTMLDivElement | null>(null);
  const [breaks, setBreaks] = useState<BreakResult | null>(null);
  const [isMeasured, setIsMeasured] = useState(false);
  const printTriggeredRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!cvId) {
        setLoadError('cvId fehlt in der URL.');
        return;
      }

      // Zwei Lademodi:
      //  (A) Token-Modus — für den (aktuell nicht mehr genutzten, aber nicht
      //      entfernten) serverseitigen Puppeteer-Druck ohne eingeloggte
      //      Session. `.eq('export_token', token)` ist Teil des
      //      Sicherheitsmodells, nicht nur ein Komfort-Filter — siehe
      //      Kommentar am Dateikopf und die RLS-Policy in der Migration.
      //  (B) Session-Modus (`autoPrint`/kein Token) — der/die eingeloggte
      //      Nutzer:in druckt die eigene, gerade geöffnete CV direkt aus dem
      //      Browser. Kein Token nötig, weil dieselbe Supabase-Session (via
      //      localStorage, gleiche Origin) mitläuft und die normale RLS-
      //      Policy (nur eigene Zeile lesbar) bereits schützt.
      // export_token_expires_at wird NUR im Token-Modus abgefragt. Vorher stand die
      // Spalte in beiden Modi im SELECT – fehlt sie in der Datenbank, brach dadurch
      // auch der normale Session-Druck ab ("column … does not exist").
      const { data: row, error } = token
        ? await supabase
            .from('stored_cvs')
            .select('cv_data, selected_template, job_data, export_token_expires_at')
            .eq('id', cvId)
            .eq('export_token', token)
            .maybeSingle()
        : await supabase
            .from('stored_cvs')
            .select('cv_data, selected_template, job_data, is_paid, download_unlocked')
            .eq('id', cvId)
            .maybeSingle();

      if (cancelled) return;

      if (error || !row) {
        setLoadError(`CV konnte nicht geladen werden. ${error?.message ?? ''}`);
        return;
      }

      // Zahlungs-Check: Im Session-Modus darf nur ein freigeschalteter CV gedruckt
      // werden (vorher reichte es, die URL von Hand aufzurufen). Im Token-Modus
      // prüft die Netlify-Function die Freischaltung bereits serverseitig.
      if (!token) {
        const paid = row as { is_paid?: boolean | null; download_unlocked?: boolean | null };
        if (!paid.is_paid && !paid.download_unlocked) {
          setLoadError('Dieser Lebenslauf ist noch nicht freigeschaltet.');
          return;
        }
      }

      if (token) {
        const rawExpiresAt = (row as { export_token_expires_at?: string | null }).export_token_expires_at;
        const expiresAt = rawExpiresAt ? new Date(rawExpiresAt).getTime() : 0;
        if (!expiresAt || expiresAt < Date.now()) {
          setLoadError('Export-Token ist abgelaufen.');
          return;
        }
      }

      const cvData = (row.cv_data ?? {}) as Record<string, unknown>;
      const rawTemplate = (row as { selected_template?: string }).selected_template
        ?? (cvData._selectedTemplate as string | undefined);
      const template: CVTemplateType = VALID_TEMPLATES.includes(rawTemplate as CVTemplateType)
        ? (rawTemplate as CVTemplateType)
        : 'modern';

      let jobData: Record<string, any> | null = (row as { job_data?: unknown }).job_data as Record<string, any> | null;
      if (typeof jobData === 'string') {
        try { jobData = JSON.parse(jobData); } catch { jobData = null; }
      }

      setData({
        fileName: buildCvFileName(cvData as Record<string, any>, jobData),
        personalInfo: {
          ...((cvData.personalInfo ?? {}) as PersonalInfo),
          phone: formatPhone((cvData.personalInfo as PersonalInfo | undefined)?.phone),
        } as PersonalInfo,
        summary: cvData.summary as string | undefined,
        sections: (cvData.sections ?? []) as EditorSection[],
        photoUrl: cvData.photoUrl as string | undefined,
        photoPosition: cvData.photoPosition as { x: number; y: number } | undefined,
        template,
        density: clampDensity((cvData._layout as { density?: number } | undefined)?.density ?? 1),
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [cvId, token]);

  // Seitentitel = Dateiname beim Speichern als PDF (Lebenslauf_Nachname_Firma)
  useEffect(() => {
    if (!data?.fileName) return;
    const previousTitle = document.title;
    document.title = data.fileName;
    return () => {
      document.title = previousTitle;
    };
  }, [data?.fileName]);

  const baseTemplateProps: CVTemplateProps | null = useMemo(() => {
    if (!data) return null;
    return {
      personalInfo: data.personalInfo,
      summary: data.summary,
      sections: data.sections,
      photoUrl: data.photoUrl,
      photoPosition: data.photoPosition,
      onUpdatePersonalInfo: noop,
      onUpdateSummary: noop,
      onUpdateSectionItem: noop,
    };
  }, [data]);

  /** Template im DensityWrapper – exakt wie im Live-Editor. */
  const renderTemplate = (minHeightPx?: number) => {
    if (!baseTemplateProps || !data) return null;
    const props: CVTemplateProps = { ...baseTemplateProps, minHeightPx };
    let tpl: JSX.Element | null = null;
    switch (data.template) {
      case 'modern': tpl = <ModernCVTemplate {...props} />; break;
      case 'classic': tpl = <ClassicCVTemplate {...props} />; break;
      case 'minimal': tpl = <MinimalCVTemplate {...props} />; break;
      case 'creative': tpl = <CreativeCVTemplate {...props} />; break;
      case 'professional': tpl = <ProfessionalCVTemplate {...props} />; break;
    }
    return tpl ? <DensityWrapper density={data.density}>{tpl}</DensityWrapper> : null;
  };

  const waitForLayout = () =>
    new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 200))));

  const waitForImages = async (root: HTMLElement | null) => {
    if (!root) return;
    const imgs = Array.from(root.querySelectorAll('img')).filter((img) => !img.complete);
    await Promise.all(imgs.map((img) => new Promise((r) => { img.onload = r; img.onerror = r; })));
  };

  // 1) Fonts + Bilder abwarten, unsichtbaren Render messen → Seitenaufteilung.
  //    Dieselbe Break-Engine wie im Editor.
  useEffect(() => {
    if (!data || breaks) return;
    let cancelled = false;
    const run = async () => {
      const fonts = (document as unknown as { fonts?: FontFaceSet }).fonts;
      if (fonts?.ready) await fonts.ready;
      await waitForImages(measureRef.current);
      await waitForLayout();
      if (cancelled) return;
      const root = measureRef.current;
      if (!root || root.scrollHeight < 50) return;
      // Seitenweises Layout wie im Editor: volle Seiten, überstehende Karten
      // rutschen spaltenweise auf die nächste Seite.
      setBreaks(computePagedLayout(root));
    };
    run();
    return () => { cancelled = true; };
  }, [data, breaks]);

  // Ältere globale Druckregeln (index.css) für diese Seite abschalten – sonst
  // verändert der Browser beim Drucken das Layout und das PDF weicht vom Editor ab.
  useEffect(() => {
    document.body.classList.add('cv-export-print');
    return () => document.body.classList.remove('cv-export-print');
  }, []);

  // Dieselben Verschiebungen auf jede Blatt-Kopie anwenden (nach jedem Render)
  useLayoutEffect(() => {
    pagesRef.current?.querySelectorAll<HTMLElement>('[data-page-copy]').forEach((el) => applyPushes(el, breaks?.pushes));
  });

  // 2) Sobald die A4-Blätter stehen und ihre Bilder geladen sind: bereit zum Druck
  useEffect(() => {
    if (!breaks || isMeasured) return;
    let cancelled = false;
    const run = async () => {
      await waitForImages(pagesRef.current);
      await waitForLayout();
      if (!cancelled) setIsMeasured(true);
    };
    run();
    return () => { cancelled = true; };
  }, [breaks, isMeasured]);

  // Client-Druckweg: sobald Umbrüche berechnet und Fonts geladen sind, den
  // nativen Browser-Druckdialog öffnen ("Als PDF speichern"). Ersetzt den
  // serverseitigen Puppeteer-Druck — derselbe Render, nur im Browser der
  // Nutzerin/des Nutzers statt in einer Netlify Function.
  useEffect(() => {
    if (!autoPrint || !isMeasured || printTriggeredRef.current) return;
    printTriggeredRef.current = true;
    const t = window.setTimeout(() => window.print(), 150);
    return () => window.clearTimeout(t);
  }, [autoPrint, isMeasured]);

  if (loadError) {
    return (
      <div data-export-error="true" style={{ padding: 24, fontFamily: 'monospace', color: '#b91c1c' }}>
        Export-Fehler: {loadError}
      </div>
    );
  }

  if (!data) {
    return <div style={{ padding: 24 }}>Lade …</div>;
  }

  const pageBg = TEMPLATE_PAGE_BG[data.template] ?? '#ffffff';
  const minHeightPx = breaks ? templateMinHeight(containerHeightFor(breaks, PAGE_HEIGHT_PX), data.density) : undefined;

  return (
    <>
      <style>{PDF_RENDER_STYLES_CSS}</style>
      <style>{`
        html, body { margin: 0; padding: 0; background: ${pageBg}; }
        @page { size: A4; margin: 0; }
        /* Hintergrundfarben/Akzente IMMER drucken – sonst lässt Chrome/Edge sie
           weg, solange "Hintergrundgrafiken" im Druckdialog nicht angehakt ist. */
        html, body, [data-pdf-root], [data-pdf-root] * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        /* Editor-Steuerelemente ("+ Bullet", "Station löschen", Pfeile …) dürfen
           nie im PDF landen. Die höhere Spezifität ist nötig: pdfRenderStyles
           setzt "[data-break-item] > .pdf-hidden { display: flex !important }"
           und blendet sie beim Hover ein – das schlug bisher bis ins PDF durch. */
        html body [data-pdf-root] .pdf-hidden,
        html body [data-pdf-root] [data-pdf-hidden],
        html body [data-pdf-root] [data-break-item] > .pdf-hidden,
        html body [data-pdf-root] [data-spacer-id] > .pdf-hidden,
        html body [data-pdf-root] [data-inline-control] .pdf-hidden,
        html body [data-pdf-root] [data-inline-control]:not(:has(> :not(.pdf-hidden))),
        html body [data-pdf-root] button {
          display: none !important;
        }
        /* Leere Editor-Felder dürfen im PDF keine Platzhalter-Texte oder weißen
           Leerflächen erzeugen (z. B. leere Beschreibung bei Stipendien/Zertifikaten). */
        html body [data-pdf-root] [data-placeholder]:empty::before { content: none !important; }
        html body [data-pdf-root] [contenteditable]:empty { display: none !important; }
        [data-pdf-root] { overflow-wrap: break-word; }

        /* Unsichtbarer Mess-Render – wird nie gedruckt */
        [data-measure-root] { position: absolute; left: -20000px; top: 0; }
        @media print { [data-measure-root] { display: none !important; } }

        /* A4-Blätter – identisch zur Live-Editor-Vorschau: jedes Blatt zeigt den
           Ausschnitt cuts[i] … cuts[i+1] desselben Renders. Abgeschnittener Text
           landet nachweislich NICHT im Text-Layer des PDFs (ATS-sicher). */
        .pdf-page {
          position: relative;
          width: 794px;
          height: ${PAGE_HEIGHT_PX}px;
          overflow: hidden;
          background: ${pageBg};
          break-after: page;
        }
        .pdf-page:last-child { break-after: auto; }
        /* Der Inhalt eines Blatts ist bereits fertig aufgeteilt: Der Drucker darf
           darin nichts mehr verschieben oder umbrechen. */
        .pdf-page { break-inside: avoid; contain: layout paint; }
        .pdf-page * { break-inside: auto !important; break-before: auto !important; break-after: auto !important; }
      `}</style>

      <div ref={measureRef} data-pdf-root data-measure-root lang="de" style={{ width: '794px', backgroundColor: pageBg }}>
        {renderTemplate()}
      </div>

      {breaks && (
        <div ref={pagesRef} data-pdf-root lang="de">
          {breaks.cuts.map((cut, i) => (
            <div key={i} className="pdf-page">
              {/* Wie im Editor: Nicht-letzte Blätter enden exakt am Schnitt,
                  damit nichts von der Folgeseite doppelt erscheint. */}
              <div
                style={{
                  position: 'relative',
                  width: '794px',
                  height: `${i === breaks.cuts.length - 1 ? PAGE_HEIGHT_PX : Math.min(PAGE_HEIGHT_PX, pageSliceHeight(breaks, i))}px`,
                  overflow: 'hidden',
                }}
              >
                <div data-page-copy style={{ position: 'absolute', top: `${-cut}px`, left: 0, width: '794px' }}>
                  {renderTemplate(minHeightPx)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Von der Netlify-Function abgewartet, bevor page.pdf() aufgerufen wird. */}
      {isMeasured && <div data-export-ready="true" style={{ display: 'none' }} />}
    </>
  );
}

export default CvExportRenderPage;