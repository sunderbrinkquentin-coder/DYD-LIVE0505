import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { computeBreakPoints, PAGE_HEIGHT_PX } from '../components/cv-templates/breakEngine';
import { CHIP_MAX_FONT_PX } from '../components/cv-templates/tokens';

export interface PDFExportOptions {
  filename?: string;
  quality?: number;
  scale?: number;
  /**
   * Seiten-Hintergrundfarbe — muss mit der Root-Hintergrundfarbe des gewählten
   * Templates übereinstimmen (z. B. Modern: '#f0faf8'). Bleibt eine Seite nicht
   * bis zum Rand gefüllt (üblich bei kurzen CVs oder der letzten Seite), bleibt
   * der Rest in dieser Farbe sichtbar statt in einem hartcodierten Weiß, das
   * bei Templates mit farbigem Hintergrund als sichtbarer Bruch auffällt.
   * Default '#ffffff' für Templates mit weißem Hintergrund.
   */
  backgroundColor?: string;
}

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_WIDTH_PX = 794;

const PLACEHOLDERS = new Set([
  'position / rolle', 'unternehmen', 'mm/jjjj', 'projekttitel',
  'deine rolle', 'abschluss', 'institution', 'zeitraum',
  'aufgaben und wichtigste erfolge', 'aufgabe / ergebnis', 'beschreibung / aufgaben',
  'kurz aufgaben und erfolge beschreiben', 'schwerpunkte / noten / themen',
  'zielposition / profil', 'vollständiger name', 'dein name', 'berufsbezeichnung',
  'telefon', 'e-mail', 'linkedin', 'niveau', 'sprache',
  'kurzprofil: wichtige erfahrungen, stärken und dein mehrwert für die rolle.',
  'skill', 'stärke', 'mon/jjjj',
]);

function isPlaceholder(v: string): boolean {
  return v.trim() === '' || PLACEHOLDERS.has(v.trim().toLowerCase());
}

/**
 * Schriften laden, BEVOR gemessen wird.
 *
 * Wichtig: Diese Liste muss zur `FONT_STACK`-Konstante in tokens.ts passen.
 * Bekommt ein Template eine neue Schriftfamilie, gehört sie hierher — sonst
 * misst html2canvas Fallback-Zeilenhöhen und der Export weicht von der
 * Vorschau ab. Das war einer der Gründe, warum das Kreativ-Template im PDF
 * eine andere Schrift zeigte als im Editor.
 */
async function waitForFonts(): Promise<void> {
  const fonts = (document as any).fonts;
  if (fonts) {
    await fonts.ready;
    const faces = [
      '400 12px Inter', '500 12px Inter', '600 12px Inter',
      '700 12px Inter', '800 12px Inter',
    ];
    await Promise.all(faces.map((f: string) => fonts.load(f).catch(() => {})));
    await fonts.ready;
  }
  await new Promise<void>(r =>
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 200)))
  );
}

async function toBase64(src: string): Promise<string> {
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) return src;
  try {
    const r = await fetch(src, { mode: 'cors', cache: 'no-cache' });
    if (!r.ok) return src;
    const b = await r.blob();
    return await new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.onerror = rej;
      fr.readAsDataURL(b);
    });
  } catch { return src; }
}

// ─── Style baking ─────────────────────────────────────────────────────────────
// Live- und Klon-Baum parallel durchlaufen und jeden Computed Style inline
// schreiben. Der Klon wird dadurch vollständig eigenständig — keine CSS-Klassen
// mehr nötig, was html2canvas' Rendering deterministisch macht.

const INLINE_TAGS = new Set(['span', 'a', 'strong', 'em', 'b', 'i', 'label', 'small', 'code']);

function bakeComputedStyles(liveEl: HTMLElement, cloneEl: HTMLElement): void {
  const tag = liveEl.tagName.toLowerCase();
  const cs = window.getComputedStyle(liveEl);

  // Position — fixed/sticky auf relative umschreiben, damit Off-Screen-Layout stimmt.
  const pos = cs.position;
  cloneEl.style.position = (pos === 'fixed' || pos === 'sticky') ? 'relative' : pos;
  cloneEl.style.zIndex = cs.zIndex;

  // ── SVG-Wurzel ────────────────────────────────────────────────────────────
  if (tag === 'svg') {
    const r = liveEl.getBoundingClientRect();
    cloneEl.style.width = `${r.width}px`;
    cloneEl.style.height = `${r.height}px`;
    cloneEl.style.minWidth = `${r.width}px`;
    cloneEl.style.minHeight = `${r.height}px`;
    cloneEl.style.flexShrink = '0';
    cloneEl.style.display = 'inline-block';
    cloneEl.style.verticalAlign = 'middle';
    cloneEl.style.overflow = 'visible';
    cloneEl.style.transition = 'none';
    cloneEl.style.animation = 'none';
    return;
  }

  // SVG-Kinder (path, circle, …) nutzen Attribute, kein CSS. Nicht anfassen.
  if (liveEl.closest('svg')) return;

  // Typografie
  cloneEl.style.fontFamily = cs.fontFamily;
  cloneEl.style.fontSize = cs.fontSize;
  cloneEl.style.fontWeight = cs.fontWeight;
  cloneEl.style.fontStyle = cs.fontStyle;
  cloneEl.style.lineHeight = cs.lineHeight;
  cloneEl.style.letterSpacing = cs.letterSpacing;
  cloneEl.style.color = cs.color;
  cloneEl.style.textAlign = cs.textAlign;
  cloneEl.style.textDecoration = cs.textDecoration;
  cloneEl.style.textTransform = cs.textTransform;
  cloneEl.style.whiteSpace = cs.whiteSpace;
  cloneEl.style.wordBreak = cs.wordBreak;
  cloneEl.style.verticalAlign = cs.verticalAlign;

  // Hintergrund & Rahmen
  cloneEl.style.backgroundColor = cs.backgroundColor;
  if (cs.backgroundImage && cs.backgroundImage !== 'none') {
    cloneEl.style.backgroundImage = cs.backgroundImage;
    cloneEl.style.backgroundSize = cs.backgroundSize;
    cloneEl.style.backgroundPosition = cs.backgroundPosition;
    cloneEl.style.backgroundRepeat = cs.backgroundRepeat;
  }
  cloneEl.style.borderTopWidth = cs.borderTopWidth;
  cloneEl.style.borderTopStyle = cs.borderTopStyle;
  cloneEl.style.borderTopColor = cs.borderTopColor;
  cloneEl.style.borderRightWidth = cs.borderRightWidth;
  cloneEl.style.borderRightStyle = cs.borderRightStyle;
  cloneEl.style.borderRightColor = cs.borderRightColor;
  cloneEl.style.borderBottomWidth = cs.borderBottomWidth;
  cloneEl.style.borderBottomStyle = cs.borderBottomStyle;
  cloneEl.style.borderBottomColor = cs.borderBottomColor;
  cloneEl.style.borderLeftWidth = cs.borderLeftWidth;
  cloneEl.style.borderLeftStyle = cs.borderLeftStyle;
  cloneEl.style.borderLeftColor = cs.borderLeftColor;
  cloneEl.style.borderRadius = cs.borderRadius;

  // Box-Modell
  cloneEl.style.boxSizing = cs.boxSizing;
  cloneEl.style.paddingTop = cs.paddingTop;
  cloneEl.style.paddingRight = cs.paddingRight;
  cloneEl.style.paddingBottom = cs.paddingBottom;
  cloneEl.style.paddingLeft = cs.paddingLeft;
  cloneEl.style.marginTop = cs.marginTop;
  cloneEl.style.marginRight = cs.marginRight;
  cloneEl.style.marginBottom = cs.marginBottom;
  cloneEl.style.marginLeft = cs.marginLeft;

  cloneEl.style.display = cs.display;

  // Breite immer festschreiben, damit Spaltenlayouts erhalten bleiben.
  cloneEl.style.width = cs.width;
  cloneEl.style.maxWidth = cs.maxWidth;
  cloneEl.style.minWidth = cs.minWidth;

  // Höhe nur für Block-Container festschreiben. Inhaltsgetriebene Elemente
  // (Inputs, Textareas, li, p) brauchen height:auto, sonst wird Text abgeschnitten.
  const isContentSized =
    INLINE_TAGS.has(tag) ||
    tag === 'textarea' ||
    tag === 'input' ||
    tag === 'li' ||
    tag === 'p' ||
    tag === 'ul' ||
    tag === 'ol' ||
    cs.height === 'auto';

  if (isContentSized) {
    cloneEl.style.height = 'auto';
    cloneEl.style.minHeight = cs.minHeight !== 'auto' ? cs.minHeight : '0';
    cloneEl.style.maxHeight = 'none';
  } else {
    const isFlex = cs.display === 'flex' || cs.display === 'inline-flex';
    const isGrid = cs.display === 'grid' || cs.display === 'inline-grid';
    if (isFlex || isGrid) {
      cloneEl.style.height = 'auto';
      cloneEl.style.minHeight = cs.minHeight !== 'auto' && cs.minHeight !== '0px' ? cs.minHeight : '0';
    } else {
      cloneEl.style.height = cs.height;
      cloneEl.style.minHeight = cs.minHeight;
    }
    cloneEl.style.maxHeight = 'none';
  }

  // Im Klon darf nichts geclippt werden. overflow:hidden versteckt im Editor
  // nur Scrollbalken, im PDF schneidet es umbrochenen Text ab.
  cloneEl.style.overflow = 'visible';
  cloneEl.style.overflowX = 'visible';
  cloneEl.style.overflowY = 'visible';

  if (cs.display === 'flex' || cs.display === 'inline-flex') {
    cloneEl.style.flexDirection = cs.flexDirection;
    cloneEl.style.flexWrap = cs.flexWrap;
    cloneEl.style.alignItems = cs.alignItems;
    cloneEl.style.alignContent = cs.alignContent;
    cloneEl.style.justifyContent = cs.justifyContent;
    cloneEl.style.gap = cs.gap;
    cloneEl.style.rowGap = cs.rowGap;
    cloneEl.style.columnGap = cs.columnGap;
  }

  cloneEl.style.flexShrink = cs.flexShrink;
  cloneEl.style.flexGrow = cs.flexGrow;
  cloneEl.style.flexBasis = cs.flexBasis;
  cloneEl.style.alignSelf = cs.alignSelf;
  cloneEl.style.order = cs.order;

  if (cs.display === 'grid' || cs.display === 'inline-grid') {
    cloneEl.style.gridTemplateColumns = cs.gridTemplateColumns;
    cloneEl.style.gridTemplateRows = cs.gridTemplateRows;
    cloneEl.style.gap = cs.gap;
    cloneEl.style.rowGap = cs.rowGap;
    cloneEl.style.columnGap = cs.columnGap;
  }
  cloneEl.style.gridColumn = cs.gridColumn;
  cloneEl.style.gridRow = cs.gridRow;

  cloneEl.style.opacity = cs.opacity;
  cloneEl.style.visibility = cs.visibility;
  cloneEl.style.transform = cs.transform !== 'none' ? cs.transform : 'none';
  cloneEl.style.transition = 'none';
  cloneEl.style.animation = 'none';
  cloneEl.style.caretColor = 'transparent';

  // Tailwind-Klassen entfernen — alles Nötige steht jetzt inline.
  // ACHTUNG: Das passiert NACH der Klassen-basierten Entfernung in prepareClone.
  cloneEl.removeAttribute('class');
}

function bakeAll(liveRoot: HTMLElement, cloneRoot: HTMLElement): void {
  const lEls = [liveRoot, ...Array.from(liveRoot.querySelectorAll<HTMLElement>('*'))];
  const cEls = [cloneRoot, ...Array.from(cloneRoot.querySelectorAll<HTMLElement>('*'))];
  for (let i = 0; i < lEls.length && i < cEls.length; i++) {
    bakeComputedStyles(lEls[i], cEls[i]);
  }
}

// ─── Klon für die Aufnahme vorbereiten ───────────────────────────────────────

function prepareClone(clone: HTMLElement, liveRoot: HTMLElement): void {
  // Editor-Only-UI entfernen.
  //
  // FIX: Bisher wurde nur nach `[data-pdf-hidden]` (Attribut) gesucht — die
  // Templates verwenden aber `.pdf-hidden` (Klasse). Die Buttons flogen zwar
  // raus (weil auch `button` selektiert wurde), ihre Wrapper-Divs blieben mit
  // margin/padding stehen. Jetzt beides.
  //
  // Seit die Controls in der Vorschau `position: absolute` sind, trägt ihr
  // Entfernen ohnehin nichts mehr zur Höhe bei. Der Selektor bleibt trotzdem
  // korrekt — Gürtel und Hosenträger.
  clone.querySelectorAll<HTMLElement>('button, .pdf-hidden, [data-pdf-hidden]').forEach(el => el.remove());

  // Live-Werte von Inputs/Textareas sichern, BEVOR am DOM geschraubt wird.
  const liveInputs = Array.from(liveRoot.querySelectorAll<HTMLInputElement>('input'));
  const liveTAs = Array.from(liveRoot.querySelectorAll<HTMLTextAreaElement>('textarea'));
  const cloneInputs = Array.from(clone.querySelectorAll<HTMLInputElement>('input'));
  const cloneTAs = Array.from(clone.querySelectorAll<HTMLTextAreaElement>('textarea'));

  // <input> → <div>
  for (let i = 0; i < cloneInputs.length; i++) {
    const ci = cloneInputs[i];
    const val = (liveInputs[i]?.value ?? ci.value ?? '').trim();

    if (isPlaceholder(val)) {
      const row = ci.closest('[data-pdf-field-wrap]') ?? ci.closest('li');
      (row ?? ci).remove();
      continue;
    }

    const div = clone.ownerDocument.createElement('div');
    div.textContent = val;
    div.style.cssText = ci.style.cssText;
    div.style.display = 'inline';
    div.style.width = 'auto';
    div.style.minWidth = '0';
    div.style.maxWidth = '100%';
    div.style.overflow = 'visible';
    div.style.whiteSpace = 'nowrap';
    div.style.wordBreak = 'normal';

    const liveInputEl = liveInputs[i];
    const classFontSize = liveInputEl?.className?.match(/text-\[([\d.]+)px\]/)?.[1];
    const liveFontSize = liveInputEl?.style?.fontSize;
    if (classFontSize) {
      div.style.fontSize = `${classFontSize}px`;
    } else if (liveFontSize) {
      div.style.fontSize = liveFontSize;
    }
    const liveFontWeight = liveInputEl?.style?.fontWeight;
    if (liveFontWeight) div.style.fontWeight = liveFontWeight;
    const liveColor = liveInputEl?.style?.color;
    if (liveColor) div.style.color = liveColor;
    ci.parentNode?.replaceChild(div, ci);
  }

  // <textarea> → <div>
  for (let i = 0; i < cloneTAs.length; i++) {
    const ct = cloneTAs[i];
    const lt = liveTAs[i];
    const val = (lt?.value || lt?.textContent || ct.value || '').trim();

    if (val === '') {
      const row = ct.closest('[data-pdf-field-wrap]') ?? ct.closest('li');
      (row ?? ct).remove();
      continue;
    }

    const div = clone.ownerDocument.createElement('div');
    div.textContent = val;
    div.style.cssText = ct.style.cssText;
    div.style.height = 'auto';
    div.style.minHeight = '0';
    div.style.maxHeight = 'none';
    div.style.overflow = 'visible';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordBreak = 'break-word';
    div.style.resize = 'none';

    const classFontSizeTA = lt?.className?.match(/text-\[([\d.]+)px\]/)?.[1];
    if (classFontSizeTA) {
      div.style.fontSize = `${classFontSizeTA}px`;
    } else if (lt?.style?.fontSize) {
      div.style.fontSize = lt.style.fontSize;
    }
    ct.parentNode?.replaceChild(div, ct);

    let ancestor = div.parentElement;
    let depth = 0;
    while (ancestor && ancestor !== clone && depth < 6) {
      ancestor.style.height = 'auto';
      ancestor.style.minHeight = '0';
      ancestor.style.maxHeight = 'none';
      ancestor.style.overflow = 'visible';
      ancestor.style.overflowX = 'visible';
      ancestor.style.overflowY = 'visible';
      ancestor = ancestor.parentElement;
      depth++;
    }
  }

  // contentEditable-Felder
  //
  // FIX (Skills-Chips im PDF komplett zerschossen — leere Kästen, abgeschnittener
  // Text, "Geister"-Grafiken an falscher Stelle): dieser Block ordnet Klon- und
  // Live-Feldern dasselbe Element NUR über ihren INDEX in der jeweiligen
  // querySelectorAll-Liste zu ("das N-te contentEditable im Klon entspricht dem
  // N-ten im Original"). `[contenteditable]` als Selektor trifft aber JEDES
  // Element mit dem Attribut, UNABHÄNGIG von seinem Wert — also auch
  // `contentEditable={false}` (rendert als `contenteditable="false"`), wie es
  // SectionDragHandle/ItemDragHandle in EditableText.tsx auf Griff und den
  // beiden Auf/Ab-Pfeilen setzen (drei Stück pro Verschiebe-Control). Diese drei
  // tragen zusätzlich die Klasse `.pdf-hidden` und werden weiter oben aus dem
  // KLON entfernt — aus der LIVE-Liste aber nicht, die bleibt unangetastet.
  // Damit zählt die Live-Liste pro Station/Zertifikat/Chip drei Eintraege MEHR
  // als die Klon-Liste, und ab dem ERSTEN Vorkommen verschieben sich alle
  // nachfolgenden Indizes gegeneinander — jedes Feld ab dort wird mit dem
  // FALSCHEN Live-Element abgeglichen. Bei den Chips (die ihre Position/Größe
  // 1:1 vom vermeintlichen Live-Partner übernehmen, siehe unten) sichtbar als
  // leere Kästen, abgeschnittener Text oder Fragmente an falscher Stelle.
  // Fix: Auswahl auf tatsächlich editierbare Elemente einschränken
  // (`contenteditable="false"` ausschließen), auf BEIDEN Seiten identisch,
  // damit die Zählung in Klon und Original wieder exakt übereinstimmt.
  const EDITABLE_SELECTOR = '[contenteditable]:not([contenteditable="false"])';
  const liveContentEditables = liveRoot.querySelectorAll<HTMLElement>(EDITABLE_SELECTOR);
  clone.querySelectorAll<HTMLElement>(EDITABLE_SELECTOR).forEach((el, idx) => {
    const liveEl = liveContentEditables[idx] as HTMLElement | undefined;
    const preservedFontSize = liveEl?.style?.fontSize || el.style.fontSize || '';
    const preservedFontWeight = liveEl?.style?.fontWeight || el.style.fontWeight || '';
    const preservedColor = liveEl?.style?.color || el.style.color || '';

    el.removeAttribute('contenteditable');
    el.setAttribute('data-placeholder', '');
    el.style.outline = 'none';
    el.style.cursor = 'default';
    el.style.caretColor = 'transparent';
    el.style.height = 'auto';
    el.style.minHeight = '0';
    el.style.maxHeight = 'none';
    el.style.overflow = 'visible';

    if (preservedFontSize) el.style.fontSize = preservedFontSize;
    if (preservedFontWeight) el.style.fontWeight = preservedFontWeight;
    if (preservedColor) el.style.color = preservedColor;

    const insideChip = el.closest('[data-chip-row]') !== null;
    if (!insideChip) {
      const text = (el.textContent ?? '').trim();
      if (isPlaceholder(text) || text === '') {
        el.textContent = '';
        const d = el.style.display || 'inline';
        // Kontaktfelder im Header sind <div><span>Icon</span><EditableText/></div>.
        // Nur das Textfeld zu verstecken ließe das Icon verwaist stehen.
        const parent = el.parentElement;
        if (
          parent &&
          parent.tagName === 'DIV' &&
          parent.children.length === 2 &&
          parent.children[1] === el &&
          parent.children[0].tagName === 'SPAN'
        ) {
          parent.style.display = 'none';
        } else if (d === 'inline' || d === 'inline-block' || d === 'inline-flex' || d === 'none') {
          el.style.display = 'none';
        }
      }
    } else {
      // Chip-Text: statt zu raten, welche display/align-Kombination html2canvas
      // ehrt, messen wir die exakte Geometrie im LIVE-Editor (der korrekt
      // rendert) und replizieren sie absolut auf dem Klon.
      const chipSpan = el.parentElement;
      const liveChipSpan = liveEl?.parentElement as HTMLElement | null | undefined;
      if (liveEl && chipSpan && liveChipSpan) {
        const rootRect = liveRoot.getBoundingClientRect();
        const K = liveRoot.offsetWidth > 0 && rootRect.width > 0 ? rootRect.width / liveRoot.offsetWidth : 1;

        const liveTextRect = liveEl.getBoundingClientRect();
        const liveChipRect = liveChipSpan.getBoundingClientRect();

        const offsetTop = (liveTextRect.top - liveChipRect.top) / K;
        const offsetLeft = (liveTextRect.left - liveChipRect.left) / K;
        const textW = liveEl.offsetWidth;
        const textH = liveEl.offsetHeight;
        const chipW = liveChipSpan.offsetWidth;
        const chipH = liveChipSpan.offsetHeight;

        if (chipW > 0 && chipH > 0 && textW > 0 && textH > 0) {
          chipSpan.style.position = 'relative';
          chipSpan.style.display = 'inline-block';
          chipSpan.style.width = `${chipW}px`;
          chipSpan.style.height = `${chipH}px`;

          el.style.position = 'absolute';
          el.style.display = 'block';
          el.style.top = `${offsetTop}px`;
          el.style.left = `${offsetLeft}px`;
          el.style.width = `${textW}px`;
          el.style.height = `${textH}px`;
          el.style.margin = '0';
          el.style.whiteSpace = 'nowrap';
          el.style.lineHeight = 'normal';
        }
      }
    }
  });

  // <img> mit object-fit → background-image-Div
  clone.querySelectorAll<HTMLImageElement>('img').forEach(img => {
    const src = img.getAttribute('src') || '';
    if (!src) { img.remove(); return; }
    const w = img.style.width;
    const h = img.style.height;
    if (!w || !h || w === 'auto' || h === 'auto') return;
    const div = clone.ownerDocument.createElement('div');
    div.style.cssText = img.style.cssText;
    div.style.backgroundImage = `url("${src}")`;
    div.style.backgroundSize = 'cover';
    div.style.backgroundPosition = 'center';
    div.style.backgroundRepeat = 'no-repeat';
    img.parentNode?.replaceChild(div, img);
  });

  // Kein Element darf im Klon seinen Inhalt clippen.
  clone.querySelectorAll<HTMLElement>(
    'li, ul, ol, p, [data-pdf-section], [data-break-item], [data-pdf-bullet-row]'
  ).forEach(el => {
    el.style.overflow = 'visible';
    el.style.overflowX = 'visible';
    el.style.overflowY = 'visible';
    el.style.height = 'auto';
    el.style.maxHeight = 'none';
  });

  // Skill-Chips: nur horizontal begrenzen, niemals vertikal clippen.
  clone.querySelectorAll<HTMLElement>('[data-chip-row]').forEach(el => {
    el.style.overflow = 'visible';
    el.style.overflowX = 'hidden';
    el.style.overflowY = 'visible';
    el.style.maxWidth = '100%';
    el.style.height = 'auto';
    el.style.minHeight = '0';
    el.style.maxHeight = 'none';
  });

  // ── Chip-Font-Guard ───────────────────────────────────────────────────────
  //
  // ALT: Diese Regel lief über `[data-pdf-section] *` UND `[data-chip-row] *`
  // und zwang JEDES Element über 13px auf 9px — also auch Positionstitel und
  // Firmennamen, sofern sie nicht h1–h4 waren. Ein "Sicherheitsnetz", das
  // reihenweise Überschriften zerstörte.
  //
  // NEU: Nur noch Chips. Dort ist der Grund real (iOS zwingt contenteditable
  // auf min. 16px), und nur dort greifen wir ein.
  clone.querySelectorAll<HTMLElement>('[data-chip-row] *').forEach(el => {
    const fs = parseFloat(el.style.fontSize);
    if (!isNaN(fs) && fs > CHIP_MAX_FONT_PX) {
      el.style.fontSize = `${CHIP_MAX_FONT_PX - 1}px`;
    }
  });

  // Container, die Listen enthalten, dürfen ebenfalls nicht clippen.
  clone.querySelectorAll<HTMLElement>('div').forEach(el => {
    if (el.querySelector('li, ul') || el.getAttribute('data-pdf-section') !== null) {
      el.style.overflow = 'visible';
      el.style.height = 'auto';
      el.style.maxHeight = 'none';
    }
  });
}

// ─── Kern-Render ─────────────────────────────────────────────────────────────

async function renderElementToPDFBlob(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<Blob> {
  const { quality = 0.95, scale = 2, backgroundColor = '#ffffff' } = options;

  await waitForFonts();

  // Bilder vorab zu base64 — html2canvas kann sonst an CORS scheitern.
  const liveImgs = Array.from(element.querySelectorAll<HTMLImageElement>('img'));
  const origSrcs = liveImgs.map(img => img.getAttribute('src') || '');
  await Promise.all(liveImgs.map(async (img, i) => {
    if (origSrcs[i] && !origSrcs[i].startsWith('data:')) {
      img.setAttribute('src', await toBase64(origSrcs[i]));
    }
  }));
  await Promise.all(liveImgs.map(img =>
    img.complete ? Promise.resolve()
      : new Promise<void>(r => { img.onload = img.onerror = () => r(); })
  ));

  await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  window.scrollTo(0, 0);

  // Bild-Maße für die img→div-Konvertierung festhalten.
  liveImgs.forEach(img => {
    const cs = window.getComputedStyle(img);
    img.setAttribute('data-pdf-w', cs.width || `${img.offsetWidth}px`);
    img.setAttribute('data-pdf-h', cs.height || `${img.offsetHeight}px`);
  });

  const clone = element.cloneNode(true) as HTMLElement;
  bakeAll(element, clone);

  liveImgs.forEach((img, i) => {
    img.setAttribute('src', origSrcs[i]);
    img.removeAttribute('data-pdf-w');
    img.removeAttribute('data-pdf-h');
  });

  const cloneImgs = Array.from(clone.querySelectorAll<HTMLImageElement>('img'));
  liveImgs.forEach((lImg, i) => {
    if (!cloneImgs[i]) return;
    cloneImgs[i].style.width = lImg.getAttribute('data-pdf-w') || cloneImgs[i].style.width;
    cloneImgs[i].style.height = lImg.getAttribute('data-pdf-h') || cloneImgs[i].style.height;
  });

  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.width = `${A4_WIDTH_PX}px`;
  clone.style.minWidth = `${A4_WIDTH_PX}px`;
  clone.style.maxWidth = `${A4_WIDTH_PX}px`;
  clone.style.height = 'auto';
  clone.style.minHeight = 'auto';
  clone.style.maxHeight = 'none';
  clone.style.overflow = 'visible';
  clone.style.transform = 'none';
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';

  document.body.appendChild(clone);
  prepareClone(clone, element);

  // Zwei Frames für den Reflow — Auto-Height-Elemente brauchen ihn.
  await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 50))));

  const cloneH = clone.scrollHeight;

  // ── Die Umbrüche kommen aus DERSELBEN Engine wie die Vorschau ─────────────
  //
  // Kein eigenes `findBreak()` mehr, kein eigenes Kandidaten-Scoring. Der Klon
  // hat dieselben Höhen wie der sichtbare Render (weil `.pdf-hidden` dort schon
  // aus dem Fluss ist), also liefert `computeBreakPoints` dieselben Zahlen.
  // Das ist die einzige Garantie, dass Editor und PDF übereinstimmen.
  const breaks = computeBreakPoints(clone);
  const { cuts, contentHeight, footerHeight, pageCount } = breaks;

  const footerEl = clone.querySelector<HTMLElement>('[data-pdf-footer]');
  const hasFooter = !!footerEl && footerHeight > 5;
  let footerTopCss = contentHeight;
  if (hasFooter && footerEl) {
    const cr = clone.getBoundingClientRect();
    footerTopCss = footerEl.getBoundingClientRect().top - cr.top;
  }

  console.log(
    `[PDF] Klon ${clone.scrollWidth}×${cloneH}px · ${pageCount} Seite(n) · Schnitte:`,
    cuts.map(c => Math.round(c))
  );

  let canvas: HTMLCanvasElement;
  try {
    canvas = await (html2canvas as any)(clone, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor,
      logging: false,
      imageTimeout: 0,
      windowWidth: A4_WIDTH_PX,
      width: A4_WIDTH_PX,
      height: cloneH,
      scrollX: 0,
      scrollY: 0,
    });
  } finally {
    document.body.removeChild(clone);
  }

  // ── Geometrie ─────────────────────────────────────────────────────────────
  const cssToCanvas = canvas.height / cloneH;
  // Eine Seite in Canvas-Pixeln. Bewusst aus PAGE_HEIGHT_PX abgeleitet und
  // nicht aus dem A4-mm-Verhältnis: die Engine rechnet in 1122px-Seiten, und
  // beide müssen dieselbe Einheit benutzen.
  const canvasPageH = Math.round(PAGE_HEIGHT_PX * cssToCanvas);

  const footerTopCanvas = Math.round(footerTopCss * cssToCanvas);
  const footerHCanvas = hasFooter ? Math.round(footerHeight * cssToCanvas) : 0;

  const pdfDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

  /**
   * Zeichnet eine PDF-Seite.
   *
   * Jede Seite ist ein volles A4-Blatt. Der Inhaltsausschnitt wird oben
   * platziert, der Footer (nur auf der letzten Seite) an der Unterkante —
   * exakt so, wie der Editor die A4-Frames darstellt. Der freie Bereich
   * darunter (falls der Inhalt die Seite nicht ausfüllt) wird mit
   * `backgroundColor` grundiert — derselben Farbe wie beim html2canvas-Capture
   * und derselben, die die Live-Vorschau für dieses Template nutzt.
   */
  const drawPage = (srcYCanvas: number, srcHCanvas: number, withFooter: boolean, isFirst: boolean) => {
    const pc = document.createElement('canvas');
    pc.width = canvas.width;
    pc.height = canvasPageH;
    const ctx = pc.getContext('2d')!;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, pc.width, pc.height);

    const clippedH = Math.min(srcHCanvas, canvasPageH);
    ctx.drawImage(canvas, 0, srcYCanvas, canvas.width, clippedH, 0, 0, canvas.width, clippedH);

    if (withFooter && footerHCanvas > 0) {
      const fy = canvasPageH - footerHCanvas;
      ctx.drawImage(canvas, 0, footerTopCanvas, canvas.width, footerHCanvas, 0, fy, canvas.width, footerHCanvas);
    }

    if (!isFirst) pdfDoc.addPage();
    pdfDoc.addImage(pc.toDataURL('image/jpeg', quality), 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, 'FAST');
  };

  for (let p = 0; p < pageCount; p++) {
    const startCss = cuts[p];
    const endCss = p + 1 < pageCount ? cuts[p + 1] : contentHeight;
    const isLast = p === pageCount - 1;

    const srcY = Math.round(startCss * cssToCanvas);
    const srcH = Math.round((endCss - startCss) * cssToCanvas);

    drawPage(srcY, srcH, isLast && hasFooter, p === 0);
    console.log(`[PDF] Seite ${p + 1}: ${Math.round(startCss)}–${Math.round(endCss)}px` + (isLast && hasFooter ? ' + Footer' : ''));
  }

  return pdfDoc.output('blob') as Blob;
}

// ─── Öffentliche API ─────────────────────────────────────────────────────────

export async function exportElementToPDF(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<void> {
  const { filename = `CV_${new Date().toISOString().split('T')[0]}.pdf` } = options;
  const blob = await renderElementToPDFBlob(element, options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export async function exportCVToPDF(
  cvRef: React.RefObject<HTMLElement>,
  personalInfo?: { name?: string },
  options?: PDFExportOptions
): Promise<void> {
  if (!cvRef.current) throw new Error('CV-Element nicht gefunden');
  const name = (personalInfo?.name || 'CV')
    .replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  await exportElementToPDF(cvRef.current, {
    ...options,
    filename: `Lebenslauf_${name}_${new Date().toISOString().split('T')[0]}.pdf`,
  });
}

export async function exportCVToPDFBlob(
  cvRef: React.RefObject<HTMLElement>,
  _personalInfo?: unknown,
  options?: PDFExportOptions
): Promise<Blob> {
  if (!cvRef.current) throw new Error('CV-Element nicht gefunden');
  return renderElementToPDFBlob(cvRef.current, options);
}

export function debugLogPDFHtml(cvRef: React.RefObject<HTMLElement> | HTMLElement | null): void {
  const el = cvRef instanceof HTMLElement ? cvRef : cvRef?.current;
  if (!el) { console.warn('[PDF Debug] Kein Element.'); return; }
  console.log('[PDF Debug]', el.offsetWidth, 'x', el.scrollHeight);
}