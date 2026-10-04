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
  const rootRef = useRef<HTMLDivElement | null>(null);
  const breaksAppliedRef = useRef(false);
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
        html body [data-pdf-root] [data-inline-control],
        html body [data-pdf-root] button {
          display: none !important;
        }
        /* Deutsche Silbentrennung statt Umbruch mitten im Wort ohne Trennstrich
           ("Wirtschaftsingenieurwese / n") */
        [data-pdf-root] {
          -webkit-hyphens: auto;
          hyphens: auto;
          overflow-wrap: break-word;
        }
        [data-break-atomic], [data-break-item] { break-inside: avoid; }
        [data-break-keep-next] { break-after: avoid; }
      `}</style>
      <div ref={rootRef} data-pdf-root lang="de" style={{ width: '794px', backgroundColor: pageBg }}>
        {renderTemplate()}
      </div>
      {/* Von der Netlify-Function abgewartet, bevor page.pdf() aufgerufen wird. */}
      {isMeasured && <div data-export-ready="true" style={{ display: 'none' }} />}
    </>
  );
}

export default CvExportRenderPage;