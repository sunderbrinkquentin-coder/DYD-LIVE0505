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
// Kommentare + supabase/migrations/20260905_add_cv_export_token.sql). Die
// Supabase-Abfrage unten filtert ausdrücklich nach `id` UND `export_token`
// zusammen — die RLS-Policy allein reicht nicht als Schutz, siehe Migration.
//
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { supabase } from '../lib/supabase';
import { PDF_RENDER_STYLES_CSS } from '../components/cv-templates/pdfRenderStyles';
import {
  applyForcedPageBreaks,
  computeBreakPoints,
  containerHeightFor,
  PAGE_HEIGHT_PX,
} from '../components/cv-templates/breakEngine';
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

interface LoadedCv {
  personalInfo: PersonalInfo;
  summary?: string;
  sections: EditorSection[];
  photoUrl?: string;
  photoPosition?: { x: number; y: number };
  template: CVTemplateType;
}

export function CvExportRenderPage() {
  const { cvId } = useParams<{ cvId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [data, setData] = useState<LoadedCv | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const breaksAppliedRef = useRef(false);
  const [isMeasured, setIsMeasured] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!cvId || !token) {
        setLoadError('cvId oder token fehlt in der URL.');
        return;
      }

      // WICHTIG: `.eq('export_token', token)` ist Teil des Sicherheitsmodells,
      // nicht nur ein Komfort-Filter — siehe Kommentar am Dateikopf und die
      // RLS-Policy in der Migration. Nicht entfernen, auch wenn die Zeile
      // über `id` allein schon eindeutig wäre.
      const { data: row, error } = await supabase
        .from('stored_cvs')
        .select('cv_data, selected_template, export_token_expires_at')
        .eq('id', cvId)
        .eq('export_token', token)
        .maybeSingle();

      if (cancelled) return;

      if (error || !row) {
        setLoadError(`CV konnte nicht geladen werden (ungültiges oder abgelaufenes Token). ${error?.message ?? ''}`);
        return;
      }

      const expiresAt = row.export_token_expires_at ? new Date(row.export_token_expires_at).getTime() : 0;
      if (!expiresAt || expiresAt < Date.now()) {
        setLoadError('Export-Token ist abgelaufen.');
        return;
      }

      const cvData = (row.cv_data ?? {}) as Record<string, unknown>;
      const rawTemplate = (row as { selected_template?: string }).selected_template
        ?? (cvData._selectedTemplate as string | undefined);
      const template: CVTemplateType = VALID_TEMPLATES.includes(rawTemplate as CVTemplateType)
        ? (rawTemplate as CVTemplateType)
        : 'modern';

      setData({
        personalInfo: (cvData.personalInfo ?? {}) as PersonalInfo,
        summary: cvData.summary as string | undefined,
        sections: (cvData.sections ?? []) as EditorSection[],
        photoUrl: cvData.photoUrl as string | undefined,
        photoPosition: cvData.photoPosition as { x: number; y: number } | undefined,
        template,
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [cvId, token]);

  const templateProps: CVTemplateProps | null = useMemo(() => {
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

  const renderTemplate = () => {
    if (!templateProps || !data) return null;
    switch (data.template) {
      case 'modern': return <ModernCVTemplate {...templateProps} />;
      case 'classic': return <ClassicCVTemplate {...templateProps} />;
      case 'minimal': return <MinimalCVTemplate {...templateProps} />;
      case 'creative': return <CreativeCVTemplate {...templateProps} />;
      case 'professional': return <ProfessionalCVTemplate {...templateProps} />;
      default: return null;
    }
  };

  // Sobald Inhalt da ist: auf Fonts warten, EINMAL messen, Umbrüche als
  // echte CSS-break-before setzen, dann Bereit-Flag setzen. Kein
  // ResizeObserver/Debounce nötig wie in useBreakPoints — hier tippt
  // niemand, der Inhalt ändert sich nach dem ersten Render nicht mehr.
  useEffect(() => {
    if (!data || breaksAppliedRef.current) return;
    let cancelled = false;

    const run = async () => {
      const fonts = (document as unknown as { fonts?: FontFaceSet }).fonts;
      if (fonts?.ready) await fonts.ready;
      // Zwei Frames warten, damit React committet und der Browser das
      // Layout auflöst, plus ein kurzer Sicherheitsabstand fürs Foto.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 200))));
      if (cancelled) return;

      const root = rootRef.current;
      if (!root || root.scrollHeight < 50) return;

      const result = computeBreakPoints(root);
      applyForcedPageBreaks(root, result);
      root.style.minHeight = `${containerHeightFor(result, PAGE_HEIGHT_PX)}px`;

      breaksAppliedRef.current = true;
      setIsMeasured(true);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [data]);

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

  return (
    <>
      <style>{PDF_RENDER_STYLES_CSS}</style>
      {/* Puppeteer druckt im Print-Media-Type — .pdf-hidden hier zusätzlich
          hart auf display:none, weil in diesem Kontext (kein zugeschnittener
          A4-Frame, echter Fluss über mehrere Seiten) die Hover-Opacity-Logik
          aus pdfRenderStyles.ts nicht greifen muss. */}
      <style>{`
        html, body { margin: 0; padding: 0; background: ${pageBg}; }
        @page { size: A4; margin: 0; }
        .pdf-hidden { display: none !important; }
        [data-break-atomic], [data-break-item] { break-inside: avoid; }
        [data-break-keep-next] { break-after: avoid; }
      `}</style>
      <div ref={rootRef} data-pdf-root style={{ width: '794px', backgroundColor: pageBg }}>
        {renderTemplate()}
      </div>
      {/* Von der Netlify-Function abgewartet, bevor page.pdf() aufgerufen wird. */}
      {isMeasured && <div data-export-ready="true" style={{ display: 'none' }} />}
    </>
  );
}

export default CvExportRenderPage;
